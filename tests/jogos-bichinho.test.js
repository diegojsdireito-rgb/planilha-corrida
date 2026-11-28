import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as bc from '../jogos/src/bichinho.js';
import * as br from '../jogos/src/bichinho-brincadeiras.js';

const H = 3600000;
const T0 = new Date(2026, 10, 21, 10, 0, 0).getTime();
const novo = (especie = 'gato', nome = 'Pipoca', agora = T0) => bc.novoBichinho(especie, nome, agora).bichinho;
const comBarras = (b, barras) => ({ ...b, barras: { ...b.barras, ...barras } });

test('adoção pede espécie e nome válidos', () => {
  assert.ok(bc.novoBichinho('dragao', 'X', T0).erro);
  assert.ok(bc.novoBichinho('gato', '   ', T0).erro);
  const b = bc.novoBichinho('unicornio', '  Nuvem   Rosa  ', T0).bichinho;
  assert.equal(b.nome, 'Nuvem Rosa');
  assert.equal(b.especie, 'unicornio');
  assert.equal(b.atualizado, T0);
  for (const e of bc.ESPECIES) assert.ok(bc.novoBichinho(e.id, 'Mel', T0).bichinho);
});

test('adotar outro bichinho mantém roupinhas, despensa e limite de moedas', () => {
  let b = novo();
  b = { ...b, acessorios: ['coroa'], vestindo: { ...b.vestindo, cabeca: 'coroa' }, despensa: { bolo: 2 }, moedasDia: { dia: bc.diaDe(T0), ganhas: 20 } };
  const c = bc.novoBichinho('dino', 'Rex', T0 + H, b).bichinho;
  assert.equal(c.especie, 'dino');
  assert.deepEqual(c.acessorios, ['coroa']);
  assert.equal(c.vestindo.cabeca, 'coroa');
  assert.equal(c.despensa.bolo, 2);
  assert.equal(c.moedasDia.ganhas, 20);
});

test('normalizar trata ausente, lixo e campos faltando', () => {
  assert.equal(bc.normalizarBichinho(undefined), null);
  assert.equal(bc.normalizarBichinho(null), null);
  assert.equal(bc.normalizarBichinho({ especie: 'dragao' }), null);
  const b = bc.normalizarBichinho({ especie: 'coelho', barras: { fome: 300, limpeza: 'x' }, acessorios: ['coroa', 'nada', 'coroa'], vestindo: { cabeca: 'coroa', olhos: 'oculos-sol' }, despensa: { bolo: 2, maca: 5, pizza: -1 } });
  assert.equal(b.nome, 'Coelhinho');
  assert.equal(b.barras.fome, 100);
  assert.equal(b.barras.limpeza, 70);
  assert.deepEqual(b.acessorios, ['coroa']);
  assert.equal(b.vestindo.cabeca, 'coroa');
  assert.equal(b.vestindo.olhos, null, 'não veste o que não comprou');
  assert.deepEqual(b.despensa, { bolo: 2 });
});

test('barras caem devagar com o tempo, inclusive com o app fechado', () => {
  const b = novo();
  const depois = bc.atualizar(b, T0 + 2 * H);
  assert.equal(depois.barras.fome, 70 - 14);
  assert.equal(depois.barras.limpeza, 80 - 8);
  assert.equal(depois.barras.alegria, 75 - 12);
  assert.equal(depois.barras.energia, 80 - 10);
  assert.equal(depois.atualizado, T0 + 2 * H);
  assert.equal(b.barras.fome, 70, 'não muda o original');
});

test('nunca morre: depois de muito tempo fica no mínimo, tristinho', () => {
  const b = bc.atualizar(novo(), T0 + 400 * 24 * H);
  for (const { id } of bc.BARRAS) assert.equal(b.barras[id], bc.MINIMO);
  assert.equal(bc.humor(b).id, 'triste');
  assert.ok(bc.pedido(b));
});

test('atualizar em pedaços dá o mesmo que de uma vez', () => {
  for (const dormindo of [false, true]) {
    const b = { ...comBarras(novo(), { energia: 30 }), dormindo };
    const deUmaVez = bc.atualizar(b, T0 + 30 * H);
    let aos = b;
    for (let k = 1; k <= 60; k++) aos = bc.atualizar(aos, T0 + k * 0.5 * H);
    for (const { id } of bc.BARRAS) assert.ok(Math.abs(aos.barras[id] - deUmaVez.barras[id]) < 1e-6, id);
    assert.equal(aos.dormindo, deUmaVez.dormindo);
  }
});

