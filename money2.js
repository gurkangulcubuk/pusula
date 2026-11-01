'use strict';
/* PUSULA 1.17 — Cüzdan eklentileri: Planlı (ileriye dönük ödemeler ve nakit akışı) ve sayaçlı kalemler (+1 ile artan harcamalar). */
Object.assign(TITLES, {
  mPlan: { tr: ['Planlı', 'Kristal küre'], en: ['Planned', 'Crystal ball'] },
  mCounters: { tr: ['Sayaçlar', 'Çetele'], en: ['Counters', 'Tally marks'] }
});
Object.assign(TITLE_OPTS, {
  mPlan: { tr: [['Planlı', 'Nakit akışı'], ['Kristal küre', 'İleri sar', 'Hesap kitap']], en: [['Planned', 'Cash flow'], ['Crystal ball', 'Fast forward', 'Do the math']] },
  mCounters: { tr: [['Sayaçlar', 'Tekrarlayan harcamalar'], ['Çetele', 'Tık tık', 'Bir tane daha']], en: [['Counters', 'Repeat buys'], ['Tally marks', 'Tick tick', 'One more']] }
});
['mPlan', 'mCounters'].forEach(k => { TITLE_SUGGEST[k] = { tr: TITLE_OPTS[k].tr[1], en: TITLE_OPTS[k].en[1] }; });

/* ----- sekmeler: Planlı eklendi ----- */
function viewMoney() {
  moneyAuto();
  const subs = [{ k: 'summary', label: T('mSummary') }, { k: 'moves', label: T('mMoves') }, { k: 'plan', label: T('mPlan') }, { k: 'regular', label: T('mRegular') }, { k: 'accounts', label: T('mAccounts') }];
  const h = subSeg(subs, S.moneySub, 'money-sub');
  if (S.moneySub === 'moves') return h + viewMoves();
  if (S.moneySub === 'plan') return h + viewPlanFlow();
  if (S.moneySub === 'regular') return h + viewRegular();
  if (S.moneySub === 'accounts') return h + viewAccounts();
  return h + ctrSection(true) + viewMSummary();
}

