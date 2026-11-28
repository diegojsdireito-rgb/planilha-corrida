// Os cenários da corrida: Cidade, Praia, Floresta e Vila da Neve (aqui) e Terra dos Doces,
// Parque de Diversões, Deserto do Oásis e Passeio na Lua (em cenarios-novos.js).
// Cada um tem chão, céu, enfeites dos lados e a sua versão dos três obstáculos
// (o de pular, o de deslizar por baixo e o comprido, de trocar de faixa).
import { THREE, FAIXA, LARG_RUA, CALCADA, COMP_CENA, INICIO, textura, ruido, toonFixo as toon, sombrear } from './base.js';
import { CHAO_NOVOS, enfeitarNovo, obstaculoNovo } from './cenarios-novos.js';

export const LISTA = [
  { id: 'cidade', nome: 'Cidade', icone: '🏙️' },
  { id: 'praia', nome: 'Praia', icone: '🏖️' },
  { id: 'floresta', nome: 'Floresta', icone: '🌲' },
  { id: 'neve', nome: 'Vila da Neve', icone: '❄️' },
  { id: 'doces', nome: 'Terra dos Doces', icone: '🍭' },
  { id: 'parque', nome: 'Parque de Diversões', icone: '🎡' },
  { id: 'deserto', nome: 'Deserto do Oásis', icone: '🏜️' },
  { id: 'lua', nome: 'Passeio na Lua', icone: '🌙' },
];
const NOVOS = new Set(['doces', 'parque', 'deserto', 'lua']);

const LARG_OBST = FAIXA * 0.86;
const malha = (geo, mat) => sombrear(new THREE.Mesh(geo, mat));
const sorteio = (lista) => lista[Math.floor(Math.random() * lista.length)];

// ---------- Texturas de cada cenário ----------
const CHAO = {
  cidade: {
    rua: (ctx, w, h) => {
      ctx.fillStyle = '#5d6478'; ctx.fillRect(0, 0, w, h);
      ruido(ctx, w, h, 2500, 'rgba(255,255,255,.05)'); ruido(ctx, w, h, 2500, 'rgba(0,0,0,.08)');
      ctx.fillStyle = '#f2f2f2';
      for (const fx of [1 / 3, 2 / 3]) for (let y = 0; y < h; y += 128) ctx.fillRect(w * fx - 3, y + 20, 6, 70);
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(4, 0, 6, h); ctx.fillRect(w - 10, 0, 6, h);
    },
    lado: (ctx, w, h) => {
      ctx.fillStyle = '#d9d2c5'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#bdb4a5'; ctx.lineWidth = 3;
      for (let k = 0; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, k * 64); ctx.lineTo(w, k * 64); ctx.moveTo(k * 64, 0); ctx.lineTo(k * 64, h); ctx.stroke(); }
      ruido(ctx, w, h, 400, 'rgba(0,0,0,.06)');
    },
    terreno: (ctx, w, h) => { ctx.fillStyle = '#6cc070'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 900, 'rgba(30,90,40,.25)'); },
    meioFio: 0xff8fa3,
    ceu: ['#3f9cf0', '#8fd0ff', '#dff1ff'], neblina: 0xcfe9ff, hemi: [0xdff1ff, 0x7a8a6a],
  },
  praia: {
    rua: (ctx, w, h) => {
      // calçadão de tábuas
      ctx.fillStyle = '#c9965f'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) {
        ctx.fillStyle = (y / 32) % 2 ? '#d6a46c' : '#c48f57'; ctx.fillRect(0, y, w, 30);
        ctx.fillStyle = 'rgba(80,45,15,.45)'; ctx.fillRect(0, y + 30, w, 2);
        ctx.fillStyle = 'rgba(80,45,15,.5)'; for (const x of [12, w - 14]) ctx.fillRect(x, y + 13, 3, 3);
      }
      ruido(ctx, w, h, 1500, 'rgba(90,50,20,.08)');
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (const fx of [1 / 3, 2 / 3]) ctx.fillRect(w * fx - 2, 0, 4, h);
    },
    lado: (ctx, w, h) => { ctx.fillStyle = '#f2dca8'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 900, 'rgba(160,120,60,.2)'); ruido(ctx, w, h, 300, 'rgba(255,255,255,.4)'); },
    terreno: (ctx, w, h) => { ctx.fillStyle = '#eed39a'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 1200, 'rgba(160,120,60,.18)'); },
    meioFio: 0xffffff,
    ceu: ['#1d9bf0', '#7fe0ff', '#fff1d6'], neblina: 0xfff0d8, hemi: [0xfff6e0, 0xd9c08a],
  },
  floresta: {
    rua: (ctx, w, h) => {
      // trilha de terra batida com pedrinhas
      ctx.fillStyle = '#9b7149'; ctx.fillRect(0, 0, w, h);
      ruido(ctx, w, h, 3000, 'rgba(60,35,15,.18)', 3); ruido(ctx, w, h, 600, 'rgba(230,210,180,.35)', 3);
      ctx.fillStyle = 'rgba(70,40,15,.25)';
      for (const fx of [0.2, 0.47, 0.53, 0.8]) ctx.fillRect(w * fx - 5, 0, 10, h); // marcas de roda
    },
    lado: (ctx, w, h) => { ctx.fillStyle = '#5ea84f'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 1400, 'rgba(20,70,20,.3)', 3); ruido(ctx, w, h, 200, 'rgba(255,240,120,.5)', 3); },
    terreno: (ctx, w, h) => { ctx.fillStyle = '#4f9a45'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 1400, 'rgba(20,60,20,.3)', 3); },
    meioFio: 0x8a8f86,
    ceu: ['#4fa6e0', '#a8dcc8', '#e4f2d6'], neblina: 0xd8ecd0, hemi: [0xe8f6e0, 0x4a6a3a],
  },
  neve: {
    rua: (ctx, w, h) => {
      // neve pisada, com marcas de trenó
      ctx.fillStyle = '#e8f0f8'; ctx.fillRect(0, 0, w, h);
      ruido(ctx, w, h, 2500, 'rgba(150,180,210,.2)', 3);
      ctx.fillStyle = 'rgba(140,170,205,.35)';
      for (const fx of [0.13, 0.2, 0.46, 0.54, 0.8, 0.87]) ctx.fillRect(w * fx - 3, 0, 6, h);
    },
    lado: (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 900, 'rgba(160,190,220,.25)', 3); },
    terreno: (ctx, w, h) => { ctx.fillStyle = '#f6f9fc'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 900, 'rgba(160,190,220,.2)', 3); },
    meioFio: 0xc7dcef,
    ceu: ['#7fa9cf', '#c9dcef', '#f2f6fa'], neblina: 0xeef3f8, hemi: [0xf4f8ff, 0x9fb4c8],
  },
};

