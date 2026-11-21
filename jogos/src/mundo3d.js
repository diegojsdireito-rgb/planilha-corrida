// Corrida dos Cachinhos em 3D: liga a menina, o cenário escolhido e os objetos da pista.
// Usa as mesmas coordenadas da lógica (corrida.js): faixa 0..2, z = distância à frente dela, y = altura.
import { THREE, xDe, COMP_CENA, INICIO, textura, descartar } from './3d/base.js';
import { criarMenina, criarMochilaJato, criarNave } from './3d/menina.js';
import { texBrilho } from './3d/base.js';
import { montarCenario, criarObstaculo } from './3d/cenarios.js';
import { criarPerseguidor, quemPersegue } from './3d/perseguidores.js';
import { LONGE } from './corrida.js';
import { criarItem, temItem3D, recursosDosItens } from './3d/itens.js';

let GEO_MOEDA; let MAT_MOEDA;

function prepararComuns() {
  if (GEO_MOEDA) return;
  const texMoeda = textura(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(44, 40, 6, 64, 64, 64); g.addColorStop(0, '#fff6b8'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#e09a00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(64, 64, 64, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c98500'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(64, 64, 46, 0, 7); ctx.stroke();
    ctx.fillStyle = '#e8a400'; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const r = k % 2 ? 15 : 34; ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    ctx.fill();
  });
  GEO_MOEDA = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24);
  const ouro = { metalness: 0.25, roughness: 0.35, emissive: 0x6a4500, emissiveIntensity: 0.35 };
  MAT_MOEDA = [
    new THREE.MeshStandardMaterial({ color: 0xe0a000, ...ouro }),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: texMoeda, ...ouro }),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: texMoeda, ...ouro }),
  ];
}

const suave = (x) => x * x * (3 - 2 * x);
const COMUNS = () => new Set([GEO_MOEDA, ...MAT_MOEDA, ...recursosDosItens(), texBrilho()]);

function criarObjeto(o, tema) {
  if (o.tipo === 'moeda') {
    const g = new THREE.Group();
    const m = new THREE.Mesh(GEO_MOEDA, MAT_MOEDA);
    m.rotation.x = Math.PI / 2; m.castShadow = true;
    g.add(m);
    g.userData.gira = true;
    return g;
  }
  if (o.tipo === 'maleta') {
    // a mochila a jato aparece em 3D na pista, girando e brilhando
    const g = new THREE.Group();
    const { grupo, chamas } = criarMochilaJato();
    chamas.forEach((c) => { c.visible = false; });
    grupo.scale.setScalar(2.2);
    g.add(grupo);
    const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0x7fb2ff, transparent: true, depthWrite: false, opacity: 0.8 }));
    brilho.scale.set(0.9, 0.9, 1); g.add(brilho);
    g.userData.flutua = true;
    g.userData.gira = true;
    return g;
  }
  if (o.tipo === 'nave') {
    // um disco voador pequeno pairando na pista, com as luzes acesas
    const g = new THREE.Group();
    const { grupo, feixe } = criarNave();
    feixe.visible = false;
    grupo.scale.setScalar(0.45); grupo.rotation.x = 0.25;
    g.add(grupo);
    const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(), color: 0x7dffb5, transparent: true, depthWrite: false, opacity: 0.8 }));
    brilho.scale.set(1.0, 1.0, 1); g.add(brilho);
    g.userData.flutua = true;
    g.userData.gira = true;
    return g;
  }
  if (temItem3D(o.tipo)) return criarItem(o.tipo);
  return criarObstaculo(o, tema);
}

