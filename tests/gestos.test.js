import test from 'node:test';
import assert from 'node:assert/strict';
import { abaDoGesto, interpretarGesto } from '../src/gestos.js';

test('deslize longo e horizontal define a direção', () => {
  assert.equal(interpretarGesto({ dx: -120, dy: 10, ms: 600 }), 'esquerda');
  assert.equal(interpretarGesto({ dx: 120, dy: -10, ms: 600 }), 'direita');
});

test('deslize curto e lento não conta, mas o rápido conta', () => {
  assert.equal(interpretarGesto({ dx: 40, dy: 0, ms: 500 }), null);
  assert.equal(interpretarGesto({ dx: 40, dy: 0, ms: 60 }), 'direita');
  assert.equal(interpretarGesto({ dx: 20, dy: 0, ms: 10 }), null);
});

test('movimento diagonal ou vertical é rolagem, não gesto', () => {
  assert.equal(interpretarGesto({ dx: 90, dy: 80, ms: 300 }), null);
  assert.equal(interpretarGesto({ dx: 5, dy: 300, ms: 200 }), null);
});

test('abas seguem a ordem e param nas pontas', () => {
  const abas = ['hoje', 'plano', 'revisao', 'ajustes'];
  assert.equal(abaDoGesto(abas, 'hoje', 'esquerda'), 'plano');
  assert.equal(abaDoGesto(abas, 'plano', 'direita'), 'hoje');
  assert.equal(abaDoGesto(abas, 'hoje', 'direita'), null);
  assert.equal(abaDoGesto(abas, 'ajustes', 'esquerda'), null);
});
