import test from 'node:test';
import assert from 'node:assert/strict';
import { diasParaMudar, encaixarProvas, gerarPlano, referenciaDaMeta, refazerComProvas, segundaDaSemana, somarDias } from '../src/motor.js';
import {
  avisosDaProva,
  corridaDaProva,
  erroDaProva,
  escolherPrincipal,
  longaoAlcancavel,
  marcarCorridasDeProva,
  melhoresPorDistancia,
  objetivoDaProva,
  provasDoCiclo,
  provasRealizadas,
  registrarResultados,
  volumeDoPlano,
} from '../src/provas.js';

const perfil = { idade: 35, pesoKg: 72, alturaCm: 178, lesaoRecente: false, diasSemana: [2, 4, 6, 0], diaLongo: 0 };
const INICIO = '2026-11-09';
const prova = (id, data, distanciaKm, prioridade = 'A', meta = 'terminar') => ({ id, nome: `Prova ${id}`, data, distanciaKm, prioridade, meta });
const parametros = (extra = {}) => ({
  perfil,
  objetivo: { distanciaKm: 21.1, dataProva: '2027-04-04', meta: 'tempo', nome: 'Meia' },
  base: { kmSemana: 25, longoKm: 10 },
  vdot: 45,
  inicio: INICIO,
  ...extra,
});

test('a principal é a próxima A; sem A, a próxima prova', () => {
  const provas = [prova('c', '2027-01-10', 5, 'C'), prova('a2', '2027-06-06', 42.2), prova('a1', '2027-04-04', 21.1), prova('velha', '2026-01-01', 10)];
  assert.equal(escolherPrincipal(provas, INICIO).id, 'a1');
  assert.equal(escolherPrincipal([prova('c', '2027-01-10', 5, 'C')], INICIO).id, 'c');
  assert.equal(escolherPrincipal([prova('velha', '2026-01-01', 10)], INICIO), null);
});

test('o ciclo tem só as provas futuras antes da principal', () => {
  const principal = prova('a1', '2027-04-04', 21.1);
  const provas = [prova('c', '2027-01-10', 5, 'C'), principal, prova('a2', '2027-06-06', 42.2), prova('velha', '2026-01-01', 10)];
  assert.deepEqual(provasDoCiclo(provas, principal, INICIO).map((p) => p.id), ['c']);
  assert.deepEqual(provasDoCiclo(provas, null, INICIO).map((p) => p.id), ['c', 'a1', 'a2']);
  assert.deepEqual(objetivoDaProva(principal), { distanciaKm: 21.1, dataProva: '2027-04-04', meta: 'terminar', nome: 'Prova a1' });
  assert.deepEqual(objetivoDaProva(null), { distanciaKm: null, dataProva: null, meta: 'terminar' });
});

test('o cadastro da prova confere nome, data e distância', () => {
  const ok = { nome: 'Corrida', data: '2027-01-10', distanciaKm: 10 };
  assert.equal(erroDaProva(ok, INICIO), null);
  assert.match(erroDaProva({ ...ok, nome: '' }, INICIO), /nome/);
  assert.match(erroDaProva({ ...ok, data: '2026-01-01' }, INICIO), /passou/);
  assert.match(erroDaProva({ ...ok, distanciaKm: 0 }, INICIO), /distância/);
});

test('prova secundária entra no plano e tira o treino forte da semana', () => {
  const data = '2027-02-14'; // domingo
  const plano = gerarPlano(parametros({ provas: [prova('c', data, 5, 'C')] }));
  const semana = plano.sessoes.filter((s) => segundaDaSemana(s.data) === segundaDaSemana(data));
  const dela = semana.find((s) => s.data === data);
  assert.equal(dela.tipo, 'prova');
  assert.equal(dela.prioridade, 'C');
  assert.equal(dela.nome, 'Prova c');
  assert.equal(dela.semana, semana[0].semana);
  assert.ok(!semana.some((s) => ['limiar', 'intervalado', 'ritmo'].includes(s.tipo)));
  assert.equal(plano.sessoes.filter((s) => s.data === data).length, 1);
  assert.equal(plano.sessoes.at(-1).data, '2027-04-04');
  assert.equal(plano.sessoes.at(-1).nome, 'Meia');
  assert.equal(plano.sessoes.find((s) => s.data === somarDias(data, 1)), undefined);
});

