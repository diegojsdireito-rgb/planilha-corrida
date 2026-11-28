// Corrida dos Cachinhos: obstáculos em movimento (ônibus, bicicleta, cachorro, caranguejo, bola de praia,
// tronco, galho, bola de neve e pinguim). Movimento determinístico, aviso antes, sempre uma passagem,
// colisões e o robô de teste correndo em todos os cenários.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as corrida from '../jogos/src/corrida.js';

const { MOVEIS, criarMovel, posicionar, comoPassar, ehObstaculo, colide } = corrida;
const TIPOS = Object.keys(MOVEIS);

function semente(n) {
  let s = n;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// Corrida parada: sem linhas sorteadas e sem quem persegue por perto.
function pista(nivel = 'medio', dist = 1000) {
  const s = corrida.nova(nivel);
  s.dist = dist; s.ultimaLinha = 1e9; s.perseguidor = { dist: 99, perto: 0 };
  return s;
}

// Posições de teste da menina: no chão, no meio de um pulo e deslizando.
const POSES = [{ y: 0, deslizando: 0 }, { y: 1.2, deslizando: 0 }, { y: 0, deslizando: 0.5 }];
const bate = (o, x, pose) => colide({ x, ...pose }, o);

test('móveis: o movimento depende só da distância e é sempre o mesmo', () => {
  for (const tipo of TIPOS) {
    const a = criarMovel(tipo, corrida.LONGE, semente(7), 20);
    const b = criarMovel(tipo, corrida.LONGE, semente(7), 20);
    assert.deepEqual(a, b, tipo);
    // andar aos pouquinhos ou de uma vez dá no mesmo lugar
    const c = { ...a }; const d = { ...a };
    for (let k = 0; k < 400; k++) { c.z -= 0.1; posicionar(c); }
    d.z -= 40; posicionar(d);
    assert.ok(Math.abs(c.faixa - d.faixa) < 1e-9 && Math.abs((c.h ?? 0) - (d.h ?? 0)) < 1e-9, tipo);
    assert.ok(comoPassar(a), tipo);
  }
});

test('móveis: aviso desde que aparecem, com tempo de sobra, e chegam na faixa avisada', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) {
    for (const dist of [corrida.INICIO_MOVEIS, 1000, 3000, 10000, 40000]) {
      for (const skate of [1, 1.22]) { // o skate supersônico corre mais
        const vel = corrida.velocidadeEm(nivel, dist) * skate;
        for (const tipo of TIPOS) {
          for (const destino of [0, 1, 2]) {
            const o = criarMovel(tipo, corrida.LONGE, semente(destino + 3), vel, { destino });
            assert.equal(o.destino, destino);
            // anda no tempo até a frente dele chegar na menina
            let t = 0;
            while (o.z > 0.45) { const dt = 1 / 120; o.z -= (vel + o.vz) * dt; posicionar(o); t += dt; }
            assert.ok(t >= corrida.AVISO_MIN, `${tipo} chegou em ${t.toFixed(2)} s a ${vel.toFixed(1)} m/s`);
            const x = tipo === 'galho' ? o.destino : o.faixa;
            assert.ok(Math.abs(x - destino) < 0.2, `${tipo} chegou na faixa ${x.toFixed(2)}, avisou ${destino}`);
          }
        }
      }
    }
  }
});

test('móveis: durante todo o caminho sempre sobra uma faixa livre (ou que dá para pular ou deslizar)', () => {
  for (const tipo of TIPOS) {
    for (let n = 1; n <= 60; n++) {
      const r = semente(n);
      const vel = 12 + r() * 30;
      const o = criarMovel(tipo, corrida.LONGE, r, vel);
      for (let t = 0; o.z + o.comp > -1; t += 1 / 120) {
        o.z -= (vel + o.vz) / 120; o.passo = (vel + o.vz) / 120; posicionar(o);
        // a cada instante, alguma faixa é livre para quem fica no chão
        const livres = [0, 1, 2].filter((f) => !bate(o, f, POSES[0]));
        assert.ok(livres.length >= 1, `${tipo} fechou as três faixas`);
        // e na faixa do aviso sempre dá para passar do jeito que ele pede
        if (o.z < 0.45 && o.z + o.comp > -0.45) {
          const jeito = comoPassar(o);
          if (jeito === 'pular') assert.ok(!bate(o, o.destino, POSES[1]), `${tipo}: pular não passa`);
          if (jeito === 'deslizar') assert.ok(!bate(o, o.destino, POSES[2]), `${tipo}: deslizar não passa`);
        }
      }
    }
  }
});

