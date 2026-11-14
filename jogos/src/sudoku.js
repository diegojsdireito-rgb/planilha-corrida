// Sudoku 9x9 com solução única. Grade: array de 81 números, 0 = vazio.

const linha = (i) => Math.floor(i / 9);
const coluna = (i) => i % 9;
const caixa = (i) => Math.floor(linha(i) / 3) * 3 + Math.floor(coluna(i) / 3);

export const VIZINHOS = Array.from({ length: 81 }, (_, i) => {
  const v = new Set();
  for (let j = 0; j < 81; j++) {
    if (j !== i && (linha(j) === linha(i) || coluna(j) === coluna(i) || caixa(j) === caixa(i))) v.add(j);
  }
  return [...v];
});

export function permitidos(g, i) {
  const usados = new Set();
  for (const j of VIZINHOS[i]) if (g[j]) usados.add(g[j]);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !usados.has(n));
}

// Conta soluções até `limite`; devolve { total, solucao }.
export function resolver(grade, limite = 2, aleatorio = null) {
  const g = grade.slice();
  let total = 0;
  let solucao = null;
  function busca() {
    let melhor = -1; let opcoes = null;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const p = permitidos(g, i);
      if (!p.length) return false;
      if (!opcoes || p.length < opcoes.length) { melhor = i; opcoes = p; if (p.length === 1) break; }
    }
    if (melhor < 0) {
      total++;
      if (!solucao) solucao = g.slice();
      return total >= limite;
    }
    if (aleatorio) {
      for (let k = opcoes.length - 1; k > 0; k--) {
        const j = Math.floor(aleatorio() * (k + 1));
        [opcoes[k], opcoes[j]] = [opcoes[j], opcoes[k]];
      }
    }
    for (const n of opcoes) {
      g[melhor] = n;
      if (busca()) return true;
    }
    g[melhor] = 0;
    return false;
  }
  busca();
  return { total, solucao };
}

const PISTAS = { facil: 40, medio: 32, dificil: 26 };

export function gerar(nivel = 'medio', aleatorio = Math.random) {
  const { solucao } = resolver(Array(81).fill(0), 1, aleatorio);
  const puzzle = solucao.slice();
  const ordem = [...Array(81).keys()];
  for (let k = ordem.length - 1; k > 0; k--) {
    const j = Math.floor(aleatorio() * (k + 1));
    [ordem[k], ordem[j]] = [ordem[j], ordem[k]];
  }
  let pistas = 81;
  const alvo = PISTAS[nivel] ?? 32;
  for (const i of ordem) {
    if (pistas <= alvo) break;
    const guardado = puzzle[i];
    puzzle[i] = 0;
    if (resolver(puzzle, 2).total !== 1) puzzle[i] = guardado;
    else pistas--;
  }
  return { puzzle, solucao };
}

export const completo = (g, solucao) => g.every((v, i) => v === solucao[i]);
