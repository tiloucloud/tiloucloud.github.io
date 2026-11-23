// Sends the family's morning and evening Quran notifications.
// Runs on a schedule in GitHub Actions. Reads the khatma from Firebase, picks
// the day's message, and pushes it to every phone that turned notifications on.
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const DB = (process.env.DB || '').replace(/\/+$/, '');
const CODE = process.env.KHATMA_CODE || '';
const PRIV = process.env.VAPID_PRIVATE || '';
const PUB = process.env.VAPID_PUBLIC || '';
const SITE = process.env.SITE || 'https://tiloucloud.github.io/khatma/';
const DRY = process.env.DRY_RUN === '1';
const LAST = 604;

function slotNow() {
  const s = (process.env.SLOT || '').trim();
  if (s === 'am' || s === 'pm' || s === 'kahf' || s === 'night' || s === 'fs') return s;
  return new Date().getUTCHours() < 13 ? 'am' : 'pm';
}
function dayNo(k, now) {
  const [y, m, d] = k.start.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((today - start) / 864e5) + 1;
}
const pages = (n) => n === 1 ? 'صفحة واحدة' : n === 2 ? 'صفحتان' : n <= 10 ? n + ' صفحات' : n + ' صفحة';

function fill(t, ctx) {
  return t.replace(/\{k\}/g, ctx.k).replace(/\{d\}/g, ctx.d).replace(/\{p\}/g, ctx.p).replace(/\{day\}/g, ctx.day)
    .replace(/\{left\}/g, ctx.left).replace(/\{fam\}/g, ctx.fam).replace(/:?\n?\{link\}/g, '').replace(/\n\n\n+/g, '\n\n').trim();
}
function finish(t) { return /[.!؟?»﴾﴿)\]]$/.test(t) ? t : t + '.'; }

// Sunnah reminders (Kahf on Friday, Mulk and Waqi'a every night) go to every
// subscribed phone, whatever the khatma's day or the member's progress.
function buildSunan(data, msgs, slot, now) {
  const sn = msgs.sunan[slot], subs = data.subs || {};
  const n = Math.floor(now.getTime() / 864e5);
  let body = sn.f[n % sn.f.length] + '\n' + sn.end;
  if (slot === 'night' && now.getUTCDay() === 4) body += '\n' + sn.thu;
  const out = [];
  for (const [id, s] of Object.entries(subs)) {
    if (!s || !s.e || !s.k) continue;
    out.push({ id, sub: { endpoint: s.e, keys: s.k }, payload: { title: sn.title, body, tag: 'khatma-' + slot, url: SITE } });
  }
  return { dn: data.khatma ? dayNo(data.khatma, now) : 0, out };
}

// Focus sessions shared in the family council since the last run: tell the
// rest of the family, and tell a session's author about new comments on it.
const mins = (n) => n === 1 ? 'دقيقة واحدة' : n === 2 ? 'دقيقتان' : n <= 10 ? n + ' دقائق' : n + ' دقيقة';
function buildFs(data, since, now) {
  const members = data.members || {}, subs = data.subs || {}, fsd = data.fs || {};
  const name = (id) => (members[id] && members[id].name) || 'أحد أفراد العائلة';
  const fresh = (t) => +t > since && +t <= now.getTime() && now.getTime() - t < 12 * 3600e3;
  const sess = [], com = [];
  for (const [id, x] of Object.entries(fsd)) {
    if (!x || !x.m) continue;
    if (fresh(x.at)) sess.push(x);
    for (const c of Object.values(x.c || {})) if (c && c.m && c.x && c.m !== x.m && fresh(c.at)) com.push({ to: x.m, c });
  }
  const out = [];
  for (const [id, s] of Object.entries(subs)) {
    if (!s || !s.e || !s.k) continue;
    const mine = sess.filter((x) => x.m !== s.m);
    const cs = com.filter((z) => z.to === s.m && z.c.m !== s.m);
    let title, body;
    if (mine.length) {
      const who = [...new Set(mine.map((x) => name(x.m)))];
      const tot = mine.reduce((t, x) => t + (+x.min || 0), 0);
      title = '🌿 ' + (who.length === 1 ? who[0] : who.slice(0, -1).join('، ') + ' و' + who[who.length - 1]) + ' في مجلس العائلة';
      const q = mine.find((x) => x.x);
      body = (mine.length === 1 ? 'جلسة تركيز مع القرآن: ' : 'جلسات تركيز مع القرآن: ') + mins(tot) + '.' +
        (q ? '\n«' + String(q.x).slice(0, 90) + (String(q.x).length > 90 ? '…' : '') + '»' : '') + '\nشجّعوا بعضكم بـ«تقبّل الله» وشاركوا في النقاش.'
      if (cs.length) body += '\n💬 وعلى جلستك تعليق جديد من ' + [...new Set(cs.map((z) => name(z.c.m)))].join('، ') + '.';
    } else if (cs.length) {
      const who = [...new Set(cs.map((z) => name(z.c.m)))];
      title = '💬 تعليق جديد على جلستك';
      body = who.join('، ') + ': «' + String(cs[cs.length - 1].c.x).slice(0, 90) + '»';
    } else continue;
    out.push({ id, sub: { endpoint: s.e, keys: s.k }, payload: { title, body, tag: 'khatma-fs', url: SITE } });
  }
  return out;
}

