"use strict";
/* Camada de dados + regras transacionais. SQLite nativo do Node, sem dependências. */

const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const G = require("./game");
const { CFG, VANS, DNAMES, RECURRING_ROUTES, pick, uid, estimate, travelMs, makeOffer, hhmm } = G;

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
CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  rent_monthly REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(company_id, city)
);
CREATE TABLE IF NOT EXISTS stock (
  warehouse_id INTEGER PRIMARY KEY REFERENCES warehouses(id) ON DELETE CASCADE,
  kg REAL NOT NULL DEFAULT 0,
  value REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS recurring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL,
  client TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  kg INTEGER NOT NULL,
  price REAL NOT NULL,
  interval_ms INTEGER NOT NULL,
  next_due_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(company_id, route_id)
);
`);

/* Migrações leves — acrescentam colunas sem apagar dados existentes. */
function addColumn(table, name, def){
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
}
addColumn("companies", "auto_dispatch", "INTEGER NOT NULL DEFAULT 0");
addColumn("offers", "kind", "TEXT NOT NULL DEFAULT 'market'");
addColumn("offers", "recurring_id", "INTEGER");
addColumn("offers", "needs_stock", "INTEGER NOT NULL DEFAULT 0");
addColumn("trips", "kind", "TEXT NOT NULL DEFAULT 'market'");
addColumn("trips", "stock_kg", "REAL NOT NULL DEFAULT 0");
addColumn("trips", "stock_value", "REAL NOT NULL DEFAULT 0");
addColumn("trips", "from_wh", "INTEGER");
addColumn("trips", "to_wh", "INTEGER");

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

function ensureBaseWarehouse(companyId, city){
  if (db.prepare("SELECT 1 FROM warehouses WHERE company_id=? AND city=?").get(companyId, city)) return;
  const r = db.prepare("INSERT INTO warehouses(company_id,city,rent_monthly,created_at) VALUES(?,?,0,?)")
    .run(companyId, city, Date.now());
  db.prepare("INSERT INTO stock(warehouse_id,kg,value) VALUES(?,0,0)").run(Number(r.lastInsertRowid));
}

function processDays(companyId, now, fromDay, createdAt){
  const target = Math.floor(now/86400000), createdDay = Math.floor(createdAt/86400000);
  let day = fromDay, guard = 0;
  while (day < target && guard++ < 40) {
    day++;
    if (day <= createdDay) continue;
    const wages = db.prepare("SELECT COUNT(*) n FROM drivers WHERE company_id=?").get(companyId).n * CFG.wage*(1+CFG.social);
    const whRent = db.prepare("SELECT COALESCE(SUM(rent_monthly),0) v FROM warehouses WHERE company_id=?").get(companyId).v;
    const total = round(CFG.rent + wages + whRent);
    if (total > 0) {
      move(companyId, "cost", `Aluguer base/armazéns + ordenados · ${new Date(day*86400000).toLocaleDateString("pt-PT")}`, -total, day*86400000, "daily", String(day));
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
          if (trip.kind === "recurring" && trip.stock_kg > 0) {
            const wh = trip.to_wh ? db.prepare("SELECT id FROM warehouses WHERE id=? AND company_id=?").get(trip.to_wh, companyId)
                                  : db.prepare("SELECT id FROM warehouses WHERE company_id=? AND city=?").get(companyId, trip.to_city);
            if (wh) {
              db.prepare("UPDATE stock SET kg=round(kg+?,2), value=round(value+?,2) WHERE warehouse_id=?")
                .run(trip.stock_kg, trip.stock_value, wh.id);
              log(companyId, "info", `${trip.stock_kg} kg recebidos no armazém de ${trip.to_city}`, now);
            } else {
              const sale = round(trip.stock_kg * CFG.goodsSell);
              move(companyId, "revenue", `Venda de mercadoria em ${trip.to_city}`, sale, now, "sale", "sale_"+trip.id);
              log(companyId, "good", `Mercadoria vendida em ${trip.to_city}: €${sale.toFixed(2)}`, now);
            }
          }
          db.prepare("UPDATE trips SET processed_at=? WHERE id=?").run(now, trip.id);
          log(companyId, "good", `Entrega concluída: ${trip.client} → margem €${(trip.price-trip.cost_cash).toFixed(2)}`, now);
        }
      }
      db.prepare("UPDATE events SET processed_at=? WHERE id=?").run(now, ev.id);
    });
  }
}

function processRecurring(companyId, now){
  const rows = db.prepare("SELECT * FROM recurring WHERE company_id=? AND active=1 AND next_due_at<=?").all(companyId, now);
  for (const r of rows) {
    const cycles = Math.max(1, Math.ceil((now - r.next_due_at) / r.interval_ms));
    db.prepare("UPDATE recurring SET next_due_at=? WHERE id=?").run(r.next_due_at + cycles*r.interval_ms, r.id);
    const km = Math.round(G.distKm(G.city(r.from_city), G.city(r.to_city)));
    const m3 = Math.round((r.kg/230+0.4)*10)/10;
    db.prepare(`INSERT INTO offers(id,client,from_city,to_city,km,kg,m3,price,created_at,expires_at,status,kind,recurring_id,needs_stock)
                VALUES(?,?,?,?,?,?,?,?,?,?,'open','recurring',?,1)`)
      .run(uid("rr"), r.client, r.from_city, r.to_city, km, r.kg, m3, r.price, now, now+6*3600000, r.id);
    log(companyId, "info", `Novo contrato recorrente: ${r.client} · ${r.from_city} → ${r.to_city}`, now);
  }
}

function autoDispatch(companyId){
  const c = companyById(companyId);
  if (!c || !c.auto_dispatch) return;
  const open = db.prepare("SELECT * FROM offers WHERE status='open' AND kind='recurring' AND needs_stock=1 AND expires_at>?").all(c.now_ms);
  for (const o of open) {
    const wh = db.prepare(`SELECT w.id,s.kg,s.value FROM warehouses w JOIN stock s ON s.warehouse_id=w.id
                           WHERE w.company_id=? AND w.city=?`).get(companyId, o.from_city);
    if (!wh || wh.kg < o.kg) continue;
    const v = db.prepare("SELECT * FROM vehicles WHERE company_id=? AND status='idle' ORDER BY id LIMIT 1").get(companyId);
    const d = db.prepare("SELECT * FROM drivers WHERE company_id=? AND status='idle' ORDER BY id LIMIT 1").get(companyId);
    if (!v || !d || VANS[v.model].kg < o.kg || VANS[v.model].m3 < o.m3) continue;
    try {
      tx(() => acceptOfferTx(companyId, o.id, v.id, d.id));
      log(companyId, "good", `Expedição automática: ${o.client} · ${o.from_city} → ${o.to_city}`, c.now_ms);
    } catch {}
  }
}

function processNpcs(companyId, now){
  const c = companyById(companyId);
  if (now < c.next_npc_at) return;
  const next = now + (10+Math.random()*15)*60000;
  db.prepare("UPDATE companies SET next_npc_at=? WHERE id=?").run(next, companyId);
  for (const npc of db.prepare("SELECT * FROM npcs").all()) {
    if (Math.random() > 0.28) continue;
    const open = db.prepare("SELECT * FROM offers WHERE status='open' AND kind='market' AND expires_at>? AND kg<=1500").all(now);
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
    ensureBaseWarehouse(companyId, c.base_city);
    processDays(companyId, now, c.last_day, c.created_at);
    processRecurring(companyId, now);
    refreshOffers(now);
    db.exec("COMMIT");
  } catch(e){ try{db.exec("ROLLBACK")}catch{} throw e; }
  processEvents(companyId, now);
  processNpcs(companyId, now);
  autoDispatch(companyId);
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
  const warehouses = db.prepare(`SELECT w.*, COALESCE(s.kg,0) kg, COALESCE(s.value,0) stock_value
    FROM warehouses w LEFT JOIN stock s ON s.warehouse_id=w.id WHERE w.company_id=? ORDER BY w.id`).all(companyId);
  return {
    company: { name:c.name, base:c.base_city, cash:round(c.cash), now:c.now_ms, speed:c.speed,
               createdAt:c.created_at, autoDispatch:!!c.auto_dispatch },
    vehicles: db.prepare("SELECT * FROM vehicles WHERE company_id=? ORDER BY id").all(companyId),
    drivers: db.prepare("SELECT * FROM drivers WHERE company_id=? ORDER BY id").all(companyId),
    warehouses,
    stockTotal: round(warehouses.reduce((a,w)=>a+w.kg,0)),
    recurring: db.prepare("SELECT * FROM recurring WHERE company_id=? ORDER BY id DESC").all(companyId),
    recurringCatalog: RECURRING_ROUTES,
    offers, trips, movements, log:logRows,
    npcs: db.prepare("SELECT id,name,cash FROM npcs").all(),
    stats: { ...stats, npcWins: db.prepare("SELECT COUNT(*) n FROM offers WHERE status='npc'").get().n,
             margin: round(stats.revenue-stats.costs) }
  };
}

function acceptOfferTx(companyId, offerId, vehicleId, driverId){
  const c = companyById(companyId);
  const o = db.prepare("SELECT * FROM offers WHERE id=?").get(offerId);
  if (!o || o.status !== "open" || o.expires_at <= c.now_ms) throw Error("Esta oferta já não está disponível.");
  const v = db.prepare("SELECT * FROM vehicles WHERE id=? AND company_id=?").get(vehicleId, companyId);
  const d = db.prepare("SELECT * FROM drivers WHERE id=? AND company_id=?").get(driverId, companyId);
  if (!v || v.status !== "idle") throw Error("Veículo indisponível.");
  if (!d || d.status !== "idle") throw Error("Motorista indisponível.");
  const spec = VANS[v.model];
  if (o.kg > spec.kg || o.m3 > spec.m3) throw Error("O veículo não suporta esta carga.");
  let fromWh = null, toWh = null, stockKg = 0, stockValue = 0;
  if (o.needs_stock) {
    fromWh = db.prepare(`SELECT w.id,s.kg,s.value FROM warehouses w JOIN stock s ON s.warehouse_id=w.id
                         WHERE w.company_id=? AND w.city=?`).get(companyId, o.from_city);
    if (!fromWh || fromWh.kg < o.kg) throw Error("Stock insuficiente no armazém de origem.");
    toWh = db.prepare("SELECT id FROM warehouses WHERE company_id=? AND city=?").get(companyId, o.to_city);
    stockKg = o.kg;
    stockValue = round(fromWh.value * (o.kg / fromWh.kg));
    db.prepare("UPDATE stock SET kg=round(kg-?,2), value=round(value-?,2) WHERE warehouse_id=?")
      .run(o.kg, stockValue, fromWh.id);
  }
  const cost = estimate(o.km, o.kg, true);
  if (c.cash < cost.cash) throw Error("Caixa insuficiente para os custos estimados.");
  const start = c.now_ms, end = start + travelMs(o.km);
  const info = db.prepare(`INSERT INTO trips(company_id,offer_id,client,from_city,to_city,km,price,cost_cash,cost_economic,
                    vehicle_id,driver_id,start_at,end_at,kind,stock_kg,stock_value,from_wh,to_wh)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(companyId, o.id, o.client, o.from_city, o.to_city, o.km, o.price, round(cost.cash), round(cost.economic),
           v.id, d.id, start, end, o.kind, stockKg, stockValue, fromWh?fromWh.id:null, toWh?toWh.id:null);
  const tripId = Number(info.lastInsertRowid);
  db.prepare("UPDATE offers SET status='reserved', reserved_by=? WHERE id=? AND status='open'").run(companyId, o.id);
  db.prepare("UPDATE vehicles SET status='travel', trip_id=? WHERE id=? AND status='idle'").run(tripId, v.id);
  db.prepare("UPDATE drivers SET status='travel', trip_id=? WHERE id=? AND status='idle'").run(tripId, d.id);
  db.prepare("INSERT INTO events(company_id,type,due_at,ref_id) VALUES(?,?,?,?)")
    .run(companyId, "trip_complete", end, String(tripId));
  log(companyId, "good", `Contrato aceite: ${o.client} · ${o.from_city} → ${o.to_city} · chegada ${new Date(end).toLocaleString("pt-PT")}`, start);
  return { ok:true, tripId };
}
function acceptOffer(companyId, offerId, vehicleId, driverId){
  advance(companyId);
  return tx(() => acceptOfferTx(companyId, offerId, vehicleId, driverId));
}