/* ===================== Planlı: nakit akışı ===================== */
S.mFlowDays = +lsGet('pusula.mFlowDays', '90') || 90;
const flowAll = () => settings().moneyFlowAll !== false; // gelirler ve düzenli kalemler de hesaba katılsın mı
function flowEvents(days) {
  const t0 = today(), end = addDays(t0, days), all = flowAll(), out = [];
  regs().forEach(r => {
    if (r.paused || !r.next) return; if (!all && (r.rec || r.dir === 'in')) return;
    let d = r.next, g = 0;
    while (d && d <= end && g++ < 400) {
      out.push({ date: d < t0 ? t0 : d, real: d, r, amt: r.dir === 'in' ? r.amount : -r.amount, over: d < t0, first: g === 1 });
      if (!r.rec) break; d = nextOcc(d, r.rec); if (r.rec.until && d > r.rec.until) break;
    }
  });
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.amt - b.amt)); // aynı gün: önce giderler (temkinli)
}
function flowRun(evs) {
  const as = accts(), bal = {}; as.forEach(a => { bal[a.id] = acctBal(a); });
  let tot = as.reduce((a, x) => a + bal[x.id], 0); let low = { v: tot, d: today() };
  evs.forEach(e => {
    const a = e.r.acct && bal[e.r.acct] !== undefined ? S.items.get(e.r.acct) : null;
    if (a) bal[a.id] = Math.round((bal[a.id] + e.amt) * 100) / 100; tot = Math.round((tot + e.amt) * 100) / 100;
    e.acct = a; e.after = a ? bal[a.id] : tot; e.tot = tot;
    e.short = e.amt < 0 && e.after < 0 && !(a && a.kind === 'card') ? -e.after : 0;
    if (tot < low.v) low = { v: tot, d: e.date };
  });
  return { tot, low, start: as.reduce((a, x) => a + acctBal(x), 0) };
}
function viewPlanFlow() {
  const days = S.mFlowDays, evs = flowEvents(days), has = accts().length; const run = has ? flowRun(evs) : null;
  let h = '<div class="section-title first"><span class="u">' + esc(T('mPlan')) + '</span><button class="link" data-act="plan-new">+ ' + tr('Planlı ödeme') + '</button></div>' +
    '<p class="muted sm page-hint">' + tr('İleride yapacağın ödemeler gider olarak düşmez; her birinin yanında ödeyince ne kadar kalacağı yazar. Günü gelince “Ödendi mi?” diye sorar.') + '</p>' +
    '<div class="chips m-days">' + [30, 90, 180, 365].map(d => '<button class="chip sm ' + (days === d ? 'on' : '') + '" data-act="flow-days" data-n="' + d + '">' + Lx(d === 365 ? '1 yıl' : d + ' gün', d === 365 ? '1 year' : d + ' days') + '</button>').join('') + '</div>' +
    '<div class="set-row flow-sw"><div class="grow"><div>' + tr('Gelirleri ve düzenli kalemleri de kat') + '</div><div class="sub">' + tr('Maaş, kira, fatura da tarih sırasına girer; kapalıyken sadece planlı ödemeler bugünkü bakiyeden düşer') + '</div></div><button type="button" class="switch ' + (flowAll() ? 'on' : '') + '" data-act="flow-all" aria-label="Aç/kapat"></button></div>';
  if (run) h += '<div class="m-tiles"><div class="m-tile"><span>' + tr('Bugün') + '</span><b>' + fmtTL(run.start) + '</b></div><div class="m-tile ' + (run.tot < 0 ? 'neg' : '') + '"><span>' + Lx(days === 365 ? '1 yıl sonra' : days + ' gün sonra', days === 365 ? 'In 1 year' : 'In ' + days + ' days') + '</span><b>' + fmtTL(run.tot) + '</b></div><div class="m-tile ' + (run.low.v < 0 ? 'neg' : '') + '"><span>' + tr('En düşük') + ' · ' + fmtShort(run.low.d) + '</span><b>' + fmtTL(run.low.v) + '</b></div></div>';
  else h += '<div class="card"><div class="empty">' + tr('Ödeme sonrası kalan bakiyeyi görmek için Hesaplar’dan hesaplarını ekle.') + ' <button class="link" data-act="money-sub" data-k="accounts">' + esc(T('mAccounts')) + '</button></div></div>';
  if (!evs.length) return h + '<div class="card"><div class="empty">' + tr('Bu aralıkta planlı bir şey yok. “+ Planlı ödeme” ile ekle.') + '</div></div>';
  let mon = '';
  evs.forEach(e => {
    const m = monthOf(e.date); if (m !== mon) { if (mon) h += '</div>'; mon = m; h += '<div class="section-title"><span>' + monthLabel(m) + '</span></div><div class="card">'; }
    const r = e.r, c = mcat(r.cat), due = e.first && r.next <= today() && r.mode !== 'auto';
    h += '<div class="row flow-row ' + (e.short ? 'short' : '') + '" data-act="reg-edit" data-id="' + r.id + '"><span class="tx-dot" style="background:' + c.color + '">' + icon(r.dir === 'in' ? 'income' : 'expense', 'xs') + '</span>' +
      '<div class="row-main"><div class="row-title u">' + esc(r.title) + '</div><div class="row-meta"><span class="' + (e.over ? 'danger' : '') + '">' + (e.over ? Lx('gecikti · ', 'late · ') + fmtShort(e.real) : relDay(e.date)) + '</span>' + (r.rec ? '<span>' + icon('repeat', 'xs') + '</span>' : '<span>' + tr('planlı') + '</span>') + (e.acct ? '<span class="u">' + esc(e.acct.name) + '</span>' : '') + '</div>' +
      (run ? '<div class="flow-after">' + (e.short ? '<b class="neg">' + Lx(fmtTL(e.short) + ' eksik', fmtTL(e.short) + ' short') + '</b>' : '<span>' + tr('sonra') + ' <b>' + fmtTL(e.after) + '</b></span>') + '</div>' : '') + '</div>' +
      '<div class="reg-right"><b class="' + (r.dir === 'in' ? 'pos' : 'neg') + '">' + fmtTL(e.amt, true) + '</b>' + (due ? '<span class="reg-btns"><button class="btn sm-btn primary" data-act="reg-pay" data-id="' + r.id + '">' + (r.dir === 'in' ? tr('Geldi') : tr('Ödendi')) + '</button></span>' : '') + '</div></div>';
  });
  return h + '</div>';
}

