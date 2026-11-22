// Pescaria: lógica pura (sem DOM). O lago é visto de lado, em unidades do mundo:
// x de 0 a LARGURA (da esquerda para a direita) e y de 0 (superfície) a FUNDO.
// O anzol desce enquanto o dedo está apertado e sobe quando solta; o barco vai atrás do dedo.
// Encostou num peixe (ou num lixo), ele fica preso e o anzol sobe sozinho até o barco
// (segurando o dedo, sobe mais depressa).
//
// São 40 fases em quatro lugares, cada um com o seu desafio:
//   Lagoa (1–10): peixes calmos e pouco lixo.
//   Rio (11–20): a correnteza empurra o anzol para o lado e alguns peixes fogem do anzol.
//   Mar (21–30): águas-vivas fazem soltar o peixe se a linha encostar nelas; o tubarão rouba o peixe de quem demora.
//   Mar Gelado (31–40): de noite, pelos buracos no gelo; alguns peixes brilham e somem.
// A cada 10 fases vem o Peixe-Rei: fisgado, ele puxa e é preciso tocar várias vezes para trazer.

export const LARGURA = 100;
export const FUNDO = 110;
export const VEL_DESCE = 52;
export const VEL_SOBE = 70;
export const VEL_SOBE_COM_PEIXE = 52;
export const VEL_PUXANDO = 74; // segurando o dedo com um peixe preso
export const VEL_BARCO = 55;
export const VEL_TUBARAO = 46;
export const RAIO_SUSTO = 10; // perto assim do anzol, o peixe arisco foge
export const RAIO_REDE = 17;
export const RAIO_TUBARAO = 48; // o tubarão percebe o peixe fisgado até esta distância
export const DURACAO_ISCA = 7;
export const MAIS_TEMPO = 15;

// peso: chance relativa de aparecer; prof: faixa de profundidade [min, max]; tam: meio comprimento.
export const TIPOS = {
  piaba: { nome: 'Piaba', plural: 'piabas', pontos: 5, tam: 3.6, vel: 13, peso: 34, prof: [10, 55], cor: '#8fd3ff', cor2: '#4aa8e8' },
  laranja: { nome: 'Peixe-laranja', plural: 'peixes-laranja', pontos: 10, tam: 4.6, vel: 11, peso: 26, prof: [18, 75], cor: '#ffa53d', cor2: '#ff6a1f' },
  rosa: { nome: 'Peixe-rosa', plural: 'peixes-rosa', pontos: 15, tam: 5.4, vel: 10, peso: 18, prof: [30, 90], cor: '#ff8fbf', cor2: '#e8508f' },
  listrado: { nome: 'Peixe-palhaço', plural: 'peixes-palhaço', pontos: 25, tam: 5, vel: 15, peso: 12, prof: [45, 100], cor: '#ff7a3d', cor2: '#ffffff' },
  roxo: { nome: 'Peixe-lua', plural: 'peixes-lua', pontos: 40, tam: 7, vel: 8, peso: 7, prof: [60, 102], cor: '#a07cf0', cor2: '#6b4bd6' },
  dourado: { nome: 'Peixe dourado', plural: 'peixes dourados', pontos: 100, tam: 5.2, vel: 19, peso: 3, prof: [72, 104], cor: '#ffd84d', cor2: '#f2a900', raro: true },
  rei: { nome: 'Peixe-Rei', plural: 'Peixes-Rei', pontos: 150, tam: 10, vel: 7, peso: 0, prof: [68, 96], cor: '#4fd1c5', cor2: '#2b6cb0', raro: true, rei: true },
};
export const LIXOS = {
  bota: { nome: 'Bota velha', pontos: -15, tam: 4.6, vel: 2.5, prof: [35, 104], lixo: true },
  lata: { nome: 'Lata', pontos: -10, tam: 3.4, vel: 3, prof: [20, 100], lixo: true },
};
export const todos = (k) => TIPOS[k] ?? LIXOS[k];