// Faz a menina passar por um obstáculo do jeito pedido e diz se ela continua correndo.
function passar(tipo, acao, { destino = 1, faixa = 1, opcoes = {}, antes = () => {} } = {}) {
  const s = pista();
  s.faixa = faixa; s.x = faixa;
  const o = criarMovel(tipo, 40, semente(5), s.vel, { destino, ...opcoes });
  s.objetos = [o];
  antes(s);
  let feito = false;
  for (let k = 0; k < 60 * 6 && s.vivo && o.z + o.comp > -3; k++) {
    const falta = o.z / (s.vel + o.vz); // segundos até a frente dele chegar
    if (!feito && acao && falta < (acao === 'pular' ? 0.16 : acao === 'superpulo' ? 0.2 : 0.3)) {
      if (acao === 'superpulo') { s.superPulo = 5; corrida.comando(s, 'pular'); } else corrida.comando(s, acao);
      feito = true;
    }
    corrida.avancar(s, 1 / 60);
  }
  return s;
}

test('móveis: cada um bate de verdade e cada um tem o seu jeito de passar', () => {
  for (const tipo of TIPOS) {
    const opcoes = tipo === 'galho' ? { fase: -Math.PI * 2 * 0.25 / 16 } : {}; // o galho chega bem embaixo
    assert.equal(passar(tipo, null, { opcoes }).vivo, false, `${tipo} parado bate`);
    if (tipo !== 'galho') assert.equal(passar(tipo, 'esquerda', { opcoes }).vivo, true, `${tipo} desviando passa`);
  }
  // ônibus, bicicleta e bola de neve: o pulo comum não basta; o super pulo passa por cima
  for (const tipo of ['onibus', 'bicicleta', 'boladeneve']) {
    assert.equal(passar(tipo, 'pular').vivo, false, `${tipo} com pulo comum`);
    assert.equal(passar(tipo, 'superpulo').vivo, true, `${tipo} com super pulo`);
  }
  for (const tipo of ['cachorro', 'caranguejo', 'tronco', 'pinguim']) {
    assert.equal(passar(tipo, 'pular').vivo, true, `${tipo} pulando`);
    assert.equal(passar(tipo, 'deslizar').vivo, false, `${tipo} deslizando`);
  }
  // bola de praia: lá no alto passa deslizando por baixo; quicando baixinho, pulando
  assert.equal(passar('bola', 'deslizar', { opcoes: { modo: 'alto' } }).vivo, true);
  assert.equal(passar('bola', 'pular', { opcoes: { modo: 'alto' } }).vivo, false);
  assert.equal(passar('bola', null, { opcoes: { modo: 'alto' } }).vivo, false);
  assert.equal(passar('bola', 'pular', { opcoes: { modo: 'baixo' } }).vivo, true);
  assert.equal(passar('bola', 'deslizar', { opcoes: { modo: 'baixo' } }).vivo, false);
  // galho: deslizar sempre passa, em qualquer ponto do balanço
  for (let k = 0; k < 16; k++) {
    assert.equal(passar('galho', 'deslizar', { opcoes: { fase: (k * Math.PI) / 8 } }).vivo, true, `galho na fase ${k}`);
  }
  // quem troca de faixa: bate na faixa nova, não na antiga
  for (const tipo of ['bicicleta', 'pinguim']) {
    assert.equal(passar(tipo, null, { destino: 1, faixa: 0, opcoes: { origem: 0 } }).vivo, true, `${tipo} saiu da faixa 0`);
    assert.equal(passar(tipo, null, { destino: 1, faixa: 1, opcoes: { origem: 0 } }).vivo, false, `${tipo} entrou na faixa 1`);
  }
  // o cachorro atravessa: na faixa de onde ele veio, já passou
  assert.equal(passar('cachorro', null, { destino: 1, faixa: 0, opcoes: { dir: 1 } }).vivo, true);
});

