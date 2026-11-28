// As brincadeiras do Meu Bichinho (a parte de tela). Cada uma recebe a `api` da tela principal
// (cena, painel, efeitos, falas, terminar...) e devolve { parar() }. As regras e a pontuação
// ficam em ../bichinho-brincadeiras.js.
import { el } from '../comum.js';
import { prefs } from '../dados.js';
import * as br from '../bichinho-brincadeiras.js';
import { svgBichinho } from './bichinho-arte.js';
import { svgEsconderijos } from './bichinho-quarto.js';

const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Notinhas musicais próprias (Siga e Dança), respeitando o som ligado/desligado do app.
let audio = null;
function tom(freq, dur = 0.25, { tipo = 'triangle', vol = 0.16, quando = 0 } = {}) {
  if (!prefs.som) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state !== 'running') audio.resume().catch(() => {});
    const t0 = audio.currentTime + quando;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audio.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  } catch { /* sem áudio */ }
}

function hud(api, titulo, campos) {
  api.painel.innerHTML = `<div class="bichinho-painel-tit">${titulo}</div><div class="bichinho-jogo-info">${campos.map(([rot, classe, valor]) => `<span>${rot} <b class="${classe}">${valor}</b></span>`).join('')}</div>`;
  return (classe, valor) => { const e = api.painel.querySelector(`.${classe}`); if (e) e.textContent = valor; };
}

function camada(api, classe = '') {
  const c = el('div', `bichinho-jogo-camada ${classe}`);
  api.cena.querySelector('.bichinho-fx').before(c);
  return c;
}

// ---------- ⚽ Pega a bolinha (a de sempre) ----------
const BOLA = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#fff" stroke="#3a3045" stroke-width="2"/><path d="M20 2 A18 18 0 0 1 37 14 L20 20 Z" fill="#e5484d"/><path d="M37 26 A18 18 0 0 1 26 37 L20 20 Z" fill="#3e7bfa"/><path d="M14 37 A18 18 0 0 1 2 24 L20 20 Z" fill="#ffd21f"/><path d="M3 12 A18 18 0 0 1 12 3.5 L20 20 Z" fill="#2f9e62"/><circle cx="20" cy="20" r="4" fill="#fff" stroke="#3a3045" stroke-width="1.5"/><ellipse cx="13" cy="10" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-30 13 10)"/></svg>';

function bola(api) {
  const DURACAO = 20;
  const mostra = hud(api, '⚽ Pegue a bolinha! Toque nela.', [['Bolinhas:', 'pegas', 0], ['⏱️', 'tempo', `${DURACAO}s`]]);
  const { cena } = api;
  const bolaEl = el('button', 'bichinho-bola', BOLA);
  bolaEl.setAttribute('aria-label', 'Bolinha');
  cena.querySelector('.bichinho-fx').before(bolaEl);
  const TAM = 56;
  let x = 30; let y = 30; let vx = 0; let vy = 0;
  let pegas = 0; let fim = 0; let anterior = 0; let raf = 0; let acabou = false;
  function sortear() {
    const r = cena.getBoundingClientRect();
    x = 10 + Math.random() * (r.width - TAM - 20); y = 10 + Math.random() * (r.height * 0.55);
    const ang = Math.random() * Math.PI * 2; const vel = 150 + pegas * 22;
    vx = Math.cos(ang) * vel; vy = Math.sin(ang) * vel;
  }
  function quadro(t) {
    if (!api.vivo() || acabou) return;
    const dt = Math.min(0.05, (t - anterior) / 1000); anterior = t;
    const r = cena.getBoundingClientRect();
    x += vx * dt; y += vy * dt;
    if (x < 0) { x = 0; vx = Math.abs(vx); } if (x > r.width - TAM) { x = r.width - TAM; vx = -Math.abs(vx); }
    if (y < 0) { y = 0; vy = Math.abs(vy); } if (y > r.height - TAM - 6) { y = r.height - TAM - 6; vy = -Math.abs(vy); }
    bolaEl.style.transform = `translate(${x}px, ${y}px) rotate(${(x + y) * 2}deg)`;
    mostra('tempo', `${Math.max(0, Math.ceil((fim - t) / 1000))}s`);
    if (t >= fim) { parar(); api.terminar(pegas); return; }
    raf = requestAnimationFrame(quadro);
  }
  bolaEl.onpointerdown = (ev) => {
    ev.preventDefault();
    if (acabou) return;
    pegas++;
    mostra('pegas', pegas);
    api.efeito('⭐', 'sobe', x + TAM / 2, y + TAM / 2, 900);
    api.ctl.som('acerto');
    api.pular();
    bolaEl.classList.remove('pegou'); void bolaEl.offsetWidth; bolaEl.classList.add('pegou');
    if (pegas === 5) api.falar('Eba! Você é demais! 🎉', 1600);
    sortear();
  };
  function parar() { acabou = true; cancelAnimationFrame(raf); bolaEl.remove(); }
  sortear();
  api.ctl.status('Toque na bolinha antes que o tempo acabe!');
  raf = requestAnimationFrame((t) => { anterior = t; fim = t + DURACAO * 1000; quadro(t); });
  return { parar };
}

