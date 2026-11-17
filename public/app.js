"use strict";
/* Cliente da Fase 1 — fala apenas com a API. O servidor decide tudo. */

const TOKEN_KEY = "ptlog_fase1_token";
let token = localStorage.getItem(TOKEN_KEY) || null;
let S = null, tab = "mercado", authMode = "login";

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => (n<0?"-":"") + "€" + Math.abs(n).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2});
const dt = t => new Date(t).toLocaleString("pt-PT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const hhmm = t => new Date(t).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"});
const dur = ms => { const m=Math.round(ms/60000); return (m>=60?Math.floor(m/60)+"h ":"")+(m%60)+"m"; };
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

const I = {
  cash:'<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="3"/><path d="M6 6V4h12v2"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  truck:'<svg viewBox="0 0 24 24"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6.5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  trend:'<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
  market:'<svg viewBox="0 0 24 24"><path d="M3 9h18l-1.5-5h-15zM5 9v11h14V9M9 20v-6h6v6"/></svg>',
  fleet:'<svg viewBox="0 0 24 24"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6.5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 20v-2a5 5 0 0 0-3-4.6"/></svg>',
  finance:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  history:'<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  pin:'<svg viewBox="0 0 24 24"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  box:'<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>'
};

const CITIES = [
  {n:"Lisboa",lo:-9.14,la:38.72},{n:"Porto",lo:-8.61,la:41.15},{n:"Braga",lo:-8.43,la:41.55},
  {n:"Aveiro",lo:-8.65,la:40.64},{n:"Coimbra",lo:-8.43,la:40.21},{n:"Leiria",lo:-8.80,la:39.74},
  {n:"Santarém",lo:-8.69,la:39.24},{n:"Setúbal",lo:-8.89,la:38.52},{n:"Évora",lo:-7.91,la:38.57},
  {n:"Beja",lo:-7.86,la:38.02},{n:"Faro",lo:-7.93,la:37.02},{n:"Portimão",lo:-8.54,la:37.14},
  {n:"Viseu",lo:-7.91,la:40.66},{n:"Guarda",lo:-7.27,la:40.54},{n:"Castelo Branco",lo:-7.49,la:39.82},
  {n:"Vila Real",lo:-7.75,la:41.30},{n:"Bragança",lo:-6.76,la:41.80}
];
const BASES = ["Lisboa","Porto","Braga","Aveiro","Coimbra","Faro","Évora"];
const VANS = { van:{name:"Carrinha",price:14000,kg:800,m3:4,l100:8}, truck:{name:"Camião leve",price:24000,kg:3000,m3:14,l100:12.5} };
const OUTLINE = [
  [-8.85,42.15],[-8.60,42.14],[-8.30,42.05],[-8.05,41.95],[-7.85,41.92],[-7.65,41.88],
  [-7.40,41.92],[-7.10,41.95],[-6.80,42.00],[-6.55,41.92],[-6.30,41.78],[-6.18,41.60],
  [-6.28,41.42],[-6.45,41.28],[-6.62,41.18],[-6.80,41.10],[-6.92,40.95],[-7.02,40.78],
  [-6.92,40.60],[-6.80,40.40],[-6.78,40.20],[-6.88,40.00],[-7.02,39.82],[-7.12,39.62],
  [-7.00,39.45],[-6.88,39.28],[-6.98,39.08],[-7.10,38.90],[-7.00,38.72],[-7.08,38.55],
  [-7.28,38.40],[-7.42,38.25],[-7.32,38.08],[-7.18,37.95],[-7.32,37.82],[-7.52,37.72],
  [-7.45,37.55],[-7.28,37.42],[-7.35,37.25],[-7.18,37.10],[-7.02,37.02],[-7.30,36.98],
  [-7.55,37.05],[-7.85,37.02],[-8.12,36.98],[-8.35,37.02],[-8.55,37.10],[-8.75,37.18],
  [-8.92,37.10],[-8.98,37.28],[-8.90,37.45],[-8.82,37.62],[-8.80,37.80],[-8.88,38.00],
  [-9.02,38.18],[-9.22,38.35],[-9.42,38.52],[-9.50,38.70],[-9.38,38.85],[-9.28,39.00],
  [-9.32,39.20],[-9.20,39.42],[-8.98,39.55],[-8.85,39.70],[-8.88,39.92],[-8.98,40.15],
  [-8.92,40.38],[-8.80,40.55],[-8.86,40.78],[-8.88,41.00],[-8.78,41.20],[-8.84,41.40],
  [-8.92,41.60],[-8.88,41.82]
];
const ROADS = [
  ["Braga","Porto"],["Braga","Vila Real"],["Vila Real","Bragança"],["Vila Real","Viseu"],
  ["Porto","Aveiro"],["Aveiro","Viseu"],["Viseu","Guarda"],["Guarda","Castelo Branco"],
  ["Aveiro","Coimbra"],["Coimbra","Leiria"],["Leiria","Lisboa"],["Lisboa","Santarém"],
  ["Santarém","Castelo Branco"],["Castelo Branco","Évora"],["Lisboa","Setúbal"],
  ["Setúbal","Évora"],["Évora","Beja"],["Beja","Faro"],["Faro","Portimão"],["Portimão","Beja"],
  ["Coimbra","Castelo Branco"],["Porto","Viseu"],["Lisboa","Évora"]
];
const MAJOR = [["Porto","Coimbra"],["Coimbra","Lisboa"],["Lisboa","Setúbal"],["Évora","Beja"],["Beja","Faro"]];
const RIVERS = [
  [[-7.90,40.70],[-8.20,41.00],[-8.45,41.10],[-8.61,41.15]],
  [[-7.49,39.82],[-8.10,39.50],[-8.69,39.24],[-9.14,38.72]]
];
const LABEL = {
  Lisboa:[-10,-9,"end"], Porto:[-10,-10,"end"], Braga:[9,-8,"start"], Aveiro:[9,4,"start"],
  Coimbra:[9,4,"start"], Leiria:[-9,-9,"end"], Santarém:[9,4,"start"], Setúbal:[-9,13,"end"],
  Évora:[9,4,"start"], Beja:[9,4,"start"], Faro:[9,4,"start"], Portimão:[-9,13,"end"],
  Viseu:[9,-8,"start"], Guarda:[9,-8,"start"], "Castelo Branco":[9,4,"start"],
  "Vila Real":[9,-8,"start"], Bragança:[9,-8,"start"]
};
const proj = (lo,la) => [ (lo+9.75)/3.65*900, (42.35-la)/5.55*700 ];
const cityOf = n => CITIES.find(c=>c.n===n);
function curve(a,b,bend){
  const [x1,y1]=proj(a.lo,a.la), [x2,y2]=proj(b.lo,b.la);
  const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1;
  return {x1,y1,x2,y2,cx:(x1+x2)/2+(-dy/len)*bend, cy:(y1+y2)/2+(dx/len)*bend};
}
function bez(p,t){ const u=1-t; return {x:u*u*p.x1+2*u*t*p.cx+t*t*p.x2, y:u*u*p.y1+2*u*t*p.cy+t*t*p.y2}; }
function bezAngle(p,t){ const u=1-t; return Math.atan2(2*u*(p.cy-p.y1)+2*t*(p.y2-p.cy), 2*u*(p.cx-p.x1)+2*t*(p.x2-p.cx))*180/Math.PI; }

