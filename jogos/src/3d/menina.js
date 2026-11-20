// A menina em 3D, mais realista: material que reage à luz como pele e tecido, braços e pernas
// com formato de músculo (torneados), roupa com textura de tecido, tênis detalhado e cabelo
// ondulado feito de várias mechas que balançam separadas.
import { THREE, xDe, textura, ruido, sombrear, texBrilho, desenho } from './base.js';
import { PELES, ROUPAS } from '../personagem.js';
import { personagemDe, usa } from '../personagens.js';
import { geoCabeca, superficieDe, texRosto, texIris, criarOlho, PALPEBRA_FECHADA, tuboAfinado, geoCabelo, geoCabeleira, texCabeleira, geoCacho, geoCorpo, vPorTrechos, criarMao, criarTenis, fundirGeos } from './anatomia.js';

const CABELO = ['#2c1a10', '#331e12', '#3b2316', '#46291a', '#52301f']; // castanho-escuro, com pontas um pouco mais claras

// Peça torneada: perfil (raio, altura) girado em volta do eixo vertical.
function torneada(perfil, segmentos = 20) {
  return new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), segmentos);
}

// Braço e perna "com pele": cada parte é uma malha que acompanha os dois ossos (de cima e de baixo).
// Perto da junta, os vértices seguem um pouco de cada osso, então o cotovelo e o joelho dobram
// como borracha, sem emenda nem bolinha. O perfil é dado nas coordenadas do osso de cima.
function membro(perfil, material, ossoCima, ossoBaixo, yJunta, faixa, zEscala = 1, segmentos = 20, forma = null, yEscala = 1) {
  const geo = torneada(perfil, segmentos);
  geo.scale(1, 1, zEscala);
  const pos = geo.attributes.position;
  if (forma) { // músculos: desloca os pontos em x e z conforme a altura
    for (let i = 0; i < pos.count; i++) { const [x, z] = forma(pos.getX(i), pos.getY(i), pos.getZ(i)); pos.setX(i, x); pos.setZ(i, z); }
    geo.computeVertexNormals();
  }
  if (yEscala !== 1) { geo.scale(1, yEscala, 1); yJunta *= yEscala; faixa *= yEscala; } // membro mais curto, com a junta no lugar certo
  const indices = []; const pesos = [];
  for (let i = 0; i < pos.count; i++) {
    const x = Math.min(1, Math.max(0, (yJunta + faixa - pos.getY(i)) / (2 * faixa)));
    const w = x * x * (3 - 2 * x);
    indices.push(0, 1, 0, 0); pesos.push(1 - w, w, 0, 0);
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(pesos, 4));
  const malha = new THREE.SkinnedMesh(geo, material);
  malha.frustumCulled = false;
  ossoCima.add(malha);
  ossoCima.updateMatrixWorld(true);
  malha.bind(new THREE.Skeleton([ossoCima, ossoBaixo]));
  return malha;
}

// Pele: um pouco de brilho rasante (como a luz que atravessa a pele nas bordas) e sem cara de plástico.
function pele(cor, extra = {}) { return desenho({ color: cor, ...extra }); }

