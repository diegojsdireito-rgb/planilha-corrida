import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as pe from '../jogos/src/pescaria.js';
import { semente } from '../jogos/src/pintar-formas.js';

// ---------- robô de teste ----------
// Escolhe um peixe, calcula onde vai encontrá-lo e desce o anzol na hora certa.
// O "craque" acerta a conta; a "criança" demora para decidir, erra a mira, não prevê bem para onde o peixe vai,
// prefere o peixe mais perto, não segura o dedo para puxar mais rápido e toca devagar no Peixe-Rei.
const CRAQUE = { toques: 4 };
const CRIANCA = { erro: 10, reacao: 1, previsao: 0.3, puxa: false, toques: 3, ingenuo: true, pausa: 1.5 };

function jogar(n, s, { toques = 4, dt = 0.05, puxa = true, erro = 0, reacao = 0, previsao = 1, ingenuo = false, pausa = 0 } = {}) {
  const a = semente(s);
  const r = pe.novaRodada(n, a);
  const f = pe.fase(n);
  r.comecou = true;
  let prox = 0; let proxPlano = 0; let plano = null; let parado = 0;
  const ev = {};
  const encontro = (b) => {
    const der = f.corr * (b.y / pe.FUNDO);
    let x = b.x; let T = 0;
    for (let k = 0; k < 5; k++) {
      T = Math.max(Math.max(0, b.y - r.anzol) / pe.VEL_DESCE, Math.abs(x - der - r.barco) / pe.VEL_BARCO);
      x = b.x + b.vx * T * previsao;
    }
    return { x, T, barco: f.buracos ? pe.buracoPerto(f.buracos, x) : x - der, der };
  };
  while (!r.acabou) {
    if (r.relogio < parado) r.segurando = false;
    else if (r.disputa) {
      r.segurando = true;
      if (r.relogio >= prox) { pe.puxar(r); prox = r.relogio + 1 / toques; }
    } else if (r.preso) r.segurando = puxa;
    else {
      let melhor = plano && r.bichos.includes(plano.b) && r.relogio < proxPlano ? { ...plano, e: encontro(plano.b) } : null;
      if (melhor && erro) melhor.e.barco += plano.desvio;
      if (!melhor) {
        for (const b of r.bichos) {
          const t = pe.todos(b.tipo);
          if (t.lixo || !pe.visivel(b) || b.x < 4 || b.x > 96) continue;
          let valor = t.pontos;
          if (r.meta.tipo === 'peixe') valor = b.tipo === r.meta.peixe ? 1000 : t.pontos * 0.2;
          if (r.meta.tipo === 'rei') valor = t.rei ? 1000 : t.pontos * 0.1;
          if (r.meta.tipo === 'limpa') valor = 50 - b.y * 0.3;
          if (ingenuo && r.meta.tipo === 'pontos') valor = 10 + t.pontos * 0.3;
          const e = encontro(b);
          if (e.x < 3 || e.x > 97) continue;
          if (f.buracos && Math.abs(e.barco - e.x) > 3) { const tb = (e.barco - b.x) / (b.vx || 1e-6); if (tb < 0) continue; e.T = Math.max(e.T, tb); }
          const xc = e.barco + e.der;
          const bloqueio = r.bichos.some((q) => q !== b && pe.todos(q.tipo).lixo && Math.abs(q.x - xc) < 6 && q.y < b.y)
            || r.aguas.some((q) => Math.abs(q.x - xc) < 7 && q.y < b.y + 4);
          const nota = valor / (1 + e.T) * (bloqueio ? 0.1 : 1);
          if (!melhor || nota > melhor.nota) melhor = { b, nota, e };
        }
        if (melhor) { plano = { b: melhor.b, nota: melhor.nota, desvio: erro * (a() - 0.5) * 2 }; proxPlano = r.relogio + reacao; melhor.e.barco += plano.desvio; }
      }
      if (melhor) {
        const { b, e } = melhor;
        if (f.buracos) e.barco = pe.buracoPerto(f.buracos, b.x + b.vx * 1.2);
        r.alvo = e.barco;
        const desce = Math.max(0, b.y - r.anzol) / pe.VEL_DESCE;
        const lixoNoCaminho = r.bichos.some((q) => pe.todos(q.tipo).lixo && Math.abs(q.x - pe.xDoAnzol(r)) < 5 && q.y > r.anzol - 2 && q.y < b.y);
        if (f.buracos) {
          // no gelo: vai até o buraco, deixa o anzol na altura do peixe e espera ele chegar perto da luz
          r.segurando = Math.abs(r.barco - e.barco) < 0.5 && Math.abs(b.x - e.barco) < 30 && r.anzol < b.y + (r.segurando ? 2 : -2) && !lixoNoCaminho;
        } else r.segurando = Math.abs(e.barco - r.barco) / pe.VEL_BARCO <= desce + 0.05 && r.anzol < b.y + 3 && !lixoNoCaminho;
      } else r.segurando = false;
    }
    for (const e of pe.passo(r, dt, a)) {
      ev[e.tipo] = (ev[e.tipo] ?? 0) + 1;
      if (['pescou', 'roubou', 'soltou'].includes(e.tipo)) parado = r.relogio + pausa;
    }
  }
  return { venceu: r.venceu, est: pe.estrelas(r.restante, r.tempo, r.venceu), ev, r };
}

