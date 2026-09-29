import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Use an installed Playwright package or point PLAYWRIGHT_MODULE at an existing
// runtime's index.mjs. No machine-specific browser or dependency path is assumed.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.STUDIO_URL || 'http://127.0.0.1:5173/';
const output = process.env.MATERIALS_OUTPUT || 'output/playwright/materials';
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile('public/materials/studio/manifest.json', 'utf8'));
for (const asset of manifest) {
  const bytes = await readFile(`public/materials/studio/${asset.file}`);
  assert.equal(createHash('md5').update(bytes).digest('hex'), asset.md5, asset.file);
  assert.equal(bytes.length, asset.bytes, asset.file);
}

const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const results = [], errors = [], loaded = new Set();
async function check(name, run) {
  try { await run(); results.push({ name, pass: true }); console.log('PASS', name); }
  catch (error) { results.push({ name, pass: false, error: error.message }); console.error('FAIL', name, error.message); }
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    if (response.url().includes('/materials/studio/') && response.url().endsWith('.jpg')) {
      if (response.status() === 200) loaded.add(response.url().split('/').pop());
      else errors.push(`Texture HTTP ${response.status()}: ${response.url()}`);
    }
  });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/materials/studio/*.jpg', async route => { await gate; await route.continue(); });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.studio-scene[data-status=ready]').waitFor();
  const initialFrames = Number(await page.locator('.studio-scene').getAttribute('data-frames'));
  release();
  await check('late PBR textures repaint the idle scene', async () => {
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(frames => Number(document.querySelector('.studio-scene').dataset.frames) > frames, initialFrames);
    assert.deepEqual([...loaded].sort(), manifest.map(asset => asset.file).sort());
    await page.screenshot({ path: `${output}/room.png` });
  });
  await check('textured scene becomes idle again', async () => {
    await page.waitForTimeout(400);
    const before = await page.locator('.studio-scene').getAttribute('data-frames');
    await page.waitForTimeout(600);
    assert.equal(await page.locator('.studio-scene').getAttribute('data-frames'), before);
  });
  await check('all close-ups render without material or shader errors', async () => {
    for (const [object, filename] of [['name','nameplate'],['notebook','notebook'],['board','research-board'],['monitor','workbench'],['checklist','review']]) {
      await page.locator(`[data-object=${object}]`).click();
      await page.locator(`.studio-scene[data-view=${object}]`).waitFor();
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${output}/${filename}.png` });
      await page.getByRole('button', { name: '全景に戻る', exact: true }).click();
    }
  });
  await check('Atlas loads all thirteen assets in both views', async () => {
    await page.goto(new URL('atlas/', base).href, { waitUntil: 'networkidle' });
    for (const [mode, count, filename] of [['構成',10,'atlas-architecture'],['発展',9,'atlas-evolution']]) {
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page.locator('.atlas-visual[data-status=ready][data-model-count="13"]').waitFor();
      assert.equal(await page.locator('.atlas-node-label').count(), count);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${output}/${filename}.png` });
    }
  });
  await check('missing maps retain a usable scene and interactions', async () => {
    const failed = await browser.newPage({ reducedMotion: 'reduce' });
    await failed.route('**/materials/studio/*.jpg', route => route.abort());
    await failed.goto(base);
    await failed.locator('.studio-scene[data-status=ready]').waitFor();
    await failed.locator('[data-object=monitor]').click();
    await failed.getByRole('tab', { name: '動きを見る' }).click();
    await failed.getByRole('button', { name: '次の工程 →', exact: true }).click();
    assert.ok((await failed.locator('.execution-detail').innerText()).includes('コードを生成'));
    await failed.close();
  });
  await check('no WebGL shader errors or browser exceptions', async () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors, textureCount: manifest.length, textureBytes: manifest.reduce((sum, asset) => sum + asset.bytes, 0) }, null, 2));
}
if (results.some(result => !result.pass)) process.exitCode = 1;
