# HANDOFF — ponte Codex ↔ OpenCode ↔ sessões futuras

Fonte da verdade do projeto. Quem continuar, lê este arquivo primeiro.

## Estado atual (17/11/2026) — FASE 1 IMPLEMENTADA

- **Projeto:** simulador de logística em Portugal.
- **Fase 0:** protótipo `index.html` (single-file), publicado em `https://josuemartinho.github.io/portugal-logistica/`.
- **Fase 1:** implementada em `server/` + `public/`; arranca com `npm start` em `http://localhost:3000`.
- **Stack:** Node 26.13.1, SQLite nativo (`node:sqlite`), **zero dependências npm**.
- **Servidor de testes Fase 0:** `http://192.168.1.252:8080/index.html`.
- **API Fase 1:** `http://localhost:3000/api/health` → `{"ok":true,"version":"2.0-fase1"}`.

## Arquitetura da Fase 1

- `server/game.js` — constantes do mundo, distâncias, ofertas, custos.
- `server/db.js` — esquema SQLite, `advance()` (relógio), processamento de dias/entregas/NPCs, transações.
- `server/server.js` — API REST, registo/login (scrypt), sessões de 30 dias, estáticos.
- `public/` — cliente com mapa SVG redesenhado, navegação por ícones, cartões de contrato, finanças e timeline.
- `data/game.db` — base de dados local (não versionar).

## Garantias implementadas

- Relógio do servidor (`now_ms`) com avanço limitado a 30 dias de ausência.
- Reserva atómica: veículo + motorista + oferta verificados e atualizados em `BEGIN IMMEDIATE`.
- `trips.offer_id` UNIQUE impede reservar a mesma oferta duas vezes.
- Eventos `trip_complete` com `processed_at` + movimentos com `UNIQUE(ref_type, ref_id)` garantem pagamento único, inclusive sob concorrência.
- `INSERT OR IGNORE` em movimentos elimina corridas entre o timer do servidor e os pedidos.
- Timer de 2 s processa entregas mesmo sem navegador aberto.

## Testes realizados

- Registo, login, estado inicial (€25 000, 11 ofertas).
- Contratar motorista (€300) e comprar carrinha (€14 000) → caixa €10 700.
- Aceitar contrato, acelerar para 300×, forçar vencimento: 1 entrega, receita €335, custo €139,50, **2 movimentos exatos**, caixa estável em consultas repetidas.
- Veículo e motorista libertados no destino (Évora).
- 24 pedidos concorrentes a `/api/state`: zero erros.
- Interface no navegador: 4 KPIs, 5 separadores, 17 cidades, 11 cartões, zero erros de consola, sem overflow horizontal.

## Decisões

- Fase 1 roda localmente; o GitHub Pages continua com a Fase 0 porque Pages não executa Node.
- Publicar a Fase 1 exige host com Node: Render/Fly.io/VPS/Codespaces.
- Nenhuma integração automática Codex → OpenCode. Sincronização por este arquivo ou por cópia do texto.

## Próximos passos

- [ ] Escolher host com Node e publicar a Fase 1.
- [ ] Testes no celular contra `http://192.168.1.252:3000`.
- [ ] Fase 2: expedição automática, warehouses com stock, contratos recorrentes, API pública.
- [ ] Adicionar `.gitignore` para `data/`.
