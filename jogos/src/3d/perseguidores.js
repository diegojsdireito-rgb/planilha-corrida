// Quem corre atrás da menina em cada cenário: policial (cidade), caranguejo (praia),
// leão ou panda (floresta, à escolha) e urso-polar (neve); os dos cenários novos (ursinho de goma,
// coelho mascote, raposa-do-deserto e etezinho) ficam em perseguidores-novos.js. Todos olham para a frente (+z),
// na mesma direção dela; a câmera vê as costas deles.
import { THREE, sombrear, textura, desenho } from './base.js';
import { geoCabeca, superficieDe, texIris, criarOlho, tuboAfinado, geoCabelo, geoCorpo, criarMao, criarTenis } from './anatomia.js';

export { quemPersegue } from '../perseguidores.js';
import { CRIAR_NOVOS } from './perseguidores-novos.js';

// cores chapadas de desenho animado; só o que é metal continua brilhando como metal
export const mat = (cor, extra = {}) => (extra.metalness ? new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, ...extra }) : desenho({ color: cor, ...extra }));
export const peca = (geo, m) => sombrear(new THREE.Mesh(geo, m));
export const bola = (r, m, seg = 16) => peca(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7)), m);
export const capsula = (r, l, m) => peca(new THREE.CapsuleGeometry(r, l, 6, 14), m);
const torneada = (perfil, m, seg = 18) => peca(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), seg), m);

// Pelo: risquinhos claros e escuros que dão cor e relevo de pelagem.
let TEX_PELO = null;
function texPelo() {
  TEX_PELO ??= textura(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    let s = 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 2600; k++) {
      const x = r() * w; const y = r() * h; const c = 5 + r() * 9;
      ctx.strokeStyle = r() < 0.5 ? `rgba(0,0,0,${0.05 + r() * 0.09})` : `rgba(255,255,255,${0.1 + r() * 0.15})`;
      ctx.lineWidth = 0.8 + r();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 4, y + c); ctx.stroke();
    }
  }, true);
  return TEX_PELO;
}
export const pelo = (cor, rep = 3) => { const t = texPelo().clone(); t.repeat.set(rep, rep); t.needsUpdate = true; return desenho({ color: cor, map: t }); };

// Junta várias peças numa malha só (uma chamada de desenho em vez de dezenas).
function fundir(pecas, material) {
  const pos = []; const nor = [];
  for (const m of pecas) {
    m.updateMatrix();
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrix);
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return peca(geo, material);
}
export const MAT_OLHO = () => ({ matBranco: mat(0xf4f1ea, { roughness: 0.2 }), matCilio: mat(0x16100c) });

// ---------- Acessórios estilosos ----------
export function bandana(pescoco, cor) {
  const m = mat(cor);
  const anel = peca(new THREE.TorusGeometry(0.2, 0.045, 8, 24), m); anel.rotation.x = Math.PI / 2; anel.position.set(0, -0.2, -0.05); pescoco.add(anel);
  const no = peca(new THREE.ConeGeometry(0.1, 0.2, 3), m); no.rotation.x = -Math.PI / 2 - 0.4; no.position.set(0, -0.24, -0.26); no.scale.z = 0.4; pescoco.add(no);
  for (let k = 0; k < 8; k++) { const b = bola(0.015, mat(0xffffff)); const a = (k / 8) * Math.PI * 2; b.position.set(Math.cos(a) * 0.2, -0.2, Math.sin(a) * 0.2 - 0.05); pescoco.add(b); }
}

