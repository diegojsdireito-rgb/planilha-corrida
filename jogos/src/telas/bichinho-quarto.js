// Arte do quarto do Meu Bichinho (viewBox 0 0 390 300): papel de parede, janela, caminha,
// tapete, quadro, abajur, plantinha, os três temas inteiros (praia, espaço e jardim encantado),
// os brinquedos e os esconderijos do esconde-esconde. Sem estado: só devolve texto SVG.
import { svgBichinho, svgRabinho, coracao, estrelaPath } from './bichinho-arte.js';

let seq = 0;
// Posições fixas "aleatórias" (estrelas, conchas...) para o desenho não mudar a cada vez.
function pontos(n, semente, x0, y0, x1, y1) {
  let s = semente;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r()]);
}
const f1 = (n) => n.toFixed(1);

// ---------- céu da janela ----------
function ceu(u, dia, x, y, w, h) {
  if (dia) return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${u}ceu)"/><circle cx="${x + w * 0.77}" cy="${y + h * 0.29}" r="11" fill="#ffd84d"/><g fill="#fff"><ellipse cx="${x + w * 0.29}" cy="${y + h * 0.53}" rx="16" ry="7"/><ellipse cx="${x + w * 0.42}" cy="${y + h * 0.46}" rx="11" ry="8"/><ellipse cx="${x + w * 0.71}" cy="${y + h * 0.76}" rx="12" ry="5"/></g>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#24306b"/><path d="M${x + w * 0.77} ${y + h * 0.16} a12 12 0 1 0 8 20 a10 10 0 1 1 -8 -20Z" fill="#fff3b0"/><g fill="#fff">${pontos(6, 7, x + 6, y + 6, x + w - 6, y + h - 6).map(([a, b, c]) => `<circle cx="${f1(a)}" cy="${f1(b)}" r="${f1(1 + c)}"/>`).join('')}</g>`;
}

// ---------- peças do quarto ----------
const PAREDE = {
  padrao: (u) => `<pattern id="${u}pp" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.2" fill="var(--bq-bolinha)"/><circle cx="19" cy="19" r="2.2" fill="var(--bq-bolinha)"/></pattern>`,
  'parede-listras': (u) => `<pattern id="${u}pp" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="#8fe3c0" opacity=".22"/><rect width="14" height="34" fill="#fff" opacity=".35"/><rect x="20" width="3" height="34" fill="#8fe3c0" opacity=".5"/></pattern>`,
  'parede-estrelas': (u) => `<pattern id="${u}pp" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#c9b6ff" opacity=".25"/><path d="${estrelaPath(11, 11, 6)}" fill="#ffd36e" opacity=".9"/><path d="${estrelaPath(33, 32, 4)}" fill="#fff" opacity=".8"/><circle cx="34" cy="10" r="1.6" fill="#ffd36e"/><circle cx="10" cy="34" r="1.3" fill="#fff"/></pattern>`,
  'parede-coracoes': (u) => `<pattern id="${u}pp" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#ffb3c9" opacity=".2"/><path d="${coracao(10, 10, 0.32)}" fill="#ff8fb1" opacity=".75"/><path d="${coracao(30, 30, 0.26)}" fill="#e5484d" opacity=".45"/></pattern>`,
  'parede-nuvens': (u) => `<pattern id="${u}pp" width="90" height="64" patternUnits="userSpaceOnUse"><rect width="90" height="64" fill="#8fd0ff" opacity=".35"/><g fill="#fff" opacity=".85"><ellipse cx="22" cy="18" rx="14" ry="6"/><ellipse cx="30" cy="14" rx="9" ry="7"/><ellipse cx="66" cy="48" rx="13" ry="5.5"/><ellipse cx="72" cy="44" rx="8" ry="6"/></g></pattern>`,
};

function janela(u, id, dia) {
  if (id === 'janela-redonda') {
    return `<defs><clipPath id="${u}jr"><circle cx="92" cy="76" r="46"/></clipPath></defs><circle cx="92" cy="76" r="52" fill="#fff" stroke="#c99a6b" stroke-width="6"/><g clip-path="url(#${u}jr)">${ceu(u, dia, 44, 28, 96, 98)}</g><path d="M92 30 V122 M46 76 H138" stroke="#fff" stroke-width="5"/><circle cx="92" cy="76" r="46" fill="none" stroke="#e6cfa8" stroke-width="3"/>`
      + `<rect x="50" y="124" width="84" height="18" rx="5" fill="#c97b4f" stroke="#a35f38" stroke-width="2"/>${[58, 72, 86, 100, 114, 126].map((x, k) => `<path d="M${x} 124 V112" stroke="#4fae5f" stroke-width="2.5"/><circle cx="${x}" cy="110" r="5.5" fill="${['#ff8fb1', '#ffd36e', '#c59bff', '#ff6f91', '#8fc8ff', '#ffd36e'][k]}"/><circle cx="${x}" cy="110" r="2" fill="#fff"/>`).join('')}`;
  }
  const base = `<rect x="34" y="30" width="116" height="96" rx="10" fill="#fff" stroke="#e6cfa8" stroke-width="4"/>${ceu(u, dia, 44, 40, 96, 76)}<path d="M92 40 V116 M44 78 H140" stroke="#fff" stroke-width="5"/>`;
  if (id === 'cortina-estrelas') {
    return `${base}<path d="M28 26 Q38 80 32 132 L58 132 Q50 80 60 26 Z" fill="#3b4a9e"/><path d="M156 26 Q146 80 152 132 L126 132 Q134 80 124 26 Z" fill="#3b4a9e"/>`
      + `<g fill="#ffd36e">${[[40, 44], [48, 70], [38, 98], [50, 120], [144, 44], [136, 70], [146, 98], [134, 120]].map(([x, y]) => `<path d="${estrelaPath(x, y, 4.5)}"/>`).join('')}</g><path d="M30 84 Q44 90 58 84 M154 84 Q140 90 126 84" stroke="#ffd36e" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="22" y="20" width="140" height="8" rx="4" fill="#ffd36e"/><circle cx="22" cy="24" r="6" fill="#ffd36e"/><circle cx="162" cy="24" r="6" fill="#ffd36e"/>`;
  }
  if (id === 'cortina-babado') {
    const ondas = Array.from({ length: 7 }, (_, k) => `Q${152 - k * 20} 60 ${142 - k * 20} 46`).join(' ');
    return `${base}<path d="M30 26 Q42 80 34 132 L56 132 Q48 80 58 26 Z" fill="#ffd36e"/><path d="M154 26 Q142 80 150 132 L128 132 Q136 80 126 26 Z" fill="#ffd36e"/><path d="M36 60 V128 M148 60 V128" stroke="#fff" stroke-width="2" stroke-dasharray="3 5" opacity=".8"/>`
      + `<path d="M22 22 H162 V46 ${ondas} Z" fill="#fff4c2" stroke="#e0b44a" stroke-width="2" stroke-linejoin="round"/><path d="M22 40 H162" stroke="#ffd36e" stroke-width="4"/><rect x="20" y="18" width="144" height="8" rx="4" fill="#c99a6b"/>`;
  }
  return `${base}<path d="M30 26 Q40 80 34 132 L56 132 Q48 80 58 26 Z" fill="#ff9fc0"/><path d="M154 26 Q144 80 150 132 L128 132 Q136 80 126 26 Z" fill="#ff9fc0"/><rect x="24" y="20" width="136" height="8" rx="4" fill="#c99a6b"/>`;
}

