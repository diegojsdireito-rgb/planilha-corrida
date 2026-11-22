import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mem from '../jogos/src/memoria.js';
import { semente } from '../jogos/src/pintar-formas.js';

// Joga "com memória perfeita": vira cada carta fechada e, se já conhece o par, vira o par.
function jogarPerfeito(e) {
  for (let guarda = 0; guarda < 500 && !e.fim; guarda++) {
    const i = e.cartas.findIndex((c) => !c.achada);
    const j = e.cartas.findIndex((c, k) => k !== i && !c.achada && c.f === e.cartas[i].f);
    mem.virar(e, i); mem.virar(e, j);
  }
}

test('30 fases, de 3 até 18 pares, sem nunca diminuir', () => {
  let antes = 0;
  for (let n = 1; n <= mem.TOTAL_FASES; n++) {
    const f = mem.fase(n);
    assert.ok(f.pares >= antes, `fase ${n}`);
    antes = f.pares;
    assert.ok(f.estrelas[0] >= f.pares && f.estrelas[1] > f.estrelas[0]);
    if (f.limite) assert.ok(f.limite > f.estrelas[1], `fase ${n}: o limite deixa ganhar com 2 estrelas`);
  }
  assert.equal(mem.fase(1).pares, 3);
  assert.equal(mem.fase(30).pares, 18);
  assert.ok([...Array(30).keys()].some((k) => mem.fase(k + 1).troca));
  assert.ok([...Array(30).keys()].some((k) => mem.fase(k + 1).limite));
});

test('cada fase tem os pares certos, com figuras diferentes do tema', () => {
  for (let n = 1; n <= mem.TOTAL_FASES; n++) {
    const f = mem.fase(n);
    const e = mem.novoJogo(n, semente(n));
    assert.equal(e.cartas.length, f.pares * 2);
    const conta = {};
    for (const c of e.cartas) conta[c.f] = (conta[c.f] ?? 0) + 1;
    assert.equal(Object.keys(conta).length, f.pares, `fase ${n}`);
    for (const v of Object.values(conta)) assert.equal(v, 2);
    if (f.tema !== 'misto') for (const fig of Object.keys(conta)) assert.ok(mem.FIGURAS[f.tema].includes(fig));
    assert.ok(f.colunas >= 3 && f.colunas <= 6, 'grade cabe no celular');
  }
});

test('virar duas iguais deixa o par aberto; diferentes fecham', () => {
  const e = mem.novoJogo(2, semente(5));
  const i = 0;
  const j = e.cartas.findIndex((c, k) => k !== i && c.f === e.cartas[i].f);
  const outra = e.cartas.findIndex((c) => c.f !== e.cartas[i].f);
  assert.equal(mem.virar(e, i).tipo, 'primeira');
  assert.equal(mem.virar(e, i).tipo, 'invalida', 'a mesma carta não vale duas vezes');
  assert.equal(mem.virar(e, outra).tipo, 'diferente');
  assert.equal(e.tentativas, 1);
  assert.deepEqual(e.abertas, [i, outra]);
  mem.esconder(e);
  assert.deepEqual(e.abertas, []);
  mem.virar(e, i);
  const r = mem.virar(e, j);
  assert.equal(r.tipo, 'par');
  assert.ok(e.cartas[i].achada && e.cartas[j].achada);
  assert.equal(mem.virar(e, i).tipo, 'invalida', 'carta achada não vira');
  assert.equal(mem.achados(e), 1);
});

test('virar uma terceira carta fecha as duas diferentes sozinha', () => {
  const e = mem.novoJogo(1, semente(9));
  const a = 0; const b = e.cartas.findIndex((c) => c.f !== e.cartas[0].f);
  mem.virar(e, a); mem.virar(e, b);
  const c = e.cartas.findIndex((x, k) => k !== a && k !== b);
  assert.equal(mem.virar(e, c).tipo, 'primeira');
  assert.deepEqual(e.abertas, [c]);
});

test('memória perfeita ganha todas as fases com 3 estrelas', () => {
  for (let n = 1; n <= mem.TOTAL_FASES; n++) {
    const e = mem.novoJogo(n, semente(n * 7));
    jogarPerfeito(e);
    assert.equal(e.fim, 'vitoria', `fase ${n}`);
    assert.equal(e.tentativas, mem.fase(n).pares);
    assert.equal(mem.estrelasPor(mem.fase(n), e.tentativas), 3);
  }
});

test('estrelas caem com mais tentativas', () => {
  const f = mem.fase(10);
  assert.equal(mem.estrelasPor(f, f.estrelas[0]), 3);
  assert.equal(mem.estrelasPor(f, f.estrelas[0] + 1), 2);
  assert.equal(mem.estrelasPor(f, f.estrelas[1] + 1), 1);
});

test('fase com limite: errar demais perde', () => {
  const n = [...Array(30).keys()].map((k) => k + 1).find((k) => mem.fase(k).limite && !mem.fase(k).troca);
  const f = mem.fase(n);
  const e = mem.novoJogo(n, semente(3));
  let r;
  for (let k = 0; k < f.limite; k++) {
    const a = e.cartas.findIndex((c) => !c.achada);
    const b = e.cartas.findIndex((c) => !c.achada && c.f !== e.cartas[a].f);
    mem.virar(e, a); r = mem.virar(e, b);
  }
  assert.equal(r.fim, 'derrota');
  assert.equal(e.fim, 'derrota');
  assert.equal(mem.restantes(e), 0);
  assert.equal(mem.virar(e, 0).tipo, 'invalida');
});

test('fase com troca: cada erro troca duas cartas fechadas e diferentes', () => {
  const n = [...Array(30).keys()].map((k) => k + 1).find((k) => mem.fase(k).troca);
  const e = mem.novoJogo(n, semente(11));
  const a = 0; const b = e.cartas.findIndex((c) => c.f !== e.cartas[0].f);
  const antes = e.cartas.map((c) => c.f);
  const r = mem.virar(e, a, semente(2)); const r2 = mem.virar(e, b, semente(2));
  assert.equal(r.tipo, 'primeira');
  assert.equal(r2.tipo, 'diferente');
  const [x, y] = r2.trocadas;
  assert.ok(![a, b].includes(x) && ![a, b].includes(y), 'as cartas abertas ficam no lugar');
  assert.notEqual(antes[x], antes[y]);
  assert.equal(e.cartas[x].f, antes[y]);
  assert.equal(e.cartas[y].f, antes[x]);
  // ainda dá para ganhar
  mem.esconder(e);
  const ee = mem.novoJogo(n, semente(12));
  jogarPerfeito(ee);
  assert.equal(ee.fim, 'vitoria');
});

test('progresso: fase liberada e melhores estrelas vêm do histórico', () => {
  const h = [
    { j: 'memoria', r: 'vitoria', nivel: 1, estrelas: 2, pontos: 200 },
    { j: 'memoria', r: 'vitoria', nivel: 1, estrelas: 3, pontos: 300 },
    { j: 'memoria', r: 'vitoria', nivel: 2, estrelas: 1, pontos: 100 },
    { j: 'memoria', r: 'derrota', nivel: 3, estrelas: 0, pontos: 0 },
    { j: 'docinhos', r: 'vitoria', nivel: 9, estrelas: 3 },
  ];
  const p = mem.progresso(h);
  assert.equal(p.liberada, 3);
  assert.equal(p.estrelas, 4);
  assert.equal(p.melhor[1].estrelas, 3);
  assert.equal(p.maxEstrelas, 90);
  assert.equal(mem.progresso([]).liberada, 1);
});
