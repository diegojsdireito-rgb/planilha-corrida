// Corrida dos Cachinhos: corrida sem fim em 3 faixas.
// z é a distância à frente da personagem (0 = onde ela está). Faixas 0, 1 e 2. Alturas em unidades (ela tem ~1,35).
// Obstáculos: cerca (pular), bandeirinhas (deslizar) e carrinho de sorvete (trocar de faixa ou super pulo).
// Na pista: moedas e itens que valem na hora em que são pegos: ímã, tênis de mola (super pulo),
// mochila a jato (id 'maleta', para não perder as melhorias já compradas), escudo, pontos em dobro,
// baú de moedas, foguete (supercarga na hora), skate grátis, patinete grátis, raio (enche a barra da supercarga),
// capa de super-heroína (voa atraindo as moedas) e nave alienígena (um feixe de luz leva a menina
// para dentro de um disco voador, que percorre um trecho pelo alto e a devolve à pista).
// Depois do trecho inicial aparecem também obstáculos em movimento, cada cenário com os seus
// (ônibus na contramão, bicicleta, cachorro, caranguejo, bola de praia, tronco, galho, bola de neve,
// pinguim, jujuba, minhoca de goma, carrinho de bate-bate, bola de algodão-doce, bola de feno,
// camelo, robozinho lunar e meteorito): sempre com aviso antes e sempre com uma passagem possível.

export const LONGE = 70;
const GRAVIDADE = 30;
const PULO = 10.5;
const SUPER_PULO = 1.45; // multiplica a força do pulo
const DESLIZE = 0.7;
const TROCA_DE_FAIXA = 11; // faixas por segundo
const COMPRIMENTO_CARRINHO = 5;
const ALTURA_VOO = 3.6;
export const DURACAO_SKATE = 30;
export const DURACAO_PATINETE = 20;
export const DURACAO_TURBO_PATINETE = 3;
export const PONTOS_MANOBRA = 50; // por volta completa do rodopio no ar
export const TEMPO_VOLTA = 0.42; // segundos no ar para cada volta do rodopio
export const DURACAO_DOBRO = 10;
export const DURACAO_CAPA = 9;
export const DURACAO_NAVE = 11;
export const MOEDAS_BAU = 50;
export const JANELA_ARRANCADA = 6;
// Quem persegue a menina: começa colado nela, fica para trás e volta a chegar perto quando ela tropeça.
export const PERSEGUIDOR = { perto: 0.9, longe: 14, largada: 3, tropeco: 4 }; // segundos do começo em que dá para decolar com a mochila de bônus

// Velocidade: começa em "base" e vai subindo com a distância, sem parar, mas cada vez mais devagar
// (nunca passa de "topo"). Na metade do caminho até o topo ela chega depois de "meia" metros.
const VELOCIDADE = {
  facil: { base: 11, topo: 30, meia: 1500 },
  medio: { base: 13, topo: 36, meia: 1300 },
  dificil: { base: 15, topo: 42, meia: 1100 },
};
export function velocidadeEm(nivel, dist) {
  const c = VELOCIDADE[nivel] ?? VELOCIDADE.medio;
  return c.base + (c.topo - c.base) * (dist / (dist + c.meia));
}
// O contrário: a distância em que a corrida chega a essa velocidade (usada nos testes).
export function distanciaPara(nivel, vel) {
  const c = VELOCIDADE[nivel] ?? VELOCIDADE.medio;
  const f = Math.min(0.999, Math.max(0, (vel - c.base) / (c.topo - c.base)));
  return (c.meia * f) / (1 - f);
}
// A cada tantas unidades de velocidade ganhas, aparece o aviso "mais rápido".
export const DEGRAU_ACELERA = 2;

// Skates: todos protegem de uma batida; cada um tem um efeito a mais enquanto está ativo.
export const SKATES = {
  classico: { nome: 'Skate Clássico', pulo: 1, gravidade: 1, velocidade: 1, moedas: 1 },
  voador: { nome: 'Skate Voador', pulo: 1.3, gravidade: 0.7, velocidade: 1, moedas: 1 },
  supersonico: { nome: 'Skate Supersônico', pulo: 1.1, gravidade: 1, velocidade: 1.22, moedas: 2 },
};

// Patinetes: a menina vai em pé, dando impulso com o pé. Mais rápido que correr, puxa as moedas
// da faixa em que ela está (em qualquer altura) e cada pulo vira uma manobra (rodopio) que vale pontos.
// Aguenta uma batida, como o skate. manobra: multiplica os pontos do rodopio; turbo: o elétrico
// tem um turbo curto (uma vez por passeio) que corre ainda mais e atravessa os obstáculos.
export const PATINETES = {
  classico: { nome: 'Patinete Clássico', velocidade: 1.12, manobra: 1, turbo: false },
  luzes: { nome: 'Patinete Pisca-Pisca', velocidade: 1.15, manobra: 2, turbo: false },
  eletrico: { nome: 'Patinete Elétrico', velocidade: 1.2, manobra: 1, turbo: true },
};

// Duração de cada poder pelo nível comprado na loja (0 a 5).
export const duracao = (nivel = 0) => 8 + nivel * 2;
// dons: o que cada um muda na corrida
const maisTempo = (s) => (s.dom === 'tempo' ? 1.25 : 1);
const maisEnergia = (s) => (s.dom === 'explosao' ? 1.4 : 1);

// Cenários: o escolhido fica fixo; no Passeio troca a cada TRECHO_PASSEIO metros, passando pelos oito
// na ordem da lista (e voltando para a Cidade depois da Lua). Todos ficam liberados desde o começo.
export const CENARIOS_IDS = ['cidade', 'praia', 'floresta', 'neve', 'doces', 'parque', 'deserto', 'lua'];
export const TRECHO_PASSEIO = 500;
export function cenarioDaCorrida(escolha, dist) {
  if (escolha !== 'passeio') return CENARIOS_IDS.includes(escolha) ? escolha : 'cidade';
  return CENARIOS_IDS[Math.floor(Math.max(0, dist) / TRECHO_PASSEIO) % CENARIOS_IDS.length];
}

