import test from 'node:test';
import assert from 'node:assert/strict';
import {
  avaliacoesDaRevisao,
  avaliacoesDasSemanas,
  corridasDoTreino,
  corridasParaLigar,
  erroDaCorridaManual,
  sessaoDaCorrida,
  sessoesDispensadas,
  situacaoDoTreino,
} from '../src/cumprimento.js';
import { feitoForaDosTreinos, gradeDoMes, resumoDaAtividade } from '../src/calendario.js';
import { analisarRevisao, estimarVdot } from '../src/motor.js';
import { arquivarCorridas, calcularMedalhas } from '../src/medalhas.js';

const HOJE = '2026-11-14';
const sessao = { id: 't1', data: '2026-11-10', distanciaKm: 5 };
const outra = { id: 't2', data: '2026-11-12', distanciaKm: 5 };
const corrida = (id, data, km, seg = km * 400) => ({ id, data, km, seg });
const situacao = (extra) => situacaoDoTreino({ sessao, hoje: HOJE, ...extra });

test('cumprido a partir de 80% da distância, parcial abaixo disso', () => {
  assert.equal(situacao({ corridas: [corrida('a', '2026-11-10', 4)] }).situacao, 'feito');
  assert.equal(situacao({ corridas: [corrida('a', '2026-11-10', 3.9)] }).situacao, 'parcial');
  const duas = situacao({ corridas: [corrida('a', '2026-11-10', 2), corrida('b', '2026-11-10', 2.5)] });
  assert.equal(duas.situacao, 'feito');
  assert.equal(duas.km, 4.5);
});

test('sem corrida: planejado até o dia, sem registro depois, e não feito se informado', () => {
  assert.equal(situacaoDoTreino({ sessao, hoje: '2026-11-09' }).situacao, 'planejado');
  assert.equal(situacaoDoTreino({ sessao, hoje: '2026-11-10' }).situacao, 'planejado');
  assert.equal(situacaoDoTreino({ sessao, hoje: '2026-11-11' }).situacao, 'perdido');
  const r = situacao({ naoFeitos: { t1: { motivo: 'viagem' } } });
  assert.equal(r.situacao, 'nao-feito');
  assert.equal(r.motivo, 'viagem');
});

test('a corrida que chega depois vale mais que o não fiz', () => {
  const r = situacao({ corridas: [corrida('a', '2026-11-10', 5)], naoFeitos: { t1: { motivo: 'viagem' } } });
  assert.equal(r.situacao, 'feito');
  assert.equal(r.motivo, null);
});

test('corrida de outro dia ligada conta no treino, e sai do dia dela', () => {
  const extra = corrida('x', '2026-11-13', 5);
  const ligacoes = { x: 't1' };
  assert.equal(situacao({ corridas: [extra], ligacoes }).situacao, 'feito');
  assert.deepEqual(corridasDoTreino(sessao, [extra], ligacoes), [extra]);
  assert.equal(sessaoDaCorrida(extra, [sessao, outra], ligacoes).id, 't1');
  assert.equal(sessaoDaCorrida(extra, [sessao, outra], {}), null);
  assert.equal(sessaoDaCorrida(corrida('y', '2026-11-12', 3), [sessao, outra], {}).id, 't2');
});

test('só sugere corrida da mesma semana, em dia sem treino e ainda não ligada', () => {
  const corridas = [corrida('boa', '2026-11-13', 5), corrida('outraSemana', '2026-11-17', 5), corrida('emTreino', '2026-11-12', 5), corrida('ligada', '2026-11-14', 5)];
  const r = corridasParaLigar({ sessao, sessoes: [sessao, outra], corridas, ligacoes: { ligada: 't2' } });
  assert.deepEqual(r.map((a) => a.id), ['boa']);
});

test('corrida manual também pode ser ligada', () => {
  const manual = { id: null, idManual: 'cm-1', data: '2026-11-13', km: 5, seg: 2000, manual: true };
  assert.equal(situacao({ corridas: [manual], ligacoes: { 'cm-1': 't1' } }).situacao, 'feito');
});

