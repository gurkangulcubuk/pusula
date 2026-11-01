'use strict';
/* PUSULA 1.19 — Kullanım kolaylıkları (sade tutuldu):
   1 sekmeye tekrar dokun → başa dön · 2 aşağı çek → yenile · 3 geri tuşu → Bugün · 4 bildirimden Tamamlandı/Ertele
   5 sesle ekleme · 6 büyük dokunma alanları · 7 tekrarlı iş ve ödemelerde kaydırma · 8 tek seferlik ipuçları
   9 sade hareket (animasyon ve dokunuş titreşimi kapalı) · 10 son işlemler ve geri al */

/* ----- 1 + 3: sekmeler ve geri tuşu ----- */
(function () {
  const orig = ACTIONS.tab;
  ACTIONS.tab = el => {
    const k = el.dataset.k;
    if (k === S.tab) { window.scrollTo({ top: 0, behavior: settings().calm ? 'auto' : 'smooth' }); return; }
    if (k !== 'today' && !(history.state && history.state.tab)) history.pushState({ tab: 1 }, '');
    if (k === 'today' && history.state && history.state.tab) { S.ignorePop = true; history.back(); }
    orig(el);
  };
  const cs = ACTIONS['close-settings'];
  if (cs) ACTIONS['close-settings'] = el => { cs(el); if (S.tab === 'today' && history.state && history.state.tab) { S.ignorePop = true; history.back(); } };
  const os = ACTIONS['open-settings'];
  if (os) ACTIONS['open-settings'] = el => { if (!(history.state && history.state.tab)) history.pushState({ tab: 1 }, ''); os(el); };
})();
window.addEventListener('popstate', () => {
  if (S.ignorePop) { S.ignorePop = false; return; }
  const st = history.state; if (st && (st.tab || st.sheet)) return; // bir pencere kapandı; sekmede kal
  if (S.tab !== 'today') { S.tab = 'today'; window.scrollTo(0, 0); render(); }
});

/* ----- 2: aşağı çekip yenile ----- */
let PTR = null;
const ptrEl = () => { let e = $('#ptr'); if (!e) { e = document.createElement('div'); e.id = 'ptr'; e.innerHTML = icon('sync', 'sm'); document.body.appendChild(e); } return e; };
document.addEventListener('touchstart', e => {
  if (window.scrollY > 0 || $('#sheetRoot.open') || S.tab === 'settings' || e.touches.length !== 1) return;
  if (e.target.closest && e.target.closest('input,textarea,select,.nn-grid,.ink-wrap,.row[data-act=edit-task],.seg,.chips')) return;
  PTR = { y: e.touches[0].clientY, x: e.touches[0].clientX, dy: 0 };
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!PTR) return; const t = e.touches[0]; PTR.dy = t.clientY - PTR.y;
  if (Math.abs(t.clientX - PTR.x) > Math.abs(PTR.dy) || window.scrollY > 0) { PTR = null; ptrEl().className = ''; return; }
  if (PTR.dy <= 8) return; const d = Math.min(90, PTR.dy * 0.5), el = ptrEl();
  el.style.transform = 'translate(-50%,' + d + 'px) rotate(' + PTR.dy * 2 + 'deg)'; el.className = 'show' + (PTR.dy > 120 ? ' ready' : '');
}, { passive: true });
document.addEventListener('touchend', () => {
  if (!PTR) return; const ok = PTR.dy > 120; PTR = null; const el = ptrEl();
  if (!ok) { el.className = ''; el.style.transform = ''; return; }
  el.className = 'show spin'; el.style.transform = 'translate(-50%,46px)';
  ptrRefresh().finally(() => setTimeout(() => { el.className = ''; el.style.transform = ''; }, 500));
}, { passive: true });
async function ptrRefresh() {
  const g = Drive.on() || Cal.on() || (typeof Mail !== 'undefined' && Mail.on());
  if (typeof Mail !== 'undefined' && Mail.on() && S.tab === 'mail') { Mail.fetchedAt = 0; Mail.fetchList(); }
  if (g) { if (!navigator.onLine) return toast(tr('İnternet yok, bağlantı gelince eşitlenecek')); try { await gSync(true); } catch (e) { /* durum çubuğu gösterir */ } }
  else render();
  if (typeof fxLoad === 'function' && $('#fxInfo')) fxLoad(true);
}

