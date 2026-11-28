// Obstáculos em movimento da corrida, em 3D: ônibus na contramão e bicicleta que troca de faixa
// (cidade), caranguejo e bola de praia (praia), tronco rolando e galho balançando (floresta),
// bola de neve que cresce e pinguim de barriga (neve). Cada um traz o aviso: ⚠️ piscando em cima
// e uma marca no chão da faixa em que ele vai chegar. A posição vem da lógica (corrida.js);
// aqui só se desenha e se anima (patas, rodas, rolar, balançar).
import { THREE, FAIXA, LARG_RUA, xDe, textura, toon, desenho, sombrear } from './base.js';
import { GALHO } from '../corrida.js';

const L = FAIXA * 0.86;
const peca = (geo, m) => sombrear(new THREE.Mesh(geo, m));
const bola = (r, m, seg = 16) => peca(new THREE.SphereGeometry(r, seg, Math.max(8, Math.round(seg * 0.7))), m);
const cil = (r1, r2, h, m, seg = 14) => peca(new THREE.CylinderGeometry(r1, r2, h, seg), m);
const caixa = (x, y, z, m) => peca(new THREE.BoxGeometry(x, y, z), m);
const luz = (cor) => new THREE.MeshBasicMaterial({ color: cor });
const pele = (cor) => desenho({ color: cor });

// ---------- Texturas compartilhadas (não são liberadas quando o obstáculo sai da pista) ----------
const TEX = {};
const recursos = new Set();
function tex(chave, w, h, fazer, repetir = false) {
  if (!TEX[chave]) { TEX[chave] = textura(w, h, fazer, repetir); recursos.add(TEX[chave]); }
  return TEX[chave];
}
export const recursosDosMoveis = () => recursos;

const texAlerta = () => tex('alerta', 128, 128, (ctx) => {
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(64, 10); ctx.lineTo(120, 112); ctx.lineTo(8, 112); ctx.closePath();
  ctx.fillStyle = '#ffd21f'; ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.lineWidth = 5; ctx.strokeStyle = '#e8452c'; ctx.stroke();
  ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.roundRect(57, 40, 14, 44, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(64, 97, 8, 0, 7); ctx.fill();
});
const texSeta = () => tex('seta', 128, 128, (ctx) => {
  ctx.fillStyle = '#ff9a1f'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(116, 64); ctx.lineTo(64, 14); ctx.lineTo(64, 42); ctx.lineTo(12, 42); ctx.lineTo(12, 86); ctx.lineTo(64, 86); ctx.lineTo(64, 114); ctx.closePath();
  ctx.stroke(); ctx.fill();
});
// marca no chão: faixas laranja e amarelas com setas apontando para a menina
function setas(ctx, y0) {
  ctx.lineWidth = 16; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let k = 0; k < 3; k++) { const y = y0 + k * 76; ctx.beginPath(); ctx.moveTo(28, y + 36); ctx.lineTo(64, y); ctx.lineTo(100, y + 36); ctx.stroke(); }
}
const texChao = () => tex('chao', 128, 256, (ctx, w, h) => {
  ctx.fillStyle = '#ff9a1f'; ctx.beginPath(); ctx.roundRect(6, 6, w - 12, h - 12, 24); ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  setas(ctx, 28);
});
// a mesma marca sem as pontas, para repetir ao longo de uma faixa comprida
const texFaixa = () => tex('chao-faixa', 128, 256, (ctx, w, h) => {
  ctx.fillStyle = '#ff9a1f'; ctx.fillRect(6, 0, w - 12, h);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(4, 0, 10, h); ctx.fillRect(w - 14, 0, 10, h);
  setas(ctx, 28);
});

