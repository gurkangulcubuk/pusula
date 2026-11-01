'use strict';
/* PUSULA 1.21 — Kalem notu (tablet kalemi).
   Netlik: her sayfa ayrı tuval (sayfa sayısı arttıkça çözünürlük düşmez), çizgiler basınca duyarlı yumuşak dış hatla
   çizilir (perfect-freehand), çizilen çizgi ayrı bir katmanda canlı gösterilir.
   Dışa aktar / paylaş: PDF (tüm sayfalar) ya da resim. İçe aktar: resim ya da PDF sayfaları arka plan olur (üstüne yazılır).
   Arka plan resimleri 'inkbg' kaydı olarak eşitlenir. Kâğıt rengi notun rengidir (n.color). */
const INK_W = 1000, INK_PAGE = 1414;
const INK_COLORS = ['auto', '#E57B70', '#E2B54E', '#6CC08F', '#5EAECB', '#B39AE6'];
const INK_WIDTHS = [1.6, 3, 5.5];
const PAPERS = ['blank', 'lines', 'grid'];
const PAPER_LABELS = { blank: 'Boş kâğıt', lines: 'Çizgili kâğıt', grid: 'Kareli kâğıt' };
const thumbCache = new Map();
Object.assign(ICONS, {
  share: ICONS.share || '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  upload2: ICONS.upload2 || '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>'
});
function inkColor(c, print) { if (c && c !== 'auto') return c; return print ? '#1d1d1f' : currentPalette().c[3]; }

/* ----- çizgi çizimi ----- */
const pathCache = new WeakMap();
const realPressure = s => s.pr !== undefined ? s.pr : (() => { const p = s.pts; for (let i = 2; i < p.length; i += 3) if (p[i] !== 0.5) return true; return false; })();
function strokeOpts(s, last) {
  return s.t === 'm' ? { size: s.w * 4.5, thinning: 0, smoothing: 0.5, streamline: 0.35, simulatePressure: false, last }
    : { size: s.w * 1.9, thinning: realPressure(s) ? 0.62 : 0.45, smoothing: 0.62, streamline: 0.42, simulatePressure: !realPressure(s), easing: t => t, start: { taper: 0, cap: true }, end: { taper: 0, cap: true }, last };
}
function svgPath(pts) {
  const n = pts.length; if (!n) return '';
  if (n < 4) return 'M' + pts.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('L') + 'Z';
  let d = 'M' + pts[0][0].toFixed(2) + ',' + pts[0][1].toFixed(2) + 'Q';
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; d += a[0].toFixed(2) + ',' + a[1].toFixed(2) + ' ' + ((a[0] + b[0]) / 2).toFixed(2) + ',' + ((a[1] + b[1]) / 2).toFixed(2) + ' '; }
  return d + 'Z';
}
function strokePath(s, live) {
  if (!live) { const c = pathCache.get(s); if (c && c.n === s.pts.length) return c.p; }
  const p = s.pts, inp = []; for (let i = 0; i < p.length; i += 3) inp.push([p[i], p[i + 1], p[i + 2]]);
  const path = new Path2D(svgPath(window.PF.getStroke(inp, strokeOpts(s, !live))));
  if (!live) pathCache.set(s, { n: s.pts.length, p: path });
  return path;
}
function drawStroke(ctx, s, print) {
  if (!s.pts.length) return;
  ctx.save(); ctx.fillStyle = inkColor(s.c, print); if (s.t === 'm') ctx.globalAlpha = 0.32;
  ctx.fill(strokePath(s)); ctx.restore();
}
function strokeBox(s) { // y aralığı (sayfa eşlemesi için)
  if (s._b && s._b.n === s.pts.length) return s._b;
  let a = Infinity, b = -Infinity; for (let i = 1; i < s.pts.length; i += 3) { if (s.pts[i] < a) a = s.pts[i]; if (s.pts[i] > b) b = s.pts[i]; }
  const pad = s.w * 4; Object.defineProperty(s, '_b', { value: { y0: a - pad, y1: b + pad, n: s.pts.length }, writable: true, configurable: true, enumerable: false });
  return s._b;
}

