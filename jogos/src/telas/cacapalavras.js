// Tela do Caça-Palavras: arraste o dedo do começo ao fim de cada palavra escondida.
import { el, svgEl, formatarTempo } from '../comum.js';
import * as cp from '../cacapalavras.js';
import { temaPorId } from '../palavras.js';

export const INFO = {
  id: 'cacapalavras',
  nome: 'Caça-Palavras',
  descricao: 'Ache as palavras escondidas',
  solo: true,
  rotuloNivel: 'Tamanho da próxima grade',
  regras: [
    'Cada grade tem um tema (frutas, animais, cores, escola…) e as palavras dele estão escondidas entre as letras.',
    'Arraste o dedo da primeira até a última letra da palavra. Também dá para tocar na primeira letra e depois na última.',
    'A palavra achada ganha um traço colorido e fica riscada na lista. Na grade as letras não têm acento.',
    'Fácil: grade 8 × 8 com 6 palavras deitadas ou em pé. Médio: 10 × 10 com diagonais. Difícil: 12 × 12, com palavras até de trás para frente.',
    'Use 💡 Dica para a primeira letra de uma palavra piscar (soma 10 segundos no tempo).',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#fff4d6"/><g font-family="sans-serif" font-weight="700" font-size="2.3" text-anchor="middle" fill="#6b5a3a"><text x="2.4" y="3.4">G</text><text x="6" y="3.4">B</text><text x="9.6" y="3.4">O</text><text x="2.4" y="6.9">L</text><text x="6" y="6.9">U</text><text x="9.6" y="6.9">A</text><text x="2.4" y="10.4">E</text><text x="6" y="10.4">S</text><text x="9.6" y="10.4">R</text></g><path d="M2.4 6.1H9.6" stroke="#ff5c8a" stroke-width="2.2" stroke-linecap="round" opacity=".45"/><path d="M2.4 2.6 9.6 9.6" stroke="#3e8bff" stroke-width="2.2" stroke-linecap="round" opacity=".4"/></svg>';

const capitular = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function montar(area, ctl) {
  const topo = el('div', 'cp-topo');
  const tema = el('div', 'cp-tema');
  const info = el('div', 'cp-info');
  const bDica = el('button', 'cp-botao', '💡<span>Dica</span>');
  bDica.setAttribute('aria-label', 'Dica: pisca a primeira letra de uma palavra');
  topo.append(tema, info, bDica);

  const mesa = el('div', 'cp-mesa');
  const grade = el('div', 'cp-grade');
  const tracos = svgEl('svg', { class: 'cp-tracos', 'aria-hidden': 'true' });
  mesa.append(tracos, grade);
  const lista = el('ul', 'cp-lista');
  area.append(topo, mesa, lista);

  let jogo; let acabou = false; let inicio = 0; let relogio = null;
  let celulas = []; let traco = null; let toqueInicio = null; let arraste = null;
  let ultimoTema = null; const itens = new Map();

  const tempoAgora = () => jogo.tempo + (acabou || !inicio ? 0 : (Date.now() - inicio) / 1000);
  const salvar = () => ctl.salvar({ ...jogo, tempo: tempoAgora() });

  function escrever() {
    const achadas = jogo.palavras.filter((p) => p.achada).length;
    info.innerHTML = `<b>${achadas}</b>/${jogo.palavras.length} · ⏱ ${formatarTempo(Math.floor(tempoAgora()))}`;
  }

  function desenharLista() {
    lista.replaceChildren(); itens.clear();
    for (const w of jogo.palavras) {
      const li = el('li', `cp-item${w.achada ? ' achada' : ''}`, `<span class="cp-fig">${w.emoji}</span><span class="cp-pal">${capitular(w.palavra)}</span>`);
      li.style.setProperty('--cor', w.cor);
      li.setAttribute('aria-label', `${w.palavra}${w.achada ? ', achada' : ''}`);
      itens.set(w, li);
      lista.append(li);
    }
  }

  function linha(w, classe = 'cp-achado') {
    const [rf, cf] = cp.fimDaPalavra(w);
    return svgEl('line', { x1: w.c + 0.5, y1: w.r + 0.5, x2: cf + 0.5, y2: rf + 0.5, stroke: w.cor, class: classe });
  }

  function desenhar() {
    const n = jogo.n;
    mesa.style.setProperty('--n', n);
    tracos.setAttribute('viewBox', `0 0 ${n} ${n}`);
    tracos.replaceChildren();
    for (const w of jogo.palavras) if (w.achada) tracos.append(linha(w));
    traco = svgEl('line', { class: 'cp-selecao', x1: 0, y1: 0, x2: 0, y2: 0, visibility: 'hidden' });
    tracos.append(traco);
    grade.replaceChildren();
    celulas = [];
    jogo.grade.forEach((ln, r) => {
      celulas.push([]);
      [...ln].forEach((letra) => { const d = el('div', 'cp-letra', letra); grade.append(d); celulas[r].push(d); });
    });
    const t = temaPorId(jogo.tema);
    tema.innerHTML = `<span class="cp-tema-fig">${t.emoji}</span><span>${t.nome}</span>`;
    desenharLista();
    escrever();
  }

  // ---------- seleção ----------
  function casaDe(ev, exata = true) {
    const r = mesa.getBoundingClientRect();
    const lado = r.width / jogo.n;
    const x = (ev.clientX - r.left) / lado; const y = (ev.clientY - r.top) / lado;
    if (exata) return [Math.min(jogo.n - 1, Math.max(0, Math.floor(y))), Math.min(jogo.n - 1, Math.max(0, Math.floor(x)))];
    return [y - 0.5, x - 0.5];
  }
  function mostrarSelecao(r1, c1, r2, c2) {
    traco.setAttribute('x1', c1 + 0.5); traco.setAttribute('y1', r1 + 0.5);
    traco.setAttribute('x2', c2 + 0.5); traco.setAttribute('y2', r2 + 0.5);
    traco.setAttribute('visibility', 'visible');
    for (const ln of celulas) for (const d of ln) d.classList.remove('marcada');
    const dr = Math.sign(r2 - r1); const dc = Math.sign(c2 - c1);
    const passos = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    for (let i = 0; i <= passos; i++) celulas[r1 + dr * i]?.[c1 + dc * i]?.classList.add('marcada');
  }
  function limparSelecao() {
    traco.setAttribute('visibility', 'hidden');
    for (const ln of celulas) for (const d of ln) d.classList.remove('marcada', 'inicio');
  }

  function tentar(r1, c1, r2, c2) {
    const w = cp.conferir(jogo, r1, c1, r2, c2);
    limparSelecao();
    if (!w) {
      if (r1 !== r2 || c1 !== c2) { ctl.som('erro'); ctl.status('Hum, essa não é. Tente de novo!', ''); }
      return;
    }
    const l = linha(w, 'cp-achado novo');
    tracos.insertBefore(l, traco);
    itens.get(w)?.classList.add('achada', 'agora');
    for (const ln of celulas) for (const d of ln) d.classList.remove('pisca');
    ctl.som('acerto');
    if (cp.terminou(jogo)) { vencer(); return; }
    const faltam = jogo.palavras.filter((p) => !p.achada).length;
    ctl.status(`${w.emoji} ${capitular(w.palavra)}! Falta${faltam > 1 ? 'm' : ''} ${faltam}`, 'voce');
    escrever();
    salvar();
  }

  mesa.addEventListener('pointerdown', (ev) => {
    if (acabou || !jogo) return;
    ev.preventDefault();
    if (!inicio) inicio = Date.now();
    mesa.setPointerCapture?.(ev.pointerId);
    const [r, c] = casaDe(ev);
    arraste = { r, c, id: ev.pointerId, mexeu: false, fim: [r, c] };
    mostrarSelecao(r, c, r, c);
  });
  mesa.addEventListener('pointermove', (ev) => {
    if (!arraste || ev.pointerId !== arraste.id) return;
    const [y, x] = casaDe(ev, false);
    const fim = cp.alinhar(arraste.r, arraste.c, y, x, jogo.n);
    if (fim[0] !== arraste.fim[0] || fim[1] !== arraste.fim[1]) { arraste.fim = fim; arraste.mexeu = true; ctl.som('passo'); }
    mostrarSelecao(arraste.r, arraste.c, ...fim);
  });
  const soltar = (ev) => {
    if (!arraste || ev.pointerId !== arraste.id) return;
    const { r, c, fim } = arraste; arraste = null;
    if (fim[0] !== r || fim[1] !== c) { toqueInicio = null; tentar(r, c, ...fim); return; }
    // Toque simples: primeira letra, depois a última.
    if (toqueInicio && (toqueInicio[0] !== r || toqueInicio[1] !== c)) {
      const [r0, c0] = toqueInicio; toqueInicio = null;
      const [ar, ac] = cp.alinhar(r0, c0, r, c, jogo.n);
      if (ar === r && ac === c) { tentar(r0, c0, r, c); return; }
    }
    limparSelecao();
    toqueInicio = [r, c];
    celulas[r][c].classList.add('inicio');
    ctl.status('Agora toque na última letra (ou arraste)', 'voce');
  };
  mesa.addEventListener('pointerup', soltar);
  mesa.addEventListener('pointercancel', (ev) => { if (arraste?.id === ev.pointerId) { arraste = null; limparSelecao(); } });

  bDica.onclick = () => {
    if (acabou || !jogo) return;
    const w = cp.dica(jogo);
    if (!w) return;
    if (!inicio) inicio = Date.now();
    for (const ln of celulas) for (const d of ln) d.classList.remove('pisca');
    const alvo = celulas[w.r][w.c];
    void alvo.offsetWidth;
    alvo.classList.add('pisca');
    jogo.tempo += 10; jogo.dicas++;
    ctl.som('clique');
    ctl.status(`${w.emoji} começa na letra piscando (+10 s)`, 'voce');
    escrever(); salvar();
  };

  function vencer() {
    acabou = true;
    const tempo = Math.round(tempoAgora());
    jogo.tempo = tempo;
    clearInterval(relogio);
    escrever();
    mesa.classList.add('venceu');
    ctl.fim('vitoria', `Você achou todas as palavras em ${formatarTempo(tempo)}! 🎉`, mesa, { n: jogo.nivel, tempo, dicas: jogo.dicas });
  }

  function iniciar(salvo) {
    acabou = false; inicio = 0; toqueInicio = null; arraste = null;
    mesa.classList.remove('venceu');
    if (salvo?.grade) jogo = salvo;
    else {
      let novo = cp.novoJogo(ctl.nivel());
      for (let k = 0; k < 6 && novo.tema === ultimoTema; k++) novo = cp.novoJogo(ctl.nivel());
      jogo = novo;
    }
    ultimoTema = jogo.tema;
    clearInterval(relogio);
    relogio = setInterval(() => { if (!document.body.contains(mesa)) { clearInterval(relogio); return; } if (inicio && !acabou) escrever(); }, 1000);
    desenhar();
    const t = temaPorId(jogo.tema);
    if (salvo?.grade) ctl.status('Partida retomada', 'voce');
    else ctl.status(`Tema ${t.nome} ${t.emoji}: ache as ${jogo.palavras.length} palavras!`, 'voce');
    if (!salvo) salvar();
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
