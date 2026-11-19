// A menina em 3D, mais realista: material que reage à luz como pele e tecido, braços e pernas
// com formato de músculo (torneados), roupa com textura de tecido, tênis detalhado e cabelo
// ondulado feito de várias mechas que balançam separadas.
import { THREE, xDe, textura, ruido, sombrear, texBrilho } from './base.js';
import { PELES, ROUPAS } from '../personagem.js';

const CABELO = ['#69361d', '#733c21', '#7d4526', '#86492a', '#8f502e'];

// Peça torneada: perfil (raio, altura) girado em volta do eixo vertical.
function torneada(perfil, segmentos = 20) {
  return new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), segmentos);
}

function pele(cor) { return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.55, metalness: 0 }); }

// Camiseta: a cor da roupa com recortes brancos nas laterais e uma estrela nas costas.
// Na peça torneada, u = 0 é a frente, 0,25 e 0,75 são as laterais e 0,5 são as costas.
function texCamiseta(cor) {
  return textura(512, 256, (ctx, w, h) => {
    ctx.fillStyle = cor; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f4f4f4';
    for (const u of [0.25, 0.75]) ctx.fillRect(w * u - 14, 0, 28, h);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = 'bold 70px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', w * 0.5, h * 0.62);
    ctx.strokeStyle = 'rgba(0,0,0,.05)';
    for (let y = 0; y < h; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  });
}

