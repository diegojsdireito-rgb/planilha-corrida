import test from 'node:test';
import assert from 'node:assert/strict';
import { anelDeProgresso, diasAte, diasDaSemana, fasesDoPlano, perfilDoTreino, trechosDoTreino } from '../src/visual.js';

const detalhe = {
  blocos: [
    { repeticoes: 1, passos: [{ zona: 'leve', tempoSeg: 600 }] },
    { repeticoes: 2, passos: [{ zona: 'intervalado', tempoSeg: 200 }, { zona: 'recuperacao', tempoSeg: 100 }] },
  ],
};

test('o perfil abre as repetições e as frações somam o treino inteiro', () => {
  const trechos = trechosDoTreino(detalhe);
  assert.deepEqual(trechos.map((t) => t.zona), ['leve', 'intervalado', 'recuperacao', 'intervalado', 'recuperacao']);
  assert.equal(trechos[0].fracao, 0.5);
  assert.ok(Math.abs(trechos.reduce((t, p) => t + p.fracao, 0) - 1) < 1e-9);
});

test('prova não tem blocos e não desenha perfil', () => {
  assert.equal(perfilDoTreino({ blocos: [] }), '');
  assert.equal((perfilDoTreino(detalhe).match(/<rect/g) ?? []).length, 5);
});

test('a semana separa feito, perdido, planejado e descanso', () => {
  const sessao = (data) => ({ id: `pc-${data}`, data });
  const dias = diasDaSemana({
    segunda: '2026-11-02',
    sessoes: [sessao('2026-11-02'), sessao('2026-11-03'), sessao('2026-11-06')],
    atividades: [{ data: '2026-11-02', km: 5 }, { data: '2026-11-04', km: 3 }],
    hoje: '2026-11-05',
  });
  assert.equal(dias.length, 7);
  assert.deepEqual(dias.map((d) => d.situacao), ['feito', 'perdido', 'feito', 'descanso', 'planejado', 'descanso', 'descanso']);
  assert.equal(dias[3].ehHoje, true);
  assert.equal(dias[6].data, '2026-11-08');
});

test('as fases agrupam semanas sem repetir', () => {
  const sessoes = [
    { semana: 1, fase: 'base' }, { semana: 1, fase: 'base' }, { semana: 2, fase: 'base' },
    { semana: 3, fase: 'pico' }, { semana: 4, fase: 'polimento' },
  ];
  assert.deepEqual(fasesDoPlano(sessoes), [
    { fase: 'base', semanas: [1, 2] },
    { fase: 'pico', semanas: [3] },
    { fase: 'polimento', semanas: [4] },
  ]);
});

test('anel limita o progresso entre 0% e 100%', () => {
  assert.match(anelDeProgresso(1.8, 'x'), />100%</);
  assert.match(anelDeProgresso(0, 'x'), />0%</);
  assert.doesNotMatch(anelDeProgresso(0, 'x'), /anel-valor/);
});

test('contagem de dias atravessa o mês', () => {
  assert.equal(diasAte('2026-11-05', '2026-12-05'), 30);
  assert.equal(diasAte('2026-11-05', '2026-11-05'), 0);
});
