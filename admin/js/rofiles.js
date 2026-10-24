// admin/js/profiles.js — full profile views for admin.
//  • Institution review page: admin verifies the official / HR (representative) / Dean (authority) emails
//    by hand (no OTP), and sees EVERY detail the institution entered.
//  • Faculty drawer: full profile (education, experience, skills, documents, preferences, everything saved).
// Needs backend: PUT /api/admin/companies/{id}/email-verification  { field:'official'|'representative'|'authority', verified:true|false }
(function(){
  const esc2 = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  const has2 = function(v){ return String(v == null ? '' : v).trim() !== ''; };
  const human = function(k){ return String(k).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }); };

  // Turns any saved value into readable text (skips empty values and inline images).
  function fmt(v){
    if(v == null || v === '' || v === false && false) return '';
    if(typeof v === 'boolean') return v ? 'Yes' : 'No';
    if(typeof v === 'string') return /^data:/i.test(v) ? '' : v;
    if(typeof v === 'number') return String(v);
    if(Array.isArray(v)) return v.map(fmt).filter(has2).join(' | ');
    if(typeof v === 'object') return Object.keys(v).map(function(k){ const t = fmt(v[k]); return has2(t) ? human(k) + ': ' + t : ''; }).filter(has2).join(' · ');
    return '';
  }
  function dump(obj, skip){
    skip = skip || [];
    return Object.keys(obj || {}).filter(function(k){ return skip.indexOf(k) < 0 && has2(fmt(obj[k])); })
      .map(function(k){ return [human(k), fmt(obj[k]), { full:true }]; });
  }

  /* ================================================================ INSTITUTION REVIEW PAGE */
  if(typeof render === 'function' && typeof analyse === 'function' && document.getElementById('reviewRoot')){
    const origAnalyse = window.analyse;
    // Admin-verified emails count the same as OTP-verified ones in the checklist.
    window.analyse = function(c, files){
      const a = origAnalyse(c, files), inst = a.inst, d = a.d, docs = a.docs;
      const onSrv = function(k){ return docs[k] && docs[k].st === 'ok' && docs[k].fid && a.fileIds[docs[k].fid]; };
      const repMissing = ['rname','rdes','rdep','remail','rphone'].filter(function(k){ return !has2(d[k]); }).length || !has2(inst.regRole);
      const repOk = !repMissing && !!onSrv('rep') && (inst.rem === 'ok' || inst.em === 'ok' || (PUB_MAIL.test(String(d.email || '').trim()) && !!onSrv('reg')));
      const authOk = has2(d.aemail) && (inst.aem === 'ok' || (PUB_MAIL.test(String(d.aemail).trim()) && !!onSrv('aprf'))) && !!onSrv('auth');
      a.items.forEach(function(i){
        if(i.label === 'Representative verified'){ i.ok = repOk; i.note = repOk ? '' : (i.note || 'Verify the representative / HR email below.'); }
        if(i.label === 'Institution authority verified'){ i.ok = authOk; i.note = authOk ? '' : (!has2(d.aemail) ? 'No authority email given.' : i.note); }
      });
      a.ready = a.items.every(function(i){ return i.ok; });
      return a;
    };

    const origRender = window.render;
    window.render = function(){
      origRender();
      const c = DATA.company, a = window.analyse(c, DATA.files), d = a.d, inst = a.inst;
      const rows = [
        ['official',       'Official institution email', d.email,  inst.em  === 'ok'],
        ['representative', 'Representative / HR email',  d.remail, inst.rem === 'ok'],
        ['authority',      'Dean / Principal / authority email', d.aemail, inst.aem === 'ok']
      ].filter(function(r){ return has2(r[2]); });
      const emailCard = '<section class="rv-card"><h3><span>Email verification (by admin)</span></h3>'
        + '<p class="muted" style="margin:0 0 8px;font-size:12px">No OTP is used. Contact the person on the email they entered, then mark it verified here.</p>'
        + (rows.map(function(r){
          return '<div class="rv-doc"><span class="ic">@</span><div class="t"><b>' + esc2(r[1]) + '</b><small>' + esc2(r[2]) + (PUB_MAIL.test(r[2]) ? ' · public email' : '') + '</small></div>'
            + '<a class="btn btn-ghost btn-sm" href="mailto:' + esc2(r[2]) + '">Email</a> '
            + (r[3] ? '<span class="admin-pill ok">Verified</span> <button type="button" class="btn btn-ghost btn-sm danger" data-ev="' + r[0] + '" data-v="0">Remove</button>'
                    : '<button type="button" class="btn btn-primary btn-sm" data-ev="' + r[0] + '" data-v="1">Mark verified</button>') + '</div>';
        }).join('') || '<div class="admin-empty">No emails entered.</div>') + '</section>';

      const SHOWN = ['name','type','short','year','website','email','phone','reg','affil','accred','about1','about2','country','state','district','city','area','pin','address','rname','rdes','rdep','remail','rphone','eid','aname','adesig','aemail','aphone','logo'];
      const restD = dump(d, SHOWN);
      const restI = dump(inst, ['d','docs','extra','branches','em','aem','rem','sub','step','max','view','vs','sec','web','doc','docType','c1','c2']);
      const allCard = '<section class="rv-card"><h3><span>Other details submitted</span></h3>'
        + ((restD.length || restI.length) ? kv(restD.concat(restI)) : '<div class="admin-empty">Nothing else was submitted.</div>') + '</section>';

      const cols = root().querySelectorAll('.rv-col');
      if(cols[1]) cols[1].insertAdjacentHTML('afterbegin', emailCard);
      if(cols[0]) cols[0].insertAdjacentHTML('beforeend', allCard);

      root().querySelectorAll('[data-ev]').forEach(function(b){
        b.addEventListener('click', async function(){
          const on = b.dataset.v === '1', label = b.closest('.rv-doc').querySelector('b').textContent;
          const r = await askDialog({ title:(on ? 'Mark verified: ' : 'Remove verification: ') + label + '?',
            body:'<p style="margin:6px 0 0">' + (on ? 'Confirm you have checked that this email belongs to the person / institution.' : 'The email will show as not verified again.') + '</p>',
            confirmLabel:on ? 'Mark verified' : 'Remove', danger:!on });
          if(!r.ok) return;
          b.disabled = true;
          try{ await api.put('/admin/companies/' + c.id + '/email-verification', { field:b.dataset.ev, verified:on }); toast(on ? 'Email marked verified.' : 'Verification removed.'); await load(); }
          catch(e){ toast(e.message || 'Could not save. Please try again.', true); b.disabled = false; }
        });
      });
    };
  }

  /* ================================================================ FACULTY FULL PROFILE */
  if(typeof openFaculty === 'function'){
    window.openFaculty = async function(id, tab){
      let u; try{ u = await api.get('/admin/users/' + id); }catch(e){ toast(e.message, true); return; }
      const p = u.candidate_profile || u.candidateProfile || {}, pd = p.profile_data || {}, fp = pd.fp || {};
      const blocked = u.status === 'blocked', nm = String(u.name || '').replace(/'/g, '');
      let ov = document.querySelector('.xd-bg'); if(ov) ov.remove();
      ov = document.createElement('div'); ov.className = 'xd-bg';
      ov.innerHTML = '<div class="xd xd-wide" role="dialog" aria-modal="true"><div class="xd-top">' + avatarHtml(u.name, p.profile_photo) + '<div><b>' + esc2(u.name) + '</b><small>' + esc2(u.email) + '</small></div><button type="button" class="xd-x" aria-label="Close">×</button></div>'
        + '<div class="xd-tabs">' + [['info','Profile'],['docs','Documents'],['jobs','Jobs applied'],['act','Actions']].map(function(t){ return '<button type="button" class="admin-tab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="xd-body" id="xdBody"></div></div>';
      document.body.appendChild(ov);
      const body = ov.querySelector('#xdBody'), close = function(){ ov.remove(); };
      ov.addEventListener('click', function(e){ if(e.target === ov || e.target.classList.contains('xd-x')) close(); });
      const sec = function(title, rows){
        rows = rows.filter(function(r){ return has2(r[1]); });
        return rows.length ? '<h4 class="xd-h">' + esc2(title) + '</h4>' + rows.map(function(r){ return '<div class="xd-kv"><span>' + esc2(r[0]) + '</span><b>' + esc2(r[1]) + '</b></div>'; }).join('') : '';
      };
      const list = function(title, items){ items = items.filter(has2); return items.length ? '<h4 class="xd-h">' + esc2(title) + '</h4>' + items.map(function(t){ return '<div class="xd-item"><div>' + esc2(t) + '</div></div>'; }).join('') : ''; };

      function profileHtml(){
        const skills = (u.skills || []).map(function(s){ return s.name; });
        const edu = []; (fp.edu ? Object.keys(fp.edu) : []).forEach(function(k){ const t = fmt(fp.edu[k]); if(has2(t)) edu.push(human(k) + ' — ' + t); });
        if(pd.qualification || pd.subject) edu.push([pd.qualification, pd.subject, pd.college, pd.highestQualYear].filter(has2).join(' · '));
        (pd.additionalQualifications || []).forEach(function(q){ edu.push(fmt(q)); });
        const jobs = (fp.jobs || []).map(fmt).concat((pd.employmentHistory || []).map(fmt));
        const used = ['fp','avatar','additionalQualifications','employmentHistory','otherDocuments'];
        return sec('Account', [['Phone', u.phone], ['Email', u.email], ['Account status', blocked ? 'Blocked' : 'Active'], ['Registered', fmtDate(u.created_at)]])
          + sec('Basic', [['Current role', p.current_job_title], ['Location', [p.city, p.state].filter(has2).join(', ')], ['Total experience', p.total_experience != null && p.total_experience !== '' ? p.total_experience + ' yrs' : ''], ['Headline / bio', p.bio || pd.about || fp.headline]])
          + list('Education', edu) + list('Employment history', jobs) + list('Skills', skills.length ? [skills.join(', ')] : [])
          + list('Other documents / links', (pd.otherDocuments || []).map(fmt).concat((fp.links || []).map(fmt)))
          + sec('Other profile details', dump(pd, used).concat(dump(fp, ['edu','jobs','links'])))
          + (!Object.keys(pd).length && !p.id ? '<div class="admin-empty">This faculty member has not filled in their profile yet.</div>' : '');
      }
      async function show(t){
        ov.querySelectorAll('.xd-tabs .admin-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.t === t); });
        if(t === 'info') body.innerHTML = profileHtml();
        if(t === 'docs'){
          body.innerHTML = '<div class="admin-loading">Loading…</div>';
          try{
            const fs = (await fetchAll('/admin/files', {})).filter(function(f){ const o = f.user || f.owner || {}; return f.user_id === u.id || o.id === u.id || o.email === u.email; });
            body.innerHTML = fs.map(function(f){ return '<div class="xd-item"><div><b>' + esc2(f.original_name || f.name) + '</b><small>' + esc2(statusLabel(f.category)) + ' · ' + esc2(fmtSize(f.size || f.file_size)) + ' · ' + esc2(fmtDate(f.created_at)) + '</small></div><button type="button" class="btn btn-ghost btn-sm" onclick="openFile(' + f.id + ')">View</button></div>'; }).join('') || '<div class="admin-empty">No documents uploaded (resume, certificates, photo).</div>';
          }catch(e){ body.innerHTML = '<div class="admin-error"><span>' + esc2(e.message) + '</span></div>'; }
        }
        if(t === 'jobs'){
          body.innerHTML = '<div class="admin-loading">Loading…</div>';
          try{
            const apps = (await fetchAll('/admin/applications', { search:u.email })).filter(function(a){ return (a.candidate || {}).id === u.id || (a.candidate || {}).email === u.email; });
            body.innerHTML = apps.map(function(a){ const j = a.job || {}; return '<div class="xd-item"><div><b>' + esc2(j.title || '—') + '</b><small>' + esc2((j.company || {}).company_name || '—') + ' · ' + esc2(fmtDate(a.applied_at || a.created_at)) + '</small></div>' + pill(a.status) + '</div>'; }).join('') || '<div class="admin-empty">No applications yet.</div>';
          }catch(e){ body.innerHTML = '<div class="admin-error"><span>' + esc2(e.message) + '</span></div>'; }
        }
        if(t === 'act') body.innerHTML = '<div class="xd-acts"><button type="button" class="btn btn-primary btn-sm" data-a="edit">Edit account</button><button type="button" class="btn btn-ghost btn-sm' + (blocked ? '' : ' danger') + '" data-a="block">' + (blocked ? 'Unblock' : 'Block') + '</button><button type="button" class="btn btn-ghost btn-sm danger" data-a="del">Delete</button></div>';
      }
      ov.querySelector('.xd-tabs').addEventListener('click', function(e){ const b = e.target.closest('[data-t]'); if(b) show(b.dataset.t); });
      body.addEventListener('click', function(e){
        const b = e.target.closest('[data-a]'); if(!b) return; close();
        if(b.dataset.a === 'edit') editUser(id); if(b.dataset.a === 'block') toggleUser(id, !blocked, nm); if(b.dataset.a === 'del') deleteUser(id, nm);
      });
      show(tab || 'info');
    };
  }
})();