test('dormindo a energia sobe e ele acorda sozinho quando enche', () => {
  let b = comBarras(novo(), { energia: 50 });
  assert.ok(bc.dormir(comBarras(b, { energia: 95 })).erro, 'sem sono');
  b = bc.dormir(b).bichinho;
  assert.equal(bc.humor(b).id, 'dormindo');
  const meia = bc.atualizar(b, T0 + H);
  assert.equal(meia.barras.energia, 75);
  assert.equal(meia.dormindo, true);
  const cheio = bc.atualizar(b, T0 + 2 * H); // 50 + 2 × 25 = 100
  assert.equal(cheio.barras.energia, 100);
  assert.equal(cheio.dormindo, false);
  const depois = bc.atualizar(b, T0 + 4 * H); // acordou e passou 2 h acordado
  assert.equal(depois.barras.energia, 90);
  assert.equal(depois.dormindo, false);
  assert.ok(bc.alimentar(b, 'maca').erro, 'não come dormindo');
  assert.ok(bc.acordar(b).bichinho.dormindo === false);
});

test('relógio voltando não estraga nada', () => {
  const b = novo();
  const r = bc.atualizar(b, T0 - 5 * H);
  assert.deepEqual(r.barras, b.barras);
});

test('humor e pedido', () => {
  const b = novo();
  assert.equal(bc.humor(comBarras(b, { fome: 90, limpeza: 90, alegria: 90, energia: 90 })).id, 'feliz');
  assert.equal(bc.humor(comBarras(b, { fome: 50, limpeza: 60, alegria: 60, energia: 60 })).id, 'contente');
  assert.equal(bc.humor(comBarras(b, { fome: 20 })).id, 'triste');
  assert.equal(bc.pedido(comBarras(b, { fome: 90, limpeza: 30, alegria: 35 })).barra, 'limpeza');
  assert.equal(bc.pedido(comBarras(b, { fome: 90, limpeza: 90, alegria: 90, energia: 90 })), null);
});

test('comer: comidas grátis e especiais da despensa', () => {
  const b = comBarras(novo(), { fome: 40 });
  const r = bc.alimentar(b, 'maca');
  assert.equal(r.bichinho.barras.fome, 60);
  assert.ok(bc.alimentar(b, 'bolo').erro, 'sem bolo na despensa');
  const comBolo = { ...b, despensa: { bolo: 1 } };
  const r2 = bc.alimentar(comBolo, 'bolo');
  assert.equal(r2.bichinho.barras.fome, 75);
  assert.deepEqual(r2.bichinho.despensa, {});
  assert.ok(bc.alimentar(comBarras(b, { fome: 98 }), 'maca').erro, 'cheinho');
  assert.equal(bc.alimentar(comBarras(b, { fome: 90 }), 'racao').bichinho.barras.fome, 100, 'não passa de 100');
});

test('brincar: alegria, cansaço e moedas com limite diário', () => {
  let b = comBarras(novo(), { alegria: 40, energia: 90 });
  let carteira = { moedas: 10, skates: ['classico'] };
  const pouco = bc.brincar(b, carteira, 2, T0);
  assert.equal(pouco.ganhas, 0);
  assert.equal(pouco.bichinho.barras.alegria, 40 + 14);
  assert.equal(pouco.bichinho.barras.energia, 78);
  assert.equal(pouco.carteira.moedas, 10);
  let total = 0;
  for (let k = 0; k < 10; k++) {
    b = comBarras(b, { energia: 90 });
    const r = bc.brincar(b, carteira, 8, T0 + k * 60000);
    b = r.bichinho; carteira = r.carteira; total += r.ganhas;
  }
  assert.equal(total, bc.LIMITE_MOEDAS_DIA);
  assert.equal(carteira.moedas, 10 + bc.LIMITE_MOEDAS_DIA);
  assert.deepEqual(carteira.skates, ['classico'], 'não mexe no resto da carteira');
  assert.equal(bc.moedasRestantesHoje(b, T0), 0);
  // no dia seguinte volta a valer
  const amanha = T0 + 24 * H;
  assert.equal(bc.moedasRestantesHoje(b, amanha), bc.LIMITE_MOEDAS_DIA);
  b = comBarras(b, { energia: 90 });
  assert.equal(bc.brincar(b, carteira, 6, amanha).ganhas, bc.MOEDAS_BRINCAR);
  assert.ok(bc.brincar(comBarras(b, { energia: 10 }), carteira, 6, amanha).erro, 'cansado não brinca');
});

