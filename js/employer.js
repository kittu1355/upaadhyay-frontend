// Fallback status badge so the dashboard never breaks if backend.js fails to load (backend.js overrides this when it loads)
if(typeof window.bkStatusBadge !== 'function'){
  window.bkStatusBadge = function(job){
    const st = job && job.status;
    if(st === 'published') return '<span class="badge-live">Live</span>';
    if(st === 'closed' || st === 'expired') return '<span class="badge badge-pending">Closed</span>';
    return '<span class="badge badge-pending">Draft</span>';
  };
}
// ---------- Faculty profile data + slide-in panel ----------
  var facultyProfiles = {
    priya: {
      avatar:'https://i.pravatar.cc/160?img=47', name:'Dr. Priya Menon', role:'Physics · Quantum Optics',
      tags:['PhD','8 yrs experience','Hyderabad'], college:'IIT Bombay',
      about:'Quantum optics researcher and educator with 8 years of university teaching experience. Focused on making advanced physics accessible through lab-first, project-based instruction. Open to full-time faculty and visiting research positions.',
      skills:['Quantum Optics','Photonics','Research Supervision','Curriculum Design','MATLAB','LaTeX'],
      education:[
        ['PhD, Physics','IIT Bombay · 2011 – 2015'],
        ['MSc, Physics','University of Hyderabad · 2009 – 2011']
      ],
      stats:[['14','Publications'],['210','Citations'],['1','Patent']],
      experience:[
        ['Associate Professor, Physics','KL University · 2019 – Present'],
        ['Assistant Professor, Physics','Osmania University · 2015 – 2019']
      ],
      links:[
        ['PhD Certificate — KL University.pdf','doc'],
        ['Resume / CV.pdf','doc'],
        ['Publication list (Google Scholar)','link'],
        ['Patent certificate.pdf','doc']
      ],
      interests:{
        departments:['Physics','Applied Sciences'],
        designations:['Associate Professor','Professor'],
        subjects:['Quantum Mechanics','Photonics','Electrodynamics'],
        orgType:'University / Higher Education',
        location:'Hyderabad, Vijayawada',
        employmentType:'Full-time'
      },
      salary:{ presentCtc:1200000, expectedCtc:1600000, minAcceptable:1400000 }
    },
    rohit:{
      avatar:'https://i.pravatar.cc/160?img=12', name:'Rohit Sharma', role:'Commerce · Accountancy',
      tags:['PG','5 yrs experience','Chennai'], college:'Loyola College',
      about:'Commerce lecturer specializing in accountancy for junior college boards. 5 years of classroom experience with a strong track record of board-exam results and student mentorship.',
      skills:['Financial Accounting','Taxation Basics','Board Exam Prep','Mentoring','Tally','MS Excel'],
      education:[
        ['PG, Commerce','Loyola College · 2018 – 2020'],
        ['BCom','Madras Christian College · 2015 – 2018']
      ],
      stats:[['5','Yrs experience'],['2','Boards taught'],['120+','Students mentored']],
      experience:[
        ['Senior Lecturer, Commerce','Narayana Junior College · 2021 – Present'],
        ['Lecturer, Commerce','Sri Chaitanya College · 2019 – 2021']
      ],
      links:[
        ['PG Degree Certificate.pdf','doc'],
        ['Resume / CV.pdf','doc'],
        ['Experience letter — Sri Chaitanya.pdf','doc']
      ],
      interests:{
        departments:['Commerce','Management'],
        designations:['Senior Lecturer','HOD'],
        subjects:['Financial Accounting','Taxation','Business Studies'],
        orgType:'Junior College',
        location:'Chennai',
        employmentType:'Full-time'
      },
      salary:{ presentCtc:480000, expectedCtc:600000, minAcceptable:550000 }
    },
    anjali:{
      avatar:'https://i.pravatar.cc/160?img=32', name:'Dr. Anjali Kulkarni', role:'Computer Science · AI/ML',
      tags:['PhD','11 yrs experience','Vijayawada'], college:'IIT Bombay',
      about:'AI/ML researcher and professor with 11 years of experience across academia and applied research, including 3 patents and multiple funded projects. Passionate about mentoring students into research careers.',
      skills:['Machine Learning','Deep Learning','Python','TensorFlow','Research Mentorship','Grant Writing'],
      education:[
        ['PhD, Computer Science','IIT Bombay · 2010 – 2014'],
        ['MTech, Computer Science','VIT Vellore · 2008 – 2010']
      ],
      stats:[['22','Publications'],['340','Citations'],['3','Patents']],
      experience:[
        ['Professor, Computer Science','KL University · 2017 – Present'],
        ['Assistant Professor, CSE','VIT Vellore · 2012 – 2017']
      ],
      links:[
        ['PhD Certificate — IIT Bombay.pdf','doc'],
        ['Resume / CV.pdf','doc'],
        ['Publication list (Google Scholar)','link'],
        ['Patent certificates (3).pdf','doc'],
        ['Books published — list.pdf','doc']
      ],
      interests:{
        departments:['Computer Science','Artificial Intelligence'],
        designations:['Professor','HOD'],
        subjects:['Machine Learning','Deep Learning','Data Structures'],
        orgType:'University / Higher Education',
        location:'Vijayawada, Hyderabad',
        employmentType:'Full-time'
      },
      salary:{ presentCtc:1800000, expectedCtc:2400000, minAcceptable:2100000 }
    }
  };

  // ---------- Demo institutions + their posted jobs (for admin dashboard) ----------
  const institutionsData = {
    kluniversity:{ name:'KL University', type:'university', city:'Vijayawada, Andhra Pradesh', contact:'Radha Krishna', designation:'HR Head', email:'hr@kluniversity.in', phone:'+91 98480 12345', website:'www.kluniversity.in', joined:'Jan 2024',
      jobs:[
        { title:'Associate Professor — Physics', category:'University faculty', qualification:'PhD', location:'Vijayawada', applicants:14, status:'live', posted:'5 days ago' },
        { title:'Assistant Professor — Computer Science', category:'University faculty', qualification:'PhD', location:'Vijayawada', applicants:22, status:'live', posted:'1 week ago' },
        { title:'Professor — Mechanical Engineering', category:'University faculty', qualification:'PhD', location:'Vijayawada', applicants:9, status:'live', posted:'2 weeks ago' },
        { title:'Assistant Professor — Mathematics', category:'University faculty', qualification:'PhD', location:'Vijayawada', applicants:17, status:'closed', posted:'1 month ago' },
        { title:'Lab Coordinator — Electronics', category:'University faculty', qualification:'PG', location:'Vijayawada', applicants:6, status:'live', posted:'3 days ago' },
        { title:'Associate Professor — Biotechnology', category:'University faculty', qualification:'PhD', location:'Vijayawada', applicants:11, status:'closed', posted:'6 weeks ago' }
      ] },
    osmania:{ name:'Osmania University', type:'university', city:'Hyderabad, Telangana', contact:'Dr. Meena Rao', designation:'Registrar', email:'registrar@osmania.ac.in', phone:'+91 90000 11122', website:'www.osmania.ac.in', joined:'Mar 2024',
      jobs:[
        { title:'Professor — English Literature', category:'University faculty', qualification:'PhD', location:'Hyderabad', applicants:8, status:'live', posted:'4 days ago' },
        { title:'Assistant Professor — History', category:'University faculty', qualification:'PhD', location:'Hyderabad', applicants:12, status:'live', posted:'1 week ago' },
        { title:'Associate Professor — Political Science', category:'University faculty', qualification:'PhD', location:'Hyderabad', applicants:5, status:'closed', posted:'1 month ago' }
      ] },
    narayana:{ name:'Narayana Junior College', type:'college', city:'Chennai, Tamil Nadu', contact:'S. Venkatesh', designation:'Principal', email:'principal@narayanajc.in', phone:'+91 98765 43210', website:'www.narayanagroup.com', joined:'Feb 2024',
      jobs:[
        { title:'Senior Lecturer — Commerce', category:'Junior college', qualification:'PG', location:'Chennai', applicants:19, status:'live', posted:'2 days ago' },
        { title:'Lecturer — Mathematics (MPC)', category:'Junior college', qualification:'PG', location:'Chennai', applicants:27, status:'live', posted:'5 days ago' },
        { title:'Lecturer — Botany (BiPC)', category:'Junior college', qualification:'PG', location:'Chennai', applicants:15, status:'live', posted:'1 week ago' },
        { title:'Lecturer — Physics (MPC)', category:'Junior college', qualification:'PG', location:'Chennai', applicants:10, status:'closed', posted:'3 weeks ago' }
      ] },
    srichaitanya:{ name:'Sri Chaitanya College', type:'college', city:'Vijayawada, Andhra Pradesh', contact:'K. Suresh', designation:'HR Manager', email:'hr@srichaitanya.in', phone:'+91 91234 56789', website:'www.srichaitanya.in', joined:'Apr 2024',
      jobs:[
        { title:'Lecturer — Chemistry (MPC)', category:'Junior college', qualification:'PG', location:'Vijayawada', applicants:13, status:'live', posted:'6 days ago' },
        { title:'Lecturer — Zoology (BiPC)', category:'Junior college', qualification:'PG', location:'Vijayawada', applicants:8, status:'live', posted:'2 weeks ago' }
      ] },
    vitvellore:{ name:'VIT Vellore', type:'university', city:'Vellore, Tamil Nadu', contact:'Dr. Anand Krishnan', designation:'Dean, Faculty Affairs', email:'dean.fa@vit.ac.in', phone:'+91 90876 54321', website:'www.vit.ac.in', joined:'Dec 2023',
      jobs:[
        { title:'Assistant Professor — Cybersecurity', category:'University faculty', qualification:'PhD', location:'Vellore', applicants:24, status:'live', posted:'3 days ago' },
        { title:'Associate Professor — Data Science', category:'University faculty', qualification:'PhD', location:'Vellore', applicants:31, status:'live', posted:'1 week ago' },
        { title:'Professor — VLSI Design', category:'University faculty', qualification:'PhD', location:'Vellore', applicants:7, status:'live', posted:'2 weeks ago' },
        { title:'Assistant Professor — AI/ML', category:'University faculty', qualification:'PhD', location:'Vellore', applicants:29, status:'closed', posted:'5 weeks ago' },
        { title:'Lab Instructor — Robotics', category:'University faculty', qualification:'PG', location:'Vellore', applicants:16, status:'live', posted:'4 days ago' }
      ] },
    dpsHyderabad:{ name:'Delhi Public School', type:'school', city:'Hyderabad, Telangana', contact:'Ritu Sharma', designation:'HR Head', email:'hr@dpshyd.edu.in', phone:'+91 99887 76655', website:'www.dpshyderabad.com', joined:'May 2024',
      jobs:[
        { title:'PGT — Mathematics', category:'School faculty', qualification:'PG', location:'Hyderabad', applicants:21, status:'live', posted:'1 week ago' },
        { title:'TGT — Social Studies', category:'School faculty', qualification:'UG', location:'Hyderabad', applicants:18, status:'live', posted:'2 weeks ago' }
      ] },
    ctraining:{ name:'Computer Training Ltd', type:'college', city:'Rochester, NY, United States', contact:'Peter Smith', designation:'Director', email:'peter@ctrainingltd.com', phone:'585-908-7123', website:'www.ctrainingltd.com', joined:'Jun 2024',
      jobs:[
        { title:'Instructor — Networking Fundamentals', category:'Vocational training', qualification:'PG', location:'Rochester, NY', applicants:6, status:'live', posted:'5 days ago' }
      ] },
    coimbatoreArts:{ name:'Coimbatore Arts College', type:'college', city:'Coimbatore, Tamil Nadu', contact:'Dr. Latha Iyer', designation:'Principal', email:'principal@coimbatoreartscollege.edu.in', phone:'+91 94444 33221', website:'www.coimbatoreartscollege.edu.in', joined:'Jul 2024',
      jobs:[
        { title:'Assistant Professor — Fine Arts', category:'College faculty', qualification:'PG', location:'Coimbatore', applicants:9, status:'live', posted:'1 week ago' }
      ] },
    keralaCentral:{ name:'Kerala Central School', type:'school', city:'Kochi, Kerala', contact:'Thomas Jacob', designation:'HR Head', email:'hr@keralacentral.edu.in', phone:'+91 98470 22110', website:'www.keralacentralschool.in', joined:'Aug 2024',
      jobs:[
        { title:'PGT — English', category:'School faculty', qualification:'PG', location:'Kochi', applicants:12, status:'live', posted:'3 days ago' },
        { title:'PRT — Primary Teacher', category:'School faculty', qualification:'UG', location:'Kochi', applicants:20, status:'live', posted:'6 days ago' },
        { title:'TGT — Science', category:'School faculty', qualification:'PG', location:'Kochi', applicants:14, status:'closed', posted:'1 month ago' }
      ] },
    delhiCommerce:{ name:'Delhi School of Commerce', type:'school', city:'New Delhi, Delhi', contact:'Anjali Bhatia', designation:'Principal', email:'principal@delhicommerce.edu.in', phone:'+91 98100 44556', website:'www.delhicommerce.edu.in', joined:'Sep 2024',
      jobs:[
        { title:'PGT — Commerce', category:'School faculty', qualification:'PG', location:'New Delhi', applicants:16, status:'live', posted:'4 days ago' },
        { title:'TGT — Economics', category:'School faculty', qualification:'PG', location:'New Delhi', applicants:11, status:'live', posted:'1 week ago' }
      ] }
  };

  // ---------- Extra demo candidates (auto-generated, 17 more → 20 total) ----------
  (function(){
    const COLLEGE_POOL = [
      'IIT Bombay','IIT Delhi','IIT Madras','NIT Warangal','NIT Trichy','VNIT Nagpur',
      'IIIT Hyderabad','BITS Pilani','Anna University','Jadavpur University',
      'Osmania University','Delhi University','VIT Vellore','IIM Ahmedabad','Amrita University'
    ];
    const extra = [
      ['ravikumar','Dr. Ravi Kumar','Mathematics · Applied Statistics','PhD','9 yrs experience','Bengaluru',53],
      ['sneha','Sneha Reddy','English · Literature','PG','4 yrs experience','Hyderabad',44],
      ['arjun','Arjun Nair','Chemistry · Organic Chemistry','PhD','7 yrs experience','Kochi',22],
      ['meera','Meera Iyer','Biology · Zoology','PG','6 yrs experience','Chennai',31],
      ['vikram','Dr. Vikram Rao','Electronics · VLSI Design','PhD','13 yrs experience','Vijayawada',15],
      ['fatima','Fatima Sheikh','History · Indian History','PG','3 yrs experience','Hyderabad',29],
      ['karthik','Karthik Subramanian','Mechanical Engineering · Thermodynamics','PhD','10 yrs experience','Chennai',18],
      ['divya','Divya Prakash','Economics · Macroeconomics','PG','5 yrs experience','Vijayawada',36],
      ['suresh','Suresh Babu','Physical Education · Sports Science','UG','8 yrs experience','Bengaluru',52],
      ['pooja','Pooja Malhotra','Political Science · Public Policy','PG','4 yrs experience','Delhi',25],
      ['imran','Imran Ali','Computer Science · Cybersecurity','PhD','6 yrs experience','Hyderabad',13],
      ['lakshmi','Dr. Lakshmi Narayan','Mathematics · Number Theory','PhD','15 yrs experience','Chennai',49],
      ['rajesh','Rajesh Pillai','Commerce · Taxation','PG','7 yrs experience','Kochi',33],
      ['anitha','Anitha Krishnan','Biology · Botany','PG','5 yrs experience','Coimbatore',41],
      ['zoya','Zoya Khan','English · Linguistics','PhD','8 yrs experience','Hyderabad',24],
      ['manoj','Manoj Tiwari','Physics · Astrophysics','PhD','12 yrs experience','Delhi',11],
      ['harini','Harini Venkatesh','Computer Science · Data Science','PG','3 yrs experience','Bengaluru',45]
    ];
    extra.forEach(([id,name,role,qual,exp,city,imgNum], i)=>{
      const subject = role.split(' · ')[0];
      const specialization = role.split(' · ')[1] || subject;
      facultyProfiles[id] = {
        avatar:`https://i.pravatar.cc/160?img=${imgNum}`,
        name, role,
        tags:[qual, exp, city],
        college: COLLEGE_POOL[i % COLLEGE_POOL.length],
        about:`${name.replace(/^Dr\.\s*/,'')} is a ${subject} educator specializing in ${specialization}, with ${exp} teaching ${qual==='PhD' ? 'and research' : ''} experience based in ${city}. ${qual==='PhD' ? 'Actively engaged in research and student mentorship, ' : ''}Open to new academic opportunities.`,
        skills: qual==='PhD'
          ? [specialization, subject, 'Research Supervision', 'Academic Writing', 'Grant Applications', 'Curriculum Design']
          : [specialization, subject, 'Lesson Planning', 'Exam Preparation', 'Student Mentoring', 'Classroom Management'],
        education: qual==='PhD'
          ? [[`PhD, ${subject}`, `${COLLEGE_POOL[i % COLLEGE_POOL.length]} · 2008 – 2013`], [`MSc, ${subject}`, `${COLLEGE_POOL[(i+3) % COLLEGE_POOL.length]} · 2006 – 2008`]]
          : [[`${qual}, ${subject}`, `${COLLEGE_POOL[i % COLLEGE_POOL.length]} · 2016 – 2019`], [`BSc, ${subject}`, `${COLLEGE_POOL[(i+3) % COLLEGE_POOL.length]} · 2013 – 2016`]],
        stats: qual==='PhD'
          ? [[String(((i*7+3)%20)+3),'Publications'],[String(((i*53+17)%300)+40),'Citations'],[String(((i*5+1)%3)),'Patents']]
          : [[exp.split(' ')[0],'Yrs experience'],[String(((i*5+2)%3)+1),'Boards taught'],[String(((i*29+7)%150)+50)+'+','Students mentored']],
        experience:[
          [`${qual==='PhD' ? 'Associate Professor' : 'Lecturer'}, ${role.split(' · ')[0]}`, `${city} Institute of Technology · 2019 – Present`],
          [`${qual==='PhD' ? 'Assistant Professor' : 'Junior Lecturer'}, ${role.split(' · ')[0]}`, `${city} College · 2014 – 2019`]
        ],
        links:[
          [`${qual} Certificate.pdf`,'doc'],
          ['Resume / CV.pdf','doc'],
          ['Publication list (Google Scholar)','link']
        ]
      };
    });
  })();

  // ---------- Auto banner (deterministic gradient from name's first letter) ----------
  const BANNER_PALETTE = [
    ['#0A66C2','#2E8FE0'], ['#7C3AED','#A78BFA'], ['#0F766E','#2DD4BF'],
    ['#B45309','#F59E0B'], ['#BE123C','#FB7185'], ['#166534','#4ADE80'],
    ['#1D4ED8','#60A5FA'], ['#9D174D','#F472B6'], ['#4338CA','#818CF8'],
    ['#0369A1','#38BDF8'], ['#B91C1C','#F87171'], ['#065F46','#34D399'],
    ['#6D28D9','#C4B5FD'], ['#92400E','#FBBF24'], ['#374151','#9CA3AF']
  ];
  function bannerGradient(name){
    const letter = (name || '?').replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i,'').trim().charAt(0).toUpperCase();
    const idx = Math.max(0, letter.charCodeAt(0) - 65) % BANNER_PALETTE.length;
    const [c1,c2] = BANNER_PALETTE[idx];
    return `linear-gradient(135deg, ${c1}, ${c2})`;
  }

  const VERIFIED_TICK='<span class="verified-tick" title="Verified profile"><svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  function docIcon(type){
    return type==='link'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 14L20 4M20 4H13M20 4V11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 13V18C18 19.1 17.1 20 16 20H6C4.9 20 4 19.1 4 18V8C4 6.9 4.9 6 6 6H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  }

  let slideProfileId = null;
  function openProfile(id){
    if(!isLoggedIn){ openAuth('post'); return; }
    if(!facultyProfiles[id]) return;
    window.location.href = `candidate-profile.html?id=${encodeURIComponent(id)}`;
  }

  // ---------- Full candidate profile page renderer (used by candidate-profile.html) ----------
  function renderCandidateProfilePage(id){
    const p = facultyProfiles[id];
    if(!p){
      const root = document.getElementById('cpRoot');
      if(root) root.innerHTML = '<div style="padding:60px; text-align:center; color:var(--ink-faint);">Candidate not found.</div>';
      return;
    }
    slideProfileId = id;
    document.title = `${p.name} — Upadyay`;
    const cpBanner = document.getElementById('cpBanner');
    if(cpBanner) cpBanner.style.background = bannerGradient(p.name);
    document.getElementById('cpAvatar').style.backgroundImage = `url('${p.avatar}')`;
    document.getElementById('cpName').textContent = p.name;
    document.getElementById('cpRole').textContent = p.role;
    document.getElementById('cpTags').innerHTML = p.tags.map(t=>`<span class="hp-tag">${jbEsc(t)}</span>`).join('');
    // One shared profile UI (js/faculty-view.js): everything the faculty entered in their editor, incl. research + documents
    const cpView = document.getElementById('cpView');
    if(cpView) cpView.innerHTML = (window.FacultyView && p.view) ? FacultyView.html(p.view, { mode: 'viewer' }) : '<div class="fv-none">Profile details are not available yet.</div>';
    document.getElementById('cpCollege').textContent = p.college || '—';
    const strengthPct = (window.FacultyView && p.view) ? FacultyView.completion(p.view) : 0;
    document.getElementById('cpStrengthFill').style.width = strengthPct + '%';
    document.getElementById('cpStrengthNote').textContent = strengthPct + '% complete' + (strengthPct >= 90 ? ' — profile and documents added' : strengthPct >= 60 ? ' — most details added' : ' — some details not added yet');
    const cpTick = document.querySelector('.cp-verified'); if(cpTick) cpTick.style.display = p.verified ? '' : 'none';

    let actions = document.getElementById('cpActions');
    if(currentRole==='company'){
      actions.style.display = 'flex';
      actions.innerHTML = `
        <button class="btn btn-light" onclick="messageCandidate('${id}')">Message</button>
        ${candidateStatus[id]==='shortlisted'
          ? `<button class="btn btn-ghost" onclick="Promise.resolve(undoApplicant('${id}')).then(function(){ renderCandidateProfilePage('${id}'); })">Remove shortlist</button>`
          : `<button class="btn btn-primary" onclick="Promise.resolve(shortlistCandidate('${id}')).then(function(){ renderCandidateProfilePage('${id}'); })">Shortlist</button>`}
        ${candidateStatus[id]==='invited' || candidateStatus[id]==='shortlisted' ? '' : `<button class="btn btn-ghost" onclick="Promise.resolve(inviteCandidate('${id}')).then(function(){ renderCandidateProfilePage('${id}'); })">Invite candidate</button>`}
      `;
    } else {
      actions.style.display = 'none';
    }
  }

  function switchDashTab(which){
    // Only "My profile" exists now — Browse jobs tab was removed. Kept as a no-op
    // so any legacy calls to switchDashTab('profile') don't error.
    const pf = document.getElementById('dashProfileTab');
    if(pf) pf.style.display = 'block';
  }


  /* Post a job / Posted jobs / Browse candidates stay locked until an admin approves the institution. */
  const LOCKED_EMP_TABS = ['post','myjobs','candidates'];
  function employerApproved(){ return String((currentCompany && currentCompany.verification) || '').toLowerCase() === 'approved'; }
  function applyEmployerLock(){
    const $ = id => document.getElementById(id);
    const locked = !employerApproved();
    [['subtabPost','post'],['subtabMyJobs','myjobs'],['subtabCandidates','candidates']].forEach(function(x){
      const b = $(x[0]); if(!b) return;
      b.classList.toggle('is-locked', locked);
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.title = locked ? 'Locked until an admin approves your institution' : '';
    });
    const bar = $('employerTabsBar'); if(!bar) return;
    let note = $('empLockNote');
    if(locked && !note){
      note = document.createElement('div'); note.id = 'empLockNote'; note.className = 'emp-lock-note';
      note.textContent = 'Post a job, Posted jobs and Browse candidates unlock once an admin approves your institution. Complete and submit your institution profile to get reviewed.';
      bar.insertAdjacentElement('afterend', note);
    } else if(!locked && note){ note.remove(); }
    if(locked){
      const cur = (function(){ try{ return sessionStorage.getItem('upadyay_emp_tab'); }catch(e){ return null; } })();
      if(LOCKED_EMP_TABS.indexOf(cur) !== -1) switchEmployerTab('company');
    }
    if(typeof instRender === 'function') instRender();   // refresh the Branches section when approval status is known
  }
  window.applyEmployerLock = applyEmployerLock;

  function switchEmployerTab(which){
    if(!window.__empLoad) window.__empApps = false;
    const $ = id => document.getElementById(id);
    if(!$('dashCompanyTab')) return;               // not on the employer page
    if(which !== 'post' && editingJobId){ cancelEditJob(); }   // leaving the form ends an edit, so the next post is a new job
    if(LOCKED_EMP_TABS.indexOf(which) !== -1 && !employerApproved()){
      which = 'company';
      if(typeof showGenericToast === 'function') showGenericToast('Locked until an admin approves your institution.');
    }
    try{ sessionStorage.setItem('upadyay_emp_tab', which); }catch(e){}   // so a reload stays on this tab
    $('dashCompanyTab').style.display = which==='company' ? 'block' : 'none';
    $('dashPostTab').style.display = which==='post' ? 'block' : 'none';
    $('dashCandidatesTab').style.display = which==='candidates' ? 'block' : 'none';
    const myJobsTab = $('dashMyJobsTab');
    if(myJobsTab) myJobsTab.style.display = which==='myjobs' ? 'block' : 'none';
    $('subtabCompany').classList.toggle('active', which==='company');
    $('subtabPost').classList.toggle('active', which==='post');
    $('subtabCandidates').classList.toggle('active', which==='candidates');
    const myJobsSubtab = $('subtabMyJobs');
    if(myJobsSubtab) myJobsSubtab.classList.toggle('active', which==='myjobs');
    $('candidateListWrap').style.display = which==='candidates' ? 'block' : 'none';
    $('apListWrap').style.display = 'none';
    const _av = $('applicantsView'); if(_av) _av.style.display = 'none';
    if(!window.__empLoad){ try{ sessionStorage.removeItem('upadyay_emp_view'); }catch(e){} }
    if(which==='candidates') renderCandidates();
    if(which==='post'){ renderPostedJobs(); if(typeof instFillCampuses==='function') instFillCampuses(); }
    if(which==='company' && typeof instRender==='function') instRender();
    if(typeof instHeader==='function') instHeader();
    if(which==='myjobs') renderMyJobsCards();
  }

  // Dedicated "Posted jobs" view: a card per job with its applicant count,
  // reached from the mini profile panel / "Jobs posted" stat.
  function renderMyJobsCards(){
    const wrap = document.getElementById('myJobsList');
    if(!wrap) return;
    try{
      const av = document.getElementById('applicantsView');
      if(av && av.style.display !== 'none' && activeJobId && jobsData[activeJobId]) renderApplicants(activeJobId);
      else if(window.__empApps && document.getElementById('apListWrap').style.display !== 'none') paintAllApplicants();
    }catch(e){}
    const ids = Object.keys(jobsData);
    const countEl = document.getElementById('myJobsCount');
    if(countEl) countEl.textContent = ids.length + (ids.length===1 ? ' job posted' : ' jobs posted');
    if(!ids.length){
      wrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 20H7a2 2 0 01-2-2V6a2 2 0 012-2h6l6 6v8a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/></svg></div>
          <h4>No jobs posted yet</h4>
          <p>Once you post a job, it'll show up here as a card with its applicant count.</p>
        </div>`;
      return;
    }
    wrap.innerHTML = ids.slice().reverse().map(id=>{ try{
      const job = jobsData[id];
      const count = Math.max((job.applicantIds || []).length, Number(job.applicantCount) || 0);
      const meta = [job.category, job.qualification, job.location].filter(Boolean).join(' \u00b7 ') || 'Posted just now';
      const extra = jobExtra(job);
      return `
      <div class="job-card pj-card" onclick="openApplicantsView('${id}')">
        <span class="pj-badge">${typeof bkStatusBadge==='function' ? bkStatusBadge(job) : ''}</span>
        <div class="job-logo pj-logo" style="${companyLogoStyle()}"></div>
        <div class="pj-college">${jbEsc((currentCompany && currentCompany.name) || 'Your institution')}</div>
        <div class="pj-role">${jbEsc(job.title || job.role)}</div>
        <div class="pj-price">${jbEsc(jobPriceText(job))}</div>
        <div class="pj-count"><b>${count}</b> ${count===1?'applicant':'applicants'}</div>
        <div class="pj-line"></div>
        <button class="pj-view" onclick="event.stopPropagation(); openApplicantsView('${id}')">View applicants (${count})</button>
        <div class="pj-actions">${jobActionButtons(id, job)}</div>
      </div>`;
    }catch(err){ console.error('Posted job card failed', id, err); return '<div class="job-card" style="color:#B3261E">Card error: '+jbEsc(err && err.message)+'</div>'; } }).join('');
  }

  function previewLogo(e){
    const file = e.target.files[0];
    if(!file) return;
    const input = e.target;
    const apply = function(url){
      if(window.IN && IN.setLogo){ IN.setLogo(url); return; }   /* the institution form uploads it and only keeps it if the upload works */
      currentCompany.logo = url;
      saveState();
      refreshDashTopAccount();
      if(typeof updateNavForLogin === 'function') updateNavForLogin();
      const img = document.getElementById('logoPreview');
      if(img){ img.src = url; img.style.display = 'block'; }
      const ph = document.getElementById('logoPlaceholder'); if(ph) ph.style.display = 'none';
      if(window.IN && IN.setLogo) IN.setLogo(url);
    };
    if(window.LogoCrop){ LogoCrop.open(file, apply); }
    else { const reader = new FileReader(); reader.onload = function(ev){ apply(ev.target.result); }; reader.readAsDataURL(file); }
    input.value = '';
  }

  // ---------- Company profile ----------
  // currentCompany now lives in store.js (persisted across pages)

  function saveCompany(){
    const _nm = document.getElementById('coName');
    if(!_nm || !_nm.value.trim()){ if(typeof showGenericToast === 'function') showGenericToast('Use the institution profile form to save your details.'); return; }   /* the old hidden form is empty: never overwrite the real profile with blanks */
    currentCompany.name = document.getElementById('coName').value || 'Your institution';
    currentCompany.type = document.getElementById('coType').value;
    currentCompany.city = document.getElementById('coCity').value;
    currentCompany.website = document.getElementById('coWebsite').value;
    currentCompany.desc = document.getElementById('coDesc').value;
    currentCompany.contactName = document.getElementById('coContactName').value;
    currentCompany.designation = document.getElementById('coDesignation').value;
    currentCompany.email = document.getElementById('coEmail').value;
    currentCompany.phone = document.getElementById('coPhone').value;
    currentCompany.saved = true;
    saveState();
    document.getElementById('dashName').textContent = currentCompany.name;
    document.getElementById('dashAvatar').textContent = currentCompany.name.slice(0,2).toUpperCase();
    document.getElementById('dashSub').textContent = 'Your poster panel — post jobs, review and invite candidates';
    
    document.getElementById('employerTabsBar').style.display = 'flex';
    refreshDashTopAccount();
    switchEmployerTab(employerApproved() ? 'post' : 'company');
    const note = document.getElementById('coSavedNote');
    note.style.display = 'inline';
    setTimeout(()=>{ note.style.display = 'none'; }, 2500);
  }

  function companyInitials(){
    return (currentCompany.name || 'IN').trim().slice(0,2).toUpperCase();
  }
  function companyLogoStyle(){
    return currentCompany.logo
      ? `background-image:url('${currentCompany.logo}'); background-size:cover;`
      : `background:var(--blue-700);`;
  }

  // ---------- Candidate pool + application status ----------
  // status per candidate id: 'applied' | 'invited' | 'shortlisted'
  // candidateStatus now lives in store.js (persisted across pages)

  function statusBadge(id){
    const s = candidateStatus[id];
    if(s==='shortlisted') return '<span class="badge badge-accepted">Shortlisted</span>';
    if(s==='invited') return '<span class="badge badge-pending">Invited</span>';
    if(s==='rejected') return '<span class="badge badge-pending" style="background:#FDECEA;color:#B3261E">Rejected</span>';
    return '';
  }

  /* These actions need the server. backend.js replaces them with the real versions; if it did not load, say so instead of pretending. */
  function _notConnected(ev){ if(ev && ev.stopPropagation) ev.stopPropagation(); if(typeof showGenericToast === 'function') showGenericToast('Not connected to the server. Reload the page and try again.'); }
  function inviteCandidate(id, ev){ _notConnected(ev); }
  function shortlistCandidate(id, ev){ _notConnected(ev); }
  function rejectCandidate(id, ev){ _notConnected(ev); }
  function undoApplicant(id, ev){ _notConnected(ev); }
  function messageCandidate(id, ev){ _notConnected(ev); }

  /* Small dialogs used instead of the browser's prompt() box. */
  function _dlg(html){
    const m = document.createElement('div'); m.className = 'in-modal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true');
    m.innerHTML = '<div>' + html + '</div>'; document.body.appendChild(m); return m;
  }
  function empAsk(name, def){
    return new Promise(function(resolve){
      const m = _dlg('<h4 style="margin:0 0 10px;font-size:18px">Message ' + jbEsc(name) + '</h4><textarea id="empAskTxt" rows="5" maxlength="2000" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;font:inherit">' + jbEsc(def || '') + '</textarea><div class="in-actions"><span></span><div class="r"><button type="button" class="btn btn-ghost btn-sm" id="empAskNo">Cancel</button><button type="button" class="btn btn-primary btn-sm" id="empAskYes">Send message</button></div></div>');
      const done = function(v){ m.remove(); resolve(v); };
      m.querySelector('#empAskNo').onclick = function(){ done(null); };
      m.querySelector('#empAskYes').onclick = function(){ const v = m.querySelector('#empAskTxt').value.trim(); if(v) done(v); };
      m.addEventListener('click', function(e){ if(e.target === m) done(null); });
      setTimeout(function(){ const t = m.querySelector('#empAskTxt'); if(t) t.focus(); }, 30);
    });
  }
  /* Ask which job an invitation is for (resolves to the server job id, or null if cancelled). */
  function empPickJob(){
    return new Promise(function(resolve){
      const jobs = Object.keys(jobsData).map(function(k){ return jobsData[k]; }).filter(function(j){ return j.status === 'published'; });
      if(!jobs.length){ if(typeof showGenericToast === 'function') showGenericToast('Post and publish a job first, then invite candidates to it.'); resolve(null); return; }
      if(jobs.length === 1){ resolve(jobs[0].id); return; }
      const m = _dlg('<h4 style="margin:0 0 10px;font-size:18px">Invite to which job?</h4><select id="empPickSel" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;font:inherit">' + jobs.map(function(j){ return '<option value="' + jbEsc(j.id) + '">' + jbEsc(j.title) + (j.campus ? ' · ' + jbEsc(j.campus) : '') + '</option>'; }).join('') + '</select><div class="in-actions"><span></span><div class="r"><button type="button" class="btn btn-ghost btn-sm" id="empPickNo">Cancel</button><button type="button" class="btn btn-primary btn-sm" id="empPickYes">Send invitation</button></div></div>');
      const done = function(v){ m.remove(); resolve(v); };
      m.querySelector('#empPickNo').onclick = function(){ done(null); };
      m.querySelector('#empPickYes').onclick = function(){ done(m.querySelector('#empPickSel').value); };
      m.addEventListener('click', function(e){ if(e.target === m) done(null); });
    });
  }
  window.empAsk = empAsk; window.empPickJob = empPickJob;

  /* Faculty details shown on every candidate card */
  function facInfoHTML(p){
    const rows = [];
    const qual = (p.education && p.education[0] && (Array.isArray(p.education[0]) ? p.education[0][0] : (p.education[0].degree || p.education[0].title))) || (p.tags && p.tags[0]) || '';
    const expTag = (p.tags || []).filter(t=>/experience/i.test(t))[0] || '';
    const locTag = (p.tags || []).filter(t=>!/experience/i.test(t) && t !== qual)[0] || '';
    if(qual) rows.push(['Qualification', qual]);
    if(expTag) rows.push(['Experience', expTag.replace(/\s*experience/i,'')]);
    if(p.college) rows.push(['Institution', p.college]);
    if(locTag) rows.push(['Location', locTag]);
    const st = p.stats || [];
    const pubs = st.map(x=>x[0]+' '+x[1]).filter(x=>!/^0 /.test(x)).join(' · ');
    if(pubs) rows.push(['Research', pubs]);
    const skills = (p.skills || []).slice(0,4);
    if(!rows.length) return `<div class="pc-info"><div class="pc-empty">Profile details not added yet</div></div><div class="jc-tags"></div>`;
    return `<div class="pc-info">${rows.map(r=>`<div class="pc-row"><span>${jbEsc(r[0])}</span><b title="${jbEsc(r[1])}">${jbEsc(r[1])}</b></div>`).join('')}</div>`
      + `<div class="jc-tags">${skills.map(t=>`<span class="hp-tag">${jbEsc(t)}</span>`).join('')}</div>`;
  }

  /* College short code: "IIIT Nagpur" -> IIIT, "Andhra University" -> AU */
  function collegeShort(name){
    const n = String(name || '').trim();
    if(!n) return '';
    const caps = n.split(/[\s,.\-]+/).filter(w=>/^[A-Z]{2,6}$/.test(w))[0];
    if(caps) return caps;
    const ini = n.split(/[\s,.\-]+/).filter(w=>w && !/^(of|the|and|for|&|in)$/i.test(w)).map(w=>w[0].toUpperCase()).join('');
    return ini.slice(0,5);
  }

  /* Saved candidates (employer's shortlist-for-later), kept in this browser */
  function savedCands(){ try{ return JSON.parse(localStorage.getItem('upaadhyay_saved_cands')||'[]'); }catch(e){ return []; } }
  function saveCandidate(id, ev){
    if(ev) ev.stopPropagation();
    let l = savedCands(); l = l.indexOf(id)>-1 ? l.filter(x=>x!==id) : l.concat(id);
    try{ localStorage.setItem('upaadhyay_saved_cands', JSON.stringify(l)); }catch(e){}
    renderCandidates(false);
  }
  function downloadCandidateCV(id, ev){
    if(ev) ev.stopPropagation();
    const p = facultyProfiles[id];
    const cv = ((p && p.links) || []).filter(l=>/resume|\bcv\b/i.test(l[0] || ''))[0];
    if(cv && cv[2]) window.open(cv[2], '_blank');
    else alert('This candidate has not uploaded a CV yet.');
  }
  function toggleCandMenu(id, ev){
    if(ev) ev.stopPropagation();
    const m = document.getElementById('cm-'+id), open = m && m.classList.contains('open');
    document.querySelectorAll('.cr-menu.open').forEach(x=>x.classList.remove('open'));
    if(m && !open) m.classList.add('open');
  }
  document.addEventListener('click', function(){ document.querySelectorAll('.cr-menu.open,.pf-menu.open').forEach(x=>x.classList.remove('open')); });

  function candidateCardHTML(id){
    const p = facultyProfiles[id];
    if(!p) return '';
    const ed = (p.education || [])[0];
    const edTitle = Array.isArray(ed) ? ed[0] : (ed && (ed.degree || ed.title)) || '';
    const qual = highestDegree(p) || edTitle || (p.tags && p.tags[0]) || '';
    const expTag = (p.tags || []).filter(t=>/experience/i.test(t))[0] || '';
    const exp = expTag ? expTag.replace(/\s*experience/i,'').trim() : '';
    const loc = (p.tags || []).filter(t=>!/experience/i.test(t) && t !== qual)[0] || '';
    const roleLine = p.role || 'Faculty';
    const colShort = collegeShort(p.college);
    const chipList = [{t:qual, tip:'Highest qualification'}, {t:colShort, tip:p.college || ''}].concat((p.skills || []).map(t=>({t:t, tip:''}))).filter(c=>c.t).filter((c,i,a)=>a.findIndex(x=>x.t.toLowerCase()===c.t.toLowerCase())===i);
    const shown = chipList.slice(0,4), more = chipList.length - shown.length;
    const meta = [p.college ? 'Studied at ' + p.college : '', loc, exp ? exp + ' exp' : ''].filter(Boolean).join(' \u00b7 ');
    const ini = String(p.name||'?').replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i,'').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || '?';
    const av = p.avatar ? `<span class="cn-av" style="background-image:url('${jbEsc(p.avatar)}')"></span>` : `<span class="cn-av cn-av-ini">${jbEsc(ini)}</span>`;
    const st = statusBadge(id);
    const saved = savedCands().indexOf(id) > -1;
    const SHIELD = '<span class="pf-ver" title="Verified profile"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg></span>';
    const avPf = p.avatar ? `<div class="pf-av" style="background-image:url('${jbEsc(p.avatar)}')"></div>` : `<div class="pf-av">${jbEsc(ini)}</div>`;
    const flag = p.openToWork ? 'Open to opportunities' : '';
    const sub = [roleLine, qual].filter(Boolean).join(' \u00b7 ');
    const where = [p.college ? 'Studied at ' + p.college : '', loc].filter(Boolean).join(' \u00b7 ');
    return `
      <div class="pf-card" onclick="openProfile('${id}')">
        <div class="pf-cover"><span class="pf-flag">${flag}</span></div>
        ${avPf}
        <div class="pf-body">
          <h3 class="pf-name"><span>${jbEsc(p.name)}</span>${p.verified ? SHIELD : ''}</h3>
          <div class="pf-sub">${jbEsc(sub)}</div>
          <div class="pf-meta">${where ? jbEsc(where) : 'Profile details not added yet'}</div>
          ${shown.length ? `<div class="pf-chips">${shown.map(c=>`<span class="pf-chip" title="${jbEsc(c.tip)}">${jbEsc(c.t)}</span>`).join('')}${more>0 ? `<span class="pf-chip">+${more}</span>` : ''}</div>` : ''}
          <div class="pf-stats">${[exp ? exp + ' experience' : '', st ? '' : ''].filter(Boolean).join(' \u00b7 ')}${st ? st : ''}</div>
          <div class="pf-acts">
            <button class="pf-btn pri" onclick="event.stopPropagation(); openProfile('${id}')">View profile</button>
            ${candidateStatus[id]==='shortlisted'
              ? `<button class="pf-btn out" disabled>Shortlisted</button>`
              : `<button class="pf-btn out" onclick="event.stopPropagation(); inviteCandidate('${id}', event)">${candidateStatus[id]==='invited' ? 'Invited \u2713' : 'Invite'}</button>`}
            <button class="pf-more" aria-label="More" onclick="event.stopPropagation();var m=this.nextElementSibling,o=m.classList.contains('open');document.querySelectorAll('.pf-menu.open').forEach(function(x){x.classList.remove('open')});if(!o)m.classList.add('open')">&middot;&middot;&middot;</button>
            <div class="pf-menu">
              <button onclick="messageCandidate('${id}', event)">Message</button>
              <button onclick="saveCandidate('${id}', event)">${saved?'Saved \u2713':'Save'}</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* Highest degree from a faculty profile (PhD > Master's > Bachelor's > anything else) */
  function highestDegree(p){
    const list = (p.education || []).map(e=>Array.isArray(e) ? (e[0] || '') : (e.degree || e.title || '')).filter(Boolean);
    const rank = d=> /ph\.?d|doctor/i.test(d) ? 4 : /m\.?(sc|a|tech|com|ed|phil)\b|master|mba|mca/i.test(d) ? 3 : /b\.?(sc|a|tech|com|ed)\b|bachelor|b\.?e\b/i.test(d) ? 2 : 1;
    list.sort((a,b)=>rank(b)-rank(a));
    return list[0] || (p.tags && p.tags[0]) || '';
  }

  /* Applicant card: one per row — banner + avatar, name, role, job applied for, highest degree */
  function applicantCardHTML(id){
    const p = facultyProfiles[id] || { name:'Applicant', role:'Faculty', avatar:'', education:[], tags:[] };
    const jobs = Object.keys(jobsData).filter(k=>(jobsData[k].applicantIds||[]).indexOf(id)>-1).map(k=>jobsData[k].title);
    const deg = highestDegree(p);
    const ini = String(p.name||'?').replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i,'').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || '?';
    const av = p.avatar ? `<div class="ap-avatar" style="background-image:url('${jbEsc(p.avatar)}');"></div>` : `<div class="ap-avatar ap-avatar-ini">${jbEsc(ini)}</div>`;
    return `
      <div class="job-card ap-card" onclick="openProfile('${id}')">
        <div class="ap-banner" style="background:${bannerGradient(p.name)};">${av}</div>
        <div class="ap-body">
          <div class="ap-info">
            <p class="ap-name">${jbEsc(p.name)}${p.verified?VERIFIED_TICK:''}</p>
            <p class="ap-role">${jbEsc(p.role || 'Faculty')}</p>
            <div class="ap-tags">${statusBadge(id)}
              ${jobs.length ? `<span class="ap-tag ap-tag-job">Applied for: ${jbEsc(jobs[0])}${jobs.length>1 ? ' +'+(jobs.length-1) : ''}</span>` : ''}
              ${deg ? `<span class="ap-tag ap-tag-deg">${jbEsc(deg)}</span>` : ''}
            </div>
          </div>
          <div class="ap-actions">
            <button class="btn btn-light btn-sm" onclick="event.stopPropagation(); messageCandidate('${id}', event)">Message</button>
            ${candidateStatus[id]==='shortlisted'
              ? `<button class="btn btn-light btn-sm" onclick="event.stopPropagation(); undoApplicant('${id}', event)">Remove shortlist</button>`
              : candidateStatus[id]==='rejected'
                ? `<button class="btn btn-light btn-sm" onclick="event.stopPropagation(); undoApplicant('${id}', event)">Undo reject</button>`
                : `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); shortlistCandidate('${id}', event)">Shortlist</button><button class="btn btn-ghost btn-sm" style="color:#B3261E;border-color:#B3261E" onclick="event.stopPropagation(); rejectCandidate('${id}', event)">Reject</button>`}
          </div>
        </div>
      </div>`;
  }

  const CAND_PAGE_SIZE = 6;
  let candVisibleCount = CAND_PAGE_SIZE;

  function renderCandidates(resetPaging){
    if(resetPaging !== false) candVisibleCount = CAND_PAGE_SIZE;
    const q = (document.getElementById('candSearch').value || '').toLowerCase();
    const lq = ((document.getElementById('candLocation') || {}).value || '').toLowerCase();
    const ids = Object.keys(facultyProfiles).filter(id=>{
      const p = facultyProfiles[id];
      const hay = [p.name, p.role, p.college].concat(p.skills || []).join(' ').toLowerCase();
      const lhay = [p.college].concat(p.tags || []).join(' ').toLowerCase();
      return (!q || hay.includes(q)) && (!lq || lhay.includes(lq));
    });
    const visibleIds = ids.slice(0, candVisibleCount);
    document.getElementById('candidateList').innerHTML = visibleIds.map(candidateCardHTML).join('') || `
      <div class="empty-state">
        <div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 20H7a2 2 0 01-2-2V6a2 2 0 012-2h6l6 6v8a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14" r="2.5" stroke="currentColor" stroke-width="2"/></svg></div>
        <h4>No profiles found</h4>
        <p>No published profiles match your search and filters yet. Try clearing a filter or broadening your search.</p>
      </div>`;
    document.getElementById('candidateCount').textContent = ids.length + (ids.length===1 ? ' profile found' : ' profiles found');

    const moreWrap = document.getElementById('candidateShowMoreWrap');
    if(moreWrap){
      const remaining = ids.length - visibleIds.length;
      if(remaining > 0){
        moreWrap.style.display = 'flex';
        document.getElementById('candidateShowMoreBtn').textContent = `View more (${remaining})`;
      } else {
        moreWrap.style.display = 'none';
      }
    }
  }
  document.addEventListener('input', function(e){ if(e.target && (e.target.id==='candSearch' || e.target.id==='candLocation')) renderCandidates(); });
  function showMoreCandidates(){
    candVisibleCount += CAND_PAGE_SIZE;
    renderCandidates(false);
  }

  // ---------- Jobs + applicants ----------
  // job counter now lives in store.js as postedJobCount
  let activeJobId = null;
  let editingJobId = null;   // set while the Post-a-job form is editing an existing job
  const jobsData = postedJobs; // persisted in store.js: id -> {title, category, qualification, location, applicantIds}
  const allCandidateIds = Object.keys(facultyProfiles);

  // ---------- Post a job: helpers ----------
  function jbEsc(x){ return String(x==null?'':x).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  // A dropdown value, or the text typed in its "Other" box (falls back to "Other" if left empty)
  function jbPick(id){ const el = document.getElementById(id); const val = ((el && el.value) || '').trim(); if(val !== 'Other') return val; const o = document.getElementById(id + 'Other'); return ((o && o.value) || '').trim() || 'Other'; }
  function jbClear(k){ const f = document.getElementById('jf-'+k); if(f) f.classList.remove('err'); }
  function jbErr(k, m){ const f = document.getElementById('jf-'+k); if(!f) return; f.classList.add('err'); const e = f.querySelector('.in-err'); if(e) e.textContent = m; }
  function jbMoney(n){ return '₹' + Number(n).toLocaleString('en-IN'); }
  // One-line summary of the new job fields (role, experience, salary, notice period). Plain text.
  function jobPriceText(job){
    if(job.salMin) return jbMoney(job.salMin) + '\u2013' + jbMoney(job.salMax) + ' / ' + (job.salPeriod === 'year' ? 'yr' : 'mo');
    if(job.salNorms) return 'As per UGC / AICTE norms';
    if(job.salNeg) return 'Negotiable';
    return 'Salary not specified';
  }
  function jobExtra(job){
    const parts = [];
    if(job.role) parts.push(job.role);
    if(job.expMin !== undefined && job.expMin !== ''){
      parts.push(job.expMin + ((job.expMax !== undefined && job.expMax !== '') ? '–' + job.expMax : '+') + ' yrs experience');
    }
    if(job.salMin){
      parts.push(jbMoney(job.salMin) + '–' + jbMoney(job.salMax) + ' / ' + (job.salPeriod === 'year' ? 'year' : 'month') + (job.salNeg ? ' (negotiable)' : ''));
    } else if(job.salNorms){
      parts.push('Pay as per UGC / AICTE norms');
    } else if(job.salNeg){
      parts.push('Salary negotiable');
    }
    if(job.notice) parts.push('Notice: ' + job.notice);
    return parts.join(' · ');
  }


  /* "Ask Questions" step: keep each job's Q&A settings so the job page can show them (kept in this browser until the API supports it). */
  function jbSaveQa(id){
    if(!id) return;
    const g = function(i){ const el = document.getElementById(i); return el ? (el.value || '').trim() : ''; };
    const on = document.getElementById('jbQaOn');
    try{ localStorage.setItem('upaadhyay_jobqa_' + id, JSON.stringify({ on: on ? !!on.checked : true, contact: g('jbQaContact'), faq: g('jbQaFaq'), questions: (window.QA ? QA.get('jbQaList') : []) })); }catch(e){}
  }
  function jbLoadQa(id, qa){
    let q = qa || {}; if(!qa){ try{ q = JSON.parse(localStorage.getItem('upaadhyay_jobqa_' + id) || '{}'); }catch(e){} }
    const on = document.getElementById('jbQaOn'), c = document.getElementById('jbQaContact'), f = document.getElementById('jbQaFaq');
    if(on) on.checked = q.on !== false; if(c) c.value = q.contact || ''; if(f) f.value = q.faq || '';
    if(window.QA) QA.set('jbQaList', q.questions || []);
  }
  function addJob(e){
    if(e && e.preventDefault) e.preventDefault();
    const v = id => (document.getElementById(id).value || '').trim();
    const chk = id => !!document.getElementById(id).checked;
    ['title','role','category','dept','type','qual','notice','exp','expmax','salmin','salmax','campus','vac','deadline'].forEach(jbClear);

    const title = v('jbTitle'), role = (v('jbRole') === 'Other' && v('jbRoleOther')) ? v('jbRoleOther') : v('jbRole'), category = jbPick('jbCategory'), dept = v('jbDept'), type = jbPick('jbType');
    const qualification = jbPick('jbQualification'), notice = jbPick('jbNotice');
    const expMin = v('jbExpMin'), expMax = v('jbExpMax');
    const salMin = v('jbSalMin'), salMax = v('jbSalMax'), salPeriod = v('jbSalPeriod') || 'month';
    const salNeg = chk('jbSalNeg'), salNorms = chk('jbSalNorms');
    const campusVal = v('jbCampus');
    const vacV = v('jbVac'), dlV = v('jbDeadline');
    const editingNow = (editingJobId && jobsData[editingJobId]) ? jobsData[editingJobId] : null;
    const todayISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    let first = null;
    const bad = (k, m) => { jbErr(k, m); if(!first) first = k; };
    if(!title) bad('title', 'Enter the job title');
    if(!role) bad('role', 'Select the role');
    if(!category) bad('category', 'Select a category');
    if(!dept) bad('dept', 'Enter the department or subject');
    if(!type) bad('type', 'Select the employment type');
    if(!qualification) bad('qual', 'Select the qualification needed');
    if(!notice) bad('notice', 'Select the notice period you accept');
    if(expMin === '') bad('exp', 'Enter minimum experience. Use 0 for freshers');
    else if(!(Number(expMin) >= 0 && Number(expMin) <= 50)) bad('exp', 'Enter a number between 0 and 50');
    if(expMax !== '' && Number(expMax) < Number(expMin || 0)) bad('expmax', 'Maximum cannot be lower than minimum');
    if(!salNorms){
      if(salMin === '' || !(Number(salMin) > 0)) bad('salmin', 'Enter the minimum salary');
      if(salMax === '' || !(Number(salMax) > 0)) bad('salmax', 'Enter the maximum salary');
      else if(salMin !== '' && Number(salMax) < Number(salMin)) bad('salmax', 'Maximum cannot be lower than minimum');
    }
    if(!campusVal) bad('campus', 'Select the campus for this job');
    if(vacV !== '' && !(Number.isInteger(Number(vacV)) && Number(vacV) >= 1)) bad('vac', 'Enter a whole number of 1 or more');
    if(expMax !== '' && Number(expMax) > 50) bad('expmax', 'Enter a number between 0 and 50');
    if(dlV && dlV < todayISO && !(editingNow && editingNow.deadline === dlV)) bad('deadline', 'Choose today or a later date');

    if(first){
      const el = document.querySelector('#jf-'+first+' input, #jf-'+first+' select');
      if(el){ try{ el.focus({preventScroll:true}); }catch(e){ el.focus(); } }
      return null;
    }

    let campus = '', campusLoc = '';
    if(typeof instCampusOptions === 'function'){
      const opt = instCampusOptions().find(o => o.v === campusVal);
      if(opt){ campus = opt.n; campusLoc = opt.loc; }
    }
    const location = v('jbLocation') || campusLoc;
    const jobPayload = {
      title, role, dept, type, category, qualification, notice,
      vacancies: v('jbVac'), expMin, expMax, salMin: salNorms ? '' : salMin, salMax: salNorms ? '' : salMax, salPeriod, salNeg, salNorms,
      qa: { on: chk('jbQaOn'), contact: v('jbQaContact'), faq: '', questions: (window.QA ? QA.get('jbQaList') : []) },
      campus, campusLoc, location, desc: v('jbDesc'), skills: v('jbSkills'), deadline: v('jbDeadline')
    };
    const editing = (editingJobId && jobsData[editingJobId]) ? jobsData[editingJobId] : null;
    return (editing ? bkUpdateJob(editing.id, jobPayload) : bkPostJob(jobPayload)).then(function(res){
    jbSaveQa((res && res.id) || (editing && editing.id));
    if(editing) endEditJob();

    // reset the form and confirm
    ['jbTitle','jbRole','jbRoleOther','jbCategory','jbCategoryOther','jbDept','jbType','jbTypeOther','jbVac','jbQualification','jbQualificationOther','jbNotice','jbNoticeOther','jbExpMin','jbExpMax','jbSalMin','jbSalMax','jbLocation','jbDesc','jbSkills','jbDeadline','jbCampus','jbQaContact','jbQaFaq'].forEach(i=>{ const el = document.getElementById(i); if(el) el.value = ''; });
    ['jbRoleOther','jbCategoryOther','jbTypeOther','jbQualificationOther','jbNoticeOther'].forEach(i=>{ const el = document.getElementById(i); if(el) el.style.display = 'none'; });
    document.getElementById('jbSalPeriod').value = 'month';
    document.getElementById('jbSalNeg').checked = false;
    document.getElementById('jbSalNorms').checked = false;
    const qaOn = document.getElementById('jbQaOn'); if(qaOn) qaOn.checked = true; if(window.QA) QA.set('jbQaList', []);
    if(typeof instCampusChange === 'function') instCampusChange();
    const ok = document.getElementById('jbOk');
    if(ok){
      ok.innerHTML = editing
        ? '<b>Changes saved.</b> ' + jbEsc(title) + (campus ? ' · ' + jbEsc(campus) : '') + ' has been updated. Find it under Posted jobs.'
        : '<b>Job posted.</b> ' + jbEsc(title) + (campus ? ' · ' + jbEsc(campus) : '') + (res && res.status === 'draft' ? ' is saved as a draft and goes live once your institution is approved.' : ' is now live. Find it under Posted jobs.');
      ok.style.display = 'block';
      
      setTimeout(()=>{ ok.style.display = 'none'; }, 7000);
    }
    return res || true;
    }).catch(function(err){ api.toast(err.message || (editing ? 'Could not save the changes.' : 'Could not post the job.')); return null; });
  }

  // ---------- Edit / close / reopen / delete a posted job (all saved on the server) ----------
  function jbSetSelect(id, v){
    const el = document.getElementById(id), o = document.getElementById(id + 'Other'); if(!el) return;
    v = String(v == null ? '' : v);
    const has = Array.prototype.some.call(el.options, function(x){ return x.value === v; });
    const hasOther = Array.prototype.some.call(el.options, function(x){ return x.value === 'Other'; });
    if(!v || has){ el.value = v; if(o){ o.value = ''; o.style.display = 'none'; } }
    else if(hasOther){ el.value = 'Other'; if(o){ o.value = v === 'Other' ? '' : v; o.style.display = ''; } }
    else el.value = v;
  }
  function jbSetVal(id, v){ const el = document.getElementById(id); if(el) el.value = (v == null ? '' : v); }
  function editJob(id){
    const j = jobsData[id]; if(!j) return;
    if(typeof closeApplicantsView === 'function' && activeJobId) closeApplicantsView();
    switchEmployerTab('post');
    if(typeof instFillCampuses === 'function') instFillCampuses();
    editingJobId = id; window.__jbEditing = true;
    jbSetVal('jbTitle', j.title); jbSetSelect('jbRole', j.role); jbSetSelect('jbCategory', j.category); jbSetVal('jbDept', j.dept);
    jbSetSelect('jbType', j.type); jbSetVal('jbVac', j.vacancies); jbSetSelect('jbQualification', j.qualification); jbSetSelect('jbNotice', j.notice);
    jbSetVal('jbExpMin', j.expMin); jbSetVal('jbExpMax', j.expMax); jbSetVal('jbSalMin', j.salMin); jbSetVal('jbSalMax', j.salMax);
    jbSetVal('jbSalPeriod', j.salPeriod || 'month');
    const neg = document.getElementById('jbSalNeg'), norms = document.getElementById('jbSalNorms');
    if(neg) neg.checked = !!j.salNeg; if(norms) norms.checked = !!j.salNorms;
    jbSetVal('jbLocation', j.location); jbSetVal('jbDesc', j.desc); jbSetVal('jbSkills', j.skills); jbSetVal('jbDeadline', j.deadline); jbLoadQa(j.id, j.qa);
    const camp = document.getElementById('jbCampus');
    if(camp && typeof instCampusOptions === 'function'){ const o = instCampusOptions().find(function(x){ return x.n === j.campus; }); camp.value = o ? o.v : ''; if(typeof instCampusChange === 'function') instCampusChange(); }
    const bar = document.getElementById('jbEditBar');
    if(bar){ bar.innerHTML = '<b>Editing:</b> ' + jbEsc(j.title) + ' &nbsp; <button type="button" class="btn btn-ghost btn-sm" onclick="cancelEditJob()">Cancel editing</button>'; bar.style.display = 'block'; }
    if(typeof jbJump === 'function') jbJump(0);
    window.scrollTo(0, 0);
  }
  function endEditJob(){
    editingJobId = null; window.__jbEditing = false;
    const bar = document.getElementById('jbEditBar'); if(bar) bar.style.display = 'none';
    const f = document.getElementById('jobPostForm'); if(f) f.dispatchEvent(new Event('change', { bubbles: true }));   // repaint the step button text
  }
  function cancelEditJob(){
    endEditJob();
    ['jbTitle','jbRole','jbRoleOther','jbCategory','jbCategoryOther','jbDept','jbType','jbTypeOther','jbVac','jbQualification','jbQualificationOther','jbNotice','jbNoticeOther','jbExpMin','jbExpMax','jbSalMin','jbSalMax','jbLocation','jbDesc','jbSkills','jbDeadline','jbCampus','jbQaContact','jbQaFaq'].forEach(function(i){ const el = document.getElementById(i); if(el) el.value = ''; });
    ['jbRoleOther','jbCategoryOther','jbTypeOther','jbQualificationOther','jbNoticeOther'].forEach(function(i){ const el = document.getElementById(i); if(el) el.style.display = 'none'; });
    const p = document.getElementById('jbSalPeriod'); if(p) p.value = 'month';
    if(window.QA) QA.set('jbQaList', []);
    const n1 = document.getElementById('jbSalNeg'), n2 = document.getElementById('jbSalNorms'); if(n1) n1.checked = false; if(n2) n2.checked = false;
    if(typeof instCampusChange === 'function') instCampusChange();
    if(typeof jbJump === 'function') jbJump(0);
  }
  async function jobSetStatus(id, status){
    const j = jobsData[id]; if(!j) return;
    try{ await bkSetJobStatus(j.id, status); api.toast(status === 'closed' ? 'Job closed. Candidates can no longer apply.' : 'Job is live again.'); if(activeJobId === id) openApplicantsView(id); }
    catch(e){ api.toast(e.message || 'Could not update the job.'); }
  }
  async function jobDelete(id){
    const j = jobsData[id]; if(!j) return;
    if(!confirm('Delete "' + j.title + '"? Its applications are deleted with it. This cannot be undone.')) return;
    try{
      await bkDeleteJob(j.id);
      if(editingJobId === id) cancelEditJob();
      if(activeJobId === id) closeApplicantsView();
      api.toast('Job deleted.');
    }catch(e){ api.toast(e.message || 'Could not delete the job.'); }
  }
  function jobActionButtons(id, job){
    const toggle = job.status === 'published' ? ['Close job', 'closed'] : [job.status === 'draft' ? 'Publish' : 'Reopen', 'published'];
    return '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); editJob(\'' + id + '\')">Edit</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); jobSetStatus(\'' + id + '\',\'' + toggle[1] + '\')">' + toggle[0] + '</button>'
      + '<button class="btn btn-ghost btn-sm" style="color:#B3261E;border-color:#B3261E" onclick="event.stopPropagation(); jobDelete(\'' + id + '\')">Delete</button>';
  }

  // Rebuilds the "your posted jobs" list from saved data (so it survives page loads)
  function renderPostedJobs(){
    const list = document.getElementById('jobList');
    if(!list) return;
    list.innerHTML = '';
    const jlHead = document.getElementById('jobListHead'), jlCount = document.getElementById('jobListCount'), jlN = Object.keys(jobsData).length;
    if(jlHead) jlHead.style.display = jlN ? 'flex' : 'none';
    if(jlCount) jlCount.textContent = jlN + (jlN===1 ? ' job posted' : ' jobs posted');
    Object.keys(jobsData).forEach(id=>{
      const job = jobsData[id];
      const item = document.createElement('div');
      item.className = 'job-list-item jl-card';
      item.onclick = ()=> openApplicantsView(id);
      const n = Math.max((job.applicantIds||[]).length, Number(job.applicantCount) || 0);
      let price = '';
      if(job.salMin) price = jbMoney(job.salMin) + '\u2013' + jbMoney(job.salMax) + ' / ' + (job.salPeriod === 'year' ? 'yr' : 'mo');
      else if(job.salNorms) price = 'As per UGC / AICTE norms';
      else if(job.salNeg) price = 'Negotiable';
      item.innerHTML = `
        <span class="jl-badge">${bkStatusBadge(job)}</span>
        <div class="job-logo jl-logo" style="${companyLogoStyle()}"></div>
        <div class="jl-college">${jbEsc((currentCompany && currentCompany.name) || 'Your institution')}</div>
        <div class="jl-role">${jbEsc(job.title || job.role)}</div>
        <div class="jl-price">${jbEsc(price || 'Salary not specified')}</div>
        <div class="jl-line"></div>
        <button class="jl-view" onclick="event.stopPropagation(); openApplicantsView('${id}')">View applicants (${n})</button>`;
      list.prepend(item);
    });
  }

  /* Sidebar > Applicants: every applicant across all jobs, in one list */
  function paintAllApplicants(){
    const ids = []; Object.keys(jobsData).forEach(k=>(jobsData[k].applicantIds||[]).forEach(c=>{ if(ids.indexOf(c)<0) ids.push(c); }));
    document.getElementById('apList').innerHTML = ids.map(applicantCardHTML).join('') || `
      <div class="empty-state"><h4>No applicants yet</h4><p>Faculty who apply to your jobs will appear here.</p></div>`;
    document.getElementById('apCount').textContent = ids.length + (ids.length===1 ? ' applicant' : ' applicants');
  }
  function openAllApplicants(){
    window.__empLoad = true; switchEmployerTab('myjobs'); window.__empLoad = false; window.__empApps = true;
    const mj = document.getElementById('dashMyJobsTab'); if(mj) mj.style.display = 'none';
    document.getElementById('apListWrap').style.display = 'block';
    paintAllApplicants();
    try{ sessionStorage.setItem('upadyay_emp_view','apps'); }catch(e){}
    window.scrollTo(0,0);
  }
  window.openAllApplicants = openAllApplicants;

  function openApplicantsView(jobId){
    if(editingJobId){ cancelEditJob(); }
    activeJobId = jobId;
    window.__empApps = false;
    // stay in whichever option the user is in (Posted jobs / Post a job): hide that option's list, show this job's applicants
    const pt = document.getElementById('dashPostTab'); if(pt) pt.style.display = 'none';
    const mj = document.getElementById('dashMyJobsTab'); if(mj) mj.style.display = 'none';
    document.getElementById('applicantsView').style.display = 'block';
    document.getElementById('apListWrap').style.display = 'block';
    try{ sessionStorage.setItem('upadyay_emp_view','job:'+jobId); }catch(e){}
    const job = jobsData[jobId];
    document.getElementById('apJobTitle').textContent = job.title;
    document.getElementById('apJobMeta').textContent = [job.category, job.qualification, job.location].filter(Boolean).join(' \u00b7 ');
    const apExtra = document.getElementById('apJobExtra');
    if(apExtra) apExtra.textContent = jobExtra(job);
    const apLogo = document.getElementById('apJobLogo'); if(apLogo) apLogo.style.cssText = companyLogoStyle() + ' background-position:center; background-repeat:no-repeat;';
    const apInst = document.getElementById('apJobInst');
    if(apInst && typeof instJobHeader==='function') apInst.innerHTML = instJobHeader(job);
    const apAct = document.getElementById('apJobActions');
    if(apAct) apAct.innerHTML = bkStatusBadge(job) + ' ' + jobActionButtons(jobId, job);
    renderApplicants(jobId);
  }
  function closeApplicantsView(){
    activeJobId = null;
    let cur = 'myjobs'; try{ cur = sessionStorage.getItem('upadyay_emp_tab') || 'myjobs'; }catch(e){}
    switchEmployerTab(cur === 'post' ? 'post' : 'myjobs');   // back to the same option's list
  }
  function renderApplicants(jobId){
    const job = jobsData[jobId];
    if(!job) return;
    const _ids = job.applicantIds || [];
    document.getElementById('apList').innerHTML = _ids.map(applicantCardHTML).join('') || `
      <div class="empty-state">
        <div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg></div>
        <h4>No applicants yet</h4>
        <p>Once faculty or staff apply to this job, they'll show up here.</p>
      </div>`;
    document.getElementById('apCount').textContent = _ids.length + (_ids.length===1 ? ' applicant' : ' applicants');
  }