// ---------- Lugares e fases ----------
export const TOTAL_FASES = 40;
export const POR_LUGAR = 10;
export const LUGARES = [
  { id: 'lagoa', nome: 'Lagoa', icone: '🏞️', cor: ['#d7f5c9', '#a8e39a'], dica: 'Peixes calminhos para aprender a pescar.' },
  { id: 'rio', nome: 'Rio', icone: '🌊', cor: ['#c9f1ee', '#8fdcd5'], dica: 'A correnteza empurra o anzol para o lado, e alguns peixes fogem quando o anzol chega perto: desça bem em cima deles!' },
  { id: 'mar', nome: 'Mar', icone: '🏖️', cor: ['#fff0c9', '#9fd3ff'], dica: 'Não deixe a linha encostar nas águas-vivas com um peixe no anzol, e segure o dedo para subir rápido antes que o tubarão chegue!' },
  { id: 'gelo', nome: 'Mar Gelado', icone: '🧊', cor: ['#3b4a8c', '#1d2456'], dica: 'De noite, pelos buracos no gelo. Alguns peixes brilham e somem: espere eles aparecerem.' },
];
export const lugarDa = (n) => LUGARES[Math.min(LUGARES.length - 1, Math.max(0, Math.floor((n - 1) / POR_LUGAR)))];

// O que cada fase do lugar pede, na ordem (a 10ª é sempre o Peixe-Rei).
const ROTEIRO = ['pontos', 'peixe', 'pontos', 'limpa', 'peixe', 'pontos', 'limpa', 'peixe', 'pontos', 'rei'];
// Peixe pedido nas fases de "pegue N" (posições 1, 4 e 7 do lugar) e quantos.
const PEDIDOS = {
  lagoa: [['laranja', 3], ['rosa', 3], ['dourado', 1]],
  rio: [['rosa', 3], ['listrado', 3], ['dourado', 1]],
  mar: [['listrado', 4], ['roxo', 2], ['dourado', 2]],
  gelo: [['roxo', 3], ['rosa', 4], ['listrado', 4]],
};
const redondo = (v, m = 5) => Math.round(v / m) * m;

const cache = new Map();
export function fase(n) {
  n = Math.min(TOTAL_FASES, Math.max(1, Math.round(Number(n)) || 1));
  if (cache.has(n)) return cache.get(n);
  const lugar = lugarDa(n);
  const k = (n - 1) % POR_LUGAR; // posição dentro do lugar, 0 a 9
  const g = (n - 1) / (TOTAL_FASES - 1); // 0 na primeira fase, 1 na última
  const tipo = ROTEIRO[k];
  let meta;
  if (tipo === 'pontos') meta = { tipo, alvo: redondo((70 + 150 * g + (k / 9) * 20) * ({ gelo: 0.75, mar: 0.88 }[lugar.id] ?? 1)) };
  else if (tipo === 'peixe') { const [peixe, alvo] = PEDIDOS[lugar.id][[1, 4, 7].indexOf(k)]; meta = { tipo, peixe, alvo }; }
  else if (tipo === 'limpa') meta = { tipo, alvo: 5 + Math.round(g * 6) + (k > 5 ? 1 : 0) };
  else meta = { tipo: 'rei', alvo: 1 };
  const f = {
    n, lugar: lugar.id, meta,
    tempo: lugar.id === 'gelo' ? 90 : 60, // no gelo, de buraco em buraco, precisa de mais tempo
    vel: (0.7 + 0.5 * g + (k / 9) * 0.08) * (lugar.id === 'gelo' ? 0.75 : 1), // velocidade dos peixes (na água gelada, mais devagar)
    peixes: lugar.id === 'lagoa' ? 8 : 9,
    lixo: { lagoa: 1, rio: 2, mar: 2, gelo: 2 }[lugar.id] + Math.floor(k / 4),
    corr: 0, ariscos: 0, aguas: 0, tubarao: 0, buracos: null, pisca: 0, luz: 0,
    rei: tipo === 'rei' ? { forca: 0.09 + 0.02 * Math.floor((n - 1) / POR_LUGAR) } : null,
  };
  if (lugar.id === 'rio') { f.corr = 5 + k; f.ariscos = 0.2 + k * 0.035; }
  if (lugar.id === 'mar') { f.aguas = 1 + Math.floor(k / 3); f.tubarao = 38 + k * 2.2; } // velocidade do tubarão atacando
  if (lugar.id === 'gelo') { f.buracos = k < 5 ? [10, 30, 50, 70, 90] : [14, 38, 62, 86]; f.pisca = 0.3 + k * 0.04; f.luz = 16 - k * 0.6; }
  // o peixe pedido aparece mais nesta fase
  f.pesos = meta.tipo === 'peixe' ? { [meta.peixe]: (meta.peixe === 'dourado' ? 3 : 2) * (lugar.id === 'gelo' ? 2 : 1) } : {};
  cache.set(n, f);
  return f;
}

