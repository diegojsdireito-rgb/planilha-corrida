import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as doce from '../jogos/src/docinhos.js';

const sorteador = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
// Mesa sem nenhuma trinca: cada casa com o tipo (coluna + 2 × linha) % 6.
const base = () => Array.from({ length: 64 }, (_, i) => ({ id: 10000 + i, tipo: ((i % 8) + 2 * Math.floor(i / 8)) % 6, especial: null }));
// Na linha 3: 24 e 26 viram roxo (5); trocar 25 com 33 (que também é roxo) forma a trinca 24-25-26.
const comTrinca = () => {
  const g = base();
  for (const i of [24, 26, 33]) g[i] = { ...g[i], tipo: 5 };
  return g;
};

// ---------- fases 61 a 120 ----------
test('fases: são 120 em oito lugares de 15, com a fase chefe a cada 15', () => {
  assert.equal(doce.TOTAL_FASES, 120);
  assert.equal(doce.REGIOES.length, 8);
  assert.deepEqual(doce.REGIOES.slice(4).map((r) => r.nome), ['Praia de Caramelo', 'Vulcão de Chocolate', 'Nuvens de Algodão-doce', 'Galáxia de Jujuba']);
  assert.equal(doce.regiaoDa(61).nome, 'Praia de Caramelo');
  assert.equal(doce.regiaoDa(90).nome, 'Vulcão de Chocolate');
  assert.equal(doce.regiaoDa(91).nome, 'Nuvens de Algodão-doce');
  assert.equal(doce.regiaoDa(120).nome, 'Galáxia de Jujuba');
  for (let n = 61; n <= 120; n++) assert.equal(Boolean(doce.fase(n).chefe), n % 15 === 0, `fase ${n}`);
});

test('fases: as 60 primeiras continuam iguais (o progresso antigo vale)', () => {
  assert.deepEqual(
    [doce.fase(1).meta, doce.fase(1).movimentos, doce.fase(30).meta, doce.fase(60).meta, doce.fase(60).movimentos, doce.fase(60).gelo, doce.fase(58).pedra, doce.fase(60).forte],
    [1800, 22, 14850, 28350, 19, 14, 12, 6],
  );
  for (let n = 1; n <= 60; n++) {
    const f = doce.fase(n);
    assert.equal(f.corrente + f.chocolate + f.caixa + f.cerejas, 0, `fase ${n} não ganhou obstáculo novo`);
  }
});

test('fases 61–120: cada lugar novo tem o seu obstáculo em todas as fases, e a novidade aparece na primeira', () => {
  for (let n = 61; n <= 120; n++) {
    const f = doce.fase(n);
    const lugar = Math.floor((n - 61) / 15);
    const id = doce.OBSTACULO_DO_LUGAR[lugar];
    assert.ok(f[id] > 0, `fase ${n} tem ${id}`);
    assert.ok(f.movimentos >= 14 && f.movimentos <= 40, `fase ${n}: ${f.movimentos} movimentos`);
    assert.ok(f.meta > 0 && f.meta < f.movimentos * 500, `fase ${n}: meta ${f.meta}`);
    assert.equal(f.tipos, 6);
  }
  // a faixa "Novidade!" fica na primeira fase em que cada obstáculo aparece
  for (const [n, nv] of Object.entries(doce.NOVIDADES)) {
    const primeira = Array.from({ length: 120 }, (_, k) => k + 1).find((m) => doce.fase(m)[nv.id] > 0);
    assert.equal(primeira, Number(n), nv.id);
    assert.ok(nv.nome && nv.texto && nv.icone);
  }
  assert.equal(doce.novidade(76).id, 'chocolate');
  assert.equal(doce.novidade(77), null);
  // a primeira de cada lugar só tem a novidade
  for (const n of [61, 76, 91, 106]) {
    const f = doce.fase(n);
    const outros = ['gelo', 'pedra', 'corrente', 'chocolate', 'cerejas', 'caixa'].filter((k) => k !== doce.novidade(n).id && f[k]);
    assert.deepEqual(outros, [], `fase ${n}`);
  }
});

