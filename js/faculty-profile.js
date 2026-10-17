/* Faculty Profile UI — loads/saves through the Laravel API (GET/PUT /candidate/profile, uploads, DELETE /candidate/profile/photo). No demo data. */
(function(){
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const OPT={
 title:['Mr.','Ms.','Mrs.','Dr.','Prof.','Other'],gender:['Male','Female','Non-binary','Prefer not to say','Other'],
 desig:['Teacher','Primary Teacher','TGT','PGT','Lecturer','Assistant Professor','Associate Professor','Professor','Head of Department','Principal','Academic Coordinator','Researcher','Visiting Faculty','Guest Faculty','Other'],
 levels:['Pre-Primary','Primary','Middle School','Secondary School','Senior Secondary','Junior College','Undergraduate / UG','Postgraduate / PG','PhD / Research','Professional Courses','Other'],
 subjects:['Mathematics','Physics','Chemistry','Biology','Computer Science','Data Science','English','Commerce','Economics','Management','History','Geography','Political Science','Languages','Physical Education','Fine Arts','Statistics','Electronics','Mechanical Engineering','Civil Engineering','Anatomy','Pharmacology','Other'],
 boards:['CBSE','ICSE','State Board','IB','Cambridge','University / College Curriculum','Other'],
 medium:['English','Hindi','Telugu','Other'],
 jobtype:['Full Time','Part Time','Contract','Visiting Faculty','Guest Faculty'],
 emp:['Full Time','Part Time','Contract','Visiting Faculty','Guest Faculty','Temporary','Internship / Trainee','Other'],
 cities:['Hyderabad','Nagpur','Bengaluru','Mumbai','Pune','Delhi NCR','Chennai','Kolkata','Telangana','Maharashtra','Karnataka','Anywhere in India'],
 high:['10th / SSC','12th / Intermediate','Diploma',"Bachelor's Degree","Master's Degree",'M.Phil','Ph.D.','Postdoctoral','Other'],
 ug:['BA','BSc','BCom','BBA','BCA','BE','BTech','BEd','LLB','MBBS','BPharm','BPEd','Other'],
 pg:['MA','MSc','MCom','MBA','MCA','MTech','ME','MEd','MPharm','MPEd','MS','Other'],
 mode:['Regular','Distance','Online','Part Time'],stream:['Science','Commerce','Arts / Humanities','Vocational','Other'],
 tq:['B.Ed.','M.Ed.','D.El.Ed.','B.P.Ed.','M.P.Ed.','Special Education Qualification','CTET','TET','State TET','NET','SET','SLET','Other'],
 linkt:['LinkedIn','Google Scholar','ORCID','ResearchGate','Personal Website','Portfolio','YouTube / Teaching Channel','Other'],
 pref:['Pre-Primary','Primary','Middle School','Secondary School','Senior Secondary','Junior College','Undergraduate / UG','Postgraduate / PG','PhD / Research'],
 exp:['Fresher','1–2 Years','3–5 Years','6–10 Years','11–15 Years','15+ Years'],
 idxJ:['SCI','SCIE','ESCI','Scopus','Web of Science (WoS)','Scopus + WoS','UGC-CARE','ABDC','Other Indexed','Non-Indexed'],
 idxC:['SCI','SCIE','ESCI','Scopus','Web of Science (WoS)','Scopus + WoS','UGC','ABDC','Other Indexed','Non-Indexed'],
 idxB:['Scopus','Web of Science (WoS)','Scopus + WoS','Other Indexed','Non-Indexed'],
 qrt:['Q1','Q2','Q3','Q4','Not Applicable / Not Verified'],
 pos:['First Author','Corresponding Author','Co-Author','Other'],
 ptype:['Design Patent','Utility Patent','Other'],pstat:['Filed','Published','Granted','Rejected','Withdrawn'],
 ctype:['National','International'],btype:['Authored Book','Edited Book'],
 otype:['Magazine Article','Research Article','Blog','Technical Article','Industry Article','Science Communication']};
const SEC=['Personal Details','Account & Contact','Professional Profile','Education & Qualifications','Teaching Qualifications','Employment History','Teaching Experience','Research Option','Add Resume','Teaching Preferences','Verification','Profile Preview'];
const ICON=['user','lock','cap','book','award','briefcase','hourglass','folder','file','target','shield','eye'];
/* inline SVG icons (Lucide-style, stroke = currentColor) — no emoji anywhere */
const SVG={
user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
lock:'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
cap:'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
book:'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
award:'<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
briefcase:'<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
hourglass:'<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
folder:'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
eye:'<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
cal:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
check:'<path d="M20 6 9 17l-5-5"/>',
plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
circle:'<circle cx="12" cy="12" r="9"/>',
alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'};
const ic=(n,z=14)=>`<svg class="ic" width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[n]}</svg>`;
const pill=(c,i,t)=>`<span class="fp-pill ${c}">${ic(i,11)}${t}</span>`;
const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
const TAG={req:['t-req','Required'],rec:['t-rec','Recommended'],opt:['t-opt','Optional']};
const blank=()=>({open:0,done:{},savedAt:'',title:'',first:'',middle:'',last:'',dob:'',gender:'',headline:'',email:'',phone:'',phone2:'',pin:'',state:'',district:'',city:'',area:'',addr:'',vis:'Employers Only',
 desig:'',levels:[],subjects:[],high:'',edu:{ssc:{},hsc:{},ug:{},pg:{},phd:{},mphil:{},dip:{},oth:{}},tq:[],jobs:[],taught:[],taughtSubs:[],boards:[],medium:[],expLevel:'',links:[],files:{},resumes:[],resumeSel:'',resumePub:'',cvs:[],cvSel:'',cvPub:'',editions:[],research:{journal:[],patent:[],conf:[],book:[],chapter:[],other:[]},
 prefLevels:[],prefSubs:[],prefJob:[],prefWork:'',prefLoc:[],reloc:'',salary:'',ver:{edu:'none',exp:'none',id:'none'}});
let S=blank(),SAVED='',ST={saving:false,busy:{}},_uid=0;
const RULES={photo:{ext:['jpg','jpeg','png','webp'],mb:2,label:'JPG, PNG or WEBP · Max 2 MB'},resume:{ext:['pdf','doc','docx'],mb:5,label:'PDF, DOC or DOCX · Max 5 MB'},doc:{ext:['pdf','jpg','jpeg','png'],mb:5,label:'PDF, JPG or PNG · Max 5 MB'}};
const kindOf=p=>p==='photo'?'photo':p==='resume'?'resume':'doc';
const szt=f=>f&&f.size?` · ${f.size} MB`:'';
const get=(p,o=S)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const set=(p,v)=>{const k=p.split('.'),l=k.pop();let o=S;k.forEach(x=>{if(o[x]==null)o[x]={};o=o[x]});o[l]=v};
const tag=(t,txt)=>{const x=TAG[t]||['t-some',t];return `<span class="fp-tag ${x[0]}">${esc(txt||x[1])}</span>`};
const F=(label,t,inner,o={})=>`<div class="fp-f ${o.full?'full':''}"><label>${label}${t?tag(t,o.tt):''}</label>${inner}${o.hint?`<div class="fp-hint">${o.hint}</div>`:''}<div class="fp-err" data-e></div></div>`;
const I=(p,o={})=>`<input class="fp-in" data-k="${p}" ${o.v?`data-v="${o.v}"`:''} value="${esc(get(p))}" placeholder="${esc(o.ph||'')}" ${o.type?`type="${o.type}"`:''} ${o.dis?'disabled':''}>`;
const SEL=(p,opts,o={})=>`<select class="fp-in" data-k="${p}" ${o.v?`data-v="${o.v}"`:''} ${o.re?`data-re="${o.re}"`:''}><option value="">${o.ph||'Select…'}</option>${opts.map(x=>`<option ${get(p)===x?'selected':''}>${esc(x)}</option>`).join('')}</select>`;
const RAD=(p,opts)=>`<div class="fp-radio">${opts.map(x=>`<label><input type="radio" name="${p}" data-k="${p}" value="${esc(x)}" ${get(p)===x?'checked':''}>${esc(x)}</label>`).join('')}</div>`;
const MS=(p,opts,ph)=>{const v=get(p)||[];return `<div class="fp-ms" data-ms="${p}" data-opts="${opts}"><div class="box">${v.map(x=>`<span class="fp-chip">${esc(x)}<u data-rm="${esc(x)}">${ic('x',11)}</u></span>`).join('')}<input placeholder="${v.length?'':esc(ph||'Search & select…')}"></div></div>`};
const UP=(p,label,t)=>{const f=S.files[p];return `<div class="fp-f"><label>${label}${t?tag(t):''}</label><div class="fp-up ${f?'has':''}" data-up="${p}">${UPin(p)}</div><div class="fp-hint">Accepted: ${RULES[kindOf(p)].label}</div></div>`};
const UPin=p=>{const f=S.files[p],b=ST.busy[p];if(b)return `<span class="nm" role="status"><small>Uploading… please wait</small></span>`;
 return f?`<span class="nm">${p==='photo'&&f.url?`<img class="fp-thumb" src="${esc(f.url)}" alt="Profile photo preview"> `:ic('check',13)+' '}${esc(f.name)}${f.size?`<br><small>${f.size} MB</small>`:''}</span><button type="button" class="fp-btn sm" data-pick="${p}">Replace</button><button type="button" class="fp-btn sm dng" data-del="${p}">Remove</button>`:`<span class="nm"><small>No file uploaded</small></span><button type="button" class="fp-btn sm" data-pick="${p}">Upload</button>`};
/* ---------- computed ---------- */
function age(d){const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d||'');if(!m)return null;const D=+m[1],M=+m[2],Y=+m[3],dt=new Date(Y,M-1,D);if(dt.getMonth()!==M-1||dt.getDate()!==D||dt>new Date()||Y<1930)return null;const n=new Date();let a=n.getFullYear()-Y;if(n<new Date(n.getFullYear(),M-1,D))a--;return a}
function months(){let t=0;const n=new Date();S.jobs.forEach(j=>{if(!j.start)return;const [y,m]=j.start.split('-').map(Number);let e=n;if(!j.cur){if(!j.end)return;const q=j.end.split('-').map(Number);e=new Date(q[0],q[1]-1)}t+=Math.max(0,(e.getFullYear()-y)*12+e.getMonth()-(m-1))});return t}
const expLabel=m=>{const y=m/12;return m<1?'Fresher':y<3?'1–2 Years':y<6?'3–5 Years':y<11?'6–10 Years':y<16?'11–15 Years':'15+ Years'};
const school=()=>S.levels.some(l=>['Pre-Primary','Primary','Middle School','Secondary School','Senior Secondary'].includes(l));
const ug=()=>S.levels.some(l=>['Undergraduate / UG','Junior College'].includes(l)), pg=()=>S.levels.some(l=>['Postgraduate / PG','PhD / Research'].includes(l));
const EDU={'10th / SSC':['ssc'],'12th / Intermediate':['ssc','hsc'],'Diploma':['ssc','dip'],"Bachelor's Degree":['ssc','hsc','ug'],"Master's Degree":['ssc','hsc','ug','pg'],'M.Phil':['ssc','hsc','ug','pg','mphil'],'Ph.D.':['ssc','hsc','ug','pg','phd'],'Postdoctoral':['ssc','hsc','ug','pg','phd'],'Other':['ssc','hsc','oth']};
function completion(){const req=[['Personal details',S.first&&S.last&&age(S.dob)!==null],['Contact information',S.email&&S.phone],['Highest qualification',S.high],['Current designation',S.desig],['Subject specialization',S.subjects.length]];
 const rec=[['Add resume',pubItem('resumes')||S.files.resume,8],['Add employment history',S.jobs.length,5],['Add research records',rsTotal()>0,7],['Add certificates',Object.keys(S.files).some(k=>k!=='resume'&&k!=='photo'),3]];
 const p=req.filter(x=>x[1]).length*16+rec.filter(x=>x[1]).length*5;return{req,rec,p}}
/* ---------- sections ---------- */
const R={
0:()=>`<h3>Personal Details</h3><p class="fp-sub">Basic professional identity shown to institutions.</p><div class="fp-grid g3">
 ${F('Title','opt',SEL('title',OPT.title))}${F('First name','req',I('first',{v:'req'}))}${F('Middle name','opt',I('middle'))}${F('Last name','req',I('last',{v:'req'}))}
 ${F('Date of birth','req',I('dob',{v:'dob',ph:'DD / MM / YYYY'})+`<span class="fp-age" id="fpAge"></span>`,{hint:'Age is calculated automatically.'})}${F('Gender','opt',SEL('gender',OPT.gender))}</div>
 <div class="fp-grid" style="margin-top:14px">${F('Profile photo','opt',`<div class="fp-up ${S.files.photo?'has':''}" data-up="photo">${UPin('photo')}</div>`,{hint:RULES.photo.label})}
 ${F('Professional headline','rec',I('headline',{ph:'e.g. Assistant Professor - Computer Science'}))}
 ${F('Email','req',I('email',{dis:true}),{hint:'Your login email. It cannot be changed here.'})}${F('Phone number','req',I('phone',{v:'phone'}))}${F('Alternative phone','opt',I('phone2'))}</div>
 <div class="fp-card" style="margin-top:14px"><h4>Location ${tag('req')}</h4><div class="fp-grid g3">
 ${F('PIN code','req',I('pin',{v:'pin',ph:'6-digit PIN'}),{hint:'6-digit PIN code'})}${F('State','req',I('state'))}${F('District','opt',I('district'))}${F('City','req',I('city'))}${F('Area','opt',I('area'))}
 ${F('Full address','opt',`<textarea class="fp-in" data-k="addr" rows="2">${esc(S.addr)}</textarea>`,{full:1})}</div><div class="fp-hint" id="fpPinMsg"></div></div>`,
1:()=>`<h3>Account & Contact</h3><p class="fp-sub">Contact and privacy controls.</p><div class="fp-card"><h4>Account details</h4>
 <div class="fp-row"><span>Login email: <b>${esc(S.email)||'—'}</b></span></div><div class="fp-row"><span>Phone: <b>${esc(S.phone)||'Not added'}</b></span><span class="fp-hint">Edit in Personal Details</span></div></div>
 <div class="fp-card"><h4>Profile visibility ${tag('req')}</h4>${RAD('vis',['Public','Employers Only','Private'])}<div class="fp-hint" style="margin-top:8px">Saved with your profile. It will apply once employers can browse faculty profiles.</div></div>
 <div class="fp-note fp-note-i">${ic('lock',14)}<span>We never collect Aadhaar, PAN, bank details, passwords, OTPs or financial information in your faculty profile.</span></div>`,
2:()=>`<h3>Professional Profile</h3><p class="fp-sub">Helps institutions match you with the right roles.</p><div class="fp-grid">
 ${F('Current designation','req',SEL('desig',OPT.desig,{v:'req'}))}${F('Teaching / target level','req',MS('levels','levels'),{hint:'Drives which qualification fields are shown.'})}
 ${F('Subjects / specialization','req',MS('subjects','subjects','Search subjects…'),{full:1})}</div>`,
3:()=>{const need=EDU[S.high]||[];return `<h3>Education & Qualifications</h3><p class="fp-sub">Choose your highest qualification — only the relevant sections appear.</p>
 ${F('Highest qualification','req',SEL('high',OPT.high,{v:'req',re:'edu'}))}
 <div style="margin-top:14px" id="fpEdu">${need.length?need.map(eduBlock).join(''):`<div class="fp-empty">Select your highest qualification to continue.</div>`}</div>`},
4:()=>{const rows=[];if(school())rows.push(['B.Ed. / D.El.Ed. / relevant teaching qualification','Required for some school-teaching roles','some'],['TET / CTET','Role dependent','some']);if(ug())rows.push(["Bachelor's & Master's degree",'Required for UG roles','some'],['Professional qualification','Where applicable','opt']);if(pg())rows.push(["Master's degree",'Required for university faculty applications','some'],['NET / SET / SLET','Required for some higher-education roles','some'],['Ph.D. & research information','Recommended for research roles','rec']);
 return `<h3>Teaching Qualifications</h3><p class="fp-sub">Eligibility varies by post and institution (e.g. UGC norms for higher education). Nothing here is mandatory for every faculty member.</p>
 <div class="fp-note"><b>Based on your target levels (${esc(S.levels.join(', ')||'none selected')}):</b><ul>${rows.map(r=>`<li>${r[0]} ${tag(r[2]=='some'?r[1]:r[2],r[1])}</li>`).join('')||'<li>Select teaching levels in Professional Profile.</li>'}</ul></div>
 <div id="fpTq">${S.tq.length?S.tq.map(tqCard).join(''):`<div class="fp-empty">No teaching qualifications added yet.</div>`}</div>
 <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="fp-in" id="fpTqSel" style="max-width:280px"><option value="">Choose qualification…</option>${OPT.tq.map(x=>`<option>${x}</option>`).join('')}</select><button class="fp-btn pri" data-act="addtq">${ic('plus',13)}Add qualification</button></div>`},
5:()=>`<h3>Employment History</h3><p class="fp-sub">Add current and past teaching roles. Documents are optional unless a job requires them.</p><div id="fpJobs">${jobsHTML()}</div><button class="fp-btn pri" data-act="addjob">${ic('plus',13)}Add employment</button>`,
6:()=>{const m=months();return `<h3>Teaching Experience</h3><p class="fp-sub">Calculated from your employment history where possible.</p>
 <div class="fp-card"><h4>Total teaching experience ${tag('rec')}</h4><b style="font-size:20px" id="fpTotal">${Math.floor(m/12)} years ${m%12} months</b><div class="fp-hint">Auto-calculated from employment history (current roles counted to today).</div></div>
 <div class="fp-grid">${F('Experience level','req',SEL('expLevel',OPT.exp),{hint:'Suggested: '+expLabel(m)})}${F('Medium of instruction','rec',MS('medium','medium'))}
 ${F('Classes / levels taught','rec',MS('taught','levels'))}${F('Subjects taught','rec',MS('taughtSubs','subjects'))}${F('Boards / curricula','opt',MS('boards','boards'),{full:1})}</div>`},
7:()=>{const items=docList();return `<h3>Research Option</h3><p class="fp-sub">Everything you have uploaded. Add documents from the relevant sections.</p>
 ${items.length?items.map(d=>`<div class="fp-row"><span>${ic('file',14)} <b>${esc(d[1].name)}</b> <small>${esc(d[0])}${szt(d[1])}</small></span><span class="fp-pill p-ok">${ic('check',11)}Uploaded</span></div>`).join(''):`<div class="fp-empty">No documents uploaded yet.</div>`}
 <div class="fp-note" style="margin-top:14px">Identity documents are not needed for a normal profile. If an institution requires them, you'll be asked in a separate step.</div>${rsHTML()}`},
8:()=>`<h3>Add Resume</h3><p class="fp-sub">Upload up to 5 files or add links in each box, pick the one to show, then publish it.</p>${boxHTML('resumes')}${boxHTML('cvs')}${edHTML()}`,
9:()=>`<h3>Teaching Preferences</h3><p class="fp-sub">What you're looking for next. All optional.</p><div class="fp-grid">
 ${F('Preferred teaching level','opt',MS('prefLevels','pref'))}${F('Preferred subjects','opt',MS('prefSubs','subjects'))}${F('Preferred job type','opt',MS('prefJob','jobtype'))}
 ${F('Work location','opt',RAD('prefWork',['On-site','Remote','Hybrid']))}${F('Preferred locations','opt',MS('prefLoc','cities','Add cities / states'))}${F('Willing to relocate','opt',RAD('reloc',['Yes','No','Maybe']))}
 ${F('Expected salary','opt',I('salary',{ph:'e.g. ₹ per month'}),{hint:'Never required for profile completion.'})}</div>`,
10:()=>`<h3>Profile Verification</h3><p class="fp-sub">Document verification is not available yet.</p>
 <div class="fp-card"><div class="fp-row" style="border:0;padding:0"><b>Email</b><span>${esc(S.email)||'—'}</span></div></div>
 <div class="fp-card"><div class="fp-row" style="border:0;padding:0"><b>Education, experience &amp; identity</b>${pill('p-no','circle','Not verified')}</div><div class="fp-hint" style="margin-top:8px">Upload certificates in Education and Employment History. Verification by our team will be shown here once it is available.</div></div>
 <div class="fp-note">Identity verification is not required to create a faculty profile.</div>`,
11:()=>{const a=age(S.dob),m=months(),ed=(EDU[S.high]||[]).filter(x=>['ug','pg','phd','mphil','dip'].includes(x)).reverse();
 const lab={ug:"Bachelor's",pg:"Master's",phd:'Ph.D.',mphil:'M.Phil',dip:'Diploma'},ch=l=>l&&l.length?l.map(x=>`<span class="fp-chip">${esc(x)}</span>`).join(''):'<span class="fp-hint">Not added</span>';
 const jobs=S.jobs.filter(j=>j.org).map(j=>`<div class="fp-tl"><i class="${j.cur?'cur':''}"></i><div><b>${esc(j.desig)}</b>${j.cur?' '+pill('p-ok','check','Current'):''}<div>${esc(j.org)}${j.dept?' · '+esc(j.dept):''}</div><small>${fmt(j.start)} – ${j.cur?'Present':fmt(j.end)} · ${esc(j.type||'')}</small></div></div>`).join('');
 const eds=ed.map(k=>{const e=S.edu[k]||{};return `<div class="fp-tl"><i></i><div><b>${esc((e.type?e.type+' ':'')+(e.major||lab[k]))}</b><div>${esc(e.uni||'')}</div><small>${esc(lab[k])}${e.end?' · '+esc(e.end):''}</small></div></div>`}).join('');
 const kv=(l,v)=>{v=Array.isArray(v)?v.join(', '):v;return v?`<div class="fp-pv-kv"><span>${l}</span><b>${esc(v)}</b></div>`:''},
  fileRow=(l,f)=>`<div class="fp-pv-file">${ic('file',16)}<div><b>${esc(l)}</b><small>${esc(f.name||'File')}${szt(f)}</small></div>${f.url?`<a href="${esc(f.url)}" target="_blank" rel="noopener">View</a>`:''}</div>`,
  contact=[kv('Email',S.email),kv('Phone',S.phone),kv('Alt. phone',S.phone2),kv('Location',[S.area,S.city,S.district,S.state].filter(Boolean).join(', ')+(S.pin?' - '+S.pin:'')),kv('Gender',S.gender),kv('Visible to',S.vis)].join(''),
  resume=pvItem('resumes','Resume')+pvItem('cvs','CV'),
  tqs=S.tq.filter(q=>q&&q.name).map(q=>`<div class="fp-pv-link">${ic('award',12)}<span><b>${esc(q.name)}</b>${q.spec?' · '+esc(q.spec):''}</span></div>`).join(''),
  tex=[kv('Experience level',S.expLevel),kv('Medium',S.medium),kv('Classes taught',S.taught),kv('Subjects taught',S.taughtSubs),kv('Boards',S.boards)].join(''),
  docs=docList().filter(([l])=>l!=='Profile photo'&&l!=='Resume').map(([l,f])=>fileRow(l,f)).join(''),
  prefs=[kv('Levels',S.prefLevels),kv('Subjects',S.prefSubs),kv('Job type',S.prefJob),kv('Work mode',S.prefWork),kv('Locations',S.prefLoc),kv('Relocate',S.reloc),kv('Expected salary',S.salary)].join('');
 return `<div class="fp-pv"><div class="fp-pv-ban"></div><div class="fp-pv-head">${avatarHTML()}<div style="flex:1;min-width:200px"><h2>${esc([S.title,S.first,S.middle,S.last].filter(Boolean).join(' '))}</h2><div class="fp-pv-role">${esc(S.headline||S.desig||'')}</div><div class="fp-meta"><span>${ic('pin',13)}${esc([S.city,S.state].filter(Boolean).join(', ')||'Location not set')}</span><span>${ic('clock',13)}${m>=12?Math.floor(m/12)+'+ years':m+' months'} experience</span>${a!==null?`<span>${ic('cal',13)}${a} yrs</span>`:''}</div></div><button class="fp-btn pri" data-go="0">Edit Profile</button></div>
 
 <div class="fp-pv-grid">
  ${pvBox('Contact & location',1,contact,'Add your email, phone and location.')}
  ${pvBox('Resume',8,resume,'No resume published yet. Add one in Add Resume.')}
  ${pvBox('Teaching levels',2,S.levels&&S.levels.length?`<div class="fp-chips">${ch(S.levels)}</div>`:'','Add the levels you teach, e.g. Primary, High School, Degree.')}
  ${pvBox('Subjects',2,S.subjects&&S.subjects.length?`<div class="fp-chips">${ch(S.subjects)}</div>`:'','Add the subjects you teach or specialise in.')}
  ${pvBox('Experience',5,jobs,'Fresher or not added yet. Add your employment history.')}
  ${pvBox('Education',3,eds,'Add your highest qualification and details.')}
  ${pvBox('Teaching qualifications',4,tqs,'Add B.Ed., TET, NET or other teaching qualifications.')}
  ${pvBox('Teaching experience',6,tex,'Add the classes, subjects and boards you have taught.')}
  ${pvBox('Documents',7,docs,'No documents uploaded yet.')}
  ${pvBox('Research',7,rsPv(),'Add journal papers, patents, conference papers, books and chapters.')}
  ${pvBox('Editions',8,S.editions.filter(x=>x.name).map(x=>`<div class="fp-pv-link">${ic('link',12)} <span>${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`:esc(x.name)}</span></div>`).join(''),'Add your editions with a name and link.')}
  ${pvBox('Teaching preferences',9,prefs,'Add preferred levels, subjects, job type and locations.')}
</div></div>`}};
function pvBox(t,sec,body,empty){return `<div class="fp-pv-box ${body?'':'empty'}"><div class="fp-pv-bh"><h5>${t}</h5><button type="button" class="fp-pv-add" data-go="${sec}">${body?'Edit':'+ Add'}</button></div>${body||`<div class="fp-pv-ph">${empty}</div>`}</div>`}
function eduBlock(k){const hi=(EDU[S.high]||[]).slice(-1)[0]===k,rq=hi?'req':(k==='ssc'||k==='hsc'?'rec':'some');const T=(t)=>tag(rq==='some'?'Required for some jobs':rq,rq==='some'?t:undefined);
 const e=`edu.${k}.`,names={ssc:'10th / SSC',hsc:'12th / Intermediate',ug:"Bachelor's Degree",pg:"Master's Degree",phd:'Ph.D. / Doctoral Details',mphil:'M.Phil',dip:'Diploma',oth:'Other qualification'};
 const yrs=I(e+'end',{ph:'YYYY'}),pc=I(e+'score',{ph:'e.g. 8.2 CGPA / 78%'}),v=hi?'req':'';
 let body;
 if(k==='ssc'||k==='hsc')body=`<div class="fp-grid g3">${F('Qualification',0,I(e+'q',{ph:names[k]}))}${F('Board',rq,I(e+'board',{v}))}${F('School / College name',rq,I(e+'uni',{v}))}${k==='hsc'?F('Stream','rec',SEL(e+'stream',OPT.stream)):''}${F('Year of passing',rq,I(e+'end',{ph:'YYYY'}))}${F('Percentage / CGPA','rec',pc)}</div>`;
 else if(k==='phd')body=`<div class="fp-grid">${F('University / Institution','req',I(e+'uni',{v:'req'}))}${F('Research area','req',I(e+'area',{v:'req'}))}${F('Specialization','rec',I(e+'major'))}${F('Year of award','req',I(e+'end',{ph:'YYYY',v:'req'}))}${F('Thesis / research title','rec',I(e+'thesis'),{full:1})}${UP('phdcert','Ph.D. certificate','rec')}</div>
 <div class="fp-card" style="margin-top:12px"><h4>Research links ${tag('rec','Recommended for research-oriented roles')}</h4><div class="fp-grid">${F('Research profile URL','opt',I(e+'url',{v:'url',ph:'https://'}))}${F('ORCID','opt',I(e+'orcid',{v:'url',ph:'https://orcid.org/…'}))}${F('Google Scholar','opt',I(e+'scholar',{v:'url',ph:'https://scholar.google.com/…'}))}${F('ResearchGate','opt',I(e+'rg',{v:'url',ph:'https://researchgate.net/…'}))}</div></div>`;
 else body=`<div class="fp-grid">${F('Degree type',rq,SEL(e+'type',k==='pg'?OPT.pg:OPT.ug,{v}))}${F('Specialization / major',rq,I(e+'major',{v}))}${F('University / institution',rq,I(e+'uni',{v}))}${F('College name','opt',I(e+'college'))}${F('Study mode','opt',SEL(e+'mode',OPT.mode))}${F('Percentage / CGPA','rec',pc)}${F('Start year','opt',I(e+'start',{ph:'YYYY'}))}${F('End year',rq,I(e+'end',{ph:'YYYY',v}))}${UP(k+'cert','Degree certificate','rec')}</div>`;
 return `<div class="fp-card"><h4>${names[k]} ${k==='ssc'||k==='hsc'?tag(rq):tag(rq==='some'?'Required for some jobs':rq)}</h4>${body}</div>`}
function tqCard(q,i){const n=q.name,t=['B.Ed.','D.El.Ed.','CTET','TET','State TET','B.P.Ed.'].includes(n)?'Required for some school-teaching roles':['NET','SET','SLET'].includes(n)?'Required for some higher-education roles':'Optional';const p=`tq.${i}.`;
 return `<div class="fp-card"><h4>${esc(n)} ${tag(t==='Optional'?'opt':t)}<button class="fp-btn sm dng" style="margin-left:auto" data-act="rmtq:${i}">Remove</button></h4><div class="fp-grid">${F('Specialization','opt',I(p+'spec'))}${F('Issuing authority','rec',I(p+'auth'))}${F('Year','rec',I(p+'year',{ph:'YYYY'}))}${UP('tq'+i,'Certificate / scorecard','opt')}</div></div>`}
function jobsHTML(){return S.jobs.length?S.jobs.map(jobCard).join(''):`<div class="fp-empty">No employment added yet. Freshers can skip this section.</div>`}
function fmt(m){if(!m)return'';const[y,mo]=m.split('-');return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mo-1]+' '+y}
function jobCard(j,i){const p=`jobs.${i}.`;return `<div class="fp-card"><div class="fp-job"><div><b>${esc(j.org||'New employment')}</b><div class="fp-hint">${esc(j.desig||'')} ${j.start?'· '+(j.start.slice(0,4))+' – '+(j.cur?'Present':(j.end||'').slice(0,4)):''}</div>${j.cur?pill('p-ok','check','Current'):''}</div><button class="fp-btn sm dng" data-act="rmjob:${i}">Remove</button></div>
 <div class="fp-grid" style="margin-top:12px">${F('Organization / institution','req',I(p+'org',{v:'req'}))}${F('Designation','req',I(p+'desig',{v:'req'}))}${F('Department','opt',I(p+'dept'))}${F('Employment type','opt',SEL(p+'type',OPT.emp))}${F('Teaching level','opt',SEL(p+'level',OPT.levels))}${F('Subjects taught','opt',MS(p+'subs','subjects'))}
 ${F('Start date','req',I(p+'start',{type:'month',v:'req'}))}${j.cur?'':F('End date','req',I(p+'end',{type:'month',v:'req'}))}
 <div class="fp-f full"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-k="${p}cur" data-re="jobs" ${j.cur?'checked':''}> I currently work here</label></div></div>
 ${j.cur?`<div class="fp-cur"><b>${ic('check',13)} Current employment</b><br>Current Position: ${esc(j.desig)} · Institution: ${esc(j.org)} · Department: ${esc(j.dept||'—')}<br>Currently working since: <b>${fmt(j.start)||'—'} – Present</b></div>`:''}
 <div class="fp-grid g3" style="margin-top:12px">${UP('j'+i+'exp','Experience certificate','opt')}${UP('j'+i+'app','Appointment letter','opt')}${UP('j'+i+'rel','Relieving letter','opt')}</div></div>`}
function linksHTML(){return S.links.length?S.links.map((l,i)=>`<div class="fp-row"><span><b>${esc(l.t)}</b><br><a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.u)}</a></span><span><button class="fp-btn sm" data-act="editlink:${i}">Edit</button> <button class="fp-btn sm dng" data-act="rmlink:${i}">Remove</button></span></div>`).join(''):`<div class="fp-empty">No links added yet.</div>`}
function docList(){const nm={photo:'Profile photo',resume:'Resume',phdcert:'Ph.D. certificate',ugcert:"Bachelor's certificate",pgcert:"Master's certificate",mphilcert:'M.Phil certificate',dipcert:'Diploma certificate',othcert:'Certificate'};return Object.entries(S.files).map(([k,f])=>[nm[k]||(/^tq/.test(k)?'Teaching qualification':/^j\d/.test(k)?'Employment document':'Document'),f])}
/* ---------- shell ---------- */
function heroHTML(){const c=completion(),m=months(),nx=c.rec.find(x=>!x[1]),miss=c.req.find(x=>!x[1]);
 return `${bannerHTML()}<div class="fp-hero"><div class="fp-hero-l">${avatarHTML()}<div><h2>${esc([S.title,S.first,S.last].filter(Boolean).join(' ')||'Your name')}</h2><p>${esc(S.headline||S.desig||'Add a professional headline')}</p><div class="fp-meta"><span>${ic('pin',13)}${esc(S.city||'Add location')}</span><span>${ic('cap',13)}${esc(S.high||'Add qualification')}</span><span>${ic('clock',13)}${m>=12?Math.floor(m/12)+'+ yrs':m+' mo'}</span></div></div></div>
 <div class="fp-hero-r"><div class="fp-ring" style="--p:${c.p}"><span>${c.p}%</span></div><div><b>Profile strength</b><small>${miss?'Complete: '+miss[0]:nx?'Next: '+nx[0]:'Looking great!'}</small></div></div>
 <div class="fp-steps">${c.req.map(x=>`<span class="st ${x[1]?'ok':'no'}">${ic(x[1]?'check':'circle',13)}<span>${x[0]}</span></span>`).join('')}${c.rec.map(x=>`<span class="st rec ${x[1]?'ok':''}" ${x[1]?'':`data-go="${x[2]}"`}>${ic(x[1]?'check':'plus',13)}<span>${x[1]?cap(x[0].replace(/^Add /,'')):x[0]}</span></span>`).join('')}</div></div>`}
function shell(){
 $('#fpRoot').innerHTML=`<div id="fpHero"></div><div class="fp-wrap"><nav class="fp-nav" id="fpNav">${SEC.map((s,i)=>`<button data-go="${i}"><span class="n">${ic(ICON[i],14)}</span>${s}<em>${ic('check',14)}</em></button>`).join('')}</nav><div>${SEC.map((s,i)=>`<section class="fp-sec" data-i="${i}"><header data-go="${i}" data-tog="1" role="button" tabindex="0" aria-expanded="${i===S.open}"><span class="fp-hl">${ic(ICON[i],15)}${s}</span></header><div class="fp-body"></div></section>`).join('')}</div></div>`;
 SEC.forEach((_,i)=>renderSec(i));paint()}
function renderSec(i){const b=$(`.fp-sec[data-i="${i}"] .fp-body`);if(!b)return;b.innerHTML=R[i]()+(i<11?`<div class="fp-actions"><button type="button" class="fp-btn" data-back>Back</button><div><button type="button" class="fp-btn" data-act="draft" data-sv>Save</button><button type="button" class="fp-btn" data-next>Next</button><button type="button" class="fp-btn pri" data-act="save" data-sv>Save & Continue</button></div></div>`:'');if(i===0)ageUpd();a11y(b)}
function paint(){$$('.fp-sec').forEach(s=>s.classList.toggle('open',+s.dataset.i===S.open));$$('#fpNav button').forEach((b,i)=>{b.classList.toggle('on',i===S.open);b.classList.toggle('done',!!S.done[i]&&i!==S.open)});$('#fpHero').innerHTML=S.open===11?'':heroHTML();try{window.dispatchEvent(new Event('fp:paint'))}catch(e){}}
function go(i){S.open=Math.max(0,Math.min(11,i));renderSec(S.open);paint();const el=$(`.fp-sec[data-i="${S.open}"]`);const sc=$('.fp-wrap>div');if(window.matchMedia('(min-width:900px)').matches&&sc){sc.scrollTop=0;const nb=$(`#fpNav button[data-go="${S.open}"]`);if(nb&&nb.scrollIntoView)nb.scrollIntoView({block:'nearest'})}else if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
window.FP={go:function(i){go(i)},sections:SEC,open:function(){return S.open}};
function ageUpd(){const e=$('#fpAge');if(!e)return;const a=age(S.dob);e.style.display=a===null?'none':'inline-block';e.textContent='Age: '+a+' years'}
function toast(t,ok,bad){const d=document.createElement('div');d.className='fp-toast'+(bad?' bad':'');d.setAttribute('role',bad?'alert':'status');d.innerHTML=(ok?ic('check',14):bad?ic('alert',14):'')+esc(t);document.body.appendChild(d);setTimeout(()=>d.remove(),bad?5000:2500)}
/* validation */
function check(el){const r=el.dataset.v,v=el.value.trim();let m='';
 if(r==='req'&&!v)m='This field is required.';
 else if(r==='dob'){if(!v)m='This field is required.';else if(age(v)===null)m='Please enter a valid date of birth.'}
 else if(r==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))m=v?'Please enter a valid email address.':'This field is required.';
 else if(r==='phone'&&!/^\+?\d[\d\s-]{7,18}$/.test(v))m=v?'Please enter a valid phone number.':'This field is required.';
 else if(r==='year'&&v&&!/^(19|20)\d{2}$/.test(v))m='Enter a valid 4-digit year.';
 else if(r==='pin'&&!/^\d{6}$/.test(v))m=v?'Enter a valid 6-digit PIN code.':'This field is required.';
 else if(r==='url'&&v&&!/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v))m='Please enter a valid website URL.';
 el.classList.toggle('bad',!!m);el.setAttribute('aria-invalid',m?'true':'false');const e=el.closest('.fp-f')&&el.closest('.fp-f').querySelector('[data-e]');if(e)e.textContent=m;return!m}
