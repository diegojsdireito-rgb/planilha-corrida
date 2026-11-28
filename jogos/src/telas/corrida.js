import * as cor from '../corrida.js';
import { el } from '../comum.js';
import { PERSONAGENS, personagemDe, miniatura } from '../personagens.js';
import { prefs, guardar, perfilAtual, temVariosPerfis } from '../dados.js';
import * as loja from '../loja.js';
import { ligarLaco, desligarLaco, desligarLacos } from '../som.js';
import { quemPersegue, OPCOES_FLORESTA, NOMES, EMOJI, SOM as SOM_PERSEGUIDOR } from '../perseguidores.js';
import { retrato, desenharDeCostas, PELES, ROUPAS } from '../personagem.js';

const C = 5; // distância da câmera: controla a perspectiva
// Os oito cenários (todos liberados) e o Passeio, que passa por todos. mini: a miniatura do botão (céu e chão).
const CENARIOS = [
  { id: 'cidade', nome: 'Cidade', curto: 'Cidade', icone: '🏙️', mini: ['#7cc4ff', '#ffe2c4', '#6cc070'] },
  { id: 'praia', nome: 'Praia', curto: 'Praia', icone: '🏖️', mini: ['#1d9bf0', '#fff1d6', '#eed39a'] },
  { id: 'floresta', nome: 'Floresta', curto: 'Floresta', icone: '🌲', mini: ['#4fa6e0', '#e4f2d6', '#4f9a45'] },
  { id: 'neve', nome: 'Vila da Neve', curto: 'Neve', icone: '❄️', mini: ['#7fa9cf', '#f2f6fa', '#ffffff'] },
  { id: 'doces', nome: 'Terra dos Doces', curto: 'Doces', icone: '🍭', mini: ['#ff8fcf', '#fff2fb', '#7a4424'] },
  { id: 'parque', nome: 'Parque de Diversões', curto: 'Parque', icone: '🎡', mini: ['#6f6cf0', '#ffd9b4', '#79cc6b'] },
  { id: 'deserto', nome: 'Deserto do Oásis', curto: 'Deserto', icone: '🏜️', mini: ['#ff6f61', '#ffe7ad', '#efc57f'] },
  { id: 'lua', nome: 'Passeio na Lua', curto: 'Lua', icone: '🌙', mini: ['#04050d', '#1f2a58', '#a3a8b2'] },
  { id: 'passeio', nome: 'Passeio', curto: 'Passeio', icone: '🔄', mini: null },
];
// Cenário em que a corrida está agora (o Passeio troca a cada 500 m, pelos oito).
export const { cenarioDaCorrida } = cor;

export function recorde() {
  let r = 0;
  for (const h of prefs.historico) if (h.j === 'corrida' && h.pontos > r) r = h.pontos;
  return r;
}

