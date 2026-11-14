import * as velha from '../velha.js';
import { el, SVG_X, SVG_O } from '../comum.js';

export function montar(area, ctl) {
  const grade = el('div', 'velha');
  const casas = Array.from({ length: 9 }, (_, i) => {
    const b = el('button', 'casa');
    b.setAttribute('aria-label', `Casa ${i + 1}`);
    b.onclick = () => clicar(i);
    grade.append(b);
    return b;
  });
  area.append(grade);
  let t; let vez; let acabou;

  function desenhar(destaque = []) {
    casas.forEach((b, i) => {
      b.innerHTML = t[i] === 'X' ? SVG_X : t[i] === 'O' ? SVG_O : '';
      b.classList.toggle('destaque', destaque.includes(i));
      b.disabled = Boolean(t[i]) || acabou || vez !== 'X';
    });
  }

  const salvar = () => ctl.salvar({ t, vez });

  function terminou() {
    const v = velha.vencedor(t);
    if (v) { acabou = true; desenhar(v.linha); ctl.fim(v.jogador === 'X' ? 'vitoria' : 'derrota'); return true; }
    if (velha.empate(t)) { acabou = true; desenhar(); ctl.fim('empate'); return true; }
    return false;
  }

  async function robo() {
    vez = 'O';
    salvar();
    desenhar();
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(500)) return;
    t[velha.jogadaRobo(t, 'O', ctl.nivel())] = 'O';
    ctl.som('robo');
    vez = 'X';
    salvar();
    desenhar();
    if (!terminou()) ctl.status('Sua vez', 'voce');
  }

  function clicar(i) {
    if (acabou || vez !== 'X' || t[i]) return;
    t[i] = 'X';
    ctl.som('mover');
    if (!terminou()) robo();
  }

  function iniciar(salvo) {
    acabou = false;
    if (salvo) { t = salvo.t; vez = salvo.vez; } else { t = velha.novo(); vez = ctl.roboComeca() ? 'O' : 'X'; }
    desenhar();
    if (vez === 'O') robo(); else ctl.status(salvo ? 'Partida retomada: sua vez' : 'Sua vez: você é o X', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
