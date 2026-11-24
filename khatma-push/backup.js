// Nightly backup of every family (khatma and adhkar) into /bk/<date>,
// a path the database rules give no public access to: only this script,
// holding the database secret, can read or write it.
// Keeps the last KEEP days. Restore one family with MODE=restore CODE=… DATE=YYYY-MM-DD.
'use strict';
const DB = (process.env.DB || '').replace(/\/+$/, '');
const SECRET = process.env.DB_SECRET || '';
const KEEP = 7;
const q = (extra) => '?auth=' + encodeURIComponent(SECRET) + (extra || '');

async function req(path, opt, extra) {
  const r = await fetch(DB + path + '.json' + q(extra), opt);
  if (!r.ok) throw new Error((opt && opt.method || 'GET') + ' ' + path.replace(/\/k\/[^/]+/, '/k/…') + ' → HTTP ' + r.status);
  return r.json();
}

async function backup() {
  const day = new Date().toISOString().slice(0, 10);
  const k = await req('/k');
  const pidx = await req('/pidx').catch(() => null);
  const n = k ? Object.keys(k).length : 0;
  await req('/bk/' + day, { method: 'PUT', body: JSON.stringify({ at: Date.now(), k: k || {}, pidx: pidx || {} }) });
  const days = Object.keys((await req('/bk', null, '&shallow=true')) || {}).sort();
  for (const d of days.slice(0, Math.max(0, days.length - KEEP))) await req('/bk/' + d, { method: 'DELETE' });
  console.log('backup ' + day + ': ' + n + ' families saved; keeping ' + Math.min(days.length, KEEP) + ' days');
}

async function restore() {
  const code = process.env.CODE || '', day = process.env.DATE || '';
  if (!/^[A-Za-z0-9_-]{12,40}$/.test(code) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('restore needs CODE and DATE (YYYY-MM-DD)');
  const snap = await req('/bk/' + day + '/k/' + code);
  if (!snap) throw new Error('no copy of this family on ' + day);
  await req('/k/' + code, { method: 'PUT', body: JSON.stringify(snap) });
  console.log('restored one family from ' + day);
}

(async () => {
  if (!DB || !SECRET) { console.error('DB and DB_SECRET (repository secret FIREBASE_DB_SECRET) are required for backups'); process.exit(1); }
  if ((process.env.MODE || 'backup') === 'restore') await restore(); else await backup();
})().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
