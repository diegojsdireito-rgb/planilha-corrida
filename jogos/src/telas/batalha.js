// Tela da Batalha no Mar: arrumar a frota e depois atirar no mar do robô.
import { el } from '../comum.js';
import * as bt from '../batalha.js';

export const INFO = {
  id: 'batalha',
  nome: 'Batalha no Mar',
  descricao: 'Afunde os barquinhos do robô',
  regras: [
    'Primeiro arrume seus 5 barquinhos no seu mar: toque num barco para escolher, toque numa casa livre para levar ele para lá e toque de novo no barco para girar. O botão 🎲 Sortear arruma tudo de uma vez.',
    'Quando estiver pronto, toque em ✅ Começar. Depois, toque numa casa do mar do robô para atirar.',
    'Errou: 💦 splash na água e a vez passa. Acertou: 💥 explosão e você joga de novo! O robô também joga de novo quando acerta.',
    'Quando todas as partes de um barco são atingidas, ele afunda e aparece desenhado. Ganha quem afundar a frota inteira primeiro.',
    'Frota: Baleia (4 casas), Polvo e Tartaruga (3 casas), Patinho e Peixinho (2 casas).',
    'No fácil o robô atira quase ao acaso; no médio ele caça em volta dos acertos; no difícil ele calcula onde os barcos têm mais chance de estar.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><defs><linearGradient id="bt-ic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset="1" stop-color="#2a7fd4"/></linearGradient></defs><rect width="12" height="12" rx="2" fill="url(#bt-ic)"/><path d="M6.2 2v4.2" stroke="#7a4a2a" stroke-width=".35"/><path d="M6.4 2.2 8.6 3.4 6.4 4.4Z" fill="#ff5c8a"/><path d="M2 6.6h8.2L9 8.6H3.2Z" fill="#ffb02e"/><path d="M2 6.6h8.2l-.3.6H2.3Z" fill="#fff"/><circle cx="4.2" cy="7.6" r=".32" fill="#3b2a1e"/><circle cx="5.4" cy="7.6" r=".32" fill="#3b2a1e"/><path d="M0 9.4q1.5-.9 3 0t3 0 3 0 3 0V12H0Z" fill="#1d5fb3" opacity=".85"/><path d="M0 9.4q1.5-.9 3 0t3 0 3 0 3 0" fill="none" stroke="#fff" stroke-width=".35" opacity=".8"/></svg>';

// Cores e enfeites de cada barquinho (na ordem de bt.FROTA).
const ESTILO = [
  { casco: '#4f8df5', escuro: '#2a5fc4', cabine: '#ffd84d', bandeira: '#ff5c8a', bicho: 'baleia' },
  { casco: '#b36be8', escuro: '#7f3fb8', cabine: '#ffe7f3', bandeira: '#ffd84d', bicho: 'polvo' },
  { casco: '#33b27a', escuro: '#1f7f55', cabine: '#d8f7c6', bandeira: '#ff8a3d', bicho: 'tartaruga' },
  { casco: '#ffb02e', escuro: '#d17f00', cabine: '#fff4c2', bandeira: '#4f8df5', bicho: 'pato' },
  { casco: '#ff6b6b', escuro: '#c94040', cabine: '#ffe2d6', bandeira: '#33b27a', bicho: 'peixe' },
];

// Barquinho deitado, com comprimento tam × 100 e altura 100 (a proa fica à direita).
function desenhoBarco(tam, estilo, afundado = false) {
  const L = tam * 100;
  const s = estilo;
  const casco = `M10 46 H${L - 34} Q${L - 8} 46 ${L - 4} 52 Q${L - 20} 86 ${L - 46} 88 H28 Q12 86 8 66 Z`;
  const cabineL = Math.min(110, L * 0.34);
  const cx = 26;
  const olhos = afundado
    ? `<g stroke="#3b3f47" stroke-width="5" stroke-linecap="round"><path d="M${L - 78} 58l9 9M${L - 69} 58l-9 9M${L - 54} 58l9 9M${L - 45} 58l-9 9"/></g>`
    : `<g fill="#2b2230"><circle cx="${L - 72}" cy="63" r="6"/><circle cx="${L - 50}" cy="63" r="6"/></g><g fill="#fff"><circle cx="${L - 70}" cy="61" r="2.2"/><circle cx="${L - 48}" cy="61" r="2.2"/></g><path d="M${L - 68} 73 q7 6 14 0" fill="none" stroke="#2b2230" stroke-width="3.5" stroke-linecap="round"/><g fill="#ff8fb1" opacity=".7"><ellipse cx="${L - 84}" cy="72" rx="6" ry="3.5"/><ellipse cx="${L - 37}" cy="72" rx="6" ry="3.5"/></g>`;
  const janelas = Array.from({ length: Math.max(1, Math.floor((L - 140) / 70)) }, (_, k) => `<circle cx="${cx + cabineL + 30 + k * 60}" cy="66" r="8" fill="#e8f6ff" stroke="${s.escuro}" stroke-width="3"/>`).join('');
  const mastro = tam >= 3 ? `<path d="M${cx + cabineL / 2} 28 V6" stroke="#6b4a2e" stroke-width="4" stroke-linecap="round"/><path d="M${cx + cabineL / 2 + 2} 7 L${cx + cabineL / 2 + 30} 14 L${cx + cabineL / 2 + 2} 22 Z" fill="${s.bandeira}"/>` : `<path d="M${cx + cabineL / 2} 28 V14" stroke="#6b4a2e" stroke-width="4" stroke-linecap="round"/><circle cx="${cx + cabineL / 2}" cy="12" r="6" fill="${s.bandeira}"/>`;
  return `${mastro}<rect x="${cx}" y="24" width="${cabineL}" height="26" rx="9" fill="${s.cabine}" stroke="${s.escuro}" stroke-width="3"/><rect x="${cx + 10}" y="30" width="${cabineL - 20}" height="10" rx="5" fill="#bfe6ff" opacity=".9"/><path d="${casco}" fill="${s.casco}" stroke="${s.escuro}" stroke-width="4" stroke-linejoin="round"/><path d="M12 52 H${L - 22}" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>${janelas}${olhos}`;
}

function svgBarco(b, k, afundado) {
  const L = b.tam * 100;
  const corpo = desenhoBarco(b.tam, ESTILO[k % ESTILO.length], afundado);
  return b.vert
    ? `<svg viewBox="0 0 100 ${L}" preserveAspectRatio="none" aria-hidden="true"><g transform="translate(100 0) rotate(90)">${corpo}</g></svg>`
    : `<svg viewBox="0 0 ${L} 100" preserveAspectRatio="none" aria-hidden="true">${corpo}</svg>`;
}

const FOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="13" fill="#ffcf3f" opacity=".35"/><path d="M20 6c3 6 10 9 10 17a10 10 0 0 1-20 0c0-5 3-7 4-11 1 3 3 4 3 4 0-4 1-7 3-10Z" fill="#ff6a2b"/><path d="M20 16c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 2 2 0-2 0-3 1-5Z" fill="#ffd34a"/></svg>';
const AGUA = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="9" fill="none" stroke="#fff" stroke-width="2.6" opacity=".85"/><circle cx="20" cy="20" r="3.2" fill="#fff" opacity=".9"/></svg>';

const reduzir = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function montar(area, ctl) {
  const raiz = el('div', 'batalha');
  area.append(raiz);
  let e = null; // estado salvo
  let selecionado = -1;
  let ocupado = false;
  let gradeRobo = null; let gradeMinha = null;

  const salvar = () => ctl.salvar(e);

  // ---------- grade ----------
  function criarGrade(classe, aoTocar) {
    const caixa = el('div', `batalha-grade ${classe}`);
    const mar = el('div', 'batalha-mar');
    const casas = el('div', 'batalha-casas');
    const barcos = el('div', 'batalha-barcos');
    const fx = el('div', 'batalha-fx');
    const botoes = [];
    for (let i = 0; i < bt.N * bt.N; i++) {
      const b = el('button', 'batalha-casa');
      b.type = 'button';
      const r = Math.floor(i / bt.N); const c = i % bt.N;
      b.setAttribute('aria-label', `Linha ${r + 1}, coluna ${'ABCDEFGH'[c]}`);
      if (aoTocar) b.onclick = () => aoTocar(i); else b.tabIndex = -1;
      casas.append(b);
      botoes.push(b);
    }
    caixa.append(mar, barcos, casas, fx);
    return { caixa, casas: botoes, barcos, fx };
  }

  function posBarco(b) {
    const p = 100 / bt.N;
    return `left:${b.c * p}%;top:${b.r * p}%;width:${(b.vert ? 1 : b.tam) * p}%;height:${(b.vert ? b.tam : 1) * p}%`;
  }

  function desenharBarcos(g, barcos, tiros, mostrarTodos) {
    g.barcos.replaceChildren();
    barcos.forEach((b, k) => {
      const afundado = tiros ? bt.afundou(b, tiros) : false;
      if (!mostrarTodos && !afundado) return;
      const d = el('div', `batalha-barco${afundado ? ' afundado' : ''}${k === selecionado ? ' sel' : ''}`, svgBarco(b, k, afundado));
      d.style.cssText = posBarco(b);
      g.barcos.append(d);
    });
  }

  function desenharTiros(g, tiros, deQuem) {
    g.casas.forEach((b, i) => {
      const t = tiros[i];
      b.className = `batalha-casa${t ? ` ${t}` : ''}`;
      b.innerHTML = t === 'agua' ? AGUA : t ? FOGO : '';
      b.disabled = deQuem === 'eu' ? Boolean(t) || ocupado || e.vez !== 'eu' || e.fase !== 'jogo' : true;
    });
  }

  function efeito(g, i, tipo) {
    if (reduzir()) return;
    const p = 100 / bt.N;
    const r = Math.floor(i / bt.N); const c = i % bt.N;
    const d = el('div', `batalha-efeito ${tipo}`);
    d.style.cssText = `left:${(c + 0.5) * p}%;top:${(r + 0.5) * p}%`;
    if (tipo === 'splash') d.innerHTML = '<i class="anel"></i><i class="anel a2"></i>' + Array.from({ length: 6 }, (_, k) => `<i class="gota" style="--a:${k * 60 + 15}deg"></i>`).join('');
    else d.innerHTML = '<i class="clarao"></i>' + Array.from({ length: 8 }, (_, k) => `<i class="faisca" style="--a:${k * 45}deg"></i>`).join('') + '<i class="fumaca"></i><i class="fumaca f2"></i><i class="fumaca f3"></i>';
    g.fx.append(d);
    setTimeout(() => d.remove(), 1300);
  }

  function mira(g, i) {
    if (reduzir()) return;
    const p = 100 / bt.N;
    const d = el('div', 'batalha-mira');
    d.style.cssText = `left:${(i % bt.N + 0.5) * p}%;top:${(Math.floor(i / bt.N) + 0.5) * p}%`;
    g.fx.append(d);
    setTimeout(() => d.remove(), 650);
  }

  function frotaHtml(barcos, tiros, titulo, quem) {
    const fundos = tiros ? bt.afundados(barcos, tiros) : barcos.map(() => false);
    const vivos = fundos.filter((x) => !x).length;
    return `<div class="batalha-frota ${quem}"><div class="batalha-frota-titulo">${titulo} <b>${vivos}</b>/${barcos.length}</div><div class="batalha-frota-lista">${barcos.map((b, k) => `<span class="mini${fundos[k] ? ' fora' : ''}" style="--tam:${b.tam}" title="${bt.FROTA[k].nome}">${svgBarco({ ...b, vert: false }, k, fundos[k])}</span>`).join('')}</div></div>`;
  }

  // ---------- arrumar a frota ----------
  function telaArrumar() {
    raiz.replaceChildren();
    raiz.className = 'batalha arrumar';
    gradeMinha = criarGrade('grande minha', tocarArrumar);
    const titulo = el('div', 'batalha-rotulo', '<span>⚓ Seu mar</span><small>Toque num barco e depois numa casa. Toque de novo no barco para girar.</small>');
    const botoes = el('div', 'batalha-botoes');
    const sortear = el('button', 'batalha-botao', '🎲 Sortear');
    sortear.onclick = () => { ctl.som('dado'); e.meus = bt.sortearFrota(); selecionado = -1; salvar(); desenharArrumar(); };
    const girar = el('button', 'batalha-botao', '🔄 Girar');
    girar.onclick = () => { if (selecionado >= 0) girarBarco(selecionado); else ctl.status('Escolha um barco para girar'); };
    const pronto = el('button', 'batalha-botao principal', '✅ Começar');
    pronto.onclick = comecar;
    botoes.append(sortear, girar, pronto);
    raiz.append(titulo, gradeMinha.caixa, botoes);
    desenharArrumar();
    ctl.status('Arrume sua frota e toque em Começar', 'voce');
  }

  function desenharArrumar() {
    desenharBarcos(gradeMinha, e.meus, null, true);
    gradeMinha.casas.forEach((b) => { b.className = 'batalha-casa'; b.innerHTML = ''; b.disabled = false; });
    if (selecionado >= 0) {
      for (const i of bt.celulas(e.meus[selecionado])) gradeMinha.casas[i].classList.add('marcada');
    }
  }

  const barcoEm = (i) => e.meus.findIndex((b) => bt.celulas(b).includes(i));

  function balancar() {
    const d = gradeMinha.barcos.querySelector('.sel');
    d?.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 260 });
    ctl.som('erro');
  }

  function girarBarco(k) {
    const b = e.meus[k];
    const novo = { ...b, vert: !b.vert };
    // Se não couber girando no lugar, tenta empurrar um pouco para dentro.
    const tentativas = [];
    for (let d = 0; d < b.tam; d++) tentativas.push({ ...novo, r: novo.r - (novo.vert ? d : 0), c: novo.c - (novo.vert ? 0 : d) });
    const ok = tentativas.find((t) => bt.cabe(e.meus, t, k));
    if (!ok) { balancar(); ctl.status('Não cabe girar aqui'); return; }
    e.meus[k] = ok;
    ctl.som('mover');
    salvar();
    desenharArrumar();
  }

  function tocarArrumar(i) {
    const k = barcoEm(i);
    if (k >= 0) {
      if (k === selecionado) { girarBarco(k); return; }
      selecionado = k;
      ctl.som('clique');
      ctl.status(`${bt.FROTA[k].nome} escolhido: toque numa casa livre`, 'voce');
      desenharArrumar();
      return;
    }
    if (selecionado < 0) { ctl.status('Toque primeiro num barco', 'voce'); return; }
    const b = e.meus[selecionado];
    const r = Math.floor(i / bt.N); const c = i % bt.N;
    const tentativas = [];
    for (let d = 0; d < b.tam; d++) tentativas.push({ ...b, r: r - (b.vert ? d : 0), c: c - (b.vert ? 0 : d) });
    const ok = tentativas.find((t) => bt.cabe(e.meus, t, selecionado));
    if (!ok) { balancar(); ctl.status('Não cabe aí: tente outra casa'); return; }
    e.meus[selecionado] = ok;
    ctl.som('mover');
    salvar();
    desenharArrumar();
    ctl.status('Toque no barco para girar, ou em Começar', 'voce');
  }

  // ---------- batalha ----------
  function comecar() {
    selecionado = -1;
    e.fase = 'jogo';
    e.deles = bt.sortearFrota();
    e.vez = ctl.roboComeca() ? 'robo' : 'eu';
    ctl.som('clique');
    salvar();
    telaJogo();
    if (e.vez === 'robo') vezDoRobo(); else ctl.status('Sua vez: toque no mar do robô para atirar', 'voce');
  }

  let placaRobo; let placaMinha;
  function telaJogo() {
    raiz.replaceChildren();
    raiz.className = 'batalha jogando';
    gradeRobo = criarGrade('grande robo', atirarEu);
    gradeMinha = criarGrade('pequena minha', null);
    placaRobo = el('div', 'batalha-placa');
    placaMinha = el('div', 'batalha-placa');
    const cabeca = el('div', 'batalha-cabeca');
    cabeca.append(el('div', 'batalha-rotulo', '<span>🤖 Mar do robô</span>'), placaRobo);
    const baixo = el('div', 'batalha-baixo');
    const lado = el('div', 'batalha-lado');
    lado.append(el('div', 'batalha-rotulo pequeno', '<span>⚓ Seu mar</span>'), placaMinha);
    baixo.append(gradeMinha.caixa, lado);
    raiz.append(cabeca, gradeRobo.caixa, baixo);
    desenharJogo();
  }

  function desenharJogo(revelar = false) {
    desenharBarcos(gradeRobo, e.deles, e.tirosEu, revelar);
    desenharTiros(gradeRobo, e.tirosEu, 'eu');
    desenharBarcos(gradeMinha, e.meus, e.tirosRobo, true);
    desenharTiros(gradeMinha, e.tirosRobo, 'robo');
    gradeRobo.caixa.classList.toggle('esperando', e.vez !== 'eu' || e.fase !== 'jogo');
    placaRobo.innerHTML = frotaHtml(e.deles, e.tirosEu, 'Barcos do robô', 'robo');
    placaMinha.innerHTML = frotaHtml(e.meus, e.tirosRobo, 'Seus barcos', 'eu');
  }

  function anunciar(res, quem) {
    const nome = res.barco !== undefined ? bt.FROTA[res.barco].nome : '';
    if (quem === 'eu') {
      if (res.resultado === 'agua') return 'Splash! Água 💦 Agora é o robô';
      if (res.resultado === 'acerto') return 'Acertou! 💥 Jogue de novo';
      return `Afundou o ${nome} do robô! 🎉 Jogue de novo`;
    }
    if (res.resultado === 'agua') return 'O robô errou: água 💦 Sua vez';
    if (res.resultado === 'acerto') return 'O robô acertou! 💥 Ele joga de novo…';
    return `O robô afundou seu ${nome}! 😢`;
  }

  function terminar(venci) {
    e.fase = 'fim';
    ocupado = false;
    desenharJogo(true);
    ctl.fim(venci ? 'vitoria' : 'derrota', venci ? 'Você afundou a frota inteira! 🎉' : 'O robô afundou sua frota 🤖', gradeRobo.caixa, { nivel: ctl.nivel() });
  }

  async function atirarEu(i) {
    if (ocupado || e.fase !== 'jogo' || e.vez !== 'eu' || e.tirosEu[i]) return;
    ocupado = true;
    const res = bt.atirar(e.deles, e.tirosEu, i);
    efeito(gradeRobo, i, res.resultado === 'agua' ? 'splash' : 'bum');
    ctl.som(res.resultado === 'agua' ? 'mover' : res.resultado === 'afundou' ? 'quebra' : 'captura');
    if (res.resultado === 'agua') e.vez = 'robo';
    salvar();
    desenharJogo();
    ctl.status(anunciar(res, 'eu'), res.resultado === 'agua' ? 'robo' : 'voce');
    if (bt.todosAfundados(e.deles, e.tirosEu)) { if (await ctl.esperar(500)) terminar(true); return; }
    if (res.resultado !== 'agua') { ocupado = false; desenharJogo(); return; }
    vezDoRobo();
  }

  async function vezDoRobo() {
    ocupado = true;
    desenharJogo();
    if (!await ctl.esperar(900)) return;
    while (e.fase === 'jogo') {
      ctl.status('Robô mirando…', 'robo');
      const i = bt.tiroRobo(e.tirosRobo, bt.restantes(e.meus, e.tirosRobo), ctl.nivel());
      mira(gradeMinha, i);
      if (!await ctl.esperar(600)) return;
      const res = bt.atirar(e.meus, e.tirosRobo, i);
      efeito(gradeMinha, i, res.resultado === 'agua' ? 'splash' : 'bum');
      ctl.som(res.resultado === 'agua' ? 'robo' : res.resultado === 'afundou' ? 'quebra' : 'captura');
      if (res.resultado === 'agua') e.vez = 'eu';
      salvar();
      desenharJogo();
      ctl.status(anunciar(res, 'robo'), res.resultado === 'agua' ? 'voce' : 'robo');
      if (bt.todosAfundados(e.meus, e.tirosRobo)) { if (await ctl.esperar(600)) terminar(false); return; }
      if (res.resultado === 'agua') break;
      if (!await ctl.esperar(res.resultado === 'afundou' ? 1300 : 900)) return;
    }
    ocupado = false;
    desenharJogo();
  }

  function iniciar(salvo) {
    ocupado = false;
    selecionado = -1;
    if (salvo && salvo.meus && salvo.fase !== 'fim') e = salvo;
    else e = { fase: 'arrumar', meus: bt.sortearFrota(), deles: null, tirosEu: bt.novosTiros(), tirosRobo: bt.novosTiros(), vez: 'eu' };
    if (e.fase === 'arrumar') { telaArrumar(); return; }
    telaJogo();
    if (e.vez === 'robo') vezDoRobo(); else ctl.status('Partida retomada: sua vez de atirar', 'voce');
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
