// Corrida dos Cachinhos em 3D (three.js): rua da cidade, prédios, obstáculos com volume e a menina
// montada em partes articuladas. Usa as mesmas coordenadas da lógica (corrida.js):
// faixa 0..2, z = distância à frente dela, y = altura. Câmera atrás e um pouco acima.
import * as THREE from '../vendor/three.module.min.js';
import { PELES, ROUPAS } from './personagem.js';
import { LONGE } from './corrida.js';

const FAIXA = 1.6; // largura de cada faixa, em metros
// Com a câmera olhando para a frente (+z), a esquerda da tela é +x: a faixa 0 fica em +x.
const xDe = (f) => (1 - f) * FAIXA;
const LARG_RUA = FAIXA * 3 + 0.4;
const CALCADA = 2.2;
const COMP_CENA = 130;

// ---------- Texturas desenhadas na hora ----------
function textura(w, h, desenhar, repetir = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repetir) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
  return t;
}

function ruido(ctx, w, h, n, cor) {
  ctx.fillStyle = cor;
  for (let k = 0; k < n; k++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
}

const TEX = {};
function prepararTexturas() {
  if (TEX.rua) return;
  TEX.rua = textura(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5d6478'; ctx.fillRect(0, 0, w, h);
    ruido(ctx, w, h, 2500, 'rgba(255,255,255,.05)');
    ruido(ctx, w, h, 2500, 'rgba(0,0,0,.08)');
    ctx.fillStyle = '#f2f2f2';
    for (const fx of [1 / 3, 2 / 3]) for (let y = 0; y < h; y += 128) ctx.fillRect(w * fx - 3, y + 20, 6, 70);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(4, 0, 6, h); ctx.fillRect(w - 10, 0, 6, h);
  }, true);
  TEX.calcada = textura(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d9d2c5'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#bdb4a5'; ctx.lineWidth = 3;
    for (let k = 0; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, k * 64); ctx.lineTo(w, k * 64); ctx.moveTo(k * 64, 0); ctx.lineTo(k * 64, h); ctx.stroke(); }
    ruido(ctx, w, h, 400, 'rgba(0,0,0,.06)');
  }, true);
  TEX.grama = textura(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#6cc070'; ctx.fillRect(0, 0, w, h);
    ruido(ctx, w, h, 900, 'rgba(30,90,40,.25)');
  }, true);
  TEX.janelas = textura(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    for (let y = 16; y < h; y += 42) {
      for (let x = 12; x < w; x += 38) {
        const acesa = Math.random() < 0.25;
        ctx.fillStyle = acesa ? '#ffe9a8' : '#9cc7e8';
        ctx.fillRect(x, y, 24, 28);
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 2, y + 2, 7, 24);
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x - 2, y + 28, 28, 4);
      }
    }
  }, true);
  TEX.listras = textura(128, 32, (ctx, w, h) => {
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#e5484d'; ctx.fillRect(k * 16, 0, 16, h); }
  });
  TEX.banner = textura(256, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8b7dff'); g.addColorStop(1, '#5b4bd6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★  ★  ★', w / 2, h / 2 + 2);
  });
  TEX.caminhao = textura(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf2'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 16; k++) { ctx.fillStyle = k % 2 ? '#ff6f91' : '#fffaf2'; ctx.fillRect(k * 32, 0, 32, 26); }
    ctx.fillStyle = '#ff4f81'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SORVETES', w / 2 - 40, h / 2 + 16);
    ctx.font = '54px sans-serif'; ctx.fillText('🍦', w - 70, h / 2 + 14);
  });
  TEX.frenteCaminhao = textura(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf2'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7fc6ff'; ctx.fillRect(12, 14, w - 24, 50);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(18, 18, 18, 42);
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(26, 96, 11, 0, 7); ctx.arc(w - 26, 96, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#9aa0ad'; ctx.fillRect(40, 88, w - 80, 16);
  });
  TEX.moeda = textura(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(44, 40, 6, 64, 64, 64); g.addColorStop(0, '#fff6b8'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#e09a00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(64, 64, 64, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c98500'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(64, 64, 46, 0, 7); ctx.stroke();
    ctx.fillStyle = '#e8a400'; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const r = k % 2 ? 15 : 34; ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    ctx.fill();
  });
  const bolha = (icone, cor) => textura(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(44, 40, 6, 64, 64, 62); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, cor); g.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(64, 64, 60, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.font = '62px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icone, 64, 68);
  });
  TEX.poder = { ima: bolha('🧲', '#ff5a5a'), pulo: bolha('👟', '#35c46a'), maleta: bolha('🎒', '#b0723a'), escudo: bolha('🛡️', '#3e8bff'), raio: bolha('⚡', '#ffb800') };
  TEX.ceu = textura(4, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3f9cf0'); g.addColorStop(0.6, '#8fd0ff'); g.addColorStop(1, '#dff1ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  TEX.brilho = textura(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
}

