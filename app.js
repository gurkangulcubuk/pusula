'use strict';
/* PUSULA — kişisel planlama ve bilgi pusulası */
const VERSION = '1.18.1';
// Google Cloud OAuth istemci kimliği (herkese açık bir kimliktir, gizli değildir). Boşsa Ayarlar'dan girilir.
const DRIVE_CLIENT_ID = '723542278040-0hso9u3j7q5og7htu6dradpgaaudpp4m.apps.googleusercontent.com';

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
let TR = 'tr-TR';
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
  tools: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
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
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 9.5z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
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
const strip = it => { const o = Object.assign({}, it); delete o._dirty; delete o._dd; delete o._calPending; return o; };

/* Ayarlar tek kayıt; iki cihazda farklı alanlar değişince biri ötekini silmesin diye alan bazında zaman damgası (_ft) tutulur
   ve eşitlemede alan alan birleştirilir. Gmail abonelik/kural listeleri ve içe aktarma eşleştirmeleri kayıt kayıt birleşir. */
const SET_META = ['id', 'type', 'updated', 'created', '_dd', '_dirty', '_ft'];
const SET_DEEP = { gmail: { unsub: 1, filters: 1, fkind: 1 }, moneyImport: 1 };
const SEP = '\u0001';
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
function setFlat(s) {
  const o = {};
  for (const k in s) {
    if (SET_META.includes(k)) continue; const spec = SET_DEEP[k], v = s[k];
    if (spec && isObj(v)) { for (const j in v) { if (spec !== 1 && spec[j] && isObj(v[j])) { for (const e in v[j]) o[k + SEP + j + SEP + e] = JSON.stringify(v[j][e]); } else o[k + SEP + j] = JSON.stringify(v[j]); } }
    else o[k] = JSON.stringify(v);
  }
  return o;
}
function setStamp(item) {
  const cur = setFlat(item), prev = S.setSnap; item._ft = item._ft || {};
  if (prev) new Set(Object.keys(cur).concat(Object.keys(prev))).forEach(k => { if (cur[k] !== prev[k]) item._ft[k] = item.updated; });
  S.setSnap = cur; S.setSnapFor = item;
}
function setMerge(a, b) { // a: yerel, b: uzak → birleşik kayıt, uzağa yüklemek gerekiyor mu
  const fa = setFlat(a), fb = setFlat(b), ta = a._ft || {}, tb = b._ft || {};
  const ts = (rec, t, k) => t[k] != null ? t[k] : (rec._ft ? 0 : rec.updated || 0);
  const out = { id: 'settings', type: b.type || a.type, created: a.created || b.created, updated: Math.max(a.updated || 0, b.updated || 0), _ft: {} };
  const flat = {}; let up = false;
  new Set(Object.keys(fa).concat(Object.keys(fb), Object.keys(ta), Object.keys(tb))).forEach(k => {
    const x = ts(a, ta, k), y = ts(b, tb, k); const useA = x > y || (x === y && (a.updated || 0) > (b.updated || 0));
    const v = useA ? fa[k] : fb[k]; if (v !== undefined) flat[k] = v; out._ft[k] = Math.max(x, y);
    if (v !== fb[k]) up = true;
  });
  Object.keys(SET_DEEP).forEach(k => { if (isObj(a[k]) || isObj(b[k])) { out[k] = {}; const spec = SET_DEEP[k]; if (spec !== 1) Object.keys(spec).forEach(j => { if ((isObj(a[k]) && isObj(a[k][j])) || (isObj(b[k]) && isObj(b[k][j]))) out[k][j] = {}; }); } });
  for (const p in flat) { const parts = p.split(SEP), v = JSON.parse(flat[p]); let o = out; for (let i = 0; i < parts.length - 1; i++) { o[parts[i]] = isObj(o[parts[i]]) ? o[parts[i]] : {}; o = o[parts[i]]; } o[parts[parts.length - 1]] = v; }
  return { rec: out, up };
}

async function save(item, opts) {
  item.updated = Date.now();
  if (item.id === 'settings') setStamp(item);
  if (!item.created) item.created = item.updated;
  item._dd = 1;
  S.items.set(item.id, item);
  try { await DB.put(item); } catch (e) { console.error(e); toast('Kaydedilemedi: depolama hatası'); }
  Drive.schedule();
  if (!(opts && opts.silent)) render();
  return item;
}
async function remove(item, opts) { item.deleted = true; return save(item, opts); }

