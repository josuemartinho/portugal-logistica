"use strict";
/* API HTTP + autenticação + ficheiros estáticos. Zero dependências externas. */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { db, tx, companyOf, getState, acceptOffer, buyVehicle, hireDriver, setSpeed, advance,
  ensureBaseWarehouse, rentWarehouse, buyStock, sellStock, signRecurring, cancelRecurring, setAutoDispatch,
  takeLoan, repayLoan, repairVehicle,
  publicStats, leaderboard, createApiKey, listApiKeys, revokeApiKey, authApiKey } = require("./db");
const { CFG, BASE_CITIES } = require("./game");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, "..", "public");
const SESSION_MS = 30*86400000;

const hash = s => crypto.createHash("sha256").update(s).digest("hex");
const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff" });
  res.end(body);
};
function body(req){
  return new Promise((resolve,reject) => {
    let raw = "";
    req.on("data", c => { raw += c; if (raw.length > 16384) { reject(Error("Pedido demasiado grande.")); req.destroy(); } });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(Error("JSON inválido.")); } });
    req.on("error", reject);
  });
}
function auth(req){
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  const s = db.prepare("SELECT * FROM sessions WHERE token_hash=? AND expires_at>?").get(hash(token), Date.now());
  if (!s) return null;
  return companyOf(s.user_id) || null;
}
function newSession(userId){
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
    .run(hash(token), userId, Date.now(), Date.now()+SESSION_MS);
  return token;
}

const routes = {
  "POST /api/register": async (req,res) => {
    const b = await body(req);
    const username = String(b.username||"").trim();
    const password = String(b.password||"");
    const name = String(b.company||"").trim();
    const base = String(b.base||"");
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) throw Error("Utilizador: 3–20 letras, números, _ ou -.");
    if (password.length < 6) throw Error("A senha precisa de pelo menos 6 caracteres.");
    if (!name || name.length > 40) throw Error("Nome da empresa inválido.");
    if (!BASE_CITIES.includes(base)) throw Error("Base inválida.");
    const salt = crypto.randomBytes(16).toString("hex");
    const passHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const result = tx(() => {
      const exists = db.prepare("SELECT 1 FROM users WHERE username=?").get(username);
      if (exists) throw Error("Esse utilizador já existe.");
      const u = db.prepare("INSERT INTO users(username,pass_hash,salt,created_at) VALUES(?,?,?,?)")
        .run(username, passHash, salt, Date.now());
      const userId = Number(u.lastInsertRowid), now = Date.now();
      db.prepare(`INSERT INTO companies(user_id,name,base_city,cash,now_ms,last_real_ms,last_day,speed,next_npc_at,created_at)
                  VALUES(?,?,?,?,?,?,?,1,?,?)`)
        .run(userId, name, base, CFG.capital, now, now, Math.floor(now/86400000), now+15*60000, now);
      ensureBaseWarehouse(userId, base);
      return userId;
    });
    json(res, 200, { token:newSession(result), username });
  },
  "POST /api/login": async (req,res) => {
    const b = await body(req);
    const u = db.prepare("SELECT * FROM users WHERE username=?").get(String(b.username||"").trim());
    if (!u) throw Error("Utilizador ou senha incorrectos.");
    const ok = crypto.timingSafeEqual(Buffer.from(u.pass_hash,"hex"), crypto.scryptSync(String(b.password||""), u.salt, 64));
    if (!ok) throw Error("Utilizador ou senha incorrectos.");
    json(res, 200, { token:newSession(u.id), username:u.username });
  },
  "POST /api/logout": async (req,res) => {
    const h = req.headers.authorization || "";
    if (h.startsWith("Bearer ")) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(h.slice(7)));
    json(res, 200, { ok:true });
  },
  "GET /api/health": async (req,res) => json(res, 200, { ok:true, version:"5.0-fase4", publicApi:"/api/public/v1" }),
  "GET /api/state": async (req,res,company) => json(res, 200, getState(company.id)),
  "POST /api/offers/accept": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, acceptOffer(company.id, String(b.offerId), Number(b.vehicleId), Number(b.driverId)));
  },
  "POST /api/vehicles/buy": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, buyVehicle(company.id, String(b.model)));
  },
  "POST /api/drivers/hire": async (req,res,company) => json(res, 200, hireDriver(company.id)),
  "POST /api/speed": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, setSpeed(company.id, b.speed));
  },
  // Fase 2
  "POST /api/warehouses/rent": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, rentWarehouse(company.id, String(b.city||"")));
  },
  "POST /api/inventory/buy": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, buyStock(company.id, Number(b.warehouseId), Number(b.kg)));
  },
  "POST /api/inventory/sell": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, sellStock(company.id, Number(b.warehouseId), Number(b.kg)));
  },
  "POST /api/recurring/sign": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, signRecurring(company.id, String(b.routeId||"")));
  },
  "POST /api/recurring/cancel": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, cancelRecurring(company.id, b.id));
  },
  "POST /api/autodispatch": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, setAutoDispatch(company.id, !!b.on));
  },
  // Fase 3
  "POST /api/loans/take": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, takeLoan(company.id, b.amount));
  },
  "POST /api/loans/repay": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, repayLoan(company.id, b.id, b.amount));
  },
  "POST /api/vehicles/repair": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, repairVehicle(company.id, b.vehicleId));
  },
  // Fase 4 — chaves de API (gestão privada)
  "POST /api/apikeys/create": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, createApiKey(company.id, b.label));
  },
  "GET /api/apikeys": async (req,res,company) => json(res, 200, { keys:listApiKeys(company.id) }),
  "POST /api/apikeys/revoke": async (req,res,company) => {
    const b = await body(req);
    json(res, 200, revokeApiKey(company.id, b.id));
  },
  // Fase 4 — API pública (autenticação por chave, sem sessão)
  "GET /api/public/v1/stats": async (req,res,key) => json(res, 200, publicStats()),
  "GET /api/public/v1/leaderboard": async (req,res,key) => json(res, 200, {
    ok:true, generatedAt:Date.now(), ...leaderboard(key.companyId), keyLabel:key.label
  })
};

