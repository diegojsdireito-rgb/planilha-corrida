// Sons gerados na hora com Web Audio: nenhum arquivo de áudio para baixar.
import { prefs } from './dados.js';

let ctx = null;
let liberado = false;
let audioMudo = null;

function contexto() {
  if (!prefs.som) return null;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    // no iPhone o áudio fica "suspended" ou "interrupted" (depois de ligação ou de sair do app)
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
  } catch { return null; }
  return ctx;
}

// Um <audio> tocando silêncio põe a página no modo "mídia": no iPhone antigo, é o que faz
// o som tocar mesmo com a chave lateral no silencioso.
function silencioEmLaco() {
  if (audioMudo) return audioMudo;
  const taxa = 8000; const n = taxa / 2;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const txt = (o, t) => [...t].forEach((ch, k) => v.setUint8(o + k, ch.charCodeAt(0)));
  txt(0, 'RIFF'); v.setUint32(4, 36 + n, true); txt(8, 'WAVE'); txt(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, taxa, true);
  v.setUint32(28, taxa, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); txt(36, 'data'); v.setUint32(40, n, true);
  for (let k = 0; k < n; k++) v.setUint8(44 + k, 128);
  audioMudo = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
  audioMudo.loop = true;
  audioMudo.setAttribute('playsinline', '');
  return audioMudo;
}

// Chamado a cada toque: o iPhone só libera o áudio dentro de um gesto da pessoa.
export function destravar() {
  if (!prefs.som) return;
  // Safari 16.4 em diante: som do jogo como mídia, que toca mesmo no modo silencioso
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch { /* sem suporte */ }
  const c = contexto();
  if (!c) return;
  if (liberado && c.state === 'running') return;
  try {
    // tocar um silêncio curtinho dentro do gesto é o que destrava o áudio no iPhone
    const b = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = b;
    src.connect(c.destination);
    src.start(0);
  } catch { /* nada */ }
  if (!navigator.audioSession) silencioEmLaco().play().catch(() => {});
  liberado = c.state === 'running';
}

// Para conferir em testes e no aparelho.
export const estadoDoAudio = () => ({ ligado: prefs.som, contexto: ctx?.state ?? 'nenhum', sessao: navigator.audioSession?.type ?? 'sem suporte' });

