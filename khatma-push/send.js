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
  if (s === 'am' || s === 'pm') return s;
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

function buildMessages(data, msgs, slot, now) {
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
      body = finish(fill(t, ctx));
    } else {
      if (!m) continue; // evening reminders are personal
      const need = target(dn) - p;
      if (need <= 0) continue; // already read today's portion
      title = 'لم تُتمّ وِرد اليوم بعد';
      body = 'يا ' + m.name + '، بقي لك ' + pages(need) + ' لتُتمّ وِرد اليوم ' + dn + ' من «' + k.name + '».\n' +
        'اقرأها قبل أن تنام، فـ«أحب الأعمال إلى الله أدومها وإن قل».';
    }
    out.push({ id, sub: { endpoint: s.e, keys: s.k }, payload: { title, body, tag: 'khatma-' + slot, url: SITE } });
  }
  return { dn, out };
}

async function main() {
  const msgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'msgs.json'), 'utf8'));
  const slot = slotNow(), now = new Date();
  let data;
  if (process.env.DATA_FILE) data = JSON.parse(fs.readFileSync(process.env.DATA_FILE, 'utf8'));
  else {
    if (!DB || !CODE) throw new Error('DB and KHATMA_CODE are required');
    const r = await fetch(DB + '/k/' + CODE + '.json');
    if (!r.ok) throw new Error('Firebase read failed: ' + r.status);
    data = await r.json();
  }
  if (!data || !data.khatma) { console.log('No khatma found for this code.'); return; }
  const { dn, out } = buildMessages(data, msgs, slot, now);
  console.log(`slot=${slot} day=${dn} subscriptions=${Object.keys(data.subs || {}).length} to_send=${out.length}`);
  if (DRY) { for (const o of out) console.log('---', o.id, '\n' + o.payload.title + '\n' + o.payload.body); return; }
  if (!PRIV || !PUB) throw new Error('VAPID keys are required');
  webpush.setVapidDetails(SITE, PUB, PRIV);
  let sent = 0, gone = 0, failed = 0;
  for (const o of out) {
    try {
      await webpush.sendNotification(o.sub, JSON.stringify(o.payload), { TTL: 6 * 3600 });
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        gone++;
        await fetch(DB + '/k/' + CODE + '/subs/' + o.id + '.json', { method: 'DELETE' }).catch(() => {});
      } else { failed++; console.log('send failed', o.id, e.statusCode || e.message); }
    }
  }
  console.log(`sent=${sent} removed_expired=${gone} failed=${failed}`);
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { buildMessages, fill, dayNo };