test('fases 61–120: a mesa começa com os obstáculos pedidos, sem trinca pronta e com uma troca que forma trinca', () => {
  const r = sorteador(5);
  for (let n = 61; n <= 120; n++) {
    const f = doce.fase(n);
    const g = doce.comObstaculos(doce.novaGrade(f.tipos, r), f, r);
    const ob = doce.obstaculos(g);
    assert.equal(ob.corrente, f.corrente, `fase ${n} correntes`);
    assert.equal(ob.chocolate, f.chocolate, `fase ${n} chocolates`);
    assert.equal(ob.caixa, f.caixa * f.caixaCamadas, `fase ${n} caixas`);
    assert.equal(ob.gelo + ob.pedra, f.gelo + f.pedra + f.forte, `fase ${n} gelo e pedra`);
    assert.equal(doce.cerejasNaMesa(g), Math.min(2, f.cerejas), `fase ${n} cerejas`);
    assert.ok(!g.slice(56).some((d) => d.cereja), 'nenhuma cereja começa no chão');
    assert.equal(doce.sequencias(g).length, 0, `fase ${n} sem trinca pronta`);
    assert.ok(doce.encontrarJogada(g), `fase ${n} tem jogada`);
  }
});

// ---------- corrente de alcaçuz ----------
test('corrente: o doce acorrentado não troca, mas forma trinca, e a trinca solta a corrente', () => {
  const g = comTrinca();
  g[26] = { ...g[26], corrente: 1 };
  assert.ok(doce.preso(g[26]));
  assert.equal(doce.trocar(g, 26, 27, 6, sorteador(3)), null, 'não troca');
  assert.equal(doce.trocaLivre(g, 26, 27, 6, sorteador(3)), null, 'nem com a troca livre');
  const r = doce.trocar(g, 25, 33, 6, sorteador(3));
  assert.ok(r, 'a trinca com o acorrentado vale');
  assert.equal(r.etapas[0].quebrados.corrente, 1);
  const solto = r.etapas[0].grade.find((d) => d.id === g[26].id);
  assert.ok(solto && !solto.corrente, 'o doce ficou na mesa, sem a corrente');
  assert.ok(r.pontos >= 2 * doce.PONTOS_POR_DOCE + doce.PONTOS_CORRENTE);
});

test('corrente: doce estourando ao lado não solta, e o acorrentado não cai (os outros passam por trás)', () => {
  const g = base();
  g[26] = { ...g[26], corrente: 1 };
  const r = doce.martelo(g, 34, 6, sorteador(4)); // logo embaixo do acorrentado
  const e = r.etapas[0];
  assert.equal(e.grade[26].id, g[26].id, 'ficou no lugar');
  assert.equal(e.grade[26].corrente, 1, 'continua preso');
  assert.equal(e.grade[34].id, g[18].id, 'o doce de cima passou por trás e caiu');
  // um especial que acerta solta
  const r2 = doce.foguete(g, 30, 6, sorteador(4));
  assert.equal(r2.etapas[0].quebrados.corrente, 1);
});

// ---------- chocolate ----------
test('chocolate: quebra com um doce estourando ao lado', () => {
  const g = base();
  g[27] = { id: 1, tipo: -3, especial: null, chocolate: 1 };
  assert.ok(doce.preso(g[27]) && doce.bloco(g[27]));
  const r = doce.martelo(g, 28, 6, sorteador(2));
  assert.equal(doce.obstaculos(r.etapas[0].grade).chocolate, 0);
  assert.ok(r.pontos >= doce.PONTOS_POR_DOCE + doce.PONTOS_CHOCOLATE);
});