function checkSec(){let ok=true,first=null;$$(`.fp-sec.open [data-v]`).forEach(e=>{if(e.disabled)return;if(!check(e)){ok=false;first=first||e}});if(first)first.focus();return ok}
/* events */
document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#fpRoot'))return;
 if(t.matches('.fp-ms input')){msOpen(t.closest('.fp-ms'),t.value);return}
 const k=t.dataset.k;if(!k||t.type==='radio'||t.type==='checkbox')return;set(k,t.value);
 if(k==='dob'){ageUpd();if(t.value.length===2||t.value.length===5){}}
 clearTimeout(window._fh);window._fh=setTimeout(()=>{$('#fpHero').innerHTML=S.open===11?'':heroHTML()},250)});
document.addEventListener('focusout',e=>{const t=e.target;if(t.dataset&&t.dataset.v&&t.closest('#fpRoot'))check(t)});
document.addEventListener('change',e=>{const t=e.target;if(!t.closest||!t.closest('#fpRoot'))return;
 if(t.type==='file'){upload(t);return}
 const k=t.dataset.k;if(!k)return;set(k,t.type==='checkbox'?t.checked:t.value);
 if(t.type==='checkbox'&&/\.cur$/.test(k)){const i=+k.split('.')[1];if(t.checked)S.jobs[i].end='';}
 if(t.dataset.re==='edu'){$('#fpEdu').innerHTML=(EDU[S.high]||[]).map(eduBlock).join('');}
 if(t.dataset.re==='jobs'){$('#fpJobs').innerHTML=jobsHTML()}
 paint()});