export function textoMeta(meta) {
  if (meta.tipo === 'pontos') return `Faça ${meta.alvo} pontos`;
  if (meta.tipo === 'peixe') return meta.alvo === 1 ? `Pegue 1 ${TIPOS[meta.peixe].nome.toLowerCase()}` : `Pegue ${meta.alvo} ${TIPOS[meta.peixe].plural}`;
  if (meta.tipo === 'limpa') return `Pegue ${meta.alvo} peixes seguidos sem pescar lixo`;
  return 'Pesque o Peixe-Rei!';
}

// Quanto da meta já foi feito: { feito, alvo }.
export function andamento(r) {
  const m = r.meta;
  if (m.tipo === 'pontos') return { feito: Math.min(m.alvo, r.pontos), alvo: m.alvo };
  if (m.tipo === 'peixe') return { feito: Math.min(m.alvo, r.pescados[m.peixe] ?? 0), alvo: m.alvo };
  if (m.tipo === 'limpa') return { feito: Math.min(m.alvo, r.seguidos), alvo: m.alvo };
  return { feito: Math.min(1, r.pescados.rei ?? 0), alvo: 1 };
}
export const cumpriu = (r) => { const a = andamento(r); return a.feito >= a.alvo; };

// Estrelas pelo tempo que sobrou ao cumprir a meta: 1 ao cumprir; 2 com 20% do tempo sobrando; 3 com 40%.
export const LIMITES_ESTRELA = [0.2, 0.4];
export function estrelas(restante, tempo, venceu = true) {
  if (!venceu) return 0;
  const f = restante / tempo;
  return f >= LIMITES_ESTRELA[1] ? 3 : f >= LIMITES_ESTRELA[0] ? 2 : 1;
}

// ---------- Bônus ----------
export const BONUS = [
  { id: 'isca', icone: '🪱', nome: 'Isca dourada', texto: `Por ${DURACAO_ISCA} segundos, os peixes raros e o peixe da meta nadam até o anzol.` },
  { id: 'rede', icone: '🥅', nome: 'Rede', texto: 'Pega de uma vez os peixes em volta do anzol (o lixo fica).' },
  { id: 'tempo', icone: '⏱️', nome: `+${MAIS_TEMPO} segundos`, texto: `Ganha ${MAIS_TEMPO} segundos a mais nesta fase.` },
];
export const BONUS_INICIAL = 3;
export function sortearPremios(est, aleatorio = Math.random) {
  return Array.from({ length: est }, () => BONUS[Math.floor(aleatorio() * BONUS.length)].id);
}

// Moedas ao vencer: 10 por estrela na primeira vitória; ao repetir, 5 por estrela nova. Repetir sem melhorar não dá nada.
export function moedasGanhas(melhorAntes, est) {
  if (!est) return 0;
  if (!melhorAntes) return est * 10;
  return Math.max(0, est - melhorAntes) * 5;
}