test('doença e dor dispensam, os demais motivos não', () => {
  const naoFeitos = { a: { motivo: 'doenca' }, b: { motivo: 'dor' }, c: { motivo: 'tempo' } };
  assert.deepEqual(sessoesDispensadas(naoFeitos), ['a', 'b']);
  assert.deepEqual(Object.keys(avaliacoesDasSemanas({}, naoFeitos)), ['a', 'b']);
  assert.deepEqual(Object.keys(avaliacoesDaRevisao({ z: { esforco: 5 } }, naoFeitos)), ['z', 'b']);
});

test('a Revisão não cobra o treino dispensado e continua vendo a dor', () => {
  const plano = { vdot: 30, sessoes: [{ id: 'a', data: '2026-11-05', distanciaKm: 5 }, { id: 'b', data: '2026-11-07', distanciaKm: 5 }] };
  const atividades = [corrida('r', '2026-11-05', 5)];
  const comFalta = analisarRevisao({ plano, atividades, hoje: '2026-11-10' });
  assert.equal(comFalta.acao, 'reduzir');
  const dispensado = analisarRevisao({ plano, atividades, dispensados: ['b'], hoje: '2026-11-10' });
  assert.equal(dispensado.acao, 'seguir');
  const comDor = analisarRevisao({ plano, atividades, dispensados: ['b'], avaliacoes: avaliacoesDaRevisao({}, { b: { motivo: 'dor' } }), hoje: '2026-11-10' });
  assert.equal(comDor.acao, 'reduzir');
  assert.match(comDor.motivos.join(' '), /marcou dor/);
});

test('corrida manual confere data, distância e tempo', () => {
  const v = { data: HOJE, km: 5, seg: 1800 };
  assert.equal(erroDaCorridaManual(v, HOJE), null);
  assert.match(erroDaCorridaManual({ ...v, data: '' }, HOJE), /data/);
  assert.match(erroDaCorridaManual({ ...v, data: '2026-11-15' }, HOJE), /futura/);
  assert.match(erroDaCorridaManual({ ...v, km: 0 }, HOJE), /distância/);
  assert.match(erroDaCorridaManual({ ...v, seg: 0 }, HOJE), /tempo/);
  assert.match(erroDaCorridaManual({ ...v, seg: 300 }, HOJE), /rápido/);
});

test('corrida manual conta no volume, mas não no nível nem nos recordes', () => {
  const manual = { id: null, idManual: 'cm-1', data: '2026-11-01', nome: 'Na esteira', km: 30, seg: 9000, prova: false, manual: true };
  const estimativa = estimarVdot({ atividades: [manual], hoje: HOJE });
  assert.match(estimativa.origem, /valor inicial/);
  const medalhas = calcularMedalhas({ corridas: [manual] });
  const achar = (id) => medalhas.find((m) => m.id === id);
  assert.equal(achar('maior-distancia').conquistada, false);
  assert.equal(achar('primeira-corrida').conquistada, true);
  assert.equal(achar('primeiros-10').conquistada, true);
  assert.deepEqual(arquivarCorridas([], [manual], '2026-01-01'), []);
});

test('o calendário mostra as novas situações e separa o que foi ligado', () => {
  const sessoes = [sessao, outra, { id: 't3', data: '2026-11-05', distanciaKm: 5 }];
  const corridas = [corrida('p', '2026-11-05', 2), corrida('x', '2026-11-13', 5)];
  const naoFeitos = { t2: { motivo: 'doenca' } };
  const ligacoes = { x: 't1' };
  const grade = gradeDoMes({ mes: '2026-11', sessoes, corridas, ligacoes, naoFeitos, hoje: HOJE });
  const dia = (data) => grade.find((d) => d.data === data);
  assert.equal(dia('2026-11-05').situacao, 'parcial');
  assert.equal(dia('2026-11-10').situacao, 'feito');
  assert.equal(dia('2026-11-10').kmDoTreino, 5);
  assert.equal(dia('2026-11-12').situacao, 'nao-feito');
  assert.equal(dia('2026-11-13').situacao, 'feito');
  const r = resumoDaAtividade({ sessoes, corridas, ligacoes, de: '2026-11-01', ate: '2026-12-01' });
  assert.equal(r.planilha.quantidade, 2);
  assert.equal(r.fora.quantidade, 0);
  assert.deepEqual(feitoForaDosTreinos({ segunda: '2026-11-09', sessoes, corridas, ligacoes }), []);
});
