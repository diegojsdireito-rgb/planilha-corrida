import test from 'node:test';
import assert from 'node:assert/strict';
import { cargaPorSemana, dadosDeDesempenho, marcasDaCurva, melhoresDaCorrida, paceAjustado, pontosDeCarga, resumoDaCarga } from '../src/desempenho.js';

test('pace ajustado é o mesmo em qualquer unidade plausível', () => {
  assert.equal(Math.round(paceAjustado(0.36)), 360); // s/m
  assert.equal(Math.round(paceAjustado(1000 / 360)), 360); // m/s
  assert.equal(Math.round(paceAjustado(360)), 360); // s/km
});

test('pace ajustado fora da faixa de corrida some', () => {
  assert.equal(paceAjustado(null), null);
  assert.equal(paceAjustado(0), null);
  assert.equal(paceAjustado(0.05), null);
  assert.equal(paceAjustado(9), null);
  assert.equal(paceAjustado(5000), null);
});

test('dados de desempenho convertem o vento e descartam valor absurdo', () => {
  const dados = dadosDeDesempenho({ gap: 2.5, decoupling: 3.2, average_weather_temp: 27, average_feels_like: 30, average_wind_speed: 2, headwind_percent: 40 });
  assert.equal(dados.paceAjustado, 400);
  assert.equal(dados.desacoplamento, 3.2);
  assert.equal(dados.temperatura, 27);
  assert.equal(dados.ventoKmH, 7.2);
  assert.equal(dados.ventoContra, 40);
  const ruins = dadosDeDesempenho({ decoupling: 900, average_weather_temp: 400, average_wind_speed: -1 });
  assert.equal(ruins.desacoplamento, null);
  assert.equal(ruins.temperatura, null);
  assert.equal(ruins.ventoKmH, null);
  assert.equal(dadosDeDesempenho({}).sensacaoTermica, null);
});

function corrida(trechos) {
  const tempo = [0];
  const distancia = [0];
  const velocidade = [0];
  for (const { metros, velocidade: v } of trechos) {
    for (let i = 0; i < metros / v; i++) {
      tempo.push(tempo.at(-1) + 1);
      distancia.push(distancia.at(-1) + v);
      velocidade.push(v);
    }
  }
  return { tempo, distancia, velocidade };
}

test('melhor marca acha o trecho mais rápido, não o começo', () => {
  const dados = corrida([{ metros: 2000, velocidade: 2.5 }, { metros: 1000, velocidade: 4 }, { metros: 2000, velocidade: 2.5 }]);
  const marcas = melhoresDaCorrida(dados);
  assert.deepEqual(marcas.map((m) => m.km), [1, 3, 5]);
  assert.ok(Math.abs(marcas[0].seg - 250) <= 1);
  assert.ok(Math.abs(marcas[2].seg - 1850) <= 2);
});

test('parada não conta no tempo da marca', () => {
  const dados = corrida([{ metros: 1000, velocidade: 2.5 }]);
  const meio = 200;
  dados.tempo = [...dados.tempo.slice(0, meio), ...Array.from({ length: 60 }, (_, i) => dados.tempo[meio - 1] + i + 1), ...dados.tempo.slice(meio).map((t) => t + 60)];
  dados.distancia = [...dados.distancia.slice(0, meio), ...Array(60).fill(dados.distancia[meio - 1]), ...dados.distancia.slice(meio)];
  dados.velocidade = [...dados.velocidade.slice(0, meio), ...Array(60).fill(0), ...dados.velocidade.slice(meio)];
  assert.ok(Math.abs(melhoresDaCorrida(dados)[0].seg - 400) <= 2);
});

test('salto de GPS não vira marca', () => {
  const dados = corrida([{ metros: 1000, velocidade: 25 }]);
  assert.deepEqual(melhoresDaCorrida(dados), []);
});

test('sem curvas ou curta demais não há marca', () => {
  assert.deepEqual(melhoresDaCorrida({ tempo: null, distancia: null }), []);
  assert.deepEqual(melhoresDaCorrida(corrida([{ metros: 800, velocidade: 3 }])), []);
});

test('curva do atleta só gera marca com ponto próximo e pace plausível', () => {
  const marcas = marcasDaCurva({ distance: [1000, 3400, 4990, 10000], values: [300, 1000, 1500, 100], activity_id: ['a', 'b', 'c', 'd'] });
  assert.deepEqual(marcas.map((m) => m.km), [1, 5]);
  assert.equal(marcas[0].atividade, 'a');
  assert.ok(Math.abs(marcas[1].seg - 1503) < 1);
  assert.deepEqual(marcasDaCurva(null), []);
});

test('carga guarda o último valor de cada dia e ignora atividade sem dado', () => {
  const pontos = pontosDeCarga([
    { start_date_local: '2026-11-07T18:00:00', icu_ctl: 12, icu_atl: 20 },
    { start_date_local: '2026-11-07T07:00:00', icu_ctl: 11, icu_atl: 18 },
    { start_date_local: '2026-11-05T07:00:00', icu_ctl: null, icu_atl: 18 },
    { start_date_local: '2026-10-30T07:00:00', icu_ctl: 9, icu_atl: 10 },
  ]);
  assert.deepEqual(pontos, [{ data: '2026-10-30', ctl: 9, atl: 10 }, { data: '2026-11-07', ctl: 12, atl: 20 }]);
});

test('resumo da carga compara com pelo menos 7 dias antes', () => {
  const resumo = resumoDaCarga([{ data: '2026-10-30', ctl: 9, atl: 10 }, { data: '2026-11-05', ctl: 11, atl: 15 }, { data: '2026-11-07', ctl: 12, atl: 20 }]);
  assert.equal(resumo.equilibrio, -8);
  assert.equal(resumo.variacao, 3);
  assert.equal(resumoDaCarga([{ data: '2026-11-07', ctl: 12, atl: 20 }]).variacao, null);
  assert.equal(resumoDaCarga([]), null);
});

test('semana sem atividade fica vazia nos gráficos', () => {
  const semanas = cargaPorSemana([{ data: '2026-10-30', ctl: 9, atl: 10 }, { data: '2026-11-07', ctl: 12, atl: 20 }], '2026-11-07', 3);
  assert.deepEqual(semanas.map((s) => s.ctl), [null, 9, 12]);
});