// Material "desenho animado": poucas faixas de luz, como nos jogos de corrida em 3D.
let GRADIENTE = null;
function toon(cor, extra = {}) {
  if (!GRADIENTE) {
    GRADIENTE = new THREE.DataTexture(new Uint8Array([90, 160, 220, 255]), 4, 1, THREE.RedFormat);
    GRADIENTE.minFilter = THREE.NearestFilter; GRADIENTE.magFilter = THREE.NearestFilter; GRADIENTE.needsUpdate = true;
  }
  return new THREE.MeshToonMaterial({ color: cor, gradientMap: GRADIENTE, ...extra });
}

const sombrear = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

// ---------- A menina em 3D ----------
const CABELO = 0x6b3a1f;
const CABELO_CLARO = 0x8a5230;
const SHORT = 0x2f3446;

function capsula(raio, comp, cor) {
  return sombrear(new THREE.Mesh(new THREE.CapsuleGeometry(raio, comp, 6, 12), toon(cor)));
}

// Uma mecha ondulada: faixa curva que acompanha a nuca e cai nas costas.
function mechaGeometria(largura, comprimento, curvatura) {
  const g = new THREE.PlaneGeometry(largura, comprimento, 8, 14);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); const y = pos.getY(i);
    const t = (comprimento / 2 - y) / comprimento; // 0 no alto, 1 nas pontas
    const ang = (x / largura) * curvatura;
    const raio = 0.16 + t * 0.02;
    const onda = Math.sin(t * 9 + x * 6) * 0.018 * t;
    pos.setXYZ(i, Math.sin(ang) * raio + onda * 0.5, y, -Math.cos(ang) * raio - t * 0.05 + onda);
  }
  g.computeVertexNormals();
  return g;
}

