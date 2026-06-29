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
    'X-URL-Policy': 'extensionless-only'
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
    'X-URL-Policy': 'root-index-only'
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

  const candidates = [];
  const ext = path.extname(rel).toLowerCase();

  if (!ext) {
    // Public URLs are extensionless, but physical documents are .html files.
    candidates.push(rel + '.html');
    candidates.push(path.join(rel, 'index.html'));
  } else {
    candidates.push(rel);
  }

  for (const candidate of candidates) {
    const full = path.join(ROOT, candidate);
    if (!full.startsWith(ROOT)) continue;
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const originalPath = requestUrl.pathname;
  const decodedPath = safeDecode(originalPath);
  const query = requestUrl.search || '';

  // Removed report page must stay removed.
  if (/^\/page\/gwangju-yuheng-sites(?:\.html|\/)?$/i.test(decodedPath)) return send410(res);

  // Main page public URL is only '/'.
  if (/^\/(?:index|\.index)\.html$/i.test(decodedPath)) return redirect301(res, '/' + query);

  // Verification files are real .html files and must remain accessible.
  const isVerificationFile = /^\/(?:google[^/]+|naver[^/]+)\.html$/i.test(decodedPath);

  // Public page/place URLs must be extensionless only.
  // /page/karaoke2 is OK. /page/karaoke2.html and /page/karaoke2/ are blocked.
  if (!isVerificationFile && /^\/(?:page|place)\/.+\.html$/i.test(decodedPath)) return send404(res);
  if (/^\/(?:page|place)\/.+\/$/i.test(decodedPath)) return send404(res);

  // No trailing slash URLs except root.
  if (decodedPath.length > 1 && /\/$/.test(decodedPath)) return send404(res);

  // Old group alias.
  if (/^\/page\/karaoke$/i.test(decodedPath)) return redirect301(res, '/page/karaoke1' + query);

  const file = findFile(originalPath);
  if (!file) return send404(res);

  const ext = path.extname(file).toLowerCase();
  const headers = {
    'Content-Type': mime[ext] || 'application/octet-stream',
    'X-Robots-Tag': 'index, follow',
    'X-URL-Policy': 'extensionless-only'
  };
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.css', '.js', '.ttf', '.woff', '.woff2'].includes(ext)) {
    headers['Cache-Control'] = 'public, max-age=604800';
  }
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => console.log(`albam09 strict URL server running on http://${HOST}:${PORT}`));
