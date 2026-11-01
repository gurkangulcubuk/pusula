'use strict';
/* PUSULA 1.14 — Günün akışı, akıllı hızlı ekleme, kaydırma hareketleri, genel arama */

/* ===================== Günün akışı (Bugün kartı) ===================== */
function flowCard() {
  const t0 = today(); const all = typeof dayItems === 'function' ? dayItems(t0) : [];
  const items = all.filter(x => x.time || x.k === 'gev' || x.k === 'ev' || x.k === 'rt');
  const nowHM = pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());
  let body = '';
  if (!items.length) body = '<div class="empty">' + tr('Bugün için saatli bir şey yok.') + '</div>';
  else {
    let nowPlaced = false;
    items.forEach(x => {
      if (!nowPlaced && x.time && x.time > nowHM) { body += '<div class="flow-now"><span>' + nowHM + '</span></div>'; nowPlaced = true; }
      body += itemRow(Object.assign({}, x, { past: x.time && x.time < nowHM }));
    });
    if (!nowPlaced && items.some(x => x.time)) body += '<div class="flow-now"><span>' + nowHM + '</span></div>';
  }
  return card('clock', T('flow'), '<div class="flow">' + body + '</div>', 'calendar');
}

/* ===================== Akıllı hızlı ekleme ===================== */
const QA_DAYS = [['pazartesi', 'monday'], ['salı', 'tuesday'], ['çarşamba', 'wednesday'], ['perşembe', 'thursday'], ['cuma', 'friday'], ['cumartesi', 'saturday'], ['pazar', 'sunday']];
const QA_MONTHS = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
const QA_MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const QB = '(?<=^|[\\s,])', QE = '(?=$|[\\s,.!?])';
const SUF = "(?:\\s*günü)?(?:['’]?(?:y?[aeıi]|n[ıi]n|d[ae]|t[ae]))?";
function dayRx() { return QA_DAYS.flat().sort((a, b) => b.length - a.length).join('|'); }
function dayIdx(w) { w = w.toLocaleLowerCase('tr-TR'); let best = -1, len = 0; QA_DAYS.forEach((d, i) => d.forEach(x => { if (w.startsWith(x) && x.length > len) { best = i; len = x.length; } })); return best; }
function parseQuick(raw) {
  let s = ' ' + raw + ' ';
  const out = { due: null, time: null, rec: null };
  const t0 = today();
  const cut = (rx, fn) => { const m = new RegExp(rx, 'iu').exec(s); if (!m) return false; const r = fn(m); if (r === false) return false; s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length); return true; };
  const nextDow = (i, from) => { let d = from || t0; for (let k = 0; k < 7; k++) { if (dow(d) === i) return d; d = addDays(d, 1); } return d; };
  const DR = dayRx();
  // tekrar
  cut(QB + '(?:her\\s+)?hafta\\s*içi(?:\\s+her\\s+gün)?' + QE + '|' + QB + 'every\\s+weekday' + QE, () => { out.rec = { mode: 'cal', every: 1, unit: 'week', wdays: [0, 1, 2, 3, 4], mday: null, until: '' }; }) ||
  cut(QB + '(?:her|every)\\s+((?:(?:' + DR + ')' + SUF + '(?:\\s*,\\s*|\\s+(?:ve|and)\\s+|\\s+)?)+)' + QE, m => { const ws = m[1].split(/[\s,]+|\s+ve\s+|\s+and\s+/).map(dayIdx).filter(i => i >= 0); if (!ws.length) return false; out.rec = { mode: 'cal', every: 1, unit: 'week', wdays: Array.from(new Set(ws)).sort(), mday: null, until: '' }; }) ||
  cut(QB + '(?:her|every)\\s+(gün|day|hafta|week|ay|month|yıl|year)' + QE, m => { const u = { gün: 'day', day: 'day', hafta: 'week', week: 'week', ay: 'month', month: 'month', yıl: 'year', year: 'year' }[m[1].toLocaleLowerCase('tr-TR')]; out.rec = { mode: 'cal', every: 1, unit: u, wdays: [], mday: null, until: '' }; });
  // tarih
  cut(QB + '(bugün|today)' + QE, () => { out.due = t0; }) ||
  cut(QB + '(yarın|tomorrow)' + QE, () => { out.due = addDays(t0, 1); }) ||
  cut(QB + '(öbür\\s*gün|ertesi\\s*gün)' + QE, () => { out.due = addDays(t0, 2); }) ||
  cut(QB + '(\\d{1,2})\\s+(' + QA_MONTHS.concat(QA_MONTHS_EN).join('|') + ")(?:['’]?[a-zığüşöç]*)?(?:\\s+(\\d{4}))?" + QE, m => { let mi = QA_MONTHS.indexOf(m[2].toLocaleLowerCase('tr-TR')); if (mi < 0) mi = QA_MONTHS_EN.indexOf(m[2].toLowerCase()); const y = m[3] ? +m[3] : new Date().getFullYear(); let d = ymd(new Date(y, mi, +m[1])); if (!m[3] && d < t0) d = ymd(new Date(y + 1, mi, +m[1])); out.due = d; }) ||
  cut(QB + '(\\d{1,2})[./](\\d{1,2})(?:[./](\\d{2,4}))?' + QE, m => { const a = +m[1], b = +m[2]; if (b > 12 || a > 31 || !m[3] && b > 12) return false; if (!m[3] && /^\d{2}$/.test(m[2]) && b > 12) return false; let y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear(); let d = ymd(new Date(y, b - 1, a)); if (!m[3] && d < t0) d = ymd(new Date(y + 1, b - 1, a)); out.due = d; }) ||
  cut(QB + '(haftaya\\s+|next\\s+)?(' + DR + ')' + SUF + QE, m => { const i = dayIdx(m[2]); if (i < 0) return false; out.due = m[1] ? nextDow(i, addDays(t0, 7 - dow(t0))) : nextDow(i, t0); }) ||
  cut(QB + '(haftaya|next\\s+week)' + QE, () => { out.due = addDays(t0, 7); });
  // saat
  const setT = (h, mi) => { if (h > 23 || mi > 59) return false; out.time = pad(h) + ':' + pad(mi); };
  cut(QB + '(sabah|öğle(?:n|den\\s+sonra)?|akşam|gece|morning|afternoon|evening|night)\\s+(?:saat\\s+)?(\\d{1,2})(?:[:.](\\d{2}))?' + "(?:['’]?(?:d[ae]|t[ae]))?" + QE, m => { let h = +m[2]; const w = m[1].toLocaleLowerCase('tr-TR'); if (/akşam|gece|öğleden|evening|night|afternoon/.test(w) && h < 12) h += 12; if (/öğle$|öğlen/.test(w) && h < 6) h += 12; return setT(h, +(m[3] || 0)); }) ||
  cut(QB + '(?:saat\\s+|at\\s+)?(\\d{1,2})[:.](\\d{2})' + "(?:['’]?(?:d[ae]|t[ae]))?" + QE, m => setT(+m[1], +m[2])) ||
  cut(QB + '(?:saat|at)\\s+(\\d{1,2})' + "(?:['’]?(?:d[ae]|t[ae]))?" + QE, m => setT(+m[1], 0)) ||
  cut(QB + "(\\d{1,2})['’](?:d[ae]|t[ae])" + QE, m => setT(+m[1], 0));
  if (out.rec && !out.due) out.due = out.rec.unit === 'week' && out.rec.wdays.length ? nextDow(out.rec.wdays.find(w => w >= dow(t0)) !== undefined ? out.rec.wdays.find(w => w >= dow(t0)) : out.rec.wdays[0], t0) : t0;
  if (out.time && !out.due) out.due = t0;
  let title = s.replace(/\s+/g, ' ').trim().replace(/^[,.\-–]+|[,.\-–]+$/g, '').trim();
  out.title = title ? title.charAt(0).toLocaleUpperCase('tr-TR') + title.slice(1) : '';
  return out;
}
function qaPreview(p) {
  const parts = [];
  if (p.due) parts.push(icon('event', 'xs') + ' ' + esc(relDay(p.due) === fmtShort(p.due) ? fmtLong(p.due) : relDay(p.due)));
  if (p.time) parts.push(icon('clock', 'xs') + ' ' + p.time);
  if (p.rec) parts.push(icon('repeat', 'xs') + ' ' + esc(recText(p.rec)));
  return parts.length ? parts.join('<span class="qa-dot">·</span>') : '<span class="muted">' + tr('Tarih ya da saat yazarsan anlarım: “yarın 18:00”, “her salı”, “5 kasım”') + '</span>';
}
function smartAddHtml() {
  if (!planOn('tasks')) return '';
  return '<form class="smart-add" id="smartAdd"><span class="sa-ico">' + icon('plus', 'sm') + '</span><input name="q" placeholder="' + esc(tr('Ne yapacaksın? örn. yarın 18:00 spor')) + '" autocomplete="off" enterkeyhint="done"><button class="icon-btn" type="submit" aria-label="Ekle">' + icon('check', 'sm') + '</button></form><div class="sa-prev" id="saPrev"></div>';
}
(function () { const vt = viewToday; viewToday = function () { const h = vt(); const i = h.indexOf('<div class="grid-card'); return i < 0 ? smartAddHtml() + h : h.slice(0, i) + smartAddHtml() + h.slice(i); }; })();
document.addEventListener('input', e => {
  if (e.target.name !== 'q' || !e.target.closest('#smartAdd')) return;
  const pv = $('#saPrev'); if (!pv) return; const v = e.target.value.trim();
  pv.innerHTML = v ? qaPreview(parseQuick(v)) : ''; pv.classList.toggle('on', !!v);
});
document.addEventListener('submit', async e => {
  const f = e.target; if (f.id !== 'smartAdd') return; e.preventDefault();
  const raw = f.q.value.trim(); if (!raw) return; const p = parseQuick(raw); if (!p.title) return toast(tr('Ne yapacağını da yaz'));
  const t = { id: uid(), type: 'task', title: p.title, notes: '', due: p.due, time: p.time, priority: 0, repeat: 'none', rec: p.rec, tags: [], done: false, remind: [] };
  await save(t); Cal.upsertTask(t);
  toast(Lx('Görev eklendi', 'Task added') + (p.due ? ' · ' + relDay(p.due) + (p.time ? ' ' + p.time : '') : ''), { label: tr('Aç'), fn: () => editTask(S.items.get(t.id) || t) });
}, true);

