'use strict';
/* PUSULA — Araçlar ve oyunlar (app.js'teki yardımcıları kullanır) */

/* ===================== İngilizce metinler ===================== */
(function () {
  const add = {"Araçlar": "Tools", "Oyunlar": "Games", "Hesap makinesi": "Calculator", "Geçmişli hesaplama": "Calculations with history", "Zamanlayıcı ve kronometre": "Timer & stopwatch", "Geri sayım, tur": "Countdown, laps", "Odak sayacı": "Focus timer", "Pomodoro: çalış, mola ver": "Pomodoro: work, take breaks", "Kredi ve taksit": "Loan & installments", "Aylık taksit, toplam faiz": "Monthly payment, total interest", "Tarih hesabı": "Date calculator", "İki tarih arası, gün ekle": "Between dates, add days", "Birim çevirici": "Unit converter", "Uzunluk, ağırlık, döviz…": "Length, weight, currency…", "Karar verici": "Decision maker", "Zar, yazı-tura, rastgele seç": "Dice, coin flip, random pick", "Sayıları birleştir": "Merge the numbers", "Mayın tarlası": "Minesweeper", "Mayınlara basma": "Don’t step on a mine", "1’den 9’a, tekrar yok": "1 to 9, no repeats", "Kelime": "Kelime (Turkish)", "Türkçe 5 harfli kelime bul": "Guess the Turkish 5-letter word", "İngilizce 5 harfli kelime bul": "Guess the English 5-letter word", "Geçmiş": "History", "Temizle": "Clear", "Henüz hesap yok.": "No calculations yet.", "Sonuç kopyalandı": "Result copied", "Hesap geçmişi silinsin mi?": "Clear calculation history?", "Zamanlayıcı": "Timer", "Kronometre": "Stopwatch", "Ayarla": "Set", "Başlat": "Start", "Duraklat": "Pause", "Devam": "Resume", "Sıfırla": "Reset", "Durdur": "Stop", "Tur": "Lap", "Süre dolunca ses ve titreşim verir. Uygulama açık kalmalı; çalışırken ekran kapanmaz.": "Plays a sound and vibrates when time is up. Keep the app open; the screen stays on while it runs.", "Süre doldu": "Time’s up", "sa": "h", "dk": "min", "sn": "s", "Odak": "Focus", "Kısa mola": "Short break", "Uzun mola": "Long break", "odak": "focus sessions", "Atla": "Skip", "Neye odaklanıyorsun? (isteğe bağlı)": "What are you focusing on? (optional)", "Süreler (dakika)": "Durations (minutes)", "Uzun mola her": "Long break every", "Odak tamam, mola zamanı": "Focus done, time for a break", "Mola bitti, odaklanma zamanı": "Break over, time to focus", "Kredi tutarı (₺)": "Loan amount (₺)", "Faiz oranı (%)": "Interest rate (%)", "Vade (ay)": "Term (months)", "Faiz türü": "Interest type", "Aylık": "Monthly", "Yıllık": "Yearly", "Aylık taksit": "Monthly payment", "Toplam ödeme": "Total payment", "Toplam faiz": "Total interest", "Ödeme planı": "Payment schedule", "Ay": "Month", "Taksit": "Payment", "Anapara": "Principal", "Faiz": "Interest", "Kalan": "Remaining", "Vergi ve masraflar (BSMV, KKDF, dosya ücreti) dahil değildir; bankanın teklifiyle karşılaştırmak için yaklaşık hesaptır.": "Taxes and fees are not included; this is an estimate to compare with the bank’s offer.", "İki tarih arası": "Between two dates", "Başlangıç": "Start", "Bitiş": "End", "Tarihe gün ekle / çıkar": "Add / subtract days", "Tarih": "Date", "Gün (eksi de olur)": "Days (negative works too)", "gün": "days", "hafta": "weeks", "ay": "months", "iş günü (Pzt–Cum)": "working days (Mon–Fri)", "Uzunluk": "Length", "Ağırlık": "Weight", "Sıcaklık": "Temperature", "Hacim": "Volume", "Alan": "Area", "Hız": "Speed", "Veri": "Data", "Döviz": "Currency", "Değer": "Value", "Kurlar yükleniyor…": "Loading rates…", "Milimetre": "Millimetre", "Santimetre": "Centimetre", "Metre": "Metre", "Kilometre": "Kilometre", "İnç": "Inch", "Ayak (ft)": "Foot (ft)", "Yarda": "Yard", "Mil": "Mile", "Gram": "Gram", "Kilogram": "Kilogram", "Ton": "Tonne", "Ons (oz)": "Ounce (oz)", "Libre (lb)": "Pound (lb)", "Santigrat (°C)": "Celsius (°C)", "Fahrenhayt (°F)": "Fahrenheit (°F)", "Mililitre": "Millilitre", "Litre": "Litre", "Metreküp": "Cubic metre", "Su bardağı (200 ml)": "Cup (200 ml)", "Galon (ABD)": "Gallon (US)", "Sıvı ons (ABD)": "Fluid ounce (US)", "Metrekare": "Square metre", "Kilometrekare": "Square kilometre", "Dönüm": "Dönüm (1,000 m²)", "Hektar": "Hectare", "Ayakkare": "Square foot", "Akre": "Acre", "Bayt": "Byte", "Kilobayt": "Kilobyte", "Megabayt": "Megabyte", "Gigabayt": "Gigabyte", "Terabayt": "Terabyte", "Yer değiştir": "Swap", "Zar": "Dice", "Yazı-tura": "Coin flip", "Listeden seç": "Pick from list", "Sayı": "Number", "Zar sayısı": "Number of dice", "Seçenekler (her satıra bir tane)": "Options (one per line)", "En az": "Min", "En çok": "Max", "At": "Flip", "Seç": "Pick", "Zar at": "Roll", "Üret": "Generate", "Önce seçenek yaz": "Write some options first", "Geçmişi ve istatistikleri sil": "Delete history and stats", "Bu oyunun geçmişi ve istatistikleri silinsin mi?": "Delete this game’s history and stats?", "Geçmiş silindi": "History deleted", "Skor": "Score", "En iyi": "Best", "Yeni oyun": "New game", "Kaydırarak oyna. Aynı sayılar birleşir.": "Swipe to play. Equal numbers merge.", "Oyun": "Games", "En büyük": "Biggest tile", "2048’e ulaştın!": "You reached 2048!", "Oyun bitti": "Game over", "Yeni oyun başlasın mı? Bu oyun kaydedilmez.": "Start a new game? This one won’t be saved.", "Kolay": "Easy", "Orta": "Medium", "Zor": "Hard", "Mayın": "Mines", "Süre": "Time", "Bayrak": "Flag", "Yeni": "New", "Açmak için dokun. Bayrak koymak için basılı tut ya da “Bayrak” modunu aç.": "Tap to open. Long-press, or turn on “Flag” mode, to place a flag.", "Kazanılan": "Won", "En iyi süre": "Best time", "Mayına bastın": "You hit a mine", "Hata": "Mistakes", "Not": "Notes", "Sil": "Erase", "İpucu": "Hint", "Çözülen": "Solved", "hata": "mistakes", "Yeni bulmaca başlasın mı? Bu oyun kaydedilmez.": "Start a new puzzle? This one won’t be saved.", "Zorluk değişsin mi? Bu oyun kaydedilmez.": "Change difficulty? This game won’t be saved.", "Kelimeler yükleniyor…": "Loading words…", "Kelime listesi yüklenemedi.": "The word list could not be loaded.", "Gir": "Enter", "Günün kelimesi": "Word of the day", "Serbest": "Free play", "Bildin!": "You got it!", "Yeni kelime": "New word", "Yarın yeni kelime": "New word tomorrow", "Kazanma": "Win rate", "Seri": "Streak", "En uzun": "Longest", "5 harf gerekli": "5 letters needed", "Listede yok": "Not in the word list", "Araçlar ve oyunlar sekmesi": "Tools & games tab", "Hesap makinesi, zamanlayıcı, odak sayacı, oyunlar…": "Calculator, timer, focus timer, games…", "Ton yoğunluğu": "Tone intensity", "Zeminin ve alanların temanın rengine ne kadar boyanacağı.": "How strongly the background and areas take on the theme color.", "Net": "Clear", "Canlı": "Vivid", "Bekleyen": "Open", "Her tema hem koyu hem açık modda çalışır.": "Every theme works in both dark and light mode."};
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
  EN_RX.push([/^(\d+) dk$/, '$1 min'], [/^Tur (\d+)$/, 'Lap $1'], [/^(\d+) sn$/, '$1 s']);
})();

/* ===================== Ortak ===================== */
const lsj = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsjw = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yok */ } };
/* Eşitlenen araç verisi: skorlar, geçmişler ve ayarlar 'td:<anahtar>' kaydı olarak saklanır (Drive'a gider).
   Yarım kalan oyun tahtaları ve döviz kuru önbelleği cihazda kalır. */
