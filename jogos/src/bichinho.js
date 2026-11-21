// Meu Bichinho: lógica pura (sem DOM). O estado do bichinho fica em prefs.bichinho e as
// moedas em prefs.carteira.moedas; cada função recebe o estado e devolve um novo, sem mexer
// no original. As barras vão de 0 a 100 (100 = tudo ótimo) e caem com o tempo real.

export const ESPECIES = [
  { id: 'gato', nome: 'Gatinho', emoji: '🐱' },
  { id: 'cachorro', nome: 'Cachorrinho', emoji: '🐶' },
  { id: 'coelho', nome: 'Coelhinho', emoji: '🐰' },
  { id: 'dino', nome: 'Dinossaurinho', emoji: '🦖' },
  { id: 'unicornio', nome: 'Unicórnio', emoji: '🦄' },
];

export const BARRAS = [
  { id: 'fome', nome: 'Barriguinha', icone: '🍎' },
  { id: 'limpeza', nome: 'Limpeza', icone: '🫧' },
  { id: 'alegria', nome: 'Alegria', icone: '💛' },
  { id: 'energia', nome: 'Energia', icone: '⚡' },
];

export const MAXIMO = 100;
// O bichinho nunca chega a zero: no máximo fica tristinho esperando você voltar.
export const MINIMO = 10;
const HORA = 3600000;
// Quanto cada barra muda por hora: acordado e dormindo (energia sobe dormindo).
export const TAXAS = {
  acordado: { fome: -7, limpeza: -4, alegria: -6, energia: -5 },
  dormindo: { fome: -3, limpeza: -1, alegria: 0, energia: 25 },
};
const LIMITE_AUSENCIA = 30 * 24 * HORA; // relógio maluco ou meses longe: tanto faz, já está no mínimo

export const NOMES_SUGERIDOS = ['Pipoca', 'Bolinha', 'Mel', 'Floquinho', 'Pingo', 'Paçoca', 'Fofura', 'Biscoito', 'Nuvem', 'Jujuba'];

// ---------- Comidas ----------
// As do dia a dia são de graça e infinitas; as especiais vêm da loja e ficam na despensa.
export const COMIDAS = [
  { id: 'maca', nome: 'Maçã', icone: '🍎', fome: 20, alegria: 2 },
  { id: 'cenoura', nome: 'Cenoura', icone: '🥕', fome: 18, alegria: 2 },
  { id: 'leite', nome: 'Leitinho', icone: '🥛', fome: 15, alegria: 3, energia: 3 },
  { id: 'racao', nome: 'Papinha', icone: '🥣', fome: 30, alegria: 0 },
  { id: 'bolo', nome: 'Bolo', icone: '🎂', fome: 35, alegria: 15, preco: 25, especial: true },
  { id: 'sorvete', nome: 'Sorvete', icone: '🍦', fome: 15, alegria: 20, preco: 20, especial: true },
  { id: 'pizza', nome: 'Pizza', icone: '🍕', fome: 45, alegria: 10, preco: 30, especial: true },
  { id: 'cupcake', nome: 'Cupcake', icone: '🧁', fome: 20, alegria: 18, preco: 20, especial: true },
  { id: 'morango', nome: 'Morangos', icone: '🍓', fome: 22, alegria: 12, energia: 5, preco: 15, especial: true },
  { id: 'melancia', nome: 'Melancia', icone: '🍉', fome: 28, alegria: 12, limpeza: -5, preco: 15, especial: true },
];

// ---------- Roupinhas e acessórios ----------
// Cada um ocupa um lugar do corpo; dá para usar um de cada lugar ao mesmo tempo.
export const LUGARES = { cabeca: 'Chapéu', laco: 'Laço', olhos: 'Óculos', pescoco: 'Pescoço' };
export const ACESSORIOS = [
  { id: 'festa', nome: 'Chapéu de festa', lugar: 'cabeca', preco: 120 },
  { id: 'cartola', nome: 'Cartola', lugar: 'cabeca', preco: 200 },
  { id: 'coroa', nome: 'Coroa', lugar: 'cabeca', preco: 350 },
  { id: 'bone', nome: 'Boné', lugar: 'cabeca', preco: 150 },
  { id: 'laco-rosa', nome: 'Laço rosa', lugar: 'laco', preco: 80 },
  { id: 'laco-azul', nome: 'Laço de bolinhas', lugar: 'laco', preco: 100 },
  { id: 'flor', nome: 'Florzinha', lugar: 'laco', preco: 90 },
  { id: 'oculos-sol', nome: 'Óculos de sol', lugar: 'olhos', preco: 150 },
  { id: 'oculos-coracao', nome: 'Óculos de coração', lugar: 'olhos', preco: 180 },
  { id: 'cachecol', nome: 'Cachecol listrado', lugar: 'pescoco', preco: 120 },
  { id: 'gravata', nome: 'Gravatinha', lugar: 'pescoco', preco: 90 },
  { id: 'colar', nome: 'Colar de pérolas', lugar: 'pescoco', preco: 250 },
];

