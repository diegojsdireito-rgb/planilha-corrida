// Desenhos difíceis: cheios de partes pequenas. Bichos e formas recheados de padrões
// (estilo "zentangle"), mandalas, vitrais e figuras geométricas.
import { estrela, coracao, flor, semente, f1, PRETO } from './pintar-formas.js';

// ---------- padrões para rechear as faixas ----------
const PADROES = {
  bolinhas(y0, y1, r) {
    const raio = 6 + r() * 5; const passo = raio * 3; let s = '';
    for (let y = y0 + raio, l = 0; y < y1 + raio; y += passo * 0.8, l++) for (let x = (l % 2 ? passo / 2 : 0); x < 420; x += passo) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(raio)}"/>`;
    return s;
  },
  escamas(y0, y1, r) {
    const raio = 10 + r() * 6; let s = '';
    for (let y = y0, l = 0; y < y1 + raio * 2; y += raio, l++) { let d = ''; for (let x = (l % 2 ? -raio : 0); x < 420; x += raio * 2) d += `M${f1(x)} ${f1(y)} a${f1(raio)} ${f1(raio)} 0 0 0 ${f1(raio * 2)} 0 `; s += `<path d="${d}" fill="none"/>`; }
    return s;
  },
  zigue(y0, y1, r) {
    const a = 8 + r() * 8; const passo = 14 + r() * 8; let s = '';
    for (let y = y0 + a; y < y1 + a; y += a * 2.2) { let d = `M0 ${f1(y)}`; for (let x = 0, k = 0; x < 420; x += passo, k++) d += ` L${f1(x + passo)} ${f1(y + (k % 2 ? a : -a))}`; s += `<path d="${d}" fill="none"/>`; }
    return s;
  },
  listras(y0, y1, r) {
    const passo = 12 + r() * 10; const inc = r() < 0.5 ? 1 : -1; let s = '';
    for (let x = -200; x < 600; x += passo) s += `<path d="M${f1(x)} ${f1(y0 - 10)} L${f1(x + inc * (y1 - y0 + 20))} ${f1(y1 + 10)}" fill="none"/>`;
    return s;
  },
  losangos(y0, y1, r) {
    const t = 12 + r() * 8; let s = '';
    for (let y = y0, l = 0; y < y1 + t; y += t, l++) for (let x = (l % 2 ? t : 0); x < 420; x += t * 2) s += `<path d="M${f1(x)} ${f1(y - t)} L${f1(x + t)} ${f1(y)} L${f1(x)} ${f1(y + t)} L${f1(x - t)} ${f1(y)} Z"/>`;
    return s;
  },
  flores(y0, y1, r) {
    const passo = 34 + r() * 10; let s = '';
    for (let y = y0 + passo / 2, l = 0; y < y1 + passo / 2; y += passo * 0.85, l++) for (let x = (l % 2 ? passo / 2 : 0); x < 420; x += passo) s += flor(f1(x), f1(y), f1(passo / 40));
    return s;
  },
  ondas(y0, y1, r) {
    const a = 6 + r() * 6; const passo = 30 + r() * 20; let s = '';
    for (let y = y0 + a; y < y1 + a; y += a * 2.4) { let d = `M-20 ${f1(y)}`; for (let x = -20; x < 420; x += passo) d += ` q${f1(passo / 4)} ${f1(-a)} ${f1(passo / 2)} 0 t${f1(passo / 2)} 0`; s += `<path d="${d}" fill="none"/>`; }
    return s;
  },
  circulos(y0, y1, r) {
    const raio = 10 + r() * 8; let s = '';
    for (let y = y0 + raio, l = 0; y < y1 + raio; y += raio * 2, l++) for (let x = (l % 2 ? raio : 0); x < 420; x += raio * 2) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(raio)}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(raio * 0.5)}"/>`;
    return s;
  },
  triangulos(y0, y1, r) {
    const t = 14 + r() * 10; let s = '';
    for (let y = y0, l = 0; y < y1 + t; y += t, l++) { let d = ''; for (let x = (l % 2 ? -t / 2 : 0); x < 420; x += t) d += `M${f1(x)} ${f1(y + t)} L${f1(x + t / 2)} ${f1(y)} L${f1(x + t)} ${f1(y + t)} `; s += `<path d="${d}" fill="none"/><path d="M-10 ${f1(y + t)} H420" fill="none"/>`; }
    return s;
  },
  gotas(y0, y1, r) {
    const t = 12 + r() * 6; let s = '';
    for (let y = y0 + t, l = 0; y < y1 + t * 2; y += t * 2.2, l++) for (let x = (l % 2 ? t : 0); x < 420; x += t * 2) s += `<path d="M${f1(x)} ${f1(y - t)} Q${f1(x + t * 0.9)} ${f1(y + t * 0.4)} ${f1(x)} ${f1(y + t * 0.8)} Q${f1(x - t * 0.9)} ${f1(y + t * 0.4)} ${f1(x)} ${f1(y - t)} Z"/>`;
    return s;
  },
  xadrez(y0, y1, r) {
    const t = 14 + r() * 8; let s = '';
    for (let y = y0 - t; y < y1 + t; y += t) s += `<path d="M-10 ${f1(y)} H420" fill="none"/>`;
    for (let x = 0; x < 420; x += t) s += `<path d="M${f1(x)} ${f1(y0 - 10)} V${f1(y1 + 10)}" fill="none"/>`;
    return s;
  },
};
const NOMES_PADROES = Object.keys(PADROES);