function upload(inp){const p=inp.dataset.p,f=inp.files[0];if(f)uploadFile(p,f)}
function msOpen(box,q){let dd=$('.fp-dd',box);if(!dd){dd=document.createElement('div');dd.className='fp-dd';box.appendChild(dd)}
 const p=box.dataset.ms,sel=get(p)||[],all=OPT[box.dataset.opts];q=(q||'').toLowerCase();const l=all.filter(x=>x.toLowerCase().includes(q));
 dd.innerHTML=l.length?l.map(x=>`<div data-opt="${esc(x)}" class="${sel.includes(x)?'sel':''}">${sel.includes(x)?ic('check',12):''}${esc(x)}</div>`).join(''):`<em>No match</em>`}
function msRefresh(box){const p=box.dataset.ms;const n=document.createElement('div');n.innerHTML=MS(p,box.dataset.opts);box.replaceWith(n.firstChild);}
document.addEventListener('click',e=>{const t0=e.target;if(!t0.closest)return;const t=t0.closest('[data-opt],[data-rm],[data-pick],[data-del],[data-act],[data-next],[data-back],[data-go]')||t0;const root=t.closest('#fpRoot');
 if(!root){$$('.fp-dd').forEach(d=>d.remove());return}
 const box=t.closest('.fp-ms');
 if(t.dataset.opt!==undefined&&box){const p=box.dataset.ms,a=get(p)||[],v=t.dataset.opt;set(p,a.includes(v)?a.filter(x=>x!==v):[...a,v]);msRefresh(box);const nb=$(`.fp-ms[data-ms="${p}"]`);if(p==='levels'){renderSec(4);}paint();$('input',nb).focus();return}
 if(t.dataset.rm!==undefined&&box){const p=box.dataset.ms;set(p,(get(p)||[]).filter(x=>x!==t.dataset.rm));msRefresh(box);if(p==='levels')renderSec(4);paint();return}
 if(box){$('input',box).focus();msOpen(box,'');return}
 $$('.fp-dd').forEach(d=>d.remove());
 const b=t.closest('[data-go]');if(b){if(b.dataset.tog&&+b.dataset.go===S.open){S.open=-1;paint()}else go(+b.dataset.go);return}
 if(t.matches('[data-next]')){go(S.open+1);return}if(t.matches('[data-back]')){go(S.open-1);return}
 if(t.dataset.pick){const i=document.createElement('input');i.type='file';i.accept=RULES[kindOf(t.dataset.pick)].ext.map(x=>'.'+x).join(',');i.dataset.p=t.dataset.pick;i.style.display='none';root.appendChild(i);i.onchange=()=>{upload(i);i.remove()};i.click();return}
 if(t.dataset.del){removeFile(t.dataset.del);return}
 const a=t.dataset.act;if(!a)return;const [x,y]=a.split(':');
 if(x==='draft'){saveProfile();return}
 if(x==='save'){if(!checkSec()){toast('Please fix the highlighted fields',0,1);return}const sec=S.open,had=S.done[sec];S.done[sec]=1;saveProfile(true).then(ok=>{if(ok)go(sec+1);else{if(!had)delete S.done[sec];paint()}});return}
 if(x==='retry'){retryLoad();return}
 if(x==='discard'){if(confirm('Discard all unsaved changes?')){load();shell();toast('Changes discarded',1)}return}
 if(x==='addjob'){S.jobs.push({org:'',desig:'',dept:'',type:'',level:'',subs:[],start:'',end:'',cur:false,docs:{}});$('#fpJobs').innerHTML=jobsHTML();return}
 if(x==='rmjob'){if(!confirm('Remove this employment entry and its uploaded documents?'))return;dropFiles(+y,/^j(\d+)(exp|app|rel)$/).then(()=>{S.jobs.splice(+y,1);$('#fpJobs').innerHTML=jobsHTML();paint()});return}
 if(x==='addtq'){const v=$('#fpTqSel').value;if(!v)return;S.tq.push({name:v});$('#fpTq').innerHTML=S.tq.map(tqCard).join('');return}
 if(x==='rmtq'){if(!confirm('Remove this qualification and its uploaded certificate?'))return;dropFiles(+y,/^tq(\d+)()$/).then(()=>{S.tq.splice(+y,1);renderSec(4);paint()});return}
 if(x==='addlink'){const u=$('#fpLu');u.dataset.v='url';const bad=!u.value.trim()?(u.classList.add('bad'),u.nextElementSibling.textContent='This field is required.',1):!check(u);if(bad)return;S.links.push({t:$('#fpLt').value,u:u.value.trim()});$('#fpLinks').innerHTML=linksHTML();u.value='';paint();toast('Link added',1);return}
 if(x==='rmlink'){if(!confirm('Remove this link?'))return;S.links.splice(+y,1);$('#fpLinks').innerHTML=linksHTML();paint();return}
 if(x==='editlink'){const l=S.links.splice(+y,1)[0];$('#fpLinks').innerHTML=linksHTML();$('#fpLt').value=l.t;$('#fpLu').value=l.u;$('#fpLu').focus();paint();return}
});

