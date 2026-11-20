import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as loja from '../jogos/src/loja.js';
import { PERSONAGENS, personagemDe, miniatura } from '../jogos/src/personagens.js';

test('a turma tem personagens únicos e a primeira é de graça', () => {
  assert.ok(PERSONAGENS.length >= 6);
  assert.equal(new Set(PERSONAGENS.map((p) => p.id)).size, PERSONAGENS.length);
  assert.equal(PERSONAGENS[0].preco, 0);
  for (const p of PERSONAGENS) assert.match(miniatura(p), /^<svg[\s\S]*<\/svg>$/);
  assert.equal(personagemDe('nao-existe').id, 'cachinhos');
});

test('carteira nova e carteira antiga começam com a Cachinhos', () => {
  assert.deepEqual(loja.carteiraNova().personagens, ['cachinhos']);
  const antiga = loja.normalizar({ moedas: 50, estilos: ['moletom'] });
  assert.equal(antiga.personagem, 'cachinhos');
  assert.deepEqual(antiga.personagens, ['cachinhos']);
  assert.equal(loja.normalizar({ personagens: ['leo', 'fantasma'], personagem: 'fantasma' }).personagem, 'cachinhos');
});

test('comprar personagem gasta moedas, guarda e já seleciona', () => {
  const c = { ...loja.carteiraNova(), moedas: 500 };
  assert.match(loja.comprarPersonagem(c, 'bia').erro, /Faltam 200/);
  const r = loja.comprarPersonagem(c, 'leo');
  assert.equal(r.carteira.moedas, 100);
  assert.equal(r.carteira.personagem, 'leo');
  assert.deepEqual(r.carteira.personagens, ['cachinhos', 'leo']);
  assert.ok(loja.comprarPersonagem(r.carteira, 'leo').erro);
  assert.equal(c.personagens.length, 1, 'não mexe na carteira original');
});

test('só dá para escolher personagem que já é seu', () => {
  const c = loja.comprarPersonagem({ ...loja.carteiraNova(), moedas: 400 }, 'leo').carteira;
  assert.equal(loja.escolherPersonagem(c, 'cachinhos').carteira.personagem, 'cachinhos');
  assert.ok(loja.escolherPersonagem(c, 'nina').erro);
});

test('juntar carteiras soma os personagens dos dois lados', () => {
  const a = { ...loja.carteiraNova(), personagens: ['cachinhos', 'leo'], personagem: 'leo' };
  const b = { ...loja.carteiraNova(), personagens: ['cachinhos', 'duda'] };
  assert.deepEqual(loja.mesclarCarteiras(a, b).personagens.sort(), ['cachinhos', 'duda', 'leo']);
});