test('prova B reduz os 2 dias antes; C mantém, salvo longão na véspera', () => {
  const treino = (data, tipo, km) => ({ id: `pc-${data}`, data, tipo, nome: tipo, distanciaKm: km, semana: 3, fase: 'base', recuperacao: false, blocos: [] });
  const ritmos = { leve: { de: 300, ate: 330 } };
  const sessoes = [treino('2027-01-07', 'leve', 8), treino('2027-01-09', 'longo', 14)];
  const opcoes = { inicio: INICIO, desde: INICIO, ritmos };
  const b = encaixarProvas(sessoes, [prova('b', '2027-01-10', 5, 'B')], opcoes);
  assert.equal(b.find((s) => s.data === '2027-01-09').tipo, 'leve');
  assert.equal(b.find((s) => s.data === '2027-01-09').distanciaKm, 7);
  const semLongoNaVespera = [treino('2027-01-09', 'leve', 8)];
  assert.equal(encaixarProvas(semLongoNaVespera, [prova('b', '2027-01-10', 5, 'B')], opcoes).find((s) => s.data === '2027-01-09').distanciaKm, 4);
  assert.equal(encaixarProvas(semLongoNaVespera, [prova('c', '2027-01-10', 5, 'C')], opcoes).find((s) => s.data === '2027-01-09').distanciaKm, 8);
});

test('prova longa secundária tira treino forte das semanas seguintes', () => {
  const objetivo = { distanciaKm: 42.2, dataProva: '2027-06-06', meta: 'tempo' };
  const data = '2027-03-14';
  const plano = gerarPlano(parametros({ objetivo, provas: [prova('meia', data, 21.1, 'B')] }));
  const depois = plano.sessoes.filter((s) => s.data > data && s.data < somarDias(data, 14));
  assert.ok(depois.length > 0);
  assert.ok(!depois.some((s) => ['limiar', 'intervalado', 'ritmo'].includes(s.tipo)));
});

test('prova secundária não trava mudar o dia nas semanas seguintes', () => {
  const plano = gerarPlano(parametros({ provas: [prova('c', '2027-01-10', 5, 'C')] }));
  const depois = plano.sessoes.find((s) => s.data > '2027-01-17' && s.tipo === 'leve');
  assert.ok(diasParaMudar({ plano, sessao: depois, atividades: [], hoje: INICIO }).length > 0);
});

test('nova principal refaz da próxima segunda, mantém o passado e a carga', () => {
  const plano = gerarPlano(parametros());
  const hoje = '2026-12-03';
  const objetivo = { distanciaKm: 42.2, dataProva: '2027-06-06', meta: 'tempo', nome: 'Maratona' };
  const r = refazerComProvas({ plano, parametros: { perfil, objetivo }, provas: [prova('c', '2027-01-10', 5, 'C')], hoje });
  assert.equal(r.aPartirDe, '2026-12-07');
  assert.deepEqual(r.plano.sessoes.filter((s) => s.data < hoje), plano.sessoes.filter((s) => s.data < hoje));
  assert.equal(r.plano.sessoes.at(-1).nome, 'Maratona');
  assert.ok(r.plano.sessoes.some((s) => s.data === '2027-01-10' && s.tipo === 'prova'));
  assert.ok(Math.abs(r.depois.km - r.antes.km) <= r.antes.km * 0.35, `${r.antes.km} para ${r.depois.km}`);
});

test('prova nesta semana entra só no que não passou; prova retirada sai', () => {
  const plano = gerarPlano(parametros());
  const hoje = '2026-12-03'; // quinta
  const args = { plano, parametros: { perfil, objetivo: parametros().objetivo }, hoje };
  const com = refazerComProvas({ ...args, provas: [prova('c', '2026-12-05', 5, 'C')] });
  const dela = com.plano.sessoes.find((s) => s.data === '2026-12-05');
  assert.equal(dela.tipo, 'prova');
  assert.deepEqual(com.plano.sessoes.filter((s) => s.data < hoje), plano.sessoes.filter((s) => s.data < hoje));
  const sem = refazerComProvas({ ...args, plano: com.plano, provas: [] });
  assert.ok(!sem.plano.sessoes.some((s) => s.tipo === 'prova' && s.data === '2026-12-05'));
});

test('volume do plano ignora a prova e soma as 4 semanas seguidas maiores', () => {
  const s = (semana, km, tipo = 'leve') => ({ semana, distanciaKm: km, tipo });
  const v = volumeDoPlano([s(1, 10), s(2, 20), s(3, 20), s(4, 15), s(5, 30), s(5, 42, 'prova'), s(6, 5)]);
  assert.deepEqual(v, { pico: 30, quatroSemanas: 85, maior: 30 });
});

test('referência cobre distância sem plano com a próxima maior', () => {
  assert.equal(referenciaDaMeta({ distanciaKm: 15, meta: 'terminar' }).longo, 16);
  assert.equal(referenciaDaMeta({ distanciaKm: 10, meta: 'tempo' }).quatroSemanas, 111);
});

