// Quem corre atrás da menina nos cenários novos: o ursinho de goma (Terra dos Doces), o coelho mascote
// (Parque de Diversões), a raposa-do-deserto (Deserto do Oásis) e o etezinho (Passeio na Lua).
// Como os outros, olham para a frente (+z), na mesma direção dela; a câmera vê as costas deles.
import { THREE } from './base.js';
import { mat, peca, bola, capsula, pelo, quadrupede, bandana } from './perseguidores.js';

// olho de desenho: bolinha escura e brilhante com dois reflexos
function olhinho(r, cor = 0x1a1210) {
  const g = new THREE.Group();
  const o = bola(r, mat(cor, { roughness: 0.1 }), 18); o.scale.z = 0.7; g.add(o);
  for (const [x, y, k] of [[0.35, 0.35, 0.32], [-0.25, -0.2, 0.16]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r * k, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); b.position.set(r * x, r * y, r * 0.62); g.add(b);
  }
  return g;
}

// ---------- Bicho de duas patas (ursinho de goma, coelho e etezinho) ----------
function bipede({ corpo, barriga, membro, pe, cabeca, rCorpo = 0.3, rCabeca = 0.3, extras }) {
  const raiz = new THREE.Group();
  const corpoG = new THREE.Group(); raiz.add(corpoG);
  const pernas = [-1, 1].map((lado) => {
    const piv = new THREE.Group(); piv.position.set(lado * 0.14, 0.56, 0); corpoG.add(piv);
    const coxa = capsula(0.1, 0.26, membro); coxa.position.y = -0.22; piv.add(coxa);
    const p = bola(0.12, pe ?? membro, 16); p.scale.set(0.95, 0.55, 1.45); p.position.set(0, -0.5, 0.07); piv.add(p);
    return { piv, pe: p };
  });
  const tronco = new THREE.Group(); tronco.position.y = 0.58; corpoG.add(tronco);
  const mCorpo = bola(rCorpo, corpo, 26); mCorpo.scale.set(1, 1.15, 0.9); mCorpo.position.y = 0.3; tronco.add(mCorpo);
  const mBarriga = bola(rCorpo * 0.75, barriga, 20); mBarriga.scale.set(1, 1.15, 0.5); mBarriga.position.set(0, 0.27, rCorpo * 0.58); tronco.add(mBarriga);
  const bracos = [-1, 1].map((lado) => {
    const ombro = new THREE.Group(); ombro.position.set(lado * rCorpo * 0.92, 0.5, 0); tronco.add(ombro);
    const b = capsula(0.07, 0.26, membro); b.position.y = -0.19; ombro.add(b);
    const mao = bola(0.088, membro, 12); mao.position.y = -0.38; ombro.add(mao);
    return { ombro, lado };
  });
  const cab = new THREE.Group(); cab.position.y = 0.3 + rCorpo * 1.1 + rCabeca * 0.75; tronco.add(cab);
  const mCab = bola(rCabeca, cabeca, 30); cab.add(mCab);
  extras?.({ raiz, corpoG, tronco, cabeca: cab, bracos, pernas, rCabeca, rCorpo });
  raiz.scale.setScalar(0.86); // do tamanho do policial: não esconde a menina
  return {
    raiz,
    animar(fase) {
      pernas.forEach((p, k) => { p.piv.rotation.x = Math.sin(fase + k * Math.PI) * 0.85; });
      bracos.forEach((b, k) => { b.ombro.rotation.set(-Math.sin(fase + k * Math.PI) * 0.8, 0, b.lado * 0.25); });
      // um braço levantado, chamando por ela
      bracos[1].ombro.rotation.set(-2.5 + Math.sin(fase * 2) * 0.2, 0, 0.2);
      corpoG.position.y = Math.abs(Math.sin(fase)) * 0.07;
      tronco.rotation.x = 0.14; tronco.rotation.y = Math.sin(fase) * 0.12;
      cab.rotation.z = Math.sin(fase) * 0.07;
    },
    segurar(t) {
      // pegou: em pé, um braço no ombro dela e o outro acenando para a tela
      pernas.forEach((p) => { p.piv.rotation.x = 0; });
      corpoG.position.y = Math.abs(Math.sin(t * 3)) * 0.03; tronco.rotation.set(0.05, 0, 0); cab.rotation.set(0.15, 0, Math.sin(t * 2) * 0.08);
      bracos[1].ombro.rotation.set(-0.5, 0, 1.25); // a mão no ombro dela (ele fica à direita dela)
      bracos[0].ombro.rotation.set(0, 0, -2.6 + Math.sin(t * 7) * 0.3); // tchauzinho
    },
  };
}