test('móveis: poderes continuam valendo (escudo, skate, supercarga, mochila a jato e invencível)', () => {
  const escudo = passar('onibus', null, { antes: (s) => { s.escudo = true; } });
  assert.equal(escudo.vivo, true); assert.equal(escudo.escudo, false);
  const skate = passar('boladeneve', null, { antes: (s) => { s.skate = 10; } });
  assert.equal(skate.vivo, true); assert.equal(skate.skate, 0);
  const forte = passar('bicicleta', null, { antes: (s) => { s.supercarga = 5; } });
  assert.equal(forte.vivo, true); assert.ok(forte.eventos.includes('quebra'));
  // voando de mochila: nada em movimento alcança lá em cima
  const voa = passar('onibus', null, { antes: (s) => { s.voo = 8; s.y = 3.6; } });
  assert.equal(voa.vivo, true);
  // a decolagem tira da frente quem estava chegando e cancela o da contramão que ia entrar
  const s = pista();
  s.objetos = [criarMovel('galho', 20, semente(1), s.vel), { tipo: 'maleta', faixa: 1, z: 0.3, h: 0.7 }];
  s.reserva = { tipo: 'onibus', faixa: 2, desde: 0 };
  corrida.avancar(s, 1 / 60);
  assert.equal(s.voo > 0, true);
  assert.equal(s.objetos.some((o) => o.movel), false);
  assert.equal(s.reserva, null);
});

test('móveis: só depois do trecho inicial e cada vez mais frequentes', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) {
    assert.equal(corrida.chanceMovel(nivel, 0), 0);
    assert.equal(corrida.chanceMovel(nivel, corrida.INICIO_MOVEIS - 1), 0);
    const c = [corrida.INICIO_MOVEIS, 1000, 3000, 10000].map((d) => corrida.chanceMovel(nivel, d));
    assert.ok(c[0] > 0);
    for (let k = 1; k < c.length; k++) assert.ok(c[k] >= c[k - 1]);
    assert.ok(c[3] > c[0] * 1.5);
  }
  // na corrida de verdade: nenhum antes do trecho inicial; mais por quilômetro lá na frente
  const contar = (de, ate) => {
    let total = 0;
    for (const n of [1, 2, 3]) {
      const s = corrida.nova('medio', { cenario: 'cidade' });
      s.dist = de; s.invencivel = 1e9;
      const r = semente(n); const vistos = new Set();
      while (s.dist < ate) {
        corrida.avancar(s, 1 / 30, r);
        for (const o of s.objetos) if (o.movel && !vistos.has(o)) { vistos.add(o); assert.ok(s.dist >= corrida.INICIO_MOVEIS); }
      }
      total += vistos.size;
    }
    return total;
  };
  assert.equal(contar(0, corrida.INICIO_MOVEIS - 80), 0);
  assert.ok(contar(6000, 8000) > contar(400, 2400));
});

test('móveis: cada cenário tem os seus, e o Passeio troca junto com o cenário', () => {
  const vistos = {};
  for (const escolha of ['cidade', 'praia', 'floresta', 'neve', 'passeio']) {
    const s = corrida.nova('medio', { cenario: escolha });
    s.invencivel = 1e9; s.dist = 400;
    const r = semente(11);
    while (s.dist < 4200) {
      corrida.avancar(s, 1 / 30, r);
      for (const o of s.objetos) {
        if (!o.movel || o.visto) continue;
        o.visto = true;
        const tema = corrida.cenarioDaCorrida(escolha, s.dist);
        assert.equal(MOVEIS[o.tipo].cenario, tema, `${o.tipo} apareceu em ${tema}`);
        (vistos[escolha] ??= new Set()).add(o.tipo);
      }
    }
  }
  for (const c of ['cidade', 'praia', 'floresta', 'neve']) {
    assert.deepEqual([...vistos[c]].sort(), TIPOS.filter((t) => MOVEIS[t].cenario === c).sort(), c);
  }
  assert.ok(vistos.passeio.size >= 6);
  // sem cenário (testes antigos), nada se move
  const s = corrida.nova('medio'); s.dist = 2000; s.invencivel = 1e9;
  const r = semente(2);
  for (let k = 0; k < 30 * 120; k++) corrida.avancar(s, 1 / 30, r);
  assert.equal(s.objetos.some((o) => o.movel), false);
});

