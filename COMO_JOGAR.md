# Portugal Logística — Fase 1

Versão com servidor, contas e base de dados. O protótipo da Fase 0 continua em `index.html` (e no GitHub Pages).

## Arrancar

Requer **Node.js 22.5+** (testado em v26.13.1). Sem dependências para instalar.

```powershell
cd "C:\Users\josue\OneDrive\Documentos\Projeto Padrão"
npm start
```

Abrir: **http://localhost:3000**

Para acessar pelo celular na mesma Wi-Fi: `http://192.168.1.252:3000`.

## Primeira vez

1. Clique em **Criar empresa**.
2. Escolha utilizador, senha, nome da empresa e cidade base.
3. A sessão dura 30 dias e fica guardada no navegador.

## Ciclo de jogo

1. **Equipa** → contratar motorista (€300 + €1 500/mês + 22%).
2. **Frota** → comprar carrinha (€14 000) ou camião leve (€24 000).
3. **Mercado** → escolher contrato → **Aceitar** → selecionar veículo e motorista → **Reservar e partir**.
4. Acompanhe o veículo no mapa. Use **60×** ou **300×** para testar sem esperar.
5. Na chegada, o servidor credita a receita e lança os custos **uma única vez**; veículo e motorista ficam no destino.
6. **Finanças** mostra receitas, custos, margem e movimentos; **Histórico** mostra os eventos do servidor.

## O que mudou em relação ao protótipo

| Antes (Fase 0) | Agora (Fase 1) |
|---|---|
| `localStorage` no navegador | SQLite em `data/game.db`, no servidor |
| Cliente decidia o tempo | Servidor é a única fonte da verdade |
| Reserva podia duplicar | Transação atómica + `UNIQUE(offer_id)` |
| Pagamento podia repetir | Eventos com `processed_at` + movimentos com chave única |
| Sem conta | Registo/login com senha cifrada (scrypt) e sessão de 30 dias |
| Estado local por dispositivo | Mesmo progresso em PC, celular e qualquer navegador |

## Estrutura

```
server/game.js    constantes e regras do mundo
server/db.js      esquema SQLite, transações, relógio, NPCs
server/server.js  API HTTP, autenticação, ficheiros estáticos
public/           cliente (index.html, styles.css, app.js)
data/game.db      base de dados (não versionar)
```

## Importante

O **GitHub Pages não roda Node**, por isso a Fase 1 não pode ser publicada lá. O Pages continua a hospedar o protótipo da Fase 0. Para publicar a Fase 1 é preciso um host com Node (Render, Fly.io, VPS ou Codespaces).
