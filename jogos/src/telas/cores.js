// Tela das Cartas Coloridas: você contra 1 a 3 robôs.
import { el } from '../comum.js';
import * as cc from '../cores.js';

export const INFO = {
  id: 'cores',
  nome: 'Cartas Coloridas',
  descricao: 'Você contra 1 a 3 robôs',
  regras: [
    'Cada um começa com 7 cartas. Na sua vez, jogue uma carta da mesma cor ou do mesmo número (ou símbolo) da carta de cima da pilha.',
    'Sem jogada? Toque no monte para comprar uma carta. Se ela servir, você pode jogar na hora ou tocar em Passar.',
    'Cartas especiais: ➕2 o próximo compra 2 e perde a vez; ↷ Pula (a setinha que pula a bolinha) faz o próximo perder a vez; 🔁 Inverte muda o sentido do jogo (com só 2 jogadores, funciona como Pula).',
    '🌸 Coringa vale em cima de qualquer carta e você escolhe a nova cor. 🌸+4 é igual, e o próximo ainda compra 4 e perde a vez.',
    'Quando for ficar com uma carta só, toque em "Última!" (antes ou logo depois de jogar). Se esquecer, compra 2!',
    'Vence quem ficar sem cartas primeiro. No difícil, os robôs guardam os coringas e atacam quando você está quase ganhando.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><defs><linearGradient id="cc-ic1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fb8ff"/><stop offset="1" stop-color="#2f6fe0"/></linearGradient><linearGradient id="cc-ic2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a9c"/><stop offset="1" stop-color="#e63950"/></linearGradient></defs><rect width="12" height="12" rx="2" fill="#fff1d6"/><g transform="rotate(-14 4.6 7)"><rect x="1.8" y="2.6" width="5.2" height="7.6" rx="1.2" fill="url(#cc-ic1)" stroke="#fff" stroke-width=".35"/><path d="M4.4 5.2c.9 1.2 1.4 1.8 1.4 2.4a1.4 1.4 0 0 1-2.8 0c0-.6.5-1.2 1.4-2.4Z" fill="#fff"/></g><g transform="rotate(12 7.6 6.6)"><rect x="5" y="2.2" width="5.2" height="7.6" rx="1.2" fill="url(#cc-ic2)" stroke="#fff" stroke-width=".35"/><path d="M7.6 7.8C6.1 6.8 5.8 6 6.2 5.4c.4-.6 1.1-.4 1.4.1.3-.5 1-.7 1.4-.1.4.6.1 1.4-1.4 2.4Z" fill="#fff"/></g></svg>';

const NOMES_COR = { vermelho: 'Vermelho', amarelo: 'Amarelo', verde: 'Verde', azul: 'Azul' };
const PALETA = {
  vermelho: ['#ff8a9c', '#e63950', '#a81f36'],
  amarelo: ['#ffe07a', '#f5a300', '#a86b00'],
  verde: ['#7fe8ad', '#22a565', '#126b40'],
  azul: ['#7cc2ff', '#2f6fe0', '#1b4296'],
  coringa: ['#7a5cd6', '#3a2a7a', '#1f1547'],
};
const ROBOS = [
  { nome: 'Bipo', cor: '#3e7bfa' },
  { nome: 'Zuca', cor: '#2f9e62' },
  { nome: 'Lili', cor: '#d65bb0' },
];

// ---------- arte das cartas (caixa de 60 × 90) ----------
function icone(cor, x, y, s, fill = '#fff') {
  const g = (d) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">${d}</g>`;
  if (cor === 'vermelho') return g('<path d="M0 6C-7 1-8-3-6-5.5-4-8-1-7 0-4.5 1-7 4-8 6-5.5 8-3 7 1 0 6Z"/>');
  if (cor === 'amarelo') return g('<path d="M0-7 2 -2.4 7-2 3.2 1.2 4.4 6.2 0 3.6-4.4 6.2-3.2 1.2-7-2-2-2.4Z" stroke="' + fill + '" stroke-width="1.2" stroke-linejoin="round"/>');
  if (cor === 'verde') return g('<path d="M-5 6C-6-2-1-6 6-6 6 1 2 6-5 6Z"/><path d="M-5 6 2-1" stroke="rgba(0,0,0,.18)" stroke-width="1" fill="none"/>');
  if (cor === 'azul') return g('<path d="M0-7C3-2 5 1 5 3.2A5 5 0 0 1-5 3.2C-5 1-3-2 0-7Z"/>');
  return '';
}

function flor(x, y, s) {
  const p = [['vermelho', -90], ['amarelo', 0], ['verde', 90], ['azul', 180]];
  return `<g transform="translate(${x} ${y}) scale(${s})">${p.map(([c, a]) => `<ellipse cx="0" cy="-7" rx="5.4" ry="7" transform="rotate(${a + 45})" fill="${PALETA[c][1]}" stroke="#fff" stroke-width="1.2"/>`).join('')}<circle r="4.4" fill="#fff"/><circle r="2" fill="#ffd34a"/></g>`;
}

function simbolo(v, cor, x, y, s, tinta) {
  if (typeof v === 'number') return '';
  const t = (d) => `<g transform="translate(${x} ${y}) scale(${s})">${d}</g>`;
  if (v === 'mais2') return t(`<rect x="-7" y="-9" width="10" height="14" rx="2.4" fill="${tinta}" stroke="#fff" stroke-width="1.2" transform="rotate(-12)"/><rect x="-2" y="-6" width="10" height="14" rx="2.4" fill="${tinta}" stroke="#fff" stroke-width="1.2" transform="rotate(10)"/>`);
  if (v === 'pula') return t(`<path d="M-8 5 Q0-12 8 5" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round"/><path d="M4.6 1.6 8.4 5.6 9.6 0" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="0" cy="6" r="2.6" fill="${tinta}"/>`);
  if (v === 'inverte') return t(`<path d="M-7 -1A7 7 0 0 1 5-5" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round"/><path d="M2-8.6 6-5 2-1.8" fill="none" stroke="${tinta}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 1A7 7 0 0 1-5 5" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round"/><path d="M-2 8.6-6 5-2 1.8" fill="none" stroke="${tinta}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
  return '';
}

const ROTULO = (v) => (typeof v === 'number' ? String(v) : v === 'mais2' ? '+2' : v === 'mais4' ? '+4' : '');
let gradienteId = 0;

export function svgCarta(c) {
  const id = `cc-g${gradienteId++}`;
  const [claro, meio, escuro] = PALETA[c.cor];
  const coringa = cc.ehCoringa(c);
  const pontos = [[10, 14], [50, 20], [8, 50], [52, 58], [14, 80], [46, 84], [30, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" opacity=".16"/>`).join('');
  const rot = ROTULO(c.v);
  const canto = (x, y, a) => {
    const conteudo = rot
      ? `<text x="0" y="0" font-size="${rot.length > 1 ? 10 : 12}" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="#fff" stroke="${escuro}" stroke-width="2.4" paint-order="stroke" font-family="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif">${rot}</text>`
      : coringa ? flor(0, 0, 0.42) : simbolo(c.v, c.cor, 0, 0, 0.42, '#fff');
    return `<g transform="translate(${x} ${y}) rotate(${a})">${conteudo}</g>`;
  };
  let centro;
  if (coringa) {
    centro = `${flor(30, c.v === 'mais4' ? 40 : 45, 1.25)}${c.v === 'mais4' ? `<text x="30" y="68" font-size="15" font-weight="900" text-anchor="middle" fill="#fff" stroke="${escuro}" stroke-width="3" paint-order="stroke" font-family="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif">+4</text>` : ''}`;
  } else {
    const dentro = typeof c.v === 'number'
      ? `<text x="30" y="${c.v === 6 || c.v === 9 ? 49 : 50}" font-size="30" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="${meio}" stroke="${escuro}" stroke-width="1.2" font-family="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif">${c.v}</text>${c.v === 6 || c.v === 9 ? `<rect x="22" y="66" width="16" height="2.4" rx="1.2" fill="${escuro}"/>` : ''}${icone(c.cor, 30, 29, 0.62, meio)}`
      : `${simbolo(c.v, c.cor, 30, 47, 1.25, meio)}${c.v === 'mais2' ? `<text x="30" y="66" font-size="11" font-weight="900" text-anchor="middle" fill="${escuro}" font-family="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif">+2</text>` : icone(c.cor, 30, 29, 0.55, meio)}`;
    centro = `<rect x="11" y="20" width="38" height="52" rx="15" fill="#fff" opacity=".96"/>${dentro}`;
  }
  return `<svg viewBox="0 0 60 90" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${claro}"/><stop offset="1" stop-color="${meio}"/></linearGradient></defs>`
    + `<rect x="1" y="1" width="58" height="88" rx="9" fill="url(#${id})" stroke="${escuro}" stroke-width="1.2"/>${pontos}`
    + `<rect x="4" y="4" width="52" height="82" rx="7" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55"/>`
    + `${centro}${canto(10, 11, 0)}${canto(50, 79, 180)}${coringa ? '' : icone(c.cor, 50, 11, 0.42) + icone(c.cor, 10, 79, 0.42)}</svg>`;
}

const VERSO = '<svg viewBox="0 0 60 90" aria-hidden="true"><defs><linearGradient id="cc-verso" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a4fd0"/><stop offset="1" stop-color="#2c1f66"/></linearGradient></defs><rect x="1" y="1" width="58" height="88" rx="9" fill="url(#cc-verso)" stroke="#1f1547" stroke-width="1.2"/><rect x="4" y="4" width="52" height="82" rx="7" fill="none" stroke="#fff" stroke-width="1.4" opacity=".45"/><g fill="#fff" opacity=".5"><circle cx="12" cy="14" r="1.4"/><circle cx="48" cy="18" r="1"/><circle cx="14" cy="74" r="1"/><circle cx="46" cy="78" r="1.4"/><circle cx="30" cy="12" r=".9"/></g><g fill="none" stroke-width="4.2" stroke-linecap="round"><path d="M13 54a17 17 0 0 1 34 0" stroke="#ff6b81"/><path d="M18 54a12 12 0 0 1 24 0" stroke="#ffd34a"/><path d="M23 54a7 7 0 0 1 14 0" stroke="#4fd18b"/></g><g fill="#fff"><circle cx="15" cy="57" r="5"/><circle cx="20" cy="58" r="4"/><circle cx="45" cy="57" r="5"/><circle cx="40" cy="58" r="4"/></g><path d="M30 64l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4Z" fill="#ffd34a"/></svg>';

const reduzir = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function montar(area, ctl) {
  const raiz = el('div', 'cores');
  area.append(raiz);
  let e = null; let robos = 2; let pendente = false;
  let ocupado = false; let acabou = false;
  let assentos = []; let monteEl; let pilhaEl; let maoEl; let botaoUltima; let botaoPassar; let corEl; let sentidoEl; let seletor;

  const salvar = () => ctl.salvar({ e, robos, pendente });
  const nome = (j) => (j === 0 ? 'Você' : `Robô ${ROBOS[j - 1].nome}`);

  // ---------- escolha da quantidade de robôs ----------
  function config() {
    acabou = true;
    raiz.replaceChildren();
    raiz.className = 'cores';
    const caixa = el('div', 'cores-config', `<div class="cores-config-cartas">${svgCarta({ cor: 'azul', v: 7 })}${svgCarta({ cor: 'coringa', v: 'coringa' })}${svgCarta({ cor: 'vermelho', v: 'mais2' })}</div><h2>Quantos robôs?</h2><p>Cada um começa com 7 cartas.</p>`);
    const opcoes = el('div', 'cores-opcoes');
    for (const n of [1, 2, 3]) {
      const b = el('button', '', `${'🤖'.repeat(n)}<b>${n} robô${n > 1 ? 's' : ''}</b><small>${n + 1} jogadores</small>`);
      b.onclick = () => { ctl.som('clique'); robos = n; novaPartida(); };
      opcoes.append(b);
    }
    caixa.append(opcoes);
    raiz.append(caixa);
    ctl.status('Escolha quantos robôs vão jogar');
  }

  function novaPartida() {
    e = cc.novoJogo(robos, Math.random, ctl.roboComeca() ? 1 : 0);
    pendente = false;
    acabou = false;
    salvar();
    mesa();
    animarDistribuir();
    seguir();
  }

  // ---------- mesa ----------
  function mesa() {
    raiz.replaceChildren();
    raiz.className = `cores jogando r${robos}`;
    const topoEl = el('div', 'cores-robos');
    assentos = [null];
    for (let j = 1; j <= robos; j++) {
      const a = el('div', 'cores-assento', `<div class="cores-avatar" style="--c:${ROBOS[j - 1].cor}">🤖</div><div class="cores-nome">${ROBOS[j - 1].nome}</div><div class="cores-leque"></div><div class="cores-conta"></div><div class="cores-balao" hidden>Última!</div>`);
      topoEl.append(a);
      assentos.push(a);
    }
    const centro = el('div', 'cores-mesa');
    monteEl = el('button', 'cores-monte', `<span class="cores-pilha-verso">${VERSO}</span><span class="cores-pilha-verso">${VERSO}</span><span class="cores-pilha-verso">${VERSO}</span><small>Comprar</small>`);
    monteEl.setAttribute('aria-label', 'Comprar uma carta');
    monteEl.onclick = comprarEu;
    pilhaEl = el('div', 'cores-pilha');
    const info = el('div', 'cores-info');
    corEl = el('div', 'cores-cor');
    sentidoEl = el('div', 'cores-sentido');
    info.append(corEl, sentidoEl);
    centro.append(monteEl, pilhaEl, info);
    const acoes = el('div', 'cores-botoes');
    botaoUltima = el('button', 'cores-ultima', '☝️ Última!');
    botaoUltima.onclick = dizerUltima;
    botaoPassar = el('button', 'cores-passar', 'Passar ➜');
    botaoPassar.onclick = passarEu;
    acoes.append(botaoUltima, botaoPassar);
    maoEl = el('div', 'cores-mao');
    seletor = el('div', 'cores-seletor', '<div class="cores-seletor-caixa"><b>Escolha a nova cor</b><div class="cores-seletor-cores"></div></div>');
    seletor.hidden = true;
    raiz.append(topoEl, centro, acoes, maoEl, seletor);
    desenhar();
  }

  function desenhar() {
    if (!e) return;
    for (let j = 1; j <= robos; j++) {
      const a = assentos[j];
      const n = e.maos[j].length;
      a.classList.toggle('vez', e.vez === j && !acabou);
      a.querySelector('.cores-leque').innerHTML = Array.from({ length: Math.min(n, 8) }, (_, k) => `<i style="--k:${k - (Math.min(n, 8) - 1) / 2}">${VERSO}</i>`).join('');
      a.querySelector('.cores-conta').textContent = `${n} ${n === 1 ? 'carta' : 'cartas'}`;
      a.classList.toggle('uma', n === 1);
    }
    // Pilha: as três de cima, levemente tortas.
    const ult = e.pilha.slice(-3);
    pilhaEl.innerHTML = ult.map((c, k) => `<span class="cores-na-pilha${k === ult.length - 1 ? ' cima' : ''}" style="--r:${((c.id * 37) % 21) - 10}deg">${svgCarta(c)}</span>`).join('');
    pilhaEl.style.setProperty('--cor', PALETA[e.cor][1]);
    corEl.innerHTML = `<i style="background:${PALETA[e.cor][1]}">${icone(e.cor, 0, 0, 0) ? `<svg viewBox="-8 -8 16 16">${icone(e.cor, 0, 0, 0.9)}</svg>` : ''}</i>${NOMES_COR[e.cor]}`;
    sentidoEl.innerHTML = `<span class="${e.sentido > 0 ? 'hor' : 'anti'}">${e.sentido > 0 ? '↻' : '↺'}</span>${robos > 1 ? (e.sentido > 0 ? 'sentido horário' : 'sentido invertido') : ''}`;
    const minhaVez = e.vez === 0 && !ocupado && !acabou;
    const podeCartas = minhaVez ? cc.jogaveis(e, 0).filter((c) => e.comprou === null || c.id === e.comprou) : [];
    monteEl.disabled = !(minhaVez && e.comprou === null && !podeCartas.length);
    monteEl.classList.toggle('chama', !monteEl.disabled);
    // Mão em fileiras de até 7 cartas.
    const mao = e.maos[0];
    const porFila = Math.ceil(mao.length / Math.ceil(mao.length / 7));
    maoEl.replaceChildren();
    for (let ini = 0; ini < mao.length; ini += porFila) {
      const fila = el('div', 'cores-fila');
      const parte = mao.slice(ini, ini + porFila);
      fila.style.setProperty('--n', parte.length);
      for (const c of parte) {
        const b = el('button', 'cores-carta', svgCarta(c));
        b.dataset.id = c.id;
        const pode = podeCartas.some((x) => x.id === c.id);
        b.classList.toggle('pode', pode);
        b.classList.toggle('apagada', minhaVez && !pode);
        b.classList.toggle('nova', c.id === e.comprou);
        b.setAttribute('aria-label', descrever(c));
        b.onclick = () => tocarCarta(c.id);
        fila.append(b);
      }
      maoEl.append(fila);
    }
    const n = mao.length;
    botaoUltima.hidden = acabou || !(pendente || (n <= 2 && (e.vez === 0 || e.ultima[0])));
    botaoUltima.disabled = e.ultima[0] || (!pendente && !(minhaVez && n === 2 && podeCartas.length));
    botaoUltima.classList.toggle('pulsa', pendente || (minhaVez && n === 2 && podeCartas.length > 0 && !e.ultima[0]));
    botaoUltima.textContent = e.ultima[0] ? '✓ Você avisou!' : '☝️ Última!';
    botaoPassar.hidden = !(minhaVez && e.comprou !== null);
  }

  function descrever(c) {
    if (c.v === 'coringa') return 'Coringa';
    if (c.v === 'mais4') return 'Coringa mais 4';
    const v = { mais2: 'mais 2', pula: 'pula a vez', inverte: 'inverte' }[c.v] ?? c.v;
    return `${v} ${NOMES_COR[c.cor].toLowerCase()}`;
  }

  // ---------- animações ----------
  function voar(de, para, html, ms = 380, extra = {}) {
    if (reduzir() || !de || !para) return Promise.resolve();
    const a = de.getBoundingClientRect(); const b = para.getBoundingClientRect();
    const fantasma = el('div', 'cores-voando', html);
    const w = extra.largura ?? b.width;
    fantasma.style.cssText = `width:${w}px;height:${w * 1.5}px;left:${b.left + b.width / 2 - w / 2}px;top:${b.top + b.height / 2 - w * 0.75}px`;
    document.body.append(fantasma);
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const anim = fantasma.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${extra.de ?? 0.6}) rotate(${extra.giro ?? -20}deg)` },
      { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
    ], { duration: ms, easing: 'cubic-bezier(.3, .7, .3, 1)' });
    return new Promise((r) => { anim.onfinish = anim.oncancel = () => { fantasma.remove(); r(); }; });
  }

  function animarJogada(origemRect) {
    const cima = pilhaEl.querySelector('.cima');
    if (!cima || reduzir() || !origemRect) return;
    const b = cima.getBoundingClientRect();
    const dx = origemRect.left + origemRect.width / 2 - (b.left + b.width / 2);
    const dy = origemRect.top + origemRect.height / 2 - (b.top + b.height / 2);
    const s = origemRect.width / b.width;
    const r = parseFloat(cima.style.getPropertyValue('--r')) || 0;
    cima.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(0deg)`, offset: 0 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 30}px) scale(1.12) rotate(${r * 2}deg)`, offset: 0.55 },
      { transform: `translate(0, 0) scale(1) rotate(${r}deg)`, offset: 1 },
    ], { duration: 460, easing: 'cubic-bezier(.3, .6, .3, 1)' });
  }

  async function animarCompra(j, qtd) {
    for (let k = 0; k < qtd; k++) {
      const destino = j === 0 ? maoEl : assentos[j].querySelector('.cores-leque');
      ctl.som('carta');
      await voar(monteEl, destino, VERSO, 300, { largura: j === 0 ? 56 : 28, de: 1, giro: 0 });
    }
  }

  function animarDistribuir() {
    if (reduzir()) return;
    maoEl.querySelectorAll('.cores-carta').forEach((b, k) => b.animate([{ transform: 'translateY(-160px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: k * 60, easing: 'cubic-bezier(.3, .7, .3, 1)', fill: 'backwards' }));
  }

  function balao(j, texto) {
    const b = assentos[j]?.querySelector('.cores-balao');
    if (!b) return;
    b.textContent = texto;
    b.hidden = false;
    setTimeout(() => { b.hidden = true; }, 1400);
  }

  // ---------- jogadas ----------
  function textoEfeito(r, j) {
    const quem = nome(j);
    const alvo = r.alvo !== null && r.alvo !== undefined ? (r.alvo === 0 ? 'você' : `o robô ${ROBOS[r.alvo - 1].nome}`) : '';
    if (r.efeito === 'mais2') return `${quem === 'Você' ? 'Você jogou' : `${quem} jogou`} +2: ${alvo} compra 2 e perde a vez!`;
    if (r.efeito === 'mais4') return `+4! ${alvo[0].toUpperCase()}${alvo.slice(1)} compra 4 e perde a vez. Cor nova: ${NOMES_COR[e.cor]}`;
    if (r.efeito === 'pula') return `Pula! ${alvo[0].toUpperCase()}${alvo.slice(1)} perdeu a vez 🐰`;
    if (r.efeito === 'inverte') return 'Inverteu o sentido! 🔁';
    if (r.carta && r.carta.v === 'coringa') return `Coringa! Cor nova: ${NOMES_COR[e.cor]} 🌸`;
    return null;
  }

  async function aplicar(id, cor, origemRect) {
    const j = e.vez;
    const r = cc.jogar(e, id, cor);
    if (!r.ok) return null;
    ctl.som(j === 0 ? 'mover' : 'robo');
    desenhar();
    animarJogada(origemRect);
    if (r.efeito === 'mais2' || r.efeito === 'mais4') {
      salvar();
      if (!await ctl.esperar(350)) return null;
      // As cartas já estão na mão; a animação só mostra o caminho.
      animarCompra(r.alvo, r.efeito === 'mais2' ? 2 : 4);
      ctl.som('captura');
    }
    const t = textoEfeito(r, j);
    if (t) ctl.status(t, j === 0 ? 'voce' : 'robo');
    else if (e.vencedor === null) ctl.status(j === 0 ? 'Boa! 👍' : `${nome(j)} jogou`, j === 0 ? 'voce' : 'robo');
    salvar();
    return r;
  }

  function terminar() {
    acabou = true;
    ocupado = false;
    desenhar();
    const venci = e.vencedor === 0;
    ctl.fim(venci ? 'vitoria' : 'derrota', venci ? 'Você ficou sem cartas: venceu! 🎉' : `${nome(e.vencedor)} ficou sem cartas e venceu 🤖`, pilhaEl.parentElement, { nivel: ctl.nivel(), robos });
  }

  async function seguir() {
    if (e.vencedor !== null) { terminar(); return; }
    if (e.vez === 0) {
      ocupado = false;
      desenhar();
      const n = cc.jogaveis(e, 0).length;
      if (e.comprou !== null) ctl.status('Ela serve! Jogue a carta nova ou toque em Passar', 'voce');
      else ctl.status(n ? 'Sua vez: escolha uma carta' : 'Sem jogada: toque no monte para comprar', 'voce');
      return;
    }
    turnoRobo();
  }

  async function turnoRobo() {
    ocupado = true;
    const j = e.vez;
    desenhar();
    ctl.status(`Robô ${ROBOS[j - 1].nome} pensando…`, 'robo');
    if (!await ctl.esperar(900)) return;
    let esc = cc.escolhaRobo(e, ctl.nivel());
    if (!esc) {
      const c = cc.comprar(e);
      salvar();
      await animarCompra(j, 1);
      desenhar();
      if (e.vez !== j || !c) { ctl.status(`Robô ${ROBOS[j - 1].nome} comprou uma carta e passou`, 'robo'); if (!await ctl.esperar(600)) return; seguir(); return; }
      if (!await ctl.esperar(500)) return;
      esc = cc.escolhaRobo(e, ctl.nivel());
    }
    if (e.maos[j].length === 2 && cc.roboLembra(ctl.nivel())) { cc.dizerUltima(e, j); balao(j, 'Última!'); }
    const origem = assentos[j].querySelector('.cores-avatar').getBoundingClientRect();
    const r = await aplicar(esc.id, esc.cor, origem);
    if (!r) return;
    if (e.vencedor === null && cc.conferirUltima(e, j)) {
      ctl.status(`Robô ${ROBOS[j - 1].nome} esqueceu de dizer "Última!" e comprou 2 😄`, 'robo');
      balao(j, 'Ops!');
      salvar();
      await animarCompra(j, 2);
      desenhar();
    }
    if (!await ctl.esperar(r.efeito ? 1100 : 650)) return;
    seguir();
  }

  async function tocarCarta(id) {
    if (ocupado || acabou || e.vez !== 0) return;
    const c = e.maos[0].find((x) => x.id === id);
    if (!c || !cc.podeJogar(c, e) || (e.comprou !== null && e.comprou !== id)) {
      ctl.som('erro');
      const b = maoEl.querySelector(`[data-id="${id}"]`);
      b?.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 240 });
      ctl.status(e.comprou !== null ? 'Só dá para jogar a carta que você comprou' : `Essa não serve: precisa ser ${NOMES_COR[e.cor].toLowerCase()} ou ${ROTULO(cc.topo(e).v) || 'o mesmo símbolo'}`, 'voce');
      return;
    }
    const origem = maoEl.querySelector(`[data-id="${id}"]`)?.getBoundingClientRect();
    let cor;
    if (cc.ehCoringa(c)) {
      cor = await escolherCor();
      if (!cor) return;
    }
    ocupado = true;
    const r = await aplicar(id, cor, origem);
    if (!r) return;
    if (e.vencedor === null && e.maos[0].length === 1 && !e.ultima[0]) {
      // Uma chance de lembrar logo depois de jogar.
      pendente = true;
      desenhar();
      if (!await ctl.esperar(1800)) return;
      pendente = false;
      if (cc.conferirUltima(e, 0)) {
        ctl.status('Ops! Esqueceu de dizer "Última!": compre 2 cartas', 'derrota');
        salvar();
        desenhar();
        await animarCompra(0, 2);
        if (!await ctl.esperar(900)) return;
      }
    }
    if (!await ctl.esperar(r.efeito ? 900 : 450)) return;
    seguir();
  }

  function escolherCor() {
    return new Promise((resolver) => {
      const caixa = seletor.querySelector('.cores-seletor-cores');
      caixa.replaceChildren();
      for (const cor of cc.CORES) {
        const b = el('button', 'cores-escolha', `<svg viewBox="-8 -8 16 16">${icone(cor, 0, 0, 0.9)}</svg><span>${NOMES_COR[cor]}</span>`);
        b.style.setProperty('--c1', PALETA[cor][0]);
        b.style.setProperty('--c2', PALETA[cor][1]);
        b.onclick = () => { seletor.hidden = true; ctl.som('clique'); resolver(cor); };
        caixa.append(b);
      }
      const fechar = el('button', 'cores-cancelar', 'Voltar');
      fechar.onclick = () => { seletor.hidden = true; resolver(null); };
      caixa.append(fechar);
      seletor.hidden = false;
    });
  }

  async function comprarEu() {
    if (ocupado || acabou || e.vez !== 0 || e.comprou !== null) return;
    if (cc.jogaveis(e, 0).length) { ctl.status('Você tem jogada! Procure uma carta que sirva', 'voce'); return; }
    ocupado = true;
    const c = cc.comprar(e);
    salvar();
    await animarCompra(0, 1);
    ocupado = false;
    desenhar();
    if (!c) { seguir(); return; }
    if (e.vez !== 0) {
      ctl.status('Não serviu… a vez passa', 'robo');
      ocupado = true;
      if (!await ctl.esperar(700)) return;
      seguir();
      return;
    }
    seguir();
  }

  function passarEu() {
    if (ocupado || e.vez !== 0 || e.comprou === null) return;
    cc.passar(e);
    ctl.som('clique');
    salvar();
    seguir();
  }

  function dizerUltima() {
    if (!e || acabou) return;
    if (pendente) {
      e.ultima[0] = true;
      pendente = false;
    } else if (!(e.vez === 0 && e.maos[0].length === 2 && cc.dizerUltima(e, 0))) return;
    ctl.som('item');
    ctl.status('Última carta! ☝️', 'voce');
    salvar();
    desenhar();
  }

  function iniciar(salvo) {
    ocupado = false;
    if (salvo?.e) {
      ({ e, robos } = salvo);
      pendente = false;
      acabou = false;
      mesa();
      if (salvo.pendente && e.maos[0].length === 1 && !e.ultima[0]) cc.conferirUltima(e, 0);
      seguir();
      if (e.vez === 0) ctl.status('Partida retomada: sua vez', 'voce');
      return;
    }
    config();
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