function quadro(id, b) {
  const moldura = (dentro) => `<g transform="translate(262 46)"><rect width="62" height="50" rx="6" fill="#fff" stroke="#c99a6b" stroke-width="4"/>${dentro}</g>`;
  if (id === 'quadro-arco-iris') return moldura(`<rect x="4" y="4" width="54" height="42" rx="3" fill="#dff1ff"/>${['#ff8fb1', '#ffd36e', '#8fe3b0', '#8fc8ff', '#c59bff'].map((c, k) => `<path d="M${10 + k * 3.6} 40 A${21 - k * 3.6} ${21 - k * 3.6} 0 0 1 ${52 - k * 3.6} 40" fill="none" stroke="${c}" stroke-width="3.6"/>`).join('')}<ellipse cx="12" cy="40" rx="8" ry="4" fill="#fff"/><ellipse cx="50" cy="40" rx="8" ry="4" fill="#fff"/>`);
  if (id === 'quadro-montanha') return moldura('<rect x="4" y="4" width="54" height="42" rx="3" fill="#bfe3ff"/><circle cx="44" cy="15" r="6" fill="#ffd84d"/><path d="M4 46 L20 20 L32 34 L40 26 L58 46 Z" fill="#7b8fc9"/><path d="M20 20 L25 28 L21 27 L17 26 Z M40 26 L44 31 L38 31 Z" fill="#fff"/><path d="M4 46 Q30 36 58 44 V46 Z" fill="#5fd38d"/>');
  if (id === 'quadro-retrato' && b) {
    return `<g transform="translate(262 40)"><ellipse cx="31" cy="31" rx="33" ry="30" fill="#ffd36e" stroke="#d99a1e" stroke-width="3"/><ellipse cx="31" cy="31" rx="26" ry="23" fill="#fff4f8"/><svg x="7" y="10" width="48" height="42" viewBox="30 4 140 128">${svgBichinho(b.especie, b.vestindo, { classe: 'bc-estatico' }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><path d="${estrelaPath(31, 0, 5)}" fill="#fff" stroke="#d99a1e" stroke-width="1.2"/></g>`;
  }
  return moldura(`<path d="${coracao(31, 27, 0.9)}" fill="#ff8fb1"/>`);
}

function abajur(u, id) {
  if (id === 'abajur-lua') return `<g transform="translate(344 120)"><circle class="bichinho-luz" cx="0" cy="10" r="58" fill="url(#${u}luz)"/><path d="M0 30 V96" stroke="#8fa2ff" stroke-width="5"/><ellipse cx="0" cy="98" rx="18" ry="5" fill="#8fa2ff"/><path d="M8 -16 A22 22 0 1 0 14 30 A17 17 0 1 1 8 -16 Z" fill="#fff3a8" stroke="#e0b44a" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-6" cy="12" r="2" fill="#2a2135"/><path d="M-12 20 Q-8 23 -4 20" stroke="#2a2135" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M14 0 V18" stroke="#c9b37a" stroke-width="1"/><path d="${estrelaPath(14, 22, 5)}" fill="#ffd36e"/></g>`;
  if (id === 'abajur-cogumelo') return `<g transform="translate(344 176)"><circle class="bichinho-luz" cx="0" cy="0" r="58" fill="url(#${u}luz)"/><path d="M-9 4 Q-12 30 -14 40 H14 Q12 30 9 4 Z" fill="#fff4e0" stroke="#d9b98a" stroke-width="2"/><path d="M-30 6 Q-30 -26 0 -28 Q30 -26 30 6 Q0 14 -30 6 Z" fill="#ff6f6f" stroke="#c94545" stroke-width="2.4" stroke-linejoin="round"/><g fill="#fff"><circle cx="-14" cy="-12" r="5"/><circle cx="6" cy="-18" r="4"/><circle cx="18" cy="-4" r="4.5"/><circle cx="-2" cy="-2" r="3"/></g><ellipse cx="0" cy="41" rx="18" ry="4" fill="#d9b98a"/></g>`;
  return `<g transform="translate(344 120)"><circle class="bichinho-luz" cx="0" cy="22" r="58" fill="url(#${u}luz)"/><path d="M0 26 V96" stroke="#8b5a3c" stroke-width="5"/><ellipse cx="0" cy="98" rx="18" ry="5" fill="#8b5a3c"/><path d="M-20 26 L-12 0 H12 L20 26 Z" fill="#ffd36e" stroke="#e0a72e" stroke-width="2.5" stroke-linejoin="round"/></g>`;
}

function planta(id) {
  const vaso = '<path d="M-11 0 L-13 -16 H13 L11 0 Z" fill="#d9825b" stroke="#b05f3c" stroke-width="1.6" stroke-linejoin="round"/><rect x="-15" y="-20" width="30" height="6" rx="2" fill="#e8956c" stroke="#b05f3c" stroke-width="1.6"/>';
  const em = (s) => `<g transform="translate(234 128)">${s}</g>`;
  if (id === 'planta-flor') return em(`<path d="M0 -20 V-40 M-7 -20 Q-10 -32 -12 -36 M7 -20 Q10 -30 13 -34" stroke="#4fae5f" stroke-width="2.4" fill="none"/><ellipse cx="-5" cy="-28" rx="5" ry="2.4" fill="#5cc46f" transform="rotate(-30 -5 -28)"/>${[[0, -44, '#ff6f91'], [-13, -38, '#ffd36e'], [14, -37, '#c59bff']].map(([x, y, c]) => `<path d="M${x - 5} ${y + 3} Q${x - 6} ${y - 6} ${x} ${y - 4} Q${x + 6} ${y - 6} ${x + 5} ${y + 3} Q${x} ${y + 6} ${x - 5} ${y + 3} Z" fill="${c}"/>`).join('')}${vaso}`);
  if (id === 'planta-cacto') return em(`<path d="M-8 -18 V-46 Q-8 -56 0 -56 Q8 -56 8 -46 V-18 Z" fill="#5fc26e" stroke="#3f9a52" stroke-width="2"/><path d="M-8 -32 H-14 Q-18 -32 -18 -38 V-42" stroke="#3f9a52" stroke-width="2" fill="#5fc26e"/><path d="M-18 -44 Q-18 -48 -15 -48 Q-12 -48 -12 -44 V-34 H-8" fill="#5fc26e" stroke="#3f9a52" stroke-width="2"/><circle cx="-3" cy="-42" r="1.4" fill="#2a2135"/><circle cx="3" cy="-42" r="1.4" fill="#2a2135"/><path d="M-2 -38 Q0 -36 2 -38" stroke="#2a2135" stroke-width="1.2" fill="none"/><circle cx="0" cy="-57" r="4" fill="#ff8fb1"/>${vaso}`);
  if (id === 'planta-girassol') return em(`<path d="M0 -20 Q2 -44 0 -60" stroke="#4fae5f" stroke-width="3" fill="none"/><ellipse cx="7" cy="-36" rx="7" ry="3" fill="#5cc46f" transform="rotate(-30 7 -36)"/><ellipse cx="-7" cy="-44" rx="7" ry="3" fill="#5cc46f" transform="rotate(30 -7 -44)"/>${Array.from({ length: 12 }, (_, k) => `<ellipse cx="0" cy="-73" rx="3.4" ry="8" fill="#ffd23f" transform="rotate(${k * 30} 0 -64)"/>`).join('')}<circle cx="0" cy="-64" r="7" fill="#8b5a3c"/><circle cx="-2" cy="-66" r="1.6" fill="#a8774f"/>${vaso}`);
  return '';
}

