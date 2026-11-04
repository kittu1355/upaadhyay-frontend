// admin/js/company.js — full-page institution profile for admin verification.
// Data: GET /api/admin/companies/{id}  →  { company, files, branches, stats }
// Actions: PUT /api/admin/companies/{id}/approve | reject | block.
// Approving sets verification_status = 'approved'; the institution's dashboard unlocks
// Post a job / Posted jobs / Browse candidates from that value (see js/employer.js employerApproved()).

const COMPANY_ID = new URLSearchParams(location.search).get('id');
const PUB_MAIL = /@(gmail|googlemail|yahoo|ymail|rocketmail|outlook|hotmail|live|msn|rediffmail|icloud|aol|proton|protonmail|gmx)\.[a-z.]+$/i;   // same list the institution form uses
const DOC_SLOTS = [
  { k:'reg',  t:'Institution Registration / Recognition Proof', req:true },
  { k:'rep',  t:'Representative / Employee Proof', req:true },
  { k:'auth', t:'Authorization Letter or Institution-issued ID', req:true },
  { k:'aprf', t:'Authority / Dean / Principal Official Proof', req:function(d){ return PUB_MAIL.test(String(d.aemail || '').trim()); }, note:'Required when the authority uses a public email' }
];
const REQ_INST = ['name', 'type', 'website', 'email', 'phone', 'country', 'state', 'district', 'city', 'pin', 'address'];
const REQ_REP  = ['rname', 'rdes', 'rdep', 'remail', 'rphone'];

let DATA = null;
const root = function(){ return document.getElementById('reviewRoot'); };

/* ------------------------------------------------------------------ helpers */
function has(v){ return String(v == null ? '' : v).trim() !== ''; }
function link(u){
  u = String(u || '').trim(); if(!u) return '';
  const h = /^https?:\/\//i.test(u) ? u : 'https://' + u;
  return '<a href="' + esc(h) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + '</a>';
}
function mailHtml(e){
  e = String(e || '').trim(); if(!e) return '';
  return esc(e) + (PUB_MAIL.test(e) ? '<span class="rv-tag warn">Public email</span>' : '');
}
// rows: [label, value, {html:true | full:true}]. Empty values render as "Not provided".
function kv(rows){
  return '<div class="rv-kv">' + rows.map(function(r){
    const o = r[2] || {}, val = o.html ? r[1] : esc(r[1]);
    return '<div' + (o.full ? ' class="full"' : '') + '><span>' + esc(r[0]) + '</span><b>' + (has(r[1]) ? val : '<em>Not provided</em>') + '</b></div>';
  }).join('') + '</div>';
}
function card(title, body, right){ return '<section class="rv-card"><h3><span>' + esc(title) + '</span>' + (right || '') + '</h3>' + body + '</section>'; }

