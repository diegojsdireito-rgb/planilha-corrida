import { el } from './comum.js';
import { prefs, guardar, registrar, placarDe, melhorTempo, salvar, lerSalvo, apagarSalvo, pedirPersistencia, listaDePerfis, perfilAtual, temVariosPerfis, trocarPerfil, criarPerfil, editarPerfil, apagarPerfil, resumoDoPerfil, AVATARES, LIMITE_PERFIS } from './dados.js';
import { montarCopiaCartao } from './copia.js';
import { ligarPuxada } from '../../src/gestos.js';
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
import * as telaDocinhos from './telas/docinhos.js';
import * as telaCorrida from './telas/corrida.js';
import * as telaPintar from './telas/pintar.js';
import { DESENHOS } from './pintar-desenhos.js';
import { retrato } from './personagem.js';

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

ICONES.docinhos = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#ffe3ec"/><path d="M3.4 5.6C1.9 4.5 1.5 3.6 2 2.9 2.5 2.2 3.2 2.5 3.4 3 3.6 2.5 4.3 2.2 4.8 2.9 5.3 3.6 4.9 4.5 3.4 5.6Z" fill="#ef4b5f"/><circle cx="8.6" cy="3.7" r="1.7" fill="#ff9a1f"/><path d="M3.4 6.6 4 8 5.4 8.1 4.3 9 4.7 10.4 3.4 9.6 2.1 10.4 2.5 9 1.4 8.1 2.8 8Z" fill="#ffd21f"/><path d="M8.6 6.4C9.4 7.6 10.1 8.3 10.1 9A1.5 1.5 0 0 1 7.1 9C7.1 8.3 7.8 7.6 8.6 6.4Z" fill="#3e8bff"/></svg>';
ICONES.pintar = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#fff4d6"/><path d="M6 1.6C3 1.6 1.4 3.6 1.4 5.8c0 2.4 1.9 4.4 4.3 4.4.8 0 1-.5 1-.9 0-.6-.5-.8-.5-1.3 0-.6.5-.9 1.1-.9h1.2c1.3 0 2.2-.9 2.2-2.3C10.7 3.2 8.7 1.6 6 1.6Z" fill="#e9c27a" stroke="#9a6b22" stroke-width=".3"/><circle cx="3.6" cy="5.4" r=".8" fill="#e53935"/><circle cx="5.2" cy="3.6" r=".8" fill="#ffd21f"/><circle cx="7.5" cy="3.7" r=".8" fill="#2e9e4f"/><circle cx="8.9" cy="5.6" r=".8" fill="#1e63d6"/><circle cx="4" cy="7.7" r=".8" fill="#8e5bd6"/><path d="M11.2 6.8 7.4 10.6" stroke="#8d5a2b" stroke-width=".7" stroke-linecap="round"/><path d="M7.6 10.4 6.6 11.4l.3-1.3Z" fill="#ff5c8a" stroke="#ff5c8a" stroke-width=".5" stroke-linejoin="round"/></svg>';
ICONES.corrida = `<svg viewBox="0 0 100 100"><defs><linearGradient id="ceu-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#ffe2c4"/></linearGradient></defs><rect width="100" height="100" rx="18" fill="url(#ceu-c)"/><path d="M0 70 H100 V100 H0Z" fill="#6cc070"/><path d="M38 62 H62 L92 100 H8Z" fill="#efe2d1"/><g transform="translate(14 22) scale(.72)">${retrato({ pele: 1, roupa: 0 }).replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;

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
  { id: 'corrida', nome: 'Corrida dos Cachinhos', descricao: 'Mochila a jato, skates e poderes', solo: true, rotuloNivel: 'Velocidade', tela: telaCorrida,
    resumo() {
      const n = prefs.historico.filter((h) => h.j === 'corrida').length;
      const r = telaCorrida.recorde();
      return {
        cartao: r ? `<b>${r.toLocaleString('pt-BR')}</b> recorde` : 'Sem corridas ainda',
        placar: `<span class="lado"><span class="avatar voce">🏃‍♀️</span>Corridas <span class="num">${n}</span></span><span class="x">·</span><span class="lado">Recorde <span class="num">${r ? r.toLocaleString('pt-BR') : '—'}</span></span>`,
        painel: { valor: r ? r.toLocaleString('pt-BR') : '—', rotulo: 'recorde de pontos', sub: `${n} ${n === 1 ? 'corrida' : 'corridas'}` },
      };
    },
    regras: [
      'A corrida ocupa a tela inteira e é só com gestos: deslize para os lados para trocar de faixa, para cima para pular e para baixo para deslizar. No computador, use as setas.',
      'Pule as cercas, deslize por baixo das bandeirinhas e troque de faixa para fugir dos carrinhos de sorvete.',
      'Pegue moedas: elas ficam guardadas e compram skates, cargas de skate e melhorias na Loja.',
      'Na pista aparecem itens que valem na hora em que são pegos: 🎒 mochila a jato (voa por cima de tudo), 🧲 ímã, 👟 tênis de mola (super pulos, até por cima dos carrinhos), 🛡️ escudo, ✖2 pontos em dobro, 💰 baú com 50 moedas, 🚀 foguete (supercarga na hora) e 🛹 skate grátis.',
      'Bônus de largada: com uma mochila a jato comprada na Loja, toque em "Decolar" nos primeiros segundos e comece voando.',
      'Os raios ⚡ enchem a barra da supercarga. Quando ela enche, a supercarga liga sozinha: corre mais rápido, pula mais alto e atravessa os obstáculos.',
      'Toque duas vezes na tela para subir no skate (gasta uma carga): ele aguenta uma batida. O voador pula mais alto; o supersônico é mais rápido e dá moedas em dobro.',
      'Cumpra missões e abra o presente do dia na aba Prêmios para ganhar mais moedas.',
    ] },
  { id: 'docinhos', nome: 'Docinhos', descricao: 'Junte 3 doces iguais', solo: true, semNivel: true, tela: telaDocinhos,
    resumo() {
      const fase = telaDocinhos.nivelLiberado();
      const melhores = {};
      for (const h of prefs.historico) if (h.j === 'docinhos' && h.estrelas) melhores[h.nivel] = Math.max(melhores[h.nivel] ?? 0, h.estrelas);
      const est = Object.values(melhores).reduce((t, n) => t + n, 0);
      return {
        cartao: `<b>Fase ${fase}</b> · ${est} ★`,
        placar: `<span class="lado"><span class="avatar voce">🍬</span>Fase <span class="num">${fase}</span></span><span class="x">·</span><span class="lado">Estrelas <span class="num">${est}</span></span>`,
        painel: { valor: `Fase ${fase}`, rotulo: 'próxima fase', sub: `${est} ${est === 1 ? 'estrela' : 'estrelas'} conquistadas` },
      };
    },
    regras: [
      'Arraste um doce para o lado, ou toque nele e depois no vizinho, para trocar os dois de lugar.',
      'A troca só vale se formar uma linha de 3 ou mais doces iguais. Os doces somem e outros caem de cima.',
      '4 em linha vira um doce listrado, que limpa a linha ou a coluna. L ou T vira uma bomba. 5 em linha vira o arco-íris, que limpa todos de uma cor.',
      'Faça a meta de pontos antes de acabarem os movimentos. Mais pontos dão até 3 estrelas.',
      'Ficou parado? O robô mostra uma troca possível.',
    ] },
  { id: 'pintar', nome: 'Pintar', descricao: 'Canetinhas, pincéis e purpurina', solo: true, semNivel: true, tela: telaPintar, rotuloNovo: 'Escolher outro desenho',
    resumo() {
      const n = telaPintar.desenhosTerminados();
      const total = DESENHOS.length;
      return {
        cartao: n ? `<b>${n}</b> de ${total} pintados` : `${total} desenhos para pintar`,
        placar: `<span class="lado"><span class="avatar voce">🎨</span>Desenhos pintados <span class="num">${n} de ${total}</span></span>`,
        painel: { valor: `${n}`, rotulo: 'desenhos pintados', sub: `de ${total}` },
      };
    },
    regras: [
      'Escolha um desenho na galeria (ou a folha em branco) e pinte do seu jeito. A pintura fica guardada e continua de onde parou.',
      'Ferramentas: canetinha, pincel, giz de cera, lápis de cor, spray, marca-texto, carimbos de estrelinhas e coraçõezinhos, balde de tinta e borracha.',
      'O balde pinta de uma vez a parte do desenho em que você tocar. Os outros riscam por baixo das linhas, sem estragar o contorno.',
      'Tipos de cor: normal, arco-íris (muda de cor enquanto você risca), purpurina, neon e degradê. Escolha também a grossura.',
      'Use ↩️ para desfazer, 💾 para salvar a imagem em Fotos ou Arquivos e ✅ quando terminar.',
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

// O iPhone libera o áudio em gestos diferentes conforme a versão: vale qualquer um deles.
for (const evento of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(evento, destravar, { capture: true, passive: true });

function botaoSom() {
  const b = el('button', 'botao-icone som');
  const desenhar = () => {
    b.textContent = prefs.som ? '🔊' : '🔇';
    b.setAttribute('aria-label', prefs.som ? 'Desligar sons' : 'Ligar sons');
    b.setAttribute('aria-pressed', String(prefs.som));
  };
  b.onclick = () => { prefs.som = !prefs.som; guardar(); destravar(); desenhar(); tocar('clique'); };
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
  if (jogo.resumo) return jogo.resumo().cartao;
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
  document.documentElement.classList.remove('jogo-tela-cheia');
  naTelaInicial = true;
  app.replaceChildren();
  document.title = 'Mesa de Jogos';

  const topo = el('header', 'banner');
  const textos = el('div', '', '<p class="sobre">Você contra o robô</p><h1>Mesa de Jogos</h1>');
  const eu = perfilAtual();
  const chip = el('button', 'chip-perfil', `<span class="avatar-perfil">${eu.avatar}</span><span><small>Jogando agora</small><b></b></span><span class="troca">Trocar</span>`);
  chip.querySelector('b').textContent = eu.nome;
  chip.setAttribute('aria-label', `Jogador: ${eu.nome}. Trocar de jogador`);
  chip.onclick = () => { tocar('clique'); irPara('#jogadores'); };
  textos.append(chip);
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

// ---------- Jogadores ----------
// Várias pessoas no mesmo aparelho: cada uma escolhe o seu perfil e continua de onde parou.

function irPara(hash) {
  if (location.hash === hash) return rota();
  history.pushState({ voltaParaInicio: true }, '', hash || location.pathname);
  rota();
}

function telaJogadores({ abertura = false } = {}) {
  sairDaTela?.();
  sairDaTela = null;
  naTelaInicial = false;
  document.documentElement.classList.remove('jogo-tela-cheia');
  document.title = 'Jogadores · Mesa de Jogos';
  let editando = false;

  const escolher = (id) => {
    trocarPerfil(id);
    tocar('clique');
    if (!abertura && history.state?.voltaParaInicio) history.back();
    else { history.replaceState(null, '', location.pathname); inicio(); }
  };

  function desenhar() {
    app.replaceChildren();
    const barra = el('div', 'barra');
    if (!abertura) {
      const voltar = el('button', 'botao-icone', '‹');
      voltar.setAttribute('aria-label', 'Voltar');
      voltar.onclick = () => {
        if (history.state?.voltaParaInicio) history.back();
        else { history.replaceState(null, '', location.pathname); inicio(); }
      };
      barra.append(voltar);
    }
    barra.append(el('h2', '', 'Quem vai jogar?'));
    const editar = el('button', 'botao secundario pequeno', editando ? 'Pronto' : 'Editar');
    editar.onclick = () => { editando = !editando; tocar('clique'); desenhar(); };
    barra.append(editar);
    app.append(barra);
    app.append(el('p', 'sub-jogadores', editando
      ? 'Toque num jogador para mudar o nome ou a figura, ou para apagar.'
      : 'Cada jogador tem o próprio placar, moedas, personagem e jogos em andamento.'));

    const atual = perfilAtual().id;
    const grade = el('div', 'grade-jogadores');
    for (const p of listaDePerfis()) {
      const r = resumoDoPerfil(p.id);
      const b = el('button', `cartao-jogador${p.id === atual ? ' atual' : ''}`,
        `<span class="avatar-grande">${p.avatar}</span><strong></strong><small>${r.partidas} ${r.partidas === 1 ? 'partida' : 'partidas'} · ${r.moedas.toLocaleString('pt-BR')} 🪙</small>${p.id === atual ? '<span class="selo">jogando</span>' : ''}${editando ? '<span class="lapis">✏️</span>' : ''}`);
      b.querySelector('strong').textContent = p.nome;
      b.onclick = () => (editando ? formulario(p) : escolher(p.id));
      grade.append(b);
    }
    if (listaDePerfis().length < LIMITE_PERFIS) {
      const novo = el('button', 'cartao-jogador novo', '<span class="avatar-grande">＋</span><strong>Novo jogador</strong><small>Começa do zero</small>');
      novo.onclick = () => formulario(null);
      grade.append(novo);
    }
    app.append(grade);
  }

  function formulario(perfil) {
    tocar('clique');
    app.replaceChildren();
    const barra = el('div', 'barra');
    const voltar = el('button', 'botao-icone', '‹');
    voltar.setAttribute('aria-label', 'Cancelar');
    voltar.onclick = () => desenhar();
    barra.append(voltar, el('h2', '', perfil ? 'Editar jogador' : 'Novo jogador'));
    app.append(barra);

    let avatar = perfil?.avatar ?? AVATARES.find((a) => !listaDePerfis().some((p) => p.avatar === a)) ?? AVATARES[0];
    const form = el('form', 'grafico form-jogador');
    form.innerHTML = `
      <label class="campo"><span>Nome</span><input name="nome" maxlength="20" autocomplete="off" placeholder="Ex.: Ana"></label>
      <span class="rot-avatar">Figura</span>
      <div class="avatares">${AVATARES.map((a) => `<button type="button" data-avatar="${a}" aria-pressed="${a === avatar}">${a}</button>`).join('')}</div>
      <p class="aviso-copia" role="status"></p>
      <div class="acoes-solo"><button class="botao" type="submit">${perfil ? 'Salvar' : 'Criar e jogar'}</button></div>`;
    const campo = form.querySelector('input');
    campo.value = perfil?.nome ?? '';
    const aviso = form.querySelector('.aviso-copia');
    form.querySelectorAll('[data-avatar]').forEach((b) => {
      b.onclick = () => {
        avatar = b.dataset.avatar;
        tocar('clique');
        form.querySelectorAll('[data-avatar]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      };
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      try {
        if (perfil) { editarPerfil(perfil.id, { nome: campo.value, avatar }); tocar('acerto'); desenhar(); }
        else { const novo = criarPerfil(campo.value, avatar); tocar('acerto'); escolher(novo.id); }
      } catch (erro) { tocar('erro'); aviso.textContent = erro.message; }
    };
    app.append(form);

    if (perfil && listaDePerfis().length > 1) {
      const apagar = el('button', 'botao perigo');
      apagar.textContent = `Apagar ${perfil.nome}`;
      apagar.onclick = () => {
        if (!confirm(`Apagar ${perfil.nome}? O placar, as moedas e os jogos em andamento desse jogador somem para sempre.`)) return;
        apagarPerfil(perfil.id);
        tocar('clique');
        desenhar();
      };
      app.append(el('div', 'acoes-solo apagar-jogador'));
      app.lastChild.append(apagar);
    }
    if (!perfil) campo.focus();
  }

  desenhar();
}

pedirPersistencia();

// Puxar para atualizar: só no app aberto pelo ícone, que não tem o recarregar do Safari,
// e só na tela inicial, para não confundir com arrastar peças nos tabuleiros.
const instalado = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let naTelaInicial = false;
if (instalado) {
  ligarPuxada(app, document.getElementById('puxada'), {
    podeIniciar: () => naTelaInicial,
    async aoAtualizar() {
      // Busca a versão nova antes de recarregar; as partidas já estão salvas no aparelho.
      try { await fetch(location.pathname, { cache: 'reload' }); } catch { /* sem internet: recarrega o que houver */ }
      location.reload();
      await new Promise(() => {});
    },
  });
}

// ---------- Tela de jogo ----------

function abrir(jogo) {
  naTelaInicial = false;
  document.documentElement.classList.remove('jogo-tela-cheia');
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
  const nova = el('button', 'botao', jogo.rotuloNovo ?? 'Nova partida');
  acoes.append(nova);
  const regras = el('details', 'regras', `<summary>Como jogar</summary><ul>${jogo.regras.map((r) => `<li>${r}</li>`).join('')}</ul>`);

  app.append(barra);
  if (!jogo.semNivel) app.append(seletorNivel(jogo.rotuloNivel ?? (jogo.solo ? 'Nível da próxima grade' : 'Nível do robô')));
  app.append(placar, status, area, acoes, regras);

  const desenharPlacar = () => {
    if (jogo.resumo) { placar.innerHTML = jogo.resumo().placar; return; }
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
    sair: () => voltar.onclick(),
    alternarSom: () => { prefs.som = !prefs.som; guardar(); destravar(); tocar('clique'); return prefs.som; },
    apagar: () => apagarSalvo(jogo.id),
    // Quem começa alterna a cada partida terminada.
    roboComeca() { const p = placarDe(jogo.id); return (p.v + p.d + p.e) % 2 === 1; },
    fim(resultado, texto, alvo, extra = {}) {
      apagarSalvo(jogo.id);
      registrar(jogo.id, resultado, extra);
      desenharPlacar();
      tocar(resultado);
      const padrao = { vitoria: jogo.solo ? 'Resolvido! 🎉' : 'Você venceu! 🎉', derrota: jogo.solo ? 'Não foi dessa vez' : 'O robô venceu 🤖', empate: 'Empate 🤝', concluida: 'Fim da corrida' }[resultado];
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
  if (location.hash === '#jogadores') return telaJogadores();
  const jogo = JOGOS.find((j) => `#${j.id}` === location.hash);
  if (jogo) abrir(jogo); else inicio();
}

// Com mais de um jogador no aparelho, o app abre perguntando quem vai jogar.
if (temVariosPerfis() && !location.hash) telaJogadores({ abertura: true });
else rota();
