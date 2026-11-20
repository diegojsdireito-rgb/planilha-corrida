// A turma da Corrida dos Cachinhos: personagens originais que dá para desbloquear com moedas.
// Cada um tem penteado, cor de cabelo, olhos, tom de pele e acessório próprios; as roupas
// (estilos da Loja) servem em todos. Sem DOM nem 3D: a loja e os testes usam só os dados.

export const PERSONAGENS = [
  { id: 'antonella', nome: 'Antonella', titulo: 'Superpulo', dom: 'superpulo', iconeDom: '⏫', textoDom: 'Pula 15% mais alto.', preco: 0, cabelo: 'cachos', corCabelo: '#2c1a11', olhos: '#5a3a20', pele: 1, menino: false, acessorios: ['mochila'], corMochila: '#c9417c', estilo: 'moletom', arte: 'arte/cachinhos.jpg', arteCorpo: 'arte/cachinhos-corpo.jpg' },
  { id: 'nico', nome: 'Nico', titulo: 'Veloz e ágil', dom: 'agil', iconeDom: '⚡', textoDom: 'Troca de faixa mais rápido e pula um pouco mais alto.', preco: 0, cabelo: 'topete', corCabelo: '#5b3520', olhos: '#6a4222', pele: 1, menino: true, acessorios: ['fones', 'mochila', 'pulseiras'], corMochila: '#26262b', corFone: '#2a3fb0', estilo: 'corredor', arte: 'arte/tito.jpg', arteCorpo: 'arte/tito-corpo.jpg' },
  { id: 'luna', nome: 'Luna', titulo: 'Coleta extra', dom: 'coleta', iconeDom: '⭐', textoDom: 'Ganha uma moeda a mais a cada quatro que pega.', preco: 500, cabelo: 'rabo', corCabelo: '#3a2317', olhos: '#5a3a20', pele: 1, menino: false, acessorios: ['fones', 'mochila', 'pulseiras'], corMochila: '#e8b21f', corFone: '#8a4fd6', estilo: 'street', corRoupa: '#8a4fd6' },
  { id: 'kai', nome: 'Kai', titulo: 'Desvio rápido', dom: 'desvio', iconeDom: '⏩', textoDom: 'Troca de faixa muito mais rápido.', preco: 700, cabelo: 'curto', corCabelo: '#17130f', olhos: '#3a2a1c', pele: 1, menino: true, acessorios: ['mochila', 'pulseiras'], corMochila: '#26262b', estilo: 'skatista', corRoupa: '#2e9e4f' },
  { id: 'maya', nome: 'Maya', titulo: 'Turbo de velocidade', dom: 'turbo', iconeDom: '⚡', textoDom: 'Já larga com a barra da supercarga mais da metade cheia.', preco: 900, cabelo: 'rabo', corCabelo: '#e3b23c', olhos: '#2f7fd0', pele: 0, menino: false, acessorios: ['mochila'], corMochila: '#d6457a', estilo: 'esportiva', corRoupa: '#ef4f8f' },
  { id: 'davi', nome: 'Davi', titulo: 'Ímã de moedas', dom: 'ima', iconeDom: '🧲', textoDom: 'Larga com o ímã ligado por 10 segundos.', preco: 1100, cabelo: 'afro', corCabelo: '#c8651e', escalaCabelo: 0.8, olhos: '#6a4222', pele: 0, menino: true, acessorios: ['oculos', 'mochila'], corMochila: '#27305e', estilo: 'moletom' },
  { id: 'bia', nome: 'Bia', titulo: 'Escudo de proteção', dom: 'escudo', iconeDom: '🛡️', textoDom: 'Larga com um escudo que aguenta uma batida.', preco: 1300, cabelo: 'afro', corCabelo: '#1a120d', olhos: '#4a2c18', pele: 3, menino: false, acessorios: ['laco', 'mochila'], corMochila: '#26262b', estilo: 'street', corRoupa: '#f2c21f' },
  { id: 'enzo', nome: 'Enzo', titulo: 'Explosão de impulso', dom: 'explosao', iconeDom: '🔥', textoDom: 'Raios e moedas enchem a supercarga 40% mais rápido.', preco: 1500, cabelo: 'curto', corCabelo: '#4a2c1a', olhos: '#5a3a20', pele: 1, menino: true, acessorios: ['mochila', 'pulseiras'], corMochila: '#26262b', estilo: 'skatista', corRoupa: '#e23a34' },
  { id: 'sofia', nome: 'Sofia', titulo: 'Tempo extra', dom: 'tempo', iconeDom: '⏱️', textoDom: 'Os poderes da pista duram 25% mais.', preco: 1700, cabelo: 'trancas', corCabelo: '#4a2c1a', olhos: '#5a3a20', pele: 1, menino: false, acessorios: ['oculos', 'mochila'], corOculos: '#18b0b8', corMochila: '#d6457a', estilo: 'street', corRoupa: '#1fa3a8' },
  { id: 'theo', nome: 'Theo', titulo: 'Salto duplo', dom: 'saltoDuplo', iconeDom: '⏫', textoDom: 'Pode pular mais uma vez no ar.', preco: 2000, cabelo: 'curto', corCabelo: '#14100d', olhos: '#3a2415', pele: 3, menino: true, acessorios: ['mochila', 'pulseiras'], corMochila: '#2a3fb0', estilo: 'skatista', corRoupa: '#2748c4' },
];

