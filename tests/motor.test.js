import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analisarRevisao,
  aplicarRevisao,
  baseDasAtividades,
  calcularRitmos,
  calcularVdot,
  detalharSessao,
  diaDaSemana,
  escolherDiasDeTreino,
  estimarVdot,
  formatarRitmo,
  gerarPlano,
  preverTempoSeg,
  proximaSegunda,
  segundaDaSemana,
  somarDias,
  treinosPorSemana,
  VERSAO_REGRAS,
} from '../src/motor.js';

const perfil = { idade: 35, pesoKg: 72, alturaCm: 178, lesaoRecente: false, diasSemana: [2, 4, 6, 0], diaLongo: 0 };
const INICIO = '2026-11-09'; // segunda

const parametros = (extra = {}) => ({
  perfil,
  objetivo: { distanciaKm: 10, dataProva: '2027-02-07' },
  base: { kmSemana: 25, longoKm: 10 },
  vdot: 45,
  inicio: INICIO,
  ...extra,
});

const kmPorSemana = (plano) => {
  const mapa = new Map();
  for (const s of plano.sessoes) mapa.set(s.semana, (mapa.get(s.semana) ?? 0) + s.distanciaKm);
  return [...mapa.values()];
};

test('VDOT confere com as tabelas publicadas de Daniels', () => {
  assert.ok(Math.abs(calcularVdot(5, 20 * 60) - 49.8) < 0.2);
  assert.ok(Math.abs(calcularVdot(10, 50 * 60) - 40) < 1);
  const previsto = preverTempoSeg(calcularVdot(5, 20 * 60), 5);
  assert.ok(Math.abs(previsto - 1200) < 1);
});

test('ritmos do VDOT 50 ficam perto da tabela publicada', () => {
  const r = calcularRitmos(50);
  assert.ok(Math.abs(r.limiar - 255) <= 3, `limiar ${r.limiar}`);
  assert.ok(Math.abs(r.intervalado - 230) <= 3, `intervalado ${r.intervalado}`);
  assert.ok(r.leve.de < r.leve.ate);
  assert.ok(r.intervalado < r.limiar && r.limiar < r.maratona && r.maratona < r.leve.de);
  assert.equal(formatarRitmo(255), '4:15');
});

test('datas não escorregam de dia', () => {
  assert.equal(diaDaSemana('2026-11-09'), 1);
  assert.equal(segundaDaSemana('2026-11-15'), '2026-11-09');
  assert.equal(proximaSegunda('2026-11-09'), '2026-11-09');
  assert.equal(proximaSegunda('2026-11-10'), '2026-11-16');
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01');
});

test('estimativa usa o melhor tempo recente e ignora corrida antiga', () => {
  const atividades = [
    { data: '2026-10-20', km: 5, seg: 1500 },
    { data: '2025-01-01', km: 5, seg: 1100 },
  ];
  const r = estimarVdot({ atividades, hoje: '2026-11-04' });
  assert.ok(Math.abs(r.vdot - calcularVdot(5, 1500)) < 0.1);
  assert.equal(estimarVdot({ hoje: '2026-11-04' }).vdot, 30);
});

test('base semanal é a média dos últimos 28 dias', () => {
  const base = baseDasAtividades(
    [
      { data: '2026-10-30', km: 10 },
      { data: '2026-10-20', km: 30 },
      { data: '2026-01-01', km: 99 },
    ],
    '2026-11-04',
  );
  assert.equal(base.kmSemana, 10);
  assert.equal(base.longoKm, 30);
});