// ---------- 🫧 Bolhas de sabão ----------
function bolhas(api) {
  const { duracao } = br.BOLHAS;
  const mostra = hud(api, '🫧 Estoure as bolhas! As douradas valem 3.', [['Pontos:', 'pontos', 0], ['⏱️', 'tempo', `${duracao}s`]]);
  const lugar = api.petLugar();
  lugar.classList.add('bc-sopra');
  const c = camada(api);
  const vivas = new Set();
  let pontos = 0; let acabou = false; let raf = 0; let inicio = 0; let anterior = 0; let proxima = 0;
  function soltar(t) {
    const seg = (t - inicio) / 1000;
    const d = br.novaBolha(Math.random, seg);
    const boca = api.pontoDoPet(100, 110);
    const cw = api.cena.clientWidth;
    const e = el('button', `bichinho-bolhinha${d.dourada ? ' dourada' : ''}`);
    e.setAttribute('aria-label', d.dourada ? 'Bolha dourada' : 'Bolha');
    e.style.width = e.style.height = `${d.tam}px`;
    const b = { e, d, x: boca.x + (d.x - 0.5) * cw * 0.5, y: boca.y, nasce: t, sumindo: false };
    e.onpointerdown = (ev) => {
      ev.preventDefault();
      if (acabou || b.sumindo) return;
      b.sumindo = true;
      const p = br.pontosBolha(d);
      pontos += p;
      mostra('pontos', pontos);
      e.classList.add('estoura');
      api.efeito(d.dourada ? `+${p} ✨` : `+${p}`, `sobe ${d.dourada ? 'moeda' : 'pontinho'}`, b.x, b.y, 900);
      api.ctl.som(d.dourada ? 'moeda' : 'acerto');
      tom(d.dourada ? 1568 : 880 + Math.random() * 300, 0.12, { tipo: 'sine', vol: 0.08 });
      if (d.dourada) { api.falar('Uau, dourada! ✨', 1200); api.pular(); }
      setTimeout(() => { e.remove(); vivas.delete(b); }, 300);
    };
    c.append(e);
    vivas.add(b);
  }
  function quadro(t) {
    if (!api.vivo() || acabou) return;
    const dt = Math.min(0.05, (t - anterior) / 1000); anterior = t;
    const seg = (t - inicio) / 1000;
    if (t >= proxima && seg < duracao - 1) {
      soltar(t);
      lugar.classList.remove('bc-sopro'); void lugar.offsetWidth; lugar.classList.add('bc-sopro');
      proxima = t + br.intervaloBolha(seg);
    }
    for (const b of vivas) {
      if (b.sumindo) continue;
      const idade = (t - b.nasce) / 1000;
      b.y -= b.d.sobe * dt;
      b.x += b.d.vx * dt * 0.6 + Math.sin(idade * 3 + b.d.fase) * 0.6;
      const cresce = Math.min(1, 0.3 + idade * 1.8);
      b.e.style.transform = `translate(${b.x - b.d.tam / 2}px, ${b.y - b.d.tam / 2}px) scale(${cresce})`;
      if (b.y < -b.d.tam) { b.e.remove(); vivas.delete(b); }
    }
    mostra('tempo', `${Math.max(0, Math.ceil(duracao - seg))}s`);
    if (seg >= duracao) { parar(); api.terminar(pontos); return; }
    raf = requestAnimationFrame(quadro);
  }
  function parar() { acabou = true; cancelAnimationFrame(raf); c.remove(); lugar.classList.remove('bc-sopra', 'bc-sopro'); }
  api.ctl.status(`${api.b().nome} está soprando bolhas! Estoure todas! 🫧`);
  api.falar('Fuuuu... 🫧', 1500);
  raf = requestAnimationFrame((t) => { inicio = anterior = t; proxima = t + 500; quadro(t); });
  return { parar };
}

