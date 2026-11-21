import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as doce from '../jogos/src/docinhos.js';

let semente = 7;
const sorteio = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };

test('bônus: a lista tem os seis com nome, ícone e explicação', () => {
  assert.equal(doce.BONUS.length, 6);
  for (const b of doce.BONUS) assert.ok(b.id && b.icone && b.nome && b.texto);
});

test('martelo quebra o doce tocado e a mesa continua cheia', () => {
  const g = doce.novaGrade(6, sorteio);
  const r = doce.martelo(g, 27, 6, sorteio);
  assert.ok(r.etapas[0].removidos.includes(g[27].id));
  assert.ok(r.pontos >= doce.PONTOS_POR_DOCE);
  assert.equal(r.grade.filter(Boolean).length, 64);
  assert.ok(doce.encontrarJogada(r.grade), 'sempre sobra jogada');
});

test('vassoura limpa a linha inteira do doce tocado', () => {
  const g = doce.novaGrade(6, sorteio);
  const r = doce.vassoura(g, 3 * 8 + 5, 6, sorteio);
  for (let k = 0; k < 8; k++) assert.ok(r.etapas[0].removidos.includes(g[3 * 8 + k].id));
});

test('troca livre troca vizinhos mesmo sem formar trinca; não troca quem não é vizinho', () => {
  for (let t = 0; t < 30; t++) {
    const g = doce.novaGrade(6, sorteio);
    // procura um par vizinho que não forma nada numa troca normal
    for (let i = 0; i < 63; i++) {
      const j = i % 8 < 7 ? i + 1 : -1;
      if (j < 0 || doce.trocar(g, i, j, 6, sorteio)) continue;
      const r = doce.trocaLivre(g, i, j, 6, sorteio);
      assert.ok(r, 'a troca livre sempre acontece');
      const final = r.etapas[0].grade;
      assert.equal(final[i].id, g[j].id); assert.equal(final[j].id, g[i].id);
      assert.equal(doce.trocaLivre(g, 0, 9, 6, sorteio), null);
      return;
    }
  }
  assert.fail('não achei um par sem combinação');
});

test('arco-íris transforma o doce tocado num arco-íris que pode ser trocado', () => {
  const g = doce.novaGrade(6, sorteio);
  const n = doce.virarArcoiris(g, 10);
  assert.equal(n[10].especial, 'arcoiris');
  assert.equal(g[10].especial, null, 'não mexe na grade original');
  const r = doce.trocar(n, 10, 11, 6, sorteio);
  assert.ok(r && r.pontos > 0, 'arco-íris trocado com um vizinho estoura a cor dele');
});
