'use strict';
/* PUSULA — Güncelleme notları: kullanırken aklına gelen hata, istek ve fikirleri tek yerde toplar.
   Notlar 'devnote' kaydı olarak eşitlenir (Drive). Kopyala / Paylaş ile Claude'a aktarılır. */
Object.assign(ICONS, {
  idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'
});
const DN_KINDS = { bug: ['Hata', 'danger', 'Bug'], want: ['İstek', 'accent', 'Request'], idea: ['Fikir', 'ok', 'Idea'] };
const dnLabel = k => Lx(k[0], k[2]);
const dnOpen = () => list('devnote').filter(n => !n.done).sort((a, b) => a.created - b.created);
const dnDone = () => list('devnote').filter(n => n.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
function dnWhere() {
  const t = S.tab;
  if (t === 'plan') return T('plan') + ' › ' + subTitle(S.planSub);
  if (t === 'info') return T('info') + ' › ' + subTitle(S.infoSub);
  if (t === 'mail') return T('mail') + (S.mailSub ? ' › ' + tr({ inbox: 'Gelen kutusu', subs: 'Abonelikler', clean: 'Otomatik temizlik' }[S.mailSub] || '') : '');
  return T(t === 'settings' ? 'settings' : t) || t;
}
function dnTopButton() {
  if (settings().devIcon === false) return '';
  const n = dnOpen().length;
  return '<button class="icon-btn dn-btn" data-act="devnotes" aria-label="Güncelleme notları">' + icon('idea') + (n ? '<b class="badge soft">' + (n > 9 ? '9+' : n) + '</b>' : '') + '</button>';
}
const DN = { kind: 'want', showDone: false, where: '', sel: new Set() };
function openDevNotes() {
  DN.where = DN.where || dnWhere();
  openSheet(sheetHead('Güncelleme notları') + '<div class="sheet-body" id="dnBody"></div>', { onClose: () => { DN.where = ''; DN.sel.clear(); setTimeout(render, 0); } });
  dnRender(true);
}
function dnRow(n) {
  const k = DN_KINDS[n.kind] || DN_KINDS.want;
  const sel = !n.done && DN.sel.has(n.id);
  return '<div class="dn-row ' + (n.done ? 'done' : '') + (sel ? ' sel' : '') + '"><button class="check ' + (n.done ? 'on' : '') + '" data-act="dn-done" data-id="' + n.id + '" aria-label="Yapıldı">' + (n.done ? icon('check', 'sm') : '') + '</button>' +
    '<div class="grow"' + (n.done ? '' : ' data-act="dn-sel" data-id="' + n.id + '" role="button"') + '><div class="dn-meta"><span class="dn-kind u ' + k[1] + '">' + dnLabel(k) + '</span><span class="u">' + esc(n.where || '') + '</span><span>' + new Date(n.created).toLocaleDateString(TR, { day: 'numeric', month: 'short' }) + '</span></div><div class="dn-text u">' + esc(n.text) + '</div></div>' +
    '<button class="icon-btn" data-act="dn-del" data-id="' + n.id + '" aria-label="Sil">' + icon('trash', 'sm') + '</button></div>';
}
function dnRender(focus) {
  const box = $('#dnBody'); if (!box) return;
  const open = dnOpen(), done = dnDone();
  [...DN.sel].forEach(id => { if (!open.find(n => n.id === id)) DN.sel.delete(id); }); const ns = DN.sel.size;
  box.innerHTML = '<p class="muted sm" style="margin-top:0">Kullanırken aklına gelen hatayı, isteği ya da fikri yaz. Hepsi burada birikir; “Kopyala” ya da “Paylaş” ile bana gönderirsin, birlikte güncelleme yaparız.</p>' +
    '<form class="dn-form" id="dnForm"><div class="seg dn-kinds">' + Object.keys(DN_KINDS).map(k => '<button type="button" class="u ' + (DN.kind === k ? 'on' : '') + '" data-act="dn-kind" data-k="' + k + '">' + dnLabel(DN_KINDS[k]) + '</button>').join('') + '</div>' +
    '<textarea class="input" name="t" rows="3" placeholder="Örn: Posta’da maili kaydırarak arşivleyebileyim"></textarea>' +
    '<div class="dn-where"><span class="muted sm">Nerede:</span><input class="input slim" name="w" value="' + esc(DN.where) + '" autocomplete="off"></div>' +
    '<button class="btn primary block" type="submit">' + icon('plus', 'sm') + ' <span>Notu ekle</span></button></form>' +
    '<div class="set-sub dn-head"><span>Bekleyen</span><span class="count">' + open.length + '</span></div>' +
    (open.length ? '<p class="muted sm dn-hint">' + (ns ? Lx(ns + ' not seçili · sadece bunlar gönderilir', ns + ' selected · only these will be sent') + ' · <button class="link" data-act="dn-sel-clear">' + tr('Seçimi kaldır') + '</button>' : tr('Hepsini gönderebilir ya da sadece bazılarını seçmek için notlara dokunabilirsin.')) + '</p><div class="dn-list">' + open.map(dnRow).join('') + '</div><div class="dn-actions"><button class="btn" data-act="dn-copy">' + icon('copy', 'sm') + ' <span>' + (ns ? Lx('Seçilenleri kopyala', 'Copy selected') : tr('Hepsini kopyala')) + '</span></button>' + (navigator.share ? '<button class="btn" data-act="dn-share">' + icon('share', 'sm') + ' <span>' + (ns ? Lx('Seçilenleri paylaş', 'Share selected') : tr('Hepsini paylaş')) + '</span></button>' : '') + '</div>' : '<div class="empty">Bekleyen not yok.</div>') +
    (done.length ? '<button class="link" data-act="dn-toggle-done">' + (DN.showDone ? 'Yapılanları gizle' : 'Yapılanları göster') + ' (' + done.length + ')</button>' + (DN.showDone ? '<div class="dn-list">' + done.map(dnRow).join('') + '</div><button class="link danger" data-act="dn-clear-done">Yapılanları sil</button>' : '') : '');
  translateTree(box);
  if (focus) { const t = box.querySelector('textarea'); if (t && !matchMedia('(pointer:coarse)').matches) t.focus(); }
}
function dnText() {
  const open = DN.sel.size ? dnOpen().filter(n => DN.sel.has(n.id)) : dnOpen();
  const head = 'PUSULA güncelleme notları · v' + VERSION + ' · ' + new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + open.length + ' not';
  return head + '\n\n' + open.map((n, i) => (i + 1) + '. [' + DN_KINDS[n.kind || 'want'][0] + ']' + (n.where ? ' (' + n.where + ')' : '') + ' ' + n.text.replace(/\s*\n\s*/g, ' / ')).join('\n');
}
Object.assign(ACTIONS, {
  'devnotes': () => openDevNotes(),
  'dn-sel': el => { const id = el.dataset.id; if (DN.sel.has(id)) DN.sel.delete(id); else DN.sel.add(id); dnRender(); },
  'dn-sel-clear': () => { DN.sel.clear(); dnRender(); },
  'dn-kind': el => { DN.kind = el.dataset.k; $$('#dnForm .dn-kinds button').forEach(b => b.classList.toggle('on', b === el)); },
  'dn-done': async el => { const n = S.items.get(el.dataset.id); if (!n) return; n.done = !n.done; n.doneAt = n.done ? Date.now() : 0; await save(n, { silent: true }); dnRender(); },
  'dn-del': async el => { const n = S.items.get(el.dataset.id); if (!n || !ask('Bu not silinsin mi?')) return; await remove(n, { silent: true }); dnRender(); },
  'dn-toggle-done': () => { DN.showDone = !DN.showDone; dnRender(); },
  'dn-clear-done': async () => { const d = dnDone(); if (!d.length || !ask('Yapıldı işaretli notlar silinsin mi?')) return; for (const n of d) await remove(n, { silent: true }); dnRender(); },
  'dn-copy': async () => { const t = dnText(); try { await navigator.clipboard.writeText(t); toast(tr('Notlar kopyalandı, Claude’a yapıştırabilirsin')); } catch (e) { toast(tr('Kopyalanamadı')); } },
  'dn-share': async () => { try { await navigator.share({ title: 'PUSULA güncelleme notları', text: dnText() }); } catch (e) { /* vazgeçildi */ } },
  'devicon-toggle': () => { const st = settings(); st.devIcon = st.devIcon === false; saveSettings(); }
});
document.addEventListener('submit', async e => {
  const f = e.target; if (f.id !== 'dnForm') return; e.preventDefault();
  const text = f.t.value.trim(); if (!text) return toast(tr('Önce notu yaz'));
  DN.where = f.w.value.trim();
  await save({ id: uid(), type: 'devnote', kind: DN.kind, text, where: DN.where, done: false, created: Date.now() }, { silent: true });
  toast(tr('Not eklendi')); dnRender(true);
}, true);

(function () {
  const add = {
    'Güncelleme notları': 'Update notes', 'Kullanırken aklına gelen hatayı, isteği ya da fikri yaz. Hepsi burada birikir; “Kopyala” ya da “Paylaş” ile bana gönderirsin, birlikte güncelleme yaparız.': 'Write down any bug, request or idea while using the app. They collect here; send them to Claude with “Copy” or “Share” and we’ll update together.',
    'Hata': 'Bug', 'İstek': 'Request', 'Fikir': 'Idea', 'Örn: Posta’da maili kaydırarak arşivleyebileyim': 'E.g. Let me swipe to archive in Mail', 'Nerede:': 'Where:', 'Notu ekle': 'Add note', 'Bekleyen': 'Open',
    'Bekleyen not yok.': 'No open notes.', 'Kopyala': 'Copy', 'Paylaş': 'Share', 'Yapılanları gizle': 'Hide done', 'Yapılanları göster': 'Show done', 'Yapılanları sil': 'Delete done', 'Bu not silinsin mi?': 'Delete this note?',
    'Yapıldı işaretli notlar silinsin mi?': 'Delete notes marked done?', 'Notlar kopyalandı, Claude’a yapıştırabilirsin': 'Notes copied, paste them to Claude', 'Kopyalanamadı': 'Could not copy', 'Önce notu yaz': 'Write the note first', 'Not eklendi': 'Note added',
    'Üstte güncelleme notu simgesi': 'Update note icon at the top', 'Ampul simgesi: aklına geleni hemen not al': 'Lightbulb icon: jot down ideas right away', 'Yapıldı': 'Done', 'Seçimi kaldır': 'Clear selection', 'Hepsini gönderebilir ya da sadece bazılarını seçmek için notlara dokunabilirsin.': 'Send them all, or tap notes to pick only some.', 'Hepsini kopyala': 'Copy all', 'Hepsini paylaş': 'Share all'
  };
  for (const k in add) if (!(k in EN)) EN[k] = add[k];
})();