// ---------- 🙈 Esconde-esconde ----------
function esconde(api) {
  const { rodadas } = br.ESCONDE;
  const lugares = br.esconderijos(api.b().brinquedos);
  const mostra = hud(api, '🙈 Ache o bichinho!', [['Rodada', 'rodada', `1/${rodadas}`], ['⭐', 'pontos', 0], ['', 'chances', '❤️❤️❤️']]);
  const { cena } = api;
  const lugar = api.petLugar();
  let n = 0; let total = 0; let rodada = null; let anterior = null; let acabou = false; let procurando = false;
  const timers = new Set();
  const depois = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); if (!acabou && api.vivo()) fn(); }, ms); timers.add(id); return id; };
  let dicas = null;
  const capa = el('div', 'bichinho-jogo-camada bichinho-esconde');
  capa.innerHTML = svgEsconderijos(lugares, api.b().especie, api.b().vestindo);
  capa.hidden = true;
  cena.querySelector('.bichinho-fx').before(capa);
  cena.classList.add('escondendo');
  const esc = (id) => capa.querySelector(`.bq-esc[data-lugar="${id}"]`);
  let aparecendo = null;

  function contar() {
    if (n >= rodadas) { parar(); api.terminar(total); return; }
    n++;
    mostra('rodada', `${n}/${rodadas}`);
    mostra('chances', '❤️❤️❤️');
    capa.hidden = true;
    aparecendo?.remove();
    lugar.classList.remove('bc-sumiu');
    lugar.classList.add('bc-conta');
    api.falar(n === 1 ? 'Conta até 3 que eu vou me esconder! 🙈' : 'De novo! Conta até 3! 🙈', 2200);
    api.ctl.status('Feche os olhos... quer dizer, conte junto! 1, 2, 3...');
    [3, 2, 1].forEach((k, i) => depois(700 + i * 750, () => {
      const r = cena.getBoundingClientRect();
      api.efeito(String(k), 'conta', r.width * 0.2, r.height * 0.45, 700);
      api.ctl.som('passo');
    }));
    depois(700 + 3 * 750, esconder);
  }
  function esconder() {
    lugar.classList.remove('bc-conta');
    lugar.classList.add('bc-sumiu');
    rodada = br.novaRodada(Math.random, lugares, anterior);
    anterior = rodada.lugar;
    capa.hidden = false;
    capa.querySelectorAll('.bq-esc').forEach((g) => g.classList.remove('nao', 'achou', 'olhou', 'mexe'));
    procurando = true;
    api.ctl.status(`Onde ${api.b().nome} se escondeu? Toque no esconderijo! 👀`);
    api.ctl.som('voo');
    let k = 0;
    dicas = setInterval(() => {
      if (!procurando || acabou || !api.vivo()) return;
      const g = esc(rodada.lugar);
      const tipos = [...g.querySelectorAll('.bq-espia')];
      const espia = tipos[k++ % tipos.length];
      g.classList.remove('mexe'); void g.getBoundingClientRect(); g.classList.add('mexe');
      espia.classList.add('ve');
      setTimeout(() => espia.classList.remove('ve'), 1300);
      if (k % 2) api.ctl.som('passo');
    }, 2400);
  }
  function apareceEm(id, feliz) {
    const g = esc(id);
    const caixa = g.querySelector('.bq-esc-obj').getBoundingClientRect();
    const rc = cena.getBoundingClientRect();
    const p = el('div', `bichinho-aparece${feliz ? '' : ' bc-h-contente'} bc-h-feliz`, svgBichinho(api.b().especie, api.b().vestindo));
    const larg = Math.min(120, Math.max(100, caixa.width));
    p.style.width = `${larg}px`;
    p.style.left = `${caixa.left - rc.left + caixa.width / 2 - larg / 2}px`;
    const alto = caixa.height > rc.height * 0.5; // cortina: sai por baixo, do lado
    p.style.top = `${alto ? caixa.bottom - rc.top - larg * 1.1 : Math.max(0, caixa.top - rc.top - larg * 0.75)}px`;
    if (alto) p.style.left = `${caixa.right - rc.left - larg * 0.55}px`;
    capa.append(p);
    aparecendo = p;
    g.classList.add('achou');
    return { x: caixa.left - rc.left + caixa.width / 2, y: Math.max(20, caixa.top - rc.top) };
  }
  capa.addEventListener('click', (ev) => {
    const g = ev.target.closest('.bq-esc');
    if (!g || !procurando || acabou) return;
    const r = br.procurar(rodada, g.dataset.lugar);
    if (r.resultado === 'repetido') { api.ctl.status('Aí você já olhou! Tente outro lugar. 😉'); return; }
    rodada = r.rodada;
    mostra('chances', '❤️'.repeat(br.ESCONDE.tentativas - rodada.tentativas) + '🤍'.repeat(rodada.tentativas));
    if (r.resultado === 'errou') {
      g.classList.remove('nao'); void g.getBoundingClientRect(); g.classList.add('nao', 'olhou');
      const caixa = g.getBoundingClientRect(); const rc = cena.getBoundingClientRect();
      api.efeito('Aqui não! 🙈', 'sobe aviso', caixa.left - rc.left + caixa.width / 2, caixa.top - rc.top + 20, 1100);
      api.ctl.som('erro');
      api.ctl.status('Não está aí... ouça: tem alguém se mexendo! 👂');
      return;
    }
    procurando = false;
    clearInterval(dicas);
    if (r.resultado === 'achou') {
      total += rodada.pontos;
      mostra('pontos', total);
      const pt = apareceEm(rodada.lugar, true);
      api.efeito(`+${rodada.pontos} ⭐`, 'sobe moeda', pt.x, pt.y, 1500);
      for (let k = 0; k < 3; k++) setTimeout(() => api.efeito('💖', 'sobe', pt.x + (k - 1) * 22, pt.y + 10, 1300), k * 150);
      api.ctl.som('vitoria');
      api.ctl.status(['Achou! 🎉', 'Me achou! Hihi! 🥰', 'Você é muito bom nisso! 🎉'][Math.min(2, rodada.tentativas - 1)]);
    } else {
      const pt = apareceEm(rodada.lugar, false);
      api.efeito('Estava aqui! 😜', 'sobe aviso', pt.x, pt.y, 1500);
      api.ctl.som('clique');
      api.ctl.status(`${api.b().nome} estava atrás de ${lugares.find((l) => l.id === rodada.lugar).nome}! 😜`);
    }
    depois(1900, contar);
  });
  function parar() {
    acabou = true;
    clearInterval(dicas);
    for (const id of timers) clearTimeout(id);
    capa.remove();
    cena.classList.remove('escondendo');
    lugar.classList.remove('bc-conta', 'bc-sumiu');
  }
  contar();
  return { parar };
}

