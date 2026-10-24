/* track.js — privacy-friendly visit tracker for the PUBLIC site (not loaded in /admin).
   Sends: one "view" per page load + a "ping" every 30s while the tab is visible (powers "online now").
   Stores only a random visitor id (localStorage) + session id (sessionStorage). No IPs, no cookies.
   Honours Do-Not-Track. Endpoint: POST {API}/track  (see backend-laravel/). */
(function(){
  'use strict';
  try{
    if(navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    if(navigator.webdriver) return;
    if(/\/admin\//.test(location.pathname)) return;

    var BASE = (window.api && window.api.BASE) || (window.UPADYAY_API_BASE ||
      (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8000/api' : 'https://api.upaadhyay.com/api')).replace(/\/+$/, '');
    var URL_ = BASE + '/track';

    function rid(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
    function get(store, key){ try{ var v = store.getItem(key); if(!v){ v = rid(); store.setItem(key, v); } return v; }catch(e){ return rid(); } }
    var vid = get(window.localStorage, 'upy_vid'), sid = get(window.sessionStorage, 'upy_sid');

    var path = location.pathname.replace(/\/index\.html$/, '/') || '/';
    function send(type){
      var body = JSON.stringify({ type: type, vid: vid, sid: sid, path: path, ref: document.referrer || '', w: window.innerWidth || 0 });
      try{
        if(navigator.sendBeacon && navigator.sendBeacon(URL_, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return;
      }catch(e){}
      try{ fetch(URL_, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }); }catch(e){}
    }

    send('view');
    var timer = null;
    function start(){ if(!timer) timer = setInterval(function(){ if(!document.hidden) send('ping'); }, 30000); }
    function stop(){ clearInterval(timer); timer = null; }
    document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); else { send('ping'); start(); } });
    if(!document.hidden) start();
  }catch(e){ /* tracking must never break the site */ }
})();