function ceuTextura([a, b, c]) {
  return textura(4, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(0.6, b); g.addColorStop(1, c);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

export function criarMundo(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  prepararComuns();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; // mantém as cores vivas
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const cena = new THREE.Scene();
  cena.fog = new THREE.Fog(0xcfe9ff, 38, LONGE + 18);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 220);
  const hemi = new THREE.HemisphereLight(0xdff1ff, 0x7a8a6a, 1.15);
  cena.add(hemi);
  const sol = new THREE.DirectionalLight(0xffffff, 1.9);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -7, right: 7, top: 22, bottom: -6, near: 1, far: 40 });
  sol.shadow.bias = -0.0005;
  sol.shadow.normalBias = 0.02;
  cena.add(sol, sol.target);
  // luz de recorte vinda da frente: contorna a menina e dá volume
  const recorte = new THREE.DirectionalLight(0xfff0e0, 0.6);
  cena.add(recorte, recorte.target);
  // luz de preenchimento vinda da câmera: ilumina as costas da menina sem sombra dura
  const preenche = new THREE.DirectionalLight(0xffffff, 0.9);
  cena.add(preenche, preenche.target);

  const menina = criarMenina();
  cena.add(menina.raiz);

  let cenario = null; let temaAtual = null;
  let perseguidor = null; let perseguidorId = null; let perX = 0;
  const objetos = new Map();
  let camX = 0; let camY = 2.4; let ultimoT = 0; let afastar = 0; let altoVoo = 0;

  function limparObjetos() {
    const manter = COMUNS();
    for (const m of objetos.values()) { cena.remove(m); descartar(m, manter); }
    objetos.clear();
  }

  function trocarCenario(id) {
    if (id === temaAtual) return;
    if (cenario) { cena.remove(cenario.grupo); descartar(cenario.grupo); }
    limparObjetos();
    temaAtual = id;
    cenario = montarCenario(id);
    cena.add(cenario.grupo);
    cena.background?.dispose?.();
    cena.background = ceuTextura(cenario.ceu);
    cena.fog.color.setHex(cenario.neblina);
    hemi.color.setHex(cenario.hemi[0]);
    hemi.groundColor.setHex(cenario.hemi[1]);
  }

  function redimensionar(w, h, dpr) {
    renderer.setPixelRatio(Math.min(2, dpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.7 ? 66 : 58;
    camera.updateProjectionMatrix();
  }

  function trocarPerseguidor(id) {
    if (id === perseguidorId) return;
    if (perseguidor) { cena.remove(perseguidor.raiz); descartar(perseguidor.raiz); }
    perseguidorId = id;
    perseguidor = criarPerseguidor(id);
    cena.add(perseguidor.raiz);
  }

  // vitrine: no saguão e na tela de fim ela fica de frente para a câmera, à esquerda da tela,
  // com a rua do cenário ao fundo ('vitrine', 'comemora' ou 'triste')
  // captura: segundos desde que quem persegue a alcançou; ela se vira para a tela, triste, e ele a segura
  function desenhar(s, t, visual, tema = 'cidade', escolhaFloresta = 'leao', vitrine = null, captura = null) {
    trocarCenario(tema);
    trocarPerseguidor(quemPersegue(tema, escolhaFloresta));
    const dt = Math.min(0.05, Math.max(0, t - ultimoT));
    ultimoT = t;
    const dist = s.dist;
    menina.vestir(visual.pele, visual.roupa, visual.estilo, visual.personagem);
    const kc = captura === null ? 0 : suave(Math.min(1, captura / 0.8)); // vira para a tela aos poucos
    menina.posar(s, t, vitrine ?? (captura !== null ? 'capturada' : null));
    if (vitrine) menina.raiz.rotation.set(0, Math.PI + (visual.palco === 'galeria' ? 0.12 + Math.sin(t * 0.7) * 0.3 : 0.28 + Math.sin(t * 0.4) * 0.05), 0);
    else if (captura !== null) menina.raiz.rotation.set(0, Math.PI * kc - 0.12 * kc, 0);

    // quem persegue: logo atrás dela, um pouco de lado para não tapar a menina
    const dp = s.perseguidor?.dist ?? 99;
    // mais longe que isso ele já estaria em cima da câmera: some de vista
    perseguidor.raiz.visible = (dp < 1.9 || captura !== null) && !vitrine;
    if (captura !== null) {
      // ele dá a volta e fica ao lado dela, de frente para a tela, segurando-a
      const quadrupede = ['leao', 'panda', 'urso'].includes(perseguidorId);
      const alvoX = xDe(s.x) + (quadrupede ? 0.45 : 0.5); const alvoZ = quadrupede ? 0.5 : 0.18;
      const de = { x: perX + 0.18, z: -dp };
      perseguidor.raiz.position.set(de.x + (alvoX - de.x) * kc, 0, de.z + (alvoZ - de.z) * kc);
      perseguidor.raiz.rotation.y = Math.PI * kc;
      perseguidor.raiz.scale.setScalar(0.8);
      if (kc < 1) perseguidor.animar(t * 9); else perseguidor.segurar(t);
    } else if (perseguidor.raiz.visible) {
      perseguidor.raiz.rotation.y = 0;
      perX += (xDe(s.x) - perX) * 0.08;
      const lado = s.faixa === 0 ? -1 : 1; // fica do lado de dentro da pista
      perseguidor.raiz.position.set(perX + lado * (dp > 0.5 ? 0.32 : 0.18), 0, -dp);
      perseguidor.raiz.scale.setScalar(0.8);
      perseguidor.animar(s.vivo ? s.dist * 1.4 : t * 9);
    }

    for (const { t: tex, escala } of cenario.rolar) tex.offset.y = (dist / escala) % 1;
    for (const it of cenario.itens) it.mesh.position.z = ((it.z0 - INICIO - dist) % COMP_CENA + COMP_CENA) % COMP_CENA + INICIO;
    cenario.atualizar(t, dt, s.vel ?? 0);

    const vistos = new Set();
    for (const o of s.objetos) {
      if (o.pego || o.quebrado || o.z > LONGE + 2) continue;
      if (captura !== null && kc > 0.5 && o.z < 4) continue; // na cena da captura, nada na frente deles
      let m = objetos.get(o);
      if (!m) { m = criarObjeto(o, tema); objetos.set(o, m); cena.add(m); }
      vistos.add(o);
      m.position.set(xDe(o.faixa), o.h ?? 0, o.z);
      if (m.userData.gira) m.rotation.y = t * 2 + o.z * 0.3;
      if (m.userData.flutua) m.position.y = (o.h ?? 0.7) + Math.sin(t * 4 + o.z) * 0.08;
    }
    const manter = COMUNS();
    for (const [o, m] of objetos) {
      if (vistos.has(o)) continue;
      cena.remove(m);
      descartar(m, manter);
      objetos.delete(o);
    }

    const px = xDe(s.x);
    if (captura !== null && !vitrine) {
      // a câmera desce e chega perto, com os dois no meio da tela
      const cx = px + 0.22; const k2 = kc;
      camera.position.set(camX + (cx - camX) * k2, camY + (1.2 - camY) * k2, -2.9 + 0.5 * k2);
      camera.lookAt((px * 0.85) + (cx - px * 0.85) * k2, (0.95 + s.y * 0.6) + (0.82 - 0.95 - s.y * 0.6) * k2, 6 - 6 * k2);
    } else if (vitrine) {
      // de frente para ela; olhando um pouco para a direita da tela (−x), ela fica à esquerda
      camX = px - 0.62; camY = 2.35;
      if (visual.palco === 'galeria') {
        // galeria de personagens: de corpo inteiro, no meio, na metade de cima da tela
        camera.position.set(px, 1.1, -3.9);
        camera.lookAt(px, -0.02, 0);
      } else {
        camera.position.set(px - 0.62, 1.05, -2.75);
        camera.lookAt(px - 0.62, 0.84, 0);
      }
    } else {
      // na nave a câmera se afasta um pouco, para caber o disco voador inteiro
      afastar += ((s.voo > 0 && s.vooTipo === 'nave' ? 1 : 0) - afastar) * 0.06;
      camX += (px * 0.75 - camX) * 0.12;
      // voando de mochila ou de capa: a câmera sobe acima dela e se afasta, e mira longe na pista.
      // Assim a menina fica embaixo na tela, menor, e dá para ver as moedas que vêm pela frente.
      altoVoo += ((s.voo > 0 && s.vooTipo !== 'nave' ? 1 : 0) - altoVoo) * 0.06;
      const alvoY = (2.35 + Math.max(0, s.y - 0.4) * 0.8) * (1 - altoVoo) + (s.y + 2.45) * altoVoo;
      camY += (alvoY + afastar * 0.9 - camY) * 0.1;
      camera.position.set(camX, camY, -2.9 - afastar * 1.8 - altoVoo * 2.3);
      camera.lookAt(px * 0.85, (0.95 + s.y * 0.6) * (1 - altoVoo) + (s.y - 0.35) * altoVoo, 6 + altoVoo * 10);
    }
    sol.position.set(px - 4, 9, -2);
    sol.target.position.set(px, 0, 6);
    preenche.position.set(camX, camY + 1, -6);
    preenche.target.position.set(px, 0.8, 0);
    recorte.position.set(px + 2, 3, 8);
    recorte.target.position.set(px, 1, 0);
    renderer.render(cena, camera);
  }

  function destruir() {
    limparObjetos();
    if (cenario) descartar(cenario.grupo);
    if (perseguidor) descartar(perseguidor.raiz);
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  return { redimensionar, desenhar, destruir };
}

export { LISTA as CENARIOS } from './3d/cenarios.js';