test('chocolate: se numa jogada nenhum chocolate quebrar, ele cresce para uma casa vizinha', () => {
  let cresceu = 0;
  for (let s = 1; s <= 10; s++) {
    const g = comTrinca();
    g[0] = { id: 1, tipo: -3, especial: null, chocolate: 1 };
    const r = doce.trocar(g, 25, 33, 6, sorteador(s));
    if (r.quebrados.chocolate) continue; // uma cascata pode ter alcançado o canto
    assert.equal(doce.obstaculos(r.grade).chocolate, 2);
    const k = r.etapas.findIndex((x) => x.espalhou !== undefined);
    assert.ok(k > 0, 'cresceu');
    const antes = r.etapas[k - 1].grade;
    assert.ok(antes.some((d, i) => d.chocolate && doce.vizinhas(i, r.etapas[k].espalhou)), 'para uma casa do lado');
    cresceu++;
  }
  assert.ok(cresceu >= 5);
  // a mesma jogada, com o chocolate do lado da trinca: quebra e não cresce
  const g = comTrinca();
  g[32] = { id: 2, tipo: -3, especial: null, chocolate: 1 };
  const r = doce.trocar(g, 25, 33, 6, sorteador(1));
  assert.equal(r.quebrados.chocolate, 1);
  assert.ok(!r.etapas.some((x) => x.espalhou !== undefined));
  // nem os bônus fazem o chocolate crescer
  const g2 = base();
  g2[0] = { id: 3, tipo: -3, especial: null, chocolate: 1 };
  assert.equal(doce.obstaculos(doce.martelo(g2, 60, 6, sorteador(1)).grade).chocolate, 1);
  assert.equal(doce.espalharChocolate(base()), -1, 'sem chocolate, nada cresce');
});

// ---------- cerejas ----------
test('cereja: não quebra, troca com qualquer vizinho e sai quando chega na fileira de baixo', () => {
  const g = base();
  g[40] = { id: 1, tipo: -5, especial: null, cereja: true };
  assert.equal(doce.martelo(g, 40, 6, sorteador(1)), null, 'o martelo não quebra a cereja');
  const b = doce.explodir(g, 40, 6, sorteador(1));
  assert.equal(doce.cerejasNaMesa(b.etapas[0].grade), 1, 'a bomba também não');
  assert.ok(!doce.preso(g[40]));
  const r = doce.trocar(g, 40, 41, 6, sorteador(1));
  assert.ok(r, 'a cereja troca mesmo sem trinca');
  assert.equal(r.etapas[0].grade[41].id, 1);
  assert.equal(r.coletadas, 0);
  // da fileira 6 para a 7: sai da mesa
  const g2 = base();
  g2[50] = { id: 2, tipo: -5, especial: null, cereja: true };
  const r2 = doce.trocar(g2, 50, 58, 6, sorteador(1));
  assert.equal(r2.coletadas, 1);
  assert.equal(doce.cerejasNaMesa(r2.grade), 0);
  assert.ok(r2.pontos >= doce.PONTOS_CEREJA);
  // descendo porque os doces de baixo estouraram
  const g3 = base();
  g3[48] = { id: 3, tipo: -5, especial: null, cereja: true };
  const r3 = doce.martelo(g3, 56, 6, sorteador(1));
  assert.equal(r3.coletadas, 1);
  assert.ok(doce.encontrarJogada(g3, true), 'a dica sabe mexer a cereja');
});

test('cereja: aparece uma nova lá em cima enquanto a fase ainda pedir', () => {
  const r = doce.trocar(comTrinca(), 25, 33, 6, sorteador(2), { cerejas: 3 });
  assert.equal(doce.cerejasNaMesa(r.grade), 1);
  assert.ok(r.etapas.some((e) => e.cereja !== undefined && e.cereja < 8), 'nasceu na fileira de cima');
  const sem = doce.trocar(comTrinca(), 25, 33, 6, sorteador(2), { cerejas: 0 });
  assert.equal(doce.cerejasNaMesa(sem.grade), 0);
  // para vencer, precisa ter levado todas
  const f = doce.fase(91);
  const limpa = base();
  assert.ok(!doce.venceu(f.meta, f, limpa, f.cerejas - 1));
  assert.ok(doce.venceu(f.meta, f, limpa, f.cerejas));
});