/* ----- arka plan resimleri (içe aktarılan resim / PDF sayfası) ----- */
const bgImgs = new Map();
function bgImage(id) {
  if (bgImgs.has(id)) return bgImgs.get(id);
  const it = S.items.get(id); if (!it || it.deleted || !it.data) return null;
  const img = new Image(); const p = new Promise(res => { img.onload = () => res(img); img.onerror = () => res(null); }); img.src = it.data;
  const rec = { img, p, ok: false }; p.then(x => { rec.ok = !!x; }); bgImgs.set(id, rec); return rec;
}
const pageBg = (n, i) => ((n.bgs || []).find(b => b.page === i) || {}).id;
function drawBg(ctx, n, i, W, H) {
  const id = pageBg(n, i); if (!id) return; const r = bgImage(id); if (!r) return;
  if (!r.ok) { r.p.then(() => { if (S.ink && S.ink.n === n) inkRedrawPage(i); thumbCache.delete(n.id); }); return; }
  const im = r.img, k = Math.min(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
  ctx.drawImage(im, (W - w) / 2, 0, w, h);
}

/* ----- küçük resim (not listesi) ----- */
function inkThumb(n) {
  const theme = document.documentElement.dataset.theme;
  const key = n.updated + ':' + theme + ':' + currentPalette().c[0]; const hit = thumbCache.get(n.id);
  if (hit && hit.key === key) return hit.url;
  const W = 360, H = 224; const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  ctx.fillStyle = n.color ? 'color-mix(in srgb,' + n.color + ' 22%,' + (getComputedStyle(document.documentElement).getPropertyValue('--surface2').trim() || '#1B2832') + ')' : (getComputedStyle(document.documentElement).getPropertyValue('--surface2').trim() || '#1B2832');
  try { ctx.fillRect(0, 0, W, H); } catch (e) { ctx.fillStyle = '#1B2832'; ctx.fillRect(0, 0, W, H); }
  const strokes = n.strokes || []; const sc = W / INK_W;
  let minY = Infinity; strokes.forEach(s => { const b = strokeBox(s); if (b.y0 < minY) minY = b.y0; });
  const offY = isFinite(minY) ? Math.max(0, minY - 40) : 0;
  if (pageBg(n, 0) && offY < INK_PAGE) { ctx.save(); ctx.setTransform(sc, 0, 0, sc, 0, -offY * sc); drawBg(ctx, n, 0, INK_W, INK_PAGE); ctx.restore(); }
  ctx.setTransform(sc, 0, 0, sc, 0, -offY * sc);
  strokes.forEach(s => drawStroke(ctx, s));
  const url = c.toDataURL('image/png'); thumbCache.set(n.id, { key, url }); return url;
}

/* ----- düzenleyici ----- */
const fingerDraws = () => { const E = S.ink; return E.finger === 'draw' || (E.finger === 'auto' && !E.penSeen); };
function openInk(note) {
  const isNew = !note;
  const n = note || { id: uid(), type: 'note', kind: 'ink', title: '', strokes: [], pages: 1, paper: settings().paper || 'lines', tags: [], pinned: false, color: '', bgs: [] };
  S.ink = { n, saved: !isNew, deleted: false, strokes: (n.strokes || []).slice(), pages: n.pages || 1, paper: n.paper || 'lines', color: 'auto', tool: 'pen', wi: 0, undo: [], redo: [], finger: lsGet('pusula.finger', 'auto'), penSeen: lsGet('pusula.penSeen', '') === '1', changed: false, active: null, scrollDrag: null, cur: null, menu: false, colors: false };
  openSheet('<div class="ed-top"><button class="icon-btn" data-act="close-sheet" aria-label="Kaydet ve kapat">' + icon('back') + '</button><input class="ink-title" id="inkTitle" placeholder="Başlıksız kalem notu" value="' + esc(n.title) + '" autocomplete="off">' +
    '<button class="icon-btn" data-act="ink-share" aria-label="Paylaş">' + icon('share') + '</button><button class="icon-btn" data-act="ink-menu" aria-label="İçe / dışa aktar">' + icon('dots') + '</button>' +
    '<button class="icon-btn ' + (n.pinned ? 'on' : '') + '" data-act="ink-pin" aria-label="Sabitle">' + icon('pin') + '</button><button class="icon-btn" data-act="ink-delete" aria-label="Sil">' + icon('trash') + '</button></div>' +
    '<div class="ink-menu hide" id="inkMenu"><button class="btn sm-btn" data-act="ink-export" data-k="pdf-share">' + icon('share', 'sm') + ' <span>PDF paylaş</span></button><button class="btn sm-btn" data-act="ink-export" data-k="pdf">' + icon('download', 'sm') + ' <span>PDF indir</span></button>' +
    '<button class="btn sm-btn" data-act="ink-export" data-k="png-share">' + icon('share', 'sm') + ' <span>Resim olarak paylaş</span></button><label class="btn sm-btn file-btn">' + icon('upload2', 'sm') + ' <span>Resim / PDF içe aktar</span><input type="file" id="inkImport" accept="image/*,application/pdf" multiple hidden></label></div>' +
    '<div class="ink-bar" id="inkBar">' + inkBarHtml() + '</div><div class="ink-colors hide" id="inkColors">' + NOTE_COLORS.map(c => '<button class="swatch ' + ((n.color || '') === c ? 'on' : '') + '" data-act="ink-papercolor" data-c="' + c + '" style="background:' + (c || 'var(--surface)') + '" aria-label="Kâğıt rengi"></button>').join('') + '</div>' +
    '<div class="ink-scroll" id="inkScroll"><div class="ink-paper" id="inkPaper"></div><div class="ink-more"><button class="btn" data-act="ink-add-page">' + icon('plus') + ' Sayfa ekle</button></div></div>',
    { full: true, onClose: inkFinish });
  requestAnimationFrame(() => { inkLayout(); inkBind(); });
}
function inkBarHtml() {
  const E = S.ink;
  return [['pen', 'Kalem'], ['marker', 'Fosforlu kalem'], ['eraser', 'Silgi']].map(x => '<button class="icon-btn ' + (E.tool === x[0] ? 'on' : '') + '" data-act="ink-tool" data-k="' + x[0] + '" aria-label="' + x[1] + '">' + icon(x[0]) + '</button>').join('') +
    '<span class="sep"></span>' + INK_COLORS.map(c => '<button class="swatch ' + (E.color === c ? 'on' : '') + '" style="background:' + (c === 'auto' ? 'var(--text)' : c) + '" data-act="ink-color" data-c="' + c + '" aria-label="Renk"></button>').join('') +
    '<span class="sep"></span>' + INK_WIDTHS.map((w, i) => '<button class="wbtn ' + (E.wi === i ? 'on' : '') + '" data-act="ink-width" data-i="' + i + '" aria-label="Kalınlık"><i style="width:' + (4 + i * 4) + 'px;height:' + (4 + i * 4) + 'px"></i></button>').join('') +
    '<span class="sep"></span><button class="icon-btn" data-act="ink-undo" aria-label="Geri al" ' + (E.undo.length ? '' : 'disabled') + '>' + icon('undo') + '</button><button class="icon-btn" data-act="ink-redo" aria-label="Yinele" ' + (E.redo.length ? '' : 'disabled') + '>' + icon('redo') + '</button>' +
    '<span class="sep"></span><button class="icon-btn" data-act="ink-paper" aria-label="Kâğıt türü">' + icon('paper') + '</button><button class="icon-btn ' + (E.n.color ? 'on' : '') + '" data-act="ink-colors" aria-label="Kâğıt rengi"' + (E.n.color ? ' style="color:' + E.n.color + '"' : '') + '>' + icon('palette') + '</button><button class="icon-btn ' + (fingerDraws() ? 'on' : '') + '" data-act="ink-finger" aria-label="Parmakla çizim">' + icon('hand') + '</button>';
}
const inkBarRefresh = () => { const b = $('#inkBar'); if (b && S.ink) { const sl = b.scrollLeft; b.innerHTML = inkBarHtml(); b.scrollLeft = sl; } };
function inkLayout() {
  const E = S.ink; if (!E) return; const paper = $('#inkPaper'); if (!paper) return;
  const w = paper.clientWidth; if (!w) return;
  const s = w / INK_W, ph = Math.round(INK_PAGE * s), dpr = Math.min(window.devicePixelRatio || 1, 3);
  E.scale = s; E.dpr = dpr; E.ph = ph;
  let h = ''; for (let i = 0; i < E.pages; i++) h += '<div class="ink-page" data-p="' + i + '" style="height:' + ph + 'px"><canvas class="ink-cv" width="' + Math.round(w * dpr) + '" height="' + Math.round(ph * dpr) + '" style="width:' + w + 'px;height:' + ph + 'px"></canvas></div>';
  paper.innerHTML = h + '<canvas id="inkLive" class="ink-live"></canvas>';
  E.ctxs = $$('#inkPaper .ink-cv').map((c, i) => { const ctx = c.getContext('2d'); ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, -i * INK_PAGE * dpr * s); return ctx; });
  paperBg(); inkRedraw();
}
function paperBg() {
  const E = S.ink; if (!E || !E.scale) return; const g = 50 * E.scale; const col = E.n.color;
  const bg = col ? 'color-mix(in srgb,' + col + ' 16%, var(--surface))' : 'var(--surface)';
  const parts = [], sizes = [];
  if (E.paper === 'lines' || E.paper === 'grid') { parts.push('linear-gradient(to bottom, transparent ' + (g - 1) + 'px, var(--line) ' + (g - 1) + 'px)'); sizes.push('100% ' + g + 'px'); }
  if (E.paper === 'grid') { parts.push('linear-gradient(to right, transparent ' + (g - 1) + 'px, var(--line) ' + (g - 1) + 'px)'); sizes.push(g + 'px 100%'); }
  $$('#inkPaper .ink-page').forEach(p => { p.style.backgroundColor = bg; p.style.backgroundImage = parts.join(',') || 'none'; p.style.backgroundSize = sizes.join(','); });
}
function inkRedrawPage(i) {
  const E = S.ink; if (!E || !E.ctxs || !E.ctxs[i]) return; const ctx = E.ctxs[i];
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  if (pageBg(E.n, i)) { ctx.save(); ctx.translate(0, i * INK_PAGE); drawBg(ctx, E.n, i, INK_W, INK_PAGE); ctx.restore(); }
  const y0 = i * INK_PAGE, y1 = y0 + INK_PAGE;
  E.strokes.forEach(s => { const b = strokeBox(s); if (b.y1 >= y0 && b.y0 <= y1) drawStroke(ctx, s); });
}
function inkRedraw() { const E = S.ink; if (!E || !E.ctxs) return; for (let i = 0; i < E.ctxs.length; i++) inkRedrawPage(i); }
function inkRedrawFor(s) { const b = strokeBox(s); const a = Math.max(0, Math.floor(b.y0 / INK_PAGE)), z = Math.min(S.ink.pages - 1, Math.floor(b.y1 / INK_PAGE)); for (let i = a; i <= z; i++) inkRedrawPage(i); }
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; const l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); }
function hitStroke(s, x, y, r) {
  const p = s.pts; const n = p.length / 3; const rr = r + (s.t === 'm' ? s.w * 2.25 : s.w);
  if (n === 1) return Math.hypot(p[0] - x, p[1] - y) < rr;
  for (let i = 1; i < n; i++) if (segDist(x, y, p[(i - 1) * 3], p[(i - 1) * 3 + 1], p[i * 3], p[i * 3 + 1]) < rr) return true;
  return false;
}
function inkErase(x, y) {
  const E = S.ink; const pages = new Set();
  for (let i = E.strokes.length - 1; i >= 0; i--) if (hitStroke(E.strokes[i], x, y, 14)) { const b = strokeBox(E.strokes[i]); for (let p = Math.floor(b.y0 / INK_PAGE); p <= Math.floor(b.y1 / INK_PAGE); p++) pages.add(p); E.strokes.splice(i, 1); }
  if (pages.size) { E.erased = true; pages.forEach(p => inkRedrawPage(p)); }
}
function pushUndo(prev) { const E = S.ink; E.undo.push(prev); if (E.undo.length > 60) E.undo.shift(); E.redo = []; inkBarRefresh(); }
function inkChanged() { const E = S.ink; if (!E) return; E.changed = true; clearTimeout(E.saveT); E.saveT = setTimeout(inkPersist, 1500); }
function inkPersist() {
  const E = S.ink; if (!E || E.deleted) return;
  const t = $('#inkTitle'); if (t) E.n.title = t.value.trim();
  if (!E.saved && !E.strokes.length && !E.n.title && !(E.n.bgs || []).length) return;
  Object.assign(E.n, { strokes: E.strokes, pages: E.pages, paper: E.paper });
  E.saved = true; E.changed = false; save(E.n, { silent: true });
}
function inkFinish() {
  const E = S.ink; if (!E) return; clearTimeout(E.saveT);
  if (!E.deleted) {
    const t = $('#inkTitle'); if (t && t.value.trim() !== (E.n.title || '')) E.changed = true;
    if (E.changed) inkPersist();
    if (E.saved && !E.strokes.length && !E.n.title && !(E.n.bgs || []).length) { E.n.deleted = true; save(E.n, { silent: true }); }
  }
  S.ink = null; setTimeout(render, 0);
}
/* canlı çizgi: başladığı sayfanın üstündeki katmanda her karede yeniden çizilir, bitince sayfaya işlenir */
function liveSetup(page) {
  const E = S.ink, lc = $('#inkLive'); if (!lc) return;
  const pg = $('#inkPaper .ink-page[data-p="' + page + '"]'); if (!pg) return;
  const w = pg.clientWidth, h = pg.clientHeight;
  lc.style.top = pg.offsetTop + 'px'; lc.style.width = w + 'px'; lc.style.height = h + 'px';
  if (lc.width !== Math.round(w * E.dpr)) lc.width = Math.round(w * E.dpr); if (lc.height !== Math.round(h * E.dpr)) lc.height = Math.round(h * E.dpr);
  E.live = lc.getContext('2d'); E.livePage = page; E.live.setTransform(E.dpr * E.scale, 0, 0, E.dpr * E.scale, 0, -page * INK_PAGE * E.dpr * E.scale);
}
function liveDraw() {
  const E = S.ink; if (!E || !E.live || !E.cur) return; const ctx = E.live;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  ctx.save(); ctx.fillStyle = inkColor(E.cur.c); if (E.cur.t === 'm') ctx.globalAlpha = 0.32; ctx.fill(strokePath(E.cur, true)); ctx.restore();
}
function liveClear() { const E = S.ink; if (E && E.live) { const c = E.live.canvas; E.live.save(); E.live.setTransform(1, 0, 0, 1, 0, 0); E.live.clearRect(0, 0, c.width, c.height); E.live.restore(); } }
function inkBind() {
  const E = S.ink; const paper = $('#inkPaper'); const sc = $('#inkScroll'); if (!E || !paper) return;
  const pos = e => { const r = paper.getBoundingClientRect(); return [(e.clientX - r.left) / E.scale, (e.clientY - r.top) / E.scale]; };
  const pr = e => e.pointerType === 'pen' ? Math.max(0.05, Math.min(1, e.pressure || 0.5)) : 0.5;
  paper.addEventListener('pointerdown', e => {
    if (!e.target.closest('.ink-page')) return;
    if (e.pointerType === 'pen' && !E.penSeen) { E.penSeen = true; lsSet('pusula.penSeen', '1'); inkBarRefresh(); }
    if (E.active || E.scrollDrag) return;
    if (e.pointerType === 'touch' && !fingerDraws()) { E.scrollDrag = { id: e.pointerId, y: e.clientY, top: sc.scrollTop }; paper.setPointerCapture(e.pointerId); return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); paper.setPointerCapture(e.pointerId); if (E.menu) inkMenu(false);
    const eraser = E.tool === 'eraser' || (e.pointerType === 'pen' && (e.buttons & 34));
    E.active = { id: e.pointerId, mode: eraser ? 'erase' : 'draw' };
    const xy = pos(e);
    if (eraser) { E.eraseSnap = E.strokes.slice(); E.erased = false; inkErase(xy[0], xy[1]); }
    else { E.cur = { t: E.tool === 'marker' ? 'm' : 'p', c: E.color, w: INK_WIDTHS[E.wi], pr: e.pointerType === 'pen', pts: [r1(xy[0]), r1(xy[1]), r2(pr(e))] }; liveSetup(Math.max(0, Math.min(E.pages - 1, Math.floor(xy[1] / INK_PAGE)))); liveDraw(); }
  });
  paper.addEventListener('pointermove', e => {
    if (E.scrollDrag && e.pointerId === E.scrollDrag.id) { sc.scrollTop = E.scrollDrag.top - (e.clientY - E.scrollDrag.y); return; }
    if (!E.active || e.pointerId !== E.active.id) return;
    let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; if (!evs.length) evs = [e];
    if (E.active.mode === 'erase') { evs.forEach(ev => { const xy = pos(ev); inkErase(xy[0], xy[1]); }); return; }
    const p = E.cur.pts;
    evs.forEach(ev => { const xy = pos(ev); const lx = p[p.length - 3], ly = p[p.length - 2]; if ((xy[0] - lx) * (xy[0] - lx) + (xy[1] - ly) * (xy[1] - ly) < 0.5) return; p.push(r1(xy[0]), r1(xy[1]), r2(pr(ev))); });
    if (!E.raf) E.raf = requestAnimationFrame(() => { E.raf = 0; liveDraw(); });
  });
  const end = e => {
    if (E.scrollDrag && e.pointerId === E.scrollDrag.id) { E.scrollDrag = null; return; }
    if (!E.active || e.pointerId !== E.active.id) return;
    const mode = E.active.mode; E.active = null;
    if (mode === 'erase') { if (E.erased) { pushUndo(E.eraseSnap); inkChanged(); } return; }
    const st = E.cur; E.cur = null; if (E.raf) { cancelAnimationFrame(E.raf); E.raf = 0; } if (!st) return;
    pushUndo(E.strokes.slice()); E.strokes.push(st);
    const b = strokeBox(st);
    if (b.y1 > E.pages * INK_PAGE - 120) { E.pages++; liveClear(); inkLayout(); }
    else { inkRedrawFor(st); liveClear(); }
    inkChanged();
  };
  paper.addEventListener('pointerup', end); paper.addEventListener('pointercancel', end);
  paper.addEventListener('contextmenu', e => e.preventDefault());
}
function inkMenu(on) { const E = S.ink; if (!E) return; E.menu = on === undefined ? !E.menu : on; const m = $('#inkMenu'); if (m) m.classList.toggle('hide', !E.menu); }