/* ===================== Görevlerde kaydırma ===================== */
/* Sağa kaydır: tamamla · Sola kaydır: yarına ertele */
let SW = null, swAt = 0;
document.addEventListener('pointerdown', e => {
  const row = e.target.closest && e.target.closest('.row[data-act=edit-task]'); if (!row || e.button > 0) return;
  SW = { row, x: e.clientX, y: e.clientY, dx: 0, on: false, id: row.dataset.id };
}, true);
document.addEventListener('pointermove', e => {
  if (!SW) return; const dx = e.clientX - SW.x, dy = e.clientY - SW.y;
  if (!SW.on) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { SW = null; return; } if (Math.abs(dx) < 12) return; SW.on = true; SW.row.classList.add('swiping'); }
  SW.dx = Math.max(-140, Math.min(140, dx)); SW.row.style.transform = 'translateX(' + SW.dx + 'px)';
  SW.row.classList.toggle('sw-r', SW.dx > 70); SW.row.classList.toggle('sw-l', SW.dx < -70);
}, true);
async function swEnd() {
  if (!SW) return; const s = SW; SW = null;
  if (!s.on) return;
  swAt = Date.now(); s.row.style.transform = ''; s.row.classList.remove('swiping', 'sw-r', 'sw-l');
  const t = S.items.get(s.id); if (!t) return;
  if (s.dx > 70) { if (navigator.vibrate) navigator.vibrate(20); await toggleTask(s.id); }
  else if (s.dx < -70 && !t.done) {
    const before = t.due; const base = t.due && t.due > today() ? t.due : today(); t.due = addDays(base, 1);
    await save(t); Cal.upsertTask(t); if (navigator.vibrate) navigator.vibrate(20);
    toast(Lx('Ertelendi · ', 'Postponed · ') + relDay(t.due), { label: tr('Geri al'), fn: async () => { t.due = before; await save(t); Cal.upsertTask(t); } });
  }
}
document.addEventListener('pointerup', swEnd, true);
document.addEventListener('pointercancel', () => { if (SW && SW.on) { SW.row.style.transform = ''; SW.row.classList.remove('swiping', 'sw-r', 'sw-l'); } SW = null; }, true);
document.addEventListener('click', e => { if (Date.now() - swAt < 350 && e.target.closest && e.target.closest('.row[data-act=edit-task]')) { e.stopPropagation(); e.preventDefault(); } }, true);

