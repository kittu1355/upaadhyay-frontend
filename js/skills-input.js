/* Key skills as tags: type a skill and press Enter (or comma) to add it, click a suggestion, or type your own.
   The original #jbSkills / #jb_skills input stays as the stored value (comma-separated), so saving is unchanged. */
(function(){
  var SEL = '#jbSkills,#jb_skills', MAX = 20, MAXLEN = 40;
  var SUG = ['Lesson Planning','Classroom Management','Curriculum Design','Assessment & Evaluation','Online Teaching','Mentoring','Academic Writing','Research','Research Supervision','Grant Writing','Public Speaking','Communication','MS Office','Content Creation',
    'Mathematics','Physics','Chemistry','Biology','English','Hindi','Telugu','Computer Science','Python','Java','Data Structures','Machine Learning','Artificial Intelligence','Data Science','SQL','Web Development','Electronics','Mechanics','Accounting','Marketing','Finance','HR','MBA','NBA / NAAC','JEE / NEET Coaching','Board Exam Prep'];
  var D = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  var css = '.sk-wrap{position:relative}.sk-box{display:flex;flex-wrap:wrap;gap:6px;align-items:center;border:1px solid var(--line,#ddd6ee);border-radius:var(--radius,3px);background:#fff;padding:6px 8px;min-height:42px;cursor:text}' +
    '.sk-box:focus-within{border-color:var(--blue-600,#4b1f9e);box-shadow:0 0 0 3px rgba(75,31,158,.12)}' +
    '.sk-chip{display:inline-flex;align-items:center;gap:6px;background:#ebe3ff;color:#4b1f9e;font-size:12.5px;font-weight:600;padding:4px 6px 4px 10px;border-radius:2px;max-width:100%}' +
    '.sk-chip button{border:0;background:none;color:inherit;font-size:15px;line-height:1;cursor:pointer;padding:0 2px;opacity:.7}.sk-chip button:hover{opacity:1}' +
    '.sk-box input.sk-in{border:0 !important;outline:0 !important;box-shadow:none !important;background:transparent !important;flex:1;min-width:140px;padding:4px 2px !important;margin:0 !important;font-size:13.5px}' +
    '.sk-menu{position:absolute;left:0;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid var(--line,#ddd6ee);border-radius:var(--radius,3px);box-shadow:0 8px 24px rgba(40,20,90,.14);z-index:30;max-height:210px;overflow:auto;display:none}' +
    '.sk-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:8px 12px;font-size:13.5px;cursor:pointer;color:var(--ink,#1f1637)}.sk-menu button:hover,.sk-menu button.on{background:#f3effd}' +
    '.sk-menu .sk-own{color:#4b1f9e;font-weight:600;border-top:1px solid var(--line,#eee)}' +
    '.sk-hint{font-size:12px;color:var(--ink-faint,#8b92a1);margin-top:4px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function parse(s){ var out = [], seen = {}; String(s || '').split(',').forEach(function(x){ x = x.trim().slice(0, MAXLEN); var k = x.toLowerCase(); if(x && !seen[k]){ seen[k] = 1; out.push(x); } }); return out.slice(0, MAX); }

  function attach(el){
    if(el.__sk) return; el.__sk = 1;
    var list = parse(D.get.call(el));
    var wrap = document.createElement('div'); wrap.className = 'sk-wrap';
    var box = document.createElement('div'); box.className = 'sk-box';
    var inp = document.createElement('input'); inp.type = 'text'; inp.className = 'sk-in'; inp.autocomplete = 'off'; inp.maxLength = MAXLEN;
    inp.placeholder = 'Type a skill and press Enter'; inp.setAttribute('aria-label', 'Add a key skill');
    var menu = document.createElement('div'); menu.className = 'sk-menu'; menu.setAttribute('role', 'listbox');
    var hint = document.createElement('div'); hint.className = 'sk-hint'; hint.textContent = 'Press Enter or comma to add. Pick a suggestion or type your own. Up to ' + MAX + ' skills.';
    box.appendChild(inp); wrap.appendChild(box); wrap.appendChild(menu); wrap.appendChild(hint);
    el.style.display = 'none'; el.parentNode.insertBefore(wrap, el.nextSibling);

    function store(fire){ D.set.call(el, list.join(', ')); if(fire) el.dispatchEvent(new Event('input', { bubbles: true })); }
    function draw(){
      [].slice.call(box.querySelectorAll('.sk-chip')).forEach(function(c){ c.remove(); });
      list.forEach(function(t, i){
        var c = document.createElement('span'); c.className = 'sk-chip'; c.appendChild(document.createTextNode(t));
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Remove ' + t); b.textContent = '×';
        b.onclick = function(e){ e.stopPropagation(); list.splice(i, 1); store(true); draw(); inp.focus(); };
        c.appendChild(b); box.insertBefore(c, inp);
      });
      inp.placeholder = list.length ? 'Add another skill' : 'Type a skill and press Enter';
    }
    function add(t){
      t = String(t || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAXLEN); if(!t) return false;
      if(list.length >= MAX){ hint.textContent = 'You can add up to ' + MAX + ' skills.'; return false; }
      if(list.some(function(x){ return x.toLowerCase() === t.toLowerCase(); })){ inp.value = ''; return false; }
      list.push(t); inp.value = ''; store(true); draw(); closeMenu(); return true;
    }
    var active = -1;
    function items(){ return [].slice.call(menu.querySelectorAll('button')); }
    function closeMenu(){ menu.style.display = 'none'; active = -1; }
    function openMenu(){
      var q = inp.value.trim().toLowerCase(), have = list.map(function(x){ return x.toLowerCase(); });
      var m = SUG.filter(function(s){ return have.indexOf(s.toLowerCase()) < 0 && (!q || s.toLowerCase().indexOf(q) >= 0); }).slice(0, 8);
      menu.innerHTML = '';
      m.forEach(function(s){ var b = document.createElement('button'); b.type = 'button'; b.textContent = s; b.onmousedown = function(e){ e.preventDefault(); add(s); inp.focus(); }; menu.appendChild(b); });
      if(q && have.indexOf(q) < 0 && !m.some(function(s){ return s.toLowerCase() === q; })){
        var o = document.createElement('button'); o.type = 'button'; o.className = 'sk-own'; o.textContent = 'Add “' + inp.value.trim() + '”';
        o.onmousedown = function(e){ e.preventDefault(); add(inp.value); inp.focus(); }; menu.appendChild(o);
      }
      menu.style.display = menu.children.length ? 'block' : 'none'; active = -1;
    }
    box.addEventListener('click', function(){ inp.focus(); });
    inp.addEventListener('focus', openMenu);
    inp.addEventListener('input', function(e){ e.stopPropagation(); if(inp.value.indexOf(',') >= 0){ var parts = inp.value.split(','); parts.slice(0, -1).forEach(add); inp.value = parts[parts.length - 1]; } openMenu(); });
    inp.addEventListener('keydown', function(e){
      var it = items();
      if(e.key === 'Enter'){ e.preventDefault(); if(active >= 0 && it[active]) it[active].dispatchEvent(new MouseEvent('mousedown')); else add(inp.value); }
      else if(e.key === 'ArrowDown' && it.length){ e.preventDefault(); active = (active + 1) % it.length; it.forEach(function(b, i){ b.classList.toggle('on', i === active); }); }
      else if(e.key === 'ArrowUp' && it.length){ e.preventDefault(); active = (active - 1 + it.length) % it.length; it.forEach(function(b, i){ b.classList.toggle('on', i === active); }); }
      else if(e.key === 'Escape'){ closeMenu(); }
      else if(e.key === 'Backspace' && !inp.value && list.length){ list.pop(); store(true); draw(); }
    });
    inp.addEventListener('blur', function(){ if(inp.value.trim()) add(inp.value); closeMenu(); });

    /* programmatic reads/writes of the original field (form reset, edit job, step re-render) keep the tags in sync */
    Object.defineProperty(el, 'value', { configurable: true, get: function(){ return D.get.call(el); }, set: function(v){ list = parse(v); D.set.call(el, list.join(', ')); draw(); } });
    D.set.call(el, list.join(', ')); draw();
  }
  function scan(root){
    if(!root || !root.querySelectorAll) return;
    if(root.matches && root.matches(SEL)) attach(root);
    var l = root.querySelectorAll(SEL); for(var i = 0; i < l.length; i++) attach(l[i]);
  }
  function start(){
    scan(document);
    if(window.MutationObserver) new MutationObserver(function(ms){ ms.forEach(function(m){ m.addedNodes.forEach(function(n){ if(n.nodeType === 1) scan(n); }); }); }).observe(document.documentElement, { childList: true, subtree: true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
