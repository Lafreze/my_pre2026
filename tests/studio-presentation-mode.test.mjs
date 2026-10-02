import {mockWeather} from './weather-fixture.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const base=process.env.STUDIO_URL||'http://127.0.0.1:5181/';
const output='output/playwright/presentation-mode';await mkdir(output,{recursive:true});
const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const results=[],layouts=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
const active='.studio-surface-host[data-active=true]';
const ready=async(page=p)=>{await page.locator('.studio-scene[data-transition=false]').waitFor();await page.locator(active+'[data-interactive=true]').waitFor();};
async function go(n,page=p){await page.locator('.studio-index-toggle').click();await page.locator('.studio-index-chapter').nth(n).click();await ready(page);}
async function check(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name);}catch(e){results.push({name,pass:false,error:e.message});console.error('FAIL',name,e.message.slice(0,600));}}
async function measure(page=p){return page.locator(active).evaluate(el=>{
 const r=el.getBoundingClientRect(),scroll=el.querySelector('.model-page-scroll'),b=scroll.getBoundingClientRect();
 const bad=[...scroll.querySelectorAll('h1,h2,h3,p,small,button,.architecture-node')].filter(e=>{const a=e.getBoundingClientRect();return a.width>0&&(a.left<b.left-1||a.right>b.right+1||a.top<b.top-1||a.bottom>b.bottom+1);}).map(e=>e.textContent.slice(0,60));
 return {width:innerWidth,height:innerHeight,area:r.width*r.height/(innerWidth*innerHeight),rect:r.toJSON(),scaleX:r.width/el.offsetWidth,scaleY:r.height/el.offsetHeight,scrollX:scroll.scrollWidth-scroll.clientWidth,scrollY:scroll.scrollHeight-scroll.clientHeight,bad};
});}
try{
 await mockWeather(p);await p.goto(base,{waitUntil:'networkidle'});await p.locator('.studio-scene[data-status=ready]').waitFor();await go(0);
 await check('native fullscreen enlarges the same live content and Escape preserves the chapter',async()=>{
  const before=await measure();await p.getByRole('button',{name:'全画面表示',exact:true}).click();await p.locator('main[data-fullscreen=native]').waitFor();await ready();assert.equal(await p.evaluate(()=>document.fullscreenElement?.tagName),'MAIN');
  const after=await measure();assert.ok(after.area>.90);assert.ok(after.scaleX>before.scaleX*1.15);assert.ok(Math.abs(after.scaleX-after.scaleY)<.005);assert.equal(await p.locator('.model-presentation').count(),4);
  await p.screenshot({path:output+'/profile.png'});await p.keyboard.press('Escape');await p.locator('main[data-fullscreen=off]').waitFor({state:'attached'});await ready();assert.equal(await p.locator('main').getAttribute('data-overview'),'false');assert.equal(await p.locator('main').getAttribute('data-chapter'),'0');
 });
 await p.locator('.studio-fullscreen-toggle').click();await p.locator('main[data-fullscreen=native]').waitFor();
 for(const [width,height] of [[1920,1080],[1440,900],[1280,720],[1024,768],[2560,1080],[3840,2160]])await check(`fullscreen fits chapters and product sections within ${width}x${height}`,async()=>{
  await p.setViewportSize({width,height});
  for(let chapter=0;chapter<4;chapter++){
   await go(chapter);
   const modes=chapter===2?['利用の広がり','構成を見る','動きを見る','発展をたどる']:chapter===3?['開発の変化','開発上の課題','専門性','まとめ']:['page'];
   for(const mode of modes){if(mode!=='page')await p.getByRole('tab',{name:mode,exact:true}).click();const m=await measure();layouts.push({chapter,mode,...m});assert.ok(m.area>.90,JSON.stringify(m));assert.ok(m.rect.x>=0&&m.rect.y>=0&&m.rect.right<=width+1&&m.rect.bottom<=height+1,JSON.stringify(m));assert.ok(Math.abs(m.scaleX-m.scaleY)<.005,JSON.stringify(m));assert.ok(m.scrollX<=1&&m.scrollY<=1,JSON.stringify(m));assert.deepEqual(m.bad,[],JSON.stringify(m));if(width===1920)await p.screenshot({path:output+`/chapter-${chapter}-${modes.indexOf(mode)}.png`});}
  }
 });
 await check('exit button and browser-driven exit retain the selected subsection',async()=>{
  await p.locator('.studio-fullscreen-toggle').click();await p.locator('main[data-fullscreen=off]').waitFor({state:'attached'});assert.equal(await p.locator('.model-checklist').getAttribute('data-product-tab'),'summary');
  await p.locator('.studio-fullscreen-toggle').click();await p.locator('main[data-fullscreen=native]').waitFor();await p.evaluate(()=>document.exitFullscreen());await p.locator('main[data-fullscreen=off]').waitFor({state:'attached'});assert.equal(await p.locator('main').getAttribute('data-overview'),'false');assert.equal(await p.locator('.model-checklist').getAttribute('data-product-tab'),'summary');
 });
 await check('fullscreen retains the physical book turn and the continuous chapter route',async()=>{
  await p.setViewportSize({width:1440,height:900});await p.locator('.studio-fullscreen-toggle').click();await go(0);await p.emulateMedia({reducedMotion:'no-preference'});await p.locator(active+' .model-page-footer button').click();await p.locator('.book-turn-sheet').waitFor();await p.screenshot({path:output+'/book-turn.png'});await ready();assert.equal(await p.locator('main').getAttribute('data-chapter'),'1');assert.ok((await measure()).area>.90);await p.emulateMedia({reducedMotion:'reduce'});
 });
 await check('unavailable and rejected fullscreen requests use an Escape-dismissable enlarged view',async()=>{
  await p.locator('.studio-fullscreen-toggle').click();await p.locator('main[data-fullscreen=off]').waitFor({state:'attached'});
  await p.evaluate(()=>Object.defineProperty(document,'fullscreenEnabled',{configurable:true,get:()=>false}));await p.locator('.studio-fullscreen-toggle').click();await p.locator('main[data-fullscreen=window]').waitFor();await ready();assert.ok((await measure()).area>.90);await p.keyboard.press('Escape');await p.locator('main[data-fullscreen=off]').waitFor({state:'attached'});assert.equal(await p.locator('main').getAttribute('data-chapter'),'1');
  await p.evaluate(()=>{delete document.fullscreenEnabled;document.querySelector('main').requestFullscreen=()=>Promise.reject(new DOMException('Not allowed','NotAllowedError'));});await p.locator('.studio-fullscreen-toggle').click();await p.locator('main[data-fullscreen=window]').waitFor();await ready();assert.ok((await measure()).area>.90);await p.keyboard.press('Escape');await p.locator('main[data-fullscreen=off]').waitFor({state:'attached'});
 });
 await check('text fallback also fills over 90 percent with usable enlarged content',async()=>{
  const q=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await mockWeather(q);await q.goto(base+'?no3d=1');await q.locator('.studio-scene[data-status=fallback]').waitFor();await go(3,q);await q.locator('.studio-fullscreen-toggle').click();await q.locator('main[data-fullscreen=native]').waitFor();await ready(q);await q.getByRole('tab',{name:'開発上の課題',exact:true}).click();const m=await measure(q);assert.ok(m.area>.90,JSON.stringify(m));assert.ok(m.scrollX<=1&&m.scrollY<=1,JSON.stringify(m));assert.deepEqual(m.bad,[]);await q.keyboard.press('Escape');await q.locator('main[data-fullscreen=off]').waitFor({state:'attached'});assert.equal(await q.locator('.model-checklist').getAttribute('data-product-tab'),'risks');await q.close();
 });
 await check('no uncaught browser errors',async()=>assert.deepEqual(errors,[]));
}finally{await writeFile(output+'/report.json',JSON.stringify({results,layouts,errors},null,2));await browser.close();console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);}
if(results.some(r=>!r.pass))process.exitCode=1;
