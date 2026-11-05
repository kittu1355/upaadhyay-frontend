/* pincode.js — shared PIN code lookup via the India Post API (https://api.postalpincode.in).
   UPPin.lookup('500072') -> Promise of {state,district,city,area,areas:[names]} or null (not found / offline). */
(function(){
  var cache = {};
  function lookup(pin){
    pin = String(pin || '').trim();
    if(!/^\d{6}$/.test(pin)) return Promise.resolve(null);
    if(cache[pin]) return Promise.resolve(cache[pin]);
    var ac = new AbortController(), t = setTimeout(function(){ ac.abort(); }, 8000);
    return fetch('https://api.postalpincode.in/pincode/' + pin, { signal: ac.signal })
      .then(function(r){ return r.json(); })
      .then(function(j){
        var d = Array.isArray(j) ? j[0] : null;
        if(!d || d.Status !== 'Success' || !d.PostOffice || !d.PostOffice.length) return null;
        var o = d.PostOffice[0], areas = [];
        d.PostOffice.forEach(function(x){ if(areas.indexOf(x.Name) < 0) areas.push(x.Name); });
        var res = { state: o.State, district: o.District, city: (o.Block && o.Block !== 'NA') ? o.Block : o.District, area: o.Name, areas: areas };
        cache[pin] = res; return res;
      })
      .catch(function(){ return null; })
      .then(function(r){ clearTimeout(t); return r; });
  }
  window.UPPin = { lookup: lookup };
})();