test('plano usa só os dias escolhidos e termina na prova', () => {
  const plano = gerarPlano(parametros());
  const ultima = plano.sessoes.at(-1);
  assert.equal(ultima.tipo, 'prova');
  assert.equal(ultima.data, '2027-02-07');
  for (const s of plano.sessoes) {
    assert.ok(perfil.diasSemana.includes(diaDaSemana(s.data)), `dia fora da escolha: ${s.data}`);
  }
  const ids = plano.sessoes.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('volume sobe no máximo 10% entre semanas de carga e recua no polimento', () => {
  const plano = gerarPlano(parametros({ objetivo: { distanciaKm: 42.2, dataProva: '2027-06-06' } }));
  const semanas = kmPorSemana(plano);
  const naoRecuperacao = semanas.filter((_, i) => (i + 1) % 4 !== 0);
  for (let i = 1; i < naoRecuperacao.length - 4; i++) {
    assert.ok(naoRecuperacao[i] <= naoRecuperacao[i - 1] * 1.16 + 1.5, `semana ${i}: ${naoRecuperacao[i - 1]} para ${naoRecuperacao[i]}`);
  }
  assert.ok(Math.max(...semanas.slice(0, -3)) > semanas.at(-2));
});

test('não há treino forte na base nem em dias colados ao longão', () => {
  const plano = gerarPlano(parametros());
  const fortes = plano.sessoes.filter((s) => ['limiar', 'intervalado', 'ritmo'].includes(s.tipo));
  assert.ok(fortes.length > 0);
  assert.ok(fortes.every((s) => s.fase !== 'base'));
  assert.ok(plano.sessoes.some((s) => s.tipo === 'longo'));
});

test('perfil com lesão progride mais devagar e começa sem treino forte', () => {
  const plano = gerarPlano(parametros({ perfil: { ...perfil, lesaoRecente: true } }));
  assert.equal(plano.prudencia.prudente, true);
  const primeiras = plano.sessoes.filter((s) => s.semana <= 3);
  assert.ok(primeiras.every((s) => ['leve', 'longo'].includes(s.tipo)));
  const normal = gerarPlano(parametros());
  assert.ok(Math.max(...kmPorSemana(plano)) < Math.max(...kmPorSemana(normal)));
});

const maratona4Dias = () =>
  gerarPlano(parametros({ objetivo: { distanciaKm: 42.2, dataProva: '2027-06-06' }, base: { kmSemana: 30, longoKm: 14 } }));

test('com 4 dias, o pico respeita os dias disponíveis', () => {
  assert.ok(Math.max(...kmPorSemana(maratona4Dias()).slice(0, -1)) <= 4 * 14 + 2);
});

test('corrida leve nunca fica longa demais perto do longão da semana', () => {
  const plano = maratona4Dias();
  const semanas = Map.groupBy(plano.sessoes, (s) => s.semana);
  for (const sessoes of semanas.values()) {
    const longo = sessoes.find((s) => s.tipo === 'longo');
    if (!longo) continue;
    for (const leve of sessoes.filter((s) => s.tipo === 'leve')) {
      assert.ok(leve.distanciaKm <= Math.max(3, longo.distanciaKm * 0.75 + 0.5), `${leve.data}: ${leve.distanciaKm} com longão de ${longo.distanciaKm}`);
    }
  }
});

test('maratona chega a um longão de preparação, sem passar de 3 horas', () => {
  const plano = maratona4Dias();
  const maior = Math.max(...plano.sessoes.filter((s) => s.tipo === 'longo').map((s) => s.distanciaKm));
  assert.ok(maior >= 26, `maior longão ${maior}`);
  assert.ok((maior * plano.ritmos.leve.ate) / 60 <= 181);
});

test('iniciante não recebe intervalado em volume baixo', () => {
  const plano = gerarPlano(parametros({
    perfil: { ...perfil, diasSemana: [1, 3, 6], diaLongo: 6 },
    objetivo: { distanciaKm: null, dataProva: null },
    base: { kmSemana: 0, longoKm: 0 },
    vdot: 30,
  }));
  assert.ok(plano.sessoes.every((s) => s.tipo !== 'intervalado'));
  assert.ok(plano.sessoes.slice(0, 3).every((s) => s.tipo === 'leve' || s.tipo === 'longo'));
});

test('treino forte nunca fica no dia seguinte ou anterior ao longão', () => {
  for (const diasSemana of [[1, 3, 6], [2, 4, 6, 0], [1, 2, 4, 6, 0], [1, 2, 3, 4, 5, 6]]) {
    const plano = gerarPlano(parametros({ perfil: { ...perfil, diasSemana, diaLongo: diasSemana.at(-1) }, base: { kmSemana: 40, longoKm: 14 } }));
    for (const sessoes of Map.groupBy(plano.sessoes, (s) => s.semana).values()) {
      const longo = sessoes.find((s) => s.tipo === 'longo');
      if (!longo) continue;
      for (const f of sessoes.filter((s) => ['limiar', 'intervalado', 'ritmo'].includes(s.tipo))) {
        assert.notEqual(f.data, somarDias(longo.data, 1));
        assert.notEqual(f.data, somarDias(longo.data, -1));
      }
    }
  }
});

const seisDiasLivres = [1, 3, 4, 5, 6, 0];
const perfilIniciante = { idade: 39, pesoKg: 98, alturaCm: 171, lesaoRecente: false, diasSemana: seisDiasLivres, diaLongo: 0 };
const planoIniciante = () => gerarPlano(parametros({
  perfil: perfilIniciante,
  objetivo: { distanciaKm: 10, dataProva: '2027-03-14' },
  base: { kmSemana: 12, longoKm: 10 },
  vdot: 28.5,
}));

test('iniciante com seis dias livres treina três, nunca em dias seguidos', () => {
  const semana1 = planoIniciante().sessoes.filter((s) => s.semana === 1);
  assert.equal(semana1.length, 3);
  for (let i = 1; i < semana1.length; i++) {
    assert.notEqual(semana1[i].data, somarDias(semana1[i - 1].data, 1));
  }
  assert.equal(diaDaSemana(semana1.at(-1).data), 0, 'longão continua no dia escolhido');
});

test('primeira semana parte do volume real, sem salto por ter muitos dias livres', () => {
  const total = planoIniciante().sessoes.filter((s) => s.semana === 1).reduce((t, s) => t + s.distanciaKm, 0);
  assert.ok(total <= 12.5, `semana 1 com ${total} km`);
});

test('em volume baixo, treino forte não passa do longão da semana', () => {
  for (const sessoes of Map.groupBy(planoIniciante().sessoes, (s) => s.semana).values()) {
    const longo = sessoes.find((s) => s.tipo === 'longo');
    if (!longo) continue;
    for (const f of sessoes.filter((s) => ['limiar', 'intervalado', 'ritmo'].includes(s.tipo))) {
      assert.ok(f.distanciaKm <= longo.distanciaKm, `${f.data}: forte ${f.distanciaKm}, longão ${longo.distanciaKm}`);
    }
  }
});

test('dias de treino só aumentam quando o volume sustenta', () => {
  assert.equal(treinosPorSemana(12, false, 6), 3);
  assert.equal(treinosPorSemana(25, false, 6), 4);
  assert.equal(treinosPorSemana(40, false, 6), 5);
  assert.equal(treinosPorSemana(60, false, 7), 6);
  assert.equal(treinosPorSemana(60, true, 7), 4);
  assert.equal(treinosPorSemana(25, true, 7), 3);
  assert.equal(treinosPorSemana(60, false, 3), 3);
});

test('sempre sobra pelo menos um dia de descanso, mesmo com todos os dias livres', () => {
  const plano = gerarPlano(parametros({
    perfil: { ...perfil, diasSemana: [0, 1, 2, 3, 4, 5, 6] },
    objetivo: { distanciaKm: 42.2, dataProva: '2027-06-06' },
    base: { kmSemana: 70, longoKm: 25 },
  }));
  for (const sessoes of Map.groupBy(plano.sessoes, (s) => s.semana).values()) {
    assert.ok(sessoes.length <= 6);
  }
});

test('o dia depois do longão é descanso sempre que há escolha', () => {
  const { dias, diaLongo } = escolherDiasDeTreino(seisDiasLivres, 0, 4);
  assert.equal(diaLongo, 0);
  assert.ok(!dias.includes(1), `dias ${dias}`);
  assert.equal(escolherDiasDeTreino([1, 3, 5], 0, 3).diaLongo, 5, 'longão vai para o último dia livre');
});

test('detalhes somam tempo, distância e zonas do treino com repetições', () => {
  const ritmo = { de: 300, ate: 340 };
  const sessao = {
    tipo: 'limiar',
    distanciaKm: 7,
    blocos: [
      { rotulo: 'Aquecimento', repeticoes: 1, passos: [{ km: 2, ritmo, zona: 'leve' }] },
      { rotulo: 'Principal', repeticoes: 3, passos: [{ km: 1, ritmo: 260, zona: 'limiar' }, { minutos: 1, ritmo, zona: 'recuperacao' }] },
    ],
  };
  const d = detalharSessao(sessao, 45);
  assert.equal(d.tempoSeg, 2 * 320 + 3 * 260 + 3 * 60);
  assert.ok(Math.abs(d.distanciaKm - (2 + 3 + (3 * 60) / 320)) < 0.001);
  assert.ok(Math.abs(d.ritmoMedio - d.tempoSeg / d.distanciaKm) < 0.001);
  assert.deepEqual(d.zonas.map((z) => z.codigo), ['Z1', 'Z2', 'Z4']);
  assert.ok(Math.abs(d.zonas.reduce((t, z) => t + z.fracao, 0) - 1) < 0.001);
});

test('detalhes da prova trazem a previsão pelo nível atual', () => {
  const d = detalharSessao({ tipo: 'prova', distanciaKm: 10, blocos: [] }, 45);
  assert.ok(Math.abs(d.tempoSeg - preverTempoSeg(45, 10)) < 0.1);
  assert.equal(d.zonas.length, 0);
});

test('todo treino gerado tem tempo e pace válidos nos detalhes', () => {
  const plano = planoIniciante();
  for (const s of plano.sessoes) {
    const d = detalharSessao(s, plano.vdot);
    assert.ok(d.tempoSeg > 0 && Number.isFinite(d.ritmoMedio), s.id);
    assert.ok(Math.abs(d.distanciaKm - s.distanciaKm) <= 1, `${s.id}: ${d.distanciaKm} para ${s.distanciaKm}`);
  }
});

test('planilha guarda a versão das regras, inclusive depois da revisão', () => {
  const plano = gerarPlano(parametros());
  assert.equal(plano.versaoRegras, VERSAO_REGRAS);
  const analise = analisarRevisao({ plano, atividades: atividadesCom(plano, 1), hoje: HOJE });
  assert.equal(aplicarRevisao({ plano, parametros: parametros(), analise, hoje: HOJE }).versaoRegras, VERSAO_REGRAS);
});

test('sem prova, gera 12 semanas', () => {
  const plano = gerarPlano(parametros({ objetivo: { distanciaKm: null, dataProva: null } }));
  assert.equal(plano.totalSemanas, 12);
  assert.ok(plano.sessoes.every((s) => s.tipo !== 'prova'));
});

test('recusa datas e dias impossíveis', () => {
  assert.throws(() => gerarPlano(parametros({ objetivo: { distanciaKm: 10, dataProva: '2026-11-10' } })), /perto demais/);
  assert.throws(() => gerarPlano(parametros({ objetivo: { distanciaKm: 10, dataProva: '2029-01-01' } })), /mais de um ano/);
  assert.throws(() => gerarPlano(parametros({ perfil: { ...perfil, diasSemana: [1, 2] } })), /3 dias/);
});

// Situação de revisão: duas semanas de plano já passadas.
const HOJE = '2026-11-23';
const previstasDaJanela = (plano) => plano.sessoes.filter((s) => s.data >= somarDias(HOJE, -14) && s.data < HOJE);
const atividadesCom = (plano, fracao) =>
  previstasDaJanela(plano).map((s) => ({ data: s.data, km: s.distanciaKm * fracao, seg: s.distanciaKm * fracao * 400, rpe: null, prova: false }));

test('revisão: treino em dia mantém a progressão', () => {
  const plano = gerarPlano(parametros());
  const analise = analisarRevisao({ plano, atividades: atividadesCom(plano, 1), hoje: HOJE });
  assert.equal(analise.acao, 'seguir');
  assert.ok(analise.adesao > 0.99);
});

test('revisão: adesão baixa reduz e tira treino forte por uma semana', () => {
  const plano = gerarPlano(parametros({ objetivo: { distanciaKm: 10, dataProva: '2027-02-07' }, base: { kmSemana: 40, longoKm: 14 } }));
  const analise = analisarRevisao({ plano, atividades: atividadesCom(plano, 0.4), hoje: HOJE });
  assert.equal(analise.acao, 'reduzir');
  const novo = aplicarRevisao({ plano, parametros: parametros(), analise, hoje: HOJE });
  const semana = novo.sessoes.filter((s) => s.data >= HOJE && s.data < somarDias(HOJE, 7));
  assert.ok(semana.every((s) => ['leve', 'longo'].includes(s.tipo)));
});

test('revisão: dor sempre reduz, mesmo com adesão total', () => {
  const plano = gerarPlano(parametros());
  const id = previstasDaJanela(plano)[0].id;
  const analise = analisarRevisao({
    plano,
    atividades: atividadesCom(plano, 1),
    avaliacoes: { [id]: { esforco: 5, dor: true } },
    hoje: HOJE,
  });
  assert.equal(analise.acao, 'reduzir');
  assert.equal(analise.fator, 0.7);
});

test('revisão: esforço alto segura o aumento', () => {
  const plano = gerarPlano(parametros());
  const atividades = atividadesCom(plano, 1).map((a) => ({ ...a, rpe: 8 }));
  assert.equal(analisarRevisao({ plano, atividades, hoje: HOJE }).acao, 'manter');
});

test('revisão: prova atualiza os ritmos, com limite, e o passado não muda', () => {
  const plano = gerarPlano(parametros());
  const atividades = [...atividadesCom(plano, 1), { data: '2026-11-21', km: 5, seg: 1100, rpe: 9, prova: true }];
  const analise = analisarRevisao({ plano, atividades, hoje: HOJE });
  assert.equal(analise.novoVdot, 48);
  const novo = aplicarRevisao({ plano, parametros: parametros(), analise, hoje: HOJE });
  assert.equal(novo.vdot, 48);
  const passadoAntes = plano.sessoes.filter((s) => s.data < HOJE);
  const passadoDepois = novo.sessoes.filter((s) => s.data < HOJE);
  assert.deepEqual(passadoDepois, passadoAntes);
  assert.equal(novo.sessoes.at(-1).tipo, 'prova');
  assert.equal(new Set(novo.sessoes.map((s) => s.id)).size, novo.sessoes.length);
});

test('revisão: treino leve não derruba os ritmos', () => {
  const plano = gerarPlano(parametros());
  const analise = analisarRevisao({ plano, atividades: atividadesCom(plano, 1), hoje: HOJE });
  assert.equal(analise.novoVdot, plano.vdot);
});

test('revisão sem histórico não altera o plano', () => {
  const plano = gerarPlano(parametros());
  const analise = analisarRevisao({ plano, atividades: [], hoje: '2026-11-05' });
  assert.equal(analise.acao, 'semDados');
  assert.equal(aplicarRevisao({ plano, parametros: parametros(), analise, hoje: '2026-11-05' }), plano);
});
