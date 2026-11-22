// Pescaria: lógica pura (sem DOM). O lago é visto de lado, em unidades do mundo:
// x de 0 a LARGURA (da esquerda para a direita) e y de 0 (superfície) a FUNDO.
// O anzol desce enquanto o dedo está apertado e sobe quando solta; o barco vai atrás do dedo.
// Encostou num peixe (ou num lixo), ele fica preso e o anzol sobe sozinho até o barco.

export const LARGURA = 100;
export const FUNDO = 110;
export const DURACAO = 60; // segundos de rodada
export const VEL_DESCE = 52;
export const VEL_SOBE = 70;
export const VEL_SOBE_COM_PEIXE = 58;
export const VEL_BARCO = 55;

// peso: chance relativa de aparecer; prof: faixa de profundidade [min, max]; tam: meio comprimento.
export const TIPOS = {
  piaba: { nome: 'Piaba', pontos: 5, tam: 3.6, vel: 13, peso: 34, prof: [10, 55], cor: '#8fd3ff', cor2: '#4aa8e8' },
  laranja: { nome: 'Peixe-laranja', pontos: 10, tam: 4.6, vel: 11, peso: 26, prof: [18, 75], cor: '#ffa53d', cor2: '#ff6a1f' },
  rosa: { nome: 'Peixe-rosa', pontos: 15, tam: 5.4, vel: 10, peso: 18, prof: [30, 90], cor: '#ff8fbf', cor2: '#e8508f' },
  listrado: { nome: 'Peixe-palhaço', pontos: 25, tam: 5, vel: 15, peso: 12, prof: [45, 100], cor: '#ff7a3d', cor2: '#ffffff' },
  roxo: { nome: 'Peixe-lua', pontos: 40, tam: 7, vel: 8, peso: 7, prof: [60, 102], cor: '#a07cf0', cor2: '#6b4bd6' },
  dourado: { nome: 'Peixe dourado', pontos: 100, tam: 5.2, vel: 24, peso: 3, prof: [72, 104], cor: '#ffd84d', cor2: '#f2a900', raro: true },
};
export const LIXOS = {
  bota: { nome: 'Bota velha', pontos: -15, tam: 4.6, vel: 2.5, prof: [35, 104], lixo: true },
  lata: { nome: 'Lata', pontos: -10, tam: 3.4, vel: 3, prof: [20, 100], lixo: true },
};
export const todos = (k) => TIPOS[k] ?? LIXOS[k];

export const NIVEIS = {
  facil: { vel: 0.75, peixes: 8, lixo: 1, meta: 100 },
  medio: { vel: 1, peixes: 8, lixo: 3, meta: 150 },
  dificil: { vel: 1.35, peixes: 9, lixo: 5, meta: 170 },
};

// Estrelas: 1 ao bater a meta, 2 com metade a mais e 3 com o dobro.
export function estrelas(pontos, meta) {
  if (pontos >= meta * 2) return 3;
  if (pontos >= meta * 1.5) return 2;
  return pontos >= meta ? 1 : 0;
}

function sortearTipo(aleatorio) {
  const lista = Object.entries(TIPOS);
  const total = lista.reduce((t, [, v]) => t + v.peso, 0);
  let r = aleatorio() * total;
  for (const [k, v] of lista) { r -= v.peso; if (r < 0) return k; }
  return lista[0][0];
}

let proximoId = Math.floor(Math.random() * 1e6) + 1;
// Cria um bicho (ou lixo). `dentro`: já nasce no meio do lago (começo da rodada); senão entra por um lado.
export function criar(tipo, nivelCfg, aleatorio = Math.random, dentro = false) {
  const t = todos(tipo);
  const dir = aleatorio() < 0.5 ? 1 : -1;
  const [a, b] = t.prof;
  const y = a + aleatorio() * (b - a);
  const x = dentro ? 8 + aleatorio() * (LARGURA - 16) : dir > 0 ? -t.tam * 2 : LARGURA + t.tam * 2;
  const vel = t.vel * (t.lixo ? 1 : nivelCfg.vel) * (0.8 + aleatorio() * 0.4);
  return { id: proximoId++, tipo, x, y, y0: y, vx: dir * vel, fase: aleatorio() * Math.PI * 2 };
}

