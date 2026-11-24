// «حقيبتي»: runs every few minutes in GitHub Actions.
// 1) Notifies the kids' devices of new lessons, homework and family messages.
// 2) Notifies the adults when a kid finishes a lesson or says thanks.
// 3) Deletes lessons, their files and messages older than 40 days.
const fs = require('fs');
const webpush = require('web-push');

const DB = (process.env.DB || '').replace(/\/+$/, '');
const PRIV = process.env.VAPID_PRIVATE || '';
const PUB = process.env.VAPID_PUBLIC || '';
const SECRET = process.env.DB_SECRET || '';
const SITE = process.env.SITE || 'https://tiloucloud.github.io/haqibati/';
const DRY = process.env.DRY_RUN === '1';
const LATE = 6 * 3600e3;          // don't notify about things older than 6 hours (e.g. after an outage)
const KEEP = 40 * 86400e3;        // lessons are kept 40 days

const auth = () => (SECRET ? '?auth=' + encodeURIComponent(SECRET) : '');
const KLB = (mt) => (/^image\//.test(mt) ? 'صورة' : mt === 'application/pdf' ? 'PDF' : /^audio\//.test(mt) ? 'تسجيل صوتي' : /^video\//.test(mt) ? 'فيديو' : 'ملف');
function title(x) {
  if (x.t) return x.t;
  const l = String(x.txt || '').split('\n')[0].trim();
  if (l) return l.slice(0, 70);
  const f = x.f && x.f[0];
  return f ? KLB(f.mt) + (x.ty === 'h' ? ' الواجب' : ' الدرس') : (x.ty === 'h' ? 'واجب' : 'درس');
}

// Returns { out: messages to send, marks: [path, value] writes, dels: paths to delete }
function plan(hq, members, now) {
  const out = [], marks = [], dels = [];
  const items = hq.items || {}, msgs = hq.msgs || {}, subs = hq.subs || {}, kidsF = hq.kids || {};
  const names = {};
  for (const [id, m] of Object.entries(members || {})) if (m && m.name) names[id] = m.name;
  for (const [id, m] of Object.entries(hq.mem || {})) if (m && m.name && !names[id]) names[id] = m.name;
  const isKid = (id) => !!kidsF[id];
  const kids = Object.keys(names).filter(isKid);
  const nm = (id) => names[id] || 'العائلة';
  const girl = (id) => !!(hq.cfg && hq.cfg[id] && hq.cfg[id].g === 'f');
  const send = (targets, payload) => {
    for (const [sid, s] of Object.entries(subs)) {
      if (!s || !s.e || !s.k || !s.m || !targets.has(s.m)) continue;
      out.push({ sid, sub: { endpoint: s.e, keys: s.k }, payload });
    }
  };
  const adultsBut = (id) => new Set(Object.keys(names).filter((m) => !isKid(m) && m !== id));
  for (const [id, x] of Object.entries(items)) {
    if (!x || !x.c) continue;
    if (now - x.c > KEEP) {
      for (const f of x.f || []) if (f && f.id) dels.push('/hqf/' + f.id);
      dels.push('/hq/items/' + id);
      continue;
    }
    if (!x.nt) {
      marks.push(['/hq/items/' + id + '/nt', 1]);
      if (now - x.c < LATE) {
        const to = x.to && Object.keys(x.to).length ? Object.keys(x.to) : kids;
        const head = x.ty === 'h' ? '📝 واجب جديد' : '📚 درس جديد';
        send(new Set(to), { title: head + ' · ' + (x.s || ''), body: title(x) + '\n' + (x.src === 't' ? 'من الأستاذ، أرسله ' : 'من ') + nm(x.by), tag: 'hq-' + id, url: SITE + '#o=' + id });
      }
    }
    for (const [k, t] of Object.entries(x.dn || {})) {
      if (x.dnn && x.dnn[k]) continue;
      marks.push(['/hq/items/' + id + '/dnn/' + k, 1]);
      if (now - t < LATE) send(adultsBut(k), { title: '✅ ' + nm(k) + (girl(k) ? ' أنهت: ' : ' أنهى: ') + title(x), body: [x.s, x.ty === 'h' ? 'واجب' : 'درس'].filter(Boolean).join(' · '), tag: 'hq-dn-' + id + k, url: SITE + '#o=' + id });
    }
  }
  for (const [id, g] of Object.entries(msgs)) {
    if (!g || !g.c) continue;
    if (now - g.c > KEEP) { dels.push('/hq/msgs/' + id); continue; }
    if (!g.nt) {
      marks.push(['/hq/msgs/' + id + '/nt', 1]);
      if (now - g.c < LATE) send(new Set(g.to && Object.keys(g.to).length ? Object.keys(g.to) : kids), { title: '💌 رسالة من ' + nm(g.by), body: String(g.t || ''), tag: 'hq-m-' + id, url: SITE });
    }
    for (const [k, t] of Object.entries(g.r || {})) {
      if (g.rn && g.rn[k]) continue;
      marks.push(['/hq/msgs/' + id + '/rn/' + k, 1]);
      if (now - t < LATE && g.by) send(new Set([g.by]), { title: '❤️ ' + nm(k) + (girl(k) ? ' تشكرك' : ' يشكرك'), body: String(g.t || ''), tag: 'hq-r-' + id + k, url: SITE });
    }
  }
  return { out, marks, dels };
}

async function getJson(path) {
  const r = await fetch(DB + path + '.json' + auth());
  if (!r.ok) throw new Error('read ' + r.status);
  return r.json();
}

async function main() {
  const now = Date.now();
  let jobs = [];
  if (process.env.DATA_FILE) {
    const d = JSON.parse(fs.readFileSync(process.env.DATA_FILE, 'utf8'));
    jobs = [{ code: 'file', hq: d.hq || {}, members: d.members || {} }];
  } else {
    if (!DB) throw new Error('DB is required');
    if (!SECRET) { console.log('DB_SECRET is not set'); return; }
    const r = await fetch(DB + '/pidx.json?shallow=true&auth=' + encodeURIComponent(SECRET));
    if (!r.ok) { console.log('could not list families:', r.status); return; }
    const codes = Object.keys((await r.json()) || {}).filter((c) => /^[A-Za-z0-9_-]{12,64}$/.test(c));
    for (const c of codes) {
      try {
        const hq = await getJson('/k/' + c + '/hq');
        if (!hq || (!hq.items && !hq.msgs)) continue;
        const members = (await getJson('/k/' + c + '/members')) || {};
        jobs.push({ code: c, hq, members });
      } catch (e) { console.log('read failed for one family:', e.message); }
    }
  }
  if (!DRY) { if (!PRIV || !PUB) throw new Error('VAPID keys are required'); webpush.setVapidDetails(SITE, PUB, PRIV); }
  let sent = 0, gone = 0, failed = 0, deleted = 0;
  for (const { code, hq, members } of jobs) {
    const { out, marks, dels } = plan(hq, members, now);
    console.log(`family: to_send=${out.length} marks=${marks.length} deletes=${dels.length}`);
    if (DRY) { for (const o of out) console.log('---', o.payload.title + ' | ' + o.payload.body.replace(/\n/g, ' / ')); for (const d of dels) console.log('del', d.split('/').slice(0, 3).join('/')); continue; }
    for (const o of out) {
      try { await webpush.sendNotification(o.sub, JSON.stringify(o.payload), { TTL: 6 * 3600, urgency: 'high' }); sent++; }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone++; await fetch(DB + '/k/' + code + '/hq/subs/' + o.sid + '.json' + auth(), { method: 'DELETE' }).catch(() => {}); }
        else { failed++; console.log('send failed', e.statusCode || e.message); }
      }
    }
    for (const [p, v] of marks) await fetch(DB + '/k/' + code + p + '.json' + auth(), { method: 'PUT', body: JSON.stringify(v) }).catch(() => {});
    for (const p of dels) { await fetch(DB + '/k/' + code + p + '.json' + auth(), { method: 'DELETE' }).catch(() => {}); deleted++; }
  }
  console.log(`families=${jobs.length} sent=${sent} removed_expired_subs=${gone} failed=${failed} deleted=${deleted}`);
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { plan };
