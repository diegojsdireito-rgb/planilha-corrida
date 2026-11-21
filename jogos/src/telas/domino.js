// Tela do Dominó: você contra o robô, mesa de feltro que dobra nas bordas, pedras em SVG.
import { el } from '../comum.js';
import * as dm from '../domino.js';

export const INFO = {
  id: 'domino',
  nome: 'Dominó',
  descricao: 'Encaixe as pedras',
  regras: [
    'Cada um começa com 7 pedras. As outras 14 ficam no monte de compra.',
    'Na sua vez, toque numa pedra que tenha o mesmo número de uma das pontas da mesa. Se ela servir nas duas pontas, toque no lugar que brilha para escolher.',
    'Sem pedra que encaixe, toque em Comprar até conseguir jogar. Se o monte acabar, passe a vez.',
    'Ganha quem bater (jogar a última pedra). Se ninguém conseguir jogar, a mesa tranca e vence quem tiver menos pontos na mão.',
    'No difícil, o robô guarda pedras para ele e tenta fechar os números que você não tem.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><defs><radialGradient id="dm-ic-f" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#36a571"/><stop offset="1" stop-color="#17603d"/></radialGradient></defs><rect width="12" height="12" rx="2" fill="url(#dm-ic-f)"/><g transform="rotate(-18 4.4 6)"><rect x="2.4" y="2.2" width="4" height="7.6" rx=".7" fill="#fffaf0" stroke="#c9bb9c" stroke-width=".2"/><path d="M2.9 6h3" stroke="#b5a582" stroke-width=".25"/><circle cx="3.4" cy="3.3" r=".42" fill="#2a78d6"/><circle cx="5.4" cy="5" r=".42" fill="#2a78d6"/><circle cx="4.4" cy="4.15" r=".42" fill="#2a78d6"/><circle cx="3.4" cy="7.1" r=".42" fill="#e5484d"/><circle cx="5.4" cy="8.9" r=".42" fill="#e5484d"/></g><g transform="rotate(14 8 6.4)"><rect x="6.1" y="2.6" width="4" height="7.6" rx=".7" fill="#fffaf0" stroke="#c9bb9c" stroke-width=".2"/><path d="M6.6 6.4h3" stroke="#b5a582" stroke-width=".25"/><circle cx="8.1" cy="4.5" r=".42" fill="#2f9e62"/><circle cx="7.1" cy="7.5" r=".42" fill="#8e5bd6"/><circle cx="9.1" cy="7.5" r=".42" fill="#8e5bd6"/><circle cx="7.1" cy="9.2" r=".42" fill="#8e5bd6"/><circle cx="9.1" cy="9.2" r=".42" fill="#8e5bd6"/></g></svg>';

const U = 40; // tamanho, no desenho, de meia pedra
const LARGURA = 14; // largura da mesa, em meias pedras
const CORES = ['#000', '#e5484d', '#f08c00', '#2f9e62', '#2a78d6', '#8e5bd6', '#c2255c'];
const PINTAS = {
  0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
const NOMES = ['branco', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis'];

const DEFS = `<svg class="dm-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="dm-marfim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset=".55" stop-color="#f6efdd"/><stop offset="1" stop-color="#e6dcc3"/></linearGradient>
  <radialGradient id="dm-pino" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#d9a93a"/><stop offset="1" stop-color="#8f6514"/></radialGradient>
  <linearGradient id="dm-costas" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3e7bfa"/><stop offset="1" stop-color="#1d3f9e"/></linearGradient>
</defs></svg>`;

// Uma pedra no desenho (coordenadas em meias pedras). a = metade de cima/esquerda.
function svgPedra({ x, y, w, h, a, b }, classe = '', extra = '') {
  const X = x * U; const Y = y * U; const W = w * U; const H = h * U;
  const deitada = W > H;
  const m = 2; // folga entre pedras vizinhas
  const metade = (n, cx, cy) => PINTAS[n].map(([px, py]) => {
    const [dx, dy] = deitada ? [py, px] : [px, py];
    return `<circle cx="${cx + dx * U * 0.27}" cy="${cy + dy * U * 0.27}" r="${U * 0.095}" fill="${CORES[n]}"/><circle cx="${cx + dx * U * 0.27 - 1.1}" cy="${cy + dy * U * 0.27 - 1.1}" r="${U * 0.035}" fill="#fff" opacity=".55"/>`;
  }).join('');
  const c1 = deitada ? [X + U / 2, Y + U / 2] : [X + U / 2, Y + U / 2];
  const c2 = deitada ? [X + U * 1.5, Y + U / 2] : [X + U / 2, Y + U * 1.5];
  const linha = deitada
    ? `<path d="M${X + W / 2} ${Y + 7}V${Y + H - 7}" stroke="#b9aa86" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M${X + 7} ${Y + H / 2}H${X + W - 7}" stroke="#b9aa86" stroke-width="2" stroke-linecap="round"/>`;
  return `<g class="dm-pedra ${classe}" ${extra}>
    <rect x="${X + m + 1.5}" y="${Y + m + 3}" width="${W - 2 * m}" height="${H - 2 * m}" rx="7" fill="rgba(0,0,0,.28)"/>
    <rect x="${X + m}" y="${Y + m}" width="${W - 2 * m}" height="${H - 2 * m}" rx="7" fill="url(#dm-marfim)" stroke="#c4b58f" stroke-width="1.4"/>
    <rect x="${X + m + 2.5}" y="${Y + m + 2.5}" width="${W - 2 * m - 5}" height="${H - 2 * m - 5}" rx="5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>
    ${linha}${metade(a, ...c1)}${metade(b, ...c2)}
    <circle cx="${X + W / 2}" cy="${Y + H / 2}" r="2.6" fill="url(#dm-pino)"/>
  </g>`;
}

const svgCostas = (w = 20, h = 38) => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect x=".8" y=".8" width="${w - 1.6}" height="${h - 1.6}" rx="3.5" fill="url(#dm-costas)" stroke="#16307a" stroke-width="1"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="2" fill="none" stroke="#9fc0ff" stroke-width=".8" opacity=".7"/><circle cx="${w / 2}" cy="${h / 2}" r="${w * 0.18}" fill="#ffd166"/></svg>`;

const pedraDeMao = ([a, b]) => `<svg viewBox="-2 -2 ${U + 4} ${2 * U + 6}" aria-hidden="true">${svgPedra({ x: 0, y: 0, w: 1, h: 2, a, b })}</svg>`;

export function montar(area, ctl) {
  const jogo = el('div', 'dm-jogo');
  jogo.insertAdjacentHTML('beforeend', DEFS);
  const robo = el('div', 'dm-faixa dm-robo');
  const moldura = el('div', 'dm-moldura');
  const mesa = el('div', 'dm-mesa');
  moldura.append(mesa);
  const controles = el('div', 'dm-controles');
  const monte = el('div', 'dm-monte');
  const bComprar = el('button', 'botao dm-comprar', '🫳 Comprar');
  const bPassar = el('button', 'botao secundario dm-passar', 'Passar a vez ➜');
  controles.append(monte, bComprar, bPassar);
  const mao = el('div', 'dm-mao');
  mao.setAttribute('role', 'group');
  mao.setAttribute('aria-label', 'Suas pedras');
  jogo.append(robo, moldura, controles, mao);
  area.append(jogo);

  let e; let escolhida = null; let acabou = false; let animar = -1; let roboPensando = false;

  const salvar = () => ctl.salvar({ e });
  const minhaVez = () => !acabou && !roboPensando && e.vez === 0;

  function desenharMesa() {
    const pos = dm.arrumarMesa(e.mesa, e.centro, LARGURA);
    const fantasmas = [];
    if (escolhida !== null && minhaVez()) {
      for (const lado of dm.encaixes(e, e.maos[0][escolhida])) {
        const prox = dm.jogar(e, 0, escolhida, lado);
        const p = dm.arrumarMesa(prox.mesa, prox.centro, LARGURA);
        fantasmas.push({ lado, p: p[lado === 'e' ? 0 : p.length - 1] });
      }
    }
    if (!pos.length && !fantasmas.length) {
      mesa.innerHTML = `<p class="dm-vazia">${e.vez === 0 ? 'Mesa vazia: toque numa pedra para começar!' : 'O robô vai começar…'}</p>`;
      return;
    }
    const todas = [...pos, ...fantasmas.map((f) => f.p)];
    const y0 = Math.min(...todas.map((p) => p.y)) - 0.25;
    const y1 = Math.max(...todas.map((p) => p.y + p.h)) + 0.25;
    const vb = `${-0.25 * U} ${y0 * U} ${(LARGURA + 0.5) * U} ${(y1 - y0) * U}`;
    const pedras = pos.map((p, k) => svgPedra(p, k === animar ? 'dm-nova' : '')).join('');
    const fant = fantasmas.map(({ lado, p }) => {
      const X = p.x * U; const Y = p.y * U;
      return `<g class="dm-fantasma" data-lado="${lado}" role="button" tabindex="0" aria-label="Encaixar na ponta da ${lado === 'e' ? 'esquerda' : 'direita'}">
        <rect x="${X + 1}" y="${Y + 1}" width="${p.w * U - 2}" height="${p.h * U - 2}" rx="8"/>
        <text x="${X + (p.w * U) / 2}" y="${Y + (p.h * U) / 2 + 9}" text-anchor="middle">👆</text></g>`;
    }).join('');
    mesa.innerHTML = `<svg viewBox="${vb}" style="aspect-ratio:${(LARGURA + 0.5) / (y1 - y0)}" role="img" aria-label="Mesa com ${pos.length} ${pos.length === 1 ? 'pedra' : 'pedras'}${pos.length ? `; pontas ${dm.pontas(e).join(' e ')}` : ''}">${pedras}${fant}</svg>`;
    mesa.querySelectorAll('.dm-fantasma').forEach((g) => {
      const ir = () => jogarVoce(escolhida, g.dataset.lado);
      g.addEventListener('click', ir);
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ir(); } });
    });
    animar = -1;
  }

  function desenhar() {
    // Robô: pedras viradas (no fim, mostra quais sobraram).
    const nR = e.maos[1].length;
    robo.innerHTML = `<span class="dm-quem"><span class="avatar robo">🤖</span>Robô <small>${nR} ${nR === 1 ? 'pedra' : 'pedras'}</small></span>`;
    const costas = el('span', 'dm-costas');
    costas.innerHTML = acabou
      ? e.maos[1].map((p) => `<span class="dm-aberta">${pedraDeMao(p)}</span>`).join('')
      : e.maos[1].map(() => svgCostas()).join('');
    robo.append(costas);
    robo.classList.toggle('dm-pensando', roboPensando);

    desenharMesa();

    const nM = e.monte.length;
    monte.innerHTML = `<span class="dm-pilha">${nM ? svgCostas(22, 40) : ''}${nM > 1 ? svgCostas(22, 40) : ''}${nM > 2 ? svgCostas(22, 40) : ''}</span><span><b>${nM}</b><small>para comprar</small></span>`;
    monte.classList.toggle('dm-acabou', !nM);
    const podeComprar = minhaVez() && dm.podeComprar(e, 0);
    const devePassar = minhaVez() && dm.devePassar(e, 0);
    bComprar.hidden = !podeComprar;
    bPassar.hidden = !devePassar;

    const jogaveis = minhaVez() ? new Set(dm.jogadas(e, 0).map((o) => o.i)) : new Set();
    mao.replaceChildren(...e.maos[0].map((p, i) => {
      const b = el('button', 'dm-peca', pedraDeMao(p));
      b.setAttribute('aria-label', `Pedra ${NOMES[p[0]]} e ${NOMES[p[1]]}${jogaveis.has(i) ? '' : ', não encaixa agora'}`);
      b.classList.toggle('pode', jogaveis.has(i));
      b.classList.toggle('nao', minhaVez() && !jogaveis.has(i));
      b.classList.toggle('escolhida', escolhida === i);
      b.disabled = acabou;
      b.onclick = () => tocarPedra(i, b);
      return b;
    }));
  }

  function statusVoce(prefixo = '') {
    if (dm.devePassar(e, 0)) ctl.status(`${prefixo}Nenhuma pedra encaixa e o monte acabou: passe a vez`, 'voce');
    else if (dm.podeComprar(e, 0)) ctl.status(`${prefixo}Nenhuma pedra encaixa: compre uma no monte`, 'voce');
    else if (!e.mesa.length) ctl.status(`${prefixo}Você começa: jogue qualquer pedra`, 'voce');
    else ctl.status(`${prefixo}Sua vez: pontas ${dm.pontas(e).join(' e ')}`, 'voce');
  }

  function tocarPedra(i, botao) {
    if (!minhaVez()) return;
    const pedra = e.maos[0][i];
    const lados = dm.encaixes(e, pedra);
    if (!lados.length) {
      ctl.som('erro');
      botao.classList.remove('treme');
      void botao.offsetWidth;
      botao.classList.add('treme');
      ctl.status(`Essa não encaixa: as pontas são ${dm.pontas(e).join(' e ')}`, 'voce');
      return;
    }
    if (escolhida === i) { escolhida = null; ctl.som('clique'); desenhar(); statusVoce(); return; }
    if (dm.precisaEscolher(e, pedra)) {
      escolhida = i;
      ctl.som('clique');
      desenhar();
      ctl.status('Serve nas duas pontas: toque no lugar que brilha', 'voce');
      return;
    }
    jogarVoce(i, dm.ladoAutomatico(e, pedra));
  }

  function jogarVoce(i, lado) {
    if (!minhaVez() || i === null) return;
    e = dm.jogar(e, 0, i, lado);
    escolhida = null;
    animar = e.ultima.lado === 'e' ? 0 : e.mesa.length - 1;
    ctl.som('mover');
    depois();
  }

  bComprar.onclick = () => {
    if (!minhaVez() || !dm.podeComprar(e, 0)) return;
    e = dm.comprar(e, 0);
    ctl.som('carta');
    salvar();
    desenhar();
    const nova = mao.lastElementChild;
    nova?.classList.add('dm-chegou');
    statusVoce(dm.jogadas(e, 0).length ? 'Boa! ' : '');
  };
  bPassar.onclick = () => {
    if (!minhaVez() || !dm.devePassar(e, 0)) return;
    e = dm.passar(e, 0);
    ctl.som('clique');
    depois();
  };

  function depois(aviso = '') {
    salvar();
    if (e.fim) { terminar(); return; }
    desenhar();
    if (e.vez === 1) vezDoRobo();
    else statusVoce(aviso);
  }

  async function vezDoRobo() {
    roboPensando = true;
    desenhar();
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(750)) return;
    let aviso = '';
    for (;;) {
      const l = dm.jogadaRobo(e, 1, ctl.nivel());
      if (l) {
        e = dm.jogar(e, 1, l.i, l.lado);
        animar = l.lado === 'e' ? 0 : e.mesa.length - 1;
        ctl.som('robo');
        break;
      }
      if (dm.podeComprar(e, 1)) {
        e = dm.comprar(e, 1);
        ctl.som('carta');
        ctl.status('O robô está comprando…', 'robo');
        salvar();
        desenhar();
        if (!await ctl.esperar(420)) return;
        continue;
      }
      e = dm.passar(e, 1);
      aviso = 'O robô passou a vez. ';
      ctl.som('clique');
      break;
    }
    roboPensando = false;
    depois(aviso);
  }

  function terminar() {
    acabou = true;
    roboPensando = false;
    escolhida = null;
    desenhar();
    const f = e.fim;
    const [p0, p1] = f.pontos;
    const resultado = f.vencedor === 0 ? 'vitoria' : f.vencedor === 1 ? 'derrota' : 'empate';
    let texto;
    if (f.tipo === 'batida') texto = f.vencedor === 0 ? `Você bateu! 🎉 O robô ficou com ${p1} ${p1 === 1 ? 'ponto' : 'pontos'}` : `O robô bateu 🤖 Você ficou com ${p0} ${p0 === 1 ? 'ponto' : 'pontos'}`;
    else texto = `Mesa trancada! Você ${p0} × ${p1} robô: ${resultado === 'vitoria' ? 'você venceu 🎉' : resultado === 'derrota' ? 'o robô venceu 🤖' : 'empate 🤝'}`;
    ctl.fim(resultado, texto, moldura, { nivel: ctl.nivel(), pontos: resultado === 'vitoria' ? p1 : 0 });
  }

  function iniciar(salvo) {
    acabou = false; escolhida = null; roboPensando = false; animar = -1;
    moldura.querySelectorAll('.faixa-fim').forEach((f) => f.remove());
    e = salvo?.e ?? dm.novoJogo(ctl.roboComeca() ? 1 : 0);
    if (e.fim) e = dm.novoJogo(ctl.roboComeca() ? 1 : 0);
    desenhar();
    if (e.vez === 1) vezDoRobo();
    else statusVoce(salvo?.e ? 'Partida retomada. ' : '');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
