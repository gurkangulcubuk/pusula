'use strict';
/* PUSULA — Posta (Gmail)
   Mailler cihaza ya da Drive yedeğine kaydedilmez; her açılışta Gmail'den okunur.
   Ayarlar'daki özellik anahtarları (settings.gmail) eşitlenir; Gmail bağlantısı (DB meta 'gmail') cihaza özeldir. */
const GM = 'https://gmail.googleapis.com/gmail/v1/users/me';
const GM_MODIFY = 'https://www.googleapis.com/auth/gmail.modify';
const GM_SEND = 'https://www.googleapis.com/auth/gmail.send';
const GM_FILTER = 'https://www.googleapis.com/auth/gmail.settings.basic';
const GM_OPTS = {
  inbox: [true, 'Gelen kutusu', 'Son mailleri gör; arşivle, çöpe at, yıldızla, göreve çevir, Gmail’de aç'],
  subs: [true, 'Abonelikler', 'Sık mail atan gönderenler; abonelikten çık, eski maillerini toplu arşivle ya da çöpe at'],
  clean: [true, 'Otomatik temizlik', 'Seçtiğin gönderenlerin gelecek mailleri otomatik arşivlenir'],
  bell: [true, 'Zilde önemli mail sayısı', 'Okunmamış önemli mailler uyarılarda görünür'],
  search: [true, 'Mailde arama', ''],
  cats: [true, 'Kategoriler', 'Birincil, Promosyonlar, Sosyal, Güncellemeler'],
  toEvent: [true, 'Maili takvim etkinliğine çevir', ''],
  toNote: [true, 'Maili nota çevir', ''],
  todayCard: [true, 'Bugün ekranında posta kartı', 'Okunmamış mail sayısı ve son mailler'],
  quick: [true, 'Hazır kısa cevaplar', 'Cevap verme açıkken görünür'],
  promo: [true, 'Promosyonlarda toplu temizlik', 'Hepsini okundu yap, hepsini arşivle'],
  reply: [false, 'Cevap verme', 'Açınca Google bir kez mail gönderme izni ister']
};
const GM_MAIN = ['inbox', 'subs', 'clean', 'bell'];
const GM_EXTRA = ['search', 'cats', 'toEvent', 'toNote', 'todayCard', 'quick', 'promo'];
const GM_CATS = [['all', 'Tümü'], ['primary', 'Birincil'], ['promotions', 'Promosyonlar'], ['social', 'Sosyal'], ['updates', 'Güncellemeler']];
const GM_QUICK = { tr: ['Teşekkürler!', 'Aldım, dönüş yapacağım.', 'Uygun, olur.', 'Şu an müsait değilim, sonra yazacağım.'], en: ['Thank you!', 'Got it, I’ll get back to you.', 'Sounds good.', 'I’m busy right now, I’ll write later.'] };
Object.assign(ICONS, {
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
  reply: '<path d="M10 8L4 13l6 5"/><path d="M4 13h10a6 6 0 0 1 6 6"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  unread: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/><circle cx="19" cy="6" r="3" fill="currentColor"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>'
});
function gmSet() { const st = settings(); if (!st.gmail || typeof st.gmail !== 'object') st.gmail = {}; return st.gmail; }
function gopt(k) { const g = settings().gmail || {}; return g[k] === undefined ? GM_OPTS[k][0] : !!g[k]; }

