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

function safeDecode(v) { try { return decodeURIComponent(v); } catch { return v; } }
function send(res, status, body, type='text/html; charset=utf-8', extra={}) {
  res.writeHead(status, { 'Content-Type': type, ...extra });
  res.end(body);
}
function notFound(res) {
  return send(res, 404, '<!doctype html><meta charset="utf-8"><title>404</title><h1>페이지를 찾을 수 없습니다</h1>', 'text/html; charset=utf-8', {'X-Robots-Tag':'noindex, follow'});
}
function gone(res) {
  return send(res, 410, 'Gone', 'text/plain; charset=utf-8', {'X-Robots-Tag':'noindex, nofollow'});
}
function redirect(res, loc) { res.writeHead(301, { Location: loc }); res.end(); }
function cleanPath(p) {
  const decoded = safeDecode(p.split('?')[0].split('#')[0]);
  const rel = path.normalize(decoded).replace(/^[/\\]+/, '');
  if (!rel || rel === '.') return 'index.html';
  if (rel.includes('..')) return null;
  return rel;
}
function serveFile(res, rel) {
  if (!rel) return notFound(res);
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) return notFound(res);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return notFound(res);
  const ext = path.extname(full).toLowerCase();
  let type = mime[ext] || 'application/octet-stream';
  const norm = rel.replace(/\\/g,'/');
  if (/^(page|place)\/[A-Za-z0-9_-]+$/.test(norm)) type = 'text/html; charset=utf-8';
  const headers = {'Content-Type': type};
  if (type.startsWith('text/html') || ['.xml','.txt'].includes(ext)) headers['X-Robots-Tag'] = 'index, follow';
  if (['.png','.jpg','.jpeg','.webp','.svg','.gif','.ico','.css','.js','.ttf','.woff','.woff2'].includes(ext)) {
    headers['Cache-Control'] = 'public, max-age=604800';
  }
  res.writeHead(200, headers);
  fs.createReadStream(full).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const rawPath = url.pathname;
  const p = safeDecode(rawPath);
  const q = url.search || '';

  // deleted page: gone, not redirected
  if (/^\/page\/gwangju-yuheng-sites(?:\.html|\/)?$/i.test(p)) return gone(res);

  // main canonical: only /
  if (/^\/(?:index|\.index)\.html$/i.test(p)) return redirect(res, '/' + q);

  // public page/place URLs: ONLY /page/slug and /place/slug are valid.
  // .html and trailing slash must never open.
  if (/^\/(?:page|place)\/[^/?#]+\.html$/i.test(p)) return notFound(res);
  if (/^\/(?:page|place)\/[^/?#]+\/$/i.test(p)) return notFound(res);

  // no other directory-style trailing slash except root.
  if (p.length > 1 && p.endsWith('/')) return notFound(res);

  if (/^\/page\/karaoke$/i.test(p)) return redirect(res, '/page/karaoke1' + q);

  // Do NOT auto-append .html. Only exact files are served.
  const rel = cleanPath(rawPath);
  return serveFile(res, rel);
});

const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`ALBAM09 STRICT ONLY EXTENSIONLESS 20260629-REAL-FIX running on http://${HOST}:${PORT}`));