// Recheia uma silhueta com faixas onduladas, cada uma com um padrão diferente.
function zentangle({ id, nome, icone, partes, contorno = partes, topo, base, faixas = 6, seed, extra = '', fundo = '' }) {
  const r = semente(seed);
  const clipe = `z-${id}`;
  const linhas = [topo];
  for (let k = 1; k < faixas; k++) linhas.push(topo + ((base - topo) * k) / faixas + (r() - 0.5) * 14);
  linhas.push(base);
  const curva = (y, fase) => `M-10 ${f1(y)} C100 ${f1(y - 16 * Math.sin(fase))} 300 ${f1(y + 16 * Math.sin(fase))} 410 ${f1(y)}`;
  const fases = linhas.map(() => r() * 6);
  let corpo = '';
  const embaralhados = [...NOMES_PADROES].sort(() => r() - 0.5);
  for (let k = 0; k < faixas; k++) {
    const a = curva(linhas[k], fases[k]);
    const b = `L410 ${f1(linhas[k + 1])} C300 ${f1(linhas[k + 1] + 16 * Math.sin(fases[k + 1]))} 100 ${f1(linhas[k + 1] - 16 * Math.sin(fases[k + 1]))} -10 ${f1(linhas[k + 1])} Z`;
    const padrao = PADROES[embaralhados[k % embaralhados.length]](linhas[k] - 20, linhas[k + 1] + 20, r);
    corpo += `<clipPath id="${clipe}-${k}"><path d="${a} ${b}"/></clipPath><g clip-path="url(#${clipe}-${k})">${padrao}</g>`;
  }
  const divisorias = linhas.slice(1, -1).map((y, k) => `<path d="${curva(y, fases[k + 1])}" fill="none"/>`).join('');
  return {
    id, nome, icone,
    svg: `${fundo}<defs><clipPath id="${clipe}">${partes}</clipPath></defs>
      ${partes}
      <g clip-path="url(#${clipe})">${corpo}${divisorias}</g>
      <g fill="none" stroke-width="4">${contorno}</g>
      ${extra}`,
  };
}