const MIME = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8", ".json":"application/json", ".svg":"image/svg+xml",
  ".png":"image/png", ".ico":"image/x-icon", ".md":"text/markdown; charset=utf-8" };
function staticFile(req,res,pathname){
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  const clean = path.normalize(rel).replace(/^([\\/])+/, "");
  const file = path.resolve(PUBLIC, clean);
  if (!file.startsWith(PUBLIC)) { json(res,403,{error:"Acesso negado."}); return; }
  fs.readFile(file, (err,data) => {
    if (err) { json(res,404,{error:"Não encontrado."}); return; }
    res.writeHead(200, { "Content-Type":MIME[path.extname(file)]||"application/octet-stream",
      "Cache-Control":"no-cache", "X-Content-Type-Options":"nosniff" });
    res.end(data);
  });
}

const OPEN = new Set(["POST /api/register","POST /api/login","POST /api/logout","GET /api/health"]);
const rate = new Map();
function allowApiKey(key){
  const now = Date.now(), rec = rate.get(key.id);
  if (!rec || now >= rec.reset) {
    if (rate.size > 500) rate.delete(rate.keys().next().value);
    rate.set(key.id, { count:1, reset:now+60000 });
    return true;
  }
  if (rec.count >= 60) return false;
  rec.count++;
  return true;
}

const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const routeKey = req.method + " " + url.pathname;
    const route = routes[routeKey];
    if (route) {
      // Rotas públicas usam chave de API, nunca sessão.
      if (routeKey.startsWith("GET /api/public/")) {
        const key = authApiKey(req.headers["x-api-key"]);
        if (!key) { json(res,401,{error:"Chave de API inválida ou ausente. Use o cabeçalho X-API-Key."}); return; }
        if (!allowApiKey(key)) { json(res,429,{error:"Limite de 60 pedidos/minuto excedido."}); return; }
        await route(req,res,key); return;
      }
      if (OPEN.has(routeKey)) { await route(req,res,null); return; }
      const company = auth(req);
      if (!company) { json(res,401,{error:"Sessão expirada. Inicie sessão novamente."}); return; }
      await route(req,res,company); return;
    }
    if (url.pathname.startsWith("/api/")) { json(res,404,{error:"Endpoint inexistente."}); return; }
    staticFile(req,res,url.pathname);
  } catch (e) {
    json(res,400,{error:e.message||"Erro inesperado."});
  }
});

// Relógio do mundo: processa entregas mesmo sem ninguém ligado.
setInterval(() => {
  for (const c of db.prepare("SELECT id FROM companies").all()) {
    try { advance(c.id); } catch (e) { /* outro tick resolve */ }
  }
}, 2000).unref();

server.listen(PORT, "0.0.0.0", () => console.log(`Portugal Logística Fase 1 em http://localhost:${PORT}`));