/* ===================== Sayaçlı kalemler ===================== */
const ctrs = () => list('counter').sort((a, b) => (a.order || 0) - (b.order || 0) || (a.created || 0) - (b.created || 0));
const ctrTx = (c, d) => list('tx').find(t => t.ctr === c.id && t.date === (d || today()));
const ctrLabel = (c, q) => c.title + ' · ' + q + ' ' + (c.unit || tr('adet'));
async function ctrAdd(id, n) {
  const c = S.items.get(id); if (!c || c.deleted) return; let t = ctrTx(c);
  if (!t) { if (n < 0) return; t = { id: uid(), type: 'tx', date: today(), dir: 'out', amount: 0, qty: 0, cat: c.cat || defCat('out'), acct: c.acct || defAcct(), note: '', ctr: c.id, src: 'counter' }; }
  const q0 = t.qty || 0;
  if (n > 0) { t.qty = q0 + n; t.amount = Math.round((t.amount + c.price * n) * 100) / 100; }
  else { if (q0 <= 1) { await remove(t, { silent: true }); if (navigator.vibrate) navigator.vibrate(10); return render(); } t.amount = Math.round((t.amount - t.amount / q0) * 100) / 100; t.qty = q0 - 1; }
  t.note = ctrLabel(c, t.qty); if (navigator.vibrate) navigator.vibrate(n > 0 ? 15 : 8);
  await save(t);
}
function ctrMonth(c, m) { const a = list('tx').filter(t => t.ctr === c.id && monthOf(t.date) === m); return { q: a.reduce((s, t) => s + (t.qty || 0), 0), sum: a.reduce((s, t) => s + t.amount, 0) }; }
function ctrStrip() {
  return '<div class="ctr-strip">' + ctrs().map(c => { const t = ctrTx(c), q = t ? t.qty : 0;
    return '<div class="ctr"><button class="ctr-name" data-act="ctr-edit" data-id="' + c.id + '"><b class="u">' + esc(c.title) + '</b><span>' + (q ? q + ' ' + esc(c.unit || tr('adet')) + ' · ' + fmtTL(t.amount) : fmtTL(c.price) + ' / ' + esc(c.unit || tr('adet'))) + '</span></button>' +
      '<button class="ctr-btn" data-act="ctr-dec" data-id="' + c.id + '" aria-label="Bir azalt" ' + (q ? '' : 'disabled') + '>−</button><button class="ctr-btn plus" data-act="ctr-inc" data-id="' + c.id + '" aria-label="Bir ekle">+1</button></div>'; }).join('') + '</div>';
}
function ctrSection(withMonth) {
  const cs = ctrs();
  if (!cs.length) return '<button class="link ctr-add-first" data-act="ctr-new">+ ' + tr('Sayaçlı kalem (sigara, kahve gibi tekrarlayan harcamalar)') + '</button>';
  let h = '<div class="section-title first"><span class="u">' + esc(T('mCounters')) + '</span><button class="link" data-act="ctr-new">+ ' + tr('Yeni') + '</button></div><div class="card ctr-card">' + ctrStrip();
  if (withMonth) { const rows = cs.map(c => [c, ctrMonth(c, S.mMonth)]).filter(x => x[1].q); if (rows.length) h += '<div class="ctr-month"><span class="muted sm">' + monthLabel(S.mMonth) + '</span>' + rows.map(([c, x]) => '<span><b class="u">' + esc(c.title) + '</b> ' + x.q + ' ' + esc(c.unit || tr('adet')) + ' · ' + fmtTL(x.sum) + '</span>').join('') + '</div>'; }
  return h + '</div>';
}
TODAY_CARDS.counters = function () { if (!moneyOn() || !ctrs().length) return ''; return card('wallet', T('mCounters'), ctrStrip(), 'money'); };
function editCounter(c) {
  const isNew = !c; const d = c ? clone(c) : { id: uid(), type: 'counter', title: '', unit: 'adet', price: 0, cat: '', acct: defAcct(), order: Date.now() };
  S.draft = d;
  openSheet(sheetHead(isNew ? 'Yeni sayaçlı kalem' : 'Sayaçlı kalemi düzenle') + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">' + tr('Bir kez tanımla, sonra her seferinde +1’e dokun. Aynı günün kayıtları tek satırda toplanır (ör. Sigara · 3 paket).') + '</p>' +
    '<input class="input big" name="title" placeholder="' + esc(tr('Örn. Sigara, Kahve, Çay')) + '" value="' + esc(d.title) + '" autocomplete="off">' +
    '<div class="field-row"><label class="field"><span>Birim fiyat (₺)</span><input class="input" name="amt" inputmode="decimal" placeholder="0" value="' + (d.price ? String(d.price).replace('.', ',') : '') + '"></label><label class="field"><span>Birim</span><input class="input" name="unit" value="' + esc(d.unit || '') + '" placeholder="adet"></label></div>' +
    '<div class="chips ctr-units">' + ['adet', 'paket', 'bardak', 'kutu', 'saat'].map(u => '<button type="button" class="chip sm" data-act="ctr-unit" data-v="' + u + '">' + u + '</button>').join('') + '</div>' +
    '<div class="field-row"><label class="field"><span>Kategori</span><select class="input" name="cCat">' + catOptions('out', d.cat || defCat('out')) + '</select></label>' + (accts().length ? '<label class="field"><span>Hesap</span><select class="input" name="acct">' + acctOptions(d.acct, true) + '</select></label>' : '') + '</div>' +
    (isNew ? '' : (() => { const x = ctrMonth(d, today().slice(0, 7)); return '<p class="muted sm">' + Lx('Bu ay: ' + x.q + ' ' + (d.unit || 'adet') + ' · ' + fmtTL(x.sum) + '. Fiyatı değiştirirsen eski kayıtlar eski fiyatla kalır.', 'This month: ' + x.q + ' ' + (d.unit || 'units') + ' · ' + fmtTL(x.sum) + '. Changing the price keeps past entries as they were.') + '</p>'; })()) +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="ctr-delete">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="ctr-save">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
document.addEventListener('input', e => { if (e.target.name !== 'title' || !S.draft || S.draft.type !== 'counter') return; const s = $('#sheetRoot [name=cCat]'); const g = guessCat(e.target.value, 'out'); if (s && g && !s.dataset.manual) s.value = g.id; });
document.addEventListener('change', e => { if (e.target.name === 'cCat') e.target.dataset.manual = '1'; });
async function saveCounter() {
  const d = S.draft, title = fval('title').trim(), price = Math.abs(parseTL(fval('amt')));
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  if (!(price > 0)) { $('#sheetRoot [name=amt]').classList.add('err'); return; }
  const base = S.items.get(d.id) || d; Object.assign(base, { title, price, unit: fval('unit').trim() || 'adet', cat: fval('cCat') || defCat('out'), acct: fval('acct') || '' });
  closeSheet(); await save(base);
}
Object.assign(ACTIONS, {
  'plan-new': () => editReg(null, { rec: null, mode: 'ask', next: addDays(today(), 7) }),
  'flow-days': el => { S.mFlowDays = +el.dataset.n; lsSet('pusula.mFlowDays', String(S.mFlowDays)); render(); },
  'flow-all': async () => { const st = settings(); st.moneyFlowAll = !flowAll(); await save(st); },
  'ctr-new': () => editCounter(),
  'ctr-edit': el => { const c = S.items.get(el.dataset.id); if (c) editCounter(c); },
  'ctr-inc': el => ctrAdd(el.dataset.id, 1),
  'ctr-dec': el => ctrAdd(el.dataset.id, -1),
  'ctr-unit': el => { const i = $('#sheetRoot [name=unit]'); if (i) i.value = el.dataset.v; },
  'ctr-save': () => saveCounter(),
  'ctr-delete': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); if (!ask(Lx('“' + it.title + '” sayacı silinsin mi? (Geçmiş kayıtlar Hareketler’de kalır)', 'Delete the “' + it.title + '” counter? (Past entries stay)'))) return; closeSheet(); await remove(it); }
});

