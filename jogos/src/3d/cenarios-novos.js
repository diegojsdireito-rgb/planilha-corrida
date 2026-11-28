// Os quatro cenários novos da corrida: Terra dos Doces, Parque de Diversões, Deserto do Oásis e
// Passeio na Lua. Cada um tem chão, céu, enfeites dos lados e a sua versão dos três obstáculos parados
// (o de pular, o de deslizar por baixo e o comprido, de trocar de faixa). Os obstáculos usam cores
// fortes contra o chão de cada cenário, para dar para ver de longe.
import { THREE, FAIXA, LARG_RUA, CALCADA, COMP_CENA, INICIO, textura, ruido, toon, sombrear, texBrilho } from './base.js';
import { veiculo, bandeirinhas, texPano, coqueiro, montanha } from './cenarios.js';

const LARG_OBST = FAIXA * 0.86;
const malha = (geo, mat) => sombrear(new THREE.Mesh(geo, mat));
const sorteio = (lista) => lista[Math.floor(Math.random() * lista.length)];
const luz = (cor) => new THREE.MeshBasicMaterial({ color: cor });

// Peça cilíndrica entre dois pontos (hastes, cabos, trilhos).
function haste(a, b, r, mat, seg = 8) {
  const v = new THREE.Vector3().subVectors(b, a);
  const m = malha(new THREE.CylinderGeometry(r, r, v.length(), seg), mat);
  m.position.copy(a).addScaledVector(v, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- Chão e céu ----------
function crateras(ctx, w, h, n, fundo, borda, luzBorda) {
  for (let k = 0; k < n; k++) {
    const x = Math.random() * w; const y = Math.random() * h; const r = 6 + Math.random() * 22;
    ctx.fillStyle = fundo; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = borda; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = luzBorda; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0.2, 2.6); ctx.stroke();
  }
}

export const CHAO_NOVOS = {
  doces: {
    rua: (ctx, w, h) => {
      // barra de chocolate em tabletes, com glacê branco marcando as faixas
      ctx.fillStyle = '#4f2913'; ctx.fillRect(0, 0, w, h);
      const cw = w / 6; const rh = h / 12;
      for (let r = 0; r < 12; r++) for (let c = 0; c < 6; c++) {
        const x = c * cw + 4; const y = r * rh + 4; const ww = cw - 8; const hh = rh - 8;
        ctx.fillStyle = '#7a4424'; ctx.fillRect(x, y, ww, hh);
        ctx.fillStyle = '#9a5c34'; ctx.fillRect(x, y, ww, 5); ctx.fillRect(x, y, 5, hh);
        ctx.fillStyle = '#5a2f16'; ctx.fillRect(x, y + hh - 5, ww, 5); ctx.fillRect(x + ww - 5, y, 5, hh);
      }
      ruido(ctx, w, h, 900, 'rgba(255,220,200,.05)');
      ctx.fillStyle = '#fff4fa';
      for (const fx of [1 / 3, 2 / 3]) for (let y = 0; y < h; y += 128) { ctx.beginPath(); ctx.roundRect(w * fx - 5, y + 18, 10, 84, 5); ctx.fill(); }
      ctx.fillStyle = '#ff7fb5'; ctx.fillRect(0, 0, 9, h); ctx.fillRect(w - 9, 0, 9, h);
    },
    lado: (ctx, w, h) => {
      // biscoito com furinhos
      ctx.fillStyle = '#e3a95c'; ctx.fillRect(0, 0, w, h);
      ruido(ctx, w, h, 600, 'rgba(150,80,20,.18)');
      ctx.fillStyle = '#b97a35';
      for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#c98a45'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
    },
    terreno: (ctx, w, h) => {
      // glacê de morango com granulado colorido
      ctx.fillStyle = '#ffbfdc'; ctx.fillRect(0, 0, w, h);
      for (const c of ['#ff5a8a', '#ffd34d', '#5ac8ff', '#7cdc6a', '#ffffff', '#b98aff']) ruido(ctx, w, h, 60, c, 3);
    },
    meioFio: 0xff5fa2,
    ceu: ['#ff8fcf', '#ffc6ec', '#fff2fb'], neblina: 0xffdcf1, hemi: [0xfff4fb, 0xc77a9c],
  },
  parque: {
    rua: (ctx, w, h) => {
      // calçamento de lajotas claras, com faixas azuis e bordas vermelhas
      ctx.fillStyle = '#e3d6be'; ctx.fillRect(0, 0, w, h);
      for (let y = 0, k = 0; y < h; y += 32, k++) {
        for (let x = (k % 2) * -32; x < w; x += 64) {
          ctx.fillStyle = Math.random() < 0.08 ? sorteio(['#f6c0cf', '#c3dcf6', '#f7e09a']) : (Math.random() < 0.5 ? '#e8dcc6' : '#ddcfb5');
          ctx.fillRect(x + 2, y + 2, 60, 28);
        }
      }
      ruido(ctx, w, h, 900, 'rgba(0,0,0,.05)');
      ctx.fillStyle = '#2e8fe6';
      for (const fx of [1 / 3, 2 / 3]) for (let y = 0; y < h; y += 128) { ctx.beginPath(); ctx.roundRect(w * fx - 4, y + 22, 8, 70, 4); ctx.fill(); }
      ctx.fillStyle = '#e5484d'; ctx.fillRect(3, 0, 8, h); ctx.fillRect(w - 11, 0, 8, h);
    },
    lado: (ctx, w, h) => {
      // amarelinha: quadrados coloridos
      for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) {
        ctx.fillStyle = ((x + y) / 64) % 2 ? '#ffd36b' : '#ffa8bd'; ctx.fillRect(x, y, 64, 64);
      }
      ruido(ctx, w, h, 300, 'rgba(255,255,255,.3)');
    },
    terreno: (ctx, w, h) => {
      ctx.fillStyle = '#79cc6b'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 1000, 'rgba(30,100,40,.25)', 3);
      for (const c of ['#ffffff', '#ffd34d', '#ff8fb1']) ruido(ctx, w, h, 25, c, 4);
    },
    meioFio: 0x3e8bff,
    ceu: ['#6f6cf0', '#c6a4f6', '#ffd9b4'], neblina: 0xf3d8ea, hemi: [0xfff2f8, 0x8a7aa8],
  },
  deserto: {
    rua: (ctx, w, h) => {
      // areia batida com marcas do vento e pedrinhas marcando as faixas
      ctx.fillStyle = '#e2b36c'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(170,110,45,.35)'; ctx.lineWidth = 3;
      for (let y = 8; y < h; y += 22) { ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x / 18 + y) * 4); ctx.stroke(); }
      ruido(ctx, w, h, 1500, 'rgba(120,70,20,.15)', 3);
      for (const fx of [1 / 3, 2 / 3]) for (let y = 0; y < h; y += 48) {
        ctx.fillStyle = '#8a5a2b'; ctx.beginPath(); ctx.ellipse(w * fx, y + 22, 5, 8, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#c99a62'; ctx.beginPath(); ctx.ellipse(w * fx - 1.5, y + 19, 2, 3, 0, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(140,85,35,.55)'; ctx.fillRect(0, 0, 8, h); ctx.fillRect(w - 8, 0, 8, h);
    },
    lado: (ctx, w, h) => { ctx.fillStyle = '#d29b55'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 700, 'rgba(110,60,20,.22)', 3); ruido(ctx, w, h, 200, 'rgba(255,235,200,.5)', 3); },
    terreno: (ctx, w, h) => {
      ctx.fillStyle = '#efc57f'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(190,130,60,.3)'; ctx.lineWidth = 3;
      for (let y = 6; y < h; y += 18) { ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x / 14) * 3); ctx.stroke(); }
    },
    meioFio: 0xa8743c,
    ceu: ['#ff6f61', '#ffac66', '#ffe7ad'], neblina: 0xffd8a4, hemi: [0xffefd6, 0xc98d56],
  },
  lua: {
    rua: (ctx, w, h) => {
      // chão de poeira cinza cheio de crateras, com faixas de luz azul
      ctx.fillStyle = '#a3a8b2'; ctx.fillRect(0, 0, w, h);
      ruido(ctx, w, h, 2500, 'rgba(0,0,0,.07)'); ruido(ctx, w, h, 1200, 'rgba(255,255,255,.08)');
      crateras(ctx, w, h, 16, '#8f949f', '#7c818c', '#c8ccd4');
      ctx.fillStyle = '#5ae6ff';
      for (const fx of [1 / 3, 2 / 3]) for (let y = 0; y < h; y += 96) { ctx.beginPath(); ctx.roundRect(w * fx - 4, y + 16, 8, 56, 4); ctx.fill(); }
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(3, 0, 7, h); ctx.fillRect(w - 10, 0, 7, h);
    },
    lado: (ctx, w, h) => {
      // passarela de placas de metal da base lunar
      ctx.fillStyle = '#8a92a2'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#6b7282'; ctx.lineWidth = 3;
      for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
      ctx.fillStyle = '#c3c8d2';
      for (let y = 8; y < h; y += 64) for (const x of [8, w / 2 - 8, w / 2 + 8, w - 8]) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + 48, 3, 0, 7); ctx.fill(); }
    },
    terreno: (ctx, w, h) => {
      ctx.fillStyle = '#8f949e'; ctx.fillRect(0, 0, w, h);
      ruido(ctx, w, h, 1500, 'rgba(0,0,0,.08)', 3);
      crateras(ctx, w, h, 10, '#80858f', '#6f747e', '#b3b7c0');
    },
    meioFio: 0x5ae6ff,
    ceu: ['#04050d', '#0d1331', '#1f2a58'], neblina: 0x1b2347, hemi: [0xe4ecff, 0x4a5068],
  },
};

// ---------- Terra dos Doces ----------
const TEXS = {};
const texCache = (chave, w, h, fazer, repetir) => (TEXS[chave] ??= textura(w, h, fazer, repetir));

