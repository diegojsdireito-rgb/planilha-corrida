import test from 'node:test';
import assert from 'node:assert/strict';
import { ehAniversario, erroDoNascimento, idadeEm } from '../src/aniversario.js';
import { gradeDoMes } from '../src/calendario.js';

test('a idade só muda no dia do aniversário', () => {
  assert.equal(idadeEm('1990-11-07', '2026-11-06'), 35);
  assert.equal(idadeEm('1990-11-07', '2026-11-07'), 36);
  assert.equal(idadeEm('1990-11-07', '2026-12-31'), 36);
});

test('aniversário é reconhecido, mas não o próprio dia do nascimento', () => {
  assert.equal(ehAniversario('1990-11-07', '2026-11-07'), true);
  assert.equal(ehAniversario('1990-11-07', '2026-11-08'), false);
  assert.equal(ehAniversario('1990-11-07', '1990-11-07'), false);
});

test('quem nasceu em 29/02 comemora em 28/02 fora dos anos bissextos', () => {
  assert.equal(ehAniversario('1992-02-29', '2027-02-28'), true);
  assert.equal(idadeEm('1992-02-29', '2027-02-27'), 34);
  assert.equal(idadeEm('1992-02-29', '2027-02-28'), 35);
  assert.equal(ehAniversario('1992-02-29', '2028-02-28'), false);
  assert.equal(ehAniversario('1992-02-29', '2028-02-29'), true);
});

test('a data precisa existir, não ser futura e dar uma idade plausível', () => {
  const hoje = '2026-11-07';
  assert.equal(erroDoNascimento('1990-11-07', hoje), null);
  assert.match(erroDoNascimento('', hoje), /Informe/);
  assert.match(erroDoNascimento(null, hoje), /Informe/);
  assert.match(erroDoNascimento('2027-01-01', hoje), /futura/);
  assert.match(erroDoNascimento('2020-01-01', hoje), /Confira/);
  assert.match(erroDoNascimento('1900-01-01', hoje), /Confira/);
});

test('o calendário marca o aniversário com a idade, inclusive em dia de outro mês na grade', () => {
  const grade = gradeDoMes({ mes: '2026-11', nascimento: '1990-11-07', hoje: '2026-11-01' });
  assert.equal(grade.find((d) => d.data === '2026-11-07').aniversario, 36);
  assert.equal(grade.find((d) => d.data === '2026-11-08').aniversario, null);
  assert.equal(gradeDoMes({ mes: '2026-11', hoje: '2026-11-01' }).find((d) => d.data === '2026-11-07').aniversario, null);
  const outroMes = gradeDoMes({ mes: '2026-11', nascimento: '1990-12-01', hoje: '2026-11-01' });
  assert.equal(outroMes.find((d) => d.data === '2026-12-01').aniversario, 36);
});