/* ----- 4: bildirimden işlem (Tamamlandı / 10 dk ertele) ----- */
const REM_DONE_KINDS = ['task', 'rt', 'pay'];
function remActions(r) { return (REM_DONE_KINDS.includes(r.kind) ? [{ action: 'done', title: tr(r.kind === 'pay' ? 'Ödendi' : 'Tamamlandı') }] : []).concat([{ action: 'snooze', title: tr('10 dk ertele') }]); }
async function remAct(action, r) {
  if (!r) return; const id = String(r.key || '').split('|')[0];
  if (typeof remOpen !== 'undefined') { const i = remOpen.findIndex(x => x.key === r.key); if (i >= 0) remOpen.splice(i, 1); remRender(); }
  if (action === 'snooze') { REM_SNOOZE.push({ at: Date.now() + 10 * 60000, r: Object.assign({}, r, { key: r.key + '|s' + Date.now() }) }); return toast(tr('10 dakika sonra tekrar hatırlatılacak')); }
  if (action !== 'done') return;
  const it = S.items.get(id); if (!it || it.deleted) return;
  if (r.kind === 'task' && !it.done) await toggleTask(id);
  else if (r.kind === 'rt') await routineDone(id);
  else if (r.kind === 'pay' && typeof regPay === 'function') { await regPay(it); render(); toast(Lx(it.title + ' kaydedildi', it.title + ' recorded')); }
}
if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => { const d = e.data || {}; if (d.pusula === 'rem') remAct(d.action, d.r); });
(function () { // uygulama kapalıyken bildirimden açıldıysa
  const orig = typeof handleLaunch === 'function' ? handleLaunch : null;
  window.handleLaunch = function () {
    let p; try { p = new URLSearchParams(location.search); } catch (e) { p = null; }
    if (p && p.get('go') === 'rem') { let r = null; try { r = JSON.parse(p.get('r') || 'null'); } catch (e) { /* bozuk */ } try { history.replaceState(null, '', location.pathname); } catch (e) { /* yok */ } setTimeout(() => remAct(p.get('a'), r), 600); return; }
    if (orig) orig();
  };
})();

/* ----- 5: sesle ekleme ----- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
(function () {
  if (!SR || typeof smartAddHtml !== 'function') return;
  const orig = smartAddHtml;
  window.smartAddHtml = function () { return orig().replace('<button class="icon-btn" type="submit"', '<button class="icon-btn sa-mic" type="button" data-act="sa-mic" aria-label="' + esc(tr('Sesle ekle')) + '">' + icon('mic', 'sm') + '</button><button class="icon-btn" type="submit"'); };
})();
Object.assign(ICONS, { mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>' });
let srOn = null;
function micStart(btn) {
  if (srOn) { try { srOn.stop(); } catch (e) { /* yok */ } return; }
  const rec = new SR(); rec.lang = isEn() ? 'en-US' : 'tr-TR'; rec.interimResults = true; rec.maxAlternatives = 1; srOn = rec;
  const inp = $('#smartAdd input'); btn.classList.add('rec');
  rec.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; if (inp) { inp.value = t; inp.dispatchEvent(new Event('input', { bubbles: true })); } };
  rec.onerror = e => { if (e.error === 'not-allowed') toast(tr('Mikrofon izni verilmedi')); else if (e.error !== 'no-speech' && e.error !== 'aborted') toast(tr('Ses tanınamadı')); };
  rec.onend = () => { srOn = null; btn.classList.remove('rec'); if (inp) inp.focus(); };
  try { rec.start(); } catch (e) { srOn = null; btn.classList.remove('rec'); }
}