function texEspiral(c1, c2) {
  return texCache(`espiral-${c1}-${c2}`, 128, 128, (ctx) => {
    ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(64, 64, 64, 0, 7); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath();
    for (let a = 0; a < Math.PI * 7; a += 0.1) { const r = a * 2.8; ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(44, 40, 16, 9, -0.6, 0, 7); ctx.fill();
  });
}
const texBengala = () => texCache('bengala-doce', 32, 128, (ctx, w, h) => {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#e8304a';
  for (let y = -64; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 32); ctx.lineTo(w, y + 44); ctx.lineTo(0, y + 12); ctx.fill(); }
}, true);

function pirulito() {
  const g = new THREE.Group();
  const alt = 1.7 + Math.random() * 1.2;
  const palito = malha(new THREE.CylinderGeometry(0.05, 0.05, alt, 8), toon(0xfffaf2)); palito.position.y = alt / 2; g.add(palito);
  const [c1, c2] = sorteio([['#ff4f8b', '#ffffff'], ['#ffb020', '#fff4c2'], ['#7b6cf6', '#ffffff'], ['#35c46a', '#e9ffd8'], ['#2fb5ff', '#ffffff']]);
  if (Math.random() < 0.7) {
    const r = 0.55 + Math.random() * 0.3;
    const face = toon(0xffffff, { map: texEspiral(c1, c2) });
    const disco = malha(new THREE.CylinderGeometry(r, r, 0.16, 28), [toon(new THREE.Color(c1)), face, face]);
    disco.rotation.x = Math.PI / 2; disco.position.y = alt + r * 0.85; g.add(disco);
    const laco = malha(new THREE.TorusGeometry(0.1, 0.04, 6, 12), toon(new THREE.Color(c1))); laco.position.y = alt - 0.05; laco.rotation.x = Math.PI / 2; g.add(laco);
  } else {
    const listras = texCache(`bala-${c1}`, 128, 64, (ctx, w, h) => { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? c2 : c1; ctx.fillRect(k * 16, 0, 16, h); } });
    const bola = malha(new THREE.SphereGeometry(0.5, 20, 14), toon(0xffffff, { map: listras })); bola.position.y = alt + 0.45; bola.rotation.z = 0.5; g.add(bola);
  }
  return g;
}

function bengalaPoste(lado) {
  const g = new THREE.Group();
  const m = toon(0xffffff, { map: texBengala() });
  const corpo = malha(new THREE.CylinderGeometry(0.09, 0.09, 2.8, 10), m); corpo.position.y = 1.4; g.add(corpo);
  const gancho = malha(new THREE.TorusGeometry(0.3, 0.09, 8, 16, Math.PI), m); gancho.position.set(-lado * 0.3, 2.8, 0); g.add(gancho);
  const bala = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), luz(0xfff1b0)); bala.position.set(-lado * 0.6, 2.6, 0); g.add(bala);
  return g;
}

function goma(cor, r = 0.35) {
  const g = new THREE.Group();
  const corpo = malha(new THREE.SphereGeometry(r, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), toon(cor, { emissive: cor, emissiveIntensity: 0.15 }));
  corpo.scale.y = 1.25; g.add(corpo);
  for (let k = 0; k < 6; k++) { const a = k * 1.1; const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), luz(0xffffff)); p.position.set(Math.cos(a) * r * 0.7, r * 0.75 + (k % 2) * 0.06, Math.sin(a) * r * 0.7); g.add(p); }
  return g;
}

function cupcake() {
  const g = new THREE.Group();
  const forminha = malha(new THREE.CylinderGeometry(0.42, 0.32, 0.45, 14), toon(sorteio([0x3fb6ff, 0xffb020, 0x7b6cf6, 0x35c46a]))); forminha.position.y = 0.22; g.add(forminha);
  const cobertura = malha(new THREE.SphereGeometry(0.46, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(sorteio([0xff8fc8, 0xfff0e0, 0x8a5a3c]))); cobertura.position.y = 0.45; cobertura.scale.y = 0.9; g.add(cobertura);
  const cereja = malha(new THREE.SphereGeometry(0.1, 10, 8), toon(0xe5233a)); cereja.position.y = 0.9; g.add(cereja);
  g.scale.setScalar(1.3);
  return g;
}

let TEX_PAO = null;
function casaPaoDeMel(lado) {
  const g = new THREE.Group();
  TEX_PAO ??= textura(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b06a32'; ctx.fillRect(0, 0, w, h); ruido(ctx, w, h, 500, 'rgba(80,40,10,.2)', 3);
    ctx.strokeStyle = '#fff6f0'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, 14 + Math.sin(x / 9) * 6); ctx.stroke();
    // porta de chocolate e janelas com glacê
    ctx.fillStyle = '#5a2f16'; ctx.beginPath(); ctx.roundRect(100, 140, 56, 116, [28, 28, 0, 0]); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(144, 200, 5, 0, 7); ctx.fill();
    for (const x of [44, 212]) {
      ctx.fillStyle = '#ffe08a'; ctx.fillRect(x - 24, 80, 48, 48);
      ctx.strokeStyle = '#fff6f0'; ctx.lineWidth = 6; ctx.strokeRect(x - 24, 80, 48, 48); ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, 128); ctx.moveTo(x - 24, 104); ctx.lineTo(x + 24, 104); ctx.stroke();
    }
    for (const [x, c] of [[30, '#ff4f8b'], [80, '#35c46a'], [176, '#3fb6ff'], [226, '#ffb020']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, 236, 9, 0, 7); ctx.fill(); }
  });
  const frente = toon(0xffffff, { map: TEX_PAO }); const parede = toon(0xb06a32);
  const faces = lado > 0 ? [parede, frente, parede, parede, parede, parede] : [frente, parede, parede, parede, parede, parede];
  const corpo = malha(new THREE.BoxGeometry(3.2, 2.4, 3.2), faces); corpo.position.y = 1.2; g.add(corpo);
  const telhado = malha(new THREE.CylinderGeometry(0.01, 2.6, 1.7, 4, 1), toon(0x8a4f22, { flatShading: true })); telhado.position.y = 3.25; telhado.rotation.y = Math.PI / 4; g.add(telhado);
  const neve = malha(new THREE.CylinderGeometry(2.62, 2.7, 0.18, 4, 1), toon(0xfff6f0)); neve.position.y = 2.45; neve.rotation.y = Math.PI / 4; g.add(neve);
  for (let k = 0; k < 4; k++) { const b = goma(sorteio([0xff4f8b, 0x35c46a, 0xffb020, 0x3fb6ff, 0x7b6cf6]), 0.18); b.position.set((k - 1.5) * 0.4, 3.9 - Math.abs(k - 1.5) * 0.35, 0); g.add(b); }
  return g;
}

function nuvemDeAlgodao() {
  const g = new THREE.Group();
  const cor = sorteio([0xffc2e2, 0xe2ccff, 0xc4e8ff, 0xfff0f8]);
  const m = toon(cor, { fog: false, emissive: cor, emissiveIntensity: 0.25 });
  for (let k = 0; k < 7; k++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + Math.random() * 0.9, 1), m);
    b.position.set((k - 3) * 1.3, Math.sin(k) * 0.4 + (k % 2) * 0.5, Math.random() * 0.8); g.add(b);
  }
  g.scale.setScalar(1 + Math.random() * 0.8);
  return g;
}

function enfeitarDoces({ grupo, add, rolar, xBorda }) {
  // rio de calda de morango do lado esquerdo, com margem de biscoito
  const texCalda = textura(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ff4f93'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,190,220,.75)'; ctx.lineWidth = 5;
    for (let y = 8; y < h; y += 26) { ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x / 12 + y) * 5); ctx.stroke(); }
    ruido(ctx, w, h, 40, 'rgba(255,255,255,.8)', 3);
  }, true);
  texCalda.repeat.set(5, COMP_CENA / 6);
  const rioX = -(xBorda + 4.5 + 7);
  const rio = new THREE.Mesh(new THREE.PlaneGeometry(14, COMP_CENA), toon(0xffffff, { map: texCalda }));
  rio.rotation.x = -Math.PI / 2; rio.position.set(rioX, 0.04, COMP_CENA / 2 + INICIO); grupo.add(rio);
  rolar.push({ t: texCalda, escala: 4 }); // a calda corre mais rápido que o chão
  for (const s of [-1, 1]) {
    const margem = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, COMP_CENA), toon(0xd9984f)); margem.position.set(rioX + s * 7.2, 0.17, COMP_CENA / 2 + INICIO); grupo.add(margem);
  }
  for (const lado of [-1, 1]) {
    for (let k = 0; k < COMP_CENA / 5; k++) { const p = pirulito(); p.position.set(lado * (LARG_RUA / 2 + CALCADA * 0.6), 0.15, 0); p.rotation.y = (Math.random() - 0.5) * 0.6; add(p, INICIO + k * 5 + (lado > 0 ? 2.5 : 0)); }
    for (let k = 0; k < COMP_CENA / 16; k++) { const b = bengalaPoste(lado); b.position.set(lado * (LARG_RUA / 2 + 0.35), 0.15, 0); add(b, INICIO + k * 16 + 8); }
    for (let k = 0; k < COMP_CENA / 7; k++) { const b = goma(sorteio([0xff4f8b, 0x35c46a, 0xffb020, 0x3fb6ff, 0x7b6cf6])); b.position.set(lado * (LARG_RUA / 2 + 1.1 + Math.random() * 0.6), 0.15, 0); add(b, INICIO + k * 7 + 3); }
  }
  let z = INICIO;
  while (z < COMP_CENA + INICIO) {
    if (Math.random() < 0.7) { const c = casaPaoDeMel(1); c.position.set(xBorda + 2.8, 0, 0); add(c, z + 1.6); z += 5.5 + Math.random() * 2; }
    else { const c = cupcake(); c.position.set(xBorda + 1.6, 0, 0); add(c, z + 1); z += 3; }
  }
  for (let k = 0; k < COMP_CENA / 9; k++) { const c = cupcake(); c.position.set(-(xBorda + 1.6), 0, 0); add(c, INICIO + k * 9 + 4); }
  // montanhas de sorvete ao fundo e nuvens de algodão-doce
  for (const lado of [-1, 1]) for (let k = 0; k < 5; k++) grupo.add(montanha(lado * (30 + k * 7), 60 + k * 18, 20 + Math.random() * 14, sorteio([0xf7a8c8, 0xa8e6cf, 0x9a6a48, 0xffe08a]), true));
  const nuvens = [];
  for (let k = 0; k < 9; k++) {
    const n = nuvemDeAlgodao(); const lado = k % 2 ? 1 : -1;
    n.position.set(lado * (9 + Math.random() * 20), 10 + Math.random() * 7, 25 + k * 12); grupo.add(n); nuvens.push({ n, x0: n.position.x, f: Math.random() * 6 });
  }
  return (t) => {
    texCalda.offset.x = Math.sin(t * 0.7) * 0.04;
    for (const { n, x0, f } of nuvens) { n.position.x = x0 + Math.sin(t * 0.15 + f) * 1.5; n.position.y += Math.sin(t * 0.5 + f) * 0.002; }
  };
}