/* ---------- real data: load / save / upload / sync ---------- */
const PERSIST=()=>{const o=JSON.parse(JSON.stringify(S));delete o.open;delete o.email;const f={};Object.keys(o.files||{}).forEach(k=>{if(k!=='photo'&&o.files[k]&&o.files[k].id)f[k]={id:o.files[k].id,name:o.files[k].name,size:o.files[k].size,url:o.files[k].url||''}});o.files=f;return o};
const snap=()=>JSON.stringify(PERSIST()),dirty=()=>snap()!==SAVED;
const isoDob=d=>{const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d||'');return m?`${m[3]}-${m[2]}-${m[1]}`:''};
const PLACEHOLDER=u=>!u||u.indexOf('data:')===0;
function load(){const U=currentUser||{};S=Object.assign(blank(),JSON.parse(JSON.stringify(U.fp||{})));S.open=0;
 S.email=U.email||'';S.phone=U.phone||'';
 if(!S.first&&!S.last&&U.name){const tm=/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i.exec(U.name);if(tm&&!S.title)S.title=({dr:'Dr.',prof:'Prof.',mr:'Mr.',ms:'Ms.',mrs:'Mrs.'})[tm[1].toLowerCase()];const n=U.name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i,'').trim().split(/\s+/);S.first=n.shift()||'';S.last=n.join(' ')}
 if(!S.dob&&/^\d{4}-\d{2}-\d{2}$/.test(U.dob||'')){const q=U.dob.split('-');S.dob=q[2]+'/'+q[1]+'/'+q[0]}
 if(!S.city&&U.city)S.city=U.city;if(!S.state&&U.state)S.state=U.state;if(!S.desig&&U.currentDesignation)S.desig=U.currentDesignation;
 if(!PLACEHOLDER(U.avatar))S.files.photo={name:'Profile photo',url:U.avatar};
 {const sf=window.bkServerFiles||{};if(!S.files.resume&&sf.resume&&sf.resume.id)S.files.resume={id:sf.resume.id,name:sf.resume.original_name||'Resume',size:'',url:sf.resume.url||''}}
 ['journal','patent','conf','book','chapter','other'].forEach(c=>{if(!S.research||typeof S.research!=='object')S.research={};if(!Array.isArray(S.research[c]))S.research[c]=[]});
 ['resumes','cvs','editions'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]});
 if(S.files.resume&&S.files.resume.id&&!S.resumes.some(x=>x.fid===S.files.resume.id)&&S.resumes.length<5){const f=S.files.resume,id=uidR();S.resumes.push({id,kind:'file',name:f.name||'Resume',size:f.size||'',url:f.url||'',fid:f.id});if(!S.resumePub){S.resumePub=id;if(!S.resumeSel)S.resumeSel=id}}
 SAVED=snap()}
