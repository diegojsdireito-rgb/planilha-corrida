// Ludo para 2 a 4 jogadores num tabuleiro 15x15.
// Cores: 0 vermelho (pessoa), 1 verde, 2 amarelo, 3 azul.
// Progresso de cada peça: -1 na base, 0..50 no percurso comum,
// 51..55 na reta final da própria cor, 56 chegou ao centro.

export const CORES = ['vermelho', 'verde', 'amarelo', 'azul'];
export const NOMES = ['Vermelho', 'Verde', 'Amarelo', 'Azul'];
export const CHEGADA = 56;

// Percurso comum, em sentido horário, a partir da saída do vermelho. [linha, coluna]
export const PERCURSO = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

export const SAIDA = [0, 13, 26, 39];
export const SEGURAS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const RETA = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
];

export const CANTO_BASE = [[0, 0], [0, 9], [9, 9], [9, 0]];
const VAGAS = [[2, 2], [2, 4], [4, 2], [4, 4]];
const CENTRO = [[7.5, 6.6], [6.6, 7.5], [7.5, 8.4], [8.4, 7.5]];

export const absoluta = (cor, p) => (SAIDA[cor] + p) % 52;
export const noPercurso = (p) => p >= 0 && p <= 50;

// Centro da peça em unidades de casa (y, x), para desenhar.
export function posicao(cor, p, peca) {
  if (p < 0) {
    const [r, c] = CANTO_BASE[cor];
    const [dr, dc] = VAGAS[peca];
    return [r + dr, c + dc];
  }
  if (p >= CHEGADA) return CENTRO[cor];
  const [r, c] = p <= 50 ? PERCURSO[absoluta(cor, p)] : RETA[cor][p - 51];
  return [r + 0.5, c + 0.5];
}

export function novo(cores = [0, 2]) {
  return {
    cores: [...cores],
    pecas: [0, 1, 2, 3].map(() => [-1, -1, -1, -1]),
    vez: cores[0],
    dado: null,
    seis: 0,
    vencedores: [],
  };
}

export function destino(p, dado) {
  if (p < 0) return dado === 6 ? 0 : null;
  if (p >= CHEGADA) return null;
  const n = p + dado;
  return n > CHEGADA ? null : n;
}

export function jogadas(estado, cor, dado) {
  const saida = [];
  estado.pecas[cor].forEach((p, peca) => {
    const para = destino(p, dado);
    if (para !== null) saida.push({ cor, peca, de: p, para });
  });
  return saida;
}

// Peças adversárias que seriam capturadas se uma peça da cor parasse em `para`.
export function capturas(estado, cor, para) {
  if (!noPercurso(para)) return [];
  const a = absoluta(cor, para);
  if (SEGURAS.has(a)) return [];
  const saida = [];
  for (const outra of estado.cores) {
    if (outra === cor) continue;
    estado.pecas[outra].forEach((p, peca) => {
      if (noPercurso(p) && absoluta(outra, p) === a) saida.push({ cor: outra, peca });
    });
  }
  return saida;
}

export function aplicar(estado, jogada) {
  const pecas = estado.pecas.map((l) => l.slice());
  const { cor, peca, para } = jogada;
  const capturadas = capturas(estado, cor, para);
  pecas[cor][peca] = para;
  for (const c of capturadas) pecas[c.cor][c.peca] = -1;
  const novoEstado = { ...estado, pecas };
  const vencedores = [...estado.vencedores];
  if (!vencedores.includes(cor) && pecas[cor].every((p) => p === CHEGADA)) vencedores.push(cor);
  novoEstado.vencedores = vencedores;
  return { estado: novoEstado, capturadas, chegou: para === CHEGADA };
}

export const terminou = (estado, cor) => estado.pecas[cor].every((p) => p === CHEGADA);

export function proxima(estado, cor = estado.vez) {
  const i = estado.cores.indexOf(cor);
  for (let k = 1; k <= estado.cores.length; k++) {
    const c = estado.cores[(i + k) % estado.cores.length];
    if (!terminou(estado, c)) return c;
  }
  return cor;
}

// Quantas peças adversárias poderiam alcançar a casa absoluta `a` com um dado de 1 a 6.
export function ameacas(estado, cor, a) {
  if (SEGURAS.has(a)) return 0;
  let n = 0;
  for (const outra of estado.cores) {
    if (outra === cor) continue;
    for (const p of estado.pecas[outra]) {
      if (!noPercurso(p)) {
        if (p < 0 && SAIDA[outra] === a) n++;
        continue;
      }
      const atras = (a - absoluta(outra, p) + 52) % 52;
      // a peça adversária só passa por `a` se ainda não entrou na reta dela
      if (atras >= 1 && atras <= 6 && p + atras <= 50) n++;
    }
  }
  return n;
}

export function notaJogada(estado, j) {
  let nota = 0;
  const caps = capturas(estado, j.cor, j.para);
  if (j.para === CHEGADA) nota += 100;
  if (caps.length) nota += 80 + caps.reduce((s, c) => s + estado.pecas[c.cor][c.peca], 0) / 2;
  if (j.de < 0) nota += 55;
  if (j.para >= 51 && j.de <= 50) nota += 35;
  if (noPercurso(j.para)) {
    const a = absoluta(j.cor, j.para);
    if (SEGURAS.has(a)) nota += 25;
    nota -= 30 * ameacas(estado, j.cor, a);
  }
  if (noPercurso(j.de)) nota += 20 * ameacas(estado, j.cor, absoluta(j.cor, j.de)); // foge do perigo
  nota += j.para / 6;
  return nota;
}

export function jogadaRobo(estado, cor, dado, nivel = 'medio', aleatorio = Math.random) {
  const ops = jogadas(estado, cor, dado);
  if (!ops.length) return null;
  if (nivel === 'facil' && aleatorio() < 0.6) return ops[Math.floor(aleatorio() * ops.length)];
  const ruido = nivel === 'medio' ? 25 : nivel === 'facil' ? 40 : 0;
  let melhor = null; let melhorNota = -Infinity;
  for (const j of ops) {
    const nota = notaJogada(estado, j) + aleatorio() * ruido;
    if (nota > melhorNota) { melhorNota = nota; melhor = j; }
  }
  return melhor;
}
