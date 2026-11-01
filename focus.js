'use strict';
/* PUSULA 1.16 — Odak sayacı: yöntemler (Pomodoro, Akış, 52/17, 90 dk, Özel), göreve bağlı süre, tek iş modu, istatistik,
   mola içerikleri (nefes, göz, esneme, su, not), arka plan sesi ve uygulama kapalıyken Google Takvim üzerinden bildirim.
   tools.js'teki openPomo / pmTick / pomoRender ve pm-* eylemlerini ezer. */

const FC_METHODS = {
  pomo: ['Pomodoro', '25 dk odak, 5 dk mola; 4 turda bir uzun mola'],
  flow: ['Akış', 'Süre yok; ne zaman durursan mola, çalıştığının 1/5’i'],
  m5217: ['52/17', '52 dk odak, 17 dk mola'],
  deep: ['90 dk derin', '90 dk tek blok, 20 dk mola'],
  custom: ['Özel', 'Süreleri sen belirle']
};
const FC_BREAKS = {
  breath: ['Nefes egzersizi', 'Kutu nefes: 4 al, 4 tut, 4 ver, 4 tut'],
  eye: ['Göz molası', '20 saniye uzağa bak (20-20-20)'],
  stretch: ['Esneme hareketi', 'Her molada kısa bir hareket önerisi'],
  water: ['Su ve yürüyüş', 'Su iç, kalk biraz yürü; “su” alışkanlığına işaret koyar'],
  note: ['Mola notu', 'Tur bitince “Ne yaptın?” diye tek satır sorar']
};
const FC_SOUNDS = { off: 'Kapalı', white: 'Beyaz gürültü', pink: 'Pembe gürültü', brown: 'Kahverengi gürültü', rain: 'Yağmur' };
const FC_STRETCH = ['Boynunu yavaşça sağa, sola eğ; her yanda 10 saniye bekle.', 'Omuzlarını 10 kez geriye doğru çevir.', 'Ellerini kenetle, kollarını öne uzat, sırtını yuvarla.', 'Ayağa kalk, ellerini yukarı uzatıp parmak uçlarında 10 saniye uzan.', 'Bileklerini her iki yöne 10’ar kez çevir.', 'Ellerini belinde tut, gövdeni sağa sola yavaşça çevir.', 'Bir kolunu göğsünün önünden çek, diğer elinle 15 saniye tut; sonra diğer kol.', 'Oturduğun yerde dizini göğsüne çek, 10 saniye tut.', 'Gözlerini kapat, omuzlarını kulaklarına doğru kaldır, 5 saniye tut ve bırak.', 'Duvara dayan, baldırlarını esnet; her bacak 15 saniye.', 'Çeneni göğsüne yaklaştır, ensendeki gerilmeyi 10 saniye hisset.', 'Parmaklarını aç-kapa yap, 20 kez.'];
const FC_DEF = { method: 'pomo', pomo: { work: 25, short: 5, long: 15, every: 4 }, custom: { work: 40, brk: 10 }, flowRatio: 5, breaks: { breath: true, eye: true, stretch: true, water: true, note: true }, sound: 'off', soundBreak: false, calNotify: true, goal: 0 };
function fcCfg() { const c = tdGet('pomoCfg', {}) || {}; const o = Object.assign({}, FC_DEF, c); o.pomo = Object.assign({}, FC_DEF.pomo, c.pomo || (c.work ? { work: c.work, short: c.short, long: c.long, every: c.every } : {})); o.custom = Object.assign({}, FC_DEF.custom, c.custom); o.breaks = Object.assign({}, FC_DEF.breaks, c.breaks); return o; }
let fcCfgT = null;
function fcCfgSave(c) { clearTimeout(fcCfgT); fcCfgT = setTimeout(() => tdSet('pomoCfg', c), 400); }

/* ----- durum (çalışan sayaç cihazda kalır; istatistik eşitlenir) ----- */
const FC = Object.assign({ phase: 'work', run: false, end: 0, left: 0, segStart: 0, workMs: 0, round: 0, task: '', gev: null, sub: 'timer', solo: false, askNote: false, stretch: 0, eyeEnd: 0 }, lsj('pusula.fc', {}));
FC.sub = 'timer'; FC.askNote = false;
try { Object.defineProperty(PM, 'run', { get: () => FC.run, set: () => {}, configurable: true }); } catch (e) { /* yok */ } // tools.js döngüsü PM.run'a bakar
const fcSave = () => lsjw('pusula.fc', { phase: FC.phase, run: FC.run, end: FC.end, left: FC.left, segStart: FC.segStart, workMs: FC.workMs, loggedMs: FC.loggedMs || 0, round: FC.round, task: FC.task, gev: FC.gev, brkMin: FC.brkMin });
const fcFlow = () => fcCfg().method === 'flow';
function fcDur(ph) {
  const c = fcCfg(), m = c.method;
  if (m === 'flow') return ph === 'work' ? 0 : Math.max(1, FC.brkMin || 5) * 60000;
  if (m === 'm5217') return (ph === 'work' ? 52 : 17) * 60000;
  if (m === 'deep') return (ph === 'work' ? 90 : 20) * 60000;
  if (m === 'custom') return (ph === 'work' ? c.custom.work : c.custom.brk) * 60000;
  return (ph === 'work' ? c.pomo.work : ph === 'long' ? c.pomo.long : c.pomo.short) * 60000;
}
const fcWorkNow = () => FC.workMs + (FC.run && FC.phase === 'work' && FC.segStart ? Date.now() - FC.segStart : 0);
const fcIsUp = () => FC.phase === 'work' && fcFlow(); // yukarı sayan akış modu
if (!FC.left && !fcIsUp()) FC.left = fcDur(FC.phase);