/* ===================== Genel arama ===================== */
Object.assign(ICONS, { find: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>' });
function searchTopButton() { return '<button class="icon-btn" data-act="gsearch" aria-label="Ara">' + icon('find') + '</button>'; }
function gsearchResults(q) {
  q = lower(q.trim()); if (q.length < 2) return '<div class="empty">' + tr('En az 2 harf yaz.') + '</div>';
  const has = (...xs) => xs.some(x => lower(String(x || '')).includes(q));
  const groups = [];
  const add = (title, ic, rows) => { if (rows.length) groups.push('<div class="section-title"><span>' + title + '<span class="count">' + rows.length + '</span></span></div><div class="card">' + rows.slice(0, 30).join('') + '</div>'); };
  const row = (act, attr, ic, t, sub) => '<div class="row gs-row" data-act="' + act + '" ' + attr + '>' + icon(ic, 'sm') + '<div class="row-main"><div class="row-title">' + esc(t) + '</div>' + (sub ? '<div class="row-meta u">' + esc(sub) + '</div>' : '') + '</div></div>';
  add(tr('Görevler'), 'task', list('task').filter(t => has(t.title, t.notes)).sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).map(t => row('edit-task', 'data-id="' + t.id + '"', 'task', t.title, (t.done ? tr('Tamamlandı') : t.due ? relDay(t.due) + (t.time ? ' ' + t.time : '') : '') + (t.notes ? ' · ' + t.notes.slice(0, 60) : ''))));
  add(tr('Etkinlikler'), 'event', list('event').filter(e => has(e.title, e.notes)).map(e => row('edit-event', 'data-id="' + e.id + '"', 'event', e.title, fmtShort(e.date) + (e.start ? ' ' + e.start : '') + (e.rec ? ' · ' + recText(e.rec) : ''))));
  if (Cal.on()) { const seen = new Set(); const gs = []; Object.keys(Cal.byDate).sort().forEach(d => Cal.forDate(d).forEach(e => { if (!seen.has(e.gid) && has(e.title, e.notes, e.loc)) { seen.add(e.gid); gs.push(row('gev-edit', 'data-gid="' + esc(e.gid) + '"', 'event', e.title, fmtShort(e.date) + (e.start ? ' ' + e.start : '') + ' · Google')); } })); add('Google Takvim', 'event', gs); }
  add(tr('Tekrarlı işler'), 'repeat', list('routine').filter(r => has(r.title, r.notes)).map(r => row('rt-edit', 'data-id="' + r.id + '"', 'repeat', r.title, recText(r.rec) + (r.next ? ' · ' + relDay(r.next) : ''))));
  add(tr('Notlar'), 'note', list('note').filter(n => has(n.title, n.body, (n.items || []).map(i => i.t).join(' '))).map(n => row('open-note', 'data-id="' + n.id + '"', n.kind === 'list' ? 'list' : n.kind === 'ink' ? 'pen' : 'note', noteTitle(n), n.kind === 'list' ? (n.items || []).map(i => i.t).join(', ').slice(0, 80) : (n.body || '').slice(0, 80))));
  add(tr('Alışkanlıklar ve hedefler'), 'habit', list('habit').filter(h => has(h.title)).map(h => row('edit-habit', 'data-id="' + h.id + '"', 'habit', h.title, '')).concat(list('goal').filter(g => has(g.title)).map(g => row('edit-goal', 'data-id="' + g.id + '"', 'goal', g.title, (g.current || 0) + '/' + (g.target || 0)))));
  const ci = list('citem').filter(c => has(c.text, c.title, c.note)); if (ci.length) add(tr('Kendi bölümlerin'), 'tag', ci.map(c => { const m = cmod(c.mod); return row('go', 'data-k="c:' + c.mod + '"', 'tag', c.text || c.title || '', m ? m.name : ''); }));
  return groups.length ? groups.join('') : '<div class="empty">' + tr('Sonuç yok.') + '</div>';
}
function openSearch() {
  openSheet('<div class="ed-top"><button class="icon-btn" data-act="close-sheet" aria-label="Geri">' + icon('back') + '</button><div class="search gs-box">' + icon('find') + '<input id="gsInput" placeholder="' + esc(tr('Görev, not, etkinlik ara…')) + '" autocomplete="off" enterkeyhint="search" value="' + esc(S.gq || '') + '"></div></div><div class="tool-body" id="gsRes">' + (S.gq ? gsearchResults(S.gq) : '<div class="empty">' + tr('Görevlerde, notlarda, etkinliklerde, tekrarlı işlerde ve kendi bölümlerinde arar.') + '</div>') + '</div>', { full: true });
  setTimeout(() => { const i = $('#gsInput'); if (i) { i.focus(); i.select(); } }, 60);
}
document.addEventListener('input', e => { if (e.target.id !== 'gsInput') return; S.gq = e.target.value; const r = $('#gsRes'); if (r) { r.innerHTML = gsearchResults(S.gq); translateTree(r); } });
Object.assign(ACTIONS, { 'gsearch': () => openSearch() });

(function () {
  const add = {
    'Günün akışı': 'Day flow', 'Bugün için saatli bir şey yok.': 'Nothing scheduled with a time today.', 'Ne yapacaksın? örn. yarın 18:00 spor': 'What’s next? e.g. tomorrow 6pm gym',
    'Tarih ya da saat yazarsan anlarım: “yarın 18:00”, “her salı”, “5 kasım”': 'I understand dates and times: “tomorrow 18:00”, “every tuesday”, “5 november”', 'Ne yapacağını da yaz': 'Write what to do too',
    'En az 2 harf yaz.': 'Type at least 2 letters.', 'Görevler': 'Tasks', 'Tamamlandı': 'Done', 'Etkinlikler': 'Events', 'Notlar': 'Notes', 'Alışkanlıklar ve hedefler': 'Habits & goals', 'Kendi bölümlerin': 'Your sections',
    'Görev, not, etkinlik ara…': 'Search tasks, notes, events…', 'Görevlerde, notlarda, etkinliklerde, tekrarlı işlerde ve kendi bölümlerinde arar.': 'Searches tasks, notes, events, recurring tasks and your sections.', 'Ara': 'Search'
  };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
