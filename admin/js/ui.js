// admin/js/ui.js — helpers shared by every admin page. Load after ../js/api.js and auth.js.

const ADMIN_ICONS = {
  overview: '<path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  institutions: '<path d="M3 21h18M4 21V9l8-5 8 5v12M9 21v-6h6v6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  applications: '<rect x="3" y="7" width="18" height="13" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" stroke-width="1.6"/>',
  jobs: '<rect x="3" y="4" width="18" height="16" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  files: '<path d="M6 3h8l4 4v14H6V3Z M14 3v4h4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  notifications: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>',
  catalog: '<path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  branches: '<circle cx="12" cy="5.5" r="2.3" stroke="currentColor" stroke-width="1.6"/><circle cx="6" cy="18" r="2.3" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18" r="2.3" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.8v4.2M12 12H6v3.7M12 12h6v3.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  faculty: '<circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 20c1-3.6 4.2-6 7.5-6s6.5 2.4 7.5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
};
const ADMIN_NAV = [
  ['overview', 'Overview', 'Dashboard'],
  ['institutions', 'Institutions', 'Verification'],
  ['branches', 'Sub-branch requests', 'Verification'],
  ['applications', 'Job Applications', 'Activity'],
  ['faculty', 'Faculty', 'Directory'],
  ['jobs', 'Jobs', 'Manage'],
  ['files', 'Files', 'Manage'],
  ['notifications', 'Announcements', 'Manage'],
  ['catalog', 'Skills & Categories', 'Manage']
];

