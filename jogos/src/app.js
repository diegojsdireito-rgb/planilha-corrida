import { el } from './comum.js';
import { prefs, guardar, registrar, placarDe, melhorTempo, salvar, lerSalvo, apagarSalvo, pedirPersistencia } from './dados.js';
import { montarCopiaCartao } from './copia.js';
import { tocar, destravar } from './som.js';
import { montarPainel } from './painel.js';
import { formatarTempo } from './comum.js';
import * as telaLudo from './telas/ludo.js';
import * as telaXadrez from './telas/xadrez.js';
import * as telaDamas from './telas/damas.js';
import * as telaReversi from './telas/reversi.js';
import * as telaLig4 from './telas/lig4.js';
import * as telaVelha from './telas/velha.js';
import * as telaPaciencia from './telas/paciencia.js';
import * as telaSudoku from './telas/sudoku.js';

const app = document.getElementById('app');
const NIVEIS = [['facil', 'Fácil'], ['medio', 'Médio'], ['dificil', 'Difícil']];

const ICONES = {
  ludo: '<svg viewBox="0 0 15 15"><rect width="15" height="15" rx="2" fill="#fff"/><rect width="6" height="6" fill="var(--vermelho)"/><rect x="9" width="6" height="6" fill="var(--verde)"/><rect x="9" y="9" width="6" height="6" fill="var(--amarelo)"/><rect y="9" width="6" height="6" fill="var(--azul)"/><path d="M6 6h3L7.5 7.5z" fill="var(--verde)"/><path d="M9 6v3L7.5 7.5z" fill="var(--amarelo)"/><path d="M6 9h3L7.5 7.5z" fill="var(--azul)"/><path d="M6 6v3L7.5 7.5z" fill="var(--vermelho)"/></svg>',
  xadrez: '<svg viewBox="0 0 4 4"><rect width="4" height="4" fill="#eeeed2"/><path d="M1 0h1v1H1zM3 0h1v1H3zM0 1h1v1H0zM2 1h1v1H2zM1 2h1v1H1zM3 2h1v1H3zM0 3h1v1H0zM2 3h1v1H2z" fill="#769656"/><text x="2" y="3.05" font-size="2.9" text-anchor="middle" fill="#fff" stroke="#222" stroke-width=".12">♞&#xFE0E;</text></svg>',
  damas: '<svg viewBox="0 0 4 4"><rect width="4" height="4" fill="var(--madeira-clara)"/><path d="M1 0h1v1H1zM3 0h1v1H3zM0 1h1v1H0zM2 1h1v1H2zM1 2h1v1H1zM3 2h1v1H3zM0 3h1v1H0zM2 3h1v1H2z" fill="var(--madeira-escura)"/><circle cx="1.5" cy="2.5" r=".38" fill="#f3eee4"/><circle cx="2.5" cy="1.5" r=".38" fill="#23262d"/><circle cx="0.5" cy="3.5" r=".38" fill="#f3eee4"/></svg>',
  reversi: '<svg viewBox="0 0 4 4"><rect width="4" height="4" rx=".3" fill="#2e8b57"/><circle cx="1.5" cy="1.5" r=".4" fill="#fff"/><circle cx="2.5" cy="2.5" r=".4" fill="#fff"/><circle cx="2.5" cy="1.5" r=".4" fill="#15171c"/><circle cx="1.5" cy="2.5" r=".4" fill="#15171c"/></svg>',
  lig4: '<svg viewBox="0 0 4 4"><rect width="4" height="4" rx=".4" fill="#2853c9"/><g fill="#fff"><circle cx=".7" cy=".7" r=".32"/><circle cx="1.6" cy=".7" r=".32"/><circle cx="2.5" cy=".7" r=".32"/><circle cx="3.3" cy=".7" r=".32"/><circle cx=".7" cy="1.6" r=".32"/><circle cx="1.6" cy="1.6" r=".32"/><circle cx="3.3" cy="1.6" r=".32"/></g><g fill="var(--vermelho)"><circle cx="2.5" cy="1.6" r=".32"/><circle cx=".7" cy="2.5" r=".32"/><circle cx="1.6" cy="3.3" r=".32"/><circle cx="3.3" cy="3.3" r=".32"/></g><g fill="var(--amarelo)"><circle cx="1.6" cy="2.5" r=".32"/><circle cx="2.5" cy="2.5" r=".32"/><circle cx="3.3" cy="2.5" r=".32"/><circle cx=".7" cy="3.3" r=".32"/><circle cx="2.5" cy="3.3" r=".32"/></g></svg>',
  velha: '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="var(--preenchido)"/><path d="M4 1.5v9M8 1.5v9M1.5 4h9M1.5 8h9" stroke="var(--suave)" stroke-width=".5" stroke-linecap="round"/><path d="M1.8 1.8l1.4 1.4M3.2 1.8 1.8 3.2M8.8 8.8l1.4 1.4M10.2 8.8l-1.4 1.4" stroke="var(--vermelho)" stroke-width=".6" stroke-linecap="round"/><circle cx="6" cy="6" r="1" fill="none" stroke="var(--azul)" stroke-width=".6"/></svg>',
  paciencia: '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#1f6f4a"/><g transform="rotate(-12 6 7)"><rect x="2" y="2.6" width="5" height="7" rx=".6" fill="#fff" stroke="#ccc" stroke-width=".15"/><text x="3.4" y="4.8" font-size="1.8" fill="#d03b3b">A</text></g><g transform="rotate(10 6 7)"><rect x="5" y="2.4" width="5" height="7" rx=".6" fill="#fff" stroke="#ccc" stroke-width=".15"/><text x="7.5" y="7.4" font-size="3.2" text-anchor="middle" fill="#1d1b18">♠&#xFE0E;</text></g></svg>',
  sudoku: '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#fff" stroke="#d8d2c4" stroke-width=".3"/><path d="M4 1v10M8 1v10M1 4h10M1 8h10" stroke="#3b3a36" stroke-width=".35"/><g font-size="2.4" text-anchor="middle" font-family="sans-serif" font-weight="700"><text x="2.5" y="3.4" fill="#1d1b18">5</text><text x="6" y="7" fill="#2a78d6">3</text><text x="9.5" y="10.6" fill="#1d1b18">9</text><text x="9.5" y="3.4" fill="#2a78d6">1</text><text x="2.5" y="10.6" fill="#1d1b18">7</text></g></svg>',
};

