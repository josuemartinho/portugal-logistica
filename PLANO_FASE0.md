# Fase 0 — Pacote de arranque (completo)

Complemento executável do `futuro_jogo_logistica.pdf` (v2.0, 17/11/2026).
Valores são **proposta de equilíbrio inicial**, não referências pesquisadas. Ajustar após testar o ciclo.

## 1. Regras de tempo e offline

| Regra | Valor |
|---|---|
| Relógio do mundo | `Date.now()` simulado, guardado em `now` |
| Velocidade | 1× por defeito; 60× / 300× apenas como **modo demo** (visível no ecrã) |
| Ausência | Ao abrir, o tempo avança até 30 dias; eventos vencidos são processados uma vez |
| Conclusão | Determinada pelo instante guardado no servidor/estado, não pelo navegador aberto |
| Pagamento | Idempotente por `trip.id` — nunca duas vezes |

## 2. Parâmetros económicos iniciais

| Parâmetro | Valor | Unidade |
|---|---|---|
| Capital inicial | 25 000 | € |
| Aluguer da base | 350 | €/mês |
| Ordenado do motorista | 1 500 | €/mês |
| Encargos | 22 | % do ordenado |
| Gasóleo | 1,75 | €/L |
| Portagens | 0,10 | €/km em autoestrada (60% do percurso) |
| Manutenção + pneus | 0,10 | €/km |
| Processamento / cais | 30 + 20 | min (carga + descarga) |
| Velocidade média | 65 | km/h |
| Fator estrada | 1,25 | × distância great-circle |
| IVA | simplificado, não cobrado no protótipo | — |

## 3. Catálogo de arranque

| Veículo | Preço | Carga | Volume | Consumo |
|---|---:|---:|---:|---:|
| Carrinha | 14 000 € | 800 kg | 4 m³ | 8,0 L/100km |
| Camião leve | 24 000 € | 3 000 kg | 14 m³ | 12,5 L/100km |

Cargas disponíveis na primeira versão: **geral** (sem requisitos especiais).

## 4. Localidades operacionais

Lisboa · Porto · Braga · Aveiro · Coimbra · Leiria · Santarém · Setúbal · Évora · Beja · Faro · Portimão · Viseu · Guarda · Castelo Branco · Vila Real · Bragança.

## 5. Clientes (referência real, contratos fictícios)

Continente · Pingo Doce · Worten · Delta Cafés · Vista Alegre · The Navigator Company.

## 6. Backlog técnico (Fase 1, quando sair do protótipo)

- [ ] Mover `advance()` e validações para API HTTP; cliente passa a enviar apenas acções.
- [ ] Substituir `localStorage` por base relacional (empresa, veículo, funcionário, oferta, operação, movimento, evento).
- [ ] Reserva atómica de veículo/motorista/oferta (transacção + chave única).
- [ ] Eventos agendados com `processed_at` para idempotência.
- [ ] Autenticação; uma empresa por conta.
- [ ] Testes: relógio controlado, acções simultâneas, saldo insuficiente, repetição de pedido, recuperação offline.

## 7. Critérios de conclusão do protótipo

- [ ] Criar empresa e base, contratar motorista, comprar carrinha.
- [ ] Ver oferta com percurso, duração, receita e custo estimado.
- [ ] Reservar recursos; impedir uso simultâneo do mesmo veículo/motorista.
- [ ] Viagem em tempo real com posição no mapa; conclusão credita uma única vez.
- [ ] Fechar e reabrir: progresso, localização e contas corretos.
- [ ] NPCs disputam ofertas dentro de capacidade limitada.
