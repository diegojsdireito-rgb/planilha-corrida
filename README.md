# Run Glória

App web gratuito, instalável no iPhone, que monta uma planilha de corrida e a ajusta pelo que foi realmente treinado. Os dados do Garmin chegam pelo [intervals.icu](https://intervals.icu), que também leva os treinos ao relógio.

Não tem servidor próprio, banco de dados nem login: tudo fica no aparelho de cada pessoa, e quem tiver o link pode usar. A chave de API só é enviada ao intervals.icu e não entra na cópia de segurança.

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
- **Volume** sobe até 10% por semana, ou 5% no modo cuidadoso (lesão recente, 45 anos ou mais, IMC 30 ou mais), com semanas de recuperação e polimento.
- **Detalhes do treino** mostram tempo e pace estimados pelo meio das faixas de ritmo, e zonas Z1 a Z5 de ritmo calculadas pelo app. Depois da corrida, trazem os dados reais e as zonas de frequência cardíaca do intervals.icu.
- **Análise do treino** compara o tempo real em cada zona de ritmo com o previsto e mostra quanto ficou na meta, acima e abaixo (80% ou mais é "dentro da meta", 60% ou mais é "parcialmente": corte do app, não de estudo). A parte anaeróbica é aproximada pelo pace, porque o Training Effect do Garmin não vem pela API.
- **Outras atividades** (caminhada, bicicleta, musculação etc.) chegam do relógio ou são registradas à mão. Aparecem em Hoje e Evolução, mas não entram no volume de corrida, no nível nem na revisão.
- **Mudar o dia** move um treino para outro dia livre da mesma semana, com aviso se ficar colado em outro treino. Fora da semana, a carga semanal mudaria.
- **Dias de treino**, em Ajustes, refaz a grade da próxima segunda em diante com os novos dias livres, mostrando o antes e depois. Mantém nível e carga da planilha.
- **Atualizar análise** recalcula nível e volume pelas corridas reais e mostra o antes e depois. Só muda a planilha com confirmação, e nunca os treinos passados ou a semana em andamento.
- **Revisão** compara os últimos 14 dias com o previsto e só altera da próxima segunda em diante. Dor sempre reduz a carga.

Esses limites são prudência, não garantia contra lesões. A planilha não substitui avaliação médica ou de um treinador.
