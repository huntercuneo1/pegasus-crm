const STAGES=[
  {key:0,label:'Cold Prospects'},
  {key:1,label:'Active Prospects'},
  {key:2,label:'Meeting Set'},
  {key:3,label:'Proposal Sent'},
  {key:4,label:'Agreement Sent'},
  {key:5,label:'Closed / Engaged'},
];
const INTERESTS=[
  {key:'pm', label:'Property Management',   cls:'tag-pm', selCls:'sel-pm'},
  {key:'inv',label:'Investment Sales',cls:'tag-inv',selCls:'sel-inv'},
  {key:'lea',label:'Leasing',         cls:'tag-lea',selCls:'sel-lea'},
];

//  Default sample data (only used if nothing saved yet) 
const SAMPLE_LEADS=[
  {id:1,name:'Robert Nguyen',  address:'3420 Wilshire Blvd', company:'Nguyen Holdings',   email:'rnguyen@email.com',   phone:'(213) 555-0191',stage:1,priority:'high',followup:'2026-04-06',interest:'pm', attempts:2,notes:[{id:1,date:'2026-04-01',text:'Called — unhappy with current manager, open to switching'},{id:2,date:'2026-03-25',text:'First contact via cold call, owns 4-unit in Mid-City'}]},
  {id:2,name:'Carla Mendez',   address:'8811 Venice Blvd',   company:'Private Owner',     email:'cmendez@gmail.com',   phone:'(310) 555-0224',stage:1,priority:'med', followup:'2026-04-07',interest:'lea',attempts:1,notes:[{id:3,date:'2026-03-28',text:'Vacancy coming up May 1st, needs tenant quickly'}]},
  {id:3,name:'David Park',     address:'1140 S Figueroa St', company:'Park Family Trust', email:'dpark@trust.com',     phone:'(213) 555-0387',stage:2,priority:'high',followup:'2026-04-08',interest:'inv',attempts:3,notes:[{id:4,date:'2026-04-02',text:'Meeting confirmed for 4/8 at 10am — bring comps'},{id:5,date:'2026-03-30',text:'Interested in 1031 exchange, budget ~$3M'},{id:6,date:'2026-03-20',text:'Initial call — warm lead from referral'}]},
  {id:4,name:'Angela Torres',  address:'5200 Sunset Blvd',   company:'Sunset Properties', email:'angela@sunsetprop.co',phone:'(323) 555-0451',stage:0,priority:'med', followup:'2026-04-10',interest:'pm', attempts:0,notes:[]},
  {id:5,name:'Kevin Osei',     address:'2290 Crenshaw Blvd', company:'Private Owner',     email:'k.osei@email.com',    phone:'(424) 555-0312',stage:0,priority:'low', followup:'2026-04-14',interest:'lea',attempts:1,notes:[{id:7,date:'2026-03-31',text:'Retail unit, needs tenant fast — left voicemail'}]},
  {id:6,name:'Sandra Whitfield',address:'901 N Highland Ave',company:'Whitfield Realty',  email:'swhitfield@wre.com',  phone:'(818) 555-0229',stage:3,priority:'high',followup:'2026-04-09',interest:'inv',attempts:4,notes:[{id:8,date:'2026-04-03',text:'Proposal sent — follow up if no response by 4/9'},{id:9,date:'2026-04-01',text:'Seller motivation is high, pricing strategy discussed'}]},
  {id:7,name:'Marcus Bell',    address:'7640 Sepulveda Blvd',company:'Bell Enterprises',  email:'mbell@bellent.com',   phone:'(310) 555-0174',stage:4,priority:'med', followup:'2026-04-16',interest:'pm', attempts:3,notes:[{id:10,date:'2026-04-05',text:'Agreement sent — awaiting signature'}]},
  {id:8,name:'Linda Cho',      address:'4120 Adams Blvd',    company:'Private Owner',     email:'lcho@email.com',      phone:'(213) 555-0811',stage:5,priority:'low', followup:'',          interest:'pm', attempts:5,notes:[{id:11,date:'2026-03-15',text:'Signed — onboarding complete'}]},
];
//  Supabase config 
const SB_URL='https://jgwfrxjqjtljtsetyslb.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2ZyeGpxanRsanRzZXR5c2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODU5OTksImV4cCI6MjA5MTI2MTk5OX0.jfmL6_POqNY9p2VJQtAVZ6-ppxKw9rE5lQf2DG742nI';
const SB_HEADERS={'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY};

async function sbGet(table, params=''){
  const r=await fetch(`${SB_URL}/rest/v1/${table}?${params}`,{headers:{...SB_HEADERS,'Accept':'application/json'}});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function sbInsert(table, body){
  const r=await fetch(`${SB_URL}/rest/v1/${table}`,{method:'POST',headers:{...SB_HEADERS,'Prefer':'return=representation'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function sbUpdate(table, id, body){
  const r=await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:'PATCH',headers:{...SB_HEADERS,'Prefer':'return=representation'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function sbDelete(table, id){
  const r=await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:'DELETE',headers:SB_HEADERS});
  if(!r.ok) throw new Error(await r.text());
}
async function sbUpsert(table, body, onConflict){
  const r=await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=${onConflict}`,{method:'POST',headers:{...SB_HEADERS,'Prefer':'return=representation,resolution=merge-duplicates'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

//  Persistence 
function showSaveFlash(err){
  const el=document.getElementById('save-flash');
  if(!el)return;
  el.textContent=err?'Save failed':'Saved';
  el.className='save-flash '+(err?'offline':'cloud');
  el.style.opacity='1';
  clearTimeout(el._t);
  el._t=setTimeout(()=>{el.style.opacity='0';},1800);
}

async function save(lead){
  // Called with a single lead object after mutation
  try{
    if(lead.id && leads.find(l=>l.id===lead.id)){
      await sbUpdate('leads', lead.id, {
        name:lead.name, address:lead.address, company:lead.company,
        email:lead.email, phone:lead.phone, stage:lead.stage,
        priority:lead.priority, followup:lead.followup||null,
        interest:lead.interest, attempts:lead.attempts||0, notes:lead.notes||[]
      });
    }
    showSaveFlash();
  } catch(e){ console.error('Save error:',e); showSaveFlash(true); }
}

async function saveNewLead(lead){
  try{
    const res=await sbInsert('leads',{
      name:lead.name, address:lead.address, company:lead.company,
      email:lead.email, phone:lead.phone, stage:lead.stage,
      priority:lead.priority, followup:lead.followup||null,
      followup_type:lead.followupType||'call',
      lead_source:lead.leadSource||'cold',
      interest:lead.interest, attempts:lead.attempts||0, notes:lead.notes||[]
    });
    if(res&&res[0]){lead.id=res[0].id;leads.push(lead);}
    showSaveFlash();
  } catch(e){ console.error('Insert error:',e); showSaveFlash(true); }
}

async function saveDeleteLead(id){
  try{ await sbDelete('leads', id); showSaveFlash(); }
  catch(e){ console.error('Delete error:',e); showSaveFlash(true); }
}

async function saveActivity(dateStr){
  const d=activityLog[dateStr]||{calls:0,convos:0,letters:0,meetings:0,proposals:0,agreements:0};
  try{
    await sbUpsert('activity_log',{date:dateStr,...d},'date');
    showSaveFlash();
  } catch(e){ console.error('Activity save error:',e); showSaveFlash(true); }
}

async function loadData(){
  try{
    setLoading(true,'Loading your leads…');
    const rows=await sbGet('leads','order=id.asc');
    leads=rows.map(r=>({
      id:r.id, name:r.name||'', address:r.address||'', company:r.company||'',
      email:r.email||'', phone:r.phone||'', stage:r.stage||0,
      priority:r.priority||'med', followup:r.followup||'',
      interest:r.interest||'pm', attempts:r.attempts||0,
      notes:Array.isArray(r.notes)?r.notes:[]
    }));
    nextId=leads.reduce((m,l)=>Math.max(m,l.id),0)+1;
    nextNoteId=leads.reduce((m,l)=>Math.max(m,...(l.notes.map(n=>n.id||0)),0),0)+1;
    return true;
  } catch(e){
    console.error('Load error:',e);
    setLoading(false);
    showError('Could not connect to database. Check your connection and reload.');
    return false;
  }
}

async function loadActivity(){
  try{
    const rows=await sbGet('activity_log','order=date.asc');
    activityLog={};
    rows.forEach(r=>{ activityLog[r.date]={calls:r.calls||0,convos:r.convos||0,letters:r.letters||0,meetings:r.meetings||0,proposals:r.proposals||0,agreements:r.agreements||0}; });
  } catch(e){ console.error('Activity load error:',e); activityLog={}; }
}

function setLoading(on, msg=''){
  const el=document.getElementById('app');
  if(on&&el) el.innerHTML=`<div class="loading-wrap">
    <div class="spinner"></div>
    <div class="loading-text">${msg}</div>
  </div>`;
}
function showError(msg){
  const el=document.getElementById('app');
  if(el) el.innerHTML=`<div style="padding:2rem;text-align:center;color:var(--red);font-size:13px">${msg}</div>`;
}

function exportData(){
  const json=JSON.stringify({leads,activityLog},null,2);
  const blob=new Blob([json],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='property-crm-backup-'+todayStr()+'.json';
  a.click();
}
function importData(){
  const input=document.createElement('input');
  input.type='file'; input.accept='.json';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const d=JSON.parse(ev.target.result);
        if(!d.leads||!Array.isArray(d.leads)){alert('Invalid backup file.');return;}
        if(!confirm('This will upload all leads from the backup to your cloud database. Continue?'))return;
        setLoading(true,'Importing…');
        for(const l of d.leads){
          await sbInsert('leads',{name:l.name,address:l.address,company:l.company,email:l.email,phone:l.phone,stage:l.stage,priority:l.priority,followup:l.followup||null,interest:l.interest,attempts:l.attempts||0,notes:l.notes||[]});
        }
        if(d.activityLog){
          for(const [date,vals] of Object.entries(d.activityLog)){
            await sbUpsert('activity_log',{date,...vals},'date');
          }
        }
        await loadData(); await loadActivity();
        setLoading(false); render(); announce('Data imported successfully');
      } catch(err){ alert('Import failed: '+err.message); setLoading(false); }
    };
    reader.readAsText(file);
  };
  input.click();
}
async function clearAllData(){
  if(!confirm('This will permanently delete ALL leads and activity from the cloud database. Are you sure?'))return;
  if(!confirm('Are you absolutely sure? This cannot be undone.'))return;
  try{
    setLoading(true,'Clearing…');
    await fetch(`${SB_URL}/rest/v1/leads?id=gt.0`,{method:'DELETE',headers:SB_HEADERS});
    await fetch(`${SB_URL}/rest/v1/activity_log?id=gt.0`,{method:'DELETE',headers:SB_HEADERS});
    leads=[]; activityLog={};
    setLoading(false); render(); announce('All data cleared');
  } catch(e){ alert('Clear failed: '+e.message); setLoading(false); }
}
function showSaveFlash(){
  const el=document.getElementById('save-flash');
  if(!el)return;
  el.style.opacity='1';
  clearTimeout(el._t);
  el._t=setTimeout(()=>{ el.style.opacity='0'; }, 1500);
}
function exportData(){
  const json=JSON.stringify({leads,nextId,nextNoteId},null,2);
  const blob=new Blob([json],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='property-crm-backup-'+todayStr()+'.json';
  a.click();
}
function importData(){
  const input=document.createElement('input');
  input.type='file'; input.accept='.json';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const d=JSON.parse(ev.target.result);
        if(!d.leads||!Array.isArray(d.leads)){alert('Invalid backup file.');return;}
        if(!confirm('This will replace all current leads with the backup. Continue?'))return;
        leads=d.leads; nextId=d.nextId||999; nextNoteId=d.nextNoteId||999;
        save(); render(); announce('Data imported successfully');
      } catch(err){ alert('Could not read file: '+err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function clearAllData(){
  if(!confirm('This will permanently delete ALL leads and notes. Are you sure?'))return;
  leads=[]; nextId=1; nextNoteId=1;
  save(); render(); announce('All data cleared');
}

// notes are objects: {id, date, text}
let leads=[];
let nextId=1, nextNoteId=20;
let view='board', filterInterest='all';
let showAddModal=false, showDetailModal=false, selectedId=null;
let newLead={}, newNoteDate='', newNoteText='';

// Activity tracker state 
const METRICS=[
  {key:'calls',      label:'Cold calls',     color:'#b7611a', bg:'#fef4e8'},
  {key:'convos',     label:'Conversations',  color:'#1d5fa6', bg:'#eaf1fb'},
  {key:'letters',    label:'Letters sent',   color:'#7c3aed', bg:'#f0eeff'},
  {key:'meetings',   label:'Meetings set',   color:'#2d6a4f', bg:'#e8f5ef'},
  {key:'proposals',  label:'Proposals sent', color:'#0f6e56', bg:'#e3f5ef'},
  {key:'agreements', label:'Agreements sent',color:'#c0392b', bg:'#fdf0ee'},
];
let activityLog={};
let activeTab='pipeline';
let analyticsWeekOffset=0;

// drag state
let dragId=null, dragGhost=null, dragOffsetX=0, dragOffsetY=0, currentDropStage=null;

function resetNew(){ newLead={name:'',address:'',company:'',email:'',phone:'',stage:0,priority:'med',followup:'',followupType:'call',leadSource:'cold',interest:'pm',attempts:0,notes:[]}; }
resetNew();
function initials(n){ return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }
function todayStr(){ return new Date().toISOString().split('T')[0]; }
function daysDiff(d){ if(!d)return 9999; return Math.round((new Date(d)-new Date(todayStr()))/86400000); }
function urgencyKey(d){ const x=daysDiff(d); if(x<0)return'overdue'; if(x===0)return'today'; if(x<=7)return'week'; return'later'; }
function followupLabel(d){
  if(!d)return'neutral'; const diff=daysDiff(d);
  if(diff<0)return Math.abs(diff)+'d overdue';
  if(diff===0)return'today'; if(diff===1)return'tomorrow'; return d;
}
function chipCls(d){ const k=urgencyKey(d); if(k==='overdue')return'overdue'; if(k==='today'||k==='week')return'due'; return''; }
function intObj(key){ return INTERESTS.find(i=>i.key===key)||INTERESTS[0]; }
function stageObj(k){ return STAGES.find(s=>s.key===k)||STAGES[0]; }
function announce(m){ document.getElementById('announcer').textContent=m; }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function fuTypeLabel(t){
  const map={call:'Phone call',email:'Email',visit:'Property visit',meeting:'Meeting',letter:'Send letter',proposal:'Send proposal',other:'Other'};
  return map[t]||map['call'];
}
function fuTypeColor(t){
  const map={call:'var(--pm)',email:'var(--inv)',visit:'var(--amber)',meeting:'var(--green)',letter:'var(--teal,#0f6e56)',proposal:'var(--inv)',other:'var(--text3)'};
  return map[t]||'var(--pm)';
}
function filteredLeads(){
  let arr=filterInterest==='all'?[...leads]:leads.filter(l=>l.interest===filterInterest);
  return searchedLeads(arr);
}
function sortUrgency(arr){
  const o={overdue:0,today:1,week:2,later:3};
  return[...arr].sort((a,b)=>{ const oa=o[urgencyKey(a.followup)],ob=o[urgencyKey(b.followup)]; return oa!==ob?oa-ob:daysDiff(a.followup)-daysDiff(b.followup); });
}
function formatDateDisplay(d){
  if(!d)return'';
  const [y,m,day]=d.split('-');
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[+m-1]+' '+parseInt(day)+', '+y;
}

function render(){
  const el=document.getElementById('app');
  // Update sidebar lead count badge
  const badge=document.getElementById('sb-lead-count');
  if(badge) badge.textContent=leads.length;
  // Update followup badge — overdue + today
  const fuBadge=document.getElementById('sb-followup-count');
  if(fuBadge){
    const urgent=leads.filter(l=>l.followup&&daysDiff(l.followup)<=0).length;
    fuBadge.textContent=urgent;
    fuBadge.style.display=urgent>0?'':'none';
  }
  const all=leads;
  const vis=filteredLeads();
  const overdue=all.filter(l=>urgencyKey(l.followup)==='overdue').length;
  const dueToday=all.filter(l=>urgencyKey(l.followup)==='today').length;
  const pmC=all.filter(l=>l.interest==='pm').length;
  const invC=all.filter(l=>l.interest==='inv').length;
  const leaC=all.filter(l=>l.interest==='lea').length;
  const totalAttempts=all.reduce((s,l)=>s+(l.attempts||0),0);

  let html=`<div class="stats-bar" role="region" aria-label="Pipeline summary">
    <div class="stat-card"><div class="stat-label">Total leads</div><div class="stat-val">${all.length}</div></div>
    <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-val" style="color:var(--red)">${overdue}</div></div>
    <div class="stat-card"><div class="stat-label">Due today</div><div class="stat-val" style="color:var(--amber)">${dueToday}</div></div>
    <div class="stat-card"><div class="stat-label">Property Management</div><div class="stat-val" style="color:var(--pm)">${pmC}</div></div>
    <div class="stat-card"><div class="stat-label">Inv. Sales</div><div class="stat-val" style="color:var(--inv)">${invC}</div></div>
    <div class="stat-card"><div class="stat-label">Total contacts</div><div class="stat-val" style="color:var(--green)">${totalAttempts}</div></div>
  </div>`;

  html+=`<div class="filterbar" role="group" aria-label="Filter by service interest">
    <button class="filter-btn${filterInterest==='all'?' active-all':''}" onclick="setFilter('all')" aria-pressed="${filterInterest==='all'}">All leads <span class="filter-count">${all.length}</span></button>
    <button class="filter-btn${filterInterest==='pm'?' active-pm':''}" onclick="setFilter('pm')" aria-pressed="${filterInterest==='pm'}">Property Management <span class="filter-count">${pmC}</span></button>
    <button class="filter-btn${filterInterest==='inv'?' active-inv':''}" onclick="setFilter('inv')" aria-pressed="${filterInterest==='inv'}">Investment Sales <span class="filter-count">${invC}</span></button>
    <button class="filter-btn${filterInterest==='lea'?' active-lea':''}" onclick="setFilter('lea')" aria-pressed="${filterInterest==='lea'}">Leasing <span class="filter-count">${leaC}</span></button>
  </div>`;

  html+=`<div class="toolbar">
    <div class="view-toggle" role="group" aria-label="View mode">
      <button class="view-btn${view==='board'?' active':''}" onclick="setView('board')" aria-pressed="${view==='board'}">Board</button>
      <button class="view-btn${view==='urgency'?' active':''}" onclick="setView('urgency')" aria-pressed="${view==='urgency'}">By urgency</button>
      <button class="view-btn${view==='table'?' active':''}" onclick="setView('table')" aria-pressed="${view==='table'}">Table</button>
    </div>
    ${view==='board'?'<span style="font-size:11px;color:var(--text3)">Drag cards between stages</span>':''}
  </div>`;

  if(view==='board')   html+=renderBoard(vis);
  if(view==='urgency') html+=renderUrgency(vis);
  if(view==='table')   html+=renderTable(vis);

  el.innerHTML=html;
  if(view==='board') initDrag();

  const existing=document.getElementById('modal-overlay');
  if(existing) existing.remove();
  if(showAddModal){ document.body.insertAdjacentHTML('beforeend',renderAddModal()); setTimeout(()=>{const f=document.getElementById('f-name');if(f)f.focus();},50); }
  if(showDetailModal&&selectedId){
    const lead=leads.find(l=>l.id===selectedId);
    if(lead){ document.body.insertAdjacentHTML('beforeend',renderDetailModal(lead)); setTimeout(()=>{const f=document.querySelector('#modal-overlay .close-btn');if(f)f.focus();},50); }
  }
}

//  Card HTML 
function renderCardHTML(l, clickable=true){
  const fl=followupLabel(l.followup);
  const fc=chipCls(l.followup);
  const int=intObj(l.interest);
  const att=l.attempts||0;
  const clickAttr=clickable
    ?`onclick="openDetail(${l.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetail(${l.id})}"`
    :`onclick="openDetail(${l.id})"`;
  return`<div class="card" data-id="${l.id}" tabindex="0" role="button" aria-label="${esc(l.name)}, ${esc(l.address)}" aria-grabbed="false" ${clickAttr}>
    <div class="card-top">
      <div style="flex:1;min-width:0">
        <div class="card-name">${esc(l.name)}</div>
        <div class="card-address">${esc(l.address)}</div>
      </div>
      <span class="interest-tag ${int.cls}">${int.label}</span>
      ${l.leadSource&&l.leadSource!=='cold'?`<span class="source-tag ${sourceCls(l.leadSource)}">${sourceLabel(l.leadSource)}</span>`:''}
    </div>
    <div class="card-bottom">
      <div class="card-meta">
        <span class="priority-dot p-${l.priority}" role="img" aria-label="${l.priority} priority"></span>
        ${fl?`<span class="followup-chip ${fc}">${fl}</span>`:''}
        ${l.followupType&&l.followupType!=='call'?`<span style="font-size:10px;color:var(--text3)">${fuTypeLabel(l.followupType)}</span>`:''}
      </div>
      <span class="attempts-badge${att>0?' has-attempts':''}" title="Contact attempts"> ${att}</span>
    </div>
  </div>`;
}

//  Board 
function renderBoard(vis){
  let h=`<div class="kanban-wrap"><div class="kanban" id="kanban-board">`;
  STAGES.forEach(s=>{
    const cards=vis.filter(l=>l.stage===s.key);
    h+=`<div class="lane" data-stage="${s.key}" id="lane-${s.key}" aria-label="${s.label}, ${cards.length} leads">
      <div class="lane-header">
        <span class="lane-title">${s.label}</span>
        <span class="lane-count">${cards.length}</span>
      </div>
      <div class="lane-cards" id="lane-cards-${s.key}">`;
    cards.forEach(l=>{ h+=renderCardHTML(l); });
    h+=`</div><button class="add-card-btn" onclick="openAddInStage(${s.key})">+ add lead</button></div>`;
  });
  return h+'</div></div>';
}

//  Urgency 
function renderUrgency(vis){
  const sorted=sortUrgency(vis);
  const groups=[
    {key:'overdue',label:'Overdue',        cls:'urg-overdue',items:sorted.filter(l=>urgencyKey(l.followup)==='overdue')},
    {key:'today',  label:'Due today',      cls:'urg-today',  items:sorted.filter(l=>urgencyKey(l.followup)==='today')},
    {key:'week',   label:'This week',      cls:'urg-week',   items:sorted.filter(l=>urgencyKey(l.followup)==='week')},
    {key:'later',  label:'Later / no date',cls:'urg-later',  items:sorted.filter(l=>urgencyKey(l.followup)==='later')},
  ].filter(g=>g.items.length);
  if(!groups.length) return`<p style="color:var(--text3);font-size:13px;padding:2rem 0;text-align:center">No leads match this filter.</p>`;
  let h='';
  groups.forEach(g=>{
    h+=`<section class="urgency-group ${g.cls}">
      <div class="urgency-header">
        <span class="urgency-label">${g.label}</span>
        <span class="urgency-badge">${g.items.length}</span>
        <div class="urgency-line" aria-hidden="true"></div>
      </div>
      <div class="urgency-cards-grid">`;
    g.items.forEach(l=>{ h+=renderCardHTML(l,false); });
    h+=`</div></section>`;
  });
  return h;
}

//  Table 
function renderTable(vis){
  const sorted=sortUrgency(vis);
  let h=`<div class="table-wrap"><table role="grid" aria-label="All leads">
    <thead><tr>
      <th scope="col">Owner</th><th scope="col">Property</th><th scope="col">Interest</th>
      <th scope="col">Stage</th><th scope="col">Follow-up</th>
      <th scope="col">Contacts</th><th scope="col">Notes</th>
    </tr></thead><tbody>`;
  if(!sorted.length){
    h+=`<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:2rem">No leads match this filter.</td></tr>`;
  } else {
    sorted.forEach(l=>{
      const fl=followupLabel(l.followup);
      const fc=chipCls(l.followup);
      const int=intObj(l.interest);
      const lastNote=l.notes&&l.notes.length?l.notes[0]:null;
      h+=`<tr tabindex="0" onclick="openDetail(${l.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetail(${l.id})}">
        <td><div style="display:flex;align-items:center;gap:9px"><div class="avatar" aria-hidden="true">${initials(l.name)}</div><span>${esc(l.name)}</span></div></td>
        <td style="color:var(--text2);font-size:12px">${esc(l.address)}</td>
        <td><span class="interest-tag ${int.cls}">${int.label}</span></td>
        <td><span class="stage-pill s${l.stage}">${stageObj(l.stage).label}</span></td>
        <td>${fl?`<span class="followup-chip ${fc}">${fl}</span>`:'<span style="color:var(--text3)">—</span>'}</td>
        <td><span class="attempts-badge${(l.attempts||0)>0?' has-attempts':''}"> ${l.attempts||0}</span></td>
        <td style="font-size:11px;color:var(--text3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${lastNote?`<span title="${esc(lastNote.text)}">${esc(formatDateDisplay(lastNote.date))} — ${esc(lastNote.text)}</span>`:'—'}
        </td>
      </tr>`;
    });
  }
  return h+'</tbody></table></div>';
}

//  Add Modal 
function renderAddModal(){
  return`<div id="modal-overlay" class="overlay" role="dialog" aria-modal="true" aria-labelledby="add-title" onclick="overlayClick(event)">
    <div class="modal">
      <div class="modal-scroll">
        <div class="modal-header">
          <h2 class="modal-title" id="add-title">Add lead</h2>
          <button class="close-btn" onclick="closeAll()" aria-label="Close">&#x2715;</button>
        </div>
        <div class="form-group">
          <label>Service interest</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap" role="group">
            ${INTERESTS.map(i=>`<button type="button" class="int-option${newLead.interest===i.key?' '+i.selCls:''}" data-key="${i.key}" onclick="setNewInterest('${i.key}',this)" aria-pressed="${newLead.interest===i.key}">${i.label}</button>`).join('')}
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="f-name">Owner / contact *</label><input id="f-name" type="text" value="${esc(newLead.name)}" oninput="newLead.name=this.value" placeholder="Full name" autocomplete="name" required></div>
          <div class="form-group"><label for="f-co">Company / trust</label><input id="f-co" type="text" value="${esc(newLead.company)}" oninput="newLead.company=this.value" placeholder="Entity (if any)"></div>
        </div>
        <div class="form-group"><label for="f-addr">Property address</label><input id="f-addr" type="text" value="${esc(newLead.address)}" oninput="newLead.address=this.value" placeholder="123 Main St, LA"></div>
        <div class="form-row">
          <div class="form-group"><label for="f-email">Email</label><input id="f-email" type="email" value="${esc(newLead.email)}" oninput="newLead.email=this.value" placeholder="email@co.com"></div>
          <div class="form-group"><label for="f-phone">Phone</label><input id="f-phone" type="tel" value="${esc(newLead.phone)}" oninput="newLead.phone=this.value" placeholder="(xxx) xxx-xxxx"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div class="form-group"><label for="f-source">Lead source</label><select id="f-source" onchange="newLead.leadSource=this.value">
            <option value="cold"${newLead.leadSource==='cold'?' selected':''}>Cold call</option>
            <option value="referral"${newLead.leadSource==='referral'?' selected':''}>Referral</option>
            <option value="mail"${newLead.leadSource==='mail'?' selected':''}>Direct mail</option>
            <option value="website"${newLead.leadSource==='website'?' selected':''}>Website</option>
            <option value="walkin"${newLead.leadSource==='walkin'?' selected':''}>Walk-in</option>
            <option value="social"${newLead.leadSource==='social'?' selected':''}>Social media</option>
            <option value="other"${newLead.leadSource==='other'?' selected':''}>Other</option>
          </select></div>
          <div class="form-group"><label for="f-stage">Stage</label><select id="f-stage" onchange="newLead.stage=+this.value">${STAGES.map(s=>`<option value="${s.key}"${newLead.stage===s.key?' selected':''}>${s.label}</option>`).join('')}</select></div>
          <div class="form-group"><label for="f-priority">Priority</label><select id="f-priority" onchange="newLead.priority=this.value">
            <option value="med"${newLead.priority==='med'?' selected':''}>Medium</option>
            <option value="high"${newLead.priority==='high'?' selected':''}>High</option>
            <option value="low"${newLead.priority==='low'?' selected':''}>Low</option>
          </select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="f-followup">Follow-up date</label><input id="f-followup" type="date" value="${esc(newLead.followup)}" oninput="newLead.followup=this.value"></div>
          <div class="form-group"><label for="f-futype">Follow-up type</label><select id="f-futype" onchange="newLead.followupType=this.value">
            <option value="call"${newLead.followupType==='call'?' selected':''}>Phone call</option>
            <option value="email"${newLead.followupType==='email'?' selected':''}>Email</option>
            <option value="visit"${newLead.followupType==='visit'?' selected':''}>Property visit</option>
            <option value="meeting"${newLead.followupType==='meeting'?' selected':''}>Meeting</option>
            <option value="letter"${newLead.followupType==='letter'?' selected':''}>Send letter</option>
            <option value="proposal"${newLead.followupType==='proposal'?' selected':''}>Send proposal</option>
            <option value="other"${newLead.followupType==='other'?' selected':''}>Other</option>
          </select></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="closeAll()">Cancel</button>
        <button class="btn btn-primary" onclick="saveLead()">Add lead</button>
      </div>
    </div>
  </div>`;
}

//  Detail Modal 
function renderDetailModal(l){
  const int=intObj(l.interest);
  const att=l.attempts||0;
  const lastContact=l.notes&&l.notes.length?formatDateDisplay(l.notes[0].date):'Never';
  return`<div id="modal-overlay" class="overlay" role="dialog" aria-modal="true" aria-labelledby="det-title" onclick="overlayClick(event)">
    <div class="modal">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="detail-avatar" aria-hidden="true">${initials(l.name)}</div>
          <div>
            <div style="font-size:16px;font-weight:600" id="det-title">${esc(l.name)}</div>
            <div style="font-size:12px;color:var(--text3)">${esc(l.address)}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-sm btn-danger" onclick="deleteLead(${l.id})">Remove</button>
          <button class="close-btn" onclick="closeAll()" aria-label="Close">&#x2715;</button>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:0">
        <label style="font-size:11px;font-weight:500;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:8px">Service interest</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap" role="group">
          ${INTERESTS.map(i=>`<button type="button" class="int-option${l.interest===i.key?' '+i.selCls:''}" data-key="${i.key}"
            onclick="updateLead(${l.id},'interest','${i.key}');document.querySelectorAll('#modal-overlay .int-option').forEach(b=>{const a=b.dataset.key==='${i.key}';b.className='int-option'+(a?' ${i.selCls}':'');b.setAttribute('aria-pressed',a);})"
            aria-pressed="${l.interest===i.key}">${i.label}</button>`).join('')}
        </div>
      </div>

      <div class="section-label" style="margin-top:14px">Move to stage</div>
      <select onchange="updateLead(${l.id},'stage',+this.value)" style="width:100%;border:1.5px solid var(--border);border-radius:var(--radius);padding:9px 12px;font-size:13px;font-family:'Outfit',sans-serif;background:var(--surface2);color:var(--text);cursor:pointer">
        ${STAGES.map(s=>`<option value="${s.key}"${l.stage===s.key?' selected':''}>${s.label}</option>`).join('')}
      </select>

      <div class="section-label">Contact attempts
        <span style="font-size:11px;color:var(--text3);font-weight:400;text-transform:none;letter-spacing:0">last: ${lastContact}</span>
      </div>
      <div class="attempts-row">
        <div class="attempts-info">
          <div class="attempts-num" id="att-num-${l.id}">${att}</div>
          <div>
            <div class="attempts-label-text">contact attempts</div>
            <div class="attempts-label-sub">${att===1?'1 touchpoint':'multiple touchpoints'}</div>
          </div>
        </div>
        <div class="attempts-controls">
          <button class="counter-btn" onclick="changeAttempts(${l.id},-1)" aria-label="Decrease contact attempts">−</button>
          <button class="counter-btn plus" onclick="changeAttempts(${l.id},1)" aria-label="Increase contact attempts">+</button>
        </div>
      </div>

      <div class="section-label">Contact</div>
      <div class="detail-grid">
        <div class="detail-item"><label>Email</label><div style="font-size:13px"><a href="mailto:${esc(l.email)}" style="color:var(--pm)">${esc(l.email||'—')}</a></div></div>
        <div class="detail-item"><label>Phone</label><div style="font-size:13px">${esc(l.phone||'—')}</div></div>
        <div class="detail-item"><label>Company / trust</label><div style="font-size:13px;color:var(--text2)">${esc(l.company||'—')}</div></div>
        <div class="detail-item"><label>Lead source</label>
          <select onchange="updateLead(${l.id},'leadSource',this.value)" style="width:100%;border:1.5px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-size:12px;font-family:'Outfit',sans-serif;background:var(--surface2);color:var(--text)">
            ${['cold','referral','mail','website','walkin','social','other'].map(s=>`<option value="${s}"${(l.leadSource||'cold')===s?' selected':''}>${sourceLabel(s)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="section-label">Details</div>
      <div class="detail-grid">
        <div class="detail-item">
          <label for="d-priority">Priority</label>
          <select id="d-priority" onchange="updateLead(${l.id},'priority',this.value)">
            <option value="high"${l.priority==='high'?' selected':''}>High</option>
            <option value="med"${l.priority==='med'?' selected':''}>Medium</option>
            <option value="low"${l.priority==='low'?' selected':''}>Low</option>
          </select>
        </div>
        <div class="detail-item">
          <label for="d-followup">Follow-up date</label>
          <input id="d-followup" type="date" value="${esc(l.followup||'')}" onchange="updateLead(${l.id},'followup',this.value)">
        </div>
        <div class="detail-item">
          <label for="d-futype">Follow-up type</label>
          <select id="d-futype" onchange="updateLead(${l.id},'followupType',this.value)">
            <option value="call"${(l.followupType||'call')==='call'?' selected':''}>Phone call</option>
            <option value="email"${l.followupType==='email'?' selected':''}>Email</option>
            <option value="visit"${l.followupType==='visit'?' selected':''}>Property visit</option>
            <option value="meeting"${l.followupType==='meeting'?' selected':''}>Meeting</option>
            <option value="letter"${l.followupType==='letter'?' selected':''}>Send letter</option>
            <option value="proposal"${l.followupType==='proposal'?' selected':''}>Send proposal</option>
            <option value="other"${l.followupType==='other'?' selected':''}>Other</option>
          </select>
        </div>
        <div class="detail-item" style="grid-column:1/-1">
          <label for="d-addr">Property address</label>
          <input id="d-addr" type="text" value="${esc(l.address||'')}" onchange="updateLead(${l.id},'address',this.value)">
        </div>
      </div>

      <div class="section-label">Actions</div>
      <div class="actions-row">
        <a href="mailto:${esc(l.email)}?subject=${encodeURIComponent('Following up — '+l.address)}" class="btn-action">Email</a>
        <a href="https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent('Follow-up: '+l.name+' / '+l.address)}&body=${encodeURIComponent('Follow-up call/meeting re: '+l.address)}" target="_blank" rel="noopener noreferrer" class="btn-action">Schedule (Outlook) ↗</a>
        <a href="https://outlook.live.com/mail/0/" target="_blank" rel="noopener noreferrer" class="btn-action">Outlook inbox ↗</a>
      </div>



      <div class="modal-actions"><button class="btn" onclick="closeAll()">Close</button></div>
    </div>
  </div>`;
}

//  Drag & Drop 
function initDrag(){
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('mousedown',onMouseDown);
    card.addEventListener('touchstart',onTouchStart,{passive:false});
    card.addEventListener('keydown',onCardKeydown);
  });
}
function onCardKeydown(e){
  const id=+e.currentTarget.dataset.id;
  const lead=leads.find(l=>l.id===id);
  if(!lead)return;
  const keys=STAGES.map(s=>s.key), idx=keys.indexOf(lead.stage);
  if(e.key==='ArrowRight'&&idx<keys.length-1){e.preventDefault();lead.stage=keys[idx+1];render();save(lead);announce(lead.name+' → '+stageObj(lead.stage).label);setTimeout(()=>{const el=document.querySelector(`.card[data-id="${id}"]`);if(el)el.focus();},50);}
  else if(e.key==='ArrowLeft'&&idx>0){e.preventDefault();lead.stage=keys[idx-1];render();save(lead);announce(lead.name+' → '+stageObj(lead.stage).label);setTimeout(()=>{const el=document.querySelector(`.card[data-id="${id}"]`);if(el)el.focus();},50);}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail(id);}
}
function createGhost(cardEl,cx,cy){
  const r=cardEl.getBoundingClientRect();
  dragOffsetX=cx-r.left; dragOffsetY=cy-r.top;
  const g=cardEl.cloneNode(true);
  g.className='card card-ghost'; g.style.width=r.width+'px';
  g.style.left=(cx-dragOffsetX)+'px'; g.style.top=(cy-dragOffsetY)+'px';
  document.body.appendChild(g); return g;
}
function moveGhost(cx,cy){ if(dragGhost){dragGhost.style.left=(cx-dragOffsetX)+'px';dragGhost.style.top=(cy-dragOffsetY)+'px';} }
function getStageFromPoint(x,y){ for(const lane of document.querySelectorAll('.lane')){const r=lane.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return+lane.dataset.stage;} return null; }
function showPlaceholder(sk){ removePlaceholder(); const c=document.getElementById('lane-cards-'+sk); if(!c)return; const ph=document.createElement('div'); ph.className='drop-placeholder'; ph.id='drop-ph'; c.appendChild(ph); }
function removePlaceholder(){ const p=document.getElementById('drop-ph'); if(p)p.remove(); }
function highlightLane(sk){ document.querySelectorAll('.lane').forEach(l=>l.classList.toggle('drag-over',+l.dataset.stage===sk)); }
function clearHighlights(){ document.querySelectorAll('.lane').forEach(l=>l.classList.remove('drag-over')); }
function onMouseDown(e){
  if(e.button!==0)return;
  const card=e.currentTarget, id=+card.dataset.id; let moved=false;
  function onMove(ev){
    if(!moved){moved=true;dragId=id;card.classList.add('dragging');dragGhost=createGhost(card,ev.clientX,ev.clientY);}
    moveGhost(ev.clientX,ev.clientY);
    const s=getStageFromPoint(ev.clientX,ev.clientY);
    if(s!==null&&s!==currentDropStage){currentDropStage=s;highlightLane(s);showPlaceholder(s);}
  }
  function onUp(ev){
    document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp);
    if(!moved){openDetail(id);return;}
    finishDrop(ev.clientX,ev.clientY,card);
  }
  document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp);
}
function onTouchStart(e){
  const card=e.currentTarget, id=+card.dataset.id; let moved=false;
  function onMove(ev){
    ev.preventDefault(); const t=ev.touches[0];
    if(!moved){moved=true;dragId=id;card.classList.add('dragging');dragGhost=createGhost(card,t.clientX,t.clientY);}
    moveGhost(t.clientX,t.clientY);
    const s=getStageFromPoint(t.clientX,t.clientY);
    if(s!==null&&s!==currentDropStage){currentDropStage=s;highlightLane(s);showPlaceholder(s);}
  }
  function onEnd(ev){
    document.removeEventListener('touchmove',onMove); document.removeEventListener('touchend',onEnd);
    if(!moved){openDetail(id);return;}
    const t=ev.changedTouches[0]; finishDrop(t.clientX,t.clientY,card);
  }
  document.addEventListener('touchmove',onMove,{passive:false}); document.addEventListener('touchend',onEnd);
}
function finishDrop(cx,cy,cardEl){
  const s=getStageFromPoint(cx,cy);
  removePlaceholder(); clearHighlights();
  if(dragGhost){dragGhost.remove();dragGhost=null;}
  cardEl.classList.remove('dragging'); cardEl.setAttribute('aria-grabbed','false');
  if(dragId!==null&&s!==null){
    const lead=leads.find(l=>l.id===dragId);
    if(lead&&lead.stage!==s){lead.stage=s;announce(lead.name+' → '+stageObj(s).label);render();}
  }
  dragId=null; currentDropStage=null;
}

//  Actions 
function toggleDataMenu(){
  const m=document.getElementById('data-menu');
  if(m) m.style.display=m.style.display==='none'?'block':'none';
}
document.addEventListener('click',e=>{
  const wrap=document.getElementById('data-menu-wrap');
  if(wrap&&!wrap.contains(e.target)){
    const m=document.getElementById('data-menu');
    if(m) m.style.display='none';
  }
});
function setView(v){view=v;render();}
function setFilter(f){filterInterest=f;render();}
function openAdd(){resetNew();showAddModal=true;render();}
function openAddInStage(s){resetNew();newLead.stage=s;showAddModal=true;render();}
function openDetail(id){selectedId=id;showDetailModal=true;render();}
function closeAll(){
  showAddModal=false;showDetailModal=false;selectedId=null;
  const o=document.getElementById('modal-overlay');if(o)o.remove();
}
function overlayClick(e){if(e.target.id==='modal-overlay')closeAll();}
function setNewInterest(key,btn){
  newLead.interest=key;
  btn.closest('div[role="group"]').querySelectorAll('.int-option').forEach(b=>{
    const a=b.dataset.key===key; b.className='int-option'+(a?' '+intObj(key).selCls:''); b.setAttribute('aria-pressed',a);
  });
}
async function saveLead(){
  if(!newLead.name.trim()){alert('Please enter a name.');return;}
  const lead={...newLead,attempts:0,notes:[]};
  leads.push(lead);
  showAddModal=false; render();
  if(usingCloud) await saveNewLead(lead); else lsSave();
  announce(lead.name+' added');
}
async function updateLead(id,k,v){
  const l=leads.find(x=>x.id===id);
  if(l){ l[k]=v; selectedId=id; render(); if(usingCloud) await save(l); else lsSave(); }
}
async function changeAttempts(id,delta){
  const l=leads.find(x=>x.id===id);if(!l)return;
  l.attempts=Math.max(0,(l.attempts||0)+delta);
  const numEl=document.getElementById('att-num-'+id);
  if(numEl) numEl.textContent=l.attempts;
  if(usingCloud) await save(l); else lsSave();
}
async function addNote(id){
  const dateEl=document.getElementById('note-date-'+id);
  const textEl=document.getElementById('note-text-'+id);
  if(!dateEl||!textEl||!textEl.value.trim())return;
  const l=leads.find(x=>x.id===id);if(!l)return;
  l.notes.unshift({id:nextNoteId++,date:dateEl.value||todayStr(),text:textEl.value.trim()});
  selectedId=id; render();
  if(usingCloud) await save(l); else lsSave();
  announce('Activity logged');
}
async function deleteNote(leadId,noteId){
  const l=leads.find(x=>x.id===leadId);if(!l)return;
  l.notes=l.notes.filter(n=>n.id!==noteId);
  selectedId=leadId; render();
  if(usingCloud) await save(l); else lsSave();
}
async function deleteLead(id){
  const l=leads.find(x=>x.id===id);if(!l)return;
  if(!confirm('Remove '+l.name+'?'))return;
  leads=leads.filter(x=>x.id!==id); closeAll(); render();
  if(usingCloud) await saveDeleteLead(id); else lsSave();
  announce(l.name+' removed');
}
function finishDrop(cx,cy,cardEl){
  const s=getStageFromPoint(cx,cy);
  removePlaceholder(); clearHighlights();
  if(dragGhost){dragGhost.remove();dragGhost=null;}
  cardEl.classList.remove('dragging'); cardEl.setAttribute('aria-grabbed','false');
  if(dragId!==null&&s!==null){
    const lead=leads.find(l=>l.id===dragId);
    if(lead&&lead.stage!==s){
      lead.stage=s; announce(lead.name+' → '+stageObj(s).label); render();
      if(usingCloud) save(lead); else lsSave();
    }
  }
  dragId=null; currentDropStage=null;
}

//  Follow-up Dashboard 
function renderFollowups(){
  const root=document.getElementById('followups-root');
  if(!root) return;
  const today=todayStr();
  const overdue=sortUrgency(leads.filter(l=>l.followup&&urgencyKey(l.followup)==='overdue'));
  const dueToday=sortUrgency(leads.filter(l=>l.followup&&urgencyKey(l.followup)==='today'));
  const dueWeek=sortUrgency(leads.filter(l=>l.followup&&urgencyKey(l.followup)==='week'));
  const later=leads.filter(l=>!l.followup||(l.followup&&urgencyKey(l.followup)==='later'));
  const total=overdue.length+dueToday.length+dueWeek.length;

  let html=`<div class="followup-banner">
    <div class="fu-banner-card overdue" onclick="scrollToSection('fu-overdue')">
      <div class="fu-banner-icon"></div>
      <div class="fu-banner-num">${overdue.length}</div>
      <div class="fu-banner-label">Overdue</div>
      <div class="fu-banner-sub">Past follow-up date</div>
    </div>
    <div class="fu-banner-card today" onclick="scrollToSection('fu-today')">
      <div class="fu-banner-icon"></div>
      <div class="fu-banner-num">${dueToday.length}</div>
      <div class="fu-banner-label">Due today</div>
      <div class="fu-banner-sub">Call or reach out now</div>
    </div>
    <div class="fu-banner-card week" onclick="scrollToSection('fu-week')">
      <div class="fu-banner-icon"></div>
      <div class="fu-banner-num">${dueWeek.length}</div>
      <div class="fu-banner-label">This week</div>
      <div class="fu-banner-sub">Coming up soon</div>
    </div>
    <div class="fu-banner-card all">
      <div class="fu-banner-icon"></div>
      <div class="fu-banner-num">${leads.filter(l=>!l.followup).length}</div>
      <div class="fu-banner-label">No date set</div>
      <div class="fu-banner-sub">Needs a follow-up</div>
    </div>
  </div>`;

  if(total===0 && leads.length>0){
    html+=`<div class="fu-empty">
      <div class="fu-empty-icon"></div>
      <div class="fu-empty-text">All caught up!</div>
      <div class="fu-empty-sub">No overdue or upcoming follow-ups. Great work.</div>
    </div>`;
  }

  const sections=[
    {id:'fu-overdue', cls:'fu-overdue', label:'Overdue', urgCls:'overdue', items:overdue},
    {id:'fu-today',   cls:'fu-today',   label:'Due today', urgCls:'today', items:dueToday},
    {id:'fu-week',    cls:'fu-week',    label:'This week', urgCls:'week', items:dueWeek},
  ];

  sections.forEach(sec=>{
    if(!sec.items.length) return;
    html+=`<div class="fu-section ${sec.cls}" id="${sec.id}">
      <div class="fu-section-header">
        <span class="fu-section-title">${sec.label}</span>
        <span class="fu-section-badge">${sec.items.length} lead${sec.items.length!==1?'s':''}</span>
        <div class="fu-section-line"></div>
      </div>
      <div class="fu-cards-grid">`;
    sec.items.forEach(l=>{
      const int=intObj(l.interest);
      const fl=followupLabel(l.followup);
      const lastNote=l.notes&&l.notes.length?l.notes[0]:null;
      html+=`<div class="fu-card">
        <div class="fu-card-accent ${sec.urgCls}"></div>
        <div class="fu-card-top">
          <div>
            <div class="fu-card-name">${esc(l.name)}</div>
            <div class="fu-card-address">${esc(l.address)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <span class="fu-due-chip ${sec.urgCls}">${fl}</span>
            <div style="font-size:10px;color:var(--text3);margin-top:3px;text-align:right">${fuTypeLabel(l.followupType||'call')}</div>
          </div>
        </div>
        <div class="fu-card-meta">
          <span class="interest-tag ${int.cls}">${int.label}</span>
          <span class="stage-pill s${l.stage}">${stageObj(l.stage).label}</span>
          <span class="attempts-badge${(l.attempts||0)>0?' has-attempts':''}"> ${l.attempts||0} contacts</span>
        </div>
        ${lastNote?`<div class="fu-last-note">"${esc(lastNote.text)}" <span style="color:var(--text3);font-style:normal">— ${formatDateDisplay(lastNote.date)}</span></div>`:''}
        <div class="fu-card-actions">
          <button class="fu-action-btn primary" onclick="openDetail(${l.id})">Open lead</button>
          <a href="mailto:${esc(l.email||'')}?subject=${encodeURIComponent('Following up — '+l.address)}" class="fu-action-btn">Email</a>
          <a href="https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent('Follow-up: '+l.name)}&body=${encodeURIComponent('Follow-up re: '+l.address)}" target="_blank" class="fu-action-btn"> Schedule</a>
        </div>
      </div>`;
    });
    html+=`</div></div>`;
  });

  // No-date-set section
  const noDate=leads.filter(l=>!l.followup);
  if(noDate.length){
    html+=`<div class="fu-section fu-upcoming">
      <div class="fu-section-header">
        <span class="fu-section-title">No follow-up date set</span>
        <span class="fu-section-badge">${noDate.length} lead${noDate.length!==1?'s':''}</span>
        <div class="fu-section-line"></div>
      </div>
      <div class="fu-cards-grid">`;
    noDate.forEach(l=>{
      const int=intObj(l.interest);
      html+=`<div class="fu-card">
        <div class="fu-card-accent upcoming"></div>
        <div class="fu-card-top">
          <div>
            <div class="fu-card-name">${esc(l.name)}</div>
            <div class="fu-card-address">${esc(l.address)}</div>
          </div>
          <span class="fu-due-chip upcoming">No date</span>
        </div>
        <div class="fu-card-meta">
          <span class="interest-tag ${int.cls}">${int.label}</span>
          <span class="stage-pill s${l.stage}">${stageObj(l.stage).label}</span>
        </div>
        <div class="fu-card-actions">
          <button class="fu-action-btn primary" onclick="openDetail(${l.id})">Set follow-up date</button>
        </div>
      </div>`;
    });
    html+=`</div></div>`;
  }

  root.innerHTML=html;
}

function scrollToSection(id){
  const el=document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
}


//  Login 
const TEAM_PASSWORDS = ['pegasus2026','hunter2026','admin'];
function doLogin(){
  const email=document.getElementById('login-email')?.value||'';
  const pass=document.getElementById('login-password')?.value||'';
  const err=document.getElementById('login-error');
  if(!email.trim()||!pass.trim()){if(err){err.textContent='Please enter your email and password.';err.style.display='block';}return;}
  if(TEAM_PASSWORDS.includes(pass.toLowerCase().trim())){
    document.getElementById('login-page').style.display='none';
    document.getElementById('app-shell').style.display='flex';
    sessionStorage.setItem('crm_auth','1');
    sessionStorage.setItem('crm_user', email.split('@')[0]);
    // Update user name in sidebar
    const uname=document.querySelector('.sb-user-name');
    if(uname) uname.textContent=email.split('@')[0].replace('.',' ').replace(/\w/g,c=>c.toUpperCase());
    const uavatar=document.querySelector('.sb-avatar');
    if(uavatar) uavatar.textContent=email.split('@')[0].slice(0,2).toUpperCase();
  } else {
    if(err){err.textContent='Incorrect password. Please try again.';err.style.display='block';}
    document.getElementById('login-password').value='';
    document.getElementById('login-password').focus();
  }
}
function checkAuth(){
  if(sessionStorage.getItem('crm_auth')==='1'){
    document.getElementById('login-page').style.display='none';
    document.getElementById('app-shell').style.display='flex';
  }
}

//  Sidebar toggle (mobile) 
function toggleSidebar(){
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sb-overlay').classList.toggle('visible');
}
function closeSidebar(){
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sb-overlay').classList.remove('visible');
}

//  Search 
let searchQuery='';
function onSearch(val){
  searchQuery=val.trim().toLowerCase();
  const clearBtn=document.getElementById('search-clear');
  if(clearBtn) clearBtn.className='search-clear'+(searchQuery?' visible':'');
  render();
}
function clearSearch(){
  searchQuery='';
  const inp=document.getElementById('search-input');
  if(inp) inp.value='';
  const clearBtn=document.getElementById('search-clear');
  if(clearBtn) clearBtn.className='search-clear';
  render();
}
function searchedLeads(arr){
  if(!searchQuery) return arr;
  return arr.filter(l=>
    (l.name||'').toLowerCase().includes(searchQuery)||
    (l.address||'').toLowerCase().includes(searchQuery)||
    (l.company||'').toLowerCase().includes(searchQuery)||
    (l.email||'').toLowerCase().includes(searchQuery)||
    (l.phone||'').includes(searchQuery)
  );
}

//  Lead source helpers 
function sourceLabel(s){
  const map={cold:'Cold call',referral:'Referral',mail:'Direct mail',website:'Website',walkin:'Walk-in',social:'Social media',other:'Other'};
  return map[s]||'Cold call';
}
function sourceCls(s){
  const map={cold:'source-cold',referral:'source-referral',mail:'source-mail',website:'source-website',walkin:'source-walkin',social:'source-social',other:'source-other'};
  return map[s]||'source-cold';
}

// Reports Dashboard 
function renderReports(){
  const root=document.getElementById('reports-root');
  if(!root) return;
  const all=leads;
  const total=all.length||1;

  //Pipeline funnel
  const stageCounts=STAGES.map(s=>({...s,count:all.filter(l=>l.stage===s.key).length}));
  const maxStage=Math.max(...stageCounts.map(s=>s.count),1);
  const stageColors=['#9ca3af','#2563eb','#d97706','#7c3aed','#059669','#10b981'];

  // Source breakdown
  const sources=['cold','referral','mail','website','walkin','social','other'];
  const sourceCounts=sources.map(s=>({s,count:all.filter(l=>l.leadSource===s||(!l.leadSource&&s==='cold')).length}));

  // Interest breakdown
  const intCounts=INTERESTS.map(i=>({...i,count:all.filter(l=>l.interest===i.key).length}));

  // Conversion metrics
  const closedCount=all.filter(l=>l.stage===5).length;
  const convRate=total>0?Math.round(closedCount/total*100):0;
  const avgAttempts=total>0?Math.round(all.reduce((s,l)=>s+(l.attempts||0),0)/total*10)/10:0;
  const overdueCount=all.filter(l=>l.followup&&daysDiff(l.followup)<0).length;

  let html=`
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:1.5rem">
    <div class="report-mini-stat"><div class="report-mini-val" style="color:var(--accent)">${total}</div><div class="report-mini-label">Total leads</div></div>
    <div class="report-mini-stat"><div class="report-mini-val" style="color:var(--green)">${closedCount}</div><div class="report-mini-label">Closed / engaged</div></div>
    <div class="report-mini-stat"><div class="report-mini-val" style="color:var(--pm)">${convRate}%</div><div class="report-mini-label">Close rate</div></div>
    <div class="report-mini-stat"><div class="report-mini-val" style="color:var(--amber)">${avgAttempts}</div><div class="report-mini-label">Avg contact attempts</div></div>
    <div class="report-mini-stat"><div class="report-mini-val" style="color:var(--red)">${overdueCount}</div><div class="report-mini-label">Overdue follow-ups</div></div>
  </div>

  <div class="reports-grid">
    <div class="report-card">
      <div class="report-card-title">Pipeline funnel</div>
      <div class="report-card-sub">Leads by stage</div>
      ${stageCounts.map((s,i)=>`
        <div class="funnel-bar-wrap">
          <div class="funnel-label">
            <span class="funnel-label-name" style="color:${stageColors[i]}">${s.label}</span>
            <span class="funnel-label-count">${s.count}</span>
          </div>
          <div class="funnel-bar-bg">
            <div class="funnel-bar-fill" style="width:${Math.round(s.count/maxStage*100)}%;background:${stageColors[i]}"></div>
          </div>
        </div>`).join('')}
    </div>

    <div class="report-card">
      <div class="report-card-title">Lead sources</div>
      <div class="report-card-sub">Where your leads come from</div>
      ${sourceCounts.filter(s=>s.count>0).map(s=>`
        <div class="funnel-bar-wrap">
          <div class="funnel-label">
            <span class="funnel-label-name">${sourceLabel(s.s)}</span>
            <span class="funnel-label-count">${s.count} (${Math.round(s.count/total*100)}%)</span>
          </div>
          <div class="funnel-bar-bg">
            <div class="funnel-bar-fill" style="width:${Math.round(s.count/total*100)}%;background:var(--accent)"></div>
          </div>
        </div>`).join('')||'<p style="color:var(--text3);font-size:12px">No leads yet</p>'}
    </div>

    <div class="report-card">
      <div class="report-card-title">Service interest</div>
      <div class="report-card-sub">Leads by property type</div>
      ${intCounts.map(i=>`
        <div class="funnel-bar-wrap">
          <div class="funnel-label">
            <span class="funnel-label-name">${i.label}</span>
            <span class="funnel-label-count">${i.count} (${Math.round(i.count/total*100)}%)</span>
          </div>
          <div class="funnel-bar-bg">
            <div class="funnel-bar-fill" style="width:${Math.round(i.count/total*100)}%;background:var(--pm)"></div>
          </div>
        </div>`).join('')}
    </div>

    <div class="report-card">
      <div class="report-card-title">Priority breakdown</div>
      <div class="report-card-sub">Leads by urgency</div>
      ${[{k:'high',label:'High',color:'var(--red)'},{k:'med',label:'Medium',color:'var(--amber)'},{k:'low',label:'Low',color:'var(--green)'}].map(p=>{
        const cnt=all.filter(l=>l.priority===p.k).length;
        return`<div class="funnel-bar-wrap">
          <div class="funnel-label">
            <span class="funnel-label-name" style="color:${p.color}">${p.label}</span>
            <span class="funnel-label-count">${cnt} (${Math.round(cnt/total*100)}%)</span>
          </div>
          <div class="funnel-bar-bg">
            <div class="funnel-bar-fill" style="width:${Math.round(cnt/total*100)}%;background:${p.color}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  root.innerHTML=html;
}

// ── CSV / EXCEL IMPORT ────────────────────────────────────
let importRows=[];let importHeaders=[];
const CRM_FIELDS=[{key:'name',label:'Name / Owner'},{key:'address',label:'Property Address'},{key:'company',label:'Company / Trust'},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'stage',label:'Stage'},{key:'priority',label:'Priority'},{key:'interest',label:'Service Interest'},{key:'leadSource',label:'Lead Source'},{key:'followup',label:'Follow-up Date'},{key:'skip',label:'— Skip this column —'}];
function autoDetectMapping(headers){const map={};const patterns={name:/name|owner|contact|first.*last|full.?name/i,address:/address|property|street|location/i,company:/company|trust|entity|business|org/i,email:/email|e-mail/i,phone:/phone|mobile|cell|tel/i,stage:/stage|status|pipeline/i,priority:/priority|urgency/i,interest:/interest|service|type/i,leadSource:/source|lead.?source|how/i,followup:/follow.?up|next.?contact|date/i};headers.forEach(h=>{let matched='skip';for(const[field,pattern]of Object.entries(patterns)){if(pattern.test(h)){matched=field;break;}}map[h]=matched;});return map;}
function openCSVImport(){document.getElementById('csv-import-overlay').style.display='flex';importRows=[];importHeaders=[];document.getElementById('import-preview-section').style.display='none';document.getElementById('import-modal-actions').style.display='none';document.getElementById('import-file-input').value='';}
function closeCSVImport(){document.getElementById('csv-import-overlay').style.display='none';}
function handleImportDrop(e){e.preventDefault();document.getElementById('import-dropzone').classList.remove('dragover');const file=e.dataTransfer.files[0];if(file)handleImportFile(file);}
async function handleImportFile(file){if(!file)return;document.getElementById('import-file-name').textContent=file.name;const ext=file.name.split('.').pop().toLowerCase();if(ext==='csv'){const text=await file.text();parseCSV(text);}else if(ext==='xlsx'||ext==='xls'){await parseExcel(file);}}
function parseCSV(text){const lines=text.trim().split(/\r?\n/);if(lines.length<2)return;importHeaders=parseCSVLine(lines[0]);importRows=lines.slice(1).filter(l=>l.trim()).map(l=>{const vals=parseCSVLine(l);const row={};importHeaders.forEach((h,i)=>row[h]=vals[i]||'');return row;});renderImportPreview();}
function parseCSVLine(line){const result=[];let current='';let inQuotes=false;for(let i=0;i<line.length;i++){if(line[i]==='"'){inQuotes=!inQuotes;}else if(line[i]===','&&!inQuotes){result.push(current.trim());current='';}else{current+=line[i];}}result.push(current.trim());return result;}
async function parseExcel(file){if(!window.XLSX){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}const data=await file.arrayBuffer();const workbook=XLSX.read(data,{type:'array'});const sheet=workbook.Sheets[workbook.SheetNames[0]];const json=XLSX.utils.sheet_to_json(sheet,{header:1});if(json.length<2)return;importHeaders=json[0].map(h=>String(h));importRows=json.slice(1).filter(r=>r.some(c=>c)).map(r=>{const row={};importHeaders.forEach((h,i)=>row[h]=String(r[i]||''));return row;});renderImportPreview();}
function renderImportPreview(){document.getElementById('import-row-count').textContent=importRows.length+' rows found';document.getElementById('import-summary-num').textContent=importRows.length;const table=document.getElementById('import-preview-table');const preview=importRows.slice(0,5);table.innerHTML=`<thead><tr>${importHeaders.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${preview.map(r=>`<tr>${importHeaders.map(h=>`<td>${esc(r[h]||'')}</td>`).join('')}</tr>`).join('')}</tbody>`;const mapping=autoDetectMapping(importHeaders);const grid=document.getElementById('import-mapping-grid');grid.innerHTML=importHeaders.map(h=>`<div class="mapping-row"><span class="mapping-csv-col" title="${esc(h)}">${esc(h)}</span><span class="mapping-arrow">→</span><select class="mapping-select" id="map-${esc(h)}">${CRM_FIELDS.map(f=>`<option value="${f.key}"${mapping[h]===f.key?' selected':''}>${f.label}</option>`).join('')}</select></div>`).join('');document.getElementById('import-preview-section').style.display='block';document.getElementById('import-modal-actions').style.display='flex';}
async function runImport(){if(!importRows.length)return;const fieldMap={};importHeaders.forEach(h=>{const sel=document.getElementById('map-'+esc(h));if(sel&&sel.value!=='skip')fieldMap[h]=sel.value;});const stageMap={'cold prospects':0,'active prospects':1,'meeting set':2,'proposal sent':3,'agreement sent':4,'closed':5,'engaged':5,'closed/engaged':5};const priorityMap={'high':'high','medium':'med','med':'med','low':'low'};const interestMap={'property management':'pm','property mgmt':'pm','investment sales':'inv','leasing':'lea'};const sourceMap={'cold call':'cold','referral':'referral','direct mail':'mail','website':'website','walk-in':'walkin','social media':'social'};let imported=0;for(const row of importRows){const lead={name:'',address:'',company:'',email:'',phone:'',stage:0,priority:'med',interest:'pm',leadSource:'cold',followup:'',followupType:'call',attempts:0,notes:[]};for(const[csvCol,crmField]of Object.entries(fieldMap)){const val=(row[csvCol]||'').trim();if(!val)continue;if(crmField==='stage'){lead.stage=stageMap[val.toLowerCase()]??0;}else if(crmField==='priority'){lead.priority=priorityMap[val.toLowerCase()]||'med';}else if(crmField==='interest'){lead.interest=interestMap[val.toLowerCase()]||'pm';}else if(crmField==='leadSource'){lead.leadSource=sourceMap[val.toLowerCase()]||'cold';}else{lead[crmField]=val;}}if(!lead.name&&!lead.address)continue;await saveNewLead(lead);imported++;}closeCSVImport();render();alert(imported+' leads imported successfully!');}

// ── Tab switching ─────────────────────────────────────────
function switchTab(tab){
  activeTab=tab;
  ['pipeline','analytics','followups','reports'].forEach(t=>{
    const panel=document.getElementById('panel-'+t);
    const btn=document.getElementById('tab-'+t);
    if(panel) panel.style.display=t===tab?'':'none';
    if(btn) btn.classList.toggle('active',t===tab);
  });
  document.getElementById('btn-add-lead').style.display=tab==='pipeline'?'':'none';
  const searchWrap=document.getElementById('search-wrap');
  if(searchWrap) searchWrap.style.display=tab==='pipeline'?'':'none';
  const title=document.getElementById('page-title');
  const sub=document.getElementById('page-subtitle');
  const titles={
    pipeline:['Pipeline','Manage your property leads'],
    followups:['Follow-ups','Leads that need your attention today'],
    analytics:['Activity tracker','Log calls, meetings and weekly activity'],
    reports:['Reports','Pipeline analytics and performance metrics'],
  };
  if(titles[tab]){if(title)title.textContent=titles[tab][0];if(sub)sub.textContent=titles[tab][1];}
  if(tab==='analytics') renderAnalytics();
  if(tab==='followups') renderFollowups();
  if(tab==='reports') renderReports();
  closeSidebar();
}

//  Analytics helpers 
function getWeekDates(offset){
  // Returns Mon–Fri for the week at offset (0=current)
  const now=new Date();
  const day=now.getDay(); // 0=Sun
  const monday=new Date(now);
  monday.setDate(now.getDate() - (day===0?6:day-1) + offset*7);
  return Array.from({length:5},(_,i)=>{
    const d=new Date(monday); d.setDate(monday.getDate()+i);
    return d.toISOString().split('T')[0];
  });
}
function getWeekLabel(offset){
  const dates=getWeekDates(offset);
  const fmt=d=>{ const [y,m,dd]=d.split('-'); const mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return mn[+m-1]+' '+parseInt(dd); };
  return fmt(dates[0])+' – '+fmt(dates[6]);
}
function getDay(dateStr){ return activityLog[dateStr]||{calls:0,convos:0,letters:0,meetings:0,proposals:0,agreements:0}; }
function weekTotal(dates, key){ return dates.reduce((s,d)=>s+(getDay(d)[key]||0),0); }
function setMetric(dateStr, key, val){
  if(!activityLog[dateStr]) activityLog[dateStr]={calls:0,convos:0,letters:0,meetings:0,proposals:0,agreements:0};
  activityLog[dateStr][key]=Math.max(0,parseInt(val)||0);
  if(usingCloud) saveActivity(dateStr); else lsSaveActivity();
}

//  Analytics render 
function renderAnalytics(){
  const root=document.getElementById('analytics-root');
  if(!root)return;
  const dates=getWeekDates(analyticsWeekOffset);
  const today=todayStr();
  const isCurrent=analyticsWeekOffset===0;
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // Weekly totals
  const totals={};
  METRICS.forEach(m=>{ totals[m.key]=weekTotal(dates,m.key); });

  let html=`<div class="analytics-header">
    <div>
      <div style="font-size:18px;font-weight:600;letter-spacing:-.02em">Activity tracker</div>
      <div style="font-size:12px;color:var(--text3);margin-top:2px">${getWeekLabel(analyticsWeekOffset)}</div>
    </div>
    <div class="week-nav">
      <button class="week-nav-btn" onclick="shiftWeek(-1)" aria-label="Previous week">&#8249;</button>
      <span class="week-label">${analyticsWeekOffset===0?'This week':analyticsWeekOffset===-1?'Last week':getWeekLabel(analyticsWeekOffset)}</span>
      <button class="week-nav-btn" onclick="shiftWeek(1)" ${isCurrent?'disabled':''} aria-label="Next week">&#8250;</button>
    </div>
  </div>`;

  // Stat cards
  html+=`<div class="analytics-stats">`;
  METRICS.forEach(m=>{
    const pct=totals.calls>0&&m.key!=='calls'?Math.round(totals[m.key]/totals.calls*100):null;
    const callCap=200;
    html+=`<div class="analytics-stat">
      <div class="analytics-stat-label">${m.label}</div>
      <div class="analytics-stat-val" style="color:${m.color}">${totals[m.key]}</div>
      <div class="analytics-stat-sub">${m.key==='calls'?`${Math.round(totals[m.key]/7)} avg/day · goal 200`:pct!==null?pct+'% of calls':'this week'}</div>
      <div class="analytics-stat-bar" style="background:${m.color};width:${m.key==='calls'?Math.min(100,Math.round(totals[m.key]/(7*200)*100)):Math.min(100,totals[m.key])}%"></div>
    </div>`;
  });
  html+=`</div>`;

  // Charts row
  html+=`<div class="charts-row">`;

  // Line chart — call volume
  const callVals=dates.map(d=>getDay(d).calls);
  const convoVals=dates.map(d=>getDay(d).convos);
  const maxCall=Math.max(...callVals,1);
  html+=`<div class="chart-card">
    <div class="chart-title">Call volume</div>
    <div class="chart-sub">${totals.calls} calls · ${totals.convos} conversations</div>
    <div class="chart-area" id="line-chart-area">
      ${renderLineChart(days,callVals,convoVals,maxCall)}
    </div>
    <div class="chart-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#b7611a"></div>Cold calls</div>
      <div class="legend-item"><div class="legend-dot" style="background:#1d5fa6"></div>Conversations</div>
    </div>
  </div>`;

  // Stacked bar chart — all metrics per day
  html+=`<div class="chart-card">
    <div class="chart-title">Daily breakdown</div>
    <div class="chart-sub">Letters ·Meetings · Proposals · Agreements</div>
    <div class="chart-area">
      ${renderBarChart(days,dates)}
    </div>
    <div class="chart-legend">
      ${METRICS.slice(2).map(m=>`<div class="legend-item"><div class="legend-dot" style="background:${m.color}"></div>${m.label}</div>`).join('')}
    </div>
  </div>`;

  html+=`</div>`;

  // Daily log table
  const colCount=METRICS.length+2;
  const gridCols=`140px repeat(${METRICS.length},1fr)`;
  html+=`<div class="day-log">
    <div class="day-log-header" style="grid-template-columns:${gridCols}">
      <div>Day</div>
      ${METRICS.map(m=>`<div style="text-align:center">${m.label}</div>`).join('')}
    </div>`;

  dates.forEach((dateStr,i)=>{
    const isToday=dateStr===today;
    const isFuture=dateStr>today;
    const d=getDay(dateStr);
    const dayName=days[i];
    const [y,mo,dd]=dateStr.split('-');
    const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateLabel=monthNames[+mo-1]+' '+parseInt(dd);
    html+=`<div class="day-log-row${isToday?' today-row':''}" style="grid-template-columns:${gridCols}">
      <div>
        <div class="day-col-day">${dayName} ${isToday?'<span class="today-badge">today</span>':''}</div>
        <div class="day-col-date">${dateLabel}</div>
      </div>
      ${METRICS.map(m=>`<div class="metric-cell" style="justify-content:center">
        <input type="number" class="metric-input" min="0" value="${d[m.key]||0}"
          aria-label="${m.label} for ${dayName}"
          ${isFuture?'disabled style="opacity:.4"':''}
          onchange="setMetric('${dateStr}','${m.key}',this.value);renderAnalytics()"
          oninput="this.value=this.value.replace(/[^0-9]/g,'')">
      </div>`).join('')}
    </div>`;
  });
  html+=`</div>`;

  root.innerHTML=html;
}

function renderLineChart(labels, vals1, vals2, maxVal){
  maxVal=Math.max(maxVal,200);
  const W=500, H=160, padL=32, padR=10, padT=10, padB=28;
  const chartW=W-padL-padR, chartH=H-padT-padB;
  const n=labels.length;
  const xStep=chartW/(n-1);
  function pts(vals){ return vals.map((v,i)=>{ const x=padL+i*xStep; const y=padT+chartH-(v/maxVal)*chartH; return`${x},${y}`; }).join(' '); }
  function polyline(vals,color,dash=''){
    return`<polyline points="${pts(vals)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:''} />`;
  }
  function dots(vals,color){ return vals.map((v,i)=>{ const x=padL+i*xStep; const y=padT+chartH-(v/maxVal)*chartH; return`<circle cx="${x}" cy="${y}" r="3.5" fill="${color}" stroke="white" stroke-width="1.5"/>`; }).join(''); }
  // y-axis labels
  const yLabels=[0,Math.round(maxVal/2),maxVal].map(v=>{ const y=padT+chartH-(v/maxVal)*chartH; return`<text x="${padL-5}" y="${y+4}" text-anchor="end" font-size="9" fill="#9c9590">${v}</text>`; }).join('');
  // x labels
  const xLabels=labels.map((l,i)=>{ const x=padL+i*xStep; return`<text x="${x}" y="${H-4}" text-anchor="middle" font-size="9" fill="#9c9590">${l}</text>`; }).join('');
  // grid lines
  const grid=[0,.25,.5,.75,1].map(p=>{ const y=padT+chartH-p*chartH; return`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#e2ddd7" stroke-width="0.5"/>`; }).join('');
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%" preserveAspectRatio="none">
    ${grid}${yLabels}${xLabels}
    ${polyline(vals1,'#b7611a')}
    ${polyline(vals2,'#1d5fa6','5,3')}
    ${dots(vals1,'#b7611a')}${dots(vals2,'#1d5fa6')}
  </svg>`;
}

function renderBarChart(labels, dates){
  const W=500, H=160, padL=28, padR=10, padT=10, padB=28;
  const chartW=W-padL-padR, chartH=H-padT-padB;
  const barMetrics=METRICS.slice(2); // letters, meetings, proposals, agreements
  const n=labels.length;
  const barW=Math.floor(chartW/n*0.55);
  const barGap=chartW/n;
  const dayTotals=dates.map(d=>{ return barMetrics.reduce((s,m)=>s+(getDay(d)[m.key]||0),0); });
  const maxVal=Math.max(...dayTotals,10);
  const grid=[0,.25,.5,.75,1].map(p=>{ const y=padT+chartH-p*chartH; return`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#e2ddd7" stroke-width="0.5"/>`; }).join('');
  const yLabels=[0,Math.round(maxVal/2),maxVal].map(v=>{ const y=padT+chartH-(v/maxVal)*chartH; return`<text x="${padL-4}" y="${y+4}" text-anchor="end" font-size="9" fill="#9c9590">${v}</text>`; }).join('');
  const xLabels=labels.map((l,i)=>{ const x=padL+i*barGap+barGap/2; return`<text x="${x}" y="${H-4}" text-anchor="middle" font-size="9" fill="#9c9590">${l}</text>`; }).join('');
  let bars='';
  dates.forEach((dateStr,i)=>{
    const x0=padL+i*barGap+(barGap-barW)/2;
    let stackY=padT+chartH;
    barMetrics.forEach(m=>{
      const v=getDay(dateStr)[m.key]||0;
      if(v===0)return;
      const h=(v/maxVal)*chartH;
      stackY-=h;
      bars+=`<rect x="${x0}" y="${stackY}" width="${barW}" height="${h}" fill="${m.color}" opacity="0.85" rx="1"/>`;
    });
  });
  return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%" preserveAspectRatio="none">
    ${grid}${yLabels}${xLabels}${bars}
  </svg>`;
}

function shiftWeek(delta){
  const newOffset=analyticsWeekOffset+delta;
  if(newOffset>0)return;
  analyticsWeekOffset=newOffset;
  renderAnalytics();
}

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(showAddModal||showDetailModal))closeAll();});

// Add spin animation
const _styleEl=document.createElement('style');
_styleEl.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(_styleEl);

//  Startup 
// Try Supabase first, fall back to localStorage if it fails
const LS_FALLBACK='property_crm_local_v1';
const LS_ACTIVITY_FALLBACK='property_crm_activity_local_v1';

function lsSave(){
  try{ localStorage.setItem(LS_FALLBACK, JSON.stringify({leads,nextId,nextNoteId})); } catch(e){}
}
function lsSaveActivity(){
  try{ localStorage.setItem(LS_ACTIVITY_FALLBACK, JSON.stringify(activityLog)); } catch(e){}
}
function lsLoad(){
  try{
    const r=localStorage.getItem(LS_FALLBACK);
    if(r){ const d=JSON.parse(r); leads=d.leads||[]; nextId=d.nextId||1; nextNoteId=d.nextNoteId||20; return true; }
  } catch(e){}
  return false;
}
function lsLoadActivity(){
  try{ const r=localStorage.getItem(LS_ACTIVITY_FALLBACK); if(r){ activityLog=JSON.parse(r); return; } } catch(e){}
  activityLog={};
}

let usingCloud=false;

(async()=>{
  checkAuth();
  // Copy logo to login page
  const loginLogoImg=document.getElementById('login-logo-img');
  const sidebarLogoImg=document.querySelector('.sb-logo-icon img');
  if(loginLogoImg&&sidebarLogoImg) loginLogoImg.innerHTML=`<img src="${sidebarLogoImg.src}" style="width:48px;height:48px;object-fit:contain">`;
  setLoading(true,'Connecting…');
  try{
    // Test Supabase connection
    const test=await fetch(`${SB_URL}/rest/v1/leads?limit=1`,{headers:{...SB_HEADERS,'Accept':'application/json'}});
    if(test.ok){
      usingCloud=true;
      await loadData();
      await loadActivity();
      setLoading(false);
      render();
      // Show cloud indicator
      const flash=document.getElementById('save-flash');
      if(flash){flash.textContent='Cloud connected';flash.className='save-flash cloud';flash.style.opacity='1';setTimeout(()=>flash.style.opacity='0',3000);}
    } else {
      throw new Error('Supabase returned '+test.status);
    }
  } catch(e){
    console.warn('Supabase unavailable, using local storage:',e.message);
    usingCloud=false;
    if(!lsLoad()){ leads=[]; nextId=1; nextNoteId=20; }
    lsLoadActivity();
    setLoading(false);
    render();
    const flash=document.getElementById('save-flash');
    if(flash){flash.textContent='Offline mode';flash.className='save-flash offline';flash.style.opacity='1';setTimeout(()=>flash.style.opacity='0',4000);}
  }
})();

// ── TWILIO DIALER ─────────────────────────────────────────
let twilioDevice=null,activeCall=null,dialerOpen=false,callTimer=null,callSeconds=0,currentCallLeadId=null,isMuted=false;

async function initTwilio(){
  try{
    setDialerStatus('Loading...','');
    
    // Dynamically load Twilio Voice SDK v2
    await new Promise((resolve,reject)=>{
      if(window.Twilio&&window.Twilio.Device){resolve();return;}
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@2.10.0/dist/twilio.min.js';
      s.onload=resolve;
      s.onerror=()=>{
        // Fallback to unpkg
        const s2=document.createElement('script');
        s2.src='https://unpkg.com/@twilio/voice-sdk@2.10.0/dist/twilio.min.js';
        s2.onload=resolve;s2.onerror=reject;
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    });
    
    await new Promise(r=>setTimeout(r,300));
    
    if(!window.Twilio||!window.Twilio.Device){
      setDialerStatus('SDK error','');return;
    }
    
    setDialerStatus('Connecting...','');
    const res=await fetch('/api/twilio-token',{method:'POST',headers:{'Content-Type':'application/json'}});
    const data=await res.json();
    if(!data.token){setDialerStatus('Token error','');return;}
    
    const {Device}=window.Twilio;
    twilioDevice=new Device(data.token,{
      codecPreferences:['opus','pcmu'],
      enableRingingState:true,
    });
    
    twilioDevice.on('registered',()=>setDialerStatus('Ready','ready'));
    twilioDevice.on('error',(e)=>{console.error('Device error:',e);setDialerStatus('Error','');});
    
    await twilioDevice.register();
    
  }catch(e){
    console.error('Twilio init:',e);
    setDialerStatus('Error','');
  }
}

function toggleDialer(){
  dialerOpen=!dialerOpen;
  document.getElementById('dialer-panel').classList.toggle('open',dialerOpen);
  if(dialerOpen&&!twilioDevice)initTwilio();
}

function openDialerForLead(leadId,name,phone){
  currentCallLeadId=leadId;dialerOpen=true;
  document.getElementById('dialer-panel').classList.add('open');
  document.getElementById('dialer-lead-info').style.display='block';
  document.getElementById('dialer-lead-name').textContent=name;
  document.getElementById('dialer-lead-num').textContent=phone;
  document.getElementById('dialer-input').value=phone;
  document.getElementById('dialer-number-wrap').style.display='none';
  if(!twilioDevice)initTwilio();
}

async function dialerCall(){
  const num=document.getElementById('dialer-input').value.replace(/[^0-9+]/g,'');
  if(!num){alert('Enter a phone number');return;}
  
  // If device not ready, init and wait
  if(!twilioDevice){
    setDialerStatus('Connecting...','');
    await initTwilio();
    // Wait up to 5 seconds for device to register
    let waited=0;
    while(!twilioDevice && waited<5000){
      await new Promise(r=>setTimeout(r,500));
      waited+=500;
    }
  }
  
  if(!twilioDevice){setDialerStatus('Not ready — try again','');return;}
  
  try{
    setDialerStatus('Calling...','calling');
    const formattedNum=num.startsWith('+')?num:'+1'+num;
    activeCall=await twilioDevice.connect({params:{To:formattedNum}});
    activeCall.on('accept',onCallConnected);
    activeCall.on('disconnect',onCallEnded);
    activeCall.on('error',(e)=>{console.error(e);onCallEnded();});
  }catch(e){
    console.error('Call error:',e);
    setDialerStatus('Failed: '+e.message,'');
  }
}

function onCallConnected(){
  setDialerStatus('On call','calling');
  document.getElementById('dial-call-btn').style.display='none';
  document.getElementById('dial-hangup-btn').style.display='flex';
  document.getElementById('dial-mute-btn').style.display='flex';
  document.getElementById('dialer-timer').style.display='block';
  document.getElementById('dialer-toggle-btn').classList.add('active');
  callSeconds=0;
  callTimer=setInterval(()=>{
    callSeconds++;
    const m=Math.floor(callSeconds/60),s=callSeconds%60;
    document.getElementById('dialer-timer').textContent=m+':'+(s<10?'0':'')+s;
  },1000);
}

function onCallEnded(){
  clearInterval(callTimer);
  document.getElementById('dial-call-btn').style.display='flex';
  document.getElementById('dial-hangup-btn').style.display='none';
  document.getElementById('dial-mute-btn').style.display='none';
  document.getElementById('dialer-timer').style.display='none';
  document.getElementById('dialer-toggle-btn').classList.remove('active');
  isMuted=false;
  document.getElementById('dialer-note-text').style.display='block';
  document.getElementById('dialer-note-actions').style.display='flex';
  document.getElementById('dialer-note-text').value='';
  document.getElementById('dialer-note-text').focus();
  setDialerStatus('Ready','ready');
}

function dialerHangup(){if(activeCall){activeCall.disconnect();activeCall=null;}}

function dialerMute(){
  if(!activeCall)return;
  isMuted=!isMuted;activeCall.mute(isMuted);
  document.getElementById('dial-mute-btn').classList.toggle('muted',isMuted);
}

async function dialerSaveNote(){
  const text=document.getElementById('dialer-note-text').value.trim();
  const m=Math.floor(callSeconds/60),s=callSeconds%60;
  const durStr=m+'m '+(s<10?'0':'')+s+'s';
  let noteText='Call — '+durStr;
  if(text)noteText+=': '+text;
  if(currentCallLeadId){
    const lead=leads.find(l=>l.id===currentCallLeadId);
    if(lead){
      if(!lead.notes)lead.notes=[];
      lead.notes.unshift({id:Date.now(),date:todayStr(),text:noteText});
      lead.attempts=(lead.attempts||0)+1;
      await save(lead);
    }
  }
  document.getElementById('dialer-note-text').style.display='none';
  document.getElementById('dialer-note-actions').style.display='none';
}

function dialerSkipNote(){
  document.getElementById('dialer-note-text').style.display='none';
  document.getElementById('dialer-note-actions').style.display='none';
}

function setDialerStatus(text,cls){
  const el=document.getElementById('dialer-status');
  if(el){el.textContent=text;el.className='dialer-status '+cls;}
}

async function connectDialer(){
  document.getElementById('dialer-connect-wrap').style.display='none';
  // Request microphone permission explicitly first
  try{
    await navigator.mediaDevices.getUserMedia({audio:true});
    setDialerStatus('Mic allowed','ready');
  }catch(e){
    setDialerStatus('Allow microphone!','');
    document.getElementById('dialer-connect-wrap').style.display='block';
    return;
  }
  await initTwilio();
}
