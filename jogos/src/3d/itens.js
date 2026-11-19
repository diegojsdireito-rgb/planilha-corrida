// Itens da pista em 3D (ímã, tênis de mola, escudo, raio, ×2, baú, foguete, skate e capa),
// no mesmo jeito da mochila a jato: objetos de verdade girando e brilhando, sem bolhas.
// Cada modelo é montado uma vez; os itens da pista são cópias que dividem geometria e material.
import { THREE, textura, texBrilho, sombrear } from './base.js';

const mat = (cor, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.45, ...extra });
const metal = (cor = 0xd4d9e2) => mat(cor, { roughness: 0.25, metalness: 0.85 });
const ouro = () => mat(0xffc531, { roughness: 0.3, metalness: 0.7, emissive: 0x6a4500, emissiveIntensity: 0.3 });
const brilhante = (cor) => mat(cor, { emissive: cor, emissiveIntensity: 0.35 });
const malha = (geo, m) => sombrear(new THREE.Mesh(geo, m));

function estrela(raioFora, raioDentro, pontas = 5) {
  const s = new THREE.Shape();
  for (let k = 0; k < pontas * 2; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / pontas;
    const r = k % 2 ? raioDentro : raioFora;
    if (k === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
const extrudar = (forma, fundo, chanfro = 0.012) => {
  const g = new THREE.ExtrudeGeometry(forma, { depth: fundo, bevelEnabled: true, bevelThickness: chanfro, bevelSize: chanfro, bevelSegments: 3, curveSegments: 16 });
  g.center();
  return g;
};

class Mola extends THREE.Curve {
  constructor(raio, altura, voltas) { super(); this.raio = raio; this.altura = altura; this.voltas = voltas; }
  getPoint(t, alvo = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * this.voltas;
    return alvo.set(Math.cos(a) * this.raio, -t * this.altura, Math.sin(a) * this.raio);
  }
}

const MODELOS = {
  ima() {
    // ímã em ferradura: vermelho com as pontas prateadas, aberto para baixo
    const g = new THREE.Group();
    const vermelho = mat(0xe53935, { roughness: 0.35 });
    const arco = malha(new THREE.TorusGeometry(0.15, 0.065, 14, 28, Math.PI), vermelho); arco.position.y = 0.06; g.add(arco);
    for (const lado of [-1, 1]) {
      const perna = malha(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 18), vermelho); perna.position.set(lado * 0.15, -0.02, 0); g.add(perna);
      const ponta = malha(new THREE.CylinderGeometry(0.067, 0.067, 0.09, 18), metal()); ponta.position.set(lado * 0.15, -0.145, 0); g.add(ponta);
    }
    return { g, cor: 0xff6b6b };
  },
  pulo() {
    // tênis verde com uma mola embaixo
    const g = new THREE.Group();
    const sola = malha(new THREE.CapsuleGeometry(0.075, 0.2, 6, 16), mat(0xffffff, { roughness: 0.6 })); sola.rotation.z = Math.PI / 2; sola.scale.set(0.45, 1, 1); sola.position.y = 0.02; g.add(sola);
    const verde = mat(0x35c46a);
    const cano = malha(new THREE.CapsuleGeometry(0.07, 0.08, 6, 16), verde); cano.position.set(-0.07, 0.11, 0); cano.scale.set(1, 1, 0.95); g.add(cano);
    const bico = malha(new THREE.SphereGeometry(0.075, 18, 12), verde); bico.scale.set(1.5, 0.75, 0.95); bico.position.set(0.07, 0.065, 0); g.add(bico);
    const ponteira = malha(new THREE.SphereGeometry(0.055, 14, 10), mat(0xffffff)); ponteira.scale.set(1, 0.6, 1.2); ponteira.position.set(0.17, 0.045, 0); g.add(ponteira);
    const branco = mat(0xffffff);
    for (let k = 0; k < 3; k++) {
      const cadarco = malha(new THREE.BoxGeometry(0.012, 0.012, 0.11), branco); cadarco.position.set(0.0 + k * 0.045, 0.13 - k * 0.022, 0); cadarco.rotation.z = -0.45; g.add(cadarco);
    }
    const listra = malha(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), mat(0xffd21f)); listra.position.set(0.02, 0.07, 0.068); g.add(listra);
    const mola = malha(new THREE.TubeGeometry(new Mola(0.06, 0.16, 4), 80, 0.012, 8), metal()); mola.position.set(0.02, -0.02, 0); g.add(mola);
    const base = malha(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 18), metal(0x9aa3b0)); base.position.set(0.02, -0.19, 0); g.add(base);
    g.position.y = 0.05;
    return { g, cor: 0x35c46a };
  },
  escudo() {
    // escudo azul com borda prateada e uma estrela dourada
    const g = new THREE.Group();
    const forma = new THREE.Shape();
    forma.moveTo(0, 0.24);
    forma.quadraticCurveTo(0.12, 0.2, 0.2, 0.22);
    forma.quadraticCurveTo(0.21, 0, 0, -0.25);
    forma.quadraticCurveTo(-0.21, 0, -0.2, 0.22);
    forma.quadraticCurveTo(-0.12, 0.2, 0, 0.24);
    const borda = malha(extrudar(forma, 0.05, 0.015), metal()); g.add(borda);
    const miolo = malha(extrudar(forma, 0.05, 0.01), mat(0x3e8bff, { roughness: 0.35 })); miolo.scale.set(0.82, 0.82, 1.15); g.add(miolo);
    const est = malha(extrudar(estrela(0.08, 0.035), 0.02, 0.008), ouro()); est.position.set(0, 0.02, 0.045); g.add(est);
    const atras = est.clone(); atras.position.z = -0.045; g.add(atras);
    return { g, cor: 0x6fb0ff };
  },
  raio() {
    // raio amarelo e luminoso, grosso como um bloco
    const g = new THREE.Group();
    const forma = new THREE.Shape();
    forma.moveTo(0.06, 0.27); forma.lineTo(-0.13, -0.02); forma.lineTo(-0.01, -0.02);
    forma.lineTo(-0.07, -0.27); forma.lineTo(0.14, 0.05); forma.lineTo(0.02, 0.05); forma.lineTo(0.1, 0.27); forma.closePath();
    g.add(malha(extrudar(forma, 0.06, 0.014), mat(0xffc400, { emissive: 0xffa000, emissiveIntensity: 0.55, roughness: 0.3 })));
    return { g, cor: 0xffd23f };
  },
  dobro() {
    // ficha cor-de-rosa com "×2" dos dois lados e borda dourada
    const g = new THREE.Group();
    const tex = textura(256, 256, (ctx) => {
      const gr = ctx.createRadialGradient(100, 90, 10, 128, 128, 128); gr.addColorStop(0, '#ff9cbc'); gr.addColorStop(1, '#e8336f');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 256, 256);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 132px sans-serif';
      ctx.lineWidth = 14; ctx.strokeStyle = '#8a0f3c'; ctx.strokeText('×2', 128, 140);
      ctx.fillStyle = '#fff'; ctx.fillText('×2', 128, 140);
    });
    tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2;
    const face = mat(0xffffff, { map: tex, roughness: 0.35, emissive: 0x3a0010, emissiveIntensity: 0.3 });
    const ficha = malha(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 36), [ouro(), face, face]);
    ficha.rotation.x = Math.PI / 2; g.add(ficha);
    const aro = malha(new THREE.TorusGeometry(0.21, 0.02, 10, 40), ouro()); g.add(aro);
    return { g, cor: 0xff6f9c };
  },
  bau() {
    // baú de madeira com cintas douradas, tampa entreaberta e moedas brilhando dentro
    const g = new THREE.Group();
    const madeira = mat(0x9a5b2a, { roughness: 0.75 });
    const caixa = malha(new THREE.BoxGeometry(0.38, 0.2, 0.26), madeira); caixa.position.y = -0.06; g.add(caixa);
    const tampa = new THREE.Group(); tampa.position.set(0, 0.04, -0.13); tampa.rotation.x = -0.55; g.add(tampa);
    const curva = malha(new THREE.CylinderGeometry(0.13, 0.13, 0.38, 20, 1, false, 0, Math.PI), madeira); curva.rotation.z = Math.PI / 2; curva.rotation.y = 0; curva.position.z = 0.13; tampa.add(curva);
    const tampao = malha(new THREE.CircleGeometry(0.13, 20, 0, Math.PI), madeira);
    for (const lado of [-1, 1]) { const t = tampao.clone(); t.rotation.y = lado * Math.PI / 2; t.rotation.z = Math.PI / 2; t.position.set(lado * 0.19, 0, 0.13); tampa.add(t); }
    const dourado = ouro();
    for (const x of [-0.12, 0.12]) {
      const cinta = malha(new THREE.BoxGeometry(0.035, 0.205, 0.265), dourado); cinta.position.set(x, -0.06, 0); g.add(cinta);
      const arco = malha(new THREE.TorusGeometry(0.132, 0.012, 6, 18, Math.PI), dourado); arco.rotation.y = Math.PI / 2; arco.position.set(x, 0, 0.13); tampa.add(arco);
    }
    const fecho = malha(new THREE.BoxGeometry(0.06, 0.07, 0.03), dourado); fecho.position.set(0, -0.0, 0.135); g.add(fecho);
    const moeda = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16);
    for (const [x, y, z, r] of [[-0.08, 0.06, 0.02, 0.3], [0.02, 0.07, -0.03, -0.5], [0.1, 0.06, 0.04, 0.8], [-0.02, 0.09, 0.06, 1.2], [0.07, 0.1, -0.06, -1]]) {
      const m = malha(moeda, dourado); m.position.set(x, y, z); m.rotation.set(r, 0, r * 0.7); g.add(m);
    }
    const luz = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0xffd23f, transparent: true, depthWrite: false, opacity: 0.9 }));
    luz.scale.set(0.4, 0.3, 1); luz.position.y = 0.1; g.add(luz);
    return { g, cor: 0xffc531 };
  },
  turbo() {
    // foguete branco de bico vermelho, com aletas e chama acesa
    const g = new THREE.Group();
    const corpo = malha(new THREE.LatheGeometry([[0, -0.2], [0.07, -0.19], [0.085, -0.1], [0.085, 0.05], [0.07, 0.12], [0.001, 0.13]].map(([x, y]) => new THREE.Vector2(x, y)), 24), mat(0xf4f6fa, { roughness: 0.3 }));
    g.add(corpo);
    const vermelho = mat(0xff4a2a);
    const bico = malha(new THREE.ConeGeometry(0.072, 0.12, 24), vermelho); bico.position.y = 0.17; g.add(bico);
    const janela = malha(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20), mat(0x6fc8ff, { roughness: 0.1, metalness: 0.3, emissive: 0x1a5a90, emissiveIntensity: 0.4 }));
    janela.rotation.x = Math.PI / 2; janela.position.set(0, 0.03, 0.08); g.add(janela);
    const aroJ = malha(new THREE.TorusGeometry(0.036, 0.008, 6, 20), metal()); aroJ.position.set(0, 0.03, 0.088); g.add(aroJ);
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3;
      const aleta = malha(new THREE.BoxGeometry(0.012, 0.11, 0.08), vermelho);
      aleta.position.set(Math.sin(a) * 0.1, -0.15, Math.cos(a) * 0.1); aleta.rotation.y = a; g.add(aleta);
    }
    const bocal = malha(new THREE.CylinderGeometry(0.045, 0.06, 0.04, 18), metal(0x5a6170)); bocal.position.y = -0.22; g.add(bocal);
    const fogo = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 12), new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9 }));
    fogo.rotation.x = Math.PI; fogo.position.y = -0.33; g.add(fogo);
    const miolo = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.1, 10), new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
    miolo.rotation.x = Math.PI; miolo.position.y = -0.29; g.add(miolo);
    g.rotation.z = -0.35;
    const embrulho = new THREE.Group(); embrulho.add(g); embrulho.position.y = 0.04;
    return { g: embrulho, cor: 0xff8a3a };
  },
  prancha() {
    // skate azul de lado, com eixos e rodinhas amarelas
    const g = new THREE.Group();
    const deck = malha(new THREE.CapsuleGeometry(0.1, 0.4, 4, 16), mat(0x29b7dc, { roughness: 0.5 })); deck.rotation.x = Math.PI / 2; deck.scale.set(1, 1, 0.16); g.add(deck);
    const lixa = malha(new THREE.BoxGeometry(0.17, 0.006, 0.48), mat(0x222222, { roughness: 1 })); lixa.position.y = 0.018; g.add(lixa);
    const raio = malha(extrudar(estrela(0.05, 0.022), 0.004, 0.002), ouro()); raio.rotation.x = -Math.PI / 2; raio.position.y = -0.02; g.add(raio);
    const roda = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16); const amarelo = mat(0xffd21f, { roughness: 0.5 }); const eixo = metal();
    for (const z of [-0.17, 0.17]) {
      const truck = malha(new THREE.BoxGeometry(0.16, 0.025, 0.03), eixo); truck.position.set(0, -0.04, z); g.add(truck);
      for (const x of [-0.085, 0.085]) { const r = malha(roda, amarelo); r.rotation.z = Math.PI / 2; r.position.set(x, -0.06, z); g.add(r); }
    }
    g.rotation.x = -0.5;
    const embrulho = new THREE.Group(); embrulho.add(g);
    return { g: embrulho, cor: 0x4fd0ff };
  },
  capa() {
    // capa vermelha de super-heroína, aberta como se estivesse num cabide, com a estrela dourada
    const g = new THREE.Group();
    const vermelho = mat(0xe8344a, { side: THREE.DoubleSide, roughness: 0.55 });
    const pano = malha(new THREE.CylinderGeometry(0.09, 0.24, 0.46, 24, 6, true, Math.PI * 0.62, Math.PI * 1.76), vermelho);
    // ondas na barra da capa
    const pos = pano.geometry.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k); const x = pos.getX(k); const z = pos.getZ(k);
      const queda = (0.23 - y) / 0.46;
      const onda = Math.sin(Math.atan2(x, z) * 5) * 0.03 * queda;
      pos.setXYZ(k, x * (1 + onda), y, z * (1 + onda));
    }
    pano.geometry.computeVertexNormals();
    pano.position.y = -0.02; pano.scale.z = 0.7; g.add(pano);
    const forro = malha(new THREE.CylinderGeometry(0.088, 0.236, 0.455, 24, 1, true, Math.PI * 0.62, Math.PI * 1.76), mat(0x9b1630, { side: THREE.BackSide }));
    forro.position.y = -0.02; forro.scale.z = 0.7; g.add(forro);
    const dourado = ouro();
    const gola = malha(new THREE.TorusGeometry(0.09, 0.018, 8, 24), dourado); gola.rotation.x = Math.PI / 2; gola.position.y = 0.21; g.add(gola);
    for (const lado of [-1, 1]) { const broche = malha(new THREE.SphereGeometry(0.03, 12, 10), dourado); broche.position.set(lado * 0.07, 0.2, 0.06); g.add(broche); }
    const est = malha(extrudar(estrela(0.075, 0.032), 0.012, 0.006), dourado); est.position.set(0, 0.0, -0.15); est.rotation.y = Math.PI; est.rotation.x = -0.2; g.add(est);
    const cabide = malha(new THREE.TorusGeometry(0.04, 0.008, 6, 16, Math.PI * 1.4), metal()); cabide.position.y = 0.27; cabide.rotation.z = -0.3; g.add(cabide);
    return { g, cor: 0xff5a6e };
  },
};