/* ----- 6 + 9: büyük dokunma ve sade hareket ----- */
function uxSwitches(st) {
  const sw = (k, t, d) => '<div class="set-row"><div class="grow"><div>' + t + '</div><div class="sub">' + d + '</div></div><button class="switch ' + (st[k] ? 'on' : '') + '" data-act="look" data-k="' + k + '" data-v="' + (st[k] ? 'false' : 'true') + '" aria-label="Aç/kapat"></button></div>';
  return sw('bigTouch', 'Büyük dokunma alanları', 'Düğmeler ve satırlar biraz büyür; tek elle kullanım kolaylaşır') + sw('calm', 'Sade hareket', 'Geçiş animasyonları ve dokunuş titreşimleri kapanır (hatırlatma titreşimi kalır)');
}
(function () {
  const orig = applyTheme;
  window.applyTheme = function () { orig.apply(this, arguments); const st = settings(), r = document.documentElement; r.dataset.big = st.bigTouch ? 'on' : 'off'; r.dataset.calm = st.calm ? 'on' : 'off'; };
  if (navigator.vibrate) { const v = navigator.vibrate.bind(navigator); navigator.vibrate = p => (settings().calm && typeof p === 'number' && p <= 60) ? false : v(p); }
})();

/* ----- 7: tekrarlı iş ve ödemelerde kaydırma ----- */
/* Görevlerdeki kaydırma ux.js'te. Burada: tekrarlı iş (sağa: yaptım, sola: 1 gün ertele), düzenli/planlı ödeme (sağa: ödendi/geldi). */
let SW2 = null, sw2At = 0;
const SW2_SEL = '.rt-row[data-act=rt-edit], .reg-row[data-act=reg-edit], .flow-row[data-act=reg-edit]';
document.addEventListener('pointerdown', e => { const row = e.target.closest && e.target.closest(SW2_SEL); if (!row || e.button > 0 || e.target.closest('button')) return; SW2 = { row, x: e.clientX, y: e.clientY, dx: 0, on: false, id: row.dataset.id, pay: !row.classList.contains('rt-row') }; }, true);
document.addEventListener('pointermove', e => {
  if (!SW2) return; const dx = e.clientX - SW2.x, dy = e.clientY - SW2.y;
  if (!SW2.on) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { SW2 = null; return; } if (Math.abs(dx) < 12) return; SW2.on = true; SW2.row.classList.add('swiping'); }
  SW2.dx = Math.max(SW2.pay ? 0 : -140, Math.min(140, dx)); SW2.row.style.transform = 'translateX(' + SW2.dx + 'px)';
  SW2.row.classList.toggle('sw-r', SW2.dx > 70); SW2.row.classList.toggle('sw-l', SW2.dx < -70);
}, true);
async function sw2End() {
  if (!SW2) return; const s = SW2; SW2 = null; if (!s.on) return;
  sw2At = Date.now(); s.row.style.transform = ''; s.row.classList.remove('swiping', 'sw-r', 'sw-l');
  const it = S.items.get(s.id); if (!it) return;
  if (s.dx > 70) {
    if (navigator.vibrate) navigator.vibrate(20);
    if (!s.pay) return routineDone(s.id);
    return payWithUndo(it);
  } else if (s.dx < -70 && !s.pay && it.next) {
    const before = it.next; it.next = addDays(it.next < today() ? today() : it.next, 1); await save(it); Cal.upsertRoutine(it);
    toast(Lx('Ertelendi · ', 'Postponed · ') + relDay(it.next), { label: tr('Geri al'), fn: async () => { it.next = before; await save(it); Cal.upsertRoutine(it); } });
  }
}
document.addEventListener('pointerup', sw2End, true);
document.addEventListener('pointercancel', () => { if (SW2) { SW2.row.style.transform = ''; SW2.row.classList.remove('swiping', 'sw-r', 'sw-l'); SW2 = null; } }, true);
document.addEventListener('click', e => { if (Date.now() - sw2At < 400 && e.target.closest && e.target.closest(SW2_SEL)) { e.stopPropagation(); e.preventDefault(); } }, true);