// ---------- mandalas ----------
function anel(tipo, n, r1, r2, giro = 0) {
  let s = '';
  for (let k = 0; k < n; k++) {
    const a = (k * 360) / n + giro;
    const w = (Math.PI * r2) / n; // meia largura da pétala
    let forma;
    if (tipo === 'ponta') forma = `<path d="M200 ${200 - r1} Q${f1(200 - w * 1.1)} ${f1(200 - (r1 + r2) / 2)} 200 ${200 - r2} Q${f1(200 + w * 1.1)} ${f1(200 - (r1 + r2) / 2)} 200 ${200 - r1} Z"/>`;
    else if (tipo === 'redonda') forma = `<path d="M200 ${200 - r1} C${f1(200 - w * 1.4)} ${f1(200 - r1 - (r2 - r1) * 0.3)} ${f1(200 - w * 1.3)} ${200 - r2} 200 ${200 - r2} C${f1(200 + w * 1.3)} ${200 - r2} ${f1(200 + w * 1.4)} ${f1(200 - r1 - (r2 - r1) * 0.3)} 200 ${200 - r1} Z"/>`;
    else if (tipo === 'bola') forma = `<circle cx="200" cy="${f1(200 - (r1 + r2) / 2)}" r="${f1(Math.min((r2 - r1) / 2, w * 0.9))}"/>`;
    else if (tipo === 'gota') forma = `<path d="M200 ${200 - r2} Q${f1(200 + w)} ${f1(200 - r1 - (r2 - r1) * 0.25)} 200 ${200 - r1} Q${f1(200 - w)} ${f1(200 - r1 - (r2 - r1) * 0.25)} 200 ${200 - r2} Z"/><circle cx="200" cy="${f1(200 - r1 - (r2 - r1) * 0.32)}" r="${f1(w * 0.3)}"/>`;
    else if (tipo === 'arco') forma = `<path d="M${f1(200 - w)} ${200 - r1} A${f1(w)} ${f1(r2 - r1)} 0 0 1 ${f1(200 + w)} ${200 - r1}" fill="none"/>`;
    else forma = `<path d="M${f1(200 - w)} ${200 - r1} L200 ${200 - r2} L${f1(200 + w)} ${200 - r1} Z"/>`; // triângulo
    s += `<g transform="rotate(${f1(a)} 200 200)">${forma}</g>`;
  }
  return s;
}
function mandala(id, nome, icone, aneis, centro = 16) {
  let s = '<circle cx="200" cy="200" r="190"/>';
  for (const [tipo, n, r1, r2, giro = 0, circulo = false] of aneis) {
    if (circulo) s += `<circle cx="200" cy="200" r="${r1}"/>`;
    s += anel(tipo, n, r1, r2, giro);
  }
  s += `<circle cx="200" cy="200" r="${centro}"/>${estrela(200, 200, centro * 0.7, centro * 0.35, 6)}`;
  return { id, nome, icone, svg: s };
}

