import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as dm from '../jogos/src/domino.js';
import { semente } from '../jogos/src/pintar-formas.js';

const chave = ([a, b]) => `${Math.min(a, b)}${Math.max(a, b)}`;

function lance(e, j, nivel, rnd) {
  const l = dm.jogadaRobo(e, j, nivel, rnd);
  if (l) return dm.jogar(e, j, l.i, l.lado);
  if (dm.podeComprar(e, j)) return dm.comprar(e, j);
  return dm.passar(e, j);
}

test('28 pedras diferentes, 7 para cada um e 14 para comprar', () => {
  assert.equal(dm.todasPedras().length, 28);
  const e = dm.novoJogo(0, semente(5));
  assert.equal(e.maos[0].length, 7);
  assert.equal(e.maos[1].length, 7);
  assert.equal(e.monte.length, 14);
  const todas = new Set([...e.maos[0], ...e.maos[1], ...e.monte].map(chave));
  assert.equal(todas.size, 28);
});

test('encaixe pelas pontas e escolha do lado', () => {
  let e = dm.novoJogo(0, semente(1));
  e.maos = [[[3, 5], [5, 6], [1, 2]], [[2, 2], [0, 4]]];
  e = dm.jogar(e, 0, 0, 'd');
  assert.deepEqual(dm.pontas(e), [3, 5]);
  assert.equal(e.vez, 1);
  assert.deepEqual(dm.jogadas(e, 1), []);
  e.maos[1].push([3, 3]);
  assert.deepEqual(dm.jogadas(e, 1), [{ i: 2, lado: 'e' }]);
  e = dm.jogar(e, 1, 2, 'e');
  assert.deepEqual(e.mesa, [[3, 3], [3, 5]]);
  assert.equal(e.centro, 1);
  // [5, 6] só encaixa na direita; vira para o 5 ficar encostado.
  assert.deepEqual(dm.encaixes(e, [5, 6]), ['d']);
  e = dm.jogar(e, 0, 0, 'd');
  assert.deepEqual(e.mesa.at(-1), [5, 6]);
  assert.deepEqual(dm.pontas(e), [3, 6]);
  assert.throws(() => dm.jogar(e, 1, 0, 'd'));
  // Pedra que serve nas duas pontas diferentes pede escolha.
  const f = { ...e, maos: [[[3, 6]], [[1, 1]]], vez: 0 };
  assert.ok(dm.precisaEscolher(f, [3, 6]));
  const g = dm.jogar(f, 0, 0, 'e');
  assert.deepEqual(g.mesa[0], [6, 3]);
  assert.equal(g.fim.tipo, 'batida');
  assert.equal(g.fim.vencedor, 0);
});

test('pontas iguais não pedem escolha', () => {
  const e = { ...dm.novoJogo(0, semente(9)), mesa: [[4, 2], [2, 4]], centro: 0 };
  assert.ok(!dm.precisaEscolher(e, [4, 1]));
  assert.equal(dm.ladoAutomatico(e, [4, 1]), 'e');
});

test('compra só sem jogada, passe só sem compra, e mesa trancada', () => {
  let e = dm.novoJogo(0, semente(2));
  e.mesa = [[6, 6]]; e.centro = 0;
  e.maos = [[[0, 1]], [[0, 2], [1, 3]]];
  e.monte = [[2, 3]];
  assert.ok(dm.podeComprar(e, 0));
  assert.ok(!dm.devePassar(e, 0));
  assert.throws(() => dm.passar(e, 0));
  e = dm.comprar(e, 0);
  assert.equal(e.maos[0].length, 2);
  assert.deepEqual(e.faltas[0], [6]);
  assert.ok(dm.devePassar(e, 0));
  e = dm.passar(e, 0);
  assert.equal(e.vez, 1);
  assert.ok(!e.fim);
  e = dm.passar(e, 1);
  assert.equal(e.fim.tipo, 'trancada');
  assert.deepEqual(e.fim.pontos, [6, 6]);
  assert.equal(e.fim.vencedor, null);
});

test('mesa trancada: vence quem tem menos pontos', () => {
  let e = dm.novoJogo(0, semente(3));
  e.mesa = [[6, 6]]; e.centro = 0; e.monte = [];
  e.maos = [[[0, 1]], [[4, 5]]];
  e = dm.passar(dm.passar(e, 0), 1);
  assert.equal(e.fim.vencedor, 0);
});

test('o robô sempre faz jogada válida e partidas inteiras terminam', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) {
    for (let s = 1; s <= 30; s++) {
      const rnd = semente(s * 17);
      let e = dm.novoJogo(s % 2, rnd);
      let passos = 0;
      while (!e.fim) {
        const j = e.vez;
        const l = dm.jogadaRobo(e, j, j === 1 ? nivel : 'medio', rnd);
        if (l) assert.ok(dm.jogadas(e, j).some((o) => o.i === l.i && o.lado === l.lado));
        e = lance(e, j, j === 1 ? nivel : 'medio', semente(s + passos));
        assert.ok(++passos < 200);
      }
      const total = e.mesa.length + e.maos[0].length + e.maos[1].length + e.monte.length;
      assert.equal(total, 28);
      for (let k = 1; k < e.mesa.length; k++) assert.equal(e.mesa[k - 1][1], e.mesa[k][0], 'pedras vizinhas encaixam');
    }
  }
});

test('robô difícil ganha mais que o fácil contra o mesmo adversário', () => {
  const vitorias = { facil: 0, dificil: 0 };
  for (const nivel of ['facil', 'dificil']) {
    for (let s = 1; s <= 200; s++) {
      const rnd = semente(s * 7 + 1);
      let e = dm.novoJogo(s % 2, rnd);
      while (!e.fim) e = lance(e, e.vez, e.vez === 1 ? nivel : 'facil', rnd);
      if (e.fim.vencedor === 1) vitorias[nivel]++;
    }
  }
  assert.ok(vitorias.dificil > vitorias.facil, JSON.stringify(vitorias));
});

test('a mesa dobra nas bordas sem pedras encavaladas', () => {
  const largura = 14;
  for (let s = 1; s <= 40; s++) {
    const rnd = semente(s * 3);
    let e = dm.novoJogo(0, rnd);
    while (!e.fim) {
      e = lance(e, e.vez, 'facil', rnd);
      const pos = dm.arrumarMesa(e.mesa, e.centro, largura);
      assert.equal(pos.length, e.mesa.length);
      pos.forEach((p, k) => {
        assert.ok(p.x >= 0 && p.x + p.w <= largura, 'dentro da mesa');
        assert.deepEqual([p.a, p.b].sort(), [...e.mesa[k]].sort());
        for (let m = 0; m < k; m++) {
          const q = pos[m];
          const sobrepoe = p.x < q.x + q.w - 1e-9 && q.x < p.x + p.w - 1e-9 && p.y < q.y + q.h - 1e-9 && q.y < p.y + p.h - 1e-9;
          assert.ok(!sobrepoe, `pedras ${m} e ${k} encavaladas`);
        }
      });
    }
  }
});
