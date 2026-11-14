import * as reversi from '../reversi.js';
import { el } from '../comum.js';

export function montar(area, ctl) {
  const grade = el('div', 'oito reversi');
  const qs = Array.from({ length: 64 }, (_, i) => {
    const b = el('button', 'q');
    b.setAttribute('aria-label', `Casa ${String.fromCharCode(97 + (i & 7))}${8 - (i >> 3)}`);
    b.onclick = () => clicar(i);
    grade.append(b);
    return b;
  });
  const contagem = el('div', 'contagem');
  area.append(grade, contagem);
  let t; let vez; let acabou; let ultimo = -1; let anterior = null;

  const salvar = () => ctl.salvar({ t, vez, ultimo });

  function desenhar() {
    const ops = vez === 1 && !acabou ? reversi.jogadas(t, 1) : new Map();
    qs.forEach((b, i) => {
      const v = t[i];
      let classe = '';
      if (v) {
        classe = `disco d${v}`;
        if (anterior && anterior[i] && anterior[i] !== v) classe += ' vira';
        else if (anterior && !anterior[i]) classe += ' novo';
      }
      b.innerHTML = v ? `<span class="${classe}"></span>` : ops.has(i) ? '<span class="dica"></span>' : '';
      b.disabled = !ops.has(i);
      b.classList.toggle('ultimo', i === ultimo);
    });
    const c = reversi.contagem(t);
    contagem.innerHTML = `<span><i style="background:#15171c"></i>Você ${c[1]}</span><span><i style="background:#fff;border:1px solid var(--borda)"></i>Robô ${c[2]}</span>`;
    anterior = t.slice();
  }

  function verificarFim() {
    if (!reversi.acabou(t)) return false;
    acabou = true;
    desenhar();
    const c = reversi.contagem(t);
    const res = c[1] > c[2] ? 'vitoria' : c[1] < c[2] ? 'derrota' : 'empate';
    ctl.fim(res, `${{ vitoria: 'Você venceu', derrota: 'O robô venceu', empate: 'Empate' }[res]}: ${c[1]} × ${c[2]}`, grade);
    return true;
  }

  async function robo() {
    vez = 2;
    salvar();
    desenhar();
    while (!acabou) {
      ctl.status('Robô pensando…', 'robo');
      if (!await ctl.esperar(550)) return;
      const i = reversi.jogadaRobo(t, 2, ctl.nivel());
      if (i !== null) { t = reversi.jogar(t, i, 2); ultimo = i; ctl.som('robo'); }
      if (verificarFim()) return;
      if (reversi.jogadas(t, 1).size) break;
      salvar();
      desenhar();
      ctl.status('Você não tem jogada: o robô joga de novo', 'robo');
      if (!await ctl.esperar(900)) return;
    }
    vez = 1;
    salvar();
    desenhar();
    ctl.status('Sua vez', 'voce');
  }

  function clicar(i) {
    if (acabou || vez !== 1) return;
    const n = reversi.jogar(t, i, 1);
    if (!n) return;
    t = n; ultimo = i;
    ctl.som('mover');
    if (verificarFim()) return;
    if (!reversi.jogadas(t, 2).size) {
      salvar();
      desenhar();
      ctl.status('O robô não tem jogada: sua vez de novo', 'voce');
      return;
    }
    robo();
  }

  function iniciar(salvo) {
    acabou = false; anterior = null;
    if (salvo) { t = salvo.t; vez = salvo.vez; ultimo = salvo.ultimo; } else { t = reversi.novo(); vez = 1; ultimo = -1; }
    desenhar();
    if (vez === 2) robo(); else ctl.status(salvo ? 'Partida retomada: sua vez' : 'Sua vez: você joga com as pretas', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
