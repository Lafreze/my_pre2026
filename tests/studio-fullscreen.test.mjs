import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.STUDIO_URL||'http://127.0.0.1:5173/';
const output=process.env.STUDIO_OUTPUT||'output/playwright/model-presentation';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
p.setDefaultTimeout(15000);
const results=[],errors=[],layouts=[],views=['name','notebook','board','monitor','checklist','cards'];
p.on('pageerror',e=>errors.push(e.message));
p.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
async function check(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name);}catch(e){results.push({name,pass:false,error:e.message});console.error('FAIL',name,e.message.slice(0,600));}}
async function go(n,page=p){
 if(await page.locator('.journey-dots').count())await page.locator('.journey-dots button').nth(n).click();
 else{await page.locator('.studio-index-toggle').click();await page.locator('.studio-index-chapter').nth(n).click();}
 await page.locator(`.studio-scene[data-view=${views[n]}][data-transition=false]`).waitFor();
 await page.locator('.studio-surface-host[data-visible=true]').waitFor();
}
try{
 await p.goto(base,{waitUntil:'networkidle'});await p.locator('.studio-scene[data-status=ready]').waitFor();
 await check('starts directly with personal introduction on the real model, without a sidebar',async()=>{
  assert.equal(await p.locator('.work-studio').getAttribute('data-overview'),'false');assert.equal(await p.locator('.studio-scene').getAttribute('data-view'),'name');
  assert.equal(await p.locator('.studio-copy').count(),0);assert.equal(await p.locator('canvas').count(),1);
  const text=await p.locator('.model-presentation').innerText();for(const fact of ['KIOXIA','2023','VGG','ViT','次フレーム予測','Active Learning','Multi Beam','ADC'])assert.ok(text.includes(fact),fact);
  await p.screenshot({path:`${output}/profile.png`});
 });
 await check('six chapters have a 600-second script and preserve the supplied personal history',async()=>{
  const data=await readFile('app/studio/content.ts','utf8');assert.equal([...data.matchAll(/time: (\d+)/g)].reduce((sum,m)=>sum+Number(m[1]),0),600);
  const scripts=[...data.matchAll(/script: "([^"]+)"/g)];assert.equal(scripts.length,6);
  for(const name of ['KIOXIA','ResNet','OpenClaw','Claude Code','Codex','ADC'])assert.ok(scripts.map(m=>m[1]).join('').includes(name));
 });
 await check('every next action moves straight to the next model and centers its presentation',async()=>{
  await p.evaluate(()=>{window.observedViews=[];new MutationObserver(()=>window.observedViews.push(document.querySelector('.studio-scene').dataset.view)).observe(document.querySelector('.studio-scene'),{attributes:true,attributeFilter:['data-view']});});
  for(let i=0;i<6;i++){
   if(i){await p.locator('.model-page-footer button').click();await p.locator(`.studio-scene[data-view=${views[i]}][data-transition=false]`).waitFor();await p.locator('.studio-surface-host[data-visible=true]').waitFor();}
   const box=await p.locator('.studio-surface-host').boundingBox();assert.ok(Math.abs(box.x+box.width/2-720)<2,JSON.stringify(box));assert.ok(Math.abs(box.y+box.height/2-500)<2,JSON.stringify(box));
   assert.equal(await p.locator('.work-studio').getAttribute('data-overview'),'false');
   await p.screenshot({path:`${output}/${views[i]}.png`});
  }
  assert.deepEqual(await p.evaluate(()=>[...new Set(window.observedViews)]),views.slice(1));
 });
 await check('LLM, tools and agents have distinct explanations and personal transitions',async()=>{
  await go(2);for(const [i,phrase] of [[0,'2022'],[1,'API'],[2,'OpenClaw']]){await p.locator('.evolution-tabs button').nth(i).click();assert.ok((await p.locator('.evolution-detail').innerText()).includes(phrase));}
  assert.ok((await p.locator('.model-annotation').innerText()).includes('利用体験'));
 });
 await check('all five agent components are selectable inside the monitor',async()=>{
  await go(3);assert.equal(await p.locator('.agent-component').count(),5);
  for(const name of ['Model','Context','Tools','Harness','Loop']){await p.locator('.agent-component').filter({has:p.getByText(name,{exact:true})}).click();assert.ok((await p.locator('.agent-part-detail').innerText()).includes(name));}
  await p.screenshot({path:`${output}/monitor-components.png`});
 });
 await check('agent execution shows a real width failure, repair, replay, pause and reset',async()=>{
  await p.getByRole('tab',{name:'動きをみる',exact:true}).click();await p.getByRole('button',{name:'4 問題を見つける',exact:true}).click();
  const failed=await p.locator('.studio-mini-viewport').evaluate(e=>({width:e.clientWidth,button:e.querySelector('.studio-example-button').getBoundingClientRect().width,overflow:e.scrollWidth>e.clientWidth}));assert.ok(failed.overflow);assert.ok(Math.abs(failed.button-380)<2);
  await p.screenshot({path:`${output}/monitor-failure.png`});await p.getByRole('button',{name:'6 同じ条件で確かめる',exact:true}).click();
  const fixed=await p.locator('.studio-mini-viewport').evaluate(e=>({width:e.clientWidth,button:e.querySelector('.studio-example-button').getBoundingClientRect().width,overflow:e.scrollWidth>e.clientWidth}));assert.equal(fixed.width,failed.width);assert.equal(fixed.overflow,false);assert.ok(Math.abs(fixed.button-284)<2);
  await p.getByRole('button',{name:'Agentデモをリセット'}).click();await p.getByRole('button',{name:'再生',exact:true}).click();await p.waitForTimeout(2350);await p.getByRole('button',{name:'一時停止',exact:true}).click();assert.equal(await p.locator('.studio-step-track [aria-current=step] span').innerText(),'2');
  await p.getByRole('button',{name:'7 結果と確認範囲を渡す',exact:true}).click();assert.ok(await p.getByRole('button',{name:'再生',exact:true}).isDisabled());await p.screenshot({path:`${output}/monitor-verified.png`});
 });
 await check('application examples and the actual Codex-made interface are visible',async()=>{
  await go(4);assert.ok((await p.locator('.made-with-agent').innerText()).includes('Codex'));assert.ok(await p.locator('.made-with-agent img').evaluate(e=>e.complete&&e.naturalWidth>0));
  for(let i=0;i<3;i++){await p.locator('.application-choices button').nth(i).click();assert.ok((await p.locator('.application-detail').innerText()).length>25);}
 });
 await check('card theme, drawing, reveal and repeat work on the physical card surface',async()=>{
  await go(5);await p.getByRole('button',{name:'新しく始める',exact:true}).click();await p.getByRole('button',{name:'一枚、ひいてみる'}).click();await p.getByRole('button',{name:'カードを裏返す',exact:true}).click();assert.ok((await p.locator('.studio-card-front').innerText()).includes('小さな一歩'));await p.screenshot({path:`${output}/card-result.png`});
  await p.reload({waitUntil:'networkidle'});await p.locator('.studio-scene[data-status=ready][data-view=name]').waitFor();await go(5);assert.equal(await p.locator('.studio-play-card').getAttribute('data-drawn'),'true');assert.ok(await p.locator('.studio-play-card').evaluate(e=>e.classList.contains('is-flipped')));
  await p.getByRole('button',{name:'もう一度ひく'}).click();assert.equal(await p.locator('.studio-play-card').getAttribute('data-drawn'),'false');
 });
 await check('archive keeps 24 pages, searches and restores the exact current model',async()=>{
  await go(3);await p.getByRole('tab',{name:'動きをみる',exact:true}).click();await p.getByRole('button',{name:'4 問題を見つける',exact:true}).click();
  const camera=await p.locator('.studio-scene').getAttribute('data-camera-position');await p.getByRole('button',{name:'参考資料',exact:true}).click();assert.equal(await p.locator('.studio-library-grid>button').count(),24);await p.getByRole('searchbox',{name:'資料を検索'}).fill('Evals');await p.locator('.studio-library-grid>button').click();await p.frameLocator('iframe').locator('#presentation[data-current-slide=trust]').waitFor({timeout:60000});await p.getByRole('button',{name:'資料を閉じて元の章に戻る'}).click();assert.equal(await p.locator('iframe').count(),0);assert.equal(await p.locator('.studio-scene').getAttribute('data-camera-position'),camera);assert.ok((await p.locator('.studio-step-text').innerText()).includes('問題を見つける'));
 });
 await check('keyboard, notes and optional timer follow the six-chapter story',async()=>{
  await go(2);await p.locator('.model-presentation h1').focus();await p.keyboard.press('ArrowRight');await p.locator('.studio-scene[data-view=monitor][data-transition=false]').waitFor();await p.keyboard.press('ArrowLeft');await p.locator('.studio-scene[data-view=board][data-transition=false]').waitFor();
  await p.locator('.studio-index-toggle').click();await p.getByRole('button',{name:'講者モードを開く'}).click();assert.ok((await p.locator('.studio-script').innerText()).includes('OpenClaw'));await p.getByRole('button',{name:'計時を開始'}).click();await p.waitForTimeout(1100);assert.notEqual(await p.locator('.studio-notes-clock>b').innerText(),'0:00');await p.getByRole('button',{name:'計時を停止'}).click();await p.locator('.studio-notes-dialog').getByRole('button',{name:'閉じる ×'}).click();
  await p.locator('.model-presentation h1').focus();await p.keyboard.press('Escape');await p.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();await p.locator('.studio-scene canvas').click({position:{x:20,y:300}});await p.keyboard.press('Enter');await p.locator('.studio-scene[data-view=board][data-transition=false]').waitFor();
 });
 for(const [width,height] of [[1366,768],[820,1180],[390,844],[320,720]])await check(`all six model surfaces fit and scroll within ${width}×${height}`,async()=>{
  await p.setViewportSize({width,height});
  for(let n=0;n<6;n++){
   await go(n);const m=await p.evaluate(()=>{const el=document.querySelector('.studio-surface-host'),scroll=el.querySelector('.model-page-scroll'),r=el.getBoundingClientRect(),foot=document.querySelector('.studio-footer').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,body:document.documentElement.scrollWidth,overflow:scroll.scrollWidth>scroll.clientWidth+2,bottom:r.bottom,footerTop:foot.top,inert:el.inert};});layouts.push({viewport:[width,height],chapter:n,...m});
   assert.ok(m.x>=0&&m.x+m.width<=width+2,JSON.stringify(m));assert.ok(Math.abs(m.x+m.width/2-width/2)<2);assert.ok(m.bottom<=m.footerTop+1,JSON.stringify(m));assert.equal(m.body,width);assert.equal(m.overflow,false,JSON.stringify(m));assert.equal(m.inert,false);
   if(width===390||width===1366)await p.screenshot({path:`${output}/${width}-${views[n]}.png`});
  }
 });
 await check('touch can navigate and reveal a card on the projected phone page',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),q=await context.newPage();await q.goto(base,{waitUntil:'networkidle'});await q.locator('.studio-scene[data-status=ready]').waitFor();await go(5,q);await q.getByRole('button',{name:'一枚、ひいてみる'}).tap();await q.getByRole('button',{name:'カードを裏返す',exact:true}).tap();assert.ok(await q.locator('.studio-play-card').evaluate(e=>e.classList.contains('is-flipped')));await q.screenshot({path:`${output}/phone-card-touch.png`});await context.close();
 });
 await check('text fallback keeps the same readable chapter, working controls and retry',async()=>{
  const q=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await q.goto(base+'?no3d=1');await q.locator('.studio-scene[data-status=fallback]').waitFor();assert.equal(await q.locator('canvas').count(),0);assert.equal(await q.locator('.studio-surface-host').evaluate(e=>e.inert),false);await q.locator('.journey-dots button').nth(3).click();await q.getByRole('tab',{name:'動きをみる',exact:true}).click();await q.getByRole('button',{name:'次のステップ →',exact:true}).click();assert.ok((await q.locator('.studio-step-text').innerText()).includes('小さく分ける'));await q.getByRole('button',{name:'3Dを再読み込み'}).click();await q.locator('.studio-scene[data-status=ready][data-view=monitor]').waitFor();await q.close();
 });
 await p.setViewportSize({width:1440,height:1000});await p.emulateMedia({reducedMotion:'no-preference'});
 await check('camera transitions are continuous, interruptible and never route through the overview',async()=>{
  await go(0);const before=await p.locator('.studio-scene').getAttribute('data-camera-position');await p.locator('.journey-dots button').nth(3).click();await p.locator('.studio-scene[data-transition=true]').waitFor();
  assert.equal(await p.locator('.studio-surface-host').evaluate(e=>e.inert),true);await p.waitForTimeout(180);const midway=await p.locator('.studio-scene').getAttribute('data-camera-position');assert.notEqual(midway,before);assert.equal(await p.locator('.studio-scene').getAttribute('data-view'),'monitor');
  const skip=await p.locator('.studio-skip').boundingBox();assert.ok(skip.x>0&&skip.y>0&&skip.x+skip.width<=1440&&skip.y+skip.height<=1000&&skip.height>=44,JSON.stringify(skip));
  await p.locator('.journey-dots button').nth(1).click();await p.locator('.studio-skip').click();await p.locator('.studio-scene[data-view=notebook][data-transition=false]').waitFor();assert.equal(await p.locator('.studio-copy').count(),0);assert.ok((await p.locator('.model-presentation h1').innerText()).includes('最初の驚き'));
 });
 await check('settled close-up stops rendering and context loss recovers on the same model',async()=>{
  await p.mouse.move(0,0);await p.waitForTimeout(900);const frames=await p.locator('.studio-scene').getAttribute('data-frames');await p.waitForTimeout(450);assert.equal(await p.locator('.studio-scene').getAttribute('data-frames'),frames);
  await p.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await p.locator('.studio-scene[data-status=fallback]').waitFor();await p.getByRole('button',{name:'3Dを再読み込み'}).click();await p.locator('.studio-scene[data-status=ready][data-view=notebook]').waitFor();assert.equal(await p.locator('canvas').count(),1);
 });
 await check('no browser exceptions or shader errors',async()=>assert.deepEqual(errors,[]));
}finally{await writeFile(`${output}/report.json`,JSON.stringify({results,errors,layouts},null,2));console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);await browser.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