/* ------------------------------------------------------------------ verification checklist (advisory) */
// Mirrors the rules the institution form applies to itself, so the admin sees what is missing at a glance.
function analyse(c, files){
  const pd = c.profile_data || {}, inst = pd.inst || {}, d = inst.d || {}, docs = inst.docs || {}, extra = (inst.extra || []);
  const fileIds = {}; (files || []).forEach(function(f){ fileIds[f.id] = f; });
  const okDoc = function(k){ return docs[k] && docs[k].st === 'ok'; };
  const docOnServer = function(k){ return okDoc(k) && docs[k].fid && fileIds[docs[k].fid]; };
  const need = function(slot){ return typeof slot.req === 'function' ? slot.req(d) : slot.req; };

  const missingInst = REQ_INST.filter(function(k){ return !has(d[k]); });
  const missingRep = REQ_REP.filter(function(k){ return !has(d[k]); }).concat(has(inst.regRole) ? [] : ['regRole']);
  const missingDocs = DOC_SLOTS.filter(function(s){ return need(s) && !okDoc(s.k); });
  const brokenDocs = DOC_SLOTS.filter(function(s){ return okDoc(s.k) && !docOnServer(s.k); });

  const pubOfficial = PUB_MAIL.test(String(d.email || '').trim());
  const repVerified = !missingRep.length && !!docOnServer('rep') && (pubOfficial ? !!docOnServer('reg') : inst.em === 'ok');
  const authEmailOk = has(d.aemail) && (PUB_MAIL.test(String(d.aemail).trim()) ? !!docOnServer('aprf') : inst.aem === 'ok');
  const authVerified = authEmailOk && !!docOnServer('auth');

  const items = [
    { ok: inst.sub === true, label: 'Profile submitted for review', note: inst.sub === true ? '' : 'The institution has registered but has not submitted its profile yet.' },
    { ok: !missingInst.length, label: 'Institution details complete', note: missingInst.length ? missingInst.length + ' required field' + (missingInst.length > 1 ? 's' : '') + ' empty.' : '' },
    { ok: repVerified, label: 'Representative verified', note: repVerified ? '' : (missingRep.length ? 'Representative details incomplete.' : !docOnServer('rep') ? 'Representative proof missing.' : pubOfficial ? 'Official email is public and registration proof is missing.' : 'Official email not verified.') },
    { ok: authVerified, label: 'Institution authority verified', note: authVerified ? '' : (!has(d.aemail) ? 'No authority email given.' : !docOnServer('auth') ? 'Authorization letter / ID missing.' : 'Authority email not verified.') },
    { ok: !missingDocs.length && !brokenDocs.length, label: 'Required documents uploaded', note: missingDocs.length ? 'Missing: ' + missingDocs.map(function(s){ return s.t; }).join(', ') : brokenDocs.length ? 'A document is recorded but its file is not on the server.' : '' }
  ];
  return { items:items, ready: items.every(function(i){ return i.ok; }), inst:inst, d:d, docs:docs, extra:extra, fileIds:fileIds };
}