// cfg.cenario: o cenário escolhido ('cidade'... ou 'passeio'). Sem ele só há obstáculos parados.
export function nova(nivel = 'medio', cfg = {}) {
  const poderes = { ima: 0, pulo: 0, maleta: 0, supercarga: 0, ...(cfg.poderes ?? {}) };
  const dom = cfg.dom ?? null;
  return {
    nivel, t: 0, dist: 0, vel: VELOCIDADE[nivel].base, cenario: cfg.cenario ?? null, reserva: null,
    faixa: 1, x: 1, y: 0, vy: 0, deslizando: 0,
    moedas: 0, objetos: [], ultimaLinha: 0,
    ima: dom === 'ima' ? 10 : 0, superPulo: 0, voo: 0, vooTipo: 'mochila', supercarga: 0, energia: dom === 'turbo' ? 0.6 : 0, escudo: dom === 'escudo', invencivel: 0, dobro: 0, bonus: 0,
    arrancadas: cfg.arrancadas ?? 0,
    skate: 0, skateTipo: SKATES[cfg.skate] ? cfg.skate : 'classico', cargas: cfg.cargas ?? 0,
    patinete: 0, patineteTipo: PATINETES[cfg.patinete] ? cfg.patinete : 'classico', cargasPatinete: cfg.cargasPatinete ?? 0,
    turboPatinete: 0, turboUsado: false, manobra: null, pontosManobra: 0, patineteSaiu: null,
    poderes,
    // dom do personagem escolhido (cada um da turma tem o seu)
    dom: cfg.dom ?? null, puloNoAr: false,
    vivo: true, eventos: ['perseguidor'],
    perseguidor: { dist: PERSEGUIDOR.perto, perto: PERSEGUIDOR.largada },
    contagem: { pulos: 0, deslizes: 0, maletas: 0, supercargas: 0, skates: 0, superPulos: 0, arrancadas: 0, itens: 0, cargasUsadas: 0, capas: 0, naves: 0,
      patinetes: 0, cargasPatineteUsadas: 0, manobras: 0, metrosPatinete: 0, turbosPatinete: 0 },
  };
}

// Distância mínima entre linhas: dá tempo de reagir mesmo em alta velocidade.
export const intervalo = (vel) => Math.max(12, vel * 0.95);

// Altura máxima do pulo normal e quanto tempo ele dura no ar.
export const APICE_PULO = (PULO * PULO) / (2 * GRAVIDADE);
export const TEMPO_PULO = (2 * PULO) / GRAVIDADE;

// Arco de moedas por cima de uma cerca: segue a curva exata do pulo normal na velocidade atual,
// com o ponto mais alto em cima da cerca. Quem pula para passar a cerca pega o arco inteiro.
export function arcoDeMoedas(faixa, z, vel = 13, n = 7) {
  const metade = (vel * TEMPO_PULO) / 2; // metade do caminho que ela percorre no ar
  return Array.from({ length: n }, (_, k) => {
    const u = -0.8 + (1.6 * k) / (n - 1); // de 80% antes a 80% depois do ponto mais alto
    return { tipo: 'moeda', faixa, z: z + u * metade, h: 0.6 + APICE_PULO * (1 - u * u) };
  });
}

const fileira = (faixa, z, n, h = 0.5, passo = 1.6) => Array.from({ length: n }, (_, k) => ({ tipo: 'moeda', faixa, z: z + k * passo, h }));

// Uma linha de obstáculos. Garante pelo menos uma faixa sem carrinho e nunca mais de um carrinho.
// evitar: faixa que precisa ficar vazia (reservada para um obstáculo na contramão que vem aí).
export function gerarLinha(z, aleatorio = Math.random, dist = 0, voando = false, vel = 13, evitar = null) {
  const r = aleatorio;
  if (voando) {
    // no ar não há obstáculos: só uma trilha de moedas lá em cima
    return fileira(Math.floor(r() * 3), z, 7, ALTURA_VOO + 0.6, 1.4);
  }
  const objetos = [];
  const tipos = ['cerca', 'faixa', 'carrinho'];
  const sorteio = r();
  let faixas = [0, 1, 2].sort(() => r() - 0.5);
  let bloqueadas;
  if (dist < 60) bloqueadas = sorteio < 0.5 ? 0 : 1; // começo tranquilo
  else bloqueadas = sorteio < 0.12 ? 0 : sorteio < 0.55 ? 1 : sorteio < 0.9 ? 2 : 3;
  if (evitar !== null && evitar !== undefined) {
    // a faixa reservada vai por último, sempre livre e sem moedas
    faixas = [...faixas.filter((f) => f !== evitar), evitar];
    bloqueadas = Math.min(bloqueadas, 2);
  }
  let carrinhos = 0;
  for (let k = 0; k < bloqueadas; k++) {
    let tipo = tipos[Math.floor(r() * 3)];
    if (tipo === 'carrinho' && (carrinhos >= 1 || bloqueadas === 3)) tipo = r() < 0.5 ? 'cerca' : 'faixa';
    if (tipo === 'carrinho') carrinhos++;
    objetos.push({ tipo, faixa: faixas[k], z, comp: tipo === 'carrinho' ? COMPRIMENTO_CARRINHO : 0.4 });
  }
  const livres = faixas.slice(bloqueadas).filter((f) => f !== evitar);
  const cerca = objetos.find((o) => o.tipo === 'cerca');
  if (cerca && r() < 0.35) {
    // arco de moedas por cima da cerca
    objetos.push(...arcoDeMoedas(cerca.faixa, z, vel));
  } else if (livres.length && r() < 0.85) {
    objetos.push(...fileira(livres[Math.floor(r() * livres.length)], z, 3 + Math.floor(r() * 5)));
  }
  if (livres.length && dist > 120 && r() < 0.14) {
    objetos.push({ tipo: sortearItem(r()), faixa: livres[livres.length - 1], z: z + 0.5, h: 0.7 });
  }
  return objetos;
}

