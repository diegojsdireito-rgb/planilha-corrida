// Arte do Meu Bichinho: o bichinho em SVG (viewBox 0 -30 200 230) e todas as roupinhas,
// desenhadas para cada uma das 5 espécies. Sem estado: só devolve texto SVG.
const PALETAS = {
  gato: { corpo: '#ffb45e', claro: '#ffd9a8', escuro: '#ec8b35', barriga: '#fff0dc', interna: '#ff9fb8', nariz: '#ff6f91', linha: '#c96a1e' },
  cachorro: { corpo: '#e8bf8a', claro: '#f8e0bc', escuro: '#9a6340', barriga: '#fff6e8', interna: '#f3a3a3', nariz: '#3a2a26', linha: '#a8774f' },
  coelho: { corpo: '#f1ebf8', claro: '#ffffff', escuro: '#d9cfe6', barriga: '#ffffff', interna: '#ffb3c9', nariz: '#ff86a6', linha: '#b7a8cc' },
  dino: { corpo: '#7fd67c', claro: '#b9f2a4', escuro: '#3fae6a', barriga: '#e6f9bd', interna: '#ffb3c9', nariz: '#2f8f55', linha: '#38935a' },
  unicornio: { corpo: '#fbf6ff', claro: '#ffffff', escuro: '#e3d6f5', barriga: '#ffffff', interna: '#ffb8d6', nariz: '#e98fb5', linha: '#bda9db' },
};
const ARCO = ['#ff8fb1', '#ffd36e', '#8fe3b0', '#8fc8ff', '#c59bff'];
const TINTA = '#2a2135';
let sequencia = 0;
export { PALETAS, ARCO, TINTA, coracao, rabo, atras };

const contorno = (p, larg = 2.5) => `stroke="${p.linha}" stroke-width="${larg}" stroke-linejoin="round"`;

function rabo(esp, p, g) {
  if (esp === 'gato') return `<path d="M136 168 Q180 168 178 128 Q177 112 164 106" fill="none" stroke="${p.linha}" stroke-width="15" stroke-linecap="round"/><path d="M136 168 Q180 168 178 128 Q177 112 164 106" fill="none" stroke="${p.corpo}" stroke-width="10" stroke-linecap="round"/><path d="M177 124 Q176 112 164 106" fill="none" stroke="${p.escuro}" stroke-width="10" stroke-linecap="round"/>`;
  if (esp === 'cachorro') return `<path d="M136 160 Q168 152 166 122" fill="none" stroke="${p.linha}" stroke-width="15" stroke-linecap="round"/><path d="M136 160 Q168 152 166 122" fill="none" stroke="${p.corpo}" stroke-width="10" stroke-linecap="round"/>`;
  if (esp === 'coelho') return `<circle cx="146" cy="168" r="13" fill="#fff" ${contorno(p)}/><circle cx="142" cy="164" r="5" fill="#fff"/>`;
  if (esp === 'dino') return `<path d="M128 152 Q168 154 192 126 Q186 164 134 180 Z" fill="url(#${g})" ${contorno(p)}/><path d="M160 152 l6 -12 l4 10 M174 144 l7 -10 l2 10" fill="${p.escuro}" ${contorno(p, 2)}/>`;
  return ARCO.map((c, i) => `<path d="M136 162 Q${170 + i * 3} ${158 - i * 6} ${168 + i * 4} ${128 - i * 4} Q${165 + i * 3} ${116 - i * 3} ${156 + i * 2} ${112 - i * 2}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join('');
}

function atras(esp, p) {
  if (esp === 'gato') {
    return `<path d="M50 70 L58 16 L96 44 Z" fill="${p.corpo}" ${contorno(p)}/><path d="M59 60 L63 30 L84 46 Z" fill="${p.interna}"/>`
      + `<path d="M150 70 L142 16 L104 44 Z" fill="${p.corpo}" ${contorno(p)}/><path d="M141 60 L137 30 L116 46 Z" fill="${p.interna}"/>`;
  }
  if (esp === 'coelho') {
    return `<g class="bc-orelha bc-orelha-e"><ellipse cx="78" cy="4" rx="13" ry="36" transform="rotate(-12 78 4)" fill="${p.corpo}" ${contorno(p)}/><ellipse cx="78" cy="6" rx="6.5" ry="26" transform="rotate(-12 78 6)" fill="${p.interna}"/></g>`
      + `<g class="bc-orelha bc-orelha-d"><ellipse cx="122" cy="4" rx="13" ry="36" transform="rotate(12 122 4)" fill="${p.corpo}" ${contorno(p)}/><ellipse cx="122" cy="6" rx="6.5" ry="26" transform="rotate(12 122 6)" fill="${p.interna}"/></g>`;
  }
  if (esp === 'dino') return `<path d="M64 50 L70 26 L84 40 L94 16 L106 38 L116 18 L124 40 L136 28 L138 54 Z" fill="${p.escuro}" ${contorno(p)}/>`;
  if (esp === 'unicornio') {
    const juba = [[128, 42, 15], [147, 56, 14], [158, 76, 13], [161, 98, 12], [156, 119, 11], [146, 136, 9]];
    return juba.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ARCO[i % ARCO.length]}"/>`).join('')
      + `<path d="M58 58 L60 22 L88 42 Z" fill="${p.corpo}" ${contorno(p)}/><path d="M64 52 L65 32 L81 43 Z" fill="${p.interna}"/>`
      + `<path d="M142 58 L140 22 L112 42 Z" fill="${p.corpo}" ${contorno(p)}/><path d="M136 52 L135 32 L119 43 Z" fill="${p.interna}"/>`;
  }
  return '';
}

