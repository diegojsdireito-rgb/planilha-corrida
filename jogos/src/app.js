import * as velha from './velha.js';
import * as lig4 from './lig4.js';
import * as reversi from './reversi.js';
import * as damas from './damas.js';
import * as ludo from './ludo.js';

const app = document.getElementById('app');
const CHAVE = 'mesa-de-jogos';
const NIVEIS = [['facil', 'Fácil'], ['medio', 'Médio'], ['dificil', 'Difícil']];

const salvo = (() => {
  try { return JSON.parse(localStorage.getItem(CHAVE)) ?? {}; } catch { return {}; }
})();
const prefs = { nivel: salvo.nivel ?? 'medio', placar: salvo.placar ?? {} };
const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(prefs)); } catch { /* sem armazenamento */ } };
const placarDe = (id) => (prefs.placar[id] ??= { v: 0, d: 0, e: 0 });

function el(tag, classe, conteudo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (conteudo !== undefined) e.innerHTML = conteudo;
  return e;
}
const svgEl = (tag, attrs = {}) => {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const SVG_X = '<svg viewBox="0 0 10 10"><path d="M2 2 8 8M8 2 2 8" stroke="var(--vermelho)" stroke-width="1.6" stroke-linecap="round"/></svg>';
const SVG_O = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.2" fill="none" stroke="var(--azul)" stroke-width="1.6"/></svg>';
const COROA = '<svg viewBox="0 0 24 24"><path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z"/></svg>';

const ICONES = {
  ludo: `<svg viewBox="0 0 15 15"><rect width="15" height="15" rx="2" fill="#fff"/><rect width="6" height="6" fill="var(--vermelho)"/><rect x="9" width="6" height="6" fill="var(--verde)"/><rect x="9" y="9" width="6" height="6" fill="var(--amarelo)"/><rect y="9" width="6" height="6" fill="var(--azul)"/><path d="M6 6h3L7.5 7.5z" fill="var(--verde)"/><path d="M9 6v3L7.5 7.5z" fill="var(--amarelo)"/><path d="M6 9h3L7.5 7.5z" fill="var(--azul)"/><path d="M6 6v3L7.5 7.5z" fill="var(--vermelho)"/></svg>`,
  damas: `<svg viewBox="0 0 4 4"><rect width="4" height="4" fill="var(--madeira-clara)"/><path d="M1 0h1v1H1zM3 0h1v1H3zM0 1h1v1H0zM2 1h1v1H2zM1 2h1v1H1zM3 2h1v1H3zM0 3h1v1H0zM2 3h1v1H2z" fill="var(--madeira-escura)"/><circle cx="1.5" cy="2.5" r=".38" fill="#f3eee4"/><circle cx="2.5" cy="1.5" r=".38" fill="#23262d"/><circle cx="0.5" cy="3.5" r=".38" fill="#f3eee4"/></svg>`,
  reversi: `<svg viewBox="0 0 4 4"><rect width="4" height="4" rx=".3" fill="#2e8b57"/><circle cx="1.5" cy="1.5" r=".4" fill="#fff"/><circle cx="2.5" cy="2.5" r=".4" fill="#fff"/><circle cx="2.5" cy="1.5" r=".4" fill="#15171c"/><circle cx="1.5" cy="2.5" r=".4" fill="#15171c"/></svg>`,
  lig4: `<svg viewBox="0 0 4 4"><rect width="4" height="4" rx=".4" fill="#2853c9"/><g fill="#fff"><circle cx=".7" cy=".7" r=".32"/><circle cx="1.6" cy=".7" r=".32"/><circle cx="2.5" cy=".7" r=".32"/><circle cx="3.3" cy=".7" r=".32"/><circle cx=".7" cy="1.6" r=".32"/><circle cx="1.6" cy="1.6" r=".32"/><circle cx="3.3" cy="1.6" r=".32"/></g><g fill="var(--vermelho)"><circle cx="2.5" cy="1.6" r=".32"/><circle cx=".7" cy="2.5" r=".32"/><circle cx="1.6" cy="3.3" r=".32"/><circle cx="3.3" cy="3.3" r=".32"/></g><g fill="var(--amarelo)"><circle cx="1.6" cy="2.5" r=".32"/><circle cx="2.5" cy="2.5" r=".32"/><circle cx="3.3" cy="2.5" r=".32"/><circle cx=".7" cy="3.3" r=".32"/><circle cx="2.5" cy="3.3" r=".32"/></g></svg>`,
  velha: `<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="var(--preenchido)"/><path d="M4 1.5v9M8 1.5v9M1.5 4h9M1.5 8h9" stroke="var(--suave)" stroke-width=".5" stroke-linecap="round"/><path d="M1.8 1.8l1.4 1.4M3.2 1.8 1.8 3.2M8.8 8.8l1.4 1.4M10.2 8.8l-1.4 1.4" stroke="var(--vermelho)" stroke-width=".6" stroke-linecap="round"/><circle cx="6" cy="6" r="1" fill="none" stroke="var(--azul)" stroke-width=".6"/></svg>`,
};

const JOGOS = [
  { id: 'ludo', nome: 'Ludo', descricao: 'Você e até 3 robôs', montar: montarLudo, regras: [
    'Tire 6 no dado para tirar uma peça da base.',
    'Tirou 6, capturou uma peça ou chegou ao centro: joga de novo. Três 6 seguidos perdem a vez.',
    'Parar numa casa com peça adversária manda ela de volta para a base, menos nas casas com estrela e nas saídas.',
    'Para chegar ao centro, o número do dado precisa ser exato. Ganha quem levar as 4 peças primeiro.',
  ] },
  { id: 'damas', nome: 'Damas', descricao: 'Regras brasileiras', montar: montarDamas, regras: [
    'As pedras andam uma casa na diagonal, para a frente. Você joga com as claras e começa.',
    'A captura é obrigatória e pode ser para trás. Se houver mais de um caminho, vale o que captura mais peças.',
    'A pedra que termina a jogada na última linha vira dama, que anda e captura à distância.',
    'Perde quem ficar sem peças ou sem jogada. Com 20 lances seguidos só de damas, sem captura, é empate.',
  ] },
  { id: 'reversi', nome: 'Reversi', descricao: 'Vire as peças do robô', montar: montarReversi, regras: [
    'Você joga com as pretas. Cada peça precisa prender peças brancas entre ela e outra preta, em linha.',
    'As peças presas viram para a sua cor. Sem jogada possível, a vez passa.',
    'Ganha quem tiver mais peças quando ninguém mais puder jogar.',
  ] },
  { id: 'lig4', nome: 'Quatro em Linha', descricao: 'Alinhe 4 peças', montar: montarLig4, regras: [
    'Toque numa coluna para soltar sua peça vermelha. Ela cai até a casa livre mais baixa.',
    'Ganha quem alinhar 4 peças na horizontal, vertical ou diagonal.',
    'Quem começa alterna a cada partida.',
  ] },
  { id: 'velha', nome: 'Jogo da Velha', descricao: 'Clássico 3 × 3', montar: montarVelha, regras: [
    'Você é o X. Ganha quem completar uma linha, coluna ou diagonal.',
    'No nível difícil, o robô não erra: o melhor resultado possível é o empate.',
    'Quem começa alterna a cada partida.',
  ] },
];

// ---------- Telas ----------

let telaAtual = null;

function inicio() {
  telaAtual?.sair();
  telaAtual = null;
  app.replaceChildren();
  const topo = el('header', 'topo-inicio', '<h1>Mesa de Jogos</h1><p>Você contra o robô. Escolha o nível e o jogo.</p>');
  app.append(topo);
  app.append(el('p', 'rotulo', 'Nível do robô'));
  app.append(seletorNivel());
  app.append(el('p', 'rotulo', 'Jogos'));
  const lista = el('div', 'lista-jogos');
  for (const jogo of JOGOS) {
    const p = placarDe(jogo.id);
    const b = el('button', 'cartao-jogo', `
      <div class="icone">${ICONES[jogo.id]}</div>
      <div><strong>${jogo.nome}</strong><span>${jogo.descricao}</span></div>
      <div class="placar-mini suave"><b>${p.v} × ${p.d}</b>${p.e ? `${p.e} empate${p.e > 1 ? 's' : ''}` : 'você × robô'}</div>`);
    b.onclick = () => abrir(jogo);
    lista.append(b);
  }
  app.append(lista);
}

function seletorNivel(aoMudar) {
  const caixa = el('div', 'niveis');
  caixa.setAttribute('role', 'group');
  caixa.setAttribute('aria-label', 'Nível do robô');
  for (const [id, nome] of NIVEIS) {
    const b = el('button', '', nome);
    b.setAttribute('aria-pressed', String(prefs.nivel === id));
    b.onclick = () => {
      prefs.nivel = id;
      guardar();
      for (const outro of caixa.children) outro.setAttribute('aria-pressed', String(outro === b));
      aoMudar?.();
    };
    caixa.append(b);
  }
  return caixa;
}

function abrir(jogo) {
  telaAtual?.sair();
  app.replaceChildren();
  let geracao = 0;
  const empurrou = location.hash !== `#${jogo.id}`;

  const barra = el('div', 'barra');
  const voltar = el('button', 'botao-icone', '‹');
  voltar.setAttribute('aria-label', 'Voltar');
  voltar.onclick = () => {
    if (empurrou) history.back();
    else { history.replaceState(null, '', location.pathname); inicio(); }
  };
  barra.append(voltar, el('h2', '', jogo.nome));

  const placar = el('div', 'placar');
  const status = el('div', 'status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const area = el('div', 'area');
  const acoes = el('div', 'acoes');
  const nova = el('button', 'botao', 'Nova partida');
  acoes.append(nova);
  const regras = el('details', 'regras', `<summary>Como jogar</summary><ul>${jogo.regras.map((r) => `<li>${r}</li>`).join('')}</ul>`);

  app.append(barra, seletorNivel(), placar, status, area, acoes, regras);

  const desenharPlacar = () => {
    const p = placarDe(jogo.id);
    placar.innerHTML = `
      <span class="lado"><span class="avatar voce">🙂</span>Você <span class="num">${p.v}</span></span>
      <span class="x">×</span>
      <span class="lado"><span class="num">${p.d}</span> Robô <span class="avatar robo">🤖</span></span>
      ${p.e ? `<span class="emp">${p.e} emp.</span>` : ''}`;
  };
  desenharPlacar();

  const ctl = {
    nivel: () => prefs.nivel,
    status(texto, tipo = '') { status.textContent = texto; status.className = `status ${tipo}`; },
    // Espera e confirma que a partida ainda é a mesma (não reiniciou nem saiu).
    async esperar(ms) { const g = geracao; await pausa(ms); return g === geracao; },
    ativa() { const g = geracao; return () => g === geracao; },
    fim(resultado, texto, alvo) {
      const p = placarDe(jogo.id);
      if (resultado === 'vitoria') p.v++; else if (resultado === 'derrota') p.d++; else p.e++;
      guardar();
      desenharPlacar();
      const padrao = { vitoria: 'Você venceu! 🎉', derrota: 'O robô venceu 🤖', empate: 'Empate 🤝' }[resultado];
      ctl.status(texto ?? padrao, resultado);
      if (alvo) {
        const faixa = el('div', 'faixa-fim', `<div>${padrao}</div>`);
        alvo.append(faixa);
      }
    },
  };

  const instancia = jogo.montar(area, ctl);
  nova.onclick = () => { geracao++; instancia.reiniciar(); };
  telaAtual = { sair: () => { geracao++; } };
  if (empurrou) history.pushState(null, '', `#${jogo.id}`);
}

window.addEventListener('popstate', rota);
function rota() {
  const jogo = JOGOS.find((j) => `#${j.id}` === location.hash);
  if (jogo) abrir(jogo); else inicio();
}

// ---------- Jogo da velha ----------

function montarVelha(area, ctl) {
  const grade = el('div', 'velha');
  const casas = Array.from({ length: 9 }, (_, i) => {
    const b = el('button', 'casa');
    b.setAttribute('aria-label', `Casa ${i + 1}`);
    b.onclick = () => clicar(i);
    grade.append(b);
    return b;
  });
  area.append(grade);
  let t; let vez; let acabou; let partidas = 0;

  function desenhar(destaque = []) {
    casas.forEach((b, i) => {
      b.innerHTML = t[i] === 'X' ? SVG_X : t[i] === 'O' ? SVG_O : '';
      b.classList.toggle('destaque', destaque.includes(i));
      b.disabled = Boolean(t[i]) || acabou || vez !== 'X';
    });
  }

  function terminou() {
    const v = velha.vencedor(t);
    if (v) { acabou = true; desenhar(v.linha); ctl.fim(v.jogador === 'X' ? 'vitoria' : 'derrota'); return true; }
    if (velha.empate(t)) { acabou = true; desenhar(); ctl.fim('empate'); return true; }
    return false;
  }

  async function robo() {
    vez = 'O';
    desenhar();
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(500)) return;
    t[velha.jogadaRobo(t, 'O', ctl.nivel())] = 'O';
    vez = 'X';
    desenhar();
    if (!terminou()) ctl.status('Sua vez', 'voce');
  }

  function clicar(i) {
    if (acabou || vez !== 'X' || t[i]) return;
    t[i] = 'X';
    if (!terminou()) robo();
  }

  function reiniciar() {
    t = velha.novo();
    acabou = false;
    vez = 'X';
    const roboComeca = partidas++ % 2 === 1;
    desenhar();
    if (roboComeca) robo(); else ctl.status('Sua vez: você é o X', 'voce');
  }

  reiniciar();
  return { reiniciar };
}

// ---------- Quatro em linha ----------

function montarLig4(area, ctl) {
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
  let t; let vez; let acabou; let partidas = 0;

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
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(450)) return;
    const casa = colocar(lig4.jogadaRobo(t, 2, ctl.nivel()), 2);
    vez = 1;
    if (!terminou(casa)) { desenhar(casa); ctl.status('Sua vez', 'voce'); }
  }

  function clicar(c) {
    if (acabou || vez !== 1 || lig4.linhaLivre(t, c) < 0) return;
    const casa = colocar(c, 1);
    vez = 2;
    if (!terminou(casa)) { desenhar(casa); robo(); }
  }

  function reiniciar() {
    t = lig4.novo();
    acabou = false;
    vez = 1;
    const roboComeca = partidas++ % 2 === 1;
    if (roboComeca) vez = 2;
    desenhar();
    if (roboComeca) robo(); else ctl.status('Sua vez: você é o vermelho', 'voce');
  }

  reiniciar();
  return { reiniciar };
}