function buildMessages(data, msgs, slot, now) {
  if (slot === 'kahf' || slot === 'night') return buildSunan(data, msgs, slot, now);
  const k = data.khatma, members = data.members || {}, subs = data.subs || {};
  const days = k.days, daily = Math.ceil(LAST / days), dn = dayNo(k, now);
  if (dn < 1 || dn > days) return { dn, out: [] };
  const target = (x) => Math.min(LAST, Math.ceil(LAST * Math.max(0, x) / days));
  const fam = Object.values(members).reduce((t, m) => t + (+m.p || 0), 0);
  const ctx = { k: k.name, d: days, p: daily, day: dn, left: Math.max(0, days - dn), fam };
  const out = [];
  for (const [id, s] of Object.entries(subs)) {
    if (!s || !s.e || !s.k) continue;
    const m = members[s.m] || null;
    const p = m ? (+m.p || 0) : 0;
    if (m && p >= LAST) continue; // finished the khatma: nothing more to remind
    let title, body;
    if (slot === 'am') {
      const t = msgs.daily[(dn - 1) % msgs.daily.length];
      title = 'وِرد اليوم ' + dn + ' · ' + k.name;
      const PR = ['وهل صلّيتم الفجر؟ «الصلاة نور» 🕌', 'حافظوا على الصلوات الخمس في أوقاتها 🕌', 'ابدؤوا يومكم بالصلاة، فهي أحبّ الأعمال إلى الله 🕌'];
      body = finish(fill(t, ctx)) + '\n' + PR[(dn - 1) % PR.length];
    } else {
      if (!m) continue; // evening reminders are personal
      const need = target(dn) - p;
      if (need <= 0) continue; // already read today's portion
      title = 'لم تُتمّ وِرد اليوم بعد';
      body = 'يا ' + m.name + '، بقي لك ' + pages(need) + ' لتُتمّ وِرد اليوم ' + dn + ' من «' + k.name + '».\n' +
        'اقرأها قبل أن تنام، فـ«أحب الأعمال إلى الله أدومها وإن قل».\nولا تنسَ صلاة العشاء 🕌';
    }
    out.push({ id, sub: { endpoint: s.e, keys: s.k }, payload: { title, body, tag: 'khatma-' + slot, url: SITE } });
  }
  return { dn, out };
}

// Every khatma that turned on notifications registers itself under /pidx.
// That list is private (rules deny reads), so it is read with the database
// secret when one is configured; without it only KHATMA_CODE is served.
async function listCodes() {
  const codes = new Set(CODE ? [CODE] : []);
  const SECRET = process.env.DB_SECRET || '';
  if (SECRET) {
    const r = await fetch(DB + '/pidx.json?shallow=true&auth=' + encodeURIComponent(SECRET));
    if (r.ok) Object.keys((await r.json()) || {}).forEach((c) => codes.add(c));
    else console.log('could not list registered khatmas:', r.status);
  }
  return [...codes].filter((c) => /^[A-Za-z0-9_-]{12,64}$/.test(c));
}

async function main() {
  const msgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'msgs.json'), 'utf8'));
  const slot = slotNow(), now = new Date();
  const h = now.getUTCHours();
  const late = { am: h >= 12, pm: h >= 22 || h < 12, kahf: h < 5 || h >= 16, night: h < 19 || h >= 23, fs: h < 7 || h >= 22 }[slot];
  if (!process.env.FORCE && late) {
    console.log(`slot=${slot} started too late (${h}:00 UTC); skipping so nobody is woken up.`); return;
  }
  let jobs;
  if (process.env.DATA_FILE) jobs = [{ code: CODE || 'file', data: JSON.parse(fs.readFileSync(process.env.DATA_FILE, 'utf8')) }];
  else {
    if (!DB) throw new Error('DB is required');
    jobs = [];
    for (const c of await listCodes()) {
      const r = await fetch(DB + '/k/' + c + '.json');
      if (!r.ok) { console.log('read failed for one khatma:', r.status); continue; }
      jobs.push({ code: c, data: await r.json() });
    }
  }
  if (!DRY) { if (!PRIV || !PUB) throw new Error('VAPID keys are required'); webpush.setVapidDetails(SITE, PUB, PRIV); }
  let sent = 0, gone = 0, failed = 0, fams = 0;
  for (const { code, data } of jobs) {
    if (!data || !data.khatma) continue;
    let dn = 0, out;
    if (slot === 'fs') {
      if (!data.fs) continue;
      const since = +data.fsn || 0;
      out = since ? buildFs(data, since, now) : []; // first run only sets the marker, so old sessions are not announced
      if (!DRY && DB && process.env.DATA_FILE == null) {
        const SECRET = process.env.DB_SECRET || '';
        await fetch(DB + '/k/' + code + '/fsn.json' + (SECRET ? '?auth=' + encodeURIComponent(SECRET) : ''), { method: 'PUT', body: String(now.getTime()) }).catch(() => {});
      }
    } else ({ dn, out } = buildMessages(data, msgs, slot, now));
    fams++;
    console.log(`khatma #${fams}: slot=${slot} day=${dn} subscriptions=${Object.keys(data.subs || {}).length} to_send=${out.length}`);
    if (DRY) { for (const o of out) console.log('---', o.id, '\n' + o.payload.title + '\n' + o.payload.body); continue; }
    for (const o of out) {
      try {
        await webpush.sendNotification(o.sub, JSON.stringify(o.payload), { TTL: 6 * 3600 });
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          gone++;
          await fetch(DB + '/k/' + code + '/subs/' + o.id + '.json', { method: 'DELETE' }).catch(() => {});
        } else { failed++; console.log('send failed', o.id, e.statusCode || e.message); }
      }
    }
  }
  console.log(`khatmas=${fams} sent=${sent} removed_expired=${gone} failed=${failed}`);
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { buildMessages, buildFs, fill, dayNo };
