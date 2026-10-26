/* qa-builder.js — "Ask Questions" builder: + Add question (max 5), each with a time limit. Shared by the institution and sub-branch job forms. */
(function(){
  var MAX = 5, TIMES = [[1,'1 min'],[2,'2 min'],[3,'3 min'],[5,'5 min'],[10,'10 min']];
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function row(q, m){
    var mins = +m || 1;
    return '<div class="qa-row"><span class="qa-n"></span>'
      + '<input type="text" class="qa-q" maxlength="200" placeholder="Enter your question" value="' + esc(q) + '">'
      + '<select class="qa-t" title="Time to answer" aria-label="Time to answer">' + TIMES.map(function(t){ return '<option value="' + t[0] + '"' + (t[0] === mins ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>'
      + '<button type="button" class="qa-x" aria-label="Remove question" onclick="QA.remove(this)">&times;</button></div>';
  }
  function inner(list){
    list = (list || []).slice(0, MAX);
    return '<div class="qa-rows">' + list.map(function(x){ return row(x.q, x.mins); }).join('') + '</div>'
      + '<div class="qa-foot"><button type="button" class="btn btn-ghost btn-sm qa-add" onclick="QA.add(this)"' + (list.length >= MAX ? ' disabled' : '') + '>+ Add question</button>'
      + '<span class="qa-count">' + list.length + ' / ' + MAX + '</span></div>'
      + '<p class="qa-hint">Add up to ' + MAX + ' questions and choose how long a candidate gets to answer each one.</p>';
  }
  function wrap(el){ while(el && !(el.classList && el.classList.contains('qa-host'))) el = el.parentNode; return el; }
  function sync(host){
    if(!host) return;
    var rows = host.querySelectorAll('.qa-row'), n = rows.length;
    [].forEach.call(rows, function(r, i){ r.querySelector('.qa-n').textContent = i + 1; });
    var c = host.querySelector('.qa-count'), a = host.querySelector('.qa-add');
    if(c) c.textContent = n + ' / ' + MAX; if(a) a.disabled = n >= MAX;
  }
  window.QA = {
    inner: inner,
    html: function(id, list){ return '<div class="qa-host" id="' + id + '">' + inner(list) + '</div>'; },
    init: function(id, list){ var h = document.getElementById(id); if(!h) return; h.classList.add('qa-host'); h.innerHTML = inner(list); sync(h); },
    set: function(id, list){ QA.init(id, list); },
    add: function(btn){
      var h = wrap(btn); if(!h) return; var box = h.querySelector('.qa-rows');
      if(box.querySelectorAll('.qa-row').length >= MAX) return;
      box.insertAdjacentHTML('beforeend', row('', 1)); sync(h);
      var qs = box.querySelectorAll('.qa-q'); if(qs.length) qs[qs.length - 1].focus();
    },
    remove: function(btn){ var h = wrap(btn), r = btn.parentNode; if(r && r.parentNode) r.parentNode.removeChild(r); sync(h); },
    get: function(id){
      var h = document.getElementById(id); if(!h) return [];
      return [].map.call(h.querySelectorAll('.qa-row'), function(r){
        return { q: (r.querySelector('.qa-q').value || '').trim(), mins: +r.querySelector('.qa-t').value || 1 };
      }).filter(function(x){ return x.q; }).slice(0, MAX);
    }
  };
})();
