// Carteira, loja, missões e presente do dia da Corrida dos Cachinhos. Só funções puras:
// cada uma recebe a carteira e devolve uma nova, sem mexer na original.

export const PODERES = {
  ima: { nome: 'Ímã de moedas', icone: '🧲', texto: 'Puxa as moedas das três faixas.' },
  pulo: { nome: 'Tênis de mola', icone: '👟', texto: 'Super pulos: passa até por cima dos carrinhos.' },
  maleta: { nome: 'Mochila a jato', icone: '🎒', texto: 'Voa por cima de tudo, pegando moedas no ar.' },
  supercarga: { nome: 'Supercarga', icone: '⚡', texto: 'Corre mais rápido, pula mais alto e atravessa os obstáculos.' },
};
export const NIVEL_MAXIMO = 5;
export const PRECO_NIVEL = [300, 750, 1500, 3000, 6000];

export const SKATES_LOJA = [
  { id: 'classico', preco: 0, texto: 'Protege de uma batida.' },
  { id: 'voador', preco: 2000, texto: 'Protege de uma batida e flutua: pulos mais altos e mais longos.' },
  { id: 'supersonico', preco: 5000, texto: 'Protege de uma batida, corre mais rápido e vale moedas em dobro.' },
];
// Estilos de roupa da menina: comprados uma vez, usados quando quiser.
export const ESTILOS = [
  { id: 'moletom', nome: 'Moletom Estrela', icone: '⭐', preco: 0, texto: 'Moletom branco com mangas azul-marinho, estrelas e número, e calça com listra.' },
  { id: 'esportiva', nome: 'Esportiva', icone: '🏃‍♀️', preco: 0, texto: 'Camiseta com recortes, short e faixa no cabelo.' },
  { id: 'street', nome: 'Street', icone: '🧥', preco: 600, texto: 'Moletom com capuz, calça jogger e tênis de cano alto.' },
  { id: 'skatista', nome: 'Skatista', icone: '🛹', preco: 900, texto: 'Camiseta larga estampada, bermuda xadrez, meião e boné virado.' },
  { id: 'jeans', nome: 'Jeans', icone: '👖', preco: 1200, texto: 'Jaqueta jeans com patches, saia xadrez, meia 3/4 e gorro.' },
  { id: 'tiedye', nome: 'Tie-dye', icone: '🌈', preco: 1500, texto: 'Camiseta tie-dye, legging colorida e viseira.' },
];

export const PRECO_CARGA = 250;
export const PRECO_ARRANCADA = 400; // bônus de largada: decolar com a mochila a jato

export function carteiraNova() {
  return {
    moedas: 0,
    skates: ['classico'],
    skate: 'classico',
    estilos: ['moletom', 'esportiva'],
    estilo: 'moletom',
    cargas: 2,
    arrancadas: 1,
    poderes: { ima: 0, pulo: 0, maleta: 0, supercarga: 0 },
    missoes: [],
    feitas: 0,
    presente: null,
  };
}

// Completa campos que faltam (carteiras antigas ou vindas de cópia).
export function normalizar(c) {
  const base = carteiraNova();
  if (!c || typeof c !== 'object') return base;
  return {
    ...base,
    ...c,
    poderes: { ...base.poderes, ...(c.poderes ?? {}) },
    skates: Array.from(new Set(['classico', ...(c.skates ?? [])])),
    estilos: Array.from(new Set(['moletom', 'esportiva', ...(c.estilos ?? [])])).filter((e) => ESTILOS.some((x) => x.id === e)),
    // quem já jogava antes do moletom passa a vestir ele uma vez; depois, vale a escolha da pessoa
    estilo: !(c.estilos ?? []).includes('moletom') ? 'moletom' : (ESTILOS.some((x) => x.id === c.estilo) ? c.estilo : 'moletom'),
    missoes: Array.isArray(c.missoes) ? c.missoes : [],
  };
}

const erro = (texto) => ({ erro: texto });

export function comprarSkate(c, id) {
  const item = SKATES_LOJA.find((s) => s.id === id);
  if (!item) return erro('Skate desconhecido.');
  if (c.skates.includes(id)) return erro('Você já tem este skate.');
  if (c.moedas < item.preco) return erro(`Faltam ${item.preco - c.moedas} moedas.`);
  return { carteira: { ...c, moedas: c.moedas - item.preco, skates: [...c.skates, id], skate: id } };
}

export function comprarEstilo(c, id) {
  const item = ESTILOS.find((e) => e.id === id);
  if (!item) return erro('Estilo desconhecido.');
  if (c.estilos.includes(id)) return erro('Você já tem este estilo.');
  if (c.moedas < item.preco) return erro(`Faltam ${item.preco - c.moedas} moedas.`);
  return { carteira: { ...c, moedas: c.moedas - item.preco, estilos: [...c.estilos, id], estilo: id } };
}

export function vestirEstilo(c, id) {
  if (!c.estilos.includes(id)) return erro('Compre este estilo primeiro.');
  return { carteira: { ...c, estilo: id } };
}

export function equipar(c, id) {
  if (!c.skates.includes(id)) return erro('Compre este skate primeiro.');
  return { carteira: { ...c, skate: id } };
}

export function comprarCargas(c, n = 1) {
  const preco = PRECO_CARGA * n;
  if (c.moedas < preco) return erro(`Faltam ${preco - c.moedas} moedas.`);
  return { carteira: { ...c, moedas: c.moedas - preco, cargas: c.cargas + n } };
}

export function comprarArrancadas(c, n = 1) {
  const preco = PRECO_ARRANCADA * n;
  if (c.moedas < preco) return erro(`Faltam ${preco - c.moedas} moedas.`);
  return { carteira: { ...c, moedas: c.moedas - preco, arrancadas: c.arrancadas + n } };
}

