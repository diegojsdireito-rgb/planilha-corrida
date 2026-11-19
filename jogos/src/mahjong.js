// Mahjong paciência: tire as peças de dois em dois. Uma peça está livre quando nada está em
// cima dela e um dos lados (esquerdo ou direito) está vazio. Sem DOM, para dar para testar.
//
// Posições em meias-peças: x e y andam de 2 em 2 entre peças vizinhas; z é a camada.

export const NAIPES = {
  b: { nome: 'Bambu', n: 9 },
  c: { nome: 'Caractere', n: 9 },
  d: { nome: 'Círculo', n: 9 },
};
export const HONRAS = ['v1', 'v2', 'v3', 'v4', 'g1', 'g2', 'g3']; // ventos e dragões
export const FLORES = ['f1', 'f2', 'f3', 'f4'];
export const ESTACOES = ['s1', 's2', 's3', 's4'];

// As 34 peças comuns (4 de cada no jogo completo).
export const COMUNS = [...Object.keys(NAIPES).flatMap((n) => Array.from({ length: 9 }, (_, k) => `${n}${k + 1}`)), ...HONRAS];

// Flores combinam com qualquer flor; estações com qualquer estação.
export const grupo = (k) => (k[0] === 'f' || k[0] === 's' ? k[0] : k);
export const combinam = (a, b) => grupo(a) === grupo(b);

// Camadas desenhadas com X; [dx, dy] desloca a camada em meias-peças para centralizar.
const camadas = (...lista) => lista.flatMap(([mapa, dx, dy], z) => mapa.trim().split('\n').flatMap((linha, l) => [...linha.trim()].flatMap((ch, c) => (ch === 'X' ? [{ x: c * 2 + dx, y: l * 2 + dy, z }] : []))));
const ret = (c, l) => Array.from({ length: l }, () => 'X'.repeat(c)).join('\n');

export const LAYOUTS = {
  facil: {
    nome: 'Pirâmide',
    posicoes: camadas([ret(8, 6), 0, 0], [ret(6, 3), 2, 3], [ret(2, 3), 6, 3]),
  },
  medio: {
    nome: 'Fortaleza',
    posicoes: camadas([ret(8, 8), 0, 0], [ret(6, 5), 2, 3], [ret(4, 2), 4, 6], [ret(1, 2), 7, 6]),
  },
  dificil: {
    nome: 'Torre do dragão',
    posicoes: camadas([ret(9, 8), 0, 0], [ret(7, 6), 2, 2], [ret(5, 4), 4, 4], [ret(3, 2), 6, 6], [ret(2, 2), 7, 6]),
  },
};

// Peças por par para um tabuleiro de n peças: cada tipo entra com 4 peças (2 pares).
export function paresPara(n, sorteio = Math.random) {
  const tipos = [...COMUNS].sort(() => sorteio() - 0.5);
  const pares = [];
  if (n >= 144) { pares.push(['f1', 'f2'], ['f3', 'f4'], ['s1', 's2'], ['s3', 's4']); }
  for (let k = 0; pares.length < n / 2; k++) { const t = tipos[k % tipos.length]; pares.push([t, t]); if (pares.length < n / 2) pares.push([t, t]); }
  return pares;
}

const sobre = (a, b) => b.z === a.z + 1 && Math.abs(b.x - a.x) < 2 && Math.abs(b.y - a.y) < 2;
const aoLado = (a, b, lado) => b.z === a.z && b.x === a.x + 2 * lado && Math.abs(b.y - a.y) < 2;

export function livre(p, pecas) {
  let esq = false; let dir = false;
  for (const q of pecas) {
    if (q === p || q.fora) continue;
    if (sobre(p, q)) return false;
    if (aoLado(p, q, -1)) esq = true;
    else if (aoLado(p, q, 1)) dir = true;
    if (esq && dir) return false;
  }
  return true;
}

export const livres = (pecas) => pecas.filter((p) => !p.fora && livre(p, pecas));

// Monta um tabuleiro que sempre tem solução: tira pares de peças livres do tabuleiro cheio,
// e cada par tirado recebe o mesmo desenho. A ordem de tirar é uma solução.
export function montar(posicoes, pares, sorteio = Math.random) {
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const pecas = posicoes.map((p) => ({ x: p.x, y: p.y, z: p.z, k: null, fora: false }));
    const fila = [...pares].sort(() => sorteio() - 0.5);
    let ok = true;
    for (const par of fila) {
      const l = livres(pecas);
      if (l.length < 2) { ok = false; break; }
      // prefere peças de camadas altas, para o tabuleiro não ficar fácil demais
      l.sort((a, b) => b.z - a.z + (sorteio() - 0.5) * 2.2);
      const a = l[0]; const b = l[1 + Math.floor(sorteio() * (l.length - 1))];
      a.k = par[0]; b.k = par[1]; a.fora = true; b.fora = true;
    }
    if (ok) return pecas.map((p) => ({ ...p, fora: false }));
  }
  throw new Error('Não consegui montar o tabuleiro.');
}

export function novoJogo(nivel = 'medio', sorteio = Math.random) {
  const layout = LAYOUTS[nivel] ?? LAYOUTS.medio;
  return { nivel, pecas: montar(layout.posicoes, paresPara(layout.posicoes.length, sorteio), sorteio), tirados: [], tempo: 0 };
}

// Um par livre que combina (para a dica e para saber se ainda há jogada).
export function dica(pecas) {
  const l = livres(pecas);
  for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (combinam(l[i].k, l[j].k)) return [l[i], l[j]];
  return null;
}

export const restantes = (pecas) => pecas.filter((p) => !p.fora).length;

// Embaralha as peças que sobraram em um arranjo que tem solução de novo.
export function embaralhar(pecas, sorteio = Math.random) {
  const sobra = pecas.filter((p) => !p.fora);
  const porGrupo = {};
  for (const p of sobra) (porGrupo[grupo(p.k)] ??= []).push(p.k);
  const pares = Object.values(porGrupo).flatMap((ks) => { const r = []; for (let i = 0; i + 1 < ks.length; i += 2) r.push([ks[i], ks[i + 1]]); return r; });
  const novas = montar(sobra, pares, sorteio);
  sobra.forEach((p, i) => { p.k = novas[i].k; });
  return pecas;
}
