// Paciência (Klondike), comprando uma carta por vez.
// Carta: { n: 1..13, naipe: 0..3, aberta }. Naipes: 0 espadas, 1 copas, 2 ouros, 3 paus.
// Cada fundação recebe um naipe só: fundacoes[naipe].

export const NAIPES = ['♠', '♥', '♦', '♣'];
export const VALORES = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const vermelha = (carta) => carta.naipe === 1 || carta.naipe === 2;

export function novo(aleatorio = Math.random) {
  const baralho = [];
  for (let naipe = 0; naipe < 4; naipe++) for (let n = 1; n <= 13; n++) baralho.push({ n, naipe, aberta: false });
  for (let i = baralho.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
  }
  const colunas = [];
  for (let c = 0; c < 7; c++) {
    const col = baralho.splice(0, c + 1);
    col[col.length - 1].aberta = true;
    colunas.push(col);
  }
  return { estoque: baralho, descarte: [], fundacoes: [[], [], [], []], colunas, lances: 0, passadas: 0 };
}

const copiar = (s) => ({
  ...s,
  estoque: s.estoque.map((c) => ({ ...c })),
  descarte: s.descarte.map((c) => ({ ...c })),
  fundacoes: s.fundacoes.map((f) => f.map((c) => ({ ...c }))),
  colunas: s.colunas.map((col) => col.map((c) => ({ ...c }))),
});

export function comprar(s) {
  if (!s.estoque.length && !s.descarte.length) return null;
  const n = copiar(s);
  if (n.estoque.length) {
    const c = n.estoque.pop();
    c.aberta = true;
    n.descarte.push(c);
  } else {
    n.estoque = n.descarte.reverse().map((c) => ({ ...c, aberta: false }));
    n.descarte = [];
    n.passadas++;
  }
  n.lances++;
  return n;
}

// Origem: { tipo: 'descarte' } | { tipo: 'coluna', col, idx } | { tipo: 'fundacao', naipe }
export function cartasDe(s, o) {
  if (o.tipo === 'descarte') return s.descarte.length ? [s.descarte[s.descarte.length - 1]] : [];
  if (o.tipo === 'fundacao') { const f = s.fundacoes[o.naipe]; return f.length ? [f[f.length - 1]] : []; }
  const col = s.colunas[o.col];
  if (!col[o.idx]?.aberta) return [];
  return col.slice(o.idx);
}

export function cabeNaColuna(carta, col) {
  if (!col.length) return carta.n === 13;
  const topo = col[col.length - 1];
  return topo.aberta && vermelha(topo) !== vermelha(carta) && topo.n === carta.n + 1;
}

export function cabeNaFundacao(carta, f) {
  if (!f.length) return carta.n === 1;
  const topo = f[f.length - 1];
  return topo.naipe === carta.naipe && topo.n + 1 === carta.n;
}

// Destino: { tipo: 'coluna', col } | { tipo: 'fundacao' }
export function mover(s, o, d) {
  const cartas = cartasDe(s, o);
  if (!cartas.length) return null;
  if (d.tipo === 'fundacao') {
    if (cartas.length !== 1 || !cabeNaFundacao(cartas[0], s.fundacoes[cartas[0].naipe])) return null;
    if (o.tipo === 'fundacao') return null;
  } else {
    if (o.tipo === 'coluna' && o.col === d.col) return null;
    if (!cabeNaColuna(cartas[0], s.colunas[d.col])) return null;
  }
  const n = copiar(s);
  let movidas;
  if (o.tipo === 'descarte') movidas = [n.descarte.pop()];
  else if (o.tipo === 'fundacao') movidas = [n.fundacoes[o.naipe].pop()];
  else {
    movidas = n.colunas[o.col].splice(o.idx);
    const col = n.colunas[o.col];
    if (col.length) col[col.length - 1].aberta = true;
  }
  if (d.tipo === 'fundacao') n.fundacoes[movidas[0].naipe].push(movidas[0]);
  else n.colunas[d.col].push(...movidas);
  n.lances++;
  return n;
}

// Melhor destino para um toque na carta: fundação, depois coluna com carta, depois coluna vazia.
export function destinoAutomatico(s, o) {
  const cartas = cartasDe(s, o);
  if (!cartas.length) return null;
  if (cartas.length === 1 && o.tipo !== 'fundacao' && cabeNaFundacao(cartas[0], s.fundacoes[cartas[0].naipe])) return { tipo: 'fundacao' };
  const ordem = [...s.colunas.keys()].sort((a, b) => (s.colunas[b].length > 0) - (s.colunas[a].length > 0));
  for (const col of ordem) {
    if (o.tipo === 'coluna' && o.col === col) continue;
    // rei que já está no fundo de uma coluna não precisa ir para outra vazia
    if (!s.colunas[col].length && o.tipo === 'coluna' && o.idx === 0) continue;
    if (cabeNaColuna(cartas[0], s.colunas[col])) return { tipo: 'coluna', col };
  }
  return null;
}

export const venceu = (s) => s.fundacoes.every((f) => f.length === 13);
export const podeTerminarSozinho = (s) => !s.estoque.length && !s.descarte.length && s.colunas.every((col) => col.every((c) => c.aberta));

// Dica do robô: um lance útil, ou comprar.
export function dica(s) {
  const origens = [];
  s.colunas.forEach((col, c) => {
    if (col.length) origens.push({ tipo: 'coluna', col: c, idx: col.length - 1 });
  });
  if (s.descarte.length) origens.push({ tipo: 'descarte' });
  for (const o of origens) {
    const carta = cartasDe(s, o)[0];
    if (cabeNaFundacao(carta, s.fundacoes[carta.naipe])) return { origem: o, destino: { tipo: 'fundacao' } };
  }
  // mover pilha que revela carta fechada
  for (let c = 0; c < 7; c++) {
    const col = s.colunas[c];
    const idx = col.findIndex((k) => k.aberta);
    if (idx <= 0) continue;
    const o = { tipo: 'coluna', col: c, idx };
    const d = destinoAutomatico(s, o);
    if (d) return { origem: o, destino: d };
  }
  if (s.descarte.length) {
    const o = { tipo: 'descarte' };
    const d = destinoAutomatico(s, o);
    if (d) return { origem: o, destino: d };
  }
  if (s.estoque.length || s.descarte.length) return { comprar: true };
  return null;
}
