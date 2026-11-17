# HANDOFF — ponte Codex ↔ OpenCode ↔ sessões futuras

Fonte da verdade do projeto. Quem continuar, lê este arquivo primeiro.

## Estado atual (17/11/2026) — FASE 2 CONCLUÍDA

- **Fase 0:** protótipo `index.html`, publicado no GitHub Pages.
- **Fase 1:** API + SQLite + contas + relógio do servidor (`npm start`, porta 3000).
- **Fase 2:** armazéns, stock, contratos recorrentes e expedição automática.
- **Stack:** Node 26.13.1, SQLite nativo (`node:sqlite`), zero dependências npm.
- **API:** `/api/health` → `{"ok":true,"version":"3.0-fase2"}`.
- **Repo:** `josuemartinho/portugal-logistica` (main + tags de release por fase).

## Fase 2 — o que foi acrescentado

- Tabelas `warehouses`, `stock`, `recurring`; colunas `kind`, `needs_stock`, `recurring_id` em ofertas e `stock_kg`, `stock_value`, `from_wh`, `to_wh` em viagens.
- Sede recebe armazém gratuito no registo; filiais custam €800 + €120/mês (máx. 3).
- Mercadoria comprada a €0,50/kg e vendida a €0,68/kg.
- 5 rotas recorrentes no catálogo; cada uma gera uma oferta a cada 7 dias de tempo simulado.
- Aceitar oferta recorrente debita stock na origem; na conclusão, credita stock no destino ou vende automaticamente.
- `auto_dispatch`: o servidor reserva e envia contratos recorrentes quando há veículo, motorista e stock.
- Cliente com 6 separadores (novo: **Armazéns**).

## Testes Fase 2 (todos verdes)

Armazém inicial, compra de 300 kg (€150), caixa €10 550, geração de oferta recorrente, aceitação com stock, débito na origem, conclusão com receita €520, venda automática em Lisboa (€204), veículo livre no destino, expedição automática disparada. Interface: 6 separadores, 7 cartões, zero erros de consola, sem overflow.

## Decisões

- GitHub Pages mantém a Fase 0 (não executa Node). Fase 1+ precisa de host com Node.
- Publicação por GitHub API com tag + release a cada fase.
- Sincronização Codex ↔ OpenCode por este arquivo.

## Próximas fases

- Fase 3: economia dinâmica (combustível, desgaste, reputação, crédito, impostos).
- Fase 4: ranking, conquistas, eventos mundiais e API pública.
- Fase 5: PWA, configuração de deploy, testes automatizados e documentação final.
