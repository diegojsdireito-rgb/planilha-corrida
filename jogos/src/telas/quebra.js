// Tela do Quebra-cabeça: escolha da imagem e do tamanho, peças com abas (clip-path SVG)
// que se arrastam com o dedo ou o mouse e grudam no lugar certo.
import * as qb from '../quebra.js';
import { el, formatarTempo } from '../comum.js';
import { prefs, guardar } from '../dados.js';
import { retrato } from '../personagem.js';
import { PERSONAGENS, miniatura } from '../personagens.js';
import { DESENHOS } from '../pintar-desenhos.js';
import { DOCES } from './memoria.js';

export const INFO = {
  id: 'quebra', nome: 'Quebra-cabeça', descricao: 'Monte a imagem peça por peça', solo: true, semNivel: true, rotuloNovo: 'Embaralhar de novo',
  regras: [
    'Escolha uma imagem e o número de peças: 9, 16, 25, 36 ou 48.',
    'Arraste cada peça com o dedo (ou o mouse) até o lugar dela no quadro. Perto do lugar certo, ela gruda sozinha.',
    'Dica: comece pelos cantos e pelas beiradas, que têm um lado reto.',
    'Toque em 👁️ para ver a imagem inteira e em 💡 para o robô mostrar onde vai uma peça.',
    'A partida fica guardada: dá para sair e continuar depois. 🖼️ Imagens volta para a escolha.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#dff3ff"/><path d="M2 2h3.2a1.1 1.1 0 1 1 1.6 0H10v3.2a1.1 1.1 0 1 0 0 1.6V10H6.8a1.1 1.1 0 1 0-1.6 0H2V6.8a1.1 1.1 0 1 1 0-1.6Z" fill="#ff8a1f"/><path d="M2 2h3.2a1.1 1.1 0 1 1 1.6 0H10v3.2a1.1 1.1 0 1 0 0 1.6V6H2Z" fill="#3e8bff"/><path d="M6 2h-.8a1.1 1.1 0 1 1 1.6 0H10v3.2a1.1 1.1 0 1 0 0 1.6V6H6Z" fill="#2fb66a"/><path d="M2 2h12" stroke="none"/></svg>';

// ---------- imagens ----------
// Desenhos do Pintar já pintados: as cores entram, em ordem, nas formas que não têm cor própria.
function colorir(id, cores, ceu) {
  const d = DESENHOS.find((x) => x.id === id);
  let k = 0; const pilha = [];
  const svg = d.svg.replace(/<(\/?)(\w+)([^>]*?)(\/?)>/g, (tudo, fecha, tag, attrs, auto) => {
    if (fecha) { pilha.pop(); return tudo; }
    const temCor = /\bfill=/.test(attrs);
    if (tag === 'g' || tag === 'defs' || tag === 'clipPath') { if (!auto) pilha.push(temCor || tag !== 'g'); return tudo; }
    if (temCor || pilha.some(Boolean)) return tudo;
    const cor = cores[k++] ?? '#fff';
    return `<${tag} fill="${cor}"${attrs}${auto}>`;
  });
  return `<defs><linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ceu[0]}"/><stop offset="1" stop-color="${ceu[1]}"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#ceu)"/><g stroke="#2b2420" stroke-width="${d.traco ?? 4}" stroke-linejoin="round" stroke-linecap="round">${svg}</g>`;
}
const flor = (petala, miolo) => [petala, petala, petala, petala, petala, miolo];
const rep = (cor, n) => Array(n).fill(cor);

const embutir = (svg, x, y, tam) => svg.replace(/^<svg /, `<svg x="${x}" y="${y}" width="${tam}" height="${tam}" `);
const nuvemC = (x, y, s = 1, cor = '#fff') => `<path transform="translate(${x} ${y}) scale(${s})" d="M-50 20 a22 22 0 0 1 8 -38 a30 30 0 0 1 52 -12 a24 24 0 0 1 40 22 a18 18 0 0 1 0 28 Z" fill="${cor}"/>`;
const arvore = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-7" y="-40" width="14" height="44" rx="4" fill="#8b5a3c"/><circle cx="-18" cy="-52" r="22" fill="#2f9e62"/><circle cx="18" cy="-52" r="22" fill="#2f9e62"/><circle cx="0" cy="-72" r="26" fill="#3fbf7f"/><circle cx="-8" cy="-78" r="8" fill="#7fe0a6" opacity=".6"/></g>`;
const florzinha = (x, y, cor) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-6" rx="4" ry="6" fill="${cor}" transform="rotate(${a})"/>`).join('')}<circle r="3.5" fill="#ffd23f"/></g>`;
const passaro = (x, y, s = 1, cor = '#3a2d4f') => `<path transform="translate(${x} ${y}) scale(${s})" d="M-12 0 Q-6 -8 0 0 Q6 -8 12 0" fill="none" stroke="${cor}" stroke-width="2.6" stroke-linecap="round"/>`;

function cenaParque() {
  const p1 = embutir(retrato({ pele: 1, roupa: 0, estilo: 'moletom', sorriso: 'feliz' }), 40, 186, 120);
  const p2 = embutir(retrato({ pele: 3, roupa: 2, estilo: 'street', sorriso: 'uau' }), 250, 196, 112);
  const p3 = embutir(miniatura(PERSONAGENS.find((p) => p.id === 'maya')), 160, 214, 86);
  return `<defs><linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec6ff"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#ceu)"/>
    <circle cx="336" cy="66" r="34" fill="#ffd23f"/><circle cx="336" cy="66" r="46" fill="#ffd23f" opacity=".25"/>
    ${nuvemC(90, 70, 0.9)}${nuvemC(230, 110, 0.6)}
    <path d="M300 40 L330 20 L344 52 Z" fill="#ff5c8a"/><path d="M330 34 Q300 120 260 160" fill="none" stroke="#6b665d" stroke-width="1.5"/>
    <path d="M0 230 Q90 180 200 222 T400 200 V400 H0Z" fill="#8fd16a"/>
    ${arvore(34, 236, 0.9)}${arvore(372, 222, 1)}
    <path d="M0 290 Q200 262 400 286 V400 H0Z" fill="#6cc070"/>
    ${p1}${p2}${p3}
    <path d="M0 300 Q200 284 400 300 V400 H0Z" fill="#5bb35f"/>
    <rect x="30" y="300" width="340" height="16" rx="6" fill="#c98a42"/><rect x="50" y="314" width="12" height="40" fill="#8b5a3c"/><rect x="338" y="314" width="12" height="40" fill="#8b5a3c"/>
    <path d="M0 352 Q200 336 400 352 V400 H0Z" fill="#4aa352"/>
    ${florzinha(30, 370, '#ff6fa8')}${florzinha(90, 384, '#fff')}${florzinha(160, 366, '#b07cff')}${florzinha(240, 382, '#ff9f43')}${florzinha(310, 368, '#ff6fa8')}${florzinha(372, 386, '#fff')}
    <circle cx="210" cy="372" r="16" fill="#ef4b5f"/><path d="M196 366 Q210 360 224 366 M194 378 Q210 384 226 378" stroke="#fff" stroke-width="3" fill="none"/>`;
}

function cenaPorDoSol() {
  return `<defs><linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3fa0"/><stop offset=".45" stop-color="#ff6f91"/><stop offset=".75" stop-color="#ffb35c"/><stop offset="1" stop-color="#ffe08a"/></linearGradient>
    <linearGradient id="lago" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a7a"/><stop offset="1" stop-color="#5b3fa0"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#ceu)"/>
    ${[[40, 40], [120, 24], [210, 56], [300, 30], [370, 70], [80, 96], [250, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff" opacity=".8"/>`).join('')}
    <circle cx="200" cy="236" r="62" fill="#fff1a8"/><circle cx="200" cy="236" r="80" fill="#fff1a8" opacity=".25"/>
    ${nuvemC(90, 150, 0.8, '#ffc1d0')}${nuvemC(330, 128, 0.7, '#ffc1d0')}
    ${passaro(120, 120, 1)}${passaro(150, 104, 0.7)}${passaro(270, 92, 0.9)}
    <path d="M-10 270 L70 170 L130 230 L200 150 L280 236 L340 180 L410 260 V300 H-10Z" fill="#7a4fb0"/>
    <path d="M200 150 L222 174 L210 172 L200 182 L190 170 L180 172Z M70 170 L86 190 L74 188 L64 196 L58 186Z" fill="#fff" opacity=".85"/>
    <path d="M-10 290 L60 222 L150 280 L250 210 L330 270 L410 230 V310 H-10Z" fill="#5b3a8a"/>
    <rect y="296" width="400" height="104" fill="url(#lago)"/>
    ${[310, 326, 344, 362, 380].map((y, k) => `<rect x="${170 - k * 6}" y="${y}" width="${60 + k * 12}" height="4" rx="2" fill="#fff1a8" opacity="${0.7 - k * 0.12}"/>`).join('')}
    ${[[20, 300, 1.2], [56, 306, 0.9], [356, 302, 1.1], [384, 308, 0.8]].map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 L-16 0 L-4 -16 L-12 -16 L0 -34 L12 -16 L4 -16 L16 0Z" fill="#2c1f4a"/>`).join('')}
    <path d="M0 296 H400" stroke="#ffd1a8" stroke-width="2" opacity=".6"/>`;
}

function cenaBaloes() {
  const balao = (x, y, cor, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 34 Q-6 60 4 90" stroke="#6b665d" stroke-width="1.6" fill="none"/><ellipse cx="0" cy="0" rx="26" ry="32" fill="${cor}"/><path d="M-5 34 L0 29 L5 34Z" fill="${cor}"/><ellipse cx="-9" cy="-12" rx="6" ry="10" fill="#fff" opacity=".45" transform="rotate(-20 -9 -12)"/></g>`;
  const cores = ['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6'];
  return `<defs><linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb3ff"/><stop offset="1" stop-color="#c9ecff"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#ceu)"/>
    ${cores.map((c, k) => `<path d="M${-20 + k * 16} 330 A${220 - k * 16} ${220 - k * 16} 0 0 1 ${420 - k * 16} 330" stroke="${c}" stroke-width="16" fill="none" opacity=".9"/>`).join('')}
    ${nuvemC(60, 320, 1.2)}${nuvemC(380, 318, 1.2)}${nuvemC(200, 60, 0.8)}
    ${balao(70, 120, '#ef4b5f')}${balao(140, 180, '#ffd21f', 0.9)}${balao(250, 150, '#2fb66a')}${balao(320, 100, '#9b5cf6', 0.85)}${balao(200, 250, '#3e8bff', 0.8)}${balao(340, 230, '#ff6fa8', 0.75)}
    <path d="M0 360 Q200 340 400 360 V400 H0Z" fill="#6cc070"/>
    ${florzinha(40, 380, '#fff')}${florzinha(120, 372, '#ff6fa8')}${florzinha(280, 378, '#ffd23f')}${florzinha(360, 382, '#b07cff')}`;
}

function cenaDoces() {
  const doce = (k, x, y, tam, giro = 0) => `<svg x="${x}" y="${y}" width="${tam}" height="${tam}" viewBox="0 0 100 100" overflow="visible"><g transform="rotate(${giro} 50 50)">${DOCES[k]}</g></svg>`;
  return `<defs><radialGradient id="fundo" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#ffe9f1"/><stop offset="1" stop-color="#ffb3cf"/></radialGradient>
    <pattern id="bolinhas" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="4" fill="#fff" opacity=".55"/><circle cx="30" cy="30" r="4" fill="#fff" opacity=".55"/></pattern></defs>
    <rect width="400" height="400" fill="url(#fundo)"/><rect width="400" height="400" fill="url(#bolinhas)"/>
    <path d="M0 300 H400 V400 H0Z" fill="#c98a42"/><path d="M0 300 H400 V312 H0Z" fill="#e8b06a"/>
    <ellipse cx="200" cy="300" rx="120" ry="16" fill="#fff" opacity=".9"/>
    <rect x="110" y="200" width="180" height="96" rx="12" fill="#fff1c9"/><path d="M110 236 H290 V250 H110Z" fill="#ff6fa8"/>
    <path d="M104 206 Q104 186 124 186 H276 Q296 186 296 206 Q284 222 272 206 Q260 222 248 206 Q236 222 224 206 Q212 222 200 206 Q188 222 176 206 Q164 222 152 206 Q140 222 128 206 Q116 222 104 206Z" fill="#ff9fc6"/>
    <rect x="130" y="130" width="140" height="62" rx="10" fill="#b9e88a"/><path d="M126 138 Q126 124 140 124 H260 Q274 124 274 138 Q264 150 252 138 Q240 150 228 138 Q216 150 204 138 Q192 150 180 138 Q168 150 156 138 Q144 150 126 138Z" fill="#fff"/>
    ${[150, 200, 250].map((x) => `<rect x="${x - 4}" y="92" width="8" height="34" rx="3" fill="${x === 200 ? '#3e8bff' : '#ff9a1f'}"/><path d="M${x} 78 Q${x + 8} 88 ${x} 94 Q${x - 8} 88 ${x} 78Z" fill="#ffd21f"/>`).join('')}
    ${doce(0, 20, 30, 70, -12)}${doce(2, 310, 26, 70, 10)}${doce(4, 330, 120, 56)}${doce(1, 16, 124, 60)}${doce(7, 24, 214, 76)}${doce(8, 300, 200, 80)}
    ${doce(3, 30, 318, 66, 8)}${doce(5, 120, 330, 56)}${doce(9, 210, 322, 64, -6)}${doce(11, 300, 312, 80)}`;
}

export const IMAGENS = [
  { id: 'gato', nome: 'Gatinho', cena: () => colorir('gato', ['#9fd67a', '#f4a142', '#f4a142', '#ffe2bf', '#ffe2bf', '#ffe2bf', '#f4a142', '#f4a142', '#f6b25a', '#ff9fb4', '#ff9fb4', '#c8f08a', '#c8f08a', '#ff7f9b', '#ff4f7a'], ['#bfe6ff', '#fff3d6']) },
  { id: 'parque', nome: 'A turma no parque', cena: cenaParque },
  { id: 'casa', nome: 'Casinha', cena: () => colorir('casa', ['#ffd23f', '#fff', '#7fcf6b', '#b5523b', '#ffe1a8', '#e5484d', '#8fd3ff', '#8b5a3c', '#8fd3ff', '#8fd3ff', '#8b5a3c', '#3fae5a', ...flor('#ff6fa8', '#ffd23f'), ...flor('#b07cff', '#ffd23f'), ...flor('#ff9f43', '#fff')], ['#8fd3ff', '#e6f6ff']) },
  { id: 'pordosol', nome: 'Pôr do sol', cena: cenaPorDoSol },
  { id: 'peixe', nome: 'Peixinho', cena: () => colorir('peixe', ['#f5d78e', '#3fbf7f', '#2fa36b', '#ff8a3d', '#ff8a3d', '#ff8a3d', '#ffb238', '#ff8a3d', '#fff', ...rep('#e3f6ff', 5), '#ff6f91'], ['#6fd0ff', '#1f7fd1']) },
  { id: 'baloes', nome: 'Balões e arco-íris', cena: cenaBaloes },
  { id: 'foguete', nome: 'Foguete', cena: () => colorir('foguete', [...rep('#ffe066', 5), '#fff2a8', '#ff9ad5', '#ff8a1f', '#ffd23f', '#e5484d', '#e5484d', '#f2f4fa', '#8b97b5', '#7fd6ff', '#e5484d'], ['#1d2a6b', '#6b3fa0']) },
  { id: 'doces', nome: 'Festa dos docinhos', cena: cenaDoces },
  { id: 'castelo', nome: 'Castelo', cena: () => colorir('castelo', ['#fff', '#fff', '#7fcf6b', '#8e5bd6', '#8e5bd6', '#ff5c8a', '#ffe4f1', '#ffd1e8', '#ffd1e8', '#ffd1e8', '#8b5a3c', '#7fd6ff', '#7fd6ff', '#7fd6ff', '#ff4f7a', ...flor('#ffd23f', '#ff6fa8'), ...flor('#ff6fa8', '#fff')], ['#9fdcff', '#fff0f8']) },
  { id: 'dino', nome: 'Dinossauro', cena: () => colorir('dino', ['#ffd23f', '#a7d86d', '#5cc46a', '#ff9f43', '#4fb05c', '#4fb05c', '#4fb05c', '#4fb05c', '#5cc46a', '#5cc46a', '#fff', '#3e9a4c', '#3e9a4c', '#3e9a4c', '#3e9a4c', ...flor('#ff6fa8', '#ffd23f'), ...flor('#fff', '#ff9f43')], ['#bfe9ff', '#fff6d6']) },
];
const imagemDe = (id) => IMAGENS.find((i) => i.id === id) ?? IMAGENS[0];
const svgDaImagem = (img) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${img.cena()}</svg>`;
const urlDaImagem = (img) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDaImagem(img))}`;

const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Imagens já montadas, com o maior número de peças de cada uma.
function montadas() {
  const r = {};
  for (const h of prefs.historico) if (h.j === 'quebra' && h.r === 'vitoria' && h.imagem) r[h.imagem] = Math.max(r[h.imagem] ?? 0, h.nivel ?? 0);
  return r;
}

export function resumo() {
  const n = prefs.historico.filter((h) => h.j === 'quebra' && h.r === 'vitoria').length;
  const imgs = Object.keys(montadas()).length;
  return {
    cartao: n ? `<b>${n}</b> montados · ${imgs} de ${IMAGENS.length} imagens` : `${IMAGENS.length} imagens para montar`,
    placar: `<span class="lado"><span class="avatar voce">🧩</span>Montados <span class="num">${n}</span></span><span class="x">·</span><span class="lado">Imagens <span class="num">${imgs}/${IMAGENS.length}</span></span>`,
    painel: { valor: `${n}`, rotulo: 'quebra-cabeças montados', sub: `${imgs} de ${IMAGENS.length} imagens` },
  };
}

export function montar(area, ctl) {
  const raiz = el('div', 'qb');
  area.append(raiz);
  let e = null; let t = null; let cel = 0; let pad = 0; let relogio = null; let inicio = 0; let acabou = false;
  let pecasEl = []; let urlPng = null; let urlSvg = null; let mesa; let quadro;

  const tempoAgora = () => (e?.tempo ?? 0) + (acabou || !inicio ? 0 : (Date.now() - inicio) / 1000);
  const salvar = () => { if (e && !acabou) ctl.salvar({ e: { ...e, tempo: tempoAgora() } }); };

  // ---------- escolha ----------
  function mostrarEscolha() {
    clearInterval(relogio); e = null; acabou = false;
    const feitas = montadas();
    const tam = prefs.quebraTamanho ?? 9;
    raiz.innerHTML = `
      <div class="qb-escolha">
        <div class="qb-rotulo">Quantas peças?</div>
        <div class="qb-tamanhos" role="group" aria-label="Número de peças">${qb.TAMANHOS.map((x) => `<button class="qb-tam" data-n="${x.n}" aria-pressed="${x.n === tam}"><b>${x.n}</b><span>${x.colunas}×${x.linhas}</span></button>`).join('')}</div>
        <div class="qb-rotulo">Escolha a imagem</div>
        <div class="qb-galeria">${IMAGENS.map((img) => `<button class="qb-img" data-img="${img.id}" aria-label="${img.nome}${feitas[img.id] ? `, já montada com ${feitas[img.id]} peças` : ''}">
          <img src="${urlDaImagem(img)}" alt="" loading="lazy"><span class="qb-nome">${img.nome}</span>${feitas[img.id] ? `<span class="qb-selo">✓ ${feitas[img.id]}</span>` : ''}</button>`).join('')}</div>
      </div>`;
    raiz.querySelectorAll('.qb-tam').forEach((b) => {
      b.onclick = () => {
        prefs.quebraTamanho = Number(b.dataset.n); guardar(); ctl.som('clique');
        raiz.querySelectorAll('.qb-tam').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      };
    });
    raiz.querySelectorAll('.qb-img').forEach((b) => { b.onclick = () => { ctl.som('clique'); comecar(b.dataset.img, prefs.quebraTamanho ?? 9); }; });
    ctl.status('Escolha o tamanho e a imagem', 'voce');
  }

  // ---------- partida ----------
  function comecar(idImg, n, salvo = null) {
    clearInterval(relogio);
    acabou = false; inicio = 0;
    e = salvo ?? qb.novoJogo(n, idImg);
    t = qb.tamanhoDe(e.n);
    const img = imagemDe(e.imagem);
    raiz.innerHTML = `
      <div class="qb-topo">
        <button class="botao secundario qb-voltar">🖼️ Imagens</button>
        <div class="qb-info"></div>
        <button class="qb-botao" data-acao="ver" aria-label="Ver a imagem inteira">👁️</button>
        <button class="qb-botao" data-acao="dica" aria-label="Dica">💡</button>
      </div>
      <div class="qb-mesa"><div class="qb-bandeja"></div><div class="qb-quadro"><svg class="qb-encaixes"></svg><img class="qb-sombra" alt=""><img class="qb-modelo" alt="" hidden></div></div>`;
    mesa = raiz.querySelector('.qb-mesa');
    quadro = raiz.querySelector('.qb-quadro');
    raiz.querySelector('.qb-voltar').onclick = () => { ctl.som('clique'); salvar(); mostrarEscolha(); };
    raiz.querySelector('[data-acao="ver"]').onclick = verImagem;
    raiz.querySelector('[data-acao="dica"]').onclick = darDica;
    medir();
    montarPecas(img);
    escrever();
    relogio = setInterval(() => { if (!document.body.contains(raiz)) { clearInterval(relogio); return; } if (inicio && !acabou) escrever(); }, 1000);
    ctl.status(salvo ? 'Partida retomada' : 'Arraste as peças para o quadro', 'voce');
    if (!salvo) salvar();
  }

  function medir() {
    const band = qb.bandejaDe(t);
    const largura = raiz.clientWidth || 358;
    const topo = mesa.getBoundingClientRect().top + window.scrollY;
    const altura = Math.max(460, (window.visualViewport?.height ?? window.innerHeight) - topo - 20);
    cel = Math.floor(Math.min(largura / (t.colunas + 2 * qb.MARGEM), altura / (t.linhas + band + 2 * qb.MARGEM), 130));
    pad = Math.round(cel * qb.MARGEM);
    mesa.style.width = `${t.colunas * cel + 2 * pad}px`;
    mesa.style.height = `${(t.linhas + band) * cel + 2 * pad}px`;
    Object.assign(quadro.style, { left: `${pad}px`, top: `${pad}px`, width: `${t.colunas * cel}px`, height: `${t.linhas * cel}px` });
    const bandeja = raiz.querySelector('.qb-bandeja');
    Object.assign(bandeja.style, { left: '0', right: '0', top: `${t.linhas * cel + pad + 6}px`, bottom: '0' });
  }

  // Desenha a imagem uma vez num PNG do tamanho do quadro: as peças só recortam esse PNG.
  async function rasterizar(img) {
    const W = t.colunas * cel; const H = t.linhas * cel;
    if (urlSvg?.id !== img.id) urlSvg = { id: img.id, url: urlDaImagem(img) };
    try {
      const im = new Image();
      im.src = urlSvg.url;
      await im.decode();
      const esc = Math.min(3, window.devicePixelRatio || 1);
      const c = document.createElement('canvas');
      c.width = Math.round(W * esc); c.height = Math.round(H * esc);
      const ctx = c.getContext('2d');
      // corta o meio da imagem quadrada para o formato do quadro
      const asp = W / H; const sw = asp < 1 ? 400 * asp : 400; const sh = asp < 1 ? 400 : 400 / asp;
      ctx.drawImage(im, (400 - sw) / 2, (400 - sh) / 2, sw, sh, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      if (!blob) throw new Error('sem png');
      if (urlPng) URL.revokeObjectURL(urlPng);
      urlPng = URL.createObjectURL(blob);
      return { url: urlPng, aspecto: 'none' };
    } catch {
      return { url: urlSvg.url, aspecto: 'xMidYMid slice' };
    }
  }

  async function montarPecas(img) {
    const W = t.colunas * cel; const H = t.linhas * cel;
    // encaixes desenhados no quadro
    const enc = quadro.querySelector('.qb-encaixes');
    enc.setAttribute('viewBox', `0 0 ${W} ${H}`);
    enc.innerHTML = Array.from({ length: t.n }, (_, i) => {
      const { x, y } = qb.lugarDe(e, i);
      return `<path data-i="${i}" transform="translate(${x * cel} ${y * cel})" d="${qb.caminho(qb.ladosDaPeca(e.bordas, t.colunas, t.linhas, i), cel, cel)}"/>`;
    }).join('');
    mesa.querySelectorAll('.qb-peca').forEach((p) => p.remove());
    const { url, aspecto } = await rasterizar(img);
    if (!document.body.contains(mesa)) return;
    const sombra = quadro.querySelector('.qb-sombra'); const modelo = quadro.querySelector('.qb-modelo');
    sombra.src = url; modelo.src = url;
    sombra.hidden = t.n > 16;
    const lado = cel + 2 * pad;
    pecasEl = Array.from({ length: t.n }, (_, i) => {
      const { x, y } = qb.lugarDe(e, i);
      const d = qb.caminho(qb.ladosDaPeca(e.bordas, t.colunas, t.linhas, i), cel, cel);
      const p = el('div', 'qb-peca');
      p.style.width = `${lado}px`; p.style.height = `${lado}px`;
      p.innerHTML = `<svg viewBox="${-pad} ${-pad} ${lado} ${lado}" width="${lado}" height="${lado}" aria-hidden="true">
        <defs><clipPath id="qb-c${i}"><path d="${d}"/></clipPath></defs>
        <image href="${url}" x="${-x * cel}" y="${-y * cel}" width="${W}" height="${H}" preserveAspectRatio="${aspecto}" clip-path="url(#qb-c${i})"/>
        <path class="qb-borda" d="${d}"/><path class="qb-luz" d="${d}"/></svg>`;
      p.setAttribute('role', 'img');
      p.setAttribute('aria-label', `Peça ${i + 1}`);
      ligarArraste(p, i);
      mesa.append(p);
      return p;
    });
    posicionarTodas();
  }

  function posicionar(i) {
    const p = pecasEl[i]; const pos = e.pos[i];
    p.style.transform = `translate(${pos.x * cel}px, ${pos.y * cel}px)`;
    p.classList.toggle('ok', pos.ok);
    p.style.zIndex = pos.ok ? '1' : String(10 + e.ordem.indexOf(i));
  }
  const posicionarTodas = () => pecasEl.forEach((_, i) => posicionar(i));

  function escrever() {
    const info = raiz.querySelector('.qb-info');
    if (info) info.innerHTML = `<b>${qb.encaixadas(e)}</b>/${t.n} peças · ⏱ ${formatarTempo(Math.floor(tempoAgora()))}`;
  }

  function ligarArraste(p, i) {
    let ini = null;
    p.addEventListener('pointerdown', (ev) => {
      if (acabou || e.pos[i].ok || ev.button > 0) return;
      ev.preventDefault();
      if (!inicio) inicio = Date.now();
      p.setPointerCapture(ev.pointerId);
      const r = mesa.getBoundingClientRect();
      ini = { id: ev.pointerId, dx: ev.clientX - r.left - e.pos[i].x * cel, dy: ev.clientY - r.top - e.pos[i].y * cel };
      e.ordem = [...e.ordem.filter((k) => k !== i), i];
      p.style.zIndex = '999';
      p.classList.add('arrastando');
      mesa.querySelector('.qb-peca.dica')?.classList.remove('dica');
      quadro.querySelector('.qb-encaixes .alvo')?.classList.remove('alvo');
      ctl.som('passo');
    });
    p.addEventListener('pointermove', (ev) => {
      if (!ini || ev.pointerId !== ini.id) return;
      const r = mesa.getBoundingClientRect();
      const x = (ev.clientX - r.left - ini.dx) / cel; const y = (ev.clientY - r.top - ini.dy) / cel;
      p.style.transform = `translate(${x * cel}px, ${y * cel}px) scale(1.06)`;
      const alvo = qb.lugarDe(e, i);
      p.classList.toggle('perto', Math.abs(x - alvo.x) <= qb.LIMIAR * 1.4 && Math.abs(y - alvo.y) <= qb.LIMIAR * 1.4);
    });
    const soltarPeca = (ev) => {
      if (!ini || ev.pointerId !== ini.id) return;
      const r = mesa.getBoundingClientRect();
      const x = (ev.clientX - r.left - ini.dx) / cel; const y = (ev.clientY - r.top - ini.dy) / cel;
      ini = null;
      p.classList.remove('arrastando', 'perto');
      const encaixou = qb.soltar(e, i, x, y);
      if (encaixou) {
        p.classList.add('encaixando');
        posicionar(i);
        ctl.som('acerto');
        setTimeout(() => p.classList.remove('encaixando'), 450);
        brilho(i);
        escrever();
        if (qb.completo(e)) { terminar(); return; }
        const falta = t.n - qb.encaixadas(e);
        ctl.status(falta === 1 ? 'Só falta uma peça!' : ['Encaixou!', 'Isso!', 'Muito bem!', 'Perfeito!'][qb.encaixadas(e) % 4], 'vitoria');
      } else {
        posicionar(i);
        ctl.som('mover');
      }
      salvar();
    };
    p.addEventListener('pointerup', soltarPeca);
    p.addEventListener('pointercancel', soltarPeca);
  }

  function brilho(i) {
    if (reduzido()) return;
    const { x, y } = qb.lugarDe(e, i);
    const b = el('div', 'qb-brilho');
    Object.assign(b.style, { left: `${pad + (x + 0.5) * cel}px`, top: `${pad + (y + 0.5) * cel}px` });
    b.innerHTML = Array.from({ length: 8 }, (_, k) => `<i style="--a:${k * 45}deg"></i>`).join('');
    mesa.append(b);
    setTimeout(() => b.remove(), 700);
  }

  let tempoVer = null;
  function verImagem() {
    if (!e) return;
    const modelo = quadro.querySelector('.qb-modelo');
    ctl.som('clique');
    modelo.hidden = !modelo.hidden;
    clearTimeout(tempoVer);
    if (!modelo.hidden) tempoVer = setTimeout(() => { modelo.hidden = true; }, 3000);
  }

  function darDica() {
    if (!e || acabou) return;
    const d = qb.dica(e);
    if (!d) return;
    ctl.som('clique');
    mesa.querySelector('.qb-peca.dica')?.classList.remove('dica');
    quadro.querySelector('.qb-encaixes .alvo')?.classList.remove('alvo');
    pecasEl[d.peca].classList.add('dica');
    quadro.querySelector(`.qb-encaixes [data-i="${d.peca}"]`)?.classList.add('alvo');
    ctl.status('A peça que pula vai no lugar que brilha', 'voce');
  }

  function terminar() {
    acabou = true;
    const tempo = Math.round((e.tempo ?? 0) + (inicio ? (Date.now() - inicio) / 1000 : 0));
    e.tempo = tempo;
    clearInterval(relogio);
    escrever();
    const img = imagemDe(e.imagem);
    ctl.fim('vitoria', `Montou com ${t.n} peças em ${formatarTempo(tempo)}! 🎉`, null, { nivel: t.n, tempo, imagem: img.id });
    mesa.classList.add('completo');
    const proximo = qb.TAMANHOS.find((x) => x.n > t.n);
    const caixa = el('div', 'qb-fim');
    const cores = ['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6', '#ff6fa8'];
    caixa.innerHTML = `${reduzido() ? '' : `<div class="qb-confete">${Array.from({ length: 40 }, (_, k) => `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${cores[k % cores.length]};animation-delay:${(0.3 + Math.random() * 0.7).toFixed(2)}s;animation-duration:${(1.8 + Math.random() * 1.4).toFixed(2)}s;--giro:${Math.round(Math.random() * 720 - 360)}deg;--lado:${Math.round(Math.random() * 80 - 40)}px"></i>`).join('')}</div>`}
      <div class="qb-fim-cartao"><div class="qb-fim-titulo">Montou! 🧩🎉</div><p><b>${img.nome}</b><br>${t.n} peças em ${formatarTempo(tempo)}</p>
      <div class="qb-fim-botoes">${proximo ? `<button class="botao" data-acao="mais">Agora com ${proximo.n} peças</button>` : ''}
      <button class="botao ${proximo ? 'secundario' : ''}" data-acao="outra">🖼️ Outra imagem</button></div></div>`;
    setTimeout(() => { if (document.body.contains(mesa)) { mesa.append(caixa); ctl.som('premio'); } }, 900);
    caixa.querySelector('[data-acao="outra"]').onclick = () => { ctl.som('clique'); mostrarEscolha(); };
    const mais = caixa.querySelector('[data-acao="mais"]');
    if (mais) mais.onclick = () => { ctl.som('clique'); prefs.quebraTamanho = proximo.n; guardar(); comecar(img.id, proximo.n); };
  }

  let ultimaLargura = 0;
  const aoRedimensionar = () => {
    if (!document.body.contains(raiz)) { window.removeEventListener('resize', aoRedimensionar); return; }
    if (!e || !mesa || raiz.clientWidth === ultimaLargura) return;
    ultimaLargura = raiz.clientWidth;
    medir(); montarPecas(imagemDe(e.imagem));
  };
  window.addEventListener('resize', aoRedimensionar);

  const salvo = ctl.salvo();
  if (salvo?.e?.pos) comecar(salvo.e.imagem, salvo.e.n, salvo.e);
  else mostrarEscolha();

  return {
    // "Embaralhar de novo": recomeça a mesma imagem; na escolha, sorteia uma.
    reiniciar() {
      if (e) comecar(e.imagem, e.n);
      else comecar(IMAGENS[Math.floor(Math.random() * IMAGENS.length)].id, prefs.quebraTamanho ?? 9);
    },
  };
}
