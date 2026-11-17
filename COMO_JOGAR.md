# Portugal Logística — Fase 4

Versão com servidor, armazéns, economia dinâmica, ranking, conquistas, eventos mundiais e API pública. O protótipo da Fase 0 continua no GitHub Pages.

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
3. **Mercado** → aceitar contrato → Reservar e partir. Use **60×/300×** para acelerar testes.
4. **Finanças**: receitas, custos, margem, reputação, gasóleo e crédito.

## Armazéns (Fase 2)

Compre stock a €0,50/kg e venda a €0,68/kg. Rotas recorrentes geram ofertas a cada 7 dias; a expedição automática despacha sem cliques.

## Economia (Fase 3)

Gasóleo oscilante, desgaste e avarias abaixo de 35%, reparação, reputação com bónus/malus, imposto de 6% e empréstimos (3% de abertura + 0,5%/dia).

## Mundo (Fase 4)

O separador **Mundo** reúne:

- **Evento mundial** — rotativo a cada 2 dias simulados: pico do petróleo (+€0,35/L), feira de negócios (+12% nas ofertas), greve de camionistas (+25% na duração) ou excedente de gasóleo (−€0,20/L).
- **Classificação** — top 10 por caixa, com a sua posição.
- **Conquistas** — 8 objetivos com recompensas em dinheiro (primeira entrega, 5/15 entregas, 2 armazéns, 2 veículos, reputação 80, €50 000 em caixa, 1 000 kg vendidos).
- **API pública** — gere chaves e consulte dados por HTTP.

### API pública

```http
GET /api/public/v1/stats
GET /api/public/v1/leaderboard
X-API-Key: plv1_…
```

- As chaves são criadas em **Mundo → Nova chave**. O valor original só aparece uma vez; guardamos apenas o hash SHA-256.
- Não é preciso sessão: basta a chave no cabeçalho `X-API-Key`.
- Limite: **60 pedidos/minuto por chave** (HTTP 429 acima disso).
- Revogar uma chave invalida-a imediatamente.

Exemplo:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/public/v1/stats -Headers @{ 'X-API-Key' = 'plv1_...' }
```

## Separadores

Mercado · Armazéns · Frota · Equipa · Finanças · Mundo · Histórico.

> O GitHub Pages não executa Node; continua com a Fase 0. Fase 1+ precisa de host com Node.
