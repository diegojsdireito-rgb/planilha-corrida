import * as cor from '../corrida.js';
import { el } from '../comum.js';
import { prefs, guardar } from '../dados.js';
import * as loja from '../loja.js';
import { retrato, desenharDeCostas, PELES, ROUPAS } from '../personagem.js';

const C = 5; // distância da câmera: controla a perspectiva
const CENARIOS = [
  { id: 'cidade', nome: 'Cidade', icone: '🏙️' },
  { id: 'praia', nome: 'Praia', icone: '🏖️' },
  { id: 'floresta', nome: 'Floresta', icone: '🌲' },
  { id: 'neve', nome: 'Vila da Neve', icone: '❄️' },
  { id: 'passeio', nome: 'Passeio', icone: '🔄' },
];
const TRECHO_PASSEIO = 500; // metros em cada cenário no modo Passeio

// Cenário em que a corrida está agora.
export function cenarioDaCorrida(escolha, dist) {
  if (escolha !== 'passeio') return CENARIOS.some((c) => c.id === escolha && c.id !== 'passeio') ? escolha : 'cidade';
  return CENARIOS[Math.floor(dist / TRECHO_PASSEIO) % 4].id;
}

export function recorde() {
  let r = 0;
  for (const h of prefs.historico) if (h.j === 'corrida' && h.pontos > r) r = h.pontos;
  return r;
}

