// Quebra-cabeça: cortes das peças, posições e encaixe, sem DOM (testável no Node).
// Posições em "casas": a casa (c, l) do tabuleiro começa em x = c, y = l. A bandeja das
// peças soltas fica embaixo do tabuleiro, de y = linhas até y = linhas + bandeja.

export const TAMANHOS = [
  { n: 9, colunas: 3, linhas: 3, nome: '9 peças' },
  { n: 16, colunas: 4, linhas: 4, nome: '16 peças' },
  { n: 25, colunas: 5, linhas: 5, nome: '25 peças' },
  { n: 36, colunas: 6, linhas: 6, nome: '36 peças' },
  { n: 48, colunas: 6, linhas: 8, nome: '48 peças' },
];
export const tamanhoDe = (n) => TAMANHOS.find((t) => t.n === Number(n)) ?? TAMANHOS[0];
export const TAMANHO_DO_NIVEL = { facil: 9, medio: 16, dificil: 25 };

export const LIMIAR = 0.32; // distância (em casas) para a peça grudar no lugar
export const ABA = 0.24; // altura da aba, em fração do lado da casa
export const MARGEM = 0.3; // folga em volta da casa para a aba caber no desenho da peça

// Altura da bandeja (em casas): uma fileira de peças a cada 0,6 casa, com as peças meio sobrepostas.
export const bandejaDe = (t) => Math.max(1.6, Math.round((0.4 + Math.ceil(t.n / (t.colunas + 1)) * 0.6) * 10) / 10);

// Para cada encaixe interno, sorteia se a aba fica de um lado ou do outro.
// h[l][c]: borda entre (c, l) e (c + 1, l); v[l][c]: borda entre (c, l) e (c, l + 1).
// +1 quer dizer que a aba sai da peça da esquerda (ou de cima).
export function gerarBordas(colunas, linhas, rng = Math.random) {
  const lado = () => (rng() < 0.5 ? 1 : -1);
  const h = Array.from({ length: linhas }, () => Array.from({ length: colunas - 1 }, lado));
  const v = Array.from({ length: linhas - 1 }, () => Array.from({ length: colunas }, lado));
  return { h, v };
}

// Lados da peça i: [cima, direita, baixo, esquerda]; 0 = reto, 1 = aba para fora, -1 = encaixe para dentro.
export function ladosDaPeca(bordas, colunas, linhas, i) {
  const c = i % colunas; const l = Math.floor(i / colunas);
  return [
    l === 0 ? 0 : -bordas.v[l - 1][c],
    c === colunas - 1 ? 0 : bordas.h[l][c],
    l === linhas - 1 ? 0 : bordas.v[l][c],
    c === 0 ? 0 : -bordas.h[l][c - 1],
  ];
}

const n2 = (x) => Number(x.toFixed(2));

// Contorno da peça (casa de w × h começando em 0, 0), com abas em curvas.
export function caminho(lados, w, h) {
  const m = Math.min(w, h);
  const cantos = [[0, 0], [w, 0], [w, h], [0, h], [0, 0]];
  // Aba "padrão" ao longo de uma borda: t vai de 0 a 1 na borda, v é a altura (1 = ponta da aba).
  const CURVA = [
    [[0.36, 0], [0.41, 0], [0.43, 0.25], [0.4, 0.45]],
    [null, [0.34, 0.8], [0.4, 1], [0.5, 1]],
    [null, [0.6, 1], [0.66, 0.8], [0.6, 0.45]],
    [null, [0.57, 0.25], [0.59, 0], [0.64, 0]],
  ];
  let d = 'M0 0';
  for (let k = 0; k < 4; k++) {
    const [x0, y0] = cantos[k]; const [x1, y1] = cantos[k + 1];
    const L = Math.hypot(x1 - x0, y1 - y0);
    const ux = (x1 - x0) / L; const uy = (y1 - y0) / L;
    // normal para fora da peça (o contorno anda no sentido horário, com y para baixo)
    const nx = uy; const ny = -ux;
    const s = lados[k];
    if (s) {
      const larg = m / L; // aba do mesmo tamanho em casas retangulares
      const ponto = ([t, v]) => {
        const ao = (0.5 + (t - 0.5) * larg) * L;
        const fora = v * ABA * m * s;
        return [n2(x0 + ux * ao + nx * fora), n2(y0 + uy * ao + ny * fora)];
      };
      for (const seg of CURVA) {
        if (seg[0]) d += ` L${ponto(seg[0]).join(' ')}`;
        d += ` C${seg.slice(1).map((p) => ponto(p).join(' ')).join(' ')}`;
      }
    }
    d += ` L${n2(x1)} ${n2(y1)}`;
  }
  return `${d} Z`;
}

