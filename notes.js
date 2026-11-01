'use strict';
/* PUSULA — Notlar 1.12: Yazı / Liste / Kalem türleri, renkler, sıralama ve şablonlar.
   Not: { kind: 'text' | 'list' | 'ink', title, body, items: [{ id, t, done }], color, pinned, tags } */
Object.assign(ICONS, {
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><rect x="3.5" y="4.5" width="3" height="3" rx=".8"/><rect x="3.5" y="10.5" width="3" height="3" rx=".8"/><rect x="3.5" y="16.5" width="3" height="3" rx=".8"/>',
  template: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.9-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>',
  sort: '<path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3"/>',
  dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'
});
const NOTE_COLORS = ['', '#E5484D', '#F5A524', '#30A46C', '#12A594', '#3E63DD', '#8E4EC6', '#D6409F'];
const NOTE_KINDS = { text: ['Yazı', 'note'], list: ['Liste', 'list'], ink: ['Kalem', 'pen'] };
const nid = () => Math.random().toString(36).slice(2, 9);

/* ----- Şablonlar ----- */
const TPL_BASE = [
  { id: 'shop', kind: 'list', name: ['Alışveriş listesi', 'Shopping list'], title: ['Alışveriş', 'Shopping'], items: [['Süt', 'Ekmek', 'Yumurta', 'Meyve', 'Sebze', 'Peynir', 'Su'], ['Milk', 'Bread', 'Eggs', 'Fruit', 'Vegetables', 'Cheese', 'Water']] },
  { id: 'trip', kind: 'list', name: ['Valiz / seyahat', 'Packing list'], title: ['Valiz', 'Packing'], items: [['Kimlik / pasaport', 'Telefon şarjı', 'Powerbank', 'Kulaklık', 'Diş fırçası', 'İlaçlar', 'Kıyafetler', 'Gözlük'], ['ID / passport', 'Phone charger', 'Power bank', 'Earphones', 'Toothbrush', 'Medicine', 'Clothes', 'Glasses']] },
  { id: 'todo', kind: 'list', name: ['Yapılacaklar', 'To-do'], title: ['Yapılacaklar', 'To-do'], items: [[], []] },
  { id: 'meet', kind: 'text', name: ['Toplantı notu', 'Meeting notes'], title: ['Toplantı · {tarih}', 'Meeting · {date}'], body: ['Katılımcılar:\n\nKonular:\n• \n\nKararlar:\n• \n\nYapılacaklar:\n☐ ', 'Attendees:\n\nTopics:\n• \n\nDecisions:\n• \n\nAction items:\n☐ '] },
  { id: 'diary', kind: 'text', name: ['Günlük', 'Journal'], title: ['{tarih}', '{date}'], body: ['Bugün ne oldu?\n\n\nMinnettar olduklarım:\n• \n\nYarın için:\n• ', 'What happened today?\n\n\nGrateful for:\n• \n\nFor tomorrow:\n• '] },
  { id: 'week', kind: 'list', name: ['Haftalık plan', 'Weekly plan'], title: ['Hafta · {tarih}', 'Week · {date}'], items: [['Pazartesi: ', 'Salı: ', 'Çarşamba: ', 'Perşembe: ', 'Cuma: ', 'Cumartesi: ', 'Pazar: '], ['Monday: ', 'Tuesday: ', 'Wednesday: ', 'Thursday: ', 'Friday: ', 'Saturday: ', 'Sunday: ']] },
  { id: 'idea', kind: 'text', name: ['Fikir notu', 'Idea'], title: ['Fikir: ', 'Idea: '], body: ['Fikir:\n\nNeden önemli?\n\nİlk adım:\n☐ ', 'Idea:\n\nWhy it matters:\n\nFirst step:\n☐ '] },
  { id: 'recipe', kind: 'text', name: ['Tarif', 'Recipe'], title: ['Tarif: ', 'Recipe: '], body: ['Kaç kişilik:\nSüre:\n\nMalzemeler:\n• \n\nYapılışı:\n1. ', 'Serves:\nTime:\n\nIngredients:\n• \n\nMethod:\n1. '] },
  { id: 'book', kind: 'text', name: ['Kitap / film notu', 'Book / film notes'], title: ['', ''], body: ['Yazar / yönetmen:\nPuan: ☆☆☆☆☆\n\nKısaca:\n\nAkılda kalanlar / alıntılar:\n• ', 'Author / director:\nRating: ☆☆☆☆☆\n\nIn short:\n\nHighlights / quotes:\n• '] },
  { id: 'gift', kind: 'list', name: ['Hediye fikirleri', 'Gift ideas'], title: ['Hediye fikirleri', 'Gift ideas'], items: [[], []] },
  { id: 'checklist', kind: 'list', name: ['Kontrol listesi', 'Checklist'], title: ['Kontrol listesi', 'Checklist'], items: [[], []] }
];
function tplSeed(id) { const b = TPL_BASE.find(x => x.id === id); const L = isEn() ? 1 : 0; return { id: b.id, base: true, on: true, kind: b.kind, name: b.name[L], title: b.title[L], body: b.body ? b.body[L] : '', items: b.items ? b.items[L].slice() : [] }; }
function templates() {
  const st = settings();
  if (!Array.isArray(st.noteTpl)) { st.noteTpl = TPL_BASE.map(b => tplSeed(b.id)); }
  return st.noteTpl;
}
function tplFill(s) { const d = fmtLong(today()) + ' ' + new Date().getFullYear(); return String(s || '').replace(/\{tarih\}|\{date\}/g, d); }
function noteFromTpl(t) {
  const n = { id: uid(), type: 'note', kind: t.kind === 'list' ? 'list' : 'text', title: tplFill(t.title), body: t.kind === 'list' ? '' : tplFill(t.body), items: t.kind === 'list' ? (t.items || []).filter(x => x !== undefined).map(x => ({ id: nid(), t: x, done: false })) : [], tags: S.noteTag ? [S.noteTag] : [], pinned: false, color: '' };
  return n;
}

