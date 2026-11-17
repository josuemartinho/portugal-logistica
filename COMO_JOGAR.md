# Portugal Logística — Fase 3

Versão com servidor, contas, armazéns e economia dinâmica. O protótipo da Fase 0 continua no GitHub Pages.

## Arrancar

Requer **Node.js 22.5+**. Sem dependências para instalar.

```powershell
cd "C:\Users\josue\OneDrive\Documentos\Projeto Padrão"
npm start
```

Abrir **http://localhost:3000** · Celular na mesma Wi-Fi: `http://192.168.1.252:3000`.

## Ciclo básico

1. **Criar empresa** (utilizador, senha, nome, cidade base).
2. **Equipa** → contratar motorista. **Frota** → comprar veículo.
3. **Mercado** → aceitar contrato → Reservar e partir. Acompanhe no mapa; use **60×/300×** para testar.
4. **Finanças** mostra receitas, custos, margem, reputação, gasóleo e crédito.

## Armazéns (Fase 2)

- Compre stock a €0,50/kg; venda a €0,68/kg.
- Assine rotas recorrentes: a cada 7 dias nasce uma oferta que exige stock na origem.
- Ative a **expedição automática** para o servidor despachar sem cliques.

## Economia dinâmica (Fase 3)

| Mecânica | Efeito |
|---|---|
| Gasóleo variável | Preço oscila entre ~€1,45 e €2,05/L com o tempo simulado; altera o custo de cada viagem |
| Desgaste | Cada km reduz o estado do veículo; abaixo de 35% há avaria na chegada |
| Reparação | **Frota** → Reparar; custo = (100 − estado) × €12 |
| Reputação | Começa em 50; +2 por entrega, −4 por avaria; bónus/malus de 0,2% por ponto acima/abaixo de 50 |
| Imposto | 6% retidos sobre a receita de cada entrega |
| Crédito | Empréstimos de €500 a €20 000, 3% de abertura + 0,5%/dia; até 3 ativos |
| Juros | Cobrados diariamente sobre o saldo em dívida |

## Separadores

Mercado · Armazéns · Frota · Equipa · Finanças · Histórico.

> O GitHub Pages não executa Node; continua com a Fase 0. Fase 1+ precisa de host com Node.