// ---------- Aviso: ⚠️ em cima e a marca no chão da faixa de destino ----------
function avisos(g, altura) {
  const placa = new THREE.Sprite(new THREE.SpriteMaterial({ map: texAlerta(), transparent: true, depthWrite: false, fog: false }));
  placa.scale.set(0.85, 0.85, 1); placa.position.y = altura + 0.7; placa.renderOrder = 3;
  const marca = new THREE.Mesh(new THREE.PlaneGeometry(FAIXA * 0.8, 2.6), new THREE.MeshBasicMaterial({ map: texChao(), transparent: true, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  marca.rotation.x = -Math.PI / 2; marca.position.y = 0.035; marca.renderOrder = 2;
  g.add(placa, marca);
  return { placa, marca };
}

// Os da contramão: a marca vira uma faixa comprida do obstáculo até perto da menina.
function faixaComprida(av) {
  const t = texFaixa().clone(); t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true;
  av.marca.material.map = t;
  return (o) => {
    const ate = Math.max(0.5, o.z - 1);
    av.marca.scale.y = ate / 2.6; av.marca.position.z = -ate / 2;
    t.repeat.y = ate / 2.6;
  };
}

// ---------- Ônibus na contramão: amarelinho, de olhões no para-brisa e sorriso na grade ----------
function onibus() {
  const g = new THREE.Group();
  const comp = 6; const alt = 1.85;
  const amarelo = toon(0xffc21f);
  const lado = toon(0xffffff, { map: tex('onibus-lado', 512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffc21f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(0, 96, w, 10);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = '#8fd3ff'; ctx.beginPath(); ctx.roundRect(18 + k * 82, 16, 66, 40, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(26 + k * 82, 20, 10, 32); }
    ctx.fillStyle = '#e8452c'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★ ESCOLAR ★', w / 2, 88);
  }) });
  const frente = toon(0xffffff, { map: tex('onibus-frente', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffc21f'; ctx.fillRect(0, 0, w, h);
    // para-brisa com olhões simpáticos
    ctx.fillStyle = '#8fd3ff'; ctx.beginPath(); ctx.roundRect(18, 22, w - 36, 104, 18); ctx.fill();
    for (const x of [86, 170]) {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, 76, 30, 36, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.ellipse(x + 4, 84, 16, 20, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 10, 76, 6, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(28, 30, 14, 86);
    // placa com o número e o sorriso da grade
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.roundRect(70, 140, 116, 26, 8); ctx.fill();
    ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ESCOLA', 128, 161);
    ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(128, 170, 52, 0.35, Math.PI - 0.35); ctx.stroke();
    ctx.fillStyle = '#ff8fb1'; for (const x of [52, 204]) { ctx.beginPath(); ctx.ellipse(x, 200, 16, 10, 0, 0, 7); ctx.fill(); }
  }) });
  const corpo = peca(new THREE.BoxGeometry(L, alt, comp - 0.1), [lado, lado, amarelo, amarelo, amarelo, frente]);
  corpo.position.set(0, 0.25 + alt / 2, comp / 2); g.add(corpo); // a face −z (frente) olha para a câmera
  const teto = caixa(L - 0.1, 0.12, comp - 0.4, toon(0xffffff)); teto.position.set(0, 0.25 + alt + 0.06, comp / 2); g.add(teto);
  const para = caixa(L + 0.06, 0.18, 0.16, toon(0x5a6170)); para.position.set(0, 0.32, 0.0); g.add(para);
  const farois = [];
  for (const s of [-1, 1]) {
    const farol = bola(0.11, luz(0xfff6c0), 14); farol.scale.z = 0.4; farol.position.set(s * (L / 2 - 0.2), 0.62, -0.03); g.add(farol);
    const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilhoTex(), color: 0xfff1a0, transparent: true, depthWrite: false, fog: false }));
    brilho.scale.set(0.9, 0.9, 1); brilho.position.copy(farol.position); brilho.position.z -= 0.05; g.add(brilho);
    const pisca = bola(0.07, luz(0xff7a1f), 10); pisca.position.set(s * (L / 2 - 0.15), 0.25 + alt - 0.06, -0.04); g.add(pisca);
    farois.push(pisca);
    const espelho = caixa(0.06, 0.22, 0.12, toon(0x2d3a4a)); espelho.position.set(s * (L / 2 + 0.1), 1.4, 0.15); g.add(espelho);
  }
  const rodas = [];
  for (const dz of [0.9, comp - 1]) for (const s of [-1, 1]) {
    const roda = new THREE.Group(); roda.position.set(s * (L / 2 - 0.05), 0.34, dz); g.add(roda);
    const pneu = cil(0.34, 0.34, 0.2, toon(0x2b2e38), 18); pneu.rotation.z = Math.PI / 2; roda.add(pneu);
    const calota = cil(0.17, 0.17, 0.22, toon(0xd4d9e2), 10); calota.rotation.z = Math.PI / 2; roda.add(calota);
    const raio = caixa(0.23, 0.05, 0.3, toon(0x9aa0ad)); roda.add(raio);
    rodas.push(roda);
  }
  const av = avisos(g, alt + 0.4);
  const esticar = faixaComprida(av);
  g.userData.animar = (o, t) => {
    const giro = (o.nasceu - o.z) / 0.34;
    for (const r of rodas) r.rotation.x = -giro;
    farois.forEach((f, k) => { f.visible = Math.floor(t * 4 + k) % 2 === 0; });
    esticar(o); // faixa de aviso: do ônibus até perto da menina, na faixa dele
    g.position.y = Math.abs(Math.sin(t * 9)) * 0.02; // chacoalha de leve
  };
  return { g, av, altura: alt + 0.4 };
}

let BRILHO = null;
function brilhoTex() {
  BRILHO ??= tex('brilho', 64, 64, (ctx) => {
    const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
  });
  return BRILHO;
}

// ---------- Olhinhos fofos ----------
function olho(r = 0.07, pupila = 0.55) {
  const g = new THREE.Group();
  const branco = bola(r, pele(0xffffff), 14); g.add(branco);
  const p = bola(r * pupila, pele(0x1d1410), 12); p.position.z = -r * 0.62; g.add(p);
  const reflexo = bola(r * 0.2, luz(0xffffff), 8); reflexo.position.set(r * 0.2, r * 0.25, -r * 0.95); g.add(reflexo);
  return g;
}

