# HANDOFF — ponte Codex ↔ OpenCode

Este arquivo é a **fonte da verdade** do projeto. Quem pegar o trabalho depois (Codex, OpenCode ou eu mesmo noutra sessão) lê este arquivo primeiro e continua daqui — sem precisar reconstruir o histórico.

## Estado atual (17/11/2026)

- **Projeto:** simulador de logística em Portugal.
- **Origem:** PDFs do Codex na Área de Trabalho (`futuro_jogo_logistica.pdf`, antigo `esquema_logistica_jogo.pdf`). Ele não deixou código salvo.
- **Local do código:** `C:\Users\josue\OneDrive\Documentos\Projeto Padrão`
- **Arquivos:**
  - `index.html` — protótipo jogável, single-file, sem dependências (24,8 kB).
  - `PLANO_FASE0.md` — Fase 0 concluída (economia, catálogo, cidades, backlog).
  - `COMO_JOGAR.md` — instruções de teste.
  - `HANDOFF.md` — este arquivo.
- **Sessão OpenCode:** título `Continuação da criação do jogo`, id `ses_e15c2fc75ffeSvxIZfUHszNIXQ`.
- **Serviço OpenCode:** v2.3.0, `http://127.0.0.1:28894`, remote via OpenTunnel ativado.
- **Servidor de testes do jogo:** `http://127.0.0.1:8080/index.html` (LAN `http://192.168.1.252:8080/index.html`).

## O que já funciona (testado no navegador, sem erros de consola)

Criar empresa, contratar motorista, comprar veículo, 11 ofertas de clientes reais, reserva de veículo+motorista, viagem com posição no mapa, pagamento único na conclusão, despesas diárias, NPCs com capacidade limitada, persistência em `localStorage`, seletor 1×/60×/300× para testes rápidos.

## Decisões tomadas

- Protótipo em arquivo único + `localStorage` para permitir teste imediato sem servidor.
- Tempo acelerado é **modo demo explícito** no ecrã, não regra de produção.
- Publicação prevista: GitHub Pages (estático) ou Netlify;o jogo em si não precisa de backend.
- Fase 1 (não feita): API + base relacional, reservas atómicas, autenticação, idempotência de eventos.

## Como manter o Codex atualizado sem ficar desatualizado

1. O Codex deve **ler este arquivo** antes de qualquer alteração.
2. Quem terminar uma alteração **atualiza este arquivo** (seção "Estado atual" + "Próximos passos").
3. Se o Codex não puder escrever aqui, colar o resumo dele nesta conversa — eu leio e incorporo.
4. Não existe integração automática Codex → OpenCode; a sincronização é por este arquivo ou por cópia do texto.

## Próximos passos

- [ ] Publicar no GitHub Pages (depende de token de acesso do usuário).
- [ ] Continuar testes no celular recarregando a URL do jogo.
- [ ] Fase 1 quando o protótipo estiver fechado.
