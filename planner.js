'use strict';
/* PUSULA — Takvim görünümleri (Ay / Hafta / Gün) ve hatırlatmalar */

/* ===================== Takvim görünümleri ===================== */
S.calView = lsGet('pusula.calView', 'month');
function calTabsHtml() {
  return '<div class="seg cal-views">' + [['month', 'Ay'], ['week', 'Hafta'], ['day', 'Gün']].map(v => '<button class="' + (S.calView === v[0] ? 'on' : '') + '" data-act="cal-view" data-v="' + v[0] + '">' + v[1] + '</button>').join('') + '</div>';
}
function calEnsure(d) {
  const ms = new Set([d.slice(0, 7), addDays(d, 6).slice(0, 7)]);
  ms.forEach(m => {
    if (Cal.ready() && !Cal.busy && (!Cal.fetched[m] || Date.now() - Cal.fetched[m] > 300000)) {
      Cal.fetched[m] = Date.now();
      setTimeout(() => Cal.fetchMonth(m).then(() => { if (S.tab === 'plan' && S.planSub === 'calendar' && !$('#sheetRoot').classList.contains('open')) render(); }).catch(e => console.warn(e)), 0);
    }
  });
}
/* Bir güne düşen her şey: Google etkinlikleri, PUSULA etkinlikleri (tekrarlar dahil), rutinler, görevler */
function dayItems(d) {
  const out = [];
  if (Cal.on()) Cal.forDate(d).forEach(e => out.push({ k: 'gev', time: e.allDay ? '' : e.start, end: e.allDay ? '' : e.end, title: e.title, color: e.color, act: 'gev-edit', attr: 'data-gid="' + esc(e.gid) + '"', remind: !!((e.remind && e.remind.length) || e.remindDefault) }));
  eventsOn(d).forEach(e => out.push({ k: 'ev', time: e.allDay ? '' : (e.start || ''), end: e.allDay ? '' : (e.end || ''), title: e.title, color: e.color, act: 'edit-event', attr: 'data-id="' + e.id + '" data-d="' + d + '"', rep: !!e.rec, remind: !!(e.remind || []).length }));
  list('routine').forEach(r => { if (routineOn(r, d)) out.push({ k: 'rt', time: r.time || '', title: r.title, act: 'rt-edit', attr: 'data-id="' + r.id + '"', rep: false, remind: !!((r.remind || []).length && r.time) }); });
  if (planOn('tasks')) list('task').forEach(t => { if (t.due === d || taskOn(t, d)) out.push({ k: 'task', time: t.time || '', title: t.title, done: t.done, act: 'edit-task', attr: 'data-id="' + t.id + '"', remind: !!((t.remind || []).length && t.time) }); });
  return out.sort((a, b) => (a.time ? 1 : 0) - (b.time ? 1 : 0) || (a.time || '').localeCompare(b.time || ''));
}
const KIND_ICON = { gev: 'event', ev: 'event', rt: 'repeat', task: 'task' };
function itemRow(x) {
  return '<div class="pi ' + x.k + (x.done ? ' done' : '') + (x.past ? ' past' : '') + '" data-act="' + x.act + '" ' + x.attr + '><span class="pi-time">' + (x.time ? x.time + (x.end ? '<small>' + x.end + '</small>' : '') : tr('Tüm gün')) + '</span>' +
    '<span class="pi-bar" style="background:' + (x.color || (x.k === 'task' ? 'var(--muted)' : x.k === 'rt' ? 'var(--ok)' : 'var(--accent)')) + '"></span><span class="pi-title u">' + esc(x.title) + '</span>' +
    '<span class="pi-ico">' + (x.rep ? icon('repeat', 'xs') : '') + (x.remind ? icon('bell', 'xs') : '') + icon(KIND_ICON[x.k], 'xs') + '</span></div>';
}
function weekStart(d) { return addDays(d, -dow(d)); }
function viewCalWeek() {
  const ws = weekStart(S.calSel), t0 = today(); calEnsure(ws);
  const we = addDays(ws, 6);
  const label = parseYmd(ws).toLocaleDateString(TR, { day: 'numeric', month: 'short' }) + ' – ' + parseYmd(we).toLocaleDateString(TR, { day: 'numeric', month: 'short', year: 'numeric' });
  let h = '<section class="card"><div class="cal-head"><button class="icon-btn" data-act="cal-step" data-n="-7" aria-label="Önceki hafta">' + icon('left') + '</button><div class="cal-month">' + label + '</div><button class="icon-btn" data-act="cal-step" data-n="7" aria-label="Sonraki hafta">' + icon('right') + '</button></div></section><div class="wk">';
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i), it = dayItems(d);
    h += '<section class="card wk-day ' + (d === t0 ? 'today' : '') + '"><div class="wk-head"><button class="wk-date" data-act="cal-open-day" data-d="' + d + '"><b>' + DAYS[i] + '</b><span>' + parseYmd(d).toLocaleDateString(TR, { day: 'numeric', month: 'short' }) + '</span></button><button class="icon-btn" data-act="cal-add-at" data-d="' + d + '" aria-label="Ekle">' + icon('plus', 'sm') + '</button></div>' +
      (it.length ? it.map(itemRow).join('') : '<div class="wk-empty">—</div>') + '</section>';
  }
  return h + '</div>';
}
function viewCalDay() {
  const d = S.calSel; calEnsure(d);
  const it = dayItems(d), allDay = it.filter(x => !x.time), timed = it.filter(x => x.time);
  const firstH = Math.min(7, ...timed.map(x => +x.time.slice(0, 2))), lastH = Math.max(22, ...timed.map(x => +x.time.slice(0, 2)));
  const nowH = d === today() ? new Date().getHours() : -1;
  let h = '<section class="card"><div class="cal-head"><button class="icon-btn" data-act="cal-step" data-n="-1" aria-label="Önceki gün">' + icon('left') + '</button><div class="cal-month">' + relDayLong(d) + '</div><button class="icon-btn" data-act="cal-step" data-n="1" aria-label="Sonraki gün">' + icon('right') + '</button></div></section>';
  if (allDay.length) h += '<section class="card day-all"><div class="day-lbl">' + tr('Tüm gün') + '</div>' + allDay.map(itemRow).join('') + '</section>';
  h += '<section class="card day-grid">';
  for (let H = firstH; H <= lastH; H++) {
    const hh = pad(H), rows = timed.filter(x => x.time.slice(0, 2) === hh);
    h += '<div class="hr ' + (H === nowH ? 'now' : '') + '"><button class="hr-lbl" data-act="cal-add-at" data-d="' + d + '" data-t="' + hh + ':00" aria-label="Bu saate ekle">' + hh + ':00</button><div class="hr-body">' + (rows.length ? rows.map(itemRow).join('') : '<button class="hr-add" data-act="cal-add-at" data-d="' + d + '" data-t="' + hh + ':00" aria-label="Bu saate ekle"></button>') + '</div></div>';
  }
  return h + '</section><div class="cal-add-bar"><button class="btn" data-act="add-routine-day">' + icon('repeat', 'sm') + ' <span>Tekrarlı iş</span></button><button class="btn primary" data-act="add-event">' + icon('plus', 'sm') + ' <span>Etkinlik</span></button></div>';
}
function calViewSwitch() {
  if (S.calView === 'week') return calTabsHtml() + viewCalWeek();
  if (S.calView === 'day') return calTabsHtml() + viewCalDay();
  return '';
}
Object.assign(ACTIONS, {
  'cal-view': el => { S.calView = el.dataset.v; lsSet('pusula.calView', S.calView); S.calMonth = S.calSel.slice(0, 7); render(); },
  'cal-step': el => { S.calSel = addDays(S.calSel, +el.dataset.n); S.calMonth = S.calSel.slice(0, 7); render(); },
  'cal-open-day': el => { S.calSel = el.dataset.d; S.calMonth = S.calSel.slice(0, 7); S.calView = 'day'; lsSet('pusula.calView', 'day'); window.scrollTo(0, 0); render(); },
  'cal-add-at': el => { S.calSel = el.dataset.d; editEvent(null, el.dataset.d); const t = el.dataset.t; if (t) { const st = $('#sheetRoot [name=start]'); if (st) st.value = t; const en = $('#sheetRoot [name=end]'); if (en) en.value = pad(Math.min(23, +t.slice(0, 2) + 1)) + ':00'; } }
});

