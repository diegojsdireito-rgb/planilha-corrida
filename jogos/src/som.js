// Sons gerados na hora com Web Audio: nenhum arquivo de áudio para baixar.
import { prefs } from './dados.js';

let ctx = null;

function contexto() {
  if (!prefs.som) return null;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { return null; }
  return ctx;
}

// Chamado no primeiro toque: o iPhone só libera o áudio depois de um gesto.
export function destravar() { contexto(); }

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