function marcas(esp, p) {
  if (esp === 'gato') return `<path d="M92 40 Q94 50 92 56 M100 37 L100 54 M108 40 Q106 50 108 56" stroke="${p.escuro}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  if (esp === 'cachorro') return `<ellipse cx="124" cy="82" rx="18" ry="16" fill="${p.escuro}" opacity=".5"/>`;
  if (esp === 'dino') return `<circle cx="70" cy="62" r="4" fill="${p.escuro}" opacity=".45"/><circle cx="130" cy="60" r="5" fill="${p.escuro}" opacity=".45"/><circle cx="138" cy="72" r="3" fill="${p.escuro}" opacity=".45"/>`;
  return '';
}

function frente(esp, p) {
  if (esp === 'cachorro') {
    return `<g class="bc-orelha bc-orelha-e"><path d="M56 50 Q34 56 36 96 Q38 120 56 116 Q68 110 68 86 Q68 62 76 48 Z" fill="${p.escuro}" ${contorno(p)}/></g>`
      + `<g class="bc-orelha bc-orelha-d"><path d="M144 50 Q166 56 164 96 Q162 120 144 116 Q132 110 132 86 Q132 62 124 48 Z" fill="${p.escuro}" ${contorno(p)}/></g>`;
  }
  if (esp === 'unicornio') {
    return `<path d="M92 42 L100 -6 L108 42 Z" fill="#ffd36e" stroke="#e0a72e" stroke-width="2" stroke-linejoin="round"/><path d="M94 32 L106 27 M95.5 21 L104.5 16 M97.5 10 L102.5 6" stroke="#e0a72e" stroke-width="2" stroke-linecap="round"/>`
      + `<circle cx="86" cy="42" r="9" fill="${ARCO[0]}"/><circle cx="98" cy="40" r="8" fill="${ARCO[4]}"/><circle cx="110" cy="42" r="8" fill="${ARCO[3]}"/>`;
  }
  return '';
}

function nariz(esp, p) {
  if (esp === 'cachorro') return `<ellipse cx="100" cy="101" rx="9" ry="6.5" fill="${p.nariz}"/><ellipse cx="97" cy="99" rx="3" ry="1.8" fill="#fff" opacity=".6"/>`;
  if (esp === 'dino') return `<circle cx="93" cy="100" r="2.2" fill="${p.nariz}"/><circle cx="107" cy="100" r="2.2" fill="${p.nariz}"/>`;
  return `<path d="M94 99 Q100 96 106 99 Q101 106 100 106 Q99 106 94 99 Z" fill="${p.nariz}"/>`;
}

function bigodes(esp, p) {
  if (esp !== 'gato' && esp !== 'coelho') return '';
  const op = esp === 'gato' ? 0.75 : 0.5;
  return `<g stroke="${p.linha}" stroke-width="1.8" stroke-linecap="round" opacity="${op}"><path d="M62 100 L40 95 M62 106 L40 109 M138 100 L160 95 M138 106 L160 109"/></g>`;
}

const olho = (x) => `<g class="bc-olho"><ellipse cx="${x}" cy="90" rx="9.5" ry="11.5" fill="${TINTA}"/><circle cx="${x - 3}" cy="85" r="3.8" fill="#fff"/><circle cx="${x + 3}" cy="95" r="1.7" fill="#fff"/></g>`;

function bocas(esp) {
  const dentes = esp === 'coelho' ? `<rect x="96.5" y="106" width="7" height="7" rx="1.5" fill="#fff" stroke="${TINTA}" stroke-width="1.4"/>` : '';
  return `<g class="bc-boca bc-boca-contente">${dentes}<path d="M89 107 Q94.5 114 100 107 Q105.5 114 111 107" stroke="${TINTA}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`
    + `<g class="bc-boca bc-boca-feliz"><path d="M87 107 Q100 128 113 107 Z" fill="#7a2e3e" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/><path d="M93 116 Q100 124 107 116 Q100 111 93 116 Z" fill="#ff8fa3"/></g>`
    + `<g class="bc-boca bc-boca-triste"><path d="M90 116 Q100 106 110 116" stroke="${TINTA}" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`
    + `<g class="bc-boca bc-boca-comendo"><ellipse cx="100" cy="112" rx="7" ry="6" fill="#7a2e3e" stroke="${TINTA}" stroke-width="2.2"/></g>`
    + `<g class="bc-boca bc-boca-dormindo"><path d="M95 110 Q100 114 105 110" stroke="${TINTA}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
}

function coracao(cx, cy, s) {
  return `M${cx} ${cy + 9 * s} C${cx - 20 * s} ${cy - 3 * s} ${cx - 11 * s} ${cy - 17 * s} ${cx} ${cy - 7 * s} C${cx + 11 * s} ${cy - 17 * s} ${cx + 20 * s} ${cy - 3 * s} ${cx} ${cy + 9 * s} Z`;
}

const ROSA = 'fill="#ff6fa5" stroke="#d94a86" stroke-width="2" stroke-linejoin="round"';
const laco = (cor, borda, bolinhas) => `<g transform="rotate(18 136 44)"><path d="M136 44 Q116 26 114 44 Q116 62 136 44 Z" fill="${cor}" stroke="${borda}" stroke-width="2" stroke-linejoin="round"/><path d="M136 44 Q156 26 158 44 Q156 62 136 44 Z" fill="${cor}" stroke="${borda}" stroke-width="2" stroke-linejoin="round"/>${bolinhas ? '<circle cx="122" cy="40" r="2.2" fill="#fff"/><circle cx="124" cy="49" r="2" fill="#fff"/><circle cx="150" cy="40" r="2.2" fill="#fff"/><circle cx="148" cy="49" r="2" fill="#fff"/>' : '<path d="M120 40 Q126 44 130 44 M152 40 Q146 44 142 44" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/>'}<circle cx="136" cy="44" r="5.5" fill="${cor}" stroke="${borda}" stroke-width="2"/></g>`;

function perolas() {
  let s = '';
  for (let k = 0; k <= 10; k++) {
    const t = k / 10; const u = 1 - t;
    const x = u * u * 64 + 2 * u * t * 100 + t * t * 136;
    const y = u * u * 126 + 2 * u * t * 158 + t * t * 126;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="#fffaf0" stroke="#cfc3ae" stroke-width="1.2"/><circle cx="${(x - 1.4).toFixed(1)}" cy="${(y - 1.4).toFixed(1)}" r="1.3" fill="#fff"/>`;
  }
  return s + `<path d="${coracao(100, 150, 0.45)}" fill="#ff6fa5" stroke="#d94a86" stroke-width="1.5"/>`;
}