function ursoGoma() {
  const goma = (cor) => mat(cor, { emissive: cor, emissiveIntensity: 0.3 });
  const vermelho = goma(0xff2f4f); const claro = goma(0xff8a9a);
  return bipede({
    corpo: vermelho, barriga: claro, membro: vermelho, cabeca: vermelho, rCorpo: 0.33, rCabeca: 0.31,
    extras: ({ cabeca, tronco, rCabeca }) => {
      for (const lado of [-1, 1]) {
        const orelha = bola(0.11, vermelho, 14); orelha.scale.z = 0.7; orelha.position.set(lado * rCabeca * 0.72, rCabeca * 0.72, 0); cabeca.add(orelha);
        const o = olhinho(0.05); o.position.set(lado * 0.11, 0.06, rCabeca * 0.9); cabeca.add(o);
      }
      const focinho = bola(0.13, claro, 16); focinho.scale.set(1.15, 0.85, 0.8); focinho.position.set(0, -0.07, rCabeca * 0.85); cabeca.add(focinho);
      const nariz = bola(0.045, mat(0x8a0a1f), 10); nariz.scale.set(1.3, 0.9, 0.8); nariz.position.set(0, -0.03, rCabeca * 0.85 + 0.1); cabeca.add(nariz);
      const sorriso = peca(new THREE.TorusGeometry(0.04, 0.009, 6, 12, Math.PI), mat(0x8a0a1f)); sorriso.rotation.z = Math.PI; sorriso.position.set(0, -0.1, rCabeca * 0.85 + 0.1); cabeca.add(sorriso);
      // açúcar brilhando no corpo e a gravatinha de goma verde
      for (let k = 0; k < 30; k++) {
        const a = k * 2.4; const b = Math.acos(1 - (2 * (k + 0.5)) / 30);
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        const alvo = k % 2 ? cabeca : tronco; const r = k % 2 ? rCabeca : 0.33;
        p.position.set(Math.cos(a) * Math.sin(b) * r * 1.01, Math.cos(b) * r * (k % 2 ? 1.01 : 1.16) + (k % 2 ? 0 : 0.3), Math.sin(a) * Math.sin(b) * r * (k % 2 ? 1.01 : 0.91)); p.rotation.set(k, k, 0); alvo.add(p);
      }
      for (const lado of [-1, 1]) { const laco = peca(new THREE.ConeGeometry(0.08, 0.14, 4), mat(0x35c46a, { emissive: 0x1a8a3a, emissiveIntensity: 0.3 })); laco.rotation.z = lado * Math.PI / 2; laco.position.set(lado * 0.07, 0.68, 0.24); tronco.add(laco); }
      const no = bola(0.04, mat(0x35c46a), 10); no.position.set(0, 0.68, 0.26); tronco.add(no);
    },
  });
}

