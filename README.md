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
| `src/desempenho.js` | Pace ajustado à subida, desacoplamento, clima, melhores marcas, condicionamento e fadiga. Cada valor passa por uma faixa plausível, porque a API não documenta todas as unidades. |
| `src/testes.js` | Testes de campo (Cooper e 3 km): marcar, ler o resultado pelas curvas do relógio, avaliar e repor o teste quando a planilha é refeita. |
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
- **Início com corrida e caminhada**: quem ainda não corre, ou corre até 10 minutos, alterna corrida e caminhada 3 vezes por semana até 25 minutos seguidos, sem meta de pace, e o treino conta pelo tempo. Depois entra a planilha normal. As etapas são decisão do app.
- **Testes**, na Planilha: o teste de 12 minutos (Cooper) ou de 3 km substitui um treino leve e vai ao relógio. O resultado vem das curvas ou é digitado, e os ritmos só mudam depois da confirmação, da próxima segunda em diante.
- **Treino cumprido**: a corrida do dia, ou uma corrida da mesma semana ligada por você, conta como cumprido a partir de 80% da distância e como parcial abaixo disso (corte do app). Na virada do dia, o treino sem corrida fica sem registro. O botão Não fiz este treino guarda o motivo: doença ou dor não contam como falta na Revisão nem quebram a sequência de semanas.
- **Corrida manual**, para treino sem relógio, conta no volume e nos marcos, mas não no nível nem nos recordes.
- **Análises do intervals.icu** (pace ajustado, desacoplamento, clima, melhores marcas, condicionamento e fadiga) só informam: não mudam treino, nível nem revisão. Só aparecem quando o dado vem preenchido.
- **Conquistas**, na Evolução, não mudam treino nem nível. Só corrida conta. A constância é medida por semana, nunca por dias seguidos, e uma semana com dor registrada não quebra a sequência: premiar dias seguidos contrariaria o descanso da planilha.
- **Calendário**, na Planilha, mostra por mês o previsto, as corridas da planilha, as corridas fora dela e as outras atividades, inclusive antes de a planilha começar.
- **Corrida fora da planilha** conta no volume e no nível, porque é carga real de corrida.
- **Outras atividades** (caminhada, bicicleta, musculação etc.) chegam do relógio ou são registradas à mão. Aparecem em Hoje, no calendário e nos totais da Evolução, mas não entram no volume de corrida, no nível nem na revisão.
- **Mudar o dia** move um treino para outro dia livre da mesma semana, com aviso se ficar colado em outro treino. Fora da semana, a carga semanal mudaria.
- **Dias de treino**, em Ajustes, refaz a grade da próxima segunda em diante com os novos dias livres, mostrando o antes e depois. Mantém nível e carga da planilha.
- **Atualizar análise** recalcula nível e volume pelas corridas reais e mostra o antes e depois. Só muda a planilha com confirmação, e nunca os treinos passados ou a semana em andamento.
- **Revisão** compara os últimos 14 dias com o previsto e só altera da próxima segunda em diante. Dor sempre reduz a carga.

Esses limites são prudência, não garantia contra lesões. A planilha não substitui avaliação médica ou de um treinador.

## Mesa de Jogos

App separado, na pasta `jogos/`, com jogos contra o robô: Ludo (você e até 3 robôs), Xadrez, Damas (regras brasileiras), Reversi, Quatro em Linha e Jogo da Velha, e desafios solo: Paciência e Sudoku (com dicas do robô), Docinhos (junte 3 doces iguais, com fases e estrelas) e Corrida dos Cachinhos (corrida sem fim em 3 faixas). Os dois últimos têm como personagem uma menina de cabelo castanho ondulado e roupa esportiva, com tom de pele e cor da roupa à escolha. Na corrida, as moedas ficam guardadas e compram skates (clássico, voador e supersônico), cargas de skate e melhorias dos poderes (ímã, tênis de mola, mochila a jato e supercarga) e mochilas a jato de largada; na pista, os itens valem na hora em que são pegos (mochila a jato, ímã, tênis de mola, escudo, pontos em dobro, baú de moedas, foguete, skate grátis, capa de super-heroína — ela voa na pose de super-heroína atraindo as moedas — e nave alienígena — um feixe de luz a teletransporta para dentro de um disco voador que percorre um trecho pelo alto); há missões com prêmio, presente do dia e sons próprios (ronco do jato e ambiente de cada cenário). O robô tem três níveis (fácil, médio e difícil).