// ---------- caixa de presente ----------
test('caixa de presente: perde uma camada por batida e, quando abre, vira um doce especial', () => {
  const g = base();
  g[27] = { id: 1, tipo: -4, especial: null, caixa: 2, premio: 'bomba', premioTipo: 2 };
  assert.ok(doce.preso(g[27]));
  const r = doce.martelo(g, 28, 6, sorteador(1));
  const g1 = r.etapas[0].grade;
  assert.equal(g1[27].caixa, 1);
  const r2 = doce.martelo(g1, 26, 6, sorteador(1));
  const aberta = r2.etapas[0].grade[27];
  assert.equal(aberta.especial, 'bomba');
  assert.equal(aberta.tipo, 2);
  assert.ok(!aberta.caixa);
  assert.ok(r2.etapas[0].criados.includes(aberta.id));
  assert.ok(r2.etapas[0].removidos.includes(1), 'a caixa sai da tela');
  // uma bomba em volta bate uma vez só, mesmo a caixa estando dentro e ao lado
  const g3 = base();
  g3[27] = { id: 5, tipo: -4, especial: null, caixa: 3, premio: 'linha', premioTipo: 0 };
  assert.equal(doce.explodir(g3, 28, 6, sorteador(1)).etapas[0].quebrados.caixa, 1);
});

// ---------- bônus novos ----------
test('bônus bomba: estoura o quadrado 3 × 3 em volta do doce tocado', () => {
  const g = base();
  const r = doce.explodir(g, 27, 6, sorteador(1));
  for (const i of [18, 19, 20, 26, 27, 28, 34, 35, 36]) assert.ok(r.etapas[0].removidos.includes(g[i].id), `casa ${i}`);
  assert.equal(r.etapas[0].removidos.length, 9);
  assert.equal(doce.explodir(g, 0, 6, sorteador(1)).etapas[0].removidos.length, 4, 'no canto, só 4');
  assert.ok(r.pontos >= 9 * doce.PONTOS_POR_DOCE);
  // quebra gelo e pedra que estiverem na área
  const g2 = base();
  g2[27] = { ...g2[27], gelo: 1 }; g2[28] = { id: 1, tipo: -2, especial: null, pedra: 1 };
  const r2 = doce.explodir(g2, 27, 6, sorteador(1));
  assert.deepEqual([r2.etapas[0].quebrados.gelo, r2.etapas[0].quebrados.pedra], [1, 1]);
});

test('bônus foguete: limpa a linha e a coluna do doce tocado', () => {
  const g = base();
  const r = doce.foguete(g, 27, 6, sorteador(1));
  const linha = [24, 25, 26, 27, 28, 29, 30, 31];
  const coluna = [3, 11, 19, 27, 35, 43, 51, 59];
  for (const i of new Set([...linha, ...coluna])) assert.ok(r.etapas[0].removidos.includes(g[i].id), `casa ${i}`);
  assert.equal(r.etapas[0].removidos.length, 15);
});

test('bônus listrado: o doce tocado vira listrado; não vale para pedra, cereja nem especial', () => {
  const g = base();
  const n = doce.virarListrado(g, 10, sorteador(1));
  assert.ok(['linha', 'coluna'].includes(n[10].especial));
  assert.equal(n[10].tipo, g[10].tipo);
  assert.equal(g[10].especial, null, 'não mexe na mesa original');
  g[11] = { id: 1, tipo: -2, especial: null, pedra: 1 };
  g[12] = { id: 2, tipo: -5, especial: null, cereja: true };
  g[13] = { ...g[13], gelo: 1 };
  assert.equal(doce.virarListrado(g, 11), null);
  assert.equal(doce.virarListrado(g, 12), null);
  assert.equal(doce.virarListrado(n, 10), null);
  assert.equal(doce.virarListrado(g, 13).at(13).gelo, 1, 'o congelado continua congelado');
  // e o listrado funciona: estourado, limpa a linha ou a coluna
  const r = doce.martelo(n, 10, 6, sorteador(1));
  assert.ok(r.etapas[0].removidos.length >= 8);
});

