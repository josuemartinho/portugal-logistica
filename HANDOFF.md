# HANDOFF — ponte Codex ↔ OpenCode ↔ sessões futuras

Fonte da verdade do projeto. Quem continuar, lê este arquivo primeiro.

## Estado atual (17/11/2026) — FASE 4 CONCLUÍDA

- **Fase 0:** protótipo no GitHub Pages.
- **Fase 1:** API + SQLite + contas + relógio do servidor.
- **Fase 2:** armazéns, stock, contratos recorrentes, expedição automática.
- **Fase 3:** economia dinâmica (gasóleo, desgaste, avarias, reputação, impostos, crédito).
- **Fase 4:** ranking, conquistas, eventos mundiais e API pública com chaves.
- **Stack:** Node 26.13.1, SQLite nativo, zero dependências npm.
- **API:** `/api/health` → `{"ok":true,"version":"5.0-fase4","publicApi":"/api/public/v1"}`.
- **Repo:** `josuemartinho/portugal-logistica`, main + tags de release por fase.

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

## Próxima fase

- Fase 5: PWA (manifest + service worker + ícones), configurações de deploy (Docker/Render/Fly), testes automatizados com `node:test`, README/CHANGELOG/ROADMAP e documentação final.
