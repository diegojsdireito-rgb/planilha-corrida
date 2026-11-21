// Corrida dos Cachinhos: corrida sem fim em 3 faixas.
// z é a distância à frente da personagem (0 = onde ela está). Faixas 0, 1 e 2. Alturas em unidades (ela tem ~1,35).
// Obstáculos: cerca (pular), bandeirinhas (deslizar) e carrinho de sorvete (trocar de faixa ou super pulo).
// Na pista: moedas e itens que valem na hora em que são pegos: ímã, tênis de mola (super pulo),
// mochila a jato (id 'maleta', para não perder as melhorias já compradas), escudo, pontos em dobro,
// baú de moedas, foguete (supercarga na hora), skate grátis, raio (enche a barra da supercarga),
// capa de super-heroína (voa atraindo as moedas) e nave alienígena (um feixe de luz leva a menina
// para dentro de um disco voador, que percorre um trecho pelo alto e a devolve à pista).

export const LONGE = 70;
const GRAVIDADE = 30;
const PULO = 10.5;
const SUPER_PULO = 1.45; // multiplica a força do pulo
const DESLIZE = 0.7;
const TROCA_DE_FAIXA = 11; // faixas por segundo
const COMPRIMENTO_CARRINHO = 5;
const ALTURA_VOO = 3.6;
export const DURACAO_SKATE = 30;
export const DURACAO_DOBRO = 10;
export const DURACAO_CAPA = 9;
export const DURACAO_NAVE = 11;
export const MOEDAS_BAU = 50;
export const JANELA_ARRANCADA = 6;
// Quem persegue a menina: começa colado nela, fica para trás e volta a chegar perto quando ela tropeça.
export const PERSEGUIDOR = { perto: 0.9, longe: 14, largada: 3, tropeco: 4 }; // segundos do começo em que dá para decolar com a mochila de bônus

const VELOCIDADE = {
  facil: { base: 11, max: 24, ganho: 0.14 },
  medio: { base: 13, max: 28, ganho: 0.18 },
  dificil: { base: 15, max: 33, ganho: 0.22 },
};

// Skates: todos protegem de uma batida; cada um tem um efeito a mais enquanto está ativo.
export const SKATES = {
  classico: { nome: 'Skate Clássico', pulo: 1, gravidade: 1, velocidade: 1, moedas: 1 },
  voador: { nome: 'Skate Voador', pulo: 1.3, gravidade: 0.7, velocidade: 1, moedas: 1 },
  supersonico: { nome: 'Skate Supersônico', pulo: 1.1, gravidade: 1, velocidade: 1.22, moedas: 2 },
};

// Duração de cada poder pelo nível comprado na loja (0 a 5).
export const duracao = (nivel = 0) => 8 + nivel * 2;
// dons: o que cada um muda na corrida
const maisTempo = (s) => (s.dom === 'tempo' ? 1.25 : 1);
const maisEnergia = (s) => (s.dom === 'explosao' ? 1.4 : 1);