// Cada acessório: desenho no lugar certo do bichinho e uma caixa para a vitrine da loja.
const ARTE_ANTIGA = {
  festa: { vb: '68 -24 64 72', svg: () => `<g transform="rotate(-14 100 40)"><path d="M80 42 L100 -8 L120 42 Z" ${ROSA}/><circle cx="94" cy="28" r="3.2" fill="#ffe066"/><circle cx="106" cy="18" r="3" fill="#7fd3ff"/><circle cx="105" cy="34" r="3" fill="#7fd3ff"/><circle cx="98" cy="8" r="2.6" fill="#ffe066"/><path d="M80 42 Q100 50 120 42" stroke="#ffd36e" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="100" cy="-10" r="7.5" fill="#ffd36e" stroke="#e0a72e" stroke-width="1.6"/></g>` },
  cartola: { vb: '62 -6 78 56', svg: () => `<g transform="rotate(8 100 40)"><ellipse cx="100" cy="42" rx="33" ry="7.5" fill="#2b2233"/><path d="M80 41 L82 4 Q100 0 118 4 L120 41 Q100 46 80 41 Z" fill="#3a3045"/><path d="M80.6 30 Q100 35 119.4 30 L119.7 38 Q100 43 80.3 38 Z" fill="#e5484d"/><ellipse cx="100" cy="4" rx="18" ry="4" fill="#4b3f5a"/><path d="M88 10 L87.5 26" stroke="#fff" stroke-opacity=".25" stroke-width="3.5" stroke-linecap="round"/></g>` },
  coroa: { vb: '62 -2 76 54', svg: () => `<path d="M74 46 L70 14 L86 28 L100 6 L114 28 L130 14 L126 46 Q100 52 74 46 Z" fill="#ffd36e" stroke="#d99a1e" stroke-width="2.2" stroke-linejoin="round"/><path d="M76 40 Q100 45 124 40" stroke="#fff3c2" stroke-width="2" fill="none"/><circle cx="70" cy="13" r="4.2" fill="#ff6fa5"/><circle cx="100" cy="5" r="4.8" fill="#7fd3ff"/><circle cx="130" cy="13" r="4.2" fill="#ff6fa5"/><circle cx="100" cy="35" r="4.5" fill="#e5484d" stroke="#fff" stroke-width="1"/><circle cx="84" cy="37" r="3.2" fill="#3e7bfa"/><circle cx="116" cy="37" r="3.2" fill="#3e7bfa"/>` },
  bone: { vb: '24 4 124 60', svg: () => `<path d="M58 56 Q56 14 100 12 Q144 14 142 56 Q100 44 58 56 Z" fill="#3e7bfa" stroke="#2a5fd0" stroke-width="2.2" stroke-linejoin="round"/><path d="M62 54 Q42 52 26 62 Q50 70 80 56 Z" fill="#2a5fd0" stroke="#1f4aa8" stroke-width="2" stroke-linejoin="round"/><path d="M100 14 Q96 30 98 48" stroke="#2a5fd0" stroke-width="1.6" fill="none" opacity=".7"/><circle cx="100" cy="13" r="4" fill="#ffd36e"/><path d="M118 24 l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.8 2.7 1-5.3-4-3.7 5.5-.6z" fill="#ffd36e"/>` },
  'laco-rosa': { vb: '110 24 52 40', svg: () => laco('#ff6fa5', '#d94a86', false) },
  'laco-azul': { vb: '110 24 52 40', svg: () => laco('#6fb6ff', '#3e7bfa', true) },
  flor: { vb: '118 26 36 36', svg: () => `${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(136 + 8 * Math.cos((a - 90) * Math.PI / 180)).toFixed(1)}" cy="${(44 + 8 * Math.sin((a - 90) * Math.PI / 180)).toFixed(1)}" r="6.5" fill="#fff" stroke="#ffb3c9" stroke-width="1.8"/>`).join('')}<circle cx="136" cy="44" r="5.5" fill="#ffd36e" stroke="#f0a82c" stroke-width="1.5"/>` },
  'oculos-sol': { vb: '42 72 116 36', svg: () => `<path d="M62 86 L46 80 M138 86 L154 80" stroke="#1a1420" stroke-width="3.5" stroke-linecap="round"/><rect x="61" y="77" width="34" height="26" rx="11" fill="#2a2135" stroke="#1a1420" stroke-width="2.5"/><rect x="105" y="77" width="34" height="26" rx="11" fill="#2a2135" stroke="#1a1420" stroke-width="2.5"/><path d="M95 87 Q100 83 105 87" stroke="#1a1420" stroke-width="3.5" fill="none"/><path d="M67 84 L77 80 M111 84 L121 80" stroke="#fff" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round"/>` },
  'oculos-coracao': { vb: '42 70 116 40', svg: () => `<path d="M60 86 L46 80 M140 86 L154 80" stroke="#d61f69" stroke-width="3.5" stroke-linecap="round"/><path d="${coracao(78, 91, 1.05)}" fill="#ff4f8b" fill-opacity=".85" stroke="#d61f69" stroke-width="2.6"/><path d="${coracao(122, 91, 1.05)}" fill="#ff4f8b" fill-opacity=".85" stroke="#d61f69" stroke-width="2.6"/><path d="M94 86 Q100 82 106 86" stroke="#d61f69" stroke-width="3.2" fill="none"/><path d="M68 84 L73 81 M112 84 L117 81" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>` },
  cachecol: { vb: '48 118 104 70', svg: () => `<path d="M114 144 L134 141 L139 178 L119 181 Z" fill="#e5484d" stroke="#b8323a" stroke-width="2" stroke-linejoin="round"/><path d="M116 156 L135 153 M117.5 167 L137 164" stroke="#fff" stroke-width="4"/><path d="M121 181 l-1 6 M126 180.5 l-.5 6 M131 180 l0 6 M136 179 l.5 6" stroke="#b8323a" stroke-width="2" stroke-linecap="round"/><path d="M54 126 Q100 152 146 126 L148 141 Q100 168 52 141 Z" fill="#e5484d" stroke="#b8323a" stroke-width="2.2" stroke-linejoin="round"/><path d="M72 135 L71 149 M90 140 L90 155 M110 140 L110 155 M128 135 L129 149" stroke="#fff" stroke-width="4.5"/>` },
  gravata: { vb: '74 124 52 32', svg: () => `<path d="M100 140 L78 128 L78 152 Z" fill="#8e5bd6" stroke="#6a3db0" stroke-width="2" stroke-linejoin="round"/><path d="M100 140 L122 128 L122 152 Z" fill="#8e5bd6" stroke="#6a3db0" stroke-width="2" stroke-linejoin="round"/><circle cx="85" cy="136" r="1.8" fill="#fff"/><circle cx="86" cy="145" r="1.8" fill="#fff"/><circle cx="115" cy="136" r="1.8" fill="#fff"/><circle cx="114" cy="145" r="1.8" fill="#fff"/><rect x="94" y="134" width="12" height="12" rx="3.5" fill="#a77ae6" stroke="#6a3db0" stroke-width="2"/>` },
  colar: { vb: '58 118 84 44', svg: perolas },
};


// ---------- roupinhas novas ----------
// Cada item tem partes desenhadas em camadas diferentes do bichinho:
//   atras: nas costas, atrás do rabo e do corpo (asas, capa, mochila)
//   corpo: sobre a barriga, recortado no formato do corpo (blusas, fantasias)
//   sobre: por cima dos bracinhos e pezinhos (mangas, saia, botas, alças)
//   cabeca: por cima do rosto (chapéus, tiaras, óculos, colares, capacete)
// O contexto c traz a espécie (c.esp), a paleta (c.p) e um prefixo único de ids (c.g).
const recorte = (c, s) => `<g clip-path="url(#${c.g}c)">${s}</g>`;
const linha = (cor, larg = 2.2) => `stroke="${cor}" stroke-width="${larg}" stroke-linejoin="round" stroke-linecap="round"`;

// Onde os chapéus ficam em cada espécie: no unicórnio, de ladinho para não amassar o chifre.
const ANCORA_CHAPEU = {
  coelho: 'translate(100 40) scale(.94) translate(-100 -40)',
  unicornio: 'translate(70 52) rotate(-26) scale(.8) translate(-100 -42)',
};
const chapeu = (c, s) => (ANCORA_CHAPEU[c.esp] ? `<g transform="${ANCORA_CHAPEU[c.esp]}">${s}</g>` : s);

