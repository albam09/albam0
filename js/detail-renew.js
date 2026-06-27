// ALBAM09 renewed detail page helpers
(function(){
  function pad(n){ return String(n).padStart(2,'0'); }
  function tick(){
    var el = document.querySelector('[data-detail-clock]');
    if(!el) return;
    var d = new Date();
    var days = ['일','월','화','수','목','금','토'];
    el.textContent = days[d.getDay()] + '요일 ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' 현재 예약 상담 가능 여부는 전화로 확인하세요';
  }
  tick();
  setInterval(tick,1000);

  document.addEventListener('click', function(e){
    var copy = e.target.closest('[data-copy-phone]');
    if(copy){
      e.preventDefault();
      var val = copy.getAttribute('data-copy-phone') || '';
      if(navigator.clipboard && val){
        navigator.clipboard.writeText(val).then(function(){ copy.textContent='번호 복사 완료'; setTimeout(function(){copy.textContent='번호 복사';},1300); });
      }
    }
  });
})();
