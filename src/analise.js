// Análise da corrida feita: quanto tempo em cada ritmo e como isso se compara ao previsto.
// A comparação é por tempo em cada zona, não por posição: tiros fora da ordem ou do km exato
// não contam como erro, e o GPS não precisa acertar onde cada trecho começou.

export const ORDEM_DAS_ZONAS = ['lento', 'leve', 'maratona', 'limiar', 'intervalado'];

const TOLERANCIA_SEG_POR_KM = 5;
const VELOCIDADE_MINIMA = 1; // m/s: abaixo disso é parada, não ritmo
const VELOCIDADE_MAXIMA = 12; // m/s: acima disso é salto de GPS
const SEGUNDOS_MAXIMOS_POR_AMOSTRA = 10;
const NOTA_NA_META = 0.8;
const NOTA_PARCIAL = 0.6;
const MINIMO_PARA_TENDENCIA = 0.1;

const centro = (ritmo) => (typeof ritmo === 'number' ? ritmo : (ritmo.de + ritmo.ate) / 2);

// Limites em segundos por km. Quanto menor o número, mais rápido.
export function limitesDasZonas(ritmos) {
  const limiar = centro(ritmos.limiar);
  const intervalado = centro(ritmos.intervalado);
  return {
    lento: ritmos.leve.ate + TOLERANCIA_SEG_POR_KM,
    leve: ritmos.leve.de - TOLERANCIA_SEG_POR_KM,
    maratona: (centro(ritmos.maratona) + limiar) / 2,
    limiar: (limiar + intervalado) / 2,
    anaerobico: intervalado,
  };
}

function zonaDoRitmo(ritmo, limites) {
  if (ritmo > limites.lento) return 'lento';
  if (ritmo >= limites.leve) return 'leve';
  if (ritmo >= limites.maratona) return 'maratona';
  if (ritmo >= limites.limiar) return 'limiar';
  return 'intervalado';
}

export function temposPorZona({ tempo, velocidade, ritmos }) {
  const limites = limitesDasZonas(ritmos);
  const seg = Object.fromEntries(ORDEM_DAS_ZONAS.map((z) => [z, 0]));
  let parado = 0;
  let anaerobico = 0;

  velocidade.forEach((v, i) => {
    const passou = tempo?.[i] != null && tempo?.[i - 1] != null ? tempo[i] - tempo[i - 1] : 1;
    const dt = Math.min(Math.max(passou, 0), SEGUNDOS_MAXIMOS_POR_AMOSTRA);
    if (v == null || v > VELOCIDADE_MAXIMA) return;
    if (v < VELOCIDADE_MINIMA) {
      parado += dt;
      return;
    }
    const ritmo = 1000 / v;
    seg[zonaDoRitmo(ritmo, limites)] += dt;
    if (ritmo <= limites.anaerobico) anaerobico += dt;
  });

  const total = ORDEM_DAS_ZONAS.reduce((t, z) => t + seg[z], 0);
  return { seg, total, parado, anaerobico };
}

// O trote de recuperação é prescrito no ritmo leve, então conta na mesma zona.
function fracoesPrevistas(zonas) {
  const previstas = Object.fromEntries(ORDEM_DAS_ZONAS.map((z) => [z, 0]));
  for (const { chave, fracao } of zonas) previstas[chave === 'recuperacao' ? 'leve' : chave] += fracao;
  return previstas;
}

// O tempo a mais em uma zona cobre o que faltou em outra. Se cobriu uma zona mais lenta,
// correu acima do previsto; se cobriu uma mais rápida, abaixo.
export function compararComPrevisto(seg, zonasPrevistas) {
  const total = ORDEM_DAS_ZONAS.reduce((t, z) => t + seg[z], 0);
  if (!total || !zonasPrevistas.length) return null;

  const previstas = fracoesPrevistas(zonasPrevistas);
  const sobras = [];
  const faltas = [];
  let dentro = 0;
  ORDEM_DAS_ZONAS.forEach((zona, indice) => {
    const real = seg[zona] / total;
    dentro += Math.min(real, previstas[zona]);
    if (real > previstas[zona]) sobras.push({ indice, resto: real - previstas[zona] });
    else if (previstas[zona] > real) faltas.push({ indice, resto: previstas[zona] - real });
  });

  let acima = 0;
  let abaixo = 0;
  let s = 0;
  let f = 0;
  while (s < sobras.length && f < faltas.length) {
    const parte = Math.min(sobras[s].resto, faltas[f].resto);
    if (sobras[s].indice > faltas[f].indice) acima += parte;
    else abaixo += parte;
    sobras[s].resto -= parte;
    faltas[f].resto -= parte;
    if (sobras[s].resto <= 1e-9) s++;
    if (faltas[f].resto <= 1e-9) f++;
  }
  return { dentro, acima, abaixo };
}

export function vereditoDoTreino({ dentro, acima, abaixo }) {
  let titulo = 'Bem diferente do previsto';
  if (dentro >= NOTA_NA_META) titulo = 'Treino dentro da meta';
  else if (dentro >= NOTA_PARCIAL) titulo = 'Parcialmente dentro da meta';

  let tendencia = null;
  if (acima >= MINIMO_PARA_TENDENCIA && acima >= abaixo) tendencia = 'Você correu mais forte que o previsto em parte do treino.';
  else if (abaixo >= MINIMO_PARA_TENDENCIA) tendencia = 'Você correu mais devagar que o previsto em parte do treino.';
  return { titulo, tendencia };
}
