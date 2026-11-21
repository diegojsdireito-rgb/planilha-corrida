// Desenhos do mapa do Docinhos: cada lugar do caminho tem o seu cenário.
// Tudo em SVG pequeno (viewBox 100 × 100), colocado dos lados do caminho.

const svg = (corpo, vb = '0 0 100 100') => `<svg viewBox="${vb}" aria-hidden="true">${corpo}</svg>`;

// ---------- peças ----------
export const nuvem = () => svg('<path d="M18 70 a16 16 0 0 1 4 -31 a22 22 0 0 1 40 -9 a17 17 0 0 1 28 15 a13 13 0 0 1 -2 25 Z" fill="#fff"/><path d="M26 62 q14 6 28 0" stroke="#e8eefa" stroke-width="4" fill="none" stroke-linecap="round"/>');

const pirulito = (c1, c2) => svg(`<rect x="47" y="48" width="6" height="48" rx="3" fill="#f5efe6" stroke="#d9cfc0" stroke-width="1.5"/>
  <circle cx="50" cy="34" r="28" fill="${c1}" stroke="#fff" stroke-width="3"/>
  <path d="M50 34 m0 -5 a5 5 0 1 1 -5 5 a10 10 0 1 1 10 10 a15 15 0 1 1 -15 -15 a20 20 0 1 1 20 20" fill="none" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>
  <path d="M34 22 q6 -8 14 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M46 62 q4 4 8 0" stroke="${c1}" stroke-width="3" fill="none"/>`);

const casinha = (parede, telhado) => svg(`<rect x="18" y="46" width="64" height="44" rx="4" fill="${parede}"/>
  <path d="M10 50 L50 14 L90 50 Z" fill="${telhado}"/>
  <path d="M12 50 q6 8 12 0 q6 8 12 0 q6 8 12 0 q6 8 12 0 q6 8 12 0 q6 8 12 0 q4 6 6 0" fill="#fff"/>
  <rect x="42" y="64" width="16" height="26" rx="8" fill="#7a3f22"/><circle cx="54" cy="78" r="1.8" fill="#ffd34d"/>
  <rect x="24" y="58" width="12" height="12" rx="2" fill="#fff6b8" stroke="#fff" stroke-width="2"/><rect x="64" y="58" width="12" height="12" rx="2" fill="#fff6b8" stroke="#fff" stroke-width="2"/>
  <circle cx="30" cy="84" r="3" fill="#ef4b5f"/><circle cx="70" cy="84" r="3" fill="#2fb66a"/><circle cx="50" cy="30" r="5" fill="#ef4b5f" stroke="#fff" stroke-width="2"/>`);

const moranguinho = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -10 C10 -10 12 0 0 14 C-12 0 -10 -10 0 -10Z" fill="#ef4b5f"/><path d="M-6 -10 L0 -14 L6 -10 L0 -7Z" fill="#2fb66a"/>${[[-3, -3], [3, -1], [0, 4], [-4, 3]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="0.9" fill="#ffe08a"/>`).join('')}</g>`;
const arbustoMorango = () => svg(`<ellipse cx="50" cy="66" rx="40" ry="26" fill="#3fae5a"/><ellipse cx="34" cy="56" rx="22" ry="18" fill="#4fc46a"/><ellipse cx="64" cy="54" rx="24" ry="20" fill="#4fc46a"/>${moranguinho(30, 60)}${moranguinho(58, 50, 1.1)}${moranguinho(72, 70, 0.9)}${moranguinho(44, 76, 0.8)}`);

const cogumelo = (chapeu, pintas) => svg(`<path d="M40 60 Q38 84 44 92 H56 Q62 84 60 60 Z" fill="#fff6e8" stroke="#e8dcc6" stroke-width="2"/>
  <path d="M10 62 Q12 18 50 16 Q88 18 90 62 Q50 72 10 62 Z" fill="${chapeu}"/>
  <circle cx="34" cy="38" r="7" fill="${pintas}"/><circle cx="60" cy="30" r="6" fill="${pintas}"/><circle cx="70" cy="50" r="5" fill="${pintas}"/><circle cx="44" cy="54" r="4" fill="${pintas}"/>
  <path d="M22 40 q6 -14 20 -18" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`);