/* ---------- API ---------- */
async function api(path, method="GET", data){
  const res = await fetch(path, {
    method,
    headers: { "Content-Type":"application/json", ...(token?{Authorization:"Bearer "+token}:{}) },
    body: data ? JSON.stringify(data) : undefined
  });
  const j = await res.json().catch(()=>({}));
  if (!res.ok) throw Error(j.error || ("Erro " + res.status));
  return j;
}
async function refresh(){
  try { S = await api("/api/state"); render(); }
  catch(e){ if (/Sessão/.test(e.message)) { token=null; localStorage.removeItem(TOKEN_KEY); showAuth(); } else toast(e.message,true); }
}
async function act(fn){
  try { await fn(); await refresh(); }
  catch(e){ toast(e.message,true); }
}

/* ---------- utilidades visuais ---------- */
function toast(msg,bad){
  const el=$("toast"); el.textContent=msg; el.className="toast show"+(bad?" bad":"");
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.className="toast",3200);
}
function modal(html){ $("modalRoot").innerHTML='<div class="overlay"><div class="modal">'+html+'</div></div>'; }
function closeModal(){ $("modalRoot").innerHTML=""; }
function empty(title,text){ return '<div class="empty">'+I.box+'<strong>'+esc(title)+'</strong><p>'+esc(text)+'</p></div>'; }