// Itens da pista, com a chance de cada um aparecer (somam 1).
export const ITENS = [
  ['raio', 0.15], ['ima', 0.12], ['pulo', 0.11], ['escudo', 0.1], ['maleta', 0.1],
  ['dobro', 0.09], ['bau', 0.09], ['turbo', 0.06], ['prancha', 0.03], ['patinete', 0.04], ['capa', 0.06], ['nave', 0.05],
];
export function sortearItem(x) {
  let soma = 0;
  for (const [tipo, chance] of ITENS) { soma += chance; if (x < soma) return tipo; }
  return 'raio';
}

// ---------- Obstáculos em movimento ----------
// Cada cenário tem os seus. Todos se movem de um jeito que depende só da distância até a menina (z),
// então chegam sempre do mesmo jeito, em qualquer velocidade, e o aviso mostra desde o começo
// a faixa em que cada um vai estar quando chegar nela ("destino").
// passa: como se passa por ele na chegada ('pular', 'deslizar' ou 'desviar' = trocar de faixa).
// contramao: vem na direção dela, mais rápido que a corrida (só numa faixa reservada e vazia).
export const INICIO_MOVEIS = 300; // metros de corrida sem nenhum obstáculo em movimento
export const AVISO_MIN = 1.2; // segundos, no mínimo, entre o aviso aparecer e o obstáculo chegar
const AVISO_CONTRAMAO = 1.8; // quanto tempo o ônibus e a bola de neve levam para chegar, se der
const METROS_FAIXA = 1.6; // largura de uma faixa em metros (a mesma do 3D)
export const GALHO = { pivo: 3.3, haste: 2.05, raio: 0.38, amplitude: 0.8, periodo: 16 };

// jeito: como ele se move (atravessa, vaivem, troca, quica, pendulo, contramao ou cresce).
export const MOVEIS = {
  onibus: { cenario: 'cidade', jeito: 'contramao', comp: 6, larg: 0.55, passa: 'desviar', contramao: true, altura: 2.1 },
  bicicleta: { cenario: 'cidade', jeito: 'troca', comp: 1.5, larg: 0.5, passa: 'desviar', vz: -2.5, altura: 1.7, zTroca: 20, troca: 10 },
  cachorro: { cenario: 'cidade', jeito: 'atravessa', comp: 0.5, larg: 0.42, passa: 'pular', altura: 0.6, k: 0.13, borda: 1.35 },
  caranguejo: { cenario: 'praia', jeito: 'vaivem', comp: 0.5, larg: 0.42, passa: 'pular', altura: 0.45 },
  bola: { cenario: 'praia', jeito: 'quica', comp: 0.84, larg: 0.42, raio: 0.42 },
  tronco: { cenario: 'floresta', jeito: 'atravessa', comp: 1.8, larg: 0.42, passa: 'pular', altura: 0.6, k: 0.06, borda: 0.95 },
  galho: { cenario: 'floresta', jeito: 'pendulo', comp: 0.5, larg: 0.42, passa: 'deslizar' },
  boladeneve: { cenario: 'neve', jeito: 'cresce', comp: 1.9, larg: 0.55, passa: 'desviar', contramao: true },
  pinguim: { cenario: 'neve', jeito: 'troca', comp: 0.9, larg: 0.45, passa: 'pular', altura: 0.5, zTroca: 18, troca: 14, longe: true },
  // Terra dos Doces: jujuba quicando (como a bola de praia) e minhoca de goma atravessando
  jujuba: { cenario: 'doces', jeito: 'quica', comp: 0.84, larg: 0.42, raio: 0.42 },
  minhoca: { cenario: 'doces', jeito: 'atravessa', comp: 0.45, larg: 0.45, passa: 'pular', altura: 0.45, k: 0.1, borda: 1.4 },
  // Parque de Diversões: carrinho de bate-bate trocando de faixa e bola de algodão-doce rolando na contramão
  batebate: { cenario: 'parque', jeito: 'troca', comp: 1.3, larg: 0.48, passa: 'pular', altura: 0.55, zTroca: 18, troca: 12, longe: true },
  algodao: { cenario: 'parque', jeito: 'contramao', comp: 1.5, larg: 0.55, passa: 'desviar', contramao: true, altura: 1.5, raio: 0.75 },
  // Deserto do Oásis: bola de feno rolando de lado e camelo trocando de faixa
  feno: { cenario: 'deserto', jeito: 'atravessa', comp: 0.7, larg: 0.42, passa: 'pular', altura: 0.6, k: 0.09, borda: 1.2 },
  camelo: { cenario: 'deserto', jeito: 'troca', comp: 1.6, larg: 0.5, passa: 'desviar', altura: 2.2, zTroca: 22, troca: 14 },
  // Passeio na Lua: robozinho lunar trocando de faixa e meteorito quicando devagar
  robo: { cenario: 'lua', jeito: 'troca', comp: 0.9, larg: 0.45, passa: 'pular', altura: 0.55, zTroca: 18, troca: 14, longe: true },
  meteorito: { cenario: 'lua', jeito: 'quica', comp: 0.9, larg: 0.42, raio: 0.45 },
};
export const ehObstaculo = (o) => o.movel || o.tipo === 'cerca' || o.tipo === 'faixa' || o.tipo === 'carrinho';
export const comoPassar = (o) => (MOVEIS[o.tipo]?.jeito === 'quica' ? (o.modo === 'alto' ? 'deslizar' : 'pular') : MOVEIS[o.tipo]?.passa);