const TD_KEYS = ['calc', 'pomoCfg', 'pomoLog', 'loan', 'decideList'];
const tdGet = (key, def) => { const it = S.items.get('td:' + key); if (it && !it.deleted) return JSON.parse(JSON.stringify(it.v)); const old = lsj('pusula.' + key, undefined); return old === undefined ? def : old; };
function tdSet(key, v) { const id = 'td:' + key; const it = S.items.get(id) || { id, type: 'tooldata', key }; it.v = v; it.deleted = false; save(it, { silent: true }); }
function tdDelPrefix(prefix) { S.items.forEach(it => { if (it.type === 'tooldata' && !it.deleted && (it.key === prefix || String(it.key).startsWith(prefix + '.'))) remove(it, { silent: true }); }); }
/* Yarım kalan oyunlar da eşitlenir: her hamlede kısa gecikmeyle, kapatınca hemen yazılır */
const playT = {}, playPending = {};
function playSave(key, obj, now) { playPending[key] = JSON.parse(JSON.stringify(obj)); clearTimeout(playT[key]); if (now) playFlush(key); else playT[key] = setTimeout(() => playFlush(key), 1500); }
function playFlush(key) { const keys = key ? [key] : Object.keys(playPending); keys.forEach(k => { if (playPending[k] === undefined) return; clearTimeout(playT[k]); tdSet(k, playPending[k]); delete playPending[k]; }); }
window.addEventListener('pagehide', () => playFlush());
document.addEventListener('visibilitychange', () => { if (document.hidden) playFlush(); });
let tdMigrated = false;
function tdMigrate() { // 1.7.0'da cihazda tutulan veriyi bir kez eşitlenen kayda taşır
  if (tdMigrated) return; tdMigrated = true;
  try {
    const keys = TD_KEYS.concat(Object.keys(localStorage).filter(k => k.startsWith('pusula.gs.')).map(k => k.slice(7)));
    keys.forEach(k => { const raw = localStorage.getItem('pusula.' + k); if (raw == null) return; if (!S.items.get('td:' + k)) { try { tdSet(k, JSON.parse(raw)); } catch (e) { /* bozuk */ } } localStorage.removeItem('pusula.' + k); });
  } catch (e) { /* depolama yok */ }
}
let AC = null;
function beep(times, freq) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const n = times || 3, f = freq || 880;
    for (let i = 0; i < n; i++) {
      const o = AC.createOscillator(), g = AC.createGain(); const t = AC.currentTime + i * 0.45;
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(AC.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    }
  } catch (e) { /* ses yok */ }
  if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
}
function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { /* yok */ } }
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* desteklenmiyor */ }
}
const fmtClock = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(ss); };
const fmtSw = ms => { const cs = Math.floor(ms / 10) % 100; return fmtClock(ms) + '<small>.' + pad(cs) + '</small>'; };
function toolSheet(title, body, onClose) {
  openSheet('<div class="ed-top"><button class="icon-btn" data-act="close-sheet" aria-label="Geri">' + icon('back') + '</button><div class="tool-title u">' + esc(title) + '</div></div><div class="tool-body" id="toolBody">' + body + '</div>', { full: true, onClose });
}
const toolBody = () => $('#toolBody');

/* ===================== Araçlar sekmesi ===================== */
const TOOLS = [
  ['calc', 'Hesap makinesi', 'Geçmişli hesaplama', 'calc'],
  ['timer', 'Zamanlayıcı ve kronometre', 'Geri sayım, tur', 'clock'],
  ['pomo', 'Odak sayacı', 'Pomodoro: çalış, mola ver', 'goal'],
  ['loan', 'Kredi ve taksit', 'Aylık taksit, toplam faiz', 'percent'],
  ['dates', 'Tarih hesabı', 'İki tarih arası, gün ekle', 'event'],
  ['units', 'Birim çevirici', 'Uzunluk, ağırlık, döviz…', 'swap'],
  ['decide', 'Karar verici', 'Zar, yazı-tura, rastgele seç', 'dice']
];
const GAMES = [
  ['g2048', '2048', 'Sayıları birleştir', 'grid'],
  ['mines', 'Mayın tarlası', 'Mayınlara basma', 'flag'],
  ['sudoku', 'Sudoku', '1’den 9’a, tekrar yok', 'grid'],
  ['wordtr', 'Kelime', 'Türkçe 5 harfli kelime bul', 'text'],
  ['worden', 'Wordle', 'İngilizce 5 harfli kelime bul', 'text']
];
Object.assign(ICONS, {
  tools: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
  flag: '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
  text: '<path d="M5 6h14M12 6v13M9 19h6"/>'
});
function viewTools() {
  tdMigrate();
  S.toolsSub = S.toolsSub || lsGet('pusula.toolsSub', 'tools');
  const tile = (x, act) => '<button class="tool-tile" data-act="' + act + '" data-k="' + x[0] + '">' + icon(x[3]) + '<span class="tt-name">' + x[1] + '</span><span class="tt-desc">' + x[2] + '</span></button>';
  return '<div class="seg plan-seg"><button class="' + (S.toolsSub === 'tools' ? 'on' : '') + '" data-act="tools-sub" data-k="tools">Araçlar</button><button class="' + (S.toolsSub === 'games' ? 'on' : '') + '" data-act="tools-sub" data-k="games">Oyunlar</button></div>' +
    (S.toolsSub === 'games' ? '<div class="tool-grid">' + GAMES.map(x => tile(x, 'game-open')).join('') + '</div>' : '<div class="tool-grid">' + TOOLS.map(x => tile(x, 'tool-open')).join('') + '</div>');
}
Object.assign(ACTIONS, {
  'tools-sub': el => { S.toolsSub = el.dataset.k; lsSet('pusula.toolsSub', S.toolsSub); render(); },
  'tool-open': el => { unlockAudio(); ({ calc: openCalc, timer: openTimer, pomo: openPomo, loan: openLoan, dates: openDates, units: openUnits, decide: openDecide })[el.dataset.k](); },
  'game-open': el => { unlockAudio(); ({ g2048: open2048, mines: openMines, sudoku: openSudoku, wordtr: () => openWord('tr'), worden: () => openWord('en') })[el.dataset.k](); }
});

/* ===================== Hesap makinesi ===================== */
const CALC = { expr: '', hist: [] };
function calcEval(expr) {
  const src = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.');
  const toks = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++; toks.push(parseFloat(src.slice(i, j))); i = j; continue; }
    if ('+-*/%()'.includes(c)) { toks.push(c); i++; continue; }
    i++;
  }
  // unary eksi ve yüzde
  const out = [], ops = [], prec = { '+': 1, '-': 1, '*': 2, '/': 2, 'u': 3 };
  let prev = null;
  for (const t of toks) {
    if (typeof t === 'number') { out.push(t); prev = 'n'; continue; }
    if (t === '%') { if (out.length) out.push(out.pop() / 100); continue; }
    if (t === '(') { ops.push(t); prev = '('; continue; }
    if (t === ')') { while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop()); ops.pop(); prev = 'n'; continue; }
    let op = t; if (op === '-' && (prev === null || prev === 'o' || prev === '(')) op = 'u';
    while (ops.length && ops[ops.length - 1] !== '(' && prec[ops[ops.length - 1]] >= prec[op] && op !== 'u') out.push(ops.pop());
    ops.push(op); prev = 'o';
  }
  while (ops.length) out.push(ops.pop());
  const st = [];
  for (const t of out) {
    if (typeof t === 'number') { st.push(t); continue; }
    if (t === 'u') { st.push(-(st.pop() || 0)); continue; }
    const b = st.pop(), a = st.pop();
    if (a === undefined || b === undefined) return NaN;
    st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : a / b);
  }
  return st.length === 1 ? st[0] : NaN;
}
const calcFmt = n => !isFinite(n) ? (isNaN(n) ? '' : '∞') : (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-9 && n !== 0) ? n.toExponential(6) : String(Math.round(n * 1e10) / 1e10)).replace('.', ',');
function openCalc() {
  CALC.hist = tdGet('calc', []);
  const keys = [['C', 'k-fn'], ['⌫', 'k-fn'], ['%', 'k-fn'], ['÷', 'k-op'], ['7'], ['8'], ['9'], ['×', 'k-op'], ['4'], ['5'], ['6'], ['−', 'k-op'], ['1'], ['2'], ['3'], ['+', 'k-op'], ['±', 'k-fn'], ['0'], [','], ['=', 'k-eq']];
  toolSheet(T_('Hesap makinesi'), '<div class="calc"><div class="calc-disp"><div class="calc-expr" id="calcExpr"></div><div class="calc-res" id="calcRes">0</div></div>' +
    '<div class="calc-keys">' + keys.map(k => '<button class="ck ' + (k[1] || '') + '" data-act="calc-key" data-k="' + k[0] + '">' + k[0] + '</button>').join('') + '</div>' +
    '<div class="calc-hist-head"><span>Geçmiş</span><button class="link" data-act="calc-clear">Temizle</button></div><div class="calc-hist" id="calcHist"></div></div>');
  calcRender();
}
function T_(s) { return tr(s); }
function calcRender() {
  const e = $('#calcExpr'), r = $('#calcRes'), h = $('#calcHist'); if (!e) return;
  e.textContent = CALC.expr || ' ';
  const v = calcEval(CALC.expr); r.textContent = CALC.expr ? (calcFmt(v) || '…') : '0';
  h.innerHTML = CALC.hist.length ? CALC.hist.slice().reverse().map((x, i) => '<button class="ch-row" data-act="calc-use" data-i="' + (CALC.hist.length - 1 - i) + '"><span class="u">' + esc(x.e) + '</span><b class="u">= ' + esc(x.r) + '</b></button>').join('') : '<div class="empty">Henüz hesap yok.</div>';
}
Object.assign(ACTIONS, {
  'calc-key': el => {
    const k = el.dataset.k; let x = CALC.expr;
    if (k === 'C') x = '';
    else if (k === '⌫') x = x.slice(0, -1);
    else if (k === '=') { const v = calcEval(x); if (x && isFinite(v)) { const r = calcFmt(v); CALC.hist.push({ e: x, r, t: Date.now() }); CALC.hist = CALC.hist.slice(-30); tdSet('calc', CALC.hist); x = r; } }
    else if (k === '±') { const m = x.match(/(−?)([0-9,]+)$/); if (m) x = x.slice(0, x.length - m[0].length) + (m[1] ? '' : '−') + m[2]; else x += '−'; }
    else if ('+−×÷'.includes(k)) { if (!x && k !== '−') return; if (/[+−×÷]$/.test(x)) x = x.slice(0, -1); x += k; }
    else if (k === ',') { const last = x.split(/[+−×÷]/).pop(); if (!last.includes(',')) x += (last === '' ? '0,' : ','); }
    else x += k;
    CALC.expr = x; calcRender();
  },
  'calc-use': el => { const h = CALC.hist[+el.dataset.i]; if (!h) return; CALC.expr = h.r; calcRender(); try { navigator.clipboard.writeText(h.r).then(() => toast(tr('Sonuç kopyalandı'))).catch(() => {}); } catch (e) { /* yok */ } },
  'calc-clear': () => { if (!CALC.hist.length || !ask('Hesap geçmişi silinsin mi?')) return; CALC.hist = []; tdSet('calc', []); calcRender(); }
});

