import { defineConfig } from '@playwright/test';

// Account tests: the real sign-in code against the local Firebase Auth
// emulator (port 9099), in a separate build (dist-emu, port 4174) that points
// at the emulator. Firestore is replaced by an in-browser fake in that build
// (see vite.emulator.config.ts), because the Firestore emulator needs a
// download that isn't always possible.
//
//   npx playwright test -c playwright.account.config.ts
// Tells account.spec.ts which build it is testing.
process.env.HOOT_ACCOUNTS = '1';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /account\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  workers: 2,
  use: {
    baseURL: 'http://localhost:4174',
    viewport: { width: 1280, height: 900 },
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: [
    {
      command: 'npx firebase emulators:start --only auth --project demo-hoot',
      url: 'http://127.0.0.1:9099',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'VITE_FIREBASE_EMULATOR=1 npx vite build --config vite.emulator.config.ts --outDir dist-emu && npx vite preview --outDir dist-emu --port 4174 --strictPort',
      port: 4174,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