const media = (l) => l.reduce((t, x) => t + x, 0) / l.length;
function rodar(fases, perfil, vezes) {
  const res = {};
  for (const n of fases) {
    const jogos = Array.from({ length: vezes }, (_, s) => jogar(n, s * 13 + 7, perfil));
    res[n] = { vence: media(jogos.map((j) => (j.venceu ? 1 : 0))), est: media(jogos.map((j) => j.est)), jogos };
  }
  return res;
}
const todas = Array.from({ length: pe.TOTAL_FASES }, (_, k) => k + 1);

// ---------- fases ----------
test('40 fases em 4 lugares, com o Peixe-Rei a cada 10', () => {
  assert.equal(pe.TOTAL_FASES, 40);
  assert.deepEqual(pe.LUGARES.map((l) => l.id), ['lagoa', 'rio', 'mar', 'gelo']);
  for (const n of todas) {
    const f = pe.fase(n);
    assert.equal(f.lugar, pe.lugarDa(n).id);
    assert.equal(f.lugar, pe.LUGARES[Math.floor((n - 1) / 10)].id);
    assert.equal(f.meta.tipo === 'rei', n % 10 === 0, `fase ${n}`);
    assert.ok(f.tempo >= 60);
    assert.ok(pe.textoMeta(f.meta).length > 5);
  }
  assert.deepEqual(pe.fase(7), pe.fase(7), 'o gerador é determinístico');
  assert.equal(pe.fase(0).n, 1); assert.equal(pe.fase(99).n, 40);
});

test('metas variadas e textos', () => {
  const tipos = new Set(todas.map((n) => pe.fase(n).meta.tipo));
  assert.deepEqual([...tipos].sort(), ['limpa', 'peixe', 'pontos', 'rei']);
  assert.equal(pe.textoMeta({ tipo: 'pontos', alvo: 150 }), 'Faça 150 pontos');
  assert.equal(pe.textoMeta({ tipo: 'peixe', peixe: 'dourado', alvo: 3 }), 'Pegue 3 peixes dourados');
  assert.equal(pe.textoMeta({ tipo: 'peixe', peixe: 'dourado', alvo: 1 }), 'Pegue 1 peixe dourado');
  assert.equal(pe.textoMeta({ tipo: 'limpa', alvo: 8 }), 'Pegue 8 peixes seguidos sem pescar lixo');
  assert.match(pe.textoMeta({ tipo: 'rei' }), /Peixe-Rei/);
});

test('a dificuldade cresce aos poucos: peixes mais rápidos, mais lixo e metas maiores', () => {
  for (let n = 2; n <= 40; n++) {
    const a = pe.fase(n - 1); const b = pe.fase(n);
    if (a.lugar === b.lugar) assert.ok(b.vel >= a.vel, `velocidade na fase ${n}`);
    assert.ok(b.vel - a.vel < 0.12, `sem pulo de velocidade na fase ${n}`);
  }
  const pontos = (l) => todas.filter((n) => pe.fase(n).lugar === l && pe.fase(n).meta.tipo === 'pontos').map((n) => pe.fase(n).meta.alvo);
  for (const l of ['lagoa', 'rio', 'mar', 'gelo']) { const p = pontos(l); for (let k = 1; k < p.length; k++) assert.ok(p[k] > p[k - 1], l); }
  const limpa = todas.filter((n) => pe.fase(n).meta.tipo === 'limpa').map((n) => pe.fase(n).meta.alvo);
  for (let k = 1; k < limpa.length; k++) assert.ok(limpa[k] >= limpa[k - 1]);
  assert.ok(pe.fase(40).lixo > pe.fase(1).lixo);
  assert.ok(pe.fase(39).vel > pe.fase(1).vel * 1.2 || pe.fase(29).vel > pe.fase(1).vel * 1.4);
  assert.ok(pe.fase(40).rei.forca > pe.fase(10).rei.forca, 'o último Peixe-Rei puxa mais forte');
});

