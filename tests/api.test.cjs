"use strict";
/* Testes de integração: arranca o servidor com uma BD temporária e limpa no fim. */
const test = require("node:test");
const { before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const PORT = 38991;
const BASE = `http://127.0.0.1:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ptlog-test-"));
const dbFile = path.join(dir, "game.db");
let server, db;

async function call(p, method = "GET", data = null, tok = null, key = null) {
  const h = { "Content-Type": "application/json" };
  if (tok) h.Authorization = "Bearer " + tok;
  if (key) h["X-API-Key"] = key;
  const r = await fetch(BASE + p, { method, headers: h, body: data ? JSON.stringify(data) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const delay = ms => new Promise(r => setTimeout(r, ms));

before(async () => {
  server = spawn(process.execPath, ["server/server.js"], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT), PTLOG_DB: dbFile },
    stdio: "ignore"
  });
  for (let i = 0; i < 80; i++) {
    try { const r = await call("/api/health"); if (r.status === 200) break; } catch {}
    await delay(100);
  }
  db = new DatabaseSync(dbFile);
  db.exec("PRAGMA busy_timeout = 5000");
});

after(async () => {
  if (db) { try { db.close(); } catch {} }
  if (server && !server.killed) server.kill();
  if (server && server.exitCode === null) {
    await new Promise(resolve => {
      server.once("exit", resolve);
      setTimeout(resolve, 3000);
    });
  }
  for (let i = 0; i < 6; i++) {
    try { fs.rmSync(dir, { recursive: true, force: true }); break; }
    catch { await delay(250); }
  }
});

test("health e versão da Fase 5", async () => {
  const h = await call("/api/health");
  assert.equal(h.status, 200);
  assert.equal(h.body.version, "6.0-fase5");
  assert.equal(h.body.pwa, true);
  assert.equal(h.body.publicApi, "/api/public/v1");
});

test("PWA servida com os cabeçalhos correctos", async () => {
  for (const [file, type] of [["/manifest.webmanifest", "application/manifest+json"], ["/icon.svg", "image/svg+xml"], ["/sw.js", "text/javascript"]]) {
    const r = await fetch(BASE + file);
    assert.equal(r.status, 200, file);
    assert.ok(r.headers.get("content-type").includes(type), file + " → " + r.headers.get("content-type"));
  }
  const sw = await fetch(BASE + "/sw.js");
  assert.equal(sw.headers.get("service-worker-allowed"), "/");
});

test("registo, login e state", async () => {
  const u = "teste_" + Date.now().toString().slice(-6);
  const reg = await call("/api/register", "POST", { username: u, password: "senha123", company: "Empresa Teste", base: "Évora" });
  assert.equal(reg.status, 200);
  const tok = reg.body.token;
  assert.ok(tok);
  const st = await call("/api/state", "GET", null, tok);
  assert.equal(st.status, 200);
  assert.equal(st.body.company.cash, 25000);
  assert.equal(st.body.warehouses.length, 1);
  assert.equal(st.body.warehouses[0].city, "Évora");
  assert.equal(st.body.leaderboard.total, 1);
  assert.equal(st.body.achievements.length, 0);
  assert.ok(st.body.market.event);

  const dup = await call("/api/register", "POST", { username: u, password: "senha123", company: "Outra", base: "Porto" });
  assert.equal(dup.status, 400);
  const bad = await call("/api/login", "POST", { username: u, password: "errada" });
  assert.equal(bad.status, 400);
  const login = await call("/api/login", "POST", { username: u, password: "senha123" });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  const unauth = await call("/api/state");
  assert.equal(unauth.status, 401);
});

test("ciclo: contratar, comprar, entregar e conquistar", async () => {
  const u = "ciclo_" + Date.now().toString().slice(-6);
  const reg = await call("/api/register", "POST", { username: u, password: "senha123", company: "Ciclo Teste", base: "Porto" });
  const tok = reg.body.token;
  assert.equal((await call("/api/drivers/hire", "POST", {}, tok)).status, 200);
  assert.equal((await call("/api/vehicles/buy", "POST", { model: "van" }, tok)).status, 200);
  const s = (await call("/api/state", "GET", null, tok)).body;
  const offer = s.offers.find(o => o.kg <= 800 && o.m3 <= 4 && !o.needs_stock);
  assert.ok(offer, "deve existir oferta para carrinha");
  const cid = db.prepare("SELECT id FROM companies WHERE name='Ciclo Teste'").get().id;
  const acc = await call("/api/offers/accept", "POST", { offerId: offer.id, vehicleId: s.vehicles[0].id, driverId: s.drivers[0].id }, tok);
  assert.equal(acc.status, 200);
  const tripId = acc.body.tripId;
  const now = db.prepare("SELECT now_ms FROM companies WHERE id=?").get(cid).now_ms;
  db.prepare("UPDATE trips SET end_at=? WHERE id=?").run(now - 1000, tripId);
  db.prepare("UPDATE events SET due_at=? WHERE ref_id=? AND type='trip_complete'").run(now - 1000, String(tripId));
  await delay(3200);
  const final = (await call("/api/state", "GET", null, tok)).body;
  assert.equal(final.stats.deliveries, 1);
  assert.ok(final.achievements.some(a => a.key === "first" && a.reward === 200));
  assert.ok(final.movements.some(m => m.ref_type === "achievement"));
  assert.ok(final.movements.some(m => m.ref_type === "tax"));
});

test("API pública: chaves, rate limit e revogação", async () => {
  const u = "api_" + Date.now().toString().slice(-6);
  const reg = await call("/api/register", "POST", { username: u, password: "senha123", company: "API Teste", base: "Lisboa" });
  const tok = reg.body.token;
  const created = await call("/api/apikeys/create", "POST", { label: "teste" }, tok);
  assert.equal(created.status, 200);
  const key = created.body.key;
  assert.ok(key.startsWith("plv1_"));
  const s = (await call("/api/state", "GET", null, tok)).body;
  assert.equal(s.apiKeys.length, 1);
  assert.ok(!JSON.stringify(s.apiKeys).includes(key));

  assert.equal((await call("/api/public/v1/stats")).status, 401);
  assert.equal((await call("/api/public/v1/stats", "GET", null, null, "plv1_bad")).status, 401);
  const stats = await call("/api/public/v1/stats", "GET", null, null, key);
  assert.equal(stats.status, 200);
  assert.ok(stats.body.companies >= 1);
  const lb = await call("/api/public/v1/leaderboard", "GET", null, null, key);
  assert.equal(lb.status, 200);
  assert.ok(lb.body.rows.length >= 1);

  let limited = false;
  for (let i = 0; i < 61; i++) {
    const r = await call("/api/public/v1/stats", "GET", null, null, key);
    if (r.status === 429) { limited = true; break; }
  }
  assert.ok(limited, "rate limit deve devolver 429 após 60 pedidos");

  assert.equal((await call("/api/apikeys/revoke", "POST", { id: s.apiKeys[0].id }, tok)).status, 200);
  assert.equal((await call("/api/public/v1/stats", "GET", null, null, key)).status, 401);
});
