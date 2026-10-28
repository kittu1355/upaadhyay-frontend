/* faculty-view.js — the ONE faculty profile UI.
   Same markup everywhere:
     mode 'self'   → the faculty's own "Profile Preview" (faculty-dashboard, with Edit / + Add buttons)
     mode 'viewer' → what an institution / sub-branch sees (candidate-profile.html): read-only, empty sections hidden
   It reads the saved editor data (profile_data.fp) straight from the API user, so whatever the faculty
   enters in the editor shows up here. Uses the .fp-pv-* styles from faculty-profile.css + faculty-view.css. */
(function(){
'use strict';

var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var SVG = {
  pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  cal:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  award:'<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  clockp:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
};

/* ---------- tiny helpers ---------- */
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function arr(x){ return Array.isArray(x) ? x : []; }
function ic(n, z){ z = z || 14; return '<svg class="ic" width="' + z + '" height="' + z + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (SVG[n] || '') + '</svg>'; }
function pill(c, i, t){ return '<span class="fp-pill ' + c + '">' + ic(i, 11) + esc(t) + '</span>'; }
function sh(v, o){ return v === 'Other' && String(o || '').trim() ? String(o).trim() : v; }
function shl(a, o){ return arr(a).map(function(x){ return sh(x, o); }); }
function fmt(m){ if(!m) return ''; var p = String(m).split('-'); return p[1] && MON[p[1] - 1] ? MON[p[1] - 1] + ' ' + p[0] : p[0]; }
function nonEmpty(o){ return o && String(o).trim(); }

/* Links come from user-editable data, so only http(s) ever reaches an href (blocks javascript: etc.). */
function safeUrl(u){
  u = String(u || '').trim(); if(!u) return '';
  if(/^https?:\/\//i.test(u)) return u;
  if(/^[a-z][a-z0-9+.\-]*:/i.test(u)) return '';
  if(/^[\w\-]+(\.[\w\-]+)+(\/|$|\?|#)/.test(u)) return 'https://' + u;
  return '';
}
function doiUrl(d){ d = String(d || '').trim(); if(/^10\.\d{4,9}\/\S+$/.test(d)) return 'https://doi.org/' + d; return safeUrl(d); }
function ext(u, text){ u = safeUrl(u); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(text) + '</a>' : ''; }

function age(d){
  var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d || ''); if(!m) return null;
  var D = +m[1], M = +m[2], Y = +m[3], dt = new Date(Y, M - 1, D);
  if(dt.getMonth() !== M - 1 || dt.getDate() !== D) return null;
  var n = new Date(), a = n.getFullYear() - Y;
  if(n.getMonth() < M - 1 || (n.getMonth() === M - 1 && n.getDate() < D)) a--;
  return a >= 0 && a < 100 ? a : null;
}
function months(fp){
  var t = 0, n = new Date();
  arr(fp.jobs).forEach(function(j){
    if(!j || !j.start) return;
    var s = j.start.split('-').map(Number), e = n;
    if(!j.cur){ if(!j.end) return; var q = j.end.split('-').map(Number); e = new Date(q[0], q[1] - 1); }
    t += Math.max(0, (e.getFullYear() - s[0]) * 12 + e.getMonth() - (s[1] - 1));
  });
  return t;
}
function fullName(fp){
  var t = fp.title === 'Other' ? String(fp.titleOth || '').trim() : fp.title;
  return [t, fp.first, fp.middle, fp.last].filter(Boolean).join(' ') || fp._name || '';
}
function qname(q){ return q && q.name === 'Other' && String(q.oname || '').trim() ? String(q.oname).trim() : (q && q.name) || ''; }

/* ---------- normalize: API user → one fp object (same shape the editor uses) ---------- */
function normalize(u, o){
  o = o || {};
  var fileUrl = o.fileUrl || function(p){ return p || ''; };
  var cp = (u && (u.candidate_profile || u.candidateProfile)) || {}, pd = cp.profile_data || {};
  var hasFp = !!pd.fp;
  var fp = JSON.parse(JSON.stringify(pd.fp || {}));

  ['levels','subjects','tq','jobs','taught','taughtSubs','boards','medium','links','resumes','cvs','editions','prefLevels','prefSubs','prefJob','prefLoc'].forEach(function(k){ if(!Array.isArray(fp[k])) fp[k] = []; });
  fp.edu = fp.edu || {}; fp.files = fp.files || {};
  fp.research = Object.assign({ journal:[], patent:[], conf:[], book:[], chapter:[], other:[] }, fp.research || {});
  fp.ver = Object.assign({ edu:'none', exp:'none', id:'none' }, fp.ver || {});

  fp._name = (u && u.name) || '';
  fp.email = (u && u.email) || fp.email || '';
  fp.phone = fp.phone || (u && u.phone) || '';
  fp.city = fp.city || cp.city || '';
  fp.state = fp.state || cp.state || '';
  fp._hasFp = hasFp;
  if(cp.profile_photo) fp.files.photo = { url: fileUrl(cp.profile_photo) };

  if(!hasFp){ /* older profiles saved before the new editor: map what we can so nothing looks empty */
    fp.headline = pd.currentDesignation || cp.current_job_title || '';
    fp.about = cp.bio || pd.about || '';
    if(pd.subject) fp.subjects = [pd.subject];
    if(pd.qualification || pd.college) fp.edu.oth = { major: [pd.qualification, pd.subject].filter(Boolean).join(', '), uni: pd.college || '', end: pd.highestQualYear || '' };
    arr(pd.employmentHistory).forEach(function(e){
      if(e && e.org) fp.jobs.push({ org: e.org, desig: e.designation || '', dept: e.department || '', cur: !!e.currentlyWorking,
        start: /^\d{4}-\d{2}$/.test(e.from || '') ? e.from : '', end: /^\d{4}-\d{2}$/.test(e.to || '') ? e.to : '' });
    });
    fp._extra = [];
    arr(u && u.resumes).concat(arr(u && u.certificates)).forEach(function(r){
      var f = r && r.file; if(f && f.id) fp._extra.push({ label: r.name || 'Document', id: f.id, name: f.original_name || '' });
    });
  }
  return fp;
}

/* ---------- documents ---------- */
var DOCNAME = { resume:'Resume', phdcert:'Ph.D. certificate', ugcert:"Bachelor's certificate", pgcert:"Master's certificate",
  mphilcert:'M.Phil certificate', dipcert:'Diploma certificate', othcert:'Certificate', idproof:'ID proof' };
function docLabel(k, fp){
  if(DOCNAME[k]) return DOCNAME[k];
  var m = /^tq(\d+)$/.exec(k);
  if(m){ var q = arr(fp.tq)[+m[1]]; return q && q.name ? qname(q) + ' certificate' : 'Teaching qualification'; }
  m = /^j(\d+)(exp|app|rel)$/.exec(k);
  if(m){ var j = arr(fp.jobs)[+m[1]], t = { exp:'Experience certificate', app:'Appointment letter', rel:'Relieving letter' }[m[2]]; return t + (j && j.org ? ' — ' + j.org : ''); }
  return 'Document';
}
function pubItem(fp, k){ var pub = k === 'resumes' ? fp.resumePub : fp.cvPub; return arr(fp[k]).filter(function(x){ return x && x.id === pub; })[0] || null; }
/* [{label,id,url,name,size}] — published resume / CV first, then every uploaded certificate and letter */
function docItems(fp){
  var out = [], seen = {};
  function add(label, f){
    if(!f) return; var id = f.id || f.fid || '', key = id ? 'i' + id : (f.url ? 'u' + f.url : ''); if(!key || seen[key]) return; seen[key] = 1;
    out.push({ label: label, id: id, url: f.url || '', name: f.name || '', size: f.size || '', link: f.kind === 'link' });
  }
  var r = pubItem(fp, 'resumes'), c = pubItem(fp, 'cvs');
  if(r) add('Resume', { id: r.fid, url: r.url, name: r.name, size: r.size, kind: r.kind });
  else if(fp.files && fp.files.resume) add('Resume', fp.files.resume);
  if(c) add('CV', { id: c.fid, url: c.url, name: c.name, size: c.size, kind: c.kind });
  Object.keys(fp.files || {}).forEach(function(k){ if(k !== 'photo' && k !== 'resume') add(docLabel(k, fp), fp.files[k]); });
  arr(fp._extra).forEach(function(x){ add(x.label, x); });
  return out;
}
/* for list cards / backend.js: [[label,'doc',fileId], …] */
function docLinks(fp){ return docItems(fp).filter(function(d){ return d.id; }).map(function(d){ return [d.label, 'doc', d.id]; }); }

function openFile(d, mode){
  var id = String(d.id || '').replace(/[^\w\-]/g, ''), u = safeUrl(d.url);
  if(mode === 'viewer' && id) return '<a href="javascript:void(0)" onclick="bkOpenFile(\'' + id + '\')">' + (d.link ? 'Open' : 'View') + '</a>';
  if(u) return '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + (d.link ? 'Open' : 'View') + '</a>';
  if(id && typeof window.bkOpenFile === 'function') return '<a href="javascript:void(0)" onclick="bkOpenFile(\'' + id + '\')">View</a>';
  return '';
}
function fileRow(d, mode){
  var small = (d.name || 'File') + (d.size ? ' · ' + d.size + ' MB' : '');
  return '<div class="fp-pv-file">' + ic(d.link ? 'link' : 'file', 16) + '<div><b>' + esc(d.label) + '</b><small>' + esc(small) + '</small></div>' + openFile(d, mode) + '</div>';
}

/* ---------- sections ---------- */
var EDU_ORDER = [['phd','Ph.D.'],['mphil','M.Phil'],['pg',"Master's"],['ug',"Bachelor's"],['dip','Diploma'],['hsc','12th / Intermediate'],['ssc','10th / SSC'],['oth','Other qualification']];
function eduRows(fp){
  return EDU_ORDER.map(function(x){
    var k = x[0], e = (fp.edu || {})[k] || {};
    var has = ['uni','college','major','area','board','end','thesis','q','type'].some(function(f){ return nonEmpty(e[f]); });
    if(!has) return '';
    var title = k === 'phd' ? (e.area ? 'Ph.D. — ' + e.area : 'Ph.D.')
      : (k === 'ssc' || k === 'hsc') ? (e.q || x[1])
      : ((e.type ? sh(e.type, e.typeOth) + ' ' : '') + (e.major || x[1]));
    var inst = [e.uni, e.college && e.college !== e.uni ? e.college : ''].filter(Boolean).join(' · ');
    var meta = [x[1] === title ? '' : x[1], e.board, e.stream, e.end ? 'Passed ' + e.end : '', e.score ? 'Score ' + e.score : ''].filter(Boolean).join(' · ');
    return '<div class="fp-tl"><i></i><div><b>' + esc(title) + '</b>' + (inst ? '<div>' + esc(inst) + '</div>' : '') + (meta ? '<small>' + esc(meta) + '</small>' : '') +
      (k === 'phd' && e.thesis ? '<div class="fv-sub">Thesis: ' + esc(e.thesis) + '</div>' : '') + '</div></div>';
  }).join('');
}
function jobRows(fp){
  return arr(fp.jobs).filter(function(j){ return j && j.org; }).map(function(j){
    var when = j.start ? fmt(j.start) + ' – ' + (j.cur ? 'Present' : fmt(j.end)) : (j.cur ? 'Present' : '');
    var meta = [when, sh(j.type, j.typeOth), sh(j.level, j.levelOth)].filter(Boolean).join(' · ');
    return '<div class="fp-tl"><i class="' + (j.cur ? 'cur' : '') + '"></i><div><b>' + esc(j.desig || '') + '</b>' + (j.cur ? ' ' + pill('p-ok', 'check', 'Current') : '') +
      '<div>' + esc(j.org) + (j.dept ? ' · ' + esc(j.dept) : '') + '</div>' + (meta ? '<small>' + esc(meta) + '</small>' : '') +
      (arr(j.subs).length ? '<div class="fv-sub">Subjects: ' + esc(shl(j.subs, j.subsOth).join(', ')) + '</div>' : '') + '</div></div>';
  }).join('');
}
function tqRows(fp){
  return arr(fp.tq).filter(function(q){ return q && q.name; }).map(function(q){
    var meta = [q.spec, q.auth, q.year].filter(Boolean).join(' · ');
    return '<div class="fp-pv-link">' + ic('award', 12) + '<span><b>' + esc(qname(q)) + '</b>' + (meta ? ' · ' + esc(meta) : '') + '</span></div>';
  }).join('');
}
function kv(l, v){ v = Array.isArray(v) ? v.join(', ') : v; return nonEmpty(v) ? '<div class="fp-pv-kv"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>' : ''; }
function chips(l){ return arr(l).length ? '<div class="fp-chips">' + l.map(function(x){ return '<span class="fp-chip">' + esc(x) + '</span>'; }).join('') + '</div>' : ''; }

var RS_LABEL = { journal:'Journal publications', conf:'Conference publications', patent:'Patents', book:'Books', chapter:'Book chapters', other:'Cutting-edge articles' };
function rsList(fp, c){ return arr((fp.research || {})[c]).filter(function(r){ return r && String(r.title || '').trim(); }); }
function rsCount(fp){ return Object.keys(RS_LABEL).reduce(function(t, c){ return t + rsList(fp, c).length; }, 0); }
function rsItem(c, r){
  var meta = [r.name || r.book || r.pub || '', r.year || (r.date ? String(r.date).slice(0, 10) : ''),
    c === 'patent' ? [r.ptype, r.status, r.no].filter(Boolean).join(' · ') : '',
    c === 'book' && r.isbn ? 'ISBN ' + r.isbn : '', c === 'book' ? r.btype : '',
    arr(r.idx).length ? 'Indexed: ' + r.idx.join(', ') : '', r.q ? 'Quartile ' + r.q : '', r.pos ? 'Author: ' + r.pos : ''].filter(Boolean).join(' · ');
  var link = ext(r.url, 'Open link') || ext(doiUrl(r.doi), 'DOI');
  return '<div class="fv-rs-item"><b>' + esc(r.title) + '</b>' + (meta ? '<small>' + esc(meta) + '</small>' : '') + (link ? '<small>' + link + '</small>' : '') + '</div>';
}
function rsBlock(fp){
  return Object.keys(RS_LABEL).map(function(c){
    var l = rsList(fp, c); if(!l.length) return '';
    return '<details class="fv-rs"><summary><span>' + RS_LABEL[c] + '</span><b>' + l.length + '</b></summary>' + l.map(function(r){ return rsItem(c, r); }).join('') + '</details>';
  }).join('');
}
function scholarRows(fp){
  var g = fp.scholar || {}, link = safeUrl(g.url);
  var m = [['Citations', g.citations], ['h-index', g.h], ['i10-index', g.i10], ['Publications', g.pubs]].filter(function(x){ return nonEmpty(x[1]); });
  if(!link && !m.length) return '';
  return (m.length ? '<div class="fv-scholar">' + m.map(function(x){ return '<div><b>' + esc(x[1]) + '</b><span>' + x[0] + '</span></div>'; }).join('') + '</div>' : '') +
    (link ? '<div class="fp-pv-link">' + ic('link', 12) + '<span>' + ext(link, 'View Google Scholar profile') + '</span></div>' : '');
}
function linkRows(fp){
  var rows = arr(fp.links).filter(function(l){ return l && safeUrl(l.u); }).map(function(l){ return [l.t || l.u, l.u]; });
  var p = (fp.edu || {}).phd || {};
  [['Research profile', p.url], ['ORCID', p.orcid], ['Google Scholar', (fp.scholar || {}).url ? '' : p.scholar], ['ResearchGate', p.rg]].forEach(function(x){ if(safeUrl(x[1])) rows.push(x); });
  arr(fp.editions).forEach(function(x){ if(x && x.name && safeUrl(x.url)) rows.push([x.name, x.url]); });
  return rows.map(function(r){ return '<div class="fp-pv-link">' + ic('link', 12) + '<span>' + ext(r[1], r[0]) + '</span></div>'; }).join('');
}

/* same formula the faculty sees on their dashboard */
function completion(fp){
  var req = [!!(fp.first && fp.last && age(fp.dob) !== null), !!(fp.email && fp.phone), !!(fp.high && (fp.high !== 'Other' || nonEmpty(fp.highOth))),
    !!(fp.desig && (fp.desig !== 'Other' || nonEmpty(fp.desigOth))), arr(fp.subjects).length > 0];
  var rec = [!!(pubItem(fp, 'resumes') || (fp.files && fp.files.resume)), arr(fp.jobs).length > 0, rsCount(fp) > 0,
    Object.keys(fp.files || {}).some(function(k){ return k !== 'resume' && k !== 'photo'; })];
  return Math.min(100, req.filter(Boolean).length * 16 + rec.filter(Boolean).length * 5);
}

function box(title, sec, body, empty, mode, full){
  var cls = 'fp-pv-box' + (full ? ' fv-full' : '');
  if(!body){
    if(mode !== 'self' || !empty) return '';
    return '<div class="' + cls + ' empty"><div class="fp-pv-bh"><h5>' + title + '</h5><button type="button" class="fp-pv-add" data-go="' + sec + '">+ Add</button></div><div class="fp-pv-ph">' + empty + '</div></div>';
  }
  return '<div class="' + cls + '"><div class="fp-pv-bh"><h5>' + title + '</h5>' + (mode === 'self' ? '<button type="button" class="fp-pv-add" data-go="' + sec + '">Edit</button>' : '') + '</div>' + body + '</div>';
}

/* ---------- the profile ---------- */
function html(fp, o){
  o = o || {};
  var mode = o.mode === 'self' ? 'self' : 'viewer', self = mode === 'self';
  var m = months(fp), a = age(fp.dob), desig = sh(fp.desig, fp.desigOth) || '';
  var loc = [fp.city, fp.state].filter(Boolean).join(', ');

  var contactBody;
  if(!self && fp.vis === 'Private'){
    contactBody = [kv('Location', [fp.area, fp.city, fp.district, fp.state].filter(Boolean).join(', ')),
      '<div class="fp-pv-ph" style="margin-top:8px">Email and phone are hidden by the candidate. Use Message or Invite to reach them.</div>'].join('');
  } else {
    contactBody = [kv('Email', fp.email), kv('Phone', fp.phone), kv('Alt. phone', fp.phone2),
      kv('Location', [fp.area, fp.city, fp.district, fp.state].filter(Boolean).join(', ') + (fp.pin ? ' - ' + fp.pin : '')),
      self ? kv('Gender', sh(fp.gender, fp.genderOth)) : '', self ? kv('Visible to', fp.vis) : ''].join('');
  }

  var docs = docItems(fp), resumeDocs = docs.filter(function(d){ return d.label === 'Resume' || d.label === 'CV'; }),
      otherDocs = docs.filter(function(d){ return d.label !== 'Resume' && d.label !== 'CV'; });

  var tex = [kv('Experience level', fp.expLevel), kv('Medium', shl(fp.medium, fp.mediumOth)), kv('Classes taught', shl(fp.taught, fp.taughtOth)),
    kv('Subjects taught', shl(fp.taughtSubs, fp.taughtSubsOth)), kv('Boards', shl(fp.boards, fp.boardsOth))].join('');
  var prefs = [kv('Levels', fp.prefLevels), kv('Subjects', fp.prefSubs), kv('Job type', fp.prefJob), kv('Work mode', fp.prefWork),
    kv('Locations', fp.prefLoc), kv('Relocate', fp.reloc), kv('Expected salary', fp.salary)].join('');

  var ver = '';
  if(!self){
    var VN = { edu:'Education documents', exp:'Experience documents', id:'ID proof' };
    ver = Object.keys(VN).filter(function(k){ return fp.ver[k] === 'ok' || fp.ver[k] === 'pend'; }).map(function(k){
      return '<div class="fp-pv-kv"><span>' + VN[k] + '</span><b>' + (fp.ver[k] === 'ok' ? pill('p-ok', 'check', 'Verified') : pill('p-pend', 'clock', 'Under review')) + '</b></div>';
    }).join('');
  }

  var boxes = [
    box('Contact &amp; location', 1, contactBody, 'Add your email, phone and location.', mode),
    box('Resume &amp; CV', 8, resumeDocs.map(function(d){ return fileRow(d, mode); }).join(''), 'No resume published yet. Add one in Add Resume.', mode),
    box('Teaching levels', 2, chips(shl(fp.levels, fp.levelsOth)), 'Add the levels you teach, e.g. Primary, High School, Degree.', mode),
    box('Subjects', 2, chips(shl(fp.subjects, fp.subjectsOth)), 'Add the subjects you teach or specialise in.', mode),
    box('Experience', 5, jobRows(fp), 'Fresher or not added yet. Add your employment history.', mode, true),
    box('Education', 3, eduRows(fp), 'Add your highest qualification and details.', mode),
    box('Teaching qualifications', 4, tqRows(fp), 'Add B.Ed., TET, NET or other teaching qualifications.', mode),
    box('Teaching experience', 6, tex, 'Add the classes, subjects and boards you have taught.', mode),
    box('Research', 7, rsBlock(fp), 'Add journal papers, patents, conference papers, books and chapters.', mode, true),
    box('Google Scholar', 2, scholarRows(fp), 'Add your Google Scholar link and metrics in Professional Profile.', mode),
    box('Documents', 7, otherDocs.map(function(d){ return fileRow(d, mode); }).join(''), 'No documents uploaded yet.', mode),
    box('Links &amp; profiles', 8, linkRows(fp), 'Add Google Scholar, ORCID, portfolio or editions links.', mode),
    box('Teaching preferences', 9, prefs, 'Add preferred levels, subjects, job type and locations.', mode),
    box('Verification', 10, ver, '', mode)
  ].join('');

  if(!self){
    var pct = completion(fp), about = fp.about ? '<div class="fp-pv-box fv-full"><div class="fp-pv-bh"><h5>About</h5></div><p style="margin:0;font-size:13.5px;color:var(--ink-soft)">' + esc(fp.about) + '</p></div>' : '';
    var badges = '<div class="fv-badges">' + pill('p-ok', 'shield', 'Profile strength ' + pct + '%') +
      (m ? pill('p-ok', 'clock', (m >= 12 ? Math.floor(m / 12) + '+ years' : m + ' months') + ' experience') : '') +
      (rsCount(fp) ? pill('p-ok', 'file', rsCount(fp) + ' research record' + (rsCount(fp) > 1 ? 's' : '')) : '') + '</div>';
    return '<div class="fp-pv fv-viewer">' + badges + '<div class="fp-pv-grid">' + about + (boxes || '<div class="fv-none fv-full">This faculty member has not added profile details yet.</div>') + '</div></div>';
  }

  var photo = fp.files && fp.files.photo, ini = esc(((fp.first || '')[0] || '') + ((fp.last || '')[0] || '') || '?');
  var av = '<div class="fp-av lg">' + (photo && safeUrl(photo.url) ? '<img src="' + esc(safeUrl(photo.url)) + '" alt="">' : ini) + '</div>';
  return '<div class="fp-pv"><div class="fp-pv-ban"></div><div class="fp-pv-head">' + av + '<div style="flex:1;min-width:200px"><h2>' + esc(fullName(fp)) + '</h2><div class="fp-pv-role">' + esc(fp.headline || desig) + '</div>' +
    '<div class="fp-meta"><span>' + ic('pin', 13) + esc(loc || 'Location not set') + '</span><span>' + ic('clock', 13) + (m >= 12 ? Math.floor(m / 12) + '+ years' : m + ' months') + ' experience</span>' +
    (a !== null ? '<span>' + ic('cal', 13) + a + ' yrs</span>' : '') + '</div></div><button class="fp-btn pri" data-go="0">Edit Profile</button></div>' +
    '<div class="fp-pv-grid">' + boxes + '</div></div>';
}

/* ---------- compact summary for candidate lists (employer + sub-branch cards) ---------- */
function stats(fp){
  return [[String(rsList(fp, 'journal').length + rsList(fp, 'conf').length), 'Publications'], [String(rsList(fp, 'patent').length), 'Patents'],
    [String(rsList(fp, 'book').length + rsList(fp, 'chapter').length), 'Books & chapters']];
}
function summary(fp){
  var cur = arr(fp.jobs).filter(function(j){ return j && j.cur && j.org; })[0] || arr(fp.jobs).filter(function(j){ return j && j.org; })[0];
  var seen = {}, skills = shl(fp.subjects, fp.subjectsOth).concat(shl(fp.taughtSubs, fp.taughtSubsOth)).filter(function(s){ if(!s || seen[s]) return false; seen[s] = 1; return true; }).slice(0, 14);
  var yrs = Math.round(months(fp) / 12 * 10) / 10;
  return {
    role: fp.headline || sh(fp.desig, fp.desigOth) || '',
    tags: [sh(fp.high, fp.highOth), yrs ? yrs + ' yrs experience' : '', [fp.city, fp.state].filter(Boolean).join(', ')].filter(Boolean),
    college: cur ? cur.org : '', skills: skills, stats: stats(fp), docLinks: docLinks(fp), strength: completion(fp)
  };
}

window.FacultyView = { normalize: normalize, html: html, summary: summary, stats: stats, docItems: docItems, docLinks: docLinks, completion: completion, safeUrl: safeUrl };
})();