// ---------- Reversi ----------

function montarReversi(area, ctl) {
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
    desenhar();
    while (!acabou) {
      ctl.status('Robô pensando…', 'robo');
      if (!await ctl.esperar(550)) return;
      const i = reversi.jogadaRobo(t, 2, ctl.nivel());
      if (i !== null) { t = reversi.jogar(t, i, 2); ultimo = i; }
      if (verificarFim()) return;
      if (reversi.jogadas(t, 1).size) break;
      desenhar();
      ctl.status('Você não tem jogada: o robô joga de novo', 'robo');
      if (!await ctl.esperar(900)) return;
    }
    vez = 1;
    desenhar();
    ctl.status('Sua vez', 'voce');
  }

  async function clicar(i) {
    if (acabou || vez !== 1) return;
    const n = reversi.jogar(t, i, 1);
    if (!n) return;
    t = n; ultimo = i;
    if (verificarFim()) return;
    if (!reversi.jogadas(t, 2).size) {
      desenhar();
      ctl.status('O robô não tem jogada: sua vez de novo', 'voce');
      return;
    }
    robo();
  }

  function reiniciar() {
    t = reversi.novo();
    vez = 1; acabou = false; ultimo = -1; anterior = null;
    desenhar();
    ctl.status('Sua vez: você joga com as pretas', 'voce');
  }

  reiniciar();
  return { reiniciar };
}

