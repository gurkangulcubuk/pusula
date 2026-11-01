'use strict';
/* PUSULA — Cüzdan: gelir/gider, işe bağlı kazanç, düzenli ödemeler, hesaplar, toplu yazma, ekstre içe aktarma.
   Kayıtlar: tx (hareket), regpay (düzenli kalem), acct (hesap). Kategoriler settings.moneyCats'te. Para birimi TL. */
Object.assign(ICONS, {
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M16 13.5h2.5"/>',
  income: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  expense: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  xfer: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  upload2: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  lines: '<path d="M5 7h14M5 12h14M5 17h9"/>'
});

/* ----- yardımcılar ----- */
function parseTL(v) {
  if (typeof v === 'number') return v;
  let s = String(v == null ? '' : v).trim().replace(/\s|₺|TL|TRY/gi, '');
  if (!s) return NaN;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/-$/.test(s)) { neg = true; s = s.slice(0, -1); }
  if (/^[-−]/.test(s)) { neg = true; s = s.slice(1); } else if (/^\+/.test(s)) s = s.slice(1);
  if (s.includes(',') && s.includes('.')) { if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); }
  else if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s); return isNaN(n) ? NaN : (neg ? -n : n);
}
const fmtTL = (n, sign) => { const a = Math.abs(n || 0); const t = a.toLocaleString('tr-TR', { minimumFractionDigits: a % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' ₺'; return sign ? (n > 0 ? '+' : n < 0 ? '−' : '') + t : (n < 0 ? '−' : '') + t; };
const mid = () => Math.random().toString(36).slice(2, 9);
const monthOf = d => d.slice(0, 7);
const monthLabel = m => parseYmd(m + '-01').toLocaleDateString(TR, { month: 'long', year: 'numeric' });
const shiftM = (m, n) => { const d = parseYmd(m + '-01'); d.setMonth(d.getMonth() + n); return ymd(d).slice(0, 7); };

/* ----- kategoriler ----- */
const CAT_BASE = [
  ['market', 'out', 'Market', '#30A46C', 'market,migros,a101,bim,şok,sok,carrefour,file,bakkal,manav,kasap,fırın,macrocenter,metro gross'],
  ['food', 'out', 'Yeme-içme', '#F5A524', 'kafe,cafe,restoran,restaurant,yemek,getir,yemeksepeti,trendyol yemek,kahve,starbucks,burger,pizza,döner,lokanta'],
  ['transport', 'out', 'Ulaşım', '#3E63DD', 'benzin,akaryakıt,mazot,shell,opet,bp,petrol ofisi,po,taksi,uber,bitaksi,otobüs,metro,istanbulkart,otopark,hgs,ogs,köprü,otoyol,thy,pegasus,uçak'],
  ['bills', 'out', 'Fatura', '#12A594', 'elektrik,enerjisa,ck enerji,su,iski,aski,doğalgaz,dogalgaz,igdaş,igdas,internet,superonline,turkcell,vodafone,türk telekom,turk telekom,fatura,telefon'],
  ['rent', 'out', 'Kira ve aidat', '#8E4EC6', 'kira,aidat,site yönetimi'],
  ['health', 'out', 'Sağlık', '#E5484D', 'eczane,hastane,doktor,ilaç,klinik,diş,sağlık'],
  ['clothes', 'out', 'Giyim', '#D6409F', 'zara,lcw,lc waikiki,h&m,koton,defacto,mavi,giyim,ayakkabı,boyner'],
  ['fun', 'out', 'Eğlence', '#F76B15', 'sinema,konser,tiyatro,bilet,biletix,oyun,steam,playstation'],
  ['subs', 'out', 'Abonelik', '#0090FF', 'netflix,spotify,youtube,disney,apple,icloud,google one,amazon prime,exxen,blutv,gain,abonelik'],
  ['home', 'out', 'Ev', '#AD7F58', 'ikea,koçtaş,koctas,mobilya,beyaz eşya,teknosa,mediamarkt,vatan'],
  ['edu', 'out', 'Eğitim', '#6E56CF', 'kurs,kitap,okul,eğitim,udemy,ders ücreti'],
  ['other', 'out', 'Diğer gider', '#8B8D98', ''],
  ['salary', 'in', 'Maaş', '#30A46C', 'maaş,maas,salary,ücret ödemesi'],
  ['side', 'in', 'Ek gelir', '#12A594', 'ders,özel ders,freelance,proje,danışmanlık,satış,kira geliri,prim'],
  ['refund', 'in', 'İade', '#3E63DD', 'iade,refund,cashback,geri ödeme'],
  ['otherin', 'in', 'Diğer gelir', '#8B8D98', '']
];
function mcats() {
  const st = settings();
  if (!Array.isArray(st.moneyCats)) st.moneyCats = CAT_BASE.map(c => ({ id: c[0], dir: c[1], name: c[2], color: c[3], kw: c[4] }));
  return st.moneyCats;
}
const mcat = id => mcats().find(c => c.id === id) || { id: '', name: tr('Kategorisiz'), color: '#8B8D98', dir: 'out' };
// kelime başında eşleşir ("migros'tan", "faturası" tutar); 3 harf ve altı tam kelime olmalı ("su" ≠ "susam")
const kwRx = {};
const norm = x => lower(x).replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function kwHit(t, k) { const r = kwRx[k] || (kwRx[k] = new RegExp('(^|[^\\p{L}\\p{N}])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (k.length <= 3 ? '(?![\\p{L}\\p{N}])' : ''), 'u')); return r.test(t); }
function guessCat(text, dir) {
  const t = ' ' + norm(text || '') + ' ';
  let best = null, len = 0;
  mcats().forEach(c => { if (dir && c.dir !== dir) return; (c.kw || '').split(',').map(x => norm(x.trim())).filter(Boolean).forEach(k => { if (k.length > len && kwHit(t, k)) { best = c; len = k.length; } }); });
  return best;
}
const defCat = dir => (mcats().find(c => c.dir === dir && /^other/.test(c.id)) || mcats().find(c => c.dir === dir) || {}).id || '';

/* ----- hesaplar ----- */
const ACCT_KINDS = { bank: ['Banka', 'bank'], cash: ['Nakit', 'wallet'], card: ['Kredi kartı', 'wallet'], save: ['Birikim', 'bank'] };
const accts = () => list('acct').sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, TR));
const acctName = id => { const a = S.items.get(id); return a && !a.deleted ? a.name : ''; };
function acctBal(a) {
  let b = +a.opening || 0;
  list('tx').forEach(t => {
    if (a.openDate && t.date < a.openDate) return;
    if (t.dir === 'xfer') { if (t.acct === a.id) b -= t.amount; if (t.toAcct === a.id) b += t.amount; }
    else if (t.acct === a.id) b += t.dir === 'in' ? t.amount : -t.amount;
  });
  return Math.round(b * 100) / 100;
}
const defAcct = () => { const st = settings(); const a = st.moneyDefAcct && S.items.get(st.moneyDefAcct); return a && !a.deleted ? a.id : (accts().find(x => x.kind !== 'card') || accts()[0] || {}).id || ''; }; // varsayılan yoksa kredi kartı olmayan ilk hesap

const moneyOn = () => { const x = (settings().tabs || []).find(y => y.k === 'money'); return !x || x.on !== false; };
/* ----- işe bağlı tutar (görev ve tekrarlı iş) ----- */
function moneyEditor(m, item) {
  m = m || {}; const dir = m.dir || '';
  const cat0 = m.cat || (item && (guessCat(item.title, dir || 'out') || {}).id) || defCat(dir || 'out');
  const tot = item ? list('tx').filter(t => t.link && t.link.id === item.id) : [];
  const sum = tot.reduce((a, t) => a + (t.dir === 'in' ? t.amount : -t.amount), 0);
  return '<div class="field money-ed"><span>Para (isteğe bağlı)</span>' + seg('mDir', [['', 'Yok'], ['in', 'Gelir'], ['out', 'Gider']], dir) +
    '<div class="money-ed-body ' + (dir ? '' : 'hide') + '"><div class="field-row"><label class="field"><span>Tutar (₺)</span><input class="input" name="mAmt" inputmode="decimal" placeholder="0" value="' + (m.amount ? numIn(m.amount) : '') + '"></label>' +
    '<label class="field"><span>Kategori</span><select class="input" name="mCat">' + catOptions(dir || 'out', cat0) + '</select></label></div>' +
    (accts().length ? '<label class="field"><span>Hesap</span><select class="input" name="mAcct">' + acctOptions(m.acct || defAcct()) + '</select></label>' : '') +
    '<div class="sub muted sm">İşi “tamamladım / yaptım” diye işaretleyince bu tutar Cüzdan’a kendiliğinden kaydedilir.</div></div>' +
    (tot.length ? '<div class="money-total"><span>' + tr('Bu işten toplam') + '</span><b class="' + (sum >= 0 ? 'pos' : 'neg') + '">' + fmtTL(sum, true) + '</b><span class="muted sm">' + tot.length + ' ' + tr('kayıt') + '</span></div>' : '') + '</div>';
}
function catOptions(dir, sel) { return mcats().filter(c => c.dir === dir).map(c => '<option value="' + c.id + '" ' + (c.id === sel ? 'selected' : '') + '>' + esc(c.name) + '</option>').join(''); }
function acctOptions(sel, none) { return (none ? '<option value="">—</option>' : '') + accts().map(a => '<option value="' + a.id + '" ' + (a.id === sel ? 'selected' : '') + '>' + esc(a.name) + '</option>').join(''); }
function readMoney() {
  const dir = segVal('mDir') || ''; if (!dir) return null;
  const amount = Math.abs(parseTL(fval('mAmt'))); if (!(amount > 0)) return null;
  return { dir, amount, cat: fval('mCat') || defCat(dir), acct: fval('mAcct') || defAcct() };
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#sheetRoot .seg[data-name=mDir] button'); if (!b) return;
  setTimeout(() => { const d = segVal('mDir') || ''; const body = $('#sheetRoot .money-ed-body'); if (body) body.classList.toggle('hide', !d); const sel = $('#sheetRoot [name=mCat]'); if (sel && d) sel.innerHTML = catOptions(d, (guessCat(fval('title'), d) || {}).id || defCat(d)); }, 0);
});
function moneyChip(item) { const m = item && item.money; return m && m.amount ? '<span class="mchip ' + m.dir + '">' + fmtTL(m.dir === 'in' ? m.amount : -m.amount, true) + '</span>' : ''; }
/* İş tamamlanınca: bağlı tutarı kaydet; geri almada silmek için id döner */
function moneyOnDone(item, kind) {
  const m = item.money; if (!m || !(m.amount > 0)) return null;
  const t = { id: uid(), type: 'tx', date: today(), dir: m.dir, amount: m.amount, cat: m.cat || defCat(m.dir), acct: m.acct || defAcct(), note: item.title, link: { t: kind, id: item.id, title: item.title }, src: 'link' };
  save(t, { silent: true });
  setTimeout(() => toast(Lx((m.dir === 'in' ? 'Gelir' : 'Gider') + ' kaydedildi · ', (m.dir === 'in' ? 'Income' : 'Expense') + ' recorded · ') + fmtTL(m.dir === 'in' ? m.amount : -m.amount, true), { label: tr('Geri al'), fn: () => moneyUndo(t.id) }), 1800);
  return t.id;
}
// Görevin tiki elle kaldırılırsa bugün otomatik açılan kaydı da geri al
function moneyUndoLast(item) { const t = list('tx').filter(x => x.src === 'link' && x.link && x.link.id === item.id).sort((a, b) => (b.created || 0) - (a.created || 0))[0]; if (t) { moneyUndo(t.id); toast(tr('Bağlı para kaydı da geri alındı')); } }
async function moneyUndo(id) { const t = id && S.items.get(id); if (t && !t.deleted) { await remove(t, { silent: true }); render(); } }

/* ----- düzenli kalemler ----- */
const regs = () => list('regpay').sort((a, b) => (a.next || '9999').localeCompare(b.next || '9999'));
const regDue = () => regs().filter(r => r.next && r.next <= today() && r.mode !== 'auto' && !r.paused);
function regAdvance(r) { if (!r.rec) { r.next = ''; return; } if (!r.rec.anchorDay && r.next) r.rec.anchorDay = +r.next.slice(8, 10); let n = nextOcc(r.next, r.rec); if (r.rec.until && n > r.rec.until) n = ''; r.next = n; }
async function regPay(r, skip) {
  const day = r.next; if (r.rec && !r.rec.anchorDay && day) r.rec.anchorDay = +day.slice(8, 10);
  const tid = 'rp:' + r.id + ':' + day, ex = S.items.get(tid);
  if (!skip && !(ex && !ex.deleted)) await save({ id: tid, type: 'tx', date: day <= today() ? day : today(), dir: r.dir, amount: r.amount, cat: r.cat || defCat(r.dir), acct: r.acct || defAcct(), note: r.title, reg: r.id, src: 'regular' }, { silent: true });
  regAdvance(r); await save(r, { silent: true }); regMirror(r);
}
let mAutoDay = '';
async function moneyAuto() { // otomatik kalemleri günü gelince kaydet (kaçırılan günler dahil)
  if (mAutoDay === today() || !S.items.size) return;
  if (Drive.on() && !Drive.sessOk) return; // önce Drive'dan güncel hali gelsin; yoksa diğer cihazda silinen kalem geri dirilir
  mAutoDay = today(); let n = 0;
  for (const r of regs()) { if (r.mode !== 'auto' || r.paused) continue; let g = 0; while (r.next && r.next <= today() && g++ < 60) { await regPay(r); n++; } }
  if (n) { toast(Lx(n + ' düzenli kalem Cüzdan’a kaydedildi', n + ' regular items recorded')); render(); }
}
function regMirror(r) { // Google Takvim'e yaz (bir sonraki tarih, hatırlatmayla)
  if (!Cal.on()) return;
  const want = r.toCal && r.next && !r.deleted && !r.paused;
  (async () => {
    if (!Cal.ready() || !Cal.cfg.def) return;
    try {
      if (!want) { if (r.gev && r.gev.id) { await Cal.del(r.gev.cal, r.gev.id); r.gev = null; const c = S.items.get(r.id); if (c && c !== r) { c.gev = null; r = c; } await save(r, { silent: true }); } return; }
      const ev = { title: (r.dir === 'in' ? '💰 ' : '💸 ') + r.title + ' · ' + fmtTL(r.amount), date: r.next, allDay: !r.time, start: r.time || '', end: '', notes: 'PUSULA ödemesi', remind: r.time ? (r.remind || []) : null };
      if (r.gev && r.gev.id) { try { await Cal.patch(r.gev.cal, r.gev.id, ev); } catch (e) { if (e.status === 404 || e.status === 410) r.gev = null; else throw e; } }
      if (!r.gev || !r.gev.id) { const res = await Cal.insert(Cal.cfg.def, ev); r.gev = { id: res.id, cal: Cal.cfg.def }; }
      const c = S.items.get(r.id); if (c && c !== r) { c.gev = r.gev; r = c; }
      await save(r, { silent: true });
    } catch (e) { console.warn(e); }
  })();
}
function moneyAlerts() {
  if (!moneyOn()) return [];
  moneyAuto();
  return regDue().map(r => ({ id: 'pay' + r.id + r.next, lvl: r.next < today() ? 'danger' : 'warn', icon: 'wallet', text: Lx(r.title + ' · ' + fmtTL(r.amount) + (r.dir === 'in' ? ' bekleniyor' : ' ödenecek'), r.title + ' · ' + fmtTL(r.amount) + (r.dir === 'in' ? ' expected' : ' due')), act: 'reg-pay-alert', btn: r.dir === 'in' ? Lx('Geldi', 'Received') : Lx('Ödendi', 'Paid'), rid: r.id }));
}

/* ===================== Cüzdan sekmesi ===================== */
S.moneySub = lsGet('pusula.moneySub', 'summary'); S.mMonth = today().slice(0, 7); S.mDir = 'all'; S.mQ = ''; S.mAcct = ''; S.mSel = null;
function viewMoney() {
  moneyAuto();
  const subs = [{ k: 'summary', label: T('mSummary') }, { k: 'moves', label: T('mMoves') }, { k: 'regular', label: T('mRegular') }, { k: 'accounts', label: T('mAccounts') }];
  let h = subSeg(subs, S.moneySub, 'money-sub');
  if (S.moneySub === 'moves') return h + viewMoves();
  if (S.moneySub === 'regular') return h + viewRegular();
  if (S.moneySub === 'accounts') return h + viewAccounts();
  return h + viewMSummary();
}
const monthNav = () => '<div class="m-nav"><button class="icon-btn" data-act="m-month" data-n="-1" aria-label="Önceki ay">' + icon('left') + '</button><b>' + monthLabel(S.mMonth) + '</b><button class="icon-btn" data-act="m-month" data-n="1" aria-label="Sonraki ay">' + icon('right') + '</button></div>';
const txIn = m => list('tx').filter(t => monthOf(t.date) === m && t.dir !== 'xfer');
const sumDir = (arr, dir) => arr.filter(t => t.dir === dir).reduce((a, t) => a + t.amount, 0);
function viewMSummary() {
  const m = S.mMonth, arr = txIn(m), prev = txIn(shiftM(m, -1));
  const inc = sumDir(arr, 'in'), exp = sumDir(arr, 'out'), pexp = sumDir(prev, 'out');
  let h = monthNav() + '<div class="m-tiles"><div class="m-tile in"><span>' + tr('Gelir') + '</span><b>' + fmtTL(inc) + '</b></div><div class="m-tile out"><span>' + tr('Gider') + '</span><b>' + fmtTL(exp) + '</b></div><div class="m-tile net ' + (inc - exp >= 0 ? 'pos' : 'neg') + '"><span>' + tr('Net') + '</span><b>' + fmtTL(inc - exp, true) + '</b></div></div>';
  if (pexp > 0 && exp > 0) { const ch = Math.round((exp - pexp) / pexp * 100); h += '<p class="muted sm m-cmp">' + Lx('Gider geçen aya göre ' + (ch >= 0 ? '%' + ch + ' arttı' : '%' + (-ch) + ' azaldı'), 'Spending ' + (ch >= 0 ? 'up ' + ch : 'down ' + (-ch)) + '% vs last month') + '</p>'; }
  const as = accts();
  if (as.length) h += '<section class="card m-bal" data-act="bal-update"><div class="m-bal-row"><span>' + tr('Toplam bakiye') + '</span><b>' + fmtTL(as.reduce((a, x) => a + acctBal(x), 0)) + '</b></div><div class="m-bal-list">' + as.slice(0, 4).map(a => '<span><i style="background:' + (a.color || 'var(--accent)') + '"></i>' + esc(a.name) + ' <b>' + fmtTL(acctBal(a)) + '</b></span>').join('') + '</div></section>';
  const due = regDue();
  if (due.length) h += '<div class="section-title"><span>' + tr('Bekleyenler') + '<span class="count">' + due.length + '</span></span></div><div class="card">' + due.map(regRow).join('') + '</div>';
  // gider dağılımı
  const byCat = {}; arr.filter(t => t.dir === 'out').forEach(t => { byCat[t.cat || ''] = (byCat[t.cat || ''] || 0) + t.amount; });
  const cats = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  if (cats.length) h += '<div class="section-title"><span>' + tr('Gider dağılımı') + '</span></div><div class="card m-bars">' + cats.slice(0, 10).map(c => { const cc = mcat(c); const p = Math.round(byCat[c] / exp * 100); return '<div class="m-bar" data-act="m-cat-filter" data-k="' + c + '"><div class="m-bar-top"><span><i style="background:' + cc.color + '"></i>' + esc(cc.name) + '</span><span><b>' + fmtTL(byCat[c]) + '</b> <span class="muted">%' + p + '</span></span></div><div class="m-bar-track"><i style="width:' + p + '%;background:' + cc.color + '"></i></div></div>'; }).join('') + '</div>';
  // en çok kazandıran işler
  const byLink = {}; arr.filter(t => t.dir === 'in' && t.link).forEach(t => { const k = t.link.id; byLink[k] = byLink[k] || { title: (S.items.get(k) || {}).title || t.link.title, sum: 0, n: 0, t: t.link.t, id: k }; byLink[k].sum += t.amount; byLink[k].n++; });
  const top = Object.values(byLink).sort((a, b) => b.sum - a.sum);
  if (top.length) h += '<div class="section-title"><span>' + tr('En çok kazandıran işler') + '</span></div><div class="card">' + top.slice(0, 6).map(x => '<div class="row" data-act="' + (x.t === 'routine' ? 'rt-edit' : 'edit-task') + '" data-id="' + x.id + '"><div class="row-main"><div class="row-title">' + esc(x.title) + '</div><div class="row-meta">' + x.n + ' ' + tr('kayıt') + '</div></div><b class="pos">' + fmtTL(x.sum, true) + '</b></div>').join('') + '</div>';
  // yaklaşan düzenli
  const lim = addDays(today(), 30), up = regs().filter(r => r.next && r.next > today() && r.next <= lim && !r.paused);
  if (up.length) h += '<div class="section-title"><span>' + tr('Önümüzdeki 30 gün') + '</span></div><div class="card">' + up.map(regRow).join('') + '</div>';
  if (!arr.length && !as.length && !regs().length) h += '<div class="card m-start"><p>' + tr('Cüzdan’a hoş geldin. Başlamak için:') + '</p><button class="btn block" data-act="money-sub" data-k="accounts">' + icon('bank', 'sm') + ' <span>' + tr('Hesaplarını ekle') + '</span></button><button class="btn block" data-act="tx-new">' + icon('plus', 'sm') + ' <span>' + tr('İlk gelir ya da gideri gir') + '</span></button><button class="btn block" data-act="reg-new">' + icon('repeat', 'sm') + ' <span>' + tr('Kira, fatura gibi düzenli kalemleri tanımla') + '</span></button></div>';
  return h;
}
/* ----- Hareketler ----- */
function txRow(t) {
  const c = mcat(t.cat), sel = S.mSel && S.mSel.has(t.id);
  const sub = [t.dir === 'xfer' ? esc(acctName(t.acct)) + ' → ' + esc(acctName(t.toAcct)) : t.acct ? esc(acctName(t.acct)) : '', t.link ? icon(t.link.t === 'routine' ? 'repeat' : 'task', 'xs') + ' ' + esc((S.items.get(t.link.id) || {}).title || t.link.title) : '', t.reg ? icon('repeat', 'xs') : ''].filter(Boolean).join(' · ');
  return '<div class="row tx-row ' + (sel ? 'picked' : '') + '" data-act="' + (S.mSel ? 'tx-pick' : 'tx-edit') + '" data-id="' + t.id + '">' + (S.mSel ? '<span class="mpick">' + (sel ? icon('check', 'sm') : '') + '</span>' : '') +
    '<span class="tx-dot" style="background:' + (t.dir === 'xfer' ? 'var(--muted)' : c.color) + '">' + icon(t.dir === 'xfer' ? 'xfer' : t.dir === 'in' ? 'income' : 'expense', 'xs') + '</span>' +
    '<div class="row-main"><div class="row-title u">' + esc(t.note || (t.dir === 'xfer' ? tr('Transfer') : c.name)) + '</div><div class="row-meta">' + (t.note && t.dir !== 'xfer' ? '<span>' + esc(c.name) + '</span>' : '') + (sub ? '<span>' + sub + '</span>' : '') + '</div></div>' +
    '<b class="tx-amt ' + (t.dir === 'in' ? 'pos' : t.dir === 'out' ? 'neg' : '') + '">' + fmtTL(t.dir === 'in' ? t.amount : t.dir === 'out' ? -t.amount : t.amount, t.dir !== 'xfer') + '</b></div>';
}
function movesFiltered() {
  const q = lower(S.mQ.trim());
  return list('tx').filter(t => monthOf(t.date) === S.mMonth && (S.mDir === 'all' || t.dir === S.mDir || (S.mDir.startsWith('cat:') && t.cat === S.mDir.slice(4))) && (!S.mAcct || t.acct === S.mAcct || t.toAcct === S.mAcct) && (!q || lower((t.note || '') + ' ' + mcat(t.cat).name + ' ' + fmtTL(t.amount)).includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
}
function viewMoves() {
  const arr = movesFiltered();
  let h = monthNav() + '<div class="m-actions"><button class="btn" data-act="tx-new">' + icon('plus', 'sm') + ' <span>Ekle</span></button><button class="btn" data-act="bulk-write">' + icon('lines', 'sm') + ' <span>Toplu yaz</span></button><button class="btn" data-act="m-import">' + icon('upload2', 'sm') + ' <span>İçe aktar</span></button></div>' +
    '<div class="search">' + icon('search') + '<input id="mSearch" placeholder="' + esc(tr('Harcamalarda ara')) + '" value="' + esc(S.mQ) + '" autocomplete="off"></div>' +
    '<div class="m-filter"><div class="chips">' + [['all', 'Tümü'], ['out', 'Gider'], ['in', 'Gelir'], ['xfer', 'Transfer']].map(x => '<button class="chip sm ' + (S.mDir === x[0] ? 'on' : '') + '" data-act="m-dir" data-k="' + x[0] + '">' + x[1] + '</button>').join('') + (S.mDir.startsWith('cat:') ? '<button class="chip sm on" data-act="m-dir" data-k="all">' + esc(mcat(S.mDir.slice(4)).name) + ' ✕</button>' : '') + '</div>' +
    (accts().length ? '<select class="input slim m-acct" id="mAcctF"><option value="">' + tr('Tüm hesaplar') + '</option>' + acctOptions(S.mAcct) + '</select>' : '') + '</div>';
  const tin = sumDir(arr, 'in'), tout = sumDir(arr, 'out');
  h += '<div class="mail-tools"><span class="muted sm">' + arr.length + ' ' + tr('kayıt') + ' · <span class="pos">' + fmtTL(tin, true) + '</span> · <span class="neg">' + fmtTL(-tout, true) + '</span></span><span class="mt-right">' + (arr.length ? '<button class="link" data-act="tx-select">' + tr(S.mSel ? 'Seçimi bitir' : 'Seç') + '</button>' : '') + '<button class="link" data-act="m-cats">' + esc(T('mCats')) + '</button></span></div>';
  if (!arr.length) return h + '<div class="card"><div class="empty">' + tr('Bu ay için kayıt yok.') + '</div></div>';
  let day = '';
  arr.forEach(t => { if (t.date !== day) { if (day) h += '</div>'; day = t.date; const ds = arr.filter(x => x.date === day); const net = sumDir(ds, 'in') - sumDir(ds, 'out'); h += '<div class="section-title tx-day"><span>' + relDayLong(day) + '</span><span class="muted sm">' + (net ? fmtTL(net, true) : '') + '</span></div><div class="card ' + (S.mSel ? 'selecting' : '') + '">'; } h += txRow(t); });
  h += '</div>';
  if (S.mSel) { const n = S.mSel.size; h += '<div class="sel-bar"><div class="sb-top"><b>' + n + '</b> <span>seçili</span><button class="link" data-act="tx-pick-all">' + tr(n === arr.length ? 'Hiçbirini seçme' : 'Hepsini seç') + '</button><button class="icon-btn" data-act="tx-select" aria-label="Kapat">' + icon('x', 'sm') + '</button></div><div class="sb-acts">' +
    [['cat', 'tag', 'Kategori'], ['acct', 'bank', 'Hesap'], ['link', 'task', 'İşe bağla'], ['del', 'trash', 'Sil']].map(b => '<button class="sb-act" data-act="tx-bulk" data-k="' + b[0] + '" ' + (n ? '' : 'disabled') + '>' + icon(b[1], 'sm') + '<span>' + b[2] + '</span></button>').join('') + '</div></div>'; }
  return h;
}
/* ----- Düzenli ----- */
function regRow(r) {
  const c = mcat(r.cat), due = r.next && r.next <= today();
  return '<div class="row reg-row" data-act="reg-edit" data-id="' + r.id + '"><span class="tx-dot" style="background:' + c.color + '">' + icon(r.dir === 'in' ? 'income' : 'expense', 'xs') + '</span><div class="row-main"><div class="row-title">' + esc(r.title) + '</div><div class="row-meta"><span>' + esc(r.rec ? recText(r.rec) : tr('Planlı')) + '</span>' + (r.mode === 'auto' ? '<span>· ' + tr('otomatik') + '</span>' : '') + (r.paused ? '<span>· ' + tr('durduruldu') + '</span>' : r.next ? '<span class="' + (r.next < today() ? 'danger' : '') + '">· ' + tr(relDay(r.next)) + '</span>' : '<span>· ' + tr('bitti') + '</span>') + '</div></div>' +
    '<div class="reg-right"><b class="' + (r.dir === 'in' ? 'pos' : 'neg') + '">' + fmtTL(r.dir === 'in' ? r.amount : -r.amount, true) + '</b>' + (due && !r.paused && r.mode !== 'auto' ? '<span class="reg-btns"><button class="btn sm-btn primary" data-act="reg-pay" data-id="' + r.id + '">' + (r.dir === 'in' ? tr('Geldi') : tr('Ödendi')) + '</button><button class="link" data-act="reg-skip" data-id="' + r.id + '">' + tr('Atla') + '</button></span>' : '') + '</div></div>';
}
function viewRegular() {
  const rs = regs().filter(r => r.rec); // tek seferlikler Planlı sekmesinde
  const mon = rs.filter(r => !r.paused && r.next && r.rec).reduce((a, r) => { const per = { day: 30, week: 4.33, month: 1, year: 1 / 12 }[r.rec.unit] / Math.max(1, r.rec.every || 1) * (r.rec.unit === 'week' && r.rec.wdays && r.rec.wdays.length ? r.rec.wdays.length : 1); a[r.dir] += r.amount * per; return a; }, { in: 0, out: 0 });
  let h = '<div class="section-title first"><span class="u">' + esc(T('mRegular')) + '</span><button class="link" data-act="reg-new">+ ' + tr('Düzenli kalem') + '</button></div>' +
    '<p class="muted sm page-hint">' + tr('Kira, fatura, abonelik, maaş… Bir kez tanımla; günü gelince “Ödendi mi?” diye sorar ya da otomatik kaydeder.') + '</p>';
  if (!rs.length) return h + '<div class="card"><div class="empty">' + tr('Henüz düzenli kalem yok.') + '</div></div>';
  h += '<div class="m-tiles two"><div class="m-tile out"><span>' + tr('Aylık sabit gider') + '</span><b>' + fmtTL(Math.round(mon.out)) + '</b></div><div class="m-tile in"><span>' + tr('Aylık düzenli gelir') + '</span><b>' + fmtTL(Math.round(mon.in)) + '</b></div></div>';
  return h + '<div class="card">' + rs.map(regRow).join('') + '</div>';
}
/* ----- Hesaplar ----- */
function viewAccounts() {
  const as = accts();
  let h = '<div class="section-title first"><span class="u">' + esc(T('mAccounts')) + '</span><button class="link" data-act="acct-new">+ ' + tr('Hesap') + '</button></div>';
  if (!as.length) return h + '<div class="card"><div class="empty">' + tr('Banka, nakit, kredi kartı ve birikim hesaplarını ekle; bakiyeler hareketlerden kendiliğinden hesaplanır.') + '</div></div>';
  const tot = as.reduce((a, x) => a + acctBal(x), 0);
  h += '<div class="m-tiles one"><div class="m-tile ' + (tot >= 0 ? 'pos' : 'neg') + '"><span>' + tr('Toplam') + '</span><b>' + fmtTL(tot) + '</b></div></div><div class="card">' +
    as.map(a => { const b = acctBal(a); return '<div class="row acct-row" data-act="acct-edit" data-id="' + a.id + '"><span class="tx-dot" style="background:' + (a.color || 'var(--accent)') + '">' + icon((ACCT_KINDS[a.kind] || ACCT_KINDS.bank)[1], 'xs') + '</span><div class="row-main"><div class="row-title">' + esc(a.name) + (settings().moneyDefAcct === a.id ? ' <span class="badge-s">' + tr('varsayılan') + '</span>' : '') + '</div><div class="row-meta">' + tr((ACCT_KINDS[a.kind] || ACCT_KINDS.bank)[0]) + '</div></div><b class="' + (b >= 0 ? '' : 'neg') + '">' + fmtTL(b) + '</b><button class="icon-btn" data-act="acct-moves" data-id="' + a.id + '" aria-label="Hareketler">' + icon('right', 'sm') + '</button></div>'; }).join('') + '</div>' +
    '<button class="btn block primary" data-act="bal-update">' + icon('bank', 'sm') + ' <span>' + tr('Bakiyeleri güncelle') + '</span></button>' +
    '<button class="btn block" data-act="xfer-new">' + icon('xfer', 'sm') + ' <span>' + tr('Hesaplar arası transfer') + '</span></button>';
  return h;
}

/* ===================== Düzenleyiciler ===================== */
function editTx(t, preset) {
  const isNew = !t;
  const d = t ? clone(t) : Object.assign({ id: uid(), type: 'tx', date: today(), dir: 'out', amount: 0, cat: '', acct: defAcct(), note: '', src: 'manual' }, preset || {});
  S.draft = d;
  const linkable = list('task').concat(list('routine')).sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 80);
  openSheet(sheetHead(isNew ? 'Yeni kayıt' : 'Kaydı düzenle') + '<div class="sheet-body tx-ed">' +
    seg('txDir', [['out', 'Gider'], ['in', 'Gelir'], ['xfer', 'Transfer']], d.dir) +
    '<input class="input big tx-amt-in" name="amt" inputmode="decimal" placeholder="0 ₺" value="' + (d.amount ? numIn(d.amount) : '') + '" autocomplete="off">' +
    '<input class="input" name="note" placeholder="Açıklama (ör. Migros, kira, ders ücreti)" value="' + esc(d.note || '') + '" autocomplete="off">' +
    '<div class="field tx-cats ' + (d.dir === 'xfer' ? 'hide' : '') + '"><span>Kategori</span><div class="chips" id="txCats">' + txCatChips(d.dir === 'xfer' ? 'out' : d.dir, d.cat) + '</div></div>' +
    '<div class="field-row"><label class="field"><span>Tarih</span><input type="date" class="input" name="date" value="' + d.date + '"></label>' +
    (accts().length ? '<label class="field"><span class="acct-lbl">' + (d.dir === 'xfer' ? 'Nereden' : 'Hesap') + '</span><select class="input" name="acct">' + acctOptions(d.acct, true) + '</select></label>' : '') + '</div>' +
    (accts().length ? '<label class="field tx-to ' + (d.dir === 'xfer' ? '' : 'hide') + '"><span>Nereye</span><select class="input" name="toAcct">' + acctOptions(d.toAcct, true) + '</select></label>' : '') +
    '<label class="field tx-link ' + (d.dir === 'xfer' ? 'hide' : '') + '"><span>İşe bağla (isteğe bağlı)</span><select class="input" name="link"><option value="">—</option>' + linkable.map(x => '<option value="' + x.type + ':' + x.id + '" ' + (d.link && d.link.id === x.id ? 'selected' : '') + '>' + (x.type === 'routine' ? '↻ ' : '') + esc(x.title) + '</option>').join('') + '</select></label>' +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="tx-delete">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="tx-save">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=amt]'); if (i) i.focus(); }, 80);
}
function txCatChips(dir, sel) { return mcats().filter(c => c.dir === dir).map(c => '<button type="button" class="chip sm ' + (c.id === sel ? 'on' : '') + '" data-act="tx-cat" data-id="' + c.id + '"><i class="cdot" style="background:' + c.color + '"></i>' + esc(c.name) + '</button>').join(''); }
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#sheetRoot .seg[data-name=txDir] button'); if (!b) return;
  setTimeout(() => { const d = segVal('txDir'); const x = d === 'xfer'; ['.tx-cats', '.tx-link'].forEach(s => { const el = $('#sheetRoot ' + s); if (el) el.classList.toggle('hide', x); }); const to = $('#sheetRoot .tx-to'); if (to) to.classList.toggle('hide', !x); const l = $('#sheetRoot .acct-lbl'); if (l) l.textContent = tr(x ? 'Nereden' : 'Hesap'); const cc = $('#txCats'); if (cc && !x) { cc.innerHTML = txCatChips(d, ''); translateTree(cc); } }, 0);
});
document.addEventListener('input', e => { // açıklamadan kategori tahmini
  if (e.target.name !== 'note' || !$('#txCats') || !S.draft || S.draft.type !== 'tx') return;
  if ($('#txCats .chip.on[data-manual]')) return;
  const g = guessCat(e.target.value, segVal('txDir') || 'out'); if (g) $$('#txCats .chip').forEach(c => c.classList.toggle('on', c.dataset.id === g.id));
});
async function saveTx() {
  const d = S.draft; const amount = Math.abs(parseTL(fval('amt')));
  if (!(amount > 0)) { $('#sheetRoot [name=amt]').classList.add('err'); return; }
  const dir = segVal('txDir') || 'out';
  const base = S.items.get(d.id) || d;
  const ln = fval('link'); const [lt, lid] = ln ? ln.split(':') : [];
  const catChip = $('#txCats .chip.on');
  Object.assign(base, { dir, amount, note: fval('note').trim(), date: fval('date') || today(), acct: fval('acct') || '', toAcct: dir === 'xfer' ? fval('toAcct') : '', cat: dir === 'xfer' ? '' : (catChip ? catChip.dataset.id : (guessCat(fval('note'), dir) || {}).id || defCat(dir)), link: dir !== 'xfer' && lid ? { t: lt, id: lid, title: (S.items.get(lid) || {}).title || '' } : null });
  if (dir === 'xfer' && (!base.acct || !base.toAcct || base.acct === base.toAcct)) return toast(tr('Transfer için iki farklı hesap seç'));
  closeSheet(); S.mMonth = monthOf(base.date); await save(base);
}
function editReg(r, preset) {
  const isNew = !r;
  const d = r ? clone(r) : Object.assign({ id: uid(), type: 'regpay', title: '', dir: 'out', amount: 0, cat: '', acct: defAcct(), rec: { mode: 'cal', every: 1, unit: 'month', wdays: [], mday: null, until: '' }, next: today(), mode: 'ask', remind: [], time: '', toCal: Cal.on() }, preset || {});
  S.draft = d;
  openSheet(sheetHead(isNew ? (preset && preset.rec === null ? 'Yeni planlı ödeme' : 'Yeni düzenli kalem') : r.rec ? 'Düzenli kalemi düzenle' : 'Planlı ödemeyi düzenle') + '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Örn. Kira, Elektrik, Netflix, Maaş" value="' + esc(d.title) + '" autocomplete="off">' +
    seg('rDir', [['out', 'Gider'], ['in', 'Gelir']], d.dir) +
    '<div class="field-row"><label class="field"><span>Tutar (₺)</span><input class="input" name="amt" inputmode="decimal" placeholder="0" value="' + (d.amount ? numIn(d.amount) : '') + '"></label><label class="field"><span>Kategori</span><select class="input" name="rCat"' + (d.cat ? ' data-manual="1"' : '') + '>' + catOptions(d.dir, d.cat || defCat(d.dir)) + '</select></label></div>' +
    (accts().length ? '<label class="field"><span>Hesap</span><select class="input" name="acct">' + acctOptions(d.acct, true) + '</select></label>' : '') +
    evRecEditor(d.rec) +
    '<div class="field-row"><label class="field"><span>Sonraki tarih</span><input type="date" class="input" name="next" value="' + (d.next || '') + '"></label><label class="field"><span>Saat (isteğe bağlı)</span><input type="time" class="input" name="rtime" value="' + (d.time || '') + '"></label></div>' +
    '<div class="field"><span>Günü gelince</span>' + seg('rMode', [['ask', 'Sor (Ödendi mi?)'], ['auto', 'Otomatik kaydet']], d.mode) + '</div>' +
    remindEditor(d.remind) +
    (Cal.on() ? '<div class="set-row"><div class="grow"><div>Google Takvim’e yaz</div><div class="sub">Ödeme günü takviminde görünür; hatırlatma telefonuna gelir</div></div><button type="button" class="switch ' + (d.toCal ? 'on' : '') + '" data-act="switch" data-name="rCal" aria-label="Aç/kapat"></button></div>' : '') +
    (isNew ? '' : '<div class="set-row"><div class="grow"><div>Durdur</div><div class="sub">Geçici olarak sorma ya da kaydetme</div></div><button type="button" class="switch ' + (d.paused ? 'on' : '') + '" data-act="switch" data-name="rPause" aria-label="Aç/kapat"></button></div>') +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="reg-delete">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="reg-save">Kaydet</button></div>');
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#sheetRoot .seg[data-name=rDir] button'); if (!b) return;
  setTimeout(() => { const s = $('#sheetRoot [name=rCat]'); if (s) { s.removeAttribute('data-manual'); s.innerHTML = catOptions(segVal('rDir'), (guessCat(fval('title'), segVal('rDir')) || {}).id || defCat(segVal('rDir'))); } }, 0);
});
document.addEventListener('input', e => {
  if (e.target.name !== 'title' || !S.draft || S.draft.type !== 'regpay') return;
  const s = $('#sheetRoot [name=rCat]'); if (!s || s.dataset.manual) return; const dir = segVal('rDir') || 'out'; s.value = (guessCat(e.target.value, dir) || {}).id || defCat(dir);
});
async function saveReg() {
  const d = S.draft; const title = fval('title').trim(); const amount = Math.abs(parseTL(fval('amt')));
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  if (!(amount > 0)) { $('#sheetRoot [name=amt]').classList.add('err'); return; }
  const base = S.items.get(d.id) || d; const dir = segVal('rDir') || 'out';
  const rec = readEvRec(); if (rec && fval('next')) rec.anchorDay = +fval('next').slice(8, 10);
  const sw = n => { const el = $('#sheetRoot .switch[data-name=' + n + ']'); return el ? el.classList.contains('on') : undefined; };
  Object.assign(base, { title, dir, amount, cat: fval('rCat') || defCat(dir), acct: fval('acct') || '', rec, next: fval('next') || today(), time: fval('rtime') || '', mode: segVal('rMode') || 'ask', remind: readRemind() });
  if (sw('rCal') !== undefined) base.toCal = sw('rCal'); if (sw('rPause') !== undefined) base.paused = sw('rPause');
  closeSheet(); mAutoDay = ''; await save(base); regMirror(base);
}
function editAcct(a) {
  const isNew = !a;
  const d = a ? clone(a) : { id: uid(), type: 'acct', name: '', kind: 'bank', opening: 0, openDate: today(), color: NOTE_COLORS ? NOTE_COLORS[(accts().length % 7) + 1] : '' };
  S.draft = d;
  openSheet(sheetHead(isNew ? 'Yeni hesap' : 'Hesabı düzenle') + '<div class="sheet-body">' +
    '<input class="input big" name="name" placeholder="Örn. Ziraat, Cüzdan, Bonus kart" value="' + esc(d.name) + '" autocomplete="off">' +
    '<div class="field"><span>Tür</span>' + seg('aKind', Object.keys(ACCT_KINDS).map(k => [k, ACCT_KINDS[k][0]]), d.kind) + '</div>' +
    '<div class="field-row"><label class="field"><span>Bakiye (₺)</span><input class="input" name="opening" inputmode="decimal" value="' + numIn(isNew ? '' : acctBal(d)) + '" placeholder="0"></label><label class="field"><span>Tarihi itibarıyla</span><input type="date" class="input" name="openDate" value="' + (isNew ? today() : today()) + '"></label></div>' +
    '<p class="muted sm" style="margin-top:-4px">Kredi kartı borcunu eksi yaz (örn. −4.500). Bu tarihten sonraki hareketler bakiyeye eklenir.</p>' +
    '<div class="field"><span>Renk</span><div class="chips">' + NOTE_COLORS.slice(1).map(c => '<button type="button" class="swatch ' + (d.color === c ? 'on' : '') + '" data-act="pick-color" data-c="' + c + '" style="background:' + c + '" aria-label="Renk"></button>').join('') + '</div></div>' +
    '<div class="set-row"><div class="grow"><div>Varsayılan hesap</div><div class="sub">Yeni kayıtlarda ve işlere bağlı tutarlarda kullanılır</div></div><button type="button" class="switch ' + (settings().moneyDefAcct === d.id || (isNew && !accts().length) ? 'on' : '') + '" data-act="switch" data-name="aDef" aria-label="Aç/kapat"></button></div>' +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="acct-delete">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="acct-save">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=name]'); if (i) i.focus(); }, 80);
}
async function saveAcct() {
  const d = S.draft; const name = fval('name').trim(); if (!name) { $('#sheetRoot [name=name]').classList.add('err'); return; }
  const base = S.items.get(d.id) || d; const bal = parseTL(fval('opening')) || 0; const od = fval('openDate') || today();
  Object.assign(base, { name, kind: segVal('aKind') || 'bank', color: d.color || '' });
  const same = S.items.get(d.id) && Math.abs(bal - acctBal(S.items.get(d.id))) < 0.005 && od === today();
  if (!same) { // istenen bakiyeyi, o tarihten sonraki hareketleri hesaba katarak açılış bakiyesine çevir
  base.openDate = od; base.opening = 0; const after = acctBal(Object.assign({}, base, { opening: 0, openDate: od })); base.opening = Math.round((bal - after) * 100) / 100; }
  const def = $('#sheetRoot .switch[data-name=aDef]'); const st = settings();
  if (def && def.classList.contains('on')) st.moneyDefAcct = base.id; else if (st.moneyDefAcct === base.id) st.moneyDefAcct = '';
  closeSheet(); await save(st, { silent: true }); await save(base);
}

/* ===================== Toplu yazma ===================== */
function parseBulkLine(line, baseDate) {
  let s = ' ' + line + ' '; let date = baseDate, dir = null;
  const cut = (rx, fn) => { const m = new RegExp(rx, 'iu').exec(s); if (!m) return false; fn(m); s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length); return true; };
  cut('(?<=\\s)(bugün|today)(?=\\s)', () => { date = today(); }) || cut('(?<=\\s)(dün|yesterday)(?=\\s)', () => { date = addDays(today(), -1); }) || cut('(?<=\\s)(evvelsi\\s*gün|önceki\\s*gün)(?=\\s)', () => { date = addDays(today(), -2); }) ||
    cut('(?<=\\s)(\\d{1,2})[./](\\d{1,2})(?:[./](\\d{2,4}))?(?=\\s)', m => { const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : +today().slice(0, 4); date = ymd(new Date(y, +m[2] - 1, +m[1])); });
  let amount = NaN;
  const all = [...s.matchAll(/(?<=\s)([+\-−]?)\s?(\d[\d.,]*)\s*(?:₺|tl|lira)?(?=\s)/giu)];
  if (all.length) { const m = all[all.length - 1]; amount = parseTL(m[2]); if (m[1] === '+') dir = 'in'; else if (m[1]) dir = 'out'; s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length); }
  const note = s.replace(/\s+/g, ' ').trim();
  if (!dir) dir = guessCat(note, 'in') && !guessCat(note, 'out') ? 'in' : 'out';
  const cat = (guessCat(note, dir) || {}).id || defCat(dir);
  return { date, dir, amount, note: note ? note.charAt(0).toLocaleUpperCase('tr-TR') + note.slice(1) : '', cat, ok: amount > 0 };
}
function openBulk() {
  IMP = null;
  openSheet(sheetHead('Toplu yaz') + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">Her satıra bir kayıt yaz. Başına + koyarsan gelir sayılır; “dün”, “12.10” gibi tarih de yazabilirsin. Kategoriyi kelimeden tahmin ederim, kaydetmeden önce gösteririm.</p>' +
    '<textarea class="input mono" id="bulkText" rows="8" placeholder="market 450&#10;benzin 1.200&#10;dün kafe 180&#10;+35.000 maaş&#10;12.10 elektrik faturası 890"></textarea>' +
    '<div class="field-row"><label class="field"><span>Tarih (yazılmayanlar için)</span><input type="date" class="input" name="bDate" value="' + today() + '"></label>' + (accts().length ? '<label class="field"><span>Hesap</span><select class="input" name="bAcct">' + acctOptions(defAcct(), true) + '</select></label>' : '') + '</div>' +
    '<button class="btn primary block" data-act="bulk-preview">' + tr('Önizle') + '</button><div id="bulkPrev"></div></div>');
  setTimeout(() => { const t = $('#bulkText'); if (t) t.focus(); }, 80);
}
/* Önizleme tablosu: hem toplu yazma hem içe aktarma kullanır */
let PREV = [];
function previewHtml(rows, opt) {
  PREV = rows; const n = rows.filter(r => r.pick).length;
  return '<div class="prev-head"><b>' + rows.length + ' ' + tr('satır') + '</b><span><button class="link" data-act="prev-all">' + tr('Hepsini seç') + '</button> · <button class="link" data-act="prev-none">' + tr('Hiçbiri') + '</button></span></div>' +
    '<div class="prev-list">' + rows.map((r, i) => '<div class="prev-row ' + (r.pick ? 'on' : '') + (r.ok ? '' : ' bad') + '"><button class="mpick" data-act="prev-pick" data-i="' + i + '" aria-label="Seç">' + (r.pick ? icon('check', 'sm') : '') + '</button>' +
      '<div class="grow"><div class="prev-top"><span class="u">' + esc(r.note || '—') + '</span><b class="' + (r.dir === 'in' ? 'pos' : 'neg') + '">' + (r.ok ? fmtTL(r.dir === 'in' ? r.amount : -r.amount, true) : tr('tutar yok')) + '</b></div>' +
      '<div class="prev-sub"><span>' + fmtShort(r.date) + '</span><select class="input slim" data-prev-cat="' + i + '">' + catOptions(r.dir, r.cat) + '</select><button class="chip sm" data-act="prev-dir" data-i="' + i + '">' + (r.dir === 'in' ? tr('Gelir') : tr('Gider')) + ' ⇄</button>' + (r.dup ? '<span class="badge-s warn">' + tr('zaten var') + '</span>' : '') + '</div></div></div>').join('') + '</div>' +
    '<button class="btn primary block" data-act="prev-save" ' + (n ? '' : 'disabled') + '>' + Lx('Seçilenleri kaydet (' + n + ')', 'Save selected (' + n + ')') + '</button>';
}
function prevRefresh() { const box = $('#bulkPrev') || $('#impPrev'); if (box) { box.innerHTML = previewHtml(PREV); translateTree(box); } }
const isDup = r => list('tx').some(t => t.date === r.date && Math.abs(t.amount - r.amount) < 0.005 && t.dir === r.dir && (!r.note || lower(t.note || '').slice(0, 12) === lower(r.note).slice(0, 12)));