function boneVirado(cabeca, cor, raio = 0.27, y = 0.1) {
  const g = new THREE.Group(); g.position.y = y; cabeca.add(g);
  const copa = peca(new THREE.SphereGeometry(raio, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(cor)); copa.scale.y = 0.75; g.add(copa);
  const aba = peca(new THREE.CylinderGeometry(raio * 0.7, raio * 0.7, 0.025, 20, 1, false, Math.PI * 0.5, Math.PI), mat(0xffffff)); aba.position.set(0, 0, -raio * 0.78); g.add(aba);
  return g;
}

function gorroComPompom(cabeca, cor, raio = 0.27, y = 0.08) {
  const g = new THREE.Group(); g.position.y = y; cabeca.add(g);
  const malha = peca(new THREE.SphereGeometry(raio, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(cor)); g.add(malha);
  const dobra = peca(new THREE.TorusGeometry(raio * 0.95, raio * 0.17, 8, 24), mat(0xffffff)); dobra.rotation.x = Math.PI / 2; g.add(dobra);
  const pompom = bola(raio * 0.3, mat(0xffffff)); pompom.position.y = raio * 1.1; g.add(pompom);
  return g;
}

function oculosEscuros(cabeca, largura, y, z, raio = 0.05) {
  const lente = mat(0x111418, { roughness: 0.1, metalness: 0.6 });
  for (const lado of [-1, 1]) { const l = peca(new THREE.CylinderGeometry(raio, raio, 0.015, 16), lente); l.rotation.x = Math.PI / 2; l.position.set(lado * largura, y, z); cabeca.add(l); }
  const ponte = peca(new THREE.BoxGeometry(largura, 0.012, 0.012), lente); ponte.position.set(0, y + raio * 0.3, z); cabeca.add(ponte);
  for (const lado of [-1, 1]) { const haste = peca(new THREE.BoxGeometry(0.012, 0.012, 0.18), lente); haste.position.set(lado * (largura + raio), y + raio * 0.3, z - 0.09); cabeca.add(haste); }
}

// ---------- Bicho de quatro patas (leão, panda, urso) ----------
export function quadrupede({ corpo, barriga, patas, cabeca, focinho, orelhas, nariz = 0x222222, iris = '#a86a1c', escala = 1, extras }) {
  const raiz = new THREE.Group();
  const tronco = new THREE.Group(); tronco.position.y = 0.72; raiz.add(tronco);
  const mCorpoMat = pelo(corpo); const mPatas = pelo(patas, 2); const mCab = pelo(cabeca, 2); const mFoc = pelo(focinho, 2);
  // corpo: garupa, cintura mais fina, peito fundo e a base do pescoço
  const mCorpo = torneada([[0, -0.62], [0.16, -0.6], [0.26, -0.5], [0.3, -0.3], [0.275, -0.05], [0.29, 0.15], [0.33, 0.32], [0.3, 0.48], [0.22, 0.6], [0, 0.64]], mCorpoMat, 24);
  mCorpo.rotation.x = Math.PI / 2; mCorpo.scale.set(0.94, 1, 1); tronco.add(mCorpo);
  const mBarriga = capsula(0.21, 0.5, pelo(barriga)); mBarriga.rotation.x = Math.PI / 2; mBarriga.position.set(0, -0.12, 0.03); mBarriga.scale.set(0.9, 1, 0.85); tronco.add(mBarriga);
  // ombros e ancas: os músculos de onde saem as patas
  for (const [x, z, r] of [[-0.19, 0.3, 0.17], [0.19, 0.3, 0.17], [-0.19, -0.32, 0.19], [0.19, -0.32, 0.19]]) { const m = bola(r, mCorpoMat); m.scale.set(0.7, 1.1, 1.05); m.position.set(x, -0.02, z); tronco.add(m); }
  const pernas = [];
  const mUnha = mat(0x2a2420, { roughness: 0.4 });
  for (const [x, z] of [[-0.17, 0.32], [0.17, 0.32], [-0.17, -0.3], [0.17, -0.3]]) {
    const piv = new THREE.Group(); piv.position.set(x, -0.08, z); tronco.add(piv);
    const frente = z > 0;
    // pata: coxa grossa, canela mais fina (a de trás tem o jarrete para trás) e o pé com dedos
    const perna = torneada([[0, 0.04], [0.105, 0.0], [0.11, -0.12], [0.088, -0.27], [0.074, -0.4], [0.08, -0.5], [0, -0.52]], mPatas, 16); perna.scale.z = 1.1; piv.add(perna);
    if (!frente) { const jarrete = bola(0.075, mPatas); jarrete.scale.set(0.9, 1.3, 1); jarrete.position.set(0, -0.3, -0.05); piv.add(jarrete); }
    const pata = bola(0.1, mPatas); pata.scale.set(1.05, 0.6, 1.3); pata.position.set(0, -0.56, 0.04); piv.add(pata);
    for (const dx of [-0.06, -0.02, 0.02, 0.06]) {
      const dedo = bola(0.036, mPatas, 10); dedo.scale.set(0.9, 0.85, 1.25); dedo.position.set(dx, -0.585, 0.14 - Math.abs(dx) * 0.4); piv.add(dedo);
      const unha = peca(new THREE.ConeGeometry(0.01, 0.035, 6), mUnha); unha.rotation.x = Math.PI / 2 + 0.3; unha.position.set(dx, -0.6, 0.19 - Math.abs(dx) * 0.4); piv.add(unha);
    }
    pernas.push({ piv, frente, lado: x });
  }
  const pescoco = new THREE.Group(); pescoco.position.set(0, 0.2, 0.5); tronco.add(pescoco);
  const colo = bola(0.22, mCorpoMat); colo.scale.set(1, 1, 1.2); colo.position.set(0, -0.1, -0.12); pescoco.add(colo);
  // cabeça: crânio largo, testa, bochechas e o focinho com nariz, boca e queixo
  const mCabeca = bola(0.26, mCab, 24); mCabeca.scale.set(1, 0.93, 0.95); pescoco.add(mCabeca);
  for (const lado of [-1, 1]) { const b = bola(0.11, mCab); b.scale.set(1, 0.9, 0.9); b.position.set(lado * 0.15, -0.07, 0.1); pescoco.add(b); }
  const mFocinho = bola(0.13, mFoc); mFocinho.scale.set(1.15, 0.82, 1.25); mFocinho.position.set(0, -0.06, 0.2); pescoco.add(mFocinho);
  const queixo = bola(0.085, mFoc); queixo.scale.set(1.1, 0.6, 1.1); queixo.position.set(0, -0.15, 0.2); pescoco.add(queixo);
  const mNariz = bola(0.05, mat(nariz, { roughness: 0.25 })); mNariz.scale.set(1.35, 0.8, 0.8); mNariz.position.set(0, -0.005, 0.345); pescoco.add(mNariz);
  const mBoca = mat(0x2a1a16, { roughness: 0.6 });
  const risco = peca(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), mBoca); risco.position.set(0, -0.06, 0.352); pescoco.add(risco);
  for (const lado of [-1, 1]) { const arco = peca(new THREE.TorusGeometry(0.045, 0.007, 5, 12, Math.PI * 0.8), mBoca); arco.position.set(lado * 0.045, -0.078, 0.325); arco.rotation.set(0.25, lado * 0.5, Math.PI + (lado > 0 ? 0.1 : 0.55)); pescoco.add(arco); }
  const matIris = mat(0xffffff, { roughness: 0.12, map: texIris(iris) });
  const matPalpebra = mat(cabeca, { side: THREE.DoubleSide });
  const olhos = [];
  for (const lado of [-1, 1]) {
    const orelha = bola(0.09, pelo(orelhas, 2)); orelha.scale.set(1, 1, 0.45); orelha.position.set(lado * 0.18, 0.2, -0.02); orelha.rotation.y = lado * 0.3; pescoco.add(orelha);
    const dentro = bola(0.055, mat(0xd9a08c)); dentro.scale.set(1, 1, 0.3); dentro.position.set(lado * 0.178, 0.195, 0.015); dentro.rotation.y = lado * 0.3; pescoco.add(dentro);
    const o = criarOlho(lado, { r: 0.06, ...MAT_OLHO(), matIris, matPele: matPalpebra, cilios: false, grande: true });
    o.olho.position.set(lado * 0.115, 0.07, 0.185); o.olho.rotation.y = lado * 0.3; pescoco.add(o.olho); olhos.push(o);
    const sobrolho = bola(0.05, mCab); sobrolho.scale.set(1.3, 0.55, 0.8); sobrolho.position.set(lado * 0.115, 0.14, 0.19); sobrolho.rotation.z = lado * 0.3; pescoco.add(sobrolho);
  }
  pescoco.scale.setScalar(1.18); // cabeção de desenho animado
  const cauda = new THREE.Group(); cauda.position.set(0, 0.08, -0.6); tronco.add(cauda);
  extras?.({ raiz, tronco, pescoco, cauda, pernas });
  raiz.scale.setScalar(escala);
  return {
    raiz,
    animar(fase) {
      // galope: as patas da frente e as de trás vão juntas, em tempos diferentes
      for (const p of pernas) {
        const f = fase + (p.frente ? 0 : Math.PI * 0.8) + (p.lado > 0 ? 0.35 : 0);
        p.piv.rotation.x = Math.sin(f) * 0.75;
      }
      tronco.position.y = 0.72 + Math.abs(Math.sin(fase)) * 0.08;
      tronco.rotation.x = Math.sin(fase) * 0.08;
      pescoco.rotation.x = Math.sin(fase + 1) * 0.08;
      cauda.rotation.x = 0.6 + Math.sin(fase * 2) * 0.3;
      cauda.rotation.y = Math.sin(fase) * 0.4;
    },
    segurar(t) {
      // pegou: parado, com uma pata da frente apoiada no ombro dela e o rabo abanando, todo contente
      for (const p of pernas) p.piv.rotation.set(0, 0, 0);
      // a pata do lado dela vai para o lado, por cima do ombro dela (sem tapar a própria cara)
      const pataNoOmbro = pernas.find((p) => p.frente && p.lado > 0);
      pataNoOmbro.piv.rotation.set(-0.35, 0, 1.75 + Math.sin(t * 3) * 0.05);
      tronco.position.y = 0.72; tronco.rotation.x = -0.12;
      pescoco.rotation.x = 0.25 + Math.sin(t * 1.5) * 0.05;
      cauda.rotation.x = 0.9; cauda.rotation.y = Math.sin(t * 8) * 0.6;
    },
  };
}

function leao() {
  return quadrupede({
    corpo: 0xd9a14a, barriga: 0xe9bd72, patas: 0xd29a45, cabeca: 0xe0aa55, focinho: 0xf2d39b, orelhas: 0xc98c3c, nariz: 0x6b3a2e, iris: '#c8861c', escala: 1.15,
    extras: ({ pescoco, cauda }) => {
      // juba: três coroas de mechas pontudas em volta da cabeça, caindo para trás e pelo peito
      const escura = []; const clara = [];
      for (let anel = 0; anel < 4; anel++) {
        const n = 16 + anel * 2;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + anel * 0.2;
          const baixo = Math.max(0, -Math.sin(a));
          const comp = 0.3 + baixo * 0.16 + anel * 0.03;
          const m = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 7)); m.scale.set(0.07 + anel * 0.008, comp * 0.62, 0.05);
          const r = 0.24 + anel * 0.025;
          m.position.set(Math.cos(a) * r, Math.sin(a) * r - baixo * 0.05, 0.02 - anel * 0.11);
          m.rotation.set(0, 0, a - Math.PI / 2); m.rotateX(-0.75 - anel * 0.22);
          ((k + anel) % 2 ? escura : clara).push(m);
        }
      }
      pescoco.add(fundir(escura, pelo(0x8a4418, 2)), fundir(clara, pelo(0xb5662a, 2)));
      const juba = pelo(0x8a4418, 2);
      const fundo = bola(0.3, juba, 18); fundo.scale.set(1.05, 1.05, 0.9); fundo.position.z = -0.2; pescoco.add(fundo);
      // bigodes
      for (const lado of [-1, 1]) for (let k = 0; k < 3; k++) { const fio = peca(new THREE.CylinderGeometry(0.003, 0.001, 0.2, 4), mat(0xfff6e0)); fio.position.set(lado * 0.2, -0.07 + k * 0.02, 0.26); fio.rotation.set(0, 0, lado * (Math.PI / 2 + (k - 1) * 0.18)); fio.rotateX(-0.3); pescoco.add(fio); }
      const rabo = capsula(0.03, 0.5, pelo(0xd29a45)); rabo.position.y = -0.28; cauda.add(rabo);
      const tufo = bola(0.08, juba); tufo.scale.set(1, 1.5, 1); tufo.position.y = -0.6; cauda.add(tufo);
      bandana(pescoco, 0xe5484d); // bandana vermelha de bolinhas
    },
  });
}