test('banho limpa e dá moedas só se estava sujinho', () => {
  const carteira = { moedas: 0 };
  const sujo = bc.banho(comBarras(novo(), { limpeza: 30 }), carteira, T0);
  assert.equal(sujo.bichinho.barras.limpeza, 100);
  assert.equal(sujo.ganhas, bc.MOEDAS_BANHO);
  assert.equal(sujo.carteira.moedas, bc.MOEDAS_BANHO);
  const limpo = bc.banho(comBarras(novo(), { limpeza: 90 }), carteira, T0);
  assert.equal(limpo.ganhas, 0);
});

test('loja: comprar, vestir, trocar e tirar acessórios', () => {
  const b = novo();
  assert.match(bc.comprarAcessorio(b, { moedas: 50 }, 'coroa').erro, /Faltam 300/);
  const r = bc.comprarAcessorio(b, { moedas: 500 }, 'coroa');
  assert.equal(r.carteira.moedas, 150);
  assert.equal(r.bichinho.vestindo.cabeca, 'coroa');
  assert.ok(bc.comprarAcessorio(r.bichinho, r.carteira, 'coroa').erro, 'não compra duas vezes');
  const r2 = bc.comprarAcessorio(r.bichinho, { moedas: 200 }, 'cartola');
  assert.equal(r2.bichinho.vestindo.cabeca, 'cartola', 'troca no mesmo lugar');
  let v = bc.vestir(r2.bichinho, 'coroa').bichinho;
  assert.equal(v.vestindo.cabeca, 'coroa');
  const tirar = bc.vestir(v, 'coroa');
  assert.equal(tirar.tirou, true);
  assert.equal(tirar.bichinho.vestindo.cabeca, null);
  assert.ok(bc.vestir(b, 'oculos-sol').erro);
  for (const a of bc.ACESSORIOS) assert.ok(bc.LUGARES[a.lugar], a.id);
});

test('loja: comidas especiais vão para a despensa', () => {
  const b = novo();
  assert.ok(bc.comprarComida(b, { moedas: 100 }, 'maca').erro, 'maçã é de graça');
  assert.ok(bc.comprarComida(b, { moedas: 5 }, 'bolo').erro);
  const r = bc.comprarComida(b, { moedas: 100 }, 'bolo', 2);
  assert.equal(r.bichinho.despensa.bolo, 2);
  assert.equal(r.carteira.moedas, 50);
});

// ---------- loja maior, quarto, brinquedos e brincadeiras ----------

// Sequência pseudoaleatória repetível para os sorteios.
function semente(n = 1) {
  let x = n;
  return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
}

test('estado antigo (sem quarto, brinquedos e lugares novos) continua valendo', () => {
  const antigo = { versao: 1, especie: 'gato', nome: 'Mia', barras: { fome: 50, limpeza: 50, alegria: 50, energia: 50 }, acessorios: ['coroa', 'gravata'], vestindo: { cabeca: 'coroa', laco: null, olhos: null, pescoco: 'gravata' }, despensa: { bolo: 1 }, moedasDia: { dia: null, ganhas: 0 }, cuidados: 3, atualizado: T0, criado: T0 };
  const b = bc.normalizarBichinho(antigo);
  assert.equal(b.vestindo.cabeca, 'coroa');
  assert.equal(b.vestindo.pescoco, 'gravata');
  assert.equal(b.vestindo.costas, null);
  assert.equal(b.vestindo.corpo, null);
  assert.deepEqual(b.quarto.itens, []);
  assert.equal(b.quarto.usando.tema, null);
  assert.deepEqual(b.brinquedos, []);
  assert.deepEqual(b.recordes, {});
  assert.equal(bc.fatorAlegria(b), 1);
  // e o que foi salvo de novo volta igual
  assert.deepEqual(bc.normalizarBichinho(JSON.parse(JSON.stringify(b))), b);
});