// Robô de teste: olha o que vem pela frente (com a faixa avisada de quem se move) e escolhe a ação.
const JEITO = { cerca: 'pular', faixa: 'deslizar', carrinho: 'desviar' };
function robo(s) {
  const obst = s.objetos.filter(ehObstaculo);
  const chega = (o) => o.z / (s.vel + (o.vz ?? 0)); // segundos até a frente chegar
  const sai = (o) => (o.z + (o.comp ?? 0.4)) / (s.vel + (o.vz ?? 0));
  const faixas = (o) => (!o.movel ? [Math.round(o.faixa)] : o.tipo === 'galho' ? [o.destino - 1, o.destino, o.destino + 1] : [o.destino]);
  const jeito = (o) => (o.movel ? comoPassar(o) : JEITO[o.tipo]);
  const perigo = (f, de, ate) => obst.filter((o) => faixas(o).includes(f) && sai(o) > de && chega(o) < ate);
  // descendo de um pulo em cima de algo: troca de faixa no ar
  if (s.y > 0 && s.vy < 0 && perigo(s.faixa, 0, 0.35).length) {
    const livre = [s.faixa - 1, s.faixa + 1].find((f) => f >= 0 && f <= 2 && !perigo(f, -0.1, 0.45).length);
    if (livre !== undefined) { corrida.comando(s, livre < s.faixa ? 'esquerda' : 'direita'); return; }
  }
  // o que só passa desviando: procura uma faixa sem nada disso chegando
  const fechada = (f, ate) => perigo(f, -0.08, ate).some((o) => jeito(o) === 'desviar');
  if (fechada(s.faixa, 0.75)) {
    const opcoes = [s.faixa - 1, s.faixa + 1, s.faixa - 2, s.faixa + 2].filter((f) => f >= 0 && f <= 2 && !fechada(f, 0.9));
    const passo = opcoes.find((f) => Math.abs(f - s.faixa) === 1 || !fechada(1, 0.5));
    if (passo !== undefined) { corrida.comando(s, passo < s.faixa ? 'esquerda' : 'direita'); return; }
  }
  const prox = perigo(s.faixa, 0, 0.18).sort((a, b) => chega(a) - chega(b))[0];
  if (!prox) return;
  if (jeito(prox) === 'pular' && s.y === 0 && chega(prox) < 0.16) corrida.comando(s, 'pular');
  if (jeito(prox) === 'deslizar' && s.deslizando < 0.15) corrida.comando(s, 'deslizar');
}

test('móveis: o robô de teste corre 3 km em todos os cenários, níveis e várias sementes', () => {
  const paradas = [];
  let moveis = 0;
  for (const escolha of ['cidade', 'praia', 'floresta', 'neve', 'passeio']) {
    for (const nivel of ['facil', 'medio', 'dificil']) {
      for (const n of [1, 2, 3, 4]) {
        const r = semente(n * 31 + escolha.length);
        const s = corrida.nova(nivel, { cenario: escolha });
        const vistos = new Set();
        while (s.vivo && s.dist < 3000) {
          robo(s);
          corrida.avancar(s, 1 / 60, r);
          for (const o of s.objetos) if (o.movel) vistos.add(o);
        }
        moveis += vistos.size;
        if (!s.vivo) {
          const perto = s.objetos.filter((o) => ehObstaculo(o) && o.z < 3 && o.z + (o.comp ?? 0) > -2).map((o) => `${o.tipo}@${o.faixa.toFixed(2)}`);
          paradas.push(`${escolha}/${nivel}/${n}: ${Math.round(s.dist)} m, faixa ${s.faixa} [${perto.join(', ')}]`);
        }
      }
    }
  }
  assert.deepEqual(paradas, []);
  assert.ok(moveis > 300, `só ${moveis} obstáculos em movimento`);
});