async function payWithUndo(it) { // ödendi/geldi: geri alınabilir
  if (!it || !it.next) return; const before = it.next, tid = 'rp:' + it.id + ':' + before; const had = S.items.get(tid);
  await regPay(it); render();
  toast(Lx(it.title + ' kaydedildi', it.title + ' recorded') + (it.next ? ' · ' + Lx('sonraki: ', 'next: ') + relDay(it.next) : ''), { label: tr('Geri al'), fn: async () => { const t = S.items.get(tid); if (t && !t.deleted && !(had && !had.deleted)) await remove(t, { silent: true }); it.next = before; await save(it); regMirror(it); } });
}
ACTIONS['reg-pay'] = el => payWithUndo(S.items.get(el.dataset.id));

/* ----- 8: tek seferlik ipuçları ----- */
const TIPS = {
  today: 'Görevi sağa kaydır: tamamlanır · sola kaydır: yarına ertelenir. Kart başlığına dokununca kart kapanır.',
  'plan:tasks': 'Sağa kaydır: tamamla · sola kaydır: yarına ertele. Alttaki sekmeye tekrar dokununca başa dönersin.',
  'plan:calendar': 'Üstten ay, hafta ve gün görünümü arasında geçebilirsin; bir güne dokununca o günün işleri açılır.',
  'plan:routines': 'Sağa kaydır: yaptım · sola kaydır: bir gün ertele.',
  money: 'Her harcamayı yazman gerekmez: Hesaplar’da “Bakiyeleri güncelle” ile bankadaki bakiyeyi yaz. Ödemeyi sağa kaydırınca ödendi sayılır.',
  info: 'Üstteki arama simgesi notların, görevlerin ve harcamaların hepsinde arar.',
  mail: 'Bir maile basılı tutunca çoklu seçim açılır. Sayfanın en üstünde aşağı çekince yenilenir.',
  tools: 'Odak sayacını kapatsan da süre bitince bildirim gelir (Google Takvim bağlıysa).'
};
const tipSeen = () => { try { return JSON.parse(lsGet('pusula.tips', '[]')) || []; } catch (e) { return []; } };
(function () {
  const orig = render;
  window.render = function () {
    orig.apply(this, arguments);
    const k = S.tab === 'plan' ? 'plan:' + S.planSub : S.tab; const t = TIPS[k]; const v = $('#view');
    if (!t || !v || tipSeen().includes(k)) return;
    v.insertAdjacentHTML('afterbegin', '<div class="tip"><span>' + esc(tr(t)) + '</span><button class="icon-btn" data-act="tip-x" data-k="' + esc(k) + '" aria-label="Kapat">' + icon('x', 'sm') + '</button></div>');
  };
})();

