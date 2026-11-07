// Hoot's daily report, run by .github/workflows/report.yml.
//
// Reads yesterday's anonymous usage counts and any new error reports from
// Firestore, posts a short summary as a comment on the "Hoot daily report"
// GitHub issue (so the owner gets a notification), opens an issue when there
// are new errors, then clears the error reports it has read.
//
// Firestore access uses the same FIREBASE_TOKEN the deploy uses: it's a
// Firebase CLI refresh token, exchanged here for a short-lived access token.
import { execFileSync } from 'node:child_process';

const PROJECT = process.env.FIREBASE_PROJECT || 'project-b9f72b7f-699d-46ed-aec';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
// The Firebase CLI's public OAuth client (open-source, not a secret).
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function accessToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: process.env.FIREBASE_TOKEN, client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error(`token ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}
const dayKey = d => d.toISOString().slice(0, 10);
const num = v => Number(v?.integerValue ?? 0);

async function listAll(token, path) {
  const out = [];
  let pageToken = '';
  do {
    const r = await fetch(`${BASE}/${path}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`, { headers: { authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`list ${path} ${r.status}`);
    const j = await r.json();
    out.push(...(j.documents ?? []));
    pageToken = j.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();

const token = await accessToken();
const today = new Date();
const days = Array.from({ length: 7 }, (_, i) => dayKey(new Date(today.getTime() - (i + 1) * 864e5)));
const counts = {};
for (const d of days) {
  for (const doc of await listAll(token, `stats/${d}/events`)) {
    const e = doc.name.split('/').pop();
    (counts[e] ??= {})[d] = num(doc.fields?.n);
  }
}
const y = days[0];
const sum = e => days.reduce((n, d) => n + (counts[e]?.[d] ?? 0), 0);
const group = prefix => Object.keys(counts).filter(e => e.startsWith(prefix)).map(e => [e.slice(prefix.length), counts[e][y] ?? 0, sum(e)]).filter(r => r[2] > 0).sort((a, b) => b[2] - a[2]);
const table = (title, rows) => (rows.length ? [`**${title}** (yesterday · last 7 days)`, ...rows.map(([k, a, b]) => `- ${k}: ${a} · ${b}`), ''] : []);

const errors = await listAll(token, 'errors');
const byMsg = {};
for (const e of errors) {
  const f = e.fields ?? {};
  const k = f.msg?.stringValue ?? '?';
  (byMsg[k] ??= { n: 0, where: f.where?.stringValue, stack: f.stack?.stringValue, ua: f.ua?.stringValue }).n++;
}

const lines = [
  `## Hoot on ${y}`,
  '',
  `**Visitors** (devices that opened Hoot): ${counts['visit.day']?.[y] ?? 0} yesterday · ${sum('visit.day')} over the last 7 days`,
  '',
  ...table('Pages opened', group('tab.')),
  ...table('Games opened', group('game.open.')),
  ...table('Games won', group('game.solved.')),
  ...table('Shared', group('share.')),
  ...table('Other', Object.keys(counts).filter(e => !/^(visit|tab|game|share)\./.test(e)).map(e => [e, counts[e][y] ?? 0, sum(e)]).filter(r => r[2] > 0)),
  `**Errors reported:** ${errors.length}${errors.length ? ' (see the error issue)' : ' 🎉'}`,
];
const report = lines.join('\n');
console.log(report);

// One long-running issue collects the daily reports as comments.
const repo = process.env.GITHUB_REPOSITORY;
let issue = gh('issue', 'list', '-R', repo, '--state', 'open', '--search', 'in:title "Hoot daily report"', '--json', 'number', '-q', '.[0].number');
if (!issue) issue = gh('issue', 'create', '-R', repo, '--title', 'Hoot daily report', '--body', 'A short summary of how Hoot was used each day (anonymous totals only). New reports arrive as comments.').split('/').pop();
gh('issue', 'comment', issue, '-R', repo, '--body', report);

if (errors.length) {
  const body = [
    `${errors.length} error report(s) since the last check. Grouped by message:`,
    '',
    ...Object.entries(byMsg)
      .sort((a, b) => b[1].n - a[1].n)
      .flatMap(([m, v]) => [`### ${v.n}× ${m}`, `- where: ${v.where}`, `- browser: ${v.ua}`, v.stack ? `- stack: \`${v.stack}\`` : '', '']),
  ].join('\n');
  gh('issue', 'create', '-R', repo, '--title', `Hoot errors: ${errors.length} report(s) on ${y}`, '--body', body.slice(0, 60000));
  // Clear what we've reported.
  for (const e of errors) await fetch(`https://firestore.googleapis.com/v1/${e.name}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
}
