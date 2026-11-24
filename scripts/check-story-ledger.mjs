// Reads the emulator's usage ledger directly (as the server would) and checks
// each processed recording was counted exactly once.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const uid = fs.readFileSync('/tmp/story-server-uid', 'utf8');
const r = await fetch('http://127.0.0.1:8080/v1/projects/demo-hoot/databases/(default)/documents/usageLedger?pageSize=300', { headers: { authorization: 'Bearer owner' } });
const j = await r.json();
const mine = (j.documents ?? []).map(d => ({ id: d.name.split('/').pop(), type: d.fields.type.stringValue, billable: Number(d.fields.billableSeconds.doubleValue ?? d.fields.billableSeconds.integerValue) })).filter(d => d.id.includes(uid));
const tx = mine.filter(d => d.type === 'transcription');
assert.deepEqual(tx.map(d => d.id).sort(), [`transcription_${uid}_rec_aaaaaa1`, `transcription_${uid}_rec_aaaaaa3`].sort());
console.log('  ✓ transcription counted once per recording (2 recordings → 2 entries, the failed one → none)');
assert.ok(mine.filter(d => d.type === 'ai_edit').every(d => d.billable === 0));
console.log(`  ✓ story editing recorded as cost only (${mine.filter(d => d.type === 'ai_edit').length} entries, 0 billable seconds)`);