test('bônus descongelar: derrete uma camada do gelo, solta correntes e derrete até 3 chocolates', () => {
  const g = base();
  g[1] = { ...g[1], gelo: 2 }; g[2] = { ...g[2], gelo: 1 }; g[3] = { ...g[3], corrente: 1 };
  for (const i of [40, 41, 42, 43]) g[i] = { id: 100 + i, tipo: -3, especial: null, chocolate: 1 };
  g[50] = { id: 7, tipo: -2, especial: null, pedra: 1 };
  const r = doce.descongelar(g, 6, sorteador(1));
  const ob = doce.obstaculos(r.etapas[0].grade);
  assert.deepEqual([ob.gelo, ob.corrente, ob.chocolate, ob.pedra], [1, 0, 1, 1], 'a pedra não derrete');
  assert.deepEqual(r.etapas[0].quebrados, { gelo: 2, pedra: 0, corrente: 1, chocolate: 3, caixa: 0 });
  assert.ok(r.pontos >= 2 * doce.PONTOS_GELO + doce.PONTOS_CORRENTE + 3 * doce.PONTOS_CHOCOLATE);
  assert.equal(doce.descongelar(base(), 6, sorteador(1)), null, 'sem nada para derreter');
});

test('bônus pincel: todos os doces de uma cor viram a outra, e as trincas que se formam estouram', () => {
  const g = base();
  g[8] = { ...g[8], tipo: 5 }; g[9] = { ...g[9], tipo: 5 }; // linha 1: 5 5 4 5 ...
  const de = g[10].tipo; const para = 5;
  const quantos = g.filter((d) => d.tipo === de).length;
  const r = doce.pincel(g, 10, para, 6, sorteador(1));
  assert.equal(r.etapas[0].pintados.length, quantos);
  assert.ok(!r.etapas[0].grade.some((d) => d.tipo === de), 'não sobrou nenhum da cor antiga');
  assert.ok(r.etapas.length > 1 && r.pontos > quantos * 20, 'formou trincas e pontuou');
  assert.ok(r.etapas[1].criados.length, 'os 4 em linha viraram um listrado');
  assert.equal(doce.pincel(g, 10, de, 6), null, 'a mesma cor não vale');
  assert.equal(doce.pincel(g, 10, 7, 6), null, 'cor que não existe na fase');
  g[5] = { id: 1, tipo: -5, especial: null, cereja: true };
  assert.equal(doce.pincel(g, 5, 1, 6), null, 'cereja não se pinta');
});

test('bônus presente: espalha 3 doces especiais em doces comuns', () => {
  const g = base();
  g[0] = { id: 1, tipo: -2, especial: null, pedra: 1 };
  const r = doce.presente(g, sorteador(3));
  assert.equal(r.casas.length, 3);
  assert.equal(new Set(r.casas).size, 3);
  for (const i of r.casas) {
    assert.ok(['linha', 'coluna', 'bomba'].includes(r.grade[i].especial));
    assert.equal(r.grade[i].tipo, g[i].tipo);
    assert.ok(i !== 0, 'não cai na pedra');
  }
  assert.equal(g.filter((d) => d.especial).length, 0, 'não mexe na mesa original');
});

// ---------- estoque de bônus ----------
test('estoque de bônus: quem começa ganha 3 de cada; quem já jogava mantém o que tem e ganha 2 de cada novo', () => {
  const novo = doce.estoqueBonus(undefined);
  assert.equal(Object.keys(novo).length, 12);
  for (const b of doce.BONUS) assert.equal(novo[b.id], 3);
  const antigo = { martelo: 1, troca: 0, vassoura: 5, arcoiris: 3, mistura: 2, mais5: 4 };
  const m = doce.estoqueBonus(antigo);
  assert.deepEqual(m, { ...antigo, bomba: 2, foguete: 2, listrado: 2, descongelar: 2, pincel: 2, presente: 2 });
  assert.equal(antigo.bomba, undefined, 'não mexe no objeto guardado');
  assert.equal(doce.estoqueBonus(m), m, 'estoque completo volta igual');
  // valor estragado vira 0; bônus antigo que faltava ganha 3, como antes
  const estragado = doce.estoqueBonus({ martelo: 'x', vassoura: -1, bomba: 4 });
  assert.equal(estragado.martelo, 0);
  assert.equal(estragado.vassoura, 0);
  assert.equal(estragado.troca, 3);
  assert.equal(estragado.bomba, 4);
  assert.equal(estragado.pincel, 2);
});

