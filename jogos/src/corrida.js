// Corrida dos Cachinhos: corrida sem fim em 3 faixas.
// z é a distância à frente da personagem (0 = onde ela está). Faixas 0, 1 e 2.
// Obstáculos: cerca (pular), faixa pendurada (deslizar) e carrinho (trocar de faixa).

export const LONGE = 70;
const GRAVIDADE = 30;
const PULO = 10.5;
const DESLIZE = 0.7;
const TROCA_DE_FAIXA = 11; // faixas por segundo
const COMPRIMENTO_CARRINHO = 5;

const VELOCIDADE = {
  facil: { base: 11, max: 24, ganho: 0.14 },
  medio: { base: 13, max: 28, ganho: 0.18 },
  dificil: { base: 15, max: 33, ganho: 0.22 },
};

export function nova(nivel = 'medio') {
  return {
    nivel, t: 0, dist: 0, vel: VELOCIDADE[nivel].base,
    faixa: 1, x: 1, y: 0, vy: 0, deslizando: 0,
    estrelas: 0, objetos: [], ultimaLinha: 0,
    ima: 0, escudo: false, invencivel: 0, vivo: true, eventos: [],
  };
}

// Distância mínima entre linhas: dá tempo de reagir mesmo em alta velocidade.
export const intervalo = (vel) => Math.max(12, vel * 0.95);

// Uma linha de obstáculos. Garante pelo menos uma faixa sem carrinho
// e nunca mais de um carrinho, então sempre existe passagem.
export function gerarLinha(z, aleatorio = Math.random, dist = 0) {
  const r = aleatorio;
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
  // estrelas numa faixa livre, ou em arco por cima de uma cerca
  const cerca = objetos.find((o) => o.tipo === 'cerca');
  if (cerca && r() < 0.35) {
    for (let k = 0; k < 5; k++) objetos.push({ tipo: 'estrela', faixa: cerca.faixa, z: z - 2 + k, h: Math.sin((k / 4) * Math.PI) * 1.6 + 0.4 });
  } else if (livres.length && r() < 0.75) {
    const f = livres[Math.floor(r() * livres.length)];
    const n = 3 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) objetos.push({ tipo: 'estrela', faixa: f, z: z + k * 1.6, h: 0.5 });
  }
  if (livres.length && dist > 150 && r() < 0.06) {
    objetos.push({ tipo: r() < 0.5 ? 'ima' : 'escudo', faixa: livres[0], z: z + 0.5, h: 0.6 });
  }
  return objetos;
}

export function comando(s, acao) {
  if (!s.vivo) return;
  if (acao === 'esquerda' && s.faixa > 0) { s.faixa--; s.eventos.push('troca'); }
  else if (acao === 'direita' && s.faixa < 2) { s.faixa++; s.eventos.push('troca'); }
  else if (acao === 'pular' && s.y <= 0.001) { s.vy = PULO; s.deslizando = 0; s.eventos.push('pulo'); }
  else if (acao === 'deslizar') {
    if (s.y > 0.001) s.vy = -PULO * 1.6; // desce rápido e já desliza
    s.deslizando = DESLIZE;
    s.eventos.push('desliza');
  }
}

function colide(s, o) {
  if (Math.abs(o.faixa - s.x) > 0.55) return false;
  const frente = o.z;
  const tras = o.z + (o.comp ?? 0);
  if (frente > 0.45 || tras < -0.45) return false;
  if (o.tipo === 'cerca') return s.y < 0.6;
  if (o.tipo === 'faixa') return !(s.deslizando > 0 && s.y < 0.2);
  return true; // carrinho
}

export function avancar(s, dt, aleatorio = Math.random) {
  if (!s.vivo) return s;
  dt = Math.min(dt, 0.05);
  const cfg = VELOCIDADE[s.nivel];
  s.t += dt;
  s.vel = Math.min(cfg.max, cfg.base + cfg.ganho * s.t);
  const dz = s.vel * dt;
  s.dist += dz;

  // personagem
  const alvo = s.faixa;
  const passo = TROCA_DE_FAIXA * dt;
  s.x = Math.abs(alvo - s.x) <= passo ? alvo : s.x + Math.sign(alvo - s.x) * passo;
  if (s.y > 0 || s.vy > 0) {
    s.vy -= GRAVIDADE * dt;
    s.y = Math.max(0, s.y + s.vy * dt);
    if (s.y === 0) { s.vy = 0; s.eventos.push('pouso'); }
  }
  s.deslizando = Math.max(0, s.deslizando - dt);
  s.ima = Math.max(0, s.ima - dt);
  s.invencivel = Math.max(0, s.invencivel - dt);

  // mundo
  for (const o of s.objetos) {
    o.z -= dz;
    if (s.ima > 0 && o.tipo === 'estrela' && o.z < 9 && o.z > -1) {
      o.faixa += (s.x - o.faixa) * Math.min(1, dt * 10);
      o.h += (s.y + 0.6 - o.h) * Math.min(1, dt * 10);
    }
  }
  s.objetos = s.objetos.filter((o) => o.z + (o.comp ?? 0) > -6 && !o.pego);
  s.ultimaLinha -= dz;
  if (s.ultimaLinha <= LONGE - intervalo(s.vel)) {
    s.objetos.push(...gerarLinha(LONGE, aleatorio, s.dist));
    s.ultimaLinha = LONGE;
  }

  // coletas e batidas
  for (const o of s.objetos) {
    if (o.tipo === 'estrela' || o.tipo === 'ima' || o.tipo === 'escudo') {
      if (Math.abs(o.z) < 0.7 && Math.abs(o.faixa - s.x) < 0.6 && Math.abs((o.h ?? 0) - (s.y + 0.6)) < 1.1) {
        o.pego = true;
        if (o.tipo === 'estrela') { s.estrelas++; s.eventos.push('estrela'); }
        if (o.tipo === 'ima') { s.ima = 9; s.eventos.push('poder'); }
        if (o.tipo === 'escudo') { s.escudo = true; s.eventos.push('poder'); }
      }
      continue;
    }
    if (s.invencivel > 0 || o.atingido || !colide(s, o)) continue;
    o.atingido = true;
    if (s.escudo) {
      s.escudo = false;
      s.invencivel = 1.2;
      s.eventos.push('escudo');
    } else {
      s.vivo = false;
      s.eventos.push('batida');
      break;
    }
  }
  return s;
}

export const pontos = (s) => Math.floor(s.dist) + s.estrelas * 10;