- **Salvamento automático:** cada partida em andamento fica guardada no aparelho e volta do ponto em que parou, inclusive depois de fechar o navegador.
- **Cópia de segurança:** no fim da tela inicial, "Salvar cópia" gera um arquivo com placar, histórico e partidas em andamento, e "Restaurar cópia" junta o arquivo ao que já está no aparelho, sem repetir partidas. No iPhone, apagar o ícone da tela de início apaga os dados, por isso o app avisa quando a última cópia tem mais de 14 dias.
- **Puxar para atualizar:** no app aberto pelo ícone da tela de início, puxar a tela inicial para baixo busca a versão nova (o Safari já faz isso sozinho; nos tabuleiros o gesto fica desligado para não atrapalhar as jogadas). Usa o mesmo `src/gestos.js` do app de corrida.
- **Sons:** gerados na hora pelo navegador (Web Audio), sem arquivos; dá para desligar no botão de alto-falante.
- **Painel:** na tela inicial, aproveitamento contra o robô, sequências de vitórias, partidas dos últimos 14 dias, aproveitamento por jogo, recordes dos desafios solo e últimas partidas.

Com `npm run dev`, abre em http://localhost:4180/jogos/index.html. O ícone sai de `jogos/icones/icone.svg`; depois de mudar o desenho, gere os PNGs com `node scripts/gerar-icones-jogos.mjs` (usa o Playwright).

| Arquivo | Função |
|---|---|
| `jogos/src/ludo.js` | Percurso, capturas, casas seguras e escolha da jogada do robô por pontuação. |
| `jogos/src/xadrez.js` | Regras completas (roque, en passant, promoção, empates) e robô por minimax com poda alfa-beta. |
| `jogos/src/robo-xadrez.js` | Roda o robô do xadrez em segundo plano, para a tela não travar. |
| `jogos/src/damas.js` | Captura obrigatória pela maioria, dama que voa e robô por minimax. |
| `jogos/src/reversi.js` | Jogadas válidas, viradas e robô por minimax com pesos por casa. |
| `jogos/src/lig4.js` | Quatro em linha com robô por minimax. |
| `jogos/src/velha.js` | Jogo da velha; no difícil, o robô joga perfeito. |
| `jogos/src/docinhos.js` | Docinhos: trincas, doces especiais (listrado, bomba, arco-íris), cascatas, fases e jogada para a dica. |
| `jogos/src/corrida.js` | Corrida dos Cachinhos: física, obstáculos sempre com passagem, colisões, moedas, poderes, skate e supercarga. |
| `jogos/src/loja.js` | Carteira, loja (skates, cargas, poderes e estilos de roupa), missões, presente do dia e junção de carteiras na cópia de segurança. |
| `jogos/src/mundo3d.js` | Motor da corrida em 3D: liga a menina, o cenário e os objetos da pista, com câmera atrás dela. Se o aparelho não tiver 3D, a corrida usa o desenho em 2D. |
| `jogos/src/3d/cenarios.js` | Os 4 cenários (Cidade, Praia, Floresta e Vila da Neve), cada um com chão, céu, enfeites e a sua versão dos obstáculos. No modo Passeio, o cenário troca a cada 500 m. |
| `jogos/src/3d/menina.js` | A menina em 3D: peças torneadas com material de pele e tecido, roupa com textura, tênis detalhado e cabelo em mechas que balançam. |
| `jogos/src/3d/perseguidores.js` e `jogos/src/perseguidores.js` | Quem corre atrás da menina: policial (cidade), caranguejo (praia), leão ou panda (floresta, à escolha) e urso-polar (neve). Aparece na largada, volta quando ela tropeça e a alcança na batida, com som próprio. |
| `jogos/src/3d/base.js` | Medidas da pista, texturas desenhadas na hora e materiais comuns. |
| `jogos/vendor/three.module.min.js` | Biblioteca three.js 0.170 (licença MIT, em `jogos/vendor/three.LICENSE`), guardada no app para funcionar sem internet. |
| `jogos/src/personagem.js` | A menina: retrato de frente (SVG) e desenho de costas correndo (canvas), com luz e sombra. |
| `jogos/src/paciencia.js` | Paciência (Klondike), movimento automático e dica do robô. |
| `jogos/src/sudoku.js` | Gera grades com solução única em três níveis. |
| `jogos/src/dados.js` | Histórico, placar, recordes, partidas salvas e cópia de segurança, tudo no aparelho. |
| `jogos/src/copia.js` | Cartão "Seus dados": salvar e restaurar a cópia. |
| `jogos/src/som.js` | Efeitos sonoros sintetizados. |
| `jogos/src/painel.js` | Números e gráficos da tela inicial. |
| `jogos/src/app.js` e `jogos/src/telas/` | Telas, tabuleiros e animações. |
