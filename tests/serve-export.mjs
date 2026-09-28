import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist/client');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.rsc':'text/x-component','.woff2':'font/woff2','.glb':'model/gltf-binary','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{if((await stat(path)).isDirectory())path=resolve(path,'index.html');}catch{if(!extname(path))path+='.html';}const body=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404).end('Not found');}}).listen(5180,'127.0.0.1',()=>console.log('Production export: http://127.0.0.1:5180/'));
