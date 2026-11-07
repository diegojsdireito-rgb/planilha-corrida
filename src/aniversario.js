// Data de nascimento: idade sempre atual e dia do aniversário. Funções puras, com datas AAAA-MM-DD.

const IDADE_MINIMA = 12;
const IDADE_MAXIMA = 100;

const anoBissexto = (ano) => (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;

// Quem nasceu em 29/02 comemora em 28/02 nos anos que não são bissextos.
function diaDoAniversario(nascimento, ano) {
  const mesDia = nascimento.slice(5);
  return mesDia === '02-29' && !anoBissexto(ano) ? `${ano}-02-28` : `${ano}-${mesDia}`;
}

export function idadeEm(nascimento, data) {
  const ano = Number(data.slice(0, 4));
  const completos = ano - Number(nascimento.slice(0, 4));
  return data >= diaDoAniversario(nascimento, ano) ? completos : completos - 1;
}

export const ehAniversario = (nascimento, data) => data > nascimento && data === diaDoAniversario(nascimento, Number(data.slice(0, 4)));

export function erroDoNascimento(nascimento, hoje) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento ?? '')) return 'Informe a data de nascimento.';
  if (nascimento > hoje) return 'A data de nascimento não pode ser futura.';
  const idade = idadeEm(nascimento, hoje);
  if (idade < IDADE_MINIMA || idade > IDADE_MAXIMA) return `Confira a data: o app é para quem tem de ${IDADE_MINIMA} a ${IDADE_MAXIMA} anos.`;
  return null;
}
