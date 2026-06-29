const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function send404(res) {
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Robots-Tag': 'noindex, follow',
    'X-URL-Policy': 'strict-extensionless-404'
  });
  res.end('<!doctype html><meta charset="utf-8"><title>404</title><h1>페이지를 찾을 수 없습니다</h1>');
}

function send410(res) {
  res.writeHead(410, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-URL-Policy': 'gone'
  });
  res.end('Gone');
}

function redirect301(res, location) {
  res.writeHead(301, {
    Location: location,
    'X-URL-Policy': 'index-root-only'
  });
  res.end();
}

function cleanPath(urlPath) {
  const decoded = safeDecode(urlPath.split('?')[0].split('#')[0]);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  if (normalized.includes('..')) return null;
  return normalized || 'index.html';
}

function findFile(urlPath) {
  const rel = cleanPath(urlPath);
  if (!rel) return null;

  // Important: do NOT add .html fallback for /page or /place.
  // Physical files in /page and /place are extensionless now.
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) return null;
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  return null;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const originalPath = requestUrl.pathname;
  const decodedPath = safeDecode(originalPath);
  const query = requestUrl.search || '';

  if (/^\/page\/gwangju-yuheng-sites(?:\.html|\/)?$/i.test(decodedPath)) return send410(res);

  // Main page: only / is canonical. index.html redirects to /.
  if (/^\/(?:index|\.index)\.html$/i.test(decodedPath)) return redirect301(res, '/' + query);

  const isVerificationFile = /^\/(?:google[^/]+|naver[^/]+)\.html$/i.test(decodedPath);

  // These must NEVER be public URLs for normal pages.
  if (!isVerificationFile && /^\/(?:page|place)\/.+\.html$/i.test(decodedPath)) return send404(res);
  if (/^\/(?:page|place)\/.+\/$/i.test(decodedPath)) return send404(res);

  // No trailing slash except root.
  if (decodedPath.length > 1 && /\/$/.test(decodedPath)) return send404(res);

  if (/^\/page\/karaoke$/i.test(decodedPath)) return redirect301(res, '/page/karaoke1' + query);

  const file = findFile(originalPath);
  if (!file) return send404(res);

  let ext = path.extname(file).toLowerCase();
  let contentType = mime[ext] || 'application/octet-stream';

  // Extensionless /page and /place files are HTML documents.
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (!ext && /^(page|place)\//.test(rel)) contentType = 'text/html; charset=utf-8';

  const headers = {
    'Content-Type': contentType,
    'X-Robots-Tag': 'index, follow',
    'X-URL-Policy': 'strict-extensionless-404'
  };
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.css', '.js', '.ttf', '.woff', '.woff2'].includes(ext)) {
    headers['Cache-Control'] = 'public, max-age=604800';
  }
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => console.log(`albam09 strict extensionless server running on http://${HOST}:${PORT}`));
