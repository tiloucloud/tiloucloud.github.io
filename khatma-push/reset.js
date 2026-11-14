// One-off: set every family member's progress back to page 0, restart the khatma today,
// and bump the reset counter so phones forget the pages they had counted locally.
const DB = (process.env.DB || '').replace(/\/+$/, '');
const CODE = process.env.KHATMA_CODE || '';
const START = process.env.START;
(async () => {
  if (!DB || !CODE || !START) throw new Error('DB, KHATMA_CODE and START are required');
  const r = await fetch(DB + '/k/' + CODE + '.json');
  const d = await r.json();
  if (!d || !d.khatma || !d.members) throw new Error('khatma not found');
  const before = Object.values(d.members).map((m) => m.name + ':' + m.p).join(', ');
  const patch = { 'khatma/start': START, 'khatma/r': (+d.khatma.r || 0) + 1 };
  for (const id of Object.keys(d.members)) patch['members/' + id + '/p'] = 0;
  const w = await fetch(DB + '/k/' + CODE + '.json', { method: 'PATCH', body: JSON.stringify(patch) });
  if (!w.ok) throw new Error('write failed ' + w.status);
  const a = await (await fetch(DB + '/k/' + CODE + '.json')).json();
  console.log('before:', before);
  console.log('after: ', Object.values(a.members).map((m) => m.name + ':' + m.p).join(', '));
  console.log('khatma:', JSON.stringify(a.khatma));
})().catch((e) => { console.error(e.message); process.exit(1); });
