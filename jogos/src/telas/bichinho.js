// Tela do Meu Bichinho: adoção, quarto com o bichinho desenhado em SVG, comer, banho de
// espuma, seis brincadeiras, dormir (apaga a luz) e a loja de roupinhas, quarto, brinquedos e
// comidas. Estado em prefs.bichinho e moedas em prefs.carteira.moedas (ambos por perfil, via guardar()).
// A arte fica em bichinho-arte.js (bichinho e roupinhas) e bichinho-quarto.js (quarto e brinquedos);
// as brincadeiras em bichinho-brincar.js.
import { el } from '../comum.js';
import { prefs, guardar } from '../dados.js';
import * as bc from '../bichinho.js';
import { svgBichinho, VITRINE } from './bichinho-arte.js';
import { svgQuarto, svgItemQuarto, svgBrinquedo } from './bichinho-quarto.js';
import { TELAS_BRINCADEIRAS } from './bichinho-brincar.js';

export { svgBichinho };

export const INFO = {
  id: 'bichinho',
  nome: 'Meu Bichinho',
  descricao: 'Cuide do seu bichinho virtual',
  solo: true,
  semNivel: true,
  rotuloNovo: '🏠 Voltar para o quarto',
  regras: [
    'Na primeira vez, escolha o seu bichinho (gatinho, cachorrinho, coelhinho, dinossaurinho ou unicórnio) e dê um nome para ele.',
    'As barras mostram a barriguinha, a limpeza, a alegria e a energia. Elas caem devagar com o tempo, mesmo com o app fechado. Ele nunca fica doente: no máximo fica tristinho esperando você.',
    '🍎 Comer: escolha uma comida. As do dia a dia são de graça; as especiais vêm da loja.',
    '🛁 Banho: esfregue o bichinho com o dedo até encher de espuma e depois toque em Enxaguar.',
    `🎾 Brincar: escolha uma das seis brincadeiras — pegar a bolinha, bolhas de sabão, esconde-esconde, dança, pega o petisco e siga o bichinho. Indo bem, você ganha ${bc.MOEDAS_BRINCAR} 🪙; indo muito bem, ${bc.MOEDAS_SUPER} 🪙.`,
    '💤 Dormir: apaga a luz e a energia volta aos pouquinhos. Quando a energia enche, ele acorda sozinho.',
    `🛍️ Loja: roupinhas e fantasias, coisas para o quarto (até temas inteiros: praia, espaço e jardim encantado), brinquedos e comidas especiais, pagos com as moedas 🪙 do app. Cuidando do bichinho dá para ganhar até ${bc.LIMITE_MOEDAS_DIA} 🪙 por dia.`,
    'Cada brinquedo comprado fica no quarto e faz a alegria cair mais devagar. Toque nele para o bichinho brincar!',
    'Toque no bichinho para fazer carinho!',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#ffe6f0"/><path d="M2.4 5.6 2.9 1.9 5 3.6ZM9.6 5.6 9.1 1.9 7 3.6Z" fill="#ffb45e" stroke="#c96a1e" stroke-width=".3" stroke-linejoin="round"/><ellipse cx="6" cy="6.6" rx="4" ry="3.6" fill="#ffb45e" stroke="#c96a1e" stroke-width=".3"/><ellipse cx="4.5" cy="6.3" rx=".6" ry=".75" fill="#2a2135"/><ellipse cx="7.5" cy="6.3" rx=".6" ry=".75" fill="#2a2135"/><circle cx="4.3" cy="6" r=".22" fill="#fff"/><circle cx="7.3" cy="6" r=".22" fill="#fff"/><path d="M5.6 7.3h.8L6 7.7Z" fill="#ff6f91"/><path d="M5.3 8.1q.35.35.7 0 .35.35.7 0" stroke="#2a2135" stroke-width=".25" fill="none" stroke-linecap="round"/><ellipse cx="3.6" cy="7.6" rx=".6" ry=".35" fill="#ff8fb1" opacity=".6"/><ellipse cx="8.4" cy="7.6" rx=".6" ry=".35" fill="#ff8fb1" opacity=".6"/><path d="M9 1.4l.3.6.6.1-.45.4.1.6-.55-.3-.55.3.1-.6-.45-.4.6-.1Z" fill="#ff5c8a"/></svg>';

const FRASES = ['Eu gosto de você! 💛', 'Que dia lindo!', 'Faz carinho em mim?', 'Lá-lá-lá 🎵', 'Você é meu melhor amigo!', 'Hihi!'];
const FALAS_BRINQUEDO = {
  'bola-praia': 'Joga a bola! 🏐', patinho: 'Quác quác! 🦆', blocos: 'Vou montar uma torre! 🧱', piao: 'Olha ele girando! 🌀',
  carrinho: 'Vrum, vrum! 🚗', ursinho: 'Abraço de urso! 🧸', robo: 'Bip bop! 🤖', casinha: 'Minha casinha! 🏠',
};
const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- resumo para a tela inicial ----------
export function resumo() {
  const b0 = bc.normalizarBichinho(prefs.bichinho);
  if (!b0) {
    return {
      cartao: 'Adote um bichinho!',
      placar: '<span class="lado"><span class="avatar voce">🐾</span>Escolha e dê um nome ao seu bichinho</span>',
      painel: { valor: '🐾', rotulo: 'adote um bichinho', sub: 'gatinho, cachorrinho, coelhinho…' },
    };
  }
  const b = bc.atualizar(b0, Date.now());
  const h = bc.humor(b);
  const esp = bc.ESPECIES.find((e) => e.id === b.especie);
  const fantasia = bc.ACESSORIOS.find((a) => a.id === b.vestindo.corpo && a.fantasia);
  return {
    cartao: `<b>${b.nome}</b> · ${h.emoji} ${h.texto}`,
    placar: `<span class="lado"><span class="avatar voce">${esp.emoji}</span><b>${b.nome}</b></span><span class="x">·</span><span class="lado">${h.emoji} ${h.texto}</span>`,
    painel: { valor: b.nome, rotulo: `${h.emoji} ${h.texto}`, sub: fantasia ? `${esp.nome} de ${fantasia.nome.replace('Fantasia de ', '')}` : esp.nome },
  };
}

// ---------- tela ----------
export function montar(area, ctl) {
  const raiz = el('div', 'bichinho');
  area.append(raiz);
  let b = null;
  let modo = 'quarto';
  let vivo = ctl.ativa();
  let relogio = null;
  let jogo = null; // brincadeira em andamento
  let brincadeira = null; // id da última brincadeira escolhida
  let ultimoCarinho = 0;
  let ultimoBrinquedo = 0;
  let falaTimer = null;
  let especieEscolhida = null;

  const carteira = () => prefs.carteira ?? { moedas: 0 };
  const moedas = () => carteira().moedas ?? 0;
  function gravar(novo, novaCarteira) {
    b = novo;
    prefs.bichinho = novo;
    if (novaCarteira) prefs.carteira = novaCarteira;
    guardar();
  }
  const q = (s) => raiz.querySelector(s);

  function iniciar() {
    pararTudo();
    vivo = ctl.ativa();
    modo = 'quarto';
    const salvo = bc.normalizarBichinho(prefs.bichinho);
    if (!salvo) { telaAdocao(); return; }
    gravar(bc.atualizar(salvo, Date.now()));
    telaQuarto();
    const p = bc.pedido(b);
    if (bc.humor(b).id === 'triste') ctl.status(`${b.nome} está tristinho e com saudade... ${p ? p.texto : ''}`);
    else ctl.status(p ? `${b.nome}: ${p.texto}` : `Oi! ${b.nome} estava com saudade! 💛`);
  }

  function pararJogo() {
    if (jogo) { jogo.parar(); jogo = null; }
    q('.bichinho-cena')?.classList.remove('brincando');
    raiz.classList.remove('jogando');
  }
  function pararTudo() {
    clearInterval(relogio); relogio = null;
    clearTimeout(falaTimer);
    pararJogo();
  }

  // ---------- adoção ----------
  function telaAdocao(anterior = null) {
    pararTudo();
    especieEscolhida = null;
    raiz.className = 'bichinho bichinho-adocao';
    raiz.innerHTML = `
      <h3 class="bichinho-titulo">Escolha o seu bichinho!</h3>
      <div class="bichinho-especies">${bc.ESPECIES.map((e) => `<button class="bichinho-especie" data-especie="${e.id}" aria-label="${e.nome}"><span class="bichinho-mini bc-h-contente">${svgBichinho(e.id)}</span><span>${e.nome}</span></button>`).join('')}</div>
      <div class="bichinho-nomear" hidden>
        <label for="bichinho-nome">Qual vai ser o nome?</label>
        <input id="bichinho-nome" maxlength="16" autocomplete="off" placeholder="Escreva um nome">
        <div class="bichinho-sugestoes">${bc.NOMES_SUGERIDOS.slice(0, 6).map((n) => `<button class="bichinho-chip" data-nome="${n}">${n}</button>`).join('')}</div>
        <button class="bichinho-adotar">Adotar! 💛</button>
      </div>
      ${anterior ? '<button class="bichinho-link bichinho-cancelar">Voltar para o meu bichinho</button>' : ''}`;
    ctl.status(anterior ? 'As roupinhas, o quarto, os brinquedos e a despensa continuam seus.' : 'Toque no bichinho que você quer cuidar.');
    raiz.querySelectorAll('[data-especie]').forEach((botao) => {
      botao.onclick = () => {
        especieEscolhida = botao.dataset.especie;
        raiz.querySelectorAll('[data-especie]').forEach((x) => x.classList.toggle('escolhido', x === botao));
        pular(botao.querySelector('.bichinho-mini'));
        ctl.som('clique');
        const caixa = q('.bichinho-nomear');
        caixa.hidden = false;
        const e = bc.ESPECIES.find((x) => x.id === especieEscolhida);
        ctl.status(`Que lindo ${e.nome.toLowerCase()}! Agora dê um nome.`);
        caixa.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
      };
    });
    raiz.querySelectorAll('[data-nome]').forEach((c) => { c.onclick = () => { q('#bichinho-nome').value = c.dataset.nome; ctl.som('clique'); }; });
    q('.bichinho-adotar').onclick = () => {
      const r = bc.novoBichinho(especieEscolhida, q('#bichinho-nome').value, Date.now(), anterior);
      if (r.erro) { ctl.status(r.erro, 'derrota'); ctl.som('erro'); return; }
      gravar(r.bichinho);
      ctl.som('vitoria');
      vivo = ctl.ativa();
      telaQuarto();
      ctl.status(`Oi! Eu sou ${b.nome}! Que bom te conhecer! 💛`, 'vitoria');
      pular();
      coracoes(4);
    };
    q('#bichinho-nome').onkeydown = (ev) => { if (ev.key === 'Enter') q('.bichinho-adotar').click(); };
    const cancelar = q('.bichinho-cancelar');
    if (cancelar) cancelar.onclick = () => { ctl.som('clique'); iniciar(); };
  }

  // ---------- quarto ----------
  const deDia = () => { const h = new Date().getHours(); return h >= 6 && h < 18; };
  function telaQuarto() {
    raiz.className = 'bichinho';
    raiz.innerHTML = `
      <div class="bichinho-topo">
        <div class="bichinho-quem"><b class="bichinho-nome-txt"></b><span class="bichinho-humor"></span></div>
        <div class="bichinho-saldo" title="Moedas do app">🪙 <b></b></div>
      </div>
      <div class="bichinho-barras">${bc.BARRAS.map((x) => `<div class="bichinho-barra" data-barra="${x.id}"><span class="bichinho-barra-ic">${x.icone}</span><span class="bichinho-barra-trilho"><span class="bichinho-barra-cheio"></span></span><span class="bichinho-barra-rot">${x.nome}</span></div>`).join('')}</div>
      <div class="bichinho-cena">
        <div class="bichinho-fundo-lugar"></div>
        <div class="bichinho-escuro"></div>
        <div class="bichinho-pet-lugar"><button class="bichinho-pet" aria-label="Fazer carinho"></button></div>
        <div class="bichinho-balao" hidden></div>
        <div class="bichinho-zzz" aria-hidden="true"><span>Z</span><span>z</span><span>z</span></div>
        <div class="bichinho-fx" aria-hidden="true"></div>
      </div>
      <div class="bichinho-acoes">
        <button data-acao="comer"><span>🍎</span>Comer</button>
        <button data-acao="banho"><span>🛁</span>Banho</button>
        <button data-acao="brincar"><span>🎾</span>Brincar</button>
        <button data-acao="dormir"><span>💤</span>Dormir</button>
        <button data-acao="loja"><span>🛍️</span>Loja</button>
      </div>
      <div class="bichinho-painel"></div>`;
    desenharQuarto();
    desenharPet();
    q('.bichinho-pet').onclick = fazerCarinho;
    q('.bichinho-cena').addEventListener('click', tocarBrinquedo);
    raiz.querySelectorAll('[data-acao]').forEach((botao) => { botao.onclick = () => acao(botao.dataset.acao); });
    atualizarTela();
    mostrarPainel();
    clearInterval(relogio);
    relogio = setInterval(() => {
      if (!vivo()) { pararTudo(); return; }
      const estava = b.dormindo;
      b = bc.atualizar(b, Date.now());
      if (estava && !b.dormindo) {
        gravar(b);
        ctl.status(`${b.nome} acordou cheio de energia! ☀️`, 'vitoria');
        mostrarPainel();
      }
      atualizarTela();
    }, 2000);
    falar();
  }

  function desenharQuarto() {
    const lugar = q('.bichinho-fundo-lugar');
    if (lugar) lugar.innerHTML = svgQuarto(b, deDia());
  }

  function desenharPet() {
    const pet = q('.bichinho-pet');
    if (pet) pet.innerHTML = svgBichinho(b.especie, b.vestindo);
    atualizarTela();
  }

  // O placar do app (fora da área do jogo) mostra o nome e o humor: mantém atualizado.
  let placarAntes = '';
  function atualizarPlacar() {
    const placar = area.parentElement?.querySelector(':scope > .placar');
    const html = resumo().placar;
    if (placar && html !== placarAntes) { placar.innerHTML = html; placarAntes = html; }
  }

  function atualizarTela() {
    if (!q('.bichinho-cena')) return;
    atualizarPlacar();
    const h = bc.humor(b);
    q('.bichinho-nome-txt').textContent = b.nome;
    q('.bichinho-humor').textContent = `${h.emoji} ${h.texto}`;
    q('.bichinho-saldo b').textContent = fmt(moedas());
    for (const { id } of bc.BARRAS) {
      const v = b.barras[id];
      const barra = q(`[data-barra="${id}"]`);
      barra.querySelector('.bichinho-barra-cheio').style.width = `${Math.max(4, v)}%`;
      barra.classList.toggle('baixa', v < 30);
      barra.classList.toggle('media', v >= 30 && v < 60);
      barra.title = `${Math.round(v)}%`;
    }
    const lugar = q('.bichinho-pet-lugar');
    for (const id of Object.keys(bc.ESTADOS)) lugar.classList.toggle(`bc-h-${id}`, h.id === id);
    lugar.classList.toggle('bc-dorme', b.dormindo);
    const sujo = Math.max(0, Math.min(1, (60 - b.barras.limpeza) / 45));
    lugar.style.setProperty('--bc-sujo', (modo === 'banho' ? sujo * (1 - espumaAtual / 100) : sujo).toFixed(2));
    q('.bichinho-cena').classList.toggle('escuro', b.dormindo);
    const dormir = q('[data-acao="dormir"]');
    dormir.innerHTML = b.dormindo ? '<span>☀️</span>Acordar' : '<span>💤</span>Dormir';
    dormir.classList.toggle('ligado', b.dormindo);
    for (const a of ['comer', 'banho', 'brincar']) q(`[data-acao="${a}"]`).disabled = b.dormindo || Boolean(jogo && a !== 'brincar');
    q('[data-acao="loja"]').disabled = Boolean(jogo);
    raiz.querySelectorAll('[data-acao]').forEach((x) => x.classList.toggle('ativo', x.dataset.acao === modo || (modo === 'jogo' && x.dataset.acao === 'brincar')));
  }

  function falar(texto, ms = 3200) {
    const balao = q('.bichinho-balao');
    if (!balao) return;
    clearTimeout(falaTimer);
    if (b.dormindo) { balao.hidden = true; return; }
    const t = texto ?? bc.pedido(b)?.texto;
    if (!t) { balao.hidden = true; return; }
    balao.textContent = t;
    balao.hidden = false;
    balao.classList.remove('entra'); void balao.offsetWidth; balao.classList.add('entra');
    falaTimer = setTimeout(() => { if (vivo()) balao.hidden = true; }, ms);
  }

  function pular(alvo) {
    const lugar = alvo ?? q('.bichinho-pet-lugar');
    if (!lugar) return;
    lugar.classList.remove('bc-pula'); void lugar.getBoundingClientRect(); lugar.classList.add('bc-pula');
    setTimeout(() => lugar.classList.remove('bc-pula'), 1300);
  }

  // Ponto do desenho (coordenadas do viewBox do bichinho) dentro da cena, em px.
  function pontoDoPet(x, y) {
    const cena = q('.bichinho-cena').getBoundingClientRect();
    const svg = q('.bichinho-pet svg').getBoundingClientRect();
    return { x: svg.left - cena.left + (x / 200) * svg.width, y: svg.top - cena.top + ((y + 30) / 230) * svg.height };
  }

  function efeito(conteudo, classe, x, y, ms = 1400) {
    const fx = q('.bichinho-fx');
    if (!fx) return null;
    const e = el('span', `bichinho-efeito ${classe}`, conteudo);
    e.style.left = `${x}px`; e.style.top = `${y}px`;
    e.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 60)}px`);
    fx.append(e);
    setTimeout(() => e.remove(), ms);
    return e;
  }

  function coracoes(n = 2, emoji = '💖') {
    if (!q('.bichinho-pet svg')) return;
    for (let k = 0; k < n; k++) {
      const p = pontoDoPet(60 + Math.random() * 80, 20 + Math.random() * 40);
      setTimeout(() => efeito(emoji, 'sobe', p.x, p.y), k * 160);
    }
  }

  function moedinhas(ganhas) {
    if (!ganhas) return;
    const p = pontoDoPet(100, 30);
    efeito(`+${ganhas} 🪙`, 'sobe moeda', p.x, p.y, 1800);
    ctl.som('moeda');
    const saldo = q('.bichinho-saldo');
    saldo?.classList.remove('brilha'); void saldo?.offsetWidth; saldo?.classList.add('brilha');
  }

  function fazerCarinho() {
    if (modo === 'banho' || jogo) return;
    if (b.dormindo) { falar(); ctl.status('Shhh... está dormindo. 😴'); return; }
    const agora = Date.now();
    pular();
    coracoes(2);
    if (agora - ultimoCarinho < 1500) return;
    ultimoCarinho = agora;
    const r = bc.carinho(bc.atualizar(b, agora));
    if (r.bichinho) { gravar(r.bichinho); atualizarTela(); }
    ctl.som('acerto');
    falar(FRASES[Math.floor(Math.random() * FRASES.length)], 2200);
  }

  // Tocar num brinquedo do quarto: ele mexe e o bichinho brinca junto.
  function tocarBrinquedo(ev) {
    const g = ev.target.closest?.('.bq-brinquedo');
    if (!g || jogo || modo === 'banho') return;
    const id = g.dataset.brinquedo;
    const anima = g.querySelector('.bq-brinquedo-anima');
    anima.classList.remove('brinca'); void anima.getBoundingClientRect(); anima.classList.add('brinca');
    if (b.dormindo) { ctl.status('Shhh... está dormindo. 😴'); return; }
    const agora = Date.now();
    const r = bc.brincarComBrinquedo(bc.atualizar(b, agora), id);
    if (r.erro) { ctl.status(r.erro); falar(r.erro, 1800); return; }
    pular();
    ctl.som(id === 'patinho' ? 'apito' : id === 'robo' ? 'robo' : 'item');
    falar(FALAS_BRINQUEDO[id], 1800);
    const rc = q('.bichinho-cena').getBoundingClientRect();
    const rg = g.getBoundingClientRect();
    efeito('💛', 'sobe', rg.left - rc.left + rg.width / 2, rg.top - rc.top, 1200);
    if (agora - ultimoBrinquedo < 1500) return;
    ultimoBrinquedo = agora;
    gravar(r.bichinho);
    atualizarTela();
    ctl.status(`${b.nome} adorou brincar com ${r.brinquedo.nome.toLowerCase()}! 💛`);
  }

  function acao(nome) {
    ctl.som('clique');
    b = bc.atualizar(b, Date.now());
    if (nome === 'dormir') {
      const r = b.dormindo ? bc.acordar(b) : bc.dormir(b);
      if (r.erro) { ctl.status(r.erro); falar(r.erro); return; }
      pararJogo();
      gravar(r.bichinho);
      modo = 'quarto';
      if (b.dormindo) { ctl.status(`Boa noite, ${b.nome}! 🌙 A luz apagou.`); q('.bichinho-balao').hidden = true; } else { ctl.status(`Bom dia, ${b.nome}! ☀️`); pular(); }
      atualizarTela();
      mostrarPainel();
      return;
    }
    if (jogo) {
      // durante a brincadeira, o botão Brincar para e volta para a escolha
      pararJogo();
      modo = 'brincar';
      atualizarTela();
      mostrarPainel();
      ctl.status('Brincadeira parada. Escolha outra!');
      return;
    }
    modo = modo === nome ? 'quarto' : nome;
    atualizarTela();
    mostrarPainel();
  }

  // ---------- painéis ----------
  function mostrarPainel() {
    const painel = q('.bichinho-painel');
    if (!painel) return;
    q('.bichinho-cena').classList.toggle('esfregando', modo === 'banho');
    desligarBanho();
    if (modo === 'comer') return painelComer(painel);
    if (modo === 'banho') return painelBanho(painel);
    if (modo === 'brincar') return painelBrincar(painel);
    if (modo === 'loja') return painelLoja(painel);
    const resta = bc.moedasRestantesHoje(b, Date.now());
    const temBrinquedo = b.brinquedos.length > 0;
    painel.innerHTML = `<div class="bichinho-dica">${b.dormindo ? `😴 ${b.nome} está dormindo. A energia volta aos pouquinhos, e quando encher ${b.nome} acorda sozinho.` : `Toque no bichinho para fazer carinho${temBrinquedo ? ' ou num brinquedo para brincar' : ''}, ou escolha o que fazer aí em cima.`}</div>
      <div class="bichinho-hoje">Moedas ganhas cuidando hoje: <b>${bc.LIMITE_MOEDAS_DIA - resta}</b> de ${bc.LIMITE_MOEDAS_DIA} 🪙</div>`;
  }

  function painelComer(painel) {
    const graca = bc.COMIDAS.filter((c) => !c.especial);
    const especiais = bc.COMIDAS.filter((c) => c.especial && b.despensa[c.id] > 0);
    painel.innerHTML = `<div class="bichinho-painel-tit">O que vamos comer?</div>
      <div class="bichinho-comidas">${[...graca, ...especiais].map((c) => `<button class="bichinho-comida${c.especial ? ' especial' : ''}" data-comida="${c.id}"><span class="ic">${c.icone}</span><span>${c.nome}</span>${c.especial ? `<span class="qtd">${b.despensa[c.id]}</span>` : ''}</button>`).join('')}</div>
      <button class="bichinho-link" data-ir="loja">🛍️ Comidas especiais na loja</button>`;
    painel.querySelectorAll('[data-comida]').forEach((botao) => { botao.onclick = () => darComida(botao.dataset.comida, botao); });
    painel.querySelector('[data-ir]').onclick = () => { abaLoja = 'comidas'; acao('loja'); };
  }

  function darComida(id, botao) {
    b = bc.atualizar(b, Date.now());
    const r = bc.alimentar(b, id);
    if (r.erro) { ctl.status(r.erro); falar(r.erro, 2000); ctl.som('erro'); return; }
    gravar(r.bichinho);
    // a comida voa do botão até a boca
    const cena = q('.bichinho-cena').getBoundingClientRect();
    const rb = botao.getBoundingClientRect();
    const boca = pontoDoPet(100, 110);
    const voando = efeito(r.comida.icone, 'voando', rb.left - cena.left + rb.width / 2, Math.min(cena.height - 20, rb.top - cena.top), 900);
    if (voando?.animate && !reduzido()) {
      voando.animate([
        { transform: 'translate(-50%, -50%) scale(1)' },
        { transform: `translate(calc(-50% + ${(boca.x - parseFloat(voando.style.left)) / 2}px), calc(-50% + ${(boca.y - parseFloat(voando.style.top)) / 2 - 60}px)) scale(1.3)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${boca.x - parseFloat(voando.style.left)}px), calc(-50% + ${boca.y - parseFloat(voando.style.top)}px)) scale(.4)`, opacity: 0.6 },
      ], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    }
    const lugar = q('.bichinho-pet-lugar');
    setTimeout(() => {
      if (!vivo() || !lugar.isConnected) return;
      lugar.classList.add('bc-comendo');
      ctl.som('item');
      setTimeout(() => { lugar.classList.remove('bc-comendo'); if (bc.humor(b).id === 'feliz') pular(); coracoes(r.comida.especial ? 4 : 2, r.comida.especial ? '💖' : '✨'); }, 1100);
    }, 600);
    atualizarTela();
    const falas = ['Nhac! Que delícia! 😋', 'Hummm! 😋', 'Obrigado! Estava gostoso!'];
    ctl.status(`${r.comida.icone} ${falas[Math.floor(Math.random() * falas.length)]}`);
    setTimeout(() => { if (vivo()) falar(b.barras.fome >= 95 ? 'Estou cheinho! 😋' : undefined, 1800); }, 1800);
    if (r.comida.especial) painelComer(q('.bichinho-painel'));
  }

  // Banho: esfregar com o dedo faz espuma; quando enche, enxágua.
  let banhoLigado = null;
  let espumaAtual = 0;
  function desligarBanho() { if (banhoLigado) { banhoLigado(); banhoLigado = null; } }

  function painelBanho(painel) {
    painel.innerHTML = `<div class="bichinho-painel-tit">🧽 Esfregue ${b.nome} com o dedo!</div>
      <div class="bichinho-espuma-barra"><span></span></div>
      <button class="bichinho-enxaguar" disabled>🚿 Enxaguar</button>`;
    const cena = q('.bichinho-cena');
    const fx = q('.bichinho-fx');
    const barra = painel.querySelector('.bichinho-espuma-barra span');
    const enxaguar = painel.querySelector('.bichinho-enxaguar');
    espumaAtual = 0;
    let espuma = 0; let ultimo = null; let apertado = false; let ultimaBolha = 0;
    const svgRect = () => q('.bichinho-pet svg').getBoundingClientRect();
    function bolha(x, y) {
      const tam = 14 + Math.random() * 22;
      const e = el('span', 'bichinho-bolha');
      e.style.left = `${x}px`; e.style.top = `${y}px`; e.style.width = e.style.height = `${tam}px`;
      fx.append(e);
      if (fx.querySelectorAll('.bichinho-bolha').length > 90) fx.querySelector('.bichinho-bolha').remove();
      if (Math.random() < 0.25) { e.classList.add('voa'); setTimeout(() => e.remove(), 2200); }
    }
    function mover(ev) {
      if (!apertado) return;
      const rc = cena.getBoundingClientRect();
      const x = ev.clientX - rc.left; const y = ev.clientY - rc.top;
      const rs = svgRect();
      const sobre = ev.clientX > rs.left + rs.width * 0.15 && ev.clientX < rs.right - rs.width * 0.15 && ev.clientY > rs.top + rs.height * 0.1 && ev.clientY < rs.bottom;
      if (ultimo && sobre) {
        const d = Math.hypot(x - ultimo.x, y - ultimo.y);
        espuma = Math.min(100, espuma + d / 22);
        if (performance.now() - ultimaBolha > 35) { bolha(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20); ultimaBolha = performance.now(); }
        if (Math.random() < 0.08) ctl.som('passo');
      }
      ultimo = { x, y };
      barra.style.width = `${espuma}%`;
      espumaAtual = espuma;
      atualizarTela();
      if (espuma >= 100 && enxaguar.disabled) {
        enxaguar.disabled = false;
        enxaguar.classList.add('pronto');
        ctl.status('Que espumão! Agora toque em Enxaguar. 🚿');
        ctl.som('acerto');
      }
    }
    const baixo = (ev) => { apertado = true; ultimo = null; cena.setPointerCapture?.(ev.pointerId); mover(ev); };
    const cima = () => { apertado = false; ultimo = null; };
    cena.addEventListener('pointerdown', baixo);
    cena.addEventListener('pointermove', mover);
    cena.addEventListener('pointerup', cima);
    cena.addEventListener('pointercancel', cima);
    banhoLigado = () => {
      cena.removeEventListener('pointerdown', baixo);
      cena.removeEventListener('pointermove', mover);
      cena.removeEventListener('pointerup', cima);
      cena.removeEventListener('pointercancel', cima);
      cena.classList.remove('esfregando');
    };
    ctl.status(`Esfregue ${b.nome} para fazer bastante espuma!`);
    enxaguar.onclick = () => {
      desligarBanho();
      // água caindo e as bolhas sumindo
      const rc = cena.getBoundingClientRect();
      for (let k = 0; k < 26; k++) {
        const gota = el('span', 'bichinho-gota');
        gota.style.left = `${rc.width * 0.25 + Math.random() * rc.width * 0.5}px`;
        gota.style.animationDelay = `${Math.random() * 0.6}s`;
        fx.append(gota);
        setTimeout(() => gota.remove(), 1800);
      }
      fx.querySelectorAll('.bichinho-bolha').forEach((e, i) => { e.style.animationDelay = `${(i % 10) * 0.05}s`; e.classList.add('estoura'); setTimeout(() => e.remove(), 900); });
      ctl.som('voo');
      b = bc.atualizar(b, Date.now());
      const r = bc.banho(b, carteira(), Date.now());
      if (r.erro) { ctl.status(r.erro); return; }
      gravar(r.bichinho, r.carteira);
      setTimeout(() => {
        if (!vivo()) return;
        modo = 'quarto';
        atualizarTela();
        mostrarPainel();
        for (let k = 0; k < 5; k++) { const p = pontoDoPet(40 + Math.random() * 120, 30 + Math.random() * 140); setTimeout(() => efeito('✨', 'brilho', p.x, p.y), k * 120); }
        pular();
        moedinhas(r.ganhas);
        ctl.status(`${b.nome} está cheiroso e limpinho! ✨${r.ganhas ? ` +${r.ganhas} 🪙` : ''}`, 'vitoria');
      }, 1100);
    };
  }

  // ---------- brincadeiras ----------
  function painelBrincar(painel, resultado = null) {
    const resta = bc.moedasRestantesHoje(b, Date.now());
    const cartoes = bc.BRINCADEIRAS.map((x) => `<button class="bichinho-brinc" data-brinc="${x.id}"><span class="ic">${x.icone}</span><b>${x.nome}</b><small>${x.texto}</small>${b.recordes[x.id] ? `<span class="rec">🏆 ${b.recordes[x.id]}</span>` : ''}</button>`).join('');
    painel.innerHTML = `${resultado ?? ''}<div class="bichinho-painel-tit">Do que vamos brincar?</div>
      <div class="bichinho-brincs">${cartoes}</div>
      <div class="bichinho-hoje">${resta > 0 ? `Indo bem, cada brincadeira dá ${bc.MOEDAS_BRINCAR} 🪙 (muito bem: ${bc.MOEDAS_SUPER} 🪙). Hoje ainda dá para ganhar ${resta} 🪙.` : 'As moedas de cuidar de hoje já acabaram, mas brincar sempre deixa o bichinho feliz! 💛'}</div>`;
    painel.querySelectorAll('[data-brinc]').forEach((x) => { x.onclick = () => comecar(x.dataset.brinc); });
    painel.querySelector('[data-de-novo]')?.addEventListener('click', () => comecar(brincadeira));
  }

  function comecar(id) {
    ctl.som('clique');
    b = bc.atualizar(b, Date.now());
    const pode = bc.podeBrincar(b);
    if (pode.erro) { ctl.status(pode.erro); falar(pode.erro); return; }
    pararJogo();
    brincadeira = id;
    modo = 'jogo';
    const painel = q('.bichinho-painel');
    const cena = q('.bichinho-cena');
    cena.classList.add('brincando');
    raiz.classList.add('jogando', `jogando-${id}`);
    q('.bichinho-balao').hidden = true;
    atualizarTela();
    const api = {
      cena, painel, ctl, efeito, pular, falar, coracoes, pontoDoPet,
      b: () => b,
      vivo: () => vivo(),
      petLugar: () => q('.bichinho-pet-lugar'),
      terminar: (pontos) => terminar(id, pontos),
    };
    jogo = TELAS_BRINCADEIRAS[id](api);
    cena.scrollIntoView?.({ behavior: reduzido() ? 'auto' : 'smooth', block: 'start' });
  }

  function terminar(id, pontos) {
    jogo = null;
    raiz.classList.remove('jogando', ...bc.BRINCADEIRAS.map((x) => `jogando-${x.id}`));
    q('.bichinho-cena')?.classList.remove('brincando');
    if (!vivo() || !q('.bichinho-painel')) return;
    b = bc.atualizar(b, Date.now());
    const r = bc.terminarBrincadeira(b, carteira(), id, pontos, Date.now());
    modo = 'brincar';
    const x = bc.BRINCADEIRAS.find((y) => y.id === id);
    if (r.erro) { ctl.status(r.erro); atualizarTela(); mostrarPainel(); return; }
    gravar(r.bichinho, r.carteira);
    atualizarTela();
    const estrelas = r.nivel === 'super' ? 3 : r.nivel === 'meta' ? 2 : 1;
    const titulo = r.nivel === 'super' ? 'Incrível!' : r.nivel === 'meta' ? 'Muito bem!' : 'Que divertido!';
    let moedasTxt = '';
    if (r.ganhas) moedasTxt = `<div class="bichinho-fim-moedas">+${r.ganhas} 🪙</div>`;
    else if (r.nivel !== 'pouco') moedasTxt = '<div class="bichinho-fim-dica">As moedas de cuidar de hoje já acabaram.</div>';
    else moedasTxt = `<div class="bichinho-fim-dica">Faça ${x.meta} pontos para ganhar moedas!</div>`;
    const cartao = `<div class="bichinho-fim"><div class="bichinho-fim-ic">${x.icone}</div><div class="bichinho-fim-tit">${titulo}</div><div class="bichinho-fim-estrelas">${'⭐'.repeat(estrelas)}${'☆'.repeat(3 - estrelas)}</div><div class="bichinho-fim-pts">${pontos} ${pontos === 1 ? 'ponto' : 'pontos'}${r.recorde ? ' · <b>🏆 Recorde!</b>' : ''}</div>${moedasTxt}<button class="bichinho-de-novo" data-de-novo>🔁 Jogar de novo</button></div>`;
    painelBrincar(q('.bichinho-painel'), cartao);
    pular();
    coracoes(3);
    moedinhas(r.ganhas);
    falar(r.nivel === 'pouco' ? 'Foi divertido! Vamos de novo? 💛' : `${['', '', 'Eba! Adorei! 🎉', 'Você é demais! 🌟'][estrelas]}`, 2400);
    ctl.status(`${x.icone} ${pontos} ${pontos === 1 ? 'ponto' : 'pontos'}! ${b.nome} adorou brincar! 💛${r.ganhas ? ` +${r.ganhas} 🪙` : ''}`, r.ganhas ? 'vitoria' : '');
    if (r.ganhas) ctl.som('premio');
  }

  // ---------- loja ----------
  let abaLoja = 'roupas';
  let confirmarTroca = false;
  const ABAS = [['roupas', '👒', 'Roupinhas'], ['quarto', '🏠', 'Quarto'], ['brinquedos', '🧸', 'Brinquedos'], ['comidas', '🍰', 'Comidas']];
  const GRUPOS_ROUPA = [['cabeca', 'Chapéus e tiaras'], ['laco', 'Laços e presilhas'], ['olhos', 'Óculos'], ['pescoco', 'No pescoço'], ['costas', 'Nas costas'], ['corpo', 'Roupinhas'], ['fantasia', 'Fantasias completas']];
  const botaoComprar = (preco, attr) => {
    const falta = preco - moedas();
    return `<button class="bichinho-item-bt comprar" ${attr} ${falta > 0 ? 'data-falta="1"' : ''}>🪙 ${fmt(preco)}</button>${falta > 0 ? `<span class="bichinho-falta">Faltam ${fmt(falta)}</span>` : ''}`;
  };
  function itemRoupa(a) {
    const tem = b.acessorios.includes(a.id);
    const usando = b.vestindo[a.lugar] === a.id;
    const vb = a.fantasia ? VITRINE.corpo : VITRINE[a.lugar];
    const botao = tem ? `<button class="bichinho-item-bt ${usando ? 'tirar' : 'vestir'}" data-vestir="${a.id}">${usando ? 'Tirar' : 'Vestir'}</button>` : botaoComprar(a.preco, `data-comprar="${a.id}"`);
    return `<div class="bichinho-item${usando ? ' usando' : ''}${tem ? ' tem' : ''}">${usando ? '<span class="bichinho-selo">Usando</span>' : ''}<div class="bichinho-item-arte vitrine-${a.fantasia ? 'fantasia' : a.lugar}">${svgBichinho(b.especie, { [a.lugar]: a.id }, { vb, classe: 'bc-estatico' })}</div><div class="bichinho-item-nome">${a.nome}</div>${botao}</div>`;
  }
  function itemQuarto(it) {
    const tem = b.quarto.itens.includes(it.id);
    const usando = b.quarto.usando[it.lugar] === it.id;
    const botao = tem ? `<button class="bichinho-item-bt ${usando ? 'tirar' : 'vestir'}" data-usar="${it.id}">${usando ? 'Guardar' : 'Usar'}</button>` : botaoComprar(it.preco, `data-comprar-quarto="${it.id}"`);
    return `<div class="bichinho-item${usando ? ' usando' : ''}${tem ? ' tem' : ''}${it.lugar === 'tema' ? ' largo' : ''}">${usando ? '<span class="bichinho-selo">Usando</span>' : ''}<div class="bichinho-item-arte quarto-${it.lugar}">${svgItemQuarto(it.id, b)}</div><div class="bichinho-item-nome">${it.nome}</div>${botao}</div>`;
  }
  function itemBrinquedo(it) {
    const tem = b.brinquedos.includes(it.id);
    const botao = tem ? '<span class="bichinho-tem">✓ No quarto</span>' : botaoComprar(it.preco, `data-comprar-brinquedo="${it.id}"`);
    return `<div class="bichinho-item${tem ? ' usando tem' : ''}"><div class="bichinho-item-arte">${svgBrinquedo(it.id)}</div><div class="bichinho-item-nome">${it.nome}</div>${botao}</div>`;
  }
  function conteudoLoja() {
    if (abaLoja === 'roupas') {
      return GRUPOS_ROUPA.map(([g, nome]) => {
        const itens = bc.ACESSORIOS.filter((a) => (g === 'fantasia' ? a.fantasia : a.lugar === g && !a.fantasia));
        return `<div class="bichinho-grupo">${nome}</div><div class="bichinho-itens">${itens.map(itemRoupa).join('')}</div>`;
      }).join('');
    }
    if (abaLoja === 'quarto') {
      return Object.entries(bc.LUGARES_QUARTO).map(([lugar, nome]) => {
        const itens = bc.QUARTO.filter((x) => x.lugar === lugar);
        const dica = lugar === 'tema' ? '<div class="bichinho-grupo-dica">Um tema troca o quarto inteiro. Guarde o tema para voltar ao seu quarto de sempre.</div>' : '';
        return `<div class="bichinho-grupo">${lugar === 'tema' ? 'Temas' : nome}</div>${dica}<div class="bichinho-itens${lugar === 'tema' ? ' temas' : ''}">${itens.map(itemQuarto).join('')}</div>`;
      }).join('');
    }
    if (abaLoja === 'brinquedos') {
      const efeito = Math.round((1 - bc.fatorAlegria(b)) * 100);
      return `<div class="bichinho-grupo-dica">Os brinquedos ficam no quarto: toque neles para ${b.nome} brincar. Cada um faz a alegria cair mais devagar${efeito ? ` (agora: ${efeito}% mais devagar)` : ''}. A casinha e o ursão viram esconderijo!</div><div class="bichinho-itens">${bc.BRINQUEDOS.map(itemBrinquedo).join('')}</div>`;
    }
    return `<div class="bichinho-itens">${bc.COMIDAS.filter((c) => c.especial).map((c) => `<div class="bichinho-item"><div class="bichinho-item-arte emoji">${c.icone}</div><div class="bichinho-item-nome">${c.nome}${b.despensa[c.id] ? ` <small>(tem ${b.despensa[c.id]})</small>` : ''}</div>${botaoComprar(c.preco, `data-comida-loja="${c.id}"`)}</div>`).join('')}</div>`;
  }
  function painelLoja(painel) {
    painel.innerHTML = `<div class="bichinho-abas">${ABAS.map(([id, ic, nome]) => `<button data-aba="${id}" class="${abaLoja === id ? 'ativa' : ''}"><span>${ic}</span>${nome}</button>`).join('')}</div>
      <div class="bichinho-saldo-loja">Você tem <b>🪙 ${fmt(moedas())}</b>. Ganhe mais cuidando de ${b.nome} ou na Corrida dos Cachinhos!</div>
      <div class="bichinho-loja-itens">${conteudoLoja()}</div>
      <button class="bichinho-link bichinho-trocar">${confirmarTroca ? 'Tem certeza? Toque de novo para adotar outro bichinho' : '🐾 Adotar outro bichinho'}</button>`;
    painel.querySelectorAll('[data-aba]').forEach((x) => { x.onclick = () => { abaLoja = x.dataset.aba; confirmarTroca = false; ctl.som('clique'); painelLoja(painel); }; });
    const feito = (r, texto, { quarto = false } = {}) => {
      if (r.erro) { ctl.status(r.erro, 'derrota'); ctl.som('erro'); return; }
      gravar(r.bichinho, r.carteira);
      ctl.status(texto, 'vitoria');
      ctl.som(r.carteira ? 'premio' : 'clique');
      if (quarto) { desenharQuarto(); brilharCena(); } else { desenharPet(); pular(); coracoes(3, '✨'); }
      atualizarTela();
      const rolagem = painel.querySelector('.bichinho-loja-itens')?.scrollTop;
      painelLoja(painel);
      if (rolagem) painel.querySelector('.bichinho-loja-itens').scrollTop = rolagem;
    };
    painel.querySelectorAll('[data-comprar]').forEach((x) => {
      x.onclick = () => {
        const a = bc.ACESSORIOS.find((y) => y.id === x.dataset.comprar);
        feito(bc.comprarAcessorio(b, carteira(), a.id), `${a.nome}: ficou lindo em ${b.nome}! 💖`);
      };
    });
    painel.querySelectorAll('[data-vestir]').forEach((x) => {
      x.onclick = () => {
        const a = bc.ACESSORIOS.find((y) => y.id === x.dataset.vestir);
        const r = bc.vestir(b, a.id);
        feito(r, r.tirou ? `Tirou: ${a.nome.toLowerCase()}.` : `${b.nome} está usando: ${a.nome.toLowerCase()}! ✨`);
      };
    });
    painel.querySelectorAll('[data-comprar-quarto]').forEach((x) => {
      x.onclick = () => {
        const it = bc.QUARTO.find((y) => y.id === x.dataset.comprarQuarto);
        feito(bc.comprarQuarto(b, carteira(), it.id), `${it.nome}: o quarto ficou lindo! 🏠✨`, { quarto: true });
      };
    });
    painel.querySelectorAll('[data-usar]').forEach((x) => {
      x.onclick = () => {
        const it = bc.QUARTO.find((y) => y.id === x.dataset.usar);
        const r = bc.usarQuarto(b, it.id);
        feito(r, r.guardou ? `${it.nome} foi guardado. Dá para usar de novo quando quiser.` : `Agora o quarto tem: ${it.nome.toLowerCase()}! 🏠`, { quarto: true });
      };
    });
    painel.querySelectorAll('[data-comprar-brinquedo]').forEach((x) => {
      x.onclick = () => {
        const it = bc.BRINQUEDOS.find((y) => y.id === x.dataset.comprarBrinquedo);
        feito(bc.comprarBrinquedo(b, carteira(), it.id), `${it.nome} chegou ao quarto! Toque nele para brincar. 🧸`, { quarto: true });
      };
    });
    painel.querySelectorAll('[data-comida-loja]').forEach((x) => { x.onclick = () => { const c = bc.COMIDAS.find((y) => y.id === x.dataset.comidaLoja); feito(bc.comprarComida(b, carteira(), c.id), `${c.icone} ${c.nome} foi para a despensa! Dê em 🍎 Comer.`); }; });
    painel.querySelector('.bichinho-trocar').onclick = () => {
      ctl.som('clique');
      if (!confirmarTroca) { confirmarTroca = true; painelLoja(painel); return; }
      confirmarTroca = false;
      telaAdocao(b);
    };
  }

  function brilharCena() {
    const cena = q('.bichinho-cena');
    cena.classList.remove('novidade'); void cena.offsetWidth; cena.classList.add('novidade');
    const r = cena.getBoundingClientRect();
    for (let k = 0; k < 6; k++) setTimeout(() => efeito('✨', 'brilho', 30 + Math.random() * (r.width - 60), 30 + Math.random() * (r.height - 80)), k * 110);
  }

  iniciar();
  return { reiniciar: iniciar };
}
