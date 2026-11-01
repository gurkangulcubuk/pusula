'use strict';
/* PUSULA köprüsü (Cloudflare Worker) — istemci tarafı
   - Bağlıysa Google oturumu sessizce yenilenir (saatlik "dokun" gerekmez)
   - Bu cihazda bildirim açıksa: hatırlatmalar ve yeni mail uygulama kapalıyken de gelir (Web Push)
   Bağlantı anahtarı ayarlarla eşitlenir; diğer cihaz Drive'a bir kez bağlanınca o da sessiz olur. */
const BRIDGE_DEFAULT = 'https://pusula-kopru.gurkangulcubuk.workers.dev';
const Bridge = {
  url() { const b = settings().bridge || {}; return (b.url || lsGet('pusula.bridgeUrl', '') || BRIDGE_DEFAULT).replace(/\/+$/, ''); },
  key() { const b = settings().bridge; if (b === null) return lsGet('pusula.bridgeNew', '') === '1' ? lsGet('pusula.bridgeKey', '') : ''; return (b && b.key) || lsGet('pusula.bridgeKey', ''); }, // null: başka cihazda kaldırıldı
  linked() { return !!(this.url() && this.key()); },
  pushOn() { return this.linked() && lsGet('pusula.bpush', '') === '1' && 'Notification' in window && Notification.permission === 'granted'; },
  status: '', busyTok: null,
  async post(path, body) {
    const r = await fetch(this.url() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ key: this.key() }, body || {})) });
    const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error(j.error || ('HTTP ' + r.status)); e.code = j.error; throw e; } return j;
  },
  async token() { // tek seferde bir istek
    if (this.busyTok) return this.busyTok;
    this.busyTok = (async () => {
      try {
        const j = await this.post('/token');
        Drive.token = j.access_token; Drive.exp = j.expires_at; Drive.granted = j.scope || ''; Drive.nagged = false;
        lsSet('pusula.gtok', JSON.stringify({ v: Drive.token, exp: Drive.exp, s: Drive.granted }));
        if (j.email && !lsGet('pusula.gemail', '')) lsSet('pusula.gemail', j.email);
        this.status = 'ok'; return true;
      } catch (e) { this.status = e.code === 'revoked' || e.code === 'unlinked' ? 'revoked' : 'error'; throw e; }
      finally { setTimeout(() => { this.busyTok = null; }, 0); }
    })();
    return this.busyTok;
  },
  async setLink(url, key) {
    lsSet('pusula.bridgeUrl', url || ''); lsSet('pusula.bridgeKey', key || '');
    const st = settings(); st.bridge = key ? { url, key } : null; await save(st, { silent: true });
  },
  connect() {
    const u = this.url() || (fval('bridgeUrl') || '').trim().replace(/\/+$/, '');
    if (!/^https:\/\/[^/]+\.[^/]+/.test(u)) return toast(Lx('Köprü adresi geçersiz', 'Invalid bridge address'));
    lsSet('pusula.bridgeUrl', u);
    const hint = lsGet('pusula.gemail', '');
    location.href = u + '/auth/start' + (hint ? '?hint=' + encodeURIComponent(hint) : '');
  },
  /* hatırlatmalar: önümüzdeki 7 gün; Google Takvim'e yazılanlar zaten Google'dan bildirilir, onlar gönderilmez */
  upcoming() {
    const now = Date.now(), lim = now + 7 * 86400000, out = [], t0 = today();
    const at = (d, hm) => { const p = parseYmd(d); p.setHours(+hm.slice(0, 2), +hm.slice(3, 5), 0, 0); return p.getTime(); };
    const add = (id, title, d, hm, mins, kind) => (mins || []).forEach(m => {
      const start = at(d, hm), fire = start - m * 60000; if (fire <= now + 60000 || fire > lim) return;
      const key = id + '|' + d + '|' + hm + '|' + m, r = { key, title, d, hm, m, start, kind };
      out.push({ at: fire, tag: key, title: 'PUSULA · ' + title, body: (m ? Lx(m >= 60 ? Math.round(m / 60) + ' saat sonra · ' : m + ' dk sonra · ', 'In ' + (m >= 60 ? Math.round(m / 60) + ' h · ' : m + ' min · ')) : Lx('Şimdi · ', 'Now · ')) + hm, data: { rem: r }, actions: typeof remActions === 'function' ? remActions(r) : [] });
    });
    for (let i = 0; i <= 7; i++) {
      const d = addDays(t0, i);
      eventsOn(d).forEach(e => { if (!e.allDay && e.start) add(e.id, e.title, d, e.start, e.remind, 'ev'); });
      list('routine').forEach(r => { if (r.time && !r.gev && routineOn(r, d)) add(r.id, r.title, d, r.time, r.remind, 'rt'); });
      list('task').forEach(t => { if (!t.done && !t.gev && t.due === d && t.time) add(t.id, t.title, d, t.time, t.remind, 'task'); });
      if (typeof regs === 'function') regs().forEach(r => { if (r.time && !r.paused && !r.gev && r.next === d) add(r.id, r.title + ' · ' + fmtTL(r.amount), d, r.time, r.remind, 'pay'); });
    }
    return out.sort((a, b) => a.at - b.at);
  },
  prefs() { const m = typeof Mail !== 'undefined' && Mail.on(); return { rem: true, mail: !!(m && typeof gopt === 'function' && gopt('notify')), mailAll: !!(m && typeof gopt === 'function' && gopt('notifyAll')) }; },
  async syncState(force) { // yalnız değişince yaz (Cloudflare ücretsiz yazma sınırı)
    if (!this.pushOn() || !navigator.onLine) return;
    const rems = this.upcoming(), prefs = this.prefs();
    const h = JSON.stringify([rems.map(r => r.at + r.tag + r.title), prefs]), day = today();
    if (!force && h === lsGet('pusula.bstate', '') && lsGet('pusula.bstateDay', '') === day) return;
    try { await this.post('/state', { dev: DEVID, rems, prefs }); lsSet('pusula.bstate', h); lsSet('pusula.bstateDay', day); } catch (e) { console.warn(e); }
  },
  async enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return toast(Lx('Bu tarayıcı arka plan bildirimini desteklemiyor', 'This browser does not support push'));
    const p = await Notification.requestPermission(); if (p !== 'granted') return toast(Lx('Bildirim izni verilmedi', 'Notification permission denied'));
    try {
      const reg = await navigator.serviceWorker.ready, v = await (await fetch(this.url() + '/vapid')).json();
      const raw = atob(v.key.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((v.key.length + 3) % 4)), k = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) k[i] = raw.charCodeAt(i);
      let sub = await reg.pushManager.getSubscription();
      if (sub) { const cur = sub.options && sub.options.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null; if (!cur || cur.join() !== k.join()) { await sub.unsubscribe(); sub = null; } }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: k });
      await this.post('/state', { dev: DEVID, sub: sub.toJSON(), rems: this.upcoming(), prefs: this.prefs() });
      lsSet('pusula.bpush', '1'); lsSet('pusula.bstate', ''); toast(Lx('Bu cihazda arka plan bildirimleri açık', 'Background notifications on for this device'));
    } catch (e) { console.warn(e); toast(Lx('Bildirim açılamadı: ', 'Could not enable: ') + e.message); }
  },
  async disablePush() {
    try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) { await this.post('/state', { unsub: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); } } catch (e) { console.warn(e); }
    lsSet('pusula.bpush', '');
  },
  async unlink() {
    if (!ask(Lx('Köprü bağlantısı kaldırılsın mı? (Tüm cihazlarda)', 'Remove the bridge link? (All devices)'))) return;
    await this.disablePush(); try { await this.post('/unlink'); } catch (e) { /* yine de yerelde kaldır */ }
    await this.setLink(this.url(), ''); this.status = ''; bridgeRefresh();
  }
};

