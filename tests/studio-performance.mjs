import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.STUDIO_URL || 'http://127.0.0.1:5173/';
const output = process.env.STUDIO_OUTPUT || 'output/playwright/model-performance';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
try {
  const page = await browser.newPage({ viewport: { width:1440, height:1000 }, reducedMotion:'no-preference' });
  await page.goto(base, { waitUntil:'networkidle' });
  await page.locator('.studio-scene[data-status=ready]').waitFor();
  await page.waitForTimeout(600);
  const measurements = [];
  for (const chapter of [1, 2, 3, 4]) {
    measurements.push(await page.evaluate(async chapter => {
      const scene = document.querySelector('.studio-scene');
      const before = +scene.dataset.frames, start = performance.now(), times = [];
      let last = start;
      document.querySelectorAll('.journey-dots button')[chapter].click();
      return new Promise(resolve => {
        function tick(t) {
          times.push(t - last); last = t;
          if (t - start < 2600) { requestAnimationFrame(tick); return; }
          const gl = document.querySelector('canvas').getContext('webgl2'), ext = gl.getExtension('WEBGL_debug_renderer_info');
          resolve({chapter:chapter+1,model:scene.dataset.view,rafFps:1000/(times.reduce((sum,n)=>sum+n,0)/times.length),renderedFrames:+scene.dataset.frames-before,durationMs:t-start,quality:scene.dataset.quality||'standard',drawCalls:Number(scene.dataset.drawCalls),triangles:Number(scene.dataset.triangles),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});
        }
        requestAnimationFrame(tick);
      });
    }, chapter));
  }
  const report = {date:new Date().toISOString(),browser:await browser.version(),mode:'Headless Chromium, default graphics backend; rAF includes idle callbacks and is not GPU frame timing',viewport:'1440×1000',measurements};
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(measurements,null,2));
} finally { await browser.close(); }