// ---------- Peças de enfeite ----------
const PREDIO_CORES = [0xffb38a, 0x8fd3c7, 0xc3b4ff, 0xffd97a, 0xff9fb2, 0x9cc9ff, 0xf2efe6];
let TEX_JANELAS = null;
function texJanelas() {
  TEX_JANELAS ??= textura(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    for (let y = 16; y < h; y += 42) for (let x = 12; x < w; x += 38) {
      ctx.fillStyle = Math.random() < 0.25 ? '#ffe9a8' : '#9cc7e8'; ctx.fillRect(x, y, 24, 28);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 2, y + 2, 7, 24);
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x - 2, y + 28, 28, 4);
    }
  }, true);
  return TEX_JANELAS;
}

function predio(lado, xBorda) {
  const larg = 4 + Math.random() * 4; const alt = 6 + Math.random() * 12; const prof = 5 + Math.random() * 3;
  const cor = sorteio(PREDIO_CORES);
  const tex = texJanelas().clone(); tex.needsUpdate = true; tex.repeat.set(Math.max(1, Math.round(prof / 2.6)), Math.max(1, Math.round(alt / 4)));
  const fachada = toon(cor, { map: tex });
  const m = new THREE.Mesh(new THREE.BoxGeometry(prof, alt, larg), [fachada, fachada, toon(cor), toon(cor), fachada, fachada]);
  m.receiveShadow = true;
  m.position.set(lado * (xBorda + 0.6 + prof / 2), alt / 2, 0);
  const telhado = new THREE.Mesh(new THREE.BoxGeometry(prof + 0.3, 0.3, larg + 0.3), toon(new THREE.Color(cor).multiplyScalar(0.8)));
  telhado.position.y = alt / 2 + 0.15; m.add(telhado);
  return { mesh: m, larg };
}

function arvoreRedonda(escala = 1, cor = 0x3fae5a) {
  const g = new THREE.Group();
  const tronco = malha(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 8), toon(0x8a5a3c)); tronco.position.y = 0.7; g.add(tronco);
  for (const [dx, dy, r] of [[0, 1.9, 0.75], [-0.35, 1.55, 0.5], [0.35, 1.6, 0.5]]) {
    const copa = malha(new THREE.IcosahedronGeometry(r, 1), toon(cor, { flatShading: true })); copa.position.set(dx, dy, 0); g.add(copa);
  }
  g.scale.setScalar(escala);
  return g;
}

function pinheiro(escala = 1, neve = false) {
  const g = new THREE.Group();
  const tronco = malha(new THREE.CylinderGeometry(0.1, 0.13, 0.8, 8), toon(0x6e4426)); tronco.position.y = 0.4; g.add(tronco);
  [[1.1, 1.3, 1.1], [0.85, 1.1, 1.8], [0.6, 0.9, 2.4]].forEach(([r, h, y]) => {
    const c = malha(new THREE.ConeGeometry(r, h, 9), toon(0x2f7d46, { flatShading: true })); c.position.y = y; g.add(c);
    if (neve) { const n = malha(new THREE.ConeGeometry(r * 0.62, h * 0.42, 9), toon(0xffffff, { flatShading: true })); n.position.y = y + h * 0.3; g.add(n); }
  });
  g.scale.setScalar(escala);
  return g;
}

function poste(lado, corLuz = 0xfff1b0) {
  const g = new THREE.Group();
  const haste = malha(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 8), toon(0x4d5466)); haste.position.y = 1.6; g.add(haste);
  const braco = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), toon(0x4d5466)); braco.position.set(-lado * 0.35, 3.15, 0); g.add(braco);
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: corLuz })); luz.position.set(-lado * 0.68, 3.05, 0); g.add(luz);
  return g;
}

