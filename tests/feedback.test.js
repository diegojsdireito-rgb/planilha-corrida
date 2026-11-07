import test from 'node:test';
import assert from 'node:assert/strict';
import { chaveDoFeedback, corridaSemFeedback, feedbackPorSemana, nomeDaSensacao, sensacaoDoFeel, valoresDoFeedback } from '../src/feedback.js';
import { aderenciaDoTreino, compararEtapas, desvioDoRitmo, etapasDoTreino } from '../src/planejado.js';
import { analisarRevisao, detalharSessao } from '../src/motor.js';
import { normalizarAtividade } from '../src/icu.js';

const HOJE = '2026-11-20';
const sessoes = [{ id: 's1', data: '2026-11-19' }];
const corrida = (id, data, extra = {}) => ({ id, data, km: 5, seg: 2400, ...extra });

test('a sensação do intervals.icu vem invertida', () => {
  assert.equal(sensacaoDoFeel(1), 5);
  assert.equal(sensacaoDoFeel(5), 1);
  assert.equal(sensacaoDoFeel(0), null);
  assert.equal(sensacaoDoFeel(null), null);
  assert.equal(nomeDaSensacao(4), 'Bem');
  const a = normalizarAtividade({ id: 'i', start_date_local: '2026-11-01T06:30:00', distance: 5000, moving_time: 1800, feel: 2, average_cadence: 71, icu_training_load: 40 });
  assert.equal(a.sensacaoDoRelogio, 4);
  assert.equal(a.cadencia, 142);
  assert.equal(a.carga, 40);
  assert.equal(normalizarAtividade({ average_cadence: 142 }).cadencia, 142);
});

test('a chave é o treino, ou a própria corrida quando não há treino', () => {
  assert.equal(chaveDoFeedback(corrida('a', '2026-11-19'), sessoes), 's1');
  assert.equal(chaveDoFeedback(corrida('b', '2026-11-18'), sessoes), 'b');
  assert.equal(chaveDoFeedback(corrida('b', '2026-11-18'), sessoes, { b: 's1' }), 's1');
});

test('a resposta do app vale mais que a do relógio', () => {
  const c = [corrida('a', '2026-11-19', { rpe: 6, sensacaoDoRelogio: 4 })];
  assert.deepEqual(valoresDoFeedback(undefined, c), { esforco: 6, sensacao: 4, dor: false, doRelogio: true, semNota: false });
  const v = valoresDoFeedback({ esforco: 8, sensacao: 2, dor: true }, c);
  assert.deepEqual([v.esforco, v.sensacao, v.dor, v.doRelogio], [8, 2, true, false]);
});

test('pergunta pela corrida recente sem resposta, e para quando há resposta', () => {
  const corridas = [corrida('velha', '2026-11-10'), corrida('a', '2026-11-19')];
  assert.equal(corridaSemFeedback({ corridas, sessoes, hoje: HOJE }).chave, 's1');
  assert.equal(corridaSemFeedback({ corridas, sessoes, avaliacoes: { s1: { esforco: 5 } }, hoje: HOJE }), null);
  assert.equal(corridaSemFeedback({ corridas, sessoes, avaliacoes: { s1: { semNota: true } }, hoje: HOJE }), null);
  assert.equal(corridaSemFeedback({ corridas: [corrida('a', '2026-11-19', { rpe: 7 })], sessoes, hoje: HOJE }), null);
});

test('o feedback por semana faz a média e deixa vão sem resposta', () => {
  const r = feedbackPorSemana({
    avaliacoes: { s1: { esforco: 6, sensacao: 4 }, x: { data: '2026-11-17', esforco: 8 }, y: { data: '2026-11-03', sensacao: 2 }, z: { dor: true } },
    sessoes,
    hoje: HOJE,
    semanas: 3,
  });
  assert.deepEqual(r.map((s) => s.data), ['2026-11-02', '2026-11-09', '2026-11-16']);
  assert.deepEqual(r.map((s) => s.esforco), [null, null, 7]);
  assert.deepEqual(r.map((s) => s.sensacao), [2, null, 4]);
});

const plano = (tipo = 'leve') => ({
  vdot: 30,
  sessoes: [
    { id: 'a', data: '2026-11-10', distanciaKm: 5, tipo },
    { id: 'b', data: '2026-11-12', distanciaKm: 5, tipo },
    { id: 'c', data: '2026-11-14', distanciaKm: 5, tipo },
  ],
});
const feitas = [corrida('1', '2026-11-10'), corrida('2', '2026-11-12'), corrida('3', '2026-11-14')];
const revisar = (avaliacoes, p = plano()) => analisarRevisao({ plano: p, atividades: feitas, avaliacoes, hoje: '2026-11-16' });

test('treino leve repetidamente pesado segura o aumento, sem reduzir', () => {
  assert.equal(revisar({ a: { esforco: 7 } }).acao, 'seguir');
  const r = revisar({ a: { esforco: 7 }, b: { esforco: 7 } });
  assert.equal(r.acao, 'manter');
  assert.match(r.motivos.join(' '), /leves/);
  assert.equal(revisar({ a: { esforco: 7 }, b: { esforco: 7 } }, plano('intervalado')).acao, 'seguir');
});

