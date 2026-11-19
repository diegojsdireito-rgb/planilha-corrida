// Quem corre atrás da menina em cada cenário: policial (cidade), caranguejo (praia),
// leão ou panda (floresta, à escolha) e urso-polar (neve). Todos olham para a frente (+z),
// na mesma direção dela; a câmera vê as costas deles.
import { THREE, sombrear } from './base.js';

export { quemPersegue } from '../perseguidores.js';

const mat = (cor, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, ...extra });
const peca = (geo, m) => sombrear(new THREE.Mesh(geo, m));
const bola = (r, m, seg = 16) => peca(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7)), m);
const capsula = (r, l, m) => peca(new THREE.CapsuleGeometry(r, l, 6, 14), m);

// ---------- Acessórios estilosos ----------
function bandana(pescoco, cor) {
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
function quadrupede({ corpo, barriga, patas, cabeca, focinho, orelhas, nariz = 0x222222, escala = 1, extras }) {
  const raiz = new THREE.Group();
  const tronco = new THREE.Group(); tronco.position.y = 0.72; raiz.add(tronco);
  const mCorpo = capsula(0.3, 0.62, mat(corpo)); mCorpo.rotation.x = Math.PI / 2; tronco.add(mCorpo);
  const mBarriga = capsula(0.24, 0.5, mat(barriga)); mBarriga.rotation.x = Math.PI / 2; mBarriga.position.y = -0.09; mBarriga.scale.set(0.9, 1, 1); tronco.add(mBarriga);
  const pernas = [];
  for (const [x, z] of [[-0.17, 0.32], [0.17, 0.32], [-0.17, -0.3], [0.17, -0.3]]) {
    const piv = new THREE.Group(); piv.position.set(x, -0.08, z); tronco.add(piv);
    const perna = capsula(0.09, 0.42, mat(patas)); perna.position.y = -0.3; piv.add(perna);
    const pata = bola(0.1, mat(patas)); pata.scale.set(1, 0.6, 1.25); pata.position.set(0, -0.56, 0.03); piv.add(pata);
    pernas.push({ piv, frente: z > 0, lado: x });
  }
  const pescoco = new THREE.Group(); pescoco.position.set(0, 0.2, 0.5); tronco.add(pescoco);
  const mCabeca = bola(0.26, mat(cabeca), 20); pescoco.add(mCabeca);
  const mFocinho = bola(0.13, mat(focinho)); mFocinho.scale.set(1.2, 0.85, 1); mFocinho.position.set(0, -0.06, 0.22); pescoco.add(mFocinho);
  const mNariz = bola(0.045, mat(nariz, { roughness: 0.3 })); mNariz.position.set(0, -0.01, 0.34); pescoco.add(mNariz);
  for (const lado of [-1, 1]) {
    const orelha = bola(0.085, mat(orelhas)); orelha.scale.set(1, 1, 0.5); orelha.position.set(lado * 0.17, 0.2, -0.02); pescoco.add(orelha);
    const olho = bola(0.035, mat(0x1a1a1a, { roughness: 0.2 })); olho.position.set(lado * 0.1, 0.06, 0.22); pescoco.add(olho);
  }
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
    corpo: 0xd9a14a, barriga: 0xe9bd72, patas: 0xd29a45, cabeca: 0xe0aa55, focinho: 0xf2d39b, orelhas: 0xc98c3c, escala: 1.15,
    extras: ({ pescoco, cauda }) => {
      // juba: muitas mechas em volta da cabeça (é o que mais aparece por trás)
      const juba = mat(0x9a4f1c);
      for (let k = 0; k < 22; k++) {
        const a = (k / 22) * Math.PI * 2;
        const m = bola(0.13, k % 2 ? juba : mat(0xb5622a)); m.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, -0.06); pescoco.add(m);
      }
      const fundo = bola(0.3, juba, 18); fundo.scale.set(1, 1, 0.6); fundo.position.z = -0.12; pescoco.add(fundo);
      const rabo = capsula(0.03, 0.5, mat(0xd29a45)); rabo.position.y = -0.28; cauda.add(rabo);
      const tufo = bola(0.08, juba); tufo.position.y = -0.58; cauda.add(tufo);
      bandana(pescoco, 0xe5484d); // bandana vermelha de bolinhas
      oculosEscuros(pescoco, 0.1, 0.07, 0.24);
    },
  });
}

