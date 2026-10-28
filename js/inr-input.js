/* Indian-rupee number formatting for salary inputs: 4500000 -> 45,00,000 while typing.
   - Numeric salary fields (job posting min/max): the box shows commas, but .value returns plain digits,
     so existing validation / saving code keeps working unchanged.
   - Free-text money fields (CTC, expected salary, project value): shown and stored with commas;
     text that isn't a plain number (e.g. "12 LPA") is left exactly as typed. */
(function(){
  var NUM = '#jbSalMin,#jbSalMax,#jb_salMin,#jb_salMax,[data-inr="num"]';
  var TXT = '#pfPresentCtc,#pfExpectedCtc,#pfSalaryPresentCtc,#pfSalaryExpectedCtc,#pfMinAcceptableSalary,#pfProjectValue,[data-k="salary"],[data-inr="text"]';
  var D = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  function group(d){
    d = d.replace(/^0+(?=\d)/, '');
    if(d.length <= 3) return d;
    return d.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + d.slice(-3);
  }
  function fmtNum(s){ return group(String(s).replace(/\D/g, '')); }
  function fmtTxt(s){
    var m = /^(\s*₹?\s*)([\d,]*)(\.\d*)?\s*$/.exec(s);
    if(!m || !m[2].replace(/,/g, '')) return s;          // not a plain number: leave as typed
    return m[1] + group(m[2].replace(/,/g, '')) + (m[3] || '');
  }
  function modeOf(el){ return el.matches(NUM) ? 'num' : 'text'; }
  function fmt(el, s){ return modeOf(el) === 'num' ? fmtNum(s) : fmtTxt(s); }

  function attach(el){
    if(el.__inr) return; el.__inr = 1;
    var num = modeOf(el) === 'num';
    if(num){ try{ el.type = 'text'; }catch(e){} el.setAttribute('inputmode', 'numeric'); el.setAttribute('autocomplete', 'off'); el.removeAttribute('min'); }
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: function(){ var v = D.get.call(el); return num ? v.replace(/,/g, '') : v; },
      set: function(v){ D.set.call(el, fmt(el, v == null ? '' : v)); }
    });
    D.set.call(el, fmt(el, D.get.call(el)));
  }
  function scan(root){
    if(!root || !root.querySelectorAll) return;
    if(root.matches && root.matches(NUM + ',' + TXT)) attach(root);
    var l = root.querySelectorAll(NUM + ',' + TXT);
    for(var i = 0; i < l.length; i++) attach(l[i]);
  }

  /* capture phase: format first, so every other input handler reads the formatted value */
  document.addEventListener('input', function(e){
    var el = e.target;
    if(!el || !el.matches || !el.matches(NUM + ',' + TXT)) return;
    attach(el);
    var raw = D.get.call(el), caret = el.selectionStart, digitsBefore = 0, i;
    if(caret == null) caret = raw.length;
    for(i = 0; i < caret; i++) if(/\d/.test(raw.charAt(i))) digitsBefore++;
    var out = fmt(el, raw);
    if(out === raw) return;
    D.set.call(el, out);
    var pos = 0, seen = 0;
    while(pos < out.length && seen < digitsBefore){ if(/\d/.test(out.charAt(pos))) seen++; pos++; }
    try{ el.setSelectionRange(pos, pos); }catch(x){}
  }, true);

  function start(){
    scan(document);
    if(window.MutationObserver) new MutationObserver(function(ms){
      ms.forEach(function(m){ m.addedNodes.forEach(function(n){ if(n.nodeType === 1) scan(n); }); });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.inrFormat = fmtNum;
})();