test('avisos comparam prazo, volume e longão, sem bloquear', () => {
  const pouco = avisosDaProva({ prova: prova('m', '2027-02-07', 42.2), base: { kmSemana: 15, longoKm: 8 }, hoje: INICIO });
  assert.match(pouco.join(' '), /Faltam 12 semanas.*18/);
  assert.match(pouco.join(' '), /15 km por semana.*24 km/);
  assert.match(pouco.join(' '), /longão chegaria/);
  const bem = avisosDaProva({ prova: prova('d', '2027-02-07', 10), base: { kmSemana: 25, longoKm: 10 }, hoje: INICIO });
  assert.deepEqual(bem, []);
});

test('avisa sobre outra maratona a menos de 8 semanas e sobre distância sem plano', () => {
  const a = prova('a', '2027-06-06', 42.2);
  const b = prova('b', '2027-07-18', 42.2);
  const base = { kmSemana: 60, longoKm: 30 };
  assert.match(avisosDaProva({ prova: a, base, hoje: INICIO, todas: [a, b] }).join(' '), /menos de 8 semanas/);
  assert.match(avisosDaProva({ prova: prova('x', '2027-06-06', 15), base, hoje: INICIO }).join(' '), /próxima distância maior/);
});

const corrida = (id, data, km, seg, extra = {}) => ({ id, data, km, seg, nome: 'Corrida', prova: false, ...extra });

test('reconhece a corrida da prova pela data e distância parecida', () => {
  const dez = prova('d', '2027-02-07', 10);
  assert.equal(corridaDaProva(dez, [corrida('aq', '2027-02-07', 2, 700), corrida('p', '2027-02-07', 10.2, 3000)]).id, 'p');
  assert.equal(corridaDaProva(dez, [corrida('aq', '2027-02-07', 2, 700)]), null);
  assert.equal(corridaDaProva(dez, [corrida('p', '2027-02-08', 10, 3000)]), null);
});

test('guarda o resultado e congela a previsão do primeiro registro', () => {
  const atividades = [corrida('p', '2027-02-07', 10.1, 3000)];
  const [uma] = registrarResultados([prova('d', '2027-02-07', 10)], atividades, 40);
  assert.equal(uma.resultado.seg, 3000);
  assert.equal(uma.resultado.atividadeId, 'p');
  assert.ok(uma.resultado.vdot > 30 && uma.resultado.vdot < 45);
  const previsto = uma.resultado.previstoSeg;
  const [de_novo] = registrarResultados([uma], atividades, 50);
  assert.equal(de_novo.resultado.previstoSeg, previsto);
  const [semCorrida] = registrarResultados([uma], [], 50);
  assert.deepEqual(semCorrida, uma);
});

test('marca a corrida da prova para contar no nível, sem tocar nas outras', () => {
  const r = marcarCorridasDeProva([corrida('p', '2027-02-07', 10, 3000), corrida('t', '2027-02-05', 8, 2800)], [prova('d', '2027-02-07', 10)]);
  assert.deepEqual(r.map((a) => a.prova), [true, false]);
});

test('lista provas do calendário e as marcadas pelo relógio, sem repetir', () => {
  const [feita] = registrarResultados([prova('d', '2027-02-07', 10)], [corrida('p', '2027-02-07', 10, 3000)], 40);
  const atividades = [corrida('p', '2027-02-07', 10, 3000, { prova: true }), corrida('r', '2027-03-07', 5, 1400, { prova: true, nome: 'Rústica' }), corrida('t', '2027-03-01', 8, 2800)];
  const lista = provasRealizadas([feita, prova('futura', '2027-05-01', 21.1)], atividades);
  assert.deepEqual(lista.map((p) => p.nome), ['Rústica', 'Prova d']);
  assert.equal(lista[0].previstoSeg, null);
});

test('melhor tempo é por distância', () => {
  const lista = [
    { nome: 'a', distanciaKm: 10, seg: 3000 },
    { nome: 'b', distanciaKm: 10, seg: 2900 },
    { nome: 'c', distanciaKm: 5, seg: 1500 },
  ];
  assert.deepEqual(melhoresPorDistancia(lista).map((p) => p.nome), ['c', 'b']);
});

test('longão alcançável aplica o limite a cada semana', () => {
  assert.equal(longaoAlcancavel(10, 0), 10);
  assert.equal(longaoAlcancavel(0, 1), 6);
  assert.equal(longaoAlcancavel(20, 2), 24);
});
