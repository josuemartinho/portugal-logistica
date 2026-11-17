# Portugal Logística

Simulador de logística rodoviária em Portugal. O servidor é a única fonte da verdade: reservas, relógio, economia, entregas, conquistas e geometria das rotas são processados no Node, mesmo sem navegador aberto. O cliente apenas desenha o que a API devolve.

**Versão atual: Fase 7 — v8.0.0** · Node 22.5+ · SQLite nativo · **zero dependências npm** (Leaflet 1.9.4 é servido localmente em `public/vendor/`).

O mapa é agora uma aba própria: desenha só as **rotas em execução** e **167 clientes potenciais reais** (Pingo Doce, Continente, Stellantis, Delta Cafés, Sofrapa, farmácias, oficinas e autopeças). Os contratos ficam na aba **Contratos**, sem faixa por baixo do mapa.

## Começar

```powershell
cd "C:\Users\josue\OneDrive\Documentos\Projeto Padrão"
npm start
```

Abrir `http://localhost:3000`. Na mesma Wi-Fi, `http://192.168.1.252:3000`.

```powershell
npm test        # testes unitários + integração
npm run health  # health check do servidor local
```

## O que já existe

| Fase | Conteúdo |
|---|---|
| 0 | Protótipo estático no GitHub Pages (`index.html`) |
| 1 | API REST, SQLite, contas scrypt, sessões, relógio do servidor, reserva atómica, pagamento idempotente |
| 2 | Armazéns, stock, contratos recorrentes, expedição automática |
| 3 | Gasóleo dinâmico, desgaste/avarias, reparação, reputação, imposto, empréstimos |
| 4 | Ranking, 8 conquistas, 4 eventos mundiais, API pública com chaves e rate limit |
| 5 | PWA, Docker/Render/Fly, testes `node:test`, documentação final |
| 6 | Mapa Leaflet real, rotas OSRM em cache, 47 cidades, progressão local → regional → nacional |

## Estrutura

```
server/game.js    constantes, 47 cidades, níveis de expansão, distâncias, ofertas, eventos, conquistas
server/db.js      SQLite, transações, economia, cache de rotas, progressão, chaves de API
server/server.js  HTTP, autenticação, rotas privadas e públicas, /api/geo/routes, estáticos
public/           interface (7 separadores, mapa Leaflet real, PWA)
public/vendor/    leaflet.js e leaflet.css servidos localmente
tests/            testes unitários e de integração
data/             base de dados local (não versionada)
```

## API

Privada (sessão `Bearer <token>`):

- `POST /api/register`, `POST /api/login`, `POST /api/logout`
- `GET /api/state`, `GET /api/health`
- `POST /api/offers/accept`, `/api/vehicles/buy`, `/api/vehicles/repair`, `/api/drivers/hire`, `/api/speed`
- `/api/warehouses/rent`, `/api/inventory/buy`, `/api/inventory/sell`
- `/api/recurring/sign`, `/api/recurring/cancel`, `/api/autodispatch`
- `/api/loans/take`, `/api/loans/repay`
- `/api/apikeys/create`, `GET /api/apikeys`, `/api/apikeys/revoke`
- `POST /api/geo/routes` — recebe `{"pairs":[["Lisboa","Porto"]]}` e devolve geometria real (GeoJSON) cacheada

Pública (cabeçalho `X-API-Key`):

- `GET /api/public/v1/stats`
- `GET /api/public/v1/leaderboard`

## Mapa e rotas (Fase 6)

- Tiles: CARTO `dark_all` / `light_all` e Esri World Imagery (satélite), todos públicos, sem chaves pagas.
- Rotas: OSRM público, guardadas em `route_cache` no SQLite. Se o OSRM falhar, o servidor usa distância haversine e desenha uma linha direta — o jogo continua.
- O servidor usa os km reais da rota em cache para custo e duração quando disponíveis.
- Empresas começam em **Local** (130 km), evoluem para **Regional** (320 km) e depois **Nacional**, conforme entregas, reputação, armazéns e caixa.
- O mapa mostra, em camadas independentes: ofertas, viagens em curso (posição interpolada sobre a geometria real), frota, armazéns, histórico, outras empresas e raio de alcance.

## Deploy

Ver [`DEPLOY.md`](DEPLOY.md). Resumo: `docker compose up --build`, ou importar `render.yaml` no Render, ou `fly launch` com o `fly.toml` incluído. Definir `PORT` e `PTLOG_DB` (caminho persistente). O GitHub Pages continua a servir apenas a Fase 0. O mapa precisa de acesso de saída aos domínios de tiles e ao OSRM; não requer chaves.

## Ligações

- Repositório: `https://github.com/josuemartinho/portugal-logistica`
- Releases: uma tag por fase (`v2.0.0-fase1` … `v8.0.0-fase7`)
- Protótipo Pages: `https://josuemartinho.github.io/portugal-logistica/`
- Guia do jogador: [`COMO_JOGAR.md`](COMO_JOGAR.md)

> A base de dados de desenvolvimento (`data/`) não é enviada para o GitHub.