export function novaRodada(nivel = 'facil', aleatorio = Math.random) {
  const cfg = NIVEIS[nivel] ?? NIVEIS.facil;
  const bichos = [];
  for (let k = 0; k < cfg.peixes; k++) bichos.push(criar(sortearTipo(aleatorio), cfg, aleatorio, true));
  const nomesLixo = Object.keys(LIXOS);
  for (let k = 0; k < cfg.lixo; k++) bichos.push(criar(nomesLixo[k % nomesLixo.length], cfg, aleatorio, true));
  return {
    nivel: NIVEIS[nivel] ? nivel : 'facil', meta: cfg.meta, restante: DURACAO, pontos: 0, comecou: false, acabou: false,
    barco: LARGURA / 2, alvo: LARGURA / 2, anzol: 0, segurando: false, preso: null, bichos,
    pescados: {}, // contagem por tipo
  };
}

const PONTA_LINHA = 0; // anzol fica no x do barco
export const xDoAnzol = (r) => r.barco + PONTA_LINHA;

// Encosta? (caixa elíptica em volta do bicho)
export function encosta(b, x, y) {
  const t = todos(b.tipo);
  const dx = (x - b.x) / (t.tam * 1.15); const dy = (y - b.y) / (t.tam * 0.8);
  return dx * dx + dy * dy <= 1;
}

// Avança a rodada `dt` segundos. Devolve a lista de acontecimentos:
// { tipo: 'fisgou', bicho } | { tipo: 'pescou', bicho, pontos } | { tipo: 'fim' }.
export function passo(r, dt, aleatorio = Math.random) {
  const eventos = [];
  if (r.acabou || !r.comecou) return eventos;
  dt = Math.min(dt, 0.1);
  const cfg = NIVEIS[r.nivel];
  r.restante = Math.max(0, r.restante - dt);

  // barco atrás do dedo
  const d = r.alvo - r.barco;
  const mov = Math.sign(d) * Math.min(Math.abs(d), VEL_BARCO * dt);
  r.barco = Math.min(LARGURA - 6, Math.max(6, r.barco + mov));

  // anzol
  if (r.preso) r.anzol = Math.max(0, r.anzol - VEL_SOBE_COM_PEIXE * dt);
  else if (r.segurando) r.anzol = Math.min(FUNDO - 3, r.anzol + VEL_DESCE * dt);
  else r.anzol = Math.max(0, r.anzol - VEL_SOBE * dt);

  // bichos nadando
  for (let k = r.bichos.length - 1; k >= 0; k--) {
    const b = r.bichos[k];
    if (r.preso && r.preso.id === b.id) continue;
    b.fase += dt * (todos(b.tipo).lixo ? 1.2 : 3);
    b.x += b.vx * dt;
    b.y = b.y0 + Math.sin(b.fase) * (todos(b.tipo).lixo ? 1.2 : 2);
    const t = todos(b.tipo);
    if (b.x < -t.tam * 3 || b.x > LARGURA + t.tam * 3) {
      // saiu do lago: o lixo volta do outro lado, o peixe dá lugar a outro sorteado
      const novo = criar(t.lixo ? b.tipo : sortearTipo(aleatorio), cfg, aleatorio);
      r.bichos[k] = novo;
    }
  }

  // fisgar
  if (!r.preso && r.anzol > 4) {
    const x = xDoAnzol(r);
    const b = r.bichos.find((q) => encosta(q, x, r.anzol));
    if (b) { r.preso = { ...b }; r.bichos = r.bichos.filter((q) => q.id !== b.id); eventos.push({ tipo: 'fisgou', bicho: r.preso }); }
  }
  if (r.preso) { r.preso.x = xDoAnzol(r); r.preso.y = r.anzol + todos(r.preso.tipo).tam * 0.6; }

  // chegou no barco
  if (r.preso && r.anzol <= 0) {
    const b = r.preso;
    const t = todos(b.tipo);
    r.pontos = Math.max(0, r.pontos + t.pontos);
    r.pescados[b.tipo] = (r.pescados[b.tipo] ?? 0) + 1;
    r.preso = null;
    r.bichos.push(criar(t.lixo ? b.tipo : sortearTipo(aleatorio), cfg, aleatorio));
    eventos.push({ tipo: 'pescou', bicho: b, pontos: t.pontos });
  }

  if (r.restante <= 0) { r.acabou = true; r.segurando = false; eventos.push({ tipo: 'fim' }); }
  return eventos;
}

export const venceu = (r) => r.pontos >= r.meta;

// Maior pontuação guardada no histórico.
export function recorde(historico, nivel) {
  let m = 0;
  for (const h of historico) if (h.j === 'pescaria' && (!nivel || h.n === nivel) && h.pontos > m) m = h.pontos;
  return m;
}