test('normalizar limpa itens desconhecidos do quarto e dos brinquedos', () => {
  const b = bc.normalizarBichinho({ especie: 'dino', quarto: { itens: ['tema-praia', 'xyz', 'cama-nuvem'], usando: { tema: 'tema-praia', cama: 'cama-dossel', tapete: 'xyz' } }, brinquedos: ['ursinho', 'ursinho', 'nave'], recordes: { bolhas: 12, nada: 4, danca: -3 } });
  assert.deepEqual(b.quarto.itens, ['tema-praia', 'cama-nuvem']);
  assert.equal(b.quarto.usando.tema, 'tema-praia');
  assert.equal(b.quarto.usando.cama, null, 'não usa o que não comprou');
  assert.equal(b.quarto.usando.tapete, null);
  assert.deepEqual(b.brinquedos, ['ursinho']);
  assert.deepEqual(b.recordes, { bolhas: 12 });
});

test('catálogos: ids únicos, lugares válidos e preços na faixa', () => {
  const ids = [...bc.ACESSORIOS, ...bc.QUARTO, ...bc.BRINQUEDOS].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(bc.ACESSORIOS.length >= 30);
  for (const a of bc.ACESSORIOS) {
    assert.ok(bc.LUGARES[a.lugar], a.id);
    assert.ok(a.preco >= 80 && a.preco <= 350, a.id);
    for (const l of a.ocupa ?? []) assert.ok(bc.LUGARES[l], a.id);
  }
  for (const q of bc.QUARTO) { assert.ok(bc.LUGARES_QUARTO[q.lugar], q.id); assert.ok(q.preco > 0 && q.preco <= 600, q.id); }
  for (const lugar of Object.keys(bc.LUGARES_QUARTO)) assert.ok(bc.QUARTO.some((q) => q.lugar === lugar), lugar);
  assert.equal(bc.QUARTO.filter((q) => q.lugar === 'tema').length, 3);
  for (const t of bc.BRINQUEDOS) assert.ok(t.preco >= 60 && t.preco <= 250, t.id);
  assert.ok(bc.ACESSORIOS.filter((a) => a.fantasia).length >= 3);
});

test('fantasia completa ocupa cabeça e costas; vestir chapéu tira a fantasia', () => {
  let b = novo();
  let c = { moedas: 5000 };
  for (const id of ['coroa', 'capa', 'tutu', 'abelha', 'laco-rosa']) ({ bichinho: b, carteira: c } = bc.comprarAcessorio(b, c, id));
  // comprar já veste: a abelha tirou coroa, capa e tutu; o laço ficou
  assert.equal(b.vestindo.corpo, 'abelha');
  assert.equal(b.vestindo.cabeca, null);
  assert.equal(b.vestindo.costas, null);
  assert.equal(b.vestindo.laco, 'laco-rosa');
  assert.deepEqual(bc.tiraria(b, 'coroa'), ['abelha']);
  b = bc.vestir(b, 'coroa').bichinho;
  assert.equal(b.vestindo.cabeca, 'coroa');
  assert.equal(b.vestindo.corpo, null, 'o chapéu tirou a fantasia');
  b = bc.vestir(b, 'capa').bichinho;
  b = bc.vestir(b, 'tutu').bichinho;
  assert.equal(b.vestindo.costas, 'capa');
  assert.equal(b.vestindo.corpo, 'tutu');
  b = bc.vestir(b, 'abelha').bichinho;
  assert.deepEqual([b.vestindo.corpo, b.vestindo.cabeca, b.vestindo.costas], ['abelha', null, null]);
  const tirou = bc.vestir(b, 'abelha');
  assert.equal(tirou.tirou, true);
  assert.equal(tirou.bichinho.vestindo.corpo, null);
  // astronauta também ocupa o pescoço
  ({ bichinho: b, carteira: c } = bc.comprarAcessorio(b, c, 'colar'));
  ({ bichinho: b, carteira: c } = bc.comprarAcessorio(b, c, 'astronauta'));
  assert.equal(b.vestindo.pescoco, null);
  // estado salvo esquisito (fantasia + chapéu) é arrumado
  const n = bc.normalizarBichinho({ ...b, vestindo: { ...b.vestindo, cabeca: 'coroa' } });
  assert.equal(n.vestindo.cabeca, null);
  assert.equal(n.vestindo.corpo, 'astronauta');
});

