import test from 'node:test';
import assert from 'node:assert/strict';
import * as corrida from '../jogos/src/corrida.js';
import * as loja from '../jogos/src/loja.js';

const DT = 1 / 60;
// Pista vazia (sem linhas novas), já no patinete se pedido.
function pista(cfg = {}, { subir = true } = {}) {
  const s = corrida.nova('medio', { cargasPatinete: 1, ...cfg });
  s.ultimaLinha = 1e9;
  if (subir) corrida.comando(s, 'patinete');
  return s;
}
const andar = (s, seg, cada = () => {}) => { for (let k = 0; k < Math.round(seg / DT) && s.vivo; k++) { cada(s, k); corrida.avancar(s, DT); } return s; };

test('patinete: o botão gasta uma carga de patinete (não a do skate) e não liga sem carga', () => {
  const s = pista({ cargas: 2 });
  assert.equal(s.patinete, corrida.DURACAO_PATINETE);
  assert.equal(s.cargasPatinete, 0);
  assert.equal(s.cargas, 2);
  assert.equal(s.contagem.cargasPatineteUsadas, 1);
  assert.equal(s.contagem.patinetes, 1);
  assert.ok(s.eventos.includes('patinete'));
  const sem = pista({ cargasPatinete: 0 });
  assert.equal(sem.patinete, 0);
  // voando não dá para subir
  const voando = pista({}, { subir: false });
  voando.voo = 5;
  corrida.comando(voando, 'patinete');
  assert.equal(voando.patinete, 0);
  assert.equal(voando.cargasPatinete, 1);
  // o modelo escolhido vem da carteira; um id estranho vira o clássico
  assert.equal(pista({ patinete: 'eletrico' }).patineteTipo, 'eletrico');
  assert.equal(pista({ patinete: 'xyz' }).patineteTipo, 'classico');
});

test('patinete: o 🛴 da pista é de graça e um veículo substitui o outro', () => {
  const s = pista({ cargasPatinete: 3, cargas: 1 }, { subir: false });
  s.objetos = [{ tipo: 'patinete', faixa: 1, z: 1, h: 0.7 }];
  andar(s, 0.3);
  assert.ok(s.patinete > 0);
  assert.equal(s.cargasPatinete, 3);
  assert.equal(s.contagem.cargasPatineteUsadas, 0);
  // subir no skate desce do patinete (sem batida)
  corrida.comando(s, 'skate');
  assert.ok(s.skate > 0);
  assert.equal(s.patinete, 0);
  assert.equal(s.patineteSaiu.como, 'troca');
  // e o patinete tira do skate
  s.objetos = [{ tipo: 'patinete', faixa: 1, z: 1, h: 0.7 }];
  andar(s, 0.3);
  assert.ok(s.patinete > 0);
  assert.equal(s.skate, 0);
  // o item aparece nos sorteios da pista
  assert.ok(corrida.ITENS.some(([t]) => t === 'patinete'));
  assert.ok(Math.abs(corrida.ITENS.reduce((t, [, c]) => t + c, 0) - 1) < 1e-9);
});

test('patinete: é mais rápido, conta os metros e acaba sozinho no fim do tempo', () => {
  const a = pista({}, { subir: false }); const b = pista();
  andar(a, 2); andar(b, 2);
  assert.ok(b.dist > a.dist * 1.08, `${b.dist} x ${a.dist}`);
  assert.ok(Math.abs(b.contagem.metrosPatinete - b.dist) < 1e-6);
  andar(b, corrida.DURACAO_PATINETE);
  assert.equal(b.patinete, 0);
  assert.equal(b.patineteSaiu.como, 'tempo');
  const r = corrida.resumo(b);
  assert.equal(r.metrosPatinete, Math.floor(b.contagem.metrosPatinete));
  assert.ok(r.metrosPatinete > 0);
});

test('patinete: aguenta uma batida e some, e o escudo protege antes dele', () => {
  const s = pista();
  s.objetos = [{ tipo: 'carrinho', faixa: 1, z: 4, comp: 5 }];
  const eventos = [];
  andar(s, 1, (x) => { eventos.push(...x.eventos); x.eventos.length = 0; });
  assert.equal(s.vivo, true);
  assert.equal(s.patinete, 0);
  assert.ok(eventos.includes('patinete-quebrou'));
  assert.equal(s.patineteSaiu.como, 'batida');
  // a segunda batida, já sem patinete, derruba
  s.invencivel = 0;
  s.objetos = [{ tipo: 'cerca', faixa: 1, z: 3, comp: 0.4 }];
  andar(s, 1);
  assert.equal(s.vivo, false);
  // com escudo: o escudo vai embora e o patinete continua
  const e = pista();
  e.escudo = true;
  e.objetos = [{ tipo: 'cerca', faixa: 1, z: 3, comp: 0.4 }];
  andar(e, 0.6);
  assert.equal(e.vivo, true);
  assert.equal(e.escudo, false);
  assert.ok(e.patinete > 0);
});

