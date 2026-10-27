// The build used by the account end-to-end tests (playwright.account.config.ts):
//   VITE_FIREBASE_EMULATOR=1 vite build --config vite.emulator.config.ts --outDir dist-emu
// Sign-in talks to the local Firebase Auth emulator; the Firestore parts
// (usernames, synced progress) are replaced by tests/support/fake-remote.ts.
// Never used for the real site.
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function fakeRemote(): Plugin {
  const real = path.resolve('src/lib/cloud/remote.ts');
  const fake = path.resolve('tests/support/fake-remote.ts');
  return {
    name: 'hoot-fake-remote',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source.endsWith('?real')) return null;
      const r = await this.resolve(source, importer, { ...options, skipSelf: true });
      return r && r.id === real ? fake : null;
    },
  };
}

export default defineConfig({ plugins: [fakeRemote(), react()] });
