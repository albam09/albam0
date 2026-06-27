/* ALBAM09 UI FIX 20260622B: 기타 페이지 TOP12/nearest 패널 초기 깜빡임 방지 */
(function(){
  'use strict';
  if (window.__ALBAM09_UI_FIX_20260622B__) return;
  window.__ALBAM09_UI_FIX_20260622B__ = true;
  function closePanels(){
    var top=document.getElementById('top12-panel');
    if(top) top.classList.remove('is-open');
    var near=document.getElementById('nearest-panel');
    if(near) near.classList.remove('is-open');
    var legacy=document.getElementById('nearestPanel');
    if(legacy) {
      legacy.setAttribute('hidden','');
      legacy.style.display='none';
      legacy.style.visibility='hidden';
      legacy.style.opacity='0';
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', closePanels, {once:true}); else closePanels();
  window.addEventListener('pageshow', closePanels);
})();