// ---------- Tecidos dos estilos (desenhados na hora) ----------
// Nas peças torneadas, u = 0 é a frente, 0,25 e 0,75 as laterais e 0,5 as costas.
function malhaFina(ctx, w, h) {
  ctx.strokeStyle = 'rgba(0,0,0,.05)';
  for (let y = 0; y < h; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}
function clarear(cor, t) {
  const c = new THREE.Color(cor); c.lerp(new THREE.Color(0xffffff), t); return `#${c.getHexString()}`;
}
function escurecer(cor, t) {
  const c = new THREE.Color(cor); c.lerp(new THREE.Color(0x000000), t); return `#${c.getHexString()}`;
}
const texto = (ctx, txt, x, y, tam, cor, contorno) => {
  ctx.font = `900 ${tam}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (contorno) { ctx.lineWidth = tam * 0.14; ctx.strokeStyle = contorno; ctx.strokeText(txt, x, y); }
  ctx.fillStyle = cor; ctx.fillText(txt, x, y);
};

function xadrez(ctx, w, h, cor, escuro = '#1d2130', passo = 32) {
  ctx.fillStyle = cor; ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.55; ctx.fillStyle = escuro;
  for (let x = 0; x < w; x += passo) ctx.fillRect(x, 0, passo / 2, h);
  for (let y = 0; y < h; y += passo) ctx.fillRect(0, y, w, passo / 2);
  ctx.globalAlpha = 0.8; ctx.fillStyle = '#ffffff';
  for (let x = passo * 0.75; x < w; x += passo) ctx.fillRect(x, 0, 2, h);
  for (let y = passo * 0.75; y < h; y += passo) ctx.fillRect(0, y, w, 2);
  ctx.globalAlpha = 1;
}

function jeans(ctx, w, h, comPatches) {
  ctx.fillStyle = '#4a6fa5'; ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 2500; k++) { ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,30,.1)'; ctx.fillRect(Math.random() * w, Math.random() * h, 3, 1); }
  ctx.strokeStyle = '#e8a33a'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
  for (const u of [0.25, 0.75]) { ctx.beginPath(); ctx.moveTo(w * u - 6, 0); ctx.lineTo(w * u - 6, h); ctx.moveTo(w * u + 6, 0); ctx.lineTo(w * u + 6, h); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, h * 0.62); ctx.lineTo(w, h * 0.62); ctx.stroke();
  ctx.setLineDash([]);
  if (comPatches) {
    // patches nas costas: coração, estrela e carinha feliz
    texto(ctx, '♥', w * 0.44, h * 0.32, 46, '#ff4f81', '#ffffff');
    texto(ctx, '★', w * 0.56, h * 0.42, 44, '#ffd21f', '#ffffff');
    ctx.fillStyle = '#ffd21f'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.78, 22, 0, 7); ctx.fill();
    ctx.fillStyle = '#1d1b18'; ctx.beginPath(); ctx.arc(w * 0.5 - 7, h * 0.78 - 5, 3, 0, 7); ctx.arc(w * 0.5 + 7, h * 0.78 - 5, 3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1d1b18'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.78 + 2, 10, 0.2, Math.PI - 0.2); ctx.stroke();
  }
}

function tieDye(ctx, w, h, cor) {
  const cores = [cor, '#ff4f81', '#ffd21f', '#35c46a', '#3e8bff', '#9b5cf6'];
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  for (const [cx, cy] of [[w * 0.5, h * 0.45], [0, h * 0.45], [w, h * 0.45]]) {
    for (let r = Math.max(w, h); r > 0; r -= 14) {
      ctx.fillStyle = cores[Math.floor(r / 14) % cores.length];
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.2) ctx.lineTo(cx + Math.cos(a) * r * (1 + 0.12 * Math.sin(a * 5 + r / 20)), cy + Math.sin(a) * r * 0.6);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Parte de cima de cada estilo.
function texParteDeCima(estilo, cor) {
  return textura(512, 256, (ctx, w, h) => {
    if (estilo === 'moletom') {
      // moletom branco com raglan azul-marinho (faixas que descem do pescoço para as axilas) e o número na frente e nas costas
      const marinho = '#1f2a52';
      ctx.fillStyle = '#f6f4ee'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = marinho;
      for (const u of [0.25, 0.75]) {
        ctx.beginPath(); ctx.moveTo(w * u - 70, 0); ctx.lineTo(w * u + 70, 0); ctx.lineTo(w * u + 26, h * 0.42); ctx.lineTo(w * u - 26, h * 0.42); ctx.fill();
      }
      ctx.fillStyle = '#e8e5dc'; ctx.fillRect(0, h - 22, w, 22); // barra canelada
      ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 0; x < w; x += 5) ctx.fillRect(x, h - 22, 2, 22);
      texto(ctx, '91', w * 0.5, h * 0.6, 104, marinho);
      texto(ctx, '91', 0, h * 0.6, 104, marinho); texto(ctx, '91', w, h * 0.6, 104, marinho);
      malhaFina(ctx, w, h);
    } else if (estilo === 'corredor') {
      // moletom azul de manga curta, barra laranja e o bonequinho correndo no peito e nas costas
      ctx.fillStyle = '#2748c4'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f28a1e'; ctx.fillRect(0, h - 20, w, 20);
      ctx.fillStyle = '#1f3aa6'; ctx.fillRect(w * 0.9, h * 0.6, w * 0.2, h * 0.2); ctx.fillRect(-w * 0.1, h * 0.6, w * 0.2, h * 0.2); // bolso canguru
      const boneco = (x, y, t) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(t, t); ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.arc(8, -30, 7, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(-4, 2); ctx.lineTo(10, 14); ctx.lineTo(4, 32); ctx.moveTo(-4, 2); ctx.lineTo(-18, 12); ctx.lineTo(-28, 4); ctx.moveTo(2, -14); ctx.lineTo(18, -6); ctx.lineTo(24, -16); ctx.moveTo(2, -14); ctx.lineTo(-14, -12); ctx.lineTo(-20, 0); ctx.stroke();
        ctx.restore();
      };
      boneco(0, h * 0.42, 0.9); boneco(w, h * 0.42, 0.9); boneco(w * 0.5, h * 0.45, 0.8);
      malhaFina(ctx, w, h);
    } else if (estilo === 'street') {
      ctx.fillStyle = cor; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = escurecer(cor, 0.15); ctx.fillRect(0, h - 26, w, 26); // barra canelada
      ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let x = 0; x < w; x += 6) ctx.fillRect(x, h - 26, 2, 26);
      ctx.fillStyle = escurecer(cor, 0.12); ctx.fillRect(w * 0.9, h * 0.55, w * 0.2, h * 0.3); ctx.fillRect(-w * 0.1, h * 0.55, w * 0.2, h * 0.3); // bolso canguru
      texto(ctx, 'CACHINHOS', w * 0.5, h * 0.5, 34, '#ffffff', escurecer(cor, 0.4));
      malhaFina(ctx, w, h);
    } else if (estilo === 'skatista') {
      ctx.fillStyle = clarear(cor, 0.75); ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = cor; ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 14, w, 14);
      // estampa grande nas costas: prancha e "SK8"
      ctx.save(); ctx.translate(w * 0.5, h * 0.42); ctx.rotate(-0.4);
      ctx.fillStyle = escurecer(cor, 0.2); ctx.beginPath(); ctx.ellipse(0, 0, 70, 20, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1d1b18'; for (const x of [-40, 40]) { ctx.beginPath(); ctx.arc(x, 24, 9, 0, 7); ctx.fill(); }
      ctx.restore();
      texto(ctx, 'SK8', w * 0.5, h * 0.74, 54, '#1d1b18', '#ffffff');
      malhaFina(ctx, w, h);
    } else if (estilo === 'jeans') {
      jeans(ctx, w, h, true);
    } else if (estilo === 'tiedye') {
      tieDye(ctx, w, h, cor);
      malhaFina(ctx, w, h);
    } else {
      ctx.fillStyle = cor; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4f4f4';
      for (const u of [0.25, 0.75]) ctx.fillRect(w * u - 14, 0, 28, h);
      texto(ctx, '★', w * 0.5, h * 0.62, 70, 'rgba(255,255,255,.92)');
      malhaFina(ctx, w, h);
    }
  });
}

// Parte de baixo de cada estilo (short, calça, bermuda ou legging).
function texParteDeBaixo(estilo, cor) {
  return textura(256, 128, (ctx, w, h) => {
    if (estilo === 'moletom') {
      ctx.fillStyle = '#1f2a52'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff'; for (const u of [0.25, 0.75]) { ctx.fillRect(w * u - 6, 0, 4, h); ctx.fillRect(w * u + 2, 0, 4, h); }
      ruido(ctx, w, h, 500, 'rgba(255,255,255,.04)', 1);
    } else if (estilo === 'street') {
      ctx.fillStyle = '#3a3f4f'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff'; for (const u of [0.25, 0.75]) ctx.fillRect(w * u - 3, 0, 6, h);
    } else if (estilo === 'skatista') {
      xadrez(ctx, w, h, escurecer(cor, 0.1));
    } else if (estilo === 'jeans') {
      jeans(ctx, w, h, false);
    } else if (estilo === 'corredor') {
      ctx.fillStyle = '#23242b'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f28a1e'; for (const u of [0.25, 0.75]) ctx.fillRect(w * u - 7, 0, 14, h);
    } else if (estilo === 'tiedye') {
      ctx.fillStyle = '#1f1a33'; ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 160; k++) { ctx.fillStyle = Math.random() < 0.5 ? cor : '#ffffff'; ctx.globalAlpha = 0.3 + Math.random() * 0.6; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = cor; for (const u of [0.25, 0.75]) ctx.fillRect(w * u - 3, 0, 6, h);
    } else {
      ctx.fillStyle = '#2f3446'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = cor; for (const u of [0.25, 0.75]) ctx.fillRect(w * u - 4, 0, 8, h);
      ruido(ctx, w, h, 600, 'rgba(255,255,255,.04)', 1);
    }
  });
}

// Manga azul-marinho com estrelas brancas.
function texMangaEstrelas() {
  return textura(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1f2a52'; ctx.fillRect(0, 0, w, h);
    texto(ctx, '★', w * 0.3, h * 0.35, 40, '#ffffff');
    texto(ctx, '★', w * 0.8, h * 0.75, 30, '#ffffff');
  });
}

function texSaia(cor) {
  return textura(256, 64, (ctx, w, h) => { xadrez(ctx, w, h, '#c8352a', '#1d2130', 24); ctx.fillStyle = cor; ctx.globalAlpha = 0.25; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; });
}

function texMeiao(cor) {
  return textura(64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f7f7f7'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = cor; ctx.fillRect(0, 10, w, 8); ctx.fillRect(0, 24, w, 8);
    ruido(ctx, w, h, 200, 'rgba(0,0,0,.05)', 1);
  });
}

function criarTexturas() {
  const tecido = textura(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ruido(ctx, w, h, 3000, 'rgba(0,0,0,.035)', 1);
    ctx.strokeStyle = 'rgba(0,0,0,.04)';
    for (let y = 0; y < h; y += 2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }, true);
  const cabelo = textura(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 140; k++) {
      const x = Math.random() * w;
      const claro = Math.random() < 0.4;
      ctx.strokeStyle = claro ? 'rgba(255,230,200,.16)' : 'rgba(40,15,5,.14)';
      ctx.lineWidth = 0.6 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) ctx.lineTo(x + Math.sin(y / 30 + k) * 3, y);
      ctx.stroke();
    }
  }, true);
  const tenis = textura(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ruido(ctx, w, h, 600, 'rgba(0,0,0,.05)', 1);
  });
  return { tecido, cabelo, tenis };
}

// Mecha de cabelo: fita que nasce no alto da cabeça, contorna a nuca e cai nas costas, ondulando.
function mecha(angulo, comprimento, largura, fase, frente = false) {
  const g = new THREE.PlaneGeometry(largura, 1, 3, 22);
  const pos = g.attributes.position;
  const R = 0.152;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const t = 0.5 - pos.getY(i); // 0 na raiz, 1 na ponta
    const larg = 1 - t * 0.55; // afina na ponta
    let y; let r;
    const yCabeca = 0.11 - t * comprimento;
    if (yCabeca > -0.11) {
      // por cima da cabeça, colado na curva do crânio
      y = yCabeca;
      r = Math.sqrt(Math.max(0, R * R - y * y * 0.85)) + 0.012;
    } else {
      // abaixo da nuca: cai nas costas, abrindo um pouco
      y = yCabeca;
      const desce = -0.11 - y;
      r = frente ? 0.115 + Math.min(1, desce / 0.09) * 0.06 + desce * 0.05 : 0.115 + desce * 0.12;
    }
    const onda = Math.sin(t * 11 + fase) * 0.014 * Math.min(1, t * 2.5);
    const a = angulo + (lx * larg) / Math.max(0.08, r) + onda * 2;
    pos.setXYZ(i, Math.sin(a) * (r + onda * 0.4), y, -Math.cos(a) * (r + onda * 0.4));
  }
  g.computeVertexNormals();
  return g;
}

// Mochila a jato (também usada, menor, como item na pista).
export function criarMochilaJato() {
  const grupo = new THREE.Group();
  const lona = new THREE.MeshStandardMaterial({ color: 0x3e6fd6, roughness: 0.7 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9ced8, roughness: 0.3, metalness: 0.8 });
  const escuro = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.5, metalness: 0.5 });
  const corpo = sombrear(new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.14, 6, 14), lona)); corpo.scale.set(1.25, 1, 0.55); grupo.add(corpo);
  const bolso = sombrear(new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.05, 4, 12), new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.7 })));
  bolso.scale.set(1.3, 1, 0.5); bolso.position.set(0, -0.04, -0.05); grupo.add(bolso);
  for (const lado of [-1, 1]) {
    const alca = sombrear(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), escuro)); alca.rotation.y = Math.PI / 2; alca.position.set(lado * 0.08, 0.1, 0.06); grupo.add(alca);
  }
  const chamas = [];
  for (const lado of [-1, 1]) {
    const tanque = sombrear(new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.2, 6, 12), metal)); tanque.position.set(lado * 0.1, 0, -0.07); grupo.add(tanque);
    const anel = sombrear(new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.008, 6, 14), new THREE.MeshStandardMaterial({ color: 0xe5484d, roughness: 0.5 }))); anel.rotation.x = Math.PI / 2; anel.position.set(lado * 0.1, 0.06, -0.07); grupo.add(anel);
    const bocal = sombrear(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.06, 12), escuro)); bocal.position.set(lado * 0.1, -0.16, -0.07); grupo.add(bocal);
    const fogo = new THREE.Group(); fogo.position.set(lado * 0.1, -0.19, -0.07);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 10), new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9 })); cone.rotation.x = Math.PI; cone.position.y = -0.15; fogo.add(cone);
    const miolo = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xfff3a0 })); miolo.rotation.x = Math.PI; miolo.position.y = -0.09; fogo.add(miolo);
    grupo.add(fogo);
    chamas.push(fogo);
  }
  return { grupo, chamas };
}

// Disco voador: casco metálico, luzes coloridas na borda, cúpula de vidro, painel e raio trator.
// A menina vai sentada lá dentro; o mesmo modelo, pequeno, aparece na pista como item.
export function criarNave() {
  const grupo = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xb9c6d8, metalness: 0.75, roughness: 0.28 });
  const escuro = new THREE.MeshStandardMaterial({ color: 0x55627a, metalness: 0.6, roughness: 0.35 });
  const casco = sombrear(new THREE.Mesh(torneada([[0, -0.2], [0.4, -0.22], [1.0, -0.06], [1.2, 0], [1.02, 0.07], [0.62, 0.13], [0, 0.14]], 40), metal));
  grupo.add(casco);
  const faixa = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.035, 8, 48), escuro); faixa.rotation.x = Math.PI / 2; grupo.add(faixa);
  const CORES = [0xff4f81, 0x3be8ff, 0xffd23b, 0x6dff7a];
  const luzes = Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshStandardMaterial({ color: CORES[k % 4], emissive: CORES[k % 4], emissiveIntensity: 1.2 }));
    m.position.set(Math.cos(a) * 1.14, 0.0, Math.sin(a) * 1.14); grupo.add(m);
    return m;
  });
  const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.36, 28), new THREE.MeshBasicMaterial({ color: 0x7dffb5 }));
  fundo.rotation.x = Math.PI / 2; fundo.position.y = -0.215; grupo.add(fundo);
  // painel de controle na frente dela, com botões acesos
  const painel = sombrear(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.14), escuro)); painel.position.set(0, 0.24, 0.5); painel.rotation.x = -0.5; grupo.add(painel);
  for (let k = 0; k < 4; k++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: CORES[k] }));
    b.position.set(-0.15 + k * 0.1, 0.3, 0.46); grupo.add(b);
  }
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xaeeeff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }));
  cupula.position.y = 0.12; grupo.add(cupula);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.03, 8, 40), metal); aro.rotation.x = Math.PI / 2; aro.position.y = 0.12; grupo.add(aro);
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), metal); antena.position.y = 1.02; grupo.add(antena);
  const bolinha = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4f81 })); bolinha.position.y = 1.14; grupo.add(bolinha);
  // raio trator: um cone de luz verde que desce até o chão e puxa as moedas
  const feixe = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1, 28, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7dffb5, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  grupo.add(feixe);
  return { grupo, luzes, feixe };
}

export function criarMenina() {
  const tex = criarTexturas();
  const raiz = new THREE.Group();
  const corpo = new THREE.Group();
  raiz.add(corpo);
  const mat = {
    pele: pele(PELES[1]),
    rosto: pele(PELES[1], { map: texRosto() }),
    manga: desenho({ color: ROUPAS[0], roughness: 0.85, map: tex.tecido, side: THREE.DoubleSide }),
    palpebra: pele(PELES[1], { side: THREE.DoubleSide }),
    cachos: ['#2a180e', '#33200f', '#3d2414', '#472a17', '#54331c', '#3a2212'].map((c) => desenho({ color: c, roughness: 0.42 })),
    roupa: desenho({ color: ROUPAS[0], roughness: 0.85, map: tex.tecido }),
    camiseta: desenho({ color: 0xffffff, roughness: 0.85 }),
    shortTorneado: desenho({ color: 0xffffff, roughness: 0.9 }),
    branco: desenho({ color: 0xf7f7f7, roughness: 0.8, map: tex.tecido }),
    short: desenho({ color: 0x2f3446, roughness: 0.9, map: tex.tecido }),
    tenis: desenho({ color: 0xffffff, roughness: 0.6, map: tex.tenis }),
    sola: desenho({ color: 0xe6e8ec, roughness: 0.8 }),
    detalhe: desenho({ color: ROUPAS[0], roughness: 0.6 }),
    cadarco: desenho({ color: 0xdddddd, roughness: 0.7 }),
    cabelo: CABELO.map((c) => desenho({ color: c, roughness: 0.5, map: tex.cabelo, side: THREE.DoubleSide })),
    cabeleira: desenho({ color: CABELO[2], map: texCabeleira(7) }),
    cabeleiraDentro: new THREE.MeshBasicMaterial({ color: CABELO[0], side: THREE.BackSide }), // o lado de dentro do cabelo, na sombra
    cabeloLiso: desenho({ color: CABELO[2], roughness: 0.45, side: THREE.DoubleSide }),
    perna: desenho({ color: 0xffffff, roughness: 0.85 }), // calça, legging ou meião
    meiao: desenho({ color: 0xffffff, roughness: 0.85 }),
    mangaLonga: desenho({ color: 0xffffff, roughness: 0.85, map: tex.tecido }),
    saia: desenho({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }),
    jeans: desenho({ color: 0xffffff, roughness: 0.85 }),
    chapeu: desenho({ color: ROUPAS[0], roughness: 0.75, map: tex.tecido }),
    chapeu2: desenho({ color: 0xffffff, roughness: 0.75, map: tex.tecido }),
  };
  const peca = (geo, m) => sombrear(new THREE.Mesh(geo, m));

  // ---- pernas: quadril -> joelho -> pé ----
  // quadril: gira ao contrário dos ombros a cada passada, como numa corrida de verdade
  const PERNA = 0.84; // pernas mais curtas que o natural: proporção de desenho animado
  const ALTURA_QUADRIL = 0.62 - 0.585 * (1 - PERNA);
  const quadril = new THREE.Group(); quadril.position.y = ALTURA_QUADRIL; corpo.add(quadril);
  const sinoM = (v, c, w) => Math.exp(-(((v - c) / w) ** 2));
  // músculos da perna: a panturrilha salta para trás, a coxa é mais cheia na frente e a patela marca o joelho
  const formaPerna = (x, y, z) => {
    const tras = Math.max(0, -z) / 0.05; const frente = Math.max(0, z) / 0.05;
    return [x * 1.27 * (1 + 0.06 * sinoM(y, -0.39, 0.06)),
      z * 1.27 - 0.017 * sinoM(y, -0.385, 0.055) * tras + 0.007 * sinoM(y, -0.12, 0.09) * frente + 0.006 * sinoM(y, -0.285, 0.022) * frente - 0.004 * sinoM(y, -0.3, 0.03) * tras];
  };
  const pernas = [-1, 1].map((lado) => {
    const coxa = new THREE.Group(); coxa.position.set(lado * 0.076, 0, 0);
    const barra = peca(new THREE.CylinderGeometry(0.073, 0.076, 0.11, 22), mat.short); barra.position.y = -0.035; coxa.add(barra);
    const joelho = new THREE.Group(); joelho.position.y = -0.285 * PERNA; coxa.add(joelho);
    // coxa e canela com pele: o joelho dobra sem emenda
    const mCoxa = sombrear(membro([[0, 0.02], [0.062, 0.012], [0.074, -0.04], [0.072, -0.09], [0.064, -0.16], [0.055, -0.225], [0.049, -0.265], [0.0485, -0.285]], mat.pele, coxa, joelho, -0.285, 0.045, 0.94, 24, formaPerna, PERNA));
    const mCanela = sombrear(membro([[0.0485, -0.285], [0.048, -0.3], [0.046, -0.325], [0.05, -0.36], [0.051, -0.395], [0.044, -0.45], [0.034, -0.5], [0.029, -0.54], [0, -0.548]], mat.pele, coxa, joelho, -0.285, 0.045, 0.94, 24, formaPerna, PERNA));
    const meia = peca(new THREE.CylinderGeometry(0.035, 0.033, 0.06, 16), mat.branco); meia.position.y = -0.24 * PERNA - 0.012; joelho.add(meia);
    const dobraMeia = peca(new THREE.TorusGeometry(0.0345, 0.005, 6, 16), mat.branco); dobraMeia.rotation.x = Math.PI / 2; dobraMeia.position.y = 0.03; meia.add(dobraMeia);
    // tênis: solado com formato de pé, cabedal, biqueira, língua, cadarço cruzado e faixas
    const tenis = new THREE.Group(); tenis.position.set(0, -0.3 * PERNA, 0.035); joelho.add(tenis);
    const sapato = criarTenis({ cabedal: mat.tenis, sola: mat.sola, detalhe: mat.detalhe, cadarco: mat.cadarco, borracha: mat.sola });
    sapato.scale.setScalar(1.32); sapato.position.set(0, 0.031, -0.008); tenis.add(sapato);
    // cano alto (estilos street e jeans): sobe pelo tornozelo
    const cano = peca(new THREE.CylinderGeometry(0.041, 0.045, 0.07, 18), mat.tenis); cano.position.set(0, 0.07, -0.04); tenis.add(cano);
    const bordaCano = peca(new THREE.TorusGeometry(0.041, 0.008, 6, 18), mat.detalhe); bordaCano.rotation.x = Math.PI / 2; bordaCano.position.set(0, 0.105, -0.04); tenis.add(bordaCano);
    const barraCalca = peca(new THREE.CylinderGeometry(0.064, 0.056, 0.05, 18), mat.perna); barraCalca.position.y = -0.235 * PERNA - 0.012; joelho.add(barraCalca);
    const folgaCalca = peca(new THREE.SphereGeometry(0.072, 16, 10), mat.perna); folgaCalca.scale.set(1, 0.5, 1); folgaCalca.position.y = 0.03; barraCalca.add(folgaCalca); // a calça embola em cima do punho
    quadril.add(coxa);
    return { coxa, joelho, tenis, lado, mCoxa, mCanela, barra, meia, cano: [cano, bordaCano], barraCalca };
  });

  // ---- tronco ----
  const tronco = new THREE.Group(); tronco.position.y = ALTURA_QUADRIL; corpo.add(tronco);
  // bacia: mais larga embaixo, com volume atrás
  const short = peca(geoCorpo([[-0.094, 0.095, 0.085, -0.006], [-0.07, 0.14, 0.106, -0.012], [-0.02, 0.146, 0.112, -0.012], [0.05, 0.128, 0.097, -0.004], [0.1, 0.106, 0.08, 0.002]],
    vPorTrechos([[-0.09, 1], [-0.085, 0.833], [-0.07, 0.667], [-0.02, 0.5], [0.06, 0.333], [0.12, 0.167]]), 36), mat.shortTorneado);
  quadril.add(short);
  // tronco: cintura, peito, ombros caídos e a base do pescoço; frente e costas mais planas que os lados
  const vCamiseta = vPorTrechos([[0.06, 0.125], [0.14, 0.25], [0.24, 0.375], [0.33, 0.5], [0.38, 0.625], [0.43, 0.75], [0.455, 0.875], [0.46, 1]]);
  const FATIAS = [[0.045, 0.1386, 0.1067, 0.002, 2.3], [0.1, 0.1287, 0.1012, 0.004, 2.4], [0.17, 0.1144, 0.0913, 0.005, 2.4], [0.25, 0.1254, 0.099, 0.006, 2.5], [0.32, 0.1419, 0.1089, 0.006, 2.6], [0.375, 0.1529, 0.1056, 0.001, 2.4], [0.41, 0.138, 0.0876, -0.004, 2.3], [0.436, 0.1092, 0.0752, -0.006, 2.2], [0.455, 0.07, 0.0597, -0.005, 2.1], [0.468, 0.0474, 0.0474, -0.002, 2]];
  const camiseta = peca(geoCorpo(FATIAS, vCamiseta, 44), mat.camiseta);
  tronco.add(camiseta);
  const barraCamiseta = peca(new THREE.TorusGeometry(0.125, 0.01, 8, 32), mat.roupa); barraCamiseta.rotation.x = Math.PI / 2; barraCamiseta.scale.y = 0.78; barraCamiseta.position.y = 0.05; tronco.add(barraCamiseta);
  const pescoco = peca(torneada([[0, 0.13], [0.04, 0.13], [0.039, 0.07], [0.041, 0.035], [0.05, 0.005], [0, 0]], 20), mat.pele); pescoco.position.y = 0.445; tronco.add(pescoco);
  // jaqueta jeans por cima da camiseta, com gola virada
  const jaqueta = peca(geoCorpo(FATIAS.map(([y, a, b, dz, n]) => [y - (y < 0.1 ? 0.01 : 0), a + (y > 0.44 ? 0.02 : 0.011), b + (y > 0.44 ? 0.016 : 0.011), dz, n]), vCamiseta, 44, { tampa: false }), mat.jeans);
  tronco.add(jaqueta);
  const golaJaqueta = peca(new THREE.TorusGeometry(0.078, 0.02, 8, 24), mat.jeans); golaJaqueta.rotation.x = Math.PI / 2 - 0.25; golaJaqueta.position.set(0, 0.458, -0.008); golaJaqueta.scale.set(1, 0.8, 1); tronco.add(golaJaqueta);
  // capuz do moletom, caído nas costas
  const capuz = new THREE.Group(); capuz.position.set(0, 0.41, -0.085); tronco.add(capuz);
  const mCapuz = peca(new THREE.SphereGeometry(0.12, 22, 16, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), mat.camiseta);
  mCapuz.material = mat.mangaLonga; mCapuz.scale.set(1.1, 0.75, 0.75); mCapuz.rotation.x = -0.5; capuz.add(mCapuz);
  // capuz vestido na cabeça (estilo street): uma casca em volta da cabeça com a abertura do rosto
  // virada para a frente e um pouco para baixo; o cabelo comprido sai por baixo, nas costas
  const capuzCabeca = new THREE.Group(); capuzCabeca.position.set(0, 0.012, -0.012); // vai para a cabeça logo abaixo
  const cordoes = new THREE.Group(); tronco.add(cordoes);
  const ABERTURA = 1.18;
  const cascaCapuz = peca(new THREE.SphereGeometry(0.182, 32, 20, 0, Math.PI * 2, ABERTURA, Math.PI - ABERTURA), mat.mangaLonga);
  cascaCapuz.rotation.x = Math.PI / 2 + 0.38; cascaCapuz.scale.set(0.98, 1.04, 1.04); capuzCabeca.add(cascaCapuz);
  const bainhaCapuz = peca(new THREE.TorusGeometry(0.182 * Math.sin(ABERTURA), 0.016, 8, 32), mat.mangaLonga);
  const eixo = new THREE.Vector3(0, Math.cos(Math.PI / 2 + 0.38), Math.sin(Math.PI / 2 + 0.38));
  bainhaCapuz.position.copy(eixo).multiplyScalar(0.182 * Math.cos(ABERTURA)); bainhaCapuz.position.y *= 1.04; bainhaCapuz.position.z *= 1.04;
  bainhaCapuz.lookAt(eixo.clone().multiplyScalar(2)); capuzCabeca.add(bainhaCapuz);
  // cordões do capuz
  for (const l of [-1, 1]) {
    const cordao = peca(new THREE.CylinderGeometry(0.004, 0.004, 0.11, 6), mat.branco); cordao.position.set(l * 0.035, 0.38, 0.108); cordao.rotation.set(0.2, 0, -l * 0.08); cordoes.add(cordao);
    const ponta = peca(new THREE.CylinderGeometry(0.006, 0.006, 0.016, 6), mat.detalhe); ponta.position.set(l * 0.039, 0.32, 0.118); ponta.rotation.x = 0.2; cordoes.add(ponta);
  }
  // saia xadrez rodada (estilo jeans)
  const saia = peca(new THREE.CylinderGeometry(0.152, 0.245, 0.22, 32, 1, true), mat.saia); saia.position.y = -0.03; saia.scale.z = 0.82; quadril.add(saia);
  const gola = peca(new THREE.TorusGeometry(0.049, 0.007, 8, 22), mat.branco); gola.rotation.x = Math.PI / 2 + 0.12; gola.position.set(0, 0.462, 0.002); tronco.add(gola);

  // ---- braços: ombro -> cotovelo -> mão ----
  // músculos do braço: o antebraço é mais largo perto do cotovelo e achata no pulso
  const formaBraco = (x, y, z) => [x * 1.08 * (1 + 0.07 * sinoM(y, -0.25, 0.05) - 0.12 * sinoM(y, -0.38, 0.03)), z * 1.08 * (1 - 0.14 * sinoM(y, -0.37, 0.05)) + 0.004 * sinoM(y, -0.08, 0.06) * Math.sign(z)];
  const bracos = [-1, 1].map((lado) => {
    const ombro = new THREE.Group(); ombro.position.set(lado * 0.153, 0.392, 0); tronco.add(ombro);
    const manga = peca(torneada([[0, 0.034], [0.022, 0.032], [0.037, 0.018], [0.0425, -0.005], [0.0432, -0.045], [0.0428, -0.062], [0.04, -0.062]], 20), mat.manga); ombro.add(manga);
    const cotovelo = new THREE.Group(); cotovelo.position.y = -0.2; ombro.add(cotovelo);
    // braço e antebraço com pele: o cotovelo dobra sem emenda
    const mBraco = sombrear(membro([[0, 0.03], [0.032, 0.022], [0.042, -0.002], [0.042, -0.045], [0.037, -0.12], [0.035, -0.18], [0.034, -0.2]], mat.pele, ombro, cotovelo, -0.2, 0.035, 1, 20, formaBraco));
    const mAnte = sombrear(membro([[0.034, -0.2], [0.035, -0.225], [0.034, -0.27], [0.029, -0.33], [0.025, -0.365], [0.023, -0.385], [0, -0.39]], mat.pele, ombro, cotovelo, -0.2, 0.035, 1, 20, formaBraco));
    const mao = new THREE.Group(); mao.position.y = -0.19; cotovelo.add(mao);
    mao.add(criarMao(lado, mat.pele, 1.35));
    const punho = peca(new THREE.CylinderGeometry(0.034, 0.036, 0.036, 16), mat.mangaLonga); punho.position.y = -0.165; cotovelo.add(punho);
    const folgaManga = peca(new THREE.SphereGeometry(0.043, 14, 10), mat.mangaLonga); folgaManga.scale.set(1, 0.55, 1); folgaManga.position.y = 0.026; punho.add(folgaManga);
    return { ombro, cotovelo, mao, manga, mBraco, mAnte, punho };
  });

  // ---- cabeça e cabelo ----
  // estilo desenho animado: cabeça grande (o corpo tem umas 4 cabeças de altura), olhos enormes, mãos e tênis grandes
  const cabeca = new THREE.Group(); cabeca.position.y = 0.672; cabeca.scale.setScalar(1.42); tronco.add(cabeca); cabeca.add(capuzCabeca);
  const geoCranio = geoCabeca(0.142);
  const superficie = superficieDe(geoCranio);
  const cranio = peca(geoCranio, mat.rosto); cabeca.add(cranio);
  const matOuro = new THREE.MeshStandardMaterial({ color: 0xe6b84a, metalness: 0.9, roughness: 0.25 });
  for (const lado of [-1, 1]) {
    // orelha: pavilhão achatado com a borda dobrada e o lóbulo
    const orelha = new THREE.Group(); orelha.position.set(lado * 0.136, -0.018, -0.006); orelha.scale.setScalar(1.15); orelha.rotation.set(0, lado * 0.45, lado * 0.08); cabeca.add(orelha);
    const pav = peca(new THREE.SphereGeometry(0.03, 14, 12), mat.pele); pav.scale.set(0.3, 1, 0.66); orelha.add(pav);
    const helice = peca(new THREE.TorusGeometry(0.021, 0.005, 6, 16, Math.PI * 1.35), mat.pele); helice.rotation.set(0, Math.PI / 2, 0); helice.rotation.z = -0.5; helice.scale.set(0.75, 1.15, 1); helice.position.set(lado * 0.006, 0.002, 0); orelha.add(helice);
    const lobulo = peca(new THREE.SphereGeometry(0.01, 10, 8), mat.pele); lobulo.scale.set(0.5, 1, 0.85); lobulo.position.set(lado * 0.002, -0.027, 0.003); orelha.add(lobulo);
    const argola = peca(new THREE.TorusGeometry(0.017, 0.0036, 6, 16), matOuro);
    argola.position.set(lado * 0.006, -0.048, 0.004); argola.rotation.y = Math.PI / 2; orelha.add(argola);
  }
  // ---- rosto (aparece no saguão e na tela de fim, quando ela olha para a câmera) ----
  const rosto = new THREE.Group(); cabeca.add(rosto);
  const matOlho = desenho({ color: 0xf6f3ee, roughness: 0.18 });
  const matIris = desenho({ color: 0xffffff, roughness: 0.12, map: texIris('#6a4222') });
  const matEscuro = desenho({ color: 0x1a0f0a, roughness: 0.5 });
  const matSobrancelha = desenho({ color: 0x2e1b10, roughness: 0.7 });
  const matBoca = desenho({ color: 0xd4526a, roughness: 0.38 });
  const matPalpebra = mat.palpebra;
  const olhos = []; const sobrancelhas = [];
  // tubo que acompanha a curva do rosto (lábios e sobrancelhas)
  const noRosto = (yDe, x0, x1, raio, material, { n = 12, folga = 0.0012, achatar = 1 } = {}) => {
    const pts = Array.from({ length: n + 1 }, (_, k) => { const x = x0 + ((x1 - x0) * k) / n; const y = yDe(x); return new THREE.Vector3(x, y, superficie(x, y) + folga); });
    return peca(tuboAfinado(new THREE.CatmullRomCurve3(pts), n * 2, raio, 8, achatar), material);
  };
  const X_OLHO = 0.057; const Y_OLHO = -0.014;
  for (const lado of [-1, 1]) {
    const x = lado * X_OLHO;
    const o = criarOlho(lado, { r: 0.037, matBranco: matOlho, matIris, matPele: matPalpebra, matCilio: matEscuro, grande: true });
    o.olho.position.set(x, Y_OLHO, superficie(x, Y_OLHO) - 0.02);
    o.olho.rotation.y = lado * 0.1; // cada olho acompanha a curva do rosto
    rosto.add(o.olho);
    olhos.push(o);
    // sobrancelha em arco, mais grossa perto do nariz
    const grupoS = new THREE.Group(); grupoS.position.set(x + lado * 0.003, 0.05, 0); rosto.add(grupoS);
    const s = noRosto((xx) => 0.05 + 0.009 * (1 - ((xx - x) / 0.034) ** 2) - 0.005 * lado * ((xx - x) / 0.034), x - lado * 0.034, x + lado * 0.04, (t) => 0.0052 * (1 - 0.7 * t * t) * (0.7 + 0.3 * Math.min(1, t * 6)), matSobrancelha, { folga: 0.0012, achatar: 0.5 });
    s.position.set(-grupoS.position.x, -grupoS.position.y, 0); grupoS.add(s);
    sobrancelhas.push({ sobrancelha: grupoS, lado, z0: 0, y0: grupoS.position.y });
  }
  // nariz: ponta arredondada, asas e narinas (o dorso já vem esculpido na cabeça)
  const Y_NARIZ = -0.052;
  const nariz = new THREE.Group(); nariz.position.set(0, Y_NARIZ, superficie(0, Y_NARIZ)); nariz.scale.setScalar(0.72); rosto.add(nariz);
  const ponta = peca(new THREE.SphereGeometry(0.0118, 16, 12), mat.pele); ponta.scale.set(1.1, 0.82, 0.95); ponta.position.z = -0.0045; nariz.add(ponta);
  const baseNariz = peca(new THREE.SphereGeometry(0.012, 14, 10), mat.pele); baseNariz.scale.set(1.45, 0.62, 0.8); baseNariz.position.set(0, -0.0015, -0.0095); nariz.add(baseNariz);
  for (const l of [-1, 1]) {
    const asa = peca(new THREE.SphereGeometry(0.0066, 10, 8), mat.pele); asa.scale.set(1, 0.9, 1.1); asa.position.set(l * 0.0128, -0.0022, -0.0125); nariz.add(asa);
    const narina = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), desenho({ color: 0x6e3a2c, roughness: 0.9 })); narina.scale.set(1.25, 0.5, 0.8); narina.position.set(l * 0.006, -0.0092, -0.0075); nariz.add(narina);
  }
  // boca sorrindo: lábio de cima com o arco do cupido, lábio de baixo mais cheio e os dentes entre eles
  const Y_BOCA = -0.09; const L_BOCA = 0.03;
  const cima = (x) => Y_BOCA + 0.003 + 0.008 * (x / L_BOCA) ** 2 - 0.002 * Math.exp(-((x / 0.006) ** 2));
  const baixo = (x) => Y_BOCA - 0.0015 + 0.0125 * (x / L_BOCA) ** 2; // lábios juntos: sorriso fechado
  const labio = new THREE.Group(); rosto.add(labio);
  labio.add(noRosto(cima, -L_BOCA, L_BOCA, (t) => 0.003 * Math.sin(t * Math.PI) ** 0.6 + 0.0006, matBoca, { n: 16, folga: 0.0002 }));
  labio.add(noRosto(baixo, -L_BOCA, L_BOCA, (t) => 0.0041 * Math.sin(t * Math.PI) ** 0.7 + 0.0006, matBoca, { n: 16, folga: 0 }));
  // dentes de cima e o fundo da boca, em tiras que seguem a curva do rosto
  const tiraBoca = (yA, yB, material, fundo) => {
    const v = []; const ind = []; const N2 = 14;
    for (let k = 0; k <= N2; k++) { const x = -L_BOCA * 0.94 + (L_BOCA * 1.88 * k) / N2; const z = superficie(x, Y_BOCA) - fundo; v.push(x, yA(x), z, x, yB(x), z); if (k < N2) ind.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(ind); g.computeVertexNormals();
    return new THREE.Mesh(g, material);
  };
  const meio = (x) => cima(x) * 0.42 + baixo(x) * 0.58;
  const sorriso = new THREE.Group(); rosto.add(sorriso);
  sorriso.add(tiraBoca(cima, meio, desenho({ color: 0xfbfaf5, roughness: 0.25, side: THREE.DoubleSide }), 0.0022));
  sorriso.add(tiraBoca(meio, baixo, desenho({ color: 0x7a2633, roughness: 0.6, side: THREE.DoubleSide }), 0.003));
  // covinhas no canto do sorriso
  for (const l of [-1, 1]) { const c = peca(new THREE.SphereGeometry(0.0022, 8, 6), matBoca); c.position.set(l * L_BOCA, cima(L_BOCA), superficie(l * L_BOCA, cima(L_BOCA)) + 0.0002); labio.add(c); }
  // rosto triste: lábios fechados com os cantos para baixo, sobrancelhas levantadas no meio e lágrimas
  const bocaTriste = new THREE.Group(); bocaTriste.visible = false; rosto.add(bocaTriste);
  const triste = (x) => Y_BOCA - 0.004 - 0.011 * (x / 0.024) ** 2;
  bocaTriste.add(noRosto((x) => triste(x) + 0.0035, -0.024, 0.024, (t) => 0.0036 * Math.sin(t * Math.PI) ** 0.6 + 0.0008, matBoca, { folga: 0.0008 }));
  bocaTriste.add(noRosto((x) => triste(x) - 0.0035, -0.021, 0.021, (t) => 0.0048 * Math.sin(t * Math.PI) ** 0.7 + 0.0008, matBoca, { folga: 0.0012 }));
  const matLagrima = desenho({ color: 0x8fd3ff, roughness: 0.05, transparent: true, opacity: 0.85 });
  const lagrimas = [-1, 1].map((l) => {
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 8), matLagrima); g.scale.set(0.8, 1.3, 0.6); g.visible = false; rosto.add(g);
    return { g, l, x: l * 0.055, z: superficie(l * 0.055, -0.045) + 0.004 };
  });
  // cabelo: casca penteada colada na cabeça e os cachos, cada um um tubo em espiral que balança
  const casca = peca(geoCabelo(0.142), mat.cabeloLiso); cabeca.add(casca);
  const mechas = [];
  const inicioCachos = cabeca.children.length; // daqui em diante, as peças do penteado de cachos
  // camada de baixo, contínua: não deixa a camiseta aparecer entre os cachos
  const base = new THREE.Group();
  const cabeleira = geoCabeleira({ comp: 0.34, abertura: 1.5, volume: 0.018, sulco: 0.045, onda: 0.17, cachosNasPontas: false });
  base.add(peca(cabeleira.massa, mat.cabeleira), new THREE.Mesh(cabeleira.massa, mat.cabeleiraDentro));
  cabeca.add(base);
  mechas.push({ piv: base, fase: 0 });
  let sem = 20240;
  const sorte = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  // os cachos são juntados em poucos grupos (cada grupo balança no seu tempo): leve para o celular
  const NC = 0; const GRUPOS = 0; // os cachos soltos saíram: a cabeleira já traz um cacho na ponta de cada gomo
  const porGrupo = Array.from({ length: GRUPOS }, () => []);
  for (let k = 0; k < NC; k++) {
    const t = k / (NC - 1);
    const camada = k % 2; // duas camadas: a de fora é mais comprida e mais solta
    const az = (t - 0.5) * 4.1 + (sorte() - 0.5) * 0.08;
    porGrupo[k % GRUPOS].push(geoCacho({ az, y0: 0.1 - camada * 0.04 - sorte() * 0.02, comp: 0.36 + Math.sin(t * Math.PI) * 0.08 + sorte() * 0.05 - camada * 0.04, fase: sorte() * 6.3, amp: 0.02 + sorte() * 0.006, voltas: 2 + sorte() * 0.6, raio: 0.02 + sorte() * 0.004, fora: 0.062 }));
  }
  // cachos da frente: emolduram o rosto e caem na frente dos ombros
  const daFrente = [[], []];
  [[1.42, 0.42, 0.3, 0.05], [-1.42, 0.43, 1.1, 0.05], [1.15, 0.4, 2.2, 0.05], [-1.15, 0.41, 2.9, 0.05]].forEach(([az, comp, fase, y0], k) => {
    daFrente[k % 2].push(geoCacho({ az, y0, comp, fase, amp: 0.014, voltas: 1.2, raio: 0.028, frente: true, fora: 0.01 }));
  });
  [...porGrupo, ...daFrente].forEach((geos, k) => {
    const piv = new THREE.Group();
    piv.add(peca(fundirGeos(geos), mat.cachos[k % mat.cachos.length]));
    cabeca.add(piv);
    mechas.push({ piv, fase: k * 1.1 });
  });
  // franja de lado: sai da risca e desce pelas têmporas
  const franja = [];
  for (const [x0, x1, y1, r] of [[0.004, 0.122, 0.04, 0.013], [-0.004, -0.122, 0.04, 0.013]]) { // risca no meio: o cabelo desce rente de cada lado, deixando a testa e as bochechas à mostra
    const n = 10;
    const pts = Array.from({ length: n + 1 }, (_, k) => {
      const t = k / n; const x = x0 + (x1 - x0) * t; const y = 0.128 + (y1 - 0.128) * t ** 1.5 + 0.012 * Math.sin(t * Math.PI);
      return new THREE.Vector3(x, y, Math.max(superficie(x, y), 0.02) + 0.007 - 0.004 * t);
    });
    franja.push(tuboAfinado(new THREE.CatmullRomCurve3(pts), 14, (t) => r * 1.7 * (0.55 + 0.75 * Math.sin(t * Math.PI) ** 0.8) * (1 - 0.35 * t * t), 8, 0.42));
  }
  const pecasCachos = cabeca.children.slice(inicioCachos);
  const mFranja = peca(fundirGeos(franja), mat.cachos[3]); cabeca.add(mFranja);

  // ---- outros penteados da turma (cada personagem usa um) ----
  const girada = (geo, [x, y, z], [rx, ry, rz] = [0, 0, 0], [ex, ey, ez] = [1, 1, 1]) => geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(ex, ey, ez)));
  const penteado = (geos, material = mat.cachos[2]) => { const g = new THREE.Group(); g.add(peca(fundirGeos(geos), material)); g.visible = false; cabeca.add(g); return g; };
  // curto e espetado na frente
  const espetos = [];
  for (let k = 0; k < 9; k++) { const x = (k - 4) * 0.027; espetos.push(girada(new THREE.ConeGeometry(0.03, 0.1, 7), [x, 0.128 - Math.abs(x) * 0.3, 0.092 - x * x * 2.5], [1.0, 0, -x * 4.5])); }
  for (let k = 0; k < 7; k++) { const x = (k - 3) * 0.03; espetos.push(girada(new THREE.ConeGeometry(0.032, 0.085, 7), [x, 0.155 - Math.abs(x) * 0.25, 0.04], [0.5, 0, -x * 4])); }
  for (let k = 0; k < 5; k++) { const x = (k - 2) * 0.034; espetos.push(girada(new THREE.ConeGeometry(0.03, 0.07, 7), [x, 0.162 - Math.abs(x) * 0.2, -0.02], [0.05, 0, -x * 3.5])); }
  const hCurto = penteado(espetos);
  // rabo de cavalo alto, preso com elástico da cor da roupa
  const hRabo = penteado([tuboAfinado(new THREE.CatmullRomCurve3([[0, 0.125, -0.085], [0, 0.205, -0.17], [0, 0.15, -0.275], [0, 0.0, -0.31], [0, -0.15, -0.265]].map((v) => new THREE.Vector3(...v))), 22, (t) => 0.014 + 0.042 * Math.sin(Math.PI * Math.min(1, t * 1.3)) ** 0.7 * (1 - 0.55 * t), 8)]);
  const elastico = peca(new THREE.TorusGeometry(0.03, 0.013, 8, 16), mat.roupa); elastico.position.set(0, 0.165, -0.125); elastico.rotation.x = 0.85; hRabo.add(elastico);
  mechas.push({ piv: hRabo, fase: 1.3 });
  // black power: nuvem de cachinhos bem fechados em volta da cabeça
  const bolinhas = [];
  for (let k = 0; k < 80; k++) {
    const y = 1 - (k / 79) * 1.5; const r = Math.sqrt(Math.max(0, 1 - y * y)); const a = k * 2.39996;
    const d = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    if (d.z > 0.3 && d.y < 0.52) continue; // deixa o rosto livre
    bolinhas.push(girada(new THREE.SphereGeometry(0.078, 8, 6), [d.x * 0.15, 0.04 + d.y * 0.16, -0.02 + d.z * 0.16]));
  }
  const hAfro = penteado(bolinhas);
  // moicano: crista de pontas do alto da testa até a nuca
  const crista = [];
  for (let k = 0; k < 11; k++) { const teta = -0.75 + k * 0.3; const alto = 0.15 - Math.abs(k - 4) * 0.008; crista.push(girada(new THREE.ConeGeometry(0.04, alto, 8), [0, Math.cos(teta) * 0.168, -Math.sin(teta) * 0.158 - 0.005], [-teta, 0, 0], [0.42, 1, 1])); }
  const hMoicano = penteado(crista);
  // dois coques no alto, com elásticos
  const hCoques = penteado([girada(new THREE.SphereGeometry(0.068, 14, 10), [-0.092, 0.158, -0.03]), girada(new THREE.SphereGeometry(0.068, 14, 10), [0.092, 0.158, -0.03])]);
  for (const l of [-1, 1]) { const e2 = peca(new THREE.TorusGeometry(0.036, 0.011, 8, 16), mat.roupa); e2.position.set(l * 0.075, 0.118, -0.025); e2.rotation.set(Math.PI / 2 + 0.1, 0, l * 0.5); hCoques.add(e2); }
  // topete bagunçado: mechas grossas e pontudas, jogadas para cima e para os lados
  const tufo = (p0, p1, p2, r) => tuboAfinado(new THREE.QuadraticBezierCurve3(new THREE.Vector3(...p0), new THREE.Vector3(...p1), new THREE.Vector3(...p2)), 10, (t) => r * (1 - t) ** 0.7 * (0.75 + 0.5 * Math.sin(Math.min(1, t * 2.5) * Math.PI / 2)) + 0.001, 7, 0.75);
  const tufos = [];
  for (let k = 0; k < 7; k++) { // frente: topete que sobe e cai para um lado
    const x = (k - 3) * 0.026; const viés = 0.045 + x * 0.5;
    tufos.push(tufo([x, 0.118 - Math.abs(x) * 0.25, 0.08], [x + viés * 0.5, 0.185 - Math.abs(x) * 0.3, 0.13], [x + viés, 0.15 + (k % 2) * 0.025, 0.165 - Math.abs(x) * 0.5], 0.046));
  }
  for (let k = 0; k < 9; k++) { // alto e nuca: pontas para todos os lados
    const a = (k / 9) * Math.PI * 2; const cx = Math.sin(a); const cz = Math.cos(a);
    tufos.push(tufo([cx * 0.06, 0.145, cz * 0.06 - 0.02], [cx * 0.115, 0.195, cz * 0.115 - 0.02], [cx * 0.15, 0.165 + (k % 3) * 0.015, cz * 0.15 - 0.02], 0.048));
  }
  for (const l of [-1, 1]) for (let k = 0; k < 4; k++) { // lados e trás: mechas que descem e viram para fora
    const a = l * (0.9 + k * 0.6);
    tufos.push(tufo([Math.sin(a) * 0.12, 0.075, -Math.cos(a) * 0.12 - 0.01], [Math.sin(a) * 0.17, 0.03, -Math.cos(a) * 0.17], [Math.sin(a) * 0.168, -0.04 - (k % 2) * 0.02, -Math.cos(a) * 0.168], 0.044));
  }
  const hTopete = penteado(tufos);
  // duas tranças caindo na frente dos ombros, com elásticos
  const gomosT = [];
  for (const l of [-1, 1]) for (let k = 0; k < 9; k++) gomosT.push(girada(new THREE.SphereGeometry(0.034 - k * 0.0014, 10, 8), [l * (0.128 - k * 0.002), -0.03 - k * 0.04, 0.035 + Math.sin(k * 0.5) * 0.012], [0, 0, l * 0.5 * (k % 2 ? 1 : -1)], [1, 0.82, 0.9]));
  const hTrancas = penteado(gomosT);
  for (const l of [-1, 1]) { const e3 = peca(new THREE.TorusGeometry(0.022, 0.009, 6, 14), mat.roupa); e3.position.set(l * 0.111, -0.375, 0.04); e3.rotation.x = Math.PI / 2; hTrancas.add(e3); }
  mechas.push({ piv: hTrancas, fase: 2.1 });
  // laço de fita no alto da cabeça
  const matLaco = desenho({ color: 0xf2c21f });
  const laco = new THREE.Group(); laco.visible = false; laco.position.set(0.02, 0.2, 0.06); laco.rotation.set(-0.35, 0, 0.12); cabeca.add(laco);
  for (const l of [-1, 1]) { const asa = peca(new THREE.ConeGeometry(0.05, 0.1, 10), matLaco); asa.scale.set(1, 1, 0.45); asa.rotation.z = l * Math.PI / 2; asa.position.x = l * 0.055; laco.add(asa); }
  laco.add(peca(new THREE.SphereGeometry(0.022, 10, 8), matLaco));
  const penteados = { curto: hCurto, rabo: hRabo, afro: hAfro, moicano: hMoicano, coques: hCoques, topete: hTopete, trancas: hTrancas };
  // mochila nas costas, com bolso e alças
  const matMochila = desenho({ color: 0x26262b }); const matMochila2 = desenho({ color: 0x3a3a42 });
  const mochilaCostas = new THREE.Group(); mochilaCostas.visible = false; tronco.add(mochilaCostas);
  const bolsa = peca(new THREE.SphereGeometry(0.1, 18, 14), matMochila); bolsa.scale.set(1.02, 1.28, 0.62); bolsa.position.set(0, 0.26, -0.135); mochilaCostas.add(bolsa);
  const bolsoM = peca(new THREE.SphereGeometry(0.065, 14, 10), matMochila2); bolsoM.scale.set(1.05, 0.85, 0.5); bolsoM.position.set(0, 0.215, -0.185); mochilaCostas.add(bolsoM);
  for (const l of [-1, 1]) { const alca = peca(new THREE.TorusGeometry(0.105, 0.014, 6, 20, Math.PI * 1.15), matMochila2); alca.position.set(l * 0.085, 0.305, -0.005); alca.rotation.set(0, Math.PI / 2 + l * 0.12, 0); alca.rotation.z = -0.35; alca.scale.set(1, 1.15, 1); mochilaCostas.add(alca); }
  const matPulseira = desenho({ color: 0x22242c });
  const pulseiras = bracos.map((b) => { const m = peca(new THREE.CylinderGeometry(0.031, 0.032, 0.036, 16), matPulseira); m.position.y = -0.158; m.visible = false; b.cotovelo.add(m); return m; });
  // ---- acessórios da turma ----
  const matArmacao = desenho({ color: 0x22242c });
  const oculos = new THREE.Group(); oculos.visible = false; rosto.add(oculos);
  for (const lado of [-1, 1]) {
    const aro = peca(new THREE.TorusGeometry(0.045, 0.0045, 6, 24), matArmacao); aro.position.set(lado * X_OLHO, Y_OLHO, superficie(lado * X_OLHO, Y_OLHO) + 0.021); aro.rotation.y = lado * 0.1; oculos.add(aro);
    const haste = peca(new THREE.BoxGeometry(0.004, 0.006, 0.13), matArmacao); haste.position.set(lado * 0.108, Y_OLHO + 0.006, 0.06); haste.rotation.y = -lado * 0.22; oculos.add(haste);
  }
  const ponte = peca(new THREE.BoxGeometry(0.02, 0.005, 0.004), matArmacao); ponte.position.set(0, Y_OLHO + 0.004, superficie(0, Y_OLHO) + 0.016); oculos.add(ponte);
  const matConcha = desenho({ color: 0xff8a1f }); const matArcoFone = desenho({ color: 0x22242c });
  const fones = new THREE.Group(); fones.visible = false; cabeca.add(fones);
  const arco = peca(new THREE.TorusGeometry(0.168, 0.011, 8, 28, Math.PI), matArcoFone); arco.position.set(0, -0.005, -0.012); arco.scale.set(0.88, 1.05, 1); fones.add(arco);
  for (const lado of [-1, 1]) {
    const concha = peca(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), matConcha); concha.rotation.z = Math.PI / 2; concha.position.set(lado * 0.145, -0.015, -0.012); fones.add(concha);
    const almofada = peca(new THREE.TorusGeometry(0.04, 0.012, 8, 18), matArmacao); almofada.rotation.y = Math.PI / 2; almofada.position.set(lado * 0.128, -0.015, -0.012); fones.add(almofada);
  }
  rosto.traverse((x) => { x.castShadow = false; }); // as peças miúdas do rosto não precisam fazer sombra

  // faixa de cabelo: arco de uma orelha à outra, por cima da cabeça
  const faixa = peca(new THREE.TorusGeometry(0.159, 0.009, 8, 40, Math.PI), mat.roupa); faixa.scale.set(0.92, 1, 1.8);
  faixa.rotation.x = -0.25; faixa.position.set(0, -0.005, 0.01); cabeca.add(faixa);
  // boné com a aba virada para trás (aparece bem de costas)
  const bone = new THREE.Group(); bone.position.y = 0.03; cabeca.add(bone);
  const copa = peca(new THREE.SphereGeometry(0.158, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), mat.chapeu); copa.scale.set(0.98, 0.85, 1.02); bone.add(copa);
  const aba = peca(new THREE.CylinderGeometry(0.105, 0.105, 0.014, 24, 1, false, Math.PI * 0.5, Math.PI), mat.chapeu2); aba.position.set(0, 0.005, -0.12); aba.scale.set(1, 1, 0.9); aba.rotation.x = 0.12; bone.add(aba);
  const botao = peca(new THREE.SphereGeometry(0.018, 10, 8), mat.chapeu2); botao.position.y = 0.135; bone.add(botao);
  const fecho = peca(new THREE.TorusGeometry(0.035, 0.008, 6, 14, Math.PI), mat.chapeu2); fecho.position.set(0, 0.01, 0.15); bone.add(fecho);
  // gorro com dobra e pompom
  const gorro = new THREE.Group(); gorro.position.y = 0.062; cabeca.add(gorro);
  const malhaGorro = peca(new THREE.SphereGeometry(0.162, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mat.chapeu); malhaGorro.scale.set(0.98, 1.05, 1.02); gorro.add(malhaGorro);
  const dobra = peca(new THREE.TorusGeometry(0.152, 0.03, 10, 30), mat.chapeu); dobra.rotation.x = Math.PI / 2; dobra.position.y = 0.0; dobra.scale.set(1, 1.03, 1); gorro.add(dobra);
  const pompom = peca(new THREE.SphereGeometry(0.05, 14, 10), mat.chapeu2); pompom.position.y = 0.19; gorro.add(pompom);
  // viseira esportiva
  const viseira = new THREE.Group(); viseira.position.set(0, 0.055, -0.004); viseira.scale.set(0.9, 1, 1); cabeca.add(viseira);
  const tira = peca(new THREE.TorusGeometry(0.153, 0.016, 8, 34), mat.chapeu); tira.rotation.x = Math.PI / 2 + 0.15; viseira.add(tira);
  const abaViseira = peca(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24, 1, false, -Math.PI * 0.5, Math.PI), mat.chapeu2); abaViseira.position.set(0, -0.01, 0.13); viseira.add(abaViseira);

  // ---- acessórios: skate, maleta e aura ----
  const skate = new THREE.Group(); raiz.add(skate);
  const matDeck = new THREE.MeshStandardMaterial({ color: 0xd79a5b, roughness: 0.6 });
  const deck = peca(new THREE.CapsuleGeometry(0.16, 0.66, 4, 16), matDeck); deck.rotation.x = Math.PI / 2; deck.scale.set(1, 1, 0.14); deck.position.y = 0.07; skate.add(deck);
  const lixa = peca(new THREE.BoxGeometry(0.26, 0.006, 0.8), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 })); lixa.position.y = 0.094; skate.add(lixa);
  const rodas = new THREE.Group(); skate.add(rodas);
  for (const dz of [-0.3, 0.3]) for (const dx of [-0.11, 0.11]) {
    const r = peca(new THREE.CylinderGeometry(0.038, 0.038, 0.035, 14), new THREE.MeshStandardMaterial({ color: 0xe5484d, roughness: 0.5 }));
    r.rotation.z = Math.PI / 2; r.position.set(dx, 0.03, dz); rodas.add(r);
  }
  const brilhoSkate = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0x5ae6ff, transparent: true, depthWrite: false }));
  brilhoSkate.scale.set(0.9, 0.9, 1); brilhoSkate.position.y = 0.02; skate.add(brilhoSkate);
  const fogo = (cor) => {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 10), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 }));
    cone.rotation.x = Math.PI; cone.position.y = -0.16; g.add(cone);
    const miolo = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
    miolo.rotation.x = Math.PI; miolo.position.y = -0.1; g.add(miolo);
    return g;
  };
  const chamasSkate = [-0.1, 0.1].map((dx) => { const f = fogo(0xff7a1f); f.rotation.x = -Math.PI / 2; f.position.set(dx, 0.07, -0.48); skate.add(f); return f; });
  // mochila a jato: mochila acolchoada, dois tanques com bocais, fogo e fumaça
  const maleta = new THREE.Group(); maleta.position.set(0, 0.25, -0.13); tronco.add(maleta);
  const { grupo: mochila, chamas: chamasMaleta } = criarMochilaJato();
  maleta.add(mochila);
  const fumaca = Array.from({ length: 18 }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0xdfe3ea, transparent: true, depthWrite: false, opacity: 0 }));
    sp.visible = false; raiz.add(sp);
    return { sp, vida: 0 };
  });
  let proximaFumaca = 0; let ultimoT = 0;
  // capa de super-heroína: presa nos ombros, mais larga embaixo, tremulando ao vento
  const matCapa = new THREE.MeshStandardMaterial({ color: 0xe0283f, roughness: 0.55, side: THREE.DoubleSide });
  const geoCapa = new THREE.PlaneGeometry(0.34, 0.8, 6, 16); geoCapa.translate(0, -0.4, 0);
  const basePosCapa = geoCapa.attributes.position.array.slice();
  for (let i = 0; i < basePosCapa.length; i += 3) basePosCapa[i] *= 0.8 + 0.8 * (-basePosCapa[i + 1] / 0.8);
  const capa = sombrear(new THREE.Mesh(geoCapa, matCapa)); capa.position.set(0, 0.43, -0.105); tronco.add(capa);
  const presilhas = [-1, 1].map((l) => { const b = peca(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffc928, metalness: 0.6, roughness: 0.3 })); b.position.set(l * 0.11, 0.425, 0.02); tronco.add(b); return b; });
  // estrela dourada no peito
  const formaEstrela = new THREE.Shape();
  for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k * Math.PI) / 5; const r = k % 2 ? 0.022 : 0.052; formaEstrela[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  const estrela = new THREE.Mesh(new THREE.ShapeGeometry(formaEstrela), new THREE.MeshStandardMaterial({ color: 0xffc928, metalness: 0.5, roughness: 0.35, emissive: 0x553300 }));
  estrela.position.set(0, 0.3, 0.118); tronco.add(estrela);
  const partesCapa = [capa, ...presilhas, estrela];
  // nave alienígena (fica na raiz: não acompanha a pose do corpo) e o feixe do teletransporte
  const { grupo: nave, luzes: luzesNave, feixe: raioTrator } = criarNave();
  nave.position.y = 0.2; raiz.add(nave);
  const teleFeixe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x8ffcff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  teleFeixe.visible = false; raiz.add(teleFeixe);
  let naNaveAntes = false; let teletransporte = 0;
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), transparent: true, depthWrite: false, opacity: 0.55 }));
  aura.scale.set(1.6, 2.2, 1); aura.position.y = 0.75; raiz.add(aura);

  let visual = '';
  // troca o tecido de uma peça; a malha comum (tex.tecido) é usada por várias peças e não é descartada
  const trocarMapa = (m, t) => { if (m.map && m.map !== tex.tecido) m.map.dispose(); m.map = t; m.color.set(0xffffff); m.needsUpdate = true; };
  let quemAntes = ''; let temMochila = false;
  const LARGO = 1.12; // corpo mais cheio e baixinho, como nas ilustrações
  function vestir(p, r, estilo = 'esportiva', quem = 'antonella') {
    const chave = `${p}-${r}-${estilo}-${quem}`;
    if (chave === visual) return;
    visual = chave;
    const pers = personagemDe(quem);
    if (pers.id !== quemAntes) {
      // cabelo, olhos e acessório de cada personagem da turma
      quemAntes = pers.id;
      const base = new THREE.Color(pers.corCabelo);
      mat.cachos.forEach((m, k) => m.color.copy(base).offsetHSL(0, 0, (k % 3) * 0.008));
      mat.cabelo.forEach((m, k) => m.color.copy(base).offsetHSL(0, 0, (k - 2) * 0.02));
      mat.cabeloLiso.color.copy(base); mat.cabeleira.color.copy(base); mat.cabeleiraDentro.color.copy(base).multiplyScalar(0.8); mat.cabeleira.color.multiplyScalar(2.1); // a pintura das mechas escurece: compensa na cor
      for (const m of [mat.cabeleira, mat.cabeloLiso, ...mat.cachos]) { m.emissive.copy(m.color); m.emissiveIntensity = 0.16; } // as sombras do cabelo ficam castanhas, não pretas
      matSobrancelha.color.copy(base).offsetHSL(0, -0.1, -0.06);
      matIris.map?.dispose(); matIris.map = texIris(pers.olhos); matIris.needsUpdate = true;
      matBoca.color.set(pers.menino ? 0xb8705f : 0xc4616a);
      for (const o of pecasCachos) o.visible = pers.cabelo === 'cachos';
      for (const [id, g] of Object.entries(penteados)) g.visible = pers.cabelo === id;
      mFranja.visible = ['cachos', 'rabo', 'coques', 'trancas'].includes(pers.cabelo);
      oculos.visible = usa(pers, 'oculos'); fones.visible = usa(pers, 'fones'); laco.visible = usa(pers, 'laco');
      matArmacao.color.set(pers.corOculos ?? 0x22242c); hAfro.scale.setScalar(pers.escalaCabelo ?? 1); hAfro.position.y = (1 - (pers.escalaCabelo ?? 1)) * 0.05;
      matConcha.color.set(pers.corFone ?? ROUPAS[r] ?? 0xff8a1f); matArcoFone.color.set(pers.corFone ? 0xf2f2f4 : 0x22242c);
      temMochila = usa(pers, 'mochila'); matMochila.color.set(pers.corMochila ?? 0x26262b); matMochila2.color.copy(matMochila.color).offsetHSL(0, 0, 0.07);
      for (const m of pulseiras) m.visible = usa(pers, 'pulseiras');
    }
    const cabeChapeu = ['cachos', 'curto'].includes(pers.cabelo) && !pers.acessorio && !usa(pers, 'fones') && !usa(pers, 'laco');
    const cabeFaixa = cabeChapeu || pers.cabelo === 'rabo'; // faixa e viseira também servem com rabo de cavalo // penteados altos e fones não cabem debaixo de chapéu
    mat.pele.color.set(pers.corPele ?? PELES[p] ?? PELES[1]); mat.rosto.color.copy(mat.pele.color); mat.palpebra.color.copy(mat.pele.color);
    const cor = pers.corRoupa ?? ROUPAS[r] ?? ROUPAS[0]; // alguns personagens têm a cor da própria roupa
    mat.roupa.color.set(cor);
    mat.detalhe.color.set(cor);
    mat.manga.color.set(estilo === 'skatista' ? clarear(cor, 0.75) : cor);
    trocarMapa(mat.camiseta, texParteDeCima(estilo === 'jeans' ? 'esportiva' : estilo, cor));
    mat.mangaLonga.map = tex.tecido; mat.mangaLonga.needsUpdate = true;
    trocarMapa(mat.shortTorneado, texParteDeBaixo(estilo === 'jeans' ? 'esportiva' : estilo, cor));
    // o que cada estilo usa
    const e = {
      moletom: { mangaLonga: true, calca: true },
      esportiva: { faixa: true },
      street: { capuz: true, mangaLonga: true, calca: true, cano: true },
      skatista: { bone: true, bermuda: true, meiao: true, largo: true },
      jeans: { jaqueta: true, mangaLonga: true, saia: true, meiao: true, cano: true, gorro: true },
      tiedye: { viseira: true, calca: true },
      corredor: { bermuda: true, capuzCostas: true },
    }[estilo] ?? { mangaLonga: true, calca: true };
    // cores e tecidos das peças
    if (estilo === 'moletom') { trocarMapa(mat.mangaLonga, texMangaEstrelas()); trocarMapa(mat.perna, texParteDeBaixo('moletom', cor)); mat.tenis.color.set(0x1f2a52); mat.detalhe.color.set(0xffffff); }
    else if (estilo === 'corredor') { mat.manga.color.set(0x2748c4); mat.mangaLonga.map = null; mat.mangaLonga.color.set(0xf28a1e); mat.mangaLonga.needsUpdate = true; mat.roupa.color.set(0xf28a1e); mat.tenis.color.set(0x2748c4); mat.detalhe.color.set(0xf28a1e); }
    else if (estilo === 'street') { mat.mangaLonga.color.set(cor); trocarMapa(mat.perna, texParteDeBaixo('street', cor)); mat.tenis.color.set(0x2b2e38); }
    else if (estilo === 'jeans') {
      trocarMapa(mat.jeans, texParteDeCima('jeans', cor)); mat.mangaLonga.map = null; mat.mangaLonga.color.set(0x4a6fa5); mat.mangaLonga.needsUpdate = true;
      trocarMapa(mat.saia, texSaia(cor)); mat.chapeu.color.set(cor); mat.chapeu2.color.set(0xffffff); mat.tenis.color.set(0xffffff);
    } else if (estilo === 'tiedye') { trocarMapa(mat.perna, texParteDeBaixo('tiedye', cor)); mat.chapeu.color.set(cor); mat.chapeu2.color.set(0xffffff); mat.tenis.color.set(cor).lerp(new THREE.Color(0xffffff), 0.45); }
    else if (estilo === 'skatista') { mat.chapeu.color.set(0x1d2130); mat.chapeu2.color.set(cor); mat.tenis.color.set(0xb9bec8); }
    else mat.tenis.color.set(0xffffff);
    if (e.meiao) trocarMapa(mat.meiao, texMeiao(cor));
    // partes de cima
    faixa.visible = Boolean(e.faixa) && cabeFaixa;
    barraCamiseta.material = estilo === 'moletom' ? mat.branco : mat.roupa; // barra do moletom é off-white, como na foto
    capuz.visible = Boolean(e.capuzCostas); casca.visible = true; capuzCabeca.visible = Boolean(e.capuz) && cabeChapeu; cordoes.visible = Boolean(e.capuz);
    jaqueta.visible = Boolean(e.jaqueta); golaJaqueta.visible = Boolean(e.jaqueta);
    camiseta.scale.set(e.largo ? 1.07 : 1, 1, e.largo ? 1.08 : 1);
    for (const b of bracos) {
      b.manga.visible = !e.mangaLonga;
      b.manga.scale.setScalar(e.largo ? 1.15 : 1);
      b.mBraco.material = e.mangaLonga ? mat.mangaLonga : mat.pele;
      b.mAnte.material = e.mangaLonga ? mat.mangaLonga : mat.pele;
      b.punho.visible = Boolean(e.mangaLonga);
    }
    // partes de baixo
    saia.visible = Boolean(e.saia);
    for (const p2 of pernas) {
      p2.mCoxa.material = e.calca ? mat.perna : mat.pele;
      p2.mCanela.material = e.calca ? mat.perna : e.meiao ? mat.meiao : mat.pele;
      p2.barra.visible = !e.calca;
      p2.barra.material = e.bermuda ? mat.shortTorneado : mat.short;
      p2.barra.scale.set(e.bermuda ? 1.08 : 1, e.bermuda ? 2.3 : 1, e.bermuda ? 1.08 : 1);
      p2.barra.position.y = e.bermuda ? -0.1 : -0.035;
      p2.meia.visible = !e.calca && !e.meiao;
      p2.barraCalca.visible = Boolean(e.calca);
      for (const c of p2.cano) c.visible = Boolean(e.cano);
    }
    // cabeça
    bone.visible = Boolean(e.bone) && cabeChapeu;
    gorro.visible = Boolean(e.gorro) && cabeChapeu;
    viseira.visible = Boolean(e.viseira) && cabeFaixa;
  }

  const SKATE_COR = { classico: 0xd79a5b, voador: 0x29b7dc, supersonico: 0xd83a2c };
  // ---------- Animação ----------
  // Cada situação tem uma pose; as poses se misturam aos poucos (cerca de 0,1 s), como uma pessoa
  // que passa de correr para pular, sem trocar de posição de repente.
  // pos/rot = corpo inteiro; quadril e tronco giram ao contrário um do outro; cx/cz = coxa,
  // j = joelho, p = tornozelo, ox/oz = ombro, c = cotovelo (0 = esquerda, 1 = direita).
  const JUNTAS = ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'quadrilY', 'quadrilZ', 'troncoX', 'troncoY', 'troncoZ', 'cabecaX', 'cabecaY', 'cabecaZ', 'vento', 'balanco',
    'cx0', 'cz0', 'j0', 'p0', 'cx1', 'cz1', 'j1', 'p1', 'ox0', 'oy0', 'oz0', 'c0', 'ox1', 'oy1', 'oz1', 'c1', 'm0', 'm1', 'olhar', 'palpebra', 'esticar'];
  const pesos = { parado: 1, corrida: 0, ar: 0, pouso: 0, desliza: 0, voo: 0, heroi: 0, nave: 0, skate: 0, batida: 0, vitrine: 0, comemora: 0, triste: 0, capturada: 0 };
  // ombro: primeiro torce o braço no próprio eixo (y), depois leva à frente (x) e abre para o lado (z).
  // A torção é o que permite pôr a mão na cintura com o cotovelo para fora.
  for (const b of bracos) b.ombro.rotation.order = 'ZXY';
  const maoNaCintura = (k) => ({ [`ox${k}`]: 0.25, [`oy${k}`]: -lado(k) * 1.45, [`oz${k}`]: lado(k) * 0.75, [`c${k}`]: -1.75 });
  const lado = (k) => (k ? 1 : -1);
  const suave = (x) => x * x * (3 - 2 * x);
  const POSES = {
    parado: (s, t) => {
      const w = Math.sin(t * 1.1); // passa o peso de uma perna para a outra
      const r = { posX: 0.015 * w, quadrilZ: 0.05 * w, troncoZ: -0.03 * w, troncoX: 0.02 + 0.015 * Math.sin(t * 2.2), // respiração
        cabecaY: 0.35 * Math.sin(t * 0.45), cabecaX: 0.04 * Math.sin(t * 0.7), vento: 0.08, balanco: 0.03 };
      for (const k of [0, 1]) {
        r[`cz${k}`] = lado(k) * (0.03 - 0.025 * w * lado(k));
        r[`j${k}`] = 0.05 + 0.1 * Math.max(0, w * lado(k));
        r[`ox${k}`] = -0.05 + 0.04 * Math.sin(t * 1.3 + k);
        r[`oz${k}`] = lado(k) * 0.12;
        r[`c${k}`] = -0.22;
        r[`m${k}`] = -0.12; // a mão relaxada, levemente dobrada
      }
      r.olhar = 0.6 * Math.sin(t * 0.45 + 0.5); // os olhos chegam antes da cabeça
      return r;
    },
    corrida: (s, t, f) => {
      // Ciclo de corrida com as quatro poses dos animadores: contato (o pé chega na frente), descida
      // (o corpo afunda e amortece), passagem (a perna de trás dobra e passa) e subida (empurra e voa).
      const v = Math.min(1, (s.vel ?? 13) / 28);
      const r = {
        posY: 0.04 - 0.05 * Math.cos(2 * f - 0.9), // afunda logo depois do contato e sobe no impulso
        posX: 0.012 * Math.sin(f), // o peso vai para cima do pé de apoio
        quadrilY: 0.2 * Math.sin(f), troncoY: -0.32 * Math.sin(f), cabecaY: 0.14 * Math.sin(f), // quadril e ombros torcem ao contrário; a cabeça fica firme
        quadrilZ: 0.07 * Math.cos(f), troncoZ: -0.05 * Math.cos(f), // o quadril cai do lado da perna que está no ar e o tronco compensa
        troncoX: 0.2 + 0.14 * v + 0.03 * Math.cos(2 * f), cabecaX: -0.18 - 0.08 * v + 0.03 * Math.sin(2 * f),
        vento: 0.2 + (s.vel ?? 13) * 0.007 + 0.05 * Math.cos(2 * f - 1.6), balanco: 0.07,
        esticar: 0.02 * Math.cos(2 * f - 2.2),
      };
      for (const k of [0, 1]) {
        const ff = f + (k ? Math.PI : 0);
        const sw = Math.sin(ff); const cw = Math.cos(ff);
        // coxa: sobe bem na frente (joelho alto) e estende atrás no impulso
        r[`cx${k}`] = -0.22 - 0.62 * sw - 0.2 * Math.max(0, sw) ** 2 + 0.12 * Math.max(0, -sw) ** 2;
        // joelho: quase esticado no apoio, dobra muito (calcanhar perto do corpo) quando a perna volta para a frente
        r[`j${k}`] = 0.18 + 1.75 * Math.max(0, cw) ** 1.25 + 0.3 * Math.max(0, -sw) * Math.max(0, -cw) + 0.35 * Math.max(0, sw) ** 3;
        // pé: chega de calcanhar, rola e empurra com a ponta
        r[`p${k}`] = 0.55 * Math.max(0, -sw) ** 1.5 - 0.3 * Math.max(0, sw) ** 2 + 0.25 * Math.max(0, cw);
        r[`cz${k}`] = lado(k) * 0.02;
        // braço dobrado, do outro lado da perna: a mão sobe até a altura do queixo e o cotovelo vai bem para trás
        const aw = Math.sin(ff + Math.PI - 0.15);
        r[`ox${k}`] = -0.08 - 0.95 * aw;
        r[`oy${k}`] = -lado(k) * 0.25 * Math.max(0, aw); // a mão cruza um pouco na frente do corpo
        r[`oz${k}`] = lado(k) * (0.14 - 0.1 * Math.max(0, aw) + 0.08 * Math.max(0, -aw));
        r[`c${k}`] = -1.45 - 0.4 * Math.max(0, aw) + 0.3 * Math.max(0, -aw); // fecha na frente, abre atrás
        r[`m${k}`] = -0.15 - 0.22 * Math.sin(ff + Math.PI - 0.8); // o pulso vem atrasado em relação ao braço
      }
      return r;
    },
    ar: (s) => {
      // Pulo em três tempos: sai esticada (uma perna empurra, o joelho da outra sobe, braços para cima),
      // encolhe no alto e, descendo, abre os braços e estica as pernas para procurar o chão.
      const u = Math.max(-1, Math.min(1, (s.vy ?? 0) / 9));
      const sobe = Math.max(0, u) ** 0.8; const desce = Math.max(0, -u) ** 0.8; const alto = 1 - sobe - desce;
      const P = (a, b, c) => a * sobe + b * alto + c * desce;
      return {
        esticar: P(0.07, -0.02, 0.03), troncoX: P(0.05, 0.22, 0.02), cabecaX: P(-0.3, -0.12, -0.05),
        vento: P(-0.25, 0.25, 0.75), balanco: 0.1,
        cx0: P(-1.35, -1.25, -0.5), j0: P(1.5, 1.65, 0.45), p0: P(0.1, -0.1, -0.25), cz0: -0.06,
        cx1: P(0.42, -0.75, -0.2), j1: P(0.25, 1.5, 0.3), p1: P(0.75, 0.2, -0.15), cz1: 0.06,
        ox0: P(-0.6, -1.0, -0.5), oz0: P(-0.3, -0.5, -1.15), c0: P(-1.2, -0.9, -0.3),
        ox1: P(-2.75, -1.5, -0.7), oz1: P(0.25, 0.55, 1.15), c1: P(-0.35, -0.8, -0.3),
        m0: P(-0.2, 0, 0.25), m1: P(0.1, 0, 0.25),
      };
    },
    pouso: () => ({
      // amortece: o corpo achata, joelhos dobram, tronco vai à frente e os braços descem para equilibrar
      posY: -0.17, esticar: -0.07, troncoX: 0.5, cabecaX: -0.38, vento: -0.2, balanco: 0.1,
      cx0: -0.85, j0: 1.4, p0: -0.4, cx1: -0.55, j1: 1.2, p1: -0.3, cz0: -0.09, cz1: 0.09,
      ox0: 0.35, oz0: -0.5, c0: -0.55, ox1: 0.2, oz1: 0.5, c1: -0.55,
    }),
    desliza: () => ({
      // escorrega para trás, uma perna esticada à frente e a outra dobrada, olhando para a frente
      rotX: -1.0, posY: 0.12, posZ: 0.75, troncoX: 0.25, cabecaX: 0.75, vento: 0.7, balanco: 0.04,
      cx0: -0.25, j0: 0.05, p0: -0.3, cx1: 0.5, j1: 1.6, p1: 0.3,
      ox0: 0.5, oz0: -0.6, c0: -0.3, ox1: 0.5, oz1: 0.6, c1: -0.3,
    }),
    voo: (s, t) => ({
      // pendurada na mochila: pernas balançam soltas, braços abertos equilibram
      posY: 0.04 * Math.sin(t * 2), troncoX: 0.3, cabecaX: -0.3, vento: 0.6, balanco: 0.12,
      cx0: 0.1 + 0.12 * Math.sin(t * 3), j0: 0.6 + 0.1 * Math.sin(t * 3 + 1), p0: 0.5,
      cx1: 0.3 + 0.12 * Math.sin(t * 3 + 1.4), j1: 0.8 + 0.1 * Math.sin(t * 3 + 2), p1: 0.5,
      ox0: -0.5 + 0.1 * Math.sin(t * 2), oz0: -(1.1 + 0.1 * Math.sin(t * 3)), c0: -0.25,
      ox1: -0.5 + 0.1 * Math.sin(t * 2 + 1), oz1: 1.1 + 0.1 * Math.sin(t * 3 + 1), c1: -0.25,
    }),
    heroi: (s, t) => {
      // voando de super-heroína: deitada no ar, um braço esticado à frente, o outro junto do corpo,
      // pernas juntas e esticadas, cabeça erguida olhando o caminho, cabelo e capa ao vento
      const b = Math.sin(t * 2.2);
      return {
        rotX: 1.32 + 0.04 * b, rotY: -0.42, posY: 0.2 + 0.06 * b, posZ: -0.75, troncoX: -0.12, cabecaX: -0.95, troncoZ: 0.05 * Math.sin(t * 1.3),
        vento: 1.1, balanco: 0.14,
        ox1: -2.95, oy1: 0, oz1: 0.12, c1: -0.08, m1: 0.1,
        ox0: 0.15, oz0: -0.22, c0: -0.35, m0: -0.2,
        cx0: 0.04, j0: 0.12 + 0.05 * b, p0: 0.75, cz0: -0.02,
        cx1: 0.2, j1: 0.55 + 0.08 * b, p1: 0.75, cz1: 0.03,
      };
    },
    nave: (s, t) => ({
      // sentada na nave, mãos no painel, olhando em volta maravilhada
      posY: -0.28, troncoX: 0.06, cabecaX: -0.1 + 0.06 * Math.sin(t * 0.9), cabecaY: 0.45 * Math.sin(t * 0.7), vento: 0.05, balanco: 0.02,
      cx0: -1.5, cz0: -0.1, j0: 1.45, p0: 0.15, cx1: -1.5, cz1: 0.1, j1: 1.45, p1: 0.15,
      ox0: -0.95, oz0: -0.15, c0: -0.65, ox1: -0.95, oz1: 0.15, c1: -0.65, olhar: 0.8 * Math.sin(t * 0.7 + 0.4),
    }),
    skate: (s, t) => {
      // de lado na prancha, como quem anda de skate de verdade: o corpo vira 90°, os pés
      // ficam afastados ao longo da prancha (um na frente, outro na rabeta), joelhos dobrados
      // acompanhando o balanço, braços abertos e a cabeça virada para olhar o caminho
      const b = Math.sin(t * 3.2);
      const b2 = Math.sin(t * 1.6);
      return {
        rotY: -Math.PI / 2, posY: -0.07 + 0.02 * b, posZ: 0, troncoX: 0.22 + 0.03 * b, troncoY: 0.32, troncoZ: 0.04 * b2,
        quadrilY: 0.05 * b2, cabecaY: 1.15, cabecaX: -0.12, vento: 0.45, balanco: 0.08,
        // pernas abertas para os lados do corpo = ao longo da prancha
        cx0: -0.35 - 0.06 * b, cz0: -0.3, j0: 0.75 + 0.1 * b, p0: -0.28,
        cx1: -0.35 - 0.06 * b, cz1: 0.3, j1: 0.75 + 0.1 * b, p1: -0.28,
        // braço da frente aberto para a frente, o de trás para trás, equilibrando
        ox0: -0.2, oz0: -1.05 - 0.08 * b2, c0: -0.45, ox1: -0.35, oz1: 1.15 + 0.08 * b2, c1: -0.6,
      };
    },
    vitrine: (s, t) => {
      // no saguão: mão na cintura, peso numa perna, cabeça inclinada, respirando;
      // de tempos em tempos ela acena para quem está jogando e troca o peso de perna
      const r = POSES.parado(s, t);
      const resp = Math.sin(t * 2.2);
      const ciclo = (t + 3) % 9; // a cada 9 s, um aceno de quase 2 s
      const aceno = suave(Math.min(1, ciclo / 0.35)) * suave(Math.min(1, Math.max(0, (2.1 - ciclo) / 0.35)));
      const peso = suave(0.5 + 0.5 * Math.sin(t * 0.35)); // passa o peso de uma perna para a outra, devagar
      const v = {
        ...r, ...maoNaCintura(1), posX: 0.02 - 0.02 * peso, quadrilZ: 0.09 - 0.05 * peso, troncoZ: -0.07 + 0.03 * peso, troncoX: 0.02 + 0.012 * resp, troncoY: 0.12,
        cabecaZ: 0.1 + 0.02 * Math.sin(t * 0.9) - 0.06 * aceno, cabecaY: -0.1 + 0.12 * Math.sin(t * 0.5), cabecaX: 0.02 - 0.04 * aceno,
        cx0: -0.04 * peso, cz0: -0.06, j0: 0.03 + 0.12 * peso, p0: 0.1 * peso, cx1: -0.12 + 0.08 * peso, cz1: 0.12, j1: 0.32 - 0.22 * peso, p1: 0.25 - 0.2 * peso,
        ox0: 0.05 + 0.03 * resp, oy0: 0, oz0: -0.18, c0: -0.25, m0: -0.12, m1: 0.3, vento: 0.05, balanco: 0.02,
      };
      if (aceno > 0) {
        // braço levantado ao lado do rosto, o antebraço balançando de um lado para o outro
        const alvo = { ox0: -0.25, oy0: -1.45, oz0: -1.35, c0: -1.55 + 0.38 * Math.sin(t * 11), m0: 0.1 };
        for (const [j, x] of Object.entries(alvo)) v[j] = v[j] * (1 - aceno) + x * aceno;
        v.olhar *= 1 - aceno;
      }
      return v;
    },
    comemora: (s, t) => {
      // recorde: braço para cima, a outra mão na cintura, pulinhos
      const pulo = Math.abs(Math.sin(t * 5));
      return {
        ...maoNaCintura(0), posY: 0.04 * pulo, troncoX: -0.05, cabecaX: -0.12, cabecaZ: 0.08,
        ox1: -2.5 + 0.15 * Math.sin(t * 10), oy1: 0, oz1: 0.75, c1: -0.45,
        cx0: -0.05, j0: 0.15 + 0.2 * pulo, cx1: -0.3, j1: 0.5 + 0.2 * pulo, p1: 0.3, cz0: -0.06, cz1: 0.08, vento: 0.15, balanco: 0.05,
      };
    },
    capturada: (s, t) => {
      // presa por quem a perseguia: de frente para a tela, ombros caídos, mãos juntas na frente,
      // cabeça um pouco baixa e soluçando de leve
      const solu = Math.max(0, Math.sin(t * 7)) * (0.5 + 0.5 * Math.sin(t * 1.3));
      return {
        posY: -0.01, troncoX: 0.16 + 0.03 * solu, cabecaX: 0.16 + 0.03 * solu, cabecaZ: 0.08, cabecaY: 0.06 * Math.sin(t * 0.8),
        ox0: -0.42, oy0: 0.25, oz0: 0.02, c0: -1.05, m0: -0.2, ox1: -0.42, oy1: -0.25, oz1: -0.02, c1: -1.05, m1: -0.2,
        cz0: -0.02, cz1: 0.02, cx1: -0.04, j0: 0.06, j1: 0.14, p1: 0.08, vento: 0.04, balanco: 0.02, palpebra: 0.3, olhar: 0,
      };
    },
    triste: (s, t) => ({
      // não foi dessa vez: ombros caídos e cabeça baixa
      troncoX: 0.22, cabecaX: 0.32, cabecaY: 0.1 * Math.sin(t * 0.6), posY: -0.01,
      ox0: 0.12, oz0: -0.06, c0: -0.15, ox1: 0.12, oz1: 0.06, c1: -0.15,
      cz0: -0.03, cz1: 0.03, j0: 0.08, j1: 0.12, vento: 0.04, balanco: 0.02, palpebra: 0.35, m0: -0.05, m1: -0.05,
    }),
    batida: () => ({
      // o susto da batida: tronco para trás e braços para cima
      posY: -0.05, troncoX: -0.35, cabecaX: 0.3, vento: 0.2, balanco: 0.02,
      cx0: -0.4, j0: 0.6, cx1: 0.2, j1: 0.4, ox0: -2.6, oz0: -0.5, c0: -0.4, ox1: -2.6, oz1: 0.5, c1: -0.4,
    }),
  };
  let ultimoTPose = null; let yAntes = 0; let pouso = 0;
  // a cabeça segue o corpo com um pouquinho de atraso e de sobra (como uma mola), o que tira o ar de boneco
  const mola = { cabecaX: [0, 0], cabecaY: [0, 0], cabecaZ: [0, 0] };
  const molaCabelo = [0, 0]; // o cabelo segue o corpo atrasado e passa do ponto antes de assentar
  let proximaPiscada = 1.5; let piscada = 0;

  function posar(s, t, poseForcada = null) {
    const dtp = ultimoTPose === null ? 1 : Math.min(0.05, Math.max(0, t - ultimoTPose));
    ultimoTPose = t;
    const parado = s.t === 0 && s.dist === 0; // tela inicial: ela espera, parada
    const naPrancha = s.skate > 0;
    const fase = parado ? t * 2 : s.dist * 1.55;
    if (yAntes > 0.15 && s.y <= 0.001 && s.voo <= 0) pouso = 0.26; // acabou de pousar
    yAntes = s.y;
    pouso = Math.max(0, pouso - dtp);
    let estado = 'corrida';
    if (poseForcada) estado = poseForcada;
    else if (!s.vivo) estado = 'batida';
    else if (parado) estado = 'parado';
    else if (s.voo > 0) estado = { capa: 'heroi', nave: 'nave' }[s.vooTipo] ?? 'voo';
    else if (s.deslizando > 0 && s.y < 0.2) estado = 'desliza';
    else if (s.y > 0.05) estado = 'ar';
    else if (pouso > 0) estado = 'pouso';
    else if (naPrancha) estado = 'skate';
    const k = dtp >= 1 ? 1 : 1 - Math.exp(-dtp * 14);
    for (const nome of Object.keys(pesos)) pesos[nome] += ((nome === estado ? 1 : 0) - pesos[nome]) * k;
    const a = Object.fromEntries(JUNTAS.map((j) => [j, 0]));
    let total = 0;
    for (const [nome, w] of Object.entries(pesos)) {
      if (w < 0.01) continue;
      const pose = POSES[nome](s, t, fase);
      for (const j of JUNTAS) a[j] += (pose[j] ?? 0) * w;
      total += w;
    }
    for (const j of JUNTAS) a[j] /= total;
    for (const [j, m] of Object.entries(mola)) {
      if (dtp >= 1) { m[0] = a[j]; m[1] = 0; } else {
        // mola amortecida: frequência ~16 rad/s, amortecimento 0,6
        m[1] += ((a[j] - m[0]) * 256 - m[1] * 19) * dtp;
        m[0] += m[1] * dtp;
      }
      a[j] = m[0];
    }
    // piscar: a cada 2 a 5 s, rápido; às vezes duas vezes seguidas
    if (t >= proximaPiscada) { piscada = 0.14; proximaPiscada = t + (Math.random() < 0.2 ? 0.3 : 2 + Math.random() * 3); }
    piscada = Math.max(0, piscada - dtp);
    const fechado = Math.max(a.palpebra, piscada > 0 ? Math.sin((piscada / 0.14) * Math.PI) : 0);
    // expressão: triste quando perde (tela de fim e captura); sorrindo no resto do tempo
    const tristeza = Math.min(1, pesos.triste + pesos.capturada);
    sorriso.visible = false; labio.visible = tristeza < 0.5; bocaTriste.visible = tristeza >= 0.5;
    for (const b of sobrancelhas) {
      b.sobrancelha.rotation.z = b.z0 - b.lado * 0.45 * tristeza; // a ponta de dentro sobe
      b.sobrancelha.position.y = b.y0 + 0.004 * tristeza;
    }
    for (const l of lagrimas) {
      l.g.visible = pesos.capturada > 0.5;
      if (l.g.visible) {
        const ciclo = ((t * 0.7 + (l.l > 0 ? 0.45 : 0)) % 1);
        l.g.position.set(l.x + l.l * 0.004 * ciclo, -0.022 - ciclo * 0.06, l.z - ciclo * 0.004);
        l.g.scale.setScalar(ciclo > 0.9 ? (1 - ciclo) * 10 : 1); l.g.scale.y *= 1.3;
      }
    }
    for (const o of olhos) {
      o.sup.rotation.x = o.aberta + (PALPEBRA_FECHADA - o.aberta) * fechado;
      o.brilho.visible = fechado < 0.5;
      o.mira.rotation.y = 0.28 * a.olhar;
    }

    // troca de faixa: inclina para dentro da curva e vira um pouco o corpo para o lado
    const desvio = s.x - s.faixa;
    raiz.position.set(xDe(s.x), s.y + (naPrancha ? 0.1 : 0), 0);
    raiz.rotation.set(0, desvio * 0.35, -desvio * 0.3);
    corpo.position.set(a.posX, a.posY, a.posZ);
    corpo.rotation.set(a.rotX, a.rotY, 0);
    corpo.scale.set(LARGO * (1 - a.esticar * 0.5), 1 + a.esticar, LARGO * (1 - a.esticar * 0.5)); // estica na subida do pulo, achata no pouso
    if (dtp >= 1) { molaCabelo[0] = a.vento; molaCabelo[1] = 0; } else { molaCabelo[1] += ((a.vento - molaCabelo[0]) * 90 - molaCabelo[1] * 7) * dtp; molaCabelo[0] += molaCabelo[1] * dtp; }
    quadril.rotation.set(0, a.quadrilY, a.quadrilZ);
    tronco.rotation.set(a.troncoX, a.troncoY, a.troncoZ);
    cabeca.rotation.set(a.cabecaX, a.cabecaY, a.cabecaZ);
    pernas.forEach((p, i) => {
      p.coxa.rotation.set(a[`cx${i}`], 0, a[`cz${i}`]);
      p.joelho.rotation.x = a[`j${i}`];
      p.tenis.rotation.x = a[`p${i}`];
    });
    bracos.forEach((b, i) => {
      b.ombro.rotation.set(a[`ox${i}`], a[`oy${i}`], a[`oz${i}`]);
      b.cotovelo.rotation.x = a[`c${i}`];
      b.mao.rotation.set(a[`m${i}`], 0, -lado(i) * 0.08);
    });
    // cada mecha balança com um pouco de atraso em relação às outras
    for (const m of mechas) {
      m.piv.rotation.x = molaCabelo[0] * 0.5 + Math.sin(fase * 2 + m.fase) * a.balanco;
      m.piv.rotation.z = Math.sin(fase + m.fase * 0.7) * a.balanco * 0.6;
    }
    const naNave = s.voo > 0 && s.vooTipo === 'nave';
    const deCapa = s.voo > 0 && s.vooTipo === 'capa';
    skate.visible = naPrancha && !naNave;
    if (naPrancha) {
      matDeck.color.setHex(SKATE_COR[s.skateTipo] ?? SKATE_COR.classico);
      rodas.visible = s.skateTipo === 'classico';
      brilhoSkate.visible = s.skateTipo === 'voador';
      chamasSkate.forEach((f) => { f.visible = s.skateTipo === 'supersonico'; f.scale.setScalar(0.8 + Math.random() * 0.4); });
      skate.position.y = -0.1 + (s.skateTipo === 'voador' ? 0.05 + Math.sin(t * 5) * 0.025 : 0);
    }
    maleta.visible = s.voo > 0 && !naNave && !deCapa;
    mochilaCostas.visible = temMochila && !maleta.visible && !deCapa; // a mochila a jato e a capa ocupam o lugar dela
    // capa tremulando: quanto mais longe do ombro, mais ela balança e se solta das costas
    for (const parte of partesCapa) parte.visible = deCapa;
    if (deCapa) {
      const pos = geoCapa.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x0 = basePosCapa[i * 3]; const y0 = basePosCapa[i * 3 + 1]; const d = -y0 / 0.8;
        const onda = Math.sin(t * 15 - d * 7 + x0 * 6) * 0.05 * d;
        pos.setXYZ(i, x0 * (1 + 0.08 * Math.sin(t * 9 + d * 4)), y0 * (1 - 0.06 * d), -0.035 * d - 0.07 * d * d + onda);
      }
      pos.needsUpdate = true; geoCapa.computeVertexNormals();
    }
    // nave: luzes piscando em volta e o raio trator até o chão
    nave.visible = naNave;
    if (naNave) {
      nave.rotation.y = Math.sin(t * 0.8) * 0.08; nave.rotation.z = Math.sin(t * 1.3) * 0.05;
      nave.position.y = 0.2 + Math.sin(t * 2.4) * 0.05;
      luzesNave.forEach((l, k) => { l.material.emissiveIntensity = (Math.floor(t * 8) + k) % 3 === 0 ? 2.5 : 0.4; });
      const alturaFeixe = Math.max(0.5, s.y + 0.0);
      raioTrator.scale.set(1, alturaFeixe, 1); raioTrator.position.y = -0.22 - alturaFeixe / 2;
      raioTrator.material.opacity = 0.1 + 0.05 * Math.sin(t * 6);
    }
    // teletransporte: coluna de luz ao entrar e ao sair da nave
    if (naNave !== naNaveAntes) teletransporte = 0.9;
    naNaveAntes = naNave;
    teletransporte = Math.max(0, teletransporte - dtp);
    teleFeixe.visible = teletransporte > 0;
    if (teletransporte > 0) {
      const alto = 4.6 + s.y;
      teleFeixe.scale.set(1 + 0.15 * Math.sin(t * 30), alto, 1 + 0.15 * Math.sin(t * 30));
      teleFeixe.position.y = -s.y + alto / 2;
      teleFeixe.material.opacity = 0.55 * Math.sin((teletransporte / 0.9) * Math.PI);
    }
    chamasMaleta.forEach((f) => f.scale.set(1, 0.7 + Math.random() * 0.6, 1));
    // fumaça: nuvenzinhas que saem dos bocais e ficam para trás
    const dt = Math.min(0.05, Math.max(0, t - ultimoT)); ultimoT = t;
    if (s.voo > 0 && !naNave && !deCapa && t >= proximaFumaca) {
      proximaFumaca = t + 0.04;
      const livre = fumaca.find((f) => f.vida <= 0);
      if (livre) {
        livre.vida = 0.7;
        livre.sp.visible = true;
        livre.sp.position.set((Math.random() - 0.5) * 0.15, 0.55, -0.2);
        livre.sp.scale.setScalar(0.18);
      }
    }
    for (const f of fumaca) {
      if (f.vida <= 0) { f.sp.visible = false; continue; }
      f.vida -= dt;
      f.sp.position.z -= dt * (s.vel ?? 12) * 0.6;
      f.sp.position.y -= dt * 0.4;
      f.sp.scale.setScalar(0.18 + (0.7 - f.vida) * 0.9);
      f.sp.material.opacity = Math.max(0, f.vida) * 0.7;
    }
    const corAura = s.supercarga > 0 ? 0xffc828 : s.escudo ? 0x50aaff : s.ima > 0 ? 0xff5a5a : null;
    aura.visible = corAura !== null && !naNave && !deCapa; // de capa ou na nave o ímã já vem junto: sem brilho em volta
    if (corAura !== null) { aura.material.color.setHex(corAura); aura.material.opacity = 0.45 + Math.sin(t * 8) * 0.1; }
    raiz.visible = !(s.invencivel > 0 && Math.floor(t * 12) % 2 === 0);
    if (poseForcada) {
      // no saguão e na tela de fim: só ela, sem skate, mochila nem auras
      skate.visible = false; maleta.visible = false; aura.visible = false; raiz.visible = true; mochilaCostas.visible = temMochila;
      nave.visible = false; teleFeixe.visible = false; for (const parte of partesCapa) parte.visible = false;
      for (const f of fumaca) f.sp.visible = false;
      raiz.position.y = 0;
    }
  }

  return { raiz, vestir, posar };
}