/* ----- yardımcılar ----- */
const gmHdr = (m, name) => { const h = ((m.payload || {}).headers || []).find(x => x.name.toLowerCase() === name.toLowerCase()); return h ? h.value : ''; };
function gmAddr(v) { const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>/.exec(v || ''); return m ? { name: m[1].trim() || m[2].trim(), email: m[2].trim().toLowerCase() } : { name: (v || '').trim(), email: (v || '').trim().toLowerCase() }; }
function gmEnt(s) { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
function gmNorm(m) {
  return { id: m.id, thread: m.threadId, from: gmAddr(gmHdr(m, 'From')), subject: gmHdr(m, 'Subject'), date: +m.internalDate || 0, snippet: gmEnt(m.snippet || ''), labels: m.labelIds || [],
    unsub: gmHdr(m, 'List-Unsubscribe'), unsubPost: gmHdr(m, 'List-Unsubscribe-Post'), replyTo: gmHdr(m, 'Reply-To'), msgId: gmHdr(m, 'Message-ID') || gmHdr(m, 'Message-Id') };
}
const GM_HDRS = ['From', 'Subject', 'Date', 'List-Unsubscribe', 'List-Unsubscribe-Post', 'Reply-To', 'Message-ID'];
async function gmPool(items, n, fn, onStep) {
  const out = new Array(items.length); let i = 0, done = 0, authErr = null;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length && !authErr) { const k = i++; try { out[k] = await fn(items[k]); } catch (e) { out[k] = null; if (e.auth) authErr = e; } done++; if (onStep) onStep(done, items.length); }
  }));
  if (authErr) throw authErr;
  return out;
}
function gmB64(str) { const b = new TextEncoder().encode(str); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
const gmB64url = s => gmB64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function gmDecode(data, charset) {
  try { const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder(charset || 'utf-8').decode(u); }
  catch (e) { try { return new TextDecoder('utf-8').decode(new Uint8Array([])); } catch (e2) { return ''; } }
}
function gmParts(p, acc) {
  acc = acc || { text: '', html: '', files: [] };
  if (!p) return acc;
  const ct = ((p.headers || []).find(h => h.name.toLowerCase() === 'content-type') || {}).value || p.mimeType || '';
  const cs = (/charset="?([^";]+)"?/i.exec(ct) || [])[1];
  if (p.filename) acc.files.push(p.filename);
  else if (p.body && p.body.data) { if (p.mimeType === 'text/plain' && !acc.text) acc.text = gmDecode(p.body.data, cs); else if (p.mimeType === 'text/html' && !acc.html) acc.html = gmDecode(p.body.data, cs); }
  (p.parts || []).forEach(x => gmParts(x, acc));
  return acc;
}
const gmLink = m => 'https://mail.google.com/mail/u/0/#all/' + (m.thread || m.id);
function gmWhen(t) {
  const d = new Date(t), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString(TR, { day: 'numeric', month: 'short' });
  return d.toLocaleDateString(TR, { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function gmLinkify(s) { return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }

/* ----- Gmail modülü ----- */
const Mail = {
  cfg: null, selMode: false, sel: new Set(), important: 0, unread: 0, top: [], msgs: [], next: null, q: '', cat: 'all', loading: false, err: '', fetchedAt: 0, fetchedKey: '',
  subs: null, subsBusy: false, subsProg: '', cur: null,
  async load() {
    try { this.cfg = (await DB.getMeta('gmail')) || null; } catch (e) { this.cfg = null; }
    this.important = +lsGet('pusula.gmImp', '0') || 0; this.unread = +lsGet('pusula.gmUnread', '0') || 0;
  },
  async saveCfg() { await DB.setMeta('gmail', this.cfg); },
  on() { return !!(this.cfg && this.cfg.connected); },
  scopes() { if (!this.on()) return []; const s = [GM_MODIFY]; if (this.cfg.send) s.push(GM_SEND); if (this.cfg.filt) s.push(GM_FILTER); return s; },
  ready() { return this.on() && navigator.onLine && Drive.tokenOk(GM_MODIFY); },
  async api(path, opts) { const r = await Drive.api(GM + path, opts); if (r.status === 204) return {}; try { return await r.json(); } catch (e) { return {}; } },
  post(path, body) { return this.api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }); },
  async meta(id) { return gmNorm(await this.api('/messages/' + id + '?format=metadata&' + GM_HDRS.map(h => 'metadataHeaders=' + encodeURIComponent(h)).join('&'))); },
  async ids(q, max) {
    let ids = [], tok = null;
    do { const r = await this.api('/messages?maxResults=500&q=' + encodeURIComponent(q) + (tok ? '&pageToken=' + tok : '')); ids = ids.concat((r.messages || []).map(x => x.id)); tok = r.nextPageToken; } while (tok && ids.length < (max || 2000));
    return ids;
  },
  async batch(ids, add, rem) { for (let i = 0; i < ids.length; i += 1000) await this.post('/messages/batchModify', { ids: ids.slice(i, i + 1000), addLabelIds: add || [], removeLabelIds: rem || [] }); },
  modify(id, add, rem) { return this.post('/messages/' + id + '/modify', { addLabelIds: add || [], removeLabelIds: rem || [] }); },
  listKey() { return this.q + '|' + this.cat; },
  async fetchList(more) {
    if (!this.ready() || this.loading) return;
    this.loading = true; this.err = ''; if (!more) mailRender();
    try {
      let q = 'in:inbox';
      if (gopt('search') && this.q) q = this.q;
      if (gopt('cats') && this.cat !== 'all') q += ' category:' + this.cat;
      const r = await this.api('/messages?maxResults=25&q=' + encodeURIComponent(q) + (more && this.next ? '&pageToken=' + this.next : ''));
      this.next = r.nextPageToken || null;
      const got = (await gmPool((r.messages || []).map(x => x.id), 8, id => this.meta(id))).filter(Boolean);
      this.msgs = more ? this.msgs.concat(got) : got; this.fetchedAt = Date.now(); this.fetchedKey = this.listKey();
    } catch (e) { this.err = e.message; }
    this.loading = false; mailRender();
  },
  async refreshCounts() {
    if (!this.ready()) return;
    try {
      const want = gopt('bell'), card = gopt('todayCard');
      const [imp, lab, top] = await Promise.all([
        want ? this.api('/messages?maxResults=100&q=' + encodeURIComponent('in:inbox is:unread is:important')) : Promise.resolve(null),
        this.api('/labels/INBOX'),
        card ? this.api('/messages?maxResults=3&q=' + encodeURIComponent('in:inbox is:unread')) : Promise.resolve(null)
      ]);
      const before = this.important + '|' + this.unread + '|' + this.top.map(x => x.id).join();
      if (imp) this.important = (imp.messages || []).length;
      this.unread = lab.messagesUnread || 0;
      if (top) this.top = (await gmPool((top.messages || []).map(x => x.id), 3, id => this.meta(id))).filter(Boolean);
      lsSet('pusula.gmImp', String(this.important)); lsSet('pusula.gmUnread', String(this.unread));
      const after = this.important + '|' + this.unread + '|' + this.top.map(x => x.id).join();
      if (before !== after && !$('#sheetRoot.open')) render();
    } catch (e) { console.warn(e); }
  }
};
function mailRender() { if (S.tab === 'mail' && !$('#sheetRoot.open')) render(); }
function gmNeedTok(scope, then) { // dokunuş anında çağrılır; izin yoksa Google penceresini açar
  if (Drive.tokenOk(scope)) return then();
  if (!Drive.gisReady()) { Drive.loadGis().catch(() => {}); return toast(tr('Google girişi hazırlanıyor, birkaç saniye sonra tekrar dokun')); }
  Drive.requestToken('', [scope]).then(async () => {
    if (!Drive.tokenOk(scope)) return toast(tr('İzin verilmedi'));
    if (scope === GM_SEND) Mail.cfg.send = true; if (scope === GM_FILTER) Mail.cfg.filt = true; await Mail.saveCfg(); then();
  }).catch(e => toast(e.message));
}

/* ----- Posta sekmesi ----- */
function mailSubs() { const a = []; if (gopt('inbox')) a.push({ k: 'inbox', label: tr('Gelen kutusu') }); if (gopt('subs')) a.push({ k: 'subs', label: tr('Abonelikler') }); if (gopt('clean')) a.push({ k: 'clean', label: tr('Otomatik temizlik') }); return a; }
function viewMail() {
  if (navigator.onLine) Drive.loadGis().catch(() => {});
  if (!Mail.on()) return '<div class="mail-empty">' + icon('mail') + '<h3>Gmail bağlı değil</h3><p class="muted">Gelen kutun, aboneliklerin ve otomatik temizlik burada olur. Mailler cihaza ya da Drive’a kaydedilmez, her seferinde Gmail’den okunur.</p><div class="sheet-msg" id="gmMsg"></div><button class="btn primary" data-act="gm-connect">' + icon('mail') + ' <span>Gmail’i bağla</span></button><p class="muted sm">Hata alırsan: Google Cloud’da PUSULA projesinde <b>Gmail API</b>’nin açık olduğundan emin ol.</p></div>';
  const subs = mailSubs();
  if (!subs.length) return '<div class="empty">Ayarlar &gt; Gmail’den en az bir özellik aç.</div>';
  if (!subs.find(x => x.k === S.mailSub)) S.mailSub = subs[0].k;
  let h = subSeg(subs, S.mailSub, 'mail-sub');
  if (!navigator.onLine) return h + '<div class="empty">Posta için internet gerekli.</div>';
  if (!Drive.tokenOk(GM_MODIFY)) return h + '<div class="mail-empty"><p class="muted">Google oturumunun süresi doldu. Devam etmek için dokun.</p><button class="btn primary" data-act="gm-auth">' + icon('sync') + ' <span>Oturumu yenile</span></button></div>';
  if (S.mailSub === 'subs') return h + viewSubs();
  if (S.mailSub === 'clean') return h + viewClean();
  return h + viewInbox();
}
function viewInbox() {
  if ((Date.now() - Mail.fetchedAt > 60000 || Mail.fetchedKey !== Mail.listKey()) && !Mail.loading && !Mail.err) setTimeout(() => Mail.fetchList(), 0);
  let h = '';
  if (gopt('search')) h += '<form class="quick-add mail-search" id="gmSearch"><input class="input" name="q" placeholder="Mailde ara (gönderen, konu, kelime)…" value="' + esc(Mail.q) + '" autocomplete="off" enterkeyhint="search">' + (Mail.q ? '<button class="icon-btn" type="button" data-act="gm-search-clear" aria-label="Temizle">' + icon('x') + '</button>' : '') + '<button class="icon-btn" type="submit" aria-label="Ara">' + icon('search') + '</button></form>';
  if (gopt('cats')) h += '<div class="chips mail-cats">' + GM_CATS.map(c => '<button class="chip sm ' + (Mail.cat === c[0] ? 'on' : '') + '" data-act="gm-cat" data-k="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>';
  if (gopt('promo') && Mail.cat === 'promotions') h += '<div class="mail-bulk"><button class="btn sm-btn" data-act="gm-promo" data-k="read">' + icon('check', 'sm') + ' <span>Hepsini okundu yap</span></button><button class="btn sm-btn" data-act="gm-promo" data-k="archive">' + icon('archive', 'sm') + ' <span>Hepsini arşivle</span></button></div>';
  h += '<div class="mail-tools"><span class="muted sm">' + (Mail.unread ? Mail.unread + ' <span>okunmamış</span>' : '') + '</span><span class="mt-right">' + (Mail.msgs.length ? '<button class="link" data-act="gm-select">' + tr(Mail.selMode ? 'Seçimi bitir' : 'Seç') + '</button>' : '') + '<button class="icon-btn ' + (Mail.loading ? 'spin' : '') + '" data-act="gm-refresh" aria-label="Yenile">' + icon('sync') + '</button></span></div>';
  if (Mail.err) h += '<div class="sheet-msg err">' + esc(Mail.err) + '</div>';
  if (!Mail.msgs.length) h += '<div class="empty">' + (Mail.loading ? 'Yükleniyor…' : Mail.q ? 'Sonuç yok.' : 'Gelen kutusu boş. Tebrikler!') + '</div>';
  else h += '<div class="card mail-list ' + (Mail.selMode ? 'selecting' : '') + '">' + Mail.msgs.map(mailRow).join('') + '</div>' + (Mail.next ? '<button class="btn block" data-act="gm-more">' + (Mail.loading ? 'Yükleniyor…' : 'Daha fazla') + '</button>' : '');
  if (Mail.selMode) h += selBar();
  return h;
}
function mailRow(m) {
  const un = m.labels.includes('UNREAD'), st = m.labels.includes('STARRED'), sel = Mail.selMode && Mail.sel.has(m.id);
  return '<div class="mrow ' + (un ? 'unread ' : '') + (sel ? 'picked' : '') + '">' + (Mail.selMode ? '<button class="mpick" data-act="gm-pick" data-id="' + m.id + '" aria-label="Seç">' + (sel ? icon('check', 'sm') : '') + '</button>' : '') + '<button class="mrow-main" data-act="' + (Mail.selMode ? 'gm-pick' : 'gm-open') + '" data-id="' + m.id + '"><div class="mrow-top"><span class="mrow-from u">' + esc(m.from.name || m.from.email) + '</span><span class="mrow-date">' + gmWhen(m.date) + '</span></div><div class="mrow-subj u">' + esc(m.subject || tr('(konusuz)')) + '</div><div class="mrow-snip u">' + esc(m.snippet) + '</div></button>' +
    '<div class="mrow-acts"><button class="icon-btn ' + (st ? 'on star' : '') + '" data-act="gm-star" data-id="' + m.id + '" aria-label="Yıldız">' + icon('star', 'sm') + '</button><button class="icon-btn" data-act="gm-archive" data-id="' + m.id + '" aria-label="Arşivle">' + icon('archive', 'sm') + '</button></div></div>';
}
/* ----- toplu seçim ----- */
function selBar() {
  const n = Mail.sel.size, all = n && n === Mail.msgs.length;
  const b = (k, ic, label) => '<button class="sb-act" data-act="gm-bulk" data-k="' + k + '" ' + (n ? '' : 'disabled') + '>' + icon(ic, 'sm') + '<span>' + label + '</span></button>';
  return '<div class="sel-bar"><div class="sb-top"><b>' + n + '</b> <span>seçili</span><button class="link" data-act="gm-pick-all">' + tr(all ? 'Hiçbirini seçme' : 'Hepsini seç') + '</button><button class="icon-btn" data-act="gm-select" aria-label="Kapat">' + icon('x', 'sm') + '</button></div>' +
    '<div class="sb-acts">' + b('read', 'check', 'Okundu') + b('unread', 'unread', 'Okunmadı') + b('archive', 'archive', 'Arşivle') + b('trash', 'trash', 'Çöpe at') + b('star', 'star', 'Yıldızla') + '</div></div>';
}
const GM_BULK = { read: [[], ['UNREAD']], unread: [['UNREAD'], []], archive: [[], ['INBOX']], trash: [['TRASH'], ['INBOX']], star: [['STARRED'], []] };
async function gmBulk(k) {
  const ids = [...Mail.sel]; if (!ids.length) return;
  const [add, rem] = GM_BULK[k];
  try {
    await Mail.batch(ids, add, rem);
    if (k === 'archive' || k === 'trash') { const keep = Mail.msgs.filter(m => ids.includes(m.id)); ids.forEach(gmDropLocal);
      const msg = Lx(ids.length + ' mail ' + (k === 'archive' ? 'arşivlendi' : 'çöpe atıldı'), ids.length + ' emails ' + (k === 'archive' ? 'archived' : 'moved to trash'));
      toast(msg, { label: tr('Geri al'), fn: async () => { await Mail.batch(ids, rem, add); Mail.msgs = Mail.msgs.concat(keep).sort((a, b) => b.date - a.date); render(); Mail.refreshCounts(); } });
    } else {
      Mail.msgs.forEach(m => { if (!ids.includes(m.id)) return; m.labels = m.labels.filter(x => !rem.includes(x)).concat(add.filter(x => !m.labels.includes(x))); });
      toast(Lx(ids.length + ' mail güncellendi', ids.length + ' emails updated'));
    }
    Mail.sel.clear(); Mail.selMode = false; render(); Mail.refreshCounts();
  } catch (e) { toast(e.message); }
}
let gmLongT = null, gmLongAt = 0;
document.addEventListener('pointerdown', e => { const r = e.target.closest && e.target.closest('.mrow-main'); if (!r || Mail.selMode) return; clearTimeout(gmLongT); gmLongT = setTimeout(() => { gmLongAt = Date.now(); Mail.selMode = true; Mail.sel = new Set([r.dataset.id]); if (navigator.vibrate) navigator.vibrate(25); render(); }, 450); });
['pointerup', 'pointercancel', 'pointermove'].forEach(ev => document.addEventListener(ev, e => { if (ev !== 'pointermove' || Math.abs(e.movementY) > 4 || Math.abs(e.movementX) > 4) clearTimeout(gmLongT); }, true));
const gmFind = id => Mail.msgs.find(x => x.id === id) || Mail.top.find(x => x.id === id) || (Mail.cur && Mail.cur.id === id ? Mail.cur : null);
function gmDropLocal(id) { Mail.msgs = Mail.msgs.filter(x => x.id !== id); Mail.top = Mail.top.filter(x => x.id !== id); }

/* ----- mail okuma ----- */
async function openMail(id) {
  const m = gmFind(id); if (!m) return;
  Mail.cur = m;
  const b = (act, ic, label, extra) => '<button class="mact" data-act="' + act + '" data-id="' + m.id + '"' + (extra || '') + '>' + icon(ic, 'sm') + '<span>' + label + '</span></button>';
  const acts = (gopt('reply') ? b('gm-reply', 'reply', 'Cevapla') : '') + b('gm-archive', 'archive', 'Arşivle') + b('gm-trash', 'trash', 'Çöpe at') + b('gm-star', 'star', m.labels.includes('STARRED') ? 'Yıldızı kaldır' : 'Yıldızla') +
    b('gm-unread', 'unread', 'Okunmadı yap') + b('gm-task', 'task', 'Göreve çevir') + (gopt('toEvent') ? b('gm-event', 'event', 'Takvime ekle') : '') + (gopt('toNote') ? b('gm-note', 'note', 'Nota çevir') : '') + b('gm-gmail', 'open', 'Gmail’de aç');
  openSheet('<div class="ed-top"><button class="icon-btn" data-act="close-sheet" aria-label="Geri">' + icon('back') + '</button><div class="tool-title u">' + esc(m.subject || tr('(konusuz)')) + '</div></div>' +
    '<div class="tool-body mail-read"><div class="mail-head"><div class="u"><b>' + esc(m.from.name) + '</b> <span class="muted">&lt;' + esc(m.from.email) + '&gt;</span></div><div class="muted sm">' + new Date(m.date).toLocaleString(TR, { dateStyle: 'medium', timeStyle: 'short' }) + '</div></div>' +
    '<div class="mail-acts">' + acts + '</div><div id="gmReply"></div><div id="gmBody" class="mail-body"><div class="empty">Yükleniyor…</div></div></div>', { full: true, onClose: () => { Mail.cur = null; setTimeout(render, 0); } });
  try {
    const full = await Mail.api('/messages/' + id + '?format=full');
    const p = gmParts(full.payload); m.text = p.text || ''; m.html = p.html || '';
    const box = $('#gmBody'); if (!box || !Mail.cur || Mail.cur.id !== id) return;
    const files = p.files.length ? '<div class="mail-files">' + icon('paper', 'sm') + ' <span class="u">' + esc(p.files.join(', ')) + '</span> · <a href="' + gmLink(m) + '" target="_blank" rel="noopener">Ekler Gmail’de</a></div>' : '';
    if (p.html) {
      const doc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:10px;background:#fff;color:#111;font-family:system-ui,sans-serif;word-wrap:break-word;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%!important}</style></head><body>' + p.html + '</body></html>';
      box.innerHTML = files + '<iframe class="mail-frame" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe>';
      box.querySelector('iframe').srcdoc = doc;
    } else box.innerHTML = files + '<div class="mail-text u">' + gmLinkify(p.text || m.snippet) + '</div>';
    if (m.labels.includes('UNREAD')) { m.labels = m.labels.filter(x => x !== 'UNREAD'); Mail.modify(id, [], ['UNREAD']).then(() => Mail.refreshCounts()).catch(() => {}); }
  } catch (e) { const box = $('#gmBody'); if (box) box.innerHTML = '<div class="sheet-msg err">' + esc(e.message) + '</div>'; }
}
function replyBox(m) {
  const L = isEn() ? 'en' : 'tr';
  const box = $('#gmReply'); if (!box) return;
  if (box.innerHTML) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="mail-reply"><div class="muted sm"><span>Kime:</span> <span class="u">' + esc(gmAddr(m.replyTo || '').email || m.from.email) + '</span></div>' +
    (gopt('quick') ? '<div class="chips">' + GM_QUICK[L].map(q => '<button class="chip sm u" data-act="gm-quick" data-v="' + esc(q) + '">' + esc(q) + '</button>').join('') + '</div>' : '') +
    '<textarea class="input" id="gmText" rows="5" placeholder="Cevabını yaz…"></textarea><div class="tool-actions"><button class="btn" data-act="gm-reply-cancel">Vazgeç</button><button class="btn primary" data-act="gm-send" data-id="' + m.id + '">' + icon('reply', 'sm') + ' <span>Gönder</span></button></div></div>';
  translateTree(box); $('#gmText').focus();
}
async function gmSend(m, text) {
  const to = gmAddr(m.replyTo || '').email || m.from.email;
  const subj = /^re:/i.test(m.subject || '') ? m.subject : 'Re: ' + (m.subject || '');
  const head = ['To: ' + to, 'Subject: =?UTF-8?B?' + gmB64(subj) + '?=', 'MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64'];
  if (m.msgId) head.push('In-Reply-To: ' + m.msgId, 'References: ' + m.msgId);
  const raw = head.join('\r\n') + '\r\n\r\n' + gmB64(text).replace(/.{76}/g, '$&\r\n');
  await Mail.post('/messages/send', { raw: gmB64url(raw), threadId: m.thread });
}
async function gmSendTo(addr, subject, text) {
  const raw = ['To: ' + addr, 'Subject: =?UTF-8?B?' + gmB64(subject) + '?=', 'MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64'].join('\r\n') + '\r\n\r\n' + gmB64(text);
  await Mail.post('/messages/send', { raw: gmB64url(raw) });
}
const gmBody = m => (m.text || (m.html ? (new DOMParser().parseFromString(m.html, 'text/html').body.innerText || '') : '') || m.snippet || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 4000);

/* ----- abonelikler ----- */
function viewSubs() {
  const g = gmSet(); const un = g.unsub || {}, fl = g.filters || {};
  let h = '<p class="muted sm mail-note">Son 6 ayda abonelik maili atan gönderenler. Tarama mail başlıklarına bakar, hiçbir şey kaydedilmez.</p>';
  if (Mail.subsBusy) return h + '<div class="empty">' + tr('Taranıyor…') + ' ' + esc(Mail.subsProg) + '</div>';
  if (!Mail.subs) return h + '<button class="btn primary block" data-act="gm-scan">' + icon('search') + ' <span>Abonelikleri tara</span></button>';
  h += '<div class="mail-tools"><span class="muted sm">' + Mail.subs.length + ' <span>gönderen</span></span><button class="icon-btn" data-act="gm-scan" aria-label="Yeniden tara">' + icon('sync') + '</button></div>';
  if (!Mail.subs.length) return h + '<div class="empty">Abonelik maili bulunamadı.</div>';
  return h + '<div class="card mail-list">' + Mail.subs.map((s, i) => '<button class="srow" data-act="gm-sub" data-i="' + i + '"><div class="grow"><div class="u"><b>' + esc(s.name) + '</b></div><div class="muted sm u">' + esc(s.email) + '</div>' +
    '<div class="srow-tags">' + (un[s.email] ? '<span class="badge-s ok">Çıkıldı</span>' : '') + (fl[s.email] ? '<span class="badge-s">Otomatik arşiv</span>' : '') + '</div></div><div class="srow-n"><b>' + s.n + '</b><span>mail</span></div></button>').join('') + '</div>';
}
async function gmScan() {
  if (!Mail.ready() || Mail.subsBusy) return;
  Mail.subsBusy = true; Mail.subsProg = ''; mailRender();
  try {
    const ids = await Mail.ids('(unsubscribe OR "abonelikten çık" OR "üyelikten çık" OR "e-posta almak istemiyorsanız") newer_than:180d -in:sent -in:chats', 400);
    const metas = await gmPool(ids, 10, id => Mail.meta(id), (d, n) => { Mail.subsProg = d + '/' + n; const el = $('#view .empty'); if (el && S.mailSub === 'subs') el.textContent = tr('Taranıyor…') + ' ' + Mail.subsProg; });
    const by = {};
    metas.filter(Boolean).forEach(m => { const k = m.from.email; if (!k) return; const s = by[k] || (by[k] = { email: k, name: m.from.name || k, n: 0, last: 0, unsub: '', unsubPost: '' }); s.n++; if (m.date > s.last) { s.last = m.date; s.name = m.from.name || k; } if (m.unsub && !s.unsub) { s.unsub = m.unsub; s.unsubPost = m.unsubPost; } });
    Mail.subs = Object.values(by).filter(s => s.unsub || s.n >= 3).sort((a, b) => b.n - a.n || b.last - a.last);
  } catch (e) { toast(e.message); }
  Mail.subsBusy = false; mailRender();
}
function openSub(i) {
  const s = Mail.subs[i]; if (!s) return; const g = gmSet();
  const done = (g.unsub || {})[s.email], filt = (g.filters || {})[s.email];
  openSheet(sheetHead('<span class="u">' + esc(s.name) + '</span>') + '<div class="sheet-body"><p class="muted u" style="margin-top:0">' + esc(s.email) + '</p><p class="muted sm">' + Lx('Son 6 ayda ' + s.n + ' mail · son: ' + gmWhen(s.last), s.n + ' emails in the last 6 months · last: ' + gmWhen(s.last)) + '</p>' +
    '<div class="sub-acts">' +
    '<button class="btn block ' + (done ? '' : 'primary') + '" data-act="gm-unsub" data-i="' + i + '">' + icon('x', 'sm') + ' <span>' + (done ? 'Tekrar abonelikten çık' : 'Abonelikten çık') + '</span></button>' +
    '<button class="btn block" data-act="gm-sub-bulk" data-k="archive" data-i="' + i + '">' + icon('archive', 'sm') + ' <span>Gelen kutusundaki maillerini arşivle</span></button>' +
    '<button class="btn block" data-act="gm-sub-bulk" data-k="trash" data-i="' + i + '">' + icon('trash', 'sm') + ' <span>Tüm maillerini çöpe at</span></button>' +
    (gopt('clean') ? '<button class="btn block" data-act="gm-filter" data-i="' + i + '">' + icon('filter', 'sm') + ' <span>' + (filt ? 'Otomatik arşivlemeyi kapat' : 'Gelecek maillerini otomatik arşivle') + '</span></button>' : '') +
    '</div><p class="muted sm">Çöpe atılan mailler Gmail’de 30 gün çöp kutusunda kalır, istersen geri alabilirsin.</p></div>', { onClose: () => setTimeout(render, 0) });
}
function gmUnsubDo(s) {
  const links = (s.unsub.match(/<([^>]+)>/g) || []).map(x => x.slice(1, -1).trim());
  const http = links.find(l => /^https:/i.test(l)), mailto = links.find(l => /^mailto:/i.test(l));
  const mark = async () => { const g = gmSet(); g.unsub = Object.assign({}, g.unsub, { [s.email]: Date.now() }); await saveSettings(); };
  if (http && /one-click/i.test(s.unsubPost || '')) {
    fetch(http, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })
      .then(() => { mark(); closeSheet(); toast(tr('Abonelikten çıkış isteği gönderildi')); }).catch(() => toast(tr('İstek gönderilemedi, internetini kontrol et')));
  } else if (mailto) {
    if (!ask('Bu gönderen çıkış için mail istiyor. PUSULA senin adına çıkış maili göndersin mi?')) return;
    const u = mailto.slice(7); const addr = decodeURIComponent(u.split('?')[0]); const qs = new URLSearchParams(u.split('?')[1] || '');
    gmNeedTok(GM_SEND, () => gmSendTo(addr, qs.get('subject') || 'unsubscribe', qs.get('body') || 'unsubscribe').then(() => { mark(); closeSheet(); toast(tr('Çıkış maili gönderildi')); }).catch(e => toast(e.message)));
  } else if (http) {
    window.open(http, '_blank', 'noopener'); mark(); toast(tr('Çıkış sayfası açıldı, işlemi orada onayla'));
  } else toast(tr('Bu gönderende çıkış bağlantısı yok. Otomatik arşivlemeyi kullanabilirsin.'));
}
async function gmSubBulk(s, kind) {
  try {
    toast(tr('Mailler sayılıyor…'));
    const ids = await Mail.ids('from:' + s.email + (kind === 'archive' ? ' in:inbox' : ''), 5000);
    if (!ids.length) return toast(tr('İşlenecek mail yok'));
    const msg = kind === 'archive' ? Lx('“' + s.name + '” gönderenin gelen kutusundaki ' + ids.length + ' maili arşivlensin mi?', 'Archive ' + ids.length + ' inbox emails from “' + s.name + '”?') : Lx('“' + s.name + '” gönderenin ' + ids.length + ' maili çöpe atılsın mı? (30 gün içinde geri alınabilir)', 'Move ' + ids.length + ' emails from “' + s.name + '” to trash? (Recoverable for 30 days)');
    if (!confirm(msg)) return;
    if (kind === 'archive') await Mail.batch(ids, [], ['INBOX']); else await Mail.batch(ids, ['TRASH'], ['INBOX']);
    if ($('#sheetRoot.open')) closeSheet(); Mail.fetchedAt = 0; toast(Lx(ids.length + ' mail ' + (kind === 'archive' ? 'arşivlendi' : 'çöpe atıldı'), ids.length + ' emails ' + (kind === 'archive' ? 'archived' : 'moved to trash'))); Mail.refreshCounts();
  } catch (e) { toast(e.message); }
}
function gmFilterToggle(email, name) {
  const g = gmSet(); const cur = (g.filters || {})[email];
  gmNeedTok(GM_FILTER, async () => {
    try {
      if (cur) { await Mail.api('/settings/filters/' + cur, { method: 'DELETE' }).catch(e => { if (e.status !== 404) throw e; }); const f = Object.assign({}, g.filters); delete f[email]; g.filters = f; await saveSettings(); toast(tr('Otomatik arşivleme kapatıldı')); }
      else {
        if (!ask(Lx('“' + (name || email) + '” gönderenin gelecek mailleri gelen kutusuna düşmeden arşivlensin mi? (Gmail’de “Tüm postalar”da durur)', 'Archive future emails from “' + (name || email) + '” automatically? (They stay in All Mail)'))) return;
        let id;
        try { id = (await Mail.post('/settings/filters', { criteria: { from: email }, action: { removeLabelIds: ['INBOX'] } })).id; }
        catch (e) { if (/exist/i.test(e.message)) { const all = await Mail.api('/settings/filters'); const hit = (all.filter || []).find(f => (f.criteria || {}).from === email); id = hit && hit.id; } if (!id) throw e; }
        g.filters = Object.assign({}, g.filters, { [email]: id }); await saveSettings(); toast(tr('Gelecek mailleri otomatik arşivlenecek'));
      }
      if ($('#sheetRoot.open')) closeSheet(); else render();
    } catch (e) { toast(e.message); }
  });
}
function viewClean() {
  const fl = gmSet().filters || {}; const keys = Object.keys(fl);
  return '<p class="muted sm mail-note">Buradaki gönderenlerin yeni mailleri gelen kutuna düşmez, Gmail’de “Tüm postalar”da durur. Abonelikler sekmesinden de ekleyebilirsin.</p>' +
    '<form class="quick-add" id="gmCleanAdd"><input class="input" name="q" type="email" placeholder="Gönderen e-posta adresi" autocomplete="off" enterkeyhint="done"><button class="icon-btn" type="submit" aria-label="Ekle">' + icon('plus') + '</button></form>' +
    (keys.length ? '<div class="card mail-list">' + keys.sort().map(e => '<div class="set-row"><div class="grow u">' + esc(e) + '</div><button class="icon-btn" data-act="gm-clean-del" data-e="' + esc(e) + '" aria-label="Kaldır">' + icon('trash', 'sm') + '</button></div>').join('') + '</div>' : '<div class="empty">Henüz otomatik arşivlenen gönderen yok.</div>');
}

/* ----- Bugün kartı ----- */
TODAY_CARDS.mail = function () {
  const rows = Mail.top.map(m => '<button class="mini-mail" data-act="gm-open-top" data-id="' + m.id + '"><b class="u">' + esc(m.from.name || m.from.email) + '</b><span class="u">' + esc(m.subject || tr('(konusuz)')) + '</span></button>').join('');
  const body = Mail.unread ? '<div class="mail-card"><div class="muted sm"><b>' + Mail.unread + '</b> <span>okunmamış mail</span>' + (gopt('bell') && Mail.important ? ' · <b>' + Mail.important + '</b> <span>önemli</span>' : '') + '</div>' + rows + '</div>' : '<div class="empty">Okunmamış mail yok.</div>';
  return card('mail', T('mail'), body, 'mail');
};

/* ----- Ayarlar > Gmail ----- */
function gmailSettingsBody() {
  const row = k => '<div class="set-row"><div class="grow"><div>' + GM_OPTS[k][1] + '</div>' + (GM_OPTS[k][2] ? '<div class="sub">' + GM_OPTS[k][2] + '</div>' : '') + '</div><button class="switch ' + (gopt(k) ? 'on' : '') + '" data-act="gm-opt" data-k="' + k + '" aria-label="Aç/kapat"></button></div>';
  const conn = Mail.on()
    ? '<div class="set-row"><div class="grow"><div>Gmail bağlı</div><div class="sub">Bu cihazda bağlı. Diğer cihazda da bir kez bağlaman gerekir.</div></div><button class="btn sm-btn" data-act="gm-off">Bağlantıyı kes</button></div>'
    : '<div class="set-row"><div class="grow"><div>Gmail bağlı değil</div><div class="sub">Gmail API Google Cloud’da açık olmalı.</div></div><button class="btn sm-btn primary" data-act="gm-connect">Bağla</button></div><div class="sheet-msg" id="gmMsg"></div>';
  return conn + '<div class="set-sub">Ana özellikler</div>' + GM_MAIN.map(row).join('') + '<div class="set-sub">Ek özellikler</div>' + GM_EXTRA.map(row).join('') +
    '<div class="set-sub">Cevap verme</div>' + row('reply') +
    '<p class="muted sm" style="margin:8px 0 4px">Mailler cihaza ya da Drive yedeğine kaydedilmez. Silinen mailler kalıcı silinmez, Gmail’de çöp kutusuna gider.</p>';
}

/* ----- olaylar ----- */
function gmConnect() {
  const msg = $('#gmMsg'); const say = (t, c) => { if (msg) { msg.textContent = tr(t); msg.className = 'sheet-msg ' + (c || ''); } else toast(tr(t)); };
  if (!navigator.onLine) return say('Bağlanmak için internet gerekli.', 'err');
  if (!Drive.gisReady()) { say('Google girişi hazırlanıyor… birkaç saniye sonra tekrar bas.'); Drive.loadGis().catch(e => say(e.message, 'err')); return; }
  say('Google penceresi açılıyor…');
  const extra = [GM_MODIFY]; if (gopt('reply')) extra.push(GM_SEND);
  Drive.requestToken('consent', extra).then(async () => {
    if (!Drive.tokenOk(GM_MODIFY)) return say('Gmail izni verilmedi.', 'err');
    Mail.cfg = Object.assign({}, Mail.cfg || {}, { connected: true, send: Drive.tokenOk(GM_SEND) });
    await Mail.saveCfg();
    try { await Mail.api('/labels/INBOX'); } catch (e) { Mail.cfg.connected = false; await Mail.saveCfg(); return say(e.message, 'err'); }
    toast(tr('Gmail bağlandı')); Mail.fetchedAt = 0; Mail.refreshCounts(); render();
  }).catch(e => say(e.message, 'err'));
}
Object.assign(ACTIONS, {
  'gm-connect': () => gmConnect(),
  'gm-auth': () => { if (!Drive.gisReady()) { Drive.loadGis().catch(() => {}); return toast(tr('Google girişi hazırlanıyor, birkaç saniye sonra tekrar dokun')); } Drive.requestToken().then(() => { Mail.fetchedAt = 0; render(); gSync(false); }).catch(e => toast(e.message)); },
  'gm-off': async () => { if (!ask('Bu cihazda Gmail bağlantısı kesilsin mi? Maillerin etkilenmez.')) return; Mail.cfg = null; await DB.setMeta('gmail', null); Mail.msgs = []; Mail.top = []; Mail.subs = null; Mail.important = 0; Mail.unread = 0; lsSet('pusula.gmImp', '0'); lsSet('pusula.gmUnread', '0'); render(); },
  'gm-opt': el => {
    const k = el.dataset.k, g = gmSet(), v = !gopt(k); g[k] = v;
    if (k === 'reply' && v && Mail.on() && !Drive.tokenOk(GM_SEND)) gmNeedTok(GM_SEND, () => toast(tr('Cevap verme açıldı')));
    if (k === 'reply' && !v && Mail.cfg) { Mail.cfg.send = false; Mail.saveCfg(); }
    saveSettings(); if (Mail.on() && (k === 'bell' || k === 'todayCard') && v) Mail.refreshCounts();
  },
  'mail-sub': el => { Mail.selMode = false; Mail.sel.clear(); S.mailSub = el.dataset.k; window.scrollTo(0, 0); render(); },
  'gm-refresh': () => { Mail.fetchedAt = 0; Mail.err = ''; Mail.fetchList(); Mail.refreshCounts(); },
  'gm-more': () => Mail.fetchList(true),
  'gm-cat': el => { Mail.selMode = false; Mail.sel.clear(); Mail.cat = el.dataset.k; Mail.msgs = []; Mail.next = null; Mail.err = ''; render(); },
  'gm-search-clear': () => { Mail.q = ''; Mail.msgs = []; Mail.err = ''; render(); },
  'gm-open': el => { if (Date.now() - gmLongAt < 700) return; openMail(el.dataset.id); },
  'gm-select': () => { Mail.selMode = !Mail.selMode; Mail.sel.clear(); render(); },
  'gm-pick': el => { if (Date.now() - gmLongAt < 700) return; const id = el.dataset.id; if (Mail.sel.has(id)) Mail.sel.delete(id); else Mail.sel.add(id); render(); },
  'gm-pick-all': () => { if (Mail.sel.size === Mail.msgs.length) Mail.sel.clear(); else Mail.sel = new Set(Mail.msgs.map(m => m.id)); render(); },
  'gm-bulk': el => { const k = el.dataset.k; if (k === 'trash' && !confirm(Lx(Mail.sel.size + ' mail çöpe atılsın mı? (30 gün içinde geri alınabilir)', 'Move ' + Mail.sel.size + ' emails to trash? (Recoverable for 30 days)'))) return; gmBulk(k); },
  'gm-open-top': el => { S.tab = 'mail'; S.mailSub = 'inbox'; render(); openMail(el.dataset.id); },
  'gm-star': async el => {
    const m = gmFind(el.dataset.id); if (!m) return; const on = m.labels.includes('STARRED');
    m.labels = on ? m.labels.filter(x => x !== 'STARRED') : m.labels.concat('STARRED');
    if ($('#sheetRoot.open')) { const b = $('#sheetRoot [data-act=gm-star] span'); if (b) b.textContent = tr(on ? 'Yıldızla' : 'Yıldızı kaldır'); } else render();
    try { await Mail.modify(m.id, on ? [] : ['STARRED'], on ? ['STARRED'] : []); toast(tr(on ? 'Yıldız kaldırıldı' : 'Yıldızlandı')); } catch (e) { toast(e.message); }
  },
  'gm-archive': async el => {
    const m = gmFind(el.dataset.id); if (!m) return;
    try { await Mail.modify(m.id, [], ['INBOX']); gmDropLocal(m.id); if ($('#sheetRoot.open')) closeSheet(); else render();
      toast(tr('Arşivlendi'), { label: tr('Geri al'), fn: async () => { await Mail.modify(m.id, ['INBOX'], []); Mail.fetchedAt = 0; render(); } }); Mail.refreshCounts();
    } catch (e) { toast(e.message); }
  },
  'gm-trash': async el => {
    const m = gmFind(el.dataset.id); if (!m) return;
    try { await Mail.post('/messages/' + m.id + '/trash'); gmDropLocal(m.id); if ($('#sheetRoot.open')) closeSheet(); else render();
      toast(tr('Çöp kutusuna taşındı'), { label: tr('Geri al'), fn: async () => { await Mail.post('/messages/' + m.id + '/untrash'); Mail.fetchedAt = 0; render(); } }); Mail.refreshCounts();
    } catch (e) { toast(e.message); }
  },
  'gm-unread': async el => { const m = gmFind(el.dataset.id); if (!m) return; try { await Mail.modify(m.id, ['UNREAD'], []); if (!m.labels.includes('UNREAD')) m.labels = m.labels.concat('UNREAD'); closeSheet(); toast(tr('Okunmadı olarak işaretlendi')); Mail.refreshCounts(); } catch (e) { toast(e.message); } },
  'gm-gmail': el => { const m = gmFind(el.dataset.id); if (m) window.open(gmLink(m), '_blank', 'noopener'); },
  'gm-task': async el => {
    const m = gmFind(el.dataset.id); if (!m) return;
    const t = { id: uid(), type: 'task', title: m.subject || tr('(konusuz)'), notes: (m.from.name ? m.from.name + ' <' + m.from.email + '>' : m.from.email) + '\n' + gmLink(m), due: null, time: null, priority: 0, repeat: 'none', tags: [], done: false };
    await save(t, { silent: true }); toast(tr('Göreve eklendi'), { label: tr('Aç'), fn: () => { closeSheet(); setTimeout(() => editTask(t), 50); } });
  },
  'gm-note': async el => {
    const m = gmFind(el.dataset.id); if (!m) return;
    const n = { id: uid(), type: 'note', kind: 'text', title: m.subject || tr('(konusuz)'), body: (m.from.name || m.from.email) + ' · ' + new Date(m.date).toLocaleString(TR, { dateStyle: 'medium', timeStyle: 'short' }) + '\n\n' + gmBody(m) + '\n\n' + gmLink(m), tags: [], pinned: false };
    await save(n, { silent: true }); toast(tr('Nota eklendi'), { label: tr('Aç'), fn: () => { closeSheet(); setTimeout(() => openNote(n), 50); } });
  },
  'gm-event': el => {
    const m = gmFind(el.dataset.id); if (!m) return; closeSheet();
    setTimeout(() => { editEvent(null, today()); const t = $('#sheetRoot [name=title]'); if (t) t.value = m.subject || ''; const n = $('#sheetRoot [name=notes]'); if (n) n.value = (m.from.name || m.from.email) + '\n' + gmLink(m); if (S.draft) { S.draft.title = m.subject || ''; } }, 50);
  },
  'gm-reply': el => { const m = gmFind(el.dataset.id); if (!m) return; if (!gopt('reply')) return; gmNeedTok(GM_SEND, () => replyBox(m)); },
  'gm-reply-cancel': () => { const b = $('#gmReply'); if (b) b.innerHTML = ''; },
  'gm-quick': el => { const t = $('#gmText'); if (t) { t.value = (t.value ? t.value + '\n' : '') + el.dataset.v; t.focus(); } },
  'gm-send': el => {
    const m = gmFind(el.dataset.id); const text = ($('#gmText') || {}).value || ''; if (!m || !text.trim()) return toast(tr('Önce cevabını yaz'));
    gmNeedTok(GM_SEND, async () => { el.disabled = true; try { await gmSend(m, text.trim()); $('#gmReply').innerHTML = ''; toast(tr('Cevap gönderildi')); } catch (e) { el.disabled = false; toast(e.message); } });
  },
  'gm-promo': async el => {
    const k = el.dataset.k;
    try {
      const ids = await Mail.ids('in:inbox category:promotions' + (k === 'read' ? ' is:unread' : ''), 5000);
      if (!ids.length) return toast(tr('İşlenecek mail yok'));
      if (!confirm(k === 'read' ? Lx(ids.length + ' promosyon maili okundu yapılsın mı?', 'Mark ' + ids.length + ' promotions as read?') : Lx(ids.length + ' promosyon maili arşivlensin mi?', 'Archive ' + ids.length + ' promotions?'))) return;
      if (k === 'read') await Mail.batch(ids, [], ['UNREAD']); else await Mail.batch(ids, [], ['INBOX']);
      toast(Lx(ids.length + ' mail ' + (k === 'read' ? 'okundu yapıldı' : 'arşivlendi'), ids.length + ' emails ' + (k === 'read' ? 'marked as read' : 'archived'))); Mail.fetchedAt = 0; Mail.fetchList(); Mail.refreshCounts();
    } catch (e) { toast(e.message); }
  },
  'gm-scan': () => gmScan(),
  'gm-sub': el => openSub(+el.dataset.i),
  'gm-unsub': el => { const s = Mail.subs[+el.dataset.i]; if (s) gmUnsubDo(s); },
  'gm-sub-bulk': el => { const s = Mail.subs[+el.dataset.i]; if (s) gmSubBulk(s, el.dataset.k); },
  'gm-filter': el => { const s = Mail.subs[+el.dataset.i]; if (s) gmFilterToggle(s.email, s.name); },
  'gm-clean-del': el => { if (ask('Bu gönderen için otomatik arşivleme kapatılsın mı?')) gmFilterToggle(el.dataset.e); }
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'gmSearch') { e.preventDefault(); Mail.q = f.q.value.trim(); Mail.msgs = []; Mail.next = null; Mail.err = ''; render(); }
  else if (f.id === 'gmCleanAdd') { e.preventDefault(); const v = f.q.value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+$/.test(v)) return toast(tr('Geçerli bir e-posta adresi yaz')); if ((gmSet().filters || {})[v]) return toast(tr('Bu gönderen zaten listede')); gmFilterToggle(v); }
}, true);

