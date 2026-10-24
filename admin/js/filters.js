// admin/js/filters.js — extra server-side filters for every admin list + catalog search.
// Filters are sent to the API as query params (type, state, city, profile, category_id, company,
// job_type, owner, date_from, search). The Laravel /api/admin/* endpoints must honour them.
(function(){
  const F = { institutions:{}, faculty:{}, branches:{}, jobs:{}, files:{} };
  const ROUTE = [
    [/^\/admin\/companies(\?|$)/, 'institutions'], [/^\/admin\/users(\?|$)/, 'faculty'],
    [/^\/admin\/branch-requests(\?|$)/, 'branches'], [/^\/admin\/jobs(\?|$)/, 'jobs'], [/^\/admin\/files(\?|$)/, 'files']
  ];
  const TAB_OF = { institutions:'institutions', faculty:'faculty', branches:'branches', jobs:'jobs', files:'files' };

  // Append the active filters of the CURRENT tab to its list requests (and its CSV export).
  const og = api.get.bind(api);
  api.get = function(path){
    for(const r of ROUTE){
      if(r[0].test(path) && S.tab === TAB_OF[r[1]]){
        const f = F[r[1]], parts = [];
        Object.keys(f).forEach(function(k){ if(f[k]) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(f[k])); });
        if(parts.length) path += (path.indexOf('?') < 0 ? '?' : '&') + parts.join('&');
        break;
      }
    }
    return og.apply(null, [path].concat([].slice.call(arguments, 1)));
  };

  const sel = function(k, label, opts){
    return '<select data-f="' + k + '" aria-label="' + label + '"><option value="">' + label + '</option>'
      + opts.map(function(o){ return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select>';
  };
  const txt = function(k, ph){ return '<input type="search" data-f="' + k + '" placeholder="' + ph + '" aria-label="' + ph + '">'; };
  const dt  = function(k, label){ return '<label class="x-date">' + label + ' <input type="date" data-f="' + k + '"></label>'; };

  const BARS = {
    institutions:{ panel:'panelInstitutions', reload:function(){ S.inst.page = 1; loadInstitutions(); },
      html: sel('type','All types',[['school','School'],['junior_college','Junior College'],['college','College'],['university','University'],['other','Other']])
        + txt('state','State') + txt('city','City') + sel('profile','Any profile',[['complete','Complete'],['incomplete','Incomplete']]) },
    branches:{ panel:'panelBranches', reload:function(){ S.br.page = 1; loadBranches(); },
      html: txt('search','Branch / institution / code') + txt('state','State') + txt('city','City') },
    faculty:{ panel:'panelFaculty', reload:function(){ S.fac.page = 1; loadFaculty(); },
      html: txt('state','State') + txt('city','City') + sel('profile','Any profile',[['complete','Complete'],['incomplete','Incomplete']]) },
    jobs:{ panel:'panelJobs', reload:function(){ S.jobs.page = 1; load_jobs(); },
      html: '<span data-cat></span>' + txt('company','Institution') + txt('state','State') + txt('city','City')
        + sel('job_type','Any job type',[['full_time','Full-time'],['part_time','Part-time'],['contract','Contract'],['visiting','Visiting']]) },
    files:{ panel:'panelFiles', reload:function(){ S.files.page = 1; load_files(); },
      html: txt('search','File name or user email') + sel('owner','Any owner',[['candidate','Faculty'],['employer','Institution']]) + dt('date_from','From') }
  };

  function build(){
    Object.keys(BARS).forEach(function(tab){
      const b = BARS[tab], panel = document.getElementById(b.panel); if(!panel || panel.querySelector('.x-filters')) return;
      const row = panel.querySelector('.admin-search-row, .admin-toolbar');
      const div = document.createElement('div'); div.className = 'x-filters'; div.dataset.tab = tab;
      div.innerHTML = b.html + '<button type="button" class="btn btn-ghost btn-sm" data-clear>Clear filters</button>';
      (row || panel.firstElementChild).insertAdjacentElement('afterend', div);
    });
  }
  const fire = {};
  function onChange(e){
    const el = e.target, bar = el.closest('.x-filters'); if(!bar || !el.dataset.f) return;
    const tab = bar.dataset.tab; F[tab][el.dataset.f] = el.value.trim();
    clearTimeout(fire[tab]); fire[tab] = setTimeout(BARS[tab].reload, el.tagName === 'INPUT' && el.type === 'search' ? 400 : 0);
  }
  document.addEventListener('input', onChange); document.addEventListener('change', onChange);
  document.addEventListener('click', function(e){
    const c = e.target.closest('[data-clear]'); if(!c) return;
    const bar = c.closest('.x-filters'), tab = bar.dataset.tab;
    bar.querySelectorAll('[data-f]').forEach(function(i){ i.value = ''; }); F[tab] = {}; BARS[tab].reload();
  });

  // Job category dropdown (from the real categories list).
  function loadJobCats(){
    const slot = document.querySelector('.x-filters[data-tab="jobs"] [data-cat]'); if(!slot || slot.dataset.done) return;
    slot.dataset.done = '1';
    og('/admin/categories?per_page=200').then(function(r){
      const rows = (r && r.data) || [];
      slot.outerHTML = sel('category_id','All categories', rows.map(function(c){ return [c.id, String(c.name).replace(/</g,'&lt;')]; }));
    }).catch(function(){ slot.remove(); });
  }

  // Catalog (skills / categories): search box above each list (lists are fully loaded, so this is exact).
  function catalogSearch(){
    [['skillBody','Search skills'],['catBody','Search categories']].forEach(function(p){
      const body = document.getElementById(p[0]); if(!body) return;
      const wrap = body.closest('.admin-scroll'); if(!wrap || wrap.previousElementSibling && wrap.previousElementSibling.classList.contains('x-catsearch')) return;
      const i = document.createElement('input'); i.type = 'search'; i.className = 'x-catsearch'; i.placeholder = p[1]; i.setAttribute('aria-label', p[1]);
      i.addEventListener('input', function(){
        const q = i.value.trim().toLowerCase();
        body.querySelectorAll('tr').forEach(function(r){ r.style.display = !q || r.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none'; });
      });
      wrap.insertAdjacentElement('beforebegin', i);
    });
  }

  build(); catalogSearch();
  const _go = window.adminGo; window.adminGo = function(){ const r = _go.apply(this, arguments); loadJobCats(); return r; };
  loadJobCats();
})();