/* ------------------------------------------------------------------ render */
function render(){
  const c = DATA.company, u = c.user || {}, st = DATA.stats || {}, a = analyse(c, DATA.files), d = a.d, inst = a.inst;
  const status = c.verification_status;
  const name = d.name || c.company_name;
  document.title = name + ' — Institution review';
  setTopTitle(name);

  const where = [d.city || c.city, d.state || c.state].filter(Boolean).join(', ');
  const logo = assetUrl(c.logo || d.logo);

  const banners = {
    pending:  ['!', 'Waiting for your review', 'Post a job, Posted jobs and Browse candidates stay locked for this institution until you approve it.'],
    approved: ['✓', 'Approved — account unlocked', 'This institution can post jobs, see its posted jobs and browse candidates.'],
    rejected: ['✕', 'Rejected — account locked', 'The institution was told it was rejected. You can still approve it after it fixes the problem.'],
    blocked:  ['■', 'Blocked', 'This institution is blocked and its published jobs were closed. Approving it again unlocks the account.']
  }[status] || ['!', statusLabel(status), ''];

  const actions =
    (status !== 'approved' ? '<button type="button" class="btn btn-success" id="actApprove">Approve &amp; unlock</button>' : '')
    + (status === 'pending' || status === 'approved' ? '<button type="button" class="btn btn-light" id="actReject">Reject</button>' : '')
    + (status !== 'blocked' && status !== 'pending' ? '<button type="button" class="btn btn-light" id="actBlock">Block</button>' : '');

  const hero = '<div class="rv-hero"><div class="rv-logo">' + (logo ? '<img src="' + esc(logo) + '" alt="" onerror="this.remove()">' : esc(initials(name))) + '</div>'
    + '<div class="rv-info"><h2>' + esc(name) + ' ' + pill(status) + '</h2>'
    + '<div class="meta">' + esc([d.type || c.industry, where].filter(Boolean).join(' · ') || 'Institution') + ' · Code ' + esc(c.institution_code || '—') + '</div>'
    + '<div class="rv-quick"><div><b>' + esc(fmtDate(c.created_at)) + '</b>Registered</div><div><b>' + (st.jobs || 0) + '</b>Jobs posted</div><div><b>' + (st.live_jobs || 0) + '</b>Live jobs</div><div><b>' + (st.applications || 0) + '</b>Applications</div></div></div>'
    + '<div class="rv-actions">' + actions + '</div></div>'
    + '<div class="rv-state ' + esc(status) + '"><span class="ic">' + banners[0] + '</span><div><b>' + esc(banners[1]) + '</b>' + esc(banners[2]) + '</div></div>';

  const checks = card('Verification checklist',
    '<ul class="rv-checks">' + a.items.map(function(i){
      return '<li><span class="dot ' + (i.ok ? 'ok' : 'warn') + '">' + (i.ok ? '✓' : '!') + '</span><div>' + esc(i.label) + (i.note ? '<small>' + esc(i.note) + '</small>' : '') + '</div></li>';
    }).join('') + '</ul>',
    a.ready ? '<span class="admin-pill ok">Ready to approve</span>' : '<span class="admin-pill pending">Needs attention</span>');

  const details = card('Institution details', kv([
    ['Institution name', name], ['Institution type', d.type || c.industry], ['Short / display name', d.short], ['Year established', d.year],
    ['Official website', link(d.website || c.website), { html:true }], ['Official email', mailHtml(d.email || c.email) + (inst.em === 'ok' ? '<span class="rv-tag ok">Verified</span>' : ''), { html:true }],
    ['Official phone', d.phone || c.phone], ['Registration / affiliation no.', d.reg], ['Affiliated university / board', d.affil], ['Accreditation / recognition', d.accred],
    ['Short description', d.about1, { full:true }]
  ]) + (has(d.about2 || c.description) ? '<div class="rv-text">' + esc(d.about2 || c.description) + '</div>' : ''));

  const locationCard = card('Location', kv([
    ['Country', d.country], ['State', d.state || c.state], ['District', d.district], ['City', d.city || c.city], ['Area / locality', d.area], ['PIN code', d.pin],
    ['Full address', d.address, { full:true }]
  ]));

  const rep = card('Representative (person who registered)', kv([
    ['Name', d.rname], ['Designation', d.rdes], ['Registration role', inst.regRole], ['Department', d.rdep],
    ['Work email', mailHtml(d.remail), { html:true }], ['Work phone', d.rphone], ['Employee ID', d.eid],
    ['Connection to institution', inst.auth === 'behalf' ? 'Registering on behalf' + (inst.role ? ' — ' + inst.role : '') : inst.auth === 'self' ? 'Authorised to represent' : '']
  ]));

  const authority = card('Institution authority', kv([
    ['Authority name', d.aname], ['Designation', d.adesig],
    ['Official email', mailHtml(d.aemail) + (inst.aem === 'ok' ? '<span class="rv-tag ok">Verified</span>' : ''), { html:true }], ['Phone', d.aphone]
  ]));

  // Documents: the four required slots, extra documents, then any other file on the account.
  const slotRow = function(s){
    const rec = a.docs[s.k], ok = rec && rec.st === 'ok', onServer = ok && rec.fid && a.fileIds[rec.fid];
    const need = typeof s.req === 'function' ? s.req(d) : s.req;
    return '<div class="rv-doc' + (onServer ? '' : ' missing') + '"><span class="ic">' + (onServer ? 'DOC' : '—') + '</span><div class="t"><b>' + esc(s.t) + '</b><small>'
      + (onServer ? esc(rec.name || a.fileIds[rec.fid].original_name) + ' · ' + esc(a.fileIds[rec.fid].file_size ? fmtSize(a.fileIds[rec.fid].file_size) : (rec.size || ''))
        : ok ? 'Recorded but the file is missing on the server' : need ? 'Required — not uploaded' : 'Not uploaded' + (s.note ? ' (' + s.note + ')' : ''))
      + '</small></div>' + (onServer ? '<button type="button" class="btn btn-ghost btn-sm" data-open="' + rec.fid + '">View</button>' : '<span class="admin-pill ' + (need ? 'bad' : 'closed') + '">' + (need ? 'Missing' : 'Optional') + '</span>') + '</div>';
  };
  const used = {}; DOC_SLOTS.forEach(function(s){ const r = a.docs[s.k]; if(r && r.fid) used[r.fid] = 1; });
  const extraRows = a.extra.filter(function(x){ return x && x.st === 'ok' && x.fid && a.fileIds[x.fid]; }).map(function(x){
    used[x.fid] = 1;
    return '<div class="rv-doc"><span class="ic">DOC</span><div class="t"><b>' + esc(x.type || 'Additional document') + '</b><small>' + esc(x.name || a.fileIds[x.fid].original_name) + ' · ' + esc(fmtSize(a.fileIds[x.fid].file_size)) + '</small></div><button type="button" class="btn btn-ghost btn-sm" data-open="' + x.fid + '">View</button></div>';
  });
  const otherRows = (DATA.files || []).filter(function(f){ return f.category === 'other' && !used[f.id]; }).map(function(f){
    return '<div class="rv-doc"><span class="ic">FILE</span><div class="t"><b>Other uploaded file</b><small>' + esc(f.original_name) + ' · ' + esc(fmtSize(f.file_size)) + ' · ' + esc(fmtDate(f.created_at)) + '</small></div><button type="button" class="btn btn-ghost btn-sm" data-open="' + f.id + '">View</button></div>';
  });
  const documents = card('Verification documents', DOC_SLOTS.map(slotRow).join('') + extraRows.join('') + otherRows.join(''));

  // Campuses / branches.
  const formBranches = (inst.branches || []).filter(function(b){ return b && has(b.name); });
  const linked = DATA.branches || [];
  const branchRows = formBranches.map(function(b){
    return '<div class="rv-branch"><b>' + esc(b.name) + (has(b.type) ? ' <span class="muted">· ' + esc(b.type) + '</span>' : '') + '</b><small>' + esc([b.city, b.state].filter(Boolean).join(', ') || 'Location not given') + (has(b.cname) ? ' · Contact: ' + esc(b.cname) : '') + '</small></div>';
  }).concat(linked.map(function(b){
    return '<div class="rv-branch"><b>' + esc(b.company_name) + ' <span class="muted">· linked sub-branch</span></b><small>' + esc([b.city, b.state].filter(Boolean).join(', ') || '—') + ' · ' + pill(b.branch_status === 'approved' ? 'approved' : (b.branch_status || 'pending')) + '</small></div>';
  }));
  const branches = card('Campuses &amp; branches', branchRows.join('') || '<div class="admin-empty">No campuses or branches added.</div>');

  const account = card('Account', kv([
    ['Account holder', u.name], ['Login email', u.email], ['Phone', u.phone], ['Account status', '<span class="admin-pill ' + esc(u.status === 'blocked' ? 'blocked' : 'active') + '">' + esc(statusLabel(u.status || 'active')) + '</span>', { html:true }],
    ['Registered on', fmtDate(c.created_at)], ['Profile last updated', fmtDate(c.updated_at)],
    ['Institution code', c.institution_code], ['Parent institution', c.parent ? c.parent.company_name : '']
  ]));

  root().innerHTML = hero
    + '<div class="rv-grid"><div class="rv-col">' + details + locationCard + rep + authority + '</div>'
    + '<div class="rv-col">' + checks + documents + branches + account + '</div></div>';

  bindActions(c, a);
}

