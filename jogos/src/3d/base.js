// Peças comuns do 3D: medidas da pista, texturas desenhadas na hora e materiais.
import * as THREE from '../../vendor/three.module.min.js';

export { THREE };
export const FAIXA = 1.6; // largura de cada faixa, em metros
// Com a câmera olhando para a frente (+z), a esquerda da tela é +x: a faixa 0 fica em +x.
export const xDe = (f) => (1 - f) * FAIXA;
export const LARG_RUA = FAIXA * 3 + 0.4;
export const CALCADA = 2.2;
export const COMP_CENA = 130;
export const INICIO = -12; // onde o cenário começa, atrás da câmera

export function textura(w, h, desenhar, repetir = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repetir) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
  return t;
}

export function ruido(ctx, w, h, n, cor, tam = 2) {
  ctx.fillStyle = cor;
  for (let k = 0; k < n; k++) ctx.fillRect(Math.random() * w, Math.random() * h, tam, tam);
}

// Material "desenho animado" para o cenário: poucas faixas de luz.
let GRADIENTE = null;
export function toon(cor, extra = {}) {
  if (!GRADIENTE) {
    GRADIENTE = new THREE.DataTexture(new Uint8Array([90, 160, 220, 255]), 4, 1, THREE.RedFormat);
    GRADIENTE.minFilter = THREE.NearestFilter; GRADIENTE.magFilter = THREE.NearestFilter; GRADIENTE.needsUpdate = true;
  }
  return new THREE.MeshToonMaterial({ color: cor, gradientMap: GRADIENTE, ...extra });
}

// Mesmo material, mas reaproveitado entre todas as peças da mesma cor: os cenários têm milhares
// de peças, e um material para cada uma deixava a troca de cenário travando. Só para quem não
// muda o material depois (cor, transparência...) e não usa textura própria.
const TOONS = new Map();
export function toonFixo(cor, extra = {}) {
  if (extra.map || extra.alphaMap || extra.emissiveMap) return toon(cor, extra);
  const chave = `${cor}|${JSON.stringify(extra)}`;
  let m = TOONS.get(chave);
  if (!m) { m = toon(cor, extra); m.userData.compartilhado = true; TOONS.set(chave, m); }
  return m;
}

// Material dos personagens: desenho animado de cores chapadas, com luz e sombra em três faixas suaves.
let GRADIENTE_P = null;
export function desenho({ roughness, metalness, ...params } = {}) {
  if (!GRADIENTE_P) {
    // rampa suave (sem degraus duros): sombra quente, meio-tom e luz, como numa ilustração de animação
    GRADIENTE_P = new THREE.DataTexture(new Uint8Array([118, 150, 190, 225, 246, 255]), 6, 1, THREE.RedFormat);
    GRADIENTE_P.minFilter = THREE.LinearFilter; GRADIENTE_P.magFilter = THREE.LinearFilter; GRADIENTE_P.needsUpdate = true;
  }
  return new THREE.MeshToonMaterial({ gradientMap: GRADIENTE_P, ...params });
}

export const sombrear = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

let BRILHO = null;
export function texBrilho() {
  BRILHO ??= textura(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
  return BRILHO;
}

// Libera a memória de um grupo inteiro (geometrias, materiais e texturas próprias).
export function descartar(obj, manter = new Set()) {
  obj.traverse((x) => {
    if (x.geometry && !manter.has(x.geometry)) x.geometry.dispose();
    const mats = Array.isArray(x.material) ? x.material : x.material ? [x.material] : [];
    for (const m of mats) {
      if (manter.has(m) || m.userData.compartilhado) continue;
      if (m.map && !manter.has(m.map)) m.map.dispose();
      m.dispose();
    }
  });
}