// ---------- Parque de Diversões ----------
const CORES_LUZ = [0xffd34d, 0xff5fa2, 0x5ae6ff, 0x9bff6a];

function rodaGigante(lado) {
  const g = new THREE.Group();
  const R = 6.5; const centro = 8.2;
  const roda = new THREE.Group(); roda.position.y = centro; g.add(roda);
  const branco = toon(0xffffff); const rosa = toon(0xff5fa2);
  roda.add(malha(new THREE.TorusGeometry(R, 0.14, 8, 56), rosa));
  roda.add(malha(new THREE.TorusGeometry(R * 0.55, 0.08, 6, 40), branco));
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; roda.add(haste(V(0, 0, 0), V(Math.cos(a) * R, Math.sin(a) * R, 0), 0.05, branco, 6)); }
  const eixo = malha(new THREE.CylinderGeometry(0.45, 0.45, 0.6, 16), toon(0xffd34d)); eixo.rotation.x = Math.PI / 2; roda.add(eixo);
  const lampadas = [];
  for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2; const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), luz(CORES_LUZ[k % 4])); l.position.set(Math.cos(a) * R, Math.sin(a) * R, -0.18); roda.add(l); lampadas.push(l); }
  const cabines = [];
  const cores = [0xff5a5a, 0xffb020, 0x35c46a, 0x3e8bff, 0x7b6cf6, 0xff6f91, 0x2fc6c6, 0xffd34d];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2; const piv = new THREE.Group(); piv.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); roda.add(piv);
    const cab = new THREE.Group(); piv.add(cab);
    const corpo = malha(new THREE.CylinderGeometry(0.55, 0.45, 0.7, 10), toon(cores[k])); corpo.position.y = -0.85; cab.add(corpo);
    const teto = malha(new THREE.ConeGeometry(0.62, 0.35, 10), toon(cores[k])); teto.position.y = -0.3; cab.add(teto);
    cab.add(haste(V(0, 0, 0), V(0, -0.3, 0), 0.03, branco, 4));
    cabines.push(cab);
  }
  // pés em A, de cada lado da roda
  for (const dz of [-0.9, 0.9]) for (const dx of [-3.4, 3.4]) g.add(haste(V(dx, 0, dz * 1.6), V(0, centro, dz * 0.5), 0.12, toon(0xd9dde6), 8));
  const base = malha(new THREE.BoxGeometry(8, 0.4, 3.2), toon(0x6b5f8a)); base.position.y = 0.2; g.add(base);
  g.rotation.y = lado * 0.35; // vira um pouco para a pista
  return { g, animar: (t) => { roda.rotation.z = t * 0.22; for (const c of cabines) c.rotation.z = -roda.rotation.z; lampadas.forEach((l, k) => { l.visible = (Math.floor(t * 3) + k) % 3 !== 0; }); } };
}

function carrossel() {
  const g = new THREE.Group();
  const gira = new THREE.Group(); g.add(gira);
  const piso = malha(new THREE.CylinderGeometry(2.6, 2.7, 0.35, 24), toon(0xffd34d)); piso.position.y = 0.18; g.add(piso);
  const listras = texCache('carrossel-teto', 256, 64, (ctx, w, h) => { for (let k = 0; k < 16; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#ff4f81'; ctx.fillRect(k * 16, 0, 16, h); } });
  const teto = malha(new THREE.ConeGeometry(3, 1.5, 24), toon(0xffffff, { map: listras })); teto.position.y = 3.6; gira.add(teto);
  const borda = malha(new THREE.CylinderGeometry(3, 3, 0.35, 24, 1, true), toon(0x3e8bff, { side: THREE.DoubleSide })); borda.position.y = 2.7; gira.add(borda);
  const bandeira = malha(new THREE.ConeGeometry(0.2, 0.5, 3), toon(0xffd34d)); bandeira.rotation.z = -Math.PI / 2; bandeira.scale.z = 0.2; bandeira.position.set(0.25, 4.55, 0); gira.add(bandeira);
  gira.add(haste(V(0, 3.8, 0), V(0, 4.8, 0), 0.03, toon(0xffffff), 5));
  const centro = malha(new THREE.CylinderGeometry(0.5, 0.5, 2.5, 12), toon(0xff8fb1)); centro.position.y = 1.6; gira.add(centro);
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), luz(CORES_LUZ[k % 4])); l.position.set(Math.cos(a) * 3.02, 2.6, Math.sin(a) * 3.02); gira.add(l); }
  const cavalos = [];
  const cores = [0xffffff, 0xffd1e6, 0xc9e8ff, 0xfff0b5, 0xe2d4ff, 0xc9f2d8];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2; const c = new THREE.Group(); c.position.set(Math.cos(a) * 2, 0, Math.sin(a) * 2); c.rotation.y = -a; gira.add(c);
    c.add(haste(V(0, 0.35, 0), V(0, 2.7, 0), 0.035, toon(0xffd34d), 6));
    const cav = new THREE.Group(); c.add(cav);
    const m = toon(cores[k]);
    const corpo = malha(new THREE.CapsuleGeometry(0.18, 0.5, 4, 10), m); corpo.rotation.x = Math.PI / 2; cav.add(corpo);
    const pesc = malha(new THREE.CapsuleGeometry(0.09, 0.3, 4, 8), m); pesc.position.set(0, 0.2, 0.32); pesc.rotation.x = -0.6; cav.add(pesc);
    const cab = malha(new THREE.CapsuleGeometry(0.09, 0.18, 4, 8), m); cab.position.set(0, 0.36, 0.46); cab.rotation.x = Math.PI / 2 - 0.3; cav.add(cab);
    const crina = malha(new THREE.BoxGeometry(0.05, 0.12, 0.36), toon(sorteio([0xff4f81, 0x7b6cf6, 0xffb020]))); crina.position.set(0, 0.3, 0.28); crina.rotation.x = -0.6; cav.add(crina);
    for (const [x, z2] of [[-0.1, 0.25], [0.1, 0.25], [-0.1, -0.25], [0.1, -0.25]]) { const p = malha(new THREE.CapsuleGeometry(0.035, 0.22, 3, 6), m); p.position.set(x, -0.25, z2); cav.add(p); }
    const sela = malha(new THREE.BoxGeometry(0.3, 0.06, 0.28), toon(0xe5484d)); sela.position.y = 0.18; cav.add(sela);
    cavalos.push({ cav, f: k * 1.3 });
  }
  return { g, animar: (t) => { gira.rotation.y = t * 0.5; for (const { cav, f } of cavalos) cav.position.y = 1.25 + Math.sin(t * 2.5 + f) * 0.22; } };
}

function barraquinha(lado) {
  const g = new THREE.Group();
  const [corA, corB, emoji] = sorteio([['#ff4f81', '#ffffff', '🍬'], ['#3e8bff', '#ffffff', '🎯'], ['#35c46a', '#fff4c2', '🧸'], ['#ffb020', '#ffffff', '🍦'], ['#7b6cf6', '#ffffff', '🎈']]);
  const base = malha(new THREE.BoxGeometry(2.2, 1.1, 2.4), toon(0xfffaf2)); base.position.y = 0.55; g.add(base);
  const balcao = malha(new THREE.BoxGeometry(2.3, 0.1, 2.5), toon(new THREE.Color(corA))); balcao.position.y = 1.12; g.add(balcao);
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) g.add(haste(V(dx * 1.05, 1.1, dz * 1.15), V(dx * 1.05, 2.4, dz * 1.15), 0.04, toon(0xffffff), 6));
  const listras = texCache(`barraca-${corA}`, 256, 64, (ctx, w, h) => { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? corB : corA; ctx.fillRect(k * 32, 0, 32, h); } });
  const teto = malha(new THREE.BoxGeometry(2.6, 0.12, 2.8), toon(0xffffff, { map: listras })); teto.position.y = 2.5; teto.rotation.z = lado * 0.18; g.add(teto);
  for (let k = 0; k < 7; k++) { const aba = malha(new THREE.ConeGeometry(0.2, 0.3, 3), toon(new THREE.Color(k % 2 ? corB : corA))); aba.rotation.x = Math.PI; aba.scale.z = 0.3; aba.rotation.y = Math.PI / 2; aba.position.set(-lado * 1.3, 2.62 - 0.22 - lado * 0.0, (k - 3) * 0.38); g.add(aba); }
  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 1.4), toon(0xffffff, { map: texCache(`placa-${emoji}`, 128, 64, (ctx, w, h) => { ctx.fillStyle = corA; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(4, 4, w - 8, h - 8); ctx.font = '44px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, w / 2, h / 2 + 3); }) }));
  placa.position.set(-lado * 1.15, 1.6, 0); g.add(placa);
  for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), luz(CORES_LUZ[k % 4])); l.position.set(-lado * 1.25, 2.33, (k - 2.5) * 0.45); g.add(l); }
  return g;
}