// ---------- Damas ----------

function montarDamas(area, ctl) {
  const grade = el('div', 'oito damas');
  const qs = Array.from({ length: 64 }, (_, i) => {
    const b = el('button', `q${damas.escura(i) ? ' escura' : ''}`);
    b.onclick = () => clicar(i);
    grade.append(b);
    return b;
  });
  area.append(grade);
  let t; let vez; let acabou; let selecionada = null; let ops = []; let ultimo = []; let semCaptura = 0;

  function desenhar(capturadas = []) {
    const minhas = vez === 1 && !acabou ? ops : [];
    const origens = new Set(minhas.map((m) => m.de));
    const destinos = new Map(minhas.filter((m) => m.de === selecionada).map((m) => [damas.destino(m), m]));
    qs.forEach((b, i) => {
      const v = t[i];
      b.innerHTML = v ? `<span class="pedra p${Math.sign(v)}">${Math.abs(v) === 2 ? COROA : ''}</span>` : '';
      b.classList.toggle('pode', origens.has(i) && selecionada === null);
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

  function avisoVez() {
    const captura = ops[0]?.capturadas.length;
    ctl.status(captura ? `Sua vez: captura obrigatória de ${captura} peça${captura > 1 ? 's' : ''}` : 'Sua vez', 'voce');
  }

  async function robo() {
    selecionada = null;
    desenhar();
    ctl.status('Robô pensando…', 'robo');
    if (!await ctl.esperar(400)) return;
    const m = damas.jogadaRobo(t, -1, ctl.nivel());
    // mostra o caminho antes de concluir
    ultimo = [m.de, ...m.caminho];
    desenhar(m.capturadas);
    if (!await ctl.esperar(m.capturadas.length ? 650 : 300)) return;
    registrar(m, -1);
    desenhar();
    if (!verificarFim()) avisoVez();
  }

  function clicar(i) {
    if (acabou || vez !== 1) return;
    const m = ops.find((o) => o.de === selecionada && damas.destino(o) === i);
    if (m) {
      registrar(m, 1);
      selecionada = null;
      desenhar();
      if (!verificarFim()) robo();
      return;
    }
    if (ops.some((o) => o.de === i)) {
      selecionada = selecionada === i ? null : i;
      desenhar();
    }
  }

  function reiniciar() {
    t = damas.novo();
    vez = 1; acabou = false; selecionada = null; ultimo = []; semCaptura = 0;
    ops = damas.jogadas(t, 1);
    desenhar();
    ctl.status('Sua vez: você joga com as claras', 'voce');
  }

  reiniciar();
  return { reiniciar };
}

// ---------- Ludo ----------

const COR_HEX = ['var(--vermelho)', 'var(--verde)', 'var(--amarelo)', 'var(--azul)'];
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function desenharTabuleiroLudo() {
  const svg = svgEl('svg', { viewBox: '0 0 15 15', role: 'img', 'aria-label': 'Tabuleiro de Ludo' });
  svg.append(svgEl('rect', { width: 15, height: 15, fill: '#fffdf8' }));
  ludo.CANTO_BASE.forEach(([r, c], cor) => {
    svg.append(svgEl('rect', { x: c, y: r, width: 6, height: 6, fill: COR_HEX[cor] }));
    svg.append(svgEl('rect', { x: c + 0.8, y: r + 0.8, width: 4.4, height: 4.4, rx: 0.5, fill: '#fffdf8' }));
    for (let k = 0; k < 4; k++) {
      const [y, x] = ludo.posicao(cor, -1, k);
      svg.append(svgEl('circle', { cx: x, cy: y, r: 0.62, fill: COR_HEX[cor], 'fill-opacity': 0.25 }));
    }
  });
  const casa = (r, c, fill) => svg.append(svgEl('rect', { x: c, y: r, width: 1, height: 1, fill, stroke: '#cfc6b4', 'stroke-width': 0.04 }));
  ludo.PERCURSO.forEach(([r, c], i) => {
    const saida = ludo.SAIDA.indexOf(i);
    casa(r, c, saida >= 0 ? COR_HEX[saida] : '#fffdf8');
    if (ludo.SEGURAS.has(i) && saida < 0) {
      const t = svgEl('text', { x: c + 0.5, y: r + 0.78, 'text-anchor': 'middle', 'font-size': 0.78, fill: '#a99f8a' });
      t.textContent = '★';
      svg.append(t);
    }
  });
  ludo.RETA.forEach((lista, cor) => lista.forEach(([r, c]) => casa(r, c, COR_HEX[cor])));
  // última casa do percurso comum, antes de cada reta, recebe uma seta discreta
  const tri = (pts, cor) => svg.append(svgEl('polygon', { points: pts, fill: COR_HEX[cor] }));
  tri('6,6 7.5,7.5 6,9', 0);
  tri('6,6 9,6 7.5,7.5', 1);
  tri('9,6 9,9 7.5,7.5', 2);
  tri('6,9 9,9 7.5,7.5', 3);
  svg.append(svgEl('rect', { x: 0, y: 0, width: 15, height: 15, fill: 'none', stroke: '#cfc6b4', 'stroke-width': 0.08 }));
  return svg;
}

function montarLudo(area, ctl) {
  let estado = null;
  let fase = 'config';
  let nomes = [];
  let resolverEscolha = null;

  function config() {
    fase = 'config';
    area.replaceChildren();
    const caixa = el('div', 'ludo-config', '<h2>Quantos robôs?</h2><p>Você joga com o vermelho e começa.</p>');
    const opcoes = el('div', 'opcoes');
    for (const n of [1, 2, 3]) {
      const b = el('button', '', `${n} robô${n > 1 ? 's' : ''}<small>${n + 1} jogadores</small>`);
      b.onclick = () => comecar(n);
      opcoes.append(b);
    }
    caixa.append(opcoes);
    area.append(caixa);
    ctl.status('Escolha a quantidade de adversários');
  }

  let svg; let pecasEl; let dadoEl; let painelJog; let dica; let tabuleiro;

  function comecar(robos) {
    const cores = robos === 1 ? [0, 2] : robos === 2 ? [0, 1, 2] : [0, 1, 2, 3];
    estado = ludo.novo(cores);
    nomes = [];
    let k = 1;
    for (const c of cores) nomes[c] = c === 0 ? 'Você' : robos === 1 ? 'Robô' : `Robô ${k++}`;
    area.replaceChildren();
    tabuleiro = el('div', 'ludo-tab');
    svg = desenharTabuleiroLudo();
    pecasEl = [];
    for (const cor of cores) {
      pecasEl[cor] = [0, 1, 2, 3].map((peca) => {
        const g = svgEl('g', { class: 'peca' });
        g.append(svgEl('circle', { class: 'anel', r: 0.5, fill: 'none', stroke: '#111', 'stroke-width': 0.08, 'stroke-opacity': 0 }));
        g.append(svgEl('circle', { r: 0.38, fill: COR_HEX[cor], stroke: '#fff', 'stroke-width': 0.09 }));
        g.append(svgEl('circle', { r: 0.15, fill: '#fff', 'fill-opacity': 0.55 }));
        g.addEventListener('click', () => escolherPeca(cor, peca));
        svg.append(g);
        return g;
      });
    }
    tabuleiro.append(svg);
    const painel = el('div', 'ludo-painel');
    painelJog = el('div', 'jogadores');
    dadoEl = el('button', 'dado', Array.from({ length: 9 }, () => '<i></i>').join(''));
    dadoEl.setAttribute('aria-label', 'Jogar o dado');
    dadoEl.onclick = () => { if (fase === 'dado') turno(); };
    painel.append(painelJog, dadoEl);
    dica = el('div', 'dica-ludo');
    area.append(tabuleiro, painel, dica);
    mostrarDado(6);
    desenhar();
    proximoTurno();
  }

  function mostrarDado(n) {
    [...dadoEl.children].forEach((p, i) => p.classList.toggle('on', PIPS[n].includes(i)));
  }

  function desenhar(podem = []) {
    // agrupa as peças que estão na mesma casa para deslocá-las um pouco
    const grupos = new Map();
    for (const cor of estado.cores) {
      estado.pecas[cor].forEach((p, peca) => {
        const [y, x] = ludo.posicao(cor, p, peca);
        const chave = `${y.toFixed(2)},${x.toFixed(2)}`;
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push({ cor, peca, x, y });
      });
    }
    const DESVIO = [[0, 0], [-0.2, -0.2], [0.2, 0.2], [0.2, -0.2], [-0.2, 0.2]];
    for (const lista of grupos.values()) {
      lista.forEach(({ cor, peca, x, y }, k) => {
        const escala = lista.length > 1 ? 0.72 : 1;
        const [dx, dy] = lista.length > 1 ? DESVIO[(k % 4) + 1] : DESVIO[0];
        const g = pecasEl[cor][peca];
        g.style.transform = `translate(${x + dx}px, ${y + dy}px) scale(${escala})`;
        const pode = podem.some((j) => j.cor === cor && j.peca === peca);
        g.classList.toggle('pode', pode);
        g.querySelector('.anel').setAttribute('stroke-opacity', pode ? 1 : 0);
        if (pode) svg.append(g); // fica por cima
      });
    }
    painelJog.innerHTML = estado.cores.map((cor) => {
      const chegaram = estado.pecas[cor].filter((p) => p === ludo.CHEGADA).length;
      return `<div class="${cor === estado.vez && fase !== 'fim' ? 'atual' : ''}"><i style="background:${COR_HEX[cor]}"></i>${nomes[cor]}<small>${chegaram}/4 em casa</small></div>`;
    }).join('');
  }

  function proximoTurno() {
    if (fase === 'fim') return;
    desenhar();
    if (estado.vez === 0) {
      fase = 'dado';
      dadoEl.disabled = false;
      dadoEl.classList.add('ativo');
      ctl.status('Sua vez: toque no dado', 'voce');
    } else {
      fase = 'robo';
      dadoEl.disabled = true;
      dadoEl.classList.remove('ativo');
      ctl.status(`${nomes[estado.vez]} jogando…`, 'robo');
      turno();
    }
  }

  async function rolar() {
    const ativa = ctl.ativa();
    dadoEl.classList.remove('ativo');
    dadoEl.classList.add('rolando');
    dadoEl.disabled = true;
    for (let k = 0; k < 6; k++) {
      mostrarDado(1 + Math.floor(Math.random() * 6));
      await pausa(60);
    }
    dadoEl.classList.remove('rolando');
    const n = 1 + Math.floor(Math.random() * 6);
    mostrarDado(n);
    return ativa() ? n : null;
  }

  async function turno() {
    const cor = estado.vez;
    const humano = cor === 0;
    fase = 'rolando';
    if (!humano && !await ctl.esperar(500)) return;
    const dado = await rolar();
    if (dado === null) return;
    estado = { ...estado, dado, seis: dado === 6 ? estado.seis + 1 : 0 };
    if (estado.seis === 3) {
      dica.textContent = `${nomes[cor]} tirou três 6 seguidos e perdeu a vez.`;
      return passar(cor, 900);
    }
    const ops = ludo.jogadas(estado, cor, dado);
    if (!ops.length) {
      dica.textContent = `${nomes[cor]} tirou ${dado} e não tem jogada.`;
      return passar(cor, 800);
    }
    let jogada;
    if (humano) {
      if (ops.length === 1 || ops.every((o) => o.de === ops[0].de)) {
        jogada = ops[0];
        dica.textContent = `Você tirou ${dado}.`;
        if (!await ctl.esperar(350)) return;
      } else {
        fase = 'peca';
        dica.textContent = `Você tirou ${dado}. Escolha a peça.`;
        ctl.status('Toque na peça que vai andar', 'voce');
        desenhar(ops);
        jogada = await new Promise((r) => { resolverEscolha = r; });
        resolverEscolha = null;
        if (!jogada) return;
      }
    } else {
      if (!await ctl.esperar(350)) return;
      jogada = ludo.jogadaRobo(estado, cor, dado, ctl.nivel());
      dica.textContent = `${nomes[cor]} tirou ${dado}.`;
    }
    fase = 'movendo';
    desenhar();
    if (!await andar(jogada)) return;
    const r = ludo.aplicar(estado, jogada);
    estado = r.estado;
    if (r.capturadas.length) dica.textContent = `${nomes[cor]} capturou ${r.capturadas.map((c) => nomes[c.cor] === 'Você' ? 'uma peça sua' : `uma peça de ${nomes[c.cor]}`).join(' e ')}!`;
    else if (r.chegou) dica.textContent = `${nomes[cor]} levou uma peça ao centro.`;
    desenhar();
    if (ludo.terminou(estado, cor)) {
      fase = 'fim';
      dadoEl.disabled = true;
      desenhar();
      ctl.fim(humano ? 'vitoria' : 'derrota', humano ? 'Você levou as 4 peças primeiro! 🎉' : `${nomes[cor]} levou as 4 peças primeiro`, tabuleiro);
      return;
    }
    const extra = dado === 6 || r.capturadas.length > 0 || r.chegou;
    if (extra) {
      if (!await ctl.esperar(250)) return;
      if (!humano) ctl.status(`${nomes[cor]} joga de novo…`, 'robo');
      return proximoTurno();
    }
    return passar(cor, 250);
  }

  async function passar(cor, ms) {
    if (!await ctl.esperar(ms)) return;
    estado = { ...estado, vez: ludo.proxima(estado, cor), seis: 0 };
    proximoTurno();
  }

  async function andar(j) {
    const g = pecasEl[j.cor][j.peca];
    const pecas = estado.pecas.map((l) => l.slice());
    const passos = j.de < 0 ? [0] : Array.from({ length: j.para - j.de }, (_, k) => j.de + k + 1);
    for (const p of passos) {
      pecas[j.cor][j.peca] = p;
      const [y, x] = ludo.posicao(j.cor, p, j.peca);
      g.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
      svg.append(g);
      if (!await ctl.esperar(150)) return false;
    }
    return true;
  }

  function escolherPeca(cor, peca) {
    if (fase !== 'peca' || cor !== 0 || !resolverEscolha) return;
    const ops = ludo.jogadas(estado, 0, estado.dado);
    const j = ops.find((o) => o.peca === peca);
    if (j) resolverEscolha(j);
  }

  function reiniciar() {
    resolverEscolha?.(null);
    config();
  }

  config();
  return { reiniciar };
}

rota();