test('quarto: comprar usa na hora, trocar e guardar; tema troca o quarto', () => {
  let b = novo();
  assert.match(bc.comprarQuarto(b, { moedas: 100 }, 'tema-espaco').erro, /Faltam 500/);
  let r = bc.comprarQuarto(b, { moedas: 1300 }, 'tema-espaco');
  assert.equal(r.carteira.moedas, 700);
  assert.equal(r.bichinho.quarto.usando.tema, 'tema-espaco');
  assert.ok(bc.comprarQuarto(r.bichinho, r.carteira, 'tema-espaco').erro, 'não compra duas vezes');
  r = bc.comprarQuarto(r.bichinho, r.carteira, 'tema-praia');
  b = r.bichinho;
  assert.equal(b.quarto.usando.tema, 'tema-praia', 'troca de tema');
  b = bc.usarQuarto(b, 'tema-espaco').bichinho;
  assert.equal(b.quarto.usando.tema, 'tema-espaco');
  const guardou = bc.usarQuarto(b, 'tema-espaco');
  assert.equal(guardou.guardou, true);
  assert.equal(guardou.bichinho.quarto.usando.tema, null, 'volta ao quarto de sempre');
  assert.deepEqual(guardou.bichinho.quarto.itens, ['tema-espaco', 'tema-praia'], 'continua guardado');
  assert.ok(bc.usarQuarto(novo(), 'cama-nuvem').erro);
  r = bc.comprarQuarto(guardou.bichinho, { moedas: 500 }, 'cama-nuvem');
  assert.equal(r.bichinho.quarto.usando.cama, 'cama-nuvem');
  assert.equal(r.bichinho.quarto.usando.tema, null, 'cama não mexe no tema');
});

test('brinquedos deixam a alegria cair mais devagar, com limite', () => {
  let b = comBarras(novo(), { alegria: 80 });
  assert.match(bc.comprarBrinquedo(b, { moedas: 10 }, 'ursinho').erro, /Faltam 150/);
  const r = bc.comprarBrinquedo(b, { moedas: 200 }, 'ursinho');
  assert.equal(r.carteira.moedas, 40);
  assert.ok(bc.comprarBrinquedo(r.bichinho, r.carteira, 'ursinho').erro);
  b = r.bichinho;
  assert.ok(Math.abs(bc.fatorAlegria(b) - 0.9) < 1e-9);
  assert.ok(Math.abs(bc.atualizar(b, T0 + 2 * H).barras.alegria - (80 - 12 * 0.9)) < 1e-9);
  assert.equal(bc.atualizar(b, T0 + 2 * H).barras.fome, novo().barras.fome - 14, 'só a alegria muda');
  const todos = { ...b, brinquedos: bc.BRINQUEDOS.map((x) => x.id) };
  assert.ok(bc.BRINQUEDOS.reduce((t, x) => t + x.efeito, 0) > bc.LIMITE_EFEITO_BRINQUEDOS);
  assert.equal(bc.fatorAlegria(todos), 1 - bc.LIMITE_EFEITO_BRINQUEDOS);
  // em pedaços dá o mesmo
  let aos = todos;
  for (let k = 1; k <= 10; k++) aos = bc.atualizar(aos, T0 + k * 0.5 * H);
  assert.ok(Math.abs(aos.barras.alegria - bc.atualizar(todos, T0 + 5 * H).barras.alegria) < 1e-9);
});

test('brincar com brinquedo do quarto', () => {
  const b = comBarras(novo(), { alegria: 50, energia: 50 });
  assert.ok(bc.brincarComBrinquedo(b, 'carrinho').erro, 'precisa ter');
  const com = { ...b, brinquedos: ['carrinho'] };
  const r = bc.brincarComBrinquedo(com, 'carrinho');
  assert.equal(r.bichinho.barras.alegria, 54);
  assert.ok(bc.brincarComBrinquedo({ ...com, dormindo: true }, 'carrinho').erro);
});

