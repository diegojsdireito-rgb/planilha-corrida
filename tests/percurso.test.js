import test from 'node:test';
import assert from 'node:assert/strict';
import { curvasDaAtividade, enquadrarMapa, parciaisPorKm, pontosDoMapa, projetar, voltasDaAtividade } from '../src/percurso.js';
import { curvaDaAtividade } from '../src/graficos.js';
import { criarCliente } from '../src/icu.js';

const trajeto = Array.from({ length: 50 }, (_, i) => [-10.9 - i * 0.0005, -37.05 + i * 0.0004]);

test('a projeção segue a grade de blocos do mapa', () => {
  assert.deepEqual(projetar([0, 0], 0).map(Math.round), [128, 128]);
  assert.deepEqual(projetar([0, -180], 1).map(Math.round), [0, 256]);
});

test('pontos inválidos saem, e percurso longo é reduzido mantendo início e fim', () => {
  assert.equal(pontosDoMapa([[1, 2], null, [null, 3], [95, 2], [1.1, 2.1]]).length, 2);
  const longo = Array.from({ length: 2000 }, (_, i) => [i * 0.0001, i * 0.0001]);
  const reduzido = pontosDoMapa(longo, 100);
  assert.equal(reduzido.length, 100);
  assert.deepEqual(reduzido[0], longo[0]);
  assert.deepEqual(reduzido.at(-1), longo.at(-1));
  assert.deepEqual(pontosDoMapa(null), []);
});

test('o enquadramento coloca todo o traço na área e cobre a área com blocos', () => {
  const m = enquadrarMapa(trajeto, { largura: 340, altura: 240, margem: 24 });
  for (const [x, y] of m.traco) {
    assert.ok(x >= 24 - 1 && x <= 340 - 24 + 1, `x ${x}`);
    assert.ok(y >= 24 - 1 && y <= 240 - 24 + 1, `y ${y}`);
  }
  assert.ok(m.zoom >= 10 && m.zoom <= 17);
  const cobreX = Math.min(...m.blocos.map((b) => b.esquerda)) <= 0 && Math.max(...m.blocos.map((b) => b.esquerda + 256)) >= 340;
  const cobreY = Math.min(...m.blocos.map((b) => b.topo)) <= 0 && Math.max(...m.blocos.map((b) => b.topo + 256)) >= 240;
  assert.ok(cobreX && cobreY);
});

test('um zoom a mais não caberia: o mapa usa o maior possível', () => {
  const m = enquadrarMapa(trajeto);
  const xs = trajeto.map((p) => projetar(p, m.zoom + 1)[0]);
  const ys = trajeto.map((p) => projetar(p, m.zoom + 1)[1]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 292 || Math.max(...ys) - Math.min(...ys) > 192);
});

test('sem percurso, não há mapa', () => {
  assert.equal(enquadrarMapa([]), null);
  assert.equal(enquadrarMapa([[1, 2]]), null);
});

test('as curvas agrupam em trechos e usam a distância como eixo', () => {
  const n = 600;
  const r = curvasDaAtividade({
    tempo: Array.from({ length: n }, (_, i) => i),
    distancia: Array.from({ length: n }, (_, i) => i * 2),
    velocidade: Array(n).fill(2),
    fc: Array(n).fill(120),
    altitude: Array.from({ length: n }, (_, i) => 10 + i / 100),
  }, { trechos: 60 });
  assert.equal(r.eixo, 'km');
  assert.equal(r.pontos.length, 60);
  assert.equal(r.pontos[0].velocidade, 2);
  assert.equal(r.pontos[0].fc, 120);
  assert.ok(Math.abs(r.pontos.at(-1).x - 1.198) < 1e-9);
  assert.ok(r.pontos.at(-1).altitude > r.pontos[0].altitude);
});

test('parada e salto de GPS ficam fora do pace, sem zerar a linha', () => {
  const r = curvasDaAtividade({ tempo: [0, 1, 2, 3], distancia: [0, 2, 2, 4], velocidade: [0, 0, 60, 2] }, { trechos: 2 });
  assert.equal(r.pontos[0].velocidade, null);
  assert.equal(r.pontos[1].velocidade, 2);
});

test('sem distância, o eixo passa a ser o tempo em minutos', () => {
  const r = curvasDaAtividade({ tempo: [0, 60, 120, 180], fc: [100, 110, 120, 130] }, { trechos: 2 });
  assert.equal(r.eixo, 'min');
  assert.equal(r.pontos.at(-1).x, 3);
  assert.equal(r.pontos[0].velocidade, null);
});

