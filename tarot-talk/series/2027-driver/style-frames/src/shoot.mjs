import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const jobs = process.argv.slice(2);           // name=url ...
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const j of jobs) {
  const [name, url] = j.split('=');
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => { if (m.type() === 'error') console.log('ERR', name, m.text()); });
  p.on('pageerror', e => console.log('PAGEERR', name, e.message));
  await p.goto('file://' + process.cwd() + '/' + url.replace('~', '='));
  await p.waitForFunction('window.DONE===true', null, { timeout: 120000 }).catch(e => console.log('timeout', name));
  await p.screenshot({ path: `out/${name}.png` });
  await p.close(); console.log('ok', name);
}
await b.close();
