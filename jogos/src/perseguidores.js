// Quem corre atrás da menina em cada cenário (só os dados, sem 3D: pode ser usado em qualquer tela).
export const OPCOES_FLORESTA = [
  { id: 'leao', nome: 'Leão', icone: '🦁' },
  { id: 'panda', nome: 'Panda', icone: '🐼' },
];
export const POR_CENARIO = { cidade: 'policial', praia: 'caranguejo', neve: 'urso' };
export const NOMES = { policial: 'o policial', caranguejo: 'o caranguejo', leao: 'o leão', panda: 'o panda', urso: 'o urso-polar' };
export const EMOJI = { policial: '👮', caranguejo: '🦀', leao: '🦁', panda: '🐼', urso: '🐻‍❄️' };
export const SOM = { policial: 'apito', caranguejo: 'caranguejo', leao: 'rugido', panda: 'panda', urso: 'urso' };

export function quemPersegue(cenario, escolhaFloresta = 'leao') {
  if (cenario === 'floresta') return OPCOES_FLORESTA.some((o) => o.id === escolhaFloresta) ? escolhaFloresta : 'leao';
  return POR_CENARIO[cenario] ?? 'policial';
}
