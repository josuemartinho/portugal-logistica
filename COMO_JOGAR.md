# Portugal Logística — Fase 2

Versão com servidor, contas, base de dados, armazéns e contratos recorrentes. O protótipo da Fase 0 continua em `index.html` (GitHub Pages).

## Arrancar

Requer **Node.js 22.5+** (testado em v26.13.1). Sem dependências para instalar.

```powershell
cd "C:\Users\josue\OneDrive\Documentos\Projeto Padrão"
npm start
```

Abrir: **http://localhost:3000** · No celular, mesma Wi-Fi: `http://192.168.1.252:3000`.

## Primeira vez

1. **Criar empresa** com utilizador, senha, nome e cidade base.
2. **Equipa** → contratar motorista (€300 + €1 500/mês + 22%).
3. **Frota** → comprar carrinha (€14 000) ou camião leve (€24 000).
4. **Mercado** → aceitar contrato → Reservar e partir.
5. Use **60×** ou **300×** no topo para acelerar os testes.

## Ciclo da Fase 2 — mercadorias

1. **Armazéns**: a sede já tem um armazém. Abra filiais noutras cidades (€800 de caução + €120/mês, máx. 3).
2. Compre stock no armazém de origem a **€0,50/kg**.
3. **Contratos recorrentes**: assine uma rota do catálogo; a cada 7 dias o servidor gera uma oferta exigindo aquele stock.
4. Aceite a oferta (ou ative a **expedição automática**). No destino, a mercadoria entra no armazém local ou é vendida automaticamente a **€0,68/kg** se não houver armazém.
5. Venda stock manualmente em qualquer armazém a €0,68/kg.

## Separadores

Mercado · Armazéns · Frota · Equipa · Finanças · Histórico.

## Garantias do servidor

- Relógio do servidor com avanço limitado a 30 dias de ausência.
- Reserva atómica de veículo, motorista, oferta e stock.
- Entregas e movimentos idempotentes (`processed_at` + chaves únicas).
- A expedição automática corre no servidor, mesmo sem navegador aberto.

## Estrutura

```
server/game.js    constantes, cidades, ofertas, rotas recorrentes
server/db.js      SQLite, transações, relógio, NPCs, stock, expedição automática
server/server.js  API HTTP, autenticação, estáticos
public/           cliente (6 separadores)
data/game.db      base de dados (não versionada)
```

> O GitHub Pages não executa Node; continua com a Fase 0. Para publicar a Fase 1+ é preciso um host com Node.
