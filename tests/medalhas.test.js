import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arquivarCorridas,
  calcularMedalhas,
  chavesConquistadas,
  corridaValida,
  feriadoNacional,
  juntarCorridas,
  medalhasNovas,
  pascoa,
  situacaoDasSemanas,
} from '../src/medalhas.js';

const corrida = (id, data, km, seg, extra = {}) => ({ id, data, km, seg, subida: null, prova: false, ...extra });
const achar = (lista, id) => lista.find((m) => m.id === id);
const semanasCumpridas = (inicio, quantas) => Object.fromEntries(Array.from({ length: quantas }, (_, i) => {
  const d = new Date(`${inicio}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + i * 7);
  return [d.toISOString().slice(0, 10), 'cumprida'];
}));

test('sem corridas, todas ficam bloqueadas e nada é novo', () => {
  const m = calcularMedalhas({});
  assert.ok(m.length >= 25);
  assert.ok(m.every((x) => !x.conquistada && x.chave === null));
  assert.deepEqual(medalhasNovas(m, null), []);
  assert.equal(new Set(m.map((x) => x.id)).size, m.length);
});

test('o recorde muda quando é batido, e conta as vezes', () => {
  const m = calcularMedalhas({ corridas: [corrida('c', '2026-03-01', 12, 4800), corrida('a', '2026-01-01', 8, 3200), corrida('b', '2026-02-01', 10, 4000), corrida('d', '2026-04-01', 9, 3600)] });
  const r = achar(m, 'maior-distancia');
  assert.equal(r.detalhe, '12 km');
  assert.equal(r.data, '2026-03-01');
  assert.equal(r.vezes, 2);
});

test('melhor pace exige 5 km, e erro de GPS não vira recorde', () => {
  assert.equal(corridaValida(corrida('x', '2026-01-01', 10, 600)), false);
  const m = calcularMedalhas({ corridas: [corrida('curta', '2026-01-01', 3, 900), corrida('gps', '2026-01-02', 30, 1800), corrida('boa', '2026-01-03', 5, 1800)] });
  assert.equal(achar(m, 'melhor-pace').detalhe, '6:00/km');
  assert.equal(achar(m, 'maior-distancia').detalhe, '5 km');
});

test('melhor tempo só vale perto da distância e é ajustado a ela', () => {
  const m = calcularMedalhas({ corridas: [corrida('a', '2026-01-01', 5.1, 1530), corrida('b', '2026-01-02', 7, 1890)] });
  assert.equal(achar(m, 'melhor-5').detalhe, '25min00s');
  assert.equal(achar(m, 'melhor-10').conquistada, false);
});

test('maior semana soma de segunda a domingo, e maior subida ignora quem não tem o dado', () => {
  const m = calcularMedalhas({ corridas: [corrida('a', '2026-11-02', 5, 1800, { subida: 40 }), corrida('b', '2026-11-08', 6, 2160), corrida('c', '2026-11-09', 7, 2520)] });
  assert.equal(achar(m, 'maior-semana').detalhe, '11 km');
  assert.equal(achar(m, 'maior-subida').detalhe, '40 m');
});

test('marcos: primeira vez em cada distância, e total acumulado com a data em que chegou', () => {
  const corridas = [corrida('a', '2026-01-01', 4.95, 1800), corrida('b', '2026-02-01', 60, 25000), corrida('c', '2026-03-01', 50, 21000)];
  const m = calcularMedalhas({ corridas });
  assert.equal(achar(m, 'primeira-corrida').data, '2026-01-01');
  assert.equal(achar(m, 'primeiros-5').data, '2026-01-01');
  assert.equal(achar(m, 'primeiros-42').data, '2026-02-01');
  assert.equal(achar(m, 'total-100').data, '2026-03-01');
  assert.equal(achar(m, 'total-250').conquistada, false);
  assert.equal(achar(m, 'total-250').progresso.texto, '115 de 250 km');
});

test('feriados nacionais incluem os móveis confirmados, sem ponto facultativo', () => {
  assert.equal(pascoa(2026), '2026-04-05');
  assert.equal(pascoa(2027), '2027-03-28');
  assert.equal(feriadoNacional('2026-04-03'), 'Sexta-feira da Paixão');
  assert.equal(feriadoNacional('2026-11-20'), 'Consciência Negra');
  assert.equal(feriadoNacional('2026-02-17'), null); // Carnaval
  assert.equal(feriadoNacional('2026-06-04'), null); // Corpus Christi
  assert.equal(feriadoNacional('2026-11-16'), null);
});

test('datas especiais: feriado, Ano-Novo, Natal e aniversário', () => {
  const corridas = [corrida('a', '2026-01-01', 5, 1800), corrida('b', '2026-11-15', 5, 1800), corrida('c', '2026-07-10', 5, 1800), corrida('d', '2026-12-25', 5, 1800)];
  const m = calcularMedalhas({ corridas, nascimento: '1990-07-10' });
  assert.equal(achar(m, 'ano-novo').conquistada, true);
  assert.equal(achar(m, 'natal').conquistada, true);
  assert.equal(achar(m, 'aniversario').data, '2026-07-10');
  assert.match(achar(m, 'feriado').detalhe, /Natal, 3 feriados/);
  assert.equal(achar(calcularMedalhas({ corridas }), 'aniversario').conquistada, false);
});

test('duas corridas no feriado contam um dia só', () => {
  const m = calcularMedalhas({ corridas: [corrida('a', '2026-11-15', 5, 1800), corrida('b', '2026-11-15', 3, 1080)] });
  assert.equal(achar(m, 'feriado').detalhe, 'Proclamação da República');
});

test('a sequência é por semana: falha zera, dor não quebra e não conta', () => {
  const completa = calcularMedalhas({ semanas: semanasCumpridas('2026-01-05', 4) });
  assert.equal(achar(completa, 'sequencia-4').data, '2026-02-01');
  const comFalha = { ...semanasCumpridas('2026-01-05', 4), '2026-01-19': 'falhou' };
  assert.equal(achar(calcularMedalhas({ semanas: comFalha }), 'sequencia-4').conquistada, false);
  const comDor = { ...semanasCumpridas('2026-01-05', 5), '2026-01-19': 'neutra' };
  assert.equal(achar(calcularMedalhas({ semanas: comDor }), 'sequencia-4').data, '2026-02-08');
  const comIntervalo = { ...semanasCumpridas('2026-01-05', 2), ...semanasCumpridas('2026-03-02', 2) };
  const r = achar(calcularMedalhas({ semanas: comIntervalo }), 'sequencia-4');
  assert.equal(r.conquistada, false);
  assert.equal(r.progresso.texto, 'Melhor sequência: 2 de 4');
});

test('a situação da semana considera só semanas terminadas e a dor registrada', () => {
  const sessoes = [
    { id: 's1', data: '2026-11-03' }, { id: 's2', data: '2026-11-05' },
    { id: 's3', data: '2026-11-10' }, { id: 's4', data: '2026-11-12' },
    { id: 's5', data: '2026-11-17' },
    { id: 's6', data: '2026-11-24' },
  ];
  const corridas = [corrida('a', '2026-11-03', 5, 1800), corrida('b', '2026-11-06', 5, 1800), corrida('c', '2026-11-10', 5, 1800)];
  const r = situacaoDasSemanas({ sessoes, corridas, avaliacoes: { s5: { dor: true } }, hoje: '2026-11-25' });
  assert.deepEqual(r, { '2026-11-02': 'cumprida', '2026-11-09': 'falhou', '2026-11-16': 'neutra' });
});

test('provas: primeira, recorde na mesma distância e segunda metade mais rápida', () => {
  const provasDoCalendario = [
    { id: 'p1', nome: 'Corrida A', data: '2026-03-01', distanciaKm: 10, resultado: { atividadeId: 'a', km: 10, seg: 3600, vdot: 30, previstoSeg: null } },
    { id: 'p2', nome: 'Corrida B', data: '2026-06-01', distanciaKm: 5, resultado: { atividadeId: 'b', km: 5, seg: 1500, vdot: 32, previstoSeg: null } },
    { id: 'p3', nome: 'Corrida C', data: '2026-09-01', distanciaKm: 10, resultado: { atividadeId: 'c', km: 10, seg: 3300, vdot: 33, previstoSeg: null } },
  ];
  const m = calcularMedalhas({ provasDoCalendario, analises: { c: { metades: { primeira: 340, segunda: 320 } }, a: { metades: { primeira: 300, segunda: 320 } } } });
  assert.equal(achar(m, 'primeira-prova').detalhe, 'Corrida A, 1h00min00s');
  assert.equal(achar(m, 'recorde-em-prova').detalhe, 'Corrida C, 55min00s');
  assert.equal(achar(m, 'segunda-metade').data, '2026-09-01');
});

test('corrida marcada como prova pelo relógio também conta', () => {
  const m = calcularMedalhas({ corridas: [corrida('a', '2026-03-01', 5, 1800, { prova: true, nome: 'Rústica' })] });
  assert.equal(achar(m, 'primeira-prova').conquistada, true);
});

test('corrida fora da janela baixada continua valendo, e a apagada na janela some', () => {
  const inicio = '2026-01-01';
  const arquivo = [corrida('antiga', '2025-06-01', 30, 12000), corrida('apagada', '2026-02-01', 40, 16000)];
  const atuais = [corrida('nova', '2026-03-01', 5, 1800)];
  assert.deepEqual(juntarCorridas(arquivo, atuais, inicio).map((a) => a.id), ['antiga', 'nova']);
  const salvo = arquivarCorridas(arquivo, atuais, inicio);
  assert.deepEqual(Object.keys(salvo[0]).sort(), ['data', 'id', 'km', 'prova', 'seg', 'subida']);
  assert.equal(achar(calcularMedalhas({ corridas: juntarCorridas(arquivo, atuais, inicio) }), 'maior-distancia').detalhe, '30 km');
});

test('só aparece como nova a conquista ainda não vista, e recorde batido aparece de novo', () => {
  const uma = calcularMedalhas({ corridas: [corrida('a', '2026-01-01', 5, 1800)] });
  assert.ok(medalhasNovas(uma, null).length > 0);
  const vistas = chavesConquistadas(uma);
  assert.deepEqual(medalhasNovas(uma, vistas), []);
  const duas = calcularMedalhas({ corridas: [corrida('a', '2026-01-01', 5, 1800), corrida('b', '2026-02-01', 6, 2100)] });
  assert.ok(medalhasNovas(duas, vistas).some((m) => m.id === 'maior-distancia'));
});