/* ----- kayıt: focusLog[gün] = { m: dakika, n: tur, t: {görev: dk}, h: {saat: dk}, notes: [] } ----- */
function fcLog(ms, partial) { // partial: tur bitmeden yazılan parça (tur sayılmaz)
  const min = Math.round(ms / 60000); if (min < 1) return 0;
  const d = today(), L = tdGet('focusLog', {}); const x = L[d] || (L[d] = { m: 0, n: 0, t: {}, h: {}, notes: [] });
  x.m += min; if (!partial) x.n++; const h = new Date().getHours(); x.h[h] = (x.h[h] || 0) + min;
  if (FC.task) { x.t[FC.task] = (x.t[FC.task] || 0) + min; const t = S.items.get(FC.task); if (t && !t.deleted) { t.focusMin = (t.focusMin || 0) + min; save(t, { silent: true }); } }
  Object.keys(L).sort().slice(0, -400).forEach(k => delete L[k]); tdSet('focusLog', L);
  if (!partial) { const old = tdGet('pomoLog', {}); old[d] = (old[d] || 0) + 1; tdSet('pomoLog', old); }
  return min;
}
function fcAddNote(text) { const d = today(), L = tdGet('focusLog', {}); const x = L[d] || (L[d] = { m: 0, n: 0, t: {}, h: {}, notes: [] }); x.notes = (x.notes || []).concat([{ at: Date.now(), text, task: FC.task || '' }]); tdSet('focusLog', L); }
const fcDayMin = d => ((tdGet('focusLog', {})[d] || {}).m || 0);
const fmtMin = m => m >= 60 ? Lx(Math.floor(m / 60) + ' sa' + (m % 60 ? ' ' + m % 60 + ' dk' : ''), Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + m % 60 + ' min' : '')) : Lx(m + ' dk', m + ' min');

