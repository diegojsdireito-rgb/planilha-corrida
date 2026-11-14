import test from 'node:test';
import assert from 'node:assert/strict';
import * as velha from '../jogos/src/velha.js';
import * as lig4 from '../jogos/src/lig4.js';
import * as reversi from '../jogos/src/reversi.js';
import * as damas from '../jogos/src/damas.js';
import * as ludo from '../jogos/src/ludo.js';

const fixo = () => 0.99; // nunca sorteia erro

test('velha: robô difícil fecha a vitória e bloqueia', () => {
  assert.equal(velha.jogadaRobo(['O', 'O', null, 'X', 'X', null, null, null, null], 'O', 'dificil', fixo), 2);
  assert.equal(velha.jogadaRobo(['X', 'X', null, null, 'O', null, null, null, null], 'O', 'dificil', fixo), 2);
});

test('velha: difícil contra difícil sempre empata', () => {
  let t = velha.novo();
  let vez = 'X';
  while (!velha.vencedor(t) && !velha.empate(t)) {
    t[velha.jogadaRobo(t, vez, 'dificil')] = vez;
    vez = vez === 'X' ? 'O' : 'X';
  }
  assert.ok(velha.empate(t));
});

test('lig4: peças caem e a vitória é detectada', () => {
  let t = lig4.novo();
  for (let k = 0; k < 4; k++) t = lig4.jogar(t, 0, 1);
  assert.equal(lig4.vencedor(t).jogador, 1);
  assert.equal(lig4.linhaLivre(t, 0), 1);
});

test('lig4: robô bloqueia três na vertical e fecha a própria vitória', () => {
  let t = lig4.novo();
  for (let k = 0; k < 3; k++) t = lig4.jogar(t, 0, 1);
  t = lig4.jogar(t, 6, 2);
  t = lig4.jogar(t, 6, 2);
  assert.equal(lig4.jogadaRobo(t, 2, 'medio', fixo), 0);
  t = lig4.jogar(t, 6, 2);
  assert.equal(lig4.jogadaRobo(t, 2, 'dificil', fixo), 6);
});

test('reversi: abertura tem quatro jogadas e vira uma peça', () => {
  const t = reversi.novo();
  assert.equal(reversi.jogadas(t, 1).size, 4);
  const n = reversi.jogar(t, 19, 1);
  assert.deepEqual(reversi.contagem(n), { 1: 4, 2: 1 });
});

test('reversi: robô prefere o canto', () => {
  const t = Array(64).fill(0);
  t[9] = 1; t[18] = 2; t[1] = 1; t[2] = 2;
  assert.equal(reversi.jogadaRobo(t, 2, 'medio', fixo), 0);
});

test('damas: abertura tem sete jogadas e captura é obrigatória', () => {
  const t = damas.novo();
  assert.equal(damas.jogadas(t, 1).length, 7);
  const c = Array(64).fill(0);
  c[5 * 8 + 2] = 1; c[4 * 8 + 3] = -1; c[7 * 8 + 0] = 1;
  const ops = damas.jogadas(c, 1);
  assert.equal(ops.length, 1);
  assert.deepEqual(ops[0].capturadas, [4 * 8 + 3]);
});

test('damas: pedra captura para trás e vale a lei da maioria', () => {
  const t = Array(64).fill(0);
  t[3 * 8 + 2] = 1; // pedra da pessoa
  t[4 * 8 + 3] = -1; // atrás dela
  t[6 * 8 + 5] = -1; // em sequência
  t[2 * 8 + 1] = -1; // captura única para a frente
  const ops = damas.jogadas(t, 1);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].capturadas.length, 2);
});

test('damas: dama captura à distância e pedra vira dama', () => {
  const t = Array(64).fill(0);
  t[7 * 8 + 0] = 2; t[4 * 8 + 3] = -1;
  const ops = damas.jogadas(t, 1);
  assert.ok(ops.every((m) => m.capturadas[0] === 4 * 8 + 3));
  assert.equal(ops.length, 4);
  const p = Array(64).fill(0);
  p[1 * 8 + 2] = 1;
  const n = damas.aplicar(p, { de: 10, caminho: [1], capturadas: [] });
  assert.equal(n[1], 2);
});