/* İngilizce */
(function () {
  const add = { 'Planlı ödeme': 'Planned payment', 'İleride yapacağın ödemeler gider olarak düşmez; her birinin yanında ödeyince ne kadar kalacağı yazar. Günü gelince “Ödendi mi?” diye sorar.': 'Future payments aren’t counted as spending yet; each shows what remains after paying. On the day it asks “Paid?”.',
    'Gelirleri ve düzenli kalemleri de kat': 'Include income and regular items', 'Maaş, kira, fatura da tarih sırasına girer; kapalıyken sadece planlı ödemeler bugünkü bakiyeden düşer': 'Salary, rent and bills join the timeline; when off, only planned payments come off today’s balance',
    'En düşük': 'Lowest', 'Ödeme sonrası kalan bakiyeyi görmek için Hesaplar’dan hesaplarını ekle.': 'Add your accounts to see the balance left after each payment.', 'Bu aralıkta planlı bir şey yok. “+ Planlı ödeme” ile ekle.': 'Nothing planned in this range. Add one with “+ Planned payment”.', 'planlı': 'planned', 'sonra': 'after',
    'Yeni planlı ödeme': 'New planned payment', 'Planlı ödemeyi düzenle': 'Edit planned payment', 'adet': 'pcs', 'Sayaçlı kalem (sigara, kahve gibi tekrarlayan harcamalar)': 'Counter item (repeat buys like coffee)', 'Yeni sayaçlı kalem': 'New counter item', 'Sayaçlı kalemi düzenle': 'Edit counter item',
    'Bir kez tanımla, sonra her seferinde +1’e dokun. Aynı günün kayıtları tek satırda toplanır (ör. Sigara · 3 paket).': 'Set it once, then tap +1 each time. A day’s entries add up in one line (e.g. Coffee · 3 cups).', 'Örn. Sigara, Kahve, Çay': 'E.g. Coffee, Tea', 'Birim fiyat (₺)': 'Unit price (₺)', 'Birim': 'Unit', 'Sayaçlı harcamalar (+1 düğmeleri)': 'Counter spending (+1 buttons)' };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
