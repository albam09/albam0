// /js/nearest.js
// 알밤09 - 실제 내 위치 기준 가까운 업소 TOP 12
// 개선사항
// 1) index는 전체 업소 기준 TOP12
// 2) 지역/페이지에서는 그 페이지에 등록된 업소만 기준으로 TOP12
// 3) 한 번 허용해서 받은 위치는 저장해 페이지 이동 때마다 다시 묻지 않게 처리
(function () {
  if (window.__ALBAM_REAL_NEAREST_LOADED__) return;
  window.__ALBAM_REAL_NEAREST_LOADED__ = true;

  var MAX_RESULTS = 12;
  var LOCATION_CACHE_KEY = 'albam09_user_location_v2';
  var LOCATION_CACHE_MAX_AGE = 6 * 60 * 60 * 1000; // 6시간 동안 재사용
  var WINDOW_NAME_PREFIX = '__ALBAM09_LOCATION_CACHE__=';

  var PAGE_REGION_MAP = {
    'index': 'ALL',
    'karaoke1': '서구1',
    'karaoke2': '서구2',
    'karaoke3': '북구2',
    'karaoke4': '북구1',
    'karaoke5': '광산구',
    'karaoke6': '목포',
    'karaoke7': '동구',
    'karaoke8': '남구',
    'etc': '기타',
  };

  var REGION_LABEL_MAP = {
    'ALL': '전체 업소',
    '서구1': '상무지구 업소',
    '서구2': '광천동 · 금호동 업소',
    '북구1': '용봉동 업소',
    '북구2': '신안동 업소',
    '광산구': '첨단지구 업소',
    '목포': '목포 업소',
    '동구': '동구 업소',
    '남구': '남구 업소',
    '기타': '기타 업소'
  };

  var state = {
    regionFilter: inferPageRegion()
  };

  window.__ALBAM_TOP12_REGION_FILTER = state.regionFilter;

  function getPlaces() {
    try {
      if (typeof PLACES !== 'undefined' && Array.isArray(PLACES)) return PLACES;
    } catch (e) {}
    if (Array.isArray(window.PLACES)) return window.PLACES;
    return [];
  }

  function now() { return Date.now ? Date.now() : new Date().getTime(); }

  function safeJsonParse(text) {
    if (!text || typeof text !== 'string') return null;
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  function isUsableLocation(data) {
    if (!data) return false;
    if (!isFinite(Number(data.latitude)) || !isFinite(Number(data.longitude))) return false;
    if (!isFinite(Number(data.timestamp))) return false;
    return (now() - Number(data.timestamp)) <= LOCATION_CACHE_MAX_AGE;
  }

  function readWindowNameCache() {
    var name = String(window.name || '');
    var idx = name.indexOf(WINDOW_NAME_PREFIX);
    if (idx < 0) return null;
    var raw = name.slice(idx + WINDOW_NAME_PREFIX.length);
    var end = raw.indexOf('\n');
    if (end >= 0) raw = raw.slice(0, end);
    return safeJsonParse(raw);
  }

  function writeWindowNameCache(data) {
    try {
      var name = String(window.name || '');
      var idx = name.indexOf(WINDOW_NAME_PREFIX);
      if (idx >= 0) name = name.slice(0, idx).trim();
      window.name = (name ? name + '\n' : '') + WINDOW_NAME_PREFIX + JSON.stringify(data);
    } catch (e) {}
  }

  function readCookieCache() {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + LOCATION_CACHE_KEY + '=([^;]*)'));
      if (!m) return null;
      return safeJsonParse(decodeURIComponent(m[1]));
    } catch (e) { return null; }
  }

  function writeCookieCache(data) {
    try {
      document.cookie = LOCATION_CACHE_KEY + '=' + encodeURIComponent(JSON.stringify(data)) + '; path=/; max-age=' + Math.floor(LOCATION_CACHE_MAX_AGE / 1000) + '; SameSite=Lax';
    } catch (e) {}
  }

  function readCachedLocation() {
    var stores = [];
    try { stores.push(localStorage.getItem(LOCATION_CACHE_KEY)); } catch (e) {}
    try { stores.push(sessionStorage.getItem(LOCATION_CACHE_KEY)); } catch (e) {}
    stores.push(JSON.stringify(readCookieCache() || null));
    stores.push(JSON.stringify(readWindowNameCache() || null));

    for (var i = 0; i < stores.length; i++) {
      var data = safeJsonParse(stores[i]);
      if (isUsableLocation(data)) return data;
    }
    return null;
  }

  function saveCachedLocation(coords) {
    var data = {
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      accuracy: isFinite(Number(coords.accuracy)) ? Number(coords.accuracy) : null,
      timestamp: now()
    };
    try { localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
    try { sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
    writeCookieCache(data);
    writeWindowNameCache(data);
    return data;
  }

  function clearCachedLocation() {
    try { localStorage.removeItem(LOCATION_CACHE_KEY); } catch (e) {}
    try { sessionStorage.removeItem(LOCATION_CACHE_KEY); } catch (e) {}
    try { document.cookie = LOCATION_CACHE_KEY + '=; path=/; max-age=0'; } catch (e) {}
    try {
      var name = String(window.name || '');
      var idx = name.indexOf(WINDOW_NAME_PREFIX);
      if (idx >= 0) window.name = name.slice(0, idx).trim();
    } catch (e) {}
  }

  function normalizeRegion(regionFilter) {
    var r = String(regionFilter || '').trim();
    if (!r) return inferPageRegion();
    if (/^(all|전체)$/i.test(r)) return 'ALL';
    return r;
  }

  function currentPageKey() {
    var path = '';
    try { path = String(location.pathname || ''); } catch (e) {}
    path = path.replace(/\\/g, '/');

    // /page/karaoke1, /page/karaoke1/, /page/karaoke1.html 모두 같은 페이지로 인식
    var parts = path.split('/').filter(function (part) { return part && part.trim(); });
    var file = parts.length ? parts[parts.length - 1] : 'index';
    file = file.replace(/\.html?$/i, '');
    if (!file || file === '/') file = 'index';
    if (file === 'page') file = 'index';
    if (file in PAGE_REGION_MAP) return file;

    try {
      var canonical = document.querySelector('link[rel="canonical"]');
      var href = canonical ? String(canonical.getAttribute('href') || '') : '';
      if (m && m[1] && (m[1] in PAGE_REGION_MAP)) return m[1];
    } catch (e) {}

    try {
      var active = document.querySelector('[data-page].active, [data-page].current, [data-page][aria-current="page"], [data-page].on');
      if (active && active.getAttribute('data-page')) return String(active.getAttribute('data-page')).replace(/\.html?$/i, '');
    } catch (e) {}

    return 'index';
  }

  function inferPageRegion() {
    var key = currentPageKey();
    return PAGE_REGION_MAP[key] || 'ALL';
  }

  function setRegion(regionFilter) {
    var r = normalizeRegion(regionFilter);
    state.regionFilter = r;
    window.__ALBAM_TOP12_REGION_FILTER = r;
    return r;
  }

  function resolveRegion(requestedRegion) {
    var requested = normalizeRegion(requestedRegion);
    var realPageRegion = normalizeRegion(inferPageRegion());
    var pageKey = currentPageKey();

    // index만 전체 업소 TOP12입니다.
    // 그 외 지역/기타 페이지는 페이지 자체 범위를 최우선으로 사용합니다.
    // 기존 HTML에 openNearestPanel('ALL') 또는 setupNearestPanel('ALL')이 남아 있어도
    // 기타업소/동구/남구 같은 빈 페이지에서 전체 업소가 섞여 나오지 않게 막습니다.
    if (pageKey !== 'index' && realPageRegion) return realPageRegion;

    if (requested && requested !== 'ALL') return requested;
    return realPageRegion || 'ALL';
  }

  function regionLabel(regionFilter) {
    var r = normalizeRegion(regionFilter);
    return REGION_LABEL_MAP[r] || (r + ' 업소');
  }

  function toRad(value) { return (Number(value) * Math.PI) / 180; }

  function getDistanceKm(lat1, lng1, lat2, lng2) {
    lat1 = Number(lat1); lng1 = Number(lng1); lat2 = Number(lat2); lng2 = Number(lng2);
    if (!isFinite(lat1) || !isFinite(lng1) || !isFinite(lat2) || !isFinite(lng2)) return 999999;
    var R = 6371;
    var dLat = toRad(lat2 - lat1);
    var dLng = toRad(lng2 - lng1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function telHref(phone) {
    return 'tel:' + String(phone || '').replace(/[^0-9+]/g, '');
  }

  function injectCss() {
    if (document.getElementById('albam-real-nearest-style')) return;
    var style = document.createElement('style');
    style.id = 'albam-real-nearest-style';
    style.textContent = '' +
      '#nearest-panel{position:fixed;right:0;top:0;width:min(410px,94vw);height:100vh;background:rgba(10,10,15,.975);color:#fff;z-index:9999;box-shadow:-14px 0 38px rgba(0,0,0,.48);transform:translateX(105%);transition:transform .28s ease;display:flex;flex-direction:column;font-family:var(--albam09-font-main)!important;}' +
      '#nearest-panel.is-open{transform:translateX(0);}' +
      '#nearest-header{padding:15px 16px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:space-between;gap:10px;}' +
      '.nearest-title{display:flex;flex-direction:column;line-height:1.25}.nearest-title span{font-size:13px;color:#aaa}.nearest-title b{font-size:18px;color:#f6f0ff;margin-top:3px;}' +
      '#nearest-close{border:0;background:transparent;color:#bbb;font-size:24px;line-height:1;cursor:pointer;padding:4px 6px;}' +
      '#nearest-status{padding:10px 16px;font-size:13px;color:#aaa;border-bottom:1px solid rgba(255,255,255,.06);line-height:1.45;}' +
      '#nearest-list{padding:9px 10px 18px;overflow-y:auto;flex:1;scrollbar-width:thin;}' +
      '.nearest-item{display:block;text-decoration:none;color:#fff;border-radius:13px;background:rgba(255,255,255,.038);padding:11px 11px 10px;margin:0 0 9px;border:1px solid rgba(255,255,255,.075);}' +
      '.nearest-item:hover{background:rgba(201,182,255,.10);border-color:rgba(201,182,255,.28);}' +
      '.nearest-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}.nearest-rank{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#c9b6ff;color:#211139;font-size:13px;font-weight:900;flex:0 0 auto}.nearest-name{flex:1;min-width:0;font-size:15px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nearest-dist{font-size:12px;color:#c59bff;white-space:nowrap;font-weight:800}.nearest-meta{font-size:12px;color:#bbb;line-height:1.4}.nearest-call{display:inline-block;margin-top:7px;font-size:12px;padding:4px 9px;border-radius:999px;border:1px solid rgba(197,155,255,.7);color:#f3ddff;text-decoration:none;}' +
      '.nearest-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 10px}.nearest-action-btn{border:0;border-radius:12px;background:#c9b6ff;color:#221439;font-weight:900;padding:10px 12px;cursor:pointer;font-size:13px}.nearest-action-btn.secondary{background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.12)}' +
      '.nearest-note{font-size:12px;color:#bfb8cf;line-height:1.55;padding:6px 2px 10px;}' +
      '@media(max-width:640px){#nearest-panel{width:94vw;}.nearest-name{font-size:14px}}';
    document.head.appendChild(style);
  }

  function ensurePanel(regionFilter) {
    injectCss();
    var panel = document.getElementById('nearest-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'nearest-panel';
      panel.innerHTML = '' +
        '<div id="nearest-header">' +
          '<div class="nearest-title"><span>내 위치 기준</span><b>가까운 업소 TOP 12</b></div>' +
          '<button id="nearest-close" type="button" aria-label="닫기">×</button>' +
        '</div>' +
        '<div id="nearest-status">위치 정보를 확인하는 중입니다...</div>' +
        '<div id="nearest-list"></div>';
      document.body.appendChild(panel);
    }
    var titleSpan = panel.querySelector('.nearest-title span');
    var titleBold = panel.querySelector('.nearest-title b');
    if (titleSpan) titleSpan.textContent = '내 위치 기준 · ' + regionLabel(regionFilter);
    if (titleBold) titleBold.textContent = '가까운 업소 TOP 12';

    var close = document.getElementById('nearest-close');
    if (close && !close.dataset.bound) {
      close.dataset.bound = '1';
      close.addEventListener('click', hidePanel);
    }
    return panel;
  }

  function showPanel(regionFilter) {
    ensurePanel(regionFilter).classList.add('is-open');
  }

  function hidePanel() {
    var panel = document.getElementById('nearest-panel');
    if (panel) panel.classList.remove('is-open');
  }

  function updateStatus(text) {
    var el = document.getElementById('nearest-status');
    if (el) el.textContent = text;
  }

  function listPagePlaces(regionFilter) {
    var region = normalizeRegion(regionFilter);
    var places = getPlaces().filter(function (p) {
      return p && isFinite(Number(p.lat)) && isFinite(Number(p.lng));
    });
    if (region && region !== 'ALL') {
      places = places.filter(function (p) { return String(p.region || '').trim() === region; });
    }
    return places;
  }

  function renderDistanceResults(userLat, userLng, accuracy, fromCache, regionFilter) {
    var listEl = document.getElementById('nearest-list');
    if (!listEl) return;

    var places = listPagePlaces(regionFilter);
    var label = regionLabel(regionFilter);
    if (!places.length) {
      updateStatus(label + '에 등록된 좌표 업소가 없습니다.');
      listEl.innerHTML = '<div class="nearest-note">이 페이지에 등록된 업소가 없어서 TOP 12를 표시할 수 없습니다.</div>';
      return;
    }

    var list = places.map(function (p) {
      var copy = {};
      for (var k in p) copy[k] = p[k];
      copy.distance = getDistanceKm(userLat, userLng, p.lat, p.lng);
      return copy;
    }).sort(function (a, b) {
      return a.distance - b.distance;
    }).slice(0, MAX_RESULTS);

    listEl.innerHTML = list.map(function (p, idx) {
      var dist = Number(p.distance);
      var distTxt = dist < 1 ? Math.round(dist * 1000) + ' m' : dist.toFixed(1) + ' km';
      return '' +
        '<a class="nearest-item" href="' + telHref(p.phone) + '">' +
          '<div class="nearest-row"><span class="nearest-rank">' + (idx + 1) + '</span><span class="nearest-name">' + esc(p.id || p.name || ('업소 ' + (idx + 1))) + '</span><span class="nearest-dist">' + esc(distTxt) + '</span></div>' +
          '<div class="nearest-meta">' + esc(p.address || '') + '</div>' +
          '<div class="nearest-meta">지역: ' + esc(p.region || '광주') + '</div>' +
          '<span class="nearest-call">전화걸기</span>' +
        '</a>';
    }).join('');

    var accText = isFinite(Number(accuracy)) ? ' · 위치 정확도 약 ' + Math.round(Number(accuracy)) + 'm' : '';
    var sourceText = fromCache ? '저장된 내 위치 기준으로 ' + label + '를 정렬했습니다' : '실제 현재 위치 기준으로 ' + label + '를 정렬했습니다';
    updateStatus(sourceText + accText + ' · 다시 측정하려면 아래 새로고침 버튼을 누르세요.');

    var refreshWrap = document.createElement('div');
    refreshWrap.className = 'nearest-actions';
    refreshWrap.innerHTML = '<button type="button" class="nearest-action-btn secondary" id="nearest-refresh-location">현재 위치 새로 확인</button>';
    listEl.insertBefore(refreshWrap, listEl.firstChild);
    var refresh = document.getElementById('nearest-refresh-location');
    if (refresh) refresh.addEventListener('click', function () {
      clearCachedLocation();
      requestAndRenderPosition(true, regionFilter);
    });
  }

  function renderNoDistanceList(reasonText, regionFilter) {
    var listEl = document.getElementById('nearest-list');
    if (!listEl) return;
    var places = listPagePlaces(regionFilter).slice(0, MAX_RESULTS);
    var label = regionLabel(regionFilter);
    var note = reasonText || '현재 위치를 가져오지 못해 거리 계산 없이 ' + label + ' TOP 12만 표시합니다.';
    var html = '' +
      '<div class="nearest-actions">' +
        '<button type="button" class="nearest-action-btn" id="nearest-retry-btn">현재 위치 다시 확인</button>' +
        '<button type="button" class="nearest-action-btn secondary" id="nearest-basic-btn">거리 없이 보기</button>' +
      '</div>' +
      '<div class="nearest-note">' + esc(note) + '<br>실제 거리 표시가 나오려면 브라우저 위치 권한에서 허용을 눌러야 합니다.</div>';

    if (!places.length) {
      html += '<div class="nearest-note">이 페이지에 등록된 업소가 없습니다.</div>';
    } else {
      html += places.map(function (p, idx) {
        return '' +
          '<a class="nearest-item" href="' + telHref(p.phone) + '">' +
            '<div class="nearest-row"><span class="nearest-rank">' + (idx + 1) + '</span><span class="nearest-name">' + esc(p.id || p.name || ('업소 ' + (idx + 1))) + '</span><span class="nearest-dist">거리확인 전</span></div>' +
            '<div class="nearest-meta">' + esc(p.address || '') + '</div>' +
            '<div class="nearest-meta">지역: ' + esc(p.region || '광주') + '</div>' +
            '<span class="nearest-call">전화걸기</span>' +
          '</a>';
      }).join('');
    }
    listEl.innerHTML = html;

    var retry = document.getElementById('nearest-retry-btn');
    if (retry) retry.addEventListener('click', function () {
      clearCachedLocation();
      requestAndRenderPosition(true, regionFilter);
    });
    var basic = document.getElementById('nearest-basic-btn');
    if (basic) basic.addEventListener('click', function () {
      updateStatus('거리 계산 없이 ' + label + ' 등록 순서 TOP 12를 표시 중입니다.');
    });
  }

  function positionErrorMessage(err) {
    if (!navigator.geolocation) return '이 브라우저가 위치 기능을 지원하지 않습니다.';
    if (err && err.code === 1) return '위치 권한이 거부되었습니다. 주소창 왼쪽 자물쇠/사이트 설정에서 위치 권한을 허용해야 실제 거리 계산이 됩니다.';
    if (err && err.code === 2) return '현재 위치를 사용할 수 없습니다. 네트워크 또는 위치 서비스 상태를 확인하세요.';
    if (err && err.code === 3) return '현재 위치 확인 시간이 초과되었습니다. 다시 시도하세요.';
    return '현재 위치를 가져오지 못했습니다.';
  }

  function requestPosition() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject({ code: 0, message: 'geolocation unsupported' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) { resolve(pos); },
        function (err) { reject(err || { code: 0 }); },
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 600000 }
      );
    });
  }

  function requestAndRenderPosition(forceRefresh, regionFilter) {
    regionFilter = resolveRegion(regionFilter);
    setRegion(regionFilter);
    showPanel(regionFilter);
    var listEl = document.getElementById('nearest-list');

    if (!forceRefresh) {
      var cached = readCachedLocation();
      if (cached) {
        if (listEl) listEl.innerHTML = '<div class="nearest-note">이전에 허용한 내 위치를 불러오는 중입니다...</div>';
        renderDistanceResults(cached.latitude, cached.longitude, cached.accuracy, true, regionFilter);
        return;
      }
    }

    updateStatus('처음 한 번만 위치 권한을 요청합니다. 허용하면 같은 사이트 안에서는 저장된 위치로 바로 계산됩니다.');
    if (listEl) listEl.innerHTML = '<div class="nearest-note">위치 권한 창이 뜨면 허용을 눌러주세요. 배포된 https://www.albam09.com에서는 같은 도메인 안에서 권한이 유지됩니다.</div>';

    requestPosition().then(function (pos) {
      var coords = pos && pos.coords ? pos.coords : null;
      if (!coords || !isFinite(Number(coords.latitude)) || !isFinite(Number(coords.longitude))) {
        throw { code: 2, message: 'invalid coords' };
      }
      var saved = saveCachedLocation(coords);
      updateStatus('가까운 업소를 계산하는 중입니다...');
      renderDistanceResults(saved.latitude, saved.longitude, saved.accuracy, false, regionFilter);
    }).catch(function (err) {
      var msg = positionErrorMessage(err);
      updateStatus(msg);
      renderNoDistanceList(msg, regionFilter);
    });
  }

  window.setupNearestPanel = function (regionFilter) {
    setRegion(regionFilter);
    injectCss();
  };

  window.openNearestPanel = function (regionFilter) {
    requestAndRenderPosition(false, regionFilter);
  };

  window.refreshNearestLocation = function (regionFilter) {
    clearCachedLocation();
    requestAndRenderPosition(true, regionFilter);
  };
})();
