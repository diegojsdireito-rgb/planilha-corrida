// Mancala, regra Kalah. Lógica pura, sem DOM.
// Tabuleiro de 14 posições, no sentido anti-horário visto por quem joga (jogador 0, embaixo):
// 0..5 são as casinhas dele (da esquerda para a direita), 6 é o depósito dele (à direita),
// 7..12 são as casinhas do robô (jogador 1, em cima, da direita para a esquerda) e 13 é o
// depósito do robô (à esquerda). A casa da frente de i é 12 - i.

export const CASAS = 6;
export const SEMENTES = 4;
export const deposito = (j) => (j === 0 ? 6 : 13);
export const casasDe = (j) => (j === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
export const donoDa = (i) => (i <= 6 ? 0 : 1);
export const frente = (i) => 12 - i;

export function novo(sementes = SEMENTES) {
  const t = Array(14).fill(sementes);
  t[6] = 0; t[13] = 0;
  return t;
}

export const jogadas = (t, j) => casasDe(j).filter((i) => t[i] > 0);
export const ladoVazio = (t, j) => casasDe(j).every((i) => t[i] === 0);
export const acabou = (t) => ladoVazio(t, 0) || ladoVazio(t, 1);

// Semeia a partir de `casa`. Devolve o tabuleiro novo e o que aconteceu, para a tela animar:
// caminho (posições que receberam uma semente, na ordem), deNovo (a última caiu no próprio
// depósito), captura ({ casa, frente, qtd }) e varrida (sementes recolhidas no fim, por jogador).
export function semear(tabuleiro, j, casa) {
  if (donoDa(casa) !== j || casa === deposito(j) || !tabuleiro[casa]) throw new Error('Jogada inválida');
  const t = tabuleiro.slice();
  let n = t[casa];
  t[casa] = 0;
  let i = casa;
  const caminho = [];
  while (n > 0) {
    i = (i + 1) % 14;
    if (i === deposito(1 - j)) continue;
    t[i]++;
    caminho.push(i);
    n--;
  }
  const res = { t, caminho, ultima: i, deNovo: i === deposito(j), captura: null, varrida: null, fim: false };
  if (!res.deNovo && donoDa(i) === j && t[i] === 1 && t[frente(i)] > 0) {
    const qtd = t[frente(i)] + 1;
    res.captura = { casa: i, frente: frente(i), qtd };
    t[deposito(j)] += qtd;
    t[i] = 0; t[frente(i)] = 0;
  }
  if (acabou(t)) {
    res.fim = true;
    res.varrida = [0, 0];
    for (const k of [0, 1]) for (const c of casasDe(k)) { res.varrida[k] += t[c]; t[deposito(k)] += t[c]; t[c] = 0; }
    res.deNovo = false;
  }
  return res;
}

export function resultado(t) {
  if (!acabou(t)) return null;
  const [a, b] = [t[6], t[13]];
  return { vencedor: a === b ? null : a > b ? 0 : 1, pontos: [a, b] };
}

// ---------- robô ----------

const avaliar = (t, j) => t[deposito(j)] - t[deposito(1 - j)];

function minimax(t, vez, j, prof, alfa, beta) {
  if (prof === 0 || acabou(t)) return avaliar(t, j) + (acabou(t) ? Math.sign(avaliar(t, j)) * 100 : 0);
  const max = vez === j;
  let melhor = max ? -Infinity : Infinity;
  for (const c of ordenar(t, vez)) {
    const r = semear(t, vez, c);
    const v = minimax(r.t, r.deNovo ? vez : 1 - vez, j, prof - 1, alfa, beta);
    if (max) { melhor = Math.max(melhor, v); alfa = Math.max(alfa, v); } else { melhor = Math.min(melhor, v); beta = Math.min(beta, v); }
    if (beta <= alfa) break;
  }
  return melhor;
}

// Jogadas que dão jogada extra primeiro: a poda alfa-beta corta mais.
function ordenar(t, j) {
  const lista = jogadas(t, j);
  return lista.sort((a, b) => Number(b + t[b] === deposito(j)) - Number(a + t[a] === deposito(j)));
}

const PROFUNDIDADE = 7;

function guloso(t, j, c) {
  const r = semear(t, j, c);
  let n = r.t[deposito(j)] - t[deposito(j)];
  if (r.deNovo) n += 1.5;
  return n;
}

export function jogadaRobo(t, j = 1, nivel = 'medio', aleatorio = Math.random) {
  const opcoes = jogadas(t, j);
  if (!opcoes.length) return null;
  const sorteia = (l) => l[Math.floor(aleatorio() * l.length)];
  if (nivel === 'facil') {
    // Aleatório, com uma preferência simples: se dá para jogar de novo, às vezes aproveita.
    const extra = opcoes.filter((c) => semear(t, j, c).deNovo);
    return extra.length && aleatorio() < 0.5 ? sorteia(extra) : sorteia(opcoes);
  }
  const nota = nivel === 'dificil'
    ? (c) => { const r = semear(t, j, c); return minimax(r.t, r.deNovo ? j : 1 - j, j, PROFUNDIDADE - 1, -Infinity, Infinity); }
    : (c) => guloso(t, j, c);
  let melhor = -Infinity; let melhores = [];
  for (const c of opcoes) {
    const v = nota(c);
    if (v > melhor) { melhor = v; melhores = [c]; } else if (v === melhor) melhores.push(c);
  }
  return sorteia(melhores);
}
