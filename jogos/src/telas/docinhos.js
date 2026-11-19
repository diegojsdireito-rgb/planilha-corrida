import * as doce from '../docinhos.js';
import { el } from '../comum.js';
import { prefs } from '../dados.js';
import { retrato } from '../personagem.js';

// Cada tipo tem forma e cor próprias: dá para distinguir mesmo sem enxergar bem as cores.
const DESENHO = [
  // 0 coração de morango
  '<path d="M50 84 C20 62 12 44 22 30 C32 17 46 22 50 33 C54 22 68 17 78 30 C88 44 80 62 50 84Z" fill="#ef4b5f"/><path d="M30 34 q6 -8 14 -2" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>',
  // 1 pirulito de laranja
  '<circle cx="50" cy="50" r="34" fill="#ff9a1f"/><path d="M50 50 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 12 a18 18 0 1 1 -18 -18 a24 24 0 1 1 24 24" fill="none" stroke="#ffd08a" stroke-width="5" stroke-linecap="round"/>',
  // 2 estrela de limão
  '<path d="M50 12 L61 38 L89 40 L67 58 L74 86 L50 71 L26 86 L33 58 L11 40 L39 38Z" fill="#ffd21f" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/><circle cx="42" cy="40" r="5" fill="#fff" opacity=".7"/>',
  // 3 bala de menta embrulhada
  '<path d="M8 36 L24 44 L24 56 L8 64Z M92 36 L76 44 L76 56 L92 64Z" fill="#7fdc9a"/><rect x="22" y="28" width="56" height="44" rx="20" fill="#2fb66a"/><path d="M34 30 v40 M50 30 v40 M66 30 v40" stroke="#bff2cf" stroke-width="5" opacity=".8"/>',
  // 4 gota de mirtilo
  '<path d="M50 12 C66 36 80 50 80 64 A30 30 0 0 1 20 64 C20 50 34 36 50 12Z" fill="#3e8bff"/><ellipse cx="40" cy="58" rx="7" ry="10" fill="#fff" opacity=".55"/>',
  // 5 diamante de uva
  '<path d="M50 12 L84 42 L50 88 L16 42Z" fill="#9b5cf6"/><path d="M16 42 H84 M50 12 L36 42 L50 88 L64 42Z" fill="none" stroke="#d7c2ff" stroke-width="3" stroke-linejoin="round"/>',
];
const ARCOIRIS = '<circle cx="50" cy="50" r="36" fill="#5b3a29"/>' + Array.from({ length: 14 }, (_, k) => {
  const a = k * 2.4;
  const r = 10 + (k % 4) * 6;
  const cores = ['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6'];
  return `<rect x="${(50 + Math.cos(a) * r - 5).toFixed(1)}" y="${(50 + Math.sin(a) * r - 2).toFixed(1)}" width="10" height="4" rx="2" fill="${cores[k % 6]}" transform="rotate(${(k * 47) % 180} ${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)})"/>`;
}).join('');
const NOME_TIPO = ['coração vermelho', 'pirulito laranja', 'estrela amarela', 'bala verde', 'gota azul', 'diamante roxo'];
const NOME_ESPECIAL = { linha: 'listrado na horizontal', coluna: 'listrado na vertical', bomba: 'bomba', arcoiris: 'arco-íris' };

function svgDoce(d) {
  if (d.especial === 'arcoiris') return `<svg viewBox="0 0 100 100">${ARCOIRIS}</svg>`;
  let extra = '';
  if (d.especial === 'linha') extra = '<path d="M14 44 H86 M14 56 H86" stroke="#fff" stroke-width="6" opacity=".9" stroke-linecap="round"/>';
  if (d.especial === 'coluna') extra = '<path d="M44 14 V86 M56 14 V86" stroke="#fff" stroke-width="6" opacity=".9" stroke-linecap="round"/>';
  if (d.especial === 'bomba') extra = '<circle cx="50" cy="50" r="44" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="10 7"/>';
  return `<svg viewBox="0 0 100 100">${DESENHO[d.tipo]}${extra}</svg>`;
}

