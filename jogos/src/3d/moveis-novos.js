// Obstáculos em movimento dos cenários novos, em 3D: jujuba quicando e minhoca de goma atravessando
// (Terra dos Doces), carrinho de bate-bate trocando de faixa e bola de algodão-doce rolando na contramão
// (Parque de Diversões), bola de feno rolando de lado e camelo trocando de faixa (Deserto do Oásis),
// robozinho lunar trocando de faixa e meteorito quicando (Passeio na Lua). A posição vem da lógica
// (corrida.js) e o aviso é o mesmo dos outros: ⚠️ em cima e a marca laranja no chão da faixa de chegada.
import { THREE, xDe, toon, texBrilho } from './base.js';
import { peca, bola, cil, caixa, luz, pele, tex, avisos, faixaComprida, olho, sombraChao, texSeta } from './moveis.js';
import { camelo3d } from './cenarios-novos.js';

// carinha simpática desenhada numa textura (olhos grandes e sorriso), para colar na frente das coisas
function texCarinha(chave, fundo, { boca = '#5a1a2a', bochecha = '#ff8fb1' } = {}) {
  return tex(`carinha-${chave}`, 128, 96, (ctx, w, h) => {
    if (fundo) { ctx.fillStyle = fundo; ctx.fillRect(0, 0, w, h); }
    for (const x of [40, 88]) {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, 38, 17, 20, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1d1410'; ctx.beginPath(); ctx.ellipse(x + 2, 42, 10, 12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 6, 36, 4, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = boca; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(64, 58, 16, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = bochecha; for (const x of [22, 106]) { ctx.beginPath(); ctx.ellipse(x, 66, 9, 6, 0, 0, 7); ctx.fill(); }
  });
}

// ---------- Jujuba quicando: bala de goma brilhante, com açúcar e carinha ----------
const CORES_JUJUBA = [0xff3b5c, 0x35c46a, 0xff9a1f, 0x9b5cff, 0xffd21f];
function jujuba(o) {
  const g = new THREE.Group();
  const cor = CORES_JUJUBA[(o.destino + (o.modo === 'alto' ? 2 : 0) + (o.dir > 0 ? 1 : 0)) % CORES_JUJUBA.length];
  const corpo = new THREE.Group(); g.add(corpo);
  const goma = bola(o.raio, toon(cor, { emissive: cor, emissiveIntensity: 0.28 }), 26); goma.scale.set(1, 0.92, 1); corpo.add(goma);
  // gota de goma em cima, como as jujubas de verdade
  const bico = bola(o.raio * 0.45, toon(cor, { emissive: cor, emissiveIntensity: 0.28 }), 14); bico.position.y = o.raio * 0.78; corpo.add(bico);
  const brilho = new THREE.Mesh(new THREE.SphereGeometry(o.raio * 0.22, 10, 8), luz(0xffffff)); brilho.scale.set(1, 0.6, 0.4); brilho.position.set(-o.raio * 0.4, o.raio * 0.45, -o.raio * 0.72); corpo.add(brilho);
  for (let k = 0; k < 22; k++) {
    const a = k * 2.4; const b = Math.acos(1 - (2 * (k + 0.5)) / 22);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), luz(0xffffff));
    p.position.set(Math.cos(a) * Math.sin(b) * o.raio * 1.01, Math.cos(b) * o.raio * 0.93, Math.sin(a) * Math.sin(b) * o.raio * 1.01); p.rotation.set(k, k * 2, 0); corpo.add(p);
  }
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(o.raio * 1.2, o.raio * 0.9), new THREE.MeshBasicMaterial({ map: texCarinha('jujuba'), transparent: true, depthWrite: false }));
  cara.position.set(0, -o.raio * 0.05, -o.raio * 0.96); cara.rotation.y = Math.PI; corpo.add(cara);
  const sombra = sombraChao(o.raio); g.add(sombra);
  const av = avisos(g, 0.9);
  g.userData.animar = (ob, t) => {
    corpo.position.set(0, ob.h, ob.raio);
    corpo.rotation.z = Math.sin(t * 3) * 0.18;
    const encosta = Math.max(0, 1 - (ob.h - ob.raio) / 0.12);
    corpo.scale.set(1 + encosta * 0.18, 1 - encosta * 0.22, 1 + encosta * 0.18); // goma amassa mais
    sombra.position.z = ob.raio; const k = 1 / (1 + (ob.h - ob.raio) * 0.6); sombra.scale.setScalar(k); sombra.material.opacity = 0.4 + k * 0.6;
    av.placa.position.y = ob.h + 1.0;
    av.marca.position.x = xDe(ob.destino) - xDe(ob.faixa); av.marca.position.z = ob.raio;
  };
  return { g, av, altura: 0.9 };
}

