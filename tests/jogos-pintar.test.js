import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regiao, corNoTraco, misturar, terminados, CORES, FERRAMENTAS, TIPOS_COR } from '../jogos/src/pintar.js';
import { DESENHOS, svgDoDesenho } from '../jogos/src/pintar-desenhos.js';

// Folha 10 × 10 com uma parede vertical na coluna 5.
function folha() {
  const w = 10; const h = 10; const p = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) p[y * w + 5] = 1;
  return { w, h, p };
}

test('o balde pinta só o lado tocado e passa por baixo da linha', () => {
  const { w, h, p } = folha();
  const r = regiao(p, w, h, 1, 1, 1);
  assert.equal(r.total, 50);
  assert.equal(r.mascara[0], 1);
  assert.equal(r.mascara[5], 1, 'alarga por baixo da linha');
  assert.equal(r.mascara[6], 0, 'não vaza para o outro lado');
  assert.deepEqual([r.x1, r.x2], [0, 5]);
});

test('o balde não faz nada em cima da linha nem fora da folha', () => {
  const { w, h, p } = folha();
  assert.equal(regiao(p, w, h, 5, 3), null);
  assert.equal(regiao(p, w, h, -1, 3), null);
  assert.equal(regiao(p, w, h, 3, 10), null);
});

test('região fechada dentro de outra', () => {
  const w = 9; const h = 9; const p = new Uint8Array(w * h);
  for (let k = 2; k <= 6; k++) { p[2 * w + k] = 1; p[6 * w + k] = 1; p[k * w + 2] = 1; p[k * w + 6] = 1; }
  const dentro = regiao(p, w, h, 4, 4, 0);
  assert.equal(dentro.total, 9);
  const fora = regiao(p, w, h, 0, 0, 0);
  assert.equal(fora.total, 81 - 16 - 9);
});

test('cores do traço', () => {
  assert.equal(corNoTraco('#ff0000', 'normal', 100), '#ff0000');
  assert.notEqual(corNoTraco('#ff0000', 'arcoiris', 0), corNoTraco('#ff0000', 'arcoiris', 200));
  assert.equal(misturar('#000000', '#ffffff', 0.5), '#808080');
  assert.match(corNoTraco('#1e63d6', 'degrade', 50), /^#[0-9a-f]{6}$/);
});

test('desenhos e opções', () => {
  assert.ok(DESENHOS.length >= 12);
  assert.equal(new Set(DESENHOS.map((d) => d.id)).size, DESENHOS.length);
  for (const d of DESENHOS) assert.match(svgDoDesenho(d), /^<svg[\s\S]*<\/svg>$/);
  assert.ok(CORES.length >= 20 && FERRAMENTAS.length >= 8 && TIPOS_COR.length >= 4);
});

test('conta desenhos diferentes terminados', () => {
  const h = [{ j: 'pintar', r: 'concluida', desenho: 'gato' }, { j: 'pintar', r: 'concluida', desenho: 'gato' }, { j: 'pintar', r: 'concluida', desenho: 'casa' }, { j: 'velha', r: 'vitoria' }];
  assert.equal(terminados(h), 2);
});
