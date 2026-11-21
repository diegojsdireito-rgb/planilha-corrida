import * as pac from '../paciencia.js';
import { el, formatarTempo } from '../comum.js';

const FIGURA = { 11: 'J', 12: 'Q', 13: 'K' };

function htmlCarta(c) {
  if (!c.aberta) return '<div class="carta fechada"></div>';
  const v = pac.VALORES[c.n];
  const naipe = pac.NAIPES[c.naipe];
  const meio = FIGURA[c.n] ? `<span class="fig">${FIGURA[c.n]}</span>` : naipe;
  return `<div class="carta ${pac.vermelha(c) ? 'v' : 'p'}"><span class="canto">${v}<br>${naipe}</span><span class="meio">${meio}</span></div>`;
}

export function montar(area, ctl) {
  const mesa = el('div', 'paciencia');
  const topo = el('div', 'topo-cartas');
  const estoqueEl = el('button', 'slot estoque');
  estoqueEl.setAttribute('aria-label', 'Monte: comprar carta');
  const descarteEl = el('div', 'slot descarte');
  const fundEl = [0, 1, 2, 3].map((naipe) => {
    const f = el('div', 'slot fundacao', `<span class="marca">${pac.NAIPES[naipe]}</span>`);
    f.dataset.naipe = naipe;
    return f;
  });
  topo.append(estoqueEl, descarteEl, el('div', 'vago'), ...fundEl);
  const colunasEl = Array.from({ length: 7 }, () => el('div', 'pilha'));
  const mesaCols = el('div', 'colunas');
  mesaCols.append(...colunasEl);
  mesa.append(topo, mesaCols);
  const info = el('div', 'info-solo');
  const botoes = el('div', 'acoes-solo');
  const desfazerEl = el('button', 'botao secundario', '↶ Desfazer');
  const dicaEl = el('button', 'botao secundario', '🤖 Dica do robô');
  botoes.append(desfazerEl, dicaEl);
  area.append(mesa, info, botoes);
  // girar o celular ou mudar o tamanho da janela redistribui as cartas
  const aoMudarTamanho = () => { if (!document.body.contains(mesa)) { window.removeEventListener('resize', aoMudarTamanho); return; } alturaMesa = 0; if (s) desenhar(); };
  window.addEventListener('resize', aoMudarTamanho);

  let alturaMesa = 0;
  let s; let sel = null; let pilha = []; let tempo = 0; let acabou = false; let relogio = null; let terminando = false;

  const salvar = () => ctl.salvar({ s, tempo });
  const mesmo = (a, b) => a && b && a.tipo === b.tipo && a.col === b.col && a.idx === b.idx && a.naipe === b.naipe;

  function desenharInfo() {
    info.innerHTML = `<span>Lances <b>${s.lances}</b></span><span>Tempo <b>${formatarTempo(tempo)}</b></span><span>Na fundação <b>${s.fundacoes.reduce((t, f) => t + f.length, 0)}/52</b></span>`;
  }

  function desenhar() {
    estoqueEl.innerHTML = s.estoque.length ? `<div class="carta fechada"></div><span class="qtd">${s.estoque.length}</span>` : '<span class="recicla">↻</span>';
    estoqueEl.classList.toggle('vazio', !s.estoque.length);
    descarteEl.innerHTML = '';
    // mostra até 3 cartas do descarte levemente abertas em leque
    s.descarte.slice(-3).forEach((c, k, arr) => {
      const w = el('div', 'pos', htmlCarta(c));
      w.style.left = `calc(var(--cw) * ${k * 0.18})`;
      if (k === arr.length - 1) {
        w.classList.add('toque');
        w.classList.toggle('sel', mesmo(sel, { tipo: 'descarte' }));
        w.onclick = (e) => { e.stopPropagation(); tocar({ tipo: 'descarte' }, null); };
      }
      descarteEl.append(w);
    });
    fundEl.forEach((f, naipe) => {
      const lista = s.fundacoes[naipe];
      f.querySelector('.pos')?.remove();
      if (lista.length) {
        const w = el('div', 'pos toque', htmlCarta(lista[lista.length - 1]));
        w.classList.toggle('sel', mesmo(sel, { tipo: 'fundacao', naipe }));
        w.onclick = (e) => { e.stopPropagation(); tocar({ tipo: 'fundacao', naipe }, { tipo: 'fundacao' }); };
        f.append(w);
      }
      f.onclick = () => tocar(null, { tipo: 'fundacao' });
    });
    // A mesa tem altura fixa (medida uma vez pela tela, não pelas cartas): o fundo verde não
    // cresce nem encolhe durante a partida. As cartas é que se aproximam quando a coluna fica comprida.
    const cw = (mesaCols.clientWidth - 6 * parseFloat(getComputedStyle(mesa).getPropertyValue('--gap') || 4)) / 7 || 50;
    if (!alturaMesa) {
      const topo = mesaCols.getBoundingClientRect().top + window.scrollY;
      alturaMesa = Math.round(Math.max(cw * 5.2, window.innerHeight - topo - 170));
      mesaCols.style.height = `${alturaMesa}px`;
    }
    const livre = alturaMesa / cw - 1.4;
    const alturaDe = (col, ab, fe) => col.slice(0, -1).reduce((t, c) => t + (c.aberta ? ab : fe), 0);
    let aberta = 0.7; let fechada = 0.28;
    const maior = Math.max(...s.colunas.map((col) => alturaDe(col, aberta, fechada)));
    if (maior > livre) { const k = livre / maior; aberta *= k; fechada *= Math.max(0.6, k); }
    colunasEl.forEach((colEl, c) => {
      colEl.innerHTML = '';
      let topoY = 0;
      const col = s.colunas[c];
      const selecionada = sel?.tipo === 'coluna' && sel.col === c ? sel.idx : Infinity;
      col.forEach((carta, idx) => {
        const w = el('div', 'pos', htmlCarta(carta));
        w.style.top = `calc(var(--cw) * ${topoY})`;
        w.style.zIndex = idx + 1;
        if (idx >= selecionada) w.classList.add('sel');
        if (carta.aberta) {
          w.classList.add('toque');
          w.onclick = (e) => { e.stopPropagation(); tocar({ tipo: 'coluna', col: c, idx }, { tipo: 'coluna', col: c }); };
        }
        colEl.append(w);
        if (idx < col.length - 1) topoY += carta.aberta ? aberta : fechada;
      });
      colEl.style.height = `calc(var(--cw) * ${topoY + 1.4})`;
      colEl.onclick = () => tocar(null, { tipo: 'coluna', col: c });
    });
    desfazerEl.disabled = !pilha.length || acabou;
    desenharInfo();
  }

  function aplicar(n, som = 'carta') {
    pilha.push(s);
    if (pilha.length > 300) pilha.shift();
    s = n;
    sel = null;
    ctl.som(som);
    iniciarRelogio();
    salvar();
    desenhar();
    verificar();
  }

  function tocar(o, destinoDoAlvo) {
    if (acabou || terminando) return;
    if (sel && destinoDoAlvo && !mesmo(sel, o)) {
      const n = pac.mover(s, sel, destinoDoAlvo);
      if (n) return aplicar(n);
    }
    if (sel && mesmo(sel, o)) { sel = null; desenhar(); return; }
    sel = null;
    if (o) {
      const d = pac.destinoAutomatico(s, o);
      if (d) return aplicar(pac.mover(s, o, d));
      sel = o;
      ctl.som('clique');
    }
    desenhar();
  }

  estoqueEl.onclick = () => {
    if (acabou || terminando) return;
    const n = pac.comprar(s);
    if (n) aplicar(n);
  };

  desfazerEl.onclick = () => {
    if (!pilha.length || acabou) return;
    s = pilha.pop();
    sel = null;
    ctl.som('clique');
    salvar();
    desenhar();
  };

  dicaEl.onclick = () => {
    if (acabou) return;
    const d = pac.dica(s);
    document.querySelectorAll('.paciencia .dica').forEach((e) => e.classList.remove('dica'));
    if (!d) { ctl.status('O robô não encontrou lances. Que tal uma nova partida?', 'robo'); return; }
    ctl.som('clique');
    let alvos = [];
    if (d.comprar) { alvos = [estoqueEl]; ctl.status(s.estoque.length ? 'Robô: compre uma carta do monte' : 'Robô: vire o descarte de volta para o monte', 'robo'); }
    else {
      const o = d.origem;
      if (o.tipo === 'descarte') alvos.push(descarteEl.lastChild);
      else alvos.push(colunasEl[o.col].children[o.idx]);
      alvos.push(d.destino.tipo === 'fundacao' ? fundEl[pac.cartasDe(s, o)[0].naipe] : colunasEl[d.destino.col]);
      ctl.status('Robô: que tal este lance?', 'robo');
    }
    alvos.forEach((a) => a?.classList.add('dica'));
    setTimeout(() => alvos.forEach((a) => a?.classList.remove('dica')), 1800);
  };

  async function verificar() {
    if (pac.venceu(s)) {
      acabou = true;
      clearInterval(relogio);
      desenhar();
      ctl.fim('vitoria', `Paciência resolvida em ${s.lances} lances e ${formatarTempo(tempo)} 🎉`, mesa, { tempo });
      return;
    }
    if (pac.podeTerminarSozinho(s) && !terminando) {
      terminando = true;
      ctl.status('Todas as cartas abertas: terminando sozinho…', 'voce');
      while (!pac.venceu(s)) {
        if (!await ctl.esperar(110)) return;
        let feito = false;
        for (let c = 0; c < 7 && !feito; c++) {
          const col = s.colunas[c];
          if (!col.length) continue;
          const n = pac.mover(s, { tipo: 'coluna', col: c, idx: col.length - 1 }, { tipo: 'fundacao' });
          if (n) { s = n; feito = true; }
        }
        ctl.som('carta');
        desenhar();
      }
      terminando = false;
      verificar();
    }
  }

  function iniciarRelogio() {
    if (relogio || acabou) return;
    const ativa = ctl.ativa();
    relogio = setInterval(() => {
      if (!ativa() || acabou) { clearInterval(relogio); relogio = null; return; }
      if (document.hidden) return;
      tempo++;
      desenharInfo();
      if (tempo % 5 === 0) salvar();
    }, 1000);
  }

  function iniciar(salvo) {
    clearInterval(relogio); relogio = null;
    acabou = false; terminando = false; sel = null; pilha = [];
    if (salvo) { s = salvo.s; tempo = salvo.tempo ?? 0; iniciarRelogio(); } else { s = pac.novo(); tempo = 0; }
    desenhar();
    ctl.status(salvo ? 'Partida retomada' : 'Toque numa carta para movê-la; toque no monte para comprar', 'voce');
    verificar();
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