function tapete(id) {
  if (id === 'tapete-arco-iris') return ['#c59bff', '#8fc8ff', '#8fe3b0', '#ffd36e', '#ff8fb1'].map((c, k) => `<ellipse cx="195" cy="272" rx="${144 - k * 22}" ry="${25 - k * 4}" fill="${c}"/>`).join('') + '<ellipse cx="195" cy="272" rx="40" ry="6" fill="#fff" opacity=".5"/>';
  if (id === 'tapete-flor') return `${Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; return `<ellipse cx="${f1(195 + Math.cos(a) * 92)}" cy="${f1(272 + Math.sin(a) * 15)}" rx="52" ry="14" fill="#ffb3d1" stroke="#ff8fb1" stroke-width="2"/>`; }).join('')}<ellipse cx="195" cy="272" rx="92" ry="17" fill="#ffd36e" stroke="#f0b84a" stroke-width="2"/><ellipse cx="195" cy="272" rx="70" ry="11" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-dasharray="6 6"/>`;
  if (id === 'tapete-patinhas') return `<ellipse cx="195" cy="272" rx="142" ry="24" fill="#f5e1c4" stroke="#d9b98a" stroke-width="3"/>${[[110, 270], [150, 280], [240, 264], [280, 276], [195, 262]].map(([x, y]) => `<g fill="#c99a6b" opacity=".7"><ellipse cx="${x}" cy="${y + 2}" rx="6" ry="4"/><circle cx="${x - 6}" cy="${y - 3}" r="2"/><circle cx="${x - 2}" cy="${y - 5}" r="2"/><circle cx="${x + 2}" cy="${y - 5}" r="2"/><circle cx="${x + 6}" cy="${y - 3}" r="2"/></g>`).join('')}`;
  return '<ellipse cx="195" cy="272" rx="140" ry="24" fill="var(--bq-tapete)"/><ellipse cx="195" cy="272" rx="118" ry="17" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-dasharray="8 7"/>';
}

function cama(id) {
  if (id === 'cama-almofada') return '<ellipse cx="62" cy="234" rx="54" ry="20" fill="#e86a9a"/><ellipse cx="62" cy="228" rx="54" ry="20" fill="#ff8fb1"/><ellipse cx="62" cy="226" rx="40" ry="12" fill="#ffb3c9"/><g fill="#e86a9a"><circle cx="44" cy="226" r="2.6"/><circle cx="62" cy="222" r="2.6"/><circle cx="80" cy="226" r="2.6"/><circle cx="62" cy="231" r="2.6"/></g><path d="M30 220 Q40 214 52 214" stroke="#fff" stroke-width="3" opacity=".6" fill="none" stroke-linecap="round"/>';
  if (id === 'cama-nuvem') return '<rect x="16" y="234" width="6" height="10" rx="2" fill="#a9b8d6"/><rect x="104" y="234" width="6" height="10" rx="2" fill="#a9b8d6"/><g fill="#eef6ff" stroke="#bcd3f0" stroke-width="2.4"><circle cx="24" cy="216" r="18"/><circle cx="50" cy="204" r="24"/><circle cx="80" cy="206" r="22"/><circle cx="104" cy="218" r="16"/><rect x="12" y="214" width="104" height="24" rx="12"/></g><rect x="13.5" y="214" width="101" height="22" rx="11" fill="#eef6ff"/><ellipse cx="38" cy="206" rx="14" ry="7" fill="#ffd6e7" stroke="#ffb3c9" stroke-width="1.6"/><path d="M60 226 Q80 232 108 226" stroke="#bcd3f0" stroke-width="2" fill="none"/><path d="M40 196 Q50 188 62 190" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>';
  if (id === 'cama-dossel') return '<g transform="translate(0 30)"><path d="M12 112 V214 M112 112 V214" stroke="#f0c9de" stroke-width="5" stroke-linecap="round"/><path d="M4 114 Q62 92 120 114 L114 122 Q62 104 10 122 Z" fill="#ffb3d1" stroke="#f27aa8" stroke-width="2" stroke-linejoin="round"/><path d="M10 122 Q2 170 16 210 L26 208 Q18 166 22 122 Z M114 122 Q122 170 108 210 L98 208 Q106 166 102 122 Z" fill="#ffd6e7" opacity=".85"/><circle cx="62" cy="100" r="7" fill="#ffd36e" stroke="#d99a1e" stroke-width="1.6"/></g>'
    + `<path d="M16 196 Q16 172 40 170 H84 Q108 172 108 196 Z" fill="#fff" stroke="#f0c9de" stroke-width="2.4"/><path d="${coracao(62, 186, 0.7)}" fill="#ff8fb1"/><rect x="10" y="206" width="104" height="26" rx="8" fill="#ff8fb1" stroke="#e86a9a" stroke-width="2.4"/><rect x="10" y="200" width="104" height="14" rx="7" fill="#fff4f8" stroke="#f0c9de" stroke-width="2"/><path d="M14 232 V244 M110 232 V244" stroke="#e86a9a" stroke-width="4" stroke-linecap="round"/>`;
  return '';
}

