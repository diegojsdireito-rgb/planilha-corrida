import test from 'node:test';
import assert from 'node:assert/strict';
import { classeDoImc, erroDoPeso, imcDe, registrarPeso, resumoDoPeso } from '../src/peso.js';

test('o IMC usa peso e altura e segue as faixas da OMS', () => {
  assert.equal(imcDe(80, 178), 25.2);
  assert.equal(imcDe(null, 178), null);
  assert.equal(classeDoImc(18.4), 'Abaixo do peso');
  assert.equal(classeDoImc(24.9), 'Peso normal');
  assert.equal(classeDoImc(25), 'Sobrepeso');
  assert.equal(classeDoImc(30), 'Obesidade');
  assert.equal(classeDoImc(null), null);
});

test('registros ficam em ordem, e a mesma data substitui', () => {
  let lista = registrarPeso([], { data: '2026-11-07', kg: 80 });
  lista = registrarPeso(lista, { data: '2026-10-01', kg: 82 });
  lista = registrarPeso(lista, { data: '2026-11-07', kg: 79.5 });
  assert.deepEqual(lista, [{ data: '2026-10-01', kg: 82 }, { data: '2026-11-07', kg: 79.5 }]);
  assert.deepEqual(registrarPeso(undefined, { data: '2026-11-07', kg: 80 }), [{ data: '2026-11-07', kg: 80 }]);
});

test('o peso e a data são conferidos', () => {
  const hoje = '2026-11-07';
  assert.equal(erroDoPeso({ kg: 80, data: hoje }, hoje), null);
  assert.match(erroDoPeso({ kg: 80, data: '' }, hoje), /data/);
  assert.match(erroDoPeso({ kg: 80, data: '2026-11-08' }, hoje), /futura/);
  assert.match(erroDoPeso({ kg: 5, data: hoje }, hoje), /Confira/);
  assert.match(erroDoPeso({ kg: null, data: hoje }, hoje), /Confira/);
});

test('o resumo mostra o atual e a mudança desde o primeiro registro', () => {
  const r = resumoDoPeso([{ data: '2026-10-01', kg: 82 }, { data: '2026-11-07', kg: 79.5 }], 178);
  assert.equal(r.atual.kg, 79.5);
  assert.equal(r.imc, 25.1);
  assert.equal(r.classe, 'Sobrepeso');
  assert.equal(r.variacaoKg, -2.5);
  assert.equal(r.variacaoImc, -0.8);
  assert.equal(resumoDoPeso([{ data: '2026-10-01', kg: 82 }], 178).variacaoKg, null);
  assert.equal(resumoDoPeso([], 178), null);
});