/* ===================== Zamanlayıcı ve kronometre ===================== */
const TM = { mode: 'timer', t: { dur: 5 * 60000, end: 0, left: 5 * 60000, run: false }, sw: { start: 0, acc: 0, run: false, laps: [] }, iv: null };
function tmTick() {
  const now = Date.now();
  if (TM.t.run) { TM.t.left = TM.t.end - now; if (TM.t.left <= 0) { TM.t.left = 0; TM.t.run = false; beep(5); toast(tr('Süre doldu')); keepAwake(PM.run); } }
  const a = $('#tmTimer'); if (a) a.innerHTML = fmtClock(TM.t.left);
  const b = $('#tmSw'); if (b) b.innerHTML = fmtSw(TM.sw.acc + (TM.sw.run ? now - TM.sw.start : 0));
  const pr = $('#tmProg'); if (pr) pr.style.width = (TM.t.dur ? 100 - TM.t.left / TM.t.dur * 100 : 0) + '%';
  if (!TM.t.run && !TM.sw.run && !PM.run) { clearInterval(TM.iv); TM.iv = null; }
}
const tmStartLoop = () => { if (!TM.iv) TM.iv = setInterval(() => { tmTick(); pmTick(); }, 200); };
function openTimer() { toolSheet(T_('Zamanlayıcı ve kronometre'), '<div id="tmWrap"></div>'); timerRender(); }
function timerRender() {
  const w = $('#tmWrap'); if (!w) return;
  const seg2 = '<div class="seg tool-seg"><button class="' + (TM.mode === 'timer' ? 'on' : '') + '" data-act="tm-mode" data-v="timer">Zamanlayıcı</button><button class="' + (TM.mode === 'sw' ? 'on' : '') + '" data-act="tm-mode" data-v="sw">Kronometre</button></div>';
  if (TM.mode === 'timer') {
    const idle = !TM.t.run && TM.t.left === TM.t.dur;
    w.innerHTML = seg2 + '<div class="big-clock" id="tmTimer">' + fmtClock(TM.t.left) + '</div><div class="bar tm-bar"><i id="tmProg"></i></div>' +
      (idle ? '<div class="chips tm-presets">' + [1, 3, 5, 10, 15, 25, 30, 45, 60].map(m => '<button class="chip ' + (TM.t.dur === m * 60000 ? 'on' : '') + '" data-act="tm-preset" data-m="' + m + '">' + m + ' dk</button>').join('') + '</div>' +
        '<div class="tm-custom"><input class="input" type="number" min="0" inputmode="numeric" id="tmH" placeholder="sa"><input class="input" type="number" min="0" inputmode="numeric" id="tmM" placeholder="dk"><input class="input" type="number" min="0" inputmode="numeric" id="tmS" placeholder="sn"><button class="btn" data-act="tm-set">Ayarla</button></div>' : '') +
      '<div class="tool-actions"><button class="btn primary" data-act="tm-toggle">' + (TM.t.run ? 'Duraklat' : (idle ? 'Başlat' : 'Devam')) + '</button><button class="btn" data-act="tm-reset">Sıfırla</button></div>' +
      '<p class="muted sm center">Süre dolunca ses ve titreşim verir. Uygulama açık kalmalı; çalışırken ekran kapanmaz.</p>';
  } else {
    w.innerHTML = seg2 + '<div class="big-clock" id="tmSw">' + fmtSw(TM.sw.acc + (TM.sw.run ? Date.now() - TM.sw.start : 0)) + '</div>' +
      '<div class="tool-actions"><button class="btn primary" data-act="sw-toggle">' + (TM.sw.run ? 'Durdur' : (TM.sw.acc ? 'Devam' : 'Başlat')) + '</button><button class="btn" data-act="sw-lap" ' + (TM.sw.run ? '' : 'disabled') + '>Tur</button><button class="btn" data-act="sw-reset">Sıfırla</button></div>' +
      (TM.sw.laps.length ? '<div class="laps">' + TM.sw.laps.map((l, i) => '<div><span>Tur ' + (TM.sw.laps.length - i) + '</span><b>' + fmtSw(l.split) + '</b><span class="muted">' + fmtSw(l.total) + '</span></div>').join('') + '</div>' : '');
  }
  translateTree(w);
}
Object.assign(ACTIONS, {
  'tm-mode': el => { TM.mode = el.dataset.v; timerRender(); },
  'tm-preset': el => { if (TM.t.run) return; TM.t.dur = TM.t.left = +el.dataset.m * 60000; timerRender(); },
  'tm-set': () => { const ms = ((+$('#tmH').value || 0) * 3600 + (+$('#tmM').value || 0) * 60 + (+$('#tmS').value || 0)) * 1000; if (ms > 0) { TM.t.dur = TM.t.left = ms; timerRender(); } },
  'tm-toggle': () => { unlockAudio(); if (TM.t.run) { TM.t.run = false; TM.t.left = TM.t.end - Date.now(); keepAwake(PM.run); } else { if (TM.t.left <= 0) TM.t.left = TM.t.dur; TM.t.end = Date.now() + TM.t.left; TM.t.run = true; keepAwake(true); tmStartLoop(); } timerRender(); },
  'tm-reset': () => { TM.t.run = false; TM.t.left = TM.t.dur; keepAwake(PM.run); timerRender(); },
  'sw-toggle': () => { if (TM.sw.run) { TM.sw.acc += Date.now() - TM.sw.start; TM.sw.run = false; } else { TM.sw.start = Date.now(); TM.sw.run = true; tmStartLoop(); } timerRender(); },
  'sw-lap': () => { const total = TM.sw.acc + (Date.now() - TM.sw.start); const prevT = TM.sw.laps.length ? TM.sw.laps[0].total : 0; TM.sw.laps.unshift({ total, split: total - prevT }); timerRender(); },
  'sw-reset': () => { TM.sw = { start: 0, acc: 0, run: false, laps: [] }; timerRender(); }
});

/* ===================== Odak sayacı (Pomodoro) ===================== */
const PM = Object.assign({ phase: 'work', left: 0, end: 0, run: false, round: 0, task: '' }, { cfg: { work: 25, short: 5, long: 15, every: 4 } });
const pmDur = ph => (PM.cfg[ph] || 25) * 60000;
PM.left = pmDur('work');
function pmToday() { const d = tdGet('pomoLog', {}); return d[today()] || 0; }
function pmTick() {
  if (!PM.run) return;
  PM.left = PM.end - Date.now();
  if (PM.left <= 0) {
    beep(4, PM.phase === 'work' ? 660 : 990);
    if (PM.phase === 'work') {
      PM.round++; const log = tdGet('pomoLog', {}); log[today()] = (log[today()] || 0) + 1; Object.keys(log).sort().slice(0, -400).forEach(k => delete log[k]); tdSet('pomoLog', log);
      PM.phase = PM.round % (PM.cfg.every || 4) === 0 ? 'long' : 'short'; toast(tr('Odak tamam, mola zamanı'));
    } else { PM.phase = 'work'; toast(tr('Mola bitti, odaklanma zamanı')); }
    PM.left = pmDur(PM.phase); PM.end = Date.now() + PM.left;
  }
  const c = $('#pmClock'); if (c) c.innerHTML = fmtClock(PM.left);
  const p = $('#pmPhase'); if (p) p.textContent = tr(PM_LABEL[PM.phase]);
  const r = $('#pmRing'); if (r) r.style.setProperty('--p', (100 - PM.left / pmDur(PM.phase) * 100) + '%');
}
let pmCfgT = null;
const PM_LABEL = { work: 'Odak', short: 'Kısa mola', long: 'Uzun mola' };
function openPomo() { if (!PM.run) { PM.cfg = Object.assign({ work: 25, short: 5, long: 15, every: 4 }, tdGet('pomoCfg', {})); PM.left = pmDur(PM.phase); } toolSheet(T_('Odak sayacı'), '<div id="pmWrap"></div>'); pomoRender(); }
function pomoRender() {
  const w = $('#pmWrap'); if (!w) return;
  const tasks = list('task').filter(t => !t.done).sort(taskSort).slice(0, 30);
  w.innerHTML = '<div class="pm-ring ' + PM.phase + '" id="pmRing" style="--p:' + (100 - PM.left / pmDur(PM.phase) * 100) + '%"><div><div class="pm-phase" id="pmPhase">' + PM_LABEL[PM.phase] + '</div><div class="big-clock" id="pmClock">' + fmtClock(PM.left) + '</div><div class="muted sm"><span>Bugün</span> ' + pmToday() + ' <span>odak</span></div></div></div>' +
    '<div class="tool-actions"><button class="btn primary" data-act="pm-toggle">' + (PM.run ? 'Duraklat' : 'Başlat') + '</button><button class="btn" data-act="pm-skip">Atla</button><button class="btn" data-act="pm-reset">Sıfırla</button></div>' +
    (tasks.length ? '<label class="field"><span>Neye odaklanıyorsun? (isteğe bağlı)</span><select class="input" id="pmTask"><option value="">—</option>' + tasks.map(t => '<option value="' + t.id + '" ' + (PM.task === t.id ? 'selected' : '') + '>' + esc(t.title) + '</option>').join('') + '</select></label>' : '') +
    '<div class="field"><span>Süreler (dakika)</span><div class="pm-cfg"><label><input class="input" type="number" min="1" id="pmW" value="' + PM.cfg.work + '"><small>Odak</small></label><label><input class="input" type="number" min="1" id="pmS" value="' + PM.cfg.short + '"><small>Kısa mola</small></label><label><input class="input" type="number" min="1" id="pmL" value="' + PM.cfg.long + '"><small>Uzun mola</small></label><label><input class="input" type="number" min="1" id="pmE" value="' + PM.cfg.every + '"><small>Uzun mola her</small></label></div></div>';
  translateTree(w);
}
Object.assign(ACTIONS, {
  'pm-toggle': () => { unlockAudio(); if (PM.run) { PM.run = false; PM.left = PM.end - Date.now(); keepAwake(TM.t.run); } else { PM.end = Date.now() + PM.left; PM.run = true; keepAwake(true); tmStartLoop(); } pomoRender(); },
  'pm-skip': () => { if (PM.phase === 'work') { PM.phase = 'short'; } else PM.phase = 'work'; PM.left = pmDur(PM.phase); if (PM.run) PM.end = Date.now() + PM.left; pomoRender(); },
  'pm-reset': () => { PM.run = false; PM.phase = 'work'; PM.round = 0; PM.left = pmDur('work'); keepAwake(TM.t.run); pomoRender(); }
});