// Melhor resultado de cada fase (estrelas e pontos) a partir do histórico, e até onde já foi liberado.
// Registros de versões antigas (sem fase) ficam de fora.
export function progresso(historico) {
  const melhor = {};
  let liberada = 1;
  for (const h of historico) {
    if (h.j !== 'pescaria' || !Number.isInteger(h.nivel) || h.nivel < 1 || h.nivel > TOTAL_FASES) continue;
    const m = (melhor[h.nivel] ??= { estrelas: 0, pontos: 0, vezes: 0 });
    m.vezes++;
    m.pontos = Math.max(m.pontos, h.pontos ?? 0);
    if (h.r === 'vitoria') { m.estrelas = Math.max(m.estrelas, Math.min(3, h.estrelas ?? 1)); liberada = Math.max(liberada, h.nivel + 1); }
  }
  liberada = Math.min(TOTAL_FASES, liberada);
  const estrelasTotal = Object.values(melhor).reduce((t, m) => t + m.estrelas, 0);
  return { melhor, liberada, estrelas: estrelasTotal, maxEstrelas: TOTAL_FASES * 3 };
}

// ---------- Peixes ----------
function sortearTipo(f, aleatorio, isca = false) {
  const lista = Object.entries(TIPOS).filter(([, v]) => v.peso > 0)
    .map(([k, v]) => [k, v.peso * (f.pesos?.[k] ?? 1) * (isca && v.raro ? 4 : 1)]);
  const total = lista.reduce((t, [, p]) => t + p, 0);
  let r = aleatorio() * total;
  for (const [k, p] of lista) { r -= p; if (r < 0) return k; }
  return lista[0][0];
}

// Peixe que entra no lugar de outro: nas fases de "pegue N", sempre tem pelo menos um do pedido no lago.
function proximoTipo(r, f, aleatorio) {
  const m = r.meta;
  if (m.tipo === 'peixe' && !r.bichos.some((b) => b.tipo === m.peixe) && r.preso?.tipo !== m.peixe) return m.peixe;
  return sortearTipo(f, aleatorio, r.isca > 0);
}

let proximoId = Math.floor(Math.random() * 1e6) + 1;
// Cria um bicho (ou lixo). `dentro`: já nasce no meio do lago (começo da fase); senão entra por um lado.
export function criar(tipo, f, aleatorio = Math.random, dentro = false) {
  const t = todos(tipo);
  const dir = aleatorio() < 0.5 ? 1 : -1;
  const [a, b] = t.prof;
  const y = a + aleatorio() * (b - a);
  const x = dentro ? 8 + aleatorio() * (LARGURA - 16) : dir > 0 ? -t.tam * 2 : LARGURA + t.tam * 2;
  const v = t.vel * (t.lixo ? 1 : f.vel) * (0.8 + aleatorio() * 0.4);
  const bicho = { id: proximoId++, tipo, x, y, y0: y, vx: dir * v, v, fase: aleatorio() * Math.PI * 2 };
  if (!t.lixo && !t.rei) {
    if (f.ariscos && aleatorio() < f.ariscos) { bicho.arisco = true; bicho.susto = 0; }
    if (f.pisca && aleatorio() < f.pisca) { bicho.pisca = true; bicho.tp = aleatorio() * CICLO_PISCA; }
  }
  return bicho;
}

// Peixes que brilham: aparecem por um tempo e somem por outro (sumidos, não dá para fisgar).
export const CICLO_PISCA = 4.4;
const APARECE = 2.9;
export const visivel = (b) => !b.pisca || (b.tp % CICLO_PISCA) < APARECE;
// 0 a 1, para desenhar o peixe sumindo e aparecendo devagar.
export function brilho(b) {
  if (!b.pisca) return 1;
  const t = b.tp % CICLO_PISCA;
  if (t < 0.35) return t / 0.35;
  if (t < APARECE - 0.35) return 1;
  if (t < APARECE) return (APARECE - t) / 0.35;
  return 0;
}

function criarAgua(aleatorio, k) {
  const y = 22 + aleatorio() * 60;
  return { id: proximoId++, x: 12 + ((k * 31 + aleatorio() * 20) % 76), y, y0: y, vx: (aleatorio() < 0.5 ? -1 : 1) * (2 + aleatorio() * 2), fase: aleatorio() * 6, choque: 0 };
}