test('terminar brincadeira: moedas na meta e no super, sempre dentro do limite do dia', () => {
  const b = comBarras(novo(), { alegria: 30, energia: 90 });
  const c = { moedas: 0 };
  for (const x of bc.BRINCADEIRAS) {
    assert.ok(x.meta < x.super, x.id);
    const pouco = bc.terminarBrincadeira(b, c, x.id, x.meta - 1, T0);
    assert.equal(pouco.ganhas, 0, x.id);
    assert.equal(pouco.nivel, 'pouco');
    const meta = bc.terminarBrincadeira(b, c, x.id, x.meta, T0);
    assert.equal(meta.ganhas, bc.MOEDAS_BRINCAR, x.id);
    const sup = bc.terminarBrincadeira(b, c, x.id, x.super + 3, T0);
    assert.equal(sup.ganhas, bc.MOEDAS_SUPER, x.id);
    assert.equal(sup.nivel, 'super');
    assert.ok(sup.bichinho.barras.alegria > pouco.bichinho.barras.alegria, x.id);
    assert.equal(sup.bichinho.recordes[x.id], x.super + 3);
    assert.equal(sup.recorde, true);
  }
  // limite do dia vale para todas juntas
  let bb = b; let cc = c; let total = 0;
  for (let k = 0; k < 12; k++) {
    bb = comBarras(bb, { energia: 90 });
    const x = bc.BRINCADEIRAS[k % bc.BRINCADEIRAS.length];
    const r = bc.terminarBrincadeira(bb, cc, x.id, x.super, T0 + k * 60000);
    bb = r.bichinho; cc = r.carteira; total += r.ganhas;
  }
  assert.equal(total, bc.LIMITE_MOEDAS_DIA);
  assert.equal(cc.moedas, bc.LIMITE_MOEDAS_DIA);
  // recorde só sobe
  const menor = bc.terminarBrincadeira(comBarras(bb, { energia: 90 }), cc, 'bolhas', 1, T0);
  assert.equal(menor.recorde, false);
  assert.ok(menor.bichinho.recordes.bolhas >= bc.BRINCADEIRAS.find((x) => x.id === 'bolhas').super);
  assert.ok(bc.terminarBrincadeira(comBarras(b, { energia: 5 }), c, 'danca', 50, T0).erro, 'cansado não brinca');
  assert.ok(bc.terminarBrincadeira(b, c, 'xadrez', 5, T0).erro);
  // a bolinha continua igual à brincadeira antiga
  assert.deepEqual(bc.terminarBrincadeira(b, c, 'bola', 6, T0).bichinho.barras, bc.brincar(b, c, 6, T0).bichinho.barras);
});

test('bolhas: douradas valem mais e aparecem às vezes', () => {
  const rand = semente(7);
  const bolhas = Array.from({ length: 2000 }, (_, k) => br.novaBolha(rand, k % 30));
  const douradas = bolhas.filter((b) => b.dourada).length;
  assert.ok(douradas > 150 && douradas < 450, String(douradas));
  for (const b of bolhas) { assert.ok(b.x > 0.4 && b.x < 0.6); assert.ok(b.sobe > 0); assert.ok(b.tam >= 44); }
  assert.equal(br.pontosBolha({ dourada: true }), 3);
  assert.equal(br.pontosBolha({ dourada: false }), 1);
  assert.ok(br.intervaloBolha(25) < br.intervaloBolha(0));
  assert.ok(br.intervaloBolha(1000) >= 420);
});

test('esconde-esconde: lugares, tentativas e pontos', () => {
  const lugares = br.esconderijos([]);
  assert.equal(lugares.length, 6);
  const comBrinquedos = br.esconderijos(['casinha', 'ursinho', 'carrinho']);
  assert.ok(comBrinquedos.some((l) => l.id === 'casinha'));
  assert.ok(comBrinquedos.some((l) => l.id === 'ursinho'));
  assert.ok(!comBrinquedos.some((l) => l.id === 'caixa'));
  const rand = semente(3);
  let anterior = null;
  for (let k = 0; k < 50; k++) {
    const r = br.novaRodada(rand, lugares, anterior);
    assert.notEqual(r.lugar, anterior, 'muda de lugar a cada rodada');
    assert.ok(lugares.some((l) => l.id === r.lugar));
    anterior = r.lugar;
  }
  const rodada = { ...br.novaRodada(() => 0, lugares), lugar: 'cesto' };
  assert.equal(br.procurar(rodada, 'cesto').rodada.pontos, 3, 'de primeira');
  let p = br.procurar(rodada, 'cortina');
  assert.equal(p.resultado, 'errou');
  assert.equal(br.procurar(p.rodada, 'cortina').resultado, 'repetido', 'olhar de novo não gasta tentativa');
  p = br.procurar(p.rodada, 'vaso');
  const terceira = br.procurar(p.rodada, 'cesto');
  assert.equal(terceira.resultado, 'achou');
  assert.equal(terceira.rodada.pontos, 1);
  const fim = br.procurar(p.rodada, 'poltrona');
  assert.equal(fim.resultado, 'fim');
  assert.equal(fim.rodada.acabou, true);
  assert.equal(fim.rodada.pontos, 0);
  assert.ok(bc.BRINCADEIRAS.find((x) => x.id === 'esconde').super <= br.ESCONDE.rodadas * br.ESCONDE.pontos[0]);
});