// ---------- Bicicleta: menino de capacete visto de costas, setinha piscando antes de trocar ----------
function bicicleta() {
  const g = new THREE.Group();
  const quadro = toon(0x22b3a8); const metal = toon(0xcfd5df);
  const rodas = [];
  for (const dz of [0.2, 1.3]) {
    const roda = new THREE.Group(); roda.position.set(0, 0.36, dz); g.add(roda);
    const pneu = peca(new THREE.TorusGeometry(0.33, 0.045, 8, 26), toon(0x2b2e38)); pneu.rotation.y = Math.PI / 2; roda.add(pneu);
    for (let k = 0; k < 4; k++) { const raio = caixa(0.015, 0.64, 0.015, metal); raio.rotation.x = (k * Math.PI) / 4; roda.add(raio); }
    rodas.push(roda);
  }
  const tubo = (a, b, r = 0.035) => {
    const v = new THREE.Vector3().subVectors(b, a); const m = cil(r, r, v.length(), quadro, 8);
    m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(m); return m;
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  tubo(V(0, 0.36, 0.2), V(0, 0.78, 0.45)); tubo(V(0, 0.36, 0.2), V(0, 0.4, 0.75)); tubo(V(0, 0.4, 0.75), V(0, 0.78, 0.45));
  tubo(V(0, 0.4, 0.75), V(0, 0.95, 1.2)); tubo(V(0, 0.78, 0.45), V(0, 0.95, 1.2)); tubo(V(0, 0.36, 1.3), V(0, 1.05, 1.18));
  const guidao = cil(0.025, 0.025, 0.6, toon(0x2b2e38), 8); guidao.rotation.z = Math.PI / 2; guidao.position.set(0, 1.08, 1.16); g.add(guidao);
  const selim = caixa(0.16, 0.06, 0.24, toon(0x2b2e38)); selim.position.set(0, 0.82, 0.42); g.add(selim);
  // cestinha com flores na frente
  const cesta = cil(0.16, 0.12, 0.18, toon(0xc98a4e), 10); cesta.position.set(0, 1.0, 1.42); g.add(cesta);
  for (const [x, c] of [[-0.06, 0xff6f91], [0.06, 0xffd21f], [0, 0x7b6cf6]]) { const f = bola(0.05, toon(c), 8); f.position.set(x, 1.12, 1.42); g.add(f); }
  // luzinhas de trás: vermelha e as duas setas laranja
  const lanterna = bola(0.05, luz(0xff3b3b), 10); lanterna.position.set(0, 0.62, 0.08); g.add(lanterna);
  const setas = [];
  for (const s of [-1, 1]) { const p = bola(0.06, luz(0xff9a1f), 10); p.position.set(s * 0.2, 0.66, 0.12); g.add(p); setas.push(p); }
  // o ciclista
  const roupa = pele(0xff5a5a); const tez = pele(0xf2c29b);
  const tronco = peca(new THREE.CapsuleGeometry(0.17, 0.3, 6, 12), roupa); tronco.position.set(0, 1.14, 0.62); tronco.rotation.x = 0.5; g.add(tronco);
  const cabeca = bola(0.17, tez); cabeca.position.set(0, 1.5, 0.78); g.add(cabeca);
  const capacete = peca(new THREE.SphereGeometry(0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), pele(0x3e8bff)); capacete.position.set(0, 1.52, 0.78); g.add(capacete);
  const faixaCap = peca(new THREE.TorusGeometry(0.195, 0.025, 6, 20), pele(0xffd21f)); faixaCap.rotation.x = Math.PI / 2; faixaCap.position.set(0, 1.55, 0.78); g.add(faixaCap);
  for (const s of [-1, 1]) {
    const braco = peca(new THREE.CapsuleGeometry(0.05, 0.42, 4, 8), roupa); braco.position.set(s * 0.2, 1.18, 0.9); braco.rotation.x = 1.1; g.add(braco);
    const orelha = bola(0.04, tez, 8); orelha.position.set(s * 0.17, 1.47, 0.76); g.add(orelha);
  }
  const pernas = [];
  for (const s of [-1, 1]) {
    const perna = new THREE.Group(); perna.position.set(s * 0.1, 0.86, 0.5); g.add(perna);
    const coxa = peca(new THREE.CapsuleGeometry(0.065, 0.3, 4, 8), pele(0x3a4a7a)); coxa.position.y = -0.2; perna.add(coxa);
    const tenis = caixa(0.1, 0.07, 0.18, pele(0xffffff)); tenis.position.set(0, -0.42, 0.05); perna.add(tenis);
    pernas.push(perna);
  }
  const seta = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSeta(), transparent: true, depthWrite: false, fog: false }));
  seta.scale.set(1.0, 1.0, 1); seta.position.set(0, 2.3, 0.5); seta.renderOrder = 3; g.add(seta);
  const av = avisos(g, 1.75);
  av.placa.position.y = 3.15;
  g.userData.animar = (o, t) => {
    const giro = (o.nasceu - o.z) * 0.4 + t * 6;
    for (const r of rodas) r.rotation.x = giro;
    pernas.forEach((p, k) => { p.rotation.x = Math.sin(giro + k * Math.PI) * 0.6; });
    const dir = Math.sign(o.destino - o.origem); // faixa maior = −x no 3D
    const aceso = o.pisca && Math.floor(t * 5) % 2 === 0;
    setas.forEach((p, k) => { p.visible = aceso && (k === 0 ? dir > 0 : dir < 0); });
    seta.visible = aceso;
    seta.material.rotation = dir > 0 ? 0 : Math.PI; // setinha para o lado da troca (na tela)
    g.rotation.z = o.trocando ? -dir * 0.18 : 0; // inclina na curva
    g.rotation.y = o.trocando ? dir * 0.25 : 0;
  };
  return { g, av, altura: 1.75 };
}

