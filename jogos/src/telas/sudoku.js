import * as sudoku from '../sudoku.js';
import { el, formatarTempo } from '../comum.js';

const NOME_NIVEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };

export function montar(area, ctl) {
  const grade = el('div', 'sudoku');
  const casas = Array.from({ length: 81 }, (_, i) => {
    const b = el('button', 'cs');
    const r = Math.floor(i / 9); const c = i % 9;
    if (c % 3 === 2 && c < 8) b.classList.add('bd');
    if (r % 3 === 2 && r < 8) b.classList.add('bb');
    b.onclick = () => { selecionada = i; ctl.som('clique'); desenhar(); };
    grade.append(b);
    return b;
  });
  const info = el('div', 'info-solo');
  const teclado = el('div', 'teclado');
  const teclas = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
    const b = el('button', 'tecla');
    b.onclick = () => digitar(n);
    teclado.append(b);
    return b;
  });
  const botoes = el('div', 'acoes-solo');
  const notasEl = el('button', 'botao secundario', '✎ Notas');
  const apagarEl = el('button', 'botao secundario', '⌫ Apagar');
  const dicaEl = el('button', 'botao secundario', '🤖 Dica');
  botoes.append(notasEl, apagarEl, dicaEl);
  area.append(info, grade, teclado, botoes);

  let p; let selecionada = null; let modoNotas = false; let relogio = null; let acabou = false;

  const salvar = () => ctl.salvar({ p });
  const fixa = (i) => p.puzzle[i] !== 0;

  function desenhar() {
    const valorSel = selecionada !== null ? p.g[selecionada] : 0;
    casas.forEach((b, i) => {
      const v = p.g[i];
      const notas = p.notas[i];
      b.innerHTML = v ? String(v) : notas ? `<span class="nt">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<i>${notas & (1 << n) ? n : ''}</i>`).join('')}</span>` : '';
      b.classList.toggle('fixa', fixa(i));
      b.classList.toggle('errada', v !== 0 && v !== p.solucao[i]);
      b.classList.toggle('ajudada', p.ajudadas.includes(i));
      b.classList.toggle('sel', i === selecionada);
      b.classList.toggle('area', selecionada !== null && sudoku.VIZINHOS[selecionada].includes(i));
      b.classList.toggle('igual', valorSel !== 0 && v === valorSel && i !== selecionada);
      b.setAttribute('aria-label', `Linha ${Math.floor(i / 9) + 1}, coluna ${(i % 9) + 1}: ${v || 'vazia'}`);
    });
    teclas.forEach((b, k) => {
      const n = k + 1;
      const restam = 9 - p.g.filter((v, i) => v === n && v === p.solucao[i]).length;
      b.innerHTML = `${n}<small>${restam || '✓'}</small>`;
      b.disabled = restam === 0 || acabou;
    });
    notasEl.classList.toggle('ligado', modoNotas);
    notasEl.textContent = modoNotas ? '✎ Notas: sim' : '✎ Notas: não';
    desenharInfo();
  }

  function desenharInfo() {
    info.innerHTML = `<span>Nível <b>${NOME_NIVEL[p.nivel]}</b></span><span>Erros <b>${p.erros}</b></span><span>Tempo <b>${formatarTempo(p.tempo)}</b></span>`;
  }

  function digitar(n) {
    if (acabou || selecionada === null || fixa(selecionada)) return;
    const i = selecionada;
    if (p.g[i] === p.solucao[i]) return;
    if (modoNotas) {
      if (p.g[i]) return;
      p.notas[i] ^= 1 << n;
      ctl.som('clique');
    } else {
      p.g[i] = n;
      p.notas[i] = 0;
      if (n === p.solucao[i]) {
        for (const j of sudoku.VIZINHOS[i]) p.notas[j] &= ~(1 << n);
        ctl.som('acerto');
      } else {
        p.erros++;
        ctl.som('erro');
      }
    }
    salvar();
    desenhar();
    verificar();
  }

  function apagar() {
    if (acabou || selecionada === null || fixa(selecionada)) return;
    if (p.g[selecionada] === p.solucao[selecionada]) return;
    p.g[selecionada] = 0;
    p.notas[selecionada] = 0;
    ctl.som('clique');
    salvar();
    desenhar();
  }

  function dica() {
    if (acabou) return;
    let i = selecionada;
    if (i === null || p.g[i] === p.solucao[i]) {
      const vazias = p.g.map((v, k) => (v !== p.solucao[k] ? k : -1)).filter((k) => k >= 0);
      if (!vazias.length) return;
      // o robô escolhe a casa com menos possibilidades
      vazias.sort((a, b) => sudoku.permitidos(p.g.map((v, k) => (v === p.solucao[k] ? v : 0)), a).length
        - sudoku.permitidos(p.g.map((v, k) => (v === p.solucao[k] ? v : 0)), b).length);
      i = vazias[0];
    }
    p.g[i] = p.solucao[i];
    p.notas[i] = 0;
    p.ajudadas.push(i);
    for (const j of sudoku.VIZINHOS[i]) p.notas[j] &= ~(1 << p.g[i]);
    selecionada = i;
    ctl.som('acerto');
    ctl.status(`Robô: aqui vai um ${p.g[i]}`, 'robo');
    salvar();
    desenhar();
    verificar();
  }

  function verificar() {
    if (!sudoku.completo(p.g, p.solucao)) return;
    acabou = true;
    clearInterval(relogio);
    selecionada = null;
    desenhar();
    const extras = [p.erros ? `${p.erros} erro${p.erros > 1 ? 's' : ''}` : 'sem erros', p.ajudadas.length ? `${p.ajudadas.length} dica${p.ajudadas.length > 1 ? 's' : ''}` : null].filter(Boolean).join(', ');
    ctl.fim('vitoria', `Sudoku resolvido em ${formatarTempo(p.tempo)} (${extras}) 🎉`, grade, { tempo: p.tempo, nivel: p.nivel });
  }

  notasEl.onclick = () => { modoNotas = !modoNotas; ctl.som('clique'); desenhar(); };
  apagarEl.onclick = apagar;
  dicaEl.onclick = dica;

  const teclas_ = (e) => {
    if (!grade.isConnected) { document.removeEventListener('keydown', teclas_); return; }
    if (/^[1-9]$/.test(e.key)) digitar(Number(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') apagar();
    else if (e.key.toLowerCase() === 'n') notasEl.onclick();
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const i = selecionada ?? 40;
      const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      const j = i + d;
      if (j >= 0 && j < 81 && !(Math.abs(d) === 1 && Math.floor(j / 9) !== Math.floor(i / 9))) selecionada = j;
      desenhar();
    }
  };
  document.addEventListener('keydown', teclas_);

  function iniciarRelogio() {
    clearInterval(relogio);
    const ativa = ctl.ativa();
    relogio = setInterval(() => {
      if (!ativa() || acabou) { clearInterval(relogio); return; }
      if (document.hidden) return;
      p.tempo++;
      desenharInfo();
      if (p.tempo % 5 === 0) salvar();
    }, 1000);
  }

  function iniciar(salvo) {
    acabou = false; selecionada = null; modoNotas = false;
    grade.querySelector('.faixa-fim')?.remove();
    if (salvo?.p) p = salvo.p;
    else {
      const nivel = ctl.nivel();
      const { puzzle, solucao } = sudoku.gerar(nivel);
      p = { puzzle, solucao, g: puzzle.slice(), notas: Array(81).fill(0), erros: 0, tempo: 0, nivel, ajudadas: [] };
      salvar();
    }
    desenhar();
    iniciarRelogio();
    ctl.status(salvo ? 'Partida retomada' : 'Escolha uma casa e um número', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
