# HANDOFF — ponte Codex ↔ OpenCode ↔ sessões futuras

Fonte da verdade do projeto. Quem continuar, lê este arquivo primeiro.

## Estado atual (17/11/2026) — FASES 0–7 CONCLUÍDAS

- **Fase 0:** protótipo no GitHub Pages.
- **Fase 1:** API + SQLite + contas + relógio do servidor.
- **Fase 2:** armazéns, stock, contratos recorrentes, expedição automática.
- **Fase 3:** economia dinâmica (gasóleo, desgaste, avarias, reputação, impostos, crédito).
- **Fase 4:** ranking, conquistas, eventos mundiais e API pública com chaves.
- **Fase 5:** PWA, configurações de deploy, testes automatizados e documentação final.
- **Fase 6:** mapa Leaflet real, rotas OSRM em cache, 47 cidades, progressão local → regional → nacional.
- **Fase 7:** mapa em aba própria, só rotas em execução, 167 POIs de clientes reais, estilos com fallback e persistência.
- **Stack:** Node 26.13.1 (mínimo 22.5), SQLite nativo, zero dependências npm; Leaflet 1.9.4 servido localmente.
- **API:** `/api/health` → `{"ok":true,"version":"8.0-fase7","publicApi":"/api/public/v1","pwa":true,"map":"leaflet-osrm","pois":true}`.
- **Repo:** `josuemartinho/portugal-logistica`, main + tags de release por fase (última: `v8.0.0-fase7`).
- **Servidor:** `http://localhost:3000` e `http://192.168.1.252:3000`; exige PC ligado.

## Fase 6 — o que foi acrescentado

- `server/game.js`: 47 cidades reais, `TIERS`, `tierFor`, `nextTier`, `withinKm`, `offerVisible`, `routeKey`; `makeOffer(now, anchor, reachKm)` gera contratos locais com carga reduzida.
- `server/db.js`: tabela `route_cache` (GeoJSON + km + duração + provider), `companyContext`, `ensureRoute`/`ensureRoutes`, `cachedRouteKm`. `advance()` garanta 3 ofertas locais por base e `getState()` filtra pelo alcance. `acceptOfferTx()` usa km reais em cache para custo/tempo.
- `server/server.js`: `POST /api/geo/routes` (até 60 pares por pedido) e health `7.0-fase6`.
- `public/index.html`: `[id=map]` Leaflet, controlos `#mapStyles` (dark/light/sat) e `#layerToggles`, HUD com `#hudTier`, scripts Leaflet locais antes de `app.js`.
- `public/app.js`: `initMap`, `renderMap`, `requestRoutes`, `fitNetwork`, `partialGeometry`, `lineFor`; camadas `offers`, `trips`, `assets`, `history`, `companies`, `reach`. Posição da viagem interpolada sobre a geometria real. Cartão de progressão no Mercado.
- `public/styles.css`: estilos do mapa, pins, HUD, `tier-card` e responsividade móvel.
- `public/sw.js`: cache `ptlog-v7-fase6`, inclui `vendor/leaflet.js` e `vendor/leaflet.css`.
- `public/vendor/leaflet.js` e `leaflet.css`: biblioteca local (sem CDN em runtime).
- Carto `dark_all`/`light_all`, Esri World Imagery e OSRM público: sem chaves. Fallback haversine se OSRM falhar.

## Testes Fase 6 (todos verdes)

`npm test` → **14/14**. Inclui health `7.0-fase6`, PWA, registo/state, cidades/alcance/geometria `/api/geo/routes` (km 200–500, provider `osrm|fallback`), ciclo completo de contratação/entrega/conquista, API pública com rate limit, constantes, distâncias, custos, progressão e ofertas locais.

Validação no browser (servidor real, service worker e cache limpos): Leaflet ativo, 1 canvas de overlays, 47 cidades, 6 ofertas, 9 tiles CARTO carregados, 1 rota OSRM com 1374 pontos, HUD `Local · 130 km`, cartão de progressão presente, 3 estilos (dark/light/satélite) com tiles carregados, toggle de ofertas 18 → 0 → 18, zero erros de consola. Screenshot bloqueado apenas porque a janela desktop não estava visível.

