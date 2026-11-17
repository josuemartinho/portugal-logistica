"use strict";
/* Testes unitários do motor do jogo — sem servidor, sem base de dados. */
const test = require("node:test");
const assert = require("node:assert/strict");
const G = require("../server/game");

test("constantes e catálogos da Fase 6", () => {
  assert.equal(G.CFG.capital, 25000);
  assert.equal(G.CFG.taxRate, 0.06);
  assert.ok(G.CITIES.length >= 45, `cidades=${G.CITIES.length}`);
  assert.equal(G.TIERS.length, 3);
  assert.equal(G.RECURRING_ROUTES.length, 5);
  assert.equal(G.ACHIEVEMENTS.length, 8);
  assert.equal(G.WORLD_EVENTS.length, 4);
  assert.deepEqual(Object.keys(G.VANS), ["van", "truck"]);
  assert.equal(G.routeKey("Porto","Lisboa"), G.routeKey("Lisboa","Porto"));
});

test("distância e tempo de viagem", () => {
  assert.equal(G.distKm(G.city("Porto"), G.city("Porto")), 0);
  const km = G.distKm(G.city("Lisboa"), G.city("Porto"));
  assert.ok(km > 250 && km < 400, `km=${km}`);
  assert.equal(G.travelMs(100), (30 + 100 / 65 * 60 + 20) * 60000);
});

test("preço do gasóleo é determinístico e limitado", () => {
  const now = Date.now();
  assert.equal(G.fuelPrice(now), G.fuelPrice(now));
  for (let d = 0; d < 30; d++) {
    const p = G.fuelPrice(now + d * 86400000);
    assert.ok(p >= 1.4 && p <= 2.1, `dia ${d}: ${p}`);
  }
});

test("custo de reparação", () => {
  assert.equal(G.repairCost(100), 0);
  assert.equal(G.repairCost(50), 600);
  assert.equal(G.repairCost(0), 1200);
});

test("estimativa de custos", () => {
  const e = G.estimate(100, 500, true, 1.75);
  assert.equal(Math.round(e.fuel * 100) / 100, 14);
  assert.equal(Math.round(e.toll * 100) / 100, 6);
  assert.ok(e.cash > e.fuel + e.toll);
  assert.ok(e.economic > e.cash);
  const noDriver = G.estimate(100, 500, false, 1.75);
  assert.ok(noDriver.economic < e.economic);
});

test("ofertas geradas são válidas", () => {
  const now = Date.now();
  for (let i = 0; i < 50; i++) {
    const o = G.makeOffer(now);
    assert.ok(o.id.startsWith("o_"));
    assert.notEqual(o.from, o.to);
    assert.ok(o.km > 0 && o.kg >= 150 && o.kg <= 750);
    assert.ok(o.price > 0 && o.expires_at > o.created_at);
  }
  assert.notEqual(G.uid("x"), G.uid("x"));
});

test("progressão geográfica local → regional → nacional", () => {
  assert.equal(G.tierFor({ deliveries:0, reputation:50, warehouses:1 }).key, "local");
  assert.equal(G.tierFor({ deliveries:5, reputation:50, warehouses:1 }).key, "regional");
  assert.equal(G.tierFor({ deliveries:0, reputation:80, warehouses:1 }).key, "national");
  assert.equal(G.tierFor({ deliveries:0, reputation:50, warehouses:2 }).key, "regional");
  assert.equal(G.tierFor({ deliveries:0, reputation:50, warehouses:1, cash:50000 }).key, "national");
  const next = G.nextTier(G.TIERS[0], { deliveries:2, reputation:55, warehouses:1 });
  assert.equal(next.key, "regional");
  assert.ok(next.missing.some(x => x.includes("3 entregas")));
});

test("ofertas locais e visibilidade por alcance", () => {
  const now = Date.now();
  for (let i = 0; i < 40; i++) {
    const o = G.makeOffer(now, "Faro", 130);
    assert.ok(G.withinKm("Faro", o.from, 130), `${o.from} fora do alcance`);
    assert.ok(G.withinKm("Faro", o.to, 130), `${o.to} fora do alcance`);
    assert.ok(o.kg >= 150 && o.kg <= 500, `kg=${o.kg}`);
    assert.ok(G.offerVisible(o, "Faro", G.TIERS[0]));
  }
  const long = G.makeOffer(now);
  assert.ok(G.offerVisible(long, "Faro", G.TIERS[2]));
});
