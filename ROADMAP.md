# Roadmap

## Concluído

- [x] Fase 0 — protótipo estático e Pages
- [x] Fase 1 — API, SQLite, contas, relógio do servidor
- [x] Fase 2 — armazéns, stock, contratos recorrentes, expedição automática
- [x] Fase 3 — economia dinâmica, reputação, crédito
- [x] Fase 4 — ranking, conquistas, eventos mundiais, API pública
- [x] Fase 5 — PWA, deploy, testes automatizados, documentação
- [x] Fase 6 — mapa Leaflet real, rotas OSRM em cache, 47 cidades, progressão local → regional → nacional

## Ideias para o futuro (fora do escopo atual)

- [ ] Autenticação de dois fatores e recuperação de palavra-passe por e-mail
- [ ] Painel de administrador para ajustar eventos e economicamente o mundo em tempo real
- [ ] Contratos negociáveis com prazos e penalizações por atraso
- [ ] Trânsito por zona, escolha de rotas alternativas e custos de portagem por troço
- [ ] Relatórios exportáveis (CSV/PDF) e webhooks na API pública
- [ ] Testes de carga e monitorização (Prometheus + Grafana)
- [ ] Tradução para inglês e espanhol
- [ ] Publicação da Fase 1+ em host com Node (Pages continua apenas com a Fase 0)

## Notas de manutenção

- A chave GitHub usada nas publicações esteve exposta no chat: **revogar e rodizar**.
- Sempre que o esquema mudar, usar `addColumn()` em `server/db.js` para não apagar dados existentes.
- Rotas OSRM são guardadas em `route_cache`; se o serviço público falhar, o fallback haversine mantém o jogo funcional.
- O service worker usa `ptlog-v7-fase6`; mudanças no app exigem atualizar essa constante.
- O servidor local exige que o PC fique ligado; hibernação encerra o processo e o acesso LAN.
