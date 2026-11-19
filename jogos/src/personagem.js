// A personagem dos jogos de ação: uma menina de uns 7 ou 8 anos, de cabelo castanho-escuro,
// comprido e ondulado, repartido no meio, brincos de argola e moletom com estrelas.
// Tom de pele e cor da roupa são escolhidos pela pessoa.
// O volume vem de luz e sombra: a luz vem do alto, à esquerda.

export const PELES = ['#f6d3b3', '#e8b48a', '#c68a5e', '#8d5a3b'];
export const ROUPAS = ['#ff8a1f', '#ff4f81', '#16b3a0', '#6b5cf0'];
const CABELO = ['#5b3a26', '#3a2417', '#22140c']; // luz, base, sombra
const SHORT = ['#4a5068', '#2f3446', '#1d2130'];

function mistura(hex, alvo, t) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(alvo.slice(1), 16);
  const c = [16, 8, 0].map((d) => Math.round(((a >> d) & 255) * (1 - t) + ((b >> d) & 255) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
const clarear = (hex, t = 0.25) => mistura(hex, '#ffffff', t);
const escurecer = (hex, t = 0.25) => mistura(hex, '#000000', t);

let serie = 0;

// Roupa do retrato (do peito para baixo) em cada estilo.
function roupaDoRetrato(estilo, cor, id) {
  const ombros = 'M14 100 C15 88 24 81 40 79 Q50 85 60 79 C76 81 85 88 86 100Z';
  if (estilo === 'moletom') {
    const marinho = '#1f2a52';
    return `<path d="${ombros}" fill="#f6f4ee"/>
      <path d="M40 79 C28 80 18 85 14 100 L27 100 C29 92 35 86 43 82Z" fill="${marinho}"/>
      <path d="M60 79 C72 80 82 85 86 100 L73 100 C71 92 65 86 57 82Z" fill="${marinho}"/>
      <path d="M40 79 Q50 86 60 79" fill="none" stroke="#e8e5dc" stroke-width="2.6" stroke-linecap="round"/>
      <text x="19" y="96" font-size="7" fill="#fff" transform="rotate(-25 19 96)">★</text>
      <text x="77" y="96" font-size="7" fill="#fff" transform="rotate(25 77 96)">★</text>
      <text x="50" y="103" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="20" fill="${marinho}">9</text>`;
  }
  if (estilo === 'street') {
    return `<path d="M24 86 Q50 70 76 86 L74 92 Q50 80 26 92Z" fill="${escurecer(cor, 0.2)}"/>
      <path d="${ombros}" fill="url(#${id('roupa')})"/>
      <path d="M40 79 Q50 88 60 79" fill="none" stroke="${escurecer(cor, 0.25)}" stroke-width="3"/>
      <path d="M45 84 L44 96 M55 84 L56 96" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  if (estilo === 'skatista') {
    return `<path d="M11 100 C12 87 23 80 40 78 Q50 84 60 78 C77 80 88 87 89 100Z" fill="${clarear(cor, 0.75)}"/>
      <path d="M40 78 Q50 85 60 78" fill="none" stroke="${cor}" stroke-width="3"/>
      <text x="50" y="97" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="9" fill="#1d1b18">SK8</text>`;
  }
  if (estilo === 'jeans') {
    return `<path d="${ombros}" fill="#4a6fa5"/>
      <path d="M40 79 L50 100 L60 79 Q50 86 40 79Z" fill="${cor}"/>
      <path d="M36 78 L44 90 L40 79Z M64 78 L56 90 L60 79Z" fill="#3b5d91"/>
      <path d="M22 88 L28 100 M78 88 L72 100" stroke="#e8a33a" stroke-width="1" stroke-dasharray="2 2"/>
      <text x="28" y="96" font-size="7">★</text>`;
  }
  if (estilo === 'tiedye') {
    return `<path d="${ombros}" fill="url(#${id('tie')})"/>
      <path d="M40 79 Q50 86 60 79" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  return `<path d="${ombros}" fill="url(#${id('roupa')})"/>
    <path d="M40 79 Q50 86 60 79" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M24 84 L34 100 M76 84 L66 100" stroke="#fff" stroke-width="2.4" opacity=".9"/>`;
}

// O que vai na cabeça em cada estilo.
function chapeuDoRetrato(estilo, cor) {
  if (estilo === 'skatista') {
    return `<path d="M27 40 C27 22 38 15 50 15 C62 15 73 22 73 40 Q50 31 27 40Z" fill="#1d2130"/>
      <path d="M62 19 Q76 14 84 22 Q74 22 66 26Z" fill="${cor}"/>
      <circle cx="50" cy="15.5" r="2.2" fill="${cor}"/>`;
  }
  if (estilo === 'jeans') {
    return `<path d="M26 42 C25 22 37 13 50 13 C63 13 75 22 74 42Z" fill="${cor}"/>
      <rect x="25" y="36" width="50" height="8" rx="4" fill="#fff"/>
      <circle cx="50" cy="11" r="6" fill="#fff"/>
      <path d="M33 30 v6 M41 26 v8 M50 25 v9 M59 26 v8 M67 30 v6" stroke="${escurecer(cor, 0.2)}" stroke-width="1.2"/>`;
  }
  if (estilo === 'tiedye') {
    return `<path d="M29 39 Q50 30 71 39" fill="none" stroke="${cor}" stroke-width="4" stroke-linecap="round"/>
      <path d="M33 38 Q50 44 67 38 Q60 47 50 47 Q40 47 33 38Z" fill="${cor}" opacity=".9"/>`;
  }
  if (estilo === 'street' || estilo === 'moletom') return '';
  return `<path d="M30 37 Q50 24 70 37" fill="none" stroke="${cor}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M31 36.2 Q50 23.4 69 36.2" fill="none" stroke="#fff" stroke-width=".9" opacity=".6"/>`;
}

// ---------- Retrato de frente (SVG, viewBox 0 0 100 100) ----------
export function retrato({ pele = 1, roupa = 0, sorriso = 'feliz', estilo = 'esportiva' } = {}) {
  const tom = PELES[pele] ?? PELES[1];
  const cor = ROUPAS[roupa] ?? ROUPAS[0];
  const k = ++serie;
  const id = (n) => `${n}-${k}`;
  const boca = sorriso === 'uau'
    ? `<ellipse cx="50" cy="69" rx="4.2" ry="5" fill="#7a2630"/><ellipse cx="50" cy="71" rx="2.6" ry="2" fill="#e0707a"/>`
    : `<path d="M42.5 66.5 Q50 73.5 57.5 66.5 Q50 69 42.5 66.5Z" fill="#fff" stroke="#9a3a44" stroke-width="1.6" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A menina de cabelo castanho ondulado">
  <defs>
    <radialGradient id="${id('pele')}" cx="42%" cy="38%" r="65%"><stop offset="0" stop-color="${clarear(tom, 0.18)}"/><stop offset=".65" stop-color="${tom}"/><stop offset="1" stop-color="${escurecer(tom, 0.18)}"/></radialGradient>
    <linearGradient id="${id('pesc')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${escurecer(tom, 0.28)}"/><stop offset="1" stop-color="${escurecer(tom, 0.08)}"/></linearGradient>
    <linearGradient id="${id('cab')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${CABELO[0]}"/><stop offset=".5" stop-color="${CABELO[1]}"/><stop offset="1" stop-color="${CABELO[2]}"/></linearGradient>
    <linearGradient id="${id('roupa')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${clarear(cor, 0.22)}"/><stop offset=".6" stop-color="${cor}"/><stop offset="1" stop-color="${escurecer(cor, 0.25)}"/></linearGradient>
    <radialGradient id="${id('iris')}" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#9a6a3c"/><stop offset=".7" stop-color="#5a3a20"/><stop offset="1" stop-color="#2e1c10"/></radialGradient>
    <linearGradient id="${id('tie')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cor}"/><stop offset=".3" stop-color="#ff4f81"/><stop offset=".55" stop-color="#ffd21f"/><stop offset=".8" stop-color="#35c46a"/><stop offset="1" stop-color="#3e8bff"/></linearGradient>
  </defs>
  <path d="M27 44 C24 30 34 18 50 18 C66 18 76 30 73 44 C76 56 73 66 77 76 C80 86 76 94 78 100 L22 100 C24 94 20 86 23 76 C27 66 24 56 27 44Z" fill="url(#${id('cab')})"/>
  <path d="M43 70 L57 70 L58 82 L42 82Z" fill="url(#${id('pesc')})"/>
  ${roupaDoRetrato(estilo, cor, id)}
  <path d="M42.5 76.5 Q50 84 57.5 76.5" fill="none" stroke="#e6b84a" stroke-width=".7"/>
  <circle cx="50" cy="80.6" r=".9" fill="#e6b84a"/>
  <!-- mechas compridas e onduladas caindo na frente dos ombros -->
  <path d="M30 50 C24 58 29 64 25 72 C21 80 28 86 24 94 C23 97 25 99 27 100 L34 100 C31 94 36 88 33 80 C30 72 36 66 33 58Z" fill="url(#${id('cab')})"/>
  <path d="M28 60 C25 67 30 72 27 80 C24 87 29 92 27 98" fill="none" stroke="${CABELO[0]}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
  <path d="M70 50 C75 57 71 63 75 70 C78 77 72 82 75 88 C76 90 75 92 73 93 L68 92 C70 86 66 80 69 73 C71 66 66 60 68 56Z" fill="url(#${id('cab')})"/>
  <path d="M72 58 C75 65 70 70 73 77 C75 83 71 87 72 90" fill="none" stroke="${CABELO[0]}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
  <path d="M60 79 C76 81 85 88 86 100 L80 100 C79 90 72 85 61 82Z" fill="#000" opacity=".12"/>
  <ellipse cx="29.5" cy="53" rx="3.6" ry="5.2" fill="${escurecer(tom, 0.06)}"/><ellipse cx="70.5" cy="53" rx="3.6" ry="5.2" fill="${escurecer(tom, 0.12)}"/>
  <circle cx="29.6" cy="59.6" r="1.7" fill="none" stroke="#e6b84a" stroke-width=".9"/><circle cx="70.4" cy="59.6" r="1.7" fill="none" stroke="#e6b84a" stroke-width=".9"/>
  <path d="M30 48 C30 34 39 27 50 27 C61 27 70 34 70 48 C70 62 61 74 50 74 C39 74 30 62 30 48Z" fill="url(#${id('pele')})"/>
  <path d="M38 70 Q50 78 62 70 Q56 74 50 74 Q44 74 38 70Z" fill="${escurecer(tom, 0.15)}" opacity=".5"/>
  <ellipse cx="38" cy="62" rx="5" ry="3" fill="#ff7b7b" opacity=".28"/><ellipse cx="62" cy="62" rx="5" ry="3" fill="#ff7b7b" opacity=".28"/>
  <ellipse cx="41" cy="53" rx="5" ry="4.2" fill="#fff"/><ellipse cx="59" cy="53" rx="5" ry="4.2" fill="#fff"/>
  <circle cx="41.4" cy="53.3" r="3.3" fill="url(#${id('iris')})"/><circle cx="59.4" cy="53.3" r="3.3" fill="url(#${id('iris')})"/>
  <circle cx="41.5" cy="53.4" r="1.5" fill="#140c08"/><circle cx="59.5" cy="53.4" r="1.5" fill="#140c08"/>
  <circle cx="42.6" cy="52.1" r="1.1" fill="#fff"/><circle cx="60.6" cy="52.1" r="1.1" fill="#fff"/>
  <path d="M35.6 51.6 Q41 47.4 46.4 51.2 M53.6 51.2 Q59 47.4 64.4 51.6" fill="none" stroke="#2a1810" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M35.8 51.4 l-1.6 -1 M64.2 51.4 l1.6 -1" stroke="#2a1810" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M35 45.5 Q41 42.6 46 44.6 M54 44.6 Q59 42.6 65 45.5" fill="none" stroke="${CABELO[2]}" stroke-width="2" stroke-linecap="round"/>
  <path d="M50 55 Q48.6 60.5 47.6 61.4 Q50 62.6 52.4 61.4" fill="none" stroke="${escurecer(tom, 0.3)}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
  <circle cx="48.8" cy="59.6" r="1.4" fill="#fff" opacity=".35"/>
  ${boca}
  <path d="M29 50 C27 32 37 21 50 21 C63 21 73 32 71 50 C69 41 65 34 57 31 C54 30 51 31 50 33 C49 31 46 30 43 31 C35 34 31 41 29 50Z" fill="url(#${id('cab')})"/>
  <path d="M50 21.5 L50 32" stroke="${escurecer(tom, 0.25)}" stroke-width=".9" opacity=".6"/>
  <path d="M47 23 C40 26 35 33 33 42 M53 23 C60 26 65 33 67 42 M44 25 C38 30 35 37 34 46" fill="none" stroke="${CABELO[0]}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
  <path d="M39 25 Q44 22 48 23 M52 23 Q56 22 61 25" fill="none" stroke="#8a6a50" stroke-width="2" stroke-linecap="round" opacity=".5"/>
  ${chapeuDoRetrato(estilo, cor)}
</svg>`;
}

// ---------- De costas, correndo (canvas) ----------
// (x, y) é o ponto entre os pés; u é o tamanho de 1 unidade do mundo em px (ela tem ~1,35 u de altura).
// fase: ciclo da corrida em radianos. pulo: altura em unidades. deslizando: > 0 enquanto desliza.
export function desenharDeCostas(ctx, x, y, u, opcoes = {}) {
  const { fase = 0, pulo = 0, deslizando = 0, pele = 1, roupa = 0, piscando = false, voando = false } = opcoes;
  const tom = PELES[pele] ?? PELES[1];
  const cor = ROUPAS[roupa] ?? ROUPAS[0];
  const s = u;
  ctx.save();

  const alturaSombra = 1 + pulo * 0.5;
  const sombra = ctx.createRadialGradient(x, y, 0, x, y, s * 0.36 / alturaSombra);
  sombra.addColorStop(0, 'rgba(0,0,0,.32)');
  sombra.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.36 / alturaSombra, s * 0.1 / alturaSombra, 0, 0, Math.PI * 2);
  ctx.fill();

  if (piscando) ctx.globalAlpha = 0.45;
  ctx.translate(x, y - pulo * s);
  if (deslizando > 0) { ctx.rotate(-0.1); ctx.scale(1.06, 0.58); }
  const noAr = pulo > 0.05 || voando;
  const fl = noAr ? 0.9 : fase;
  const quique = noAr || deslizando > 0 ? 0 : Math.abs(Math.cos(fase)) * 0.035 * s;
  ctx.translate(0, -quique);

  // Membro com volume: gradiente atravessado (luz à esquerda, sombra à direita).
  const membro = (x0, y0, x1, y1, w0, w1, corBase) => {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const nx = -Math.sin(ang); const ny = Math.cos(ang);
    const g = ctx.createLinearGradient(x0 - nx * w0, y0 - ny * w0, x0 + nx * w0, y0 + ny * w0);
    g.addColorStop(0, escurecer(corBase, 0.18));
    g.addColorStop(0.35, clarear(corBase, 0.1));
    g.addColorStop(1, escurecer(corBase, 0.22));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 + nx * w0, y0 + ny * w0);
    ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
    ctx.arc(x1, y1, w1, ang + Math.PI / 2, ang - Math.PI / 2, true);
    ctx.lineTo(x0 - nx * w0, y0 - ny * w0);
    ctx.arc(x0, y0, w0, ang - Math.PI / 2, ang + Math.PI / 2, true);
    ctx.fill();
  };

  // pernas: de costas, a perna que vai para trás sobe o calcanhar
  for (const lado of [-1, 1]) {
    const ciclo = Math.sin(fl + (lado > 0 ? Math.PI : 0));
    const chute = noAr ? (lado > 0 ? 0.55 : 0.15) : Math.max(0, ciclo);
    const quadril = { x: lado * 0.075 * s, y: -0.6 * s };
    const joelho = { x: lado * 0.085 * s, y: (-0.32 + chute * 0.06) * s };
    const tornozelo = { x: lado * 0.085 * s, y: (-0.06 - chute * 0.2) * s };
    membro(quadril.x, quadril.y, joelho.x, joelho.y, 0.062 * s, 0.05 * s, tom);
    membro(joelho.x, joelho.y, tornozelo.x, tornozelo.y, 0.05 * s, 0.036 * s, tom);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(tornozelo.x - 0.04 * s, tornozelo.y - 0.05 * s, 0.08 * s, 0.05 * s);
    const tx = tornozelo.x; const ty = tornozelo.y + 0.035 * s;
    const gt = ctx.createLinearGradient(tx - 0.07 * s, ty, tx + 0.07 * s, ty);
    gt.addColorStop(0, '#ffffff'); gt.addColorStop(0.6, '#e9edf3'); gt.addColorStop(1, '#b9c1cd');
    ctx.fillStyle = gt;
    ctx.beginPath();
    ctx.ellipse(tx, ty, 0.065 * s, 0.05 * s + chute * 0.02 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cor;
    ctx.fillRect(tx - 0.06 * s, ty + 0.018 * s, 0.12 * s, 0.022 * s);
    ctx.fillStyle = escurecer(cor, 0.35);
    ctx.fillRect(tx - 0.015 * s, ty - 0.045 * s, 0.03 * s, 0.05 * s);
  }

  // short esportivo com faixa lateral
  const gs = ctx.createLinearGradient(-0.17 * s, 0, 0.17 * s, 0);
  gs.addColorStop(0, SHORT[0]); gs.addColorStop(0.45, SHORT[1]); gs.addColorStop(1, SHORT[2]);
  ctx.fillStyle = gs;
  ctx.beginPath();
  ctx.moveTo(-0.14 * s, -0.74 * s);
  ctx.lineTo(0.14 * s, -0.74 * s);
  ctx.lineTo(0.16 * s, -0.5 * s);
  ctx.lineTo(0.01 * s, -0.52 * s);
  ctx.lineTo(-0.01 * s, -0.52 * s);
  ctx.lineTo(-0.16 * s, -0.5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = cor;
  ctx.lineWidth = 0.014 * s;
  ctx.beginPath();
  ctx.moveTo(-0.145 * s, -0.72 * s); ctx.lineTo(-0.16 * s, -0.51 * s);
  ctx.moveTo(0.145 * s, -0.72 * s); ctx.lineTo(0.16 * s, -0.51 * s);
  ctx.stroke();

  // braços dobrados, balançando ao contrário das pernas
  const bracos = [];
  for (const lado of [-1, 1]) {
    const vai = noAr ? -0.6 : Math.sin(fl + (lado > 0 ? 0 : Math.PI));
    const ombro = { x: lado * 0.15 * s, y: -1.0 * s };
    const cotovelo = { x: lado * (0.2 + Math.max(0, vai) * 0.03) * s, y: (-0.8 - vai * 0.07) * s };
    const mao = { x: lado * (0.17 - Math.max(0, -vai) * 0.03) * s, y: (-0.66 - vai * 0.14) * s };
    bracos.push({ ombro, cotovelo, mao, atras: vai > 0 });
  }
  const desenharBraco = (b) => {
    membro(b.ombro.x, b.ombro.y, b.cotovelo.x, b.cotovelo.y, 0.045 * s, 0.038 * s, tom);
    membro(b.cotovelo.x, b.cotovelo.y, b.mao.x, b.mao.y, 0.038 * s, 0.032 * s, tom);
    ctx.fillStyle = escurecer(tom, 0.06);
    ctx.beginPath(); ctx.arc(b.mao.x, b.mao.y, 0.036 * s, 0, Math.PI * 2); ctx.fill();
  };
  bracos.filter((b) => !b.atras).forEach(desenharBraco);

  // camiseta esportiva com volume e recortes
  const gc = ctx.createLinearGradient(-0.2 * s, -1.02 * s, 0.2 * s, -0.7 * s);
  gc.addColorStop(0, clarear(cor, 0.2)); gc.addColorStop(0.5, cor); gc.addColorStop(1, escurecer(cor, 0.28));
  ctx.fillStyle = gc;
  ctx.beginPath();
  ctx.moveTo(-0.07 * s, -1.06 * s);
  ctx.quadraticCurveTo(0, -1.04 * s, 0.07 * s, -1.06 * s);
  ctx.lineTo(0.18 * s, -1.01 * s);
  ctx.lineTo(0.215 * s, -0.9 * s);
  ctx.lineTo(0.165 * s, -0.88 * s);
  ctx.quadraticCurveTo(0.15 * s, -0.8 * s, 0.155 * s, -0.71 * s);
  ctx.quadraticCurveTo(0, -0.68 * s, -0.155 * s, -0.71 * s);
  ctx.quadraticCurveTo(-0.15 * s, -0.8 * s, -0.165 * s, -0.88 * s);
  ctx.lineTo(-0.215 * s, -0.9 * s);
  ctx.lineTo(-0.18 * s, -1.01 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = 0.014 * s;
  ctx.beginPath();
  ctx.moveTo(-0.17 * s, -1.0 * s); ctx.quadraticCurveTo(-0.13 * s, -0.86 * s, -0.15 * s, -0.72 * s);
  ctx.moveTo(0.17 * s, -1.0 * s); ctx.quadraticCurveTo(0.13 * s, -0.86 * s, 0.15 * s, -0.72 * s);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  ctx.beginPath();
  ctx.ellipse(0.03 * s, -0.84 * s, 0.05 * s, 0.13 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // cabelo ondulado caindo nas costas, balançando
  const balanco = noAr ? -0.02 : Math.sin(fl) * 0.022;
  const cy = -1.2 * s;
  const pts = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    const largura = 0.145 + t * 0.025 - (t > 0.85 ? (t - 0.85) * 0.5 : 0);
    const onda = Math.sin(t * 9 + fl * 0.5) * 0.012 * (0.4 + t);
    pts.push({ y: cy + 0.05 * s + t * 0.36 * s, l: largura * s, dx: (balanco * t * t + onda) * s });
  }
  const gcab = ctx.createLinearGradient(-0.16 * s, 0, 0.16 * s, 0);
  gcab.addColorStop(0, CABELO[0]); gcab.addColorStop(0.45, CABELO[1]); gcab.addColorStop(1, CABELO[2]);
  ctx.fillStyle = gcab;
  ctx.beginPath();
  ctx.moveTo(-0.145 * s, cy);
  pts.forEach((p, i) => ctx.lineTo(p.dx - p.l + Math.sin(i * 1.3) * 0.01 * s, p.y));
  const ult = pts[pts.length - 1];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    ctx.lineTo(ult.dx - ult.l + t * 2 * ult.l, ult.y + Math.sin(t * Math.PI * 3) * 0.025 * s + 0.02 * s);
  }
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].dx + pts[i].l + Math.sin(i * 1.3 + 1) * 0.01 * s, pts[i].y);
  ctx.lineTo(0.145 * s, cy);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  for (let k = -3; k <= 3; k++) {
    ctx.strokeStyle = k % 2 ? 'rgba(160,100,60,.55)' : 'rgba(40,18,8,.35)';
    ctx.lineWidth = 0.012 * s;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const xx = p.dx + (k / 3.4) * p.l + Math.sin(i * 0.9 + k) * 0.012 * s;
      if (i === 0) ctx.moveTo(xx, p.y); else ctx.lineTo(xx, p.y);
    });
    ctx.stroke();
  }

  // cabeça (de costas: só cabelo), com brilho e faixa esportiva
  const gh = ctx.createRadialGradient(-0.05 * s, cy - 0.06 * s, 0.01 * s, 0, cy, 0.16 * s);
  gh.addColorStop(0, CABELO[0]); gh.addColorStop(0.6, CABELO[1]); gh.addColorStop(1, CABELO[2]);
  ctx.fillStyle = gh;
  ctx.beginPath();
  ctx.ellipse(0, cy, 0.15 * s, 0.165 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = escurecer(tom, 0.1);
  for (const lado of [-1, 1]) { ctx.beginPath(); ctx.ellipse(lado * 0.15 * s, cy + 0.02 * s, 0.02 * s, 0.032 * s, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(220,160,110,.6)';
  ctx.lineWidth = 0.02 * s;
  ctx.beginPath();
  ctx.arc(-0.01 * s, cy + 0.02 * s, 0.1 * s, Math.PI * 1.15, Math.PI * 1.6);
  ctx.stroke();
  ctx.strokeStyle = cor;
  ctx.lineWidth = 0.028 * s;
  ctx.beginPath();
  ctx.ellipse(0, cy - 0.02 * s, 0.15 * s, 0.055 * s, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();

  bracos.filter((b) => b.atras).forEach(desenharBraco);
  ctx.restore();
}
