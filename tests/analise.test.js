import test from 'node:test';
import assert from 'node:assert/strict';
import { compararComPrevisto, limitesDasZonas, temposPorZona, vereditoDoTreino } from '../src/analise.js';

const ritmos = { leve: { de: 353, ate: 388 }, maratona: 314, meia: 302, limiar: 294, intervalado: 265 };
const velocidadeDe = (segPorKm) => 1000 / segPorKm;
const repetir = (segPorKm, n) => Array(n).fill(velocidadeDe(segPorKm));
const perto = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} perto de ${b}`);

test('cada pace cai na sua zona, com tolerância de 5 s/km nas pontas do leve', () => {
  const { seg } = temposPorZona({
    velocidade: [...repetir(420, 10), ...repetir(392, 2), ...repetir(350, 20), ...repetir(310, 3), ...repetir(290, 4), ...repetir(270, 5)],
    ritmos,
  });
  assert.deepEqual(seg, { lento: 10, leve: 22, maratona: 3, limiar: 4, intervalado: 5 });
});

test('parada e salto de GPS não contam como ritmo', () => {
  const r = temposPorZona({ velocidade: [0, 0.5, 30, null, velocidadeDe(370)], ritmos });
  assert.equal(r.total, 1);
  assert.equal(r.parado, 2);
});

test('usa o tempo real entre amostras e limita lacunas de gravação', () => {
  const r = temposPorZona({ tempo: [0, 5, 500], velocidade: repetir(370, 3), ritmos });
  assert.equal(r.seg.leve, 16); // 1 inicial + 5 + no máximo 10 da lacuna
});

test('anaeróbico estimado é o tempo no pace de intervalado ou mais rápido', () => {
  const r = temposPorZona({ velocidade: [...repetir(265, 4), ...repetir(250, 6), ...repetir(275, 10)], ritmos });
  assert.equal(r.anaerobico, 10);
  assert.equal(r.seg.intervalado, 20);
  assert.ok(limitesDasZonas(ritmos).anaerobico === 265);
});

test('corrida leve toda no ritmo fica 100% na meta', () => {
  const r = compararComPrevisto({ lento: 0, leve: 100, maratona: 0, limiar: 0, intervalado: 0 }, [{ chave: 'leve', fracao: 1 }]);
  assert.deepEqual(r, { dentro: 1, acima: 0, abaixo: 0 });
});

test('corrida leve forte demais conta acima; devagar demais conta abaixo', () => {
  const plano = [{ chave: 'leve', fracao: 1 }];
  const forte = compararComPrevisto({ lento: 0, leve: 70, maratona: 20, limiar: 10, intervalado: 0 }, plano);
  perto(forte.dentro, 0.7);
  perto(forte.acima, 0.3);
  assert.equal(forte.abaixo, 0);
  const devagar = compararComPrevisto({ lento: 40, leve: 60, maratona: 0, limiar: 0, intervalado: 0 }, plano);
  perto(devagar.abaixo, 0.4);
  assert.equal(devagar.acima, 0);
});

test('trote de recuperação previsto conta junto com o leve', () => {
  const plano = [{ chave: 'recuperacao', fracao: 0.1 }, { chave: 'leve', fracao: 0.5 }, { chave: 'limiar', fracao: 0.4 }];
  const r = compararComPrevisto({ lento: 0, leve: 60, maratona: 0, limiar: 40, intervalado: 0 }, plano);
  perto(r.dentro, 1);
});

test('tiro que não chegou ao limiar conta abaixo, e as partes somam 100%', () => {
  const plano = [{ chave: 'leve', fracao: 0.6 }, { chave: 'limiar', fracao: 0.4 }];
  const r = compararComPrevisto({ lento: 0, leve: 60, maratona: 30, limiar: 10, intervalado: 0 }, plano);
  perto(r.dentro, 0.7);
  perto(r.abaixo, 0.3);
  perto(r.dentro + r.acima + r.abaixo, 1);
});

test('sem plano ou sem tempo não há comparação', () => {
  assert.equal(compararComPrevisto({ lento: 0, leve: 10, maratona: 0, limiar: 0, intervalado: 0 }, []), null);
  assert.equal(compararComPrevisto({ lento: 0, leve: 0, maratona: 0, limiar: 0, intervalado: 0 }, [{ chave: 'leve', fracao: 1 }]), null);
});

test('o veredito segue as faixas e aponta a tendência', () => {
  assert.equal(vereditoDoTreino({ dentro: 0.85, acima: 0.1, abaixo: 0.05 }).titulo, 'Treino dentro da meta');
  assert.equal(vereditoDoTreino({ dentro: 0.7, acima: 0.3, abaixo: 0 }).titulo, 'Parcialmente dentro da meta');
  assert.equal(vereditoDoTreino({ dentro: 0.3, acima: 0, abaixo: 0.7 }).titulo, 'Bem diferente do previsto');
  assert.match(vereditoDoTreino({ dentro: 0.7, acima: 0.3, abaixo: 0 }).tendencia, /mais forte/);
  assert.match(vereditoDoTreino({ dentro: 0.3, acima: 0, abaixo: 0.7 }).tendencia, /mais devagar/);
  assert.equal(vereditoDoTreino({ dentro: 0.95, acima: 0.03, abaixo: 0.02 }).tendencia, null);
});