// ---------- Cachorro atravessando: correndo de lado, orelhas e rabinho balançando ----------
function cachorro() {
  const g = new THREE.Group();
  const corpoG = new THREE.Group(); g.add(corpoG); // o desenho olha para +x
  const caramelo = pele(0xd99a5b); const creme = pele(0xfff1dc); const escuro = pele(0x6b3f22);
  const corpo = peca(new THREE.CapsuleGeometry(0.17, 0.42, 6, 14), caramelo); corpo.rotation.z = Math.PI / 2; corpo.position.y = 0.42; corpoG.add(corpo);
  const barriga = peca(new THREE.CapsuleGeometry(0.12, 0.34, 6, 12), creme); barriga.rotation.z = Math.PI / 2; barriga.position.set(0, 0.36, -0.06); corpoG.add(barriga);
  const mancha = bola(0.11, escuro, 10); mancha.scale.set(1.3, 0.5, 1); mancha.position.set(-0.1, 0.57, 0); corpoG.add(mancha);
  const cabeca = new THREE.Group(); cabeca.position.set(0.36, 0.62, 0); corpoG.add(cabeca);
  cabeca.add(bola(0.17, caramelo));
  const focinho = bola(0.1, creme, 12); focinho.scale.set(1.2, 0.8, 0.9); focinho.position.set(0.14, -0.05, 0); cabeca.add(focinho);
  const nariz = bola(0.04, pele(0x2b1a12), 10); nariz.position.set(0.25, -0.02, 0); cabeca.add(nariz);
  const lingua = bola(0.04, pele(0xff7a9a), 8); lingua.scale.set(0.8, 1.4, 0.5); lingua.position.set(0.18, -0.14, -0.02); cabeca.add(lingua);
  for (const s of [-1, 1]) {
    const o = olho(0.05); o.position.set(0.1, 0.06, s * 0.1); o.rotation.y = s > 0 ? -Math.PI * 0.75 : -Math.PI * 0.25; cabeca.add(o);
  }
  const orelhas = [];
  for (const s of [-1, 1]) { const or = bola(0.08, escuro, 10); or.scale.set(0.6, 1.4, 0.4); or.position.set(-0.03, 0.02, s * 0.16); cabeca.add(or); orelhas.push(or); }
  const coleira = peca(new THREE.TorusGeometry(0.13, 0.025, 6, 16), pele(0xe5484d)); coleira.rotation.y = Math.PI / 2; coleira.position.set(0.25, 0.5, 0); corpoG.add(coleira);
  const plaquinha = bola(0.035, toon(0xffc531, { emissive: 0x553300 }), 8); plaquinha.position.set(0.3, 0.4, 0); corpoG.add(plaquinha);
  const rabo = new THREE.Group(); rabo.position.set(-0.36, 0.5, 0); corpoG.add(rabo);
  const r1 = peca(new THREE.CapsuleGeometry(0.035, 0.2, 4, 8), caramelo); r1.position.y = 0.1; r1.rotation.z = 0.5; rabo.add(r1);
  const patas = [];
  for (const [x, s] of [[0.2, -1], [0.2, 1], [-0.2, -1], [-0.2, 1]]) {
    const pata = new THREE.Group(); pata.position.set(x, 0.36, s * 0.1); corpoG.add(pata);
    const perna = peca(new THREE.CapsuleGeometry(0.05, 0.2, 4, 8), caramelo); perna.position.y = -0.17; pata.add(perna);
    const pe = bola(0.055, creme, 8); pe.position.set(0.02, -0.32, 0); pata.add(pe);
    patas.push(pata);
  }
  corpoG.scale.setScalar(1.3);
  const av = avisos(g, 1);
  g.userData.animar = (o, t) => {
    corpoG.rotation.y = o.dir > 0 ? Math.PI : 0; // faixa maior fica em −x
    const f = o.andando ? t * 16 : t * 3;
    patas.forEach((p, k) => { p.rotation.z = Math.sin(f + (k % 2 ? 0 : Math.PI) + (k > 1 ? Math.PI / 2 : 0)) * (o.andando ? 0.7 : 0.08); });
    rabo.rotation.x = Math.sin(t * 18) * 0.6;
    orelhas.forEach((or, k) => { or.rotation.x = Math.sin(f + k) * 0.3; });
    corpoG.position.y = o.andando ? Math.abs(Math.sin(f)) * 0.06 : 0;
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.25;
  };
  return { g, av, altura: 0.8 };
}

