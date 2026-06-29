// /js/top12-ui.js
// 알밤09 TOP 12 버튼 복구: 클릭 시 실제 내 위치 기준 가까운 업소 패널을 우선 실행합니다.
(function () {
  if (window.__ALBAM_TOP12_UI_LOADED__) return;
  window.__ALBAM_TOP12_UI_LOADED__ = true;


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

  function inferPageRegion() {
    var path = '';
    try { path = String(location.pathname || ''); } catch (e) {}
    path = path.replace(/\\/g, '/');
    var parts = path.split('/').filter(function (part) { return part && part.trim(); });
    var file = parts.length ? parts[parts.length - 1] : 'index';
    file = file.replace(/\.html?$/i, '');
    if (!file || file === 'page') file = 'index';
    if (file in PAGE_REGION_MAP) return PAGE_REGION_MAP[file];
    try {
      var canonical = document.querySelector('link[rel="canonical"]');
      var href = canonical ? String(canonical.getAttribute('href') || '') : '';
      if (m && m[1] && (m[1] in PAGE_REGION_MAP)) return PAGE_REGION_MAP[m[1]];
    } catch (e) {}
    return 'ALL';
  }

  var state = { regionFilter: inferPageRegion() };

  function getPlaces() {
    try {
      if (typeof PLACES !== 'undefined' && Array.isArray(PLACES)) return PLACES;
    } catch (e) {}
    if (Array.isArray(window.PLACES)) return window.PLACES;
    return [];
  }

  function normalizeRegionFilter(regionFilter) {
    var r = String(regionFilter || window.__ALBAM_TOP12_REGION_FILTER || state.regionFilter || 'ALL').trim();
    if (!r || /^(all|전체)$/i.test(r)) return 'ALL';
    return r;
  }

  function getScopedPlaces() {
    var region = normalizeRegionFilter();
    var places = getPlaces();
    if (region === 'ALL') return places;
    return places.filter(function (p) { return String((p && p.region) || '').trim() === region; });
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
    if (document.getElementById('albam-top12-style')) return;
    var style = document.createElement('style');
    style.id = 'albam-top12-style';
    style.textContent = '' +
      '#floating-top12-btn{position:fixed;right:12px;bottom:142px;z-index:9998;min-width:92px;padding:11px 14px;border-radius:999px;background:linear-gradient(135deg,#c9b6ff,#8d5cff);color:#fff;font-weight:800;font-size:13px;letter-spacing:.2px;text-align:center;box-shadow:0 10px 26px rgba(70,38,130,.42);border:1px solid rgba(255,255,255,.22);cursor:pointer;user-select:none;}' +
      '#floating-top12-btn:hover{filter:brightness(1.05);transform:translateY(-1px);}' +
      '#top12-panel{position:fixed;right:0;top:0;width:min(370px,92vw);height:100vh;background:rgba(10,10,17,.98);color:#fff;z-index:9999;box-shadow:-14px 0 38px rgba(0,0,0,.48);transform:translateX(105%);transition:transform .28s ease;display:flex;flex-direction:column;font-family:var(--albam09-font-main)!important;}' +
      '#top12-panel.is-open{transform:translateX(0);}' +
      '#top12-header{padding:15px 16px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(180deg,rgba(201,182,255,.16),rgba(10,10,17,0));}' +
      '#top12-header .top12-title{display:flex;flex-direction:column;line-height:1.25;}' +
      '#top12-header .top12-title b{font-size:17px;color:#fff;}' +
      '#top12-header .top12-title span{font-size:12px;color:#cdbfff;margin-top:3px;}' +
      '#top12-close{border:0;background:transparent;color:#d7ccff;font-size:24px;line-height:1;cursor:pointer;padding:4px 6px;}' +
      '#top12-content{padding:10px 10px 18px;overflow-y:auto;flex:1;scrollbar-width:thin;}' +
      '.top12-item{display:block;text-decoration:none;color:#fff;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:13px;padding:10px 10px 9px;margin:0 0 8px;}' +
      '.top12-row{display:flex;align-items:center;gap:8px;}' +
      '.top12-rank{width:27px;height:27px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#c9b6ff;color:#211139;font-size:12px;font-weight:900;flex:0 0 auto;}' +
      '.top12-name{font-size:14px;font-weight:800;line-height:1.25;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.top12-call{font-size:11px;color:#f4eaff;border:1px solid rgba(201,182,255,.55);border-radius:999px;padding:3px 7px;white-space:nowrap;}' +
      '.top12-meta{font-size:11px;color:#bfb8cf;margin-top:6px;line-height:1.35;}' +
      '.top12-location-btn{width:100%;border:0;border-radius:12px;background:#c9b6ff;color:#221439;font-weight:900;padding:10px 12px;margin:2px 0 10px;cursor:pointer;}' +
      '.top12-empty{padding:18px 10px;color:#bbb;font-size:13px;line-height:1.5;}' +
      '@media(max-width:640px){#floating-top12-btn{right:10px;bottom:132px;min-width:82px;padding:10px 12px;font-size:12px;}#top12-panel{width:94vw;}}';
    document.head.appendChild(style);
  }

  function normalizeRegion(regionFilter) {
    var r = (regionFilter || 'ALL').toString().trim();
    return r === '' ? 'ALL' : r;
  }

  function ensureButton() {
    var btn = document.getElementById('floating-top12-btn');
    if (!btn) {
      btn = document.createElement('div');
      btn.id = 'floating-top12-btn';
      document.body.appendChild(btn);
    }
    btn.textContent = 'TOP 12';
    if (!btn.dataset.top12Bound) {
      btn.dataset.top12Bound = '1';
      btn.addEventListener('click', function () {
        if (typeof window.openNearestPanel === 'function') {
          window.openNearestPanel();
        } else {
          openTop12Panel();
        }
      });
    }
    return btn;
  }

  function ensurePanel() {
    var panel = document.getElementById('top12-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'top12-panel';
      panel.innerHTML = '<div id="top12-header"></div><div id="top12-content"></div>';
      document.body.appendChild(panel);
    }
    var header = document.getElementById('top12-header');
    if (!header) {
      header = document.createElement('div');
      header.id = 'top12-header';
      panel.insertBefore(header, panel.firstChild);
    }
    header.innerHTML = '<div class="top12-title"><b>가까운 업소 TOP 12</b><span>광주 지역 추천 리스트</span></div><button id="top12-close" type="button" aria-label="TOP 12 닫기">×</button>';
    var close = document.getElementById('top12-close');
    if (close && !close.dataset.top12Bound) {
      close.dataset.top12Bound = '1';
      close.addEventListener('click', closeTop12Panel);
    }
    return panel;
  }

  function renderTop12() {
    var content = document.getElementById('top12-content');
    if (!content) return;
    var list = getScopedPlaces().slice(0, 12);
    if (!list.length) {
      content.innerHTML = '<div class="top12-empty">TOP 12 업소 데이터를 찾지 못했습니다.</div>';
      return;
    }
    var locationButton = '<button class="top12-location-btn" type="button" id="top12-nearest-run">내 위치 기준으로 가까운 순서 보기</button>';
    var items = list.map(function (p, idx) {
      var name = esc(p.id || p.name || ('업소 ' + (idx + 1)));
      var region = esc(p.region || '광주');
      var address = esc(p.address || '');
      return '<a class="top12-item" href="' + telHref(p.phone) + '">' +
        '<div class="top12-row"><span class="top12-rank">' + (idx + 1) + '</span><span class="top12-name">' + name + '</span><span class="top12-call">전화</span></div>' +
        '<div class="top12-meta">' + region + (address ? ' · ' + address : '') + '</div>' +
      '</a>';
    }).join('');
    content.innerHTML = locationButton + items;
    var nearestBtn = document.getElementById('top12-nearest-run');
    if (nearestBtn) nearestBtn.addEventListener('click', function () {
      closeTop12Panel();
      if (typeof window.openNearestPanel === 'function') window.openNearestPanel();
    });
  }

  function openTop12Panel() {
    injectCss();
    ensurePanel();
    renderTop12();
    var panel = document.getElementById('top12-panel');
    if (panel) panel.classList.add('is-open');
  }

  function closeTop12Panel() {
    var panel = document.getElementById('top12-panel');
    if (panel) panel.classList.remove('is-open');
  }

  function setupTop12Panel(regionFilter) {
    state.regionFilter = normalizeRegion(regionFilter || window.__ALBAM_TOP12_REGION_FILTER || state.regionFilter);
    window.__ALBAM_TOP12_REGION_FILTER = state.regionFilter;
    injectCss();
    ensureButton();
    ensurePanel();
    renderTop12();
  }

  window.setupTop12Panel = setupTop12Panel;
  window.setupNearestPanel = window.setupNearestPanel || setupTop12Panel;
  window.openTop12Panel = openTop12Panel;
  window.closeTop12Panel = closeTop12Panel;

  function boot() { setupTop12Panel(window.__ALBAM_TOP12_REGION_FILTER || state.regionFilter); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