// ---------- Minhoca de goma atravessando, se esticando e encolhendo ----------
function minhoca() {
  const g = new THREE.Group();
  const corpoG = new THREE.Group(); corpoG.position.z = 0.22; corpoG.scale.setScalar(1.2); g.add(corpoG); // o desenho olha para +x
  const cores = [0xff3b7a, 0xffd21f, 0x35c46a, 0x3fb6ff];
  const segs = [];
  const n = 7;
  for (let k = 0; k < n; k++) {
    const r = k === n - 1 ? 0.13 : 0.1 + Math.sin((k / (n - 1)) * Math.PI) * 0.02;
    const c = cores[k % cores.length];
    const s = bola(r, toon(c, { emissive: c, emissiveIntensity: 0.25 }), 14); corpoG.add(s);
    for (let j = 0; j < 4; j++) { const a = j * 1.6 + k; const p = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), luz(0xffffff)); p.position.set(Math.cos(a) * r * 0.7, r * 0.75, Math.sin(a) * r * 0.7); s.add(p); }
    segs.push({ s, k, r });
  }
  const cabeca = segs[n - 1].s;
  for (const z of [-1, 1]) { const ol = olho(0.05); ol.position.set(0.07, 0.07, z * 0.06); ol.rotation.y = z > 0 ? -Math.PI * 0.75 : -Math.PI * 0.25; cabeca.add(ol); }
  const boca = peca(new THREE.TorusGeometry(0.035, 0.01, 5, 10, Math.PI), pele(0x5a1a2a)); boca.rotation.set(0, Math.PI / 2, Math.PI); boca.position.set(0.125, -0.02, 0); cabeca.add(boca);
  const sombra = sombraChao(0.5); sombra.scale.set(1.2, 0.5, 1); sombra.position.z = 0.22; g.add(sombra);
  const av = avisos(g, 0.8);
  g.userData.animar = (o, t) => {
    corpoG.rotation.y = o.dir > 0 ? Math.PI : 0; // faixa maior fica em −x
    const f = o.andando ? t * 9 : t * 2;
    // anda como lagartinha: o meio sobe em arco e o corpo encolhe e estica
    const arco = 0.5 + 0.5 * Math.sin(f);
    const passo = 0.15 - arco * 0.04;
    segs.forEach(({ s, k, r }) => {
      const u = k / (n - 1);
      s.position.set((k - (n - 1) / 2) * passo, r + Math.sin(u * Math.PI) * arco * 0.2, Math.sin(f + k) * 0.015);
    });
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.25;
  };
  return { g, av, altura: 0.8 };
}

