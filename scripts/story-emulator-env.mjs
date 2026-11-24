// Emulator-only settings for the story server tests: the test transcriber and
// editor (which refuse to run outside the emulator) and placeholder keys.
// These files are git-ignored, so the test writes them each time.
import fs from 'node:fs';
fs.writeFileSync('functions/.env.local', 'TRANSCRIBE_PROVIDER=fake\nEDIT_PROVIDER=fake\n');
fs.writeFileSync('functions/.secret.local', 'OPENAI_API_KEY=none\nANTHROPIC_API_KEY=none\n');
