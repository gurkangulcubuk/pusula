'use strict';
/* PUSULA — kişisel planlama ve bilgi pusulası */
const VERSION = '1.3.0';
// Google Cloud OAuth istemci kimliği (herkese açık bir kimliktir, gizli değildir). Boşsa Ayarlar'dan girilir.
const DRIVE_CLIENT_ID = '';

/* ===================== Yardımcılar ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseYmd = s => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const dow = s => (parseYmd(s).getDay() + 6) % 7; // 0 = Pazartesi
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
const TR = 'tr-TR';
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const fmtLong = s => parseYmd(s).toLocaleDateString(TR, { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = s => parseYmd(s).toLocaleDateString(TR, { day: 'numeric', month: 'short' });
const fmtNum = n => Number(n || 0).toLocaleString(TR, { maximumFractionDigits: 2 });
const lower = s => String(s || '').toLocaleLowerCase(TR);
const r1 = n => Math.round(n * 10) / 10;
const r2 = n => Math.round(n * 100) / 100;
function relDay(s) { const t = today(); if (s === t) return 'Bugün'; if (s === addDays(t, 1)) return 'Yarın'; if (s === addDays(t, -1)) return 'Dün'; return fmtShort(s); }
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* yok say */ } }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ===================== İkonlar ===================== */
const ICONS = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  plan: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M9 15.2l2 2 4-4"/>',
  info: '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  marker: '<path d="M9 14.5l-4.5 4.5H10l1.5-1.5M9 14.5l8.5-8.5 3 3-8.5 8.5M9 14.5l3 3"/>',
  eraser: '<path d="M8 20h12M4.5 15.5l9.5-9.5 5.5 5.5L11 20H9z"/><path d="M9.5 10.5l5.5 5.5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  pin: '<path d="M9 4h6l-1 6 4 4H6l4-4z"/><path d="M12 14v6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  flame: '<path d="M12 3c.5 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-6 1.2 1 2 2.2 2.3 3.5C12 8.5 12.5 6 12 3z"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  event: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  note: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  habit: '<path d="M12 3c.5 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-6 1.2 1 2 2.2 2.3 3.5C12 8.5 12.5 6 12 3z"/>',
  goal: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  repeat: '<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A5.5 5.5 0 0 1 5 17.6L3.5 14a1.5 1.5 0 0 1 2.6-1.5L8 15"/>',
  paper: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 9.5z"/>'
};
const icon = (n, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

/* ===================== Veritabanı (cihaz içi) ===================== */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('pusula', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  req(store, mode, fn) {
    return new Promise((res, rej) => {
      if (!this.db) return res(null);
      const t = this.db.transaction(store, mode);
      const out = fn(t.objectStore(store));
      t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  },
  all() { return this.req('items', 'readonly', s => s.getAll()); },
  put(item) { return this.req('items', 'readwrite', s => { s.put(item); }); },
  putMany(items) { if (!items.length) return Promise.resolve(); return this.req('items', 'readwrite', s => { items.forEach(i => s.put(i)); }); },
  getMeta(k) { return this.req('meta', 'readonly', s => s.get(k)); },
  setMeta(k, v) { return this.req('meta', 'readwrite', s => { s.put(v, k); }); },
  delMeta(k) { return this.req('meta', 'readwrite', s => { s.delete(k); }); },
  async wipe() { await this.req('items', 'readwrite', s => { s.clear(); }); await this.req('meta', 'readwrite', s => { s.clear(); }); }
};

/* ===================== Durum ===================== */
const S = {
  items: new Map(), tab: 'today', planSub: null, calMonth: null, calSel: today(), lastDay: today(),
  taskFilter: 'open', taskTag: null, noteQuery: '', noteTag: null,
  draft: null, noteEd: null, ink: null, sheetClose: null
};
const list = type => { const out = []; S.items.forEach(it => { if (it.type === type && !it.deleted) out.push(it); }); return out; };
const strip = it => { const o = Object.assign({}, it); delete o._dirty; delete o._dd; return o; };

async function save(item, opts) {
  item.updated = Date.now();
  if (!item.created) item.created = item.updated;
  item._dirty = 1; item._dd = 1;
  S.items.set(item.id, item);
  try { await DB.put(item); } catch (e) { console.error(e); toast('Kaydedilemedi: depolama hatası'); }
  Sync.schedule(); Drive.schedule();
  if (!(opts && opts.silent)) render();
  return item;
}
async function remove(item, opts) { item.deleted = true; return save(item, opts); }

/* ===================== Ayarlar & tema ===================== */
const LOOK_DEFAULTS = { theme: 'dark', darkPal: 'gece', lightPal: 'beyaz', accent: 'mono', cards: 'plain', font: 'inter', fs: 1, density: 'normal', radius: 'soft', tabLabels: true };
const DEFAULT_SETTINGS = Object.assign({
  id: 'settings', type: 'settings', name: '', paper: 'lines', look: 2,
  today: [{ k: 'tasks', on: true }, { k: 'events', on: true }, { k: 'habits', on: true }, { k: 'goals', on: true }, { k: 'pinned', on: true }],
  plan: [{ k: 'tasks', on: true }, { k: 'calendar', on: true }, { k: 'habits', on: true }],
  notes: true, updated: 0
}, LOOK_DEFAULTS);
// Tema paletleri: [zemin, yüzey, yüzey 2, yazı, soluk yazı, çok soluk, çizgi]
const PALETTES = {
  dark: {
    gece: ['Gece', '#0E0E0F', '#151517', '#1C1C1F', '#EDEDED', '#A0A0A0', '#6E6E6E', '#262628'],
    oled: ['Siyah', '#000000', '#0A0A0A', '#121212', '#F2F2F2', '#9A9A9A', '#666666', '#1E1E1E'],
    grafit: ['Grafit', '#17191C', '#1E2125', '#252930', '#E6E8EA', '#9BA1A8', '#6C737B', '#2D3238'],
    lacivert: ['Lacivert', '#0F171D', '#16212A', '#1B2832', '#E2E9ED', '#93A3AE', '#6A7B87', '#2A3843'],
    sepya: ['Sıcak', '#1A1714', '#221E1A', '#2A2520', '#ECE6DD', '#A69E92', '#7A7268', '#332D27']
  },
  light: {
    beyaz: ['Beyaz', '#FFFFFF', '#FFFFFF', '#F5F5F5', '#111111', '#666666', '#9A9A9A', '#E8E8E8'],
    kagit: ['Kâğıt', '#F7F5F0', '#FBFAF7', '#EFEBE3', '#22201C', '#6B665D', '#A09A8F', '#E3DED4'],
    gri: ['Açık gri', '#F2F3F5', '#FFFFFF', '#F7F8F9', '#16181B', '#5E646B', '#9097A0', '#E1E4E8'],
    opex: ['Yeşilimsi', '#EDF0EF', '#FFFFFF', '#F5F7F6', '#15222D', '#5C6C78', '#8A979F', '#D3DAD8']
  }
};
const ACCENT_NAMES = { mono: 'Mono', petrol: 'Petrol', turkuaz: 'Turkuaz', mavi: 'Mavi', yesil: 'Yeşil', turuncu: 'Turuncu', mercan: 'Mercan', bordo: 'Bordo', mor: 'Mor', grafit: 'Grafit' };
// [vurgu, vurgu üstü yazı, yumuşak zemin] — koyu ve açık tema için ayrı
const ACCENTS = {
  mono: null,
  petrol: { dark: ['#5EAECB', '#0F171D', 'rgba(94,174,203,.14)'], light: ['#1B6683', '#FFFFFF', 'rgba(27,102,131,.10)'] },
  turkuaz: { dark: ['#3CC4B6', '#0B1A1C', 'rgba(60,196,182,.14)'], light: ['#00796F', '#FFFFFF', 'rgba(0,121,111,.10)'] },
  mavi: { dark: ['#6BA8E8', '#0B1622', 'rgba(107,168,232,.14)'], light: ['#2160A8', '#FFFFFF', 'rgba(33,96,168,.10)'] },
  yesil: { dark: ['#73C28A', '#0C1A10', 'rgba(115,194,138,.14)'], light: ['#2E6B3F', '#FFFFFF', 'rgba(46,107,63,.10)'] },
  turuncu: { dark: ['#E6A452', '#1E1406', 'rgba(230,164,82,.14)'], light: ['#A85A08', '#FFFFFF', 'rgba(168,90,8,.10)'] },
  mercan: { dark: ['#F09A80', '#1E0F0A', 'rgba(240,154,128,.14)'], light: ['#B4492F', '#FFFFFF', 'rgba(180,73,47,.10)'] },
  bordo: { dark: ['#E58A9A', '#1E0C10', 'rgba(229,138,154,.14)'], light: ['#8E2A3B', '#FFFFFF', 'rgba(142,42,59,.10)'] },
  mor: { dark: ['#B39AE6', '#160F24', 'rgba(179,154,230,.14)'], light: ['#6B3FA0', '#FFFFFF', 'rgba(107,63,160,.10)'] },
  grafit: { dark: ['#AFC0CC', '#11181E', 'rgba(175,192,204,.14)'], light: ['#3F4A54', '#FFFFFF', 'rgba(63,74,84,.10)'] }
};
const FONTS = {
  inter: ['Inter', '"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'],
  system: ['Sistem', 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'],
  plex: ['IBM Plex', '"IBM Plex Sans",system-ui,sans-serif'],
  nunito: ['Nunito', '"Nunito",system-ui,sans-serif'],
  serif: ['Serif', '"Source Serif 4",Georgia,"Times New Roman",serif'],
  mono: ['Mono', '"JetBrains Mono",ui-monospace,Menlo,monospace']
};
const CARD_STYLES = { plain: 'Sade', outline: 'Çizgili', filled: 'Kutulu' };
const DENSITY = { compact: ['Sıkı', 7], normal: ['Normal', 11], comfy: ['Rahat', 15] };
const RADIUS = { sharp: ['Keskin', 3], soft: ['Hafif', 10], round: ['Yuvarlak', 16] };
function settings() {
  let s = S.items.get('settings');
  if (!s) { s = clone(DEFAULT_SETTINGS); S.items.set('settings', s); }
  if (!s.look) { Object.assign(s, clone(LOOK_DEFAULTS), { theme: s.theme === 'light' || s.theme === 'system' ? s.theme : 'dark' }); s.look = 2; }
  for (const k in DEFAULT_SETTINGS) if (s[k] === undefined) s[k] = clone(DEFAULT_SETTINGS[k]);
  ['today', 'plan'].forEach(key => DEFAULT_SETTINGS[key].forEach(d => { if (!s[key].find(x => x.k === d.k)) s[key].push(clone(d)); }));
  return s;
}
const saveSettings = () => save(settings());
const planOn = k => { const m = settings().plan.find(x => x.k === k); return !!(m && m.on); };
function currentTheme() {
  const t = settings().theme;
  if (t === 'system') return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  return t === 'light' ? 'light' : 'dark';
}
function currentPalette() { const st = settings(); const m = currentTheme(); const set = PALETTES[m]; return set[m === 'dark' ? st.darkPal : st.lightPal] || set[m === 'dark' ? 'gece' : 'beyaz']; }
function applyTheme() {
  const st = settings(); const mode = currentTheme(); const p = currentPalette();
  const root = document.documentElement, css = (k, v) => root.style.setProperty(k, v);
  root.dataset.theme = mode;
  ['--bg', '--surface', '--surface2', '--text', '--muted', '--faint', '--line'].forEach((k, i) => css(k, p[i + 1]));
  const a = ACCENTS[st.accent] ? ACCENTS[st.accent][mode] : [p[4], p[1], hexA(p[4], mode === 'dark' ? 0.08 : 0.06)];
  css('--accent', a[0]); css('--accent-ink', a[1]); css('--accent-soft', a[2]);
  css('--font', (FONTS[st.font] || FONTS.inter)[1]);
  css('--fs', String(Math.max(0.8, Math.min(1.4, Number(st.fs) || 1))));
  css('--pad', (DENSITY[st.density] || DENSITY.normal)[1] + 'px');
  css('--r', (RADIUS[st.radius] || RADIUS.soft)[1] + 'px');
  root.dataset.cards = CARD_STYLES[st.cards] ? st.cards : 'plain';
  root.dataset.tablabels = st.tabLabels === false ? 'off' : 'on';
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = p[1];
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

/* ===================== Etiketler ===================== */
const tagsOf = scope => list('tag').filter(t => t.scope === scope).sort((a, b) => a.name.localeCompare(b.name, TR));
const tagName = id => { const t = S.items.get(id); return t && !t.deleted ? t.name : null; };
function tagChips(ids) { return (ids || []).map(tagName).filter(Boolean).map(n => '<span class="tag">#' + esc(n) + '</span>').join(''); }
function tagPicker(scope, selected) {
  const sel = selected || [];
  return '<div class="chips tag-picker" data-scope="' + scope + '">' +
    tagsOf(scope).map(t => '<button type="button" class="chip ' + (sel.includes(t.id) ? 'on' : '') + '" data-act="tag-toggle" data-tag="' + t.id + '">#' + esc(t.name) + '</button>').join('') +
    '<input class="chip-input" data-scope="' + scope + '" placeholder="+ yeni etiket" enterkeyhint="done" autocomplete="off"></div>';
}
async function addTagFromInput(inp) {
  const name = inp.value.trim().replace(/^#/, ''); if (!name) return;
  const scope = inp.dataset.scope;
  let tg = tagsOf(scope).find(t => lower(t.name) === lower(name));
  if (!tg) { tg = { id: uid(), type: 'tag', scope, name }; await save(tg, { silent: true }); }
  const picker = inp.closest('.tag-picker');
  if (picker) {
    const ex = picker.querySelector('[data-tag="' + tg.id + '"]');
    if (ex) ex.classList.add('on');
    else inp.insertAdjacentHTML('beforebegin', '<button type="button" class="chip on" data-act="tag-toggle" data-tag="' + tg.id + '">#' + esc(tg.name) + '</button>');
  }
  inp.value = '';
  if (S.noteEd) noteTagsSync();
}
const pickedTags = root => $$('.tag-picker .chip.on', root).map(b => b.dataset.tag);

/* ===================== Tarih mantığı ===================== */
const REPEATS = [['none', 'Tekrar yok'], ['daily', 'Her gün'], ['weekdays', 'Hafta içi her gün'], ['weekly', 'Her hafta'], ['monthly', 'Her ay'], ['yearly', 'Her yıl']];
const repeatLabel = k => (REPEATS.find(r => r[0] === k) || REPEATS[0])[1];
function nextDate(s, rep) {
  const d = parseYmd(s);
  if (rep === 'daily') d.setDate(d.getDate() + 1);
  else if (rep === 'weekly') d.setDate(d.getDate() + 7);
  else if (rep === 'weekdays') { do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6); }
  else if (rep === 'monthly') { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); }
  else if (rep === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 1);
  return ymd(d);
}
const habitScheduled = (h, s) => !h.days || !h.days.length || h.days.includes(dow(s));
function streak(h) {
  const log = h.log || {}; let s = today(); let n = 0;
  const start = h.created ? ymd(new Date(h.created)) : addDays(s, -730);
  if (!log[s]) s = addDays(s, -1);
  for (let i = 0; i < 1000 && s >= start; i++) {
    if (habitScheduled(h, s)) { if (log[s]) n++; else break; }
    s = addDays(s, -1);
  }
  return n;
}
const taskSort = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (a.time || '99').localeCompare(b.time || '99') || (b.priority || 0) - (a.priority || 0) || (a.created || 0) - (b.created || 0);
const eventSort = (a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || (a.start || '').localeCompare(b.start || '');

/* ===================== Google Drive senkronu ===================== */
// Veriler kullanıcının kendi Drive'ında, sadece bu uygulamanın görebildiği gizli klasörde (appDataFolder) tek dosya olarak durur.
const GDRIVE_FILE = 'pusula-data.json';
const GSCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const Drive = {
  cfg: null, token: null, exp: 0, busy: false, again: false, status: 'off', error: '', timer: null, gisP: null, nagged: false,
  async load() {
    try { this.cfg = (await DB.getMeta('drive')) || null; } catch (e) { this.cfg = null; }
    try { const t = JSON.parse(lsGet('pusula.gtok', 'null')); if (t && t.exp > Date.now()) { this.token = t.v; this.exp = t.exp; } } catch (e) { /* yok */ }
    this.status = this.on() ? 'idle' : 'off';
  },
  async saveCfg() { await DB.setMeta('drive', this.cfg); },
  on() { return !!(this.cfg && this.cfg.connected && this.cfg.clientId); },
  tokenOk() { return !!this.token && Date.now() < this.exp - 60000; },
  gisReady() { return !!(window.google && google.accounts && google.accounts.oauth2); },
  loadGis() {
    if (this.gisReady()) return Promise.resolve();
    if (this.gisP) return this.gisP;
    this.gisP = new Promise((res, rej) => {
      const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
      sc.onload = () => res(); sc.onerror = () => { this.gisP = null; rej(new Error('Google girişi yüklenemedi, internet bağlantını kontrol et')); };
      document.head.appendChild(sc);
    });
    return this.gisP;
  },
  // Dokunma anında, beklemeden çağrılmalı (tarayıcı açılır pencereye sadece dokunuşla izin verir)
  requestToken(prompt) {
    return new Promise((res, rej) => {
      if (!this.gisReady()) { this.loadGis().catch(() => {}); return rej(new Error('Google girişi hazırlanıyor, birkaç saniye sonra tekrar dokun')); }
      const tc = google.accounts.oauth2.initTokenClient({
        client_id: this.cfg.clientId, scope: GSCOPE,
        callback: r => {
          if (r.error) return rej(new Error(r.error_description || r.error));
          this.token = r.access_token; this.exp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
          lsSet('pusula.gtok', JSON.stringify({ v: this.token, exp: this.exp })); res();
        },
        error_callback: e => rej(new Error(e && e.type === 'popup_closed' ? 'Google penceresi kapatıldı' : e && e.type === 'popup_failed_to_open' ? 'Google penceresi açılamadı' : 'Google girişi başarısız'))
      });
      tc.requestAccessToken({ prompt: prompt || '' });
    });
  },
  async api(url, opts) {
    opts = opts || {};
    const r = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + this.token }, opts.headers || {}) }));
    if (r.status === 401) { this.token = null; this.exp = 0; lsSet('pusula.gtok', 'null'); const e = new Error('Google oturumunun süresi doldu'); e.auth = true; throw e; }
    if (!r.ok) { let m = 'Drive hatası ' + r.status; try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (e) { /* yok */ } throw new Error(m); }
    return r;
  },
  async findFile() {
    const q = encodeURIComponent("name='" + GDRIVE_FILE + "' and trashed=false");
    const r = await this.api('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + q + '&fields=files(id,modifiedTime)&orderBy=modifiedTime%20desc&pageSize=5');
    const j = await r.json(); return (j.files || [])[0] || null;
  },
  payload() { const items = []; S.items.forEach(it => { if (it.type !== 'settings' || it.updated) items.push(strip(it)); }); return JSON.stringify({ app: 'PUSULA', version: VERSION, saved: new Date().toISOString(), items }); },
  async upload(fileId) {
    const body = this.payload();
    if (fileId) {
      const r = await this.api('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media&fields=id,modifiedTime', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
      return r.json();
    }
    const b = 'pusula' + Date.now();
    const meta = JSON.stringify({ name: GDRIVE_FILE, parents: ['appDataFolder'], mimeType: 'application/json' });
    const multi = '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + b + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--' + b + '--';
    const r = await this.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: multi });
    return r.json();
  },
  schedule(d) { if (!this.on() || !this.tokenOk()) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.run(false), d == null ? 4000 : d); },
  setStatus(st, err) {
    this.status = st; this.error = err || '';
    if (st === 'ok') this.lastOk = new Date();
    const el = $('#driveStatus'); if (el) el.innerHTML = driveStatusHtml();
    const el2 = $('#driveStatus2'); if (el2) el2.innerHTML = driveStatusHtml();
    const b = $('#syncBtn'); if (b) { b.classList.toggle('spin', st === 'syncing'); b.classList.toggle('warn', st === 'needauth' || st === 'error'); }
  },
  async run(interactive) {
    if (!this.on()) return;
    if (this.busy) { this.again = true; return; }
    if (!navigator.onLine) { this.setStatus('offline'); return; }
    if (!this.tokenOk()) {
      if (!interactive) {
        this.setStatus('needauth');
        if (!this.nagged) { this.nagged = true; toast('Drive ile eşitlemek için dokun', { label: 'Eşitle', fn: () => this.run(true) }, 10000); }
        return;
      }
      try { await this.requestToken(); } catch (e) { this.setStatus('error', e.message); toast(e.message); return; }
    }
    this.busy = true; this.setStatus('syncing');
    try {
      const f = await this.findFile(); let changed = false;
      if (f && f.modifiedTime !== this.cfg.lastRemote) {
        const r = await this.api('https://www.googleapis.com/drive/v3/files/' + f.id + '?alt=media');
        const data = await r.json(); const toPut = [];
        (data.items || []).forEach(it => {
          if (!it || !it.id || !it.type) return;
          const loc = S.items.get(it.id);
          if (!loc || (it.updated || 0) > (loc.updated || 0)) { delete it._dirty; delete it._dd; S.items.set(it.id, it); toPut.push(it); changed = true; }
        });
        await DB.putMany(toPut);
      }
      const dirty = []; S.items.forEach(it => { if (it._dd) dirty.push([it.id, it.updated]); });
      if (!f || dirty.length) {
        const res = await this.upload(f && f.id);
        this.cfg.fileId = res.id; this.cfg.lastRemote = res.modifiedTime;
        const clean = []; dirty.forEach(x => { const cur = S.items.get(x[0]); if (cur && cur.updated === x[1]) { delete cur._dd; clean.push(cur); } });
        await DB.putMany(clean);
      } else if (f) this.cfg.lastRemote = f.modifiedTime;
      this.cfg.lastOk = Date.now(); await this.saveCfg();
      this.setStatus('ok');
      if (changed) { thumbCache.clear(); if (!S.ink && !S.noteEd) render(); else applyTheme(); }
    } catch (e) {
      console.warn(e);
      this.setStatus(e.auth ? 'needauth' : (navigator.onLine ? 'error' : 'offline'), e.message);
    } finally {
      this.busy = false;
      if (this.again) { this.again = false; this.schedule(1500); }
    }
  }
};
function driveStatusHtml() {
  const d = Drive, s = d.status;
  if (!d.on()) return '<span class="status-dot"></span>Kapalı';
  if (s === 'syncing') return '<span class="status-dot syncing"></span>Eşitleniyor…';
  if (s === 'ok') return '<span class="status-dot ok"></span>Güncel · ' + d.lastOk.toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' });
  if (s === 'offline') return '<span class="status-dot"></span>Çevrimdışı — internet gelince eşitlenecek';
  if (s === 'needauth') return '<span class="status-dot syncing"></span>Eşitlemek için “Şimdi eşitle”ye dokun';
  if (s === 'error') return '<span class="status-dot error"></span>' + esc(d.error);
  const t = d.cfg && d.cfg.lastOk ? new Date(d.cfg.lastOk) : null;
  return '<span class="status-dot ok"></span>Açık' + (t ? ' · son eşitleme ' + t.toLocaleString(TR, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
}
function openDrive() {
  if (navigator.onLine) Drive.loadGis().catch(() => {});
  const c = Drive.cfg || {};
  let body;
  if (Drive.on()) {
    body = '<div class="set-group"><div class="set-row"><div class="grow"><div>Google Drive senkronu açık</div><div class="sub" id="driveStatus2">' + driveStatusHtml() + '</div></div></div></div>' +
      '<p class="muted sm" style="margin-top:14px">Verilerin Google Drive’ında, sadece PUSULA’nın görebildiği gizli bir klasörde saklanıyor. Telefon ve tablette aynı Google hesabıyla bağlanınca veriler eşitlenir. İnternet yokken yaptıkların bağlantı gelince gönderilir. Google güvenlik gereği oturum bir saatte bir yenilenir; uygulamayı açtığında “Eşitle”ye dokunman yeterli.</p>' +
      '<button class="btn primary block" data-act="drive-now">' + icon('sync') + ' Şimdi eşitle</button><button class="btn block" data-act="drive-off">Bu cihazda kapat</button>';
  } else {
    const cid = c.clientId || DRIVE_CLIENT_ID;
    body = (cid ? '' : '<ol class="steps"><li>Bilgisayardan <b>console.cloud.google.com</b>’a gir, <b>PUSULA</b> adında yeni proje oluştur.</li><li><b>APIs & Services → Library</b>’den <b>Google Drive API</b>’yi aç (Enable).</li><li><b>Google Auth Platform</b> (OAuth consent screen) → Get started: uygulama adı PUSULA, tür <b>External</b>. <b>Audience</b> bölümünde kendi Gmail adresini <b>Test users</b>’a ekle.</li><li><b>Clients → Create client → Web application</b>. <b>Authorized JavaScript origins</b>’e aşağıdaki adresi ekle, oluştur.</li><li>Çıkan <b>Client ID</b>’yi (…apps.googleusercontent.com) aşağıya yapıştır.</li></ol>' +
      '<div class="set-group" style="margin-top:10px"><div class="set-row click" data-act="copy-origin"><div class="grow"><div>' + esc(location.origin) + '</div><div class="sub">Yetkili adres · kopyalamak için dokun</div></div></div></div>') +
      '<label class="field"><span>Client ID</span><input class="input" name="gClient" placeholder="1234…apps.googleusercontent.com" value="' + esc(cid) + '" autocomplete="off"></label>' +
      '<div class="sheet-msg" id="driveMsg"></div>' +
      '<button class="btn primary block" data-act="drive-connect">Google ile bağlan</button>' +
      '<p class="muted sm">Google “Bu uygulama doğrulanmadı” derse <b>Gelişmiş → PUSULA’ya git</b> de; kişisel uygulamalarda normaldir. PUSULA sadece kendi oluşturduğu gizli dosyayı görebilir, Drive’ındaki diğer dosyalara erişemez.</p>';
  }
  openSheet(sheetHead('Google Drive senkronu') + '<div class="sheet-body">' + body + '</div>', { onClose: () => setTimeout(render, 0) });
}
function driveConnect() {
  const msg = $('#driveMsg'); const say = (t, cls) => { if (msg) { msg.textContent = t; msg.className = 'sheet-msg ' + (cls || ''); } };
  const id = (fval('gClient') || '').trim();
  if (!/\.apps\.googleusercontent\.com$/.test(id)) return say('Client ID “.apps.googleusercontent.com” ile bitmeli.', 'err');
  if (!navigator.onLine) return say('Bağlanmak için internet gerekli.', 'err');
  Drive.cfg = Object.assign({}, Drive.cfg || {}, { clientId: id });
  if (!Drive.gisReady()) { say('Google girişi hazırlanıyor… birkaç saniye sonra tekrar bas.'); Drive.loadGis().then(() => say('Hazır. Şimdi “Google ile bağlan”a bas.', 'ok')).catch(e => say(e.message, 'err')); return; }
  say('Google penceresi açılıyor…');
  Drive.requestToken('consent').then(async () => {
    Drive.cfg.connected = true; Drive.cfg.lastRemote = null; await Drive.saveCfg();
    const all = []; S.items.forEach(it => { if (it.type !== 'settings' || it.updated) { it._dd = 1; all.push(it); } }); await DB.putMany(all);
    say('Bağlandı, eşitleniyor…', 'ok');
    await Drive.run(true);
    toast(Drive.status === 'ok' ? 'Google Drive senkronu açık' : 'Bağlandı, eşitleme hatası: ' + Drive.error);
    openDrive();
  }).catch(e => say(e.message, 'err'));
}

/* ===================== Senkron (isteğe bağlı, Supabase) ===================== */
const SETUP_SQL = `create table if not exists public.pusula_items (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null,
  data jsonb not null,
  updated_at bigint not null,
  deleted boolean not null default false,
  server_ts timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);
alter table public.pusula_items enable row level security;
create policy "pusula_own" on public.pusula_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists pusula_items_ts on public.pusula_items (user_id, server_ts);
grant select, insert, update, delete on public.pusula_items to authenticated;
create or replace function public.pusula_touch() returns trigger
  language plpgsql as $$ begin new.server_ts := clock_timestamp(); return new; end $$;
create trigger pusula_touch before insert or update on public.pusula_items
  for each row execute function public.pusula_touch();`;

const Sync = {
  cfg: null, timer: null, busy: false, again: false, status: 'off', error: '', lastOk: null,
  async load() { try { this.cfg = (await DB.getMeta('sync')) || null; } catch (e) { this.cfg = null; } this.status = this.enabled() ? 'idle' : 'off'; },
  async saveCfg() { await DB.setMeta('sync', this.cfg); },
  enabled() { return !!(this.cfg && this.cfg.refresh && this.cfg.url && this.cfg.key); },
  schedule(delay) { if (!this.enabled()) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), delay == null ? 2500 : delay); },
  hdr(auth) { const h = { apikey: this.cfg.key, 'Content-Type': 'application/json' }; if (auth) h.Authorization = 'Bearer ' + this.cfg.access; return h; },
  async errText(r) { try { const j = await r.json(); return j.message || j.msg || j.error_description || j.error || ('Hata ' + r.status); } catch (e) { return 'Hata ' + r.status; } },
  setSession(j) {
    this.cfg.access = j.access_token; this.cfg.refresh = j.refresh_token;
    this.cfg.exp = Date.now() + (j.expires_in || 3600) * 1000 - 90000;
    if (j.user) { this.cfg.uid = j.user.id; this.cfg.email = j.user.email; }
  },
  async auth(kind, email, password) {
    const url = this.cfg.url + (kind === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password');
    const r = await fetch(url, { method: 'POST', headers: this.hdr(false), body: JSON.stringify({ email, password }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.msg || j.error_description || j.message || ('Hata ' + r.status));
    if (!j.access_token) return 'confirm';
    this.setSession(j); this.cfg.lastPull = null; await this.saveCfg();
    // Tüm yerel kayıtları bir kez buluta gönder
    const all = []; S.items.forEach(it => { if (it.type !== 'settings' || it.updated) { it._dirty = 1; all.push(it); } });
    await DB.putMany(all);
    return 'ok';
  },
  async ensureToken() {
    if (Date.now() < (this.cfg.exp || 0)) return;
    const r = await fetch(this.cfg.url + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: this.hdr(false), body: JSON.stringify({ refresh_token: this.cfg.refresh }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 400 || r.status === 401) { this.cfg.refresh = null; await this.saveCfg(); }
      throw new Error('Oturum yenilenemedi, Ayarlar > Senkron’dan tekrar giriş yap');
    }
    this.setSession(j); await this.saveCfg();
  },
  setStatus(s, err) {
    this.status = s; this.error = err || '';
    if (s === 'ok') this.lastOk = new Date();
    const el = $('#syncStatus'); if (el) el.innerHTML = syncStatusHtml();
    const b = $('#syncBtn'); if (b) b.classList.toggle('spin', s === 'syncing');
  },
  async run() {
    if (!this.enabled()) return;
    if (this.busy) { this.again = true; return; }
    if (!navigator.onLine) { this.setStatus('offline'); return; }
    this.busy = true; this.setStatus('syncing');
    try {
      await this.ensureToken();
      const base = this.cfg.url + '/rest/v1/pusula_items';
      // 1) Gönder
      const dirty = []; S.items.forEach(it => { if (it._dirty) dirty.push(it); });
      for (let i = 0; i < dirty.length; i += 50) {
        const chunk = dirty.slice(i, i + 50);
        const sent = chunk.map(it => [it.id, it.updated]);
        const rows = chunk.map(it => ({ id: it.id, user_id: this.cfg.uid, type: it.type, data: strip(it), updated_at: it.updated || 0, deleted: !!it.deleted }));
        const r = await fetch(base + '?on_conflict=user_id,id', { method: 'POST', headers: Object.assign(this.hdr(true), { Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(rows) });
        if (!r.ok) throw new Error(await this.errText(r));
        const clean = [];
        sent.forEach(([id, upd]) => { const cur = S.items.get(id); if (cur && cur.updated === upd) { delete cur._dirty; clean.push(cur); } });
        await DB.putMany(clean);
      }
      // 2) Al
      const since = this.cfg.lastPull || '1970-01-01T00:00:00Z';
      const sinceQ = new Date(new Date(since.replace(/(\.\d{3})\d+/, '$1')).getTime() - 60000).toISOString();
      let maxTs = since, changed = false, offset = 0;
      for (;;) {
        const r = await fetch(base + '?select=id,data,updated_at,deleted,server_ts&server_ts=gt.' + encodeURIComponent(sinceQ) + '&order=server_ts.asc&limit=500&offset=' + offset, { headers: this.hdr(true) });
        if (!r.ok) throw new Error(await this.errText(r));
        const rows = await r.json(); const toPut = [];
        rows.forEach(row => {
          if (row.server_ts > maxTs) maxTs = row.server_ts;
          const loc = S.items.get(row.id);
          if (!loc || Number(row.updated_at) > (loc.updated || 0)) {
            const it = Object.assign({}, row.data, { id: row.id, updated: Number(row.updated_at), deleted: !!row.deleted });
            delete it._dirty; S.items.set(it.id, it); toPut.push(it); changed = true;
          }
        });
        await DB.putMany(toPut);
        if (rows.length < 500) break;
        offset += 500;
      }
      this.cfg.lastPull = maxTs; await this.saveCfg();
      this.setStatus('ok');
      if (changed) { thumbCache.clear(); if (!S.ink && !S.noteEd) render(); else applyTheme(); }
    } catch (e) {
      console.warn(e);
      this.setStatus(navigator.onLine ? 'error' : 'offline', e.message || String(e));
    } finally {
      this.busy = false;
      if (this.again) { this.again = false; this.schedule(800); }
    }
  }
};
function syncStatusHtml() {
  const s = Sync.status;
  if (!Sync.enabled()) return '<span class="status-dot"></span>Kapalı — veriler sadece bu cihazda';
  if (s === 'syncing') return '<span class="status-dot syncing"></span>Eşitleniyor…';
  if (s === 'ok') return '<span class="status-dot ok"></span>Güncel · ' + Sync.lastOk.toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' });
  if (s === 'offline') return '<span class="status-dot"></span>Çevrimdışı — internet gelince eşitlenecek';
  if (s === 'error') return '<span class="status-dot error"></span>Hata: ' + esc(Sync.error);
  return '<span class="status-dot ok"></span>Açık · ' + esc(Sync.cfg.email || '');
}

/* ===================== Bildirim (toast) ===================== */
function toast(msg, action, ms) {
  const t = $('#toast');
  t.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button data-act="toast-action">' + esc(action.label) + '</button>' : '');
  S.toastAction = action ? action.fn : null;
  t.classList.add('show'); clearTimeout(S.toastT);
  S.toastT = setTimeout(() => t.classList.remove('show'), ms || (action ? 7000 : 2600));
}

/* ===================== Panel (sheet) ===================== */
function openSheet(html, opts) {
  opts = opts || {};
  const root = $('#sheetRoot'); const wasOpen = root.classList.contains('open');
  root.innerHTML = (opts.full ? '' : '<div class="sheet-backdrop" data-act="close-sheet"></div>') + '<div class="sheet ' + (opts.full ? 'full' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
  root.classList.add('open');
  S.sheetClose = opts.onClose || null;
  document.body.style.overflow = 'hidden';
  if (!wasOpen) history.pushState({ sheet: 1 }, '');
}
function closeSheet(fromPop) {
  const root = $('#sheetRoot'); if (!root.classList.contains('open')) return;
  const fn = S.sheetClose; S.sheetClose = null;
  if (fn) { try { fn(); } catch (e) { console.error(e); } }
  root.classList.remove('open'); root.innerHTML = ''; document.body.style.overflow = '';
  S.draft = null;
  if (!fromPop && history.state && history.state.sheet) history.back();
}
window.addEventListener('popstate', () => closeSheet(true));
const sheetHead = (title) => '<div class="sheet-head"><h2>' + title + '</h2><button class="icon-btn" data-act="close-sheet" aria-label="Kapat">' + icon('x') + '</button></div>';
function seg(name, options, val) {
  return '<div class="seg" data-name="' + name + '">' + options.map(o => '<button type="button" class="' + (String(o[0]) === String(val) ? 'on' : '') + '" data-act="seg-pick" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
}
const segVal = (name) => { const b = $('#sheetRoot .seg[data-name="' + name + '"] button.on'); return b ? b.dataset.v : null; };
const fval = name => { const el = $('#sheetRoot [name="' + name + '"]'); return el ? el.value : ''; };

/* ===================== Ana çizim ===================== */
const TABS = [
  { k: 'today', label: 'Bugün', icon: 'today' },
  { k: 'plan', label: 'Planla', icon: 'plan' },
  { k: 'info', label: 'Bilgi', icon: 'info' },
  { k: 'settings', label: 'Ayarlar', icon: 'settings' }
];
const PLAN_LABELS = { tasks: 'Görevler', calendar: 'Takvim', habits: 'Alışkanlıklar' };
function visibleTabs() {
  const st = settings();
  return TABS.filter(t => t.k !== 'plan' || st.plan.some(m => m.on)).filter(t => t.k !== 'info' || st.notes);
}
function render() {
  applyTheme();
  const tabs = visibleTabs();
  if (!tabs.find(t => t.k === S.tab)) S.tab = 'today';
  $('#tabbar').innerHTML = tabs.map(t => '<button class="tab ' + (S.tab === t.k ? 'on' : '') + '" data-act="tab" data-k="' + t.k + '">' + icon(t.icon) + '<span>' + t.label + '</span></button>').join('');
  let title = '', actions = '', body = '';
  if (S.tab === 'today') { title = 'Bugün'; body = viewToday(); }
  else if (S.tab === 'plan') { body = viewPlan(); title = PLAN_LABELS[S.planSub] || 'Planla'; if (S.planSub === 'calendar') actions = '<button class="link" data-act="cal-today">Bugün</button>'; }
  else if (S.tab === 'info') { title = 'Notlar'; body = viewNotes(); }
  else { title = 'Ayarlar'; body = viewSettings(); }
  if ((Sync.enabled() || Drive.on()) && S.tab !== 'settings') actions += '<button id="syncBtn" class="icon-btn ' + (Sync.status === 'syncing' || Drive.status === 'syncing' ? 'spin ' : '') + (Drive.status === 'needauth' || Drive.status === 'error' ? 'warn' : '') + '" data-act="sync-now" aria-label="Eşitle">' + icon('sync') + '</button>';
  $('#pageTitle').textContent = title;
  $('#topActions').innerHTML = actions;
  $('#view').innerHTML = body;
  $('#fab').hidden = S.tab === 'settings';
}

/* ----- Planla ----- */
function viewPlan() {
  const mods = settings().plan.filter(m => m.on);
  if (!mods.find(m => m.k === S.planSub)) S.planSub = mods[0].k;
  let h = mods.length > 1 ? '<div class="seg plan-seg">' + mods.map(m => '<button class="' + (m.k === S.planSub ? 'on' : '') + '" data-act="plan-sub" data-k="' + m.k + '">' + PLAN_LABELS[m.k] + '</button>').join('') + '</div>' : '';
  h += S.planSub === 'tasks' ? viewTasks() : S.planSub === 'calendar' ? viewCalendar() : viewHabits();
  return h;
}

/* ----- Bugün ----- */
function viewToday() {
  const st = settings(); const t0 = today(); const h = new Date().getHours();
  const greet = h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
  const pills = [];
  if (planOn('tasks')) { const n = list('task').filter(t => !t.done && t.due && t.due <= t0).length; pills.push('<button class="pill" data-act="go" data-k="tasks"><b>' + n + '</b> görev</button>'); }
  if (planOn('calendar')) { const n = list('event').filter(e => e.date === t0).length; pills.push('<button class="pill" data-act="go" data-k="calendar"><b>' + n + '</b> etkinlik</button>'); }
  if (planOn('habits')) { const hs = list('habit').filter(x => habitScheduled(x, t0)); const d = hs.filter(x => (x.log || {})[t0]).length; if (hs.length) pills.push('<button class="pill" data-act="go" data-k="habits"><b>' + d + '/' + hs.length + '</b> alışkanlık</button>'); }
  let html = '<div class="hero"><div class="hero-greet">' + greet + (st.name ? ', ' + esc(st.name) : '') + '</div><div class="hero-date">' + fmtLong(t0) + '</div><div class="hero-sum">' + pills.join('') + '</div></div><div class="grid-cards">';
  const avail = { tasks: planOn('tasks'), events: planOn('calendar'), habits: planOn('habits'), goals: planOn('habits'), pinned: st.notes };
  st.today.forEach(c => { if (c.on && avail[c.k] && TODAY_CARDS[c.k]) html += TODAY_CARDS[c.k](); });
  html += '</div>';
  if (!st.today.some(c => c.on && avail[c.k])) html += '<div class="empty">Bugün ekranı boş. Ayarlar’dan kart ekleyebilirsin.</div>';
  return html;
}
function card(ic, title, body, go) {
  const head = go
    ? '<div class="card-head go" data-act="go" data-k="' + go + '" role="link"><div class="card-title">' + icon(ic, 'sm') + title + '</div><span class="chev">' + icon('right', 'sm') + '</span></div>'
    : '<div class="card-head"><div class="card-title">' + icon(ic, 'sm') + title + '</div></div>';
  return '<section class="card">' + head + body + '</section>';
}
const TODAY_CARDS = {
  tasks() {
    const t0 = today(); const all = list('task');
    const tasks = all.filter(t => !t.done && t.due && t.due <= t0).sort(taskSort);
    const undated = all.filter(t => !t.done && !t.due).length;
    const body = tasks.length
      ? '<div class="list">' + tasks.slice(0, 8).map(taskRow).join('') + '</div>' + (tasks.length > 8 ? '<div class="more">+' + (tasks.length - 8) + ' görev daha</div>' : '')
      : '<div class="empty">Bugün için görev yok.' + (undated ? ' Tarihsiz ' + undated + ' görevin var.' : '') + '</div>';
    return card('task', 'Görevler', body, 'tasks');
  },
  events() {
    const ev = list('event').filter(e => e.date === today()).sort(eventSort);
    return card('event', 'Takvim', ev.length ? ev.map(eventRow).join('') : '<div class="empty">Bugün takvimin boş.</div>', 'calendar');
  },
  habits() {
    const t0 = today(); const hs = list('habit').filter(x => habitScheduled(x, t0)).sort((a, b) => (a.created || 0) - (b.created || 0));
    const body = hs.length ? '<div class="habit-list">' + hs.map(x => {
      const on = !!(x.log || {})[t0];
      return '<button class="habit-chip ' + (on ? 'on' : '') + '" data-act="habit-toggle" data-id="' + x.id + '" data-d="' + t0 + '"><span class="hc">' + icon('check') + '</span><span class="grow">' + esc(x.title) + '</span><span class="streak">' + icon('flame') + streak(x) + '</span></button>';
    }).join('') + '</div>' : '<div class="empty">Bugün için alışkanlık yok.</div>';
    return card('habit', 'Alışkanlıklar', body, 'habits');
  },
  goals() {
    const gs = list('goal').filter(g => (g.current || 0) < (g.target || 0)).sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')).slice(0, 4);
    if (!gs.length) return '';
    return card('goal', 'Hedefler', gs.map(g => {
      const pct = goalPct(g);
      return '<div class="mini-goal" data-act="edit-goal" data-id="' + g.id + '"><div class="mini-goal-top"><span>' + esc(g.title) + '</span><span class="muted sm">' + pct + '%</span></div><div class="bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join(''), 'habits');
  },
  pinned() {
    const ns = list('note').filter(n => n.pinned).sort((a, b) => b.updated - a.updated).slice(0, 4);
    if (!ns.length) return '';
    return card('pin', 'Sabitlenen notlar', ns.map(n => '<div class="row" data-act="open-note" data-id="' + n.id + '"><div class="row-main"><div class="row-title">' + (n.kind === 'ink' ? icon('pen', 'xs') + ' ' : '') + esc(noteTitle(n)) + '</div>' + (n.kind !== 'ink' && n.body ? '<div class="row-meta">' + esc(n.body.slice(0, 90)) + '</div>' : '') + '</div></div>').join(''), 'notes');
  }
};

/* ----- Görevler ----- */
function taskRow(t) {
  const t0 = today(); const over = t.due && t.due < t0 && !t.done;
  const meta = [];
  if (t.due) meta.push('<span class="' + (over ? 'danger' : '') + '">' + relDay(t.due) + (t.time ? ' · ' + t.time : '') + '</span>');
  else if (t.time) meta.push('<span>' + t.time + '</span>');
  if (t.repeat && t.repeat !== 'none') meta.push('<span>' + icon('repeat', 'xs') + ' ' + repeatLabel(t.repeat) + '</span>');
  const tg = tagChips(t.tags); if (tg) meta.push(tg);
  if (t.notes) meta.push('<span>' + icon('note', 'xs') + '</span>');
  return '<div class="row ' + (t.done ? 'done' : '') + '" data-act="edit-task" data-id="' + t.id + '"><button class="check ' + (t.done ? 'on' : '') + ' p' + (t.priority || 0) + '" data-act="toggle-task" data-id="' + t.id + '" aria-label="Tamamla">' + icon('check') + '</button><div class="row-main"><div class="row-title">' + esc(t.title) + '</div>' + (meta.length ? '<div class="row-meta">' + meta.join('') + '</div>' : '') + '</div></div>';
}
function viewTasks() {
  const f = S.taskFilter, t0 = today();
  let tasks = list('task');
  if (S.taskTag && tagName(S.taskTag)) tasks = tasks.filter(t => (t.tags || []).includes(S.taskTag)); else S.taskTag = null;
  const filters = [['open', 'Açık'], ['today', 'Bugün'], ['upcoming', 'Yaklaşan'], ['done', 'Biten']];
  let h = '<div class="chips filter-row">' + filters.map(x => '<button class="chip ' + (f === x[0] ? 'on' : '') + '" data-act="task-filter" data-k="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
  const tags = tagsOf('task');
  if (tags.length) h += '<div class="chips tag-row">' + tags.map(tg => '<button class="chip sm ' + (S.taskTag === tg.id ? 'on' : '') + '" data-act="task-tagf" data-id="' + tg.id + '">#' + esc(tg.name) + '</button>').join('') + '</div>';
  if (f !== 'done') h += '<form class="quick-add" data-form="quick-task"><input class="input" name="q" placeholder="' + (f === 'today' ? 'Bugün için görev ekle…' : 'Hızlı görev ekle…') + '" autocomplete="off" enterkeyhint="done"><button class="icon-btn" type="submit" aria-label="Ekle">' + icon('plus') + '</button></form>';
  const open = tasks.filter(t => !t.done).sort(taskSort);
  const section = (title, arr, cls) => arr.length ? '<div class="section-title ' + (cls || '') + '"><span>' + title + '<span class="count">' + arr.length + '</span></span></div><div class="card">' + arr.map(taskRow).join('') + '</div>' : '';
  let body = '';
  if (f === 'open') {
    const tm = addDays(t0, 1), wk = addDays(t0, 7);
    const g = { over: [], today: [], tom: [], week: [], later: [], none: [] };
    open.forEach(t => { if (!t.due) g.none.push(t); else if (t.due < t0) g.over.push(t); else if (t.due === t0) g.today.push(t); else if (t.due === tm) g.tom.push(t); else if (t.due <= wk) g.week.push(t); else g.later.push(t); });
    body = section('Gecikmiş', g.over, 'danger') + section('Bugün', g.today) + section('Yarın', g.tom) + section('Bu hafta', g.week) + section('Daha sonra', g.later) + section('Tarihsiz', g.none);
    if (!open.length) body = '<div class="card"><div class="empty">Açık görev yok. Yukarıdan hızlıca ekleyebilirsin.</div></div>';
  } else if (f === 'today') {
    const arr = open.filter(t => t.due && t.due <= t0);
    body = arr.length ? section('Bugün ve gecikmiş', arr) : '<div class="card"><div class="empty">Bugün için görev yok.</div></div>';
  } else if (f === 'upcoming') {
    const arr = open.filter(t => t.due && t.due > t0);
    body = arr.length ? section('Yaklaşan', arr) : '<div class="card"><div class="empty">Yaklaşan tarihli görev yok.</div></div>';
  } else {
    const arr = tasks.filter(t => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 150);
    body = arr.length ? section('Tamamlanan', arr) : '<div class="card"><div class="empty">Henüz tamamlanan görev yok.</div></div>';
  }
  return h + body;
}
async function toggleTask(id) {
  const t = S.items.get(id); if (!t) return;
  if (!t.done && t.repeat && t.repeat !== 'none') {
    let n = nextDate(t.due || today(), t.repeat);
    while (n <= today()) n = nextDate(n, t.repeat);
    t.due = n; t.lastDone = Date.now();
    await save(t); toast('Tamamlandı · sonraki: ' + relDay(n));
    return;
  }
  t.done = !t.done; t.doneAt = t.done ? Date.now() : null;
  await save(t);
  if (t.done) toast('Görev tamamlandı', { label: 'Geri al', fn: async () => { t.done = false; t.doneAt = null; await save(t); } });
}
function editTask(t) {
  const isNew = !t;
  const d = t ? clone(t) : { id: uid(), type: 'task', title: '', notes: '', due: (S.tab === 'today' || S.taskFilter === 'today') ? today() : null, time: null, priority: 0, repeat: 'none', tags: S.taskTag ? [S.taskTag] : [], done: false };
  S.draft = d;
  openSheet(sheetHead(isNew ? 'Yeni görev' : 'Görevi düzenle') +
    '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Ne yapılacak?" value="' + esc(d.title) + '" autocomplete="off" enterkeyhint="done">' +
    '<div class="field"><textarea class="input" name="notes" rows="2" placeholder="Not ekle (isteğe bağlı)">' + esc(d.notes) + '</textarea></div>' +
    '<div class="field-row"><label class="field"><span>Tarih</span><input type="date" class="input" name="due" value="' + (d.due || '') + '"></label><label class="field"><span>Saat</span><input type="time" class="input" name="time" value="' + (d.time || '') + '"></label></div>' +
    '<div class="quick-dates"><button type="button" class="chip sm" data-act="set-date" data-v="0">Bugün</button><button type="button" class="chip sm" data-act="set-date" data-v="1">Yarın</button><button type="button" class="chip sm" data-act="set-date" data-v="7">1 hafta sonra</button><button type="button" class="chip sm" data-act="set-date" data-v="">Tarihsiz</button></div>' +
    '<div class="field"><span>Öncelik</span>' + seg('priority', [[0, 'Yok'], [1, 'Düşük'], [2, 'Orta'], [3, 'Yüksek']], d.priority || 0) + '</div>' +
    '<label class="field"><span>Tekrar</span><select class="input" name="repeat">' + REPEATS.map(r => '<option value="' + r[0] + '" ' + (d.repeat === r[0] ? 'selected' : '') + '>' + r[1] + '</option>').join('') + '</select></label>' +
    '<div class="field"><span>Etiketler</span>' + tagPicker('task', d.tags) + '</div>' +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="delete-task">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="save-task">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveTask() {
  const d = S.draft; const title = fval('title').trim();
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); $('#sheetRoot [name=title]').focus(); return; }
  const base = S.items.get(d.id) || d;
  Object.assign(base, { title, notes: fval('notes').trim(), due: fval('due') || null, time: fval('time') || null, priority: Number(segVal('priority') || 0), repeat: fval('repeat'), tags: pickedTags($('#sheetRoot')) });
  if (base.repeat !== 'none' && !base.due) base.due = today();
  closeSheet(); await save(base);
}

/* ----- Takvim ----- */
const EV_COLORS = ['', '#E57B70', '#E2B54E', '#6CC08F', '#3CC4B6', '#B39AE6', '#E58A9A'];
function eventRow(e) {
  return '<div class="row" data-act="edit-event" data-id="' + e.id + '"><div class="ev-time">' + (e.allDay || !e.start ? 'Tüm gün' : e.start + (e.end ? '<small>' + e.end + '</small>' : '')) + '</div><div class="ev-bar" style="background:' + (e.color || 'var(--accent)') + '"></div><div class="row-main"><div class="row-title">' + esc(e.title) + '</div>' + (e.notes ? '<div class="row-meta">' + esc(e.notes.slice(0, 100)) + '</div>' : '') + '</div></div>';
}
function viewCalendar() {
  const t0 = today(); const m = S.calMonth || S.calSel.slice(0, 7); S.calMonth = m;
  const first = m + '-01'; const start = addDays(first, -dow(first));
  const dim = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const cellsN = Math.ceil((dow(first) + dim) / 7) * 7;
  const marks = {};
  list('event').forEach(e => { if (e.date) { marks[e.date] = marks[e.date] || { e: 0, t: 0 }; marks[e.date].e++; } });
  list('task').forEach(t => { if (t.due && !t.done) { marks[t.due] = marks[t.due] || { e: 0, t: 0 }; marks[t.due].t++; } });
  let cells = '';
  for (let i = 0; i < cellsN; i++) {
    const d = addDays(start, i); const mk = marks[d];
    cells += '<button class="cal-cell ' + (d.slice(0, 7) !== m ? 'out ' : '') + (d === t0 ? 'today ' : '') + (d === S.calSel ? 'sel' : '') + '" data-act="cal-day" data-d="' + d + '"><span class="num">' + (+d.slice(8)) + '</span><span class="dots">' + (mk && mk.e ? '<i class="dot"></i>' : '') + (mk && mk.t ? '<i class="dot t"></i>' : '') + '</span></button>';
  }
  const label = parseYmd(first).toLocaleDateString(TR, { month: 'long', year: 'numeric' });
  const ev = list('event').filter(e => e.date === S.calSel).sort(eventSort);
  const tk = planOn('tasks') ? list('task').filter(t => t.due === S.calSel).sort(taskSort) : [];
  const agenda = '<section class="card"><div class="card-head"><div class="card-title">' + relDayLong(S.calSel) + '</div><button class="link" data-act="add-event">+ Etkinlik</button></div>' +
    (ev.length || tk.length ? ev.map(eventRow).join('') + tk.map(taskRow).join('') : '<div class="empty">Bu gün için kayıt yok.</div>') + '</section>';
  return '<div class="cal-wrap"><section class="card"><div class="cal-head"><button class="icon-btn" data-act="cal-prev" aria-label="Önceki ay">' + icon('left') + '</button><div class="cal-month">' + label + '</div><button class="icon-btn" data-act="cal-next" aria-label="Sonraki ay">' + icon('right') + '</button></div><div class="cal-grid">' + DAYS.map(x => '<div class="cal-dow">' + x + '</div>').join('') + cells + '</div></section>' + agenda + '</div>';
}
function relDayLong(s) { const r = relDay(s); return (r === 'Bugün' || r === 'Yarın' || r === 'Dün') ? r + ' · ' + fmtShort(s) : fmtLong(s); }
function shiftMonth(n) { const d = parseYmd(S.calMonth + '-01'); d.setMonth(d.getMonth() + n); S.calMonth = ymd(d).slice(0, 7); render(); }
function editEvent(e, date) {
  const isNew = !e;
  const d = e ? clone(e) : { id: uid(), type: 'event', title: '', date: date || today(), allDay: false, start: '', end: '', notes: '', color: '' };
  S.draft = d;
  openSheet(sheetHead(isNew ? 'Yeni etkinlik' : 'Etkinliği düzenle') + '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Etkinlik adı" value="' + esc(d.title) + '" autocomplete="off" enterkeyhint="done">' +
    '<div class="field-row"><label class="field"><span>Tarih</span><input type="date" class="input" name="date" value="' + d.date + '"></label><div class="field toggle-field"><span>Tüm gün</span><button type="button" class="switch ' + (d.allDay ? 'on' : '') + '" data-act="switch" data-name="allDay" aria-label="Tüm gün"></button></div></div>' +
    '<div class="field-row times ' + (d.allDay ? 'hide' : '') + '"><label class="field"><span>Başlangıç</span><input type="time" class="input" name="start" value="' + (d.start || '') + '"></label><label class="field"><span>Bitiş</span><input type="time" class="input" name="end" value="' + (d.end || '') + '"></label></div>' +
    '<div class="field"><span>Renk</span><div class="chips">' + EV_COLORS.map(c => '<button type="button" class="swatch ' + ((d.color || '') === c ? 'on' : '') + '" data-act="pick-color" data-c="' + c + '" style="background:' + (c || 'var(--accent)') + '" aria-label="Renk"></button>').join('') + '</div></div>' +
    '<div class="field"><span>Not</span><textarea class="input" name="notes" rows="3" placeholder="Yer, detay…">' + esc(d.notes) + '</textarea></div>' +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="delete-event">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="save-event">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveEvent() {
  const d = S.draft; const title = fval('title').trim();
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  const allDay = $('#sheetRoot .switch[data-name=allDay]').classList.contains('on');
  const base = S.items.get(d.id) || d;
  Object.assign(base, { title, date: fval('date') || today(), allDay, start: allDay ? '' : fval('start'), end: allDay ? '' : fval('end'), notes: fval('notes').trim(), color: d.color || '' });
  S.calSel = base.date; S.calMonth = base.date.slice(0, 7);
  closeSheet(); await save(base);
}

/* ----- Alışkanlık & hedef ----- */
const goalPct = g => Math.max(0, Math.min(100, g.target ? Math.round((g.current || 0) / g.target * 100) : 0));
function viewHabits() {
  const t0 = today(); const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(t0, -i));
  const habits = list('habit').sort((a, b) => (a.created || 0) - (b.created || 0));
  const goals = list('goal').sort((a, b) => (goalPct(a) >= 100) - (goalPct(b) >= 100) || (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  let h = '<div class="section-title first"><span>Alışkanlıklar</span><button class="link" data-act="new-habit">+ Ekle</button></div>';
  if (!habits.length) h += '<div class="card"><div class="empty">Henüz alışkanlık yok. Her gün yapmak istediğin küçük bir şeyle başla: su içmek, 10 dakika okumak…</div></div>';
  else h += '<div class="grid-cards">' + habits.map(hb => {
    const log = hb.log || {};
    return '<section class="card"><div class="habit-top" data-act="edit-habit" data-id="' + hb.id + '"><div class="row-title">' + esc(hb.title) + '</div><span class="streak">' + icon('flame') + streak(hb) + '</span></div><div class="week">' +
      days.map(d => { const on = !!log[d]; return '<button class="wd ' + (on ? 'on ' : '') + (habitScheduled(hb, d) ? '' : 'off ') + (d === t0 ? 'today' : '') + '" data-act="habit-toggle" data-id="' + hb.id + '" data-d="' + d + '"><span>' + DAYS[dow(d)] + '</span><b>' + (on ? icon('check') : +d.slice(8)) + '</b></button>'; }).join('') + '</div></section>';
  }).join('') + '</div>';
  h += '<div class="section-title"><span>Hedefler</span><button class="link" data-act="new-goal">+ Ekle</button></div>';
  if (!goals.length) h += '<div class="card"><div class="empty">Ölçülebilir bir hedef ekle: “12 kitap oku”, “5.000 ₺ biriktir”…</div></div>';
  else h += '<div class="grid-cards">' + goals.map(g => {
    const pct = goalPct(g); const left = g.deadline ? daysBetween(today(), g.deadline) : null;
    return '<section class="card"><div class="habit-top" data-act="edit-goal" data-id="' + g.id + '"><div class="row-title">' + esc(g.title) + '</div><span class="muted sm">' + (pct >= 100 ? '✓ Tamam' : pct + '%') + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div><div class="goal-foot"><span class="muted sm">' + fmtNum(g.current) + ' / ' + fmtNum(g.target) + ' ' + esc(g.unit || '') + (left != null ? ' · ' + (left >= 0 ? left + ' gün kaldı' : 'süre doldu') : '') + '</span><div class="goal-ctrl"><button class="mini-btn" data-act="goal-step" data-id="' + g.id + '" data-dir="-1" aria-label="Azalt">−</button><button class="mini-btn" data-act="goal-step" data-id="' + g.id + '" data-dir="1" aria-label="Artır">+</button></div></div></section>';
  }).join('') + '</div>';
  return h;
}
async function toggleHabit(id, d) {
  const hb = S.items.get(id); if (!hb || d > today()) return;
  hb.log = hb.log || {};
  if (hb.log[d]) delete hb.log[d]; else hb.log[d] = true;
  await save(hb);
}
function editHabit(hb) {
  const isNew = !hb; const d = hb ? clone(hb) : { id: uid(), type: 'habit', title: '', days: [0, 1, 2, 3, 4, 5, 6], log: {} };
  S.draft = d; const days = d.days && d.days.length ? d.days : [0, 1, 2, 3, 4, 5, 6];
  openSheet(sheetHead(isNew ? 'Yeni alışkanlık' : 'Alışkanlığı düzenle') + '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Örn. 2 litre su iç" value="' + esc(d.title) + '" autocomplete="off" enterkeyhint="done">' +
    '<div class="field"><span>Hangi günler?</span><div class="day-chips">' + DAYS.map((x, i) => '<button type="button" class="chip ' + (days.includes(i) ? 'on' : '') + '" data-act="toggle-on" data-i="' + i + '">' + x + '</button>').join('') + '</div></div>' +
    (isNew ? '' : '<div class="field"><span>Seri</span><div class="muted">' + streak(d) + ' gün · toplam ' + Object.keys(d.log || {}).length + ' kez yapıldı</div></div>') +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="delete-habit">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="save-habit">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveHabit() {
  const d = S.draft; const title = fval('title').trim();
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  const days = $$('#sheetRoot .day-chips .chip.on').map(b => +b.dataset.i);
  if (!days.length) { toast('En az bir gün seç'); return; }
  const base = S.items.get(d.id) || d;
  Object.assign(base, { title, days });
  closeSheet(); await save(base);
}
function editGoal(g) {
  const isNew = !g; const d = g ? clone(g) : { id: uid(), type: 'goal', title: '', current: 0, target: 10, unit: '', step: 1, deadline: '' };
  S.draft = d;
  openSheet(sheetHead(isNew ? 'Yeni hedef' : 'Hedefi düzenle') + '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Örn. 12 kitap oku" value="' + esc(d.title) + '" autocomplete="off" enterkeyhint="done">' +
    '<div class="field-row"><label class="field"><span>Şu an</span><input type="number" inputmode="decimal" step="any" class="input" name="current" value="' + (d.current || 0) + '"></label><label class="field"><span>Hedef</span><input type="number" inputmode="decimal" step="any" class="input" name="target" value="' + (d.target || '') + '"></label></div>' +
    '<div class="field-row"><label class="field"><span>Birim</span><input class="input" name="unit" placeholder="kitap, km, ₺" value="' + esc(d.unit || '') + '"></label><label class="field"><span>+/− adımı</span><input type="number" inputmode="decimal" step="any" class="input" name="step" value="' + (d.step || 1) + '"></label></div>' +
    '<label class="field"><span>Son tarih (isteğe bağlı)</span><input type="date" class="input" name="deadline" value="' + (d.deadline || '') + '"></label>' +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="delete-goal">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="save-goal">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveGoal() {
  const d = S.draft; const title = fval('title').trim(); const target = parseFloat(fval('target'));
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  if (!(target > 0)) { $('#sheetRoot [name=target]').classList.add('err'); return; }
  const base = S.items.get(d.id) || d;
  Object.assign(base, { title, target, current: parseFloat(fval('current')) || 0, unit: fval('unit').trim(), step: parseFloat(fval('step')) || 1, deadline: fval('deadline') || '' });
  closeSheet(); await save(base);
}
async function goalStep(id, dir) {
  const g = S.items.get(id); if (!g) return;
  const before = goalPct(g);
  g.current = r2(Math.max(0, (g.current || 0) + dir * (g.step || 1)));
  await save(g);
  if (before < 100 && goalPct(g) >= 100) toast('Hedefe ulaştın! 🎯');
}

/* ----- Notlar ----- */
const noteTitle = n => n.title || (n.kind === 'ink' ? 'Kalem notu' : (n.body || '').split('\n')[0].slice(0, 60) || 'Başlıksız not');
function viewNotes() {
  const tags = tagsOf('note');
  return '<div class="search">' + icon('search') + '<input id="noteSearch" placeholder="Notlarda ara" value="' + esc(S.noteQuery) + '" autocomplete="off" enterkeyhint="search"></div>' +
    (tags.length ? '<div class="chips tag-row">' + tags.map(t => '<button class="chip sm ' + (S.noteTag === t.id ? 'on' : '') + '" data-act="note-tagf" data-id="' + t.id + '">#' + esc(t.name) + '</button>').join('') + '</div>' : '') +
    '<div class="note-actions"><button class="btn" data-act="new-note">' + icon('note') + ' Yeni not</button><button class="btn" data-act="new-ink">' + icon('pen') + ' Kalem notu</button></div>' +
    '<div id="notesList">' + notesList() + '</div>';
}
function notesList() {
  const q = lower(S.noteQuery.trim());
  if (S.noteTag && !tagName(S.noteTag)) S.noteTag = null;
  let notes = list('note');
  if (S.noteTag) notes = notes.filter(n => (n.tags || []).includes(S.noteTag));
  if (q) notes = notes.filter(n => lower(n.title + ' ' + (n.body || '') + ' ' + (n.tags || []).map(tagName).join(' ')).includes(q));
  notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updated - a.updated);
  if (!notes.length) return '<div class="card"><div class="empty">' + (q || S.noteTag ? 'Eşleşen not yok.' : 'Henüz not yok. Yazarak ya da kalemle ilk notunu oluştur.') + '</div></div>';
  return '<div class="notes-grid">' + notes.map(n => {
    const meta = '<div class="note-meta">' + (n.pinned ? '<span class="pin">' + icon('pin', 'xs') + '</span>' : '') + '<span>' + relDay(ymd(new Date(n.updated))) + '</span>' + tagChips(n.tags) + '</div>';
    if (n.kind === 'ink') return '<button class="note-card" data-act="open-note" data-id="' + n.id + '"><img alt="" src="' + inkThumb(n) + '">' + (n.title ? '<h3>' + esc(n.title) + '</h3>' : '') + meta + '</button>';
    return '<button class="note-card" data-act="open-note" data-id="' + n.id + '">' + (n.title ? '<h3>' + esc(n.title) + '</h3>' : '') + (n.body ? '<p>' + esc(n.body.slice(0, 400)) + '</p>' : '') + meta + '</button>';
  }).join('') + '</div>';
}
function openNote(n) {
  if (n && n.kind === 'ink') return openInk(n);
  const isNew = !n;
  const d = n || { id: uid(), type: 'note', kind: 'text', title: '', body: '', tags: S.noteTag ? [S.noteTag] : [], pinned: false };
  S.noteEd = { d, saved: !isNew, deleted: false, t: null };
  openSheet('<div class="ed-top"><button class="icon-btn" data-act="close-sheet" aria-label="Geri">' + icon('back') + '</button><div class="grow"></div><button class="icon-btn ' + (d.pinned ? 'on' : '') + '" data-act="note-pin" aria-label="Sabitle">' + icon('pin') + '</button><button class="icon-btn" data-act="note-delete" aria-label="Sil">' + icon('trash') + '</button></div>' +
    '<div class="note-ed"><input class="input big" id="noteTitle" placeholder="Başlık" value="' + esc(d.title) + '" autocomplete="off"><textarea id="noteBody" class="note-body" placeholder="Yazmaya başla…">' + esc(d.body) + '</textarea><div class="note-tags">' + tagPicker('note', d.tags) + '</div></div>',
    { full: true, onClose: noteFinish });
  if (isNew) setTimeout(() => { const b = $('#noteBody'); if (b) b.focus(); }, 80);
}
function noteChanged() { const E = S.noteEd; if (!E) return; clearTimeout(E.t); E.t = setTimeout(noteSave, 700); }
async function noteSave() {
  const E = S.noteEd; if (!E || E.deleted) return;
  const d = E.d; if (!d.title.trim() && !d.body.trim() && !E.saved) return;
  E.saved = true; await save(d, { silent: true });
}
function noteTagsSync() { if (!S.noteEd) return; S.noteEd.d.tags = pickedTags($('#sheetRoot')); noteChanged(); }
function noteFinish() {
  const E = S.noteEd; S.noteEd = null; if (!E) return;
  clearTimeout(E.t);
  if (!E.deleted) {
    const empty = !E.d.title.trim() && !E.d.body.trim();
    if (empty && E.saved) { E.d.deleted = true; save(E.d, { silent: true }); }
    else if (!empty) save(E.d, { silent: true });
  }
  setTimeout(render, 0);
}

/* ----- Kalem notu (tablet kalemi) ----- */
const INK_W = 1000, INK_PAGE = 1414;
const INK_COLORS = ['auto', '#E57B70', '#E2B54E', '#6CC08F', '#5EAECB', '#B39AE6'];
const INK_WIDTHS = [1.6, 3, 5.5];
const PAPERS = ['blank', 'lines', 'grid'];
const PAPER_LABELS = { blank: 'Boş kâğıt', lines: 'Çizgili kâğıt', grid: 'Kareli kâğıt' };
const thumbCache = new Map();
function inkColor(c) { if (c && c !== 'auto') return c; return currentPalette()[4]; }
function drawStroke(ctx, s, from) {
  const p = s.pts; const n = p.length / 3; if (!n) return;
  ctx.strokeStyle = inkColor(s.c); ctx.fillStyle = ctx.strokeStyle; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (s.t === 'm') {
    ctx.save(); ctx.globalAlpha = 0.32; ctx.lineWidth = s.w * 4.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (let i = 1; i < n; i++) ctx.lineTo(p[i * 3], p[i * 3 + 1]);
    if (n === 1) ctx.lineTo(p[0] + 0.01, p[1]);
    ctx.stroke(); ctx.restore(); return;
  }
  if (n === 1) { ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(0.6, s.w * (0.35 + 0.9 * p[2]) / 2), 0, Math.PI * 2); ctx.fill(); return; }
  for (let i = Math.max(1, from || 0); i < n; i++) {
    const a = (i - 1) * 3, b = i * 3;
    ctx.lineWidth = s.w * (0.35 + 0.9 * (p[a + 2] + p[b + 2]) / 2);
    ctx.beginPath(); ctx.moveTo(p[a], p[a + 1]); ctx.lineTo(p[b], p[b + 1]); ctx.stroke();
  }
}
function inkThumb(n) {
  const theme = document.documentElement.dataset.theme;
  const key = n.updated + ':' + theme + ':' + currentPalette()[1]; const hit = thumbCache.get(n.id);
  if (hit && hit.key === key) return hit.url;
  const W = 360, H = 224; const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface2').trim() || '#1B2832'; ctx.fillRect(0, 0, W, H);
  const strokes = n.strokes || [];
  let minY = Infinity; strokes.forEach(s => { for (let i = 1; i < s.pts.length; i += 3) if (s.pts[i] < minY) minY = s.pts[i]; });
  const sc = W / INK_W; const offY = isFinite(minY) ? Math.max(0, minY - 40) : 0;
  ctx.setTransform(sc, 0, 0, sc, 0, -offY * sc);
  strokes.forEach(s => drawStroke(ctx, s));
  const url = c.toDataURL('image/png'); thumbCache.set(n.id, { key, url }); return url;
}
const fingerDraws = () => { const E = S.ink; return E.finger === 'draw' || (E.finger === 'auto' && !E.penSeen); };
function openInk(note) {
  const isNew = !note;
  const n = note || { id: uid(), type: 'note', kind: 'ink', title: '', strokes: [], pages: 1, paper: settings().paper || 'lines', tags: [], pinned: false };
  S.ink = { n, saved: !isNew, deleted: false, strokes: (n.strokes || []).slice(), pages: n.pages || 1, paper: n.paper || 'lines', tool: 'pen', color: 'auto', wi: 0, undo: [], redo: [], finger: lsGet('pusula.finger', 'auto'), penSeen: lsGet('pusula.penSeen', '') === '1', changed: false, active: null, scrollDrag: null, cur: null };
  openSheet('<div class="ed-top"><button class="icon-btn" data-act="close-sheet" aria-label="Kaydet ve kapat">' + icon('back') + '</button><input class="ink-title" id="inkTitle" placeholder="Başlıksız kalem notu" value="' + esc(n.title) + '" autocomplete="off"><button class="icon-btn ' + (n.pinned ? 'on' : '') + '" data-act="ink-pin" aria-label="Sabitle">' + icon('pin') + '</button><button class="icon-btn" data-act="ink-delete" aria-label="Sil">' + icon('trash') + '</button></div>' +
    '<div class="ink-bar" id="inkBar">' + inkBarHtml() + '</div><div class="ink-scroll" id="inkScroll"><div class="ink-paper" id="inkPaper"><canvas id="inkCanvas"></canvas></div><div class="ink-more"><button class="btn" data-act="ink-add-page">' + icon('plus') + ' Sayfa ekle</button></div></div>',
    { full: true, onClose: inkFinish });
  requestAnimationFrame(() => { inkLayout(); inkBind(); });
}
function inkBarHtml() {
  const E = S.ink;
  return [['pen', 'Kalem'], ['marker', 'Fosforlu kalem'], ['eraser', 'Silgi']].map(x => '<button class="icon-btn ' + (E.tool === x[0] ? 'on' : '') + '" data-act="ink-tool" data-k="' + x[0] + '" aria-label="' + x[1] + '">' + icon(x[0]) + '</button>').join('') +
    '<span class="sep"></span>' + INK_COLORS.map(c => '<button class="swatch ' + (E.color === c ? 'on' : '') + '" style="background:' + (c === 'auto' ? 'var(--text)' : c) + '" data-act="ink-color" data-c="' + c + '" aria-label="Renk"></button>').join('') +
    '<span class="sep"></span>' + INK_WIDTHS.map((w, i) => '<button class="wbtn ' + (E.wi === i ? 'on' : '') + '" data-act="ink-width" data-i="' + i + '" aria-label="Kalınlık"><i style="width:' + (4 + i * 4) + 'px;height:' + (4 + i * 4) + 'px"></i></button>').join('') +
    '<span class="sep"></span><button class="icon-btn" data-act="ink-undo" aria-label="Geri al" ' + (E.undo.length ? '' : 'disabled') + '>' + icon('undo') + '</button><button class="icon-btn" data-act="ink-redo" aria-label="Yinele" ' + (E.redo.length ? '' : 'disabled') + '>' + icon('redo') + '</button>' +
    '<span class="sep"></span><button class="icon-btn" data-act="ink-paper" aria-label="Kâğıt türü">' + icon('paper') + '</button><button class="icon-btn ' + (fingerDraws() ? 'on' : '') + '" data-act="ink-finger" aria-label="Parmakla çizim">' + icon('hand') + '</button>';
}
const inkBarRefresh = () => { const b = $('#inkBar'); if (b && S.ink) { const sl = b.scrollLeft; b.innerHTML = inkBarHtml(); b.scrollLeft = sl; } };
function inkLayout() {
  const E = S.ink; if (!E) return; const paper = $('#inkPaper'), c = $('#inkCanvas'); if (!paper || !c) return;
  const w = paper.clientWidth; if (!w) return;
  const s = w / INK_W; const h = Math.round(w * INK_PAGE / INK_W * E.pages);
  let dpr = Math.min(window.devicePixelRatio || 1, 2.5); const maxPx = 16e6;
  if (w * h * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (w * h));
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px';
  E.scale = s; E.ctx = c.getContext('2d'); E.ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
  paperBg(); inkRedraw();
}
function paperBg() {
  const E = S.ink; const el = $('#inkPaper'); if (!el) return; const s = E.scale; const ph = INK_PAGE * s; const g = 50 * s;
  const parts = ['repeating-linear-gradient(to bottom, transparent 0, transparent ' + (ph - 2) + 'px, var(--faint) ' + (ph - 2) + 'px, var(--faint) ' + ph + 'px)'];
  const sizes = ['100% 100%'];
  if (E.paper === 'lines' || E.paper === 'grid') { parts.push('linear-gradient(to bottom, transparent ' + (g - 1) + 'px, var(--line) ' + (g - 1) + 'px)'); sizes.push('100% ' + g + 'px'); }
  if (E.paper === 'grid') { parts.push('linear-gradient(to right, transparent ' + (g - 1) + 'px, var(--line) ' + (g - 1) + 'px)'); sizes.push(g + 'px 100%'); }
  el.style.backgroundImage = parts.join(','); el.style.backgroundSize = sizes.join(',');
}
function inkRedraw() {
  const E = S.ink; if (!E || !E.ctx) return; const ctx = E.ctx; const c = ctx.canvas;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.restore();
  E.strokes.forEach(s => drawStroke(ctx, s));
}
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; const l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); }
function hitStroke(s, x, y, r) {
  const p = s.pts; const n = p.length / 3; const rr = r + (s.t === 'm' ? s.w * 2.25 : s.w);
  if (n === 1) return Math.hypot(p[0] - x, p[1] - y) < rr;
  for (let i = 1; i < n; i++) if (segDist(x, y, p[(i - 1) * 3], p[(i - 1) * 3 + 1], p[i * 3], p[i * 3 + 1]) < rr) return true;
  return false;
}
function inkErase(x, y) {
  const E = S.ink; let hit = false;
  for (let i = E.strokes.length - 1; i >= 0; i--) if (hitStroke(E.strokes[i], x, y, 14)) { E.strokes.splice(i, 1); hit = true; }
  if (hit) { E.erased = true; inkRedraw(); }
}
function pushUndo(prev) { const E = S.ink; E.undo.push(prev); if (E.undo.length > 60) E.undo.shift(); E.redo = []; inkBarRefresh(); }
function inkChanged() { const E = S.ink; if (!E) return; E.changed = true; clearTimeout(E.saveT); E.saveT = setTimeout(inkPersist, 1500); }
function inkPersist() {
  const E = S.ink; if (!E || E.deleted) return;
  const t = $('#inkTitle'); if (t) E.n.title = t.value.trim();
  if (!E.saved && !E.strokes.length && !E.n.title) return;
  Object.assign(E.n, { strokes: E.strokes, pages: E.pages, paper: E.paper });
  E.saved = true; E.changed = false; save(E.n, { silent: true });
}
function inkFinish() {
  const E = S.ink; if (!E) return; clearTimeout(E.saveT);
  if (!E.deleted) {
    const t = $('#inkTitle'); if (t && t.value.trim() !== (E.n.title || '')) E.changed = true;
    if (E.changed) inkPersist();
    if (E.saved && !E.strokes.length && !E.n.title) { E.n.deleted = true; save(E.n, { silent: true }); }
  }
  S.ink = null; setTimeout(render, 0);
}
function inkBind() {
  const E = S.ink; const c = $('#inkCanvas'); const sc = $('#inkScroll'); if (!E || !c) return;
  const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / E.scale, (e.clientY - r.top) / E.scale]; };
  const pr = e => e.pointerType === 'pen' ? Math.max(0.05, Math.min(1, e.pressure || 0.5)) : 0.5;
  c.addEventListener('pointerdown', e => {
    if (e.pointerType === 'pen' && !E.penSeen) { E.penSeen = true; lsSet('pusula.penSeen', '1'); inkBarRefresh(); }
    if (E.active || E.scrollDrag) return;
    if (e.pointerType === 'touch' && !fingerDraws()) { E.scrollDrag = { id: e.pointerId, y: e.clientY, top: sc.scrollTop }; c.setPointerCapture(e.pointerId); return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); c.setPointerCapture(e.pointerId);
    const eraser = E.tool === 'eraser' || (e.pointerType === 'pen' && (e.buttons & 34));
    E.active = { id: e.pointerId, mode: eraser ? 'erase' : 'draw' };
    const xy = pos(e);
    if (eraser) { E.eraseSnap = E.strokes.slice(); E.erased = false; inkErase(xy[0], xy[1]); }
    else { E.cur = { t: E.tool === 'marker' ? 'm' : 'p', c: E.color, w: INK_WIDTHS[E.wi], pts: [r1(xy[0]), r1(xy[1]), r2(pr(e))] }; E.drawn = 1; drawStroke(E.ctx, E.cur); }
  });
  c.addEventListener('pointermove', e => {
    if (E.scrollDrag && e.pointerId === E.scrollDrag.id) { sc.scrollTop = E.scrollDrag.top - (e.clientY - E.scrollDrag.y); return; }
    if (!E.active || e.pointerId !== E.active.id) return;
    let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; if (!evs.length) evs = [e];
    if (E.active.mode === 'erase') { evs.forEach(ev => { const xy = pos(ev); inkErase(xy[0], xy[1]); }); return; }
    const p = E.cur.pts;
    evs.forEach(ev => { const xy = pos(ev); const lx = p[p.length - 3], ly = p[p.length - 2]; if ((xy[0] - lx) * (xy[0] - lx) + (xy[1] - ly) * (xy[1] - ly) < 0.6) return; p.push(r1(xy[0]), r1(xy[1]), r2(pr(ev))); });
    if (E.cur.t === 'm') { if (!E.raf) E.raf = requestAnimationFrame(() => { E.raf = 0; inkRedraw(); if (E.cur) drawStroke(E.ctx, E.cur); }); }
    else { drawStroke(E.ctx, E.cur, E.drawn); E.drawn = p.length / 3; }
  });
  const end = e => {
    if (E.scrollDrag && e.pointerId === E.scrollDrag.id) { E.scrollDrag = null; return; }
    if (!E.active || e.pointerId !== E.active.id) return;
    const mode = E.active.mode; E.active = null;
    if (mode === 'erase') { if (E.erased) { pushUndo(E.eraseSnap); inkChanged(); } return; }
    const st = E.cur; E.cur = null; if (!st) return;
    pushUndo(E.strokes.slice()); E.strokes.push(st);
    let maxY = 0; for (let i = 1; i < st.pts.length; i += 3) if (st.pts[i] > maxY) maxY = st.pts[i];
    if (maxY > E.pages * INK_PAGE - 120) { E.pages++; inkLayout(); }
    else if (st.t === 'm') inkRedraw();
    inkChanged();
  };
  c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  c.addEventListener('contextmenu', e => e.preventDefault());
}

/* ----- Ayarlar ----- */
const CARD_LABELS = { tasks: 'Bugünün görevleri', events: 'Bugünkü etkinlikler', habits: 'Alışkanlıklar', goals: 'Hedefler', pinned: 'Sabitlenen notlar' };
const MOD_LABELS = { tasks: 'Görevler', calendar: 'Takvim', habits: 'Alışkanlıklar & hedefler' };
function orderRows(listKey, arr, labels) {
  return arr.map((m, i) => '<div class="set-row"><div class="grow">' + labels[m.k] + '</div><div class="order-btns"><button class="icon-btn" data-act="list-move" data-list="' + listKey + '" data-i="' + i + '" data-dir="-1" aria-label="Yukarı" ' + (i === 0 ? 'disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-act="list-move" data-list="' + listKey + '" data-i="' + i + '" data-dir="1" aria-label="Aşağı" ' + (i === arr.length - 1 ? 'disabled' : '') + '>' + icon('down') + '</button></div><button class="switch ' + (m.on ? 'on' : '') + '" data-act="list-toggle" data-list="' + listKey + '" data-i="' + i + '" aria-label="Aç/kapat"></button></div>').join('');
}
function viewSettings() {
  const st = settings();
  return '<div class="section-title first"><span>Sen</span></div><div class="set-group"><div class="set-row"><div class="grow"><div>Adın</div><div class="sub">Bugün ekranında selamlamak için</div></div><input class="input slim" id="setName" style="max-width:170px" placeholder="Adın" value="' + esc(st.name) + '" autocomplete="off"></div></div>' +
    lookSection(st) +
    '<div class="section-title"><span>Bugün ekranı kartları</span></div><div class="set-group">' + orderRows('today', st.today, CARD_LABELS) + '</div>' +
    '<div class="section-title"><span>Planla modülleri</span></div><div class="set-group">' + orderRows('plan', st.plan, MOD_LABELS) + '</div>' +
    '<div class="section-title"><span>Bilgi modülleri</span></div><div class="set-group"><div class="set-row"><div class="grow">Notlar ve kalem notları</div><button class="switch ' + (st.notes ? 'on' : '') + '" data-act="notes-toggle" aria-label="Aç/kapat"></button></div>' +
    '<div class="set-row"><div class="grow"><div>Yeni kalem notu kâğıdı</div></div><div class="seg" style="max-width:240px">' + PAPERS.map(p => '<button class="' + (st.paper === p ? 'on' : '') + '" data-act="set-paper" data-k="' + p + '">' + { blank: 'Boş', lines: 'Çizgili', grid: 'Kareli' }[p] + '</button>').join('') + '</div></div></div>' +
    '<div class="section-title"><span>Etiketler</span></div><div class="set-group"><div class="set-row click" data-act="manage-tags" data-scope="task">' + icon('tag') + '<div class="grow">Görev etiketleri</div><span class="muted sm">' + tagsOf('task').length + '</span>' + icon('right') + '</div><div class="set-row click" data-act="manage-tags" data-scope="note">' + icon('tag') + '<div class="grow">Not etiketleri</div><span class="muted sm">' + tagsOf('note').length + '</span>' + icon('right') + '</div></div>' +
    '<div class="section-title"><span>Senkron (cihazlar arası)</span></div><div class="set-group"><div class="set-row click" data-act="drive-open">' + icon('cloud') + '<div class="grow"><div>Google Drive</div><div class="sub" id="driveStatus">' + driveStatusHtml() + '</div></div>' + icon('right') + '</div>' +
    '<div class="set-row click" data-act="sync-open">' + icon('sync') + '<div class="grow"><div>Supabase (gelişmiş)</div><div class="sub" id="syncStatus">' + syncStatusHtml() + '</div></div>' + icon('right') + '</div></div>' +
    '<div class="section-title"><span>Veriyi koruma</span></div><div class="set-group">' +
    '<div class="set-row click" data-act="share-backup">' + icon('upload') + '<div class="grow"><div>Yedeği gönder / kaydet</div><div class="sub" id="lastBackup">' + lastBackupText() + '</div></div></div>' +
    '<div class="set-row click" data-act="snapshots">' + icon('clock') + '<div class="grow"><div>Otomatik yedekler</div><div class="sub">Her gün kendiliğinden alınır, son 14 gün saklanır</div></div>' + icon('right') + '</div>' +
    '<div class="set-row click" data-act="export">' + icon('download') + '<div class="grow"><div>Yedeği dosya olarak indir</div></div></div>' +
    '<label class="set-row click">' + icon('upload') + '<div class="grow"><div>Yedekten içe aktar</div><div class="sub">Var olan verilerle birleştirilir</div></div><input type="file" id="importFile" accept="application/json,.json,text/plain" hidden></label>' +
    '<div class="set-row click danger" data-act="wipe">' + icon('trash') + '<div class="grow">Bu cihazdaki tüm verileri sil</div></div></div>' +
    '<div class="section-title"><span>Uygulama</span></div><div class="set-group"><div class="set-row click update-row" data-act="check-update">' + icon('sync') + '<div class="grow"><div>' + (S.waitingSW ? 'Yeni sürüm hazır — yüklemek için dokun' : 'Güncellemeleri denetle') + '</div><div class="sub" id="updStatus">' + (S.waitingSW ? 'Verilerin silinmez' : 'Şu anki sürüm ' + VERSION) + '</div></div></div></div>' +
    '<div class="about">PUSULA · sürüm ' + VERSION + '<br>Veriler cihazında saklanır, internetsiz çalışır.</div>';
}
function lookSection(st) {
  const opt = (k, v, on, inner, label) => '<button class="opt ' + (on ? 'on' : '') + '" data-act="look" data-k="' + k + '" data-v="' + v + '">' + inner + '<span>' + label + '</span></button>';
  const palOpts = mode => Object.keys(PALETTES[mode]).map(id => { const p = PALETTES[mode][id]; return opt(mode === 'dark' ? 'darkPal' : 'lightPal', id, (mode === 'dark' ? st.darkPal : st.lightPal) === id, '<span class="sw3"><i style="background:' + p[1] + '"></i><i style="background:' + p[3] + '"></i><i style="background:' + p[4] + '"></i></span>', p[0]); }).join('');
  const segRow = (k, map, cur) => '<div class="seg">' + Object.keys(map).map(v => '<button class="' + (cur === v ? 'on' : '') + '" data-act="look" data-k="' + k + '" data-v="' + v + '">' + (Array.isArray(map[v]) ? map[v][0] : map[v]) + '</button>').join('') + '</div>';
  const mode = currentTheme();
  const cardPrev = { plain: '<span class="cprev"><i style="background:var(--line);height:1px"></i><i style="background:transparent"></i><i style="background:var(--line);height:1px"></i></span>', outline: '<span class="cprev"><i style="border:1px solid var(--line);height:20px;border-radius:4px"></i></span>', filled: '<span class="cprev"><i style="background:var(--surface2);border:1px solid var(--line);height:20px;border-radius:4px"></i></span>' };
  return '<div class="section-title"><span>Görünüm</span><button class="link" data-act="look-reset">Sıfırla</button></div><div class="set-group">' +
    '<div class="set-sub">Mod</div><div class="pad-x">' + segRow('theme', { dark: 'Koyu', light: 'Açık', system: 'Telefona uy' }, st.theme) + '</div>' +
    '<div class="set-sub">Koyu tema</div><div class="opt-grid">' + palOpts('dark') + '</div>' +
    '<div class="set-sub">Açık tema</div><div class="opt-grid">' + palOpts('light') + '</div>' +
    '<div class="set-sub">Vurgu rengi</div><div class="accents">' + Object.keys(ACCENTS).map(k => '<button class="accent-dot ' + (k === 'mono' ? 'mono ' : '') + (st.accent === k ? 'on' : '') + '" style="background:' + (ACCENTS[k] ? ACCENTS[k][mode][0] : 'var(--text)') + '" data-act="look" data-k="accent" data-v="' + k + '" aria-label="' + ACCENT_NAMES[k] + '" title="' + ACCENT_NAMES[k] + '"></button>').join('') + '</div>' +
    '<div class="set-sub">Alanlar</div><div class="opt-grid">' + Object.keys(CARD_STYLES).map(k => opt('cards', k, st.cards === k, cardPrev[k], CARD_STYLES[k])).join('') + '</div>' +
    '<div class="set-sub">Yazı tipi</div><div class="opt-grid">' + Object.keys(FONTS).map(k => opt('font', k, st.font === k, '<span class="fprev" style="font-family:' + FONTS[k][1].replace(/"/g, '&quot;') + '">Ağ</span>', FONTS[k][0])).join('') + '</div>' +
    '<div class="set-sub">Yazı boyutu (punto)</div><div class="range-row"><span class="sm muted">A</span><input type="range" id="fsRange" min="85" max="130" step="5" value="' + Math.round((st.fs || 1) * 100) + '" aria-label="Yazı boyutu"><span style="font-size:20px" class="muted">A</span><b id="fsVal">%' + Math.round((st.fs || 1) * 100) + '</b></div>' +
    '<div class="set-sub">Satır aralığı</div><div class="pad-x">' + segRow('density', DENSITY, st.density) + '</div>' +
    '<div class="set-sub">Köşeler</div><div class="pad-x">' + segRow('radius', RADIUS, st.radius) + '</div>' +
    '<div class="set-row"><div class="grow">Alt menüde yazılar</div><button class="switch ' + (st.tabLabels !== false ? 'on' : '') + '" data-act="look" data-k="tabLabels" data-v="' + (st.tabLabels !== false ? 'false' : 'true') + '" aria-label="Aç/kapat"></button></div>' +
    '</div>';
}
function manageTags(scope) {
  const tags = tagsOf(scope);
  openSheet(sheetHead(scope === 'task' ? 'Görev etiketleri' : 'Not etiketleri') + '<div class="sheet-body">' +
    (tags.length ? '<div class="set-group">' + tags.map(t => '<div class="set-row"><input class="input slim grow" data-tag-name="' + t.id + '" value="' + esc(t.name) + '" autocomplete="off"><button class="icon-btn" data-act="tag-delete" data-id="' + t.id + '" data-scope="' + scope + '" aria-label="Sil">' + icon('trash') + '</button></div>').join('') + '</div>' : '<div class="empty">Henüz etiket yok.</div>') +
    '<form class="quick-add" data-form="new-tag" data-scope="' + scope + '" style="margin-top:14px"><input class="input" name="q" placeholder="Yeni etiket adı" autocomplete="off" enterkeyhint="done"><button class="icon-btn" type="submit" aria-label="Ekle">' + icon('plus') + '</button></form>' +
    '<div class="sheet-msg">İsmi değiştirmek için üzerine yazman yeterli.</div></div>', { onClose: () => setTimeout(render, 0) });
}
function openSync() {
  const c = Sync.cfg || {};
  let body;
  if (Sync.enabled()) {
    body = '<div class="set-group"><div class="set-row"><div class="grow"><div>' + esc(c.email || '') + '</div><div class="sub" id="syncStatus">' + syncStatusHtml() + '</div></div></div></div>' +
      '<p class="muted sm" style="margin-top:14px">Her cihazda aynı e-posta ve şifreyle giriş yaptığında veriler otomatik eşitlenir. İnternet yokken yaptığın değişiklikler bağlantı gelince gönderilir.</p>' +
      '<button class="btn primary block" data-act="sync-now">' + icon('sync') + ' Şimdi eşitle</button><button class="btn block" data-act="sync-logout">Bu cihazda senkronu kapat</button>';
  } else {
    body = '<ol class="steps"><li><b>supabase.com</b>’da ücretsiz hesap aç ve <b>New project</b> ile bir proje oluştur.</li><li>Projede <b>SQL Editor</b>’ü aç, aşağıdaki kodu yapıştırıp <b>Run</b>’a bas.</li><li><b>Project Settings → API</b> (Data API) sayfasından <b>Project URL</b> ile <b>publishable / anon key</b>’i kopyalayıp aşağıya yapıştır.</li><li>İlk cihazda <b>Hesap oluştur</b>, diğer cihazlarda aynı bilgilerle <b>Giriş yap</b>.</li></ol>' +
      '<button class="btn block" data-act="copy-sql">Kurulum kodunu kopyala</button><pre class="sql">' + esc(SETUP_SQL) + '</pre>' +
      '<label class="field"><span>Project URL</span><input class="input" name="sUrl" placeholder="https://xxxx.supabase.co" value="' + esc(c.url || '') + '" autocomplete="off" inputmode="url"></label>' +
      '<label class="field"><span>Publishable / anon key</span><input class="input" name="sKey" placeholder="sb_publishable_… veya eyJ…" value="' + esc(c.key || '') + '" autocomplete="off"></label>' +
      '<label class="field"><span>E-posta</span><input class="input" name="sEmail" type="email" value="' + esc(c.email || '') + '" autocomplete="email"></label>' +
      '<label class="field"><span>Şifre (en az 6 karakter)</span><input class="input" name="sPass" type="password" autocomplete="current-password"></label>' +
      '<div class="sheet-msg" id="syncMsg"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px"><button class="btn" data-act="sync-auth" data-k="signup">Hesap oluştur</button><button class="btn primary" data-act="sync-auth" data-k="login">Giriş yap</button></div>';
  }
  openSheet(sheetHead('Senkron') + '<div class="sheet-body">' + body + '</div>', { onClose: () => setTimeout(render, 0) });
}
async function syncAuth(kind) {
  const msg = $('#syncMsg'); const say = (t, cls) => { if (msg) { msg.textContent = t; msg.className = 'sheet-msg ' + (cls || ''); } };
  const url = fval('sUrl').trim().replace(/\/+$/, ''), key = fval('sKey').trim(), email = fval('sEmail').trim(), pass = fval('sPass');
  if (!/^https:\/\/.+/.test(url)) return say('Project URL https:// ile başlamalı.', 'err');
  if (!key) return say('Anahtarı (key) yapıştır.', 'err');
  if (!email || pass.length < 6) return say('E-posta ve en az 6 karakterli şifre gir.', 'err');
  if (!navigator.onLine) return say('Kurulum için internet gerekli.', 'err');
  Sync.cfg = Object.assign({}, Sync.cfg || {}, { url, key, email });
  say('Bağlanılıyor…');
  try {
    const r = await Sync.auth(kind, email, pass);
    if (r === 'confirm') { await Sync.saveCfg(); return say('Onay e-postası gönderildi. E-postadaki linke tıkla (açılan sayfa hata verse de sorun değil), sonra buraya dönüp “Giriş yap”a bas.', 'ok'); }
    say('Bağlandı, eşitleniyor…', 'ok');
    await Sync.run();
    toast('Senkron açıldı');
    openSync();
  } catch (e) { say(e.message === 'Failed to fetch' ? 'Sunucuya ulaşılamadı. URL’yi ve internet bağlantını kontrol et.' : e.message, 'err'); }
}
/* ----- Yedekleme ----- */
function backupData() {
  const data = { app: 'PUSULA', version: VERSION, exported: new Date().toISOString(), items: [] };
  S.items.forEach(it => { if (!it.deleted && (it.type !== 'settings' || it.updated)) data.items.push(strip(it)); });
  return data;
}
const backupName = () => 'pusula-yedek-' + today() + '.json';
function downloadText(text, name) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function markExported() { lsSet('pusula.lastExport', String(Date.now())); const el = $('#lastBackup'); if (el) el.textContent = lastBackupText(); }
function lastBackupText() {
  const t = +lsGet('pusula.lastExport', '0');
  if (!t) return 'Henüz dışarı yedek alınmadı · Drive, WhatsApp veya e-postaya gönder';
  const d = Math.floor((Date.now() - t) / 86400000);
  return 'Son yedek: ' + (d === 0 ? 'bugün' : d === 1 ? 'dün' : d + ' gün önce') + ' · Drive, WhatsApp veya e-postaya gönder';
}
function exportData() { downloadText(JSON.stringify(backupData()), backupName()); markExported(); toast('Yedek indirildi'); }
async function shareBackup() {
  const text = JSON.stringify(backupData()); const name = backupName();
  let file = null; try { file = new File([text], name, { type: 'text/plain' }); } catch (e) { file = null; }
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'PUSULA yedeği', text: 'PUSULA yedeği · ' + fmtLong(today()) }); markExported(); toast('Yedek gönderildi'); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  downloadText(text, name); markExported(); toast('Paylaşım desteklenmiyor, yedek indirildi');
}
/* Otomatik yerel yedekler: günde bir, son 14 gün */
async function autoSnapshot(force, label) {
  try {
    const list = (await DB.getMeta('snaps')) || [];
    const id = force ? 'pre-' + Date.now() : today();
    if (!force && list.some(x => x.id === id)) return;
    const data = backupData(); if (!data.items.length) return;
    await DB.setMeta('snap:' + id, data);
    list.unshift({ id, at: Date.now(), n: data.items.length, label: label || '' });
    const keep = list.filter(x => !String(x.id).startsWith('pre-')).slice(0, 14).concat(list.filter(x => String(x.id).startsWith('pre-')).slice(0, 3));
    for (const x of list) if (!keep.includes(x)) await DB.delMeta('snap:' + x.id);
    keep.sort((a, b) => b.at - a.at);
    await DB.setMeta('snaps', keep);
  } catch (e) { console.warn('snapshot', e); }
}
async function openSnapshots() {
  const list = (await DB.getMeta('snaps')) || [];
  openSheet(sheetHead('Otomatik yedekler') + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">PUSULA her gün açıldığında verilerinin bir kopyasını bu cihazda saklar. Yanlışlıkla bir şey silersen buradan geri dönebilirsin. Telefon kaybolursa diye ayrıca “Yedeği gönder” ile Drive’a da kaydet.</p>' +
    (list.length ? '<div class="set-group">' + list.map(x => '<div class="set-row snap-row"><div class="grow"><div>' + (x.label || new Date(x.at).toLocaleDateString(TR, { weekday: 'short', day: 'numeric', month: 'long' })) + '</div><div class="sub">' + new Date(x.at).toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' }) + ' · ' + x.n + ' kayıt</div></div><button class="btn" data-act="snap-restore" data-id="' + x.id + '">Geri yükle</button></div>').join('') + '</div>' : '<div class="empty">Henüz otomatik yedek yok. Uygulamayı kullandıkça günlük alınır.</div>') +
    '</div>', { onClose: () => setTimeout(render, 0) });
}
async function restoreSnapshot(id) {
  const data = await DB.getMeta('snap:' + id); if (!data) return toast('Yedek bulunamadı');
  if (!confirm('Veriler bu yedekteki hâline dönecek. Şu anki hâlin de ayrıca yedeklenecek. Devam edilsin mi?')) return;
  await autoSnapshot(true, 'Geri yüklemeden önce');
  const ids = new Set(data.items.map(i => i.id)); const now = Date.now(); const toPut = [];
  data.items.forEach(it => { const o = Object.assign({}, it, { updated: now, deleted: false, _dirty: 1, _dd: 1 }); S.items.set(o.id, o); toPut.push(o); });
  S.items.forEach(it => { if (!ids.has(it.id) && !it.deleted && it.type !== 'settings') { it.deleted = true; it.updated = now; it._dirty = 1; it._dd = 1; toPut.push(it); } });
  await DB.putMany(toPut); thumbCache.clear(); Sync.schedule(500);
  closeSheet(); render(); toast('Yedek geri yüklendi');
}
function backupReminder() {
  if (Sync.enabled() || Drive.on()) return;
  const last = +lsGet('pusula.lastExport', '0'); const shown = lsGet('pusula.remindDay', '');
  const count = Array.from(S.items.values()).filter(i => !i.deleted && i.type !== 'settings').length;
  if (count < 5 || shown === today() || (last && Date.now() - last < 7 * 86400000)) return;
  lsSet('pusula.remindDay', today());
  setTimeout(() => toast(last ? 'Son yedeğin 1 haftadan eski' : 'Verilerini bir kez yedekle', { label: 'Yedekle', fn: () => shareBackup() }, 9000), 2500);
}
async function importData(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'PUSULA' || !Array.isArray(data.items)) throw new Error('Bu bir PUSULA yedeği değil');
    const toPut = [];
    data.items.forEach(it => { if (!it || !it.id || !it.type) return; const loc = S.items.get(it.id); if (!loc || (it.updated || 0) > (loc.updated || 0)) { it._dirty = 1; it._dd = 1; S.items.set(it.id, it); toPut.push(it); } });
    await DB.putMany(toPut); thumbCache.clear(); render(); Sync.schedule(500);
    toast(toPut.length + ' kayıt içe aktarıldı');
  } catch (e) { toast('İçe aktarılamadı: ' + e.message); }
}

/* ===================== Eylemler ===================== */
const ACTIONS = {
  'tab': el => { S.tab = el.dataset.k; window.scrollTo(0, 0); render(); },
  'plan-sub': el => { S.planSub = el.dataset.k; window.scrollTo(0, 0); render(); },
  'go': el => { const k = el.dataset.k; if (k === 'notes') S.tab = 'info'; else { S.tab = 'plan'; S.planSub = k; if (k === 'calendar') { S.calSel = today(); S.calMonth = null; } if (k === 'tasks') S.taskFilter = 'open'; } window.scrollTo(0, 0); render(); },
  'fab': () => {
    if (S.tab === 'plan') { if (S.planSub === 'tasks') return editTask(); if (S.planSub === 'calendar') return editEvent(null, S.calSel); return openQuick(['habit', 'goal']); }
    if (S.tab === 'info') return openQuick(['note', 'ink']);
    openQuick();
  },
  'quick': el => { const k = el.dataset.k; ({ task: () => editTask(), event: () => editEvent(null, S.tab === 'plan' ? S.calSel : today()), note: () => openNote(), ink: () => openInk(), habit: () => editHabit(), goal: () => editGoal() })[k](); },
  'close-sheet': () => closeSheet(),
  'toast-action': () => { const fn = S.toastAction; S.toastAction = null; $('#toast').classList.remove('show'); if (fn) fn(); },
  'seg-pick': el => { $$('button', el.parentNode).forEach(b => b.classList.toggle('on', b === el)); },
  'switch': el => { el.classList.toggle('on'); if (el.dataset.name === 'allDay') { const t = $('#sheetRoot .times'); if (t) t.classList.toggle('hide', el.classList.contains('on')); } },
  'toggle-on': el => el.classList.toggle('on'),
  'pick-color': el => { $$('.swatch', el.parentNode).forEach(b => b.classList.toggle('on', b === el)); if (S.draft) S.draft.color = el.dataset.c; },
  'tag-toggle': el => { el.classList.toggle('on'); if (S.noteEd) noteTagsSync(); },
  'set-date': el => { const v = el.dataset.v; $('#sheetRoot [name=due]').value = v === '' ? '' : addDays(today(), +v); },
  // görev
  'toggle-task': el => toggleTask(el.dataset.id),
  'edit-task': el => { const t = S.items.get(el.dataset.id); if (t) editTask(t); },
  'save-task': () => saveTask(),
  'delete-task': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); toast('Görev silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); },
  'task-filter': el => { S.taskFilter = el.dataset.k; render(); },
  'task-tagf': el => { S.taskTag = S.taskTag === el.dataset.id ? null : el.dataset.id; render(); },
  // takvim
  'cal-prev': () => shiftMonth(-1), 'cal-next': () => shiftMonth(1),
  'cal-today': () => { S.calSel = today(); S.calMonth = null; render(); },
  'cal-day': el => { S.calSel = el.dataset.d; S.calMonth = el.dataset.d.slice(0, 7); render(); },
  'add-event': () => editEvent(null, S.calSel),
  'edit-event': el => { const e = S.items.get(el.dataset.id); if (e) editEvent(e); },
  'save-event': () => saveEvent(),
  'delete-event': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); toast('Etkinlik silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); },
  // alışkanlık & hedef
  'habit-toggle': el => toggleHabit(el.dataset.id, el.dataset.d),
  'new-habit': () => editHabit(), 'new-goal': () => editGoal(),
  'edit-habit': el => { const h = S.items.get(el.dataset.id); if (h) editHabit(h); },
  'save-habit': () => saveHabit(),
  'delete-habit': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); if (!confirm('“' + it.title + '” ve tüm geçmişi silinsin mi?')) return; closeSheet(); await remove(it); },
  'edit-goal': el => { const g = S.items.get(el.dataset.id); if (g) editGoal(g); },
  'save-goal': () => saveGoal(),
  'delete-goal': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); toast('Hedef silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); },
  'goal-step': el => goalStep(el.dataset.id, +el.dataset.dir),
  // notlar
  'new-note': () => openNote(), 'new-ink': () => openInk(),
  'open-note': el => { const n = S.items.get(el.dataset.id); if (n) openNote(n); },
  'note-tagf': el => { S.noteTag = S.noteTag === el.dataset.id ? null : el.dataset.id; render(); },
  'note-pin': el => { const E = S.noteEd; if (!E) return; E.d.pinned = !E.d.pinned; el.classList.toggle('on', E.d.pinned); noteChanged(); },
  'note-delete': async () => { const E = S.noteEd; if (!E) return; if ((E.d.title || E.d.body) && !confirm('Bu not silinsin mi?')) return; E.deleted = true; const it = S.items.get(E.d.id); closeSheet(); if (it) { await remove(it); toast('Not silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); } },
  // kalem
  'ink-tool': el => { S.ink.tool = el.dataset.k; inkBarRefresh(); },
  'ink-color': el => { S.ink.color = el.dataset.c; if (S.ink.tool === 'eraser') S.ink.tool = 'pen'; inkBarRefresh(); },
  'ink-width': el => { S.ink.wi = +el.dataset.i; if (S.ink.tool === 'eraser') S.ink.tool = 'pen'; inkBarRefresh(); },
  'ink-undo': () => { const E = S.ink; if (!E.undo.length) return; E.redo.push(E.strokes); E.strokes = E.undo.pop(); inkRedraw(); inkBarRefresh(); inkChanged(); },
  'ink-redo': () => { const E = S.ink; if (!E.redo.length) return; E.undo.push(E.strokes); E.strokes = E.redo.pop(); inkRedraw(); inkBarRefresh(); inkChanged(); },
  'ink-add-page': () => { const E = S.ink; E.pages++; inkLayout(); inkChanged(); const sc = $('#inkScroll'); if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); },
  'ink-paper': () => { const E = S.ink; E.paper = PAPERS[(PAPERS.indexOf(E.paper) + 1) % PAPERS.length]; paperBg(); inkChanged(); toast(PAPER_LABELS[E.paper]); },
  'ink-finger': () => { const E = S.ink; E.finger = fingerDraws() ? 'scroll' : 'draw'; lsSet('pusula.finger', E.finger); inkBarRefresh(); toast(E.finger === 'draw' ? 'Parmak çizer' : 'Parmak sayfayı kaydırır, kalem çizer'); },
  'ink-pin': el => { const E = S.ink; E.n.pinned = !E.n.pinned; el.classList.toggle('on', E.n.pinned); inkChanged(); },
  'ink-delete': async () => { const E = S.ink; if (E.strokes.length && !confirm('Bu kalem notu silinsin mi?')) return; E.deleted = true; const it = S.items.get(E.n.id); closeSheet(); if (it) await remove(it, { silent: true }); },
  // ayarlar
  'look': el => { const st = settings(); let v = el.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false; st[el.dataset.k] = v; thumbCache.clear(); saveSettings(); },
  'look-reset': () => { if (!confirm('Görünüm varsayılana dönsün mü? (Verilerin etkilenmez)')) return; Object.assign(settings(), clone(LOOK_DEFAULTS)); thumbCache.clear(); saveSettings(); },
  'share-backup': () => shareBackup(),
  'snapshots': () => openSnapshots(),
  'snap-restore': el => restoreSnapshot(el.dataset.id),
  'set-paper': el => { settings().paper = el.dataset.k; saveSettings(); },
  'list-toggle': el => { const arr = settings()[el.dataset.list]; const m = arr[+el.dataset.i]; m.on = !m.on; saveSettings(); },
  'list-move': el => { const arr = settings()[el.dataset.list]; const i = +el.dataset.i, j = i + (+el.dataset.dir); if (j < 0 || j >= arr.length) return; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; saveSettings(); },
  'notes-toggle': () => { const st = settings(); st.notes = !st.notes; saveSettings(); },
  'manage-tags': el => manageTags(el.dataset.scope),
  'tag-delete': async el => { const t = S.items.get(el.dataset.id); if (!t || !confirm('“' + t.name + '” etiketi silinsin mi? (Notlar ve görevler silinmez)')) return; await remove(t, { silent: true }); manageTags(el.dataset.scope); },
  'sync-open': () => openSync(),
  'sync-auth': el => syncAuth(el.dataset.k),
  'sync-now': () => { if (!navigator.onLine) return toast('İnternet yok, bağlantı gelince eşitlenecek'); Drive.run(true); Sync.run(); },
  'drive-open': () => openDrive(),
  'drive-connect': () => driveConnect(),
  'drive-now': () => { if (!navigator.onLine) return toast('İnternet yok, bağlantı gelince eşitlenecek'); Drive.run(true); },
  'drive-off': async () => { if (!confirm('Bu cihazda Google Drive senkronu kapatılsın mı? Veriler cihazda ve Drive’da kalır.')) return; Drive.cfg.connected = false; Drive.token = null; Drive.exp = 0; lsSet('pusula.gtok', 'null'); await Drive.saveCfg(); Drive.setStatus('off'); openDrive(); },
  'copy-origin': async () => { try { await navigator.clipboard.writeText(location.origin); toast('Adres kopyalandı'); } catch (e) { toast(location.origin); } },
  'sync-logout': async () => { if (!confirm('Bu cihazda senkron kapatılsın mı? Veriler cihazda kalır.')) return; Sync.cfg = { url: Sync.cfg.url, key: Sync.cfg.key, email: Sync.cfg.email }; await Sync.saveCfg(); Sync.setStatus('off'); openSync(); },
  'copy-sql': async () => { try { await navigator.clipboard.writeText(SETUP_SQL); toast('Kod kopyalandı'); } catch (e) { toast('Kopyalanamadı, kutudan seçip kopyala'); } },
  'export': () => exportData(),
  'check-update': () => checkUpdate(),
  'wipe': async () => {
    if (!confirm('Bu cihazdaki TÜM PUSULA verileri silinecek. Emin misin?')) return;
    if (!confirm('Son kez soruyorum: geri alınamaz. Önce yedek aldın mı? Silmek için Tamam.')) return;
    await DB.wipe(); location.reload();
  }
};
function openQuick(only) {
  const st = settings(); const opts = [];
  if (planOn('tasks')) opts.push(['task', 'Görev', 'task']);
  if (planOn('calendar')) opts.push(['event', 'Etkinlik', 'event']);
  if (st.notes) { opts.push(['note', 'Not', 'note']); opts.push(['ink', 'Kalem notu', 'pen']); }
  if (planOn('habits')) { opts.push(['habit', 'Alışkanlık', 'habit']); opts.push(['goal', 'Hedef', 'goal']); }
  const shown = only ? opts.filter(o => only.includes(o[0])) : opts;
  if (!shown.length) return toast('Ayarlar’dan bir modül aç');
  openSheet(sheetHead('Ekle') + '<div class="sheet-body"><div class="quick-grid">' + shown.map(o => '<button class="quick-opt" data-act="quick" data-k="' + o[0] + '">' + icon(o[2]) + '<span>' + o[1] + '</span></button>').join('') + '</div></div>');
}

/* ===================== Olay dinleyicileri ===================== */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACTIONS[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  const fail = err => { console.error(err); toast('Bir hata oluştu'); };
  try { Promise.resolve(fn(el, e)).catch(fail); } catch (err) { fail(err); }
});
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  const v = f.q ? f.q.value.trim() : '';
  if (f.dataset.form === 'quick-task') {
    if (!v) return;
    await save({ id: uid(), type: 'task', title: v, notes: '', due: S.taskFilter === 'today' ? today() : null, time: null, priority: 0, repeat: 'none', tags: S.taskTag ? [S.taskTag] : [], done: false });
    const i = $('[data-form=quick-task] input'); if (i) i.focus();
  } else if (f.dataset.form === 'new-tag') {
    if (!v) return; const scope = f.dataset.scope;
    if (!tagsOf(scope).find(t => lower(t.name) === lower(v))) await save({ id: uid(), type: 'tag', scope, name: v.replace(/^#/, '') }, { silent: true });
    manageTags(scope); setTimeout(() => { const i = $('#sheetRoot [data-form=new-tag] input'); if (i) i.focus(); }, 30);
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'fsRange') { document.documentElement.style.setProperty('--fs', el.value / 100); const v = $('#fsVal'); if (v) v.textContent = '%' + el.value; return; }
  if (el.id === 'noteSearch') { S.noteQuery = el.value; const l = $('#notesList'); if (l) l.innerHTML = notesList(); }
  else if ((el.id === 'noteTitle' || el.id === 'noteBody') && S.noteEd) { S.noteEd.d[el.id === 'noteTitle' ? 'title' : 'body'] = el.value; noteChanged(); }
  else if (el.id === 'inkTitle' && S.ink) inkChanged();
  else if (el.classList.contains('err')) el.classList.remove('err');
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'fsRange') { settings().fs = el.value / 100; saveSettings(); return; }
  if (el.id === 'setName') { settings().name = el.value.trim(); saveSettings(); }
  else if (el.dataset && el.dataset.tagName) { const t = S.items.get(el.dataset.tagName); const v = el.value.trim().replace(/^#/, ''); if (t && v) { t.name = v; save(t, { silent: true }); } }
  else if (el.id === 'importFile') { importData(el.files[0]); el.value = ''; }
});
document.addEventListener('keydown', e => {
  const el = e.target;
  if (e.key === 'Enter' && el.classList && el.classList.contains('chip-input')) { e.preventDefault(); addTagFromInput(el); return; }
  if (e.key === 'Enter' && el.name === 'title' && el.classList.contains('big') && !e.isComposing) {
    e.preventDefault(); const btn = $('#sheetRoot .sheet-foot .primary'); if (btn) btn.click();
  }
});
document.addEventListener('focusout', e => { const el = e.target; if (el.classList && el.classList.contains('chip-input') && el.value.trim()) addTagFromInput(el); });
let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (S.ink) inkLayout(); }, 150); });

/* ===================== Offline (service worker) ===================== */
function swReady(w) {
  S.waitingSW = w;
  if (S.tab === 'settings' && !S.ink && !S.noteEd) render();
  toast('Yeni sürüm hazır', { label: 'Güncelle', fn: () => applyUpdate() }, 20000);
}
function applyUpdate() { if (S.ink) inkPersist(); if (S.noteEd) noteSave(); if (S.waitingSW) S.waitingSW.postMessage('skip'); else location.reload(); }
async function checkUpdate() {
  if (S.waitingSW) return applyUpdate();
  const st = $('#updStatus'); const say = t => { if (st) st.textContent = t; };
  if (!navigator.onLine) return say('İnternet yok, bağlanınca tekrar dene');
  if (!('serviceWorker' in navigator)) return say('Bu tarayıcı güncelleme denetimini desteklemiyor');
  say('Denetleniyor…');
  try {
    const reg = await navigator.serviceWorker.getRegistration(); if (!reg) return say('Şu anki sürüm ' + VERSION);
    await reg.update();
    if (reg.waiting) return swReady(reg.waiting);
    if (reg.installing) return say('Yeni sürüm indiriliyor…');
    say('En güncel sürümü kullanıyorsun (' + VERSION + ')');
  } catch (e) { say('Denetlenemedi, sonra tekrar dene'); }
}
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const notify = w => swReady(w);
    if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (!w) return; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) notify(w); }); });
    setInterval(() => reg.update().catch(() => {}), 3600000);
  }).catch(err => console.warn('SW', err));
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController || reloading) return; reloading = true; location.reload(); });
}

