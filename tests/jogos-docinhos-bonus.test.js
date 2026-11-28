import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as doce from '../jogos/src/docinhos.js';

let semente = 7;
const sorteio = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };

test('bônus: a lista tem os doze com nome, ícone e explicação, sem repetir', () => {
  assert.equal(doce.BONUS.length, 12);
  for (const b of doce.BONUS) assert.ok(b.id && b.icone && b.nome && b.texto);
  assert.equal(new Set(doce.BONUS.map((b) => b.id)).size, 12);
  assert.equal(new Set(doce.BONUS.map((b) => b.icone)).size, 12);
  for (const id of doce.BONUS_NOVOS) assert.ok(doce.BONUS.some((b) => b.id === id), id);
});

test('martelo quebra o doce tocado e a mesa continua cheia', () => {
  const g = doce.novaGrade(6, sorteio);
  const r = doce.martelo(g, 27, 6, sorteio);
  assert.ok(r.etapas[0].removidos.includes(g[27].id));
  assert.ok(r.pontos >= doce.PONTOS_POR_DOCE);
  assert.equal(r.grade.filter(Boolean).length, 64);
  assert.ok(doce.encontrarJogada(r.grade), 'sempre sobra jogada');
});

test('vassoura limpa a linha inteira do doce tocado', () => {
  const g = doce.novaGrade(6, sorteio);
  const r = doce.vassoura(g, 3 * 8 + 5, 6, sorteio);
  for (let k = 0; k < 8; k++) assert.ok(r.etapas[0].removidos.includes(g[3 * 8 + k].id));
});

test('troca livre troca vizinhos mesmo sem formar trinca; não troca quem não é vizinho', () => {
  for (let t = 0; t < 30; t++) {
    const g = doce.novaGrade(6, sorteio);
    // procura um par vizinho que não forma nada numa troca normal
    for (let i = 0; i < 63; i++) {
      const j = i % 8 < 7 ? i + 1 : -1;
      if (j < 0 || doce.trocar(g, i, j, 6, sorteio)) continue;
      const r = doce.trocaLivre(g, i, j, 6, sorteio);
      assert.ok(r, 'a troca livre sempre acontece');
      const final = r.etapas[0].grade;
      assert.equal(final[i].id, g[j].id); assert.equal(final[j].id, g[i].id);
      assert.equal(doce.trocaLivre(g, 0, 9, 6, sorteio), null);
      return;
    }
  }
  assert.fail('não achei um par sem combinação');
});

test('arco-íris transforma o doce tocado num arco-íris que pode ser trocado', () => {
  const g = doce.novaGrade(6, sorteio);
  const n = doce.virarArcoiris(g, 10);
  assert.equal(n[10].especial, 'arcoiris');
  assert.equal(g[10].especial, null, 'não mexe na grade original');
  const r = doce.trocar(n, 10, 11, 6, sorteio);
  assert.ok(r && r.pontos > 0, 'arco-íris trocado com um vizinho estoura a cor dele');
});

// ---------- obstáculos: gelo e pedra ----------
test('obstáculos: as fases 1 e 2 só pedem pontos; da 3 em diante aparecem gelo e pedras', () => {
  assert.equal(doce.fase(1).gelo + doce.fase(1).pedra, 0);
  assert.equal(doce.fase(2).gelo + doce.fase(2).pedra, 0);
  assert.ok(doce.fase(3).gelo > 0);
  assert.ok(doce.fase(4).pedra > 0);
  assert.ok(doce.fase(5).gelo > 0 && doce.fase(5).pedra > 0);
  for (let n = 3; n < 30; n++) {
    const f = doce.fase(n);
    const g = doce.comObstaculos(doce.novaGrade(f.tipos, sorteio), f, sorteio);
    assert.equal(doce.obstaculos(g).total, f.gelo + f.pedra + f.forte, `fase ${n}`);
    assert.ok(doce.encontrarJogada(g), `fase ${n} começa com jogada`);
    assert.equal(doce.sequencias(g).length, 0);
  }
});