// ---------- Caranguejo andando de lado, com garras que abrem e fecham ----------
function caranguejo() {
  const g = new THREE.Group();
  const vermelho = pele(0xff6a3d); const claro = pele(0xffb08a);
  const corpo = bola(0.28, vermelho, 20); corpo.scale.set(1.25, 0.55, 0.9); corpo.position.y = 0.26; g.add(corpo);
  const barriga = bola(0.24, claro, 16); barriga.scale.set(1.15, 0.35, 0.8); barriga.position.set(0, 0.2, -0.04); g.add(barriga);
  for (const s of [-1, 1]) {
    const haste = cil(0.025, 0.025, 0.2, vermelho, 6); haste.position.set(s * 0.1, 0.46, -0.08); g.add(haste);
    const o = olho(0.075); o.position.set(s * 0.1, 0.58, -0.1); g.add(o);
    const bochecha = bola(0.04, pele(0xff8fb1), 8); bochecha.scale.z = 0.4; bochecha.position.set(s * 0.2, 0.28, -0.24); g.add(bochecha);
  }
  const boca = peca(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), pele(0x5a1a0a)); boca.rotation.z = Math.PI; boca.position.set(0, 0.29, -0.25); g.add(boca);
  const garras = [];
  for (const s of [-1, 1]) {
    const braco = new THREE.Group(); braco.position.set(s * 0.32, 0.3, -0.08); g.add(braco);
    const b = peca(new THREE.CapsuleGeometry(0.04, 0.16, 4, 8), vermelho); b.rotation.z = s * 0.9; b.position.set(s * 0.08, 0.06, 0); braco.add(b);
    const pinca = new THREE.Group(); pinca.position.set(s * 0.18, 0.18, 0); braco.add(pinca);
    const cima = bola(0.09, vermelho, 12); cima.scale.set(0.8, 1, 0.55); cima.position.y = 0.05; pinca.add(cima);
    const baixo = bola(0.06, claro, 10); baixo.scale.set(0.7, 0.9, 0.5); baixo.position.set(s * 0.03, -0.04, 0); pinca.add(baixo);
    garras.push({ braco, baixo, s });
  }
  const pernas = [];
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const p = new THREE.Group(); p.position.set(s * 0.26, 0.2, -0.05 + k * 0.1 - 0.05); g.add(p);
    const perna = peca(new THREE.CapsuleGeometry(0.025, 0.2, 4, 6), vermelho); perna.rotation.z = s * 1.0; perna.position.set(s * 0.08, -0.06, 0); p.add(perna);
    pernas.push({ p, s, k });
  }
  const av = avisos(g, 0.9);
  const tudo = new THREE.Group(); tudo.scale.setScalar(1.35);
  for (const filho of [...g.children]) if (filho !== av.placa && filho !== av.marca) tudo.add(filho);
  g.add(tudo);
  g.userData.animar = (o, t) => {
    for (const { p, s, k } of pernas) p.rotation.z = Math.sin(t * 20 + k * 2 + (s > 0 ? 1 : 0)) * 0.35;
    for (const { braco, baixo, s } of garras) { braco.rotation.z = Math.sin(t * 6) * 0.15 * s; baixo.rotation.z = (Math.sin(t * 12) > 0 ? 0.5 : 0) * s; }
    tudo.rotation.z = Math.sin(t * 20) * 0.04;
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.25;
  };
  return { g, av, altura: 0.7 };
}

