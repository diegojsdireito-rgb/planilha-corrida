import test from 'node:test';
import assert from 'node:assert/strict';
import { abaDoGesto, distanciaDaPuxada, interpretarGesto, interpretarPuxada, puxadaCompleta } from '../src/gestos.js';

test('puxar para baixo só começa com movimento vertical claro', () => {
  assert.equal(interpretarPuxada({ dx: 0, dy: 3 }), 'decidir');
  assert.equal(interpretarPuxada({ dx: 2, dy: 30 }), 'puxar');
  assert.equal(interpretarPuxada({ dx: 0, dy: -5 }), 'desistir');
});

test('movimento lateral fica com a troca de aba, nunca com a puxada', () => {
  assert.equal(interpretarPuxada({ dx: 40, dy: 12 }), 'desistir');
  assert.equal(interpretarPuxada({ dx: -11, dy: 11 }), 'desistir');
});

test('a puxada tem resistência, teto e só atualiza depois do limite', () => {
  assert.equal(distanciaDaPuxada(100), 45);
  assert.equal(distanciaDaPuxada(-50), 0);
  assert.equal(distanciaDaPuxada(2000), 110);
  assert.equal(puxadaCompleta(100), false);
  assert.equal(puxadaCompleta(160), true);
});

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
