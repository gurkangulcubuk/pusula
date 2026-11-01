'use strict';
/* PUSULA 1.18 — Kategori bütçe limitleri, genel aramada Cüzdan, ana ekran kısayolları, haftalık özet, Bugün'den odak başlatma, Cüzdan dışa aktarma. */
Object.assign(TITLES, { weekly: { tr: ['Haftalık özet', 'Karne günü'], en: ['Weekly review', 'Report card day'] } });
Object.assign(TITLE_OPTS, { weekly: { tr: [['Haftalık özet', 'Hafta değerlendirmesi'], ['Karne günü', 'Maç özeti', 'Pazar muhasebesi']], en: [['Weekly review', 'Week in review'], ['Report card day', 'Match highlights', 'Sunday ledger']] } });
TITLE_SUGGEST.weekly = { tr: TITLE_OPTS.weekly.tr[1], en: TITLE_OPTS.weekly.en[1] };

/* ===================== 1. Kategori bütçe limitleri ===================== */
const catSpent = (id, m) => list('tx').filter(t => t.dir === 'out' && t.cat === id && monthOf(t.date) === m).reduce((a, t) => a + t.amount, 0);
const budgets = () => mcats().filter(c => c.dir === 'out' && c.limit > 0);
function budgetHtml(m) {
  const bs = budgets(); if (!bs.length) return '';
  return '<div class="section-title"><span>' + tr('Bütçeler') + '</span><button class="link" data-act="m-cats">' + tr('Düzenle') + '</button></div><div class="card m-bars">' + bs.map(c => {
    const sp = catSpent(c.id, m), p = Math.round(sp / c.limit * 100), left = c.limit - sp;
    return '<div class="m-bar" data-act="m-cat-filter" data-k="' + c.id + '"><div class="m-bar-top"><span><i style="background:' + c.color + '"></i>' + esc(c.name) + '</span><span><b>' + fmtTL(sp) + '</b> <span class="muted">/ ' + fmtTL(c.limit) + '</span></span></div>' +
      '<div class="m-bar-track"><i style="width:' + Math.min(100, p) + '%;background:' + (p > 100 ? 'var(--danger)' : p >= 80 ? 'var(--warn)' : c.color) + '"></i></div>' +
      '<div class="muted sm bud-left ' + (left < 0 ? 'neg' : '') + '">' + (left >= 0 ? Lx(fmtTL(left) + ' kaldı · %' + p, fmtTL(left) + ' left · ' + p + '%') : Lx(fmtTL(-left) + ' aşıldı', fmtTL(-left) + ' over')) + '</div></div>';
  }).join('') + '</div>';
}
(function () {
  const orig = viewMSummary;
  window.viewMSummary = function () {
    const h = orig(), b = budgetHtml(S.mMonth); if (!b) return h;
    const k = '<div class="section-title"><span>' + tr('Gider dağılımı'); const i = h.indexOf(k);
    return i < 0 ? h + b : h.slice(0, i) + b + h.slice(i);
  };
  const origA = moneyAlerts;
  window.moneyAlerts = function () {
    const out = origA(); if (!moneyOn()) return out; const m = today().slice(0, 7);
    budgets().forEach(c => { const sp = catSpent(c.id, m), p = sp / c.limit * 100;
      if (p > 100) out.push({ id: 'bud' + c.id + m + 'x', lvl: 'danger', icon: 'wallet', text: Lx(c.name + ' bütçesi ' + fmtTL(sp - c.limit) + ' aşıldı', c.name + ' budget over by ' + fmtTL(sp - c.limit)), go: 'money' });
      else if (p >= 80) out.push({ id: 'bud' + c.id + m + 'w', lvl: 'warn', icon: 'wallet', text: Lx(c.name + ' bütçesinin %' + Math.round(p) + '’i harcandı', Math.round(p) + '% of ' + c.name + ' budget spent'), go: 'money' }); });
    return out;
  };
})();
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset || el.dataset.catLimit === undefined) return;
  const c = mcats().find(x => x.id === el.dataset.catLimit); if (!c) return; const v = Math.abs(parseTL(el.value));
  c.limit = v > 0 ? v : 0; el.value = c.limit ? c.limit.toLocaleString('tr-TR') : ''; save(settings(), { silent: true });
});