test('sensação baixa em 3 respostas segura o aumento; um dia ruim não', () => {
  assert.equal(revisar({ a: { sensacao: 1 } }).acao, 'seguir');
  const r = revisar({ a: { sensacao: 2 }, b: { sensacao: 2 }, c: { sensacao: 2 } });
  assert.equal(r.acao, 'manter');
  assert.match(r.motivos.join(' '), /sensação/i);
  assert.equal(revisar({ a: { sensacao: 2 }, b: { sensacao: 4 }, c: { sensacao: 4 } }).acao, 'seguir');
});

test('dor continua mandando sobre o feedback', () => {
  assert.equal(revisar({ a: { sensacao: 5, esforco: 3, dor: true } }).acao, 'reduzir');
});

test('dor marcada em corrida fora de treino chega à Revisão', () => {
  const atividades = [...feitas, corrida('extra', '2026-11-13', { dor: true })];
  const r = analisarRevisao({ plano: plano(), atividades, hoje: '2026-11-16' });
  assert.equal(r.acao, 'reduzir');
  assert.match(r.motivos.join(' '), /marcou dor/);
});

const ritmo = { de: 420, ate: 440 };
const etapas = [
  { rotulo: 'Aquecimento', minutos: 10, tempoSeg: 600, ritmo },
  { rotulo: 'Tiro', km: 0.4, tempoSeg: 150, ritmo: { de: 380, ate: 400 } },
  { rotulo: 'Trote', km: 0.1, tempoSeg: 43, ritmo },
];

test('o desvio do ritmo respeita a faixa e a tolerância', () => {
  assert.equal(desvioDoRitmo(430, ritmo), 0);
  assert.equal(desvioDoRitmo(444, ritmo), 0);
  assert.equal(desvioDoRitmo(460, ritmo), 20);
  assert.equal(desvioDoRitmo(400, ritmo), -20);
  assert.equal(desvioDoRitmo(300, 300), 0);
});

test('compara etapa por etapa quando as voltas batem, e guarda as extras', () => {
  const voltas = [{ km: 1.47, seg: 601 }, { km: 0.4, seg: 152 }, { km: 0.1, seg: 64 }, { km: 0.05, seg: 20 }];
  const r = compararEtapas(etapas, voltas);
  assert.equal(r.linhas.length, 3);
  assert.equal(r.linhas[0].situacao, 'rapido');
  assert.equal(r.linhas[1].situacao, 'dentro');
  assert.equal(r.linhas[2].situacao, 'lento');
  assert.equal(r.linhas[2].desvio, 200);
  assert.equal(r.extras.length, 1);
});

test('não compara corrida livre com volta automática de 1 km', () => {
  const voltas = [{ km: 1, seg: 420 }, { km: 1, seg: 425 }, { km: 1, seg: 430 }];
  assert.equal(compararEtapas(etapas, voltas), null);
  assert.equal(compararEtapas(etapas, [{ km: 1, seg: 600 }]), null);
  assert.equal(compararEtapas([etapas[0]], voltas), null);
});

test('as etapas abrem as repetições na ordem', () => {
  const sessao = { tipo: 'intervalado', blocos: [
    { rotulo: 'Aquecimento', repeticoes: 1, passos: [{ minutos: 10, ritmo: { de: 420, ate: 440 }, zona: 'leve' }] },
    { rotulo: 'Série', repeticoes: 2, passos: [{ km: 0.4, ritmo: 380, zona: 'intervalado' }, { km: 0.1, ritmo: { de: 420, ate: 440 }, zona: 'recuperacao' }] },
  ] };
  const lista = etapasDoTreino(detalharSessao(sessao, 30));
  assert.deepEqual(lista.map((e) => e.rotulo), ['Aquecimento', 'Série', 'Recuperação', 'Série', 'Recuperação']);
  assert.equal(lista[3].km, 0.4);
  assert.ok(lista[0].tempoSeg === 600);
});

test('aderência combina distância e ritmo e aponta a maior diferença', () => {
  const certa = aderenciaDoTreino({ previstoKm: 5, km: 5, seg: 2150, ritmo });
  assert.equal(certa.total, 1);
  assert.equal(certa.maiorDivergencia, null);
  const curta = aderenciaDoTreino({ previstoKm: 5, km: 2.5, seg: 1075, ritmo });
  assert.equal(curta.total, 0.75);
  assert.equal(curta.maiorDivergencia, 'Distância');
  const lenta = aderenciaDoTreino({ previstoKm: 5, km: 5, seg: 2500, ritmo });
  assert.equal(lenta.ritmo, 0);
  assert.equal(lenta.maiorDivergencia, 'Ritmo');
  const comMeta = aderenciaDoTreino({ previstoKm: 5, km: 5, seg: 2500, ritmo, dentroDaMeta: 0.8 });
  assert.equal(comMeta.ritmo, 0.8);
  assert.equal(aderenciaDoTreino({ previstoKm: 5, km: 0, seg: 0, ritmo }), null);
});