/* ----- dışa aktarma: PDF (kütüphanesiz, sayfa başına JPEG) ve resim ----- */
const EXP_W = 1240, EXP_H = Math.round(EXP_W * INK_PAGE / INK_W); // A4, ~150 dpi
function inkRenderPage(n, strokes, i, paper) {
  const c = document.createElement('canvas'); c.width = EXP_W; c.height = EXP_H; const ctx = c.getContext('2d'); const k = EXP_W / INK_W;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, EXP_W, EXP_H);
  if (n.color) { ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = n.color; ctx.fillRect(0, 0, EXP_W, EXP_H); ctx.restore(); }
  ctx.setTransform(k, 0, 0, k, 0, 0);
  if (paper === 'lines' || paper === 'grid') { ctx.strokeStyle = '#d6d9de'; ctx.lineWidth = 1; for (let y = 50; y < INK_PAGE; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(INK_W, y); ctx.stroke(); } if (paper === 'grid') for (let x = 50; x < INK_W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, INK_PAGE); ctx.stroke(); } }
  drawBg(ctx, n, i, INK_W, INK_PAGE);
  ctx.translate(0, -i * INK_PAGE);
  const y0 = i * INK_PAGE, y1 = y0 + INK_PAGE;
  strokes.forEach(s => { const b = strokeBox(s); if (b.y1 >= y0 && b.y0 <= y1) drawStroke(ctx, s, true); });
  return c;
}
async function bgReady(n) { await Promise.all((n.bgs || []).map(b => { const r = bgImage(b.id); return r ? r.p : null; })); }
function pdfFromJpegs(pages) { // pages: [{bytes: Uint8Array, w, h}] → PDF Blob (A4)
  const enc = s => new TextEncoder().encode(s); const parts = []; const offs = []; let len = 0;
  const add = b => { parts.push(b); len += b.length; };
  const obj = (id, body) => { offs[id] = len; add(enc(id + ' 0 obj\n')); body.forEach(add); add(enc('\nendobj\n')); };
  const PW = 595.28, PH = 841.89, N = pages.length; // A4 punto
  add(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
  obj(1, [enc('<< /Type /Catalog /Pages 2 0 R >>')]);
  obj(2, [enc('<< /Type /Pages /Count ' + N + ' /Kids [' + pages.map((_, i) => (3 + i * 3) + ' 0 R').join(' ') + '] >>')]);
  pages.forEach((p, i) => {
    const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2; const cs = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im0 Do Q';
    obj(pid, [enc('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + iid + ' 0 R >> >> /Contents ' + cid + ' 0 R >>')]);
    obj(cid, [enc('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream')]);
    obj(iid, [enc('<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.bytes.length + ' >>\nstream\n'), p.bytes, enc('\nendstream')]);
  });
  const xref = len, total = 3 + N * 3;
  let x = 'xref\n0 ' + total + '\n0000000000 65535 f \n'; for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  add(enc(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF'));
  return new Blob(parts, { type: 'application/pdf' });
}
const canvasBlob = (c, type, q) => new Promise(res => c.toBlob(res, type, q));
async function inkExport(kind) {
  const E = S.ink; if (!E) return; inkPersist(); inkMenu(false);
  const n = E.n, strokes = E.strokes, name = (n.title || tr('Kalem notu')).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'not';
  // boş sondaki sayfaları atla
  let last = 0; strokes.forEach(s => { last = Math.max(last, Math.floor(strokeBox(s).y1 / INK_PAGE)); }); (n.bgs || []).forEach(b => { last = Math.max(last, b.page); });
  const count = Math.min(E.pages, last + 1);
  toast(tr('Hazırlanıyor…')); await bgReady(n);
  let files = [];
  if (kind.startsWith('pdf')) {
    const pages = [];
    for (let i = 0; i < count; i++) { const c = inkRenderPage(n, strokes, i, E.paper); pages.push({ bytes: new Uint8Array(await (await canvasBlob(c, 'image/jpeg', 0.9)).arrayBuffer()), w: c.width, h: c.height }); }
    files = [new File([pdfFromJpegs(pages)], name + '.pdf', { type: 'application/pdf' })];
  } else {
    for (let i = 0; i < count; i++) { const c = inkRenderPage(n, strokes, i, E.paper); files.push(new File([await canvasBlob(c, 'image/png')], name + (count > 1 ? '-' + (i + 1) : '') + '.png', { type: 'image/png' })); }
  }
  if (kind.endsWith('share')) {
    try { if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files, title: name }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    toast(tr('Paylaşım desteklenmiyor; dosya indiriliyor'));
  }
  files.forEach((f, i) => setTimeout(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, i * 400));
  toast(Lx(files.length > 1 ? files.length + ' dosya indirildi' : 'İndirildi', files.length > 1 ? files.length + ' files downloaded' : 'Downloaded'));
}

/* ----- içe aktarma: resim ya da PDF sayfaları arka plan olarak (üstüne yazılır) ----- */
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; res(); }; s.onerror = () => rej(new Error(tr('PDF okuyucu yüklenemedi; internet gerekli. Resimler internetsiz de çalışır.'))); document.head.appendChild(s); });
}
const BG_W = 1400;
async function imgToJpeg(src) { // src: Blob ya da canvas → küçültülmüş JPEG dataURL
  let c = src;
  if (!(src instanceof HTMLCanvasElement)) { const bmp = await createImageBitmap(src); c = document.createElement('canvas'); const k = Math.min(1, BG_W / bmp.width); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); }
  return c.toDataURL('image/jpeg', 0.78);
}
async function inkImport(files) {
  const E = S.ink; if (!E || !files.length) return; inkMenu(false);
  const datas = [];
  try {
    for (const f of files) {
      if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
        toast(tr('PDF okunuyor…')); await loadPdfJs();
        const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        for (let p = 1; p <= Math.min(pdf.numPages, 30); p++) { const pg = await pdf.getPage(p); const vp0 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: BG_W / vp0.width }); const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height); const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: ctx, viewport: vp }).promise; datas.push(await imgToJpeg(c)); }
        if (pdf.numPages > 30) toast(tr('İlk 30 sayfa alındı'));
      } else if (/^image\//.test(f.type)) datas.push(await imgToJpeg(f));
    }
  } catch (e) { return toast(e.message || tr('Dosya okunamadı')); }
  if (!datas.length) return toast(tr('Resim ya da PDF seç'));
  pushUndo(E.strokes.slice());
  // ilk boş sayfadan başla (yazı ya da arka plan olmayan), yoksa sona ekle
  const used = new Set((E.n.bgs || []).map(b => b.page)); E.strokes.forEach(s => { const b = strokeBox(s); for (let p = Math.floor(b.y0 / INK_PAGE); p <= Math.floor(b.y1 / INK_PAGE); p++) used.add(p); });
  let page = 0; while (used.has(page)) page++;
  E.n.bgs = (E.n.bgs || []).slice();
  for (const d of datas) { const id = 'bg' + uid(); await save({ id, type: 'inkbg', note: E.n.id, data: d }, { silent: true }); E.n.bgs.push({ page, id }); page++; }
  E.pages = Math.max(E.pages, page); E.changed = true; inkPersist(); inkLayout(); thumbCache.delete(E.n.id);
  toast(Lx(datas.length + ' sayfa eklendi; üstüne yazabilirsin', datas.length + ' pages added; write on top'));
}
document.addEventListener('change', e => { if (e.target.id === 'inkImport' && e.target.files) { inkImport([...e.target.files]); e.target.value = ''; } });
// sahipsiz arka plan resimlerini temizle (not silinmişse)
setTimeout(() => { list('inkbg').forEach(b => { const n = S.items.get(b.note); if (!n || n.deleted || !(n.bgs || []).some(x => x.id === b.id)) remove(b, { silent: true }); }); }, 15000);