function avatarHTML(){const f=S.files.photo,ini=esc((S.first[0]||'')+(S.last[0]||'')||'?');return `<div class="fp-av lg">${f&&f.url?`<img src="${esc(f.url)}" alt="">`:ini}</div>`}
function bannerHTML(){let h='';
 if(dirty())h+=`<div class="fp-banner warn" role="status"><div><b>Unsaved changes</b></div><div><button type="button" class="fp-btn" data-act="discard">Discard</button> <button type="button" class="fp-btn pri" data-act="draft" data-sv>Save now</button></div></div>`;return h}
function setBusy(on){ST.saving=on;$$('#fpRoot [data-sv]').forEach(b=>{b.disabled=on;b.setAttribute('aria-busy',on?'true':'false')})}
const KEYS=['name','phone','gender','dob','city','state','location','currentDesignation','experience','avatar','fp'];
function applyToUser(){const U=currentUser,m=months();
 U.name=[S.title,S.first,S.middle,S.last].filter(Boolean).join(' ')||U.name;U.phone=S.phone;U.gender=S.gender;U.dob=isoDob(S.dob);U.city=S.city;U.state=S.state;
 U.location=[S.city,S.state].filter(Boolean).join(', ');U.currentDesignation=S.desig;U.experience=String(Math.round(m/12*10)/10);S.savedAt=S.savedAt||new Date().toISOString();U.fp=PERSIST()}
function softCheck(){const bad=[];if(S.phone&&!/^\+?\d[\d\s-]{7,18}$/.test(S.phone))bad.push('Enter a valid phone number.');if(S.dob&&age(S.dob)===null)bad.push('Enter a valid date of birth (DD/MM/YYYY).');return bad}
function showServerErrors(e){const er=e&&e.errors;if(er){const map={phone:'phone',date_of_birth:'dob',name:'first',gender:'gender'};Object.keys(er).forEach(k=>{const f=map[k]&&$(`[data-k="${map[k]}"]`);if(f){f.classList.add('bad');const x=f.closest('.fp-f')&&f.closest('.fp-f').querySelector('[data-e]');if(x)x.textContent=String([].concat(er[k])[0])}})}}
function refreshChrome(){try{if(typeof refreshDashTopAccount==='function')refreshDashTopAccount();if(typeof updateNavForLogin==='function')updateNavForLogin()}catch(e){}paint()}
async function saveProfile(validated){if(ST.saving)return false;const bad=softCheck();if(bad.length){toast(bad[0],0,1);return false}
 const U=currentUser,prev={};KEYS.forEach(k=>prev[k]=U[k]===undefined?undefined:JSON.parse(JSON.stringify(U[k])));
 setBusy(true);
 try{applyToUser();await window.bkSaveSeekerProfile();SAVED=snap();refreshChrome();toast('Profile saved',1);return true}
 catch(e){KEYS.forEach(k=>{if(prev[k]===undefined)delete U[k];else U[k]=prev[k]});S.savedAt=U.fp&&U.fp.savedAt||'';showServerErrors(e);
  toast(e&&e.status===0?'Could not reach the server. Your changes are still on this page — try again.':'Could not save: '+((e&&e.message)||'unknown error'),0,1);return false}
 finally{setBusy(false);paint()}}