// Chance de uma linha nova trazer um obstáculo em movimento: zero no trecho inicial e,
// depois, sobe junto com a velocidade da corrida.
export function chanceMovel(nivel, dist) {
  if (dist < INICIO_MOVEIS) return 0;
  const c = VELOCIDADE[nivel] ?? VELOCIDADE.medio;
  const f = (velocidadeEm(nivel, dist) - c.base) / (c.topo - c.base);
  return Math.min(0.32, 0.08 + 0.3 * f);
}

const suave = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const limitar = (x, a, b) => Math.min(b, Math.max(a, x));

// Coloca o obstáculo onde ele deve estar a essa distância (z) da menina.
export function posicionar(o) {
  const z = o.z;
  const def = MOVEIS[o.tipo];
  switch (def?.jeito) {
    case 'atravessa': {
      // atravessa a pista de lado e passa pela faixa de destino bem quando chega na menina
      const borda = def.borda;
      o.faixa = limitar(o.destino - o.dir * o.k * (z + o.comp / 2), -borda, 2 + borda);
      o.andando = o.faixa > -borda && o.faixa < 2 + borda;
      break;
    }
    case 'vaivem':
      // anda de lado, para lá e para cá, entre duas faixas vizinhas
      o.faixa = o.base + 0.5 + 0.5 * Math.cos((2 * Math.PI * (z + o.comp / 2)) / o.periodo + o.fase);
      break;
    case 'troca': {
      // troca de faixa entre zTroca + troca e zTroca; a bicicleta pisca a setinha antes
      const u = suave((o.zTroca + o.troca - z) / o.troca);
      o.faixa = o.origem + (o.destino - o.origem) * u;
      o.pisca = u < 1;
      o.trocando = u > 0 && u < 1;
      break;
    }
    case 'quica': {
      // quica: o ponto mais alto (modo 'alto') ou um quiquinho baixo ('baixo') cai bem na chegada
      const zc = z + o.raio;
      o.faixa = o.destino + o.dir * limitar((zc - 8) / 26, 0, 1);
      o.h = o.raio + o.salto * Math.abs(Math.cos((Math.PI * zc) / o.periodo));
      break;
    }
    case 'pendulo':
      // pêndulo pendurado no meio da faixa de destino, balançando de um lado para o outro
      o.angulo = GALHO.amplitude * Math.sin((2 * Math.PI * (z + o.comp / 2)) / GALHO.periodo + o.fase);
      o.faixa = o.destino;
      o.bolaX = o.destino - (GALHO.haste * Math.sin(o.angulo)) / METROS_FAIXA;
      o.h = GALHO.pivo - GALHO.haste * Math.cos(o.angulo);
      break;
    case 'cresce':
      // rola na direção dela e vai crescendo
      o.raio = 0.35 + 0.6 * limitar(1 - z / LONGE, 0, 1);
      o.comp = 2 * o.raio;
      break;
    default:
  }
  return o;
}

// Cria um obstáculo em movimento a z metros. opcoes.destino fixa a faixa de chegada; opcoes.vz,
// a velocidade própria (na contramão); opcoes.modo, o jeito da bola de praia ('alto' ou 'baixo').
export function criarMovel(tipo, z, aleatorio = Math.random, vel = 13, opcoes = {}) {
  const r = aleatorio;
  const def = MOVEIS[tipo];
  const destino = opcoes.destino ?? Math.floor(r() * 3);
  const o = { tipo, movel: true, z, comp: def.comp, larg: def.larg, destino, faixa: destino, vz: def.vz ?? 0, nasceu: z };
  if (def.contramao) o.vz = opcoes.vz ?? limitar(LONGE / AVISO_CONTRAMAO - vel, 3, 12);
  if (def.raio) o.raio = def.raio;
  if (def.jeito === 'atravessa') {
    o.dir = opcoes.dir ?? (destino === 0 ? 1 : destino === 2 ? -1 : r() < 0.5 ? 1 : -1);
    o.k = def.k; // faixas por metro
  } else if (def.jeito === 'vaivem') {
    o.base = destino === 0 ? 0 : destino === 2 ? 1 : r() < 0.5 ? 0 : 1;
    o.fase = destino === o.base + 1 ? 0 : Math.PI;
    o.periodo = 9;
  } else if (def.jeito === 'troca') {
    // alguns vêm de duas faixas de distância (o pinguim, o bate-bate e o robozinho)
    const longe = def.longe && destino !== 1 && r() < 0.4;
    const opc = [0, 1, 2].filter((f) => Math.abs(f - destino) === (longe ? 2 : 1));
    o.origem = opcoes.origem ?? opc[Math.floor(r() * opc.length)];
    o.zTroca = def.zTroca;
    o.troca = def.troca;
  } else if (def.jeito === 'quica') {
    o.modo = opcoes.modo ?? (r() < 0.55 ? 'alto' : 'baixo');
    o.salto = o.modo === 'alto' ? 1.15 : 0.18;
    o.periodo = o.modo === 'alto' ? 12 : 3;
    const lados = [-1, 1].filter((d) => destino + d >= 0 && destino + d <= 2);
    o.dir = lados[Math.floor(r() * lados.length)];
  } else if (def.jeito === 'pendulo') {
    o.fase = opcoes.fase ?? r() * Math.PI * 2;
  }
  return posicionar(o);
}

