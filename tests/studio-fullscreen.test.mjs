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
 await page.locator('.studio-surface-host[data-active=true][data-interactive=true]').waitFor();
}
try{
 await p.goto(base,{waitUntil:'networkidle'});await p.locator('.studio-scene[data-status=ready]').waitFor();
 await check('overview starts still with a clickable primary entrance and five story destinations',async()=>{
  assert.equal(await p.locator('.work-studio').getAttribute('data-overview'),'true');assert.equal(await p.locator('.studio-scene').getAttribute('data-breeze'),'false');
  assert.equal(await p.locator('.garden-progress button').count(),5);assert.equal(await p.locator('.environment-menu').getAttribute('open'),null);
  assert.ok(!(await p.locator('.garden-discovery').innerText()).includes('THANK YOU'));
  await p.getByRole('button',{name:'案内をはじめる →',exact:true}).click();await p.locator('.studio-surface-host[data-kind=name][data-interactive=true]').waitFor();
  assert.equal(await p.locator('.studio-copy').count(),0);assert.equal(await p.locator('canvas').count(),1);
  const text=await p.locator('.personal-introduction').innerText();for(const fact of ['KIOXIA','2023','日立ハイテク','次フレーム予測','Active Learning','Multi Beam','ADC'])assert.ok(text.includes(fact),fact);
  assert.equal(await p.locator('.personal-career li').count(),2);assert.equal((text.match(/ADC/g)||[]).length,1);assert.ok(!text.includes('2019'));assert.ok(!text.includes('VGG'));assert.ok(!(await p.locator('.personal-name').innerText()).includes('です'));
  await p.screenshot({path:output+'/profile.png'});
 });
 await check('five chapters have a 505-second script and preserve the supplied personal history',async()=>{
  const data=await readFile('app/studio/content.ts','utf8');assert.equal([...data.matchAll(/time: (\d+)/g)].reduce((sum,m)=>sum+Number(m[1]),0),505);
  const scripts=[...data.matchAll(/script: "([^"]+)"/g)];assert.equal(scripts.length,5);
  for(const name of ['KIOXIA','ResNet','OpenClaw','Claude Code','Codex','ADC'])assert.ok(scripts.map(m=>m[1]).join('').includes(name));
 });
 await check('every next action moves straight to the next model and centers its presentation',async()=>{
  await p.evaluate(()=>{window.observedViews=[];new MutationObserver(()=>window.observedViews.push(document.querySelector('.studio-scene').dataset.view)).observe(document.querySelector('.studio-scene'),{attributes:true,attributeFilter:['data-view']});});
  for(let i=0;i<5;i++){
   if(i){await p.locator('.studio-surface-host[data-active=true] .model-page-footer button').click();await p.locator(`.studio-scene[data-view=${views[i]}][data-transition=false]`).waitFor();await p.locator('.studio-surface-host[data-active=true][data-interactive=true]').waitFor();}
   const box=await p.locator('.studio-surface-host[data-active=true]').boundingBox();assert.ok(Math.abs(box.x+box.width/2-720)<2,JSON.stringify(box));assert.ok(Math.abs(box.y+box.height/2-500)<2,JSON.stringify(box));
   assert.equal(await p.locator('.work-studio').getAttribute('data-overview'),'false');
   await p.screenshot({path:`${output}/${views[i]}.png`});
  }
  assert.deepEqual(await p.evaluate(()=>[...new Set(window.observedViews)]),views.slice(1));
 });
 await check('three usage modes keep the same task and distinguish generation, execution and feedback',async()=>{
  await go(2);assert.equal(await p.locator('.usage-tabs button').count(),3);assert.equal(await p.locator('.evolution-tabs,.paper-tabs[aria-label="LLMの説明"]').count(),0);
  for(const [i,phrase] of [[0,'2022'],[1,'API'],[2,'OpenClaw']]){await p.locator('.usage-tabs button').nth(i).click();assert.ok((await p.locator('.usage-memory').innerText()).includes(phrase));assert.equal(await p.locator('.usage-task p').innerText(),'イベントの参加登録ページをつくる');if(i)assert.ok(!(await p.locator('.usage-memory').innerText()).includes('2022'));}
  assert.ok((await p.locator('.usage-feedback').innerText()).includes('文脈'));await p.locator('.usage-tabs button').nth(1).click();assert.ok((await p.locator('.usage-output').innerText()).includes('System'));assert.ok((await p.locator('.usage-scope').innerText()).includes('1回に限りません'));
 });
 await check('harness encloses the roles and loop selection highlights the directed feedback path',async()=>{
  await go(3);assert.equal(await p.locator('.harness-frame .architecture-node').count(),3);
  for(const element of ['model','context','tools','harness','loop']){await p.locator('.architecture-select[data-element='+element+']').click();assert.ok((await p.locator('.architecture-detail h2').innerText()).toLowerCase().includes(element));}
  assert.equal(await p.locator('.agent-circuit').getAttribute('data-loop-selected'),'true');assert.equal(await p.locator('.agent-part-detail,.agent-data-flow').count(),0);
  assert.equal(await p.locator('.circuit-wires g[marker-end] path').count(),4);
  await p.locator('.node-model').click();const shape=await p.locator('.node-model').boundingBox();assert.ok(Math.abs(shape.width-shape.height)<1);
  await p.getByRole('button',{name:'Loopの循環経路を選択',exact:true}).focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.agent-circuit').getAttribute('data-loop-selected'),'true');
  await p.screenshot({path:output+'/monitor-components.png'});
 });
 await check('webpage execution updates context, corrects the specimen and finishes with evidence',async()=>{
  await p.getByRole('tab',{name:'動きを見る',exact:true}).click();await p.getByLabel('終了条件の例',{exact:true}).selectOption('complete');
  await p.getByRole('button',{name:'Agentデモをリセット'}).click();
  for(let i=0;i<7;i++){
   if(i)await p.getByRole('button',{name:'次の工程 →',exact:true}).click();
   assert.equal(await p.locator('.agent-architecture').getAttribute('data-step'),String(i));assert.equal(await p.locator('.harness-frame[data-highlight=true],.architecture-node[data-highlight=true]').count(),1);
   if(i===3){assert.ok((await p.locator('.context-records').innerText()).includes('64px'));assert.ok((await p.locator('.specimen-result').innerText()).includes('FAIL'));await p.screenshot({path:output+'/monitor-failure.png'});}
   if(i===5){assert.ok((await p.locator('.context-records').innerText()).includes('再検査'));assert.ok((await p.locator('.specimen-result').innerText()).includes('PASS'));}
  }
  assert.equal(await p.locator('.execution-detail').getAttribute('data-outcome'),'delivered');assert.ok(await p.getByRole('button',{name:'工程を再生',exact:true}).isDisabled());assert.ok(await p.getByRole('button',{name:'次の工程 →',exact:true}).isDisabled());
  await p.screenshot({path:output+'/monitor-execution.png'});
  await p.getByRole('button',{name:'Agentデモをリセット'}).click();await p.getByRole('button',{name:'工程を再生',exact:true}).click();await p.waitForTimeout(2350);await p.getByRole('button',{name:'一時停止',exact:true}).click();assert.equal(await p.locator('.agent-architecture').getAttribute('data-step'),'1');
 });
 await check('execution limits and permission blockers stop playback and request human judgment',async()=>{
  for(const [scenario,end] of [['limit',3],['blocked',2]]){
   await p.getByLabel('終了条件の例',{exact:true}).selectOption(scenario);await p.locator('.execution-track button').nth(end-1).click();await p.getByRole('button',{name:'工程を再生',exact:true}).click();
   await p.locator('.agent-architecture[data-finished=true]').waitFor();assert.equal(await p.locator('.agent-architecture').getAttribute('data-step'),String(end));assert.equal(await p.locator('.execution-detail').getAttribute('data-outcome'),'human');assert.ok((await p.locator('.execution-detail').innerText()).includes('人に確認'));
   assert.ok(await p.getByRole('button',{name:'次の工程 →',exact:true}).isDisabled());assert.ok(await p.getByRole('button',{name:'工程を再生',exact:true}).isDisabled());assert.equal(await p.locator('.execution-track button:disabled').count(),6-end);
   await p.waitForTimeout(2400);assert.equal(await p.locator('.agent-architecture').getAttribute('data-step'),String(end));
  }
  await p.getByLabel('終了条件の例',{exact:true}).selectOption('complete');
 });
 await check('ViT shows a recognizable image, every patch, positional embeddings and the classifier',async()=>{
  await go(1);await p.locator('.vit-stage-tabs button').nth(0).click();assert.equal(await p.locator('.vit-image-patch').count(),16);
  assert.ok((await p.locator('.vit-image-patch').first().evaluate(e=>getComputedStyle(e).backgroundImage)).includes('inspection-sample.svg'));
  await p.locator('.vit-stage-tabs button').nth(1).click();await p.getByRole('button',{name:'パッチ 11',exact:true}).click();assert.equal(await p.getByRole('button',{name:'パッチ 11',exact:true}).getAttribute('aria-pressed'),'true');
  await p.locator('.vit-stage-tabs button').nth(2).click();assert.equal(await p.locator('.vit-token').count(),16);assert.equal(await p.getByRole('button',{name:'トークン 11',exact:true}).getAttribute('aria-pressed'),'true');assert.ok((await p.locator('.vit-sequence').innerText()).includes('[CLS]'));assert.ok((await p.locator('.vit-pipeline').innerText()).includes('位置情報'));
  await p.getByRole('button',{name:'ViTの詳しい説明'}).click();assert.ok((await p.locator('.vit-info').innerText()).includes('分類ヘッド'));await p.getByRole('button',{name:'ViTの説明を閉じる'}).click();
  await p.screenshot({path:output+'/vision-patches.png'});
 });
 await check('optional background opens six primary-sourced milestones and Escape preserves the chapter',async()=>{
  await go(2);await p.getByRole('button',{name:'背景を見る ↗'}).click();assert.equal(await p.locator('.llm-background[open]').count(),1);assert.equal(await p.locator('.llm-era-rail button').count(),6);
  for(let i=0;i<6;i++){await p.locator('.llm-era-rail button').nth(i).click();assert.ok((await p.locator('.llm-era-detail').innerText()).length>100);assert.ok(await p.locator('.llm-source-row a').first().getAttribute('href'));}
  await p.keyboard.press('Escape');assert.equal(await p.locator('.llm-background[open]').count(),0);assert.equal(await p.locator('.studio-scene').getAttribute('data-view'),'board');
 });
 await check('role explanations distinguish context, decisions, execution control and feedback',async()=>{
  await go(3);await p.getByRole('tab',{name:'構成を見る',exact:true}).click();
  for(const [element,phrase] of [['model','操作要求'],['context','RAG'],['tools','読み取り'],['harness','単一の配置場所'],['loop','独立した判断主体ではない']]){await p.locator('.architecture-select[data-element='+element+']').click();assert.ok((await p.locator('.architecture-detail').innerText()).includes(phrase));}
 });
 await check('product workflow replaces the screenshot with five stages and leads to four competitive advantages',async()=>{
  await go(4);assert.equal(await p.locator('.model-checklist img').count(),0);await p.getByRole('tab',{name:'開発プロセス',exact:true}).click();
  for(let i=0;i<5;i++){await p.locator('.product-step-rail button').nth(i).click();assert.ok((await p.locator('.product-step-detail').innerText()).includes('人が決める'));assert.ok((await p.locator('.product-check').innerText()).length>20);}
  await p.locator('.studio-surface-host[data-active=true] .model-page-footer button').click();assert.equal(await p.locator('.advantage-grid article').count(),4);assert.equal(await p.locator('.work-studio').getAttribute('data-overview'),'false');
 });
 await check('retired card experience is absent from the story and the last chapter ends in exploration',async()=>{
  await go(4);assert.equal(await p.locator('.journey-dots button').count(),5);assert.equal(await p.locator('[data-object=cards],.studio-play-card').count(),0);
  assert.equal(/day\s*card|カードをひく/i.test(await p.locator('body').innerText()),false);
  await p.locator('.studio-surface-host[data-active=true] .model-page-footer button').click();await p.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('.studio-object')].filter(e=>getComputedStyle(e).visibility==='visible').length===6);assert.equal(await p.locator('.studio-object:visible').count(),6);await go(0);
 });
 await check('archive keeps 20 pages, searches and restores the exact current model',async()=>{
  await go(3);await p.getByRole('tab',{name:'動きを見る',exact:true}).click();await p.getByRole('button',{name:'4 ボタンの幅超過を発見',exact:true}).click();
  const camera=await p.locator('.studio-scene').getAttribute('data-camera-position');await p.getByRole('button',{name:'参考資料',exact:true}).click();assert.equal(await p.locator('.studio-library-grid>button').count(),20);await p.getByRole('searchbox',{name:'資料を検索'}).fill('Evals');await p.locator('.studio-library-grid>button').click();await p.frameLocator('iframe').locator('#presentation[data-current-slide=trust]').waitFor({timeout:60000});await p.getByRole('button',{name:'資料を閉じて元の章に戻る'}).click();assert.equal(await p.locator('iframe').count(),0);assert.equal(await p.locator('.studio-scene').getAttribute('data-camera-position'),camera);assert.ok((await p.locator('.execution-detail').innerText()).includes('ボタンの幅超過を発見'));
 });
 await check('reference deck ignores removed pages even with saved settings and old deep links',async()=>{
  const q=await browser.newPage({reducedMotion:'reduce'});await q.addInitScript(()=>localStorage.setItem('gen-ai-slide-settings-v2',JSON.stringify({hidden:[],order:['game-case','intro','game-process']})));await q.goto(new URL('reference/?slide=game-case',base).href,{waitUntil:'networkidle'});
  await q.locator('#presentation[data-ready=true]').waitFor();assert.equal(await q.locator('section[data-slide-id]').count(),20);assert.equal(await q.locator('section[data-slide-id^="game-"]').count(),0);assert.equal(await q.locator('iframe[src*="daycard"],a[href*="daycard"]').count(),0);assert.equal(/day\s*card/i.test(await q.locator('body').innerText()),false);await q.close();
 });
 await check('keyboard, notes and optional timer follow the five-chapter story',async()=>{
  await go(2);await p.locator('.studio-surface-host[data-active=true] .model-presentation h1').focus();await p.keyboard.press('ArrowRight');await p.locator('.studio-scene[data-view=monitor][data-transition=false]').waitFor();await p.keyboard.press('ArrowLeft');await p.locator('.studio-scene[data-view=board][data-transition=false]').waitFor();
  await p.locator('.studio-index-toggle').click();await p.getByRole('button',{name:'講者モードを開く'}).click();assert.ok((await p.locator('.studio-script').innerText()).includes('参加登録'));await p.getByRole('button',{name:'計時を開始'}).click();await p.waitForTimeout(1100);assert.notEqual(await p.locator('.studio-notes-clock>b').innerText(),'0:00');await p.getByRole('button',{name:'計時を停止'}).click();await p.locator('.studio-notes-dialog').getByRole('button',{name:'閉じる ×'}).click();
  await p.locator('.studio-surface-host[data-active=true] .model-presentation h1').focus();await p.keyboard.press('Escape');await p.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();await p.locator('.studio-scene canvas').click({position:{x:20,y:300}});await p.keyboard.press('Enter');await p.locator('.studio-scene[data-view=board][data-transition=false]').waitFor();
 });
 for(const [width,height] of [[1920,1080],[1680,1050],[1440,900],[1366,768],[1280,720],[1024,768]])await check(`all five model surfaces fit and scroll within ${width}×${height}`,async()=>{
  await p.setViewportSize({width,height});
  for(let n=0;n<5;n++){
   await go(n);
   const modes=n===1?['vision-0','vision-1','vision-2','vision-info']:n===2?['usage-0','usage-1','usage-2']:n===3?['parts','context','tools','harness','loop-part',...Array.from({length:7},(_,i)=>'loop-'+i),'limit','blocked']:n===4?['product-0','product-1','product-2','product-3','product-4','value']:['page'];
   for(const mode of modes){
    if(n===1){if(mode==='vision-info')await p.getByRole('button',{name:'ViTの詳しい説明'}).click();else{if(await p.locator('.vit-info').count())await p.getByRole('button',{name:'ViTの説明を閉じる'}).click();await p.locator('.vit-stage-tabs button').nth(Number(mode.slice(-1))).click();}}
    if(n===2)await p.locator('.usage-tabs button').nth(Number(mode.slice(-1))).click();
    if(n===4){await p.getByRole('tab',{name:mode==='value'?'競争力':'開発プロセス',exact:true}).click();if(mode!=='value')await p.locator('.product-step-rail button').nth(Number(mode.slice(-1))).click();}
    if(n===3){const demo=/^loop-\d/.test(mode)||['limit','blocked'].includes(mode);await p.getByRole('tab',{name:demo?'動きを見る':'構成を見る',exact:true}).click();if(demo){const scenario=['limit','blocked'].includes(mode)?mode:'complete';await p.getByLabel('終了条件の例',{exact:true}).selectOption(scenario);await p.locator('.execution-track button').nth(scenario==='limit'?3:scenario==='blocked'?2:Number(mode.slice(-1))).click();}else await p.locator('.architecture-select[data-element='+({parts:'model',context:'context',tools:'tools',harness:'harness','loop-part':'loop'}[mode])+']').click();}

    const m=await p.evaluate(()=>{
     const el=document.querySelector('.studio-surface-host[data-active=true]'),scroll=el.querySelector('.studio-surface-host[data-active=true] .model-page-scroll'),r=el.getBoundingClientRect(),foot=document.querySelector('.studio-footer').getBoundingClientRect(),inside=el.querySelector('.model-page-footer').getBoundingClientRect(),header=document.querySelector('.studio-header').getBoundingClientRect();
     const mesh=JSON.parse(el.dataset.surfaceBounds);
     const nodeOverflow=[...el.querySelectorAll('.architecture-node>strong,.architecture-node>span,.architecture-node>small,.context-records small,.vit-info>strong,.vit-info>p,.vit-info>small')].filter(e=>{const a=e.getBoundingClientRect(),b=e.closest('.architecture-node,.vit-info').getBoundingClientRect();return a.width>0&&(a.top<b.top-1||a.bottom>b.bottom+1||a.left<b.left-1||a.right>b.right+1);}).map(e=>e.textContent);
     const outside=[...scroll.querySelectorAll('h1,h2,p,small,code,button,figure,.agent-system,.agent-part-detail,.demo-device-clip')].map(e=>({tag:e.tagName,name:e.textContent.slice(0,36),r:e.getBoundingClientRect().toJSON()})).filter(e=>e.r.width>0&&(e.r.left<r.left+1||e.r.right>r.right-1));
     return {x:r.x,y:r.y,width:r.width,height:r.height,body:document.documentElement.scrollWidth,overflow:scroll.scrollWidth>scroll.clientWidth+2,verticalOverflow:scroll.scrollHeight>scroll.clientHeight+2,bottom:r.bottom,footerTop:foot.top,headerBottom:header.bottom,inert:el.inert,mesh,insideBottom:inside.bottom,scrollBottom:scroll.getBoundingClientRect().bottom,insideTop:inside.top,outside,nodeOverflow};
    });layouts.push({viewport:[width,height],chapter:n,mode,...m});
    assert.ok(m.x>=0&&m.x+m.width<=width+2,JSON.stringify(m));assert.ok(Math.abs(m.x+m.width/2-width/2)<2);assert.ok(m.bottom<=m.footerTop+1,JSON.stringify(m));assert.ok(m.y>=m.headerBottom+2,JSON.stringify(m));assert.deepEqual(m.nodeOverflow,[],`Node text outside container: ${width} ${mode} ${JSON.stringify(m.nodeOverflow)}`);assert.equal(m.body,width);assert.equal(m.overflow,false,JSON.stringify(m));assert.equal(m.inert,false);if(width>=1280&&height>=720)assert.equal(m.verticalOverflow,false,`Desktop content needs scrolling: ${width} ${views[n]} ${mode}`);
    assert.ok(m.x>m.mesh.left&&m.x+m.width<m.mesh.right&&m.y>m.mesh.top&&m.bottom<m.mesh.bottom,JSON.stringify(m));assert.ok(m.insideBottom<=m.bottom+1&&m.scrollBottom<=m.insideTop+1,JSON.stringify(m));assert.deepEqual(m.outside,[],`${width}×${height} ${views[n]} ${mode}: ${JSON.stringify(m.outside)}`);
    await p.locator('.studio-surface-host[data-active=true] .model-page-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await p.locator('.studio-surface-host[data-active=true] .model-page-scroll').evaluate(e=>e.scrollTop=0);
    if([1440,1366,1280].includes(width)&&['page','parts','context','loop-5','vision-1','vision-2','usage-0','usage-2','product-2','value'].includes(mode))await p.screenshot({path:`${output}/${width}-${views[n]}-${mode}.png`});
   }
  }
 });
 await check('desktop background dialog stays inside the viewport in every history state',async()=>{
  for(const [width,height] of [[1440,900],[1366,768],[1280,720]]){await p.setViewportSize({width,height});await go(2);await p.getByRole('button',{name:'背景を見る ↗'}).click();
   for(let i=0;i<6;i++){await p.locator('.llm-era-rail button').nth(i).click();const r=await p.locator('.llm-background').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height);assert.equal(await p.locator('.llm-background').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);}
   await p.keyboard.press('Escape');
  }
 });
 await check('text fallback keeps the same readable chapter, working controls and retry',async()=>{
  const q=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});await q.goto(base+'?no3d=1');await q.locator('.studio-scene[data-status=fallback]').waitFor();assert.equal(await q.locator('canvas').count(),0);await go(3,q);assert.equal(await q.locator('.studio-surface-host[data-active=true]').evaluate(e=>e.inert),false);await q.getByRole('tab',{name:'動きを見る',exact:true}).click();await q.getByRole('button',{name:'次の工程 →',exact:true}).click();assert.ok((await q.locator('.execution-detail').innerText()).includes('コードを生成'));await q.getByRole('button',{name:'3Dを再読み込み'}).click();await q.locator('.studio-scene[data-status=ready][data-view=monitor]').waitFor();await q.close();
 });
 await p.setViewportSize({width:1440,height:1000});await p.emulateMedia({reducedMotion:'no-preference'});
 await check('camera transitions are continuous, interruptible and never route through the overview',async()=>{
  await go(0);const before=await p.locator('.studio-scene').getAttribute('data-camera-position');await p.locator('.journey-dots button').nth(3).click();await p.locator('.studio-scene[data-transition=true]').waitFor();
  assert.equal(await p.locator('.studio-surface-host[data-active=true]').evaluate(e=>e.inert),true);await p.waitForTimeout(180);assert.equal(await p.locator('.studio-surface-host[data-active=true]').getAttribute('data-visible'),'true');assert.equal(await p.locator('.studio-surface-host').count(),5);const midway=await p.locator('.studio-scene').getAttribute('data-camera-position');assert.notEqual(midway,before);assert.equal(await p.locator('.studio-scene').getAttribute('data-view'),'monitor');
  const skip=await p.locator('.studio-skip').boundingBox();assert.ok(skip.x>0&&skip.y>0&&skip.x+skip.width<=1440&&skip.y+skip.height<=1000&&skip.height>=44,JSON.stringify(skip));
  await p.locator('.journey-dots button').nth(1).click();await p.locator('.studio-skip').click();await p.locator('.studio-scene[data-view=notebook][data-transition=false]').waitFor();assert.equal(await p.locator('.studio-copy').count(),0);assert.ok((await p.locator('.studio-surface-host[data-active=true] .model-presentation h1').innerText()).includes('画像分類'));
 });
 await check('settled close-up stops rendering and context loss recovers on the same model',async()=>{
  await p.mouse.move(0,0);await p.waitForTimeout(900);const frames=await p.locator('.studio-scene').getAttribute('data-frames');await p.waitForTimeout(450);assert.equal(await p.locator('.studio-scene').getAttribute('data-frames'),frames);
  await p.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await p.locator('.studio-scene[data-status=fallback]').waitFor();await p.getByRole('button',{name:'3Dを再読み込み'}).click();await p.locator('.studio-scene[data-status=ready][data-view=notebook]').waitFor();assert.equal(await p.locator('canvas').count(),1);
 });
 await check('no browser exceptions or shader errors',async()=>assert.deepEqual(errors,[]));
}finally{await writeFile(`${output}/report.json`,JSON.stringify({results,errors,layouts},null,2));console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);await browser.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
