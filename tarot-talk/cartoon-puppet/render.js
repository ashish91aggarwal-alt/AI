// Fast renderer: each drawing is rendered ONCE (animation on twos = 12 drawings/s),
// split across CPU cores, piped as raw pixels straight into ffmpeg (no PNG files),
// then held to 24 fps. Usage: node render.js <scene.js> <out.mp4> [--stills=0.5,1.7]
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os'), path = require('path'), fs = require('fs');
const DRAW_FPS = 12, OUT_FPS = 24, W = 1080, H = 1920;

if (!isMainThread) {
  const { Resvg } = require('@resvg/resvg-js');
  const E = require('./engine');
  const scene = require(path.resolve(workerData.scene));
  parentPort.on('message', ({ i, t, png }) => {
    E.S.boil = i; E.S.sid = 0; E.S.uid = 0;
    const img = new Resvg(scene.svg(t), { fitTo: { mode: 'width', value: W } }).render();
    const src = png ? img.asPng() : img.pixels;
    const buf = new Uint8Array(src.length); buf.set(src);
    parentPort.postMessage({ i, buf }, [buf.buffer]);
  });
} else {
  const [sceneFile, out] = process.argv.slice(2);
  const stillsArg = process.argv.find(a => a.startsWith('--stills='));
  const scene = require(path.resolve(sceneFile));
  const jobs = stillsArg ? stillsArg.slice(9).split(',').map(Number).map((t, i) => ({ i, t, png: true }))
    : [...Array(Math.round(scene.DUR * DRAW_FPS)).keys()].map(i => ({ i, t: i / DRAW_FPS }));
  const n = Math.min(os.cpus().length, jobs.length);
  let ff = null;
  if (!stillsArg) {
    ff = require('child_process').spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(DRAW_FPS), '-i', '-',
      '-vf', `fps=${OUT_FPS},gblur=sigma=0.6`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  }
  const done = new Map(); let next = 0, q = 0; const t0 = Date.now();
  const flush = () => { while (done.has(next)) { const b = done.get(next); done.delete(next); if (ff) ff.stdin.write(Buffer.from(b)); else fs.writeFileSync(`${out}_${next}.png`, Buffer.from(b)); next++; } };
  const workers = [...Array(n)].map(() => new Worker(__filename, { workerData: { scene: sceneFile } }));
  workers.forEach(w => {
    w.on('message', ({ i, buf }) => {
      done.set(i, buf); flush();
      if (q < jobs.length) w.postMessage(jobs[q++]);
      else if (next === jobs.length) { workers.forEach(x => x.terminate()); if (ff) ff.stdin.end(); console.log(`${jobs.length} drawings in ${((Date.now() - t0) / 1000).toFixed(1)}s`); }
    });
    if (q < jobs.length) w.postMessage(jobs[q++]);
  });
}