// Faixas por onde o obstáculo passa em algum momento do caminho (para as moedas não ficarem nelas).
export function faixasDoTrajeto(o) {
  const c = { ...o };
  const tocadas = new Set();
  for (let z = o.z; z > -3; z -= 0.5) {
    c.z = z; posicionar(c);
    const x = c.tipo === 'galho' ? c.bolaX : c.faixa;
    for (const f of [0, 1, 2]) if (Math.abs(x - f) < c.larg + 0.15) tocadas.add(f);
  }
  return tocadas;
}

// Uma linha só com o obstáculo em movimento (e moedas onde ele nunca passa, ou um arco por cima dele).
function linhaMovel(tipo, z, r, vel) {
  const o = criarMovel(tipo, z, r, vel);
  const objetos = [o];
  const livres = [0, 1, 2].filter((f) => !faixasDoTrajeto(o).has(f));
  const meio = z + o.comp / 2;
  if (comoPassar(o) === 'pular' && r() < 0.5) objetos.push(...arcoDeMoedas(o.destino, meio, vel));
  else if (tipo === 'galho' && r() < 0.6) objetos.push(...fileira(o.destino, meio - 1.9, 4, 0.45, 1.3)); // por baixo, deslizando
  else if (livres.length && r() < 0.8) objetos.push(...fileira(livres[Math.floor(r() * livres.length)], z, 3 + Math.floor(r() * 4)));
  return objetos;
}

// Na hora de uma linha nova: às vezes sorteia um obstáculo em movimento do cenário atual.
// Os da contramão primeiro reservam uma faixa e só entram quando ela estiver vazia.
function sortearMovel(s, r) {
  if (!s.cenario || s.reserva || s.dist < INICIO_MOVEIS || s.objetos.some((o) => o.movel)) return null;
  const tema = cenarioDaCorrida(s.cenario, s.dist);
  if (tema !== cenarioDaCorrida(s.cenario, s.dist + LONGE + 30)) return null; // perto da troca de cenário, não
  if (r() >= chanceMovel(s.nivel, s.dist)) return null;
  const lista = Object.keys(MOVEIS).filter((k) => MOVEIS[k].cenario === tema);
  const tipo = lista[Math.floor(r() * lista.length)];
  if (MOVEIS[tipo].contramao) { s.reserva = { tipo, faixa: Math.floor(r() * 3), desde: s.t }; return null; }
  return tipo;
}

// O da contramão entra quando a faixa reservada esvaziou e escolhe a própria velocidade para
// chegar na menina num vão entre as linhas de obstáculos (nunca junto com outra linha).
function soltarContramao(s, r, turbo) {
  const { tipo, faixa } = s.reserva;
  if (s.t - s.reserva.desde > 10) { s.reserva = null; return; }
  if (s.objetos.some((o) => Math.abs(o.faixa - faixa) < 0.6 && o.z + (o.comp ?? 0) > -1)) return;
  const v = s.vel;
  const comp = MOVEIS[tipo].comp;
  const folga = 0.3; // segundos
  const janelas = s.objetos.filter(ehObstaculo).map((o) => [(o.z - 0.45) / v, (o.z + (o.comp ?? 0.4) + 0.45) / v]);
  const maior = Math.max(3, Math.min(12, LONGE / AVISO_CONTRAMAO - v));
  for (let vz = maior; vz >= 3; vz -= 0.5) {
    const chega = (LONGE - 0.45) / (v + vz);
    const sai = (LONGE + comp + 0.45) / (v + vz);
    if (janelas.some(([a, b]) => !(sai + folga <= a || b + folga <= chega))) continue;
    s.objetos.push(criarMovel(tipo, LONGE, r, v, { destino: faixa, vz }));
    s.eventos.push(`alerta:${tipo}`);
    s.reserva = null;
    // a próxima linha só chega depois que ele passou
    s.ultimaLinha = Math.max(s.ultimaLinha, v * (sai + folga) - intervalo(v / turbo) + 0.45);
    return;
  }
}

const skateAtivo = (s) => (s.skate > 0 ? SKATES[s.skateTipo] : null);
export const patineteAtivo = (s) => (s.patinete > 0 ? PATINETES[s.patineteTipo] : null);

// Sobe no patinete (da pista ou gastando uma carga). Quem estava de skate desce dele: um veículo de cada vez.
function subirNoPatinete(s) {
  if (s.patinete <= 0) { s.contagem.patinetes++; s.turboUsado = false; }
  s.patinete = DURACAO_PATINETE;
  s.patineteSaiu = null;
  if (s.skate > 0) s.skate = 0;
  s.eventos.push('patinete');
}

// Fim do passeio de patinete: na batida ele sai rodopiando; no fim do tempo, some num brilho.
function descerDoPatinete(s, como) {
  s.patinete = 0;
  s.turboPatinete = 0;
  s.manobra = null;
  s.patineteSaiu = { como, t: s.t, x: s.x, y: s.y };
  s.eventos.push(como === 'batida' ? 'patinete-quebrou' : 'patinete-fim');
}

// Quantas voltas cabem num pulo, pelo tempo que ela vai ficar no ar.
export const voltasDoPulo = (tempoNoAr) => Math.max(1, Math.min(3, Math.floor(tempoNoAr / TEMPO_VOLTA)));

