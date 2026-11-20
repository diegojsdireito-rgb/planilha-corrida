// Peças de anatomia para os personagens humanos: cabeça esculpida, olhos com íris e pálpebras,
// mãos com dedos, tronco com forma de corpo, cachos de cabelo e tênis.
// Tudo é montado com geometria calculada na hora (sem arquivos de modelo).
import { THREE, textura, sombrear } from './base.js';

const sino = (v, centro, largura) => Math.exp(-(((v - centro) / largura) ** 2));
export const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- cabeça ----------
// Parte de uma esfera e esculpe: maxilar que afina até o queixo, queixo para a frente, órbitas
// dos olhos fundas, arcada das sobrancelhas, maçãs do rosto, dorso do nariz e volume da boca.
// Ponto da cabeça esculpida na direção (nx, ny, nz).
export function pontoCabeca(nx, ny, nz, R, alvo = new THREE.Vector3()) {
  const frente = suave(-0.15, 0.45, nz);
  let x = nx * R * 0.9; let y = ny * R * 1.06; let z = nz * R * (nz < 0 ? 1.06 : 0.96);
  if (ny < 0) {
    const k = suave(0, 1, -ny);
    x *= 1 - 0.3 * k ** 1.5; // maxilar
    if (nz < 0) z *= 1 - 0.16 * k; // nuca entra no pescoço
  }
  z += R * 0.17 * sino(ny, -0.8, 0.3) * frente * sino(nx, 0, 0.5); // queixo
  let d = 0;
  d += 0.03 * sino(ny, 0.27, 0.11) * frente * (1 - 0.5 * sino(nx, 0, 0.12)); // arcada
  d -= 0.085 * sino(Math.abs(nx), 0.35, 0.16) * sino(ny, 0.02, 0.12) * frente; // órbitas
  d += 0.05 * sino(Math.abs(nx), 0.52, 0.2) * sino(ny, -0.26, 0.2) * frente; // maçãs
  d += 0.045 * sino(nx, 0, 0.26) * sino(ny, -0.52, 0.15) * frente; // boca
  d += sino(nx, 0, 0.075) * frente * (0.03 + 0.1 * suave(0.12, -0.26, ny)) * suave(0.24, 0.12, ny) * suave(-0.38, -0.29, ny); // dorso do nariz
  return alvo.set(x + nx * R * d, Math.max(y + ny * R * d, -R), z + nz * R * d);
}
export function geoCabeca(R = 0.142, seg = 60) {
  const geo = new THREE.SphereGeometry(R, seg, Math.round(seg * 0.75));
  const pos = geo.attributes.position; const v = new THREE.Vector3(); const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    pontoCabeca(v.x, v.y, v.z, R, p);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Dá a profundidade (z) da superfície da frente de uma malha no ponto (x, y): serve para
// assentar olhos, nariz e boca exatamente sobre o rosto esculpido.
export function superficieDe(geo) {
  const malha = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
  malha.updateMatrixWorld(true);
  const raio = new THREE.Raycaster();
  const origem = new THREE.Vector3(); const dir = new THREE.Vector3(0, 0, -1);
  return (x, y) => {
    raio.set(origem.set(x, y, 1), dir);
    return raio.intersectObject(malha, false)[0]?.point.z ?? 0;
  };
}

// Pintura do rosto (multiplica a cor da pele): bochechas coradas e sardas no nariz.
export function texRosto() {
  return textura(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    for (const u of [0.168, 0.332]) {
      const g = ctx.createRadialGradient(u * w, 0.6 * h, 0, u * w, 0.6 * h, 0.05 * w);
      g.addColorStop(0, 'rgba(255,120,125,.3)'); g.addColorStop(1, 'rgba(255,120,125,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  });
}

// ---------- olhos ----------
// Íris pintada em coordenadas polares: o alto da imagem é o centro (pupila) e a base é a borda.
export function texIris(cor = '#6b4423') {
  return textura(128, 64, (ctx, w, h) => {
    const c = new THREE.Color(cor);
    const tom = (t) => `#${c.clone().lerp(new THREE.Color(t > 0 ? 0xffd9a0 : 0x000000), Math.abs(t)).getHexString()}`;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#060303'); g.addColorStop(0.36, '#060303'); g.addColorStop(0.4, tom(0.45)); g.addColorStop(0.62, tom(0.12)); g.addColorStop(0.86, tom(-0.25)); g.addColorStop(0.93, tom(-0.75)); g.addColorStop(1, tom(-0.85));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 90; k++) { // fibras da íris
      ctx.strokeStyle = k % 2 ? 'rgba(255,225,170,.16)' : 'rgba(30,12,4,.2)';
      ctx.lineWidth = 0.6 + (k % 3) * 0.4;
      const x = (k * 37) % w;
      ctx.beginPath(); ctx.moveTo(x, h * 0.4); ctx.lineTo(x + ((k * 13) % 5) - 2, h * 0.92); ctx.stroke();
    }
  });
}

// Olho completo: globo, íris que gira para olhar, brilho e pálpebras (a de cima fecha para piscar).
export function criarOlho(lado, { r = 0.025, matBranco, matIris, matPele, matCilio, cilios = true, grande = false }) {
  const olho = new THREE.Group();
  olho.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), matBranco));
  const mira = new THREE.Group(); olho.add(mira);
  const iris = new THREE.Mesh(new THREE.SphereGeometry(r * 1.012, 28, 8, 0, Math.PI * 2, 0, grande ? 0.74 : 0.56), matIris);
  iris.rotation.x = Math.PI / 2; mira.add(iris);
  const brilho = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  brilho.position.set(r * 0.26, r * 0.3, r * 0.94); if (grande) brilho.scale.setScalar(1.5); olho.add(brilho);
  if (grande) { const b2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.09, 8, 6), brilho.material); b2.position.set(-r * 0.3, -r * 0.28, r * 0.93); brilho.add(b2); b2.position.sub(brilho.position).divideScalar(1.5); }
  const RL = r * 1.075;
  const sup = new THREE.Mesh(new THREE.SphereGeometry(RL, 24, 10, 0, Math.PI * 2, 0, 1.0), matPele);
  const aberta = grande ? -0.4 : PALPEBRA_ABERTA; // olhos de desenho ficam bem abertos
  sup.rotation.x = aberta; olho.add(sup);
  if (cilios) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(RL * Math.sin(1.0), r * (grande ? 0.13 : 0.075), 5, 20, Math.PI * 0.9), matCilio);
    c.rotation.set(Math.PI / 2, 0, 0); c.rotation.z = Math.PI * 0.05 + (lado > 0 ? 0 : 0); c.position.y = RL * Math.cos(1.0); sup.add(c);
    // cílios do canto de fora, mais compridos
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(new THREE.ConeGeometry(r * 0.05, r * 0.32, 4), matCilio);
      const a = Math.PI / 2 - lado * (0.75 + k * 0.28);
      p.position.set(Math.cos(a) * RL * Math.sin(1.0) * 1.05, RL * Math.cos(1.0) + r * 0.04, Math.sin(a) * RL * Math.sin(1.0) * 1.05);
      p.rotation.set(Math.PI / 2 - 0.5, 0, -lado * (0.5 + k * 0.25)); sup.add(p);
    }
  }
  const inf = new THREE.Mesh(new THREE.SphereGeometry(RL, 24, 8, 0, Math.PI * 2, Math.PI - (grande ? 0.78 : 1.0), grande ? 0.78 : 1.0), matPele);
  olho.add(inf);
  return { olho, mira, brilho, sup, aberta };
}
export const PALPEBRA_ABERTA = -0.06;
export const PALPEBRA_FECHADA = 1.2;

