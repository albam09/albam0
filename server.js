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

function safeDecode(u) {
  try { return decodeURIComponent(u); } catch { return u; }
}

function cleanPath(urlPath) {
  const noQuery = urlPath.split('?')[0].split('#')[0];
  const decoded = safeDecode(noQuery);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  if (normalized.includes('..')) return null;
  return normalized || 'index.html';
}

function loadRedirects() {
  const file = path.join(ROOT, '_redirects');
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      map.set(parts[0], parts[1]);
      map.set(safeDecode(parts[0]), parts[1]);
    }
  }
  return map;
}
const redirects = loadRedirects();

function permanentRedirect(res, location) {
  res.writeHead(301, { Location: location });
  res.end();
}
function gone(res) {
  res.writeHead(410, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' });
  res.end('Gone');
}


function findFile(requestPath) {
  let rel = cleanPath(requestPath);
  if (!rel) return null;

  const candidates = [];
  candidates.push(rel);

  // /page/karaoke1.html -> /page/karaoke1.html
  if (!path.extname(rel)) candidates.push(rel + '.html');

  // /page/karaoke1.html -> /page/karaoke1/index.html
  if (rel.endsWith(path.sep) || rel.endsWith('/')) candidates.push(path.join(rel, 'index.html'));
  if (!path.extname(rel)) candidates.push(path.join(rel, 'index.html'));

  for (const c of candidates) {
    const full = path.join(ROOT, c);
    if (!full.startsWith(ROOT)) continue;
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const originalPath = requestUrl.pathname;
  const decodedPath = safeDecode(originalPath);

  // Removed report page: tell crawlers it is intentionally gone.
  if (/^\/page\/gwangju-yuheng-sites\/?(?:\.html)?$/i.test(decodedPath)) {
    gone(res);
    return;
  }

  // Canonical page URLs: use .html only. Old slash/no-extension URLs redirect to the final URL.
  const pageMatch = decodedPath.match(/^\/page\/(karaoke[1-8]|etc)\/?$/i);
  if (pageMatch) {
    permanentRedirect(res, `/page/${pageMatch[1]}.html`);
    return;
  }
  if (/^\/page\/karaoke\/?$/i.test(decodedPath)) {
    permanentRedirect(res, '/page/karaoke1.html');
    return;
  }

  const redirectTarget = redirects.get(originalPath) || redirects.get(decodedPath);
  if (redirectTarget) {
    res.writeHead(301, { Location: redirectTarget });
    res.end();
    return;
  }

  const file = findFile(originalPath);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><meta charset="utf-8"><title>404</title><h1>페이지를 찾을 수 없습니다</h1>');
    return;
  }

  const ext = path.extname(file).toLowerCase();
  const headers = {
    'Content-Type': mime[ext] || 'application/octet-stream',
    'X-Robots-Tag': 'index, follow'
  };
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.css', '.js', '.ttf', '.woff', '.woff2'].includes(ext)) {
    headers['Cache-Control'] = 'public, max-age=604800';
  }
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`albam09 server running on http://${HOST}:${PORT}`));