/* ----- 10: son işlemler ve geri al ----- */
const UNDO = [];
(function () {
  const orig = toast;
  window.toast = function (msg, action, ms) {
    if (action && action.fn && /^(Geri al|Undo)$/i.test(String(action.label || '').trim())) {
      const e = { at: Date.now(), msg, fn: action.fn, done: false }; UNDO.unshift(e); UNDO.length = Math.min(UNDO.length, 20);
      const fn = action.fn; action = Object.assign({}, action, { fn: async () => { if (e.done) return; e.done = true; await fn(); } }); e.run = action.fn;
    }
    return orig.call(this, msg, action, ms);
  };
})();
function openUndo() {
  const rows = UNDO.map((e, i) => '<div class="row undo-row ' + (e.done ? 'done' : '') + '"><div class="row-main"><div class="row-title u">' + esc(e.msg) + '</div><div class="row-meta">' + new Date(e.at).toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' }) + '</div></div>' +
    (e.done ? '<span class="muted sm">' + tr('geri alındı') + '</span>' : '<button class="btn sm-btn" data-act="undo-run" data-i="' + i + '">' + tr('Geri al') + '</button>') + '</div>').join('');
  openSheet(sheetHead('Son işlemler') + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">' + tr('Bu oturumda geri alınabilen son 20 işlem. Uygulama kapanınca liste sıfırlanır.') + '</p>' + (rows ? '<div class="card">' + rows + '</div>' : '<div class="empty">' + tr('Henüz geri alınabilecek bir işlem yok.') + '</div>') + '</div>');
}
(function () { // Bugün'ün altında: Haftalık özet · Son işlemler
  const orig = viewToday;
  window.viewToday = function () {
    const h = orig(), b = '<button class="link week-link"';
    const undo = '<button class="link week-link" data-act="undo-open">' + icon('undo', 'sm') + ' <span>' + tr('Son işlemler') + '</span></button>';
    return h.includes(b) ? h.replace(b, '<div class="foot-links">' + b) + undo + '</div>' : h + '<div class="foot-links">' + undo + '</div>';
  };
})();

Object.assign(ACTIONS, {
  'sa-mic': el => micStart(el),
  'tip-x': el => { const s = tipSeen(); s.push(el.dataset.k); lsSet('pusula.tips', JSON.stringify(s)); const t = el.closest('.tip'); if (t) t.remove(); },
  'undo-open': () => openUndo(),
  'undo-run': async el => { const e = UNDO[+el.dataset.i]; if (!e || e.done) return; await e.run(); toast(tr('Geri alındı')); openUndo(); }
});

(function () {
  const add = { 'İnternet yok, bağlantı gelince eşitlenecek': 'No internet; will sync when online', 'Tamamlandı': 'Done', 'Ödendi': 'Paid', '10 dk ertele': 'Snooze 10 min', 'Sesle ekle': 'Add by voice', 'Mikrofon izni verilmedi': 'Microphone permission denied', 'Ses tanınamadı': 'Could not recognize speech',
    'Büyük dokunma alanları': 'Larger touch targets', 'Düğmeler ve satırlar biraz büyür; tek elle kullanım kolaylaşır': 'Buttons and rows get a bit bigger; easier one-handed use', 'Sade hareket': 'Calm motion', 'Geçiş animasyonları ve dokunuş titreşimleri kapanır (hatırlatma titreşimi kalır)': 'Turns off transition animations and tap vibrations (reminder vibration stays)',
    'Görevi sağa kaydır: tamamlanır · sola kaydır: yarına ertelenir. Kart başlığına dokununca kart kapanır.': 'Swipe a task right to complete, left to postpone. Tap a card title to collapse it.',
    'Sağa kaydır: tamamla · sola kaydır: yarına ertele. Alttaki sekmeye tekrar dokununca başa dönersin.': 'Swipe right: done · left: tomorrow. Tap the tab again to jump to the top.',
    'Üstten ay, hafta ve gün görünümü arasında geçebilirsin; bir güne dokununca o günün işleri açılır.': 'Switch between month, week and day at the top; tap a day to see its items.',
    'Sağa kaydır: yaptım · sola kaydır: bir gün ertele.': 'Swipe right: done · left: postpone a day.',
    'Her harcamayı yazman gerekmez: Hesaplar’da “Bakiyeleri güncelle” ile bankadaki bakiyeyi yaz. Ödemeyi sağa kaydırınca ödendi sayılır.': 'No need to log every expense: use “Update balances” in Accounts. Swipe a payment right to mark it paid.',
    'Üstteki arama simgesi notların, görevlerin ve harcamaların hepsinde arar.': 'The search icon at the top searches notes, tasks and spending.',
    'Bir maile basılı tutunca çoklu seçim açılır. Sayfanın en üstünde aşağı çekince yenilenir.': 'Long-press an email to select several. Pull down at the top to refresh.',
    'Odak sayacını kapatsan da süre bitince bildirim gelir (Google Takvim bağlıysa).': 'Even if you close the focus timer, you get notified when time is up (with Google Calendar).',
    'geri alındı': 'undone', 'Son işlemler': 'Recent actions', 'Bu oturumda geri alınabilen son 20 işlem. Uygulama kapanınca liste sıfırlanır.': 'The last 20 undoable actions in this session. The list resets when the app closes.', 'Henüz geri alınabilecek bir işlem yok.': 'Nothing to undo yet.', 'Geri alındı': 'Undone' };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
