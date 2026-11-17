# Roadmap

## Concluído

- [x] Fase 0 — protótipo estático e Pages
- [x] Fase 1 — API, SQLite, contas, relógio do servidor
- [x] Fase 2 — armazéns, stock, contratos recorrentes, expedição automática
- [x] Fase 3 — economia dinâmica, reputação, crédito
- [x] Fase 4 — ranking, conquistas, eventos mundiais, API pública
- [x] Fase 5 — PWA, deploy, testes automatizados, documentação

## Ideias para o futuro (fora do escopo atual)

- [ ] Autenticação de dois fatores e recuperação de palavra-passe por e-mail
- [ ] Painel de administrador para ajustar eventos e economicamente o mundo em tempo real
- [ ] Contratos negociáveis com prazos e penalizações por atraso
- [ ] Mapa com trânsito por zona e escolha de rotas alternativas
- [ ] Relatórios exportáveis (CSV/PDF) e webhooks na API pública
- [ ] Testes de carga e monitorização (Prometheus + Grafana)
- [ ] Tradução para inglês e espanhol
- [ ] Publicação da Fase 1+ em host com Node (Pages continua apenas com a Fase 0)

## Notas de manutenção

- A chave GitHub usada nas publicações esteve exposta no chat: **revogar e rodizar**.
- Sempre que o esquema mudar, usar `addColumn()` em `server/db.js` para não apagar dados existentes.
- O servidor local exige que o PC fique ligado; hibernação encerra o processo e o acesso LAN.