/* ===================== Ekstre içe aktarma ===================== */
let IMP = null;
function openImport() {
  IMP = null;
  openSheet(sheetHead('Ekstreden içe aktar') + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">Bankanın internet şubesinden ya da uygulamasından hesap hareketlerini veya kart ekstresini <b>Excel (.xlsx / .xls)</b> ya da <b>CSV</b> olarak indir, burada seç. Satırları gösteririm; istediklerini işaretleyip alırsın. PDF ekstre okunamıyor.</p>' +
    '<label class="btn block file-btn">' + icon('upload2', 'sm') + ' <span>' + tr('Dosya seç') + '</span><input type="file" id="impFile" accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label>' +
    '<div id="impMap"></div><div id="impPrev"></div></div>', { full: true });
}
function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => res(); s.onerror = () => rej(new Error(tr('Excel okuyucu yüklenemedi; internet gerekli. CSV dosyası internetsiz de çalışır.'))); document.head.appendChild(s); });
}
function parseCSV(text) {
  const first = text.split(/\r?\n/).slice(0, 5).join('\n');
  const delim = [';', '\t', ',', '|'].map(d => [d, (first.match(new RegExp(d === '|' ? '\\|' : d, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim()));
}
function toDate(v) {
  if (v instanceof Date && !isNaN(v)) return ymd(v);
  if (typeof v === 'number' && v > 20000 && v < 80000) return ymd(new Date(Math.round((v - 25569) * 86400000) + new Date().getTimezoneOffset() * 60000));
  const s = String(v || '').trim(); let m;
  if ((m = /^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/.exec(s))) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return ymd(new Date(y, +m[2] - 1, +m[1])); }
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return ymd(new Date(+m[1], +m[2] - 1, +m[3]));
  return '';
}
const H_DATE = /tarih|date|işlem\s*tar/i, H_DESC = /açıklama|aciklama|description|işlem|detay|açıklaması|merchant|işyeri|isyeri/i, H_AMT = /tutar|amount|miktar|tl\b/i, H_DEBIT = /borç|borc|çıkan|cikan|harcama|debit/i, H_CREDIT = /alacak|giren|yatan|credit/i;
function detectHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 25); i++) { const r = rows[i].map(x => String(x || '')); if (r.some(x => H_DATE.test(x)) && r.some(x => H_AMT.test(x) || H_DEBIT.test(x) || H_CREDIT.test(x))) return i; }
  return 0;
}
async function handleImportFile(f) {
  const map = $('#impMap'); if (!map) return; map.innerHTML = '<div class="empty">' + tr('Okunuyor…') + '</div>';
  try {
    const buf = await f.arrayBuffer(); let rows;
    if (/\.(xlsx|xls)$/i.test(f.name)) { await loadXLSX(); const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: false }); const ws = wb.Sheets[wb.SheetNames[0]]; rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }); }
    else { let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { text = new TextDecoder('windows-1254').decode(buf); } rows = parseCSV(text.replace(/^﻿/, '')); }
    if (!rows.length) throw new Error(tr('Dosyada satır bulunamadı'));
    const hi = detectHeader(rows); const hdr = rows[hi].map(x => String(x || '').trim());
    const sig = hdr.join('|').toLowerCase(); const saved = (settings().moneyImport || {})[sig];
    const find = rx => hdr.findIndex(h => rx.test(h));
    IMP = { rows, hi, hdr, sig, name: f.name, map: saved || { date: find(H_DATE), desc: find(H_DESC), amt: hdr.findIndex(h => H_AMT.test(h) && !H_DEBIT.test(h) && !H_CREDIT.test(h) && !/bakiye|balance/i.test(h)), debit: find(H_DEBIT), credit: find(H_CREDIT), flip: false } };
    if (IMP.map.desc === IMP.map.date) IMP.map.desc = hdr.findIndex((h, i) => i !== IMP.map.date && H_DESC.test(h));
    renderImpMap(); impPreview();
  } catch (e) { map.innerHTML = '<div class="sheet-msg err">' + esc(e.message) + '</div>'; }
}
function renderImpMap() {
  const box = $('#impMap'); if (!box || !IMP) return; const m = IMP.map;
  const sel = (k, lbl, opt) => '<label class="field"><span>' + lbl + '</span><select class="input" data-imp="' + k + '">' + (opt ? '<option value="-1">—</option>' : '') + IMP.hdr.map((h, i) => '<option value="' + i + '" ' + (m[k] === i ? 'selected' : '') + '>' + esc(h || ('Sütun ' + (i + 1))) + '</option>').join('') + '</select></label>';
  box.innerHTML = '<div class="imp-file">' + icon('paper', 'sm') + ' <b class="u">' + esc(IMP.name) + '</b> · ' + (IMP.rows.length - IMP.hi - 1) + ' ' + tr('satır') + '</div>' +
    '<details class="imp-map" ' + ((m.date < 0 || (m.amt < 0 && m.debit < 0 && m.credit < 0)) ? 'open' : '') + '><summary>' + tr('Sütun eşleştirme') + '</summary><div class="field-row">' + sel('date', tr('Tarih')) + sel('desc', tr('Açıklama')) + '</div><div class="field-row">' + sel('amt', tr('Tutar (+/−)'), true) + sel('debit', tr('Borç / çıkan'), true) + sel('credit', tr('Alacak / giren'), true) + '</div>' +
    '<div class="set-row"><div class="grow"><div>' + tr('İşaretleri ters çevir') + '</div><div class="sub">' + tr('Kart ekstresinde harcamalar artı yazıyorsa aç') + '</div></div><button type="button" class="switch ' + (m.flip ? 'on' : '') + '" data-act="imp-flip"></button></div></details>' +
    (accts().length ? '<label class="field"><span>' + tr('Hangi hesaba') + '</span><select class="input" id="impAcct">' + acctOptions(IMP.acct || defAcct(), true) + '</select></label>' : '');
  translateTree(box);
}
function impPreview() {
  const box = $('#impPrev'); if (!box || !IMP) return; const m = IMP.map, out = [];
  IMP.rows.slice(IMP.hi + 1).forEach(r => {
    const date = toDate(r[m.date]); if (!date) return;
    let amt = m.amt >= 0 ? parseTL(r[m.amt]) : NaN;
    if (isNaN(amt)) { const d = m.debit >= 0 ? parseTL(r[m.debit]) : NaN, c = m.credit >= 0 ? parseTL(r[m.credit]) : NaN; amt = (!isNaN(c) && c) ? Math.abs(c) : (!isNaN(d) && d) ? -Math.abs(d) : NaN; }
    if (isNaN(amt) || !amt) return; if (m.flip) amt = -amt;
    const dir = amt > 0 ? 'in' : 'out', note = String(r[m.desc] || '').replace(/\s+/g, ' ').trim();
    const row = { date, dir, amount: Math.abs(amt), note, cat: (guessCat(note, dir) || {}).id || defCat(dir), ok: true };
    row.dup = isDup(row); row.pick = !row.dup; out.push(row);
  });
  box.innerHTML = out.length ? previewHtml(out) : '<div class="empty">' + tr('Tarih ve tutar okunamadı. Sütun eşleştirmesini kontrol et.') + '</div>';
  if (!out.length) { const d = $('.imp-map'); if (d) d.open = true; }
  translateTree(box);
}
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'impFile' && el.files && el.files[0]) handleImportFile(el.files[0]);
  else if (el.dataset && el.dataset.imp && IMP) { IMP.map[el.dataset.imp] = +el.value; impPreview(); }
  else if (el.id === 'impAcct' && IMP) IMP.acct = el.value;
  else if (el.dataset && el.dataset.prevCat !== undefined) { const r = PREV[+el.dataset.prevCat]; if (r) r.cat = el.value; }
  else if (el.id === 'mAcctF') { S.mAcct = el.value; render(); }
  else if (el.name === 'rCat') el.dataset.manual = '1';
});
document.addEventListener('input', e => { if (e.target.id === 'mSearch') { S.mQ = e.target.value; clearTimeout(window.__mqT); window.__mqT = setTimeout(() => { render(); const i = $('#mSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); } });

/* ===================== Kategoriler ===================== */
function openCats() {
  const row = c => '<div class="set-row cat-row"><button class="swatch" data-act="cat-color" data-id="' + c.id + '" style="background:' + c.color + '" aria-label="Renk"></button><div class="grow"><input class="input slim" data-cat-name="' + c.id + '" value="' + esc(c.name) + '"><input class="input slim kw" data-cat-kw="' + c.id + '" value="' + esc(c.kw || '') + '" placeholder="' + esc(tr('anahtar kelimeler: market, migros…')) + '">' + (c.dir === 'out' ? '<label class="lim-l"><span>' + tr('Aylık limit') + '</span><input class="input slim kw lim" data-cat-limit="' + c.id + '" inputmode="decimal" value="' + (c.limit ? c.limit.toLocaleString('tr-TR') : '') + '" placeholder="' + esc(tr('₺ · isteğe bağlı')) + '"></label>' : '') + '</div><button class="icon-btn" data-act="cat-del" data-id="' + c.id + '" aria-label="Sil">' + icon('trash', 'sm') + '</button></div>';
  openSheet(sheetHead(esc(T('mCats'))) + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">Anahtar kelimeler, açıklamadan kategori tahmini için kullanılır (virgülle ayır).</p>' +
    '<div class="set-sub">' + tr('Gider') + '</div><div class="set-group">' + mcats().filter(c => c.dir === 'out').map(row).join('') + '</div><button class="btn block" data-act="cat-new" data-k="out">+ ' + tr('Gider kategorisi') + '</button>' +
    '<div class="set-sub">' + tr('Gelir') + '</div><div class="set-group">' + mcats().filter(c => c.dir === 'in').map(row).join('') + '</div><button class="btn block" data-act="cat-new" data-k="in">+ ' + tr('Gelir kategorisi') + '</button></div>', { onClose: () => setTimeout(render, 0) });
}
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset) return;
  if (el.dataset.catName) { const c = mcats().find(x => x.id === el.dataset.catName); if (c && el.value.trim()) { c.name = el.value.trim(); save(settings(), { silent: true }); } }
  if (el.dataset.catKw !== undefined && el.dataset.catKw) { const c = mcats().find(x => x.id === el.dataset.catKw); if (c) { c.kw = el.value; save(settings(), { silent: true }); } }
});

/* ===================== Bugün kartı ===================== */
TODAY_CARDS.money = function () {
  const arr = txIn(today().slice(0, 7)), inc = sumDir(arr, 'in'), exp = sumDir(arr, 'out');
  const due = regDue(), up = regs().filter(r => r.next && r.next > today() && r.next <= addDays(today(), 7) && !r.paused);
  if (!arr.length && !due.length && !up.length) return '';
  return card('wallet', T('money'), '<div class="m-mini"><span>' + tr('Bu ay') + '</span><b class="pos">' + fmtTL(inc, true) + '</b><b class="neg">' + fmtTL(-exp, true) + '</b><b>' + fmtTL(inc - exp, true) + '</b></div>' + due.concat(up).slice(0, 4).map(regRow).join(''), 'money');
};

/* ===================== Olaylar ===================== */
Object.assign(ACTIONS, {
  'money-sub': el => { S.moneySub = el.dataset.k; lsSet('pusula.moneySub', S.moneySub); S.mSel = null; if (S.tab !== 'money') S.tab = 'money'; window.scrollTo(0, 0); render(); },
  'm-month': el => { S.mMonth = shiftM(S.mMonth, +el.dataset.n); S.mSel = null; render(); },
  'm-dir': el => { S.mDir = el.dataset.k; render(); },
  'm-cat-filter': el => { S.mDir = 'cat:' + el.dataset.k; S.moneySub = 'moves'; render(); },
  'm-cats': () => openCats(),
  'tx-new': () => editTx(null, S.moneySub === 'moves' && S.mDir === 'in' ? { dir: 'in' } : null),
  'tx-edit': el => { const t = S.items.get(el.dataset.id); if (t) editTx(t); },
  'tx-cat': el => { $$('#txCats .chip').forEach(c => { c.classList.toggle('on', c === el); c.removeAttribute('data-manual'); }); el.setAttribute('data-manual', '1'); },
  'tx-save': () => saveTx(),
  'tx-delete': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); toast(tr('Kayıt silindi'), { label: tr('Geri al'), fn: async () => { it.deleted = false; await save(it); } }); },
  'tx-select': () => { S.mSel = S.mSel ? null : new Set(); render(); },
  'tx-pick': el => { const id = el.dataset.id; if (S.mSel.has(id)) S.mSel.delete(id); else S.mSel.add(id); render(); },
  'tx-pick-all': () => { const arr = movesFiltered(); S.mSel = S.mSel.size === arr.length ? new Set() : new Set(arr.map(t => t.id)); render(); },
  'tx-bulk': el => {
    const ids = [...S.mSel]; if (!ids.length) return; const k = el.dataset.k; const items = ids.map(i => S.items.get(i)).filter(Boolean);
    if (k === 'del') { if (!ask(Lx(ids.length + ' kayıt silinsin mi?', 'Delete ' + ids.length + ' entries?'))) return; (async () => { for (const t of items) await remove(t, { silent: true }); S.mSel = null; render(); toast(Lx(ids.length + ' kayıt silindi', ids.length + ' entries deleted'), { label: tr('Geri al'), fn: async () => { for (const t of items) { t.deleted = false; await save(t, { silent: true }); } render(); } }); })(); return; }
    const opts = k === 'cat' ? mcats().map(c => [c.id, (c.dir === 'in' ? '↑ ' : '↓ ') + c.name]) : k === 'acct' ? accts().map(a => [a.id, a.name]) : list('task').concat(list('routine')).slice(0, 80).map(x => [x.type + ':' + x.id, (x.type === 'routine' ? '↻ ' : '') + x.title]);
    if (!opts.length) return toast(tr(k === 'acct' ? 'Önce bir hesap ekle' : 'Seçenek yok'));
    openSheet(sheetHead(k === 'cat' ? 'Kategori seç' : k === 'acct' ? 'Hesap seç' : 'İş seç') + '<div class="sheet-body"><div class="pick-list">' + opts.map(o => '<button class="row" data-act="tx-bulk-apply" data-k="' + k + '" data-v="' + esc(o[0]) + '"><div class="row-main"><div class="row-title u">' + esc(o[1]) + '</div></div></button>').join('') + '</div></div>');
  },
  'tx-bulk-apply': async el => {
    const k = el.dataset.k, v = el.dataset.v; const items = [...S.mSel].map(i => S.items.get(i)).filter(Boolean);
    for (const t of items) { if (k === 'cat') { const c = mcat(v); t.cat = v; if (t.dir !== 'xfer') t.dir = c.dir; } else if (k === 'acct') t.acct = v; else { const [lt, lid] = v.split(':'); t.link = { t: lt, id: lid, title: (S.items.get(lid) || {}).title || '' }; } await save(t, { silent: true }); }
    closeSheet(); S.mSel = null; render(); toast(Lx(items.length + ' kayıt güncellendi', items.length + ' entries updated'));
  },
  'bulk-write': () => openBulk(),
  'bulk-preview': () => { const lines = ($('#bulkText').value || '').split('\n').map(x => x.trim()).filter(Boolean); if (!lines.length) return toast(tr('Önce satırları yaz')); const bd = fval('bDate') || today(); const rows = lines.map(l => Object.assign(parseBulkLine(l, bd), { pick: true })); rows.forEach(r => { r.pick = r.ok; }); const box = $('#bulkPrev'); box.innerHTML = previewHtml(rows); translateTree(box); },
  'prev-pick': el => { const r = PREV[+el.dataset.i]; if (r && r.ok) { r.pick = !r.pick; prevRefresh(); } },
  'prev-all': () => { PREV.forEach(r => { r.pick = r.ok; }); prevRefresh(); },
  'prev-none': () => { PREV.forEach(r => { r.pick = false; }); prevRefresh(); },
  'prev-dir': el => { const r = PREV[+el.dataset.i]; if (!r) return; r.dir = r.dir === 'in' ? 'out' : 'in'; r.cat = (guessCat(r.note, r.dir) || {}).id || defCat(r.dir); prevRefresh(); },
  'prev-save': async () => {
    const rows = PREV.filter(r => r.pick && r.ok); if (!rows.length) return;
    const acct = (IMP ? ($('#impAcct') || {}).value : fval('bAcct')) || defAcct(); const src = IMP ? 'import' : 'bulk';
    for (const r of rows) await save({ id: uid(), type: 'tx', date: r.date, dir: r.dir, amount: r.amount, cat: r.cat, acct, note: r.note, src }, { silent: true });
    if (IMP) { const st = settings(); st.moneyImport = Object.assign({}, st.moneyImport, { [IMP.sig]: IMP.map }); await save(st, { silent: true }); }
    closeSheet(); S.moneySub = 'moves'; S.mMonth = monthOf(rows[0].date); IMP = null; render(); toast(Lx(rows.length + ' kayıt eklendi', rows.length + ' entries added'));
  },
  'm-import': () => openImport(),
  'imp-flip': el => { if (!IMP) return; IMP.map.flip = !IMP.map.flip; el.classList.toggle('on', IMP.map.flip); impPreview(); },
  'reg-new': () => editReg(),
  'reg-edit': el => { const r = S.items.get(el.dataset.id); if (r) editReg(r); },
  'reg-save': () => saveReg(),
  'reg-delete': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); if (!ask(Lx('“' + it.title + '” silinsin mi? (Geçmiş kayıtlar kalır)', 'Delete “' + it.title + '”? (Past entries stay)'))) return; closeSheet(); it.deleted = true; regMirror(it); await save(it); },
  'reg-pay': async el => { const r = S.items.get(el.dataset.id); if (!r) return; const before = r.next; await regPay(r); render(); toast(Lx(r.title + ' kaydedildi', r.title + ' recorded') + (r.next ? ' · ' + Lx('sonraki: ', 'next: ') + relDay(r.next) : '')); },
  'reg-pay-alert': () => { /* aşağıdaki yakalayıcı işler */ },
  'reg-skip': async el => { const r = S.items.get(el.dataset.id); if (!r) return; await regPay(r, true); render(); toast(Lx('Bu sefer atlandı', 'Skipped this time')); },
  'acct-new': () => editAcct(),
  'acct-edit': el => { const a = S.items.get(el.dataset.id); if (a) editAcct(a); },
  'acct-save': () => saveAcct(),
  'acct-delete': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); const n = list('tx').filter(t => t.acct === it.id || t.toAcct === it.id).length; if (!ask(Lx('“' + it.name + '” silinsin mi?' + (n ? ' ' + n + ' kaydın hesabı boş kalır.' : ''), 'Delete “' + it.name + '”?' + (n ? ' ' + n + ' entries will have no account.' : '')))) return; closeSheet(); await remove(it); },
  'acct-moves': el => { S.mAcct = el.dataset.id; S.moneySub = 'moves'; S.mDir = 'all'; render(); },
  'xfer-new': () => { const f = defAcct(); editTx(null, { dir: 'xfer', acct: f, toAcct: (accts().find(a => a.id !== f) || {}).id || '' }); },
  'cat-new': el => { const st = settings(); const cs = mcats(); const id = 'c' + mid(); cs.push({ id, dir: el.dataset.k, name: tr(el.dataset.k === 'in' ? 'Yeni gelir' : 'Yeni gider'), color: NOTE_COLORS[(cs.length % 7) + 1], kw: '' }); st.moneyCats = cs; save(st, { silent: true }); openCats(); },
  'cat-del': el => { const st = settings(); const c = mcats().find(x => x.id === el.dataset.id); if (!c) return; const n = list('tx').filter(t => t.cat === c.id).length; if (!ask(Lx('“' + c.name + '” silinsin mi?' + (n ? ' ' + n + ' kayıt “Diğer”e geçer.' : ''), 'Delete “' + c.name + '”?'))) return; const to = defCat(c.dir); st.moneyCats = mcats().filter(x => x.id !== c.id); list('tx').filter(t => t.cat === c.id).forEach(t => { t.cat = to; save(t, { silent: true }); }); save(st, { silent: true }); openCats(); },
  'cat-color': el => { const c = mcats().find(x => x.id === el.dataset.id); if (!c) return; const i = NOTE_COLORS.indexOf(c.color); c.color = NOTE_COLORS[(Math.max(0, i) % (NOTE_COLORS.length - 1)) + 1]; el.style.background = c.color; save(settings(), { silent: true }); }
});
/* uyarıdaki "Ödendi" düğmesi */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-act=reg-pay-alert]'); if (!b) return;
  const it = b.closest('.alert-item'); const id = it && it.querySelector('[data-act=alert-dismiss]') ? it.querySelector('[data-act=alert-dismiss]').dataset.id : '';
  const r = regs().find(x => id === 'pay' + x.id + x.next); if (!r) return;
  regPay(r).then(() => { closeSheet(); render(); toast(Lx(r.title + ' kaydedildi', r.title + ' recorded')); });
}, true);
document.addEventListener('change', e => { if (e.target.name === 'mAmt' || e.target.name === 'amt') { const v = parseTL(e.target.value); if (!isNaN(v) && v) e.target.value = Math.abs(v).toLocaleString('tr-TR', { maximumFractionDigits: 2 }); } });

