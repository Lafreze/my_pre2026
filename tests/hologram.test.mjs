import assert from 'node:assert/strict';
import { chromium } from 'file:///C:/Users/70893804/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('outputs/hologram-review', { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [], errors = [];
const check = async (name, run) => { try { await run(); results.push({ name, pass: true }); console.log('PASS', name); } catch (e) { results.push({ name, pass: false, error: e.message }); console.log('FAIL', name, e.message.slice(0, 500)); } };
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:3000/atlas/', { waitUntil: 'networkidle', timeout: 90000 });
  await page.locator('.atlas-visual[data-status="ready"]').waitFor();
  await page.getByRole('button', { name: 'Toolsの詳細', exact: true }).click();
  await page.locator('.atlas-hologram[data-anchored="true"]').waitFor();
  await check('projection is attached to a visible model, with no modal backdrop', async () => {
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await page.locator('.atlas-holo-card').getAttribute('aria-modal'), 'false');
    const anchor = await page.locator('.atlas-hologram').evaluate(e => ({ x: +e.dataset.anchorX, y: +e.dataset.anchorY }));
    const stage = await page.locator('.atlas-stage').boundingBox(), card = await page.locator('.atlas-holo-card').boundingBox();
    assert.ok(anchor.x > 0 && anchor.x < stage.width && anchor.y > 0 && anchor.y < stage.height);
    assert.ok(card.y + card.height < stage.y + anchor.y);
    assert.ok((await page.locator('[data-holo-fan]').getAttribute('d')).includes('L'));
    await page.screenshot({ path: 'outputs/hologram-review/attached.png' });
  });
  await check('tabs, case steps, play, pause, reset and keyboard tab navigation', async () => {
    await page.getByRole('tab', { name: '02動作例', exact: true }).click();
    const first = await page.locator('.atlas-holo-artifact pre').innerText();
    await page.getByRole('button', { name: '次の工程', exact: true }).click();
    assert.notEqual(await page.locator('.atlas-holo-artifact pre').innerText(), first);
    await page.getByRole('button', { name: '例をリセット', exact: true }).click();
    await page.getByRole('button', { name: '再生', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.atlas-holo-artifact')?.dataset.step === '1');
    await page.getByRole('button', { name: '一時停止', exact: true }).click();
    const paused = await page.locator('.atlas-holo-artifact').getAttribute('data-step');
    await page.waitForTimeout(1950);
    assert.equal(await page.locator('.atlas-holo-artifact').getAttribute('data-step'), paused);
    await page.getByRole('tab', { name: '02動作例', exact: true }).focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('tab', { name: '03設計・資料', exact: true }).getAttribute('aria-selected'), 'true');
    assert.ok(await page.locator('.atlas-holo-sources a').count());
  });
  await check('folding preserves projection and camera movement updates its anchor', async () => {
    const before = await page.locator('.atlas-holo-card').boundingBox();
    await page.getByRole('button', { name: 'カードを折りたたむ', exact: true }).click();
    assert.ok((await page.locator('.atlas-holo-card').boundingBox()).height < before.height / 2);
    const position = await page.locator('.atlas-hologram').getAttribute('data-anchor-y');
    await page.getByRole('button', { name: '縮小', exact: true }).click(); await page.waitForTimeout(250);
    assert.notEqual(await page.locator('.atlas-hologram').getAttribute('data-anchor-y'), position);
    await page.getByRole('button', { name: 'カードを展開', exact: true }).click();
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.atlas-holo-card').count(), 0);
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-node') === 'tools');
  });
  await check('all 19 topics have distinct four-step cases, design notes and sources', async () => {
    const titles = new Set();
    for (const [mode, count] of [['構成', 10], ['発展', 9]]) {
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page.locator('.atlas-visual[data-status="ready"]').waitFor();
      await page.locator('.atlas-node-label').first().click();
      for (let i = 0; i < count; i++) {
        await page.getByRole('tab', { name: '02動作例', exact: true }).click();
        titles.add(await page.locator('.atlas-holo-case-heading h3').innerText());
        assert.equal(await page.locator('.atlas-holo-sequence button').count(), 4);
        const artifacts = new Set();
        for (let j = 0; j < 4; j++) { await page.locator('.atlas-holo-sequence button').nth(j).click(); const artifact = (await page.locator('.atlas-holo-artifact pre').innerText()).trim(); assert.ok(artifact); artifacts.add(artifact); }
        assert.equal(artifacts.size, 4);
        await page.getByRole('tab', { name: '03設計・資料', exact: true }).click();
        assert.equal(await page.locator('.atlas-holo-design section').count(), 2);
        assert.ok(await page.locator('.atlas-holo-sources a').count());
        if (i < count - 1) await page.getByRole('button', { name: '次の要素', exact: true }).click();
      }
      await page.keyboard.press('Escape');
    }
    assert.equal(titles.size, 19);
  });
  await check('cross-topic navigation changes the 3D scene as well as the card', async () => {
    await page.getByRole('button', { name: 'Transformerの詳細', exact: true }).click();
    await page.locator('.atlas-holo-relations').getByRole('button', { name: 'LLM', exact: false }).click();
    await page.locator('.atlas-visual[data-status="ready"][data-mode="architecture"]').waitFor();
    assert.equal(await page.locator('.atlas-hologram').getAttribute('data-topic'), 'model');
    await page.locator('.atlas-hologram[data-anchored="true"]').waitFor();
    await page.keyboard.press('Escape');
  });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  mobile.on('pageerror', e => errors.push(e.message));
  await mobile.goto('http://localhost:3000/atlas/', { waitUntil: 'networkidle' });
  await mobile.locator('.atlas-visual[data-status="ready"]').waitFor();
  await check('mobile projection fits and its body scrolls independently', async () => {
    await mobile.getByRole('button', { name: 'Human controlの詳細', exact: true }).tap();
    await mobile.locator('.atlas-hologram[data-anchored="true"]').waitFor();
    const card = await mobile.locator('.atlas-holo-card').boundingBox();
    assert.ok(card.x >= 0 && card.x + card.width <= 390 && card.y >= 0 && card.y + card.height < 844);
    await mobile.getByRole('tab', { name: '03設計・資料', exact: true }).tap();
    const area = await mobile.locator('.atlas-holo-content').boundingBox();
    await mobile.mouse.move(area.x + area.width / 2, area.y + area.height / 2); await mobile.mouse.wheel(0, 400); await mobile.waitForTimeout(200);
    assert.ok(await mobile.locator('.atlas-holo-content').evaluate(e => e.scrollTop > 0));
    await mobile.screenshot({ path: 'outputs/hologram-review/mobile-sources.png' });
    await mobile.getByRole('button', { name: '総覧に戻る', exact: true }).tap();
    assert.equal(await mobile.locator('.atlas-holo-card').count(), 0);
  });
  await check('no browser runtime errors', async () => assert.deepEqual(errors, []));
} finally {
  await writeFile('outputs/hologram-review/report.json', JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
if (results.some(result => !result.pass)) process.exitCode = 1;
