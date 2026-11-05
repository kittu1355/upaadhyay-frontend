/* my-jobs.js — faculty dashboard "My jobs": Applied jobs (with application status) and Saved jobs in one sidebar page.
   Saved ids live in localStorage (upaadhyay_saved_jobs, same list the Save button on Browse jobs uses).
   Applied ids come from the account (currentUser.appliedIds) and, when the API provides it, the faculty's applications list with status. */
(function(){
'use strict';
var STATUS = {
  applied:['Applied','st-blue'], pending:['Applied','st-blue'], submitted:['Applied','st-blue'], new:['Applied','st-blue'],
  viewed:['Viewed by institution','st-gray'], reviewed:['Viewed by institution','st-gray'], reviewing:['Under review','st-gray'], in_review:['Under review','st-gray'],
  shortlisted:['Shortlisted','st-green'], interview:['Interview','st-purple'], interviewing:['Interview','st-purple'], invited:['Invited','st-purple'],
  offered:['Offer made','st-green'], hired:['Hired','st-green'], accepted:['Accepted','st-green'],
  rejected:['Not selected','st-red'], declined:['Not selected','st-red'], withdrawn:['Withdrawn','st-gray'], closed:['Job closed','st-gray']
};
var S = { tab:'applied', applied:null, saved:null, loading:false };
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function savedIds(){ try{ return (JSON.parse(localStorage.getItem('upaadhyay_saved_jobs') || '[]') || []).map(String); }catch(e){ return []; } }
function appliedIds(){ try{ return (currentUser.appliedIds || []).map(String); }catch(e){ return []; } }
function when(d){ if(!d) return ''; var t = new Date(d); if(isNaN(t)) return ''; return t.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
function list(r){ return Array.isArray(r) ? r : (r && Array.isArray(r.data) ? r.data : (r && r.data && Array.isArray(r.data.data) ? r.data.data : [])); }

async function jobById(id){
  try{ var j = window.spGetJob ? await spGetJob(id) : null; if(j) return { id:String(id), title:j.title, org:j.inst, city:j.loc, type:j.type, sal:j.sal, raw:j.raw || {} }; }catch(e){}
  return { id:String(id), title:'Job #' + id, org:'', city:'', type:'', sal:'', raw:{}, gone:true };
}
/* application status per job id — from the API when it answers, else just "Applied" */
async function loadApps(){
  var map = {}, paths = ['/candidate/applications', '/applications'];
  for(var i = 0; i < paths.length; i++){
    try{
      var r = await api.get(paths[i] + '?per_page=100', { silent403:true, noAuthRedirect:true }), rows = list(r);
      if(rows.length || (r && (r.data || Array.isArray(r)))){ rows.forEach(function(a){ var jid = a.job_id || (a.job && a.job.id); if(jid != null) map[String(jid)] = { status:String(a.status || 'applied').toLowerCase(), at:a.applied_at || a.created_at || '' }; }); break; }
    }catch(e){}
  }
  return map;
}
async function load(force){
  if(S.loading) return; if(!force && S.applied && S.saved) return; S.loading = true;
  var el = document.getElementById('mjBody'); if(el) el.innerHTML = '<div class="mj-empty">Loading…</div>';
  var apps = await loadApps(), ids = appliedIds();
  Object.keys(apps).forEach(function(k){ if(ids.indexOf(k) < 0) ids.push(k); });
  S.applied = (await Promise.all(ids.map(jobById))).map(function(j, i){ var a = apps[j.id] || {}; j.status = a.status || 'applied'; j.at = a.at || ''; return j; });
  S.saved = await Promise.all(savedIds().map(jobById));
  S.loading = false; paint();
}
function card(j, kind){
  var st = STATUS[j.status] || [String(j.status || 'Applied').replace(/_/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }), 'st-blue'];
  var meta = [j.city, j.type, j.sal].filter(Boolean).map(function(m){ return '<span>' + esc(m) + '</span>'; }).join('');
  return '<article class="mj-card"><div class="mj-main"><h4>' + esc(j.title) + '</h4>' + (j.org ? '<div class="mj-org">' + esc(j.org) + '</div>' : '') + (meta ? '<div class="mj-meta">' + meta + '</div>' : '') +
    (kind === 'applied' && j.at ? '<div class="mj-date">Applied on ' + esc(when(j.at)) + '</div>' : '') + '</div>' +
    '<div class="mj-side">' + (kind === 'applied' ? '<span class="mj-st ' + st[1] + '">' + esc(st[0]) + '</span>' : '') +
    '<div class="mj-btns">' + (kind === 'saved' ? '<button type="button" class="mj-btn" data-unsave="' + esc(j.id) + '">Remove</button>' : '') +
    (j.gone ? '' : '<a class="mj-btn" href="job-view.html?id=' + encodeURIComponent(j.id) + '">View</a>') +
    (kind === 'saved' && !j.gone ? (appliedIds().indexOf(j.id) > -1 ? '<span class="mj-btn done">Applied ✓</span>' : '<button type="button" class="mj-btn pri" data-apply="' + esc(j.id) + '" data-title="' + esc(j.title) + '">Apply now</button>') : '') + '</div></div></article>';
}
function paint(){
  var host = document.getElementById('upMyJobs'); if(!host) return;
  var a = S.applied || [], s = S.saved || [], rows = S.tab === 'applied' ? a : s;
  host.innerHTML = '<div class="mj"><h2>My jobs</h2><div class="mj-tabs"><button type="button" data-tab="applied" class="' + (S.tab === 'applied' ? 'on' : '') + '">Applied jobs <b>' + a.length + '</b></button>' +
    '<button type="button" data-tab="saved" class="' + (S.tab === 'saved' ? 'on' : '') + '">Saved jobs <b>' + s.length + '</b></button></div><div id="mjBody">' +
    (rows.length ? rows.map(function(j){ return card(j, S.tab); }).join('') :
      '<div class="mj-empty">' + (S.tab === 'applied' ? 'You haven’t applied to any jobs yet.' : 'No saved jobs yet. Tap Save on a job to keep it here.') + '</div>') + '</div></div>';
}
function bind(host){
  if(host._mj) return; host._mj = 1;
  host.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-tab],[data-unsave],[data-apply]'); if(!t) return;
    if(t.dataset.tab){ S.tab = t.dataset.tab; paint(); return; }
    if(t.dataset.unsave){ var id = t.dataset.unsave, a = savedIds().filter(function(x){ return x !== id; });
      try{ localStorage.setItem('upaadhyay_saved_jobs', JSON.stringify(a)); }catch(x){}
      S.saved = (S.saved || []).filter(function(j){ return j.id !== id; }); paint(); return; }
    if(t.dataset.apply && window.applyToJob){ Promise.resolve(applyToJob(t.dataset.apply, t.dataset.title)).then(function(){ load(true); }); }
  });
}
window.MyJobs = { open:function(host){ bind(host); S.applied = S.saved = null; paint(); load(true); } };
})();