/* ---------- autenticação ---------- */
function showAuth(){
  modal(`<div class="modal-ico">${I.shield}</div>
    <h2>Portugal Logística</h2>
    <p class="sub">A sua empresa, a sua frota, os seus contratos. O progresso fica guardado no servidor.</p>
    <div class="seg"><button id="mLogin" class="${authMode==="login"?"on":""}">Entrar</button><button id="mReg" class="${authMode==="register"?"on":""}">Criar empresa</button></div>
    <form id="authForm">
      <label>Utilizador</label><input id="aUser" autocomplete="username" maxlength="20" required>
      <label>Senha</label><input id="aPass" type="password" autocomplete="current-password" minlength="6" required>
      <div id="regFields" style="display:${authMode==="register"?"block":"none"}">
        <label>Nome da empresa</label><input id="aCompany" maxlength="40" value="Transportes do Minho">
        <label>Base inicial</label><select id="aBase">${BASES.map(b=>`<option>${b}</option>`).join("")}</select>
      </div>
      <div class="err" id="authErr"></div>
      <div class="actions"><button class="btn primary wide" type="submit">${authMode==="login"?"Entrar":"Criar conta e empresa"}</button></div>
    </form>`);
  $("mLogin").onclick=()=>{authMode="login";showAuth();};
  $("mReg").onclick=()=>{authMode="register";showAuth();};
  $("authForm").onsubmit = async e => {
    e.preventDefault();
    const err=$("authErr"); err.textContent="";
    try {
      const payload = authMode==="register"
        ? {username:$("aUser").value.trim(),password:$("aPass").value,company:$("aCompany").value.trim(),base:$("aBase").value}
        : {username:$("aUser").value.trim(),password:$("aPass").value};
      const r = await api(authMode==="register"?"/api/register":"/api/login","POST",payload);
      token=r.token; localStorage.setItem(TOKEN_KEY,token);
      closeModal(); await refresh(); toast("Sessão iniciada. Bem-vindo!");
    } catch(ex){ err.textContent=ex.message; }
  };
}

