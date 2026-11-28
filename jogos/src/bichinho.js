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
// As fantasias completas ficam no corpo e também ocupam outros lugares (as antenas da abelha
// ficam na cabeça, as asinhas nas costas): vestir uma tira o que estava nesses lugares.
export const LUGARES = { cabeca: 'Chapéu', laco: 'Laço', olhos: 'Óculos', pescoco: 'Pescoço', costas: 'Costas', corpo: 'Roupa' };
export const ACESSORIOS = [
  { id: 'festa', nome: 'Chapéu de festa', lugar: 'cabeca', preco: 120 },
  { id: 'cartola', nome: 'Cartola', lugar: 'cabeca', preco: 200 },
  { id: 'coroa', nome: 'Coroa', lugar: 'cabeca', preco: 350 },
  { id: 'bone', nome: 'Boné', lugar: 'cabeca', preco: 150 },
  { id: 'tiara-unicornio', nome: 'Tiara de unicórnio', lugar: 'cabeca', preco: 220 },
  { id: 'pirata', nome: 'Chapéu de pirata', lugar: 'cabeca', preco: 240 },
  { id: 'coroa-flores', nome: 'Coroa de flores', lugar: 'cabeca', preco: 180 },
  { id: 'bruxinha', nome: 'Chapéu de bruxinha', lugar: 'cabeca', preco: 200 },
  { id: 'gorro', nome: 'Gorro de pompom', lugar: 'cabeca', preco: 140 },
  { id: 'laco-rosa', nome: 'Laço rosa', lugar: 'laco', preco: 80 },
  { id: 'laco-azul', nome: 'Laço de bolinhas', lugar: 'laco', preco: 100 },
  { id: 'flor', nome: 'Florzinha', lugar: 'laco', preco: 90 },
  { id: 'estrela', nome: 'Presilha de estrela', lugar: 'laco', preco: 90 },
  { id: 'oculos-sol', nome: 'Óculos de sol', lugar: 'olhos', preco: 150 },
  { id: 'oculos-coracao', nome: 'Óculos de coração', lugar: 'olhos', preco: 180 },
  { id: 'oculos-redondos', nome: 'Óculos redondinhos', lugar: 'olhos', preco: 130 },
  { id: 'tapa-olho', nome: 'Tapa-olho de pirata', lugar: 'olhos', preco: 100 },
  { id: 'cachecol', nome: 'Cachecol listrado', lugar: 'pescoco', preco: 120 },
  { id: 'gravata', nome: 'Gravatinha', lugar: 'pescoco', preco: 90 },
  { id: 'colar', nome: 'Colar de pérolas', lugar: 'pescoco', preco: 250 },
  { id: 'bandana', nome: 'Lencinho', lugar: 'pescoco', preco: 100 },
  { id: 'colar-havaiano', nome: 'Colar de flores', lugar: 'pescoco', preco: 150 },
  { id: 'asas-borboleta', nome: 'Asas de borboleta', lugar: 'costas', preco: 280 },
  { id: 'asas-fada', nome: 'Asinhas de fada', lugar: 'costas', preco: 300 },
  { id: 'capa', nome: 'Capa de herói', lugar: 'costas', preco: 260 },
  { id: 'mochila', nome: 'Mochilinha', lugar: 'costas', preco: 160 },
  { id: 'tutu', nome: 'Tutu de bailarina', lugar: 'corpo', preco: 220 },
  { id: 'marinheiro', nome: 'Blusa de marinheiro', lugar: 'corpo', preco: 150 },
  { id: 'sueter', nome: 'Suéter de coração', lugar: 'corpo', preco: 170 },
  { id: 'abelha', nome: 'Fantasia de abelha', lugar: 'corpo', preco: 320, fantasia: true, ocupa: ['cabeca', 'costas'] },
  { id: 'joaninha', nome: 'Fantasia de joaninha', lugar: 'corpo', preco: 320, fantasia: true, ocupa: ['cabeca', 'costas'] },
  { id: 'astronauta', nome: 'Fantasia de astronauta', lugar: 'corpo', preco: 350, fantasia: true, ocupa: ['cabeca', 'costas', 'pescoco'] },
];
// Lugares que um acessório ocupa (o dele e, nas fantasias, os outros).
export const ocupados = (item) => [item.lugar, ...(item.ocupa ?? [])];

