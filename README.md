# Portugal Logística

Simulador de logística rodoviária em Portugal. O servidor é a única fonte da verdade: reservas, relógio, economia, entregas e conquistas são processados no Node, mesmo sem navegador aberto. O cliente é apenas uma interface.

**Versão atual: Fase 5 — v6.0.0** · Node 22.5+ · SQLite nativo · **zero dependências npm**.

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

## Estrutura

```
server/game.js    constantes, cidades, distâncias, ofertas, eventos, conquistas
server/db.js      SQLite, transações, economia, progressão, chaves de API
server/server.js  HTTP, autenticação, rotas privadas e públicas, estáticos
public/           interface (7 separadores, mapa SVG, PWA)
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

Pública (cabeçalho `X-API-Key`):

- `GET /api/public/v1/stats`
- `GET /api/public/v1/leaderboard`

## Deploy

Ver [`DEPLOY.md`](DEPLOY.md). Resumo: `docker compose up --build`, ou importar `render.yaml` no Render, ou `fly launch` com o `fly.toml` incluído. Definir `PORT` e `PTLOG_DB` (caminho persistente). O GitHub Pages continua a servir apenas a Fase 0.

## Ligações

- Repositório: `https://github.com/josuemartinho/portugal-logistica`
- Releases: uma tag por fase (`v2.0.0-fase1` … `v6.0.0-fase5`)
- Protótipo Pages: `https://josuemartinho.github.io/portugal-logistica/`
- Guia do jogador: [`COMO_JOGAR.md`](COMO_JOGAR.md)

> A base de dados de desenvolvimento (`data/`) não é enviada para o GitHub.
