"use strict";
/* Regras do mundo — servidor é a única fonte da verdade (Fase 1). */

const CFG = {
  capital: 25000, rent: 350, wage: 1500, social: 0.22, diesel: 1.75,
  tollPerKm: 0.10, motorwayShare: 0.60, wearPerKm: 0.10, speedKmh: 65,
  roadFactor: 1.25, loadMin: 30, unloadMin: 20, maxAbsenceDays: 30,
  hireCost: 300, maxVehicles: 2, maxDrivers: 2, offerTarget: 11,
  // Fase 2 — armazéns e mercadorias
  warehouseDeposit: 800, warehouseRent: 120, maxWarehouses: 3,
  goodsBuy: 0.50, goodsSell: 0.68, maxRecurring: 3,
  // Fase 3 — economia dinâmica
  taxRate: 0.06, loanFee: 0.03, loanDaily: 0.005, loanMax: 20000,
  repStart: 50, repGain: 2, repLoss: 4, breakdownAt: 35, wearPerKm: 0.012
};

/* Conquistas (Fase 4). A condição é avaliada no servidor. */
const ACHIEVEMENTS = [
  { key:"first",      name:"Primeira entrega",     desc:"Conclua 1 entrega",           reward:200 },
  { key:"five",       name:"Operador experiente",  desc:"Conclua 5 entregas",          reward:500 },
  { key:"fifteen",    name:"Frota em movimento",   desc:"Conclua 15 entregas",         reward:1000 },
  { key:"warehouse",  name:"Rede nacional",        desc:"Tenha 2 armazéns",            reward:400 },
  { key:"fleet",      name:"Dois veículos",        desc:"Compre 2 veículos",           reward:400 },
  { key:"reputation", name:"Referência no setor",  desc:"Alcance reputação 80",        reward:600 },
  { key:"rich",       name:"Empresa próspera",     desc:"Atinge €50 000 em caixa",     reward:800 },
  { key:"trader",     name:"Comerciante",          desc:"Venda 1 000 kg de mercadoria",reward:400 }
];
/* Eventos mundiais (Fase 4). Rotativos a cada 2 dias simulados. */
const WORLD_EVENTS = [
  { type:"fuel",      name:"Pico do petróleo",  desc:"Gasóleo +€0,35/L", fuelMod:0.35, priceMod:0,    timeMod:0 },
  { type:"fair",      name:"Feira de negócios", desc:"Ofertas +12%",     fuelMod:0,    priceMod:0.12, timeMod:0 },
  { type:"strike",    name:"Greve de camionistas",desc:"Viagens +25% mais lentas", fuelMod:0, priceMod:0, timeMod:0.25 },
  { type:"surplus",   name:"Excedente de gasóleo",desc:"Gasóleo −€0,20/L",fuelMod:-0.20,priceMod:0,   timeMod:0 }
];

/* Rotas recorrentes (Fase 2). O contrato gera uma oferta periódica. */
const RECURRING_ROUTES = [
  { id:"r1", client:"Continente", from:"Évora",    to:"Lisboa", kg:300, price:520, days:7 },
  { id:"r2", client:"Pingo Doce", from:"Porto",     to:"Lisboa", kg:500, price:690, days:7 },
  { id:"r3", client:"Delta Cafés",from:"Faro",      to:"Évora",  kg:250, price:480, days:7 },
  { id:"r4", client:"Worten",     from:"Aveiro",    to:"Braga",  kg:400, price:510, days:7 },
  { id:"r5", client:"Vista Alegre",from:"Aveiro",   to:"Lisboa", kg:350, price:560, days:7 }
];

