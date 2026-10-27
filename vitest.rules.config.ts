import { defineConfig } from 'vitest/config';
// Firestore security-rules tests. Run inside the emulator:
//   npm run test:rules
export default defineConfig({ test: { include: ['tests/rules/**/*.test.ts'], testTimeout: 30000, fileParallelism: false } });
