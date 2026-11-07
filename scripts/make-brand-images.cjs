// Renders Hoot's share-preview image and app icons from the owl logo.
// Run: PW_CHROMIUM=... node scripts/make-brand-images.cjs  (needs Playwright)
const { chromium } = require('playwright');
const owl = (size, radius = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" rx="${radius}" fill="#B4532A"/><circle cx="22" cy="30" r="11" fill="#FAF8F4"/><circle cx="42" cy="30" r="11" fill="#FAF8F4"/><circle cx="23" cy="31" r="4.5" fill="#1C1B1A"/><circle cx="41" cy="31" r="4.5" fill="#1C1B1A"/><path d="M28 42 L32 49 L36 42 Z" fill="#F2C14E"/></svg>`;
const fonts = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,600&display=swap" rel="stylesheet">';
const og = `<!doctype html><html><head>${fonts}<style>
  body{margin:0;width:1200px;height:630px;background:#FAF8F4;font-family:Inter,system-ui,sans-serif;color:#1C1B1A;display:flex;align-items:center;gap:64px;padding:0 90px;box-sizing:border-box;position:relative;overflow:hidden}
  .ring{position:absolute;right:-180px;bottom:-260px;width:620px;height:620px;border-radius:50%;background:repeating-radial-gradient(circle,#B4532A 0 2px,#c2643c 2px 6px);opacity:.14}
  h1{font-family:'Source Serif 4',Georgia,serif;font-size:96px;margin:0 0 18px;letter-spacing:-1px}
  p{font-size:38px;line-height:1.3;margin:0 0 30px;color:#4a4642;max-width:640px}
  .url{font-size:30px;font-weight:600;color:#B4532A}
</style></head><body><div class="ring"></div>${owl(300, 60)}<div><h1>Hoot</h1><p>Memories from your years, daily puzzles, health news and more. Free, every day.</p><div class="url">hootdaily.com</div></div></body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const shot = async (html, w, h, path) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: 'networkidle' });
    await p.screenshot({ path, omitBackground: false });
    await p.close();
  };
  await shot(og, 1200, 630, 'public/og.png');
  for (const s of [192, 512]) await shot(`<body style="margin:0">${owl(s, 14)}</body>`, s, s, `public/icons/icon-${s}.png`);
  // Maskable: owl inside the safe zone on a full-bleed background.
  await shot(`<body style="margin:0;background:#B4532A;display:grid;place-items:center;width:512px;height:512px">${owl(400, 0)}</body>`, 512, 512, 'public/icons/maskable-512.png');
  await shot(`<body style="margin:0">${owl(180, 0)}</body>`, 180, 180, 'public/icons/apple-touch-icon.png');
  await b.close();
})();
