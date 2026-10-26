/* ==========================================================================
   backend.js — connects the existing UI to the Laravel API (no more demo data).
   Load AFTER layout.js on every page that uses store.js (see README).

   What lives here:
     - profile load/save   (candidate: /candidate/profile, company: /company/profile)
     - public jobs         (/jobs, /jobs/{id}, /categories, /institutions)
     - apply               (/jobs/{id}/apply)
     - employer side       (/company/jobs, /company/applicants, /company/candidates,
                            /company/invitations, /company/messages, application status)
     - notifications       (/notifications)
   Everything goes through window.api (js/api.js), which adds the Sanctum token.
   ========================================================================== */
(function(){
  'use strict';
  if(typeof api === 'undefined' || typeof saveState !== 'function') return;

  const COLORS = ['var(--blue-700)','var(--green)','#7C3AED','#B45309','#BE123C','#0F766E','#4338CA'];
  const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCc+PHJlY3Qgd2lkdGg9JzI0JyBoZWlnaHQ9JzI0JyBmaWxsPScjRUVGMkY3Jy8+PGcgZmlsbD0nbm9uZScgc3Ryb2tlPScjOTRBM0I4JyBzdHJva2Utd2lkdGg9JzEuNSc+PGNpcmNsZSBjeD0nMTInIGN5PSc5JyByPSczLjUnLz48cGF0aCBkPSdNNSAyMGMwLTMuNSAzLTUuNSA3LTUuNXM3IDIgNyA1LjUnLz48L2c+PC9zdmc+';

  /* ---------------- small helpers ---------------- */
  function esc(x){ return String(x == null ? '' : x).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function origin(){ return api.BASE.replace(/\/api$/, ''); }
  function fileUrl(p){ if(!p) return ''; if(/^(https?:|data:)/.test(p)) return p; return origin() + '/' + String(p).replace(/^\/+/, ''); }
  function splitList(s){ return String(s || '').split(/[,;\n]/).map(function(x){ return x.trim(); }).filter(Boolean); }
  function inr(n){ return '₹' + Number(n).toLocaleString('en-IN'); }
  function initials(name){ return String(name || '??').trim().split(/\s+/).slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase() || '??'; }
  function daysSince(d){ return d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5)) : 0; }
  function daysUntil(d){ if(!d) return null; const end = new Date(String(d).slice(0, 10) + 'T23:59:59'); /* date-only deadline = end of that day, local time */ return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 864e5)); }
  function items(res){ return Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []); }
  function qs(o){ const p = new URLSearchParams(); Object.keys(o || {}).forEach(function(k){ if(o[k] !== '' && o[k] != null) p.set(k, o[k]); }); const s = p.toString(); return s ? '?' + s : ''; }
  async function paged(path, params, maxPages){
    let out = [], page = 1, last = 1;
    do{
      const r = await api.get(path + qs(Object.assign({ per_page: 50, page: page }, params || {})), { silent403: true, noAuthRedirect: !api.hasToken() });
      out = out.concat(items(r));
      last = (r && (r.last_page || (r.meta && r.meta.last_page))) || 1; page++;
    }while(page <= last && page <= (maxPages || 5));
    return out;
  }
  function stripHeavy(obj){          // never push base64 images / huge blobs into JSON columns
    return JSON.parse(JSON.stringify(obj, function(k, v){ return (typeof v === 'string' && v.indexOf('data:') === 0 && v.length > 500) ? '' : v; }));
  }

  /* ---------------- save status pill (Saving… / Saved / Not saved + Retry) ---------------- */
  let _stEl = null, _stT = null, _retry = null;
  function status(state, msg, retry){
    if(!document.body) return;
    if(!_stEl){
      _stEl = document.createElement('div'); _stEl.id = 'bkSaveStatus'; _stEl.setAttribute('role', 'status');
      _stEl.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99998;padding:8px 14px;border-radius:999px;font:600 13px/1.3 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.18);max-width:min(92vw,420px);display:none;cursor:default;';
      _stEl.addEventListener('click', function(){ if(_retry){ const r = _retry; _retry = null; r(); } });
      document.body.appendChild(_stEl);
    }
    clearTimeout(_stT); _retry = retry || null;
    const C = { saving: ['#0B1F45', '#fff', '⏳ '], saved: ['#0F766E', '#fff', '✓ '], error: ['#B91C1C', '#fff', '⚠ '] }[state];
    _stEl.style.background = C[0]; _stEl.style.color = C[1]; _stEl.style.cursor = retry ? 'pointer' : 'default';
    _stEl.textContent = C[2] + msg + (retry ? ' — tap to retry' : ''); _stEl.style.display = 'block';
    if(state === 'saved') _stT = setTimeout(function(){ _stEl.style.display = 'none'; }, 2200);
  }
  window.bkStatus = status;

  /* ---------------- upload limits (same numbers the backend enforces: GET /limits) ---------------- */
  const LIMIT_FALLBACK = { categories: {
    profile_photo: { mimes: ['jpg','jpeg','png','webp'], max_kb: 2048 }, company_logo: { mimes: ['jpg','jpeg','png','webp'], max_kb: 2048 },
    job_image: { mimes: ['jpg','jpeg','png','webp'], max_kb: 4096 }, resume: { mimes: ['pdf','doc','docx'], max_kb: 5120 },
    certificate: { mimes: ['pdf','jpg','jpeg','png'], max_kb: 5120 }, video: { mimes: ['mp4','webm'], max_kb: 51200 }, other: { mimes: ['pdf','jpg','jpeg','png'], max_kb: 5120 } } };
  let _limits = null;
  async function limits(){
    if(!_limits){ try{ _limits = await api.get('/limits', { noAuthRedirect: true, silent403: true }); }catch(e){ _limits = null; } }
    return _limits && _limits.categories ? _limits : LIMIT_FALLBACK;
  }
  /* Returns '' if OK, otherwise the message to show. The backend re-checks everything; this just fails fast. */
  window.bkCheckFile = async function(file, category){
    const cfg = ((await limits()).categories || {})[category] || LIMIT_FALLBACK.categories.other;
    if(!file || !file.size) return 'This file is empty. Choose another file.';
    const ext = String((file.name || '').split('.').pop() || (file.type || '').split('/').pop()).toLowerCase();
    if(file.name && cfg.mimes.indexOf(ext) < 0) return 'Unsupported file type. Allowed: ' + cfg.mimes.join(', ').toUpperCase() + '.';
    if(file.size > cfg.max_kb * 1024) return 'File is too large. Maximum size is ' + Math.round(cfg.max_kb / 1024) + ' MB.';
    return '';
  };

  /* ---------------- categories ---------------- */
  let _cats = null;
  async function categories(){ if(!_cats){ try{ _cats = items(await api.get('/categories', { noAuthRedirect: true })); }catch(e){ return []; } } return _cats; } /* failures are not cached */
  async function categoryId(name){ const c = (await categories()).find(function(x){ return x.name === name; }); return c ? c.id : null; }

  /* ---------------- jobs (public) ---------------- */
  function salaryText(j, m){
    if(m.salary_as_per_norms) return 'As per norms';
    if(j.salary_min || j.salary_max){
      const per = ({ year: 'Year', month: 'Month', lecture: 'Lecture', hour: 'Hour' })[m.salary_period] || 'Month';
      return (j.salary_min && j.salary_max ? inr(j.salary_min) + ' – ' + inr(j.salary_max) : (j.salary_min ? inr(j.salary_min) + '+' : 'Up to ' + inr(j.salary_max))) + '/' + per + (m.salary_negotiable ? ' (negotiable)' : '');
    }
    return 'Not disclosed';
  }
  function mapJob(j){
    const m = j.meta || {}, co = j.company || {};
    const tags = [];
    if(m.qualification) tags.push(m.qualification);
    if(m.type_label || j.employment_type) tags.push(m.type_label || j.employment_type);
    return {
      id: j.id, title: j.title, org: co.company_name || 'Institution', logo: fileUrl(co.logo),
      city: j.city || j.location || '', location: j.location || '', cat: (j.category && j.category.name) || m.category_label || '',
      tags: tags, skills: (j.skills || []).map(function(s){ return s.name; }),
      salary: salaryText(j, m), type: m.type_label || j.employment_type || 'Full-time', mode: 'In Office',
      posted: daysSince(j.published_at || j.created_at), daysLeft: daysUntil(j.application_deadline),
      applicants: j.applications_count || 0, minExp: Number(j.experience_min || 0),
      color: COLORS[(j.id || 0) % COLORS.length], initials: initials(co.company_name),
      role: m.role || '', dept: m.dept || '', qualification: m.qualification || '', description: j.description || '', qa: m.qa || null, raw: j
    };
  }
  async function fetchJobs(params){ return (await paged('/jobs', params, 4)).map(mapJob); }

  /* Demo jobs: shown on Browse Jobs only while the API has no live jobs, so every category has sample cards. */
  function demoJobs(){
    var D=[
      ['Mathematics Teacher (PGT)','Sunrise Public School','Hyderabad','Schools','M.Sc + B.Ed','Full-time',['Mathematics','CBSE','Class 9-12'],'₹35,000 – ₹50,000 / month',2,4,18,3],
      ['Primary Class Teacher','Little Scholars School','Warangal','Schools','B.Ed','Full-time',['Primary','Classroom management'],'₹22,000 – ₹30,000 / month',1,6,9,0],
      ['Computer Science Teacher','Vignan Model School','Vijayawada','Schools','B.Tech + B.Ed','Part-time',['Python','Computer Science'],'₹25,000 – ₹38,000 / month',3,10,12,1],
      ['Physics Lecturer (Junior College)','Narayana Junior College','Hyderabad','Intermediate','M.Sc Physics','Full-time',['Physics','MPC','EAMCET'],'₹40,000 – ₹60,000 / month',1,5,27,4],
      ['Chemistry Lecturer','Sri Chaitanya Junior College','Guntur','Intermediate','M.Sc Chemistry','Full-time',['Chemistry','BiPC'],'₹38,000 – ₹55,000 / month',4,3,15,2],
      ['Commerce Lecturer','Gayatri Junior College','Karimnagar','Intermediate','M.Com','Full-time',['Accountancy','Economics'],'₹30,000 – ₹42,000 / month',2,7,8,0],
      ['Assistant Professor – Computer Science','Upaadhyay University','Hyderabad','Higher Education','M.Tech + NET/SET','Full-time',['AI/ML','Data Structures','Research'],'₹57,700 – ₹1,82,400 / month',2,14,41,5],
      ['Associate Professor – Management','Deccan Institute of Management','Bengaluru','Higher Education','PhD','Full-time',['Marketing','MBA','Publications'],'₹1,01,500 – ₹1,67,400 / month',5,20,22,8],
      ['Visiting Faculty – Civil Engineering','JNTU College of Engineering','Warangal','Higher Education','M.Tech','Contract',['Structural','AutoCAD'],'₹1,500 / lecture',6,12,6,3]
    ];
    return D.map(function(d,i){
      return { id:'demo-'+(i+1), title:d[0], org:d[1], logo:({'Schools':'../assets/logo/school.jpg','Intermediate':'../assets/logo/junior-college.jpg','Higher Education':'../assets/logo/university.jpg'})[d[3]]||'', description:'Join '+d[1]+' as '+d[0]+'. Required qualification: '+d[4]+'. Apply now to be considered for this opening.', city:d[2], location:d[2], cat:d[3], tags:[d[4],'Demo'], skills:d[6],
        salary:d[7], type:d[5], mode:'In Office', posted:d[8], daysLeft:d[9], applicants:d[10], minExp:d[11],
        color:COLORS[i%COLORS.length], initials:initials(d[1]), demo:true };
    });
  }
  /* Browse-jobs page: load from the API, then reuse the existing filters/cards. */
  window.bkLoadBrowseJobs = async function(){
    const list = document.getElementById('bjJobList');
    if(list) list.innerHTML = '<div class="bj-empty" style="grid-column:1/-1;">Loading jobs…</div>';
    try{ bjJobs = await fetchJobs({}); }
    catch(e){ bjJobs = []; if(list) list.innerHTML = '<div class="bj-empty" style="grid-column:1/-1;">Could not load jobs. ' + esc(e.message) + '</div>'; return; }
    if(!bjJobs.length && (window.UPADYAY_DEMO_JOBS === true || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) bjJobs = demoJobs(); /* demo cards never show on the live site */
    const q = getParam('q'), loc = getParam('loc');
    const kw = document.getElementById('bjKeyword'), lc = document.getElementById('bjLocation');
    if(q && kw && !kw.value) kw.value = q;
    if(loc && lc && !lc.value) lc.value = loc;
    renderBrowseJobs();
  };

  /* Employer's "Ask Questions" (Post a job, step 6): every question must be answered before the application is sent. */
  async function jobQuestions(id){
    let qa = null;
    try{ qa = mapJob(await api.get('/jobs/' + id, { noAuthRedirect: true })).qa; }catch(e){}
    if(!qa){ try{ qa = JSON.parse(localStorage.getItem('upaadhyay_jobqa_' + id) || 'null'); }catch(e){} } /* same-browser fallback until the API returns meta.qa */
    return ((qa && qa.questions) || []).filter(function(x){ return x && String(x.q || '').trim(); }).slice(0, 5);
  }
  function askQuestions(qs, title){
    return new Promise(function(resolve){
      if(!document.getElementById('qaApStyle')){
        const st = document.createElement('style'); st.id = 'qaApStyle';
        st.textContent = '.qa-ap{position:fixed;inset:0;z-index:2000;background:rgba(11,29,58,.5);display:flex;align-items:center;justify-content:center;padding:16px}'
          + '.qa-ap-card{background:#fff;width:100%;max-width:560px;max-height:90vh;overflow:auto;padding:22px;border-radius:8px;box-shadow:0 20px 50px rgba(11,29,58,.3);font-family:inherit}'
          + '.qa-ap-card h3{margin:0 0 4px;font-size:18px}.qa-ap-sub{margin:0 0 14px;font-size:13px;color:#5b6577}'
          + '.qa-ap-item{margin-bottom:14px}.qa-ap-item label{display:block;font-size:14px;font-weight:600;margin-bottom:6px}.qa-ap-item label small{font-weight:500;color:#8a93a6;margin-left:4px}'
          + '.qa-ap-item textarea{width:100%;box-sizing:border-box;min-height:84px;padding:10px 12px;border:1px solid #cfd6e4;border-radius:6px;font:inherit;font-size:14px;resize:vertical}'
          + '.qa-ap-item textarea.bad{border-color:#B42318;outline:1px solid #B42318}.qa-ap-err{min-height:16px;margin-top:3px;font-size:12.5px;color:#B42318}'
          + '.qa-ap-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}.qa-ap-foot button{padding:10px 18px;border-radius:6px;font:inherit;font-weight:600;cursor:pointer;border:1px solid #cfd6e4;background:#fff}'
          + '.qa-ap-foot .qa-ap-go{background:#1d4fd7;border-color:#1d4fd7;color:#fff}';
        document.head.appendChild(st);
      }
      const box = document.createElement('div'); box.className = 'qa-ap';
      box.innerHTML = '<div class="qa-ap-card" role="dialog" aria-modal="true" aria-labelledby="qaApT"><h3 id="qaApT">Answer these questions to apply</h3>'
        + '<p class="qa-ap-sub">' + (title ? esc(title) + ' · ' : '') + qs.length + ' question' + (qs.length > 1 ? 's' : '') + ' from the employer. All answers are required.</p>'
        + qs.map(function(x, i){ return '<div class="qa-ap-item"><label for="qaAp' + i + '">' + (i + 1) + '. ' + esc(x.q) + '<small>· about ' + (+x.mins || 1) + ' min</small></label>'
            + '<textarea id="qaAp' + i + '" maxlength="1000" rows="3" placeholder="Type your answer"></textarea><div class="qa-ap-err"></div></div>'; }).join('')
        + '<div class="qa-ap-foot"><button type="button" class="qa-ap-cancel">Cancel</button><button type="button" class="qa-ap-go">Submit application</button></div></div>';
      document.body.appendChild(box);
      const tas = box.querySelectorAll('textarea');
      function close(v){ document.removeEventListener('keydown', onKey); box.remove(); resolve(v); }
      function onKey(e){ if(e.key === 'Escape') close(null); }
      document.addEventListener('keydown', onKey);
      box.addEventListener('mousedown', function(e){ if(e.target === box) close(null); });
      box.querySelector('.qa-ap-cancel').onclick = function(){ close(null); };
      [].forEach.call(tas, function(t){ t.addEventListener('input', function(){ t.classList.remove('bad'); t.nextSibling.textContent = ''; }); });
      box.querySelector('.qa-ap-go').onclick = function(){
        let first = null;
        [].forEach.call(tas, function(t){
          const ok = t.value.trim().length >= 2;
          t.classList.toggle('bad', !ok); t.nextSibling.textContent = ok ? '' : 'Please answer this question.';
          if(!ok && !first) first = t;
        });
        if(first){ first.focus(); return; }
        close(qs.map(function(x, i){ return { q: x.q, mins: +x.mins || 1, a: tas[i].value.trim() }; }));
      };
      if(tas[0]) tas[0].focus();
    });
  }

  /* Apply (seeker). */
  window.applyToJob = async function(id, title){
    if(String(id).indexOf('demo-')===0){ api.toast('This is a demo job. Live jobs posted by institutions can be applied to.'); return; }
    if(isLoggedIn && currentRole === 'company'){ api.toast('Institution accounts cannot apply. Log in with a faculty account.'); return; }
    if(!isLoggedIn){ goTo('register', { role: 'seeker' }); return; }
    if(currentRole !== 'seeker'){ api.toast('Only faculty accounts can apply to jobs.'); return; }
    try{
      const qs = await jobQuestions(id);
      let body = {};
      if(qs.length){ const ans = await askQuestions(qs, title); if(!ans) return; body = { answers: ans }; }
      await api.post('/jobs/' + id + '/apply', body);
      try{ currentUser.appliedIds = currentUser.appliedIds || []; if(currentUser.appliedIds.indexOf(String(id)) < 0){ currentUser.appliedIds.push(String(id)); saveState(); } }catch(e){}
      api.toast('Application sent' + (title ? ' for ' + title : ''));
      document.querySelectorAll('[data-apply-job="' + id + '"]').forEach(function(b){ b.textContent = 'Applied ✓'; b.disabled = true; });
    }catch(e){ api.toast(e.message); }
  };

  /* Static pages (For Faculty / Job view): shared loader. */
  const SP_KEYS = { professor:/professor/i, 'associate-professor':/associate/i, 'assistant-professor':/assistant/i, lecturer:/lecturer/i,
    research:/research professor/i, 'research-associate':/research associate/i, postdoctoral:/post-?doc/i, 'non-teaching':/non[- ]teaching/i,
    'academic-coordinator':/coordinator/i, 'lab-staff':/\blab/i, administration:/admin/i };
  function spCatFor(job){
    const t = (job.role || '') + ' ' + job.title;
    const order = ['research-associate','research','postdoctoral','associate-professor','assistant-professor','professor','lecturer','non-teaching','academic-coordinator','lab-staff','administration'];
    for(let i = 0; i < order.length; i++){ if(SP_KEYS[order[i]].test(t)) return order[i]; }
    return '';
  }
  let _spPromise = null;
  window.spLoadJobs = function(){
    if(!_spPromise){
      _spPromise = fetchJobs({}).then(function(rows){
        if(!rows.length && (window.UPADYAY_DEMO_JOBS === true || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) rows = demoJobs(); /* same demo rule as Browse Jobs */
        SP_JOBS = rows.map(function(j){
          return { id: j.id, cat: spCatFor(j), title: j.title, inst: j.org, loc: j.city, subj: j.dept, qual: j.qualification || '—',
                   exp: j.minExp, type: j.type, sal: j.salary, desc: j.description, raw: j };
        });
        return SP_JOBS;
      }).catch(function(){ SP_JOBS = []; _spPromise = null; return SP_JOBS; });
    }
    return _spPromise;
  };
  window.spGetJob = async function(id){
    await spLoadJobs();
    let j = SP_JOBS.filter(function(x){ return x.id == id; })[0];
    if(j) return j;
    if(String(id).indexOf('demo-') === 0){
      const d = demoJobs().filter(function(x){ return x.id == id; })[0];
      if(d) return { id: d.id, cat: spCatFor(d), title: d.title, inst: d.org, loc: d.city, subj: d.dept, qual: d.qualification || (d.tags && d.tags[0]) || '—', exp: d.minExp, type: d.type, sal: d.salary, desc: d.description, raw: d };
    }
    try{
      const m = mapJob(await api.get('/jobs/' + id, { noAuthRedirect: true }));
      return { id: m.id, cat: spCatFor(m), title: m.title, inst: m.org, loc: m.city, subj: m.dept, qual: m.qualification || '—', exp: m.minExp, type: m.type, sal: m.salary, desc: m.description, raw: m };
    }catch(e){ return null; }
  };

  /* Home page: featured institutions come from the backend. */
  window.bkLoadInstitutions = async function(){
    try{
      const r = await api.get('/institutions', { noAuthRedirect: true });
      return items(r).slice().sort(function(a,b){ var ta=Date.parse(a.created_at||a.createdAt||'')||0, tb=Date.parse(b.created_at||b.createdAt||'')||0; return (tb-ta) || ((b.id||0)-(a.id||0)); })
        .map(function(c){ return [c.company_name || c.name, c.city || c.location || '', c.logo || c.logo_url || c.company_logo || (c.company_profile&&c.company_profile.logo) || '']; }).filter(function(c){ return c[0]; });
    }catch(e){ return []; }
  };

  /* ---------------- profiles: load + auto-save ---------------- */
  let _syncReady = false, _lastSig = '', _timer = null, _instSig = '';
  const _origSaveState = saveState;

  function cap(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  async function hydrateSeeker(){
    const u = await api.get('/candidate/profile', { silent403: true });
    const cp = (u && (u.candidate_profile || u.candidateProfile)) || {}, pd = cp.profile_data || {};
    Object.assign(currentUser, pd);
    if(u.name) currentUser.name = u.name;
    if(u.email) currentUser.email = u.email;
    if(u.phone) currentUser.phone = u.phone;
    if(cp.date_of_birth && !currentUser.dob) currentUser.dob = String(cp.date_of_birth).slice(0, 10);
    if(cp.gender && !currentUser.gender) currentUser.gender = cap(cp.gender);
    if(cp.city && !currentUser.city) currentUser.city = cp.city;
    if(cp.state && !currentUser.state) currentUser.state = cp.state;
    if(cp.location && !currentUser.location) currentUser.location = cp.location;
    if(cp.current_job_title && !currentUser.currentDesignation) currentUser.currentDesignation = cp.current_job_title;
    if(cp.total_experience != null && !currentUser.experience) currentUser.experience = String(cp.total_experience);
    if(cp.profile_photo) currentUser.avatar = fileUrl(cp.profile_photo);   // server column is the source of truth
    /* Uploaded resume/certificates live in their own tables. Keep what the server has so the profile editor can show
       them even when profile_data.fp.files was not saved (e.g. the save right after the upload failed). */
    const r0 = (u.resumes || []).filter(function(r){ return r && r.file; })[0];
    window.bkServerFiles = { resume: r0 ? r0.file : null };
    _lastSig = JSON.stringify(seekerPayload());
  }
  function seekerPayload(){
    const U = currentUser, body = { name: String(U.name || '').trim().slice(0, 120) || undefined, phone: U.phone ? String(U.phone).trim().slice(0, 20) : null };
    const dob = /^\d{4}-\d{2}-\d{2}$/.test(U.dob || '') && new Date(U.dob) < new Date() ? U.dob : undefined;
    const g = String(U.gender || '').toLowerCase();
    const exp = parseFloat(U.experience);
    body.date_of_birth = dob || (U.dob ? undefined : null);
    body.gender = g ? (g === 'male' || g === 'female' ? g : 'other') : null;   // 'Non-binary' / 'Prefer not to say' -> other (full label kept in profile_data)
    body.location = (U.location || U.currentLocation || '').slice(0, 190) || null;
    body.city = (U.city || '').slice(0, 100) || null;
    body.state = (U.state || '').slice(0, 100) || null;
    body.current_job_title = (U.currentDesignation || '').slice(0, 190) || null;
    body.total_experience = isFinite(exp) && exp >= 0 && exp <= 60 ? exp : (U.experience ? undefined : null);
    body.profile_data = stripHeavy(U);
    Object.keys(body).forEach(function(k){ if(body[k] === undefined) delete body[k]; });
    return body;
  }

  function normUrl(u){ u = String(u || '').trim(); if(!u) return undefined; if(!/^https?:\/\//i.test(u)) u = 'https://' + u; try{ new URL(u); return u.slice(0, 255); }catch(e){ return undefined; } }
  function instState(){ try{ return JSON.parse(localStorage.getItem('upadyay_inst_v1')) || null; }catch(e){ return null; } }
  async function hydrateCompany(){
    const c = await api.get('/company/profile', { silent403: true });
    const pd = (c && c.profile_data) || {};
    Object.assign(currentCompany, pd.app || {});
    if(c.company_name) currentCompany.name = c.company_name;
    if(c.industry) currentCompany.type = c.industry;
    if(c.city) currentCompany.city = c.city;
    if(c.website) currentCompany.website = c.website;
    if(c.description) currentCompany.desc = c.description;
    if(c.email) currentCompany.email = c.email;
    if(c.phone) currentCompany.phone = c.phone;
    if(c.logo) currentCompany.logo = fileUrl(c.logo); /* server is the source of truth */
    currentCompany.verification = c.verification_status || '';
    const uid = String((api.user && api.user.id) || c.user_id || '');
    let owner = null; try{ owner = localStorage.getItem('upadyay_inst_owner'); }catch(e){}
    if(uid && owner && owner !== uid){ /* another institution used this browser: never carry its form over */
      try{ localStorage.removeItem('upadyay_inst_v1'); if(pd.inst) localStorage.setItem('upadyay_inst_v1', JSON.stringify(pd.inst)); localStorage.setItem('upadyay_inst_owner', uid); }catch(e){}
      try{ if(!sessionStorage.getItem('upadyay_inst_reload')){ sessionStorage.setItem('upadyay_inst_reload', '1'); location.reload(); return; } }catch(e){}
    }else{
      try{ sessionStorage.removeItem('upadyay_inst_reload'); if(uid && !owner) localStorage.setItem('upadyay_inst_owner', uid); }catch(e){}
      if(pd.inst && !instState()){ /* new device / cleared browser: bring the saved institution form in and redraw it */
        try{ localStorage.setItem('upadyay_inst_v1', JSON.stringify(pd.inst)); }catch(e){}
        if(typeof instReload === 'function') instReload();
      }
    }
    _instSig = JSON.stringify(instState());
    _lastSig = JSON.stringify(companyPayload());
  }
  function companyPayload(){
    const C = currentCompany, inst = instState(), d = (inst && inst.d) || {};
    /* Main-campus address lives in the institution form; mirror it into the real columns so search/admin/jobs see it. */
    const place = [d.area, d.city, d.state].map(function(x){ return String(x || '').trim(); }).filter(Boolean).join(', ');
    const body = { company_name: C.name || undefined, industry: C.type || null, city: String(d.city || C.city || '').slice(0, 100) || null,
                   state: String(d.state || '').slice(0, 100) || null, location: place.slice(0, 190) || null,
                   website: normUrl(C.website) || (C.website ? undefined : null), description: C.desc ? String(C.desc).slice(0, 5000) : null,
                   phone: C.phone ? String(C.phone).slice(0, 20) : null };
    if(/^\S+@\S+\.\S+$/.test(C.email || '')) body.email = C.email; else if(!C.email) body.email = null;
    body.profile_data = stripHeavy({ app: { contactName: C.contactName, designation: C.designation, saved: C.saved, logo: C.logo }, inst: instState() });
    Object.keys(body).forEach(function(k){ if(body[k] === undefined) delete body[k]; });
    return body;
  }

  async function pushProfile(){
    if(!_syncReady || !api.hasToken()) return;
    const isCo = currentRole === 'company';
    if(!isCo && currentRole !== 'seeker') return;
    const body = isCo ? companyPayload() : seekerPayload();
    const sig = JSON.stringify(body);
    if(sig === _lastSig) return;
    status('saving', 'Saving…');
    try{
      await api.put(isCo ? '/company/profile' : '/candidate/profile', body, { silent403: true });
      _lastSig = sig;
      status('saved', 'All changes saved');
    }catch(e){
      if(e.status !== 401) status('error', e.status === 0 ? 'Offline — not saved' : 'Not saved: ' + e.message, pushProfile);
    }
  }
  /* Explicit, awaited save for the faculty profile form: resolves only after the server confirms (throws ApiError otherwise). */
  window.bkSaveSeekerProfile = async function(){
    if(currentRole !== 'seeker') throw new Error('Only faculty accounts have a faculty profile.');
    if(window.bkProfileLoaded === false) throw new Error('Your profile did not load. Reload the page before saving so nothing is overwritten.');
    const body = seekerPayload();
    const u = await api.put('/candidate/profile', body, { silent403: true });
    _lastSig = JSON.stringify(body);
    const cp = (u && (u.candidate_profile || u.candidateProfile)) || {};
    if(cp.profile_photo) currentUser.avatar = fileUrl(cp.profile_photo);
    _origSaveState();
    return u;
  };
  /* Re-read the saved profile from the server (used on tab focus so other tabs/devices' edits show up). */
  window.bkRefreshSeeker = async function(){ await hydrateSeeker(); window.bkProfileLoaded = true; window.bkProfileError = ''; _syncReady = true; _origSaveState(); };
  function schedulePush(){ clearTimeout(_timer); _timer = setTimeout(pushProfile, 900); }
  function flushPush(){
    if(currentRole === 'company' && _syncReady){                 // institution form edits not yet noticed by the 3s poll
      const s = JSON.stringify(instState());
      if(s !== _instSig){ _instSig = s; clearTimeout(_timer); _timer = null; pushProfile(); return; }
    }
    if(_timer){ clearTimeout(_timer); _timer = null; pushProfile(); }
  }
  /* institution.js calls this on every save() so the server copy follows right away instead of waiting for the poll. */
  window.bkInstChanged = function(){
    if(currentRole !== 'company' || !_syncReady) return;
    const s = JSON.stringify(instState());
    if(s !== _instSig){ _instSig = s; schedulePush(); }
  };
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') flushPush(); });
  window.addEventListener('pagehide', flushPush);

  /* Every existing saveState() call now also syncs to the backend (debounced, only if something changed). */
  saveState = function(){ _origSaveState(); schedulePush(); };
  setInterval(function(){                     // institution form saves straight to localStorage; mirror it
    if(currentRole !== 'company' || !_syncReady) return;
    const s = JSON.stringify(instState());
    if(s !== _instSig){ _instSig = s; schedulePush(); }
  }, 3000);

  /* Admin approval / rejection should lock or unlock the institution's dashboard without a re-login:
     re-read the verification status when the tab regains focus and once a minute while it is visible. */
  const VERIFY_MSG = {
    approved: 'Your institution was approved. Post a job, Posted jobs and Browse candidates are now unlocked.',
    rejected: 'Your institution was not approved. Open your notifications to see the reason.',
    blocked: 'Your institution has been blocked. Contact support.',
    pending: 'Your institution is waiting for admin review.'
  };
  async function refreshVerification(){
    if(currentRole !== 'company' || !_syncReady || !api.hasToken() || document.visibilityState === 'hidden') return;
    try{
      const c = await api.get('/company/profile', { silent403: true });
      const v = String((c && c.verification_status) || '').toLowerCase();
      if(!v || v === String(currentCompany.verification || '').toLowerCase()) return;
      currentCompany.verification = v;
      if(typeof applyEmployerLock === 'function') applyEmployerLock();
      if(typeof loadNotifs === 'function') loadNotifs();
      if(typeof showGenericToast === 'function' && VERIFY_MSG[v]) showGenericToast(VERIFY_MSG[v]);
    }catch(e){ /* offline or session ended: the next tick retries; 401 is handled by api.js */ }
  }
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'visible') refreshVerification(); });
  setInterval(refreshVerification, 60000);

  let _hydration = null;
  window.bkHydrate = function(){
    if(!_hydration){
      _hydration = (async function(){
        try{
          if(currentRole === 'seeker'){ await hydrateSeeker(); window.bkProfileLoaded = true; window.bkProfileError = ''; }
          else if(currentRole === 'company'){ await hydrateCompany(); if(typeof applyEmployerLock === 'function') applyEmployerLock(); }
          _syncReady = true;
          _origSaveState();
          if(currentRole === 'company'){ try{ await loadEmployer(); }catch(e){ console.warn('[backend] employer data', e); } }
          loadNotifs();
        }catch(e){
          console.warn('[backend] hydrate failed', e);
          if(currentRole === 'seeker'){ window.bkProfileLoaded = false; window.bkProfileError = (e && e.message) || 'Network error'; }
          if(e && e.status === 404){ _syncReady = true; }
        }
      })();
    }
    return _hydration;
  };
  /* Protected pages wait for the profile to load before they draw their forms. */
  const _requireLogin = requireLogin;
  requireLogin = async function(role){
    const ok = await _requireLogin(role);
    if(ok) await bkHydrate();
    return ok;
  };
  /* Pages that don't call requireLogin (home, jobs…) still load notifications + profile in the background. */
  if(typeof authReady !== 'undefined'){ authReady.then(function(u){ if(u) bkHydrate(); }); }

  /* Logout: flush pending edits, then remove this account's institution form so the next login starts clean. */
  if(typeof logoutUser === 'function'){
    const _lo = logoutUser;
    logoutUser = async function(){
      try{ await pushProfile(); }catch(e){}
      try{
        const clean = currentRole !== 'company' || JSON.stringify(companyPayload()) === _lastSig;
        if(clean){ localStorage.removeItem('upadyay_inst_v1'); localStorage.removeItem('upadyay_inst_owner'); sessionStorage.removeItem('upadyay_inst_reload'); }
      }catch(e){}
      return _lo.apply(this, arguments);
    };
  }

  /* ---------------- notifications ---------------- */
  async function loadNotifs(){
    if(!api.hasToken()) return;
    try{
      const d = await api.get('/notifications?per_page=20', { silent403: true, noAuthRedirect: true });
      const rows = d && d.notifications ? items(d.notifications) : [];
      dashNotifs = rows.map(function(n){
        return { id: n.id, read: !!n.read_at, time: n.created_at, text: '<b>' + esc(n.title) + '</b>' + (n.message ? ' — ' + esc(n.message) : '') };
      });
      hasUnreadNotif = !!(d && d.unread_count > 0);
      _origSaveState();
      ['navBellDot','dashBellDot','bjBellDot'].forEach(function(id){ const el = document.getElementById(id); if(el) el.style.display = hasUnreadNotif ? 'block' : 'none'; });
    }catch(e){ /* keep whatever we had */ }
  }
  function markRead(){
    if(!api.hasToken()) return;
    api.put('/notifications/read-all', {}, { silent403: true, noAuthRedirect: true }).then(function(){
      hasUnreadNotif = false; (dashNotifs || []).forEach(function(n){ n.read = true; }); _origSaveState();
      ['navBellDot','dashBellDot','bjBellDot'].forEach(function(id){ const el = document.getElementById(id); if(el) el.style.display = 'none'; });
    }).catch(function(){});
  }
  if(typeof openNotifPanel === 'function'){ const o = openNotifPanel; openNotifPanel = function(){ o.apply(this, arguments); markRead(); }; }
  if(typeof toggleDashNotifs === 'function'){ const o2 = toggleDashNotifs; toggleDashNotifs = function(){ o2.apply(this, arguments); markRead(); }; }
  setInterval(loadNotifs, 60000);
  /* pushNotif now only adds a local line for things the server doesn't announce itself. */
  window.bkLoadNotifs = loadNotifs;

  /* ---------------- employer: jobs, candidates, applicants ---------------- */
  const appByCandidate = {};          // candidateId -> latest application id (for status updates)
  const appByJobCand = {};            // jobKey:candidateId -> application id

  function mapPostedJob(j){
    const m = j.meta || {};
    return {
      id: j.id, status: j.status, title: j.title, role: m.role || '', dept: m.dept || '', type: m.type_label || j.employment_type,
      category: (j.category && j.category.name) || m.category_label || '', qualification: m.qualification || '', notice: m.notice || '',
      vacancies: j.vacancy_count, expMin: j.experience_min == null ? '' : j.experience_min, expMax: j.experience_max == null ? '' : j.experience_max,
      salMin: j.salary_min == null ? '' : j.salary_min, salMax: j.salary_max == null ? '' : j.salary_max,
      salPeriod: m.salary_period || 'month', salNeg: !!m.salary_negotiable, salNorms: !!m.salary_as_per_norms,
      campus: m.campus || '', campusLoc: m.campus_loc || '', location: j.location, desc: j.description,
      skills: (j.skills || []).map(function(s){ return s.name; }).join(', '),
      deadline: j.application_deadline ? String(j.application_deadline).slice(0, 10) : '', applicantIds: [], applicantCount: j.applications_count || 0, qa: m.qa || null
    };
  }
  function mapCandidate(u){
    const cp = u.candidate_profile || u.candidateProfile || {}, pd = cp.profile_data || {};
    const skillNames = (u.skills || []).map(function(s){ return s.name; });
    const exp = cp.total_experience != null ? cp.total_experience : pd.experience;
    const edu = [];
    if(pd.qualification || pd.subject) edu.push([[pd.qualification, pd.subject].filter(Boolean).join(', '), [pd.college, pd.highestQualYear].filter(Boolean).join(' · ')]);
    (pd.additionalQualifications || []).forEach(function(q){ edu.push([[q.qualification, q.specialization].filter(Boolean).join(', '), [q.college, q.year].filter(Boolean).join(' · ')]); });
    const expRows = (pd.employmentHistory || []).map(function(e){
      return [[e.designation, e.department].filter(Boolean).join(', '), [e.org, (e.from || '') + ' – ' + (e.currentlyWorking ? 'Present' : (e.to || ''))].filter(Boolean).join(' · ')];
    });
    if(!expRows.length && pd.currentOrg) expRows.push([pd.currentDesignation || 'Faculty', pd.currentOrg]);
    const links = [];
    (u.resumes || []).forEach(function(r){ if(r.file) links.push([r.file.original_name || 'Resume', 'doc', r.file.id]); });
    (u.certificates || []).forEach(function(c){ if(c.file) links.push([c.file.original_name || 'Certificate', 'doc', c.file.id]); });
    (pd.otherDocuments || []).forEach(function(d){ if(d && d.label) links.push([d.label, 'link']); });
    const fp = pd.fp || null;
    if(fp){ /* the faculty profile editor saves its data under profile_data.fp */
      const EN = { phd: 'Ph.D.', pg: "Master's", mphil: 'M.Phil', ug: "Bachelor's", dip: 'Diploma' }, e2 = [], x2 = [];
      ['phd','pg','mphil','ug','dip'].forEach(function(k){
        const e = fp.edu && fp.edu[k]; if(!e || !(e.type || e.major || e.area || e.uni)) return;
        e2.push([[e.type || EN[k], e.major || e.area].filter(Boolean).join(', '), [e.college || e.uni, e.end].filter(Boolean).join(' · ')]);
      });
      (fp.jobs || []).forEach(function(j){
        if(!j || !j.org) return;
        const yrs = (j.start ? String(j.start).slice(0, 4) : '') + ' – ' + (j.cur ? 'Present' : (j.end ? String(j.end).slice(0, 4) : ''));
        x2.push([[j.desig, j.dept].filter(Boolean).join(', '), [j.org, yrs].filter(Boolean).join(' · ')]);
      });
      if(e2.length){ edu.length = 0; e2.forEach(function(r){ edu.push(r); }); }
      if(x2.length){ expRows.length = 0; x2.forEach(function(r){ expRows.push(r); }); }
      (fp.links || []).forEach(function(l){ if(l && l.u) links.push([l.t || l.u, 'link', l.u]); });
    }
    const view = window.FacultyView ? FacultyView.normalize(u, { fileUrl: fileUrl }) : null;
    if(view && view._hasFp){ /* real uploaded documents (resume, CV, certificates, letters) with proper labels */
      const dl = FacultyView.docLinks(view);
      if(dl.length){ for(let i = links.length - 1; i >= 0; i--){ if(links[i][1] === 'doc') links.splice(i, 1); } dl.forEach(function(l){ links.push(l); }); }
    }
    return {
      id: u.id, avatar: fileUrl(cp.profile_photo) || (pd.avatar && pd.avatar.indexOf('data:') !== 0 ? pd.avatar : DEFAULT_AVATAR),
      name: u.name || 'Candidate', role: cp.current_job_title || pd.currentDesignation || (pd.fp && pd.fp.desig) || pd.subject || 'Faculty',
      tags: [pd.qualification || (pd.fp && pd.fp.high), exp ? exp + ' yrs experience' : '', cp.city || pd.city || pd.location].filter(Boolean),
      college: pd.college || pd.currentOrg || ((((pd.fp && pd.fp.jobs) || []).filter(function(j){ return j && j.cur; })[0]) || {}).org || '', about: cp.bio || pd.about || (pd.fp && pd.fp.headline) || '',
      skills: skillNames.length ? skillNames : [].concat(pd.academicSkills || [], (pd.fp && pd.fp.subjects) || [], splitList(pd.programmingLanguages), splitList(pd.softwareTools)).slice(0, 14),
      education: edu, experience: expRows,
      stats: (view && view._hasFp) ? FacultyView.stats(view) : [[String(pd.journalPublications || 0), 'Publications'], [String(pd.totalPatents || 0), 'Patents'], [String(pd.numProjects || 0), 'Projects']],
      links: links, view: view,
      interests: { departments: splitList(pd.preferredDepartments).concat((pd.fp && pd.fp.prefLevels) || []), designations: splitList(pd.preferredDesignations).concat((pd.fp && pd.fp.prefJob) || []), subjects: splitList(pd.preferredTeachingSubjects).concat((pd.fp && pd.fp.prefSubs) || []),
                   orgType: pd.preferredOrgType || '', location: pd.preferredLocation || pd.preferredWorkLocation || ((pd.fp && pd.fp.prefLoc) || []).join(', '), employmentType: pd.preferredEmploymentType || '' },
      salary: { presentCtc: pd.presentCtc, expectedCtc: pd.expectedCtc, minAcceptable: '' } /* employers never receive the minimum acceptable salary */
    };
  }
  function setProfile(u){ const p = mapCandidate(u), cpv = u.candidate_profile || u.candidateProfile || {}; p.verified = !!(u.is_verified || cpv.is_verified || cpv.verified); facultyProfiles[String(u.id)] = p; return p; }

  async function loadEmployer(){
    const fetched = await Promise.all([
      paged('/company/jobs', {}, 10),
      paged('/company/applicants', {}, 40),
      api.get('/company/candidates?per_page=50', { silent403: true }).catch(function(e){ console.warn('[backend] candidates', e); return []; })
    ]);
    Object.keys(facultyProfiles).forEach(function(k){ delete facultyProfiles[k]; });
    Object.keys(candidateStatus).forEach(function(k){ if(candidateStatus[k] !== 'invited') delete candidateStatus[k]; });
    Object.keys(postedJobs).forEach(function(k){ delete postedJobs[k]; });
    const jobs = fetched[0];
    jobs.forEach(function(j){ postedJobs['j' + j.id] = mapPostedJob(j); });
    const apps = fetched[1];
    apps.forEach(function(a){
      const cand = a.candidate; if(!cand) return;
      const cid = String(cand.id), key = 'j' + a.job_id;
      if(!facultyProfiles[cid]) setProfile(cand);
      if(postedJobs[key] && postedJobs[key].applicantIds.indexOf(cid) < 0) postedJobs[key].applicantIds.push(cid);
      appByJobCand[key + ':' + cid] = a.id;
      if(!appByCandidate[cid] || a.id > appByCandidate[cid]) appByCandidate[cid] = a.id;
      if(['shortlisted','interview','selected'].indexOf(a.status) > -1) candidateStatus[cid] = 'shortlisted';
      else if(a.status === 'rejected') candidateStatus[cid] = 'rejected';
    });
    const cands = fetched[2];
    items(cands).forEach(function(u){ if(!facultyProfiles[String(u.id)]) setProfile(u); });
    _origSaveState();
    if(typeof renderPostedJobs === 'function') renderPostedJobs();
    if(typeof renderMyJobsCards === 'function') renderMyJobsCards();
    if(document.getElementById('candidateList') && typeof renderCandidates === 'function') renderCandidates();
  }
  window.bkReloadEmployer = loadEmployer;

  /* Sub-branch / any page that browses candidates without the full employer hydrate: drop the hardcoded demo faculty, load real ones. */
  window.bkLoadCandidates = async function(){
    Object.keys(facultyProfiles).forEach(function(k){ delete facultyProfiles[k]; });
    if(!api.hasToken()) return;
    try{ (await paged('/company/candidates', {}, 5)).forEach(setProfile); }
    catch(e){ console.warn('[backend] candidates', e); }
  };

  window.bkEnsureCandidate = async function(id){
    if(facultyProfiles[String(id)]) return facultyProfiles[String(id)];
    try{ return setProfile(await api.get('/company/candidates/' + encodeURIComponent(id))); }catch(e){ return null; }
  };
  window.bkOpenFile = async function(fileId){
    const w = window.open('', '_blank'); /* opened inside the click, so popup blockers allow it */
    try{
      const r = await api.get('/files/' + fileId + '/link');
      const url = r && (r.url || r.link);
      if(url){ if(w){ w.opener = null; w.location.href = url; } else { window.location.href = url; } }
      else { if(w) w.close(); api.toast('File link unavailable.'); }
    }catch(e){ if(w) w.close(); api.toast(e.message); }
  };
  /* ---------------- uploads: POST /files/upload (multipart) ---------------- */
  /* replacesId = id of the previous file in the same slot: the server saves the new one, then deletes that one. */
  window.bkUploadFile = async function(fileOrBlob, category, name, replacesId){
    if(!api.hasToken()) throw new Error('Please log in again to upload files.');
    const bad = await bkCheckFile(fileOrBlob.name ? fileOrBlob : new File([fileOrBlob], name || 'upload.' + String(fileOrBlob.type || '').split('/').pop()), category);
    if(bad){ status('error', bad); throw new Error(bad); }
    status('saving', 'Uploading…');
    try{
      const fd = new FormData();
      fd.append('file', fileOrBlob, name || fileOrBlob.name || 'upload');
      fd.append('category', category); /* company_logo | job_image | other */
      if(replacesId) fd.append('replaces', replacesId);
      const d = await api.post('/files/upload', fd);
      const f = d && d.file ? d.file : d;
      if(!f || !f.id) throw new Error('The server did not confirm the upload.');
      status('saved', 'Uploaded');
      return { id: f.id, url: f.url || '', name: f.original_name || name || '' };
    }catch(e){ status('error', 'Upload failed: ' + ((e && e.message) || 'error')); throw e; }
  };
  window.bkDeleteFile = async function(id){
    if(!id) return;
    try{ await api.del('/files/' + id); status('saved', 'File deleted'); }
    catch(e){ if(e.status !== 404) status('error', 'Could not delete file: ' + e.message); throw e; }
  };
  window.bkRemoveLogo = async function(){
    try{ await api.del('/company/logo'); status('saved', 'Logo removed'); }
    catch(e){ status('error', 'Could not remove logo: ' + e.message); throw e; }
  };
  window.bkDataUrlToBlob = function(u){
    const m = /^data:([^;,]+)(;base64)?,(.*)$/.exec(u || ''); if(!m) throw new Error('Invalid image.');
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]), arr = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  };

  window.bkStatusBadge = function(job){
    const s = job && job.status;
    if(s === 'published') return '<span class="badge-live">Live</span>';
    if(s === 'closed' || s === 'expired') return '<span class="badge badge-pending">Closed</span>';
    return '<span class="badge badge-pending" title="Visible after admin approval">Draft</span>';
  };

  /* Form fields -> API job body (shared by post and edit). `keepDeadline` = the deadline already saved on the job being edited:
     an unchanged, already-past deadline is allowed so an old job can still be edited, closed or reopened. */
  async function jobBody(f, keepDeadline){
    const typeMap = { 'Full-time': 'full-time', 'Part-time': 'part-time', 'Contract': 'contract', 'Visiting faculty': 'part-time' };
    const loc = f.location || f.campusLoc || 'India';
    const num = function(x){ return x === '' || x == null || isNaN(Number(x)) ? null : Number(x); };
    if(num(f.expMin) != null && num(f.expMax) != null && num(f.expMin) > num(f.expMax)) throw new Error('Minimum experience cannot be more than maximum.');
    if(!f.salNorms && num(f.salMin) != null && num(f.salMax) != null && num(f.salMin) > num(f.salMax)) throw new Error('Minimum salary cannot be more than maximum.');
    if(f.deadline && f.deadline !== keepDeadline && new Date(f.deadline + 'T23:59:59') < new Date()) throw new Error('Application deadline is in the past.');
    return {
      title: f.title,
      description: f.desc || [f.role, f.dept, f.qualification && ('Qualification: ' + f.qualification)].filter(Boolean).join(' · ') || f.title,
      requirements: f.qualification ? ('Qualification: ' + f.qualification + (f.notice ? ' · Notice period: ' + f.notice : '')) : null,
      location: loc, city: String(loc).split(',')[0].trim().slice(0, 100) || null,
      employment_type: typeMap[f.type] || 'full-time', category_id: await categoryId(f.category),
      experience_min: num(f.expMin), experience_max: num(f.expMax),
      salary_min: f.salNorms ? null : num(f.salMin), salary_max: f.salNorms ? null : num(f.salMax),
      vacancy_count: Math.max(1, parseInt(f.vacancies, 10) || 1), application_deadline: f.deadline || null,
      skills: splitList(f.skills).slice(0, 30),
      meta: { role: f.role, dept: f.dept, qualification: f.qualification, notice: f.notice, type_label: f.type, category_label: f.category,
              salary_period: f.salPeriod, salary_negotiable: !!f.salNeg, salary_as_per_norms: !!f.salNorms, campus: f.campus, campus_loc: f.campusLoc, qa: f.qa || null }
    };
  }
  /* Put a job returned by the API into the posted-jobs list, keeping the applicant list the page already has. */
  function storeJob(job){
    const key = 'j' + job.id, prev = postedJobs[key], m = mapPostedJob(job);
    if(prev){ m.applicantIds = prev.applicantIds || []; if(!job.applications_count) m.applicantCount = prev.applicantCount || 0; }
    postedJobs[key] = m;
    _origSaveState();
    if(typeof renderPostedJobs === 'function') renderPostedJobs();
    if(typeof renderMyJobsCards === 'function') renderMyJobsCards();
    return m;
  }

  /* Edit a job → PUT /company/jobs/{id}. Status is left as it is (use bkSetJobStatus to close / reopen). */
  window.bkUpdateJob = async function(id, f){
    const prev = postedJobs['j' + id];
    const body = await jobBody(f, prev && prev.deadline);
    const job = await api.put('/company/jobs/' + id, body);
    storeJob(job);
    return job;
  };
  /* Close / reopen / publish → PUT /company/jobs/{id} {status}. */
  window.bkSetJobStatus = async function(id, status){
    const job = await api.put('/company/jobs/' + id, { status: status });
    storeJob(job);
    return job;
  };
  /* Delete a job (its applications go with it) → DELETE /company/jobs/{id}. */
  window.bkDeleteJob = async function(id){
    await api.del('/company/jobs/' + id);
    delete postedJobs['j' + id];
    _origSaveState();
    if(typeof renderPostedJobs === 'function') renderPostedJobs();
    if(typeof renderMyJobsCards === 'function') renderMyJobsCards();
  };

  /* Post a job → POST /company/jobs */
  window.bkPostJob = async function(f){
    const body = await jobBody(f);
    body.status = 'published';
    let job;
    try{ job = await api.post('/company/jobs', body, { silent403: true }); }
    catch(e){
      if(e.status === 403){                        // company/branch not approved yet → keep it as a draft
        body.status = 'draft';
        job = await api.post('/company/jobs', body);
        api.toast('Saved as a draft — it goes live once the institution is approved.');
      }else throw e;
    }
    postedJobs['j' + job.id] = mapPostedJob(job);
    _origSaveState();
    renderPostedJobs();
    if(typeof renderMyJobsCards === 'function') renderMyJobsCards();
    return job;
  };

  function activeApiJobId(){ const j = (typeof activeJobId !== 'undefined' && activeJobId) ? postedJobs[activeJobId] : null; return j ? j.id : undefined; }
  function refreshCandidateViews(){
    if(typeof renderCandidates === 'function' && document.getElementById('candidateList')) renderCandidates(false);
    const av = document.getElementById('applicantsView');
    if(av && av.style.display !== 'none' && typeof renderApplicants === 'function') renderApplicants(activeJobId);
    else if(window.__empApps && typeof paintAllApplicants === 'function') paintAllApplicants();   // the all-applicants list also refreshes
  }
  window.inviteCandidate = async function(id, ev){
    if(ev) ev.stopPropagation();
    try{
      let jobId = activeApiJobId();
      if(!jobId){ jobId = await empPickJob(); if(!jobId) return; }   // an invitation always belongs to a job
      await api.post('/company/invitations', { candidate_id: Number(id), job_id: Number(jobId) });
      candidateStatus[id] = 'invited'; _origSaveState();
      const p = facultyProfiles[id]; api.toast('Invitation sent to ' + (p ? p.name : 'the candidate') + '.');
      refreshCandidateViews();
    }catch(e){ api.toast(e.message); }
  };
  window.shortlistCandidate = async function(id, ev){
    if(ev) ev.stopPropagation();
    const key = (typeof activeJobId !== 'undefined' && activeJobId) ? activeJobId : null;
    const appId = key ? appByJobCand[key + ':' + id] : appByCandidate[id]; /* with a job open, only that job's application counts */
    if(!appId){ api.toast(key ? 'This candidate has not applied to this job. Invite them first.' : 'This candidate has not applied to any of your jobs yet — invite them first.'); return; }
    try{
      await api.put('/company/applications/' + appId + '/status', { status: 'shortlisted' });
      candidateStatus[id] = 'shortlisted'; _origSaveState();
      const p = facultyProfiles[id]; api.toast('Shortlisted ' + (p ? p.name : 'candidate') + '.');
      refreshCandidateViews();
    }catch(e){ api.toast(e.message); }
  };
  async function setAppStatus(id, status, doneMsg, ev){
    if(ev) ev.stopPropagation();
    const key = (typeof activeJobId !== 'undefined' && activeJobId) ? activeJobId : null;
    const appId = key ? appByJobCand[key + ':' + id] : appByCandidate[id];
    if(!appId){ api.toast('This candidate has not applied to this job.'); return; }
    try{
      await api.put('/company/applications/' + appId + '/status', { status: status });
      if(status === 'applied') delete candidateStatus[id]; else candidateStatus[id] = (status === 'rejected' ? 'rejected' : 'shortlisted');
      _origSaveState();
      const p = facultyProfiles[id]; api.toast(doneMsg + ' ' + (p ? p.name : 'candidate') + '.');
      refreshCandidateViews();
    }catch(e){ api.toast(e.message); }
  }
  window.rejectCandidate = function(id, ev){ return setAppStatus(id, 'rejected', 'Rejected', ev); };
  window.undoApplicant = function(id, ev){ return setAppStatus(id, 'applied', 'Moved back to applied:', ev); };
  window.messageCandidate = async function(id, ev){
    if(ev) ev.stopPropagation();
    const p = facultyProfiles[id];
    const msg = await empAsk(p ? p.name : 'this candidate', "Hi, we'd like to talk to you about an opening at " + (currentCompany.name || 'our institution') + '.');
    if(!msg || !msg.trim()) return;
    try{ await api.post('/company/messages', { candidate_id: Number(id), message: msg.trim().slice(0, 2000) }); api.toast('Message sent.'); }
    catch(e){ api.toast(e.message); }
  };
  /* Company profile form → PUT /company/profile (saveState hook) + validation errors surfaced. */
  if(typeof saveCompany === 'function'){
    const sc = saveCompany;
    saveCompany = function(){
      sc.apply(this, arguments);
    if(!_syncReady || !api.hasToken()) return; /* never overwrite the server before the profile has loaded */
    clearTimeout(_timer);
      status('saving', 'Saving…');
      api.put('/company/profile', companyPayload(), { silent403: true })
        .then(function(){ _lastSig = JSON.stringify(companyPayload()); status('saved', 'All changes saved'); })
        .catch(function(e){ status('error', 'Not saved: ' + e.message, function(){ saveCompany(); }); });
    };
  }
})();
