/* ALBAM09 random order 20260622B
   index 제외. 지역 페이지/기타/place 목록과 상세 설명 모음은 페이지 열 때마다 섞고,
   열어둔 상태에서도 일정 시간마다 다시 섞습니다.
*/
(function(){
  'use strict';
  if (window.__ALBAM09_RANDOM_ORDER_20260622B__) return;
  window.__ALBAM09_RANDOM_ORDER_20260622B__ = true;
  var TICK_MS = 14000;
  function isIndex(){
    var path=(location.pathname||'/').replace(/\/+/g,'/');
    return path==='/' || /\/index\.html?$/i.test(path);
  }
  function randInt(max){
    if(!max || max < 2) return 0;
    if(window.crypto && window.crypto.getRandomValues){
      var a=new Uint32Array(1); window.crypto.getRandomValues(a); return a[0] % max;
    }
    return Math.floor(Math.random()*max);
  }
  function shuffle(arr){
    for(var i=arr.length-1;i>0;i--){var j=randInt(i+1); var t=arr[i]; arr[i]=arr[j]; arr[j]=t;}
    return arr;
  }
  function shuffleDirect(parent, selector, keepFirstCount){
    if(!parent) return 0;
    var targets=Array.prototype.slice.call(parent.children).filter(function(el){return el.matches && el.matches(selector);});
    if(targets.length < 2) return 0;
    var keep = keepFirstCount ? targets.slice(0, keepFirstCount) : [];
    var rest = keepFirstCount ? targets.slice(keepFirstCount) : targets.slice();
    shuffle(rest);
    keep.concat(rest).forEach(function(el){ parent.appendChild(el); });
    parent.setAttribute('data-albam09-randomized','true');
    parent.setAttribute('data-albam09-randomized-count', String(targets.length));
    return targets.length;
  }
  function randomizeStoreCards(){
    var count=0;
    document.querySelectorAll('section[list] div[wrapper]').forEach(function(box){
      var cards=Array.prototype.slice.call(box.children).filter(function(el){
        return el.tagName==='UL' && el.querySelector('a[href^="/place/"]');
      });
      if(cards.length>1){
        shuffle(cards).forEach(function(el){ box.insertBefore(el, box.firstChild); });
        box.setAttribute('data-albam09-randomized','store-list-live');
        count += cards.length;
      }
    });
    return count;
  }
  function run(){
    if(isIndex()) return 0;
    var changed=0;
    changed += randomizeStoreCards();
    document.querySelectorAll('.business-description-section > div').forEach(function(box){ changed += shuffleDirect(box, 'a.business-description-item, a.business-description-link', 0); });
    document.querySelectorAll('.seo-article-list').forEach(function(box){ changed += shuffleDirect(box, 'article.seo-article-card', 0); });
    document.querySelectorAll('.insta-grid').forEach(function(box){ changed += shuffleDirect(box, '.insta-card', 0); });
    document.querySelectorAll('.place-list').forEach(function(box){ changed += shuffleDirect(box, 'a.place-list-card', 0); });
    document.querySelectorAll('.detail-related').forEach(function(box){ changed += shuffleDirect(box, 'a', 0); });
    document.querySelectorAll('.detail-gallery').forEach(function(box){ changed += shuffleDirect(box, 'a', 0); });
    document.documentElement.setAttribute('data-albam09-random-total', String(changed));
    document.documentElement.setAttribute('data-albam09-random-time', String(Date.now()));
    return changed;
  }
  function boot(){
    run();
    if(!isIndex()) {
      window.setInterval(function(){
        if (document.hidden) return;
        run();
      }, TICK_MS);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
