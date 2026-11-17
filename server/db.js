"use strict";
/* Camada de dados + regras transacionais. SQLite nativo do Node, sem dependências. */

const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const G = require("./game");
const { CFG, VANS, DNAMES, pick, uid, estimate, travelMs, makeOffer, hhmm } = G;

const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "game.db"));
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_city TEXT NOT NULL,
  cash REAL NOT NULL,
  now_ms INTEGER NOT NULL,
  last_real_ms INTEGER NOT NULL,
  last_day INTEGER NOT NULL,
  speed INTEGER NOT NULL DEFAULT 1,
  next_npc_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  at_city TEXT NOT NULL,
  status TEXT NOT NULL,
  km REAL NOT NULL DEFAULT 0,
  trip_id INTEGER
);
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  at_city TEXT NOT NULL,
  status TEXT NOT NULL,
  trip_id INTEGER
);
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  km INTEGER NOT NULL,
  kg INTEGER NOT NULL,
  m3 REAL NOT NULL,
  price REAL NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  reserved_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status, expires_at);
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL UNIQUE REFERENCES offers(id),
  client TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  km INTEGER NOT NULL,
  price REAL NOT NULL,
  cost_cash REAL NOT NULL,
  cost_economic REAL NOT NULL,
  vehicle_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  processed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id, processed_at);
CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  balance REAL NOT NULL,
  at INTEGER NOT NULL,
  ref_type TEXT,
  ref_id TEXT,
  UNIQUE(ref_type, ref_id)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  due_at INTEGER NOT NULL,
  ref_id TEXT NOT NULL,
  processed_at INTEGER,
  UNIQUE(company_id, type, ref_id)
);
CREATE INDEX IF NOT EXISTS idx_events_due ON events(processed_at, due_at);
CREATE TABLE IF NOT EXISTS npcs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  cash REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS event_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  at INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL
);
`);

if (db.prepare("SELECT COUNT(*) n FROM npcs").get().n === 0) {
  const ins = db.prepare("INSERT INTO npcs(name,cash) VALUES(?,?)");
  for (const [n, c] of [["TransRápido",9000],["Norte Cargas",11000],["Alfa Transportes",8000]]) ins.run(n,c);
}

function tx(fn) {
  db.exec("BEGIN IMMEDIATE");
  try { const r = fn(); db.exec("COMMIT"); return r; }
  catch (e) { try { db.exec("ROLLBACK"); } catch {} throw e; }
}
const round = n => Math.round(n*100)/100;
function companyOf(userId){ return db.prepare("SELECT * FROM companies WHERE user_id=?").get(userId); }
function companyById(id){ return db.prepare("SELECT * FROM companies WHERE id=?").get(id); }

function log(companyId, type, message, at){
  db.prepare("INSERT INTO event_log(company_id,at,type,message) VALUES(?,?,?,?)").run(companyId, at, type, message);
}
function move(companyId, type, description, amount, at, refType, refId){
  const c = companyById(companyId);
  const bal = round(c.cash + amount);
  const res = db.prepare(`INSERT OR IGNORE INTO movements(company_id,type,description,amount,balance,at,ref_type,ref_id)
              VALUES(?,?,?,?,?,?,?,?)`).run(companyId, type, description, amount, bal, at, refType||null, refId||null);
  if (res.changes === 0) return false;
  db.prepare("UPDATE companies SET cash=? WHERE id=?").run(bal, companyId);
  return true;
}

function processDays(companyId, now, fromDay, createdAt){
  const target = Math.floor(now/86400000), createdDay = Math.floor(createdAt/86400000);
  let day = fromDay, guard = 0;
  while (day < target && guard++ < 40) {
    day++;
    if (day <= createdDay) continue;
    const wages = db.prepare("SELECT COUNT(*) n FROM drivers WHERE company_id=?").get(companyId).n * CFG.wage*(1+CFG.social);
    const total = round(CFG.rent + wages);
    if (total > 0) {
      move(companyId, "cost", `Aluguer da base + ordenados · ${new Date(day*86400000).toLocaleDateString("pt-PT")}`, -total, day*86400000, "daily", String(day));
      log(companyId, "info", `Despesas do dia: €${total.toFixed(2)}`, day*86400000);
    }
    db.prepare("UPDATE companies SET last_day=? WHERE id=?").run(day, companyId);
  }
}
function processEvents(companyId, now){
  const due = db.prepare("SELECT * FROM events WHERE company_id=? AND processed_at IS NULL AND due_at<=? ORDER BY due_at").all(companyId, now);
  for (const ev of due) {
    tx(() => {
      if (ev.type === "trip_complete") {
        const trip = db.prepare("SELECT * FROM trips WHERE id=? AND company_id=?").get(Number(ev.ref_id), companyId);
        if (trip && trip.processed_at === null) {
          db.prepare("UPDATE vehicles SET at_city=?,status='idle',trip_id=NULL WHERE id=? AND company_id=?")
            .run(trip.to_city, trip.vehicle_id, companyId);
          db.prepare("UPDATE drivers SET at_city=?,status='idle',trip_id=NULL WHERE id=? AND company_id=?")
            .run(trip.to_city, trip.driver_id, companyId);
          move(companyId, "revenue", `Entrega ${trip.client} · ${trip.from_city} → ${trip.to_city}`, trip.price, now, "trip", "rev_"+trip.id);
          move(companyId, "cost", `Combustível, portagens e desgaste · ${trip.from_city} → ${trip.to_city}`, -trip.cost_cash, now, "trip", "cost_"+trip.id);
          db.prepare("UPDATE trips SET processed_at=? WHERE id=?").run(now, trip.id);
          log(companyId, "good", `Entrega concluída: ${trip.client} → margem €${(trip.price-trip.cost_cash).toFixed(2)}`, now);
        }
      }
      db.prepare("UPDATE events SET processed_at=? WHERE id=?").run(now, ev.id);
    });
  }
}
function processNpcs(companyId, now){
  const c = companyById(companyId);
  if (now < c.next_npc_at) return;
  const next = now + (10+Math.random()*15)*60000;
  db.prepare("UPDATE companies SET next_npc_at=? WHERE id=?").run(next, companyId);
  for (const npc of db.prepare("SELECT * FROM npcs").all()) {
    if (Math.random() > 0.28) continue;
    const open = db.prepare("SELECT * FROM offers WHERE status='open' AND expires_at>? AND kg<=1500").all(now);
    if (!open.length) continue;
    const o = pick(open);
    if (o.kg > npc.cash/8) continue;
    db.prepare("UPDATE offers SET status='npc' WHERE id=?").run(o.id);
    db.prepare("UPDATE npcs SET cash=? WHERE id=?").run(round(npc.cash-o.price*0.75), npc.id);
    log(companyId, "bad", `${npc.name} ganhou o contrato ${o.client} (${o.from_city} → ${o.to_city})`, now);
  }
  db.prepare("DELETE FROM offers WHERE status!='open' AND expires_at<?").run(now-3600000);
}
function refreshOffers(now){
  const open = db.prepare("SELECT COUNT(*) n FROM offers WHERE status='open' AND expires_at>?").get(now).n;
  const ins = db.prepare(`INSERT INTO offers(id,client,from_city,to_city,km,kg,m3,price,created_at,expires_at,status)
                          VALUES(@id,@client,@from_city,@to_city,@km,@kg,@m3,@price,@created_at,@expires_at,'open')`);
  for (let i=open; i<CFG.offerTarget; i++) {
    const o = makeOffer(now);
    ins.run({ id:o.id, client:o.client, from_city:o.from, to_city:o.to,
      km:o.km, kg:o.kg, m3:o.m3, price:o.price,
      created_at:o.created_at, expires_at:o.expires_at });
  }
}
function advance(companyId){
  const c = companyById(companyId);
  if (!c) return;
  const real = Date.now();
  const delta = Math.min(Math.max(0, real-c.last_real_ms), CFG.maxAbsenceDays*86400000);
  const now = c.now_ms + Math.round(delta*c.speed);
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("UPDATE companies SET now_ms=?,last_real_ms=? WHERE id=?").run(now, real, companyId);
    processDays(companyId, now, c.last_day, c.created_at);
    refreshOffers(now);
    db.exec("COMMIT");
  } catch(e){ try{db.exec("ROLLBACK")}catch{} throw e; }
  processEvents(companyId, now);
  processNpcs(companyId, now);
}

function getState(companyId){
  advance(companyId);
  const c = companyById(companyId);
  const offers = db.prepare("SELECT * FROM offers WHERE status='open' AND expires_at>? ORDER BY expires_at").all(c.now_ms)
    .map(o => ({ ...o, window: hhmm(o.created_at+2*3600000)+" – "+hhmm(o.created_at+8*3600000) }));
  const trips = db.prepare("SELECT * FROM trips WHERE company_id=? ORDER BY id DESC LIMIT 20").all(companyId);
  const movements = db.prepare("SELECT * FROM movements WHERE company_id=? ORDER BY id DESC LIMIT 60").all(companyId);
  const logRows = db.prepare("SELECT * FROM event_log WHERE company_id=? ORDER BY id DESC LIMIT 40").all(companyId);
  const stats = db.prepare(`SELECT
      COUNT(*) FILTER (WHERE processed_at IS NOT NULL) deliveries,
      COALESCE(SUM(CASE WHEN processed_at IS NOT NULL THEN price ELSE 0 END),0) revenue,
      COALESCE(SUM(CASE WHEN processed_at IS NOT NULL THEN cost_cash ELSE 0 END),0) costs
    FROM trips WHERE company_id=?`).get(companyId);
  return {
    company: { name:c.name, base:c.base_city, cash:round(c.cash), now:c.now_ms, speed:c.speed, createdAt:c.created_at },
    vehicles: db.prepare("SELECT * FROM vehicles WHERE company_id=? ORDER BY id").all(companyId),
    drivers: db.prepare("SELECT * FROM drivers WHERE company_id=? ORDER BY id").all(companyId),
    offers, trips, movements, log:logRows,
    npcs: db.prepare("SELECT id,name,cash FROM npcs").all(),
    stats: { ...stats, npcWins: db.prepare("SELECT COUNT(*) n FROM offers WHERE status='npc'").get().n,
             margin: round(stats.revenue-stats.costs) }
  };
}

function acceptOffer(companyId, offerId, vehicleId, driverId){
  advance(companyId);
  return tx(() => {
    const c = companyById(companyId);
    const o = db.prepare("SELECT * FROM offers WHERE id=?").get(offerId);
    if (!o || o.status !== "open" || o.expires_at <= c.now_ms) throw Error("Esta oferta já não está disponível.");
    const v = db.prepare("SELECT * FROM vehicles WHERE id=? AND company_id=?").get(vehicleId, companyId);
    const d = db.prepare("SELECT * FROM drivers WHERE id=? AND company_id=?").get(driverId, companyId);
    if (!v || v.status !== "idle") throw Error("Veículo indisponível.");
    if (!d || d.status !== "idle") throw Error("Motorista indisponível.");
    const spec = VANS[v.model];
    if (o.kg > spec.kg || o.m3 > spec.m3) throw Error("O veículo não suporta esta carga.");
    const cost = estimate(o.km, o.kg, true);
    if (c.cash < cost.cash) throw Error("Caixa insuficiente para os custos estimados.");
    const start = c.now_ms, end = start + travelMs(o.km);
    const info = db.prepare(`INSERT INTO trips(company_id,offer_id,client,from_city,to_city,km,price,cost_cash,cost_economic,vehicle_id,driver_id,start_at,end_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(companyId, o.id, o.client, o.from_city, o.to_city, o.km, o.price, round(cost.cash), round(cost.economic), v.id, d.id, start, end);
    const tripId = Number(info.lastInsertRowid);
    db.prepare("UPDATE offers SET status='reserved', reserved_by=? WHERE id=? AND status='open'").run(companyId, o.id);
    db.prepare("UPDATE vehicles SET status='travel', trip_id=? WHERE id=? AND status='idle'").run(tripId, v.id);
    db.prepare("UPDATE drivers SET status='travel', trip_id=? WHERE id=? AND status='idle'").run(tripId, d.id);
    db.prepare("INSERT INTO events(company_id,type,due_at,ref_id) VALUES(?,?,?,?)").run(companyId, "trip_complete", end, String(tripId));
    log(companyId, "good", `Contrato aceite: ${o.client} · ${o.from_city} → ${o.to_city} · chegada ${new Date(end).toLocaleString("pt-PT")}`, start);
    return { ok:true, tripId };
  });
}
function buyVehicle(companyId, model){
  advance(companyId);
  return tx(() => {
    const spec = VANS[model]; if (!spec) throw Error("Modelo inválido.");
    const c = companyById(companyId);
    if (c.cash < spec.price) throw Error("Caixa insuficiente.");
    if (db.prepare("SELECT COUNT(*) n FROM vehicles WHERE company_id=?").get(companyId).n >= CFG.maxVehicles) throw Error("Limite de veículos atingido.");
    db.prepare("INSERT INTO vehicles(company_id,model,at_city,status,km) VALUES(?,?,?,'idle',0)").run(companyId, model, c.base_city);
    move(companyId, "cost", `Compra de ${spec.name}`, -spec.price, c.now_ms, "buy", "vehicle_"+Date.now());
    log(companyId, "info", `Comprou ${spec.name} por €${spec.price.toFixed(2)}`, c.now_ms);
    return { ok:true };
  });
}
function hireDriver(companyId){
  advance(companyId);
  return tx(() => {
    const c = companyById(companyId);
    if (c.cash < CFG.hireCost) throw Error("Caixa insuficiente.");
    if (db.prepare("SELECT COUNT(*) n FROM drivers WHERE company_id=?").get(companyId).n >= CFG.maxDrivers) throw Error("Limite de motoristas atingido.");
    const used = db.prepare("SELECT name FROM drivers WHERE company_id=?").all(companyId).map(d=>d.name);
    const name = DNAMES.find(n=>!used.includes(n)) || pick(DNAMES);
    db.prepare("INSERT INTO drivers(company_id,name,at_city,status) VALUES(?,?,?,'idle')").run(companyId, name, c.base_city);
    move(companyId, "cost", `Firma de ${name}`, -CFG.hireCost, c.now_ms, "hire", "driver_"+Date.now());
    log(companyId, "info", `Contratou ${name}`, c.now_ms);
    return { ok:true };
  });
}
function setSpeed(companyId, speed){
  if (![1,60,300].includes(Number(speed))) throw Error("Velocidade inválida.");
  db.prepare("UPDATE companies SET speed=? WHERE id=?").run(Number(speed), companyId);
  return { ok:true };
}

module.exports = { db, tx, companyOf, getState, acceptOffer, buyVehicle, hireDriver, setSpeed, advance, log };
