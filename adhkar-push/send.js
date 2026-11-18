// Sends reminders for «أذكار العائلة»: morning, evening and bedtime.
// Runs on a schedule in GitHub Actions. A reminder goes only to a member who has not finished that session today.
const fs = require('fs');
const webpush = require('web-push');

const DB = (process.env.DB || '').replace(/\/+$/, '');
const PRIV = process.env.VAPID_PRIVATE || '';
const PUB = process.env.VAPID_PUBLIC || '';
const SITE = process.env.SITE || 'https://tiloucloud.github.io/adhkar/';
const DRY = process.env.DRY_RUN === '1';
const SLOTS = { am: { bit: 0, h: [4, 11] }, pm: { bit: 1, h: [14, 19] }, nt: { bit: 2, h: [19, 23] } };

const LINES = {
  am: ['«مَثَلُ الذي يذكر ربَّه والذي لا يذكر ربَّه مَثَلُ الحيِّ والميِّت» (البخاري)', '﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾', '﴿فَاذْكُرُونِي أَذْكُرْكُمْ﴾'],
  pm: ['«أحبُّ الأعمال إلى الله أدومُها وإن قلّ» (متفق عليه)', '﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾', '﴿فَاذْكُرُونِي أَذْكُرْكُمْ﴾'],
  nt: ['«أحبُّ الأعمال إلى الله أدومُها وإن قلّ» (متفق عليه)', '﴿فَاذْكُرُونِي أَذْكُرْكُمْ﴾', '﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾'],
};
const TITLE = { am: 'أذكار الصباح', pm: 'أذكار المساء', nt: 'أذكار النوم' };
const WHAT = { am: 'أذكار الصباح', pm: 'أذكار المساء', nt: 'أذكار النوم' };

const iso = (d) => d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
const dayIso = (now, o) => iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - o)));
const bits = (v) => { let n = 0; while (v) { n += v & 1; v >>= 1; } return n; };
const daysWord = (n) => n === 1 ? 'يوم' : n === 2 ? 'يومان' : n <= 10 ? 'أيام' : 'يوماً';

function streak(done, id, now) {
  const get = (o) => ((done[id] || {})[dayIso(now, o)] | 0);
  const ok = (o) => (get(o) & 3) === 3;
  let n = 0;
  for (let o = ok(0) ? 0 : 1; o < 400 && ok(o); o++) n++;
  return n;
}
function famGoal(members, done, now) {
  const w = (now.getUTCDay() + 1) % 7; // the week starts on Saturday
  const ids = Object.keys(members);
  let n = 0;
  for (const id of ids) for (let o = 0; o <= w; o++) n += bits(((done[id] || {})[dayIso(now, o)] | 0) & 7);
  return [n, ids.length * 21];
}

function buildMessages(ad, slot, now) {
  const members = ad.members || {}, done = ad.done || {}, subs = ad.subs || {};
  const cfg = SLOTS[slot], out = [];
  const today = dayIso(now, 0);
  const seq = Math.floor(now.getTime() / 864e5);
  for (const [id, s] of Object.entries(subs)) {
    if (!s || !s.e || !s.k || !s.m || !members[s.m]) continue;
    const m = members[s.m], v = ((done[s.m] || {})[today] | 0);
    if ((v >> cfg.bit) & 1) continue; // already finished
    const st = streak(done, s.m, now);
    let body = 'يا ' + m.name + '، لم تُتمّ ' + WHAT[slot] + ' بعد.';
    if (slot !== 'nt' && st > 0) body += '\nسلسلتك ' + st + ' ' + daysWord(st) + '، فلا تقطعها 🌟';
    if (slot === 'nt') { const g = famGoal(members, done, now); if (g[1]) body += '\nالعائلة أتمّت ' + g[0] + ' من ' + g[1] + ' ذِكراً هذا الأسبوع.'; }
    body += '\n' + LINES[slot][seq % LINES[slot].length];
    out.push({ id, sub: { endpoint: s.e, keys: s.k }, payload: { title: TITLE[slot] + ' · ' + (ad.info && ad.info.name || 'أذكار العائلة'), body, tag: 'adhkar-' + slot, url: SITE } });
  }
  return out;
}

async function listCodes() {
  const SECRET = process.env.DB_SECRET || '';
  if (!SECRET) { console.log('DB_SECRET is not set'); return []; }
  const r = await fetch(DB + '/pidx.json?shallow=true&auth=' + encodeURIComponent(SECRET));
  if (!r.ok) { console.log('could not list registered families:', r.status); return []; }
  return Object.keys((await r.json()) || {}).filter((c) => /^[A-Za-z0-9_-]{12,64}$/.test(c));
}

async function main() {
  const slot = (process.env.SLOT || '').trim();
  if (!SLOTS[slot]) throw new Error('SLOT must be am, pm or nt');
  const now = new Date(), h = now.getUTCHours();
  if (!process.env.FORCE && (h < SLOTS[slot].h[0] || h >= SLOTS[slot].h[1])) { console.log(`slot=${slot} started at ${h}:00 UTC, outside its window; skipping.`); return; }
  let jobs = [];
  if (process.env.DATA_FILE) jobs = [{ code: 'file', ad: JSON.parse(fs.readFileSync(process.env.DATA_FILE, 'utf8')) }];
  else {
    if (!DB) throw new Error('DB is required');
    for (const c of await listCodes()) {
      const r = await fetch(DB + '/k/' + c + '/ad.json');
      if (!r.ok) { console.log('read failed for one family:', r.status); continue; }
      const ad = (await r.json()) || {};
      if (!ad.members) { // linked to the khatma family: same members
        const mr = await fetch(DB + '/k/' + c + '/members.json');
        if (mr.ok) ad.members = (await mr.json()) || undefined;
        ad.info = ad.info || { name: 'أذكار عائلتنا' };
      }
      jobs.push({ code: c, ad });
    }
  }
  if (!DRY) { if (!PRIV || !PUB) throw new Error('VAPID keys are required'); webpush.setVapidDetails(SITE, PUB, PRIV); }
  let sent = 0, gone = 0, failed = 0, fams = 0;
  for (const { code, ad } of jobs) {
    if (!ad || !ad.members) continue;
    fams++;
    const out = buildMessages(ad, slot, now);
    console.log(`family #${fams}: slot=${slot} subscriptions=${Object.keys(ad.subs || {}).length} to_send=${out.length}`);
    if (DRY) { for (const o of out) console.log('---', o.id, '\n' + o.payload.title + '\n' + o.payload.body); continue; }
    for (const o of out) {
      try { await webpush.sendNotification(o.sub, JSON.stringify(o.payload), { TTL: 4 * 3600 }); sent++; }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone++; await fetch(DB + '/k/' + code + '/ad/subs/' + o.id + '.json', { method: 'DELETE' }).catch(() => {}); }
        else { failed++; console.log('send failed', o.id, e.statusCode || e.message); }
      }
    }
  }
  console.log(`families=${fams} sent=${sent} removed_expired=${gone} failed=${failed}`);
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { buildMessages, streak, famGoal };
