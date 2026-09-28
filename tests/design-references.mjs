import {chromium} from 'file:///C:/Users/70893804/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir} from 'node:fs/promises';
await mkdir('outputs/redesign',{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
for(const [name,url] of [['bruno','https://bruno-simon.com/'],['lusion','https://lusion.co/']]){
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(14000);await page.screenshot({path:`outputs/redesign/reference-${name}.png`});console.log(name,(await page.locator('body').innerText()).slice(0,2400));}catch(e){console.log(name,e.message)}
 await page.close();
}
await browser.close();
