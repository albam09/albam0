const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const VERSION = 'ALBAM09-STRICT-ROUTE-20260629-SERVER-FIRST';

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

function baseHeaders(extra = {}) {
  return Object.assign({
    'X-Albam-Route-Version': VERSION,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }, extra);
}

function notFound(res) {
  res.writeHead(404, baseHeaders({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Robots-Tag': 'noindex, follow'
  }));
  res.end('<!doctype html><meta charset="utf-8"><title>404</title><h1>페이지를 찾을 수 없습니다</h1>');
}

function gone(res) {
  res.writeHead(410, baseHeaders({
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow'
  }));
  res.end('Gone');
}

function redirect(res, location) {
  // 302로 둔다. 이전 301 캐시가 브라우저에 남아 있어도 앞으로 새 리디렉션을 강하게 캐시하지 않게 하기 위함.
  res.writeHead(302, baseHeaders({ Location: location }));
  res.end();
}

function normalizeToFile(urlPath) {
  const decoded = safeDecode(urlPath.split('?')[0].split('#')[0]);
  let rel = path.normalize(decoded).replace(/^([/\\])+/, '');
  if (!rel || rel === '.') rel = 'index.html';
  if (rel.includes('..')) return null;
  return rel;
}

function resolveFile(publicPath) {
  const rel = normalizeToFile(publicPath);
  if (!rel) return null;

  const candidates = [];
  if (rel === 'index.html') {
    candidates.push('index.html');
  } else if (rel.startsWith('page/') || rel.startsWith('place/')) {
    // 공개 주소는 /page/karaoke4, 실제 파일은 page/karaoke4.html
    // 단, .html 또는 끝 슬래시는 createServer 맨 위에서 이미 404 처리한다.
    candidates.push(rel + '.html');
  } else {
    // CSS/JS/이미지/폰트/사이트맵/소유확인 파일 등은 실제 파일명 그대로 제공
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

  if (decodedPath === '/__route-check') {
    res.writeHead(200, baseHeaders({ 'Content-Type': 'application/json; charset=utf-8' }));
    res.end(JSON.stringify({ version: VERSION, strictHtml404: true, strictTrailingSlash404: true }));
    return;
  }

  // 1순위: 삭제한 리포트 페이지는 항상 410.
  if (/^\/page\/gwangju-yuheng-sites(?:\.html|\/)?$/i.test(decodedPath)) return gone(res);

  // 2순위: 메인만 / 로 고정. /index.html 은 / 로 보냄.
  if (/^\/(?:index|\.index)\.html?$/i.test(decodedPath)) return redirect(res, '/' + query);

  // 3순위: /page, /place의 .html 공개 접속은 무조건 404.
  // 구글/네이버 소유확인 파일은 page/place가 아니므로 영향 없음.
  if (/^\/(page|place)\/.*\.html$/i.test(decodedPath)) return notFound(res);

  // 4순위: /page, /place의 끝 슬래시 공개 접속은 무조건 404.
  // 예: /page/karaoke2/ , /place/room-flower-deer/
  if (/^\/(page|place)\/.+\/$/i.test(decodedPath)) return notFound(res);

  // 5순위: 예전 묶음 주소만 정상 대표 페이지로 보냄.
  if (/^\/page\/karaoke$/i.test(decodedPath)) return redirect(res, '/page/karaoke1' + query);

  const file = resolveFile(decodedPath);
  if (!file) return notFound(res);

  const ext = path.extname(file).toLowerCase();
  const contentType = mime[ext] || 'application/octet-stream';
  const headers = baseHeaders({ 'Content-Type': contentType });

  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.css', '.js', '.ttf', '.woff', '.woff2'].includes(ext)) {
    headers['Cache-Control'] = 'public, max-age=604800';
    delete headers['Pragma'];
    delete headers['Expires'];
  }

  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`${VERSION} running on http://${HOST}:${PORT}`);
});
