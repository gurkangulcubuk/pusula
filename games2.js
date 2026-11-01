'use strict';
/* PUSULA 1.16 — Bir Kelime Bir İşlem (günün turları + serbest) ve Nonogram. tools.js'in yardımcılarını kullanır. */
GAMES.push(['bkbi', 'Bir Kelime Bir İşlem', 'Harflerle en uzun kelime, sayılarla hedef', 'calc'], ['nono', 'Nonogram', 'Sayılara göre boya, resmi bul', 'grid']);
(function () {
  const orig = ACTIONS['game-open'];
  ACTIONS['game-open'] = el => { const k = el.dataset.k; if (k === 'bkbi') { unlockAudio(); return openBkbi(); } if (k === 'nono') { unlockAudio(); return openNono(); } return orig(el); };
})();

/* ----- ortak: tohumlu rastgele ----- */
function seedOf(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
function rngOf(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function shuffleR(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ===================== Bir Kelime Bir İşlem ===================== */
const TR_ABC = Array.from('abcçdefgğhıijklmnoöprsştuüvyz');
const UP = s => String(s).toLocaleUpperCase('tr-TR');
let BKW = null; // { all: Set, byLen: {n: []} }
async function bkWords() {
  if (BKW) return BKW;
  const txt = await (await fetch('words-tr-all.txt')).text();
  const all = txt.split('\n').map(x => x.trim()).filter(Boolean); const byLen = {};
  all.forEach(w => { const n = Array.from(w).length; (byLen[n] = byLen[n] || []).push(w); });
  BKW = { all: new Set(all), list: all, byLen }; return BKW;
}
const BK_SETS = 4; // günde 4 tur: her tur bir kelime + bir işlem
function bkKelime(r) {
  const w = pick(r, BKW.byLen[8]); const letters = shuffleR(r, Array.from(w));
  return { letters, seed: w };
}
function bkIslem(r) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const nums = [1, 2, 3, 4, 5].map(() => 1 + Math.floor(r() * 9)).concat([pick(r, [10, 25, 50, 75, 100])]);
    let pool = shuffleR(r, nums).map(v => ({ v, e: String(v) })); const steps = []; let cand = null;
    while (pool.length > 1 && steps.length < 5) {
      const i = Math.floor(r() * pool.length); let j = Math.floor(r() * (pool.length - 1)); if (j >= i) j++;
      let a = pool[i], b = pool[j]; if (b.v > a.v) [a, b] = [b, a];
      const ops = ['+']; if (a.v > b.v) ops.push('−'); if (a.v > 1 && b.v > 1 && a.v * b.v <= 5000) ops.push('×', '×'); if (b.v > 1 && a.v % b.v === 0) ops.push('÷');
      const op = pick(r, ops); const v = op === '+' ? a.v + b.v : op === '−' ? a.v - b.v : op === '×' ? a.v * b.v : a.v / b.v;
      steps.push(a.v + ' ' + op + ' ' + b.v + ' = ' + v);
      pool = pool.filter(x => x !== a && x !== b).concat([{ v, e: '' }]);
      if (v >= 101 && v <= 999 && steps.length >= 3) cand = { target: v, steps: steps.slice() };
    }
    if (cand) return { nums, target: cand.target, sol: cand.steps };
  }
  return { nums: [1, 2, 3, 4, 5, 25], target: 150, sol: ['25 × 5 = 125', '125 + 4 = 129', '129 + 3 = 132', '132 + 2 = 134'] };
}
function bkRound(seedStr) { const r = rngOf(seedOf(seedStr)); return { k: bkKelime(r), i: bkIslem(r) }; }
function bkLongest(letters) { // harfler + 1 joker ile yazılabilecek en uzun kelimeler
  const cnt = {}; letters.forEach(c => { cnt[c] = (cnt[c] || 0) + 1; });
  let best = 0, out = [];
  for (const w of BKW.list) {
    const a = Array.from(w); if (a.length < best || a.length > letters.length + 1) continue;
    const c = Object.assign({}, cnt); let joker = 1, ok = true;
    for (const ch of a) { if (c[ch]) c[ch]--; else if (joker) joker--; else { ok = false; break; } }
    if (!ok) continue; if (a.length > best) { best = a.length; out = []; } out.push(w);
  }
  return { best, words: out.slice(0, 8) };
}
/* durum: günlük turlar playSave('bkbi.day') ile eşitlenir; serbest oyun cihazda */
let BK = null;
function bkDay() {
  const d = today(); let s = tdGet('bkbi.day', null);
  if (!s || s.date !== d) s = { date: d, rounds: Array.from({ length: BK_SETS }, () => ({ k: null, i: null })) };
  return s;
}
const bkCfg = () => Object.assign({ time: 60 }, tdGet('bkbi.cfg', {}));
async function openBkbi() {
  toolSheet(T_('Bir Kelime Bir İşlem'), '<div id="bkWrap"><div class="empty">' + tr('Kelimeler yükleniyor…') + '</div></div>', () => { clearInterval(bkIv); }); // günlük sonuç her tur bitişinde birleştirilerek yazılır; kapatınca yazmaz
  try { await bkWords(); } catch (e) { const w = $('#bkWrap'); if (w) w.innerHTML = '<div class="empty">' + tr('Kelime listesi yüklenemedi; bir kez internete bağlıyken aç.') + '</div>'; return; }
  BK = { view: 'home', day: bkDay() }; bkRender();
}
let bkIv = null;
function bkStart(mode, idx, part) {
  const seed = mode === 'day' ? 'bkbi|' + BK.day.date + '|' + idx : 'free|' + Date.now();
  const R = bkRound(seed); const k = part || 'k';
  BK.mode = mode; BK.idx = idx; BK.part = k; BK.R = R; BK.view = 'play';
  BK.word = []; BK.joker = ''; BK.tiles = R.i.nums.map((v, n) => ({ id: 'n' + n, v, used: false })); BK.steps = []; BK.sel = null; BK.op = null; BK.res = null;
  const t = bkCfg().time; BK.end = t ? Date.now() + t * 1000 : 0;
  clearInterval(bkIv); if (t) bkIv = setInterval(() => { const el = $('#bkTime'); if (!el || BK.view !== 'play' || BK.res) return clearInterval(bkIv); const s = Math.ceil((BK.end - Date.now()) / 1000); el.textContent = Math.max(0, s); el.classList.toggle('warn', s <= 10); if (s <= 0) { clearInterval(bkIv); beep(2, 440); bkSubmit(true); } }, 250);
  bkRender();
}
function bkRender() {
  const w = $('#bkWrap'); if (!w || !BK) return;
  w.innerHTML = BK.view === 'home' ? bkHomeHtml() : BK.part === 'k' ? bkKelimeHtml() : bkIslemHtml(); translateTree(w);
}
function bkHomeHtml() {
  const d = BK.day, tot = d.rounds.reduce((a, r) => a + (r.k ? r.k.score : 0) + (r.i ? r.i.score : 0), 0), done = d.rounds.filter(r => r.k && r.i).length;
  const st = gStats('bkbi', { played: 0, best: 0, hist: [] });
  return '<p class="muted sm" style="margin-top:0">' + tr('Kelime: 8 harf ve bir joker ile en uzun kelimeyi kur. İşlem: 6 sayıyla hedefe ulaş. Her gün 4 tur yeni bulmaca gelir; telefonda ve tablette aynıdır.') + '</p>' +
    '<div class="section-title"><span>' + tr('Günün turları') + '</span><span class="muted sm">' + done + '/' + BK_SETS + ' · ' + Lx(tot + ' puan', tot + ' pts') + '</span></div><div class="card bk-days">' +
    d.rounds.map((r, i) => '<div class="bk-day"><b>' + Lx((i + 1) + '. tur', 'Round ' + (i + 1)) + '</b>' +
      '<button class="btn ' + (r.k ? '' : 'primary') + '" data-act="bk-play" data-i="' + i + '" data-p="k" ' + (r.k ? 'disabled' : '') + '>' + tr('Kelime') + (r.k ? ' · ' + r.k.score : '') + '</button>' +
      '<button class="btn ' + (r.i ? '' : 'primary') + '" data-act="bk-play" data-i="' + i + '" data-p="i" ' + (r.i ? 'disabled' : '') + '>' + tr('İşlem') + (r.i ? ' · ' + r.i.score : '') + '</button></div>').join('') + '</div>' +
    '<div class="tool-actions"><button class="btn" data-act="bk-free" data-p="k">' + tr('Serbest kelime') + '</button><button class="btn" data-act="bk-free" data-p="i">' + tr('Serbest işlem') + '</button></div>' +
    '<div class="field"><span>' + tr('Süre') + '</span><div class="chips">' + [[0, 'Süresiz'], [30, '30 sn'], [60, '60 sn'], [90, '90 sn']].map(o => '<button class="chip sm ' + (bkCfg().time === o[0] ? 'on' : '') + '" data-act="bk-time" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div></div>' +
    statsBlock('bkbi', [[tr('Oynanan gün'), st.played], [tr('En iyi gün'), st.best || 0], [tr('Bugün'), tot]], h => '<div><span>' + fmtShort(h.d) + '</span><b>' + h.s + '</b></div>') +
    '<p class="muted sm">' + tr('Puanlama: kelimede harf başına 1 puan, jokeri kullanmazsan +3. İşlemde tam isabet 10, 1–5 uzak 7, 6–10 uzak 5 puan.') + '</p>';
}
const bkTimer = () => BK.end && !BK.res ? '<b id="bkTime" class="bk-time">' + Math.max(0, Math.ceil((BK.end - Date.now()) / 1000)) + '</b>' : '';
const bkHead = t => '<div class="bk-head"><button class="link" data-act="bk-home">‹ ' + tr('Turlar') + '</button><b>' + t + '</b>' + bkTimer() + '</div>';
function bkKelimeHtml() {
  const L = BK.R.k.letters, used = BK.word.map(x => x.i);
  const tiles = L.map((c, i) => '<button class="bk-tile ' + (used.includes(i) ? 'used' : '') + '" data-act="bk-letter" data-i="' + i + '" ' + (BK.res ? 'disabled' : '') + '>' + UP(c) + '</button>').join('') +
    '<button class="bk-tile joker ' + (used.includes(8) ? 'used' : '') + '" data-act="bk-joker" ' + (BK.res ? 'disabled' : '') + '>' + (BK.joker ? UP(BK.joker) : '?') + '</button>';
  const word = BK.word.map(x => x.i === 8 ? '<span class="j">' + UP(BK.joker) + '</span>' : UP(L[x.i])).join('');
  let h = bkHead(Lx((BK.mode === 'day' ? (BK.idx + 1) + '. tur · ' : '') + 'Kelime', (BK.mode === 'day' ? 'Round ' + (BK.idx + 1) + ' · ' : '') + 'Word')) + '<div class="bk-tiles">' + tiles + '</div>' +
    '<div class="bk-word">' + (word || '<span class="muted">' + tr('Harflere dokun') + '</span>') + '</div>';
  if (BK.pickJ) h += '<div class="bk-abc">' + TR_ABC.map(c => '<button class="bk-key" data-act="bk-jset" data-c="' + c + '">' + UP(c) + '</button>').join('') + '</div>';
  if (!BK.res) return h + '<div class="tool-actions"><button class="btn" data-act="bk-back">' + icon('back', 'sm') + '</button><button class="btn" data-act="bk-clear">' + tr('Temizle') + '</button><button class="btn primary" data-act="bk-submit">' + tr('Kontrol et') + '</button></div>';
  const r = BK.res;
  return h + '<div class="card bk-res"><div class="bk-score">' + (r.ok ? '+' + r.score : '0') + '</div><p>' + esc(r.msg) + '</p><p class="muted sm">' + Lx('En uzun: ', 'Longest: ') + r.best.words.map(x => '<b>' + UP(x) + '</b>').join(', ') + ' (' + Lx(r.best.best + ' harf', r.best.best + ' letters') + ')</p></div>' + bkNextBtn();
}
function bkIslemHtml() {
  const R = BK.R.i; const best = bkBest();
  const tiles = BK.tiles.map(t => '<button class="bk-num ' + (t.used ? 'used' : '') + (BK.sel === t.id ? ' sel' : '') + (t.made ? ' made' : '') + '" data-act="bk-num" data-id="' + t.id + '" ' + (BK.res || t.used ? 'disabled' : '') + '>' + t.v + '</button>').join('');
  let h = bkHead(Lx((BK.mode === 'day' ? (BK.idx + 1) + '. tur · ' : '') + 'İşlem', (BK.mode === 'day' ? 'Round ' + (BK.idx + 1) + ' · ' : '') + 'Numbers')) +
    '<div class="bk-target">' + R.target + '</div><div class="bk-nums">' + tiles + '</div>' +
    '<div class="bk-ops">' + ['+', '−', '×', '÷'].map(o => '<button class="bk-op ' + (BK.op === o ? 'on' : '') + '" data-act="bk-op" data-o="' + o + '" ' + (BK.res ? 'disabled' : '') + '>' + o + '</button>').join('') + '</div>' +
    '<div class="bk-steps">' + (BK.steps.length ? BK.steps.map(s => '<div>' + s.a + ' ' + s.op + ' ' + s.b + ' = <b>' + s.r + '</b></div>').join('') : '<span class="muted sm">' + tr('Bir sayı, bir işlem, bir sayı seç') + '</span>') + '</div>' +
    (best ? '<p class="muted sm bk-near">' + Lx('En yakın: ', 'Closest: ') + '<b>' + best.v + '</b> (' + (best.d ? Lx(best.d + ' uzak', best.d + ' off') : tr('tam isabet')) + ')</p>' : '');
  if (!BK.res) return h + '<div class="tool-actions"><button class="btn" data-act="bk-undo" ' + (BK.steps.length ? '' : 'disabled') + '>' + tr('Geri al') + '</button><button class="btn primary" data-act="bk-submit">' + tr('Bitir') + '</button></div>';
  const r = BK.res;
  return h + '<div class="card bk-res"><div class="bk-score">' + (r.score ? '+' + r.score : '0') + '</div><p>' + esc(r.msg) + '</p><p class="muted sm">' + tr('Bir çözüm:') + '</p><div class="bk-steps sol">' + R.sol.map(s => '<div>' + s + '</div>').join('') + '</div></div>' + bkNextBtn();
}
function bkNextBtn() {
  if (BK.mode !== 'day') return '<div class="tool-actions"><button class="btn" data-act="bk-home">' + tr('Turlar') + '</button><button class="btn primary" data-act="bk-free" data-p="' + BK.part + '">' + tr('Yeni bulmaca') + '</button></div>';
  const d = BK.day; let nx = null; for (let i = 0; i < BK_SETS && !nx; i++) { if (!d.rounds[i].k) nx = [i, 'k']; else if (!d.rounds[i].i) nx = [i, 'i']; }
  return '<div class="tool-actions"><button class="btn" data-act="bk-home">' + tr('Turlar') + '</button>' + (nx ? '<button class="btn primary" data-act="bk-play" data-i="' + nx[0] + '" data-p="' + nx[1] + '">' + tr('Sıradaki') + '</button>' : '') + '</div>';
}
function bkBest() { const t = BK.R.i.target; let b = null; BK.tiles.forEach(x => { const d = Math.abs(x.v - t); if (!b || d < b.d) b = { v: x.v, d }; }); return b; }
function bkSubmit(timeout) {
  if (!BK || BK.res) return; clearInterval(bkIv);
  if (BK.part === 'k') {
    const L = BK.R.k.letters, w = BK.word.map(x => x.i === 8 ? BK.joker : L[x.i]).join(''); const best = bkLongest(L);
    const ok = Array.from(w).length >= 3 && BKW.all.has(w); const jk = BK.word.some(x => x.i === 8);
    const score = ok ? Array.from(w).length + (jk ? 0 : 3) : 0;
    BK.res = { ok, score, best, msg: !w ? (timeout ? tr('Süre doldu.') : tr('Kelime yazmadın.')) : ok ? Lx('“' + UP(w) + '” geçerli · ' + Array.from(w).length + ' harf' + (jk ? '' : ' · jokersiz +3'), '“' + UP(w) + '” is valid · ' + Array.from(w).length + ' letters' + (jk ? '' : ' · no joker +3')) : Lx('“' + UP(w) + '” sözlükte yok.', '“' + UP(w) + '” is not in the dictionary.') };
  } else {
    const b = bkBest(); const d = b ? b.d : 999; const score = d === 0 ? 10 : d <= 5 ? 7 : d <= 10 ? 5 : 0;
    BK.res = { score, msg: d === 0 ? tr('Tam isabet!') : Lx('Hedefe ' + d + ' uzaktasın.', d + ' away from the target.') };
  }
  BK.res.score && beep(1, 990);
  if (BK.mode === 'day') {
    const d = bkDay(); d.rounds[BK.idx][BK.part] = d.rounds[BK.idx][BK.part] || { score: BK.res.score }; BK.day = d; // diğer cihazın sonuçlarıyla birleştir
    const tot = d.rounds.reduce((a, r) => a + (r.k ? r.k.score : 0) + (r.i ? r.i.score : 0), 0);
    playSave('bkbi.day', d, true);
    if (d.rounds.every(r => r.k && r.i)) { const st = gStats('bkbi', { played: 0, best: 0, hist: [] }); if (!st.hist.some(h => h.d === d.date)) { st.played++; st.best = Math.max(st.best || 0, tot); st.hist.push({ d: d.date, s: tot }); gStatsSave('bkbi', st); } }
  }
  bkRender();
}
Object.assign(ACTIONS, {
  'bk-play': el => bkStart('day', +el.dataset.i, el.dataset.p),
  'bk-free': el => bkStart('free', 0, el.dataset.p),
  'bk-home': () => { clearInterval(bkIv); BK.view = 'home'; BK.day = bkDay(); bkRender(); },
  'bk-time': el => { tdSet('bkbi.cfg', Object.assign(bkCfg(), { time: +el.dataset.v })); bkRender(); },
  'bk-letter': el => { const i = +el.dataset.i; if (BK.word.some(x => x.i === i)) return; BK.word.push({ i }); bkRender(); },
  'bk-joker': () => { if (BK.word.some(x => x.i === 8)) return; BK.pickJ = !BK.pickJ; bkRender(); },
  'bk-jset': el => { BK.joker = el.dataset.c; BK.pickJ = false; BK.word.push({ i: 8 }); bkRender(); },
  'bk-back': () => { const x = BK.word.pop(); if (x && x.i === 8) BK.joker = ''; bkRender(); },
  'bk-clear': () => { BK.word = []; BK.joker = ''; BK.pickJ = false; bkRender(); },
  'bk-submit': () => bkSubmit(false),
  'bk-num': el => {
    const t = BK.tiles.find(x => x.id === el.dataset.id); if (!t || t.used) return;
    if (!BK.sel || !BK.op) { BK.sel = BK.sel === t.id ? null : t.id; BK.op = BK.sel ? BK.op : null; return bkRender(); }
    if (BK.sel === t.id) { BK.sel = null; BK.op = null; return bkRender(); }
    const a = BK.tiles.find(x => x.id === BK.sel), op = BK.op; let r;
    if (op === '+') r = a.v + t.v; else if (op === '−') r = a.v - t.v; else if (op === '×') r = a.v * t.v; else r = t.v ? a.v / t.v : NaN;
    if (!(r > 0) || r % 1) return toast(tr(op === '÷' ? 'Tam bölünmüyor' : 'Sonuç pozitif tam sayı olmalı'));
    a.used = true; t.used = true; const nt = { id: 'm' + BK.steps.length + '_' + Date.now(), v: r, used: false, made: true }; BK.tiles.push(nt);
    BK.steps.push({ a: a.v, b: t.v, op, r, ids: [a.id, t.id], nid: nt.id }); BK.sel = null; BK.op = null;
    if (r === BK.R.i.target) { beep(1, 1200); setTimeout(() => bkSubmit(false), 350); }
    bkRender();
  },
  'bk-op': el => { if (!BK.sel) return toast(tr('Önce bir sayı seç')); BK.op = BK.op === el.dataset.o ? null : el.dataset.o; bkRender(); },
  'bk-undo': () => { const s = BK.steps.pop(); if (!s) return; BK.tiles = BK.tiles.filter(x => x.id !== s.nid); s.ids.forEach(id => { const x = BK.tiles.find(y => y.id === id); if (x) x.used = false; }); bkRender(); }
});

/* ===================== Nonogram ===================== */
function nnClues(line) { const out = []; let run = 0; line.forEach(v => { if (v === 1) run++; else if (run) { out.push(run); run = 0; } }); if (run) out.push(run); return out.length ? out : [0]; }
function nnSolveLine(cells, clue) { // tüm yerleşimleri dene; kesişimi döndür (null = çelişki)
  const n = cells.length, k = clue[0] === 0 ? [] : clue; let acc = null;
  const place = (ci, pos, arr) => {
    if (ci === k.length) { for (let i = pos; i < n; i++) { if (cells[i] === 1) return; arr[i] = 0; } if (!acc) acc = arr.slice(); else for (let i = 0; i < n; i++) if (acc[i] !== arr[i]) acc[i] = -1; return; }
    const len = k[ci], rest = k.slice(ci + 1).reduce((a, b) => a + b + 1, 0);
    for (let s = pos; s + len + rest <= n; s++) {
      let ok = true; for (let i = pos; i < s; i++) if (cells[i] === 1) { ok = false; break; } if (!ok) break;
      for (let i = s; i < s + len; i++) if (cells[i] === 0) { ok = false; break; }
      if (ok && s + len < n && cells[s + len] === 1) ok = false;
      if (!ok) continue;
      for (let i = pos; i < s; i++) arr[i] = 0; for (let i = s; i < s + len; i++) arr[i] = 1; if (s + len < n) arr[s + len] = 0;
      place(ci + 1, s + len + 1, arr);
      if (acc && acc.every(v => v === -1)) return;
    }
  };
  place(0, 0, new Array(n).fill(0)); return acc;
}
function nnSolvable(rows, cols, n) {
  const g = Array.from({ length: n }, () => new Array(n).fill(-1)); let changed = true, guard = 0;
  while (changed && guard++ < 200) {
    changed = false;
    for (let r = 0; r < n; r++) { const res = nnSolveLine(g[r], rows[r]); if (!res) return false; res.forEach((v, c) => { if (v !== -1 && g[r][c] === -1) { g[r][c] = v; changed = true; } }); }
    for (let c = 0; c < n; c++) { const col = g.map(row => row[c]); const res = nnSolveLine(col, cols[c]); if (!res) return false; res.forEach((v, r) => { if (v !== -1 && g[r][c] === -1) { g[r][c] = v; changed = true; } }); }
  }
  return g.every(row => row.every(v => v !== -1));
}
function nnGen(n) {
  const r = rngOf(Date.now() ^ (Math.random() * 1e9));
  for (let a = 0; a < 300; a++) {
    const dens = 0.52 + r() * 0.12; const sol = Array.from({ length: n }, () => Array.from({ length: n }, () => r() < dens ? 1 : 0));
    const rows = sol.map(nnClues), cols = sol[0].map((_, c) => nnClues(sol.map(row => row[c])));
    if (sol.some(row => !row.includes(1))) continue;
    if (nnSolvable(rows, cols, n)) return { n, sol: sol.map(x => x.join('')).join('/'), rows, cols };
  }
  return null;
}
let NN = null, nnIv = null;
function openNono() {
  const t = tdGet('nono', null); if (t && t.sol && !t.done) NN = t;
  toolSheet(T_('Nonogram'), '<div id="nnWrap"></div>', () => { if (NN && NN._chg) { nnAcc(); NN._chg = false; playSave('nono', NN, true); } clearInterval(nnIv); });
  if (!NN) NN = { mode: 'fill', size: 10 }; if (!NN.sol) nnNew(NN.size || 10); else { NN.start = Date.now(); nnRender(); }
  clearInterval(nnIv); nnIv = setInterval(() => { const el = $('#nnTime'); if (!el) return clearInterval(nnIv); if (NN && !NN.done) el.textContent = fmtClock((NN.acc || 0) + Date.now() - NN.start); }, 1000);
}
function nnAcc() { if (NN && NN.start && !NN.done) { NN.acc = (NN.acc || 0) + Date.now() - NN.start; NN.start = Date.now(); } }
function nnNew(n) {
  const w = $('#nnWrap'); if (w) w.innerHTML = '<div class="empty">' + tr('Bulmaca hazırlanıyor…') + '</div>';
  setTimeout(() => { const p = nnGen(n); if (!p) return toast(tr('Bulmaca üretilemedi, tekrar dene')); NN = Object.assign(p, { size: n, mode: (NN && NN.mode) || 'fill', grid: Array.from({ length: n }, () => new Array(n).fill(0)), acc: 0, start: Date.now(), hints: 0, done: false }); playSave('nono', NN); nnRender(); }, 30);
}
const nnSol = () => NN.sol.split('/').map(r => Array.from(r).map(Number));
function nnRender() {
  const w = $('#nnWrap'); if (!w || !NN) return; const n = NN.size, sol = nnSol();
  const rowDone = r => nnClues(NN.grid[r].map(v => v === 1 ? 1 : 0)).join() === NN.rows[r].join();
  const colDone = c => nnClues(NN.grid.map(row => row[c] === 1 ? 1 : 0)).join() === NN.cols[c].join();
  const rk = Math.max(2.2, Math.max(...NN.rows.map(x => x.length)) * 0.72 + 0.5), ck = Math.max(2.2, Math.max(...NN.cols.map(x => x.length)) * 0.62 + 0.5);
  let g = '<div class="nn-grid" id="nnGrid" style="--n:' + n + ';--rk:' + rk.toFixed(2) + ';--ck:' + ck.toFixed(2) + '"><div class="nn-corner"></div>';
  for (let c = 0; c < n; c++) g += '<div class="nn-cc ' + (colDone(c) ? 'ok' : '') + (c % 5 === 4 && c < n - 1 ? ' b5' : '') + '">' + NN.cols[c].map(x => '<span>' + x + '</span>').join('') + '</div>';
  for (let r = 0; r < n; r++) {
    g += '<div class="nn-rc ' + (rowDone(r) ? 'ok' : '') + (r % 5 === 4 && r < n - 1 ? ' b5' : '') + '">' + NN.rows[r].map(x => '<span>' + x + '</span>').join('') + '</div>';
    for (let c = 0; c < n; c++) { const v = NN.grid[r][c]; g += '<div class="nn-c ' + (v === 1 ? 'f' : v === 2 ? 'x' : '') + (NN.done && sol[r][c] ? ' win' : '') + (c % 5 === 4 && c < n - 1 ? ' br' : '') + (r % 5 === 4 && r < n - 1 ? ' bb' : '') + '" data-r="' + r + '" data-c="' + c + '"></div>'; }
  }
  g += '</div>';
  w.innerHTML = '<div class="nn-top"><div class="chips">' + [5, 10, 15].map(s => '<button class="chip sm ' + (n === s ? 'on' : '') + '" data-act="nn-size" data-n="' + s + '">' + s + '×' + s + '</button>').join('') + '</div><b id="nnTime" class="muted">' + fmtClock((NN.acc || 0) + (NN.done ? 0 : Date.now() - NN.start)) + '</b></div>' + g +
    (NN.done ? '<div class="card bk-res"><div class="bk-score">✓</div><p>' + Lx('Çözdün! Süre: ', 'Solved! Time: ') + fmtClock(NN.acc) + (NN.hints ? Lx(' · ' + NN.hints + ' ipucu', ' · ' + NN.hints + ' hints') : '') + '</p></div><div class="tool-actions"><button class="btn primary" data-act="nn-new">' + tr('Yeni bulmaca') + '</button></div>'
      : '<div class="seg nn-mode"><button class="' + (NN.mode === 'fill' ? 'on' : '') + '" data-act="nn-mode" data-k="fill">■ ' + tr('Boya') + '</button><button class="' + (NN.mode === 'cross' ? 'on' : '') + '" data-act="nn-mode" data-k="cross">✕ ' + tr('Çarpı') + '</button></div>' +
        '<div class="tool-actions"><button class="btn" data-act="nn-hint">' + tr('İpucu') + '</button><button class="btn" data-act="nn-check">' + tr('Kontrol') + '</button><button class="btn" data-act="nn-new">' + tr('Yeni') + '</button></div>') +
    statsBlock('nono' + n, [[tr('Çözülen'), gStats('nono' + n).won || 0], [tr('En iyi süre'), gStats('nono' + n).best ? fmtClock(gStats('nono' + n).best) : '—']], h => '<div><span>' + fmtShort(h.d) + '</span><b>' + fmtClock(h.t) + '</b></div>') +
    '<p class="muted sm">' + tr('Satır ve sütundaki sayılar, o hatta art arda kaç kare boyanacağını sırayla söyler. Parmağını ya da kalemi sürükleyerek birden fazla kare boyayabilirsin.') + '</p>';
  translateTree(w);
}
function nnCheckWin() {
  const sol = nnSol(); if (!NN.grid.every((row, r) => row.every((v, c) => (v === 1) === (sol[r][c] === 1)))) return;
  nnAcc(); NN.done = true; NN.grid = sol.map(row => row.map(v => v ? 1 : 2)); beep(2, 1200);
  const k = 'nono' + NN.size, st = gStats(k, { played: 0, won: 0, best: null, hist: [] }); st.played++; st.won++; if (!NN.hints && (!st.best || NN.acc < st.best)) st.best = NN.acc; st.hist.push({ d: today(), t: NN.acc }); gStatsSave(k, st);
  playSave('nono', NN, true); nnRender();
}
/* boyama: dokun ya da sürükle (aynı satır/sütunda) */
let nnDrag = null;
document.addEventListener('pointerdown', e => {
  const cell = e.target.closest && e.target.closest('#nnGrid .nn-c'); if (!cell || !NN || NN.done) return;
  e.preventDefault(); const r = +cell.dataset.r, c = +cell.dataset.c, cur = NN.grid[r][c];
  const want = NN.mode === 'fill' ? (cur === 1 ? 0 : 1) : (cur === 2 ? 0 : 2);
  nnDrag = { r, c, want, orig: cur, axis: null, id: e.pointerId }; nnSet(r, c, want);
});
document.addEventListener('pointermove', e => {
  if (!nnDrag || e.pointerId !== nnDrag.id) return; const el = document.elementFromPoint(e.clientX, e.clientY); const cell = el && el.closest && el.closest('#nnGrid .nn-c'); if (!cell) return;
  let r = +cell.dataset.r, c = +cell.dataset.c; if (r === nnDrag.r && c === nnDrag.c) return;
  if (!nnDrag.axis) nnDrag.axis = r === nnDrag.r ? 'row' : c === nnDrag.c ? 'col' : null; if (!nnDrag.axis) return;
  if (nnDrag.axis === 'row') r = nnDrag.r; else c = nnDrag.c;
  const [a, b] = nnDrag.axis === 'row' ? [Math.min(c, nnDrag.c), Math.max(c, nnDrag.c)] : [Math.min(r, nnDrag.r), Math.max(r, nnDrag.r)];
  for (let i = a; i <= b; i++) { const rr = nnDrag.axis === 'row' ? r : i, cc = nnDrag.axis === 'row' ? i : c; const cur = NN.grid[rr][cc]; if (nnDrag.want ? cur === 0 : cur === nnDrag.orig) nnSet(rr, cc, nnDrag.want, true); }
});
document.addEventListener('pointerup', () => { if (!nnDrag) return; nnDrag = null; playSave('nono', NN); nnRender(); nnCheckWin(); });
document.addEventListener('pointercancel', () => { if (nnDrag) { nnDrag = null; nnRender(); } });
function nnSet(r, c, v, quiet) { NN.grid[r][c] = v; NN._chg = true; const el = $('#nnGrid .nn-c[data-r="' + r + '"][data-c="' + c + '"]'); if (el) { el.classList.toggle('f', v === 1); el.classList.toggle('x', v === 2); } if (!quiet && navigator.vibrate) navigator.vibrate(8); }
Object.assign(ACTIONS, {
  'nn-mode': el => { NN.mode = el.dataset.k; nnRender(); },
  'nn-size': el => { const n = +el.dataset.n; if (NN && NN.sol && !NN.done && NN.grid.some(r => r.some(v => v)) && !confirm(tr('Yarım kalan bulmaca silinsin mi?'))) return; nnNew(n); },
  'nn-new': () => { if (NN && NN.sol && !NN.done && NN.grid.some(r => r.some(v => v)) && !confirm(tr('Yarım kalan bulmaca silinsin mi?'))) return; nnNew(NN.size || 10); },
  'nn-hint': () => { const sol = nnSol(); const cells = []; NN.grid.forEach((row, r) => row.forEach((v, c) => { if ((v === 1) !== (sol[r][c] === 1) || (v === 0 && !sol[r][c])) cells.push([r, c]); })); const wrong = cells.filter(([r, c]) => NN.grid[r][c] === 1 && !sol[r][c]); const p = (wrong.length ? wrong : cells.filter(([r, c]) => sol[r][c]))[0] || cells[0]; if (!p) return; NN.grid[p[0]][p[1]] = sol[p[0]][p[1]] ? 1 : 2; NN.hints = (NN.hints || 0) + 1; playSave('nono', NN); nnRender(); nnCheckWin(); },
  'nn-check': () => { const sol = nnSol(); let bad = 0; NN.grid.forEach((row, r) => row.forEach((v, c) => { if ((v === 1 && !sol[r][c]) || (v === 2 && sol[r][c])) { bad++; const el = $('#nnGrid .nn-c[data-r="' + r + '"][data-c="' + c + '"]'); if (el) el.classList.add('bad'); } })); toast(bad ? Lx(bad + ' hatalı kare (kırmızı)', bad + ' wrong cells (red)') : tr('Şimdiye kadar hata yok')); }
});

/* İngilizce */
(function () {
  const add = { 'Bir Kelime Bir İşlem': 'Word & Numbers', 'Harflerle en uzun kelime, sayılarla hedef': 'Longest word, reach the target', 'Nonogram': 'Nonogram', 'Sayılara göre boya, resmi bul': 'Paint by numbers, find the picture',
    'Kelime listesi yüklenemedi; bir kez internete bağlıyken aç.': 'Could not load the word list; open once while online.', 'Kelime: 8 harf ve bir joker ile en uzun kelimeyi kur. İşlem: 6 sayıyla hedefe ulaş. Her gün 4 tur yeni bulmaca gelir; telefonda ve tablette aynıdır.': 'Word: make the longest Turkish word from 8 letters and a joker. Numbers: reach the target with 6 numbers. 4 new rounds every day, the same on phone and tablet.',
    'Günün turları': 'Today’s rounds', 'Kelime': 'Word', 'İşlem': 'Numbers', 'Serbest kelime': 'Free word', 'Serbest işlem': 'Free numbers', 'Süre': 'Time', 'Süresiz': 'No limit', 'Oynanan gün': 'Days played', 'En iyi gün': 'Best day',
    'Puanlama: kelimede harf başına 1 puan, jokeri kullanmazsan +3. İşlemde tam isabet 10, 1–5 uzak 7, 6–10 uzak 5 puan.': 'Scoring: 1 point per letter, +3 without the joker. Numbers: exact 10, 1–5 off 7, 6–10 off 5.', 'Turlar': 'Rounds', 'Harflere dokun': 'Tap the letters', 'Temizle': 'Clear', 'Kontrol et': 'Check',
    'Bir sayı, bir işlem, bir sayı seç': 'Pick a number, an operation, a number', 'tam isabet': 'exact', 'Bitir': 'Finish', 'Bir çözüm:': 'One solution:', 'Yeni bulmaca': 'New puzzle', 'Sıradaki': 'Next', 'Süre doldu.': 'Time is up.', 'Kelime yazmadın.': 'You didn’t make a word.', 'Tam isabet!': 'Exact!',
    'Tam bölünmüyor': 'Not divisible', 'Sonuç pozitif tam sayı olmalı': 'Result must be a positive whole number', 'Önce bir sayı seç': 'Pick a number first', 'Bulmaca hazırlanıyor…': 'Preparing puzzle…', 'Bulmaca üretilemedi, tekrar dene': 'Could not create a puzzle, try again', 'Boya': 'Fill', 'Çarpı': 'Cross', 'İpucu': 'Hint', 'Kontrol': 'Check', 'Yeni': 'New',
    'Çözülen': 'Solved', 'En iyi süre': 'Best time', 'Satır ve sütundaki sayılar, o hatta art arda kaç kare boyanacağını sırayla söyler. Parmağını ya da kalemi sürükleyerek birden fazla kare boyayabilirsin.': 'The numbers tell how many squares in a row are filled on that line, in order. Drag your finger or pen to fill several squares.',
    'Yarım kalan bulmaca silinsin mi?': 'Discard the unfinished puzzle?', 'Şimdiye kadar hata yok': 'No mistakes so far' };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