function panda() {
  return quadrupede({
    corpo: 0xf5f5f2, barriga: 0xf0f0ec, patas: 0x1f1f22, cabeca: 0xf7f7f4, focinho: 0xffffff, orelhas: 0x1f1f22, iris: '#3a2616', escala: 1.1,
    extras: ({ tronco, pescoco, cauda }) => {
      const faixa = peca(new THREE.CylinderGeometry(0.338, 0.32, 0.26, 24), pelo(0x1f1f22)); faixa.rotation.x = Math.PI / 2; faixa.position.z = 0.32; faixa.scale.set(0.94, 1, 1); tronco.add(faixa);
      for (const lado of [-1, 1]) { const o = bola(0.175, pelo(0x1f1f22)); o.scale.set(0.72, 1.12, 1.06); o.position.set(lado * 0.19, -0.02, 0.3); tronco.add(o); }
      for (const lado of [-1, 1]) { const mancha = bola(0.075, pelo(0x1f1f22, 2)); mancha.scale.set(1, 1.35, 0.5); mancha.rotation.z = lado * 0.5; mancha.position.set(lado * 0.108, 0.05, 0.19); pescoco.add(mancha); }
      const rabo = bola(0.08, mat(0xf5f5f2)); cauda.add(rabo);
      boneVirado(pescoco, 0x3fb6a8); // boné virado para trás
    },
  });
}

