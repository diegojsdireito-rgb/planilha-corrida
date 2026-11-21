import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as pe from '../jogos/src/pescaria.js';
import { semente } from '../jogos/src/pintar-formas.js';

test('rodada nova: peixes e lixo pelo nível, todos dentro do lago', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) {
    const r = pe.novaRodada(nivel, semente(4));
    const cfg = pe.NIVEIS[nivel];
    assert.equal(r.bichos.length, cfg.peixes + cfg.lixo);
    assert.equal(r.bichos.filter((b) => pe.todos(b.tipo).lixo).length, cfg.lixo);
    for (const b of r.bichos) { assert.ok(b.x >= 0 && b.x <= pe.LARGURA); assert.ok(b.y > 0 && b.y < pe.FUNDO); }
    assert.equal(r.restante, pe.DURACAO);
    assert.equal(r.meta, cfg.meta);
  }
});

test('nível difícil tem peixes mais rápidos e mais lixo', () => {
  assert.ok(pe.NIVEIS.dificil.vel > pe.NIVEIS.medio.vel && pe.NIVEIS.medio.vel > pe.NIVEIS.facil.vel);
  assert.ok(pe.NIVEIS.dificil.lixo > pe.NIVEIS.facil.lixo);
  const vel = (nivel) => Math.abs(pe.criar('piaba', pe.NIVEIS[nivel], semente(1)).vx);
  assert.ok(vel('dificil') > vel('facil'));
  assert.ok(pe.TIPOS.dourado.pontos > pe.TIPOS.piaba.pontos * 10, 'o dourado vale muito');
  assert.ok(pe.TIPOS.dourado.peso < pe.TIPOS.piaba.peso, 'e é raro');
});

test('sem começar, nada se mexe', () => {
  const r = pe.novaRodada('facil', semente(2));
  const x = r.bichos[0].x;
  assert.deepEqual(pe.passo(r, 0.1), []);
  assert.equal(r.bichos[0].x, x);
  assert.equal(r.restante, pe.DURACAO);
});

test('segurar desce o anzol, soltar sobe', () => {
  const r = pe.novaRodada('facil', semente(2));
  r.bichos = [];
  r.comecou = true; r.segurando = true;
  for (let k = 0; k < 10; k++) pe.passo(r, 0.1);
  assert.ok(Math.abs(r.anzol - pe.VEL_DESCE) < 0.01);
  r.segurando = false;
  pe.passo(r, 0.1);
  assert.ok(r.anzol < pe.VEL_DESCE);
  for (let k = 0; k < 30; k++) pe.passo(r, 0.1);
  assert.equal(r.anzol, 0);
});

test('o barco vai atrás do dedo sem sair do lago', () => {
  const r = pe.novaRodada('facil', semente(2));
  r.bichos = []; r.comecou = true;
  r.alvo = 200;
  for (let k = 0; k < 40; k++) pe.passo(r, 0.1);
  assert.ok(r.barco <= pe.LARGURA - 5);
  r.alvo = 30;
  for (let k = 0; k < 40; k++) pe.passo(r, 0.1);
  assert.ok(Math.abs(r.barco - 30) < 0.01);
});

test('fisgar um peixe e trazer até o barco soma os pontos', () => {
  const a = semente(3);
  const r = pe.novaRodada('facil', a);
  r.bichos = [{ id: -1, tipo: 'dourado', x: r.barco, y: 20, y0: 20, vx: 0, fase: 0 }];
  r.comecou = true; r.segurando = true;
  const eventos = [];
  for (let k = 0; k < 60 && !eventos.some((e) => e.tipo === 'pescou'); k++) { eventos.push(...pe.passo(r, 0.05, a)); if (r.preso) r.segurando = false; }
  assert.ok(eventos.some((e) => e.tipo === 'fisgou' && e.bicho.tipo === 'dourado'));
  const p = eventos.find((e) => e.tipo === 'pescou');
  assert.equal(p.pontos, 100);
  assert.equal(r.pontos, 100);
  assert.equal(r.pescados.dourado, 1);
  assert.equal(r.preso, null);
  assert.equal(r.bichos.length, 1, 'outro peixe entra no lugar');
});