/* ----- Not listesi ----- */
S.noteSort = lsGet('pusula.noteSort', 'updated'); S.noteKind = lsGet('pusula.noteKind', 'all');
function viewNotes() {
  const tags = tagsOf('note');
  const kinds = [['all', 'Tümü']].concat(Object.keys(NOTE_KINDS).map(k => [k, NOTE_KINDS[k][0]]));
  return '<div class="search">' + icon('search') + '<input id="noteSearch" placeholder="Notlarda ara" value="' + esc(S.noteQuery) + '" autocomplete="off" enterkeyhint="search"></div>' +
    (tags.length ? '<div class="chips tag-row">' + tags.map(t => '<button class="chip sm ' + (S.noteTag === t.id ? 'on' : '') + '" data-act="note-tagf" data-id="' + t.id + '">#' + esc(t.name) + '</button>').join('') + '</div>' : '') +
    '<div class="note-new"><button class="btn" data-act="new-note">' + icon('note', 'sm') + ' <span>Yazı</span></button><button class="btn" data-act="new-list">' + icon('list', 'sm') + ' <span>Liste</span></button><button class="btn" data-act="new-ink">' + icon('pen', 'sm') + ' <span>Kalem</span></button><button class="btn" data-act="new-from-tpl">' + icon('template', 'sm') + ' <span>Şablon</span></button></div>' +
    '<div class="note-bar"><div class="chips">' + kinds.map(k => '<button class="chip sm ' + (S.noteKind === k[0] ? 'on' : '') + '" data-act="note-kindf" data-k="' + k[0] + '">' + k[1] + '</button>').join('') + '</div>' +
    '<button class="btn sm-btn note-sort" data-act="note-sort" aria-label="Sırala">' + icon('sort', 'sm') + '<span>' + tr({ updated: 'Son', created: 'Yeni', title: 'A–Z', color: 'Renk' }[S.noteSort] || 'Son') + '</span></button></div>' +
    '<div id="notesList">' + notesList() + '</div>';
}
const noteText = n => n.kind === 'list' ? (n.items || []).map(i => i.t).join(' ') : (n.body || '');
function notesList() {
  const q = lower(S.noteQuery.trim());
  if (S.noteTag && !tagName(S.noteTag)) S.noteTag = null;
  let notes = list('note');
  if (S.noteKind !== 'all') notes = notes.filter(n => (n.kind || 'text') === S.noteKind);
  if (S.noteTag) notes = notes.filter(n => (n.tags || []).includes(S.noteTag));
  if (q) notes = notes.filter(n => lower(n.title + ' ' + noteText(n) + ' ' + (n.tags || []).map(tagName).join(' ')).includes(q));
  const by = { updated: (a, b) => b.updated - a.updated, created: (a, b) => (b.created || 0) - (a.created || 0), title: (a, b) => noteTitle(a).localeCompare(noteTitle(b), TR), color: (a, b) => NOTE_COLORS.indexOf(a.color || '') - NOTE_COLORS.indexOf(b.color || '') || b.updated - a.updated }[S.noteSort] || ((a, b) => b.updated - a.updated);
  notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || by(a, b));
  if (!notes.length) return '<div class="card"><div class="empty">' + (q || S.noteTag || S.noteKind !== 'all' ? 'Eşleşen not yok.' : 'Henüz not yok. Yazı, liste ya da kalem notuyla başla; hazır şablonlar da var.') + '</div></div>';
  return '<div class="notes-grid">' + notes.map(noteCardHtml).join('') + '</div>';
}
function noteCardHtml(n) {
  const meta = '<div class="note-meta">' + (n.pinned ? '<span class="pin">' + icon('pin', 'xs') + '</span>' : '') + '<span>' + relDay(ymd(new Date(n.updated))) + '</span>' + tagChips(n.tags) + '</div>';
  const st = n.color ? ' style="--nc:' + n.color + '"' : '';
  const cls = 'note-card' + (n.color ? ' colored' : '');
  if (n.kind === 'ink') return '<button class="' + cls + '"' + st + ' data-act="open-note" data-id="' + n.id + '"><img alt="" src="' + inkThumb(n) + '">' + (n.title ? '<h3 class="u">' + esc(n.title) + '</h3>' : '') + meta + '</button>';
  if (n.kind === 'list') {
    const it = n.items || [], done = it.filter(x => x.done).length, open = it.filter(x => !x.done);
    return '<button class="' + cls + ' list-card"' + st + ' data-act="open-note" data-id="' + n.id + '">' + (n.title ? '<h3 class="u">' + esc(n.title) + '</h3>' : '') +
      '<ul class="nl-prev">' + open.slice(0, 6).map(x => '<li class="u">' + esc(x.t || '…') + '</li>').join('') + (open.length > 6 ? '<li class="more">+' + (open.length - 6) + '</li>' : '') + '</ul>' +
      (it.length ? '<div class="nl-prog"><i style="width:' + Math.round(done / it.length * 100) + '%"></i></div><div class="note-meta"><span>' + done + '/' + it.length + '</span></div>' : '') + meta + '</button>';
  }
  return '<button class="' + cls + '"' + st + ' data-act="open-note" data-id="' + n.id + '">' + (n.title ? '<h3 class="u">' + esc(n.title) + '</h3>' : '') + (n.body ? '<p class="u">' + esc(n.body.slice(0, 400)) + '</p>' : '') + meta + '</button>';
}
TODAY_CARDS.pinned = function () {
  const ns = list('note').filter(n => n.pinned).sort((a, b) => b.updated - a.updated).slice(0, 4);
  if (!ns.length) return '';
  return card('pin', T('pinned'), ns.map(n => { const it = n.items || [];
    const sub = n.kind === 'list' ? it.filter(x => !x.done).slice(0, 3).map(x => x.t).join(' · ') + (it.length ? ' (' + it.filter(x => x.done).length + '/' + it.length + ')' : '') : n.kind !== 'ink' ? (n.body || '').slice(0, 90) : '';
    return '<div class="row" data-act="open-note" data-id="' + n.id + '"><div class="row-main"><div class="row-title">' + icon(NOTE_KINDS[n.kind || 'text'] ? NOTE_KINDS[n.kind || 'text'][1] : 'note', 'xs') + ' ' + esc(noteTitle(n)) + '</div>' + (sub ? '<div class="row-meta u">' + esc(sub) + '</div>' : '') + '</div></div>'; }).join(''), 'notes');
};