/* ===================== Kredi ve taksit ===================== */
function openLoan() {
  const c = tdGet('loan', { amount: 100000, rate: 3.5, months: 12, kind: 'monthly' });
  toolSheet(T_('Kredi ve taksit'), '<div class="loan"><label class="field"><span>Kredi tutarı (₺)</span><input class="input" type="number" inputmode="decimal" id="lnA" value="' + c.amount + '"></label>' +
    '<div class="field-row"><label class="field"><span>Faiz oranı (%)</span><input class="input" type="number" inputmode="decimal" step="any" id="lnR" value="' + c.rate + '"></label><label class="field"><span>Vade (ay)</span><input class="input" type="number" inputmode="numeric" id="lnM" value="' + c.months + '"></label></div>' +
    '<div class="field"><span>Faiz türü</span>' + seg('lnKind', [['monthly', 'Aylık'], ['yearly', 'Yıllık']], c.kind) + '</div>' +
    '<div id="lnOut"></div><p class="muted sm">Vergi ve masraflar (BSMV, KKDF, dosya ücreti) dahil değildir; bankanın teklifiyle karşılaştırmak için yaklaşık hesaptır.</p></div>');
  loanCalc();
}
let loanT = null;
function loanCalc() {
  const A = parseFloat($('#lnA') && $('#lnA').value) || 0, R = parseFloat($('#lnR').value) || 0, M = parseInt($('#lnM').value, 10) || 0;
  const kind = segVal('lnKind') || 'monthly'; clearTimeout(loanT); loanT = setTimeout(() => tdSet('loan', { amount: A, rate: R, months: M, kind }), 800);
  const out = $('#lnOut'); if (!out) return;
  if (!(A > 0 && M > 0)) { out.innerHTML = ''; return; }
  const r = kind === 'monthly' ? R / 100 : R / 100 / 12;
  const pmt = r ? A * r / (1 - Math.pow(1 + r, -M)) : A / M;
  const total = pmt * M; let bal = A; const rows = [];
  for (let i = 1; i <= M; i++) { const it = bal * r, pr = pmt - it; bal -= pr; rows.push([i, pmt, pr, it, Math.max(0, bal)]); }
  const tl = n => fmtNum(Math.round(n * 100) / 100) + ' ₺';
  out.innerHTML = '<div class="loan-sum"><div><span>Aylık taksit</span><b>' + tl(pmt) + '</b></div><div><span>Toplam ödeme</span><b>' + tl(total) + '</b></div><div><span>Toplam faiz</span><b>' + tl(total - A) + '</b></div></div>' +
    '<details class="loan-tbl"><summary>Ödeme planı</summary><table><thead><tr><th>Ay</th><th>Taksit</th><th>Anapara</th><th>Faiz</th><th>Kalan</th></tr></thead><tbody>' + rows.map(x => '<tr><td>' + x[0] + '</td><td>' + fmtNum(Math.round(x[1])) + '</td><td>' + fmtNum(Math.round(x[2])) + '</td><td>' + fmtNum(Math.round(x[3])) + '</td><td>' + fmtNum(Math.round(x[4])) + '</td></tr>').join('') + '</tbody></table></details>';
  translateTree(out);
}

/* ===================== Tarih hesabı ===================== */
function openDates() {
  const t0 = today();
  toolSheet(T_('Tarih hesabı'), '<div class="dates"><div class="section-title first"><span>İki tarih arası</span></div>' +
    '<div class="field-row"><label class="field"><span>Başlangıç</span><input type="date" class="input" id="dtA" value="' + t0 + '"></label><label class="field"><span>Bitiş</span><input type="date" class="input" id="dtB" value="' + addDays(t0, 30) + '"></label></div><div class="calc-out" id="dtOut1"></div>' +
    '<div class="section-title"><span>Tarihe gün ekle / çıkar</span></div>' +
    '<div class="field-row"><label class="field"><span>Tarih</span><input type="date" class="input" id="dtC" value="' + t0 + '"></label><label class="field"><span>Gün (eksi de olur)</span><input type="number" class="input" inputmode="numeric" id="dtN" value="90"></label></div><div class="calc-out" id="dtOut2"></div></div>');
  datesCalc();
}
function datesCalc() {
  const a = $('#dtA') && $('#dtA').value, b = $('#dtB').value, c = $('#dtC').value, n = parseInt($('#dtN').value, 10) || 0;
  const o1 = $('#dtOut1'), o2 = $('#dtOut2');
  if (a && b) {
    const d = daysBetween(a, b); let work = 0; const s = d >= 0 ? a : b, e = d >= 0 ? b : a;
    for (let x = s; x < e; x = addDays(x, 1)) if (dow(x) < 5) work++;
    const A = parseYmd(s), B = parseYmd(e); let months = (B.getFullYear() - A.getFullYear()) * 12 + B.getMonth() - A.getMonth(); if (B.getDate() < A.getDate()) months--;
    const rest = daysBetween(ymd(new Date(A.getFullYear(), A.getMonth() + months, A.getDate())), e);
    o1.innerHTML = '<b>' + Math.abs(d) + '</b> <span>gün</span> · ' + Math.floor(Math.abs(d) / 7) + ' <span>hafta</span> ' + (Math.abs(d) % 7) + ' <span>gün</span><br><span class="muted">' + months + ' <span>ay</span> ' + rest + ' <span>gün</span> · ' + work + ' <span>iş günü (Pzt–Cum)</span></span>';
  }
  if (c) { const r = addDays(c, n); o2.innerHTML = '<b>' + fmtLong(r) + ' ' + parseYmd(r).getFullYear() + '</b>'; }
  translateTree(o1); translateTree(o2);
}