function urso() {
  return quadrupede({
    corpo: 0xf2efe6, barriga: 0xe9e4d6, patas: 0xe8e3d4, cabeca: 0xf4f1e8, focinho: 0xece6d4, orelhas: 0xe3dccb, iris: '#2a1c12', escala: 1.25,
    extras: ({ cauda, pescoco }) => {
      const rabo = bola(0.07, mat(0xf2efe6)); cauda.add(rabo);
      // urso-polar tem a cabeça mais comprida
      pescoco.scale.set(1.08, 1.08, 1.32);
      gorroComPompom(pescoco, 0xe5484d, 0.265, 0.15);
      // cachecol listrado com as pontas voando para trás
      const listra = (k) => mat(k % 2 ? 0xffffff : 0x3e8bff);
      const anel = peca(new THREE.TorusGeometry(0.22, 0.06, 8, 24), listra(0)); anel.rotation.x = Math.PI / 2; anel.position.set(0, -0.2, -0.04); pescoco.add(anel);
      for (const [dx, comp] of [[-0.06, 0.32], [0.06, 0.26]]) {
        for (let k = 0; k < 4; k++) { const seg = peca(new THREE.BoxGeometry(0.09, 0.025, comp / 4), listra(k)); seg.position.set(dx, -0.22 + k * 0.02, -0.28 - k * (comp / 4)); seg.rotation.x = 0.25; pescoco.add(seg); }
      }
    },
  });
}

