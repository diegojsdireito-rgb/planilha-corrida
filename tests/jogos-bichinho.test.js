import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as bc from '../jogos/src/bichinho.js';

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
