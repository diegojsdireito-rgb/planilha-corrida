// Reversi 8x8. 1 é a pessoa (pretas, começa), 2 é o robô (brancas).

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export function novo() {
  const t = Array(64).fill(0);
  t[27] = 2; t[28] = 1; t[35] = 1; t[36] = 2;
  return t;
}

export function viradas(t, i, j) {
  if (t[i]) return [];
  const o = 3 - j;
  const r0 = i >> 3; const c0 = i & 7;
  const total = [];
  for (const [dr, dc] of DIRS) {
    const linha = [];
    let r = r0 + dr; let c = c0 + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && t[r * 8 + c] === o) {
      linha.push(r * 8 + c); r += dr; c += dc;
    }
    if (linha.length && r >= 0 && r < 8 && c >= 0 && c < 8 && t[r * 8 + c] === j) total.push(...linha);
  }
  return total;
}

export function jogadas(t, j) {
  const m = new Map();
  for (let i = 0; i < 64; i++) {
    const v = viradas(t, i, j);
    if (v.length) m.set(i, v);
  }
  return m;
}

export function jogar(t, i, j) {
  const v = viradas(t, i, j);
  if (!v.length) return null;
  const n = t.slice();
  n[i] = j;
  for (const k of v) n[k] = j;
  return n;
}

export function contagem(t) {
  let p1 = 0; let p2 = 0;
  for (const v of t) { if (v === 1) p1++; else if (v === 2) p2++; }
  return { 1: p1, 2: p2 };
}

export const acabou = (t) => jogadas(t, 1).size === 0 && jogadas(t, 2).size === 0;

const PESOS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
];

function avaliar(t, j) {
  const o = 3 - j;
  if (acabou(t)) {
    const c = contagem(t);
    return (c[j] - c[o]) * 1000;
  }
  let nota = 0;
  for (let i = 0; i < 64; i++) {
    if (t[i] === j) nota += PESOS[i]; else if (t[i] === o) nota -= PESOS[i];
  }
  nota += 5 * (jogadas(t, j).size - jogadas(t, o).size);
  return nota;
}

function negamax(t, j, prof, alfa, beta) {
  if (prof === 0 || acabou(t)) return avaliar(t, j);
  const ops = jogadas(t, j);
  if (!ops.size) return -negamax(t, 3 - j, prof - 1, -beta, -alfa);
  let melhor = -Infinity;
  const ordem = [...ops.keys()].sort((a, b) => PESOS[b] - PESOS[a]);
  for (const i of ordem) {
    const nota = -negamax(jogar(t, i, j), 3 - j, prof - 1, -beta, -alfa);
    if (nota > melhor) melhor = nota;
    if (melhor > alfa) alfa = melhor;
    if (alfa >= beta) break;
  }
  return melhor;
}

const PROFUNDIDADE = { facil: 1, medio: 3, dificil: 5 };

export function jogadaRobo(t, robo = 2, nivel = 'medio', aleatorio = Math.random) {
  const ops = [...jogadas(t, robo).keys()];
  if (!ops.length) return null;
  if (nivel === 'facil' && aleatorio() < 0.5) return ops[Math.floor(aleatorio() * ops.length)];
  const prof = PROFUNDIDADE[nivel] ?? 3;
  let melhorNota = -Infinity;
  let melhores = [];
  for (const i of ops) {
    const nota = -negamax(jogar(t, i, robo), 3 - robo, prof - 1, -Infinity, Infinity);
    if (nota > melhorNota) { melhorNota = nota; melhores = [i]; }
    else if (nota === melhorNota) melhores.push(i);
  }
  return melhores[Math.floor(aleatorio() * melhores.length)];
}