export function nova(nivel = 'medio', cfg = {}) {
  const poderes = { ima: 0, pulo: 0, maleta: 0, supercarga: 0, ...(cfg.poderes ?? {}) };
  const dom = cfg.dom ?? null;
  return {
    nivel, t: 0, dist: 0, vel: VELOCIDADE[nivel].base,
    faixa: 1, x: 1, y: 0, vy: 0, deslizando: 0,
    moedas: 0, objetos: [], ultimaLinha: 0,
    ima: dom === 'ima' ? 10 : 0, superPulo: 0, voo: 0, vooTipo: 'mochila', supercarga: 0, energia: dom === 'turbo' ? 0.6 : 0, escudo: dom === 'escudo', invencivel: 0, dobro: 0, bonus: 0,
    arrancadas: cfg.arrancadas ?? 0,
    skate: 0, skateTipo: SKATES[cfg.skate] ? cfg.skate : 'classico', cargas: cfg.cargas ?? 0,
    poderes,
    // dom do personagem escolhido (cada um da turma tem o seu)
    dom: cfg.dom ?? null, puloNoAr: false,
    vivo: true, eventos: ['perseguidor'],
    perseguidor: { dist: PERSEGUIDOR.perto, perto: PERSEGUIDOR.largada },
    contagem: { pulos: 0, deslizes: 0, maletas: 0, supercargas: 0, skates: 0, superPulos: 0, arrancadas: 0, itens: 0, cargasUsadas: 0, capas: 0, naves: 0 },
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
export function gerarLinha(z, aleatorio = Math.random, dist = 0, voando = false, vel = 13) {
  const r = aleatorio;
  if (voando) {
    // no ar não há obstáculos: só uma trilha de moedas lá em cima
    return fileira(Math.floor(r() * 3), z, 7, ALTURA_VOO + 0.6, 1.4);
  }
  const objetos = [];
  const tipos = ['cerca', 'faixa', 'carrinho'];
  const sorteio = r();
  const faixas = [0, 1, 2].sort(() => r() - 0.5);
  let bloqueadas;
  if (dist < 60) bloqueadas = sorteio < 0.5 ? 0 : 1; // começo tranquilo
  else bloqueadas = sorteio < 0.12 ? 0 : sorteio < 0.55 ? 1 : sorteio < 0.9 ? 2 : 3;
  let carrinhos = 0;
  for (let k = 0; k < bloqueadas; k++) {
    let tipo = tipos[Math.floor(r() * 3)];
    if (tipo === 'carrinho' && (carrinhos >= 1 || bloqueadas === 3)) tipo = r() < 0.5 ? 'cerca' : 'faixa';
    if (tipo === 'carrinho') carrinhos++;
    objetos.push({ tipo, faixa: faixas[k], z, comp: tipo === 'carrinho' ? COMPRIMENTO_CARRINHO : 0.4 });
  }
  const livres = faixas.slice(bloqueadas);
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
  ['dobro', 0.09], ['bau', 0.09], ['turbo', 0.06], ['prancha', 0.07], ['capa', 0.06], ['nave', 0.05],
];
export function sortearItem(x) {
  let soma = 0;
  for (const [tipo, chance] of ITENS) { soma += chance; if (x < soma) return tipo; }
  return 'raio';
}

const skateAtivo = (s) => (s.skate > 0 ? SKATES[s.skateTipo] : null);

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
    s.contagem.pulos++;
    if (forte) s.contagem.superPulos++;
    s.eventos.push(forte ? 'superpulo' : 'pulo');
  } else if (acao === 'deslizar' && s.voo <= 0) {
    if (s.y > 0.001) s.vy = -PULO * 1.6; // desce rápido e já desliza
    s.deslizando = DESLIZE;
    s.contagem.deslizes++;
    s.eventos.push('desliza');
  } else if (acao === 'skate' && s.skate <= 0 && s.cargas > 0) {
    s.cargas--;
    s.skate = DURACAO_SKATE;
    s.contagem.skates++;
    s.contagem.cargasUsadas++;
    s.eventos.push('skate');
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

function colide(s, o) {
  if (Math.abs(o.faixa - s.x) > 0.55) return false;
  const frente = o.z;
  const tras = o.z + (o.comp ?? 0);
  if (frente > 0.45 || tras < -0.45) return false;
  if (o.tipo === 'cerca') return s.y < 0.6;
  if (o.tipo === 'faixa') return s.y < 2.0 && !(s.deslizando > 0 && s.y < 0.2);
  return s.y < 1.25; // carrinho (1,25 de altura): só passa por cima com super pulo
}

export function avancar(s, dt, aleatorio = Math.random) {
  if (!s.vivo) return s;
  dt = Math.min(dt, 0.05);
  const cfg = VELOCIDADE[s.nivel];
  const sk = skateAtivo(s);
  s.t += dt;
  const turbo = (s.supercarga > 0 ? 1.4 : 1) * (s.voo > 0 && s.vooTipo === 'nave' ? 1.25 : 1);
  s.vel = Math.min(cfg.max, cfg.base + cfg.ganho * s.t) * turbo * (sk?.velocidade ?? 1);
  const dz = s.vel * dt;
  s.dist += dz;
  if (s.dobro > 0) s.bonus += dz;

  // personagem
  const passo = TROCA_DE_FAIXA * dt * (s.dom === 'desvio' ? 1.6 : s.dom === 'agil' ? 1.25 : 1);
  s.x = Math.abs(s.faixa - s.x) <= passo ? s.faixa : s.x + Math.sign(s.faixa - s.x) * passo;
  if (s.voo > 0) {
    s.y += (ALTURA_VOO - s.y) * Math.min(1, dt * 4);
    s.vy = 0;
  } else if (s.y > 0 || s.vy > 0) {
    s.vy -= GRAVIDADE * (sk?.gravidade ?? 1) * dt;
    s.y = Math.max(0, s.y + s.vy * dt);
    if (s.y === 0) { s.vy = 0; s.puloNoAr = false; s.eventos.push('pouso'); }
  }
  const voava = s.voo > 0;
  s.deslizando = Math.max(0, s.deslizando - dt);
  for (const k of ['ima', 'superPulo', 'voo', 'supercarga', 'invencivel', 'dobro']) {
    const antes = s[k];
    s[k] = Math.max(0, s[k] - dt);
    if (antes > 0 && s[k] === 0 && ['ima', 'superPulo', 'supercarga', 'dobro'].includes(k)) s.eventos.push('poder-fim');
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
    if (s.ima > 0 && o.tipo === 'moeda' && o.z < 10 && o.z > -1) {
      o.faixa += (s.x - o.faixa) * Math.min(1, dt * 10);
      o.h += (s.y + 0.6 - o.h) * Math.min(1, dt * 10);
    }
  }
  s.objetos = s.objetos.filter((o) => o.z + (o.comp ?? 0) > -6 && !o.pego && !o.quebrado);
  s.ultimaLinha -= dz;
  if (s.ultimaLinha <= LONGE - intervalo(s.vel / turbo)) {
    s.objetos.push(...gerarLinha(LONGE, aleatorio, s.dist, s.voo > 1.5, s.vel));
    s.ultimaLinha = LONGE;
  }

  // coletas e batidas
  for (const o of s.objetos) {
    if (!['cerca', 'faixa', 'carrinho'].includes(o.tipo)) {
      // a moeda conta se passou por ela neste quadro (mesmo num celular lento, que anda mais de uma vez por quadro)
      if (o.z < 0.7 && o.z > -0.7 - dz && Math.abs(o.faixa - s.x) < 0.6 && Math.abs((o.h ?? 0) - (s.y + 0.6)) < 1.1) {
        o.pego = true;
        coletar(s, o);
      }
      continue;
    }
    if (o.atingido || !colide(s, o)) continue;
    o.atingido = true;
    if (s.supercarga > 0) { o.quebrado = true; s.eventos.push('quebra'); continue; } // a supercarga atravessa
    if (s.invencivel > 0) continue;
    if (s.escudo || s.skate > 0) tropecar(s);
    if (s.escudo) {
      s.escudo = false;
      s.invencivel = 1.2;
      s.eventos.push('escudo');
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
  if (tipo === 'capa') {
    s.contagem.capas++;
    s.ima = Math.max(s.ima, segundos); // a super-heroína puxa as moedas para perto
  } else if (tipo === 'nave') {
    s.contagem.naves++;
    s.ima = Math.max(s.ima, segundos); // o raio trator da nave puxa as moedas
    s.y = ALTURA_VOO; // teletransportada: já aparece lá em cima, dentro da nave
  } else s.contagem.maletas++;
  // tira da frente os obstáculos que já estavam perto: ela decola por cima deles
  s.objetos = s.objetos.filter((x) => x.z < 2 || !['cerca', 'faixa', 'carrinho'].includes(x.tipo));
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
      break;
    case 'escudo': s.escudo = true; s.eventos.push('poder'); break;
    default:
  }
}

// Pontos: distância (em dobro enquanto vale o ×2) mais 5 por moeda. As moedas também vão para a carteira.
export const pontos = (s) => Math.floor(s.dist + s.bonus) + s.moedas * 5;

export const resumo = (s) => ({
  pontos: pontos(s), moedas: s.moedas, metros: Math.floor(s.dist), ...s.contagem,
});