test('cada lugar tem o seu desafio', () => {
  const lagoa = pe.fase(3); const rio = pe.fase(13); const mar = pe.fase(23); const gelo = pe.fase(33);
  assert.equal(lagoa.corr + lagoa.ariscos + lagoa.aguas + lagoa.tubarao + lagoa.pisca, 0);
  assert.ok(rio.corr > 0 && rio.ariscos > 0 && !rio.aguas);
  assert.ok(mar.aguas > 0 && mar.tubarao > 0 && !mar.corr);
  assert.ok(gelo.buracos.length >= 3 && gelo.pisca > 0);
  const r = pe.novaRodada(23, semente(1));
  assert.equal(r.aguas.length, mar.aguas);
  assert.ok(r.tubarao);
  assert.ok(pe.novaRodada(13, semente(1)).bichos.some((b) => b.arisco));
  assert.ok(pe.novaRodada(38, semente(1)).bichos.some((b) => b.pisca));
});

test('fase nova: peixes e lixo da fase, todos dentro do lago; o Peixe-Rei está lá', () => {
  for (const n of [1, 15, 25, 35, 10]) {
    const f = pe.fase(n);
    const r = pe.novaRodada(n, semente(4));
    assert.equal(r.bichos.filter((b) => pe.todos(b.tipo).lixo).length, f.lixo);
    assert.equal(r.bichos.filter((b) => !pe.todos(b.tipo).lixo && b.tipo !== 'rei').length, f.peixes);
    assert.equal(r.bichos.some((b) => b.tipo === 'rei'), n % 10 === 0);
    for (const b of r.bichos) { assert.ok(b.x >= 0 && b.x <= pe.LARGURA); assert.ok(b.y > 0 && b.y < pe.FUNDO); }
    assert.equal(r.restante, f.tempo);
    assert.equal(r.fase, n);
  }
});

// ---------- regras ----------
test('sem começar, nada se mexe', () => {
  const r = pe.novaRodada(1, semente(2));
  const x = r.bichos[0].x;
  assert.deepEqual(pe.passo(r, 0.1), []);
  assert.equal(r.bichos[0].x, x);
  assert.equal(r.restante, r.tempo);
});