test('damas: robô difícil responde rápido', () => {
  const inicio = Date.now();
  const m = damas.jogadaRobo(damas.aplicar(damas.novo(), damas.jogadas(damas.novo(), 1)[0]), -1, 'dificil');
  assert.ok(m);
  assert.ok(Date.now() - inicio < 4000);
});

test('ludo: percurso tem 52 casas vizinhas e saídas coloridas', () => {
  assert.equal(ludo.PERCURSO.length, 52);
  for (let i = 0; i < 52; i++) {
    const [a, b] = ludo.PERCURSO[i];
    const [c, d] = ludo.PERCURSO[(i + 1) % 52];
    assert.equal(Math.max(Math.abs(a - c), Math.abs(b - d)), 1, `casa ${i}`);
  }
  assert.equal(new Set(ludo.PERCURSO.map(String)).size, 52);
  // última casa antes da reta encosta na reta da cor
  for (let cor = 0; cor < 4; cor++) {
    const [a, b] = ludo.PERCURSO[ludo.absoluta(cor, 50)];
    const [c, d] = ludo.RETA[cor][0];
    assert.equal(Math.abs(a - c) + Math.abs(b - d), 1, `cor ${cor}`);
  }
});

test('ludo: só sai da base com seis e chega com número exato', () => {
  const e = ludo.novo([0, 2]);
  assert.equal(ludo.jogadas(e, 0, 5).length, 0);
  assert.equal(ludo.jogadas(e, 0, 6).length, 4);
  e.pecas[0] = [54, -1, -1, -1];
  assert.equal(ludo.jogadas(e, 0, 3).length, 0);
  assert.equal(ludo.jogadas(e, 0, 2)[0].para, 56);
});

test('ludo: captura manda para a base, menos em casa segura', () => {
  const e = ludo.novo([0, 2]);
  e.pecas[0] = [3, -1, -1, -1];
  e.pecas[2] = [ludo.absoluta(0, 5) - 26 + 52, -1, -1, -1].map((p, i) => (i ? p : (p % 52)));
  const r = ludo.aplicar(e, { cor: 0, peca: 0, de: 3, para: 5 });
  assert.equal(r.capturadas.length, 1);
  assert.equal(r.estado.pecas[2][0], -1);
  e.pecas[2] = [ludo.absoluta(0, 8) - 26 + 52, -1, -1, -1];
  e.pecas[2][0] %= 52;
  assert.equal(ludo.capturas(e, 0, 8).length, 0);
});

test('ludo: robô prefere capturar', () => {
  const e = ludo.novo([0, 2]);
  e.pecas[2] = [10, 30, -1, -1];
  e.pecas[0] = [(ludo.absoluta(2, 10) + 52 - 4) % 52, -1, -1, -1];
  e.pecas[0][0] = (e.pecas[0][0] - ludo.SAIDA[0] + 52) % 52;
  const j = ludo.jogadaRobo(e, 0, 4, 'dificil', () => 0);
  assert.equal(j.peca, 0);
});

test('ludo: partida entre robôs termina', () => {
  let e = ludo.novo([0, 1, 2, 3]);
  let rodadas = 0;
  while (e.vencedores.length < 3 && rodadas < 5000) {
    const dado = 1 + Math.floor(Math.random() * 6);
    const j = ludo.jogadaRobo(e, e.vez, dado, 'dificil');
    let extra = dado === 6;
    if (j) { const r = ludo.aplicar(e, j); e = r.estado; extra ||= r.capturadas.length > 0 || r.chegou; }
    if (!extra || ludo.terminou(e, e.vez)) e = { ...e, vez: ludo.proxima(e) };
    rodadas++;
  }
  assert.ok(e.vencedores.length >= 3);
});
