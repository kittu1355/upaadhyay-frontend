// admin/js/shell.js — dashboard look & feel: sidebar logout, top-bar search/avatar, and the overview
// extras (welcome header, 5th stat card, activity chart, top institutions, most active faculty).
// All numbers come from the real /api/admin/* endpoints — nothing here is sample data.
(function(){
  const $s = function(id){ return document.getElementById(id); };
  let USER = null;

  /* ------------------------------------------------------------ chrome (sidebar + top bar) */
  const _mount = window.mountChrome;
  window.mountChrome = function(opts){
    _mount.apply(this, arguments);
    try{ USER = opts && opts.user; enhanceChrome(opts || {}); }catch(e){ console.warn('[shell]', e); }
  };
  function enhanceChrome(opts){
    const brand = document.querySelector('.admin-side-brand span'); if(brand) brand.textContent = 'Upaadhyay';
    const foot = document.querySelector('.admin-side-foot');
    if(foot){
      foot.innerHTML = '<button type="button" class="admin-side-logout" id="sideLogout"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Logout</button><small>Signed in as admin</small>';
      $s('sideLogout').addEventListener('click', function(){ if(typeof adminLogout === 'function') adminLogout(); });
    }
    const right = document.querySelector('.admin-top-right'), title = document.querySelector('.admin-top-title');
    if(title && !document.querySelector('.x-search')){
      title.insertAdjacentHTML('afterend', '<div class="x-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input type="search" id="xGlobalSearch" placeholder="Search" aria-label="Search this page"></div>');
      let t; const inp = $s('xGlobalSearch');
      inp.addEventListener('input', function(){ clearTimeout(t); t = setTimeout(function(){ globalSearch(inp.value.trim()); }, 400); });
      inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ clearTimeout(t); globalSearch(inp.value.trim()); } });
    }
    if(right && !right.querySelector('.x-avatar')){
      const n = (USER && (USER.name || USER.email)) || 'A';
      right.insertAdjacentHTML('beforeend', '<span class="x-avatar" title="' + esc(n) + '">' + esc(initials(n)) + '</span>');
    }
  }
  // Types into the search box of whatever page is open (so the top search always does something real).
  function globalSearch(q){
    if(!$s('panelOverview')){ if(q) window.location.href = 'index.html?tab=institutions'; return; }
    const panel = document.querySelector('main section:not([hidden])');
    let inp = panel && panel.querySelector('input[type=search]:not(#xGlobalSearch)');
    if(!inp && typeof adminGo === 'function'){ adminGo('institutions'); inp = $s('instSearch'); }
    if(inp){ inp.value = q; inp.dispatchEvent(new Event('input', { bubbles:true })); }
  }

  /* ------------------------------------------------------------ overview */
  const WIN = 30, COL = { apps:'#2fd36b', jobs:'#0f7a4a' };
  let D = null;   // { apps:[], jobs:[] } cached for the chart range switch

  function setupOverview(){
    const p = $s('panelOverview'); if(!p || p.dataset.themed) return; p.dataset.themed = '1';
    const nm = USER && (USER.name || String(USER.email || '').split('@')[0]) || 'Admin';
    p.insertAdjacentHTML('afterbegin', '<div class="ov-head"><div><h2>Welcome back, ' + esc(nm) + '!</h2><p>Here\u2019s what is happening on Upaadhyay today</p></div>'
      + '<div class="ov-head-r"><button type="button" class="btn btn-ghost" onclick="adminGo(\'applications\')">View applications</button><button type="button" class="btn btn-primary" onclick="adminGo(\'institutions\',\'pending\')">Review pending institutions</button></div></div>');
    $s('ovStats').insertAdjacentHTML('afterend',
      '<div class="ov-row"><div class="admin-panel ov-chart"><div class="ov-chart-top"><h3>Summary</h3><div class="ov-legend"><span><i style="background:' + COL.apps + '"></i>Applications</span><span><i style="background:' + COL.jobs + '"></i>Jobs posted</span>'
      + '<select id="ovRange" aria-label="Range"><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></div></div><div class="ov-chart-body" id="ovChart"><div class="ov-empty">Loading…</div></div></div>'
      + '<div class="admin-panel"><div class="admin-panel-head"><span>Top institutions</span><button type="button" class="btn btn-ghost btn-sm" onclick="adminGo(\'institutions\',\'approved\')">View all</button></div><div id="ovTopInst"><div class="ov-empty">Loading…</div></div></div></div>');
    const two = p.querySelector('.admin-two-col'); if(two){
      two.classList.add('three');
      two.insertAdjacentHTML('beforeend', '<div class="admin-panel"><div class="admin-panel-head"><span>Most active faculty</span><button type="button" class="btn btn-ghost btn-sm" onclick="adminGo(\'faculty\')">View all</button></div><div id="ovTopFac"><div class="ov-empty">Loading…</div></div></div>');
    }
    $s('ovRange').addEventListener('change', drawChart);
  }

  async function pull(path, key){
    const since = Date.now() - WIN * 864e5, keep = window.__sortOld; window.__sortOld = false;
    let out = [];
    try{
      for(let page = 1; page <= 8; page++){
        const r = await api.get(path + qs({ page:page, per_page:100 })), rows = (r && r.data) || [];
        out = out.concat(rows);
        const last = rows[rows.length - 1];
        if(!rows.length || page >= ((r && r.last_page) || 1) || (last && new Date(last[key] || last.created_at) < since)) break;
      }
    }finally{ window.__sortOld = keep; }
    return out;
  }

  function addFifthCard(){
    const box = $s('ovStats'), d = S.dash; if(!box || !d || box.querySelector('.c5')) return;
    box.insertAdjacentHTML('beforeend', '<div class="admin-stat c5"><div class="admin-stat-top"><div class="n">' + (d.total_candidates || 0) + '</div><div class="l">Faculty registered</div></div><div class="admin-stat-bot" onclick="adminGo(\'faculty\')">View faculty \u2192</div></div>');
  }

  async function loadInsights(){
    if(!$s('ovChart')) return;
    try{
      const r = await Promise.all([pull('/admin/applications', 'applied_at'), pull('/admin/jobs', 'created_at')]);
      D = { apps:r[0], jobs:r[1] }; drawChart(); drawFaculty();
    }catch(e){
      const m = '<div class="ov-empty">' + esc(e.message || 'Could not load.') + '</div>';
      $s('ovChart').innerHTML = m; if($s('ovTopFac')) $s('ovTopFac').innerHTML = m;
    }
    try{
      const res = await api.get('/admin/companies' + qs({ status:'approved', per_page:100 }));
      const rows = ((res && res.data) || []).slice().sort(function(a, b){ return (b.jobs_count || 0) - (a.jobs_count || 0); }).slice(0, 3);
      $s('ovTopInst').innerHTML = rows.map(function(c){
        return '<div class="ov-list-item" style="cursor:pointer" onclick="openInstitution(' + c.id + ')">' + avatarHtml(c.company_name, c.logo)
          + '<div class="t"><b>' + esc(c.company_name) + '</b><small>Code ' + esc(c.institution_code || '\u2014') + '</small></div><span class="ov-chip">' + (c.jobs_count || 0) + ' jobs</span></div>';
      }).join('') || '<div class="ov-empty">No approved institutions yet.</div>';
    }catch(e){ $s('ovTopInst').innerHTML = '<div class="ov-empty">' + esc(e.message || 'Could not load.') + '</div>'; }
  }

  function dayKey(d){ d = new Date(d); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function drawChart(){
    const box = $s('ovChart'); if(!box || !D) return;
    const n = Number($s('ovRange').value) || 7, days = [], now = new Date();
    for(let i = n - 1; i >= 0; i--){ const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); days.push({ d:d, k:dayKey(d), a:0, j:0 }); }
    const idx = {}; days.forEach(function(x, i){ idx[x.k] = i; });
    D.apps.forEach(function(a){ const i = idx[dayKey(a.applied_at || a.created_at)]; if(i != null) days[i].a++; });
    D.jobs.forEach(function(j){ const i = idx[dayKey(j.created_at)]; if(i != null) days[i].j++; });
    const W = 640, H = 230, L = 34, R = 26, T = 16, B = 30, max = Math.max(4, Math.max.apply(null, days.map(function(x){ return Math.max(x.a, x.j); })));
    const top = max <= 4 ? 4 : Math.ceil(max / 4) * 4, X = function(i){ return L + (n === 1 ? 0 : i * (W - L - R) / (n - 1)); }, Y = function(v){ return T + (1 - v / top) * (H - T - B); };
    const path = function(vals){
      const p = vals.map(function(v, i){ return [X(i), Y(v)]; }); let d = 'M' + p[0][0] + ',' + p[0][1];
      for(let i = 0; i < p.length - 1; i++){
        const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
        d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6) + ',' + Math.min(H - B, Math.max(T, p1[1] + (p2[1] - p0[1]) / 6)) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6) + ',' + Math.min(H - B, Math.max(T, p2[1] - (p3[1] - p1[1]) / 6)) + ' ' + p2[0] + ',' + p2[1];
      }
      return d;
    };
    let g = '';
    for(let t = 0; t <= 4; t++){ const v = top / 4 * t, y = Y(v); g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#eef0f4"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#8b92a1">' + v + '</text>'; }
    const step = n <= 7 ? 1 : 5;
    days.forEach(function(x, i){ if(i % step === 0 || i === n - 1) g += '<text x="' + X(i) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="11" fill="#8b92a1">' + x.d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) + '</text>'; });
    const cols = days.map(function(x, i){ return '<rect data-i="' + i + '" x="' + (X(i) - (W - L - R) / (n - 1 || 1) / 2) + '" y="' + T + '" width="' + ((W - L - R) / (n - 1 || 1)) + '" height="' + (H - T - B) + '" fill="transparent"/>'; }).join('');
    box.innerHTML = '<div class="ov-svgwrap" style="position:relative"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Applications and jobs per day">' + g
      + '<path d="' + path(days.map(function(x){ return x.a; })) + '" fill="none" stroke="' + COL.apps + '" stroke-width="2.4" stroke-linecap="round"/>'
      + '<path d="' + path(days.map(function(x){ return x.j; })) + '" fill="none" stroke="' + COL.jobs + '" stroke-width="2.4" stroke-linecap="round"/>'
      + '<circle id="ovDot" r="4.5" fill="#1a5cff" stroke="#fff" stroke-width="2" style="display:none"/>' + cols + '</svg><div class="ov-tip" id="ovTip"></div></div>';
    const tip = $s('ovTip'), dot = $s('ovDot');
    box.querySelectorAll('rect[data-i]').forEach(function(r){
      r.addEventListener('mouseenter', function(){
        const x = days[Number(r.dataset.i)], px = X(Number(r.dataset.i)), py = Y(Math.max(x.a, x.j));
        dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.style.display = '';
        tip.innerHTML = x.d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) + ' \u00b7 ' + x.a + ' applications \u00b7 ' + x.j + ' jobs';
        tip.style.left = (px / W * 100) + '%'; tip.style.top = (py / H * 100) + '%'; tip.style.display = 'block';
      });
      r.addEventListener('mouseleave', function(){ tip.style.display = 'none'; dot.style.display = 'none'; });
    });
  }

  function drawFaculty(){
    const box = $s('ovTopFac'); if(!box || !D) return;
    const m = {}, since = Date.now() - 7 * 864e5;
    D.apps.forEach(function(a){
      if(new Date(a.applied_at || a.created_at) < since) return;
      const c = a.candidate || {}, k = c.id || c.email; if(!k) return;
      (m[k] = m[k] || { id:c.id, name:c.name, email:c.email, n:0 }).n++;
    });
    const rows = Object.keys(m).map(function(k){ return m[k]; }).sort(function(a, b){ return b.n - a.n; }).slice(0, 3);
    box.innerHTML = rows.map(function(c){
      return '<div class="ov-list-item">' + avatarHtml(c.name) + '<div class="t"><b>' + esc(c.name || c.email) + '</b><small>' + c.n + (c.n === 1 ? ' application' : ' applications') + ' this week</small></div>'
        + (c.id ? '<button type="button" class="btn btn-ghost btn-sm" onclick="openFaculty(' + c.id + ')">View</button>' : '') + '</div>';
    }).join('') || '<div class="ov-empty">No applications in the last 7 days.</div>';
  }

  if($s('panelOverview')){
    setupOverview();
    const _lo = window.loadOverview;
    window.loadOverview = async function(){
      setupOverview();
      const r = await _lo.apply(this, arguments);
      try{ addFifthCard(); }catch(e){}
      loadInsights();
      return r;
    };
  }
})();