// ---------- Carrinho de bate-bate: baixinho, de para-choque de borracha, trocando de faixa ----------
const CORES_BATE = [[0x2f8fff, '#2f8fff'], [0xff4d5e, '#ff4d5e'], [0x35c46a, '#35c46a'], [0xffb020, '#ffb020']];
function batebate(o) {
  const g = new THREE.Group();
  const [cor, css] = CORES_BATE[(o.destino * 2 + o.origem) % CORES_BATE.length];
  const carro = new THREE.Group(); carro.position.z = 0.65; g.add(carro);
  const pintura = toon(cor, { emissive: cor, emissiveIntensity: 0.12 });
  const frente = toon(0xffffff, { map: texCarinha(`bate-${css}`, css, { boca: '#2b2118', bochecha: '#ffffff88' }) });
  const corpo = peca(new THREE.BoxGeometry(0.92, 0.3, 1.1), [pintura, pintura, pintura, pintura, pintura, frente]); corpo.position.y = 0.32; carro.add(corpo);
  const aba = caixa(0.96, 0.05, 1.14, toon(0xffffff)); aba.position.y = 0.49; carro.add(aba);
  const encosto = caixa(0.66, 0.36, 0.12, toon(0xffffff)); encosto.position.set(0, 0.66, 0.44); carro.add(encosto);
  const topoEnc = peca(new THREE.CylinderGeometry(0.06, 0.06, 0.66, 10), toon(0xffffff)); topoEnc.rotation.z = Math.PI / 2; topoEnc.position.set(0, 0.84, 0.44); carro.add(topoEnc);
  const assento = caixa(0.6, 0.06, 0.4, toon(0x2b2e38)); assento.position.set(0, 0.5, 0.22); carro.add(assento);
  const coluna = cil(0.025, 0.025, 0.22, toon(0x2b2e38), 6); coluna.position.set(0, 0.58, -0.22); coluna.rotation.x = 0.5; carro.add(coluna);
  const volante = peca(new THREE.TorusGeometry(0.11, 0.025, 6, 14), toon(0x2b2e38)); volante.position.set(0, 0.68, -0.16); volante.rotation.x = -1.0; carro.add(volante);
  // para-choque de borracha em volta
  const borracha = peca(new THREE.TorusGeometry(0.6, 0.1, 8, 28), toon(0x26282f)); borracha.rotation.x = Math.PI / 2; borracha.scale.set(0.85, 1.05, 1); borracha.position.y = 0.17; carro.add(borracha);
  for (const s of [-1, 1]) {
    const estrela = new THREE.Mesh(new THREE.CircleGeometry(0.12, 5), luz(0xffd21f)); estrela.position.set(s * 0.465, 0.32, 0.1); estrela.rotation.y = s * Math.PI / 2; carro.add(estrela);
    const farol = bola(0.06, luz(0xfff6c0), 10); farol.position.set(s * 0.3, 0.38, -0.56); carro.add(farol);
  }
  const setas = [];
  for (const s of [-1, 1]) { const p = bola(0.06, luz(0xff9a1f), 10); p.position.set(s * 0.42, 0.48, -0.5); carro.add(p); setas.push(p); }
  const seta = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSeta(), transparent: true, depthWrite: false, fog: false }));
  seta.scale.set(0.9, 0.9, 1); seta.position.set(0, 1.25, 0.5); seta.renderOrder = 3; g.add(seta);
  const fagulha = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0xfff1a0, transparent: true, depthWrite: false, fog: false })); fagulha.scale.set(0.5, 0.5, 1); fagulha.position.set(0, 0.7, 1.05); g.add(fagulha);
  const sombra = sombraChao(0.6); sombra.scale.set(1, 1.2, 1); sombra.position.z = 0.65; g.add(sombra);
  const av = avisos(g, 0.8);
  av.placa.position.y = 2.05;
  g.userData.animar = (ob, t) => {
    const dir = Math.sign(ob.destino - ob.origem); // faixa maior = −x no 3D
    const aceso = ob.pisca && Math.floor(t * 5) % 2 === 0;
    setas.forEach((p, k) => { p.visible = aceso && (k === 0 ? dir > 0 : dir < 0); });
    seta.visible = aceso; seta.material.rotation = dir > 0 ? 0 : Math.PI;
    carro.rotation.y = ob.trocando ? -dir * 0.45 : Math.sin(t * 3) * 0.12; // vai girando de leve, como no parque
    carro.position.y = Math.abs(Math.sin(t * 7)) * 0.03;
    fagulha.visible = Math.floor(t * 12) % 3 === 0;
    av.marca.position.x = xDe(ob.destino) - xDe(ob.faixa); av.marca.position.z = 0.65;
  };
  return { g, av, altura: 0.8 };
}