/* ===================== İngilizce metinler ===================== */
(function () {
  const add = {
    'Posta': 'Mail', 'Gmail bağlı değil': 'Gmail is not connected', 'Gelen kutun, aboneliklerin ve otomatik temizlik burada olur. Mailler cihaza ya da Drive’a kaydedilmez, her seferinde Gmail’den okunur.': 'Your inbox, subscriptions and auto clean-up live here. Emails are not stored on the device or in Drive; they are read from Gmail each time.',
    'Gmail’i bağla': 'Connect Gmail', 'Hata alırsan: Google Cloud’da PUSULA projesinde': 'If you get an error: in Google Cloud, in the PUSULA project make sure', '’nin açık olduğundan emin ol.': ' is enabled.',
    'Gelen kutusu': 'Inbox', 'Abonelikler': 'Subscriptions', 'Otomatik temizlik': 'Auto clean-up', 'Zilde önemli mail sayısı': 'Important mail count in the bell', 'Mailde arama': 'Mail search', 'Kategoriler': 'Categories',
    'Maili takvim etkinliğine çevir': 'Turn email into a calendar event', 'Maili nota çevir': 'Turn email into a note', 'Bugün ekranında posta kartı': 'Mail card on Today screen', 'Hazır kısa cevaplar': 'Quick replies', 'Promosyonlarda toplu temizlik': 'Bulk clean-up in Promotions', 'Cevap verme': 'Replying',
    'Son mailleri gör; arşivle, çöpe at, yıldızla, göreve çevir, Gmail’de aç': 'See recent emails; archive, trash, star, turn into a task, open in Gmail',
    'Sık mail atan gönderenler; abonelikten çık, eski maillerini toplu arşivle ya da çöpe at': 'Frequent senders; unsubscribe, bulk archive or trash their old emails',
    'Seçtiğin gönderenlerin gelecek mailleri otomatik arşivlenir': 'Future emails from senders you pick are archived automatically', 'Okunmamış önemli mailler uyarılarda görünür': 'Unread important emails show in alerts',
    'Birincil, Promosyonlar, Sosyal, Güncellemeler': 'Primary, Promotions, Social, Updates', 'Okunmamış mail sayısı ve son mailler': 'Unread count and latest emails', 'Cevap verme açıkken görünür': 'Shown when replying is on',
    'Hepsini okundu yap, hepsini arşivle': 'Mark all read, archive all', 'Açınca Google bir kez mail gönderme izni ister': 'Google asks once for permission to send email when you turn this on',
    'Ana özellikler': 'Main features', 'Ek özellikler': 'Extra features', 'Gmail bağlı': 'Gmail connected', 'Bu cihazda bağlı. Diğer cihazda da bir kez bağlaman gerekir.': 'Connected on this device. Connect once on your other device too.',
    'Bağlantıyı kes': 'Disconnect', 'Bağla': 'Connect', 'Gmail API Google Cloud’da açık olmalı.': 'Gmail API must be enabled in Google Cloud.',
    'Mailler cihaza ya da Drive yedeğine kaydedilmez. Silinen mailler kalıcı silinmez, Gmail’de çöp kutusuna gider.': 'Emails are not stored on the device or in the Drive backup. Deleted emails go to Gmail’s trash, not permanently deleted.',
    'Tümü': 'All', 'Birincil': 'Primary', 'Promosyonlar': 'Promotions', 'Sosyal': 'Social', 'Güncellemeler': 'Updates', 'Hepsini okundu yap': 'Mark all read', 'Hepsini arşivle': 'Archive all',
    'okunmamış': 'unread', 'Yükleniyor…': 'Loading…', 'Sonuç yok.': 'No results.', 'Gelen kutusu boş. Tebrikler!': 'Inbox is empty. Congrats!', 'Daha fazla': 'More', '(konusuz)': '(no subject)',
    'Mailde ara (gönderen, konu, kelime)…': 'Search mail (sender, subject, word)…', 'Posta için internet gerekli.': 'Mail needs an internet connection.',
    'Google oturumunun süresi doldu. Devam etmek için dokun.': 'Your Google session expired. Tap to continue.', 'Oturumu yenile': 'Renew session', 'Ayarlar > Gmail’den en az bir özellik aç.': 'Turn on at least one feature in Settings > Gmail.',
    'Cevapla': 'Reply', 'Arşivle': 'Archive', 'Çöpe at': 'Trash', 'Yıldızla': 'Star', 'Yıldızı kaldır': 'Unstar', 'Okunmadı yap': 'Mark unread', 'Göreve çevir': 'Make a task', 'Takvime ekle': 'Add to calendar', 'Nota çevir': 'Make a note', 'Gmail’de aç': 'Open in Gmail',
    'Ekler Gmail’de': 'Attachments in Gmail', 'Kime:': 'To:', 'Cevabını yaz…': 'Write your reply…', 'Vazgeç': 'Cancel', 'Gönder': 'Send',
    'Son 6 ayda abonelik maili atan gönderenler. Tarama mail başlıklarına bakar, hiçbir şey kaydedilmez.': 'Senders of subscription emails in the last 6 months. The scan only reads headers; nothing is stored.',
    'Taranıyor…': 'Scanning…', 'Abonelikleri tara': 'Scan subscriptions', 'gönderen': 'senders', 'Abonelik maili bulunamadı.': 'No subscription emails found.', 'Çıkıldı': 'Unsubscribed', 'Otomatik arşiv': 'Auto archive', 'mail': 'emails',
    'Abonelikten çık': 'Unsubscribe', 'Tekrar abonelikten çık': 'Unsubscribe again', 'Gelen kutusundaki maillerini arşivle': 'Archive their inbox emails', 'Tüm maillerini çöpe at': 'Trash all their emails',
    'Gelecek maillerini otomatik arşivle': 'Auto-archive future emails', 'Otomatik arşivlemeyi kapat': 'Turn off auto archive', 'Çöpe atılan mailler Gmail’de 30 gün çöp kutusunda kalır, istersen geri alabilirsin.': 'Trashed emails stay in Gmail’s trash for 30 days; you can restore them.',
    'Buradaki gönderenlerin yeni mailleri gelen kutuna düşmez, Gmail’de “Tüm postalar”da durur. Abonelikler sekmesinden de ekleyebilirsin.': 'New emails from these senders skip your inbox and stay in “All Mail”. You can also add senders from Subscriptions.',
    'Gönderen e-posta adresi': 'Sender email address', 'Henüz otomatik arşivlenen gönderen yok.': 'No auto-archived senders yet.', 'okunmamış mail': 'unread emails', 'önemli': 'important', 'Okunmamış mail yok.': 'No unread emails.',
    'Google girişi hazırlanıyor, birkaç saniye sonra tekrar dokun': 'Google sign-in is loading, tap again in a few seconds', 'İzin verilmedi': 'Permission not granted', 'Gmail izni verilmedi.': 'Gmail permission not granted.', 'Gmail bağlandı': 'Gmail connected',
    'Bağlanmak için internet gerekli.': 'Internet is needed to connect.', 'Google girişi hazırlanıyor… birkaç saniye sonra tekrar bas.': 'Google sign-in is loading… tap again in a few seconds.', 'Google penceresi açılıyor…': 'Opening Google window…',
    'Bu cihazda Gmail bağlantısı kesilsin mi? Maillerin etkilenmez.': 'Disconnect Gmail on this device? Your emails are not affected.', 'Cevap verme açıldı': 'Replying turned on',
    'Yıldız kaldırıldı': 'Star removed', 'Yıldızlandı': 'Starred', 'Arşivlendi': 'Archived', 'Geri al': 'Undo', 'Çöp kutusuna taşındı': 'Moved to trash', 'Okunmadı olarak işaretlendi': 'Marked as unread',
    'Göreve eklendi': 'Added as a task', 'Aç': 'Open', 'Nota eklendi': 'Saved as a note', 'Önce cevabını yaz': 'Write your reply first', 'Cevap gönderildi': 'Reply sent', 'İşlenecek mail yok': 'No emails to process',
    'Abonelikten çıkış isteği gönderildi': 'Unsubscribe request sent', 'İstek gönderilemedi, internetini kontrol et': 'Request failed, check your internet', 'Bu gönderen çıkış için mail istiyor. PUSULA senin adına çıkış maili göndersin mi?': 'This sender needs an email to unsubscribe. Should PUSULA send it for you?',
    'Çıkış maili gönderildi': 'Unsubscribe email sent', 'Çıkış sayfası açıldı, işlemi orada onayla': 'Unsubscribe page opened, confirm it there', 'Bu gönderende çıkış bağlantısı yok. Otomatik arşivlemeyi kullanabilirsin.': 'This sender has no unsubscribe link. You can use auto archive.',
    'Mailler sayılıyor…': 'Counting emails…', 'Otomatik arşivleme kapatıldı': 'Auto archive turned off', 'Gelecek mailleri otomatik arşivlenecek': 'Future emails will be archived automatically',
    'Bu gönderen için otomatik arşivleme kapatılsın mı?': 'Turn off auto archive for this sender?', 'Geçerli bir e-posta adresi yaz': 'Enter a valid email address', 'Bu gönderen zaten listede': 'This sender is already listed',
    'Posta sekmesi': 'Mail tab', 'Seç': 'Select', 'Seçimi bitir': 'Done selecting', 'seçili': 'selected', 'Hepsini seç': 'Select all', 'Hiçbirini seçme': 'Select none', 'Okundu': 'Read', 'Okunmadı': 'Unread', 'Posta (Gmail bağlıyken)': 'Mail (when Gmail is connected)', 'Gmail gelen kutusu, abonelikler, otomatik temizlik': 'Gmail inbox, subscriptions, auto clean-up', 'Kaldır': 'Remove', 'Ara': 'Search', 'Yenile': 'Refresh', 'Yıldız': 'Star'
  };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
  EN_RX.push([/^(\d+) okunmamış önemli mail$/, '$1 unread important emails']);
})();