test('lixo tira pontos, mas o placar não fica negativo', () => {
  const a = semente(5);
  const r = pe.novaRodada('medio', a);
  r.bichos = [{ id: -2, tipo: 'bota', x: r.barco, y: 10, y0: 10, vx: 0, fase: 0 }];
  r.pontos = 5;
  r.comecou = true; r.segurando = true;
  const eventos = [];
  for (let k = 0; k < 60 && !eventos.some((e) => e.tipo === 'pescou'); k++) { eventos.push(...pe.passo(r, 0.05, a)); if (r.preso) r.segurando = false; }
  assert.equal(eventos.find((e) => e.tipo === 'pescou').pontos, -15);
  assert.equal(r.pontos, 0);
});

test('a rodada acaba em 60 segundos', () => {
  const a = semente(6);
  const r = pe.novaRodada('dificil', a);
  r.comecou = true;
  let fim = false; let t = 0;
  while (!fim && t < 70) { fim = pe.passo(r, 0.1, a).some((e) => e.tipo === 'fim'); t += 0.1; }
  assert.ok(fim);
  assert.ok(Math.abs(t - pe.DURACAO) < 0.2);
  assert.ok(r.acabou);
  assert.deepEqual(pe.passo(r, 0.1, a), []);
  assert.equal(r.bichos.length, pe.NIVEIS.dificil.peixes + pe.NIVEIS.dificil.lixo, 'a quantidade de bichos se mantém');
});

test('estrelas, vitória e recorde', () => {
  assert.equal(pe.estrelas(99, 100), 0);
  assert.equal(pe.estrelas(100, 100), 1);
  assert.equal(pe.estrelas(150, 100), 2);
  assert.equal(pe.estrelas(200, 100), 3);
  assert.ok(pe.venceu({ pontos: 120, meta: 120 }));
  assert.ok(!pe.venceu({ pontos: 119, meta: 120 }));
  const h = [{ j: 'pescaria', pontos: 80, n: 'facil' }, { j: 'pescaria', pontos: 210, n: 'medio' }, { j: 'corrida', pontos: 9999 }];
  assert.equal(pe.recorde(h), 210);
  assert.equal(pe.recorde(h, 'facil'), 80);
  assert.equal(pe.recorde([]), 0);
});

test('jogando com uma estratégia simples dá para bater a meta em todos os níveis', () => {
  const jogar = (nivel, s) => {
    const a = semente(s);
    const r = pe.novaRodada(nivel, a);
    r.comecou = true;
    while (!r.acabou) {
      const alvo = r.bichos.filter((b) => !pe.todos(b.tipo).lixo && b.x > 8 && b.x < 92).sort((x, y) => pe.todos(y.tipo).pontos - pe.todos(x.tipo).pontos)[0];
      if (alvo) r.alvo = alvo.x + alvo.vx * 0.4;
      r.segurando = Boolean(!r.preso && alvo && Math.abs(r.barco - alvo.x) < 5 && r.anzol < alvo.y + 3);
      pe.passo(r, 0.05, a);
    }
    return r.pontos;
  };
  for (const nivel of ['facil', 'medio', 'dificil']) {
    const pontos = Array.from({ length: 8 }, (_, s) => jogar(nivel, s * 7 + 1));
    const media = pontos.reduce((t, p) => t + p, 0) / pontos.length;
    assert.ok(media >= pe.NIVEIS[nivel].meta, `${nivel}: média ${media} de ${pe.NIVEIS[nivel].meta}`);
    assert.ok(Math.max(...pontos) >= pe.NIVEIS[nivel].meta * 1.5, `${nivel}: dá para ganhar 2 estrelas`);
  }
});
