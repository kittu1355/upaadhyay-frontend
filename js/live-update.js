/* ==========================================================================
   live-update.js — keeps every open page fresh without the user doing anything.
   Load it RIGHT AFTER js/api.js and BEFORE js/store.js on every page.

   1. Stale-cache cleanup (runs synchronously, before store.js reads its saved state)
        - page was reloaded / hard-refreshed       -> drop the cached profile state (re-loaded from the server)
        - cached state older than 12 hours         -> drop it
        - a new site version was detected          -> drop it
      Only the cached state key is removed. The login token, sub-branch session and other settings are kept.
   2. New site version  -> page reloads itself (or shows a "Refresh now" bar if the user is typing).
        Version = version.json at the site root (run ./bump-version.sh on every deploy);
        if that file is missing it falls back to the page's own ETag / Last-Modified.
   3. Coming back to the tab / back-button restore / network back -> re-check right away.
   4. Login or logout in another tab -> this tab reloads so it never shows a stale role or account.
   5. New live jobs -> the Browse Jobs list refreshes by itself (toast shown); notifications are re-fetched too.
   ========================================================================== */
(function(){
  'use strict';
  var STORE_KEY = 'upadyay_state_v1';          // cached profile/dashboard state written by store.js
  var TOKEN_KEY = 'upadyay_api_token';         // Sanctum token written by api.js
  var VER_KEY = 'upadyay_app_version', STAMP_KEY = 'upadyay_cache_stamp', PURGE_KEY = 'upadyay_purge_pending';
  var GUARD_KEY = 'upadyay_reloaded_for';      // sessionStorage: stops a reload loop
  var MAX_AGE = 12 * 3600 * 1000, VERSION_POLL = 60 * 1000, JOBS_POLL = 90 * 1000, TYPING_IDLE = 120 * 1000;

  var ROOT = (function(){
    try{ var s = document.currentScript.src; return s.substring(0, s.lastIndexOf('/js/') + 1); }
    catch(e){ return '/'; }
  })();

  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }

  /* ---------- 1. stale cache cleanup (synchronous) ---------- */
  try{
    var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    var stamp = Number(lsGet(STAMP_KEY)) || 0;
    var purge = lsGet(PURGE_KEY) === '1' || nav.type === 'reload' || (stamp && Date.now() - stamp > MAX_AGE);
    if(purge){ lsDel(STORE_KEY); lsDel(PURGE_KEY); stamp = 0; }
    if(!stamp) lsSet(STAMP_KEY, String(Date.now()));
  }catch(e){}

  /* ---------- small UI ---------- */
  function toast(msg){
    if(window.api && typeof api.toast === 'function'){ api.toast(msg); return; }
  }
  var lastTyped = 0, hiddenAt = 0;
  document.addEventListener('input', function(){ lastTyped = Date.now(); }, true);
  function isBusy(){
    var a = document.activeElement;
    var typing = a && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable ||
      (a.tagName === 'INPUT' && !/^(button|submit|checkbox|radio|reset|file)$/i.test(a.type)));
    return !!typing || (Date.now() - lastTyped < TYPING_IDLE);
  }

  var bar = null, waitTimer = null;
  function showBar(onRefresh){
    if(bar || !document.body) return;
    bar = document.createElement('div');
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:100000;background:#0B1F45;color:#fff;' +
      'padding:10px 14px;border-radius:10px;font:600 13.5px/1.3 system-ui,sans-serif;display:flex;gap:12px;align-items:center;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.28);max-width:92vw;';
    bar.innerHTML = '<span>A new version of Upaadhyay is available.</span>';
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = 'Refresh now';
    b.style.cssText = 'background:#2563EB;color:#fff;border:0;border-radius:7px;padding:6px 12px;font:inherit;cursor:pointer;';
    b.onclick = onRefresh;
    bar.appendChild(b);
    document.body.appendChild(bar);
  }

  /* Reload now if the user is not in the middle of typing; otherwise show the bar and reload once they go idle. */
  function reloadWhenSafe(guardValue){
    function go(){
      try{ if(guardValue) sessionStorage.setItem(GUARD_KEY, guardValue); }catch(e){}
      location.reload();
    }
    if(!isBusy()){ go(); return; }
    showBar(go);
    if(!waitTimer) waitTimer = setInterval(function(){ if(!isBusy()){ clearInterval(waitTimer); go(); } }, 15000);
  }

  /* ---------- 2. new site version ---------- */
  var loadedSig = null;
  function fetchSig(){
    return fetch(ROOT + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then(function(r){
      if(r.ok) return r.json().then(function(j){ return j && j.version ? 'v:' + j.version : null; });
      return fetch(location.pathname, { method: 'HEAD', cache: 'no-store' }).then(function(h){
        var t = h.headers.get('etag') || h.headers.get('last-modified');
        return t ? 'h:' + t : null;
      });
    }).catch(function(){ return null; });
  }
  function onNewVersion(sig){
    lsSet(VER_KEY, sig);
    lsSet(PURGE_KEY, '1');          // next page load starts from a clean cached state
    var guarded = null; try{ guarded = sessionStorage.getItem(GUARD_KEY); }catch(e){}
    if(guarded === sig) return;     // already reloaded once for this version in this tab
    reloadWhenSafe(sig);
  }
  function checkVersion(){
    return fetchSig().then(function(sig){
      if(!sig) return;
      if(loadedSig === null){
        loadedSig = sig;
        var stored = lsGet(VER_KEY);
        if(stored && stored !== sig){ onNewVersion(sig); }   // returning after a deploy: page may come from cache
        else lsSet(VER_KEY, sig);
        return;
      }
      if(sig !== loadedSig){ loadedSig = sig; onNewVersion(sig); }
    });
  }

  /* ---------- 5. live jobs ---------- */
  var jobsSig = null;
  function jobsSignature(){
    if(!window.api) return Promise.resolve(null);
    return api.get('/jobs?per_page=50&page=1', { noAuthRedirect: true, silent403: true }).then(function(r){
      var rows = Array.isArray(r) ? r : ((r && r.data) || []);
      var total = (r && (r.total || (r.meta && r.meta.total))) || rows.length, maxId = 0, maxU = '';
      rows.forEach(function(j){
        if(j && Number(j.id) > maxId) maxId = Number(j.id);
        var u = (j && (j.updated_at || j.created_at)) || ''; if(u > maxU) maxU = u;
      });
      return total + '|' + maxId + '|' + maxU;
    }).catch(function(){ return null; });
  }
  function checkJobs(){
    var hasList = !!document.getElementById('bjJobList') && typeof window.bkLoadBrowseJobs === 'function';
    var staticJobs = typeof window.spLoadJobs === 'function';
    if(window.api && api.hasToken() && typeof window.bkLoadNotifs === 'function'){ try{ window.bkLoadNotifs(); }catch(e){} }
    if(!hasList && !staticJobs) return;
    return jobsSignature().then(function(sig){
      if(!sig) return;
      if(jobsSig === null){ jobsSig = sig; return; }
      if(sig === jobsSig) return;
      jobsSig = sig;
      if(hasList){
        Promise.resolve(window.bkLoadBrowseJobs()).then(function(){ toast('Job list updated with the latest openings.'); });
      } else {
        reloadWhenSafe(null);
      }
    });
  }

  /* ---------- 3 + 4. triggers ---------- */
  function checkAll(){ checkVersion(); checkJobs(); }
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ hiddenAt = Date.now(); return; }
    checkAll();
  });
  window.addEventListener('focus', function(){ checkAll(); });
  window.addEventListener('online', function(){ checkAll(); });
  window.addEventListener('pagehide', function(){ hiddenAt = Date.now(); });
  window.addEventListener('pageshow', function(e){
    // Back/forward cache restore can show a page frozen minutes ago: reload it if it was away for a while.
    if(e.persisted && hiddenAt && Date.now() - hiddenAt > 60 * 1000) reloadWhenSafe(null);
  });
  window.addEventListener('storage', function(e){
    // Another tab logged in / out (or switched role): this tab must not keep showing the old account.
    if(e.key === TOKEN_KEY || e.key === null) location.reload();
  });

  function start(){
    checkVersion();
    setInterval(function(){ if(!document.hidden) checkVersion(); }, VERSION_POLL);
    setTimeout(checkJobs, 4000);                                   // baseline signature once backend.js has loaded
    setInterval(function(){ if(!document.hidden) checkJobs(); }, JOBS_POLL);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