// ---------- brinquedos ----------
// Cada desenho fica com a base no ponto (0, 0); POS diz onde fica no quarto (x, y da base, escala).
export const ARTE_BRINQUEDOS = {
  'bola-praia': { vb: '-20 -34 40 36', svg: '<ellipse cx="0" cy="0" rx="14" ry="3" fill="#000" opacity=".12"/><circle cx="0" cy="-16" r="16" fill="#fff" stroke="#3a3045" stroke-width="1.6"/><path d="M0 -32 Q-12 -16 0 0 Q-20 -6 -16 -16 Q-14 -28 0 -32 Z" fill="#e5484d"/><path d="M0 -32 Q12 -16 0 0 Q20 -6 16 -16 Q14 -28 0 -32 Z" fill="#3e7bfa"/><path d="M0 -32 Q-5 -16 0 0 Q5 -16 0 -32 Z" fill="#ffd23f"/><circle cx="0" cy="-16" r="16" fill="none" stroke="#3a3045" stroke-width="1.6"/><ellipse cx="-7" cy="-24" rx="4" ry="2.5" fill="#fff" opacity=".6" transform="rotate(-30 -7 -24)"/>' },
  patinho: { vb: '-17 -30 36 32', svg: '<ellipse cx="0" cy="0" rx="13" ry="2.5" fill="#000" opacity=".12"/><path d="M-14 -10 Q-14 0 0 0 Q14 0 14 -9 Q14 -14 8 -14 Q2 -14 -4 -12 Q-10 -16 -14 -10 Z" fill="#ffd23f" stroke="#e0a72e" stroke-width="1.6"/><circle cx="-5" cy="-19" r="8" fill="#ffd23f" stroke="#e0a72e" stroke-width="1.6"/><path d="M-12 -19 Q-18 -18 -16 -14 Q-12 -14 -11 -16 Z" fill="#ff8a3d"/><circle cx="-7" cy="-21" r="1.6" fill="#2a2135"/><path d="M2 -8 Q6 -4 10 -8" stroke="#e0a72e" stroke-width="1.4" fill="none"/>' },
  blocos: { vb: '-26 -46 52 48', svg: '<rect x="-24" y="-20" width="22" height="20" rx="3" fill="#e5484d" stroke="#b8323a" stroke-width="1.6"/><rect x="2" y="-20" width="22" height="20" rx="3" fill="#3e7bfa" stroke="#2a5fd0" stroke-width="1.6"/><rect x="-11" y="-42" width="22" height="22" rx="3" fill="#ffd23f" stroke="#e0a72e" stroke-width="1.6" transform="rotate(-6 0 -31)"/><text x="-13" y="-5" font-size="13" font-weight="800" fill="#fff" text-anchor="middle" font-family="sans-serif">A</text><text x="13" y="-5" font-size="13" font-weight="800" fill="#fff" text-anchor="middle" font-family="sans-serif">B</text><text x="0" y="-26" font-size="13" font-weight="800" fill="#c47f00" text-anchor="middle" font-family="sans-serif" transform="rotate(-6 0 -31)">C</text>' },
  piao: { vb: '-20 -44 40 46', svg: '<ellipse cx="0" cy="0" rx="10" ry="2" fill="#000" opacity=".12"/><path d="M-18 -22 Q0 -32 18 -22 L2 -1 Q0 1 -2 -1 Z" fill="#c59bff" stroke="#8a4fc0" stroke-width="1.6" stroke-linejoin="round"/><path d="M-16 -20 Q0 -14 16 -20 L13 -16 Q0 -10 -13 -16 Z" fill="#ffd23f"/><path d="M-9 -9 Q0 -5 9 -9 L6 -5 Q0 -2 -6 -5 Z" fill="#ff8fb1"/><ellipse cx="0" cy="-24" rx="18" ry="6" fill="#d9c2ff" stroke="#8a4fc0" stroke-width="1.6"/><rect x="-2.5" y="-40" width="5" height="16" rx="2" fill="#8a4fc0"/>' },
  carrinho: { vb: '-30 -34 60 36', svg: '<ellipse cx="0" cy="0" rx="26" ry="3" fill="#000" opacity=".12"/><path d="M-26 -8 Q-26 -16 -18 -17 L-12 -28 Q-10 -31 -6 -31 H10 Q14 -31 16 -27 L20 -17 Q28 -16 28 -8 Z" fill="#e5484d" stroke="#b8323a" stroke-width="1.8" stroke-linejoin="round"/><path d="M-10 -18 L-7 -26 H0 V-18 Z M3 -18 V-26 H9 L14 -18 Z" fill="#bfe8ff"/><rect x="-27" y="-11" width="6" height="4" rx="1.5" fill="#ffd23f"/><circle cx="-14" cy="-6" r="6.5" fill="#2a2135"/><circle cx="-14" cy="-6" r="2.6" fill="#d6dbe6"/><circle cx="15" cy="-6" r="6.5" fill="#2a2135"/><circle cx="15" cy="-6" r="2.6" fill="#d6dbe6"/>' },
  ursinho: { vb: '-30 -64 60 66', svg: '<ellipse cx="0" cy="0" rx="22" ry="3" fill="#000" opacity=".12"/><ellipse cx="0" cy="-18" rx="17" ry="16" fill="#b9784a" stroke="#8b5432" stroke-width="1.8"/><ellipse cx="0" cy="-15" rx="10" ry="10" fill="#e8c29a"/><ellipse cx="-14" cy="-4" rx="8" ry="5" fill="#b9784a" stroke="#8b5432" stroke-width="1.6"/><ellipse cx="14" cy="-4" rx="8" ry="5" fill="#b9784a" stroke="#8b5432" stroke-width="1.6"/><ellipse cx="-16" cy="-22" rx="5" ry="8" fill="#b9784a" stroke="#8b5432" stroke-width="1.6" transform="rotate(30 -16 -22)"/><ellipse cx="16" cy="-22" rx="5" ry="8" fill="#b9784a" stroke="#8b5432" stroke-width="1.6" transform="rotate(-30 16 -22)"/><circle cx="-12" cy="-56" r="6" fill="#b9784a" stroke="#8b5432" stroke-width="1.6"/><circle cx="12" cy="-56" r="6" fill="#b9784a" stroke="#8b5432" stroke-width="1.6"/><circle cx="0" cy="-44" r="15" fill="#c98a5a" stroke="#8b5432" stroke-width="1.8"/><ellipse cx="0" cy="-39" rx="7" ry="5" fill="#e8c29a"/><ellipse cx="0" cy="-41" rx="2.6" ry="2" fill="#3a2a26"/><circle cx="-6" cy="-47" r="1.8" fill="#2a2135"/><circle cx="6" cy="-47" r="1.8" fill="#2a2135"/><path d="M-6 -30 L0 -27 L6 -30 L6 -24 L0 -27 L-6 -24 Z" fill="#ff6fa5"/>' },
  robo: { vb: '-24 -58 48 60', svg: `<ellipse cx="0" cy="0" rx="16" ry="2.5" fill="#000" opacity=".12"/><rect x="-11" y="-8" width="8" height="8" rx="2" fill="#8d99ae"/><rect x="3" y="-8" width="8" height="8" rx="2" fill="#8d99ae"/><rect x="-15" y="-30" width="30" height="24" rx="6" fill="#cfd6e4" stroke="#8d99ae" stroke-width="1.8"/><path d="M-21 -26 V-14 M21 -26 V-14" stroke="#8d99ae" stroke-width="4" stroke-linecap="round"/><path d="${coracao(0, -18, 0.32)}" fill="#ff6fa5"/><rect x="-13" y="-52" width="26" height="20" rx="6" fill="#e8edf6" stroke="#8d99ae" stroke-width="1.8"/><circle cx="-5" cy="-42" r="3.2" fill="#3e7bfa"/><circle cx="5" cy="-42" r="3.2" fill="#3e7bfa"/><path d="M-4 -36 H4" stroke="#8d99ae" stroke-width="1.6" stroke-linecap="round"/><path d="M0 -52 V-58" stroke="#8d99ae" stroke-width="1.6"/><circle cx="0" cy="-59" r="2.6" fill="#e5484d"/>` },
  casinha: { vb: '-42 -78 84 80', svg: `<ellipse cx="0" cy="0" rx="38" ry="3.5" fill="#000" opacity=".12"/><rect x="-34" y="-46" width="68" height="46" fill="#d9a066" stroke="#a8743f" stroke-width="2"/><path d="M-38 -44 L0 -74 L38 -44 Z" fill="#c78d52" stroke="#a8743f" stroke-width="2" stroke-linejoin="round"/><path d="M-38 -44 L-46 -36 M38 -44 L46 -36" stroke="#a8743f" stroke-width="2"/><path d="M-10 0 V-22 Q-10 -32 0 -32 Q10 -32 10 -22 V0 Z" fill="#7a4f2a"/><rect x="16" y="-36" width="12" height="12" rx="2" fill="#7a4f2a"/><rect x="-28" y="-36" width="12" height="12" rx="2" fill="#7a4f2a"/><path d="${coracao(0, -54, 0.34)}" fill="#ff6fa5"/><path d="M-30 -8 Q-24 -12 -18 -8 M18 -10 L26 -14" stroke="#a8743f" stroke-width="1.4" fill="none" opacity=".7"/>` },
};
// Onde cada brinquedo fica no quarto. O ursinho senta na caminha quando tem uma.
const POS = {
  'bola-praia': [358, 292, 1], patinho: [262, 128, 0.85], blocos: [104, 296, 0.9], piao: [282, 296, 0.85],
  carrinho: [46, 294, 1], ursinho: [44, 250, 1], robo: [318, 274, 0.95], casinha: [334, 246, 1],
};
export function svgBrinquedo(id) {
  const a = ARTE_BRINQUEDOS[id];
  return `<svg viewBox="${a.vb}" aria-hidden="true">${a.svg}</svg>`;
}
function brinquedos(lista, temCama, tema) {
  const ordem = ['casinha', 'robo', 'ursinho', 'patinho', 'blocos', 'piao', 'carrinho', 'bola-praia'];
  return ordem.filter((id) => lista.includes(id)).map((id) => {
    let [x, y, s] = POS[id];
    if (id === 'ursinho' && temCama) [x, y, s] = [70, 222, 0.9];
    if (id === 'patinho' && tema) [x, y, s] = [92, 268, 0.9]; // nos temas não tem prateleira
    return `<g class="bq-brinquedo" data-brinquedo="${id}" transform="translate(${x} ${y}) scale(${s})"><rect x="-30" y="-70" width="60" height="74" fill="transparent"/><g class="bq-brinquedo-anima">${ARTE_BRINQUEDOS[id].svg}</g></g>`;
  }).join('');
}