/* ===================== Birim çevirici ===================== */
const UNITS = {
  length: { name: 'Uzunluk', u: { mm: ['Milimetre', 0.001], cm: ['Santimetre', 0.01], m: ['Metre', 1], km: ['Kilometre', 1000], in: ['İnç', 0.0254], ft: ['Ayak (ft)', 0.3048], yd: ['Yarda', 0.9144], mi: ['Mil', 1609.344] } },
  weight: { name: 'Ağırlık', u: { g: ['Gram', 0.001], kg: ['Kilogram', 1], t: ['Ton', 1000], oz: ['Ons (oz)', 0.0283495], lb: ['Libre (lb)', 0.453592] } },
  temp: { name: 'Sıcaklık', u: { c: ['Santigrat (°C)'], f: ['Fahrenhayt (°F)'], k: ['Kelvin (K)'] } },
  volume: { name: 'Hacim', u: { ml: ['Mililitre', 0.001], l: ['Litre', 1], m3: ['Metreküp', 1000], cup: ['Su bardağı (200 ml)', 0.2], gal: ['Galon (ABD)', 3.78541], floz: ['Sıvı ons (ABD)', 0.0295735] } },
  area: { name: 'Alan', u: { m2: ['Metrekare', 1], km2: ['Kilometrekare', 1e6], donum: ['Dönüm', 1000], ha: ['Hektar', 10000], ft2: ['Ayakkare', 0.092903], acre: ['Akre', 4046.86] } },
  speed: { name: 'Hız', u: { kmh: ['km/sa', 1 / 3.6], ms: ['m/sn', 1], mph: ['mil/sa', 0.44704], kn: ['Knot', 0.514444] } },
  data: { name: 'Veri', u: { b: ['Bayt', 1], kb: ['Kilobayt', 1024], mb: ['Megabayt', 1048576], gb: ['Gigabayt', 1073741824], tb: ['Terabayt', 1099511627776] } },
  fx: { name: 'Döviz', u: {} }
};
const FX_LIST = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'SAR', 'AED', 'RUB', 'CNY'];
const UV = { cat: 'length', from: 'm', to: 'km', val: '1' };
function openUnits() { toolSheet(T_('Birim çevirici'), '<div id="unWrap"></div>'); unitsRender(); if (UV.cat === 'fx') fxLoad(); }
function unitDefs(cat) { if (cat !== 'fx') return UNITS[cat].u; const o = {}; FX_LIST.forEach(c => { o[c] = [c]; }); return o; }
function unitsRender() {
  const w = $('#unWrap'); if (!w) return; const defs = unitDefs(UV.cat);
  if (!defs[UV.from]) UV.from = Object.keys(defs)[0]; if (!defs[UV.to]) UV.to = Object.keys(defs)[1];
  const sel = (id, cur) => '<select class="input" id="' + id + '">' + Object.keys(defs).map(k => '<option value="' + k + '" ' + (k === cur ? 'selected' : '') + '>' + esc(defs[k][0]) + '</option>').join('') + '</select>';
  w.innerHTML = '<div class="chips un-cats">' + Object.keys(UNITS).map(k => '<button class="chip ' + (UV.cat === k ? 'on' : '') + '" data-act="un-cat" data-k="' + k + '">' + UNITS[k].name + '</button>').join('') + '</div>' +
    '<label class="field"><span>Değer</span><input class="input big-num" type="number" inputmode="decimal" step="any" id="unVal" value="' + esc(UV.val) + '"></label>' +
    '<div class="un-pair">' + sel('unFrom', UV.from) + '<button class="icon-btn" data-act="un-swap" aria-label="Yer değiştir">' + icon('swap') + '</button>' + sel('unTo', UV.to) + '</div>' +
    '<div class="un-res" id="unRes"></div>' + (UV.cat === 'fx' ? '<p class="muted sm" id="fxInfo"></p>' : '');
  translateTree(w); unitsCalc();
}
function unitsCalc() {
  const r = $('#unRes'); if (!r) return; const v = parseFloat(UV.val);
  if (isNaN(v)) { r.textContent = ''; return; }
  let out;
  if (UV.cat === 'temp') { const c = UV.from === 'c' ? v : UV.from === 'f' ? (v - 32) * 5 / 9 : v - 273.15; out = UV.to === 'c' ? c : UV.to === 'f' ? c * 9 / 5 + 32 : c + 273.15; }
  else if (UV.cat === 'fx') { const fx = lsj('pusula.fx', null); if (!fx) { r.textContent = tr('Kurlar yükleniyor…'); return; } const toEur = c => c === 'EUR' ? 1 : fx.rates[c]; if (!toEur(UV.from) || !toEur(UV.to)) { r.textContent = '—'; return; } out = v / toEur(UV.from) * toEur(UV.to); }
  else { const d = UNITS[UV.cat].u; out = v * d[UV.from][1] / d[UV.to][1]; }
  const ax = Math.abs(out); r.innerHTML = '<b>' + Number(out).toLocaleString(TR, { maximumFractionDigits: ax < 1 ? 6 : ax < 100 ? 4 : 2 }) + '</b> <span>' + esc(unitDefs(UV.cat)[UV.to][0]) + '</span>';
}
async function fxLoad() {
  const info = () => { const fx = lsj('pusula.fx', null); const el = $('#fxInfo'); if (el) el.textContent = fx ? Lx('Kur tarihi: ' + fx.date + ' (Avrupa Merkez Bankası). İnternetsizken son kurlar kullanılır.', 'Rates from ' + fx.date + ' (European Central Bank). Last rates are used offline.') : Lx('Kurlar için internet gerekli.', 'Internet is needed for rates.'); };
  info();
  const fx = lsj('pusula.fx', null);
  if (fx && fx.at && Date.now() - fx.at < 6 * 3600000) return;
  if (!navigator.onLine) return;
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=' + FX_LIST.filter(c => c !== 'EUR').join(','));
    const j = await r.json(); if (j && j.rates) { lsjw('pusula.fx', { date: j.date, rates: j.rates, at: Date.now() }); info(); unitsCalc(); }
  } catch (e) { info(); }
}
Object.assign(ACTIONS, {
  'un-cat': el => { UV.cat = el.dataset.k; UV.from = ''; UV.to = ''; if (UV.cat === 'fx') { UV.from = 'USD'; UV.to = 'TRY'; } unitsRender(); if (UV.cat === 'fx') fxLoad(); },
  'un-swap': () => { const a = UV.from; UV.from = UV.to; UV.to = a; unitsRender(); }
});

/* ===================== Karar verici ===================== */
const DC = { mode: 'dice', dice: 1, last: '', list: null, min: 1, max: 100 };
function openDecide() { if (DC.list == null) DC.list = tdGet('decideList', ''); toolSheet(T_('Karar verici'), '<div id="dcWrap"></div>'); decideRender(); }
function decideRender() {
  const w = $('#dcWrap'); if (!w) return;
  const modes = [['dice', 'Zar'], ['coin', 'Yazı-tura'], ['list', 'Listeden seç'], ['num', 'Sayı']];
  let body = '';
  if (DC.mode === 'dice') body = '<div class="field"><span>Zar sayısı</span>' + seg('dcN', [[1, '1'], [2, '2'], [3, '3']], DC.dice) + '</div>';
  if (DC.mode === 'list') body = '<label class="field"><span>Seçenekler (her satıra bir tane)</span><textarea class="input" rows="5" id="dcList" placeholder="Pizza&#10;Döner&#10;Salata">' + esc(DC.list) + '</textarea></label>';
  if (DC.mode === 'num') body = '<div class="field-row"><label class="field"><span>En az</span><input class="input" type="number" id="dcMin" value="' + DC.min + '"></label><label class="field"><span>En çok</span><input class="input" type="number" id="dcMax" value="' + DC.max + '"></label></div>';
  w.innerHTML = '<div class="seg tool-seg">' + modes.map(m => '<button class="' + (DC.mode === m[0] ? 'on' : '') + '" data-act="dc-mode" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>' + body +
    '<div class="dc-result u" id="dcRes">' + (DC.last || '?') + '</div><div class="tool-actions"><button class="btn primary" data-act="dc-go">' + (DC.mode === 'coin' ? 'At' : DC.mode === 'list' ? 'Seç' : DC.mode === 'dice' ? 'Zar at' : 'Üret') + '</button></div>';
  translateTree(w);
}
const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
Object.assign(ACTIONS, {
  'dc-mode': el => { DC.mode = el.dataset.v; DC.last = ''; decideRender(); },
  'dc-go': () => {
    const res = $('#dcRes'); let v = '';
    if (DC.mode === 'dice') { DC.dice = +(segVal('dcN') || 1); const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; const rolls = Array.from({ length: DC.dice }, () => rnd(6)); v = rolls.map(r => faces[r]).join(' ') + '<small>' + rolls.reduce((a, r) => a + r + 1, 0) + '</small>'; }
    if (DC.mode === 'coin') v = rnd(2) ? Lx('Yazı', 'Tails') : Lx('Tura', 'Heads');
    if (DC.mode === 'list') { DC.list = $('#dcList').value; if (DC.list !== tdGet('decideList', '')) tdSet('decideList', DC.list); const opts = DC.list.split('\n').map(x => x.trim()).filter(Boolean); if (!opts.length) return toast(tr('Önce seçenek yaz')); v = esc(opts[rnd(opts.length)]); }
    if (DC.mode === 'num') { DC.min = parseInt($('#dcMin').value, 10) || 0; DC.max = parseInt($('#dcMax').value, 10) || 0; const lo = Math.min(DC.min, DC.max), hi = Math.max(DC.min, DC.max); v = String(lo + rnd(hi - lo + 1)); }
    DC.last = v; res.classList.remove('pop'); void res.offsetWidth; res.innerHTML = v; res.classList.add('pop');
    if (navigator.vibrate) navigator.vibrate(30);
  }
});

/* araç girdileri */
document.addEventListener('input', e => {
  const id = e.target.id || '';
  if (/^ln[ARM]$/.test(id)) loanCalc();
  else if (/^dt[ABCN]$/.test(id)) datesCalc();
  else if (id === 'unVal') { UV.val = e.target.value; unitsCalc(); }
  else if (/^pm[WSLE]$/.test(id)) { const v = Math.max(1, parseInt(e.target.value, 10) || 1); PM.cfg[{ pmW: 'work', pmS: 'short', pmL: 'long', pmE: 'every' }[id]] = v; clearTimeout(pmCfgT); pmCfgT = setTimeout(() => tdSet('pomoCfg', PM.cfg), 600); if (!PM.run) { PM.left = pmDur(PM.phase); const c = $('#pmClock'); if (c) c.innerHTML = fmtClock(PM.left); } }
});
document.addEventListener('change', e => {
  const id = e.target.id || '';
  if (id === 'unFrom' || id === 'unTo') { UV[id === 'unFrom' ? 'from' : 'to'] = e.target.value; unitsCalc(); }
  else if (id === 'pmTask') PM.task = e.target.value;
});
document.addEventListener('click', e => { const b = e.target.closest('.seg[data-name=lnKind] button'); if (b) setTimeout(loanCalc, 0); });

/* ===================== Oyun istatistikleri (ortak) ===================== */
function gStats(key, def) { return tdGet('gs.' + key, def || { played: 0, won: 0, best: null, hist: [] }); }
function gStatsSave(key, s) { s.hist = (s.hist || []).slice(-30); tdSet('gs.' + key, s); }
function statsBlock(key, rows, histRow) {
  const s = gStats(key);
  return '<div class="g-stats"><div class="g-stat-row">' + rows.map(r => '<div><b>' + r[1] + '</b><span>' + r[0] + '</span></div>').join('') + '</div>' +
    (s.hist && s.hist.length ? '<details class="g-hist"><summary>Geçmiş</summary><div>' + s.hist.slice().reverse().slice(0, 15).map(histRow).join('') + '</div></details>' : '') +
    '<button class="link danger" data-act="g-clear" data-k="' + key.split('.')[0] + '">Geçmişi ve istatistikleri sil</button></div>';
}
const shortDate = t => new Date(t).toLocaleDateString(TR, { day: 'numeric', month: 'short' });
Object.assign(ACTIONS, {
  'g-clear': el => {
    const k = el.dataset.k; if (!ask('Bu oyunun geçmişi ve istatistikleri silinsin mi?')) return;
    tdDelPrefix('gs.' + k); try { Object.keys(localStorage).filter(x => x === 'pusula.gs.' + k || x.startsWith('pusula.gs.' + k + '.')).forEach(x => localStorage.removeItem(x)); } catch (e) { /* yok */ }
    toast(tr('Geçmiş silindi'));
    ({ g2048: g2048Render, mines: minesRender, sudoku: sudokuRender, wordtr: wordRender, worden: wordRender })[k.split('.')[0]]();
  }
});

/* ===================== 2048 ===================== */
let G48 = null;
function g48New() { G48 = { grid: Array(16).fill(0), score: 0, over: false, won: false, keep: false }; g48Spawn(); g48Spawn(); playSave('g2048', G48); }
function g48Spawn() { const e = G48.grid.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (!e.length) return; G48.grid[e[rnd(e.length)]] = rnd(10) ? 2 : 4; }
function g48Move(dir) {
  if (G48.over) return;
  const g = G48.grid, before = g.join(',');
  const line = i => dir === 'left' ? [0, 1, 2, 3].map(j => i * 4 + j) : dir === 'right' ? [3, 2, 1, 0].map(j => i * 4 + j) : dir === 'up' ? [0, 1, 2, 3].map(j => j * 4 + i) : [3, 2, 1, 0].map(j => j * 4 + i);
  for (let i = 0; i < 4; i++) {
    const idx = line(i); const vals = idx.map(k => g[k]).filter(Boolean); const out = [];
    for (let j = 0; j < vals.length; j++) { if (vals[j] === vals[j + 1]) { out.push(vals[j] * 2); G48.score += vals[j] * 2; j++; } else out.push(vals[j]); }
    while (out.length < 4) out.push(0); idx.forEach((k, j) => { g[k] = out[j]; });
  }
  if (g.join(',') === before) return;
  g48Spawn();
  const max = Math.max(...g);
  if (max >= 2048 && !G48.won && !G48.keep) { G48.won = true; g48End(true); }
  const canMove = g.some(v => !v) || g.some((v, i) => (i % 4 < 3 && v === g[i + 1]) || (i < 12 && v === g[i + 4]));
  if (!canMove) { G48.over = true; g48End(false); }
  playSave('g2048', G48); g48Board();
}
function g48End(won) {
  const s = gStats('g2048'); s.played++; if (won) s.won++; const max = Math.max(...G48.grid);
  s.best = Math.max(s.best || 0, G48.score); s.maxTile = Math.max(s.maxTile || 0, max); s.hist.push({ t: Date.now(), score: G48.score, max }); gStatsSave('g2048', s);
  toast(won ? tr('2048’e ulaştın!') : tr('Oyun bitti'));
}
function open2048() { G48 = tdGet('g2048', null) || G48; if (!G48) g48New(); toolSheet('2048', '<div id="g48Wrap"></div>', () => playFlush('g2048')); g2048Render(); }
function g2048Render() {
  const w = $('#g48Wrap'); if (!w) return; const s = gStats('g2048');
  w.innerHTML = '<div class="g-top"><div class="g-score"><span>Skor</span><b id="g48Score">' + G48.score + '</b></div><div class="g-score"><span>En iyi</span><b>' + (s.best || 0) + '</b></div><button class="btn" data-act="g48-new">Yeni oyun</button></div>' +
    '<div class="g48" id="g48Board"></div><p class="muted sm center">Kaydırarak oyna. Aynı sayılar birleşir.</p>' +
    statsBlock('g2048', [['Oyun', s.played], ['En iyi', s.best || 0], ['En büyük', s.maxTile || 0]], h => '<div class="gh-row"><span>' + shortDate(h.t) + '</span><b>' + h.score + '</b><span class="muted">' + h.max + '</span></div>');
  g48Board(); g48Bind(); translateTree(w);
}
function g48Board() {
  const b = $('#g48Board'); if (!b) return;
  b.innerHTML = G48.grid.map(v => '<div class="t48 ' + (v ? 'v' + Math.min(v, 4096) : '') + '">' + (v || '') + '</div>').join('') + (G48.over ? '<div class="g-over">' + tr('Oyun bitti') + '</div>' : '');
  const sc = $('#g48Score'); if (sc) sc.textContent = G48.score;
}
function g48Bind() {
  const b = $('#g48Board'); if (!b || b.dataset.bound) return; b.dataset.bound = 1; let sx = 0, sy = 0, act = false;
  b.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; act = true; b.setPointerCapture(e.pointerId); });
  b.addEventListener('pointerup', e => { if (!act) return; act = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; g48Move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); });
}
document.addEventListener('keydown', e => {
  if (!$('#g48Board')) return; const m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key]; if (m) { e.preventDefault(); g48Move(m); }
});
Object.assign(ACTIONS, { 'g48-new': () => { if (!G48.over && G48.score > 0 && !ask('Yeni oyun başlasın mı? Bu oyun kaydedilmez.')) return; g48New(); g2048Render(); } });

