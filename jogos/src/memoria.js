// Jogo da Memória: regras e fases, sem DOM (testável no Node).
// As cartas guardam só o código da figura; a tela sabe desenhar cada código.

// Figuras de cada tema (a arte fica em telas/memoria.js).
export const FIGURAS = {
  doces: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'd11'],
  bichos: ['gato', 'cachorro', 'sapo', 'urso', 'panda', 'porco', 'coelho', 'pinto', 'leao', 'raposa', 'vaca', 'macaco'],
  coisas: ['sol', 'lua', 'estrela', 'coracao', 'balao', 'foguete', 'flor', 'maca', 'sorvete', 'cogumelo', 'presente', 'arcoiris'],
  turma: ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'r0', 'r1', 'r2', 'r3'],
};
export const NOMES_TEMA = { doces: 'Docinhos', bichos: 'Bichinhos', coisas: 'Coisinhas', turma: 'A turma', misto: 'Mistura' };

export const TOTAL_FASES = 30;

// Pares de cada fase e o que ela tem de especial.
//   troca: depois de cada erro, duas cartas fechadas trocam de lugar;
//   limite: número máximo de tentativas (passou disso, perdeu).
const PARES = [3, 4, 5, 6, 6, 6, 8, 8, 8, 9, 10, 10, 10, 12, 12, 12, 12, 14, 14, 14, 14, 15, 15, 15, 16, 16, 16, 18, 18, 18];
const TEMAS = ['bichos', 'doces', 'coisas', 'turma', 'misto'];

export function fase(n) {
  const k = Math.min(TOTAL_FASES, Math.max(1, Math.round(n)));
  const pares = PARES[k - 1];
  let tema = k === TOTAL_FASES ? 'misto' : TEMAS[(k - 1) % TEMAS.length];
  if (tema !== 'misto' && FIGURAS[tema].length < pares) tema = 'misto';
  const troca = k >= 5 && (k % 4 === 1 || k % 10 === 0 || k >= 27);
  const comLimite = k >= 7 && (k % 4 === 3 || k % 10 === 0 || k >= 28);
  const tres = Math.ceil(pares * 1.6) + 1; // até aqui: 3 estrelas
  const duas = Math.ceil(pares * 2.3) + 2; // até aqui: 2 estrelas
  return {
    n: k, pares, tema, colunas: colunas(pares * 2),
    troca, limite: comLimite ? Math.ceil(pares * 2.6) + 4 : null,
    estrelas: [tres, duas],
    chefe: k % 10 === 0,
  };
}

// Escolhe a grade mais "em pé" possível para caber no celular.
export function colunas(cartas) {
  let melhor = 3; let nota = Infinity;
  for (let c = 3; c <= 6; c++) {
    const linhas = Math.ceil(cartas / c);
    const sobra = linhas * c - cartas;
    const n = sobra * 3 + Math.abs(linhas / c - 1.35);
    if (n < nota) { nota = n; melhor = c; }
  }
  return melhor;
}

export function estrelasPor(f, tentativas) {
  if (tentativas <= f.estrelas[0]) return 3;
  if (tentativas <= f.estrelas[1]) return 2;
  return 1;
}

function figurasDoTema(tema) {
  if (tema !== 'misto') return [...FIGURAS[tema]];
  return Object.values(FIGURAS).flat();
}

function embaralhar(lista, rng) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export function novoJogo(n, rng = Math.random) {
  const f = fase(n);
  const pool = embaralhar(figurasDoTema(f.tema), rng);
  const escolhidas = pool.slice(0, f.pares);
  const cartas = embaralhar([...escolhidas, ...escolhidas], rng).map((fig) => ({ f: fig, achada: false }));
  return { fase: f.n, cartas, abertas: [], tentativas: 0, erros: 0, fim: null };
}

export const achados = (e) => e.cartas.filter((c) => c.achada).length / 2;
export const totalPares = (e) => e.cartas.length / 2;

// Fecha as duas cartas diferentes que ficaram abertas.
export function esconder(e) {
  if (e.abertas.length === 2) e.abertas = [];
}

// Vira a carta i. Devolve o que aconteceu:
//   'invalida' (já aberta/achada ou jogo acabado), 'primeira', 'par', 'diferente'.
// Junto: { tipo, fim } onde fim é 'vitoria' | 'derrota' | null.
export function virar(e, i, rng = Math.random) {
  if (e.fim) return { tipo: 'invalida', fim: e.fim };
  if (e.abertas.length === 2) esconder(e);
  const c = e.cartas[i];
  if (!c || c.achada || e.abertas.includes(i)) return { tipo: 'invalida', fim: null };
  e.abertas.push(i);
  if (e.abertas.length === 1) return { tipo: 'primeira', fim: null };
  e.tentativas++;
  const [a, b] = e.abertas;
  const f = fase(e.fase);
  if (e.cartas[a].f === e.cartas[b].f) {
    e.cartas[a].achada = true; e.cartas[b].achada = true;
    e.abertas = [];
    if (achados(e) === totalPares(e)) e.fim = 'vitoria';
    return { tipo: 'par', fim: e.fim, pares: [a, b] };
  }
  e.erros++;
  let trocadas = null;
  if (f.troca) trocadas = trocarDuas(e, rng, [a, b]);
  if (f.limite && e.tentativas >= f.limite) e.fim = 'derrota';
  return { tipo: 'diferente', fim: e.fim, trocadas };
}

// Duas cartas fechadas (que não estão abertas agora) trocam de lugar.
export function trocarDuas(e, rng = Math.random, evitar = []) {
  const livres = e.cartas.map((c, i) => i).filter((i) => !e.cartas[i].achada && !evitar.includes(i));
  // Trocar duas cartas iguais não muda nada: procura um par de figuras diferentes.
  for (let tent = 0; tent < 20 && livres.length >= 2; tent++) {
    const a = livres[Math.floor(rng() * livres.length)];
    const b = livres[Math.floor(rng() * livres.length)];
    if (a === b || e.cartas[a].f === e.cartas[b].f) continue;
    [e.cartas[a], e.cartas[b]] = [e.cartas[b], e.cartas[a]];
    return [a, b];
  }
  return null;
}

export const restantes = (e) => {
  const f = fase(e.fase);
  return f.limite ? Math.max(0, f.limite - e.tentativas) : null;
};

export function pontosDe(e) {
  const f = fase(e.fase);
  return Math.max(10, f.pares * 100 - (e.tentativas - f.pares) * 15);
}

// Melhor resultado de cada fase e a fase liberada, a partir do histórico.
export function progresso(historico) {
  const melhor = {};
  let liberada = 1;
  for (const h of historico) {
    if (h.j !== 'memoria' || !h.nivel) continue;
    const m = (melhor[h.nivel] ??= { estrelas: 0, pontos: 0, vezes: 0 });
    m.vezes++;
    m.pontos = Math.max(m.pontos, h.pontos ?? 0);
    if (h.r === 'vitoria') { m.estrelas = Math.max(m.estrelas, h.estrelas ?? 1); liberada = Math.max(liberada, h.nivel + 1); }
  }
  liberada = Math.min(TOTAL_FASES, liberada);
  const estrelas = Object.values(melhor).reduce((t, m) => t + m.estrelas, 0);
  return { melhor, liberada, estrelas, maxEstrelas: TOTAL_FASES * 3 };
}