export function comando(s, acao) {
  if (!s.vivo) return;
  if (acao === 'esquerda' && s.faixa > 0) { s.faixa--; s.eventos.push('troca'); }
  else if (acao === 'direita' && s.faixa < 2) { s.faixa++; s.eventos.push('troca'); }
  else if (acao === 'pular' && s.voo <= 0 && (s.y <= 0.001 || (s.dom === 'saltoDuplo' && !s.puloNoAr))) {
    if (s.y > 0.001) s.puloNoAr = true; // salto duplo: um pulo a mais no ar
    const sk = skateAtivo(s);
    const forte = s.superPulo > 0 || s.supercarga > 0;
    s.vy = PULO * (forte ? SUPER_PULO : 1) * (sk?.pulo ?? 1) * (s.dom === 'superpulo' ? 1.15 : s.dom === 'agil' ? 1.05 : 1);
    s.deslizando = 0;
    if (s.patinete > 0) {
      // de patinete, todo pulo vira manobra: o rodopio dura o tempo que ela fica no ar
      const g = GRAVIDADE * (sk?.gravidade ?? 1);
      const dur = (s.vy + Math.sqrt(s.vy * s.vy + 2 * g * s.y)) / g;
      const antes = s.manobra ? s.manobra.voltas : 0; // salto duplo: o rodopio continua e ganha voltas
      s.manobra = { voltas: antes + voltasDoPulo(dur), dur: (s.manobra?.t ?? 0) + dur, t: s.manobra?.t ?? 0 };
      s.eventos.push('manobra-inicio');
    }
    s.contagem.pulos++;
    if (forte) s.contagem.superPulos++;
    s.eventos.push(forte ? 'superpulo' : 'pulo');
  } else if (acao === 'deslizar' && s.voo <= 0) {
    if (s.y > 0.001) s.vy = -PULO * 1.6; // desce rápido e já desliza
    if (s.manobra) s.manobra.falhou = true; // desceu antes de completar o rodopio: não vale
    s.deslizando = DESLIZE;
    s.contagem.deslizes++;
    s.eventos.push('desliza');
  } else if (acao === 'skate' && s.skate <= 0 && s.cargas > 0) {
    s.cargas--;
    s.skate = DURACAO_SKATE;
    s.contagem.skates++;
    s.contagem.cargasUsadas++;
    s.eventos.push('skate');
    if (s.patinete > 0) descerDoPatinete(s, 'troca');
  } else if (acao === 'patinete' && s.patinete <= 0 && s.cargasPatinete > 0 && s.voo <= 0) {
    s.cargasPatinete--;
    s.contagem.cargasPatineteUsadas++;
    subirNoPatinete(s);
  } else if (acao === 'turbo-patinete' && s.patinete > 0 && PATINETES[s.patineteTipo].turbo && !s.turboUsado && s.voo <= 0) {
    // turbo do patinete elétrico: uma vez por passeio
    s.turboUsado = true;
    s.turboPatinete = DURACAO_TURBO_PATINETE;
    s.contagem.turbosPatinete++;
    s.eventos.push('turbo-patinete');
  } else if (acao === 'arrancada' && s.arrancadas > 0 && s.t <= JANELA_ARRANCADA && s.voo <= 0) {
    // bônus de largada: começa voando com a mochila a jato, por mais tempo que a da pista
    s.arrancadas--;
    s.contagem.arrancadas++;
    voar(s, duracao(s.poderes.maleta) * maisTempo(s) + 4);
  } else if (acao === 'supercarga' && s.energia >= 1 && s.supercarga <= 0) {
    s.energia = 0;
    s.supercarga = duracao(s.poderes.supercarga) * 0.6 * maisTempo(s);
    s.contagem.supercargas++;
    s.eventos.push('supercarga');
  }
}

export function colide(s, o) {
  if (o.movel) return colideMovel(s, o);
  if (Math.abs(o.faixa - s.x) > 0.55) return false;
  const frente = o.z;
  const tras = o.z + (o.comp ?? 0);
  if (frente > 0.45 || tras < -0.45) return false;
  if (o.tipo === 'cerca') return s.y < 0.6;
  if (o.tipo === 'faixa') return s.y < 2.0 && !(s.deslizando > 0 && s.y < 0.2);
  return s.y < 1.25; // carrinho (1,25 de altura): só passa por cima com super pulo
}

function colideMovel(s, o) {
  const x = o.tipo === 'galho' ? o.bolaX : o.faixa;
  if (Math.abs(x - s.x) > o.larg) return false;
  // passo: quanto ele andou neste quadro (os da contramão são rápidos e não podem atravessá-la)
  if (o.z > 0.45 || o.z + o.comp < -0.45 - (o.passo ?? 0)) return false;
  const deitada = s.deslizando > 0 && s.y < 0.2;
  const topo = s.y + (deitada ? 0.55 : 1.4);
  if (MOVEIS[o.tipo].jeito === 'quica') return topo > o.h - o.raio + 0.12 && s.y < o.h + o.raio - 0.12;
  if (o.tipo === 'galho') return topo > o.h - GALHO.raio + 0.08 && s.y < o.h + GALHO.raio;
  if (o.tipo === 'boladeneve') return s.y < 2 * o.raio - 0.1;
  return s.y < MOVEIS[o.tipo].altura;
}

