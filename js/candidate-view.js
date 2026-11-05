/* candidate-view.js — recruiter-facing candidate profile (candidate-profile.html main content only).
   Everything is bound to the real candidate data (p = mapped candidate from backend.js, p.view = normalized profile
   from faculty-view.js). Empty sections and empty cards are hidden; nothing is invented or hard-coded. */
(function(){
'use strict';
var FV = window.FacultyView;
function esc(s){ return FV.esc(s); }
function has(v){ return Array.isArray(v) ? v.length > 0 : !!(v != null && String(v).trim()); }
function ico(d){ return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
var IC = {
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  school: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>'
};

function initials(fp, p){ var n = ((fp.first || '')[0] || '') + ((fp.last || '')[0] || ''); if(!n) n = String(p.name || '?').replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').trim().slice(0, 2); return n.toUpperCase(); }
function section(title, body, extra){ return body ? '<section class="cv-card ' + (extra || '') + '"><h3>' + title + '</h3>' + body + '</section>' : ''; }
function chips(list, cls){ return list.length ? '<div class="cv-chips">' + list.map(function(x){ return '<span class="cv-chip ' + (cls || '') + '">' + esc(x) + '</span>'; }).join('') + '</div>' : ''; }
function kv(l, v){ v = Array.isArray(v) ? v.join(', ') : v; return has(v) ? '<div class="cv-kv"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>' : ''; }
function uniq(a){ var s = {}; return a.filter(function(x){ x = String(x || '').trim(); if(!x || s[x.toLowerCase()]) return false; s[x.toLowerCase()] = 1; return true; }); }

function render(ctx){
  var p = ctx.p, fp = ctx.p.view, root = document.getElementById('cvRoot'); if(!root) return;
  if(!fp){ root.innerHTML = '<div class="cv-empty">Profile details are not available yet.</div>'; return; }
  var sh = FV.sh, shl = FV.shl;
  var name = (fp.first || fp.last) ? [fp.title === 'Other' ? fp.titleOth : fp.title, fp.first, fp.middle, fp.last].filter(Boolean).join(' ') : (p.name || '');
  var desig = sh(fp.desig, fp.desigOth) || '', headline = fp.headline || p.role || desig;
  var loc = [fp.city || '', fp.state || ''].filter(Boolean).join(', ');
  var months = FV.months(fp), yrs = months >= 12 ? Math.floor(months / 12) + '+ yrs' : (months ? months + ' months' : '');
  var high = sh(fp.high, fp.highOth) || '', college = p.college || '';
  var subjects = uniq(shl(fp.subjects, fp.subjectsOth).concat(shl(fp.taughtSubs, fp.taughtSubsOth)));
  var levels = shl(fp.levels, fp.levelsOth);
  var photo = fp.files && fp.files.photo && FV.safeUrl(fp.files.photo.url);
  var pct = FV.completion(fp), miss = FV.missing(fp);
  var company = ctx.role === 'company', st = ctx.status;
  var docs = FV.docItems ? FV.docItems(fp) : [];
  var resumeDocs = docs.filter(function(d){ return d.label === 'Resume' || d.label === 'CV'; });
  var otherDocs = docs.filter(function(d){ return d.label !== 'Resume' && d.label !== 'CV'; });
  var firstResume = resumeDocs.filter(function(d){ return d.id; })[0];
  var priv = fp.vis === 'Private';

  /* ---- header ---- */
  var meta = [loc && ['pin', loc], college && ['school', college], high && ['cap', high], yrs && ['clock', yrs + ' experience']].filter(Boolean)
    .map(function(m){ return '<span>' + ico(IC[m[0]]) + esc(m[1]) + '</span>'; }).join('');
  var head = '<header class="cv-head"><div class="cv-av">' + (photo ? '<img src="' + esc(photo) + '" alt="">' : esc(initials(fp, p))) + '</div>' +
    '<div class="cv-id"><h1>' + esc(name) + (p.verified ? '<span class="cv-ver" title="Verified profile">' + ico(IC.shield) + 'Verified</span>' : '') + '</h1>' +
    (headline ? '<p class="cv-headline">' + esc(headline) + '</p>' : '') + (meta ? '<div class="cv-meta">' + meta + '</div>' : '') + '</div>' +
    '</header>';

  /* ---- key cards (only real, non-empty values) ---- */
  var expectedSal = fp.salary || (p.salary && p.salary.expectedCtc) || '';
  var keys = [
    ['Experience', yrs, 'briefcase'], ['Highest qualification', high, 'cap'], ['Current institution', college, 'school'],
    ['Subjects', subjects.length ? subjects.length + (subjects.length === 1 ? ' subject' : ' subjects') : '', 'book'],
    ['Preferred role', (fp.prefJob || [])[0] ? fp.prefJob.join(', ') : '', 'briefcase'], ['Expected salary', expectedSal, 'wallet']
  ].filter(function(k){ return has(k[1]); });
  var keyHtml = keys.length ? '<div class="cv-keys">' + keys.map(function(k){ return '<div class="cv-key"><i>' + ico(IC[k[2]]) + '</i><div><span>' + k[0] + '</span><b>' + esc(k[1]) + '</b></div></div>'; }).join('') + '</div>' : '';

  /* ---- left column ---- */
  var about = has(fp.about) ? '<p class="cv-text">' + esc(fp.about).replace(/\n/g, '<br>') + '</p>' : '';
  var expertise = chips(subjects) + (levels.length ? '<div class="cv-sub">Teaching levels</div>' + chips(levels, 'alt') : '');
  var edu = FV.eduRows(fp);
  var jobs = (fp.jobs || []).filter(function(j){ return j && j.org; });
  var isInt = function(j){ return /intern/i.test(sh(j.type, j.typeOth) || ''); };
  var work = FV.jobRows({ jobs: jobs.filter(function(j){ return !isInt(j); }) }), interns = FV.jobRows({ jobs: jobs.filter(isInt) });
  var tq = FV.tqRows(fp);
  var tex = [kv('Experience level', fp.expLevel), kv('Medium', shl(fp.medium, fp.mediumOth)), kv('Classes taught', shl(fp.taught, fp.taughtOth)), kv('Boards', shl(fp.boards, fp.boardsOth))].join('');
  var research = FV.rsBlock(fp) + FV.scholarRows(fp);
  var links = FV.linkRows(fp);

  var left = section('About', about) + section('Subjects &amp; expertise', expertise) + section('Work experience', work, 'cv-tl') +
    section('Internships', interns, 'cv-tl') + section('Education', edu, 'cv-tl') + section('Certifications &amp; teaching qualifications', tq) +
    section('Teaching experience', tex) + section('Research &amp; publications', research) + section('Links &amp; profiles', links);

  /* ---- right column ---- */
  var strength = '<section class="cv-card cv-strength"><h3>Profile strength</h3><div class="cv-pct"><b>' + pct + '%</b><span>complete</span></div>' +
    '<div class="cv-bar"><div style="width:' + pct + '%"></div></div>' +
    (miss.length ? '<div class="cv-miss"><span>Not added yet</span>' + chips(miss, 'warn') + '</div>' : '<p class="cv-ok">All profile sections are filled in.</p>') + '</section>';
  var contact = priv
    ? kv('Location', [fp.area, fp.city, fp.district, fp.state].filter(Boolean).join(', ')) + '<p class="cv-note">Email and phone are hidden by the candidate. Use Message or Invite to reach them.</p>'
    : kv('Email', fp.email) + kv('Phone', fp.phone) + kv('Alt. phone', fp.phone2) + kv('Location', [fp.area, fp.city, fp.district, fp.state].filter(Boolean).join(', ') + (fp.pin ? ' - ' + fp.pin : ''));
  var prefs = [kv('Preferred levels', fp.prefLevels), kv('Preferred subjects', fp.prefSubs), kv('Job type', fp.prefJob), kv('Work mode', fp.prefWork), kv('Preferred locations', fp.prefLoc), kv('Willing to relocate', fp.reloc), kv('Expected salary', expectedSal)].join('');
  var ver = '';
  var VN = { edu: 'Education documents', exp: 'Experience documents', id: 'ID proof' };
  Object.keys(VN).forEach(function(k){ if(fp.ver && (fp.ver[k] === 'ok' || fp.ver[k] === 'pend')) ver += kv(VN[k], fp.ver[k] === 'ok' ? 'Verified' : 'Under review'); });
  var resumeBody = resumeDocs.map(function(d){ return FV.fileRow(d, 'viewer'); }).join('') + otherDocs.map(function(d){ return FV.fileRow(d, 'viewer'); }).join('');
  var actions = (company || firstResume) ? '<section class="cv-card cv-actions"><h3>Recruiter actions</h3><div id="cvActions"></div>' + (company ? '<p class="cv-note">Message before inviting to check availability and salary expectations.</p>' : '') + '</section>' : '';

  var right = actions + strength + section('Contact &amp; location', contact) + section('Preferences', prefs) + section('Resume &amp; documents', resumeBody, 'cv-docs') + section('Verification', ver);

  root.innerHTML = head + keyHtml + '<div class="cv-grid"><div class="cv-col">' + (left || '<div class="cv-empty">This candidate has not added profile details yet.</div>') + '</div><aside class="cv-col cv-side">' + right + '</aside></div>';

  /* ---- actions (existing backend actions only; shown to employers) ---- */
  var id = ctx.id;
  function btn(label, cls, fn, icon){ var b = document.createElement('button'); b.type = 'button'; b.className = 'cv-btn ' + cls; b.innerHTML = (icon ? ico(IC[icon]) : '') + label; b.addEventListener('click', fn); return b; }
  function run(fn){ return function(){ Promise.resolve(window[fn] && window[fn](id)).then(ctx.rerender); }; }
  var side = document.getElementById('cvActions');
  function fill(host, sidebar){
    if(!host) return;
    if(company){
      host.appendChild(btn('Message', 'ghost', function(){ if(window.messageCandidate) window.messageCandidate(id); }, 'msg'));
      host.appendChild(st === 'shortlisted' ? btn('Remove shortlist', 'ghost', run('undoApplicant')) : btn('Shortlist', 'primary', run('shortlistCandidate')));
      if(st !== 'invited' && st !== 'shortlisted') host.appendChild(btn('Invite to apply', 'ghost', run('inviteCandidate')));
    }
    if(firstResume && typeof window.bkOpenFile === 'function') host.appendChild(btn('View resume', 'ghost', function(){ window.bkOpenFile(firstResume.id); }, 'file'));
    if(sidebar && navigator.clipboard){
      host.appendChild(btn('Copy profile link', 'ghost', function(){ navigator.clipboard.writeText(location.href).then(function(){ if(window.api && api.toast) api.toast('Profile link copied.'); }); }, 'share'));
    }
  }
  fill(side, true);
}
window.CandidateView = { render: render };
})();
