// Tela do Junta Números: deslize para juntar blocos iguais até chegar na meta.
import { el } from '../comum.js';
import { prefs } from '../dados.js';
import * as nm from '../numeros.js';

export const INFO = {
  id: 'numeros',
  nome: 'Junta Números',
  descricao: 'Some os blocos até 2048',
  solo: true,
  rotuloNivel: 'Tamanho da próxima grade',
  regras: [
    'Deslize o dedo na grade (ou use as setas do teclado) e todos os blocos andam para aquele lado até onde der.',
    'Dois blocos com o mesmo número que se encontram viram um só, com a soma: 2 + 2 = 4, 4 + 4 = 8… O valor do bloco novo entra nos pontos.',
    'A cada jogada aparece um bloco novo, 2 ou 4, numa casa vazia.',
    'O nível muda o tamanho da grade: fácil 5 × 5 e médio 4 × 4, com meta 2048; difícil 3 × 3, bem apertado, com meta 512.',
    'Chegou na meta? Você venceu e pode continuar jogando para fazer mais pontos. Quando não houver mais jogada, a partida acaba.',
    'O recorde é guardado separado para cada tamanho de grade.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#5b4b8a"/><rect x="1.2" y="1.2" width="4.4" height="4.4" rx=".9" fill="#ffd6e7"/><rect x="6.4" y="1.2" width="4.4" height="4.4" rx=".9" fill="#ff9f43"/><rect x="1.2" y="6.4" width="4.4" height="4.4" rx=".9" fill="#4b7bec"/><rect x="6.4" y="6.4" width="4.4" height="4.4" rx=".9" fill="#fed330"/><g font-family="sans-serif" font-weight="800" text-anchor="middle"><text x="3.4" y="4.4" font-size="2.6" fill="#6b3a4f">2</text><text x="8.6" y="4.4" font-size="2.6" fill="#fff">8</text><text x="3.4" y="9.5" font-size="2.2" fill="#fff">64</text><text x="8.6" y="9.3" font-size="1.5" fill="#7a4a00">2048</text></g></svg>';

export function recorde(nivel = prefs.nivel) {
  let r = 0;
  for (const h of prefs.historico) if (h.j === 'numeros' && (h.n ?? 'medio') === nivel && h.pontos > r) r = h.pontos;
  return r;
}

const NOME_NIVEL = { facil: '5 × 5', medio: '4 × 4', dificil: '3 × 3' };

export function resumo() {
  const n = prefs.historico.filter((h) => h.j === 'numeros').length;
  const r = recorde();
  const fmt = (x) => (x ? x.toLocaleString('pt-BR') : '—');
  return {
    cartao: r ? `<b>${fmt(r)}</b> recorde` : 'Sem partidas ainda',
    placar: `<span class="lado"><span class="avatar voce">🔢</span>Partidas <span class="num">${n}</span></span><span class="x">·</span><span class="lado">Recorde ${NOME_NIVEL[prefs.nivel] ?? ''} <span class="num">${fmt(r)}</span></span>`,
    painel: { valor: fmt(r), rotulo: 'recorde de pontos', sub: `${n} ${n === 1 ? 'partida' : 'partidas'}` },
  };
}

const MS = 120;

export function montar(area, ctl) {
  const topo = el('div', 'nm-topo');
  const cxPontos = el('div', 'nm-caixa', '<span>Pontos</span><b>0</b>');
  const cxRecorde = el('div', 'nm-caixa', '<span>Recorde</span><b>0</b>');
  const cxMeta = el('div', 'nm-caixa meta', '<span>Meta</span><b>2048</b>');
  topo.append(cxPontos, cxRecorde, cxMeta);
  const tabuleiro = el('div', 'nm-tabuleiro');
  tabuleiro.setAttribute('role', 'application');
  tabuleiro.setAttribute('aria-label', 'Grade de números. Deslize ou use as setas.');
  const fundo = el('div', 'nm-fundo');
  const camada = el('div', 'nm-camada');
  tabuleiro.append(fundo, camada);
  const dica = el('div', 'nm-dica', '👆 Deslize para os lados, para cima ou para baixo');
  area.append(topo, tabuleiro, dica);

  let jogo; let acabou = false; let blocos = new Map(); let pendente = null; let aviso = null;
  const animar = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  const valorCss = (v) => (v <= 2048 ? v : 'super');
  function criarBloco(b, classe = '') {
    const d = el('div', `nm-bloco v${valorCss(b.v)} d${String(b.v).length}${classe ? ` ${classe}` : ''}`, `<span>${b.v}</span>`);
    posicionar(d, b.r, b.c);
    camada.append(d);
    blocos.set(b.id, d);
    return d;
  }
  const posicionar = (d, r, c) => { d.style.setProperty('--r', r); d.style.setProperty('--c', c); };

  function placar() {
    const rec = Math.max(recorde(jogo.nivel), jogo.pontos);
    cxPontos.querySelector('b').textContent = jogo.pontos.toLocaleString('pt-BR');
    cxRecorde.querySelector('b').textContent = rec.toLocaleString('pt-BR');
    cxRecorde.classList.toggle('batido', jogo.pontos > 0 && jogo.pontos >= rec && jogo.pontos > recorde(jogo.nivel));
    cxMeta.querySelector('b').textContent = jogo.meta.toLocaleString('pt-BR');
    cxMeta.classList.toggle('feita', jogo.ganhou);
  }

  function desenhar() {
    tabuleiro.style.setProperty('--n', jogo.n);
    fundo.replaceChildren(...Array.from({ length: jogo.n * jogo.n }, () => el('div', 'nm-casa')));
    camada.replaceChildren();
    blocos = new Map();
    for (const b of jogo.blocos) criarBloco(b);
    placar();
  }

  function concluir() { if (pendente) { const f = pendente; pendente = null; f(); } }

  function jogar(direcao) {
    if (acabou || !jogo || aviso) return;
    concluir();
    const r = nm.mover(jogo, direcao);
    if (!r) { tabuleiro.classList.remove(`bate-${direcao}`); void tabuleiro.offsetWidth; tabuleiro.classList.add(`bate-${direcao}`); return; }
    dica.classList.add('some');
    for (const m of r.movidos) { const d = blocos.get(m.id); if (d) posicionar(d, m.r, m.c); }
    const finalizar = () => {
      for (const j of r.juntados) {
        for (const id of j.de) { blocos.get(id)?.remove(); blocos.delete(id); }
        criarBloco(j, animar ? 'junta' : '');
      }
      if (r.novo) criarBloco(r.novo, animar ? 'surge' : '');
    };
    if (animar) { pendente = finalizar; setTimeout(() => { if (pendente === finalizar) concluir(); }, MS); } else finalizar();
    if (r.pontos) {
      ctl.som(r.pontos >= 64 ? 'moeda' : 'acerto');
      if (animar) {
        const p = el('div', 'nm-mais', `+${r.pontos}`);
        cxPontos.append(p);
        setTimeout(() => p.remove(), 700);
      }
    } else ctl.som('passo');
    placar();
    depois();
    ctl.salvar(jogo);
  }

  function depois() {
    if (!jogo.ganhou && nm.chegouNaMeta(jogo)) {
      jogo.ganhou = true;
      placar();
      mostrarVitoria();
      return;
    }
    if (!nm.podeMover(jogo)) {
      acabou = true;
      concluir();
      const pts = jogo.pontos.toLocaleString('pt-BR');
      const rec = jogo.pontos > recorde(jogo.nivel) ? ' Recorde! 🏅' : '';
      if (jogo.ganhou) ctl.fim('vitoria', `Fim de jogo: ${pts} pontos!${rec}`, tabuleiro, { n: jogo.nivel, pontos: jogo.pontos, maior: nm.maior(jogo) });
      else ctl.fim('derrota', `Sem jogadas: ${pts} pontos.${rec}`, tabuleiro, { n: jogo.nivel, pontos: jogo.pontos, maior: nm.maior(jogo) });
      placar();
      return;
    }
    const m = nm.maior(jogo);
    if (m >= jogo.meta / 2 && !jogo.ganhou) ctl.status(`Quase lá! Junte dois ${m} para chegar em ${jogo.meta} 🎯`, 'voce');
    else if (jogo.jogadas === 1) ctl.status('Isso! Junte os números iguais', 'voce');
  }

  function mostrarVitoria() {
    ctl.som('vitoria');
    ctl.status(`Você fez ${jogo.meta}! 🎉`, 'vitoria');
    aviso = el('div', 'nm-aviso', `<div class="nm-aviso-caixa"><div class="nm-estrela">🌟</div><b>Você fez ${jogo.meta}!</b><p>Quer continuar juntando para fazer mais pontos?</p><div class="nm-aviso-botoes"></div></div>`);
    const seguir = el('button', 'botao', 'Continuar jogando');
    const parar = el('button', 'botao secundario', 'Terminar aqui');
    aviso.querySelector('.nm-aviso-botoes').append(seguir, parar);
    seguir.onclick = () => { aviso.remove(); aviso = null; ctl.som('clique'); ctl.status('Vamos ver até onde você chega!', 'voce'); if (!nm.podeMover(jogo)) depois(); };
    parar.onclick = () => {
      aviso.remove(); aviso = null; acabou = true;
      ctl.fim('vitoria', `Você chegou em ${jogo.meta} com ${jogo.pontos.toLocaleString('pt-BR')} pontos! 🎉`, tabuleiro, { n: jogo.nivel, pontos: jogo.pontos, maior: nm.maior(jogo) });
      placar();
    };
    tabuleiro.append(aviso);
  }

  // ---------- gestos e teclado ----------
  let toque = null;
  tabuleiro.addEventListener('pointerdown', (ev) => { if (aviso || acabou) return; toque = { x: ev.clientX, y: ev.clientY, id: ev.pointerId }; tabuleiro.setPointerCapture?.(ev.pointerId); });
  tabuleiro.addEventListener('pointerup', (ev) => {
    if (!toque || toque.id !== ev.pointerId) return;
    const dx = ev.clientX - toque.x; const dy = ev.clientY - toque.y; toque = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) jogar(dx > 0 ? 'direita' : 'esquerda'); else jogar(dy > 0 ? 'baixo' : 'cima');
  });
  tabuleiro.addEventListener('pointercancel', () => { toque = null; });
  const TECLAS = { ArrowLeft: 'esquerda', ArrowRight: 'direita', ArrowUp: 'cima', ArrowDown: 'baixo', a: 'esquerda', d: 'direita', w: 'cima', s: 'baixo' };
  const aoTeclar = (ev) => {
    if (!document.body.contains(tabuleiro)) { document.removeEventListener('keydown', aoTeclar); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const d = TECLAS[ev.key] ?? TECLAS[ev.key?.toLowerCase()];
    if (d) { ev.preventDefault(); jogar(d); }
  };
  document.addEventListener('keydown', aoTeclar);

  function iniciar(salvo) {
    acabou = false; pendente = null; aviso?.remove(); aviso = null;
    dica.classList.remove('some');
    jogo = salvo?.blocos ? salvo : nm.novoJogo(ctl.nivel());
    desenhar();
    if (salvo?.blocos) { ctl.status('Partida retomada', 'voce'); dica.classList.add('some'); } else ctl.status(`Grade ${NOME_NIVEL[jogo.nivel]}: chegue no ${jogo.meta}!`, 'voce');
    if (!salvo) ctl.salvar(jogo);
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