function embaralhar(lista, rng) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

// Espalha as peças pela bandeja, em ordem sorteada, cada uma num cantinho próprio.
export function espalhar(t, rng = Math.random) {
  const band = bandejaDe(t);
  const cols = t.colunas + 1;
  const linhasB = Math.ceil(t.n / cols);
  const passoX = (t.colunas - 0.8) / Math.max(1, cols - 1);
  const passoY = Math.max(0, band - 1) / Math.max(1, linhasB - 1);
  const ordem = embaralhar([...Array(t.n).keys()], rng);
  const pos = new Array(t.n);
  ordem.forEach((peca, k) => {
    const cx = k % cols; const cy = Math.floor(k / cols);
    const jx = (rng() - 0.5) * passoX * 0.4; const jy = (rng() - 0.5) * passoY * 0.4;
    const x = Math.min(t.colunas - 1, Math.max(0, -0.1 + cx * passoX + jx));
    const y = Math.min(t.linhas + band - 1, Math.max(t.linhas + 0.05, t.linhas + 0.1 + cy * passoY + jy));
    pos[peca] = { x: n2(x), y: n2(y), ok: false };
  });
  return pos;
}

export function novoJogo(n, imagem, rng = Math.random) {
  const t = tamanhoDe(n);
  return { n: t.n, imagem, bordas: gerarBordas(t.colunas, t.linhas, rng), pos: espalhar(t, rng), tempo: 0, ordem: [...Array(t.n).keys()] };
}

export const lugarDe = (e, i) => { const t = tamanhoDe(e.n); return { x: i % t.colunas, y: Math.floor(i / t.colunas) }; };

// Solta a peça i em (x, y). Se estiver perto do lugar certo, gruda. Devolve true se encaixou.
export function soltar(e, i, x, y, limiar = LIMIAR) {
  const t = tamanhoDe(e.n);
  const band = bandejaDe(t);
  const p = e.pos[i];
  if (p.ok) return false;
  const alvo = lugarDe(e, i);
  if (Math.abs(x - alvo.x) <= limiar && Math.abs(y - alvo.y) <= limiar) {
    e.pos[i] = { x: alvo.x, y: alvo.y, ok: true };
    return true;
  }
  e.pos[i] = { x: n2(Math.min(t.colunas - 0.4, Math.max(-0.6, x))), y: n2(Math.min(t.linhas + band - 0.5, Math.max(-0.6, y))), ok: false };
  // a peça solta vai para cima das outras
  e.ordem = [...e.ordem.filter((k) => k !== i), i];
  return false;
}

export const encaixadas = (e) => e.pos.filter((p) => p.ok).length;
export const completo = (e) => encaixadas(e) === e.n;

// Dica: uma peça solta (a de cima da pilha) e o lugar dela.
export function dica(e) {
  for (let k = e.ordem.length - 1; k >= 0; k--) {
    const i = e.ordem[k];
    if (!e.pos[i].ok) return { peca: i, ...lugarDe(e, i) };
  }
  return null;
}

// Peças com borda reta (cantos e beiradas): boas para começar.
export const ehBeirada = (e, i) => ladosDaPeca(e.bordas, tamanhoDe(e.n).colunas, tamanhoDe(e.n).linhas, i).includes(0);
