// Desenhos do mapa da Pescaria: cada lugar do caminho tem o seu cenário.
// Tudo em SVG pequeno (viewBox 100 × 100), colocado dos lados do caminho.

const svg = (corpo, vb = '0 0 100 100') => `<svg viewBox="${vb}" aria-hidden="true">${corpo}</svg>`;

// ---------- Lagoa ----------
const vitoriaRegia = () => svg(`<ellipse cx="50" cy="66" rx="44" ry="18" fill="#3fae5a"/><path d="M50 66 L94 62 A44 18 0 0 0 80 54 Z" fill="#7fd89a"/>
  <ellipse cx="50" cy="63" rx="38" ry="13" fill="#5cc97f"/><path d="M50 63 L88 61" stroke="#3fae5a" stroke-width="2"/>
  <g transform="translate(40 50)"><path d="M0 0 C-10 -4 -12 -16 -4 -20 C-2 -12 0 -8 0 0Z M0 0 C10 -4 12 -16 4 -20 C2 -12 0 -8 0 0Z M0 0 C-4 -10 -2 -22 0 -26 C2 -22 4 -10 0 0Z" fill="#ff9cc0" stroke="#fff" stroke-width="1.5"/><circle cy="-4" r="3" fill="#ffd34d"/></g>`);

const taboa = () => svg(`${[[34, 92, 30, -6], [50, 94, 14, 0], [66, 92, 26, 7]].map(([x, y, t, inc]) => `<path d="M${x} ${y} Q${x + inc / 2} ${(y + t) / 2} ${x + inc} ${t}" stroke="#3fae5a" stroke-width="3" fill="none"/><rect x="${x + inc - 4}" y="${t}" width="8" height="22" rx="4" fill="#8a5a36" transform="rotate(${inc} ${x + inc} ${t + 10})"/>`).join('')}
  <path d="M24 94 Q30 60 20 40 M76 94 Q70 62 82 44 M44 94 Q42 70 36 56" stroke="#5cc97f" stroke-width="4" fill="none" stroke-linecap="round"/>`);

const sapo = () => svg(`<ellipse cx="50" cy="78" rx="40" ry="12" fill="#3fae5a"/><ellipse cx="50" cy="60" rx="24" ry="18" fill="#6fd16a"/>
  <circle cx="38" cy="44" r="9" fill="#6fd16a"/><circle cx="62" cy="44" r="9" fill="#6fd16a"/><circle cx="38" cy="43" r="5" fill="#fff"/><circle cx="62" cy="43" r="5" fill="#fff"/>
  <circle cx="39" cy="44" r="2.6" fill="#1d1b18"/><circle cx="61" cy="44" r="2.6" fill="#1d1b18"/><path d="M38 60 Q50 70 62 60" stroke="#2c7a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="34" cy="60" rx="4" ry="2.4" fill="#ff8fa8" opacity=".6"/><ellipse cx="66" cy="60" rx="4" ry="2.4" fill="#ff8fa8" opacity=".6"/>`);

const arvore = () => svg(`<rect x="45" y="58" width="10" height="36" rx="3" fill="#8a5a36"/><circle cx="50" cy="40" r="28" fill="#5cc97f"/><circle cx="32" cy="52" r="17" fill="#47b86b"/><circle cx="68" cy="52" r="17" fill="#47b86b"/>
  <circle cx="40" cy="32" r="4" fill="#ff7a8a"/><circle cx="62" cy="40" r="4" fill="#ff7a8a"/><circle cx="50" cy="54" r="4" fill="#ff7a8a"/><path d="M30 28 q8 -12 20 -12" stroke="#a8f0b8" stroke-width="4" fill="none" stroke-linecap="round"/>`);

const pato = () => svg(`<path d="M8 80 q14 -8 28 0 t28 0 t28 0" stroke="#7cc0ff" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="48" cy="66" rx="26" ry="14" fill="#ffd93b"/><path d="M24 62 L14 54 L22 68Z" fill="#ffd93b"/><circle cx="66" cy="46" r="12" fill="#ffd93b"/>
  <path d="M76 46 L88 49 L76 52Z" fill="#ff8a1f"/><circle cx="69" cy="43" r="2.4" fill="#1d1b18"/><path d="M38 62 q10 8 20 0" stroke="#f0b400" stroke-width="3" fill="none"/>`);

