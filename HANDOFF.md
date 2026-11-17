# HANDOFF — ponte Codex ↔ OpenCode ↔ sessões futuras

Fonte da verdade do projeto. Quem continuar, lê este arquivo primeiro.

## Estado atual (17/11/2026) — TODAS AS FASES CONCLUÍDAS (0–5)

- **Fase 0:** protótipo no GitHub Pages.
- **Fase 1:** API + SQLite + contas + relógio do servidor.
- **Fase 2:** armazéns, stock, contratos recorrentes, expedição automática.
- **Fase 3:** economia dinâmica (gasóleo, desgaste, avarias, reputação, impostos, crédito).
- **Fase 4:** ranking, conquistas, eventos mundiais e API pública com chaves.
- **Stack:** Node 26.13.1, SQLite nativo, zero dependências npm.
- **Fase 5:** PWA, configurações de deploy, testes automatizados e documentação final.
- **API:** `/api/health` → `{"ok":true,"version":"6.0-fase5","publicApi":"/api/public/v1","pwa":true}`.
- **Repo:** `josuemartinho/portugal-logistica`, main + tags de release por fase (última: `v6.0.0-fase5`).

## Fase 4 — o que foi acrescentado

- Tabelas `achievements` e `api_keys`; colunas de evento em `market` e `stock_sold_kg` em `companies`.
- `WORLD_EVENTS` (4 eventos rotativos a cada 2 dias simulados) com efeitos reais em `price_mod` (novas ofertas), `fuel_mod` (custo na aceitação) e `time_mod` (duração da viagem).
- `ACHIEVEMENTS` (8 conquistas) avaliadas no servidor após cada `advance()`; recompensa creditada como movimento idempotente.
- `leaderboard()` no estado e em `GET /api/public/v1/leaderboard`.
- Chaves de API: `POST /api/apikeys/create` (devolve o valor uma vez), `GET /api/apikeys`, `POST /api/apikeys/revoke`. Só o hash SHA-256 é guardado.
- Rotas públicas `GET /api/public/v1/stats` e `/leaderboard` com `X-API-Key` e rate limit de 60/min em memória. O dispatcher distingue sessão (rotas privadas) de chave (rotas públicas).
- Cliente com 7 separadores (novo: **Mundo**) e documentação da API no próprio painel.
- **Correções de bugs:** ranking usava `users.name` (coluna correcta: `companies.name`); texto do evento mapeado de `event_message` → `message` no estado; refs de movimentos (`daily`, `loanint`, `wh`, `buy`, `hire`) passaram a incluir `companyId` para evitar colisão da `UNIQUE(ref_type, ref_id)` entre empresas.

## Testes Fase 4 (todos verdes)

Versão, estado com leaderboard/conquistas/chaves/evento, rotação do evento, entrega e conquista "first" com €200, recompensa creditada, ranking com posição, criação/listagem sem hash, 401 sem chave e com chave inválida, estatísticas e ranking públicos sem sessão, rate limit 60/min, revogação imediata. Interface: 7 separadores, 10 linhas de ranking, 8 conquistas, zero erros de consola, sem overflow.

## Fase 5 — o que foi acrescentado

- PWA: `public/manifest.webmanifest`, `public/sw.js` (cache do app shell, nunca de `/api/`), `public/icon.svg`, link no HTML e registo no cliente.
- `PTLOG_DB` em `server/db.js` permite escolher o ficheiro SQLite (usado pelos testes e pelos contentores).
- Deploy: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `render.yaml`, `fly.toml`, `DEPLOY.md`.
- Testes: `tests/game.test.cjs` (unitários) e `tests/api.test.cjs` (integração com servidor isolado em BD temporária), corridos com `npm test`.
- Docs finais: `README.md`, `CHANGELOG.md`, `ROADMAP.md`, `DEPLOY.md`; guia e handoff atualizados.

## Pendências não funcionais

- Revogar/rodizar a chave GitHub exposta no chat.
- Publicar a Fase 1+ num host com Node (Pages continua com a Fase 0).
- Ideias futuras listadas em `ROADMAP.md`.
