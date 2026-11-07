import test from 'node:test';
import assert from 'node:assert/strict';
import { analisarRevisao, calcularVdot, etapasDaIniciacao, gerarPlano, refazerComNivel, semMetaDePace, detalharSessao } from '../src/motor.js';
import { situacaoDoTreino } from '../src/cumprimento.js';
import { eventoDaSessao } from '../src/icu.js';
import { formatarRitmo } from '../src/motor.js';
import { avaliarTeste, desmarcarTeste, distanciaEmDozeMinutos, erroDoTeste, marcarTeste, primeiraDataDoTeste, registrarTeste, reporTestes, resultadoDasCurvas, retesteEm, sessoesParaTeste, vo2DoCooper } from '../src/testes.js';

const base = { kmSemana: 0, longoKm: 0 };
const objetivo = { distanciaKm: null, dataProva: null, meta: 'terminar' };
const corpo = { idade: 30, pesoKg: 70, alturaCm: 175, lesaoRecente: false, diasSemana: [2, 4, 6, 0], diaLongo: 0 };
const planoDe = (experiencia, extra = {}) => gerarPlano({ perfil: { ...corpo, experiencia, ...extra }, objetivo, vdot: 30, inicio: '2026-11-09', base });

test('quem ainda não corre começa alternando corrida e caminhada, 3 vezes por semana', () => {
  const plano = planoDe('nao-corre');
  const semana1 = plano.sessoes.filter((s) => s.semana === 1);
  assert.equal(semana1.length, 3);
  assert.equal(semana1[0].fase, 'iniciacao');
  assert.equal(semana1[0].minutosCorrida, 1);
  assert.deepEqual(semana1[0].blocos[1].passos.map((p) => [p.rotulo, p.minutos]), [['Corrida', 1], ['Caminhada', 2]]);
  assert.equal(semana1[0].blocos[1].repeticoes, 8);
  assert.ok(semana1.every((s) => s.minutosTotal === 34 && semMetaDePace(s)));
  assert.ok(semana1[0].distanciaKm <= 3.5);
});

test('a iniciação termina em 25 min contínuos e a planilha normal continua depois', () => {
  const plano = planoDe('nao-corre');
  const etapas = etapasDaIniciacao({ experiencia: 'nao-corre', prudente: false });
  const ultima = plano.sessoes.filter((s) => s.semana === etapas.length);
  assert.equal(ultima[0].minutosCorrida, 25);
  assert.equal(ultima[0].blocos[1].passos.length, 1);
  const seguinte = plano.sessoes.filter((s) => s.semana === etapas.length + 1);
  assert.ok(seguinte.every((s) => !s.minutosTotal && s.distanciaKm >= 3));
  assert.equal(plano.totalSemanas, etapas.length + 12);
});

test('o trecho de corrida nunca diminui e cresce sem saltos enormes', () => {
  const etapas = etapasDaIniciacao({ experiencia: 'nao-corre', prudente: true });
  etapas.forEach((e, i) => {
    if (i) assert.ok(e.corrida >= etapas[i - 1].corrida && e.corrida - etapas[i - 1].corrida <= 5);
  });
});

test('modo cuidadoso repete etapas, e até 10 min começa no meio', () => {
  const normal = etapasDaIniciacao({ experiencia: 'nao-corre', prudente: false });
  assert.ok(etapasDaIniciacao({ experiencia: 'nao-corre', prudente: true }).length > normal.length);
  assert.equal(etapasDaIniciacao({ experiencia: 'ate10', prudente: false })[0].corrida, 5);
  assert.deepEqual(etapasDaIniciacao({ experiencia: 'ate30', prudente: false }), []);
  assert.deepEqual(etapasDaIniciacao({ prudente: false }), []);
});

test('quem já corre continua com a mesma planilha de antes', () => {
  const antes = gerarPlano({ perfil: corpo, objetivo, vdot: 30, inicio: '2026-11-09', base });
  const agora = planoDe('mais30');
  assert.deepEqual(agora.sessoes, antes.sessoes);
});

test('prova perto demais encurta a iniciação e avisa', () => {
  const plano = gerarPlano({ perfil: { ...corpo, experiencia: 'nao-corre' }, objetivo: { distanciaKm: 5, dataProva: '2027-01-03', meta: 'terminar' }, vdot: 30, inicio: '2026-11-09', base });
  assert.ok(plano.avisos.some((a) => a.includes('iniciação')));
  assert.equal(plano.sessoes.at(-1).tipo, 'prova');
});

