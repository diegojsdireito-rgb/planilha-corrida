import * as damas from '../damas.js';
import { el, COROA, deslizar } from '../comum.js';

export function montar(area, ctl) {
  const grade = el('div', 'oito damas');
  const qs = Array.from({ length: 64 }, (_, i) => {
    const b = el('button', `q${damas.escura(i) ? ' escura' : ''}`);
    b.onclick = () => clicar(i);
    grade.append(b);
    return b;
  });
  area.append(grade);
  let t; let vez; let acabou; let selecionada = null; let ops = []; let ultimo = []; let semCaptura = 0;

  const salvar = () => ctl.salvar({ t, vez, ultimo, semCaptura });

  function desenhar(capturadas = []) {
    const minhas = vez === 1 && !acabou ? ops : [];
    const origens = new Set(minhas.map((m) => m.de));
    const destinos = new Map(minhas.filter((m) => m.de === selecionada).map((m) => [damas.destino(m), m]));
    qs.forEach((b, i) => {
      const v = t[i];
      b.innerHTML = v ? `<span class="pedra p${Math.sign(v)}">${Math.abs(v) === 2 ? COROA : ''}</span>` : '';
      b.classList.toggle('pode', origens.has(i) && selecionada === null);
      b.classList.remove('origem');
      b.classList.toggle('selecionada', i === selecionada);
      b.classList.toggle('alvo', destinos.has(i));
      b.classList.toggle('captura', destinos.has(i) && destinos.get(i).capturadas.length > 0);
      b.classList.toggle('ultimo', ultimo.includes(i));
      b.classList.toggle('capturada', capturadas.includes(i));
      b.disabled = !(origens.has(i) || destinos.has(i));
      const nome = `${String.fromCharCode(97 + (i & 7))}${8 - (i >> 3)}`;
      b.setAttribute('aria-label', v ? `${nome}: ${v > 0 ? 'sua' : 'do robô'} ${Math.abs(v) === 2 ? 'dama' : 'pedra'}` : nome);
    });
  }

  function registrar(m, j) {
    const pedra = Math.abs(t[m.de]) === 1;
    t = damas.aplicar(t, m);
    ultimo = [m.de, damas.destino(m)];
    semCaptura = m.capturadas.length || pedra ? 0 : semCaptura + 1;
    vez = -j;
    ops = damas.jogadas(t, vez);
    ctl.som(m.capturadas.length ? 'captura' : j === 1 ? 'mover' : 'robo');
    salvar();
  }

  function verificarFim() {
    if (!ops.length) {
      acabou = true;
      desenhar();
      ctl.fim(vez === 1 ? 'derrota' : 'vitoria', vez === 1 ? 'Você ficou sem jogadas: o robô venceu' : 'O robô ficou sem jogadas: você venceu! 🎉', grade);
      return true;
    }
    if (semCaptura >= 40) {
      acabou = true;
      desenhar();
      ctl.fim('empate', 'Empate: 20 lances seguidos só de damas', grade);
      return true;
    }
    return false;
  }

  function avisoVez(retomada) {
    const captura = ops[0]?.capturadas.length;
    if (captura) ctl.status(`Sua vez: captura obrigatória de ${captura} peça${captura > 1 ? 's' : ''}`, 'voce');
    else ctl.status(retomada ? 'Partida retomada: sua vez' : 'Sua vez', 'voce');
  }

  async function robo() {
    selecionada = null;
    desenhar();
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(400)) return;
    const m = damas.jogadaRobo(t, -1, ctl.nivel());
    // acende a origem e o caminho antes de mover
    ultimo = [m.de, ...m.caminho];
    desenhar(m.capturadas);
    qs[m.de].classList.add('origem');
    ctl.status(m.capturadas.length ? `Robô vai capturar ${m.capturadas.length} peça${m.capturadas.length > 1 ? 's' : ''}…` : 'Robô vai mover…', 'robo');
    if (!await ctl.esperar(650)) return;
    if (!await animar(m, -1, 520)) return;
    if (!verificarFim()) avisoVez();
  }

  // Aplica o lance e faz a pedra percorrer o caminho; as capturadas somem ao fim.
  async function animar(m, j, msPorPasso) {
    const pecasCapturadas = m.capturadas.map((i) => t[i]);
    registrar(m, j);
    desenhar();
    m.capturadas.forEach((i, k) => {
      const fantasma = el('span', `pedra p${Math.sign(pecasCapturadas[k])} fantasma`, Math.abs(pecasCapturadas[k]) === 2 ? COROA : '');
      fantasma.style.animationDuration = `${msPorPasso * m.caminho.length}ms`;
      qs[i].append(fantasma);
    });
    const total = msPorPasso * m.caminho.length;
    deslizar(qs, [m.de, ...m.caminho], total);
    const continua = await ctl.esperar(total + 30);
    if (continua) desenhar();
    return continua;
  }

  async function clicar(i) {
    if (acabou || vez !== 1) return;
    const m = ops.find((o) => o.de === selecionada && damas.destino(o) === i);
    if (m) {
      selecionada = null;
      if (!await animar(m, 1, 300)) return;
      if (!verificarFim()) robo();
      return;
    }
    if (ops.some((o) => o.de === i)) {
      selecionada = selecionada === i ? null : i;
      ctl.som('clique');
      desenhar();
    }
  }

  function iniciar(salvo) {
    acabou = false; selecionada = null;
    if (salvo) ({ t, vez, ultimo, semCaptura } = salvo);
    else { t = damas.novo(); vez = 1; ultimo = []; semCaptura = 0; }
    ops = damas.jogadas(t, vez);
    desenhar();
    if (vez === -1) robo();
    else if (salvo) avisoVez(true);
    else ctl.status('Sua vez: você joga com as claras', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
