// Sends task/appointment reminders for «مهام العائلة».
// Runs every 15 minutes in GitHub Actions. A task is reminded once, when its reminder time (ra) has passed,
// to the members it is assigned to (or to everyone when nobody is assigned), unless it is already done.
const fs = require('fs');
const webpush = require('web-push');

const DB = (process.env.DB || '').replace(/\/+$/, '');
const PRIV = process.env.VAPID_PRIVATE || '';
const PUB = process.env.VAPID_PUBLIC || '';
const SECRET = process.env.DB_SECRET || '';
const SITE = process.env.SITE || 'https://tiloucloud.github.io/tasks/';
const DRY = process.env.DRY_RUN === '1';
const LATE = 3 * 3600e3; // skip reminders older than 3 hours (e.g. after an outage)

const auth = () => (SECRET ? '?auth=' + encodeURIComponent(SECRET) : '');
const tmLab = (tm) => { if (!tm) return ''; const [h, m] = tm.split(':'); const n = +h; return (n % 12 || 12) + ':' + m + (n < 12 ? ' ص' : ' م'); };
function whenText(t) {
  const at = t.tm ? ' (' + tmLab(t.tm) + ')' : '';
  if (t.rm === 0) return t.tm ? 'حان الموعد الآن' + at : 'موعدها اليوم';
  if (t.rm === 15) return 'بعد 15 دقيقة' + at;
  if (t.rm === 60) return 'بعد ساعة' + at;
  if (t.rm === 1440) return 'غداً' + at;
  return '';
}

// Returns the messages to send and the tasks to mark as reminded.
function buildMessages(tk, members, now) {
  const tasks = tk.tasks || {}, subs = tk.subs || {}, out = [], marks = [];
  const visible = Object.keys(members || {}).filter((id) => members[id] && members[id].name && !members[id].x);
  for (const [tid, t] of Object.entries(tasks)) {
    if (!t || !t.ra || t.dn || t.rs === t.ra) continue;
    if (t.ra > now) continue;
    marks.push(tid);
    if (now - t.ra > LATE) continue;
    const who = Object.keys(t.as || {}).filter((id) => members[id]);
    const targets = new Set(who.length ? who : visible);
    const names = who.map((id) => members[id].name).join('، ');
    for (const [sid, s] of Object.entries(subs)) {
      if (!s || !s.e || !s.k || !s.m || !targets.has(s.m)) continue;
      let body = whenText(t);
      if (names) body += (body ? '\n' : '') + '👥 ' + names;
      if (t.n) body += (body ? '\n' : '') + t.n;
      out.push({ sid, sub: { endpoint: s.e, keys: s.k }, payload: { title: '🔔 ' + t.t, body, tag: 'tk-' + tid, url: SITE + '#tab=' + (who.length ? 'mine' : 'tasks') } });
    }
  }
  return { out, marks };
}

async function getJson(path) {
  const r = await fetch(DB + path + '.json' + auth());
  if (!r.ok) throw new Error('read ' + r.status);
  return r.json();
}

async function main() {
  let jobs = [];
  const now = Date.now();
  if (process.env.DATA_FILE) {
    const d = JSON.parse(fs.readFileSync(process.env.DATA_FILE, 'utf8'));
    jobs = [{ code: 'file', tk: d.tk || {}, members: d.members || {} }];
  } else {
    if (!DB) throw new Error('DB is required');
    if (!SECRET) { console.log('DB_SECRET is not set'); return; }
    const r = await fetch(DB + '/pidx.json?shallow=true&auth=' + encodeURIComponent(SECRET));
    if (!r.ok) { console.log('could not list families:', r.status); return; }
    const codes = Object.keys((await r.json()) || {}).filter((c) => /^[A-Za-z0-9_-]{12,64}$/.test(c));
    for (const c of codes) {
      try {
        const subs = await getJson('/k/' + c + '/tk/subs');
        if (!subs) continue;
        const tasks = await getJson('/k/' + c + '/tk/tasks');
        if (!tasks) continue;
        const members = (await getJson('/k/' + c + '/members')) || {};
        jobs.push({ code: c, tk: { subs, tasks }, members });
      } catch (e) { console.log('read failed for one family:', e.message); }
    }
  }
  if (!DRY) { if (!PRIV || !PUB) throw new Error('VAPID keys are required'); webpush.setVapidDetails(SITE, PUB, PRIV); }
  let sent = 0, gone = 0, failed = 0;
  for (const { code, tk, members } of jobs) {
    const { out, marks } = buildMessages(tk, members, now);
    console.log(`family: due_tasks=${marks.length} to_send=${out.length}`);
    if (DRY) { for (const o of out) console.log('---', o.payload.title + '\n' + o.payload.body); continue; }
    for (const o of out) {
      try { await webpush.sendNotification(o.sub, JSON.stringify(o.payload), { TTL: 3600 }); sent++; }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone++; await fetch(DB + '/k/' + code + '/tk/subs/' + o.sid + '.json' + auth(), { method: 'DELETE' }).catch(() => {}); }
        else { failed++; console.log('send failed', e.statusCode || e.message); }
      }
    }
    for (const tid of marks) {
      await fetch(DB + '/k/' + code + '/tk/tasks/' + tid + '.json' + auth(), { method: 'PATCH', body: JSON.stringify({ rs: tk.tasks[tid].ra }) }).catch(() => {});
    }
  }
  console.log(`families=${jobs.length} sent=${sent} removed_expired=${gone} failed=${failed}`);
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { buildMessages };
