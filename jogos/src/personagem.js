// A personagem dos jogos de ação: uma menina de uns 7 ou 8 anos, cabelo castanho e cacheado.
// Tom de pele e cor da roupa são escolhidos pela pessoa.

export const PELES = ['#f6d3b3', '#e8b48a', '#c68a5e', '#8d5a3b'];
export const ROUPAS = ['#ffb020', '#ff6f91', '#3fb6a8', '#7b6cf6'];
const CABELO = '#6b3a1f';
const CABELO_ESCURO = '#4a2412';
const CABELO_BRILHO = '#94562e';

const escurecer = (hex, f = 0.82) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `rgb(${c.join(',')})`;
};

// Cachos em volta da cabeça: círculos em anel, com contorno escuro para dar volume.
function cachosSvg(cx, cy, raio, n, r, cor = CABELO) {
  return Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * raio;
    const y = cy + Math.sin(a) * raio * 0.95;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${cor}" stroke="${CABELO_ESCURO}" stroke-width="1.2"/><path d="M${(x - r * 0.4).toFixed(1)} ${(y - r * 0.2).toFixed(1)} a${(r * 0.45).toFixed(1)} ${(r * 0.45).toFixed(1)} 0 1 1 ${(r * 0.5).toFixed(1)} ${(r * 0.5).toFixed(1)}" fill="none" stroke="${CABELO_BRILHO}" stroke-width="1.1" stroke-linecap="round"/>`;
  }).join('');
}

// Franja: cachos só no alto da testa, num arco, deixando olhos e sobrancelhas à mostra.
function franja() {
  return `<path d="M29 46 Q30 28 50 27 Q70 28 71 46 Q60 38 50 38 Q40 38 29 46 Z" fill="${CABELO}"/>` + Array.from({ length: 7 }, (_, k) => {
    const a = Math.PI * (1.2 + (k / 6) * 0.6);
    const x = 50 + Math.cos(a) * 21;
    const y = 50 + Math.sin(a) * 22;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7.5" fill="${CABELO}" stroke="${CABELO_ESCURO}" stroke-width="1.2"/><path d="M${(x - 3).toFixed(1)} ${(y - 1).toFixed(1)} a3.4 3.4 0 1 1 3.8 3.8" fill="none" stroke="${CABELO_BRILHO}" stroke-width="1.1" stroke-linecap="round"/>`;
  }).join('');
}