// ---------- temas ----------
function temaPraia(u, dia) {
  const ceuT = dia ? `<linearGradient id="${u}tc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb8ff"/><stop offset="1" stop-color="#ffe3c2"/></linearGradient>` : `<linearGradient id="${u}tc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2a66"/><stop offset="1" stop-color="#6b5aa8"/></linearGradient>`;
  const astro = dia ? `<circle class="bichinho-luz" cx="300" cy="60" r="70" fill="url(#${u}luz)"/><circle cx="300" cy="60" r="24" fill="#ffd84d"/><circle cx="300" cy="60" r="30" fill="#ffd84d" opacity=".25"/>` : `<circle class="bichinho-luz" cx="300" cy="60" r="60" fill="url(#${u}luz)"/><path d="M292 40 a22 22 0 1 0 16 38 a18 18 0 1 1 -16 -38Z" fill="#fff3b0"/>${pontos(14, 3, 10, 6, 380, 120).map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.8 + r)}" fill="#fff"/>`).join('')}`;
  return `<defs>${ceuT}<linearGradient id="${u}mar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fb3e8"/><stop offset="1" stop-color="#7fe0e8"/></linearGradient><linearGradient id="${u}areia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6b0"/><stop offset="1" stop-color="#f2c77e"/></linearGradient></defs>`
    + `<rect width="390" height="300" fill="url(#${u}tc)"/>${astro}<g fill="#fff" opacity="${dia ? 0.9 : 0.25}"><ellipse cx="80" cy="50" rx="26" ry="9"/><ellipse cx="96" cy="44" rx="16" ry="10"/><ellipse cx="200" cy="80" rx="20" ry="7"/></g>`
    + `<path d="M0 140 H390 V214 H0 Z" fill="url(#${u}mar)"/><path d="M0 156 Q20 150 40 156 T80 156 T120 156 T160 156 T200 156 T240 156 T280 156 T320 156 T360 156 T400 156 M0 182 Q20 176 40 182 T80 182 T120 182 T160 182 T200 182 T240 182 T280 182 T320 182 T360 182 T400 182" stroke="#fff" stroke-width="2.4" fill="none" opacity=".6"/>`
    + `<path d="M120 140 l10 -8 l4 8" fill="#fff"/><path d="M118 140 h22" stroke="#e5484d" stroke-width="3"/><path d="M0 206 Q100 196 195 204 T390 200 V300 H0 Z" fill="url(#${u}areia)"/>`
    + `<g transform="translate(40 120)"><path d="M28 0 V112" stroke="#f5f0e6" stroke-width="4"/><path d="M-26 22 Q28 -26 82 22 Z" fill="#ff6f6f"/><path d="M1 22 Q28 -26 55 22 Z" fill="#fff"/><path d="M14 22 Q28 -26 42 22 Z" fill="#ff6f6f"/><path d="M-26 22 Q-12 14 1 22 Q14 14 28 22 Q42 14 55 22 Q68 14 82 22" fill="none" stroke="#c94545" stroke-width="2"/></g>`
    + '<g transform="translate(352 246)"><path d="M0 0 Q-6 -60 -22 -120" stroke="#b07a4a" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M-2 -10 L-8 -12 M-5 -40 L-12 -42 M-12 -70 L-19 -72 M-17 -98 L-24 -100" stroke="#8b5a3c" stroke-width="2"/><g fill="#3fae6a"><path d="M-22 -120 Q-60 -130 -80 -104 Q-50 -118 -22 -114 Z"/><path d="M-22 -120 Q-20 -160 6 -170 Q-8 -146 -16 -118 Z"/><path d="M-22 -120 Q10 -134 30 -112 Q6 -120 -18 -116 Z"/><path d="M-22 -120 Q-56 -158 -40 -170 Q-38 -146 -24 -122 Z"/></g><circle cx="-24" cy="-116" r="5" fill="#8b5a3c"/><circle cx="-18" cy="-112" r="5" fill="#8b5a3c"/></g>'
    + `<g transform="rotate(-8 195 272)"><rect x="110" y="254" width="170" height="38" rx="6" fill="#fff"/><path d="M128 254 V292 M146 254 V292 M164 254 V292 M182 254 V292 M200 254 V292 M218 254 V292 M236 254 V292 M254 254 V292 M272 254 V292" stroke="#5bc0eb" stroke-width="9"/></g>`
    + `<path d="${estrelaPath(36, 270, 12, 6)}" fill="#ff8a5c" stroke="#e5684d" stroke-width="1.5" stroke-linejoin="round"/><g transform="translate(320 276)"><path d="M-12 0 Q0 -18 12 0 Z" fill="#ffd6e7" stroke="#f0a0c0" stroke-width="1.6"/><path d="M0 0 V-12 M-6 0 L-3 -10 M6 0 L3 -10" stroke="#f0a0c0" stroke-width="1.2"/></g><circle cx="90" cy="290" r="3" fill="#fff" opacity=".8"/><circle cx="250" cy="226" r="2.5" fill="#fff" opacity=".8"/>`;
}

function temaEspaco(u) {
  return `<defs><linearGradient id="${u}te" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140f3a"/><stop offset="1" stop-color="#3b2a78"/></linearGradient><radialGradient id="${u}terra" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#7fd4ff"/><stop offset="1" stop-color="#2a6fd0"/></radialGradient><linearGradient id="${u}piso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6a96"/><stop offset="1" stop-color="#3a4570"/></linearGradient><radialGradient id="${u}plat"><stop offset="0" stop-color="#8ff3ff" stop-opacity=".9"/><stop offset="1" stop-color="#8ff3ff" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="390" height="300" fill="url(#${u}te)"/><g fill="#fff">${pontos(46, 11, 4, 4, 386, 205).map(([x, y, r]) => `<circle class="${r > 0.85 ? 'bq-pisca' : ''}" cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.6 + r * 1.4)}" opacity="${f1(0.5 + r / 2)}"/>`).join('')}</g>`
    + `<path d="M230 40 L290 18" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/><circle cx="292" cy="17" r="2.6" fill="#fff"/>`
    + `<g transform="translate(310 70)"><circle class="bichinho-luz" r="60" fill="url(#${u}luz)" opacity=".5"/><ellipse rx="44" ry="11" fill="none" stroke="#ffd36e" stroke-width="5" transform="rotate(-18)"/><circle r="24" fill="#ff9f6b"/><path d="M-22 -6 Q0 -2 22 -8 M-23 6 Q0 10 23 4" stroke="#e5684d" stroke-width="4" fill="none" opacity=".6"/><path d="M-44 0 A44 11 0 0 0 44 0" fill="none" stroke="#ffd36e" stroke-width="5" transform="rotate(-18)"/></g>`
    + `<g transform="translate(90 96)"><circle r="52" fill="#cfd6e4" stroke="#8d99ae" stroke-width="4"/><circle r="44" fill="#0d0a2b"/><circle cx="-6" cy="4" r="26" fill="url(#${u}terra)"/><path d="M-22 -8 Q-12 -14 -6 -6 Q0 2 -10 8 Z M2 10 Q10 6 14 14 Q8 22 0 18 Z" fill="#5fd38d"/><circle cx="24" cy="-22" r="7" fill="#e8e3d0"/><circle cx="22" cy="-24" r="1.6" fill="#c9c2a8"/>${Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; return `<circle cx="${f1(Math.cos(a) * 48)}" cy="${f1(Math.sin(a) * 48)}" r="2.4" fill="#8d99ae"/>`; }).join('')}<path d="M-30 -30 Q-20 -40 -6 -42" stroke="#fff" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/></g>`
    + `<rect y="206" width="390" height="94" fill="url(#${u}piso)"/><path d="M0 206 H390" stroke="#8fa2d6" stroke-width="5"/><path d="M0 236 H390 M0 268 H390 M60 206 V236 M180 206 V236 M300 206 V236 M120 236 V268 M240 236 V268 M360 236 V268 M60 268 V300 M180 268 V300 M300 268 V300" stroke="#2c355c" stroke-width="2"/>`
    + `${[30, 110, 280, 360].map((x) => `<circle class="bq-pisca" cx="${x}" cy="220" r="3" fill="#8ff3ff"/>`).join('')}<ellipse cx="195" cy="274" rx="150" ry="28" fill="url(#${u}plat)"/><ellipse cx="195" cy="274" rx="118" ry="18" fill="none" stroke="#8ff3ff" stroke-width="3" stroke-dasharray="10 8" opacity=".8"/>`
    + '<g transform="translate(350 230)"><path d="M0 -60 Q12 -44 12 -20 H-12 Q-12 -44 0 -60 Z" fill="#fff" stroke="#8d99ae" stroke-width="2"/><circle cx="0" cy="-38" r="5" fill="#7fd4ff" stroke="#8d99ae" stroke-width="1.6"/><path d="M-12 -24 L-20 -12 H-12 Z M12 -24 L20 -12 H12 Z" fill="#e5484d"/><path d="M-6 -20 L0 -8 L6 -20" fill="#ffd36e"/><rect x="-16" y="-8" width="32" height="8" rx="3" fill="#8d99ae"/></g>';
}

