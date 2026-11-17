# Portugal Logística — Fase 6

Versão com servidor, armazéns, economia dinâmica, ranking, conquistas, API pública e **mapa real de Portugal com rotas rodoviárias**. O protótipo da Fase 0 continua no GitHub Pages.

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

## Mapa real e expansão (Fase 6)

O painel central é um mapa Leaflet com tiles reais (OpenStreetMap/CARTO). Não é um desenho esquemático: as 47 cidades estão nas suas coordenadas reais e as linhas seguem a geometria devolvida pelo OSRM.

- **Estilos**: `Escuro` (por defeito), `Claro` e `Satélite`, no canto inferior esquerdo.
- **Camadas**: ofertas, viagens, frota/armazéns, histórico, empresas e alcance — cada uma com interruptor próprio.
- **Ver rede** ajusta o enquadramento a todas as operações visíveis.
- **Base operacional** aparece no HUD com o nível atual; as viagens em curso mostram a posição interpolada sobre a rota real e a percentagem concluída.

A empresa começa pequena:

| Nível | Alcance | Como desbloquear |
|---|---|---|
| **Local** | 130 km | ponto de partida — só contratos perto da base |
| **Regional** | 320 km | 5 entregas **ou** reputação 65 **ou** 2 armazéns |
| **Nacional** | sem limite | 15 entregas **ou** reputação 80 **ou** 3 armazéns **ou** €50 000 em caixa |

O cartão no topo do **Mercado** diz o que falta para o próximo nível. Só aparecem contratos dentro do alcance atual; o servidor garante pelo menos 3 ofertas locais por base. Quando uma rota real já está em cache, o custo e a duração usam os km por estrada.

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

Mercado · Armazéns · Frota · Equipa · Finanças · Mundo · Histórico. O mapa ocupa o painel principal em todos eles.

## PWA e instalação (Fases 5–6)

- O jogo é instalável como aplicação: no Chrome/Edge, use **Instalar aplicação** no menu do endereço; no Android, **Adicionar ao ecrã inicial**.
- Funciona em `localhost` ou em HTTPS. O interface abre offline (service worker `ptlog-v7-fase6`), mas **os dados nunca são cacheados**: é preciso ligação ao servidor para jogar.
- Os ficheiros do Leaflet fazem parte do app shell; os tiles e rotas exigem rede.

## Testes e deploy

```powershell
npm test        # 14 testes: unidades + integração da API + mapa/rotas
npm run health  # confirma o servidor local
```

Configurações prontas: `Dockerfile`, `docker-compose.yml`, `render.yaml` e `fly.toml`. Ver `DEPLOY.md`.

> O GitHub Pages não executa Node; continua com a Fase 0. Fase 1+ precisa de host com Node.