function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; });
}
function initials(name){ return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function(w){ return w[0]; }).join('').toUpperCase() || '?'; }
function fmtDate(d){
  if(!d) return '—';
  const t = new Date(d); if(isNaN(t)) return '—';
  return t.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtSize(b){ b = Number(b) || 0; return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
function statusLabel(s){ return ({ under_review:'Under review' }[s]) || (String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1).replace(/_/g, ' ')); }
function pill(status){ return '<span class="admin-pill ' + esc(status) + '">' + esc(statusLabel(status)) + '</span>'; }
// Public file URLs (logos) come back as full URLs or storage-relative paths.
function assetUrl(p){
  if(!p) return '';
  if(/^(https?:|data:)/.test(p)) return p;
  return api.BASE.replace(/\/api$/, '') + '/' + String(p).replace(/^\/+/, '');
}
function avatarHtml(name, logo){
  const u = assetUrl(logo);
  return '<span class="admin-avatar">' + (u ? '<img src="' + esc(u) + '" alt="" onerror="this.remove()">' : '') + (u ? '' : esc(initials(name))) + '</span>';
}
function qs(o){
  const p = new URLSearchParams();
  Object.keys(o || {}).forEach(function(k){ if(o[k] !== '' && o[k] != null) p.set(k, o[k]); });
  const s = p.toString(); return s ? '?' + s : '';
}

let _toastT = null;
function toast(msg, isError){
  let el = document.getElementById('adminToast');
  if(!el){ el = document.createElement('div'); el.id = 'adminToast'; el.className = 'admin-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.toggle('error', !!isError); el.classList.add('show');
  clearTimeout(_toastT); _toastT = setTimeout(function(){ el.classList.remove('show'); }, 3600);
}

// Open a private/signed file (institution proof documents) in a new tab. Admins are allowed to open any file.
async function openFile(fileId){
  const w = window.open('', '_blank');   // opened inside the click so popup blockers allow it
  try{
    const r = await api.get('/files/' + fileId + '/link');
    const url = r && (r.url || r.link);
    if(!url) throw new Error('File link unavailable.');
    if(w){ w.opener = null; w.location.href = url; } else { window.location.href = url; }
  }catch(e){ if(w) w.close(); toast(e.message || 'Could not open the file.', true); }
}

// Build the sidebar + top bar. opts: { active, title, back:{href,label}, user }
function mountChrome(opts){
  const side = document.getElementById('adminSide'), top = document.getElementById('adminTop');
  if(side){
    let html = '<div class="admin-side-brand"><img src="../assets/logo/logo-mark.png" alt=""><span>Upaadhyay.com Admin</span></div><nav class="admin-nav" aria-label="Admin">';
    let lastGroup = '';
    ADMIN_NAV.forEach(function(n){
      if(n[2] !== lastGroup){ html += '<div class="admin-nav-group-label">' + n[2] + '</div>'; lastGroup = n[2]; }
      html += '<button type="button" class="admin-nav-item' + (n[0] === opts.active ? ' active' : '') + '" data-tab="' + n[0] + '"' + (n[0] === opts.active ? ' aria-current="page"' : '') + '>'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' + ADMIN_ICONS[n[0]] + '</svg><span>' + n[1] + '</span>'
        + (n[0] === 'institutions' ? '<b class="count" id="navPending" hidden></b>' : '') + '</button>';
    });
    html += '</nav><div class="admin-side-foot">Signed in as admin</div>';
    side.innerHTML = html;
    side.addEventListener('click', function(e){
      const b = e.target.closest('.admin-nav-item'); if(!b) return;
      if(typeof window.adminGo === 'function') window.adminGo(b.dataset.tab);
      else window.location.href = 'index.html?tab=' + b.dataset.tab;
    });
  }
  if(top){
    top.innerHTML = '<div class="admin-top-title">'
      + (opts.back ? '<button type="button" class="admin-top-back" id="adminBackBtn" aria-label="' + esc(opts.back.label || 'Back') + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '')
      + '<span id="adminTopTitle">' + esc(opts.title || '') + '</span></div>'
      + '<div class="admin-top-right"><span class="admin-top-user">' + esc((opts.user && (opts.user.email || opts.user.name)) || '') + '</span><button type="button" class="btn btn-light btn-sm" id="adminLogoutBtn">Logout</button></div>';
    document.getElementById('adminLogoutBtn').addEventListener('click', adminLogout);
    const back = document.getElementById('adminBackBtn');
    if(back) back.addEventListener('click', function(){ window.location.href = opts.back.href; });
  }
  const yr = document.getElementById('adminFooterYear'); if(yr) yr.textContent = new Date().getFullYear();
}
function setTopTitle(t){ const el = document.getElementById('adminTopTitle'); if(el) el.textContent = t; }

// Pending-institutions badge in the sidebar.
function setPendingBadge(n){
  const el = document.getElementById('navPending'); if(!el) return;
  el.textContent = n > 99 ? '99+' : n; el.hidden = !(n > 0);
}

// Simple confirm / reason dialog. opts: { title, body, confirmLabel, danger, reason:{required, label, max} }
// Resolves { ok:false } on cancel, or { ok:true, reason } on confirm.
function askDialog(opts){
  return new Promise(function(resolve){
    const ov = document.createElement('div'); ov.className = 'admin-modal open'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    const max = (opts.reason && opts.reason.max) || 500;
    ov.innerHTML = '<div class="admin-modal-card"><h4>' + esc(opts.title) + '</h4><div class="body">' + (opts.body || '')
      + (opts.reason ? '<textarea id="askReason" maxlength="' + max + '" placeholder="' + esc(opts.reason.placeholder || '') + '" aria-label="' + esc(opts.reason.label || 'Reason') + '"></textarea><div class="count"><span id="askCount">0</span>/' + max + '</div><div class="field-err" id="askErr"></div>' : '')
      + '</div><div class="foot"><button type="button" class="btn btn-ghost" id="askCancel">Cancel</button><button type="button" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-success') + '" id="askOk">' + esc(opts.confirmLabel || 'Confirm') + '</button></div></div>';
    document.body.appendChild(ov);
    const ta = ov.querySelector('#askReason'), err = ov.querySelector('#askErr');
    function close(res){ document.removeEventListener('keydown', onKey); ov.remove(); resolve(res); }
    function onKey(e){ if(e.key === 'Escape') close({ ok:false }); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function(e){ if(e.target === ov) close({ ok:false }); });
    ov.querySelector('#askCancel').addEventListener('click', function(){ close({ ok:false }); });
    if(ta){ ta.addEventListener('input', function(){ ov.querySelector('#askCount').textContent = ta.value.length; err.style.display = 'none'; }); ta.focus(); }
    ov.querySelector('#askOk').addEventListener('click', function(){
      const reason = ta ? ta.value.trim() : '';
      if(opts.reason && opts.reason.required && !reason){ err.textContent = opts.reason.requiredMsg || 'Please enter a reason.'; err.style.display = 'block'; ta.focus(); return; }
      close({ ok:true, reason:reason });
    });
    if(!ta) ov.querySelector('#askOk').focus();
  });
}

// Pager markup used by list tables. state = { page, last, total }
function pagerHtml(state, noun){
  if(!state.total) return '';
  return '<div class="admin-pager"><span>Page ' + state.page + ' of ' + state.last + ' · ' + state.total + ' ' + noun + '</span><span class="btns">'
    + '<button type="button" class="btn btn-ghost btn-sm" data-page="prev"' + (state.page <= 1 ? ' disabled' : '') + '>Previous</button>'
    + '<button type="button" class="btn btn-ghost btn-sm" data-page="next"' + (state.page >= state.last ? ' disabled' : '') + '>Next</button></span></div>';
}

// Form dialog. fields: [{ name, label, type:'text'|'email'|'textarea'|'select', value, options:[[v,label]], required, max }]
// Resolves { ok:false } on cancel, or { ok:true, values } on save. onSave(values) may throw an Error to show its message inline.
function formDialog(opts){
  return new Promise(function(resolve){
    const ov = document.createElement('div'); ov.className = 'admin-modal open'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    const f = opts.fields.map(function(x){
      const id = 'fd_' + x.name, v = x.value == null ? '' : x.value;
      let el;
      if(x.type === 'textarea') el = '<textarea id="' + id + '" maxlength="' + (x.max || 2000) + '">' + esc(v) + '</textarea>';
      else if(x.type === 'select') el = '<select id="' + id + '">' + x.options.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
      else el = '<input id="' + id + '" type="' + (x.type || 'text') + '" value="' + esc(v) + '" maxlength="' + (x.max || 190) + '">';
      return '<label class="fd-row"><span>' + esc(x.label) + (x.required ? ' *' : '') + '</span>' + el + '</label>';
    }).join('');
    ov.innerHTML = '<div class="admin-modal-card"><h4>' + esc(opts.title) + '</h4><div class="body">' + (opts.body || '') + f + '<div class="field-err" id="fdErr"></div></div>'
      + '<div class="foot"><button type="button" class="btn btn-ghost" id="fdCancel">Cancel</button><button type="button" class="btn btn-primary" id="fdOk">' + esc(opts.confirmLabel || 'Save') + '</button></div></div>';
    document.body.appendChild(ov);
    const err = ov.querySelector('#fdErr');
    function close(r){ document.removeEventListener('keydown', onKey); ov.remove(); resolve(r); }
    function onKey(e){ if(e.key === 'Escape') close({ ok:false }); }
    document.addEventListener('keydown', onKey);
    ov.querySelector('#fdCancel').addEventListener('click', function(){ close({ ok:false }); });
    ov.querySelector('#fdOk').addEventListener('click', async function(){
      const values = {};
      for(const x of opts.fields){
        const v = ov.querySelector('#fd_' + x.name).value.trim();
        if(x.required && !v){ err.textContent = x.label + ' is required.'; err.style.display = 'block'; return; }
        values[x.name] = v;
      }
      const btn = this; btn.disabled = true;
      try{ if(opts.onSave) await opts.onSave(values); close({ ok:true, values:values }); }
      catch(e){ err.textContent = e.message || 'Could not save.'; err.style.display = 'block'; btn.disabled = false; }
    });
    const first = ov.querySelector('input,textarea,select'); if(first) first.focus();
  });
}

// Delete confirmation that must be typed-confirmed by a click on a red button.
function confirmDelete(what, extra){
  return askDialog({ title:'Delete ' + what + '?', body:(extra || 'This cannot be undone.'), confirmLabel:'Delete', danger:true });
}
