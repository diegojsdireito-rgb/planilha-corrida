import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as bt from '../jogos/src/batalha.js';
import { semente } from '../jogos/src/pintar-formas.js';

test('sortear frota: todos os barcos cabem, sem sobreposição', () => {
  for (let s = 1; s <= 50; s++) {
    const barcos = bt.sortearFrota(semente(s));
    assert.deepEqual(barcos.map((b) => b.tam), bt.FROTA.map((f) => f.tam));
    const todas = barcos.flatMap((b) => bt.celulas(b));
    assert.equal(new Set(todas).size, todas.length);
    assert.ok(barcos.every((b) => bt.dentro(b)));
    barcos.forEach((b, k) => assert.ok(bt.cabe(barcos, b, k)));
  }
});

test('cabe: não sai da grade nem passa por cima', () => {
  const barcos = [{ r: 0, c: 0, tam: 4, vert: false }];
  assert.equal(bt.cabe(barcos, { r: 0, c: 5, tam: 4, vert: false }), false);
  assert.equal(bt.cabe(barcos, { r: 0, c: 3, tam: 2, vert: true }), false);
  assert.equal(bt.cabe(barcos, { r: 1, c: 0, tam: 3, vert: false }), true);
  assert.equal(bt.cabe(barcos, { r: 0, c: 1, tam: 4, vert: false }, 0), true);
});

test('atirar: água, acerto, afundou e fim de jogo', () => {
  const barcos = [{ r: 0, c: 0, tam: 2, vert: false }, { r: 2, c: 2, tam: 3, vert: true }];
  const t = bt.novosTiros();
  assert.equal(bt.atirar(barcos, t, 7).resultado, 'agua');
  assert.equal(bt.atirar(barcos, t, 7).resultado, 'repetido');
  assert.equal(bt.atirar(barcos, t, 0).resultado, 'acerto');
  const r = bt.atirar(barcos, t, 1);
  assert.equal(r.resultado, 'afundou');
  assert.equal(r.barco, 0);
  assert.equal(t[0], 'afundado');
  assert.deepEqual(bt.restantes(barcos, t), [3]);
  assert.equal(bt.todosAfundados(barcos, t), false);
  for (const i of bt.celulas(barcos[1])) bt.atirar(barcos, t, i);
  assert.equal(bt.todosAfundados(barcos, t), true);
});

function partida(nivel, s) {
  const rnd = semente(s);
  const barcos = bt.sortearFrota(rnd);
  const t = bt.novosTiros();
  let tiros = 0;
  while (!bt.todosAfundados(barcos, t)) {
    const i = bt.tiroRobo(t, bt.restantes(barcos, t), nivel, rnd);
    assert.ok(Number.isInteger(i) && i >= 0 && i < bt.N * bt.N, 'casa válida');
    assert.equal(t[i], null, 'não repete tiro');
    bt.atirar(barcos, t, i);
    tiros++;
    assert.ok(tiros <= bt.N * bt.N);
  }
  return tiros;
}

test('robô sempre atira em casa nova e termina a partida, e o difícil é mais esperto', () => {
  const media = {};
  for (const nivel of ['facil', 'medio', 'dificil']) {
    let soma = 0;
    for (let s = 1; s <= 40; s++) soma += partida(nivel, s * 7 + 1);
    media[nivel] = soma / 40;
  }
  assert.ok(media.medio < media.facil, JSON.stringify(media));
  assert.ok(media.dificil < media.medio, JSON.stringify(media));
});

test('médio segue a fila de acertos', () => {
  const t = bt.novosTiros();
  t[3 * 8 + 3] = 'acerto'; t[3 * 8 + 4] = 'acerto';
  for (let s = 0; s < 20; s++) {
    const i = bt.tiroRobo(t, [4], 'medio', semente(s));
    assert.ok([3 * 8 + 2, 3 * 8 + 5].includes(i), String(i));
  }
});
