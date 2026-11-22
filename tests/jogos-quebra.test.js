import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as qb from '../jogos/src/quebra.js';
import { semente } from '../jogos/src/pintar-formas.js';

test('tamanhos de 9 a 48 peças', () => {
  assert.deepEqual(qb.TAMANHOS.map((t) => t.n), [9, 16, 25, 36, 48]);
  for (const t of qb.TAMANHOS) assert.equal(t.colunas * t.linhas, t.n);
  assert.equal(qb.tamanhoDe(99).n, 9);
});

test('abas e encaixes combinam entre vizinhas; a moldura é reta', () => {
  for (const t of qb.TAMANHOS) {
    const b = qb.gerarBordas(t.colunas, t.linhas, semente(t.n));
    for (let i = 0; i < t.n; i++) {
      const [cima, dir, baixo, esq] = qb.ladosDaPeca(b, t.colunas, t.linhas, i);
      const c = i % t.colunas; const l = Math.floor(i / t.colunas);
      assert.equal(cima === 0, l === 0);
      assert.equal(esq === 0, c === 0);
      assert.equal(dir === 0, c === t.colunas - 1);
      assert.equal(baixo === 0, l === t.linhas - 1);
      if (c < t.colunas - 1) assert.equal(dir, -qb.ladosDaPeca(b, t.colunas, t.linhas, i + 1)[3]);
      if (l < t.linhas - 1) assert.equal(baixo, -qb.ladosDaPeca(b, t.colunas, t.linhas, i + t.colunas)[0]);
    }
  }
});

test('contorno da peça: fechado, com uma aba por lado não reto, e dentro da folga', () => {
  const d = qb.caminho([1, -1, 1, 0], 100, 100);
  assert.match(d, /^M0 0 /);
  assert.match(d, / Z$/);
  assert.equal((d.match(/C/g) ?? []).length, 12);
  const nums = d.replace(/[MLCZ]/g, ' ').trim().split(/\s+/).map(Number);
  assert.ok(nums.every(Number.isFinite));
  assert.ok(Math.min(...nums) >= -100 * qb.MARGEM && Math.max(...nums) <= 100 + 100 * qb.MARGEM);
  // aba para fora no topo sobe acima de 0; encaixe à direita entra (x < 100)
  assert.ok(Math.min(...nums.filter((_, k) => k % 2 === 1)) < 0);
  assert.equal(qb.caminho([0, 0, 0, 0], 10, 10), 'M0 0 L10 0 L10 10 L0 10 L0 0 Z');
});

test('peças começam espalhadas na bandeja, fora do quadro', () => {
  for (const t of qb.TAMANHOS) {
    const e = qb.novoJogo(t.n, 'gato', semente(t.n + 1));
    assert.equal(e.pos.length, t.n);
    for (const p of e.pos) {
      assert.equal(p.ok, false);
      assert.ok(p.y > t.linhas - 0.01 && p.y <= t.linhas + qb.bandejaDe(t), `y=${p.y}`);
      assert.ok(p.x >= -0.6 && p.x <= t.colunas - 0.4);
    }
    assert.equal(qb.encaixadas(e), 0);
  }
});

test('peça solta perto do lugar gruda; longe, fica onde foi solta', () => {
  const e = qb.novoJogo(16, 'casa', semente(2));
  assert.equal(qb.soltar(e, 5, 2.5, 2.5), false);
  assert.deepEqual(e.pos[5], { x: 2.5, y: 2.5, ok: false });
  assert.equal(e.ordem.at(-1), 5, 'a peça solta fica por cima');
  assert.equal(qb.soltar(e, 5, 1.2, 0.85), true);
  assert.deepEqual(e.pos[5], { x: 1, y: 1, ok: true });
  assert.equal(qb.soltar(e, 5, 3, 3), false, 'peça encaixada não sai mais');
  assert.deepEqual(e.pos[5], { x: 1, y: 1, ok: true });
  qb.soltar(e, 6, 99, -99);
  assert.ok(e.pos[6].x <= 4 && e.pos[6].y >= -0.6, 'não some da mesa');
});

test('montar todas as peças completa o quebra-cabeça; a dica aponta sempre uma peça solta', () => {
  for (const t of qb.TAMANHOS) {
    const e = qb.novoJogo(t.n, 'dino', semente(t.n * 3));
    for (let k = 0; k < t.n; k++) {
      const d = qb.dica(e);
      assert.ok(d && !e.pos[d.peca].ok);
      assert.equal(qb.soltar(e, d.peca, d.x + 0.1, d.y - 0.1), true);
    }
    assert.ok(qb.completo(e));
    assert.equal(qb.dica(e), null);
  }
});

test('beiradas: só cantos e bordas têm lado reto', () => {
  const e = qb.novoJogo(25, 'gato', semente(1));
  const beiradas = [...Array(25).keys()].filter((i) => qb.ehBeirada(e, i));
  assert.equal(beiradas.length, 16);
});