function criarMenina() {
  const raiz = new THREE.Group();
  const corpo = new THREE.Group(); // inclina ao deslizar
  raiz.add(corpo);
  const mat = {
    pele: toon(PELES[1]), roupa: toon(ROUPAS[0]), short: toon(SHORT), cabelo: toon(CABELO, { side: THREE.DoubleSide }),
    cabeloClaro: toon(CABELO_CLARO), branco: toon(0xffffff), sola: toon(ROUPAS[0]),
  };
  const peca = (geo, m) => sombrear(new THREE.Mesh(geo, m));

  // pernas: quadril -> joelho -> pé
  const pernas = [-1, 1].map((lado) => {
    const coxa = new THREE.Group(); coxa.position.set(lado * 0.085, 0.62, 0);
    const mCoxa = peca(new THREE.CapsuleGeometry(0.06, 0.2, 6, 10), mat.pele); mCoxa.position.y = -0.14; coxa.add(mCoxa);
    const joelho = new THREE.Group(); joelho.position.y = -0.29; coxa.add(joelho);
    const mCanela = peca(new THREE.CapsuleGeometry(0.048, 0.19, 6, 10), mat.pele); mCanela.position.y = -0.13; joelho.add(mCanela);
    const meia = peca(new THREE.CylinderGeometry(0.052, 0.05, 0.05, 12), mat.branco); meia.position.y = -0.25; joelho.add(meia);
    const tenis = new THREE.Group(); tenis.position.set(0, -0.3, 0.03); joelho.add(tenis);
    const cabedal = peca(new THREE.BoxGeometry(0.11, 0.08, 0.21), mat.branco); tenis.add(cabedal);
    const bico = peca(new THREE.SphereGeometry(0.055, 12, 8), mat.branco); bico.scale.set(1, 0.75, 1); bico.position.set(0, -0.005, 0.1); tenis.add(bico);
    const sola = peca(new THREE.BoxGeometry(0.12, 0.03, 0.25), mat.sola); sola.position.set(0, -0.045, 0.02); tenis.add(sola);
    corpo.add(coxa);
    return { coxa, joelho };
  });

  // tronco (a partir do quadril)
  const tronco = new THREE.Group(); tronco.position.y = 0.62; corpo.add(tronco);
  const short = peca(new THREE.CylinderGeometry(0.15, 0.16, 0.18, 16), mat.short); short.position.y = 0.04; short.scale.z = 0.8; tronco.add(short);
  const camiseta = peca(new THREE.CapsuleGeometry(0.14, 0.18, 6, 16), mat.roupa); camiseta.position.y = 0.27; camiseta.scale.set(1.05, 1, 0.78); tronco.add(camiseta);
  for (const lado of [-1, 1]) {
    const recorte = peca(new THREE.BoxGeometry(0.02, 0.26, 0.2), mat.branco); recorte.position.set(lado * 0.142, 0.26, 0); tronco.add(recorte);
  }
  const pescoco = peca(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10), mat.pele); pescoco.position.y = 0.47; tronco.add(pescoco);

  // braços: ombro -> cotovelo -> mão
  const bracos = [-1, 1].map((lado) => {
    const ombro = new THREE.Group(); ombro.position.set(lado * 0.175, 0.41, 0); tronco.add(ombro);
    const manga = peca(new THREE.CylinderGeometry(0.058, 0.052, 0.1, 12), mat.roupa); manga.position.y = -0.03; ombro.add(manga);
    const mBraco = peca(new THREE.CapsuleGeometry(0.04, 0.15, 6, 10), mat.pele); mBraco.position.y = -0.11; ombro.add(mBraco);
    const cotovelo = new THREE.Group(); cotovelo.position.y = -0.21; ombro.add(cotovelo);
    const mAnte = peca(new THREE.CapsuleGeometry(0.035, 0.13, 6, 10), mat.pele); mAnte.position.y = -0.09; cotovelo.add(mAnte);
    const mao = peca(new THREE.SphereGeometry(0.042, 12, 8), mat.pele); mao.position.y = -0.19; cotovelo.add(mao);
    return { ombro, cotovelo };
  });

  // cabeça, cabelo ondulado nas costas e faixa esportiva
  const cabeca = new THREE.Group(); cabeca.position.y = 0.6; tronco.add(cabeca);
  const rosto = peca(new THREE.SphereGeometry(0.15, 24, 18), mat.pele); rosto.scale.set(0.95, 1.05, 0.95); cabeca.add(rosto);
  for (const lado of [-1, 1]) { const orelha = peca(new THREE.SphereGeometry(0.03, 10, 8), mat.pele); orelha.position.set(lado * 0.145, -0.01, -0.01); cabeca.add(orelha); }
  const topo = peca(new THREE.SphereGeometry(0.162, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), mat.cabelo);
  topo.position.set(0, 0.01, -0.012); topo.scale.set(1, 1.04, 1.02); cabeca.add(topo);
  const nuca = peca(new THREE.SphereGeometry(0.16, 20, 14, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.3, Math.PI * 0.45), mat.cabelo);
  nuca.rotation.y = Math.PI; nuca.position.z = -0.01; cabeca.add(nuca);
  const cabelo = new THREE.Group(); cabelo.position.set(0, 0.02, -0.005); cabeca.add(cabelo);
  const mechaPrincipal = peca(mechaGeometria(0.3, 0.46, 2.4), mat.cabelo); mechaPrincipal.position.y = -0.2; cabelo.add(mechaPrincipal);
  for (const [dx, comp, rot] of [[-0.06, 0.4, 0.08], [0.06, 0.42, -0.08], [0, 0.44, 0]]) {
    const m = peca(mechaGeometria(0.1, comp, 0.9), mat.cabeloClaro);
    m.position.set(dx, -0.19, -0.012); m.rotation.y = rot; cabelo.add(m);
  }
  const faixa = peca(new THREE.TorusGeometry(0.158, 0.018, 8, 32), mat.roupa);
  faixa.rotation.x = Math.PI / 2 - 0.35; faixa.position.y = 0.05; cabeca.add(faixa);

  // acessórios: skate, maleta e auras
  const skate = new THREE.Group(); raiz.add(skate);
  const deck = peca(new THREE.BoxGeometry(0.34, 0.045, 1.0), toon(0xd79a5b)); deck.position.y = 0.07; skate.add(deck);
  const rodas = new THREE.Group(); skate.add(rodas);
  for (const dz of [-0.32, 0.32]) for (const dx of [-0.12, 0.12]) {
    const r = peca(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), toon(0xe5484d)); r.rotation.z = Math.PI / 2; r.position.set(dx, 0.03, dz); rodas.add(r);
  }
  const brilhoSkate = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.brilho, color: 0x5ae6ff, transparent: true, depthWrite: false }));
  brilhoSkate.scale.set(0.9, 0.9, 1); brilhoSkate.position.y = 0.02; skate.add(brilhoSkate);
  const fogo = (cor) => {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 10), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 }));
    cone.rotation.x = Math.PI; cone.position.y = -0.16; g.add(cone);
    const miolo = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
    miolo.rotation.x = Math.PI; miolo.position.y = -0.1; g.add(miolo);
    return g;
  };
  const chamasSkate = [-0.1, 0.1].map((dx) => { const f = fogo(0xff7a1f); f.rotation.x = -Math.PI / 2; f.position.set(dx, 0.07, -0.5); skate.add(f); return f; });
  const maleta = new THREE.Group(); maleta.position.set(0, 0.28, -0.16); tronco.add(maleta);
  const caixa = peca(new THREE.BoxGeometry(0.3, 0.32, 0.14), toon(0xa2622d)); maleta.add(caixa);
  const fecho = peca(new THREE.BoxGeometry(0.31, 0.03, 0.15), toon(0xe8c27a)); fecho.position.y = 0.04; maleta.add(fecho);
  const chamasMaleta = [-0.08, 0.08].map((dx) => { const f = fogo(0xff9a1f); f.position.set(dx, -0.16, 0); maleta.add(f); return f; });
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.brilho, transparent: true, depthWrite: false, opacity: 0.55 }));
  aura.scale.set(1.6, 2.2, 1); aura.position.y = 0.75; raiz.add(aura);

  let visual = '';
  function vestir(pele, roupa) {
    const chave = `${pele}-${roupa}`;
    if (chave === visual) return;
    visual = chave;
    mat.pele.color.set(PELES[pele] ?? PELES[1]);
    mat.roupa.color.set(ROUPAS[roupa] ?? ROUPAS[0]);
    mat.sola.color.set(ROUPAS[roupa] ?? ROUPAS[0]);
  }

  const SKATE_COR = { classico: 0xd79a5b, voador: 0x29b7dc, supersonico: 0xd83a2c };
  // Pose a cada quadro, a partir do estado da corrida.
  function posar(s, t) {
    const noAr = s.y > 0.05 || s.voo > 0;
    const naPrancha = s.skate > 0;
    const fase = s.dist * 1.55;
    raiz.position.set(xDe(s.x), s.y + (naPrancha ? 0.1 : 0), 0);
    // inclina para o lado ao trocar de faixa
    raiz.rotation.z = (s.x - s.faixa) * 0.25;
    corpo.rotation.x = 0; corpo.position.y = 0; corpo.position.z = 0;
    tronco.rotation.x = 0.14;
    cabelo.rotation.x = 0.1 + Math.sin(fase * 2) * 0.05;
    if (s.deslizando > 0 && s.y < 0.2) {
      corpo.rotation.x = -1.0; corpo.position.y = 0.12; corpo.position.z = 0.75;
      for (const p of pernas) { p.coxa.rotation.x = -0.3; p.joelho.rotation.x = 0.1; }
      for (const b of bracos) { b.ombro.rotation.x = -0.3; b.cotovelo.rotation.x = -0.4; }
      cabelo.rotation.x = 0.6;
    } else if (s.voo > 0) {
      pernas.forEach((p, k) => { p.coxa.rotation.x = 0.15 + k * 0.2 + Math.sin(t * 6 + k) * 0.08; p.joelho.rotation.x = 0.5; });
      bracos.forEach((b, k) => { b.ombro.rotation.x = -0.4; b.ombro.rotation.z = (k ? 1 : -1) * 0.9; b.cotovelo.rotation.x = -0.3; });
      cabelo.rotation.x = 0.5 + Math.sin(t * 9) * 0.08;
    } else if (naPrancha && !noAr) {
      pernas.forEach((p, k) => { p.coxa.rotation.x = k ? 0.35 : -0.35; p.joelho.rotation.x = 0.45; });
      bracos.forEach((b, k) => { b.ombro.rotation.x = 0; b.ombro.rotation.z = (k ? 1 : -1) * 0.7; b.cotovelo.rotation.x = -0.5; });
      cabelo.rotation.x = 0.35 + Math.sin(t * 7) * 0.06;
    } else if (noAr) {
      pernas.forEach((p, k) => { p.coxa.rotation.x = k ? -1.0 : -0.3; p.joelho.rotation.x = k ? 1.5 : 0.7; });
      bracos.forEach((b, k) => { b.ombro.rotation.x = -2.4 + k * 0.4; b.ombro.rotation.z = (k ? 1 : -1) * 0.3; b.cotovelo.rotation.x = -0.6; });
      cabelo.rotation.x = 0.45;
    } else {
      pernas.forEach((p, k) => {
        const sw = Math.sin(fase + (k ? Math.PI : 0));
        p.coxa.rotation.x = -sw * 0.75;
        p.joelho.rotation.x = 0.25 + Math.max(0, sw) * 1.35;
      });
      bracos.forEach((b, k) => {
        const sw = Math.sin(fase + (k ? 0 : Math.PI));
        b.ombro.rotation.x = -sw * 0.85;
        b.ombro.rotation.z = (k ? 1 : -1) * 0.12;
        b.cotovelo.rotation.x = -1.35;
      });
      corpo.position.y = Math.abs(Math.cos(fase)) * 0.045;
    }
    // acessórios
    skate.visible = naPrancha;
    if (naPrancha) {
      deck.material.color.setHex(SKATE_COR[s.skateTipo] ?? SKATE_COR.classico);
      rodas.visible = s.skateTipo === 'classico';
      brilhoSkate.visible = s.skateTipo === 'voador';
      chamasSkate.forEach((f) => { f.visible = s.skateTipo === 'supersonico'; f.scale.setScalar(0.8 + Math.random() * 0.4); });
      skate.position.y = -0.1 + (s.skateTipo === 'voador' ? 0.05 + Math.sin(t * 5) * 0.025 : 0);
    }
    maleta.visible = s.voo > 0;
    chamasMaleta.forEach((f) => f.scale.set(1, 0.7 + Math.random() * 0.6, 1));
    const corAura = s.supercarga > 0 ? 0xffc828 : s.escudo ? 0x50aaff : s.ima > 0 ? 0xff5a5a : null;
    aura.visible = corAura !== null;
    if (corAura !== null) { aura.material.color.setHex(corAura); aura.material.opacity = 0.45 + Math.sin(t * 8) * 0.1; }
    raiz.visible = !(s.invencivel > 0 && Math.floor(t * 12) % 2 === 0);
  }

  return { raiz, vestir, posar };
}