// ---------- Rio ----------
const pinheiro = (cor = '#2f9e62', neve = false) => svg(`<rect x="46" y="74" width="8" height="20" fill="#8a5a36"/>
  <path d="M50 8 L74 42 H62 L82 66 H18 L38 42 H26 Z" fill="${cor}"/><path d="M50 8 L74 42 H62 L82 66 H66 L50 30Z" fill="#000" opacity=".1"/>
  <path d="M18 66 H82 L90 80 H10 Z" fill="${cor}"/>${neve ? '<path d="M50 8 L60 22 Q50 26 40 22Z M26 42 Q38 46 50 42 Q62 46 74 42 L70 38 Q50 34 30 38Z M18 66 Q34 70 50 66 Q66 70 82 66 L78 62 H22Z" fill="#fff"/>' : ''}`);

const pedrasRio = () => svg(`<ellipse cx="50" cy="74" rx="44" ry="14" fill="#7fd6e0"/><path d="M14 72 q8 -5 16 0 t16 0 M54 78 q8 -5 16 0 t16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="34" cy="64" rx="16" ry="12" fill="#9aa1ad"/><ellipse cx="62" cy="62" rx="20" ry="15" fill="#868d99"/><ellipse cx="56" cy="56" rx="7" ry="4" fill="#fff" opacity=".35"/><ellipse cx="30" cy="59" rx="5" ry="3" fill="#fff" opacity=".35"/>
  <path d="M60 48 q-4 -10 4 -14 q2 8 -4 14Z" fill="#5cc97f"/>`);

const ponte = () => svg(`<path d="M4 70 Q50 30 96 70" stroke="#8a5a36" stroke-width="10" fill="none"/><path d="M4 70 Q50 30 96 70" stroke="#b07a4a" stroke-width="5" fill="none" stroke-dasharray="6 3"/>
  ${[14, 30, 50, 70, 86].map((x) => { const y = 70 - Math.sin((x / 100) * Math.PI) * 30; return `<rect x="${x - 2}" y="${y - 22}" width="4" height="22" fill="#8a5a36"/>`; }).join('')}
  <path d="M12 50 Q50 12 88 50" stroke="#c99a6a" stroke-width="3" fill="none"/><path d="M0 84 q12 -6 24 0 t24 0 t24 0 t24 0" stroke="#7fd6e0" stroke-width="5" fill="none" stroke-linecap="round"/>`);

const canoa = () => svg(`<path d="M6 84 q14 -6 28 0 t28 0 t28 0" stroke="#7fd6e0" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M10 62 Q50 82 90 62 L84 72 Q50 88 16 72Z" fill="#b5652b"/><path d="M10 62 Q50 74 90 62" stroke="#7a3f1c" stroke-width="3" fill="none"/>
  <rect x="60" y="30" width="3" height="40" fill="#7a4a22" transform="rotate(25 61 50)"/><ellipse cx="72" cy="30" rx="5" ry="9" fill="#d9935a" transform="rotate(25 72 30)"/>`);

const montanha = () => svg(`<path d="M2 92 L38 26 L56 56 L68 40 L98 92Z" fill="#8fb3c9"/><path d="M38 26 L48 44 L42 42 L36 48 L30 40Z M68 40 L76 54 L70 52 L64 56Z" fill="#fff"/><path d="M2 92 L38 26 L40 92Z" fill="#000" opacity=".08"/>`);

// ---------- Mar ----------
const coqueiro = () => svg(`<path d="M50 94 Q46 60 56 30" stroke="#a0703f" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M50 94 Q46 60 56 30" stroke="#c99a6a" stroke-width="7" fill="none" stroke-dasharray="3 5"/>
  <path d="M56 30 Q36 14 14 26 Q34 22 56 30Z M56 30 Q76 12 94 24 Q74 22 56 30Z M56 30 Q46 40 30 56 Q42 38 56 30Z M56 30 Q70 40 82 56 Q66 40 56 30Z M56 30 Q56 12 66 4 Q60 18 56 30Z" fill="#2fb66a" stroke="#1f8a4c" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="52" cy="34" r="4.5" fill="#7a4a22"/><circle cx="60" cy="35" r="4.5" fill="#7a4a22"/><ellipse cx="50" cy="94" rx="30" ry="5" fill="#f2d48c"/>`);

const guardaSol = () => svg(`<ellipse cx="50" cy="90" rx="36" ry="6" fill="#f2d48c"/><rect x="48" y="30" width="4" height="60" fill="#fff" stroke="#ccc" stroke-width="1"/>
  <path d="M10 34 Q50 -6 90 34 Z" fill="#ff6b6b"/><path d="M30 34 Q40 6 50 6 Q60 6 70 34 Z" fill="#fff"/><path d="M42 34 Q46 10 50 6 Q54 10 58 34Z" fill="#ff6b6b"/>
  <path d="M10 34 q10 6 20 0 q10 6 20 0 q10 6 20 0 q10 6 20 0" fill="#ffd34d"/><rect x="60" y="72" width="24" height="14" rx="3" fill="#3e8bff"/><path d="M60 78 h24" stroke="#fff" stroke-width="2"/>`);