function checkFile(p,f){const r=RULES[kindOf(p)],ext=(f.name.split('.').pop()||'').toLowerCase();if(f.name.indexOf('.')<0||r.ext.indexOf(ext)<0)return 'Unsupported file type. Accepted: '+r.label.split(' · ')[0]+'.';if(f.size>r.mb*1048576)return 'File exceeds the '+r.mb+' MB limit.';if(f.size===0)return 'This file is empty.';return''}
const DOCNAME=p=>({resume:'Resume',phdcert:'Ph.D. certificate',ugcert:"Bachelor's certificate",pgcert:"Master's certificate",mphilcert:'M.Phil certificate',dipcert:'Diploma certificate',othcert:'Certificate'}[p]||(/^tq/.test(p)?'Teaching qualification certificate':/^j\d/.test(p)?'Employment document':'Document'));
function paintUp(p,msg){const box=$(`.fp-up[data-up="${p}"]`);if(!box)return;box.classList.toggle('has',!!S.files[p]);box.classList.toggle('bad',!!msg);box.innerHTML=msg?`<span class="nm" role="alert" style="color:#B42318">${esc(msg)}</span><button type="button" class="fp-btn sm" data-pick="${p}">Try again</button>`:UPin(p);paint()}
async function uploadFile(p,f){if(ST.busy[p]||ST.saving)return;const m=checkFile(p,f);if(m){paintUp(p,m);return}
 const k=kindOf(p),fd=new FormData(),prev=S.files[p];fd.append('file',f,f.name);let path;
 if(k==='photo'){path='/files/upload';fd.append('category','profile_photo')}else if(k==='resume'){path='/candidate/resume'}else{path='/candidate/certificates';fd.append('name',DOCNAME(p))}
 ST.busy[p]=1;paintUp(p);
 try{const d=await api.post(path,fd),file=d&&d.file?d.file:d;if(!file||!file.id)throw new Error('The server did not confirm the upload.');
  if(k==='photo'&&!file.url)throw new Error('Photo stored, but the server has no public file URL configured (AWS_URL), so it cannot be shown.');
  S.files[p]={id:file.id,name:file.original_name||f.name,size:(f.size/1048576).toFixed(1),url:file.url||''};
  if(k!=='photo'&&prev&&prev.id&&prev.id!==file.id){try{await api.del('/files/'+prev.id)}catch(e){}} /* old file is removed, not orphaned */
  delete ST.busy[p];paintUp(p);
  if(k==='photo'){currentUser.avatar=file.url;if(typeof saveState==='function')saveState();refreshChrome();toast('Photo updated',1)}
  else if(await saveProfile())toast('File uploaded',1);else toast('File uploaded, but the profile was not saved. Press Save.',0,1)}
 catch(e){delete ST.busy[p];if(prev)S.files[p]=prev;else delete S.files[p];paintUp(p,(e&&e.message)||'Upload failed. Please try again.')}}
async function removeFile(p){const f=S.files[p];if(!f||ST.busy[p]||ST.saving)return;if(!confirm('Remove this file?'))return;ST.busy[p]=1;paintUp(p);
 try{if(p==='photo'){await api.del('/candidate/profile/photo');currentUser.avatar=(typeof DEFAULT_USER!=="undefined"?DEFAULT_USER.avatar:"")||'';delete S.files.photo;if(typeof saveState==='function')saveState();delete ST.busy[p];paintUp(p);refreshChrome();toast('Photo removed',1)}
  else{if(f.id)await api.del('/files/'+f.id);delete S.files[p];delete ST.busy[p];paintUp(p);if(await saveProfile())toast('File removed',1)}}
 catch(e){delete ST.busy[p];paintUp(p);toast('Could not remove the file: '+((e&&e.message)||'error'),0,1)}}