// ---------- Objetos da pista ----------
function criarObjeto(o) {
  const g = new THREE.Group();
  const larg = FAIXA * 0.86;
  if (o.tipo === 'cerca') {
    for (const lado of [-1, 1]) {
      const poste = sombrear(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), toon(0xffffff)));
      poste.position.set(lado * (larg / 2 - 0.05), 0.3, 0); g.add(poste);
    }
    for (const y of [0.42, 0.2]) {
      const tabua = sombrear(new THREE.Mesh(new THREE.BoxGeometry(larg, 0.14, 0.06), [toon(0xffffff), toon(0xffffff), toon(0xffffff), toon(0xffffff), toon(0xffffff, { map: TEX.listras }), toon(0xffffff, { map: TEX.listras })]));
      tabua.position.y = y; g.add(tabua);
    }
  } else if (o.tipo === 'faixa') {
    for (const lado of [-1, 1]) {
      const poste = sombrear(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.1, 10), toon(0x6b5f8a)));
      poste.position.set(lado * (larg / 2), 1.05, 0); g.add(poste);
    }
    const placa = sombrear(new THREE.Mesh(new THREE.BoxGeometry(larg, 0.32, 0.06), [toon(0x5b4bd6), toon(0x5b4bd6), toon(0x5b4bd6), toon(0x5b4bd6), toon(0xffffff, { map: TEX.banner }), toon(0xffffff, { map: TEX.banner })]));
    placa.position.y = 1.86; g.add(placa);
    const cores = [0xffd21f, 0xff6f91, 0x3fb6a8];
    for (const [altura, desloc] of [[1.62, 0], [1.3, 1]]) {
      for (let k = 0; k < 7; k++) {
        const bandeira = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 3), toon(cores[(k + desloc) % 3], { side: THREE.DoubleSide }));
        const x = -larg / 2 + ((k + 0.5) * larg) / 7;
        bandeira.position.set(x, altura - 0.1 - Math.sin(((k + 0.5) / 7) * Math.PI) * 0.1, 0);
        bandeira.rotation.x = Math.PI;
        bandeira.scale.z = 0.25;
        g.add(bandeira);
      }
    }
  } else if (o.tipo === 'carrinho') {
    const comp = o.comp ?? 5;
    const lados = toon(0xffffff, { map: TEX.caminhao });
    const branco = toon(0xfffaf2);
    const bau = sombrear(new THREE.Mesh(new THREE.BoxGeometry(larg, 1.05, comp - 0.9), [lados, lados, toon(0xff6f91), branco, branco, branco]));
    bau.position.set(0, 0.72, comp / 2 + 0.45); g.add(bau);
    const cabine = sombrear(new THREE.Mesh(new THREE.BoxGeometry(larg, 0.85, 0.9), [branco, branco, branco, branco, branco, toon(0xffffff, { map: TEX.frenteCaminhao })]));
    cabine.position.set(0, 0.62, 0.45); // a face -z (com o para-brisa) olha para ela
    g.add(cabine);
    const toldo = sombrear(new THREE.Mesh(new THREE.BoxGeometry(larg + 0.1, 0.08, comp - 0.8), toon(0xff4f81)));
    toldo.position.set(0, 1.28, comp / 2 + 0.45); g.add(toldo);
    const casquinha = sombrear(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 12), toon(0xe9b36a)));
    casquinha.rotation.x = Math.PI; casquinha.position.set(0, 1.55, comp / 2 + 0.5); g.add(casquinha);
    const bola = sombrear(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), toon(0xff8fb1)));
    bola.position.set(0, 1.78, comp / 2 + 0.5); g.add(bola);
    for (const dz of [0.5, comp - 0.6]) for (const lado of [-1, 1]) {
      const roda = sombrear(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), toon(0x2b2e38)));
      roda.rotation.z = Math.PI / 2; roda.position.set(lado * (larg / 2 - 0.02), 0.2, dz); g.add(roda);
    }
  } else if (o.tipo === 'moeda') {
    const m = new THREE.Mesh(GEO_MOEDA, MAT_MOEDA);
    m.rotation.x = Math.PI / 2;
    m.castShadow = true;
    g.add(m);
    g.userData.gira = g;
  } else {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.poder[o.tipo] ?? TEX.poder.raio }));
    sp.scale.set(0.62, 0.62, 1);
    g.add(sp);
    g.userData.flutua = true;
  }
  return g;
}
let GEO_MOEDA; let MAT_MOEDA;