// ---------- Bola gigante de algodão-doce rolando na contramão ----------
function algodao(o) {
  const g = new THREE.Group();
  const r = o.raio;
  const rolo = new THREE.Group(); rolo.position.set(0, r, r); g.add(rolo);
  const geo = new THREE.IcosahedronGeometry(r, 3);
  { const p = geo.attributes.position; const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + 0.07 * Math.sin(v.x * 9) * Math.sin(v.y * 8 + 1) * Math.sin(v.z * 7 + 2); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); }
  const fofo = toon(0xff8fcf, { emissive: 0xff6fb5, emissiveIntensity: 0.25 });
  rolo.add(peca(geo, fofo));
  const tufos = [0xffb3e0, 0xc9a8ff, 0xffffff];
  for (let k = 0; k < 16; k++) {
    const a = k * 2.4; const b = Math.acos(1 - (2 * (k + 0.5)) / 16);
    const tufo = bola(r * (0.25 + (k % 3) * 0.05), toon(tufos[k % 3], { emissive: tufos[k % 3], emissiveIntensity: 0.2 }), 10);
    tufo.position.set(Math.cos(a) * Math.sin(b) * r * 0.92, Math.cos(b) * r * 0.92, Math.sin(a) * Math.sin(b) * r * 0.92); rolo.add(tufo);
  }
  // o palito de papel listrado aparecendo dos dois lados
  const listras = tex('palito-algodao', 64, 128, (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#3fb6ff'; for (let y = -32; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 24); ctx.lineTo(w, y + 36); ctx.lineTo(0, y + 12); ctx.fill(); } });
  const palito = cil(0.07, 0.07, r * 2.5, toon(0xffffff, { map: listras }), 10); palito.rotation.z = Math.PI / 2; rolo.add(palito);
  const sombra = sombraChao(r); g.add(sombra);
  const brilhos = [];
  for (let k = 0; k < 5; k++) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0xffffff, transparent: true, depthWrite: false, fog: false })); b.scale.set(0.25, 0.25, 1); g.add(b); brilhos.push(b); }
  const av = avisos(g, r * 2);
  const esticar = faixaComprida(av);
  g.userData.animar = (ob, t) => {
    rolo.rotation.x = -(ob.nasceu - ob.z) / r;
    sombra.scale.setScalar(1); sombra.position.z = r;
    brilhos.forEach((b, k) => { const a = t * 2 + k * 1.3; b.position.set(Math.cos(a) * r * 1.1, r + Math.sin(a * 1.3) * r, r + Math.sin(a) * r * 0.6 - 0.2); b.material.opacity = 0.5 + 0.5 * Math.sin(t * 6 + k); });
    av.placa.position.y = r * 2 + 0.7;
    esticar(ob);
  };
  return { g, av, altura: r * 2 };
}

// ---------- Bola de feno rolando de um lado para o outro ----------
function feno() {
  const g = new THREE.Group();
  const r = 0.32;
  const rolo = new THREE.Group(); rolo.position.set(0, r, 0.35); g.add(rolo);
  const galhos = [toon(0x6e4426), toon(0x8a5a2e), toon(0x9c6a35)];
  for (let k = 0; k < 14; k++) {
    const anel = peca(new THREE.TorusGeometry(r * (0.75 + (k % 3) * 0.12), 0.018, 4, 18), galhos[k % 3]);
    anel.rotation.set(k * 0.9, k * 1.7, k * 0.4); rolo.add(anel);
  }
  const miolo = bola(r * 0.6, toon(0x5e3a1e), 10); rolo.add(miolo);
  for (let k = 0; k < 6; k++) { const graveto = cil(0.012, 0.012, 0.25, galhos[k % 3], 4); graveto.position.set(Math.cos(k) * r * 0.9, Math.sin(k * 2) * r * 0.9, Math.sin(k) * r * 0.5); graveto.rotation.set(k, k * 2, k); rolo.add(graveto); }
  const sombra = sombraChao(0.4); sombra.position.z = 0.35; g.add(sombra);
  const poeira = [];
  for (let k = 0; k < 5; k++) { const p = bola(0.06, toon(0xe8c48a), 6); g.add(p); poeira.push(p); }
  const av = avisos(g, 0.75);
  g.userData.animar = (o, t) => {
    const x = xDe(o.faixa);
    rolo.rotation.z = x / r; // rola de verdade, como o tronco
    rolo.rotation.x = Math.sin(t * 2) * 0.3;
    rolo.position.y = r + Math.abs(Math.sin(x / 0.45)) * 0.08; // pulinhos de feno ao vento
    poeira.forEach((p, k) => { const f = (t * 2.5 + k / 5) % 1; p.position.set(o.dir * (0.25 + f * 0.5), 0.05 + Math.sin(f * Math.PI) * 0.18, 0.35 + (k - 2) * 0.08); p.scale.setScalar(1 - f); });
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.35;
  };
  return { g, av, altura: 0.75 };
}