function coelho() {
  const branco = pelo(0xfbfaf6, 2); const rosa = mat(0xffa8c4);
  const modelo = bipede({
    corpo: mat(0xe5233a), barriga: mat(0xfbfaf6), membro: branco, pe: pelo(0xfbfaf6, 2), cabeca: branco, rCorpo: 0.3, rCabeca: 0.29,
    extras: ({ cabeca, tronco, pernas, rCabeca }) => {
      const orelhas = [];
      for (const lado of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(lado * 0.12, rCabeca * 0.8, -0.02); piv.rotation.z = -lado * 0.18; cabeca.add(piv);
        const fora = capsula(0.075, 0.42, branco); fora.scale.z = 0.5; fora.position.y = 0.26; piv.add(fora);
        const dentro = capsula(0.045, 0.34, rosa); dentro.scale.z = 0.3; dentro.position.set(0, 0.26, 0.03); piv.add(dentro);
        orelhas.push({ piv, lado });
        const o = olhinho(0.055, 0x24324a); o.position.set(lado * 0.1, 0.05, rCabeca * 0.88); cabeca.add(o);
        const bochecha = bola(0.08, branco, 12); bochecha.scale.set(1, 0.8, 0.7); bochecha.position.set(lado * 0.07, -0.08, rCabeca * 0.78); cabeca.add(bochecha);
        for (let k = 0; k < 2; k++) { const fio = peca(new THREE.CylinderGeometry(0.003, 0.002, 0.18, 4), mat(0xd9d4cc)); fio.rotation.z = lado * (Math.PI / 2 + (k - 0.5) * 0.3); fio.position.set(lado * 0.15, -0.07 + k * 0.03, rCabeca * 0.9); cabeca.add(fio); }
      }
      const nariz = bola(0.035, rosa, 10); nariz.scale.set(1.3, 0.9, 0.8); nariz.position.set(0, -0.03, rCabeca * 1.0); cabeca.add(nariz);
      const dentes = peca(new THREE.BoxGeometry(0.06, 0.05, 0.02), mat(0xffffff)); dentes.position.set(0, -0.14, rCabeca * 0.9); cabeca.add(dentes);
      // colete com botões dourados, gravata-borboleta azul e o rabinho de pompom
      for (let k = 0; k < 3; k++) { const bt = bola(0.025, mat(0xffd34d), 8); bt.position.set(0, 0.42 - k * 0.12, 0.29); tronco.add(bt); }
      for (const lado of [-1, 1]) { const laco = peca(new THREE.ConeGeometry(0.07, 0.13, 4), mat(0x2f8fff)); laco.rotation.z = lado * Math.PI / 2; laco.position.set(lado * 0.07, 0.66, 0.21); tronco.add(laco); }
      const rabo = bola(0.1, branco, 12); rabo.position.set(0, 0.15, -0.3); tronco.add(rabo);
      for (const p of pernas) p.pe.scale.set(1.1, 0.55, 2); // pezões de coelho
      cabeca.userData.orelhas = orelhas;
    },
  });
  const animar = modelo.animar; const segurar = modelo.segurar;
  let lista = null;
  const achar = () => { if (!lista) { lista = []; modelo.raiz.traverse((x) => { if (x.userData.orelhas) lista = x.userData.orelhas; }); } return lista; };
  modelo.animar = (fase) => { animar(fase); for (const { piv, lado } of achar()) piv.rotation.x = -0.3 - Math.abs(Math.sin(fase)) * 0.35 + lado * 0.02; };
  modelo.segurar = (t) => { segurar(t); for (const { piv, lado } of achar()) piv.rotation.x = Math.sin(t * 4 + lado) * 0.15; };
  return modelo;
}