/* ---------- mapa ---------- */
function renderMap(){
  if (!S) return;
  const poly = OUTLINE.map(p=>proj(p[0],p[1]).map(v=>v.toFixed(1)).join(",")).join(" ");
  let s = `<defs>
    <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4965"/><stop offset="1" stop-color="#11304a"/></linearGradient>
    <filter id="landShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".55"/></filter>
    <filter id="amberGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="seaGrid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#4e86ab" stroke-opacity=".07"/></pattern>
    <clipPath id="landClip"><polygon points="${poly}"/></clipPath>
  </defs>`;
  s += '<rect width="900" height="700" fill="url(#seaGrid)"/>';
  for(let y=100;y<700;y+=100) s+=`<line class="gridline" x1="0" y1="${y}" x2="900" y2="${y}"/>`;
  for(let x=100;x<900;x+=100) s+=`<line class="gridline" x1="${x}" y1="0" x2="${x}" y2="700"/>`;

  s += `<polygon class="land" points="${poly}"/>`;
  const regions = [
    {t:"NORTE",fill:"#2f8fc0",p:[-7.55,41.55]}, {t:"CENTRO",fill:"#4b9fc7",p:[-7.65,40.35]},
    {t:"LISBOA",fill:"#3a86b8",p:[-8.55,39.20]}, {t:"ALENTEJO",fill:"#2b7aa8",p:[-7.55,38.15]},
    {t:"ALGARVE",fill:"#4a9fc4",p:[-7.95,37.30]}
  ];
  s += '<g clip-path="url(#landClip)">';
  for(const r of regions){
    const [x,y]=proj(r.p[0],r.p[1]);
    s += `<circle cx="${x}" cy="${y}" r="115" fill="${r.fill}" opacity=".12"/>`;
    s += `<text class="region-label" x="${x}" y="${y}">${r.t}</text>`;
  }
  s += '</g>';

  for(const pair of ROADS){
    const c=curve(cityOf(pair[0]),cityOf(pair[1]),10);
    s += `<path class="road" d="M${c.x1.toFixed(1)},${c.y1.toFixed(1)} Q${c.cx.toFixed(1)},${c.cy.toFixed(1)} ${c.x2.toFixed(1)},${c.y2.toFixed(1)}"/>`;
  }
  for(const pair of MAJOR){
    const c=curve(cityOf(pair[0]),cityOf(pair[1]),14);
    s += `<path class="road major" d="M${c.x1.toFixed(1)},${c.y1.toFixed(1)} Q${c.cx.toFixed(1)},${c.cy.toFixed(1)} ${c.x2.toFixed(1)},${c.y2.toFixed(1)}"/>`;
  }
  for(const river of RIVERS){
    const pts=river.map(p=>proj(p[0],p[1]).map(v=>v.toFixed(1)).join(",")).join(" ");
    s += `<polyline class="river" points="${pts}"/>`;
  }

  for(const c of CITIES){
    const [x,y]=proj(c.lo,c.la), base=S.company.base===c.n, [dx,dy,anchor]=LABEL[c.n]||[9,4,"start"];
    s += `<g class="city${base?" base":""}"><title>${esc(c.n)}</title>`;
    if(base) s += `<circle class="base-halo" cx="${x}" cy="${y}" r="9"/>`;
    s += `<circle class="city-dot" cx="${x}" cy="${y}" r="${base?5:3.4}"/>`;
    s += `<text class="city-label" x="${x+dx}" y="${y+dy}" text-anchor="${anchor}">${esc(c.n)}${base?" ★":""}</text></g>`;
  }
  for(const v of S.vehicles.filter(v=>v.status==="idle")){
    const c=cityOf(v.at); if(!c) continue;
    const [x,y]=proj(c.lo,c.la);
    s += `<g transform="translate(${x-11},${y+12}) scale(.8)"><rect class="van-body" x="-8" y="-6" width="10" height="8" rx="1.5"/><rect class="van-body" x="2" y="-4" width="7" height="6" rx="1.5"/><circle class="van-wheel" cx="-5" cy="3" r="2"/><circle class="van-wheel" cx="5" cy="3" r="2"/></g>`;
  }

  for(const t of S.trips.filter(t=>!t.processed_at)){
    const a=cityOf(t.from_city||t.from), b=cityOf(t.to_city||t.to); if(!a||!b) continue;
    const p=clamp((S.company.now-t.start_at)/(t.end_at-t.start_at),0,1);
    const c=curve(a,b,18), now=bez(c,p), angle=bezAngle(c,p);
    s += `<path class="route-line" d="M${c.x1.toFixed(1)},${c.y1.toFixed(1)} Q${c.cx.toFixed(1)},${c.cy.toFixed(1)} ${c.x2.toFixed(1)},${c.y2.toFixed(1)}"/>`;
    s += `<circle class="dest-ring" cx="${c.x2}" cy="${c.y2}" r="10"/><circle cx="${c.x2}" cy="${c.y2}" r="3" fill="#ffc75a"/>`;
    const done=`M${c.x1.toFixed(1)},${c.y1.toFixed(1)} Q${c.cx.toFixed(1)},${c.cy.toFixed(1)} ${now.x.toFixed(1)},${now.y.toFixed(1)}`;
    s += `<path class="route-done" d="${done}"/>`;
    s += `<g transform="translate(${now.x.toFixed(1)},${now.y.toFixed(1)}) rotate(${angle.toFixed(1)})"><rect class="van-body" x="-10" y="-6" width="12" height="10" rx="2"/><rect class="van-body" x="2" y="-4" width="8" height="8" rx="2"/><circle class="van-wheel" cx="-6" cy="5" r="2.4"/><circle class="van-wheel" cx="6" cy="5" r="2.4"/></g>`;
    const label=esc(t.client)+" · "+Math.round(p*100)+"%", w=Math.max(84,label.length*6.4+18);
    s += `<g transform="translate(${(now.x+13).toFixed(1)},${(now.y-28).toFixed(1)})"><rect class="route-pill-bg" width="${w}" height="20" rx="10"/><text class="route-pill-tx" x="9" y="14">${label}</text></g>`;
  }

  s += `<g transform="translate(842,58)"><circle class="compass" r="22"/><path class="compass" d="M0-16L5 0 0 16-5 0z"/><text class="compass-n" y="-27">N</text></g>`;
  s += `<g transform="translate(40,650)"><line class="scale" x1="0" y1="0" x2="60" y2="0"/><line class="scale" x1="0" y1="-4" x2="0" y2="4"/><line class="scale" x1="60" y1="-4" x2="60" y2="4"/><text class="scale-tx" x="30" y="-8">100 km</text></g>`;
  $("map").innerHTML = s;
  $("hudBase").textContent = S.company.base;
  const active=S.trips.filter(t=>!t.processed_at).length;
  $("hudOps").textContent = active ? active+" operação(ões) em curso" : "Sem operações ativas";
}