async function dropFiles(i,re){const ks=Object.keys(S.files),out={};for(const k of ks){const m=re.exec(k);if(!m){out[k]=S.files[k];continue}const n=+m[1];if(n===i){const f=S.files[k];if(f&&f.id){try{await api.del('/files/'+f.id)}catch(e){}}}else if(n>i){out[k.replace(/\d+/,n-1)]=S.files[k]}else out[k]=S.files[k]}S.files=out}
let uidN=0;function a11y(root){$$('.fp-f',root).forEach(f=>{const l=$('label',f),c=$('input:not([type=radio]):not([type=checkbox]):not([type=file]),select,textarea',f);if(!l||!c)return;if(!c.id)c.id='fpc'+(++uidN);l.htmlFor=c.id;const e=$('[data-e]',f);if(e){e.id=c.id+'-e';e.setAttribute('role','alert');c.setAttribute('aria-describedby',e.id)}if(/Required/.test(l.textContent))c.setAttribute('aria-required','true')})}
window.addEventListener('beforeunload',e=>{if($('#fpRoot')&&$('#fpRoot').dataset.m&&dirty()){e.preventDefault();e.returnValue=''}});
document.addEventListener('keydown',e=>{const t=e.target;if(!t.closest||!t.closest('#fpRoot'))return;
 if(t.matches('header[data-tog]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();t.click();return}
 if(t.matches('.fp-ms input')){if(e.key==='Escape'){$$('.fp-dd').forEach(d=>d.remove())}if(e.key==='Enter'){e.preventDefault();const o=$('.fp-dd [data-opt]',t.closest('.fp-ms'));if(o)o.click()}}});
let _lastRefresh=Date.now();
window.addEventListener('focus',async()=>{const r=$('#fpRoot');if(!r||!r.dataset.m||dirty()||ST.saving||Object.keys(ST.busy).length||Date.now()-_lastRefresh<30000||!window.bkRefreshSeeker)return;_lastRefresh=Date.now();
 try{await bkRefreshSeeker();const before=SAVED,o=S.open;load();if(SAVED!==before){S.open=o;shell();refreshChrome()}}catch(e){}});
async function retryLoad(){const r=$('#fpRoot');r.innerHTML='<div class="fp-empty" role="status">Loading your profile…</div>';try{await bkRefreshSeeker();delete r.dataset.m;window.bkProfileLoaded=true;fpMount()}catch(e){errView(r,e)}}
function errView(r,e){r.innerHTML=`<div class="fp-banner warn" role="alert"><div><b>We couldn't load your profile</b><div class="fp-hint">${esc((e&&e.message)||window.bkProfileError||'Unknown error')}${e&&e.status?' (HTTP '+e.status+')':''}. Nothing has been changed.</div></div><button type="button" class="fp-btn pri" data-act="retry">Retry</button></div>`}

/* ---------- Add Resume (resume / CV boxes + editions) ---------- */
const uidR=()=>'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const SELK=k=>k==='resumes'?'resumeSel':'cvSel', PUBK=k=>k==='resumes'?'resumePub':'cvPub', RSE={};
function pubItem(k){return S[k].find(x=>x.id===S[PUBK(k)])||null}
function syncResume(){const it=pubItem('resumes');if(it&&it.kind==='file'&&it.fid)S.files.resume={id:it.fid,name:it.name,size:it.size,url:it.url};else delete S.files.resume}
function pvItem(k,l){const it=pubItem(k);if(!it)return '';return it.kind==='file'?`<div class="fp-pv-file">${ic('file',16)}<div><b>${l}</b><small>${esc(it.name)}${szt(it)}</small></div>${it.url?`<a href="${esc(it.url)}" target="_blank" rel="noopener">View</a>`:''}</div>`:`<div class="fp-pv-file">${ic('link',16)}<div><b>${l}</b><small>${esc(it.name)}</small></div><a href="${esc(it.url)}" target="_blank" rel="noopener">Open</a></div>`}
function previewHTML(k){const it=S[k].find(x=>x.id===S[SELK(k)]);if(!it)return `<div class="fp-rs-pv empty">${ic('file',22)}<span>Select an item to preview it here.</span></div>`;
 const pub=S[PUBK(k)]===it.id,badge=`<span class="fp-pill ${pub?'p-ok':'p-pend'}">${pub?'Published on your profile':'Selected · not published yet'}</span>`;
 if(it.kind==='link')return `<div class="fp-rs-pv">${badge}<div class="fp-rs-card">${ic('link',26)}<b>${esc(it.name)}</b><small>${esc(it.url)}</small><a class="fp-btn sm" href="${esc(it.url)}" target="_blank" rel="noopener">Open link</a></div></div>`;
 const pdf=/\.pdf$/i.test(it.name)&&/^https?:/i.test(it.url||'');
 return `<div class="fp-rs-pv">${badge}${pdf?`<iframe src="${esc(it.url)}" title="Preview of ${esc(it.name)}"></iframe>`:`<div class="fp-rs-card">${ic('file',26)}<b>${esc(it.name)}</b><small>${esc(it.name.split('.').pop().toUpperCase())}${szt(it)}</small>${it.url?`<a class="fp-btn sm" href="${esc(it.url)}" target="_blank" rel="noopener">Open file</a>`:''}</div>`}</div>`}
function boxHTML(k){const T=k==='resumes'?'Resume':'CV',arr=S[k],sel=S[SELK(k)],pub=pubItem(k),busy=ST.busy['rs_'+k],ed=RSE[k],full=arr.length>=5&&!ed;
 const list=arr.length?arr.map(x=>`<label class="fp-rs-it ${x.id===sel?'on':''}"><input type="radio" name="rs_${k}" data-ra="sel:${k}:${x.id}" ${x.id===sel?'checked':''}><span class="nm"><b>${esc(x.name)}</b><small>${x.kind==='file'?'File'+szt(x):'Link'}${x.id===S[PUBK(k)]?' · Published':''}</small></span><span class="acts"><button type="button" class="fp-btn sm" data-ra="upd:${k}:${x.id}">Update</button><button type="button" class="fp-btn sm dng" data-ra="del:${k}:${x.id}">Remove</button></span></label>`).join(''):`<div class="fp-empty">No ${T} added yet.</div>`;
 const add=full?`<div class="fp-hint">Maximum of 5 reached. Remove one to add another.</div>`:`<div class="fp-rs-add"><div class="fp-rs-up"><button type="button" class="fp-btn pri" data-ra="pick:${k}" ${busy?'disabled':''}>${ic('plus',13)}${busy?'Uploading… please wait':'Upload file'}</button><span class="fp-hint">PDF, DOC, DOCX · Max 5 MB</span></div>
  <div class="fp-grid"><div class="fp-f"><label>Link name</label><input class="fp-in" id="rsn_${k}" placeholder="e.g. Google Drive ${T}"></div><div class="fp-f"><label>Link</label><input class="fp-in" id="rsu_${k}" placeholder="https://…"><div class="fp-err" data-e></div></div></div>
  <button type="button" class="fp-btn" data-ra="addlink:${k}">${ed?'Save link':'Add link'}</button>${ed?` <button type="button" class="fp-btn" data-ra="canc:${k}">Cancel</button>`:''}</div>`;
 return `<div class="fp-card fp-rs-box" data-box="${k}"><h4>${k==='resumes'?'1. Resume':'2. CV'} ${tag('rec')}<small class="fp-hint" style="margin-left:auto">${arr.length}/5 added</small></h4>
  <div class="fp-rs-grid"><div class="fp-rs-l">${list}${add}</div><div class="fp-rs-r">${previewHTML(k)}</div></div>
  <div class="fp-rs-pub"><button type="button" class="fp-btn pri" data-ra="publish:${k}" ${sel&&sel!==S[PUBK(k)]?'':'disabled'}>Publish selected ${T}</button><span class="fp-hint">${pub?`Showing on your profile: <b>${esc(pub.name)}</b>`:'Nothing published yet.'}</span></div></div>`}
function rsBoxPaint(k){const el=$(`[data-box="${k}"]`);if(el){const n=document.createElement('div');n.innerHTML=boxHTML(k);el.replaceWith(n.firstChild)}paint()}
function edHTML(){return `<div class="fp-card" id="fpEd"><h4>3. Editions ${tag('opt')}</h4><div id="fpEdRows">${edRows()}</div><div class="fp-rs-pub"><button type="button" class="fp-btn" data-ra="edadd">${ic('plus',13)}Add edition</button><button type="button" class="fp-btn pri" data-ra="edsave">Save</button></div></div>`}
function edRows(){return S.editions.length?S.editions.map((x,i)=>`<div class="fp-rs-ed"><div class="fp-grid">${F('Name',0,I(`editions.${i}.name`,{ph:'e.g. 2nd Edition, 2024'}))}${F('Link',0,I(`editions.${i}.url`,{v:'url',ph:'https://'}))}</div><button type="button" class="fp-btn sm dng" data-ra="edrm:${i}">Remove</button></div>`).join(''):`<div class="fp-empty">No editions added yet.</div>`}
function edPaint(){const r=$('#fpEdRows');if(r){r.innerHTML=edRows();a11y(r)}paint()}
async function rsUpload(k,f,slot){const bk='rs_'+k;if(ST.busy[bk]||ST.saving)return;const m=checkFile('resume',f);if(m){toast(m,0,1);return}
 const fd=new FormData();fd.append('file',f,f.name);fd.append('name',k==='cvs'?'CV':'Resume');ST.busy[bk]=1;rsBoxPaint(k);
 try{const d=await api.post('/candidate/certificates',fd),file=d&&d.file?d.file:d;if(!file||!file.id)throw new Error('The server did not confirm the upload.');
  const it={id:slot||uidR(),kind:'file',name:file.original_name||f.name,size:(f.size/1048576).toFixed(1),url:file.url||'',fid:file.id},arr=S[k],ix=arr.findIndex(x=>x.id===it.id);let old=null;
  if(ix>=0){old=arr[ix];arr[ix]=it}else{arr.push(it);if(!S[SELK(k)])S[SELK(k)]=it.id}
  if(old&&old.fid){try{await api.del('/files/'+old.fid)}catch(e){}}
  delete ST.busy[bk];if(k==='resumes')syncResume();rsBoxPaint(k);if(await saveProfile())toast('File uploaded',1);else toast('File uploaded, but the profile was not saved. Press Save.',0,1)}
 catch(e){delete ST.busy[bk];rsBoxPaint(k);toast((e&&e.message)||'Upload failed. Please try again.',0,1)}}
function rsPick(k,slot){if(!slot&&S[k].length>=5){toast('You can add up to 5 items.',0,1);return}const i=document.createElement('input');i.type='file';i.accept=RULES.resume.ext.map(x=>'.'+x).join(',');i.style.display='none';document.body.appendChild(i);i.onchange=()=>{if(i.files[0])rsUpload(k,i.files[0],slot);i.remove()};i.click()}
document.addEventListener('change',e=>{const t=e.target;if(!t.matches||!t.matches('input[data-ra^="sel:"]'))return;const[,k,id]=t.dataset.ra.split(':');S[SELK(k)]=id;rsBoxPaint(k)});
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-ra]');if(!b||!b.closest('#fpRoot')||b.matches('input'))return;const[a,x,y]=b.dataset.ra.split(':');
 if(a==='pick'){rsPick(x);return}
 if(a==='upd'){const it=S[x].find(z=>z.id===y);if(!it)return;if(it.kind==='file'){rsPick(x,y)}else{RSE[x]=y;rsBoxPaint(x);$('#rsn_'+x).value=it.name;$('#rsu_'+x).value=it.url;$('#rsu_'+x).focus()}return}
 if(a==='canc'){delete RSE[x];rsBoxPaint(x);return}
 if(a==='addlink'){const n=$('#rsn_'+x),u=$('#rsu_'+x);u.dataset.v='url';const e2=u.nextElementSibling;if(!u.value.trim()){u.classList.add('bad');e2.textContent='This field is required.';return}if(!check(u))return;
  const url=u.value.trim(),name=n.value.trim()||url.replace(/^https?:\/\//,'').slice(0,60);
  if(RSE[x]){const it=S[x].find(z=>z.id===RSE[x]);if(it){it.name=name;it.url=url}delete RSE[x]}else{if(S[x].length>=5){toast('You can add up to 5 items.',0,1);return}const id=uidR();S[x].push({id,kind:'link',name,url});if(!S[SELK(x)])S[SELK(x)]=id}
  if(x==='resumes')syncResume();rsBoxPaint(x);if(await saveProfile())toast('Link saved',1);return}
 if(a==='del'){const it=S[x].find(z=>z.id===y);if(!it||!confirm('Remove "'+it.name+'"?'))return;
  if(it.fid){try{await api.del('/files/'+it.fid)}catch(er){}}
  S[x]=S[x].filter(z=>z.id!==y);if(S[SELK(x)]===y)S[SELK(x)]=(S[x][0]||{}).id||'';if(S[PUBK(x)]===y)S[PUBK(x)]='';if(RSE[x]===y)delete RSE[x];
  if(x==='resumes')syncResume();rsBoxPaint(x);if(await saveProfile())toast('Removed',1);return}
 if(a==='publish'){const prev=S[PUBK(x)];S[PUBK(x)]=S[SELK(x)];if(x==='resumes')syncResume();rsBoxPaint(x);
  if(await saveProfile()){const it=pubItem(x);toast('Published: '+(it?it.name:''),1)}else{S[PUBK(x)]=prev;if(x==='resumes')syncResume();rsBoxPaint(x)}return}
 if(a==='edadd'){S.editions.push({name:'',url:''});edPaint();const r=$$('#fpEdRows input');if(r.length)r[r.length-2].focus();return}
 if(a==='edrm'){S.editions.splice(+x,1);edPaint();return}
 if(a==='edsave'){let ok=true;S.editions=S.editions.filter(z=>z.name.trim()||z.url.trim());edPaint();
  $$('#fpEdRows [data-v]').forEach(i=>{if(!check(i))ok=false});
  S.editions.forEach((z,i)=>{if(z.url.trim()&&!z.name.trim()){ok=false;const f=$$('#fpEdRows .fp-rs-ed')[i].querySelector('input');f.classList.add('bad');f.closest('.fp-f').querySelector('[data-e]').textContent='Add a name for this link.'}});
  if(!ok){toast('Please fix the highlighted fields',0,1);return}
  if(await saveProfile())toast('Editions saved',1);return}
 if(a==='tab'){ST.rtab=x;rsTabs();$('#fpRsBody').innerHTML=rsBody();a11y($('#fpRsBody'));return}
 if(a==='radd'){S.research[x].push({status:'Pending Verification'});$('#fpRsBody').innerHTML=rsBody();a11y($('#fpRsBody'));rsLive();const c=$$('#fpRsBody .fp-rs-rec');if(c.length)c[c.length-1].scrollIntoView({block:'nearest'});return}
 if(a==='rrm'){const r=S.research[x][+y];if(!confirm('Delete this record?'))return;S.research[x].splice(+y,1);$('#fpRsBody').innerHTML=rsBody();a11y($('#fpRsBody'));rsLive();return}
});

