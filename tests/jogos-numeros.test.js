import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as nm from '../jogos/src/numeros.js';
import { semente } from '../jogos/src/pintar-formas.js';

const montar = (linhas) => {
  const n = linhas.length; const blocos = []; let id = 1;
  linhas.forEach((l, r) => l.forEach((v, c) => { if (v) blocos.push({ id: id++, v, r, c }); }));
  return { n, meta: 2048, blocos, pontos: 0, proximo: id, jogadas: 0 };
};
const tabela = (j) => { const g = Array.from({ length: j.n }, () => Array(j.n).fill(0)); for (const b of j.blocos) g[b.r][b.c] = b.v; return g; };
const semSorte = () => 0.99; // o bloco novo é sempre 4, na última casa vazia

test('começa com dois blocos, do tamanho do nível', () => {
  for (const [nivel, n] of [['facil', 5], ['medio', 4], ['dificil', 3]]) {
    const j = nm.novoJogo(nivel, semente(3));
    assert.equal(j.n, n); assert.equal(j.blocos.length, 2);
    for (const b of j.blocos) assert.ok([2, 4].includes(b.v));
  }
});

test('junta iguais uma vez por jogada e soma os pontos', () => {
  const j = montar([[2, 2, 2, 2], [4, 4, 8, 0], [2, 0, 2, 4], [0, 0, 0, 0]]);
  const r = nm.mover(j, 'esquerda', semSorte);
  assert.ok(r);
  const g = tabela(j);
  assert.deepEqual(g[0], [4, 4, 0, 0]);
  assert.deepEqual(g[1], [8, 8, 0, 0]);
  assert.deepEqual(g[2], [4, 4, 0, 0]);
  assert.equal(r.pontos, 4 + 4 + 8 + 4);
  assert.equal(j.pontos, 20);
  assert.equal(r.juntados.length, 4);
  assert.equal(j.blocos.length, 7, '6 que sobraram + 1 novo');
});

test('para a direita, quem está na ponta junta primeiro', () => {
  const j = montar([[2, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  nm.mover(j, 'direita', () => 0);
  assert.deepEqual(tabela(j)[0].slice(1), [0, 2, 4]);
});

test('para cima e para baixo', () => {
  const j = montar([[2, 0, 0], [2, 0, 0], [4, 0, 0]]);
  nm.mover(j, 'baixo', semSorte);
  let g = tabela(j); assert.equal(g[2][0], 4); assert.equal(g[1][0], 4);
  const k = montar([[0, 0, 0], [8, 0, 0], [8, 0, 0]]);
  nm.mover(k, 'cima', semSorte);
  g = tabela(k); assert.equal(g[0][0], 16);
});

test('jogada que não mexe nada não vale e não cria bloco', () => {
  const j = montar([[2, 4, 0], [0, 0, 0], [0, 0, 0]]);
  assert.equal(nm.mover(j, 'esquerda'), null);
  assert.equal(nm.mover(j, 'cima'), null);
  assert.equal(j.blocos.length, 2);
});

test('fim de jogo sem movimentos e meta', () => {
  const cheio = montar([[2, 4, 2], [4, 2, 4], [2, 4, 2]]);
  assert.equal(nm.podeMover(cheio), false);
  for (const d of Object.keys(nm.DIRECOES)) assert.equal(nm.mover(cheio, d), null);
  const junta = montar([[2, 2, 4], [4, 8, 16], [32, 64, 128]]);
  assert.equal(nm.podeMover(junta), true);
  const quase = montar([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  assert.equal(nm.chegouNaMeta(quase), false);
  nm.mover(quase, 'esquerda');
  assert.equal(nm.chegouNaMeta(quase), true);
  assert.equal(nm.maior(quase), 2048);
});

test('jogando ao acaso, os ids continuam únicos e a partida termina', () => {
  const rng = semente(11);
  const j = nm.novoJogo('dificil', rng);
  const dirs = Object.keys(nm.DIRECOES);
  let voltas = 0;
  while (nm.podeMover(j) && voltas++ < 5000) {
    nm.mover(j, dirs[Math.floor(rng() * 4)], rng);
    const ids = j.blocos.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length);
    const casas = j.blocos.map((b) => b.r * j.n + b.c);
    assert.equal(new Set(casas).size, casas.length);
  }
  assert.equal(nm.podeMover(j), false);
});
