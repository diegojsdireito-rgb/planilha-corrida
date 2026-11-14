import * as lig4 from '../lig4.js';
import { el } from '../comum.js';

export function montar(area, ctl) {
  const grade = el('div', 'lig4');
  const furos = [];
  const colunas = Array.from({ length: lig4.COLUNAS }, (_, c) => {
    const b = el('button', 'coluna');
    b.setAttribute('aria-label', `Coluna ${c + 1}`);
    for (let r = 0; r < lig4.LINHAS; r++) {
      const f = el('div', 'furo', '<i></i>');
      furos[r * lig4.COLUNAS + c] = f;
      b.append(f);
    }
    b.onclick = () => clicar(c);
    grade.append(b);
    return b;
  });
  area.append(grade);
  let t; let vez; let acabou;

  function desenhar(nova = -1, destaque = []) {
    furos.forEach((f, i) => {
      const bola = f.firstChild;
      bola.className = t[i] ? `j${t[i]}` : '';
      if (i === nova) {
        bola.classList.add('cai');
        bola.style.setProperty('--linhas', Math.floor(i / lig4.COLUNAS) + 1);
      }
      f.classList.toggle('destaque', destaque.includes(i));
    });
    colunas.forEach((b, c) => { b.disabled = acabou || vez !== 1 || lig4.linhaLivre(t, c) < 0; });
  }

  function colocar(c, j) {
    const r = lig4.linhaLivre(t, c);
    t = lig4.jogar(t, c, j);
    return r * lig4.COLUNAS + c;
  }

  function terminou(ultima) {
    const v = lig4.vencedor(t);
    if (v) { acabou = true; desenhar(ultima, v.casas); ctl.fim(v.jogador === 1 ? 'vitoria' : 'derrota'); return true; }
    if (lig4.cheio(t)) { acabou = true; desenhar(ultima); ctl.fim('empate'); return true; }
    return false;
  }

  async function robo() {
    vez = 2;
    ctl.salvar({ t, vez });
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(450)) return;
    const casa = colocar(lig4.jogadaRobo(t, 2, ctl.nivel()), 2);
    ctl.som('robo');
    vez = 1;
    ctl.salvar({ t, vez });
    if (!terminou(casa)) { desenhar(casa); ctl.status('Sua vez', 'voce'); }
  }

  function clicar(c) {
    if (acabou || vez !== 1 || lig4.linhaLivre(t, c) < 0) return;
    const casa = colocar(c, 1);
    ctl.som('mover');
    vez = 2;
    if (!terminou(casa)) { desenhar(casa); robo(); }
  }

  function iniciar(salvo) {
    acabou = false;
    if (salvo) { t = salvo.t; vez = salvo.vez; } else { t = lig4.novo(); vez = ctl.roboComeca() ? 2 : 1; }
    desenhar();
    if (vez === 2) robo(); else ctl.status(salvo ? 'Partida retomada: sua vez' : 'Sua vez: você é o vermelho', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
