import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as loja from '../jogos/src/loja.js';
import { PERSONAGENS, personagemDe, miniatura } from '../jogos/src/personagens.js';

test('a turma tem personagens únicos e a primeira é de graça', () => {
  assert.ok(PERSONAGENS.length >= 6);
  assert.equal(new Set(PERSONAGENS.map((p) => p.id)).size, PERSONAGENS.length);
  assert.equal(PERSONAGENS[0].preco, 0);
  for (const p of PERSONAGENS) assert.match(miniatura(p), /^<(svg|img)/);
  assert.equal(personagemDe('nao-existe').id, 'antonella');
});

test('carteira nova e carteira antiga começam com a Cachinhos', () => {
  assert.deepEqual(loja.carteiraNova().personagens, ['antonella']);
  const antiga = loja.normalizar({ moedas: 50, estilos: ['moletom'] });
  assert.equal(antiga.personagem, 'antonella');
  assert.deepEqual(antiga.personagens, ['antonella']);
  assert.equal(loja.normalizar({ personagens: ['luna', 'fantasma'], personagem: 'fantasma' }).personagem, 'antonella');
});

test('comprar personagem gasta moedas, guarda e já seleciona', () => {
  const c = { ...loja.carteiraNova(), moedas: 500 };
  assert.match(loja.comprarPersonagem(c, 'kai').erro, /Faltam 200/);
  const r = loja.comprarPersonagem(c, 'luna');
  assert.equal(r.carteira.moedas, 0);
  assert.equal(r.carteira.personagem, 'luna');
  assert.deepEqual(r.carteira.personagens, ['antonella', 'luna']);
  assert.ok(loja.comprarPersonagem(r.carteira, 'luna').erro);
  assert.equal(c.personagens.length, 1, 'não mexe na carteira original');
});

test('só dá para escolher personagem que já é seu', () => {
  const c = loja.comprarPersonagem({ ...loja.carteiraNova(), moedas: 500 }, 'luna').carteira;
  assert.equal(loja.escolherPersonagem(c, 'antonella').carteira.personagem, 'antonella');
  assert.ok(loja.escolherPersonagem(c, 'theo').erro);
});

test('juntar carteiras soma os personagens dos dois lados', () => {
  const a = { ...loja.carteiraNova(), personagens: ['antonella', 'luna'], personagem: 'luna' };
  const b = { ...loja.carteiraNova(), personagens: ['antonella', 'bia'] };
  assert.deepEqual(loja.mesclarCarteiras(a, b).personagens.sort(), ['antonella', 'bia', 'luna']);
});

test('dons dos personagens mudam a corrida', async () => {
  const cor = await import('../jogos/src/corrida.js');
  assert.equal(cor.nova('medio', { dom: 'escudo' }).escudo, true);
  assert.equal(cor.nova('medio', { dom: 'ima' }).ima, 10);
  assert.ok(cor.nova('medio', { dom: 'turbo' }).energia > 0.5);
  // superpulo sobe mais que o pulo comum
  const a = cor.nova('medio'); const b = cor.nova('medio', { dom: 'superpulo' });
  cor.comando(a, 'pular'); cor.comando(b, 'pular');
  assert.ok(b.vy > a.vy);
  // salto duplo: um pulo a mais no ar, e só um
  const t = cor.nova('medio', { dom: 'saltoDuplo' });
  cor.comando(t, 'pular'); t.y = 1; t.vy = -2;
  cor.comando(t, 'pular'); assert.ok(t.vy > 0); assert.equal(t.contagem.pulos, 2);
  t.vy = -2; cor.comando(t, 'pular'); assert.equal(t.contagem.pulos, 2);
  const n = cor.nova('medio'); cor.comando(n, 'pular'); n.y = 1; n.vy = -2; cor.comando(n, 'pular'); assert.equal(n.contagem.pulos, 1);
});
