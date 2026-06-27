(function(){
  var DOMAIN = 'https://www.albam09.com';
  var DOMAIN2 = 'https://www.albam09.com';
  function toRelative(url){
    if(!url) return url;
    if(url.indexOf(DOMAIN) === 0) return url.slice(DOMAIN.length).replace(/^\//,'') || 'index.html';
    if(url.indexOf(DOMAIN2) === 0) return url.slice(DOMAIN2.length).replace(/^\//,'') || 'index.html';
    return url;
  }
  function convert(){
    if(location.protocol !== 'file:') return;
    document.querySelectorAll('a[href]').forEach(function(a){
      var href = a.getAttribute('href');
      if(!href) return;
      if(href.indexOf(DOMAIN) === 0 || href.indexOf(DOMAIN2) === 0){
        a.setAttribute('href', toRelative(href));
      }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', convert);
  else convert();
})();