/* Google'dan dönüş: #bridge=<anahtar> (Chrome uygulama yerine sekmede açtıysa da depolama ortak, uygulama görünce alır) */
(function bridgeReturn() {
  const m = /[#&]bridge=([A-Za-z0-9_-]{30,60})/.exec(location.hash), er = /[#&]bridge-error=([^&]*)/.exec(location.hash);
  if (m) { lsSet('pusula.bridgeKey', m[1]); lsSet('pusula.bridgeNew', '1'); }
  if (er) lsSet('pusula.bridgeErr', decodeURIComponent(er[1]));
  if (m || er) history.replaceState(history.state, '', location.pathname + location.search);
})();
async function bridgeAdopt() { // yerelde yeni anahtar var ama ayarlarda yoksa ayarlara yaz (eşitlensin)
  if (!S.items.size) return;
  const err = lsGet('pusula.bridgeErr', ''); if (err) { lsSet('pusula.bridgeErr', ''); toast(Lx('Köprü bağlanamadı: ', 'Bridge link failed: ') + err, null, 8000); }
  const k = lsGet('pusula.bridgeKey', ''), b = settings().bridge || {};
  if (lsGet('pusula.bridgeNew', '') === '1' && k) {
    lsSet('pusula.bridgeNew', ''); await Bridge.setLink(Bridge.url(), k);
    try { await Bridge.token(); toast(Lx('Köprü bağlandı ✓ Google oturumu artık kendiliğinden yenilenir', 'Bridge linked ✓')); gSync(false); } catch (e) { toast(e.message); }
    bridgeRefresh();
  } else if (b.key && b.key !== k) { lsSet('pusula.bridgeKey', b.key); lsSet('pusula.bridgeUrl', b.url || ''); }
}

/* Google oturumu: önce köprü, olmazsa eski yol */
const _bridgeReqTok = Drive.requestToken.bind(Drive);
Drive.requestToken = async function (prompt, extra) {
  if (Bridge.linked() && !prompt && navigator.onLine) {
    try { await Bridge.token(); if (gScopes(extra).split(' ').every(s => Drive.tokenOk(s))) return; } catch (e) { console.warn(e); }
  }
  return _bridgeReqTok(prompt, extra);
};
const _bridgeGSync = gSync;
window.gSync = async function (interactive) {
  if (Bridge.linked() && navigator.onLine && gNeedsToken()) { try { await Bridge.token(); } catch (e) { /* aşağıdaki yol */ } }
  return _bridgeGSync(interactive);
};
setInterval(() => { // süresi bitmeden sessizce yenile
  if (!Bridge.linked() || !navigator.onLine || document.hidden) return;
  if (!Drive.token || Drive.exp - Date.now() < 6 * 60000) Bridge.token().catch(() => {});
  Bridge.syncState();
}, 60000);
document.addEventListener('visibilitychange', () => { if (document.hidden) Bridge.syncState(); else bridgeAdopt(); });
window.addEventListener('storage', e => { if (e.key === 'pusula.bridgeNew' && e.newValue === '1') bridgeAdopt(); });
window.addEventListener('load', () => setTimeout(() => { bridgeAdopt(); Bridge.syncState(); }, 1500));

/* Köprü bildirimleri açıkken uygulamanın kendi mail bildirimi susar (çift bildirim olmasın); push görünürken toast olur */
if (typeof gmNotify === 'function') { const _gmN = gmNotify; window.gmNotify = function (metas, n) { if (Bridge.pushOn() && Bridge.prefs().mail) return; return _gmN(metas, n); }; }
if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => {
  const d = e.data || {}; if (d.pusula !== 'push' || !d.msg) return; const m = d.msg;
  if (m.kind === 'mail') toast(m.title + ' · ' + (m.body || ''), { label: tr('Aç'), fn: () => gmOpenFromNotice((m.data && m.data.mail) || '') }, 8000);
  else if (m.kind !== 'rem') toast(m.title + (m.body ? ' · ' + m.body : ''));
});