/* ---------- topo e operações ---------- */
function renderTop(){
  if(!S) return;
  $("coName").textContent = "· "+S.company.name;
  $("mapHint").textContent = S.company.speed>1 ? "modo demo "+S.company.speed+"×" : "tempo real";
  const active=S.trips.filter(t=>!t.processed_at).length, margin=S.stats.margin;
  $("kpis").innerHTML=
    `<div class="kpi"><i>${I.cash}</i><div class="ktext"><span class="kval">${money(S.company.cash)}</span><span class="klbl">Caixa</span></div></div>`+
    `<div class="kpi"><i>${I.clock}</i><div class="ktext"><span class="kval">${dt(S.company.now)}</span><span class="klbl">Data / hora</span></div></div>`+
    `<div class="kpi warn"><i>${I.truck}</i><div class="ktext"><span class="kval">${active}</span><span class="klbl">Em viagem</span></div></div>`+
    `<div class="kpi ${margin>=0?"good":"neg"}"><i>${I.trend}</i><div class="ktext"><span class="kval">${money(margin)}</span><span class="klbl">Margem</span></div></div>`;
  $("speed").innerHTML=[1,60,300].map(v=>`<button class="${S.company.speed===v?"on":""}" onclick="setSpeed(${v})">${v===1?"1×":v+"×"}</button>`).join("");
}
function renderStrip(){
  const ts=S.trips.filter(t=>!t.processed_at);
  if(!ts.length){ $("strip").innerHTML=empty("Sem operações ativas","Aceite um contrato no Mercado para começar."); return; }
  $("strip").innerHTML=ts.map(t=>{
    const p=clamp((S.company.now-t.start_at)/(t.end_at-t.start_at),0,1);
    const phase=p<.12?"Preparação":p>.88?"Descarga":"Em viagem";
    return `<div class="op"><div class="op-ico">${I.truck}</div><div class="op-main">
      <div class="op-top"><strong>${esc(t.client)}</strong><span class="pill">${phase}</span></div>
      <div class="op-sub">${esc(t.from_city)} → ${esc(t.to_city)} · chegada ${dt(t.end_at)}</div>
      <div class="op-bar"><i style="width:${(p*100).toFixed(1)}%"></i></div></div>
      <div class="op-right"><strong>${money(t.price)}</strong><small>${Math.round(p*100)}%</small></div></div>`;
  }).join("");
}