test('patinete: obstáculos em movimento também são absorvidos (e a supercarga atravessa)', () => {
  const s = pista({ cenario: 'neve' });
  s.objetos = [corrida.criarMovel('boladeneve', 12, Math.random, s.vel, { destino: 1, vz: 4 })];
  andar(s, 2);
  assert.equal(s.vivo, true);
  assert.equal(s.patineteSaiu?.como, 'batida');
  const f = pista({ cenario: 'cidade' });
  f.supercarga = 5;
  f.objetos = [corrida.criarMovel('cachorro', 10, Math.random, f.vel, { destino: 1 })];
  andar(f, 1.5);
  assert.equal(f.vivo, true);
  assert.ok(f.patinete > 0, 'a supercarga quebra o obstáculo e o patinete fica');
});

test('patinete: pular faz um rodopio que vale pontos no pouso', () => {
  const s = pista();
  const antes = corrida.pontos(s);
  corrida.comando(s, 'pular');
  assert.equal(s.manobra.voltas, 1);
  const eventos = [];
  andar(s, 1, (x) => { eventos.push(...x.eventos); x.eventos.length = 0; });
  assert.ok(eventos.includes('manobra'));
  assert.equal(s.pontosManobra, corrida.PONTOS_MANOBRA);
  assert.equal(s.contagem.manobras, 1);
  assert.ok(corrida.pontos(s) >= antes + corrida.PONTOS_MANOBRA);
  // sem patinete, pulo é só pulo
  const p = pista({}, { subir: false });
  corrida.comando(p, 'pular'); andar(p, 1);
  assert.equal(p.pontosManobra, 0);
  // o Pisca-Pisca dá o dobro
  const l = pista({ patinete: 'luzes' });
  corrida.comando(l, 'pular'); andar(l, 1);
  assert.equal(l.pontosManobra, 2 * corrida.PONTOS_MANOBRA);
  // com o tênis de mola o pulo é mais longo: dois rodopios
  const m = pista();
  m.superPulo = 10;
  corrida.comando(m, 'pular');
  assert.equal(m.manobra.voltas, 2);
  andar(m, 1.5);
  assert.equal(m.pontosManobra, 2 * corrida.PONTOS_MANOBRA);
  // descer no meio (deslizar no ar) estraga o rodopio
  const d = pista();
  corrida.comando(d, 'pular'); andar(d, 0.15); corrida.comando(d, 'deslizar'); andar(d, 1);
  assert.equal(d.pontosManobra, 0);
  assert.equal(d.contagem.manobras, 0);
});

test('patinete: as moedas da faixa dela vêm até a mão, as das outras faixas não', () => {
  const s = pista();
  s.objetos = [{ tipo: 'moeda', faixa: 1, z: 7, h: 3.2 }, { tipo: 'moeda', faixa: 0, z: 7, h: 3.2 }];
  andar(s, 1);
  assert.equal(s.moedas, 1);
  const sem = pista({}, { subir: false });
  sem.objetos = [{ tipo: 'moeda', faixa: 1, z: 7, h: 3.2 }];
  andar(sem, 1);
  assert.equal(sem.moedas, 0);
});

test('patinete elétrico: turbo curto, uma vez por passeio, atravessa obstáculos', () => {
  const c = pista();
  corrida.comando(c, 'turbo-patinete');
  assert.equal(c.turboPatinete, 0, 'o clássico não tem turbo');
  const s = pista({ patinete: 'eletrico' });
  const v0 = s.vel; andar(s, 0.2);
  corrida.comando(s, 'turbo-patinete');
  assert.equal(s.turboPatinete, corrida.DURACAO_TURBO_PATINETE);
  andar(s, 0.1);
  assert.ok(s.vel > v0 * 1.4);
  s.objetos = [{ tipo: 'carrinho', faixa: 1, z: 3, comp: 5 }];
  andar(s, 1);
  assert.equal(s.vivo, true);
  assert.ok(s.patinete > 0, 'o turbo atravessou sem gastar a proteção');
  andar(s, corrida.DURACAO_TURBO_PATINETE);
  assert.equal(s.turboPatinete, 0);
  corrida.comando(s, 'turbo-patinete');
  assert.equal(s.turboPatinete, 0, 'só uma vez por passeio');
  assert.equal(s.contagem.turbosPatinete, 1);
});

test('patinete: voando de mochila, capa ou nave ele espera guardado', () => {
  for (const item of ['maleta', 'capa', 'nave']) {
    const s = pista();
    corrida.comando(s, 'pular');
    s.objetos = [{ tipo: item, faixa: 1, z: 0.5, h: 0.7 }];
    andar(s, 0.1);
    assert.ok(s.voo > 0, item);
    assert.equal(s.manobra, null, `${item}: decolar cancela o rodopio`);
    const resta = s.patinete;
    andar(s, 2);
    assert.equal(s.patinete, resta, `${item}: o tempo do patinete para enquanto ela voa`);
    andar(s, 20);
    assert.ok(s.voo === 0 && s.patinete < resta, `${item}: depois do pouso volta a contar`);
  }
});

