const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const PORT = process.env.PORT || 8080;

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2'
};
function safeDecode(u){ try { return decodeURIComponent(u); } catch { return u; } }
function send404(res){ res.writeHead(404, {'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, follow'}); res.end('<!doctype html><meta charset="utf-8"><title>404</title><h1>페이지를 찾을 수 없습니다</h1>'); }
function send410(res){ res.writeHead(410, {'Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex, nofollow'}); res.end('Gone'); }
function redirect(res, loc){ res.writeHead(301, {Location: loc}); res.end(); }
function cleanPath(urlPath){
  const decoded=safeDecode(urlPath.split('?')[0].split('#')[0]);
  const rel=path.normalize(decoded).replace(/^([/\\])+/, '');
  if (!rel || rel === '.') return 'index.html';
  if (rel.includes('..')) return null;
  return rel;
}
function fileFor(reqPath){
  const rel=cleanPath(reqPath);
  if (!rel) return null;
  const full=path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) return null;
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  return null;
}
function isHtmlLike(file){
  const ext=path.extname(file).toLowerCase();
  if (ext === '.html') return true;
  const rel=path.relative(ROOT, file).replace(/\\/g,'/');
  return /^page\/[A-Za-z0-9_-]+$/.test(rel) || /^place\/[A-Za-z0-9_-]+$/.test(rel);
}
const server=http.createServer((req,res)=>{
  const u=new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p=safeDecode(u.pathname);
  const q=u.search || '';

  // 삭제한 리포트 페이지는 모두 삭제 상태로 고정
  if (/^\/page\/gwangju-yuheng-sites(?:\/|\.html)?$/i.test(p)) return send410(res);

  // 메인은 '/'만 정식. index 파일은 루트로 보냄.
  if (/^\/(?:index|\.index)\.html$/i.test(p)) return redirect(res, '/' + q);

  // page/place 공개 주소 정책: 확장자 없는 주소만 허용.
  if (/^\/(?:page|place)\/[^/?#]+\.html$/i.test(p)) return send404(res);

  // /page/karaoke4/, /place/name/ 도 전부 404.
  if (/^\/(?:page|place)\/[^/?#]+\/$/i.test(p)) return send404(res);

  // 루트 외의 기타 trailing slash도 디렉터리 자동 매칭 금지.
  if (p.length > 1 && /\/$/.test(p)) return send404(res);

  const f=fileFor(p);
  if (!f) return send404(res);
  const ext=path.extname(f).toLowerCase();
  const type=isHtmlLike(f) ? 'text/html; charset=utf-8' : (mime[ext] || 'application/octet-stream');
  const headers={'Content-Type':type};
  if (isHtmlLike(f) || ['.xml','.txt'].includes(ext)) headers['X-Robots-Tag']='index, follow';
  if (['.png','.jpg','.jpeg','.webp','.svg','.gif','.ico','.css','.js','.ttf','.woff','.woff2'].includes(ext)) headers['Cache-Control']='public, max-age=604800';
  res.writeHead(200, headers);
  fs.createReadStream(f).pipe(res);
});
const HOST=process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, ()=>console.log(`ALBAM09 STRICT CANONICAL SERVER 20260629 no-html no-slash running on http://${HOST}:${PORT}`));
