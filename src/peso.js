// Histórico de peso e IMC. Funções puras. O peso mostra evolução e só entra na planilha quando ela é refeita.

const PESO_MINIMO = 20;
const PESO_MAXIMO = 300;

export const imcDe = (kg, alturaCm) => (kg && alturaCm ? Math.round((kg / (alturaCm / 100) ** 2) * 10) / 10 : null);

// Faixas da Organização Mundial da Saúde para adultos.
export function classeDoImc(imc) {
  if (imc === null) return null;
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidade';
}

// Um registro por dia: pesar de novo na mesma data substitui o anterior.
export const registrarPeso = (lista, { data, kg }) => [...(lista ?? []).filter((p) => p.data !== data), { data, kg }]
  .sort((a, b) => a.data.localeCompare(b.data));

export function erroDoPeso({ kg, data }, hoje) {
  if (!data) return 'Informe a data.';
  if (data > hoje) return 'A data não pode ser futura.';
  if (!(kg >= PESO_MINIMO && kg <= PESO_MAXIMO)) return 'Confira o peso, em quilos.';
  return null;
}

export function resumoDoPeso(lista, alturaCm) {
  if (!lista?.length) return null;
  const primeiro = lista[0];
  const atual = lista.at(-1);
  const imc = imcDe(atual.kg, alturaCm);
  return {
    atual,
    imc,
    classe: classeDoImc(imc),
    primeiro,
    variacaoKg: lista.length > 1 ? Math.round((atual.kg - primeiro.kg) * 10) / 10 : null,
    variacaoImc: lista.length > 1 ? Math.round((imc - imcDe(primeiro.kg, alturaCm)) * 10) / 10 : null,
  };
}