const farol = () => svg(`<path d="M38 92 L42 30 H58 L62 92Z" fill="#fff" stroke="#e0e0e0" stroke-width="1.5"/><path d="M40 70 H60 L61 82 H39Z M41.4 46 H58.6 L59.4 58 H40.6Z" fill="#ef4b5f"/>
  <rect x="38" y="22" width="24" height="10" rx="2" fill="#3a3f50"/><rect x="42" y="12" width="16" height="11" fill="#ffe680"/><path d="M40 12 L50 2 L60 12Z" fill="#ef4b5f"/>
  <path d="M58 16 L96 6 V26 Z" fill="#fff6b8" opacity=".7"/><path d="M42 16 L4 6 V26 Z" fill="#fff6b8" opacity=".5"/><rect x="28" y="90" width="44" height="6" rx="3" fill="#8c8f99"/>`, '0 0 100 100');

const concha = () => svg(`<path d="M50 84 L14 46 Q50 6 86 46 Z" fill="#ffb3c7" stroke="#ff7aa8" stroke-width="3" stroke-linejoin="round"/>
  ${[24, 37, 50, 63, 76].map((x) => `<path d="M50 84 L${x} ${x === 50 ? 22 : x < 50 ? 30 + (50 - x) * 0.6 : 30 + (x - 50) * 0.6}" stroke="#ff7aa8" stroke-width="2.5"/>`).join('')}
  <path d="M40 84 H60 L56 92 H44Z" fill="#ff9cc0"/><circle cx="32" cy="40" r="3" fill="#fff" opacity=".7"/>`);