// Retrato de frente, em SVG (viewBox 0 0 100 100).
export function retrato({ pele = 1, roupa = 0, sorriso = 'feliz' } = {}) {
  const tom = PELES[pele] ?? PELES[1];
  const cor = ROUPAS[roupa] ?? ROUPAS[0];
  const boca = sorriso === 'uau'
    ? '<ellipse cx="50" cy="66" rx="4" ry="5" fill="#7a2a2a"/>'
    : '<path d="M42 63 Q50 71 58 63" fill="#fff" stroke="#7a2a2a" stroke-width="2.2" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A menina de cabelo cacheado">
    <path d="M18 100 Q20 80 50 78 Q80 80 82 100 Z" fill="${cor}"/>
    <path d="M40 80 Q50 88 60 80" fill="none" stroke="${escurecer(cor)}" stroke-width="2"/>
    <rect x="44" y="70" width="12" height="11" rx="4" fill="${tom}"/>
    ${cachosSvg(50, 50, 31, 16, 11, CABELO_ESCURO)}
    ${cachosSvg(50, 48, 27, 14, 11)}
    ${[[22, 66], [20, 77], [78, 66], [80, 77]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${CABELO}" stroke="${CABELO_ESCURO}" stroke-width="1.2"/>`).join('')}
    <ellipse cx="29" cy="54" rx="4" ry="5.5" fill="${tom}"/><ellipse cx="71" cy="54" rx="4" ry="5.5" fill="${tom}"/>
    <ellipse cx="50" cy="52" rx="21" ry="22" fill="${tom}"/>
    ${franja(tom)}
    <circle cx="66" cy="27" r="6" fill="${cor}"/><circle cx="74" cy="25" r="5" fill="${cor}"/><circle cx="69" cy="26" r="3" fill="${escurecer(cor, 0.7)}"/>
    <path d="M37 45 q5 -4 10 -1 M53 44 q5 -3 10 1" fill="none" stroke="${CABELO_ESCURO}" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="42" cy="53" rx="3.6" ry="4.6" fill="#2b1a12"/><ellipse cx="58" cy="53" rx="3.6" ry="4.6" fill="#2b1a12"/>
    <circle cx="43.3" cy="51.4" r="1.4" fill="#fff"/><circle cx="59.3" cy="51.4" r="1.4" fill="#fff"/>
    <ellipse cx="35" cy="61" rx="4.5" ry="2.8" fill="#ff8a8a" opacity=".45"/><ellipse cx="65" cy="61" rx="4.5" ry="2.8" fill="#ff8a8a" opacity=".45"/>
    <path d="M49 57 q1 2 2 0" fill="none" stroke="${escurecer(tom, 0.7)}" stroke-width="1.4" stroke-linecap="round"/>
    ${boca}
  </svg>`;
}

// Desenho de costas, correndo, num canvas. (x, y) é o ponto entre os pés; u é o tamanho de 1 unidade do mundo em px.
// fase: ciclo da corrida em radianos. pulo: altura em unidades. deslizando: 0..1.
export function desenharDeCostas(ctx, x, y, u, { fase = 0, pulo = 0, deslizando = 0, pele = 1, roupa = 0, piscando = false } = {}) {
  const tom = PELES[pele] ?? PELES[1];
  const cor = ROUPAS[roupa] ?? ROUPAS[0];
  ctx.save();
  // sombra no chão, menor quando ela está no alto
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, u * 0.32 / (1 + pulo * 0.4), u * 0.08 / (1 + pulo * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
  if (piscando) ctx.globalAlpha = 0.45;
  ctx.translate(x, y - pulo * u);
  if (deslizando > 0) {
    ctx.rotate(-0.12);
    ctx.scale(1.08, 0.55);
  }
  const s = u;
  const balanco = pulo > 0 ? 0.6 : Math.sin(fase);
  const quique = pulo > 0 || deslizando > 0 ? 0 : Math.abs(Math.cos(fase)) * 0.04 * s;
  ctx.translate(0, -quique);

  const membro = (x0, y0, x1, y1, largura, cor_) => {
    ctx.strokeStyle = cor_;
    ctx.lineWidth = largura;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  // pernas e tênis
  const passo = balanco * 0.12 * s;
  for (const lado of [-1, 1]) {
    const frente = lado * passo;
    const ergue = Math.max(0, lado * balanco) * 0.1 * s;
    membro(lado * 0.09 * s, -0.42 * s, lado * 0.1 * s, -0.08 * s - ergue, 0.11 * s, tom);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(lado * 0.1 * s, -0.05 * s - ergue + frente * 0.2, 0.08 * s, 0.055 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cor;
    ctx.fillRect(lado * 0.1 * s - 0.07 * s, -0.06 * s - ergue + frente * 0.2, 0.14 * s, 0.025 * s);
  }
  // braços balançando
  for (const lado of [-1, 1]) {
    const vai = -lado * balanco * 0.14 * s;
    membro(lado * 0.17 * s, -0.8 * s, lado * 0.26 * s, -0.58 * s + vai, 0.085 * s, tom);
  }
  // vestido
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(-0.16 * s, -0.86 * s);
  ctx.lineTo(0.16 * s, -0.86 * s);
  ctx.lineTo(0.25 * s, -0.4 * s);
  ctx.quadraticCurveTo(0, -0.34 * s, -0.25 * s, -0.4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = escurecer(cor);
  ctx.fillRect(-0.2 * s, -0.6 * s, 0.4 * s, 0.035 * s);
  // pescoço
  ctx.fillStyle = tom;
  ctx.fillRect(-0.05 * s, -0.94 * s, 0.1 * s, 0.1 * s);
  // cabelo cacheado: nuvem de cachos e cachinhos caindo nos ombros
  const cacho = (cx, cy, r, cor_ = CABELO) => {
    ctx.fillStyle = cor_;
    ctx.strokeStyle = CABELO_ESCURO;
    ctx.lineWidth = Math.max(1, s * 0.012);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = CABELO_BRILHO;
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy - r * 0.1, r * 0.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  };
  const cy = -1.12 * s;
  const vento = balanco * 0.02 * s;
  for (const [dx, dy, r] of [[-0.21, 0.17, 0.08], [0.21, 0.17, 0.08], [-0.2, 0.29, 0.07], [0.2, 0.29, 0.07], [-0.14, 0.24, 0.08], [0.14, 0.24, 0.08]]) {
    cacho(dx * s + vento, cy + dy * s, r * s, CABELO_ESCURO);
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    cacho(Math.cos(a) * 0.2 * s, cy + Math.sin(a) * 0.19 * s, 0.1 * s);
  }
  for (const [dx, dy] of [[-0.07, -0.06], [0.07, -0.06], [0, 0.06], [-0.1, 0.08], [0.1, 0.08], [0, -0.12]]) cacho(dx * s, cy + dy * s, 0.1 * s);
  for (const [dx, dy] of [[-0.21, 0.2], [0.21, 0.2], [-0.15, 0.28], [0.15, 0.28]]) cacho(dx * s - vento, cy + dy * s, 0.075 * s);
  // laço
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.ellipse(-0.06 * s, cy - 0.2 * s, 0.07 * s, 0.045 * s, -0.4, 0, Math.PI * 2);
  ctx.ellipse(0.06 * s, cy - 0.2 * s, 0.07 * s, 0.045 * s, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = escurecer(cor, 0.7);
  ctx.beginPath();
  ctx.arc(0, cy - 0.2 * s, 0.03 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
