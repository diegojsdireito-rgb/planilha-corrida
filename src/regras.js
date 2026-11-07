// De onde vem cada regra da planilha. A origem aparece na tela para não apresentar convenção como ciência.
export const ORIGENS = { estudo: 'Estudo', treinador: 'Treinador', app: 'Decisão do app' };

export const REGRAS = [
  {
    nome: 'Ritmos e nível',
    origem: 'estudo',
    texto: 'Fórmulas publicadas de Daniels e Gilbert (VDOT), que estimam o ritmo a partir de um tempo real.',
    fontes: [],
  },
  {
    nome: 'Limite por corrida',
    origem: 'estudo',
    texto: 'Nenhuma corrida passa de 10% acima da maior dos últimos 30 dias, com acréscimo mínimo de 1 km (decisão do app). Em 5.205 corredores, passar disso se associou a mais lesão. Mostra associação, não prova a causa, e a prova em si fica de fora.',
    fontes: [['Frandsen 2025', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12421110']],
  },
  {
    nome: 'Volume e longão por prova',
    origem: 'treinador',
    texto: 'Pico semanal e maior corrida seguem planos de Hal Higdon: Novice para completar, Intermediate para buscar tempo. Nenhum estudo define um volume obrigatório.',
    fontes: [['Planos de Higdon', 'https://www.halhigdon.com/training-programs/']],
  },
  {
    nome: 'Início com corrida e caminhada',
    origem: 'app',
    texto: 'Quem ainda não corre, ou corre até 10 minutos, alterna corrida e caminhada 3 vezes por semana até 25 minutos seguidos, sem meta de pace. O formato se inspira em um programa de 9 semanas com 110 adultos, sem grupo de comparação, em que muitos acharam a progressão rápida e a maioria desistiu. Por isso as etapas daqui são mais suaves, mas nenhuma foi testada.',
    fontes: [['Relph 2023', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10487403/']],
  },
  {
    nome: 'Testes de campo',
    origem: 'estudo',
    texto: 'O nível sai das fórmulas de Daniels e Gilbert, e o VO2máx do teste de 12 minutos sai da fórmula de Cooper. Em adultos saudáveis, esse teste tendeu a subestimar valores baixos e superestimar valores altos, então é uma estimativa. Largada forte demais, calor e pouca motivação pioram o resultado. Liberar o teste depois de 9 ou 15 minutos seguidos de corrida e sugerir repetir em 8 semanas são decisões do app.',
    fontes: [['Validade do teste de 12 minutos', 'https://pubmed.ncbi.nlm.nih.gov/20647946/']],
  },
  {
    nome: 'Treino cumprido',
    origem: 'app',
    texto: 'Conta como cumprido a partir de 80% da distância prevista, ou do tempo nos treinos por tempo, e como parcial abaixo disso. Sem corrida, o treino fica sem registro na virada do dia. Não feito por doença ou dor não conta como falta. Sem estudo que defina esses cortes.',
    fontes: [],
  },
  {
    nome: 'Esforço e sensação',
    origem: 'app',
    texto: 'Dois treinos leves com esforço 7 ou mais, ou média de sensação baixa em 3 respostas, seguram o aumento de volume da próxima semana. Só dor reduz a carga. É autoavaliação, e os cortes não vêm de estudo.',
    fontes: [],
  },
  {
    nome: 'Aderência ao treino',
    origem: 'app',
    texto: 'Média entre o quanto a distância e o ritmo ficaram perto do previsto. É uma fórmula do app para resumir o treino, sem validação em estudo.',
    fontes: [],
  },
  {
    nome: 'Treinos fortes',
    origem: 'treinador',
    texto: 'Só para quem busca tempo, porque os planos iniciantes não usam tiros. Não há estudo que defina quando um iniciante deve começar.',
    fontes: [['Higdon', 'https://www.trainingpeaks.com/blog/is-speedwork-necessary-for-your-first-marathon/']],
  },
  {
    nome: 'Várias provas',
    origem: 'treinador',
    texto: 'Principal, importante ou de preparação segue a divisão A, B e C usada por treinadores, sem estudo em corredores recreativos. Descanso no dia seguinte e aviso de prazo são decisão do app. Só correr leve 48 h depois da maratona tem ensaio.',
    fontes: [['Higdon, várias maratonas', 'https://www.halhigdon.com/training-programs/more-training/multiple-marathons/'], ['Martínez-Navarro 2020', 'https://repositori.uji.es/xmlui/handle/10234/192075']],
  },
  {
    nome: 'Polimento antes da prova',
    origem: 'estudo',
    texto: 'Redução de volume antes da prova. A melhor evidência vem de atletas competitivos, então vale como extrapolação.',
    fontes: [['Bosquet 2007', 'https://pubmed.ncbi.nlm.nih.gov/17762369/']],
  },
  {
    nome: 'Aumento semanal de até 10%',
    origem: 'app',
    texto: 'Limite conservador, não limiar comprovado. O ensaio de Buist não achou benefício nessa regra, e a revisão de Fredette diz que ela não se justifica.',
    fontes: [['Buist 2008', 'https://research.rug.nl/en/publications/no-effect-of-a-graded-training-program-on-the-number-of-running-r/'], ['Fredette 2022', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9528699']],
  },
  {
    nome: 'Modo cuidadoso',
    origem: 'app',
    texto: 'Iniciantes e quem teve lesão têm mais risco, mas nenhum estudo mostra que progredir mais devagar reduz lesão nesses grupos. Os 5% por semana são escolha do app.',
    fontes: [['Videbæk 2015', 'https://pubmed.ncbi.nlm.nih.gov/25951917/']],
  },
  {
    nome: 'Semana de recuperação',
    origem: 'app',
    texto: 'A cada 4 semanas, ou 3 no modo cuidadoso. É convenção de treino, sem estudo que defina a frequência.',
    fontes: [],
  },
  {
    nome: 'Longão de até 3 horas',
    origem: 'app',
    texto: 'Regra de prudência, sem estudo que teste esse limite. Quando ele corta o longão de referência, a Planilha avisa.',
    fontes: [],
  },
  {
    nome: 'Dias de treino',
    origem: 'app',
    texto: 'O número de treinos por semana depende do volume, e os dias livres são só o limite.',
    fontes: [],
  },
  {
    nome: 'Porcentagem na meta',
    origem: 'app',
    texto: 'Os cortes de 80% e 60% e a parte anaeróbica são estimativas do app, sem validação.',
    fontes: [],
  },
];