// ---------- Bola de praia quicando, com sombra no chão que mostra a altura ----------
const texSombra = () => tex('sombra', 64, 64, (ctx) => {
  const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
});
function sombraChao(raio) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(raio * 2.4, raio * 2.4), new THREE.MeshBasicMaterial({ map: texSombra(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  s.rotation.x = -Math.PI / 2; s.position.y = 0.03;
  return s;
}
function bolaDePraia() {
  const g = new THREE.Group();
  const gomos = tex('bola-praia', 256, 128, (ctx, w, h) => {
    const cores = ['#ff4d5e', '#ffc21f', '#2f8fff', '#ffffff', '#35c46a', '#ff8a1f'];
    cores.forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect((k * w) / 6, 0, w / 6 + 1, h); });
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, 12); ctx.fillRect(0, h - 12, w, 12);
  });
  const b = bola(0.42, toon(0xffffff, { map: gomos }), 28); b.castShadow = true; g.add(b);
  const tampa = bola(0.09, toon(0xffffff), 10); tampa.position.y = 0.4; b.add(tampa);
  const sombra = sombraChao(0.42); g.add(sombra);
  const av = avisos(g, 0.9);
  g.userData.animar = (o, t) => {
    b.position.set(0, o.h, o.raio);
    b.rotation.x = -(o.nasceu - o.z) / 0.42; b.rotation.z = t * 1.5;
    // amassa um pouquinho quando encosta no chão
    const encosta = Math.max(0, 1 - (o.h - o.raio) / 0.12);
    b.scale.set(1 + encosta * 0.12, 1 - encosta * 0.15, 1 + encosta * 0.12);
    sombra.position.z = o.raio; const k = 1 / (1 + (o.h - o.raio) * 0.6); sombra.scale.setScalar(k); sombra.material.opacity = 0.4 + k * 0.6;
    av.placa.position.y = o.h + 1.0;
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = o.raio;
  };
  return { g, av, altura: 0.9 };
}

// ---------- Tronco rolando de um lado para o outro ----------
function tronco() {
  const g = new THREE.Group();
  const casca = tex('casca', 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) { ctx.strokeStyle = k % 2 ? '#6e4426' : '#a06c40'; ctx.lineWidth = 3 + (k % 3); const y = (k * 37) % h; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x / 20 + k) * 4); ctx.stroke(); }
  });
  const aneis = tex('aneis', 128, 128, (ctx) => {
    ctx.fillStyle = '#e9c08a'; ctx.beginPath(); ctx.arc(64, 64, 64, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c28a52'; ctx.lineWidth = 4; for (const r of [14, 28, 42, 54]) { ctx.beginPath(); ctx.arc(64, 64, r, 0, 7); ctx.stroke(); }
  });
  const rolo = new THREE.Group(); rolo.position.set(0, 0.3, 0.9); g.add(rolo);
  const corpo = peca(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 18), [toon(0xffffff, { map: casca }), toon(0xffffff, { map: aneis }), toon(0xffffff, { map: aneis })]);
  corpo.rotation.x = Math.PI / 2; rolo.add(corpo);
  const musgo = bola(0.14, toon(0x4f9a45), 8); musgo.scale.set(1, 0.5, 2); musgo.position.set(0, 0.26, 0.3); rolo.add(musgo);
  const galhinho = cil(0.03, 0.04, 0.3, toon(0x6e4426), 6); galhinho.position.set(0.22, 0.2, -0.4); galhinho.rotation.z = -0.8; rolo.add(galhinho);
  const folha = bola(0.07, toon(0x5ab84a), 6); folha.scale.set(1, 0.4, 1.4); folha.position.set(0.36, 0.32, -0.4); rolo.add(folha);
  const sombra = sombraChao(0.5); sombra.scale.set(1, 2.2, 1); sombra.position.z = 0.9; g.add(sombra);
  const av = avisos(g, 0.75);
  g.userData.animar = (o) => {
    rolo.rotation.z = xDe(o.faixa) / 0.3; // rola de verdade: gira o tanto que andou de lado
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.9;
  };
  return { g, av, altura: 0.75 };
}