/* ===================== Hatırlatmalar ===================== */
/* Uygulama açıkken: zamanı gelen hatırlatma ekranda çıkar, seçilen sesle çalar, titreşir.
   Kapalıyken: Google Takvim'e yazılan hatırlatmalar telefon bildirimi olarak gelir. */
const REM_SOUNDS = { zil: ['Zil', [[880, 0, .25], [660, .3, .25], [880, .6, .25], [660, .9, .25], [880, 1.4, .25], [660, 1.7, .25]]], can: ['Çan', [[1318, 0, 1.1], [988, .5, 1.1], [1318, 1.2, 1.2]]], bip: ['Bip', [[1000, 0, .12], [1000, .2, .12], [1000, .4, .12]]], yumusak: ['Yumuşak', [[523, 0, .5], [659, .25, .5], [784, .5, .8]]], sessiz: ['Sessiz', []] };
function remPlay(name) {
  const s = REM_SOUNDS[name] || REM_SOUNDS.zil;
  try {
    const ac = window.__remAC || (window.__remAC = new (window.AudioContext || window.webkitAudioContext)()); if (ac.state === 'suspended') ac.resume();
    s[1].forEach(([f, at, dur]) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at; o.type = name === 'can' ? 'triangle' : 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.05); });
  } catch (e) { /* ses yok */ }
}
document.addEventListener('pointerdown', () => { try { const ac = window.__remAC || (window.__remAC = new (window.AudioContext || window.webkitAudioContext)()); if (ac.state === 'suspended') ac.resume(); } catch (e) { /* yok */ } }, { once: true, capture: true });
function remFired() { try { return JSON.parse(lsGet('pusula.fired', '{}')) || {}; } catch (e) { return {}; } }
function remMark(key) { const f = remFired(); f[key] = Date.now(); const lim = Date.now() - 4 * 86400000; Object.keys(f).forEach(k => { if (f[k] < lim) delete f[k]; }); lsSet('pusula.fired', JSON.stringify(f)); }
const REM_SNOOZE = [];
function remDue() { // şu an çalması gereken hatırlatmalar
  const now = Date.now(), out = [], fired = remFired(), t0 = today();
  const at = (d, hm) => { const p = parseYmd(d); p.setHours(+hm.slice(0, 2), +hm.slice(3, 5), 0, 0); return p.getTime(); };
  const push = (id, title, d, hm, mins, kind) => (mins || []).forEach(m => { const start = at(d, hm), fire = start - m * 60000, key = id + '|' + d + '|' + hm + '|' + m; if (fire <= now && now - fire < 15 * 60000 && !fired[key]) out.push({ key, title, d, hm, m, start, kind }); });
  for (let i = 0; i <= 31; i++) {
    const d = addDays(t0, i);
    eventsOn(d).forEach(e => { if (!e.allDay && e.start) push(e.id, e.title, d, e.start, e.remind, 'ev'); });
    if (Cal.on()) Cal.forDate(d).forEach(e => { if (!e.allDay && e.start && e.remind) push(e.gid, e.title, d, e.start, e.remind, 'gev'); });
    list('routine').forEach(r => { if (r.time && routineOn(r, d)) push(r.id, r.title, d, r.time, r.remind, 'rt'); });
    list('task').forEach(t => { if (!t.done && t.due === d && t.time) push(t.id, t.title, d, t.time, t.remind, 'task'); });
  }
  REM_SNOOZE.splice(0).forEach(x => { if (x.at <= now) out.push(x.r); else REM_SNOOZE.push(x); });
  return out;
}
function remWhenText(r) {
  const diff = Math.round((r.start - Date.now()) / 60000);
  if (diff <= 0) return Lx('Şimdi · ' + r.hm, 'Now · ' + r.hm);
  if (diff < 60) return Lx(diff + ' dk sonra · ' + r.hm, 'In ' + diff + ' min · ' + r.hm);
  if (diff < 1440) return Lx(Math.round(diff / 60) + ' saat sonra · ' + r.hm, 'In ' + Math.round(diff / 60) + ' h · ' + r.hm);
  return relDay(r.d) + ' · ' + r.hm;
}
let remOpen = [];
function remShow(list) {
  list.forEach(r => remMark(r.key));
  remOpen = remOpen.concat(list);
  const st = settings();
  remPlay(st.remindSound || 'zil'); if (navigator.vibrate && st.remindSound !== 'sessiz') navigator.vibrate([400, 200, 400, 200, 400]);
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
    navigator.serviceWorker.getRegistration().then(reg => { if (reg) list.forEach(r => reg.showNotification('PUSULA · ' + r.title, { body: remWhenText(r), tag: r.key, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [300, 150, 300], requireInteraction: true })); }).catch(() => {});
  }
  remRender();
}
function remRender() {
  let box = $('#remBox');
  if (!remOpen.length) { if (box) box.remove(); return; }
  if (!box) { box = document.createElement('div'); box.id = 'remBox'; document.body.appendChild(box); }
  box.innerHTML = '<div class="rem-card">' + icon('bell') + '<div class="rem-list">' + remOpen.map((r, i) => '<div class="rem-item"><div class="grow"><b class="u">' + esc(r.title) + '</b><span>' + esc(remWhenText(r)) + '</span></div><button class="btn sm-btn" data-act="rem-snooze" data-i="' + i + '">' + tr('10 dk ertele') + '</button></div>').join('') + '</div><button class="btn primary" data-act="rem-ok">' + tr('Tamam') + '</button></div>';
  translateTree(box);
}
function remTick() { try { const due = remDue(); if (due.length) remShow(due); } catch (e) { console.warn(e); } }
setInterval(remTick, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(remTick, 800); });
window.addEventListener('load', () => setTimeout(remTick, 2500));
function remindSettingsHtml() {
  const st = settings(); const cur = st.remindSound || 'zil';
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return '<div class="set-sub">Hatırlatmalar</div><p class="muted sm" style="margin:0 0 6px">PUSULA açıkken hatırlatma zamanı gelince bu sesle çalar ve titreşir. Uygulama kapalıyken bildirimi Google Takvim verir (Google Takvim bağlı olmalı).</p>' +
    '<div class="chips rem-sounds">' + Object.keys(REM_SOUNDS).map(k => '<button class="chip ' + (cur === k ? 'on' : '') + '" data-act="rem-sound" data-k="' + k + '">' + REM_SOUNDS[k][0] + '</button>').join('') + '</div>' +
    '<div class="set-row"><div class="grow"><div>Sesi dene</div></div><button class="btn sm-btn" data-act="rem-test">' + icon('bell', 'sm') + ' <span>Çal</span></button></div>' +
    (perm === 'default' ? '<div class="set-row"><div class="grow"><div>Bildirim izni</div><div class="sub">Uygulama arka plandayken de bildirim göstermesi için</div></div><button class="btn sm-btn" data-act="rem-perm">İzin ver</button></div>' : '') +
    '<button class="link" data-act="rem-help">Telefonda Google Takvim bildirim sesini değiştirme</button>';
}
Object.assign(ACTIONS, {
  'rem-ok': () => { remOpen = []; remRender(); },
  'rem-snooze': el => { const r = remOpen.splice(+el.dataset.i, 1)[0]; if (r) { REM_SNOOZE.push({ at: Date.now() + 10 * 60000, r: Object.assign({}, r, { key: r.key + '|s' + Date.now() }) }); toast(tr('10 dakika sonra tekrar hatırlatılacak')); } remRender(); },
  'rem-sound': el => { settings().remindSound = el.dataset.k; saveSettings(); remPlay(el.dataset.k); },
  'rem-test': () => remPlay(settings().remindSound || 'zil'),
  'rem-perm': () => { try { Notification.requestPermission().then(() => render()); } catch (e) { /* yok */ } },
  'rem-help': () => openSheet(sheetHead('Bildirim sesi') + '<div class="sheet-body"><p class="muted">Uygulama kapalıyken hatırlatmayı telefonundaki Google Takvim uygulaması gösterir. Sesini bir kez ayarlaman yeterli:</p><ol class="help-steps">' +
    '<li>Telefonda <b>Ayarlar → Uygulamalar → Takvim (Google Takvim)</b>’e gir.</li><li><b>Bildirimler</b>’e dokun, sonra <b>Etkinlik hatırlatmaları</b> (Events) kanalını aç.</li><li><b>Ses</b>’i seç ve istediğin zil sesini işaretle. İstersen <b>Titreşim</b> ve <b>Ekranda göster</b>’i de aç.</li><li>Huawei’de yol: <b>Ayarlar → Bildirimler → Takvim → Etkinlikler</b>.</li></ol>' +
    '<p class="muted sm">Ayrıca Google Takvim uygulamasında Ayarlar → Genel → “Bildirimler bu cihazda” açık olmalı.</p></div>')
});