export function novaRodada(n = 1, aleatorio = Math.random) {
  const f = fase(n);
  const bichos = [];
  for (let k = 0; k < f.peixes; k++) bichos.push(criar(sortearTipo(f, aleatorio), f, aleatorio, true));
  const nomesLixo = Object.keys(LIXOS);
  for (let k = 0; k < f.lixo; k++) bichos.push(criar(nomesLixo[k % nomesLixo.length], f, aleatorio, true));
  if (f.rei) bichos.push(criar('rei', f, aleatorio, true));
  const inicio = f.buracos ? f.buracos[Math.floor(f.buracos.length / 2)] : LARGURA / 2;
  return {
    versao: 2, fase: f.n, lugar: f.lugar, meta: { ...f.meta }, tempo: f.tempo, restante: f.tempo,
    pontos: 0, seguidos: 0, comecou: false, acabou: false, venceu: false,
    barco: inicio, alvo: inicio, anzol: 0, deriva: 0, segurando: false, preso: null, bichos,
    aguas: Array.from({ length: f.aguas }, (_, k) => criarAgua(aleatorio, k)),
    tubarao: f.tubarao ? { x: aleatorio() < 0.5 ? -6 : LARGURA + 6, y: 75, vx: 0, modo: 'ronda', t: aleatorio() * 10 } : null,
    disputa: null, isca: 0, relogio: 0,
    pescados: {}, // contagem por tipo
  };
}

// Onde está o anzol na horizontal (a correnteza empurra para a direita, mais quanto mais fundo).
export const xDoAnzol = (r) => r.barco + (r.deriva ?? 0);
// Buraco do gelo mais perto de um x.
export const buracoPerto = (buracos, x) => buracos.reduce((m, b) => (Math.abs(b - x) < Math.abs(m - x) ? b : m), buracos[0]);

// Encosta? (caixa elíptica em volta do bicho)
export function encosta(b, x, y) {
  const t = todos(b.tipo);
  const dx = (x - b.x) / (t.tam * 1.15); const dy = (y - b.y) / (t.tam * 0.8);
  return dx * dx + dy * dy <= 1;
}

const atraido = (r, b) => { const t = todos(b.tipo); return !t.lixo && (t.raro || t.pontos >= 25 || (r.meta.tipo === 'peixe' && b.tipo === r.meta.peixe)); };

// Tirar o peixe do anzol (água-viva, tubarão ou o Peixe-Rei escapando): ele volta a nadar, fugindo.
function devolver(r, b, f) {
  const t = todos(b.tipo);
  const dir = b.x < LARGURA / 2 ? -1 : 1;
  r.bichos.push({ ...b, y0: Math.min(t.prof[1], Math.max(t.prof[0], b.y)), vx: dir * Math.max(b.v ?? t.vel * f.vel, 14), susto: 1.2 });
}