// ---------- Quarto ----------
// Cada lugar do quarto mostra um item escolhido (ou o de sempre, se nenhum). Um tema troca o
// quarto inteiro; os brinquedos continuam aparecendo.
export const LUGARES_QUARTO = { tema: 'Tema', parede: 'Papel de parede', cortina: 'Janela', cama: 'Caminha', tapete: 'Tapete', quadro: 'Quadro', abajur: 'Abajur', planta: 'Plantinha' };
export const QUARTO = [
  { id: 'tema-praia', nome: 'Quarto praia', lugar: 'tema', preco: 600 },
  { id: 'tema-espaco', nome: 'Quarto espacial', lugar: 'tema', preco: 600 },
  { id: 'tema-jardim', nome: 'Jardim encantado', lugar: 'tema', preco: 600 },
  { id: 'parede-listras', nome: 'Listrinhas', lugar: 'parede', preco: 150 },
  { id: 'parede-estrelas', nome: 'Estrelinhas', lugar: 'parede', preco: 180 },
  { id: 'parede-coracoes', nome: 'Coraçõezinhos', lugar: 'parede', preco: 180 },
  { id: 'parede-nuvens', nome: 'Nuvens', lugar: 'parede', preco: 200 },
  { id: 'cortina-estrelas', nome: 'Cortina de estrelas', lugar: 'cortina', preco: 160 },
  { id: 'cortina-babado', nome: 'Cortina de babado', lugar: 'cortina', preco: 180 },
  { id: 'janela-redonda', nome: 'Janela redonda', lugar: 'cortina', preco: 260 },
  { id: 'cama-almofada', nome: 'Almofadão', lugar: 'cama', preco: 200 },
  { id: 'cama-nuvem', nome: 'Cama de nuvem', lugar: 'cama', preco: 350 },
  { id: 'cama-dossel', nome: 'Cama de princesa', lugar: 'cama', preco: 450 },
  { id: 'tapete-arco-iris', nome: 'Tapete arco-íris', lugar: 'tapete', preco: 180 },
  { id: 'tapete-flor', nome: 'Tapete de flor', lugar: 'tapete', preco: 160 },
  { id: 'tapete-patinhas', nome: 'Tapete de patinhas', lugar: 'tapete', preco: 140 },
  { id: 'quadro-arco-iris', nome: 'Quadro de arco-íris', lugar: 'quadro', preco: 120 },
  { id: 'quadro-montanha', nome: 'Paisagem', lugar: 'quadro', preco: 140 },
  { id: 'quadro-retrato', nome: 'Retrato do bichinho', lugar: 'quadro', preco: 200 },
  { id: 'abajur-lua', nome: 'Abajur de lua', lugar: 'abajur', preco: 220 },
  { id: 'abajur-cogumelo', nome: 'Abajur cogumelo', lugar: 'abajur', preco: 200 },
  { id: 'planta-flor', nome: 'Vasinho de flor', lugar: 'planta', preco: 100 },
  { id: 'planta-cacto', nome: 'Cacto fofinho', lugar: 'planta', preco: 90 },
  { id: 'planta-girassol', nome: 'Girassol', lugar: 'planta', preco: 130 },
];

// ---------- Brinquedos ----------
// Ficam no quarto; cada um faz a alegria cair um pouco mais devagar (o efeito somado tem limite).
// Os que são esconderijo aparecem no esconde-esconde.
export const BRINQUEDOS = [
  { id: 'bola-praia', nome: 'Bola de praia', preco: 60, efeito: 0.05 },
  { id: 'patinho', nome: 'Patinho de borracha', preco: 60, efeito: 0.05 },
  { id: 'blocos', nome: 'Blocos de montar', preco: 90, efeito: 0.06 },
  { id: 'piao', nome: 'Pião colorido', preco: 100, efeito: 0.06 },
  { id: 'carrinho', nome: 'Carrinho', preco: 120, efeito: 0.08 },
  { id: 'ursinho', nome: 'Ursão de pelúcia', preco: 160, efeito: 0.1, esconderijo: true },
  { id: 'robo', nome: 'Robozinho', preco: 200, efeito: 0.1 },
  { id: 'casinha', nome: 'Casinha de papelão', preco: 250, efeito: 0.12, esconderijo: true },
];
export const LIMITE_EFEITO_BRINQUEDOS = 0.4; // no máximo a alegria cai 40% mais devagar

// Quanto da queda da alegria continua valendo (1 = sem brinquedos).
export function fatorAlegria(b) {
  const soma = (b?.brinquedos ?? []).reduce((t, id) => t + (BRINQUEDOS.find((x) => x.id === id)?.efeito ?? 0), 0);
  return 1 - Math.min(LIMITE_EFEITO_BRINQUEDOS, soma);
}