/* ===================== 2. Genel aramada Cüzdan ===================== */
(function () {
  const orig = gsearchResults;
  window.gsearchResults = function (q) {
    const base = orig(q); const qq = lower(String(q || '').trim()); if (qq.length < 2 || !moneyOn()) return base;
    const num = parseTL(qq), has = (...xs) => xs.some(x => lower(String(x || '')).includes(qq));
    const row = (act, id, ic, t, sub, amt) => '<div class="row gs-row" data-act="' + act + '" data-id="' + id + '">' + icon(ic, 'sm') + '<div class="row-main"><div class="row-title u">' + esc(t) + '</div><div class="row-meta">' + sub + '</div></div>' + (amt || '') + '</div>';
    const txs = list('tx').filter(t => has(t.note, mcat(t.cat).name, acctName(t.acct)) || (num > 0 && Math.abs(t.amount - num) < 0.005)).sort((a, b) => b.date.localeCompare(a.date));
    const rp = regs().filter(r => has(r.title)); const cs = ctrs().filter(c => has(c.title));
    let h = '';
    if (txs.length) h += '<div class="section-title"><span>' + tr('Cüzdan hareketleri') + '<span class="count">' + txs.length + '</span></span></div><div class="card">' + txs.slice(0, 30).map(t => row('tx-edit', t.id, 'wallet', t.note || mcat(t.cat).name, fmtShort(t.date) + ' · ' + esc(mcat(t.cat).name), '<b class="' + (t.dir === 'in' ? 'pos' : t.dir === 'out' ? 'neg' : '') + '">' + fmtTL(t.dir === 'out' ? -t.amount : t.amount, t.dir !== 'xfer') + '</b>')).join('') + '</div>';
    if (rp.length || cs.length) h += '<div class="section-title"><span>' + tr('Düzenli, planlı ve sayaçlar') + '</span></div><div class="card">' + rp.map(r => row('reg-edit', r.id, 'repeat', r.title, (r.rec ? esc(recText(r.rec)) : tr('Planlı')) + (r.next ? ' · ' + relDay(r.next) : ''), '<b>' + fmtTL(r.amount) + '</b>')).join('') + cs.map(c => row('ctr-edit', c.id, 'wallet', c.title, fmtTL(c.price) + ' / ' + esc(c.unit || ''), '')).join('') + '</div>';
    if (!h) return base; return /class="section-title"/.test(base) ? base + h : h;
  };
})();