export function coqueiro() {
  const g = new THREE.Group();
  const curva = 0.5 + Math.random() * 0.4;
  for (let k = 0; k < 8; k++) {
    const seg = malha(new THREE.CylinderGeometry(0.11 - k * 0.006, 0.13 - k * 0.006, 0.55, 8), toon(k % 2 ? 0x9a6b3e : 0x86592f));
    seg.position.set(Math.sin((k / 8) * curva) * k * 0.12, 0.27 + k * 0.52, 0); seg.rotation.z = -(k / 8) * curva * 0.5; g.add(seg);
  }
  const topoX = Math.sin(curva) * 8 * 0.12; const topoY = 4.3;
  for (let k = 0; k < 7; k++) {
    const folha = malha(new THREE.ConeGeometry(0.25, 1.9, 4), toon(0x3fae5a, { flatShading: true }));
    folha.scale.z = 0.2;
    folha.position.set(topoX, topoY, 0);
    folha.rotation.set(0, (k / 7) * Math.PI * 2, 1.9);
    folha.translateY(0.9);
    g.add(folha);
  }
  for (let k = 0; k < 3; k++) {
    const coco = malha(new THREE.SphereGeometry(0.12, 10, 8), toon(0x6b4a22)); coco.position.set(topoX + Math.cos(k * 2) * 0.15, topoY - 0.15, Math.sin(k * 2) * 0.15); g.add(coco);
  }
  return g;
}

function guardaSol() {
  const g = new THREE.Group();
  const haste = malha(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 6), toon(0xffffff)); haste.position.y = 1.05; g.add(haste);
  const cores = sorteio([[0xff6f91, 0xffffff], [0x3fb6a8, 0xffffff], [0xffb020, 0xffffff], [0x3e8bff, 0xffd34d]]);
  for (let k = 0; k < 8; k++) {
    const gomo = malha(new THREE.ConeGeometry(1.05, 0.45, 3, 1, true, (k / 8) * Math.PI * 2, Math.PI / 4), toon(cores[k % 2], { side: THREE.DoubleSide }));
    gomo.position.y = 2.15; g.add(gomo);
  }
  const toalha = malha(new THREE.BoxGeometry(0.8, 0.02, 1.6), toon(sorteio([0xff6f91, 0x7b6cf6, 0x3fb6a8, 0xffd34d]))); toalha.position.set(0.7, 0.02, 0); g.add(toalha);
  return g;
}

function quiosque(lado) {
  const g = new THREE.Group();
  const base = malha(new THREE.BoxGeometry(2.4, 1.3, 2.6), toon(0xf6e7c8)); base.position.y = 0.65; g.add(base);
  const balcao = malha(new THREE.BoxGeometry(0.15, 0.1, 2.6), toon(0x9a6b3e)); balcao.position.set(-lado * 1.25, 1.05, 0); g.add(balcao);
  const telhado = malha(new THREE.ConeGeometry(2.3, 1.2, 4), toon(0xff6f91, { flatShading: true })); telhado.position.y = 2.05; telhado.rotation.y = Math.PI / 4; g.add(telhado);
  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 1.6), toon(0x3fb6a8)); placa.position.set(-lado * 1.23, 1.45, 0); g.add(placa);
  return g;
}

function cabana(lado) {
  const g = new THREE.Group();
  const cor = sorteio([0xb5523b, 0x8a5a3c, 0x3f7fb6, 0x5e8a4f]);
  const corpo = malha(new THREE.BoxGeometry(3.2, 2.2, 3.4), toon(cor)); corpo.position.y = 1.1; g.add(corpo);
  const telhado = malha(new THREE.CylinderGeometry(0.01, 2.6, 1.6, 4, 1), toon(0xffffff, { flatShading: true })); telhado.position.y = 3.0; telhado.rotation.y = Math.PI / 4; telhado.scale.set(1, 1, 1.05); g.add(telhado);
  const porta = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.8), toon(0x5a3a22)); porta.position.set(-lado * 1.62, 0.6, 0); g.add(porta);
  for (const dz of [-1, 1]) {
    const janela = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd98a })); janela.position.set(-lado * 1.62, 1.3, dz * 1.05); g.add(janela);
  }
  const chamine = malha(new THREE.BoxGeometry(0.4, 1.2, 0.4), toon(0x9b9b9b)); chamine.position.set(0.6, 3.2, 0.8); g.add(chamine);
  return g;
}

function bonecoDeNeve() {
  const g = new THREE.Group();
  const neve = toon(0xffffff);
  [[0.42, 0.42], [0.3, 1.05], [0.22, 1.5]].forEach(([r, y]) => { const b = malha(new THREE.SphereGeometry(r, 14, 10), neve); b.position.y = y; g.add(b); });
  const nariz = malha(new THREE.ConeGeometry(0.05, 0.25, 8), toon(0xff8a1f)); nariz.rotation.x = -Math.PI / 2; nariz.position.set(0, 1.5, 0.3); g.add(nariz);
  const cachecol = malha(new THREE.TorusGeometry(0.22, 0.06, 8, 16), toon(0xe5484d)); cachecol.rotation.x = Math.PI / 2; cachecol.position.y = 1.28; g.add(cachecol);
  const chapeu = malha(new THREE.CylinderGeometry(0.15, 0.15, 0.25, 12), toon(0x222222)); chapeu.position.y = 1.78; g.add(chapeu);
  return g;
}

function pedra() {
  const m = malha(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0), toon(0x9aa0a6, { flatShading: true }));
  m.scale.y = 0.6; m.position.y = 0.2; m.rotation.y = Math.random() * 3;
  return m;
}