test('loja: comprar, escolher e recarregar patinetes', () => {
  let c = { ...loja.carteiraNova(), moedas: 3000 };
  assert.deepEqual(c.patinetes, ['classico']);
  assert.equal(c.patinete, 'classico');
  assert.equal(c.cargasPatinete, 1);
  assert.ok(loja.comprarPatinete(c, 'eletrico').erro);
  assert.ok(loja.comprarPatinete(c, 'classico').erro);
  c = loja.comprarPatinete(c, 'luzes').carteira;
  assert.equal(c.moedas, 500);
  assert.equal(c.patinete, 'luzes');
  assert.ok(loja.escolherPatinete(c, 'eletrico').erro);
  assert.equal(loja.escolherPatinete(c, 'classico').carteira.patinete, 'classico');
  c = loja.comprarCargasPatinete(c, 1).carteira;
  assert.equal(c.cargasPatinete, 2);
  assert.equal(c.moedas, 500 - loja.PRECO_CARGA_PATINETE);
  assert.ok(loja.comprarCargasPatinete(c, 5).erro);
  // preços em ordem e coerentes com os skates
  const precos = loja.PATINETES_LOJA.map((p) => p.preco);
  assert.deepEqual(precos, [...precos].sort((a, b) => a - b));
  assert.ok(loja.PATINETES_LOJA.every((p) => corrida.PATINETES[p.id]));
  // o fim da corrida desconta as cargas de patinete usadas
  const r = loja.fecharCorrida(c, { moedas: 0, metros: 10, pontos: 10, cargasUsadas: 0, cargasPatineteUsadas: 1 });
  assert.equal(r.carteira.cargasPatinete, 1);
});

test('loja: carteira antiga continua valendo e a cópia de segurança junta os patinetes', () => {
  const antiga = { moedas: 900, skates: ['classico', 'voador'], skate: 'voador', cargas: 3, arrancadas: 0, poderes: { ima: 2 }, missoes: [], feitas: 4 };
  const n = loja.normalizar(antiga);
  assert.equal(n.moedas, 900);
  assert.equal(n.skate, 'voador');
  assert.deepEqual(n.patinetes, ['classico']);
  assert.equal(n.patinete, 'classico');
  assert.equal(n.cargasPatinete, 1);
  // valores estranhos não quebram
  const torta = loja.normalizar({ ...antiga, patinetes: 'x', patinete: 'eletrico', cargasPatinete: -3 });
  assert.deepEqual(torta.patinetes, ['classico']);
  assert.equal(torta.patinete, 'classico');
  assert.equal(torta.cargasPatinete, 1);
  assert.deepEqual(loja.normalizar({ patinetes: ['luzes', 'foguete'], patinete: 'luzes', cargasPatinete: 0 }).patinetes, ['classico', 'luzes']);
  assert.equal(loja.normalizar({ patinetes: ['luzes'], patinete: 'luzes', cargasPatinete: 0 }).cargasPatinete, 0);
  // juntar: uma cópia sem patinete com outra que comprou o elétrico
  const nova = { ...loja.carteiraNova(), patinetes: ['classico', 'eletrico'], patinete: 'eletrico', cargasPatinete: 6 };
  const m = loja.mesclarCarteiras(antiga, nova);
  assert.deepEqual([...m.patinetes].sort(), ['classico', 'eletrico']);
  assert.equal(m.cargasPatinete, 6);
  assert.deepEqual([...m.skates].sort(), ['classico', 'voador']);
  const m2 = loja.mesclarCarteiras(nova, { ...loja.carteiraNova(), patinetes: ['classico', 'luzes'] });
  assert.deepEqual([...m2.patinetes].sort(), ['classico', 'eletrico', 'luzes']);
  assert.equal(m2.patinete, 'eletrico');
});

test('missões de patinete: metros e manobras', () => {
  const tipos = new Set();
  for (let k = 0; k < 400; k++) tipos.add(loja.sortearMissao({ feitas: 0 }, () => (k + 0.5) / 400).tipo);
  assert.ok(tipos.has('metrosPatinete') && tipos.has('manobras'));
  const c = { ...loja.carteiraNova(), missoes: [{ tipo: 'metrosPatinete', alvo: 500, texto: 'Ande 500 m de patinete', premio: 250 }] };
  const curto = loja.fecharCorrida(c, { moedas: 0, metrosPatinete: 499 }, () => 0.5);
  assert.equal(curto.premio, 0);
  const ok = loja.fecharCorrida(c, { moedas: 0, metrosPatinete: 500 }, () => 0.5);
  assert.equal(ok.premio, 250);
  assert.match(loja.sortearMissao({ feitas: 0 }, () => 0.99).texto, /patinete/);
});

test('supercarga que acaba no meio de um super pulo protege até ela pousar', () => {
  const s = pista({}, { subir: false });
  s.supercarga = 0.3;
  corrida.comando(s, 'pular');
  andar(s, 0.35);
  assert.equal(s.supercarga, 0);
  assert.ok(s.y > 0.5);
  assert.ok(s.invencivel > 0.5);
  s.objetos = [{ tipo: 'cerca', faixa: 1, z: 9, comp: 0.4 }];
  andar(s, 1.2);
  assert.equal(s.vivo, true);
});