/* ===================== 3. Ana ekran kısayolları (?go=...) ===================== */
function openCtrQuick() {
  if (!ctrs().length) return editCounter();
  openSheet(sheetHead(esc(T('mCounters'))) + '<div class="sheet-body" id="ctrQuick">' + ctrStrip() + '</div>');
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#ctrQuick [data-act=ctr-inc], #ctrQuick [data-act=ctr-dec]'); if (b) setTimeout(() => { const q = $('#ctrQuick'); if (q) { q.innerHTML = ctrStrip(); translateTree(q); } }, 150); });
function handleLaunch() {
  let go = ''; try { go = new URLSearchParams(location.search).get('go') || ''; } catch (e) { /* yok */ }
  if (!go) return; try { history.replaceState(null, '', location.pathname); } catch (e) { /* yok */ }
  setTimeout(() => {
    if (go === 'task') { S.tab = 'today'; render(); editTask(); }
    else if (go === 'tx') { S.tab = 'money'; render(); editTx(); }
    else if (go === 'ctr') { S.tab = 'today'; render(); openCtrQuick(); }
    else if (go === 'focus') { S.tab = 'tools'; render(); unlockAudio(); openPomo(); }
    else if (go === 'note') { S.tab = 'info'; render(); openNote(); }
  }, 300);
}

/* ===================== 4. Haftalık özet ===================== */
function weekData() {
  const t0 = today(), from = addDays(t0, -6), inR = d => d && d >= from && d <= t0, nx = addDays(t0, 7);
  const ms = ymd => parseYmd(ymd).getTime();
  const done = list('task').filter(t => t.done && t.doneAt && t.doneAt >= ms(from)).length;
  const late = list('task').filter(t => !t.done && t.due && t.due < t0).length;
  const rt = list('routine').reduce((a, r) => a + (r.hist || []).filter(h => inR(h.d)).length, 0);
  let hs = 0, hd = 0; list('habit').forEach(h => { for (let i = 0; i < 7; i++) { const d = addDays(from, i); if (habitScheduled(h, d)) { hs++; if ((h.log || {})[d]) hd++; } } });
  const L = typeof tdGet === 'function' ? tdGet('focusLog', {}) : {}; let fm = 0; const byT = {}; for (let i = 0; i < 7; i++) { const x = L[addDays(from, i)]; if (x) { fm += x.m || 0; Object.entries(x.t || {}).forEach(([k, v]) => { byT[k] = (byT[k] || 0) + v; }); } }
  const topT = Object.keys(byT).sort((a, b) => byT[b] - byT[a])[0];
  const txs = list('tx').filter(t => inR(t.date) && t.dir !== 'xfer'); const inc = txs.filter(t => t.dir === 'in').reduce((a, t) => a + t.amount, 0), exp = txs.filter(t => t.dir === 'out').reduce((a, t) => a + t.amount, 0);
  const byC = {}; txs.filter(t => t.dir === 'out').forEach(t => { byC[t.cat] = (byC[t.cat] || 0) + t.amount; }); const topC = Object.keys(byC).sort((a, b) => byC[b] - byC[a]).slice(0, 3);
  const ctr = (typeof ctrs === 'function' ? ctrs() : []).map(c => { const a = list('tx').filter(t => t.ctr === c.id && inR(t.date)); return [c, a.reduce((s, t) => s + (t.qty || 0), 0), a.reduce((s, t) => s + t.amount, 0)]; }).filter(x => x[1]);
  const nTasks = list('task').filter(t => !t.done && t.due && t.due > t0 && t.due <= nx);
  const nPays = typeof regs === 'function' ? regs().filter(r => !r.paused && r.next && r.next > t0 && r.next <= nx) : [];
  let nEv = 0; for (let i = 1; i <= 7; i++) nEv += eventsOn(addDays(t0, i)).length + (Cal.on() ? Cal.forDate(addDays(t0, i)).length : 0);
  return { from, t0, done, late, rt, hs, hd, fm, topT, inc, exp, byC, topC, ctr, nTasks, nPays, nEv };
}
function openWeekly() {
  const w = weekData(), st = settings();
  const tile = (lbl, v, cls) => '<div class="m-tile ' + (cls || '') + '"><span>' + lbl + '</span><b>' + v + '</b></div>';
  let h = '<p class="muted sm" style="margin-top:0">' + fmtShort(w.from) + ' – ' + fmtShort(w.t0) + '</p>';
  h += '<div class="section-title first"><span>' + tr('Geçen 7 gün') + '</span></div><div class="m-tiles">' + tile(tr('Biten görev'), w.done) + tile(tr('Tekrarlı iş'), w.rt) + tile(tr('Alışkanlık'), w.hs ? '%' + Math.round(w.hd / w.hs * 100) : '—') + '</div>';
  h += '<div class="m-tiles">' + tile(tr('Odak'), fmtMin(w.fm)) + tile(tr('Gelir'), fmtTL(w.inc), 'in') + tile(tr('Gider'), fmtTL(w.exp), 'out') + '</div>';
  const lines = [];
  if (w.topT && S.items.get(w.topT)) lines.push(Lx('En çok odaklandığın iş: ', 'Most focused task: ') + '<b class="u">' + esc(S.items.get(w.topT).title) + '</b>');
  if (w.topC.length) lines.push(Lx('En çok harcama: ', 'Top spending: ') + w.topC.map(c => '<b>' + esc(mcat(c).name) + '</b> ' + fmtTL(w.byC[c])).join(', '));
  w.ctr.forEach(([c, q, s]) => lines.push('<b class="u">' + esc(c.title) + '</b> ' + q + ' ' + esc(c.unit || '') + ' · ' + fmtTL(s)));
  if (w.late) lines.push('<span class="neg">' + Lx(w.late + ' görev gecikmede', w.late + ' tasks overdue') + '</span>');
  if (lines.length) h += '<div class="card wk-lines">' + lines.map(l => '<div>' + l + '</div>').join('') + '</div>';
  h += '<div class="section-title"><span>' + tr('Önümüzdeki 7 gün') + '</span></div><div class="m-tiles">' + tile(tr('Görev'), w.nTasks.length) + tile(tr('Etkinlik'), w.nEv) + tile(tr('Ödeme'), fmtTL(w.nPays.filter(r => r.dir === 'out').reduce((a, r) => a + r.amount, 0)), 'out') + '</div>';
  if (w.nTasks.length || w.nPays.length) h += '<div class="card">' + w.nTasks.sort(taskSort).slice(0, 8).map(taskRow).join('') + w.nPays.map(regRow).join('') + '</div>';
  openSheet(sheetHead(esc(T('weekly'))) + '<div class="sheet-body">' + h + '</div>');
}
const weeklyShow = () => { const d = new Date(); return (d.getDay() === 0 && d.getHours() >= 17) || d.getDay() === 1; };
TODAY_CARDS.weekly = function () {
  if (!weeklyShow()) return ''; const w = weekData();
  return card('goal', T('weekly'), '<div class="m-mini wk-mini"><span>' + tr('Geçen 7 gün') + '</span><b>' + Lx(w.done + ' görev', w.done + ' tasks') + '</b><b>' + fmtMin(w.fm) + '</b><b class="neg">' + fmtTL(-w.exp, true) + '</b></div><button class="btn block" data-act="weekly">' + tr('Özeti aç') + '</button>');
};
(function () {
  const orig = viewToday;
  window.viewToday = function () { return orig() + '<button class="link week-link" data-act="weekly">' + icon('goal', 'sm') + ' <span class="u">' + esc(T('weekly')) + '</span></button>'; };
})();
// Bugün kartı listesi ve etiketi
CARD_LABELS.weekly = 'Haftalık özet (pazar akşamı ve pazartesi)';

/* ===================== 5. Bugün'den odak başlatma ===================== */
(function () {
  const orig = taskRow;
  window.taskRow = function (t) {
    const h = orig(t); if (S.tab !== 'today' || t.done || typeof openPomo !== 'function') return h;
    const i = h.lastIndexOf('</div>');
    return h.slice(0, i) + '<button class="icon-btn fc-go" data-act="fc-go" data-id="' + t.id + '" aria-label="' + esc(tr('Odak başlat')) + '">' + icon('clock', 'sm') + '</button>' + h.slice(i);
  };
})();

/* ===================== 6. Cüzdan dışa aktarma ===================== */
function openExport() {
  const m = S.mMonth;
  openSheet(sheetHead('Dışa aktar') + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">' + tr('Hareketleri Excel’de açılabilen bir dosya olarak indir ya da paylaş.') + '</p>' +
    '<div class="field"><span>' + tr('Hangi kayıtlar') + '</span>' + seg('exR', [['m', monthLabel(m)], ['3m', 'Son 3 ay'], ['y', m.slice(0, 4)], ['all', 'Tümü']], 'm') + '</div>' +
    '<div class="field"><span>' + tr('Biçim') + '</span>' + seg('exF', [['csv', 'CSV (Excel uyumlu)'], ['xlsx', 'Excel (.xlsx)']], 'csv') + '<div class="sub muted sm">' + tr('Excel biçimi için internet gerekir; CSV her zaman çalışır.') + '</div></div>' +
    '<button class="btn primary block" data-act="ex-go">' + icon('download', 'sm') + ' <span>' + tr('İndir / paylaş') + '</span></button></div>');
}
function exRows(r) {
  const m = S.mMonth, y = m.slice(0, 4), from3 = shiftM(m, -2);
  const ok = t => r === 'all' || (r === 'm' && monthOf(t.date) === m) || (r === 'y' && t.date.slice(0, 4) === y) || (r === '3m' && monthOf(t.date) >= from3 && monthOf(t.date) <= m);
  const head = [tr('Tarih'), tr('Tür'), tr('Tutar'), tr('Kategori'), tr('Hesap'), tr('Hedef hesap'), tr('Açıklama'), tr('Bağlı iş')];
  const rows = list('tx').filter(ok).sort((a, b) => a.date.localeCompare(b.date)).map(t => [t.date, tr(t.dir === 'in' ? 'Gelir' : t.dir === 'out' ? 'Gider' : 'Transfer'), t.dir === 'out' ? -t.amount : t.amount, t.dir === 'xfer' ? '' : mcat(t.cat).name, acctName(t.acct), t.dir === 'xfer' ? acctName(t.toAcct) : '', t.note || '', t.link ? ((S.items.get(t.link.id) || {}).title || t.link.title || '') : '']);
  return { head, rows };
}
async function exGo() {
  const r = segVal('exR') || 'm', f = segVal('exF') || 'csv'; const { head, rows } = exRows(r);
  if (!rows.length) return toast(tr('Bu aralıkta kayıt yok'));
  const name = 'pusula-cuzdan-' + (r === 'm' ? S.mMonth : r === 'y' ? S.mMonth.slice(0, 4) : r === '3m' ? 'son3ay-' + S.mMonth : 'tumu') + '.' + f;
  let blob;
  if (f === 'xlsx') {
    try { await loadXLSX(); } catch (e) { return toast(tr('Excel dosyası için internet gerekli; CSV’yi seçebilirsin.')); }
    const ws = XLSX.utils.aoa_to_sheet([head].concat(rows.map(x => [parseYmd(x[0])].concat(x.slice(1)))), { cellDates: true }); ws['!cols'] = [{ wch: 11 }, { wch: 9 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 32 }, { wch: 24 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, tr('Hareketler')); blob = new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } else {
    const cell = v => { if (typeof v === 'number') return String(v).replace('.', ','); const s = String(v == null ? '' : v); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    blob = new Blob(['﻿' + [head].concat(rows).map(x => x.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  }
  const file = new File([blob], name, { type: blob.type });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); closeSheet(); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  closeSheet(); toast(Lx(rows.length + ' kayıt indirildi', rows.length + ' entries downloaded'));
}
(function () { // Hareketler araç çubuğuna "Dışa aktar"
  const orig = viewMoves;
  window.viewMoves = function () { return orig().replace('<button class="link" data-act="m-cats">', '<button class="link" data-act="m-export">' + tr('Dışa aktar') + '</button><button class="link" data-act="m-cats">'); };
})();

Object.assign(ACTIONS, {
  'weekly': () => openWeekly(),
  'fc-go': el => { const id = el.dataset.id; unlockAudio(); FC.task = id; if (!FC.run) { FC.phase = 'work'; FC.workMs = 0; FC.loggedMs = 0; FC.left = fcDur('work'); fcStart(); } fcSave(); openPomo(); toast(Lx('Odak başladı: ', 'Focus started: ') + ((S.items.get(id) || {}).title || '')); },
  'm-export': () => openExport(),
  'ex-go': () => exGo()
});

(function () {
  const add = { 'Bütçeler': 'Budgets', 'Aylık limit': 'Monthly limit', '₺ · isteğe bağlı': '₺ · optional', 'Excel dosyası için internet gerekli; CSV’yi seçebilirsin.': 'Excel needs internet; you can pick CSV.', 'Düzenle': 'Edit', 'Aylık limit (₺, isteğe bağlı)': 'Monthly limit (₺, optional)', 'Cüzdan hareketleri': 'Wallet entries', 'Düzenli, planlı ve sayaçlar': 'Regular, planned & counters',
    'Geçen 7 gün': 'Last 7 days', 'Biten görev': 'Tasks done', 'Tekrarlı iş': 'Recurring', 'Alışkanlık': 'Habits', 'Odak': 'Focus', 'Önümüzdeki 7 gün': 'Next 7 days', 'Görev': 'Tasks', 'Etkinlik': 'Events', 'Ödeme': 'Payments', 'Özeti aç': 'Open review',
    'Haftalık özet (pazar akşamı ve pazartesi)': 'Weekly review (Sunday evening and Monday)', 'Odak başlat': 'Start focus', 'Dışa aktar': 'Export', 'Hareketleri Excel’de açılabilen bir dosya olarak indir ya da paylaş.': 'Download or share your entries as a file that opens in Excel.',
    'Hangi kayıtlar': 'Which entries', 'Son 3 ay': 'Last 3 months', 'Tümü': 'All', 'Biçim': 'Format', 'CSV (Excel uyumlu)': 'CSV (Excel friendly)', 'Excel (.xlsx)': 'Excel (.xlsx)', 'Excel biçimi için internet gerekir; CSV her zaman çalışır.': 'Excel format needs internet; CSV always works.',
    'İndir / paylaş': 'Download / share', 'Tür': 'Type', 'Tutar': 'Amount', 'Hedef hesap': 'To account', 'Bağlı iş': 'Linked task', 'Bu aralıkta kayıt yok': 'No entries in this range', 'Hareketler': 'Transactions' };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
