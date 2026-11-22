import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as cc from '../jogos/src/cores.js';
import { semente } from '../jogos/src/pintar-formas.js';

let proximoId = 1000;
const carta = (cor, v, id = proximoId++) => ({ id, cor, v });

function jogoCom(maos, cima, cor = cima.cor) {
  return { n: maos.length, maos, monte: cc.baralho(), pilha: [cima], cor, vez: 0, sentido: 1, ultima: Array(maos.length).fill(false), comprou: null, vencedor: null };
}

test('baralho tem 108 cartas', () => {
  const b = cc.baralho();
  assert.equal(b.length, 108);
  assert.equal(new Set(b.map((c) => c.id)).size, 108);
  assert.equal(b.filter((c) => c.v === 'mais4').length, 4);
  assert.equal(b.filter((c) => c.v === 'coringa').length, 4);
  assert.equal(b.filter((c) => c.cor === 'azul').length, 25);
});

test('novo jogo: 7 cartas para cada e um número na mesa', () => {
  for (let s = 1; s <= 30; s++) {
    const e = cc.novoJogo(3, semente(s));
    assert.equal(e.maos.length, 4);
    assert.ok(e.maos.every((m) => m.length === 7));
    assert.equal(typeof cc.topo(e).v, 'number');
    assert.equal(e.monte.length + 28 + 1, 108);
  }
});

test('pode jogar mesma cor, mesmo número ou coringa', () => {
  const e = jogoCom([[], []], carta('azul', 5));
  assert.ok(cc.podeJogar(carta('azul', 1), e));
  assert.ok(cc.podeJogar(carta('verde', 5), e));
  assert.ok(cc.podeJogar(carta('coringa', 'mais4'), e));
  assert.ok(!cc.podeJogar(carta('verde', 'mais2'), e));
});

test('+2 faz o próximo comprar 2 e perder a vez; inverte com 2 jogadores pula', () => {
  let e = jogoCom([[carta('azul', 'mais2', 1), carta('azul', 3, 2)], [carta('verde', 1, 3)], [carta('verde', 2, 4)]], carta('azul', 5));
  const r = cc.jogar(e, 1);
  assert.ok(r.ok);
  assert.equal(e.maos[1].length, 3);
  assert.equal(e.vez, 2);
  e = jogoCom([[carta('azul', 'inverte', 1), carta('azul', 3, 2)], [carta('verde', 1, 3)]], carta('azul', 5));
  cc.jogar(e, 1);
  assert.equal(e.vez, 0);
  e = jogoCom([[carta('azul', 'inverte', 1), carta('azul', 3, 2)], [carta('verde', 1, 3)], [carta('verde', 2, 4)]], carta('azul', 5));
  cc.jogar(e, 1);
  assert.equal(e.vez, 2);
  assert.equal(e.sentido, -1);
});

test('pula a vez', () => {
  const e = jogoCom([[carta('azul', 'pula', 1), carta('azul', 3, 2)], [carta('verde', 1, 3)], [carta('verde', 2, 4)]], carta('azul', 5));
  const r = cc.jogar(e, 1);
  assert.equal(r.efeito, 'pula');
  assert.equal(r.alvo, 1);
  assert.equal(e.vez, 2);
});

test('coringa +4 exige cor e troca a cor da mesa', () => {
  const e = jogoCom([[carta('coringa', 'mais4', 1), carta('azul', 3, 2)], [carta('verde', 1, 3)]], carta('azul', 5));
  assert.equal(cc.jogar(e, 1).ok, false);
  assert.ok(cc.jogar(e, 1, 'verde').ok);
  assert.equal(e.cor, 'verde');
  assert.equal(e.maos[1].length, 5);
  assert.equal(e.vez, 0);
});

test('comprar: só joga a carta comprada; se não servir, passa a vez', () => {
  const e = jogoCom([[carta('verde', 1, 1)], [carta('verde', 2, 2)]], carta('azul', 5));
  e.monte = [carta('vermelho', 7, 9)];
  cc.comprar(e);
  assert.equal(e.vez, 1);
  e.vez = 0;
  e.monte = [carta('azul', 7, 10)];
  const c = cc.comprar(e);
  assert.equal(e.comprou, c.id);
  assert.equal(cc.jogar(e, 1).ok, false);
  assert.ok(cc.jogar(e, 10).ok);
});

test('monte vazio: a pilha é embaralhada de novo', () => {
  const e = jogoCom([[carta('verde', 1, 1)], [carta('verde', 2, 2)]], carta('azul', 5, 50));
  e.monte = [];
  e.pilha = [carta('vermelho', 3, 51), carta('amarelo', 4, 52), carta('azul', 5, 53)];
  const novas = cc.darCartas(e, 0, 2);
  assert.equal(novas.length, 2);
  assert.equal(e.pilha.length, 1);
  assert.equal(cc.topo(e).id, 53);
});

test('esqueceu o "Última!": compra 2', () => {
  const e = jogoCom([[carta('azul', 1, 1), carta('azul', 2, 2)], [carta('verde', 2, 3)]], carta('azul', 5));
  cc.jogar(e, 1);
  assert.equal(cc.conferirUltima(e, 0), true);
  assert.equal(e.maos[0].length, 3);
  const f = jogoCom([[carta('azul', 1, 1), carta('azul', 2, 2)], [carta('verde', 2, 3)]], carta('azul', 5));
  assert.ok(cc.dizerUltima(f, 0));
  cc.jogar(f, 1);
  assert.equal(cc.conferirUltima(f, 0), false);
  assert.equal(f.maos[0].length, 1);
});

test('vence quem esvaziar a mão', () => {
  const e = jogoCom([[carta('azul', 1, 1)], [carta('verde', 2, 3)]], carta('azul', 5));
  assert.equal(cc.jogar(e, 1).efeito, 'venceu');
  assert.equal(e.vencedor, 0);
});

test('robôs jogam partidas inteiras só com jogadas válidas', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) {
    for (let s = 1; s <= 30; s++) {
      const rnd = semente(s * 13 + nivel.length);
      const e = cc.novoJogo(1 + (s % 3), rnd);
      let voltas = 0;
      while (e.vencedor === null && voltas++ < 3000) {
        const j = e.vez;
        const total = e.maos.reduce((t, m) => t + m.length, 0) + e.monte.length + e.pilha.length;
        assert.equal(total, 108);
        let esc = cc.escolhaRobo(e, nivel, rnd);
        if (!esc) {
          cc.comprar(e, rnd);
          if (e.vez !== j) continue;
          esc = cc.escolhaRobo(e, nivel, rnd);
          assert.ok(esc, 'a carta comprada servia');
        }
        if (e.maos[j].length === 2) cc.dizerUltima(e, j);
        const r = cc.jogar(e, esc.id, esc.cor, rnd);
        assert.ok(r.ok, 'jogada válida');
        cc.conferirUltima(e, j, rnd);
      }
      assert.notEqual(e.vencedor, null, 'alguém venceu');
    }
  }
});

test('difícil ataca quando o próximo está quase ganhando', () => {
  const e = jogoCom([[carta('azul', 'mais2', 1), carta('azul', 9, 2), carta('azul', 8, 4)], [carta('verde', 2, 3)]], carta('azul', 5));
  for (let s = 0; s < 10; s++) assert.equal(cc.escolhaRobo(e, 'dificil', semente(s)).id, 1);
});