// ---------- Cenário: prédios, árvores e postes que se repetem ----------
const CORES_PREDIO = [0xffb38a, 0x8fd3c7, 0xc3b4ff, 0xffd97a, 0xff9fb2, 0x9cc9ff, 0xf2efe6];
function criarCenario(cena) {
  const itens = [];
  const xBorda = LARG_RUA / 2 + CALCADA;
  for (const lado of [-1, 1]) {
    let z = -12;
    while (z < COMP_CENA - 12) {
      const larg = 4 + Math.random() * 4;
      const alt = 6 + Math.random() * 12;
      const prof = 5 + Math.random() * 3;
      const cor = CORES_PREDIO[Math.floor(Math.random() * CORES_PREDIO.length)];
      const tex = TEX.janelas.clone(); tex.needsUpdate = true; tex.repeat.set(Math.max(1, Math.round(prof / 2.6)), Math.max(1, Math.round(alt / 4)));
      const fachada = toon(cor, { map: tex });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(prof, alt, larg), [fachada, fachada, toon(cor), toon(cor), fachada, fachada]);
      mesh.receiveShadow = true;
      mesh.position.set(lado * (xBorda + 0.6 + prof / 2), alt / 2, z + larg / 2);
      const telhado = new THREE.Mesh(new THREE.BoxGeometry(prof + 0.3, 0.3, larg + 0.3), toon(new THREE.Color(cor).multiplyScalar(0.8)));
      telhado.position.y = alt / 2 + 0.15; mesh.add(telhado);
      cena.add(mesh);
      itens.push({ mesh, z0: z + larg / 2 });
      z += larg + 0.4;
    }
    for (let k = 0; k < COMP_CENA / 9; k++) {
      const arvore = new THREE.Group();
      const tronco = sombrear(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 8), toon(0x8a5a3c)));
      tronco.position.y = 0.7; arvore.add(tronco);
      for (const [dx, dy, r] of [[0, 1.9, 0.75], [-0.35, 1.55, 0.5], [0.35, 1.6, 0.5]]) {
        const copa = sombrear(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), toon(0x3fae5a, { flatShading: true })));
        copa.position.set(dx, dy, 0); arvore.add(copa);
      }
      arvore.position.set(lado * (LARG_RUA / 2 + CALCADA * 0.55), 0.15, 0);
      cena.add(arvore);
      itens.push({ mesh: arvore, z0: -12 + k * 9 + (lado > 0 ? 4.5 : 0) });
    }
    for (let k = 0; k < COMP_CENA / 18; k++) {
      const poste = new THREE.Group();
      const haste = sombrear(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 8), toon(0x4d5466)));
      haste.position.y = 1.6; poste.add(haste);
      const braco = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), toon(0x4d5466)); braco.position.set(-lado * 0.35, 3.15, 0); poste.add(braco);
      const luz = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); luz.position.set(-lado * 0.68, 3.05, 0); poste.add(luz);
      poste.position.set(lado * (LARG_RUA / 2 + 0.35), 0.15, 0);
      cena.add(poste);
      itens.push({ mesh: poste, z0: -12 + k * 18 + 6 });
    }
  }
  return itens;
}