// ---------- Caranguejo ----------
function caranguejo() {
  const raiz = new THREE.Group();
  // casca com pintinhas e relevo
  const texCasca = textura(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    let sd = 5; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for (let k = 0; k < 260; k++) { ctx.fillStyle = r() < 0.6 ? `rgba(120,20,0,${0.1 + r() * 0.2})` : `rgba(255,220,190,${0.15 + r() * 0.25})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 1 + r() * 3.5, 0, 7); ctx.fill(); }
  }, true);
  const vermelho = mat(0xdc3f2a, { roughness: 0.38, map: texCasca, bumpMap: texCasca, bumpScale: 1.5 });
  const claro = mat(0xf0a488, { roughness: 0.5 });
  const escuro = mat(0x9c2415, { roughness: 0.4 });
  // carapaça: mais larga na frente, com a borda serrilhada e a barriga clara
  const geoCasco = new THREE.SphereGeometry(0.45, 32, 20);
  { const pos = geoCasco.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
      const borda = Math.max(0, 1 - Math.abs(y) / 0.12);
      const serrilha = 1 + 0.06 * borda * Math.max(0, Math.sin(Math.atan2(z, x) * 13)) * (z > -0.1 ? 1 : 0.3);
      pos.setXYZ(i, x * 1.32 * serrilha * (1 + 0.12 * (z / 0.45)), y * (y > 0 ? 0.52 : 0.34), z * 0.95 * serrilha);
    }
    geoCasco.computeVertexNormals(); }
  const casco = peca(geoCasco, vermelho); casco.position.y = 0.55; raiz.add(casco);
  const barrigaC = bola(0.4, claro, 20); barrigaC.scale.set(1.2, 0.3, 0.85); barrigaC.position.y = 0.48; raiz.add(barrigaC);
  for (const [x, z, r] of [[-0.3, -0.05, 0.07], [0.3, -0.05, 0.07], [0, -0.12, 0.09], [-0.16, 0.12, 0.05], [0.16, 0.12, 0.05]]) { const p = bola(r, escuro); p.scale.y = 0.35; p.position.set(x, 0.55 + 0.21 * Math.sqrt(Math.max(0, 1 - (x / 0.6) ** 2 - (z / 0.43) ** 2)), z); raiz.add(p); }
  // boca
  const bocaC = peca(new THREE.TorusGeometry(0.09, 0.012, 6, 14, Math.PI), mat(0x5a140c)); bocaC.rotation.z = Math.PI; bocaC.position.set(0, 0.58, 0.425); raiz.add(bocaC);
  const pernas = [];
  for (const lado of [-1, 1]) {
    // quatro pernas de cada lado, com duas partes e a ponta fina
    for (let k = 0; k < 4; k++) {
      const piv = new THREE.Group(); piv.position.set(lado * 0.5, 0.5, -0.27 + k * 0.17); piv.rotation.y = -lado * (k - 1.5) * 0.28; raiz.add(piv);
      const coxa = capsula(0.045, 0.24, vermelho); coxa.rotation.z = lado * 1.25; coxa.position.set(lado * 0.14, 0.03, 0); piv.add(coxa);
      const junta = bola(0.05, escuro, 10); junta.position.set(lado * 0.29, 0.08, 0); piv.add(junta);
      const canela = torneada([[0.05, 0], [0.042, -0.2], [0.03, -0.4], [0.006, -0.56]], vermelho, 10); canela.position.set(lado * 0.29, 0.08, 0); canela.rotation.z = lado * 0.3; piv.add(canela);
      pernas.push({ piv, k, lado });
    }
    // braço com a pinça grande: a parte de cima fixa e o "dedo" de baixo que abre e fecha
    const braco = new THREE.Group(); braco.position.set(lado * 0.36, 0.6, 0.35); raiz.add(braco);
    const antebraco = capsula(0.065, 0.25, vermelho); antebraco.rotation.x = -0.9; antebraco.position.set(0, 0.12, 0.08); braco.add(antebraco);
    const juntaB = bola(0.075, escuro, 12); juntaB.position.set(0, 0.25, 0.17); braco.add(juntaB);
    const pinca = new THREE.Group(); pinca.position.set(0, 0.3, 0.2); braco.add(pinca);
    const palma = bola(0.15, vermelho, 18); palma.scale.set(0.8, 0.72, 1.1); palma.position.set(0, 0.02, 0.06); pinca.add(palma);
    const dedoFixo = peca(new THREE.ConeGeometry(0.075, 0.3, 12), vermelho); dedoFixo.rotation.x = Math.PI / 2 - 0.12; dedoFixo.scale.set(0.8, 1, 0.55); dedoFixo.position.set(0, 0.075, 0.27); pinca.add(dedoFixo);
    const dedoMovel = new THREE.Group(); dedoMovel.position.set(0, -0.03, 0.12); pinca.add(dedoMovel);
    const dm = peca(new THREE.ConeGeometry(0.06, 0.26, 12), claro); dm.rotation.x = Math.PI / 2 + 0.1; dm.scale.set(0.75, 1, 0.5); dm.position.set(0, -0.02, 0.13); dedoMovel.add(dm);
    pernas.push({ pinca, dedoMovel, lado });
    // olhos na ponta das hastes
    const haste = capsula(0.022, 0.16, vermelho); haste.position.set(lado * 0.12, 0.85, 0.3); raiz.add(haste);
    const olho = bola(0.058, mat(0xfbfaf4, { roughness: 0.15 })); olho.position.set(lado * 0.12, 0.97, 0.3); raiz.add(olho);
    const pup = bola(0.03, mat(0x120c0a, { roughness: 0.1 })); pup.scale.z = 0.5; pup.position.set(lado * 0.115, 0.972, 0.345); raiz.add(pup);
    const br = bola(0.01, new THREE.MeshBasicMaterial({ color: 0xffffff })); br.position.set(lado * 0.125, 0.985, 0.36); raiz.add(br);
  }
  oculosEscuros(raiz, 0.12, 0.98, 0.37, 0.065); // óculos de sol na ponta das hastes
  return {
    raiz,
    animar(fase) {
      for (const p of pernas) {
        if (p.pinca) { p.pinca.rotation.x = Math.sin(fase * 2 + p.lado) * 0.3; p.dedoMovel.rotation.x = 0.25 + Math.sin(fase * 4 + p.lado) * 0.25; continue; }
        p.piv.rotation.z = Math.sin(fase * 2 + p.k * 1.2 + (p.lado > 0 ? Math.PI : 0)) * 0.35;
      }
      raiz.position.y = Math.abs(Math.sin(fase * 2)) * 0.05;
      raiz.rotation.z = Math.sin(fase * 2) * 0.05;
    },
    segurar(t) {
      // pegou: as pinças erguidas, fechando e abrindo, prendendo a menina
      for (const p of pernas) {
        if (p.pinca) { p.pinca.rotation.x = -0.6 + Math.sin(t * 6 + p.lado) * 0.25; p.dedoMovel.rotation.x = 0.3 + Math.sin(t * 9 + p.lado) * 0.3; continue; }
        p.piv.rotation.z = 0;
      }
      raiz.position.y = 0; raiz.rotation.z = Math.sin(t * 2) * 0.04;
    },
  };
}

// ---------- Policial ----------
function policial() {
  const raiz = new THREE.Group();
  // farda: camisa azul com carcela, botões e bolsos no peito
  const texFarda = textura(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { ctx.fillStyle = 'rgba(0,0,0,.04)'; ctx.fillRect(0, y, w, 1); }
    ctx.fillStyle = 'rgba(0,0,20,.22)';
    for (const x of [0, w]) ctx.fillRect(x - 9, 0, 18, h); // carcela
    for (const x of [0.085, 0.915]) { ctx.fillRect(w * x - 26, h * 0.3, 52, 3); ctx.fillRect(w * x - 26, h * 0.3, 3, 46); ctx.fillRect(w * x + 23, h * 0.3, 3, 46); ctx.fillRect(w * x - 26, h * 0.3 + 44, 52, 3); ctx.fillRect(w * x - 26, h * 0.3 + 12, 52, 2); }
    ctx.fillStyle = '#e9e2c8';
    for (let k = 0; k < 6; k++) for (const x of [0, w]) { ctx.beginPath(); ctx.arc(x, h * (0.16 + k * 0.14), 4.5, 0, 7); ctx.fill(); }
  });
  const farda = mat(0x24479c, { map: texFarda, roughness: 0.8 }); const fardaLisa = mat(0x24479c, { roughness: 0.8 });
  const calca = mat(0x18223f, { roughness: 0.85 }); const couro = mat(0x121212, { roughness: 0.3 });
  const pele = mat(0xd9a27c, { roughness: 0.58 });
  const ouro = mat(0xd9b44a, { metalness: 0.8, roughness: 0.25 });
  const corpo = new THREE.Group(); raiz.add(corpo);
  const pernas = [-1, 1].map((lado) => {
    const coxa = new THREE.Group(); coxa.position.set(lado * 0.115, 0.9, 0); corpo.add(coxa);
    coxa.add(torneada([[0, 0.05], [0.1, 0.03], [0.108, -0.08], [0.095, -0.3], [0.082, -0.44]], calca));
    const joelho = new THREE.Group(); joelho.position.y = -0.44; coxa.add(joelho);
    joelho.add(bola(0.083, calca, 12));
    joelho.add(torneada([[0.082, 0], [0.08, -0.1], [0.07, -0.3], [0.066, -0.37]], calca));
    const faixa = peca(new THREE.BoxGeometry(0.006, 0.36, 0.022), ouro); faixa.position.set(lado * 0.077, -0.18, 0); joelho.add(faixa);
    const sapato = criarTenis({ cabedal: couro, sola: mat(0x1d1d1f, { roughness: 0.6 }), detalhe: mat(0x0a0a0a, { roughness: 0.5 }), cadarco: mat(0x2a2a2a), borracha: couro });
    sapato.scale.setScalar(1.85); sapato.position.set(0, -0.355, 0.04); joelho.add(sapato);
    return { coxa, joelho };
  });
  const tronco = new THREE.Group(); tronco.position.y = 0.9; corpo.add(tronco);
  // tronco de adulto: barriga, peito largo e ombros
  const camisa = peca(geoCorpo([[0.03, 0.215, 0.18, 0.01, 2.3], [0.14, 0.228, 0.198, 0.022, 2.3], [0.3, 0.228, 0.182, 0.012, 2.5], [0.45, 0.252, 0.17, 0.004, 2.6], [0.56, 0.272, 0.15, 0, 2.5], [0.63, 0.235, 0.125, -0.004, 2.3], [0.685, 0.13, 0.095, -0.004, 2.1], [0.715, 0.078, 0.072, 0, 2]], (y) => y / 0.715, 40), farda);
  tronco.add(camisa);
  const bacia = peca(geoCorpo([[-0.1, 0.13, 0.12, 0], [-0.04, 0.205, 0.165, 0], [0.05, 0.212, 0.172, 0.006]], (y) => 0, 32), calca); tronco.add(bacia);
  const cinto = peca(new THREE.CylinderGeometry(0.222, 0.222, 0.065, 28), couro); cinto.position.set(0, 0.06, 0.008); cinto.scale.z = 0.86; tronco.add(cinto);
  const fivela = peca(new THREE.BoxGeometry(0.075, 0.055, 0.02), ouro); fivela.position.set(0, 0.06, 0.2); tronco.add(fivela);
  // no cinto: coldre, rádio e algemas
  const coldre = peca(new THREE.BoxGeometry(0.05, 0.14, 0.09), couro); coldre.position.set(0.225, -0.01, 0.02); coldre.rotation.z = 0.08; tronco.add(coldre);
  const radio = peca(new THREE.BoxGeometry(0.045, 0.1, 0.06), mat(0x24262b, { roughness: 0.5 })); radio.position.set(-0.225, 0.02, 0.02); tronco.add(radio);
  const antena = peca(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 6), couro); antena.position.set(-0.225, 0.11, 0.03); tronco.add(antena);
  for (const dx of [-0.02, 0.025]) { const alg = peca(new THREE.TorusGeometry(0.028, 0.006, 6, 14), mat(0xc9ced8, { metalness: 0.9, roughness: 0.2 })); alg.position.set(-0.1 + dx, 0.0, -0.2); tronco.add(alg); }
  // distintivo em forma de estrela, plaqueta com o nome, gola e gravata
  const formaD = new THREE.Shape();
  for (let k = 0; k < 14; k++) { const a = Math.PI / 2 + (k * Math.PI) / 7; const r = k % 2 ? 0.026 : 0.046; formaD[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  const distintivo = peca(new THREE.ExtrudeGeometry(formaD, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 }), ouro); distintivo.position.set(-0.115, 0.47, 0.168); distintivo.rotation.set(-0.08, -0.25, 0); tronco.add(distintivo);
  const plaqueta = peca(new THREE.BoxGeometry(0.07, 0.018, 0.006), ouro); plaqueta.position.set(0.115, 0.5, 0.166); plaqueta.rotation.y = 0.25; tronco.add(plaqueta);
  for (const lado of [-1, 1]) {
    const gola = peca(new THREE.ConeGeometry(0.06, 0.1, 3), fardaLisa); gola.scale.z = 0.25; gola.position.set(lado * 0.055, 0.67, 0.095); gola.rotation.set(0.5, 0, Math.PI + lado * 0.5); tronco.add(gola);
    const platina = peca(new THREE.BoxGeometry(0.11, 0.012, 0.06), mat(0x101a36)); platina.position.set(lado * 0.21, 0.648, 0); platina.rotation.z = -lado * 0.28; tronco.add(platina);
    const botaoP = bola(0.009, ouro, 8); botaoP.position.set(lado * 0.17, 0.668, 0); tronco.add(botaoP);
  }
  const bracos = [-1, 1].map((lado) => {
    const ombro = new THREE.Group(); ombro.position.set(lado * 0.285, 0.59, 0); tronco.add(ombro);
    // manga curta, cotovelo e antebraço de fora, relógio e a mão com dedos
    ombro.add(torneada([[0, 0.065], [0.05, 0.055], [0.078, 0.02], [0.08, -0.05], [0.074, -0.2], [0.073, -0.23], [0.066, -0.23]], desenho({ color: 0x24479c, side: THREE.DoubleSide })));
    ombro.add(torneada([[0.058, -0.16], [0.056, -0.3], [0.052, -0.34]], pele));
    const cotovelo = new THREE.Group(); cotovelo.position.y = -0.34; ombro.add(cotovelo);
    cotovelo.add(bola(0.05, pele, 12));
    const ante = torneada([[0.053, 0], [0.057, -0.06], [0.05, -0.16], [0.04, -0.25], [0.037, -0.28]], pele); ante.scale.z = 0.92; cotovelo.add(ante);
    if (lado < 0) { const relogio = peca(new THREE.CylinderGeometry(0.042, 0.042, 0.026, 16), couro); relogio.position.y = -0.255; cotovelo.add(relogio); const visor = peca(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 14), mat(0xdfe8f0, { metalness: 0.5, roughness: 0.2 })); visor.rotation.x = Math.PI / 2; visor.position.set(0, -0.255, -0.042); cotovelo.add(visor); }
    const mao = criarMao(lado, pele, 2); mao.position.y = -0.285; cotovelo.add(mao);
    return { ombro, cotovelo };
  });
  // cabeça: mesmo rosto esculpido dos humanos, com queixo largo, bigode, costeletas e o quepe
  const cabeca = new THREE.Group(); cabeca.position.y = 0.9; cabeca.scale.setScalar(1.32); tronco.add(cabeca);
  cabeca.add(torneada([[0.07, -0.16], [0.062, -0.1], [0.06, -0.02]], pele));
  const R = 0.15; const geoC = geoCabeca(R, 48); geoC.scale(1.06, 1, 1.02);
  const sup = superficieDe(geoC);
  cabeca.add(peca(geoC, pele));
  const escuroP = mat(0x2e2018, { roughness: 0.7 });
  const cabelo = peca(geoCabelo(R, 1.04, 48, 12), mat(0x2e2018, { roughness: 0.6, side: THREE.DoubleSide })); cabelo.scale.set(1.06, 1, 1.02); cabeca.add(cabelo);
  const olhoMat = { ...MAT_OLHO(), matIris: mat(0xffffff, { roughness: 0.12, map: texIris('#4a3524') }), matPele: desenho({ color: 0xd9a27c, side: THREE.DoubleSide }) };
  const tubo = (pts, raio, m, achatar = 1) => peca(tuboAfinado(new THREE.CatmullRomCurve3(pts.map(([x, y, dz = 0.001]) => new THREE.Vector3(x, y, sup(x, y) + dz))), 16, raio, 7, achatar), m);
  for (const lado of [-1, 1]) {
    const o = criarOlho(lado, { r: 0.034, ...olhoMat, cilios: false, grande: true });
    o.olho.position.set(lado * 0.052, -0.004, sup(lado * 0.052, -0.004) - 0.019); cabeca.add(o.olho);
    cabeca.add(tubo([[lado * 0.018, 0.04, 0.004], [lado * 0.05, 0.058, 0.004], [lado * 0.092, 0.048, 0.004]], (t) => 0.0105 * (1 - 0.5 * t), escuroP, 0.5)); // sobrancelha grossa
    const orelha = bola(0.034, pele, 12); orelha.scale.set(0.35, 1, 0.7); orelha.position.set(lado * 0.148, -0.01, -0.01); orelha.rotation.y = lado * 0.4; cabeca.add(orelha);
    cabeca.add(tubo([[lado * 0.004, -0.068, 0.004], [lado * 0.03, -0.066, 0.004], [lado * 0.052, -0.08, 0.002]], (t) => 0.0105 * (1 - 0.65 * t), escuroP)); // bigode
  }
  const narizP = bola(0.02, pele, 14); narizP.scale.set(1.1, 0.9, 1); narizP.position.set(0, -0.04, sup(0, -0.04) - 0.002); cabeca.add(narizP);
  for (const lado of [-1, 1]) { const asa = bola(0.012, pele, 10); asa.position.set(lado * 0.018, -0.046, sup(0, -0.046) - 0.014); cabeca.add(asa); }
  cabeca.add(tubo([[-0.03, -0.092], [0, -0.095], [0.03, -0.092]], (t) => 0.0045 * Math.sin(t * Math.PI) ** 0.6 + 0.001, mat(0xa86a5c, { roughness: 0.5 })));
  // quepe: copa, tampo mais largo, pala de verniz, fita dourada e o brasão
  const quepe = peca(new THREE.CylinderGeometry(0.172, 0.158, 0.11, 28), fardaLisa); quepe.position.y = 0.135; cabeca.add(quepe);
  const topoQuepe = torneada([[0, 0.065], [0.14, 0.06], [0.2, 0.035], [0.205, 0.01], [0.17, -0.005]], fardaLisa, 28); topoQuepe.position.y = 0.185; topoQuepe.rotation.x = -0.08; cabeca.add(topoQuepe);
  const aba = peca(new THREE.CylinderGeometry(0.165, 0.165, 0.014, 24, 1, false, -Math.PI / 2, Math.PI), mat(0x0c0c0e, { roughness: 0.15 })); aba.position.set(0, 0.082, 0.06); aba.rotation.x = 0.22; cabeca.add(aba);
  const fita = peca(new THREE.CylinderGeometry(0.162, 0.16, 0.026, 28), ouro); fita.position.y = 0.095; cabeca.add(fita);
  const brasao = peca(new THREE.ExtrudeGeometry(formaD, { depth: 0.006, bevelEnabled: false }), ouro); brasao.scale.setScalar(0.8); brasao.position.set(0, 0.15, 0.165); cabeca.add(brasao);
  return {
    raiz,
    animar(fase) {
      pernas.forEach((p, k) => {
        const sw = Math.sin(fase + (k ? Math.PI : 0));
        const cw = Math.cos(fase + (k ? Math.PI : 0));
        p.coxa.rotation.x = -0.25 - sw * 0.6;
        p.joelho.rotation.x = 0.2 + Math.max(0, cw) * 1.25 + Math.max(0, -sw) * 0.2;
      });
      bracos.forEach((b, k) => {
        const sw = Math.sin(fase + (k ? 0 : Math.PI));
        b.ombro.rotation.x = -0.1 - sw * 0.7;
        b.ombro.rotation.z = (k ? 1 : -1) * 0.15;
        b.cotovelo.rotation.x = -1.2 - Math.max(0, sw) * 0.3;
      });
      // quadril e ombros giram ao contrário; o corpo sobe e desce a cada passada
      corpo.rotation.y = Math.sin(fase) * 0.12;
      tronco.rotation.y = -Math.sin(fase) * 0.22;
      cabeca.rotation.y = Math.sin(fase) * 0.1;
      // um braço levantado, apontando para ela
      bracos[1].ombro.rotation.x = -2.3 + Math.sin(fase * 2) * 0.15;
      bracos[1].cotovelo.rotation.x = -0.2;
      tronco.rotation.x = 0.16;
      corpo.position.y = 0.02 + Math.abs(Math.sin(fase)) * 0.05;
    },
    segurar(t) {
      // pegou: em pé, a mão no ombro dela e a outra com o apito
      pernas.forEach((p) => { p.coxa.rotation.x = 0; p.joelho.rotation.x = 0.05; });
      corpo.rotation.y = 0; corpo.position.y = 0; tronco.rotation.set(0.12, 0, 0); cabeca.rotation.set(0.25, 0.1 * Math.sin(t), 0);
      // (ele fica de frente para a tela, à direita dela: o braço direito dele, de índice 1, é o do lado dela)
      bracos[1].ombro.rotation.set(-0.7, 0, 0.55); bracos[1].cotovelo.rotation.x = -0.45; // mão no ombro dela
      bracos[0].ombro.rotation.set(-0.55 + Math.sin(t * 4) * 0.04, 0, -0.08); bracos[0].cotovelo.rotation.x = -2.35; // apito na boca
    },
  };
}

const CRIAR = { policial, caranguejo, leao, panda, urso };

// O modelo vai dentro de um grupo de fora: o motor posiciona e escala o de fora
// sem mexer no tamanho próprio de cada bicho nem nas animações.
export function criarPerseguidor(id) {
  const modelo = (CRIAR[id] ?? CRIAR_NOVOS[id] ?? policial)();
  const raiz = new THREE.Group();
  raiz.add(modelo.raiz);
  return { raiz, animar: modelo.animar, segurar: modelo.segurar };
}