const caranguejo = () => svg(`<ellipse cx="50" cy="64" rx="26" ry="18" fill="#ef4b5f"/><ellipse cx="44" cy="58" rx="8" ry="4" fill="#ff8a8a"/>
  <path d="M24 60 L10 48 M76 60 L90 48 M30 74 L16 84 M70 74 L84 84 M36 78 L28 90 M64 78 L72 90" stroke="#ef4b5f" stroke-width="4" stroke-linecap="round"/>
  <circle cx="10" cy="42" r="8" fill="#ef4b5f"/><circle cx="90" cy="42" r="8" fill="#ef4b5f"/><path d="M6 38 L12 42 M94 38 L88 42" stroke="#b02e3e" stroke-width="3"/>
  <path d="M42 48 V38 M58 48 V38" stroke="#ef4b5f" stroke-width="3"/><circle cx="42" cy="36" r="5" fill="#fff"/><circle cx="58" cy="36" r="5" fill="#fff"/><circle cx="42" cy="36" r="2.4" fill="#1d1b18"/><circle cx="58" cy="36" r="2.4" fill="#1d1b18"/>
  <path d="M42 68 Q50 74 58 68" stroke="#7a1c28" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);

const veleiro = () => svg(`<path d="M6 84 q14 -6 28 0 t28 0 t28 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M16 66 H84 L74 80 H26 Z" fill="#3e8bff"/><path d="M50 62 V12 L80 58 Z" fill="#fff"/><path d="M48 62 V20 L24 58 Z" fill="#ffd34d"/><rect x="48" y="10" width="3" height="56" fill="#8a5a36"/>
  <path d="M51 10 L64 14 L51 18Z" fill="#ef4b5f"/>`);

// ---------- Mar Gelado ----------
const iglu = () => svg(`<path d="M10 88 A40 40 0 0 1 90 88 Z" fill="#f2f8ff" stroke="#b8d4ef" stroke-width="2"/>
  <path d="M14 74 H86 M20 60 H80 M30 48 H70 M30 88 V74 M50 88 V74 M70 88 V74 M40 74 V60 M60 74 V60 M50 60 V48 M30 60 V48 M70 60 V48" stroke="#b8d4ef" stroke-width="2"/>
  <path d="M36 88 V74 A14 14 0 0 1 64 74 V88Z" fill="#3a4a8c"/><path d="M40 88 V76 A10 10 0 0 1 60 76 V88Z" fill="#ffcf6b" opacity=".85"/>`);

const pinguim = () => svg(`<ellipse cx="50" cy="60" rx="24" ry="32" fill="#2a3040"/><ellipse cx="50" cy="66" rx="16" ry="24" fill="#fff"/>
  <circle cx="42" cy="44" r="4" fill="#fff"/><circle cx="58" cy="44" r="4" fill="#fff"/><circle cx="43" cy="45" r="2" fill="#1d1b18"/><circle cx="57" cy="45" r="2" fill="#1d1b18"/>
  <path d="M45 52 L50 58 L55 52Z" fill="#ff9a1f"/><path d="M26 56 Q14 70 22 80 Q28 70 30 62Z M74 56 Q86 70 78 80 Q72 70 70 62Z" fill="#2a3040"/>
  <ellipse cx="40" cy="92" rx="8" ry="4" fill="#ff9a1f"/><ellipse cx="60" cy="92" rx="8" ry="4" fill="#ff9a1f"/><path d="M30 32 Q50 18 70 32 L66 36 Q50 26 34 36Z" fill="#ef4b5f"/><circle cx="50" cy="18" r="5" fill="#fff"/>`);

const iceberg = () => svg(`<path d="M6 76 L26 40 L40 50 L56 18 L76 48 L94 76Z" fill="#e8f4ff" stroke="#a8cdee" stroke-width="2" stroke-linejoin="round"/><path d="M56 18 L64 46 L76 48Z M26 40 L32 62 L40 50Z" fill="#bcdcf7"/>
  <path d="M10 76 L90 76 L80 92 L20 92Z" fill="#6f9fd6" opacity=".5"/><path d="M4 78 q12 -5 24 0 t24 0 t24 0 t24 0" stroke="#a8cdee" stroke-width="3" fill="none"/>`);

const urso = () => svg(`<ellipse cx="52" cy="70" rx="34" ry="20" fill="#f6f8fb" stroke="#d4dbe6" stroke-width="2"/><circle cx="24" cy="54" r="15" fill="#f6f8fb" stroke="#d4dbe6" stroke-width="2"/>
  <circle cx="16" cy="42" r="5" fill="#f6f8fb" stroke="#d4dbe6" stroke-width="2"/><circle cx="30" cy="41" r="5" fill="#f6f8fb" stroke="#d4dbe6" stroke-width="2"/>
  <circle cx="20" cy="52" r="2" fill="#1d1b18"/><circle cx="29" cy="52" r="2" fill="#1d1b18"/><ellipse cx="22" cy="60" rx="4" ry="3" fill="#1d1b18"/>
  <rect x="30" y="80" width="10" height="12" rx="4" fill="#f6f8fb" stroke="#d4dbe6" stroke-width="2"/><rect x="66" y="80" width="10" height="12" rx="4" fill="#f6f8fb" stroke="#d4dbe6" stroke-width="2"/>`);

const floco = () => svg(`<g stroke="#e8f4ff" stroke-width="5" stroke-linecap="round">${[0, 60, 120].map((a) => `<path d="M50 14 V86 M50 26 L40 18 M50 26 L60 18 M50 74 L40 82 M50 74 L60 82" transform="rotate(${a} 50 50)"/>`).join('')}</g>`);

const lua = () => svg('<circle cx="50" cy="50" r="34" fill="#fff6c8"/><circle cx="64" cy="40" r="30" fill="#3b4a8c"/><circle cx="34" cy="56" r="4" fill="#efe4a8"/><circle cx="42" cy="72" r="3" fill="#efe4a8"/>');

// peixinho para enfeitar (pulando da água)
export const peixinho = (c1, c2) => svg(`<path d="M18 50 L4 36 L6 64Z" fill="${c2}"/><ellipse cx="50" cy="50" rx="36" ry="22" fill="${c1}"/><path d="M40 30 Q52 16 64 30Z" fill="${c2}"/>
  <circle cx="70" cy="44" r="6" fill="#fff"/><circle cx="72" cy="44" r="3.2" fill="#1d1b18"/><path d="M36 42 Q40 50 36 58 M46 40 Q50 50 46 60" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`);

// Cenário de cada lugar: o que aparece dos lados do caminho (uma lista para sortear), a cor da placa e os peixinhos.
export const CENARIOS = [
  { pecas: [vitoriaRegia, taboa, sapo, arvore, pato, vitoriaRegia], placa: '#2f9e62', peixes: [['#ffa53d', '#ff6a1f'], ['#8fd3ff', '#4aa8e8']] },
  { pecas: [() => pinheiro(), pedrasRio, ponte, canoa, montanha, () => pinheiro('#3a8f5a')], placa: '#1f9e9a', peixes: [['#ff8fbf', '#e8508f'], ['#ffa53d', '#ff6a1f']] },
  { pecas: [coqueiro, guardaSol, farol, concha, caranguejo, veleiro], placa: '#3e8bff', peixes: [['#ff7a3d', '#ffffff'], ['#a07cf0', '#6b4bd6']] },
  { pecas: [iglu, pinguim, iceberg, urso, () => pinheiro('#2f7a62', true), pinguim], placa: '#6b5cf0', peixes: [['#7ff0ff', '#2bb3d6'], ['#c4a7ff', '#7a5cf0']], noite: true },
];
export { floco, lua };