// ---------- 💃 Dança ----------
const SETAS = ['⬅️', '⬆️', '⬇️', '➡️'];
const NOTAS_DANCA = [523, 587, 659, 784];
function danca(api) {
  const notas0 = br.gerarDanca(Math.random);
  let notas = notas0;
  const fimMs = br.duracaoDanca(notas);
  const batida = 60000 / br.DANCA.bpm;
  api.painel.innerHTML = `<div class="bichinho-painel-tit">💃 Toque na setinha quando ela chegar na linha!</div>
    <div class="bichinho-jogo-info"><span>Pontos: <b class="pontos">0</b></span><span>Sequência: <b class="combo">0</b></span></div>
    <div class="bichinho-pista">${SETAS.map((s, i) => `<div class="bichinho-faixa" data-faixa="${i}"></div>`).join('')}<div class="bichinho-alvo"></div></div>
    <div class="bichinho-pads">${SETAS.map((s, i) => `<button class="bichinho-pad f${i}" data-faixa="${i}" aria-label="${br.FAIXAS[i]}">${s}</button>`).join('')}</div>`;
  const pista = api.painel.querySelector('.bichinho-pista');
  const faixas = [...pista.querySelectorAll('.bichinho-faixa')];
  const lugar = api.petLugar();
  api.cena.classList.add('discoteca');
  const globo = el('div', 'bichinho-globo', '🪩');
  api.cena.querySelector('.bichinho-fx').before(globo);
  const ANTES = 1700; // ms que a setinha leva para descer até a linha
  const els = new Map();
  let pontos = 0; let combo = 0; let raf = 0; let inicio = 0; let acabou = false; let ultimaBatida = -1; let passo = 0;
  const agora = () => performance.now() - inicio;
  function dancar(faixa) {
    const classes = ['bc-danca-0', 'bc-danca-1', 'bc-danca-2', 'bc-danca-3'];
    lugar.classList.remove(...classes); void lugar.offsetWidth; lugar.classList.add(classes[faixa]);
  }
  function tocar(faixa, ev) {
    ev?.preventDefault();
    if (acabou) return;
    const pad = api.painel.querySelector(`.bichinho-pad[data-faixa="${faixa}"]`);
    pad.classList.remove('bate'); void pad.offsetWidth; pad.classList.add('bate');
    const r = br.julgarToque(notas, faixa, agora());
    if (!r.tipo) { pad.classList.add('ops'); setTimeout(() => pad.classList.remove('ops'), 200); return; }
    notas = r.notas;
    pontos += r.pontos;
    combo++;
    const e = els.get(r.indice);
    if (e) { e.classList.add('pegou'); setTimeout(() => e.remove(), 250); els.delete(r.indice); }
    const txt = el('span', `bichinho-julga ${r.tipo}`, r.tipo === 'perfeito' ? 'Perfeito!' : 'Bom!');
    faixas[faixa].append(txt);
    setTimeout(() => txt.remove(), 600);
    tom(NOTAS_DANCA[faixa] * (r.tipo === 'perfeito' ? 2 : 1), 0.2, { vol: 0.12 });
    dancar(faixa);
    if (combo > 0 && combo % 8 === 0) { api.coracoes(2, '✨'); api.falar(['Que ritmo! 🎶', 'Arrasou! 💃', 'Uhuu! 🕺'][(combo / 8) % 3 | 0], 1100); }
    api.painel.querySelector('.pontos').textContent = pontos;
    api.painel.querySelector('.combo').textContent = combo;
  }
  api.painel.querySelectorAll('.bichinho-pad').forEach((p) => { p.onpointerdown = (ev) => tocar(Number(p.dataset.faixa), ev); });
  const teclas = { ArrowLeft: 0, ArrowUp: 1, ArrowDown: 2, ArrowRight: 3 };
  const tecla = (ev) => { if (ev.key in teclas) tocar(teclas[ev.key], ev); };
  document.addEventListener('keydown', tecla);
  function quadro() {
    if (!api.vivo() || acabou) return;
    const t = agora();
    const alto = pista.clientHeight - 50; // topo da setinha quando ela está no meio da linha
    notas.forEach((n, i) => {
      if (n.julgada) return;
      if (n.t - t < ANTES && !els.has(i)) {
        const e = el('span', `bichinho-seta f${n.faixa}`, SETAS[n.faixa]);
        faixas[n.faixa].append(e);
        els.set(i, e);
      }
      const e = els.get(i);
      if (e) e.style.transform = `translate(-50%, ${alto - ((n.t - t) / ANTES) * alto}px)`;
    });
    const m = br.marcarPerdidas(notas, t);
    if (m.perdidas) {
      notas = m.notas;
      notas.forEach((n, i) => { if (n.julgada === 'perdeu' && els.has(i)) { els.get(i).classList.add('perdeu'); const e = els.get(i); setTimeout(() => e.remove(), 300); els.delete(i); } });
      combo = 0;
      api.painel.querySelector('.combo').textContent = combo;
    }
    // batidinha da música
    const k = Math.floor((t - br.DANCA.inicio) / batida);
    if (k > ultimaBatida && t > br.DANCA.inicio - 20) {
      ultimaBatida = k;
      tom(k % 2 ? 98 : 131, 0.12, { tipo: 'sine', vol: 0.18 });
      if (k % 4 === 0) tom([392, 440, 330, 349][(k / 4) % 4 | 0], 0.5, { tipo: 'sine', vol: 0.05 });
      globo.classList.toggle('vira');
      if (!reduzido() && combo === 0) { passo = (passo + 1) % 2; lugar.classList.toggle('bc-balanca', passo === 1); }
    }
    if (t >= fimMs) { parar(); api.terminar(pontos); return; }
    raf = requestAnimationFrame(quadro);
  }
  function parar() {
    acabou = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', tecla);
    globo.remove();
    api.cena.classList.remove('discoteca');
    lugar.classList.remove('bc-danca-0', 'bc-danca-1', 'bc-danca-2', 'bc-danca-3', 'bc-balanca');
  }
  api.ctl.status('Música! Toque nas setinhas no ritmo! 🎶');
  api.falar('Vamos dançar! 🎶', 1600);
  inicio = performance.now();
  raf = requestAnimationFrame(quadro);
  return { parar };
}

