// Checks firestore.rules against the Firestore emulator, writing over REST
// with no sign-in exactly like the app's usage counts and error reports do
// (and that the old email sign-up collection stays closed). Run before every deploy (see the deploy workflow):
//   npx firebase-tools emulators:exec --only firestore --project demo-hoot "node scripts/check-rules.mjs"
const B = 'http://127.0.0.1:8080/v1/projects/demo-hoot/databases/(default)/documents';
const res = async (p, o) => (await fetch(B + p, { ...o, headers: { 'content-type': 'application/json' } })).status;
const commit = writes => res(':commit', { method: 'POST', body: JSON.stringify({ writes }) });
const doc = p => `projects/demo-hoot/databases/(default)/documents/${p}`;
const inc = (p, n) => commit([{ transform: { document: doc(p), fieldTransforms: [{ fieldPath: 'n', increment: { integerValue: String(n) } }] } }]);
const out = {};
out.countOk = await inc('stats/2026-11-07/events/tab.health', 3);
out.countAgain = await inc('stats/2026-11-07/events/tab.health', 2);
out.countTooBig = await inc('stats/2026-11-07/events/tab.health', 500);
out.countBadName = await inc('stats/2026-11-07/events/Bad Name!', 1);
out.statsRead = await res('/stats/2026-11-07/events/tab.health');
const err = { msg: { stringValue: 'TypeError: x' }, where: { stringValue: 'render' }, stack: { stringValue: '' }, ua: { stringValue: 'test' }, day: { stringValue: '2026-11-07' } };
out.errorOk = await res('/errors', { method: 'POST', body: JSON.stringify({ fields: err }) });
out.errorExtra = await res('/errors', { method: 'POST', body: JSON.stringify({ fields: { ...err, email: { stringValue: 'a@b.c' } } }) });
out.errorsList = await res('/errors');
const tok = 'a'.repeat(36);
const sub = (t, extra = {}) => commit([{ update: { name: doc(`subscribers/${t}`), fields: { email: { stringValue: 'reader@example.com' }, lang: { stringValue: 'en' }, freq: { stringValue: 'daily' }, confirmed: { booleanValue: false }, ...extra } }, currentDocument: { exists: false }, updateTransforms: [{ fieldPath: 'created', setToServerValue: 'REQUEST_TIME' }] }]);
out.subOk = await sub(tok);
out.subPreConfirmed = await sub('b'.repeat(36), { confirmed: { booleanValue: true } });
out.subRead = await res(`/subscribers/${tok}`);
out.subList = await res('/subscribers');
out.confirm = await res(`/subscribers/${tok}?updateMask.fieldPaths=confirmed&currentDocument.exists=true`, { method: 'PATCH', body: JSON.stringify({ fields: { confirmed: { booleanValue: true } } }) });
out.changeEmail = await res(`/subscribers/${tok}?updateMask.fieldPaths=email`, { method: 'PATCH', body: JSON.stringify({ fields: { email: { stringValue: 'x@y.z' } } }) });
out.unsubscribe = await res(`/subscribers/${tok}`, { method: 'DELETE' });
out.userData = await res('/users/someone/data/hoot.saved');
const expected = {
  countOk: 200, countAgain: 200, countTooBig: 403, countBadName: 403, statsRead: 403,
  errorOk: 200, errorExtra: 403, errorsList: 403,
  subOk: 403, subPreConfirmed: 403, subRead: 403, subList: 403, confirm: 403, changeEmail: 403, unsubscribe: 403,
  userData: 403,
};
let bad = 0;
for (const [k, v] of Object.entries(expected)) {
  const ok = out[k] === v;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${k}: got ${out[k]}, want ${v}`);
}
process.exit(bad ? 1 : 0);