// Acessórios de um personagem (os antigos têm um só, em "acessorio").
export const usa = (p, item) => p.acessorio === item || Boolean(p.acessorios?.includes(item));

export const personagemDe = (id) => PERSONAGENS.find((p) => p.id === id) ?? PERSONAGENS[0];

const PELES = ['#f6d3b3', '#e8b48a', '#c68a5e', '#8d5a3b'];

// Carinha para os cartões da galeria (desenho simples, só para reconhecer cada um).
export function miniatura(p) {
  if (p.arte) return `<img class="arte" src="${p.arte}" alt="">`;
  const pele = PELES[p.pele] ?? PELES[1]; const c = p.corCabelo;
  const atras = {
    cachos: `<path d="M14 30 C6 44 8 64 16 74 C18 60 20 50 24 44 Z M66 30 C74 44 72 64 64 74 C62 60 60 50 56 44 Z" fill="${c}"/>`,
    rabo: `<path d="M52 12 C74 6 80 30 70 52 C68 36 62 24 50 20 Z" fill="${c}"/>`,
    afro: `<circle cx="40" cy="32" r="31" fill="${c}"/>`,
    coques: `<circle cx="18" cy="14" r="11" fill="${c}"/><circle cx="62" cy="14" r="11" fill="${c}"/>`,
    trancas: `<rect x="8" y="38" width="11" height="38" rx="5" fill="${c}"/><rect x="61" y="38" width="11" height="38" rx="5" fill="${c}"/>`,
  }[p.cabelo] ?? '';
  const topo = {
    cachos: `<path d="M15 36 C12 14 30 8 40 8 C52 8 68 14 65 36 C58 26 50 20 38 22 C28 22 20 28 15 36 Z" fill="${c}"/>`,
    curto: `<path d="M16 34 C14 16 28 9 40 9 C54 9 66 16 64 34 C58 24 52 22 46 24 L42 16 L38 24 L33 17 L30 26 C24 26 20 28 16 34 Z" fill="${c}"/>`,
    rabo: `<path d="M16 34 C14 16 28 9 40 9 C54 9 66 16 64 34 C56 22 44 20 30 24 C24 26 20 30 16 34 Z" fill="${c}"/>`,
    afro: `<path d="M17 34 C18 22 28 16 40 16 C52 16 62 22 63 34 C56 28 48 26 40 26 C32 26 24 28 17 34 Z" fill="${c}"/>`,
    moicano: `<path d="M34 24 L31 4 L37 10 L40 0 L43 10 L49 4 L46 24 Z" fill="${c}"/><path d="M17 32 C18 20 28 14 40 14 C52 14 62 20 63 32 C56 26 48 24 40 24 C32 24 24 26 17 32 Z" fill="${c}" opacity=".35"/>`,
    trancas: `<path d="M15 38 C12 14 28 9 40 9 C52 9 68 14 65 38 C60 26 50 20 40 22 C30 20 20 26 15 38 Z" fill="${c}"/>`,
    topete: `<path d="M14 34 C10 18 22 6 34 10 L38 2 L44 9 L54 4 L54 12 L66 12 L62 22 C66 26 66 30 65 34 C58 24 50 22 40 23 C28 22 20 28 14 34 Z" fill="${c}"/>`,
    coques: `<path d="M16 34 C14 16 28 10 40 10 C54 10 66 16 64 34 C58 24 48 20 40 22 C30 20 22 26 16 34 Z" fill="${c}"/>`,
  }[p.cabelo] ?? '';
  const laco = usa(p, 'laco') ? '<path d="M40 12 L24 2 L26 20 Z M40 12 L56 2 L54 20 Z" fill="#f2c21f"/><circle cx="40" cy="12" r="4" fill="#d9a90f"/>' : '';
  const extra = laco + (usa(p, 'oculos')
    ? `<g fill="none" stroke="${p.corOculos ?? '#22242c'}" stroke-width="2.2"><circle cx="30" cy="42" r="8"/><circle cx="50" cy="42" r="8"/><path d="M38 42 H42"/></g>`
    : usa(p, 'fones') ? `<path d="M14 44 C12 16 68 16 66 44" fill="none" stroke="#f2f2f4" stroke-width="3.5"/><rect x="9" y="36" width="9" height="16" rx="4" fill="${p.corFone ?? '#ff8a1f'}"/><rect x="62" y="36" width="9" height="16" rx="4" fill="${p.corFone ?? '#ff8a1f'}"/>` : '');
  return `<svg viewBox="0 0 80 80" aria-hidden="true">${atras}<circle cx="40" cy="42" r="25" fill="${pele}"/>${topo}
    <ellipse cx="30" cy="43" rx="5" ry="6" fill="#fff"/><ellipse cx="50" cy="43" rx="5" ry="6" fill="#fff"/>
    <circle cx="30.5" cy="44" r="3.4" fill="${p.olhos}"/><circle cx="50.5" cy="44" r="3.4" fill="${p.olhos}"/><circle cx="30.5" cy="44" r="1.5" fill="#111"/><circle cx="50.5" cy="44" r="1.5" fill="#111"/>
    <path d="M33 56 Q40 62 47 56" fill="none" stroke="#b8475a" stroke-width="2.4" stroke-linecap="round"/>${extra}</svg>`;
}
