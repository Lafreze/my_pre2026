import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.STUDIO_URL || 'http://127.0.0.1:5173/';
const output = process.env.GARDEN_OUTPUT || 'output/playwright/garden';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const results = [], errors = [], metrics = [];
async function check(name, run) {
  try { await run(); results.push({ name, pass: true }); console.log('PASS', name); }
  catch (error) { results.push({ name, pass: false, error: error.message }); console.error('FAIL', name, error.message); }
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  const scene = page.locator('.studio-scene');
  await page.locator('.studio-scene[data-status=ready]').waitFor();
  await check('reduced motion starts still; daylight and dusk keep every chapter reachable', async () => {
    assert.equal(await scene.getAttribute('data-breeze'), 'false');
    await page.screenshot({ path: `${output}/day.png` });
    await page.locator('.environment-menu summary').click();
    await page.getByRole('button', { name: '夕暮れの光', exact: true }).click();
    assert.equal(await scene.getAttribute('data-time'), 'dusk');
    await page.screenshot({ path: `${output}/dusk.png` });
    assert.equal(await page.locator('.studio-object:visible').count(), 6);
    await page.getByRole('button', { name: '昼の光', exact: true }).click();
  });
  await check('small numbered markers identify five objects; hover and keyboard reveal their names',async()=>{
    await page.locator('.environment-menu summary').click();await page.mouse.move(0,0);
    assert.equal(await page.locator('.studio-object .object-marker:visible').count(),5);
    for(const marker of await page.locator('.studio-object .object-marker:visible').all()){const b=await marker.boundingBox();assert.ok(b.width<=26&&b.height<=26);}
    const name=page.locator('[data-object=name]');await name.focus();assert.equal(await name.locator('span').evaluate(e=>getComputedStyle(e).visibility),'visible');
    await page.waitForFunction(()=>document.querySelector('.studio-surface-host[data-kind=name]').dataset.hover==='true');
    await page.keyboard.press('Enter');await page.locator('.studio-scene[data-view=name][data-transition=false]').waitFor();await page.getByRole('button',{name:'全景に戻る',exact:true}).click();
    await page.mouse.move(0,0);await page.locator('.garden-start').focus();await page.screenshot({path:output+'/overview.png'});
  });
  await check('five live surfaces stay mounted from overview through the camera move',async()=>{
    assert.equal(await page.locator('.studio-surface-host').count(),5);
    await page.waitForFunction(()=>[...document.querySelectorAll('.studio-surface-host')].every(e=>e.dataset.visible==='true'));
    await page.evaluate(()=>window.surfaceNodes=[...document.querySelectorAll('.model-presentation')]);
    await page.locator('[data-object=name]').click();await page.locator('.studio-surface-host[data-kind=name][data-interactive=true]').waitFor();
    assert.ok(await page.evaluate(()=>window.surfaceNodes.every((e,i)=>e===document.querySelectorAll('.model-presentation')[i])));
    await page.getByRole('button',{name:'全景に戻る',exact:true}).click();
  });
  await check('light direction changes the illuminated room without moving the camera',async()=>{
    await page.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();
    await page.locator('.environment-menu summary').click();
    const camera=await scene.getAttribute('data-camera-position');
    await page.getByRole('slider',{name:'光の方向',exact:true}).fill('-35');await page.waitForTimeout(100);
    const first=await page.screenshot();await page.getByRole('slider',{name:'光の方向',exact:true}).fill('35');await page.waitForTimeout(100);
    assert.equal(await scene.getAttribute('data-sun-angle'),'35');assert.equal(await scene.getAttribute('data-camera-position'),camera);assert.ok(!first.equals(await page.screenshot()));
    await page.screenshot({path:`${output}/light-study.png`});await page.getByRole('slider',{name:'光の方向',exact:true}).fill('0');await page.locator('.environment-menu summary').click();
  });
  await check('five-chapter guide saves visits, excludes archive and offers a fresh tour after completion', async () => {
    for (const [i,id] of ['notebook','board','monitor','checklist'].entries()){
      await page.locator('.garden-discovery>button').click();await page.locator('.studio-scene[data-view='+id+'][data-transition=false]').waitFor();await page.getByRole('button',{name:'全景に戻る',exact:true}).click();assert.equal(await scene.getAttribute('data-visited'),String(i+2));
    }
    assert.ok((await page.locator('.garden-discovery').innerText()).includes('THANK YOU'));
    await page.getByRole('button',{name:'参考資料',exact:true}).click();await page.getByRole('button',{name:'資料を閉じて元の章に戻る'}).click();assert.equal(await scene.getAttribute('data-visited'),'5');
    await page.reload({waitUntil:'networkidle'});await page.locator('.studio-scene[data-status=ready][data-visited="5"]').waitFor();await page.locator('.garden-start').click();await page.locator('.studio-scene[data-view=name][data-visited="1"]').waitFor();await page.getByRole('button',{name:'全景に戻る',exact:true}).click();
  });
  await check('drag, wheel, accessible zoom and reset preserve the selected chapter', async () => {
    const chapter = await page.locator('.work-studio').getAttribute('data-chapter');
    await page.mouse.move(880, 720); await page.mouse.down(); await page.mouse.move(1100, 755, { steps: 10 }); await page.mouse.up();
    assert.ok(Number(await scene.getAttribute('data-orbit')) > .25);
    await page.mouse.wheel(0, -300); await page.waitForTimeout(100);
    assert.ok(Number(await scene.getAttribute('data-zoom')) < .9);
    assert.equal(await page.locator('.work-studio').getAttribute('data-chapter'), chapter);
    assert.equal(await page.locator('.studio-copy').count(), 0);
    const orbit=await scene.getAttribute('data-orbit'),zoom=await scene.getAttribute('data-zoom');await page.locator('[data-object=monitor]').click();await page.locator('.studio-scene[data-view=monitor][data-transition=false]').waitFor();await page.getByRole('button',{name:'全景に戻る',exact:true}).click();await page.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();assert.equal(await scene.getAttribute('data-orbit'),orbit);assert.equal(await scene.getAttribute('data-zoom'),zoom);
    await page.getByRole('button', { name: '庭の視点を戻す' }).click();
    await page.locator('.studio-scene[data-orbit="0.000"][data-zoom="1.000"]').waitFor();
    assert.equal(await scene.getAttribute('data-orbit'), '0.000');
    assert.equal(await scene.getAttribute('data-zoom'), '1.000');
    await page.getByRole('button', { name: '庭を拡大', exact: true }).click();
    await page.locator('.studio-scene[data-zoom="0.900"]').waitFor();
    assert.equal(await scene.getAttribute('data-zoom'), '0.900');
    await page.getByRole('button', { name: '庭を縮小', exact: true }).click();
    await page.locator('.studio-scene[data-zoom="1.000"]').waitFor();
    assert.equal(await scene.getAttribute('data-zoom'), '1.000');
  });
  await check('PC entrance, menu and 44px object targets fit common desktop windows', async () => {
    for (const [width, height] of [[1920,1080],[1440,900],[1366,768],[1280,720]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(100);
      const layout = await page.evaluate(() => {
        const boxes = [...document.querySelectorAll('.studio-object')].map(e => ({ id:e.dataset.object,...e.getBoundingClientRect().toJSON() }));
        const controls = [...document.querySelectorAll('.garden-start,.environment-menu summary,.studio-header-actions button')].map(e => e.getBoundingClientRect().toJSON());
        const intro=document.querySelector('.garden-intro').getBoundingClientRect(),foot=document.querySelector('.studio-footer').getBoundingClientRect();return { boxes, controls, width:document.documentElement.scrollWidth,introBottom:intro.bottom,footerTop:foot.top };
      });
      assert.equal(layout.width, width);assert.ok(layout.introBottom<layout.footerTop);
      for (const b of [...layout.boxes, ...layout.controls]) { assert.ok(b.left >= 0 && b.right <= width, JSON.stringify(b)); assert.ok(b.height >= 44); }
      for (const [i, a] of layout.boxes.entries()) for (const b of layout.boxes.slice(i + 1)) assert.ok(Math.min(a.right,b.right)-Math.max(a.left,b.left)<1 || Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<1, `Overlapping ${a.id}/${b.id} at ${width}`);
      await page.screenshot({ path: `${output}/${width}-garden.png` });
      for (const id of ['name','notebook','board','monitor','checklist']) {
        await page.locator(`[data-object=${id}]`).click();
        await page.locator(`.studio-scene[data-view=${id}]`).waitFor();
        await page.getByRole('button', { name: '全景に戻る', exact: true }).click();
      }
    }
  });
  await check('free exploration suppresses the guide highlight and the index exposes the same five chapters',async()=>{
    await page.locator('.garden-free').click();assert.equal(await page.locator('.studio-object[data-next=true]').count(),0);await page.locator('.studio-index-toggle').click();assert.equal(await page.locator('.studio-index-chapter').count(),5);await page.locator('.studio-index-chapter').nth(2).click();await page.locator('.studio-scene[data-view=board][data-transition=false]').waitFor();await page.getByRole('button',{name:'全景に戻る',exact:true}).click();
  });
  await page.setViewportSize({ width:1440,height:1000 });
  await check('ambient motion pauses completely and chapter transitions stay responsive', async () => {
    await page.emulateMedia({ reducedMotion:'no-preference' });
    await page.locator('.environment-menu summary').click();
    await page.getByRole('button', { name:'庭の動き',exact:true }).click();
    await page.waitForTimeout(200);
    await page.locator('.studio-scene[data-transition=false][data-flying=false]').waitFor();
    await page.waitForTimeout(400); // Measure the settled garden, after the viewport resize.
    const before = Number(await scene.getAttribute('data-frames'));
    await page.waitForTimeout(1100);
    const rendered = Number(await scene.getAttribute('data-frames')) - before;
    assert.ok(rendered >= 20 && rendered <= 40, `Ambient rendered ${rendered} frames in 1.1 seconds`);
    metrics.push({ mode:'ambient', renderedFrames:rendered, milliseconds:1100 });
    await page.getByRole('button', { name:'参考資料',exact:true }).click();
    await page.waitForTimeout(100);
    const behindArchive = await scene.getAttribute('data-frames'); await page.waitForTimeout(300);
    assert.equal(await scene.getAttribute('data-frames'), behindArchive);
    await page.getByRole('button', { name:'資料を閉じて元の章に戻る' }).click();
    await page.getByRole('button', { name:'庭の動き',exact:true }).click();
    await page.mouse.move(0,0); await page.waitForTimeout(100);
    const paused = await scene.getAttribute('data-frames'); await page.waitForTimeout(500);
    assert.equal(await scene.getAttribute('data-frames'), paused);
    await page.locator('[data-object=notebook]').click();
    await page.locator('.studio-scene[data-flying=true]').waitFor();
    await page.locator('.studio-scene[data-transition=false][data-flying=false]').waitFor();
    metrics.push(await scene.evaluate(e=>({ mode:'notebook',drawCalls:Number(e.dataset.drawCalls),triangles:Number(e.dataset.triangles),quality:e.dataset.quality||'standard' })));
    await page.screenshot({ path:`${output}/notebook-flight-end.png` });
  });
  await check('no browser exceptions or WebGL shader errors', async () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors, metrics }, null, 2));
}
if (results.some(r => !r.pass)) process.exitCode = 1;