## Correções feitas na Fase 6

- `overlays` não declarado em `initMap` → `ReferenceError` ao arrancar.
- Estilo satélite: `subdomains: undefined` fazia o Leaflet lançar `Cannot read properties of undefined (reading 'length')`; passou a `subdomains: c.subdomains || "abc"`.
- Estilo claro: URL `positron` devolvia 404; corrigida para `light_all`.
- Pool global de ofertas podia esgotar-se para bases novas → `refreshOffers()` passou a garantir 3 locais.

## Fase 7 — mapa limpo e rede de clientes

- **Estrutura:** `#tabs` saiu do painel lateral e passou a ser a navegação principal do `.app` (8 separadores: Mapa, Contratos, Armazéns, Frota, Equipa, Finanças, Mundo, Histórico). `#viewMap` e `#viewPanel` são mutuamente exclusivos via `syncViews()`/`setTab()`. A faixa `.ops`/`#strip` foi eliminada do HTML, do CSS ativo e de `render()`.
- **Mapa:** `layerState` reduzido a `trips`, `pois`, `assets`, `reach`. `renderMap()` desenha apenas viagens com `!processed_at` (traçado OSRM + progresso) e POIs; ofertas, histórico e leaderboard deixaram de aparecer no mapa. `fitNetwork()` usa base + rotas ativas + POIs visíveis.
- **POIs:** `server/game.js` exporta `POI_CATEGORIES` (7 categorias) e `POIS` (167 pontos: 11 destacados + gerados por cidade). `db.getState()` expõe `geo.poiCategories` e `geo.pois`. `renderPoiFilters()`/`togglePoiCat()` filtram por categoria; popup mostra marca, cidade e "Cliente em potencial".
- **Estilos:** `applyMapStyle()` persiste em `localStorage.ptlog_map_style`, aplica ao arranque, troca de tiles com fallback em cascata (CARTO → OSM; Esri → Esri alternativo → OSM) após 5 `tileerror`, e define `.mapwrap[data-style]` com fundo próprio. SW registrado com `reg.update()` no arranque e em `visibilitychange`.
- **Testes:** `npm test` → **15/15**. Browser: 167 marcadores e 7 filtros, 3 estilos com tiles carregados em desktop e iframe 390 px, troca Mapa ↔ Contratos sem faixa inferior, sem overflow em 320/390/1200 px, zero erros de consola.
- **Nota:** autenticação continua intocada, conforme pedido do utilizador.

## Correção mobile (v7.0.1)

- **Problema:** no telemóvel, os controlos do mapa (`z-index` 500 do Leaflet e dos toggles) apareciam por cima do modal de login porque `.mapwrap` não isolava o *stacking context*.
- **Correção:** `.mapwrap{position:relative;isolation:isolate;z-index:0}`; `.overlay{z-index:1000}`; `.toast{z-index:1100}`.
- **Controlos:** botão **Camadas** (`toggleLayers()` em `app.js`) abre/fecha o painel de camadas; no desktop o botão está oculto e o painel é sempre visível.
- **Responsividade:** `100dvh`, topbar compacta, grelha com mapa maior, modal com `row2` numa coluna, `tier-card`/`section-head` com wrap, HUD e `maptools` ajustados para 320 px.
- **Validação:** iframes em 320×568, 390×844 e 1200×800; `elementFromPoint` no centro do modal aponta para o formulário; sem overflow horizontal; alternância de camadas 18 → 0 → 18; zero erros de consola.
- **Nota:** a pedido do utilizador, autenticação não foi alterada — fica para quando ele pedir explicitamente.

## Pendências não funcionais

- Revogar/rodizar a chave GitHub exposta no chat.
- Publicar a Fase 1+ num host com Node (Pages continua com a Fase 0).
- Ideias futuras listadas em `ROADMAP.md`.
