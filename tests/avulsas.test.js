import test from 'node:test';
import assert from 'node:assert/strict';
import { avulsaDoIntervals, duracaoCurta, erroDaAvulsa, juntarAvulsas, nomeDaCategoria, resumoPorCategoria, velocidadeDaAtividade } from '../src/avulsas.js';
import { criarCliente } from '../src/icu.js';

const HOJE = '2026-11-06';
const valida = { categoria: 'caminhada', data: HOJE, minutos: 45, km: null };

test('atividade do relógio chega com categoria e dados', () => {
  const a = avulsaDoIntervals({
    id: 'i9', start_date_local: '2026-11-05T07:00:00', type: 'Walk', name: 'Caminhada da manhã',
    distance: 3200, moving_time: 2700, elapsed_time: 3000, calories: 210, icu_rpe: 3, icu_hr_zone_times: [600, 2100],
    average_heartrate: 108, max_heartrate: 124, total_elevation_gain: 22,
  });
  assert.deepEqual(a, {
    id: 'i9', data: '2026-11-05', hora: '07:00', categoria: 'caminhada', nome: 'Caminhada da manhã', minutos: 45, seg: 2700, segTotal: 3000, km: 3.2,
    fcMedia: 108, fcMaxima: 124, subida: 22, calorias: 210, rpe: 3, tempoPorZonaFc: [600, 2100], origem: 'relogio',
  });
});

test('caminhada mostra pace, bicicleta mostra velocidade e os demais nenhuma', () => {
  assert.deepEqual(velocidadeDaAtividade({ categoria: 'caminhada', km: 8, seg: 5280 }), { nome: 'Pace médio', segPorKm: 660 });
  assert.deepEqual(velocidadeDaAtividade({ categoria: 'bicicleta', km: 30, seg: 3600 }), { nome: 'Velocidade média', kmPorHora: 30 });
  assert.equal(velocidadeDaAtividade({ categoria: 'natacao', km: 1, seg: 1800 }), null);
  assert.equal(velocidadeDaAtividade({ categoria: 'caminhada', km: null, seg: 1800 }), null);
});

test('musculação fica sem distância e tipo desconhecido vira outro exercício', () => {
  const musculacao = avulsaDoIntervals({ id: 'a', start_date_local: '2026-11-05T07:00:00', type: 'WeightTraining', moving_time: 1800 });
  assert.equal(musculacao.categoria, 'musculacao');
  assert.equal(musculacao.km, null);
  assert.equal(avulsaDoIntervals({ id: 'b', start_date_local: '2026-11-05T07:00:00', type: 'Surfing', moving_time: 600 }).categoria, 'outro');
  assert.equal(nomeDaCategoria('outro'), 'Outro exercício');
});

test('o cliente separa corridas de outras atividades, sem misturar', async () => {
  const lista = [
    { id: 'r', start_date_local: '2026-11-05T07:00:00', type: 'Run', distance: 5000, moving_time: 1800 },
    { id: 'w', start_date_local: '2026-11-04T07:00:00', type: 'Walk', distance: 3000, moving_time: 2400 },
    { id: 'm', start_date_local: '2026-11-03T07:00:00', type: 'WeightTraining', moving_time: 1800 },
    { id: 'vazia', start_date_local: '2026-11-02T07:00:00', type: 'Ride', moving_time: 0 },
  ];
  const cliente = criarCliente({ chave: 'x', buscar: async () => new Response(JSON.stringify(lista)) });
  const r = await cliente.atividades('2026-01-01', HOJE);
  assert.deepEqual(r.atividades.map((a) => a.id), ['r']);
  assert.deepEqual(r.outras.map((a) => a.id), ['w', 'm']);
  assert.equal(r.semDados, 0);
});

test('o registro manual confere data, duração e distância', () => {
  assert.equal(erroDaAvulsa(valida, HOJE), null);
  assert.equal(erroDaAvulsa({ ...valida, km: 3.5 }, HOJE), null);
  assert.match(erroDaAvulsa({ ...valida, categoria: 'x' }, HOJE), /atividade/);
  assert.match(erroDaAvulsa({ ...valida, data: '' }, HOJE), /data/);
  assert.match(erroDaAvulsa({ ...valida, data: '2026-11-07' }, HOJE), /futura/);
  assert.match(erroDaAvulsa({ ...valida, minutos: 0 }, HOJE), /duração/);
  assert.match(erroDaAvulsa({ ...valida, minutos: 1500 }, HOJE), /24 horas/);
  assert.match(erroDaAvulsa({ ...valida, km: 0 }, HOJE), /distância/);
});

test('junta manuais e do relógio, da mais recente para a mais antiga', () => {
  const lista = juntarAvulsas([{ id: 'm', data: '2026-11-01' }], [{ id: 'r', data: '2026-11-03' }]);
  assert.deepEqual(lista.map((a) => a.id), ['r', 'm']);
});

test('o resumo soma por categoria só dentro do período', () => {
  const lista = [
    { data: '2026-11-02', categoria: 'caminhada', minutos: 30 },
    { data: '2026-11-03', categoria: 'caminhada', minutos: 40 },
    { data: '2026-11-04', categoria: 'bicicleta', minutos: 90 },
    { data: '2026-11-09', categoria: 'bicicleta', minutos: 60 },
    { data: '2026-11-01', categoria: 'natacao', minutos: 60 },
  ];
  assert.deepEqual(resumoPorCategoria(lista, '2026-11-02', '2026-11-09'), [
    { categoria: 'bicicleta', nome: 'Bicicleta', minutos: 90, quantidade: 1, km: 0 },
    { categoria: 'caminhada', nome: 'Caminhada', minutos: 70, quantidade: 2, km: 0 },
  ]);
});

test('duração curta em minutos e horas', () => {
  assert.equal(duracaoCurta(45), '45 min');
  assert.equal(duracaoCurta(60), '1h');
  assert.equal(duracaoCurta(95), '1h35');
  assert.equal(duracaoCurta(125), '2h05');
});