const CITIES = [
  { n:"Lisboa",lo:-9.14,la:38.72 },{ n:"Porto",lo:-8.61,la:41.15 },
  { n:"Braga",lo:-8.43,la:41.55 },{ n:"Aveiro",lo:-8.65,la:40.64 },
  { n:"Coimbra",lo:-8.43,la:40.21 },{ n:"Leiria",lo:-8.80,la:39.74 },
  { n:"Santarém",lo:-8.69,la:39.24 },{ n:"Setúbal",lo:-8.89,la:38.52 },
  { n:"Évora",lo:-7.91,la:38.57 },{ n:"Beja",lo:-7.86,la:38.02 },
  { n:"Faro",lo:-7.93,la:37.02 },{ n:"Portimão",lo:-8.54,la:37.14 },
  { n:"Lagos",lo:-8.67,la:37.10 },{ n:"Tavira",lo:-7.65,la:37.13 },
  { n:"Viseu",lo:-7.91,la:40.66 },{ n:"Guarda",lo:-7.27,la:40.54 },
  { n:"Castelo Branco",lo:-7.49,la:39.82 },{ n:"Vila Real",lo:-7.75,la:41.30 },
  { n:"Bragança",lo:-6.76,la:41.80 },{ n:"Viana do Castelo",lo:-8.83,la:41.69 },
  { n:"Guimarães",lo:-8.30,la:41.44 },{ n:"Famalicão",lo:-8.60,la:41.40 },
  { n:"Matosinhos",lo:-8.69,la:41.18 },{ n:"Vila Nova de Gaia",lo:-8.61,la:41.12 },
  { n:"Espinho",lo:-8.64,la:41.01 },{ n:"Ovar",lo:-8.63,la:40.86 },
  { n:"Águeda",lo:-8.45,la:40.57 },{ n:"Figueira da Foz",lo:-8.86,la:40.15 },
  { n:"Caldas da Rainha",lo:-9.14,la:39.40 },{ n:"Torres Vedras",lo:-9.26,la:39.09 },
  { n:"Sintra",lo:-9.38,la:38.80 },{ n:"Cascais",lo:-9.42,la:38.70 },
  { n:"Almada",lo:-9.16,la:38.68 },{ n:"Seixal",lo:-9.10,la:38.64 },
  { n:"Barreiro",lo:-9.07,la:38.66 },{ n:"Montijo",lo:-8.97,la:38.70 },
  { n:"Palmela",lo:-8.89,la:38.57 },{ n:"Alcácer do Sal",lo:-8.51,la:38.37 },
  { n:"Grândola",lo:-8.57,la:38.17 },{ n:"Santiago do Cacém",lo:-8.69,la:38.01 },
  { n:"Sines",lo:-8.87,la:37.95 },{ n:"Elvas",lo:-7.09,la:38.88 },
  { n:"Estremoz",lo:-7.59,la:38.84 },{ n:"Tomar",lo:-8.41,la:39.60 },
  { n:"Abrantes",lo:-8.19,la:39.47 },{ n:"Lamego",lo:-7.71,la:41.10 },
  { n:"Chaves",lo:-7.47,la:41.74 }
];
const BASE_CITIES = ["Lisboa","Porto","Braga","Aveiro","Coimbra","Faro","Évora","Setúbal","Viseu","Guimarães","Sintra"];
const CLIENTS = ["Continente","Pingo Doce","Worten","Delta Cafés","Vista Alegre","The Navigator Company"];
const DNAMES = ["Rui Almeida","Sofia Marques","Pedro Nunes","Ana Costa","Miguel Faria","Inês Lopes","Tiago Silva","Carla Dias"];
const VANS = {
  van:   { name:"Carrinha",    price:14000, kg:800,  m3:4,  l100:8.0 },
  truck: { name:"Camião leve", price:24000, kg:3000, m3:14, l100:12.5 }
};

/* Fase 6 — progressão geográfica: a empresa começa local e expande-se. */
const TIERS = [
  { key:"local",    name:"Local",    reachKm:130,   color:"#36d99a", desc:"Distribuição na sua cidade e arredores." },
  { key:"regional", name:"Regional", reachKm:320,   color:"#5fb0ff", desc:"Contratos em toda a região." },
  { key:"national", name:"Nacional", reachKm:99999, color:"#ffc75a", desc:"Rede nacional sem limites." }
];
function tierFor(ctx = {}){
  const d = ctx.deliveries || 0, rep = ctx.reputation || 50;
  const wh = ctx.warehouses || 1, cash = ctx.cash || 0;
  if (d >= 15 || rep >= 80 || wh >= 3 || cash >= 50000) return TIERS[2];
  if (d >= 5  || rep >= 65 || wh >= 2) return TIERS[1];
  return TIERS[0];
}
function nextTier(tier, ctx = {}){
  const i = TIERS.findIndex(t => t.key === tier.key);
  if (i < 0 || i >= TIERS.length - 1) return null;
  const next = TIERS[i + 1];
  const d = ctx.deliveries || 0, rep = ctx.reputation || 50, wh = ctx.warehouses || 1;
  const missing = [];
  if (next.key === "regional") {
    if (d < 5) missing.push(`${5 - d} entregas`);
    if (rep < 65) missing.push(`rep ${Math.ceil(65 - rep)}`);
    if (wh < 2) missing.push("2.º armazém");
  } else {
    if (d < 15) missing.push(`${15 - d} entregas`);
    if (rep < 80) missing.push(`rep ${Math.ceil(80 - rep)}`);
    if (wh < 3) missing.push("3.º armazém");
  }
  return { ...next, missing };
}
function withinKm(base, cityName, km){
  const a = city(base), b = city(cityName);
  return a && b ? distKm(a, b) <= km : false;
}
function offerVisible(o, base, tier){
  if (!tier || tier.key === "national") return true;
  return withinKm(base, o.from_city || o.from, tier.reachKm) &&
         withinKm(base, o.to_city || o.to, tier.reachKm);
}
function routeKey(a, b){ return [a, b].sort().join("|"); }
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
const RIVERS = [
  [[-7.90,40.70],[-8.20,41.00],[-8.45,41.10],[-8.61,41.15]],
  [[-7.49,39.82],[-8.10,39.50],[-8.69,39.24],[-9.14,38.72]]
];

