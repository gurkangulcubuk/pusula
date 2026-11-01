/* PUSULA köprüsü — Cloudflare Worker
   - Google oturumunu kalıcı tutar (yenileme anahtarı burada saklanır, uygulamaya kısa ömürlü erişim anahtarı verir)
   - Uygulama kapalıyken telefona bildirim yollar: hatırlatmalar ve yeni mail (Web Push)
   Gerekenler: KV bağlaması "KV", değişkenler GOOGLE_CLIENT_ID, APP_URL, gizli değişken GOOGLE_CLIENT_SECRET, cron "* * * * *" */

const SCOPES = ['openid', 'email',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic'];

/* ---------- yardımcılar ---------- */
const enc = new TextEncoder();
const b64u = buf => { let s = ''; new Uint8Array(buf).forEach(c => { s += String.fromCharCode(c); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const b = atob(str), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let i = 0; a.forEach(x => { o.set(x, i); i += x.length; }); return o; };
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
const appOrigin = env => new URL(env.APP_URL).origin;

function cors(env, res) {
  res.headers.set('Access-Control-Allow-Origin', appOrigin(env));
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}
const json = (env, obj, status) => cors(env, new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } }));

/* ---------- Google ---------- */
const TOK = new Map(); // bu örnekte bellek önbelleği: key -> { t, exp, scope }
async function googleToken(env, key, acct) {
  const c = TOK.get(key); if (c && c.exp - Date.now() > 5 * 60000) return c;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: acct.rt, grant_type: 'refresh_token' })
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) { const e = new Error(j.error || 'token'); e.revoked = j.error === 'invalid_grant'; throw e; }
  const o = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000, scope: j.scope || acct.scope };
  TOK.set(key, o); return o;
}
async function getAcct(env, key) { if (!key || !/^[A-Za-z0-9_-]{30,60}$/.test(key)) return null; return env.KV.get('acct:' + key, 'json'); }
async function users(env) { return (await env.KV.get('users', 'json')) || []; }
async function setUsers(env, list) { await env.KV.put('users', JSON.stringify([...new Set(list)])); }

/* ---------- Web Push (RFC 8291 aes128gcm + VAPID RFC 8292) ---------- */
async function vapid(env) {
  let v = await env.KV.get('vapid', 'json');
  if (!v) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
    v = { pub: b64u(pub), jwk: await crypto.subtle.exportKey('jwk', kp.privateKey) };
    await env.KV.put('vapid', JSON.stringify(v));
  }
  return v;
}
async function vapidAuth(env, endpoint) {
  const v = await vapid(env);
  const key = await crypto.subtle.importKey('jwk', v.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.APP_URL })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + v.pub;
}
async function hmac(key, data) { const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', k, data)); }
export async function encryptPush(sub, payload) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const prkKey = await hmac(auth, shared);
  const ikm = await hmac(prkKey, cat(enc.encode('WebPush: info\0'), uaPub, asPub, new Uint8Array([1])));
  const salt = rnd(16), prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const k = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, k, cat(enc.encode(payload), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
async function sendPush(env, sub, msg) {
  const body = await encryptPush(sub, JSON.stringify(msg));
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high', Authorization: await vapidAuth(env, sub.endpoint) }, body });
  return r.status;
}
async function pushAll(env, rec, msg) { // kayıtlı tüm cihazlara; ölü abonelikleri ayıkla
  let dead = false;
  for (const s of rec.subs || []) { try { const st = await sendPush(env, s, msg); if (st === 404 || st === 410) { s.dead = true; dead = true; } } catch (e) { /* sonraki */ } }
  if (dead) rec.subs = rec.subs.filter(s => !s.dead);
  return dead;
}

/* ---------- istekler ---------- */
async function handle(req, env, ctx) {
  const url = new URL(req.url), path = url.pathname;
  if (req.method === 'OPTIONS') return cors(env, new Response(null, { status: 204 }));
  if (path === '/' || path === '/health') return json(env, { ok: true, app: 'pusula-kopru' });

  if (path === '/auth/start') {
    const state = b64u(rnd(18)); await env.KV.put('st:' + state, '1', { expirationTtl: 900 });
    const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: url.origin + '/auth/callback', response_type: 'code', scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state });
    const hint = url.searchParams.get('hint'); if (hint) q.set('login_hint', hint);
    return Response.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + q, 302);
  }
  if (path === '/auth/callback') {
    const back = m => Response.redirect(env.APP_URL + '#bridge-error=' + encodeURIComponent(m), 302);
    const code = url.searchParams.get('code'), state = url.searchParams.get('state');
    if (url.searchParams.get('error')) return back(url.searchParams.get('error'));
    if (!code || !state || !(await env.KV.get('st:' + state))) return back('state');
    await env.KV.delete('st:' + state);
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: url.origin + '/auth/callback', grant_type: 'authorization_code' }) });
    const j = await r.json();
    if (!j.refresh_token) return back(j.error || 'no_refresh_token');
    let email = '';
    try { email = JSON.parse(new TextDecoder().decode(unb64u(j.id_token.split('.')[1]))).email || ''; } catch (e) { /* yok */ }
    // aynı hesap daha önce bağlandıysa o anahtarı kullan (diğer cihazlar bağlı kalsın)
    const list = await users(env); let key = '';
    for (const k of list) { const a = await env.KV.get('acct:' + k, 'json'); if (a && email && a.email === email) { key = k; break; } }
    const old = key ? await env.KV.get('acct:' + key, 'json') : null;
    if (!key) key = b64u(rnd(32));
    await env.KV.put('acct:' + key, JSON.stringify(Object.assign(old || { subs: [], rems: [], prefs: {} }, { rt: j.refresh_token, scope: j.scope, email, linked: Date.now() })));
    if (!list.includes(key)) await setUsers(env, list.concat(key));
    TOK.set(key, { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000, scope: j.scope });
    return Response.redirect(env.APP_URL + '#bridge=' + key, 302);
  }
  if (path === '/vapid') return json(env, { key: (await vapid(env)).pub });

  if (req.method !== 'POST') return json(env, { error: 'not_found' }, 404);
  let body = {}; try { body = await req.json(); } catch (e) { /* boş */ }
  const key = body.key, acct = await getAcct(env, key);
  if (!acct) return json(env, { error: 'unlinked' }, 401);

  if (path === '/token') {
    try { const t = await googleToken(env, key, acct); return json(env, { access_token: t.t, expires_at: t.exp, scope: t.scope, email: acct.email }); }
    catch (e) { return json(env, { error: e.revoked ? 'revoked' : 'google' }, e.revoked ? 401 : 502); }
  }
  if (path === '/state') { // abonelik + hatırlatmalar + tercihler tek seferde (yalnız değişince çağrılır)
    let ch = false;
    if (body.sub && body.sub.endpoint && body.sub.keys) { const subs = (acct.subs || []).filter(s => s.endpoint !== body.sub.endpoint && s.dev !== body.dev); subs.push({ endpoint: body.sub.endpoint, keys: body.sub.keys, dev: body.dev || '' }); acct.subs = subs.slice(-6); ch = true; }
    if (body.unsub) { acct.subs = (acct.subs || []).filter(s => s.endpoint !== body.unsub); ch = true; }
    if (Array.isArray(body.rems)) { acct.rems = body.rems.filter(r => r && r.at && r.tag).slice(0, 300); ch = true; }
    if (body.prefs) { acct.prefs = Object.assign({}, acct.prefs, body.prefs); ch = true; }
    if (ch) await env.KV.put('acct:' + key, JSON.stringify(acct));
    return json(env, { ok: true, subs: (acct.subs || []).length, rems: (acct.rems || []).length });
  }
  if (path === '/test') { const n = await pushAll(env, acct, { title: 'PUSULA', body: body.text || 'Köprü çalışıyor ✓', tag: 'pusula-test', data: {} }); if (n) await env.KV.put('acct:' + key, JSON.stringify(acct)); return json(env, { ok: true, subs: (acct.subs || []).length }); }
  if (path === '/unlink') {
    await env.KV.delete('acct:' + key); await env.KV.delete('ms:' + key); TOK.delete(key);
    await setUsers(env, (await users(env)).filter(k => k !== key));
    return json(env, { ok: true });
  }
  return json(env, { error: 'not_found' }, 404);
}