function cachoDeBaloes() {
  const g = new THREE.Group();
  const baloes = [];
  const n = 3 + Math.floor(Math.random() * 3);
  for (let k = 0; k < n; k++) {
    const cor = sorteio([0xff4f5e, 0xffc21f, 0x3e8bff, 0x35c46a, 0xff6fd0, 0x9b6cff]);
    const b = malha(new THREE.SphereGeometry(0.3, 14, 10), toon(cor, { emissive: cor, emissiveIntensity: 0.15 })); b.scale.y = 1.2;
    const topo = V(Math.cos(k * 2.1) * 0.35, 2.6 + (k % 2) * 0.35, Math.sin(k * 2.1) * 0.35);
    b.position.copy(topo); g.add(b);
    g.add(haste(V(0, 1.2, 0), topo, 0.008, toon(0xffffff), 3));
    baloes.push({ b, y0: topo.y, f: k });
  }
  return { g, baloes };
}

function montanhaRussa(grupo) {
  // fica ao fundo, do lado esquerdo, com o carrinho subindo e descendo
  const pts = [];
  for (let k = 0; k <= 24; k++) {
    const z = 22 + k * 4.5;
    pts.push(V(-20 - Math.sin(k * 0.55) * 4, 2.5 + Math.abs(Math.sin(k * 0.42)) * 9 + (k % 6 === 3 ? 2 : 0), z));
  }
  const curva = new THREE.CatmullRomCurve3(pts);
  const trilho = new THREE.Mesh(new THREE.TubeGeometry(curva, 240, 0.22, 6), toon(0xe5233a));
  grupo.add(trilho);
  const branco = toon(0xf4f4f8);
  for (let k = 0; k <= 60; k++) { const p = curva.getPointAt(k / 60); grupo.add(haste(V(p.x, 0, p.z), V(p.x, p.y - 0.2, p.z), 0.09, branco, 6)); }
  const trem = [];
  for (let k = 0; k < 4; k++) {
    const c = new THREE.Group(); grupo.add(c);
    const corpo = malha(new THREE.BoxGeometry(0.9, 0.55, 1.3), toon(CORES_LUZ[k % 4])); corpo.position.y = 0.45; c.add(corpo);
    trem.push(c);
  }
  return (t) => {
    trem.forEach((c, k) => {
      const u = ((t * 0.035 - k * 0.018) % 1 + 1) % 1;
      const p = curva.getPointAt(u); const d = curva.getTangentAt(u);
      c.position.copy(p); c.lookAt(p.clone().add(d));
    });
  };
}

function bandeirolasLaterais(lado, comp) {
  // fio de bandeirinhas e de luzinhas ao longo da calçada (não atravessa a pista)
  const g = new THREE.Group();
  const cores = [0xff4f5e, 0xffc21f, 0x3e8bff, 0x35c46a, 0xff6fd0];
  for (const dz of [0, comp]) g.add(haste(V(0, 0, dz), V(0, 3.4, dz), 0.05, toon(0x6b5f8a), 6));
  const n = 12;
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n; const y = 3.3 - Math.sin(u * Math.PI) * 0.5;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 3), toon(cores[k % cores.length], { side: THREE.DoubleSide })); b.rotation.x = Math.PI; b.scale.x = 0.25; b.position.set(0, y - 0.18, u * comp); g.add(b);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), luz(CORES_LUZ[k % 4])); l.position.set(-lado * 0.05, y + 0.02, u * comp + comp / n / 2); g.add(l);
  }
  return g;
}

function enfeitarParque({ grupo, add, xBorda }) {
  const anima = [];
  for (const lado of [-1, 1]) {
    let z = INICIO;
    while (z < COMP_CENA + INICIO) {
      const b = barraquinha(lado); b.position.set(lado * (xBorda + 1.8), 0, 0); add(b, z + 1.4); z += 3.6 + Math.random() * 2.2;
    }
    for (let k = 0; k < COMP_CENA / 9; k++) { const f = bandeirolasLaterais(lado, 8); f.position.set(lado * (LARG_RUA / 2 + 0.3), 0.15, 0); add(f, INICIO + k * 9); }
    for (let k = 0; k < COMP_CENA / 11; k++) { const c = cachoDeBaloes(); c.g.position.set(lado * (LARG_RUA / 2 + CALCADA * 0.65), 0.15, 0); add(c.g, INICIO + k * 11 + 5); anima.push(...c.baloes); }
  }
  // roda-gigante e carrossel passando de vez em quando (do lado direito), montanha-russa ao fundo
  const grandes = [];
  for (const z0 of [40, 105]) { const r = rodaGigante(1); r.g.position.set(xBorda + 12, 0, 0); add(r.g, z0); grandes.push(r); }
  for (const z0 of [10, 72]) { const c = carrossel(); c.g.position.set(xBorda + 7.5, 0, 0); add(c.g, z0); grandes.push(c); }
  const trem = montanhaRussa(grupo);
  for (let k = 0; k < 3; k++) { const r = rodaGigante(-1); r.g.position.set(-14 - k * 9, 0, 70 + k * 25); r.g.scale.setScalar(0.8); grupo.add(r.g); grandes.push(r); }
  return (t) => {
    for (const r of grandes) r.animar(t);
    for (const { b, y0, f } of anima) { b.position.y = y0 + Math.sin(t * 1.6 + f) * 0.08; b.rotation.z = Math.sin(t + f) * 0.1; }
    trem(t);
  };
}

// ---------- Deserto do Oásis ----------
function cacto(escala = 1) {
  const g = new THREE.Group();
  const verde = toon(0x3f9e4d); const claro = toon(0x6cc46a);
  const corpo = malha(new THREE.CapsuleGeometry(0.26, 1.7, 6, 12), verde); corpo.position.y = 1.1; g.add(corpo);
  for (const [s, y, alto] of [[-1, 0.9, 0.6], [1, 1.3, 0.45]]) {
    if (Math.random() < 0.15) continue;
    const cot = malha(new THREE.CapsuleGeometry(0.15, 0.35, 4, 8), verde); cot.rotation.z = Math.PI / 2; cot.position.set(s * 0.42, y, 0); g.add(cot);
    const sobe = malha(new THREE.CapsuleGeometry(0.15, alto, 4, 8), verde); sobe.position.set(s * 0.62, y + alto / 2 + 0.05, 0); g.add(sobe);
  }
  for (let k = 0; k < 4; k++) { const listra = malha(new THREE.BoxGeometry(0.03, 1.6, 0.03), claro); const a = (k / 4) * Math.PI * 2; listra.position.set(Math.cos(a) * 0.255, 1.1, Math.sin(a) * 0.255); g.add(listra); }
  if (Math.random() < 0.5) { const flor = malha(new THREE.SphereGeometry(0.12, 8, 6), toon(0xff5fa2)); flor.position.y = 2.25; g.add(flor); }
  g.scale.setScalar(escala);
  return g;
}

function piramide(x, z, alt) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(alt * 0.85, alt, 4), toon(0xe3b06a, { flatShading: true }));
  m.rotation.y = Math.PI / 4; m.position.set(x, alt / 2 - 0.5, z);
  const topo = new THREE.Mesh(new THREE.ConeGeometry(alt * 0.14, alt * 0.16, 4), toon(0xffe08a, { flatShading: true })); topo.position.y = alt * 0.42; m.add(topo);
  return m;
}

function duna(raio) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(raio, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(sorteio([0xf0c27a, 0xe8b46a, 0xf4cd8a])));
  m.scale.set(1, 0.28 + Math.random() * 0.12, 0.7 + Math.random() * 0.4); m.receiveShadow = true;
  return m;
}

function oasis() {
  const g = new THREE.Group();
  const grama = new THREE.Mesh(new THREE.CircleGeometry(4.4, 24), toon(0x7cc86a)); grama.rotation.x = -Math.PI / 2; grama.position.y = 0.03; g.add(grama);
  const agua = new THREE.Mesh(new THREE.CircleGeometry(3.3, 24), toon(0x2fb6d6)); agua.rotation.x = -Math.PI / 2; agua.position.y = 0.05; g.add(agua);
  const brilho = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.4, 24), luz(0xbff4ff)); brilho.rotation.x = -Math.PI / 2; brilho.position.y = 0.06; g.add(brilho);
  for (let k = 0; k < 3; k++) { const c = coqueiro(); const a = k * 2.2 + Math.random(); c.position.set(Math.cos(a) * 3.8, 0, Math.sin(a) * 3.8); c.rotation.y = -a; g.add(c); }
  for (let k = 0; k < 6; k++) { const j = malha(new THREE.ConeGeometry(0.08, 0.7, 4), toon(0x4f9a45)); const a = k * 1.05; j.position.set(Math.cos(a) * 3.35, 0.35, Math.sin(a) * 3.35); g.add(j); }
  return g;
}

function tenda() {
  const g = new THREE.Group();
  const [a, b] = sorteio([['#e5484d', '#fff1d6'], ['#2f6fd6', '#fff1d6'], ['#7b4bd6', '#ffd34d']]);
  const listras = texCache(`tenda-${a}`, 256, 64, (ctx, w, h) => { for (let k = 0; k < 12; k++) { ctx.fillStyle = k % 2 ? b : a; ctx.fillRect(k * 22, 0, 22, h); } });
  const lona = malha(new THREE.ConeGeometry(2.2, 2.2, 8), toon(0xffffff, { map: listras, flatShading: true })); lona.position.y = 1.1; g.add(lona);
  const porta = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), toon(0x3a2416)); porta.position.set(0, 0.55, 1.62); porta.rotation.x = -0.45; g.add(porta);
  return g;
}