export function avancar(s, dt, aleatorio = Math.random) {
  if (!s.vivo) return s;
  dt = Math.min(dt, 0.05);
  const sk = skateAtivo(s);
  s.t += dt;
  const pt = s.voo > 0 ? null : patineteAtivo(s); // voando, o patinete fica guardado
  const turbo = (s.supercarga > 0 ? 1.4 : 1) * (s.voo > 0 && s.vooTipo === 'nave' ? 1.25 : 1) * (s.turboPatinete > 0 ? 1.3 : 1);
  const corrida = velocidadeEm(s.nivel, s.dist);
  const degrau = Math.floor((corrida - VELOCIDADE[s.nivel].base) / DEGRAU_ACELERA);
  if (degrau > (s.degrau ?? 0)) { s.degrau = degrau; s.eventos.push('acelera'); }
  s.vel = corrida * turbo * (sk?.velocidade ?? 1) * (pt?.velocidade ?? 1);
  const dz = s.vel * dt;
  s.dist += dz;
  if (s.dobro > 0) s.bonus += dz;
  if (pt) s.contagem.metrosPatinete += dz;

  // personagem
  const passo = TROCA_DE_FAIXA * dt * (s.dom === 'desvio' ? 1.6 : s.dom === 'agil' ? 1.25 : 1);
  s.x = Math.abs(s.faixa - s.x) <= passo ? s.faixa : s.x + Math.sign(s.faixa - s.x) * passo;
  if (s.voo > 0) {
    s.y += (ALTURA_VOO - s.y) * Math.min(1, dt * 4);
    s.vy = 0;
  } else if (s.y > 0 || s.vy > 0) {
    s.vy -= GRAVIDADE * (sk?.gravidade ?? 1) * dt;
    s.y = Math.max(0, s.y + s.vy * dt);
    if (s.y === 0) { s.vy = 0; s.puloNoAr = false; s.eventos.push('pouso'); pousarManobra(s); }
  }
  if (s.manobra) s.manobra.t += dt;
  const voava = s.voo > 0;
  const carregada = s.supercarga > 0;
  s.deslizando = Math.max(0, s.deslizando - dt);
  for (const k of ['ima', 'superPulo', 'voo', 'supercarga', 'invencivel', 'dobro']) {
    const antes = s[k];
    s[k] = Math.max(0, s[k] - dt);
    if (antes > 0 && s[k] === 0 && ['ima', 'superPulo', 'supercarga', 'dobro'].includes(k)) s.eventos.push('poder-fim');
  }
  if (carregada && s.supercarga === 0 && s.voo <= 0 && s.y > 0.05) {
    // a supercarga acabou no meio de um super pulo: fica protegida até pousar e mais um pouquinho,
    // para não cair em cima de algo que ela não tinha como ver chegando
    const g = GRAVIDADE * (skateAtivo(s)?.gravidade ?? 1);
    s.invencivel = Math.max(s.invencivel, (s.vy + Math.sqrt(s.vy * s.vy + 2 * g * s.y)) / g + 0.5);
  }
  if (voava && s.voo === 0) {
    s.vy = 0;
    s.invencivel = Math.max(s.invencivel, 1.2);
    if (s.vooTipo === 'nave') { s.y = 0; s.eventos.push('teletransporte'); } // o feixe a devolve direto ao chão
    else s.eventos.push(s.vooTipo === 'capa' ? 'pouso-heroi' : 'pouso-jato');
    s.vooTipo = 'mochila';
  }
  if (s.skate > 0) {
    s.skate = Math.max(0, s.skate - dt);
    if (s.skate === 0) s.eventos.push('skate-fim');
  }
  if (pt) {
    // o tempo do patinete só corre com ele no chão da pista (voando, ele espera guardado)
    s.turboPatinete = Math.max(0, s.turboPatinete - dt);
    s.patinete = Math.max(0, s.patinete - dt);
    if (s.patinete === 0) descerDoPatinete(s, 'tempo');
  }

  // supercarga: liga sozinha quando a barra enche (o jogo é só por gestos, sem botão)
  if (s.energia >= 1 && s.supercarga <= 0) comando(s, 'supercarga');

  // quem persegue: chega perto (rápido) ou fica para trás (devagar)
  const p = s.perseguidor;
  p.perto = Math.max(0, p.perto - dt);
  const alvo = p.perto > 0 ? PERSEGUIDOR.perto : PERSEGUIDOR.longe;
  p.dist += (alvo - p.dist) * Math.min(1, dt * (alvo < p.dist ? 3 : 0.5));

  // mundo
  for (const o of s.objetos) {
    o.z -= dz;
    if (o.movel) {
      o.z -= o.vz * dt;
      o.passo = dz + o.vz * dt;
      posicionar(o);
    }
    if (s.ima > 0 && o.tipo === 'moeda' && o.z < 10 && o.z > -1) {
      o.faixa += (s.x - o.faixa) * Math.min(1, dt * 10);
      o.h += (s.y + 0.6 - o.h) * Math.min(1, dt * 10);
    } else if (pt && o.tipo === 'moeda' && o.z < 8 && o.z > -1 && Math.abs(o.faixa - s.x) < 0.5) {
      // de patinete: as moedas da faixa dela descem (ou sobem) até a mão
      o.h += (s.y + 0.6 - o.h) * Math.min(1, dt * 8);
    }
  }
  s.objetos = s.objetos.filter((o) => o.z + (o.comp ?? 0) > -6 && !o.pego && !o.quebrado);
  s.ultimaLinha -= dz;
  if (s.ultimaLinha <= LONGE - intervalo(s.vel / turbo)) {
    const voando = s.voo > 1.5;
    const movel = voando ? null : sortearMovel(s, aleatorio);
    s.ultimaLinha = LONGE;
    if (movel) {
      s.objetos.push(...linhaMovel(movel, LONGE, aleatorio, s.vel));
      s.eventos.push(`alerta:${movel}`);
      const vz = MOVEIS[movel].vz ?? 0;
      if (vz < 0) {
        // a bicicleta anda para a frente: a linha seguinte espera para não alcançá-la
        const v = velocidadeEm(s.nivel, s.dist);
        s.ultimaLinha += (-vz * (LONGE + 6)) / Math.max(4, v + vz) + MOVEIS[movel].comp + 2;
      }
    } else s.objetos.push(...gerarLinha(LONGE, aleatorio, s.dist, voando, s.vel, s.reserva?.faixa ?? null));
  }
  if (s.reserva && s.voo <= 0) soltarContramao(s, aleatorio, turbo);

  // coletas e batidas
  for (const o of s.objetos) {
    if (!ehObstaculo(o)) {
      // a moeda conta se passou por ela neste quadro (mesmo num celular lento, que anda mais de uma vez por quadro)
      if (o.z < 0.7 && o.z > -0.7 - dz && Math.abs(o.faixa - s.x) < 0.6 && Math.abs((o.h ?? 0) - (s.y + 0.6)) < 1.1) {
        o.pego = true;
        coletar(s, o);
      }
      continue;
    }
    if (o.atingido || !colide(s, o)) continue;
    o.atingido = true;
    if (s.supercarga > 0 || s.turboPatinete > 0) { o.quebrado = true; s.eventos.push('quebra'); continue; } // a supercarga e o turbo atravessam
    if (s.invencivel > 0) continue;
    if (s.escudo || s.skate > 0 || s.patinete > 0) tropecar(s);
    if (s.escudo) {
      s.escudo = false;
      s.invencivel = 1.2;
      s.eventos.push('escudo');
    } else if (s.patinete > 0) {
      descerDoPatinete(s, 'batida');
      s.invencivel = 1.5;
    } else if (s.skate > 0) {
      s.skate = 0;
      s.invencivel = 1.5;
      s.eventos.push('skate-quebrou');
    } else {
      s.vivo = false;
      s.eventos.push('batida');
      break;
    }
  }
  return s;
}