// ---------- Brincadeiras ----------
// meta: pontos para ganhar MOEDAS_BRINCAR; super: pontos para ganhar MOEDAS_SUPER.
export const BRINCADEIRAS = [
  { id: 'bola', nome: 'Pega a bolinha', icone: '⚽', meta: 5, super: 12, texto: 'Toque na bolinha que quica.' },
  { id: 'bolhas', nome: 'Bolhas de sabão', icone: '🫧', meta: 18, super: 32, texto: 'Estoure! As douradas valem 3.' },
  { id: 'esconde', nome: 'Esconde-esconde', icone: '🙈', meta: 7, super: 11, texto: 'Ache onde ele se escondeu.' },
  { id: 'danca', nome: 'Dança', icone: '💃', meta: 36, super: 58, texto: 'Setinhas no ritmo da música.' },
  { id: 'petisco', nome: 'Pega o petisco', icone: '🦴', meta: 12, super: 22, texto: 'Arraste e pegue a comida.' },
  { id: 'siga', nome: 'Siga o bichinho', icone: '🧩', meta: 5, super: 8, texto: 'Repita as cores que ele mostra.' },
];

// ---------- Moedas por cuidar ----------
export const MOEDAS_BRINCAR = 5; // por brincadeira bem-sucedida
export const MOEDAS_SUPER = 8; // brincadeira muito bem jogada
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
    versao: 2,
    especie,
    nome: n,
    criado: agora,
    atualizado: agora,
    barras: { fome: 70, limpeza: 80, alegria: 75, energia: 80 },
    dormindo: false,
    acessorios: [],
    vestindo: Object.fromEntries(Object.keys(LUGARES).map((l) => [l, null])),
    despensa: {},
    moedasDia: { dia: null, ganhas: 0 },
    cuidados: 0,
    quarto: { itens: [], usando: Object.fromEntries(Object.keys(LUGARES_QUARTO).map((l) => [l, null])) },
    brinquedos: [],
    recordes: {},
  };
  // Adotar outro bichinho não perde as roupinhas, o quarto, os brinquedos, a despensa nem o limite de moedas do dia.
  if (anterior) {
    const a = normalizarBichinho(anterior);
    if (a) Object.assign(base, { acessorios: a.acessorios, vestindo: a.vestindo, despensa: a.despensa, moedasDia: a.moedasDia, quarto: a.quarto, brinquedos: a.brinquedos });
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
  // Uma fantasia vestida ocupa outros lugares: o que estivesse neles (estado estranho) sai.
  for (const lugar of Object.keys(LUGARES)) {
    const item = ACESSORIOS.find((x) => x.id === vestindo[lugar]);
    for (const outro of item?.ocupa ?? []) vestindo[outro] = null;
  }
  const lista = (v, catalogo) => (Array.isArray(v) ? Array.from(new Set(v.filter((id) => catalogo.some((x) => x.id === id)))) : []);
  const itensQuarto = lista(b.quarto?.itens, QUARTO);
  const usandoQuarto = {};
  for (const lugar of Object.keys(LUGARES_QUARTO)) {
    const v = b.quarto?.usando?.[lugar];
    usandoQuarto[lugar] = itensQuarto.includes(v) && QUARTO.find((x) => x.id === v).lugar === lugar ? v : null;
  }
  const recordes = {};
  for (const { id } of BRINCADEIRAS) {
    const n = Math.floor(Number(b.recordes?.[id]));
    if (n > 0) recordes[id] = n;
  }
  const despensa = {};
  for (const c of COMIDAS) {
    const n = Math.floor(Number(b.despensa?.[c.id]));
    if (c.especial && n > 0) despensa[c.id] = n;
  }
  const agora = Date.now();
  const atualizado = Number.isFinite(b.atualizado) ? b.atualizado : agora;
  return {
    versao: 2,
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
    quarto: { itens: itensQuarto, usando: usandoQuarto },
    brinquedos: lista(b.brinquedos, BRINQUEDOS),
    recordes,
  };
}

