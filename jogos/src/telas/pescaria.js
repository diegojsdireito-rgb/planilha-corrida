// Tela da Pescaria: mapa de 40 fases em quatro lugares e o lago visto de lado, desenhado num canvas.
// Segure o dedo no lago para descer o anzol (o barco vai atrás do dedo) e solte para subir.
import { el, formatarTempo } from '../comum.js';
import { prefs, guardar } from '../dados.js';
import { retrato } from '../personagem.js';
import * as pe from '../pescaria.js';
import { placa, nuvem, estrelinha } from './docinhos-mapa-arte.js';
import { CENARIOS, peixinho, floco, lua } from './pescaria-arte.js';

export const INFO = {
  id: 'pescaria',
  nome: 'Pescaria',
  descricao: 'Pesque peixes em 40 fases',
  solo: true,
  semNivel: true,
  regras: [
    'O jogo abre no mapa: um caminho de 40 fases por quatro lugares (🏞️ Lagoa, 🌊 Rio, 🏖️ Mar e 🧊 Mar Gelado). Toque numa fase para ver a meta e jogar; nas que você já passou, dá para jogar de novo e ganhar mais estrelas. O botão 🗺️ Mapa volta para o caminho e guarda a pescaria.',
    'Segure o dedo no lago: o barquinho vai até onde você está apontando e o anzol desce. Solte para o anzol subir. Encostou num peixe, ele fica preso e sobe sozinho; segurando o dedo, ele sobe mais rápido.',
    'Cada fase tem uma meta: fazer pontos, pegar alguns peixes de um tipo ou pegar vários peixes seguidos sem pescar lixo (a bota e a lata tiram pontos e zeram a sequência). Cumpriu a meta, a fase acaba: quanto mais tempo sobrar, mais estrelas (até 3).',
    'A cada 10 fases vem o 👑 Peixe-Rei: fisgado, ele puxa a linha. Toque bem rápido, várias vezes, para trazer ele até o barco; se parar, ele escapa.',
    'No Rio, a correnteza empurra o anzol para o lado e alguns peixes fogem quando o anzol chega perto: desça bem em cima deles. No Mar, se a linha encostar numa água-viva com um peixe no anzol, ele se solta; e o tubarão rouba o peixe de quem demora a subir. No Mar Gelado, de noite, você pesca pelos buracos no gelo; alguns peixes brilham e somem por um tempinho.',
    'Bônus (embaixo do lago), que não param o jogo: 🪱 Isca dourada atrai os peixes raros e o peixe da meta até o anzol; 🥅 Rede pega de uma vez os peixes em volta do anzol, sem pegar lixo; ⏱️ dá 15 segundos a mais. Você começa com 3 de cada e ganha um bônus sorteado por estrela ao vencer uma fase.',
    'Vencer uma fase pela primeira vez dá 10 moedas 🪙 por estrela; jogando de novo, cada estrela nova vale mais 5. As moedas servem na loja da Corrida e no Meu Bichinho.',
    'No computador, use as setas para mover o barco e segure a barra de espaço para descer o anzol (e aperte várias vezes para puxar o Peixe-Rei).',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><defs><linearGradient id="pesc-ic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0ff"/><stop offset="1" stop-color="#1e63d6"/></linearGradient></defs><rect width="12" height="12" rx="2" fill="#bfe9ff"/><path d="M0 4.4q1.5-.8 3 0t3 0 3 0 3 0V10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2Z" fill="url(#pesc-ic)"/><path d="M1.6 3.4h5.2l-.9 1.2H2.4Z" fill="#c0392b"/><path d="M5.4 3.4 8.6 1" stroke="#7a4a22" stroke-width=".35"/><path d="M8.6 1v6.6" stroke="#fff" stroke-width=".18"/><path d="M8.6 7.6q0 .7-.6.6" fill="none" stroke="#fff" stroke-width=".3"/><ellipse cx="5" cy="8.6" rx="1.6" ry="1" fill="#ffa53d"/><path d="M3.5 8.6 2.6 7.9v1.4Z" fill="#ff6a1f"/><circle cx="5.8" cy="8.4" r=".22" fill="#222"/></svg>';

export function resumo() {
  const p = pe.progresso(prefs.historico);
  const fase = p.liberada; const est = p.estrelas;
  return {
    cartao: `<b>Fase ${fase}</b> · ${est} ★`,
    placar: `<span class="lado"><span class="avatar voce">🎣</span>Fase <span class="num">${fase}</span></span><span class="x">·</span><span class="lado">Estrelas <span class="num">${est}</span></span>`,
    painel: { valor: `Fase ${fase}`, rotulo: 'próxima fase', sub: `${est} ${est === 1 ? 'estrela' : 'estrelas'} conquistadas` },
  };
}

function estoque() {
  prefs.bonusPescaria ??= Object.fromEntries(pe.BONUS.map((b) => [b.id, pe.BONUS_INICIAL]));
  for (const b of pe.BONUS) prefs.bonusPescaria[b.id] ??= pe.BONUS_INICIAL;
  return prefs.bonusPescaria;
}

const CEU = 26; // altura do céu, em unidades do mundo
const AREIA = 5;
const ALTURA = CEU + pe.FUNDO + AREIA;
const NOMES_PESCOU = { piaba: 'Uma piaba!', laranja: 'Peixe-laranja!', rosa: 'Peixe-rosa!', listrado: 'Peixe-palhaço!', roxo: 'Peixe-lua!', dourado: 'PEIXE DOURADO! 🌟', rei: 'O PEIXE-REI! 👑', bota: 'Eca, uma bota velha!', lata: 'Ih, uma lata…' };
const ICONE_META = { pontos: '⭐', peixe: '🐟', limpa: '✨', rei: '👑' };

// Cores e enfeites de cada lugar, para o canvas.
const CENA = {
  lagoa: { ceu: ['#7cc8ff', '#e6f6ff'], agua: ['#5fd0ff', '#2b93e0', '#1659b8', '#0d3a80'], areia: ['#e9cf8f', '#d6b871'], borda: ['#1659b8', '#0d3a80'] },
  rio: { ceu: ['#8fd4ff', '#eaf8ff'], agua: ['#6fe0d0', '#2fb0b0', '#1a7f8f', '#0f4f66'], areia: ['#c9b48a', '#a8916a'], borda: ['#1a7f8f', '#0f4f66'] },
  mar: { ceu: ['#5bb8ff', '#d8f1ff'], agua: ['#4fd8f0', '#1f9fe0', '#1460c0', '#0b2f7a'], areia: ['#f5dc9c', '#e6c47a'], borda: ['#1460c0', '#0b2f7a'] },
  gelo: { ceu: ['#0d1238', '#3a2f7a'], agua: ['#2a4f8f', '#1b3570', '#10224f', '#070f2e'], areia: ['#4a5578', '#363f60'], borda: ['#3a3f9a', '#151a4f'] },
};

// plantas fixas no fundo: [x, altura, cor, grossura]
const PLANTAS = [[5, 26, '#2e9e4f', 2.2], [9, 18, '#47c46a', 1.6], [22, 14, '#2e9e4f', 1.8], [33, 30, '#1f7a3c', 2.4], [36, 20, '#5fd17a', 1.5],
  [52, 16, '#47c46a', 1.8], [64, 28, '#2e9e4f', 2.2], [67, 17, '#8be07c', 1.4], [80, 22, '#1f7a3c', 2], [92, 32, '#2e9e4f', 2.4], [95, 19, '#5fd17a', 1.5]];
const PEDRAS = [[15, 3.2, '#8c8f99'], [45, 4.2, '#7a7d87'], [58, 2.6, '#a3a6ae'], [86, 3.6, '#8c8f99']];
const CORAIS = [[8, '#ff7a8a'], [27, '#ffb03d'], [48, '#c86bff'], [70, '#ff7a8a'], [90, '#ffb03d']];
const ESTRELAS_CEU = Array.from({ length: 26 }, (_, k) => [(k * 37.3) % 100, 2 + ((k * 17.7) % 19), 0.25 + (k % 3) * 0.15, k * 1.7]);

const nivelLiberado = () => pe.progresso(prefs.historico).liberada;

export function montar(area, ctl) {
  const mapa = el('div', 'pesc-mapa');
  const fases = el('div', 'pesc-fases');
  const hud = el('div', 'pescaria-hud');
  const palco = el('div', 'pescaria-palco');
  const canvas = el('canvas', 'pescaria-canvas');
  canvas.setAttribute('aria-label', 'Lago. Segure para descer o anzol e solte para subir.');
  canvas.setAttribute('role', 'application');
  canvas.tabIndex = 0;
  const aviso = el('div', 'pescaria-aviso');
  const disputaEl = el('div', 'pesc-disputa');
  disputaEl.hidden = true;
  palco.append(canvas, disputaEl, aviso);
  const barraBonus = el('div', 'pesc-bonus');
  barraBonus.setAttribute('role', 'group'); barraBonus.setAttribute('aria-label', 'Bônus');
  area.append(mapa, fases, hud, palco, barraBonus);
  const telaJogo = [fases, hud, palco, barraBonus];
  const ctx = canvas.getContext('2d');
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // a menina do barco: o retrato SVG vira uma imagem para o canvas
  const menina = new Image();
  let humor = '';
  const fazerMenina = (sorriso) => { if (sorriso === humor) return; humor = sorriso; menina.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso }))}`; };
  fazerMenina('feliz');

  let r = null; let f = null; let cena = CENA.lagoa;
  let viva = () => false; let tAnterior = 0; let relogio = 0; let ultimoSalvo = 0;
  let escala = 1; let larguraCss = 0;
  let bolhas = []; let respingos = []; let textos = []; let redes = []; let neve = [];
  let teclas = { esq: false, dir: false };
  let tremor = 0; let noMapa = true;

  // ---------- HUD ----------
  function escreverHud() {
    const a = pe.andamento(r);
    const pct = Math.min(100, (a.feito / a.alvo) * 100);
    const est = r.acabou ? pe.estrelas(r.restante, r.tempo, r.venceu) : pe.estrelas(r.restante, r.tempo);
    const pouco = r.restante <= 10 && r.comecou && !r.acabou;
    const m = r.meta;
    const rotulo = m.tipo === 'pontos' ? `${r.pontos}<small>/${m.alvo} pts</small>`
      : m.tipo === 'rei' ? (a.feito ? 'Pescado!' : 'Peixe-Rei')
        : `${a.feito}<small>/${a.alvo}</small>`;
    const peixeMeta = m.tipo === 'peixe' ? `<i class="pesc-bolinha" style="--c1:${pe.TIPOS[m.peixe].cor};--c2:${pe.TIPOS[m.peixe].cor2}"></i>` : `<span class="ic">${ICONE_META[m.tipo]}</span>`;
    hud.innerHTML = `<span class="pesc-tempo${pouco ? ' pouco' : ''}">⏱ <b>${formatarTempo(Math.ceil(r.restante))}</b></span>
      <span class="pesc-meta" title="${pe.textoMeta(m)}">${peixeMeta}<span class="txt"><b>${rotulo}</b><span class="pesc-barra"><span class="pesc-enche" style="width:${pct}%"></span></span></span></span>
      <span class="pesc-est" aria-label="${est} estrelas">${[1, 2, 3].map((k) => `<i class="${k <= est ? 'ok' : ''}">★</i>`).join('')}</span>`;
  }

  function desenharFases() {
    fases.innerHTML = '';
    const voltar = el('button', 'botao secundario botao-mapa', '🗺️ Mapa');
    voltar.onclick = () => { ctl.som('clique'); if (r && !r.acabou) ctl.salvar(r); mostrarMapa(); };
    const est = pe.progresso(prefs.historico).melhor[f.n]?.estrelas ?? 0;
    const lugar = pe.lugarDa(f.n);
    fases.append(voltar, el('span', '', `${lugar.icone} Fase ${f.n} de ${pe.TOTAL_FASES} · <span class="pesc-melhor">${'★'.repeat(est)}${'☆'.repeat(3 - est)}</span>`));
  }

  // ---------- Bônus ----------
  function desenharBonus() {
    const est = estoque();
    barraBonus.innerHTML = '';
    for (const b of pe.BONUS) {
      const ativo = b.id === 'isca' && r?.isca > 0;
      const botao = el('button', `bonus${ativo ? ' ativo' : ''}`, `<span class="ic">${b.icone}</span><span class="nome">${b.nome}</span><b class="qtd">${est[b.id]}</b>${ativo ? `<span class="pesc-relogio" style="--p:${(r.isca / pe.DURACAO_ISCA) * 100}%"></span>` : ''}`);
      botao.disabled = !est[b.id] || !r || r.acabou;
      botao.title = b.texto;
      botao.setAttribute('aria-label', `${b.nome}: ${b.texto} Você tem ${est[b.id]}.`);
      botao.onclick = () => usarBonus(b);
      barraBonus.append(botao);
    }
  }

  function usarBonus(b) {
    if (!r || r.acabou || !estoque()[b.id]) return;
    comecar();
    const evs = pe.usarBonus(r, b.id);
    if (!evs) {
      ctl.som('erro');
      ctl.status(b.id === 'rede' ? (r.disputa ? 'A rede não aguenta o Peixe-Rei: toque para puxar!' : 'Desça o anzol perto dos peixes e jogue a rede!') : 'A isca dourada já está na água!', '');
      return;
    }
    estoque()[b.id]--; guardar();
    for (const ev of evs) tratar(ev);
    escreverHud(); desenharBonus();
    if (!r.acabou) ctl.salvar(r);
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

  const onda = (x, t) => (r.lugar === 'gelo' ? CEU : CEU + Math.sin(x * 0.16 + t * 1.6) * (calmo ? 0.3 : 0.8) + Math.sin(x * 0.07 - t * 0.9) * (calmo ? 0.2 : 0.6));

  function nuvemC(x, y, k, cor = 'rgba(255,255,255,.92)') {
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(x, y, 3.2 * k, 0, 7); ctx.arc(x + 3.6 * k, y - 1.4 * k, 3.8 * k, 0, 7); ctx.arc(x + 7.4 * k, y, 3 * k, 0, 7);
    ctx.rect(x, y, 7.4 * k, 3 * k);
    ctx.fill();
  }
  function sol(x, y) {
    const s = ctx.createRadialGradient(x, y, 1, x, y, 11);
    s.addColorStop(0, 'rgba(255,236,150,1)'); s.addColorStop(0.45, 'rgba(255,214,80,.95)'); s.addColorStop(0.5, 'rgba(255,230,140,.35)'); s.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = s; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill();
  }
  function pinheiroC(x, base, alt, cor, comNeve = false) {
    ctx.fillStyle = '#6b4424'; ctx.fillRect(x - 0.6, base - alt * 0.25, 1.2, alt * 0.25);
    ctx.fillStyle = cor;
    for (let k = 0; k < 3; k++) {
      const y = base - alt * 0.2 - k * alt * 0.25; const l = alt * (0.32 - k * 0.07);
      ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x, y - alt * 0.38); ctx.lineTo(x + l, y); ctx.fill();
      if (comNeve) { ctx.fillStyle = '#eef6ff'; ctx.beginPath(); ctx.moveTo(x - l * 0.45, y - alt * 0.2); ctx.lineTo(x, y - alt * 0.38); ctx.lineTo(x + l * 0.45, y - alt * 0.2); ctx.fill(); ctx.fillStyle = cor; }
    }
  }

  function cenarioCima(t) {
    const g = ctx.createLinearGradient(0, 0, 0, CEU);
    g.addColorStop(0, cena.ceu[0]); g.addColorStop(1, cena.ceu[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, pe.LARGURA, CEU + 2);
    const desl = calmo ? 0 : t * 1.2;
    if (r.lugar === 'gelo') {
      // estrelas piscando, aurora e lua
      for (const [x, y, rr, f0] of ESTRELAS_CEU) {
        ctx.globalAlpha = calmo ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + f0));
        ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      for (const [cor, y0, fase] of [['rgba(90,255,180,', 7, 0], ['rgba(140,120,255,', 10, 1.8], ['rgba(255,120,200,', 13, 3.1]]) {
        const ga = ctx.createLinearGradient(0, y0 - 5, 0, y0 + 6);
        ga.addColorStop(0, `${cor}0)`); ga.addColorStop(0.5, `${cor}.38)`); ga.addColorStop(1, `${cor}0)`);
        ctx.fillStyle = ga;
        ctx.beginPath();
        for (let x = 0; x <= 100; x += 4) ctx.lineTo(x, y0 + Math.sin(x * 0.08 + t * 0.5 + fase) * 3 - 5);
        for (let x = 100; x >= 0; x -= 4) ctx.lineTo(x, y0 + Math.sin(x * 0.08 + t * 0.5 + fase) * 3 + 5);
        ctx.fill();
      }
      ctx.restore();
      const lx = 82; const ly = 7;
      const halo = ctx.createRadialGradient(lx, ly, 2, lx, ly, 10);
      halo.addColorStop(0, 'rgba(255,250,210,.55)'); halo.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(lx, ly, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(lx, ly, 4.2, 0, 7); ctx.fill();
      ctx.fillStyle = cena.ceu[0]; ctx.beginPath(); ctx.arc(lx + 2, ly - 1.2, 3.6, 0, 7); ctx.fill();
      // montanhas de neve
      ctx.fillStyle = '#5a6aa8';
      ctx.beginPath(); ctx.moveTo(0, CEU); ctx.lineTo(12, CEU - 13); ctx.lineTo(22, CEU - 6); ctx.lineTo(34, CEU - 15); ctx.lineTo(50, CEU); ctx.fill();
      ctx.fillStyle = '#4a5898';
      ctx.beginPath(); ctx.moveTo(48, CEU); ctx.lineTo(64, CEU - 10); ctx.lineTo(74, CEU - 4); ctx.lineTo(90, CEU - 14); ctx.lineTo(100, CEU - 8); ctx.lineTo(100, CEU); ctx.fill();
      ctx.fillStyle = '#eaf2ff';
      for (const [x, y, l] of [[12, CEU - 13, 3], [34, CEU - 15, 3.4], [64, CEU - 10, 2.4], [90, CEU - 14, 3]]) { ctx.beginPath(); ctx.moveTo(x - l, y + l * 0.9); ctx.lineTo(x, y); ctx.lineTo(x + l, y + l * 0.9); ctx.lineTo(x + l * 0.3, y + l * 0.6); ctx.lineTo(x - l * 0.2, y + l); ctx.fill(); }
      pinheiroC(4, CEU, 10, '#1f4f5a', true); pinheiroC(96, CEU, 11, '#1f4f5a', true); pinheiroC(44, CEU, 7, '#245a66', true);
      return;
    }
    if (r.lugar === 'rio') {
      sol(14, 7);
      nuvemC(((40 + desl) % 130) - 15, 8, 0.75);
      // morros de longe e as margens com pinheiros
      ctx.fillStyle = '#9fc9e0';
      ctx.beginPath(); ctx.moveTo(0, CEU); ctx.lineTo(20, CEU - 14); ctx.lineTo(36, CEU - 6); ctx.lineTo(55, CEU - 16); ctx.lineTo(78, CEU - 5); ctx.lineTo(100, CEU - 12); ctx.lineTo(100, CEU); ctx.fill();
      ctx.fillStyle = '#eef7ff';
      for (const [x, y] of [[20, CEU - 14], [55, CEU - 16]]) { ctx.beginPath(); ctx.moveTo(x - 3, y + 3); ctx.lineTo(x, y); ctx.lineTo(x + 3, y + 3); ctx.fill(); }
      ctx.fillStyle = '#6cc35e';
      ctx.beginPath(); ctx.moveTo(0, CEU); ctx.quadraticCurveTo(12, CEU - 5, 26, CEU - 1); ctx.lineTo(26, CEU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(74, CEU); ctx.quadraticCurveTo(88, CEU - 6, 100, CEU - 3); ctx.lineTo(100, CEU); ctx.fill();
      for (const [x, a, c] of [[4, 12, '#2f8f52'], [10, 9, '#3aa15c'], [18, 7, '#2f8f52'], [80, 8, '#3aa15c'], [88, 13, '#2f8f52'], [95, 10, '#3aa15c']]) pinheiroC(x, CEU - 1, a, c);
      return;
    }
    if (r.lugar === 'mar') {
      sol(80, 8);
      nuvemC(((10 + desl) % 130) - 15, 6, 0.8); nuvemC(((70 + desl * 0.6) % 130) - 15, 12, 0.55);
      // gaivota
      if (!calmo) {
        const gx = ((t * 6) % 130) - 15; const gy = 10 + Math.sin(t * 0.8) * 2; const asa = Math.sin(t * 7) * 1.2;
        ctx.strokeStyle = '#4a5066'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(gx - 2.4, gy - asa); ctx.quadraticCurveTo(gx - 1, gy - 1.2, gx, gy); ctx.quadraticCurveTo(gx + 1, gy - 1.2, gx + 2.4, gy - asa); ctx.stroke();
      }
      // ilha com coqueiro ao longe e areia na direita
      ctx.fillStyle = '#f5dc9c';
      ctx.beginPath(); ctx.moveTo(70, CEU); ctx.quadraticCurveTo(86, CEU - 4, 100, CEU - 5); ctx.lineTo(100, CEU); ctx.fill();
      ctx.strokeStyle = '#a0703f'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(92, CEU - 4); ctx.quadraticCurveTo(91, CEU - 11, 94, CEU - 17); ctx.stroke();
      ctx.fillStyle = '#2fb66a';
      for (const a of [-2.6, -1.9, -1.2, -0.5, 0.3]) { ctx.save(); ctx.translate(94, CEU - 17); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(4, 0, 4.4, 1.1, 0.25, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#7fb4e8'; ctx.beginPath(); ctx.moveTo(4, CEU); ctx.quadraticCurveTo(12, CEU - 4, 22, CEU); ctx.fill();
      return;
    }
    sol(84, 7);
    nuvemC(((10 + desl) % 130) - 15, 7, 0.9);
    nuvemC(((60 + desl * 0.7) % 130) - 15, 12, 0.65);
    ctx.fillStyle = '#7fcf6a';
    ctx.beginPath(); ctx.moveTo(0, CEU); ctx.quadraticCurveTo(14, CEU - 9, 30, CEU - 1); ctx.quadraticCurveTo(44, CEU - 6, 56, CEU); ctx.lineTo(0, CEU); ctx.fill();
    ctx.fillStyle = '#5bb85a';
    ctx.beginPath(); ctx.moveTo(60, CEU); ctx.quadraticCurveTo(78, CEU - 8, 100, CEU - 3); ctx.lineTo(100, CEU); ctx.fill();
    // taboas na margem
    for (const [x, a] of [[6, 7], [8.5, 9], [11, 6], [94, 8], [96.5, 6]]) {
      ctx.strokeStyle = '#3f9e4a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, CEU); ctx.lineTo(x + 0.4, CEU - a); ctx.stroke();
      ctx.fillStyle = '#8a5a36'; ctx.beginPath(); ctx.ellipse(x + 0.4, CEU - a + 1.4, 0.6, 1.5, 0, 0, 7); ctx.fill();
    }
  }

  function agua(t) {
    ctx.beginPath();
    ctx.moveTo(0, onda(0, t));
    for (let x = 2; x <= pe.LARGURA; x += 2) ctx.lineTo(x, onda(x, t));
    ctx.lineTo(pe.LARGURA, ALTURA); ctx.lineTo(0, ALTURA); ctx.closePath();
    const g = ctx.createLinearGradient(0, CEU, 0, ALTURA);
    const [a, b, c, d] = cena.agua;
    g.addColorStop(0, a); g.addColorStop(0.35, b); g.addColorStop(0.75, c); g.addColorStop(1, d);
    ctx.fillStyle = g; ctx.fill();
    if (r.lugar !== 'gelo') {
      // raios de luz
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = '#fff';
      for (let k = 0; k < 4; k++) {
        const x0 = 12 + k * 26 + (calmo ? 0 : Math.sin(t * 0.4 + k) * 3);
        ctx.beginPath(); ctx.moveTo(x0, CEU); ctx.lineTo(x0 + 7, CEU); ctx.lineTo(x0 - 6, CEU + 85); ctx.lineTo(x0 - 18, CEU + 85); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.5; ctx.lineCap = 'round';
      for (let k = 0; k < 7; k++) {
        const x = (k * 15 + (calmo ? 0 : t * 3)) % 104 - 2;
        ctx.beginPath(); ctx.moveTo(x, onda(x, t) + 1.6); ctx.lineTo(x + 3.5, onda(x + 3.5, t) + 1.6); ctx.stroke();
      }
    } else {
      // a lua refletida, bem fraquinha
      const gl = ctx.createLinearGradient(0, CEU, 0, CEU + 60);
      gl.addColorStop(0, 'rgba(255,250,210,.12)'); gl.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.moveTo(77, CEU + 3); ctx.lineTo(87, CEU + 3); ctx.lineTo(96, CEU + 60); ctx.lineTo(68, CEU + 60); ctx.fill();
    }
    if (r.lugar === 'rio') {
      // correnteza: risquinhos indo para a direita, mais rápidos perto do fundo
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
      for (let k = 0; k < 14; k++) {
        const y = CEU + 8 + ((k * 23) % 98);
        const v = 8 + (y - CEU) * 0.16 * (f.corr / 8);
        const x = ((k * 41 + (calmo ? 0 : t * v)) % 116) - 8;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 3, y - 0.8, x + 6, y); ctx.stroke();
      }
    }
  }

  function fundo(t) {
    const yA = CEU + pe.FUNDO;
    ctx.lineCap = 'round';
    if (r.lugar === 'mar') {
      // corais
      for (const [x, cor] of CORAIS) {
        ctx.strokeStyle = cor; ctx.lineWidth = 1.6;
        const bal = calmo ? 0 : Math.sin(t + x) * 0.6;
        ctx.beginPath(); ctx.moveTo(x, yA + 1); ctx.lineTo(x + bal, yA - 9);
        ctx.moveTo(x, yA - 3); ctx.lineTo(x - 3 + bal, yA - 8); ctx.moveTo(x + bal * 0.5, yA - 5); ctx.lineTo(x + 3.4 + bal, yA - 10);
        ctx.moveTo(x - 3 + bal, yA - 8); ctx.lineTo(x - 4 + bal, yA - 11); ctx.stroke();
      }
    } else {
      const plantas = r.lugar === 'gelo' ? PLANTAS.filter((_, k) => k % 2) : PLANTAS;
      for (const [x, alt, cor, gr] of plantas) {
        ctx.strokeStyle = r.lugar === 'gelo' ? '#1f5a6a' : r.lugar === 'rio' ? cor.replace('#2e9e4f', '#3a8f5a') : cor; ctx.lineWidth = gr;
        ctx.beginPath(); ctx.moveTo(x, yA + 1);
        const n = 5;
        for (let k = 1; k <= n; k++) {
          const fk = k / n;
          const bal = calmo ? 0 : Math.sin(t * 1.3 + x * 0.3 + fk * 2) * 2.6 * fk + (r.lugar === 'rio' ? fk * 2.5 : 0);
          ctx.lineTo(x + bal + Math.sin(fk * 5 + x) * 1.2, yA + 1 - alt * fk * (r.lugar === 'gelo' ? 0.7 : 1));
        }
        ctx.stroke();
      }
    }
    ctx.fillStyle = cena.areia[0];
    ctx.beginPath(); ctx.moveTo(0, yA);
    for (let x = 0; x <= pe.LARGURA; x += 5) ctx.lineTo(x, yA + Math.sin(x * 0.21) * 1.2);
    ctx.lineTo(pe.LARGURA, ALTURA); ctx.lineTo(0, ALTURA); ctx.fill();
    ctx.fillStyle = cena.areia[1];
    for (let x = 3; x < 100; x += 7) { ctx.beginPath(); ctx.arc(x, yA + 3 + (x % 3), 0.45, 0, 7); ctx.fill(); }
    const pedras = r.lugar === 'rio' ? [...PEDRAS, [30, 3, '#9aa1ad'], [72, 3.8, '#868d99']] : PEDRAS;
    for (const [x, rr, cor] of pedras) { ctx.fillStyle = r.lugar === 'gelo' ? '#3a4466' : cor; ctx.beginPath(); ctx.ellipse(x, yA + 0.6, rr, rr * 0.62, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(x - rr * 0.3, yA - rr * 0.25, rr * 0.35, rr * 0.18, 0, 0, 7); ctx.fill(); }
    if (r.lugar === 'gelo') {
      // cristais de gelo brilhando no fundo
      for (const [x, h] of [[24, 5], [26.5, 3.4], [62, 4.4], [84, 6], [86.4, 3.6]]) {
        ctx.fillStyle = 'rgba(160,220,255,.75)'; ctx.beginPath(); ctx.moveTo(x - 1, yA + 1); ctx.lineTo(x, yA - h); ctx.lineTo(x + 1, yA + 1); ctx.fill();
      }
      return;
    }
    // estrela-do-mar (e uma concha no mar)
    ctx.save(); ctx.translate(74, yA + 1.4); ctx.rotate(0.3); ctx.fillStyle = '#ff7a59';
    ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2; const rr = k % 2 ? 1 : 2.4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); ctx.restore();
    if (r.lugar === 'mar') { ctx.fillStyle = '#ffb3c7'; ctx.beginPath(); ctx.moveTo(38, yA + 1.5); ctx.lineTo(35.6, yA - 1.2); ctx.quadraticCurveTo(38, yA - 3.6, 40.4, yA - 1.2); ctx.closePath(); ctx.fill(); }
  }

  function gelo() {
    // camada de gelo por cima da água, com os buracos
    const buracos = f.buracos;
    const topo = CEU - 1.4; const base = CEU + 3.2;
    ctx.save();
    const g = ctx.createLinearGradient(0, topo, 0, base);
    g.addColorStop(0, '#f4fbff'); g.addColorStop(0.45, '#cfe6fb'); g.addColorStop(1, '#8fb8e6');
    ctx.fillStyle = g;
    let x0 = 0;
    for (const b of [...buracos, 120]) {
      const fim = b > 100 ? 100 : b - 4;
      if (fim > x0) { ctx.beginPath(); ctx.roundRect(x0, topo, fim - x0, base - topo, 1.2); ctx.fill(); }
      x0 = b + 4;
    }
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.35;
    for (const x of [6, 23, 44, 57, 77, 96]) { ctx.beginPath(); ctx.moveTo(x, topo + 0.8); ctx.lineTo(x + 2.4, topo + 2.2); ctx.lineTo(x + 1.4, base - 0.4); ctx.stroke(); }
    // neve fofinha em cima
    ctx.fillStyle = '#ffffff';
    x0 = 0;
    for (const b of [...buracos, 120]) {
      const fim = b > 100 ? 100 : b - 4;
      for (let x = x0 + 1.5; x < fim - 1; x += 3) { ctx.beginPath(); ctx.arc(x, topo + 0.2, 1.5, Math.PI, 0); ctx.fill(); }
      x0 = b + 4;
    }
    // buracos: um brilho azul na beira
    for (const b of buracos) {
      ctx.fillStyle = 'rgba(120,200,255,.35)'; ctx.beginPath(); ctx.ellipse(b, CEU + 0.6, 4, 1, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function peixe(b, t, preso = false) {
    const ti = pe.todos(b.tipo);
    const tam = ti.tam;
    const dir = b.vx >= 0 ? 1 : -1;
    const alfa = pe.brilho(b);
    if (alfa <= 0.02 && !preso) {
      // sumido: só umas bolinhas de luz onde ele está
      ctx.fillStyle = 'rgba(160,240,255,.35)';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 3 + k * 2) * 2, CEU + b.y + Math.cos(t * 2 + k) * 1.4, 0.35, 0, 7); ctx.fill(); }
      return;
    }
    ctx.save();
    ctx.globalAlpha = preso ? 1 : alfa;
    ctx.translate(b.x, CEU + b.y);
    if (preso && !ti.rei) { ctx.rotate(-Math.PI / 2 + Math.sin(t * 18) * 0.35); } else { ctx.scale(dir, 1); if (preso) ctx.rotate(Math.sin(t * 10) * 0.25 - 0.3); }
    if (ti.raro || b.pisca || r.lugar === 'gelo') { // brilho
      const cor = b.pisca ? '160,240,255' : r.lugar === 'gelo' && !ti.raro ? '150,200,255' : '255,240,150';
      const gl = ctx.createRadialGradient(0, 0, 1, 0, 0, tam * (b.pisca || ti.raro ? 2.3 : 1.6));
      gl.addColorStop(0, `rgba(${cor},${b.pisca || ti.raro ? 0.6 : 0.28})`); gl.addColorStop(1, `rgba(${cor},0)`);
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, tam * 2.3, 0, 7); ctx.fill();
    }
    const alto = b.tipo === 'roxo' ? 0.85 : ti.rei ? 0.66 : 0.58;
    const rabo = Math.sin(t * 10 + b.fase) * 0.3;
    const cor1 = b.pisca ? '#9ff6ff' : ti.cor; const cor2 = b.pisca ? '#2bb3d6' : ti.cor2;
    ctx.fillStyle = cor2;
    ctx.beginPath(); ctx.moveTo(-tam * 0.8, 0); ctx.lineTo(-tam * 1.55, -tam * (0.5 + rabo)); ctx.lineTo(-tam * 1.4, 0); ctx.lineTo(-tam * 1.55, tam * (0.5 - rabo)); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-tam * 0.3, -tam * alto * 0.85); ctx.quadraticCurveTo(tam * 0.1, -tam * (alto + 0.45), tam * 0.4, -tam * alto * 0.8); ctx.fill();
    const g = ctx.createLinearGradient(0, -tam * alto, 0, tam * alto);
    g.addColorStop(0, cor1); g.addColorStop(1, b.tipo === 'listrado' && !b.pisca ? '#ff5a1f' : cor2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, tam, tam * alto, 0, 0, 7); ctx.fill();
    if (b.tipo === 'listrado' || ti.rei) {
      ctx.save(); ctx.clip();
      ctx.fillStyle = ti.rei ? 'rgba(255,255,255,.28)' : '#fff'; ctx.strokeStyle = ti.rei ? 'transparent' : '#2b2b2b'; ctx.lineWidth = 0.25;
      for (const xs of ti.rei ? [-0.6, -0.2, 0.2] : [-0.45, 0.25]) { ctx.beginPath(); ctx.ellipse(tam * xs, 0, tam * 0.12, tam, 0, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    if (b.tipo === 'rosa' || b.tipo === 'roxo' || ti.rei) { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (const [px, py] of [[-0.3, 0.1], [0.05, 0.3], [-0.1, -0.2]]) { ctx.beginPath(); ctx.arc(tam * px, tam * py, tam * 0.11, 0, 7); ctx.fill(); } }
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(tam * 0.05, -tam * alto * 0.4, tam * 0.55, tam * alto * 0.25, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tam * 0.55, -tam * 0.12, tam * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#1b1b2a'; ctx.beginPath(); ctx.arc(tam * 0.6, -tam * 0.12, tam * 0.11, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tam * 0.63, -tam * 0.16, tam * 0.04, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.arc(tam * 0.86, tam * 0.08, tam * 0.1, 0.3, 1.6); ctx.stroke();
    if (ti.rei) { // coroa e bigodes
      ctx.fillStyle = '#ffc61a'; ctx.strokeStyle = '#c98a00'; ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(-tam * 0.05, -tam * alto * 0.92); ctx.lineTo(-tam * 0.1, -tam * alto * 1.55); ctx.lineTo(tam * 0.12, -tam * alto * 1.2); ctx.lineTo(tam * 0.28, -tam * alto * 1.7); ctx.lineTo(tam * 0.42, -tam * alto * 1.2); ctx.lineTo(tam * 0.62, -tam * alto * 1.5); ctx.lineTo(tam * 0.56, -tam * alto * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4b5f'; ctx.beginPath(); ctx.arc(tam * 0.28, -tam * alto * 1.05, tam * 0.06, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1f4f80'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(tam * 0.9, tam * 0.15); ctx.quadraticCurveTo(tam * 1.2, tam * 0.5, tam * 1.05, tam * 0.75); ctx.stroke();
    }
    if ((ti.raro || b.pisca) && !calmo) {
      ctx.fillStyle = b.pisca ? '#e0fdff' : '#fffbe0';
      for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; const rr = tam * 1.5; ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.6, 0.45 + 0.25 * Math.sin(t * 6 + k), 0, 7); ctx.fill(); }
    }
    ctx.restore();
    if (b.susto > 0 && !preso) { // fugindo: "!"
      ctx.save(); ctx.font = '900 5px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 0.8; ctx.strokeStyle = '#fff'; ctx.strokeText('!', b.x, CEU + b.y - tam - 1); ctx.fillStyle = '#e5484d'; ctx.fillText('!', b.x, CEU + b.y - tam - 1); ctx.restore();
    } else if (b.arisco && !preso && !calmo) { // gotinha de nervoso
      ctx.fillStyle = 'rgba(200,240,255,.85)'; ctx.beginPath(); ctx.arc(b.x - dir * tam * 0.2, CEU + b.y - tam * 0.75, 0.45, 0, 7); ctx.fill();
    }
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
      ctx.fillStyle = '#5fd17a'; ctx.beginPath(); ctx.ellipse(-2.2, -4.6, 1.4, 0.5, -0.4, 0, 7); ctx.fill();
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

  function aguaViva(a, t) {
    ctx.save();
    ctx.translate(a.x, CEU + a.y);
    const pulso = calmo ? 1 : 1 + Math.sin(t * 3 + a.fase) * 0.08;
    const choque = a.choque > 0;
    // tentáculos ondulando
    ctx.strokeStyle = choque ? 'rgba(255,250,150,.95)' : 'rgba(255,170,220,.8)'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath(); ctx.moveTo(k * 1.1, 0.6);
      for (let s = 1; s <= 4; s++) ctx.lineTo(k * 1.1 + Math.sin(t * 4 + s + k) * 0.7, 0.6 + s * 1.6);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(-0.8, -1.6, 0.4, 0, -0.6, 4.2);
    g.addColorStop(0, choque ? '#fffbd0' : 'rgba(255,220,240,.95)'); g.addColorStop(1, choque ? 'rgba(255,230,90,.85)' : 'rgba(240,110,190,.7)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 3.6 * pulso, 3.2 / pulso, 0, Math.PI, 0); ctx.quadraticCurveTo(0, 1.6, -3.6 * pulso, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-1.2, -1.6, 0.9, 0.5, -0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a2a5a'; ctx.beginPath(); ctx.arc(-1, -0.6, 0.28, 0, 7); ctx.arc(1, -0.6, 0.28, 0, 7); ctx.fill();
    if (choque && !calmo) { // raiozinhos
      ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 0.4;
      for (let k = 0; k < 4; k++) { const ang = k * 1.57 + t * 9; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 4.2, Math.sin(ang) * 4.2); ctx.lineTo(Math.cos(ang + 0.3) * 6, Math.sin(ang + 0.3) * 6); ctx.stroke(); }
    }
    ctx.restore();
  }

  function tubarao(tb, t) {
    if (tb.x < -24 || tb.x > 124) return;
    const dir = tb.vx >= 0 ? 1 : -1;
    const ataque = tb.modo === 'ataque';
    ctx.save();
    ctx.translate(tb.x, CEU + tb.y);
    ctx.scale(dir, 1);
    ctx.rotate(Math.sin(t * (ataque ? 9 : 3)) * 0.04);
    const rabo = Math.sin(t * (ataque ? 14 : 5)) * 1.2;
    ctx.fillStyle = '#6f8196';
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-14, -4.4 + rabo); ctx.lineTo(-12.6, 0); ctx.lineTo(-14, 3.6 + rabo); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, -3.2); ctx.lineTo(-0.6, -8); ctx.lineTo(3, -3); ctx.fill(); // barbatana
    const g = ctx.createLinearGradient(0, -4, 0, 4);
    g.addColorStop(0, '#8ea2b8'); g.addColorStop(0.55, '#7488a0'); g.addColorStop(0.56, '#e8eef5'); g.addColorStop(1, '#d4dde8');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(10, 0.4); ctx.quadraticCurveTo(8, -4, 0, -3.8); ctx.quadraticCurveTo(-7, -3.4, -10, 0); ctx.quadraticCurveTo(-6, 3.4, 0, 3.4); ctx.quadraticCurveTo(7, 3.4, 10, 0.4); ctx.fill();
    ctx.fillStyle = '#5f7088'; ctx.beginPath(); ctx.moveTo(1, 2); ctx.lineTo(-2.4, 5.4); ctx.lineTo(-1.4, 2.2); ctx.fill();
    ctx.strokeStyle = 'rgba(60,70,90,.5)'; ctx.lineWidth = 0.25; for (const x of [3.4, 4.4, 5.4]) { ctx.beginPath(); ctx.moveTo(x, -1.2); ctx.lineTo(x - 0.4, 0.8); ctx.stroke(); }
    ctx.fillStyle = '#1b1b2a'; ctx.beginPath(); ctx.arc(6.6, -1.2, 0.55, 0, 7); ctx.fill();
    if (ataque) { // olhar bravo e dentes
      ctx.strokeStyle = '#1b1b2a'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(5.6, -2.4); ctx.lineTo(7.6, -1.8); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(6, 1); ctx.lineTo(9.6, 0.8); ctx.lineTo(9, 1.6); ctx.lineTo(6.4, 1.8); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(6.4, 1.8); ctx.lineTo(9, 1.6); ctx.lineTo(8, 2.2); ctx.fill();
    } else { ctx.strokeStyle = '#3a4458'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.arc(7.8, 1.2, 1, 0.2, 1.4); ctx.stroke(); }
    ctx.restore();
  }

  function barco(t) {
    const noGelo = r.lugar === 'gelo';
    const bx = noGelo ? r.barco - 7 : r.barco - 9; // a vara fica à frente da menina
    const by = noGelo ? CEU - 1.4 : onda(bx, t) + (calmo ? 0 : Math.sin(t * 2) * 0.3);
    const incl = noGelo || calmo ? 0 : Math.sin(t * 1.6) * 0.03;
    const pontaX = r.barco; const pontaY = noGelo ? by - 9 : by - 15;
    const hx = pe.xDoAnzol(r);
    const yAnzol = CEU + r.anzol;
    // linha (com a correnteza, ela fica torta)
    ctx.strokeStyle = r.lugar === 'gelo' ? 'rgba(220,240,255,.95)' : 'rgba(255,255,255,.95)'; ctx.lineWidth = 0.28;
    ctx.beginPath(); ctx.moveTo(pontaX, pontaY); ctx.lineTo(r.barco, CEU);
    ctx.quadraticCurveTo(r.barco + (hx - r.barco) * 0.2, CEU + r.anzol * 0.6, hx, yAnzol); ctx.stroke();
    if (r.anzol > 2 && !noGelo) { ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(r.barco, onda(r.barco, t) - 0.3, 0.9, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r.barco, onda(r.barco, t) - 0.3, 0.9, 0, Math.PI); ctx.fill(); }
    // brilho da isca dourada
    if (r.isca > 0) {
      const gi = ctx.createRadialGradient(hx, yAnzol + 3, 0.5, hx, yAnzol + 3, 9 + (calmo ? 0 : Math.sin(t * 6) * 1.5));
      gi.addColorStop(0, 'rgba(255,230,90,.75)'); gi.addColorStop(1, 'rgba(255,230,90,0)');
      ctx.fillStyle = gi; ctx.beginPath(); ctx.arc(hx, yAnzol + 3, 11, 0, 7); ctx.fill();
      if (!calmo) { ctx.fillStyle = '#fffbe0'; for (let k = 0; k < 4; k++) { const a = t * 3 + k * 1.57; ctx.beginPath(); ctx.arc(hx + Math.cos(a) * 5, yAnzol + 3 + Math.sin(a) * 3, 0.45, 0, 7); ctx.fill(); } }
    } else if (noGelo && r.anzol > 3) { // luzinha do anzol no escuro
      const gl = ctx.createRadialGradient(hx, yAnzol + 3, 0.3, hx, yAnzol + 3, 7);
      gl.addColorStop(0, 'rgba(180,240,255,.55)'); gl.addColorStop(1, 'rgba(180,240,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hx, yAnzol + 3, 7, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = '#d8dde6'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx, yAnzol); ctx.lineTo(hx, yAnzol + 2); ctx.arc(hx - 1, yAnzol + 2, 1, 0, Math.PI * 0.9); ctx.stroke();
    if (!r.preso) { ctx.strokeStyle = r.isca > 0 ? '#ffd23a' : '#ff8fa3'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(hx - 1.6, yAnzol + 2.4); ctx.quadraticCurveTo(hx - 2.4, yAnzol + 3.6 + Math.sin(t * 8) * 0.4, hx - 1.2, yAnzol + 4.2); ctx.stroke(); }

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(incl);
    if (noGelo) {
      // banquinho no gelo, balde e a menina pescando no buraco
      ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(1, -6); ctx.quadraticCurveTo(4, -9, 7, -9); ctx.stroke();
      ctx.fillStyle = '#8a5a36'; ctx.fillRect(-3.4, -4.2, 6.8, 1); ctx.fillRect(-3, -3.4, 0.8, 3.4); ctx.fillRect(2.2, -3.4, 0.8, 3.4);
      if (menina.complete && menina.naturalWidth) ctx.drawImage(menina, -9, -19.5, 18, 18);
      ctx.fillStyle = '#3e8bff'; ctx.beginPath(); ctx.moveTo(-8.6, -3.4); ctx.lineTo(-5, -3.4); ctx.lineTo(-5.4, 0); ctx.lineTo(-8.2, 0); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-8.8, -3.8, 4, 0.6);
      ctx.restore();
      return;
    }
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(1, -6); ctx.quadraticCurveTo(5, -12, 9, -15); ctx.stroke();
    if (menina.complete && menina.naturalWidth) ctx.drawImage(menina, -11, -22.5, 21, 21);
    const cores = r.lugar === 'rio' ? ['#c98a4a', '#8a5a2a', '#f3d9a8'] : r.lugar === 'mar' ? ['#ffffff', '#c8d8ec', '#3e8bff'] : ['#ff7a59', '#c0392b', '#fff6e0'];
    const g = ctx.createLinearGradient(0, -5, 0, 3);
    g.addColorStop(0, cores[0]); g.addColorStop(1, cores[1]);
    ctx.fillStyle = g;
    if (r.lugar === 'rio') { // canoa comprida
      ctx.beginPath(); ctx.moveTo(-14, -5.4); ctx.quadraticCurveTo(0, -3.6, 14, -5.4); ctx.quadraticCurveTo(10, 2.8, 0, 2.8); ctx.quadraticCurveTo(-10, 2.8, -14, -5.4); ctx.fill();
      ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-13, -4.6); ctx.quadraticCurveTo(0, -2.8, 13, -4.6); ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(12, -5); ctx.quadraticCurveTo(10, 2.5, 6, 3); ctx.lineTo(-7, 3); ctx.quadraticCurveTo(-11, 2.5, -12, -5); ctx.fill();
    ctx.fillStyle = cores[2]; ctx.fillRect(-12, -5.6, 24, 1.3);
    ctx.fillStyle = r.lugar === 'mar' ? '#3e8bff' : 'rgba(255,255,255,.85)';
    if (r.lugar === 'mar') { ctx.fillRect(-11, -1.6, 22, 0.9); } else for (const x of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(x, -1.6, 0.9, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function efeitos(dt, t) {
    if (!calmo && r.lugar !== 'gelo' && Math.random() < dt * 2.5) {
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
    // neve caindo no Mar Gelado
    if (r.lugar === 'gelo' && !calmo) {
      if (neve.length < 34 && Math.random() < dt * 14) neve.push({ x: Math.random() * 104, y: -2, v: 2 + Math.random() * 3, f: Math.random() * 6, r: 0.25 + Math.random() * 0.4 });
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const n of neve) { n.y += n.v * dt; n.f += dt; ctx.beginPath(); ctx.arc(n.x + Math.sin(n.f) * 1.4, n.y, n.r, 0, 7); ctx.fill(); }
      neve = neve.filter((n) => n.y < CEU - 1);
    }
    // redes jogadas
    for (const rd of redes) {
      rd.v -= dt;
      const p = 1 - rd.v / 0.9;
      const raio = pe.RAIO_REDE * Math.min(1, p * 2.2);
      ctx.save();
      ctx.globalAlpha = Math.min(1, rd.v * 2);
      ctx.beginPath(); ctx.arc(rd.x, CEU + rd.y, raio, 0, 7); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.3;
      for (let k = -pe.RAIO_REDE; k <= pe.RAIO_REDE; k += 2.6) {
        ctx.beginPath(); ctx.moveTo(rd.x + k - 20, CEU + rd.y - 20); ctx.lineTo(rd.x + k + 20, CEU + rd.y + 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rd.x + k + 20, CEU + rd.y - 20); ctx.lineTo(rd.x + k - 20, CEU + rd.y + 20); ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = Math.min(1, rd.v * 2);
      ctx.strokeStyle = '#ffb03d'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(rd.x, CEU + rd.y, raio, 0, 7); ctx.stroke();
      ctx.fillStyle = '#ffd34d'; for (let k = 0; k < 8; k++) { const a = k * 0.785 + t; ctx.beginPath(); ctx.arc(rd.x + Math.cos(a) * raio, CEU + rd.y + Math.sin(a) * raio, 0.7, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    redes = redes.filter((rd) => rd.v > 0);
    for (const p of respingos) { p.vy += 40 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.v -= dt; }
    respingos = respingos.filter((p) => p.v > 0);
    for (const p of respingos) { ctx.fillStyle = p.cor ?? 'rgba(220,245,255,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, 0.5, 0, 7); ctx.fill(); }
    for (const x of textos) { x.y -= 8 * dt; x.v -= dt; }
    textos = textos.filter((x) => x.v > 0);
    ctx.textAlign = 'center'; ctx.font = '800 5px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    for (const x of textos) {
      ctx.globalAlpha = Math.min(1, x.v * 1.5);
      ctx.lineJoin = 'round'; ctx.lineWidth = 0.9; ctx.strokeStyle = x.cor === '#ffffff' ? '#1659b8' : '#5a2a00'; ctx.strokeText(x.txt, x.x, x.y);
      ctx.fillStyle = x.cor; ctx.fillText(x.txt, x.x, x.y);
      ctx.globalAlpha = 1;
    }
  }

  function desenhar(t, dt) {
    medir();
    ctx.save();
    if (tremor > 0 && !calmo) { ctx.translate(Math.sin(t * 60) * tremor * 0.8, 0); tremor = Math.max(0, tremor - dt * 2); }
    ctx.clearRect(-2, 0, pe.LARGURA + 4, ALTURA);
    cenarioCima(t);
    agua(t);
    fundo(t);
    for (const a of r.aguas) aguaViva(a, t);
    for (const b of r.bichos) bicho(b, t, false);
    if (r.tubarao) tubarao(r.tubarao, t);
    if (r.preso) bicho(r.preso, t, true);
    if (r.lugar === 'gelo') gelo();
    barco(t);
    efeitos(dt, t);
    ctx.restore();
  }

  function escreverDisputa() {
    if (!r.disputa) { disputaEl.hidden = true; return; }
    disputaEl.hidden = false;
    disputaEl.innerHTML = `<b>👑 Toque rápido para puxar!</b><span class="pesc-cabo"><span style="width:${Math.max(0, Math.min(100, r.disputa.p * 100))}%"></span></span>`;
  }

  // ---------- laço ----------
  let laco = 0;
  function quadro(agora, meu) {
    if (meu !== laco || !viva() || !document.body.contains(canvas)) return; // a tela saiu: o laço para
    const dt = tAnterior ? Math.min(0.1, (agora - tAnterior) / 1000) : 0;
    tAnterior = agora;
    relogio += dt;
    if (r.comecou && !r.acabou) {
      if (teclas.esq) r.alvo = Math.max(5, r.alvo - pe.VEL_BARCO * dt);
      if (teclas.dir) r.alvo = Math.min(pe.LARGURA - 5, r.alvo + pe.VEL_BARCO * dt);
      const antes = Math.ceil(r.restante); const iscaAntes = Math.ceil(r.isca * 4);
      for (const ev of pe.passo(r, dt)) tratar(ev);
      if (Math.ceil(r.restante) !== antes || r.acabou) escreverHud();
      if (Math.ceil(r.isca * 4) !== iscaAntes) desenharBonus();
      if (r.disputa || !disputaEl.hidden) escreverDisputa();
      if (!r.acabou && relogio - ultimoSalvo > 2) { ultimoSalvo = relogio; ctl.salvar(r); }
    }
    desenhar(relogio, dt);
    requestAnimationFrame((a) => quadro(a, meu));
  }

  function respingar(x, y, cor) { for (let k = 0; k < 10; k++) respingos.push({ x, y, vx: (Math.random() - 0.5) * 24, vy: -12 - Math.random() * 10, v: 0.6, cor }); }

  function tratar(ev) {
    if (ev.tipo === 'fisgou') {
      const ti = pe.todos(ev.bicho.tipo);
      ctl.som(ti.lixo ? 'erro' : 'acerto');
      if (ti.rei) { ctl.status('O Peixe-Rei está puxando! Toque rápido, várias vezes! 👑', 'voce'); fazerMenina('uau'); escreverDisputa(); }
      if (navigator.vibrate && !ti.lixo) try { navigator.vibrate(20); } catch { /* nada */ }
    } else if (ev.tipo === 'pescou') {
      const pts = ev.pontos;
      const ti = pe.todos(ev.bicho.tipo);
      ctl.som(pts < 0 ? 'quebra' : ti.raro ? 'premio' : 'moeda');
      const x = ev.rede ? ev.bicho.x : Math.min(92, r.barco + 5);
      textos.push({ txt: `${pts > 0 ? '+' : ''}${pts}`, x, y: ev.rede ? CEU + ev.bicho.y : CEU - 10, v: 1.3, cor: pts < 0 ? '#ff6b6b' : ti.raro ? '#ffe14d' : '#ffffff' });
      if (!ev.rede) respingar(r.barco, CEU);
      const seq = r.meta.tipo === 'limpa' && !ti.lixo && r.seguidos > 1 ? ` · ${r.seguidos} seguidos!` : r.meta.tipo === 'limpa' && ti.lixo ? ' · a sequência zerou' : '';
      ctl.status(`${NOMES_PESCOU[ev.bicho.tipo] ?? 'Pescou!'} ${pts > 0 ? '+' : ''}${pts}${seq}`, pts < 0 ? 'derrota' : 'voce');
      if (ti.raro) { fazerMenina('uau'); setTimeout(() => { if (r && !r.acabou) fazerMenina('feliz'); }, 1500); }
      disputaEl.hidden = true;
      escreverHud();
      if (!r.acabou) ctl.salvar(r);
    } else if (ev.tipo === 'fugiu') {
      // o peixe arisco foge: só um aviso de vez em quando
      if (Math.random() < 0.3) ctl.status('Ele fugiu! Desça o anzol bem em cima do peixe.', '');
    } else if (ev.tipo === 'soltou') {
      ctl.som('erro'); tremor = 1;
      ctl.status('Bzzz! A água-viva deu choque e o peixe escapou. Desvie a linha delas!', 'derrota');
      textos.push({ txt: 'Bzzz!', x: ev.agua.x, y: CEU + ev.agua.y - 4, v: 1, cor: '#ffe14d' });
    } else if (ev.tipo === 'tubarao') {
      ctl.som('xeque');
      ctl.status('🦈 O tubarão vem aí! Segure o dedo para puxar mais rápido!', 'derrota');
    } else if (ev.tipo === 'roubou') {
      ctl.som('quebra'); tremor = 1.2;
      ctl.status('Nhac! O tubarão roubou o peixe. Na próxima, segure o dedo para subir rápido!', 'derrota');
      respingar(r.tubarao?.x ?? 50, CEU + (r.tubarao?.y ?? 60), 'rgba(255,255,255,.8)');
    } else if (ev.tipo === 'escapou') {
      ctl.som('erro'); fazerMenina('feliz');
      ctl.status('O Peixe-Rei escapou! Quando fisgar de novo, toque bem rápido.', 'derrota');
      disputaEl.hidden = true;
    } else if (ev.tipo === 'puxao') {
      tremor = 0.8;
      if (navigator.vibrate) try { navigator.vibrate(40); } catch { /* nada */ }
    } else if (ev.tipo === 'isca') {
      ctl.som('premio');
      ctl.status('🪱 Isca dourada! Os peixes raros estão vindo para o anzol!', 'voce');
      desenharBonus();
    } else if (ev.tipo === 'rede') {
      ctl.som('captura');
      redes.push({ x: ev.x, y: ev.y, v: 0.9 });
      respingar(ev.x, CEU, 'rgba(255,220,120,.9)');
      ctl.status(`🥅 A rede pegou ${ev.quantos} ${ev.quantos === 1 ? 'peixe' : 'peixes'}!`, 'voce');
    } else if (ev.tipo === 'tempo') {
      ctl.som('item');
      textos.push({ txt: `+${ev.mais}s`, x: 16, y: 14, v: 1.4, cor: '#ffffff' });
      ctl.status(`⏱️ Mais ${ev.mais} segundos!`, 'voce');
    } else if (ev.tipo === 'fim') terminar();
  }

  function terminar() {
    aviso.hidden = true; disputaEl.hidden = true;
    const venceu = r.venceu;
    const est = pe.estrelas(r.restante, r.tempo, venceu);
    const antes = pe.progresso(prefs.historico).melhor[f.n]?.estrelas ?? 0;
    escreverHud();
    fazerMenina(venceu ? 'uau' : 'feliz');
    const a = pe.andamento(r);
    const cartao = el('div', 'faixa-fim pesc-fim', `<div>
      <strong>${venceu ? `Fase ${f.n} concluída!` : 'O tempo acabou!'}</strong>
      <span class="estrelas-fim">${[1, 2, 3].map((k) => `<i class="${k <= est ? 'ok' : ''}" style="animation-delay:${k * 0.18}s">★</i>`).join('')}</span>
      <small>${pe.textoMeta(r.meta)}${venceu ? ` · sobraram ${Math.ceil(r.restante)} s` : r.meta.tipo === 'rei' ? '' : ` · fez ${a.feito} de ${a.alvo}`}</small>
    </div>`);
    cartao.style.pointerEvents = 'auto';
    let moedas = 0;
    if (venceu) {
      moedas = pe.moedasGanhas(antes, est);
      if (moedas) { prefs.carteira.moedas = (prefs.carteira.moedas ?? 0) + moedas; }
      const ganhos = pe.sortearPremios(est);
      for (const g of ganhos) estoque()[g]++;
      guardar();
      if (moedas) cartao.firstChild.append(el('span', 'pesc-moedas', `+${moedas} 🪙`));
      else if (antes) cartao.firstChild.append(el('small', 'pesc-sem-moedas', antes >= 3 ? 'Você já tinha as 3 estrelas aqui' : `Faça mais de ${antes} ${antes === 1 ? 'estrela' : 'estrelas'} para ganhar moedas`));
      cartao.firstChild.append(el('small', 'premio-bonus', `Você ganhou: ${ganhos.map((g) => { const b = pe.BONUS.find((x) => x.id === g); return `${b.icone} ${b.nome}`; }).join(' · ')}`));
    } else {
      cartao.firstChild.append(el('small', 'pesc-dica', r.meta.tipo === 'rei' ? 'Dica: quando o Peixe-Rei puxar, toque bem rápido!' : 'Dica: use os bônus embaixo do lago!'));
    }
    const proxima = Math.min(pe.TOTAL_FASES, f.n + 1);
    const b = el('button', 'botao', venceu ? (f.n < pe.TOTAL_FASES ? 'Próxima fase ›' : 'Jogar de novo') : 'Tentar de novo');
    b.onclick = () => { ctl.som('clique'); iniciar(null, venceu ? proxima : f.n); };
    const bm = el('button', 'botao secundario', '🗺️ Mapa');
    bm.onclick = () => { ctl.som('clique'); mostrarMapa(venceu ? proxima : f.n); };
    const linha = el('div', 'fim-botoes'); linha.append(bm, b);
    if (venceu && f.n === pe.TOTAL_FASES) cartao.firstChild.append(el('small', 'premio-bonus', '🏆 Você pescou em todos os lugares!'));
    cartao.firstChild.append(linha);
    const texto = venceu ? `Fase ${f.n} concluída com ${est} estrela${est > 1 ? 's' : ''}!${moedas ? ` +${moedas} moedas` : ''}` : `O tempo acabou. ${r.meta.tipo === 'rei' ? 'O Peixe-Rei ficou no lago' : `Faltaram ${a.alvo - a.feito}`}: tente de novo!`;
    ctl.fim(venceu ? 'vitoria' : 'derrota', texto, null, { nivel: f.n, estrelas: est, pontos: r.pontos });
    palco.append(cartao);
    desenharFases();
    desenharBonus();
  }

  // ---------- controles ----------
  const xDoDedo = (ev) => { const b = canvas.getBoundingClientRect(); return Math.min(pe.LARGURA - 5, Math.max(5, ((ev.clientX - b.left) / b.width) * pe.LARGURA)); };
  function comecar() {
    if (!r || r.acabou) return false;
    if (!r.comecou) { r.comecou = true; aviso.hidden = true; ctl.status(`${pe.textoMeta(r.meta)}! 🎣`, 'voce'); escreverHud(); }
    return true;
  }
  function apertar(ev) {
    ev.preventDefault();
    if (!comecar()) return;
    if (r.disputa) { pe.puxar(r); escreverDisputa(); respingar(pe.xDoAnzol(r), CEU, 'rgba(255,255,255,.8)'); }
    else r.alvo = xDoDedo(ev);
    r.segurando = true;
  }
  canvas.addEventListener('pointerdown', (ev) => { try { canvas.setPointerCapture(ev.pointerId); } catch { /* nada */ } apertar(ev); });
  aviso.addEventListener('pointerdown', apertar);
  disputaEl.addEventListener('pointerdown', apertar);
  canvas.addEventListener('pointermove', (ev) => { if (r?.segurando && !r.disputa) r.alvo = xDoDedo(ev); });
  const soltar = () => { if (r) r.segurando = false; };
  for (const alvo of [canvas, aviso, disputaEl]) { alvo.addEventListener('pointerup', soltar); alvo.addEventListener('pointercancel', soltar); }
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  window.addEventListener('blur', soltar);

  const aoTeclar = (baixo) => (ev) => {
    if (!document.body.contains(canvas)) { document.removeEventListener('keydown', teclaDesce); document.removeEventListener('keyup', teclaSobe); return; }
    if (noMapa || !r || ev.target.closest?.('input, textarea, select, button, summary')) return;
    const k = ev.key;
    if (k === ' ' || k === 'ArrowDown') {
      ev.preventDefault();
      if (baixo && !ev.repeat) { if (!comecar()) return; if (r.disputa) { pe.puxar(r); escreverDisputa(); } }
      r.segurando = baixo;
    } else if (k === 'ArrowLeft') { ev.preventDefault(); teclas.esq = baixo; if (baixo) comecar(); }
    else if (k === 'ArrowRight') { ev.preventDefault(); teclas.dir = baixo; if (baixo) comecar(); }
  };
  const teclaDesce = aoTeclar(true); const teclaSobe = aoTeclar(false);
  document.addEventListener('keydown', teclaDesce);
  document.addEventListener('keyup', teclaSobe);

  // ---------- Mapa das fases ----------
  // Um caminho que sobe: fase 1 embaixo (Lagoa) e o Mar Gelado lá no alto. Fases passadas mostram as estrelas
  // (tocando dá para jogar de novo e melhorar); a fase da vez fica com a personagem; as outras, trancadas.
  const ESPACO = 92; const BORDA = 70;
  const posicao = (n) => ({ x: 50 + Math.sin(n * 0.95) * 30, y: (pe.TOTAL_FASES - n) * ESPACO + BORDA });
  function salvoBom() {
    const s = ctl.salvo();
    if (s && !pe.salvoValido(s)) { ctl.apagar(); return null; } // pescaria de uma versão antiga: fica de fora
    return s;
  }
  function mostrarMapa(foco = null) {
    noMapa = true; laco++;
    palco.querySelectorAll('.faixa-fim').forEach((x) => x.remove());
    for (const e of telaJogo) e.hidden = true;
    mapa.hidden = false;
    const p = pe.progresso(prefs.historico);
    const salvo = salvoBom();
    const atual = foco ?? (salvo ? salvo.fase : p.liberada);
    const total = pe.TOTAL_FASES; const porLugar = pe.POR_LUGAR;
    const altura = (total - 1) * ESPACO + BORDA * 2;
    const pontos = Array.from({ length: total }, (_, k) => posicao(k + 1));
    const regioes = pe.LUGARES.map((l, k) => {
      const topo = (total - (k + 1) * porLugar) * ESPACO + BORDA - ESPACO / 2;
      const alto = porLugar * ESPACO;
      return `<div class="mapa-regiao pesc-regiao-${l.id}" style="top:${Math.max(0, topo)}px;height:${alto + (k === 0 ? BORDA : 0) + (k === pe.LUGARES.length - 1 ? BORDA : 0)}px;--c1:${l.cor[1]};--c2:${l.cor[0]}"></div>`;
    }).join('');
    let semente = 11;
    const sorte = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
    const enfeites = [];
    for (let n = 1; n <= total; n++) {
      const k = Math.min(CENARIOS.length - 1, Math.floor((n - 1) / porLugar));
      const c = CENARIOS[k];
      const q = posicao(n + 0.5);
      const lado = q.x > 50 ? -1 : 1;
      const x = Math.min(86, Math.max(14, q.x + lado * (30 + sorte() * 12)));
      const tam = 56 + sorte() * 26;
      const peca = c.pecas[Math.floor(sorte() * c.pecas.length)]();
      if (n % porLugar !== 0) enfeites.push(`<span class="mapa-deco${sorte() < 0.35 ? ' balanca' : ''}" style="left:${x}%;top:${q.y - tam / 2}px;width:${tam}px;animation-delay:${(-sorte() * 3).toFixed(2)}s">${peca}</span>`);
      if (n % 2) { const [c1, c2] = c.peixes[n % c.peixes.length]; enfeites.push(`<span class="mapa-enfeite pesc-pula" style="left:${Math.min(92, Math.max(8, q.x - lado * 34))}%;top:${posicao(n).y - 20}px;animation-delay:${(-sorte() * 3).toFixed(2)}s">${peixinho(c1, c2)}</span>`); }
      if (n % 3 === 0) enfeites.push(`<span class="mapa-brilho" style="left:${(8 + sorte() * 84).toFixed(1)}%;top:${(posicao(n).y + sorte() * 60 - 30).toFixed(0)}px;animation-delay:${(-sorte() * 2).toFixed(2)}s">${c.noite ? floco() : estrelinha()}</span>`);
      if (n % 5 === 2 && !c.noite) enfeites.push(`<span class="mapa-nuvem" style="top:${posicao(n).y - 40}px;animation-duration:${(26 + sorte() * 20).toFixed(0)}s;animation-delay:${(-sorte() * 40).toFixed(1)}s">${nuvem()}</span>`);
    }
    enfeites.push(`<span class="pesc-lua" style="top:${BORDA - 50}px">${lua()}</span>`);
    pe.LUGARES.forEach((l, k) => {
      const n = k * porLugar + 1; const q = posicao(n); const ant = posicao(Math.max(1, n - 1));
      const meioX = k ? (q.x + ant.x) / 2 : q.x; const meioY = k ? (q.y + ant.y) / 2 : q.y + 60;
      enfeites.push(`<span class="mapa-placa-lugar" style="left:${meioX > 50 ? 23 : 77}%;top:${meioY + 22}px">${placa(l.nome, l.icone, CENARIOS[k].placa)}</span>`);
    });
    const nos = pontos.map((q, k) => {
      const n = k + 1; const m = p.melhor[n];
      const estado = n > p.liberada ? 'trancada' : n === atual ? 'atual' : m?.estrelas ? 'feita' : 'aberta';
      const est = m?.estrelas ?? 0;
      const andamento = salvo && salvo.fase === n;
      return `<button class="mapa-fase ${estado}${n % porLugar === 0 ? ' chefe' : ''}" data-fase="${n}" style="left:${q.x}%;top:${q.y}px" aria-label="Fase ${n}${n % porLugar === 0 ? ', Peixe-Rei' : ''}${estado === 'trancada' ? ', trancada' : `, ${est} estrela${est === 1 ? '' : 's'}`}">
        ${estado === 'trancada' ? '🔒' : `<b>${n}</b>`}
        ${n % porLugar === 0 && estado !== 'trancada' ? '<span class="pesc-coroa">👑</span>' : ''}
        ${estado !== 'trancada' ? `<span class="mapa-estrelas">${[1, 2, 3].map((e) => `<i class="${e <= est ? 'ok' : ''}">★</i>`).join('')}</span>` : ''}
        ${andamento ? '<span class="mapa-andamento">▶</span>' : ''}
        ${n === atual ? `<span class="mapa-eu">${retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso: 'feliz' })}</span>` : ''}
      </button>`;
    }).join('');
    const moedas = prefs.carteira?.moedas ?? 0;
    mapa.innerHTML = `
      <div class="mapa-topo"><span>⭐ <b>${p.estrelas}</b> / ${p.maxEstrelas}</span><span>🪙 <b>${moedas.toLocaleString('pt-BR')}</b></span><span>Fase <b>${p.liberada}</b> de ${total}</span></div>
      <div class="mapa-rolagem"><div class="mapa-caminho" style="height:${altura}px">
        ${regioes}${enfeites.join('')}
        <svg class="mapa-trilha"></svg>
        ${nos}
      </div></div>
      <div class="mapa-detalhe" hidden></div>`;
    const svgT = mapa.querySelector('.mapa-trilha');
    const largura = mapa.querySelector('.mapa-caminho').clientWidth || 360;
    const px = pontos.map((q) => [q.x / 100 * largura, q.y]);
    const curva = (lista) => lista.map(([x, y], k) => {
      if (!k) return `M${x.toFixed(1)} ${y}`;
      const [x0, y0] = lista[k - 1]; const my = (y0 + y) / 2;
      return `C${x0.toFixed(1)} ${my} ${x.toFixed(1)} ${my} ${x.toFixed(1)} ${y}`;
    }).join(' ');
    svgT.setAttribute('viewBox', `0 0 ${largura} ${altura}`);
    svgT.innerHTML = `<path d="${curva(px)}" class="fundo"/><path d="${curva(px.slice(0, p.liberada))}" class="feito"/><path d="${curva(px)}" class="pontilhado"/>`;
    const rolagem = mapa.querySelector('.mapa-rolagem');
    const alvo = posicao(atual).y;
    requestAnimationFrame(() => { rolagem.scrollTop = alvo - rolagem.clientHeight / 2; });
    mapa.querySelectorAll('[data-fase]').forEach((b) => { b.onclick = () => escolherFase(Number(b.dataset.fase), p, salvo); });
    ctl.status(p.liberada === 1 && !p.melhor[1] ? 'Toque na fase 1 para começar a pescar!' : 'Escolha uma fase. Nas que você já passou, dá para jogar de novo e ganhar mais estrelas.', 'voce');
  }

  function escolherFase(n, p, salvo) {
    const caixa = mapa.querySelector('.mapa-detalhe');
    if (n > p.liberada) { ctl.som('erro'); ctl.status(`Passe a fase ${p.liberada} para abrir esta.`, ''); return; }
    ctl.som('clique');
    const fz = pe.fase(n); const m = p.melhor[n]; const est = m?.estrelas ?? 0;
    const lugar = pe.lugarDa(n);
    const andamento = salvo && salvo.fase === n;
    const k = (n - 1) % pe.POR_LUGAR;
    const dica = fz.meta.tipo === 'rei' ? 'Fisgou o Peixe-Rei? Toque bem rápido, várias vezes, para puxar!' : k < 2 || k === 5 ? lugar.dica : '';
    caixa.innerHTML = `<div class="mapa-cartao pesc-cartao">
      <button class="botao-icone fechar" aria-label="Fechar">✕</button>
      <small>${lugar.icone} ${lugar.nome}</small>
      <strong>Fase ${n}</strong>
      <span class="estrelas-fim">${'★'.repeat(est)}${'☆'.repeat(3 - est)}</span>
      <p class="pesc-meta-grande">${ICONE_META[fz.meta.tipo]} <b>${pe.textoMeta(fz.meta)}</b></p>
      <p>⏱ ${fz.tempo} segundos · ★★★ se sobrarem ${Math.ceil(fz.tempo * pe.LIMITES_ESTRELA[1])} s</p>
      ${dica ? `<p class="pesc-dica">💡 ${dica}</p>` : ''}
      ${!m?.estrelas ? `<p class="recorde">Vencendo: até <b>${30}</b> 🪙</p>` : est < 3 ? `<p class="recorde">Cada estrela nova: <b>+5</b> 🪙</p>` : ''}
      ${andamento ? '<button class="botao" data-continuar>▶ Continuar de onde parou</button><button class="botao secundario" data-jogar>Começar de novo</button>' : `<button class="botao" data-jogar>${m?.estrelas ? 'Jogar de novo' : 'Jogar'}</button>`}
    </div>`;
    caixa.hidden = false;
    caixa.querySelector('.fechar').onclick = () => { ctl.som('clique'); caixa.hidden = true; };
    caixa.onclick = (e) => { if (e.target === caixa) caixa.hidden = true; };
    caixa.querySelector('[data-continuar]')?.addEventListener('click', () => { ctl.som('clique'); iniciar(salvo); });
    caixa.querySelector('[data-jogar]').onclick = () => { ctl.som('clique'); iniciar(null, n); };
  }

  function iniciar(salvo, n) {
    noMapa = false;
    mapa.hidden = true;
    for (const e of telaJogo) e.hidden = false;
    palco.querySelectorAll('.faixa-fim').forEach((x) => x.remove());
    const bom = salvo && pe.salvoValido(salvo);
    if (bom) r = { ...salvo, comecou: false, segurando: false };
    else { r = pe.novaRodada(n ?? nivelLiberado()); ctl.apagar(); }
    f = pe.fase(r.fase); cena = CENA[r.lugar];
    palco.dataset.lugar = r.lugar;
    bolhas = []; respingos = []; textos = []; redes = []; neve = []; teclas = { esq: false, dir: false }; tremor = 0;
    humor = ''; fazerMenina('feliz');
    aviso.hidden = false; disputaEl.hidden = true;
    const lugar = pe.lugarDa(f.n);
    aviso.innerHTML = bom
      ? '<div><b>Toque para continuar</b><span>a pescaria estava pela metade</span></div>'
      : `<div><small>${lugar.icone} ${lugar.nome} · Fase ${f.n}</small><b>${pe.textoMeta(r.meta)}</b><span>Segure para descer o anzol, solte para subir</span></div>`;
    ctl.status(bom ? 'Pescaria retomada' : `${pe.textoMeta(r.meta)} em ${r.tempo} segundos`, 'voce');
    escreverHud(); desenharFases(); desenharBonus();
    if (!bom) ctl.salvar(r);
    viva = ctl.ativa();
    tAnterior = 0;
    larguraCss = 0;
    const meu = ++laco;
    requestAnimationFrame((a) => quadro(a, meu));
  }

  // Abre no mapa; "Nova partida" joga de novo a fase aberta (ou a próxima liberada, a partir do mapa).
  mostrarMapa();
  return { reiniciar: () => (noMapa || !f ? iniciar(null, nivelLiberado()) : iniciar(null, f.n)) };
}
