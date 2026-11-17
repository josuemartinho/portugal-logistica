"use strict";
/* Cliente da Fase 1 — fala apenas com a API. O servidor decide tudo. */

const TOKEN_KEY = "ptlog_fase1_token";
let token = localStorage.getItem(TOKEN_KEY) || null;
let S = null, tab = "mercado", authMode = "login";
const ui = { qty:{}, whCity:"Évora", loanAmt:2000, keyLabel:"" };

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
  warehouse:'<svg viewBox="0 0 24 24"><path d="M3 21V9l9-6 9 6v12M3 21h18M8 21v-7h8v7M8 10h8"/></svg>',
  repeat:'<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  fuel:'<svg viewBox="0 0 24 24"><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6 8h6M17 21V9l3 3v9M17 13h3"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="M12 2l3 6.3 7 1-5 4.9 1.2 7L12 18l-6.2 3.2L7 14.2 2 9.3l7-1z"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  trophy:'<svg viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 14v6"/></svg>',
  key:'<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M14 9l2 2"/></svg>',
  bolt:'<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>'
};

const BASES = ["Lisboa","Porto","Braga","Aveiro","Coimbra","Faro","Évora","Setúbal","Viseu","Guimarães","Sintra"];
const VANS = { van:{name:"Carrinha",price:14000,kg:800,m3:4,l100:8}, truck:{name:"Camião leve",price:24000,kg:3000,m3:14,l100:12.5} };

