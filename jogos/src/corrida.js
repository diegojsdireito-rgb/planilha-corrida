// Corrida dos Cachinhos: corrida sem fim em 3 faixas.
// z é a distância à frente da personagem (0 = onde ela está). Faixas 0, 1 e 2. Alturas em unidades (ela tem ~1,35).
// Obstáculos: cerca (pular), bandeirinhas (deslizar) e carrinho de sorvete (trocar de faixa ou super pulo).
// Na pista: moedas, ímã, tênis de mola (super pulo), maleta voadora, raio (enche a supercarga) e bolha (escudo).

export const LONGE = 70;
const GRAVIDADE = 30;
const PULO = 10.5;
const SUPER_PULO = 1.45; // multiplica a força do pulo
const DESLIZE = 0.7;
const TROCA_DE_FAIXA = 11; // faixas por segundo
const COMPRIMENTO_CARRINHO = 5;
const ALTURA_VOO = 3.6;
export const DURACAO_SKATE = 30;

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

export function nova(nivel = 'medio', cfg = {}) {
  const poderes = { ima: 0, pulo: 0, maleta: 0, supercarga: 0, ...(cfg.poderes ?? {}) };
  return {
    nivel, t: 0, dist: 0, vel: VELOCIDADE[nivel].base,
    faixa: 1, x: 1, y: 0, vy: 0, deslizando: 0,
    moedas: 0, objetos: [], ultimaLinha: 0,
    ima: 0, superPulo: 0, voo: 0, supercarga: 0, energia: 0, escudo: false, invencivel: 0,
    skate: 0, skateTipo: SKATES[cfg.skate] ? cfg.skate : 'classico', cargas: cfg.cargas ?? 0,
    poderes,
    vivo: true, eventos: [],
    contagem: { pulos: 0, deslizes: 0, maletas: 0, supercargas: 0, skates: 0, superPulos: 0 },
  };
}

// Distância mínima entre linhas: dá tempo de reagir mesmo em alta velocidade.
export const intervalo = (vel) => Math.max(12, vel * 0.95);

const fileira = (faixa, z, n, h = 0.5, passo = 1.6) => Array.from({ length: n }, (_, k) => ({ tipo: 'moeda', faixa, z: z + k * passo, h }));

// Uma linha de obstáculos. Garante pelo menos uma faixa sem carrinho e nunca mais de um carrinho.
export function gerarLinha(z, aleatorio = Math.random, dist = 0, voando = false) {
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
    for (let k = 0; k < 5; k++) objetos.push({ tipo: 'moeda', faixa: cerca.faixa, z: z - 2 + k, h: Math.sin((k / 4) * Math.PI) * 1.6 + 0.4 });
  } else if (livres.length && r() < 0.85) {
    objetos.push(...fileira(livres[Math.floor(r() * livres.length)], z, 3 + Math.floor(r() * 5)));
  }
  if (livres.length && dist > 120 && r() < 0.11) {
    const p = r();
    const tipo = p < 0.3 ? 'raio' : p < 0.5 ? 'ima' : p < 0.68 ? 'pulo' : p < 0.84 ? 'escudo' : 'maleta';
    objetos.push({ tipo, faixa: livres[livres.length - 1], z: z + 0.5, h: 0.7 });
  }
  return objetos;
}

const skateAtivo = (s) => (s.skate > 0 ? SKATES[s.skateTipo] : null);