/* ------------------------------------------------------------------ actions */
function bindActions(c, a){
  const name = (a.d.name || c.company_name);
  root().querySelectorAll('[data-open]').forEach(function(b){ b.addEventListener('click', function(){ openFile(b.dataset.open); }); });

  const run = async function(btn, path, body, okMsg){
    const label = btn.textContent; btn.disabled = true; btn.textContent = 'Please wait…';
    try{ await api.put('/admin/companies/' + c.id + path, body); toast(okMsg); await load(); }
    catch(e){ toast(e.message, true); btn.disabled = false; btn.textContent = label; }
  };
  const ap = document.getElementById('actApprove'), rj = document.getElementById('actReject'), bl = document.getElementById('actBlock');

  if(ap) ap.addEventListener('click', async function(){
    const warn = a.ready ? '' : '<p style="margin:10px 0 0;padding:10px 12px;background:var(--amber-bg);color:#6B4A0E;border-radius:4px;"><b>Checklist not complete:</b> ' + a.items.filter(function(i){ return !i.ok; }).map(function(i){ return esc(i.label); }).join(', ') + '.</p>';
    const r = await askDialog({ title:'Approve and unlock ' + name + '?', body:'<p style="margin:6px 0 0">Post a job, Posted jobs and Browse candidates will unlock on their account right away, and they will be notified.</p>' + warn, confirmLabel: a.ready ? 'Approve & unlock' : 'Approve anyway' });
    if(r.ok) run(ap, '/approve', {}, name + ' approved. Their account is unlocked.');
  });
  if(rj) rj.addEventListener('click', async function(){
    const r = await askDialog({
      title:'Reject ' + name + '?', danger:true, confirmLabel:'Reject',
      body:'<p style="margin:6px 0 0">The institution stays locked and receives your reason, so tell them exactly what to fix.</p>',
      reason:{ required:true, label:'Reason for rejection', placeholder:'e.g. Registration certificate is unreadable. Please upload a clear copy.', requiredMsg:'Please give a reason so the institution knows what to fix.' }
    });
    if(r.ok) run(rj, '/reject', { reason:r.reason }, name + ' rejected. The reason was sent to them.');
  });
  if(bl) bl.addEventListener('click', async function(){
    const r = await askDialog({
      title:'Block ' + name + '?', danger:true, confirmLabel:'Block',
      body:'<p style="margin:6px 0 0">Their published jobs will be closed and the account stays locked. You can approve them again later.</p>',
      reason:{ required:false, label:'Reason (optional)', placeholder:'Optional note shown to the institution' }
    });
    if(r.ok) run(bl, '/block', r.reason ? { reason:r.reason } : {}, name + ' blocked.');
  });
}