/* ---------- separadores ---------- */
const TABS=[["mercado","Mercado","market"],["frota","Frota","fleet"],["equipa","Equipa","team"],["financas","Finanças","finance"],["log","Histórico","history"]];
function renderTabs(){
  const count=S.offers.length;
  $("tabs").innerHTML=TABS.map(([k,n,ico])=>`<button class="tab ${tab===k?"on":""}" onclick="setTab('${k}')">${I[ico]}<span>${n}</span>${k==="mercado"&&count?`<i class="badge">${count}</i>`:""}</button>`).join("");
}
function renderContent(){
  $("tabContent").innerHTML=({mercado:tabMarket,frota:tabFleet,equipa:tabStaff,financas:tabFinance,log:tabLog})[tab]();
}
function tabMarket(){
  if(!S.offers.length) return empty("Mercado vazio","Volte dentro de minutos ou acelere o tempo no topo.");
  const freeVans=S.vehicles.filter(v=>v.status==="idle"), freeDrivers=S.drivers.filter(d=>d.status==="idle");
  return `<div class="section-head"><div><p class="eyebrow">Ofertas de carga geral</p><h2>Mercado de contratos</h2></div><span class="count">${S.offers.length} disponíveis</span></div>
    <p class="lead">A receita é paga na conclusão. A margem já inclui combustível, portagens, desgaste, ordenado e renda.</p>`+
    S.offers.map(o=>{
      const price=money(o.price), inicial=o.client.slice(0,2).toUpperCase();
      const ok=freeVans.some(v=>VANS[v.model].kg>=o.kg&&VANS[v.model].m3>=o.m3)&&freeDrivers.length>0;
      const left=clamp((o.expires_at-S.company.now)/(o.expires_at-o.created_at),0,1);
      const est=Math.round(o.km/100*8*1.75 + o.km*.6*.10 + o.km*.10);
      const margin=o.price-est;
      return `<div class="card"><div class="card-head">
          <div class="avatar">${esc(inicial)}</div>
          <div class="card-title"><strong>${esc(o.client)}</strong><small>Contrato · ${esc(o.from_city)} → ${esc(o.to_city)}</small></div>
          <div class="big-price"><small>receita</small><strong>${price}</strong></div></div>
        <div class="route"><div class="route-city"><small>Origem</small><strong>${esc(o.from_city)}</strong></div><div class="route-line"></div><div class="route-city right"><small>Destino</small><strong>${esc(o.to_city)}</strong></div></div>
        <div class="chips"><span class="chip">${o.km} km</span><span class="chip">${o.kg} kg</span><span class="chip">${o.m3} m³</span><span class="chip">${esc(o.window)}</span></div>
        <div class="card-foot">
          <div><div class="metric"><small>margem estimada</small><strong class="${margin>=0?"":"neg"}" style="${margin>=0?"color:var(--green)":""}">${money(margin)}</strong></div>
            <div class="hint">custo de caixa ≈ ${money(est)}</div></div>
          <div class="expiry"><div class="expiry-track"><i style="width:${(left*100).toFixed(0)}%"></i></div><small>expira ${hhmm(o.expires_at)}</small></div>
          <button class="btn primary sm" ${ok?"":"disabled"} onclick="openAccept('${o.id}')">${ok?"Aceitar":"Sem recursos"} ${ok?I.arrow:""}</button>
        </div></div>`;
    }).join("");
}
function tabFleet(){
  const owned=S.vehicles.map(v=>{
    const spec=VANS[v.model], busy=v.status==="travel";
    return `<div class="card"><div class="card-head"><div class="avatar ${busy?"a":"g"}">${I.fleet.replace('<svg','<svg style="width:18px;height:18px"')}</div>
      <div class="card-title"><strong>${esc(spec.name)}</strong><small>${busy?"Em viagem":"Disponível"} · em ${esc(v.at_city)}</small></div>
      <span class="chip">${Number(v.km).toLocaleString("pt-PT")} km</span></div>
      <div class="chips" style="margin-top:10px"><span class="chip">${spec.kg} kg</span><span class="chip">${spec.m3} m³</span><span class="chip">${spec.l100} L/100km</span></div></div>`;
  }).join("");
  const buy=Object.entries(VANS).map(([k,v])=>`<div class="card"><div class="card-head">
      <div class="avatar">${I.plus}</div><div class="card-title"><strong>${v.name}</strong><small>${v.kg} kg · ${v.m3} m³ · ${v.l100} L/100km</small></div>
      <div class="big-price"><small>preço</small><strong>${money(v.price)}</strong></div></div>
      <div class="card-foot"><span class="hint">Entregue na base ${esc(S.company.base)}</span>
      <button class="btn primary sm" ${S.company.cash>=v.price&&S.vehicles.length<2?"":"disabled"} onclick="buyVan('${k}')">Comprar</button></div></div>`).join("");
  return `<div class="section-head"><div><p class="eyebrow">Ativos da empresa</p><h2>Frota</h2></div><span class="count">${S.vehicles.length}/2</span></div>
    ${owned||empty("Sem veículos","Compre o primeiro veículo abaixo.")}<div class="subhead">Comprar veículo</div>${buy}`;
}
function tabStaff(){
  const crew=S.drivers.map(d=>{
    const busy=d.status==="travel";
    return `<div class="card"><div class="card-head"><div class="avatar ${busy?"a":"p"}">${esc(d.name.split(" ").map(x=>x[0]).join("").slice(0,2))}</div>
      <div class="card-title"><strong>${esc(d.name)}</strong><small>${busy?"Em viagem":"Disponível"} · em ${esc(d.at_city)}</small></div>
      <span class="chip">${money(1500)}/mês</span></div>
      <div class="chips" style="margin-top:10px"><span class="chip">+22% encargos</span><span class="chip">Base ${esc(S.company.base)}</span></div></div>`;
  }).join("");
  return `<div class="section-head"><div><p class="eyebrow">Recursos humanos</p><h2>Equipa</h2></div><span class="count">${S.drivers.length}/2</span></div>
    ${crew||empty("Sem motoristas","Contrate alguém para poder aceitar contratos.")}
    <div class="subhead">Contratar motorista</div>
    <div class="card"><div class="card-head"><div class="avatar">${I.team}</div><div class="card-title"><strong>Novo motorista</strong><small>Firma única · disponível de imediato</small></div>
      <div class="big-price"><small>firma</small><strong>${money(300)}</strong></div></div>
      <div class="chips" style="margin-top:10px"><span class="chip">Ordenado ${money(1500)}/mês</span><span class="chip">Encargos 22%</span></div>
      <div class="card-foot"><span class="hint">Custo mensal total ${money(1830)}</span>
      <button class="btn primary sm" ${S.company.cash>=300&&S.drivers.length<2?"":"disabled"} onclick="hire()">Contratar</button></div></div>`;
}
function tabFinance(){
  const st=S.stats;
  return `<div class="section-head"><div><p class="eyebrow">Contabilidade</p><h2>Finanças</h2></div></div>
    <div class="stat-grid">
      <div class="stat"><small>Receitas</small><strong style="color:var(--green)">${money(st.revenue)}</strong></div>
      <div class="stat"><small>Custos de viagem</small><strong style="color:var(--red)">${money(st.costs)}</strong></div>
      <div class="stat good"><small>Margem acumulada</small><strong>${money(st.margin)}</strong></div>
      <div class="stat"><small>Entregas</small><strong>${st.deliveries}</strong></div>
    </div>
    <div class="subhead">Movimentos recentes</div>
    ${S.movements.length?S.movements.map(m=>`<div class="mov ${m.amount<0?"cost":""}">
      <div class="mov-ico">${m.amount>=0?"+":"−"}</div>
      <div class="mov-main"><strong>${esc(m.description)}</strong><small>${dt(m.at)}</small></div>
      <div class="mov-val ${m.amount>=0?"good":"bad"}">${money(m.amount)}<span class="mov-bal">saldo ${money(m.balance)}</span></div></div>`).join(""):empty("Sem movimentos","Os custos e receitas aparecem aqui.")}`;
}
function tabLog(){
  return `<div class="section-head"><div><p class="eyebrow">Registo do servidor</p><h2>Histórico</h2></div></div>
    ${S.log.length?`<div class="timeline">${S.log.map(l=>`<div class="tl ${l.type==="good"?"good":l.type==="bad"?"bad":""}"><time>${dt(l.at)}</time><p>${esc(l.message)}</p></div>`).join("")}</div>`:empty("Sem eventos","Ainda não aconteceu nada.")}`;
}