const pick = a => a[Math.floor(Math.random()*a.length)];
const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

function city(name){ return CITIES.find(c=>c.n===name); }
function distKm(a,b){
  const R=6371, rad=Math.PI/180;
  const dLa=(b.la-a.la)*rad, dLo=(b.lo-a.lo)*rad;
  const h=Math.sin(dLa/2)**2+Math.cos(a.la*rad)*Math.cos(b.la*rad)*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(h))*CFG.roadFactor;
}
function travelMs(km){ return (CFG.loadMin + km/CFG.speedKmh*60 + CFG.unloadMin)*60000; }
/* Preço do gasóleo oscila com o tempo simulado (1,45 – 2,05 €/L). */
function fuelPrice(now){
  const d = now/86400000;
  return round3(CFG.diesel + 0.20*Math.sin(d/3) + 0.10*Math.sin(d/7) + 0.05*Math.sin(d/1.7));
}
const round3 = n => Math.round(n*1000)/1000;
function repairCost(condition){ return Math.round(Math.max(0,100-condition)*12); }
function estimate(km,kg,hasDriver,diesel){
  const price = diesel === undefined ? CFG.diesel : diesel;
  const fuel=km/100*8*price, toll=km*CFG.motorwayShare*CFG.tollPerKm, wear=km*CFG.wearPerKm;
  const cash=fuel+toll+wear, hours=km/CFG.speedKmh;
  const wage=hasDriver ? CFG.wage*(1+CFG.social)/30/8*hours : 0;
  const rent=CFG.rent/30/8*hours;
  return { fuel,toll,wear,cash,economic:cash+wage+rent };
}
function makeOffer(now, anchor, reachKm){
  let pool = CITIES;
  if (anchor) {
    const near = CITIES.filter(c => distKm(city(anchor), c) <= (reachKm || 130));
    if (near.length >= 2) pool = near;
  }
  const a = pick(pool);
  let b = pick(pool), guard = 0;
  while (b.n === a.n && guard++ < 30) b = pick(pool);
  if (b.n === a.n) b = pick(CITIES.filter(c => c.n !== a.n));
  const scale = !anchor ? 1 : (reachKm || 130) <= 160 ? 0.65 : (reachKm || 130) <= 400 ? 0.85 : 1;
  const km = distKm(a, b);
  const kg = Math.max(150, Math.round((180 + Math.random()*520) * scale / 50) * 50);
  const m3 = Math.round((kg/230 + 0.4)*10)/10;
  const price = Math.round((30 + km*(0.55+Math.random()*0.22) + kg*0.02)/5)*5;
  return {
    id:uid("o"), client:pick(CLIENTS), from:a.n, to:b.n, km:Math.round(km), kg, m3, price,
    created_at:now, expires_at:now+(2+Math.random()*5)*3600000, status:"open", reserved_by:null
  };
}
function hhmm(t){ return new Date(t).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}); }

module.exports = { CFG,CITIES,BASE_CITIES,CLIENTS,DNAMES,VANS,RECURRING_ROUTES,OUTLINE,ROADS,RIVERS,
  TIERS,tierFor,nextTier,withinKm,offerVisible,routeKey,
  pick,uid,city,distKm,travelMs,estimate,makeOffer,hhmm,fuelPrice,repairCost,
  ACHIEVEMENTS,WORLD_EVENTS };
