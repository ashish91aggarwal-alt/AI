// Captures frames of a page that exposes window.render(t) and window.DUR.
// usage: node frames.js <page.html> <outDir> <fps> <width> <height> [startFrame endFrame] | [t=1.5,3.0,...]
const puppeteer = require(require('path').join(__dirname,'../node_modules/puppeteer-core'));
const fs = require('fs');
(async () => {
  const [page_, out, fpsS, w, h, a, b] = process.argv.slice(2);
  const fps = +fpsS; fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('file://' + page_);
  await page.evaluate(() => document.fonts.ready);
  const dur = await page.evaluate(() => window.DUR);
  if (a && a.startsWith('t=')) {
    for (const ts of a.slice(2).split(',')) { await page.evaluate(t => window.render(t), +ts); await page.screenshot({ path: `${out}/t_${ts}.png` }); }
  } else {
    const n = Math.round(dur * fps), s = a ? +a : 0, e = b ? Math.min(+b, n) : n;
    for (let i = s; i < e; i++) { await page.evaluate(t => window.render(t), i / fps); await page.screenshot({ path: `${out}/f_${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
    console.log('frames', s, e);
  }
  await browser.close();
})();