test('treino por tempo é cumprido pelo tempo, sem depender de distância', () => {
  const sessao = planoDe('nao-corre').sessoes[0];
  const corrida = (seg) => ({ id: 1, data: sessao.data, km: 0.8, seg });
  assert.equal(situacaoDoTreino({ sessao, corridas: [corrida(30 * 60)], hoje: sessao.data }).situacao, 'feito');
  assert.equal(situacaoDoTreino({ sessao, corridas: [corrida(10 * 60)], hoje: sessao.data }).situacao, 'parcial');
});

test('a revisão da iniciação compara tempo, não distância', () => {
  const plano = planoDe('nao-corre');
  const semana = plano.sessoes.filter((s) => s.semana <= 2);
  const atividades = semana.map((s) => ({ id: s.id, data: s.data, km: 1.5, seg: 34 * 60 }));
  const r = analisarRevisao({ plano, atividades, hoje: '2026-11-23' });
  assert.equal(r.acao, 'seguir');
  assert.match(r.motivos[0], /min de .* min/);
});

test('corrida e caminhada vão ao relógio sem alvo de pace e com o nome de cada trecho', () => {
  const evento = eventoDaSessao(planoDe('nao-corre').sessoes[0], formatarRitmo);
  assert.match(evento.description, /Principal 8x\n- Corrida 1m\n- Caminhada 2m/);
  assert.doesNotMatch(evento.description.split('\n\n').slice(1).join('\n'), /Pace/);
  assert.match(evento.name, /34 min$/);
  assert.doesNotMatch(evento.name, /km/);
});

test('teste substitui um treino leve e pode ser desmarcado', () => {
  const plano = planoDe('mais30');
  const leve = plano.sessoes.find((s) => s.tipo === 'leve');
  const marcado = marcarTeste(plano, leve.id, 'cooper');
  const sessao = marcado.sessoes.find((s) => s.id === leve.id);
  assert.equal(sessao.tipo, 'teste');
  assert.equal(sessao.minutosTotal, 32);
  assert.ok(semMetaDePace(sessao));
  assert.deepEqual(detalharSessao(sessao, 30).blocos.map((b) => b.rotulo), ['Aquecimento', 'Teste', 'Volta à calma']);
  assert.match(eventoDaSessao(sessao, formatarRitmo).description, /- Teste 12m/);
  assert.deepEqual(desmarcarTeste(marcado, leve.id).sessoes, plano.sessoes);
});

test('teste de 3 km vai ao relógio por distância', () => {
  const plano = planoDe('mais30');
  const leve = plano.sessoes.find((s) => s.tipo === 'leve');
  const sessao = marcarTeste(plano, leve.id, 'tres').sessoes.find((s) => s.id === leve.id);
  assert.match(eventoDaSessao(sessao, formatarRitmo).description, /- Teste 3km/);
});

test('na iniciação o teste só libera quando os trechos de corrida crescem', () => {
  const plano = planoDe('nao-corre');
  const hoje = '2026-11-09';
  assert.deepEqual(sessoesParaTeste({ plano, chave: 'cooper', hoje }), []);
  const data = primeiraDataDoTeste(plano, 'cooper', hoje);
  assert.equal(plano.sessoes.find((s) => s.data === data).minutosCorrida, 9);
  assert.ok(primeiraDataDoTeste(plano, 'tres', hoje) > data);
  assert.ok(sessoesParaTeste({ plano, chave: 'cooper', hoje: data }).length > 0);
});

test('não oferece treino já feito nem dois testes na mesma semana', () => {
  const plano = planoDe('mais30');
  const hoje = '2026-11-09';
  const leves = sessoesParaTeste({ plano, chave: 'cooper', hoje });
  const sem = sessoesParaTeste({ plano, chave: 'cooper', corridas: [{ data: leves[0].data }], hoje });
  assert.ok(!sem.some((s) => s.id === leves[0].id));
  const marcado = marcarTeste(plano, leves[0].id, 'tres');
  const mesmaSemana = sessoesParaTeste({ plano: marcado, chave: 'cooper', hoje });
  assert.ok(!mesmaSemana.some((s) => s.semana === leves[0].semana));
});

