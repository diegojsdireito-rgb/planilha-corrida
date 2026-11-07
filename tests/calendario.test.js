import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeDoMes, mesDe, resumoDaAtividade, somarMeses } from '../src/calendario.js';

const HOJE = '2026-11-07'; // sábado, antes de a planilha começar
const sessoes = [
  { data: '2026-11-10', distanciaKm: 4 },
  { data: '2026-11-03', distanciaKm: 5 },
  { data: '2026-11-05', distanciaKm: 5 },
];
const corridas = [
  { data: HOJE, km: 6, seg: 2400 },
  { data: '2026-11-05', km: 5, seg: 2000 },
];
const outras = [{ data: HOJE, categoria: 'caminhada', minutos: 30, km: 2.5 }];
const semDados = [{ data: '2026-11-06', km: 0, seg: 1200 }];
const grade = gradeDoMes({ mes: '2026-11', sessoes, corridas, semDados, outras, hoje: HOJE });
const dia = (data) => grade.find((d) => d.data === data);

test('a grade cobre semanas inteiras, de segunda a domingo', () => {
  assert.equal(grade[0].data, '2026-10-26');
  assert.equal(grade.at(-1).data, '2026-12-06'); // 30/11 cai numa segunda
  assert.equal(grade.length % 7, 0);
  assert.equal(dia('2026-10-26').doMes, false);
  assert.equal(dia('2026-11-01').doMes, true);
});

test('corrida antes de a planilha começar aparece como fora da planilha', () => {
  assert.equal(dia(HOJE).situacao, 'extra');
  assert.equal(dia(HOJE).ehHoje, true);
  assert.equal(dia(HOJE).corridas[0].km, 6);
  assert.equal(dia(HOJE).outras[0].categoria, 'caminhada');
});

test('cada dia recebe a sua situação', () => {
  assert.equal(dia('2026-11-05').situacao, 'feito');
  assert.equal(dia('2026-11-03').situacao, 'perdido');
  assert.equal(dia('2026-11-10').situacao, 'planejado');
  assert.equal(dia('2026-11-06').situacao, 'sem-dados');
  assert.equal(dia('2026-11-08').situacao, 'livre');
});

test('só caminhada não transforma o dia em corrida', () => {
  const [d] = gradeDoMes({ mes: '2026-11', outras, hoje: HOJE }).filter((x) => x.data === HOJE);
  assert.equal(d.situacao, 'livre');
  assert.equal(d.outras.length, 1);
});

test('o resumo separa planilha, fora dela, sem dados e outras, e soma o tempo de tudo', () => {
  const r = resumoDaAtividade({ sessoes, corridas, semDados, outras, de: '2026-11-01', ate: '2026-12-01' });
  assert.deepEqual(r.planilha, { quantidade: 1, km: 5, seg: 2000 });
  assert.deepEqual(r.fora, { quantidade: 1, km: 6, seg: 2400 });
  assert.equal(r.semDados.quantidade, 1);
  assert.deepEqual(r.outras, [{ categoria: 'caminhada', nome: 'Caminhada', minutos: 30, quantidade: 1, km: 2.5 }]);
  assert.equal(r.quantidadeOutras, 1);
  assert.equal(r.tempoTotalSeg, 2400 + 2000 + 1200 + 1800);
});

test('o resumo respeita o período, com o fim exclusivo', () => {
  const r = resumoDaAtividade({ sessoes, corridas, outras, de: '2026-11-01', ate: HOJE });
  assert.equal(r.fora.quantidade, 0);
  assert.equal(r.planilha.quantidade, 1);
  assert.equal(r.quantidadeOutras, 0);
});

test('a troca de mês atravessa o ano', () => {
  assert.equal(mesDe(HOJE), '2026-11');
  assert.equal(somarMeses('2026-12', 1), '2027-01');
  assert.equal(somarMeses('2027-01', -1), '2026-12');
});