// Camelo de corcova dupla, desenhado para a frente (+z). Usado nos enfeites e no obstáculo em movimento.
export function camelo3d() {
  const g = new THREE.Group();
  const pelo = toon(0xa9682b); const claro = toon(0xd9a05a); const escuro = toon(0x4a2c16);
  const corpo = malha(new THREE.CapsuleGeometry(0.33, 0.8, 6, 14), pelo); corpo.rotation.x = Math.PI / 2; corpo.position.y = 1.25; g.add(corpo);
  for (const z of [-0.25, 0.25]) { const c = malha(new THREE.SphereGeometry(0.3, 14, 10), pelo); c.scale.set(0.9, 1.1, 1); c.position.set(0, 1.55, z); g.add(c); }
  // manta colorida com franjas por cima das corcovas
  const manta = texCache('manta-camelo', 128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#e5233a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(0, 10, w, 8); ctx.fillRect(0, h - 18, w, 8);
    ctx.fillStyle = '#2fb5a8'; for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, h / 2); ctx.lineTo(x + 12, h / 2 - 10); ctx.lineTo(x + 24, h / 2); ctx.lineTo(x + 12, h / 2 + 10); ctx.fill(); }
  });
  const pano = malha(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16, 1, true, -Math.PI / 2 - 0.9, Math.PI + 1.8), toon(0xffffff, { map: manta, side: THREE.DoubleSide }));
  pano.rotation.x = Math.PI / 2; pano.rotation.y = Math.PI; pano.position.set(0, 1.3, 0); pano.rotation.z = Math.PI; g.add(pano);
  // a manta cai pelos lados (é o que se vê de trás, bem vermelho contra a areia)
  for (const s of [-1, 1]) {
    const aba = malha(new THREE.BoxGeometry(0.04, 0.42, 0.62), [toon(0xffffff, { map: manta }), toon(0xffffff, { map: manta }), toon(0xe5233a), toon(0xe5233a), toon(0xe5233a), toon(0xe5233a)]);
    aba.position.set(s * 0.36, 1.12, 0); g.add(aba);
    for (let k = 0; k < 5; k++) { const f = malha(new THREE.SphereGeometry(0.04, 6, 4), toon(0xffd34d)); f.position.set(s * 0.37, 0.88, -0.24 + k * 0.12); g.add(f); }
  }
  const pescoco = new THREE.Group(); pescoco.position.set(0, 1.35, 0.6); g.add(pescoco);
  const p1 = malha(new THREE.CapsuleGeometry(0.13, 0.5, 4, 10), pelo); p1.position.set(0, 0.2, 0.12); p1.rotation.x = 0.6; pescoco.add(p1);
  const cabeca = new THREE.Group(); cabeca.position.set(0, 0.55, 0.32); pescoco.add(cabeca);
  const cab = malha(new THREE.CapsuleGeometry(0.13, 0.22, 4, 10), pelo); cab.rotation.x = Math.PI / 2; cab.position.z = 0.08; cabeca.add(cab);
  const focinho = malha(new THREE.SphereGeometry(0.11, 10, 8), claro); focinho.scale.set(1, 0.8, 1); focinho.position.set(0, -0.03, 0.25); cabeca.add(focinho);
  for (const s of [-1, 1]) {
    const o = malha(new THREE.SphereGeometry(0.045, 8, 6), toon(0xffffff)); o.position.set(s * 0.1, 0.06, 0.12); cabeca.add(o);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 5), toon(0x1d1410)); p.position.set(s * 0.115, 0.06, 0.155); cabeca.add(p);
    const orelha = malha(new THREE.SphereGeometry(0.05, 6, 5), pelo); orelha.scale.set(0.6, 1.2, 0.5); orelha.position.set(s * 0.1, 0.13, -0.05); cabeca.add(orelha);
  }
  const pernas = [];
  for (const [x, z] of [[-0.18, 0.4], [0.18, 0.4], [-0.18, -0.4], [0.18, -0.4]]) {
    const piv = new THREE.Group(); piv.position.set(x, 1.05, z); g.add(piv);
    const coxa = malha(new THREE.CapsuleGeometry(0.08, 0.4, 4, 8), pelo); coxa.position.y = -0.25; piv.add(coxa);
    const canela = malha(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), pelo); canela.position.y = -0.7; piv.add(canela);
    const casco = malha(new THREE.SphereGeometry(0.09, 8, 6), escuro); casco.scale.set(1, 0.5, 1.2); casco.position.y = -1.0; piv.add(casco);
    pernas.push({ piv, frente: z > 0, lado: x });
  }
  const rabo = malha(new THREE.CapsuleGeometry(0.03, 0.3, 3, 6), escuro); rabo.position.set(0, 1.25, -0.72); rabo.rotation.x = 0.4; g.add(rabo);
  return {
    g,
    andar: (fase, passo = 1) => {
      for (const p of pernas) p.piv.rotation.x = Math.sin(fase + (p.lado > 0 ? Math.PI : 0) + (p.frente ? 0 : Math.PI * 0.5)) * 0.35 * passo;
      pescoco.rotation.x = Math.sin(fase * 2) * 0.08;
      rabo.rotation.z = Math.sin(fase * 1.5) * 0.3;
      g.position.y = Math.abs(Math.sin(fase)) * 0.03 * passo;
    },
  };
}

function enfeitarDeserto({ grupo, add, xBorda }) {
  const camelos = [];
  for (const lado of [-1, 1]) {
    for (let k = 0; k < COMP_CENA / 6; k++) { const c = cacto(0.8 + Math.random() * 0.6); c.position.set(lado * (LARG_RUA / 2 + CALCADA * (0.4 + Math.random() * 0.4)), 0.15, 0); c.rotation.y = Math.random() * 6; add(c, INICIO + k * 6 + Math.random() * 3); }
    for (let k = 0; k < COMP_CENA / 14; k++) { const d = duna(6 + Math.random() * 5); d.position.set(lado * (xBorda + 9 + Math.random() * 12), 0, 0); add(d, INICIO + k * 14 + Math.random() * 5); }
    for (let k = 0; k < COMP_CENA / 9; k++) { const p = malha(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.35, 0), toon(0xb98a55, { flatShading: true })); p.scale.y = 0.6; p.position.set(lado * (LARG_RUA / 2 + 0.8 + Math.random()), 0.2, 0); add(p, INICIO + k * 9 + 4); }
  }
  for (let k = 0; k < COMP_CENA / 34; k++) { const o = oasis(); o.position.set(-(xBorda + 6), 0, 0); add(o, INICIO + k * 34 + 14); }
  for (let k = 0; k < COMP_CENA / 26; k++) { const t2 = tenda(); t2.position.set(xBorda + 4.5, 0, 0); add(t2, INICIO + k * 26 + 6); }
  for (let k = 0; k < COMP_CENA / 30; k++) {
    // caravana de camelos passeando pelo lado direito
    for (let j = 0; j < 2; j++) { const c = camelo3d(); c.g.position.set(xBorda + 8.5, 0, 0); c.g.rotation.y = Math.PI * 0.08; add(c.g, INICIO + k * 30 + 18 + j * 2.4); camelos.push({ c, f: j * 1.7 + k }); }
  }
  // pirâmides e o sol se pondo, lá longe
  for (const [x, z, a] of [[-34, 120, 26], [-12, 150, 34], [24, 135, 22], [44, 160, 30]]) grupo.add(piramide(x, z, a));
  const sol = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: 0xfff1b8, fog: false }));
  sol.position.set(12, 13, 195); sol.rotation.y = Math.PI; grupo.add(sol);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0xffb35a, transparent: true, depthWrite: false, fog: false, opacity: 0.8 }));
  halo.scale.set(55, 55, 1); halo.position.set(12, 13, 196); grupo.add(halo);
  return (t) => { for (const { c, f } of camelos) c.andar(t * 3 + f, 0.8); };
}

// ---------- Passeio na Lua ----------
function terra() {
  const tex = textura(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2a7fe0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3fae5a';
    for (const [x, y, rx, ry] of [[50, 50, 26, 18], [70, 80, 14, 22], [150, 40, 34, 16], [175, 70, 18, 24], [220, 55, 20, 14], [120, 95, 16, 10]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.4, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#e9d18a'; ctx.beginPath(); ctx.ellipse(160, 52, 10, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 18, 4, Math.random() - 0.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, 8); ctx.fillRect(0, h - 8, w, 8);
  });
  const g = new THREE.Group();
  const esfera = new THREE.Mesh(new THREE.SphereGeometry(11, 32, 20), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
  esfera.rotation.z = 0.35; g.add(esfera);
  // sombra da noite na Terra (lado direito escurecido)
  const noite = new THREE.Mesh(new THREE.SphereGeometry(11.05, 32, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x050a20, transparent: true, opacity: 0.45, fog: false, depthWrite: false }));
  noite.rotation.y = Math.PI * 1.2; g.add(noite);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0x6fb8ff, transparent: true, depthWrite: false, fog: false, opacity: 0.7 }));
  halo.scale.set(36, 36, 1); halo.position.z = 2; g.add(halo);
  return { g, esfera };
}

function estrelas(n = 700) {
  // pontinhos espalhados pela metade do céu que fica na frente da câmera
  const pos = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const az = (Math.random() - 0.5) * Math.PI * 1.5; const el = 0.03 + Math.random() * 1.25; const r = 175;
    pos[k * 3] = Math.sin(az) * Math.cos(el) * r;
    pos[k * 3 + 1] = Math.sin(el) * r;
    pos[k * 3 + 2] = Math.cos(az) * Math.cos(el) * r;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.95 }));
}