(function () {
  const add = {
    'Ay': 'Month', 'Hafta': 'Week', 'Gün': 'Day', 'Önceki hafta': 'Previous week', 'Sonraki hafta': 'Next week', 'Önceki gün': 'Previous day', 'Sonraki gün': 'Next day', 'Tüm gün': 'All day', 'Bu saate ekle': 'Add at this hour',
    'Tekrarlı iş': 'Recurring task', 'Etkinlik': 'Event', 'Hatırlat (önce)': 'Remind (before)', 'Tam zamanında': 'At start', '1 saat': '1 hour', '2 saat': '2 hours', '1 gün': '1 day', '+ dk': '+ min', 'Başka süre (dakika)': 'Other (minutes)',
    'Saat girilmişse çalışır. Google Takvim bağlıysa uygulama kapalıyken de telefonuna bildirim gelir.': 'Works when a time is set. With Google Calendar connected you get a phone notification even when the app is closed.',
    'Saat (isteğe bağlı)': 'Time (optional)', 'Sonraki tarih takviminde görünür; saat ve hatırlatma da yazılır': 'The next date shows in your calendar, with time and reminders',
    'Hatırlatmalar': 'Reminders', 'PUSULA açıkken hatırlatma zamanı gelince bu sesle çalar ve titreşir. Uygulama kapalıyken bildirimi Google Takvim verir (Google Takvim bağlı olmalı).': 'While PUSULA is open, reminders play this sound and vibrate. When the app is closed, Google Calendar sends the notification (Google Calendar must be connected).',
    'Zil': 'Ring', 'Çan': 'Bell', 'Bip': 'Beep', 'Yumuşak': 'Soft', 'Sessiz': 'Silent', 'Sesi dene': 'Test sound', 'Çal': 'Play', 'Bildirim izni': 'Notification permission', 'Uygulama arka plandayken de bildirim göstermesi için': 'To show notifications while the app is in the background', 'İzin ver': 'Allow',
    'Telefonda Google Takvim bildirim sesini değiştirme': 'Change Google Calendar notification sound on your phone', 'Bildirim sesi': 'Notification sound', '10 dk ertele': 'Snooze 10 min', 'Tamam': 'OK', '10 dakika sonra tekrar hatırlatılacak': 'You’ll be reminded again in 10 minutes'
  };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