const arvoreMenta = () => svg(`<rect x="45" y="60" width="10" height="34" rx="3" fill="#8a5a36"/>
  <circle cx="50" cy="40" r="30" fill="#7fdc9a"/><circle cx="32" cy="52" r="18" fill="#5cc97f"/><circle cx="68" cy="52" r="18" fill="#5cc97f"/>
  ${[[38, 30], [58, 26], [50, 46], [30, 50], [70, 48], [62, 60]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="5" fill="#fff"/><path d="M-5 0 a5 5 0 0 0 10 0" fill="#2fb66a"/></g>`).join('')}`);

const balaMenta = () => svg('<path d="M10 40 L26 48 L26 60 L10 68Z M90 40 L74 48 L74 60 L90 68Z" fill="#bff2cf"/><rect x="24" y="34" width="52" height="40" rx="20" fill="#2fb66a"/><path d="M36 36 v36 M50 36 v36 M64 36 v36" stroke="#fff" stroke-width="5" opacity=".85"/>');

const lago = () => svg(`<ellipse cx="50" cy="60" rx="46" ry="26" fill="#3e8bff"/><ellipse cx="50" cy="56" rx="40" ry="20" fill="#7cc0ff"/>
  <path d="M22 56 q6 -5 12 0 t12 0 M54 64 q6 -5 12 0 t12 0 M38 48 q5 -4 10 0 t10 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
  <circle cx="72" cy="50" r="5" fill="#3a3fb0"/><circle cx="76" cy="47" r="1.6" fill="#fff"/>`, '0 0 100 90');

const barquinho = () => svg(`<path d="M18 62 H82 L70 80 H30 Z" fill="#ff7aa8"/><path d="M48 60 V18 L76 54 Z" fill="#fff"/><path d="M46 60 V24 L24 54 Z" fill="#ffd34d"/>
  <rect x="46" y="14" width="3" height="48" fill="#8a5a36"/><path d="M22 84 q8 -6 16 0 t16 0 t16 0 t16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`);

const mirtilos = () => svg(`${[[34, 56, 18], [60, 50, 20], [48, 72, 16], [72, 70, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4a5fc8"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.25}" fill="#a9b8ff"/><path d="M${x - 3} ${y - r + 3} l3 4 l3 -4" stroke="#2a2f80" stroke-width="2" fill="none"/>`).join('')}<path d="M52 30 q10 -14 22 -10 q-6 12 -22 10 Z" fill="#2fb66a"/>`);

const torre = (cor, bandeira) => svg(`<rect x="30" y="34" width="40" height="60" fill="${cor}"/><path d="M30 34 V26 H38 V34 H46 V26 H54 V34 H62 V26 H70 V34" fill="${cor}"/>
  <path d="M26 30 L50 4 L74 30 Z" fill="#7b4fd0"/><rect x="49" y="-6" width="2" height="12" fill="#5a3a22"/><path d="M51 -6 L64 -1 L51 4 Z" fill="${bandeira}"/>
  <path d="M44 94 V74 a6 6 0 0 1 12 0 V94 Z" fill="#5a3a7a"/><rect x="42" y="46" width="16" height="14" rx="8" fill="#fff6b8"/>
  ${[[34, 62], [62, 62], [36, 84], [64, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff" opacity=".7"/>`).join('')}`, '0 -10 100 110');

const cachoUva = () => svg(`${[[50, 30], [38, 42], [62, 42], [30, 56], [50, 54], [70, 56], [40, 68], [60, 68], [50, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#9b5cf6"/><circle cx="${x - 3}" cy="${y - 4}" r="3" fill="#d7c2ff"/>`).join('')}<path d="M50 20 q2 -10 10 -14" stroke="#5a3a22" stroke-width="3" fill="none"/><path d="M54 14 q14 -8 22 2 q-12 8 -22 -2 Z" fill="#2fb66a"/>`);

const coroa = () => svg('<path d="M14 70 L20 30 L36 50 L50 22 L64 50 L80 30 L86 70 Z" fill="#ffc61a" stroke="#e0a000" stroke-width="3" stroke-linejoin="round"/><rect x="14" y="68" width="72" height="12" rx="3" fill="#f0a400"/><circle cx="50" cy="56" r="6" fill="#ef4b5f"/><circle cx="30" cy="62" r="4" fill="#3e8bff"/><circle cx="70" cy="62" r="4" fill="#2fb66a"/>');

const estrelinha = () => svg('<path d="M50 6 L60 38 L94 40 L66 60 L76 94 L50 74 L24 94 L34 60 L6 40 L40 38Z" fill="#fff6b8" stroke="#ffd34d" stroke-width="4" stroke-linejoin="round"/>');

const placa = (texto, icone, cor) => `<div class="mapa-placa" style="--cor:${cor}"><span>${icone}</span><b>${texto}</b></div>`;

// Cenário de cada lugar: o que aparece dos lados do caminho (uma lista para sortear) e a cor da placa.
export const CENARIOS = [
  { pecas: [() => pirulito('#ff7aa8', '#fff'), () => pirulito('#ffb020', '#fff3c8'), arbustoMorango, () => casinha('#d9935a', '#ff7aa8'), arbustoMorango], placa: '#e0457b' },
  { pecas: [arvoreMenta, () => cogumelo('#ef4b5f', '#fff'), balaMenta, arvoreMenta, () => cogumelo('#ff9a1f', '#fff6b8')], placa: '#2fb66a' },
  { pecas: [lago, barquinho, mirtilos, lago, () => casinha('#a9c8ff', '#3e8bff')], placa: '#3e8bff' },
  { pecas: [() => torre('#c9b5ff', '#ffd34d'), cachoUva, coroa, () => torre('#b89cff', '#ff7aa8'), cachoUva], placa: '#8a4fd6' },
];
export { placa, estrelinha };
