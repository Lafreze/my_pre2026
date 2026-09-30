import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.GAZE_OUTPUT||'output/playwright/gaze';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
const reports=[];
try{
 await page.goto(process.env.STUDIO_URL||'http://127.0.0.1:5173/',{waitUntil:'networkidle'});await page.locator('.studio-scene[data-status=ready]').waitFor();
 const scene=page.locator('.studio-scene');
 assert.deepEqual(JSON.parse(await scene.getAttribute('data-book-open')),{name:0,notebook:0});
 for(const id of ['name','notebook']){
  await page.evaluate(()=>{const el=document.querySelector('.studio-scene');window.flightSamples=[];window.flightObserver=new MutationObserver(()=>{if(el.dataset.transition==='true')window.flightSamples.push({time:performance.now(),position:el.dataset.cameraPosition.split(',').map(Number),gaze:el.dataset.gazeOffset.split(',').map(Number),books:JSON.parse(el.dataset.bookOpen),progress:Number(el.dataset.flightProgress)});});window.flightObserver.observe(el,{attributes:true,attributeFilter:['data-frames']});});
  if(id==='name')await page.locator('.garden-start').click();else await page.locator('.journey-dots button').nth(1).click();
  await page.locator('.studio-scene[data-transition=true]').waitFor();
  await page.waitForTimeout(250);assert.equal(await page.locator('.studio-surface-host[data-kind='+id+']').getAttribute('data-visible'),'false');
  await page.screenshot({path:out+'/'+id+'-approach.png'});
  await page.waitForTimeout(650);await page.screenshot({path:out+'/'+id+'-opening.png'});
  await page.locator('.studio-scene[data-transition=false]').waitFor();
  await page.locator('.studio-surface-host[data-kind='+id+'][data-interactive=true]').waitFor();
  const samples=await page.evaluate(()=>{window.flightObserver.disconnect();return window.flightSamples;});
  assert.ok(samples.length>=8,'enough frames to assess the movement');
  const duration=samples.at(-1).time-samples[0].time;assert.ok(duration>=1500&&duration<3000,'unhurried bounded transition: '+duration);
  const end=(await scene.getAttribute('data-camera-position')).split(',').map(Number),start=samples[0].position;
  for(const sample of samples)for(let axis=0;axis<3;axis++)assert.ok(sample.position[axis]>=Math.min(start[axis],end[axis])-.002&&sample.position[axis]<=Math.max(start[axis],end[axis])+.002,'camera does not overshoot the destination');
  // Looking below a page and back up puts its center on both sides of the gaze.
  for(let axis=0;axis<2;axis++){const signed=samples.map(s=>s.gaze[axis]).filter(v=>Math.abs(v)>.025);assert.ok(!signed.length||signed.every(v=>Math.sign(v)===Math.sign(signed[0])),'gaze crosses the object and has to return');}
  assert.equal(JSON.parse(await scene.getAttribute('data-book-open'))[id],1);
  assert.ok(samples.some(s=>s.books[id]>.1&&s.books[id]<.9),'book opens during the approach');
  await page.screenshot({path:out+'/'+id+'-read.png'});reports.push({id,duration,samples});console.log('PASS',id,'closed before approach, unfolds in motion, direct gaze,',Math.round(duration),'ms');
 }
 await page.getByRole('button',{name:'全景に戻る',exact:true}).click();await page.locator('.studio-scene[data-transition=false]').waitFor();assert.deepEqual(JSON.parse(await scene.getAttribute('data-book-open')),{name:0,notebook:0});
 console.log('PASS both books close when returning to the room');
 await page.locator('.garden-start').click();await page.locator('.studio-scene[data-transition=true]').waitFor();
 await page.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await page.locator('.studio-scene[data-status=fallback]').waitFor();
 assert.equal(await page.locator('.studio-surface-host[data-kind=name]').evaluate(e=>getComputedStyle(e).opacity),'1');
 assert.equal(await page.locator('.studio-surface-host[data-kind=name]').evaluate(e=>e.inert),false);
 console.log('PASS context loss during book opening keeps the text fallback visible');
}finally{await writeFile(out+'/report.json',JSON.stringify(reports,null,2));await browser.close();}