/* ===================== Mayın tarlası ===================== */
const MS_LV = { easy: [9, 9, 10, 'Kolay'], mid: [12, 12, 24, 'Orta'], hard: [16, 16, 40, 'Zor'] };
let MS = null;
function msNew(lv) { const L = MS_LV[lv]; MS = { lv, w: L[0], h: L[1], n: L[2], cells: Array(L[0] * L[1]).fill(0).map(() => ({ m: 0, o: 0, f: 0, c: 0 })), started: 0, ended: 0, dead: false, won: false, flagMode: false, first: true }; }
function msNearF(i) { const W = MS.w, H = MS.h, out = []; const x = i % W, y = Math.floor(i / W); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx); } return out; }
function msSave(now) { const snap = Object.assign({}, MS, { near: null, el: MS.started && !MS.ended ? Date.now() - MS.started : 0 }); playSave('mines', snap, now); }
function msPlace(safe) {
  const W = MS.w, H = MS.h, near = msNearF;
  MS.near = near; const ban = new Set([safe].concat(near(safe))); let k = 0;
  while (k < MS.n) { const i = rnd(W * H); if (ban.has(i) || MS.cells[i].m) continue; MS.cells[i].m = 1; k++; }
  MS.cells.forEach((c, i) => { c.c = near(i).filter(j => MS.cells[j].m).length; });
}
function msOpen(i) {
  const c = MS.cells[i]; if (c.o || c.f || MS.ended) return;
  if (MS.first) { msPlace(i); MS.first = false; MS.started = Date.now(); msTimer(); }
  if (c.m) { c.o = 1; MS.dead = true; MS.ended = Date.now(); MS.cells.forEach(x => { if (x.m) x.o = 1; }); msEnd(false); return; }
  const st = [i]; while (st.length) { const j = st.pop(); const x = MS.cells[j]; if (x.o || x.f) continue; x.o = 1; if (!x.c) MS.near(j).forEach(k => { if (!MS.cells[k].o) st.push(k); }); }
  if (MS.cells.every(x => x.m || x.o)) { MS.won = true; MS.ended = Date.now(); MS.cells.forEach(x => { if (x.m) x.f = 1; }); msEnd(true); }
}
function msEnd(won) {
  const key = 'mines.' + MS.lv; const s = gStats(key); s.played++; const secs = Math.round((MS.ended - MS.started) / 1000);
  if (won) { s.won++; s.best = s.best == null ? secs : Math.min(s.best, secs); }
  s.hist.push({ t: Date.now(), won, secs }); gStatsSave(key, s);
  toast(won ? Lx('Kazandın! ' + secs + ' sn', 'You won! ' + secs + ' s') : tr('Mayına bastın'));
  if (navigator.vibrate) navigator.vibrate(won ? [60, 60, 60] : 300);
}
let msIv = null;
function msTimer() { clearInterval(msIv); msIv = setInterval(() => { const t = $('#msTime'); if (!t || MS.ended) { clearInterval(msIv); return; } t.textContent = Math.floor((Date.now() - MS.started) / 1000); }, 500); }
function openMines() {
  const t = tdGet('mines', null);
  if (t && t.cells) { MS = t; MS.near = msNearF; if (MS.started && !MS.ended) { MS.started = Date.now() - (t.el || 0); msTimer(); } }
  if (!MS) msNew('easy');
  toolSheet(T_('Mayın tarlası'), '<div id="msWrap"></div>', () => msSave(true)); minesRender();
}
function minesRender() {
  const w = $('#msWrap'); if (!w) return; msSave(); const s = gStats('mines.' + MS.lv);
  const flags = MS.cells.filter(c => c.f).length;
  w.innerHTML = '<div class="seg tool-seg">' + Object.keys(MS_LV).map(k => '<button class="' + (MS.lv === k ? 'on' : '') + '" data-act="ms-lv" data-v="' + k + '">' + MS_LV[k][3] + '</button>').join('') + '</div>' +
    '<div class="g-top"><div class="g-score"><span>Mayın</span><b>' + (MS.n - flags) + '</b></div><div class="g-score"><span>Süre</span><b id="msTime">' + (MS.started ? Math.floor(((MS.ended || Date.now()) - MS.started) / 1000) : 0) + '</b></div>' +
    '<button class="btn ' + (MS.flagMode ? 'primary' : '') + '" data-act="ms-flag">' + icon('flag', 'sm') + ' <span>Bayrak</span></button><button class="btn" data-act="ms-new">Yeni</button></div>' +
    '<div class="ms" id="msBoard" style="grid-template-columns:repeat(' + MS.w + ',1fr)">' + MS.cells.map((c, i) => '<button class="mc ' + (c.o ? 'o ' : '') + (c.o && c.m ? 'boom ' : '') + (c.f ? 'fl ' : '') + (c.o && c.c ? 'n' + c.c : '') + '" data-act="ms-cell" data-i="' + i + '">' + (c.f && !c.o ? '⚑' : c.o ? (c.m ? '✹' : (c.c || '')) : '') + '</button>').join('') + '</div>' +
    '<p class="muted sm center">Açmak için dokun. Bayrak koymak için basılı tut ya da “Bayrak” modunu aç.</p>' +
    statsBlock('mines.' + MS.lv, [['Oyun', s.played], ['Kazanılan', s.won], ['En iyi süre', s.best == null ? '—' : s.best + ' sn']], h => '<div class="gh-row"><span>' + shortDate(h.t) + '</span><b>' + (h.won ? '✓' : '✗') + '</b><span class="muted">' + h.secs + ' sn</span></div>');
  translateTree(w); msBindLong();
}
let msLongAt = 0, msTmr = null;
function msBindLong() { /* belge düzeyinde bağlı (aşağıda) */ }
document.addEventListener('pointerdown', e => { const c = e.target.closest && e.target.closest('.ms .mc'); if (!c) return; clearTimeout(msTmr); msTmr = setTimeout(() => { msLongAt = Date.now(); msFlag(+c.dataset.i); if (navigator.vibrate) navigator.vibrate(25); }, 420); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, () => clearTimeout(msTmr), true));
document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.ms')) e.preventDefault(); });
function msFlag(i) { const c = MS.cells[i]; if (c.o || MS.ended) return; c.f = c.f ? 0 : 1; minesRender(); }
Object.assign(ACTIONS, {
  'ms-cell': el => { if (Date.now() - msLongAt < 700) return; const i = +el.dataset.i; if (MS.flagMode) msFlag(i); else { msOpen(i); minesRender(); } },
  'ms-flag': () => { MS.flagMode = !MS.flagMode; minesRender(); },
  'ms-new': () => { msNew(MS.lv); minesRender(); },
  'ms-lv': el => { msNew(el.dataset.v); minesRender(); }
});

