# Deploy

O servidor precisa de **Node 22.5+** e de um **volume persistente** para `data/game.db`. O GitHub Pages não executa Node e continua a servir apenas a Fase 0 (`index.html`).

## Local / LAN

```powershell
npm start
```

Porta 3000; `--PORT` via variável de ambiente. Para expor na LAN, o servidor já escuta em `0.0.0.0`.

## Docker (recomendado)

```powershell
docker compose up --build -d
```

- Imagem `portugal-logistica:7`, porta `3000:3000`.
- Volume `logistica-data` montado em `/app/data`.
- `PTLOG_DB=/app/data/game.db`.

## Render

1. Criar **Web Service** a partir do repositório.
2. O ficheiro `render.yaml` é detetado automaticamente (runtime `node`, `node server/server.js`, disco de 1 GB em `/data`).
3. Confirmar `PTLOG_DB=/data/game.db` e `PORT=3000`.
4. Health check: `GET /api/health` → `{"ok":true,"version":"7.0-fase6",...,"map":"leaflet-osrm"}`.

## Fly.io

1. `fly launch --no-deploy` (o `fly.toml` já está configurado).
2. Criar volume: `fly volumes create logistica_data --region fra --size 1`.
3. `fly deploy`.
4. O Dockerfile é usado; `/data` guarda a base de dados.

## Mapa e rede externa (Fase 6)

- O cliente carrega `vendor/leaflet.js` e `vendor/leaflet.css` localmente — sem CDN em runtime.
- Tiles vêm de `basemaps.cartocdn.com` (escuro/claro) e `server.arcgisonline.com` (satélite).
- As rotas são pedidas ao servidor (`POST /api/geo/routes`), que consulta `router.project-osrm.org` e guarda o resultado em `route_cache` no SQLite.
- Nenhuma chave de API é necessária. Se OSRM ou os tiles estiverem indisponíveis, o fallback haversine e o estilo escuro por defeito mantêm o jogo utilizável.
- Em ambientes com egress restrito, permitir os três domínios acima.

## Notas

- Definir sempre `PTLOG_DB` num caminho dentro do volume persistente; sem volume, os dados desaparecem no restart.
- A PWA funciona em qualquer destino HTTPS (ou `localhost`); o service worker (`ptlog-v7-fase6`) não cacheia `/api/`.
- Para atualizar, basta fazer push para `main`: as tags `vX.Y.Z-faseN` marcam cada fase.
