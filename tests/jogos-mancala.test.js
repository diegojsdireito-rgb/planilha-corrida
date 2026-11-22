import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mc from '../jogos/src/mancala.js';
import { semente } from '../jogos/src/pintar-formas.js';

const total = (t) => t.reduce((a, b) => a + b, 0);

test('começa com 4 sementes em cada casinha e depósitos vazios', () => {
  const t = mc.novo();
  assert.equal(total(t), 48);
  assert.equal(t[6], 0);
  assert.equal(t[13], 0);
  assert.deepEqual(mc.jogadas(t, 0), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(mc.jogadas(t, 1), [7, 8, 9, 10, 11, 12]);
});

test('semeia no sentido anti-horário e joga de novo ao cair no depósito', () => {
  const r = mc.semear(mc.novo(), 0, 2);
  assert.deepEqual(r.caminho, [3, 4, 5, 6]);
  assert.ok(r.deNovo);
  assert.equal(r.t[2], 0);
  assert.equal(r.t[6], 1);
  assert.throws(() => mc.semear(mc.novo(), 0, 8));
});

test('pula o depósito do adversário', () => {
  const t = mc.novo();
  t[5] = 10;
  const r = mc.semear(t, 0, 5);
  assert.ok(!r.caminho.includes(13));
  assert.deepEqual(r.caminho, [6, 7, 8, 9, 10, 11, 12, 0, 1, 2]);
  const u = mc.novo();
  u[12] = 3;
  assert.deepEqual(mc.semear(u, 1, 12).caminho, [13, 0, 1]);
});

test('última semente em casa vazia própria captura as da frente', () => {
  const t = mc.novo();
  t[0] = 1; t[1] = 0; // a frente da casa 1 é a 11
  const r = mc.semear(t, 0, 0);
  assert.deepEqual(r.captura, { casa: 1, frente: 11, qtd: 5 });
  assert.equal(r.t[6], 5);
  assert.equal(r.t[1], 0);
  assert.equal(r.t[11], 0);
  assert.equal(total(r.t), total(t));
});

test('quando um lado esvazia, o outro recolhe as sementes e o jogo acaba', () => {
  const t = Array(14).fill(0);
  t[5] = 1; t[6] = 20; t[13] = 20; t[7] = 3; t[9] = 4;
  const r = mc.semear(t, 0, 5);
  assert.ok(r.fim);
  assert.deepEqual(r.varrida, [0, 7]);
  assert.deepEqual(mc.resultado(r.t), { vencedor: 1, pontos: [21, 27] });
});

function partida(nivel0, nivel1, rnd) {
  let t = mc.novo();
  let vez = 0;
  let passos = 0;
  while (!mc.acabou(t)) {
    const c = mc.jogadaRobo(t, vez, vez === 0 ? nivel0 : nivel1, rnd);
    assert.ok(mc.jogadas(t, vez).includes(c), 'jogada válida');
    const r = mc.semear(t, vez, c);
    assert.equal(total(r.t), 48);
    t = r.t;
    if (!r.deNovo) vez = 1 - vez;
    assert.ok(++passos < 500);
  }
  return mc.resultado(t);
}

test('o robô faz jogadas válidas em todos os níveis até o fim', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) for (let s = 1; s <= 4; s++) partida('facil', nivel, semente(s * 11));
});

test('o difícil ganha do fácil e do guloso quase sempre', () => {
  let vit = 0; const n = 12;
  for (let s = 1; s <= n; s++) if (partida(s % 2 ? 'facil' : 'medio', 'dificil', semente(s * 13)).vencedor === 1) vit++;
  assert.ok(vit >= n - 3, `venceu ${vit} de ${n}`);
});

test('o robô difícil pensa rápido', () => {
  const t0 = performance.now();
  mc.jogadaRobo(mc.novo(), 1, 'dificil');
  assert.ok(performance.now() - t0 < 1500);
});