// ---------- 🦴 Pega o petisco ----------
function petisco(api) {
  const { duracao } = br.PETISCO;
  const mostra = hud(api, '🦴 Arraste o bichinho para pegar os petiscos!', [['Pontos:', 'pontos', 0], ['⏱️', 'tempo', `${duracao}s`]]);
  const { cena } = api;
  const lugar = api.petLugar();
  cena.classList.add('pegando');
  lugar.classList.add('bc-pequeno');
  const c = camada(api);
  let petX = 0.5; let pontos = 0; let acabou = false; let raf = 0; let inicio = 0; let anterior = 0; let proxima = 0; let arrastando = false;
  const caindo = new Set();
  const posicionar = () => { lugar.style.left = `${petX * 100}%`; };
  const mover = (ev) => {
    if (!arrastando || acabou) return;
    const r = cena.getBoundingClientRect();
    petX = Math.max(0.1, Math.min(0.9, (ev.clientX - r.left) / r.width));
    posicionar();
  };
  const baixo = (ev) => { arrastando = true; cena.setPointerCapture?.(ev.pointerId); mover(ev); };
  const cima = () => { arrastando = false; };
  const tecla = (ev) => { if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); petX = Math.max(0.1, Math.min(0.9, petX + (ev.key === 'ArrowLeft' ? -0.08 : 0.08))); posicionar(); } };
  cena.addEventListener('pointerdown', baixo);
  cena.addEventListener('pointermove', mover);
  cena.addEventListener('pointerup', cima);
  cena.addEventListener('pointercancel', cima);
  document.addEventListener('keydown', tecla);
  function quadro(t) {
    if (!api.vivo() || acabou) return;
    const dt = Math.min(0.05, (t - anterior) / 1000); anterior = t;
    const seg = (t - inicio) / 1000;
    const w = cena.clientWidth; const h = cena.clientHeight;
    const linha = h - lugar.offsetHeight * 0.72; // altura da boquinha
    if (t >= proxima && seg < duracao - 1.2) {
      const d = br.novoPetisco(Math.random, seg);
      const e = el('span', `bichinho-cai${d.comida ? '' : ' ruim'}`, d.icone);
      c.append(e);
      caindo.add({ e, d, y: -30, rot: 0 });
      proxima = t + br.intervaloPetisco(seg);
    }
    for (const it of caindo) {
      it.y += it.d.cai * dt;
      it.rot += it.d.gira * dt;
      it.e.style.transform = `translate(${it.d.x * w - 18}px, ${it.y}px) rotate(${it.rot}deg)`;
      if (!it.pego && it.y >= linha - 10 && it.y <= linha + 18 && br.alcancou(petX, it.d.x)) {
        it.pego = true;
        pontos = br.somarPetisco(pontos, it.d);
        mostra('pontos', pontos);
        it.e.remove(); caindo.delete(it);
        const px = petX * w;
        if (it.d.comida) {
          api.efeito(it.d.raro ? '+3 💖' : '+1', `sobe ${it.d.raro ? 'moeda' : 'pontinho'}`, px, linha - 30, 900);
          api.ctl.som(it.d.raro ? 'moeda' : 'item');
          lugar.classList.remove('bc-comendo'); void lugar.offsetWidth; lugar.classList.add('bc-comendo');
          setTimeout(() => lugar.classList.remove('bc-comendo'), 450);
        } else {
          api.efeito('Eca! 🙀', 'sobe aviso', px, linha - 30, 900);
          api.ctl.som('erro');
          lugar.classList.remove('bc-eca'); void lugar.offsetWidth; lugar.classList.add('bc-eca');
        }
        continue;
      }
      if (it.y > h + 40) { it.e.remove(); caindo.delete(it); }
    }
    mostra('tempo', `${Math.max(0, Math.ceil(duracao - seg))}s`);
    if (seg >= duracao) { parar(); api.terminar(pontos); return; }
    raf = requestAnimationFrame(quadro);
  }
  function parar() {
    acabou = true;
    cancelAnimationFrame(raf);
    cena.removeEventListener('pointerdown', baixo);
    cena.removeEventListener('pointermove', mover);
    cena.removeEventListener('pointerup', cima);
    cena.removeEventListener('pointercancel', cima);
    document.removeEventListener('keydown', tecla);
    c.remove();
    cena.classList.remove('pegando');
    lugar.classList.remove('bc-pequeno', 'bc-comendo', 'bc-eca');
    lugar.style.left = '';
  }
  api.ctl.status('Arraste o bichinho para os lados. Pegue a comida e fuja das meias e pedras! 🧦');
  posicionar();
  raf = requestAnimationFrame((t) => { inicio = anterior = t; proxima = t + 700; quadro(t); });
  return { parar };
}

