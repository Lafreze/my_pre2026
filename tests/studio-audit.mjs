import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const text=await readFile('app/LegacyDeck.tsx','utf8');
const slice=text.slice(text.indexOf('const sources = ['),text.indexOf('const sources = [')+15000);
const sources=[...slice.matchAll(/\{ n: (\d+), label: "([^"]+)", url: "([^"]+)" \}/g)].map(m=>({number:+m[1],title:m[2],url:m[3]}));
let index=0;const results=[];
async function worker(){while(index<sources.length){const s=sources[index++];try{const r=await fetch(s.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Mozilla/5.0'}});results.push({...s,status:r.status,finalURL:r.url,check:'URL reachability only; historical claims not revalidated'});await r.body?.cancel();}catch(e){results.push({...s,status:'unconfirmed',error:e.message});}}}
await Promise.all(Array.from({length:6},worker));results.sort((a,b)=>a.number-b.number);
await writeFile('public/studio/source-audit.json',JSON.stringify({checked:'2026-09-28',scope:'Legacy link reachability. Main-line factual sources separately opened and read. Unverified legacy statements remain archival background.',sources:results},null,2));
console.log('SOURCES',results.length,'reachable',results.filter(r=>r.status===200).length);
const files=['app/LegacyDeck.tsx','app/DaycardShowcase.tsx','原稿.md','発表原稿_日本語.md','app/chatgpt-auth.ts'];
const hashes={};for(const f of files)hashes[f]=createHash('sha256').update(await readFile(f)).digest('hex');
await mkdir('outputs/studio-review',{recursive:true});await writeFile('outputs/studio-review/archive-hashes.json',JSON.stringify(hashes,null,2));