// ---------- Camelo trocando de faixa, devagarinho ----------
function camelo() {
  const g = new THREE.Group();
  const c = camelo3d(); c.g.position.z = 0.8; g.add(c.g);
  const sombra = sombraChao(0.7); sombra.scale.set(0.7, 1.4, 1); sombra.position.z = 0.8; g.add(sombra);
  const av = avisos(g, 2.4);
  g.userData.animar = (o, t) => {
    const dir = Math.sign(o.destino - o.origem);
    c.andar(t * 6, 1);
    c.g.rotation.y = o.trocando ? -dir * 0.55 : 0; // vira para o lado da troca
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.8;
  };
  return { g, av, altura: 2.4 };
}

// ---------- Robozinho lunar: de esteira, olhões de luz e anteninha piscando ----------
function robo() {
  const g = new THREE.Group();
  const corpo = new THREE.Group(); corpo.position.z = 0.45; g.add(corpo);
  const branco = toon(0xf4f6fb); const laranja = toon(0xff8a1f); const escuro = toon(0x3a3f4c);
  const rodas = [];
  for (const s of [-1, 1]) {
    const esteira = caixa(0.16, 0.16, 0.66, escuro); esteira.position.set(s * 0.27, 0.08, 0); corpo.add(esteira);
    for (const dz of [-0.24, 0, 0.24]) { const roda = cil(0.065, 0.065, 0.17, toon(0xffd21f), 10); roda.rotation.z = Math.PI / 2; roda.position.set(s * 0.27, 0.08, dz); corpo.add(roda); rodas.push(roda); }
  }
  const tronco = caixa(0.44, 0.2, 0.5, branco); tronco.position.y = 0.25; corpo.add(tronco);
  const faixa = caixa(0.46, 0.05, 0.52, laranja); faixa.position.y = 0.2; corpo.add(faixa);
  const pescoco = cil(0.04, 0.04, 0.06, escuro, 8); pescoco.position.y = 0.38; corpo.add(pescoco);
  const cabeca = new THREE.Group(); cabeca.position.y = 0.46; corpo.add(cabeca);
  cabeca.add(caixa(0.36, 0.16, 0.2, branco));
  const olhos = [];
  for (const s of [-1, 1]) {
    const aro = cil(0.065, 0.065, 0.05, escuro, 16); aro.rotation.x = Math.PI / 2; aro.position.set(s * 0.09, 0, -0.1); cabeca.add(aro);
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), luz(0x5ae6ff)); l.position.set(s * 0.09, 0, -0.127); l.rotation.y = Math.PI; cabeca.add(l); olhos.push(l);
  }
  const antena = cil(0.01, 0.01, 0.14, escuro, 4); antena.position.set(0.12, 0.15, 0.05); cabeca.add(antena);
  const pisca = bola(0.035, luz(0xff3b3b), 8); pisca.position.set(0.12, 0.23, 0.05); cabeca.add(pisca);
  const painel = caixa(0.4, 0.02, 0.24, toon(0x1c3f8f)); painel.position.set(0, 0.37, 0.18); painel.rotation.x = 0.3; corpo.add(painel);
  const setas = [];
  for (const s of [-1, 1]) { const p = bola(0.045, luz(0xff9a1f), 8); p.position.set(s * 0.24, 0.3, -0.26); corpo.add(p); setas.push(p); }
  const seta = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSeta(), transparent: true, depthWrite: false, fog: false }));
  seta.scale.set(0.85, 0.85, 1); seta.position.set(0, 1.15, 0.45); seta.renderOrder = 3; g.add(seta);
  const sombra = sombraChao(0.45); sombra.position.z = 0.45; g.add(sombra);
  corpo.scale.setScalar(1.15);
  const av = avisos(g, 0.8);
  av.placa.position.y = 1.95;
  g.userData.animar = (o, t) => {
    const dir = Math.sign(o.destino - o.origem);
    const aceso = o.pisca && Math.floor(t * 5) % 2 === 0;
    setas.forEach((p, k) => { p.visible = aceso && (k === 0 ? dir > 0 : dir < 0); });
    seta.visible = aceso; seta.material.rotation = dir > 0 ? 0 : Math.PI;
    corpo.rotation.y = o.trocando ? -dir * 0.4 : 0;
    cabeca.rotation.y = o.pisca ? -dir * 0.35 : Math.sin(t * 1.5) * 0.3;
    const pisc = Math.floor(t * 1.3) % 4 === 0 && (t * 1.3) % 1 < 0.15; // pisca os olhos de vez em quando
    olhos.forEach((l) => { l.scale.y = pisc ? 0.15 : 1; });
    pisca.visible = Math.floor(t * 3) % 2 === 0;
    corpo.position.y = Math.abs(Math.sin(t * 10)) * 0.015;
    for (const r of rodas) r.rotation.x = t * 8;
    av.marca.position.x = xDe(o.destino) - xDe(o.faixa); av.marca.position.z = 0.45;
  };
  return { g, av, altura: 0.8 };
}