function aplicarTaxas(barras, taxas, horas, alegria = 1) {
  const r = {};
  for (const { id } of BARRAS) r[id] = cair(barras[id], taxas[id] * horas * (id === 'alegria' ? alegria : 1));
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
  if (dt > 0) barras = aplicarTaxas(barras, TAXAS.acordado, dt / HORA, fatorAlegria(b));
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

// Fim de qualquer brincadeira: alegria conforme os pontos, gasta energia e vale moedas
// (MOEDAS_BRINCAR na meta, MOEDAS_SUPER no "muito bem"), sempre dentro do limite do dia.
// Também guarda o recorde de cada brincadeira.
export function terminarBrincadeira(b, carteira, id, pontos, agora = Date.now()) {
  const br = BRINCADEIRAS.find((x) => x.id === id);
  if (!br) return erro('Brincadeira desconhecida.');
  const pode = podeBrincar(b);
  if (pode.erro) return pode;
  const n = Math.max(0, Math.floor(pontos) || 0);
  const alegria = id === 'bola' ? Math.min(40, 8 + n * 3) : 8 + Math.round(32 * Math.min(1, n / br.super));
  const gasto = { energia: id === 'danca' ? -15 : -12, fome: -6, limpeza: -5 };
  if (id === 'petisco') gasto.fome = Math.min(15, n); // comeu os petiscos
  if (id === 'bolhas') gasto.limpeza = 0; // bolha de sabão não suja
  const recorde = n > (b.recordes?.[id] ?? 0);
  let novo = mexer(b, { alegria, ...gasto });
  if (recorde) novo = { ...novo, recordes: { ...(b.recordes ?? {}), [id]: n } };
  const nivel = n >= br.super ? 'super' : n >= br.meta ? 'meta' : 'pouco';
  if (nivel === 'pouco') return { bichinho: novo, carteira, ganhas: 0, nivel, recorde };
  return { ...ganharMoedas(novo, carteira, nivel === 'super' ? MOEDAS_SUPER : MOEDAS_BRINCAR, agora), nivel, recorde };
}

// Tocar num brinquedo do quarto: o bichinho brinca um pouquinho com ele.
export function brincarComBrinquedo(b, id) {
  const br = BRINQUEDOS.find((x) => x.id === id);
  if (!br) return erro('Brinquedo desconhecido.');
  if (!(b.brinquedos ?? []).includes(id)) return erro('Compre este brinquedo primeiro.');
  if (b.dormindo) return erro('Shhh... está dormindo.');
  if (b.barras.energia < 8) return erro('Estou cansadinho... 💤');
  return { bichinho: mexer(b, { alegria: 4, energia: -1 }), brinquedo: br };
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
    bichinho: { ...b, acessorios: [...b.acessorios, id], vestindo: vestirItem(b.vestindo, item) },
    carteira: { ...carteira, moedas: carteira.moedas - item.preco },
  };
}

// Põe o item no lugar dele, tirando o que estava nos lugares que ele ocupa e as fantasias que
// ocupavam o lugar dele.
function vestirItem(vestindo, item) {
  const novo = { ...vestindo };
  for (const lugar of ocupados(item)) novo[lugar] = null;
  for (const [lugar, id] of Object.entries(novo)) {
    const outro = ACESSORIOS.find((x) => x.id === id);
    if (outro && ocupados(outro).some((l) => ocupados(item).includes(l))) novo[lugar] = null;
  }
  novo[item.lugar] = item.id;
  return novo;
}

// Veste o acessório (tirando o que estava no mesmo lugar) ou tira, se já estava vestido.
export function vestir(b, id) {
  const item = ACESSORIOS.find((x) => x.id === id);
  if (!item) return erro('Item desconhecido.');
  if (!b.acessorios.includes(id)) return erro('Compre este primeiro.');
  const tirar = b.vestindo[item.lugar] === id;
  return { bichinho: { ...b, vestindo: tirar ? { ...b.vestindo, [item.lugar]: null } : vestirItem(b.vestindo, item) }, tirou: tirar };
}

// Fantasia ou item que impede este de aparecer (por exemplo, o capacete do astronauta no lugar do chapéu).
export function tiraria(b, id) {
  const item = ACESSORIOS.find((x) => x.id === id);
  if (!item) return [];
  const depois = vestirItem(b.vestindo, item);
  return Object.values(b.vestindo).filter((v) => v && v !== id && !Object.values(depois).includes(v));
}

const faltam = (preco, carteira) => erro(`Faltam ${preco - (carteira.moedas ?? 0)} moedas.`);

export function comprarQuarto(b, carteira, id) {
  const item = QUARTO.find((x) => x.id === id);
  if (!item) return erro('Item desconhecido.');
  if (b.quarto.itens.includes(id)) return erro('Você já tem este.');
  if ((carteira.moedas ?? 0) < item.preco) return faltam(item.preco, carteira);
  return {
    bichinho: { ...b, quarto: { itens: [...b.quarto.itens, id], usando: { ...b.quarto.usando, [item.lugar]: id } } },
    carteira: { ...carteira, moedas: carteira.moedas - item.preco },
  };
}

// Usa o item do quarto (trocando o que estava no lugar) ou guarda, se já estava em uso.
export function usarQuarto(b, id) {
  const item = QUARTO.find((x) => x.id === id);
  if (!item) return erro('Item desconhecido.');
  if (!b.quarto.itens.includes(id)) return erro('Compre este primeiro.');
  const guardar = b.quarto.usando[item.lugar] === id;
  return { bichinho: { ...b, quarto: { ...b.quarto, usando: { ...b.quarto.usando, [item.lugar]: guardar ? null : id } } }, guardou: guardar };
}

export function comprarBrinquedo(b, carteira, id) {
  const item = BRINQUEDOS.find((x) => x.id === id);
  if (!item) return erro('Brinquedo desconhecido.');
  if (b.brinquedos.includes(id)) return erro('Você já tem este.');
  if ((carteira.moedas ?? 0) < item.preco) return faltam(item.preco, carteira);
  return { bichinho: { ...b, brinquedos: [...b.brinquedos, id] }, carteira: { ...carteira, moedas: carteira.moedas - item.preco } };
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
