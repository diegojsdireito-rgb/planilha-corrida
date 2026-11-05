import test from 'node:test';
import assert from 'node:assert/strict';
import { criarCliente, eventoDaSessao, normalizarAtividade, textoDoTreino } from '../src/icu.js';
import { formatarRitmo, gerarPlano } from '../src/motor.js';

const sessaoForte = {
  id: 'pc-2026-11-10',
  data: '2026-11-10',
  tipo: 'limiar',
  nome: '4 x 1 km no limiar',
  distanciaKm: 8,
  blocos: [
    { rotulo: 'Aquecimento', repeticoes: 1, passos: [{ km: 2, ritmo: { de: 310, ate: 340 } }] },
    { rotulo: 'Principal', repeticoes: 4, passos: [{ km: 1, ritmo: 255 }, { minutos: 1, ritmo: { de: 310, ate: 340 } }] },
    { rotulo: 'Desaquecimento', repeticoes: 1, passos: [{ km: 1.5, ritmo: { de: 310, ate: 340 } }] },
  ],
};

test('texto do treino segue a sintaxe do intervals.icu', () => {
  assert.equal(
    textoDoTreino(sessaoForte, formatarRitmo),
    [
      'Aquecimento',
      '- 2km 5:10/km-5:40/km Pace',
      '',
      'Principal 4x',
      '- 1km 4:15/km Pace',
      '- 1m 5:10/km-5:40/km Pace',
      '',
      'Desaquecimento',
      '- 1500mtr 5:10/km-5:40/km Pace',
    ].join('\n'),
  );
});

test('todo treino gerado vira texto sem valor quebrado', () => {
  const plano = gerarPlano({
    perfil: { idade: 35, diasSemana: [2, 4, 6, 0], diaLongo: 0 },
    objetivo: { distanciaKm: 42.2, dataProva: '2027-06-06' },
    base: { kmSemana: 30, longoKm: 14 },
    vdot: 45,
    inicio: '2026-11-09',
  });
  for (const s of plano.sessoes.filter((x) => x.tipo !== 'prova')) {
    const texto = textoDoTreino(s, formatarRitmo);
    assert.doesNotMatch(texto, /undefined|NaN/);
    for (const linha of texto.split('\n').filter((l) => l.startsWith('- '))) {
      assert.match(linha, /^- (\d+km|\d+mtr|\d+m) \d+:\d\d\/km(-\d+:\d\d\/km)? Pace$/);
    }
  }
});

test('evento de treino e de prova', () => {
  const treino = eventoDaSessao(sessaoForte, formatarRitmo);
  assert.equal(treino.category, 'WORKOUT');
  assert.equal(treino.start_date_local, '2026-11-10T00:00:00');
  assert.equal(treino.external_id, 'pc-2026-11-10');
  const prova = eventoDaSessao({ id: 'pc-x', data: '2027-02-07', tipo: 'prova', nome: 'Prova', distanciaKm: 10, blocos: [] }, formatarRitmo);
  assert.equal(prova.category, 'RACE_A');
  assert.equal(prova.distance, 10000);
});

test('normaliza atividade da API', () => {
  const a = normalizarAtividade({ id: 'i1', start_date_local: '2026-11-01T06:30:00', icu_distance: 8000, moving_time: 2400, race: true, icu_rpe: 7 });
  assert.deepEqual([a.data, a.km, a.seg, a.prova, a.rpe], ['2026-11-01', 8, 2400, true, 7]);
  assert.deepEqual(a.tempoPorZonaFc, []);
  const comZonas = normalizarAtividade({ max_heartrate: 170, total_elevation_gain: 45, icu_hr_zone_times: [60, 600] });
  assert.deepEqual([comZonas.fcMaxima, comZonas.subida, comZonas.tempoPorZonaFc], [170, 45, [60, 600]]);
});

function clienteFalso(respostas) {
  const chamadas = [];
  const buscar = async (url, opcoes) => {
    chamadas.push({ url, ...opcoes });
    const r = respostas.shift() ?? { status: 200, corpo: [] };
    return { status: r.status, ok: r.status < 400, text: async () => JSON.stringify(r.corpo ?? null) };
  };
  return { cliente: criarCliente({ chave: 'abc', buscar }), chamadas };
}

test('autenticação usa API_KEY e a chave', async () => {
  const { cliente, chamadas } = clienteFalso([{ status: 200, corpo: { id: 'i1' } }]);
  await cliente.testar();
  assert.equal(chamadas[0].headers.Authorization, `Basic ${btoa('API_KEY:abc')}`);
});

test('atividades: mantém só corridas e conta as que vieram sem dados', async () => {
  const { cliente } = clienteFalso([{
    status: 200,
    corpo: [
      { id: '1', type: 'Run', start_date_local: '2026-11-01T06:00:00', distance: 5000, moving_time: 1500 },
      { id: '2', type: 'Ride', start_date_local: '2026-11-02T06:00:00', distance: 30000, moving_time: 3600 },
      { id: '3', type: 'Run', start_date_local: '2026-11-03T06:00:00', source: 'STRAVA' },
    ],
  }]);
  const r = await cliente.atividades('2026-10-01', '2026-11-04');
  assert.equal(r.atividades.length, 1);
  assert.equal(r.semDados, 1);
});

test('envio remove só os ids do próprio app, depois cria', async () => {
  const { cliente, chamadas } = clienteFalso([{ status: 200 }, { status: 200, corpo: [{}] }]);
  await cliente.enviarTreinos([sessaoForte], ['pc-2026-11-10'], formatarRitmo);
  assert.equal(chamadas[0].method, 'PUT');
  assert.match(chamadas[0].url, /\/events\/bulk-delete$/);
  assert.deepEqual(JSON.parse(chamadas[0].body), [{ external_id: 'pc-2026-11-10' }]);
  assert.equal(chamadas[1].method, 'POST');
  assert.match(chamadas[1].url, /\/events\/bulk\?/);
});

test('se a remoção falhar, não cria treinos em duplicidade', async () => {
  const { cliente, chamadas } = clienteFalso([{ status: 500 }]);
  await assert.rejects(cliente.enviarTreinos([sessaoForte], ['pc-2026-11-10'], formatarRitmo), /erro 500/);
  assert.equal(chamadas.length, 1);
});

test('chave recusada gera mensagem clara', async () => {
  const { cliente } = clienteFalso([{ status: 401 }]);
  await assert.rejects(cliente.testar(), /recusou a chave/);
});