/* ===================== Başlat ===================== */
async function init() {
  try { await DB.open(); (await DB.all() || []).forEach(i => S.items.set(i.id, i)); }
  catch (e) { console.error(e); toast('Cihaz depolaması açılamadı'); }
  settings();
  await Sync.load();
  await Drive.load();
  render();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  registerSW();
  Sync.run();
  setTimeout(() => autoSnapshot(), 3000);
  backupReminder();
  window.addEventListener('online', () => { Sync.run(); Drive.run(false); });
  window.addEventListener('offline', () => Sync.enabled() && Sync.setStatus('offline'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') { if (S.ink) inkPersist(); if (S.noteEd) noteSave(); return; }
    Sync.run(); Drive.run(false);
    if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {});
    if (S.lastDay !== today()) { autoSnapshot(); S.lastDay = today(); S.calSel = today(); S.calMonth = null; if (!S.ink && !S.noteEd) render(); }
  });
  setInterval(() => { if (document.visibilityState === 'visible') { Sync.run(); Drive.run(false); } }, 180000);
  if (Drive.on()) { if (navigator.onLine) Drive.loadGis().catch(() => {}); Drive.run(false); }
  if (window.matchMedia) { const mq = matchMedia('(prefers-color-scheme: light)'); const fn = () => { if (settings().theme === 'system') { thumbCache.clear(); render(); } }; if (mq.addEventListener) mq.addEventListener('change', fn); }
}
init();
