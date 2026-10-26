/* settings.js — Settings section for every dashboard (faculty | main institution | sub-branch).
   Sections are listed in the sidebar under "Settings" (see sidebar.js); this file only builds the content.
   Needs profile-card.js (UpCard). Load it before sidebar.js.

   Where things are saved
   - Notification / privacy / preference choices: localStorage (upadyay_settings_v1), one bucket per role.
     When a backend exists, swap save() for an API call — nothing else changes.
   - Change password / delete account: call the Laravel endpoints in ENDPOINTS below. If the server
     does not have that route yet the user is told it is not available (nothing is faked). */
(function(){
  if(!window.UpCard) return;
  var KEY = 'upadyay_settings_v1';
  var ENDPOINTS = { password:'/auth/password', deleteAccount:'/auth/account' };   /* adjust to your API */
  var esc = UpCard.esc, cur = 0;

  /* ---------------- what each role gets ---------------- */
  var NOTIF = {
    seeker:[ ['jobs','New jobs matching my preferences','Roles that fit your categories and location.',1,1],
             ['app','Application updates','When an institution views, shortlists or rejects your application.',1,1],
             ['view','Institutions viewing my profile','Know when your profile is opened.',1,1],
             ['invite','Interview invitations & messages','Direct messages and interview requests.',1,1],
             ['remind','Profile completion reminders','A nudge when sections are missing.',1,0],
             ['news','Tips & platform updates','Occasional news about Upaadhyay.',0,0] ],
    company:[ ['apps','New applicants','When a faculty member applies to one of your jobs.',1,1],
              ['verify','Verification & approval updates','Status of your institution review.',1,1],
              ['reqs','Sub-branch requests','When a sub-branch asks to connect to your institution.',1,1],
              ['jobs','Job posting status','When a job goes live or is about to expire.',1,1],
              ['sum','Weekly hiring summary','Applicants and views, once a week.',1,0],
              ['news','Tips & platform updates','Occasional news about Upaadhyay.',0,0] ],
    branch:[ ['apps','New applicants','When a faculty member applies to one of your jobs.',1,1],
             ['link','Main institution approval','When your main institution approves or rejects your request.',1,1],
             ['verify','Verification updates','Status of your branch review.',1,1],
             ['jobs','Job posting status','When a job goes live or is about to expire.',1,1],
             ['sum','Weekly hiring summary','Applicants and views, once a week.',1,0] ]
  };
  var NAMES = {
    seeker:['Account','Notifications','Job alerts','Privacy & visibility','Security','Data & account'],
    company:['Account','Notifications','Hiring preferences','Institution visibility','Security','Data & account'],
    branch:['Account','Notifications','Hiring preferences','Branch visibility','Security','Data & account']
  };
  var SUBS = {
    'Account':'Your sign-in details and where we send updates.',
    'Notifications':'Choose what you hear about, and where.',
    'Job alerts':'Get the right openings without searching every day.',
    'Privacy & visibility':'Control who can see your profile and contact details.',
    'Hiring preferences':'Defaults for the jobs you post and the applications you receive.',
    'Institution visibility':'What candidates can see about your institution.',
    'Branch visibility':'What candidates can see about your branch.',
    'Security':'Keep your account safe.',
    'Data & account':'Download your information or close your account.'
  };
  var DEFAULTS = (function(){
    var d = { seeker:{ 'ja.on':1, 'ja.freq':'daily', 'ja.cat.Schools':1, 'ja.cat.Intermediate':1, 'ja.cat.Higher Education':1, 'ja.reloc':0, 'ja.otw':1,
                       'pv.vis':'verified', 'pv.phone':0, 'pv.email':1, 'pv.emp':1, 'pv.resume':1, 'pv.search':1 },
              company:{ 'hp.ack':1, 'hp.validity':'30', 'hp.deliver':'each', 'hp.close':1, 'iv.dir':1, 'iv.contact':1, 'iv.badge':1, 'iv.branches':1 },
              branch:{ 'hp.ack':1, 'hp.validity':'30', 'hp.deliver':'each', 'hp.close':1, 'iv.main':1, 'iv.contact':1, 'iv.badge':1 } };
    Object.keys(NOTIF).forEach(function(r){ d[r]['n.digest'] = 'instant'; NOTIF[r].forEach(function(n){ d[r]['n.' + n[0] + '.e'] = n[3]; d[r]['n.' + n[0] + '.a'] = n[4]; }); });
    return d;
  })();

  /* ---------------- storage ---------------- */
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }
  function get(role, k){ var b = load()[role]; return b && b[k] !== undefined ? b[k] : (DEFAULTS[role] || {})[k]; }
  function set(role, k, v){ var a = load(); a[role] = a[role] || {}; a[role][k] = v; try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
  function role(){ var r = UpCard.role(); return NAMES[r] ? r : 'seeker'; }
  function toast(m){ if(typeof showGenericToast === 'function') showGenericToast(m); else if(window.api && api.toast) api.toast(m); }

  /* ---------------- who am I (read-only account facts) ---------------- */
  function lsj(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
  function who(r){
    var c = UpCard.data(r) || {}, email = '', phone = '';
    try{ if(window.api && api.user && api.user.email) email = api.user.email; }catch(e){}
    if(r === 'seeker'){ try{ email = email || currentUser.email || ''; phone = currentUser.phone || currentUser.mobile || ''; }catch(e){} }
    else if(r === 'company'){ try{ email = email || currentCompany.email || ''; phone = currentCompany.phone || ''; }catch(e){} }
    else { var s = (lsj('nwSub') || {}).sub || {}; email = email || s.em || ''; phone = s.ph || ''; }
    return { name:c.name || '', email:email, phone:phone,
             type:r === 'seeker' ? 'Faculty account' : r === 'company' ? 'Main institution account' : 'Sub-branch account' };
  }

  /* ---------------- small builders ---------------- */
  function sw(k, on, label){ return '<label class="st-sw"><input type="checkbox" data-st="' + esc(k) + '"' + (on ? ' checked' : '') + ' aria-label="' + esc(label || k) + '"><span></span></label>'; }
  function row(title, desc, ctl){ return '<div class="st-row"><div class="st-txt"><b>' + title + '</b>' + (desc ? '<small>' + desc + '</small>' : '') + '</div><div class="st-ctl">' + ctl + '</div></div>'; }
  function toggleRow(r, k, title, desc){ return row(esc(title), esc(desc || ''), sw(k, get(r, k), title)); }
  function selectRow(r, k, title, desc, opts){
    var v = String(get(r, k));
    return row(esc(title), esc(desc || ''), '<select class="st-in" data-st="' + esc(k) + '" aria-label="' + esc(title) + '">' + opts.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>');
  }
  function card(title, desc, body, cls){ return '<div class="st-card' + (cls ? ' ' + cls : '') + '"><div class="st-ch"><h4>' + esc(title) + '</h4>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + '</div>' + body + '</div>'; }
  function fact(label, val){ return '<div class="st-fact"><span>' + esc(label) + '</span><b>' + (val ? esc(val) : '<i>Not added</i>') + '</b></div>'; }
  var FREQ = [['instant', 'Instantly'], ['daily', 'Daily summary'], ['weekly', 'Weekly summary']];

  /* ---------------- sections ---------------- */
  function account(r){
    var w = who(r), em = get(r, 'ac.email'), ph = get(r, 'ac.phone');
    return card('Account details', 'These come from your profile. Change them there so they stay in one place.',
        '<div class="st-facts">' + fact(r === 'seeker' ? 'Name' : r === 'company' ? 'Institution' : 'Branch', w.name) + fact('Sign-in email', w.email) + fact('Phone', w.phone) + fact('Account type', w.type) + '</div>'
        + '<div class="st-foot"><button type="button" class="btn btn-ghost btn-sm" data-act="profile">Edit in profile</button></div>')
      + card('Where should we send updates?', 'Leave blank to use your sign-in email.',
        '<div class="st-form"><label>Notification email<input id="stEmail" class="st-in" type="email" value="' + esc(em !== undefined ? em : '') + '" placeholder="' + esc(w.email || 'name@example.com') + '"></label>'
        + '<label>Mobile number (optional)<input id="stPhone" class="st-in" type="tel" inputmode="tel" value="' + esc(ph !== undefined ? ph : '') + '" placeholder="10-digit number"></label></div>'
        + '<div class="st-foot"><button type="button" class="btn btn-primary btn-sm" data-act="contact">Save</button></div>');
  }
  function notifications(r){
    var rows = NOTIF[r].map(function(n){
      return '<div class="st-row"><div class="st-txt"><b>' + esc(n[1]) + '</b><small>' + esc(n[2]) + '</small></div><div class="st-ctl st-two"><span class="st-ch2"><em>Email</em>' + sw('n.' + n[0] + '.e', get(r, 'n.' + n[0] + '.e'), n[1] + ' by email') + '</span><span class="st-ch2"><em>In-app</em>' + sw('n.' + n[0] + '.a', get(r, 'n.' + n[0] + '.a'), n[1] + ' in the app') + '</span></div></div>';
    }).join('');
    return card('What to notify me about', 'Email and in-app are set separately for each item.', rows)
      + card('Email frequency', '', selectRow(r, 'n.digest', 'Send my emails', 'Instant sends each one as it happens. Summaries bundle them into one email.', FREQ));
  }
  function alerts(r){
    var cats = ['Schools', 'Intermediate', 'Higher Education'].map(function(c){ return '<label class="st-chip"><input type="checkbox" data-st="ja.cat.' + esc(c) + '"' + (get(r, 'ja.cat.' + c) ? ' checked' : '') + '><span>' + esc(c) + '</span></label>'; }).join('');
    return card('Job alerts', '', toggleRow(r, 'ja.on', 'Email me new matching jobs', 'Based on the categories below and your teaching preferences.')
        + selectRow(r, 'ja.freq', 'How often', '', FREQ)
        + row('Categories', 'Only alert me about these.', '<div class="st-chips">' + cats + '</div>'))
      + card('Availability', '', toggleRow(r, 'ja.otw', 'Open to work', 'Shows institutions you are available for new roles.')
        + toggleRow(r, 'ja.reloc', 'Open to relocation', 'Include jobs outside your current city.'));
  }
  function hiring(r){
    return card('Applications', '', selectRow(r, 'hp.deliver', 'How I receive applications', 'You can always see everyone in Applicants.', [['each', 'Email me each application'], ['digest', 'Daily digest email'], ['dash', 'Dashboard only']])
        + toggleRow(r, 'hp.ack', 'Acknowledge applicants automatically', 'Candidates get a confirmation when they apply.'))
      + card('New job defaults', 'Applied when you post a job. You can change them per job.', selectRow(r, 'hp.validity', 'Job stays open for', '', [['15', '15 days'], ['30', '30 days'], ['45', '45 days'], ['60', '60 days']])
        + toggleRow(r, 'hp.close', 'Close the job automatically when it expires', 'Expired jobs stop accepting applications.'));
  }
  function privacy(r){
    return card('Profile visibility', '', selectRow(r, 'pv.vis', 'Who can find my profile', '', [['verified', 'All verified institutions'], ['applied', 'Only institutions I apply to'], ['hidden', 'No one (hidden)']])
        + toggleRow(r, 'pv.search', 'Show me in Browse faculty', 'Institutions can discover you in search results.'))
      + card('What institutions can see', '', toggleRow(r, 'pv.email', 'Email address', '')
        + toggleRow(r, 'pv.phone', 'Phone number', 'Off by default. Applicants you apply to still see it.')
        + toggleRow(r, 'pv.emp', 'Current employer', 'Hide it if your institution does not know you are looking.')
        + toggleRow(r, 'pv.resume', 'Allow resume download', ''));
  }
  function visibility(r){
    var b = toggleRow(r, 'iv.contact', 'Show contact email and phone on job posts', 'Candidates can reach you without applying.') + toggleRow(r, 'iv.badge', 'Show the Verified badge', 'Shown once your institution is approved.');
    if(r === 'company') b = toggleRow(r, 'iv.dir', 'List in the public institution directory', 'Faculty can find your institution without a job link.') + b + toggleRow(r, 'iv.branches', 'Show branches and campuses', 'Approved sub-branches appear on your profile.');
    else b = toggleRow(r, 'iv.main', 'Show my main institution on job posts', 'Candidates see which institution you belong to.') + b;
    return card(NAMES[r][3], '', b);
  }
  function security(r){
    var tok = false; try{ tok = !!(window.api && api.hasToken()); }catch(e){}
    var pw = tok
      ? card('Change password', 'Use at least 8 characters.', '<div class="st-form"><label>Current password<input id="stCur" class="st-in" type="password" autocomplete="current-password"></label>'
          + '<label>New password<input id="stNew" class="st-in" type="password" autocomplete="new-password"></label>'
          + '<label>Confirm new password<input id="stNew2" class="st-in" type="password" autocomplete="new-password"></label></div>'
          + '<p id="stPwMsg" class="st-msg" role="alert"></p><div class="st-foot"><button type="button" class="btn btn-primary btn-sm" data-act="pw">Update password</button></div>')
      : card('Password', '', '<p class="st-note">This account signs in through your institution code, so there is no password to change here.</p>');
    return pw
      + card('Two-step verification', '', row('Extra sign-in check', 'A one-time code when you sign in on a new device.', '<span class="st-soon">Coming soon</span>'))
      + card('This device', '', row('Log out', 'End your session on this browser.', '<button type="button" class="btn btn-ghost btn-sm" data-act="logout">Log out</button>'));
  }
  function data(r){
    var canDelete = r !== 'branch';
    return card('Download your data', 'A copy of your profile details and settings, as a JSON file.', '<div class="st-foot st-foot-l"><button type="button" class="btn btn-ghost btn-sm" data-act="export">Download my data</button></div>')
      + (canDelete
        ? card('Delete account', 'This permanently removes your account and everything on it. It cannot be undone.',
            '<div class="st-form"><label>Type <b>DELETE</b> to confirm<input id="stDel" class="st-in" autocomplete="off" placeholder="DELETE"></label></div><p id="stDelMsg" class="st-msg" role="alert"></p>'
            + '<div class="st-foot st-foot-l"><button type="button" class="btn st-danger" data-act="delete" id="stDelBtn" disabled>Delete my account</button></div>', 'st-dz')
        : card('Remove this branch', '', '<p class="st-note">To disconnect or remove this branch, ask your main institution or contact Upaadhyay support.</p>', 'st-dz'));
  }

  var BUILD = { 'Account':account, 'Notifications':notifications, 'Job alerts':alerts, 'Privacy & visibility':privacy, 'Hiring preferences':hiring,
                'Institution visibility':visibility, 'Branch visibility':visibility, 'Security':security, 'Data & account':data };

  function sections(r){ return NAMES[r || role()] || NAMES.seeker; }
  function html(r){
    r = r || role(); var names = sections(r), i = Math.min(Math.max(cur, 0), names.length - 1), n = names[i];
    return '<div class="st-head"><h3>' + esc(n) + '</h3><p>' + esc(SUBS[n] || '') + '</p></div><div class="st-body">' + BUILD[n](r) + '</div>';
  }
  /* the settings panel fills the space under whatever sits above it (nav, notice banner) and scrolls on its own */
  function fit(){
    var el = document.getElementById('upSettings'); if(!el || el.offsetParent === null) return;
    el.style.height = 'auto';
    var top = el.getBoundingClientRect().top;
    el.style.height = Math.max(window.innerHeight - top - 12, 360) + 'px';
  }
  function refresh(){
    var el = document.getElementById('upSettings'); if(!el) return;
    var keep = el.scrollTop; el.innerHTML = html(role()); fit(); el.scrollTop = keep;
    requestAnimationFrame(fit);
  }
  window.addEventListener('resize', fit);

  /* ---------------- actions (delegated, so they survive re-renders) ---------------- */
  function inside(t){ return t && t.closest && t.closest('#upSettings'); }
  var tSave; function saved(){ clearTimeout(tSave); tSave = setTimeout(function(){ toast('Saved'); }, 150); }
  document.addEventListener('change', function(e){
    var t = e.target; if(!inside(t)) return; var k = t.getAttribute('data-st'); if(!k) return;
    set(role(), k, t.type === 'checkbox' ? (t.checked ? 1 : 0) : t.value); saved();
  });
  document.addEventListener('input', function(e){
    var t = e.target; if(!inside(t) || t.id !== 'stDel') return;
    var b = document.getElementById('stDelBtn'); if(b) b.disabled = t.value.trim() !== 'DELETE';
  });
  function msg(id, text, ok){ var m = document.getElementById(id); if(!m) return; m.textContent = text; m.className = 'st-msg ' + (text ? (ok ? 'ok' : 'bad') : ''); }
  function failText(e, what){
    if(e && e.status === 422 && e.message) return e.message;
    if(e && e.status === 401) return 'Your session has expired. Please log in again.';
    return what + ' is not available on the server yet. Please try again later.';
  }
  var ACT = {
    profile:function(){ if(window.UpSide && UpSide.profile) UpSide.profile(); },
    contact:function(){
      var r = role(), em = document.getElementById('stEmail').value.trim(), ph = document.getElementById('stPhone').value.trim();
      if(em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('Enter a valid email address.');
      if(ph && !/^\+?\d[\d\s-]{7,18}$/.test(ph)) return toast('Enter a valid mobile number.');
      set(r, 'ac.email', em); set(r, 'ac.phone', ph); toast('Saved');
    },
    pw:function(){
      var c = document.getElementById('stCur').value, n = document.getElementById('stNew').value, n2 = document.getElementById('stNew2').value;
      if(!c || !n) return msg('stPwMsg', 'Enter your current and new password.');
      if(n.length < 8) return msg('stPwMsg', 'New password must be at least 8 characters.');
      if(n !== n2) return msg('stPwMsg', 'The new passwords do not match.');
      if(n === c) return msg('stPwMsg', 'Choose a password different from your current one.');
      msg('stPwMsg', 'Updating…', true);
      api.put(ENDPOINTS.password, { current_password:c, password:n, password_confirmation:n2 }, { noAuthRedirect:true, silent403:true })
        .then(function(){ ['stCur', 'stNew', 'stNew2'].forEach(function(id){ document.getElementById(id).value = ''; }); msg('stPwMsg', 'Password updated.', true); })
        .catch(function(e){ msg('stPwMsg', failText(e, 'Changing your password')); });
    },
    logout:function(){ if(typeof logoutUser === 'function') logoutUser(); },
    export:function(){
      var r = role(), p = null;
      try{ p = r === 'seeker' ? currentUser : r === 'company' ? currentCompany : { sub:(lsj('nwSub') || {}).sub, profile:lsj('nwProfile') }; }catch(e){}
      var out = { exportedAt:new Date().toISOString(), accountType:who(r).type, account:{ name:who(r).name, email:who(r).email }, profile:p, settings:load()[r] || {} };
      var blob = new Blob([JSON.stringify(out, function(k, v){ return typeof v === 'string' && v.indexOf('data:') === 0 ? undefined : v; }, 2)], { type:'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'upaadhyay-my-data.json'; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Download started');
    },
    delete:function(){
      var i = document.getElementById('stDel'); if(!i || i.value.trim() !== 'DELETE') return;
      msg('stDelMsg', 'Deleting…', true);
      api.del(ENDPOINTS.deleteAccount, { noAuthRedirect:true, silent403:true })
        .then(function(){ try{ localStorage.removeItem(KEY); }catch(e){} if(typeof clearSession === 'function') clearSession(); if(window.api) api.clearAuth(); if(typeof goTo === 'function') goTo('home'); })
        .catch(function(e){ msg('stDelMsg', failText(e, 'Deleting your account')); });
    }
  };
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-act]'); if(!b || !inside(b)) return;
    if(ACT[b.getAttribute('data-act')]) ACT[b.getAttribute('data-act')]();
  });

  window.UpSettings = { sections:sections, html:html, refresh:refresh, fit:fit, cur:function(){ return cur; }, idx:function(i){ cur = i; } };
})();
