// Corrida dos Cachinhos: os quatro cenários novos (Terra dos Doces, Parque de Diversões, Deserto do Oásis
// e Passeio na Lua). Cada um com os seus obstáculos em movimento, sempre com passagem, o robô de teste
// correndo 3 km em cada um e o Passeio percorrendo os oito cenários.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as corrida from '../jogos/src/corrida.js';
import { quemPersegue, NOMES, EMOJI, SOM } from '../jogos/src/perseguidores.js';

const { MOVEIS, ehObstaculo, comoPassar, cenarioDaCorrida, CENARIOS_IDS } = corrida;
const NOVOS = ['doces', 'parque', 'deserto', 'lua'];
const ANTIGOS = ['cidade', 'praia', 'floresta', 'neve'];
const PROPRIOS = { doces: ['jujuba', 'minhoca'], parque: ['batebate', 'algodao'], deserto: ['feno', 'camelo'], lua: ['robo', 'meteorito'] };

function semente(n) {
  let s = n;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

test('cenários: os oito existem, os antigos continuam valendo e o Passeio passa por todos', () => {
  assert.deepEqual(CENARIOS_IDS, [...ANTIGOS, ...NOVOS]);
  // quem já tinha escolhido um cenário antigo (prefs.cenario) continua nele
  for (const id of [...ANTIGOS, ...NOVOS]) for (const d of [0, 777, 5000]) assert.equal(cenarioDaCorrida(id, d), id);
  assert.equal(cenarioDaCorrida(undefined, 100), 'cidade');
  const vistos = [];
  for (let d = 0; d < 8 * corrida.TRECHO_PASSEIO; d += 50) {
    const c = cenarioDaCorrida('passeio', d);
    if (vistos.at(-1) !== c) vistos.push(c);
  }
  assert.deepEqual(vistos, CENARIOS_IDS);
  assert.equal(cenarioDaCorrida('passeio', 8 * corrida.TRECHO_PASSEIO), 'cidade'); // depois da Lua, volta ao começo
});

test('cenários: cada cenário novo tem dois obstáculos em movimento próprios, cada um com o seu jeito de passar', () => {
  for (const c of NOVOS) {
    const lista = Object.keys(MOVEIS).filter((t) => MOVEIS[t].cenario === c).sort();
    assert.deepEqual(lista, [...PROPRIOS[c]].sort(), c);
    for (const t of lista) {
      const o = corrida.criarMovel(t, corrida.LONGE, semente(3), 20);
      assert.ok(['pular', 'deslizar', 'desviar'].includes(comoPassar(o)), t);
    }
  }
});

test('cenários: quem persegue em cada cenário novo tem nome, figurinha e som', () => {
  const ids = NOVOS.map((c) => quemPersegue(c));
  assert.equal(new Set(ids).size, 4);
  for (const id of ids) {
    assert.ok(!['policial', 'caranguejo', 'leao', 'panda', 'urso'].includes(id), id);
    assert.ok(NOMES[id] && EMOJI[id] && SOM[id], id);
  }
  // os antigos não mudaram
  assert.deepEqual(ANTIGOS.map((c) => quemPersegue(c, 'panda')), ['policial', 'caranguejo', 'panda', 'urso']);
});

// Confere uma linha de obstáculos parados: no máximo um carrinho e nunca três faixas fechadas para quem desvia.
function linhaValida(objs) {
  const parados = objs.filter((o) => ehObstaculo(o) && !o.movel);
  const carrinhos = parados.filter((o) => o.tipo === 'carrinho').length;
  if (carrinhos > 1) return false;
  if (parados.length === 3 && carrinhos > 0) return false;
  return new Set(parados.map((o) => o.faixa)).size === parados.length;
}

test('cenários: em cada cenário novo as linhas paradas e os móveis são válidos e sempre têm passagem', () => {
  for (const c of NOVOS) {
    const vistos = new Set();
    for (const n of [1, 2, 3]) {
      const s = corrida.nova('medio', { cenario: c });
      s.invencivel = 1e9;
      const r = semente(n * 7 + c.length);
      const linhas = new Map();
      while (s.dist < 3000) {
        corrida.avancar(s, 1 / 30, r);
        for (const o of s.objetos) {
          if (o.movel && !o.visto) {
            o.visto = true;
            assert.equal(MOVEIS[o.tipo].cenario, c, `${o.tipo} em ${c}`);
            assert.ok(s.dist >= corrida.INICIO_MOVEIS, `${o.tipo} antes dos 300 m`);
            assert.ok(o.z > corrida.LONGE - 1, `${o.tipo} surgiu perto demais`);
            vistos.add(o.tipo);
          }
          if (!o.movel && ehObstaculo(o) && !o.contado) { o.contado = true; const k = `${Math.round((o.z + s.dist) * 10)}`; (linhas.get(k) ?? linhas.set(k, []).get(k)).push(o); }
        }
      }
      for (const objs of linhas.values()) assert.ok(linhaValida(objs), `${c}: linha sem passagem ${objs.map((o) => `${o.tipo}@${o.faixa}`).join(' ')}`);
      assert.ok(linhas.size > 60, `${c}: só ${linhas.size} linhas`);
    }
    assert.deepEqual([...vistos].sort(), [...PROPRIOS[c]].sort(), c);
  }
});

// Robô de teste (o mesmo da corrida com móveis): olha o que vem pela frente e escolhe a ação.
const JEITO = { cerca: 'pular', faixa: 'deslizar', carrinho: 'desviar' };
function robo(s) {
  const obst = s.objetos.filter(ehObstaculo);
  const chega = (o) => o.z / (s.vel + (o.vz ?? 0));
  const sai = (o) => (o.z + (o.comp ?? 0.4)) / (s.vel + (o.vz ?? 0));
  const faixas = (o) => (!o.movel ? [Math.round(o.faixa)] : o.tipo === 'galho' ? [o.destino - 1, o.destino, o.destino + 1] : [o.destino]);
  const jeito = (o) => (o.movel ? comoPassar(o) : JEITO[o.tipo]);
  const perigo = (f, de, ate) => obst.filter((o) => faixas(o).includes(f) && sai(o) > de && chega(o) < ate);
  if (s.y > 0 && s.vy < 0 && perigo(s.faixa, 0, 0.35).length) {
    const livre = [s.faixa - 1, s.faixa + 1].find((f) => f >= 0 && f <= 2 && !perigo(f, -0.1, 0.45).length);
    if (livre !== undefined) { corrida.comando(s, livre < s.faixa ? 'esquerda' : 'direita'); return; }
  }
  const fechada = (f, ate) => perigo(f, -0.08, ate).some((o) => jeito(o) === 'desviar');
  if (fechada(s.faixa, 0.75)) {
    // como uma criança atenta: se ainda dá tempo, espera passar o que está chegando na faixa vizinha
    const urgente = fechada(s.faixa, 0.45);
    const opcoes = [s.faixa - 1, s.faixa + 1, s.faixa - 2, s.faixa + 2].filter((f) => f >= 0 && f <= 2 && !fechada(f, 0.9) && (urgente || !perigo(f, -0.05, 0.3).length));
    const passo = opcoes.find((f) => Math.abs(f - s.faixa) === 1 || !fechada(1, 0.5));
    if (passo !== undefined) { corrida.comando(s, passo < s.faixa ? 'esquerda' : 'direita'); return; }
  }
  const prox = perigo(s.faixa, 0, 0.18).sort((a, b) => chega(a) - chega(b))[0];
  if (!prox) return;
  if (jeito(prox) === 'pular' && s.y === 0 && chega(prox) < 0.16) corrida.comando(s, 'pular');
  if (jeito(prox) === 'deslizar' && s.deslizando < 0.15) corrida.comando(s, 'deslizar');
}

function correr(escolha, nivel, n, ate) {
  const r = semente(n * 31 + escolha.length * 5);
  const s = corrida.nova(nivel, { cenario: escolha });
  const vistos = new Set();
  while (s.vivo && s.dist < ate) {
    robo(s);
    corrida.avancar(s, 1 / 60, r);
    for (const o of s.objetos) if (o.movel) vistos.add(o);
  }
  const perto = s.objetos.filter((o) => ehObstaculo(o) && o.z < 3 && o.z + (o.comp ?? 0) > -2).map((o) => `${o.tipo}@${o.faixa.toFixed(2)}`);
  return { s, vistos, parada: s.vivo ? null : `${escolha}/${nivel}/${n}: ${Math.round(s.dist)} m, faixa ${s.faixa} [${perto.join(', ')}]` };
}

test('cenários: o robô de teste corre 3 km em cada cenário novo, em todos os níveis, sem situação impossível', () => {
  const paradas = [];
  for (const c of NOVOS) {
    let moveis = 0;
    for (const nivel of ['facil', 'medio', 'dificil']) {
      for (const n of [1, 2, 3, 4]) {
        const { vistos, parada } = correr(c, nivel, n, 3000);
        moveis += vistos.size;
        if (parada) paradas.push(parada);
      }
    }
    assert.ok(moveis > 60, `${c}: só ${moveis} obstáculos em movimento`);
  }
  assert.deepEqual(paradas, []);
});

test('cenários: no Passeio o robô percorre os oito cenários, com os móveis de cada um', () => {
  const paradas = [];
  const temas = new Set();
  const tipos = new Set();
  for (const nivel of ['facil', 'medio', 'dificil']) {
    for (const n of [1, 2]) {
      const { s, vistos, parada } = correr('passeio', nivel, n, 8 * corrida.TRECHO_PASSEIO + 100);
      if (parada) paradas.push(parada);
      for (const o of vistos) tipos.add(o.tipo);
      for (let d = 0; d <= s.dist; d += 100) temas.add(cenarioDaCorrida('passeio', d));
    }
  }
  assert.deepEqual(paradas, []);
  assert.deepEqual([...temas].sort(), [...CENARIOS_IDS].sort());
  const cenariosComMoveis = new Set([...tipos].map((t) => MOVEIS[t].cenario));
  assert.ok(cenariosComMoveis.size >= 7, `móveis de só ${[...cenariosComMoveis].join(', ')}`);
});