export function montar(area, ctl) {
  // Tela cheia: a corrida cobre o app inteiro e se controla só com gestos.
  const palco = el('div', 'corrida tela-cheia');
  document.documentElement.classList.add('jogo-tela-cheia');
  const tela3d = el('canvas', 'tela-3d');
  const tela = el('canvas');
  tela.setAttribute('role', 'img');
  tela.setAttribute('aria-label', 'Corrida: deslize para os lados para trocar de faixa, para cima para pular e para baixo para deslizar');
  const hud = el('div', 'corrida-hud');
  const pausaEl = el('button', 'botao-icone pausa', 'Ⅱ');
  pausaEl.setAttribute('aria-label', 'Pausar');
  const camada = el('div', 'corrida-camada');
  const decolarEl = el('button', 'acao-decolar');
  decolarEl.hidden = true;
  // botão do patinete (embaixo, à direita): sobe no patinete e, no elétrico, liga o turbo
  const patineteEl = el('button', 'acao-patinete');
  patineteEl.hidden = true;
  const avisoManobra = el('div', 'aviso-manobra');
  avisoManobra.hidden = true;
  const sairEl = el('button', 'botao-icone sair-corrida', '‹');
  sairEl.setAttribute('aria-label', 'Sair da corrida');
  const somEl = el('button', 'botao-icone som-corrida');
  const dicaGestos = el('div', 'dica-gestos', '<b>Deslize</b> ◀ ▶ troca de faixa · ▲ pula · ▼ desliza<br><b>Toque duas vezes</b> para subir no skate 🛹<br><b>Botão 🛴</b> para subir no patinete');
  dicaGestos.hidden = true;
  palco.append(tela3d, tela, hud, pausaEl, decolarEl, patineteEl, avisoManobra, sairEl, somEl, dicaGestos, camada);
  area.append(palco);
  sairEl.onclick = () => ctl.sair();
  const desenharSom = () => { somEl.textContent = prefs.som ? '🔊' : '🔇'; somEl.setAttribute('aria-label', prefs.som ? 'Desligar sons' : 'Ligar sons'); };
  somEl.onclick = () => { ctl.alternarSom(); desenharSom(); };
  desenharSom();
  // a página por trás não rola nem puxa: deslizar na corrida é só jogada (as telas da loja continuam rolando)
  palco.addEventListener('touchmove', (e) => { if (!e.target.closest('.cartao-corrida')) e.preventDefault(); }, { passive: false });

  const ctx = tela.getContext('2d');
  let vitrinePose = 'vitrine'; let vitrineAnimando = false;
  let previa = null; // personagem que está sendo visto na galeria (pode ainda não ser seu)
  // o que a menina 3D mostra: personagem, pele, cor e estilo de roupa
  const visualAtual = () => {
    const c = prefs.carteira;
    if (previa && previa !== c.personagem) return { ...prefs.personagem, pele: personagemDe(previa).pele, estilo: c.estilo, personagem: previa, palco: 'galeria' };
    return { ...prefs.personagem, estilo: c.estilo, personagem: c.personagem, palco: previa ? 'galeria' : undefined };
  };
  let capturada = null; // segundos desde que quem persegue a alcançou (cena da captura)
  let temaVisto = null; let camera = 0; let s = null; let rodando = false; let pausado = false; let quadro = 0; let anterior = 0; let W = 0; let H = 0; let dpr = 1;
  let ativa = ctl.ativa();
  let congelado = false; // só no ?demo, para capturas de tela

  // 3D quando o aparelho permite; senão, o desenho em 2D continua valendo.
  let mundo = null;
  const parado = cor.nova('medio');
  parado.ultimaLinha = 1e9;
  import('../mundo3d.js')
    .then((m) => {
      if (!palco.isConnected) return;
      mundo = m.criarMundo(tela3d);
      if (mundo) { palco.classList.add('em-3d'); medir(); animarVitrine(); }
    })
    .catch(() => { /* fica no 2D */ });

  // Ao sair da tela, libera a memória do 3D e devolve a rolagem ao app.
  const vigia = setInterval(() => {
    if (palco.isConnected) return;
    clearInterval(vigia);
    document.documentElement.classList.remove('jogo-tela-cheia');
    calarTudo();
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

  // Cores e enfeites de cada cenário no desenho 2D (quando o aparelho não tem 3D).
  const PALETA_2D = {
    cidade: { ceu: ['#7cc4ff', '#ffe2c4'], nuvem: 'rgba(255,255,255,.9)', morro: '#8fd18b', chao: '#6cc070', rua: ['#e7d7c3', '#efe2d1'], borda: ['#ff8fa3', '#fff'], linha: 'rgba(255,255,255,.85)', enf: ['arvore', 'poste', 'flor'] },
    praia: { ceu: ['#1d9bf0', '#fff1d6'], nuvem: 'rgba(255,255,255,.9)', morro: '#21a7d8', chao: '#eed39a', rua: ['#c9965f', '#d6a46c'], borda: ['#ffffff', '#f2dca8'], linha: 'rgba(255,255,255,.8)', enf: ['coqueiro', 'guardasol', 'coqueiro'] },
    floresta: { ceu: ['#4fa6e0', '#e4f2d6'], nuvem: 'rgba(255,255,255,.85)', morro: '#5c8a6a', chao: '#4f9a45', rua: ['#9b7149', '#8e6640'], borda: ['#8a8f86', '#a0a69c'], linha: 'rgba(70,40,15,.35)', enf: ['pinheiro', 'arvore', 'cogumelo'] },
    neve: { ceu: ['#7fa9cf', '#f2f6fa'], nuvem: 'rgba(255,255,255,.95)', morro: '#9db4cc', chao: '#f6f9fc', rua: ['#e8f0f8', '#dce7f2'], borda: ['#c7dcef', '#ffffff'], linha: 'rgba(140,170,205,.8)', enf: ['pinheiroNeve', 'poste', 'boneco'] },
    doces: { ceu: ['#ff8fcf', '#fff2fb'], nuvem: 'rgba(255,200,235,.95)', morro: '#f7a8c8', chao: '#ffbfdc', rua: ['#7a4424', '#6b3a1f'], borda: ['#ff5fa2', '#ffffff'], linha: '#fff4fa', enf: ['pirulito', 'bengala', 'cupcake'] },
    parque: { ceu: ['#6f6cf0', '#ffd9b4'], nuvem: 'rgba(255,255,255,.75)', morro: '#9b8ad8', chao: '#79cc6b', rua: ['#e3d6be', '#d8cab0'], borda: ['#3e8bff', '#ffffff'], linha: '#2e8fe6', enf: ['balao', 'lampada', 'barraca'] },
    deserto: { ceu: ['#ff6f61', '#ffe7ad'], nuvem: 'rgba(255,240,220,.6)', morro: '#e3b06a', chao: '#efc57f', rua: ['#e2b36c', '#d9a961'], borda: ['#a8743c', '#c48d50'], linha: '#8a5a2b', enf: ['cacto', 'palmeira', 'pedra'] },
    lua: { ceu: ['#04050d', '#1f2a58'], nuvem: null, morro: '#6c717b', chao: '#8f949e', rua: ['#a3a8b2', '#979ca7'], borda: ['#5ae6ff', '#2d3a5a'], linha: '#5ae6ff', enf: ['foguete', 'antena', 'rocha'] },
  };
  const paleta = () => PALETA_2D[cenarioDaCorrida(prefs.cenario ?? 'passeio', s?.dist ?? 0)] ?? PALETA_2D.cidade;

  function desenharCenario(dist) {
    const hy = horizonte();
    const pl = paleta(); const tema = cenarioDaCorrida(prefs.cenario ?? 'passeio', dist);
    const ceu = ctx.createLinearGradient(0, 0, 0, hy);
    ceu.addColorStop(0, pl.ceu[0]);
    ceu.addColorStop(1, pl.ceu[1]);
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, W, hy + 2);
    if (tema === 'lua') {
      // céu estrelado com a Terra
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 60; k++) { const x = (k * 97.3) % W; const y = (k * 53.7) % (hy * 0.95); const r = k % 5 ? 0.8 : 1.5; ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(k + dist * 0.01)); ctx.fillRect(x, y, r, r); }
      ctx.globalAlpha = 1;
      const rx = W * 0.22; const ry = hy * 0.35; const rr = Math.min(W, hy) * 0.11;
      ctx.fillStyle = '#2a7fe0'; ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3fae5a'; for (const [dx, dy, r] of [[-0.3, -0.2, 0.35], [0.25, 0.25, 0.3], [0.35, -0.35, 0.2]]) { ctx.beginPath(); ctx.arc(rx + dx * rr, ry + dy * rr, r * rr, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(5,10,32,.4)'; ctx.beginPath(); ctx.arc(rx, ry, rr, -Math.PI / 2, Math.PI / 2); ctx.fill();
    } else if (tema === 'deserto') {
      ctx.fillStyle = 'rgba(255,241,184,.95)'; ctx.beginPath(); ctx.arc(W * 0.62, hy * 0.78, W * 0.09, 0, Math.PI * 2); ctx.fill();
    }
    // nuvens (de algodão-doce na Terra dos Doces) andando devagar
    if (pl.nuvem) {
      ctx.fillStyle = pl.nuvem;
      for (let k = 0; k < 4; k++) {
        const x = ((k * 0.31 * W - dist * 0.6) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15;
        const y = hy * (0.2 + (k % 2) * 0.2);
        for (const [dx, dy, r] of [[0, 0, 16], [18, -6, 20], [38, 0, 15]]) {
          ctx.beginPath(); ctx.arc(x + dx, y + dy, r * (W / 400), 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (tema === 'deserto') {
      // pirâmides lá longe
      ctx.fillStyle = '#d9a35c';
      for (const [fx, a] of [[0.15, 0.16], [0.32, 0.22], [0.8, 0.14]]) { const x = W * fx; ctx.beginPath(); ctx.moveTo(x - W * a * 0.6, hy); ctx.lineTo(x, hy - W * a * 0.55); ctx.lineTo(x + W * a * 0.6, hy); ctx.fill(); }
    } else if (tema === 'parque') {
      // roda-gigante ao fundo
      const cx = W * 0.8; const cy = hy * 0.74; const r = hy * 0.2;
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + dist * 0.004; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); ctx.fillStyle = ['#ff5a5a', '#ffd34d', '#35c46a', '#3e8bff'][k % 4]; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(cx - r * 0.6, hy); ctx.lineTo(cx, cy); ctx.lineTo(cx + r * 0.6, hy); ctx.stroke();
    }
    ctx.fillStyle = pl.morro;
    ctx.beginPath();
    ctx.moveTo(0, hy);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, hy - 18 - Math.sin((x + dist * 0.3) / 60) * 10 - Math.sin(x / 23) * 4);
    ctx.lineTo(W, hy);
    ctx.fill();
    // chão dos lados
    ctx.fillStyle = pl.chao;
    ctx.fillRect(0, hy, W, H - hy);
    // rua em faixas que passam, para dar sensação de velocidade
    const borda = 1.62;
    for (let z = cor.LONGE; z > -C * 0.5; z -= 2) {
      const z2 = z - 2;
      const k = Math.floor((z + dist) / 2);
      ctx.fillStyle = k % 2 ? pl.rua[0] : pl.rua[1];
      ctx.beginPath();
      ctx.moveTo(X(1 - borda, z), Y(z));
      ctx.lineTo(X(1 + borda, z), Y(z));
      ctx.lineTo(X(1 + borda, z2), Y(z2));
      ctx.lineTo(X(1 - borda, z2), Y(z2));
      ctx.fill();
      // calçada colorida nas bordas
      ctx.fillStyle = k % 2 ? pl.borda[0] : pl.borda[1];
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
        ctx.fillStyle = pl.linha;
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

  // Enfeites ao lado da rua: cada cenário tem os seus (árvores e postes na cidade, pirulitos nos doces...).
  function enfeites(dist) {
    const lista = [];
    const passo = 7;
    const [a, b, c] = paleta().enf;
    const ini = Math.ceil(dist / passo) * passo;
    for (let d = ini; d < dist + cor.LONGE; d += passo) {
      const z = d - dist;
      const k = Math.round(d / passo);
      lista.push({ z, f: k % 2 ? -1.15 : 3.15, tipo: k % 3 === 0 ? b : a });
      lista.push({ z: z + passo / 2, f: k % 2 ? 3.15 : -1.15, tipo: k % 4 === 0 ? c : a });
    }
    return lista;
  }

  const bolinha = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); ctx.fill(); };
  function desenharEnfeite(o) {
    const x = X(o.f, o.z); const y = Y(o.z); const u = U(o.z);
    switch (o.tipo) {
      case 'arvore':
        ctx.fillStyle = '#8a5a3c'; ctx.fillRect(x - u * 0.06, y - u * 0.9, u * 0.12, u * 0.9);
        for (const [dx, dy, r] of [[0, -1.2, 0.42], [-0.25, -0.95, 0.3], [0.25, -0.95, 0.3]]) bolinha(x + dx * u, y + dy * u, r * u, '#3fa05a');
        break;
      case 'poste': case 'lampada':
        ctx.fillStyle = '#5b5f6b'; ctx.fillRect(x - u * 0.03, y - u * 1.7, u * 0.06, u * 1.7);
        bolinha(x, y - u * 1.72, u * 0.1, o.tipo === 'poste' ? '#ffd36b' : ['#ff5fa2', '#5ae6ff', '#ffd34d'][Math.abs(Math.round(o.z)) % 3]);
        break;
      case 'flor':
        for (const [dx, c] of [[-0.15, '#ff6f91'], [0.05, '#ffd21f'], [0.2, '#7b6cf6']]) {
          ctx.fillStyle = '#3fa05a'; ctx.fillRect(x + dx * u - 1, y - u * 0.3, 2, u * 0.3);
          bolinha(x + dx * u, y - u * 0.32, u * 0.07, c);
        }
        break;
      case 'coqueiro': case 'palmeira':
        ctx.strokeStyle = '#9a6b3e'; ctx.lineWidth = Math.max(1, u * 0.1); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + u * 0.25, y - u, x + u * 0.15, y - u * 1.9); ctx.stroke();
        ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = Math.max(1, u * 0.08);
        for (const a of [-2.6, -2, -1.2, -0.5, 0.1]) { ctx.beginPath(); ctx.moveTo(x + u * 0.15, y - u * 1.9); ctx.quadraticCurveTo(x + u * 0.15 + Math.cos(a) * u * 0.5, y - u * 1.9 + Math.sin(a) * u * 0.5 - u * 0.15, x + u * 0.15 + Math.cos(a) * u * 0.7, y - u * 1.9 + Math.sin(a) * u * 0.3 + u * 0.2); ctx.stroke(); }
        break;
      case 'guardasol':
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - u * 1.3, 2, u * 1.3);
        for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#ff6f91'; ctx.beginPath(); ctx.moveTo(x, y - u * 1.45); ctx.arc(x, y - u * 1.2, u * 0.6, Math.PI + (k * Math.PI) / 4, Math.PI + ((k + 1) * Math.PI) / 4); ctx.fill(); }
        break;
      case 'pinheiro': case 'pinheiroNeve':
        ctx.fillStyle = '#6e4426'; ctx.fillRect(x - u * 0.05, y - u * 0.4, u * 0.1, u * 0.4);
        for (const [dy, w2] of [[0.35, 0.55], [0.85, 0.42], [1.3, 0.3]]) {
          ctx.fillStyle = '#2f7d46'; ctx.beginPath(); ctx.moveTo(x - w2 * u, y - dy * u); ctx.lineTo(x, y - (dy + 0.75) * u); ctx.lineTo(x + w2 * u, y - dy * u); ctx.fill();
          if (o.tipo === 'pinheiroNeve') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - w2 * u * 0.45, y - (dy + 0.42) * u); ctx.lineTo(x, y - (dy + 0.75) * u); ctx.lineTo(x + w2 * u * 0.45, y - (dy + 0.42) * u); ctx.fill(); }
        }
        break;
      case 'cogumelo':
        ctx.fillStyle = '#fff3dc'; ctx.fillRect(x - u * 0.05, y - u * 0.25, u * 0.1, u * 0.25);
        ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(x, y - u * 0.25, u * 0.2, Math.PI, 0); ctx.fill();
        bolinha(x - u * 0.08, y - u * 0.33, u * 0.035, '#fff'); bolinha(x + u * 0.07, y - u * 0.36, u * 0.03, '#fff');
        break;
      case 'boneco':
        bolinha(x, y - u * 0.3, u * 0.3, '#ffffff'); bolinha(x, y - u * 0.8, u * 0.22, '#ffffff'); bolinha(x, y - u * 1.15, u * 0.16, '#ffffff');
        ctx.fillStyle = '#e5484d'; ctx.fillRect(x - u * 0.18, y - u * 1.02, u * 0.36, u * 0.06);
        ctx.fillStyle = '#222'; ctx.fillRect(x - u * 0.12, y - u * 1.45, u * 0.24, u * 0.18);
        break;
      case 'pirulito': {
        ctx.fillStyle = '#fffaf2'; ctx.fillRect(x - u * 0.03, y - u * 1.6, u * 0.06, u * 1.6);
        const cy = y - u * 1.95; const r = u * 0.42; const c = ['#ff4f8b', '#ffb020', '#7b6cf6', '#35c46a'][Math.abs(Math.round(o.z / 3.5)) % 4];
        bolinha(x, cy, r, c);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, r * 0.14); ctx.beginPath();
        for (let a = 0; a < Math.PI * 6; a += 0.2) ctx.lineTo(x + Math.cos(a) * a * r / 19, cy + Math.sin(a) * a * r / 19);
        ctx.stroke();
        break;
      }
      case 'bengala':
        ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, u * 0.12);
        for (const [c, dash] of [['#ffffff', []], ['#e8304a', [u * 0.12, u * 0.12]]]) {
          ctx.strokeStyle = c; ctx.setLineDash(dash);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - u * 1.5); ctx.arc(x + u * 0.2, y - u * 1.5, u * 0.2, Math.PI, 0); ctx.stroke();
        }
        ctx.setLineDash([]);
        break;
      case 'cupcake':
        ctx.fillStyle = '#3fb6ff'; ctx.beginPath(); ctx.moveTo(x - u * 0.3, y - u * 0.45); ctx.lineTo(x + u * 0.3, y - u * 0.45); ctx.lineTo(x + u * 0.22, y); ctx.lineTo(x - u * 0.22, y); ctx.fill();
        ctx.fillStyle = '#ffc2e2'; ctx.beginPath(); ctx.arc(x, y - u * 0.45, u * 0.33, Math.PI, 0); ctx.fill();
        bolinha(x, y - u * 0.82, u * 0.08, '#e5233a');
        break;
      case 'balao':
        for (const [dx, dy, c] of [[-0.18, 1.6, '#ff4f5e'], [0.12, 1.75, '#ffc21f'], [0.05, 1.45, '#3e8bff']]) {
          ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - u * 0.6); ctx.lineTo(x + dx * u, y - dy * u); ctx.stroke();
          ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + dx * u, y - (dy + 0.15) * u, u * 0.17, u * 0.21, 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'barraca':
        ctx.fillStyle = '#fffaf2'; ctx.fillRect(x - u * 0.55, y - u * 0.6, u * 1.1, u * 0.6);
        for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#ff4f81'; ctx.fillRect(x - u * 0.65 + (k * u * 1.3) / 5, y - u * 1.25, u * 1.3 / 5, u * 0.3); }
        ctx.fillStyle = '#fff'; ctx.fillRect(x - u * 0.6, y - u * 0.95, u * 0.04, u * 0.35); ctx.fillRect(x + u * 0.56, y - u * 0.95, u * 0.04, u * 0.35);
        break;
      case 'cacto':
        ctx.fillStyle = '#3f9e4d'; ctx.strokeStyle = '#3f9e4d'; ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2, u * 0.26); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - u * 1.5); ctx.stroke();
        ctx.lineWidth = Math.max(1.5, u * 0.15); ctx.beginPath(); ctx.moveTo(x, y - u * 0.7); ctx.lineTo(x - u * 0.35, y - u * 0.7); ctx.lineTo(x - u * 0.35, y - u * 1.1); ctx.moveTo(x, y - u * 0.95); ctx.lineTo(x + u * 0.32, y - u * 0.95); ctx.lineTo(x + u * 0.32, y - u * 1.3); ctx.stroke();
        break;
      case 'pedra': case 'rocha':
        ctx.fillStyle = o.tipo === 'pedra' ? '#b98a55' : '#7c818b'; ctx.beginPath(); ctx.ellipse(x, y - u * 0.12, u * 0.35, u * 0.18, 0, Math.PI, 0); ctx.fill();
        break;
      case 'foguete':
        ctx.fillStyle = '#f4f6fb'; ctx.beginPath(); ctx.roundRect(x - u * 0.2, y - u * 1.6, u * 0.4, u * 1.4, u * 0.18); ctx.fill();
        ctx.fillStyle = '#e5233a'; ctx.beginPath(); ctx.moveTo(x - u * 0.2, y - u * 1.45); ctx.lineTo(x, y - u * 1.95); ctx.lineTo(x + u * 0.2, y - u * 1.45); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - u * 0.2, y - u * 0.5); ctx.lineTo(x - u * 0.42, y - u * 0.15); ctx.lineTo(x - u * 0.2, y - u * 0.25); ctx.moveTo(x + u * 0.2, y - u * 0.5); ctx.lineTo(x + u * 0.42, y - u * 0.15); ctx.lineTo(x + u * 0.2, y - u * 0.25); ctx.fill();
        bolinha(x, y - u * 1.15, u * 0.1, '#7fd8ff');
        break;
      case 'antena':
        ctx.fillStyle = '#9aa3b5'; ctx.fillRect(x - 1, y - u * 1.2, 2, u * 1.2);
        bolinha(x, y - u * 1.25, u * 0.09, '#5ae6ff');
        break;
      default:
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

  const ICONE = { capa: '🦸‍♀️', nave: '🛸', ima: '🧲', pulo: '👟', maleta: '🎒', escudo: '🛡️', raio: '⚡', dobro: '✖️', bau: '💰', turbo: '🚀', prancha: '🛹', patinete: '🛴' };
  const COR_BOLHA = { capa: '#e8344a', nave: '#2fcf9a', ima: '#ff5a5a', pulo: '#35c46a', maleta: '#a2622d', escudo: '#3e8bff', raio: '#ffb800', dobro: '#ff4f81', bau: '#c98a00', turbo: '#ff7a1f', prancha: '#29b7dc', patinete: '#ff5fa2' };
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
    if (o.movel) return desenharMovel(o, t);
    const ob = OBST_2D[cenarioDaCorrida(prefs.cenario ?? 'passeio', s?.dist ?? 0)] ?? OBST_2D.cidade;
    if (o.tipo === 'cerca') {
      const w = lf * 0.86; const h = u * 0.5;
      if (ob.corda) {
        // cerca de fila do parque: postes dourados e dois cordões de veludo
        ctx.fillStyle = ob.poste;
        for (const dx of [-0.46, 0.46]) { ctx.fillRect(x + dx * w - w * 0.035, y - h * 1.1, w * 0.07, h * 1.1); bolinha(x + dx * w, y - h * 1.12, w * 0.06, ob.poste); }
        ctx.strokeStyle = ob.tabua; ctx.lineWidth = Math.max(2, h * 0.16); ctx.lineCap = 'round';
        for (const [yy, q] of [[0.95, 0.3], [0.52, 0.18]]) { ctx.beginPath(); ctx.moveTo(x - w * 0.46, y - h * yy); ctx.quadraticCurveTo(x, y - h * (yy - q * 2), x + w * 0.46, y - h * yy); ctx.stroke(); }
        return;
      }
      ctx.fillStyle = ob.poste;
      ctx.fillRect(x - w / 2, y - h, w * 0.08, h); ctx.fillRect(x + w / 2 - w * 0.08, y - h, w * 0.08, h);
      for (const yy of [0.85, 0.45]) {
        ctx.fillStyle = ob.tabua; ctx.fillRect(x - w / 2, y - h * yy, w, h * 0.22);
        ctx.fillStyle = ob.listra;
        for (let k = 0; k < 4; k++) ctx.fillRect(x - w / 2 + (k * 2 + 1) * w / 8, y - h * yy, w / 8, h * 0.22);
      }
      if (ob.topo) { ctx.fillStyle = ob.topo; ctx.fillRect(x - w / 2, y - h * 1.02, w, h * 0.12); }
      return;
    }
    if (o.tipo === 'faixa') {
      const w = lf * 0.9;
      ctx.fillStyle = ob.mastro;
      ctx.fillRect(x - w / 2, y - u * 2.05, w * 0.05, u * 2.05); ctx.fillRect(x + w / 2 - w * 0.05, y - u * 2.05, w * 0.05, u * 2.05);
      ctx.fillStyle = ob.faixa; ctx.fillRect(x - w / 2, y - u * 2.02, w, u * 0.3);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(u * 0.2)}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(ob.texto, x, y - u * 1.8);
      const cores = ob.bandeiras;
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
    // carrinho (cada cenário tem o seu): topo em perspectiva e frente
    const z2 = z + o.comp;
    const w1 = lf * 0.86; const w2 = faixaL() * p(z2) * 0.86;
    const x2 = X(o.faixa, z2); const y2 = Y(z2);
    const h1 = u * 1.25; const h2 = U(z2) * 1.25;
    ctx.fillStyle = ob.teto;
    ctx.beginPath();
    ctx.moveTo(x - w1 / 2, y - h1); ctx.lineTo(x + w1 / 2, y - h1); ctx.lineTo(x2 + w2 / 2, y2 - h2); ctx.lineTo(x2 - w2 / 2, y2 - h2);
    ctx.fill();
    ctx.fillStyle = ob.lado;
    const lado = o.faixa < 1 ? 1 : -1;
    if (o.faixa !== 1) {
      ctx.beginPath();
      ctx.moveTo(x + lado * w1 / 2, y - h1); ctx.lineTo(x2 + lado * w2 / 2, y2 - h2); ctx.lineTo(x2 + lado * w2 / 2, y2); ctx.lineTo(x + lado * w1 / 2, y);
      ctx.fill();
    }
    ctx.fillStyle = ob.frente;
    ctx.fillRect(x - w1 / 2, y - h1, w1, h1 * 0.92);
    ctx.fillStyle = ob.toldo;
    for (let k = 0; k < 5; k++) if (k % 2 === 0) ctx.fillRect(x - w1 / 2 + (k * w1) / 5, y - h1, w1 / 5, h1 * 0.22);
    ctx.fillStyle = '#000'; ctx.font = `${Math.round(h1 * 0.34)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(ob.emoji, x, y - h1 * 0.3);
    ctx.fillStyle = '#333';
    for (const dx of [-0.32, 0.32]) { ctx.beginPath(); ctx.arc(x + dx * w1, y - h1 * 0.05, h1 * 0.1, 0, Math.PI * 2); ctx.fill(); }
  }

  // Os obstáculos parados de cada cenário no 2D: cores da cerca, da faixa e do carrinho.
  const OBST_2D = {
    cidade: { poste: '#fff', tabua: '#e5484d', listra: '#fff', mastro: '#6b5f8a', faixa: '#7b6cf6', texto: '★ ★ ★', bandeiras: ['#ffd21f', '#ff6f91', '#3fb6a8'], teto: '#d9e8ff', lado: '#b9d2f5', frente: '#ffffff', toldo: '#ff6f91', emoji: '🍦' },
    praia: { poste: '#d8b26a', tabua: '#c9a45a', listra: '#e0bf78', topo: '#ff5a5a', mastro: '#ffffff', faixa: '#3fb6a8', texto: '☀ ☀ ☀', bandeiras: ['#ffd34d', '#ff6f91', '#3e8bff'], teto: '#2a9d55', lado: '#2a9d55', frente: '#fffaf2', toldo: '#35c46a', emoji: '🥥' },
    floresta: { poste: '#7a4f2c', tabua: '#7a4f2c', listra: '#8a5f3c', mastro: '#7a4f2c', faixa: '#3f8a3a', texto: '🍃 🍃 🍃', bandeiras: ['#4fb04a', '#3fae5a', '#9be15d'], teto: '#e7c56a', lado: '#9a6b3e', frente: '#9a6b3e', toldo: '#7a4f2c', emoji: '🌾' },
    neve: { poste: '#3b2a22', tabua: '#d8262f', listra: '#ffffff', mastro: '#e5484d', faixa: '#2f7d46', texto: '✦ ✦ ✦', bandeiras: ['#ff5a5a', '#ffffff', '#2f7d46'], teto: '#c8352a', lado: '#a82a20', frente: '#c8352a', toldo: '#ffd34d', emoji: '🎁' },
    doces: { poste: '#ffffff', tabua: '#f7d08a', listra: '#e9b264', topo: '#ff7fb5', mastro: '#ff4f8b', faixa: '#9b6cff', texto: '🍬 DOCES 🍭', bandeiras: ['#ff4f8b', '#ffd34d', '#35c46a'], teto: '#ffb3d4', lado: '#ff5fa2', frente: '#fffaf2', toldo: '#ff5fa2', emoji: '🍭' },
    parque: { corda: true, poste: '#ffc531', tabua: '#d0182f', mastro: '#3e8bff', faixa: '#e5233a', texto: '🎡 DIVERSÃO', bandeiras: ['#ffd34d', '#3e8bff', '#35c46a'], teto: '#ffffff', lado: '#e5233a', frente: '#fffaf2', toldo: '#e5233a', emoji: '🍿' },
    deserto: { poste: '#5e3a1e', tabua: '#d8262f', listra: '#2fb5a8', topo: '#5e3a1e', mastro: '#5e3a1e', faixa: '#2f6fd6', texto: '✧ ✧ ✧', bandeiras: ['#e5233a', '#ffd34d', '#2fb5a8'], teto: '#ffd34d', lado: '#2fb5a8', frente: '#fffaf2', toldo: '#2fb5a8', emoji: '💧' },
    lua: { poste: '#5a6170', tabua: '#ffd21f', listra: '#1d1f26', mastro: '#d8dce6', faixa: '#1c3f8f', texto: '🌙 BASE LUA', bandeiras: ['#5ae6ff', '#ffffff', '#ffd34d'], teto: '#3e8bff', lado: '#d8dce6', frente: '#f4f6fb', toldo: '#3e8bff', emoji: '🚀' },
  };

  // ---------- Obstáculos em movimento, no desenho 2D ----------
  // trapézio no chão entre duas distâncias, numa faixa
  function noChao(f, z1, z2, larg, cor_) {
    ctx.fillStyle = cor_;
    ctx.beginPath();
    ctx.moveTo(X(f - larg, z1), Y(z1)); ctx.lineTo(X(f + larg, z1), Y(z1));
    ctx.lineTo(X(f + larg, z2), Y(z2)); ctx.lineTo(X(f - larg, z2), Y(z2));
    ctx.fill();
  }
  function emoji(txt, x, y, tam, espelhar = false) {
    ctx.save();
    ctx.translate(x, y);
    if (espelhar) ctx.scale(-1, 1);
    ctx.fillStyle = '#000'; // figurinha colorida, sem transparência herdada
    ctx.font = `${Math.round(tam)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
  function desenharMovel(o, t) {
    const z = Math.max(o.z, -C * 0.55);
    const y = Y(z); const u = U(z); const lf = faixaL() * p(z);
    const pulso = 0.5 + 0.5 * Math.sin(t * 10);
    if (o.z > 1.5) {
      // aviso no chão da faixa em que ele vai chegar
      const longo = o.vz > 0;
      noChao(o.destino, longo ? 1 : o.z - 0.8, longo ? o.z : o.z + o.comp + 0.8, 0.4, `rgba(255,140,20,${0.35 + 0.35 * pulso})`);
      noChao(o.destino, longo ? 1 : o.z - 0.8, longo ? o.z : o.z + o.comp + 0.8, 0.06, `rgba(255,255,255,${0.5 + 0.4 * pulso})`);
    }
    const x = X(o.faixa, z);
    const sombra = (rx) => { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.28, 0, 0, Math.PI * 2); ctx.fill(); };
    let topo = 1;
    if (o.tipo === 'onibus') {
      const w = lf * 0.86; const h = u * 2.05;
      ctx.fillStyle = '#ffc21f'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h * 0.94, w * 0.12); ctx.fill();
      ctx.fillStyle = '#8fd3ff'; ctx.beginPath(); ctx.roundRect(x - w * 0.42, y - h * 0.9, w * 0.84, h * 0.4, w * 0.08); ctx.fill();
      for (const dx of [-0.2, 0.2]) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + dx * w, y - h * 0.7, w * 0.12, h * 0.13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.arc(x + dx * w + w * 0.02, y - h * 0.67, w * 0.06, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = Math.max(1.5, w * 0.05); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y - h * 0.38, w * 0.2, 0.4, Math.PI - 0.4); ctx.stroke();
      ctx.fillStyle = Math.floor(t * 4) % 2 ? '#ff7a1f' : '#fff3a0';
      for (const dx of [-0.36, 0.36]) { ctx.beginPath(); ctx.arc(x + dx * w, y - h * 0.18, w * 0.07, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#2b2e38'; for (const dx of [-0.3, 0.3]) ctx.fillRect(x + dx * w - w * 0.08, y - h * 0.08, w * 0.16, h * 0.08);
      topo = 2.1;
    } else if (o.tipo === 'bola') {
      sombra(u * 0.35 / (1 + (o.h - o.raio) * 0.6));
      const cy = y - o.h * u; const r = o.raio * u;
      const cores = ['#ff4d5e', '#ffffff', '#ffc21f', '#ffffff', '#2f8fff', '#ffffff'];
      const giro = t * 4;
      for (let k = 0; k < 6; k++) { ctx.fillStyle = cores[k]; ctx.beginPath(); ctx.moveTo(x, cy); ctx.arc(x, cy, r, giro + (k * Math.PI) / 3, giro + ((k + 1) * Math.PI) / 3); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, cy, r * 0.22, 0, Math.PI * 2); ctx.fill();
      topo = o.h + o.raio + 0.1;
    } else if (o.tipo === 'tronco') {
      sombra(u * 0.35);
      const r = u * 0.3; const cy = y - r;
      ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e9c08a'; ctx.beginPath(); ctx.arc(x, cy, r * 0.82, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c28a52'; ctx.lineWidth = Math.max(1, r * 0.08);
      for (const k of [0.25, 0.5, 0.7]) { ctx.beginPath(); ctx.arc(x, cy, r * k, 0, Math.PI * 2); ctx.stroke(); }
      const a = -o.faixa * 5; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); ctx.stroke();
    } else if (o.tipo === 'galho') {
      const piv = { x: X(o.destino, z), y: y - cor.GALHO.pivo * u };
      ctx.strokeStyle = '#6e4426'; ctx.lineWidth = u * 0.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(-0.8, z), piv.y); ctx.lineTo(X(2.8, z), piv.y); ctx.stroke();
      const bx = X(o.bolaX, z); const by = y - o.h * u;
      ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = Math.max(1.5, u * 0.04);
      ctx.beginPath(); ctx.moveTo(piv.x, piv.y); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(bx, y, u * 0.4, u * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      for (const [dx, dy, c] of [[-0.25, 0, '#2f9a4a'], [0.25, 0, '#2f9a4a'], [0, -0.12, '#3fae5a'], [-0.12, 0.12, '#5ab84a'], [0.12, 0.12, '#5ab84a']]) {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx + dx * u, by + dy * u, u * 0.2, 0, Math.PI * 2); ctx.fill();
      }
      emoji('🐦', bx, by - u * 0.12, u * 0.3);
      topo = cor.GALHO.pivo + 0.3;
    } else if (o.tipo === 'boladeneve') {
      sombra(o.raio * u);
      const cy = y - o.raio * u; const r = o.raio * u;
      const g = ctx.createRadialGradient(x - r * 0.35, cy - r * 0.35, r * 0.1, x, cy, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#eef6ff'); g.addColorStop(1, '#b9d3ee');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
      const a = (o.nasceu - o.z) / Math.max(0.3, o.raio);
      ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6e4426'; ctx.beginPath(); ctx.arc(x + Math.cos(a + 2.5) * r * 0.55, cy + Math.sin(a + 2.5) * r * 0.55, r * 0.09, 0, Math.PI * 2); ctx.fill();
      topo = o.raio * 2 + 0.1;
    } else if (o.tipo === 'jujuba' || o.tipo === 'meteorito') {
      sombra(u * 0.35 / (1 + (o.h - o.raio) * 0.6));
      const cy = y - o.h * u; const r = o.raio * u;
      if (o.tipo === 'meteorito') {
        // rastro de fogo e a pedra com brasas
        for (let k = 4; k >= 1; k--) bolinha(x - o.dir * k * r * 0.45, cy - k * r * 0.25, r * (1 - k * 0.17), `rgba(255,${120 + k * 20},40,${0.5 - k * 0.09})`);
        bolinha(x, cy, r, '#6a5548');
        for (const [dx, dy] of [[-0.35, -0.2], [0.3, 0.1], [0, 0.4], [0.1, -0.45]]) bolinha(x + dx * r, cy + dy * r, r * 0.16, '#ff8a1f');
      } else {
        const c = ['#ff3b5c', '#35c46a', '#ff9a1f', '#9b5cff', '#ffd21f'][(o.destino + (o.modo === 'alto' ? 2 : 0) + (o.dir > 0 ? 1 : 0)) % 5];
        bolinha(x, cy - r * 0.75, r * 0.45, c); bolinha(x, cy, r, c);
        bolinha(x - r * 0.4, cy - r * 0.45, r * 0.18, 'rgba(255,255,255,.7)');
        for (const dx of [-0.3, 0.3]) { bolinha(x + dx * r, cy - r * 0.05, r * 0.17, '#fff'); bolinha(x + dx * r, cy, r * 0.09, '#1d1410'); }
      }
      topo = o.h + o.raio + 0.1;
    } else if (o.tipo === 'algodao') {
      sombra(o.raio * u);
      const cy = y - o.raio * u; const r = o.raio * u;
      const a = (o.nasceu - o.z) / o.raio;
      ctx.strokeStyle = '#3fb6ff'; ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r * 1.2, cy - Math.sin(a) * r * 0.3); ctx.lineTo(x + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 0.3); ctx.stroke();
      bolinha(x, cy, r, '#ff8fcf');
      for (let k = 0; k < 7; k++) { const b = a + k * 0.9; bolinha(x + Math.cos(b) * r * 0.62, cy + Math.sin(b) * r * 0.62, r * 0.32, ['#ffb3e0', '#c9a8ff', '#ffd1ec'][k % 3]); }
      topo = o.raio * 2 + 0.1;
    } else if (o.tipo === 'feno') {
      sombra(u * 0.32);
      const r = u * 0.32; const cy = y - r - Math.abs(Math.sin(o.faixa * 3)) * u * 0.06;
      ctx.strokeStyle = '#6e4426'; ctx.lineWidth = Math.max(1, r * 0.1);
      const a0 = -o.faixa * 5;
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x, cy, r * (0.6 + (k % 3) * 0.2), r * (0.95 - (k % 2) * 0.35), a0 + k * 0.55, 0, Math.PI * 2); ctx.stroke(); }
      topo = 0.75;
    } else if (o.tipo === 'minhoca') {
      sombra(u * 0.45);
      const f = t * 9; const arco = 0.5 + 0.5 * Math.sin(f); const lado = o.dir > 0 ? -1 : 1; // para onde ela anda na tela
      const cores = ['#ff3b7a', '#ffd21f', '#35c46a', '#3fb6ff'];
      for (let k = 0; k < 7; k++) {
        const uu = k / 6;
        bolinha(x + (k - 3) * u * (0.15 - arco * 0.04) * lado, y - u * (0.1 + Math.sin(uu * Math.PI) * arco * 0.2), u * (k === 6 ? 0.13 : 0.1), cores[k % 4]);
      }
      const hx = x + 3 * u * (0.15 - arco * 0.04) * lado; const hy = y - u * 0.1;
      bolinha(hx + lado * u * 0.04, hy - u * 0.04, u * 0.04, '#fff'); bolinha(hx + lado * u * 0.05, hy - u * 0.04, u * 0.02, '#1d1410');
      topo = 0.6;
    } else if (o.tipo === 'batebate') {
      const c = ['#2f8fff', '#ff4d5e', '#35c46a', '#ffb020'][(o.destino * 2 + o.origem) % 4];
      const w = lf * 0.6; const h = u * 0.45;
      ctx.fillStyle = '#26282f'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.3, w * 0.62, h * 0.32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h * 1.1, w, h * 0.85, w * 0.18); ctx.fill();
      for (const dx of [-0.2, 0.2]) { bolinha(x + dx * w, y - h * 0.8, w * 0.1, '#fff'); bolinha(x + dx * w, y - h * 0.77, w * 0.05, '#1d1410'); }
      ctx.strokeStyle = '#2b2118'; ctx.lineWidth = Math.max(1, w * 0.04); ctx.beginPath(); ctx.arc(x, y - h * 0.62, w * 0.12, 0.3, Math.PI - 0.3); ctx.stroke();
      if (o.pisca && Math.floor(t * 5) % 2 === 0) emoji(o.destino > o.origem ? '➡️' : '⬅️', x, y - u * 0.9, u * 0.45);
      topo = 0.75;
    } else {
      // os bichos e a bicicleta: figurinhas grandes, saltitando
      const fig = { bicicleta: '🚴', cachorro: '🐕', caranguejo: '🦀', pinguim: '🐧', camelo: '🐫', robo: '🤖' }[o.tipo];
      const tam = u * { bicicleta: 1.5, cachorro: 0.95, caranguejo: 0.8, pinguim: 0.85, camelo: 2.1, robo: 0.75 }[o.tipo];
      sombra(tam * 0.35);
      const pula = Math.abs(Math.sin(t * 14)) * u * 0.05;
      // o cachorro olha para onde corre; a bicicleta, de costas, vai para a frente
      const espelhar = o.tipo === 'cachorro' ? o.dir > 0 : o.tipo === 'pinguim' || o.tipo === 'camelo' ? o.destino > o.origem : false;
      emoji(fig, x, y + tam * 0.08 - pula, tam, espelhar);
      if ((o.tipo === 'bicicleta' || o.tipo === 'robo') && o.pisca && Math.floor(t * 5) % 2 === 0) emoji(o.destino > o.origem ? '➡️' : '⬅️', x, y - tam * 0.95, u * 0.45);
      topo = { bicicleta: 1.9, cachorro: 0.9, caranguejo: 0.75, pinguim: 0.8, camelo: 2.3, robo: 0.8 }[o.tipo];
    }
    if (o.z > 1.5) emoji('⚠️', x, y - (topo + 0.15) * u - pulso * u * 0.06, u * 0.55);
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
        // o próximo cenário do Passeio já é montado agora, escondido pelo clarão da troca
        const proximo = cenarioDaCorrida(prefs.cenario ?? 'passeio', s.dist + cor.TRECHO_PASSEIO);
        if (proximo !== tema) setTimeout(() => mundo?.preparar?.(proximo), 200);
      }
      mundo.desenhar(s ?? parado, t, visualAtual(), tema, prefs.perseguidorFloresta, rodando ? null : vitrinePose, capturada);
      ctx.clearRect(0, 0, W, H);
      if (s?.supercarga > 0 || s?.turboPatinete > 0) linhasDeVelocidade(t);
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
    const noPatinete = (s?.patinete ?? 0) > 0 && (s?.voo ?? 0) <= 0;
    const altura = (s?.y ?? 0) + (naPrancha ? 0.14 : noPatinete ? 0.1 : 0);
    if (s?.supercarga > 0 || s?.turboPatinete > 0) linhasDeVelocidade(t);
    if (s?.escudo || s?.ima || s?.supercarga > 0) {
      const g = ctx.createRadialGradient(x, y - (altura + 0.65) * u, u * 0.1, x, y - (altura + 0.65) * u, u * 0.85);
      const cor_ = s.supercarga > 0 ? '255,200,40' : s.escudo ? '80,170,255' : '255,90,90';
      g.addColorStop(0, `rgba(${cor_},.05)`); g.addColorStop(0.7, `rgba(${cor_},.28)`); g.addColorStop(1, `rgba(${cor_},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y - (altura + 0.65) * u, u * 0.62, u * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (naPrancha) desenharSkate(x, y - altura * u + u * 0.02, u, s.skateTipo, t, (s?.y ?? 0));
    // manobra: no 2D o rodopio aparece como ela e o patinete virando de lado e voltando
    const giro = noPatinete && s.manobra ? Math.PI * 2 * s.manobra.voltas * Math.min(1, s.manobra.t / (s.manobra.dur * 0.8)) : 0;
    ctx.save();
    if (giro) { ctx.translate(x, 0); ctx.scale(Math.max(0.12, Math.abs(Math.cos(giro))) * (Math.cos(giro) < 0 ? -1 : 1), 1); ctx.translate(-x, 0); }
    if (noPatinete) desenharPatinete(x, y - altura * u + u * 0.1, u, s, t, 'atras');
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
    if (noPatinete) desenharPatinete(x, y - altura * u + u * 0.1, u, s, t, 'frente');
    ctx.restore();
    if (s && !noPatinete && s.patineteSaiu && s.voo <= 0 && s.t - s.patineteSaiu.t < 0.9) desenharPatineteSaindo(x, y - (s.y ?? 0) * u, u, s, t);
    if ((s?.voo ?? 0) > 0) {
      if (s.vooTipo === 'mochila') desenharMaleta(x, y - altura * u, u, t);
      else {
        // sem 3D: a capa ou a nave aparecem como figurinhas grandes junto dela
        ctx.font = `${Math.round(u * (s.vooTipo === 'nave' ? 1.1 : 0.6))}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(s.vooTipo === 'nave' ? '🛸' : '🦸‍♀️', x, y - altura * u - (s.vooTipo === 'nave' ? u * 0.2 : u * 1.4));
      }
    }
    for (const o of perto) (o.enfeite ? desenharEnfeite(o) : desenharObjeto(o, t));
    const dp = s?.perseguidor?.dist ?? 99;
    if (dp < 1.9) {
      const id = quemPersegue(cenarioDaCorrida(prefs.cenario ?? 'passeio', s.dist), prefs.perseguidorFloresta);
      const tam = u * (1.6 - dp * 0.25);
      ctx.font = `${Math.round(tam)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(EMOJI[id], x + u * 0.5, H - camera + dp * u * 0.4 + Math.abs(Math.sin(t * 9)) * u * 0.1);
      ctx.textBaseline = 'alphabetic';
    }
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

  // Patinete visto de trás, em duas partes: atrás dela (deck, roda, haste e guidão) e na frente
  // (os punhos com as fitinhas, que aparecem dos lados das mãos, e o pé dando impulso no chão).
  const COR_PAT = { classico: ['#ff5fa2', '#c23a7a', '#8a6cff'], luzes: ['#8a6cff', '#5a3fd0', '#ff5fa2'], eletrico: ['#22c993', '#138a64', '#22c993'] };
  function desenharPatinete(x, y, u, est, t, parte) {
    const tipo = est.patineteTipo; const [cor, escuro, punho] = COR_PAT[tipo] ?? COR_PAT.classico;
    const dobra = est.deslizando > 0 && est.y < 0.2;
    const curva = (est.faixa - est.x) * 0.25; // o guidão vira na troca de faixa
    const topoY = y - u * (dobra ? 0.45 : 0.98); const gx = x + curva * u * 0.4;
    if (parte === 'atras') {
      // turbo do elétrico: dois jatos azuis saindo de trás
      if (est.turboPatinete > 0) {
        for (const lado of [-1, 1]) {
          const g = ctx.createLinearGradient(0, y, 0, y + u * 0.4);
          g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#4fd8ff'); g.addColorStop(1, 'rgba(79,216,255,0)');
          ctx.fillStyle = g; const flk = Math.sin(t * 40 + lado) * u * 0.05;
          ctx.beginPath(); ctx.moveTo(x + lado * u * 0.06 - u * 0.04, y); ctx.lineTo(x + lado * u * 0.06 + u * 0.04, y); ctx.lineTo(x + lado * u * 0.06, y + u * 0.38 + flk); ctx.fill();
        }
      }
      // haste: sai da ponta da frente do deck e sobe até o guidão
      ctx.strokeStyle = tipo === 'eletrico' ? '#3a4150' : '#c9d0da'; ctx.lineWidth = u * 0.045; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y - u * 0.2); ctx.lineTo(gx, topoY); ctx.stroke();
      ctx.lineWidth = u * 0.035;
      ctx.beginPath(); ctx.moveTo(gx - u * 0.24, topoY + curva * u * 0.1); ctx.lineTo(gx + u * 0.24, topoY - curva * u * 0.1); ctx.stroke();
      // deck em perspectiva (some para dentro da rua) com a lixa e a roda de trás embaixo
      const perto = { l: u * 0.12, y: y + u * 0.02 }; const longe = { l: u * 0.09, y: y - u * 0.2 };
      ctx.fillStyle = escuro;
      ctx.beginPath(); ctx.moveTo(x - perto.l, perto.y + u * 0.03); ctx.lineTo(x + perto.l, perto.y + u * 0.03); ctx.lineTo(x + longe.l, longe.y + u * 0.03); ctx.lineTo(x - longe.l, longe.y + u * 0.03); ctx.fill();
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.moveTo(x - perto.l, perto.y); ctx.quadraticCurveTo(x, perto.y + u * 0.05, x + perto.l, perto.y); ctx.lineTo(x + longe.l, longe.y); ctx.quadraticCurveTo(x, longe.y - u * 0.04, x - longe.l, longe.y); ctx.fill();
      ctx.fillStyle = 'rgba(30,30,50,.55)'; ctx.fillRect(x - u * 0.07, longe.y + u * 0.02, u * 0.14, perto.y - longe.y - u * 0.02);
      // roda de trás (vista de trás é uma elipse estreita) com o paralama
      const brilha = tipo === 'luzes' ? `hsl(${(t * 300) % 360} 100% 65%)` : tipo === 'eletrico' ? '#8ffcff' : null;
      if (brilha) {
        const g = ctx.createRadialGradient(x, perto.y + u * 0.09, 0, x, perto.y + u * 0.09, u * 0.16);
        g.addColorStop(0, brilha); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, perto.y + u * 0.09, u * 0.16, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = tipo === 'eletrico' ? '#2b2f3a' : '#f4f4f4';
      ctx.beginPath(); ctx.ellipse(x, perto.y + u * 0.09, u * 0.035, u * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = brilha ?? cor; ctx.fillRect(x - u * 0.012, perto.y + u * 0.06, u * 0.024, u * 0.06);
      ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, perto.y + u * 0.04, u * 0.06, u * 0.03, 0, Math.PI, 0); ctx.fill();
      return;
    }
    // punhos e fitinhas nas pontas do guidão (aparecem dos dois lados dela)
    for (const lado of [-1, 1]) {
      const px = gx + lado * u * 0.24; const py = topoY - lado * curva * u * 0.1;
      ctx.fillStyle = punho; ctx.beginPath(); ctx.ellipse(px, py, u * 0.05, u * 0.032, 0, 0, Math.PI * 2); ctx.fill();
      ['#ffd21f', '#35c9ff', '#ff5fa2'].forEach((c, k) => {
        ctx.strokeStyle = c; ctx.lineWidth = u * 0.016;
        const balanca = Math.sin(t * 12 + k + lado) * u * 0.03;
        ctx.beginPath(); ctx.moveTo(px + lado * u * 0.05, py); ctx.quadraticCurveTo(px + lado * u * 0.1, py + u * 0.03, px + lado * u * (0.14 + k * 0.02) + balanca, py + u * (0.08 + k * 0.03)); ctx.stroke();
      });
    }
    // o pé dando impulso: a cada passada desce do lado do deck e solta uma poeirinha
    if (!dobra && est.y < 0.05) {
      const ph = (est.dist * 1.55 * 0.45) % (Math.PI * 2);
      if (Math.sin(ph) > 0.5) {
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + u * (0.16 + k * 0.05), y + u * (0.08 - k * 0.02), u * (0.035 - k * 0.008), 0, Math.PI * 2); ctx.fill(); }
      }
    }
  }
  // Quando o passeio acaba: na batida ele voa girando; no fim do tempo some num brilho de estrelinhas.
  function desenharPatineteSaindo(x, y, u, est, t) {
    const saiu = est.patineteSaiu; const k = (est.t - saiu.t) / 0.9;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k);
    if (saiu.como === 'batida') { ctx.translate(x + u * 0.6 * k, y - u * (1.8 * k - 1.1 * k * k)); ctx.rotate(k * 9); ctx.scale(1 - 0.5 * k, 1 - 0.5 * k); }
    else { ctx.translate(x, y); ctx.scale(Math.max(0.05, 1 - k), Math.max(0.05, 1 - k)); }
    ctx.font = `${Math.round(u * 0.7)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🛴', 0, -u * 0.3);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.font = `${Math.round(u * 0.25)}px sans-serif`; ctx.textAlign = 'center';
    for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2 + k * 2; ctx.fillText('✨', x + Math.cos(a) * u * 0.6 * k, y - u * 0.5 + Math.sin(a) * u * 0.45 * k); }
    ctx.restore();
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
    sairEl.hidden = emCorrida;
    somEl.hidden = emCorrida;
    pausaEl.hidden = !emCorrida;
    if (!emCorrida || capturada !== null) desenharAlerta();
    if (!s) { hud.innerHTML = ''; decolarEl.hidden = true; patineteEl.hidden = true; return; }
    if (capturada !== null) { hud.innerHTML = ''; decolarEl.hidden = true; patineteEl.hidden = true; pausaEl.hidden = true; dicaGestos.hidden = true; return; } // a cena da captura fica limpa
    const tempo = (v, icone) => (v > 0 ? `<span class="poder">${icone} ${Math.ceil(v)}s</span>` : '');
    hud.innerHTML = `<span class="pts">${cor.pontos(s).toLocaleString('pt-BR')}</span><span class="est">🪙 ${s.moedas}</span>${
      s.dobro > 0 ? `<span class="poder dobro">✖2 ${Math.ceil(s.dobro)}s</span>` : ''}${
      tempo(s.ima, '🧲')}${tempo(s.superPulo, '👟')}${tempo(s.voo, { mochila: '🎒', capa: '🦸‍♀️', nave: '🛸' }[s.vooTipo] ?? '🎒')}${tempo(s.supercarga, '⚡')}${tempo(s.skate, '🛹')}${tempo(s.patinete, s.turboPatinete > 0 ? '🛴⚡' : '🛴')}${s.escudo ? '<span class="poder">🛡️</span>' : ''}`;
    const podeDecolar = emCorrida && s.arrancadas > 0 && s.t <= cor.JANELA_ARRANCADA && s.voo <= 0;
    decolarEl.hidden = !podeDecolar;
    if (podeDecolar) decolarEl.innerHTML = `🎒 Decolar! <small>${s.arrancadas}</small><i style="width:${Math.round((1 - s.t / cor.JANELA_ARRANCADA) * 100)}%"></i>`;
    desenharBotaoPatinete(emCorrida);
    hud.insertAdjacentHTML('beforeend', `<span class="poder">🛹 ${s.cargas}</span><span class="poder">🛴 ${s.cargasPatinete}</span><span class="energia" title="Supercarga">⚡<i style="width:${Math.round(s.energia * 100)}%"></i></span>`);
  }

  // o botão do patinete: "subir" quando tem carga; no elétrico, vira "Turbo" uma vez por passeio
  function desenharBotaoPatinete(emCorrida) {
    const turbo = s.patinete > 0 && cor.PATINETES[s.patineteTipo].turbo && !s.turboUsado;
    const subir = s.patinete <= 0 && s.cargasPatinete > 0;
    const mostra = emCorrida && s.vivo && s.voo <= 0 && (turbo || subir);
    patineteEl.hidden = !mostra;
    if (!mostra) return;
    const modo = turbo ? 'turbo' : 'subir';
    if (patineteEl.dataset.modo === modo && patineteEl.dataset.n === String(s.cargasPatinete)) return;
    patineteEl.dataset.modo = modo; patineteEl.dataset.n = String(s.cargasPatinete);
    patineteEl.classList.toggle('turbo', turbo);
    patineteEl.innerHTML = turbo ? '<b>⚡</b><span>Turbo</span>' : `<b>🛴</b><span>Patinete</span><small>${s.cargasPatinete}</small>`;
    patineteEl.setAttribute('aria-label', turbo ? 'Ligar o turbo do patinete elétrico' : `Subir no patinete (${s.cargasPatinete} ${s.cargasPatinete === 1 ? 'carga' : 'cargas'})`);
  }
  function mostrarManobra() {
    const m = s.ultimaManobra; if (!m) return;
    avisoManobra.innerHTML = `${m.voltas > 1 ? `Rodopio ${m.voltas}×!` : 'Rodopio!'} <b>+${m.pontos}</b>`;
    avisoManobra.hidden = false;
    avisoManobra.classList.remove('mostra'); void avisoManobra.offsetWidth; avisoManobra.classList.add('mostra');
    clearTimeout(mostrarManobra.relogio);
    mostrarManobra.relogio = setTimeout(() => { avisoManobra.hidden = true; }, 1300);
  }

  const SOM = {
    pulo: 'passo', superpulo: 'superpulo', troca: 'clique', moeda: 'moeda', raio: 'acerto', 'carga-cheia': 'premio', poder: 'item',
    escudo: 'captura', desliza: 'carta', batida: 'erro', decolar: 'decolar', 'pouso-jato': 'pouso-jato', heroi: 'heroi', 'pouso-heroi': 'pouso-heroi', teletransporte: 'teletransporte', supercarga: 'turbo', skate: 'skate',
    'skate-quebrou': 'quebra', quebra: 'quebra', patinete: 'patinete', 'patinete-quebrou': 'quebra', 'patinete-fim': 'poder-fim', manobra: 'manobra', 'turbo-patinete': 'turbo', dobro: 'dobro', bau: 'bau', 'poder-fim': 'poder-fim',
  };

  // aviso no alto da tela: o que vem em movimento, em que faixa ele chega e como passar
  const alertaEl = el('div', 'alerta-movel');
  alertaEl.hidden = true;
  alertaEl.setAttribute('aria-live', 'polite');
  palco.append(alertaEl);
  const FIG_MOVEL = { onibus: '🚌', bicicleta: '🚲', cachorro: '🐕', caranguejo: '🦀', bola: '🏐', tronco: '🪵', galho: '🌿', boladeneve: '❄️', pinguim: '🐧',
    jujuba: '🍬', minhoca: '🪱', batebate: '🚗', algodao: '☁️', feno: '🌾', camelo: '🐫', robo: '🤖', meteorito: '☄️' };
  const NOME_MOVEL = { onibus: 'Ônibus', bicicleta: 'Bicicleta', cachorro: 'Cachorro', caranguejo: 'Caranguejo', bola: 'Bola', tronco: 'Tronco', galho: 'Galho', boladeneve: 'Bola de neve', pinguim: 'Pinguim',
    jujuba: 'Jujuba', minhoca: 'Minhoca de goma', batebate: 'Carrinho de bate-bate', algodao: 'Bola de algodão-doce', feno: 'Bola de feno', camelo: 'Camelo', robo: 'Robozinho lunar', meteorito: 'Meteorito' };
  const JEITO_MOVEL = { pular: '⬆️ pule', deslizar: '⬇️ deslize', desviar: '↔️ desvie' };
  let alertaVisto = null;
  function desenharAlerta() {
    const o = s && rodando && capturada === null ? s.objetos.filter((x) => x.movel && x.z > 1.5 && !x.quebrado).sort((a, b) => a.z - b.z)[0] : null;
    if (!o) { alertaEl.hidden = true; alertaVisto = null; return; }
    if (alertaVisto !== o) {
      alertaVisto = o;
      alertaEl.innerHTML = `<b>⚠️ ${FIG_MOVEL[o.tipo]}</b><span class="faixas">${[0, 1, 2].map((f) => `<i class="${f === o.destino ? 'vem' : ''}">${f === o.destino ? FIG_MOVEL[o.tipo] : ''}</i>`).join('')}</span><small>${JEITO_MOVEL[cor.comoPassar(o)]}</small>`;
      alertaEl.setAttribute('aria-label', `${NOME_MOVEL[o.tipo]} chegando: ${JEITO_MOVEL[cor.comoPassar(o)].slice(3)}`);
    }
    alertaEl.hidden = false;
  }

  // aviso rápido no meio da tela quando a corrida fica mais rápida
  const avisoAcelera = el('div', 'aviso-acelera');
  avisoAcelera.hidden = true;
  palco.append(avisoAcelera);
  function mostrarAcelera() {
    avisoAcelera.textContent = `🔥 Mais rápido! ${Math.round(s.vel * 3.6)} km/h`;
    avisoAcelera.hidden = false;
    avisoAcelera.classList.remove('mostra'); void avisoAcelera.offsetWidth; avisoAcelera.classList.add('mostra');
    clearTimeout(mostrarAcelera.relogio);
    mostrarAcelera.relogio = setTimeout(() => { avisoAcelera.hidden = true; }, 1600);
  }

  function laco(agora) {
    if (!rodando || !ativa()) { rodando = false; return; }
    const dt = anterior ? (agora - anterior) / 1000 : 0;
    anterior = agora;
    if (!pausado && !congelado) {
      cor.avancar(s, dt);
      for (const e of s.eventos) {
        if (e === 'perseguidor') ctl.som(SOM_PERSEGUIDOR[perseguidorAgora()]);
        else if (e === 'acelera') { ctl.som('turbo'); mostrarAcelera(); }
        else if (e === 'manobra') { ctl.som('manobra'); mostrarManobra(); }
        else if (e.startsWith?.('alerta:')) ctl.som(e === 'alerta:caranguejo' ? 'caranguejo' : 'xeque');
        else if (SOM[e]) ctl.som(SOM[e]);
      }
      s.eventos.length = 0;
      if (quadro % 10 === 0) sonsContinuos();
      if (++quadro % 6 === 0) { desenharHud(); desenharAlerta(); }
    }
    if (!s.vivo) {
      // a batida: quem persegue alcança a menina antes da tela de fim
      pegando += dt;
      if (capturada === null && (cor.alcancar(s, dt) || pegando > 1.4)) {
        // pegou! ela se vira para a tela, triste, presa por quem a perseguia
        capturada = 0;
        desenharHud();
        ctl.som(SOM_PERSEGUIDOR[perseguidorAgora()]);
        setTimeout(() => ctl.som('derrota'), 700);
      }
      if (capturada !== null) {
        capturada += dt;
        if (capturada > 2.8) {
          desenhar(agora / 1000);
          rodando = false;
          capturada = null;
          desenharHud();
          return fimDeJogo();
        }
      }
    }
    desenhar(agora / 1000);
    requestAnimationFrame(laco);
  }

  // Ronco da mochila enquanto voa e o som ambiente do cenário em que ela está.
  let ambiente = null;
  const perseguidorAgora = () => quemPersegue(cenarioDaCorrida(prefs.cenario ?? 'passeio', s?.dist ?? 0), prefs.perseguidorFloresta);
  let pegando = 0;

  function sonsContinuos() {
    if (!prefs.som || !s || pausado || !rodando) { desligarLacos(); ambiente = null; return; }
    for (const [tipo, som] of [['mochila', 'jato'], ['capa', 'capa'], ['nave', 'nave']]) {
      if (s.voo > 0 && s.vooTipo === tipo) ligarLaco(som); else desligarLaco(som);
    }
    const tema = cenarioDaCorrida(prefs.cenario ?? 'passeio', s.dist);
    if (tema !== ambiente) { if (ambiente) desligarLaco(ambiente); ligarLaco(tema); ambiente = tema; }
  }
  function calarTudo() { desligarLacos(); ambiente = null; }

  function comecar() {
    ctl.som('clique');
    ativa = ctl.ativa();
    const c = prefs.carteira;
    s = cor.nova(ctl.nivel(), { poderes: c.poderes, skate: c.skate, cargas: c.cargas, patinete: c.patinete, cargasPatinete: c.cargasPatinete, arrancadas: c.arrancadas, dom: personagemDe(c.personagem).dom, cenario: prefs.cenario ?? 'passeio' });
    temaVisto = null;
    pegando = 0;
    capturada = null;
    camada.innerHTML = '';
    camada.hidden = true;
    pausado = false;
    rodando = true;
    desenharHud();
    dicaGestos.hidden = false;
    dicaGestos.classList.remove('some'); void dicaGestos.offsetWidth; dicaGestos.classList.add('some');
    setTimeout(() => { dicaGestos.hidden = true; }, 4200);
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
    camada.className = 'corrida-camada';
    if (sim) calarTudo();
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

  // patinetes na loja: de lado, com rodinhas, haste, guidão e fitinhas
  const svgPatinete = (deck, haste, punho, roda, extra = '') => `<svg class="svg-patinete" viewBox="0 0 60 40"><path d="M47 33 L44 6" stroke="${haste}" stroke-width="3" stroke-linecap="round"/><path d="M39 5 H50" stroke="${haste}" stroke-width="2.6" stroke-linecap="round"/><rect x="37" y="3" width="5" height="4" rx="2" fill="${punho}"/><path d="M37 5 q-4 3 -3 8 M38 6 q-1 4 1 8" stroke="#ffd21f" stroke-width="1.2" fill="none"/><rect x="8" y="27" width="40" height="5" rx="2.5" fill="${deck}"/><path d="M8 29 q-2 -6 6 -5" stroke="${deck}" stroke-width="2.4" fill="none"/>${extra}<circle cx="13" cy="34" r="4.6" fill="${roda}" stroke="#333" stroke-width="1"/><circle cx="47" cy="34" r="4.6" fill="${roda}" stroke="#333" stroke-width="1"/><circle cx="13" cy="34" r="1.6" fill="${deck}"/><circle cx="47" cy="34" r="1.6" fill="${deck}"/><path d="M24 29.5 l1 -2 1 2 2 0 -1.6 1.3 .6 2 -2 -1.2 -2 1.2 .6 -2 -1.6 -1.3z" fill="#ffd21f"/></svg>`;
  const PATINETE_SVG = {
    classico: svgPatinete('#ff5fa2', '#b9c1cd', '#8a6cff', '#ffffff'),
    luzes: svgPatinete('#8a6cff', '#e8ebf0', '#ff5fa2', '#fff', '<circle cx="13" cy="34" r="7.5" fill="#ff5fa2" opacity=".35"/><circle cx="47" cy="34" r="7.5" fill="#5ae6ff" opacity=".35"/><circle cx="18" cy="29.5" r="1" fill="#ffd21f"/><circle cx="30" cy="29.5" r="1" fill="#5ae6ff"/><circle cx="40" cy="29.5" r="1" fill="#ff5fa2"/>'),
    eletrico: svgPatinete('#22c993', '#3a4150', '#22c993', '#2b2f3a', '<rect x="16" y="32" width="22" height="3" rx="1.5" fill="#2b2f3a"/><circle cx="45.4" cy="18" r="2" fill="#fff6c0"/><path d="M27 31 l-2 3 2 0 -1 3 3 -4 -2 0 1 -2z" fill="#ffd21f"/><path d="M5 26 h-4 M6 29 h-5" stroke="#4fd8ff" stroke-width="1.6" stroke-linecap="round"/>'),
  };

  function carteiraHtml() {
    const c = prefs.carteira;
    return `<div class="carteira"><span>🪙 <b>${fmt(c.moedas)}</b></span><span>🛹 <b>${c.cargas}</b></span><span>🛴 <b>${c.cargasPatinete}</b></span><span>🎒 <b>${c.arrancadas}</b></span></div>`;
  }

  function salvarCarteira(c) { prefs.carteira = c; guardar(); }

  // Anima a menina no saguão e na tela de fim (respirando, comemorando) enquanto a corrida não roda.
  function animarVitrine() {
    if (vitrineAnimando || !mundo) return;
    vitrineAnimando = true;
    const passo = (agora) => {
      if (rodando || !palco.isConnected || camada.hidden || !mundo) { vitrineAnimando = false; return; }
      desenhar(agora / 1000);
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  const topoLobby = () => {
    const c = prefs.carteira;
    const eu = perfilAtual();
    const nome = eu.nome.replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[x]);
    const quem = temVariosPerfis() ? `<span class="pilula jogador">${eu.avatar} <b>${nome}</b></span>` : '';
    return `<div class="lobby-topo">${quem}<span class="pilula">🪙 <b>${fmt(c.moedas)}</b></span><span class="pilula">🛹 <b>${c.cargas}</b></span><span class="pilula">🛴 <b>${c.cargasPatinete}</b></span><span class="pilula">🎒 <b>${c.arrancadas}</b></span></div>`;
  };
  // Sem 3D, o retrato desenhado ocupa o lugar da menina.
  // (o retrato fica escondido pelo CSS quando o 3D carrega, mesmo que carregue depois de a tela abrir)
  const lugarDaMenina = (sorriso) => `<div class="lobby-menina">${retrato({ ...prefs.personagem, estilo: prefs.carteira.estilo, sorriso })}</div>`;

  function telaInicial(aba = 'saguao', aviso = '') {
    rodando = false;
    calarTudo();
    s = null;
    pausaEl.hidden = true;
    camada.hidden = false;
    vitrinePose = 'vitrine';
    salvarCarteira(loja.completarMissoes(prefs.carteira));
    const c = prefs.carteira;
    if (aba !== 'personagens') previa = null;
    if (aba === 'personagens') { galeria(aviso); return; }
    if (aba === 'saguao') {
      const r = recorde();
      const presente = loja.presenteDisponivel(c, hoje());
      camada.className = 'corrida-camada modo-lobby';
      camada.innerHTML = `<div class="lobby">
        ${topoLobby()}
        <div class="lobby-meio">
          <div class="lobby-esquerda">${lugarDaMenina('feliz')}<button class="botao-turma" data-ir="personagens">👥 <b>${personagemDe(c.personagem).nome}</b><small>Trocar personagem</small></button></div>
          <div class="lobby-placas">
            <div class="placa"><span>Recorde</span><b>${r ? fmt(r) : '—'}</b></div>
            <div class="placa"><span>Moedas</span><b>🪙 ${fmt(c.moedas)}</b></div>
            <div class="placa missoes"><span>Missões</span>${c.missoes.map((m) => `<small>🎯 ${m.texto} <em>+${fmt(m.premio)}</em></small>`).join('')}</div>
            ${presente ? '<button class="placa presente" data-presente>🎁 <b>Presente do dia</b><small>Toque para abrir</small></button>' : ''}
            ${aviso ? `<p class="aviso-loja">${aviso}</p>` : ''}
          </div>
        </div>
        <div class="lobby-base">
          <button class="botao-lobby" data-ir="visual"><b>🎨</b>Visual</button>
          <button class="botao-lobby" data-ir="loja"><b>🛒</b>Loja</button>
          <button class="botao-lobby" data-ir="missoes"><b>🎯</b>Prêmios</button>
          <button class="botao-jogar" data-correr>JOGAR</button>
        </div>
      </div>`;
      ligarTelaInicial(aba);
      desenharHud();
      desenhar(0);
      animarVitrine();
      ctl.status('Toque em JOGAR!', 'voce');
      return;
    }
    // painéis: Visual, Loja e Prêmios, por cima do saguão
    const abas = [['visual', '🎨 Visual'], ['loja', '🛒 Loja'], ['missoes', '🎯 Prêmios']];
    let corpo = '';
    if (aba === 'visual') {
      corpo = `
        <div class="retrato">${retrato({ ...prefs.personagem, estilo: prefs.carteira.estilo })}</div>
        <div class="escolha"><span>Pele</span>${PELES.map((cor_, k) => `<button class="amostra${prefs.personagem.pele === k ? ' sel' : ''}" data-pele="${k}" style="background:${cor_}" aria-label="Tom de pele ${k + 1}"></button>`).join('')}</div>
        <div class="escolha"><span>Roupa</span>${ROUPAS.map((cor_, k) => `<button class="amostra${prefs.personagem.roupa === k ? ' sel' : ''}" data-roupa="${k}" style="background:${cor_}" aria-label="Cor da roupa ${k + 1}"></button>`).join('')}</div>
        <small class="equipado">${loja.ESTILOS.find((e) => e.id === c.estilo)?.icone ?? ''} Estilo ${loja.ESTILOS.find((e) => e.id === c.estilo)?.nome ?? ''}: troque na Loja</small>
        <div class="cenarios velocidade"><span>Velocidade</span>${[['facil', 'Fácil', '🐢'], ['medio', 'Médio', '🏃‍♀️'], ['dificil', 'Difícil', '⚡']].map(([id, nome, ic]) => `<button data-velocidade="${id}" aria-pressed="${prefs.nivel === id}"><b>${ic}</b>${nome}</button>`).join('')}</div>
        <div class="cenarios lugares"><span>Cenário</span>${CENARIOS.map((c_) => `<button data-cenario="${c_.id}" aria-pressed="${(prefs.cenario ?? 'passeio') === c_.id}" aria-label="${c_.nome}"><b style="background:${c_.mini ? `linear-gradient(${c_.mini[0]}, ${c_.mini[1]} 62%, ${c_.mini[2]} 62%)` : 'conic-gradient(#7cc4ff, #ff8fcf, #ffd34d, #6cc070, #1f2a58, #7cc4ff)'}">${c_.icone}</b>${c_.curto}</button>`).join('')}</div>
        ${['floresta', 'passeio'].includes(prefs.cenario ?? 'passeio') ? `<div class="cenarios bichos"><span>Na floresta, quem corre atrás?</span>${OPCOES_FLORESTA.map((o) => `<button data-bicho="${o.id}" aria-pressed="${prefs.perseguidorFloresta === o.id}"><b>${o.icone}</b>${o.nome}</button>`).join('')}</div>` : ''}
        <small class="equipado">${SKATE_SVG[c.skate]} ${cor.SKATES[c.skate].nome}: toque duas vezes na tela para subir</small>
        <small class="equipado">${PATINETE_SVG[c.patinete]} ${cor.PATINETES[c.patinete].nome}: toque no botão 🛴 para subir</small>`;
    } else if (aba === 'loja') {
      corpo = `
        <h4>Estilos de roupa</h4>
        ${loja.ESTILOS.map((it) => {
          const tem = c.estilos.includes(it.id);
          const usando = c.estilo === it.id;
          const botao = usando ? '<span class="usando">Vestindo</span>' : tem ? `<button class="botao secundario" data-vestir="${it.id}">Vestir</button>` : `<button class="botao" data-estilo="${it.id}" ${c.moedas < it.preco ? 'disabled' : ''}>🪙 ${fmt(it.preco)}</button>`;
          return `<div class="item-loja"><span class="retrato-mini">${retrato({ ...prefs.personagem, estilo: it.id })}</span><div><b>${it.icone} ${it.nome}</b><small>${it.texto}</small></div>${botao}</div>`;
        }).join('')}
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
        <h4>Patinetes</h4>
        ${loja.PATINETES_LOJA.map((it) => {
          const tem = c.patinetes.includes(it.id);
          const usando = c.patinete === it.id;
          const botao = usando ? '<span class="usando">Em uso</span>' : tem ? `<button class="botao secundario" data-usar-patinete="${it.id}">Usar</button>` : `<button class="botao" data-patinete="${it.id}" ${c.moedas < it.preco ? 'disabled' : ''}>🪙 ${fmt(it.preco)}</button>`;
          return `<div class="item-loja">${PATINETE_SVG[it.id]}<div><b>${cor.PATINETES[it.id].nome}</b><small>${it.texto}</small></div>${botao}</div>`;
        }).join('')}
        <h4>Cargas de patinete</h4>
        <div class="item-loja"><span class="icone-item">🛴</span><div><b>Você tem ${c.cargasPatinete}</b><small>São separadas das cargas de skate. Cada carga liga o patinete por ${cor.DURACAO_PATINETE} s: toque no botão 🛴 durante a corrida. O 🛴 que aparece na pista é de graça.</small></div>
          <span class="dupla"><button class="botao" data-cargas-patinete="1" ${c.moedas < loja.PRECO_CARGA_PATINETE ? 'disabled' : ''}>+1 · 🪙 ${loja.PRECO_CARGA_PATINETE}</button><button class="botao" data-cargas-patinete="5" ${c.moedas < loja.PRECO_CARGA_PATINETE * 5 ? 'disabled' : ''}>+5 · 🪙 ${fmt(loja.PRECO_CARGA_PATINETE * 5)}</button></span></div>
        <h4>Bônus de largada</h4>
        <div class="item-loja"><span class="icone-item">🎒</span><div><b>Mochila a jato · você tem ${c.arrancadas}</b><small>Toque em "Decolar" nos primeiros ${cor.JANELA_ARRANCADA} s da corrida e comece voando.</small></div>
          <span class="dupla"><button class="botao" data-arrancadas="1" ${c.moedas < loja.PRECO_ARRANCADA ? 'disabled' : ''}>+1 · 🪙 ${loja.PRECO_ARRANCADA}</button><button class="botao" data-arrancadas="3" ${c.moedas < loja.PRECO_ARRANCADA * 3 ? 'disabled' : ''}>+3 · 🪙 ${fmt(loja.PRECO_ARRANCADA * 3)}</button></span></div>
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
    camada.className = 'corrida-camada';
    camada.innerHTML = `<div class="cartao-corrida inicio">
      <div class="painel-topo"><strong>${abas.find((a) => a[0] === aba)?.[1] ?? ''}</strong><button class="botao-icone fechar-painel" data-ir="saguao" aria-label="Voltar">✕</button></div>
      ${carteiraHtml()}
      <div class="abas-corrida">${abas.map(([id, nome]) => `<button data-aba="${id}" aria-pressed="${id === aba}">${nome.split(' ')[1]}</button>`).join('')}</div>
      ${aviso ? `<p class="aviso-loja">${aviso}</p>` : ''}
      <div class="corpo-aba">${corpo}</div>
      <button class="botao-jogar largo" data-correr>JOGAR</button>
    </div>`;
    ligarTelaInicial(aba);
    desenharHud();
    desenhar(0);
    animarVitrine();
    ctl.status(aba === 'loja' ? 'Troque suas moedas por roupas, skates, patinetes e poderes' : aba === 'missoes' ? 'Cumpra missões para ganhar moedas' : 'Escolha o visual, a velocidade e o cenário', 'voce');
  }

  // ---------- galeria de personagens ----------
  // Em cima, o personagem em 3D de corpo inteiro com o nome e o botão; embaixo, a turma para escolher.
  function galeria(aviso = '') {
    const c = prefs.carteira;
    previa ??= c.personagem;
    const p = personagemDe(previa);
    const tem = c.personagens.includes(p.id);
    const usando = c.personagem === p.id;
    const acao = usando ? '<span class="galeria-acao selecionado">Selecionado ✓</span>'
      : tem ? `<button class="galeria-acao" data-escolher="${p.id}">SELECIONAR</button>`
        : `<button class="galeria-acao comprar" data-comprar="${p.id}" ${c.moedas < p.preco ? 'disabled' : ''}>${p.preco ? `🪙 ${fmt(p.preco)}` : 'GRÁTIS'}</button>`;
    camada.className = 'corrida-camada modo-lobby';
    camada.innerHTML = `<div class="lobby galeria">
      ${topoLobby()}
      <div class="galeria-titulo"><h3>${p.nome}</h3><span class="galeria-dom">${p.iconeDom ?? ''} ${p.titulo}</span><small>${p.textoDom ?? ''}</small></div>
      <div class="galeria-palco">${mundo ? (p.arteCorpo ? `<img class="galeria-arte" src="${p.arteCorpo}" alt="Ilustração de ${p.nome}">` : '') : `<div class="galeria-2d">${p.arteCorpo ? `<img src="${p.arteCorpo}" alt="">` : miniatura(p)}</div>`}</div>
      ${acao}
      ${!tem && c.moedas < p.preco ? `<p class="galeria-aviso">Faltam ${fmt(p.preco - c.moedas)} moedas</p>` : aviso ? `<p class="galeria-aviso">${aviso}</p>` : ''}
      <div class="galeria-grade">${PERSONAGENS.map((x) => {
        const meu = c.personagens.includes(x.id);
        return `<button class="cartao-turma${x.id === p.id ? ' vendo' : ''}" data-ver="${x.id}" aria-pressed="${x.id === p.id}">${miniatura(x)}<b>${x.nome}</b>${c.personagem === x.id ? '<i class="marca usando">✓</i>' : meu ? '<i class="marca">✓</i>' : `<small>${x.preco ? `🪙 ${fmt(x.preco)}` : 'Grátis'}</small>`}</button>`;
      }).join('')}</div>
      <div class="galeria-base"><button class="botao-lobby" data-ir="saguao"><b>✕</b>Voltar</button><button class="botao-jogar" data-correr>JOGAR</button></div>
    </div>`;
    const q = (sel) => camada.querySelectorAll(sel);
    q('[data-ver]').forEach((b) => { b.onclick = () => { previa = b.dataset.ver; ctl.som('clique'); galeria(); }; });
    q('[data-ir]').forEach((b) => { b.onclick = () => { ctl.som('clique'); telaInicial(b.dataset.ir); }; });
    q('[data-correr]').forEach((b) => { b.onclick = () => { previa = null; comecar(); }; });
    const aplicar = (r, texto) => {
      if (r.erro) { ctl.som('erro'); galeria(r.erro); return; }
      salvarCarteira(r.carteira);
      const escolhido = personagemDe(r.carteira.personagem);
      if (escolhido.estilo) salvarCarteira({ ...r.carteira, estilos: Array.from(new Set([...r.carteira.estilos, escolhido.estilo])), estilo: escolhido.estilo }); // chega vestindo a roupa dele, que fica de brinde
      prefs.personagem.pele = escolhido.pele; guardar(); // cada um chega com o seu tom de pele (dá para mudar em Visual)
      ctl.som('premio'); galeria(texto);
    };
    q('[data-escolher]').forEach((b) => { b.onclick = () => aplicar(loja.escolherPersonagem(prefs.carteira, b.dataset.escolher), `${p.nome} vai correr!`); });
    q('[data-comprar]').forEach((b) => { b.onclick = () => aplicar(loja.comprarPersonagem(prefs.carteira, b.dataset.comprar), `${p.nome} entrou para a turma!`); });
    desenharHud();
    desenhar(0);
    animarVitrine();
    ctl.status('Escolha quem vai correr', 'voce');
  }

  function ligarTelaInicial(aba) {
    const q = (sel) => camada.querySelectorAll(sel);
    q('[data-aba]').forEach((b) => { b.onclick = () => { ctl.som('clique'); telaInicial(b.dataset.aba); }; });
    q('[data-ir]').forEach((b) => { b.onclick = () => { ctl.som('clique'); telaInicial(b.dataset.ir); }; });
    q('[data-correr]').forEach((b) => { b.onclick = comecar; });
    q('[data-velocidade]').forEach((b) => {
      b.onclick = () => { prefs.nivel = b.dataset.velocidade; guardar(); ctl.som('clique'); telaInicial(aba); };
    });
    q('[data-bicho]').forEach((b) => {
      b.onclick = () => {
        prefs.perseguidorFloresta = b.dataset.bicho; guardar();
        ctl.som(SOM_PERSEGUIDOR[b.dataset.bicho]);
        telaInicial(aba);
      };
    });
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
    q('[data-estilo]').forEach((b) => { b.onclick = () => resultado(loja.comprarEstilo(prefs.carteira, b.dataset.estilo), `Estilo ${loja.ESTILOS.find((e) => e.id === b.dataset.estilo).nome} é seu!`); });
    q('[data-vestir]').forEach((b) => { b.onclick = () => resultado(loja.vestirEstilo(prefs.carteira, b.dataset.vestir), `Vestindo o estilo ${loja.ESTILOS.find((e) => e.id === b.dataset.vestir).nome}.`); });
    q('[data-skate]').forEach((b) => { b.onclick = () => resultado(loja.comprarSkate(prefs.carteira, b.dataset.skate), `${cor.SKATES[b.dataset.skate].nome} é seu!`); });
    q('[data-equipar]').forEach((b) => { b.onclick = () => resultado(loja.equipar(prefs.carteira, b.dataset.equipar), `Usando o ${cor.SKATES[b.dataset.equipar].nome}.`); });
    q('[data-cargas]').forEach((b) => { b.onclick = () => resultado(loja.comprarCargas(prefs.carteira, Number(b.dataset.cargas)), `+${b.dataset.cargas} ${b.dataset.cargas === '1' ? 'carga' : 'cargas'} de skate.`); });
    q('[data-patinete]').forEach((b) => { b.onclick = () => resultado(loja.comprarPatinete(prefs.carteira, b.dataset.patinete), `${cor.PATINETES[b.dataset.patinete].nome} é seu!`); });
    q('[data-usar-patinete]').forEach((b) => { b.onclick = () => resultado(loja.escolherPatinete(prefs.carteira, b.dataset.usarPatinete), `Usando o ${cor.PATINETES[b.dataset.usarPatinete].nome}.`); });
    q('[data-cargas-patinete]').forEach((b) => { b.onclick = () => resultado(loja.comprarCargasPatinete(prefs.carteira, Number(b.dataset.cargasPatinete)), `+${b.dataset.cargasPatinete} ${b.dataset.cargasPatinete === '1' ? 'carga' : 'cargas'} de patinete.`); });
    q('[data-arrancadas]').forEach((b) => { b.onclick = () => resultado(loja.comprarArrancadas(prefs.carteira, Number(b.dataset.arrancadas)), `+${b.dataset.arrancadas} mochila${b.dataset.arrancadas === '1' ? '' : 's'} a jato de largada.`); });
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
    calarTudo();
    const res = cor.resumo(s);
    const antes = recorde();
    const fechado = loja.fecharCorrida(prefs.carteira, res);
    salvarCarteira(fechado.carteira);
    ctl.fim('concluida', `Fim da corrida: ${fmt(res.pontos)} pontos`, null, { pontos: res.pontos, moedas: res.moedas, metros: res.metros });
    if (fechado.concluidas.length) setTimeout(() => ctl.som('premio'), 600);
    const novo = res.pontos > antes;
    vitrinePose = novo ? 'comemora' : 'triste';
    hud.innerHTML = ''; patineteEl.hidden = true;
    pausaEl.hidden = true;
    camada.hidden = false;
    camada.className = 'corrida-camada modo-lobby';
    const pct = antes ? Math.min(100, Math.round((res.pontos / antes) * 100)) : 100;
    const quem = `${EMOJI[perseguidorAgora()]} ${NOMES[perseguidorAgora()].replace(/^./, (l) => l.toUpperCase())} te alcançou`;
    camada.innerHTML = `<div class="lobby resultado">
      ${topoLobby()}
      <div class="lobby-meio">
        ${lugarDaMenina(novo ? 'uau' : 'feliz')}
        <div class="lobby-placas">
          <div class="placa destaque">${novo ? '<i class="fita">Novo recorde! 🎉</i>' : ''}<span>Pontuação</span><b>${fmt(res.pontos)}</b><small>${res.metros} m · ${quem}</small></div>
          <div class="placa"><span>Moedas</span><b>🪙 +${fmt(res.moedas)}</b></div>
          ${fechado.concluidas.length ? `<div class="placa missoes"><span>Missões cumpridas</span>${fechado.concluidas.map((m) => `<small>🎯 ${m.texto} <em>+${fmt(m.premio)}</em></small>`).join('')}</div>` : ''}
          <div class="placa progresso"><span>${novo ? 'Seu novo recorde!' : `Recorde: ${fmt(antes)}`}</span><div class="barra-recorde"><i style="width:${pct}%"></i><em>${fmt(res.pontos)} / ${fmt(Math.max(antes, res.pontos))}</em></div></div>
        </div>
      </div>
      <div class="lobby-base">
        <button class="botao-lobby" data-ir="saguao"><b>🏠</b>Início</button>
        <button class="botao-lobby" data-ir="loja"><b>🛒</b>Loja</button>
        <button class="botao-jogar" data-correr>JOGAR</button>
      </div>
    </div>`;
    ligarTelaInicial('resultado');
    desenhar(0);
    animarVitrine();
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
  let ultimoToque = 0;
  palco.addEventListener('pointerup', (e) => {
    if (toque && !toque.feito && s && rodando && !pausado) {
      // toque duplo: sobe no skate
      if (e.timeStamp - ultimoToque < 320) { agir('skate'); ultimoToque = 0; } else ultimoToque = e.timeStamp;
    }
    toque = null;
  });
  palco.addEventListener('pointercancel', () => { toque = null; });
  decolarEl.onclick = () => agir('arrancada');
  patineteEl.onclick = () => { agir(s?.patinete > 0 ? 'turbo-patinete' : 'patinete'); desenharHud(); };
  const teclas = (e) => {
    if (!palco.isConnected) { document.removeEventListener('keydown', teclas); observador.disconnect(); mundo?.destruir(); mundo = null; return; }
    const mapa = { ArrowLeft: 'esquerda', a: 'esquerda', ArrowRight: 'direita', d: 'direita', ArrowUp: 'pular', w: 'pular', ' ': 'pular', ArrowDown: 'deslizar', s: 'deslizar', k: 'skate', q: 'patinete', e: 'supercarga', j: 'arrancada' };
    const acao = mapa[e.key];
    if (acao && rodando) { e.preventDefault(); agir(acao === 'patinete' && s?.patinete > 0 ? 'turbo-patinete' : acao); }
    if (e.key === 'Escape' || e.key === 'p') pausar(!pausado);
  };
  document.addEventListener('keydown', teclas);

  // Só para capturas de tela e testes: com ?demo no endereço, o estado da corrida fica acessível.
  if (new URLSearchParams(location.search).has('demo')) window.corridaDemo = { estado: () => s, congelar: (sim = true) => { congelado = sim; desenharHud(); desenharAlerta(); } };

  telaInicial();
  return { reiniciar: () => telaInicial() };
}
