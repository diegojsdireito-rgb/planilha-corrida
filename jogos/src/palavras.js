// Lista de palavras por tema, usada pelo Caça-Palavras e pelo Adivinhe a Palavra.
// Cada palavra é uma só (sem espaço nem hífen) e vem com acento e com a figurinha.

const t = (id, nome, emoji, lista) => ({
  id, nome, emoji,
  palavras: lista.trim().split(/\s*\n\s*/).map((linha) => { const [palavra, fig] = linha.split(/\s+/); return { palavra, emoji: fig }; }),
});

export const TEMAS = [
  t('frutas', 'Frutas', '🍓', `
    maçã 🍎
    banana 🍌
    uva 🍇
    morango 🍓
    laranja 🍊
    melancia 🍉
    abacaxi 🍍
    pera 🍐
    cereja 🍒
    limão 🍋
    manga 🥭
    pêssego 🍑
    kiwi 🥝
    coco 🥥
    melão 🍈
    mirtilo 🫐
    abacate 🥑`),
  t('animais', 'Animais', '🦁', `
    gato 🐱
    cachorro 🐶
    leão 🦁
    tigre 🐯
    macaco 🐵
    girafa 🦒
    elefante 🐘
    zebra 🦓
    coelho 🐰
    sapo 🐸
    pato 🦆
    vaca 🐮
    porco 🐷
    cavalo 🐴
    urso 🐻
    panda 🐼
    raposa 🦊
    coruja 🦉
    tartaruga 🐢
    pinguim 🐧`),
  t('cores', 'Cores', '🎨', `
    vermelho 🔴
    azul 🔵
    verde 🟢
    amarelo 🟡
    laranja 🟠
    roxo 🟣
    marrom 🟤
    preto ⚫
    branco ⚪
    rosa 🩷
    cinza 🩶
    celeste 🩵
    lilás 💜
    dourado 🥇
    prateado 🥈
    bege 🏜️
    vinho 🍷`),
  t('brinquedos', 'Brinquedos', '🧸', `
    bola ⚽
    boneca 🪆
    pipa 🪁
    ioiô 🪀
    carrinho 🚗
    robô 🤖
    ursinho 🧸
    dado 🎲
    balão 🎈
    tambor 🥁
    trem 🚂
    patinete 🛴
    skate 🛹
    bicicleta 🚲
    foguete 🚀
    blocos 🧱
    peteca 🏸
    corda 🪢`),
  t('escola', 'Escola', '🏫', `
    lápis ✏️
    caneta 🖊️
    livro 📖
    caderno 📓
    régua 📏
    mochila 🎒
    tesoura ✂️
    cola 🧴
    borracha 🧽
    giz 🖍️
    recreio 🛝
    lanche 🥪
    estojo 👝
    mapa 🗺️
    globo 🌍
    clipe 📎
    alfabeto 🔤
    aula 🏫
    calculadora 🧮`),
  t('comidas', 'Comidas', '🍕', `
    pizza 🍕
    bolo 🎂
    pão 🍞
    queijo 🧀
    arroz 🍚
    feijão 🫘
    ovo 🥚
    sorvete 🍦
    pipoca 🍿
    sopa 🍲
    macarrão 🍝
    biscoito 🍪
    chocolate 🍫
    sanduíche 🥪
    salada 🥗
    panqueca 🥞
    mel 🍯
    leite 🥛
    batata 🥔
    cenoura 🥕
    milho 🌽
    hambúrguer 🍔`),
  t('natureza', 'Natureza', '🌳', `
    árvore 🌳
    flor 🌸
    sol ☀️
    lua 🌙
    estrela ⭐
    nuvem ☁️
    chuva 🌧️
    rio 🏞️
    mar 🌊
    montanha ⛰️
    folha 🍃
    pedra 🪨
    areia 🏖️
    vulcão 🌋
    floresta 🌲
    cogumelo 🍄
    neve ❄️
    vento 🌬️
    cacto 🌵
    raio ⚡
    planeta 🪐`),
  t('profissoes', 'Profissões', '👩‍🚒', `
    médico 🩺
    bombeiro 🧑‍🚒
    policial 👮
    professor 🧑‍🏫
    cozinheiro 🧑‍🍳
    piloto 🧑‍✈️
    astronauta 🧑‍🚀
    pintor 🧑‍🎨
    dentista 🦷
    carteiro 📬
    cantor 🎤
    fazendeiro 🧑‍🌾
    mecânico 🧑‍🔧
    cientista 🧑‍🔬
    juiz 🧑‍⚖️
    padeiro 🥖
    motorista 🚌
    bailarina 🩰
    mágico 🎩
    pescador 🎣`),
  t('corpo', 'Corpo humano', '💪', `
    olho 👁️
    nariz 👃
    boca 👄
    orelha 👂
    mão ✋
    pé 🦶
    braço 💪
    perna 🦵
    cabelo 💇
    dente 🦷
    língua 👅
    coração ❤️
    cérebro 🧠
    osso 🦴
    dedo ☝️
    unha 💅
    joelho 🦿
    pulmão 🫁
    barriga 🫃
    ombro 🤷`),
  t('transportes', 'Transportes', '🚌', `
    carro 🚗
    ônibus 🚌
    avião ✈️
    barco ⛵
    navio 🚢
    trem 🚆
    moto 🏍️
    bicicleta 🚲
    helicóptero 🚁
    metrô 🚇
    caminhão 🚚
    táxi 🚕
    foguete 🚀
    ambulância 🚑
    trator 🚜
    patinete 🛴
    canoa 🛶
    bonde 🚋`),
  t('casa', 'Coisas da casa', '🏠', `
    cama 🛏️
    sofá 🛋️
    cadeira 🪑
    porta 🚪
    janela 🪟
    chuveiro 🚿
    banheira 🛁
    espelho 🪞
    vaso 🪴
    lâmpada 💡
    relógio ⏰
    televisão 📺
    chave 🔑
    vela 🕯️
    vassoura 🧹
    sabonete 🧼
    escova 🪥
    telefone ☎️
    balde 🪣`),
  t('roupas', 'Roupas', '👕', `
    camisa 👕
    calça 👖
    vestido 👗
    meia 🧦
    sapato 👞
    tênis 👟
    chapéu 👒
    boné 🧢
    luva 🧤
    casaco 🧥
    cachecol 🧣
    bermuda 🩳
    biquíni 👙
    óculos 👓
    coroa 👑
    bota 👢
    sandália 👡
    gravata 👔
    bolsa 👜`),
  t('mar', 'Fundo do mar', '🐠', `
    peixe 🐟
    polvo 🐙
    tubarão 🦈
    baleia 🐳
    golfinho 🐬
    caranguejo 🦀
    lula 🦑
    camarão 🦐
    concha 🐚
    foca 🦭
    lagosta 🦞
    coral 🪸
    alga 🌿
    onda 🌊
    tesouro 💰
    navio 🚢
    sereia 🧜‍♀️`),
];

/** Tira acentos e cedilha e põe em maiúsculas: "Maçã" -> "MACA". */
export function semAcento(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

export const temaPorId = (id) => TEMAS.find((x) => x.id === id);

export function embaralhar(lista, rng = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const sortear = (lista, rng = Math.random) => lista[Math.floor(rng() * lista.length)];