function cogumelo() {
  const g = new THREE.Group();
  const pe = malha(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8), toon(0xfff3dc)); pe.position.y = 0.15; g.add(pe);
  const chapeu = malha(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xe5484d)); chapeu.position.y = 0.28; g.add(chapeu);
  return g;
}

export function montanha(x, z, alt, cor, topoNeve) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(alt * 0.9, alt, 7), toon(cor, { flatShading: true, fog: true }));
  m.position.set(x, alt / 2 - 1, z);
  if (topoNeve) { const t = new THREE.Mesh(new THREE.ConeGeometry(alt * 0.3, alt * 0.33, 7), toon(0xffffff, { flatShading: true })); t.position.y = alt * 0.34; m.add(t); }
  return m;
}

// ---------- Monta o cenário ----------
// Devolve um grupo com tudo, a lista de enfeites que se repetem e as texturas que correm com a distância.
export function montarCenario(id) {
  const c = CHAO[id] ?? CHAO_NOVOS[id] ?? CHAO.cidade;
  const grupo = new THREE.Group();
  const itens = [];
  const rolar = [];
  const add = (mesh, z0) => { grupo.add(mesh); itens.push({ mesh, z0 }); };
  const chaoTex = (desenho, rx, ry, escala) => {
    const t = textura(256, 512, desenho, true); t.repeat.set(rx, ry); rolar.push({ t, escala }); return t;
  };

  const rua = new THREE.Mesh(new THREE.PlaneGeometry(LARG_RUA, COMP_CENA), toon(0xffffff, { map: chaoTex(c.rua, 1, COMP_CENA / 8, 8) }));
  rua.rotation.x = -Math.PI / 2; rua.position.set(0, 0, COMP_CENA / 2 + INICIO); rua.receiveShadow = true; grupo.add(rua);
  const texLado = chaoTex(c.lado, CALCADA / 1.2, COMP_CENA / 1.2, 1.2);
  for (const lado of [-1, 1]) {
    const calc = new THREE.Mesh(new THREE.BoxGeometry(CALCADA, 0.15, COMP_CENA), toon(0xffffff, { map: texLado }));
    calc.position.set(lado * (LARG_RUA / 2 + CALCADA / 2), 0.075, COMP_CENA / 2 + INICIO); calc.receiveShadow = true; grupo.add(calc);
    const meioFio = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.17, COMP_CENA), toon(c.meioFio));
    meioFio.position.set(lado * (LARG_RUA / 2 + 0.08), 0.085, COMP_CENA / 2 + INICIO); grupo.add(meioFio);
  }
  const terreno = new THREE.Mesh(new THREE.PlaneGeometry(90, COMP_CENA), toon(0xffffff, { map: chaoTex(c.terreno, 22, COMP_CENA / 4, 4) }));
  terreno.rotation.x = -Math.PI / 2; terreno.position.set(0, -0.02, COMP_CENA / 2 + INICIO); grupo.add(terreno);

  const xBorda = LARG_RUA / 2 + CALCADA;
  let atualizar = () => {};

  if (id === 'cidade') {
    for (const lado of [-1, 1]) {
      let z = INICIO;
      while (z < COMP_CENA + INICIO) { const p = predio(lado, xBorda); add(p.mesh, z + p.larg / 2); z += p.larg + 0.4; }
      for (let k = 0; k < COMP_CENA / 9; k++) { const a = arvoreRedonda(); a.position.set(lado * (LARG_RUA / 2 + CALCADA * 0.55), 0.15, 0); add(a, INICIO + k * 9 + (lado > 0 ? 4.5 : 0)); }
      for (let k = 0; k < COMP_CENA / 18; k++) { const p = poste(lado); p.position.set(lado * (LARG_RUA / 2 + 0.35), 0.15, 0); add(p, INICIO + k * 18 + 6); }
    }
  } else if (id === 'praia') {
    // mar de um lado, quiosques e casinhas do outro
    const texMar = textura(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#21a7d8'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3;
      for (let y = 10; y < h; y += 32) { ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x / 10) * 4); ctx.stroke(); }
    }, true);
    texMar.repeat.set(8, COMP_CENA / 8);
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(60, COMP_CENA), toon(0xffffff, { map: texMar }));
    mar.rotation.x = -Math.PI / 2; mar.position.set(-(xBorda + 8 + 30), 0.03, COMP_CENA / 2 + INICIO); grupo.add(mar);
    const espuma = new THREE.Mesh(new THREE.PlaneGeometry(1.2, COMP_CENA), toon(0xffffff));
    espuma.rotation.x = -Math.PI / 2; espuma.position.set(-(xBorda + 8), 0.04, COMP_CENA / 2 + INICIO); grupo.add(espuma);
    rolar.push({ t: texMar, escala: 8 });
    atualizar = (t) => { texMar.offset.x = Math.sin(t * 0.6) * 0.05; espuma.position.x = -(xBorda + 8) + Math.sin(t * 1.2) * 0.4; };
    for (const lado of [-1, 1]) {
      for (let k = 0; k < COMP_CENA / 7; k++) { const p = coqueiro(); p.position.set(lado * (LARG_RUA / 2 + CALCADA * 0.6), 0.15, 0); p.rotation.y = lado > 0 ? Math.PI : 0; add(p, INICIO + k * 7 + (lado > 0 ? 3.5 : 0)); }
    }
    for (let k = 0; k < COMP_CENA / 6; k++) { const g = guardaSol(); g.position.set(-(xBorda + 2 + Math.random() * 4), 0, 0); add(g, INICIO + k * 6 + Math.random() * 2); }
    let z = INICIO;
    while (z < COMP_CENA + INICIO) {
      if (Math.random() < 0.45) { const q = quiosque(1); q.position.set(xBorda + 2.2, 0, 0); add(q, z + 1.5); z += 4; }
      else { const p = predio(1, xBorda + 2); p.mesh.scale.y = 0.45; p.mesh.position.y *= 0.45; add(p.mesh, z + p.larg / 2); z += p.larg + 1; }
    }
  } else if (id === 'floresta') {
    for (const lado of [-1, 1]) {
      for (let k = 0; k < COMP_CENA / 3.2; k++) {
        const a = Math.random() < 0.55 ? pinheiro(0.9 + Math.random() * 0.8) : arvoreRedonda(0.9 + Math.random() * 0.6, sorteio([0x3fae5a, 0x2f9a4a, 0x5ab84a]));
        a.position.set(lado * (xBorda - 0.6 + Math.random() * 6), 0, 0); a.rotation.y = Math.random() * 6;
        add(a, INICIO + k * 3.2 + Math.random() * 2);
      }
      for (let k = 0; k < COMP_CENA / 11; k++) { const p = pedra(); p.position.x = lado * (LARG_RUA / 2 + 0.9 + Math.random() * 1); add(p, INICIO + k * 11 + 5); }
      for (let k = 0; k < COMP_CENA / 13; k++) { const m = cogumelo(); m.position.x = lado * (LARG_RUA / 2 + 0.6); add(m, INICIO + k * 13 + 2); }
    }
    for (const lado of [-1, 1]) for (let k = 0; k < 5; k++) grupo.add(montanha(lado * (32 + k * 6), 60 + k * 18, 22 + Math.random() * 14, sorteio([0x5c8a6a, 0x6a9a78, 0x4e7d5d]), false));
  } else if (NOVOS.has(id)) {
    atualizar = enfeitarNovo(id, { grupo, add, rolar, xBorda });
  } else {
    // vila da neve
    for (const lado of [-1, 1]) {
      let z = INICIO;
      while (z < COMP_CENA + INICIO) { const c2 = cabana(lado); c2.position.set(lado * (xBorda + 2.6), 0, 0); add(c2, z + 1.7); z += 5 + Math.random() * 3; }
      for (let k = 0; k < COMP_CENA / 5; k++) { const p = pinheiro(0.8 + Math.random() * 0.5, true); p.position.set(lado * (xBorda - 0.7), 0, 0); add(p, INICIO + k * 5 + (lado > 0 ? 2.5 : 0)); }
      for (let k = 0; k < COMP_CENA / 20; k++) { const p = poste(lado, 0xffd98a); p.position.set(lado * (LARG_RUA / 2 + 0.35), 0.15, 0); add(p, INICIO + k * 20 + 10); }
      for (let k = 0; k < COMP_CENA / 26; k++) { const b = bonecoDeNeve(); b.position.set(lado * (LARG_RUA / 2 + 1.2), 0.15, 0); b.rotation.y = lado > 0 ? -1.2 : 1.2; add(b, INICIO + k * 26 + 13); }
    }
    for (const lado of [-1, 1]) for (let k = 0; k < 5; k++) grupo.add(montanha(lado * (30 + k * 7), 60 + k * 18, 24 + Math.random() * 16, sorteio([0x8aa4bf, 0x9db4cc]), true));
    // flocos de neve caindo em volta da câmera
    const n = 500;
    const pos = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { pos[k * 3] = (Math.random() - 0.5) * 20; pos[k * 3 + 1] = Math.random() * 10; pos[k * 3 + 2] = Math.random() * 30 - 4; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const flocos = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.9 }));
    grupo.add(flocos);
    atualizar = (t, dt, vel) => {
      const p = geo.attributes.position;
      for (let k = 0; k < n; k++) {
        let y = p.getY(k) - dt * (1.2 + (k % 5) * 0.2);
        let z = p.getZ(k) - dt * vel * 0.9;
        if (y < 0) y += 10;
        if (z < -4) z += 30;
        p.setXYZ(k, p.getX(k) + Math.sin(t + k) * dt * 0.3, y, z);
      }
      p.needsUpdate = true;
    };
  }
  return { grupo, itens, rolar, atualizar, ceu: c.ceu, neblina: c.neblina, hemi: c.hemi };
}

