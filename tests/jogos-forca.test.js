import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fc from '../jogos/src/forca.js';
import { semAcento } from '../jogos/src/palavras.js';
import { semente } from '../jogos/src/pintar-formas.js';

test('cada nível tem palavras suficientes do tamanho certo', () => {
  for (const nivel of ['facil', 'medio', 'dificil']) {
    const lista = fc.candidatas(nivel);
    assert.ok(lista.length >= 30, `${nivel}: ${lista.length}`);
    const { min, max } = fc.NIVEIS[nivel];
    for (const w of lista) { const n = semAcento(w.palavra).length; assert.ok(n >= min && n <= max); }
  }
});

test('mais erros permitidos no fácil do que no difícil', () => {
  assert.ok(fc.NIVEIS.facil.erros > fc.NIVEIS.medio.erros);
  assert.ok(fc.NIVEIS.medio.erros > fc.NIVEIS.dificil.erros);
  assert.equal(fc.NIVEIS.medio.erros, 6);
});

test('acertando todas as letras, ganha', () => {
  const j = fc.novoJogo('medio', semente(4));
  for (const l of new Set(j.alvo)) assert.equal(fc.chutar(j, l), 'acerto');
  assert.ok(fc.venceu(j)); assert.ok(!fc.perdeu(j));
  assert.deepEqual(fc.mascara(j), [...j.palavra.toUpperCase()]);
  assert.equal(fc.chutar(j, 'Z'), 'invalida', 'depois do fim não vale mais');
});

test('errando o limite, perde', () => {
  const j = fc.novoJogo('dificil', semente(9));
  const fora = fc.LETRAS.filter((l) => !j.alvo.includes(l));
  for (let k = 0; k < j.maxErros; k++) { assert.ok(!fc.perdeu(j)); assert.equal(fc.chutar(j, fora[k]), 'erro'); }
  assert.ok(fc.perdeu(j)); assert.equal(fc.erros(j), j.maxErros);
});

test('letra repetida não conta e acentuadas valem pela letra sem acento', () => {
  const j = { palavra: 'maçã', alvo: 'MACA', maxErros: 6, tentadas: [] };
  assert.equal(fc.chutar(j, 'ç'), 'acerto');
  assert.equal(fc.chutar(j, 'C'), 'repetida');
  assert.deepEqual(fc.mascara(j), [null, null, 'Ç', null]);
  assert.equal(fc.chutar(j, 'á'), 'acerto');
  assert.deepEqual(fc.mascara(j), [null, 'A', 'Ç', 'Ã']);
  assert.equal(fc.chutar(j, 'x'), 'erro');
  assert.equal(fc.chutar(j, 'X'), 'repetida');
  assert.equal(fc.erros(j), 1);
  assert.equal(fc.chutar(j, '1'), 'invalida');
});

test('evita repetir palavras recentes', () => {
  const todas = fc.candidatas('facil').map((w) => w.palavra);
  const j = fc.novoJogo('facil', semente(1), todas.slice(1));
  assert.equal(j.palavra, todas[0]);
});
