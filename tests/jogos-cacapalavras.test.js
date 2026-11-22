import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as cp from '../jogos/src/cacapalavras.js';
import { TEMAS, semAcento } from '../jogos/src/palavras.js';
import { semente } from '../jogos/src/pintar-formas.js';

test('há pelo menos 10 temas com 15 palavras cada, todas de uma palavra só e com figurinha', () => {
  assert.ok(TEMAS.length >= 10);
  for (const t of TEMAS) {
    assert.ok(t.palavras.length >= 15, t.id);
    assert.ok(t.emoji && t.nome);
    const vistas = new Set();
    for (const w of t.palavras) {
      assert.match(semAcento(w.palavra), /^[A-Z]+$/, w.palavra);
      assert.ok(w.emoji && !/^[a-z]/i.test(w.emoji), w.palavra);
      assert.ok(!vistas.has(w.palavra), `${w.palavra} repetida em ${t.id}`);
      vistas.add(w.palavra);
    }
  }
});

test('semAcento tira acentos e cedilha', () => {
  assert.equal(semAcento('Maçã'), 'MACA');
  assert.equal(semAcento('helicóptero'), 'HELICOPTERO');
  assert.equal(semAcento('pão'), 'PAO');
});

test('cada nível gera a grade certa e todas as palavras estão nela uma vez só', () => {
  for (const [nivel, n, qtd] of [['facil', 8, 6], ['medio', 10, 8], ['dificil', 12, 10]]) {
    for (let s = 1; s <= 25; s++) {
      const j = cp.novoJogo(nivel, semente(s * 97 + n));
      assert.equal(j.n, n); assert.equal(j.grade.length, n);
      for (const linha of j.grade) assert.match(linha, new RegExp(`^[A-Z]{${n}}$`));
      assert.equal(j.palavras.length, qtd);
      for (const w of j.palavras) {
        const [rf, cf] = cp.fimDaPalavra(w);
        assert.equal(cp.lerReta(j.grade, w.r, w.c, rf, cf), w.letras);
        assert.equal(cp.ocorrencias(j.grade, w.letras), 1, w.letras);
        const dirOk = cp.NIVEIS[nivel].direcoes.some(([dr, dc]) => dr === w.dr && dc === w.dc);
        assert.ok(dirOk, `${nivel}: direção ${w.dr},${w.dc}`);
      }
    }
  }
});

test('o fácil não tem diagonais nem palavras de trás para frente', () => {
  for (let s = 1; s <= 30; s++) for (const w of cp.novoJogo('facil', semente(s)).palavras) assert.ok(w.dr >= 0 && w.dc >= 0 && w.dr + w.dc === 1);
});

test('o difícil às vezes esconde palavras de trás para frente', () => {
  let tras = 0;
  for (let s = 1; s <= 10; s++) for (const w of cp.novoJogo('dificil', semente(s)).palavras) if (w.dr < 0 || w.dc < 0) tras++;
  assert.ok(tras > 0);
});

test('selecionar do começo ao fim (ou do fim ao começo) acha a palavra até terminar', () => {
  const j = cp.novoJogo('dificil', semente(5));
  assert.equal(cp.conferir(j, 0, 0, 0, 0), null);
  j.palavras.forEach((w, i) => {
    const [rf, cf] = cp.fimDaPalavra(w);
    const achou = i % 2 ? cp.conferir(j, w.r, w.c, rf, cf) : cp.conferir(j, rf, cf, w.r, w.c);
    assert.equal(achou, w);
    assert.equal(cp.conferir(j, w.r, w.c, rf, cf), null, 'não acha a mesma duas vezes');
    assert.equal(cp.terminou(j), i === j.palavras.length - 1);
  });
  assert.equal(cp.dica(j), null);
});

test('alinhar leva o arraste para a reta mais próxima, dentro da grade', () => {
  assert.deepEqual(cp.alinhar(0, 0, 1, 5, 8), [0, 5]);
  assert.deepEqual(cp.alinhar(0, 0, 4, 5, 8), [5, 5]);
  assert.deepEqual(cp.alinhar(2, 2, 9, 2.4, 8), [7, 2]);
  assert.deepEqual(cp.alinhar(3, 3, 3, 3, 8), [3, 3]);
  assert.deepEqual(cp.alinhar(5, 1, 0, 6, 8), [0, 6]);
});

test('um tema escolhido é respeitado', () => {
  const j = cp.novoJogo('medio', semente(2), 'frutas');
  assert.equal(j.tema, 'frutas');
  const frutas = TEMAS.find((t) => t.id === 'frutas').palavras.map((w) => w.palavra);
  for (const w of j.palavras) assert.ok(frutas.includes(w.palavra));
});