const JOGOS = [
  { id: 'ludo', nome: 'Ludo', descricao: 'Você e até 3 robôs', tela: telaLudo, regras: [
    'Tire 6 no dado para tirar uma peça da base.',
    'Tirou 6, capturou uma peça ou chegou ao centro: joga de novo. Três 6 seguidos perdem a vez.',
    'Parar numa casa com peça adversária manda ela de volta para a base, menos nas casas com estrela e nas saídas.',
    'Para chegar ao centro, o número do dado precisa ser exato. Ganha quem levar as 4 peças primeiro.',
  ] },
  { id: 'xadrez', nome: 'Xadrez', descricao: 'Você de brancas', tela: telaXadrez, regras: [
    'Toque numa peça para ver as casas possíveis e toque no destino.',
    'Valem roque, en passant e promoção (você escolhe a peça).',
    'Ganha quem der xeque-mate. Afogamento, 50 lances sem captura nem lance de peão, repetição tripla e material insuficiente são empate.',
    'No difícil, o robô analisa 4 lances à frente.',
  ] },
  { id: 'damas', nome: 'Damas', descricao: 'Regras brasileiras', tela: telaDamas, regras: [
    'As pedras andam uma casa na diagonal, para a frente. Você joga com as claras e começa.',
    'A captura é obrigatória e pode ser para trás. Se houver mais de um caminho, vale o que captura mais peças.',
    'A pedra que termina a jogada na última linha vira dama, que anda e captura à distância.',
    'Perde quem ficar sem peças ou sem jogada. Com 20 lances seguidos só de damas, sem captura, é empate.',
  ] },
  { id: 'reversi', nome: 'Reversi', descricao: 'Vire as peças do robô', tela: telaReversi, regras: [
    'Você joga com as pretas. Cada peça precisa prender peças brancas entre ela e outra preta, em linha.',
    'As peças presas viram para a sua cor. Sem jogada possível, a vez passa.',
    'Ganha quem tiver mais peças quando ninguém mais puder jogar.',
  ] },
  { id: 'lig4', nome: 'Quatro em Linha', descricao: 'Alinhe 4 peças', tela: telaLig4, regras: [
    'Toque numa coluna para soltar sua peça vermelha. Ela cai até a casa livre mais baixa.',
    'Ganha quem alinhar 4 peças na horizontal, vertical ou diagonal.',
    'Quem começa alterna a cada partida.',
  ] },
  { id: 'velha', nome: 'Jogo da Velha', descricao: 'Clássico 3 × 3', tela: telaVelha, regras: [
    'Você é o X. Ganha quem completar uma linha, coluna ou diagonal.',
    'No nível difícil, o robô não erra: o melhor resultado possível é o empate.',
    'Quem começa alterna a cada partida.',
  ] },
  { id: 'paciencia', nome: 'Paciência', descricao: 'Solo, com dicas do robô', solo: true, semNivel: true, tela: telaPaciencia, regras: [
    'Monte as quatro fundações, uma por naipe, do Ás ao Rei.',
    'Nas colunas, as cartas descem alternando vermelho e preto. Só o Rei vai para coluna vazia.',
    'Toque numa carta e ela vai sozinha para o melhor lugar. Se houver dúvida, toque na carta e depois no destino.',
    'Toque no monte para comprar uma carta. Quando acabar, toque de novo para recomeçar o monte.',
    'Quando todas as cartas estiverem abertas, o jogo termina sozinho.',
  ] },
  { id: 'sudoku', nome: 'Sudoku', descricao: 'Grades geradas na hora', solo: true, tela: telaSudoku, regras: [
    'Preencha a grade para que cada linha, coluna e quadrado 3 × 3 tenha os números de 1 a 9.',
    'Números errados ficam em vermelho e contam como erro.',
    'Use Notas para anotar candidatos. O número embaixo de cada tecla mostra quantos faltam.',
    'O nível vale para a próxima grade. No computador, dá para usar o teclado e as setas.',
  ] },
];
for (const j of JOGOS) j.icone = ICONES[j.id];