test('refazer a planilha mantém o teste marcado', () => {
  const plano = planoDe('mais30');
  const leve = plano.sessoes.find((s) => s.tipo === 'leve' && s.semana === 3);
  const marcado = marcarTeste(plano, leve.id, 'cooper');
  const novo = reporTestes(marcado, plano, '2026-11-09');
  assert.equal(novo.sessoes.find((s) => s.id === leve.id).tipo, 'teste');
  assert.equal(novo.sessoes.filter((s) => s.tipo === 'teste').length, 1);
});

test('12 minutos: acha a melhor janela e recusa corrida curta', () => {
  const tempo = Array.from({ length: 1001 }, (_, i) => i);
  const distancia = tempo.map((t) => (t <= 100 ? t * 2 : 200 + (t - 100) * 3));
  assert.ok(Math.abs(distanciaEmDozeMinutos({ tempo, distancia }) - 2.16) < 0.01);
  assert.equal(distanciaEmDozeMinutos({ tempo: tempo.slice(0, 600), distancia }), null);
  assert.equal(distanciaEmDozeMinutos({ tempo: null, distancia: null }), null);
  assert.deepEqual(resultadoDasCurvas('cooper', { tempo, distancia }), { km: 2.16, seg: 720 });
});

test('3 km: usa o melhor trecho da corrida', () => {
  const tempo = Array.from({ length: 1301 }, (_, i) => i);
  const distancia = tempo.map((t) => t * 2.5);
  const velocidade = tempo.map(() => 2.5);
  const r = resultadoDasCurvas('tres', { tempo, distancia, velocidade });
  assert.equal(r.km, 3);
  assert.ok(Math.abs(r.seg - 1200) <= 1);
});

test('avaliação usa VDOT e a fórmula de Cooper', () => {
  const cooper = avaliarTeste({ chave: 'cooper', km: 2.4 });
  assert.equal(cooper.vo2, Math.round(vo2DoCooper(2.4) * 10) / 10);
  assert.equal(cooper.vo2, 42.4);
  assert.equal(cooper.vdot, Math.round(calcularVdot(2.4, 720) * 10) / 10);
  assert.equal(cooper.ritmo, 300);
  const tres = avaliarTeste({ chave: 'tres', seg: 1200 });
  assert.equal(tres.vo2, null);
  assert.equal(tres.km, 3);
  assert.equal(avaliarTeste({ chave: 'cooper', km: 0.6 }).vdot, null);
});

test('validação do resultado', () => {
  assert.match(erroDoTeste({ chave: 'cooper', data: '2026-12-01', km: 2 }, '2026-11-09'), /futura/);
  assert.match(erroDoTeste({ chave: 'cooper', data: '2026-11-01', km: 9 }, '2026-11-09'), /Confira/);
  assert.match(erroDoTeste({ chave: 'tres', data: '2026-11-01', seg: 100 }, '2026-11-09'), /Confira/);
  assert.equal(erroDoTeste({ chave: 'tres', data: '2026-11-01', seg: 1200 }, '2026-11-09'), null);
});

test('histórico substitui o mesmo teste e sugere repetir em 8 semanas', () => {
  const lista = registrarTeste(registrarTeste([], { id: 'b', data: '2026-11-09' }), { id: 'a', data: '2026-10-01' });
  assert.deepEqual(lista.map((t) => t.id), ['a', 'b']);
  assert.equal(registrarTeste(lista, { id: 'b', data: '2026-11-09', km: 3 }).length, 2);
  assert.equal(retesteEm(lista), '2027-01-04');
  assert.equal(retesteEm([]), null);
});

test('novo nível refaz só da próxima segunda em diante', () => {
  const plano = planoDe('mais30');
  const parametros = { perfil: { ...corpo, experiencia: 'mais30' }, objetivo, provas: [] };
  const r = refazerComNivel({ plano, parametros, vdot: 40, hoje: '2026-11-18' });
  assert.equal(r.aPartirDe, '2026-11-23');
  assert.equal(r.plano.vdot, 40);
  assert.deepEqual(r.plano.sessoes.filter((s) => s.data < '2026-11-23'), plano.sessoes.filter((s) => s.data < '2026-11-23'));
  const longo = r.plano.sessoes.find((s) => s.data >= '2026-11-23');
  assert.ok(longo.blocos[0].passos[0].ritmo.de < plano.ritmos.leve.de);
});
