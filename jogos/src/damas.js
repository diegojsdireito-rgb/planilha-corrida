// Damas brasileiras: tabuleiro 8x8, captura obrigatória e pela maior quantidade,
// pedra captura para trás, dama anda e captura à distância.
// Peças: 1 pedra da pessoa, 2 dama da pessoa, -1 pedra do robô, -2 dama do robô.
// A pessoa joga de baixo para cima e começa.

const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const dentro = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
export const escura = (i) => (((i >> 3) + (i & 7)) & 1) === 1;

export function novo() {
  const t = Array(64).fill(0);
  for (let i = 0; i < 64; i++) {
    if (!escura(i)) continue;
    const r = i >> 3;
    if (r <= 2) t[i] = -1;
    else if (r >= 5) t[i] = 1;
  }
  return t;
}

function capturasDe(t, origem) {
  const peca = t[origem];
  const j = Math.sign(peca);
  const dama = Math.abs(peca) === 2;
  const vazio = (i) => t[i] === 0 || i === origem;
  const saida = [];

  function seguir(pos, caminho, capturadas) {
    let continuou = false;
    const r = pos >> 3; const c = pos & 7;
    for (const [dr, dc] of DIRS) {
      if (dama) {
        let rr = r + dr; let cc = c + dc;
        while (dentro(rr, cc) && vazio(rr * 8 + cc)) { rr += dr; cc += dc; }
        if (!dentro(rr, cc)) continue;
        const alvo = rr * 8 + cc;
        if (Math.sign(t[alvo]) !== -j || capturadas.includes(alvo)) continue;
        rr += dr; cc += dc;
        while (dentro(rr, cc) && vazio(rr * 8 + cc)) {
          const destino = rr * 8 + cc;
          continuou = true;
          seguir(destino, [...caminho, destino], [...capturadas, alvo]);
          rr += dr; cc += dc;
        }
      } else {
        const r2 = r + 2 * dr; const c2 = c + 2 * dc;
        if (!dentro(r2, c2)) continue;
        const alvo = (r + dr) * 8 + c + dc;
        const destino = r2 * 8 + c2;
        if (Math.sign(t[alvo]) === -j && !capturadas.includes(alvo) && vazio(destino)) {
          continuou = true;
          seguir(destino, [...caminho, destino], [...capturadas, alvo]);
        }
      }
    }
    if (!continuou && capturadas.length) saida.push({ de: origem, caminho, capturadas });
  }

  seguir(origem, [], []);
  return saida;
}

function simplesDe(t, origem) {
  const peca = t[origem];
  const j = Math.sign(peca);
  const r = origem >> 3; const c = origem & 7;
  const saida = [];
  for (const [dr, dc] of DIRS) {
    if (Math.abs(peca) === 1) {
      if (dr !== -j) continue; // pedra só anda para a frente
      const rr = r + dr; const cc = c + dc;
      if (dentro(rr, cc) && !t[rr * 8 + cc]) saida.push({ de: origem, caminho: [rr * 8 + cc], capturadas: [] });
    } else {
      let rr = r + dr; let cc = c + dc;
      while (dentro(rr, cc) && !t[rr * 8 + cc]) {
        saida.push({ de: origem, caminho: [rr * 8 + cc], capturadas: [] });
        rr += dr; cc += dc;
      }
    }
  }
  return saida;
}

export function jogadas(t, j) {
  const capturas = [];
  for (let i = 0; i < 64; i++) if (Math.sign(t[i]) === j) capturas.push(...capturasDe(t, i));
  if (capturas.length) {
    const maior = Math.max(...capturas.map((m) => m.capturadas.length));
    return capturas.filter((m) => m.capturadas.length === maior);
  }
  const simples = [];
  for (let i = 0; i < 64; i++) if (Math.sign(t[i]) === j) simples.push(...simplesDe(t, i));
  return simples;
}

export function aplicar(t, m) {
  const n = t.slice();
  let peca = n[m.de];
  n[m.de] = 0;
  for (const i of m.capturadas) n[i] = 0;
  const fim = m.caminho[m.caminho.length - 1];
  const linhaFim = fim >> 3;
  if (peca === 1 && linhaFim === 0) peca = 2;
  if (peca === -1 && linhaFim === 7) peca = -2;
  n[fim] = peca;
  return n;
}

export const destino = (m) => m.caminho[m.caminho.length - 1];

export function contagem(t) {
  const c = { 1: 0, '-1': 0 };
  for (const v of t) if (v) c[Math.sign(v)]++;
  return c;
}

function avaliar(t, j) {
  let nota = 0;
  for (let i = 0; i < 64; i++) {
    const v = t[i];
    if (!v) continue;
    const r = i >> 3; const c = i & 7;
    let valor = Math.abs(v) === 2 ? 320 : 100;
    if (Math.abs(v) === 1) valor += 3 * (v > 0 ? 7 - r : r); // avanço
    if (c >= 2 && c <= 5 && r >= 2 && r <= 5) valor += 4; // centro
    if (Math.abs(v) === 1 && ((v > 0 && r === 7) || (v < 0 && r === 0))) valor += 6; // guarda a última linha
    nota += Math.sign(v) === j ? valor : -valor;
  }
  return nota;
}

function negamax(t, j, prof, alfa, beta) {
  const ops = jogadas(t, j);
  if (!ops.length) return -100000 - prof;
  if (prof === 0) return avaliar(t, j);
  ops.sort((a, b) => b.capturadas.length - a.capturadas.length);
  let melhor = -Infinity;
  for (const m of ops) {
    const nota = -negamax(aplicar(t, m), -j, prof - 1, -beta, -alfa);
    if (nota > melhor) melhor = nota;
    if (melhor > alfa) alfa = melhor;
    if (alfa >= beta) break;
  }
  return melhor;
}

const PROFUNDIDADE = { facil: 1, medio: 4, dificil: 7 };

export function jogadaRobo(t, robo = -1, nivel = 'medio', aleatorio = Math.random) {
  const ops = jogadas(t, robo);
  if (!ops.length) return null;
  if (ops.length === 1) return ops[0];
  if (nivel === 'facil' && aleatorio() < 0.5) return ops[Math.floor(aleatorio() * ops.length)];
  const prof = PROFUNDIDADE[nivel] ?? 4;
  let melhorNota = -Infinity;
  let melhores = [];
  for (const m of ops) {
    const nota = -negamax(aplicar(t, m), -robo, prof - 1, -Infinity, Infinity);
    if (nota > melhorNota) { melhorNota = nota; melhores = [m]; }
    else if (nota === melhorNota) melhores.push(m);
  }
  return melhores[Math.floor(aleatorio() * melhores.length)];
}