// ---------- vitrais: pedaços de vidro do tipo mosaico (células de Voronoi) ----------
function cortar(poli, a, b, c) {
  // mantém a parte do polígono onde a·x + b·y <= c
  const fora = [];
  for (let k = 0; k < poli.length; k++) {
    const p = poli[k]; const q = poli[(k + 1) % poli.length];
    const dp = a * p[0] + b * p[1] - c; const dq = a * q[0] + b * q[1] - c;
    if (dp <= 0) fora.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); fora.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return fora;
}
export function celulas(pontos, min = -20, max = 420) {
  return pontos.map((p, i) => {
    let poli = [[min, min], [max, min], [max, max], [min, max]];
    pontos.forEach((q, j) => {
      if (i === j) return;
      poli = cortar(poli, q[0] - p[0], q[1] - p[1], (q[0] ** 2 + q[1] ** 2 - p[0] ** 2 - p[1] ** 2) / 2);
    });
    return poli;
  });
}
function vitral(id, nome, icone, forma, seed, n = 28, extra = '') {
  const r = semente(seed);
  let pontos = Array.from({ length: n }, () => [20 + r() * 360, 20 + r() * 360]);
  for (let passo = 0; passo < 2; passo++) {
    // deixa os pedaços com tamanhos parecidos: cada ponto vai para o meio da sua célula
    pontos = celulas(pontos).map((c) => [c.reduce((t, q) => t + q[0], 0) / c.length, c.reduce((t, q) => t + q[1], 0) / c.length]);
  }
  const cel = celulas(pontos).map((c) => `<path d="${c.map(([x, y], k) => `${k ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join('')}Z" fill="none"/>`).join('');
  return { id, nome, icone, svg: `<defs><clipPath id="v-${id}">${forma}</clipPath></defs>${forma}<g clip-path="url(#v-${id})">${cel}</g><g fill="none" stroke-width="7">${forma}</g>${extra}` };
}

const CORACAO = '<path d="M200 365 C60 265 18 175 58 110 C98 48 178 58 200 122 C222 58 302 48 342 110 C382 175 340 265 200 365 Z"/>';

export const DIFICEIS = [
  zentangle({
    id: 'z-coracao', nome: 'Coração cheio de padrões', icone: '💗', seed: 11, topo: 50, base: 370, faixas: 7,
    partes: CORACAO,
  }),
  zentangle({
    id: 'z-gato', nome: 'Gato de padrões', icone: '🐈', seed: 7, topo: 60, base: 380, faixas: 7,
    partes: '<path d="M120 170 L110 70 L170 115 Q200 105 230 115 L290 70 L280 170 Q290 230 240 250 Q330 280 320 380 H80 Q70 280 160 250 Q110 230 120 170 Z"/><path d="M318 360 C380 350 390 280 350 250 C340 244 332 254 340 262 C370 290 360 330 316 336 Z"/>',
    extra: `<ellipse cx="172" cy="165" rx="18" ry="22"/><ellipse cx="228" cy="165" rx="18" ry="22"/><circle cx="174" cy="168" r="9" ${PRETO}/><circle cx="230" cy="168" r="9" ${PRETO}/><path d="M188 200 H212 L200 214 Z"/>`,
  }),
  zentangle({
    id: 'z-peixe', nome: 'Peixe de escamas', icone: '🐟', seed: 23, topo: 90, base: 310, faixas: 6,
    partes: '<path d="M40 200 Q150 70 300 200 Q150 330 40 200 Z"/><path d="M290 200 L380 120 Q356 200 380 280 Z"/><path d="M140 120 Q190 50 250 140 Z"/><path d="M150 278 Q190 340 230 270 Z"/>',
    extra: `<circle cx="92" cy="185" r="20"/><circle cx="95" cy="188" r="9" ${PRETO}/>`,
  }),
  zentangle({
    id: 'z-elefante', nome: 'Elefante de padrões', icone: '🐘', seed: 31, topo: 90, base: 370, faixas: 7,
    partes: '<ellipse cx="240" cy="230" rx="120" ry="90"/><rect x="150" y="280" width="44" height="90" rx="16"/><rect x="290" y="280" width="44" height="90" rx="16"/><circle cx="140" cy="170" r="70"/><path d="M90 210 C40 230 50 300 60 340 C66 360 92 360 88 340 C80 300 96 260 130 250 Z"/>',
    contorno: '<ellipse cx="240" cy="230" rx="120" ry="90"/><rect x="150" y="280" width="44" height="90" rx="16"/><rect x="290" y="280" width="44" height="90" rx="16"/><path d="M90 210 C40 230 50 300 60 340 C66 360 92 360 88 340 C80 300 96 260 130 250 Z"/><circle cx="140" cy="170" r="70"/>',
    extra: `<path d="M170 120 C250 80 290 200 210 230 C190 238 170 220 172 200 Z"/><circle cx="118" cy="155" r="11"/><circle cx="120" cy="158" r="5" ${PRETO}/><path d="M354 220 Q380 250 370 290" fill="none"/>`,
  }),
  zentangle({
    id: 'z-coruja', nome: 'Coruja de padrões', icone: '🦉', seed: 41, topo: 60, base: 360, faixas: 7,
    partes: '<path d="M110 120 L95 40 L160 90 Q200 80 240 90 L305 40 L290 120 Q330 200 300 300 Q270 360 200 362 Q130 360 100 300 Q70 200 110 120 Z"/>',
    extra: `<circle cx="160" cy="150" r="40"/><circle cx="240" cy="150" r="40"/><circle cx="160" cy="150" r="22"/><circle cx="240" cy="150" r="22"/><circle cx="162" cy="152" r="11" ${PRETO}/><circle cx="242" cy="152" r="11" ${PRETO}/><path d="M188 184 H212 L200 210 Z"/><path d="M20 370 Q200 350 380 372 L380 388 Q200 368 20 386 Z"/>`,
  }),
  zentangle({
    id: 'z-borboleta', nome: 'Borboleta de padrões', icone: '🦋', seed: 53, topo: 50, base: 340, faixas: 6,
    partes: '<path d="M200 190 C150 60 30 50 40 150 C46 210 140 215 200 200 Z"/><path d="M200 190 C250 60 370 50 360 150 C354 210 260 215 200 200 Z"/><path d="M200 205 C130 210 70 270 105 320 C140 355 190 290 200 235 Z"/><path d="M200 205 C270 210 330 270 295 320 C260 355 210 290 200 235 Z"/>',
    extra: '<ellipse cx="200" cy="215" rx="15" ry="78"/><circle cx="200" cy="128" r="20"/><path d="M190 112 C170 70 160 60 145 52 M210 112 C230 70 240 60 255 52" fill="none"/><circle cx="145" cy="52" r="8"/><circle cx="255" cy="52" r="8"/>',
  }),
  zentangle({
    id: 'z-tartaruga', nome: 'Tartaruga de padrões', icone: '🐢', seed: 61, topo: 110, base: 270, faixas: 5,
    partes: '<path d="M70 270 Q80 110 205 104 Q330 110 340 270 Z"/>',
    fundo: '<path d="M0 340 Q200 320 400 340 V400 H0 Z"/><ellipse cx="110" cy="300" rx="26" ry="36"/><ellipse cx="300" cy="300" rx="26" ry="36"/><path d="M70 262 L30 272 L70 282 Z"/><path d="M320 240 Q340 210 350 205 L362 240 Z"/><circle cx="358" cy="205" r="36"/>',
    extra: `<path d="M60 270 H350 Q358 290 340 296 H70 Q52 290 60 270 Z"/><circle cx="368" cy="196" r="7" ${PRETO}/><path d="M352 222 Q368 232 382 220" fill="none"/>`,
  }),
  zentangle({
    id: 'z-passaro', nome: 'Passarinho de padrões', icone: '🐦', seed: 71, topo: 80, base: 330, faixas: 6,
    partes: '<path d="M80 220 Q90 120 190 110 Q230 60 290 80 Q330 95 330 140 L370 150 L328 165 Q320 260 220 300 Q120 320 80 220 Z"/><path d="M90 230 L20 300 L40 250 L10 240 Z"/>',
    extra: `<circle cx="292" cy="125" r="13"/><circle cx="295" cy="127" r="6" ${PRETO}/><path d="M150 200 Q210 170 260 210 Q210 260 150 200 Z"/><path d="M200 300 L195 350 M230 295 L235 350 M180 352 H250" fill="none"/>`,
  }),
  zentangle({
    id: 'z-estrela', nome: 'Estrela de padrões', icone: '⭐', seed: 83, topo: 20, base: 370, faixas: 7,
    partes: estrela(200, 205, 190, 82),
  }),
  zentangle({
    id: 'z-dino', nome: 'Dinossauro de padrões', icone: '🦖', seed: 97, topo: 50, base: 360, faixas: 7,
    partes: '<path d="M60 230 C40 150 50 70 100 55 C150 40 190 60 190 95 C190 125 160 130 140 128 C135 160 150 190 170 205 C250 170 330 190 350 250 Q390 280 395 330 Q350 300 320 300 L320 360 H280 V310 Q240 320 200 310 V360 H160 V300 Q100 290 60 230 Z"/>',
    extra: `<circle cx="120" cy="80" r="11"/><circle cx="122" cy="82" r="5" ${PRETO}/><path d="M150 105 Q165 112 180 104" fill="none"/>`,
  }),
  mandala('m-sol', 'Mandala do sol', '🌞', [['ponta', 24, 130, 188], ['redonda', 12, 92, 140, 15, true], ['bola', 24, 74, 94, 0, true], ['gota', 12, 34, 76, 0, true]], 26),
  mandala('m-flor', 'Mandala de flor', '🌺', [['redonda', 16, 120, 186], ['arco', 32, 110, 126, 0, true], ['redonda', 16, 60, 116, 11.25, true], ['bola', 16, 34, 56, 0, true]], 22),
  mandala('m-estrelas', 'Mandala de estrelas', '✴️', [['triangulo', 32, 160, 188], ['ponta', 16, 100, 162, 0, true], ['ponta', 16, 100, 150, 11.25], ['bola', 32, 82, 98, 0, true], ['triangulo', 12, 40, 80, 0, true]], 20),
  mandala('m-gotas', 'Mandala de gotas', '💧', [['gota', 20, 130, 186], ['bola', 40, 116, 130, 0, true], ['redonda', 10, 60, 116, 0, true], ['gota', 10, 60, 100, 18], ['triangulo', 20, 28, 58, 0, true]], 22),
  mandala('m-renda', 'Mandala de renda', '🕸️', [['arco', 36, 166, 186], ['redonda', 18, 110, 168, 0, true], ['bola', 36, 96, 110, 0, true], ['ponta', 18, 56, 96, 10, true], ['ponta', 18, 56, 84], ['bola', 9, 30, 54, 0, true]], 18),
  mandala('m-lotus', 'Mandala de lótus', '🪷', [['redonda', 8, 110, 188], ['redonda', 8, 110, 170, 22.5], ['redonda', 16, 70, 120, 0, true], ['ponta', 16, 70, 110, 11.25], ['bola', 16, 40, 66, 0, true]], 24),
  vitral('vitral-redondo', 'Vitral redondo', '🔵', '<circle cx="200" cy="200" r="180"/>', 5, 30, `<circle cx="200" cy="200" r="44"/>${flor(200, 200, 2.6)}`),
  vitral('vitral-janela', 'Janela de vitral', '⛪', '<path d="M70 380 V170 C70 50 330 50 330 170 V380 Z"/>', 9, 34, '<path d="M200 60 V380 M70 220 H330" fill="none" stroke-width="7"/>'),
  vitral('vitral-coracao', 'Coração de vitral', '❤️', CORACAO, 13, 30),
  {
    id: 'geo-estrela', nome: 'Estrela geométrica', icone: '🔯',
    svg: `<circle cx="200" cy="200" r="185"/>${[178, 128, 80].map((r) => [0, 45].map((a) => `<rect x="${200 - r * 0.707}" y="${200 - r * 0.707}" width="${f1(r * 1.414)}" height="${f1(r * 1.414)}" transform="rotate(${a} 200 200)" fill="none"/>`).join('')).join('')}
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M200 200 L${f1(200 + Math.cos((k * Math.PI) / 4) * 185)} ${f1(200 + Math.sin((k * Math.PI) / 4) * 185)}" fill="none"/>`).join('')}
      <circle cx="200" cy="200" r="150" fill="none"/><circle cx="200" cy="200" r="100" fill="none"/><circle cx="200" cy="200" r="40" fill="none"/>`,
  },
  {
    id: 'geo-favo', nome: 'Favo de mel', icone: '🐝',
    svg: (() => {
      let s = '<defs><clipPath id="favo"><circle cx="200" cy="200" r="185"/></clipPath></defs><circle cx="200" cy="200" r="185"/><g clip-path="url(#favo)">';
      const r = 26; const w = r * Math.sqrt(3);
      for (let l = -1; l < 11; l++) for (let c = -1; c < 10; c++) {
        const cx = c * w + (l % 2 ? w / 2 : 0); const cy = l * r * 1.5;
        s += `<path d="${Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 6 + (k * Math.PI) / 3; return `${k ? 'L' : 'M'}${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}`; }).join('')}Z" fill="none"/>`;
      }
      s += '</g>';
      const abelha = (x, y, s2) => `<g transform="translate(${x} ${y}) scale(${s2})"><ellipse cx="-6" cy="-14" rx="10" ry="14" transform="rotate(-25 -6 -14)"/><ellipse cx="8" cy="-14" rx="10" ry="14" transform="rotate(25 8 -14)"/><ellipse cx="0" cy="0" rx="20" ry="13"/><path d="M-6 -12 V12 M6 -12 V12" fill="none"/><circle cx="-24" cy="-2" r="9"/><circle cx="-26" cy="-4" r="2" ${PRETO}/></g>`;
      return s + abelha(130, 150, 1.6) + abelha(270, 260, 1.4);
    })(),
  },
  {
    id: 'paisagem', nome: 'Paisagem de montanhas', icone: '🏔️',
    svg: `
      <circle cx="300" cy="90" r="40"/>${Array.from({ length: 12 }, (_, k) => { const a = (k * Math.PI) / 6; return `<path d="M${f1(300 + Math.cos(a) * 50)} ${f1(90 + Math.sin(a) * 50)} L${f1(300 + Math.cos(a) * 70)} ${f1(90 + Math.sin(a) * 70)}" fill="none"/>`; }).join('')}
      <path d="M40 60 q10 -10 20 0 q10 -10 20 0 M90 100 q7 -7 14 0 q7 -7 14 0" fill="none"/>
      <path d="M-10 230 L60 140 L110 190 L170 100 L240 200 L290 150 L360 220 L410 180 V400 H-10 Z"/>
      <path d="M150 126 L170 100 L190 128 L180 122 L170 132 L160 122 Z"/><path d="M48 156 L60 140 L72 156 L60 150 Z"/>
      <path d="M-10 270 Q60 230 130 260 T270 250 T410 240 V400 H-10 Z"/>
      <path d="M-10 300 Q100 280 200 300 T410 290 V400 H-10 Z"/>
      <path d="M120 330 Q200 310 300 330 Q320 350 280 360 Q200 372 130 360 Q100 348 120 330 Z"/>
      ${[[150, 340], [190, 345], [240, 338], [270, 350]].map(([x, y]) => `<path d="M${x} ${y} q8 -5 16 0" fill="none"/>`).join('')}
      ${[[30, 300, 0.7], [70, 310, 0.9], [340, 300, 0.8], [380, 310, 0.7], [20, 360, 1.1], [370, 370, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-16" width="12" height="16"/><path d="M-34 -16 L0 -46 L34 -16 Z"/><path d="M-26 -38 L0 -66 L26 -38 Z"/><path d="M-18 -58 L0 -84 L18 -58 Z"/></g>`).join('')}
      ${[[90, 385], [140, 390], [250, 388], [310, 392]].map(([x, y]) => flor(x, y, 0.9)).join('')}
      <path d="M200 240 L215 225 L230 240 M232 228 L245 216 L258 228" fill="none"/>`,
  },
];