/* ===================== Sudoku ===================== */
const SD_LV = { easy: [42, 'Kolay'], mid: [33, 'Orta'], hard: [27, 'Zor'] };
let SD = null;
const sdSnap = () => Object.assign({}, SD, { acc: SD.done ? SD.acc : SD.acc + Date.now() - SD.start });
let sdSel = -1, sdNotes = false;
function sdSolve(g, count) { // geri izleme ile çözüm sayısı (count'a ulaşınca durur)
  const rows = Array(9).fill(0), cols = Array(9).fill(0), box = Array(9).fill(0); const empty = [];
  for (let i = 0; i < 81; i++) { const v = g[i]; if (v) { const b = 1 << v, r = (i / 9) | 0, c = i % 9, x = ((r / 3) | 0) * 3 + ((c / 3) | 0); rows[r] |= b; cols[c] |= b; box[x] |= b; } else empty.push(i); }
  let n = 0;
  const rec = k => {
    if (k === empty.length) { n++; return n >= count; }
    let best = -1, bm = 0, bc = 10;
    for (let t = k; t < empty.length; t++) { const i = empty[t], r = (i / 9) | 0, c = i % 9, x = ((r / 3) | 0) * 3 + ((c / 3) | 0); const m = ~(rows[r] | cols[c] | box[x]) & 0x3FE; let cnt = 0; for (let v = 1; v <= 9; v++) if (m & (1 << v)) cnt++; if (cnt < bc) { bc = cnt; best = t; bm = m; if (cnt <= 1) break; } }
    if (bc === 0) return false;
    [empty[k], empty[best]] = [empty[best], empty[k]];
    const i = empty[k], r = (i / 9) | 0, c = i % 9, x = ((r / 3) | 0) * 3 + ((c / 3) | 0);
    const vals = []; for (let v = 1; v <= 9; v++) if (bm & (1 << v)) vals.push(v);
    if (count === 1) vals.sort(() => rnd(3) - 1);
    for (const v of vals) { const b = 1 << v; g[i] = v; rows[r] |= b; cols[c] |= b; box[x] |= b; if (rec(k + 1)) return true; rows[r] &= ~b; cols[c] &= ~b; box[x] &= ~b; g[i] = 0; }
    [empty[k], empty[best]] = [empty[best], empty[k]];
    return false;
  };
  rec(0); return n;
}
function sdNew(lv) {
  const sol = Array(81).fill(0); sdSolve(sol, 1);
  const puz = sol.slice(); const order = Array.from({ length: 81 }, (_, i) => i).sort(() => rnd(3) - 1); let givens = 81;
  for (const i of order) { if (givens <= SD_LV[lv][0]) break; const keep = puz[i]; puz[i] = 0; if (sdSolve(puz.slice(), 2) !== 1) puz[i] = keep; else givens--; }
  SD = { lv, sol, puz, cur: puz.slice(), notes: Array(81).fill(0), mist: 0, start: Date.now(), acc: 0, done: false };
  sdSel = -1; SD.start = Date.now(); playSave('sudoku', sdSnap());
}
let sdIv = null;
function openSudoku() { const t = tdGet('sudoku', null); if (t && t.sol) SD = t; if (!SD) sdNew('easy'); SD.start = Date.now(); toolSheet(T_('Sudoku'), '<div id="sdWrap"></div>', () => { if (SD) playSave('sudoku', sdSnap(), true); clearInterval(sdIv); }); sudokuRender(); clearInterval(sdIv); sdIv = setInterval(() => { const t = $('#sdTime'); if (!t) { clearInterval(sdIv); return; } if (!SD.done) t.textContent = fmtClock(SD.acc + Date.now() - SD.start); }, 1000); }
function sudokuRender() {
  const w = $('#sdWrap'); if (!w) return; const s = gStats('sudoku.' + SD.lv);
  const selV = sdSel >= 0 ? SD.cur[sdSel] : 0;
  const cell = i => {
    const v = SD.cur[i], given = SD.puz[i], r = (i / 9) | 0, c = i % 9;
    const same = sdSel >= 0 && (((sdSel / 9) | 0) === r || sdSel % 9 === c || (((sdSel / 27) | 0) === ((i / 27) | 0) && (((sdSel % 9) / 3) | 0) === ((c / 3) | 0)));
    const wrong = v && !given && v !== SD.sol[i];
    let inner = v ? v : (SD.notes[i] ? '<span class="nt">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => '<i>' + (SD.notes[i] & (1 << n) ? n : '') + '</i>').join('') + '</span>' : '');
    return '<button class="sc ' + (given ? 'g ' : '') + (i === sdSel ? 'sel ' : same ? 'hl ' : '') + (selV && v === selV ? 'same ' : '') + (wrong ? 'bad ' : '') + 'r' + r + ' c' + c + '" data-act="sd-cell" data-i="' + i + '">' + inner + '</button>';
  };
  w.innerHTML = '<div class="seg tool-seg">' + Object.keys(SD_LV).map(k => '<button class="' + (SD.lv === k ? 'on' : '') + '" data-act="sd-lv" data-v="' + k + '">' + SD_LV[k][1] + '</button>').join('') + '</div>' +
    '<div class="g-top"><div class="g-score"><span>Süre</span><b id="sdTime">' + fmtClock(SD.done ? SD.acc : SD.acc + Date.now() - SD.start) + '</b></div><div class="g-score"><span>Hata</span><b>' + SD.mist + '</b></div><button class="btn" data-act="sd-new">Yeni</button></div>' +
    '<div class="sd">' + Array.from({ length: 81 }, (_, i) => cell(i)).join('') + '</div>' +
    '<div class="sd-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => '<button class="sp" data-act="sd-num" data-n="' + n + '">' + n + '<small>' + (9 - SD.cur.filter(v => v === n).length || '') + '</small></button>').join('') + '</div>' +
    '<div class="tool-actions"><button class="btn ' + (sdNotes ? 'primary' : '') + '" data-act="sd-notes">' + icon('pen', 'sm') + ' <span>Not</span></button><button class="btn" data-act="sd-erase">Sil</button><button class="btn" data-act="sd-hint">İpucu</button></div>' +
    statsBlock('sudoku.' + SD.lv, [['Çözülen', s.won], ['En iyi süre', s.best == null ? '—' : fmtClock(s.best * 1000)], ['Oyun', s.played]], h => '<div class="gh-row"><span>' + shortDate(h.t) + '</span><b>' + fmtClock(h.secs * 1000) + '</b><span class="muted">' + h.mist + ' <span>hata</span></span></div>');
  translateTree(w);
}
function sdCheckDone() {
  if (SD.cur.every((v, i) => v === SD.sol[i])) {
    SD.done = true; SD.acc += Date.now() - SD.start; const secs = Math.round(SD.acc / 1000);
    const key = 'sudoku.' + SD.lv, s = gStats(key); s.played++; s.won++; s.best = s.best == null ? secs : Math.min(s.best, secs); s.hist.push({ t: Date.now(), secs, mist: SD.mist }); gStatsSave(key, s);
    toast(Lx('Tebrikler! ' + fmtClock(SD.acc), 'Well done! ' + fmtClock(SD.acc)));
  }
}
Object.assign(ACTIONS, {
  'sd-cell': el => { sdSel = +el.dataset.i; sudokuRender(); },
  'sd-num': el => {
    if (sdSel < 0 || SD.done || SD.puz[sdSel]) return; const n = +el.dataset.n;
    if (sdNotes) { SD.notes[sdSel] ^= (1 << n); }
    else { SD.cur[sdSel] = n; SD.notes[sdSel] = 0; if (n !== SD.sol[sdSel]) { SD.mist++; if (navigator.vibrate) navigator.vibrate(80); } sdCheckDone(); }
    playSave('sudoku', sdSnap()); sudokuRender();
  },
  'sd-erase': () => { if (sdSel < 0 || SD.puz[sdSel] || SD.done) return; SD.cur[sdSel] = 0; SD.notes[sdSel] = 0; playSave('sudoku', sdSnap()); sudokuRender(); },
  'sd-notes': () => { sdNotes = !sdNotes; sudokuRender(); },
  'sd-hint': () => { if (SD.done) return; let i = sdSel >= 0 && SD.cur[sdSel] !== SD.sol[sdSel] ? sdSel : SD.cur.findIndex((v, k) => v !== SD.sol[k]); if (i < 0) return; SD.cur[i] = SD.sol[i]; SD.notes[i] = 0; sdSel = i; sdCheckDone(); playSave('sudoku', sdSnap()); sudokuRender(); },
  'sd-new': () => { if (!SD.done && SD.cur.some((v, i) => v && !SD.puz[i]) && !ask('Yeni bulmaca başlasın mı? Bu oyun kaydedilmez.')) return; sdNew(SD.lv); sudokuRender(); },
  'sd-lv': el => { if (!SD.done && SD.cur.some((v, i) => v && !SD.puz[i]) && !ask('Zorluk değişsin mi? Bu oyun kaydedilmez.')) return; sdNew(el.dataset.v); sudokuRender(); }
});

/* ===================== Kelime oyunu (Türkçe) ve Wordle (İngilizce) ===================== */
const WD = { tr: null, en: null };
const WCFG = {
  tr: { file: 'words-tr.txt', title: 'Kelime', rows: [['e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'], ['ENTER', 'z', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç', 'DEL']], up: s => s.toLocaleUpperCase('tr-TR'), alpha: /^[abcçdefgğhıijklmnoöprsştuüvyz]$/ },
  en: { file: 'words-en.txt', title: 'Wordle', rows: [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'DEL']], up: s => s.toUpperCase(), alpha: /^[a-z]$/ }
};
let WG = { lang: 'tr', mode: 'daily' };
async function wordsLoad(lang) {
  if (WD[lang]) return WD[lang];
  const txt = await (await fetch(WCFG[lang].file)).text();
  const [a, v] = txt.split('\n'); const split = s => { const out = []; const arr = Array.from(s || ''); for (let i = 0; i + 5 <= arr.length; i += 5) out.push(arr.slice(i, i + 5).join('')); return out; };
  const answers = split(a); WD[lang] = { answers, valid: new Set(split(v).concat(answers)) }; return WD[lang];
}
const dayIndex = () => daysBetween('2026-01-01', today());
function wordFor(lang, mode) {
  const ans = WD[lang].answers; if (mode === 'daily') { let x = (dayIndex() * 2654435761) >>> 0; return ans[x % ans.length]; }
  return ans[rnd(ans.length)];
}
function wState(lang, mode) {
  let s = tdGet('word.' + lang + '.' + mode, null);
  if (mode === 'daily' && (!s || s.day !== today())) s = { day: today(), target: wordFor(lang, 'daily'), guesses: [], cur: '', done: false, won: false };
  if (mode === 'free' && !s) s = { target: wordFor(lang, 'free'), guesses: [], cur: '', done: false, won: false };
  return s;
}
function wSave(lang, mode, s) {
  const key = 'word.' + lang + '.' + mode; const prev = tdGet(key, null); // cihazlar arası eşitlenir, sadece tahmin girilince yazılır
  if (!prev || prev.day !== s.day || prev.target !== s.target || prev.guesses.length !== s.guesses.length) tdSet(key, Object.assign({}, s, { cur: '' }));
}
function wScore(guess, target) {
  const g = Array.from(guess), t = Array.from(target), res = Array(5).fill('b'), left = {};
  for (let i = 0; i < 5; i++) { if (g[i] === t[i]) res[i] = 'g'; else left[t[i]] = (left[t[i]] || 0) + 1; }
  for (let i = 0; i < 5; i++) { if (res[i] !== 'g' && left[g[i]]) { res[i] = 'y'; left[g[i]]--; } }
  return res;
}
async function openWord(lang) {
  WG.lang = lang; toolSheet(WCFG[lang].title, '<div id="wdWrap"><div class="empty">' + tr('Kelimeler yükleniyor…') + '</div></div>');
  try { await wordsLoad(lang); } catch (e) { const w = $('#wdWrap'); if (w) w.innerHTML = '<div class="empty">' + tr('Kelime listesi yüklenemedi.') + '</div>'; return; }
  WG.s = wState(lang, WG.mode); wordRender();
}
function wordRender() {
  const w = $('#wdWrap'); if (!w || !WD[WG.lang]) return; const C = WCFG[WG.lang]; const s = WG.s = WG.s || wState(WG.lang, WG.mode);
  const key = 'word' + WG.lang + '.' + WG.mode; const st = gStats(key, { played: 0, won: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0, 0], hist: [] });
  const letterState = {}; s.guesses.forEach(g => wScore(g, s.target).forEach((r, i) => { const L = Array.from(g)[i]; const p = letterState[L]; if (r === 'g' || (r === 'y' && p !== 'g') || (!p)) letterState[L] = r === 'b' && p ? p : r; }));
  let rows = '';
  for (let r = 0; r < 6; r++) {
    const g = s.guesses[r]; const sc = g ? wScore(g, s.target) : null; const letters = g ? Array.from(g) : (r === s.guesses.length ? Array.from(s.cur) : []);
    rows += '<div class="wr ' + (r === s.guesses.length && !s.done ? 'cur' : '') + '">' + [0, 1, 2, 3, 4].map(i => '<div class="wt ' + (sc ? sc[i] : letters[i] ? 'f' : '') + '">' + (letters[i] ? C.up(letters[i]) : '') + '</div>').join('') + '</div>';
  }
  const kb = C.rows.map(row => '<div class="kr">' + row.map(k => '<button class="kk ' + (k.length > 1 ? 'wide ' : '') + (letterState[k] || '') + '" data-act="wd-key" data-k="' + k + '">' + (k === 'ENTER' ? tr('Gir') : k === 'DEL' ? '⌫' : C.up(k)) + '</button>').join('') + '</div>').join('');
  const max = Math.max(1, ...st.dist);
  w.innerHTML = '<div class="seg tool-seg"><button class="' + (WG.mode === 'daily' ? 'on' : '') + '" data-act="wd-mode" data-v="daily">Günün kelimesi</button><button class="' + (WG.mode === 'free' ? 'on' : '') + '" data-act="wd-mode" data-v="free">Serbest</button></div>' +
    '<div class="wgrid" id="wGrid">' + rows + '</div>' +
    (s.done ? '<div class="w-end">' + (s.won ? tr('Bildin!') : Lx('Kelime: ', 'Word: ')) + ' <b>' + C.up(s.target) + '</b>' + (WG.mode === 'free' ? ' <button class="btn" data-act="wd-next">' + tr('Yeni kelime') + '</button>' : '<span class="muted sm"> · ' + tr('Yarın yeni kelime') + '</span>') + '</div>' : '') +
    '<div class="wkb">' + kb + '</div>' +
    '<div class="g-stats"><div class="g-stat-row"><div><b>' + st.played + '</b><span>Oyun</span></div><div><b>' + (st.played ? Math.round(st.won / st.played * 100) : 0) + '%</b><span>Kazanma</span></div>' + (WG.mode === 'daily' ? '<div><b>' + st.streak + '</b><span>Seri</span></div><div><b>' + st.maxStreak + '</b><span>En uzun</span></div>' : '') + '</div>' +
    '<div class="w-dist">' + st.dist.map((n, i) => '<div><span>' + (i + 1) + '</span><i style="width:' + Math.max(6, n / max * 100) + '%">' + n + '</i></div>').join('') + '</div>' +
    (st.hist.length ? '<details class="g-hist"><summary>Geçmiş</summary><div>' + st.hist.slice().reverse().slice(0, 15).map(h => '<div class="gh-row"><span>' + shortDate(h.t) + '</span><b class="u">' + C.up(h.w) + '</b><span class="muted">' + (h.won ? h.n + '/6' : '✗') + '</span></div>').join('') + '</div></details>' : '') +
    '<button class="link danger" data-act="g-clear" data-k="' + 'word' + WG.lang + '">Geçmişi ve istatistikleri sil</button></div>';
  translateTree(w);
}
function wordKey(k) {
  const s = WG.s; if (!s || s.done) return; const C = WCFG[WG.lang]; const cur = Array.from(s.cur);
  if (k === 'DEL') { cur.pop(); s.cur = cur.join(''); }
  else if (k === 'ENTER') {
    if (cur.length < 5) { wShake(); return toast(tr('5 harf gerekli')); }
    if (!WD[WG.lang].valid.has(s.cur)) { wShake(); return toast(tr('Listede yok')); }
    s.guesses.push(s.cur); s.cur = '';
    const won = s.guesses[s.guesses.length - 1] === s.target;
    if (won || s.guesses.length >= 6) {
      s.done = true; s.won = won;
      const key = 'word' + WG.lang + '.' + WG.mode; const st = gStats(key, { played: 0, won: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0, 0], hist: [] });
      st.played++; if (won) { st.won++; st.dist[s.guesses.length - 1]++; }
      if (WG.mode === 'daily') { const yest = addDays(today(), -1); st.streak = won ? (st.lastWin === yest ? st.streak + 1 : 1) : 0; if (won) st.lastWin = today(); st.maxStreak = Math.max(st.maxStreak || 0, st.streak); }
      st.hist.push({ t: Date.now(), w: s.target, won, n: s.guesses.length }); gStatsSave(key, st);
      if (navigator.vibrate) navigator.vibrate(won ? [50, 50, 50] : 200);
    }
  } else if (C.alpha.test(k) && cur.length < 5) { cur.push(k); s.cur = cur.join(''); }
  wSave(WG.lang, WG.mode, s); wordRender();
}
function wShake() { const r = $('#wGrid .wr.cur'); if (r) { r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); } if (navigator.vibrate) navigator.vibrate(60); }
Object.assign(ACTIONS, {
  'wd-key': el => wordKey(el.dataset.k),
  'wd-mode': el => { WG.mode = el.dataset.v; WG.s = wState(WG.lang, WG.mode); wordRender(); },
  'wd-next': () => { WG.s = { target: wordFor(WG.lang, 'free'), guesses: [], cur: '', done: false, won: false }; wSave(WG.lang, 'free', WG.s); wordRender(); }
});
document.addEventListener('keydown', e => {
  if (!$('#wdWrap') || !WG.s || e.ctrlKey || e.metaKey || e.altKey) return; if (e.target && /input|textarea/i.test(e.target.tagName)) return;
  if (e.key === 'Enter') { e.preventDefault(); wordKey('ENTER'); } else if (e.key === 'Backspace') { e.preventDefault(); wordKey('DEL'); }
  else { const k = WG.lang === 'tr' ? e.key.toLocaleLowerCase('tr-TR') : e.key.toLowerCase(); if (k.length === 1 && WCFG[WG.lang].alpha.test(k)) wordKey(k); }
});