test('dança: coreografia no ritmo e julgamento do toque', () => {
  const notas = br.gerarDanca(semente(11));
  assert.equal(notas.length, br.DANCA.notas);
  for (let i = 1; i < notas.length; i++) assert.ok(notas[i].t > notas[i - 1].t);
  for (let i = 2; i < notas.length; i++) assert.ok(!(notas[i].faixa === notas[i - 1].faixa && notas[i].faixa === notas[i - 2].faixa), 'três iguais seguidas');
  const dur = br.duracaoDanca(notas);
  assert.ok(dur >= 20000 && dur <= 40000, String(dur));
  const n0 = notas[0];
  let r = br.julgarToque(notas, n0.faixa, n0.t + 50);
  assert.equal(r.tipo, 'perfeito');
  assert.equal(r.indice, 0);
  assert.equal(r.pontos, 2);
  assert.notEqual(br.julgarToque(r.notas, n0.faixa, n0.t + 50).indice, 0, 'não julga a mesma nota duas vezes');
  r = br.julgarToque(notas, n0.faixa, n0.t - 180);
  assert.equal(r.tipo, 'bom');
  assert.equal(r.pontos, 1);
  assert.notEqual(br.julgarToque(notas, (n0.faixa + 1) % 4, n0.t).indice, 0, 'faixa errada');
  assert.equal(br.julgarToque(notas, n0.faixa, n0.t - 1500).tipo, null, 'cedo demais');
  const m = br.marcarPerdidas(notas, n0.t + 1000);
  assert.ok(m.perdidas >= 1);
  assert.equal(m.notas[0].julgada, 'perdeu');
  // jogando tudo perfeito passa do "muito bem"; metade boa chega na meta
  let todas = notas; let pontos = 0;
  for (const n of notas) { const j = br.julgarToque(todas, n.faixa, n.t); todas = j.notas; pontos += j.pontos; }
  assert.equal(pontos, 2 * notas.length);
  const danca = bc.BRINCADEIRAS.find((x) => x.id === 'danca');
  assert.ok(pontos >= danca.super);
  assert.ok(notas.length * br.DANCA.pontosBom >= danca.meta, 'dá para chegar na meta só com "bom"');
});

test('pega o petisco: o que cai, o alcance e a pontuação', () => {
  const rand = semente(5);
  const coisas = Array.from({ length: 1000 }, (_, k) => br.novoPetisco(rand, k % 30));
  const ruins = coisas.filter((c) => !c.comida).length;
  assert.ok(ruins > 150 && ruins < 400, String(ruins));
  for (const c of coisas) { assert.ok(c.x >= 0.08 && c.x <= 0.92); assert.ok(c.cai > 0); }
  assert.ok(br.alcancou(0.5, 0.6));
  assert.ok(!br.alcancou(0.2, 0.6));
  assert.equal(br.somarPetisco(0, { pontos: -1 }), 0, 'nunca negativo');
  assert.equal(br.somarPetisco(4, { pontos: 3 }), 7);
  assert.ok(br.intervaloPetisco(30) < br.intervaloPetisco(0));
});

test('siga o bichinho: sequência que cresce e conferência', () => {
  const rand = semente(9);
  let seq = br.novaSequencia(rand);
  assert.equal(seq.length, br.SIGA.inicio);
  for (const c of seq) assert.ok(c >= 0 && c < 4);
  const maior = br.crescer(seq, rand);
  assert.equal(maior.length, seq.length + 1);
  assert.deepEqual(maior.slice(0, seq.length), seq, 'cresce sem mudar o começo');
  seq = [0, 2, 1];
  assert.equal(br.conferir(seq, [0]), 'certo');
  assert.equal(br.conferir(seq, [0, 2, 1]), 'completo');
  assert.equal(br.conferir(seq, [0, 1]), 'errado');
  assert.equal(br.pontosSiga(seq, 'completo'), 3);
  assert.equal(br.pontosSiga(seq, 'errado'), 2);
  assert.ok(br.SIGA.maximo >= bc.BRINCADEIRAS.find((x) => x.id === 'siga').super);
});