Object.assign(ACTIONS, {
  'ink-menu': () => inkMenu(),
  'ink-share': () => inkExport('pdf-share'),
  'ink-export': el => inkExport(el.dataset.k),
  'ink-colors': () => { const E = S.ink; E.colors = !E.colors; const c = $('#inkColors'); if (c) c.classList.toggle('hide', !E.colors); },
  'ink-papercolor': el => { const E = S.ink; E.n.color = el.dataset.c; $$('#inkColors .swatch').forEach(b => b.classList.toggle('on', b === el)); paperBg(); inkBarRefresh(); inkChanged(); thumbCache.delete(E.n.id); }
});
(function () {
  const add = { 'PDF paylaş': 'Share PDF', 'PDF indir': 'Download PDF', 'Resim olarak paylaş': 'Share as image', 'Resim / PDF içe aktar': 'Import image / PDF', 'Kâğıt rengi': 'Paper color', 'Hazırlanıyor…': 'Preparing…', 'Paylaşım desteklenmiyor; dosya indiriliyor': 'Sharing not supported; downloading',
    'PDF okuyucu yüklenemedi; internet gerekli. Resimler internetsiz de çalışır.': 'Could not load the PDF reader; internet needed. Images work offline.', 'PDF okunuyor…': 'Reading PDF…', 'İlk 30 sayfa alındı': 'First 30 pages imported', 'Dosya okunamadı': 'Could not read the file', 'Resim ya da PDF seç': 'Pick an image or PDF', 'Kalem notu': 'Ink note', 'İçe / dışa aktar': 'Import / export' };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