let sairDaTela = null;

document.addEventListener('pointerdown', destravar);

function botaoSom() {
  const b = el('button', 'botao-icone som');
  const desenhar = () => {
    b.textContent = prefs.som ? '🔊' : '🔇';
    b.setAttribute('aria-label', prefs.som ? 'Desligar sons' : 'Ligar sons');
    b.setAttribute('aria-pressed', String(prefs.som));
  };
  b.onclick = () => { prefs.som = !prefs.som; guardar(); desenhar(); tocar('clique'); };
  desenhar();
  return b;
}

function seletorNivel(rotulo = 'Nível do robô') {
  const caixa = el('div', 'niveis');
  caixa.setAttribute('role', 'group');
  caixa.setAttribute('aria-label', rotulo);
  for (const [id, nome] of NIVEIS) {
    const b = el('button', '', nome);
    b.setAttribute('aria-pressed', String(prefs.nivel === id));
    b.onclick = () => {
      prefs.nivel = id;
      guardar();
      tocar('clique');
      for (const outro of caixa.children) outro.setAttribute('aria-pressed', String(outro === b));
    };
    caixa.append(b);
  }
  return caixa;
}

function haQuanto(t) {
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

function resumoDoJogo(jogo) {
  if (jogo.solo) {
    const n = prefs.historico.filter((h) => h.j === jogo.id && h.r === 'vitoria').length;
    const m = melhorTempo(jogo.id);
    return `<b>${n}</b> ${n === 1 ? 'resolvido' : 'resolvidos'}${m ? ` · ${formatarTempo(m)}` : ''}`;
  }
  const p = placarDe(jogo.id);
  return `<b>${p.v} × ${p.d}</b> você × robô`;
}

// ---------- Tela inicial ----------

function inicio() {
  sairDaTela?.();
  sairDaTela = null;
  app.replaceChildren();
  document.title = 'Mesa de Jogos';

  const topo = el('header', 'banner');
  const textos = el('div', '', '<p class="sobre">Você contra o robô</p><h1>Mesa de Jogos</h1>');
  topo.append(textos, botaoSom());
  app.append(topo);

  app.append(el('p', 'rotulo', 'Nível do robô'), seletorNivel());

  const andamento = JOGOS.map((j) => ({ jogo: j, salvo: lerSalvo(j.id) })).filter((x) => x.salvo).sort((a, b) => b.salvo.quando - a.salvo.quando);
  if (andamento.length) {
    app.append(el('p', 'rotulo', 'Continuar de onde parou'));
    const faixa = el('div', 'continuar');
    for (const { jogo, salvo } of andamento) {
      const b = el('button', 'cartao-continuar', `<span class="mini">${jogo.icone}</span><span><strong>${jogo.nome}</strong><small>${haQuanto(salvo.quando)}</small></span><span class="seta">▶</span>`);
      b.onclick = () => abrir(jogo);
      faixa.append(b);
    }
    app.append(faixa);
  }

  app.append(el('p', 'rotulo', 'Jogos'));
  const lista = el('div', 'grade-jogos');
  for (const jogo of JOGOS) {
    const b = el('button', `cartao-jogo jogo-${jogo.id}`, `
      <div class="icone">${jogo.icone}</div>
      <strong>${jogo.nome}</strong>
      <span class="desc">${jogo.descricao}</span>
      <span class="placar-mini">${resumoDoJogo(jogo)}</span>
      ${lerSalvo(jogo.id) ? '<span class="selo">em andamento</span>' : ''}`);
    b.onclick = () => abrir(jogo);
    lista.append(b);
  }
  app.append(lista);

  app.append(el('p', 'rotulo', 'Seu painel'));
  montarPainel(app, JOGOS, abrir);
  montarCopiaCartao(app, JOGOS, inicio);
}

pedirPersistencia();

// ---------- Tela de jogo ----------

function abrir(jogo) {
  tocar('clique');
  sairDaTela?.();
  app.replaceChildren();
  document.title = `${jogo.nome} · Mesa de Jogos`;
  let geracao = 0;
  const empurrou = location.hash !== `#${jogo.id}`;

  const barra = el('div', 'barra');
  const voltar = el('button', 'botao-icone', '‹');
  voltar.setAttribute('aria-label', 'Voltar');
  voltar.onclick = () => {
    if (empurrou) history.back();
    else { history.replaceState(null, '', location.pathname); inicio(); }
  };
  barra.append(voltar, el('h2', '', `<span class="mini">${jogo.icone}</span>${jogo.nome}`), botaoSom());

  const placar = el('div', 'placar');
  const status = el('div', 'status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const area = el('div', 'area');
  const acoes = el('div', 'acoes');
  const nova = el('button', 'botao', 'Nova partida');
  acoes.append(nova);
  const regras = el('details', 'regras', `<summary>Como jogar</summary><ul>${jogo.regras.map((r) => `<li>${r}</li>`).join('')}</ul>`);

  app.append(barra);
  if (!jogo.semNivel) app.append(seletorNivel(jogo.solo ? 'Nível da próxima grade' : 'Nível do robô'));
  app.append(placar, status, area, acoes, regras);

  const desenharPlacar = () => {
    if (jogo.solo) {
      const n = prefs.historico.filter((h) => h.j === jogo.id && h.r === 'vitoria').length;
      const m = melhorTempo(jogo.id, jogo.semNivel ? undefined : prefs.nivel);
      placar.innerHTML = `<span class="lado"><span class="avatar voce">🏆</span>Resolvidos <span class="num">${n}</span></span><span class="x">·</span><span class="lado">Melhor tempo${jogo.semNivel ? '' : ` (${NIVEIS.find((x) => x[0] === prefs.nivel)[1].toLowerCase()})`} <span class="num">${m ? formatarTempo(m) : '—'}</span></span>`;
      return;
    }
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
    som: tocar,
    status(texto, tipo = '') { status.textContent = texto; status.className = `status ${tipo}`; },
    async esperar(ms) { const g = geracao; await new Promise((r) => setTimeout(r, ms)); return g === geracao; },
    ativa() { const g = geracao; return () => g === geracao; },
    salvar(estado) { salvar(jogo.id, estado); },
    salvo: () => lerSalvo(jogo.id),
    // Quem começa alterna a cada partida terminada.
    roboComeca() { const p = placarDe(jogo.id); return (p.v + p.d + p.e) % 2 === 1; },
    fim(resultado, texto, alvo, extra = {}) {
      apagarSalvo(jogo.id);
      registrar(jogo.id, resultado, extra);
      desenharPlacar();
      tocar(resultado);
      const padrao = { vitoria: jogo.solo ? 'Resolvido! 🎉' : 'Você venceu! 🎉', derrota: 'O robô venceu 🤖', empate: 'Empate 🤝' }[resultado];
      ctl.status(texto ?? padrao, resultado);
      if (alvo) alvo.append(el('div', 'faixa-fim', `<div>${padrao}</div>`));
    },
  };

  const instancia = jogo.tela.montar(area, ctl);
  nova.onclick = () => {
    geracao++;
    apagarSalvo(jogo.id);
    area.querySelectorAll('.faixa-fim').forEach((f) => f.remove());
    tocar('clique');
    instancia.reiniciar();
  };
  sairDaTela = () => { geracao++; };
  if (empurrou) history.pushState(null, '', `#${jogo.id}`);
}

window.addEventListener('popstate', rota);
function rota() {
  const jogo = JOGOS.find((j) => `#${j.id}` === location.hash);
  if (jogo) abrir(jogo); else inicio();
}

rota();
