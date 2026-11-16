// Usage: node shoot.js <url> [outDir]
// Writes phone-NN.jpg (Pixel 7, ~412x915) and desktop-NN.jpg (1440x900) viewport-by-viewport,
// plus meta.txt (url + timestamp). Scrolls the whole page first so reveal animations fire.
const { chromium, devices } = require('playwright');
const fs = require('fs');
(async () => {
  const url = process.argv[2];
  const out = process.argv[3] || 'out';
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const runs = [
    ['phone', { ...devices['Pixel 7'] }],
    ['desktop', { viewport: { width: 1440, height: 900 } }],
  ];
  for (const [name, opts] of runs) {
    const ctx = await b.newContext(opts);
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    const vh = p.viewportSize().height;
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(100); }
    let i = 0;
    for (let y = 0; y < h; y += vh - 80) {
      await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(400);
      await p.screenshot({ path: `${out}/${name}-${String(++i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
    }
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(`${out}/meta.txt`, `${url}\n${new Date().toISOString()}\n`);
})();
