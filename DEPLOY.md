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

- Imagem `portugal-logistica:6`, porta `3000:3000`.
- Volume `logistica-data` montado em `/app/data`.
- `PTLOG_DB=/app/data/game.db`.

## Render

1. Criar **Web Service** a partir do repositório.
2. O ficheiro `render.yaml` é detetado automaticamente (runtime `node`, `node server/server.js`, disco de 1 GB em `/data`).
3. Confirmar `PTLOG_DB=/data/game.db` e `PORT=3000`.
4. Health check: `GET /api/health`.

## Fly.io

1. `fly launch --no-deploy` (o `fly.toml` já está configurado).
2. Criar volume: `fly volumes create logistica_data --region fra --size 1`.
3. `fly deploy`.
4. O Dockerfile é usado; `/data` guarda a base de dados.

## Notas

- Definir sempre `PTLOG_DB` num caminho dentro do volume persistente; sem volume, os dados desaparecem no restart.
- A PWA funciona em qualquer destino HTTPS (ou `localhost`); o service worker não cacheia `/api/`.
- Para atualizar, basta fazer push para `main`: as tags `vX.Y.Z-faseN` marcam cada fase.