/* ---------- mapa real (Leaflet + OSM/CARTO + OSRM) ---------- */
let map = null, activeBase = null, overlays = null, mapReady = false, fitDone = false;
const routeGeom = new Map(), requestedRoutes = new Set();
const mapStyle = "dark";
const layerState = { offers:true, trips:true, assets:true, history:true, companies:true, reach:true };
const TILE_STYLES = {
  dark: { url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", subdomains:"abcd", maxZoom:19,
          attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' },
  light:{ url:"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", subdomains:"abcd", maxZoom:19,
          attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' },
  sat:  { url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", maxZoom:18,
          attribution:'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics' }
};
const cityOf = n => (S && S.geo ? S.geo.cities : []).find(c => c.n === n);
const rkey = (a,b) => [a,b].sort().join("|");
function routeFor(from,to){
  const r = routeGeom.get(rkey(from,to));
  return r && r.geometry && r.geometry.length > 1 ? r : null;
}
function iconHtml(klass, symbol, title){
  return `<div class="map-pin ${klass}" title="${esc(title)}">${symbol}</div>`;
}

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

/* ---------- mapa real ---------- */
function initMap(){
  if (map || typeof L === "undefined") return;
  map = L.map("map", { zoomControl:false, attributionControl:true, preferCanvas:true, minZoom:5, maxZoom:18 })
         .setView([39.6,-8.2],6);
  L.control.zoom({ position:"bottomright" }).addTo(map);
  const st = TILE_STYLES[mapStyle];
  activeBase = L.tileLayer(st.url, { subdomains:st.subdomains||"abc", maxZoom:st.maxZoom, attribution:st.attribution }).addTo(map);
  overlays = {};
  for (const k of Object.keys(layerState)) overlays[k] = L.layerGroup().addTo(map);
  document.querySelectorAll("#mapStyles button").forEach(b => {
    b.onclick = () => {
      if (!TILE_STYLES[b.dataset.style]) return;
      map.removeLayer(activeBase);
      const c = TILE_STYLES[b.dataset.style];
      activeBase = L.tileLayer(c.url, { subdomains:c.subdomains||"abc", maxZoom:c.maxZoom, attribution:c.attribution }).addTo(map);
      document.querySelectorAll("#mapStyles button").forEach(x => x.classList.toggle("on", x === b));
    };
  });
  document.querySelectorAll("#layerToggles input").forEach(i => {
    i.onchange = () => { layerState[i.dataset.layer] = i.checked; if (S) renderMap(); };
  });
  mapReady = true;
}
function fitNetwork(){
  if (!map || !S) return;
  const pts = [];
  const add = n => { const c = cityOf(n); if (c) pts.push([c.la,c.lo]); };
  add(S.company.base);
  S.offers.forEach(o => { add(o.from_city); add(o.to_city); });
  S.trips.filter(t => !t.processed_at).forEach(t => { add(t.from_city); add(t.to_city); });
  if (pts.length > 1) map.fitBounds(pts, { padding:[46,46], maxZoom:9 });
  else if (pts.length) map.setView(pts[0], 8);
}
function routeGeometry(from, to){
  const r = routeGeom.get(rkey(from,to));
  return r && r.geometry && r.geometry.length > 1 ? r.geometry : null;
}
function partialGeometry(geom, p){
  if (!geom || geom.length < 2) return [];
  let total = 0;
  const segs = [];
  for (let i=1;i<geom.length;i++) {
    const d = Math.hypot(geom[i][1]-geom[i-1][1], geom[i][0]-geom[i-1][0]);
    segs.push(d); total += d;
  }
  let target = clamp(p,0,1) * total, acc = 0;
  const out = [geom[0]];
  for (let i=0;i<segs.length;i++) {
    if (acc + segs[i] >= target) {
      const t = segs[i] ? (target-acc)/segs[i] : 0;
      out.push([geom[i][0]+(geom[i+1][0]-geom[i][0])*t, geom[i][1]+(geom[i+1][1]-geom[i][1])*t]);
      return out;
    }
    acc += segs[i]; out.push(geom[i+1]);
  }
  return out;
}
function requestRoutes(pairs){
  const missing = [];
  for (const [a,b] of pairs) {
    if (!a || !b || a === b) continue;
    const k = rkey(a,b);
    if (!routeGeom.has(k) && !requestedRoutes.has(k)) { requestedRoutes.add(k); missing.push([a,b]); }
  }
  if (!missing.length) return;
  api("/api/geo/routes", "POST", { pairs:missing })
    .then(j => { for (const [k,r] of Object.entries(j.routes||{})) routeGeom.set(k,r); if (S) renderMap(); })
    .catch(()=>{});
}
function lineFor(from, to, style){
  const a = cityOf(from), b = cityOf(to);
  if (!a || !b) return null;
  const g = routeGeometry(from,to) || [[a.la,a.lo],[b.la,b.lo]];
  return L.polyline(g, style);
}
function renderMap(){
  if (!S || !mapReady) return;
  const base = cityOf(S.company.base), tier = S.expansion.tier, reach = S.company.reachKm;
  const realCount = [...routeGeom.values()].filter(r => r.provider === "osrm").length;
  $("hudBase").textContent = S.company.base;
  const active = S.trips.filter(t => !t.processed_at).length;
  $("hudOps").textContent = active ? active+" operação(ões) em curso" : "Sem operações ativas";
  const color = (S.geo.tiers.find(t => t.key === tier.key) || {}).color || "#36d99a";
  $("hudTier").innerHTML = `<b style="color:${color}">${esc(tier.name)}</b> · ${reach > 10000 ? "sem limite" : Math.round(reach)+" km"}`;
  $("mapHint").textContent = (S.company.speed>1 ? "demo "+S.company.speed+"× · " : "tempo real · ") + realCount+" rotas reais";

  for (const k of Object.keys(overlays)) overlays[k].clearLayers();

  if (layerState.reach && base && reach < 10000) {
    L.circle([base.la,base.lo], { radius:reach*1000, color, weight:1.4, dashArray:"6 8", fillColor:color, fillOpacity:.045 })
      .bindTooltip(`Alcance ${tier.name}: ${reach} km`, { sticky:true }).addTo(overlays.reach);
  }

  const endpoints = new Set([S.company.base]);
  S.offers.forEach(o => { endpoints.add(o.from_city); endpoints.add(o.to_city); });
  S.trips.forEach(t => { endpoints.add(t.from_city); endpoints.add(t.to_city); });
  S.warehouses.forEach(w => endpoints.add(w.city));
  for (const c of S.geo.cities) {
    const isBase = S.company.base === c.n;
    const m = L.circleMarker([c.la,c.lo], {
      radius:isBase ? 6 : (endpoints.has(c.n) ? 4.2 : 3),
      color:isBase ? "#36d99a" : "#9fd0ef", weight:isBase ? 2.5 : 1,
      fillColor:isBase ? "#36d99a" : (endpoints.has(c.n) ? "#5fb0ff" : "#4d7f9e"), fillOpacity:isBase ? 1 : .85
    }).bindTooltip(isBase ? `<b>${esc(c.n)}</b> · sede` : esc(c.n), { direction:"top", offset:[0,-5],
        permanent:isBase || endpoints.has(c.n), className:"city-tip" });
    m.addTo(overlays.assets);
  }

  if (layerState.companies) {
    for (const r of S.leaderboard.rows) {
      const c = cityOf(r.base_city);
      if (!c || r.name === S.company.name) continue;
      L.marker([c.la,c.lo], { icon:L.divIcon({ className:"", html:iconHtml("co","●",r.name), iconSize:[14,14], iconAnchor:[7,7] }) })
       .bindTooltip(`<b>${esc(r.name)}</b><br>${esc(r.base_city)} · ${money(r.cash)}`, { direction:"top" })
       .addTo(overlays.companies);
    }
  }

  if (layerState.assets) {
    for (const w of S.warehouses) {
      const c = cityOf(w.city); if (!c) continue;
      L.marker([c.la,c.lo], { icon:L.divIcon({ className:"", html:iconHtml("wh","▣",w.city), iconSize:[22,22], iconAnchor:[11,11] }) })
       .bindTooltip(`<b>${esc(w.city)}</b><br>${w.city === S.company.base ? "Sede" : "Armazém"} · ${Math.round(w.kg)} kg`, { direction:"top", offset:[0,-8] })
       .addTo(overlays.assets);
    }
    for (const v of S.vehicles.filter(v => v.status === "idle")) {
      const c = cityOf(v.at); if (!c) continue;
      L.marker([c.la+0.035,c.lo-0.035], { icon:L.divIcon({ className:"", html:iconHtml("van","▰",VANS[v.model].name), iconSize:[22,18], iconAnchor:[11,9] }) })
       .bindTooltip(`${esc(VANS[v.model].name)} · ${esc(v.at)}<br>${Math.round(v.km)} km · estado ${Math.round(v.condition)}%`, { direction:"top" })
       .addTo(overlays.assets);
    }
    const idleDrivers = S.drivers.filter(d => d.status === "idle");
    if (idleDrivers.length && base) {
      L.marker([base.la-0.03,base.lo+0.035], { icon:L.divIcon({ className:"", html:iconHtml("team",String(idleDrivers.length),idleDrivers.length+" motoristas"), iconSize:[20,20], iconAnchor:[10,10] }) })
       .bindTooltip(`${idleDrivers.length} motorista(s) disponível(eis)`, { direction:"top" }).addTo(overlays.assets);
    }
  }

  const pairs = [];
  if (layerState.offers) {
    for (const o of S.offers) {
      const a = cityOf(o.from_city), b = cityOf(o.to_city); if (!a || !b) continue;
      pairs.push([o.from_city,o.to_city]);
      const line = lineFor(o.from_city,o.to_city, { color, weight:2, opacity:.45, dashArray:"5 9" });
      if (line) line.bindTooltip(`<b>${esc(o.client)}</b><br>${esc(o.from_city)} → ${esc(o.to_city)}<br>${o.km} km · ${money(o.price)}`, { sticky:true }).addTo(overlays.offers);
      L.circleMarker([a.la,a.lo], { radius:3, color, fillColor:"#08111c", fillOpacity:1, weight:2 }).addTo(overlays.offers);
      L.circleMarker([b.la,b.lo], { radius:4, color, fillColor:color, fillOpacity:.55, weight:2 }).addTo(overlays.offers);
    }
  }

  if (layerState.trips) {
    for (const t of S.trips.filter(t => !t.processed_at)) {
      const a = cityOf(t.from_city), b = cityOf(t.to_city); if (!a || !b) continue;
      pairs.push([t.from_city,t.to_city]);
      const p = clamp((S.company.now - t.start_at) / Math.max(1,t.end_at-t.start_at), 0, 1);
      const g = routeGeometry(t.from_city,t.to_city) || [[a.la,a.lo],[b.la,b.lo]];
      L.polyline(g, { color:"#ffc75a", weight:2.4, opacity:.32 }).addTo(overlays.trips);
      const done = partialGeometry(g,p);
      if (done.length > 1) L.polyline(done, { color:"#ffc75a", weight:4, opacity:.95 }).addTo(overlays.trips);
      const pos = done[done.length-1];
      L.marker(pos, { icon:L.divIcon({ className:"", html:iconHtml("moving","➤",t.client+" "+Math.round(p*100)+"%"), iconSize:[24,20], iconAnchor:[12,10] }) })
       .bindTooltip(`<b>${esc(t.client)}</b><br>${esc(t.from_city)} → ${esc(t.to_city)}<br>${Math.round(p*100)}% · chegada ${dt(t.end_at)}`, { direction:"top", offset:[0,-8] })
       .addTo(overlays.trips);
      L.circleMarker([b.la,b.lo], { radius:9, color:"#ffc75a", fillOpacity:0, weight:2, dashArray:"3 4" }).addTo(overlays.trips);
    }
  }

  if (layerState.history) {
    for (const t of S.trips.filter(t => t.processed_at).slice(0,12)) {
      if (!cityOf(t.from_city) || !cityOf(t.to_city)) continue;
      pairs.push([t.from_city,t.to_city]);
      const line = lineFor(t.from_city,t.to_city, { color:"#6f93aa", weight:1.2, opacity:.28 });
      if (line) line.bindTooltip(`${esc(t.client)} · ${esc(t.from_city)} → ${esc(t.to_city)}`, { sticky:true }).addTo(overlays.history);
    }
  }
  requestRoutes(pairs);
  if (!fitDone && base) { fitDone = true; fitNetwork(); }
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
    `<div class="kpi ${margin>=0?"good":"neg"}"><i>${I.trend}</i><div class="ktext"><span class="kval">${money(margin)}</span><span class="klbl">Margem</span></div></div>`+
    `<div class="kpi"><i>${I.fuel}</i><div class="ktext"><span class="kval">${(S.market?S.market.fuelPrice:1.75).toFixed(2).replace(".",",")} €/L</span><span class="klbl">Gasóleo</span></div></div>`+
    `<div class="kpi ${S.company.reputation>=70?"good":""}"><i>${I.star}</i><div class="ktext"><span class="kval">${Math.round(S.company.reputation)}/100</span><span class="klbl">Reputação</span></div></div>`;
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
const TABS=[["mercado","Mercado","market"],["armazens","Armazéns","warehouse"],["frota","Frota","fleet"],["equipa","Equipa","team"],["financas","Finanças","finance"],["mundo","Mundo","globe"],["log","Histórico","history"]];
function renderTabs(){
  const count=S.offers.length, ach=S.achievements.length;
  $("tabs").innerHTML=TABS.map(([k,n,ico])=>`<button class="tab ${tab===k?"on":""}" onclick="setTab('${k}')">${I[ico]}<span>${n}</span>${k==="mercado"&&count?`<i class="badge">${count}</i>`:""}${k==="mundo"&&ach?`<i class="badge">${ach}</i>`:""}</button>`).join("");
}
function renderContent(){
  $("tabContent").innerHTML=({mercado:tabMarket,armazens:tabWarehouses,frota:tabFleet,equipa:tabStaff,financas:tabFinance,mundo:tabWorld,log:tabLog})[tab]();
}
function tabMarket(){
  if(!S.offers.length) return empty("Mercado vazio","Volte dentro de minutos ou acelere o tempo no topo.");
  const freeVans=S.vehicles.filter(v=>v.status==="idle"), freeDrivers=S.drivers.filter(d=>d.status==="idle");
  const ex=S.expansion, nt=ex.next;
  return `<div class="section-head"><div><p class="eyebrow">Ofertas de carga geral</p><h2>Mercado de contratos</h2></div><span class="count">${S.offers.length} disponíveis</span></div>
    <div class="tier-card"><div class="tier-ico">${I.globe.replace('<svg','<svg style="width:20px;height:20px"')}</div>
      <div class="tier-main"><strong>Nível ${esc(ex.tier.name)} · alcance ${ex.tier.reachKm>10000?"nacional":Math.round(ex.tier.reachKm)+" km"}</strong>
      <small>${nt?"Próximo: "+esc(nt.name)+" · falta "+(nt.missing.length?nt.missing.join(", "):"nada"):"Rede nacional desbloqueada"}</small></div>
      <span class="chip">${ex.deliveries} entregas</span></div>
    <p class="lead">A receita é paga na conclusão. A margem já inclui combustível, portagens, desgaste, ordenado e renda. Só vê contratos ao seu alcance.</p>`+
    S.offers.map(o=>{
      const price=money(o.price), inicial=o.client.slice(0,2).toUpperCase();
      const wh=o.needs_stock?S.warehouses.find(w=>w.city===o.from_city):null;
      const stockOk=!o.needs_stock||(wh&&wh.kg>=o.kg);
      const ok=freeVans.some(v=>VANS[v.model].kg>=o.kg&&VANS[v.model].m3>=o.m3)&&freeDrivers.length>0&&stockOk;
      const left=clamp((o.expires_at-S.company.now)/(o.expires_at-o.created_at),0,1);
      const fuel=S.market?S.market.fuelPrice:1.75;
      const est=Math.round(o.km/100*8*fuel + o.km*.6*.10 + o.km*.10);
      const margin=o.price-est;
      return `<div class="card"><div class="card-head">
          <div class="avatar">${esc(inicial)}</div>
          <div class="card-title"><strong>${esc(o.client)}</strong><small>${o.kind==="recurring"?"Recorrente · ":"Contrato · "}${esc(o.from_city)} → ${esc(o.to_city)}</small></div>
          <div class="big-price"><small>receita</small><strong>${price}</strong></div></div>
        <div class="route"><div class="route-city"><small>Origem</small><strong>${esc(o.from_city)}</strong></div><div class="route-line"></div><div class="route-city right"><small>Destino</small><strong>${esc(o.to_city)}</strong></div></div>
        <div class="chips"><span class="chip">${o.km} km</span><span class="chip">${o.kg} kg</span><span class="chip">${o.m3} m³</span><span class="chip">${esc(o.window)}</span>${o.repBonus?`<span class="chip" style="color:${o.repBonus>0?"var(--green)":"var(--red)"}">rep ${o.repBonus>0?"+":""}${o.repBonus}%</span>`:""}${o.needs_stock?`<span class="chip" style="color:${stockOk?"var(--green)":"var(--red)"}">stock ${Math.round(wh?wh.kg:0)} kg</span>`:""}</div>
        <div class="card-foot">
          <div><div class="metric"><small>margem estimada</small><strong class="${margin>=0?"":"neg"}" style="${margin>=0?"color:var(--green)":""}">${money(margin)}</strong></div>
            <div class="hint">custo de caixa ≈ ${money(est)}</div></div>
          <div class="expiry"><div class="expiry-track"><i style="width:${(left*100).toFixed(0)}%"></i></div><small>expira ${hhmm(o.expires_at)}</small></div>
          <button class="btn primary sm" ${ok?"":"disabled"} onclick="openAccept('${o.id}')">${ok?"Aceitar":"Sem recursos"} ${ok?I.arrow:""}</button>
        </div></div>`;
    }).join("");
}
function tabWarehouses(){
  const whs=S.warehouses, active=S.recurring.filter(r=>r.active);
  const free=(S.geo?S.geo.cities:[]).map(c=>c.n).filter(n=>!whs.some(w=>w.city===n));
  const auto=S.company.autoDispatch;
  return `<div class="section-head"><div><p class="eyebrow">Fase 2 · logística de stock</p><h2>Armazéns</h2></div><span class="count">${whs.length}/3</span></div>
    <p class="lead">Compre mercadoria barata na origem, entregue-a com um contrato recorrente e venda-a no destino com margem.</p>
    <button class="btn ${auto?"primary":"ghost"} wide" onclick="toggleAuto()">${I.repeat} Expedição automática: ${auto?"ATIVA":"desligada"}</button>
    <div class="hint">${auto?"O servidor reserva e envia contratos recorrentes assim que há veículo, motorista e stock.":"Ative para o servidor despachar sem intervenção."}</div>
    <div class="subhead">Armazéns da empresa</div>
    ${whs.map(w=>`<div class="card"><div class="card-head"><div class="avatar g">${I.warehouse.replace('<svg','<svg style="width:18px;height:18px"')}</div>
      <div class="card-title"><strong>${esc(w.city)}</strong><small>${w.rent_monthly?money(w.rent_monthly)+"/mês":"Base incluída"} · ${esc(w.city===S.company.base?"sede":"filial")}</small></div>
      <div class="big-price"><small>stock</small><strong>${Math.round(w.kg)} kg</strong></div></div>
      <div class="chips" style="margin-top:9px"><span class="chip">valor ${money(w.stock_value)}</span><span class="chip">compra ${money(0.5)}/kg</span><span class="chip">venda ${money(0.68)}/kg</span></div>
      <div class="card-foot"><div class="metric"><small>quantidade</small>
        <input class="qty" type="number" min="10" step="10" value="${ui.qty[w.id]||100}" oninput="ui.qty[${w.id}]=this.value"></div>
        <button class="btn ghost sm" onclick="buyWh(${w.id})">Comprar</button>
        <button class="btn primary sm" ${w.kg>=10?"":"disabled"} onclick="sellWh(${w.id})">Vender</button></div></div>`).join("")}
    <div class="subhead">Abrir novo armazém · ${money(800)} de caução</div>
    ${free.length?`<div class="card"><div class="card-foot"><select id="whCity" onchange="ui.whCity=this.value">${free.map(c=>`<option ${ui.whCity===c?"selected":""}>${c}</option>`).join("")}</select>
      <button class="btn primary sm" onclick="rentWh()">Abrir armazém</button></div></div>`:`<div class="hint">Já tem armazéns em todas as cidades disponíveis.</div>`}
    <div class="subhead">Contratos ativos · ${active.length}/${S.recurringCatalog.length}</div>
    ${active.length?active.map(r=>`<div class="card"><div class="card-head"><div class="avatar a">${I.repeat.replace('<svg','<svg style="width:17px;height:17px"')}</div>
      <div class="card-title"><strong>${esc(r.client)}</strong><small>${esc(r.from_city)} → ${esc(r.to_city)} · ${r.kg} kg</small></div>
      <div class="big-price"><small>por entrega</small><strong>${money(r.price)}</strong></div></div>
      <div class="card-foot"><span class="hint">Próxima: ${dt(r.next_due_at)}</span><button class="btn ghost sm" onclick="cancelRec(${r.id})">Cancelar</button></div></div>`).join(""):empty("Sem contratos recorrentes","Assine uma rota no catálogo abaixo.")}
    <div class="subhead">Catálogo de rotas</div>
    ${S.recurringCatalog.map(r=>{const signed=active.some(a=>a.route_id===r.id);
      return `<div class="card"><div class="card-head"><div class="avatar">${esc(r.client.slice(0,2).toUpperCase())}</div>
        <div class="card-title"><strong>${esc(r.client)}</strong><small>${esc(r.from)} → ${esc(r.to)} · cada ${r.days} dias</small></div>
        <div class="big-price"><small>receita</small><strong>${money(r.price)}</strong></div></div>
        <div class="card-foot"><span class="hint">${r.kg} kg por entrega</span>
          <button class="btn ${signed?"ghost":"primary"} sm" ${signed?"disabled":""} onclick="signRec('${r.id}')">${signed?"Assinada":"Assinar"}</button></div></div>`;}).join("")}`;
}
function tabFleet(){
  const owned=S.vehicles.map(v=>{
    const spec=VANS[v.model], busy=v.status==="travel";
    return `<div class="card"><div class="card-head"><div class="avatar ${busy?"a":"g"}">${I.fleet.replace('<svg','<svg style="width:18px;height:18px"')}</div>
      <div class="card-title"><strong>${esc(spec.name)}</strong><small>${busy?"Em viagem":"Disponível"} · em ${esc(v.at_city)}</small></div>
      <span class="chip">${Number(v.km).toLocaleString("pt-PT")} km</span></div>
      <div class="chips" style="margin-top:10px"><span class="chip">${spec.kg} kg</span><span class="chip">${spec.m3} m³</span><span class="chip">${spec.l100} L/100km</span></div>
      <div class="metric" style="margin-top:11px"><small>estado mecânico · ${Math.round(v.condition)}%</small>
        <div class="op-bar"><i style="width:${v.condition}%;background:${v.condition<35?"var(--red)":v.condition<60?"var(--amber)":"var(--green)"}"></i></div></div>
      <div class="card-foot"><span class="hint">${v.condition<35?"Avaria iminente — repare antes de viajar.":"Reparação: "+money(Math.max(0,Math.round((100-v.condition)*12)))}</span>
        <button class="btn ghost sm" onclick="repairV(${v.id})" ${v.condition>=99?"disabled":""}>Reparar</button></div></div>`;
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
      <div class="stat ${S.company.reputation>=70?"good":""}"><small>Reputação</small><strong>${Math.round(S.company.reputation)}/100</strong></div>
      <div class="stat"><small>Gasóleo atual</small><strong>${S.market.fuelPrice.toFixed(2).replace(".",",")} €/L</strong></div>
    </div>
    <p class="lead">Bónus/malus de reputação: ${S.offers[0]?S.offers[0].repBonus:Math.round((S.company.reputation-50)*0.2)}% no valor de cada entrega. Imposto simplificado: ${Math.round(S.market.taxRate*100)}%.</p>
    <div class="subhead">Crédito</div>
    ${S.loans.length?S.loans.map(l=>`<div class="card"><div class="card-head"><div class="avatar a">€</div>
      <div class="card-title"><strong>Empréstimo #${l.id}</strong><small>${l.closed_at?"Liquidado":"Juros 0,5%/dia"} · recebido ${money(l.principal)}</small></div>
      <div class="big-price"><small>em dívida</small><strong style="${l.closed_at?"color:var(--green)":""}">${money(l.balance)}</strong></div></div>
      ${l.closed_at?"":`<div class="card-foot"><input class="qty" type="number" min="100" step="100" value="${ui.qty["loan"+l.id]||500}" oninput="ui.qty['loan'+${l.id}]=this.value">
        <button class="btn primary sm" onclick="repayL(${l.id})">Amortizar</button></div>`}</div>`).join(""):empty("Sem empréstimos","Pode pedir até €20 000 com taxa de abertura de 3%.")}
    <div class="card"><div class="card-head"><div class="avatar">${I.finance}</div><div class="card-title"><strong>Novo empréstimo</strong><small>Taxa de abertura 3% · juros 0,5%/dia · máx. 3 ativos</small></div></div>
      <div class="card-foot"><input class="qty" type="number" min="500" step="100" value="${ui.loanAmt||2000}" oninput="ui.loanAmt=this.value">
        <button class="btn ghost sm" onclick="takeL()">Pedir empréstimo</button></div></div>
    <div class="subhead">Movimentos recentes</div>
    ${S.movements.length?S.movements.map(m=>`<div class="mov ${m.amount<0?"cost":""}">
      <div class="mov-ico">${m.amount>=0?"+":"−"}</div>
      <div class="mov-main"><strong>${esc(m.description)}</strong><small>${dt(m.at)}</small></div>
      <div class="mov-val ${m.amount>=0?"good":"bad"}">${money(m.amount)}<span class="mov-bal">saldo ${money(m.balance)}</span></div></div>`).join(""):empty("Sem movimentos","Os custos e receitas aparecem aqui.")}`;
}
function tabWorld(){
  const lb=S.leaderboard, ev=S.market.event, unlocked=new Set(S.achievements.map(a=>a.key));
  const evCard=ev?`<div class="card event-card"><div class="card-head"><div class="avatar a">${I.bolt.replace('<svg','<svg style="width:19px;height:19px"')}</div>
      <div class="card-title"><strong>${esc(ev.label)}</strong><small>${esc(ev.message)}</small></div>
      <span class="pill">${ev.active?"ATIVO":"TERMINADO"}</span></div>
      <div class="chips" style="margin-top:10px">${ev.fuel_mod?`<span class="chip">gasóleo ${ev.fuel_mod>0?"+":""}${(ev.fuel_mod).toFixed(2)} €/L</span>`:""}${ev.price_mod?`<span class="chip">ofertas ${ev.price_mod>0?"+":""}${Math.round(ev.price_mod*100)}%</span>`:""}${ev.time_mod?`<span class="chip">duração +${Math.round(ev.time_mod*100)}%</span>`:""}<span class="chip">até ${dt(ev.event_until)}</span></div></div>`
    :empty("Sem evento ativo","Os eventos mundiais rotacionam a cada 2 dias simulados.");
  const rankRow=(r,i)=>`<div class="rank ${r.id===S.leaderboard.me?.id?"me":""}"><span class="rank-n">${i+1}</span>
      <div class="rank-name"><strong>${esc(r.name)}</strong><small>${esc(r.base_city)} · ${r.deliveries} entregas</small></div>
      <div class="rank-val"><strong>${money(r.cash)}</strong><small>rep ${Math.round(r.reputation)}</small></div></div>`;
  return `<div class="section-head"><div><p class="eyebrow">Fase 4 · comunidade e dados abertos</p><h2>Mundo</h2></div><span class="count">${lb.total} empresas</span></div>
    <div class="subhead">Evento mundial</div>${evCard}
    <div class="subhead">Classificação · ${lb.me?"você é #"+lb.me.rank:"sem posição"}</div>
    <div class="card rank-list">${lb.rows.length?lb.rows.map(rankRow).join(""):empty("Sem classificação","Ainda não há empresas registadas.")}</div>
    <div class="subhead">Conquistas · ${unlocked.size}/${S.achievementCatalog.length}</div>
    ${S.achievementCatalog.map(a=>{const got=unlocked.has(a.key);
      return `<div class="ach ${got?"on":""}"><div class="ach-ico">${got?I.check:I.trophy.replace('<svg','<svg style="width:17px;height:17px"')}</div>
        <div class="ach-main"><strong>${esc(a.name)}</strong><small>${esc(a.desc)}</small></div>
        <span class="chip" style="color:${got?"var(--green)":"var(--muted)"}">${got?"DESBLOQUEADA":"+"+money(a.reward)}</span></div>`;}).join("")}
    <div class="subhead">API pública · chaves de acesso</div>
    <p class="lead">Consulte estatísticas e o ranking por HTTP com uma chave. Guardamos apenas o hash da chave; o valor original aparece uma única vez.</p>
    <div class="code-block">GET /api/public/v1/stats<br>GET /api/public/v1/leaderboard<br><span>X-API-Key: plv1_…</span></div>
    <div class="card"><div class="card-head"><div class="avatar">${I.key.replace('<svg','<svg style="width:18px;height:18px"')}</div>
      <div class="card-title"><strong>Nova chave</strong><small>Limite: 60 pedidos/minuto por chave</small></div></div>
      <div class="card-foot"><input class="qty" id="keyLabel" placeholder="Ex.: dashboard" maxlength="40" style="width:170px" value="${esc(ui.keyLabel||"")}" oninput="ui.keyLabel=this.value">
        <button class="btn primary sm" onclick="createKey()">Gerar chave</button></div></div>
    ${S.apiKeys.length?S.apiKeys.map(k=>`<div class="card"><div class="card-head"><div class="avatar g">${I.key.replace('<svg','<svg style="width:17px;height:17px"')}</div>
      <div class="card-title"><strong>${esc(k.label)}</strong><small>Criada ${dt(k.created_at)} · ${k.last_used_at?"último uso "+dt(k.last_used_at):"nunca usada"}</small></div>
      <button class="btn ghost sm" onclick="revokeKey(${k.id})">Revogar</button></div></div>`).join(""):empty("Sem chaves","Gere uma chave para usar a API pública.")}`;
}
function tabLog(){
  return `<div class="section-head"><div><p class="eyebrow">Registo do servidor</p><h2>Histórico</h2></div></div>
    ${S.log.length?`<div class="timeline">${S.log.map(l=>`<div class="tl ${l.type==="good"?"good":l.type==="bad"?"bad":""}"><time>${dt(l.at)}</time><p>${esc(l.message)}</p></div>`).join("")}</div>`:empty("Sem eventos","Ainda não aconteceu nada.")}`;
}

/* ---------- ações ---------- */
function setSpeed(v){ act(()=>api("/api/speed","POST",{speed:v})); }
function buyVan(model){ act(()=>api("/api/vehicles/buy","POST",{model})); }
function hire(){ act(()=>api("/api/drivers/hire","POST",{})); }
function toggleAuto(){ act(()=>api("/api/autodispatch","POST",{on:!S.company.autoDispatch})); }
function rentWh(){ act(()=>api("/api/warehouses/rent","POST",{city:ui.whCity})); }
function buyWh(id){ act(()=>api("/api/inventory/buy","POST",{warehouseId:id,kg:Number(ui.qty[id]||100)})); }
function sellWh(id){ act(()=>api("/api/inventory/sell","POST",{warehouseId:id,kg:Number(ui.qty[id]||100)})); }
function signRec(routeId){ act(()=>api("/api/recurring/sign","POST",{routeId})); }
function cancelRec(id){ act(()=>api("/api/recurring/cancel","POST",{id})); }
function takeL(){ act(()=>api("/api/loans/take","POST",{amount:Number(ui.loanAmt||2000)})); }
function repayL(id){ act(()=>api("/api/loans/repay","POST",{id,amount:Number(ui.qty["loan"+id]||500)})); }
function repairV(id){ act(()=>api("/api/vehicles/repair","POST",{vehicleId:id})); }
async function createKey(){
  try {
    const r=await api("/api/apikeys/create","POST",{label:ui.keyLabel||"Chave"});
    await refresh();
    modal(`<div class="modal-ico">${I.key}</div><h2>Chave criada</h2><p class="sub">Copie agora — não será mostrada novamente.</p>
      <div class="code-block">${esc(r.key)}</div>
      <div class="err" style="color:var(--green)">${esc(r.note)}</div>
      <div class="actions"><button class="btn ghost" onclick="copyKey(this)" data-key="${esc(r.key)}">Copiar</button>
      <button class="btn primary" onclick="closeModal()">Concluído</button></div>`);
    toast("Chave gerada. Guarde-a num local seguro.");
  } catch(e){ toast(e.message,true); }
}
async function copyKey(btn){
  try { await navigator.clipboard.writeText(btn.dataset.key); btn.textContent="Copiado!"; }
  catch { btn.textContent="Copie manualmente"; }
}
function revokeKey(id){ act(()=>api("/api/apikeys/revoke","POST",{id})); }
function openAccept(id){
  const o=S.offers.find(x=>x.id===id); if(!o) return;
  const vans=S.vehicles.filter(v=>v.status==="idle"&&VANS[v.model].kg>=o.kg&&VANS[v.model].m3>=o.m3);
  const drivers=S.drivers.filter(d=>d.status==="idle");
  const diesel=S.market?S.market.fuelPrice:1.75;
  const fuel=o.km/100*8*diesel, toll=o.km*.6*.10, wear=o.km*.10, cash=fuel+toll+wear;
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
initMap();
function render(){ if(!S) return; renderTop(); renderMap(); renderStrip(); renderTabs(); renderContent(); }
function setTab(k){ tab=k; renderTabs(); renderContent(); }
$("btnLogout").onclick=logout;
$("modalRoot").addEventListener("click",e=>{ if(e.target.classList.contains("overlay")) closeModal(); });
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&token) refresh(); });
if(token) refresh(); else showAuth();
setInterval(()=>{ if(token&&!document.hidden) refresh(); },1500);

/* PWA — o service worker guarda apenas a interface; os dados vêm sempre do servidor. */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js").catch(()=>{});
}
