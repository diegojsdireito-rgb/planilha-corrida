// Quatro em linha: 7 colunas x 6 linhas, as peças caem até a casa livre mais baixa.
// 1 é a pessoa, 2 é o robô. Casa = linha * 7 + coluna, linha 0 no alto.

export const COLUNAS = 7;
export const LINHAS = 6;

export const novo = () => Array(COLUNAS * LINHAS).fill(0);

export function linhaLivre(t, c) {
  for (let r = LINHAS - 1; r >= 0; r--) if (!t[r * COLUNAS + c]) return r;
  return -1;
}

export function jogar(t, c, j) {
  const r = linhaLivre(t, c);
  if (r < 0) return null;
  const n = t.slice();
  n[r * COLUNAS + c] = j;
  return n;
}

export const colunasLivres = (t) => [3, 2, 4, 1, 5, 0, 6].filter((c) => !t[c]);
export const cheio = (t) => colunasLivres(t).length === 0;

// Todas as janelas de 4 casas seguidas.
export const JANELAS = (() => {
  const js = [];
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < LINHAS; r++) {
    for (let c = 0; c < COLUNAS; c++) {
      for (const [dr, dc] of dirs) {
        const rf = r + 3 * dr;
        const cf = c + 3 * dc;
        if (rf < 0 || rf >= LINHAS || cf < 0 || cf >= COLUNAS) continue;
        js.push([0, 1, 2, 3].map((k) => (r + k * dr) * COLUNAS + c + k * dc));
      }
    }
  }
  return js;
})();

export function vencedor(t) {
  for (const j of JANELAS) {
    const v = t[j[0]];
    if (v && v === t[j[1]] && v === t[j[2]] && v === t[j[3]]) return { jogador: v, casas: j };
  }
  return null;
}

function avaliar(t, j) {
  const o = 3 - j;
  let nota = 0;
  for (let r = 0; r < LINHAS; r++) {
    const v = t[r * COLUNAS + 3];
    if (v === j) nota += 3; else if (v === o) nota -= 3;
  }
  for (const jan of JANELAS) {
    let meus = 0; let deles = 0;
    for (const i of jan) { if (t[i] === j) meus++; else if (t[i] === o) deles++; }
    if (meus && deles) continue;
    if (meus === 3) nota += 6; else if (meus === 2) nota += 2;
    if (deles === 3) nota -= 8; else if (deles === 2) nota -= 2;
  }
  return nota;
}

function negamax(t, j, prof, alfa, beta) {
  const v = vencedor(t);
  if (v) return -(100000 + prof); // quem jogou antes ganhou
  const opcoes = colunasLivres(t);
  if (!opcoes.length) return 0;
  if (prof === 0) return avaliar(t, j);
  let melhor = -Infinity;
  for (const c of opcoes) {
    const nota = -negamax(jogar(t, c, j), 3 - j, prof - 1, -beta, -alfa);
    if (nota > melhor) melhor = nota;
    if (melhor > alfa) alfa = melhor;
    if (alfa >= beta) break;
  }
  return melhor;
}

const PROFUNDIDADE = { facil: 1, medio: 4, dificil: 7 };
const ERRO = { facil: 0.35, medio: 0.05, dificil: 0 };

export function jogadaRobo(t, robo = 2, nivel = 'medio', aleatorio = Math.random) {
  const opcoes = colunasLivres(t);
  if (!opcoes.length) return null;
  if (aleatorio() < (ERRO[nivel] ?? 0)) return opcoes[Math.floor(aleatorio() * opcoes.length)];
  const prof = PROFUNDIDADE[nivel] ?? 4;
  let melhorNota = -Infinity;
  let melhores = [];
  for (const c of opcoes) {
    const nota = -negamax(jogar(t, c, robo), 3 - robo, prof - 1, -Infinity, Infinity);
    if (nota > melhorNota) { melhorNota = nota; melhores = [c]; }
    else if (nota === melhorNota) melhores.push(c);
  }
  return melhores[Math.floor(aleatorio() * melhores.length)];
}