// ---------- Obstáculos de cada cenário ----------
const PANO = {};
export function texPano(chave, desenho, w = 256, h = 64) { PANO[chave] ??= textura(w, h, desenho); return PANO[chave]; }

export function veiculo({ corCabine, corTeto, texto, emoji, corTexto, topo, comp }) {
  const g = new THREE.Group();
  const lados = toon(0xffffff, { map: texPano(`lado-${texto}`, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf2'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 16; k++) { ctx.fillStyle = k % 2 ? corTexto : '#fffaf2'; ctx.fillRect(k * 32, 0, 32, 26); }
    ctx.fillStyle = corTexto; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(texto, w / 2 - 40, h / 2 + 16); ctx.font = '54px sans-serif'; ctx.fillText(emoji, w - 70, h / 2 + 14);
  }, 512, 128) });
  const branco = toon(0xfffaf2);
  const frente = toon(0xffffff, { map: texPano(`frente-${corCabine}`, (ctx, w, h) => {
    ctx.fillStyle = `#${corCabine.toString(16).padStart(6, '0')}`; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7fc6ff'; ctx.fillRect(12, 14, w - 24, 50); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(18, 18, 18, 42);
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(26, 96, 11, 0, 7); ctx.arc(w - 26, 96, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#9aa0ad'; ctx.fillRect(40, 88, w - 80, 16);
  }, 128, 128) });
  const bau = malha(new THREE.BoxGeometry(LARG_OBST, 1.05, comp - 0.9), [lados, lados, toon(corTeto), branco, branco, branco]);
  bau.position.set(0, 0.72, comp / 2 + 0.45); g.add(bau);
  const cab = toon(corCabine);
  const cabine = malha(new THREE.BoxGeometry(LARG_OBST, 0.85, 0.9), [cab, cab, cab, cab, cab, frente]); cabine.position.set(0, 0.62, 0.45); g.add(cabine);
  const toldo = malha(new THREE.BoxGeometry(LARG_OBST + 0.1, 0.08, comp - 0.8), toon(corTeto)); toldo.position.set(0, 1.28, comp / 2 + 0.45); g.add(toldo);
  topo(g, comp);
  for (const dz of [0.5, comp - 0.6]) for (const lado of [-1, 1]) {
    const roda = malha(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), toon(0x2b2e38)); roda.rotation.z = Math.PI / 2; roda.position.set(lado * (LARG_OBST / 2 - 0.02), 0.2, dz); g.add(roda);
  }
  return g;
}

