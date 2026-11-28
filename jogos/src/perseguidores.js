// Quem corre atrás da menina em cada cenário (só os dados, sem 3D: pode ser usado em qualquer tela).
export const OPCOES_FLORESTA = [
  { id: 'leao', nome: 'Leão', icone: '🦁' },
  { id: 'panda', nome: 'Panda', icone: '🐼' },
];
// Nos cenários novos: o ursinho de goma (Doces), o coelho mascote (Parque), a raposa-do-deserto (Deserto)
// e o etezinho (Lua).
export const POR_CENARIO = { cidade: 'policial', praia: 'caranguejo', neve: 'urso', doces: 'ursogoma', parque: 'coelho', deserto: 'raposa', lua: 'alien' };
export const NOMES = { policial: 'o policial', caranguejo: 'o caranguejo', leao: 'o leão', panda: 'o panda', urso: 'o urso-polar', ursogoma: 'o ursinho de goma', coelho: 'o coelho mascote', raposa: 'a raposa-do-deserto', alien: 'o etezinho' };
export const EMOJI = { policial: '👮', caranguejo: '🦀', leao: '🦁', panda: '🐼', urso: '🐻‍❄️', ursogoma: '🧸', coelho: '🐰', raposa: '🦊', alien: '👽' };
export const SOM = { policial: 'apito', caranguejo: 'caranguejo', leao: 'rugido', panda: 'panda', urso: 'urso', ursogoma: 'goma', coelho: 'coelho', raposa: 'raposa', alien: 'alien' };

export function quemPersegue(cenario, escolhaFloresta = 'leao') {
  if (cenario === 'floresta') return OPCOES_FLORESTA.some((o) => o.id === escolhaFloresta) ? escolhaFloresta : 'leao';
  return POR_CENARIO[cenario] ?? 'policial';
}