function texShort(cor) {
  return textura(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#2f3446'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = cor;
    for (const u of [0.25, 0.75]) ctx.fillRect(w * u - 4, 0, 8, h);
    ruido(ctx, w, h, 600, 'rgba(255,255,255,.04)', 1);
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
function mecha(angulo, comprimento, largura, fase) {
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
      r = 0.115 + (-0.11 - y) * 0.12;
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

export function criarMenina() {
  const tex = criarTexturas();
  const raiz = new THREE.Group();
  const corpo = new THREE.Group();
  raiz.add(corpo);
  const mat = {
    pele: pele(PELES[1]),
    roupa: new THREE.MeshStandardMaterial({ color: ROUPAS[0], roughness: 0.85, map: tex.tecido }),
    camiseta: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }),
    shortTorneado: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
    branco: new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 0.8, map: tex.tecido }),
    short: new THREE.MeshStandardMaterial({ color: 0x2f3446, roughness: 0.9, map: tex.tecido }),
    tenis: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, map: tex.tenis }),
    sola: new THREE.MeshStandardMaterial({ color: 0xe6e8ec, roughness: 0.8 }),
    detalhe: new THREE.MeshStandardMaterial({ color: ROUPAS[0], roughness: 0.6 }),
    cadarco: new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.7 }),
    cabelo: CABELO.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, map: tex.cabelo, side: THREE.DoubleSide })),
    cabeloLiso: new THREE.MeshStandardMaterial({ color: CABELO[2], roughness: 0.45 }),
  };
  const peca = (geo, m) => sombrear(new THREE.Mesh(geo, m));

  // ---- pernas: quadril -> joelho -> pé ----
  // quadril: gira ao contrário dos ombros a cada passada, como numa corrida de verdade
  const quadril = new THREE.Group(); quadril.position.y = 0.62; corpo.add(quadril);
  const pernas = [-1, 1].map((lado) => {
    const coxa = new THREE.Group(); coxa.position.set(lado * 0.082, 0, 0);
    const mCoxa = peca(torneada([[0, 0.02], [0.058, 0.012], [0.067, -0.04], [0.064, -0.13], [0.054, -0.22], [0.047, -0.28], [0.04, -0.305], [0.022, -0.318], [0, -0.322]]), mat.pele);
    mCoxa.scale.z = 0.92; coxa.add(mCoxa);
    const barra = peca(new THREE.CylinderGeometry(0.071, 0.074, 0.11, 18), mat.short); barra.position.y = -0.035; coxa.add(barra);
    const joelho = new THREE.Group(); joelho.position.y = -0.285; coxa.add(joelho);
    const mCanela = peca(torneada([[0, 0.035], [0.024, 0.032], [0.04, 0.02], [0.046, 0], [0.05, -0.05], [0.048, -0.1], [0.038, -0.19], [0.031, -0.25], [0, -0.26]]), mat.pele);
    mCanela.scale.z = 0.95; joelho.add(mCanela);
    const meia = peca(new THREE.CylinderGeometry(0.036, 0.034, 0.06, 14), mat.branco); meia.position.y = -0.245; joelho.add(meia);
    // tênis: cabedal arredondado, biqueira, solado colorido, cadarços e calcanhar
    const tenis = new THREE.Group(); tenis.position.set(0, -0.3, 0.035); joelho.add(tenis);
    const cabedal = peca(new THREE.CapsuleGeometry(0.052, 0.12, 6, 14), mat.tenis);
    cabedal.rotation.x = Math.PI / 2; cabedal.scale.set(1, 1, 0.75); cabedal.position.y = 0.005; tenis.add(cabedal);
    const sola = peca(new THREE.CapsuleGeometry(0.056, 0.13, 4, 14), mat.sola);
    sola.rotation.x = Math.PI / 2; sola.scale.set(0.95, 1, 0.26); sola.position.y = -0.04; tenis.add(sola);
    for (let k = 0; k < 3; k++) {
      const c = peca(new THREE.BoxGeometry(0.06, 0.008, 0.012), mat.cadarco);
      c.position.set(0, 0.045 - k * 0.004, 0.02 + k * 0.03); c.rotation.x = -0.35; tenis.add(c);
    }
    for (const l of [-1, 1]) {
      const risco = peca(new THREE.BoxGeometry(0.004, 0.016, 0.1), mat.detalhe); risco.position.set(l * 0.051, -0.002, -0.005); risco.rotation.x = 0.35; tenis.add(risco);
    }
    const calcanhar = peca(new THREE.BoxGeometry(0.03, 0.035, 0.01), mat.detalhe); calcanhar.position.set(0, 0.03, -0.112); tenis.add(calcanhar);
    quadril.add(coxa);
    return { coxa, joelho, tenis, lado };
  });

  // ---- tronco ----
  const tronco = new THREE.Group(); tronco.position.y = 0.62; corpo.add(tronco);
  const short = peca(torneada([[0, 0.12], [0.135, 0.12], [0.148, 0.06], [0.157, -0.02], [0.16, -0.07], [0.12, -0.085], [0, -0.09]], 28), mat.shortTorneado);
  short.scale.z = 0.78; quadril.add(short);
  const camiseta = peca(torneada([[0, 0.06], [0.142, 0.06], [0.134, 0.14], [0.14, 0.24], [0.152, 0.33], [0.158, 0.38], [0.13, 0.43], [0.06, 0.455], [0, 0.46]], 36), mat.camiseta);
  camiseta.scale.z = 0.72; tronco.add(camiseta);
  const barraCamiseta = peca(new THREE.TorusGeometry(0.138, 0.012, 8, 28), mat.roupa); barraCamiseta.rotation.x = Math.PI / 2; barraCamiseta.scale.y = 0.72; barraCamiseta.position.y = 0.06; tronco.add(barraCamiseta);
  const pescoco = peca(torneada([[0, 0.1], [0.042, 0.1], [0.046, 0.04], [0.054, 0], [0, 0]]), mat.pele); pescoco.position.y = 0.44; tronco.add(pescoco);
  const gola = peca(new THREE.TorusGeometry(0.058, 0.012, 8, 20), mat.branco); gola.rotation.x = Math.PI / 2; gola.position.y = 0.45; tronco.add(gola);

  // ---- braços: ombro -> cotovelo -> mão ----
  const bracos = [-1, 1].map((lado) => {
    const ombro = new THREE.Group(); ombro.position.set(lado * 0.175, 0.385, 0); tronco.add(ombro);
    const manga = peca(torneada([[0, 0.035], [0.035, 0.034], [0.05, 0.015], [0.052, -0.03], [0.048, -0.075], [0.047, -0.08], [0, -0.08]], 18), mat.camiseta); ombro.add(manga);
    const mBraco = peca(torneada([[0, 0.02], [0.04, 0.01], [0.043, -0.05], [0.038, -0.14], [0.034, -0.195], [0.024, -0.21], [0, -0.215]]), mat.pele); ombro.add(mBraco);
    const cotovelo = new THREE.Group(); cotovelo.position.y = -0.2; ombro.add(cotovelo);
    const mAnte = peca(torneada([[0, 0.03], [0.02, 0.028], [0.031, 0.015], [0.034, 0], [0.034, -0.05], [0.028, -0.15], [0.025, -0.17], [0, -0.175]]), mat.pele); cotovelo.add(mAnte);
    const mao = new THREE.Group(); mao.position.y = -0.19; cotovelo.add(mao);
    const palma = peca(new THREE.SphereGeometry(0.036, 14, 10), mat.pele); palma.scale.set(0.8, 1.1, 0.6); mao.add(palma);
    const polegar = peca(new THREE.CapsuleGeometry(0.011, 0.03, 4, 8), mat.pele); polegar.position.set(-lado * 0.022, 0.005, 0.015); polegar.rotation.z = lado * 0.6; mao.add(polegar);
    return { ombro, cotovelo };
  });

  // ---- cabeça e cabelo ----
  const cabeca = new THREE.Group(); cabeca.position.y = 0.6; tronco.add(cabeca);
  const cranio = peca(new THREE.SphereGeometry(0.142, 32, 24), mat.pele); cranio.scale.set(0.92, 1.04, 0.98); cabeca.add(cranio);
  for (const lado of [-1, 1]) {
    const orelha = peca(new THREE.SphereGeometry(0.028, 12, 10), mat.pele); orelha.scale.set(0.5, 1, 0.8); orelha.position.set(lado * 0.13, -0.01, -0.005); cabeca.add(orelha);
  }
  const touca = peca(new THREE.SphereGeometry(0.15, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6), mat.cabeloLiso);
  touca.position.set(0, 0.012, -0.008); touca.scale.set(0.97, 1.03, 1.02); cabeca.add(touca);
  const nuca = peca(new THREE.SphereGeometry(0.148, 28, 18, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.35, Math.PI * 0.35), mat.cabeloLiso);
  nuca.rotation.y = Math.PI; cabeca.add(nuca);
  const mechas = [];
  // camada de baixo, contínua: não deixa a camiseta aparecer entre as mechas
  const base = new THREE.Group();
  base.add(peca(mecha(0, 0.5, 0.36, 0.5), mat.cabelo[1]));
  base.scale.set(0.97, 1, 0.97);
  cabeca.add(base);
  mechas.push({ piv: base, fase: 0 });
  const N = 23;
  for (let k = 0; k < N; k++) {
    const t = k / (N - 1);
    const ang = (t - 0.5) * 2.5; // espalhadas por trás da cabeça
    const comp = 0.5 + Math.sin(t * Math.PI) * 0.1 + (Math.random() - 0.5) * 0.05;
    const piv = new THREE.Group();
    piv.position.y = 0;
    const m = peca(mecha(ang, comp, 0.06 + Math.random() * 0.02, k * 1.7), mat.cabelo[(k * 3) % CABELO.length]);
    piv.add(m);
    cabeca.add(piv);
    mechas.push({ piv, fase: k * 0.6 });
  }
  // faixa de cabelo: arco de uma orelha à outra, por cima da cabeça
  const faixa = peca(new THREE.TorusGeometry(0.166, 0.015, 10, 40, Math.PI), mat.roupa);
  faixa.rotation.x = -0.25; faixa.position.set(0, -0.005, 0.01); cabeca.add(faixa);

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
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), transparent: true, depthWrite: false, opacity: 0.55 }));
  aura.scale.set(1.6, 2.2, 1); aura.position.y = 0.75; raiz.add(aura);

  let visual = '';
  function vestir(p, r) {
    const chave = `${p}-${r}`;
    if (chave === visual) return;
    visual = chave;
    mat.pele.color.set(PELES[p] ?? PELES[1]);
    const cor = ROUPAS[r] ?? ROUPAS[0];
    mat.roupa.color.set(cor);
    mat.detalhe.color.set(cor);
    mat.camiseta.map?.dispose(); mat.camiseta.map = texCamiseta(cor); mat.camiseta.needsUpdate = true;
    mat.shortTorneado.map?.dispose(); mat.shortTorneado.map = texShort(cor); mat.shortTorneado.needsUpdate = true;
  }

  const SKATE_COR = { classico: 0xd79a5b, voador: 0x29b7dc, supersonico: 0xd83a2c };
  // ---------- Animação ----------
  // Cada situação tem uma pose; as poses se misturam aos poucos (cerca de 0,1 s), como uma pessoa
  // que passa de correr para pular, sem trocar de posição de repente.
  // pos/rot = corpo inteiro; quadril e tronco giram ao contrário um do outro; cx/cz = coxa,
  // j = joelho, p = tornozelo, ox/oz = ombro, c = cotovelo (0 = esquerda, 1 = direita).
  const JUNTAS = ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'quadrilY', 'quadrilZ', 'troncoX', 'troncoY', 'troncoZ', 'cabecaX', 'cabecaY', 'vento', 'balanco',
    'cx0', 'cz0', 'j0', 'p0', 'cx1', 'cz1', 'j1', 'p1', 'ox0', 'oz0', 'c0', 'ox1', 'oz1', 'c1'];
  const pesos = { parado: 1, corrida: 0, ar: 0, pouso: 0, desliza: 0, voo: 0, skate: 0, batida: 0 };
  const lado = (k) => (k ? 1 : -1);
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
      }
      return r;
    },
    corrida: (s, t, f) => {
      const v = Math.min(1, (s.vel ?? 13) / 28);
      const r = {
        posY: 0.025 + 0.045 * Math.abs(Math.sin(f)), // sobe e desce a cada passada
        quadrilY: 0.14 * Math.sin(f), troncoY: -0.2 * Math.sin(f), cabecaY: 0.1 * Math.sin(f), // quadril e ombros giram ao contrário; a cabeça fica firme
        quadrilZ: 0.04 * Math.cos(f), troncoX: 0.16 + 0.12 * v, cabecaX: -0.14 - 0.06 * v + 0.03 * Math.sin(2 * f),
        vento: 0.18 + (s.vel ?? 13) * 0.006, balanco: 0.05,
      };
      for (const k of [0, 1]) {
        const sw = Math.sin(f + (k ? Math.PI : 0));
        const cw = Math.cos(f + (k ? Math.PI : 0));
        r[`cx${k}`] = -0.28 - 0.58 * sw; // a coxa vai à frente e volta
        r[`j${k}`] = 0.22 + 1.35 * Math.max(0, cw) ** 1.3 + 0.25 * Math.max(0, -sw); // o joelho dobra quando a perna volta para a frente
        r[`p${k}`] = 0.38 * Math.max(0, -sw) - 0.18 * Math.max(0, sw); // empurra com a ponta do pé; chega com o calcanhar
        r[`cz${k}`] = lado(k) * 0.03;
        const aw = Math.sin(f + (k ? 0 : Math.PI)); // cada braço acompanha a perna do outro lado
        r[`ox${k}`] = -0.15 - 0.75 * aw;
        r[`oz${k}`] = lado(k) * (0.16 - 0.08 * Math.max(0, aw));
        r[`c${k}`] = -1.25 - 0.3 * Math.max(0, aw);
      }
      return r;
    },
    ar: (s) => {
      // subindo: pernas encolhidas e braços para cima; descendo: pernas se esticam para o pouso
      const m = Math.min(1, Math.max(0, (s.vy + 2) / 6));
      const mix = (a, b) => a * m + b * (1 - m);
      return {
        troncoX: mix(0.12, 0.05), cabecaX: -0.2, vento: mix(-0.1, 0.5), balanco: 0.08,
        cx0: mix(-1.1, -0.6), j0: mix(1.5, 0.55), p0: mix(-0.2, -0.15), cz0: -0.05,
        cx1: mix(0.3, -0.1), j1: mix(1.15, 0.65), p1: mix(0.45, 0.15), cz1: 0.05,
        ox0: mix(-2.3, -0.6), oz0: mix(-0.25, -0.95), c0: mix(-0.5, -0.4),
        ox1: mix(-1.4, -0.6), oz1: mix(0.35, 0.95), c1: mix(-0.9, -0.4),
      };
    },
    pouso: () => ({
      // amortece: joelhos dobram, tronco vai à frente, braços equilibram
      posY: -0.15, troncoX: 0.45, cabecaX: -0.35, vento: 0.35, balanco: 0.06,
      cx0: -0.75, j0: 1.25, p0: -0.35, cx1: -0.6, j1: 1.1, p1: -0.3, cz0: -0.06, cz1: 0.06,
      ox0: -0.55, oz0: -0.35, c0: -0.8, ox1: -0.45, oz1: 0.35, c1: -0.8,
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
    skate: (s, t) => {
      // de lado na prancha, joelhos dobrados acompanhando o balanço, braços abertos
      const b = Math.sin(t * 4);
      return {
        rotY: 0.35, posY: -0.03 + 0.02 * b, troncoX: 0.2, cabecaY: -0.32, cabecaX: -0.1, vento: 0.45, balanco: 0.08,
        cx0: -0.25 - 0.05 * b, j0: 0.45 + 0.08 * b, p0: -0.1, cz0: -0.08,
        cx1: 0.25 - 0.05 * b, j1: 0.55 + 0.08 * b, p1: 0.2, cz1: 0.08,
        ox0: -0.5, oz0: -0.6 - 0.05 * b, c0: -0.6, ox1: 0.2, oz1: 0.7 + 0.05 * b, c1: -0.4,
      };
    },
    batida: () => ({
      // o susto da batida: tronco para trás e braços para cima
      posY: -0.05, troncoX: -0.35, cabecaX: 0.3, vento: 0.2, balanco: 0.02,
      cx0: -0.4, j0: 0.6, cx1: 0.2, j1: 0.4, ox0: -2.6, oz0: -0.5, c0: -0.4, ox1: -2.6, oz1: 0.5, c1: -0.4,
    }),
  };
  let ultimoTPose = null; let yAntes = 0; let pouso = 0;

  function posar(s, t) {
    const dtp = ultimoTPose === null ? 1 : Math.min(0.05, Math.max(0, t - ultimoTPose));
    ultimoTPose = t;
    const parado = s.t === 0 && s.dist === 0; // tela inicial: ela espera, parada
    const naPrancha = s.skate > 0;
    const fase = parado ? t * 2 : s.dist * 1.55;
    if (yAntes > 0.15 && s.y <= 0.001 && s.voo <= 0) pouso = 0.22; // acabou de pousar
    yAntes = s.y;
    pouso = Math.max(0, pouso - dtp);
    let estado = 'corrida';
    if (!s.vivo) estado = 'batida';
    else if (parado) estado = 'parado';
    else if (s.voo > 0) estado = 'voo';
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

    // troca de faixa: inclina para dentro da curva e vira um pouco o corpo para o lado
    const desvio = s.x - s.faixa;
    raiz.position.set(xDe(s.x), s.y + (naPrancha ? 0.1 : 0), 0);
    raiz.rotation.set(0, desvio * 0.35, -desvio * 0.3);
    corpo.position.set(a.posX, a.posY, a.posZ);
    corpo.rotation.set(a.rotX, a.rotY, 0);
    quadril.rotation.set(0, a.quadrilY, a.quadrilZ);
    tronco.rotation.set(a.troncoX, a.troncoY, a.troncoZ);
    cabeca.rotation.set(a.cabecaX, a.cabecaY, 0);
    pernas.forEach((p, i) => {
      p.coxa.rotation.set(a[`cx${i}`], 0, a[`cz${i}`]);
      p.joelho.rotation.x = a[`j${i}`];
      p.tenis.rotation.x = a[`p${i}`];
    });
    bracos.forEach((b, i) => {
      b.ombro.rotation.set(a[`ox${i}`], 0, a[`oz${i}`]);
      b.cotovelo.rotation.x = a[`c${i}`];
    });
    // cada mecha balança com um pouco de atraso em relação às outras
    for (const m of mechas) {
      m.piv.rotation.x = a.vento * 0.5 + Math.sin(fase * 2 + m.fase) * a.balanco;
      m.piv.rotation.z = Math.sin(fase + m.fase * 0.7) * a.balanco * 0.6;
    }
    skate.visible = naPrancha;
    if (naPrancha) {
      matDeck.color.setHex(SKATE_COR[s.skateTipo] ?? SKATE_COR.classico);
      rodas.visible = s.skateTipo === 'classico';
      brilhoSkate.visible = s.skateTipo === 'voador';
      chamasSkate.forEach((f) => { f.visible = s.skateTipo === 'supersonico'; f.scale.setScalar(0.8 + Math.random() * 0.4); });
      skate.position.y = -0.1 + (s.skateTipo === 'voador' ? 0.05 + Math.sin(t * 5) * 0.025 : 0);
    }
    maleta.visible = s.voo > 0;
    chamasMaleta.forEach((f) => f.scale.set(1, 0.7 + Math.random() * 0.6, 1));
    // fumaça: nuvenzinhas que saem dos bocais e ficam para trás
    const dt = Math.min(0.05, Math.max(0, t - ultimoT)); ultimoT = t;
    if (s.voo > 0 && t >= proximaFumaca) {
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
    aura.visible = corAura !== null;
    if (corAura !== null) { aura.material.color.setHex(corAura); aura.material.opacity = 0.45 + Math.sin(t * 8) * 0.1; }
    raiz.visible = !(s.invencivel > 0 && Math.floor(t * 12) % 2 === 0);
  }

  return { raiz, vestir, posar };
}
