import * as ludo from '../ludo.js';
import { el, svgEl, pausa } from '../comum.js';

const COR_HEX = ['var(--vermelho)', 'var(--verde)', 'var(--amarelo)', 'var(--azul)'];
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function desenharTabuleiro() {
  const svg = svgEl('svg', { viewBox: '0 0 15 15', role: 'img', 'aria-label': 'Tabuleiro de Ludo' });
  svg.append(svgEl('rect', { width: 15, height: 15, fill: '#fffdf8' }));
  ludo.CANTO_BASE.forEach(([r, c], cor) => {
    svg.append(svgEl('rect', { x: c, y: r, width: 6, height: 6, fill: COR_HEX[cor] }));
    svg.append(svgEl('rect', { x: c + 0.8, y: r + 0.8, width: 4.4, height: 4.4, rx: 0.5, fill: '#fffdf8' }));
    for (let k = 0; k < 4; k++) {
      const [y, x] = ludo.posicao(cor, -1, k);
      svg.append(svgEl('circle', { cx: x, cy: y, r: 0.62, fill: COR_HEX[cor], 'fill-opacity': 0.25 }));
    }
  });
  const casa = (r, c, fill) => svg.append(svgEl('rect', { x: c, y: r, width: 1, height: 1, fill, stroke: '#cfc6b4', 'stroke-width': 0.04 }));
  ludo.PERCURSO.forEach(([r, c], i) => {
    const saida = ludo.SAIDA.indexOf(i);
    casa(r, c, saida >= 0 ? COR_HEX[saida] : '#fffdf8');
    if (ludo.SEGURAS.has(i) && saida < 0) {
      const t = svgEl('text', { x: c + 0.5, y: r + 0.78, 'text-anchor': 'middle', 'font-size': 0.78, fill: '#a99f8a' });
      t.textContent = '★';
      svg.append(t);
    }
  });
  ludo.RETA.forEach((lista, cor) => lista.forEach(([r, c]) => casa(r, c, COR_HEX[cor])));
  const tri = (pts, cor) => svg.append(svgEl('polygon', { points: pts, fill: COR_HEX[cor] }));
  tri('6,6 7.5,7.5 6,9', 0);
  tri('6,6 9,6 7.5,7.5', 1);
  tri('9,6 9,9 7.5,7.5', 2);
  tri('6,9 9,9 7.5,7.5', 3);
  svg.append(svgEl('rect', { x: 0, y: 0, width: 15, height: 15, fill: 'none', stroke: '#cfc6b4', 'stroke-width': 0.08 }));
  return svg;
}

