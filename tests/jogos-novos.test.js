import test from 'node:test';
import assert from 'node:assert/strict';
import * as xadrez from '../jogos/src/xadrez.js';
import * as paciencia from '../jogos/src/paciencia.js';
import * as sudoku from '../jogos/src/sudoku.js';

function perft(s, prof) {
  if (prof === 0) return 1;
  let n = 0;
  for (const m of xadrez.legais(s)) n += perft(xadrez.aplicar(s, m), prof - 1);
  return n;
}

function deFen(fen) {
  const [pos, vez, roque, ep] = fen.split(' ');
  const t = [];
  for (const ch of pos.replaceAll('/', '')) {
    if (/\d/.test(ch)) for (let k = 0; k < Number(ch); k++) t.push('');
    else t.push(ch);
  }
  const casa = ep === '-' ? -1 : (8 - Number(ep[1])) * 8 + 'abcdefgh'.indexOf(ep[0]);
  return { t, vez, roque: roque === '-' ? '' : roque, ep: casa, meio: 0, num: 1 };
}

test('xadrez: perft da posição inicial', () => {
  const s = xadrez.novo();
  assert.equal(perft(s, 1), 20);
  assert.equal(perft(s, 2), 400);
  assert.equal(perft(s, 3), 8902);
});

test('xadrez: perft da posição "kiwipete" (roque, en passant, promoção)', () => {
  const s = deFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -');
  assert.equal(perft(s, 1), 48);
  assert.equal(perft(s, 2), 2039);
});

test('xadrez: perft da posição 3 (en passant com cravada)', () => {
  const s = deFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -');
  assert.equal(perft(s, 3), 2812);
});

test('xadrez: mate do pastor e afogamento', () => {
  let s = xadrez.novo();
  const lance = (de, para) => {
    const m = xadrez.legais(s).find((x) => xadrez.nomeCasa(x.de) === de && xadrez.nomeCasa(x.para) === para);
    s = xadrez.aplicar(s, m);
  };
  lance('e2', 'e4'); lance('e7', 'e5'); lance('f1', 'c4'); lance('b8', 'c6'); lance('d1', 'h5'); lance('g8', 'f6'); lance('h5', 'f7');
  assert.deepEqual(xadrez.resultado(s), { tipo: 'mate', vencedor: 'w' });
  assert.equal(xadrez.resultado(deFen('7k/5Q2/6K1/8/8/8/8/8 b - -')).tipo, 'afogamento');
});

test('xadrez: robô acha o mate em um e não entrega a dama', () => {
  const s = deFen('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - -');
  const m = xadrez.jogadaRobo(s, 'medio', () => 0.5);
  assert.equal(xadrez.nomeCasa(m.para), 'a8');
  const inicio = Date.now();
  const s2 = xadrez.aplicar(xadrez.novo(), xadrez.legais(xadrez.novo()).find((x) => xadrez.nomeCasa(x.para) === 'e4'));
  assert.ok(xadrez.jogadaRobo(s2, 'dificil'));
  assert.ok(Date.now() - inicio < 5000, `demorou ${Date.now() - inicio} ms`);
});

test('paciência: distribuição, compra e reciclagem do monte', () => {
  let s = paciencia.novo(() => 0.3);
  assert.equal(s.colunas.map((c) => c.length).join(), '1,2,3,4,5,6,7');
  assert.equal(s.estoque.length, 24);
  for (let k = 0; k < 24; k++) s = paciencia.comprar(s);
  assert.equal(s.descarte.length, 24);
  s = paciencia.comprar(s);
  assert.equal(s.estoque.length, 24);
  assert.equal(s.passadas, 1);
});

test('paciência: regras de coluna e fundação, e carta revelada', () => {
  const c = (n, naipe, aberta = true) => ({ n, naipe, aberta });
  const s = {
    estoque: [], descarte: [c(1, 0)], fundacoes: [[], [], [], []], lances: 0, passadas: 0,
    colunas: [[c(5, 2, false), c(8, 1)], [c(9, 0)], [], [], [], [], []],
  };
  assert.deepEqual(paciencia.destinoAutomatico(s, { tipo: 'descarte' }), { tipo: 'fundacao' });
  const n = paciencia.mover(s, { tipo: 'coluna', col: 0, idx: 1 }, { tipo: 'coluna', col: 1 });
  assert.ok(n);
  assert.equal(n.colunas[0][0].aberta, true);
  assert.equal(paciencia.mover(s, { tipo: 'coluna', col: 1, idx: 0 }, { tipo: 'coluna', col: 2 }), null);
  assert.deepEqual(paciencia.dica(s).destino, { tipo: 'fundacao' });
});

test('sudoku: gera grade com solução única e pistas do nível', () => {
  let semente = 7;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
  const { puzzle, solucao } = sudoku.gerar('medio', rnd);
  assert.equal(sudoku.resolver(puzzle, 2).total, 1);
  assert.ok(puzzle.filter(Boolean).length <= 34);
  for (let i = 0; i < 81; i++) {
    if (puzzle[i]) assert.equal(puzzle[i], solucao[i]);
    for (const j of sudoku.VIZINHOS[i]) assert.notEqual(solucao[i], solucao[j]);
  }
});
