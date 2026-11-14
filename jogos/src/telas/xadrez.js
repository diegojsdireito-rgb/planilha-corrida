import * as xadrez from '../xadrez.js';
import { el, pausa, deslizar } from '../comum.js';

const GLIFO = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const NOME = { k: 'rei', q: 'dama', r: 'torre', b: 'bispo', n: 'cavalo', p: 'peão' };
const VALOR = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const peca = (p) => `<span class="pc ${xadrez.corDe(p)}">${GLIFO[p.toLowerCase()]}︎</span>`;

let trabalhador = null;
let pedido = 0;
function pensar(s, nivel, chaves) {
  try {
    trabalhador ??= new Worker(new URL('../robo-xadrez.js', import.meta.url), { type: 'module' });
  } catch { trabalhador = false; }
  if (!trabalhador) return pausa(30).then(() => xadrez.jogadaRobo(s, nivel, Math.random, chaves));
  const id = ++pedido;
  return new Promise((resolve) => {
    const ouvir = (e) => {
      if (e.data.id !== id) return;
      trabalhador.removeEventListener('message', ouvir);
      resolve(e.data.m);
    };
    trabalhador.addEventListener('message', ouvir);
    trabalhador.addEventListener('error', () => resolve(xadrez.jogadaRobo(s, nivel, Math.random, chaves)), { once: true });
    trabalhador.postMessage({ id, s, nivel, chaves });
  });
}

