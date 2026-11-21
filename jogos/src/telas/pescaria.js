// Tela da Pescaria: lago visto de lado, desenhado num canvas a cada quadro.
// Segure o dedo no lago para descer o anzol (o barco vai atrás do dedo) e solte para subir.
import { el, formatarTempo } from '../comum.js';
import { prefs } from '../dados.js';
import { retrato } from '../personagem.js';
import * as pe from '../pescaria.js';

export const INFO = {
  id: 'pescaria',
  nome: 'Pescaria',
  descricao: 'Pesque os peixes coloridos',
  solo: true,
  rotuloNivel: 'Nível da próxima pescaria',
  regras: [
    'Segure o dedo no lago: o barquinho vai até onde você está apontando e o anzol desce. Solte para o anzol subir.',
    'Encostou num peixe, ele fica preso e sobe sozinho até o barco. Peixes pequenos valem pouco; os grandes e fundos valem mais.',
    'O peixe dourado é raro, rápido e fica lá no fundo: vale 100 pontos!',
    'Cuidado com o lixo: a bota velha tira 15 pontos e a lata tira 10.',
    'Cada rodada dura 60 segundos. Bata a meta para ganhar 1 estrela; com metade a mais são 2 e com o dobro, 3.',
    'O nível muda a velocidade dos peixes, a quantidade de lixo e a meta. No computador, use as setas para mover o barco e segure a barra de espaço para descer o anzol.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><defs><linearGradient id="pesc-ic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0ff"/><stop offset="1" stop-color="#1e63d6"/></linearGradient></defs><rect width="12" height="12" rx="2" fill="#bfe9ff"/><path d="M0 4.4q1.5-.8 3 0t3 0 3 0 3 0V10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2Z" fill="url(#pesc-ic)"/><path d="M1.6 3.4h5.2l-.9 1.2H2.4Z" fill="#c0392b"/><path d="M5.4 3.4 8.6 1" stroke="#7a4a22" stroke-width=".35"/><path d="M8.6 1v6.6" stroke="#fff" stroke-width=".18"/><path d="M8.6 7.6q0 .7-.6.6" fill="none" stroke="#fff" stroke-width=".3"/><ellipse cx="5" cy="8.6" rx="1.6" ry="1" fill="#ffa53d"/><path d="M3.5 8.6 2.6 7.9v1.4Z" fill="#ff6a1f"/><circle cx="5.8" cy="8.4" r=".22" fill="#222"/></svg>';

export function resumo() {
  const n = prefs.historico.filter((h) => h.j === 'pescaria').length;
  const r = pe.recorde(prefs.historico);
  const est = prefs.historico.filter((h) => h.j === 'pescaria').reduce((t, h) => t + (h.estrelas ?? 0), 0);
  return {
    cartao: r ? `<b>${r.toLocaleString('pt-BR')}</b> recorde` : 'Sem pescarias ainda',
    placar: `<span class="lado"><span class="avatar voce">🎣</span>Pescarias <span class="num">${n}</span></span><span class="x">·</span><span class="lado">Recorde <span class="num">${r ? r.toLocaleString('pt-BR') : '—'}</span></span>`,
    painel: { valor: r ? r.toLocaleString('pt-BR') : '—', rotulo: 'recorde de pontos', sub: `${n} ${n === 1 ? 'pescaria' : 'pescarias'} · ${est} ★` },
  };
}

const CEU = 26; // altura do céu, em unidades do mundo
const AREIA = 5;
const ALTURA = CEU + pe.FUNDO + AREIA;
const NOMES_PESCOU = { piaba: 'Uma piaba!', laranja: 'Peixe-laranja!', rosa: 'Peixe-rosa!', listrado: 'Peixe-palhaço!', roxo: 'Peixe-lua!', dourado: 'PEIXE DOURADO! 🌟', bota: 'Eca, uma bota velha!', lata: 'Ih, uma lata…' };

// plantas fixas no fundo: [x, altura, cor, grossura]
const PLANTAS = [[5, 26, '#2e9e4f', 2.2], [9, 18, '#47c46a', 1.6], [22, 14, '#2e9e4f', 1.8], [33, 30, '#1f7a3c', 2.4], [36, 20, '#5fd17a', 1.5],
  [52, 16, '#47c46a', 1.8], [64, 28, '#2e9e4f', 2.2], [67, 17, '#8be07c', 1.4], [80, 22, '#1f7a3c', 2], [92, 32, '#2e9e4f', 2.4], [95, 19, '#5fd17a', 1.5]];
const PEDRAS = [[15, 3.2, '#8c8f99'], [45, 4.2, '#7a7d87'], [58, 2.6, '#a3a6ae'], [86, 3.6, '#8c8f99']];

export function montar(area, ctl) {
  const hud = el('div', 'pescaria-hud');
  const palco = el('div', 'pescaria-palco');
  const canvas = el('canvas', 'pescaria-canvas');
  canvas.setAttribute('aria-label', 'Lago. Segure para descer o anzol e solte para subir.');
  canvas.setAttribute('role', 'application');
  canvas.tabIndex = 0;
  const aviso = el('div', 'pescaria-aviso');
  palco.append(canvas, aviso);
  area.append(hud, palco);
  const ctx = canvas.getContext('2d');
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // a menina do barco: o retrato SVG vira uma imagem para o canvas
  const menina = new Image();
  const fazerMenina = (sorriso) => { menina.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso }))}`; };
  fazerMenina('feliz');

  let r; let viva = () => false; let tAnterior = 0; let relogio = 0; let ultimoSalvo = 0;
  let escala = 1; let larguraCss = 0;
  let bolhas = []; let respingos = []; let textos = [];
  let teclas = { esq: false, dir: false };
  let recordeAntes = 0;

  // ---------- HUD ----------
  function escreverHud() {
    const max = r.meta * 2;
    const pct = Math.min(100, (r.pontos / max) * 100);
    const marcas = [1, 1.5, 2].map((f, k) => `<span class="pesc-marca${r.pontos >= r.meta * f ? ' ok' : ''}" style="left:${(f / 2) * 100}%">${'★'.repeat(1)}<small>${k === 0 ? r.meta : Math.round(r.meta * f)}</small></span>`).join('');
    const pouco = r.restante <= 10 && r.comecou && !r.acabou;
    hud.innerHTML = `<span class="pesc-tempo${pouco ? ' pouco' : ''}">⏱ <b>${formatarTempo(Math.ceil(r.restante))}</b></span>
      <span class="pesc-barra" aria-label="${r.pontos} pontos de ${r.meta} da meta"><span class="pesc-enche" style="width:${pct}%"></span>${marcas}</span>
      <span class="pesc-pontos"><b>${r.pontos}</b> pts</span>`;
  }

  // ---------- desenho ----------
  function medir() {
    const w = palco.clientWidth || 358;
    if (w === larguraCss) return;
    larguraCss = w;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    escala = w / pe.LARGURA;
    const h = ALTURA * escala;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);
  }

  const onda = (x, t) => CEU + Math.sin(x * 0.16 + t * 1.6) * (calmo ? 0.3 : 0.8) + Math.sin(x * 0.07 - t * 0.9) * (calmo ? 0.2 : 0.6);

  function nuvem(x, y, k) {
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.beginPath();
    ctx.arc(x, y, 3.2 * k, 0, 7); ctx.arc(x + 3.6 * k, y - 1.4 * k, 3.8 * k, 0, 7); ctx.arc(x + 7.4 * k, y, 3 * k, 0, 7);
    ctx.rect(x, y, 7.4 * k, 3 * k);
    ctx.fill();
  }

  function cenarioCima(t) {
    const g = ctx.createLinearGradient(0, 0, 0, CEU);
    g.addColorStop(0, '#7cc8ff'); g.addColorStop(1, '#e6f6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, pe.LARGURA, CEU + 2);
    // sol
    const s = ctx.createRadialGradient(84, 7, 1, 84, 7, 11);
    s.addColorStop(0, 'rgba(255,236,150,1)'); s.addColorStop(0.45, 'rgba(255,214,80,.95)'); s.addColorStop(0.5, 'rgba(255,230,140,.35)'); s.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = s; ctx.beginPath(); ctx.arc(84, 7, 11, 0, 7); ctx.fill();
    // nuvens indo devagar
    const desl = calmo ? 0 : t * 1.2;
    nuvem(((10 + desl) % 130) - 15, 7, 0.9);
    nuvem(((60 + desl * 0.7) % 130) - 15, 12, 0.65);
    // morrinhos na margem
    ctx.fillStyle = '#7fcf6a';
    ctx.beginPath(); ctx.moveTo(0, CEU); ctx.quadraticCurveTo(14, CEU - 9, 30, CEU - 1); ctx.quadraticCurveTo(44, CEU - 6, 56, CEU); ctx.lineTo(0, CEU); ctx.fill();
    ctx.fillStyle = '#5bb85a';
    ctx.beginPath(); ctx.moveTo(60, CEU); ctx.quadraticCurveTo(78, CEU - 8, 100, CEU - 3); ctx.lineTo(100, CEU); ctx.fill();
  }

  function agua(t) {
    ctx.beginPath();
    ctx.moveTo(0, onda(0, t));
    for (let x = 2; x <= pe.LARGURA; x += 2) ctx.lineTo(x, onda(x, t));
    ctx.lineTo(pe.LARGURA, ALTURA); ctx.lineTo(0, ALTURA); ctx.closePath();
    const g = ctx.createLinearGradient(0, CEU, 0, ALTURA);
    g.addColorStop(0, '#5fd0ff'); g.addColorStop(0.35, '#2b93e0'); g.addColorStop(0.75, '#1659b8'); g.addColorStop(1, '#0d3a80');
    ctx.fillStyle = g; ctx.fill();
    // raios de luz
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#fff';
    for (let k = 0; k < 4; k++) {
      const x0 = 12 + k * 26 + (calmo ? 0 : Math.sin(t * 0.4 + k) * 3);
      ctx.beginPath(); ctx.moveTo(x0, CEU); ctx.lineTo(x0 + 7, CEU); ctx.lineTo(x0 - 6, CEU + 85); ctx.lineTo(x0 - 18, CEU + 85); ctx.fill();
    }
    ctx.restore();
    // brilho na superfície
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.5; ctx.lineCap = 'round';
    for (let k = 0; k < 7; k++) {
      const x = (k * 15 + (calmo ? 0 : t * 3)) % 104 - 2;
      ctx.beginPath(); ctx.moveTo(x, onda(x, t) + 1.6); ctx.lineTo(x + 3.5, onda(x + 3.5, t) + 1.6); ctx.stroke();
    }
  }

  function fundo(t) {
    const yA = CEU + pe.FUNDO;
    // plantas balançando
    ctx.lineCap = 'round';
    for (const [x, alt, cor, gr] of PLANTAS) {
      ctx.strokeStyle = cor; ctx.lineWidth = gr;
      ctx.beginPath(); ctx.moveTo(x, yA + 1);
      const n = 5;
      for (let k = 1; k <= n; k++) {
        const f = k / n;
        const bal = calmo ? 0 : Math.sin(t * 1.3 + x * 0.3 + f * 2) * 2.6 * f;
        ctx.lineTo(x + bal + Math.sin(f * 5 + x) * 1.2, yA + 1 - alt * f);
      }
      ctx.stroke();
    }
    // areia
    ctx.fillStyle = '#e9cf8f';
    ctx.beginPath(); ctx.moveTo(0, yA);
    for (let x = 0; x <= pe.LARGURA; x += 5) ctx.lineTo(x, yA + Math.sin(x * 0.21) * 1.2);
    ctx.lineTo(pe.LARGURA, ALTURA); ctx.lineTo(0, ALTURA); ctx.fill();
    ctx.fillStyle = '#d6b871';
    for (let x = 3; x < 100; x += 7) { ctx.beginPath(); ctx.arc(x, yA + 3 + (x % 3), 0.45, 0, 7); ctx.fill(); }
    for (const [x, rr, cor] of PEDRAS) { ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, yA + 0.6, rr, rr * 0.62, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(x - rr * 0.3, yA - rr * 0.25, rr * 0.35, rr * 0.18, 0, 0, 7); ctx.fill(); }
    // estrela-do-mar
    ctx.save(); ctx.translate(74, yA + 1.4); ctx.rotate(0.3); ctx.fillStyle = '#ff7a59';
    ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2; const rr = k % 2 ? 1 : 2.4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); ctx.restore();
  }

  function peixe(b, t, vertical = false) {
    const ti = pe.todos(b.tipo);
    const tam = ti.tam;
    const dir = b.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(b.x, CEU + b.y);
    if (vertical) { ctx.rotate(-Math.PI / 2 + Math.sin(t * 18) * 0.35); } else ctx.scale(dir, 1);
    if (ti.raro) { // brilho do dourado
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, tam * 2.2);
      g.addColorStop(0, 'rgba(255,240,150,.55)'); g.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, tam * 2.2, 0, 7); ctx.fill();
    }
    const alto = b.tipo === 'roxo' ? 0.85 : 0.58;
    const rabo = Math.sin(t * 10 + b.fase) * 0.3;
    ctx.fillStyle = ti.cor2;
    ctx.beginPath(); ctx.moveTo(-tam * 0.8, 0); ctx.lineTo(-tam * 1.55, -tam * (0.5 + rabo)); ctx.lineTo(-tam * 1.4, 0); ctx.lineTo(-tam * 1.55, tam * (0.5 - rabo)); ctx.closePath(); ctx.fill();
    // barbatana de cima
    ctx.beginPath(); ctx.moveTo(-tam * 0.3, -tam * alto * 0.85); ctx.quadraticCurveTo(tam * 0.1, -tam * (alto + 0.45), tam * 0.4, -tam * alto * 0.8); ctx.fill();
    const g = ctx.createLinearGradient(0, -tam * alto, 0, tam * alto);
    g.addColorStop(0, ti.cor); g.addColorStop(1, b.tipo === 'listrado' ? '#ff5a1f' : ti.cor2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, tam, tam * alto, 0, 0, 7); ctx.fill();
    if (b.tipo === 'listrado') {
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 0.25;
      for (const xs of [-0.45, 0.25]) { ctx.beginPath(); ctx.ellipse(tam * xs, 0, tam * 0.14, tam, 0, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    if (b.tipo === 'rosa' || b.tipo === 'roxo') { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (const [px, py] of [[-0.3, 0.1], [0.05, 0.3], [-0.1, -0.2]]) { ctx.beginPath(); ctx.arc(tam * px, tam * py, tam * 0.11, 0, 7); ctx.fill(); } }
    // barriga clara e brilho
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(tam * 0.05, -tam * alto * 0.4, tam * 0.55, tam * alto * 0.25, 0, 0, 7); ctx.fill();
    // olho
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tam * 0.55, -tam * 0.12, tam * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#1b1b2a'; ctx.beginPath(); ctx.arc(tam * 0.6, -tam * 0.12, tam * 0.11, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tam * 0.63, -tam * 0.16, tam * 0.04, 0, 7); ctx.fill();
    // boquinha
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.arc(tam * 0.86, tam * 0.08, tam * 0.1, 0.3, 1.6); ctx.stroke();
    if (ti.raro && !calmo) { // faíscas
      ctx.fillStyle = '#fffbe0';
      for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; const rr = tam * 1.5; ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.6, 0.45 + 0.25 * Math.sin(t * 6 + k), 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }

  function lixo(b, t, preso = false) {
    ctx.save();
    ctx.translate(b.x, CEU + b.y);
    ctx.rotate(preso ? Math.sin(t * 8) * 0.25 : Math.sin(b.fase) * 0.2);
    if (b.tipo === 'bota') {
      ctx.fillStyle = '#7a4a22';
      ctx.beginPath(); ctx.moveTo(-2.4, -4.4); ctx.lineTo(1, -4.4); ctx.lineTo(1.2, 0.4); ctx.lineTo(4.6, 1.2); ctx.quadraticCurveTo(5.4, 2.8, 4, 3); ctx.lineTo(-2.6, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4e2d12'; ctx.fillRect(-2.8, 2.2, 7.6, 1);
      ctx.strokeStyle = '#c9a26b'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(-1.8, -2.6); ctx.lineTo(0.4, -2.6); ctx.moveTo(-1.8, -1.4); ctx.lineTo(0.4, -1.4); ctx.stroke();
      ctx.fillStyle = '#5fd17a'; ctx.beginPath(); ctx.ellipse(-2.2, -4.6, 1.4, 0.5, -0.4, 0, 7); ctx.fill(); // alga grudada
    } else {
      ctx.rotate(1.2);
      ctx.fillStyle = '#b8bec8'; ctx.fillRect(-1.8, -3, 3.6, 6);
      ctx.fillStyle = '#e5484d'; ctx.fillRect(-1.8, -1.6, 3.6, 3.2);
      ctx.fillStyle = '#fff'; ctx.fillRect(-1.2, -0.4, 2.4, 0.8);
      ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(0, -3, 1.8, 0.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-1.5, -2.8, 0.5, 5.6);
    }
    ctx.restore();
  }

  function bicho(b, t, preso) { if (pe.todos(b.tipo).lixo) lixo(b, t, preso); else peixe(b, t, preso); }

  function barco(t) {
    const bx = r.barco - 9; // a vara fica 9 unidades à frente
    const by = onda(bx, t) + (calmo ? 0 : Math.sin(t * 2) * 0.3);
    const incl = calmo ? 0 : Math.sin(t * 1.6) * 0.03;
    // linha e anzol
    const pontaX = r.barco; const pontaY = by - 15;
    const yAnzol = CEU + r.anzol;
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 0.28;
    ctx.beginPath(); ctx.moveTo(pontaX, pontaY); ctx.lineTo(r.barco, yAnzol); ctx.stroke();
    // boia
    if (r.anzol > 2) { ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(r.barco, onda(r.barco, t) - 0.3, 0.9, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r.barco, onda(r.barco, t) - 0.3, 0.9, 0, Math.PI); ctx.fill(); }
    // anzol com minhoca
    ctx.strokeStyle = '#d8dde6'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r.barco, yAnzol); ctx.lineTo(r.barco, yAnzol + 2); ctx.arc(r.barco - 1, yAnzol + 2, 1, 0, Math.PI * 0.9); ctx.stroke();
    if (!r.preso) { ctx.strokeStyle = '#ff8fa3'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(r.barco - 1.6, yAnzol + 2.4); ctx.quadraticCurveTo(r.barco - 2.4, yAnzol + 3.6 + Math.sin(t * 8) * 0.4, r.barco - 1.2, yAnzol + 4.2); ctx.stroke(); }

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(incl);
    // vara
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(1, -6); ctx.quadraticCurveTo(5, -12, 9, -15); ctx.stroke();
    // menina
    if (menina.complete && menina.naturalWidth) ctx.drawImage(menina, -11, -22.5, 21, 21);
    // casco
    const g = ctx.createLinearGradient(0, -5, 0, 3);
    g.addColorStop(0, '#ff7a59'); g.addColorStop(1, '#c0392b');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(12, -5); ctx.quadraticCurveTo(10, 2.5, 6, 3); ctx.lineTo(-7, 3); ctx.quadraticCurveTo(-11, 2.5, -12, -5); ctx.fill();
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(-12, -5.6, 24, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const x of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(x, -1.6, 0.9, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function efeitos(dt) {
    // bolhas subindo
    if (!calmo && Math.random() < dt * 2.5) {
      const [x] = PLANTAS[Math.floor(Math.random() * PLANTAS.length)];
      bolhas.push({ x: x + (Math.random() - 0.5) * 3, y: CEU + pe.FUNDO - 4, r: 0.4 + Math.random() * 0.8, v: 6 + Math.random() * 6, f: Math.random() * 6 });
    }
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.2;
    for (const b of bolhas) {
      b.y -= b.v * dt; b.f += dt * 3;
      ctx.beginPath(); ctx.arc(b.x + Math.sin(b.f) * 0.6, b.y, b.r, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(b.x + Math.sin(b.f) * 0.6 - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, 7); ctx.fill();
    }
    bolhas = bolhas.filter((b) => b.y > CEU + 1);
    // respingos
    for (const p of respingos) { p.vy += 40 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.v -= dt; }
    respingos = respingos.filter((p) => p.v > 0);
    ctx.fillStyle = 'rgba(220,245,255,.9)';
    for (const p of respingos) { ctx.beginPath(); ctx.arc(p.x, p.y, 0.5, 0, 7); ctx.fill(); }
    // textos de pontos
    for (const x of textos) { x.y -= 8 * dt; x.v -= dt; }
    textos = textos.filter((x) => x.v > 0);
    ctx.textAlign = 'center'; ctx.font = `800 5px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
    for (const x of textos) {
      ctx.globalAlpha = Math.min(1, x.v * 1.5);
      ctx.lineJoin = 'round'; ctx.lineWidth = 0.9; ctx.strokeStyle = x.cor === '#ffffff' ? '#1659b8' : '#5a2a00'; ctx.strokeText(x.txt, x.x, x.y);
      ctx.fillStyle = x.cor; ctx.fillText(x.txt, x.x, x.y);
      ctx.globalAlpha = 1;
    }
  }

  function desenhar(t, dt) {
    medir();
    ctx.clearRect(0, 0, pe.LARGURA, ALTURA);
    cenarioCima(t);
    agua(t);
    fundo(t);
    for (const b of r.bichos) bicho(b, t, false);
    if (r.preso) bicho(r.preso, t, true);
    barco(t);
    efeitos(dt);
  }

  // ---------- laço ----------
  function quadro(agora) {
    if (!viva() || !document.body.contains(canvas)) return; // a tela saiu: o laço para
    const dt = tAnterior ? Math.min(0.1, (agora - tAnterior) / 1000) : 0;
    tAnterior = agora;
    relogio += dt;
    if (r.comecou && !r.acabou) {
      if (teclas.esq) r.alvo = Math.max(5, r.alvo - pe.VEL_BARCO * dt);
      if (teclas.dir) r.alvo = Math.min(pe.LARGURA - 5, r.alvo + pe.VEL_BARCO * dt);
      const antes = Math.ceil(r.restante);
      for (const ev of pe.passo(r, dt)) tratar(ev);
      if (Math.ceil(r.restante) !== antes || r.acabou) escreverHud();
      if (!r.acabou && relogio - ultimoSalvo > 2) { ultimoSalvo = relogio; ctl.salvar(r); }
    }
    desenhar(relogio, dt);
    requestAnimationFrame(quadro);
  }

  function tratar(ev) {
    if (ev.tipo === 'fisgou') {
      const lixoso = pe.todos(ev.bicho.tipo).lixo;
      ctl.som(lixoso ? 'erro' : 'acerto');
      if (navigator.vibrate && !lixoso) try { navigator.vibrate(20); } catch { /* nada */ }
    } else if (ev.tipo === 'pescou') {
      const pts = ev.pontos;
      const raro = pe.todos(ev.bicho.tipo).raro;
      ctl.som(pts < 0 ? 'quebra' : raro ? 'premio' : 'moeda');
      textos.push({ txt: `${pts > 0 ? '+' : ''}${pts}`, x: Math.min(92, r.barco + 5), y: CEU - 10, v: 1.3, cor: pts < 0 ? '#ff6b6b' : raro ? '#ffe14d' : '#ffffff' });
      for (let k = 0; k < 10; k++) respingos.push({ x: r.barco, y: CEU, vx: (Math.random() - 0.5) * 24, vy: -12 - Math.random() * 10, v: 0.6 });
      ctl.status(`${NOMES_PESCOU[ev.bicho.tipo] ?? 'Pescou!'} ${pts > 0 ? '+' : ''}${pts}`, pts < 0 ? 'derrota' : 'voce');
      if (raro) { fazerMenina('uau'); setTimeout(() => fazerMenina('feliz'), 1500); }
      escreverHud();
      ctl.salvar(r);
    } else if (ev.tipo === 'fim') terminar();
  }

  function terminar() {
    aviso.hidden = true;
    const est = pe.estrelas(r.pontos, r.meta);
    const recorde = r.pontos > recordeAntes && r.pontos > 0 ? ' Novo recorde! 🏆' : '';
    escreverHud();
    if (pe.venceu(r)) {
      fazerMenina('uau');
      ctl.fim('vitoria', `Meta batida: ${r.pontos} pontos! ${'★'.repeat(est)}${recorde}`, palco, { pontos: r.pontos, estrelas: est });
    } else {
      ctl.fim('derrota', `Você fez ${r.pontos} pontos. Faltaram ${r.meta - r.pontos} para a meta: vamos pescar de novo? 🎣${recorde}`, palco, { pontos: r.pontos, estrelas: 0 });
    }
  }

  // ---------- controles ----------
  const xDoDedo = (ev) => { const b = canvas.getBoundingClientRect(); return Math.min(pe.LARGURA - 5, Math.max(5, ((ev.clientX - b.left) / b.width) * pe.LARGURA)); };
  function comecar() {
    if (r.acabou) return false;
    if (!r.comecou) { r.comecou = true; aviso.hidden = true; ctl.status('Boa pescaria! 🎣', 'voce'); escreverHud(); }
    return true;
  }
  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (!comecar()) return;
    try { canvas.setPointerCapture(ev.pointerId); } catch { /* nada */ }
    r.alvo = xDoDedo(ev);
    r.segurando = true;
  });
  aviso.addEventListener('pointerdown', (ev) => { ev.preventDefault(); if (!comecar()) return; r.alvo = xDoDedo(ev); r.segurando = true; });
  canvas.addEventListener('pointermove', (ev) => { if (r.segurando) r.alvo = xDoDedo(ev); });
  const soltar = () => { if (r) r.segurando = false; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  aviso.addEventListener('pointerup', soltar);
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  window.addEventListener('blur', soltar);

  const aoTeclar = (baixo) => (ev) => {
    if (!document.body.contains(canvas)) { document.removeEventListener('keydown', teclaDesce); document.removeEventListener('keyup', teclaSobe); return; }
    if (ev.target.closest?.('input, textarea, select, button, summary')) return;
    const k = ev.key;
    if (k === ' ' || k === 'ArrowDown') { ev.preventDefault(); if (baixo && !ev.repeat && !comecar()) return; r.segurando = baixo; }
    else if (k === 'ArrowLeft') { ev.preventDefault(); teclas.esq = baixo; if (baixo) comecar(); }
    else if (k === 'ArrowRight') { ev.preventDefault(); teclas.dir = baixo; if (baixo) comecar(); }
  };
  const teclaDesce = aoTeclar(true); const teclaSobe = aoTeclar(false);
  document.addEventListener('keydown', teclaDesce);
  document.addEventListener('keyup', teclaSobe);

  function iniciar(salvo) {
    r = salvo?.bichos ? { ...salvo, comecou: false, segurando: false } : pe.novaRodada(ctl.nivel());
    recordeAntes = pe.recorde(prefs.historico);
    bolhas = []; respingos = []; textos = []; teclas = { esq: false, dir: false };
    fazerMenina('feliz');
    aviso.hidden = false;
    aviso.innerHTML = salvo?.bichos
      ? '<div><b>Toque para continuar</b><span>a pescaria estava pela metade</span></div>'
      : `<div><b>Segure para pescar</b><span>solte para o anzol subir · meta: ${r.meta} pontos</span></div>`;
    ctl.status(salvo?.bichos ? 'Pescaria retomada' : `Faça ${r.meta} pontos em 60 segundos`, 'voce');
    escreverHud();
    if (!salvo) ctl.salvar(r);
    viva = ctl.ativa();
    tAnterior = 0;
    larguraCss = 0;
    requestAnimationFrame(quadro);
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