function panda() {
  return quadrupede({
    corpo: 0xf5f5f2, barriga: 0xf0f0ec, patas: 0x1f1f22, cabeca: 0xf7f7f4, focinho: 0xffffff, orelhas: 0x1f1f22, escala: 1.1,
    extras: ({ tronco, pescoco, cauda }) => {
      const faixa = peca(new THREE.CylinderGeometry(0.305, 0.305, 0.28, 20), mat(0x1f1f22)); faixa.rotation.x = Math.PI / 2; faixa.position.z = 0.32; tronco.add(faixa);
      for (const lado of [-1, 1]) { const mancha = bola(0.07, mat(0x1f1f22)); mancha.scale.set(1, 1.3, 0.5); mancha.position.set(lado * 0.1, 0.06, 0.2); pescoco.add(mancha); }
      const rabo = bola(0.08, mat(0xf5f5f2)); cauda.add(rabo);
      boneVirado(pescoco, 0x3fb6a8); // boné virado para trás
    },
  });
}

function urso() {
  return quadrupede({
    corpo: 0xf2efe6, barriga: 0xe9e4d6, patas: 0xe8e3d4, cabeca: 0xf4f1e8, focinho: 0xece6d4, orelhas: 0xe3dccb, escala: 1.25,
    extras: ({ cauda, pescoco }) => {
      const rabo = bola(0.07, mat(0xf2efe6)); cauda.add(rabo);
      // urso-polar tem a cabeça mais comprida
      pescoco.scale.set(0.9, 0.9, 1.15);
      gorroComPompom(pescoco, 0xe5484d);
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
  const vermelho = mat(0xe0442e, { roughness: 0.5 });
  const casco = bola(0.45, vermelho, 22); casco.scale.set(1.3, 0.5, 0.95); casco.position.y = 0.55; raiz.add(casco);
  const pintas = mat(0xf27a5e);
  for (let k = 0; k < 6; k++) { const p = bola(0.05, pintas); p.position.set(Math.cos(k) * 0.35, 0.74, Math.sin(k) * 0.25 - 0.05); raiz.add(p); }
  const pernas = [];
  for (const lado of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const piv = new THREE.Group(); piv.position.set(lado * 0.48, 0.5, -0.2 + k * 0.2); raiz.add(piv);
      const perna = capsula(0.04, 0.36, vermelho); perna.rotation.z = lado * 1.0; perna.position.set(lado * 0.17, -0.12, 0); piv.add(perna);
      pernas.push({ piv, k, lado });
    }
    const braco = new THREE.Group(); braco.position.set(lado * 0.35, 0.6, 0.35); raiz.add(braco);
    const antebraco = capsula(0.06, 0.25, vermelho); antebraco.rotation.x = -0.9; antebraco.position.set(0, 0.12, 0.08); braco.add(antebraco);
    const pinca = new THREE.Group(); pinca.position.set(0, 0.3, 0.2); braco.add(pinca);
    const gArriba = bola(0.14, vermelho); gArriba.scale.set(0.8, 0.5, 1.2); gArriba.position.y = 0.05; pinca.add(gArriba);
    const gAbaixo = bola(0.11, vermelho); gAbaixo.scale.set(0.7, 0.4, 1); gAbaixo.position.y = -0.06; pinca.add(gAbaixo);
    pernas.push({ pinca, lado });
    const haste = capsula(0.02, 0.16, vermelho); haste.position.set(lado * 0.12, 0.85, 0.3); raiz.add(haste);
    const olho = bola(0.05, mat(0xffffff, { roughness: 0.2 })); olho.position.set(lado * 0.12, 0.97, 0.3); raiz.add(olho);
  }
  oculosEscuros(raiz, 0.12, 0.98, 0.35, 0.06); // óculos de sol na ponta das antenas
  return {
    raiz,
    animar(fase) {
      for (const p of pernas) {
        if (p.pinca) { p.pinca.rotation.x = Math.sin(fase * 2 + p.lado) * 0.3; continue; }
        p.piv.rotation.z = Math.sin(fase * 2 + p.k * 1.2 + (p.lado > 0 ? Math.PI : 0)) * 0.35;
      }
      raiz.position.y = Math.abs(Math.sin(fase * 2)) * 0.05;
      raiz.rotation.z = Math.sin(fase * 2) * 0.05;
    },
    segurar(t) {
      // pegou: as pinças erguidas, fechando e abrindo, prendendo a menina
      for (const p of pernas) {
        if (p.pinca) { p.pinca.rotation.x = -0.6 + Math.sin(t * 6 + p.lado) * 0.25; continue; }
        p.piv.rotation.z = 0;
      }
      raiz.position.y = 0; raiz.rotation.z = Math.sin(t * 2) * 0.04;
    },
  };
}

// ---------- Policial ----------
function policial() {
  const raiz = new THREE.Group();
  const farda = mat(0x1f3c88); const calca = mat(0x1a2547); const pele = mat(0xe0ac85, { roughness: 0.55 });
  const corpo = new THREE.Group(); raiz.add(corpo);
  const pernas = [-1, 1].map((lado) => {
    const coxa = new THREE.Group(); coxa.position.set(lado * 0.12, 0.9, 0); corpo.add(coxa);
    const mCoxa = capsula(0.085, 0.36, calca); mCoxa.position.y = -0.22; coxa.add(mCoxa);
    const joelho = new THREE.Group(); joelho.position.y = -0.44; coxa.add(joelho);
    const canela = capsula(0.07, 0.34, calca); canela.position.y = -0.2; joelho.add(canela);
    const bota = peca(new THREE.BoxGeometry(0.13, 0.1, 0.26), mat(0x111111, { roughness: 0.4 })); bota.position.set(0, -0.42, 0.05); joelho.add(bota);
    return { coxa, joelho };
  });
  const tronco = new THREE.Group(); tronco.position.y = 0.9; corpo.add(tronco);
  const barriga = capsula(0.24, 0.32, farda); barriga.position.y = 0.32; barriga.scale.set(1.05, 1, 0.8); tronco.add(barriga);
  const cinto = peca(new THREE.CylinderGeometry(0.235, 0.235, 0.07, 20), mat(0x111111)); cinto.position.y = 0.1; cinto.scale.z = 0.82; tronco.add(cinto);
  const fivela = peca(new THREE.BoxGeometry(0.07, 0.05, 0.02), mat(0xd9b44a, { metalness: 0.7, roughness: 0.3 })); fivela.position.set(0, 0.1, 0.2); tronco.add(fivela);
  const distintivo = peca(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 6), mat(0xd9b44a, { metalness: 0.8, roughness: 0.25 })); distintivo.rotation.x = Math.PI / 2; distintivo.position.set(-0.1, 0.48, 0.2); tronco.add(distintivo);
  const bracos = [-1, 1].map((lado) => {
    const ombro = new THREE.Group(); ombro.position.set(lado * 0.3, 0.6, 0); tronco.add(ombro);
    const m = capsula(0.065, 0.28, farda); m.position.y = -0.18; ombro.add(m);
    const cotovelo = new THREE.Group(); cotovelo.position.y = -0.34; ombro.add(cotovelo);
    const ante = capsula(0.055, 0.24, farda); ante.position.y = -0.14; cotovelo.add(ante);
    const mao = bola(0.06, pele); mao.position.y = -0.3; cotovelo.add(mao);
    return { ombro, cotovelo };
  });
  const cabeca = new THREE.Group(); cabeca.position.y = 0.85; tronco.add(cabeca);
  const pesc = capsula(0.06, 0.06, pele); pesc.position.y = -0.1; cabeca.add(pesc);
  const mCabeca = bola(0.15, pele, 20); mCabeca.scale.set(0.95, 1.05, 1); cabeca.add(mCabeca);
  const nuca = bola(0.152, mat(0x3a2a1e), 20); nuca.scale.set(0.95, 0.75, 0.9); nuca.position.set(0, 0.02, -0.03); cabeca.add(nuca);
  for (const lado of [-1, 1]) { const o = bola(0.035, pele); o.position.set(lado * 0.14, 0, 0); cabeca.add(o); }
  const quepe = peca(new THREE.CylinderGeometry(0.17, 0.155, 0.12, 20), farda); quepe.position.y = 0.13; cabeca.add(quepe);
  const topoQuepe = peca(new THREE.CylinderGeometry(0.19, 0.17, 0.04, 20), farda); topoQuepe.position.y = 0.2; cabeca.add(topoQuepe);
  const aba = peca(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 20, 1, false, -Math.PI / 2, Math.PI), mat(0x111111, { roughness: 0.3 })); aba.position.set(0, 0.08, 0.05); cabeca.add(aba);
  const fita = peca(new THREE.CylinderGeometry(0.158, 0.158, 0.03, 20), mat(0xd9b44a, { metalness: 0.6, roughness: 0.3 })); fita.position.y = 0.09; cabeca.add(fita);
  oculosEscuros(cabeca, 0.055, 0.02, 0.145, 0.035); // óculos escuros de aviador
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
  const modelo = (CRIAR[id] ?? policial)();
  const raiz = new THREE.Group();
  raiz.add(modelo.raiz);
  return { raiz, animar: modelo.animar, segurar: modelo.segurar };
}