function rentWarehouse(companyId, city){
  advance(companyId);
  return tx(() => {
    const c = companyById(companyId);
    if (!G.CITIES.some(x=>x.n===city)) throw Error("Cidade inválida.");
    if (db.prepare("SELECT 1 FROM warehouses WHERE company_id=? AND city=?").get(companyId,city)) throw Error("Já tem armazém nesta cidade.");
    if (db.prepare("SELECT COUNT(*) n FROM warehouses WHERE company_id=?").get(companyId).n >= CFG.maxWarehouses) throw Error("Limite de armazéns atingido.");
    if (c.cash < CFG.warehouseDeposit) throw Error("Caixa insuficiente para a caução.");
    const r = db.prepare("INSERT INTO warehouses(company_id,city,rent_monthly,created_at) VALUES(?,?,?,?)")
      .run(companyId, city, CFG.warehouseRent, c.now_ms);
    db.prepare("INSERT INTO stock(warehouse_id,kg,value) VALUES(?,0,0)").run(Number(r.lastInsertRowid));
    move(companyId, "cost", `Caução do armazém de ${city}`, -CFG.warehouseDeposit, c.now_ms, "wh", "wh_"+city+"_"+c.now_ms);
    log(companyId, "info", `Armazém aberto em ${city}`, c.now_ms);
    return { ok:true };
  });
}
function buyStock(companyId, warehouseId, kg){
  advance(companyId);
  return tx(() => {
    const c = companyById(companyId);
    const w = db.prepare("SELECT w.*,s.kg,s.value FROM warehouses w JOIN stock s ON s.warehouse_id=w.id WHERE w.id=? AND w.company_id=?").get(warehouseId, companyId);
    if (!w) throw Error("Armazém inválido.");
    const qty = Math.round(Number(kg)/10)*10;
    if (qty < 10) throw Error("Quantidade mínima: 10 kg.");
    const cost = round(qty*CFG.goodsBuy), ref = "buy_"+warehouseId+"_"+c.now_ms+"_"+qty;
    if (c.cash < cost) throw Error("Caixa insuficiente.");
    if (!move(companyId, "cost", `Compra de ${qty} kg em ${w.city}`, -cost, c.now_ms, "goods", ref)) return { ok:true };
    db.prepare("UPDATE stock SET kg=round(kg+?,2), value=round(value+?,2) WHERE warehouse_id=?").run(qty, cost, warehouseId);
    return { ok:true, cost };
  });
}
function sellStock(companyId, warehouseId, kg){
  advance(companyId);
  return tx(() => {
    const c = companyById(companyId);
    const w = db.prepare("SELECT w.*,s.kg,s.value FROM warehouses w JOIN stock s ON s.warehouse_id=w.id WHERE w.id=? AND w.company_id=?").get(warehouseId, companyId);
    if (!w) throw Error("Armazém inválido.");
    const qty = Math.min(w.kg, Math.round(Number(kg)/10)*10);
    if (qty < 10) throw Error("Stock insuficiente.");
    const rev = round(qty*CFG.goodsSell), ref = "sell_"+warehouseId+"_"+c.now_ms+"_"+qty;
    if (!move(companyId, "revenue", `Venda de ${qty} kg em ${w.city}`, rev, c.now_ms, "goods", ref)) return { ok:true };
    db.prepare("UPDATE stock SET kg=round(kg-?,2), value=round(value-?,2) WHERE warehouse_id=?")
      .run(qty, round(w.value*(qty/w.kg)), warehouseId);
    return { ok:true, revenue:rev };
  });
}
function signRecurring(companyId, routeId){
  advance(companyId);
  return tx(() => {
    const c = companyById(companyId);
    const r = RECURRING_ROUTES.find(x=>x.id===routeId);
    if (!r) throw Error("Rota inválida.");
    if (db.prepare("SELECT 1 FROM recurring WHERE company_id=? AND route_id=?").get(companyId,routeId)) throw Error("Já assinou esta rota.");
    if (db.prepare("SELECT COUNT(*) n FROM recurring WHERE company_id=? AND active=1").get(companyId).n >= CFG.maxRecurring) throw Error("Limite de contratos recorrentes atingido.");
    db.prepare(`INSERT INTO recurring(company_id,route_id,client,from_city,to_city,kg,price,interval_ms,next_due_at,active,created_at)
                VALUES(?,?,?,?,?,?,?,?,?,1,?)`)
      .run(companyId, r.id, r.client, r.from, r.to, r.kg, r.price, r.days*86400000, c.now_ms+r.days*86400000, c.now_ms);
    log(companyId, "info", `Contrato recorrente assinado: ${r.client} · ${r.from} → ${r.to}`, c.now_ms);
    return { ok:true };
  });
}
function cancelRecurring(companyId, id){
  advance(companyId);
  db.prepare("UPDATE recurring SET active=0 WHERE id=? AND company_id=?").run(Number(id), companyId);
  return { ok:true };
}
function setAutoDispatch(companyId, on){
  db.prepare("UPDATE companies SET auto_dispatch=? WHERE id=?").run(on?1:0, companyId);
  return { ok:true };
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

module.exports = { db, tx, companyOf, companyById, ensureBaseWarehouse, getState, acceptOffer,
  buyVehicle, hireDriver, setSpeed, advance, log,
  rentWarehouse, buyStock, sellStock, signRecurring, cancelRecurring, setAutoDispatch };