export function montar(area, ctl) {
  let estado = null;
  let fase = 'config';
  let nomes = [];
  let resolverEscolha = null;
  let svg; let pecasEl; let dadoEl; let painelJog; let dica; let tabuleiro;

  function config() {
    fase = 'config';
    area.replaceChildren();
    const caixa = el('div', 'ludo-config', '<h2>Quantos robôs?</h2><p>Você joga com o vermelho e começa.</p>');
    const opcoes = el('div', 'opcoes');
    for (const n of [1, 2, 3]) {
      const b = el('button', '', `${n} robô${n > 1 ? 's' : ''}<small>${n + 1} jogadores</small>`);
      b.onclick = () => { ctl.som('clique'); comecar(n); };
      opcoes.append(b);
    }
    caixa.append(opcoes);
    area.append(caixa);
    ctl.status('Escolha a quantidade de adversários');
  }

  function nomesPara(cores) {
    const robos = cores.length - 1;
    const lista = [];
    let k = 1;
    for (const c of cores) lista[c] = c === 0 ? 'Você' : robos === 1 ? 'Robô' : `Robô ${k++}`;
    return lista;
  }

  function comecar(robos, salvo = null) {
    const cores = robos === 1 ? [0, 2] : robos === 2 ? [0, 1, 2] : [0, 1, 2, 3];
    estado = salvo ?? ludo.novo(cores);
    nomes = nomesPara(estado.cores);
    area.replaceChildren();
    tabuleiro = el('div', 'ludo-tab');
    svg = desenharTabuleiro();
    pecasEl = [];
    for (const cor of estado.cores) {
      pecasEl[cor] = [0, 1, 2, 3].map((peca) => {
        const g = svgEl('g', { class: 'peca' });
        g.append(svgEl('circle', { class: 'anel', r: 0.5, fill: 'none', stroke: '#111', 'stroke-width': 0.08, 'stroke-opacity': 0 }));
        g.append(svgEl('circle', { r: 0.38, fill: COR_HEX[cor], stroke: '#fff', 'stroke-width': 0.09 }));
        g.append(svgEl('circle', { r: 0.15, fill: '#fff', 'fill-opacity': 0.55 }));
        g.addEventListener('click', () => escolherPeca(cor, peca));
        svg.append(g);
        return g;
      });
    }
    tabuleiro.append(svg);
    const painel = el('div', 'ludo-painel');
    painelJog = el('div', 'jogadores');
    dadoEl = el('button', 'dado', Array.from({ length: 9 }, () => '<i></i>').join(''));
    dadoEl.setAttribute('aria-label', 'Jogar o dado');
    dadoEl.onclick = () => { if (fase === 'dado') turno(); };
    painel.append(painelJog, dadoEl);
    dica = el('div', 'dica-ludo', salvo ? 'Partida retomada.' : '');
    area.append(tabuleiro, painel, dica);
    mostrarDado(estado.dado ?? 6);
    desenhar();
    proximoTurno();
  }

  function mostrarDado(n) {
    [...dadoEl.children].forEach((p, i) => p.classList.toggle('on', PIPS[n].includes(i)));
  }

  function desenhar(podem = []) {
    const grupos = new Map();
    for (const cor of estado.cores) {
      estado.pecas[cor].forEach((p, peca) => {
        const [y, x] = ludo.posicao(cor, p, peca);
        const chave = `${y.toFixed(2)},${x.toFixed(2)}`;
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push({ cor, peca, x, y });
      });
    }
    const DESVIO = [[0, 0], [-0.2, -0.2], [0.2, 0.2], [0.2, -0.2], [-0.2, 0.2]];
    for (const lista of grupos.values()) {
      lista.forEach(({ cor, peca, x, y }, k) => {
        const escala = lista.length > 1 ? 0.72 : 1;
        const [dx, dy] = lista.length > 1 ? DESVIO[(k % 4) + 1] : DESVIO[0];
        const g = pecasEl[cor][peca];
        g.style.transform = `translate(${x + dx}px, ${y + dy}px) scale(${escala})`;
        const pode = podem.some((j) => j.cor === cor && j.peca === peca);
        g.classList.toggle('pode', pode);
        g.querySelector('.anel').setAttribute('stroke-opacity', pode ? 1 : 0);
        if (pode) svg.append(g);
      });
    }
    painelJog.innerHTML = estado.cores.map((cor) => {
      const chegaram = estado.pecas[cor].filter((p) => p === ludo.CHEGADA).length;
      return `<div class="${cor === estado.vez && fase !== 'fim' ? 'atual' : ''}"><i style="background:${COR_HEX[cor]}"></i>${nomes[cor]}<small>${chegaram}/4 em casa</small></div>`;
    }).join('');
  }

  function proximoTurno() {
    if (fase === 'fim') return;
    ctl.salvar({ estado: { ...estado, dado: null } });
    desenhar();
    if (estado.vez === 0) {
      fase = 'dado';
      dadoEl.disabled = false;
      dadoEl.classList.add('ativo');
      ctl.status('Sua vez: toque no dado', 'voce');
    } else {
      fase = 'robo';
      dadoEl.disabled = true;
      dadoEl.classList.remove('ativo');
      ctl.status(`${nomes[estado.vez]} jogando…`, 'robo');
      turno();
    }
  }

  async function rolar() {
    const ativa = ctl.ativa();
    dadoEl.classList.remove('ativo');
    dadoEl.classList.add('rolando');
    dadoEl.disabled = true;
    ctl.som('dado');
    for (let k = 0; k < 6; k++) {
      mostrarDado(1 + Math.floor(Math.random() * 6));
      await pausa(60);
    }
    dadoEl.classList.remove('rolando');
    const n = 1 + Math.floor(Math.random() * 6);
    mostrarDado(n);
    return ativa() ? n : null;
  }

  async function turno() {
    const cor = estado.vez;
    const humano = cor === 0;
    fase = 'rolando';
    if (!humano && !await ctl.esperar(500)) return;
    const dado = await rolar();
    if (dado === null) return;
    estado = { ...estado, dado, seis: dado === 6 ? estado.seis + 1 : 0 };
    if (estado.seis === 3) {
      dica.textContent = `${nomes[cor]} tirou três 6 seguidos e perdeu a vez.`;
      return passar(cor, 900);
    }
    const ops = ludo.jogadas(estado, cor, dado);
    if (!ops.length) {
      dica.textContent = `${nomes[cor]} tirou ${dado} e não tem jogada.`;
      return passar(cor, 800);
    }
    let jogada;
    if (humano) {
      if (ops.length === 1 || ops.every((o) => o.de === ops[0].de)) {
        jogada = ops[0];
        dica.textContent = `Você tirou ${dado}.`;
        if (!await ctl.esperar(350)) return;
      } else {
        fase = 'peca';
        dica.textContent = `Você tirou ${dado}. Escolha a peça.`;
        ctl.status('Toque na peça que vai andar', 'voce');
        desenhar(ops);
        jogada = await new Promise((r) => { resolverEscolha = r; });
        resolverEscolha = null;
        if (!jogada) return;
      }
    } else {
      if (!await ctl.esperar(350)) return;
      jogada = ludo.jogadaRobo(estado, cor, dado, ctl.nivel());
      dica.textContent = `${nomes[cor]} tirou ${dado}.`;
    }
    fase = 'movendo';
    desenhar();
    if (!await andar(jogada)) return;
    const r = ludo.aplicar(estado, jogada);
    estado = r.estado;
    if (r.capturadas.length) {
      ctl.som('captura');
      dica.textContent = `${nomes[cor]} capturou ${r.capturadas.map((c) => (c.cor === 0 ? 'uma peça sua' : `uma peça de ${nomes[c.cor]}`)).join(' e ')}!`;
    } else if (r.chegou) {
      ctl.som('acerto');
      dica.textContent = `${nomes[cor]} levou uma peça ao centro.`;
    }
    desenhar();
    if (ludo.terminou(estado, cor)) {
      fase = 'fim';
      dadoEl.disabled = true;
      desenhar();
      ctl.fim(humano ? 'vitoria' : 'derrota', humano ? 'Você levou as 4 peças primeiro! 🎉' : `${nomes[cor]} levou as 4 peças primeiro`, tabuleiro);
      return;
    }
    const extra = dado === 6 || r.capturadas.length > 0 || r.chegou;
    if (extra) {
      if (!await ctl.esperar(250)) return;
      if (!humano) ctl.status(`${nomes[cor]} joga de novo…`, 'robo');
      return proximoTurno();
    }
    return passar(cor, 250);
  }

  async function passar(cor, ms) {
    if (!await ctl.esperar(ms)) return;
    estado = { ...estado, vez: ludo.proxima(estado, cor), seis: 0 };
    proximoTurno();
  }

  async function andar(j) {
    const g = pecasEl[j.cor][j.peca];
    const passos = j.de < 0 ? [0] : Array.from({ length: j.para - j.de }, (_, k) => j.de + k + 1);
    for (const p of passos) {
      const [y, x] = ludo.posicao(j.cor, p, j.peca);
      g.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
      svg.append(g);
      ctl.som('passo');
      if (!await ctl.esperar(j.cor === 0 ? 160 : 260)) return false;
    }
    return true;
  }

  function escolherPeca(cor, peca) {
    if (fase !== 'peca' || cor !== 0 || !resolverEscolha) return;
    const j = ludo.jogadas(estado, 0, estado.dado).find((o) => o.peca === peca);
    if (j) resolverEscolha(j);
  }

  const salvo = ctl.salvo();
  if (salvo?.estado) comecar(salvo.estado.cores.length - 1, salvo.estado);
  else config();

  return {
    reiniciar() {
      resolverEscolha?.(null);
      config();
    },
  };
}
