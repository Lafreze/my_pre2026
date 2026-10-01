import {mockWeather} from './weather-fixture.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.GAZE_OUTPUT||'output/playwright/gaze';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});page.setDefaultTimeout(15000);
const reports=[];
const capture=async()=>page.evaluate(()=>{const el=document.querySelector('.studio-scene');window.flightSamples=[];window.flightObserver=new MutationObserver(()=>{window.flightSamples.push({time:performance.now(),position:el.dataset.cameraPosition.split(',').map(Number),focus:el.dataset.cameraFocus.split(',').map(Number),gaze:el.dataset.gazeOffset.split(',').map(Number),books:JSON.parse(el.dataset.bookOpen),progress:Number(el.dataset.flightProgress),hologram:Number(el.dataset.hologram),phase:el.dataset.hologramPhase});});window.flightObserver.observe(el,{attributes:true,attributeFilter:['data-frames']});});
const samples=async()=>page.evaluate(()=>{window.flightObserver.disconnect();return window.flightSamples;});
try{
 await mockWeather(page);await page.goto(process.env.STUDIO_URL||'http://127.0.0.1:5173/',{waitUntil:'networkidle'});await page.locator('.studio-scene[data-status=ready]').waitFor();
 const scene=page.locator('.studio-scene');
 assert.deepEqual(JSON.parse(await scene.getAttribute('data-book-open')),{name:0,notebook:0});assert.equal(await page.locator('.studio-skip').count(),0);
 await capture();await page.locator('.garden-start').click();await page.locator('.studio-scene[data-transition=true]').waitFor();
 await page.waitForTimeout(250);assert.equal(await page.locator('.studio-surface-host[data-kind=name]').getAttribute('data-visible'),'false');await page.screenshot({path:out+'/journal-approach.png'});
 await page.locator('.studio-surface-host[data-kind=name][data-interactive=true]').waitFor();
 const approach=await samples(),duration=approach.at(-1).time-approach[0].time;assert.ok(approach.length>=8);assert.ok(duration>=1500&&duration<3200);
 const end=(await scene.getAttribute('data-camera-position')).split(',').map(Number),start=approach[0].position;
 for(const s of approach)for(let axis=0;axis<3;axis++)assert.ok(s.position[axis]>=Math.min(start[axis],end[axis])-.002&&s.position[axis]<=Math.max(start[axis],end[axis])+.002,'direct approach without overshoot');
 for(let axis=0;axis<2;axis++){const signed=approach.map(s=>s.gaze[axis]).filter(v=>Math.abs(v)>.025);assert.ok(!signed.length||signed.every(v=>Math.sign(v)===Math.sign(signed[0])),'gaze never dips past the page');}
 assert.ok(approach.some(s=>s.books.name>.1&&s.books.name<.9));reports.push({name:'closed journal opens during direct approach',pass:true,samples:approach});console.log('PASS journal approach and opening');
 const position=await scene.getAttribute('data-camera-position');await page.locator('.journey-dots button').nth(1).click();await page.locator('.studio-surface-host[data-kind=notebook][data-interactive=true]').waitFor();assert.equal(await scene.getAttribute('data-camera-position'),position);assert.equal(JSON.parse(await scene.getAttribute('data-book-open')).name,1);assert.equal(await page.locator('.studio-surface-host[data-kind=name]').getAttribute('data-visible'),'false');assert.equal(await page.locator('.studio-surface-host[data-kind=notebook]').getAttribute('data-detail'),'1');
 reports.push({name:'AI encounter stays on the open journal',pass:true});console.log('PASS AI encounter on the same journal');
 await page.locator('.journey-dots button').nth(2).click();await page.locator('.studio-surface-host[data-kind=board][data-interactive=true]').waitFor();const monitor=await scene.getAttribute('data-camera-position');
 await page.locator('.journey-dots button').nth(3).click();await page.locator('.studio-surface-host[data-kind=monitor][data-interactive=true]').waitFor();assert.equal(await scene.getAttribute('data-camera-position'),monitor);assert.equal(await page.locator('.studio-surface-host[data-kind=board]').getAttribute('data-visible'),'false');
 reports.push({name:'LLM and Agent share the monitor',pass:true});console.log('PASS LLM and Agent on the same monitor');
 await capture();await page.locator('.journey-dots button').nth(4).click();await page.locator('.studio-scene[data-hologram-phase=focus]').waitFor();assert.ok(Number(await scene.getAttribute('data-hologram'))<.01);assert.equal(await page.locator('.studio-surface-host[data-kind=checklist]').getAttribute('data-interactive'),'false');await page.screenshot({path:out+'/projector-focus.png'});
 await page.locator('.studio-scene[data-hologram-phase=unfold]').waitFor();await page.waitForTimeout(350);await page.screenshot({path:out+'/projector-unfold.png'});await page.locator('.studio-surface-host[data-kind=checklist][data-interactive=true]').waitFor();
 const hologram=await samples();assert.ok(hologram.some(s=>s.phase==='focus'&&s.hologram<.01));assert.ok(hologram.some(s=>s.phase==='unfold'&&s.hologram>.05&&s.hologram<.95));assert.equal(await scene.getAttribute('data-projector-scale'),'1,1,1');assert.equal(await scene.getAttribute('data-hologram-phase'),'ready');await page.screenshot({path:out+'/projector-read.png'});
 reports.push({name:'focus on projector before unfolding the light field',pass:true,samples:hologram});console.log('PASS staged hologram arrival');
 await page.getByRole('button',{name:'全景に戻る',exact:true}).click();await page.locator('.studio-scene[data-transition=false]').waitFor();assert.deepEqual(JSON.parse(await scene.getAttribute('data-book-open')),{name:0,notebook:0});assert.equal(await page.locator('[data-object=notebook],[data-object=board]').count(),0);
 reports.push({name:'journal closes; bookshelf and chalkboard never become chapter destinations',pass:true});console.log('PASS room object mapping');
 await page.locator('.garden-start').click();await page.locator('.studio-scene[data-transition=true]').waitFor();await page.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await page.locator('.studio-scene[data-status=fallback]').waitFor();assert.equal(await page.locator('.studio-surface-host[data-kind=name]').evaluate(e=>e.inert),false);
 reports.push({name:'context loss preserves readable fallback',pass:true});console.log('PASS fallback during opening');
}catch(error){await page.screenshot({path:out+'/failure.png'});reports.push({name:'failure trace',error:String(error),samples:await samples()});throw error;}finally{await writeFile(out+'/report.json',JSON.stringify(reports,null,2));await browser.close();}