// ---------- Galho balançando: um cipó pendurado num tronco que atravessa a estrada ----------
function galho(o) {
  const g = new THREE.Group();
  const madeira = toon(0x6e4426); const folhas = [0x3fae5a, 0x2f9a4a, 0x5ab84a]; const vivas = [0x9be15d, 0xc6f06a, 0x7fd14a];
  const meio = o.comp / 2;
  // tronco grosso lá em cima, de um lado ao outro da estrada (fica parado no lugar do mundo)
  const base = -xDe(o.destino);
  const viga = cil(0.18, 0.2, LARG_RUA + 1.6, madeira, 10); viga.rotation.z = Math.PI / 2; viga.position.set(base, GALHO.pivo + 0.15, meio); g.add(viga);
  for (const s of [-1, 1]) {
    const arvore = cil(0.22, 0.3, GALHO.pivo + 0.8, madeira, 10); arvore.position.set(base + s * (LARG_RUA / 2 + 0.6), (GALHO.pivo + 0.8) / 2, meio); g.add(arvore);
    const copa = peca(new THREE.IcosahedronGeometry(0.9, 1), toon(0x3fae5a, { flatShading: true })); copa.position.set(base + s * (LARG_RUA / 2 + 0.6), GALHO.pivo + 0.9, meio); g.add(copa);
  }
  for (let k = 0; k < 6; k++) { const f = peca(new THREE.IcosahedronGeometry(0.28, 0), toon(folhas[k % 3], { flatShading: true })); f.position.set(base + (k - 2.5) * 0.9, GALHO.pivo + 0.35, meio); g.add(f); }
  // o pêndulo
  const pendulo = new THREE.Group(); pendulo.position.set(0, GALHO.pivo, meio); g.add(pendulo);
  const cipo = cil(0.04, 0.04, GALHO.haste, toon(0x7a5a2a), 6); cipo.position.y = -GALHO.haste / 2; pendulo.add(cipo);
  const ponta = new THREE.Group(); ponta.position.y = -GALHO.haste; pendulo.add(ponta);
  const graveto = cil(0.05, 0.06, 0.9, madeira, 8); graveto.rotation.z = Math.PI / 2; ponta.add(graveto);
  // folhas verde-claras com flores e frutinhas, bem diferente do mato do fundo
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2;
    const f = peca(new THREE.IcosahedronGeometry(0.2 + (k % 3) * 0.04, 0), toon(vivas[k % 3], { flatShading: true }));
    f.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.2 - 0.02, Math.sin(a * 2) * 0.14); ponta.add(f);
  }
  for (const [x, y, c] of [[-0.3, 0.1, 0xff6f91], [0.28, 0.14, 0xffd21f], [0.05, -0.22, 0xff6f91], [-0.12, -0.18, 0xffd21f]]) {
    const flor = bola(0.07, toon(c, { emissive: c, emissiveIntensity: 0.25 }), 8); flor.position.set(x, y, -0.2); ponta.add(flor);
  }
  for (const x of [-0.2, 0.2]) { const fruta = bola(0.07, toon(0xff3b3b), 8); fruta.position.set(x, -0.26, -0.05); ponta.add(fruta); }
  // passarinho no galho, balançando junto
  const ave = new THREE.Group(); ave.position.set(0.05, 0.22, 0); ponta.add(ave);
  const corpoAve = bola(0.09, pele(0x56b7ff), 12); corpoAve.scale.set(1, 0.9, 1.2); ave.add(corpoAve);
  const bico = peca(new THREE.ConeGeometry(0.03, 0.08, 6), pele(0xffb020)); bico.rotation.x = -Math.PI / 2; bico.position.set(0, 0.02, -0.12); ave.add(bico);
  for (const s of [-1, 1]) { const ol = olho(0.025); ol.position.set(s * 0.045, 0.05, -0.07); ave.add(ol); }
  const sombra = sombraChao(0.45); sombra.position.z = meio; g.add(sombra);
  const av = avisos(g, GALHO.pivo + 0.2);
  av.marca.position.z = meio;
  g.userData.animar = (ob, t) => {
    pendulo.rotation.z = ob.angulo;
    ponta.rotation.z = -ob.angulo * 0.4;
    const dx = GALHO.haste * Math.sin(ob.angulo);
    sombra.position.x = dx; sombra.scale.setScalar(0.8 + 0.4 * Math.cos(ob.angulo));
    ave.rotation.y = Math.sin(t * 3) * 0.4;
  };
  return { g, av, altura: GALHO.pivo + 0.2 };
}

// ---------- Bola de neve rolando e crescendo ----------
function bolaDeNeve() {
  const g = new THREE.Group();
  const neve = tex('neve-bola', 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f7fbff'; ctx.fillRect(0, 0, w, h);
    let s = 5; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 220; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(150,190,230,.35)' : 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 7, 0, 7); ctx.fill(); }
  });
  const rolo = new THREE.Group(); g.add(rolo);
  const b = peca(new THREE.IcosahedronGeometry(1, 3), toon(0xffffff, { map: neve, flatShading: true })); rolo.add(b);
  // coisinhas que ela foi pegando pelo caminho: um graveto, uma luva e uma pinha
  const graveto = cil(0.03, 0.05, 0.7, toon(0x6e4426), 6); graveto.position.set(0.6, 0.6, 0); graveto.rotation.z = -0.8; rolo.add(graveto);
  const luva = bola(0.16, toon(0xe5484d), 10); luva.scale.set(1, 1.3, 0.6); luva.position.set(-0.55, -0.2, 0.75); rolo.add(luva);
  const pinha = peca(new THREE.ConeGeometry(0.12, 0.26, 8), toon(0x8a5a34, { flatShading: true })); pinha.position.set(0, -0.95, -0.2); rolo.add(pinha);
  const sombra = sombraChao(1); g.add(sombra);
  // neve espirrando atrás
  const espirro = [];
  for (let k = 0; k < 6; k++) { const p = bola(0.08, toon(0xffffff), 6); g.add(p); espirro.push(p); }
  const av = avisos(g, 2);
  const esticar = faixaComprida(av);
  g.userData.animar = (o, t) => {
    const r = o.raio;
    rolo.scale.setScalar(r); rolo.position.set(0, r, r);
    rolo.rotation.x = -(o.nasceu - o.z) / Math.max(0.3, r);
    sombra.scale.setScalar(r); sombra.position.z = r;
    espirro.forEach((p, k) => {
      const f = (t * 3 + k / 6) % 1;
      p.position.set((k % 2 ? 1 : -1) * r * (0.5 + f * 0.6), 0.1 + Math.sin(f * Math.PI) * 0.4 * r, r * 2 + f * 0.8);
      p.scale.setScalar(1 - f);
    });
    av.placa.position.y = r * 2 + 0.7;
    esticar(o);
  };
  return { g, av, altura: 2 };
}