function foguete() {
  const g = new THREE.Group();
  const branco = toon(0xf4f6fb); const vermelho = toon(0xe5233a);
  const corpo = malha(new THREE.LatheGeometry([[0, 0], [0.55, 0.05], [0.6, 1.2], [0.58, 2.6], [0.45, 3.4], [0.2, 3.9], [0, 4.05]].map(([r, y]) => new THREE.Vector2(r, y)), 20), branco);
  corpo.position.y = 0.6; g.add(corpo);
  const nariz = malha(new THREE.ConeGeometry(0.32, 0.6, 18), vermelho); nariz.position.y = 4.4; g.add(nariz);
  const faixa = malha(new THREE.CylinderGeometry(0.605, 0.605, 0.25, 20), vermelho); faixa.position.y = 2.2; g.add(faixa);
  const janela = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), luz(0x7fd8ff)); janela.position.set(0, 3.1, -0.53); janela.rotation.set(0.12, Math.PI, 0); g.add(janela);
  const aro = malha(new THREE.TorusGeometry(0.23, 0.04, 6, 16), toon(0x9aa3b5)); aro.position.copy(janela.position); aro.rotation.x = 0.12; g.add(aro);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2; const asa = malha(new THREE.BoxGeometry(0.08, 0.9, 0.6), vermelho);
    asa.position.set(Math.cos(a) * 0.62, 1.0, Math.sin(a) * 0.62); asa.rotation.y = -a + Math.PI / 2; g.add(asa);
  }
  const bocal = malha(new THREE.CylinderGeometry(0.3, 0.42, 0.4, 14), toon(0x5a6170)); bocal.position.y = 0.45; g.add(bocal);
  const base = malha(new THREE.CylinderGeometry(1.3, 1.4, 0.25, 16), toon(0x6b7282)); base.position.y = 0.12; g.add(base);
  const pisca = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), luz(0xff3b3b)); pisca.position.y = 4.75; g.add(pisca);
  return { g, pisca };
}

function domo() {
  const g = new THREE.Group();
  const anel = malha(new THREE.CylinderGeometry(2.3, 2.4, 0.5, 24), toon(0xe8ebf2)); anel.position.y = 0.25; g.add(anel);
  const vidro = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x8fe0ff, { transparent: true, opacity: 0.55, emissive: 0x2a6fa0, emissiveIntensity: 0.3 }));
  vidro.position.y = 0.5; g.add(vidro);
  for (let k = 0; k < 4; k++) { const arco = malha(new THREE.TorusGeometry(2.2, 0.04, 6, 24, Math.PI), toon(0xe8ebf2)); arco.position.y = 0.5; arco.rotation.y = (k / 4) * Math.PI; g.add(arco); }
  // plantinhas da estufa lá dentro
  for (let k = 0; k < 5; k++) { const p = malha(new THREE.IcosahedronGeometry(0.35, 0), toon(0x4fbf5a, { flatShading: true })); p.position.set(Math.cos(k * 1.3) * 1.1, 0.8, Math.sin(k * 1.3) * 1.1); g.add(p); }
  return g;
}

function modulo(lado) {
  const g = new THREE.Group();
  const corpo = malha(new THREE.CylinderGeometry(0.9, 0.9, 3.6, 18), toon(0xf1f3f8)); corpo.rotation.x = Math.PI / 2; corpo.position.y = 1.0; g.add(corpo);
  for (const z of [-1.8, 1.8]) { const tampa = malha(new THREE.SphereGeometry(0.9, 16, 10), toon(0xd8dce6)); tampa.scale.z = 0.35; tampa.position.set(0, 1.0, z); g.add(tampa); }
  for (const z of [-1, 0, 1]) { const j = new THREE.Mesh(new THREE.CircleGeometry(0.22, 14), luz(0xffd98a)); j.position.set(-lado * 0.91, 1.1, z); j.rotation.y = -lado * Math.PI / 2; g.add(j); }
  const faixa = malha(new THREE.CylinderGeometry(0.92, 0.92, 0.3, 18), toon(0x3e8bff)); faixa.rotation.x = Math.PI / 2; faixa.position.y = 1.0; g.add(faixa);
  for (const z of [-1.2, 1.2]) for (const s of [-1, 1]) g.add(haste(V(s * 0.6, 0, z), V(s * 0.5, 0.5, z), 0.06, toon(0x9aa3b5), 6));
  // painel solar e antena parabólica
  const painelTex = texCache('painel-solar', 128, 64, (ctx, w, h) => { ctx.fillStyle = '#1c3f8f'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#8fb6ff'; ctx.lineWidth = 2; for (let x = 0; x <= w; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y <= h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } });
  const painel = malha(new THREE.BoxGeometry(2.2, 0.05, 1.2), toon(0xffffff, { map: painelTex })); painel.position.set(0, 2.5, 0); painel.rotation.z = lado * 0.4; g.add(painel);
  g.add(haste(V(0, 1.8, 0), V(0, 2.5, 0), 0.05, toon(0x9aa3b5), 6));
  const prato = malha(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.3), toon(0xffffff, { side: THREE.DoubleSide })); prato.position.set(0, 2.2, 1.4); prato.rotation.x = -1.0; g.add(prato);
  g.add(haste(V(0, 1.8, 1.4), V(0, 2.2, 1.4), 0.04, toon(0x9aa3b5), 6));
  return g;
}

function bandeiraLua() {
  const g = new THREE.Group();
  g.add(haste(V(0, 0, 0), V(0, 1.8, 0), 0.025, toon(0xd8dce6), 6));
  const tex = texCache('bandeira-lua', 128, 80, (ctx, w, h) => { ctx.fillStyle = '#7b6cf6'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffd34d'; ctx.font = '48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', w / 2, h / 2 + 2); });
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), toon(0xffffff, { map: tex, side: THREE.DoubleSide })); pano.position.set(0.4, 1.55, 0); g.add(pano);
  return g;
}

function rocha() {
  const m = malha(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.6, 0), toon(sorteio([0x80858f, 0x9aa0a9, 0x737882]), { flatShading: true }));
  m.scale.y = 0.55; m.position.y = 0.15; m.rotation.y = Math.random() * 3;
  return m;
}

function enfeitarLua({ grupo, add, xBorda }) {
  const piscas = [];
  for (const lado of [-1, 1]) {
    for (let k = 0; k < COMP_CENA / 5; k++) { const r = rocha(); r.position.x = lado * (LARG_RUA / 2 + 0.8 + Math.random() * 1.2); add(r, INICIO + k * 5 + Math.random() * 3); }
    for (let k = 0; k < COMP_CENA / 18; k++) { const b = bandeiraLua(); b.position.set(lado * (LARG_RUA / 2 + CALCADA * 0.7), 0.15, 0); add(b, INICIO + k * 18 + 9); }
    for (let k = 0; k < COMP_CENA / 10; k++) {
      const pos = new THREE.Group();
      const haste1 = haste(V(0, 0, 0), V(0, 1.2, 0), 0.04, toon(0x9aa3b5), 6); pos.add(haste1);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), luz(0x5ae6ff)); l.position.y = 1.25; pos.add(l); piscas.push(l);
      pos.position.set(lado * (LARG_RUA / 2 + 0.3), 0.15, 0); add(pos, INICIO + k * 10 + 2);
    }
  }
  let z = INICIO;
  while (z < COMP_CENA + INICIO) {
    const r = Math.random();
    if (r < 0.35) { const d = domo(); d.position.set(xBorda + 3.2, 0, 0); add(d, z + 2.4); z += 6; }
    else if (r < 0.7) { const m = modulo(1); m.position.set(xBorda + 2.4, 0, 0); add(m, z + 2); z += 5; }
    else { const f = foguete(); f.g.position.set(xBorda + 2.6, 0, 0); add(f.g, z + 1.5); piscas.push(f.pisca); z += 4.5; }
  }
  z = INICIO + 8;
  while (z < COMP_CENA + INICIO) {
    if (Math.random() < 0.5) { const f = foguete(); f.g.position.set(-(xBorda + 3), 0, 0); f.g.scale.setScalar(1.3); add(f.g, z); piscas.push(f.pisca); }
    else { const d = domo(); d.position.set(-(xBorda + 4), 0, 0); add(d, z); }
    z += 11 + Math.random() * 6;
  }
  // crateras grandes no terreno
  for (const lado of [-1, 1]) for (let k = 0; k < COMP_CENA / 15; k++) {
    const c = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.8, 20), toon(0x767b85)); c.rotation.x = -Math.PI / 2; c.position.set(lado * (xBorda + 7 + Math.random() * 10), 0.02, 0);
    const fundo = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20), toon(0x6c717b)); fundo.position.z = 0.001; c.add(fundo);
    add(c, INICIO + k * 15 + Math.random() * 6);
  }
  for (const lado of [-1, 1]) for (let k = 0; k < 4; k++) grupo.add(montanha(lado * (32 + k * 8), 70 + k * 20, 14 + Math.random() * 10, sorteio([0x6c717b, 0x7c818b]), false));
  grupo.add(estrelas());
  const t3 = terra(); t3.g.position.set(-26, 40, 175); grupo.add(t3.g);
  // poeirinha flutuando devagar (na Lua tudo cai devagarinho)
  const n = 160; const pos = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) { pos[k * 3] = (Math.random() - 0.5) * 14; pos[k * 3 + 1] = Math.random() * 3; pos[k * 3 + 2] = Math.random() * 30 - 4; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  grupo.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe6f5, size: 0.06, map: texBrilho(), transparent: true, opacity: 0.7, depthWrite: false })));
  return (t, dt, vel) => {
    t3.esfera.rotation.y = t * 0.05;
    piscas.forEach((p, k) => { p.visible = Math.floor(t * 2 + k * 0.7) % 2 === 0; });
    const p = geo.attributes.position;
    for (let k = 0; k < n; k++) {
      let y = p.getY(k) + dt * 0.12 * Math.sin(t + k); let zz = p.getZ(k) - dt * vel * 0.9;
      if (y < 0) y += 3; if (y > 3) y -= 3; if (zz < -4) zz += 30;
      p.setXYZ(k, p.getX(k), y, zz);
    }
    p.needsUpdate = true;
  };
}

export function enfeitarNovo(id, ctx) {
  if (id === 'doces') return enfeitarDoces(ctx);
  if (id === 'parque') return enfeitarParque(ctx);
  if (id === 'deserto') return enfeitarDeserto(ctx);
  if (id === 'lua') return enfeitarLua(ctx);
  return () => {};
}

