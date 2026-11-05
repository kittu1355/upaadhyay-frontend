/* my-jobs.js — faculty dashboard "My jobs": Applied jobs (status + the answers you gave) and Saved jobs.
   Saved ids: localStorage (upaadhyay_saved_jobs, same list the Save button on Browse jobs uses).
   Applied ids: account (currentUser.appliedIds) + the applications API (status, date, job details, answers). */
(function(){
'use strict';
var STATUS = {
  applied:['Applied','st-blue',0], pending:['Applied','st-blue',0], submitted:['Applied','st-blue',0], new:['Applied','st-blue',0],
  viewed:['Viewed by institution','st-gray',1], reviewed:['Viewed by institution','st-gray',1], reviewing:['Under review','st-gray',1], in_review:['Under review','st-gray',1],
  shortlisted:['Shortlisted','st-green',2], interview:['Interview','st-purple',3], interviewing:['Interview','st-purple',3], invited:['Invited','st-purple',3],
  offered:['Offer made','st-green',4], selected:['Selected','st-green',4], hired:['Hired','st-green',4], accepted:['Accepted','st-green',4],
  rejected:['Not selected','st-red',-1], declined:['Not selected','st-red',-1], withdrawn:['Withdrawn','st-gray',-1], closed:['Job closed','st-gray',-1]
};
var STEPS = ['Applied','Under review','Shortlisted','Interview','Offer'];
var S = { tab:'applied', applied:null, saved:null, loading:false };

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function savedIds(){ try{ return (JSON.parse(localStorage.getItem('upaadhyay_saved_jobs') || '[]') || []).map(String); }catch(e){ return []; } }
function appliedIds(){ try{ return (currentUser.appliedIds || []).map(String); }catch(e){ return []; } }
function when(d){ if(!d) return ''; var t = new Date(String(d).replace(' ', 'T')); if(isNaN(t)) return ''; return t.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
function list(r){ return Array.isArray(r) ? r : (r && Array.isArray(r.data) ? r.data : (r && r.data && Array.isArray(r.data.data) ? r.data.data : [])); }
function normAnswers(v){
  if(!v) return [];
  if(typeof v === 'string'){ try{ v = JSON.parse(v); }catch(e){ return []; } }
  if(!Array.isArray(v)) v = Object.keys(v).map(function(k){ return { q:k, a:v[k] }; });
  return v.map(function(x){ return { q:x.q || x.question || '', a:x.a || x.answer || '', mins:x.mins || x.minutes || '' }; }).filter(function(x){ return x.q || x.a; });
}
function localAnswers(id){ try{ return normAnswers((JSON.parse(localStorage.getItem('upaadhyay_app_answers') || '{}'))[id + ':me']); }catch(e){ return []; } }

/* job details: public job list first; if the job is closed/removed, use what the application itself carries */
async function jobById(id, fromApp){
  try{ var j = window.spGetJob ? await spGetJob(id) : null; if(j) return { id:String(id), title:j.title, org:j.inst, city:j.loc, type:j.type, sal:j.sal }; }catch(e){}
  var jb = fromApp || {}, co = jb.company || jb.employer || {};
  if(jb.title) return { id:String(id), title:jb.title, org:co.company_name || co.name || jb.company_name || '', city:jb.city || jb.location || '', type:jb.employment_type || '', sal:'', closed:true };
  return { id:String(id), title:'Job #' + id, org:'', city:'', type:'', sal:'', gone:true };
}
/* application per job id: status, date, job (if the API sends it), answers */
async function loadApps(){
  var map = {}, paths = ['/candidate/applications', '/applications'];
  for(var i = 0; i < paths.length; i++){
    try{
      var r = await api.get(paths[i] + '?per_page=100', { silent403:true, noAuthRedirect:true }), rows = list(r);
      if(rows.length || (r && (r.data || Array.isArray(r)))){
        rows.forEach(function(a){
          var jid = a.job_id || (a.job && a.job.id);
          if(jid != null) map[String(jid)] = { status:String(a.status || 'applied').toLowerCase(), at:a.applied_at || a.created_at || '', job:a.job || null,
            qa:normAnswers(a.answers || a.qa_answers || a.screening_answers || a.application_answers || a.responses || (a.meta && a.meta.answers)),
            iv:window.Interview ? Interview.norm(a.interview || a.interview_details || (a.meta && a.meta.interview)) : null };
        });
        break;
      }
    }catch(e){}
  }
  return map;
}
async function load(force){
  if(S.loading) return; if(!force && S.applied && S.saved) return; S.loading = true;
  var el = document.getElementById('mjBody'); if(el) el.innerHTML = '<div class="mj-empty">Loading…</div>';
  var apps = await loadApps(), ids = appliedIds();
  Object.keys(apps).forEach(function(k){ if(ids.indexOf(k) < 0) ids.push(k); });
  S.applied = (await Promise.all(ids.map(function(id){ return jobById(id, (apps[id] || {}).job); }))).map(function(j){
    var a = apps[j.id] || {}; j.status = a.status || 'applied'; j.at = a.at || ''; j.qa = (a.qa && a.qa.length) ? a.qa : localAnswers(j.id);
    j.iv = a.iv || (window.Interview ? Interview.getLocal(j.id, (window.api && api.user && api.user.id) || 'me') : null); return j;
  });
  S.saved = await Promise.all(savedIds().map(function(id){ return jobById(id); }));
  S.loading = false; paint();
}

function steps(level){
  if(level < 0) return '';
  return '<ol class="mj-steps">' + STEPS.map(function(n, i){ return '<li class="' + (i <= level ? 'done' : '') + '">' + n + '</li>'; }).join('') + '</ol>';
}
var CHEV = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function answersBlock(j){
  if(!j.qa || !j.qa.length) return '';
  return '<div class="mj-qa-wrap"><button type="button" class="mj-btn" data-qa="1"><span>My answers (' + j.qa.length + ')</span>' + CHEV + '</button><div class="mj-qa">' +
    j.qa.map(function(x, n){ return '<div class="mj-qa-item"><div class="mj-qa-q">' + (n + 1) + '. ' + esc(x.q) + (x.mins ? '<small>' + esc(x.mins) + ' min</small>' : '') + '</div><div class="mj-qa-a">' + esc(x.a) + '</div></div>'; }).join('') + '</div></div>';
}
function ivBlock(j){ return (j.iv && window.Interview) ? Interview.html(j.iv, { title:'Interview call from the institution' }) : ''; }
function card(j, kind){
  var st = STATUS[j.status] || [String(j.status || 'Applied').replace(/_/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }), 'st-blue', 0];
  var meta = [j.city, j.type, j.sal].filter(Boolean).map(function(m){ return '<span>' + esc(m) + '</span>'; }).join('');
  var isApplied = kind === 'applied', already = appliedIds().indexOf(j.id) > -1;
  if(isApplied && j.iv && st[2] >= 0 && st[2] < 3) st = STATUS.interview;   /* interview details exist -> show the Interview step */
  var btns = '';
  if(!j.gone) btns += '<a class="mj-btn" href="job-view.html?id=' + encodeURIComponent(j.id) + '">View job</a>';
  if(kind === 'saved'){
    btns += '<button type="button" class="mj-btn danger" data-unsave="' + esc(j.id) + '">Remove</button>';
    if(!j.gone) btns += already ? '<span class="mj-btn done">Applied ✓</span>' : '<button type="button" class="mj-btn pri" data-apply="' + esc(j.id) + '" data-title="' + esc(j.title) + '">Apply now</button>';
  }
  return '<article class="mj-card"><div class="mj-row"><div class="mj-main"><h4>' + esc(j.title) + '</h4>' + (j.org ? '<div class="mj-org">' + esc(j.org) + '</div>' : '') +
    (meta ? '<div class="mj-meta">' + meta + '</div>' : '') + (isApplied && j.at ? '<div class="mj-date">Applied on ' + esc(when(j.at)) + '</div>' : '') + '</div>' +
    '<div class="mj-side">' + (isApplied ? '<span class="mj-st ' + st[1] + '">' + esc(st[0]) + '</span>' : '') + '<div class="mj-btns">' + btns + '</div></div></div>' +
    (isApplied ? steps(st[2]) + ivBlock(j) + answersBlock(j) : '') + '</article>';
}
function paint(){
  var host = document.getElementById('upMyJobs'); if(!host) return;
  var a = S.applied || [], s = S.saved || [], rows = S.tab === 'applied' ? a : s;
  host.innerHTML = '<div class="mj"><h2>My jobs</h2><p class="mj-sub">Track your applications and keep the jobs you want to come back to.</p>' +
    '<div class="mj-tabs"><button type="button" data-tab="applied" class="' + (S.tab === 'applied' ? 'on' : '') + '">Applied jobs <b>' + a.length + '</b></button>' +
    '<button type="button" data-tab="saved" class="' + (S.tab === 'saved' ? 'on' : '') + '">Saved jobs <b>' + s.length + '</b></button></div><div id="mjBody">' +
    (rows.length ? rows.map(function(j){ return card(j, S.tab); }).join('') :
      '<div class="mj-empty">' + (S.tab === 'applied' ? 'You haven’t applied to any jobs yet. <a href="jobs.html">Browse jobs</a>' : 'No saved jobs yet. Tap Save on a job to keep it here.') + '</div>') + '</div></div>';
}
function bind(host){
  if(host._mj) return; host._mj = 1;
  host.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-tab],[data-unsave],[data-apply],[data-qa]'); if(!t) return;
    if(t.dataset.tab){ S.tab = t.dataset.tab; paint(); return; }
    if(t.dataset.qa){ var p = t.parentNode.querySelector('.mj-qa'), open = p.classList.toggle('open'); t.classList.toggle('open', open);
      t.querySelector('span').textContent = (open ? 'Hide' : 'My') + t.querySelector('span').textContent.replace(/^(My|Hide)/, ''); return; }
    if(t.dataset.unsave){ var id = t.dataset.unsave, a = savedIds().filter(function(x){ return x !== id; });
      try{ localStorage.setItem('upaadhyay_saved_jobs', JSON.stringify(a)); }catch(x){}
      S.saved = (S.saved || []).filter(function(j){ return j.id !== id; }); paint(); return; }
    if(t.dataset.apply && window.applyToJob){ Promise.resolve(applyToJob(t.dataset.apply, t.dataset.title)).then(function(){ load(true); }); }
  });
}
window.MyJobs = { open:function(host){ bind(host); S.applied = S.saved = null; paint(); load(true); } };
})();