function tom(c, freq, inicio, dur, { tipo = 'sine', vol = 0.18, ate = null } = {}) {
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + inicio;
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  if (ate) o.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function ruido(c, inicio, dur, { vol = 0.25, freq = 2500 } = {}) {
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start(c.currentTime + inicio);
}

const SONS = {
  clique: (c) => tom(c, 660, 0, 0.05, { tipo: 'triangle', vol: 0.08 }),
  mover: (c) => { tom(c, 420, 0, 0.09, { tipo: 'sine', vol: 0.2, ate: 300 }); ruido(c, 0, 0.03, { vol: 0.15, freq: 1800 }); },
  robo: (c) => { tom(c, 340, 0, 0.09, { tipo: 'sine', vol: 0.18, ate: 240 }); ruido(c, 0, 0.03, { vol: 0.12, freq: 1400 }); },
  captura: (c) => { ruido(c, 0, 0.08, { vol: 0.35, freq: 900 }); tom(c, 260, 0, 0.16, { tipo: 'square', vol: 0.06, ate: 130 }); },
  dado: (c) => { for (let k = 0; k < 5; k++) ruido(c, k * 0.055, 0.035, { vol: 0.3, freq: 3000 + k * 300 }); },
  passo: (c) => tom(c, 900, 0, 0.035, { tipo: 'triangle', vol: 0.05 }),
  carta: (c) => ruido(c, 0, 0.07, { vol: 0.3, freq: 4200 }),
  xeque: (c) => { tom(c, 880, 0, 0.09, { tipo: 'square', vol: 0.06 }); tom(c, 880, 0.12, 0.09, { tipo: 'square', vol: 0.06 }); },
  moeda: (c) => { tom(c, 1318, 0, 0.06, { tipo: 'square', vol: 0.05 }); tom(c, 1760, 0.05, 0.12, { tipo: 'square', vol: 0.05 }); },
  superpulo: (c) => tom(c, 300, 0, 0.3, { tipo: 'triangle', vol: 0.16, ate: 1200 }),
  voo: (c) => { ruido(c, 0, 0.5, { vol: 0.25, freq: 600 }); tom(c, 200, 0, 0.5, { tipo: 'sawtooth', vol: 0.05, ate: 500 }); },
  turbo: (c) => { tom(c, 220, 0, 0.45, { tipo: 'sawtooth', vol: 0.07, ate: 880 }); tom(c, 660, 0.3, 0.3, { tipo: 'triangle', vol: 0.12 }); },
  skate: (c) => { ruido(c, 0, 0.2, { vol: 0.2, freq: 1200 }); tom(c, 520, 0, 0.15, { tipo: 'triangle', vol: 0.12, ate: 780 }); },
  quebra: (c) => ruido(c, 0, 0.18, { vol: 0.4, freq: 500 }),
  decolar: (c) => { ruido(c, 0, 0.6, { vol: 0.35, freq: 900 }); tom(c, 120, 0, 0.6, { tipo: 'sawtooth', vol: 0.08, ate: 420 }); tom(c, 660, 0.15, 0.25, { tipo: 'triangle', vol: 0.1, ate: 990 }); },
  // capa: fanfarra de super-heroína subindo
  heroi: (c) => {
    [392, 523, 659, 784].forEach((f, k) => tom(c, f, k * 0.09, 0.22, { tipo: 'square', vol: 0.06 }));
    tom(c, 1046, 0.36, 0.5, { tipo: 'triangle', vol: 0.14 });
    ruido(c, 0, 0.5, { vol: 0.18, freq: 1500 });
  },
  'pouso-heroi': (c) => { tom(c, 784, 0, 0.12, { tipo: 'triangle', vol: 0.12 }); tom(c, 523, 0.1, 0.25, { tipo: 'triangle', vol: 0.12 }); },
  // nave: o feixe de teletransporte, um "uííu" de ficção científica
  teletransporte: (c) => {
    tom(c, 300, 0, 0.7, { tipo: 'sine', vol: 0.16, ate: 1800 });
    tom(c, 1800, 0.05, 0.6, { tipo: 'sine', vol: 0.06, ate: 300 });
    for (let k = 0; k < 8; k++) tom(c, 1400 + k * 180, k * 0.06, 0.06, { tipo: 'triangle', vol: 0.05 });
  },
  'pouso-jato': (c) => { ruido(c, 0, 0.25, { vol: 0.3, freq: 300 }); tom(c, 180, 0, 0.2, { tipo: 'sine', vol: 0.2, ate: 90 }); },
  dobro: (c) => [523, 784, 1046, 1568].forEach((f, k) => tom(c, f, k * 0.06, 0.16, { tipo: 'square', vol: 0.05 })),
  bau: (c) => { for (let k = 0; k < 9; k++) tom(c, 1200 + (k % 4) * 260, k * 0.045, 0.08, { tipo: 'square', vol: 0.04 }); ruido(c, 0, 0.12, { vol: 0.2, freq: 3000 }); },
  item: (c) => { tom(c, 880, 0, 0.08, { tipo: 'triangle', vol: 0.14 }); tom(c, 1320, 0.07, 0.14, { tipo: 'triangle', vol: 0.14 }); },
  'poder-fim': (c) => tom(c, 700, 0, 0.18, { tipo: 'triangle', vol: 0.08, ate: 350 }),
  apito: (c) => { for (const [ini, dur] of [[0, 0.18], [0.24, 0.42]]) { tom(c, 2900, ini, dur, { tipo: 'sine', vol: 0.12 }); tom(c, 3050, ini, dur, { tipo: 'sine', vol: 0.06 }); } },
  rugido: (c) => { ruido(c, 0, 0.9, { vol: 0.4, freq: 260 }); tom(c, 160, 0, 0.9, { tipo: 'sawtooth', vol: 0.12, ate: 75 }); tom(c, 110, 0.05, 0.8, { tipo: 'square', vol: 0.05, ate: 60 }); },
  urso: (c) => { ruido(c, 0, 0.6, { vol: 0.35, freq: 200 }); tom(c, 120, 0, 0.6, { tipo: 'sawtooth', vol: 0.1, ate: 70 }); },
  panda: (c) => { tom(c, 520, 0, 0.18, { tipo: 'triangle', vol: 0.16, ate: 760 }); tom(c, 640, 0.2, 0.22, { tipo: 'triangle', vol: 0.14, ate: 480 }); },
  caranguejo: (c) => { for (let k = 0; k < 4; k++) { ruido(c, k * 0.09, 0.03, { vol: 0.45, freq: 2600 }); tom(c, 1400, k * 0.09, 0.03, { tipo: 'square', vol: 0.05 }); } },
  // Docinhos: bônus e obstáculos novos
  explosao: (c) => { ruido(c, 0, 0.5, { vol: 0.5, freq: 380 }); tom(c, 140, 0, 0.45, { tipo: 'sawtooth', vol: 0.1, ate: 45 }); tom(c, 880, 0.05, 0.12, { tipo: 'triangle', vol: 0.08, ate: 1500 }); },
  foguete: (c) => { ruido(c, 0, 0.45, { vol: 0.3, freq: 1600 }); tom(c, 300, 0, 0.45, { tipo: 'sawtooth', vol: 0.06, ate: 1800 }); tom(c, 1568, 0.35, 0.15, { tipo: 'triangle', vol: 0.1 }); },
  listra: (c) => [880, 1175, 1568].forEach((f, k) => tom(c, f, k * 0.05, 0.1, { tipo: 'square', vol: 0.04, ate: f * 1.2 })),
  derrete: (c) => { tom(c, 900, 0, 0.6, { tipo: 'sine', vol: 0.12, ate: 260 }); for (let k = 0; k < 4; k++) tom(c, 1400 - k * 180, 0.12 + k * 0.1, 0.07, { tipo: 'sine', vol: 0.08 }); },
  pincel: (c) => { ruido(c, 0, 0.25, { vol: 0.25, freq: 3800 }); [659, 784, 988, 1319].forEach((f, k) => tom(c, f, 0.08 + k * 0.06, 0.12, { tipo: 'triangle', vol: 0.1 })); },
  presente: (c) => { ruido(c, 0, 0.1, { vol: 0.3, freq: 2400 }); [784, 1046, 1319, 1568, 2093].forEach((f, k) => tom(c, f, 0.06 + k * 0.05, 0.14, { tipo: 'triangle', vol: 0.11 })); },
  cereja: (c) => { tom(c, 523, 0, 0.1, { tipo: 'triangle', vol: 0.16 }); tom(c, 784, 0.09, 0.1, { tipo: 'triangle', vol: 0.16 }); tom(c, 1046, 0.18, 0.22, { tipo: 'triangle', vol: 0.16 }); },
  chocolate: (c) => { tom(c, 220, 0, 0.25, { tipo: 'sine', vol: 0.2, ate: 150 }); ruido(c, 0.02, 0.12, { vol: 0.15, freq: 500 }); },
  corrente: (c) => { for (let k = 0; k < 3; k++) { tom(c, 2200 + k * 300, k * 0.05, 0.05, { tipo: 'square', vol: 0.035 }); ruido(c, k * 0.05, 0.03, { vol: 0.2, freq: 5000 }); } },
  caixa: (c) => { ruido(c, 0, 0.08, { vol: 0.3, freq: 1200 }); tom(c, 660, 0.03, 0.12, { tipo: 'triangle', vol: 0.12, ate: 990 }); },
  premio: (c) => [784, 988, 1175, 1568, 1976].forEach((f, k) => tom(c, f, k * 0.07, 0.18, { tipo: 'triangle', vol: 0.14 })),
  acerto: (c) => tom(c, 1046, 0, 0.12, { tipo: 'sine', vol: 0.12 }),
  erro: (c) => tom(c, 180, 0, 0.22, { tipo: 'sawtooth', vol: 0.07, ate: 120 }),
  vitoria: (c) => [523, 659, 784, 1046].forEach((f, k) => tom(c, f, k * 0.11, k === 3 ? 0.45 : 0.14, { tipo: 'triangle', vol: 0.2 })),
  derrota: (c) => [392, 330, 262].forEach((f, k) => tom(c, f, k * 0.16, k === 2 ? 0.5 : 0.18, { tipo: 'triangle', vol: 0.18 })),
  empate: (c) => { tom(c, 523, 0, 0.18, { tipo: 'triangle' }); tom(c, 523, 0.2, 0.3, { tipo: 'triangle' }); },
};

export function tocar(nome) {
  const c = contexto();
  if (!c || !SONS[nome]) return;
  try { SONS[nome](c); } catch { /* áudio indisponível */ }
}

// ---------- Sons contínuos: o ronco da mochila a jato e o ambiente de cada cenário ----------
function ruidoEmLaco(c, segundos = 2) {
  const n = Math.floor(c.sampleRate * segundos);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < n; i++) { ultimo = ultimo * 0.97 + (Math.random() * 2 - 1) * 0.3; d[i] = ultimo; } // ruído "marrom", mais grave
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

// Cada laço devolve uma função que o desliga suavemente.
function montarLaco(c, volume, ligar) {
  const saida = c.createGain();
  saida.gain.setValueAtTime(0.0001, c.currentTime);
  saida.gain.exponentialRampToValueAtTime(volume, c.currentTime + 0.4);
  saida.connect(c.destination);
  const partes = [];
  const timers = [];
  ligar(saida, partes, timers);
  return () => {
    const t = c.currentTime;
    saida.gain.cancelScheduledValues(t);
    saida.gain.setValueAtTime(Math.max(0.0001, saida.gain.value), t);
    saida.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    timers.forEach(clearInterval);
    setTimeout(() => { partes.forEach((p) => { try { p.stop(); } catch { /* já parou */ } }); saida.disconnect(); }, 450);
  };
}

function filtro(c, tipo, freq, q = 0.8) { const f = c.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; f.Q.value = q; return f; }

function oscilar(c, alvo, freq, profundidade, partes) {
  const lfo = c.createOscillator(); const g = c.createGain();
  lfo.frequency.value = freq; g.gain.value = profundidade;
  lfo.connect(g).connect(alvo); lfo.start(); partes.push(lfo);
}

const LACOS = {
  jato: (c) => montarLaco(c, 0.22, (saida, partes) => {
    const r = ruidoEmLaco(c); const f = filtro(c, 'bandpass', 650, 0.6); const g = c.createGain(); g.gain.value = 1;
    r.connect(f).connect(g).connect(saida); r.start(); partes.push(r);
    oscilar(c, g.gain, 11, 0.25, partes); // tremor do jato
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 72; const go = c.createGain(); go.gain.value = 0.12;
    o.connect(filtro(c, 'lowpass', 300)).connect(go).connect(saida); o.start(); partes.push(o);
  }),
  // vento forte enquanto voa de capa
  capa: (c) => montarLaco(c, 0.16, (saida, partes) => {
    const r = ruidoEmLaco(c, 3); const f = filtro(c, 'bandpass', 900, 0.5); const g = c.createGain(); g.gain.value = 0.8;
    r.connect(f).connect(g).connect(saida); r.start(); partes.push(r);
    oscilar(c, f.frequency, 0.6, 400, partes);
    oscilar(c, g.gain, 3.2, 0.25, partes); // a capa tremulando
  }),
  // zumbido da nave: tom grave com um "uóuóuó" de disco voador
  nave: (c) => montarLaco(c, 0.12, (saida, partes) => {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 180; const g = c.createGain(); g.gain.value = 0.7;
    o.connect(g).connect(saida); o.start(); partes.push(o);
    oscilar(c, o.frequency, 5, 40, partes);
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 90; const g2 = c.createGain(); g2.gain.value = 0.35;
    o2.connect(g2).connect(saida); o2.start(); partes.push(o2);
    oscilar(c, g2.gain, 0.7, 0.2, partes);
  }),
  cidade: (c) => montarLaco(c, 0.06, (saida, partes, timers) => {
    const r = ruidoEmLaco(c); r.connect(filtro(c, 'lowpass', 260)).connect(saida); r.start(); partes.push(r);
    timers.push(setInterval(() => { if (Math.random() < 0.35) tocarNo(c, saida, (cc, s2) => carroPassando(cc, s2)); }, 2500));
  }),
  praia: (c) => montarLaco(c, 0.12, (saida, partes, timers) => {
    const r = ruidoEmLaco(c, 3); const f = filtro(c, 'lowpass', 700); const g = c.createGain(); g.gain.value = 0.55;
    r.connect(f).connect(g).connect(saida); r.start(); partes.push(r);
    oscilar(c, g.gain, 0.13, 0.45, partes); // ondas indo e vindo
    timers.push(setInterval(() => { if (Math.random() < 0.3) tocarNo(c, saida, gaivota); }, 3000));
  }),
  floresta: (c) => montarLaco(c, 0.1, (saida, partes, timers) => {
    const r = ruidoEmLaco(c); const g = c.createGain(); g.gain.value = 0.25;
    r.connect(filtro(c, 'bandpass', 500, 0.4)).connect(g).connect(saida); r.start(); partes.push(r);
    timers.push(setInterval(() => { if (Math.random() < 0.7) tocarNo(c, saida, passarinho); }, 1300));
  }),
  neve: (c) => montarLaco(c, 0.1, (saida, partes, timers) => {
    const r = ruidoEmLaco(c, 3); const f = filtro(c, 'bandpass', 600, 1.2);
    r.connect(f).connect(saida); r.start(); partes.push(r);
    oscilar(c, f.frequency, 0.2, 350, partes); // vento assoviando
    timers.push(setInterval(() => { if (Math.random() < 0.25) tocarNo(c, saida, sininho); }, 3500));
  }),
};

function tocarNo(c, saida, som) { try { som(c, saida); } catch { /* nada */ } }

function bip(c, saida, freq, inicio, dur, { tipo = 'sine', vol = 0.3, ate = null } = {}) {
  const o = c.createOscillator(); const g = c.createGain(); const t0 = c.currentTime + inicio;
  o.type = tipo; o.frequency.setValueAtTime(freq, t0); if (ate) o.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(saida); o.start(t0); o.stop(t0 + dur + 0.05);
}
const passarinho = (c, s) => { const f = 2400 + Math.random() * 1600; for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) bip(c, s, f, k * 0.12, 0.08, { vol: 0.5, ate: f * 1.4 }); };
const gaivota = (c, s) => { bip(c, s, 1400, 0, 0.35, { tipo: 'triangle', vol: 0.35, ate: 900 }); bip(c, s, 1300, 0.4, 0.3, { tipo: 'triangle', vol: 0.3, ate: 850 }); };
const sininho = (c, s) => [1568, 2093].forEach((f, k) => bip(c, s, f, k * 0.15, 0.6, { vol: 0.25 }));
const carroPassando = (c, s) => {
  const o = c.createOscillator(); o.type = 'sawtooth'; const g = c.createGain(); const t0 = c.currentTime;
  o.frequency.setValueAtTime(90, t0); o.frequency.linearRampToValueAtTime(70, t0 + 1.4);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
  o.connect(filtro(c, 'lowpass', 400)).connect(g).connect(s); o.start(t0); o.stop(t0 + 1.5);
};

const ligados = new Map();
export function ligarLaco(nome) {
  if (ligados.has(nome)) return;
  const c = contexto();
  if (!c || !LACOS[nome]) return;
  try { ligados.set(nome, LACOS[nome](c)); } catch { /* áudio indisponível */ }
}
export function desligarLaco(nome) {
  ligados.get(nome)?.();
  ligados.delete(nome);
}
export function desligarLacos() { for (const nome of [...ligados.keys()]) desligarLaco(nome); }
export const lacoLigado = (nome) => ligados.has(nome);
