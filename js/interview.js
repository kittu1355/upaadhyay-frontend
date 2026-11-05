/* interview.js — "Call for interview".
   Employer: Interview.dialog(name, existing) -> Promise<details|null>  (phone, mode online/in-person, Zoom/Meet link or location, date, time, notes)
   Both sides: Interview.html(details) draws the details box; Interview.norm(any) reads whatever shape the API sends.
   Details are also kept in this browser (upaadhyay_interviews, key "jobId:candidateId") as a fallback. */
(function(){
'use strict';
var LS = 'upaadhyay_interviews';
var PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Other link'];
var DURATIONS = [['15', '15 min'], ['30', '30 min'], ['45', '45 min'], ['60', '1 hour'], ['90', '1.5 hours']];

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function safeUrl(u){ u = String(u || '').trim(); if(!u) return ''; if(!/^https?:\/\//i.test(u)) u = 'https://' + u; return /^https?:\/\/[^\s]+\.[^\s]+/i.test(u) ? u : ''; }
function digits10(p){ var d = String(p || '').replace(/\D/g, ''); if(d.length > 10) d = d.slice(-10); return d; }

/* any API shape -> { phone, mode:'online'|'offline', platform, link, location, date, time, duration, notes } or null */
function norm(v){
  if(!v) return null;
  if(typeof v === 'string'){ try{ v = JSON.parse(v); }catch(e){ return null; } }
  if(typeof v !== 'object') return null;
  var mode = String(v.mode || v.type || v.interview_mode || '').toLowerCase();
  mode = /on/.test(mode) && !/off|person/.test(mode) ? 'online' : (mode ? 'offline' : (v.link || v.meeting_link ? 'online' : 'offline'));
  var o = {
    phone: v.phone || v.contact || v.contact_number || v.mobile || '',
    mode: mode, platform: v.platform || '', link: v.link || v.meeting_link || v.url || '',
    location: v.location || v.address || v.venue || '', date: String(v.date || '').slice(0, 10), time: String(v.time || '').slice(0, 5),
    duration: v.duration || '', notes: v.notes || v.note || v.message || ''
  };
  return (o.date || o.time || o.phone || o.link || o.location) ? o : null;
}
function getLocal(jobId, candId){
  try{ var all = JSON.parse(localStorage.getItem(LS) || '{}'); return norm(all[jobId + ':' + candId] || all[jobId + ':me']); }catch(e){ return null; }
}
function saveLocal(jobId, candId, iv){
  try{ var all = JSON.parse(localStorage.getItem(LS) || '{}'); all[jobId + ':' + candId] = iv; localStorage.setItem(LS, JSON.stringify(all)); }catch(e){}
}
function fmtDate(d){ if(!d) return ''; var t = new Date(d + 'T00:00:00'); return isNaN(t) ? d : t.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' }); }
function fmtTime(t){ if(!t) return ''; var p = t.split(':'), h = +p[0], m = p[1] || '00'; if(isNaN(h)) return t; return (h % 12 || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM'); }
function when(iv){ return [fmtDate(iv.date), fmtTime(iv.time)].filter(Boolean).join(' · ') + (iv.duration ? ' (' + iv.duration + ' min)' : ''); }

/* plain text, used for the message sent to the faculty so they also get it on any device */
function text(iv, jobTitle, org){
  var l = ['Interview call' + (jobTitle ? ' for ' + jobTitle : '') + (org ? ' at ' + org : ''), 'When: ' + when(iv)];
  if(iv.mode === 'online'){ l.push('Mode: Online' + (iv.platform ? ' (' + iv.platform + ')' : '')); if(iv.link) l.push('Join link: ' + iv.link); }
  else { l.push('Mode: In person'); if(iv.location) l.push('Location: ' + iv.location); }
  if(iv.phone) l.push('Contact: ' + iv.phone);
  if(iv.notes) l.push('Note: ' + iv.notes);
  return l.join('\n');
}

/* the details box (faculty My jobs card + employer applicant card) */
function html(iv, o){
  iv = norm(iv); if(!iv) return '';
  o = o || {};
  var url = safeUrl(iv.link), rows = [];
  rows.push(['When', when(iv)]);
  rows.push(['Mode', iv.mode === 'online' ? 'Online' + (iv.platform ? ' · ' + iv.platform : '') : 'In person']);
  if(iv.mode === 'online' && url) rows.push(['Join link', '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(url.length > 46 ? url.slice(0, 46) + '…' : url) + '</a>']);
  if(iv.mode !== 'online' && iv.location) rows.push(['Location', esc(iv.location)]);
  if(iv.phone) rows.push(['Contact', '<a href="tel:' + esc(String(iv.phone).replace(/[^\d+]/g, '')) + '">' + esc(iv.phone) + '</a>']);
  if(iv.notes) rows.push(['Note', esc(iv.notes)]);
  rows[0][1] = esc(rows[0][1]); rows[1][1] = esc(rows[1][1]);
  return '<div class="iv-box' + (o.compact ? ' iv-compact' : '') + '" onclick="event.stopPropagation()"><div class="iv-box-h">' + (o.title || 'Interview scheduled') + '</div>' +
    rows.map(function(r){ return '<div class="iv-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>';
}

function css(){
  if(document.getElementById('ivCss')) return;
  var s = document.createElement('style'); s.id = 'ivCss';
  s.textContent =
    '.iv-ov{position:fixed;inset:0;z-index:2100;background:rgba(11,29,58,.5);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.iv-card{background:#fff;width:100%;max-width:560px;max-height:94vh;overflow:auto;padding:22px;border-radius:8px;box-shadow:0 20px 50px rgba(11,29,58,.3);font-family:inherit;color:#111827}' +
    '.iv-card h3{margin:0 0 4px;font-size:19px}.iv-sub{margin:0 0 14px;font-size:13px;color:#5b6577}' +
    '.iv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.iv-full{grid-column:1/-1}' +
    '.iv-f label{display:block;margin:0 0 4px;font-size:12.5px;font-weight:600;color:#374151}.iv-f label i{font-style:normal;font-weight:400;color:#8a93a6}' +
    '.iv-f input,.iv-f select,.iv-f textarea{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #cfd6e4;border-radius:6px;font:inherit;font-size:14px;background:#fff}' +
    '.iv-f textarea{min-height:64px;resize:vertical}.iv-f .bad{border-color:#B42318;outline:1px solid #B42318}' +
    '.iv-modes{display:flex;gap:8px}.iv-modes label{flex:1;margin:0;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;border:1.5px solid #cfd6e4;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;color:#374151}' +
    '.iv-modes input{width:auto;margin:0}.iv-modes label.on{border-color:#1d4fd7;background:#EAF1FF;color:#1d4fd7}' +
    '.iv-err{min-height:18px;margin-top:10px;font-size:13px;color:#B42318}' +
    '.iv-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}.iv-foot button{padding:10px 20px;border-radius:6px;font:inherit;font-weight:600;cursor:pointer;border:1px solid #cfd6e4;background:#fff}' +
    '.iv-foot .iv-go{background:#1d4fd7;border-color:#1d4fd7;color:#fff}' +
    '.iv-box{margin-top:10px;padding:10px 12px;border:1px solid #D9CCF5;background:#F7F3FF;border-radius:6px;font-size:13px;color:#2b2150;cursor:default}' +
    '.iv-box-h{font-weight:700;color:#5b34b8;margin-bottom:6px;font-size:13px}.iv-row{display:flex;gap:10px;padding:2px 0}.iv-row span{flex:none;width:68px;color:#7a6aa8}.iv-row b{font-weight:600;min-width:0;word-break:break-word}' +
    '.iv-box a{color:#1d4fd7;text-decoration:underline}.iv-compact{margin-top:0}' +
    '@media(max-width:520px){.iv-grid{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}

function dialog(name, ex){
  css(); ex = norm(ex) || {};
  return new Promise(function(resolve){
    var today = new Date(); today = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    var box = document.createElement('div'); box.className = 'iv-ov';
    box.innerHTML = '<div class="iv-card" role="dialog" aria-modal="true" aria-labelledby="ivT">' +
      '<h3 id="ivT">Call ' + esc(name || 'candidate') + ' for interview</h3><p class="iv-sub">The candidate sees these details on their My jobs page as soon as you send.</p>' +
      '<div class="iv-grid">' +
      '<div class="iv-f iv-full"><label>Contact number for the interview *</label><input type="tel" id="ivPhone" maxlength="14" placeholder="10-digit mobile number" value="' + esc(ex.phone || '') + '"></div>' +
      '<div class="iv-f iv-full"><label>Interview mode *</label><div class="iv-modes">' +
        '<label class="' + (ex.mode === 'online' ? 'on' : '') + '"><input type="radio" name="ivMode" value="online"' + (ex.mode === 'online' ? ' checked' : '') + '> Online</label>' +
        '<label class="' + (ex.mode !== 'online' ? 'on' : '') + '"><input type="radio" name="ivMode" value="offline"' + (ex.mode !== 'online' ? ' checked' : '') + '> In person</label></div></div>' +
      '<div class="iv-f" data-on><label>Platform *</label><select id="ivPlat">' + PLATFORMS.map(function(p){ return '<option' + (p === ex.platform ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></div>' +
      '<div class="iv-f" data-on><label>Zoom / Meet link *</label><input type="url" id="ivLink" placeholder="https://zoom.us/j/…" value="' + esc(ex.link || '') + '"></div>' +
      '<div class="iv-f iv-full" data-off><label>Interview location *</label><textarea id="ivLoc" maxlength="300" placeholder="Campus, building, room, city">' + esc(ex.location || '') + '</textarea></div>' +
      '<div class="iv-f"><label>Date *</label><input type="date" id="ivDate" min="' + today + '" value="' + esc(ex.date || '') + '"></div>' +
      '<div class="iv-f"><label>Time *</label><input type="time" id="ivTime" value="' + esc(ex.time || '') + '"></div>' +
      '<div class="iv-f iv-full"><label>Duration <i>Optional</i></label><select id="ivDur"><option value="">Not specified</option>' + DURATIONS.map(function(d){ return '<option value="' + d[0] + '"' + (String(ex.duration) === d[0] ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="iv-f iv-full"><label>Notes <i>Optional · documents to bring, who to ask for…</i></label><textarea id="ivNotes" maxlength="500">' + esc(ex.notes || '') + '</textarea></div>' +
      '</div><div class="iv-err" id="ivErr"></div>' +
      '<div class="iv-foot"><button type="button" class="iv-no">Cancel</button><button type="button" class="iv-go">' + (ex.date ? 'Update interview' : 'Send interview call') + '</button></div></div>';
    document.body.appendChild(box);
    var $ = function(s){ return box.querySelector(s); }, $$ = function(s){ return [].slice.call(box.querySelectorAll(s)); };
    function mode(){ var r = box.querySelector('input[name=ivMode]:checked'); return r ? r.value : 'offline'; }
    function sync(){ var on = mode() === 'online'; $$('[data-on]').forEach(function(e){ e.style.display = on ? '' : 'none'; }); $$('[data-off]').forEach(function(e){ e.style.display = on ? 'none' : ''; });
      $$('.iv-modes label').forEach(function(l){ l.classList.toggle('on', l.querySelector('input').checked); }); }
    $$('input[name=ivMode]').forEach(function(r){ r.onchange = sync; }); sync();
    function done(v){ document.removeEventListener('keydown', esc_); box.remove(); resolve(v); }
    function esc_(e){ if(e.key === 'Escape') done(null); }
    document.addEventListener('keydown', esc_);
    $('.iv-no').onclick = function(){ done(null); };
    box.addEventListener('mousedown', function(e){ if(e.target === box) done(null); });
    $('.iv-go').onclick = function(){
      $$('.bad').forEach(function(x){ x.classList.remove('bad'); });
      var err = '', bad = function(id, m){ $(id).classList.add('bad'); if(!err) err = m; };
      var on = mode() === 'online', phone = digits10($('#ivPhone').value), link = safeUrl($('#ivLink').value), loc = $('#ivLoc').value.trim(), date = $('#ivDate').value, time = $('#ivTime').value;
      if(phone.length !== 10) bad('#ivPhone', 'Enter a valid 10-digit contact number.');
      if(on && !link) bad('#ivLink', 'Add the Zoom / Meet joining link.');
      if(!on && loc.length < 4) bad('#ivLoc', 'Add the interview location.');
      if(!date) bad('#ivDate', 'Pick the interview date.');
      else if(date < today) bad('#ivDate', 'The date cannot be in the past.');
      if(!time) bad('#ivTime', 'Pick the interview time.');
      else if(date === today){ var n = new Date(), hm = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); if(time < hm) bad('#ivTime', 'That time has already passed today.'); }
      if(err){ $('#ivErr').textContent = err; return; }
      done({ phone: phone, mode: on ? 'online' : 'offline', platform: on ? $('#ivPlat').value : '', link: on ? link : '', location: on ? '' : loc,
             date: date, time: time, duration: $('#ivDur').value, notes: $('#ivNotes').value.trim() });
    };
    setTimeout(function(){ var f = $('#ivPhone'); if(f) f.focus(); }, 30);
  });
}

window.Interview = { dialog: dialog, html: html, norm: norm, text: text, when: when, getLocal: getLocal, saveLocal: saveLocal, css: css };
})();
