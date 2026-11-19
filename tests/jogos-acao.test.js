import test from 'node:test';
import assert from 'node:assert/strict';
import * as doce from '../jogos/src/docinhos.js';
import * as corrida from '../jogos/src/corrida.js';
import * as loja from '../jogos/src/loja.js';

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

test('corrida: escudo aguenta uma batida e moeda vai para a carteira', () => {
  const s = corrida.nova('medio');
  s.ultimaLinha = 1e9;
  s.escudo = true;
  s.objetos = [{ tipo: 'carrinho', faixa: 1, z: 2, comp: 5 }, { tipo: 'moeda', faixa: 1, z: 12, h: 0.5 }];
  for (let k = 0; k < 90; k++) corrida.avancar(s, 1 / 60);
  assert.equal(s.vivo, true);
  assert.equal(s.escudo, false);
  assert.equal(s.moedas, 1);
});

// Roda um cenário curto sem obstáculos sorteados; `antes` prepara o estado.
function cenario(objetos, { antes = () => {}, acao = null, quando = 2.2, quadros = 150 } = {}) {
  const s = corrida.nova('medio', { cargas: 1 });
  s.ultimaLinha = 1e9;
  s.objetos = objetos;
  antes(s);
  let feito = false;
  for (let k = 0; k < quadros && s.vivo; k++) {
    const alvo = s.objetos.find((o) => ['cerca', 'faixa', 'carrinho'].includes(o.tipo));
    if (!feito && acao && (!alvo || alvo.z < quando)) { corrida.comando(s, acao); feito = true; }
    corrida.avancar(s, 1 / 60);
  }
  return s;
}

test('corrida: tênis de mola faz o super pulo passar por cima do carrinho', () => {
  const carrinho = () => [{ tipo: 'carrinho', faixa: 1, z: 6, comp: 5 }];
  assert.equal(cenario(carrinho(), { acao: 'pular', quando: 1.6 }).vivo, false);
  const s = cenario(carrinho(), { antes: (x) => { x.superPulo = 10; }, acao: 'pular', quando: 2.4 });
  assert.equal(s.vivo, true);
  assert.equal(s.contagem.superPulos, 1);
});

test('corrida: maleta voadora leva por cima de tudo e pega moedas no ar', () => {
  const s = cenario([{ tipo: 'maleta', faixa: 1, z: 1, h: 0.7 }, { tipo: 'carrinho', faixa: 1, z: 25, comp: 5 }, { tipo: 'moeda', faixa: 1, z: 30, h: 4.2 }], { quadros: 200 });
  assert.equal(s.vivo, true);
  assert.equal(s.contagem.maletas, 1);
  assert.ok(s.y > 2.5);
  assert.equal(s.moedas, 1);
});

test('corrida: skate segura uma batida e gasta uma carga', () => {
  const s = cenario([{ tipo: 'carrinho', faixa: 1, z: 6, comp: 5 }], { acao: 'skate', quando: 99 });
  assert.equal(s.vivo, true);
  assert.equal(s.cargas, 0);
  assert.equal(s.skate, 0);
  assert.ok(s.eventos.includes('skate-quebrou'));
  // sem carga, não liga
  const t = corrida.nova('medio', { cargas: 0 });
  corrida.comando(t, 'skate');
  assert.equal(t.skate, 0);
});

test('corrida: raios enchem a supercarga, que atravessa obstáculos', () => {
  const s = cenario([0, 1, 2].map((k) => ({ tipo: 'raio', faixa: 1, z: 1 + k * 2, h: 0.7 })), { quadros: 40 });
  assert.equal(s.energia, 1);
  corrida.comando(s, 'supercarga');
  assert.ok(s.supercarga > 0);
  assert.equal(s.energia, 0);
  s.objetos = [{ tipo: 'carrinho', faixa: 1, z: 3, comp: 5 }];
  for (let k = 0; k < 60; k++) corrida.avancar(s, 1 / 60);
  assert.equal(s.vivo, true);
});

test('corrida: skate supersônico vale moedas em dobro', () => {
  const s = corrida.nova('medio', { skate: 'supersonico', cargas: 1 });
  s.ultimaLinha = 1e9;
  corrida.comando(s, 'skate');
  s.objetos = [{ tipo: 'moeda', faixa: 1, z: 3, h: 0.5 }];
  for (let k = 0; k < 30; k++) corrida.avancar(s, 1 / 60);
  assert.equal(s.moedas, 2);
});