/* ---------- zamanlanmış iş (her dakika) ---------- */
async function gmailNew(env, key, acct) {
  const t = await googleToken(env, key, acct);
  const q = 'in:inbox is:unread newer_than:2d' + (acct.prefs.mailAll ? '' : ' category:primary');
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=' + encodeURIComponent(q), { headers: { Authorization: 'Bearer ' + t.t } });
  if (!r.ok) return;
  const ids = ((await r.json()).messages || []).map(m => m.id);
  const seen = (await env.KV.get('ms:' + key, 'json')) || null;
  const fresh = seen ? ids.filter(id => !seen.includes(id)) : [];
  if (!seen || fresh.length) await env.KV.put('ms:' + key, JSON.stringify(ids.concat(seen || []).filter((x, i, a) => a.indexOf(x) === i).slice(0, 60)));
  if (!fresh.length || !(acct.subs || []).length) return;
  for (const id of fresh.slice(0, 4)) {
    const m = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id + '?format=metadata&metadataHeaders=From&metadataHeaders=Subject', { headers: { Authorization: 'Bearer ' + t.t } });
    if (!m.ok) continue;
    const j = await m.json(), h = n => ((j.payload && j.payload.headers) || []).find(x => x.name.toLowerCase() === n);
    const from = ((h('from') || {}).value || '').replace(/<[^>]*>/, '').replace(/"/g, '').trim() || 'Yeni mail';
    if (await pushAll(env, acct, { kind: 'mail', title: '✉ ' + from, body: (h('subject') || {}).value || j.snippet || '', tag: 'mail-' + id, data: { mail: id } })) await env.KV.put('acct:' + key, JSON.stringify(acct));
  }
  if (fresh.length > 4) await pushAll(env, acct, { kind: 'mail', title: '✉ PUSULA', body: '+' + (fresh.length - 4) + ' yeni mail', tag: 'mail-more', data: { mail: '' } });
}
async function tick(env, when) {
  const now = when || Date.now(), minute = Math.floor(now / 60000);
  for (const key of await users(env)) {
    const acct = await env.KV.get('acct:' + key, 'json'); if (!acct) continue;
    acct.prefs = acct.prefs || {};
    try {
      const rems = acct.rems || [], due = rems.filter(r => r.at <= now + 20000), keep = rems.filter(r => r.at > now + 20000);
      if (due.length) {
        for (const r of due) if (now - r.at < 15 * 60000 && acct.prefs.rem !== false) await pushAll(env, acct, Object.assign({ kind: 'rem' }, r));
        acct.rems = keep; await env.KV.put('acct:' + key, JSON.stringify(acct));
      }
      if (acct.prefs.mail && minute % 3 === 0) await gmailNew(env, key, acct);
    } catch (e) {
      if (e.revoked) { acct.revoked = Date.now(); await env.KV.put('acct:' + key, JSON.stringify(acct)); }
    }
  }
}

export default {
  async fetch(req, env, ctx) { try { return await handle(req, env, ctx); } catch (e) { return json(env, { error: 'server', msg: String(e && e.message || e) }, 500); } },
  async scheduled(ev, env, ctx) { ctx.waitUntil(tick(env, ev.scheduledTime)); }
};