const ELOGIOS = ['Doce!', 'Uau!', 'Que delícia!', 'Incrível!', 'Demais!'];

export function nivelLiberado() {
  let n = 1;
  for (const h of prefs.historico) if (h.j === 'docinhos' && h.r === 'vitoria' && h.nivel >= n) n = h.nivel + 1;
  return n;
}
const estrelasDoNivel = (n) => Math.max(0, ...prefs.historico.filter((h) => h.j === 'docinhos' && h.nivel === n).map((h) => h.estrelas ?? 0));

export function montar(area, ctl) {
  const topo = el('div', 'doce-topo');
  const mascote = el('div', 'mascote');
  const fala = el('div', 'balao');
  const placar = el('div', 'doce-placar');
  topo.append(mascote, placar);
  const tabuleiro = el('div', 'doce-grade');
  tabuleiro.setAttribute('role', 'grid');
  tabuleiro.setAttribute('aria-label', 'Tabuleiro de doces');
  const fases = el('div', 'doce-fases');
  const botoes = el('div', 'acoes-solo');
  const dicaEl = el('button', 'botao secundario', '🤖 Dica do robô');
  botoes.append(dicaEl);
  area.append(topo, fases, tabuleiro, botoes);
  mascote.append(fala);

  let f; let grade; let pontos; let movimentos; let ocupado = false; let acabou = false;
  let selecionada = null; let ocioso = null;
  const elementos = new Map();

  const desenharMascote = (humor = 'feliz') => {
    mascote.innerHTML = retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso: humor });
    mascote.append(fala);
  };
  const falar = (texto) => {
    fala.textContent = texto;
    fala.classList.remove('mostra');
    void fala.offsetWidth;
    fala.classList.add('mostra');
  };

  function desenharPlacar() {
    const pct = Math.min(1, pontos / (f.meta * 2));
    const marcas = [1, 1.5, 2].map((m) => `<i style="left:${(m / 2) * 100}%" class="${pontos >= f.meta * m ? 'ok' : ''}">★</i>`).join('');
    placar.innerHTML = `
      <div class="linha-placar"><span>Pontos</span><span>Movimentos <b class="${movimentos <= 3 ? 'poucos' : ''}">${movimentos}</b></span></div>
      <div class="pontos-doce">${pontos.toLocaleString('pt-BR')}<small> / meta ${f.meta.toLocaleString('pt-BR')}</small></div>
      <div class="barra-meta"><span style="width:${pct * 100}%"></span>${marcas}</div>`;
  }

  function desenharFases() {
    const liberado = nivelLiberado();
    fases.innerHTML = '';
    const ant = el('button', 'botao-icone', '‹');
    ant.setAttribute('aria-label', 'Fase anterior');
    ant.disabled = f.nivel <= 1 || ocupado;
    ant.onclick = () => { ctl.som('clique'); iniciar(null, f.nivel - 1); };
    const prox = el('button', 'botao-icone', '›');
    prox.setAttribute('aria-label', 'Próxima fase');
    prox.disabled = f.nivel >= liberado || ocupado;
    prox.onclick = () => { ctl.som('clique'); iniciar(null, f.nivel + 1); };
    const est = estrelasDoNivel(f.nivel);
    fases.append(ant, el('span', '', `Fase ${f.nivel} · ${'★'.repeat(est)}${'☆'.repeat(3 - est)}`), prox);
  }

  function posicionar(e, i, linhaInicial = null) {
    const r = linhaInicial ?? Math.floor(i / doce.LADO);
    e.style.transform = `translate(${(i % doce.LADO) * 100}%, ${r * 100}%)`;
  }

  // Sincroniza os elementos com a grade: os existentes deslizam, os novos caem de cima.
  function desenharGrade(animarNovos = true) {
    const vivos = new Set();
    const novosPorColuna = {};
    grade.forEach((d, i) => {
      vivos.add(d.id);
      let e = elementos.get(d.id);
      if (!e) {
        e = el('button', 'doce');
        e.dataset.id = d.id;
        elementos.set(d.id, e);
        tabuleiro.append(e);
        if (animarNovos) {
          const c = i % doce.LADO;
          novosPorColuna[c] = (novosPorColuna[c] ?? 0) + 1;
          e.style.transition = 'none';
          posicionar(e, i, -novosPorColuna[c] - 0.2);
          void e.offsetWidth;
          e.style.transition = '';
        }
      }
      if (e.dataset.desenho !== `${d.tipo}${d.especial}`) {
        e.innerHTML = svgDoce(d);
        e.dataset.desenho = `${d.tipo}${d.especial}`;
      }
      e.dataset.i = i;
      e.classList.toggle('sel', i === selecionada);
      e.setAttribute('aria-label', `${d.especial ? NOME_ESPECIAL[d.especial] : ''} ${d.especial === 'arcoiris' ? '' : NOME_TIPO[d.tipo]}`.trim());
      posicionar(e, i);
    });
    for (const [id, e] of elementos) if (!vivos.has(id)) { e.remove(); elementos.delete(id); }
  }

  const salvar = () => ctl.salvar({ nivel: f.nivel, grade, pontos, movimentos });

  async function tentar(a, b) {
    if (ocupado || acabou || !doce.vizinhas(a, b)) return;
    pararDica();
    selecionada = null;
    const r = doce.trocar(grade, a, b, f.tipos);
    ocupado = true;
    const ea = elementos.get(grade[a].id); const eb = elementos.get(grade[b].id);
    posicionar(ea, b); posicionar(eb, a);
    ctl.som('clique');
    if (!await ctl.esperar(200)) return;
    if (!r) {
      posicionar(ea, a); posicionar(eb, b);
      ctl.som('erro');
      await ctl.esperar(220);
      ocupado = false;
      desenharGrade(false);
      agendarDica();
      return;
    }
    movimentos--;
    desenharPlacar();
    let passo = 0;
    for (const etapa of r.etapas) {
      if (etapa.embaralhou) {
        falar('Sem jogadas: misturando!');
        tabuleiro.classList.add('mistura');
      }
      for (const id of etapa.removidos) elementos.get(id)?.classList.add('estoura');
      if (etapa.removidos.length) ctl.som(passo === 0 ? (etapa.removidos.length > 4 ? 'captura' : 'estrela') : 'acerto');
      if (!await ctl.esperar(etapa.removidos.length ? 230 : 0)) return;
      for (const id of etapa.removidos) { elementos.get(id)?.remove(); elementos.delete(id); }
      grade = etapa.grade;
      pontos += etapa.pontos;
      desenharGrade();
      desenharPlacar();
      if (passo === 1) { falar(ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)]); desenharMascote('uau'); }
      if (!await ctl.esperar(300)) return;
      tabuleiro.classList.remove('mistura');
      passo++;
    }
    if (etapaComEspecial(r)) falar('Doce especial!');
    desenharMascote();
    ocupado = false;
    if (movimentos <= 0) return terminar();
    salvar();
    agendarDica();
  }

  const etapaComEspecial = (r) => r.etapas.some((e) => e.criados.length);

  function terminar() {
    acabou = true;
    pararDica();
    const est = doce.estrelas(pontos, f.meta);
    const venceu = est > 0;
    desenharMascote(venceu ? 'uau' : 'feliz');
    const cartao = el('div', 'faixa-fim doce-fim', `<div>
      <strong>${venceu ? `Fase ${f.nivel} concluída!` : 'Quase lá!'}</strong>
      <span class="estrelas-fim">${'★'.repeat(est)}${'☆'.repeat(3 - est)}</span>
      <small>${pontos.toLocaleString('pt-BR')} pontos · meta ${f.meta.toLocaleString('pt-BR')}</small>
    </div>`);
    cartao.style.pointerEvents = 'auto';
    const b = el('button', 'botao', venceu ? 'Próxima fase ›' : 'Tentar de novo');
    b.onclick = () => { ctl.som('clique'); cartao.remove(); iniciar(null, venceu ? f.nivel + 1 : f.nivel); };
    cartao.firstChild.append(b);
    ctl.fim(venceu ? 'vitoria' : 'derrota', venceu ? `Fase ${f.nivel} concluída com ${est} estrela${est > 1 ? 's' : ''}!` : `Faltaram ${(f.meta - pontos).toLocaleString('pt-BR')} pontos. Tente de novo!`, null, { nivel: f.nivel, pontos, estrelas: est });
    tabuleiro.append(cartao);
    desenharFases();
  }

  // Dica do robô: depois de um tempo parado, ou no botão.
  function pararDica() {
    clearTimeout(ocioso);
    tabuleiro.querySelectorAll('.dica').forEach((e) => e.classList.remove('dica'));
  }
  function mostrarDica() {
    pararDica();
    const j = doce.encontrarJogada(grade);
    if (!j) return;
    j.forEach((i) => elementos.get(grade[i].id)?.classList.add('dica'));
  }
  function agendarDica() {
    clearTimeout(ocioso);
    const ativa = ctl.ativa();
    ocioso = setTimeout(() => { if (ativa() && !ocupado && !acabou) mostrarDica(); }, 7000);
  }
  dicaEl.onclick = () => { if (!ocupado && !acabou) { ctl.som('clique'); mostrarDica(); falar('Que tal estes dois?'); } };

  // Arrastar um doce para o lado troca; tocar num e depois no vizinho também.
  let inicio = null;
  tabuleiro.addEventListener('pointerdown', (e) => {
    const alvo = e.target.closest('.doce');
    if (!alvo || ocupado || acabou) return;
    inicio = { i: Number(alvo.dataset.i), x: e.clientX, y: e.clientY };
    tabuleiro.setPointerCapture?.(e.pointerId);
  });
  tabuleiro.addEventListener('pointermove', (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.x; const dy = e.clientY - inicio.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
    const i = inicio.i;
    inicio = null;
    const c = i % doce.LADO;
    let j;
    if (Math.abs(dx) > Math.abs(dy)) j = dx > 0 ? (c < 7 ? i + 1 : -1) : (c > 0 ? i - 1 : -1);
    else j = dy > 0 ? i + doce.LADO : i - doce.LADO;
    if (j >= 0 && j < 64) tentar(i, j);
  });
  tabuleiro.addEventListener('pointerup', () => {
    if (!inicio) return;
    const i = inicio.i;
    inicio = null;
    if (selecionada !== null && selecionada !== i && doce.vizinhas(selecionada, i)) { const a = selecionada; selecionada = null; tentar(a, i); return; }
    selecionada = selecionada === i ? null : i;
    ctl.som('clique');
    desenharGrade(false);
  });

  function iniciar(salvo, nivel) {
    pararDica();
    acabou = false; ocupado = false; selecionada = null;
    tabuleiro.querySelectorAll('.faixa-fim').forEach((x) => x.remove());
    for (const e of elementos.values()) e.remove();
    elementos.clear();
    if (salvo?.grade) {
      f = doce.fase(salvo.nivel);
      ({ grade, pontos, movimentos } = salvo);
    } else {
      f = doce.fase(nivel ?? nivelLiberado());
      grade = doce.novaGrade(f.tipos);
      pontos = 0;
      movimentos = f.movimentos;
      ctl.apagar();
    }
    desenharMascote();
    desenharPlacar();
    desenharFases();
    desenharGrade();
    ctl.status(salvo ? 'Partida retomada' : `Faça ${f.meta.toLocaleString('pt-BR')} pontos em ${f.movimentos} movimentos`, 'voce');
    falar(salvo ? 'Vamos continuar!' : f.nivel === 1 ? 'Arraste um doce para trocar!' : `Fase ${f.nivel}!`);
    agendarDica();
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null, f?.nivel) };
}
