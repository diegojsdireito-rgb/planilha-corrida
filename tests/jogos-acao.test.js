import test from 'node:test';
import assert from 'node:assert/strict';
import * as doce from '../jogos/src/docinhos.js';
import * as corrida from '../jogos/src/corrida.js';

function semente(n) {
  let s = n;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

test('docinhos: grade nova não tem trincas e tem jogada', () => {
  for (let k = 1; k <= 20; k++) {
    const g = doce.novaGrade(6, semente(k));
    assert.equal(doce.sequencias(g).length, 0);
    assert.ok(doce.encontrarJogada(g));
  }
});

test('docinhos: troca que não forma nada é recusada; troca válida pontua', () => {
  const g = doce.novaGrade(6, semente(3));
  const [a, b] = doce.encontrarJogada(g);
  assert.ok(doce.trocar(g, a, b, 6, semente(9)).pontos >= 180);
  let invalida = null;
  for (let i = 0; i < 63 && !invalida; i++) {
    if (doce.vizinhas(i, i + 1) && !doce.trocar(g, i, i + 1, 6, semente(1))) invalida = [i, i + 1];
  }
  assert.ok(invalida);
  assert.equal(doce.trocar(g, 0, 9), null); // não vizinhas
});

// Grade de fundo sem trincas (tipos 3, 4 e 5); depois colocamos os A (tipo 0) à mão.
function base() {
  return Array.from({ length: 64 }, (_, i) => ({ id: 10000 + i, tipo: 3 + ((Math.floor(i / 8) + 2 * (i % 8)) % 3), especial: null }));
}
const comA = (casas) => { const g = base(); for (const i of casas) g[i].tipo = 0; return g; };
const criado = (r) => r.etapas[0].grade.find((d) => d.id === r.etapas[0].criados[0]);

test('docinhos: 4 em linha cria listrado, 5 cria arco-íris, L cria bomba', () => {
  assert.equal(doce.sequencias(base()).length, 0);
  // A A _ A na linha de cima e um A embaixo do vão: trocar o vão com ele faz 4
  const r4 = doce.trocar(comA([0, 1, 3, 10]), 2, 10, 6, semente(5));
  assert.equal(r4.etapas[0].criados.length, 1);
  assert.equal(criado(r4).especial, 'linha');
  // A A _ A A: faz 5
  assert.equal(criado(doce.trocar(comA([0, 1, 3, 4, 10]), 2, 10, 6, semente(5))).especial, 'arcoiris');
  // A A _ na linha de cima, coluna do vão descendo com A A, e o A vindo da direita: faz L
  assert.equal(criado(doce.trocar(comA([0, 1, 3, 10, 18]), 2, 3, 6, semente(5))).especial, 'bomba');
});

test('docinhos: arco-íris trocado com uma cor limpa todos daquela cor', () => {
  const g = doce.novaGrade(6, semente(11));
  g[0] = { id: 999, tipo: -1, especial: 'arcoiris' };
  const cor = g[1].tipo;
  const quantos = g.filter((d) => d.tipo === cor).length;
  const r = doce.trocar(g, 0, 1, 6, semente(2));
  assert.ok(r.etapas[0].removidos.length >= quantos);
});

test('docinhos: fases ficam mais difíceis e estrelas seguem a meta', () => {
  assert.ok(doce.fase(10).meta > doce.fase(1).meta);
  assert.ok(doce.fase(30).movimentos >= 15);
  assert.equal(doce.estrelas(1000, 1800), 0);
  assert.equal(doce.estrelas(1800, 1800), 1);
  assert.equal(doce.estrelas(3600, 1800), 3);
});

test('corrida: toda linha tem passagem e no máximo um carrinho', () => {
  const r = semente(4);
  for (let k = 0; k < 5000; k++) {
    const objs = corrida.gerarLinha(70, r, 500);
    const carrinhos = objs.filter((o) => o.tipo === 'carrinho');
    assert.ok(carrinhos.length <= 1);
    const bloqueio = [0, 1, 2].map((f) => objs.find((o) => o.faixa === f && ['cerca', 'faixa', 'carrinho'].includes(o.tipo))?.tipo);
    assert.ok(bloqueio.some((t) => t !== 'carrinho'));
  }
});

test('corrida: pular passa a cerca, deslizar passa a faixa, carrinho derruba', () => {
  const cenario = (tipo, acao) => {
    const s = corrida.nova('medio');
    s.ultimaLinha = 1e9; // sem obstáculos sorteados
    s.objetos = [{ tipo, faixa: 1, z: 4, comp: tipo === 'carrinho' ? 5 : 0.4 }];
    let feito = false;
    for (let k = 0; k < 120 && s.vivo; k++) {
      if (!feito && acao && s.objetos[0].z < 2.2) { corrida.comando(s, acao); feito = true; }
      corrida.avancar(s, 1 / 60);
    }
    return s.vivo;
  };
  assert.equal(cenario('cerca', null), false);
  assert.equal(cenario('cerca', 'pular'), true);
  assert.equal(cenario('faixa', null), false);
  assert.equal(cenario('faixa', 'deslizar'), true);
  assert.equal(cenario('carrinho', 'pular'), false);
  assert.equal(cenario('carrinho', 'esquerda'), true);
});

test('corrida: escudo aguenta uma batida e estrela soma pontos', () => {
  const s = corrida.nova('medio');
  s.ultimaLinha = 1e9;
  s.escudo = true;
  s.objetos = [{ tipo: 'carrinho', faixa: 1, z: 2, comp: 5 }, { tipo: 'estrela', faixa: 1, z: 12, h: 0.5 }];
  for (let k = 0; k < 90; k++) corrida.avancar(s, 1 / 60);
  assert.equal(s.vivo, true);
  assert.equal(s.escudo, false);
  assert.equal(s.estrelas, 1);
});

// Robô de teste: olha à frente e escolhe a ação. Se ele corre longe, os obstáculos têm saída.
function roboDeTeste(s) {
  const perigo = (f, de, ate) => s.objetos.filter((o) => ['cerca', 'faixa', 'carrinho'].includes(o.tipo) && Math.round(o.faixa) === f && o.z + (o.comp ?? 0) > de && o.z < ate);
  const aqui = perigo(s.faixa, -0.5, 9);
  if (aqui.some((o) => o.tipo === 'carrinho')) {
    const opcoes = [s.faixa - 1, s.faixa + 1].filter((f) => f >= 0 && f <= 2 && !perigo(f, -1, 7).some((o) => o.tipo === 'carrinho'));
    if (opcoes.length) { corrida.comando(s, opcoes[0] < s.faixa ? 'esquerda' : 'direita'); return; }
  }
  const prox = perigo(s.faixa, 0, s.vel * 0.16).sort((a, b) => a.z - b.z)[0];
  if (prox?.tipo === 'cerca' && s.y === 0) corrida.comando(s, 'pular');
  if (prox?.tipo === 'faixa' && s.deslizando < 0.1) corrida.comando(s, 'deslizar');
}

test('corrida: o robô de teste corre mais de 2 km no difícil em várias sementes', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    const r = semente(n);
    const s = corrida.nova('dificil');
    while (s.vivo && s.dist < 2000) {
      roboDeTeste(s);
      corrida.avancar(s, 1 / 60, r);
    }
    assert.ok(s.dist >= 2000, `semente ${n}: parou em ${Math.round(s.dist)} m, velocidade ${s.vel.toFixed(1)}`);
  }
});