// ---------- Meteorito quicando devagar, soltando faíscas ----------
function meteorito(o) {
  const g = new THREE.Group();
  const r = o.raio;
  const pedra = new THREE.Group(); g.add(pedra);
  const geo = new THREE.DodecahedronGeometry(r, 1);
  { const p = geo.attributes.position; const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 11 + v.y * 7) * Math.cos(v.z * 9)); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); }
  pedra.add(peca(geo, toon(0x6a5548, { flatShading: true })));
  // rachaduras em brasa
  for (let k = 0; k < 9; k++) {
    const a = k * 2.4; const b = Math.acos(1 - (2 * (k + 0.5)) / 9);
    const brasa = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 8, 6), luz(k % 2 ? 0xff7a1f : 0xffc531)); brasa.scale.set(1, 0.4, 1);
    brasa.position.set(Math.cos(a) * Math.sin(b) * r * 0.97, Math.cos(b) * r * 0.97, Math.sin(a) * Math.sin(b) * r * 0.97); brasa.lookAt(0, 0, 0); pedra.add(brasa);
  }
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0xff9a3a, transparent: true, depthWrite: false, fog: false, opacity: 0.6 }));
  aura.scale.set(r * 3.4, r * 3.4, 1); g.add(aura);
  const rastro = [];
  for (let k = 0; k < 7; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: k % 2 ? 0xffc531 : 0xff6a1f, transparent: true, depthWrite: false, fog: false })); g.add(s); rastro.push(s); }
  const sombra = sombraChao(r); g.add(sombra);
  const poeira = [];
  for (let k = 0; k < 8; k++) { const p = bola(0.07, toon(0xc8ccd4), 6); g.add(p); poeira.push(p); }
  const av = avisos(g, 0.9);
  g.userData.animar = (ob, t) => {
    pedra.position.set(0, ob.h, ob.raio); aura.position.copy(pedra.position);
    pedra.rotation.set(t * 0.8, t * 0.5, 0);
    // o rastro fica para o lado de onde ele veio (a faixa de origem) e um pouco para cima
    rastro.forEach((s, k) => { const f = (k + 1) / rastro.length; s.position.set(-ob.dir * f * (Math.abs(ob.faixa - ob.destino) > 0.02 ? 0.9 : 0.25), ob.h + f * 0.45, ob.raio + f * 0.5); s.scale.setScalar(r * (1.5 - f)); s.material.opacity = 0.75 * (1 - f) * (0.7 + 0.3 * Math.sin(t * 20 + k)); });
    const encosta = Math.max(0, 1 - (ob.h - ob.raio) / 0.15);
    poeira.forEach((p, k) => { const a = (k / poeira.length) * Math.PI * 2; p.visible = encosta > 0.05; p.position.set(Math.cos(a) * r * (1 + (1 - encosta) * 0.6), 0.06, ob.raio + Math.sin(a) * r * (1 + (1 - encosta) * 0.6)); p.scale.setScalar(0.5 + encosta); });
    sombra.position.z = ob.raio; const k = 1 / (1 + (ob.h - ob.raio) * 0.6); sombra.scale.setScalar(k); sombra.material.opacity = 0.4 + k * 0.6;
    av.placa.position.y = ob.h + 1.0;
    av.marca.position.x = xDe(ob.destino) - xDe(ob.faixa); av.marca.position.z = ob.raio;
  };
  return { g, av, altura: 0.9 };
}

export const FABRICAS_NOVAS = { jujuba, minhoca, batebate, algodao, feno, camelo, robo, meteorito };