// Avança a rodada `dt` segundos. Devolve a lista de acontecimentos:
// { tipo: 'fisgou', bicho } | { tipo: 'pescou', bicho, pontos } | { tipo: 'fugiu', bicho } | { tipo: 'soltou', bicho, agua }
// | { tipo: 'tubarao' } (veio atacar) | { tipo: 'roubou', bicho } | { tipo: 'escapou' } | { tipo: 'puxao' } | { tipo: 'fim', venceu }.
export function passo(r, dt, aleatorio = Math.random) {
  const eventos = [];
  if (r.acabou || !r.comecou) return eventos;
  dt = Math.min(dt, 0.1);
  const f = fase(r.fase);
  r.restante = Math.max(0, r.restante - dt);
  r.relogio += dt;
  r.isca = Math.max(0, r.isca - dt);

  // barco atrás do dedo (no gelo, só de buraco em buraco e com o anzol em cima)
  if (!r.disputa) {
    let alvo = r.alvo;
    if (f.buracos) alvo = r.anzol <= 1 && !r.preso ? buracoPerto(f.buracos, r.alvo) : r.barco;
    const d = alvo - r.barco;
    const mov = Math.sign(d) * Math.min(Math.abs(d), VEL_BARCO * dt);
    r.barco = Math.min(LARGURA - 6, Math.max(6, r.barco + mov));
  }

  // correnteza
  const der = f.corr * (r.anzol / FUNDO) * (1 + 0.2 * Math.sin(r.relogio * 0.8));
  r.deriva += (der - r.deriva) * Math.min(1, dt * 4);

  // anzol
  if (r.disputa) { /* quem manda é a disputa, mais abaixo */ }
  else if (r.preso) r.anzol = Math.max(0, r.anzol - (r.segurando ? VEL_PUXANDO : VEL_SOBE_COM_PEIXE) * dt);
  else if (r.segurando) r.anzol = Math.min(FUNDO - 3, r.anzol + VEL_DESCE * dt);
  else r.anzol = Math.max(0, r.anzol - VEL_SOBE * dt);
  const hx = xDoAnzol(r);

  // bichos nadando
  for (let k = r.bichos.length - 1; k >= 0; k--) {
    const b = r.bichos[k];
    const t = todos(b.tipo);
    if (b.pisca) b.tp += dt;
    if (b.susto > 0) { b.susto -= dt; if (b.susto <= 0) { b.susto = 0; b.vx = Math.sign(b.vx || 1) * b.v; } }
    const comIsca = r.isca > 0 && atraido(r, b) && !r.preso && !r.disputa;
    if (comIsca) {
      if (Math.abs(hx - b.x) > 2) b.vx = Math.sign(hx - b.x) * Math.max(b.v, 12);
      const alvoY = Math.max(14, r.anzol + 2);
      b.y0 += Math.max(-14 * dt, Math.min(14 * dt, alvoY - b.y0));
    } else if (f.luz && !t.lixo && !b.susto && !r.preso && r.anzol > 4 && visivel(b) && Math.abs(b.y - r.anzol) < 12 && Math.abs(b.x - hx) < f.luz) {
      // no escuro, os peixes chegam perto para ver a luzinha do anzol
      if (Math.abs(hx - b.x) > 1) b.vx = Math.sign(hx - b.x) * Math.max(b.v, 6);
      b.y0 += Math.max(-8 * dt, Math.min(8 * dt, r.anzol - b.y0));
    } else if (b.arisco && !b.susto && !r.preso && r.anzol > 4 && Math.hypot(b.x - hx, b.y - r.anzol) < RAIO_SUSTO) {
      b.susto = 1.1;
      b.vx = Math.sign(b.x - hx || 1) * Math.max(b.v * 2.2, 24);
      eventos.push({ tipo: 'fugiu', bicho: b });
    }
    b.fase += dt * (t.lixo ? 1.2 : 3);
    b.x += b.vx * dt;
    b.y = b.y0 + Math.sin(b.fase) * (t.lixo ? 1.2 : 2);
    if (b.x < -t.tam * 3 || b.x > LARGURA + t.tam * 3) {
      // saiu do lago: o lixo e o Peixe-Rei voltam, o peixe dá lugar a outro sorteado
      r.bichos[k] = criar(t.lixo || t.rei ? b.tipo : proximoTipo(r, f, aleatorio), f, aleatorio);
    }
  }

  // águas-vivas indo e vindo
  for (const a of r.aguas) {
    a.fase += dt; a.x += a.vx * dt; a.choque = Math.max(0, a.choque - dt);
    if (a.x < 8 || a.x > LARGURA - 8) { a.vx = -a.vx; a.x = Math.min(LARGURA - 8, Math.max(8, a.x)); }
    a.y = a.y0 + Math.sin(a.fase * 0.9) * 5;
  }

  // fisgar
  if (!r.preso && !r.disputa && r.anzol > 4) {
    const b = r.bichos.find((q) => visivel(q) && encosta(q, hx, r.anzol));
    if (b) {
      r.bichos = r.bichos.filter((q) => q.id !== b.id);
      r.preso = { ...b };
      const t = todos(b.tipo);
      if (t.rei) r.disputa = { p: 0.35, y: r.anzol, t: 0 };
      eventos.push({ tipo: 'fisgou', bicho: r.preso });
    }
  }

  // Peixe-Rei: ele puxa (com puxões de vez em quando) e cada toque traz um pouco
  if (r.disputa) {
    const d = r.disputa;
    if (d.p < 1) {
      const antes = d.t % 1.7 > 1.2;
      d.t += dt;
      const puxao = d.t % 1.7 > 1.2;
      if (puxao && !antes) eventos.push({ tipo: 'puxao' });
      d.p -= f.rei.forca * (puxao ? 2.5 : 1) * dt;
      if (r.segurando) d.p = Math.min(1, d.p + 0.03 * dt);
    }
    r.anzol = Math.max(0, d.y * (1 - d.p));
    if (d.p <= 0) {
      devolver(r, r.preso, f);
      eventos.push({ tipo: 'escapou', bicho: r.preso });
      r.preso = null; r.disputa = null;
    }
  }
  if (r.preso) {
    r.preso.x = xDoAnzol(r) + (r.disputa ? Math.sin(r.relogio * 9) * 2.5 : 0);
    r.preso.y = r.anzol + todos(r.preso.tipo).tam * 0.6;
  }

  // tubarão: ronda devagar pelo fundo; quando um peixe é fisgado perto dele, vem correndo roubar.
  // Quem sobe depressa (segurando o dedo) escapa.
  const tb = r.tubarao;
  if (tb) {
    tb.t += dt;
    const alvo = r.preso && !todos(r.preso.tipo).lixo && !r.disputa ? r.preso : null;
    if (tb.modo === 'ronda' && alvo && Math.hypot(alvo.x - tb.x, alvo.y - tb.y) < RAIO_TUBARAO) { tb.modo = 'ataque'; eventos.push({ tipo: 'tubarao' }); }
    if (tb.modo === 'ataque') {
      if (!alvo) tb.modo = 'ronda';
      else {
        // mira um pouco acima, onde o peixe vai estar
        const dist = Math.hypot(alvo.x - tb.x, alvo.y - tb.y) || 1;
        const sobe = r.segurando ? VEL_PUXANDO : VEL_SOBE_COM_PEIXE;
        const dx = alvo.x - tb.x; const dy = alvo.y - sobe * Math.min(1.2, dist / f.tubarao) - tb.y; const d = Math.hypot(dx, dy) || 1;
        tb.vx = (dx / d) * f.tubarao;
        tb.x += tb.vx * dt; tb.y += (dy / d) * f.tubarao * dt;
        if (Math.hypot(alvo.x - tb.x, alvo.y - tb.y) < 6) {
          eventos.push({ tipo: 'roubou', bicho: r.preso });
          r.preso = null;
          tb.modo = 'fora'; tb.t = 0; tb.vx = (tb.x < LARGURA / 2 ? -1 : 1) * 40;
        }
      }
    } else if (tb.modo === 'fora') {
      // vai embora com o peixe e volta depois de um tempo
      if (tb.x > -25 && tb.x < LARGURA + 25) tb.x += tb.vx * dt;
      if (tb.t > 4) { tb.modo = 'ronda'; tb.vx = tb.x < 0 ? 10 : -10; }
    } else {
      tb.vx = Math.sign(tb.vx || 1) * 10;
      tb.x += tb.vx * dt;
      if ((tb.x > LARGURA + 6 && tb.vx > 0) || (tb.x < -6 && tb.vx < 0)) tb.vx = -tb.vx;
      tb.y += (72 + Math.sin(tb.t * 0.5) * 16 - tb.y) * Math.min(1, dt * 1.5);
    }
  }

  // água-viva encostou na linha com um peixe preso: ele se solta
  if (r.preso && !r.disputa && !todos(r.preso.tipo).lixo) {
    for (const a of r.aguas) {
      if (a.y > r.anzol + 1 || a.y < 2) continue;
      const xLinha = r.barco + (r.deriva ?? 0) * (a.y / Math.max(1, r.anzol));
      if (Math.abs(a.x - xLinha) < 3.6) {
        a.choque = 0.6;
        eventos.push({ tipo: 'soltou', bicho: r.preso, agua: a });
        devolver(r, r.preso, f);
        r.preso = null;
        break;
      }
    }
  }

  // chegou no barco
  if (r.preso && r.anzol <= 0) {
    const b = r.preso;
    const t = todos(b.tipo);
    r.pontos = Math.max(0, r.pontos + t.pontos);
    r.pescados[b.tipo] = (r.pescados[b.tipo] ?? 0) + 1;
    r.seguidos = t.lixo ? 0 : r.seguidos + 1;
    r.preso = null; r.disputa = null;
    if (!t.rei) r.bichos.push(criar(t.lixo ? b.tipo : proximoTipo(r, f, aleatorio), f, aleatorio));
    eventos.push({ tipo: 'pescou', bicho: b, pontos: t.pontos });
  }

  fimSePreciso(r, eventos);
  return eventos;
}

