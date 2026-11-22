// Tela do Labirinto: jardim de cerca viva gerado na hora. A personagem sai da entrada e vai
// buscar o pirulito na saída, pegando moedinhas pelo caminho. Controle: arrastar o dedo,
// setas na tela ou teclado.
import { el, formatarTempo } from '../comum.js';
import { prefs } from '../dados.js';
import { retrato } from '../personagem.js';
import * as lb from '../labirinto.js';

export const INFO = {
  id: 'labirinto',
  nome: 'Labirinto',
  descricao: 'Ache o caminho até o docinho',
  solo: true,
  rotuloNivel: 'Tamanho do próximo labirinto',
  regras: [
    'Leve a menina da entrada (em cima, à esquerda) até o pirulito na saída (embaixo, à direita).',
    'Arraste o dedo pelo caminho e ela vai atrás, sem atravessar a cerca. Também dá para usar as setas da tela ou do teclado.',
    'Pegue as moedinhas pelo caminho: cada uma vale 10 pontos e, pegando todas, você ganha 3 estrelas.',
    'Ficou perdida? Toque em 💡 Dica para ver um pedacinho do caminho (soma 5 segundos no tempo).',
    'Cada labirinto é novo e sempre tem saída. O nível muda o tamanho: 8 × 8, 12 × 12 ou 16 × 16.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#f4e3b5"/><path d="M1.2 1.2h9.6v9.6M1.2 1.2v9.6h6.6M3.6 1.2v4.8h2.4M8.4 3.6v4.8H3.6M6 3.6h2.4" fill="none" stroke="#2f8a3e" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="2.4" cy="2.4" r=".8" fill="#ff4f81"/><circle cx="9.6" cy="9.6" r="1" fill="#ff9a1f"/><path d="M9.6 10.6v1" stroke="#fff" stroke-width=".4"/></svg>';

const PIRULITO = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 22 V38" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M20 22 V38" stroke="#d8cfc0" stroke-width="1" stroke-linecap="round"/><circle cx="20" cy="15" r="12" fill="#ff5c8a"/><path d="M20 15 m0 -3 a3 3 0 1 1 -3 3 a6 6 0 1 1 6 6 a9 9 0 1 1 -9 -9" fill="none" stroke="#ffd3e0" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="15" cy="9" rx="3" ry="2" fill="#fff" opacity=".6"/><path d="M14 23 l6 -3 6 3 -6 3z" fill="#ffd21f"/></svg>';
const MOEDA = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.6" fill="#f2a900"/><circle cx="10" cy="10" r="7" fill="#ffd34d"/><path d="M10 4.6 11.5 8 15 8.2 12.3 10.4 13.2 13.8 10 12 6.8 13.8 7.7 10.4 5 8.2 8.5 8Z" fill="#f7b500" stroke="#fff3c2" stroke-width=".6" stroke-linejoin="round"/><path d="M5.5 7 Q7 4.5 10 4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/></svg>';

// número pseudoaleatório fixo por casa, para as flores não mudarem de lugar a cada desenho
const ruido = (i, k = 0) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

function desenharLabirinto(jogo) {
  const n = jogo.lado; const T = 10;
  let segs = '';
  const flores = [];
  for (let i = 0; i < n * n; i++) {
    const x = (i % n) * T; const y = Math.floor(i / n) * T; const p = jogo.paredes[i];
    if (y === 0 && p & lb.N) segs += `M${x} ${y}h${T}`;
    if (x === 0 && p & lb.O && i !== 0) segs += `M${x} ${y}v${T}`;
    if (p & lb.L && i !== jogo.saida) segs += `M${x + T} ${y}v${T}`;
    if (p & lb.S) segs += `M${x} ${y + T}h${T}`;
    if (ruido(i) < 0.22 && p & (lb.L | lb.S)) {
      const lado = p & lb.L ? [x + T, y + T * (0.25 + ruido(i, 1) * 0.5)] : [x + T * (0.25 + ruido(i, 1) * 0.5), y + T];
      flores.push([...lado, ruido(i, 2)]);
    }
  }
  const W = n * T;
  const flor = ([x, y, r]) => {
    const cor = r < 0.33 ? '#ff7aa8' : r < 0.66 ? '#ffd84d' : '#ffffff';
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r=".75" cx="-.7" fill="${cor}"/><circle r=".75" cx=".7" fill="${cor}"/><circle r=".75" cy="-.7" fill="${cor}"/><circle r=".75" cy=".7" fill="${cor}"/><circle r=".55" fill="#f59e0b"/></g>`;
  };
  return `<svg class="labirinto-svg" viewBox="-2 -2 ${W + 4} ${W + 4}" aria-hidden="true">
    <defs>
      <pattern id="lab-grama" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="var(--lab-chao)"/>
        <circle cx="2" cy="3" r=".5" fill="var(--lab-pinta)"/><circle cx="7" cy="7.5" r=".45" fill="var(--lab-pinta)"/><circle cx="8" cy="2" r=".35" fill="var(--lab-pinta)"/><circle cx="3.5" cy="8" r=".35" fill="var(--lab-pinta)"/>
      </pattern>
      <linearGradient id="lab-folha" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fc35a"/><stop offset="1" stop-color="#2f8a3e"/></linearGradient>
      <filter id="lab-brilho" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter>
    </defs>
    <rect x="-2" y="-2" width="${W + 4}" height="${W + 4}" rx="4" fill="url(#lab-grama)"/>
    <path class="lab-entrada" d="M-2 0 h2 v${T} h-2z" fill="#ffe08a" opacity=".8"/>
    <path class="lab-entrada" d="M${W} ${W - T} h2 v${T} h-2z" fill="#ffb3c7" opacity=".9"/>
    <polyline class="lab-trilha" points="" fill="none"/>
    <g class="lab-dica"></g>
    <path d="${segs}" fill="none" stroke="#1d5a2a" stroke-width="3.6" stroke-linecap="round" transform="translate(.35 .55)" opacity=".45"/>
    <path d="${segs}" fill="none" stroke="url(#lab-folha)" stroke-width="3.2" stroke-linecap="round"/>
    <path d="${segs}" fill="none" stroke="#8be07c" stroke-width="1.2" stroke-linecap="round" stroke-dasharray=".01 2.3" opacity=".9"/>
    <path d="${segs}" fill="none" stroke="#1f6e30" stroke-width=".8" stroke-linecap="round" stroke-dasharray=".01 3.1" stroke-dashoffset="1.4" opacity=".6"/>
    ${flores.map(flor).join('')}
  </svg>`;
}

export function montar(area, ctl) {
  const topo = el('div', 'labirinto-topo');
  const info = el('div', 'labirinto-info');
  const bDica = el('button', 'labirinto-botao', '💡<span>Dica</span>');
  topo.append(info, bDica);
  const tabuleiro = el('div', 'labirinto-tabuleiro');
  tabuleiro.setAttribute('role', 'application');
  tabuleiro.setAttribute('aria-label', 'Labirinto. Arraste o dedo pelo caminho ou use as setas.');
  const setas = el('div', 'labirinto-setas');
  const ROTULOS = { cima: ['▲', 'Para cima'], esquerda: ['◀', 'Para a esquerda'], direita: ['▶', 'Para a direita'], baixo: ['▼', 'Para baixo'] };
  const botoesSeta = {};
  for (const [d, [simbolo, rotulo]] of Object.entries(ROTULOS)) {
    const b = el('button', `labirinto-seta seta-${d}`, simbolo);
    b.setAttribute('aria-label', rotulo);
    botoesSeta[d] = b;
    setas.append(b);
  }
  area.append(topo, tabuleiro, setas);

  let jogo; let acabou = false; let inicio = 0; let relogio = null;
  let eu; let moedasEl = new Map(); let trilhaEl; let dicaEl; let timerDica = null; let timerSalvar = null;
  let ultimoPasso = 0;

  const tempoAgora = () => jogo.tempo + (acabou || !inicio ? 0 : (Date.now() - inicio) / 1000);
  const salvar = () => { if (!acabou) ctl.salvar({ ...jogo, tempo: tempoAgora() }); };
  const salvarLogo = () => { clearTimeout(timerSalvar); timerSalvar = setTimeout(salvar, 400); };

  function escrever() {
    info.innerHTML = `<span>⏱ <b>${formatarTempo(Math.floor(tempoAgora()))}</b></span><span class="lab-moedinhas">${MOEDA}<b>${jogo.pegas.length}</b>/${jogo.moedas.length}</span>`;
  }

  const pos = (i) => ({ left: `${((i % jogo.lado) / jogo.lado) * 100}%`, top: `${(Math.floor(i / jogo.lado) / jogo.lado) * 100}%` });
  const centro = (i) => `${(i % jogo.lado) * 10 + 5},${Math.floor(i / jogo.lado) * 10 + 5}`;

  function desenhar() {
    tabuleiro.style.setProperty('--lado', jogo.lado);
    tabuleiro.innerHTML = desenharLabirinto(jogo);
    trilhaEl = tabuleiro.querySelector('.lab-trilha');
    dicaEl = tabuleiro.querySelector('.lab-dica');
    const camada = el('div', 'labirinto-camada');
    moedasEl = new Map();
    for (const m of jogo.moedas) {
      if (jogo.pegas.includes(m)) continue;
      const c = el('div', 'lab-moeda', MOEDA);
      Object.assign(c.style, pos(m));
      c.style.animationDelay = `${-ruido(m) * 2}s`;
      camada.append(c);
      moedasEl.set(m, c);
    }
    const doce = el('div', 'lab-doce', PIRULITO);
    Object.assign(doce.style, pos(jogo.saida));
    eu = el('div', 'lab-eu', retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso: 'feliz' }));
    camada.append(doce, eu);
    tabuleiro.append(camada);
    atualizar(false);
  }

  function atualizar(animar = true) {
    eu.classList.toggle('sem-animacao', !animar);
    Object.assign(eu.style, pos(jogo.pos));
    trilhaEl.setAttribute('points', jogo.trilha.map(centro).join(' '));
    escrever();
  }

  function aposPassos(passos) {
    if (!passos.length) return;
    if (!inicio) inicio = Date.now();
    limparDica();
    for (const r of passos) {
      if (r.moeda) {
        const m = jogo.pegas[jogo.pegas.length - 1];
        const c = moedasEl.get(m);
        if (c) { c.classList.add('pega'); setTimeout(() => c.remove(), 500); moedasEl.delete(m); }
        ctl.som('moeda');
      }
    }
    if (!passos.some((r) => r.moeda) && Date.now() - ultimoPasso > 70) { ctl.som('passo'); ultimoPasso = Date.now(); }
    atualizar();
    if (lb.chegou(jogo)) { vencer(); return; }
    const faltam = jogo.moedas.length - jogo.pegas.length;
    if (passos.some((r) => r.moeda)) ctl.status(faltam ? `Moedinha! Faltam ${faltam}` : 'Pegou todas as moedinhas! Agora o pirulito 🍭', 'voce');
    salvarLogo();
  }

  function andar(d) {
    if (acabou) return;
    const r = lb.mover(jogo, d);
    if (!r.ok) { eu.classList.remove('bate'); void eu.offsetWidth; eu.classList.add('bate'); return; }
    aposPassos([r]);
  }

  function vencer() {
    acabou = true;
    const tempo = Math.round(tempoAgora());
    jogo.tempo = tempo;
    clearInterval(relogio); clearTimeout(timerSalvar);
    escrever();
    const p = lb.pontos(jogo);
    const total = jogo.moedas.length;
    const estrelas = jogo.pegas.length === total ? 3 : jogo.pegas.length >= total / 2 ? 2 : 1;
    eu.innerHTML = retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso: 'uau' });
    tabuleiro.querySelector('.lab-doce')?.classList.add('pego');
    tabuleiro.classList.add('venceu');
    const moedasTxt = jogo.pegas.length ? ` e pegou ${jogo.pegas.length} ${jogo.pegas.length === 1 ? 'moedinha' : 'moedinhas'}` : '';
    ctl.fim('vitoria', `Achou o pirulito em ${formatarTempo(tempo)}${moedasTxt}! ${'★'.repeat(estrelas)}`, tabuleiro, { tempo, pontos: p, estrelas });
  }

  function limparDica() { clearTimeout(timerDica); if (dicaEl) dicaEl.innerHTML = ''; }

  bDica.onclick = () => {
    if (acabou) return;
    const trecho = lb.dica(jogo, Math.max(4, Math.round(jogo.lado / 2)));
    if (!trecho.length) return;
    if (!inicio) inicio = Date.now();
    jogo.dicas++;
    jogo.tempo += lb.MULTA_DICA;
    ctl.som('item');
    const pts = [jogo.pos, ...trecho].map(centro).join(' ');
    dicaEl.innerHTML = `<polyline points="${pts}" class="lab-dica-luz"/><polyline points="${pts}" class="lab-dica-linha"/>${trecho.map((c, k) => `<circle class="lab-dica-ponto" cx="${centro(c).split(',')[0]}" cy="${centro(c).split(',')[1]}" r="1.3" style="animation-delay:${k * 0.08}s"/>`).join('')}`;
    clearTimeout(timerDica);
    timerDica = setTimeout(limparDica, 3500);
    escrever();
    ctl.status(`Siga o caminho amarelo (+${lb.MULTA_DICA} s)`, 'voce');
    salvarLogo();
  };

  // ---------- arrastar o dedo ----------
  let arrastando = false;
  function casaDoDedo(ev) {
    const r = tabuleiro.querySelector('svg').getBoundingClientRect();
    // o desenho tem 2 unidades de margem em volta (viewBox -2 … W+2)
    const W = jogo.lado * 10; const esc = r.width / (W + 4);
    const x = (ev.clientX - r.left) / esc - 2; const y = (ev.clientY - r.top) / esc - 2;
    const cx = Math.floor(x / 10); const cy = Math.floor(y / 10);
    if (cx < 0 || cy < 0 || cx >= jogo.lado || cy >= jogo.lado) return -1;
    return cy * jogo.lado + cx;
  }
  tabuleiro.addEventListener('pointerdown', (ev) => {
    if (acabou) return;
    arrastando = true;
    try { tabuleiro.setPointerCapture(ev.pointerId); } catch { /* nada */ }
    const c = casaDoDedo(ev);
    if (c >= 0) aposPassos(lb.seguir(jogo, c, 3));
    ev.preventDefault();
  });
  tabuleiro.addEventListener('pointermove', (ev) => {
    if (!arrastando || acabou) return;
    const c = casaDoDedo(ev);
    if (c >= 0 && c !== jogo.pos) aposPassos(lb.seguir(jogo, c, 3));
  });
  const soltar = () => { arrastando = false; };
  tabuleiro.addEventListener('pointerup', soltar);
  tabuleiro.addEventListener('pointercancel', soltar);

  // ---------- setas (segurar repete) ----------
  for (const [d, b] of Object.entries(botoesSeta)) {
    let repetir = null;
    const parar = () => { clearInterval(repetir); repetir = null; };
    b.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      parar();
      andar(d);
      repetir = setInterval(() => andar(d), 150);
    });
    for (const t of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(t, parar);
    b.addEventListener('click', (ev) => { if (ev.detail === 0) andar(d); }); // teclado / leitor de tela
    b.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  const TECLAS = { ArrowUp: 'cima', ArrowDown: 'baixo', ArrowLeft: 'esquerda', ArrowRight: 'direita', w: 'cima', s: 'baixo', a: 'esquerda', d: 'direita', W: 'cima', S: 'baixo', A: 'esquerda', D: 'direita' };
  const aoTeclar = (ev) => {
    if (!document.body.contains(tabuleiro)) { document.removeEventListener('keydown', aoTeclar); return; }
    const d = TECLAS[ev.key];
    if (!d || ev.target.closest?.('input, textarea, select')) return;
    ev.preventDefault();
    andar(d);
  };
  document.addEventListener('keydown', aoTeclar);

  function iniciar(salvo) {
    acabou = false; inicio = 0;
    limparDica();
    tabuleiro.classList.remove('venceu');
    jogo = salvo?.paredes ? { ...salvo } : lb.novoJogo(ctl.nivel());
    clearInterval(relogio);
    relogio = setInterval(() => {
      if (!document.body.contains(tabuleiro)) { clearInterval(relogio); salvar(); return; }
      if (inicio && !acabou) escrever();
    }, 1000);
    desenhar();
    if (salvo?.paredes) ctl.status('Labirinto retomado: continue de onde parou', 'voce');
    else ctl.status(`${lb.NIVEIS[jogo.nivel]?.nome ?? 'Labirinto'}: leve a menina até o pirulito 🍭`, 'voce');
    if (!salvo) salvar();
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
