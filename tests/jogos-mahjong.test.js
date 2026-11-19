import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mj from '../jogos/src/mahjong.js';
import { semente } from '../jogos/src/pintar-formas.js';

test('mesas têm o número certo de peças e sempre um par para começar', () => {
  for (const [nivel, n] of [['facil', 72], ['medio', 104], ['dificil', 144]]) {
    for (let s = 1; s <= 5; s++) {
      const j = mj.novoJogo(nivel, semente(s * 31));
      assert.equal(j.pecas.length, n);
      const conta = {};
      for (const p of j.pecas) conta[mj.grupo(p.k)] = (conta[mj.grupo(p.k)] ?? 0) + 1;
      for (const c of Object.values(conta)) assert.equal(c % 2, 0);
      assert.ok(mj.dica(j.pecas), `${nivel} começa com jogada`);
    }
  }
});

test('o jogo completo usa as 144 peças clássicas', () => {
  const j = mj.novoJogo('dificil', semente(3));
  const conta = {};
  for (const p of j.pecas) conta[p.k] = (conta[p.k] ?? 0) + 1;
  for (const k of mj.COMUNS) assert.equal(conta[k], 4, k);
  for (const k of [...mj.FLORES, ...mj.ESTACOES]) assert.equal(conta[k], 1, k);
});

test('peça livre: nada em cima e um lado vazio', () => {
  const p = (x, y, z, k = 'b1') => ({ x, y, z, k, fora: false });
  const a = p(0, 0, 0); const b = p(2, 0, 0); const c = p(4, 0, 0); const topo = p(1, 0, 1);
  const pecas = [a, b, c, topo];
  assert.equal(mj.livre(a, pecas), false, 'coberta pela de cima');
  assert.equal(mj.livre(b, pecas), false, 'coberta e presa dos dois lados');
  assert.equal(mj.livre(c, pecas), true);
  topo.fora = true;
  assert.equal(mj.livre(a, pecas), true);
  assert.equal(mj.livre(b, pecas), false, 'vizinhos dos dois lados');
});

test('flores combinam entre si, estações também', () => {
  assert.ok(mj.combinam('f1', 'f4'));
  assert.ok(mj.combinam('s2', 's3'));
  assert.ok(!mj.combinam('f1', 's1'));
  assert.ok(mj.combinam('d5', 'd5'));
  assert.ok(!mj.combinam('d5', 'b5'));
});

test('dá para limpar a mesa tirando pares e embaralhando quando trava', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) {
    const sorteio = semente(nivel.length * 7);
    const j = mj.novoJogo(nivel, sorteio);
    let embaralhadas = 0;
    while (mj.restantes(j.pecas)) {
      const par = mj.dica(j.pecas);
      if (!par) { mj.embaralhar(j.pecas, sorteio); embaralhadas++; assert.ok(embaralhadas < 30); continue; }
      par[0].fora = true; par[1].fora = true;
    }
    assert.equal(mj.restantes(j.pecas), 0);
  }
});

test('embaralhar mantém as mesmas peças', () => {
  const j = mj.novoJogo('medio', semente(9));
  for (let k = 0; k < 10; k++) { const par = mj.dica(j.pecas); par[0].fora = true; par[1].fora = true; }
  const antes = j.pecas.filter((p) => !p.fora).map((p) => p.k).sort().join();
  mj.embaralhar(j.pecas, semente(2));
  assert.equal(j.pecas.filter((p) => !p.fora).map((p) => p.k).sort().join(), antes);
  assert.ok(mj.dica(j.pecas));
});
