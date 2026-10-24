// admin/js/traffic.js — "Live traffic" dashboard tab.
// Visitor numbers come from GET /api/admin/analytics (fed by js/track.js on the public site).
// Faculty / applications / jobs / institutions "today" numbers come from the existing /api/admin/* lists.
// Nothing here is sample data. Refreshes every 10 s while the tab is open and visible.
(function(){
  /* ============ self-install: this ONE file adds the whole Live traffic tab (styles, panel, sidebar item, routing) ============ */
  const CSS = `/* traffic.css — Live traffic tab. Loaded after admin-theme.css. */
#panelTraffic .ov-head-r{align-items:center;flex-wrap:wrap}
#panelTraffic .ov-head-r select{height:34px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:#fff;font:inherit;font-size:13px;color:var(--ink)}
.tr-upd{color:var(--ink-faint);font-size:12px;margin-left:4px}
.tr-live{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:999px;background:#e6f6ee;color:#0b7a43;font-size:12.5px;font-weight:700}
.tr-live i,.tr-livecard .admin-stat-top .l::before{content:"";width:8px;height:8px;border-radius:50%;background:#12a05c;box-shadow:0 0 0 0 rgba(18,160,92,.55);animation:trPulse 1.8s infinite}
.tr-live i{display:inline-block}
.tr-live.off{background:#fdeceb;color:#b3261e}.tr-live.off i{background:#d63b2f;animation:none}
.tr-livecard .admin-stat-top .l::before{display:inline-block;margin-right:7px;vertical-align:middle}
@keyframes trPulse{0%{box-shadow:0 0 0 0 rgba(18,160,92,.5)}70%{box-shadow:0 0 0 9px rgba(18,160,92,0)}100%{box-shadow:0 0 0 0 rgba(18,160,92,0)}}
.tr-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px}
.tr-kpis .admin-stat{display:flex;flex-direction:column}
.tr-foot{padding:0 18px 14px;font-size:12px;color:var(--ink-soft);min-height:28px}
.tr-foot a{font-weight:600;cursor:pointer;color:var(--ink)}
.tr-d{font-weight:600;color:var(--ink-soft)}.tr-d.up{color:#0b7a43}.tr-d.down{color:#b3261e}
.tr-setup{display:flex;flex-direction:column;gap:4px;padding:12px 16px;margin-bottom:16px;border:1px solid #f1d49a;background:#fff7e6;color:#6b4a06;border-radius:10px;font-size:12.5px}
.tr-setup code{background:rgba(0,0,0,.06);padding:1px 5px;border-radius:4px;font-size:12px}
#panelTraffic .admin-panel{margin-bottom:0}
.tr-three,.tr-two{margin-top:16px}
.admin-two-col.tr-two{grid-template-columns:3fr 2fr}
.tr-bars{padding:6px 20px 14px}
.tr-bar{padding:8px 0}
.tr-bar-top{display:flex;justify-content:space-between;gap:10px;font-size:13px}
.tr-bar-top b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr-bar-top span{color:var(--ink-soft);font-weight:600;white-space:nowrap}
.tr-track{height:6px;border-radius:99px;background:#eef0f4;margin-top:6px;overflow:hidden}
.tr-track i{display:block;height:100%;border-radius:99px;background:#1a5cff;transition:width .4s}
.tr-bar small{color:var(--ink-faint);font-size:11.5px}
.tr-hours{padding:14px 20px 12px}
.tr-hbars{display:flex;align-items:flex-end;gap:3px;height:170px}
.tr-hb{flex:1;height:100%;display:flex;align-items:flex-end;background:linear-gradient(#f6f7fa,#f6f7fa) bottom/100% 1px no-repeat}
.tr-hb i{display:block;width:100%;border-radius:4px 4px 0 0;background:#9db8ff;transition:height .4s}
.tr-hb.now i{background:#1a5cff}.tr-hb.future i{background:#e3e7ef}
.tr-hlab{display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--ink-faint)}
.tr-feed{max-height:380px;overflow:auto}
.tr-feed .ov-list-item{padding:9px 20px}
.tr-ago{font-size:12px;color:var(--ink-faint);white-space:nowrap}
.tr-dot{width:9px;height:9px;border-radius:50%;background:#8b92a1;flex:none}
.tr-dot.mobile{background:#12a05c}.tr-dot.desktop{background:#1a5cff}.tr-dot.tablet{background:#c27a0a}
@media (max-width:1200px){.tr-kpis{grid-template-columns:repeat(2,1fr)}.admin-two-col.tr-two{grid-template-columns:1fr}}
@media (max-width:640px){.tr-kpis{grid-template-columns:1fr}}
`;
  if(!document.getElementById('trafficCss')){ const st = document.createElement('style'); st.id = 'trafficCss'; st.textContent = CSS; document.head.appendChild(st); }

  let root = document.getElementById('panelTraffic');
  if(!root){
    root = document.createElement('section'); root.id = 'panelTraffic'; root.hidden = true;
    const host = document.querySelector('main.admin-body') || document.querySelector('main');
    if(!host) return;
    const before = document.getElementById('panelInstitutions');
    if(before && before.parentNode === host) host.insertBefore(root, before); else host.appendChild(root);
  }
  try{
    if(typeof TABS !== 'undefined' && TABS.indexOf('traffic') < 0) TABS.splice(1, 0, 'traffic');
    if(typeof TITLES !== 'undefined') TITLES.traffic = 'Live traffic';
    if(typeof ADMIN_ICONS !== 'undefined' && !ADMIN_ICONS.traffic) ADMIN_ICONS.traffic = '<path d="M3 17l5-5 4 4 8-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h5v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    if(typeof ADMIN_NAV !== 'undefined' && !ADMIN_NAV.some(function(n){ return n[0] === 'traffic'; })) ADMIN_NAV.splice(1, 0, ['traffic', 'Live traffic', 'Dashboard']);
    // if the sidebar was already drawn, add the item now
    const nav = document.querySelector('.admin-nav');
    if(nav && !nav.querySelector('[data-tab="traffic"]')){
      const ov = nav.querySelector('[data-tab="overview"]');
      if(ov){ const b = ov.cloneNode(true); b.dataset.tab = 'traffic'; b.classList.remove('active'); b.removeAttribute('aria-current');
        b.querySelector('svg').innerHTML = ADMIN_ICONS.traffic; b.querySelector('span').textContent = 'Live traffic'; ov.insertAdjacentElement('afterend', b); }
    }
    // open the tab: run the real adminGo, then load our data
    if(typeof window.adminGo === 'function' && !window.adminGo.__traffic){
      const go = window.adminGo;
      window.adminGo = function(tab){ const r = go.apply(this, arguments); if(tab === 'traffic' && typeof window.load_traffic === 'function') window.load_traffic(); return r; };
      window.adminGo.__traffic = true;
    }
  }catch(e){ console.warn('[traffic] setup', e); }

  const POLL_MS = 10000, PLATFORM_MS = 60000;
  const ST = { range: 7, data: null, plat: null, platAt: 0, timer: null, busy: false, err: null, setup: false, built: false, updated: null };
  const $t = function(id){ return document.getElementById(id); };
  const fmt = function(n){ return (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('en-IN'); };
  const COL = { views: '#1a5cff', visitors: '#12a05c' };

  /* ------------------------------------------------------------ helpers */
  function pageLabel(p){
    p = String(p || '/');
    if(p === '/' || p === '') return 'Home';
    const seg = p.replace(/\?.*$/, '').replace(/\/+$/, '').split('/').pop().replace(/\.html$/, '').replace(/[-_]+/g, ' ');
    return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : p;
  }
  function ago(iso){
    const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if(s < 5) return 'just now'; if(s < 60) return s + 's ago';
    if(s < 3600) return Math.floor(s / 60) + 'm ago'; if(s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  function delta(now, before){
    if(before == null) return '';
    if(!before) return now ? '<span class="tr-d up">▲ new</span>' : '<span class="tr-d">— same as yesterday</span>';
    const p = Math.round((now - before) / before * 100);
    if(p === 0) return '<span class="tr-d">— same as yesterday</span>';
    return '<span class="tr-d ' + (p > 0 ? 'up' : 'down') + '">' + (p > 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs yesterday so far</span>';
  }

  /* ------------------------------------------------------------ skeleton */
  function build(){
    if(ST.built) return; ST.built = true;
    root.innerHTML =
      '<div class="ov-head"><div><h2>Live traffic</h2><p>Real visitors on the Upaadhyay website <span id="trUpdated" class="tr-upd"></span></p></div>'
      + '<div class="ov-head-r"><span class="tr-live" id="trLive"><i></i><span>Live</span></span>'
      + '<select id="trRange" aria-label="Range"><option value="1">Today</option><option value="7" selected>Last 7 days</option><option value="30">Last 30 days</option></select>'
      + '<button type="button" class="btn btn-ghost" id="trRefresh">Refresh</button></div></div>'
      + '<div id="trBanner"></div>'
      + '<div class="tr-kpis" id="trKpis"></div>'
      + '<div class="ov-row"><div class="admin-panel ov-chart"><div class="ov-chart-top"><h3>Visitors &amp; page views</h3><div class="ov-legend"><span><i style="background:' + COL.visitors + '"></i>Visitors</span><span><i style="background:' + COL.views + '"></i>Page views</span></div></div><div class="ov-chart-body" id="trDaily"><div class="ov-empty">Loading…</div></div></div>'
      + '<div class="admin-panel"><div class="admin-panel-head"><span>Today by hour</span></div><div class="tr-hours" id="trHours"><div class="ov-empty">Loading…</div></div></div></div>'
      + '<div class="admin-two-col three tr-three">'
      + '<div class="admin-panel"><div class="admin-panel-head"><span>Top pages</span></div><div id="trPages"></div></div>'
      + '<div class="admin-panel"><div class="admin-panel-head"><span>Traffic sources</span></div><div id="trRefs"></div></div>'
      + '<div class="admin-panel"><div class="admin-panel-head"><span>Devices</span></div><div id="trDev"></div></div></div>'
      + '<div class="admin-two-col tr-two">'
      + '<div class="admin-panel"><div class="admin-panel-head"><span>Live activity</span><span class="muted" id="trFeedNote"></span></div><div id="trFeed" class="tr-feed"></div></div>'
      + '<div class="admin-panel"><div class="admin-panel-head"><span>Countries</span></div><div id="trGeo"></div></div></div>';
    $t('trRange').addEventListener('change', function(){ ST.range = Number(this.value) || 7; load(true); });
    $t('trRefresh').addEventListener('click', function(){ ST.platAt = 0; load(true); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden && isOpen()) load(); });
  }
  const isOpen = function(){ return typeof S !== 'undefined' && S.tab === 'traffic'; };

  /* ------------------------------------------------------------ data */
  async function countToday(path, params, key){
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const keep = window.__sortOld; window.__sortOld = false;
    let n = 0;
    try{
      for(let page = 1; page <= 5; page++){
        const r = await api.get(path + qs(Object.assign({ page: page, per_page: 100 }, params || {})));
        const rows = (r && r.data) || [];
        rows.forEach(function(x){ if(new Date(x[key] || x.created_at) >= start) n++; });
        const last = rows[rows.length - 1];
        if(!rows.length || page >= ((r && r.last_page) || 1) || (last && new Date(last[key] || last.created_at) < start)) break;
      }
    }finally{ window.__sortOld = keep; }
    return n;
  }
  async function loadPlatform(){
    const jobs = [
      countToday('/admin/users', { role: 'candidate' }, 'created_at'),
      countToday('/admin/applications', {}, 'applied_at'),
      countToday('/admin/jobs', {}, 'created_at'),
      countToday('/admin/companies', {}, 'created_at')
    ];
    const r = await Promise.all(jobs.map(function(p){ return p.then(function(v){ return v; }, function(){ return null; }); }));
    ST.plat = { faculty: r[0], apps: r[1], jobs: r[2], inst: r[3] }; ST.platAt = Date.now();
  }

  /* Layout preview only: open admin/?tab=traffic&demo=1 . Never used unless demo=1 is in the URL. */
  function demoData(){
    const daily = [], now = new Date();
    for(let i = 29; i >= 0; i--){ const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); const v = 40 + Math.round(25 * Math.sin(i / 3)) + (i % 4) * 6;
      daily.push({ date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), visitors: v, views: v * 2 + 9 }); }
    const hourly = []; for(let h = 0; h <= now.getHours(); h++) hourly.push({ hour: h, views: Math.round(8 + 22 * Math.abs(Math.sin(h / 4))), visitors: 5 });
    return { live_now: 7, live_pages: [{ path: '/pages/jobs.html', count: 4 }], today: { visitors: 182, views: 436, sessions: 215, new_visitors: 97 }, yesterday_so_far: { visitors: 150, views: 390 },
      daily: daily, hourly: hourly,
      pages: [{ path: '/', views: 164, visitors: 120 }, { path: '/pages/jobs.html', views: 98, visitors: 71 }, { path: '/pages/register.html', views: 54, visitors: 40 }, { path: '/pages/for-faculty.html', views: 37, visitors: 30 }],
      referrers: [{ source: 'Direct', visitors: 88 }, { source: 'Google', visitors: 61 }, { source: 'WhatsApp', visitors: 24 }, { source: 'LinkedIn', visitors: 9 }],
      devices: [{ name: 'Mobile', count: 140 }, { name: 'Desktop', count: 68 }, { name: 'Tablet', count: 7 }],
      countries: [{ name: 'India', visitors: 170 }, { name: 'United States', visitors: 8 }, { name: 'UAE', visitors: 4 }],
      recent: [{ at: new Date(Date.now() - 6000).toISOString(), path: '/pages/jobs.html', device: 'Mobile', browser: 'Chrome', country: 'India', ref: 'Google' },
               { at: new Date(Date.now() - 41000).toISOString(), path: '/', device: 'Desktop', browser: 'Edge', country: 'India', ref: 'Direct' },
               { at: new Date(Date.now() - 95000).toISOString(), path: '/pages/register.html', device: 'Mobile', browser: 'Safari', country: 'India', ref: 'WhatsApp' }] };
  }
  async function loadTraffic(){
    if(new URLSearchParams(location.search).get('demo') === '1'){ ST.data = demoData(); ST.err = null; ST.setup = false; ST.updated = new Date(); return; }
    try{
      ST.data = await api.get('/admin/analytics' + qs({ range: ST.range }));
      ST.err = null; ST.setup = false; ST.updated = new Date();
    }catch(e){
      ST.data = null; ST.updated = null;
      ST.setup = (e && (e.status === 404 || e.status === 405));
      ST.err = e && e.message ? e.message : 'Could not load traffic.';
    }
  }
  async function load(force){
    if(ST.busy || !isOpen()) return; ST.busy = true; build();
    try{
      const jobs = [loadTraffic()];
      if(force || Date.now() - ST.platAt > PLATFORM_MS) jobs.push(loadPlatform());
      await Promise.all(jobs);
      render();
    }finally{ ST.busy = false; }
  }

  /* ------------------------------------------------------------ render */
  function render(){
    const d = ST.data, p = ST.plat || {};
    const live = $t('trLive'); if(!live) return;
    live.classList.toggle('off', !d);
    live.querySelector('span').textContent = d ? 'Live' : 'Offline';
    $t('trUpdated').textContent = ST.updated ? '· updated ' + ST.updated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

    // banner
    $t('trBanner').innerHTML = !d
      ? (ST.setup
        ? '<div class="tr-setup"><b>Waiting for the visitor-stats API.</b><span>This tab will fill in as soon as <code>GET /admin/analytics</code> is available. The platform cards below already use real data. Add <code>?tab=traffic&amp;demo=1</code> to the address to preview the layout with sample numbers.</span></div>'
        : '<div class="admin-error"><span>' + esc(ST.err || 'Could not load traffic.') + '</span><button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById(\'trRefresh\').click()">Retry</button></div>')
      : '';

    const t = (d && d.today) || {}, y = (d && d.yesterday_so_far) || {};
    const top = d && d.live_pages && d.live_pages[0];
    const card = function(cls, n, label, foot, cl){
      return '<div class="admin-stat ' + cls + (cl ? ' ' + cl : '') + '"><div class="admin-stat-top"><div class="n">' + n + '</div><div class="l">' + label + '</div></div><div class="tr-foot">' + (foot || '&nbsp;') + '</div></div>';
    };
    $t('trKpis').innerHTML =
      card('c2', d ? fmt(d.live_now) : '—', 'Online now', d ? (top ? 'Most on <b>' + esc(pageLabel(top.path)) + '</b> (' + top.count + ')' : 'Nobody on the site right now') : '', 'tr-livecard')
      + card('c3', d ? fmt(t.visitors) : '—', 'Visitors today', d ? delta(t.visitors, y.visitors) : '')
      + card('c1', d ? fmt(t.views) : '—', 'Page views today', d ? (t.sessions ? (t.views / t.sessions).toFixed(1) + ' pages / visit' : '') : '')
      + card('c5', d ? fmt(t.new_visitors) : '—', 'New visitors today', d && t.visitors ? Math.round((t.new_visitors || 0) / t.visitors * 100) + '% of visitors' : '')
      + card('c4', fmt(p.faculty), 'Faculty signed up today', '<a onclick="adminGo(\'faculty\')">View faculty →</a>')
      + card('c3', fmt(p.apps), 'Applications today', '<a onclick="adminGo(\'applications\')">View applications →</a>')
      + card('c2', fmt(p.jobs), 'Jobs posted today', '<a onclick="adminGo(\'jobs\')">View jobs →</a>')
      + card('c1', fmt(p.inst), 'Institutions registered today', '<a onclick="adminGo(\'institutions\',\'pending\')">Review queue →</a>');

    const none = function(msg){ return '<div class="ov-empty">' + esc(msg) + '</div>'; };
    if(!d){
      ['trDaily', 'trHours', 'trPages', 'trRefs', 'trDev', 'trFeed', 'trGeo'].forEach(function(id){ $t(id).innerHTML = none(ST.setup ? 'Waiting for the analytics endpoint.' : 'No data.'); });
      $t('trFeedNote').textContent = ''; return;
    }
    drawDaily(d.daily || []);
    drawHours(d.hourly || []);
    $t('trPages').innerHTML = bars((d.pages || []).map(function(x){ return { l: pageLabel(x.path), s: x.path, v: x.views, n: x.visitors + ' visitors' }; }), 'views', 'No page views in this range yet.');
    $t('trRefs').innerHTML = bars((d.referrers || []).map(function(x){ return { l: x.source, v: x.visitors, n: '' }; }), 'visitors', 'No visits in this range yet.');
    $t('trDev').innerHTML = bars((d.devices || []).map(function(x){ return { l: x.name, v: x.count, n: '' }; }), 'visits', 'No visits in this range yet.', true);
    $t('trGeo').innerHTML = bars((d.countries || []).map(function(x){ return { l: x.name, v: x.visitors, n: '' }; }), 'visitors', 'Country is not available yet. Put the API behind Cloudflare (or add GeoIP) to see it.');
    const rec = d.recent || [];
    $t('trFeedNote').textContent = rec.length ? 'last ' + rec.length + ' page views' : '';
    $t('trFeed').innerHTML = rec.map(function(x){
      return '<div class="ov-list-item"><span class="tr-dot ' + esc(String(x.device || '').toLowerCase()) + '"></span><div class="t"><b title="' + esc(x.path) + '">' + esc(pageLabel(x.path)) + '</b><small>'
        + esc([x.device, x.browser, x.country, x.ref && x.ref !== 'Direct' ? 'from ' + x.ref : 'Direct'].filter(Boolean).join(' · ')) + '</small></div><span class="tr-ago">' + esc(ago(x.at)) + '</span></div>';
    }).join('') || none('No visits recorded yet. Open the public site in another tab and it will appear here within seconds.');
  }

  function bars(rows, unit, empty, pct){
    if(!rows.length) return '<div class="ov-empty">' + esc(empty) + '</div>';
    const max = Math.max.apply(null, rows.map(function(r){ return r.v; })) || 1, tot = rows.reduce(function(s, r){ return s + r.v; }, 0) || 1;
    return '<div class="tr-bars">' + rows.map(function(r){
      return '<div class="tr-bar" title="' + esc(r.s || r.l) + '"><div class="tr-bar-top"><b>' + esc(r.l) + '</b><span>' + fmt(r.v) + (pct ? ' · ' + Math.round(r.v / tot * 100) + '%' : '') + '</span></div>'
        + '<div class="tr-track"><i style="width:' + Math.max(3, Math.round(r.v / max * 100)) + '%"></i></div>' + (r.n ? '<small>' + esc(r.n) + '</small>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function drawHours(h){
    const box = $t('trHours'), vals = [], now = new Date().getHours();
    for(let i = 0; i < 24; i++) vals.push(0);
    h.forEach(function(x){ if(x.hour >= 0 && x.hour < 24) vals[x.hour] = x.views || 0; });
    const max = Math.max(4, Math.max.apply(null, vals));
    box.innerHTML = '<div class="tr-hbars">' + vals.map(function(v, i){
      return '<div class="tr-hb' + (i === now ? ' now' : '') + (i > now ? ' future' : '') + '" title="' + (i % 12 || 12) + (i < 12 ? ' am' : ' pm') + ' · ' + v + ' views"><i style="height:' + Math.max(v ? 4 : 0, Math.round(v / max * 100)) + '%"></i></div>';
    }).join('') + '</div><div class="tr-hlab"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>11 pm</span></div>';
  }

  function drawDaily(all){
    const box = $t('trDaily'), n = ST.range === 30 ? 30 : 7, days = all.slice(-n);
    if(!days.length){ box.innerHTML = '<div class="ov-empty">No data yet.</div>'; return; }
    const W = 640, H = 230, L = 38, R = 26, T = 16, B = 30, k = days.length;
    const mx = Math.max(4, Math.max.apply(null, days.map(function(x){ return Math.max(x.views || 0, x.visitors || 0); })));
    const top = mx <= 4 ? 4 : Math.ceil(mx / 4) * 4, X = function(i){ return L + (k === 1 ? 0 : i * (W - L - R) / (k - 1)); }, Y = function(v){ return T + (1 - v / top) * (H - T - B); };
    const path = function(vals){
      const pt = vals.map(function(v, i){ return [X(i), Y(v)]; }); let d = 'M' + pt[0][0] + ',' + pt[0][1];
      for(let i = 0; i < pt.length - 1; i++){
        const p0 = pt[i - 1] || pt[i], p1 = pt[i], p2 = pt[i + 1], p3 = pt[i + 2] || p2;
        d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6) + ',' + Math.min(H - B, Math.max(T, p1[1] + (p2[1] - p0[1]) / 6)) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6) + ',' + Math.min(H - B, Math.max(T, p2[1] - (p3[1] - p1[1]) / 6)) + ' ' + p2[0] + ',' + p2[1];
      }
      return d;
    };
    let g = '';
    for(let i = 0; i <= 4; i++){ const v = top / 4 * i, y = Y(v); g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#eef0f4"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#8b92a1">' + v + '</text>'; }
    const step = k <= 7 ? 1 : 5, lab = function(s){ return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); };
    days.forEach(function(x, i){ if(i % step === 0 || i === k - 1) g += '<text x="' + X(i) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="11" fill="#8b92a1">' + lab(x.date) + '</text>'; });
    const cw = (W - L - R) / (k - 1 || 1);
    const cols = days.map(function(x, i){ return '<rect data-i="' + i + '" x="' + (X(i) - cw / 2) + '" y="' + T + '" width="' + cw + '" height="' + (H - T - B) + '" fill="transparent"/>'; }).join('');
    const area = path(days.map(function(x){ return x.visitors || 0; })) + ' L' + X(k - 1) + ',' + Y(0) + ' L' + X(0) + ',' + Y(0) + ' Z';
    box.innerHTML = '<div class="ov-svgwrap" style="position:relative"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Visitors and page views per day">' + g
      + '<path d="' + area + '" fill="' + COL.visitors + '" opacity=".08"/>'
      + '<path d="' + path(days.map(function(x){ return x.views || 0; })) + '" fill="none" stroke="' + COL.views + '" stroke-width="2.4" stroke-linecap="round"/>'
      + '<path d="' + path(days.map(function(x){ return x.visitors || 0; })) + '" fill="none" stroke="' + COL.visitors + '" stroke-width="2.4" stroke-linecap="round"/>'
      + '<circle id="trDot" r="4.5" fill="#1a5cff" stroke="#fff" stroke-width="2" style="display:none"/>' + cols + '</svg><div class="ov-tip" id="trTip"></div></div>';
    const tip = $t('trTip'), dot = $t('trDot');
    box.querySelectorAll('rect[data-i]').forEach(function(r){
      r.addEventListener('mouseenter', function(){
        const x = days[Number(r.dataset.i)], px = X(Number(r.dataset.i)), py = Y(Math.max(x.views || 0, x.visitors || 0));
        dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.style.display = '';
        tip.innerHTML = lab(x.date) + ' · ' + fmt(x.visitors) + ' visitors · ' + fmt(x.views) + ' views';
        tip.style.left = (px / W * 100) + '%'; tip.style.top = (py / H * 100) + '%'; tip.style.display = 'block';
      });
      r.addEventListener('mouseleave', function(){ tip.style.display = 'none'; dot.style.display = 'none'; });
    });
  }

  /* ------------------------------------------------------------ polling */
  function tick(){ if(isOpen() && !document.hidden) load(); }
  ST.timer = setInterval(tick, POLL_MS);
  window.load_traffic = function(){ build(); load(true); };
  window.addEventListener('beforeunload', function(){ clearInterval(ST.timer); });
})();
