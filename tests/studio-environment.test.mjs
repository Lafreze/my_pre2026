import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import ts from 'typescript';
import {mockWeather} from './weather-fixture.mjs';
const js=ts.transpileModule(await readFile('app/studio/environment.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const environment=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output='output/playwright/environment';await mkdir(output,{recursive:true});
const results=[],errors=[];
async function check(name,run){try{await run();results.push({name,pass:true});console.log('PASS',name);}catch(e){results.push({name,pass:false,error:e.message});console.error('FAIL',name,e.message);}}
await check('weather parsing rejects malformed, missing and unknown observations',()=>{
  for(const payload of [null,{}, {timezone:'Mars',current:{}},{timezone:'Asia/Tokyo',current:{time:1,temperature_2m:22,cloud_cover:130,wind_speed_10m:5,weather_code:0}}])assert.throws(()=>environment.parseConditions(payload));
  for(const [code,weather] of [[0,'clear'],[3,'cloudy'],[45,'fog'],[65,'rain'],[75,'snow'],[99,'storm']])assert.equal(environment.weatherCode(code),weather);
  assert.throws(()=>environment.weatherCode(123));
});
await check('season and solar direction respect hemisphere, date and local time',()=>{
  assert.equal(environment.seasonAt(1,35),'winter');assert.equal(environment.seasonAt(1,-35),'summer');assert.equal(environment.seasonAt(4,35),'spring');assert.equal(environment.seasonAt(7,35),'summer');assert.equal(environment.seasonAt(10,35),'autumn');
  const noon=environment.solarPosition(new Date('2026-03-20T03:00:00Z'),35.68,139.69),night=environment.solarPosition(new Date('2026-03-20T15:00:00Z'),35.68,139.69);
  assert.ok(noon.altitude>50&&noon.altitude<56);assert.ok(noon.azimuth>170&&noon.azimuth<200);assert.ok(night.altitude<-50);
  const morning=environment.sunDirection(environment.previewEnvironment('spring','morning','clear'));assert.ok(morning[0]<0&&morning[1]>0);const afternoon=environment.sunDirection(environment.previewEnvironment('spring','noon','clear'));assert.ok(afternoon[2]<0&&afternoon[1]>0);
  const local=environment.liveEnvironment({latitude:-33.87,longitude:151.21,name:'Sydney'},{weather:'clear',cloud:0,wind:5,timezone:'Australia/Sydney'},new Date('2026-01-15T01:00:00Z'));assert.equal(local.season,'summer');assert.equal(local.hour,12);
});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader|ReferenceError/i.test(m.text()))errors.push(m.text());});
  await mockWeather(page);
  await page.goto(process.env.STUDIO_URL||'http://127.0.0.1:5180/');const scene=page.locator('.studio-scene');await page.locator('.studio-scene[data-status=ready][data-weather-status=current]').waitFor();
  await check('perpendicular windows load distinct courtyard and side-orchard landscapes',async()=>{
    await page.waitForLoadState('networkidle');
    const loaded=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/environments/garden-')&&r.name.endsWith('.png')).map(r=>new URL(r.name).pathname));
    assert.ok(loaded.includes('/environments/garden-seasons.png'));
    assert.ok(loaded.includes('/environments/garden-side-seasons.png'));
    const main=await page.request.get(new URL('/environments/garden-seasons.png',page.url()).href),side=await page.request.get(new URL('/environments/garden-side-seasons.png',page.url()).href);
    assert.equal(main.status(),200);assert.equal(side.status(),200);assert.ok(!(await main.body()).equals(await side.body()));
  });
  await check('live weather names its city, observes weather, and identifies the data source',async()=>{
    await page.locator('.environment-menu>summary').click();assert.match(await page.locator('.weather-current').innerText(),/東京/);assert.match(await page.locator('.weather-current').innerText(),/22°C/);assert.match(await page.locator('.weather-current').innerText(),/更新/);assert.equal(await page.locator('.weather-credit').getAttribute('href'),'https://open-meteo.com/');assert.equal(await scene.getAttribute('data-weather-mode'),'live');
  });
  await check('four seasons, six times and six weather presets stay contained on desktop',async()=>{
    await page.getByRole('button',{name:'季節・天気を試す',exact:true}).click();
    const camera=await scene.getAttribute('data-camera-position');
    for(const season of Object.keys(environment.seasons)){
      await page.getByLabel('季節',{exact:true}).selectOption(season);await page.getByLabel('時間帯',{exact:true}).selectOption('morning');await page.getByLabel('天気',{exact:true}).selectOption(season==='winter'?'snow':'clear');
      await page.waitForTimeout(80);assert.equal(await scene.getAttribute('data-season'),season);await page.screenshot({path:`${output}/${season}.png`,style:".environment-menu{visibility:hidden!important}"});
    }
    for(const time of Object.keys(environment.times)){await page.getByLabel('時間帯',{exact:true}).selectOption(time);await page.waitForTimeout(60);assert.equal(await scene.getAttribute('data-time'),time);const dir=(await scene.getAttribute('data-sun-direction')).split(',').map(Number);assert.ok(['night','midnight'].includes(time)?dir[1]<0:dir[1]>0);await page.screenshot({path:`${output}/${time}.png`,style:".environment-menu{visibility:hidden!important}"});}
    await page.getByLabel('季節',{exact:true}).selectOption('spring');await page.getByLabel('時間帯',{exact:true}).selectOption('noon');
    const pictures=[];for(const weather of Object.keys(environment.weathers)){await page.getByLabel('天気',{exact:true}).selectOption(weather);await page.waitForTimeout(70);assert.equal(await scene.getAttribute('data-weather'),weather);pictures.push(await page.screenshot({path:`${output}/${weather}.png`,style:".environment-menu{visibility:hidden!important}"}));}
    for(let i=1;i<pictures.length;i++)assert.ok(!pictures[i].equals(pictures[i-1]));assert.equal(await scene.getAttribute('data-camera-position'),camera);
    for(const [width,height] of [[1280,720],[1920,1080]]){await page.setViewportSize({width,height});const box=await page.locator('.environment-panel').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.y+box.height<=height);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);}
    await page.setViewportSize({width:1440,height:900});
  });
  await check('wall clock follows real local time across environment previews',async()=>{
    for(const time of ['midnight','morning','noon']){await page.getByLabel('時間帯',{exact:true}).selectOption(time);await page.waitForTimeout(80);const actual=await page.evaluate(()=>new Date().toTimeString().slice(0,5));assert.equal((await scene.getAttribute('data-clock-time')).slice(0,5),actual);}
  });
  await check('city search changes coordinates and a failed request never masquerades as current weather',async()=>{
    await page.getByRole('button',{name:'いまの天気',exact:true}).click();await page.locator('.weather-place>summary').click();
    await page.route('https://geocoding-api.open-meteo.com/**',route=>route.fulfill({json:{results:[{name:'大阪',country:'日本',latitude:34.69,longitude:135.5}]}}));
    await page.getByRole('textbox',{name:'天気の都市名'}).fill('大阪');await page.getByRole('button',{name:'検索',exact:true}).click();await page.getByRole('button',{name:'大阪 · 日本',exact:true}).click();await page.locator('.studio-scene[data-weather-status=current]').waitFor();assert.match(await page.locator('.weather-current').innerText(),/大阪/);
    await page.route('https://api.open-meteo.com/**',route=>route.fulfill({status:503,body:'Unavailable'}));
    await page.getByRole('button',{name:'季節・天気を試す',exact:true}).click();await page.getByRole('button',{name:'いまの天気',exact:true}).click();await page.getByRole('button',{name:'再取得',exact:true}).waitFor();assert.match(await page.locator('.weather-current').innerText(),/前回の天気を表示/);assert.equal(await scene.getAttribute('data-weather-status'),'stale');
    await page.reload();await page.locator('.studio-scene[data-status=ready]').waitFor();await page.locator('.environment-menu>summary').click();await page.getByRole('button',{name:'再取得',exact:true}).waitFor();assert.match(await page.locator('.weather-current').innerText(),/プレビュー表示/);assert.equal(await scene.getAttribute('data-weather-status'),'preview');
  });
  await check('a fixed projector reveals its light field; chapter arrows contain no visible titles',async()=>{
    await page.locator('.environment-menu>summary').click();await page.locator('[data-object=checklist]').click();await page.locator('.studio-surface-host[data-kind=checklist][data-interactive=true]').waitFor();assert.equal(await scene.getAttribute('data-projector-scale'),'1,1,1');assert.equal(await scene.getAttribute('data-hologram'),'1.000');
    const active=page.locator('.studio-surface-host[data-active=true]');assert.equal((await active.locator('.model-page-footer button').innerText()).trim(),'→');assert.ok(await active.locator('.model-page-footer button').getAttribute('aria-label'));assert.equal(await active.locator('img').count(),0);await page.screenshot({path:`${output}/hologram.png`});
    await page.getByRole('button',{name:'全景に戻る',exact:true}).click();await page.locator('.studio-scene[data-view=room][data-transition=false]').waitFor();assert.equal(await scene.getAttribute('data-projector-scale'),'1,1,1');assert.equal(await scene.getAttribute('data-hologram'),'0.000');
  });
  await check('bird and robot move independently, pause for reading, and resume without teleporting',async()=>{
    await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('.environment-menu>summary').click();await page.getByRole('button',{name:'庭の動き',exact:true}).click();
    const a=JSON.parse(await scene.getAttribute('data-life'));await page.waitForTimeout(1500);const b=JSON.parse(await scene.getAttribute('data-life'));assert.ok(b.time>a.time+.8);assert.notDeepEqual(a.robot,b.robot);assert.equal(b.steam.visible,true);
    const perched=await scene.getAttribute('data-bird-position');await page.waitForFunction(before=>document.querySelector('.studio-scene').dataset.birdPosition!==before,perched,{timeout:12000});
    await page.locator('.environment-menu>summary').click();await page.locator('[data-object=monitor]').click();await page.locator('.studio-scene[data-view=monitor][data-transition=true][data-ambient=false]').waitFor();const bird=await scene.getAttribute('data-bird-position');await page.locator('.studio-scene[data-view=monitor][data-transition=false]').waitFor();assert.equal(await scene.getAttribute('data-bird-position'),bird);
    const paused=JSON.parse(await scene.getAttribute('data-life'));await page.waitForTimeout(800);assert.equal(JSON.parse(await scene.getAttribute('data-life')).time,paused.time);assert.equal(paused.steam.visible,false);await page.getByRole('tab',{name:'構成を見る',exact:true}).click();await page.locator('.studio-surface-host[data-kind=monitor][data-interactive=true]').waitFor();assert.equal(await page.getByRole('tab',{name:'構成を見る',exact:true}).getAttribute('aria-selected'),'true');
    assert.deepEqual(await page.locator('.screen-tabs button').allTextContents(),['利用の広がり','構成を見る','動きを見る','発展をたどる']);
    await page.getByRole('button',{name:'全景に戻る',exact:true}).click();await page.waitForTimeout(100);const resumed=JSON.parse(await scene.getAttribute('data-life'));assert.ok(resumed.time>=paused.time&&resumed.time<paused.time+1);
  });
  await check('no browser exceptions or shader errors',()=>assert.deepEqual(errors,[]));
}finally{await browser.close();await writeFile(output+'/report.json',JSON.stringify({results,errors},null,2));}
if(results.some(r=>!r.pass))process.exitCode=1;