/* ===================== Metinler (EN) ===================== */
(function () {
  const add = {
    'Kategorisiz': 'Uncategorized', 'Para (isteğe bağlı)': 'Money (optional)', 'Yok': 'None', 'Gelir': 'Income', 'Gider': 'Expense', 'Transfer': 'Transfer', 'Tutar (₺)': 'Amount (₺)', 'Kategori': 'Category', 'Hesap': 'Account',
    'İşi “tamamladım / yaptım” diye işaretleyince bu tutar Cüzdan’a kendiliğinden kaydedilir.': 'When you mark this done, the amount is recorded in your wallet automatically.', 'Bu işten toplam': 'Total from this task', 'kayıt': 'entries',
    'Net': 'Net', 'Toplam bakiye': 'Total balance', 'Bekleyenler': 'Waiting', 'Gider dağılımı': 'Spending by category', 'En çok kazandıran işler': 'Top earning tasks', 'Önümüzdeki 30 gün': 'Next 30 days',
    'Cüzdan’a hoş geldin. Başlamak için:': 'Welcome to your wallet. To start:', 'Hesaplarını ekle': 'Add your accounts', 'İlk gelir ya da gideri gir': 'Enter your first income or expense', 'Kira, fatura gibi düzenli kalemleri tanımla': 'Set up regular items like rent and bills',
    'Ekle': 'Add', 'Toplu yaz': 'Bulk write', 'İçe aktar': 'Import', 'Harcamalarda ara': 'Search entries', 'Tüm hesaplar': 'All accounts', 'Bu ay için kayıt yok.': 'No entries this month.', 'İşe bağla': 'Link to task', 'Sil': 'Delete',
    'otomatik': 'automatic', 'durduruldu': 'paused', 'bitti': 'ended', 'Geldi': 'Received', 'Ödendi': 'Paid', 'Atla': 'Skip', 'Düzenli kalem': 'Regular item',
    'Kira, fatura, abonelik, maaş… Bir kez tanımla; günü gelince “Ödendi mi?” diye sorar ya da otomatik kaydeder.': 'Rent, bills, subscriptions, salary… Set once; on the day it asks “Paid?” or records automatically.',
    'Henüz düzenli kalem yok.': 'No regular items yet.', 'Aylık sabit gider': 'Monthly fixed costs', 'Aylık düzenli gelir': 'Monthly regular income', 'varsayılan': 'default', 'Toplam': 'Total',
    'Banka, nakit, kredi kartı ve birikim hesaplarını ekle; bakiyeler hareketlerden kendiliğinden hesaplanır.': 'Add bank, cash, credit card and savings accounts; balances update from your entries.',
    'Hesaplar arası transfer': 'Transfer between accounts', 'Banka': 'Bank', 'Nakit': 'Cash', 'Kredi kartı': 'Credit card', 'Birikim': 'Savings',
    'Yeni kayıt': 'New entry', 'Kaydı düzenle': 'Edit entry', 'Açıklama (ör. Migros, kira, ders ücreti)': 'Description (e.g. groceries, rent, lesson fee)', 'Nereden': 'From', 'Nereye': 'To', 'İşe bağla (isteğe bağlı)': 'Link to task (optional)',
    'Transfer için iki farklı hesap seç': 'Pick two different accounts for a transfer', 'Yeni düzenli kalem': 'New regular item', 'Düzenli kalemi düzenle': 'Edit regular item', 'Örn. Kira, Elektrik, Netflix, Maaş': 'E.g. Rent, Electricity, Netflix, Salary',
    'Günü gelince': 'When due', 'Sor (Ödendi mi?)': 'Ask (Paid?)', 'Otomatik kaydet': 'Record automatically', 'Ödeme günü takviminde görünür; hatırlatma telefonuna gelir': 'Due date shows in your calendar with a phone reminder',
    'Durdur': 'Pause', 'Geçici olarak sorma ya da kaydetme': 'Temporarily don’t ask or record', 'Yeni hesap': 'New account', 'Hesabı düzenle': 'Edit account', 'Örn. Ziraat, Cüzdan, Bonus kart': 'E.g. Bank, Wallet, Credit card', 'Tür': 'Type', 'Bakiye (₺)': 'Balance (₺)', 'Tarihi itibarıyla': 'As of',
    'Kredi kartı borcunu eksi yaz (örn. −4.500). Bu tarihten sonraki hareketler bakiyeye eklenir.': 'Enter card debt as negative (e.g. −4,500). Entries after this date are added to the balance.', 'Varsayılan hesap': 'Default account', 'Yeni kayıtlarda ve işlere bağlı tutarlarda kullanılır': 'Used for new entries and task-linked amounts',
    'Her satıra bir kayıt yaz. Başına + koyarsan gelir sayılır; “dün”, “12.10” gibi tarih de yazabilirsin. Kategoriyi kelimeden tahmin ederim, kaydetmeden önce gösteririm.': 'One entry per line. Start with + for income; you can add dates like “yesterday” or “12.10”. I guess the category and show it before saving.',
    'Tarih (yazılmayanlar için)': 'Date (when not written)', 'Önizle': 'Preview', 'satır': 'rows', 'Hiçbiri': 'None', 'tutar yok': 'no amount', 'zaten var': 'already exists',
    'Ekstreden içe aktar': 'Import from statement', 'Dosya seç': 'Choose file', 'Excel okuyucu yüklenemedi; internet gerekli. CSV dosyası internetsiz de çalışır.': 'Could not load the Excel reader; internet needed. CSV works offline.', 'Dosyada satır bulunamadı': 'No rows found in the file', 'Okunuyor…': 'Reading…',
    'Sütun eşleştirme': 'Column mapping', 'Tarih': 'Date', 'Açıklama': 'Description', 'Tutar (+/−)': 'Amount (+/−)', 'Borç / çıkan': 'Debit / out', 'Alacak / giren': 'Credit / in', 'İşaretleri ters çevir': 'Flip signs', 'Kart ekstresinde harcamalar artı yazıyorsa aç': 'Turn on if card spending is shown as positive',
    'Hangi hesaba': 'Into account', 'Tarih ve tutar okunamadı. Sütun eşleştirmesini kontrol et.': 'Could not read dates and amounts. Check the column mapping.', 'Anahtar kelimeler, açıklamadan kategori tahmini için kullanılır (virgülle ayır).': 'Keywords are used to guess the category from the description (comma separated).',
    'anahtar kelimeler: market, migros…': 'keywords: groceries, store…', 'Gider kategorisi': 'Expense category', 'Gelir kategorisi': 'Income category', 'Yeni gelir': 'New income', 'Yeni gider': 'New expense', 'Bu ay': 'This month',
    'Kayıt silindi': 'Entry deleted', 'Kategori seç': 'Pick category', 'Hesap seç': 'Pick account', 'İş seç': 'Pick task', 'Önce bir hesap ekle': 'Add an account first', 'Seçenek yok': 'No options', 'Önce satırları yaz': 'Write the lines first', 'Bu sefer atlandı': 'Skipped this time', 'Bağlı para kaydı da geri alındı': 'The linked money entry was undone too', 'gelir, gider, hesaplar': 'income, spending, accounts', 'Gelir / gider': 'Income / expense', 'Cüzdan (bu ay ve yaklaşan ödemeler)': 'Wallet (this month and upcoming payments)', 'Günü gelen düzenli ödemeler': 'Regular payments that are due', 'Gelir kaydedildi · ': 'Income recorded · ', 'Tek seferlik': 'One-off'
  };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