function fimSePreciso(r, eventos) {
  if (r.acabou) return;
  if (cumpriu(r)) { r.acabou = true; r.venceu = true; }
  else if (r.restante <= 0) { r.acabou = true; r.venceu = false; }
  if (r.acabou) { r.segurando = false; eventos.push({ tipo: 'fim', venceu: r.venceu }); }
}

// Um toque no Peixe-Rei: puxa a linha um pouco.
export const FORCA_TOQUE = 0.07;
export function puxar(r) {
  if (!r.disputa || r.acabou) return false;
  r.disputa.p = Math.min(1, r.disputa.p + FORCA_TOQUE);
  return true;
}

// Usa um bônus. Devolve null se não deu para usar (e aí ele não é gasto), ou a lista de acontecimentos.
export function usarBonus(r, id, aleatorio = Math.random) {
  if (r.acabou) return null;
  const f = fase(r.fase);
  const eventos = [];
  if (id === 'tempo') { r.restante += MAIS_TEMPO; eventos.push({ tipo: 'tempo', mais: MAIS_TEMPO }); return eventos; }
  if (id === 'isca') {
    if (r.isca > 0) return null;
    r.isca = DURACAO_ISCA;
    // se não tem nenhum peixe raro (ou o da meta) no lago, chega um
    const querido = r.meta.tipo === 'peixe' ? r.meta.peixe : r.meta.tipo === 'rei' ? 'rei' : 'dourado';
    if (!r.bichos.some((b) => b.tipo === querido) && r.preso?.tipo !== querido) r.bichos.push(criar(querido, f, aleatorio));
    eventos.push({ tipo: 'isca' });
    return eventos;
  }
  if (id === 'rede') {
    if (r.disputa) return null;
    const x = xDoAnzol(r); const y = Math.max(r.anzol, 20);
    const pegos = r.bichos.filter((b) => { const t = todos(b.tipo); return !t.lixo && !t.rei && visivel(b) && Math.hypot(b.x - x, b.y - y) <= RAIO_REDE + t.tam; });
    if (!pegos.length) return null;
    r.bichos = r.bichos.filter((b) => !pegos.includes(b));
    eventos.push({ tipo: 'rede', x, y, quantos: pegos.length });
    for (const b of pegos) {
      const t = todos(b.tipo);
      r.pontos += t.pontos;
      r.pescados[b.tipo] = (r.pescados[b.tipo] ?? 0) + 1;
      r.seguidos++;
      r.bichos.push(criar(proximoTipo(r, f, aleatorio), f, aleatorio));
      eventos.push({ tipo: 'pescou', bicho: b, pontos: t.pontos, rede: true });
    }
    fimSePreciso(r, eventos);
    return eventos;
  }
  return null;
}

// Partida salva serve? (as de versões antigas, sem fase, são descartadas)
export const salvoValido = (s) => Boolean(s && s.versao === 2 && Number.isInteger(s.fase) && s.fase >= 1 && s.fase <= TOTAL_FASES && Array.isArray(s.bichos) && s.meta);