// ---------- Mundo ----------
export function criarMundo(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  prepararTexturas();
  GEO_MOEDA ??= new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24);
  MAT_MOEDA ??= [toon(0xe0a000), toon(0xffffff, { map: TEX.moeda }), toon(0xffffff, { map: TEX.moeda })];
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const cena = new THREE.Scene();
  cena.background = TEX.ceu;
  cena.fog = new THREE.Fog(0xcfe9ff, 38, LONGE + 18);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200);

  cena.add(new THREE.HemisphereLight(0xdff1ff, 0x7a8a6a, 1.1));
  const sol = new THREE.DirectionalLight(0xffffff, 1.6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -7, right: 7, top: 22, bottom: -6, near: 1, far: 40 });
  sol.shadow.bias = -0.0005;
  cena.add(sol, sol.target);

  // chão: rua, calçadas e grama, com textura que corre
  const rua = new THREE.Mesh(new THREE.PlaneGeometry(LARG_RUA, COMP_CENA), toon(0xffffff, { map: TEX.rua }));
  TEX.rua.repeat.set(1, COMP_CENA / 8);
  rua.rotation.x = -Math.PI / 2; rua.position.set(0, 0, COMP_CENA / 2 - 12); rua.receiveShadow = true;
  cena.add(rua);
  const texCalc = TEX.calcada; texCalc.repeat.set(CALCADA / 1.2, COMP_CENA / 1.2);
  for (const lado of [-1, 1]) {
    const calc = new THREE.Mesh(new THREE.BoxGeometry(CALCADA, 0.15, COMP_CENA), toon(0xffffff, { map: texCalc }));
    calc.position.set(lado * (LARG_RUA / 2 + CALCADA / 2), 0.075, COMP_CENA / 2 - 12); calc.receiveShadow = true;
    cena.add(calc);
    const meioFio = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.17, COMP_CENA), toon(0xff8fa3));
    meioFio.position.set(lado * (LARG_RUA / 2 + 0.08), 0.085, COMP_CENA / 2 - 12);
    cena.add(meioFio);
  }
  TEX.grama.repeat.set(20, COMP_CENA / 4);
  const grama = new THREE.Mesh(new THREE.PlaneGeometry(80, COMP_CENA), toon(0xffffff, { map: TEX.grama }));
  grama.rotation.x = -Math.PI / 2; grama.position.set(0, -0.02, COMP_CENA / 2 - 12);
  cena.add(grama);

  const cenario = criarCenario(cena);
  const menina = criarMenina();
  cena.add(menina.raiz);
  const objetos = new Map();
  let camX = 0; let camY = 3; let largura = 1; let altura = 1;

  function redimensionar(w, h, dpr) {
    largura = w; altura = h;
    renderer.setPixelRatio(Math.min(2, dpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.7 ? 66 : 58;
    camera.updateProjectionMatrix();
  }

  function desenhar(s, t, visual) {
    const dist = s.dist;
    menina.vestir(visual.pele, visual.roupa);
    menina.posar(s, t);

    // chão e cenário andando
    TEX.rua.offset.y = (dist / 8) % 1;
    texCalc.offset.y = (dist / 1.2) % 1;
    TEX.grama.offset.y = (dist / 4) % 1;
    for (const it of cenario) {
      const z = ((it.z0 + 12 - dist) % COMP_CENA + COMP_CENA) % COMP_CENA - 12;
      it.mesh.position.z = z;
    }

    // objetos da lógica
    const vistos = new Set();
    for (const o of s.objetos) {
      if (o.pego || o.quebrado || o.z > LONGE + 2) continue;
      let m = objetos.get(o);
      if (!m) { m = criarObjeto(o); objetos.set(o, m); cena.add(m); }
      vistos.add(o);
      m.position.set(xDe(o.faixa), o.h ?? 0, o.z);
      if (m.userData.gira) m.rotation.y = t * 4 + o.z * 0.3;
      if (m.userData.flutua) m.position.y = (o.h ?? 0.7) + Math.sin(t * 4 + o.z) * 0.08;
    }
    for (const [o, m] of objetos) {
      if (vistos.has(o)) continue;
      cena.remove(m);
      m.traverse((x) => { if (x.geometry && x.geometry !== GEO_MOEDA) x.geometry.dispose(); });
      objetos.delete(o);
    }

    // câmera atrás e acima, seguindo de leve a faixa e a altura
    const px = xDe(s.x);
    camX += (px * 0.75 - camX) * 0.12;
    camY += (2.35 + Math.max(0, s.y - 0.4) * 0.8 - camY) * 0.1;
    camera.position.set(camX, camY, -2.9);
    camera.lookAt(px * 0.85, 0.95 + s.y * 0.6, 6);
    sol.position.set(px - 4, 9, -2);
    sol.target.position.set(px, 0, 6);
    renderer.render(cena, camera);
  }

  function destruir() {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  return { redimensionar, desenhar, destruir };
}
