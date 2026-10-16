/* profile-card.js — one place that reads every role's profile data (main institution, sub-branch, faculty),
   builds the profile card, and keeps it in sync. Anything that changes the data (saveState, institution save,
   sub-branch dashboard, another tab) refreshes every card on the page — no reload needed.
   Load AFTER store.js and BEFORE auth.js / sidebar.js. */
(function(){
  var KEYS = ['upadyay_state_v1','upadyay_inst_v1','nwSub','nwProfile','nwLogos','nwJobs','upaadhyay_session'];
  var subs = [], lastSig = '', timer = null;

  function ls(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
  function sum(a, fn){ return (a || []).reduce(function(t, x){ return t + (+fn(x) || 0); }, 0); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function initials(n){ return String(n || '?').replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map(function(w){ return w[0] || ''; }).join('').toUpperCase() || '?'; }
  function role(){ return (typeof currentRole !== 'undefined' && currentRole) || 'seeker'; }

  /* ---------- data per role ---------- */
  function company(){
    var I = ls('upadyay_inst_v1') || {}, d = I.d || {}, C = currentCompany || {}, sv = ls('nwSub') || {};
    var jobs = Object.keys(postedJobs || {}).map(function(k){ return postedJobs[k]; });
    var approved = String(C.verification || '').toLowerCase() === 'approved';
    var pct = (window.IN && IN.completion) ? IN.completion() : (I.pc || 0);
    var badge = approved ? ['Verified', 'ok'] : (I.vs === 'changes' ? ['Info needed', 'warn'] : ['Pending verification', 'wait']);
    var hint = !d.logo ? 'Add your institution logo' : !approved ? 'Finish verification to unlock jobs' : pct < 100 ? 'Complete your profile' : 'Looking great!';
    var rep = [d.rname || C.contactName, d.rdes || C.designation].filter(Boolean).join(', ');
    return { role:'company', name:d.name || C.name || 'Your institution', sub:[d.type || C.type, d.city || C.city].filter(Boolean).join(' \u00b7 '),
      logo:d.logo || C.logo || '', badge:badge, pct:pct, hint:hint, approved:approved, editLabel:'Edit institution details',
      stats:[[1 + (I.branches || []).length, 'Campuses'], [sv.st === 'approved' ? 1 : 0, 'Sub-branches'], [jobs.length, 'Open jobs'],
             [sum(jobs, function(j){ return (j.applicantIds || []).length; }), 'Applicants']],
      pending:(window.__sbPending != null ? window.__sbPending : (sv.st === 'pending' ? 1 : 0)), rows:[['Representative', rep]] };
  }
  function branch(){
    var sv = ls('nwSub') || {}, pr = ls('nwProfile') || {}, lg = ls('nwLogos') || {}, sb = sv.sub || {}, d = pr.d || {};
    var name = d.name || sb.n || 'Your sub-branch', st = sv.st || 'draft';
    var map = { approved:['Linked to main', 'ok'], pending:['Awaiting main approval', 'wait'], rejected:['Rejected', 'bad'], draft:['Not submitted', 'wait'] };
    var f = ['name','type','city','state','pin','addr','rname','rdes','rem','rph'], n = f.filter(function(k){ return d[k]; }).length + ((lg && lg[name]) ? 1 : 0);
    var pct = Math.round(n / (f.length + 1) * 100);
    var j = ls('nwJobs'); j = Array.isArray(j) ? j : (j && typeof j === 'object' ? Object.keys(j).map(function(k){ return j[k]; }) : []);
    var hint = st === 'rejected' ? (sv.reason ? 'Reason: ' + sv.reason : 'Fix the details and resubmit') : st === 'approved' ? (pct < 100 ? 'Complete your branch profile' : 'Looking great!') : st === 'pending' ? 'Jobs unlock once approved' : 'Submit your branch for approval';
    return { role:'branch', name:name, sub:[d.type || sb.t, d.city ? [d.city, d.state].filter(Boolean).join(', ') : sb.c].filter(Boolean).join(' \u00b7 '),
      logo:(lg && lg[name]) || '', badge:map[st] || map.draft, pct:pct, hint:hint, approved:st === 'approved', editLabel:'Edit branch profile',
      stats:[[j.length, 'Jobs'], [sum(j, function(x){ return x.applicants != null ? x.applicants : (x.applicantIds || []).length; }), 'Applicants']],
      rows:[['Main institution', [sv.mainName, sv.mainCode ? 'Code ' + sv.mainCode : ''].filter(Boolean).join(' \u00b7 ')]] };
  }
  function faculty(){
    var U = currentUser || {}, fp = U.fp || {}, files = fp.files || {}, saved = !!fp.savedAt;
    var req = [!!(fp.first && fp.last && fp.dob), !!(U.email && U.phone), !!fp.high, !!fp.desig, !!(fp.subjects && fp.subjects.length)];
    var rec = [!!(files.resume||files.resume2||files.resume3||files.resume4||files.resume5), !!(fp.jobs && fp.jobs.length), !!(fp.links && fp.links.length), Object.keys(files).some(function(k){ return !/^resume[2-5]?$/.test(k); })];
    var hints = ['Add personal details','Add contact details','Add your highest qualification','Add your designation','Add subject specialization','Upload your resume','Add employment history','Add professional links','Upload a certificate'];
    var all = req.concat(rec), nx = all.indexOf(false);
    var pct = saved ? Math.min(100, req.filter(Boolean).length * 16 + rec.filter(Boolean).length * 5) : 0;
    var yrs = parseFloat(U.experience), loc = [fp.city || U.city, fp.state || U.state].filter(Boolean).join(', ');
    return { role:'seeker', name:U.name || 'Your name', sub:fp.headline || fp.desig || U.currentDesignation || U.qualification || 'Add your designation',
      logo:(typeof avatarForRole === 'function' ? avatarForRole() : '') || '', badge:null, pct:pct, hint:saved ? (nx === -1 ? 'Looking great!' : hints[nx]) : 'Save your profile to start',
      editLabel:'Edit profile', stats:[[(U.appliedIds || []).length, 'Applied']],
      rows:[['Location', loc], ['Experience', isFinite(yrs) ? (yrs > 0 ? yrs + ' yr' : 'Fresher') : '']] };
  }
  function data(r){ r = r || role(); return r === 'company' ? company() : r === 'branch' ? branch() : faculty(); }

  /* ---------- markup ---------- */
  function html(c, o){
    o = o || {};
    var av = c.logo ? '<img src="' + esc(c.logo) + '" alt="">' : '<span>' + esc(initials(c.name)) + '</span>';
    var rows = (c.rows || []).filter(function(r){ return r[1]; }).map(function(r){ return '<div class="upc-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
    var stats = (c.stats || []).map(function(s){ return '<div><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('');
    return '<div class="upc' + (o.compact ? ' upc-compact' : '') + '">'
      + (o.noHead ? '' : '<div class="upc-top"><div class="upc-av">' + av + '</div><div class="upc-id"><b>' + esc(c.name) + '</b><span>' + esc(c.sub) + '</span></div></div>')
      + (c.badge ? '<span class="upc-badge ' + c.badge[1] + '">' + esc(c.badge[0]) + '</span>' : '')
      + (o.noBar ? '' : '<div class="upc-bar" role="progressbar" aria-valuenow="' + c.pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + c.pct + '%"></i></div><small class="upc-hint"><b>' + c.pct + '%</b> \u00b7 ' + esc(c.hint) + '</small>')
      + (stats ? '<div class="upc-stats">' + stats + '</div>' : '') + (o.noRows ? '' : rows) + '</div>';
  }

  /* extra block inside the existing slide-in profile panel (layout.js) */
  /* Institution details (main + sub-branch) and Profile details (faculty) are dropdowns; open/closed is remembered */
  function ddState(){ try{ return JSON.parse(localStorage.getItem('upMiniDD')) || {}; }catch(e){ return {}; } }
  function enhanceMini(){
    var st = ddState();
    [['miniCompanySection','co'], ['miniBranchSection','br'], ['miniSeekerSection','sk']].forEach(function(x){
      var sec = document.getElementById(x[0]); if(!sec) return;
      var head = sec.querySelector('.mini-section-head');
      if(x[1] === 'sk' && !head){
        head = document.createElement('div'); head.className = 'mini-section-head'; head.innerHTML = '<h4>Profile details</h4>';
        sec.insertBefore(head, document.getElementById('miniRows'));
      }
      if(!head || head.__dd) return; head.__dd = 1;
      head.classList.add('mini-dd'); head.setAttribute('role', 'button'); head.tabIndex = 0;
      sec.classList.add('mini-dd-wrap'); sec.classList.toggle('dd-open', !!st[x[1]]); head.setAttribute('aria-expanded', !!st[x[1]]);
      var tog = function(){
        var o = !sec.classList.contains('dd-open'); sec.classList.toggle('dd-open', o); head.setAttribute('aria-expanded', o);
        var s2 = ddState(); s2[x[1]] = o; try{ localStorage.setItem('upMiniDD', JSON.stringify(s2)); }catch(e){}
      };
      head.addEventListener('click', tog);
      head.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tog(); } });
    });
  }

  function mountMini(){
    var p = document.getElementById('miniPanel'); if(!p) return;
    enhanceMini();
    var box = document.getElementById('miniUpCard');
    if(!box){ var head = p.querySelector('.mini-head'); if(!head) return; box = document.createElement('div'); box.id = 'miniUpCard'; head.parentNode.insertBefore(box, head.nextSibling); }
    var r = role();
    if(r === 'admin'){ box.innerHTML = ''; return; }
    /* faculty already has the strength meter in the panel — only add the live counts there */
    box.innerHTML = html(data(r), { compact:true, noHead:true, noBar:r === 'seeker', noRows:true });
  }

  /* ---------- auto-update ---------- */
  function hash(s){ var h = 5381; for(var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; }
  function ctx(){ var x = ''; try{ if(typeof S === 'object' && S) x += S.role + S.sd + S.st; }catch(e){} try{ x += sessionStorage.getItem('upadyay_emp_tab') || ''; }catch(e){} return x; }
  function sig(){ var s = role() + '|' + ctx(); KEYS.forEach(function(k){ var v = ''; try{ v = localStorage.getItem(k) || ''; }catch(e){} s += '|' + v.length + ':' + hash(v); }); return s; }
  function fire(){
    subs.forEach(function(fn){ try{ fn(); }catch(e){ console.warn('profile-card subscriber', e); } });
    var p = document.getElementById('miniPanel');
    if(p && p.classList.contains('open') && typeof refreshMiniProfile === 'function'){ try{ refreshMiniProfile(); }catch(e){} }
  }
  function check(){ var s = sig(); if(s !== lastSig){ lastSig = s; fire(); } }
  function ping(){ clearTimeout(timer); timer = setTimeout(function(){ lastSig = sig(); fire(); }, 30); }   /* force a refresh now */
  function onChange(fn){ subs.push(fn); }

  /* any saveState() call (profile, jobs, company, applications) refreshes the cards at once */
  if(typeof saveState === 'function' && !saveState.__upc){
    var _save = saveState;
    window.saveState = function(){ var r = _save.apply(this, arguments); ping(); return r; };
    window.saveState.__upc = 1;
  }
  window.addEventListener('storage', function(e){ if(!e.key || KEYS.indexOf(e.key) > -1) ping(); });   /* edits from another tab */
  window.addEventListener('upProfileChanged', ping);                                                    /* manual hook */
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) check(); });
  setInterval(function(){ if(!document.hidden) check(); }, 1500);                                       /* same-tab writes to localStorage */

  window.UpCard = { data:data, html:html, mountMini:mountMini, onChange:onChange, ping:ping, check:check, esc:esc, role:role };
})();