test('loja: comprar skate, cargas e melhorias só com moedas suficientes', () => {
  let c = { ...loja.carteiraNova(), moedas: 2400 };
  assert.ok(loja.comprarSkate(c, 'supersonico').erro);
  c = loja.comprarSkate(c, 'voador').carteira;
  assert.equal(c.moedas, 400);
  assert.equal(c.skate, 'voador');
  assert.ok(loja.comprarSkate(c, 'voador').erro);
  c = loja.melhorar(c, 'maleta').carteira;
  assert.equal(c.poderes.maleta, 1);
  assert.equal(c.moedas, 100);
  assert.ok(loja.comprarCargas(c, 1).erro);
  assert.equal(corrida.duracao(c.poderes.maleta), 10);
  assert.ok(loja.equipar(c, 'supersonico').erro);
  assert.equal(loja.equipar(c, 'classico').carteira.skate, 'classico');
});

test('loja: missões cumpridas pagam prêmio e são trocadas', () => {
  let c = loja.completarMissoes(loja.carteiraNova(), semente(3));
  assert.equal(c.missoes.length, 3);
  assert.equal(new Set(c.missoes.map((m) => m.tipo)).size, 3);
  const alvo = c.missoes[0];
  const resultado = { moedas: 40, metros: 0, pontos: 0, pulos: 0, deslizes: 0, maletas: 0, supercargas: 0, superPulos: 0, skates: 1, [alvo.tipo]: alvo.alvo };
  const r = loja.fecharCorrida({ ...c, cargas: 2 }, resultado, semente(4));
  assert.ok(r.concluidas.some((m) => m.tipo === alvo.tipo));
  assert.equal(r.carteira.moedas, resultado.moedas + r.premio);
  assert.equal(r.carteira.cargas, 1);
  assert.equal(r.carteira.missoes.length, 3);
});

test('loja: presente do dia cresce com dias seguidos e só abre uma vez por dia', () => {
  let c = loja.carteiraNova();
  let r = loja.abrirPresente(c, '2026-11-18');
  assert.equal(r.premio, 100);
  c = r.carteira;
  assert.ok(loja.abrirPresente(c, '2026-11-18').erro);
  r = loja.abrirPresente(c, '2026-11-19');
  assert.equal(r.seguidos, 2);
  assert.equal(r.premio, 150);
  r = loja.abrirPresente(r.carteira, '2026-11-25');
  assert.equal(r.seguidos, 1);
});

test('loja: juntar carteiras não perde compras', () => {
  const a = { ...loja.carteiraNova(), moedas: 50, skates: ['classico', 'voador'], poderes: { ima: 3, pulo: 0, maleta: 0, supercarga: 0 } };
  const b = { ...loja.carteiraNova(), moedas: 900, skates: ['classico', 'supersonico'], poderes: { ima: 1, pulo: 2 } };
  const m = loja.mesclarCarteiras(a, b);
  assert.equal(m.moedas, 900);
  assert.deepEqual([...m.skates].sort(), ['classico', 'supersonico', 'voador']);
  assert.deepEqual(m.poderes, { ima: 3, pulo: 2, maleta: 0, supercarga: 0 });
});

// Robô de teste: olha à frente e escolhe a ação. Se ele corre longe, os obstáculos têm saída.
function roboDeTeste(s) {
  const perigo = (f, de, ate) => s.objetos.filter((o) => ['cerca', 'faixa', 'carrinho'].includes(o.tipo) && Math.round(o.faixa) === f && o.z + (o.comp ?? 0) > de && o.z < ate);
  // descendo de um pulo em cima de um obstáculo: troca de faixa no ar
  if (s.y > 0 && s.vy < 0 && perigo(s.faixa, 0, 5).length) {
    const livre = [s.faixa - 1, s.faixa + 1].find((f) => f >= 0 && f <= 2 && !perigo(f, -1, 6).length);
    if (livre !== undefined) { corrida.comando(s, livre < s.faixa ? 'esquerda' : 'direita'); return; }
  }
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

test('corrida: cenário escolhido fica fixo e o Passeio troca a cada 500 m', async () => {
  const { cenarioDaCorrida } = await import('../jogos/src/telas/corrida.js');
  assert.equal(cenarioDaCorrida('praia', 3000), 'praia');
  assert.equal(cenarioDaCorrida('desconhecido', 0), 'cidade');
  assert.deepEqual([0, 499, 500, 1000, 1500, 2000].map((d) => cenarioDaCorrida('passeio', d)), ['cidade', 'cidade', 'praia', 'floresta', 'neve', 'cidade']);
});