/* ----- akış: faz geçişleri ----- */
function fcStart() {
  unlockAudio(); FC.run = true;
  if (FC.phase === 'work') FC.segStart = Date.now();
  if (!fcIsUp()) FC.end = Date.now() + FC.left;
  keepAwake(true); tmStartLoop(); fcSound(); fcCalSchedule(); fcSave();
}
function fcPause() {
  if (FC.phase === 'work' && FC.segStart) { FC.workMs += Date.now() - FC.segStart; FC.segStart = 0; }
  if (!fcIsUp()) FC.left = Math.max(0, FC.end - Date.now());
  FC.run = false; keepAwake(TM.t.run); fcSound(); fcCalClear(); fcSave();
}
function fcEndWork(natural) { // odak turu bitti (süre doldu, atlandı ya da akışta “Mola ver”)
  if (FC.segStart) { FC.workMs += Date.now() - FC.segStart; FC.segStart = 0; }
  const done = FC.loggedMs || 0; // bu turda “Görev bitti” ile önceden yazılan süre
  const ms = natural && !fcFlow() ? Math.max(FC.workMs, fcDur('work') - done) : FC.workMs; // süre dolduysa turun kalanı
  const min = fcLog(ms) + Math.round(done / 60000); FC.workMs = 0; FC.loggedMs = 0;
  const c = fcCfg(); FC.round++;
  if (c.method === 'flow') FC.brkMin = Math.max(1, Math.round(min / Math.max(1, c.flowRatio)));
  FC.phase = c.method === 'pomo' && FC.round % (c.pomo.every || 4) === 0 ? 'long' : 'short';
  FC.left = fcDur(FC.phase); FC.stretch = Math.floor(Math.random() * FC_STRETCH.length);
  FC.askNote = !!(c.breaks.note && min >= 1);
  return min;
}
function fcEndBreak() { FC.phase = 'work'; FC.workMs = 0; FC.loggedMs = 0; FC.left = fcDur('work'); FC.askNote = false; }
function pmTick() { // tools.js döngüsü çağırır
  if (!FC.run) return;
  if (!fcIsUp()) {
    FC.left = FC.end - Date.now();
    if (FC.left <= 0) {
      const wasWork = FC.phase === 'work';
      fcCalClear(true);
      beep(4, wasWork ? 660 : 990);
      if (wasWork) { const m = fcEndWork(true); fcNotify(Lx('Odak tamam' + (m ? ' · ' + fmtMin(m) : ''), 'Focus done') , Lx('Mola zamanı', 'Time for a break')); }
      else { fcEndBreak(); fcNotify(Lx('Mola bitti', 'Break over'), Lx('Odaklanma zamanı', 'Time to focus')); }
      FC.run = false; fcStart(); // sıradaki faz kendiliğinden başlar
      pomoRender(); return;
    }
  }
  fcPaint();
}
function fcPaint() {
  const up = fcIsUp(); const ms = up ? fcWorkNow() : FC.left; const dur = up ? 0 : fcDur(FC.phase);
  const c = $('#pmClock'); if (c) c.innerHTML = fmtClock(ms);
  const r = $('#pmRing'); if (r) r.style.setProperty('--p', up ? ((ms / 60000) % 60 / 60 * 100) + '%' : (100 - FC.left / dur * 100) + '%');
  const e = $('#fcEye'); if (e && FC.eyeEnd) { const s = Math.ceil((FC.eyeEnd - Date.now()) / 1000); e.textContent = s > 0 ? s + ' sn' : tr('Tamam, gözlerin dinlendi'); if (s <= 0) { FC.eyeEnd = 0; beep(1, 990); } }
}
function fcNotify(title, body) {
  toast(title + ' · ' + body);
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(reg => reg && reg.showNotification('PUSULA · ' + title, { body, tag: 'pusula-focus', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', renotify: true })).catch(() => {});
}
/* Uygulama kapalıyken: fazın bitiş anına Google Takvim'de hatırlatmalı kısa bir etkinlik. Faz uygulamada biterse silinir. */
function fcCalOk() { const c = fcCfg(); return c.calNotify && typeof Cal !== 'undefined' && Cal.on(); }
function fcCalSchedule() {
  if (!fcCalOk() || fcIsUp() || !FC.run) return; const end = FC.end;
  (async () => {
    try {
      await fcCalDel(); if (!Cal.ready() || !Cal.cfg.def || !FC.run || FC.end !== end) return;
      const at = new Date(Math.round(end / 60000) * 60000), to = new Date(at.getTime() + 5 * 60000);
      const hm = x => pad(x.getHours()) + ':' + pad(x.getMinutes());
      const ev = { title: FC.phase === 'work' ? '⏱ ' + tr('Odak süresi bitti') : '☕ ' + tr('Mola bitti'), date: ymd(at), allDay: false, start: hm(at), end: to.getDate() === at.getDate() ? hm(to) : '23:59', notes: 'PUSULA odak sayacı', remind: [0] };
      const r = await Cal.insert(Cal.cfg.def, ev); if (!FC.run || FC.end !== end) { Cal.del(Cal.cfg.def, r.id).catch(() => {}); return; } FC.gev = { id: r.id, cal: Cal.cfg.def, at: end }; fcSave(); // bu arada duraklatıldıysa sil
    } catch (e) { console.warn(e); }
  })();
}
async function fcCalDel() { const g = FC.gev; if (!g || !g.id) return; FC.gev = null; fcSave(); try { if (Cal.ready()) await Cal.del(g.cal, g.id); else FC.gev = g; } catch (e) { /* sonra */ } }
function fcCalClear() { if (FC.gev) fcCalDel(); }

/* ----- arka plan sesi (Web Audio ile üretilir, internetsiz) ----- */
let fcNoise = null;
function fcSound() {
  const c = fcCfg(); const want = FC.run && c.sound !== 'off' && (FC.phase === 'work' || c.soundBreak) && $('#pmWrap');
  if (!want) { if (fcNoise) { try { fcNoise.src.stop(); fcNoise.g.disconnect(); } catch (e) { /* yok */ } fcNoise = null; } return; }
  if (fcNoise && fcNoise.kind === c.sound) return; if (fcNoise) { try { fcNoise.src.stop(); } catch (e) { /* yok */ } fcNoise = null; }
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const len = AC.sampleRate * 4, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (c.sound === 'white') d[i] = w * 0.25;
      else if (c.sound === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.0555) * 0.9; }
      else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    }
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true; const g = AC.createGain(); g.gain.value = 0.0001;
    let node = src;
    if (c.sound === 'rain') { const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.5; src.disconnect(); src.connect(f); node = f; }
    node.connect(g); g.connect(AC.destination); src.start(); g.gain.exponentialRampToValueAtTime(c.sound === 'rain' ? 0.5 : 0.35, AC.currentTime + 1.2);
    fcNoise = { src, g, kind: c.sound };
  } catch (e) { /* ses yok */ }
}

