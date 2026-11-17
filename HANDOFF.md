# HANDOFF — ponte Codex ↔ OpenCode ↔ sessões futuras

Fonte da verdade do projeto.

## Estado atual (17/11/2026) — FASE 3 CONCLUÍDA

- **Fase 0:** protótipo no GitHub Pages.
- **Fase 1:** API + SQLite + contas + relógio do servidor.
- **Fase 2:** armazéns, stock, contratos recorrentes, expedição automática.
- **Fase 3:** economia dinâmica (gasóleo, desgaste, avarias, reputação, impostos, crédito).
- **Stack:** Node 26.13.1, SQLite nativo, zero dependências npm.
- **API:** `/api/health` → `{"ok":true,"version":"4.0-fase3"}`.
- **Repo:** `josuemartinho/portugal-logistica`, main + tags de release por fase.

## Fase 3 — o que foi acrescentado

- `fuelPrice(now)` no motor do jogo: oscilação determinística ~€1,45–2,05/L; usada no cálculo de custos no momento da aceitação.
- `vehicles.condition` com desgaste por km; abaixo de 35% gera avaria na conclusão (custo + perda de reputação). Reparação em `/api/vehicles/repair`.
- `companies.reputation` (50 inicial): +2 por entrega, −4 por avaria; bónus/malus de 0,2% por ponto vs. 50, creditado como movimento idempotente.
- Imposto simplificado de 6% sobre cada receita de entrega.
- Tabela `loans`: `/api/loans/take` (€500–20 000, 3% de abertura) e `/api/loans/repay`; juros diários de 0,5% no processamento de dias.
- Cliente: 6 KPIs (inclui gasóleo e reputação), cartões de veículo com barra de estado, secção de crédito em Finanças.
- **Correção de bug:** limpeza de ofertas expiradas deixou de apagar ofertas reservadas referenciadas por `trips` (violação de FK ao avançar o tempo).

## Testes Fase 3 (todos verdes)

Versão, gasóleo, reputação inicial, empréstimo €2 000 → caixa €27 000 e dívida €2 060, entrega com imposto e bónus, desgaste 100→~92, avaria cobrada, reputação 52→48, reparação a 100%, juros diários, amortização parcial. Interface: 6 KPIs, sem erros de consola.

## Próximas fases

- Fase 4: ranking entre empresas, conquistas, eventos mundiais e API pública.
- Fase 5: PWA, configuração de deploy (Docker/Render/Fly), testes automatizados, documentação final.