/* ----- Not düzenleyici ----- */
function edTop(d) {
  return '<div class="ed-top"><button class="icon-btn" data-act="close-sheet" aria-label="Geri">' + icon('back') + '</button><div class="grow"></div>' +
    '<button class="icon-btn note-color-btn" data-act="note-colors" aria-label="Renk"' + (d.color ? ' style="color:' + d.color + '"' : '') + '>' + icon('palette') + '</button>' +
    '<button class="icon-btn ' + (d.pinned ? 'on' : '') + '" data-act="note-pin" aria-label="Sabitle">' + icon('pin') + '</button>' +
    '<button class="icon-btn" data-act="note-more" aria-label="Diğer">' + icon('dots') + '</button>' +
    '<button class="icon-btn" data-act="note-delete" aria-label="Sil">' + icon('trash') + '</button></div>' +
    '<div class="note-colors hide" id="noteColors">' + NOTE_COLORS.map(c => '<button class="swatch ' + ((d.color || '') === c ? 'on' : '') + '" data-act="note-color" data-c="' + c + '" style="background:' + (c || 'var(--surface2)') + '" aria-label="Renk"></button>').join('') + '</div>' +
    '<div class="note-more hide" id="noteMore"><button class="btn sm-btn" data-act="note-as-tpl">' + icon('template', 'sm') + ' <span>Şablon olarak kaydet</span></button>' +
    (d.kind === 'list' ? '<button class="btn sm-btn" data-act="nl-to-text">' + icon('note', 'sm') + ' <span>Yazıya çevir</span></button>' : '<button class="btn sm-btn" data-act="nt-to-list">' + icon('list', 'sm') + ' <span>Listeye çevir</span></button>') +
    '<button class="btn sm-btn" data-act="note-copy">' + icon('copy', 'sm') + ' <span>Kopyala</span></button>' + (navigator.share ? '<button class="btn sm-btn" data-act="note-share">' + icon('share', 'sm') + ' <span>Paylaş</span></button>' : '') + '</div>';
}
const TOOLS_TXT = [['• ', '•', 'Madde'], ['☐ ', '☐', 'Kutucuk'], ['1. ', '1.', 'Numara'], ['\n— — —\n', '—', 'Ayraç'], ['@date', '📅', 'Tarih ve saat']];
function openNote(n, opts) {
  if (n && n.kind === 'ink') return openInk(n);
  const isNew = !n || (opts && opts.fresh);
  const d = n || { id: uid(), type: 'note', kind: (opts && opts.kind) || 'text', title: '', body: '', items: [], tags: S.noteTag ? [S.noteTag] : [], pinned: false, color: '' };
  if (d.kind === 'list' && !Array.isArray(d.items)) d.items = [];
  S.noteEd = { d, saved: !isNew, deleted: false, t: null };
  const body = d.kind === 'list' ? '<div id="nlBox"></div>' :
    '<div class="nt-tools">' + TOOLS_TXT.map(t => '<button type="button" class="chip sm" data-act="nt-ins" data-v="' + esc(t[0]) + '" title="' + t[2] + '" aria-label="' + t[2] + '">' + t[1] + '</button>').join('') + '</div><textarea id="noteBody" class="note-body" placeholder="Yazmaya başla…">' + esc(d.body) + '</textarea>';
  openSheet(edTop(d) + '<div class="note-ed ' + (d.kind === 'list' ? 'is-list' : '') + '"' + (d.color ? ' style="--nc:' + d.color + '"' : '') + '><input class="input big" id="noteTitle" placeholder="Başlık" value="' + esc(d.title) + '" autocomplete="off">' + body + '<div class="nc-row">' + NOTE_COLORS.map(c => '<button class="swatch ' + ((d.color || '') === c ? 'on' : '') + '" data-act="note-color" data-c="' + c + '" style="background:' + (c || 'var(--surface2)') + '" aria-label="Renk"></button>').join('') + '</div><div class="note-tags">' + tagPicker('note', d.tags) + '</div></div>', { full: true, onClose: noteFinish });
  if (d.kind === 'list') nlRender(isNew);
  else if (isNew) setTimeout(() => { const b = $('#noteBody'); if (b) b.focus(); }, 80);
}
const noteEmpty = d => !d.title.trim() && !(d.body || '').trim() && !(d.items || []).some(i => (i.t || '').trim());
async function noteSave() {
  const E = S.noteEd; if (!E || E.deleted) return;
  const d = E.d; if (noteEmpty(d) && !E.saved) return;
  E.saved = true; await save(d, { silent: true });
}
function noteFinish() {
  const E = S.noteEd; S.noteEd = null; if (!E) return;
  clearTimeout(E.t);
  if (!E.deleted) {
    const empty = noteEmpty(E.d);
    if (empty && E.saved) { E.d.deleted = true; save(E.d, { silent: true }); }
    else if (!empty) save(E.d, { silent: true });
  }
  setTimeout(render, 0);
}
/* ----- Liste notu ----- */
function nlRender(focus) {
  const box = $('#nlBox'); const E = S.noteEd; if (!box || !E) return;
  const it = E.d.items, open = it.filter(x => !x.done), done = it.filter(x => x.done);
  const row = x => '<div class="nl-row ' + (x.done ? 'done' : '') + '" data-id="' + x.id + '"><button class="check ' + (x.done ? 'on' : '') + '" data-act="nl-toggle" data-id="' + x.id + '" aria-label="İşaretle">' + (x.done ? icon('check', 'sm') : '') + '</button><input class="nl-input u" data-nl="' + x.id + '" value="' + esc(x.t) + '" enterkeyhint="next" autocomplete="off"><button class="icon-btn" data-act="nl-del" data-id="' + x.id + '" aria-label="Sil">' + icon('x', 'sm') + '</button></div>';
  box.innerHTML = (it.length ? '<div class="nl-head"><span class="muted sm">' + done.length + '/' + it.length + '</span><div class="nl-prog"><i style="width:' + (it.length ? Math.round(done.length / it.length * 100) : 0) + '%"></i></div></div>' : '') +
    '<div class="nl-list">' + open.map(row).join('') + '</div>' +
    '<form class="nl-add" id="nlAdd"><span class="nl-plus">' + icon('plus', 'sm') + '</span><input class="nl-input" name="t" placeholder="Madde ekle…" enterkeyhint="done" autocomplete="off"></form>' +
    (done.length ? '<div class="nl-done-head"><span>' + tr('Tamamlananlar') + ' (' + done.length + ')</span><span><button class="link" data-act="nl-uncheck">' + tr('İşaretleri kaldır') + '</button><button class="link danger" data-act="nl-clear">' + tr('Temizle') + '</button></span></div><div class="nl-list">' + done.map(row).join('') + '</div>' : '');
  translateTree(box);
  if (focus) setTimeout(() => { const i = $('#nlAdd input'); if (i && !matchMedia('(pointer:coarse)').matches) i.focus(); }, 80);
}
function nlChanged() { const E = S.noteEd; if (!E) return; E.d.body = ''; noteChanged(); }
document.addEventListener('submit', e => {
  if (e.target.id !== 'nlAdd') return; e.preventDefault();
  const E = S.noteEd; if (!E) return; const inp = e.target.t; const lines = inp.value.split(/\n|;/).map(x => x.trim()).filter(Boolean);
  if (!lines.length) return;
  lines.forEach(t => E.d.items.push({ id: nid(), t, done: false })); inp.value = '';
  nlChanged(); nlRender(); const i = $('#nlAdd input'); if (i) i.focus();
}, true);
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || !el.dataset.nl || !S.noteEd) return;
  const x = S.noteEd.d.items.find(i => i.id === el.dataset.nl); if (x) { x.t = el.value; nlChanged(); }
});
document.addEventListener('keydown', e => {
  const el = e.target; if (!el.dataset || !el.dataset.nl || e.key !== 'Enter') return;
  e.preventDefault(); const i = $('#nlAdd input'); if (i) i.focus();
});
function insertAtCursor(ta, text) {
  const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
  const atLineStart = s === 0 || v[s - 1] === '\n';
  const t = (!atLineStart && /^(• |☐ |1\. )$/.test(text) ? '\n' : '') + text;
  ta.value = v.slice(0, s) + t + v.slice(en); ta.selectionStart = ta.selectionEnd = s + t.length; ta.focus();
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ----- Şablon seçici ve yönetimi ----- */
function openTplPicker() {
  const ts = templates().filter(t => t.on !== false);
  openSheet(sheetHead('Şablondan yeni not') + '<div class="sheet-body"><div class="tpl-grid">' + (ts.length ? ts.map(t => '<button class="tpl-card" data-act="tpl-use" data-id="' + t.id + '">' + icon(t.kind === 'list' ? 'list' : 'note') + '<b class="u">' + esc(t.name) + '</b><span class="u">' + esc(t.kind === 'list' ? (t.items || []).slice(0, 3).join(', ') : (t.body || '').split('\n')[0]) + '</span></button>').join('') : '<div class="empty">Açık şablon yok.</div>') + '</div>' +
    '<button class="link" data-act="tpl-manage">' + tr('Şablonları yönet') + '</button></div>');
}
function openTplManage() {
  const ts = templates();
  openSheet(sheetHead('Not şablonları') + '<div class="sheet-body"><p class="muted sm" style="margin-top:0">Açık olanlar “Şablon” menüsünde görünür. Bir notu kendi şablonuna çevirmek için notta ⋯ → “Şablon olarak kaydet”.</p>' +
    '<div class="set-group">' + ts.map(t => '<div class="set-row"><span class="muted">' + icon(t.kind === 'list' ? 'list' : 'note', 'sm') + '</span><div class="grow"><div class="u">' + esc(t.name) + '</div><div class="sub">' + tr(t.base ? 'Önerilen' : 'Senin şablonun') + '</div></div>' +
      '<button class="icon-btn" data-act="tpl-edit" data-id="' + t.id + '" aria-label="Düzenle">' + icon('pen', 'sm') + '</button><button class="icon-btn" data-act="tpl-del" data-id="' + t.id + '" aria-label="Sil">' + icon('trash', 'sm') + '</button><button class="switch ' + (t.on !== false ? 'on' : '') + '" data-act="tpl-toggle" data-id="' + t.id + '" aria-label="Aç/kapat"></button></div>').join('') + '</div>' +
    '<button class="btn block" data-act="tpl-edit" data-id="">' + icon('plus', 'sm') + ' <span>Yeni şablon</span></button>' +
    (TPL_BASE.some(b => !ts.find(t => t.id === b.id)) ? '<button class="link" data-act="tpl-restore">' + tr('Silinen önerilenleri geri getir') + '</button>' : '') + '</div>', { onClose: () => setTimeout(render, 0) });
}
function openTplEdit(id) {
  const t = templates().find(x => x.id === id) || { id: 'u' + nid(), kind: 'text', name: '', title: '', body: '', items: [], on: true };
  S.tplDraft = JSON.parse(JSON.stringify(t)); S.tplDraft._new = !id;
  openSheet(sheetHead(id ? 'Şablonu düzenle' : 'Yeni şablon') + '<div class="sheet-body">' +
    '<label class="field"><span>Şablon adı</span><input class="input" name="tplName" value="' + esc(t.name) + '" placeholder="Örn. Haftalık market" autocomplete="off"></label>' +
    '<div class="field"><span>Tür</span>' + seg('tplKind', [['text', 'Yazı'], ['list', 'Liste']], t.kind) + '</div>' +
    '<label class="field"><span>Not başlığı ({tarih} bugünün tarihi olur)</span><input class="input" name="tplTitle" value="' + esc(t.title) + '" autocomplete="off"></label>' +
    '<label class="field"><span>İçerik (listede her satır bir madde)</span><textarea class="input" name="tplBody" rows="8">' + esc(t.kind === 'list' ? (t.items || []).join('\n') : t.body) + '</textarea></label>' +
    '</div><div class="sheet-foot"><button class="btn" data-act="tpl-manage">Vazgeç</button><button class="btn primary" data-act="tpl-save">Kaydet</button></div>');
}
Object.assign(ACTIONS, {
  'new-note': () => openNote(),
  'new-list': () => openNote(null, { kind: 'list' }),
  'new-from-tpl': () => openTplPicker(),
  'tpl-use': el => { const t = templates().find(x => x.id === el.dataset.id); if (!t) return; closeSheet(); setTimeout(() => openNote(noteFromTpl(t), { fresh: true }), 30); },
  'tpl-manage': () => openTplManage(),
  'tpl-toggle': el => { const t = templates().find(x => x.id === el.dataset.id); if (!t) return; t.on = t.on === false; el.classList.toggle('on', t.on); save(settings(), { silent: true }); },
  'tpl-del': el => { const st = settings(); const t = templates().find(x => x.id === el.dataset.id); if (!t || !ask(Lx('“' + t.name + '” şablonu silinsin mi?', 'Delete the “' + t.name + '” template?'))) return; st.noteTpl = templates().filter(x => x.id !== t.id); save(st, { silent: true }); openTplManage(); },
  'tpl-restore': () => { const st = settings(); const ts = templates(); TPL_BASE.forEach(b => { if (!ts.find(t => t.id === b.id)) ts.push(tplSeed(b.id)); }); st.noteTpl = ts; save(st, { silent: true }); openTplManage(); },
  'tpl-edit': el => openTplEdit(el.dataset.id),
  'tpl-save': () => {
    const d = S.tplDraft; if (!d) return; const name = fval('tplName').trim(); if (!name) { $('#sheetRoot [name=tplName]').classList.add('err'); return; }
    const kind = segVal('tplKind') || 'text', raw = fval('tplBody');
    Object.assign(d, { name, kind, title: fval('tplTitle'), body: kind === 'list' ? '' : raw, items: kind === 'list' ? raw.split('\n').map(x => x.trim()).filter(Boolean) : [] });
    const st = settings(); const ts = templates(); const i = ts.findIndex(x => x.id === d.id); const isNew = d._new; delete d._new;
    if (i >= 0) ts[i] = d; else ts.push(d); st.noteTpl = ts; save(st, { silent: true }); toast(tr(isNew ? 'Şablon eklendi' : 'Şablon kaydedildi')); openTplManage();
  },
  'note-as-tpl': () => {
    const E = S.noteEd; if (!E) return; const d = E.d; const st = settings(); const ts = templates();
    const name = d.title.trim() || noteTitle(d);
    ts.push({ id: 'u' + nid(), on: true, kind: d.kind === 'list' ? 'list' : 'text', name, title: d.title, body: d.kind === 'list' ? '' : d.body, items: d.kind === 'list' ? d.items.map(i => i.t).filter(Boolean) : [] });
    st.noteTpl = ts; save(st, { silent: true }); $('#noteMore').classList.add('hide'); toast(Lx('“' + name + '” şablonlara eklendi', '“' + name + '” added to templates'));
  },
  'note-colors': () => { $('#noteColors').classList.toggle('hide'); $('#noteMore').classList.add('hide'); },
  'note-more': () => { $('#noteMore').classList.toggle('hide'); $('#noteColors').classList.add('hide'); },
  'note-color': el => { const E = S.noteEd; if (!E) return; E.d.color = el.dataset.c; $$('#noteColors .swatch, .nc-row .swatch').forEach(b => b.classList.toggle('on', b.dataset.c === el.dataset.c)); const btn = $('.note-color-btn'); if (btn) btn.style.color = E.d.color || ''; const ed = $('.note-ed'); if (ed) { if (E.d.color) ed.style.setProperty('--nc', E.d.color); else ed.style.removeProperty('--nc'); } noteChanged(); },
  'nt-ins': el => { const ta = $('#noteBody'); if (!ta) return; let v = el.dataset.v; if (v === '@date') v = new Date().toLocaleString(TR, { dateStyle: 'medium', timeStyle: 'short' }) + ' '; insertAtCursor(ta, v); },
  'nl-toggle': el => { const E = S.noteEd; if (!E) return; const x = E.d.items.find(i => i.id === el.dataset.id); if (!x) return; x.done = !x.done; if (navigator.vibrate) navigator.vibrate(15); nlChanged(); nlRender(); },
  'nl-del': el => { const E = S.noteEd; if (!E) return; E.d.items = E.d.items.filter(i => i.id !== el.dataset.id); nlChanged(); nlRender(); },
  'nl-uncheck': () => { const E = S.noteEd; if (!E) return; E.d.items.forEach(i => { i.done = false; }); nlChanged(); nlRender(); },
  'nl-clear': () => { const E = S.noteEd; if (!E) return; const n = E.d.items.filter(i => i.done).length; if (!n) return; E.d.items = E.d.items.filter(i => !i.done); nlChanged(); nlRender(); toast(Lx(n + ' madde silindi', n + ' items removed')); },
  'nl-to-text': () => { const E = S.noteEd; if (!E) return; const d = E.d; d.body = d.items.map(i => (i.done ? '☑ ' : '☐ ') + i.t).join('\n'); d.items = []; d.kind = 'text'; noteChanged(); const n = d; closeSheet(); setTimeout(() => { const it = S.items.get(n.id) || n; openNote(it); }, 50); },
  'nt-to-list': () => { const E = S.noteEd; if (!E) return; const d = E.d; d.items = (d.body || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => ({ id: nid(), done: /^☑/.test(x), t: x.replace(/^(•|☐|☑|-|\*|\d+[.)])\s*/, '') })); d.body = ''; d.kind = 'list'; noteChanged(); const n = d; closeSheet(); setTimeout(() => { const it = S.items.get(n.id) || n; openNote(it); }, 50); },
  'note-copy': async () => { const E = S.noteEd; if (!E) return; const d = E.d; const t = (d.title ? d.title + '\n\n' : '') + (d.kind === 'list' ? d.items.map(i => (i.done ? '☑ ' : '☐ ') + i.t).join('\n') : d.body); try { await navigator.clipboard.writeText(t); toast(tr('Kopyalandı')); } catch (e) { toast(tr('Kopyalanamadı')); } },
  'note-share': async () => { const E = S.noteEd; if (!E) return; const d = E.d; const t = d.kind === 'list' ? d.items.map(i => (i.done ? '☑ ' : '☐ ') + i.t).join('\n') : d.body; try { await navigator.share({ title: d.title || noteTitle(d), text: (d.title ? d.title + '\n\n' : '') + t }); } catch (e) { /* vazgeçildi */ } },
  'note-sort': () => { const o = ['updated', 'created', 'title', 'color']; S.noteSort = o[(o.indexOf(S.noteSort) + 1) % o.length]; lsSet('pusula.noteSort', S.noteSort); render(); toast(tr({ updated: 'Son düzenlenene göre', created: 'Oluşturma tarihine göre', title: 'Başlığa göre (A–Z)', color: 'Renge göre' }[S.noteSort])); },
  'note-kindf': el => { S.noteKind = el.dataset.k; lsSet('pusula.noteKind', S.noteKind); render(); }
});
document.addEventListener('change', e => { if (e.target.id === 'noteSort') { S.noteSort = e.target.value; lsSet('pusula.noteSort', S.noteSort); const l = $('#notesList'); if (l) { l.innerHTML = notesList(); translateTree(l); } } });