// ---------- Obstáculos parados de cada cenário novo ----------
function cercaDoces(g, L) {
  // cerca de biscoito wafer em postes de bengala, com glacê rosa escorrendo por cima
  const wafer = texPano('wafer', (ctx, w, h) => {
    ctx.fillStyle = '#f7d08a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c98a3e'; ctx.lineWidth = 3;
    for (let x = -h; x < w + h; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + h, 0); ctx.lineTo(x, h); ctx.stroke(); }
  }, 128, 32);
  const lisa = toon(0xe9b264); const face = toon(0xffffff, { map: wafer });
  const bengala = toon(0xffffff, { map: texBengala() });
  for (const lado of [-1, 1]) {
    const p = malha(new THREE.CylinderGeometry(0.07, 0.07, 0.66, 10), bengala); p.position.set(lado * (L / 2 - 0.06), 0.33, 0); g.add(p);
    const bala = malha(new THREE.SphereGeometry(0.1, 10, 8), toon(0xff4f8b)); bala.position.set(lado * (L / 2 - 0.06), 0.7, 0); g.add(bala);
  }
  for (const y of [0.48, 0.22]) { const t = malha(new THREE.BoxGeometry(L, 0.18, 0.1), [lisa, lisa, lisa, lisa, face, face]); t.position.y = y; g.add(t); }
  const glace = malha(new THREE.CapsuleGeometry(0.06, L - 0.3, 4, 10), toon(0xff7fb5)); glace.rotation.z = Math.PI / 2; glace.scale.set(1, 1, 1.4); glace.position.y = 0.58; g.add(glace);
  for (let k = 0; k < 5; k++) { const gota = malha(new THREE.CapsuleGeometry(0.035, 0.08 + (k % 2) * 0.06, 3, 6), toon(0xff7fb5)); gota.position.set(-L / 2 + 0.3 + k * (L - 0.6) / 4, 0.5, -0.06); g.add(gota); }
  for (let k = 0; k < 8; k++) { const gr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), luz(sorteio([0xffd34d, 0x5ac8ff, 0x7cdc6a, 0xffffff]))); gr.position.set(-L / 2 + 0.2 + k * (L - 0.4) / 7, 0.64, (k % 2 - 0.5) * 0.06); gr.rotation.y = k; g.add(gr); }
}

function cercaParque(g, L) {
  // cerca de fila: postes dourados com cordões de veludo vermelho e a plaquinha "FILA"
  const ouro = toon(0xffc531, { emissive: 0x553300, emissiveIntensity: 0.3 });
  for (const lado of [-1, 1]) {
    const x = lado * (L / 2 - 0.08);
    const base = malha(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 14), ouro); base.position.set(x, 0.025, 0); g.add(base);
    const p = malha(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 10), ouro); p.position.set(x, 0.33, 0); g.add(p);
    const bola = malha(new THREE.SphereGeometry(0.075, 12, 8), ouro); bola.position.set(x, 0.66, 0); g.add(bola);
  }
  const veludo = toon(0xd0182f);
  for (const [y, queda] of [[0.56, 0.16], [0.3, 0.1]]) {
    const curva = new THREE.QuadraticBezierCurve3(V(-L / 2 + 0.08, y, 0), V(0, y - queda * 2, 0), V(L / 2 - 0.08, y, 0));
    g.add(malha(new THREE.TubeGeometry(curva, 20, 0.05, 8), veludo));
  }
  const placa = texPano('placa-fila', (ctx, w, h) => { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 14); ctx.fill(); ctx.fillStyle = '#d0182f'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FILA', w / 2, h / 2 + 2); }, 128, 56);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.19), toon(0xffffff, { map: placa })); pl.rotation.y = Math.PI; pl.position.set(0, 0.33, -0.06); g.add(pl); // de frente para quem vem
}

function cercaDeserto(g, L) {
  // porteira de madeira escura com um tapete colorido pendurado
  const madeira = toon(0x5e3a1e);
  for (const lado of [-1, 1]) { const p = malha(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 8), madeira); p.position.set(lado * (L / 2 - 0.06), 0.35, 0); g.add(p); }
  for (const y of [0.56, 0.16]) { const b = malha(new THREE.CylinderGeometry(0.045, 0.045, L, 8), madeira); b.rotation.z = Math.PI / 2; b.position.y = y; g.add(b); }
  const kilim = texPano('kilim', (ctx, w, h) => {
    ctx.fillStyle = '#d8262f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(0, 6, w, 6); ctx.fillRect(0, h - 12, w, 6);
    for (let x = 8; x < w; x += 40) {
      ctx.fillStyle = '#2fb5a8'; ctx.beginPath(); ctx.moveTo(x, h / 2); ctx.lineTo(x + 16, 16); ctx.lineTo(x + 32, h / 2); ctx.lineTo(x + 16, h - 16); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 16, h / 2, 5, 0, 7); ctx.fill();
    }
  }, 256, 64);
  const tapete = malha(new THREE.BoxGeometry(L - 0.2, 0.34, 0.03), [toon(0xd8262f), toon(0xd8262f), toon(0xd8262f), toon(0xd8262f), toon(0xffffff, { map: kilim }), toon(0xffffff, { map: kilim })]);
  tapete.position.y = 0.38; g.add(tapete);
  for (let k = 0; k < 9; k++) { const f = malha(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 4), toon(0xffd34d)); f.position.set(-L / 2 + 0.15 + k * (L - 0.3) / 8, 0.17, 0); g.add(f); }
}

function cercaLua(g, L) {
  // barreira de perigo: listras amarelas e pretas e luzes laranja piscando nos postes
  const listras = texPano('perigo', (ctx, w, h) => { ctx.fillStyle = '#ffd21f'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1d1f26'; for (let k = -2; k < 10; k++) { ctx.beginPath(); ctx.moveTo(k * 16, h); ctx.lineTo(k * 16 + 8, 0); ctx.lineTo(k * 16 + 16, 0); ctx.lineTo(k * 16 + 8, h); ctx.fill(); } }, 128, 32);
  const metal = toon(0x5a6170); const face = toon(0xffffff, { map: listras }); const amarelo = toon(0xffd21f);
  for (const lado of [-1, 1]) {
    const p = malha(new THREE.BoxGeometry(0.1, 0.62, 0.1), metal); p.position.set(lado * (L / 2 - 0.06), 0.31, 0); g.add(p);
    const pe = malha(new THREE.BoxGeometry(0.1, 0.05, 0.45), metal); pe.position.set(lado * (L / 2 - 0.06), 0.025, 0); g.add(pe);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), luz(0xff8a1f)); l.position.set(lado * (L / 2 - 0.06), 0.68, 0); l.userData.pisca = lado; g.add(l);
  }
  for (const y of [0.5, 0.24]) { const t = malha(new THREE.BoxGeometry(L, 0.17, 0.07), [amarelo, amarelo, amarelo, amarelo, face, face]); t.position.y = y; g.add(t); }
}

function faixaDoces(g, L) {
  const m = toon(0xffffff, { map: texBengala() });
  for (const lado of [-1, 1]) { const p = malha(new THREE.CylinderGeometry(0.07, 0.07, 2.1, 10), m); p.position.set(lado * (L / 2), 1.05, 0); g.add(p); }
  const arco = texPano('arco-iris-doce', (ctx, w, h) => {
    ['#ff4f5e', '#ffb020', '#ffe14d', '#5ad46a', '#3fb6ff', '#9b6cff'].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(0, (k * h) / 6, w, h / 6 + 1); });
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍬  DOCES  🍭', w / 2, h / 2 + 2);
  });
  const b = toon(0xffffff, { map: arco }); const r = toon(0xff4f8b);
  const placa = malha(new THREE.BoxGeometry(L + 0.1, 0.34, 0.1), [r, r, r, r, b, b]); placa.position.y = 1.86; g.add(placa);
  // gotinhas de goma penduradas
  bandeirinhas(g, L, [0xff4f8b, 0xffd34d, 0x35c46a, 0x3fb6ff], [[1.62, 0], [1.3, 1]]);
}

function faixaParque(g, L) {
  const listra = texPano('poste-parque', (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#3e8bff'; for (let y = -64; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 32); ctx.lineTo(w, y + 44); ctx.lineTo(0, y + 12); ctx.fill(); } }, 32, 128);
  for (const lado of [-1, 1]) {
    const p = malha(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 10), toon(0xffffff, { map: listra })); p.position.set(lado * (L / 2), 1.1, 0); g.add(p);
    const topo = malha(new THREE.SphereGeometry(0.1, 10, 8), toon(0xffd34d)); topo.position.set(lado * (L / 2), 2.25, 0); g.add(topo);
  }
  const faixa = texPano('faixa-parque', (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff5f8f'); gr.addColorStop(1, '#e5233a'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(0, 0, w, 6); ctx.fillRect(0, h - 6, w, 6);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎡 DIVERSÃO 🎠', w / 2, h / 2 + 2);
  });
  const r = toon(0xe5233a); const b = toon(0xffffff, { map: faixa });
  const placa = malha(new THREE.BoxGeometry(L, 0.34, 0.06), [r, r, r, r, b, b]); placa.position.y = 1.88; g.add(placa);
  bandeirinhas(g, L, [0xffd34d, 0x3e8bff, 0x35c46a, 0xff6fd0]);
  for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), luz(CORES_LUZ[k % 4])); l.position.set(-L / 2 + (k + 0.5) * L / 7, 1.68, -0.05); g.add(l); }
}