test('obstáculos: doce congelado e pedra não saem do lugar na troca', () => {
  const g = doce.novaGrade(5, sorteio);
  g[10] = { ...g[10], gelo: 1 };
  assert.equal(doce.trocar(g, 10, 11, 5, sorteio), null);
  assert.equal(doce.trocaLivre(g, 10, 11, 5, sorteio), null);
  assert.ok(doce.preso(g[10]));
});

test('obstáculos: estourar um doce ao lado racha o gelo e quebra a pedra; pedra dura aguenta duas', () => {
  const g = doce.novaGrade(5, sorteio);
  g[27] = { ...g[27], gelo: 1 };
  g[29] = { id: 999, tipo: -2, especial: null, pedra: 2 };
  const r = doce.martelo(g, 28, 5, sorteio);
  const depois = doce.obstaculos(r.grade);
  assert.equal(depois.gelo, 0, 'o gelo ao lado rachou');
  assert.equal(depois.pedra, 1, 'a pedra dura perdeu uma camada');
  assert.ok(r.pontos >= doce.PONTOS_POR_DOCE + doce.PONTOS_GELO + doce.PONTOS_PEDRA);
  // martelo direto na pedra que sobrou quebra ela de vez
  const i = r.grade.findIndex((d) => d.pedra);
  const r2 = doce.martelo(r.grade, i, 5, sorteio);
  assert.equal(doce.obstaculos(r2.grade).pedra, 0);
});

test('obstáculos: pedras não formam trinca entre si', () => {
  const g = doce.novaGrade(5, sorteio);
  for (const i of [0, 1, 2]) g[i] = { id: 500 + i, tipo: -2, especial: null, pedra: 1 };
  assert.ok(!doce.sequencias(g).some((s) => s.casas.includes(0)));
});

test('obstáculos: para vencer precisa dos pontos e de quebrar tudo', () => {
  const f = doce.fase(5);
  const limpa = doce.novaGrade(f.tipos, sorteio);
  const suja = doce.comObstaculos(limpa, f, sorteio);
  assert.ok(doce.venceu(f.meta, f, limpa));
  assert.ok(!doce.venceu(f.meta, f, suja));
  assert.ok(!doce.venceu(f.meta - 1, f, limpa));
});

test('mapa: progresso guarda a melhor nota de cada fase e libera a próxima', () => {
  const h = [
    { j: 'docinhos', r: 'vitoria', nivel: 1, estrelas: 1, pontos: 2000 },
    { j: 'docinhos', r: 'vitoria', nivel: 1, estrelas: 3, pontos: 4000 },
    { j: 'docinhos', r: 'vitoria', nivel: 1, estrelas: 2, pontos: 3000 },
    { j: 'docinhos', r: 'vitoria', nivel: 2, estrelas: 2, pontos: 3500 },
    { j: 'docinhos', r: 'derrota', nivel: 3, estrelas: 0, pontos: 900 },
    { j: 'velha', r: 'vitoria' },
  ];
  const p = doce.progresso(h);
  assert.equal(p.liberada, 3);
  assert.deepEqual([p.melhor[1].estrelas, p.melhor[1].pontos, p.melhor[1].vezes], [3, 4000, 3]);
  assert.equal(p.melhor[3].estrelas, 0);
  assert.equal(p.estrelas, 5);
  assert.equal(doce.progresso([]).liberada, 1);
  assert.equal(doce.progresso([{ j: 'docinhos', r: 'vitoria', nivel: 60, estrelas: 3 }]).liberada, 61, 'quem terminou o Castelo de Uva segue para a Praia de Caramelo');
  assert.equal(doce.progresso([{ j: 'docinhos', r: 'vitoria', nivel: 120, estrelas: 3 }]).liberada, 120, 'não passa da última fase');
  assert.equal(doce.progresso([]).maxEstrelas, 360);
  assert.equal(doce.regiaoDa(1).nome, 'Vale do Morango');
  assert.equal(doce.regiaoDa(60).nome, 'Castelo de Uva');
});