export function montar(area, ctl) {
  const perdidasRobo = el('div', 'capturas');
  const grade = el('div', 'oito xadrez');
  const perdidasVoce = el('div', 'capturas');
  const lances = el('div', 'lances');
  const qs = Array.from({ length: 64 }, (_, i) => {
    const escura = ((i >> 3) + (i & 7)) % 2 === 1;
    const b = el('button', `q${escura ? ' escura' : ''}`);
    b.onclick = () => clicar(i);
    grade.append(b);
    return b;
  });
  // coordenadas nas bordas
  for (let c = 0; c < 8; c++) qs[56 + c].insertAdjacentHTML('beforeend', `<small class="coord col">${'abcdefgh'[c]}</small>`);
  for (let r = 0; r < 8; r++) qs[r * 8].insertAdjacentHTML('beforeend', `<small class="coord lin">${8 - r}</small>`);
  area.append(perdidasRobo, grade, perdidasVoce, lances);

  let s; let chaves; let historico; let ultimo; let selecionada = null; let legais = []; let acabou = false; let pensando = false;

  const salvar = () => ctl.salvar({ s, chaves, historico, ultimo });

  function desenhar() {
    const destinos = selecionada === null ? [] : legais.filter((m) => m.de === selecionada).map((m) => m.para);
    const xeque = xadrez.emXeque(s) ? xadrez.reiDe(s.t, s.vez) : -1;
    const minhas = s.vez === 'w' && !acabou && !pensando;
    const origens = new Set(minhas ? legais.map((m) => m.de) : []);
    qs.forEach((b, i) => {
      const p = s.t[i];
      const coords = [...b.querySelectorAll('.coord')].map((c) => c.outerHTML).join('');
      b.innerHTML = (p ? peca(p) : '') + coords;
      b.classList.remove('origem');
      b.classList.toggle('selecionada', i === selecionada);
      b.classList.toggle('alvo', destinos.includes(i));
      b.classList.toggle('come', destinos.includes(i) && Boolean(p));
      b.classList.toggle('ultimo', ultimo?.includes(i) ?? false);
      b.classList.toggle('xeque', i === xeque);
      b.disabled = !(origens.has(i) || destinos.includes(i));
      b.setAttribute('aria-label', `${xadrez.nomeCasa(i)}${p ? `: ${NOME[p.toLowerCase()]} ${xadrez.corDe(p) === 'w' ? 'branco' : 'preto'}` : ''}`);
    });
    // peças capturadas e vantagem de material
    const conta = (cor) => {
      const ini = { p: 8, n: 2, b: 2, r: 2, q: 1 };
      for (const p of s.t) if (p && xadrez.corDe(p) === cor && p.toLowerCase() in ini) ini[p.toLowerCase()]--;
      return ini;
    };
    const fora = { w: conta('w'), b: conta('b') };
    const pontos = (f) => Object.entries(f).reduce((t, [k, n]) => t + Math.max(0, n) * VALOR[k], 0);
    const lista = (f, cor) => Object.entries(f).flatMap(([k, n]) => Array(Math.max(0, n)).fill(peca(cor === 'w' ? k.toUpperCase() : k))).join('');
    const vant = pontos(fora.b) - pontos(fora.w);
    perdidasRobo.innerHTML = `<span class="quem">🤖 Robô</span>${lista(fora.w, 'w')}${vant < 0 ? `<b>+${-vant}</b>` : ''}`;
    perdidasVoce.innerHTML = `<span class="quem">🙂 Você</span>${lista(fora.b, 'b')}${vant > 0 ? `<b>+${vant}</b>` : ''}`;
    const pares = [];
    for (let k = 0; k < historico.length; k += 2) pares.push(`<span><i>${k / 2 + 1}.</i> ${historico[k]} ${historico[k + 1] ?? ''}</span>`);
    lances.innerHTML = pares.length ? pares.join('') : '<span class="suave">Os lances aparecem aqui.</span>';
    lances.scrollLeft = lances.scrollWidth;
  }

  function verificarFim() {
    const r = xadrez.resultado(s, chaves);
    if (!r) return false;
    acabou = true;
    selecionada = null;
    desenhar();
    if (r.tipo === 'mate') ctl.fim(r.vencedor === 'w' ? 'vitoria' : 'derrota', r.vencedor === 'w' ? 'Xeque-mate! Você venceu 🎉' : 'Xeque-mate: o robô venceu', grade);
    else ctl.fim('empate', `Empate por ${r.tipo}`, grade);
    return true;
  }

  function executar(m, quem) {
    historico.push(xadrez.notacao(s, m));
    const captura = Boolean(s.t[m.para]) || m.ep;
    s = xadrez.aplicar(s, m);
    chaves.push(xadrez.chave(s));
    ultimo = [m.de, m.para];
    legais = xadrez.legais(s);
    ctl.som(xadrez.emXeque(s) ? 'xeque' : captura ? 'captura' : quem === 'w' ? 'mover' : 'robo');
    salvar();
  }

  async function robo() {
    pensando = true;
    selecionada = null;
    desenhar();
    ctl.status('Robô pensando…', 'robo');
    const ativa = ctl.ativa();
    const [m] = await Promise.all([pensar(s, ctl.nivel(), chaves), pausa(350)]);
    if (!ativa()) return;
    // acende a peça que vai sair, para dar tempo de ver de onde ela parte
    ultimo = [m.de];
    desenhar();
    qs[m.de].classList.add('origem');
    ctl.status(`Robô vai mover ${NOME[s.t[m.de].toLowerCase()]} de ${xadrez.nomeCasa(m.de)}…`, 'robo');
    if (!await ctl.esperar(600)) return;
    executar(m, 'b');
    desenhar();
    animarLance(m, 700);
    if (!await ctl.esperar(720)) return;
    pensando = false;
    desenhar();
    if (!verificarFim()) ctl.status(`Robô: ${historico[historico.length - 1]}. ${xadrez.emXeque(s) ? 'Xeque! Proteja o rei' : 'Sua vez'}`, 'voce');
  }

  function animarLance(m, ms) {
    deslizar(qs, [m.de, m.para], ms);
    if (m.roque === 'curto') deslizar(qs, [m.de + 3, m.de + 1], ms);
    if (m.roque === 'longo') deslizar(qs, [m.de - 4, m.de - 1], ms);
  }

  function escolherPromocao(opcoes) {
    return new Promise((resolve) => {
      const caixa = el('div', 'promocao', '<p>Promover para</p>');
      const linha = el('div', 'linha');
      for (const tipo of ['q', 'r', 'b', 'n']) {
        const b = el('button', '', peca(tipo.toUpperCase()));
        b.setAttribute('aria-label', NOME[tipo]);
        b.onclick = () => { caixa.remove(); resolve(opcoes.find((m) => m.promo === tipo)); };
        linha.append(b);
      }
      caixa.append(linha);
      grade.append(caixa);
    });
  }

  async function clicar(i) {
    if (acabou || pensando || s.vez !== 'w') return;
    const opcoes = legais.filter((m) => m.de === selecionada && m.para === i);
    if (opcoes.length) {
      const m = opcoes.length > 1 ? await escolherPromocao(opcoes) : opcoes[0];
      executar(m, 'w');
      selecionada = null;
      pensando = true; // trava o tabuleiro enquanto a peça desliza
      desenhar();
      animarLance(m, 320);
      if (!await ctl.esperar(340)) return;
      pensando = false;
      if (!verificarFim()) robo();
      return;
    }
    if (legais.some((m) => m.de === i)) {
      selecionada = selecionada === i ? null : i;
      ctl.som('clique');
      desenhar();
    }
  }

  function iniciar(salvo) {
    acabou = false; pensando = false; selecionada = null;
    grade.querySelector('.promocao')?.remove();
    if (salvo) ({ s, chaves, historico, ultimo } = salvo);
    else { s = xadrez.novo(); chaves = [xadrez.chave(s)]; historico = []; ultimo = null; }
    legais = xadrez.legais(s);
    desenhar();
    if (s.vez === 'b') robo();
    else ctl.status(salvo ? 'Partida retomada: sua vez' : 'Sua vez: você joga com as brancas', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
