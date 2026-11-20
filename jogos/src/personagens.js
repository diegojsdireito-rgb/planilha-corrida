// A turma da Corrida dos Cachinhos: personagens originais que dá para desbloquear com moedas.
// Cada um tem penteado, cor de cabelo, olhos, tom de pele e acessório próprios; as roupas
// (estilos da Loja) servem em todos. Sem DOM nem 3D: a loja e os testes usam só os dados.

export const PERSONAGENS = [
  { id: 'cachinhos', nome: 'Cachinhos', titulo: 'A corredora dos cachos', preco: 0, cabelo: 'cachos', corCabelo: '#3d2414', olhos: '#6a4222', pele: 1, menino: false },
  { id: 'leo', nome: 'Léo', titulo: 'O craque do bairro', preco: 400, cabelo: 'curto', corCabelo: '#1f1611', olhos: '#3f8a3a', pele: 2, menino: true },
  { id: 'bia', nome: 'Bia', titulo: 'A ginasta', preco: 700, cabelo: 'rabo', corCabelo: '#e3b23c', olhos: '#2f7fd0', pele: 0, menino: false },
  { id: 'duda', nome: 'Duda', titulo: 'A rainha da dança', preco: 1000, cabelo: 'afro', corCabelo: '#1a120d', olhos: '#4a2c18', pele: 3, menino: false },
  { id: 'kiko', nome: 'Kiko', titulo: 'O roqueiro', preco: 1300, cabelo: 'moicano', corCabelo: '#e2313b', olhos: '#5a3a22', pele: 1, acessorio: 'fones', menino: true },
  { id: 'nina', nome: 'Nina', titulo: 'A inventora', preco: 1600, cabelo: 'coques', corCabelo: '#7a4fd0', olhos: '#8a4fc0', pele: 0, acessorio: 'oculos', menino: false },
];

export const personagemDe = (id) => PERSONAGENS.find((p) => p.id === id) ?? PERSONAGENS[0];

const PELES = ['#f6d3b3', '#e8b48a', '#c68a5e', '#8d5a3b'];

// Carinha para os cartões da galeria (desenho simples, só para reconhecer cada um).
export function miniatura(p) {
  const pele = PELES[p.pele] ?? PELES[1]; const c = p.corCabelo;
  const atras = {
    cachos: `<path d="M14 30 C6 44 8 64 16 74 C18 60 20 50 24 44 Z M66 30 C74 44 72 64 64 74 C62 60 60 50 56 44 Z" fill="${c}"/>`,
    rabo: `<path d="M52 12 C74 6 80 30 70 52 C68 36 62 24 50 20 Z" fill="${c}"/>`,
    afro: `<circle cx="40" cy="32" r="31" fill="${c}"/>`,
    coques: `<circle cx="18" cy="14" r="11" fill="${c}"/><circle cx="62" cy="14" r="11" fill="${c}"/>`,
  }[p.cabelo] ?? '';
  const topo = {
    cachos: `<path d="M15 36 C12 14 30 8 40 8 C52 8 68 14 65 36 C58 26 50 20 38 22 C28 22 20 28 15 36 Z" fill="${c}"/>`,
    curto: `<path d="M16 34 C14 16 28 9 40 9 C54 9 66 16 64 34 C58 24 52 22 46 24 L42 16 L38 24 L33 17 L30 26 C24 26 20 28 16 34 Z" fill="${c}"/>`,
    rabo: `<path d="M16 34 C14 16 28 9 40 9 C54 9 66 16 64 34 C56 22 44 20 30 24 C24 26 20 30 16 34 Z" fill="${c}"/>`,
    afro: `<path d="M17 34 C18 22 28 16 40 16 C52 16 62 22 63 34 C56 28 48 26 40 26 C32 26 24 28 17 34 Z" fill="${c}"/>`,
    moicano: `<path d="M34 24 L31 4 L37 10 L40 0 L43 10 L49 4 L46 24 Z" fill="${c}"/><path d="M17 32 C18 20 28 14 40 14 C52 14 62 20 63 32 C56 26 48 24 40 24 C32 24 24 26 17 32 Z" fill="${c}" opacity=".35"/>`,
    coques: `<path d="M16 34 C14 16 28 10 40 10 C54 10 66 16 64 34 C58 24 48 20 40 22 C30 20 22 26 16 34 Z" fill="${c}"/>`,
  }[p.cabelo] ?? '';
  const extra = p.acessorio === 'oculos'
    ? '<g fill="none" stroke="#22242c" stroke-width="2.2"><circle cx="30" cy="42" r="8"/><circle cx="50" cy="42" r="8"/><path d="M38 42 H42"/></g>'
    : p.acessorio === 'fones' ? '<path d="M14 44 C12 16 68 16 66 44" fill="none" stroke="#22242c" stroke-width="3.5"/><rect x="9" y="36" width="9" height="16" rx="4" fill="#ff8a1f"/><rect x="62" y="36" width="9" height="16" rx="4" fill="#ff8a1f"/>' : '';
  return `<svg viewBox="0 0 80 80" aria-hidden="true">${atras}<circle cx="40" cy="42" r="25" fill="${pele}"/>${topo}
    <ellipse cx="30" cy="43" rx="5" ry="6" fill="#fff"/><ellipse cx="50" cy="43" rx="5" ry="6" fill="#fff"/>
    <circle cx="30.5" cy="44" r="3.4" fill="${p.olhos}"/><circle cx="50.5" cy="44" r="3.4" fill="${p.olhos}"/><circle cx="30.5" cy="44" r="1.5" fill="#111"/><circle cx="50.5" cy="44" r="1.5" fill="#111"/>
    <path d="M33 56 Q40 62 47 56" fill="none" stroke="#b8475a" stroke-width="2.4" stroke-linecap="round"/>${extra}</svg>`;
}
