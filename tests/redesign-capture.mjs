import {chromium} from 'file:///C:/Users/70893804/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>console.log('ERROR',e.message));
await page.goto('http://localhost:5173/',{waitUntil:'networkidle'});
await page.locator('.studio-scene[data-status=ready]').waitFor();
await page.waitForTimeout(1500);await page.screenshot({path:'outputs/redesign/room.png'});
for(const [name,n] of [['name',0],['notebook',1],['board',3],['agent',4],['cards',5],['review',6]]){
 await page.getByRole('button',{name:'Index',exact:false}).click();
 await page.locator('.studio-index-chapter').nth(n).click();
 await page.waitForTimeout(1700);await page.screenshot({path:`outputs/redesign/${name}.png`});
}
await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'閉じて全景に戻る'}).click();await page.waitForTimeout(2800);await page.screenshot({path:'outputs/redesign/mobile-room.png'});
await page.getByRole('button',{name:'Index',exact:false}).click();await page.locator('.studio-index-chapter').nth(5).click();await page.waitForTimeout(1700);await page.screenshot({path:'outputs/redesign/mobile-cards.png'});
await browser.close();