/* ---------- Research (individual records, automatic totals) ---------- */
const RS={
 journal:{label:'Journal Publications',one:'Journal publication',tot:'Total Journal Publications',note:'SCI, SCIE and ESCI are Web of Science Core Collection categories; "Web of Science" is a broader label. Pick SCI / SCIE / ESCI only after verifying the journal.',f:[
  {k:'name',l:'Journal name'},{k:'title',l:'Article / publication title'},{k:'doi',l:'DOI',h:'DOI or DOI link'},{k:'year',l:'Publication year',t:'year'},
  {k:'idx',l:'Indexed in',t:'ms',o:'idxJ'},{k:'q',l:'Quartile',t:'sel',o:'qrt'},{k:'qsrc',l:'Quartile source & year',h:'Database / ranking source and year used for the quartile'},{k:'pos',l:'Author position',t:'sel',o:'pos'},{k:'url',l:'Publication link',t:'url'}]},
 patent:{label:'Patents',one:'Patent',tot:'Total Patents',note:'Published and Granted are different stages. A published patent is not necessarily granted.',f:[
  {k:'title',l:'Title of patent'},{k:'no',l:'Patent / application number'},{k:'ptype',l:'Patent type',t:'sel',o:'ptype'},{k:'status',l:'Patent status',t:'sel',o:'pstat'},
  {k:'date',l:'Filing / publication / grant date',t:'date'},{k:'country',l:'Country / patent office'},{k:'url',l:'Patent verification link',t:'url'}]},
 conf:{label:'Conference Publications',one:'Conference publication',tot:'Total Conference Publications',note:'Use SCI / SCIE / ESCI only when the proceedings are verifiably covered. Quartile applies only where the source has a verifiable quartile. A presentation is not the same as a published paper.',f:[
  {k:'ctype',l:'Conference type',t:'sel',o:'ctype'},{k:'name',l:'Conference name'},{k:'title',l:'Paper / publication title'},{k:'doi',l:'DOI',h:'DOI or DOI link'},{k:'year',l:'Publication year',t:'year'},
  {k:'idx',l:'Indexed in',t:'ms',o:'idxC'},{k:'q',l:'Quartile',t:'sel',o:'qrt'},{k:'pos',l:'Author position',t:'sel',o:'pos'},{k:'url',l:'Proceedings / paper link',t:'url'}]},
 book:{label:'Books',one:'Book',tot:'Total Books',note:'',f:[
  {k:'title',l:'Book title'},{k:'btype',l:'Book type',t:'sel',o:'btype'},{k:'isbn',l:'ISBN'},{k:'issn',l:'ISSN',h:'Optional, where applicable'},
  {k:'pub',l:'Publisher name'},{k:'pubd',l:'Publisher details / website'},{k:'year',l:'Publication year',t:'year'},{k:'idx',l:'Indexed in',t:'ms',o:'idxB'},{k:'doi',l:'DOI',h:'Optional'}]},
 chapter:{label:'Book Chapters',one:'Book chapter',tot:'Total Book Chapters',note:'',f:[
  {k:'title',l:'Chapter title'},{k:'book',l:'Published book title'},{k:'doi',l:'DOI',h:'DOI or DOI link'},{k:'isbn',l:'ISBN'},
  {k:'ps',l:'Start page'},{k:'pe',l:'End page'},{k:'pub',l:'Publisher name'},{k:'year',l:'Publication year',t:'year'},{k:'pos',l:'Author position',t:'sel',o:'pos'},{k:'url',l:'Book / chapter link',t:'url'}]},
 other:{label:'Cutting-Edge Articles',one:'Article',tot:'Total Cutting-Edge Articles',note:'Magazine articles and blogs are not counted as peer-reviewed research publications. They are kept separate from research metrics.',f:[
  {k:'ctype',l:'Contribution type',t:'sel',o:'otype'},{k:'title',l:'Article title'},{k:'name',l:'Publication / magazine / website name'},{k:'doi',l:'DOI',h:'Optional'},
  {k:'date',l:'Publication date',t:'date'},{k:'pos',l:'Author position',t:'sel',o:'pos'},{k:'url',l:'Article URL',t:'url'},{k:'pub',l:'Publisher / organization'},{k:'ev',l:'Evidence link',t:'url',h:'Optional link to supporting evidence'}]}};
const RSK=Object.keys(RS);
const cnt=c=>S.research[c].filter(r=>r&&String(r.title||'').trim()).length;
function rsTotal(){return RSK.reduce((a,c)=>a+cnt(c),0)}
function idxGroups(r){const g=new Set();(r.idx||[]).forEach(x=>{if(x==='Scopus + WoS'){g.add('Scopus');g.add('Web of Science (WoS)')}else if(x==='UGC-CARE')g.add('UGC');else g.add(x)});return g}
function dupMap(){const g={},out={};const add=(sc,v,c,i)=>{v=String(v||'').trim();if(!v)return;const k=sc+'|'+v;(g[k]=g[k]||[]).push([c,i])};
 const doi=v=>String(v||'').toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//,'').trim(),isbn=v=>String(v||'').replace(/[^0-9xX]/g,'').toLowerCase();
 RSK.forEach(c=>S.research[c].forEach((r,i)=>{if(c!=='patent')add('doi',doi(r.doi),c,i);if(c==='patent')add('pat',String(r.no||'').toLowerCase().replace(/[\s-]/g,''),c,i);if(c==='book'||c==='chapter')add('isbn'+c,isbn(r.isbn),c,i)}));
 Object.keys(g).forEach(k=>{if(g[k].length<2)return;const w=k.indexOf('doi|')===0?'DOI':k.indexOf('pat|')===0?'patent number':'ISBN';g[k].forEach(([c,i])=>{const o=g[k].filter(z=>!(z[0]===c&&z[1]===i)).map(z=>RS[z[0]].one+' '+(z[1]+1)).join(', ');out[c+'.'+i]=`Possible duplicate: same ${w} as ${o}`})});return out}
function rsSumHTML(){const j=S.research.journal.concat(S.research.conf).filter(r=>String(r.title||'').trim());
 const gc={},q={Q1:0,Q2:0,Q3:0,Q4:0};let any=0,na=0;j.forEach(r=>{const g=idxGroups(r);g.forEach(x=>gc[x]=(gc[x]||0)+1);if([...g].some(x=>x!=='Non-Indexed'))any++;if(q[r.q]!==undefined)q[r.q]++;else na++});
 const chip=(a,b)=>`<span class="fp-chip">${esc(a)}: <b>${b}</b></span>`,order=['SCI','SCIE','ESCI','Scopus','Web of Science (WoS)','UGC','ABDC','Other Indexed','Non-Indexed'];
 return `<div class="fp-rs-stats">${RSK.map(c=>`<div class="fp-rs-stat"><b>${cnt(c)}</b><span>${RS[c].tot}</span></div>`).join('')}</div>
 <div class="fp-card" style="margin-top:12px"><h4>Research summary</h4><div class="fp-hint">Journal + conference records (${j.length}). Each record is counted once per index; "Scopus + WoS" counts under both. Cutting-Edge Articles are not included.</div>
 <div class="fp-chips" style="margin-top:8px">${chip('Indexed (any)',any)}${order.filter(x=>gc[x]).map(x=>chip(x,gc[x])).join('')}</div>
 <div class="fp-chips" style="margin-top:8px">${['Q1','Q2','Q3','Q4'].map(x=>chip(x,q[x])).join('')}${chip('Not applicable / not verified',na)}</div></div>`}
function rsTabs(){const e=$('#fpRsTabs');if(e)e.innerHTML=RSK.map(c=>`<button type="button" class="fp-rs-tab ${c===(ST.rtab||'journal')?'on':''}" data-ra="tab:${c}">${RS[c].label}<em>${cnt(c)}</em></button>`).join('')}
function rsLive(){const e=$('#fpRsSum');if(e)e.innerHTML=rsSumHTML();rsTabs();const d=dupMap();$$('[data-dup]').forEach(x=>{const m=d[x.dataset.dup];x.textContent=m||'';x.style.display=m?'inline-block':'none'})}
function rsFld(c,i,f){const p=`research.${c}.${i}.${f.k}`,t=f.t||'text';
 const inner=t==='sel'?SEL(p,OPT[f.o]):t==='ms'?MS(p,f.o,'Select indexing…'):t==='year'?I(p,{v:'year',ph:'YYYY'}):t==='url'?I(p,{v:'url',ph:'https://'}):t==='date'?I(p,{type:'date'}):I(p);
 return F(f.l,0,inner,{hint:f.h,full:t==='ms'})}
function rsRec(c,r,i){return `<div class="fp-card fp-rs-rec"><h4>${RS[c].one} ${i+1}<span class="fp-pill p-pend">${esc(r.status||'Pending Verification')}</span><span class="fp-rs-dup" data-dup="${c}.${i}" style="display:none"></span><button type="button" class="fp-btn sm dng" style="margin-left:auto" data-ra="rrm:${c}:${i}">Delete</button></h4><div class="fp-grid">${RS[c].f.map(f=>rsFld(c,i,f)).join('')}</div></div>`}
function rsBody(){const c=ST.rtab||'journal',a=S.research[c];return `${RS[c].note?`<div class="fp-note" style="margin-bottom:12px">${esc(RS[c].note)}</div>`:''}${a.length?a.map((r,i)=>rsRec(c,r,i)).join(''):`<div class="fp-empty">No ${RS[c].label.toLowerCase()} added yet.</div>`}<button type="button" class="fp-btn pri" data-ra="radd:${c}">${ic('plus',13)}Add ${RS[c].one.toLowerCase()}</button>`}
function rsHTML(){setTimeout(()=>{rsLive();const b=$('#fpRsBody');if(b)a11y(b)},0);return `<div class="fp-rs" id="fpRs"><h3 style="margin-top:26px">Research</h3><p class="fp-sub">Add each contribution as its own record. Totals are calculated automatically. Records start as Pending Verification.</p><div id="fpRsSum"></div><div class="fp-rs-tabs" id="fpRsTabs"></div><div id="fpRsBody">${rsBody()}</div></div>`}
function rsPv(){const l=RSK.filter(c=>cnt(c)).map(c=>`<div class="fp-pv-kv"><span>${RS[c].label}</span><b>${cnt(c)}</b></div>`).join('');return l}
['input','change','click'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.closest&&e.target.closest('#fpRs'))setTimeout(rsLive,0)}));

window.fpMount=async function(){const r=$('#fpRoot');if(!r||r.dataset.m)return;r.innerHTML='<div class="fp-empty" role="status">Loading your profile…</div>';
 try{if(window.bkHydrate)await bkHydrate()}catch(e){}
 if(!window.bkSaveSeekerProfile||!window.bkRefreshSeeker){errView(r,new Error('js/backend.js on the server is outdated. Upload the new backend.js, then hard-refresh (Ctrl/Cmd+Shift+R)'));return}
 if(window.bkProfileLoaded!==true){try{await bkRefreshSeeker()}catch(e){errView(r,e);return}}
 r.dataset.m=1;load();shell()};

})();