/* ----- görünüm ----- */
function openPomo() {
  fcRestore(); FC.sub = 'timer';
  if (!FC.run && !fcIsUp()) { const d = fcDur(FC.phase); if ((FC.phase === 'work' && !FC.workMs) || !FC.left || FC.left > d) FC.left = d; } // ayarlar sonradan yüklendiyse süreyi tazele
  toolSheet(T_('Odak sayacı'), '<div id="pmWrap"></div>', () => { FC.solo = false; setTimeout(fcSound, 0); });
  pomoRender(); fcSound();
}
function fcRestore() { // uygulama kapalıyken faz bittiyse
  if (!FC.run || fcIsUp() || FC.end > Date.now()) return;
  const wasWork = FC.phase === 'work';
  if (wasWork) { const m = fcEndWork(true); toast(Lx('Sen yokken odak turu bitti' + (m ? ' (' + fmtMin(m) + ')' : '') + '; mola hazır', 'Focus round finished while away; break ready')); }
  else { fcEndBreak(); toast(Lx('Sen yokken mola bitti', 'Break ended while away')); }
  FC.run = false; FC.askNote = false; fcCalClear(); fcSave();
}
function pomoRender() {
  const w = $('#pmWrap'); if (!w) return;
  const subs = '<div class="seg tool-seg">' + [['timer', 'Sayaç'], ['stats', 'İstatistik'], ['set', 'Ayarlar']].map(x => '<button class="' + (FC.sub === x[0] ? 'on' : '') + '" data-act="fc-sub" data-k="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
  w.className = FC.solo && FC.sub === 'timer' ? 'fc-solo' : '';
  w.innerHTML = (FC.solo && FC.sub === 'timer' ? '' : subs) + (FC.sub === 'stats' ? fcStatsHtml() : FC.sub === 'set' ? fcSetHtml() : fcTimerHtml());
  translateTree(w); fcPaint();
}
function fcTimerHtml() {
  const c = fcCfg(), up = fcIsUp(), brk = FC.phase !== 'work';
  const tasks = list('task').filter(t => !t.done).sort(taskSort).slice(0, 40); const task = FC.task && S.items.get(FC.task);
  const label = FC.phase === 'work' ? 'Odak' : FC.phase === 'long' ? 'Uzun mola' : 'Mola';
  const ring = '<div class="pm-ring ' + (brk ? 'short' : 'work') + (up ? ' up' : '') + '" id="pmRing"><div><div class="pm-phase">' + label + '</div><div class="big-clock" id="pmClock"></div><div class="muted sm">' + (up ? tr('yukarı sayıyor') : '<span>Bugün</span> ' + fmtMin(fcDayMin(today()))) + '</div></div></div>';
  if (FC.solo) {
    return '<div class="fc-solo-task u">' + esc(task ? task.title : tr('Odak')) + '</div>' + ring +
      '<div class="tool-actions">' + (up ? '<button class="btn primary" data-act="fc-flowbreak">' + tr('Mola ver') + '</button>' : '<button class="btn primary" data-act="pm-toggle">' + (FC.run ? 'Duraklat' : 'Başlat') + '</button>') + (task ? '<button class="btn" data-act="fc-taskdone">' + icon('check', 'sm') + ' <span>' + tr('Görev bitti') + '</span></button>' : '') + '</div>' +
      '<button class="link fc-solo-exit" data-act="fc-solo">' + tr('Tek iş modundan çık') + '</button>' + (brk ? fcBreakHtml() : '') + (FC.askNote ? fcNoteHtml() : '');
  }
  const meth = '<div class="chips fc-meth">' + Object.keys(FC_METHODS).map(k => '<button class="chip sm ' + (c.method === k ? 'on' : '') + '" data-act="fc-method" data-k="' + k + '">' + FC_METHODS[k][0] + '</button>').join('') + '</div><p class="muted sm fc-mdesc">' + (c.method === 'pomo' ? Lx(c.pomo.work + ' dk odak, ' + c.pomo.short + ' dk mola; ' + c.pomo.every + ' turda bir ' + c.pomo.long + ' dk uzun mola', c.pomo.work + ' min focus, ' + c.pomo.short + ' min break; ' + c.pomo.long + ' min long break every ' + c.pomo.every) : c.method === 'custom' ? Lx(c.custom.work + ' dk odak, ' + c.custom.brk + ' dk mola', c.custom.work + ' min focus, ' + c.custom.brk + ' min break') : c.method === 'flow' ? Lx('Süre yok; ne zaman durursan mola, çalıştığının 1/' + c.flowRatio + '’i', 'No timer; break is 1/' + c.flowRatio + ' of your work') : tr(FC_METHODS[c.method][1])) + '</p>';
  const acts = '<div class="tool-actions">' + (up ? (FC.run ? '<button class="btn primary" data-act="fc-flowbreak">' + tr('Mola ver') + '</button><button class="btn" data-act="pm-toggle">Duraklat</button>' : '<button class="btn primary" data-act="pm-toggle">Başlat</button>' + (FC.workMs ? '<button class="btn" data-act="fc-flowbreak">' + tr('Mola ver') + '</button>' : ''))
    : '<button class="btn primary" data-act="pm-toggle">' + (FC.run ? 'Duraklat' : 'Başlat') + '</button><button class="btn" data-act="pm-skip">Atla</button>') + '<button class="btn" data-act="pm-reset">Sıfırla</button></div>';
  const calHint = fcCalOk() ? (Cal.ready() ? '<p class="muted sm fc-cal">' + icon('event', 'xs') + ' ' + tr('Uygulamayı kapatsan da süre bitince Google Takvim bildirimi gelir.') + '</p>' : '<p class="muted sm fc-cal">' + tr('Kapalıyken bildirim için Google oturumunu yenile:') + ' <button class="link" data-act="sync-now">' + tr('Yenile') + '</button></p>') : '';
  return meth + ring + acts + calHint + (FC.askNote ? fcNoteHtml() : '') + (brk ? fcBreakHtml() : '') +
    (tasks.length ? '<label class="field"><span>Neye odaklanıyorsun? (isteğe bağlı)</span><select class="input" id="pmTask"><option value="">—</option>' + tasks.map(t => '<option value="' + t.id + '" ' + (FC.task === t.id ? 'selected' : '') + '>' + esc(t.title) + (t.focusMin ? ' · ' + fmtMin(t.focusMin) : '') + '</option>').join('') + '</select></label>' : '') +
    '<button class="btn block" data-act="fc-solo">' + icon('goal', 'sm') + ' <span>' + tr('Tek iş modu') + '</span></button>';
}
function fcNoteHtml() { return '<form class="quick-add fc-note" id="fcNote"><input class="input" name="q" placeholder="' + esc(tr('Bu turda ne yaptın? (isteğe bağlı)')) + '" autocomplete="off" enterkeyhint="done"><button class="icon-btn" type="submit" aria-label="Kaydet">' + icon('check') + '</button><button class="icon-btn" type="button" data-act="fc-note-skip" aria-label="Geç">' + icon('x', 'sm') + '</button></form>'; }
function fcBreakHtml() {
  const b = fcCfg().breaks; let h = '';
  if (b.breath) h += '<div class="fc-card"><div class="fc-card-t">' + icon('habit', 'sm') + ' <span>Nefes</span></div><div class="fc-breath"><div class="fc-bcircle"></div><div class="fc-btext"><span>Al</span><span>Tut</span><span>Ver</span><span>Tut</span></div></div></div>';
  if (b.eye) h += '<div class="fc-card"><div class="fc-card-t">' + icon('search', 'sm') + ' <span>Göz molası</span></div><p class="sm">' + tr('Ekrandan kalk, en az 6 metre uzaktaki bir noktaya 20 saniye bak.') + '</p>' + (FC.eyeEnd ? '<b id="fcEye" class="fc-eye"></b>' : '<button class="btn" data-act="fc-eye">' + tr('20 saniye başlat') + '</button>') + '</div>';
  if (b.stretch) h += '<div class="fc-card"><div class="fc-card-t">' + icon('repeat', 'sm') + ' <span>Esneme</span></div><p class="sm">' + tr(FC_STRETCH[FC.stretch % FC_STRETCH.length]) + '</p><button class="link" data-act="fc-stretch">' + tr('Başka hareket') + '</button></div>';
  if (b.water) { const hb = fcWaterHabit(); const done = hb && (hb.log || {})[today()]; h += '<div class="fc-card"><div class="fc-card-t">' + icon('habit', 'sm') + ' <span>Su ve yürüyüş</span></div><p class="sm">' + tr('Bir bardak su iç, kalk birkaç dakika yürü.') + '</p>' + (hb ? (done ? '<span class="badge-s ok">' + esc(hb.title) + ' ✓</span>' : '<button class="btn" data-act="fc-water">' + icon('check', 'sm') + ' <span class="u">' + esc(hb.title) + '</span></button>') : '') + '</div>'; }
  return h ? '<div class="fc-breaks">' + h + '</div>' : '';
}
const fcWaterHabit = () => list('habit').find(h => /(^|\s)su(\s|$)|water/i.test(lower(h.title)));
function fcStatsHtml() {
  const L = tdGet('focusLog', {}), old = tdGet('pomoLog', {}), t0 = today(), c = fcCfg();
  const dm = d => (L[d] || {}).m || 0;
  const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(t0, -i));
  const wk = days.reduce((a, d) => a + dm(d), 0), mx = Math.max(30, ...days.map(dm));
  let h = '<div class="m-tiles"><div class="m-tile"><span>' + tr('Bugün') + '</span><b>' + fmtMin(dm(t0)) + '</b></div><div class="m-tile"><span>' + tr('Son 7 gün') + '</span><b>' + fmtMin(wk) + '</b></div><div class="m-tile"><span>' + tr('Tur (bugün)') + '</span><b>' + Math.max((L[t0] || {}).n || 0, old[t0] || 0) + '</b></div></div>';
  if (c.goal) { const p = Math.min(100, Math.round(wk / (c.goal * 60) * 100)); h += '<div class="card fc-goal"><div class="m-bar-top"><span>' + Lx('Haftalık hedef ' + c.goal + ' sa', 'Weekly goal ' + c.goal + ' h') + '</span><b>%' + p + '</b></div><div class="m-bar-track"><i style="width:' + p + '%;background:var(--accent)"></i></div></div>'; }
  h += '<div class="section-title"><span>' + tr('Son 7 gün') + '</span></div><div class="card fc-week">' + days.map(d => '<div class="fc-col"><i style="height:' + Math.round(dm(d) / mx * 100) + '%"></i><b>' + (dm(d) ? Math.round(dm(d)) : '') + '</b><span>' + DAYS[dow(d)] + '</span></div>').join('') + '</div>';
  const byT = {}; days.forEach(d => Object.entries((L[d] || {}).t || {}).forEach(([k, v]) => { byT[k] = (byT[k] || 0) + v; }));
  const top = Object.keys(byT).sort((a, b) => byT[b] - byT[a]).slice(0, 6);
  if (top.length) h += '<div class="section-title"><span>' + tr('En çok odaklandığın işler') + '</span></div><div class="card">' + top.map(k => '<div class="row"><div class="row-main"><div class="row-title u">' + esc((S.items.get(k) || {}).title || tr('(silinmiş görev)')) + '</div></div><b>' + fmtMin(byT[k]) + '</b></div>').join('') + '</div>';
  const hrs = new Array(24).fill(0); for (let i = 0; i < 30; i++) Object.entries((L[addDays(t0, -i)] || {}).h || {}).forEach(([k, v]) => { hrs[+k] += v; });
  const hm = Math.max(...hrs);
  if (hm) { const best = hrs.indexOf(hm); h += '<div class="section-title"><span>' + tr('Verimli saatlerin (30 gün)') + '</span><span class="muted sm">' + Lx('en iyi: ' + pad(best) + ':00', 'best: ' + pad(best) + ':00') + '</span></div><div class="card fc-hours">' + hrs.map((v, i) => '<i title="' + pad(i) + ':00" style="height:' + Math.max(4, Math.round(v / hm * 100)) + '%;opacity:' + (v ? 1 : .25) + '"></i>').join('') + '<div class="fc-hlab"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>'; }
  const notes = (L[t0] || {}).notes || [];
  if (notes.length) h += '<div class="section-title"><span>' + tr('Bugün ne yaptın') + '</span></div><div class="card">' + notes.slice().reverse().map(n => '<div class="row"><div class="row-main"><div class="row-title u">' + esc(n.text) + '</div><div class="row-meta">' + new Date(n.at).toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' }) + (n.task && S.items.get(n.task) ? ' · <span class="u">' + esc(S.items.get(n.task).title) + '</span>' : '') + '</div></div></div>').join('') + '</div>';
  if (!wk && !notes.length) h += '<div class="card"><div class="empty">' + tr('İlk odak turunu bitirince burada istatistiklerin görünür.') + '</div></div>';
  return h;
}
function fcSetHtml() {
  const c = fcCfg(); const num = (id, v, lbl) => '<label><input class="input" type="number" min="1" id="' + id + '" value="' + v + '"><small>' + lbl + '</small></label>';
  const sw = (k, on, t, d) => '<div class="set-row"><div class="grow"><div>' + t + '</div>' + (d ? '<div class="sub">' + d + '</div>' : '') + '</div><button type="button" class="switch ' + (on ? 'on' : '') + '" data-act="fc-sw" data-k="' + k + '" aria-label="Aç/kapat"></button></div>';
  return '<div class="set-sub">Pomodoro</div><div class="pm-cfg">' + num('pmW', c.pomo.work, 'Odak') + num('pmS', c.pomo.short, 'Kısa mola') + num('pmL', c.pomo.long, 'Uzun mola') + num('pmE', c.pomo.every, 'Uzun mola her') + '</div>' +
    '<div class="set-sub">Özel</div><div class="pm-cfg two">' + num('fcCW', c.custom.work, 'Odak (dk)') + num('fcCB', c.custom.brk, 'Mola (dk)') + '</div>' +
    '<div class="set-sub">Akış</div><div class="pm-cfg two">' + num('fcFR', c.flowRatio, 'Mola = çalışma ÷') + num('fcGoal', c.goal || '', 'Haftalık hedef (saat)') + '</div>' +
    '<div class="set-sub">' + tr('Mola içerikleri') + '</div><div class="set-group">' + Object.keys(FC_BREAKS).map(k => sw('b:' + k, c.breaks[k], FC_BREAKS[k][0], FC_BREAKS[k][1])).join('') + '</div>' +
    '<div class="set-sub">' + tr('Arka plan sesi') + '</div><div class="chips">' + Object.keys(FC_SOUNDS).map(k => '<button class="chip sm ' + (c.sound === k ? 'on' : '') + '" data-act="fc-snd" data-k="' + k + '">' + FC_SOUNDS[k] + '</button>').join('') + '</div>' +
    '<div class="set-group" style="margin-top:8px">' + sw('soundBreak', c.soundBreak, tr('Molada da çalsın'), '') + sw('calNotify', c.calNotify, tr('Kapalıyken bildir'), tr('Google Takvim bağlıysa süre bitiminde kısa bir etkinlik açılır, telefonun bildirir; uygulamada biterse silinir.')) + '</div>';
}

/* ----- olaylar ----- */
Object.assign(ACTIONS, {
  'pm-toggle': () => { if (FC.run) fcPause(); else fcStart(); pomoRender(); },
  'pm-skip': () => { const run = FC.run; if (run) fcPause(); fcCalClear(); if (FC.phase === 'work') fcEndWork(false); else fcEndBreak(); if (run) fcStart(); else fcSave(); pomoRender(); },
  'pm-reset': () => { if (FC.run) fcPause(); if (FC.phase === 'work' && FC.workMs >= 60000) toast(Lx(fmtMin(fcLog(FC.workMs)) + ' kaydedildi', fmtMin(Math.round(FC.workMs / 60000)) + ' logged')); FC.phase = 'work'; FC.round = 0; FC.workMs = 0; FC.loggedMs = 0; FC.askNote = false; FC.left = fcDur('work'); fcCalClear(); fcSave(); pomoRender(); },
  'fc-flowbreak': () => { const run = FC.run; if (run) fcPause(); const m = fcEndWork(false); toast(Lx(fmtMin(m) + ' odak · ' + fmtMin(FC.brkMin) + ' mola', fmtMin(m) + ' focus · ' + fmtMin(FC.brkMin) + ' break')); FC.left = fcDur(FC.phase); fcStart(); pomoRender(); },
  'fc-sub': el => { FC.sub = el.dataset.k; pomoRender(); },
  'fc-method': el => { if (FC.run && !confirm(tr('Sayaç çalışıyor. Yöntem değişsin mi? (Bu tur sıfırlanır)'))) return; if (FC.run) fcPause(); const c = fcCfg(); c.method = el.dataset.k; tdSet('pomoCfg', c); FC.phase = 'work'; FC.workMs = 0; FC.round = 0; FC.left = fcDur('work'); fcCalClear(); fcSave(); pomoRender(); },
  'fc-solo': () => { if (!FC.solo && !FC.task) { const t = list('task').filter(x => !x.done).sort(taskSort)[0]; if (t) FC.task = t.id; } FC.solo = !FC.solo; FC.sub = 'timer'; fcSave(); pomoRender(); },
  'fc-taskdone': async () => { const id = FC.task; if (!id) return; if (FC.run && FC.phase === 'work' && FC.segStart) { FC.workMs += Date.now() - FC.segStart; FC.segStart = Date.now(); if (fcLog(FC.workMs, true)) { FC.loggedMs = (FC.loggedMs || 0) + FC.workMs; FC.workMs = 0; } } await toggleTask(id); const nx = list('task').filter(x => !x.done && x.id !== id).sort(taskSort)[0]; FC.task = nx ? nx.id : ''; fcSave(); pomoRender(); if (nx) setTimeout(() => toast(Lx('Sıradaki: ' + nx.title, 'Next: ' + nx.title)), 1500); },
  'fc-note-skip': () => { FC.askNote = false; pomoRender(); },
  'fc-eye': () => { FC.eyeEnd = Date.now() + 20000; tmStartLoop(); if (!FC.run) { const iv = setInterval(() => { fcPaint(); if (!FC.eyeEnd || Date.now() > FC.eyeEnd + 1500) { FC.eyeEnd = 0; clearInterval(iv); } }, 250); } pomoRender(); },
  'fc-stretch': () => { FC.stretch++; pomoRender(); },
  'fc-water': async () => { const hb = fcWaterHabit(); if (hb && !(hb.log || {})[today()]) { hb.log = hb.log || {}; hb.log[today()] = true; await save(hb, { silent: true }); } pomoRender(); },
  'fc-sw': el => { const c = fcCfg(), k = el.dataset.k; if (k.startsWith('b:')) c.breaks[k.slice(2)] = !c.breaks[k.slice(2)]; else c[k] = !c[k]; el.classList.toggle('on'); tdSet('pomoCfg', c); fcSound(); },
  'fc-snd': el => { const c = fcCfg(); c.sound = el.dataset.k; tdSet('pomoCfg', c); $$('.chip', el.parentNode).forEach(b => b.classList.toggle('on', b === el)); fcSound(); }
});
document.addEventListener('submit', e => { if (e.target.id !== 'fcNote') return; e.preventDefault(); const v = e.target.q.value.trim(); if (v) { fcAddNote(v); toast(tr('Not kaydedildi')); } FC.askNote = false; pomoRender(); });
document.addEventListener('input', e => {
  const id = e.target.id; if (!/^(pmW|pmS|pmL|pmE|fcCW|fcCB|fcFR|fcGoal)$/.test(id)) return; e.stopImmediatePropagation();
  const c = fcCfg(), v = Math.max(id === 'fcGoal' ? 0 : 1, parseInt(e.target.value, 10) || 0);
  if (id === 'fcGoal') c.goal = v; else if (id === 'fcFR') c.flowRatio = v || 5; else if (id === 'fcCW') c.custom.work = v || 1; else if (id === 'fcCB') c.custom.brk = v || 1; else c.pomo[{ pmW: 'work', pmS: 'short', pmL: 'long', pmE: 'every' }[id]] = v || 1;
  fcCfgSave(c); setTimeout(() => { if (!FC.run && !fcIsUp()) { FC.left = fcDur(FC.phase); fcSave(); } }, 450);
}, true);
document.addEventListener('change', e => { if (e.target.id === 'pmTask') { FC.task = e.target.value; fcSave(); } }, true);
// açılışta: kapalıyken biten fazın takvim etkinliğini temizle
setTimeout(() => { if (FC.gev && FC.gev.at && FC.gev.at < Date.now() - 60000 && typeof Cal !== 'undefined') { const t = setInterval(() => { if (Cal.ready()) { clearInterval(t); fcCalDel(); } }, 5000); setTimeout(() => clearInterval(t), 120000); } if (FC.run) { fcRestore(); if (FC.run) tmStartLoop(); } }, 1500);

/* Görev satırında odak süresi */
(function () {
  const orig = taskRow;
  window.taskRow = function (t) {
    const h = orig(t); if (!t.focusMin) return h; const chip = '<span class="fc-chip">⏱ ' + fmtMin(t.focusMin) + '</span>';
    if (h.includes('class="row-meta"')) { const i = h.lastIndexOf('</div></div></div>'); return h.slice(0, i) + chip + h.slice(i); }
    const i = h.lastIndexOf('</div></div>'); return h.slice(0, i) + '<div class="row-meta">' + chip + '</div>' + h.slice(i);
  };
})();

/* İngilizce */
(function () {
  const add = { 'Pomodoro': 'Pomodoro', 'Akış': 'Flow', '90 dk derin': '90 min deep', 'Özel': 'Custom', '25 dk odak, 5 dk mola; 4 turda bir uzun mola': '25 min focus, 5 min break; long break every 4', 'Süre yok; ne zaman durursan mola, çalıştığının 1/5’i': 'No timer; stop when you like, break is 1/5 of work', '52 dk odak, 17 dk mola': '52 min focus, 17 min break', '90 dk tek blok, 20 dk mola': 'One 90 min block, 20 min break', 'Süreleri sen belirle': 'Set your own durations',
    'Nefes egzersizi': 'Breathing', 'Kutu nefes: 4 al, 4 tut, 4 ver, 4 tut': 'Box breathing: in 4, hold 4, out 4, hold 4', 'Göz molası': 'Eye break', '20 saniye uzağa bak (20-20-20)': 'Look far away for 20 seconds (20-20-20)', 'Esneme hareketi': 'Stretch', 'Her molada kısa bir hareket önerisi': 'A short move every break', 'Su ve yürüyüş': 'Water & walk', 'Su iç, kalk biraz yürü; “su” alışkanlığına işaret koyar': 'Drink water, walk a bit; ticks your “water” habit', 'Mola notu': 'Break note', 'Tur bitince “Ne yaptın?” diye tek satır sorar': 'Asks “What did you do?” after each round',
    'Kapalı': 'Off', 'Beyaz gürültü': 'White noise', 'Pembe gürültü': 'Pink noise', 'Kahverengi gürültü': 'Brown noise', 'Yağmur': 'Rain', 'Sayaç': 'Timer', 'İstatistik': 'Stats', 'Ayarlar': 'Settings', 'Mola': 'Break', 'yukarı sayıyor': 'counting up', 'Mola ver': 'Take a break', 'Görev bitti': 'Task done', 'Tek iş modundan çık': 'Exit single-task mode', 'Tek iş modu': 'Single-task mode',
    'Uygulamayı kapatsan da süre bitince Google Takvim bildirimi gelir.': 'Even if you close the app, Google Calendar notifies you when time is up.', 'Kapalıyken bildirim için Google oturumunu yenile:': 'Renew Google sign-in for notifications while closed:', 'Yenile': 'Renew', 'Bu turda ne yaptın? (isteğe bağlı)': 'What did you do this round? (optional)', 'Nefes': 'Breathe', 'Al': 'In', 'Tut': 'Hold', 'Ver': 'Out',
    'Ekrandan kalk, en az 6 metre uzaktaki bir noktaya 20 saniye bak.': 'Look at something at least 6 meters away for 20 seconds.', '20 saniye başlat': 'Start 20 seconds', 'Tamam, gözlerin dinlendi': 'Done, eyes rested', 'Esneme': 'Stretch', 'Başka hareket': 'Another move', 'Bir bardak su iç, kalk birkaç dakika yürü.': 'Drink a glass of water, walk for a few minutes.',
    'Son 7 gün': 'Last 7 days', 'Tur (bugün)': 'Rounds (today)', 'En çok odaklandığın işler': 'Most focused tasks', '(silinmiş görev)': '(deleted task)', 'Verimli saatlerin (30 gün)': 'Your productive hours (30 days)', 'Bugün ne yaptın': 'What you did today', 'İlk odak turunu bitirince burada istatistiklerin görünür.': 'Finish your first focus round to see stats here.',
    'Mola içerikleri': 'Break content', 'Arka plan sesi': 'Background sound', 'Molada da çalsın': 'Play during breaks too', 'Kapalıyken bildir': 'Notify when closed', 'Google Takvim bağlıysa süre bitiminde kısa bir etkinlik açılır, telefonun bildirir; uygulamada biterse silinir.': 'With Google Calendar connected, a short event is created at the end time so your phone notifies you; it is removed if the timer ends in the app.',
    'Odak (dk)': 'Focus (min)', 'Mola (dk)': 'Break (min)', 'Mola = çalışma ÷': 'Break = work ÷', 'Haftalık hedef (saat)': 'Weekly goal (hours)', 'Sayaç çalışıyor. Yöntem değişsin mi? (Bu tur sıfırlanır)': 'Timer is running. Change method? (This round resets)', 'Not kaydedildi': 'Note saved', 'Odak süresi bitti': 'Focus time is up', 'Mola bitti': 'Break over',
    'Boynunu yavaşça sağa, sola eğ; her yanda 10 saniye bekle.': 'Tilt your head slowly left and right; hold 10 seconds each side.', 'Omuzlarını 10 kez geriye doğru çevir.': 'Roll your shoulders backwards 10 times.', 'Ellerini kenetle, kollarını öne uzat, sırtını yuvarla.': 'Clasp your hands, stretch arms forward, round your back.', 'Ayağa kalk, ellerini yukarı uzatıp parmak uçlarında 10 saniye uzan.': 'Stand up, reach up and stay on your toes for 10 seconds.', 'Bileklerini her iki yöne 10’ar kez çevir.': 'Rotate your wrists 10 times each way.', 'Ellerini belinde tut, gövdeni sağa sola yavaşça çevir.': 'Hands on hips, slowly twist left and right.', 'Bir kolunu göğsünün önünden çek, diğer elinle 15 saniye tut; sonra diğer kol.': 'Pull one arm across your chest for 15 seconds; then the other.', 'Oturduğun yerde dizini göğsüne çek, 10 saniye tut.': 'Seated, pull your knee to your chest for 10 seconds.', 'Gözlerini kapat, omuzlarını kulaklarına doğru kaldır, 5 saniye tut ve bırak.': 'Close your eyes, lift shoulders to ears, hold 5 seconds and drop.', 'Duvara dayan, baldırlarını esnet; her bacak 15 saniye.': 'Lean on a wall and stretch your calves; 15 seconds each.', 'Çeneni göğsüne yaklaştır, ensendeki gerilmeyi 10 saniye hisset.': 'Tuck your chin to your chest, feel the stretch for 10 seconds.', 'Parmaklarını aç-kapa yap, 20 kez.': 'Open and close your fingers 20 times.' };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
