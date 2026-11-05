import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adesaoDoPeriodo,
  calcularRecordes,
  compararPeriodos,
  csvDasCorridas,
  registrarNivel,
  resumoSemanal,
  zonasDoPeriodo,
} from '../src/estatisticas.js';

const HOJE = '2026-11-18'; // quarta

const corrida = (data, km, seg, extra = {}) => ({ data, km, seg, prova: false, fcMedia: null, ...extra });

test('resumo semanal agrupa por semana de segunda a domingo', () => {
  const lista = resumoSemanal({
    atividades: [
      corrida('2026-11-16', 5, 1800),
      corrida('2026-11-15', 8, 3200), // domingo: semana anterior
      corrida('2026-11-09', 2, 800),
    ],
    plano: { sessoes: [{ data: '2026-11-17', distanciaKm: 6 }, { data: '2026-11-22', distanciaKm: 10 }] },
    hoje: HOJE,
    semanas: 3,
  });
  assert.deepEqual(lista.map((s) => s.segunda), ['2026-11-02', '2026-11-09', '2026-11-16']);
  assert.deepEqual(lista.map((s) => s.km), [0, 10, 5]);
  assert.deepEqual(lista.map((s) => s.previsto), [null, null, 16]);
});

test('ritmo semanal é ponderado por distância e ignora prova e corrida curta', () => {
  const [semana] = resumoSemanal({
    atividades: [
      corrida('2026-11-16', 10, 3600),
      corrida('2026-11-17', 5, 1500),
      corrida('2026-11-18', 5, 900, { prova: true }),
      corrida('2026-11-18', 1, 200),
    ],
    hoje: HOJE,
    semanas: 1,
  });
  assert.equal(semana.ritmo, (3600 + 1500) / 15);
});

test('semana sem corrida não tem ritmo, em vez de zero', () => {
  const [semana] = resumoSemanal({ atividades: [], hoje: HOJE, semanas: 1 });
  assert.equal(semana.ritmo, null);
  assert.equal(semana.metrosPorBatimento, null);
});

test('metros por batimento usa só corridas com frequência cardíaca', () => {
  const [semana] = resumoSemanal({
    atividades: [corrida('2026-11-16', 6, 1800, { fcMedia: 150 }), corrida('2026-11-17', 6, 1800)],
    hoje: HOJE,
    semanas: 1,
  });
  assert.equal(semana.metrosPorBatimento, 6000 / (150 * 30));
});

test('compara os últimos 28 dias com os 28 anteriores, sem sobrepor', () => {
  const r = compararPeriodos([
    corrida(HOJE, 5, 1500),
    corrida('2026-10-22', 7, 2500),
    corrida('2026-10-21', 3, 1000),
    corrida('2026-09-24', 4, 1400),
    corrida('2026-09-23', 99, 1),
  ], HOJE);
  assert.deepEqual(r.atual, { km: 12, corridas: 2, seg: 4000 });
  assert.deepEqual(r.anterior, { km: 7, corridas: 2, seg: 2400 });
});

test('adesão compara o previsto já vencido com o realizado', () => {
  const plano = { sessoes: [{ data: '2026-11-10', distanciaKm: 10 }, { data: '2026-11-25', distanciaKm: 50 }] };
  assert.equal(adesaoDoPeriodo({ atividades: [corrida('2026-11-10', 8, 2400)], plano, hoje: HOJE }), 0.8);
  assert.equal(adesaoDoPeriodo({ atividades: [], plano: { sessoes: [] }, hoje: HOJE }), null);
});

test('recordes: melhor pace exige pelo menos 5 km', () => {
  const r = calcularRecordes([
    corrida('2026-11-01', 3, 600),
    corrida('2026-11-02', 5, 1800),
    corrida('2026-11-03', 12, 4800),
  ]);
  assert.equal(r.maiorCorrida.km, 12);
  assert.equal(r.melhorPace.data, '2026-11-02');
  assert.equal(r.maiorSemana.km, 17); // 1º de novembro é domingo, da semana anterior
  assert.equal(calcularRecordes([]), null);
  assert.equal(calcularRecordes([corrida('2026-11-01', 3, 600)]).melhorPace, null);
});

test('zonas somam o período, aceitam corrida sem dados e ignoram as antigas', () => {
  const z = zonasDoPeriodo([
    corrida(HOJE, 5, 1500, { tempoPorZonaFc: [100, 300] }),
    corrida('2026-11-10', 5, 1500),
    corrida('2026-11-11', 5, 1500, { tempoPorZonaFc: [0, 100, 500] }),
    corrida('2026-01-01', 5, 1500, { tempoPorZonaFc: [9999] }),
  ], HOJE);
  assert.deepEqual(z.map((x) => [x.zona, x.seg]), [[1, 100], [2, 400], [3, 500]]);
  assert.equal(z[2].fracao, 0.5);
  assert.deepEqual(zonasDoPeriodo([], HOJE), []);
});

test('CSV abre no Excel em português e neutraliza fórmulas', () => {
  const csv = csvDasCorridas([
    corrida('2026-11-10', 5.256, 1800, { nome: '=HYPERLINK("x")', fcMedia: 150, prova: true, subida: 41.6 }),
    corrida('2026-11-01', 10, 3725, { nome: 'Corrida "boa"' }),
  ]);
  assert.ok(csv.startsWith('﻿Data;Nome;'));
  const linhas = csv.trim().split('\r\n');
  assert.equal(linhas.length, 3);
  assert.equal(linhas[1], '2026-11-01;"Corrida ""boa""";10,00;01:02:05;06:13;;;;;Não');
  assert.equal(linhas[2], `2026-11-10;"'=HYPERLINK(""x"")";5,26;00:30:00;05:42;150;;42;;Sim`);
});

test('histórico de nível só guarda mudanças', () => {
  let h = registrarNivel(undefined, '2026-11-01', 30);
  h = registrarNivel(h, '2026-11-08', 30);
  h = registrarNivel(h, '2026-11-15', 31);
  h = registrarNivel(h, '2026-11-15', 31.5);
  assert.deepEqual(h, [{ data: '2026-11-01', vdot: 30 }, { data: '2026-11-15', vdot: 31.5 }]);
});