test('sem amostras, não há curvas', () => {
  assert.equal(curvasDaAtividade({}), null);
  assert.equal(curvasDaAtividade({ tempo: [0] }), null);
});

test('o gráfico tem vão na parada, valor ao toque e tabela', () => {
  const pontos = [{ x: 0, valor: 100 }, { x: 1, valor: 110 }, { x: 2, valor: null }, { x: 3, valor: 120 }, { x: 4, valor: 130 }];
  const html = curvaDaAtividade(pontos, { nome: 'FC', eixo: 'km', formatar: (v) => `${v} bpm` });
  assert.match(html, /data-dica="1 km: 110 bpm"/);
  assert.equal((html.match(/M/g) ?? []).filter(Boolean).length >= 2, true);
  assert.match(html, /Ver tabela/);
  assert.equal(curvaDaAtividade([{ x: 0, valor: 1 }], { nome: 'FC', eixo: 'km', formatar: String }), '');
});

test('as voltas vêm do intervals.icu, sem trechos vazios', () => {
  const voltas = voltasDaAtividade([
    { distance: 1000, moving_time: 420, average_heartrate: 140, total_elevation_gain: 5, type: 'WORK', label: 'Volta 1' },
    { distance: 200, moving_time: 90, type: 'RECOVERY' },
    { distance: 0, moving_time: 30 },
    { distance: 500, moving_time: 0 },
  ]);
  assert.equal(voltas.length, 2);
  assert.deepEqual(voltas[0], { km: 1, seg: 420, fc: 140, subida: 5, recuperacao: false, rotulo: 'Volta 1' });
  assert.equal(voltas[1].recuperacao, true);
  assert.equal(voltas[1].fc, null);
  assert.deepEqual(voltasDaAtividade(null), []);
});

test('as parciais fecham a cada km, sem contar parada, com o resto no fim', () => {
  const n = 1301; // 2,6 km a 2 m/s, com 60 s parado no início do segundo km
  const tempo = Array.from({ length: n }, (_, i) => i);
  const distancia = Array.from({ length: n }, (_, i) => i * 2);
  const velocidade = Array.from({ length: n }, (_, i) => (i > 500 && i <= 560 ? 0 : 2));
  const fc = Array(n).fill(130);
  const p = parciaisPorKm({ tempo, distancia, velocidade, fc });
  assert.equal(p.length, 3);
  assert.equal(p[0].km, 1);
  assert.equal(p[0].seg, 500);
  assert.equal(p[1].seg, 440);
  assert.ok(Math.abs(p[2].km - 0.6) < 1e-9);
  assert.equal(p[2].seg, 300);
  assert.equal(p[0].fc, 130);
});

test('resto muito curto não vira parcial, e sem distância não há parciais', () => {
  const tempo = Array.from({ length: 510 }, (_, i) => i);
  const distancia = Array.from({ length: 510 }, (_, i) => i * 2);
  assert.equal(parciaisPorKm({ tempo, distancia }).length, 1);
  assert.deepEqual(parciaisPorKm({ tempo }), []);
});

test('o cliente junta curvas e mapa, e a falta do mapa não derruba as curvas', async () => {
  const cliente = (mapa) => criarCliente({
    chave: 'x',
    buscar: async (url) => {
      if (String(url).includes('/map')) return mapa ? new Response(JSON.stringify({ latlngs: [[1, 2], [1.1, 2.1]] })) : new Response('', { status: 404 });
      if (String(url).endsWith('/intervals')) return new Response(JSON.stringify({ icu_intervals: [{ distance: 1000, moving_time: 400 }] }));
      return new Response(JSON.stringify([
        { type: 'time', data: [0, 1] },
        { type: 'heartrate', data: [100, 101] },
        { type: 'altitude', allNull: true, data: [null, null] },
      ]));
    },
  });
  const comMapa = await cliente(true).percursoDaAtividade('i1');
  assert.deepEqual(comMapa.latlngs, [[1, 2], [1.1, 2.1]]);
  assert.deepEqual(comMapa.fc, [100, 101]);
  assert.equal(comMapa.altitude, null);
  assert.deepEqual(comMapa.intervalos, [{ distance: 1000, moving_time: 400 }]);
  const semMapa = await cliente(false).percursoDaAtividade('i1');
  assert.equal(semMapa.latlngs, null);
  assert.deepEqual(semMapa.tempo, [0, 1]);
});