test('prêmio: um bônus por estrela, sorteado entre os doze', () => {
  const r = sorteador(9);
  assert.equal(doce.sortearPremio(3, r).length, 3);
  assert.equal(doce.sortearPremio(0, r).length, 0);
  const vistos = new Set();
  for (let k = 0; k < 400; k++) for (const b of doce.sortearPremio(1, r)) vistos.add(b.id);
  assert.equal(vistos.size, 12);
});

// ---------- dificuldade: o robô guloso ----------
// Escolhe a troca que mais pontua, quebra obstáculos e desce cerejas; no empate, joga perto dos obstáculos.
const altura = (g) => g.reduce((t, x, i) => t + (x?.cereja ? Math.floor(i / 8) : 0), 0);
function guloso(g, f) {
  let melhor = null; let nota = -Infinity;
  const alvos = []; g.forEach((x, i) => { if (x?.corrente || x?.chocolate || x?.caixa || x?.gelo || x?.pedra) alvos.push(i); });
  const dist = (i) => alvos.reduce((m, k) => Math.min(m, Math.abs((k >> 3) - (i >> 3)) + Math.abs((k & 7) - (i & 7))), 99);
  for (let i = 0; i < 64; i++) {
    for (const j of [i + 1, i + 8]) {
      if (j >= 64 || !doce.vizinhas(i, j)) continue;
      const x = doce.trocar(g, i, j, f.tipos, sorteador(i * 97 + j + 1));
      if (!x) continue;
      const v = x.pontos + (doce.obstaculos(g).total - doce.obstaculos(x.grade).total) * 600 + x.coletadas * 4000
        + (altura(x.grade) + x.coletadas * 8 - altura(g)) * 1000 - (alvos.length ? 100 * Math.min(dist(i), dist(j)) : 0);
      if (v > nota) { nota = v; melhor = [i, j]; }
    }
  }
  return melhor;
}
function partida(f, r) {
  let g = doce.comObstaculos(doce.novaGrade(f.tipos, r), f, r); let p = 0; let col = 0;
  for (let m = 0; m < f.movimentos; m++) {
    const j = guloso(g, f);
    assert.ok(j, 'sempre há uma troca');
    const x = doce.trocar(g, j[0], j[1], f.tipos, r, { cerejas: f.cerejas - col });
    g = x.grade; p += x.pontos; col += x.coletadas;
    if (doce.venceu(p, f, g, col)) return true;
  }
  return false;
}

test('dificuldade: o robô guloso vence todas as fases testadas, mais as do começo que as do fim', () => {
  const N = 6;
  const taxa = {};
  for (const n of [61, 68, 75, 76, 83, 90, 91, 98, 105, 106, 113, 120]) {
    const r = sorteador(1000 + n);
    let v = 0;
    for (let k = 0; k < N; k++) if (partida(doce.fase(n), r)) v++;
    taxa[n] = v / N;
    assert.ok(v >= 1, `fase ${n} não pode ser impossível (venceu ${v} de ${N})`);
  }
  const media = (ns) => ns.reduce((t, n) => t + taxa[n], 0) / ns.length;
  assert.ok(media([61, 68, 75]) >= 0.6, `Praia: ${media([61, 68, 75])}`);
  assert.ok(media([61, 68, 75]) > media([106, 113, 120]), JSON.stringify(taxa));
});