export function comando(s, acao) {
  if (!s.vivo) return;
  if (acao === 'esquerda' && s.faixa > 0) { s.faixa--; s.eventos.push('troca'); }
  else if (acao === 'direita' && s.faixa < 2) { s.faixa++; s.eventos.push('troca'); }
  else if (acao === 'pular' && s.y <= 0.001 && s.voo <= 0) {
    const sk = skateAtivo(s);
    const forte = s.superPulo > 0 || s.supercarga > 0;
    s.vy = PULO * (forte ? SUPER_PULO : 1) * (sk?.pulo ?? 1);
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
    s.eventos.push('skate');
  } else if (acao === 'supercarga' && s.energia >= 1 && s.supercarga <= 0) {
    s.energia = 0;
    s.supercarga = duracao(s.poderes.supercarga) * 0.6;
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
  const turbo = s.supercarga > 0 ? 1.4 : 1;
  s.vel = Math.min(cfg.max, cfg.base + cfg.ganho * s.t) * turbo * (sk?.velocidade ?? 1);
  const dz = s.vel * dt;
  s.dist += dz;

  // personagem
  const passo = TROCA_DE_FAIXA * dt;
  s.x = Math.abs(s.faixa - s.x) <= passo ? s.faixa : s.x + Math.sign(s.faixa - s.x) * passo;
  if (s.voo > 0) {
    s.y += (ALTURA_VOO - s.y) * Math.min(1, dt * 4);
    s.vy = 0;
  } else if (s.y > 0 || s.vy > 0) {
    s.vy -= GRAVIDADE * (sk?.gravidade ?? 1) * dt;
    s.y = Math.max(0, s.y + s.vy * dt);
    if (s.y === 0) { s.vy = 0; s.eventos.push('pouso'); }
  }
  const voava = s.voo > 0;
  s.deslizando = Math.max(0, s.deslizando - dt);
  for (const k of ['ima', 'superPulo', 'voo', 'supercarga', 'invencivel']) s[k] = Math.max(0, s[k] - dt);
  if (voava && s.voo === 0) { s.vy = 0; s.invencivel = Math.max(s.invencivel, 1.2); s.eventos.push('pouso'); }
  if (s.skate > 0) {
    s.skate = Math.max(0, s.skate - dt);
    if (s.skate === 0) s.eventos.push('skate-fim');
  }

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
    s.objetos.push(...gerarLinha(LONGE, aleatorio, s.dist, s.voo > 1.5));
    s.ultimaLinha = LONGE;
  }

  // coletas e batidas
  for (const o of s.objetos) {
    if (!['cerca', 'faixa', 'carrinho'].includes(o.tipo)) {
      if (Math.abs(o.z) < 0.7 && Math.abs(o.faixa - s.x) < 0.6 && Math.abs((o.h ?? 0) - (s.y + 0.6)) < 1.1) {
        o.pego = true;
        coletar(s, o);
      }
      continue;
    }
    if (o.atingido || !colide(s, o)) continue;
    o.atingido = true;
    if (s.supercarga > 0) { o.quebrado = true; s.eventos.push('quebra'); continue; } // a supercarga atravessa
    if (s.invencivel > 0) continue;
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

function coletar(s, o) {
  const sk = skateAtivo(s);
  const d = (nome) => duracao(s.poderes[nome]);
  switch (o.tipo) {
    case 'moeda':
      s.moedas += sk?.moedas ?? 1;
      s.energia = Math.min(1, s.energia + 0.006);
      s.eventos.push('moeda');
      break;
    case 'raio':
      s.energia = Math.min(1, s.energia + 0.34);
      s.eventos.push(s.energia >= 1 ? 'carga-cheia' : 'raio');
      break;
    case 'ima': s.ima = d('ima'); s.eventos.push('poder'); break;
    case 'pulo': s.superPulo = d('pulo'); s.eventos.push('poder'); break;
    case 'maleta':
      s.voo = d('maleta') * 0.75;
      s.deslizando = 0;
      s.contagem.maletas++;
      s.objetos = s.objetos.filter((x) => x.z < 2 || !['cerca', 'faixa', 'carrinho'].includes(x.tipo));
      s.eventos.push('maleta');
      break;
    case 'escudo': s.escudo = true; s.eventos.push('poder'); break;
    default:
  }
}

// Pontos: distância mais 5 por moeda. As moedas também vão para a carteira.
export const pontos = (s) => Math.floor(s.dist) + s.moedas * 5;

export const resumo = (s) => ({
  pontos: pontos(s), moedas: s.moedas, metros: Math.floor(s.dist), ...s.contagem,
});
