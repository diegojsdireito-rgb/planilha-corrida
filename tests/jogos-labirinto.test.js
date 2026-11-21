import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as lb from '../jogos/src/labirinto.js';
import { semente } from '../jogos/src/pintar-formas.js';

test('labirinto gerado é perfeito: todas as casas alcançáveis e sem ciclos', () => {
  for (const lado of [8, 12, 16]) {
    for (let s = 1; s <= 5; s++) {
      const paredes = lb.gerar(lado, semente(s * 17 + lado));
      const lab = { lado, paredes };
      let aberturas = 0;
      for (let i = 0; i < lado * lado; i++) aberturas += lb.vizinhasAbertas(lab, i).length;
      assert.equal(aberturas / 2, lado * lado - 1, 'uma árvore tem n − 1 passagens');
      for (let i = 0; i < lado * lado; i++) assert.ok(lb.caminho(lab, 0, i), `casa ${i} alcançável`);
    }
  }
});

test('paredes são coerentes dos dois lados e a borda é fechada', () => {
  const lado = 12; const lab = { lado, paredes: lb.gerar(lado, semente(9)) };
  for (let i = 0; i < lado * lado; i++) {
    for (const [nome, d] of Object.entries(lb.DIRECOES)) {
      const v = lb.vizinha(lab, i, nome);
      if (v >= 0) assert.equal(lab.paredes[v] & d.oposto, 0);
    }
    if (i < lado) assert.equal(lb.vizinha(lab, i, 'cima'), -1);
    if (i % lado === 0) assert.equal(lb.vizinha(lab, i, 'esquerda'), -1);
    if (i % lado === lado - 1) assert.equal(lb.vizinha(lab, i, 'direita'), -1);
    if (i >= lado * (lado - 1)) assert.equal(lb.vizinha(lab, i, 'baixo'), -1);
  }
});

test('novo jogo: tamanho pelo nível, moedas em casas válidas e saída alcançável', () => {
  for (const [nivel, lado] of [['facil', 8], ['medio', 12], ['dificil', 16]]) {
    const j = lb.novoJogo(nivel, semente(5));
    assert.equal(j.lado, lado);
    assert.equal(j.nivel, nivel);
    assert.equal(j.saida, lado * lado - 1);
    assert.equal(new Set(j.moedas).size, lb.NIVEIS[nivel].moedas);
    for (const m of j.moedas) assert.ok(m > 0 && m < j.saida);
    assert.ok(lb.caminho(j, 0, j.saida).length >= lado * 2 - 1);
  }
  assert.equal(lb.novoJogo('xyz', semente(1)).lado, 8, 'nível desconhecido vira fácil');
});

test('mover respeita paredes e seguir a dica leva até o pirulito', () => {
  const j = lb.novoJogo('medio', semente(42));
  const fechada = Object.keys(lb.DIRECOES).find((d) => lb.vizinha(j, 0, d) < 0);
  assert.deepEqual(lb.mover(j, fechada), { ok: false });
  assert.equal(j.pos, 0);
  let guarda = 0;
  while (!lb.chegou(j) && guarda++ < 1000) {
    const [prox] = lb.dica(j, 1);
    const r = lb.mover(j, lb.direcaoEntre(j, j.pos, prox));
    assert.ok(r.ok);
  }
  assert.ok(lb.chegou(j));
  assert.deepEqual(lb.dica(j), []);
  assert.equal(lb.mover(j, 'cima').ok, false, 'depois de chegar não anda mais');
});

test('pega moedas uma vez só e a trilha encolhe ao voltar', () => {
  const j = lb.novoJogo('facil', semente(3));
  const alvo = j.moedas[0];
  const c = lb.caminho(j, 0, alvo);
  for (let k = 1; k < c.length; k++) lb.mover(j, lb.direcaoEntre(j, c[k - 1], c[k]));
  assert.ok(j.pegas.includes(alvo));
  assert.equal(lb.pontos(j), lb.PONTOS_MOEDA * j.pegas.length);
  assert.deepEqual(j.trilha, c);
  lb.mover(j, lb.direcaoEntre(j, c[c.length - 1], c[c.length - 2]));
  assert.deepEqual(j.trilha, c.slice(0, -1));
  const antes = j.pegas.length;
  lb.mover(j, lb.direcaoEntre(j, c[c.length - 2], c[c.length - 1]));
  assert.equal(j.pegas.length, antes);
});

test('seguir o dedo anda só por passagens livres', () => {
  const j = lb.novoJogo('dificil', semente(77));
  const passos = lb.seguir(j, j.saida, 500);
  assert.ok(passos.every((p) => p.ok));
  for (let k = 1; k < j.trilha.length; k++) assert.ok(lb.vizinhasAbertas(j, j.trilha[k - 1]).includes(j.trilha[k]));
  const j2 = lb.novoJogo('facil', semente(8));
  const v = lb.vizinhasAbertas(j2, 0)[0];
  assert.equal(lb.seguir(j2, v).length, 1);
  assert.equal(j2.pos, v);
  // atrás de uma parede, não sai do lugar
  const j3 = lb.novoJogo('facil', semente(8));
  const fechada = Object.keys(lb.DIRECOES).find((d) => lb.vizinha(j3, 0, d) < 0 && (d === 'direita' || d === 'baixo'));
  if (fechada) {
    const alvo = fechada === 'direita' ? 1 : j3.lado;
    assert.equal(lb.seguir(j3, alvo).length, 0);
    assert.equal(j3.pos, 0);
  }
});
