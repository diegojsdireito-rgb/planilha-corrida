import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularEnvioAutomatico, proximoEnvio } from '../src/envio.js';

const sessao = (data, nome = 'Leve') => ({ id: `pc-${data}`, data, nome });
const assinar = (s) => s.nome;
const ids = (r) => r.enviar.map((s) => s.data);

// Semana 1 (seg 09/11): qua, sex, dom. Semana 2 (seg 16/11): seg, qua.
const sessoes = ['2026-11-11', '2026-11-13', '2026-11-15', '2026-11-16', '2026-11-18'].map((d) => sessao(d));
const calcular = (hoje, assinaturas = {}, lista = sessoes) => calcularEnvioAutomatico({ sessoes: lista, assinaturas, assinar, hoje });

test('não envia antes da antecedência', () => {
  assert.deepEqual(ids(calcular('2026-11-07')), []);
});

test('três dias antes do primeiro treino, envia a semana inteira e só ela', () => {
  assert.deepEqual(ids(calcular('2026-11-08')), ['2026-11-11', '2026-11-13', '2026-11-15']);
});

test('semana que começa na segunda sai no fim de semana anterior', () => {
  const enviadas = { 'pc-2026-11-11': 'Leve', 'pc-2026-11-13': 'Leve', 'pc-2026-11-15': 'Leve' };
  assert.deepEqual(ids(calcular('2026-11-12', enviadas)), []);
  assert.deepEqual(ids(calcular('2026-11-13', enviadas)), ['2026-11-16', '2026-11-18']);
});

test('quem ficou dias sem abrir o app recebe a semana pendente, sem treinos já vencidos', () => {
  assert.deepEqual(ids(calcular('2026-11-14')), ['2026-11-15']);
});

test('não reenvia o que não mudou', () => {
  const enviadas = Object.fromEntries(sessoes.map((s) => [s.id, 'Leve']));
  const r = calcular('2026-11-10', enviadas);
  assert.deepEqual([ids(r), r.remover], [[], []]);
});

test('treino já enviado que a revisão mudou é atualizado, mesmo de semana distante', () => {
  const enviadas = Object.fromEntries(sessoes.map((s) => [s.id, 'Leve']));
  const lista = [sessoes[0], sessoes[1], sessoes[2], sessoes[3], sessao('2026-11-18', 'Limiar')];
  assert.deepEqual(ids(calcular('2026-11-05', enviadas, lista)), ['2026-11-18']);
});

test('treino que saiu da planilha é removido, mas o passado fica', () => {
  const enviadas = { 'pc-2026-11-01': 'Leve', 'pc-2026-11-12': 'Leve', 'pc-2026-11-11': 'Leve' };
  assert.deepEqual(calcular('2026-11-05', enviadas).remover, ['pc-2026-11-12']);
});

test('mostra a data do próximo envio', () => {
  assert.equal(proximoEnvio({ sessoes, assinaturas: {}, hoje: '2026-11-04' }), '2026-11-08');
  assert.equal(proximoEnvio({ sessoes, assinaturas: {}, hoje: '2026-11-09' }), '2026-11-09');
  const todas = Object.fromEntries(sessoes.map((s) => [s.id, 'Leve']));
  assert.equal(proximoEnvio({ sessoes, assinaturas: todas, hoje: '2026-11-04' }), null);
});
