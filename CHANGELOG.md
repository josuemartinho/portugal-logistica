# Changelog

## v6.0.0 — Fase 5 (17/11/2026)

- PWA: `manifest.webmanifest`, service worker (`sw.js`), ícone SVG, registo no cliente; API nunca cacheada.
- Configurações de deploy: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `render.yaml`, `fly.toml`.
- `PTLOG_DB` permite escolher o ficheiro da base de dados (testes e contentores).
- Testes automatizados com `node:test`: `npm test` (motor do jogo + integração HTTP).
- Documentação final: `README.md`, `DEPLOY.md`, `ROADMAP.md`, este changelog.
- Health: `{"ok":true,"version":"6.0-fase5","publicApi":"/api/public/v1","pwa":true}`.

## v5.0.0 — Fase 4

- Ranking top 10 com posição do jogador.
- 8 conquistas com recompensas creditadas no servidor.
- 4 eventos mundiais rotativos com efeitos em preços, gasóleo e duração.
- API pública `/api/public/v1/stats` e `/leaderboard` com chaves (`X-API-Key`), hash SHA-256 e limite de 60/min.
- Separador "Mundo" (7 separadores no total).
- Correções: coluna do ranking, mapeamento do texto do evento, refs de movimentos escopados por empresa.

## v4.0.0 — Fase 3

- Gasóleo determinístico e variável (≈€1,45–2,05/L).
- Desgaste por km, avaria abaixo de 35%, reparação paga.
- Reputação 50 inicial, +2 por entrega, −4 por avaria, bónus/malus de 0,2% por ponto.
- Imposto simplificado de 6% sobre receitas.
- Empréstimos (€500–20 000, 3% de abertura, 0,5%/dia) e amortização.
- Correção: limpeza de ofertas deixou de apagar ofertas referenciadas por viagens.

## v3.0.0 — Fase 2

- Armazéns (sede gratuita, filiais €800 + €120/mês), stock comprado a €0,50/kg e vendido a €0,68/kg.
- 5 rotas recorrentes com ofertas a cada 7 dias.
- Expedição automática no servidor.
- Cliente com 6 separadores e mapa reformulado.
- Correções: funções perdidas na reescrita e evento `trip_complete` reposto.

## v2.0.0 — Fase 1

- API REST + SQLite nativo + contas com scrypt + sessões de 30 dias.
- Relógio do servidor com avanço limitado a 30 dias de ausência.
- Reserva atómica de veículo/motorista/oferta; pagamento idempotente por viagem; timer de 2 s.
- Interface redesenhada com mapa SVG de Portugal.

## v1.0.0 — Fase 0

- Protótipo estático `index.html`, publicado no GitHub Pages.
