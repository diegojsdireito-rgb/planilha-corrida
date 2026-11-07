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
  diasParaMudar,
  escolherDiasDeTreino,
  estimarVdot,
  formatarRitmo,
  gerarPlano,
  limiteDaCorrida,
  mudarDiaDaSessao,
  preverTempoSeg,
  proximaSegunda,
  reanalisarPlano,
  refazerComNovosDias,
  segundaDaSemana,
  somarDias,
  treinosPorSemana,
  VERSAO_REGRAS,
} from '../src/motor.js';

const perfil = { idade: 35, pesoKg: 72, alturaCm: 178, lesaoRecente: false, diasSemana: [2, 4, 6, 0], diaLongo: 0 };
const INICIO = '2026-11-09'; // segunda

const parametros = (extra = {}) => ({
  perfil,
  objetivo: { distanciaKm: 10, dataProva: '2027-02-07', meta: 'tempo' },
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

const PROVAS_EM_2027 = [[5, '2027-02-07'], [10, '2027-02-07'], [21.1, '2027-04-04'], [42.2, '2027-06-06']];

test('nenhuma corrida passa do limite sobre a maior dos últimos 30 dias', () => {
  for (const [distanciaKm, dataProva] of PROVAS_EM_2027) {
    for (const meta of ['terminar', 'tempo']) {
      for (const base of [{ kmSemana: 0, longoKm: 0 }, { kmSemana: 25, longoKm: 10 }, { kmSemana: 50, longoKm: 20 }]) {
        const plano = gerarPlano(parametros({ objetivo: { distanciaKm, dataProva, meta }, base }));
        const anteriores = [{ data: INICIO, km: base.longoKm }];
        for (const s of plano.sessoes.filter((x) => x.tipo !== 'prova')) {
          const maior = Math.max(...anteriores.filter((c) => c.data >= somarDias(segundaDaSemana(s.data), -30)).map((c) => c.km), 0);
          assert.ok(s.distanciaKm <= limiteDaCorrida(maior), `${distanciaKm}/${meta}: ${s.nome} com ${s.distanciaKm} km, maior recente ${maior}`);
          anteriores.push({ data: s.data, km: s.distanciaKm });
        }
      }
    }
  }
});

test('limite da corrida é 10%, com acréscimo mínimo de 1 km e base de 5 km', () => {
  assert.equal(limiteDaCorrida(0), 6);
  assert.equal(limiteDaCorrida(8), 9);
  assert.equal(limiteDaCorrida(20), 22);
  assert.equal(limiteDaCorrida(25), 27.5);
});

test('volume e longão seguem a referência da meta, sem passar dos planos', () => {
  const esperado = { terminar: { 5: [13, 5], 10: [17, 9], 21.1: [37, 16], 42.2: [64, 32] }, tempo: { 5: [29, 11], 10: [34, 13], 21.1: [55, 19], 42.2: [71, 32] } };
  const rapido = { ...perfil, diasSemana: [1, 2, 3, 4, 6, 0] };
  for (const [distanciaKm, dataProva] of PROVAS_EM_2027) {
    for (const meta of ['terminar', 'tempo']) {
      const plano = gerarPlano(parametros({ perfil: rapido, vdot: 55, objetivo: { distanciaKm, dataProva, meta }, base: { kmSemana: 10, longoKm: 6 } }));
      const treinos = plano.sessoes.filter((s) => s.tipo !== 'prova');
      const [pico, longo] = esperado[meta][distanciaKm];
      assert.ok(Math.max(...kmPorSemana({ sessoes: treinos })) <= pico * 1.1, `${distanciaKm}/${meta} volume`);
      assert.ok(Math.max(...treinos.map((s) => s.distanciaKm)) <= longo, `${distanciaKm}/${meta} longão`);
    }
  }
});

test('quem já corre mais que a referência não é rebaixado', () => {
  const plano = gerarPlano(parametros({ objetivo: { distanciaKm: 5, dataProva: '2027-02-07', meta: 'terminar' }, base: { kmSemana: 25, longoKm: 12 } }));
  assert.equal(Math.max(...kmPorSemana(plano).slice(0, 1)) >= 20, true);
  assert.equal(plano.sessoes.find((s) => s.tipo === 'longo').distanciaKm > 5, true);
});

test('quem quer completar não recebe treino forte; quem busca tempo recebe', () => {
  const FORTES = ['limiar', 'intervalado', 'ritmo'];
  const com = (meta) => gerarPlano(parametros({ objetivo: { distanciaKm: 10, dataProva: '2027-02-07', meta } }));
  assert.equal(com('terminar').sessoes.some((s) => FORTES.includes(s.tipo)), false);
  assert.equal(com('tempo').sessoes.some((s) => FORTES.includes(s.tipo)), true);
});

test('avisa quando as 3 horas cortam o longão e quando a base está abaixo do plano de tempo', () => {
  const lento = gerarPlano(parametros({ vdot: 25, objetivo: { distanciaKm: 42.2, dataProva: '2027-06-06', meta: 'terminar' }, base: { kmSemana: 30, longoKm: 14 } }));
  assert.match(lento.avisos.join(' '), /3 horas.*32 km/);
  const rapido = gerarPlano(parametros({ vdot: 55, objetivo: { distanciaKm: 10, dataProva: '2027-02-07', meta: 'tempo' }, base: { kmSemana: 10, longoKm: 6 } }));
  assert.match(rapido.avisos.join(' '), /cerca de 24 km por semana/);
  const semAviso = gerarPlano(parametros({ vdot: 55, base: { kmSemana: 30, longoKm: 10 } }));
  assert.deepEqual(semAviso.avisos, []);
});

test('mudar o dia oferece só dias livres da mesma semana, a partir de hoje', () => {
  const plano = gerarPlano(parametros());
  const [primeira] = plano.sessoes;
  const opcoes = diasParaMudar({ plano, sessao: primeira, atividades: [], hoje: INICIO });
  const ocupados = plano.sessoes.map((s) => s.data);
  assert.ok(opcoes.length > 0);
  for (const { data } of opcoes) {
    assert.equal(segundaDaSemana(data), segundaDaSemana(primeira.data));
    assert.ok(!ocupados.includes(data));
  }
  const depoisDeQuarta = diasParaMudar({ plano, sessao: plano.sessoes[2], atividades: [], hoje: somarDias(INICIO, 3) });
  assert.ok(depoisDeQuarta.every((o) => o.data >= somarDias(INICIO, 3)));
});

test('não muda o dia de prova, de treino passado ou de treino já corrido', () => {
  const plano = gerarPlano(parametros());
  const prova = plano.sessoes.find((s) => s.tipo === 'prova');
  const [primeira] = plano.sessoes;
  assert.deepEqual(diasParaMudar({ plano, sessao: prova, atividades: [], hoje: INICIO }), []);
  assert.deepEqual(diasParaMudar({ plano, sessao: primeira, atividades: [], hoje: somarDias(primeira.data, 1) }), []);
  assert.deepEqual(diasParaMudar({ plano, sessao: primeira, atividades: [{ data: primeira.data, km: 5 }], hoje: INICIO }), []);
});

test('avisa quando o treino forte fica colado em outro forte', () => {
  const forte = (data, tipo) => ({ id: `pc-${data}`, data, tipo, distanciaKm: 8 });
  const plano = { sessoes: [forte('2026-11-10', 'limiar'), forte('2026-11-15', 'longo')] };
  const opcoes = diasParaMudar({ plano, sessao: plano.sessoes[0], atividades: [], hoje: INICIO });
  assert.match(opcoes.find((o) => o.data === '2026-11-14').aviso, /forte/);
  assert.equal(opcoes.find((o) => o.data === '2026-11-11').aviso, null);
});

test('não move treino para depois da prova na semana dela', () => {
  const plano = gerarPlano(parametros({ objetivo: { distanciaKm: 10, dataProva: '2027-02-04' } }));
  const prova = plano.sessoes.find((s) => s.tipo === 'prova');
  const antes = plano.sessoes.find((s) => s.semana === prova.semana && s.tipo !== 'prova');
  const opcoes = diasParaMudar({ plano, sessao: antes, atividades: [], hoje: INICIO });
  assert.ok(opcoes.every((o) => o.data < prova.data));
});

test('mudar o dia troca a data e o id e mantém a lista em ordem', () => {
  const plano = gerarPlano(parametros());
  const [primeira, segunda] = plano.sessoes;
  const novaData = somarDias(segunda.data, 1);
  const novo = mudarDiaDaSessao(plano, primeira.id, novaData);
  const movida = novo.sessoes.find((s) => s.data === novaData);
  assert.equal(movida.id, `pc-${novaData}`);
  assert.equal(movida.nome, primeira.nome);
  assert.equal(novo.sessoes.length, plano.sessoes.length);
  assert.ok(novo.sessoes.every((s, i) => i === 0 || novo.sessoes[i - 1].data <= s.data));
});

test('novos dias refazem só da próxima segunda e respeitam os dias escolhidos', () => {
  const plano = gerarPlano(parametros());
  const hoje = somarDias(INICIO, 23); // quinta da 4ª semana
  const r = refazerComNovosDias({ plano, parametros: { perfil, objetivo: parametros().objetivo }, diasSemana: [1, 3, 5, 6], diaLongo: 6, hoje });
  assert.equal(r.aPartirDe, proximaSegunda(hoje));
  assert.deepEqual(r.plano.sessoes.filter((s) => s.data < r.aPartirDe), plano.sessoes.filter((s) => s.data < r.aPartirDe));
  const novas = r.plano.sessoes.filter((s) => s.data >= r.aPartirDe && s.tipo !== 'prova');
  assert.ok(novas.every((s) => [1, 3, 5, 6].includes(diaDaSemana(s.data))));
  assert.ok(novas.filter((s) => s.tipo === 'longo').every((s) => diaDaSemana(s.data) === 6));
  assert.equal(r.plano.sessoes.find((s) => s.tipo === 'prova').data, '2027-02-07');
  assert.deepEqual(r.perfil.diasSemana, [1, 3, 5, 6]);
});

test('novos dias não devolvem o volume ao início, mesmo sem corridas', () => {
  const plano = gerarPlano(parametros());
  const hoje = somarDias(INICIO, 30); // já perto do meio do ciclo
  const r = refazerComNovosDias({ plano, parametros: { perfil, objetivo: parametros().objetivo }, diasSemana: [1, 3, 5, 6], diaLongo: 6, hoje });
  assert.equal(r.plano.vdot, plano.vdot);
  assert.ok(Math.abs(r.depois.km - r.antes.km) <= r.antes.km * 0.15, `${r.antes.km} para ${r.depois.km}`);
});

test('novos dias antes do início refazem a planilha inteira; depois do fim não há o que refazer', () => {
  const plano = gerarPlano(parametros());
  const args = { plano, parametros: { perfil, objetivo: parametros().objetivo }, diasSemana: [1, 3, 5, 6], diaLongo: 6 };
  const antes = refazerComNovosDias({ ...args, hoje: somarDias(INICIO, -2) });
  assert.equal(antes.aPartirDe, INICIO);
  assert.ok(antes.plano.sessoes.filter((s) => s.tipo !== 'prova').every((s) => [1, 3, 5, 6].includes(diaDaSemana(s.data))));
  assert.equal(refazerComNovosDias({ ...args, hoje: '2027-03-01' }), null);
});

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
  assert.ok(kmPorSemana(plano)[1] < kmPorSemana(normal)[1]);
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

test('nova análise usa as corridas reais e devolve a comparação', () => {
  const plano = gerarPlano(parametros({ base: { kmSemana: 12, longoKm: 6 }, vdot: 30 }));
  const atividades = [
    { data: '2026-11-02', km: 12, seg: 12 * 360 },
    { data: '2026-11-04', km: 8, seg: 8 * 330 },
    { data: '2026-10-28', km: 20, seg: 20 * 370 },
  ];
  const r = reanalisarPlano({ plano, parametros: parametros(), atividades, hoje: '2026-11-05' });
  assert.equal(r.base.kmSemana, 10);
  assert.equal(r.base.longoKm, 20);
  assert.ok(r.depois.vdot > r.antes.vdot, `${r.antes.vdot} para ${r.depois.vdot}`);
  assert.equal(r.aPartirDe, INICIO, 'planilha que não começou é refeita inteira');
  assert.equal(r.plano.sessoes.at(-1).tipo, 'prova');
  assert.equal(plano.vdot, 30, 'a planilha original não é alterada');
});

test('nova análise não muda treinos passados nem a semana em andamento', () => {
  const plano = gerarPlano(parametros());
  const atividades = [{ data: '2026-11-20', km: 10, seg: 3000, prova: false }];
  const r = reanalisarPlano({ plano, parametros: parametros(), atividades, hoje: '2026-11-25' });
  assert.equal(r.aPartirDe, '2026-11-30');
  const antes = plano.sessoes.filter((s) => s.data < r.aPartirDe);
  assert.deepEqual(r.plano.sessoes.filter((s) => s.data < r.aPartirDe), antes);
  assert.equal(new Set(r.plano.sessoes.map((s) => s.id)).size, r.plano.sessoes.length);
  assert.ok(r.plano.sessoes.filter((s) => s.data >= r.aPartirDe).length > 0);
});

test('nova análise não se aplica a planilha já encerrada', () => {
  const plano = gerarPlano(parametros());
  assert.equal(reanalisarPlano({ plano, parametros: parametros(), atividades: [], hoje: '2027-03-01' }), null);
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

test('o longão nunca fica menor que outro treino da semana, mesmo em recuperação com volume baixo', () => {
  const falhas = [];
  const inicio = '2026-11-09';
  const cenarios = [
    { distanciaKm: null, dataProva: null, meta: 'terminar' },
    { distanciaKm: 5, dataProva: '2027-02-07', meta: 'terminar' },
    { distanciaKm: 5, dataProva: '2027-02-07', meta: 'tempo' },
    { distanciaKm: 10, dataProva: '2027-03-07', meta: 'terminar' },
    { distanciaKm: 10, dataProva: '2027-03-07', meta: 'tempo' },
    { distanciaKm: 21.1, dataProva: '2027-05-02', meta: 'terminar' },
    { distanciaKm: 21.1, dataProva: '2027-05-02', meta: 'tempo' },
    { distanciaKm: 42.2, dataProva: '2027-08-01', meta: 'tempo' },
  ];
  for (const objetivo of cenarios) {
    for (const lesaoRecente of [false, true]) {
      for (const diasSemana of [[2, 4, 0], [2, 4, 6, 0], [1, 3, 4, 5, 6, 0]]) {
        for (const kmSemana of [0, 3, 6, 9, 12, 15, 20, 30, 45, 60]) {
          for (const longoKm of [0, 3, 6, 10.1, 20]) {
            const perfil = { idade: 39, pesoKg: 75, alturaCm: 178, lesaoRecente, diasSemana, diaLongo: 0 };
            const plano = gerarPlano({ perfil, objetivo, base: { kmSemana, longoKm }, vdot: 30, inicio });
            const semanas = new Map();
            for (const s of plano.sessoes) semanas.set(s.semana, [...(semanas.get(s.semana) ?? []), s]);
            for (const [numero, sessoes] of semanas) {
              const longo = sessoes.find((s) => s.tipo === 'longo');
              if (!longo) continue;
              const maiorLeve = Math.max(0, ...sessoes.filter((s) => s.tipo === 'leve').map((s) => s.distanciaKm));
              if (longo.distanciaKm < maiorLeve) falhas.push({ objetivo: objetivo.distanciaKm, meta: objetivo.meta, lesaoRecente, dias: diasSemana.length, kmSemana, longoKm, numero, longo: longo.distanciaKm, maiorLeve });
            }
          }
        }
      }
    }
  }
  assert.deepEqual(falhas.slice(0, 5), []);
});

test('a planilha do caso real: a semana de recuperação fica com longão de 3 km', () => {
  const perfil = { idade: 39, pesoKg: 82, alturaCm: 178, lesaoRecente: true, diasSemana: [0, 3, 4, 5, 6, 1], diaLongo: 0 };
  const plano = gerarPlano({ perfil, objetivo: { distanciaKm: null, dataProva: null, meta: 'terminar' }, base: { kmSemana: 6, longoKm: 10.1 }, vdot: 28.6, inicio: '2026-11-09' });
  const dia29 = plano.sessoes.find((s) => s.data === '2026-11-29');
  assert.equal(dia29.tipo, 'longo');
  assert.equal(dia29.distanciaKm, 3);
  assert.equal(dia29.recuperacao, true);
});
