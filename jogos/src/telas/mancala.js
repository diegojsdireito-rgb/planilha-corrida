// Tela da Mancala (Kalah): tabuleiro de madeira em SVG e contas coloridas semeadas uma a uma.
import { el } from '../comum.js';
import * as mc from '../mancala.js';

export const INFO = {
  id: 'mancala',
  nome: 'Mancala',
  descricao: 'Semeie e capture',
  regras: [
    'Suas 6 casinhas são as de baixo, e seu depósito é o grande da direita. O robô fica em cima, com o depósito da esquerda.',
    'Toque numa casinha sua: as sementes saem dela e vão caindo uma em cada casa, no sentido anti-horário (para a direita embaixo, para a esquerda em cima). O depósito do robô é pulado.',
    'Se a última semente cair no seu depósito, você joga de novo.',
    'Se a última cair numa casinha sua que estava vazia, você captura as sementes da casinha da frente, junto com ela.',
    'Quando um lado fica sem sementes, o jogo acaba e cada um guarda as que sobraram do seu lado. Ganha quem tiver mais sementes no depósito.',
    'No difícil, o robô pensa várias jogadas à frente.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><defs><linearGradient id="mc-ic-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58a55"/><stop offset="1" stop-color="#8b5a3c"/></linearGradient></defs><rect width="12" height="12" rx="2" fill="#ffe9c7"/><rect x=".8" y="2.2" width="10.4" height="7.6" rx="3.8" fill="url(#mc-ic-m)"/><ellipse cx="2.3" cy="6" rx=".9" ry="2.6" fill="#5a3520"/><ellipse cx="9.7" cy="6" rx=".9" ry="2.6" fill="#5a3520"/><g fill="#6b4128"><circle cx="4.4" cy="4.3" r="1"/><circle cx="6" cy="4.3" r="1"/><circle cx="7.6" cy="4.3" r="1"/><circle cx="4.4" cy="7.7" r="1"/><circle cx="6" cy="7.7" r="1"/><circle cx="7.6" cy="7.7" r="1"/></g><circle cx="4.2" cy="7.5" r=".42" fill="#e5484d"/><circle cx="4.7" cy="7.9" r=".42" fill="#f2b100"/><circle cx="6" cy="4.2" r=".42" fill="#3e7bfa"/><circle cx="7.8" cy="7.6" r=".42" fill="#2f9e62"/><circle cx="2.2" cy="5.4" r=".42" fill="#8e5bd6"/><circle cx="2.4" cy="6.4" r=".42" fill="#ff7ab6"/><circle cx="9.6" cy="5.8" r=".42" fill="#f2b100"/></svg>';

const CORES = [['#ff8a8d', '#c62f34'], ['#ffe27a', '#d69500'], ['#7fe0a6', '#1f7d4b'], ['#9cc0ff', '#2457c9'], ['#d2b0ff', '#6c3fbf'], ['#ffc1de', '#d64f8f'], ['#9cf0ee', '#139c9c']];
const LARG = 400; const ALT = 236;
const COL0 = 56; const COLW = (LARG - 2 * COL0) / 6;
const LINHA = { 1: 70, 0: 166 };
const POCO = { rx: 21, ry: 34 };
const DEP = { rx: 22, ry: 84, cy: 118 };

// Centro de cada posição do tabuleiro.
function centro(i) {
  if (i === 6) return { cx: LARG - 28, cy: DEP.cy, dep: true };
  if (i === 13) return { cx: 28, cy: DEP.cy, dep: true };
  const k = i < 6 ? i : 12 - i;
  return { cx: COL0 + COLW * (k + 0.5), cy: LINHA[i < 6 ? 0 : 1] };
}

// Onde fica a k-ésima semente de uma casa: espiral que enche a casa e depois empilha.
function lugar(i, k) {
  const { cx, cy, dep } = centro(i);
  const cap = dep ? 30 : 9;
  const camada = Math.floor(k / cap);
  const q = k % cap;
  const r = Math.sqrt((q + 0.35) / cap);
  const a = q * 2.39996 + camada * 0.9 + i;
  const rx = (dep ? DEP.rx : POCO.rx) - 7; const ry = (dep ? DEP.ry : POCO.ry) - 7;
  return { x: cx + r * rx * Math.cos(a), y: cy + r * ry * Math.sin(a) - camada * 3 };
}

const DEFS = `<defs>
  <linearGradient id="mc-madeira" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cf9563"/><stop offset=".5" stop-color="#a86b40"/><stop offset="1" stop-color="#83502e"/></linearGradient>
  <pattern id="mc-veio" width="60" height="18" patternUnits="userSpaceOnUse"><path d="M0 9c15-6 30 6 45 0s15 0 15 0" fill="none" stroke="rgba(0,0,0,.09)" stroke-width="1.4"/><path d="M0 15c20-3 35 3 60-1" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/></pattern>
  <radialGradient id="mc-buraco" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#4a2a17"/><stop offset=".7" stop-color="#6b4128"/><stop offset="1" stop-color="#8f5c38"/></radialGradient>
  ${CORES.map(([c, e], n) => `<radialGradient id="mc-c${n}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="${c}"/><stop offset="1" stop-color="${e}"/></radialGradient>`).join('')}
</defs>`;

const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function montar(area, ctl) {
  const jogo = el('div', 'mc-jogo');
  const faixaRobo = el('div', 'mc-faixa');
  const caixa = el('div', 'mc-caixa');
  const faixaVoce = el('div', 'mc-faixa voce');
  jogo.append(faixaRobo, caixa, faixaVoce);
  area.append(jogo);

  let t; let vez; let cores; let acabou = false; let animando = false;
  let novas = new Set(); let mao = null; let brilho = new Set();

  const salvar = () => ctl.salvar({ t, vez });
  const sortearCor = () => Math.floor(Math.random() * CORES.length);
  const contar = (i) => cores[i].length;

  function desenhar() {
    const podeJogar = !acabou && !animando && vez === 0;
    const jogaveis = podeJogar ? new Set(mc.jogadas(t, 0)) : new Set();
    let s = `<svg viewBox="0 0 ${LARG} ${ALT}" role="group" aria-label="Tabuleiro da mancala">${DEFS}
      <rect x="2" y="6" width="${LARG - 4}" height="${ALT - 8}" rx="34" fill="rgba(0,0,0,.25)"/>
      <rect x="2" y="2" width="${LARG - 4}" height="${ALT - 8}" rx="34" fill="url(#mc-madeira)"/>
      <rect x="2" y="2" width="${LARG - 4}" height="${ALT - 8}" rx="34" fill="url(#mc-veio)"/>
      <rect x="6" y="6" width="${LARG - 12}" height="${ALT - 16}" rx="30" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.5"/>`;
    for (let i = 0; i < 14; i++) {
      const { cx, cy, dep } = centro(i);
      const rx = dep ? DEP.rx : POCO.rx; const ry = dep ? DEP.ry : POCO.ry;
      const minha = jogaveis.has(i);
      const atrib = i < 6 ? ` data-casa="${i}" role="button" tabindex="${minha ? 0 : -1}" aria-disabled="${!minha}" aria-label="Sua casinha ${i + 1}, ${contar(i)} ${contar(i) === 1 ? 'semente' : 'sementes'}"` : '';
      s += `<g class="mc-casa${minha ? ' pode' : ''}${brilho.has(i) ? ' brilha' : ''}"${atrib}>
        <ellipse cx="${cx}" cy="${cy + 1.5}" rx="${rx + 1.5}" ry="${ry + 1.5}" fill="rgba(255,255,255,.18)"/>
        <ellipse class="mc-fundo" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#mc-buraco)"/>
        <ellipse class="mc-aro" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none"/>
      </g>`;
    }
    // Sementes por cima de tudo (não roubam o toque das casinhas).
    s += '<g class="mc-sementes" pointer-events="none">';
    for (let i = 0; i < 14; i++) {
      cores[i].forEach((c, k) => {
        const { x, y } = lugar(i, k);
        const nova = novas.has(`${i}:${k}`);
        s += `<g class="mc-semente${nova ? ' cai' : ''}"><ellipse cx="${x + 0.8}" cy="${y + 2.2}" rx="5" ry="3.6" fill="rgba(0,0,0,.35)"/><circle cx="${x}" cy="${y}" r="5.3" fill="url(#mc-c${c})"/><ellipse cx="${x - 1.6}" cy="${y - 2}" rx="1.6" ry="1.1" fill="#fff" opacity=".8"/></g>`;
      });
    }
    s += '</g><g class="mc-numeros" pointer-events="none">';
    for (let i = 0; i < 14; i++) {
      if (i === 6 || i === 13) continue;
      const { cx, cy } = centro(i);
      const y = i < 6 ? cy + POCO.ry + 15 : cy - POCO.ry - 15;
      s += `<g class="mc-num${novas.size && [...novas].some((n) => n.startsWith(`${i}:`)) ? ' muda' : ''}"><rect x="${cx - 13}" y="${y - 10}" width="26" height="20" rx="10"/><text x="${cx}" y="${y + 5}" text-anchor="middle">${contar(i)}</text></g>`;
    }
    for (const i of [6, 13]) {
      const { cx } = centro(i);
      const y = i === 6 ? ALT - 21 : 19;
      s += `<g class="mc-num dep"><rect x="${cx - 17}" y="${y - 11}" width="34" height="22" rx="11"/><text x="${cx}" y="${y + 6}" text-anchor="middle">${contar(i)}</text></g>`;
    }
    if (mao) {
      const { cx, cy, dep } = centro(mao.i);
      const y = dep ? cy : (mao.i < 6 || mao.i === 6 ? cy - 4 : cy + 4);
      s += `<g class="mc-mao"><circle cx="${cx}" cy="${y}" r="15"/><text x="${cx}" y="${y + 5.5}" text-anchor="middle">${mao.n}</text></g>`;
    }
    s += '</g></svg>';
    caixa.innerHTML = s;
    caixa.classList.toggle('sua-vez', podeJogar);

    faixaRobo.innerHTML = `<span class="mc-quem"><span class="avatar robo">🤖</span>Robô</span><span class="mc-dep">depósito <b>${contar(13)}</b></span>`;
    faixaRobo.classList.toggle('pensando', vez === 1 && !acabou);
    faixaVoce.innerHTML = `<span class="mc-quem"><span class="avatar voce">🙂</span>Você</span><span class="mc-dep">depósito <b>${contar(6)}</b></span>`;
    faixaVoce.classList.toggle('ativa', vez === 0 && !acabou);
  }

  caixa.addEventListener('click', (ev) => {
    const g = ev.target.closest?.('[data-casa]');
    if (g) clicar(Number(g.dataset.casa));
  });
  caixa.addEventListener('keydown', (ev) => {
    const g = ev.target.closest?.('[data-casa]');
    if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); clicar(Number(g.dataset.casa)); }
  });

  // Semeia com animação: pega as sementes, solta uma em cada casa e mostra capturas.
  async function animar(j, casa) {
    const r = mc.semear(t, j, casa);
    const passo = reduzido() ? 60 : 210;
    animando = true;
    const pegas = cores[casa];
    cores[casa] = [];
    mao = { i: casa, n: pegas.length };
    novas = new Set();
    brilho = new Set([casa]);
    ctl.som('clique');
    desenhar();
    if (!await ctl.esperar(passo + 60)) return false;
    for (const i of r.caminho) {
      cores[i].push(pegas.shift());
      novas = new Set([`${i}:${cores[i].length - 1}`]);
      mao = pegas.length ? { i, n: pegas.length } : null;
      brilho = new Set([i]);
      ctl.som('passo');
      desenhar();
      if (!await ctl.esperar(passo)) return false;
    }
    mao = null;
    if (r.captura) {
      const { casa: c, frente } = r.captura;
      brilho = new Set([c, frente]);
      novas = new Set();
      desenhar();
      if (!await ctl.esperar(passo * 2)) return false;
      const dep = mc.deposito(j);
      const vindas = [...cores[frente], ...cores[c]];
      cores[frente] = []; cores[c] = [];
      novas = new Set(vindas.map((_, k) => `${dep}:${cores[dep].length + k}`));
      cores[dep].push(...vindas);
      brilho = new Set([dep]);
      ctl.som('captura');
      desenhar();
      if (!await ctl.esperar(passo * 2)) return false;
    }
    if (r.varrida) {
      novas = new Set();
      for (const k of [0, 1]) {
        const dep = mc.deposito(k);
        for (const c of mc.casasDe(k)) {
          for (const cor of cores[c]) { novas.add(`${dep}:${cores[dep].length}`); cores[dep].push(cor); }
          cores[c] = [];
        }
      }
      brilho = new Set([6, 13]);
      ctl.som('moeda');
      desenhar();
      if (!await ctl.esperar(passo * 2)) return false;
    }
    t = r.t;
    novas = new Set(); brilho = new Set();
    animando = false;
    return r;
  }

  function verificarFim() {
    const res = mc.resultado(t);
    if (!res) return false;
    acabou = true;
    desenhar();
    const [a, b] = res.pontos;
    const resultado = res.vencedor === 0 ? 'vitoria' : res.vencedor === 1 ? 'derrota' : 'empate';
    const frase = { vitoria: 'Você venceu! 🎉', derrota: 'O robô venceu 🤖', empate: 'Empate 🤝' }[resultado];
    ctl.fim(resultado, `${frase} Você ${a} × ${b} robô`, caixa, { nivel: ctl.nivel(), pontos: a });
    return true;
  }

  async function clicar(i) {
    if (acabou || animando || vez !== 0 || !t[i] || i > 5) return;
    const r = await animar(0, i);
    if (!r) return;
    if (!r.deNovo) vez = 1;
    salvar();
    if (verificarFim()) return;
    if (vez === 0) {
      desenhar();
      ctl.status('Caiu no seu depósito: jogue de novo! ⭐', 'voce');
      return;
    }
    if (r.captura) { ctl.status(`Você capturou ${r.captura.qtd} sementes! 🎉`, 'voce'); desenhar(); if (!await ctl.esperar(700)) return; }
    robo();
  }

  async function robo() {
    vez = 1;
    desenhar();
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(650)) return;
    const c = mc.jogadaRobo(t, 1, ctl.nivel());
    const r = await animar(1, c);
    if (!r) return;
    if (!r.deNovo) vez = 0;
    salvar();
    if (verificarFim()) return;
    if (vez === 1) {
      ctl.status('O robô caiu no depósito: joga de novo', 'robo');
      desenhar();
      if (!await ctl.esperar(600)) return;
      robo();
      return;
    }
    desenhar();
    ctl.status(r.captura ? `O robô capturou ${r.captura.qtd} sementes. Sua vez!` : 'Sua vez: toque numa casinha de baixo', 'voce');
  }

  function iniciar(salvo) {
    acabou = false; animando = false; mao = null; novas = new Set(); brilho = new Set();
    caixa.querySelectorAll('.faixa-fim').forEach((f) => f.remove());
    if (salvo?.t && !mc.acabou(salvo.t)) { t = salvo.t; vez = salvo.vez; } else { t = mc.novo(); vez = ctl.roboComeca() ? 1 : 0; }
    cores = t.map((n) => Array.from({ length: n }, sortearCor));
    desenhar();
    if (vez === 1) robo();
    else ctl.status(salvo?.t ? 'Partida retomada: sua vez' : 'Sua vez: toque numa casinha de baixo', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