// Pousou: se o rodopio completou, a manobra vale pontos (o Pisca-Pisca vale o dobro).
function pousarManobra(s) {
  const m = s.manobra;
  s.manobra = null;
  if (!m || m.falhou || s.patinete <= 0 || m.t < m.dur * 0.8) return;
  const ganho = PONTOS_MANOBRA * m.voltas * PATINETES[s.patineteTipo].manobra;
  s.pontosManobra += ganho;
  s.ultimaManobra = { voltas: m.voltas, pontos: ganho, t: s.t };
  s.contagem.manobras++;
  s.eventos.push('manobra');
}

function tropecar(s) {
  s.perseguidor.perto = PERSEGUIDOR.tropeco;
  s.eventos.push('perseguidor');
}

// Depois da batida: quem persegue alcança a menina (só para a animação do fim).
export function alcancar(s, dt) {
  s.perseguidor.dist = Math.max(0.35, s.perseguidor.dist - dt * 8);
  return s.perseguidor.dist <= 0.36;
}

function voar(s, segundos, tipo = 'mochila') {
  s.voo = segundos;
  s.vooTipo = tipo;
  s.deslizando = 0;
  s.manobra = null;
  s.turboPatinete = 0;
  if (tipo === 'capa') {
    s.contagem.capas++;
    s.ima = Math.max(s.ima, segundos); // a super-heroína puxa as moedas para perto
  } else if (tipo === 'nave') {
    s.contagem.naves++;
    s.ima = Math.max(s.ima, segundos); // o raio trator da nave puxa as moedas
    s.y = ALTURA_VOO; // teletransportada: já aparece lá em cima, dentro da nave
  } else s.contagem.maletas++;
  // tira da frente os obstáculos que já estavam perto: ela decola por cima deles
  s.objetos = s.objetos.filter((x) => x.z < 2 || !ehObstaculo(x));
  s.reserva = null; // o da contramão que ia entrar fica para outra vez
  s.eventos.push({ mochila: 'decolar', capa: 'heroi', nave: 'teletransporte' }[tipo]);
}

function coletar(s, o) {
  const sk = skateAtivo(s);
  const d = (nome) => duracao(s.poderes[nome]) * maisTempo(s);
  if (o.tipo !== 'moeda') s.contagem.itens++;
  switch (o.tipo) {
    case 'moeda':
      s.moedas += (sk?.moedas ?? 1) + (s.dom === 'coleta' && (s.moedasVistas = (s.moedasVistas ?? 0) + 1) % 4 === 0 ? 1 : 0); // coleta extra: uma moeda a mais a cada quatro
      s.energia = Math.min(1, s.energia + 0.006 * maisEnergia(s));
      s.eventos.push('moeda');
      break;
    case 'raio':
      s.energia = Math.min(1, s.energia + 0.34 * maisEnergia(s));
      s.eventos.push(s.energia >= 1 ? 'carga-cheia' : 'raio');
      break;
    case 'ima': s.ima = d('ima'); s.eventos.push('poder'); break;
    case 'pulo': s.superPulo = d('pulo'); s.eventos.push('poder'); break;
    case 'maleta': voar(s, d('maleta') * 0.75); break;
    case 'capa': voar(s, DURACAO_CAPA, 'capa'); break;
    case 'nave': voar(s, DURACAO_NAVE, 'nave'); break;
    case 'dobro': s.dobro = DURACAO_DOBRO + s.poderes.supercarga; s.eventos.push('dobro'); break;
    case 'bau': s.moedas += MOEDAS_BAU; s.energia = Math.min(1, s.energia + 0.1); s.eventos.push('bau'); break;
    case 'turbo':
      s.supercarga = Math.max(s.supercarga, d('supercarga') * 0.6);
      s.contagem.supercargas++;
      s.eventos.push('supercarga');
      break;
    case 'prancha':
      if (s.skate <= 0) { s.skate = DURACAO_SKATE; s.contagem.skates++; }
      else s.skate = DURACAO_SKATE; // já estava no skate: renova o tempo
      s.eventos.push('skate');
      if (s.patinete > 0) descerDoPatinete(s, 'troca');
      break;
    case 'patinete': subirNoPatinete(s); break; // patinete da pista: não gasta carga
    case 'escudo': s.escudo = true; s.eventos.push('poder'); break;
    default:
  }
}

// Pontos: distância (em dobro enquanto vale o ×2) mais 5 por moeda e as manobras de patinete.
// As moedas também vão para a carteira.
export const pontos = (s) => Math.floor(s.dist + s.bonus) + s.moedas * 5 + (s.pontosManobra ?? 0);

export const resumo = (s) => ({
  pontos: pontos(s), moedas: s.moedas, metros: Math.floor(s.dist), ...s.contagem, metrosPatinete: Math.floor(s.contagem.metrosPatinete ?? 0),
});