// ---------- 🧩 Siga o bichinho ----------
const PADS = [
  { cor: 'vermelho', icone: '❤️', freq: 523 },
  { cor: 'amarelo', icone: '⭐', freq: 659 },
  { cor: 'azul', icone: '💧', freq: 784 },
  { cor: 'verde', icone: '🍀', freq: 1047 },
];
function siga(api) {
  const mostra = hud(api, '🧩 Olhe o bichinho e repita as cores!', [['Sequência:', 'tam', br.SIGA.inicio], ['Recorde:', 'rec', api.b().recordes?.siga ?? 0]]);
  const lugar = api.petLugar();
  const c = camada(api, 'bichinho-siga');
  c.innerHTML = PADS.map((p, i) => `<button class="bichinho-botao-siga ${p.cor} p${i}" data-i="${i}" aria-label="${p.cor}"><span>${p.icone}</span></button>`).join('');
  const botoes = [...c.querySelectorAll('button')];
  let seq = br.novaSequencia(Math.random);
  let entrada = []; let vez = false; let acabou = false;
  const timers = new Set();
  const depois = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); if (!acabou && api.vivo()) fn(); }, ms); timers.add(id); };
  function acender(i, ms = 420) {
    const bt = botoes[i];
    bt.classList.add('aceso');
    tom(PADS[i].freq, ms / 1000 + 0.05, { vol: 0.14 });
    setTimeout(() => bt.classList.remove('aceso'), ms);
  }
  function apontar(i) {
    const cl = ['bc-aponta-0', 'bc-aponta-1', 'bc-aponta-2', 'bc-aponta-3'];
    lugar.classList.remove(...cl);
    if (i !== null) lugar.classList.add(cl[i]);
  }
  function mostrar() {
    vez = false;
    entrada = [];
    c.classList.add('olhando');
    mostra('tam', seq.length);
    api.ctl.status(`Olhe bem! ${api.b().nome} vai mostrar ${seq.length} cores. 👀`);
    const passo = Math.max(380, 640 - seq.length * 30);
    seq.forEach((i, k) => depois(700 + k * passo, () => { apontar(i); acender(i, passo * 0.7); }));
    depois(700 + seq.length * passo, () => {
      apontar(null);
      vez = true;
      c.classList.remove('olhando');
      api.ctl.status('Sua vez! Toque nas cores na mesma ordem. 👆');
    });
  }
  c.addEventListener('pointerdown', (ev) => {
    const bt = ev.target.closest('button');
    if (!bt || !vez || acabou) return;
    ev.preventDefault();
    const i = Number(bt.dataset.i);
    acender(i, 260);
    entrada.push(i);
    const r = br.conferir(seq, entrada);
    if (r === 'errado') {
      vez = false;
      lugar.classList.add('bc-h-triste-temp');
      api.ctl.som('erro');
      api.falar('Ops! Era outra cor... 🥺', 1400);
      const pontos = br.pontosSiga(seq, r);
      depois(1300, () => { lugar.classList.remove('bc-h-triste-temp'); parar(); api.terminar(pontos); });
      return;
    }
    if (r === 'completo') {
      vez = false;
      api.pular();
      api.coracoes(2, '✨');
      api.ctl.som('acerto');
      if (seq.length >= br.SIGA.maximo) { depois(900, () => { parar(); api.terminar(seq.length); }); return; }
      api.falar(['Isso! 🎉', 'Acertou tudo! 💖', 'Que memória! 🧠'][seq.length % 3], 1000);
      seq = br.crescer(seq, Math.random);
      depois(1000, mostrar);
    }
  });
  function parar() {
    acabou = true;
    for (const id of timers) clearTimeout(id);
    c.remove();
    apontar(null);
    lugar.classList.remove('bc-h-triste-temp');
  }
  api.falar('Faz igual a mim! 🧩', 1600);
  mostrar();
  return { parar };
}

export const TELAS_BRINCADEIRAS = { bola, bolhas, esconde, danca, petisco, siga };