// Mangas por cima dos bracinhos (a pontinha da patinha continua aparecendo).
let mangaSeq = 0;
const mangas = (cor, borda, punho) => {
  const id = `bcm${++mangaSeq}`;
  return `<clipPath id="${id}"><rect x="30" y="128" width="140" height="28"/></clipPath>` + [[61, 22], [139, -22]].map(([x, a]) => `<g transform="rotate(${a} ${x} 150)"><ellipse cx="${x}" cy="150" rx="10.8" ry="15.8" fill="${cor}" clip-path="url(#${id})" ${linha(borda, 2)}/><path d="M${x - 9.4} 155.5 L${x + 9.4} 155.5" stroke="${borda}" stroke-width="7" stroke-linecap="round"/><path d="M${x - 9.4} 155.5 L${x + 9.4} 155.5" stroke="${punho}" stroke-width="4.4" stroke-linecap="round"/></g>`).join('');
};

// Curva do alto da cabeça (para tiaras e coroas de flores): ponto na fração t.
const curvaCabeca = (t, [x0, y0, cx, cy, x1, y1] = [50, 68, 100, 6, 150, 68]) => {
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
};
const florzinha = (x, y, r, cor, miolo = '#ffd36e') => [0, 72, 144, 216, 288].map((a) => {
  const rad = ((a - 90) * Math.PI) / 180;
  return `<circle cx="${(x + r * 0.62 * Math.cos(rad)).toFixed(1)}" cy="${(y + r * 0.62 * Math.sin(rad)).toFixed(1)}" r="${(r * 0.52).toFixed(1)}" fill="${cor}" stroke="#000" stroke-opacity=".08"/>`;
}).join('') + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.36).toFixed(1)}" fill="${miolo}"/>`;
const folhinha = (x, y, a) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="2.8" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#5cc46f"/>`;
export const estrelaPath = (cx, cy, r, r2 = r * 0.45, pontas = 5) => {
  let d = '';
  for (let k = 0; k < pontas * 2; k++) {
    const rr = k % 2 ? r2 : r;
    const a = (k * Math.PI) / pontas - Math.PI / 2;
    d += `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
  }
  return `${d}Z`;
};

// Antenas da abelha e da joaninha, ajustadas para não brigar com orelhas, chifre e espinhos.
const ANTENAS = {
  gato: [[88, 38, 82, 18, 74, 2], [112, 38, 118, 18, 126, 2]],
  cachorro: [[88, 37, 82, 16, 76, 0], [112, 37, 118, 16, 124, 0]],
  coelho: [[93, 36, 91, 16, 87, -2], [107, 36, 109, 16, 113, -2]],
  dino: [[86, 38, 78, 10, 70, -10], [114, 38, 122, 10, 130, -10]],
  unicornio: [[78, 42, 66, 24, 56, 8], [122, 42, 134, 24, 144, 8]],
};
function antenas(c, cor, bola) {
  const faixa = `<path d="M54 64 Q100 14 146 64" fill="none" ${linha(cor, 6)}/>`;
  return faixa + ANTENAS[c.esp].map(([x0, y0, cx, cy, x1, y1]) => `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" fill="none" ${linha(cor, 3.2)}/><circle cx="${x1}" cy="${y1}" r="6.5" fill="${bola}" ${linha(cor, 2)}/><circle cx="${x1 - 2}" cy="${y1 - 2}" r="2" fill="#fff" opacity=".7"/>`).join('');
}

// O lado esquerdo desenhado é espelhado para o direito.
const espelhar = (s) => `${s}<g transform="translate(200 0) scale(-1 1)">${s}</g>`;

// Capacete do astronauta: a bolha de vidro em volta da cabeça de cada espécie, com
// anéis onde as orelhas do coelho e o chifre do unicórnio passam.
const BOLHA = {
  gato: { cy: 80, rx: 72, ry: 66, furos: [] },
  cachorro: { cy: 84, rx: 74, ry: 62, furos: [] },
  coelho: { cy: 80, rx: 72, ry: 66, furos: [[79, 18, -12], [121, 18, 12]] },
  dino: { cy: 80, rx: 72, ry: 66, furos: [] },
  unicornio: { cy: 82, rx: 74, ry: 66, furos: [[100, 16, 0, 9]] },
};

const CHIFRE = '<path d="M92 42 L100 -6 L108 42 Z" fill="#ffd36e" stroke="#e0a72e" stroke-width="2" stroke-linejoin="round"/><path d="M94 32 L106 27 M95.5 21 L104.5 16 M97.5 10 L102.5 6" stroke="#e0a72e" stroke-width="2" stroke-linecap="round"/>';

const NOVAS = {
  // ---- cabeça ----
  'tiara-unicornio': {
    cabeca: (c) => {
      const [fx1, fy1] = curvaCabeca(0.3); const [fx2, fy2] = curvaCabeca(0.7);
      const [ax, ay] = curvaCabeca(0.12); const [bx, by] = curvaCabeca(0.88);
      const chifre = c.esp === 'unicornio'
        ? `<path d="${estrelaPath(100, 37, 8)}" fill="#fff" stroke="#c59bff" stroke-width="1.6"/>`
        : '<path d="M91 40 L100 2 L109 40 Z" fill="#fff4c2" stroke="#e0a72e" stroke-width="2" stroke-linejoin="round"/><path d="M93 32 L106 27 M95 22 L105 17 M97 12 L103 9" stroke="#f0b84a" stroke-width="2" stroke-linecap="round"/><path d="M96 36 L99 8" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>';
      return `<path d="M50 68 Q100 6 150 68" fill="none" ${linha('#d66aa8', 8)}/><path d="M50 68 Q100 6 150 68" fill="none" ${linha('#ff9fd0', 5)}/>`
        + `${chifre}${folhinha(fx1 - 9, fy1 + 2, 30)}${florzinha(fx1, fy1, 13, '#c59bff')}${folhinha(fx2 + 9, fy2 + 2, -30)}${florzinha(fx2, fy2, 13, '#8fc8ff')}${florzinha(ax, ay, 9, '#ffd36e', '#fff')}${florzinha(bx, by, 9, '#ff8fb1', '#fff')}`;
    },
  },
  pirata: {
    cabeca: (c) => chapeu(c, '<path d="M48 48 Q54 18 74 22 Q86 2 100 2 Q114 2 126 22 Q146 18 152 48 Q100 32 48 48 Z" fill="#2b2233" stroke="#16111c" stroke-width="2.4" stroke-linejoin="round"/>'
      + '<path d="M52 45 Q100 31 148 45" stroke="#ffd36e" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
      + '<path d="M90 33 L110 23 M90 23 L110 33" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="100" cy="17" r="7.5" fill="#fff"/><rect x="96" y="21" width="8" height="5" rx="1.5" fill="#fff"/><circle cx="97.2" cy="16.5" r="1.8" fill="#2b2233"/><circle cx="102.8" cy="16.5" r="1.8" fill="#2b2233"/>'
      + '<path d="M126 22 Q140 2 156 -2 Q146 12 134 24 Z" fill="#e5484d" stroke="#b8323a" stroke-width="1.6" stroke-linejoin="round"/><path d="M60 30 Q70 22 78 26" stroke="#fff" stroke-opacity=".2" stroke-width="3" fill="none" stroke-linecap="round"/>'),
  },
  'coroa-flores': {
    cabeca: () => {
      const cores = ['#ff8fb1', '#ffd36e', '#c59bff', '#ffffff', '#8fc8ff', '#ff8fb1', '#ffd36e'];
      let s = '<path d="M50 68 Q100 6 150 68" fill="none" stroke="#4fae5f" stroke-width="4" stroke-linecap="round"/>';
      for (let k = 0; k < 6; k++) { const [x, y] = curvaCabeca(0.1 + ((k + 0.5) * 0.8) / 6); s += folhinha(x, y - 6, -40 + k * 16); }
      cores.forEach((cor, k) => { const [x, y] = curvaCabeca(0.08 + (k * 0.84) / 6); s += florzinha(x, y, k === 3 ? 13 : 11, cor, cor === '#ffd36e' ? '#ff8fb1' : '#ffd36e'); });
      return s;
    },
  },
  bruxinha: {
    cabeca: (c) => chapeu(c, '<ellipse cx="100" cy="42" rx="48" ry="9.5" fill="#5c3591" stroke="#3d2066" stroke-width="2.2"/>'
      + '<path d="M72 41 Q82 14 94 -10 Q103 -30 128 -30 Q110 -20 109 -2 Q112 20 128 41 Q100 47 72 41 Z" fill="#7d4cc0" stroke="#3d2066" stroke-width="2.2" stroke-linejoin="round"/>'
      + '<path d="M75 33 Q100 39 125 33 L127 41 Q100 47 73 41 Z" fill="#ffd36e" stroke="#d99a1e" stroke-width="1.6" stroke-linejoin="round"/>'
      + `<path d="${estrelaPath(100, 37, 5.5)}" fill="#fff" stroke="#d99a1e" stroke-width="1"/><path d="${estrelaPath(96, 10, 4)}" fill="#ffd36e"/><path d="${estrelaPath(110, -14, 3)}" fill="#ffd36e"/><circle cx="88" cy="24" r="1.6" fill="#ffd36e"/><path d="M86 30 Q92 8 100 -8" stroke="#fff" stroke-opacity=".22" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
  },
  gorro: {
    cabeca: (c) => '<path d="M50 62 Q46 12 100 8 Q154 12 150 62 Z" fill="#4fb3ff" stroke="#2a7fd0" stroke-width="2.4" stroke-linejoin="round"/>'
      + '<path d="M74 58 Q72 30 86 14 M100 58 V10 M126 58 Q128 30 114 14" stroke="#2a7fd0" stroke-width="2" stroke-opacity=".45" fill="none" stroke-dasharray="4 4"/>'
      + '<path d="M47 56 Q100 70 153 56 L153 66 Q100 80 47 66 Z" fill="#ffd36e" stroke="#d99a1e" stroke-width="2.2" stroke-linejoin="round"/>'
      + '<path d="M58 61 V70 M70 63 V73 M82 65 V75 M94 66 V76 M106 66 V76 M118 65 V75 M130 63 V73 M142 61 V70" stroke="#d99a1e" stroke-width="1.6" stroke-opacity=".7"/>'
      + '<circle cx="100" cy="6" r="12" fill="#fff" stroke="#d6dbe6" stroke-width="2"/><circle cx="95" cy="2" r="4" fill="#fff"/><path d="M92 8 q3 3 6 0 M100 12 q3 2 6 -1" stroke="#d6dbe6" stroke-width="1.5" fill="none"/>'
      + (c.esp === 'unicornio' ? CHIFRE : ''),
  },
  // ---- laço ----
  estrela: {
    cabeca: () => `<g transform="rotate(14 136 44)"><path d="${estrelaPath(136, 44, 15, 7)}" fill="#ffd36e" stroke="#e0a72e" stroke-width="2.2" stroke-linejoin="round"/><path d="${estrelaPath(136, 44, 7, 3.2)}" fill="#fff4c2"/><circle cx="131" cy="38" r="2" fill="#fff"/></g><path d="M156 30 l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6Z" fill="#fff" stroke="#ffd36e" stroke-width="1"/>`,
  },
  // ---- óculos ----
  'oculos-redondos': {
    cabeca: () => '<path d="M63 88 L46 83 M137 88 L154 83" stroke="#b07a1e" stroke-width="3" stroke-linecap="round"/><circle cx="78" cy="90" r="15" fill="#e6f4ff" fill-opacity=".3" stroke="#d9a033" stroke-width="3.2"/><circle cx="122" cy="90" r="15" fill="#e6f4ff" fill-opacity=".3" stroke="#d9a033" stroke-width="3.2"/><path d="M93 88 Q100 82 107 88" stroke="#d9a033" stroke-width="3" fill="none"/><path d="M69 83 Q73 79 78 79 M113 83 Q117 79 122 79" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>',
  },
  'tapa-olho': {
    cabeca: () => `<path d="M112 84 Q88 62 52 56 M134 90 L156 96" stroke="#1a1420" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M109 86 Q110 76 122 76 Q135 76 136 88 Q136 104 122 105 Q108 104 109 86 Z" fill="#1a1420"/><path d="M114 84 Q116 80 121 80" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none" stroke-linecap="round"/><path d="${estrelaPath(122, 92, 4.5)}" fill="#ffd36e"/>`,
  },
  // ---- pescoço ----
  bandana: {
    cabeca: () => '<path d="M74 132 Q100 144 126 132 L100 172 Z" fill="#e5484d" stroke="#b8323a" stroke-width="2.2" stroke-linejoin="round"/><path d="M56 126 Q100 146 144 126 L146 135 Q100 156 54 135 Z" fill="#e5484d" stroke="#b8323a" stroke-width="2.2" stroke-linejoin="round"/>'
      + '<g fill="#fff"><circle cx="100" cy="152" r="2.2"/><circle cx="92" cy="144" r="1.8"/><circle cx="108" cy="144" r="1.8"/><circle cx="100" cy="162" r="1.8"/><circle cx="68" cy="134" r="1.8"/><circle cx="82" cy="140" r="1.6"/><circle cx="118" cy="140" r="1.6"/><circle cx="132" cy="134" r="1.8"/></g>',
  },
  'colar-havaiano': {
    cabeca: () => {
      const cores = ['#ff8fb1', '#ffd36e', '#c59bff', '#ff6f91', '#8fc8ff', '#ffd36e', '#ff8fb1', '#c59bff', '#ff6f91'];
      let s = '';
      cores.forEach((cor, k) => {
        const t = k / (cores.length - 1); const u = 1 - t;
        const x = u * u * 60 + 2 * u * t * 100 + t * t * 140; const y = u * u * 124 + 2 * u * t * 162 + t * t * 124;
        if (k % 2) s += folhinha(x, y + 7, k * 20);
        s += florzinha(x, y, 10, cor, '#fff3b0');
      });
      return s;
    },
  },
  // ---- costas ----
  'asas-borboleta': {
    atras: (c) => `<defs><linearGradient id="${c.g}ab" x1="1" y1=".6" x2="0" y2="0"><stop offset="0" stop-color="#ffb3d9"/><stop offset=".55" stop-color="#c59bff"/><stop offset="1" stop-color="#7fc8ff"/></linearGradient><linearGradient id="${c.g}ab2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36e"/><stop offset="1" stop-color="#ff8fb1"/></linearGradient></defs>`
      + `<g class="bc-asas">${espelhar(`<path d="M96 138 C76 92 30 50 14 78 C2 102 30 136 96 146 Z" fill="url(#${c.g}ab)" stroke="#8a4fc0" stroke-width="2.4" stroke-linejoin="round"/><path d="M96 150 C64 150 28 164 34 190 C40 212 78 196 96 156 Z" fill="url(#${c.g}ab2)" stroke="#c05a8f" stroke-width="2.4" stroke-linejoin="round"/><circle cx="34" cy="92" r="8" fill="#fff" opacity=".75"/><circle cx="50" cy="112" r="5" fill="#ffd36e" opacity=".9"/><circle cx="28" cy="110" r="3.5" fill="#fff" opacity=".7"/><circle cx="50" cy="182" r="6" fill="#fff" opacity=".7"/><circle cx="62" cy="166" r="3.5" fill="#c59bff"/>`)}</g>`,
  },
  'asas-fada': {
    atras: (c) => `<defs><linearGradient id="${c.g}af" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#b8e4ff" stop-opacity=".75"/></linearGradient></defs>`
      + `<g class="bc-asas">${espelhar(`<path d="M96 136 C82 80 54 30 36 42 C20 54 46 112 96 144 Z" fill="url(#${c.g}af)" stroke="#7fb8ee" stroke-width="2.2" stroke-linejoin="round"/><path d="M96 150 C70 152 40 172 48 190 C58 206 84 178 96 154 Z" fill="url(#${c.g}af)" stroke="#7fb8ee" stroke-width="2.2" stroke-linejoin="round"/><path d="M90 136 C78 100 60 66 44 52 M90 152 C72 162 58 176 54 186" stroke="#7fb8ee" stroke-width="1.4" fill="none" opacity=".7"/><path d="${estrelaPath(48, 74, 5, 2)}" fill="#ffd36e"/><circle cx="62" cy="104" r="2.2" fill="#fff"/><circle cx="58" cy="182" r="2" fill="#ffd36e"/>`)}</g>`,
  },
  capa: {
    atras: () => '<g class="bc-capa"><path d="M60 112 Q100 128 140 112 Q166 150 192 198 Q172 208 152 200 Q128 210 100 204 Q72 210 48 200 Q28 208 8 198 Q34 150 60 112 Z" fill="#e5484d" stroke="#a82a34" stroke-width="2.4" stroke-linejoin="round"/><path d="M60 112 Q36 150 14 194" stroke="#ffd36e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M140 112 Q164 150 186 194" stroke="#ffd36e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 166 Q26 182 20 192 M166 166 Q174 182 180 192" stroke="#ff8a8f" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g>',
    sobre: () => '<path d="M62 126 Q72 140 86 138 L80 130 Z M138 126 Q128 140 114 138 L120 130 Z" fill="#e5484d" stroke="#a82a34" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="138" r="8.5" fill="#ffd36e" stroke="#d99a1e" stroke-width="2"/><path d="M101 132 L96 139 H101 L99 144 L104.5 137 H100 Z" fill="#e5484d"/>',
  },
  mochila: {
    atras: () => '<rect x="34" y="104" width="132" height="80" rx="22" fill="#5bb6ff" stroke="#2a7fd0" stroke-width="2.4"/><rect x="28" y="132" width="22" height="40" rx="9" fill="#ffd36e" stroke="#d99a1e" stroke-width="2"/><rect x="150" y="132" width="22" height="40" rx="9" fill="#ffd36e" stroke="#d99a1e" stroke-width="2"/><path d="M28 142 H50 M150 142 H172" stroke="#d99a1e" stroke-width="2"/><path d="M44 114 Q48 108 56 106" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>',
    sobre: () => '<path d="M72 128 Q66 152 72 176 M128 128 Q134 152 128 176" stroke="#2a7fd0" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M72 128 Q66 152 72 176 M128 128 Q134 152 128 176" stroke="#5bb6ff" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="65" y="150" width="11" height="8" rx="2" fill="#ffd36e" stroke="#d99a1e" stroke-width="1.4"/><rect x="124" y="150" width="11" height="8" rx="2" fill="#ffd36e" stroke="#d99a1e" stroke-width="1.4"/>',
  },
  // ---- roupas ----
  tutu: {
    corpo: (c) => recorte(c, `<rect x="40" y="100" width="120" height="100" fill="#ffd6e7"/><path d="${coracao(100, 140, 0.5)}" fill="#ff6fa5"/><path d="M70 116 Q100 128 130 116" stroke="#ffb3d1" stroke-width="4" fill="none"/>`),
    sobre: () => '<g transform="translate(100 154) scale(.9 .8) translate(-100 -158)"><path d="M46 160 L36 178 Q44 186 54 180 Q62 190 72 182 Q80 192 90 184 Q100 194 110 184 Q120 192 128 182 Q138 190 146 180 Q156 186 164 178 L154 160 Q100 178 46 160 Z" fill="#ffb3d1" stroke="#f27aa8" stroke-width="2" stroke-linejoin="round"/>'
      + '<path d="M50 158 L44 172 Q52 178 60 173 Q68 181 78 175 Q88 182 100 176 Q112 182 122 175 Q132 181 140 173 Q148 178 156 172 L150 158 Q100 174 50 158 Z" fill="#ffd6e7" stroke="#f27aa8" stroke-width="1.6" stroke-linejoin="round"/>'
      + '<path d="M52 157 Q100 172 148 157" stroke="#f27aa8" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M52 157 Q100 172 148 157" stroke="#ff9fc6" stroke-width="3" fill="none" stroke-linecap="round"/>'
      + '<g fill="#fff"><circle cx="66" cy="174" r="1.6"/><circle cx="86" cy="178" r="1.4"/><circle cx="114" cy="178" r="1.4"/><circle cx="134" cy="174" r="1.6"/><circle cx="100" cy="182" r="1.6"/></g></g>',
  },
  marinheiro: {
    corpo: (c) => recorte(c, '<rect x="40" y="100" width="120" height="100" fill="#ffffff"/><path d="M40 178 H160 M40 184 H160" stroke="#2f4f9e" stroke-width="3"/>'),
    sobre: () => `${mangas('#ffffff', '#9aa6bb', '#2f4f9e')}<path d="M60 124 Q100 140 140 124 L128 146 L100 166 L72 146 Z" fill="#2f4f9e" stroke="#1f356e" stroke-width="2" stroke-linejoin="round"/><path d="M68 130 Q100 144 132 130 L124 144 L100 160 L76 144 Z" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M100 160 L88 172 L92 158 Z M100 160 L112 172 L108 158 Z" fill="#e5484d" stroke="#b8323a" stroke-width="1.4" stroke-linejoin="round"/><circle cx="100" cy="160" r="4.5" fill="#e5484d" stroke="#b8323a" stroke-width="1.4"/>`,
  },
  sueter: {
    corpo: (c) => recorte(c, '<rect x="40" y="100" width="120" height="100" fill="#ff8fb1"/><path d="M60 110 V190 M70 110 V190 M80 110 V190 M90 110 V190 M110 110 V190 M120 110 V190 M130 110 V190 M140 110 V190" stroke="#f0709a" stroke-width="2" stroke-opacity=".5"/><rect x="40" y="176" width="120" height="20" fill="#e5487a"/><path d="M50 176 V190 M58 176 V190 M66 176 V190 M74 176 V190 M82 176 V190 M90 176 V190 M98 176 V190 M106 176 V190 M114 176 V190 M122 176 V190 M130 176 V190 M138 176 V190 M146 176 V190" stroke="#c93466" stroke-width="1.6"/>'
      + `<path d="${coracao(100, 154, 0.95)}" fill="#fff"/><path d="${coracao(100, 154, 0.72)}" fill="#e5484d"/>`),
    sobre: () => `${mangas('#ff8fb1', '#e5487a', '#e5487a')}<path d="M70 130 Q100 144 130 130" stroke="#e5487a" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  },
  // ---- fantasias completas ----
  abelha: {
    atras: () => `<g class="bc-asas">${espelhar('<ellipse cx="54" cy="112" rx="28" ry="17" transform="rotate(-32 54 112)" fill="#eef8ff" fill-opacity=".85" stroke="#8fc8ff" stroke-width="2.2"/><ellipse cx="52" cy="140" rx="20" ry="12" transform="rotate(-12 52 140)" fill="#eef8ff" fill-opacity=".85" stroke="#8fc8ff" stroke-width="2.2"/><path d="M76 122 Q56 112 38 100" stroke="#8fc8ff" stroke-width="1.4" fill="none"/>')}</g>`,
    corpo: (c) => recorte(c, '<rect x="40" y="100" width="120" height="100" fill="#ffd23f"/><rect x="40" y="140" width="120" height="11" fill="#2a2135"/><rect x="40" y="162" width="120" height="11" fill="#2a2135"/><rect x="40" y="183" width="120" height="11" fill="#2a2135"/><path d="M66 124 Q76 118 84 122" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    sobre: () => mangas('#ffd23f', '#2a2135', '#2a2135'),
    cabeca: (c) => antenas(c, '#2a2135', '#ffd23f'),
  },
  joaninha: {
    atras: () => espelhar('<ellipse cx="50" cy="150" rx="18" ry="28" transform="rotate(18 50 150)" fill="#e5484d" stroke="#8f1f2a" stroke-width="2.2"/><circle cx="44" cy="142" r="4" fill="#2a2135"/><circle cx="50" cy="162" r="3.5" fill="#2a2135"/>'),
    corpo: (c) => recorte(c, '<rect x="40" y="100" width="120" height="100" fill="#e5484d"/><rect x="40" y="112" width="120" height="14" fill="#2a2135"/><rect x="98.5" y="120" width="3" height="80" fill="#2a2135"/><g fill="#2a2135"><circle cx="78" cy="146" r="7"/><circle cx="122" cy="146" r="7"/><circle cx="84" cy="170" r="6"/><circle cx="116" cy="170" r="6"/><circle cx="66" cy="164" r="4"/><circle cx="134" cy="164" r="4"/></g><path d="M64 132 Q74 128 82 131" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    sobre: () => mangas('#2a2135', '#16111c', '#e5484d'),
    cabeca: (c) => antenas(c, '#2a2135', '#e5484d'),
  },
  astronauta: {
    atras: () => espelhar('<rect x="34" y="116" width="22" height="52" rx="10" fill="#e8edf6" stroke="#8d99ae" stroke-width="2.2"/><rect x="34" y="130" width="22" height="6" fill="#ff8a3d"/><rect x="39" y="110" width="12" height="8" rx="2" fill="#8d99ae"/>'),
    corpo: (c) => recorte(c, `<rect x="40" y="100" width="120" height="100" fill="#f4f6fb"/><path d="M58 112 Q52 150 66 186" stroke="#d5dbe7" stroke-width="8" fill="none"/><rect x="86" y="144" width="28" height="22" rx="5" fill="#d5dbe7" stroke="#8d99ae" stroke-width="1.6"/><circle cx="93" cy="151" r="3" fill="#e5484d"/><circle cx="102" cy="151" r="3" fill="#3e7bfa"/><circle cx="108" cy="159" r="3" fill="#ffd23f"/><rect x="89" y="157" width="12" height="4" rx="2" fill="#5fd38d"/><rect x="40" y="174" width="120" height="7" fill="#b8c2d4"/><circle cx="128" cy="140" r="7.5" fill="#3e7bfa" stroke="#fff" stroke-width="1.6"/><path d="${estrelaPath(128, 140, 4.5, 2)}" fill="#fff"/>`),
    sobre: () => `${mangas('#f4f6fb', '#8d99ae', '#ff8a3d')}<ellipse cx="78" cy="185" rx="17" ry="10" fill="#f4f6fb" stroke="#8d99ae" stroke-width="2.2"/><ellipse cx="122" cy="185" rx="17" ry="10" fill="#f4f6fb" stroke="#8d99ae" stroke-width="2.2"/><path d="M62 188 Q78 196 94 188 M106 188 Q122 196 138 188" stroke="#8d99ae" stroke-width="3" fill="none"/>`,
    cabeca: (c) => {
      const h = BOLHA[c.esp];
      const furos = h.furos.map(([x, y, a, rx = 15]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="4" transform="rotate(${a} ${x} ${y})" fill="#cfd6e4" stroke="#8d99ae" stroke-width="1.6"/>`).join('');
      return '<ellipse cx="100" cy="138" rx="50" ry="10" fill="#cfd6e4" stroke="#8d99ae" stroke-width="2.2"/>'
        + `<ellipse cx="100" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="#bfe3ff" fill-opacity=".22" stroke="#eef3fb" stroke-width="6"/><ellipse cx="100" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="none" stroke="#8d99ae" stroke-width="1.6"/>`
        + `<path d="M${100 - h.rx * 0.78} ${h.cy - h.ry * 0.3} Q${100 - h.rx * 0.7} ${h.cy - h.ry * 0.82} ${100 - h.rx * 0.2} ${h.cy - h.ry * 0.94}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".75"/><circle cx="${100 + h.rx * 0.6}" cy="${h.cy - h.ry * 0.62}" r="4" fill="#fff" opacity=".7"/>${furos}`;
    },
  },
};