// ---------- tubos que afinam (lábios, sobrancelhas, cachos) ----------
export function tuboAfinado(curva, segmentos, raio, lados = 6, achatar = 1) {
  const geo = new THREE.TubeGeometry(curva, segmentos, 1, lados, false);
  const pos = geo.attributes.position; const c = new THREE.Vector3(); const v = new THREE.Vector3();
  for (let j = 0; j <= segmentos; j++) {
    curva.getPointAt(j / segmentos, c);
    const rr = raio(j / segmentos);
    for (let k = 0; k <= lados; k++) {
      const i = j * (lados + 1) + k;
      v.fromBufferAttribute(pos, i).sub(c).multiplyScalar(rr);
      pos.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z * achatar);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------- cabelo ----------
// Linha do cabelo em função do ângulo em volta da cabeça (0 = frente): alta na testa, desce nas
// têmporas, passa na frente da orelha e vai até a nuca.
function linhaDoCabelo(az) {
  const a = Math.abs(az);
  if (a < 0.95) return 0.66 - 0.2 * (a / 0.95) ** 2 + 0.05 * Math.cos(az * 5);
  if (a < 1.3) return 0.46 - 0.6 * suave(0.95, 1.3, a);
  return -0.14 - 0.5 * suave(1.3, 1.75, a);
}
// Casca do cabelo colada na cabeça. A malha vai do topo até a linha do cabelo em cada direção,
// então a borda acompanha a linha certinho (sem degraus); sulcos imitam as mechas penteadas.
export function geoCabelo(R = 0.142, folga = 1.05, colunas = 72, linhas = 18) {
  const pos = []; const uv = []; const ind = []; const p = new THREE.Vector3();
  for (let c = 0; c <= colunas; c++) {
    const az = (c / colunas) * Math.PI * 2 - Math.PI;
    const tetaFim = Math.acos(Math.max(-0.95, Math.min(0.95, linhaDoCabelo(az))));
    for (let l = 0; l <= linhas; l++) {
      const t = l / linhas; const teta = t * tetaFim;
      const ny = Math.cos(teta); const s = Math.sin(teta);
      const nx = Math.sin(az) * s; const nz = Math.cos(az) * s;
      pontoCabeca(nx, ny, nz, R, p);
      const sulco = 1 + 0.018 * Math.sin(c * 2.1 + Math.sin(t * 7) * 2) * suave(0.05, 0.3, t);
      const volume = folga + 0.03 * suave(0.2, -0.5, ny) * (nz < 0.2 ? 1 : 0.4) - (l === linhas ? 0.025 : 0); // a borda encosta na pele
      p.multiplyScalar(volume * sulco);
      pos.push(p.x, p.y, p.z); uv.push(c / colunas, 1 - t);
    }
  }
  const L = linhas + 1;
  for (let c = 0; c < colunas; c++) for (let l = 0; l < linhas; l++) { const i = c * L + l; ind.push(i, i + 1, i + L, i + 1, i + L + 1, i + L); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ind); geo.computeVertexNormals();
  return geo;
}

// Um cacho: nasce no couro cabeludo, contorna a cabeça e cai em espiral, mais solto na ponta.
// az = 0 é o meio da nuca; ±2 são os lados do rosto.
export function geoCacho({ az, y0 = 0.03, comp = 0.55, fase = 0, amp = 0.016, voltas = 3.2, raio = 0.014, frente = false, R = 0.142, segmentos = 20 }) {
  const pts = [];
  const N = 22;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const y = y0 - t * comp;
    let r;
    if (y > -0.1) r = Math.sqrt(Math.max(0.0001, R * R - y * y * 0.85)) + 0.016 * suave(0, 0.12, t) - 0.004; // a raiz nasce debaixo da casca
    else { const d = -0.1 - y; r = frente ? 0.121 + Math.min(1, d / 0.09) * 0.045 + d * 0.03 : 0.121 + d * 0.1; }
    const kk = suave(0.1, 0.55, t);
    const w = t * voltas * Math.PI * 2 + fase;
    const a = az + (Math.sin(w) * amp * kk) / r;
    const rr = r + Math.cos(w) * amp * kk * 0.9 + kk * 0.012;
    pts.push(new THREE.Vector3(Math.sin(a) * rr, y, -Math.cos(a) * rr));
  }
  return tuboAfinado(new THREE.CatmullRomCurve3(pts), segmentos, (t) => raio * suave(0, 0.1, t) * (1.2 - 0.75 * t * t) + 0.0008, 5);
}

// ---------- tronco ----------
// Corpo por fatias: cada linha é [altura, meia-largura, meia-espessura, deslocamento em z, quadratura].
// u = 0 é a frente (como nas peças torneadas); v segue a função dada, para os tecidos assentarem.
export function geoCorpo(linhas, vDe, segmentos = 40, { tampa = true } = {}) {
  const pos = []; const uv = []; const ind = [];
  const interp = [];
  // refina as fatias com uma curva suave
  const cols = [0, 1, 2, 3, 4].map((c) => new THREE.CatmullRomCurve3(linhas.map((l, k) => new THREE.Vector3(l[c] ?? (c === 4 ? 2.3 : 0), k, 0)), false, 'centripetal'));
  const passos = (linhas.length - 1) * 4;
  for (let k = 0; k <= passos; k++) interp.push(cols.map((c) => c.getPoint(k / passos).x));
  for (const [y, a, b, dz, n] of interp) {
    for (let s = 0; s <= segmentos; s++) {
      const phi = (s / segmentos) * Math.PI * 2;
      const sx = Math.sin(phi); const cz = Math.cos(phi);
      const e = 2 / Math.max(2, n);
      pos.push(Math.sign(sx) * Math.abs(sx) ** e * a, y, Math.sign(cz) * Math.abs(cz) ** e * b + dz);
      uv.push(s / segmentos, vDe(y));
    }
  }
  const L = segmentos + 1;
  for (let k = 0; k < interp.length - 1; k++) for (let s = 0; s < segmentos; s++) {
    const p = k * L + s;
    ind.push(p, p + 1, p + L, p + 1, p + L + 1, p + L);
  }
  if (tampa) for (const k of [0, interp.length - 1]) { // fecha em cima e embaixo
    const c = pos.length / 3; pos.push(0, interp[k][0], interp[k][3]); uv.push(0.5, vDe(interp[k][0]));
    for (let s = 0; s < segmentos; s++) { const p = k * L + s; if (k === 0) ind.push(c, p + 1, p); else ind.push(c, p, p + 1); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ind);
  geo.computeVertexNormals();
  return geo;
}
// v por trechos: lista de [altura, v] em ordem crescente de altura.
export const vPorTrechos = (pares) => (y) => {
  if (y <= pares[0][0]) return pares[0][1];
  for (let k = 1; k < pares.length; k++) if (y <= pares[k][0]) { const [y0, v0] = pares[k - 1]; const [y1, v1] = pares[k]; return v0 + ((y - y0) / (y1 - y0)) * (v1 - v0); }
  return pares[pares.length - 1][1];
};

// ---------- mão ----------
// Palma, quatro dedos de duas falanges levemente fechados e polegar. O polegar fica do lado do corpo.
export function criarMao(lado, material, escala = 1) {
  const mao = new THREE.Group();
  const p = (geo) => sombrear(new THREE.Mesh(geo, material));
  const palma = p(new THREE.SphereGeometry(0.03, 16, 12)); palma.scale.set(0.98, 1.08, 0.44); palma.position.y = -0.014; mao.add(palma);
  const dorso = p(new THREE.SphereGeometry(0.024, 12, 10)); dorso.scale.set(1.05, 0.9, 0.4); dorso.position.set(0, -0.006, -0.004); mao.add(dorso);
  const dedos = [[-0.0195, 0.03, 0.0064], [-0.0065, 0.035, 0.0068], [0.0065, 0.033, 0.0066], [0.019, 0.026, 0.0058]];
  dedos.forEach(([x, comp, r], k) => {
    const base = new THREE.Group(); base.position.set(-lado * x, -0.04 + Math.abs(x) * 0.18, 0.001); base.rotation.set(0.3 + k * 0.05, 0, -lado * x * 4); mao.add(base);
    const f1 = p(new THREE.CapsuleGeometry(r, comp * 0.5, 4, 8)); f1.position.y = -comp * 0.28; base.add(f1);
    const junta = new THREE.Group(); junta.position.y = -comp * 0.56; junta.rotation.x = 0.5; base.add(junta);
    const f2 = p(new THREE.CapsuleGeometry(r * 0.9, comp * 0.42, 4, 8)); f2.position.y = -comp * 0.24; junta.add(f2);
  });
  const baseP = new THREE.Group(); baseP.position.set(-lado * 0.024, -0.004, 0.008); baseP.rotation.set(0.35, 0, -lado * 0.75); mao.add(baseP);
  const p1 = p(new THREE.CapsuleGeometry(0.0078, 0.018, 4, 8)); p1.position.y = -0.012; baseP.add(p1);
  const jp = new THREE.Group(); jp.position.y = -0.024; jp.rotation.z = lado * 0.35; baseP.add(jp);
  const p2 = p(new THREE.CapsuleGeometry(0.007, 0.014, 4, 8)); p2.position.y = -0.01; jp.add(p2);
  mao.traverse((x) => { if (x.isMesh && x !== palma) x.castShadow = false; });
  mao.scale.setScalar(escala);
  return mao;
}

// ---------- tênis ----------
// Solado com formato de pé, entressola, cabedal que sobe até o tornozelo, biqueira, língua,
// cadarço cruzado, faixa lateral e puxador no calcanhar. Frente do pé = +z.
export function criarTenis({ cabedal, sola, detalhe, cadarco, borracha }) {
  const t = new THREE.Group();
  const p = (geo, m) => sombrear(new THREE.Mesh(geo, m));
  const pegada = new THREE.Shape();
  pegada.moveTo(0, -0.108);
  pegada.bezierCurveTo(0.034, -0.108, 0.034, -0.05, 0.031, -0.02);
  pegada.bezierCurveTo(0.03, 0.02, 0.046, 0.05, 0.04, 0.085);
  pegada.bezierCurveTo(0.036, 0.11, 0.014, 0.118, 0, 0.118);
  pegada.bezierCurveTo(-0.014, 0.118, -0.036, 0.11, -0.04, 0.085);
  pegada.bezierCurveTo(-0.046, 0.05, -0.03, 0.02, -0.031, -0.02);
  pegada.bezierCurveTo(-0.034, -0.05, -0.034, -0.108, 0, -0.108);
  const fatia = (alt, chanfro) => { const g = new THREE.ExtrudeGeometry(pegada, { depth: alt, bevelEnabled: true, bevelThickness: chanfro, bevelSize: chanfro, bevelSegments: 2, curveSegments: 10 }); g.rotateX(-Math.PI / 2); return g; };
  // a forma foi desenhada com a frente em +y; depois de deitar, a frente fica em -z: vira de novo
  const entressola = p(fatia(0.02, 0.004), sola); entressola.rotation.y = Math.PI; entressola.position.y = -0.05; t.add(entressola);
  const solado = p(fatia(0.006, 0.001), detalhe); solado.rotation.y = Math.PI; solado.position.y = -0.058; solado.scale.set(1.02, 1, 1.01); t.add(solado);
  // cabedal esculpido
  const geo = new THREE.SphereGeometry(1, 20, 14);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i); const ny = pos.getY(i); const nz = pos.getZ(i);
    const larg = 0.036 + 0.006 * sino(nz, 0.45, 0.4) - 0.004 * suave(-0.2, -1, nz);
    const topo = 0.02 + 0.062 * suave(0.5, -0.3, nz) - 0.012 * suave(-0.55, -1, nz);
    pos.setXYZ(i, nx * larg, ny > 0 ? ny * topo - 0.022 : ny * 0.012 - 0.022, nz * 0.108 + 0.006);
  }
  geo.computeVertexNormals();
  const corpoTenis = p(geo, cabedal); t.add(corpoTenis);
  // biqueira de borracha
  const bico = p(new THREE.SphereGeometry(0.036, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), borracha);
  bico.scale.set(1.02, 0.62, 0.8); bico.position.set(0, -0.026, 0.083); bico.rotation.x = 0.35; t.add(bico);
  // colarinho acolchoado e língua
  const colar = p(new THREE.TorusGeometry(0.034, 0.011, 8, 20), cabedal); colar.rotation.x = Math.PI / 2 + 0.12; colar.scale.set(1, 1.18, 1); colar.position.set(0, 0.036, -0.04); t.add(colar);
  const lingua = p(new THREE.SphereGeometry(0.024, 12, 10), cabedal); lingua.scale.set(0.95, 1.25, 0.42); lingua.position.set(0, 0.036, 0.004); lingua.rotation.x = -0.5; t.add(lingua);
  // cadarço cruzado subindo pelo peito do pé
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) {
      const c = p(new THREE.CapsuleGeometry(0.0032, 0.04, 3, 6), cadarco);
      c.position.set(0, 0.004 + k * 0.011, 0.058 - k * 0.019); c.rotation.set(-0.55, 0, Math.PI / 2 + s * 0.42); t.add(c);
    }
  }
  const laco = p(new THREE.TorusGeometry(0.009, 0.003, 5, 12), cadarco); laco.position.set(0.008, 0.045, -0.002); laco.rotation.set(-0.6, 0.5, 0); t.add(laco);
  const laco2 = laco.clone(); laco2.position.x = -0.008; laco2.rotation.y = -0.5; t.add(laco2);
  // faixas laterais
  for (const l of [-1, 1]) {
    for (const [dz, incl] of [[0.0, 0.5], [0.022, 0.5]]) {
      const f = p(new THREE.BoxGeometry(0.003, 0.05, 0.009), detalhe);
      f.position.set(l * 0.0375, -0.006, 0.015 + dz); f.rotation.set(incl, 0, -l * 0.12); t.add(f);
    }
  }
  const puxador = p(new THREE.BoxGeometry(0.02, 0.03, 0.006), detalhe); puxador.position.set(0, 0.03, -0.098); puxador.rotation.x = 0.12; t.add(puxador);
  t.traverse((x) => { if (x.isMesh && x !== entressola && x !== corpoTenis) x.castShadow = false; });
  return t;
}

// Junta várias geometrias numa só (uma chamada de desenho em vez de dezenas).
export function fundirGeos(geos) {
  const pos = []; const nor = [];
  for (const g0 of geos) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    g0.dispose(); if (g !== g0) g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return geo;
}
