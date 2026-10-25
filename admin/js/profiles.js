/* ==========================================================================
   admin/js/profiles.js — "Full profile" drawer for the admin console.

   Loads AFTER ui.js, admin.js, extras.js (index.html) or company.js (company.html).
   It adds, without changing those files:
     1. A "Full profile" tab inside the faculty detail drawer (openFaculty) showing the
        account, the profile columns and EVERYTHING stored in the faculty's profile_data.
     2. A wide full-profile drawer for sub-branch requests (replaces viewBranch) with the
        complete profile the sub-branch submitted, plus Approve / Reject while it is pending.
   Styles: .xd-bg / .xd / .xd-wide / .xd-h / .xd-kv in css/admin-extra.css.
   Everything is wrapped in an IIFE so it cannot clash with names in the other admin scripts.
   ========================================================================== */
(function(){
  'use strict';

  /* ---------- small helpers (fall back if ui.js helpers are missing) ---------- */
  function E(v){
    if(typeof esc === 'function') return esc(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; });
  }
  function D(v){ return (typeof fmtDate === 'function' && v) ? fmtDate(v) : (v || ''); }
  function AV(name, logo){ return typeof avatarHtml === 'function' ? avatarHtml(name, logo) : ''; }
  function say(msg, isErr){ if(typeof toast === 'function') toast(msg, isErr); }

  // Never show secrets, and never dump uploaded files (data: URIs) into the page.
  var HIDE_KEY = /^(password|pass|pw|token|remember_token|secret|otp)$/i;
  function hideVal(v){ return typeof v === 'string' && /^data:/i.test(v); }

  // Readable names for the short keys the profile forms save.
  var NAMES = { rname:'Representative name', rdes:'Designation', rdep:'Department', rem:'Representative email', remail:'Representative email',
    rph:'Representative phone', rphone:'Representative phone', addr:'Address', pin:'PIN code', year:'Established year', about1:'About',
    about2:'About (more)', sub:'Submitted', st:'Status', n:'Name', c:'City', t:'Type', dob:'Date of birth', desig:'Designation',
    high:'Highest qualification', aemail:'Authority email', web:'Website' };
  function label(k){
    if(NAMES[String(k).toLowerCase()]) return NAMES[String(k).toLowerCase()];
    return String(k).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^./, function(c){ return c.toUpperCase(); });
  }
  function empty(v){
    if(v === null || v === undefined || v === '') return true;
    if(Array.isArray(v)) return v.length === 0;
    if(typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  }
  function plain(v){ return v === true ? 'Yes' : v === false ? 'No' : String(v); }

  /* Turn any object into [{h:'Section', rows:[[label, value], …]}, …].
     Scalars become rows, arrays of scalars one comma-separated row, nested objects their own section. */
  function sectionsOf(obj, title, depth, out){
    out = out || [];
    if(!obj || typeof obj !== 'object') return out;
    var sec = { h:title, rows:[] };
    out.push(sec);
    Object.keys(obj).forEach(function(k){
      var v = obj[k];
      if(HIDE_KEY.test(k) || empty(v) || hideVal(v)) return;
      if(Array.isArray(v)){
        var simple = v.every(function(x){ return x === null || typeof x !== 'object'; });
        if(simple){
          var txt = v.filter(function(x){ return !empty(x) && !hideVal(x); }).map(plain).join(', ');
          if(txt) sec.rows.push([label(k), txt]);
        }else{
          v.forEach(function(x, i){
            if(x && typeof x === 'object'){ if(depth < 4) sectionsOf(x, label(k) + (v.length > 1 ? ' ' + (i + 1) : ''), depth + 1, out); }
            else if(!empty(x) && !hideVal(x)) sec.rows.push([label(k), plain(x)]);
          });
        }
      }else if(typeof v === 'object'){
        if(depth < 4) sectionsOf(v, label(k), depth + 1, out);
      }else{
        sec.rows.push([label(k), plain(v)]);
      }
    });
    if(!sec.rows.length) out.splice(out.indexOf(sec), 1);
    return out;
  }

  function row(k, v){ return (v === null || v === undefined || v === '') ? null : [k, plain(v)]; }
  function compact(rows){ return rows.filter(Boolean); }

  function sectionHtml(s, first){
    if(!s.rows.length) return '';
    return (s.h ? '<div class="xd-h"' + (first ? ' style="margin-top:0"' : '') + '>' + E(s.h) + '</div>' : '')
      + s.rows.map(function(r){ return '<div class="xd-kv"><span>' + E(r[0]) + '</span><b>' + E(r[1]) + '</b></div>'; }).join('');
  }

  /* ---------- the wide drawer ---------- */
  function onKey(e){ if(e.key === 'Escape') closeDrawer(); }
  function closeDrawer(){
    var o = document.querySelector('.xd-bg'); if(o) o.remove();
    document.removeEventListener('keydown', onKey);
  }

  /* opts: { name, sub, logo, sections:[{h,rows}], footer: html, onFooter: function(actionName) } */
  function openFullProfile(opts){
    closeDrawer();
    var ov = document.createElement('div');
    ov.className = 'xd-bg';
    var secs = (opts.sections || []).filter(function(s){ return s && s.rows && s.rows.length; });
    ov.innerHTML = '<div class="xd xd-wide" role="dialog" aria-modal="true" aria-label="' + E(opts.name || 'Full profile') + '">'
      + '<div class="xd-top">' + AV(opts.name, opts.logo) + '<div><b>' + E(opts.name || '\u2014') + '</b><small>' + E(opts.sub || '') + '</small></div>'
      + '<button type="button" class="xd-x" aria-label="Close">\u00d7</button></div>'
      + '<div class="xd-body">'
      + (secs.map(function(s, i){ return sectionHtml(s, i === 0); }).join('') || '<div class="admin-empty">No profile details have been added yet.</div>')
      + (opts.footer ? '<div class="xd-acts" style="margin-top:16px">' + opts.footer + '</div>' : '')
      + '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){
      if(e.target === ov || e.target.closest('.xd-x')){ closeDrawer(); return; }
      var a = e.target.closest('[data-pa]');
      if(a && typeof opts.onFooter === 'function'){ closeDrawer(); opts.onFooter(a.getAttribute('data-pa')); }
    });
    document.addEventListener('keydown', onKey);
    return ov;
  }
  window.openFullProfile = openFullProfile;

  /* ---------- 1. Faculty: "Full profile" tab inside the existing detail drawer ---------- */
  function facultySections(u){
    var p = u.candidate_profile || u.candidateProfile || {};
    var where = [p.location, p.city, p.state].filter(Boolean).filter(function(x, i, a){ return a.indexOf(x) === i; }).join(', ');
    var secs = [
      { h:'Account', rows:compact([
        row('Name', u.name), row('Email', u.email), row('Phone', u.phone), row('Status', u.status),
        row('Registered', D(u.created_at))
      ]) },
      { h:'Profile', rows:compact([
        row('Current role', p.current_job_title),
        row('Experience', (p.total_experience !== null && p.total_experience !== undefined && p.total_experience !== '') ? p.total_experience + ' yrs' : ''),
        row('Gender', p.gender), row('Date of birth', D(p.date_of_birth)), row('Location', where), row('About', p.bio)
      ]) }
    ];
    return secs.concat(sectionsOf(p.profile_data || {}, 'Details', 0));
  }

  function showFaculty(id){
    return window.api.get('/admin/users/' + id).then(function(u){
      var p = u.candidate_profile || u.candidateProfile || {};
      openFullProfile({ name:u.name, sub:u.email, logo:p.profile_photo, sections:facultySections(u) });
    }).catch(function(e){ say((e && e.message) || 'Could not load the profile.', true); });
  }

  if(typeof window.openFaculty === 'function'){
    var openFacultyOrig = window.openFaculty;
    window.openFaculty = async function(id){
      var r = await openFacultyOrig.apply(this, arguments);
      var tabs = document.querySelector('.xd-bg .xd-tabs');
      if(tabs && !tabs.querySelector('[data-full]')){
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'admin-tab'; b.setAttribute('data-full', '1'); b.textContent = 'Full profile';
        // No data-t on purpose: the drawer's own tab handler ignores this button.
        b.addEventListener('click', function(e){ e.stopPropagation(); showFaculty(id); });
        tabs.appendChild(b);
      }
      return r;
    };
  }

  /* ---------- 2. Sub-branch requests: full profile + decision buttons ---------- */
  var MAIN_LABEL = { pending:'Waiting', approved:'Approved', rejected:'Rejected' };

  function branchSections(b){
    var main = b.main || {}, pr = b.profile || {};
    var place = [b.address || pr.addr, b.city, b.state, pr.pin].filter(Boolean).join(', ');
    var admin = b.admin_status ? b.admin_status.charAt(0).toUpperCase() + b.admin_status.slice(1) : '';
    var secs = [
      { h:'Request', rows:compact([
        row('Sub-branch', b.name), row('Wants to join', main.name), row('Main institution code', main.code),
        row('Main institution decision', MAIN_LABEL[b.main_status] || b.main_status), row('Admin decision', admin),
        row('Live', b.approved ? 'Yes' : 'Not yet'), row('Submitted', D(b.submitted_at)), row('Rejection reason', b.note)
      ]) },
      { h:'Contact', rows:compact([ row('Type', b.type), row('Email', b.email), row('Phone', b.phone), row('Website', b.website), row('Address', place) ]) }
    ];
    if(b.description) secs.push({ h:'About', rows:[['Description', b.description]] });
    return secs.concat(sectionsOf(pr, 'Profile details', 0));
  }

  if(typeof window.viewBranch === 'function' || document.getElementById('panelBranches')){
    window.viewBranch = function(id){
      var b = (window.__brRows || []).filter(function(x){ return x.id === id; })[0];
      if(!b) return;
      var pending = b.admin_status === 'pending';
      var joining = b.main && b.main.name ? 'Joining ' + b.main.name : '';
      openFullProfile({
        name:b.name, sub:[joining, [b.city, b.state].filter(Boolean).join(', ')].filter(Boolean).join(' \u00b7 '), logo:b.logo,
        sections:branchSections(b),
        footer: pending ? '<button type="button" class="btn btn-primary btn-sm" data-pa="approve">Approve</button>'
                        + '<button type="button" class="btn btn-ghost btn-sm danger" data-pa="reject">Reject</button>' : '',
        onFooter: function(action){ if(typeof window.decideBranch === 'function') window.decideBranch(id, action); }
      });
    };
  }
})();
