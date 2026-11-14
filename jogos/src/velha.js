// Jogo da velha. Casas 0..8; 'X' é a pessoa, 'O' é o robô.

export const LINHAS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const novo = () => Array(9).fill(null);

export function vencedor(t) {
  for (const linha of LINHAS) {
    const [a, b, c] = linha;
    if (t[a] && t[a] === t[b] && t[a] === t[c]) return { jogador: t[a], linha };
  }
  return null;
}

export const livres = (t) => t.flatMap((v, i) => (v ? [] : [i]));
export const empate = (t) => !vencedor(t) && livres(t).length === 0;

function minimax(t, vez, robo, prof) {
  const v = vencedor(t);
  if (v) return v.jogador === robo ? 10 - prof : prof - 10;
  const opcoes = livres(t);
  if (!opcoes.length) return 0;
  const outro = vez === 'X' ? 'O' : 'X';
  let melhor = vez === robo ? -Infinity : Infinity;
  for (const i of opcoes) {
    t[i] = vez;
    const nota = minimax(t, outro, robo, prof + 1);
    t[i] = null;
    melhor = vez === robo ? Math.max(melhor, nota) : Math.min(melhor, nota);
  }
  return melhor;
}

const ERRO = { facil: 0.65, medio: 0.2, dificil: 0 };

export function jogadaRobo(t, robo = 'O', nivel = 'medio', aleatorio = Math.random) {
  const opcoes = livres(t);
  if (!opcoes.length) return null;
  if (aleatorio() < (ERRO[nivel] ?? 0)) return opcoes[Math.floor(aleatorio() * opcoes.length)];
  const humano = robo === 'X' ? 'O' : 'X';
  const copia = t.slice();
  let melhorNota = -Infinity;
  let melhores = [];
  for (const i of opcoes) {
    copia[i] = robo;
    const nota = minimax(copia, humano, robo, 1);
    copia[i] = null;
    if (nota > melhorNota) { melhorNota = nota; melhores = [i]; }
    else if (nota === melhorNota) melhores.push(i);
  }
  return melhores[Math.floor(aleatorio() * melhores.length)];
}