/* ---------- ações ---------- */
function setSpeed(v){ act(()=>api("/api/speed","POST",{speed:v})); }
function buyVan(model){ act(()=>api("/api/vehicles/buy","POST",{model})); }
function hire(){ act(()=>api("/api/drivers/hire","POST",{})); }
function openAccept(id){
  const o=S.offers.find(x=>x.id===id); if(!o) return;
  const vans=S.vehicles.filter(v=>v.status==="idle"&&VANS[v.model].kg>=o.kg&&VANS[v.model].m3>=o.m3);
  const drivers=S.drivers.filter(d=>d.status==="idle");
  const fuel=o.km/100*8*1.75, toll=o.km*.6*.10, wear=o.km*.10, cash=fuel+toll+wear;
  const hours=o.km/65, economic=cash+1500*1.22/30/8*hours+350/30/8*hours;
  modal(`<div class="modal-ico">${I.box}</div><h2>Aceitar contrato</h2><p class="sub">${esc(o.client)} · ${esc(o.from_city)} → ${esc(o.to_city)}</p>
    <div class="summary">
      <div class="sline"><span>Receita</span><b style="color:var(--green)">${money(o.price)}</b></div>
      <div class="sline"><span>Custo de caixa</span><b>${money(cash)}</b></div>
      <div class="sline"><span>Margem económica</span><b style="color:${o.price-economic>=0?"var(--green)":"var(--red)"}">${money(o.price-economic)}</b></div>
      <div class="sline"><span>Duração estimada</span><b>${dur((o.km/65*60+50)*60000)}</b></div>
      <div class="sline"><span>Carga</span><b>${o.kg} kg · ${o.m3} m³</b></div>
    </div>
    <label>Veículo</label><select id="aVan">${vans.map(v=>`<option value="${v.id}">${VANS[v.model].name} · ${esc(v.at_city)}</option>`).join("")}</select>
    <label>Motorista</label><select id="aDr">${drivers.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join("")}</select>
    <div class="err" id="acceptErr"></div>
    <div class="actions"><button class="btn ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn primary" onclick="accept('${o.id}')">Reservar e partir ${I.arrow}</button></div>`);
}
function accept(id){
  const err=$("acceptErr"); if(err) err.textContent="";
  act(async()=>{
    try {
      await api("/api/offers/accept","POST",{offerId:id,vehicleId:Number($("aVan").value),driverId:Number($("aDr").value)});
      closeModal(); toast("Contrato reservado. Boa viagem!");
    } catch(e){ if(err) err.textContent=e.message; else throw e; }
  });
}
function logout(){
  act(async()=>{ await api("/api/logout","POST",{}); token=null; localStorage.removeItem(TOKEN_KEY); S=null; showAuth(); });
}

/* ---------- arranque ---------- */
function render(){ if(!S) return; renderTop(); renderMap(); renderStrip(); renderTabs(); renderContent(); }
function setTab(k){ tab=k; renderTabs(); renderContent(); }
$("btnLogout").onclick=logout;
$("modalRoot").addEventListener("click",e=>{ if(e.target.classList.contains("overlay")) closeModal(); });
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&token) refresh(); });
if(token) refresh(); else showAuth();
setInterval(()=>{ if(token&&!document.hidden) refresh(); },1500);