/* ------------------------------------------------------------------ load + start */
async function load(){
  try{
    DATA = await api.get('/admin/companies/' + encodeURIComponent(COMPANY_ID));
    render();
    loadPendingBadge();
  }catch(e){
    root().innerHTML = '<div class="admin-panel"><div class="admin-error"><span>' + esc(e.status === 404 ? 'This institution was not found. It may have been deleted.' : e.message) + '</span>'
      + (e.status === 404 ? '<a class="btn btn-ghost btn-sm" href="index.html?tab=institutions">Back to institutions</a>' : '<button type="button" class="btn btn-ghost btn-sm" onclick="load()">Retry</button>') + '</div></div>';
  }
}
window.load = load;
function loadPendingBadge(){ api.get('/admin/dashboard').then(function(d){ setPendingBadge(((d.companies_by_status || {}).pending) || 0); }).catch(function(){}); }

(async function init(){
  const user = await requireAdmin(); if(!user) return;
  mountChrome({ active:'institutions', title:'Institution review', user:user, back:{ href:'index.html?tab=institutions&status=pending', label:'Back to institutions' } });
  if(!/^\d+$/.test(String(COMPANY_ID || ''))){
    root().innerHTML = '<div class="admin-panel"><div class="admin-error"><span>No institution selected.</span><a class="btn btn-ghost btn-sm" href="index.html?tab=institutions">Back to institutions</a></div></div>';
    return;
  }
  load();
})();