function temaJardim(u, dia) {
  const ceuJ = dia ? ['#bdeaff', '#ffe6f2'] : ['#1f2c5c', '#5a3f7a'];
  const luzes = Array.from({ length: 13 }, (_, k) => { const x = 10 + k * 30; const y = 34 + Math.sin(k * 0.9) * 6 + (k % 2) * 6; return [x, y]; });
  return `<defs><linearGradient id="${u}tj" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ceuJ[0]}"/><stop offset="1" stop-color="${ceuJ[1]}"/></linearGradient><linearGradient id="${u}grama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdc7a"/><stop offset="1" stop-color="#4fae5f"/></linearGradient><radialGradient id="${u}vaga"><stop offset="0" stop-color="#fff7b0"/><stop offset="1" stop-color="#fff7b0" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="390" height="300" fill="url(#${u}tj)"/>${dia ? '' : pontos(12, 5, 120, 6, 380, 90).map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.8 + r)}" fill="#fff"/>`).join('')}`
    + '<g fill="#5fbf6e"><circle cx="-10" cy="40" r="60"/><circle cx="40" cy="10" r="46"/><circle cx="400" cy="40" r="60"/><circle cx="350" cy="6" r="44"/><circle cx="200" cy="-30" r="56"/></g><g fill="#7fd67c" opacity=".8"><circle cx="20" cy="30" r="30"/><circle cx="370" cy="30" r="28"/><circle cx="210" cy="-6" r="30"/></g>'
    + `<path d="M0 34 ${luzes.map(([x, y]) => `L${x} ${y}`).join(' ')} L390 34" stroke="#3f8a4a" stroke-width="1.6" fill="none"/>${luzes.map(([x, y], k) => `<circle class="bichinho-luz" cx="${x}" cy="${y + 4}" r="9" fill="url(#${u}vaga)"/><circle cx="${x}" cy="${y + 4}" r="3.4" fill="${['#fff3a8', '#ffc2e0', '#c2f0ff'][k % 3]}"/>`).join('')}`
    + '<g transform="translate(66 206)"><path d="M-22 0 V-40 H22 V0 Z" fill="#fff4e0" stroke="#d9b98a" stroke-width="2"/><path d="M-6 0 V-14 Q0 -20 6 -14 V0 Z" fill="#a8743f"/><circle cx="12" cy="-28" r="5" fill="#ffe08a" stroke="#d9b98a" stroke-width="1.6"/><path d="M-50 -36 Q-50 -92 0 -94 Q50 -92 50 -36 Q0 -26 -50 -36 Z" fill="#ff6f6f" stroke="#c94545" stroke-width="2.4"/><g fill="#fff"><circle cx="-24" cy="-62" r="8"/><circle cx="6" cy="-78" r="7"/><circle cx="28" cy="-54" r="7"/><circle cx="-4" cy="-50" r="5"/></g></g>'
    + `<g transform="translate(322 190)"><path d="M0 0 V-46" stroke="#4fae5f" stroke-width="4"/>${Array.from({ length: 6 }, (_, k) => `<ellipse cx="0" cy="-58" rx="7" ry="13" fill="#ff9fd0" transform="rotate(${k * 60} 0 -46)"/>`).join('')}<circle cx="0" cy="-46" r="7" fill="#ffd36e"/><path d="M0 -14 Q14 -22 20 -12 Q8 -6 0 -14 Z" fill="#5cc46f"/></g>`
    + `<rect y="200" width="390" height="100" fill="url(#${u}grama)"/><path d="M0 200 Q40 192 80 200 T160 200 T240 200 T320 200 T400 200" stroke="#5fbf6e" stroke-width="6" fill="none"/>`
    + `<ellipse cx="195" cy="272" rx="132" ry="22" fill="#6fc77a" opacity=".7"/>${Array.from({ length: 10 }, (_, k) => { const a = (k * Math.PI * 2) / 10; return florzinhaJ(195 + Math.cos(a) * 126, 272 + Math.sin(a) * 20, ['#ff8fb1', '#ffd36e', '#c59bff', '#fff'][k % 4]); }).join('')}`
    + `${[[30, 236], [358, 230], [110, 216], [280, 214]].map(([x, y], k) => florzinhaJ(x, y, ['#fff', '#ff8fb1', '#ffd36e', '#c59bff'][k])).join('')}`
    + `<g class="bq-vagalumes">${pontos(7, 21, 20, 110, 370, 200).map(([x, y]) => `<circle class="bq-pisca" cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="#fff7b0"/>`).join('')}</g>`;
}
const florzinhaJ = (x, y, cor) => `<g transform="translate(${f1(x)} ${f1(y)})"><circle cx="-3.5" r="3.6" fill="${cor}"/><circle cx="3.5" r="3.6" fill="${cor}"/><circle cy="-3.5" r="3.6" fill="${cor}"/><circle cy="3.5" r="3.6" fill="${cor}"/><circle r="2.4" fill="#ffd36e"/></g>`;

// ---------- o quarto inteiro ----------
// b: o bichinho (usa b.quarto, b.brinquedos e, no retrato, a espécie e as roupas).
export function svgQuarto(b, dia, { semBrinquedos = false, vb = '0 0 390 300', classe = 'bichinho-fundo', par = 'xMidYMax slice' } = {}) {
  const u = `bq${++seq}`;
  const usando = b?.quarto?.usando ?? {};
  const defsComuns = `<linearGradient id="${u}ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#d6f0ff"/></linearGradient><radialGradient id="${u}luz"><stop offset="0" stop-color="#fff6c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c4" stop-opacity="0"/></radialGradient>`;
  let corpo;
  if (usando.tema === 'tema-praia') corpo = temaPraia(u, dia);
  else if (usando.tema === 'tema-espaco') corpo = temaEspaco(u);
  else if (usando.tema === 'tema-jardim') corpo = temaJardim(u, dia);
  else {
    const parede = PAREDE[usando.parede] ?? PAREDE.padrao;
    corpo = `<defs><linearGradient id="${u}pa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bq-parede1)"/><stop offset="1" stop-color="var(--bq-parede2)"/></linearGradient><linearGradient id="${u}ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bq-chao1)"/><stop offset="1" stop-color="var(--bq-chao2)"/></linearGradient>${parede(u)}</defs>`
      + `<rect width="390" height="300" fill="url(#${u}pa)"/><rect width="390" height="212" fill="url(#${u}pp)"/>`
      + janela(u, usando.cortina, dia) + quadro(usando.quadro, b)
      + '<rect x="220" y="128" width="92" height="7" rx="3" fill="#c99a6b"/><g transform="translate(278 104)"><rect width="10" height="24" rx="2" fill="#8fc8ff"/><rect x="11" y="3" width="9" height="21" rx="2" fill="#ff8fb1"/><rect x="21" y="6" width="10" height="18" rx="2" fill="#ffd36e" transform="rotate(10 26 24)"/></g>'
      + planta(usando.planta)
      + `<rect y="212" width="390" height="88" fill="url(#${u}ch)"/><path d="M0 212 H390" stroke="var(--bq-rodape)" stroke-width="6"/><path d="M0 240 H390 M0 270 H390 M70 212 V240 M200 240 V270 M300 212 V240 M120 270 V300 M340 270 V300" stroke="var(--bq-tabua)" stroke-width="2"/>`
      + tapete(usando.tapete) + abajur(u, usando.abajur) + cama(usando.cama);
  }
  const extras = semBrinquedos ? '' : brinquedos(b?.brinquedos ?? [], !usando.tema && Boolean(usando.cama), Boolean(usando.tema));
  return `<svg class="${classe}" viewBox="${vb}" preserveAspectRatio="${par}" aria-hidden="true"><defs>${defsComuns}</defs>${corpo}${extras}</svg>`;
}

// Miniatura de um item do quarto para a vitrine: o quarto de sempre com o item, recortado nele.
const RECORTE = { tema: '0 0 390 300', parede: '150 0 110 100', cortina: '12 6 160 140', cama: '0 96 126 154', tapete: '44 240 302 60', quadro: '250 30 86 78', abajur: '300 90 88 132', planta: '198 40 72 92' };
export function svgItemQuarto(id, b) {
  const lugar = id.split('-')[0] === 'janela' ? 'cortina' : { tema: 'tema', parede: 'parede', cortina: 'cortina', cama: 'cama', tapete: 'tapete', quadro: 'quadro', abajur: 'abajur', planta: 'planta' }[id.split('-')[0]];
  const falso = { ...b, quarto: { usando: { [lugar]: id } }, brinquedos: [] };
  return svgQuarto(falso, true, { semBrinquedos: true, vb: RECORTE[lugar], classe: 'bq-mini', par: 'xMidYMid meet' });
}

// ---------- esconderijos do esconde-esconde ----------
// Cada um: desenho, onde as orelhinhas espiam (ox, oy = topo do objeto) e onde o rabinho aparece.
const ESC = {
  cortina: { svg: '<rect x="8" y="14" width="96" height="8" rx="4" fill="#c99a6b"/><path d="M14 20 Q8 120 16 236 L100 236 Q92 120 98 20 Z" fill="#ff9fc0" stroke="#f27aa8" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 24 Q26 130 32 234 M50 24 Q48 130 52 234 M70 24 Q72 130 70 234 M86 24 Q90 130 86 234" stroke="#f27aa8" stroke-width="2" fill="none" opacity=".6"/><path d="M14 228 Q56 240 100 228 L100 238 Q56 248 14 238 Z" fill="#ffd6e7" stroke="#f27aa8" stroke-width="2"/>', ox: 58, oy: 236, espia: 'pes', rx: 100, ry: 200 },
  poltrona: { svg: '<path d="M164 226 V150 Q164 120 196 120 Q228 120 228 150 V226 Z" fill="#8f7bd6" stroke="#6a55b8" stroke-width="2.4"/><rect x="146" y="176" width="100" height="40" rx="14" fill="#a894ea" stroke="#6a55b8" stroke-width="2.4"/><rect x="140" y="160" width="22" height="58" rx="10" fill="#8f7bd6" stroke="#6a55b8" stroke-width="2.4"/><rect x="230" y="160" width="22" height="58" rx="10" fill="#8f7bd6" stroke="#6a55b8" stroke-width="2.4"/><path d="M152 218 V230 M240 218 V230" stroke="#6a55b8" stroke-width="5" stroke-linecap="round"/><circle cx="196" cy="146" r="3" fill="#6a55b8"/>', ox: 196, oy: 122, rx: 252, ry: 186 },
  vaso: { svg: '<g fill="#4fae5f" stroke="#3a8a48" stroke-width="2"><path d="M336 176 Q300 150 296 104 Q322 130 338 172 Z"/><path d="M338 176 Q336 120 352 84 Q362 130 344 176 Z"/><path d="M344 176 Q370 140 384 110 Q384 150 350 178 Z"/><path d="M336 176 Q310 170 290 146 Q320 150 338 170 Z"/></g><path d="M310 176 H372 L364 226 H318 Z" fill="#d9825b" stroke="#b05f3c" stroke-width="2.4" stroke-linejoin="round"/><rect x="306" y="170" width="70" height="12" rx="4" fill="#e8956c" stroke="#b05f3c" stroke-width="2.4"/><path d="M322 196 Q341 204 360 196" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>', ox: 340, oy: 172, rx: 306, ry: 214, rabo: 'esquerda' },
  cesto: { svg: '<path d="M26 236 H104 L96 292 H34 Z" fill="#e8c08a" stroke="#b98a52" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 250 H100 M32 264 H98 M33 278 H97 M44 236 L46 292 M60 236 L60 292 M76 236 L74 292 M90 236 L86 292" stroke="#b98a52" stroke-width="1.6" opacity=".7"/><path d="M34 236 Q40 222 54 230 Q60 218 74 228 Q86 220 96 236 Z" fill="#8fc8ff" stroke="#5b9fd6" stroke-width="2"/><path d="M66 230 Q72 222 80 226" stroke="#ff8fb1" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="22" y="232" width="86" height="8" rx="4" fill="#d9a066" stroke="#b98a52" stroke-width="2"/>', ox: 64, oy: 232, rx: 104, ry: 270 },
  almofada: { svg: '<ellipse cx="196" cy="282" rx="56" ry="16" fill="#ffb84d" stroke="#e0902a" stroke-width="2.4"/><ellipse cx="180" cy="262" rx="40" ry="16" fill="#8fe3b0" stroke="#4fbf80" stroke-width="2.4" transform="rotate(-8 180 262)"/><ellipse cx="210" cy="246" rx="34" ry="14" fill="#ff8fb1" stroke="#e86a9a" stroke-width="2.4" transform="rotate(10 210 246)"/><g fill="#fff" opacity=".7"><circle cx="210" cy="246" r="2.4"/><circle cx="180" cy="262" r="2.4"/><circle cx="196" cy="282" r="2.4"/></g>', ox: 204, oy: 236, rx: 250, ry: 270 },
  caixa: { svg: `<rect x="272" y="236" width="88" height="56" rx="6" fill="#3e7bfa" stroke="#2a5fd0" stroke-width="2.4"/><path d="M268 228 H364 L360 240 H272 Z" fill="#5b95ff" stroke="#2a5fd0" stroke-width="2.4" stroke-linejoin="round"/><path d="${estrelaPath(316, 264, 13)}" fill="#ffd36e" stroke="#e0a72e" stroke-width="1.6"/><path d="M280 216 L292 228 M346 214 Q350 222 344 228" stroke="#e5484d" stroke-width="5" stroke-linecap="round"/><circle cx="300" cy="222" r="7" fill="#ffd23f" stroke="#e0a72e" stroke-width="1.6"/>`, ox: 316, oy: 228, rx: 270, ry: 262, rabo: 'esquerda' },
};
ESC.casinha = { svg: `<g transform="translate(316 294) scale(.98)">${ARTE_BRINQUEDOS.casinha.svg}</g>`, ox: 316, oy: 226, rx: 276, ry: 274, rabo: 'esquerda' };
ESC.ursinho = { svg: `<g transform="translate(342 222) scale(1.35)">${ARTE_BRINQUEDOS.ursinho.svg}</g>`, ox: 342, oy: 142, rx: 312, ry: 196, rabo: 'esquerda' };

// O desenho de todos os esconderijos (lugares vem de esconderijos() da lógica).
export function svgEsconderijos(lugares, especie, vestindo) {
  const orelhas = svgBichinho(especie, vestindo, { vb: '14 -40 172 96', classe: 'bc-estatico' }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const rabinho = svgRabinho(especie).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const pes = svgBichinho(especie, {}, { vb: '50 170 100 26', classe: 'bc-estatico' }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  return `<svg class="bq-esconde" viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice">${lugares.map((l) => {
    const e = ESC[l.id];
    const espiaCima = e.espia === 'pes'
      ? `<g class="bq-espia bq-espia-pes"><svg x="${e.ox - 40}" y="${e.oy - 6}" width="80" height="21" viewBox="50 170 100 26">${pes}</svg></g>`
      : `<g class="bq-espia bq-espia-cima"><svg x="${e.ox - 46}" y="${e.oy - 44}" width="92" height="51" viewBox="14 -40 172 96">${orelhas}</svg></g>`;
    const esq = e.rabo === 'esquerda';
    const espiaRabo = `<g class="bq-espia bq-espia-rabo"><svg x="${esq ? e.rx - 52 : e.rx - 6}" y="${e.ry - 40}" width="48" height="60" viewBox="122 92 80 100"${esq ? ' transform-origin="center" style="transform: scaleX(-1); transform-box: fill-box"' : ''}>${rabinho}</svg></g>`;
    return `<g class="bq-esc" data-lugar="${l.id}" role="button" aria-label="Procurar atrás de ${l.nome}">${espiaCima}${espiaRabo}<g class="bq-esc-obj">${e.svg}</g></g>`;
  }).join('')}</svg>`;
}