/* ----- Ayarlar: Google Drive sayfasının altında ----- */
function bridgeHtml() {
  const L = Bridge.linked(), st = Bridge.status;
  const dot = !L ? '' : st === 'revoked' ? 'error' : st === 'error' ? 'syncing' : 'ok';
  const sub = !L ? Lx('Google oturumunu kalıcı yapar; hatırlatma ve yeni mail bildirimi uygulama kapalıyken de gelir', 'Keeps Google signed in; reminders and new mail notify even when the app is closed')
    : st === 'revoked' ? Lx('Google izni geri alınmış — yeniden bağla', 'Google access revoked — link again') : Lx('Bağlı · oturum kendiliğinden yenileniyor', 'Linked · session renews itself');
  let h = '<div class="set-group" id="bridgeBox" style="margin-top:14px"><div class="set-row"><div class="grow"><div>' + Lx('PUSULA köprüsü', 'PUSULA bridge') + '</div><div class="sub"><span class="status-dot ' + dot + '"></span>' + esc(sub) + '</div></div></div>';
  if (!L) {
    if (!Bridge.url()) h += '<div class="set-row"><input class="input" id="bridgeUrl" name="bridgeUrl" placeholder="https://pusula-kopru….workers.dev" autocomplete="off"></div>';
    h += '<div class="set-row"><button class="btn primary block" data-act="bridge-connect">' + Lx('Köprüye bağlan', 'Link bridge') + '</button></div>';
  } else {
    const on = Bridge.pushOn();
    h += '<div class="set-row click" data-act="bridge-push"><div class="grow"><div>' + Lx('Bu cihazda arka plan bildirimi', 'Background notifications on this device') + '</div><div class="sub">' + Lx('Hatırlatmalar' + (Bridge.prefs().mail ? ' ve yeni mail' : ''), 'Reminders' + (Bridge.prefs().mail ? ' and new mail' : '')) + '</div></div><span class="switch' + (on ? ' on' : '') + '"></span></div>';
    if (on) h += '<div class="set-row click" data-act="bridge-test"><div class="grow">' + Lx('Deneme bildirimi gönder', 'Send a test notification') + '</div></div>';
    if (st === 'revoked') h += '<div class="set-row"><button class="btn primary block" data-act="bridge-connect">' + Lx('Yeniden bağla', 'Link again') + '</button></div>';
    h += '<div class="set-row click danger" data-act="bridge-unlink"><div class="grow">' + Lx('Köprü bağlantısını kaldır', 'Remove bridge link') + '</div></div>';
  }
  return h + '</div>';
}
function bridgeRefresh() { const b = $('#bridgeBox'); if (b) { b.outerHTML = bridgeHtml(); translateTree($('#bridgeBox')); } }
const _bridgeOpenDrive = openDrive;
window.openDrive = function () {
  _bridgeOpenDrive();
  if (!Drive.on()) return;
  const body = $('#sheetRoot .sheet-body'); if (body) body.insertAdjacentHTML('beforeend', bridgeHtml());
  if (Bridge.linked() && !Bridge.status && navigator.onLine) Bridge.token().then(bridgeRefresh, bridgeRefresh);
};
Object.assign(ACTIONS, {
  'bridge-connect': () => Bridge.connect(),
  'bridge-push': async () => { if (Bridge.pushOn()) await Bridge.disablePush(); else await Bridge.enablePush(); bridgeRefresh(); },
  'bridge-test': async () => { try { const j = await Bridge.post('/test', { text: Lx('Köprü çalışıyor ✓ Uygulama kapalıyken de böyle gelecek', 'Bridge works ✓') }); if (!j.subs) toast(Lx('Kayıtlı cihaz yok', 'No device registered')); } catch (e) { toast(e.message); } },
  'bridge-unlink': () => Bridge.unlink()
});