export function bandeirinhas(g, larg, cores, alturas = [[1.62, 0], [1.3, 1]]) {
  for (const [altura, desloc] of alturas) {
    for (let k = 0; k < 7; k++) {
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 3), toon(cores[(k + desloc) % cores.length], { side: THREE.DoubleSide }));
      b.position.set(-larg / 2 + ((k + 0.5) * larg) / 7, altura - 0.1 - Math.sin(((k + 0.5) / 7) * Math.PI) * 0.1, 0);
      b.rotation.x = Math.PI; b.scale.z = 0.25; g.add(b);
    }
  }
}

export function criarObstaculo(o, tema) {
  const g = new THREE.Group();
  if (NOVOS.has(tema)) return obstaculoNovo(o, tema, g);
  const L = LARG_OBST;
  if (o.tipo === 'cerca') {
    if (tema === 'floresta') {
      const tronco = malha(new THREE.CylinderGeometry(0.27, 0.29, L + 0.2, 14), toon(0x7a4f2c)); tronco.rotation.z = Math.PI / 2; tronco.position.y = 0.29; g.add(tronco);
      for (const lado of [-1, 1]) { const anel = malha(new THREE.CircleGeometry(0.27, 14), toon(0xd9a86a)); anel.position.set(lado * (L / 2 + 0.101), 0.29, 0); anel.rotation.y = lado * Math.PI / 2; g.add(anel); }
      const musgo = malha(new THREE.SphereGeometry(0.16, 8, 6), toon(0x4f9a45)); musgo.position.set(0.2, 0.52, 0); musgo.scale.y = 0.5; g.add(musgo);
    } else if (tema === 'neve') {
      // barreira de esqui: tábuas vermelhas e brancas em postes escuros, com um montinho de neve em cima.
      // Vermelho forte contra o chão branco: dá para ver de longe (o muro de neve branco sumia na pista).
      const listras = texPano('barreira-neve', (ctx, w, h) => { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#d8262f'; ctx.beginPath(); ctx.moveTo(k * 16 - 8, h); ctx.lineTo(k * 16 + 8, 0); ctx.lineTo(k * 16 + 24, 0); ctx.lineTo(k * 16 + 8, h); ctx.fill(); } }, 128, 32);
      const vermelho = toon(0xd8262f); const face = toon(0xffffff, { map: listras });
      for (const lado of [-1, 1]) {
        const poste = malha(new THREE.BoxGeometry(0.1, 0.66, 0.1), toon(0x3b2a22)); poste.position.set(lado * (L / 2 - 0.06), 0.33, 0); g.add(poste);
        const capa = malha(new THREE.SphereGeometry(0.09, 10, 8), toon(0xffffff)); capa.scale.y = 0.6; capa.position.set(lado * (L / 2 - 0.06), 0.68, 0); g.add(capa);
      }
      for (const y of [0.5, 0.24]) { const tabua = malha(new THREE.BoxGeometry(L, 0.17, 0.08), [vermelho, vermelho, vermelho, vermelho, face, face]); tabua.position.y = y; g.add(tabua); }
      const neveTopo = malha(new THREE.CapsuleGeometry(0.06, L - 0.3, 4, 10), toon(0xffffff)); neveTopo.rotation.z = Math.PI / 2; neveTopo.scale.set(1, 1, 1.3); neveTopo.position.y = 0.62; g.add(neveTopo);
      // bandeirinha laranja no meio, como nas pistas de esqui
      const haste = malha(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), toon(0x3b2a22)); haste.position.set(0, 0.8, 0); g.add(haste);
      const flamula = malha(new THREE.ConeGeometry(0.1, 0.26, 3), toon(0xff8a1f)); flamula.rotation.z = -Math.PI / 2; flamula.scale.z = 0.2; flamula.position.set(0.13, 0.92, 0); g.add(flamula);
    } else if (tema === 'praia') {
      for (const lado of [-1, 1]) { const p = malha(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), toon(0xd8b26a)); p.position.set(lado * (L / 2 - 0.05), 0.3, 0); g.add(p); }
      for (const y of [0.18, 0.32, 0.46]) { const b = malha(new THREE.CylinderGeometry(0.035, 0.035, L, 8), toon(0xc9a45a)); b.rotation.z = Math.PI / 2; b.position.y = y; g.add(b); }
      const boia = malha(new THREE.TorusGeometry(0.16, 0.06, 8, 16), toon(0xff5a5a)); boia.position.set(0, 0.35, -0.06); g.add(boia);
    } else {
      for (const lado of [-1, 1]) { const p = malha(new THREE.BoxGeometry(0.08, 0.6, 0.08), toon(0xffffff)); p.position.set(lado * (L / 2 - 0.05), 0.3, 0); g.add(p); }
      const listras = texPano('listras', (ctx, w, h) => { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#e5484d'; ctx.fillRect(k * 16, 0, 16, h); } }, 128, 32);
      for (const y of [0.42, 0.2]) {
        const b = toon(0xffffff); const l = toon(0xffffff, { map: listras });
        const tabua = malha(new THREE.BoxGeometry(L, 0.14, 0.06), [b, b, b, b, l, l]); tabua.position.y = y; g.add(tabua);
      }
    }
  } else if (o.tipo === 'faixa') {
    if (tema === 'floresta') {
      for (const lado of [-1, 1]) { const t = malha(new THREE.CylinderGeometry(0.12, 0.16, 2.2, 8), toon(0x7a4f2c)); t.position.set(lado * (L / 2), 1.1, 0); g.add(t); }
      const galho = malha(new THREE.CylinderGeometry(0.13, 0.13, L + 0.3, 10), toon(0x6e4426)); galho.rotation.z = Math.PI / 2; galho.position.y = 1.9; g.add(galho);
      for (let k = 0; k < 7; k++) {
        const x = -L / 2 + 0.1 + k * (L - 0.2) / 6; const comp = 0.35 + (k % 3) * 0.12;
        const cipo = malha(new THREE.CylinderGeometry(0.015, 0.015, comp, 5), toon(0x3f8a3a)); cipo.position.set(x, 1.9 - comp / 2, 0); g.add(cipo);
        const folha = malha(new THREE.SphereGeometry(0.07, 6, 5), toon(0x4fb04a)); folha.scale.set(1, 0.5, 1); folha.position.set(x, 1.9 - comp, 0); g.add(folha);
      }
      for (let k = 0; k < 5; k++) { const f = malha(new THREE.IcosahedronGeometry(0.25, 0), toon(0x3fae5a, { flatShading: true })); f.position.set(-L / 2 + k * L / 4, 2.05, 0); g.add(f); }
    } else if (tema === 'neve') {
      for (const lado of [-1, 1]) {
        const bengala = malha(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 10), toon(0xffffff, { map: texPano('bengala', (ctx, w, h) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#e5484d'; for (let y = -64; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 32); ctx.lineTo(w, y + 44); ctx.lineTo(0, y + 12); ctx.fill(); } }, 32, 128) }));
        bengala.position.set(lado * (L / 2), 1.05, 0); g.add(bengala);
      }
      const arco = malha(new THREE.TorusGeometry(L / 2, 0.06, 8, 24, Math.PI), toon(0x2f7d46)); arco.position.y = 1.75; g.add(arco);
      const cores = [0xff5a5a, 0xffd34d, 0x5ae6ff, 0x7b6cf6];
      for (let k = 0; k < 9; k++) {
        const a = (k / 8) * Math.PI; const x = Math.cos(a) * L / 2; const y = 1.75 + Math.sin(a) * L / 2;
        const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), toon(0x2f7d46)); fio.position.set(x, y - 0.15, 0); g.add(fio);
        const luz = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: cores[k % cores.length] })); luz.position.set(x, y - 0.32, 0); g.add(luz);
      }
      bandeirinhas(g, L, [0xff5a5a, 0xffffff, 0x2f7d46], [[1.4, 0]]);
    } else if (tema === 'praia') {
      for (const lado of [-1, 1]) { const p = malha(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 8), toon(0xffffff)); p.position.set(lado * (L / 2), 1.05, 0); g.add(p); }
      const toldo = toon(0xffffff, { map: texPano('toldo', (ctx, w, h) => { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#3fb6a8'; ctx.fillRect(k * 32, 0, 32, h); } }) });
      const pano = malha(new THREE.BoxGeometry(L + 0.2, 0.06, 0.7), toldo); pano.position.y = 2.0; pano.rotation.x = 0.25; g.add(pano);
      for (let k = 0; k < 8; k++) { const aba = malha(new THREE.ConeGeometry(0.1, 0.22, 3), toon(k % 2 ? 0xffffff : 0x3fb6a8)); aba.rotation.x = Math.PI; aba.scale.z = 0.25; aba.position.set(-L / 2 + (k + 0.5) * L / 8, 1.82, -0.25); g.add(aba); }
      bandeirinhas(g, L, [0xffd34d, 0xff6f91, 0x3e8bff], [[1.45, 0]]);
    } else {
      for (const lado of [-1, 1]) { const p = malha(new THREE.CylinderGeometry(0.045, 0.05, 2.1, 10), toon(0x6b5f8a)); p.position.set(lado * (L / 2), 1.05, 0); g.add(p); }
      const banner = texPano('banner', (ctx, w, h) => {
        const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8b7dff'); gr.addColorStop(1, '#5b4bd6'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★  ★  ★', w / 2, h / 2 + 2);
      });
      const r = toon(0x5b4bd6); const b = toon(0xffffff, { map: banner });
      const placa = malha(new THREE.BoxGeometry(L, 0.32, 0.06), [r, r, r, r, b, b]); placa.position.y = 1.86; g.add(placa);
      bandeirinhas(g, L, [0xffd21f, 0xff6f91, 0x3fb6a8]);
    }
  } else if (o.tipo === 'carrinho') {
    const comp = o.comp ?? 5;
    if (tema === 'floresta') {
      // carroça de feno
      const madeira = toon(0x9a6b3e);
      const caixa = malha(new THREE.BoxGeometry(L, 0.55, comp - 0.4), madeira); caixa.position.set(0, 0.62, comp / 2); g.add(caixa);
      for (let k = 0; k < 3; k++) { const ripa = new THREE.Mesh(new THREE.BoxGeometry(L + 0.02, 0.05, comp - 0.4), toon(0x7a4f2c)); ripa.position.set(0, 0.42 + k * 0.18, comp / 2); g.add(ripa); }
      for (let k = 0; k < 3; k++) {
        const fardo = malha(new THREE.CylinderGeometry(0.35, 0.35, L * 0.9, 14), toon(0xe7c56a)); fardo.rotation.z = Math.PI / 2; fardo.position.set(0, 1.1 - (k === 1 ? 0 : 0.05), 0.9 + k * 1.5); g.add(fardo);
      }
      for (const dz of [0.6, comp - 0.6]) for (const lado of [-1, 1]) {
        const roda = malha(new THREE.TorusGeometry(0.3, 0.05, 6, 16), toon(0x5a3a22)); roda.rotation.y = Math.PI / 2; roda.position.set(lado * (L / 2 + 0.05), 0.32, dz); g.add(roda);
        const raio = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.58, 0.04), toon(0x5a3a22)); raio.position.copy(roda.position); g.add(raio);
      }
      const frente = malha(new THREE.BoxGeometry(L, 0.3, 0.08), madeira); frente.position.set(0, 0.92, 0.2); g.add(frente);
    } else if (tema === 'neve') {
      // trenó de presentes
      const vermelho = toon(0xc8352a);
      const corpo = malha(new THREE.BoxGeometry(L, 0.6, comp - 0.6), vermelho); corpo.position.set(0, 0.62, comp / 2 + 0.2); g.add(corpo);
      const frente = malha(new THREE.CylinderGeometry(0.35, 0.35, L, 16, 1, false, 0, Math.PI), vermelho); frente.rotation.z = Math.PI / 2; frente.position.set(0, 0.62, 0.5); g.add(frente);
      const friso = new THREE.Mesh(new THREE.BoxGeometry(L + 0.02, 0.06, comp - 0.6), toon(0xffd34d)); friso.position.set(0, 0.85, comp / 2 + 0.2); g.add(friso);
      for (const lado of [-1, 1]) { const esqui = malha(new THREE.BoxGeometry(0.06, 0.06, comp), toon(0xffd34d)); esqui.position.set(lado * (L / 2 - 0.1), 0.05, comp / 2); g.add(esqui); }
      const cores = [0x3e8bff, 0x35c46a, 0xff6f91, 0xffb020, 0x7b6cf6];
      for (let k = 0; k < 6; k++) {
        const s = 0.35 + (k % 3) * 0.08;
        const p = malha(new THREE.BoxGeometry(s, s, s), toon(cores[k % cores.length])); p.position.set((k % 2 ? 0.2 : -0.2), 0.92 + s / 2 + (k > 3 ? 0.3 : 0), 1 + (k % 3) * 1.1); p.rotation.y = k; g.add(p);
        const fita = new THREE.Mesh(new THREE.BoxGeometry(s + 0.01, s + 0.01, 0.06), toon(0xffffff)); fita.position.copy(p.position); fita.rotation.y = k; g.add(fita);
      }
    } else if (tema === 'praia') {
      g.add(veiculo({ corCabine: 0x35c46a, corTeto: 0x2a9d55, texto: 'ÁGUA DE COCO', emoji: '🥥', corTexto: '#2a9d55', comp, topo: (v, c) => {
        for (let k = 0; k < 3; k++) { const coco = malha(new THREE.SphereGeometry(0.22, 12, 10), toon(0x4f8a2c)); coco.position.set((k - 1) * 0.35, 1.5, c / 2 + 0.5); v.add(coco); }
        const canudo = malha(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), toon(0xff6f91)); canudo.position.set(0, 1.75, c / 2 + 0.5); canudo.rotation.z = 0.3; v.add(canudo);
      } }));
    } else {
      g.add(veiculo({ corCabine: 0xfffaf2, corTeto: 0xff6f91, texto: 'SORVETES', emoji: '🍦', corTexto: '#ff4f81', comp, topo: (v, c) => {
        const casquinha = malha(new THREE.ConeGeometry(0.16, 0.36, 12), toon(0xe9b36a)); casquinha.rotation.x = Math.PI; casquinha.position.set(0, 1.55, c / 2 + 0.5); v.add(casquinha);
        const bola = malha(new THREE.SphereGeometry(0.2, 16, 12), toon(0xff8fb1)); bola.position.set(0, 1.78, c / 2 + 0.5); v.add(bola);
      } }));
    }
  }
  return g;
}
