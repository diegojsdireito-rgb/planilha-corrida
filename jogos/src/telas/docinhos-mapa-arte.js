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


// ---------- Praia de Caramelo ----------
const guardaSol = (c1, c2) => svg(`<rect x="48" y="30" width="4" height="64" rx="2" fill="#a86a3a"/>
  <path d="M8 40 Q50 -6 92 40 Z" fill="${c1}"/>
  <path d="M8 40 Q20 22 36 14 Q30 28 29 40 Z M50 40 Q50 18 50 10 Q60 14 71 40 Z" fill="${c2}"/>
  <path d="M8 40 q7 6 14 0 q7 6 14 0 q7 6 14 0 q7 6 14 0 q7 6 14 0 q7 6 14 0" fill="none" stroke="${c1}" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="50" cy="94" rx="30" ry="5" fill="#d99a4e" opacity=".5"/>`);
const castelinhoCaramelo = () => svg(`<path d="M14 92 V54 H26 V46 H34 V54 H44 V36 H56 V54 H66 V46 H74 V54 H86 V92 Z" fill="#e8a54b"/>
  <path d="M14 60 H86" stroke="#c97f2a" stroke-width="4"/><path d="M14 74 q9 -6 18 0 t18 0 t18 0 t18 0" stroke="#fff3d6" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M44 92 V80 a6 6 0 0 1 12 0 V92 Z" fill="#8a5222"/><rect x="49" y="18" width="2" height="18" fill="#8a5222"/><path d="M51 18 L64 23 L51 28 Z" fill="#ff7aa8"/>
  ${[[22, 66], [78, 66], [50, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff3d6"/>`).join('')}`);
const estrelaMar = () => svg(`<path d="M50 10 L60 38 L90 40 L66 58 L76 88 L50 70 L24 88 L34 58 L10 40 L40 38Z" fill="#ff8a5c" stroke="#e0603a" stroke-width="4" stroke-linejoin="round"/>
  ${[[50, 28], [64, 44], [58, 62], [42, 62], [36, 44], [50, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffd2b8"/>`).join('')}`);
const coqueiro = () => svg(`<path d="M50 94 Q46 60 54 34" stroke="#a86a3a" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M50 92 Q46 60 54 34" stroke="#c98a52" stroke-width="3" stroke-dasharray="4 6" fill="none"/>
  <path d="M54 34 Q30 20 10 36 Q32 30 54 34 Z M54 34 Q76 18 94 34 Q72 30 54 34 Z M54 34 Q44 10 24 10 Q42 18 54 34 Z M54 34 Q66 8 84 12 Q66 20 54 34 Z" fill="#3fae5a"/>
  <circle cx="48" cy="40" r="6" fill="#7a4124"/><circle cx="58" cy="41" r="6" fill="#8e4f2c"/>`);
const ondaCaramelo = () => svg(`<path d="M4 70 Q16 50 28 64 T52 64 T76 64 T100 62 V92 H4 Z" fill="#e8a54b"/>
  <path d="M4 70 Q16 50 28 64 T52 64 T76 64 T100 62" fill="none" stroke="#fff3d6" stroke-width="5" stroke-linecap="round"/>
  <path d="M14 82 q6 -4 12 0 M50 84 q6 -4 12 0" stroke="#c97f2a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="70" cy="40" r="4" fill="#fff" opacity=".8"/><circle cx="80" cy="30" r="2.5" fill="#fff" opacity=".8"/>`);

// ---------- Vulcão de Chocolate ----------
const vulcao = () => svg(`<path d="M30 18 q-6 -10 4 -14 q6 -8 14 -2 q10 -4 12 6 q8 4 2 10 Z" fill="#c7b6ad" opacity=".85"/>
  <path d="M6 96 L36 30 H64 L94 96 Z" fill="#6b3a22"/><path d="M6 96 L36 30 H44 L26 96 Z" fill="#7f4a2c"/>
  <path d="M36 30 H64 L60 40 Q56 52 58 64 Q54 72 50 62 Q46 50 44 58 Q40 66 38 54 Q38 44 36 30 Z" fill="#3a1a0c"/>
  <path d="M38 30 H62" stroke="#ff7a1f" stroke-width="4" stroke-linecap="round"/>
  <circle cx="44" cy="24" r="4" fill="#3a1a0c"/><circle cx="56" cy="20" r="3" fill="#3a1a0c"/><circle cx="50" cy="14" r="2.5" fill="#ff9a1f"/>`, '0 -4 100 104');
const bombom = () => svg(`<path d="M18 50 L4 36 L6 64 Z M82 50 L96 36 L94 64 Z" fill="#ffd34d"/>
  <circle cx="50" cy="50" r="32" fill="#5a2e17"/><circle cx="50" cy="50" r="32" fill="url(#)" opacity="0"/>
  <path d="M26 44 q12 -10 24 0 t24 0" stroke="#a3643c" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="38" cy="36" r="6" fill="#fff" opacity=".35"/><circle cx="50" cy="22" r="5" fill="#ef4b5f"/>`);
const barraChocolate = () => svg(`<rect x="22" y="12" width="56" height="80" rx="6" fill="#7a4124"/>
  ${[0, 1].map((cx) => [0, 1, 2].map((cy) => `<rect x="${26 + cx * 26}" y="${16 + cy * 18}" width="22" height="14" rx="3" fill="#8e4f2c"/><path d="M${29 + cx * 26} ${19 + cy * 18} h14" stroke="#b97a52" stroke-width="2.5" stroke-linecap="round"/>`).join('')).join('')}
  <path d="M18 66 L82 60 L82 96 L18 96 Z" fill="#e0457b"/><path d="M18 66 L82 60" stroke="#ffd34d" stroke-width="3"/><text x="50" y="86" font-size="13" font-weight="900" fill="#fff" text-anchor="middle" font-family="sans-serif">CHOCO</text>`);
const rochaChocolate = () => svg(`<path d="M10 88 L18 58 L40 44 L66 48 L88 66 L90 88 Z" fill="#4a2414"/>
  <path d="M18 58 L40 44 L66 48 L88 66 Q70 58 60 64 Q48 54 36 62 Q26 56 18 58 Z" fill="#7a4124"/>
  <path d="M30 60 v10 M48 58 v14 M64 60 v8" stroke="#7a4124" stroke-width="5" stroke-linecap="round"/>
  <circle cx="72" cy="40" r="3" fill="#ff9a1f"/><circle cx="26" cy="40" r="2" fill="#ffd34d"/>`);

// ---------- Nuvens de Algodão-doce ----------
const algodaoDoce = (cor) => svg(`<path d="M44 58 L50 96 L56 58 Z" fill="#fff6e8" stroke="#e8dcc6" stroke-width="2"/>
  <path d="M46 70 L54 66 M47 80 L53 77" stroke="#ff7aa8" stroke-width="2.5"/>
  ${[[50, 30, 20], [32, 38, 15], [68, 38, 15], [40, 52, 14], [60, 52, 14], [50, 18, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cor}"/>`).join('')}
  <circle cx="40" cy="26" r="6" fill="#fff" opacity=".55"/>`);
const balaoAr = () => svg(`<path d="M50 6 C78 6 88 30 80 48 C74 60 60 66 58 72 H42 C40 66 26 60 20 48 C12 30 22 6 50 6 Z" fill="#ff7aa8"/>
  <path d="M50 6 C62 6 66 30 62 48 C60 60 56 66 55 72 H45 C44 66 40 60 38 48 C34 30 38 6 50 6 Z" fill="#fff3c8"/>
  <path d="M50 6 C54 20 54 50 52 72 H48 C46 50 46 20 50 6 Z" fill="#3e8bff"/>
  <path d="M43 72 L40 82 M57 72 L60 82" stroke="#8a5a36" stroke-width="2"/><rect x="38" y="82" width="24" height="14" rx="3" fill="#c98a52"/><path d="M38 86 H62" stroke="#a86a3a" stroke-width="2"/>`);
const nuvemFofa = (cor) => svg(`<path d="M14 70 a16 16 0 0 1 6 -30 a22 22 0 0 1 40 -10 a18 18 0 0 1 28 18 a12 12 0 0 1 -2 22 Z" fill="${cor}"/>
  <circle cx="40" cy="54" r="3" fill="#7a2a4a"/><circle cx="60" cy="54" r="3" fill="#7a2a4a"/><path d="M45 61 q5 5 10 0" stroke="#7a2a4a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="34" cy="62" r="4" fill="#ff8fb5" opacity=".7"/><circle cx="66" cy="62" r="4" fill="#ff8fb5" opacity=".7"/>`);
const arcoIrisNuvem = () => svg(`${['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6'].map((c, k) => `<path d="M${10 + k * 5} 70 A${40 - k * 5} ${40 - k * 5} 0 0 1 ${90 - k * 5} 70" stroke="${c}" stroke-width="5.5" fill="none"/>`).join('')}
  <path d="M0 76 a10 10 0 0 1 8 -16 a12 12 0 0 1 20 4 a8 8 0 0 1 2 14 Z M70 78 a10 10 0 0 1 8 -16 a12 12 0 0 1 20 4 a8 8 0 0 1 -2 14 Z" fill="#fff"/>`);

// ---------- Galáxia de Jujuba ----------
const planeta = (c1, c2) => svg(`<ellipse cx="50" cy="54" rx="46" ry="12" fill="none" stroke="#ffd34d" stroke-width="5" transform="rotate(-14 50 54)"/>
  <circle cx="50" cy="50" r="26" fill="${c1}"/><path d="M28 42 q22 -8 44 0 M26 56 q24 8 48 0" stroke="${c2}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="40" cy="40" r="6" fill="#fff" opacity=".4"/>
  <path d="M8 60 A46 12 0 0 0 92 48" stroke="#ffd34d" stroke-width="5" fill="none" transform="rotate(-14 50 54)"/>`);
const foguete = () => svg(`<path d="M50 6 C66 18 70 40 66 66 H34 C30 40 34 18 50 6 Z" fill="#f4f1ff"/>
  <path d="M50 6 C58 12 62 20 64 28 H36 C38 20 42 12 50 6 Z" fill="#ef4b5f"/>
  <circle cx="50" cy="42" r="9" fill="#3e8bff" stroke="#9aa0c8" stroke-width="3"/><circle cx="47" cy="39" r="3" fill="#fff" opacity=".7"/>
  <path d="M34 50 L20 70 L34 66 Z M66 50 L80 70 L66 66 Z" fill="#ef4b5f"/>
  <path d="M40 66 Q50 96 60 66 Z" fill="#ff9a1f"/><path d="M44 66 Q50 84 56 66 Z" fill="#ffd34d"/>`);
const jujubas = () => svg(`${[[30, 62, '#ef4b5f'], [52, 54, '#2fb66a'], [72, 66, '#ffd21f'], [42, 78, '#9b5cf6'], [64, 82, '#ff9a1f'], [52, 34, '#3e8bff']].map(([x, y, c]) => `<path d="M${x - 11} ${y + 9} Q${x - 12} ${y - 12} ${x} ${y - 12} Q${x + 12} ${y - 12} ${x + 11} ${y + 9} Z" fill="${c}"/><path d="M${x - 5} ${y - 6} q3 -3 6 -2" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>${[[-5, 2], [3, -2], [5, 5], [-2, 6]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="1" fill="#fff" opacity=".8"/>`).join('')}`).join('')}`);
const lua = () => svg(`<path d="M62 8 A42 42 0 1 0 92 70 A34 34 0 1 1 62 8 Z" fill="#fff3b0"/>
  <circle cx="34" cy="50" r="6" fill="#f2df7a"/><circle cx="48" cy="74" r="4" fill="#f2df7a"/><circle cx="30" cy="70" r="3" fill="#f2df7a"/>
  <circle cx="44" cy="48" r="2.4" fill="#5a4a20"/><path d="M38 60 q6 4 12 0" stroke="#5a4a20" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
const cometa = () => svg(`<path d="M10 90 L66 34" stroke="#b98cff" stroke-width="10" stroke-linecap="round" opacity=".5"/><path d="M22 86 L68 38" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
  <path d="M72 14 L78 28 L94 30 L82 40 L86 56 L72 48 L58 56 L62 40 L50 30 L66 28Z" fill="#ffd34d" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`);

const estrelinha = () => svg('<path d="M50 6 L60 38 L94 40 L66 60 L76 94 L50 74 L24 94 L34 60 L6 40 L40 38Z" fill="#fff6b8" stroke="#ffd34d" stroke-width="4" stroke-linejoin="round"/>');

const placa = (texto, icone, cor) => `<div class="mapa-placa" style="--cor:${cor}"><span>${icone}</span><b>${texto}</b></div>`;

// Cenário de cada lugar: o que aparece dos lados do caminho (uma lista para sortear) e a cor da placa.
export const CENARIOS = [
  { pecas: [() => pirulito('#ff7aa8', '#fff'), () => pirulito('#ffb020', '#fff3c8'), arbustoMorango, () => casinha('#d9935a', '#ff7aa8'), arbustoMorango], placa: '#e0457b' },
  { pecas: [arvoreMenta, () => cogumelo('#ef4b5f', '#fff'), balaMenta, arvoreMenta, () => cogumelo('#ff9a1f', '#fff6b8')], placa: '#2fb66a' },
  { pecas: [lago, barquinho, mirtilos, lago, () => casinha('#a9c8ff', '#3e8bff')], placa: '#3e8bff' },
  { pecas: [() => torre('#c9b5ff', '#ffd34d'), cachoUva, coroa, () => torre('#b89cff', '#ff7aa8'), cachoUva], placa: '#8a4fd6' },
  { pecas: [() => guardaSol('#e8a54b', '#fff3d6'), castelinhoCaramelo, estrelaMar, coqueiro, ondaCaramelo, () => guardaSol('#ff7aa8', '#fff')], placa: '#d9822b' },
  { pecas: [vulcao, bombom, barraChocolate, rochaChocolate, bombom, barraChocolate, vulcao], placa: '#7a4124' },
  { pecas: [() => algodaoDoce('#ffb3d9'), balaoAr, () => nuvemFofa('#fff'), arcoIrisNuvem, () => algodaoDoce('#b3dcff'), () => nuvemFofa('#ffe3f2')], placa: '#e0579b' },
  { pecas: [() => planeta('#ff7aa8', '#ffc2d8'), foguete, jujubas, lua, cometa, () => planeta('#7fdc9a', '#c9f5d6')], placa: '#5b3fd0' },
];
export { placa, estrelinha };
