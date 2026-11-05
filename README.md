# Planilha de Corrida

App web pessoal, instalável no iPhone, que monta uma planilha de corrida e a ajusta pelo que foi realmente treinado. Os dados do Garmin chegam pelo [intervals.icu](https://intervals.icu), que também leva os treinos ao relógio.

Não tem servidor próprio nem banco de dados: tudo fica no aparelho. A chave de API só é enviada ao intervals.icu e não entra na cópia de segurança.

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

## Instalar no iPhone

O app precisa estar publicado em um endereço HTTPS. No Safari, abra o endereço e toque em Compartilhar, Adicionar à Tela de Início.

## Como funciona

| Arquivo | Função |
|---|---|
| `src/motor.js` | Ritmos (VDOT de Daniels e Gilbert), geração da planilha e revisão. Só funções puras. |
| `src/icu.js` | Leitura de corridas e envio de treinos ao intervals.icu. |
| `src/armazenamento.js` | Dados no aparelho e cópia de segurança. |
| `src/envio.js` | Envio automático da semana, a partir de 3 dias antes do primeiro treino dela. Só roda com o app aberto. |
| `src/estatisticas.js` | Números da aba Evolução e planilha CSV das corridas. |
| `src/graficos.js` | Gráficos em SVG, sem bibliotecas. |
| `src/gestos.js` | Deslizar para trocar de aba e voltar de um treino. |
| `src/app.js` | Telas. |
| `sw.js` | Permite abrir sem internet. Ao mudar arquivos do app, troque a `VERSAO`. |

Regras principais:

- **Ritmos** saem do seu nível atual, não do tempo que você deseja.
- **Dias livres são um limite, não uma obrigação.** Os treinos por semana dependem do volume (3 abaixo de 20 km, 4 abaixo de 35 km, 5 abaixo de 55 km, no máximo 6) e são espalhados para dar o maior descanso possível. No modo cuidadoso, o limite é 4.
- **Volume** sobe até 10% por semana, ou 5% no modo cuidadoso (lesão recente, 45 anos ou mais, IMC 30 ou mais), com semanas de recuperação e polimento.
- **Detalhes do treino** mostram tempo e pace estimados pelo meio das faixas de ritmo, e zonas Z1 a Z5 de ritmo calculadas pelo app. Depois da corrida, trazem os dados reais e as zonas de frequência cardíaca do intervals.icu.
- **Revisão** compara os últimos 14 dias com o previsto e só altera da próxima segunda em diante. Dor sempre reduz a carga.

Esses limites são prudência, não garantia contra lesões. A planilha não substitui avaliação médica ou de um treinador.