function alien() {
  const verde = mat(0x7ce86a); const roupa = mat(0xd4dbe6, { metalness: 0.4, roughness: 0.35 }); const roxo = mat(0x9b6cff);
  const modelo = bipede({
    corpo: roupa, barriga: mat(0xb9c3d3, { metalness: 0.4, roughness: 0.35 }), membro: verde, pe: roxo, cabeca: verde, rCorpo: 0.27, rCabeca: 0.37,
    extras: ({ cabeca, tronco, rCabeca }) => {
      cabeca.children[0].scale.set(1.12, 1, 1);
      const antenas = [];
      for (const lado of [-1, 1]) {
        // olhões amendoados, bem pretos e brilhantes
        const o = olhinho(0.09); o.scale.set(1, 1.35, 1); o.rotation.z = lado * 0.35; o.position.set(lado * 0.15, 0.04, rCabeca * 0.83); cabeca.add(o);
        const piv = new THREE.Group(); piv.position.set(lado * 0.14, rCabeca * 0.88, 0); piv.rotation.z = -lado * 0.35; cabeca.add(piv);
        const haste = capsula(0.018, 0.28, verde); haste.position.y = 0.16; piv.add(haste);
        const bolinha = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe14d })); bolinha.position.y = 0.34; piv.add(bolinha);
        antenas.push({ piv, lado, bolinha });
      }
      const boca = peca(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), mat(0x2a5a2a)); boca.rotation.z = Math.PI; boca.position.set(0, -0.15, rCabeca * 0.95); cabeca.add(boca);
      // estrela no peito e o cinto de luzinhas
      const forma = new THREE.Shape();
      for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k * Math.PI) / 5; const r = k % 2 ? 0.035 : 0.08; forma[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
      const estrela = peca(new THREE.ExtrudeGeometry(forma, { depth: 0.015, bevelEnabled: false }), mat(0xffd34d)); estrela.position.set(0, 0.42, 0.24); tronco.add(estrela);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const l = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: [0x5ae6ff, 0xff5fa2, 0x9bff6a][k % 3] })); l.position.set(Math.cos(a) * 0.27, 0.12, Math.sin(a) * 0.245); tronco.add(l); }
      cabeca.userData.antenas = antenas;
    },
  });
  const animar = modelo.animar; const segurar = modelo.segurar;
  let lista = null;
  const achar = () => { if (!lista) modelo.raiz.traverse((x) => { if (x.userData.antenas) lista = x.userData.antenas; }); return lista ?? []; };
  modelo.animar = (fase) => { animar(fase); for (const { piv, lado, bolinha } of achar()) { piv.rotation.x = Math.sin(fase * 2 + lado) * 0.25; bolinha.visible = Math.floor(fase) % 2 === 0 || lado > 0; } };
  modelo.segurar = (t) => { segurar(t); for (const { piv, lado } of achar()) piv.rotation.x = Math.sin(t * 6 + lado) * 0.3; };
  return modelo;
}

function raposa() {
  return quadrupede({
    corpo: 0xe8792e, barriga: 0xfff1dc, patas: 0xd96a24, cabeca: 0xec8236, focinho: 0xfff4e4, orelhas: 0xe8792e, nariz: 0x2a1a12, iris: '#8a5212', escala: 1.0,
    extras: ({ pescoco, cauda }) => {
      // orelhonas de feneco, de dentro clarinho
      for (const lado of [-1, 1]) {
        const fora = peca(new THREE.ConeGeometry(0.13, 0.42, 14), pelo(0xe8792e, 2)); fora.scale.z = 0.45; fora.position.set(lado * 0.2, 0.4, -0.04); fora.rotation.z = -lado * 0.45; pescoco.add(fora);
        const dentro = peca(new THREE.ConeGeometry(0.085, 0.32, 12), mat(0xffe3d0)); dentro.scale.z = 0.3; dentro.position.set(lado * 0.195, 0.38, 0.0); dentro.rotation.z = -lado * 0.45; pescoco.add(dentro);
      }
      // rabo peludo com a pontinha branca
      const rabo = capsula(0.11, 0.42, pelo(0xe8792e, 2)); rabo.position.y = -0.3; cauda.add(rabo);
      const ponta = bola(0.12, pelo(0xfff6ea, 2)); ponta.scale.set(1, 1.3, 1); ponta.position.y = -0.62; cauda.add(ponta);
      bandana(pescoco, 0x2fb5a8); // lenço azul-turquesa de viajante do deserto
    },
  });
}

export const CRIAR_NOVOS = { ursogoma: ursoGoma, coelho, raposa, alien };
