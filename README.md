# Run Glória

App web gratuito, instalável no iPhone, que monta uma planilha de corrida e a ajusta pelo que foi realmente treinado. Os dados do Garmin chegam pelo [intervals.icu](https://intervals.icu), que também leva os treinos ao relógio.

Não tem servidor próprio, banco de dados nem login: tudo fica no aparelho de cada pessoa, e quem tiver o link pode usar. A chave de API só é enviada ao intervals.icu e não entra na cópia de segurança. O fundo dos mapas vem do OpenStreetMap, que recebe a região exibida, não o percurso.

## Rodar no computador

```bash
npm run dev
```

Abre em http://localhost:4180.

```bash
npm test
```

## Conectar o Garmin

1. Crie a conta no intervals.icu e conecte o Garmin **diretamente**, em Settings. Corridas que entram só pelo Strava não ficam disponíveis pela API.
2. Na mesma conexão, ligue **Upload planned workouts**.
3. Em Settings, Developer Settings, gere a chave de API e cole no app, em Ajustes.
4. Em Settings, na parte de corrida (Run), preencha Threshold Pace com o ritmo de Limiar mostrado em Ajustes. Usuários do fórum do intervals.icu relatam que, sem isso, o alvo de pace não chega ao Garmin.

## Instalar no iPhone

O app precisa estar publicado em um endereço HTTPS. No Safari, abra o endereço e toque em Compartilhar, Adicionar à Tela de Início.

## Como funciona

| Arquivo | Função |
|---|---|
| `src/motor.js` | Ritmos (VDOT de Daniels e Gilbert), geração da planilha e revisão. Só funções puras. |
| `src/analise.js` | Análise da corrida feita: tempo em cada ritmo, porcentagem na meta e estimativa anaeróbica. |
| `src/avulsas.js` | Caminhadas e outros exercícios, do relógio ou lançados à mão. |
| `src/aniversario.js` | Idade calculada pela data de nascimento e dia do aniversário. |
| `src/cumprimento.js` | Situação de cada treino: cumprido, parcial, não feito ou sem registro, e corrida ligada a treino de outro dia. |
| `src/feedback.js` | Esforço e sensação depois do treino, inclusive os que vêm do relógio. |
| `src/planejado.js` | Previsto e feito: aderência e comparação trecho a trecho. |
| `src/calendario.js` | Calendário do mês e totais de tudo o que foi feito, dentro ou fora da planilha. |
| `src/medalhas.js` | Conquistas: recordes, marcos, datas especiais, constância semanal e provas, além do resumo que guarda as corridas com mais de 12 meses. |
| `src/peso.js` | Histórico de peso e IMC, com as faixas da OMS. |
| `src/percurso.js` | Enquadramento do mapa, voltas, parciais por km e curvas de pace, frequência cardíaca e altitude. O percurso fica só na memória da tela. |
| `src/provas.js` | Calendário de provas: principal, secundárias, volume comparado à referência e avisos de prazo. |
| `src/regras.js` | Origem de cada regra (estudo, treinador ou decisão do app) mostrada em Ajustes. |
| `src/icu.js` | Leitura de corridas e envio de treinos ao intervals.icu. |
| `src/armazenamento.js` | Dados no aparelho e cópia de segurança. |
| `src/envio.js` | Envio automático da semana, a partir de 3 dias antes do primeiro treino dela. Só roda com o app aberto. |
| `src/estatisticas.js` | Números da aba Evolução e planilha CSV das corridas. |
| `src/graficos.js` | Gráficos em SVG, sem bibliotecas. |
| `src/visual.js` | Ícones, anel de progresso, perfil de intensidade do treino e cálculos das telas. |
| `src/gestos.js` | Deslizar para trocar de aba e voltar de um treino; puxar no topo para atualizar. |
| `src/app.js` | Telas. |
| `sw.js` | Permite abrir sem internet. Ao mudar arquivos do app, troque a `VERSAO`. |

Regras principais:

- **Ritmos** saem do seu nível atual, não do tempo que você deseja.
- **Dias livres são um limite, não uma obrigação.** Os treinos por semana dependem do volume (3 abaixo de 20 km, 4 abaixo de 35 km, 5 abaixo de 55 km, no máximo 6) e são espalhados para dar o maior descanso possível. No modo cuidadoso, o limite é 4.
- **Volume** segue, como referência, planos publicados de Hal Higdon por prova e objetivo (`REFERENCIA_POR_META`), porque nenhum estudo define volume obrigatório. Sobe até 10% por semana, ou 5% no modo cuidadoso (lesão recente, 45 anos ou mais, IMC 30 ou mais), com semanas de recuperação e polimento: esses limites são decisão do app, não limiar comprovado.
- **Limite por corrida**: nenhuma corrida planejada passa de 10% acima da maior dos últimos 30 dias, com acréscimo mínimo de 1 km (associação de Frandsen 2025, sem prova de causa). A prova fica de fora.
- **Minhas provas**, na Planilha, guarda as provas inscritas. A principal define o ciclo e as anteriores entram como secundárias: importante reduz os 2 dias antes, de preparação só alivia longão na véspera, e as duas substituem o treino forte da semana. Toda mudança mostra o antes e depois antes de aplicar, e os avisos de prazo comparam com a referência, sem bloquear.
- **Prova concluída**: a corrida do dia com distância até 20% diferente da prova (corte do app) vira o resultado. O app compara com a previsão congelada antes da prova e mostra as duas metades, as zonas e o VDOT. O resultado fica guardado na prova e aparece na Evolução, com o melhor tempo por distância. Ele conta para o nível, mas os ritmos só mudam por confirmação em Atualizar análise ou na Revisão.
- **Treino forte** só entra para quem busca tempo. A origem de cada regra aparece em Ajustes e fica em `src/regras.js`.
- **Detalhes do treino** mostram tempo e pace estimados pelo meio das faixas de ritmo, e zonas Z1 a Z5 de ritmo calculadas pelo app. Depois da corrida, trazem os dados reais e as zonas de frequência cardíaca do intervals.icu.
- **Análise do treino** compara o tempo real em cada zona de ritmo com o previsto e mostra quanto ficou na meta, acima e abaixo (80% ou mais é "dentro da meta", 60% ou mais é "parcialmente": corte do app, não de estudo). A parte anaeróbica é aproximada pelo pace, porque o Training Effect do Garmin não vem pela API.
- **Treino cumprido**: a corrida do dia, ou uma corrida da mesma semana ligada por você, conta como cumprido a partir de 80% da distância e como parcial abaixo disso (corte do app). Na virada do dia, o treino sem corrida fica sem registro. O botão Não fiz este treino guarda o motivo: doença ou dor não contam como falta na Revisão nem quebram a sequência de semanas.
- **Corrida manual**, para treino sem relógio, conta no volume e nos marcos, mas não no nível nem nos recordes.
- **Conquistas**, na Evolução, não mudam treino nem nível. Só corrida conta. A constância é medida por semana, nunca por dias seguidos, e uma semana com dor registrada não quebra a sequência: premiar dias seguidos contrariaria o descanso da planilha.
- **Calendário**, na Planilha e na Evolução, mostra por mês o previsto, as corridas da planilha, as corridas fora dela e as outras atividades, inclusive antes de a planilha começar.
- **Corrida fora da planilha** conta no volume e no nível, porque é carga real de corrida.
- **Outras atividades** (caminhada, bicicleta, musculação etc.) chegam do relógio ou são registradas à mão. Aparecem em Hoje, no calendário e nos totais da Evolução, mas não entram no volume de corrida, no nível nem na revisão.
- **Mudar o dia** move um treino para outro dia livre da mesma semana, com aviso se ficar colado em outro treino. Fora da semana, a carga semanal mudaria.
- **Dias de treino**, em Ajustes, refaz a grade da próxima segunda em diante com os novos dias livres, mostrando o antes e depois. Mantém nível e carga da planilha.
- **Atualizar análise** recalcula nível e volume pelas corridas reais e mostra o antes e depois. Só muda a planilha com confirmação, e nunca os treinos passados ou a semana em andamento.
- **Revisão** compara os últimos 14 dias com o previsto e só altera da próxima segunda em diante. Dor sempre reduz a carga.

Esses limites são prudência, não garantia contra lesões. A planilha não substitui avaliação médica ou de um treinador.