const prontos = new Map();
const recursos = new Set();

function modelo(tipo) {
  if (!prontos.has(tipo)) {
    const { g, cor } = MODELOS[tipo]();
    const grupo = new THREE.Group();
    g.scale.multiplyScalar(1.4); // do tamanho da mochila a jato
    grupo.add(g);
    const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: cor, transparent: true, depthWrite: false, opacity: 0.75 }));
    brilho.scale.set(1.15, 1.15, 1); brilho.renderOrder = -1; grupo.add(brilho);
    grupo.traverse((x) => {
      if (x.geometry) recursos.add(x.geometry);
      for (const m of [x.material].flat()) if (m) { recursos.add(m); if (m.map) recursos.add(m.map); }
    });
    prontos.set(tipo, grupo);
  }
  return prontos.get(tipo);
}

export const TIPOS_ITEM = Object.keys(MODELOS);
export const temItem3D = (tipo) => tipo in MODELOS;

// Uma cópia do modelo: as peças são compartilhadas, então cada item novo na pista sai de graça.
export function criarItem(tipo) {
  const g = modelo(tipo).clone();
  g.userData.flutua = true;
  g.userData.gira = true;
  return g;
}

// Peças que não podem ser liberadas quando um item sai da pista.
export const recursosDosItens = () => recursos;