const CHAPEUS_ANTIGOS = ['festa', 'cartola', 'coroa', 'bone'];
export const ARTE_ROUPAS = { ...NOVAS };
for (const [id, a] of Object.entries(ARTE_ANTIGA)) ARTE_ROUPAS[id] = { cabeca: CHAPEUS_ANTIGOS.includes(id) ? (c) => chapeu(c, a.svg()) : a.svg };

// Recorte da vitrine da loja: mostra o bichinho da criança usando o item.
export const VITRINE = { cabeca: '14 -42 172 124', laco: '88 0 92 80', olhos: '32 52 136 80', pescoco: '34 92 132 106', costas: '-14 14 228 186', corpo: '-6 -26 212 226' };

const SUJEIRA = [[76, 142, 11, 8], [128, 162, 9, 7], [114, 62, 8, 6], [70, 72, 6, 5], [140, 116, 7, 5], [96, 176, 7, 5]];

// O bichinho vestido. opcoes.vb troca o recorte (vitrine, retrato) e opcoes.classe soma uma classe.
export function svgBichinho(especie, vestindo = {}, opcoes = {}) {
  const p = PALETAS[especie] ?? PALETAS.gato;
  const g = `bcg${++sequencia}`;
  const c = { esp: PALETAS[especie] ? especie : 'gato', p, g };
  const arte = (lugar) => ARTE_ROUPAS[vestindo?.[lugar]];
  const parte = (nome, lugares) => lugares.map((l) => (arte(l)?.[nome] ? arte(l)[nome](c) : '')).join('');
  const almofadas = ['gato', 'cachorro', 'coelho'].includes(especie) ? `<ellipse cx="78" cy="186" rx="6" ry="3" fill="${p.interna}"/><ellipse cx="122" cy="186" rx="6" ry="3" fill="${p.interna}"/>` : '';
  const pes = especie === 'unicornio' ? '#d9c6f0' : p.corpo;
  const listras = especie === 'dino' ? `<path d="M80 150 Q100 154 120 150 M78 162 Q100 166 122 162 M84 173 Q100 177 116 173" stroke="${p.linha}" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>` : '';
  return `<svg viewBox="${opcoes.vb ?? '0 -30 200 230'}" class="bc-svg${opcoes.classe ? ` ${opcoes.classe}` : ''}" aria-hidden="true">
<defs><radialGradient id="${g}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${p.claro}"/><stop offset="1" stop-color="${p.corpo}"/></radialGradient><clipPath id="${g}c"><ellipse cx="100" cy="150" rx="45" ry="39"/></clipPath></defs>
<ellipse class="bc-sombra" cx="100" cy="194" rx="54" ry="7" fill="#000" opacity=".13"/>
<g class="bc-pet">
  <g class="bc-costas">${parte('atras', ['costas', 'corpo'])}</g>
  <g class="bc-rabo">${rabo(especie, p, g)}</g>
  <g class="bc-corpo">
    <ellipse cx="100" cy="150" rx="45" ry="39" fill="url(#${g})" ${contorno(p)}/>
    <ellipse cx="100" cy="160" rx="27" ry="24" fill="${p.barriga}"/>${listras}
    ${parte('corpo', ['corpo'])}
    <ellipse cx="100" cy="150" rx="45" ry="39" fill="none" ${contorno(p)}/>
    <g class="bc-braco bc-braco-e"><ellipse cx="61" cy="150" rx="10" ry="15" transform="rotate(22 61 150)" fill="${p.corpo}" ${contorno(p)}/></g>
    <g class="bc-braco bc-braco-d"><ellipse cx="139" cy="150" rx="10" ry="15" transform="rotate(-22 139 150)" fill="${p.corpo}" ${contorno(p)}/></g>
    <ellipse cx="78" cy="185" rx="16" ry="9" fill="${pes}" ${contorno(p)}/><ellipse cx="122" cy="185" rx="16" ry="9" fill="${pes}" ${contorno(p)}/>${almofadas}
    ${parte('sobre', ['costas', 'corpo'])}
  </g>
  <g class="bc-cabeca">
    ${atras(especie, p)}
    <ellipse cx="100" cy="86" rx="56" ry="50" fill="url(#${g})" ${contorno(p)}/>
    ${marcas(especie, p)}
    <g class="bc-olhos">${olho(78)}${olho(122)}</g>
    <g class="bc-olhos-fechados" stroke="${TINTA}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M68 92 Q78 99 88 92"/><path d="M112 92 Q122 99 132 92"/></g>
    <g class="bc-sobrancelhas" stroke="${TINTA}" stroke-width="2.6" stroke-linecap="round"><path d="M68 75 L86 69"/><path d="M132 75 L114 69"/></g>
    <ellipse cx="62" cy="106" rx="9" ry="6" fill="#ff8fb1" opacity=".45"/><ellipse cx="138" cy="106" rx="9" ry="6" fill="#ff8fb1" opacity=".45"/>
    ${bigodes(especie, p)}${nariz(especie, p)}${bocas(especie)}
    <path class="bc-lagrima" d="M70 102 Q66 110 70 113 Q74 110 70 102 Z" fill="#7fc8ff"/>
    ${frente(especie, p)}
    <g class="bc-sujeira">${SUJEIRA.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#8a6a4a" opacity=".55"/>`).join('')}</g>
    ${parte('cabeca', ['olhos', 'pescoco', 'cabeca', 'laco', 'costas', 'corpo'])}
  </g>
</g></svg>`;
}

// Só o rabinho (dica do esconde-esconde).
export function svgRabinho(especie) {
  const p = PALETAS[especie] ?? PALETAS.gato;
  const g = `bcg${++sequencia}`;
  return `<svg viewBox="122 92 80 100" class="bc-svg" aria-hidden="true"><defs><radialGradient id="${g}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${p.claro}"/><stop offset="1" stop-color="${p.corpo}"/></radialGradient></defs>${rabo(especie, p, g)}</svg>`;
}
