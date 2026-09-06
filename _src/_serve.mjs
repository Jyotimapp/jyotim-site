import http from 'http'; import fs from 'fs'; import path from 'path';
// Serves the repo ROOT — this repo IS the site, so what you review is exactly what gets pushed.
const ROOT = path.resolve('..');
const TYPES = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404,{'content-type':'text/plain'}).end('404 '+p);return;}
    res.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream','cache-control':'no-store'}).end(d); });
}).listen(8123, ()=>console.log('review server on http://localhost:8123'));
setInterval(()=>{}, 1<<30);
