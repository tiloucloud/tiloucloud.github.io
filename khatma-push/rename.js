// One-off: rename the family khatma without touching anyone's progress.
const DB = (process.env.DB || '').replace(/\/+$/, '');
const CODE = process.env.KHATMA_CODE || '';
const NAME = process.env.NAME || '';
(async () => {
  if (!DB || !CODE || !NAME) throw new Error('DB, KHATMA_CODE and NAME are required');
  const before = await (await fetch(DB + '/k/' + CODE + '/khatma/name.json')).json();
  if (before == null) throw new Error('khatma not found');
  const w = await fetch(DB + '/k/' + CODE + '/khatma.json', { method: 'PATCH', body: JSON.stringify({ name: NAME }) });
  if (!w.ok) throw new Error('write failed ' + w.status);
  const after = await (await fetch(DB + '/k/' + CODE + '/khatma/name.json')).json();
  console.log('before:', before);
  console.log('after:', after);
})().catch((e) => { console.error(e.message); process.exit(1); });