export function melhorar(c, poder) {
  if (!PODERES[poder]) return erro('Poder desconhecido.');
  const nivel = c.poderes[poder];
  if (nivel >= NIVEL_MAXIMO) return erro('Já está no nível máximo.');
  const preco = PRECO_NIVEL[nivel];
  if (c.moedas < preco) return erro(`Faltam ${preco - c.moedas} moedas.`);
  return { carteira: { ...c, moedas: c.moedas - preco, poderes: { ...c.poderes, [poder]: nivel + 1 } } };
}

// ---------- Missões (valem dentro de uma corrida) ----------
const MODELOS = [
  { tipo: 'moedas', alvos: [50, 100, 200, 350], texto: (n) => `Pegue ${n} moedas numa corrida` },
  { tipo: 'metros', alvos: [400, 800, 1500, 2500], texto: (n) => `Corra ${n} metros` },
  { tipo: 'pulos', alvos: [15, 30, 50], texto: (n) => `Pule ${n} vezes numa corrida` },
  { tipo: 'deslizes', alvos: [10, 20, 35], texto: (n) => `Deslize ${n} vezes numa corrida` },
  { tipo: 'pontos', alvos: [1000, 2500, 5000], texto: (n) => `Faça ${n.toLocaleString('pt-BR')} pontos` },
  { tipo: 'maletas', alvos: [1, 2], texto: (n) => (n === 1 ? 'Voe com a mochila a jato' : `Voe ${n} vezes com a mochila a jato`) },
  { tipo: 'itens', alvos: [3, 6, 10], texto: (n) => `Pegue ${n} itens na pista` },
  { tipo: 'supercargas', alvos: [1, 2], texto: (n) => (n === 1 ? 'Ative a supercarga' : `Ative a supercarga ${n} vezes`) },
  { tipo: 'superPulos', alvos: [5, 12], texto: (n) => `Dê ${n} super pulos` },
  { tipo: 'skates', alvos: [1], texto: () => 'Ande de skate numa corrida' },
];

// A missão fica um pouco mais difícil a cada uma concluída; o prêmio acompanha.
export function sortearMissao(c, aleatorio = Math.random, evitar = []) {
  const livres = MODELOS.filter((m) => !evitar.includes(m.tipo));
  const m = livres[Math.floor(aleatorio() * livres.length)];
  const degrau = Math.min(m.alvos.length - 1, Math.floor((c.feitas ?? 0) / 3) + (aleatorio() < 0.3 ? 1 : 0));
  const alvo = m.alvos[degrau];
  return { tipo: m.tipo, alvo, texto: m.texto(alvo), premio: 100 + degrau * 150 };
}

export function completarMissoes(c, aleatorio = Math.random) {
  const missoes = [...c.missoes];
  while (missoes.length < 3) missoes.push(sortearMissao(c, aleatorio, missoes.map((m) => m.tipo)));
  return { ...c, missoes };
}

// Depois da corrida: soma as moedas pegas, paga as missões cumpridas e sorteia novas.
export function fecharCorrida(c, resultado, aleatorio = Math.random) {
  let carteira = completarMissoes(c, aleatorio);
  const concluidas = carteira.missoes.filter((m) => (resultado[m.tipo] ?? 0) >= m.alvo);
  const premio = concluidas.reduce((t, m) => t + m.premio, 0);
  carteira = {
    ...carteira,
    moedas: carteira.moedas + resultado.moedas + premio,
    cargas: Math.max(0, carteira.cargas - (resultado.cargasUsadas ?? 0)),
    arrancadas: Math.max(0, carteira.arrancadas - (resultado.arrancadas ?? 0)),
    feitas: carteira.feitas + concluidas.length,
    missoes: carteira.missoes.filter((m) => !concluidas.includes(m)),
  };
  return { carteira: completarMissoes(carteira, aleatorio), concluidas, premio };
}

// ---------- Presente do dia ----------
export const PRESENTES = [100, 150, 200, 300, 500]; // cresce com dias seguidos

export function presenteDisponivel(c, hoje) {
  return c.presente?.dia !== hoje;
}

export function abrirPresente(c, hoje) {
  if (!presenteDisponivel(c, hoje)) return erro('O presente de hoje já foi aberto.');
  const ontem = new Date(new Date(`${hoje}T12:00:00`).getTime() - 86400000).toISOString().slice(0, 10);
  const seguidos = c.presente?.dia === ontem ? Math.min(PRESENTES.length, (c.presente.seguidos ?? 1) + 1) : 1;
  const premio = PRESENTES[seguidos - 1];
  const bonusCarga = seguidos === PRESENTES.length ? 1 : 0;
  return {
    carteira: { ...c, moedas: c.moedas + premio, cargas: c.cargas + bonusCarga, presente: { dia: hoje, seguidos } },
    premio,
    seguidos,
    bonusCarga,
  };
}

// Junta duas carteiras (ex.: restaurar uma cópia), sem perder compras de nenhum lado.
export function mesclarCarteiras(a, b) {
  const x = normalizar(a); const y = normalizar(b);
  return normalizar({
    ...x,
    moedas: Math.max(x.moedas, y.moedas),
    cargas: Math.max(x.cargas, y.cargas),
    arrancadas: Math.max(x.arrancadas, y.arrancadas),
    skates: [...x.skates, ...y.skates],
    estilos: [...x.estilos, ...y.estilos],
    poderes: Object.fromEntries(Object.keys(PODERES).map((k) => [k, Math.max(x.poderes[k], y.poderes[k])])),
    feitas: Math.max(x.feitas, y.feitas),
  });
}