function faixaDeserto(g, L) {
  const madeira = toon(0x5e3a1e);
  for (const lado of [-1, 1]) { const p = malha(new THREE.CylinderGeometry(0.06, 0.07, 2.25, 8), madeira); p.position.set(lado * (L / 2), 1.12, 0); g.add(p); }
  const lona = texPano('toldo-deserto', (ctx, w, h) => { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#2f6fd6'; ctx.fillRect(k * 32, 0, 32, h); } });
  const pano = malha(new THREE.BoxGeometry(L + 0.3, 0.06, 0.9), toon(0xffffff, { map: lona })); pano.position.y = 2.1; pano.rotation.x = 0.2; g.add(pano);
  for (let k = 0; k < 8; k++) { const borla = malha(new THREE.ConeGeometry(0.06, 0.2, 6), toon(k % 2 ? 0xffd34d : 0xe5233a)); borla.rotation.x = Math.PI; borla.position.set(-L / 2 + (k + 0.5) * L / 8, 1.9, -0.4); g.add(borla); }
  // lanterna pendurada no meio
  g.add(haste(V(0, 2.05, 0), V(0, 1.7, 0), 0.01, toon(0x3a2416), 4));
  const lant = malha(new THREE.CylinderGeometry(0.1, 0.13, 0.24, 6), toon(0xc98a2e)); lant.position.y = 1.58; g.add(lant);
  const chama = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), luz(0xffd36b)); chama.position.y = 1.58; g.add(chama);
  bandeirinhas(g, L, [0xe5233a, 0xffd34d, 0x2fb5a8], [[1.45, 0]]);
}

function faixaLua(g, L) {
  // portal de antenas com painel solar em cima e luzinhas azuis
  const metal = toon(0xd8dce6);
  for (const lado of [-1, 1]) {
    const p = malha(new THREE.BoxGeometry(0.12, 2.15, 0.12), metal); p.position.set(lado * (L / 2), 1.07, 0); g.add(p);
    for (const y of [0.6, 1.2]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), luz(0x5ae6ff)); l.position.set(lado * (L / 2), y, -0.07); g.add(l); }
  }
  const painelTex = texPano('portal-lua', (ctx, w, h) => {
    ctx.fillStyle = '#1c3f8f'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8fb6ff'; ctx.lineWidth = 2; for (let x = 0; x <= w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌙 BASE LUA 🚀', w / 2, h / 2 + 2);
  });
  const lado2 = toon(0x1c3f8f); const face = toon(0xffffff, { map: painelTex, emissive: 0x112244, emissiveIntensity: 0.4 });
  const placa = malha(new THREE.BoxGeometry(L + 0.1, 0.36, 0.08), [lado2, lado2, lado2, lado2, face, face]); placa.position.y = 1.88; g.add(placa);
  const prato = malha(new THREE.SphereGeometry(0.26, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.3), toon(0xffffff, { side: THREE.DoubleSide })); prato.position.set(L / 2 - 0.1, 2.35, 0); prato.rotation.x = -0.9; g.add(prato);
  const antena = haste(V(-L / 2 + 0.1, 2.06, 0), V(-L / 2 + 0.1, 2.6, 0), 0.015, metal, 4); g.add(antena);
  const pisca = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), luz(0xff3b3b)); pisca.position.set(-L / 2 + 0.1, 2.62, 0); g.add(pisca);
  bandeirinhas(g, L, [0x5ae6ff, 0xffffff, 0xffd34d], [[1.62, 0], [1.3, 1]]);
}

function jipeLunar(g, L, comp) {
  // jipe lunar da base: comprido, branco e dourado, com rodas grandes e antena parabólica
  const lados = toon(0xffffff, { map: texPano('jipe-lua', (ctx, w, h) => {
    ctx.fillStyle = '#f4f6fb'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3e8bff'; ctx.fillRect(0, 0, w, 18); ctx.fillRect(0, h - 18, w, 18);
    ctx.fillStyle = '#3e8bff'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BASE LUA', w / 2 - 50, h / 2 + 2); ctx.font = '50px sans-serif'; ctx.fillText('🚀', w - 70, h / 2 + 2);
  }, 512, 128) });
  const branco = toon(0xf4f6fb); const ouro = toon(0xe3b23c, { emissive: 0x4a3300, emissiveIntensity: 0.25 });
  const chassi = malha(new THREE.BoxGeometry(L, 0.16, comp - 0.2), toon(0x5a6170)); chassi.position.set(0, 0.42, comp / 2); g.add(chassi);
  const carga = malha(new THREE.BoxGeometry(L - 0.08, 0.7, comp - 1.3), [lados, lados, toon(0x3e8bff), branco, branco, branco]); carga.position.set(0, 0.85, comp / 2 + 0.55); g.add(carga);
  const folha = malha(new THREE.BoxGeometry(L + 0.02, 0.12, comp - 1.3), ouro); folha.position.set(0, 0.56, comp / 2 + 0.55); g.add(folha);
  const cabine = malha(new THREE.SphereGeometry(0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x8fe0ff, { emissive: 0x2a6fa0, emissiveIntensity: 0.35 })); cabine.scale.set(1.05, 1, 0.9); cabine.position.set(0, 0.5, 0.75); g.add(cabine);
  const aro = malha(new THREE.TorusGeometry(0.62, 0.05, 6, 20), branco); aro.rotation.x = Math.PI / 2; aro.scale.set(1.05, 0.9, 1); aro.position.set(0, 0.52, 0.75); g.add(aro);
  const prato = malha(new THREE.SphereGeometry(0.35, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.3), toon(0xffffff, { side: THREE.DoubleSide })); prato.position.set(0.25, 1.55, comp - 1); prato.rotation.x = -0.8; g.add(prato);
  g.add(haste(V(0.25, 1.2, comp - 1), V(0.25, 1.5, comp - 1), 0.03, toon(0x9aa3b5), 5));
  const pisca = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), luz(0xff3b3b)); pisca.position.set(-0.3, 1.32, comp - 0.6); g.add(pisca);
  g.add(haste(V(-0.3, 1.2, comp - 0.6), V(-0.3, 1.3, comp - 0.6), 0.015, toon(0x9aa3b5), 4));
  for (const dz of [0.7, comp / 2, comp - 0.7]) for (const lado of [-1, 1]) {
    const roda = malha(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), toon(0x3a3f4c)); roda.rotation.z = Math.PI / 2; roda.position.set(lado * (L / 2 - 0.08), 0.32, dz); g.add(roda);
    const cubo = malha(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 10), ouro); cubo.rotation.z = Math.PI / 2; cubo.position.copy(roda.position); g.add(cubo);
  }
}

export function obstaculoNovo(o, tema, g) {
  const L = LARG_OBST;
  if (o.tipo === 'cerca') ({ doces: cercaDoces, parque: cercaParque, deserto: cercaDeserto, lua: cercaLua })[tema](g, L);
  else if (o.tipo === 'faixa') ({ doces: faixaDoces, parque: faixaParque, deserto: faixaDeserto, lua: faixaLua })[tema](g, L);
  else if (o.tipo === 'carrinho') {
    const comp = o.comp ?? 5;
    if (tema === 'doces') {
      g.add(veiculo({ corCabine: 0xff5fa2, corTeto: 0xffb3d4, texto: 'DOCES', emoji: '🍭', corTexto: '#ff2f7d', comp, topo: (v, c) => {
        const forma = malha(new THREE.CylinderGeometry(0.34, 0.26, 0.3, 14), toon(0x3fb6ff)); forma.position.set(0, 1.47, c / 2 + 0.5); v.add(forma);
        const cob = malha(new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffc2e2)); cob.position.set(0, 1.62, c / 2 + 0.5); v.add(cob);
        const cereja = malha(new THREE.SphereGeometry(0.09, 10, 8), toon(0xe5233a)); cereja.position.set(0, 2.0, c / 2 + 0.5); v.add(cereja);
        const p = pirulito(); p.scale.setScalar(0.35); p.position.set(0.3, 1.3, c - 0.9); v.add(p);
      } }));
    } else if (tema === 'parque') {
      g.add(veiculo({ corCabine: 0xe5233a, corTeto: 0xffffff, texto: 'PIPOCA', emoji: '🍿', corTexto: '#e5233a', comp, topo: (v, c) => {
        const listras = texPano('balde-pipoca', (ctx, w, h) => { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#e5233a'; ctx.fillRect(k * 16, 0, 16, h); } }, 128, 32);
        const balde = malha(new THREE.CylinderGeometry(0.42, 0.3, 0.5, 16), toon(0xffffff, { map: listras })); balde.position.set(0, 1.58, c / 2 + 0.5); v.add(balde);
        for (let k = 0; k < 14; k++) { const pp = malha(new THREE.IcosahedronGeometry(0.09 + (k % 3) * 0.02, 0), toon(k % 4 ? 0xfff6d8 : 0xffd34d, { flatShading: true })); const a = k * 2.3; pp.position.set(Math.cos(a) * 0.26 * ((k % 3) / 2), 1.86 + (k % 4) * 0.05, c / 2 + 0.5 + Math.sin(a) * 0.26 * ((k % 3) / 2)); v.add(pp); }
      } }));
    } else if (tema === 'deserto') {
      g.add(veiculo({ corCabine: 0x2fb5a8, corTeto: 0xffd34d, texto: 'ÁGUA FRESCA', emoji: '💧', corTexto: '#13877b', comp, topo: (v, c) => {
        for (let k = 0; k < 3; k++) {
          const vaso = malha(new THREE.LatheGeometry([[0, 0], [0.18, 0.02], [0.24, 0.16], [0.2, 0.34], [0.1, 0.42], [0.12, 0.48]].map(([r, y]) => new THREE.Vector2(r, y)), 14), toon(k === 1 ? 0xd9733a : 0xc8622e));
          vaso.position.set((k - 1) * 0.42, 1.34, c / 2 + 0.2 + (k % 2) * 0.5); v.add(vaso);
        }
        const melancia = malha(new THREE.SphereGeometry(0.26, 14, 10), toon(0x3f9a3a)); melancia.scale.set(1, 0.85, 1.25); melancia.position.set(0, 1.5, c - 1.1); v.add(melancia);
      } }));
    } else jipeLunar(g, L, comp);
  }
  // as luzes de aviso da Lua piscam
  const piscas = [];
  g.traverse((x) => { if (x.userData.pisca) piscas.push(x); });
  if (piscas.length) g.userData.animar = (_, t) => { for (const p of piscas) p.visible = Math.floor(t * 3 + (p.userData.pisca > 0 ? 0 : 1)) % 2 === 0; };
  return g;
}