/* ===================== Ayarlar & tema ===================== */
const LOOK_DEFAULTS = { theme: 'dark', themeId: 'notr', tone: 'net', accent: 'theme', cards: 'filled', font: 'plex', fs: 1, density: 'normal', tabLabels: true, titleStyle: 'classic' };
const DEFAULT_SETTINGS = Object.assign({
  id: 'settings', type: 'settings', name: '', paper: 'lines', look: 4, lang: 'tr', titles: {}, custom: [], alerts: {},
  today: [{ k: 'flow', on: true }, { k: 'tasks', on: true }, { k: 'events', on: false }, { k: 'routines', on: true }, { k: 'habits', on: true }, { k: 'goals', on: true }, { k: 'pinned', on: true }, { k: 'mail', on: true }, { k: 'money', on: true }],
  plan: [{ k: 'tasks', on: true }, { k: 'calendar', on: true }, { k: 'routines', on: true }, { k: 'habits', on: true }],
  notes: true, tools: true, mailTab: true, gmail: {}, tabs: [{ k: 'today', on: true }, { k: 'plan', on: true }, { k: 'money', on: true }, { k: 'info', on: true }, { k: 'mail', on: true }, { k: 'tools', on: true }], updated: 0
}, LOOK_DEFAULTS);
// Temalar (1.7): nötr zemin + canlı vurgu. Zemin, "Ton yoğunluğu" ayarına göre temanın rengine boyanır.
// a = [vurgu, vurgu üstü yazı]
const THEMES = {
  notr: { tr: 'Nötr', en: 'Neutral', tint: false, light: { a: ['#18181B', '#FFFFFF'] }, dark: { a: ['#F4F4F5', '#0D0D0F'] } },
  nane: { tr: 'Nane', en: 'Mint', light: { a: ['#059669', '#FFFFFF'] }, dark: { a: ['#34D399', '#03160E'] } },
  lavanta: { tr: 'Lavanta', en: 'Lavender', light: { a: ['#7C3AED', '#FFFFFF'] }, dark: { a: ['#A78BFA', '#140A2E'] } },
  seftali: { tr: 'Şeftali', en: 'Peach', light: { a: ['#EA580C', '#FFFFFF'] }, dark: { a: ['#FB923C', '#2A1002'] } },
  gokyuzu: { tr: 'Gökyüzü', en: 'Sky', light: { a: ['#2563EB', '#FFFFFF'] }, dark: { a: ['#60A5FA', '#06142A'] } },
  gul: { tr: 'Gül', en: 'Rose', light: { a: ['#E11D48', '#FFFFFF'] }, dark: { a: ['#FB7185', '#2A0610'] } },
  vanilya: { tr: 'Vanilya', en: 'Vanilla', light: { a: ['#A16207', '#FFFFFF'] }, dark: { a: ['#FACC15', '#1C1500'] } },
  orman: { tr: 'Orman', en: 'Forest', light: { a: ['#15803D', '#FFFFFF'] }, dark: { a: ['#4ADE80', '#04180B'] } },
  ahsap: { tr: 'Ahşap', en: 'Woody', light: { a: ['#92400E', '#FFFFFF'] }, dark: { a: ['#D97706', '#1C0E02'] } }
};
// Nötr taban renkler: [zemin, yüzey, yüzey 2, yazı, soluk yazı, çok soluk, çizgi]
const BASE = {
  light: ['#F3F3F6', '#FFFFFF', '#F0F0F3', '#111114', '#55555F', '#8A8A94', '#DCDCE2'],
  dark: ['#0D0D0F', '#17171A', '#1F1F23', '#F2F2F5', '#A6A6B0', '#70707A', '#2A2A30']
};
// Ton yoğunluğu: her alanın temanın rengine ne kadar boyanacağı
const TONES = { sade: ['Sade', 0], net: ['Net', 1], canli: ['Canlı', 2] };
const TONE_MIX = {
  light: [[0, 0, 0, 0, 0, 0, 0], [0.08, 0, 0.06, 0.04, 0.14, 0.14, 0.16], [0.16, 0.035, 0.12, 0.08, 0.24, 0.24, 0.28]],
  dark: [[0, 0, 0, 0, 0, 0, 0], [0.06, 0.07, 0.09, 0.03, 0.14, 0.14, 0.15], [0.12, 0.13, 0.16, 0.06, 0.24, 0.24, 0.26]]
};
const HEAD_MIX = [5, 10, 16];
function mixHex(a, b, t) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const ch = sh => Math.round((x >> sh & 255) * (1 - t) + (y >> sh & 255) * t);
  return '#' + [16, 8, 0].map(sh => ch(sh).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function themePalette(id, mode, tone) {
  const t = THEMES[id] || THEMES.notr; const lvl = (TONES[tone] || TONES.net)[1];
  const mix = TONE_MIX[mode][t.tint === false ? 0 : lvl];
  return { c: BASE[mode].map((h, i) => mixHex(h, t[mode].a[0], mix[i])), a: t[mode].a };
}
const OLD_THEME_MAP = { gece: 'notr', grafit: 'notr', kagit: 'notr', beyaz: 'notr', orman: 'orman', ahsap: 'ahsap', kum: 'ahsap', okyanus: 'gokyuzu', gokyuzu: 'gokyuzu', sarap: 'gul', nane: 'nane', lavanta: 'lavanta' };
const ACCENT_NAMES = { theme: 'Temanın rengi', mono: 'Mono', petrol: 'Petrol', turkuaz: 'Turkuaz', mavi: 'Mavi', yesil: 'Yeşil', turuncu: 'Turuncu', mercan: 'Mercan', bordo: 'Bordo', mor: 'Mor' };
const ACCENTS = {
  theme: null, mono: null,
  petrol: { dark: ['#22B8CF', '#04161A'], light: ['#0E7490', '#FFFFFF'] },
  turkuaz: { dark: ['#2DD4BF', '#04201C'], light: ['#0F766E', '#FFFFFF'] },
  mavi: { dark: ['#60A5FA', '#06142A'], light: ['#2563EB', '#FFFFFF'] },
  yesil: { dark: ['#4ADE80', '#04180B'], light: ['#16A34A', '#FFFFFF'] },
  turuncu: { dark: ['#FB923C', '#2A1002'], light: ['#EA580C', '#FFFFFF'] },
  mercan: { dark: ['#FB7185', '#2A0610'], light: ['#E11D48', '#FFFFFF'] },
  bordo: { dark: ['#F87171', '#2A0808'], light: ['#B91C1C', '#FFFFFF'] },
  mor: { dark: ['#C084FC', '#1E0838'], light: ['#9333EA', '#FFFFFF'] }
};
// Üç yazı tipi, hepsi IBM Plex'e yakın; Carlito, Calibri'nin ücretsiz birebir eşdeğeridir
const FONTS = {
  plex: ['IBM Plex Sans', '"IBM Plex Sans",system-ui,sans-serif'],
  carlito: ['Calibri (Carlito)', '"Carlito","Calibri",system-ui,sans-serif'],
  source: ['Source Sans', '"Source Sans 3",system-ui,sans-serif']
};
const CARD_STYLES = { plain: 'Sade', outline: 'Çizgili', filled: 'Kutulu' };
const DENSITY = { compact: ['Sıkı', 7], normal: ['Normal', 11], comfy: ['Rahat', 15] };
// Başlıklar: [klasik, ironik] — kullanıcı her birini Ayarlar'dan yeniden adlandırabilir
const TITLES = {
  today: { tr: ['Bugün', 'Ne var ne yok'], en: ['Today', 'What’s up'] },
  plan: { tr: ['Planla', 'Yol haritası'], en: ['Plan', 'Roadmap'] },
  info: { tr: ['Bilgi', 'Hafıza sarayı'], en: ['Info', 'Memory palace'] },
  settings: { tr: ['Ayarlar', 'Tornavida'], en: ['Settings', 'Screwdriver'] },
  tasks: { tr: ['Görevler', 'Sırada ne var'], en: ['Tasks', 'What’s next'] },
  calendar: { tr: ['Takvim', 'Gün gün'], en: ['Calendar', 'Day by day'] },
  habits: { tr: ['Alışkanlıklar', 'Zinciri kırma'], en: ['Habits', 'Don’t break the chain'] },
  goals: { tr: ['Hedefler', 'Zirve listesi'], en: ['Goals', 'Summit list'] },
  notes: { tr: ['Notlar', 'Aklımda kalsın'], en: ['Notes', 'Mental sticky notes'] },
  pinned: { tr: ['Sabitlenen notlar', 'Buzdolabı kapağı'], en: ['Pinned notes', 'Fridge door'] },
  routines: { tr: ['Tekrarlı işler', 'Vakti geldi'], en: ['Recurring', 'It’s about time'] },
  tools: { tr: ['Araçlar', 'Alet çantası'], en: ['Tools', 'Toolbox'] },
  flow: { tr: ['Günün akışı', 'Saat saat'], en: ['Day flow', 'Hour by hour'] },
  mail: { tr: ['Posta', 'Postacı'], en: ['Mail', 'The mailman'] },
  money: { tr: ['Cüzdan', 'Cüzdan-ı Hümayun'], en: ['Wallet', 'The Royal Treasury'] },
  mSummary: { tr: ['Özet', 'Faiz kararı'], en: ['Summary', 'Rate decision'] },
  mMoves: { tr: ['Hareketler', 'Para trafiği'], en: ['Transactions', 'Money traffic'] },
  mRegular: { tr: ['Düzenli ödemeler', 'Otomatik pilot'], en: ['Regular payments', 'Autopilot'] },
  mAccounts: { tr: ['Hesaplar', 'Şubelerim'], en: ['Accounts', 'My branches'] },
  mCats: { tr: ['Kategoriler', 'Çekmeceler'], en: ['Categories', 'Drawers'] }
};
// 1.5'e kadar kullanılan ironik isimler: ironik stildeki kullanıcıda gördüğü isimler aynen korunur
const OLD_IRONIC = {
  today: ['Bugünün menüsü', 'Today’s menu'], plan: ['Plan yapan kazanır', 'Plans & schemes'], info: ['Beyin yedeği', 'Second brain'], settings: ['Kontrol odası', 'Control room'],
  tasks: ['Kaçamayacakların', 'No escape'], calendar: ['Zaman tüneli', 'Time tunnel'], habits: ['Disiplin kulübü', 'Discipline club'], goals: ['Büyük laflar', 'Big talk'],
  notes: ['Unutmadan yaz', 'Before you forget'], pinned: ['Burada dursun', 'Keep these close'], routines: ['Bakım zamanı', 'Maintenance mode']
};
// Yeni ironik öneriler (dokununca seçilir; kullanıcı kendisi de yazabilir). Seçili olan isim her zaman listede kalır.
// Başlık seçenekleri: her bölüm için [normal adlar], [ironik adlar]. İlk normal ve ilk ironik, TITLES'taki varsayılanlardır.
const TITLE_OPTS = {
  today: { tr: [['Bugün', 'Gün özeti'], ['Ne var ne yok', 'Günün kokpiti', 'Kahve ve plan']], en: [['Today', 'Daily overview'], ['What’s up', 'Daily cockpit', 'Coffee & plans']] },
  flow: { tr: [['Günün akışı', 'Bugünün programı'], ['Saat saat', 'Günün senaryosu', 'Akıp giden']], en: [['Day flow', 'Today’s schedule'], ['Hour by hour', 'Today’s script', 'Go with the flow']] },
  plan: { tr: [['Planla', 'Planlama'], ['Yol haritası', 'Kumanda masası', 'Plan yapan kazanır']], en: [['Plan', 'Planning'], ['Roadmap', 'Mission control', 'Plans & schemes']] },
  tasks: { tr: [['Görevler', 'Yapılacaklar'], ['Sırada ne var', 'Kaçamayacakların', 'Bunu da hallet']], en: [['Tasks', 'To-dos'], ['What’s next', 'No escape', 'Get it done']] },
  calendar: { tr: [['Takvim', 'Ajanda'], ['Gün gün', 'Zaman tüneli', 'Saat kaç?']], en: [['Calendar', 'Agenda'], ['Day by day', 'Time tunnel', 'What time is it?']] },
  routines: { tr: [['Tekrarlı işler', 'Düzenli işler'], ['Vakti geldi', 'Dönüp dolaşıp', 'Yine mi sen?']], en: [['Recurring', 'Regular tasks'], ['It’s about time', 'Round and round', 'You again?']] },
  habits: { tr: [['Alışkanlıklar', 'Günlük rutin'], ['Zinciri kırma', 'Mini zaferler', 'Her gün biraz']], en: [['Habits', 'Daily routine'], ['Don’t break the chain', 'Tiny wins', 'A little every day']] },
  goals: { tr: [['Hedefler', 'Amaçlar'], ['Zirve listesi', 'Büyük laflar', 'Yapacağım, göreceksin']], en: [['Goals', 'Aims'], ['Summit list', 'Big talk', 'Watch me']] },
  info: { tr: [['Bilgi', 'Arşiv'], ['Hafıza sarayı', 'Kara kutu', 'İkinci beyin']], en: [['Info', 'Archive'], ['Memory palace', 'Black box', 'Second brain']] },
  notes: { tr: [['Notlar', 'Defter'], ['Aklımda kalsın', 'Unutmadan yaz', 'Kâğıt parçaları']], en: [['Notes', 'Notebook'], ['Mental sticky notes', 'Before you forget', 'Paper scraps']] },
  pinned: { tr: [['Sabitlenen notlar', 'Önemli notlar'], ['Buzdolabı kapağı', 'Baş köşe', 'Burada dursun']], en: [['Pinned notes', 'Important notes'], ['Fridge door', 'Place of honor', 'Keep these close']] },
  mail: { tr: [['Posta', 'E-posta'], ['Postacı', 'Mektup var', 'Zarf açacağı']], en: [['Mail', 'Email'], ['The mailman', 'You’ve got mail', 'Letter opener']] },
  tools: { tr: [['Araçlar', 'Araçlar ve oyunlar'], ['Alet çantası', 'İsviçre çakısı', 'Mola köşesi']], en: [['Tools', 'Tools & games'], ['Toolbox', 'Swiss army knife', 'Break corner']] },
  settings: { tr: [['Ayarlar', 'Tercihler'], ['Tornavida', 'Arka oda', 'Ayar çekme']], en: [['Settings', 'Preferences'], ['Screwdriver', 'Back room', 'Fine tuning']] },
  money: { tr: [['Cüzdan', 'Bütçe'], ['Cüzdan-ı Hümayun', 'Merkez Bankam', 'Hazine-i Hassa', 'Darphane']], en: [['Wallet', 'Budget'], ['The Royal Treasury', 'My Central Bank', 'Fort Knox', 'The Mint']] },
  mSummary: { tr: [['Özet', 'Genel durum'], ['Faiz kararı', 'Bilanço saati', 'Yönetim kurulu']], en: [['Summary', 'Overview'], ['Rate decision', 'Balance sheet hour', 'Board meeting']] },
  mMoves: { tr: [['Hareketler', 'Gelir ve gider'], ['Para trafiği', 'Gişe', 'Turnike']], en: [['Transactions', 'Income & spending'], ['Money traffic', 'Box office', 'Turnstile']] },
  mRegular: { tr: [['Düzenli ödemeler', 'Sabit giderler'], ['Otomatik pilot', 'Sadık müşteriler', 'Abone olduklarım']], en: [['Regular payments', 'Fixed costs'], ['Autopilot', 'Loyal customers', 'Things I subscribed to']] },
  mAccounts: { tr: [['Hesaplar', 'Bakiyeler'], ['Şubelerim', 'Kasa dairesi', 'Varlık barışı']], en: [['Accounts', 'Balances'], ['My branches', 'The vault', 'Asset amnesty']] },
  mCats: { tr: [['Kategoriler', 'Gruplar'], ['Çekmeceler', 'Muhasebe dolabı', 'Raf düzeni']], en: [['Categories', 'Groups'], ['Drawers', 'Accounting cabinet', 'Shelf order']] }
};
const TITLE_SUGGEST = {}; Object.keys(TITLE_OPTS).forEach(k => { TITLE_SUGGEST[k] = { tr: TITLE_OPTS[k].tr[1], en: TITLE_OPTS[k].en[1] }; });
const isEn = () => settings().lang === 'en';
function T(key) { const st = settings(); const c = (st.titles || {})[key]; if (c) return c; if (st.titleStyle === 'ironic' && st.ironicKeep && st.ironicKeep[key]) return st.ironicKeep[key]; const t = TITLES[key]; if (!t) return key; return t[isEn() ? 'en' : 'tr'][st.titleStyle === 'ironic' ? 1 : 0]; }
function TL(key) { const c = (settings().titles || {})[key]; if (c) return c; const t = TITLES[key]; return t ? t[isEn() ? 'en' : 'tr'][0] : key; }
function settings() {
  let s = S.items.get('settings');
  if (!s) { s = clone(DEFAULT_SETTINGS); S.items.set('settings', s); }
  if (!s.look) { Object.assign(s, clone(LOOK_DEFAULTS), { theme: s.theme === 'light' || s.theme === 'system' ? s.theme : 'dark' }); s.look = 3; }
  if (s.look < 3) {
    const oldD = { oled: 'gece', lacivert: 'okyanus', sepya: 'ahsap' }, oldL = { gri: 'beyaz', opex: 'nane' };
    if (oldD[s.darkPal]) s.darkPal = oldD[s.darkPal];
    if (oldL[s.lightPal]) s.lightPal = oldL[s.lightPal];
    if (!s.accent || s.accent === 'mono' || s.accent === 'grafit') s.accent = 'theme';
    delete s.radius; s.look = 3;
  }
  if (s.look < 4) {
    s.themeId = OLD_THEME_MAP[s.theme === 'light' ? s.lightPal : s.darkPal] || 'notr';
    if (!s.cards || s.cards === 'plain') s.cards = 'filled';
    if (Number(s.fs) > 1) s.fs = 1;
    if (s.titleStyle === 'ironic') { s.ironicKeep = {}; for (const k in OLD_IRONIC) s.ironicKeep[k] = OLD_IRONIC[k][s.lang === 'en' ? 1 : 0]; }
    delete s.darkPal; delete s.lightPal; s.look = 4;
  }
  if (s.today && !s.today.find(x => x.k === 'flow')) { s.today.unshift({ k: 'flow', on: true }); const ev = s.today.find(x => x.k === 'events'); if (ev) ev.on = false; }
  if (!s.tabs) s.tabs = [{ k: 'today', on: true }, { k: 'plan', on: true }, { k: 'info', on: true }, { k: 'mail', on: s.mailTab !== false }, { k: 'tools', on: s.tools !== false }];
  if (s.tabs && !s.tabs.find(x => x.k === 'money')) { const i = s.tabs.findIndex(x => x.k === 'plan'); s.tabs.splice(i < 0 ? 1 : i + 1, 0, { k: 'money', on: true }); }
  if (s.today && !s.today.find(x => x.k === 'money')) s.today.push({ k: 'money', on: true });
  if (s.today && !s.today.find(x => x.k === 'weekly')) s.today.splice(1, 0, { k: 'weekly', on: true });
  if (s.today && !s.today.find(x => x.k === 'counters')) { const i = s.today.findIndex(x => x.k === 'flow'); s.today.splice(i < 0 ? 0 : i + 1, 0, { k: 'counters', on: true }); }
  for (const k in DEFAULT_SETTINGS) if (s[k] === undefined) s[k] = clone(DEFAULT_SETTINGS[k]);
  if (!THEMES[s.themeId]) s.themeId = 'notr';
  if (![0.8, 0.9, 1].includes(Number(s.fs))) s.fs = 1;
  if (!FONTS[s.font]) s.font = 'plex';
  if (!TONES[s.tone]) s.tone = 'net';
  if (!(s.accent in ACCENTS)) s.accent = 'theme';
  ['today', 'plan'].forEach(key => DEFAULT_SETTINGS[key].forEach(d => { if (!s[key].find(x => x.k === d.k)) s[key].push(clone(d)); }));
  s.today = s.today.filter(x => !String(x.k).startsWith('c:') || (s.custom || []).some(m => 'c:' + m.id === x.k));
  if (S.setSnapFor !== s) { S.setSnap = setFlat(s); S.setSnapFor = s; } // yüklenen/değişen kayıt için anlık görüntü
  return s;
}
const saveSettings = () => save(settings());
const planOn = k => { const m = settings().plan.find(x => x.k === k); return !!(m && m.on); };
function currentTheme() {
  const t = settings().theme;
  if (t === 'system') return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  return t === 'light' ? 'light' : 'dark';
}
function currentPalette() { const st = settings(); return themePalette(st.themeId, currentTheme(), st.tone); }
function currentAccent() {
  const st = settings(); const mode = currentTheme(); const p = currentPalette();
  if (st.accent === 'mono') return [p.c[3], p.c[0]];
  if (st.accent === 'theme' || !ACCENTS[st.accent]) return p.a;
  return ACCENTS[st.accent][mode];
}
function applyTheme() {
  const st = settings(); const mode = currentTheme(); const p = currentPalette();
  const root = document.documentElement, css = (k, v) => root.style.setProperty(k, v);
  root.dataset.theme = mode;
  ['--bg', '--surface', '--surface2', '--text', '--muted', '--faint', '--line'].forEach((k, i) => css(k, p.c[i]));
  const a = currentAccent();
  css('--accent', a[0]); css('--accent-ink', a[1]); css('--accent-soft', hexA(a[0], mode === 'dark' ? 0.16 : 0.12));
  css('--tint', p.a[0]); css('--head-mix', (THEMES[st.themeId] && THEMES[st.themeId].tint === false ? HEAD_MIX[0] : HEAD_MIX[(TONES[st.tone] || TONES.net)[1]]) + '%');
  css('--font', (FONTS[st.font] || FONTS.plex)[1]);
  css('--fs', String(Math.max(0.8, Math.min(1, Number(st.fs) || 1))));
  css('--pad', (DENSITY[st.density] || DENSITY.normal)[1] + 'px');
  root.dataset.cards = CARD_STYLES[st.cards] ? st.cards : 'plain';
  root.dataset.tablabels = st.tabLabels === false ? 'off' : 'on';
  const en = st.lang === 'en'; TR = en ? 'en-GB' : 'tr-TR'; root.lang = en ? 'en' : 'tr';
  DAYS.splice(0, 7, ...(en ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']));
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = p.c[0];
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

/* ===================== Kendi bölümlerin (özel modüller) ===================== */
const CTYPES = {
  list: ['Liste', 'İşaretlenebilir maddeler: alışveriş, valiz, okunacaklar', 'task'],
  notes: ['Not defteri', 'Kısa yazılar: fikirler, alıntılar, hatırlatmalar', 'note'],
  counter: ['Sayaç', 'Sayılar: kahve, su bardağı, spor turu', 'plus'],
  log: ['Kayıt defteri', 'Tarihli kayıt ve sayı: harcama, kilo, km', 'clock']
};
const customMods = () => settings().custom || [];
const cmod = id => customMods().find(m => m.id === id);

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
// Görev tekrarı (1.13): t.rec (etkinliklerle aynı biçim). Eski t.repeat değerleri buraya çevrilir.
const LEGACY_REP = { daily: { unit: 'day' }, weekdays: { unit: 'week', wdays: [0, 1, 2, 3, 4] }, weekly: { unit: 'week' }, monthly: { unit: 'month' }, yearly: { unit: 'year' } };
function taskRec(t) { if (t.rec) return t.rec; const l = LEGACY_REP[t.repeat]; return l ? Object.assign({ mode: 'cal', every: 1, wdays: [], mday: null, until: '' }, l) : null; }
function taskOn(t, d) {
  if (!t.due || t.done || d < t.due) return false; if (d === t.due) return true;
  const r = taskRec(t); if (!r || (r.until && d > r.until)) return false;
  let x = t.due; for (let i = 0; i < 800; i++) { x = nextOcc(x, r); if (x === d) return true; if (x > d) return false; }
  return false;
}
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
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar';
function gScopes(extra) { const set = new Set(); if (Drive.on()) set.add(GSCOPE); if (typeof Cal !== 'undefined' && Cal.on()) set.add(GCAL_SCOPE); if (typeof Mail !== 'undefined') Mail.scopes().forEach(x => set.add(x)); (extra || []).forEach(x => set.add(x)); if (!set.size) set.add(GSCOPE); return Array.from(set).join(' '); }
const Drive = {
  cfg: null, token: null, exp: 0, busy: false, again: false, status: 'off', error: '', timer: null, gisP: null, nagged: false,
  async load() {
    try { this.cfg = (await DB.getMeta('drive')) || null; } catch (e) { this.cfg = null; }
    try { const t = JSON.parse(lsGet('pusula.gtok', 'null')); if (t && t.exp > Date.now()) { this.token = t.v; this.exp = t.exp; this.granted = t.s || GSCOPE; } } catch (e) { /* yok */ }
    this.status = this.on() ? 'idle' : 'off';
  },
  async saveCfg() { await DB.setMeta('drive', this.cfg); },
  on() { return !!(this.cfg && this.cfg.connected && this.cfg.clientId); },
  tokenOk(scope) { return !!this.token && Date.now() < this.exp - 60000 && (!scope || (this.granted || '').indexOf(scope) >= 0); },
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
  requestToken(prompt, extra) {
    return new Promise((res, rej) => {
      if (!this.gisReady()) { this.loadGis().catch(() => {}); return rej(new Error('Google girişi hazırlanıyor, birkaç saniye sonra tekrar dokun')); }
      const scope = gScopes(extra);
      const tc = google.accounts.oauth2.initTokenClient({
        client_id: (this.cfg && this.cfg.clientId) || DRIVE_CLIENT_ID, scope, include_granted_scopes: true, hint: lsGet('pusula.gemail', '') || undefined,
        callback: r => {
          if (r.error) return rej(new Error(r.error_description || r.error));
          this.token = r.access_token; this.exp = Date.now() + (Number(r.expires_in) || 3600) * 1000; this.granted = r.scope || scope; this.nagged = false;
          lsSet('pusula.gtok', JSON.stringify({ v: this.token, exp: this.exp, s: this.granted })); res(); setTimeout(gCaptureEmail, 500);
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
    if (!r.ok) {
      let m = 'Google hatası ' + r.status; try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (e) { /* yok */ }
      if (/has not been used|is disabled|accessNotConfigured/i.test(m)) m = 'Google Cloud’da bu API kapalı. console.cloud.google.com → PUSULA → APIs & Services → Library’den açman gerekiyor.';
      if (r.status === 403 && /insufficient/i.test(m)) { this.granted = /gmail/.test(url) ? (this.granted || '').split(' ').filter(x => !/gmail/.test(x)).join(' ') : (this.granted || '').replace(GCAL_SCOPE, ''); const e = new Error('Google izni eksik, tekrar bağlan'); e.auth = true; throw e; }
      const e = new Error(m); e.status = r.status; throw e;
    }
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
  schedule(d) { if (!this.on() || !this.tokenOk(GSCOPE)) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.run(false), d == null ? 4000 : d); },
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
    if (!this.tokenOk(GSCOPE)) {
      if (!interactive) { this.setStatus('needauth'); return; }
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
          if (it.id === 'settings' && loc) { // alan alan birleştir
            const m = setMerge(loc, it); if (JSON.stringify(setFlat(m.rec)) === JSON.stringify(setFlat(loc))) { if (m.up) loc._dd = 1; return; }
            if (m.up) m.rec._dd = 1; S.items.set('settings', m.rec); S.setSnap = setFlat(m.rec); S.setSnapFor = m.rec; toPut.push(m.rec); changed = true; return;
          }
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
/* Google hesabını hatırla: sonraki oturum yenilemelerinde hesap seçimi sorulmaz, pencere kendiliğinden kapanır */
async function gCaptureEmail() {
  if (lsGet('pusula.gemail', '')) return;
  try {
    let em = '';
    if (Cal.on() && Cal.cals().length) { const p = Cal.cals().find(c => c.primary); if (p && /@/.test(p.id)) em = p.id; }
    if (!em && Drive.tokenOk('https://www.googleapis.com/auth/gmail.modify')) { const r = await Drive.api('https://gmail.googleapis.com/gmail/v1/users/me/profile'); em = (await r.json()).emailAddress || ''; }
    if (!em && Drive.tokenOk(GSCOPE)) { const r = await Drive.api('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)'); em = ((await r.json()).user || {}).emailAddress || ''; }
    if (em) lsSet('pusula.gemail', em);
  } catch (e) { /* sonra tekrar denenir */ }
}
/* Oturumu dokununca yenile: Google oturumu bitmiş ya da bitmek üzereyse uygulamadaki ilk dokunuşta sessizce yenilenir */
let gAutoAt = 0;
document.addEventListener('click', e => {
  if (settings().gAuto === false || !navigator.onLine || Date.now() - gAutoAt < 120000) return;
  if (!(Drive.on() || Cal.on() || (typeof Mail !== 'undefined' && Mail.on()))) return;
  const soon = Drive.token && Drive.exp - Date.now() < 5 * 60000;
  if (!gNeedsToken() && !soon) return;
  const t = e.target; if (t.closest && t.closest('input,textarea,select,[data-act=sync-now],[data-act=gm-auth],[data-act=gm-connect],[data-act=cal-connect],[data-act=drive-connect],#sheetRoot .ink-wrap')) return;
  if (!Drive.gisReady()) { Drive.loadGis().catch(() => {}); return; }
  gAutoAt = Date.now(); gSync(true);
}, true);
/* Drive ve Takvim için tek eşitleme girişi. interactive=true ise dokunuşla Google oturumu yenilenir. */
function gNeedsToken() { const need = []; if (Drive.on()) need.push(GSCOPE); if (Cal.on()) need.push(GCAL_SCOPE); if (typeof Mail !== 'undefined' && Mail.on()) need.push(Mail.scopes()[0]); return need.length > 0 && !need.every(x => Drive.tokenOk(x)); }
async function gSync(interactive) {
  const gm = typeof Mail !== 'undefined' && Mail.on();
  if (!Drive.on() && !Cal.on() && !gm) return;
  if (!navigator.onLine) { if (Drive.on()) Drive.setStatus('offline'); return; }
  if (gNeedsToken()) {
    if (!interactive) {
      if (Drive.on()) Drive.setStatus('needauth'); if (Cal.on()) Cal.setStatus('needauth');
      if (!Drive.nagged) { Drive.nagged = true; toast('Google ile eşitlemek için dokun', { label: 'Eşitle', fn: () => gSync(true) }, 10000); }
      return;
    }
    try { await Drive.requestToken(); } catch (e) { toast(e.message); return; }
  }
  if (Drive.on()) await Drive.run(false);
  if (Cal.on()) await Cal.sync();
  if (gm) await Mail.refreshCounts();
}

/* ===================== Google Takvim ===================== */
const CAL_API = 'https://www.googleapis.com/calendar/v3';
const Cal = {
  cfg: null, byDate: {}, fetched: {}, busy: false, status: 'off', error: '',
  async load() {
    try { this.cfg = (await DB.getMeta('gcal')) || null; } catch (e) { this.cfg = null; }
    try { const c = JSON.parse(lsGet('pusula.gcal', '{}')) || {}; this.byDate = c.byDate || {}; } catch (e) { this.byDate = {}; }
    this.status = this.on() ? 'idle' : 'off';
  },
  async saveCfg() { await DB.setMeta('gcal', this.cfg); },
  on() { return !!(this.cfg && this.cfg.connected); },
  ready() { return this.on() && navigator.onLine && Drive.tokenOk(GCAL_SCOPE); },
  persist() {
    const lo = addDays(today(), -62), hi = addDays(today(), 400); const keep = {};
    Object.keys(this.byDate).forEach(d => { if (d >= lo && d <= hi) keep[d] = this.byDate[d]; });
    this.byDate = keep; lsSet('pusula.gcal', JSON.stringify({ byDate: keep }));
  },
  setStatus(st, err) { this.status = st; this.error = err || ''; const el = $('#calStatus'); if (el) el.innerHTML = calStatusHtml(); const el2 = $('#calStatus2'); if (el2) el2.innerHTML = calStatusHtml(); },
  cals() { return (this.cfg && this.cfg.cals) || []; },
  calById(id) { return this.cals().find(c => c.id === id); },
  writable() { return this.cals().filter(c => c.role === 'owner' || c.role === 'writer'); },
  async listCalendars() {
    const r = await Drive.api(CAL_API + '/users/me/calendarList?maxResults=250');
    const j = await r.json(); const old = this.cals();
    this.cfg.cals = (j.items || []).map(c => { const o = old.find(x => x.id === c.id); return { id: c.id, name: c.summaryOverride || c.summary, color: c.backgroundColor || '', role: c.accessRole, primary: !!c.primary, on: o ? o.on : (c.primary || c.accessRole === 'owner') }; });
    if (!this.cfg.def || !this.calById(this.cfg.def)) { const p = this.cfg.cals.find(c => c.primary) || this.writable()[0]; this.cfg.def = p ? p.id : ''; }
    await this.saveCfg();
  },
  mapEvent(e, cal) {
    const allDay = !!(e.start && e.start.date);
    const date = allDay ? e.start.date : (e.start && e.start.dateTime || '').slice(0, 10);
    const hm = x => { if (!x) return ''; const d = new Date(x); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
    const localDate = allDay ? date : ymd(new Date(e.start.dateTime));
    return { gid: e.id, cal: cal.id, color: cal.color, calName: cal.name, title: e.summary || '(başlıksız)', date: localDate, allDay, start: allDay ? '' : hm(e.start.dateTime), end: allDay ? '' : hm(e.end && e.end.dateTime), endDate: allDay && e.end ? e.end.date : '', notes: e.description || '', loc: e.location || '', recurring: !!e.recurringEventId, rid: e.recurringEventId || '', remind: e.reminders && !e.reminders.useDefault ? (e.reminders.overrides || []).filter(o => o.method === 'popup').map(o => o.minutes) : null, remindDefault: !!(e.reminders && e.reminders.useDefault) };
  },
  async fetchRange(from, to) {
    const all = [];
    for (const c of this.cals().filter(x => x.on)) {
      let pageToken = '';
      do {
        const url = CAL_API + '/calendars/' + encodeURIComponent(c.id) + '/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=' + encodeURIComponent(parseYmd(from).toISOString()) + '&timeMax=' + encodeURIComponent(parseYmd(to).toISOString()) + (pageToken ? '&pageToken=' + pageToken : '');
        const r = await Drive.api(url); const j = await r.json();
        (j.items || []).forEach(e => { if (e.status !== 'cancelled') all.push(this.mapEvent(e, c)); });
        pageToken = j.nextPageToken || '';
      } while (pageToken);
    }
    for (let d = from; d < to; d = addDays(d, 1)) delete this.byDate[d];
    all.forEach(e => {
      let d = e.date; const last = e.allDay && e.endDate ? addDays(e.endDate, -1) : e.date; let n = 0;
      while (d <= last && n < 31) { if (d >= from && d < to) (this.byDate[d] = this.byDate[d] || []).push(e); d = addDays(d, 1); n++; }
    });
    this.persist();
  },
  async fetchMonth(m) {
    const first = m + '-01'; const from = addDays(first, -dow(first) - 7); const to = addDays(from, 56);
    this.fetched[m] = Date.now();
    await this.fetchRange(from, to);
  },
  // PUSULA rutinlerinin Google'daki kopyaları gösterilmez (rutin zaten PUSULA'da görünüyor)
  mirrorIds() { const s = new Set(); list('routine').concat(list('task')).forEach(r => { if (r.gev && r.gev.id) s.add(r.gev.id); }); return s; },
  isMirror(e, ids) { return ids.has(e.gid) || (e.rid && ids.has(e.rid)) || /^PUSULA (rutini|görevi|ödemesi|odak)/.test(e.notes || ''); },
  forDate(d) { const ids = this.mirrorIds(); return (this.byDate[d] || []).filter(e => !this.isMirror(e, ids)).sort((a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || (a.start || '').localeCompare(b.start || '')); },
  findEvent(gid) { for (const d in this.byDate) { const e = this.byDate[d].find(x => x.gid === gid); if (e) return e; } return null; },
  body(ev) {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Europe/Istanbul';
    const b = { summary: ev.title, description: ev.notes || '' };
    if (ev.allDay || !ev.start) { b.start = { date: ev.date }; b.end = { date: addDays(ev.date, 1) }; }
    else {
      let end = ev.end; if (!end || end <= ev.start) { const h = Math.min(23, +ev.start.slice(0, 2) + 1); end = pad(h) + ':' + ev.start.slice(3, 5); }
      b.start = { dateTime: ev.date + 'T' + ev.start + ':00', timeZone: tz }; b.end = { dateTime: ev.date + 'T' + end + ':00', timeZone: tz };
    }
    if (ev.rec) b.recurrence = [rrule(ev.rec, ev.allDay || !ev.start)];
    if (ev.remind && ev.remind.length && !(ev.allDay || !ev.start)) b.reminders = { useDefault: false, overrides: ev.remind.slice(0, 5).map(m => ({ method: 'popup', minutes: Math.min(40320, m) })) };
    else if (ev.remind && ev.remindOff) b.reminders = { useDefault: false, overrides: [] };
    return b;
  },
  async insert(calId, ev) { const r = await Drive.api(CAL_API + '/calendars/' + encodeURIComponent(calId) + '/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.body(ev)) }); return r.json(); },
  async patch(calId, gid, ev) { const r = await Drive.api(CAL_API + '/calendars/' + encodeURIComponent(calId) + '/events/' + encodeURIComponent(gid), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.body(ev)) }); return r.json(); },
  async del(calId, gid) { try { await Drive.api(CAL_API + '/calendars/' + encodeURIComponent(calId) + '/events/' + encodeURIComponent(gid), { method: 'DELETE' }); } catch (e) { if (e.status !== 404 && e.status !== 410) throw e; } },
  // Rutin tarihini takvime yaz (tüm gün etkinlik)
  async upsertRoutine(r) {
    if (!this.on() || this.cfg.routines === false || !r.toCal) return;
    if (!this.ready() || !this.cfg.def) { r._calPending = 1; return; }
    const ev = { title: r.title, date: r.next, allDay: !r.time, start: r.time || '', end: '', notes: 'PUSULA rutini · ' + recText(r.rec), remind: r.time ? (r.remind || []) : null,
      rec: r.rec && r.rec.mode === 'cal' ? Object.assign({}, r.rec, { until: routineUntil(r) }) : null };
    try {
      if (r.gev && r.gev.id) { try { await this.patch(r.gev.cal, r.gev.id, ev); } catch (e) { if (e.status === 404 || e.status === 410) r.gev = null; else throw e; } }
      if (!r.gev || !r.gev.id) { const res = await this.insert(this.cfg.def, ev); r.gev = { id: res.id, cal: this.cfg.def }; }
      delete r._calPending; r.rr = 2; await save(r, { silent: true });
    } catch (e) { console.warn(e); r._calPending = 1; }
  },
  // Görevi takvime yaz: tarihi olan, bitmemiş görev tek etkinlik olarak durur; tamamlanınca silinir, tekrarlıysa sonraki tarihe taşınır
  async upsertTask(t) {
    if (!this.on()) return;
    const want = t.toCal !== false && (t.toCal || this.cfg.tasks !== false) && t.due && !t.done && !t.deleted;
    if (!this.ready() || !this.cfg.def) { if (want || t.gev) { t._calPending = 1; save(t, { silent: true }); } return; }
    try {
      if (!want) { if (t.gev && t.gev.id) { await this.del(t.gev.cal, t.gev.id); t.gev = null; } delete t._calPending; await save(t, { silent: true }); return; }
      const ev = { title: t.title, date: t.due, allDay: !t.time, start: t.time || '', end: '', notes: 'PUSULA görevi' + (t.notes ? '\n' + t.notes : ''), remind: t.time ? (t.remind || []) : null };
      if (t.gev && t.gev.id) { try { await this.patch(t.gev.cal, t.gev.id, ev); } catch (e) { if (e.status === 404 || e.status === 410) t.gev = null; else throw e; } }
      if (!t.gev || !t.gev.id) { const res = await this.insert(this.cfg.def, ev); t.gev = { id: res.id, cal: this.cfg.def }; }
      delete t._calPending; await save(t, { silent: true });
    } catch (e) { console.warn(e); t._calPending = 1; save(t, { silent: true }); }
  },
  async flushRoutines() {
    for (const t of S.items.values()) if (t.type === 'task' && t._calPending) await this.upsertTask(t); for (const r of list('routine')) if (r.toCal && (r._calPending || (r.gev && r.rec && r.rec.mode === 'cal' && r.rr !== 2))) await this.upsertRoutine(r); }, // rr=2: Google'da tekrarlı etkinlik olarak yazıldı
  async sync() {
    if (!this.ready() || this.busy) { if (this.on() && !this.ready() && navigator.onLine) this.setStatus('needauth'); return; }
    this.busy = true; this.setStatus('syncing');
    try {
      if (!this.cals().length) await this.listCalendars();
      const months = new Set([today().slice(0, 7), (S.calMonth || today().slice(0, 7))]);
      for (const m of months) await this.fetchMonth(m);
      await this.flushRoutines();
      this.setStatus('ok');
      if (!S.ink && !S.noteEd && !$('#sheetRoot').classList.contains('open') && (S.tab === 'today' || (S.tab === 'plan' && S.planSub === 'calendar'))) render();
    } catch (e) { console.warn(e); this.setStatus(e.auth ? 'needauth' : 'error', e.message); }
    finally { this.busy = false; }
  }
};
function calStatusHtml() {
  const c = Cal, s = c.status;
  if (!c.on()) return '<span class="status-dot"></span>Kapalı';
  if (s === 'syncing') return '<span class="status-dot syncing"></span>Eşitleniyor…';
  if (s === 'needauth') return '<span class="status-dot syncing"></span>Eşitlemek için “Şimdi eşitle”ye dokun';
  if (s === 'error') return '<span class="status-dot error"></span>' + esc(c.error);
  return '<span class="status-dot ok"></span><span>Bağlı</span> · ' + c.cals().filter(x => x.on).length + ' <span>takvim</span>';
}
function openCal() {
  if (navigator.onLine) Drive.loadGis().catch(() => {});
  let body;
  if (!Cal.on()) {
    body = '<p class="muted">Google Takvim etkinliklerin PUSULA takviminde ve Bugün ekranında görünür. PUSULA’dan eklediğin etkinlikler Google Takvim’e yazılır.</p>' +
      '<p class="muted">Rutinlerin tarihlerini de takvime yazabilirim; böylece telefonuna Google Takvim bildirimi gelir.</p>' +
      '<div class="sheet-msg" id="calMsg"></div><button class="btn primary block" data-act="cal-connect">' + icon('event') + ' Google Takvim’i bağla</button>' +
      '<p class="muted sm">Hata alırsan: Google Cloud’da PUSULA projesinde <b>Google Calendar API</b>’nin açık (Enable) olduğundan emin ol.</p>';
  } else {
    const cals = Cal.cals();
    body = '<div class="set-row"><div class="grow"><div>Google Takvim bağlı</div><div class="sub" id="calStatus2">' + calStatusHtml() + '</div></div></div>' +
      '<div class="set-sub">Gösterilecek takvimler</div>' + (cals.length ? cals.map(c => '<div class="set-row"><span class="cal-dot" style="background:' + esc(c.color || 'var(--accent)') + '"></span><div class="grow u">' + esc(c.name) + '</div><button class="switch ' + (c.on ? 'on' : '') + '" data-act="cal-toggle" data-id="' + esc(c.id) + '" aria-label="Aç/kapat"></button></div>').join('') : '<p class="muted sm">Takvim listesi için “Şimdi eşitle”ye dokun.</p>') +
      (Cal.writable().length ? '<label class="field"><span>Yeni etkinlikler şu takvime</span><select class="input" id="calDef">' + Cal.writable().map(c => '<option value="' + esc(c.id) + '" ' + (Cal.cfg.def === c.id ? 'selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></label>' : '') +
      '<div class="set-row" style="margin-top:8px"><div class="grow"><div>Görevleri takvime yaz</div><div class="sub">Yeni görevlerde varsayılan; görev eklerken ayrıca seçebilirsin</div></div><button class="switch ' + (Cal.cfg.tasks !== false ? 'on' : '') + '" data-act="cal-tasks" aria-label="Aç/kapat"></button></div>' +
      '<div class="set-row" style="margin-top:8px"><div class="grow"><div>Rutin tarihlerini takvime yaz</div><div class="sub">Rutin eklerken ayrıca seçebilirsin</div></div><button class="switch ' + (Cal.cfg.routines !== false ? 'on' : '') + '" data-act="cal-routines" aria-label="Aç/kapat"></button></div>' +
      '<button class="btn primary block" data-act="sync-now">' + icon('sync') + ' Şimdi eşitle</button><button class="btn block" data-act="cal-off">Bu cihazda bağlantıyı kes</button>';
  }
  openSheet(sheetHead('Google Takvim') + '<div class="sheet-body">' + body + '</div>', { onClose: () => setTimeout(render, 0) });
}
function calConnect() {
  const msg = $('#calMsg'); const say = (t, cls) => { if (msg) { msg.textContent = t; msg.className = 'sheet-msg ' + (cls || ''); } };
  if (!navigator.onLine) return say('Bağlanmak için internet gerekli.', 'err');
  if (!Drive.gisReady()) { say('Google girişi hazırlanıyor… birkaç saniye sonra tekrar bas.'); Drive.loadGis().catch(e => say(e.message, 'err')); return; }
  say('Google penceresi açılıyor…');
  Drive.requestToken('consent', [GCAL_SCOPE]).then(async () => {
    if (!Drive.tokenOk(GCAL_SCOPE)) return say('Takvim izni verilmedi.', 'err');
    Cal.cfg = Object.assign({ routines: true }, Cal.cfg || {}, { connected: true }); await Cal.saveCfg();
    if (Cal.cfg.routines !== false) for (const r of list('routine')) if (!r.toCal) { r.toCal = true; r._calPending = 1; await save(r, { silent: true }); }
    say('Bağlandı, takvimler alınıyor…', 'ok');
    try { await Cal.listCalendars(); await Cal.sync(); toast('Google Takvim bağlandı'); openCal(); }
    catch (e) { say(e.message, 'err'); }
  }).catch(e => say(e.message, 'err'));
}

function driveStatusHtml() {
  const d = Drive, s = d.status;
  if (!d.on()) return '<span class="status-dot"></span>Kapalı';
  if (s === 'syncing') return '<span class="status-dot syncing"></span>Eşitleniyor…';
  if (s === 'ok') return '<span class="status-dot ok"></span>Güncel · ' + d.lastOk.toLocaleTimeString(TR, { hour: '2-digit', minute: '2-digit' });
  if (s === 'offline') return '<span class="status-dot"></span>Çevrimdışı — internet gelince eşitlenecek';
  if (s === 'needauth') return '<span class="status-dot syncing"></span>Eşitlemek için “Şimdi eşitle”ye dokun';
  if (s === 'error') return '<span class="status-dot error"></span>' + esc(d.error);
  const t = d.cfg && d.cfg.lastOk ? new Date(d.cfg.lastOk) : null;
  return '<span class="status-dot ok"></span>Bağlı' + (t ? ' · son eşitleme ' + t.toLocaleString(TR, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
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

/* ===================== Dil (TR / EN) ===================== */
// Arayüz Türkçe yazılır; İngilizce seçilince ekrandaki metinler bu sözlükle çevrilir. Kullanıcının yazdıkları (.u, .row-title) çevrilmez.
const EN = {
  'Bugün': 'Today', 'Yarın': 'Tomorrow', 'Dün': 'Yesterday', 'Planla': 'Plan', 'Bilgi': 'Info', 'Ayarlar': 'Settings', 'Notlar': 'Notes',
  'Görevler': 'Tasks', 'Takvim': 'Calendar', 'Alışkanlıklar': 'Habits', 'Hedefler': 'Goals', 'Sabitlenen notlar': 'Pinned notes',
  'Günaydın': 'Good morning', 'İyi günler': 'Good afternoon', 'İyi akşamlar': 'Good evening', 'İyi geceler': 'Good night',
  'görev': 'tasks', 'etkinlik': 'events', 'alışkanlık': 'habits',
  'Bugün ekranı boş. Ayarlar’dan kart ekleyebilirsin.': 'Your Today screen is empty. Add cards in Settings.',
  'Bugün için görev yok.': 'No tasks for today.', 'Bugün takvimin boş.': 'Your calendar is clear today.', 'Bugün için alışkanlık yok.': 'No habits for today.',
  'Açık': 'Light', 'Bekleyen': 'Open', 'Yaklaşan': 'Upcoming', 'Biten': 'Done', 'Hızlı görev ekle…': 'Quick add a task…', 'Bugün için görev ekle…': 'Add a task for today…',
  'Gecikmiş': 'Overdue', 'Bu hafta': 'This week', 'Daha sonra': 'Later', 'Tarihsiz': 'No date', 'Bugün ve gecikmiş': 'Today & overdue', 'Tamamlanan': 'Completed',
  'Bekleyen görev yok. Yukarıdan hızlıca ekleyebilirsin.': 'No open tasks. Add one above.', 'Yaklaşan tarihli görev yok.': 'No upcoming tasks.', 'Henüz tamamlanan görev yok.': 'No completed tasks yet.',
  'Yeni görev': 'New task', 'Görevi düzenle': 'Edit task', 'Ne yapılacak?': 'What needs doing?', 'Not ekle (isteğe bağlı)': 'Add a note (optional)',
  'Tarih': 'Date', 'Saat': 'Time', '1 hafta sonra': 'In a week', 'Öncelik': 'Priority', 'Yok': 'None', 'Düşük': 'Low', 'Orta': 'Medium', 'Yüksek': 'High',
  'Not şablonları': 'Note templates', 'Alışveriş, valiz, toplantı, günlük… aç-kapat, düzenle, kendi şablonunu ekle': 'Shopping, packing, meeting, journal… toggle, edit, add your own', 'Şablondan': 'From template', 'Liste': 'List',
  'Hafta içi her gün': 'Every weekday', 'Görevleri takvime yaz': 'Write tasks to calendar', 'Yeni görevlerde varsayılan; görev eklerken ayrıca seçebilirsin': 'Default for new tasks; you can also choose per task',
  'Tarihi olan görev takviminde görünür; hatırlatma uygulama kapalıyken de telefonuna gelir': 'A task with a date shows in your calendar; reminders reach your phone even when the app is closed',
  'Google oturumunu kendiliğinden yenile': 'Renew Google session automatically', 'Oturum bitince uygulamaya ilk dokunuşta yenilenir; kısa bir Google penceresi açılıp kapanabilir': 'When the session expires it renews on your next tap; a Google window may briefly open and close',
  'Tekrarlı işler': 'Recurring', 'Yeni tekrarlı iş': 'New recurring task', 'Tekrarlı işi düzenle': 'Edit recurring task', 'Günün akışı (saat sırasıyla)': 'Day flow (by time)', 'Alt menü': 'Bottom menu', 'Sekmelerin sırası ve görünürlüğü. Okla taşı, anahtarla gizle.': 'Order and visibility of tabs. Move with arrows, hide with the switch.', 'araçlar ve oyunlar': 'tools & games',
  'Düzenli yaptığın işler: “Yaptım” deyince sonraki tarihe geçer; istersen yaptıktan sonra saymaya başlar, maliyet ve geçmiş tutar. Tek seferlik ya da yapılacak işler için Görevler’i kullan.': 'Things you do regularly: tap “Done” and it moves to the next date; it can count from when you did it, and keeps cost and history. Use Tasks for one-off to-dos.',
  'Her bölüm için normal ve ironik öneriler var; dokununca seçilir. İstersen kendin yaz. Boş bırakırsan yukarıdaki stile göre yazılır.': 'Each section has normal and ironic suggestions; tap to pick, or type your own. Leave empty to follow the style above.',
  'Tüm başlıkları varsayılana döndür': 'Reset all titles to default', 'Senin': 'Yours', 'Normal': 'Normal', 'İronik': 'Ironic', 'Tüm başlıklar varsayılana dönsün mü? (Kendi bölümlerinin adları değişmez)': 'Reset all titles to default? (Your own sections keep their names)', 'Başlıklar varsayılana döndü': 'Titles reset to default',
  'Bugün için bekleyen bir şey yok. Yukarıdaki kutudan ekleyebilirsin.': 'Nothing waiting for today. Add something with the box above.', 'Aç': 'Open',
  'Tekrar': 'Repeat', 'Tekrar yok': 'No repeat', 'Her gün': 'Every day', 'Hafta içi her gün': 'Every weekday', 'Her hafta': 'Every week', 'Her ay': 'Every month', 'Her yıl': 'Every year',
  'Etiketler': 'Tags', '+ yeni etiket': '+ new tag', 'Sil': 'Delete', 'Kaydet': 'Save', 'Kapat': 'Close', 'Tamamla': 'Complete', 'Ekle': 'Add', '+ Ekle': '+ Add',
  'Görev silindi': 'Task deleted', 'Görev tamamlandı': 'Task completed', 'Geri al': 'Undo', 'Etkinlik silindi': 'Event deleted', 'Hedef silindi': 'Goal deleted', 'Not silindi': 'Note deleted', 'Silindi': 'Deleted',
  '+ Etkinlik': '+ Event', 'Bu gün için kayıt yok.': 'Nothing on this day.', 'Tüm gün': 'All day', 'Yeni etkinlik': 'New event', 'Etkinliği düzenle': 'Edit event', 'Etkinlik adı': 'Event name',
  'Başlangıç': 'Start', 'Bitiş': 'End', 'Renk': 'Color', 'Not': 'Note', 'Yer, detay…': 'Place, details…', 'Önceki ay': 'Previous month', 'Sonraki ay': 'Next month',
  'Henüz alışkanlık yok. Her gün yapmak istediğin küçük bir şeyle başla: su içmek, 10 dakika okumak…': 'No habits yet. Start small: drink water, read for 10 minutes…',
  'Ölçülebilir bir hedef ekle: “12 kitap oku”, “5.000 ₺ biriktir”…': 'Add a measurable goal: “Read 12 books”, “Save 500 €”…',
  '✓ Tamam': '✓ Done', 'Azalt': 'Decrease', 'Artır': 'Increase', 'süre doldu': 'time’s up',
  'Yeni alışkanlık': 'New habit', 'Alışkanlığı düzenle': 'Edit habit', 'Örn. 2 litre su iç': 'e.g. Drink 2 liters of water', 'Hangi günler?': 'Which days?', 'Seri': 'Streak', 'En az bir gün seç': 'Pick at least one day',
  'Yeni hedef': 'New goal', 'Hedefi düzenle': 'Edit goal', 'Örn. 12 kitap oku': 'e.g. Read 12 books', 'Şu an': 'Current', 'Hedef': 'Target', 'Birim': 'Unit', 'kitap, km, ₺': 'books, km, €', '+/− adımı': '+/− step', 'Son tarih (isteğe bağlı)': 'Deadline (optional)', 'Hedefe ulaştın! 🎯': 'Goal reached! 🎯',
  'Notlarda ara': 'Search notes', 'Yeni not': 'New note', 'Kalem notu': 'Pen note', 'Eşleşen not yok.': 'No matching notes.', 'Henüz not yok. Yazarak ya da kalemle ilk notunu oluştur.': 'No notes yet. Type or draw your first one.',
  'Başlık': 'Title', 'Yazmaya başla…': 'Start writing…', 'Geri': 'Back', 'Sabitle': 'Pin', 'Başlıksız not': 'Untitled note', 'Başlıksız kalem notu': 'Untitled pen note', 'Bu not silinsin mi?': 'Delete this note?', 'Bu kalem notu silinsin mi?': 'Delete this pen note?',
  'Kaydet ve kapat': 'Save and close', 'Kalem': 'Pen', 'Fosforlu kalem': 'Highlighter', 'Silgi': 'Eraser', 'Kalınlık': 'Thickness', 'Yinele': 'Redo', 'Kâğıt türü': 'Paper type', 'Parmakla çizim': 'Finger drawing', 'Sayfa ekle': 'Add page',
  'Boş kâğıt': 'Blank paper', 'Çizgili kâğıt': 'Lined paper', 'Kareli kâğıt': 'Grid paper', 'Parmak çizer': 'Finger draws', 'Parmak sayfayı kaydırır, kalem çizer': 'Finger scrolls, pen draws',
  'Ekle ': 'Add', 'Görev': 'Task', 'Etkinlik': 'Event', 'Alışkanlık': 'Habit', 'Ayarlar’dan bir modül aç': 'Turn on a module in Settings',
  'Genel': 'General', 'Görünüm': 'Appearance', 'Başlıklar ve bölümler': 'Titles & sections', 'Bugün ekranı': 'Today screen', 'Modüller ve etiketler': 'Modules & tags', 'Senkron ve yedek': 'Sync & backup', 'Uygulama': 'App',
  'Adın': 'Your name', 'Bugün ekranında selamlamak için': 'Used to greet you on the Today screen',
  'Mod': 'Mode', 'Koyu': 'Dark', 'Sistem': 'System', 'Koyu temalar': 'Dark themes', 'Aydınlık temalar': 'Light themes', 'Aydınlık': 'Light', 'Bağlı': 'Connected', 'Vurgu rengi': 'Accent color', 'Alanlar': 'Areas', 'Sade': 'Plain', 'Çizgili': 'Outlined', 'Kutulu': 'Boxed',
  'Yazı tipi': 'Font', 'Yazı boyutu (punto)': 'Text size', 'Yazı boyutu': 'Text size', 'Satır aralığı': 'Line spacing', 'Sıkı': 'Compact', 'Normal': 'Normal', 'Rahat': 'Comfy', 'Alt menüde yazılar': 'Labels in bottom bar', 'Görünümü sıfırla': 'Reset appearance', 'Aç/kapat': 'On/off',
  'Temanın rengi': 'Theme color', 'Mono': 'Mono', 'Petrol': 'Petrol', 'Turkuaz': 'Teal', 'Mavi': 'Blue', 'Yeşil': 'Green', 'Turuncu': 'Orange', 'Mercan': 'Coral', 'Bordo': 'Burgundy', 'Mor': 'Purple',
  'Başlık stili': 'Title style', 'Klasik': 'Classic', 'İronik': 'Ironic', 'Başlıkları yeniden adlandır': 'Rename titles', 'Boş bırakırsan yukarıdaki stile göre yazılır.': 'Leave empty to use the style above.',
  'Kendi bölümlerin': 'Your sections', 'Yeni bölüm ekle': 'Add new section', 'Henüz yok. Liste, not defteri, sayaç ya da kayıt defteri olarak kendi bölümünü ekle.': 'None yet. Add your own list, notebook, counter or log.',
  'Bilgi sekmesinde': 'in Info tab', 'Planla sekmesinde': 'in Plan tab', 'Sekmeyi değiştir': 'Switch tab',
  'Yeni bölüm': 'New section', 'Bölümün adı (ör. Alışveriş)': 'Section name (e.g. Shopping)', 'Ne tür bir bölüm?': 'What kind of section?', 'Nerede dursun?': 'Where should it live?', 'Birim (isteğe bağlı)': 'Unit (optional)', '₺, kg, km…': '€, kg, km…', 'Bugün ekranında göster': 'Show on Today screen', 'Bölümü oluştur': 'Create section',
  'Liste': 'List', 'Not defteri': 'Notebook', 'Sayaç': 'Counter', 'Kayıt defteri': 'Log',
  'İşaretlenebilir maddeler: alışveriş, valiz, okunacaklar': 'Checkable items: shopping, packing, reading', 'Kısa yazılar: fikirler, alıntılar, hatırlatmalar': 'Short notes: ideas, quotes, reminders', 'Sayılar: kahve, su bardağı, spor turu': 'Counts: coffee, glasses of water, laps', 'Tarihli kayıt ve sayı: harcama, kilo, km': 'Dated entries with a number: spending, weight, km',
  'Yeni madde…': 'New item…', 'Liste boş. Yukarıdan madde ekle.': 'List is empty. Add an item above.', 'Liste boş.': 'List is empty.', 'Temizle': 'Clear', 'Yeni not yaz…': 'Write a new note…', 'Henüz bir şey yazılmadı.': 'Nothing written yet.',
  'Yeni sayaç adı…': 'New counter name…', 'Sayaç ekle: kahve, su, spor…': 'Add a counter: coffee, water, workouts…', 'Sayaç yok.': 'No counters.', 'Sayaç adı': 'Counter name', 'Değer': 'Value',
  'Ne oldu? (ör. Market)': 'What happened? (e.g. Groceries)', 'Sayı': 'Number', 'Bu ay': 'This month', 'Toplam': 'Total', 'Henüz kayıt yok.': 'No entries yet.', 'Yaz…': 'Write…',
  'Bugünün görevleri': 'Today’s tasks', 'Bugünkü etkinlikler': 'Today’s events', 'Yukarı': 'Up', 'Aşağı': 'Down', 'Alışkanlıklar & hedefler': 'Habits & goals',
  'Notlar ve kalem notları': 'Notes & pen notes', 'Yeni kalem notu kâğıdı': 'Paper for new pen notes', 'Boş': 'Blank', 'Kareli': 'Grid', 'Görev etiketleri': 'Task tags', 'Not etiketleri': 'Note tags',
  'Henüz etiket yok.': 'No tags yet.', 'Yeni etiket adı': 'New tag name', 'İsmi değiştirmek için üzerine yazman yeterli.': 'Type over a name to rename it.',
  'Senkron': 'Sync', 'Supabase (gelişmiş)': 'Supabase (advanced)', 'Yedek': 'Backup', 'Yedeği gönder / kaydet': 'Send / save backup', 'Otomatik yedekler': 'Automatic backups', 'Her gün kendiliğinden alınır, son 14 gün saklanır': 'Taken daily, last 14 days kept',
  'Yedeği dosya olarak indir': 'Download backup file', 'Yedekten içe aktar': 'Import from backup', 'Var olan verilerle birleştirilir': 'Merged with existing data', 'Bu cihazdaki tüm verileri sil': 'Delete all data on this device',
  'Güncellemeleri denetle': 'Check for updates', 'Yeni sürüm hazır — yüklemek için dokun': 'New version ready — tap to install', 'Verilerin silinmez': 'Your data stays', 'Veriler cihazında saklanır, internetsiz çalışır.': 'Data stays on your device and works offline.',
  'Yeni sürüm hazır': 'New version ready', 'Güncelle': 'Update', 'Yenile': 'Reload', 'Denetleniyor…': 'Checking…', 'Yeni sürüm indiriliyor…': 'Downloading new version…', 'Denetlenemedi, sonra tekrar dene': 'Couldn’t check, try later', 'İnternet yok, bağlanınca tekrar dene': 'No internet, try again when online',
  'Kapalı': 'Off', 'Kapalı — veriler sadece bu cihazda': 'Off — data only on this device', 'Eşitleniyor…': 'Syncing…', 'Çevrimdışı — internet gelince eşitlenecek': 'Offline — will sync when online', 'Eşitle': 'Sync', 'Eşitlemek için “Şimdi eşitle”ye dokun': 'Tap “Sync now” to sync',
  'Google Drive senkronu': 'Google Drive sync', 'Google Drive senkronu açık': 'Google Drive sync is on', 'Şimdi eşitle': 'Sync now', 'Bu cihazda kapat': 'Turn off on this device', 'Google ile bağlan': 'Connect with Google', 'Drive ile eşitlemek için dokun': 'Tap to sync with Drive',
  'Verilerin Google Drive’ında, sadece PUSULA’nın görebildiği gizli bir klasörde saklanıyor. Telefon ve tablette aynı Google hesabıyla bağlanınca veriler eşitlenir. İnternet yokken yaptıkların bağlantı gelince gönderilir. Google güvenlik gereği oturum bir saatte bir yenilenir; uygulamayı açtığında “Eşitle”ye dokunman yeterli.': 'Your data is stored in your Google Drive, in a hidden folder only PUSULA can see. Connect with the same Google account on phone and tablet to sync. Changes made offline are sent when you’re back online. For security Google renews the session every hour; just tap “Sync” when you open the app.',
  'Google girişi hazırlanıyor, birkaç saniye sonra tekrar dokun': 'Google sign-in is loading, tap again in a few seconds', 'Google penceresi açılıyor…': 'Opening Google window…', 'Bağlandı, eşitleniyor…': 'Connected, syncing…', 'Google oturumunun süresi doldu': 'Google session expired', 'Google penceresi kapatıldı': 'Google window was closed', 'Google penceresi açılamadı': 'Couldn’t open Google window', 'Google girişi başarısız': 'Google sign-in failed', 'Bağlanmak için internet gerekli.': 'Internet is required to connect.',
  'Otomatik yedekler ': 'Automatic backups', 'Geri yükle': 'Restore', 'Geri yüklemeden önce': 'Before restore', 'Yedek geri yüklendi': 'Backup restored', 'Yedek bulunamadı': 'Backup not found', 'Henüz otomatik yedek yok. Uygulamayı kullandıkça günlük alınır.': 'No automatic backups yet. One is taken each day you use the app.',
  'PUSULA her gün açıldığında verilerinin bir kopyasını bu cihazda saklar. Yanlışlıkla bir şey silersen buradan geri dönebilirsin. Telefon kaybolursa diye ayrıca “Yedeği gönder” ile Drive’a da kaydet.': 'Each day PUSULA keeps a copy of your data on this device. If you delete something by mistake, restore it here. In case you lose your phone, also use “Send backup” to save it to Drive.',
  'Yedek indirildi': 'Backup downloaded', 'Yedek gönderildi': 'Backup sent', 'Paylaşım desteklenmiyor, yedek indirildi': 'Sharing not supported, backup downloaded', 'Verilerini bir kez yedekle': 'Back up your data once', 'Son yedeğin 1 haftadan eski': 'Your last backup is over a week old', 'Yedekle': 'Back up',
  'Henüz dışarı yedek alınmadı · Drive, WhatsApp veya e-postaya gönder': 'No external backup yet · send to Drive, WhatsApp or email',
  'Bir hata oluştu': 'Something went wrong', 'Kaydedilemedi: depolama hatası': 'Couldn’t save: storage error', 'Cihaz depolaması açılamadı': 'Couldn’t open device storage', 'Adres kopyalandı': 'Address copied', 'Kod kopyalandı': 'Code copied', 'Kopyalanamadı, kutudan seçip kopyala': 'Couldn’t copy, select it from the box',
  'İnternet yok, bağlantı gelince eşitlenecek': 'No internet, will sync when online', 'Senkron açıldı': 'Sync turned on', 'Bu bir PUSULA yedeği değil': 'This is not a PUSULA backup',
  'Görünüm varsayılana dönsün mü? (Verilerin etkilenmez)': 'Reset appearance to default? (Your data is not affected)',
  'Bu cihazda Google Drive senkronu kapatılsın mı? Veriler cihazda ve Drive’da kalır.': 'Turn off Google Drive sync on this device? Data stays on the device and in Drive.',
  'Bu cihazda senkron kapatılsın mı? Veriler cihazda kalır.': 'Turn off sync on this device? Data stays on the device.',
  'Bu cihazdaki TÜM PUSULA verileri silinecek. Emin misin?': 'ALL PUSULA data on this device will be deleted. Are you sure?',
  'Son kez soruyorum: geri alınamaz. Önce yedek aldın mı? Silmek için Tamam.': 'Last chance: this can’t be undone. Did you back up first? Press OK to delete.',
  'Veriler bu yedekteki hâline dönecek. Şu anki hâlin de ayrıca yedeklenecek. Devam edilsin mi?': 'Your data will return to this backup. The current state will be backed up too. Continue?',
  'Senkron (cihazlar arası)': 'Sync (across devices)', 'Bu cihazda senkronu kapat': 'Turn off sync on this device', 'Hesap oluştur': 'Create account', 'Giriş yap': 'Sign in', 'Kurulum kodunu kopyala': 'Copy setup code', 'E-posta': 'Email', 'Şifre (en az 6 karakter)': 'Password (at least 6 characters)',
  'Rutinler': 'Routines', 'Rutin': 'Routine', '+ Rutin': '+ Routine', 'Yeni rutin': 'New routine', 'Rutini düzenle': 'Edit routine', 'Örn. Araç bakımı': 'e.g. Car service', 'Yaklaşan rutinler': 'Upcoming routines', 'Yaptım': 'Done it',
  'Ne sıklıkla?': 'How often?', 'Her': 'Every', 'Gün': 'Day', 'Hafta': 'Week', 'Ay': 'Month', 'Yıl': 'Year', 'Belirli günler (isteğe bağlı)': 'Specific days (optional)', 'Ayın hangi günü?': 'Which day of the month?', 'Aynı gün': 'Same day', 'Son gün': 'Last day',
  'Nasıl sayılsın?': 'How to count?', 'Takvime göre': 'By calendar', 'Yaptıktan sonra': 'After done',
  'Takvime göre: tarih sabittir (ör. her ayın 5’i). Yaptıktan sonra: sayaç yaptığın gün yeniden başlar (ör. filtre değişiminden 3 ay sonra).': 'By calendar: the date is fixed (e.g. the 5th of every month). After done: the countdown restarts the day you do it (e.g. 3 months after changing the filter).',
  'Sonraki tarih': 'Next date', 'Son yapılma': 'Last done', 'Ne zamana kadar? (boş = süresiz)': 'Until when? (empty = no end)', 'En son ne zaman yaptın? (isteğe bağlı)': 'When did you last do it? (optional)', 'Tekrarlarıyla birlikte takviminde görünür; saat ve hatırlatma da yazılır': 'Shows in your calendar with all repeats, including time and reminders', 'Maliyet (isteğe bağlı)': 'Cost (optional)', 'Servis, parça, detay…': 'Service, parts, details…', 'Geçmiş': 'History',
  'Google Takvim’e yaz': 'Write to Google Calendar', 'Sonraki tarih takviminde tüm gün etkinlik olarak görünür': 'The next date shows as an all-day event in your calendar',
  'Tekrarlı işlerini buraya ekle: araç bakımı her 6 ayda, klima filtresi her 3 ayda, sigorta yenileme her yıl, bitki sulama 4 günde bir… “Yaptım” dediğinde sonraki tarih kendiliğinden hesaplanır.': 'Add your recurring chores here: car service every 6 months, AC filter every 3 months, insurance renewal every year, watering plants every 4 days… When you tap “Done it”, the next date is calculated automatically.',
  'Google Takvim': 'Google Calendar', 'Google Takvim bağlı': 'Google Calendar connected', 'Gösterilecek takvimler': 'Calendars to show', 'Takvim listesi için “Şimdi eşitle”ye dokun.': 'Tap “Sync now” to load your calendars.',
  'Yeni etkinlikler şu takvime': 'New events go to', 'Rutin tarihlerini takvime yaz': 'Write routine dates to calendar', 'Rutin eklerken ayrıca seçebilirsin': 'You can also choose per routine', 'Bu cihazda bağlantıyı kes': 'Disconnect on this device',
  'Google Takvim etkinliklerin PUSULA takviminde ve Bugün ekranında görünür. PUSULA’dan eklediğin etkinlikler Google Takvim’e yazılır.': 'Your Google Calendar events appear in the PUSULA calendar and on the Today screen. Events you add in PUSULA are written to Google Calendar.',
  'Rutinlerin tarihlerini de takvime yazabilirim; böylece telefonuna Google Takvim bildirimi gelir.': 'Routine dates can be written to your calendar too, so Google Calendar notifies your phone.',
  'Google Takvim’i bağla': 'Connect Google Calendar', 'Hata alırsan: Google Cloud’da PUSULA projesinde': 'If you get an error: in the PUSULA project on Google Cloud, make sure', '’nin açık (Enable) olduğundan emin ol.': 'is enabled.',
  'Takvim izni verilmedi.': 'Calendar permission was not granted.', 'Bağlandı, takvimler alınıyor…': 'Connected, loading calendars…', 'Google Takvim bağlandı': 'Google Calendar connected', 'takvim': 'calendars',
  'Nereye eklensin?': 'Add to', 'Sadece PUSULA': 'PUSULA only', 'Takvim': 'Calendar', 'Google Takvim için internet gerekli': 'Google Calendar needs internet', 'Google Takvim’de güncellendi': 'Updated in Google Calendar', 'Google Takvim’e eklendi': 'Added to Google Calendar',
  'Bu etkinlik Google Takvim’den silinsin mi?': 'Delete this event from Google Calendar?', 'Google Takvim’den silindi': 'Deleted from Google Calendar', 'Google Takvim’i yenile': 'Refresh Google Calendar',
  'Bu cihazda Google Takvim bağlantısı kesilsin mi? Google Takvim’deki etkinliklerin silinmez.': 'Disconnect Google Calendar on this device? Your Google Calendar events are not deleted.',
  'Google ile eşitlemek için dokun': 'Tap to sync with Google', 'Google izni eksik, tekrar bağlan': 'Google permission missing, reconnect', 'Google Cloud’da bu API kapalı. console.cloud.google.com → PUSULA → APIs & Services → Library’den açman gerekiyor.': 'This API is disabled in Google Cloud. Enable it at console.cloud.google.com → PUSULA → APIs & Services → Library.',
  '(başlıksız)': '(untitled)', 'Varsayılan': 'Default',
  'Tema': 'Theme', 'Her tema hem koyu hem aydınlık modda çalışır.': 'Every theme works in both dark and light mode.',
  'Uyarılar': 'Alerts', 'Uyarı ayarları': 'Alert settings', 'Göster': 'Show', 'Bugün gizle': 'Hide for today', 'Her şey yolunda. Şu an uyarı yok.': 'All good. No alerts right now.',
  'Sağ üstteki zilde ve Bugün ekranının üstündeki şeritte görünür. Bir uyarıyı gizlersen o gün bir daha gösterilmez.': 'Shown in the bell at the top right and in the strip on the Today screen. A hidden alert won’t show again that day.',
  'Bugün ekranında uyarı şeridi': 'Alert strip on Today screen', 'Geciken görevler': 'Overdue tasks', 'Geciken ve yaklaşan rutinler': 'Late and upcoming routines', 'Önümüzdeki 3 saatteki etkinlikler': 'Events in the next 3 hours',
  'Akşam alışkanlık hatırlatması (20:00 sonrası)': 'Evening habit reminder (after 8 pm)', 'Son tarihi yaklaşan hedefler': 'Goals with a near deadline', 'Yedek hatırlatması': 'Backup reminder', 'Google eşitleme': 'Google sync', 'Yeni sürüm': 'New version',
  'Her bölüm için normal ve ironik öneriler var; dokununca seçilir. İstersen kendin yaz. Boş bırakırsan yukarıdaki stile göre yazılır.': 'Each section has normal and ironic suggestions; tap to pick, or type your own. Leave empty to follow the style above.',
  'Tüm başlıkları varsayılana döndür': 'Reset all titles to default', 'Senin': 'Yours', 'Normal': 'Normal', 'İronik': 'Ironic', 'Tüm başlıklar varsayılana dönsün mü? (Kendi bölümlerinin adları değişmez)': 'Reset all titles to default? (Your own sections keep their names)', 'Başlıklar varsayılana döndü': 'Titles reset to default',
  'Bugün için bekleyen bir şey yok. Yukarıdaki kutudan ekleyebilirsin.': 'Nothing waiting for today. Add something with the box above.', 'Aç': 'Open',
  'Tekrar': 'Repeat', 'Tekrarlanmaz': 'Does not repeat', 'Her gün': 'Every day', 'Her hafta': 'Every week', 'Her ay': 'Every month', 'Her yıl': 'Every year', 'Özel…': 'Custom…',
  'Ne zamana kadar? (boş bırakırsan süresiz)': 'Until when? (leave empty for no end)', 'Sadece bu gün': 'Only this day', 'Tümünü sil': 'Delete all', '+ Tekrarlı iş': '+ Recurring task',
  'Google’da tekrarlanan etkinlik; burada sadece bu gün değişir. Tekrarı Google Takvim’den düzenleyebilirsin.': 'Recurring event in Google; only this day changes here. Edit the series in Google Calendar.'
};
const EN_RX = [
  [/^\+(\d+) görev daha$/, '+$1 more tasks'],
  [/^Bugün için görev yok\. Tarihsiz (\d+) görevin var\.$/, 'No tasks for today. You have $1 undated tasks.'],
  [/^(Günaydın|İyi günler|İyi akşamlar|İyi geceler), (.+)$/, (m, g, n) => EN[g] + ', ' + n],
  [/^(Bugün|Yarın|Dün) · (.+)$/, (m, d, r) => EN[d] + ' · ' + r],
  [/^(\d+) gün kaldı$/, '$1 days left'],
  [/^Tamamlandı · sonraki: (.+)$/, (m, d) => 'Done · next: ' + (EN[d] || d)],
  [/^Güncel · (.+)$/, 'Up to date · $1'],
  [/^Bağlı · son eşitleme (.+)$/, 'Connected · last synced $1'],
  [/^Şu anki sürüm (.+)$/, 'Current version $1'],
  [/^En güncel sürümü kullanıyorsun \((.+)\)$/, 'You’re on the latest version ($1)'],
  [/^(\d+) kayıt$/, '$1 entries'],
  [/^(\d+) kayıt içe aktarıldı$/, '$1 entries imported'],
  [/^(\d+) madde temizlendi$/, '$1 items cleared'],
  [/^(\d+) gün · toplam (\d+) kez yapıldı$/, '$1 days · done $2 times in total'],
  [/^Son yedek: (bugün|dün|(\d+) gün önce) · Drive, WhatsApp veya e-postaya gönder$/, (m, w, n) => 'Last backup: ' + (w === 'bugün' ? 'today' : w === 'dün' ? 'yesterday' : n + ' days ago') + ' · send to Drive, WhatsApp or email'],
  [/^“(.+)” bölümü oluşturuldu$/, '“$1” section created'],
  [/^“(.+)” bölümü ve içindeki her şey silinsin mi\?$/, 'Delete the “$1” section and everything in it?'],
  [/^“(.+)” ve tüm geçmişi silinsin mi\?$/, 'Delete “$1” and its whole history?'],
  [/^“(.+)” etiketi silinsin mi\? \(Notlar ve görevler silinmez\)$/, 'Delete the tag “$1”? (Notes and tasks are kept)'],
  [/^İçe aktarılamadı: (.+)$/, 'Import failed: $1'],
  [/^Bağlandı, eşitleme hatası: (.+)$/, 'Connected, sync error: $1'],
  [/^Hata: (.+)$/, 'Error: $1'],
  [/^(\d+) gün gecikti$/, '$1 days late'],
  [/^(\d+) gün$/, '$1 days'],
  [/^· son: (.+)$/, (m, d) => '· last: ' + (EN[d] || d)],
  [/^Yapıldı · sonraki: (.+)$/, (m, d) => 'Done · next: ' + (EN[d] || d)],
  [/^“(.+)” rutini silinsin mi\?$/, 'Delete the routine “$1”?']
];
function tr(s) {
  if (!s || !isEn()) return s;
  const t = s.trim(); if (!t) return s;
  let out = EN[t];
  if (out == null) for (const [rx, rp] of EN_RX) { if (rx.test(t)) { out = t.replace(rx, rp); break; } }
  return out == null ? s : s.replace(t, out);
}
const SKIP_SEL = '.u,.row-title,.tag,script,style,textarea,#pageTitle';
function translateTree(root) {
  if (!root || !isEn()) return;
  if (root.nodeType === 3) { const p = root.parentElement; if (p && !p.closest(SKIP_SEL)) { const v = tr(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; } return; }
  if (root.nodeType !== 1) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() && n.parentElement && !n.parentElement.closest(SKIP_SEL)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
  const els = root.matches && root.matches('[placeholder],[aria-label],[title]') ? [root] : [];
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => els.push(el));
  els.forEach(el => { if (el.closest('.u')) return; ['placeholder', 'aria-label', 'title'].forEach(a => { const v = el.getAttribute(a); if (v) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } }); });
}
const ask = msg => confirm(tr(msg));
function startTranslator() {
  new MutationObserver(muts => { if (!isEn()) return; muts.forEach(m => m.addedNodes.forEach(n => translateTree(n))); }).observe(document.body, { childList: true, subtree: true });
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
  return '<div class="seg" data-name="' + name + '">' + options.map(o => '<button type="button" class="' + (String(o[0]) === String(val) ? 'on' : '') + '" data-act="seg-pick" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>').join('') + '</div>';
}
const segVal = (name) => { const b = $('#sheetRoot .seg[data-name="' + name + '"] button.on'); return b ? b.dataset.v : null; };
const fval = name => { const el = $('#sheetRoot [name="' + name + '"]'); return el ? el.value : ''; };

/* ===================== Ana çizim ===================== */
const TABS = [
  { k: 'today', icon: 'today' },
  { k: 'plan', icon: 'plan' },
  { k: 'money', icon: 'wallet' },
  { k: 'info', icon: 'info' },
  { k: 'mail', icon: 'mail' },
  { k: 'tools', icon: 'tools' }
];
function planSubs() {
  return settings().plan.filter(m => m.on).map(m => ({ k: m.k, label: TL(m.k) }))
    .concat(customMods().filter(m => m.home === 'plan').map(m => ({ k: 'c:' + m.id, label: m.name })));
}
function infoSubs() {
  const a = settings().notes ? [{ k: 'notes', label: TL('notes') }] : [];
  return a.concat(customMods().filter(m => m.home === 'info').map(m => ({ k: 'c:' + m.id, label: m.name })));
}
function visibleTabs() {
  const st = settings(); const ord = (st.tabs || []).map(x => x.k); const on = k => { const x = (st.tabs || []).find(y => y.k === k); return !x || x.on !== false; };
  const v = TABS.filter(t => on(t.k) && (t.k !== 'plan' || planSubs().length) && (t.k !== 'info' || infoSubs().length)).sort((a, b) => ord.indexOf(a.k) - ord.indexOf(b.k));
  return v.length ? v : TABS.filter(t => t.k === 'today');
}
const TAB_KEYS = ['today', 'plan', 'info', 'tools', 'settings'];
const subTitle = k => k && k.startsWith('c:') ? ((cmod(k.slice(2)) || {}).name || '') : T(k);
function render() {
  applyTheme();
  const tabs = visibleTabs();
  if (S.tab !== 'settings' && !tabs.find(t => t.k === S.tab)) S.tab = tabs[0].k;
  $('#tabbar').innerHTML = tabs.map(t => '<button class="tab ' + (S.tab === t.k ? 'on' : '') + '" data-act="tab" data-k="' + t.k + '">' + icon(t.icon) + '<span class="u">' + esc(TL(t.k)) + '</span></button>').join('');
  let title = '', actions = '', body = '';
  if (S.tab === 'today') { title = T('today'); body = viewToday(); }
  else if (S.tab === 'plan') { body = viewPlan(); title = subTitle(S.planSub); if (S.planSub === 'calendar') actions = '<button class="link" data-act="cal-today">Bugün</button>'; }
  else if (S.tab === 'info') { body = viewInfo(); title = subTitle(S.infoSub); }
  else if (S.tab === 'money') { title = T('money'); body = typeof viewMoney === 'function' ? viewMoney() : ''; }
  else if (S.tab === 'mail') { title = T('mail'); body = typeof viewMail === 'function' ? viewMail() : ''; }
  else if (S.tab === 'tools') { title = T('tools'); body = typeof viewTools === 'function' ? viewTools() : ''; }
  else { title = T('settings'); body = viewSettings(); }
  if ((Drive.on() || Cal.on()) && S.tab !== 'settings') actions += '<button id="syncBtn" class="icon-btn ' + (Drive.status === 'syncing' ? 'spin ' : '') + (Drive.status === 'needauth' || Drive.status === 'error' ? 'warn' : '') + '" data-act="sync-now" aria-label="Eşitle">' + icon('sync') + '</button>';
  if (S.tab !== 'settings' && typeof searchTopButton === 'function') actions += searchTopButton();
  if (S.tab !== 'settings' && typeof dnTopButton === 'function') actions += dnTopButton();
  if (S.tab !== 'settings') { const n = computeAlerts().length; actions += '<button class="icon-btn bell ' + (n ? 'has' : '') + '" data-act="alerts" aria-label="Uyarılar">' + icon('bell') + (n ? '<b class="badge">' + (n > 9 ? '9+' : n) + '</b>' : '') + '</button>'; }
  actions += S.tab === 'settings'
    ? '<button class="icon-btn" data-act="close-settings" aria-label="Kapat">' + icon('x') + '</button>'
    : '<button class="icon-btn" data-act="open-settings" aria-label="Ayarlar">' + icon('settings') + '</button>';
  $('#pageTitle').textContent = title;
  $('#topActions').innerHTML = actions;
  $('#view').innerHTML = body;
  $('#fab').hidden = S.tab === 'settings' || S.tab === 'tools' || S.tab === 'mail';
  translateTree(document.body);
}

/* ----- Uygulama içi uyarılar ----- */
const ALERT_TYPES = { overdue: 'Geciken görevler', todayTasks: 'Bugünün görevleri', routines: 'Geciken ve yaklaşan rutinler', events: 'Önümüzdeki 3 saatteki etkinlikler', habits: 'Akşam alışkanlık hatırlatması (20:00 sonrası)', goals: 'Son tarihi yaklaşan hedefler', backup: 'Yedek hatırlatması', sync: 'Google eşitleme', money: 'Günü gelen düzenli ödemeler', update: 'Yeni sürüm' };
const Lx = (tr, en) => isEn() ? en : tr;
function alertDismissed() { try { const d = JSON.parse(lsGet('pusula.dis', '{}')); return d.day === today() ? (d.ids || []) : []; } catch (e) { return []; } }
function alertDismiss(id) { const ids = alertDismissed(); ids.push(id); lsSet('pusula.dis', JSON.stringify({ day: today(), ids })); }
function computeAlerts() {
  const st = settings(); const on = k => (st.alerts || {})[k] !== false; const t0 = today(); const out = [];
  if (on('overdue') && planOn('tasks')) { const n = list('task').filter(t => !t.done && t.due && t.due < t0).length; if (n) out.push({ id: 'overdue' + n, lvl: 'danger', icon: 'task', text: Lx(n + ' görev gecikti', n + ' overdue tasks'), go: 'tasks' }); }
  if (on('todayTasks') && planOn('tasks')) { const n = list('task').filter(t => !t.done && t.due === t0).length; if (n) out.push({ id: 'today' + n, lvl: 'info', icon: 'task', text: Lx('Bugün ' + n + ' görevin var', n + ' tasks due today'), go: 'tasks' }); }
  if (on('routines') && planOn('routines')) {
    list('routine').forEach(r => {
      if (!r.next) return; const d = daysBetween(t0, r.next);
      if (d < 0) out.push({ id: 'rt' + r.id + r.next, lvl: 'danger', icon: 'repeat', text: Lx('“' + r.title + '” ' + (-d) + ' gün gecikti', '“' + r.title + '” is ' + (-d) + ' days late'), go: 'routines' });
      else if (d <= 1) out.push({ id: 'rt' + r.id + r.next, lvl: 'warn', icon: 'repeat', text: Lx('“' + r.title + '” ' + (d === 0 ? 'bugün' : 'yarın'), '“' + r.title + '” ' + (d === 0 ? 'today' : 'tomorrow')), go: 'routines' });
    });
  }
  if (on('events')) {
    const now = new Date(), hm = pad(now.getHours()) + ':' + pad(now.getMinutes()); const lim = new Date(now.getTime() + 3 * 3600000);
    const hmL = lim.getDate() !== now.getDate() ? '23:59' : pad(lim.getHours()) + ':' + pad(lim.getMinutes());
    const evs = eventsOn(t0).filter(e => !e.allDay && e.start).concat(Cal.on() ? Cal.forDate(t0).filter(e => !e.allDay && e.start) : []);
    evs.filter(e => e.start >= hm && e.start <= hmL).forEach(e => out.push({ id: 'ev' + (e.id || e.gid), lvl: 'warn', icon: 'event', text: e.start + ' · ' + e.title, go: 'calendar' }));
  }
  if (on('habits') && planOn('habits') && new Date().getHours() >= 20) { const n = list('habit').filter(h => habitScheduled(h, t0) && !(h.log || {})[t0]).length; if (n) out.push({ id: 'hb' + t0, lvl: 'info', icon: 'habit', text: Lx(n + ' alışkanlık bugün henüz yapılmadı', n + ' habits not done yet today'), go: 'habits' }); }
  if (on('goals') && planOn('habits')) list('goal').forEach(g => { if (g.deadline && goalPct(g) < 100) { const d = daysBetween(t0, g.deadline); if (d >= 0 && d <= 7) out.push({ id: 'gl' + g.id, lvl: 'warn', icon: 'goal', text: Lx('“' + g.title + '” için ' + d + ' gün kaldı', d + ' days left for “' + g.title + '”'), go: 'habits' }); } });
  if (on('backup') && !Drive.on()) { const last = +lsGet('pusula.lastExport', '0'); if (!last || Date.now() - last > 7 * 86400000) out.push({ id: 'backup', lvl: 'warn', icon: 'download', text: Lx(last ? 'Son dış yedek 1 haftadan eski' : 'Verilerinin henüz dış yedeği yok', last ? 'Last external backup is over a week old' : 'No external backup of your data yet'), act: 'share-backup', btn: Lx('Yedekle', 'Back up') }); }
  if (on('sync') && (Drive.on() || Cal.on()) && (gNeedsToken() || Drive.status === 'error' || Cal.status === 'error')) out.push({ id: 'sync', lvl: 'warn', icon: 'sync', text: Lx('Google eşitlemesi bekliyor', 'Google sync is waiting'), act: 'sync-now', btn: Lx('Eşitle', 'Sync') });
  if (typeof Mail !== 'undefined' && Mail.on() && gopt('bell') && Mail.important) out.push({ id: 'gm' + Mail.important, lvl: 'info', icon: 'mail', text: Lx(Mail.important + ' okunmamış önemli mail', Mail.important + ' unread important emails'), go: 'mail' });
  if (on('money') && typeof moneyAlerts === 'function') moneyAlerts().forEach(a => out.push(a));
  if (on('update') && S.waitingSW) out.push({ id: 'update', lvl: 'info', icon: 'download', text: Lx('Yeni sürüm hazır', 'New version ready'), act: 'check-update', btn: Lx('Güncelle', 'Update') });
  const dis = alertDismissed(); const rank = { danger: 0, warn: 1, info: 2 };
  return out.filter(a => !dis.includes(a.id)).sort((a, b) => rank[a.lvl] - rank[b.lvl]);
}
function alertBanner() {
  const st = settings(); if ((st.alerts || {}).banner === false || lsGet('pusula.bannerDay', '') === today()) return '';
  const al = computeAlerts().filter(a => a.lvl !== 'info'); if (!al.length) return '';
  return '<div class="alert-banner ' + (al.some(a => a.lvl === 'danger') ? 'danger' : 'warn') + '"><button class="ab-main" data-act="alerts">' + icon('bell') + (al.length > 1 ? '<b class="ab-n">' + al.length + '</b>' : '') + '<span class="u">' + esc(al[0].text) + '</span>' + (al.length > 1 ? '<span class="ab-more">' + Lx('+' + (al.length - 1) + ' uyarı', '+' + (al.length - 1) + ' more') + '</span>' : '') + '</button><button class="icon-btn" data-act="banner-hide" aria-label="Bugün gizle">' + icon('x', 'sm') + '</button></div>';
}
function openAlerts() {
  const al = computeAlerts();
  openSheet(sheetHead('Uyarılar') + '<div class="sheet-body">' + (al.length ? '<div class="alert-list">' + al.map(a => '<div class="alert-item ' + a.lvl + '">' + icon(a.icon) + '<div class="grow u">' + esc(a.text) + '</div>' + (a.act ? '<button class="btn sm-btn" data-act="' + a.act + '">' + esc(a.btn) + '</button>' : '<button class="btn sm-btn" data-act="alert-go" data-k="' + a.go + '">Göster</button>') + '<button class="icon-btn" data-act="alert-dismiss" data-id="' + esc(a.id) + '" aria-label="Bugün gizle">' + icon('x', 'sm') + '</button></div>').join('') + '</div>' : '<div class="empty">Her şey yolunda. Şu an uyarı yok.</div>') +
    '<button class="link" data-act="alert-settings">Uyarı ayarları</button></div>', { onClose: () => setTimeout(render, 0) });
}

/* ----- Planla / Bilgi sekmeleri ----- */
function subSeg(subs, cur, act) {
  return subs.length > 1 ? '<div class="seg plan-seg">' + subs.map(x => '<button class="u ' + (x.k === cur ? 'on' : '') + '" data-act="' + act + '" data-k="' + x.k + '">' + esc(x.label) + '</button>').join('') + '</div>' : '';
}
function viewPlan() {
  const subs = planSubs();
  if (!subs.find(x => x.k === S.planSub)) S.planSub = subs[0].k;
  const k = S.planSub;
  return subSeg(subs, k, 'plan-sub') + (k === 'tasks' ? viewTasks() : k === 'calendar' ? viewCalendar() : k === 'routines' ? viewRoutines() : k === 'habits' ? viewHabits() : viewCustom(k.slice(2)));
}
function viewInfo() {
  const subs = infoSubs();
  if (!subs.find(x => x.k === S.infoSub)) S.infoSub = subs[0].k;
  return subSeg(subs, S.infoSub, 'info-sub') + (S.infoSub === 'notes' ? viewNotes() : viewCustom(S.infoSub.slice(2)));
}

/* ----- Kendi bölümlerin ----- */
function viewCustom(id) {
  const m = cmod(id); if (!m) return '';
  const items = list('citem').filter(i => i.mod === id);
  const add = (ph, extra) => '<form class="quick-add" data-form="citem" data-mod="' + id + '"><input class="input" name="q" placeholder="' + ph + '" autocomplete="off" enterkeyhint="done">' + (extra || '') + '<button class="icon-btn" type="submit" aria-label="Ekle">' + icon('plus') + '</button></form>';
  const box = (arr, empty) => '<div class="card">' + (arr.length ? arr.map(citemRow).join('') : '<div class="empty">' + empty + '</div>') + '</div>';
  if (m.type === 'list') {
    const open = items.filter(i => !i.done).sort((a, b) => (a.created || 0) - (b.created || 0));
    const done = items.filter(i => i.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    return add('Yeni madde…') + box(open, 'Liste boş. Yukarıdan madde ekle.') +
      (done.length ? '<div class="section-title"><span>Tamamlanan<span class="count">' + done.length + '</span></span><button class="link" data-act="citem-clear" data-mod="' + id + '">Temizle</button></div>' + box(done, '') : '');
  }
  if (m.type === 'notes') return add('Yeni not yaz…') + box(items.sort((a, b) => (b.created || 0) - (a.created || 0)), 'Henüz bir şey yazılmadı.');
  if (m.type === 'counter') return add('Yeni sayaç adı…') + box(items.sort((a, b) => (a.created || 0) - (b.created || 0)), 'Sayaç ekle: kahve, su, spor…');
  if (m.type === 'log') {
    const arr = items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));
    const mon = today().slice(0, 7); const u = esc(m.unit || '');
    const sumM = arr.filter(i => (i.date || '').startsWith(mon)).reduce((t, i) => t + (Number(i.amount) || 0), 0);
    const sumA = arr.reduce((t, i) => t + (Number(i.amount) || 0), 0);
    return add('Ne oldu? (ör. Market)', '<input class="input num" name="n" type="number" inputmode="decimal" step="any" placeholder="' + (u || 'Sayı') + '">') +
      '<div class="hero-sum log-sum"><span class="pill"><span>Bu ay</span> <b>' + fmtNum(sumM) + '</b> ' + u + '</span><span class="pill"><span>Toplam</span> <b>' + fmtNum(sumA) + '</b> ' + u + '</span></div>' +
      box(arr, 'Henüz kayıt yok.');
  }
  return '';
}
function citemRow(i) {
  const m = cmod(i.mod) || {};
  if (m.type === 'list') return '<div class="row ' + (i.done ? 'done' : '') + '" data-act="citem-edit" data-id="' + i.id + '"><button class="check ' + (i.done ? 'on' : '') + '" data-act="citem-toggle" data-id="' + i.id + '" aria-label="Tamamla">' + icon('check') + '</button><div class="row-main"><div class="row-title">' + esc(i.text) + '</div></div></div>';
  if (m.type === 'notes') return '<div class="row" data-act="citem-edit" data-id="' + i.id + '"><div class="row-main"><div class="row-title" style="white-space:pre-wrap">' + esc(i.text) + '</div><div class="row-meta">' + relDay(ymd(new Date(i.created || Date.now()))) + '</div></div></div>';
  if (m.type === 'counter') return '<div class="row"><div class="row-main" data-act="citem-edit" data-id="' + i.id + '"><div class="row-title">' + esc(i.text) + '</div>' + (i.at ? '<div class="row-meta">' + relDay(ymd(new Date(i.at))) + '</div>' : '') + '</div><div class="goal-ctrl"><button class="mini-btn" data-act="citem-step" data-id="' + i.id + '" data-dir="-1" aria-label="Azalt">−</button><b class="cnt-val">' + fmtNum(i.value || 0) + '</b><button class="mini-btn" data-act="citem-step" data-id="' + i.id + '" data-dir="1" aria-label="Artır">+</button></div></div>';
  if (m.type === 'log') return '<div class="row" data-act="citem-edit" data-id="' + i.id + '"><div class="ev-time">' + (i.date ? fmtShort(i.date) : '') + '</div><div class="row-main"><div class="row-title">' + esc(i.text || '—') + '</div></div><b class="log-amt">' + (i.amount != null && i.amount !== '' ? fmtNum(i.amount) + ' ' + esc(m.unit || '') : '') + '</b></div>';
  return '';
}
function cardCustom(id) {
  const m = cmod(id); if (!m) return '';
  const items = list('citem').filter(i => i.mod === id); let body = '';
  if (m.type === 'list') { const open = items.filter(i => !i.done).sort((a, b) => (a.created || 0) - (b.created || 0)); body = open.length ? open.slice(0, 6).map(citemRow).join('') + (open.length > 6 ? '<div class="more">+' + (open.length - 6) + '</div>' : '') : '<div class="empty">Liste boş.</div>'; }
  else if (m.type === 'counter') body = items.length ? items.sort((a, b) => (a.created || 0) - (b.created || 0)).map(citemRow).join('') : '<div class="empty">Sayaç yok.</div>';
  else if (m.type === 'log') {
    const mon = today().slice(0, 7); const sm = items.filter(i => (i.date || '').startsWith(mon)).reduce((t, i) => t + (Number(i.amount) || 0), 0);
    body = '<div class="row-meta" style="padding:10px 0 2px"><span>Bu ay</span> <b>' + fmtNum(sm) + ' ' + esc(m.unit || '') + '</b></div>' + items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0)).slice(0, 3).map(citemRow).join('');
  } else { const last = items.sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, 3); body = last.length ? last.map(citemRow).join('') : '<div class="empty">Henüz bir şey yazılmadı.</div>'; }
  return card(CTYPES[m.type][2], m.name, body, 'c:' + id);
}
function editCItem(it, modId) {
  const isNew = !it; const m = cmod(isNew ? modId : it.mod); if (!m) return;
  const d = it ? clone(it) : { id: uid(), type: 'citem', mod: m.id, text: '', done: false, value: 0, date: today(), amount: null };
  S.draft = d;
  let f = m.type === 'notes'
    ? '<textarea class="input" name="text" rows="6" placeholder="Yaz…">' + esc(d.text) + '</textarea>'
    : '<input class="input big" name="title" placeholder="' + (m.type === 'counter' ? 'Sayaç adı' : 'Başlık') + '" value="' + esc(d.text) + '" autocomplete="off" enterkeyhint="done">';
  if (m.type === 'counter') f += '<label class="field"><span>Değer</span><input type="number" inputmode="decimal" step="any" class="input" name="value" value="' + (d.value || 0) + '"></label>';
  if (m.type === 'log') f += '<div class="field-row"><label class="field"><span>Tarih</span><input type="date" class="input" name="date" value="' + (d.date || today()) + '"></label><label class="field"><span>' + (esc(m.unit) || 'Sayı') + '</span><input type="number" inputmode="decimal" step="any" class="input" name="amount" value="' + (d.amount == null ? '' : d.amount) + '"></label></div>';
  openSheet(sheetHead('<span class="u">' + esc(m.name) + '</span>') + '<div class="sheet-body">' + f + '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="citem-delete">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="citem-save">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title],#sheetRoot [name=text]'); if (i) i.focus(); }, 80);
}
async function saveCItem() {
  const d = S.draft; const m = cmod(d.mod); if (!m) return closeSheet();
  const text = (m.type === 'notes' ? fval('text') : fval('title')).trim();
  if (!text && m.type !== 'log') { const el = $('#sheetRoot [name=title],#sheetRoot [name=text]'); if (el) el.classList.add('err'); return; }
  const base = S.items.get(d.id) || d; base.text = text;
  if (m.type === 'counter') base.value = parseFloat(fval('value')) || 0;
  if (m.type === 'log') { base.date = fval('date') || today(); const n = parseFloat(fval('amount')); base.amount = isNaN(n) ? null : n; }
  closeSheet(); await save(base);
}
function newModuleSheet() {
  S.draft = { type: 'list', home: 'plan' };
  openSheet(sheetHead('Yeni bölüm') + '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Bölümün adı (ör. Alışveriş)" autocomplete="off" enterkeyhint="done">' +
    '<div class="field"><span>Ne tür bir bölüm?</span><div class="opt-grid ctype-grid">' + Object.keys(CTYPES).map(k => '<button type="button" class="opt ' + (k === 'list' ? 'on' : '') + '" data-act="cmod-type" data-v="' + k + '">' + icon(CTYPES[k][2]) + '<span>' + CTYPES[k][0] + '</span><small>' + CTYPES[k][1] + '</small></button>').join('') + '</div></div>' +
    '<div class="field"><span>Nerede dursun?</span>' + seg('home', [['plan', 'Planla sekmesinde'], ['info', 'Bilgi sekmesinde']], 'plan') + '</div>' +
    '<label class="field unit-field hide"><span>Birim (isteğe bağlı)</span><input class="input" name="unit" placeholder="₺, kg, km…" autocomplete="off"></label>' +
    '<div class="set-row" style="margin-top:10px"><div class="grow">Bugün ekranında göster</div><button type="button" class="switch on" data-act="switch" data-name="today" aria-label="Aç/kapat"></button></div>' +
    '</div><div class="sheet-foot"><button class="btn primary" data-act="cmod-save">Bölümü oluştur</button></div>');
  setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveModule() {
  const name = fval('title').trim(); if (!name) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  const st = settings(); const id = uid();
  const m = { id, name, type: S.draft.type || 'list', home: segVal('home') || 'plan', unit: fval('unit').trim() };
  st.custom = (st.custom || []).concat([m]);
  if ($('#sheetRoot .switch[data-name=today]').classList.contains('on')) st.today.push({ k: 'c:' + id, on: true });
  closeSheet(); await saveSettings();
  toast('“' + name + '” bölümü oluşturuldu');
}

/* ----- Bugün ----- */
function viewToday() {
  const st = settings(); const t0 = today(); const h = new Date().getHours();
  const greet = h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
  const pills = [];
  if (planOn('tasks')) { const n = list('task').filter(t => !t.done && t.due && t.due <= t0).length; pills.push('<button class="pill" data-act="go" data-k="tasks"><b>' + n + '</b> görev</button>'); }
  if (planOn('calendar')) { const n = eventsOn(t0).length; pills.push('<button class="pill" data-act="go" data-k="calendar"><b>' + n + '</b> etkinlik</button>'); }
  if (planOn('habits')) { const hs = list('habit').filter(x => habitScheduled(x, t0)); const d = hs.filter(x => (x.log || {})[t0]).length; if (hs.length) pills.push('<button class="pill" data-act="go" data-k="habits"><b>' + d + '/' + hs.length + '</b> alışkanlık</button>'); }
  let html = alertBanner() + '<div class="hero"><div class="hero-greet">' + greet + (st.name ? ', ' + esc(st.name) : '') + '</div><div class="hero-date">' + fmtLong(t0) + '</div><div class="hero-sum">' + pills.join('') + '</div></div><div class="grid-cards">';
  const avail = { flow: typeof flowCard === 'function', tasks: planOn('tasks'), events: planOn('calendar'), routines: planOn('routines'), habits: planOn('habits'), goals: planOn('habits'), pinned: st.notes, mail: typeof Mail !== 'undefined' && Mail.on() && gopt('todayCard'), money: typeof moneyOn === 'function' && moneyOn(), counters: typeof moneyOn === 'function' && moneyOn() && list('counter').length > 0, weekly: typeof weekData === 'function' };
  customMods().forEach(m => { avail['c:' + m.id] = true; });
  st.today.forEach(c => { if (!c.on || !avail[c.k]) return; if (String(c.k).startsWith('c:')) html += cardCustom(c.k.slice(2)); else if (c.k === 'flow') html += flowCard(); else if (TODAY_CARDS[c.k]) html += TODAY_CARDS[c.k](); });
  html += '</div>';
  if (!st.today.some(c => c.on && avail[c.k])) html += '<div class="empty">Bugün ekranı boş. Ayarlar’dan kart ekleyebilirsin.</div>';
  else if (!/<section class="card/.test(html.slice(html.indexOf('grid-card')))) html += '<div class="empty today-calm">' + tr('Bugün için bekleyen bir şey yok. Yukarıdaki kutudan ekleyebilirsin.') + '</div>';
  return html;
}
const foldGet = () => { try { return JSON.parse(lsGet('pusula.fold', '[]')) || []; } catch (e) { return []; } };
function card(ic, title, body, go) {
  if (S.tab === 'today' && !S.ink) {
    // Bugün ekranında: boş kartlar gösterilmez, başlıklar açılır-kapanır
    if (/^\s*<div class="empty">[\s\S]*?<\/div>\s*$/.test(body) && !/<div class="empty">[\s\S]*<div class="empty">/.test(body)) return '';
    const key = 'c:' + title, folded = foldGet().includes(key);
    return '<section class="card foldable' + (folded ? ' folded' : '') + '"><div class="card-head"><button class="card-title fold-btn" data-act="card-fold" data-k="' + esc(key) + '" aria-expanded="' + !folded + '">' + icon(ic, 'sm') + '<span class="u">' + esc(title) + '</span><span class="fold-chev">' + icon('down', 'sm') + '</span></button>' +
      (go ? '<button class="icon-btn card-go" data-act="go" data-k="' + go + '" aria-label="Aç">' + icon('right', 'sm') + '</button>' : '') + '</div><div class="card-body">' + body + '</div></section>';
  }
  const head = go
    ? '<div class="card-head go" data-act="go" data-k="' + go + '" role="link"><div class="card-title">' + icon(ic, 'sm') + '<span class="u">' + esc(title) + '</span></div><span class="chev">' + icon('right', 'sm') + '</span></div>'
    : '<div class="card-head"><div class="card-title">' + icon(ic, 'sm') + '<span class="u">' + esc(title) + '</span></div></div>';
  return '<section class="card">' + head + body + '</section>';
}
const TODAY_CARDS = {
  tasks() {
    const t0 = today(); const all = list('task');
    const flowOn = settings().today.some(c => c.k === 'flow' && c.on);
    const tasks = all.filter(t => !t.done && t.due && t.due <= t0 && !(flowOn && t.due === t0 && t.time)).sort(taskSort);
    const undated = all.filter(t => !t.done && !t.due).length;
    const body = tasks.length
      ? '<div class="list">' + tasks.slice(0, 8).map(taskRow).join('') + '</div>' + (tasks.length > 8 ? '<div class="more">+' + (tasks.length - 8) + ' görev daha</div>' : '')
      : '<div class="empty">Bugün için görev yok.' + (undated ? ' Tarihsiz ' + undated + ' görevin var.' : '') + '</div>';
    return card('task', T('tasks'), body, 'tasks');
  },
  events() {
    const ev = eventsOn(today()).sort(eventSort);
    const gev = Cal.on() ? Cal.forDate(today()) : [];
    return card('event', T('calendar'), ev.length || gev.length ? gev.map(gEventRow).join('') + ev.map(e => eventRow(e, today())).join('') : '<div class="empty">Bugün takvimin boş.</div>', 'calendar');
  },
  routines() {
    const lim = addDays(today(), 7);
    const flowOn = settings().today.some(c => c.k === 'flow' && c.on);
    const rs = list('routine').filter(r => r.next && r.next <= lim && !(flowOn && r.next === today() && r.time)).sort((a, b) => a.next.localeCompare(b.next));
    if (!rs.length) return '';
    return card('repeat', T('routines'), rs.slice(0, 6).map(routineRow).join(''), 'routines');
  },
  habits() {
    const t0 = today(); const hs = list('habit').filter(x => habitScheduled(x, t0)).sort((a, b) => (a.created || 0) - (b.created || 0));
    const body = hs.length ? '<div class="habit-list">' + hs.map(x => {
      const on = !!(x.log || {})[t0];
      return '<button class="habit-chip ' + (on ? 'on' : '') + '" data-act="habit-toggle" data-id="' + x.id + '" data-d="' + t0 + '"><span class="hc">' + icon('check') + '</span><span class="grow u">' + esc(x.title) + '</span><span class="streak">' + icon('flame') + streak(x) + '</span></button>';
    }).join('') + '</div>' : '<div class="empty">Bugün için alışkanlık yok.</div>';
    return card('habit', T('habits'), body, 'habits');
  },
  goals() {
    const gs = list('goal').filter(g => (g.current || 0) < (g.target || 0)).sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')).slice(0, 4);
    if (!gs.length) return '';
    return card('goal', T('goals'), gs.map(g => {
      const pct = goalPct(g);
      return '<div class="mini-goal" data-act="edit-goal" data-id="' + g.id + '"><div class="mini-goal-top"><span class="u">' + esc(g.title) + '</span><span class="muted sm">' + pct + '%</span></div><div class="bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join(''), 'habits');
  },
  pinned() {
    const ns = list('note').filter(n => n.pinned).sort((a, b) => b.updated - a.updated).slice(0, 4);
    if (!ns.length) return '';
    return card('pin', T('pinned'), ns.map(n => '<div class="row" data-act="open-note" data-id="' + n.id + '"><div class="row-main"><div class="row-title">' + (n.kind === 'ink' ? icon('pen', 'xs') + ' ' : '') + esc(noteTitle(n)) + '</div>' + (n.kind !== 'ink' && n.body ? '<div class="row-meta u">' + esc(n.body.slice(0, 90)) + '</div>' : '') + '</div></div>').join(''), 'notes');
  }
};

/* ----- Görevler ----- */
function taskRow(t) {
  const t0 = today(); const over = t.due && t.due < t0 && !t.done;
  const meta = [];
  if (t.due) meta.push('<span class="' + (over ? 'danger' : '') + '">' + relDay(t.due) + (t.time ? ' · ' + t.time : '') + '</span>');
  else if (t.time) meta.push('<span>' + t.time + '</span>');
  const trc = taskRec(t); if (trc) meta.push('<span>' + icon('repeat', 'xs') + ' ' + esc(recText(trc)) + (trc.until ? ' · ' + Lx('bitiş ', 'until ') + fmtShort(trc.until) : '') + '</span>');
  if (t.gev) meta.push('<span>' + icon('event', 'xs') + '</span>');
  const tg = tagChips(t.tags); if (tg) meta.push(tg);
  if (t.notes) meta.push('<span>' + icon('note', 'xs') + '</span>');
  if (t.money && typeof moneyChip === 'function') meta.push(moneyChip(t));
  return '<div class="row ' + (t.done ? 'done' : '') + '" data-act="edit-task" data-id="' + t.id + '"><button class="check ' + (t.done ? 'on' : '') + ' p' + (t.priority || 0) + '" data-act="toggle-task" data-id="' + t.id + '" aria-label="Tamamla">' + icon('check') + '</button><div class="row-main"><div class="row-title">' + esc(t.title) + '</div>' + (meta.length ? '<div class="row-meta">' + meta.join('') + '</div>' : '') + '</div></div>';
}
function viewTasks() {
  const f = S.taskFilter, t0 = today();
  let tasks = list('task');
  if (S.taskTag && tagName(S.taskTag)) tasks = tasks.filter(t => (t.tags || []).includes(S.taskTag)); else S.taskTag = null;
  const filters = [['open', 'Bekleyen'], ['today', 'Bugün'], ['upcoming', 'Yaklaşan'], ['done', 'Biten']];
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
    if (!open.length) body = '<div class="card"><div class="empty">Bekleyen görev yok. Yukarıdan hızlıca ekleyebilirsin.</div></div>';
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
  const rc = taskRec(t);
  if (!t.done && rc) {
    const before = t.due; let n = nextOcc(t.due || today(), rc);
    while (n <= today()) n = nextOcc(n, rc);
    if (!rc.until || n <= rc.until) {
      t.due = n; t.lastDone = Date.now();
      await save(t); Cal.upsertTask(t); const mx = typeof moneyOnDone === 'function' ? moneyOnDone(t, 'task') : null;
      toast('Tamamlandı · sonraki: ' + relDay(n), { label: 'Geri al', fn: async () => { t.due = before; await save(t); Cal.upsertTask(t); if (mx) moneyUndo(mx); } });
      return;
    }
  }
  t.done = !t.done; t.doneAt = t.done ? Date.now() : null;
  await save(t); Cal.upsertTask(t);
  if (t.done) { const mx = typeof moneyOnDone === 'function' ? moneyOnDone(t, 'task') : null; toast('Görev tamamlandı', { label: 'Geri al', fn: async () => { t.done = false; t.doneAt = null; await save(t); Cal.upsertTask(t); if (mx) moneyUndo(mx); } }); }
  else if (typeof moneyUndoLast === 'function') moneyUndoLast(t);
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
    evRecEditor(taskRec(d)) +
    (Cal.on() ? '<div class="set-row" style="margin-top:4px"><div class="grow"><div>Google Takvim’e yaz</div><div class="sub">Tarihi olan görev takviminde görünür; hatırlatma uygulama kapalıyken de telefonuna gelir</div></div><button type="button" class="switch ' + ((d.toCal !== undefined ? d.toCal : Cal.cfg.tasks !== false) ? 'on' : '') + '" data-act="switch" data-name="taskCal" aria-label="Aç/kapat"></button></div>' : '') +
    remindEditor(d.remind) +
    (typeof moneyOn === 'function' && moneyOn() ? moneyEditor(d.money, isNew ? null : d) : '') +
    '<div class="field"><span>Etiketler</span>' + tagPicker('task', d.tags) + '</div>' +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="delete-task">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="save-task">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveTask() {
  const d = S.draft; const title = fval('title').trim();
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); $('#sheetRoot [name=title]').focus(); return; }
  const base = S.items.get(d.id) || d;
  Object.assign(base, { title, notes: fval('notes').trim(), due: fval('due') || null, time: fval('time') || null, priority: Number(segVal('priority') || 0), repeat: 'none', rec: readEvRec(), tags: pickedTags($('#sheetRoot')), remind: readRemind() });
  if ($('#sheetRoot .money-ed')) base.money = readMoney();
  const tsw = $('#sheetRoot .switch[data-name=taskCal]'); if (tsw) base.toCal = tsw.classList.contains('on');
  if (base.rec && !base.due) base.due = today();
  if (base.rec && base.due && (base.rec.unit === 'month' || base.rec.unit === 'year')) base.rec.anchorDay = +base.due.slice(8, 10);
  closeSheet(); await save(base); Cal.upsertTask(base);
}

/* ----- Takvim ----- */
const EV_COLORS = ['', '#E57B70', '#E2B54E', '#6CC08F', '#3CC4B6', '#B39AE6', '#E58A9A'];
function eventRow(e, day) {
  return '<div class="row" data-act="edit-event" data-id="' + e.id + '" data-d="' + (day || e.date) + '"><div class="ev-time">' + (e.allDay || !e.start ? 'Tüm gün' : e.start + (e.end ? '<small>' + e.end + '</small>' : '')) + '</div><div class="ev-bar" style="background:' + (e.color || 'var(--accent)') + '"></div><div class="row-main"><div class="row-title">' + esc(e.title) + '</div>' + (e.rec ? '<div class="row-meta"><span class="rep">' + icon('repeat', 'sm') + esc(recText(e.rec)) + (e.rec.until ? ' · ' + Lx('bitiş ', 'until ') + fmtShort(e.rec.until) : '') + '</span></div>' : '') + (e.notes ? '<div class="row-meta u">' + esc(e.notes.slice(0, 100)) + '</div>' : '') + '</div></div>';
}
function gEventRow(e) {
  return '<div class="row gev" data-act="gev-edit" data-gid="' + esc(e.gid) + '"><div class="ev-time">' + (e.allDay || !e.start ? 'Tüm gün' : e.start + (e.end ? '<small>' + e.end + '</small>' : '')) + '</div><div class="ev-bar" style="background:' + esc(e.color || 'var(--accent)') + '"></div><div class="row-main"><div class="row-title">' + esc(e.title) + '</div><div class="row-meta"><span class="u">' + esc(e.calName || 'Google') + '</span>' + (e.loc ? ' · <span class="u">' + esc(e.loc) + '</span>' : '') + '</div></div></div>';
}
function viewCalendar() {
  if (typeof calViewSwitch === 'function') { const v = calViewSwitch(); if (v) return v; }
  return calViewTabs() + viewCalMonth();
}
function calViewTabs() { return typeof calTabsHtml === 'function' ? calTabsHtml() : ''; }
function viewCalMonth() {
  const t0 = today(); const m = S.calMonth || S.calSel.slice(0, 7); S.calMonth = m;
  if (Cal.ready() && !Cal.busy && (!Cal.fetched[m] || Date.now() - Cal.fetched[m] > 300000)) {
    Cal.fetched[m] = Date.now();
    setTimeout(() => Cal.fetchMonth(m).then(() => { if (S.tab === 'plan' && S.planSub === 'calendar' && !$('#sheetRoot').classList.contains('open')) render(); }).catch(e => console.warn(e)), 0);
  }
  const first = m + '-01'; const start = addDays(first, -dow(first));
  const dim = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const cellsN = Math.ceil((dow(first) + dim) / 7) * 7;
  const marks = {};
  const evAll = list('event'); for (let i = 0; i < cellsN; i++) { const d = addDays(start, i); const n = evAll.filter(e => evOccurs(e, d)).length; if (n) { marks[d] = marks[d] || { e: 0, t: 0 }; marks[d].e += n; } }
  const tkAll = planOn('tasks') ? list('task') : []; for (let i = 0; i < cellsN; i++) { const d = addDays(start, i); const n = tkAll.filter(t => taskOn(t, d)).length; if (n) { marks[d] = marks[d] || { e: 0, t: 0 }; marks[d].t += n; } }
  if (Cal.on()) Object.keys(Cal.byDate).forEach(d => { const n = Cal.forDate(d).length; if (n) { marks[d] = marks[d] || { e: 0, t: 0 }; marks[d].e += n; } });
  const rtAll = list('routine'); for (let i = 0; i < cellsN; i++) { const d = addDays(start, i); const n = rtAll.filter(r => routineOn(r, d)).length; if (n) { marks[d] = marks[d] || { e: 0, t: 0 }; marks[d].t += n; } }
  let cells = '';
  for (let i = 0; i < cellsN; i++) {
    const d = addDays(start, i); const mk = marks[d];
    cells += '<button class="cal-cell ' + (d.slice(0, 7) !== m ? 'out ' : '') + (d === t0 ? 'today ' : '') + (d === S.calSel ? 'sel' : '') + '" data-act="cal-day" data-d="' + d + '"><span class="num">' + (+d.slice(8)) + '</span><span class="dots">' + (mk && mk.e ? '<i class="dot"></i>' : '') + (mk && mk.t ? '<i class="dot t"></i>' : '') + '</span></button>';
  }
  const label = parseYmd(first).toLocaleDateString(TR, { month: 'long', year: 'numeric' });
  const ev = eventsOn(S.calSel).sort(eventSort);
  const tk = planOn('tasks') ? list('task').filter(t => t.due === S.calSel || taskOn(t, S.calSel)).sort(taskSort) : [];
  const gev = Cal.on() ? Cal.forDate(S.calSel) : [];
  const rts = list('routine').filter(r => routineOn(r, S.calSel));
  const agenda = '<section class="card"><div class="card-head"><div class="card-title">' + relDayLong(S.calSel) + '</div><div class="head-links"><button class="link" data-act="add-routine-day">+ Tekrarlı iş</button><button class="link" data-act="add-event">+ Etkinlik</button></div></div>' +
    (ev.length || tk.length || gev.length || rts.length ? gev.map(gEventRow).join('') + ev.map(e => eventRow(e, S.calSel)).join('') + rts.map(routineRow).join('') + tk.map(taskRow).join('') : '<div class="empty">Bu gün için kayıt yok.</div>') +
    (Cal.on() && !Cal.ready() ? '<button class="link cal-refresh" data-act="sync-now">Google Takvim’i yenile</button>' : '') + '</section>';
  return '<div class="cal-wrap"><section class="card"><div class="cal-head"><button class="icon-btn" data-act="cal-prev" aria-label="Önceki ay">' + icon('left') + '</button><div class="cal-month">' + label + '</div><button class="icon-btn" data-act="cal-next" aria-label="Sonraki ay">' + icon('right') + '</button></div><div class="cal-grid">' + DAYS.map(x => '<div class="cal-dow">' + x + '</div>').join('') + cells + '</div></section>' + agenda + '</div>';
}
function relDayLong(s) { const r = relDay(s); return (r === 'Bugün' || r === 'Yarın' || r === 'Dün') ? r + ' · ' + fmtShort(s) : fmtLong(s); }
function shiftMonth(n) { const d = parseYmd(S.calMonth + '-01'); d.setMonth(d.getMonth() + n); S.calMonth = ymd(d).slice(0, 7); render(); }
function editEvent(e, date, gev) {
  const isNew = !e && !gev;
  const d = gev ? Object.assign({}, gev) : e ? clone(e) : { id: uid(), type: 'event', title: '', date: date || today(), allDay: false, start: '', end: '', notes: '', color: '' };
  if (e && date) d._occ = date;
  S.draft = d;
  const targets = Cal.on() ? Cal.writable() : [];
  const targetSel = gev ? '<div class="field"><span>Takvim</span><div class="muted u">' + esc(gev.calName || 'Google') + '</div></div>'
    : (isNew && targets.length ? '<label class="field"><span>Nereye eklensin?</span><select class="input" name="target">' + targets.map(c => '<option value="' + esc(c.id) + '" ' + (Cal.cfg.def === c.id ? 'selected' : '') + '>Google · ' + esc(c.name) + '</option>').join('') + '<option value="local">Sadece PUSULA</option></select></label>' : '');
  openSheet(sheetHead(isNew ? 'Yeni etkinlik' : 'Etkinliği düzenle') + '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Etkinlik adı" value="' + esc(d.title) + '" autocomplete="off" enterkeyhint="done">' + targetSel +
    '<div class="field-row"><label class="field"><span>Tarih</span><input type="date" class="input" name="date" value="' + d.date + '"></label><div class="field toggle-field"><span>Tüm gün</span><button type="button" class="switch ' + (d.allDay ? 'on' : '') + '" data-act="switch" data-name="allDay" aria-label="Tüm gün"></button></div></div>' +
    '<div class="field-row times ' + (d.allDay ? 'hide' : '') + '"><label class="field"><span>Başlangıç</span><input type="time" class="input" name="start" value="' + (d.start || '') + '"></label><label class="field"><span>Bitiş</span><input type="time" class="input" name="end" value="' + (d.end || '') + '"></label></div>' +
    (gev ? '' : '<div class="field"><span>Renk</span><div class="chips">') + (gev ? [] : EV_COLORS).map(c => '<button type="button" class="swatch ' + ((d.color || '') === c ? 'on' : '') + '" data-act="pick-color" data-c="' + c + '" style="background:' + (c || 'var(--accent)') + '" aria-label="Renk"></button>').join('') + (gev ? '' : '</div></div>') +
    remindEditor(d.remind) +
    (gev ? (gev.recurring ? '<p class="muted sm">' + icon('repeat', 'sm') + ' <span>Google’da tekrarlanan etkinlik; burada sadece bu gün değişir. Tekrarı Google Takvim’den düzenleyebilirsin.</span></p>' : '') : evRecEditor(d.rec)) +
    '<div class="field"><span>Not</span><textarea class="input" name="notes" rows="3" placeholder="Yer, detay…">' + esc(d.notes) + '</textarea></div>' +
    '</div><div class="sheet-foot">' + (isNew ? '' : (d.rec && d._occ ? '<button class="btn danger-ghost" data-act="delete-event-occ">' + icon('trash') + ' <span>Sadece bu gün</span></button><button class="btn danger-ghost" data-act="delete-event">Tümünü sil</button>' : '<button class="btn danger-ghost" data-act="delete-event">' + icon('trash') + ' Sil</button>')) + '<button class="btn primary" data-act="save-event">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveEvent() {
  const d = S.draft; const title = fval('title').trim();
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  const allDay = $('#sheetRoot .switch[data-name=allDay]').classList.contains('on');
  const target = d.gid ? d.cal : (fval('target') || 'local');
  const rec = d.gid ? null : readEvRec();
  if (target !== 'local') {
    const ev = { title, date: fval('date') || today(), allDay, start: allDay ? '' : fval('start'), end: allDay ? '' : fval('end'), notes: fval('notes').trim(), rec, remind: readRemind() };
    if (d.gid && d.remind && d.remind.length && !ev.remind.length) ev.remindOff = true;
    if (!navigator.onLine) return toast('Google Takvim için internet gerekli');
    if (!Drive.tokenOk(GCAL_SCOPE)) { try { await Drive.requestToken(); } catch (e) { return toast(e.message); } }
    try {
      if (d.gid) await Cal.patch(d.cal, d.gid, ev); else await Cal.insert(target, ev);
      closeSheet(); S.calSel = ev.date; S.calMonth = ev.date.slice(0, 7);
      await Cal.fetchMonth(S.calMonth); render(); toast(d.gid ? 'Google Takvim’de güncellendi' : 'Google Takvim’e eklendi');
    } catch (e) { toast(e.message); }
    return;
  }
  const base = S.items.get(d.id) || d;
  Object.assign(base, { title, date: fval('date') || today(), allDay, start: allDay ? '' : fval('start'), end: allDay ? '' : fval('end'), notes: fval('notes').trim(), color: d.color || '', rec, remind: readRemind() });
  if (!rec) delete base.exdates;
  S.calSel = (d._occ && rec) ? d._occ : base.date; S.calMonth = base.date.slice(0, 7);
  closeSheet(); await save(base);
}

/* ----- Tekrar motoru ----- */
// rec = { mode: 'cal' (takvime göre) | 'after' (yaptıktan sonra), every: N, unit: 'day'|'week'|'month'|'year', wdays: [0..6], mday: null | 1-31 | 'last' }
function nextOcc(from, rec) {
  const n = Math.max(1, parseInt(rec.every, 10) || 1); const d = parseYmd(from);
  if (rec.unit === 'day') d.setDate(d.getDate() + n);
  else if (rec.unit === 'week') {
    if (rec.mode === 'cal' && rec.wdays && rec.wdays.length) { let x = from; for (let i = 0; i < 7 * n + 7; i++) { x = addDays(x, 1); if (rec.wdays.includes(dow(x))) return x; } return addDays(from, 7 * n); }
    d.setDate(d.getDate() + 7 * n);
  } else if (rec.unit === 'month') {
    const day = rec.mday === 'last' ? 31 : (rec.mode === 'cal' && rec.mday ? +rec.mday : (rec.mode === 'cal' && rec.anchorDay) || d.getDate()); // anchorDay: ilk tarihin günü (31 → 28 → 28 kaymasın)
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last));
  } else if (rec.unit === 'year') { const m = d.getMonth(), day = (rec.mode === 'cal' && rec.anchorDay) || d.getDate(); d.setDate(1); d.setFullYear(d.getFullYear() + n); d.setMonth(m); d.setDate(Math.min(day, new Date(d.getFullYear(), m + 1, 0).getDate())); }
  else d.setDate(d.getDate() + n);
  return ymd(d);
}
function recText(rec) {
  if (!rec) return '';
  const en = isEn(), n = Math.max(1, parseInt(rec.every, 10) || 1);
  const U = en ? { day: ['day', 'days'], week: ['week', 'weeks'], month: ['month', 'months'], year: ['year', 'years'] } : { day: ['gün', 'günde'], week: ['hafta', 'haftada'], month: ['ay', 'ayda'], year: ['yıl', 'yılda'] };
  let t = n === 1 ? (en ? 'Every ' + U[rec.unit][0] : 'Her ' + U[rec.unit][0]) : (en ? 'Every ' + n + ' ' + U[rec.unit][1] : 'Her ' + n + ' ' + U[rec.unit][1] + ' bir');
  if (rec.mode === 'cal' && rec.unit === 'week' && rec.wdays && rec.wdays.length && rec.wdays.length < 7) t = (en ? 'Every ' : 'Her ') + rec.wdays.slice().sort().map(i => DAYS[i]).join(', ');
  if (rec.mode === 'cal' && rec.unit === 'month' && rec.mday) t += rec.mday === 'last' ? (en ? ', last day' : ', son gün') : (en ? ', day ' + rec.mday : ', ' + rec.mday + '. gün');
  if (rec.mode === 'after') t += en ? ' · after done' : ' · yaptıktan sonra';
  return t;
}
function recEditor(rec, noMode) {
  rec = rec || { mode: 'cal', every: 1, unit: 'month', wdays: [], mday: null };
  const units = [['day', 'Gün'], ['week', 'Hafta'], ['month', 'Ay'], ['year', 'Yıl']];
  return '<div class="rec-ed"><div class="field"><span>Ne sıklıkla?</span><div class="rec-row"><span class="rec-her">Her</span><input type="number" class="input rec-n" name="recEvery" min="1" step="1" inputmode="numeric" value="' + (rec.every || 1) + '"><select class="input" name="recUnit">' + units.map(u => '<option value="' + u[0] + '" ' + (rec.unit === u[0] ? 'selected' : '') + '>' + u[1] + '</option>').join('') + '</select></div></div>' +
    '<div class="field rec-week ' + (rec.unit === 'week' ? '' : 'hide') + '"><span>Belirli günler (isteğe bağlı)</span><div class="day-chips">' + DAYS.map((x, i) => '<button type="button" class="chip ' + ((rec.wdays || []).includes(i) ? 'on' : '') + '" data-act="toggle-on" data-i="' + i + '">' + x + '</button>').join('') + '</div></div>' +
    '<label class="field rec-month ' + (rec.unit === 'month' ? '' : 'hide') + '"><span>Ayın hangi günü?</span><select class="input" name="recMday"><option value="">Aynı gün</option>' + Array.from({ length: 31 }, (_, i) => '<option value="' + (i + 1) + '" ' + (+rec.mday === i + 1 ? 'selected' : '') + '>' + (i + 1) + '</option>').join('') + '<option value="last" ' + (rec.mday === 'last' ? 'selected' : '') + '>Son gün</option></select></label>' +
    (noMode ? '' : '<div class="field"><span>Nasıl sayılsın?</span>' + seg('recMode', [['cal', 'Takvime göre'], ['after', 'Yaptıktan sonra']], rec.mode || 'cal') + '<div class="sub muted sm rec-hint">Takvime göre: tarih sabittir (ör. her ayın 5’i). Yaptıktan sonra: sayaç yaptığın gün yeniden başlar (ör. filtre değişiminden 3 ay sonra).</div></div>') + '</div>';
}
/* Hatırlatma: item.remind = [dakika önce, ...] — saati olan işlerde çalışır */
const REMIND_OPTS = [[0, 'Tam zamanında'], [10, '10 dk'], [30, '30 dk'], [60, '1 saat'], [120, '2 saat'], [1440, '1 gün']];
function remindEditor(list) {
  const cur = (list || []).map(Number); const extra = cur.filter(m => !REMIND_OPTS.some(o => o[0] === m));
  return '<div class="field rem-ed"><span>Hatırlat (önce)</span><div class="chips rem-chips">' + REMIND_OPTS.map(o => '<button type="button" class="chip sm ' + (cur.includes(o[0]) ? 'on' : '') + '" data-act="toggle-on" data-m="' + o[0] + '">' + o[1] + '</button>').join('') +
    extra.map(m => '<button type="button" class="chip sm on" data-act="toggle-on" data-m="' + m + '">' + remText(m) + '</button>').join('') +
    '<input class="chip-input rem-custom" type="number" min="1" inputmode="numeric" placeholder="+ dk" aria-label="Başka süre (dakika)"></div><div class="sub muted sm rem-hint">Saat girilmişse çalışır. Google Takvim bağlıysa uygulama kapalıyken de telefonuna bildirim gelir.</div></div>';
}
function readRemind() {
  const out = $$('#sheetRoot .rem-chips .chip.on').map(b => +b.dataset.m);
  const c = parseInt(($('#sheetRoot .rem-custom') || {}).value, 10); if (c > 0) out.push(c);
  return Array.from(new Set(out)).sort((a, b) => a - b);
}
function remText(m) { if (!m) return tr('Tam zamanında'); if (m % 1440 === 0) return Lx(m / 1440 + ' gün', m / 1440 + ' d'); if (m % 60 === 0) return Lx(m / 60 + ' saat', m / 60 + ' h'); return Lx(m + ' dk', m + ' min'); }
/* Tekrarlı etkinlikler: e.rec = { mode: 'cal', every, unit, wdays, mday, until }, e.exdates = [atlanan günler] */
function evOccurs(e, d) {
  if (!e.rec) return e.date === d;
  const r = e.rec, s = e.date, n = Math.max(1, parseInt(r.every, 10) || 1);
  if (!s || d < s || (r.until && d > r.until) || (e.exdates || []).includes(d)) return false;
  if (r.unit === 'day') return daysBetween(s, d) % n === 0;
  if (r.unit === 'week') { const wd = r.wdays && r.wdays.length ? r.wdays : [dow(s)]; if (!wd.includes(dow(d))) return false; return Math.round(daysBetween(addDays(s, -dow(s)), addDays(d, -dow(d))) / 7) % n === 0; }
  const A = parseYmd(s), B = parseYmd(d), last = new Date(B.getFullYear(), B.getMonth() + 1, 0).getDate();
  if (r.unit === 'month') { const mo = (B.getFullYear() - A.getFullYear()) * 12 + B.getMonth() - A.getMonth(); if (mo % n) return false; return B.getDate() === (r.mday === 'last' ? last : Math.min(+r.mday || A.getDate(), last)); }
  if (r.unit === 'year') { const y = B.getFullYear() - A.getFullYear(); return y % n === 0 && B.getMonth() === A.getMonth() && B.getDate() === Math.min(A.getDate(), last); }
  return false;
}
// Bitiş: r.until. 1.11 öncesinde "Son yapılma"ya ileri bir tarih yazıldıysa onu bitiş sayar.
const routineUntil = r => r.until || (r.last && r.next && r.last > r.next && r.last > today() ? r.last : '');
function routineOn(r, d) {
  if (!r.next || d < r.next) return false; const u = routineUntil(r); if (u && d > u) return false; if (d === r.next) return true;
  if (!r.rec || r.rec.mode !== 'cal') return false;
  let x = r.next; for (let i = 0; i < 800; i++) { x = nextOcc(x, r.rec); if (x === d) return true; if (x > d) return false; }
  return false;
}
const eventsOn = d => list('event').filter(e => evOccurs(e, d));
function rrule(r, allDay) {
  const BD = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  let s = 'RRULE:FREQ=' + { day: 'DAILY', week: 'WEEKLY', month: 'MONTHLY', year: 'YEARLY' }[r.unit] + ';INTERVAL=' + Math.max(1, parseInt(r.every, 10) || 1);
  if (r.unit === 'week' && r.wdays && r.wdays.length) s += ';BYDAY=' + r.wdays.slice().sort().map(i => BD[i]).join(',');
  if (r.unit === 'month' && r.mday) s += ';BYMONTHDAY=' + (r.mday === 'last' ? -1 : r.mday);
  if (r.until) s += ';UNTIL=' + r.until.replace(/-/g, '') + (allDay ? '' : 'T235959Z');
  return s;
}
function evRecEditor(rec) {
  const r = rec || null;
  const wk = r && r.unit === 'week' && (+r.every || 1) === 1 && (r.wdays || []).slice().sort().join() === '0,1,2,3,4';
  const preset = !r ? 'none' : wk ? 'weekdays' : ((+r.every || 1) === 1 && !(r.wdays || []).length && !r.mday ? r.unit : 'custom');
  const opts = [['none', 'Tekrarlanmaz'], ['day', 'Her gün'], ['weekdays', 'Hafta içi her gün'], ['week', 'Her hafta'], ['month', 'Her ay'], ['year', 'Her yıl'], ['custom', 'Özel…']];
  return '<div class="ev-rec"><label class="field"><span>Tekrar</span><select class="input" name="evRep">' + opts.map(o => '<option value="' + o[0] + '" ' + (preset === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>' +
    '<div class="ev-custom ' + (preset === 'custom' ? '' : 'hide') + '">' + recEditor(r && preset === 'custom' ? r : { mode: 'cal', every: 1, unit: 'week', wdays: [], mday: null }, true) + '</div>' +
    '<label class="field ev-until ' + (preset === 'none' ? 'hide' : '') + '"><span>Ne zamana kadar? (boş bırakırsan süresiz)</span><input type="date" class="input" name="evUntil" value="' + ((r && r.until) || '') + '"></label></div>';
}
function readEvRec() {
  const p = fval('evRep'); if (!p || p === 'none') return null;
  const base = p === 'custom' ? Object.assign(readRec(), { mode: 'cal' }) : p === 'weekdays' ? { mode: 'cal', every: 1, unit: 'week', wdays: [0, 1, 2, 3, 4], mday: null } : { mode: 'cal', every: 1, unit: p, wdays: [], mday: null };
  base.until = fval('evUntil') || ''; return base;
}
function readRec() {
  const unit = fval('recUnit') || 'month';
  return { mode: segVal('recMode') || 'cal', every: Math.max(1, parseInt(fval('recEvery'), 10) || 1), unit, wdays: unit === 'week' ? $$('#sheetRoot .rec-week .chip.on').map(b => +b.dataset.i) : [], mday: unit === 'month' ? (fval('recMday') === 'last' ? 'last' : (parseInt(fval('recMday'), 10) || null)) : null };
}
function routineNextAfterDone(r, doneDay) {
  if (r.rec.mode === 'after') return nextOcc(doneDay, r.rec);
  let n = r.next || doneDay; do { n = nextOcc(n, r.rec); } while (n <= doneDay);
  return n;
}

/* ----- Rutinler (tekrarlı işler) ----- */
function dueBadge(next) {
  const d = daysBetween(today(), next);
  if (d < 0) return '<span class="due late">' + (-d) + ' gün gecikti</span>';
  if (d === 0) return '<span class="due now">Bugün</span>';
  if (d === 1) return '<span class="due soon">Yarın</span>';
  return '<span class="due">' + d + ' gün</span>';
}
function routineRow(r) {
  return '<div class="row rt-row" data-act="rt-edit" data-id="' + r.id + '"><button class="check" data-act="rt-done" data-id="' + r.id + '" aria-label="Yaptım">' + icon('check') + '</button><div class="row-main"><div class="row-title">' + esc(r.title) + '</div><div class="row-meta"><span class="u">' + esc(recText(r.rec)) + (r.time ? ' · ' + r.time : '') + (routineUntil(r) ? ' · ' + Lx('bitiş ', 'until ') + fmtShort(routineUntil(r)) : '') + '</span>' + ((r.remind || []).length && r.time ? '<span>' + icon('bell', 'xs') + '</span>' : '') + (r.last && r.last <= today() ? '<span>· son: ' + relDay(r.last) + '</span>' : '') + (r.gev ? '<span>' + icon('event', 'xs') + '</span>' : '') + (r.money && typeof moneyChip === 'function' ? moneyChip(r) : '') + '</div></div>' + (r.next ? dueBadge(r.next) : '') + '</div>';
}
function viewRoutines() {
  const t0 = today(), wk = addDays(t0, 7);
  const rs = list('routine').sort((a, b) => (a.next || '9999').localeCompare(b.next || '9999'));
  let h = '<div class="section-title first"><span class="u">' + esc(T('routines')) + '</span><button class="link" data-act="new-routine">+ Tekrarlı iş</button></div><p class="muted sm page-hint">Düzenli yaptığın işler: “Yaptım” deyince sonraki tarihe geçer; istersen yaptıktan sonra saymaya başlar, maliyet ve geçmiş tutar. Tek seferlik ya da yapılacak işler için Görevler’i kullan.</p>';
  if (!rs.length) return h + '<div class="card"><div class="empty">Tekrarlı işlerini buraya ekle: araç bakımı her 6 ayda, klima filtresi her 3 ayda, sigorta yenileme her yıl, bitki sulama 4 günde bir… “Yaptım” dediğinde sonraki tarih kendiliğinden hesaplanır.</div></div>';
  const over = rs.filter(r => r.next && r.next < t0), soon = rs.filter(r => r.next && r.next >= t0 && r.next <= wk), later = rs.filter(r => !r.next || r.next > wk);
  const sec = (t, arr, cls) => arr.length ? '<div class="section-title ' + (cls || '') + '"><span>' + t + '<span class="count">' + arr.length + '</span></span></div><div class="card">' + arr.map(routineRow).join('') + '</div>' : '';
  return h + sec('Gecikmiş', over, 'danger') + sec('Bu hafta', soon) + sec('Daha sonra', later);
}
function editRoutine(r) {
  const isNew = !r;
  const d = r ? clone(r) : { id: uid(), type: 'routine', title: '', rec: { mode: 'cal', every: 1, unit: 'month', wdays: [], mday: null }, next: today(), last: '', hist: [], cost: null, notes: '', toCal: Cal.on() && Cal.cfg.routines !== false };
  S.draft = d;
  const hist = (d.hist || []).slice(-10).reverse();
  openSheet(sheetHead(isNew ? 'Yeni tekrarlı iş' : 'Tekrarlı işi düzenle') + '<div class="sheet-body">' +
    '<input class="input big" name="title" placeholder="Örn. Araç bakımı" value="' + esc(d.title) + '" autocomplete="off" enterkeyhint="done">' +
    recEditor(d.rec) +
    '<div class="field-row"><label class="field"><span>Sonraki tarih</span><input type="date" class="input" name="next" value="' + (d.next || '') + '"></label><label class="field"><span>Saat (isteğe bağlı)</span><input type="time" class="input" name="rtime" value="' + (d.time || '') + '"></label></div>' +
    remindEditor(d.remind) +
    '<div class="field-row"><label class="field"><span>Ne zamana kadar? (boş = süresiz)</span><input type="date" class="input" name="runtil" value="' + routineUntil(d) + '"></label><label class="field"><span>En son ne zaman yaptın? (isteğe bağlı)</span><input type="date" class="input" name="last" value="' + (routineUntil(d) && d.last === routineUntil(d) && !d.until ? '' : (d.last || '')) + '"></label></div>' +
    (typeof moneyOn === 'function' && moneyOn() ? moneyEditor(d.money || (d.cost != null ? { dir: 'out', amount: d.cost } : null), isNew ? null : d) : '<label class="field"><span>Maliyet (isteğe bağlı)</span><input type="number" inputmode="decimal" step="any" class="input" name="cost" placeholder="₺" value="' + (d.cost == null ? '' : d.cost) + '"></label>') +
    '<div class="field"><span>Not</span><textarea class="input" name="notes" rows="2" placeholder="Servis, parça, detay…">' + esc(d.notes || '') + '</textarea></div>' +
    (Cal.on() ? '<div class="set-row" style="margin-top:8px"><div class="grow"><div>Google Takvim’e yaz</div><div class="sub">Tekrarlarıyla birlikte takviminde görünür; saat ve hatırlatma da yazılır</div></div><button type="button" class="switch ' + (d.toCal ? 'on' : '') + '" data-act="switch" data-name="toCal" aria-label="Aç/kapat"></button></div>' : '') +
    (hist.length ? '<div class="field"><span>Geçmiş</span><div class="rt-hist">' + hist.map(x => '<div><span>' + fmtShort(x.d) + '</span>' + (x.cost != null ? '<b>' + fmtNum(x.cost) + ' ₺</b>' : '') + '</div>').join('') + '</div></div>' : '') +
    '</div><div class="sheet-foot">' + (isNew ? '' : '<button class="btn danger-ghost" data-act="rt-delete">' + icon('trash') + ' Sil</button>') + '<button class="btn primary" data-act="rt-save">Kaydet</button></div>');
  if (isNew) setTimeout(() => { const i = $('#sheetRoot [name=title]'); if (i) i.focus(); }, 80);
}
async function saveRoutine() {
  const d = S.draft; const title = fval('title').trim();
  if (!title) { $('#sheetRoot [name=title]').classList.add('err'); return; }
  const base = S.items.get(d.id) || d;
  const rec = readRec(); let last = fval('last') || ''; let next = fval('next'); let until = fval('runtil') || '';
  if (last > today()) { if (!until) until = last; last = ''; }
  if (!next) next = last ? nextOcc(last, rec) : today();
  if (rec.mode === 'cal' && (rec.unit === 'month' || rec.unit === 'year')) rec.anchorDay = +next.slice(8, 10);
  const cost = parseFloat(fval('cost'));
  const sw = $('#sheetRoot .switch[data-name=toCal]');
  Object.assign(base, { title, rec, next, last, until, time: fval('rtime') || '', remind: readRemind(), cost: isNaN(cost) ? null : cost, notes: fval('notes').trim(), toCal: sw ? sw.classList.contains('on') : !!base.toCal });
  if ($('#sheetRoot .money-ed')) { base.money = readMoney(); base.cost = base.money && base.money.dir === 'out' ? base.money.amount : null; }
  closeSheet(); await save(base);
  if (base.toCal) Cal.upsertRoutine(base); else if (base.gev && Cal.ready()) { const g = base.gev; base.gev = null; Cal.del(g.cal, g.id).catch(() => {}); save(base, { silent: true }); }
}
async function routineDone(id) {
  const r = S.items.get(id); if (!r) return;
  const before = { next: r.next, last: r.last, hist: (r.hist || []).slice() };
  const t0 = today();
  r.hist = (r.hist || []).concat([{ d: t0, cost: r.cost != null ? r.cost : null }]);
  r.last = t0; r.next = routineNextAfterDone(r, t0);
  await save(r);
  Cal.upsertRoutine(r); const mx = typeof moneyOnDone === 'function' ? moneyOnDone(r, 'routine') : null;
  toast('Yapıldı · sonraki: ' + relDay(r.next), { label: 'Geri al', fn: async () => { Object.assign(r, before); await save(r); Cal.upsertRoutine(r); if (mx) moneyUndo(mx); } });
}

/* ----- Alışkanlık & hedef ----- */
const goalPct = g => Math.max(0, Math.min(100, g.target ? Math.round((g.current || 0) / g.target * 100) : 0));
function viewHabits() {
  const t0 = today(); const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(t0, -i));
  const habits = list('habit').sort((a, b) => (a.created || 0) - (b.created || 0));
  const goals = list('goal').sort((a, b) => (goalPct(a) >= 100) - (goalPct(b) >= 100) || (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  let h = '<div class="section-title first"><span class="u">' + esc(T('habits')) + '</span><button class="link" data-act="new-habit">+ Ekle</button></div>';
  if (!habits.length) h += '<div class="card"><div class="empty">Henüz alışkanlık yok. Her gün yapmak istediğin küçük bir şeyle başla: su içmek, 10 dakika okumak…</div></div>';
  else h += '<div class="grid-cards">' + habits.map(hb => {
    const log = hb.log || {};
    return '<section class="card"><div class="habit-top" data-act="edit-habit" data-id="' + hb.id + '"><div class="row-title">' + esc(hb.title) + '</div><span class="streak">' + icon('flame') + streak(hb) + '</span></div><div class="week">' +
      days.map(d => { const on = !!log[d]; return '<button class="wd ' + (on ? 'on ' : '') + (habitScheduled(hb, d) ? '' : 'off ') + (d === t0 ? 'today' : '') + '" data-act="habit-toggle" data-id="' + hb.id + '" data-d="' + d + '"><span>' + DAYS[dow(d)] + '</span><b>' + (on ? icon('check') : +d.slice(8)) + '</b></button>'; }).join('') + '</div></section>';
  }).join('') + '</div>';
  h += '<div class="section-title"><span class="u">' + esc(T('goals')) + '</span><button class="link" data-act="new-goal">+ Ekle</button></div>';
  if (!goals.length) h += '<div class="card"><div class="empty">Ölçülebilir bir hedef ekle: “12 kitap oku”, “5.000 ₺ biriktir”…</div></div>';
  else h += '<div class="grid-cards">' + goals.map(g => {
    const pct = goalPct(g); const left = g.deadline ? daysBetween(today(), g.deadline) : null;
    return '<section class="card"><div class="habit-top" data-act="edit-goal" data-id="' + g.id + '"><div class="row-title">' + esc(g.title) + '</div><span class="muted sm">' + (pct >= 100 ? '✓ Tamam' : pct + '%') + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div><div class="goal-foot"><span class="muted sm">' + fmtNum(g.current) + ' / ' + fmtNum(g.target) + ' ' + esc(g.unit || '') + (left != null ? ' · ' + (left >= 0 ? Lx(left + ' gün kaldı', left + ' days left') : Lx('süre doldu', 'time is up')) : '') + '</span><div class="goal-ctrl"><button class="mini-btn" data-act="goal-step" data-id="' + g.id + '" data-dir="-1" aria-label="Azalt">−</button><button class="mini-btn" data-act="goal-step" data-id="' + g.id + '" data-dir="1" aria-label="Artır">+</button></div></div></section>';
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
const noteTitle = n => n.title || (n.kind === 'ink' ? 'Kalem notu' : (n.kind === 'list' ? (((n.items || [])[0] || {}).t || '') : (n.body || '').split('\n')[0]).slice(0, 60) || 'Başlıksız not');
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
    if (n.kind === 'ink') return '<button class="note-card" data-act="open-note" data-id="' + n.id + '"><img alt="" src="' + inkThumb(n) + '">' + (n.title ? '<h3 class="u">' + esc(n.title) + '</h3>' : '') + meta + '</button>';
    return '<button class="note-card" data-act="open-note" data-id="' + n.id + '">' + (n.title ? '<h3 class="u">' + esc(n.title) + '</h3>' : '') + (n.body ? '<p class="u">' + esc(n.body.slice(0, 400)) + '</p>' : '') + meta + '</button>';
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
function inkColor(c) { if (c && c !== 'auto') return c; return currentPalette().c[3]; }
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
  const key = n.updated + ':' + theme + ':' + currentPalette().c[0]; const hit = thumbCache.get(n.id);
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
const CARD_LABELS = { flow: 'Günün akışı (saat sırasıyla)', tasks: 'Bugünün görevleri', events: 'Bugünkü etkinlikler', routines: 'Yaklaşan rutinler', habits: 'Alışkanlıklar', goals: 'Hedefler', pinned: 'Sabitlenen notlar', mail: 'Posta (Gmail bağlıyken)', money: 'Cüzdan (bu ay ve yaklaşan ödemeler)', counters: 'Sayaçlı harcamalar (+1 düğmeleri)' };
const MOD_LABELS = { tasks: 'Görevler', calendar: 'Takvim', routines: 'Tekrarlı işler', habits: 'Alışkanlıklar & hedefler' };
function orderRows(listKey, arr, labels) {
  return arr.map((m, i) => '<div class="set-row"><div class="grow">' + (String(m.k).startsWith('c:') ? '<span class="u">' + esc((cmod(m.k.slice(2)) || {}).name || '') + '</span>' : labels[m.k]) + '</div><div class="order-btns"><button class="icon-btn" data-act="list-move" data-list="' + listKey + '" data-i="' + i + '" data-dir="-1" aria-label="Yukarı" ' + (i === 0 ? 'disabled' : '') + '>' + icon('up') + '</button><button class="icon-btn" data-act="list-move" data-list="' + listKey + '" data-i="' + i + '" data-dir="1" aria-label="Aşağı" ' + (i === arr.length - 1 ? 'disabled' : '') + '>' + icon('down') + '</button></div><button class="switch ' + (m.on ? 'on' : '') + '" data-act="list-toggle" data-list="' + listKey + '" data-i="' + i + '" aria-label="Aç/kapat"></button></div>').join('');
}
function accOpen() { try { return JSON.parse(lsGet('pusula.acc', '["look"]')) || []; } catch (e) { return []; } }
function acc(id, title, ic, body) {
  return '<details class="set-acc" data-acc="' + id + '"' + (accOpen().includes(id) ? ' open' : '') + '><summary>' + icon(ic) + '<span class="acc-t">' + title + '</span><span class="chev-d">' + icon('right', 'sm') + '</span></summary><div class="acc-body">' + body + '</div></details>';
}
function viewSettings() {
  const st = settings();
  const general = '<div class="set-sub">Dil / Language</div><div class="pad-x"><div class="seg"><button class="u ' + (st.lang !== 'en' ? 'on' : '') + '" data-act="look" data-k="lang" data-v="tr">Türkçe</button><button class="u ' + (st.lang === 'en' ? 'on' : '') + '" data-act="look" data-k="lang" data-v="en">English</button></div></div>' +
    '<div class="set-row"><div class="grow"><div>Adın</div><div class="sub">Bugün ekranında selamlamak için</div></div><input class="input slim" id="setName" style="max-width:170px" placeholder="Adın" value="' + esc(st.name) + '" autocomplete="off"></div>';
  const titles = '<div class="set-sub">Başlık stili</div><div class="pad-x"><div class="seg"><button class="' + (st.titleStyle !== 'ironic' ? 'on' : '') + '" data-act="look" data-k="titleStyle" data-v="classic">Klasik</button><button class="' + (st.titleStyle === 'ironic' ? 'on' : '') + '" data-act="look" data-k="titleStyle" data-v="ironic">İronik</button></div></div>' +
    '<div class="set-sub">Başlıkları yeniden adlandır</div><p class="muted sm" style="margin:0 0 6px">Her bölüm için normal ve ironik öneriler var; dokununca seçilir. İstersen kendin yaz. Boş bırakırsan yukarıdaki stile göre yazılır.</p>' +
    '<button class="btn block" data-act="titles-reset">' + icon('undo', 'sm') + ' <span>Tüm başlıkları varsayılana döndür</span></button>' +
    Object.keys(TITLE_OPTS).filter(k => TITLES[k]).map(k => { const L = isEn() ? 'en' : 'tr'; const cur = (st.titles || {})[k] || (st.titleStyle === 'ironic' && st.ironicKeep && st.ironicKeep[k]) || ''; const [nor, iro] = TITLE_OPTS[k][L];
      const chip = v => '<button class="chip sm u ' + (cur === v ? 'on' : '') + '" data-act="title-pick" data-k="' + k + '" data-v="' + esc(v) + '">' + esc(v) + '</button>';
      const own = cur && !nor.includes(cur) && !iro.includes(cur) ? '<div class="tr-grp"><span class="tr-lbl">' + tr('Senin') + '</span><div class="chips">' + chip(cur) + '</div></div>' : '';
      return '<div class="title-row"><div class="tr-head"><span class="u">' + esc(TITLES[k][L][0]) + '</span><input class="input slim" data-title-key="' + k + '" placeholder="' + esc(TITLES[k][L][st.titleStyle === 'ironic' ? 1 : 0]) + '" value="' + esc(cur) + '" autocomplete="off">' + (cur ? '<button class="icon-btn" data-act="title-pick" data-k="' + k + '" data-v="" aria-label="Varsayılan">' + icon('undo', 'sm') + '</button>' : '') + '</div>' +
        own + '<div class="tr-grp"><span class="tr-lbl">' + tr('Normal') + '</span><div class="chips">' + nor.map(chip).join('') + '</div></div><div class="tr-grp"><span class="tr-lbl">' + tr('İronik') + '</span><div class="chips">' + iro.map(chip).join('') + '</div></div></div>'; }).join('') +
    '<div class="set-sub">Kendi bölümlerin</div>' +
    (customMods().length ? customMods().map(m => '<div class="set-row cmod-row"><div class="grow"><input class="input slim" data-cmod-name="' + m.id + '" value="' + esc(m.name) + '" autocomplete="off"><div class="sub"><span>' + CTYPES[m.type][0] + '</span> · <span>' + (m.home === 'info' ? 'Bilgi sekmesinde' : 'Planla sekmesinde') + '</span></div></div><button class="icon-btn" data-act="cmod-home" data-id="' + m.id + '" aria-label="Sekmeyi değiştir">' + icon(m.home === 'info' ? 'info' : 'plan') + '</button><button class="icon-btn" data-act="cmod-del" data-id="' + m.id + '" aria-label="Sil">' + icon('trash') + '</button></div>').join('') : '<p class="muted sm" style="margin:4px 0 8px">Henüz yok. Liste, not defteri, sayaç ya da kayıt defteri olarak kendi bölümünü ekle.</p>') +
    '<button class="btn block" data-act="cmod-new">' + icon('plus') + ' Yeni bölüm ekle</button>';
  const modules = '<div class="set-sub">Planla</div>' + orderRows('plan', st.plan, MOD_LABELS) +
    '<div class="set-sub">Alt menü</div><p class="muted sm" style="margin:0 0 6px">Sekmelerin sırası ve görünürlüğü. Okla taşı, anahtarla gizle.</p>' + orderRows('tabs', st.tabs, { today: esc(TL('today')), plan: esc(TL('plan')), info: esc(TL('info')), money: esc(TL('money')) + ' <span class="muted sm">· ' + tr('gelir, gider, hesaplar') + '</span>', mail: esc(TL('mail')) + ' <span class="muted sm">· Gmail</span>', tools: esc(TL('tools')) + ' <span class="muted sm">· ' + tr('araçlar ve oyunlar') + '</span>' }) +
    '<div class="set-sub">Bilgi</div><div class="set-row"><div class="grow">Notlar ve kalem notları</div><button class="switch ' + (st.notes ? 'on' : '') + '" data-act="notes-toggle" aria-label="Aç/kapat"></button></div>' +
    '<div class="set-row click" data-act="tpl-manage">' + icon('template') + '<div class="grow"><div>Not şablonları</div><div class="sub">Alışveriş, valiz, toplantı, günlük… aç-kapat, düzenle, kendi şablonunu ekle</div></div>' + icon('right') + '</div>' +
    '<div class="set-row"><div class="grow"><div>Yeni kalem notu kâğıdı</div></div><div class="seg" style="max-width:240px">' + PAPERS.map(p => '<button class="' + (st.paper === p ? 'on' : '') + '" data-act="set-paper" data-k="' + p + '">' + { blank: 'Boş', lines: 'Çizgili', grid: 'Kareli' }[p] + '</button>').join('') + '</div></div>' +
    '<div class="set-sub">Etiketler</div><div class="set-row click" data-act="manage-tags" data-scope="task">' + icon('tag') + '<div class="grow">Görev etiketleri</div><span class="muted sm">' + tagsOf('task').length + '</span>' + icon('right') + '</div><div class="set-row click" data-act="manage-tags" data-scope="note">' + icon('tag') + '<div class="grow">Not etiketleri</div><span class="muted sm">' + tagsOf('note').length + '</span>' + icon('right') + '</div>';
  const data = '<div class="set-row"><div class="grow"><div>Google oturumunu kendiliğinden yenile</div><div class="sub">Oturum bitince uygulamaya ilk dokunuşta yenilenir; kısa bir Google penceresi açılıp kapanabilir</div></div><button class="switch ' + (st.gAuto !== false ? 'on' : '') + '" data-act="gauto-toggle" aria-label="Aç/kapat"></button></div>' + '<div class="set-sub">Senkron</div><div class="set-row click" data-act="drive-open">' + icon('cloud') + '<div class="grow"><div>Google Drive</div><div class="sub" id="driveStatus">' + driveStatusHtml() + '</div></div>' + icon('right') + '</div>' +
    '<div class="set-row click" data-act="cal-open">' + icon('event') + '<div class="grow"><div>Google Takvim</div><div class="sub" id="calStatus">' + calStatusHtml() + '</div></div>' + icon('right') + '</div>' +
    '<div class="set-sub">Yedek</div><div class="set-row click" data-act="share-backup">' + icon('upload') + '<div class="grow"><div>Yedeği gönder / kaydet</div><div class="sub" id="lastBackup">' + lastBackupText() + '</div></div></div>' +
    '<div class="set-row click" data-act="snapshots">' + icon('clock') + '<div class="grow"><div>Otomatik yedekler</div><div class="sub">Her gün kendiliğinden alınır, son 14 gün saklanır</div></div>' + icon('right') + '</div>' +
    '<div class="set-row click" data-act="export">' + icon('download') + '<div class="grow"><div>Yedeği dosya olarak indir</div></div></div>' +
    '<label class="set-row click">' + icon('upload') + '<div class="grow"><div>Yedekten içe aktar</div><div class="sub">Var olan verilerle birleştirilir</div></div><input type="file" id="importFile" accept="application/json,.json,text/plain" hidden></label>' +
    '<div class="set-row click danger" data-act="wipe">' + icon('trash') + '<div class="grow">Bu cihazdaki tüm verileri sil</div></div>';
  const dn = typeof dnOpen === 'function' ? '<div class="set-row click" data-act="devnotes">' + icon('idea') + '<div class="grow"><div>Güncelleme notları</div><div class="sub">' + dnOpen().length + ' <span>bekleyen not</span></div></div>' + icon('right') + '</div><div class="set-row"><div class="grow"><div>Üstte güncelleme notu simgesi</div><div class="sub">Ampul simgesi: aklına geleni hemen not al</div></div><button class="switch ' + (st.devIcon !== false ? 'on' : '') + '" data-act="devicon-toggle" aria-label="Aç/kapat"></button></div>' : '';
  const app = dn + '<div class="set-row click update-row" data-act="check-update">' + icon('sync') + '<div class="grow"><div>' + (S.waitingSW ? 'Yeni sürüm hazır — yüklemek için dokun' : 'Güncellemeleri denetle') + '</div><div class="sub" id="updStatus">' + (S.waitingSW ? 'Verilerin silinmez' : 'Şu anki sürüm ' + VERSION) + '</div></div></div>';
  return acc('general', 'Genel', 'settings', general) +
    acc('look', 'Görünüm', 'today', lookBody(st)) +
    acc('titles', 'Başlıklar ve bölümler', 'tag', titles) +
    acc('todaycards', 'Bugün ekranı', 'task', orderRows('today', st.today, CARD_LABELS)) +
    acc('alerts', 'Uyarılar', 'bell', (typeof remindSettingsHtml === 'function' ? remindSettingsHtml() : '') + '<p class="muted sm" style="margin:10px 0 4px">Sağ üstteki zilde ve Bugün ekranının üstündeki şeritte görünür. Bir uyarıyı gizlersen o gün bir daha gösterilmez.</p>' +
      '<div class="set-row"><div class="grow"><div>Bugün ekranında uyarı şeridi</div></div><button class="switch ' + ((st.alerts || {}).banner !== false ? 'on' : '') + '" data-act="alert-toggle" data-k="banner" aria-label="Aç/kapat"></button></div>' +
      Object.keys(ALERT_TYPES).map(k => '<div class="set-row"><div class="grow">' + ALERT_TYPES[k] + '</div><button class="switch ' + ((st.alerts || {})[k] !== false ? 'on' : '') + '" data-act="alert-toggle" data-k="' + k + '" aria-label="Aç/kapat"></button></div>').join('')) +
    (typeof gmailSettingsBody === 'function' ? acc('gmail', 'Gmail', 'mail', gmailSettingsBody()) : '') +
    acc('modules', 'Modüller ve etiketler', 'plan', modules) +
    acc('data', 'Senkron ve yedek', 'cloud', data) +
    acc('app', 'Uygulama', 'sync', app) +
    '<div class="about">PUSULA · ' + VERSION + '<br>Veriler cihazında saklanır, internetsiz çalışır.</div>';
}
function lookBody(st) {
  const opt = (k, v, on, inner, label) => '<button class="opt ' + (on ? 'on' : '') + '" data-act="look" data-k="' + k + '" data-v="' + v + '">' + inner + '<span>' + label + '</span></button>';
  const themeOpts = () => Object.keys(THEMES).map(id => { const t = THEMES[id], L = themePalette(id, 'light', st.tone), D = themePalette(id, 'dark', st.tone); return opt('themeId', id, st.themeId === id, '<span class="tsw"><i style="background:' + L.c[0] + '"></i><i style="background:' + L.a[0] + '"></i><i style="background:' + D.c[0] + '"></i><i style="background:' + D.a[0] + '"></i></span>', '<span class="u">' + (isEn() ? t.en : t.tr) + '</span>'); }).join('');
  const segRow = (k, map, cur) => '<div class="seg">' + Object.keys(map).map(v => '<button class="' + (cur === v ? 'on' : '') + '" data-act="look" data-k="' + k + '" data-v="' + v + '">' + (Array.isArray(map[v]) ? map[v][0] : map[v]) + '</button>').join('') + '</div>';
  const mode = currentTheme(); const p = currentPalette();
  const cardPrev = { plain: '<span class="cprev"><i style="background:var(--line);height:1px"></i><i style="background:transparent"></i><i style="background:var(--line);height:1px"></i></span>', outline: '<span class="cprev"><i style="border:1px solid var(--line);height:20px;border-radius:4px"></i></span>', filled: '<span class="cprev"><i style="background:var(--surface2);border:1px solid var(--line);height:20px;border-radius:4px"></i></span>' };
  return '<div class="set-sub">Mod</div><div class="pad-x">' + segRow('theme', { dark: 'Koyu', light: 'Açık', system: 'Sistem' }, st.theme) + '</div>' +
    '<div class="set-sub">Tema</div><p class="muted sm" style="margin:0 0 6px">Her tema hem koyu hem açık modda çalışır.</p><div class="opt-grid">' + themeOpts() + '</div>' +
    '<div class="set-sub">Ton yoğunluğu</div><p class="muted sm" style="margin:0 0 6px">Zeminin ve alanların temanın rengine ne kadar boyanacağı.</p><div class="pad-x">' + segRow('tone', TONES, st.tone) + '</div>' +
    '<div class="set-sub">Vurgu rengi</div><div class="accents">' + Object.keys(ACCENTS).map(k => '<button class="accent-dot ' + (k === 'mono' ? 'mono ' : '') + (k === 'theme' ? 'themeacc ' : '') + (st.accent === k ? 'on' : '') + '" style="background:' + (k === 'theme' ? p.a[0] : ACCENTS[k] ? ACCENTS[k][mode][0] : 'var(--text)') + '" data-act="look" data-k="accent" data-v="' + k + '" aria-label="' + ACCENT_NAMES[k] + '" title="' + ACCENT_NAMES[k] + '"></button>').join('') + '</div>' +
    '<div class="set-sub">Alanlar</div><div class="opt-grid">' + Object.keys(CARD_STYLES).map(k => opt('cards', k, st.cards === k, cardPrev[k], CARD_STYLES[k])).join('') + '</div>' +
    '<div class="set-sub">Yazı tipi</div><div class="opt-grid">' + Object.keys(FONTS).map(k => opt('font', k, st.font === k, '<span class="fprev" style="font-family:' + FONTS[k][1].replace(/"/g, '&quot;') + '">Ağ</span>', '<span class="u">' + FONTS[k][0] + '</span>')).join('') + '</div>' +
    '<div class="set-sub">Yazı boyutu (punto)</div><div class="pad-x">' + segRow('fs', { '0.8': '%80', '0.9': '%90', '1.0': '%100' }, (Number(st.fs) || 1).toFixed(1)) + '</div>' +
    '<div class="set-sub">Satır aralığı</div><div class="pad-x">' + segRow('density', DENSITY, st.density) + '</div>' +
    '<div class="set-row"><div class="grow">Alt menüde yazılar</div><button class="switch ' + (st.tabLabels !== false ? 'on' : '') + '" data-act="look" data-k="tabLabels" data-v="' + (st.tabLabels !== false ? 'false' : 'true') + '" aria-label="Aç/kapat"></button></div>' +
    '<button class="btn block" data-act="look-reset">Görünümü sıfırla</button>';
}
function manageTags(scope) {
  const tags = tagsOf(scope);
  openSheet(sheetHead(scope === 'task' ? 'Görev etiketleri' : 'Not etiketleri') + '<div class="sheet-body">' +
    (tags.length ? '<div class="set-group">' + tags.map(t => '<div class="set-row"><input class="input slim grow" data-tag-name="' + t.id + '" value="' + esc(t.name) + '" autocomplete="off"><button class="icon-btn" data-act="tag-delete" data-id="' + t.id + '" data-scope="' + scope + '" aria-label="Sil">' + icon('trash') + '</button></div>').join('') + '</div>' : '<div class="empty">Henüz etiket yok.</div>') +
    '<form class="quick-add" data-form="new-tag" data-scope="' + scope + '" style="margin-top:14px"><input class="input" name="q" placeholder="Yeni etiket adı" autocomplete="off" enterkeyhint="done"><button class="icon-btn" type="submit" aria-label="Ekle">' + icon('plus') + '</button></form>' +
    '<div class="sheet-msg">İsmi değiştirmek için üzerine yazman yeterli.</div></div>', { onClose: () => setTimeout(render, 0) });
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
  if (!ask('Veriler bu yedekteki hâline dönecek. Şu anki hâlin de ayrıca yedeklenecek. Devam edilsin mi?')) return;
  await autoSnapshot(true, 'Geri yüklemeden önce');
  const ids = new Set(data.items.map(i => i.id)); const now = Date.now(); const toPut = [];
  data.items.forEach(it => { const o = Object.assign({}, it, { updated: now, deleted: false, _dd: 1 }); S.items.set(o.id, o); toPut.push(o); });
  S.items.forEach(it => { if (!ids.has(it.id) && !it.deleted && it.type !== 'settings') { it.deleted = true; it.updated = now; it._dd = 1; toPut.push(it); } });
  await DB.putMany(toPut); thumbCache.clear(); Drive.schedule(500);
  closeSheet(); render(); toast('Yedek geri yüklendi');
}
function backupReminder() {
  if (Drive.on()) return;
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
    data.items.forEach(it => { if (!it || !it.id || !it.type) return; const loc = S.items.get(it.id); if (!loc || (it.updated || 0) > (loc.updated || 0)) { it._dd = 1; S.items.set(it.id, it); toPut.push(it); } });
    await DB.putMany(toPut); thumbCache.clear(); render(); Drive.schedule(500);
    toast(toPut.length + ' kayıt içe aktarıldı');
  } catch (e) { toast('İçe aktarılamadı: ' + e.message); }
}

/* ===================== Eylemler ===================== */
const ACTIONS = {
  'tab': el => { S.tab = el.dataset.k; window.scrollTo(0, 0); render(); },
  'open-settings': () => { S.prevTab = S.tab; S.tab = 'settings'; window.scrollTo(0, 0); render(); },
  'close-settings': () => { S.tab = S.prevTab && S.prevTab !== 'settings' ? S.prevTab : 'today'; window.scrollTo(0, 0); render(); },
  'plan-sub': el => { S.planSub = el.dataset.k; window.scrollTo(0, 0); render(); },
  'info-sub': el => { S.infoSub = el.dataset.k; window.scrollTo(0, 0); render(); },
  'go': el => { const k = el.dataset.k; if (k === 'money') { S.tab = 'money'; S.moneySub = 'summary'; window.scrollTo(0, 0); return render(); } if (k === 'mail') { S.tab = 'mail'; S.mailSub = 'inbox'; window.scrollTo(0, 0); return render(); } if (k.startsWith('c:')) { const m = cmod(k.slice(2)); if (!m) return; if (m.home === 'info') { S.tab = 'info'; S.infoSub = k; } else { S.tab = 'plan'; S.planSub = k; } window.scrollTo(0, 0); return render(); } if (k === 'notes') { S.tab = 'info'; S.infoSub = 'notes'; } else { S.tab = 'plan'; S.planSub = k; if (k === 'calendar') { S.calSel = today(); S.calMonth = null; } if (k === 'tasks') S.taskFilter = 'open'; } window.scrollTo(0, 0); render(); },
  'fab': () => {
    const sub = S.tab === 'plan' ? S.planSub : S.tab === 'info' ? S.infoSub : '';
    if (sub && sub.startsWith('c:')) return editCItem(null, sub.slice(2));
    if (S.tab === 'plan') { if (S.planSub === 'routines') return editRoutine(); if (S.planSub === 'tasks') return editTask(); if (S.planSub === 'calendar') return editEvent(null, S.calSel); return openQuick(['habit', 'goal']); }
    if (S.tab === 'info') return openQuick(['note', 'list', 'ink', 'tpl']);
    if (S.tab === 'money') return S.moneySub === 'regular' ? editReg() : S.moneySub === 'accounts' ? editAcct() : editTx(null, S.moneySub === 'moves' && S.mDir === 'in' ? { dir: 'in' } : null);
    openQuick();
  },
  'quick': el => { const k = el.dataset.k; ({ task: () => editTask(), event: () => editEvent(null, S.tab === 'plan' ? S.calSel : today()), note: () => openNote(), list: () => openNote(null, { kind: 'list' }), tpl: () => openTplPicker(), ink: () => openInk(), habit: () => editHabit(), goal: () => editGoal(), routine: () => editRoutine(), tx: () => editTx() })[k](); },
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
  'delete-task': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); Cal.upsertTask(it); toast('Görev silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); Cal.upsertTask(it); } }); },
  'task-filter': el => { S.taskFilter = el.dataset.k; render(); },
  'task-tagf': el => { S.taskTag = S.taskTag === el.dataset.id ? null : el.dataset.id; render(); },
  // takvim
  'cal-prev': () => shiftMonth(-1), 'cal-next': () => shiftMonth(1),
  'cal-today': () => { S.calSel = today(); S.calMonth = null; render(); },
  'cal-day': el => { S.calSel = el.dataset.d; S.calMonth = el.dataset.d.slice(0, 7); render(); },
  'add-event': () => editEvent(null, S.calSel),
  'edit-event': el => { const e = S.items.get(el.dataset.id); if (e) editEvent(e, el.dataset.d); },
  'save-event': () => saveEvent(),
  'cal-tasks': async el => { Cal.cfg.tasks = Cal.cfg.tasks === false; el.classList.toggle('on', Cal.cfg.tasks !== false); await Cal.saveCfg(); },
  'delete-event-occ': async () => { const it = S.items.get(S.draft.id); const day = S.draft._occ; if (!it || !day) return closeSheet(); it.exdates = (it.exdates || []).concat(day); closeSheet(); await save(it); toast(Lx('Bu günkü tekrar silindi', 'This occurrence was removed'), { label: tr('Geri al'), fn: async () => { it.exdates = (it.exdates || []).filter(x => x !== day); await save(it); } }); },
  'add-routine-day': () => { editRoutine(); if (S.draft) { S.draft.next = S.calSel; const n = $('#sheetRoot [name=next]'); if (n) n.value = S.calSel; } },
  'gev-edit': el => { const e = Cal.findEvent(el.dataset.gid); if (e) editEvent(null, null, e); },
  'delete-event': async () => {
    const d = S.draft;
    if (d && d.gid) {
      if (!ask('Bu etkinlik Google Takvim’den silinsin mi?')) return;
      if (!Drive.tokenOk(GCAL_SCOPE)) { try { await Drive.requestToken(); } catch (e) { return toast(e.message); } }
      try { await Cal.del(d.cal, d.gid); closeSheet(); await Cal.fetchMonth((S.calMonth || today().slice(0, 7))); render(); toast('Google Takvim’den silindi'); } catch (e) { toast(e.message); }
      return;
    }
    const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); toast('Etkinlik silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); },
  // alışkanlık & hedef
  'habit-toggle': el => toggleHabit(el.dataset.id, el.dataset.d),
  'new-habit': () => editHabit(), 'new-goal': () => editGoal(),
  'edit-habit': el => { const h = S.items.get(el.dataset.id); if (h) editHabit(h); },
  'save-habit': () => saveHabit(),
  'delete-habit': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); if (!ask('“' + it.title + '” ve tüm geçmişi silinsin mi?')) return; closeSheet(); await remove(it); },
  'edit-goal': el => { const g = S.items.get(el.dataset.id); if (g) editGoal(g); },
  'save-goal': () => saveGoal(),
  'delete-goal': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); toast('Hedef silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); },
  'goal-step': el => goalStep(el.dataset.id, +el.dataset.dir),
  // notlar
  'new-note': () => openNote(), 'new-ink': () => openInk(),
  'open-note': el => { const n = S.items.get(el.dataset.id); if (n) openNote(n); },
  'note-tagf': el => { S.noteTag = S.noteTag === el.dataset.id ? null : el.dataset.id; render(); },
  'note-pin': el => { const E = S.noteEd; if (!E) return; E.d.pinned = !E.d.pinned; el.classList.toggle('on', E.d.pinned); noteChanged(); },
  'note-delete': async () => { const E = S.noteEd; if (!E) return; if (!(typeof noteEmpty === 'function' ? noteEmpty(E.d) : !(E.d.title || E.d.body)) && !ask('Bu not silinsin mi?')) return; E.deleted = true; const it = S.items.get(E.d.id); closeSheet(); if (it) { await remove(it); toast('Not silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); } },
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
  'ink-delete': async () => { const E = S.ink; if (E.strokes.length && !ask('Bu kalem notu silinsin mi?')) return; E.deleted = true; const it = S.items.get(E.n.id); closeSheet(); if (it) await remove(it, { silent: true }); },
  // ayarlar
  'look': el => { const st = settings(); let v = el.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false; if (el.dataset.k === 'fs') v = Number(v); st[el.dataset.k] = v; thumbCache.clear(); saveSettings(); },
  'look-reset': () => { if (!ask('Görünüm varsayılana dönsün mü? (Verilerin etkilenmez)')) return; Object.assign(settings(), clone(LOOK_DEFAULTS)); thumbCache.clear(); saveSettings(); },
  'share-backup': () => shareBackup(),
  'snapshots': () => openSnapshots(),
  'snap-restore': el => restoreSnapshot(el.dataset.id),
  'set-paper': el => { settings().paper = el.dataset.k; saveSettings(); },
  'list-toggle': el => { const arr = settings()[el.dataset.list]; const m = arr[+el.dataset.i]; m.on = !m.on; saveSettings(); },
  'list-move': el => { const arr = settings()[el.dataset.list]; const i = +el.dataset.i, j = i + (+el.dataset.dir); if (j < 0 || j >= arr.length) return; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; saveSettings(); },
  'notes-toggle': () => { const st = settings(); st.notes = !st.notes; saveSettings(); },
  'gauto-toggle': () => { const st = settings(); st.gAuto = st.gAuto === false; saveSettings(); },
  'mailtab-toggle': () => { const st = settings(); st.mailTab = st.mailTab === false; saveSettings(); },
  'tools-toggle': () => { const st = settings(); st.tools = st.tools === false; saveSettings(); },
  'manage-tags': el => manageTags(el.dataset.scope),
  'tag-delete': async el => { const t = S.items.get(el.dataset.id); if (!t || !ask('“' + t.name + '” etiketi silinsin mi? (Notlar ve görevler silinmez)')) return; await remove(t, { silent: true }); manageTags(el.dataset.scope); },
  'sync-now': () => { if (!navigator.onLine) return toast('İnternet yok, bağlantı gelince eşitlenecek'); gSync(true); },
  'drive-open': () => openDrive(),
  'drive-connect': () => driveConnect(),
  'drive-now': () => { if (!navigator.onLine) return toast('İnternet yok, bağlantı gelince eşitlenecek'); gSync(true); },
  'drive-off': async () => { if (!ask('Bu cihazda Google Drive senkronu kapatılsın mı? Veriler cihazda ve Drive’da kalır.')) return; Drive.cfg.connected = false; Drive.token = null; Drive.exp = 0; lsSet('pusula.gtok', 'null'); await Drive.saveCfg(); Drive.setStatus('off'); openDrive(); },
  'copy-origin': async () => { try { await navigator.clipboard.writeText(location.origin); toast('Adres kopyalandı'); } catch (e) { toast(location.origin); } },
  'export': () => exportData(),
  'alerts': () => openAlerts(),
  'alert-go': el => { closeSheet(); setTimeout(() => ACTIONS.go(el), 0); },
  'alert-dismiss': el => { alertDismiss(el.dataset.id); const row = el.closest('.alert-item'); if (row) row.remove(); if (!$('#sheetRoot .alert-item')) openAlerts(); },
  'alert-settings': () => { closeSheet(); const a = accOpen().filter(x => x !== 'alerts'); a.push('alerts'); lsSet('pusula.acc', JSON.stringify(a)); S.prevTab = S.tab === 'settings' ? S.prevTab : S.tab; S.tab = 'settings'; setTimeout(() => { render(); const d = $('[data-acc=alerts]'); if (d) d.scrollIntoView({ block: 'start' }); }, 0); },
  'alert-toggle': el => { const st = settings(); st.alerts = st.alerts || {}; st.alerts[el.dataset.k] = st.alerts[el.dataset.k] === false; saveSettings(); },
  'banner-hide': () => { lsSet('pusula.bannerDay', today()); render(); },
  'new-routine': () => editRoutine(),
  'rt-edit': el => { const r = S.items.get(el.dataset.id); if (r) editRoutine(r); },
  'rt-done': el => routineDone(el.dataset.id),
  'rt-save': () => saveRoutine(),
  'rt-delete': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); if (!ask('“' + it.title + '” rutini silinsin mi?')) return; closeSheet(); if (it.gev && Cal.ready()) Cal.del(it.gev.cal, it.gev.id).catch(() => {}); await remove(it); },
  'cal-open': () => openCal(),
  'cal-connect': () => calConnect(),
  'cal-toggle': async el => { const c = Cal.calById(el.dataset.id); if (!c) return; c.on = !c.on; el.classList.toggle('on', c.on); await Cal.saveCfg(); Cal.fetched = {}; if (Cal.ready()) Cal.sync(); },
  'cal-routines': async el => { Cal.cfg.routines = Cal.cfg.routines === false; el.classList.toggle('on', Cal.cfg.routines !== false); await Cal.saveCfg(); },
  'cal-off': async () => { if (!ask('Bu cihazda Google Takvim bağlantısı kesilsin mi? Google Takvim’deki etkinliklerin silinmez.')) return; Cal.cfg.connected = false; Cal.byDate = {}; Cal.persist(); await Cal.saveCfg(); Cal.setStatus('off'); openCal(); },
  'titles-reset': () => { if (!ask('Tüm başlıklar varsayılana dönsün mü? (Kendi bölümlerinin adları değişmez)')) return; const st = settings(); st.titles = {}; st.ironicKeep = {}; st.titleStyle = 'classic'; saveSettings(); toast(tr('Başlıklar varsayılana döndü')); },
  'card-fold': el => { const k = el.dataset.k; let f = foldGet(); f = f.includes(k) ? f.filter(x => x !== k) : f.concat(k); lsSet('pusula.fold', JSON.stringify(f)); const sec = el.closest('.card'); if (sec) { sec.classList.toggle('folded', f.includes(k)); el.setAttribute('aria-expanded', !f.includes(k)); } },
  'title-pick': el => { const st = settings(); st.titles = st.titles || {}; const k = el.dataset.k; if (el.dataset.v) st.titles[k] = el.dataset.v; else { delete st.titles[k]; if (st.ironicKeep) delete st.ironicKeep[k]; } saveSettings(); },
  'citem-toggle': async el => { const i = S.items.get(el.dataset.id); if (!i) return; i.done = !i.done; i.doneAt = i.done ? Date.now() : null; await save(i); },
  'citem-step': async el => { const i = S.items.get(el.dataset.id); if (!i) return; i.value = r2((Number(i.value) || 0) + Number(el.dataset.dir)); i.at = Date.now(); await save(i); },
  'citem-edit': el => { const i = S.items.get(el.dataset.id); if (i) editCItem(i); },
  'citem-save': () => saveCItem(),
  'citem-delete': async () => { const it = S.items.get(S.draft.id); if (!it) return closeSheet(); closeSheet(); await remove(it); toast('Silindi', { label: 'Geri al', fn: async () => { it.deleted = false; await save(it); } }); },
  'citem-clear': async el => { const arr = list('citem').filter(i => i.mod === el.dataset.mod && i.done); for (const i of arr) await remove(i, { silent: true }); render(); toast(arr.length + ' madde temizlendi'); },
  'cmod-new': () => newModuleSheet(),
  'cmod-type': el => { $$('.opt', el.parentNode).forEach(b => b.classList.toggle('on', b === el)); S.draft.type = el.dataset.v; const u = $('#sheetRoot .unit-field'); if (u) u.classList.toggle('hide', el.dataset.v !== 'log'); },
  'cmod-save': () => saveModule(),
  'cmod-home': el => { const m = cmod(el.dataset.id); if (!m) return; m.home = m.home === 'info' ? 'plan' : 'info'; saveSettings(); },
  'cmod-del': async el => { const st = settings(); const m = cmod(el.dataset.id); if (!m) return; if (!ask('“' + m.name + '” bölümü ve içindeki her şey silinsin mi?')) return; st.custom = st.custom.filter(x => x.id !== m.id); st.today = st.today.filter(x => x.k !== 'c:' + m.id); for (const i of list('citem').filter(x => x.mod === m.id)) await remove(i, { silent: true }); saveSettings(); },
  'check-update': () => checkUpdate(),
  'wipe': async () => {
    if (!ask('Bu cihazdaki TÜM PUSULA verileri silinecek. Emin misin?')) return;
    if (!ask('Son kez soruyorum: geri alınamaz. Önce yedek aldın mı? Silmek için Tamam.')) return;
    await DB.wipe(); location.reload();
  }
};
function openQuick(only) {
  const st = settings(); const opts = [];
  if (planOn('tasks')) opts.push(['task', 'Görev', 'task']);
  if (planOn('calendar')) opts.push(['event', 'Etkinlik', 'event']);
  if (st.notes) { opts.push(['note', 'Not', 'note']); opts.push(['list', 'Liste', 'list']); opts.push(['ink', 'Kalem notu', 'pen']); opts.push(['tpl', 'Şablondan', 'template']); }
  if (planOn('routines')) opts.push(['routine', 'Tekrarlı iş', 'repeat']);
  if (typeof moneyOn === 'function' && moneyOn()) opts.push(['tx', 'Gelir / gider', 'wallet']);
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
  if (f.dataset.form === 'citem') {
    const m = cmod(f.dataset.mod); if (!m || !v) return;
    const it = { id: uid(), type: 'citem', mod: m.id, text: v };
    if (m.type === 'list') it.done = false;
    if (m.type === 'counter') it.value = 0;
    if (m.type === 'log') { it.date = today(); const n = parseFloat(f.n && f.n.value); it.amount = isNaN(n) ? null : n; }
    await save(it); const i = $('[data-form=citem] input[name=q]'); if (i) i.focus(); return;
  }
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
  if (el.dataset && el.dataset.titleKey) { const st = settings(); st.titles = st.titles || {}; const v = el.value.trim(); if (v) st.titles[el.dataset.titleKey] = v; else delete st.titles[el.dataset.titleKey]; saveSettings(); return; }
  if (el.dataset && el.dataset.cmodName) { const m = cmod(el.dataset.cmodName); const v = el.value.trim(); if (m && v) { m.name = v; saveSettings(); } return; }
  if (el.id === 'calDef') { Cal.cfg.def = el.value; Cal.saveCfg(); return; }
  if (el.name === 'evRep') { const v = el.value; const c = $('#sheetRoot .ev-custom'), u = $('#sheetRoot .ev-until'); if (c) c.classList.toggle('hide', v !== 'custom'); if (u) u.classList.toggle('hide', v === 'none'); return; }
  if (el.name === 'recUnit') { const u = el.value; const w = $('#sheetRoot .rec-week'), m = $('#sheetRoot .rec-month'); if (w) w.classList.toggle('hide', u !== 'week'); if (m) m.classList.toggle('hide', u !== 'month'); return; }
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
document.addEventListener('toggle', e => { const d = e.target; if (!d.dataset || !d.dataset.acc) return; const a = accOpen().filter(x => x !== d.dataset.acc); if (d.open) a.push(d.dataset.acc); lsSet('pusula.acc', JSON.stringify(a)); }, true);
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
  startTranslator();
  await Drive.load();
  await Cal.load();
  if (typeof Mail !== 'undefined') await Mail.load();
  DB.delMeta('sync').catch(() => {});
  render();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  registerSW();
  setTimeout(() => autoSnapshot(), 3000);
  backupReminder();
  window.addEventListener('online', () => gSync(false));
  window.addEventListener('offline', () => Drive.on() && Drive.setStatus('offline'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') { if (S.ink) inkPersist(); if (S.noteEd) noteSave(); return; }
    gSync(false);
    if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {});
    if (S.lastDay !== today()) { autoSnapshot(); S.lastDay = today(); S.calSel = today(); S.calMonth = null; if (!S.ink && !S.noteEd) render(); }
  });
  setInterval(() => { if (document.visibilityState === 'visible') gSync(false); }, 180000);
  if (Drive.on() || Cal.on() || (typeof Mail !== 'undefined' && Mail.on())) { if (navigator.onLine) Drive.loadGis().catch(() => {}); gSync(false); }
  if (typeof handleLaunch === 'function') handleLaunch(); // ana ekran kısayolları (?go=...)
  if (window.matchMedia) { const mq = matchMedia('(prefers-color-scheme: light)'); const fn = () => { if (settings().theme === 'system') { thumbCache.clear(); render(); } }; if (mq.addEventListener) mq.addEventListener('change', fn); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