// ---------- Pinguim deslizando de barriga ----------
function pinguim() {
  const g = new THREE.Group();
  const corpoG = new THREE.Group(); corpoG.position.y = 0.34; corpoG.scale.setScalar(1.4); g.add(corpoG);
  const preto = pele(0x26303f); const branco = pele(0xffffff); const laranja = pele(0xffa020);
  const corpo = bola(0.26, preto, 20); corpo.scale.set(1, 0.9, 1.7); corpoG.add(corpo);
  const barriga = bola(0.24, branco, 18); barriga.scale.set(0.9, 0.8, 1.6); barriga.position.y = -0.06; corpoG.add(barriga);
  const cabeca = new THREE.Group(); cabeca.position.set(0, 0.12, -0.42); corpoG.add(cabeca);
  cabeca.add(bola(0.2, preto, 18));
  const rosto = bola(0.17, branco, 16); rosto.scale.set(1, 0.85, 0.6); rosto.position.set(0, -0.02, -0.1); cabeca.add(rosto);
  for (const s of [-1, 1]) {
    const o = olho(0.05); o.position.set(s * 0.07, 0.04, -0.17); cabeca.add(o);
    const bochecha = bola(0.03, pele(0xff8fb1), 8); bochecha.scale.z = 0.4; bochecha.position.set(s * 0.12, -0.05, -0.15); cabeca.add(bochecha);
  }
  const bico = peca(new THREE.ConeGeometry(0.05, 0.13, 8), laranja); bico.rotation.x = -Math.PI / 2; bico.position.set(0, -0.03, -0.25); cabeca.add(bico);
  const gorro = peca(new THREE.SphereGeometry(0.205, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), pele(0xe5484d)); gorro.position.y = 0.03; cabeca.add(gorro);
  const pompom = bola(0.06, branco, 8); pompom.position.y = 0.22; cabeca.add(pompom);
  const asas = [];
  for (const s of [-1, 1]) {
    const asa = new THREE.Group(); asa.position.set(s * 0.24, 0.02, -0.05); corpoG.add(asa);
    const a = bola(0.1, preto, 10); a.scale.set(1.8, 0.3, 0.9); a.position.x = s * 0.14; asa.add(a);
    asas.push({ asa, s });
  }
  const pes = [];
  for (const s of [-1, 1]) { const p = bola(0.07, laranja, 8); p.scale.set(0.8, 0.4, 1.4); p.position.set(s * 0.1, -0.1, 0.46); corpoG.add(p); pes.push(p); }
  const rastro = [];
  for (let k = 0; k < 5; k++) { const p = bola(0.06, toon(0xffffff), 6); g.add(p); rastro.push(p); }
  const av = avisos(g, 0.95);
  g.userData.animar = (o, t) => {
    const dir = Math.sign(o.destino - o.origem);
    corpoG.rotation.y = o.trocando ? dir * 0.5 : Math.sin(t * 2) * 0.08;
    corpoG.rotation.z = Math.sin(t * 6) * 0.06;
    for (const { asa, s } of asas) asa.rotation.z = s * (0.3 + Math.sin(t * 14) * 0.35);
    pes.forEach((p, k) => { p.position.y = -0.1 + Math.sin(t * 16 + k * Math.PI) * 0.04; });
    rastro.forEach((p, k) => { const f = (t * 2.5 + k / 5) % 1; p.position.set((k % 2 ? 1 : -1) * 0.2 * (1 + f), 0.06 + Math.sin(f * Math.PI) * 0.15, -0.55 - f * 0.4); p.scale.setScalar(1 - f); });
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.45;
  };
  return { g, av, altura: 0.75 };
}

const FABRICAS = { onibus, bicicleta, cachorro, caranguejo, bola: bolaDePraia, tronco, galho, boladeneve: bolaDeNeve, pinguim };

// Monta o obstáculo em movimento. Quem chama posiciona o grupo em (xDe(o.faixa), 0, o.z) e
// chama userData.animar(o, t) a cada quadro.
export function criarMovel(o) {
  const { g, av } = FABRICAS[o.tipo](o);
  const animar = g.userData.animar;
  g.userData.animar = (ob, t) => {
    animar(ob, t);
    // o aviso pisca enquanto ele ainda não chegou
    const longe = ob.z > 1.5;
    av.placa.visible = longe;
    av.marca.visible = longe;
    const pulso = 0.5 + 0.5 * Math.sin(t * 10);
    av.placa.material.opacity = 0.65 + 0.35 * pulso;
    const k = 0.85 + 0.15 * pulso; av.placa.scale.set(k, k, 1);
    av.marca.material.opacity = 0.5 + 0.4 * pulso;
  };
  return g;
}