// ---------- Moedas por cuidar ----------
export const MOEDAS_BRINCAR = 5; // por brincadeira bem-sucedida
export const META_BRINCAR = 5; // bolinhas pegas para ganhar as moedas
export const MOEDAS_BANHO = 2; // banho quando estava sujinho
export const LIMITE_MOEDAS_DIA = 30;

const erro = (texto) => ({ erro: texto });
const limitar = (v) => Math.max(0, Math.min(MAXIMO, v));
// O piso só segura a queda com o tempo; o que já estava abaixo dele (estado antigo) não sobe sozinho.
const cair = (v, delta) => (delta >= 0 ? Math.min(MAXIMO, v + delta) : Math.max(Math.min(v, MINIMO), v + delta));

export function diaDe(agora) {
  const d = new Date(agora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function limparNome(nome) {
  return String(nome ?? '').replace(/\s+/g, ' ').trim().slice(0, 16);
}

export function novoBichinho(especie, nome, agora = Date.now(), anterior = null) {
  if (!ESPECIES.some((e) => e.id === especie)) return erro('Escolha um bichinho.');
  const n = limparNome(nome);
  if (!n) return erro('Dê um nome para o seu bichinho.');
  const base = {
    versao: 1,
    especie,
    nome: n,
    criado: agora,
    atualizado: agora,
    barras: { fome: 70, limpeza: 80, alegria: 75, energia: 80 },
    dormindo: false,
    acessorios: [],
    vestindo: { cabeca: null, laco: null, olhos: null, pescoco: null },
    despensa: {},
    moedasDia: { dia: null, ganhas: 0 },
    cuidados: 0,
  };
  // Adotar outro bichinho não perde as roupinhas, a despensa nem o limite de moedas do dia.
  if (anterior) {
    const a = normalizarBichinho(anterior);
    if (a) Object.assign(base, { acessorios: a.acessorios, vestindo: a.vestindo, despensa: a.despensa, moedasDia: a.moedasDia });
  }
  return { bichinho: base };
}

// Aceita qualquer coisa vinda do armazenamento: devolve um bichinho válido ou null.
export function normalizarBichinho(b) {
  if (!b || typeof b !== 'object' || !ESPECIES.some((e) => e.id === b.especie)) return null;
  const nome = limparNome(b.nome) || ESPECIES.find((e) => e.id === b.especie).nome;
  const barras = {};
  for (const { id } of BARRAS) {
    const v = Number(b.barras?.[id]);
    barras[id] = Number.isFinite(v) ? limitar(v) : 70;
  }
  const acessorios = Array.isArray(b.acessorios) ? Array.from(new Set(b.acessorios.filter((a) => ACESSORIOS.some((x) => x.id === a)))) : [];
  const vestindo = {};
  for (const lugar of Object.keys(LUGARES)) {
    const v = b.vestindo?.[lugar];
    vestindo[lugar] = acessorios.includes(v) && ACESSORIOS.find((x) => x.id === v).lugar === lugar ? v : null;
  }
  const despensa = {};
  for (const c of COMIDAS) {
    const n = Math.floor(Number(b.despensa?.[c.id]));
    if (c.especial && n > 0) despensa[c.id] = n;
  }
  const agora = Date.now();
  const atualizado = Number.isFinite(b.atualizado) ? b.atualizado : agora;
  return {
    versao: 1,
    especie: b.especie,
    nome,
    criado: Number.isFinite(b.criado) ? b.criado : atualizado,
    atualizado,
    barras,
    dormindo: Boolean(b.dormindo),
    acessorios,
    vestindo,
    despensa,
    moedasDia: { dia: typeof b.moedasDia?.dia === 'string' ? b.moedasDia.dia : null, ganhas: Math.max(0, Number(b.moedasDia?.ganhas) || 0) },
    cuidados: Math.max(0, Number(b.cuidados) || 0),
  };
}

function aplicarTaxas(barras, taxas, horas) {
  const r = {};
  for (const { id } of BARRAS) r[id] = cair(barras[id], taxas[id] * horas);
  return r;
}

// Faz o tempo passar desde a última atualização (inclusive com o app fechado).
// Dormindo, a energia sobe; quando enche, o bichinho acorda sozinho e o resto do tempo
// conta como acordado.
export function atualizar(b, agora = Date.now()) {
  let dt = Math.min(LIMITE_AUSENCIA, Math.max(0, agora - b.atualizado));
  if (agora < b.atualizado) return { ...b, atualizado: agora }; // relógio voltou: não pune nem premia
  let barras = { ...b.barras };
  let dormindo = b.dormindo;
  if (dormindo) {
    const ateEncher = ((MAXIMO - barras.energia) / TAXAS.dormindo.energia) * HORA;
    const dormido = Math.min(dt, ateEncher);
    barras = aplicarTaxas(barras, TAXAS.dormindo, dormido / HORA);
    dt -= dormido;
    if (barras.energia >= MAXIMO - 1e-9) { barras.energia = MAXIMO; dormindo = false; }
  }
  if (dt > 0) barras = aplicarTaxas(barras, TAXAS.acordado, dt / HORA);
  return { ...b, barras, dormindo, atualizado: agora };
}

export const ESTADOS = {
  dormindo: { id: 'dormindo', texto: 'Dormindo', emoji: '😴' },
  feliz: { id: 'feliz', texto: 'Muito feliz', emoji: '😄' },
  contente: { id: 'contente', texto: 'Contente', emoji: '🙂' },
  triste: { id: 'triste', texto: 'Tristinho', emoji: '🥺' },
};

export function humor(b) {
  if (b.dormindo) return ESTADOS.dormindo;
  const v = BARRAS.map(({ id }) => b.barras[id]);
  const menor = Math.min(...v);
  const media = v.reduce((t, x) => t + x, 0) / v.length;
  if (menor < 25) return ESTADOS.triste;
  if (media >= 70 && menor >= 45) return ESTADOS.feliz;
  return ESTADOS.contente;
}

const PEDIDOS = {
  fome: 'Estou com fome! 🍎',
  limpeza: 'Preciso de um banho! 🛁',
  alegria: 'Vamos brincar? ⚽',
  energia: 'Estou com soninho... 💤',
};
// O que o bichinho mais precisa agora (ou null se está tudo bem).
export function pedido(b) {
  if (b.dormindo) return null;
  let pior = null;
  for (const { id } of BARRAS) if (b.barras[id] < 40 && (!pior || b.barras[id] < b.barras[pior])) pior = id;
  return pior ? { barra: pior, texto: PEDIDOS[pior] } : null;
}

const mexer = (b, mudancas) => {
  const barras = { ...b.barras };
  for (const [k, v] of Object.entries(mudancas)) if (v) barras[k] = limitar(barras[k] + v);
  return { ...b, barras, cuidados: (b.cuidados ?? 0) + 1 };
};

// ---------- Ações ----------
export function alimentar(b, comidaId) {
  const c = COMIDAS.find((x) => x.id === comidaId);
  if (!c) return erro('Comida desconhecida.');
  if (b.dormindo) return erro('Shhh... está dormindo.');
  if (c.especial && !(b.despensa[comidaId] > 0)) return erro(`Acabou ${c.nome.toLowerCase()}. Compre mais na loja!`);
  if (b.barras.fome >= 95) return erro('Estou cheinho! 😋');
  let novo = mexer(b, { fome: c.fome, alegria: c.alegria, energia: c.energia, limpeza: c.limpeza });
  if (c.especial) {
    const despensa = { ...b.despensa, [comidaId]: b.despensa[comidaId] - 1 };
    if (!despensa[comidaId]) delete despensa[comidaId];
    novo = { ...novo, despensa };
  }
  return { bichinho: novo, comida: c };
}

export function carinho(b) {
  if (b.dormindo) return erro('Shhh... está dormindo.');
  return { bichinho: mexer(b, { alegria: 3 }) };
}

export function podeBrincar(b) {
  if (b.dormindo) return erro('Shhh... está dormindo.');
  if (b.barras.energia < 20) return erro('Estou cansadinho... Me coloca para dormir? 💤');
  return { ok: true };
}

// Soma moedas respeitando o limite do dia. Devolve quantas entraram de fato.
export function ganharMoedas(b, carteira, n, agora = Date.now()) {
  const hoje = diaDe(agora);
  const ja = b.moedasDia.dia === hoje ? b.moedasDia.ganhas : 0;
  const ganhas = Math.max(0, Math.min(n, LIMITE_MOEDAS_DIA - ja));
  return {
    bichinho: { ...b, moedasDia: { dia: hoje, ganhas: ja + ganhas } },
    carteira: { ...carteira, moedas: (carteira.moedas ?? 0) + ganhas },
    ganhas,
  };
}

export function moedasRestantesHoje(b, agora = Date.now()) {
  return LIMITE_MOEDAS_DIA - (b.moedasDia.dia === diaDe(agora) ? b.moedasDia.ganhas : 0);
}

// Fim do mini-jogo da bolinha: alegria conforme as bolinhas pegas, gasta energia,
// e vale moedas se pegou a meta.
export function brincar(b, carteira, pegou, agora = Date.now()) {
  const pode = podeBrincar(b);
  if (pode.erro) return pode;
  const n = Math.max(0, Math.floor(pegou) || 0);
  const novo = mexer(b, { alegria: Math.min(40, 8 + n * 3), energia: -12, fome: -6, limpeza: -5 });
  if (n < META_BRINCAR) return { bichinho: novo, carteira, ganhas: 0 };
  return ganharMoedas(novo, carteira, MOEDAS_BRINCAR, agora);
}

export function banho(b, carteira, agora = Date.now()) {
  if (b.dormindo) return erro('Shhh... está dormindo.');
  const estavaSujo = b.barras.limpeza < 60;
  const novo = mexer(b, { limpeza: MAXIMO, alegria: 5 });
  if (!estavaSujo) return { bichinho: novo, carteira, ganhas: 0 };
  return ganharMoedas(novo, carteira, MOEDAS_BANHO, agora);
}

export function dormir(b) {
  if (b.dormindo) return erro('Já está dormindo.');
  if (b.barras.energia >= 90) return erro('Ainda não estou com sono! Vamos brincar? ⚽');
  return { bichinho: { ...b, dormindo: true } };
}

export function acordar(b) {
  if (!b.dormindo) return erro('Já está acordado.');
  return { bichinho: { ...b, dormindo: false } };
}

// ---------- Loja ----------
export function comprarAcessorio(b, carteira, id) {
  const item = ACESSORIOS.find((x) => x.id === id);
  if (!item) return erro('Item desconhecido.');
  if (b.acessorios.includes(id)) return erro('Você já tem este.');
  if ((carteira.moedas ?? 0) < item.preco) return erro(`Faltam ${item.preco - (carteira.moedas ?? 0)} moedas.`);
  return {
    bichinho: { ...b, acessorios: [...b.acessorios, id], vestindo: { ...b.vestindo, [item.lugar]: id } },
    carteira: { ...carteira, moedas: carteira.moedas - item.preco },
  };
}

// Veste o acessório (tirando o que estava no mesmo lugar) ou tira, se já estava vestido.
export function vestir(b, id) {
  const item = ACESSORIOS.find((x) => x.id === id);
  if (!item) return erro('Item desconhecido.');
  if (!b.acessorios.includes(id)) return erro('Compre este primeiro.');
  const tirar = b.vestindo[item.lugar] === id;
  return { bichinho: { ...b, vestindo: { ...b.vestindo, [item.lugar]: tirar ? null : id } }, tirou: tirar };
}

export function comprarComida(b, carteira, id, n = 1) {
  const c = COMIDAS.find((x) => x.id === id && x.especial);
  if (!c) return erro('Esta comida não está à venda.');
  const preco = c.preco * n;
  if ((carteira.moedas ?? 0) < preco) return erro(`Faltam ${preco - (carteira.moedas ?? 0)} moedas.`);
  return {
    bichinho: { ...b, despensa: { ...b.despensa, [id]: (b.despensa[id] ?? 0) + n } },
    carteira: { ...carteira, moedas: carteira.moedas - preco },
  };
}