(function () {
  const add = {
    'Yazı': 'Text', 'Liste': 'List', 'Kalem': 'Pen', 'Şablon': 'Template', 'Tümü': 'All', 'Son düzenlenen': 'Last edited', 'Oluşturma': 'Created', 'A–Z': 'A–Z', 'Renk': 'Color', 'Sırala': 'Sort',
    'Henüz not yok. Yazı, liste ya da kalem notuyla başla; hazır şablonlar da var.': 'No notes yet. Start with text, a list or pen; templates are ready too.',
    'Madde': 'Bullet', 'Kutucuk': 'Checkbox', 'Numara': 'Number', 'Ayraç': 'Divider', 'Tarih ve saat': 'Date & time', 'Diğer': 'More', 'Şablon olarak kaydet': 'Save as template', 'Yazıya çevir': 'Convert to text', 'Listeye çevir': 'Convert to list',
    'Madde ekle…': 'Add item…', 'Tamamlananlar': 'Completed', 'İşaretleri kaldır': 'Uncheck all', 'İşaretle': 'Check', 'Şablondan yeni not': 'New note from template', 'Açık şablon yok.': 'No templates turned on.', 'Şablonları yönet': 'Manage templates',
    'Not şablonları': 'Note templates', 'Açık olanlar “Şablon” menüsünde görünür. Bir notu kendi şablonuna çevirmek için notta ⋯ → “Şablon olarak kaydet”.': 'Templates that are on show in the “Template” menu. To turn a note into your own template: ⋯ → “Save as template”.',
    'Önerilen': 'Suggested', 'Senin şablonun': 'Your template', 'Düzenle': 'Edit', 'Yeni şablon': 'New template', 'Silinen önerilenleri geri getir': 'Restore deleted suggestions', 'Şablonu düzenle': 'Edit template', 'Şablon adı': 'Template name',
    'Örn. Haftalık market': 'E.g. Weekly groceries', 'Tür': 'Type', 'Not başlığı ({tarih} bugünün tarihi olur)': 'Note title ({date} becomes today’s date)', 'İçerik (listede her satır bir madde)': 'Content (for lists, one item per line)',
    'Şablon eklendi': 'Template added', 'Şablon kaydedildi': 'Template saved', 'Kopyalandı': 'Copied', 'Son': 'Recent', 'Yeni': 'Newest', 'Son düzenlenene göre': 'By last edited', 'Oluşturma tarihine göre': 'By created date', 'Başlığa göre (A–Z)': 'By title (A–Z)', 'Renge göre': 'By color', 'Not şablonları ve türleri': 'Note templates & types'
  };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