test('segurar desce o anzol, soltar sobe', () => {
  const r = pe.novaRodada(1, semente(2));
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

test('o barco vai atrás do dedo sem sair do lago; no gelo, só de buraco em buraco', () => {
  const r = pe.novaRodada(1, semente(2));
  r.bichos = []; r.comecou = true;
  r.alvo = 200;
  for (let k = 0; k < 40; k++) pe.passo(r, 0.1);
  assert.ok(r.barco <= pe.LARGURA - 5);
  r.alvo = 30;
  for (let k = 0; k < 40; k++) pe.passo(r, 0.1);
  assert.ok(Math.abs(r.barco - 30) < 0.01);
  const g = pe.novaRodada(31, semente(2));
  g.bichos = []; g.comecou = true; g.alvo = 33;
  for (let k = 0; k < 40; k++) pe.passo(g, 0.1);
  assert.ok(pe.fase(31).buracos.includes(g.barco), 'parou num buraco');
  g.segurando = true; pe.passo(g, 0.1); pe.passo(g, 0.1);
  const x = g.barco; g.alvo = 90;
  for (let k = 0; k < 5; k++) pe.passo(g, 0.1);
  assert.equal(g.barco, x, 'com o anzol na água, não sai do buraco');
});

function pescarUm(r, bicho, a, segurar = false) {
  r.bichos = [bicho];
  r.comecou = true; r.segurando = true;
  const eventos = [];
  for (let k = 0; k < 80 && !eventos.some((e) => e.tipo === 'pescou' || e.tipo === 'fim'); k++) { eventos.push(...pe.passo(r, 0.05, a)); if (r.preso && !segurar) r.segurando = false; }
  return eventos;
}

test('fisgar um peixe e trazer até o barco soma os pontos', () => {
  const a = semente(3);
  const r = pe.novaRodada(3, a);
  const eventos = pescarUm(r, { id: -1, tipo: 'dourado', x: r.barco, y: 20, y0: 20, vx: 0, v: 0, fase: 0 }, a);
  assert.ok(eventos.some((e) => e.tipo === 'fisgou' && e.bicho.tipo === 'dourado'));
  assert.equal(eventos.find((e) => e.tipo === 'pescou').pontos, 100);
  assert.equal(r.pontos, 100);
  assert.equal(r.pescados.dourado, 1);
  assert.equal(r.preso, null);
});

test('segurando o dedo com o peixe preso, ele sobe mais rápido', () => {
  const tempo = (segurar) => {
    const a = semente(3); const r = pe.novaRodada(3, a);
    r.anzol = 90; r.preso = { id: -1, tipo: 'piaba', x: r.barco, y: 92, y0: 92, vx: 0, v: 0, fase: 0 }; r.bichos = []; r.comecou = true; r.segurando = segurar;
    let t = 0; while (r.preso) { pe.passo(r, 0.05, a); t += 0.05; }
    return t;
  };
  assert.ok(tempo(true) < tempo(false) * 0.8);
});

test('lixo tira pontos (sem ficar negativo) e zera a sequência', () => {
  const a = semente(5);
  const r = pe.novaRodada(4, a);
  r.pontos = 5; r.seguidos = 3;
  const eventos = pescarUm(r, { id: -2, tipo: 'bota', x: r.barco, y: 10, y0: 10, vx: 0, v: 2, fase: 0 }, a);
  assert.equal(eventos.find((e) => e.tipo === 'pescou').pontos, -15);
  assert.equal(r.pontos, 0);
  assert.equal(r.seguidos, 0);
});

test('a fase acaba quando cumpre a meta (vitória) ou quando o tempo acaba (derrota)', () => {
  const a = semente(6);
  const r = pe.novaRodada(1, a);
  r.pontos = r.meta.alvo - 5;
  const ev = pescarUm(r, { id: -3, tipo: 'piaba', x: r.barco, y: 12, y0: 12, vx: 0, v: 0, fase: 0 }, a);
  assert.ok(ev.some((e) => e.tipo === 'fim' && e.venceu));
  assert.ok(r.acabou && r.venceu);
  assert.deepEqual(pe.passo(r, 0.1, a), []);
  const d = pe.novaRodada(2, a); d.comecou = true; d.bichos = [];
  let t = 0; let fim = null;
  while (!fim && t < 80) { fim = pe.passo(d, 0.1, a).find((e) => e.tipo === 'fim'); t += 0.1; }
  assert.ok(fim && !fim.venceu);
  assert.ok(Math.abs(t - d.tempo) < 0.2);
});

test('andamento da meta de cada tipo', () => {
  const r = pe.novaRodada(2, semente(1)); // pegue 3 peixes-laranja
  assert.equal(r.meta.tipo, 'peixe');
  r.pescados = { laranja: 2, piaba: 4 };
  assert.deepEqual(pe.andamento(r), { feito: 2, alvo: 3 });
  r.pescados.laranja = 3; assert.ok(pe.cumpriu(r));
  const l = pe.novaRodada(4, semente(1)); l.seguidos = l.meta.alvo - 1; assert.ok(!pe.cumpriu(l)); l.seguidos++; assert.ok(pe.cumpriu(l));
  const k = pe.novaRodada(10, semente(1)); assert.ok(!pe.cumpriu(k)); k.pescados.rei = 1; assert.ok(pe.cumpriu(k));
});

test('estrelas pelo tempo que sobrou', () => {
  assert.equal(pe.estrelas(30, 60), 3);
  assert.equal(pe.estrelas(24, 60), 3);
  assert.equal(pe.estrelas(23, 60), 2);
  assert.equal(pe.estrelas(12, 60), 2);
  assert.equal(pe.estrelas(5, 60), 1);
  assert.equal(pe.estrelas(30, 60, false), 0);
});

test('nas fases de "pegue N", sempre volta um peixe do tipo pedido', () => {
  const a = semente(8);
  const r = pe.novaRodada(18, a); // pegue 1 dourado
  r.bichos = r.bichos.filter((b) => b.tipo !== 'dourado').map((b) => ({ ...b, x: -50 }));
  r.comecou = true;
  pe.passo(r, 0.05, a);
  assert.ok(r.bichos.some((b) => b.tipo === 'dourado'));
});

// ---------- obstáculos ----------
test('rio: a correnteza empurra o anzol para o lado, mais quanto mais fundo', () => {
  const r = pe.novaRodada(15, semente(2));
  r.bichos = []; r.comecou = true; r.segurando = true;
  for (let k = 0; k < 40; k++) pe.passo(r, 0.05);
  assert.ok(pe.xDoAnzol(r) - r.barco > pe.fase(15).corr * 0.5, 'o anzol foi para a direita');
  const lagoa = pe.novaRodada(5, semente(2)); lagoa.bichos = []; lagoa.comecou = true; lagoa.segurando = true;
  for (let k = 0; k < 40; k++) pe.passo(lagoa, 0.05);
  assert.equal(pe.xDoAnzol(lagoa), lagoa.barco);
});

test('rio: o peixe arisco foge quando o anzol chega perto pelo lado', () => {
  const a = semente(2);
  const r = pe.novaRodada(12, a);
  r.bichos = [{ id: -4, tipo: 'rosa', x: r.barco + 8, y: 40, y0: 40, vx: -8, v: 8, fase: 0, arisco: true, susto: 0 }];
  r.comecou = true; r.anzol = 40;
  const ev = pe.passo(r, 0.05, a);
  assert.ok(ev.some((e) => e.tipo === 'fugiu'));
  assert.ok(r.bichos[0].vx > 0, 'virou e foi embora');
  assert.ok(r.bichos[0].susto > 0);
});

test('mar: água-viva na linha faz soltar o peixe', () => {
  const a = semente(2);
  const r = pe.novaRodada(25, a);
  r.comecou = true; r.bichos = []; r.tubarao = null;
  r.anzol = 60; r.preso = { id: -5, tipo: 'roxo', x: r.barco, y: 62, y0: 62, vx: 5, v: 5, fase: 0 };
  r.aguas = [{ id: -6, x: r.barco, y: 30, y0: 30, vx: 0, fase: 0, choque: 0 }];
  const ev = pe.passo(r, 0.05, a);
  assert.ok(ev.some((e) => e.tipo === 'soltou'));
  assert.equal(r.preso, null);
  assert.ok(r.bichos.some((b) => b.tipo === 'roxo'), 'o peixe voltou a nadar');
  assert.ok(r.aguas[0].choque > 0);
});

test('mar: o tubarão vem roubar o peixe de quem demora a subir', () => {
  const montar = () => {
    const a = semente(9);
    const r = pe.novaRodada(29, a);
    r.comecou = true; r.bichos = []; r.aguas = [];
    r.anzol = 95; r.preso = { id: -7, tipo: 'roxo', x: 30, y: 97, y0: 97, vx: 5, v: 5, fase: 0 }; r.barco = 30; r.alvo = 30;
    r.tubarao = { x: 70, y: 80, vx: -10, modo: 'ronda', t: 0 };
    return { a, r };
  };
  const devagar = montar(); const ev = [];
  while (devagar.r.preso) ev.push(...pe.passo(devagar.r, 0.05, devagar.a));
  assert.ok(ev.some((e) => e.tipo === 'tubarao'));
  assert.ok(ev.some((e) => e.tipo === 'roubou'), 'sem segurar o dedo, o tubarão alcança');
  const rapido = montar(); rapido.r.segurando = true; const ev2 = [];
  rapido.r.tubarao.x = 95;
  while (rapido.r.preso) ev2.push(...pe.passo(rapido.r, 0.05, rapido.a));
  assert.ok(ev2.some((e) => e.tipo === 'pescou'), 'segurando, dá para escapar quando ele está longe');
});

test('mar gelado: peixe que brilha some e não dá para fisgar sumido', () => {
  const b = { pisca: true, tp: 0 };
  assert.ok(pe.visivel(b));
  b.tp = pe.CICLO_PISCA - 0.2;
  assert.ok(!pe.visivel(b));
  assert.equal(pe.brilho(b), 0);
  const a = semente(2);
  const r = pe.novaRodada(35, a);
  r.bichos = [{ id: -8, tipo: 'rosa', x: r.barco, y: 20, y0: 20, vx: 0, v: 0, fase: 0, pisca: true, tp: pe.CICLO_PISCA - 1.2 }];
  r.comecou = true; r.anzol = 18; r.segurando = true;
  pe.passo(r, 0.05, a);
  assert.equal(r.preso, null, 'sumido, o anzol passa direto');
});

test('Peixe-Rei: fisgado, ele puxa; tocando rápido ele sobe, sem tocar ele escapa', () => {
  const comecar = () => {
    const a = semente(4);
    const r = pe.novaRodada(20, a);
    const rei = r.bichos.find((b) => b.tipo === 'rei');
    r.bichos = [{ ...rei, x: r.barco, y: 60, y0: 60, vx: 0 }];
    r.comecou = true; r.segurando = true;
    while (!r.disputa) pe.passo(r, 0.05, a);
    return { a, r };
  };
  const parado = comecar(); const ev = [];
  for (let k = 0; k < 200 && parado.r.disputa; k++) ev.push(...pe.passo(parado.r, 0.05, parado.a));
  assert.ok(ev.some((e) => e.tipo === 'escapou'));
  assert.equal(parado.r.preso, null);
  assert.ok(parado.r.bichos.some((b) => b.tipo === 'rei'), 'ele volta a nadar');
  const tocando = comecar(); const ev2 = []; let t = 0;
  for (let k = 0; k < 400 && !tocando.r.acabou; k++) { if (k % 5 === 0) pe.puxar(tocando.r); ev2.push(...pe.passo(tocando.r, 0.05, tocando.a)); t += 0.05; }
  assert.ok(ev2.some((e) => e.tipo === 'pescou' && e.bicho.tipo === 'rei'));
  assert.ok(tocando.r.venceu);
  assert.ok(ev2.some((e) => e.tipo === 'puxao'), 'ele dá puxões');
  assert.equal(pe.puxar(tocando.r), false, 'depois de acabar, tocar não faz nada');
});

// ---------- bônus ----------
test('bônus: +15 segundos, isca dourada e rede', () => {
  const a = semente(3);
  const r = pe.novaRodada(5, a);
  r.comecou = true;
  const antes = r.restante;
  assert.ok(pe.usarBonus(r, 'tempo', a));
  assert.equal(r.restante, antes + pe.MAIS_TEMPO);
  // isca: o peixe da meta vem até o anzol
  r.bichos = [{ id: -9, tipo: 'rosa', x: 10, y: 80, y0: 80, vx: -5, v: 5, fase: 0 }];
  r.barco = 60; r.alvo = 60; r.anzol = 40;
  assert.ok(pe.usarBonus(r, 'isca', a));
  assert.equal(pe.usarBonus(r, 'isca', a), null, 'uma isca de cada vez');
  const peixe = r.bichos.find((b) => b.id === -9);
  const d0 = Math.abs(peixe.x - 60) + Math.abs(peixe.y0 - 40);
  for (let k = 0; k < 20; k++) { r.segurando = false; r.anzol = 40; pe.passo(r, 0.05, a); }
  const vivo = r.bichos.find((b) => b.id === -9) ?? r.preso;
  assert.ok(!vivo || vivo === r.preso || Math.abs(vivo.x - 60) + Math.abs(vivo.y0 - 40) < d0 - 5, 'chegou mais perto');
  // rede: pega os peixes em volta do anzol, sem o lixo
  const s = pe.novaRodada(5, a); s.comecou = true; s.barco = 50; s.anzol = 50;
  s.bichos = [
    { id: 1, tipo: 'piaba', x: 52, y: 48, y0: 48, vx: 1, v: 1, fase: 0 },
    { id: 2, tipo: 'roxo', x: 40, y: 58, y0: 58, vx: 1, v: 1, fase: 0 },
    { id: 3, tipo: 'bota', x: 50, y: 52, y0: 52, vx: 1, v: 1, fase: 0 },
    { id: 4, tipo: 'laranja', x: 90, y: 20, y0: 20, vx: 1, v: 1, fase: 0 },
  ];
  const ev = pe.usarBonus(s, 'rede', a);
  assert.equal(ev.filter((e) => e.tipo === 'pescou').length, 2);
  assert.equal(s.pontos, 45);
  assert.ok(s.bichos.some((b) => b.id === 3), 'a bota ficou');
  assert.ok(s.bichos.some((b) => b.id === 4), 'o peixe longe ficou');
  s.bichos = [{ id: 5, tipo: 'piaba', x: 5, y: 100, y0: 100, vx: 1, v: 1, fase: 0 }];
  assert.equal(pe.usarBonus(s, 'rede', a), null, 'sem peixe perto, a rede não é gasta');
});

test('prêmios: um bônus por estrela; moedas só na primeira vitória e em estrelas novas', () => {
  const p = pe.sortearPremios(3, semente(1));
  assert.equal(p.length, 3);
  for (const id of p) assert.ok(pe.BONUS.some((b) => b.id === id));
  assert.equal(pe.moedasGanhas(0, 2), 20);
  assert.equal(pe.moedasGanhas(0, 3), 30);
  assert.equal(pe.moedasGanhas(1, 3), 10);
  assert.equal(pe.moedasGanhas(2, 2), 0);
  assert.equal(pe.moedasGanhas(3, 1), 0);
  assert.equal(pe.moedasGanhas(1, 0), 0);
});

test('progresso pelo histórico, ignorando registros antigos sem fase', () => {
  const h = [
    { j: 'pescaria', r: 'vitoria', n: 'facil', pontos: 120, estrelas: 2 }, // versão antiga
    { j: 'pescaria', r: 'vitoria', nivel: 1, estrelas: 2, pontos: 80 },
    { j: 'pescaria', r: 'vitoria', nivel: 1, estrelas: 3, pontos: 70 },
    { j: 'pescaria', r: 'derrota', nivel: 2, estrelas: 0, pontos: 30 },
    { j: 'pescaria', r: 'vitoria', nivel: 2, estrelas: 1, pontos: 90 },
    { j: 'docinhos', r: 'vitoria', nivel: 9, estrelas: 3 },
  ];
  const p = pe.progresso(h);
  assert.equal(p.liberada, 3);
  assert.equal(p.melhor[1].estrelas, 3);
  assert.equal(p.melhor[1].pontos, 80);
  assert.equal(p.melhor[2].vezes, 2);
  assert.equal(p.estrelas, 4);
  assert.equal(p.maxEstrelas, 120);
  assert.equal(pe.progresso([]).liberada, 1);
  assert.equal(pe.progresso([{ j: 'pescaria', r: 'vitoria', nivel: 40, estrelas: 3 }]).liberada, 40);
});

test('partidas salvas de versões antigas são descartadas', () => {
  assert.ok(!pe.salvoValido(null));
  assert.ok(!pe.salvoValido({ nivel: 'facil', meta: 100, bichos: [], restante: 30 }));
  const r = pe.novaRodada(12, semente(1));
  assert.ok(pe.salvoValido(JSON.parse(JSON.stringify(r))));
});

// ---------- dá para passar? ----------
test('simulação: o robô craque passa todas as fases', () => {
  const res = rodar(todas, CRAQUE, 8);
  for (const n of todas) assert.ok(res[n].vence >= 0.75, `fase ${n}: venceu ${res[n].vence * 100}%`);
  assert.ok(todas.filter((n) => res[n].est >= 2).length >= 36, 'e ganha 2 ou 3 estrelas em quase todas');
});

test('simulação: com jeito de criança, as primeiras fases são fáceis e as do fim, desafiadoras mas possíveis', () => {
  const res = rodar(todas, CRIANCA, 12);
  const doLugar = (k) => todas.slice(k * 10, k * 10 + 10);
  for (const n of doLugar(0)) assert.ok(res[n].vence >= 0.9, `fase ${n}: ${res[n].vence}`);
  const vence = [0, 1, 2, 3].map((k) => media(doLugar(k).map((n) => res[n].vence)));
  const est = [0, 1, 2, 3].map((k) => media(doLugar(k).map((n) => res[n].est)));
  for (let k = 1; k < 4; k++) assert.ok(est[k] < est[k - 1] + 0.05, `as estrelas vão ficando mais difíceis: ${est.map((e) => e.toFixed(2))}`);
  assert.ok(vence[3] > 0.4 && vence[3] < 0.95, `Mar Gelado: vence ${vence[3]}`);
  for (const n of todas) assert.ok(res[n].vence > 0, `fase ${n} não pode ser impossível`);
  for (let n = 2; n <= 40; n++) assert.ok(res[n - 1].vence - res[n].vence < 0.75, `sem degrau enorme na fase ${n}`);
});
