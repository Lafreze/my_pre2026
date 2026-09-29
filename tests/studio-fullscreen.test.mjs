import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.STUDIO_URL||'http://127.0.0.1:5173/';
const output=process.env.STUDIO_OUTPUT||'output/playwright/model-presentation';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
p.setDefaultTimeout(15000);
const results=[],errors=[],layouts=[],views=['name','notebook','board','monitor','checklist'];
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
 await check('five chapters have a 600-second script and preserve the supplied personal history',async()=>{
  const data=await readFile('app/studio/content.ts','utf8');assert.equal([...data.matchAll(/time: (\d+)/g)].reduce((sum,m)=>sum+Number(m[1]),0),600);
  const scripts=[...data.matchAll(/script: "([^"]+)"/g)];assert.equal(scripts.length,5);
  for(const name of ['KIOXIA','ResNet','OpenClaw','Claude Code','Codex','ADC'])assert.ok(scripts.map(m=>m[1]).join('').includes(name));
 });
 await check('every next action moves straight to the next model and centers its presentation',async()=>{
  await p.evaluate(()=>{window.observedViews=[];new MutationObserver(()=>window.observedViews.push(document.querySelector('.studio-scene').dataset.view)).observe(document.querySelector('.studio-scene'),{attributes:true,attributeFilter:['data-view']});});
  for(let i=0;i<5;i++){
   if(i){await p.locator('.model-page-footer button').click();await p.locator(`.studio-scene[data-view=${views[i]}][data-transition=false]`).waitFor();await p.locator('.studio-surface-host[data-visible=true]').waitFor();}
   const box=await p.locator('.studio-surface-host').boundingBox();assert.ok(Math.abs(box.x+box.width/2-720)<2,JSON.stringify(box));assert.ok(Math.abs(box.y+box.height/2-500)<2,JSON.stringify(box));
   assert.equal(await p.locator('.work-studio').getAttribute('data-overview'),'false');
   await p.screenshot({path:`${output}/${views[i]}.png`});
  }
  assert.deepEqual(await p.evaluate(()=>[...new Set(window.observedViews)]),views.slice(1));
 });
 await check('LLM, tools and agents have distinct explanations and personal transitions',async()=>{
  await go(2);await p.getByRole('tab',{name:'私の体験',exact:true}).click();for(const [i,phrase] of [[0,'2022'],[1,'API'],[2,'OpenClaw']]){await p.locator('.evolution-tabs button').nth(i).click();assert.ok((await p.locator('.evolution-detail').innerText()).includes(phrase));}
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
 await check('LLM history explains six primary-sourced milestones separately from personal memories',async()=>{
  await go(2);await p.getByRole('tab',{name:'技術の発展',exact:true}).click();assert.equal(await p.locator('.llm-era-rail button').count(),6);
  for(let i=0;i<6;i++){await p.locator('.llm-era-rail button').nth(i).click();assert.ok((await p.locator('.llm-era-detail').innerText()).length>100);assert.ok(await p.locator('.llm-source-row a').first().getAttribute('href'));}
 });
 await check('agent components expose input, output, design choices and context-memory-RAG distinctions',async()=>{
  await go(3);await p.getByRole('tab',{name:'構成をみる',exact:true}).click();for(let i=0;i<5;i++){await p.locator('.agent-component').nth(i).click();const text=await p.locator('.agent-part-detail').innerText();assert.ok(text.includes('INPUT')&&text.includes('OUTPUT'));assert.ok((await p.locator('.agent-part-design').innerText()).length>45);}
  await p.locator('.agent-context').click();assert.ok((await p.locator('.agent-part-detail').innerText()).includes('RAG'));
 });
 await check('product workflow replaces the screenshot with five stages and leads to four competitive advantages',async()=>{
  await go(4);assert.equal(await p.locator('.model-checklist img').count(),0);await p.getByRole('tab',{name:'つくるまで',exact:true}).click();
  for(let i=0;i<5;i++){await p.locator('.product-step-rail button').nth(i).click();assert.ok((await p.locator('.product-step-detail').innerText()).includes('人が決める'));assert.ok((await p.locator('.product-check').innerText()).length>20);}
  await p.locator('.model-page-footer button').click();assert.equal(await p.locator('.advantage-grid article').count(),4);assert.equal(await p.locator('.work-studio').getAttribute('data-overview'),'false');
 });
 await check('retired card experience is absent from the story and the last chapter ends in exploration',async()=>{
  await go(4);assert.equal(await p.locator('.journey-dots button').count(),5);assert.equal(await p.locator('[data-object=cards],.studio-play-card').count(),0);
  assert.equal(/day\s*card|カードをひく/i.test(await p.locator('body').innerText()),false);
  await p.locator('.model-page-footer button').click();await p.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('.studio-object')].filter(e=>getComputedStyle(e).visibility==='visible').length===6);assert.equal(await p.locator('.studio-object:visible').count(),6);await go(0);
 });
 await check('archive keeps 20 pages, searches and restores the exact current model',async()=>{
  await go(3);await p.getByRole('tab',{name:'動きをみる',exact:true}).click();await p.getByRole('button',{name:'4 問題を見つける',exact:true}).click();
  const camera=await p.locator('.studio-scene').getAttribute('data-camera-position');await p.getByRole('button',{name:'参考資料',exact:true}).click();assert.equal(await p.locator('.studio-library-grid>button').count(),20);await p.getByRole('searchbox',{name:'資料を検索'}).fill('Evals');await p.locator('.studio-library-grid>button').click();await p.frameLocator('iframe').locator('#presentation[data-current-slide=trust]').waitFor({timeout:60000});await p.getByRole('button',{name:'資料を閉じて元の章に戻る'}).click();assert.equal(await p.locator('iframe').count(),0);assert.equal(await p.locator('.studio-scene').getAttribute('data-camera-position'),camera);assert.ok((await p.locator('.studio-step-text').innerText()).includes('問題を見つける'));
 });
 await check('reference deck ignores removed pages even with saved settings and old deep links',async()=>{
  const q=await browser.newPage({reducedMotion:'reduce'});await q.addInitScript(()=>localStorage.setItem('gen-ai-slide-settings-v2',JSON.stringify({hidden:[],order:['game-case','intro','game-process']})));await q.goto(new URL('reference/?slide=game-case',base).href,{waitUntil:'networkidle'});
  await q.locator('#presentation[data-ready=true]').waitFor();assert.equal(await q.locator('section[data-slide-id]').count(),20);assert.equal(await q.locator('section[data-slide-id^="game-"]').count(),0);assert.equal(await q.locator('iframe[src*="daycard"],a[href*="daycard"]').count(),0);assert.equal(/day\s*card/i.test(await q.locator('body').innerText()),false);await q.close();
 });
 await check('keyboard, notes and optional timer follow the five-chapter story',async()=>{
  await go(2);await p.locator('.model-presentation h1').focus();await p.keyboard.press('ArrowRight');await p.locator('.studio-scene[data-view=monitor][data-transition=false]').waitFor();await p.keyboard.press('ArrowLeft');await p.locator('.studio-scene[data-view=board][data-transition=false]').waitFor();
  await p.locator('.studio-index-toggle').click();await p.getByRole('button',{name:'講者モードを開く'}).click();assert.ok((await p.locator('.studio-script').innerText()).includes('Transformer'));await p.getByRole('button',{name:'計時を開始'}).click();await p.waitForTimeout(1100);assert.notEqual(await p.locator('.studio-notes-clock>b').innerText(),'0:00');await p.getByRole('button',{name:'計時を停止'}).click();await p.locator('.studio-notes-dialog').getByRole('button',{name:'閉じる ×'}).click();
  await p.locator('.model-presentation h1').focus();await p.keyboard.press('Escape');await p.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();await p.locator('.studio-scene canvas').click({position:{x:20,y:300}});await p.keyboard.press('Enter');await p.locator('.studio-scene[data-view=board][data-transition=false]').waitFor();
 });
 for(const [width,height] of [[1440,1000],[1366,768],[1024,768],[820,1180],[768,1024],[390,844],[375,667],[320,568],[844,390],[667,375],[720,500]])await check(`all five model surfaces fit and scroll within ${width}×${height}`,async()=>{
  await p.setViewportSize({width,height});
  for(let n=0;n<5;n++){
   await go(n);
   const modes=n===2?['history-0','history-1','history-2','history-3','history-4','history-5','evolution-0','evolution-1','evolution-2']:n===3?['parts','context','tools','harness','loop-part','loop']:n===4?['product-0','product-1','product-2','product-3','product-4','value']:['page'];
   for(const mode of modes){
    if(n===2){const history=mode.startsWith('history');await p.getByRole('tab',{name:history?'技術の発展':'私の体験',exact:true}).click();await p.locator(history?'.llm-era-rail button':'.evolution-tabs button').nth(Number(mode.slice(-1))).click();}
    if(n===4){await p.getByRole('tab',{name:mode==='value'?'競争力はどこへ':'つくるまで',exact:true}).click();if(mode!=='value')await p.locator('.product-step-rail button').nth(Number(mode.slice(-1))).click();}
    if(n===3){await p.getByRole('tab',{name:mode==='loop'?'動きをみる':'構成をみる',exact:true}).click();if(mode!=='loop')await p.locator('.agent-component').nth(['parts','context','tools','harness','loop-part'].indexOf(mode)).click();}
    const m=await p.evaluate(()=>{
     const el=document.querySelector('.studio-surface-host'),scroll=el.querySelector('.model-page-scroll'),r=el.getBoundingClientRect(),foot=document.querySelector('.studio-footer').getBoundingClientRect(),inside=el.querySelector('.model-page-footer').getBoundingClientRect(),header=document.querySelector('.studio-header').getBoundingClientRect();
     const mesh=JSON.parse(el.dataset.surfaceBounds);
     const outside=[...scroll.querySelectorAll('h1,h2,p,small,code,button,figure,.agent-system,.agent-part-detail,.demo-device-clip')].filter(e=>!e.classList.contains('is-broken')).map(e=>({tag:e.tagName,name:e.textContent.slice(0,36),r:e.getBoundingClientRect().toJSON()})).filter(e=>e.r.width>0&&(e.r.left<r.left+1||e.r.right>r.right-1));
     return {x:r.x,y:r.y,width:r.width,height:r.height,body:document.documentElement.scrollWidth,overflow:scroll.scrollWidth>scroll.clientWidth+2,verticalOverflow:scroll.scrollHeight>scroll.clientHeight+2,bottom:r.bottom,footerTop:foot.top,headerBottom:header.bottom,inert:el.inert,mesh,insideBottom:inside.bottom,scrollBottom:scroll.getBoundingClientRect().bottom,insideTop:inside.top,outside};
    });layouts.push({viewport:[width,height],chapter:n,mode,...m});
    assert.ok(m.x>=0&&m.x+m.width<=width+2,JSON.stringify(m));assert.ok(Math.abs(m.x+m.width/2-width/2)<2);assert.ok(m.bottom<=m.footerTop+1,JSON.stringify(m));assert.ok(m.y>=m.headerBottom+2,JSON.stringify(m));assert.equal(m.body,width);assert.equal(m.overflow,false,JSON.stringify(m));assert.equal(m.inert,false);if(width>=1000&&height>=768)assert.equal(m.verticalOverflow,false,`Desktop content needs scrolling: ${width} ${views[n]} ${mode}`);
    assert.ok(m.x>m.mesh.left&&m.x+m.width<m.mesh.right&&m.y>m.mesh.top&&m.bottom<m.mesh.bottom,JSON.stringify(m));assert.ok(m.insideBottom<=m.bottom+1&&m.scrollBottom<=m.insideTop+1,JSON.stringify(m));assert.deepEqual(m.outside,[],`${width}×${height} ${views[n]} ${mode}: ${JSON.stringify(m.outside)}`);
    await p.locator('.model-page-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await p.locator('.model-page-scroll').evaluate(e=>e.scrollTop=0);
    if([1440,1366,390,320,844].includes(width)&&['page','parts','context','loop','history-0','history-5','product-2','value'].includes(mode))await p.screenshot({path:`${output}/${width}-${views[n]}-${mode}.png`});
   }
  }
 });
 await check('touch can select agent components and reach the ending without overflow',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),q=await context.newPage();await q.goto(base,{waitUntil:'networkidle'});await q.locator('.studio-scene[data-status=ready]').waitFor();await go(3,q);await q.locator('.agent-tools').tap();assert.ok((await q.locator('.agent-part-detail').innerText()).includes('Tools'));await q.locator('.model-page-footer button').tap();await q.locator('.studio-scene[data-view=checklist][data-transition=false]').waitFor();await q.getByRole('tab',{name:'つくるまで',exact:true}).tap();await q.locator('.product-step-rail button').nth(2).tap();assert.ok((await q.locator('.product-step-detail').innerText()).includes('試作'));await q.screenshot({path:`${output}/phone-application-touch.png`});await context.close();
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