export function montar(area, ctl) {
  const palco = el('div', 'corrida');
  const tela3d = el('canvas', 'tela-3d');
  const tela = el('canvas');
  tela.setAttribute('role', 'img');
  tela.setAttribute('aria-label', 'Corrida: deslize para os lados para trocar de faixa, para cima para pular e para baixo para deslizar');
  const hud = el('div', 'corrida-hud');
  const pausaEl = el('button', 'botao-icone pausa', 'Ⅱ');
  pausaEl.setAttribute('aria-label', 'Pausar');
  const camada = el('div', 'corrida-camada');
  const skateEl = el('button', 'acao-corrida acao-skate');
  skateEl.setAttribute('aria-label', 'Subir no skate');
  const turboEl = el('button', 'acao-corrida acao-turbo', '<i></i><span>⚡</span>');
  turboEl.setAttribute('aria-label', 'Ativar a supercarga');
  palco.append(tela3d, tela, hud, pausaEl, skateEl, turboEl, camada);
  const controles = el('div', 'corrida-controles', `
    <button data-acao="esquerda" aria-label="Esquerda">◀</button>
    <button data-acao="pular" aria-label="Pular">▲</button>
    <button data-acao="deslizar" aria-label="Deslizar">▼</button>
    <button data-acao="direita" aria-label="Direita">▶</button>`);
  area.append(palco, controles);

  const ctx = tela.getContext('2d');
  let temaVisto = null; let camera = 0; let s = null; let rodando = false; let pausado = false; let quadro = 0; let anterior = 0; let W = 0; let H = 0; let dpr = 1;
  let ativa = ctl.ativa();

  // 3D quando o aparelho permite; senão, o desenho em 2D continua valendo.
  let mundo = null;
  const parado = cor.nova('medio');
  parado.ultimaLinha = 1e9;
  import('../mundo3d.js')
    .then((m) => {
      if (!palco.isConnected) return;
      mundo = m.criarMundo(tela3d);
      if (mundo) { palco.classList.add('em-3d'); medir(); }
    })
    .catch(() => { /* fica no 2D */ });

  // Ao sair da tela, libera a memória do 3D.
  const vigia = setInterval(() => {
    if (palco.isConnected) return;
    clearInterval(vigia);
    observador?.disconnect();
    mundo?.destruir();
    mundo = null;
  }, 2000);

  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = palco.getBoundingClientRect();
    W = r.width; H = r.height;
    tela.width = Math.round(W * dpr);
    tela.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mundo?.redimensionar(W, H, dpr);
    if (!rodando) desenhar(0);
  }
  const observador = new ResizeObserver(medir);
  observador.observe(palco);

  // ---------- Projeção ----------
  const horizonte = () => H * 0.34;
  const chao = () => H * 0.86;
  const p = (z) => C / (Math.max(z, -C * 0.6) + C);
  const Y = (z) => horizonte() + (chao() - horizonte()) * p(z);
  const faixaL = () => Math.min(W * 0.27, H * 0.2);
  const X = (f, z) => W / 2 + (f - 1) * faixaL() * p(z);
  const U = (z) => faixaL() * 1.12 * p(z);

  function desenharCenario(dist) {
    const hy = horizonte();
    const ceu = ctx.createLinearGradient(0, 0, 0, hy);
    ceu.addColorStop(0, '#7cc4ff');
    ceu.addColorStop(1, '#ffe2c4');
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, W, hy + 2);
    // nuvens e morros ao fundo, andando devagar
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let k = 0; k < 4; k++) {
      const x = ((k * 0.31 * W - dist * 0.6) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15;
      const y = hy * (0.2 + (k % 2) * 0.2);
      for (const [dx, dy, r] of [[0, 0, 16], [18, -6, 20], [38, 0, 15]]) {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, r * (W / 400), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = '#8fd18b';
    ctx.beginPath();
    ctx.moveTo(0, hy);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, hy - 18 - Math.sin((x + dist * 0.3) / 60) * 10 - Math.sin(x / 23) * 4);
    ctx.lineTo(W, hy);
    ctx.fill();
    // grama dos lados
    ctx.fillStyle = '#6cc070';
    ctx.fillRect(0, hy, W, H - hy);
    // rua em faixas que passam, para dar sensação de velocidade
    const borda = 1.62;
    for (let z = cor.LONGE; z > -C * 0.5; z -= 2) {
      const z2 = z - 2;
      const k = Math.floor((z + dist) / 2);
      ctx.fillStyle = k % 2 ? '#e7d7c3' : '#efe2d1';
      ctx.beginPath();
      ctx.moveTo(X(1 - borda, z), Y(z));
      ctx.lineTo(X(1 + borda, z), Y(z));
      ctx.lineTo(X(1 + borda, z2), Y(z2));
      ctx.lineTo(X(1 - borda, z2), Y(z2));
      ctx.fill();
      // calçada colorida nas bordas
      ctx.fillStyle = k % 2 ? '#ff8fa3' : '#fff';
      for (const lado of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(X(1 + lado * borda, z), Y(z));
        ctx.lineTo(X(1 + lado * (borda + 0.14), z), Y(z));
        ctx.lineTo(X(1 + lado * (borda + 0.14), z2), Y(z2));
        ctx.lineTo(X(1 + lado * borda, z2), Y(z2));
        ctx.fill();
      }
      // divisórias das faixas
      if (k % 2) {
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (const f of [0.5, 1.5]) {
          ctx.beginPath();
          ctx.moveTo(X(f - 0.025, z), Y(z));
          ctx.lineTo(X(f + 0.025, z), Y(z));
          ctx.lineTo(X(f + 0.025, z2), Y(z2));
          ctx.lineTo(X(f - 0.025, z2), Y(z2));
          ctx.fill();
        }
      }
    }
  }

  // Árvores e postes ao lado da rua.
  function enfeites(dist) {
    const lista = [];
    const passo = 7;
    const ini = Math.ceil(dist / passo) * passo;
    for (let d = ini; d < dist + cor.LONGE; d += passo) {
      const z = d - dist;
      const k = Math.round(d / passo);
      lista.push({ z, f: k % 2 ? -1.15 : 3.15, tipo: k % 3 === 0 ? 'poste' : 'arvore' });
      lista.push({ z: z + passo / 2, f: k % 2 ? 3.15 : -1.15, tipo: k % 4 === 0 ? 'flor' : 'arvore' });
    }
    return lista;
  }

  function desenharEnfeite(o) {
    const x = X(o.f, o.z); const y = Y(o.z); const u = U(o.z);
    if (o.tipo === 'arvore') {
      ctx.fillStyle = '#8a5a3c';
      ctx.fillRect(x - u * 0.06, y - u * 0.9, u * 0.12, u * 0.9);
      ctx.fillStyle = '#3fa05a';
      for (const [dx, dy, r] of [[0, -1.2, 0.42], [-0.25, -0.95, 0.3], [0.25, -0.95, 0.3]]) {
        ctx.beginPath(); ctx.arc(x + dx * u, y + dy * u, r * u, 0, Math.PI * 2); ctx.fill();
      }
    } else if (o.tipo === 'poste') {
      ctx.fillStyle = '#5b5f6b';
      ctx.fillRect(x - u * 0.03, y - u * 1.7, u * 0.06, u * 1.7);
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath(); ctx.arc(x, y - u * 1.72, u * 0.1, 0, Math.PI * 2); ctx.fill();
    } else {
      for (const [dx, c] of [[-0.15, '#ff6f91'], [0.05, '#ffd21f'], [0.2, '#7b6cf6']]) {
        ctx.fillStyle = '#3fa05a'; ctx.fillRect(x + dx * u - 1, y - u * 0.3, 2, u * 0.3);
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * u, y - u * 0.32, u * 0.07, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function moeda(x, y, r, giro) {
    const larg = Math.max(0.18, Math.abs(Math.cos(giro)));
    ctx.save();
    ctx.translate(x, y);
    // borda da moeda aparece quando ela gira
    ctx.fillStyle = '#b07800';
    ctx.beginPath(); ctx.ellipse(r * 0.08 * Math.sign(Math.cos(giro) || 1), 0, r * larg, r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(larg, 1);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#fff7c2'); g.addColorStop(0.45, '#ffd84a'); g.addColorStop(1, '#d99a00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c88a00'; ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c88a00';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rr = k % 2 ? r * 0.18 : r * 0.42; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.fill();
    ctx.restore();
  }

  const ICONE = { ima: '🧲', pulo: '👟', maleta: '🎒', escudo: '🛡️', raio: '⚡' };
  const COR_BOLHA = { ima: '#ff5a5a', pulo: '#35c46a', maleta: '#a2622d', escudo: '#3e8bff', raio: '#ffb800' };
  function bolha(x, y, r, tipo, t) {
    const yy = y + Math.sin(t * 4) * r * 0.12;
    const g = ctx.createRadialGradient(x - r * 0.35, yy - r * 0.4, r * 0.1, x, yy, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, COR_BOLHA[tipo]); g.addColorStop(1, '#00000055');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, yy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.stroke();
    ctx.font = `${Math.round(r * 1.1)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ICONE[tipo], x, yy + r * 0.05);
    ctx.textBaseline = 'alphabetic';
  }

  function desenharObjeto(o, t) {
    const z = o.z;
    if (z > cor.LONGE) return;
    const x = X(o.faixa, z); const y = Y(z); const u = U(z); const lf = faixaL() * p(z);
    if (o.tipo === 'moeda') return moeda(x, y - (o.h ?? 0.5) * u, u * 0.17, t * 5 + o.z * 0.4);
    if (ICONE[o.tipo]) return bolha(x, y - (o.h ?? 0.7) * u, u * 0.24, o.tipo, t);
    if (o.tipo === 'cerca') {
      const w = lf * 0.86; const h = u * 0.5;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - w / 2, y - h, w * 0.08, h); ctx.fillRect(x + w / 2 - w * 0.08, y - h, w * 0.08, h);
      for (const [yy, c] of [[0.85, '#e5484d'], [0.45, '#e5484d']]) {
        ctx.fillStyle = c; ctx.fillRect(x - w / 2, y - h * yy, w, h * 0.22);
        ctx.fillStyle = '#fff';
        for (let k = 0; k < 4; k++) ctx.fillRect(x - w / 2 + (k * 2 + 1) * w / 8, y - h * yy, w / 8, h * 0.22);
      }
      return;
    }
    if (o.tipo === 'faixa') {
      const w = lf * 0.9;
      ctx.fillStyle = '#6b5f8a';
      ctx.fillRect(x - w / 2, y - u * 2.05, w * 0.05, u * 2.05); ctx.fillRect(x + w / 2 - w * 0.05, y - u * 2.05, w * 0.05, u * 2.05);
      ctx.fillStyle = '#7b6cf6'; ctx.fillRect(x - w / 2, y - u * 2.02, w, u * 0.3);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(u * 0.2)}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('★ ★ ★', x, y - u * 1.8);
      const cores = ['#ffd21f', '#ff6f91', '#3fb6a8'];
      for (const [altura, desloc] of [[1.7, 0], [1.25, 0.5]]) {
        ctx.strokeStyle = 'rgba(80,60,120,.6)'; ctx.lineWidth = Math.max(1, u * 0.015);
        ctx.beginPath(); ctx.moveTo(x - w / 2, y - u * altura); ctx.quadraticCurveTo(x, y - u * (altura - 0.15), x + w / 2, y - u * altura); ctx.stroke();
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = cores[(k + desloc * 2) % 3];
          const x0 = x - w / 2 + ((k + 0.1) * w) / 6;
          const yb = y - u * (altura - 0.06 - Math.sin(((k + 0.5) / 6) * Math.PI) * 0.13);
          ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x0 + w / 7, yb); ctx.lineTo(x0 + w / 14, yb + u * 0.2); ctx.fill();
        }
      }
      return;
    }
    // carrinho de sorvete: topo em perspectiva e frente
    const z2 = z + o.comp;
    const w1 = lf * 0.86; const w2 = faixaL() * p(z2) * 0.86;
    const x2 = X(o.faixa, z2); const y2 = Y(z2);
    const h1 = u * 1.25; const h2 = U(z2) * 1.25;
    ctx.fillStyle = '#d9e8ff';
    ctx.beginPath();
    ctx.moveTo(x - w1 / 2, y - h1); ctx.lineTo(x + w1 / 2, y - h1); ctx.lineTo(x2 + w2 / 2, y2 - h2); ctx.lineTo(x2 - w2 / 2, y2 - h2);
    ctx.fill();
    ctx.fillStyle = '#b9d2f5';
    const lado = o.faixa < 1 ? 1 : -1;
    if (o.faixa !== 1) {
      ctx.beginPath();
      ctx.moveTo(x + lado * w1 / 2, y - h1); ctx.lineTo(x2 + lado * w2 / 2, y2 - h2); ctx.lineTo(x2 + lado * w2 / 2, y2); ctx.lineTo(x + lado * w1 / 2, y);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - w1 / 2, y - h1, w1, h1 * 0.92);
    ctx.fillStyle = '#ff6f91';
    for (let k = 0; k < 5; k++) if (k % 2 === 0) ctx.fillRect(x - w1 / 2 + (k * w1) / 5, y - h1, w1 / 5, h1 * 0.22);
    ctx.fillStyle = '#3e8bff'; ctx.font = `${Math.round(h1 * 0.34)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('🍦', x, y - h1 * 0.3);
    ctx.fillStyle = '#333';
    for (const dx of [-0.32, 0.32]) { ctx.beginPath(); ctx.arc(x + dx * w1, y - h1 * 0.05, h1 * 0.1, 0, Math.PI * 2); ctx.fill(); }
  }

  function desenhar(t) {
    if (!W) return;
    if (mundo) {
      const tema = cenarioDaCorrida(prefs.cenario ?? 'passeio', s?.dist ?? 0);
      if (s && rodando && tema !== temaVisto) {
        if (temaVisto) {
          palco.classList.remove('troca-cenario'); void palco.offsetWidth; palco.classList.add('troca-cenario');
          ctl.status(`Chegando: ${CENARIOS.find((c) => c.id === tema).nome}!`, 'voce');
        }
        temaVisto = tema;
      }
      mundo.desenhar(s ?? parado, t, prefs.personagem, tema);
      ctx.clearRect(0, 0, W, H);
      if (s?.supercarga > 0) linhasDeVelocidade(t);
      return;
    }
    const dist = s?.dist ?? 0;
    ctx.clearRect(0, 0, W, H);
    const alvoCamera = Math.max(0, (s?.y ?? 0) - 1.1) * U(0) * 0.8;
    camera += (alvoCamera - camera) * 0.15;
    ctx.save();
    ctx.translate(0, camera);
    if (camera > 0) { ctx.fillStyle = '#7cc4ff'; ctx.fillRect(0, -camera, W, camera + 2); }
    desenharCenario(dist);
    const objs = s ? s.objetos.filter((o) => !o.pego) : [];
    const longe = [...enfeites(dist).map((o) => ({ ...o, enfeite: true })), ...objs].sort((a, b) => b.z - a.z);
    const perto = longe.filter((o) => o.z <= -0.3);
    for (const o of longe) { if (o.z > -0.3) (o.enfeite ? desenharEnfeite(o) : desenharObjeto(o, t)); }
    // personagem
    const x = X(s?.x ?? 1, 0); const y = Y(0); const u = U(0);
    const naPrancha = (s?.skate ?? 0) > 0;
    const altura = (s?.y ?? 0) + (naPrancha ? 0.14 : 0);
    if (s?.supercarga > 0) linhasDeVelocidade(t);
    if (s?.escudo || s?.ima || s?.supercarga > 0) {
      const g = ctx.createRadialGradient(x, y - (altura + 0.65) * u, u * 0.1, x, y - (altura + 0.65) * u, u * 0.85);
      const cor_ = s.supercarga > 0 ? '255,200,40' : s.escudo ? '80,170,255' : '255,90,90';
      g.addColorStop(0, `rgba(${cor_},.05)`); g.addColorStop(0.7, `rgba(${cor_},.28)`); g.addColorStop(1, `rgba(${cor_},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y - (altura + 0.65) * u, u * 0.62, u * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (naPrancha) desenharSkate(x, y - altura * u + u * 0.02, u, s.skateTipo, t, (s?.y ?? 0));
    if (s?.superPulo > 0 && altura < 0.1) {
      ctx.strokeStyle = 'rgba(53,196,106,.7)'; ctx.lineWidth = u * 0.03;
      for (const k of [0, 1]) { ctx.beginPath(); ctx.ellipse(x, y, u * (0.3 + k * 0.12 + (t * 2 % 0.12)), u * (0.08 + k * 0.03), 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    desenharDeCostas(ctx, x, y, u, {
      fase: naPrancha ? 0.3 : (s?.dist ?? t * 3) * 1.6,
      pulo: altura,
      deslizando: s?.deslizando ?? 0,
      voando: (s?.voo ?? 0) > 0,
      ...prefs.personagem,
      piscando: (s?.invencivel ?? 0) > 0 && Math.floor(t * 12) % 2 === 0,
    });
    if ((s?.voo ?? 0) > 0) desenharMaleta(x, y - altura * u, u, t);
    for (const o of perto) (o.enfeite ? desenharEnfeite(o) : desenharObjeto(o, t));
    ctx.restore();
  }

  function linhasDeVelocidade(t) {
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + t * 0.7;
      const r0 = W * (0.35 + ((k * 37 + Math.floor(t * 20)) % 10) / 30);
      const cx = W / 2; const cy = horizonte() + H * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.8);
      ctx.lineTo(cx + Math.cos(a) * (r0 + W * 0.15), cy + Math.sin(a) * (r0 + W * 0.15) * 0.8);
      ctx.stroke();
    }
  }

  // Skate visto de trás: tábua com espessura; o voador brilha e flutua, o supersônico solta fogo.
  function desenharSkate(x, y, u, tipo, t, noAr) {
    const w = u * 0.56; const e = u * 0.06;
    if (tipo === 'voador') {
      const g = ctx.createRadialGradient(x, y + u * 0.08, 0, x, y + u * 0.08, w * 0.7);
      g.addColorStop(0, 'rgba(90,230,255,.7)'); g.addColorStop(1, 'rgba(90,230,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y + u * 0.1, w * 0.7, u * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (tipo === 'supersonico') {
      for (const lado of [-1, 1]) {
        const g = ctx.createLinearGradient(0, y, 0, y + u * 0.35);
        g.addColorStop(0, '#fff3a0'); g.addColorStop(0.4, '#ff9a1f'); g.addColorStop(1, 'rgba(255,60,30,0)');
        ctx.fillStyle = g;
        const flk = Math.sin(t * 40 + lado) * u * 0.04;
        ctx.beginPath(); ctx.moveTo(x + lado * w * 0.3 - u * 0.05, y + e); ctx.lineTo(x + lado * w * 0.3 + u * 0.05, y + e); ctx.lineTo(x + lado * w * 0.3, y + u * 0.32 + flk); ctx.fill();
      }
    }
    const cores = { classico: ['#e7b57a', '#a8682f'], voador: ['#8ff0ff', '#1b9dc2'], supersonico: ['#ff7a6b', '#b8241a'] }[tipo] ?? ['#e7b57a', '#a8682f'];
    // a ponta de trás fica perto (mais larga e mais baixa); a da frente some para dentro da rua
    const perto = { l: u * 0.17, y: y + u * 0.03 };
    const longe = { l: u * 0.12, y: y - u * 0.2 };
    const tabua = (dy, cor_) => {
      ctx.fillStyle = cor_;
      ctx.beginPath();
      ctx.moveTo(x - perto.l, perto.y + dy);
      ctx.quadraticCurveTo(x, perto.y + dy + u * 0.07, x + perto.l, perto.y + dy);
      ctx.lineTo(x + longe.l, longe.y + dy);
      ctx.quadraticCurveTo(x, longe.y + dy - u * 0.06, x - longe.l, longe.y + dy);
      ctx.closePath();
      ctx.fill();
    };
    tabua(u * 0.035, cores[1]); // espessura
    const g = ctx.createLinearGradient(x - perto.l, 0, x + perto.l, 0);
    g.addColorStop(0, cores[0]); g.addColorStop(0.6, cores[0]); g.addColorStop(1, cores[1]);
    tabua(0, g);
    // lixa com faixa no meio
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.fillRect(x - u * 0.02, longe.y + u * 0.02, u * 0.04, perto.y - longe.y);
    if (tipo === 'classico' && !noAr) {
      ctx.fillStyle = '#e5484d';
      for (const lado of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + lado * perto.l * 0.85, perto.y + u * 0.06, u * 0.035, u * 0.045, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  // Maleta voadora nas costas, com dois jatos de fogo.
  function desenharMaleta(x, y, u, t) {
    const cx = x; const cy = y - u * 0.86;
    for (const lado of [-1, 1]) {
      const g = ctx.createLinearGradient(0, cy + u * 0.14, 0, cy + u * 0.6);
      g.addColorStop(0, '#fff3a0'); g.addColorStop(0.35, '#ff9a1f'); g.addColorStop(1, 'rgba(255,60,30,0)');
      ctx.fillStyle = g;
      const flk = Math.sin(t * 35 + lado * 2) * u * 0.05;
      ctx.beginPath(); ctx.moveTo(cx + lado * u * 0.08 - u * 0.04, cy + u * 0.14); ctx.lineTo(cx + lado * u * 0.08 + u * 0.04, cy + u * 0.14); ctx.lineTo(cx + lado * u * 0.08, cy + u * 0.55 + flk); ctx.fill();
    }
    const g = ctx.createLinearGradient(cx - u * 0.17, 0, cx + u * 0.17, 0);
    g.addColorStop(0, '#c98a4e'); g.addColorStop(0.5, '#a2622d'); g.addColorStop(1, '#6e3d18');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(cx - u * 0.17, cy - u * 0.14, u * 0.34, u * 0.28, u * 0.04); ctx.fill();
    ctx.fillStyle = '#e8c27a';
    ctx.fillRect(cx - u * 0.17, cy - u * 0.02, u * 0.34, u * 0.025);
    ctx.fillRect(cx - u * 0.03, cy - u * 0.05, u * 0.06, u * 0.06);
    ctx.strokeStyle = '#6e3d18'; ctx.lineWidth = u * 0.025;
    ctx.beginPath(); ctx.arc(cx, cy - u * 0.14, u * 0.06, Math.PI, 0); ctx.stroke();
  }

  function desenharHud() {
    const emCorrida = Boolean(s) && rodando;
    skateEl.hidden = !emCorrida;
    turboEl.hidden = !emCorrida;
    if (!s) { hud.innerHTML = ''; return; }
    const tempo = (v, icone) => (v > 0 ? `<span class="poder">${icone} ${Math.ceil(v)}s</span>` : '');
    hud.innerHTML = `<span class="pts">${cor.pontos(s).toLocaleString('pt-BR')}</span><span class="est">🪙 ${s.moedas}</span>${
      tempo(s.ima, '🧲')}${tempo(s.superPulo, '👟')}${tempo(s.voo, '🎒')}${tempo(s.supercarga, '⚡')}${tempo(s.skate, '🛹')}${s.escudo ? '<span class="poder">🛡️</span>' : ''}`;
    skateEl.innerHTML = `🛹<small>${s.cargas}</small>`;
    skateEl.disabled = s.cargas <= 0 || s.skate > 0;
    turboEl.style.setProperty('--carga', `${Math.round(s.energia * 100)}%`);
    turboEl.classList.toggle('pronto', s.energia >= 1 && s.supercarga <= 0);
    turboEl.disabled = !(s.energia >= 1 && s.supercarga <= 0);
  }

  const SOM = {
    pulo: 'passo', superpulo: 'superpulo', troca: 'clique', moeda: 'moeda', raio: 'acerto', 'carga-cheia': 'premio', poder: 'acerto',
    escudo: 'captura', desliza: 'carta', batida: 'erro', maleta: 'voo', supercarga: 'turbo', skate: 'skate', 'skate-quebrou': 'quebra', quebra: 'quebra',
  };

  function laco(agora) {
    if (!rodando || !ativa()) { rodando = false; return; }
    const dt = anterior ? (agora - anterior) / 1000 : 0;
    anterior = agora;
    if (!pausado) {
      cor.avancar(s, dt);
      for (const e of s.eventos) if (SOM[e]) ctl.som(SOM[e]);
      s.eventos.length = 0;
      if (++quadro % 6 === 0) desenharHud();
    }
    desenhar(agora / 1000);
    if (!s.vivo) { rodando = false; desenharHud(); return fimDeJogo(); }
    requestAnimationFrame(laco);
  }

  function comecar() {
    ctl.som('clique');
    ativa = ctl.ativa();
    const c = prefs.carteira;
    s = cor.nova(ctl.nivel(), { poderes: c.poderes, skate: c.skate, cargas: c.cargas });
    temaVisto = null;
    camada.innerHTML = '';
    camada.hidden = true;
    pausaEl.hidden = false;
    pausado = false;
    rodando = true;
    anterior = 0;
    ctl.status('◀ ▶ troca de faixa · ▲ pula · ▼ desliza', 'voce');
    requestAnimationFrame(laco);
  }

  function pausar(sim) {
    if (!rodando && sim) return;
    pausado = sim;
    pausaEl.textContent = sim ? '▶' : 'Ⅱ';
    pausaEl.setAttribute('aria-label', sim ? 'Continuar' : 'Pausar');
    camada.hidden = !sim;
    if (sim) {
      camada.innerHTML = '<div class="cartao-corrida"><strong>Pausado</strong></div>';
      const b = el('button', 'botao', 'Continuar');
      b.onclick = () => pausar(false);
      camada.firstChild.append(b);
    } else anterior = 0;
  }
  pausaEl.onclick = () => pausar(!pausado);
  document.addEventListener('visibilitychange', () => { if (document.hidden && rodando) pausar(true); });

  const hoje = () => new Date().toLocaleDateString('sv-SE');
  const fmt = (n) => n.toLocaleString('pt-BR');
  const SKATE_SVG = {
    classico: '<svg viewBox="0 0 60 30"><rect x="4" y="8" width="52" height="9" rx="4.5" fill="#d79a5b"/><rect x="4" y="8" width="52" height="4" rx="2" fill="#e7b57a"/><circle cx="16" cy="22" r="4" fill="#e5484d"/><circle cx="44" cy="22" r="4" fill="#e5484d"/></svg>',
    voador: '<svg viewBox="0 0 60 30"><ellipse cx="30" cy="24" rx="24" ry="4" fill="#5ae6ff" opacity=".5"/><rect x="4" y="8" width="52" height="9" rx="4.5" fill="#1b9dc2"/><rect x="4" y="8" width="52" height="4" rx="2" fill="#8ff0ff"/></svg>',
    supersonico: '<svg viewBox="0 0 60 30"><path d="M14 17 L22 17 L18 29Z M38 17 L46 17 L42 29Z" fill="#ff9a1f"/><rect x="4" y="8" width="52" height="9" rx="4.5" fill="#b8241a"/><rect x="4" y="8" width="52" height="4" rx="2" fill="#ff7a6b"/><path d="M20 12 L30 10 L28 13 L38 11" stroke="#fff3a0" stroke-width="1.6" fill="none"/></svg>',
  };

  function carteiraHtml() {
    const c = prefs.carteira;
    return `<div class="carteira"><span>🪙 <b>${fmt(c.moedas)}</b></span><span>🛹 <b>${c.cargas}</b> ${c.cargas === 1 ? 'carga' : 'cargas'}</span></div>`;
  }

  function salvarCarteira(c) { prefs.carteira = c; guardar(); }

  function telaInicial(aba = 'correr', aviso = '') {
    rodando = false;
    s = null;
    pausaEl.hidden = true;
    camada.hidden = false;
    salvarCarteira(loja.completarMissoes(prefs.carteira));
    const c = prefs.carteira;
    const abas = [['correr', 'Correr'], ['loja', 'Loja'], ['missoes', 'Prêmios']];
    let corpo = '';
    if (aba === 'correr') {
      const r = recorde();
      const presente = loja.presenteDisponivel(c, hoje());
      corpo = `
        <div class="retrato">${retrato(prefs.personagem)}</div>
        <small>${r ? `Recorde: ${fmt(r)} pontos` : 'Pegue moedas, desvie dos obstáculos e use os poderes!'}</small>
        ${presente ? '<button class="botao presente" data-presente>🎁 Abrir o presente do dia</button>' : ''}
        <div class="escolha"><span>Pele</span>${PELES.map((cor_, k) => `<button class="amostra${prefs.personagem.pele === k ? ' sel' : ''}" data-pele="${k}" style="background:${cor_}" aria-label="Tom de pele ${k + 1}"></button>`).join('')}</div>
        <div class="escolha"><span>Roupa</span>${ROUPAS.map((cor_, k) => `<button class="amostra${prefs.personagem.roupa === k ? ' sel' : ''}" data-roupa="${k}" style="background:${cor_}" aria-label="Cor da roupa ${k + 1}"></button>`).join('')}</div>
        <div class="cenarios"><span>Cenário</span>${CENARIOS.map((c_) => `<button data-cenario="${c_.id}" aria-pressed="${(prefs.cenario ?? 'passeio') === c_.id}"><b>${c_.icone}</b>${c_.nome}</button>`).join('')}</div>
        <small class="equipado">${SKATE_SVG[c.skate]} ${cor.SKATES[c.skate].nome}: toque em 🛹 durante a corrida</small>
        <button class="botao grande" data-correr>Correr!</button>`;
    } else if (aba === 'loja') {
      corpo = `
        <h4>Skates</h4>
        ${loja.SKATES_LOJA.map((it) => {
          const tem = c.skates.includes(it.id);
          const usando = c.skate === it.id;
          const botao = usando ? '<span class="usando">Em uso</span>' : tem ? `<button class="botao secundario" data-equipar="${it.id}">Usar</button>` : `<button class="botao" data-skate="${it.id}" ${c.moedas < it.preco ? 'disabled' : ''}>🪙 ${fmt(it.preco)}</button>`;
          return `<div class="item-loja">${SKATE_SVG[it.id]}<div><b>${cor.SKATES[it.id].nome}</b><small>${it.texto}</small></div>${botao}</div>`;
        }).join('')}
        <h4>Cargas de skate</h4>
        <div class="item-loja"><span class="icone-item">🛹</span><div><b>Você tem ${c.cargas}</b><small>Cada carga liga o skate por ${cor.DURACAO_SKATE} s.</small></div>
          <span class="dupla"><button class="botao" data-cargas="1" ${c.moedas < loja.PRECO_CARGA ? 'disabled' : ''}>+1 · 🪙 ${loja.PRECO_CARGA}</button><button class="botao" data-cargas="5" ${c.moedas < loja.PRECO_CARGA * 5 ? 'disabled' : ''}>+5 · 🪙 ${fmt(loja.PRECO_CARGA * 5)}</button></span></div>
        <h4>Poderes da pista</h4>
        ${Object.entries(loja.PODERES).map(([id, pd]) => {
          const nv = c.poderes[id];
          const preco = loja.PRECO_NIVEL[nv];
          const botao = nv >= loja.NIVEL_MAXIMO ? '<span class="usando">Máximo</span>' : `<button class="botao" data-poder="${id}" ${c.moedas < preco ? 'disabled' : ''}>🪙 ${fmt(preco)}</button>`;
          return `<div class="item-loja"><span class="icone-item">${pd.icone}</span><div><b>${pd.nome}</b><small>${pd.texto} Dura ${id === 'supercarga' ? Math.round(cor.duracao(nv) * 0.6) : id === 'maleta' ? Math.round(cor.duracao(nv) * 0.75) : cor.duracao(nv)} s.</small><span class="niveis-poder">${Array.from({ length: loja.NIVEL_MAXIMO }, (_, k) => `<i class="${k < nv ? 'ok' : ''}"></i>`).join('')}</span></div>${botao}</div>`;
        }).join('')}`;
    } else {
      const seg = c.presente?.seguidos ?? 0;
      corpo = `
        <h4>Missões</h4>
        ${c.missoes.map((m) => `<div class="item-loja missao"><span class="icone-item">🎯</span><div><b>${m.texto}</b><small>Vale numa corrida só</small></div><span class="premio">🪙 ${fmt(m.premio)}</span></div>`).join('')}
        <small>Missão cumprida é paga no fim da corrida e troca por outra, um pouco mais difícil.</small>
        <h4>Presente do dia</h4>
        <div class="dias">${loja.PRESENTES.map((v, k) => `<span class="${k < seg && !loja.presenteDisponivel(c, hoje()) ? 'ok' : ''}"><b>Dia ${k + 1}</b>🪙 ${v}${k === loja.PRESENTES.length - 1 ? ' + 🛹' : ''}</span>`).join('')}</div>
        ${loja.presenteDisponivel(c, hoje()) ? '<button class="botao presente" data-presente>🎁 Abrir o presente de hoje</button>' : '<small>Volte amanhã para o próximo presente. Dias seguidos valem mais!</small>'}`;
    }
    camada.innerHTML = `<div class="cartao-corrida inicio">
      <strong>Corrida dos Cachinhos</strong>
      ${carteiraHtml()}
      <div class="abas-corrida">${abas.map(([id, nome]) => `<button data-aba="${id}" aria-pressed="${id === aba}">${nome}</button>`).join('')}</div>
      ${aviso ? `<p class="aviso-loja">${aviso}</p>` : ''}
      <div class="corpo-aba">${corpo}</div>
    </div>`;
    ligarTelaInicial(aba);
    desenharHud();
    desenhar(0);
    ctl.status(aba === 'loja' ? 'Troque suas moedas por skates e poderes' : aba === 'missoes' ? 'Cumpra missões para ganhar moedas' : 'Escolha o visual e toque em Correr!', 'voce');
  }

  function ligarTelaInicial(aba) {
    const q = (sel) => camada.querySelectorAll(sel);
    q('[data-aba]').forEach((b) => { b.onclick = () => { ctl.som('clique'); telaInicial(b.dataset.aba); }; });
    q('[data-correr]').forEach((b) => { b.onclick = comecar; });
    q('[data-cenario]').forEach((b) => {
      b.onclick = () => { prefs.cenario = b.dataset.cenario; guardar(); ctl.som('clique'); telaInicial(aba); };
    });
    q('[data-pele],[data-roupa]').forEach((a) => {
      a.onclick = () => {
        if (a.dataset.pele) prefs.personagem.pele = Number(a.dataset.pele);
        if (a.dataset.roupa) prefs.personagem.roupa = Number(a.dataset.roupa);
        guardar();
        ctl.som('clique');
        telaInicial(aba);
      };
    });
    const resultado = (r, ok) => {
      if (r.erro) { ctl.som('erro'); telaInicial(aba, r.erro); return; }
      salvarCarteira(r.carteira);
      ctl.som('premio');
      telaInicial(aba, ok);
    };
    q('[data-skate]').forEach((b) => { b.onclick = () => resultado(loja.comprarSkate(prefs.carteira, b.dataset.skate), `${cor.SKATES[b.dataset.skate].nome} é seu!`); });
    q('[data-equipar]').forEach((b) => { b.onclick = () => resultado(loja.equipar(prefs.carteira, b.dataset.equipar), `Usando o ${cor.SKATES[b.dataset.equipar].nome}.`); });
    q('[data-cargas]').forEach((b) => { b.onclick = () => resultado(loja.comprarCargas(prefs.carteira, Number(b.dataset.cargas)), `+${b.dataset.cargas} ${b.dataset.cargas === '1' ? 'carga' : 'cargas'} de skate.`); });
    q('[data-poder]').forEach((b) => { b.onclick = () => resultado(loja.melhorar(prefs.carteira, b.dataset.poder), `${loja.PODERES[b.dataset.poder].nome} melhorou!`); });
    q('[data-presente]').forEach((b) => {
      b.onclick = () => {
        const r = loja.abrirPresente(prefs.carteira, hoje());
        if (r.erro) return resultado(r);
        resultado(r, `🎁 Presente do dia ${r.seguidos}: +${r.premio} moedas${r.bonusCarga ? ' e +1 carga de skate' : ''}!`);
      };
    });
  }

  function fimDeJogo() {
    const res = cor.resumo(s);
    const antes = recorde();
    const fechado = loja.fecharCorrida(prefs.carteira, res);
    salvarCarteira(fechado.carteira);
    ctl.fim('concluida', `Fim da corrida: ${fmt(res.pontos)} pontos`, null, { pontos: res.pontos, moedas: res.moedas, metros: res.metros });
    if (fechado.concluidas.length) setTimeout(() => ctl.som('premio'), 600);
    const novo = res.pontos > antes;
    pausaEl.hidden = true;
    camada.hidden = false;
    camada.innerHTML = `<div class="cartao-corrida">
      <div class="retrato pequeno">${retrato({ ...prefs.personagem, sorriso: 'uau' })}</div>
      <strong>${novo ? 'Novo recorde! 🎉' : 'Opa, bateu!'}</strong>
      <span class="grande-num">${fmt(res.pontos)}</span>
      <small>${res.metros} m${novo || !antes ? '' : ` · recorde ${fmt(antes)}`}</small>
      <div class="ganhos"><span>🪙 +${fmt(res.moedas)} moedas pegas</span>
        ${fechado.concluidas.map((m) => `<span class="missao-ok">🎯 ${m.texto} <b>+${fmt(m.premio)}</b></span>`).join('')}
      </div>
      ${carteiraHtml()}
    </div>`;
    const b = el('button', 'botao grande', 'Correr de novo');
    b.onclick = comecar;
    const v = el('button', 'botao secundario', 'Loja e prêmios');
    v.onclick = () => telaInicial('loja');
    camada.firstChild.append(b, v);
  }

  // ---------- Controles ----------
  const agir = (acao) => { if (s && rodando && !pausado) cor.comando(s, acao); };
  let toque = null;
  palco.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    toque = { x: e.clientX, y: e.clientY, feito: false };
  });
  palco.addEventListener('pointermove', (e) => {
    if (!toque || toque.feito) return;
    const dx = e.clientX - toque.x; const dy = e.clientY - toque.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    toque.feito = true;
    agir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'direita' : 'esquerda') : (dy < 0 ? 'pular' : 'deslizar'));
  });
  palco.addEventListener('pointerup', () => {
    if (toque && !toque.feito && s && rodando && !pausado) agir('pular'); // toque simples também pula
    toque = null;
  });
  skateEl.onclick = () => agir('skate');
  turboEl.onclick = () => agir('supercarga');
  controles.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao]');
    if (b) agir(b.dataset.acao);
  });
  const teclas = (e) => {
    if (!palco.isConnected) { document.removeEventListener('keydown', teclas); observador.disconnect(); mundo?.destruir(); mundo = null; return; }
    const mapa = { ArrowLeft: 'esquerda', a: 'esquerda', ArrowRight: 'direita', d: 'direita', ArrowUp: 'pular', w: 'pular', ' ': 'pular', ArrowDown: 'deslizar', s: 'deslizar', k: 'skate', e: 'supercarga' };
    const acao = mapa[e.key];
    if (acao && rodando) { e.preventDefault(); agir(acao); }
    if (e.key === 'Escape' || e.key === 'p') pausar(!pausado);
  };
  document.addEventListener('keydown', teclas);

  // Só para capturas de tela e testes: com ?demo no endereço, o estado da corrida fica acessível.
  if (new URLSearchParams(location.search).has('demo')) window.corridaDemo = { estado: () => s };

  telaInicial();
  return { reiniciar: () => telaInicial() };
}
