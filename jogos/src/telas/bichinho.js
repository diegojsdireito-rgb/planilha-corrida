// Tela do Meu Bichinho: adoção, quarto com o bichinho desenhado em SVG, comer, banho de
// espuma, brincadeira de pegar a bolinha, dormir (apaga a luz) e loja de roupinhas e comidas.
// Estado em prefs.bichinho e moedas em prefs.carteira.moedas (ambos por perfil, via guardar()).
import { el } from '../comum.js';
import { prefs, guardar } from '../dados.js';
import * as bc from '../bichinho.js';

export const INFO = {
  id: 'bichinho',
  nome: 'Meu Bichinho',
  descricao: 'Cuide do seu bichinho virtual',
  solo: true,
  semNivel: true,
  rotuloNovo: '🏠 Voltar para o quarto',
  regras: [
    'Na primeira vez, escolha o seu bichinho (gatinho, cachorrinho, coelhinho, dinossaurinho ou unicórnio) e dê um nome para ele.',
    'As barras mostram a barriguinha, a limpeza, a alegria e a energia. Elas caem devagar com o tempo, mesmo com o app fechado. Ele nunca fica doente: no máximo fica tristinho esperando você.',
    '🍎 Comer: escolha uma comida. As do dia a dia são de graça; as especiais vêm da loja.',
    '🛁 Banho: esfregue o bichinho com o dedo até encher de espuma e depois toque em Enxaguar.',
    '⚽ Brincar: toque na bolinha quantas vezes conseguir antes do tempo acabar. Pegando 5 ou mais, você ganha 5 🪙.',
    '💤 Dormir: apaga a luz e a energia volta aos pouquinhos. Quando a energia enche, ele acorda sozinho.',
    `🛍️ Loja: chapéus, laços, óculos, cachecóis e comidas especiais, pagos com as moedas 🪙 do app. Cuidando do bichinho dá para ganhar até ${bc.LIMITE_MOEDAS_DIA} 🪙 por dia.`,
    'Toque no bichinho para fazer carinho!',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#ffe6f0"/><path d="M2.4 5.6 2.9 1.9 5 3.6ZM9.6 5.6 9.1 1.9 7 3.6Z" fill="#ffb45e" stroke="#c96a1e" stroke-width=".3" stroke-linejoin="round"/><ellipse cx="6" cy="6.6" rx="4" ry="3.6" fill="#ffb45e" stroke="#c96a1e" stroke-width=".3"/><ellipse cx="4.5" cy="6.3" rx=".6" ry=".75" fill="#2a2135"/><ellipse cx="7.5" cy="6.3" rx=".6" ry=".75" fill="#2a2135"/><circle cx="4.3" cy="6" r=".22" fill="#fff"/><circle cx="7.3" cy="6" r=".22" fill="#fff"/><path d="M5.6 7.3h.8L6 7.7Z" fill="#ff6f91"/><path d="M5.3 8.1q.35.35.7 0 .35.35.7 0" stroke="#2a2135" stroke-width=".25" fill="none" stroke-linecap="round"/><ellipse cx="3.6" cy="7.6" rx=".6" ry=".35" fill="#ff8fb1" opacity=".6"/><ellipse cx="8.4" cy="7.6" rx=".6" ry=".35" fill="#ff8fb1" opacity=".6"/><path d="M9 1.4l.3.6.6.1-.45.4.1.6-.55-.3-.55.3.1-.6-.45-.4.6-.1Z" fill="#ff5c8a"/></svg>';

// ---------- arte do bichinho (viewBox 0 -30 200 230) ----------
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
const ARTE_ACESSORIOS = {
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

const SUJEIRA = [[76, 142, 11, 8], [128, 162, 9, 7], [114, 62, 8, 6], [70, 72, 6, 5], [140, 116, 7, 5], [96, 176, 7, 5]];

export function svgBichinho(especie, vestindo = {}) {
  const p = PALETAS[especie] ?? PALETAS.gato;
  const g = `bcg${++sequencia}`;
  const usar = (lugar) => (vestindo[lugar] && ARTE_ACESSORIOS[vestindo[lugar]] ? ARTE_ACESSORIOS[vestindo[lugar]].svg() : '');
  const almofadas = ['gato', 'cachorro', 'coelho'].includes(especie) ? `<ellipse cx="78" cy="186" rx="6" ry="3" fill="${p.interna}"/><ellipse cx="122" cy="186" rx="6" ry="3" fill="${p.interna}"/>` : '';
  const pes = especie === 'unicornio' ? '#d9c6f0' : p.corpo;
  const listras = especie === 'dino' ? `<path d="M80 150 Q100 154 120 150 M78 162 Q100 166 122 162 M84 173 Q100 177 116 173" stroke="${p.linha}" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>` : '';
  return `<svg viewBox="0 -30 200 230" class="bc-svg" aria-hidden="true">
<defs><radialGradient id="${g}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${p.claro}"/><stop offset="1" stop-color="${p.corpo}"/></radialGradient></defs>
<ellipse class="bc-sombra" cx="100" cy="194" rx="54" ry="7" fill="#000" opacity=".13"/>
<g class="bc-pet">
  <g class="bc-rabo">${rabo(especie, p, g)}</g>
  <g class="bc-corpo">
    <ellipse cx="100" cy="150" rx="45" ry="39" fill="url(#${g})" ${contorno(p)}/>
    <ellipse cx="100" cy="160" rx="27" ry="24" fill="${p.barriga}"/>${listras}
    <ellipse cx="61" cy="150" rx="10" ry="15" transform="rotate(22 61 150)" fill="${p.corpo}" ${contorno(p)}/>
    <ellipse cx="139" cy="150" rx="10" ry="15" transform="rotate(-22 139 150)" fill="${p.corpo}" ${contorno(p)}/>
    <ellipse cx="78" cy="185" rx="16" ry="9" fill="${pes}" ${contorno(p)}/><ellipse cx="122" cy="185" rx="16" ry="9" fill="${pes}" ${contorno(p)}/>${almofadas}
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
    ${usar('olhos')}${usar('pescoco')}${usar('cabeca')}${usar('laco')}
  </g>
</g></svg>`;
}

function svgAcessorio(id) {
  const a = ARTE_ACESSORIOS[id];
  return `<svg viewBox="${a.vb}" aria-hidden="true">${a.svg()}</svg>`;
}

// ---------- cenário do quarto ----------
function svgQuarto(dia) {
  const ceu = dia
    ? '<rect x="44" y="40" width="96" height="76" fill="url(#bq-ceu)"/><circle cx="118" cy="62" r="11" fill="#ffd84d"/><g fill="#fff"><ellipse cx="72" cy="80" rx="16" ry="7"/><ellipse cx="84" cy="75" rx="11" ry="8"/><ellipse cx="112" cy="98" rx="12" ry="5"/></g>'
    : '<rect x="44" y="40" width="96" height="76" fill="#24306b"/><path d="M118 52 a12 12 0 1 0 8 20 a10 10 0 1 1 -8 -20Z" fill="#fff3b0"/><g fill="#fff"><circle cx="62" cy="56" r="1.6"/><circle cx="80" cy="90" r="1.3"/><circle cx="96" cy="60" r="1.2"/><circle cx="70" cy="104" r="1.5"/><circle cx="104" cy="100" r="1"/></g>';
  return `<svg class="bichinho-fundo" viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
  <linearGradient id="bq-parede" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bq-parede1)"/><stop offset="1" stop-color="var(--bq-parede2)"/></linearGradient>
  <linearGradient id="bq-chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bq-chao1)"/><stop offset="1" stop-color="var(--bq-chao2)"/></linearGradient>
  <linearGradient id="bq-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#d6f0ff"/></linearGradient>
  <radialGradient id="bq-luz"><stop offset="0" stop-color="#fff6c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c4" stop-opacity="0"/></radialGradient>
  <pattern id="bq-bolinhas" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.2" fill="var(--bq-bolinha)"/><circle cx="19" cy="19" r="2.2" fill="var(--bq-bolinha)"/></pattern>
</defs>
<rect width="390" height="300" fill="url(#bq-parede)"/>
<rect width="390" height="212" fill="url(#bq-bolinhas)"/>
<rect x="34" y="30" width="116" height="96" rx="10" fill="#fff" stroke="#e6cfa8" stroke-width="4"/>
${ceu}
<path d="M92 40 V116 M44 78 H140" stroke="#fff" stroke-width="5"/>
<path d="M30 26 Q40 80 34 132 L56 132 Q48 80 58 26 Z" fill="#ff9fc0"/><path d="M154 26 Q144 80 150 132 L128 132 Q136 80 126 26 Z" fill="#ff9fc0"/>
<rect x="24" y="20" width="136" height="8" rx="4" fill="#c99a6b"/>
<g transform="translate(262 46)"><rect width="62" height="50" rx="6" fill="#fff" stroke="#c99a6b" stroke-width="4"/><path d="${coracao(31, 27, 0.9)}" fill="#ff8fb1"/></g>
<rect x="220" y="128" width="92" height="7" rx="3" fill="#c99a6b"/>
<g transform="translate(232 104)"><rect width="18" height="24" rx="3" fill="#8fc8ff"/><rect x="22" y="6" width="14" height="18" rx="3" fill="#ffd36e"/><circle cx="56" cy="14" r="10" fill="#8fe3b0"/><circle cx="52" cy="11" r="2" fill="#fff"/></g>
<rect y="212" width="390" height="88" fill="url(#bq-chao)"/>
<path d="M0 212 H390" stroke="var(--bq-rodape)" stroke-width="6"/>
<path d="M0 240 H390 M0 270 H390 M70 212 V240 M200 240 V270 M300 212 V240 M120 270 V300 M340 270 V300" stroke="var(--bq-tabua)" stroke-width="2"/>
<ellipse cx="195" cy="272" rx="140" ry="24" fill="var(--bq-tapete)"/><ellipse cx="195" cy="272" rx="118" ry="17" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-dasharray="8 7"/>
<g class="bichinho-abajur" transform="translate(344 120)"><circle class="bichinho-luz" cx="0" cy="22" r="58" fill="url(#bq-luz)"/><path d="M0 26 V96" stroke="#8b5a3c" stroke-width="5"/><ellipse cx="0" cy="98" rx="18" ry="5" fill="#8b5a3c"/><path d="M-20 26 L-12 0 H12 L20 26 Z" fill="#ffd36e" stroke="#e0a72e" stroke-width="2.5" stroke-linejoin="round"/></g>
</svg>`;
}

const BOLA = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#fff" stroke="#3a3045" stroke-width="2"/><path d="M20 2 A18 18 0 0 1 37 14 L20 20 Z" fill="#e5484d"/><path d="M37 26 A18 18 0 0 1 26 37 L20 20 Z" fill="#3e7bfa"/><path d="M14 37 A18 18 0 0 1 2 24 L20 20 Z" fill="#ffd21f"/><path d="M3 12 A18 18 0 0 1 12 3.5 L20 20 Z" fill="#2f9e62"/><circle cx="20" cy="20" r="4" fill="#fff" stroke="#3a3045" stroke-width="1.5"/><ellipse cx="13" cy="10" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-30 13 10)"/></svg>';

const FRASES = ['Eu gosto de você! 💛', 'Que dia lindo!', 'Faz carinho em mim?', 'Lá-lá-lá 🎵', 'Você é meu melhor amigo!', 'Hihi!'];
const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- resumo para a tela inicial ----------
export function resumo() {
  const b0 = bc.normalizarBichinho(prefs.bichinho);
  if (!b0) {
    return {
      cartao: 'Adote um bichinho!',
      placar: '<span class="lado"><span class="avatar voce">🐾</span>Escolha e dê um nome ao seu bichinho</span>',
      painel: { valor: '🐾', rotulo: 'adote um bichinho', sub: 'gatinho, cachorrinho, coelhinho…' },
    };
  }
  const b = bc.atualizar(b0, Date.now());
  const h = bc.humor(b);
  const esp = bc.ESPECIES.find((e) => e.id === b.especie);
  return {
    cartao: `<b>${b.nome}</b> · ${h.emoji} ${h.texto}`,
    placar: `<span class="lado"><span class="avatar voce">${esp.emoji}</span><b>${b.nome}</b></span><span class="x">·</span><span class="lado">${h.emoji} ${h.texto}</span>`,
    painel: { valor: b.nome, rotulo: `${h.emoji} ${h.texto}`, sub: esp.nome },
  };
}

// ---------- tela ----------
export function montar(area, ctl) {
  const raiz = el('div', 'bichinho');
  area.append(raiz);
  let b = null;
  let modo = 'quarto';
  let vivo = ctl.ativa();
  let relogio = null;
  let jogo = null; // mini-jogo em andamento
  let ultimoCarinho = 0;
  let falaTimer = null;
  let especieEscolhida = null;

  const carteira = () => prefs.carteira ?? { moedas: 0 };
  const moedas = () => carteira().moedas ?? 0;
  function gravar(novo, novaCarteira) {
    b = novo;
    prefs.bichinho = novo;
    if (novaCarteira) prefs.carteira = novaCarteira;
    guardar();
  }
  const q = (s) => raiz.querySelector(s);

  function iniciar() {
    pararTudo();
    vivo = ctl.ativa();
    modo = 'quarto';
    const salvo = bc.normalizarBichinho(prefs.bichinho);
    if (!salvo) { telaAdocao(); return; }
    gravar(bc.atualizar(salvo, Date.now()));
    telaQuarto();
    const p = bc.pedido(b);
    if (bc.humor(b).id === 'triste') ctl.status(`${b.nome} está tristinho e com saudade... ${p ? p.texto : ''}`);
    else ctl.status(p ? `${b.nome}: ${p.texto}` : `Oi! ${b.nome} estava com saudade! 💛`);
  }

  function pararTudo() {
    clearInterval(relogio); relogio = null;
    clearTimeout(falaTimer);
    if (jogo) { jogo.parar(); jogo = null; }
  }

  // ---------- adoção ----------
  function telaAdocao(anterior = null) {
    pararTudo();
    especieEscolhida = null;
    raiz.className = 'bichinho bichinho-adocao';
    raiz.innerHTML = `
      <h3 class="bichinho-titulo">Escolha o seu bichinho!</h3>
      <div class="bichinho-especies">${bc.ESPECIES.map((e) => `<button class="bichinho-especie" data-especie="${e.id}" aria-label="${e.nome}"><span class="bichinho-mini bc-h-contente">${svgBichinho(e.id)}</span><span>${e.nome}</span></button>`).join('')}</div>
      <div class="bichinho-nomear" hidden>
        <label for="bichinho-nome">Qual vai ser o nome?</label>
        <input id="bichinho-nome" maxlength="16" autocomplete="off" placeholder="Escreva um nome">
        <div class="bichinho-sugestoes">${bc.NOMES_SUGERIDOS.slice(0, 6).map((n) => `<button class="bichinho-chip" data-nome="${n}">${n}</button>`).join('')}</div>
        <button class="bichinho-adotar">Adotar! 💛</button>
      </div>
      ${anterior ? '<button class="bichinho-link bichinho-cancelar">Voltar para o meu bichinho</button>' : ''}`;
    ctl.status(anterior ? 'As roupinhas e a despensa continuam suas.' : 'Toque no bichinho que você quer cuidar.');
    raiz.querySelectorAll('[data-especie]').forEach((botao) => {
      botao.onclick = () => {
        especieEscolhida = botao.dataset.especie;
        raiz.querySelectorAll('[data-especie]').forEach((x) => x.classList.toggle('escolhido', x === botao));
        pular(botao.querySelector('.bichinho-mini'));
        ctl.som('clique');
        const caixa = q('.bichinho-nomear');
        caixa.hidden = false;
        const e = bc.ESPECIES.find((x) => x.id === especieEscolhida);
        ctl.status(`Que lindo ${e.nome.toLowerCase()}! Agora dê um nome.`);
        caixa.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
      };
    });
    raiz.querySelectorAll('[data-nome]').forEach((c) => { c.onclick = () => { q('#bichinho-nome').value = c.dataset.nome; ctl.som('clique'); }; });
    q('.bichinho-adotar').onclick = () => {
      const r = bc.novoBichinho(especieEscolhida, q('#bichinho-nome').value, Date.now(), anterior);
      if (r.erro) { ctl.status(r.erro, 'derrota'); ctl.som('erro'); return; }
      gravar(r.bichinho);
      ctl.som('vitoria');
      vivo = ctl.ativa();
      telaQuarto();
      ctl.status(`Oi! Eu sou ${b.nome}! Que bom te conhecer! 💛`, 'vitoria');
      pular();
      coracoes(4);
    };
    q('#bichinho-nome').onkeydown = (ev) => { if (ev.key === 'Enter') q('.bichinho-adotar').click(); };
    const cancelar = q('.bichinho-cancelar');
    if (cancelar) cancelar.onclick = () => { ctl.som('clique'); iniciar(); };
  }

  // ---------- quarto ----------
  function telaQuarto() {
    const hora = new Date().getHours();
    raiz.className = 'bichinho';
    raiz.innerHTML = `
      <div class="bichinho-topo">
        <div class="bichinho-quem"><b class="bichinho-nome-txt"></b><span class="bichinho-humor"></span></div>
        <div class="bichinho-saldo" title="Moedas do app">🪙 <b></b></div>
      </div>
      <div class="bichinho-barras">${bc.BARRAS.map((x) => `<div class="bichinho-barra" data-barra="${x.id}"><span class="bichinho-barra-ic">${x.icone}</span><span class="bichinho-barra-trilho"><span class="bichinho-barra-cheio"></span></span><span class="bichinho-barra-rot">${x.nome}</span></div>`).join('')}</div>
      <div class="bichinho-cena">
        ${svgQuarto(hora >= 6 && hora < 18)}
        <div class="bichinho-escuro"></div>
        <div class="bichinho-pet-lugar"><button class="bichinho-pet" aria-label="Fazer carinho"></button></div>
        <div class="bichinho-balao" hidden></div>
        <div class="bichinho-zzz" aria-hidden="true"><span>Z</span><span>z</span><span>z</span></div>
        <div class="bichinho-fx" aria-hidden="true"></div>
      </div>
      <div class="bichinho-acoes">
        <button data-acao="comer"><span>🍎</span>Comer</button>
        <button data-acao="banho"><span>🛁</span>Banho</button>
        <button data-acao="brincar"><span>⚽</span>Brincar</button>
        <button data-acao="dormir"><span>💤</span>Dormir</button>
        <button data-acao="loja"><span>🛍️</span>Loja</button>
      </div>
      <div class="bichinho-painel"></div>`;
    desenharPet();
    q('.bichinho-pet').onclick = fazerCarinho;
    raiz.querySelectorAll('[data-acao]').forEach((botao) => { botao.onclick = () => acao(botao.dataset.acao); });
    atualizarTela();
    mostrarPainel();
    clearInterval(relogio);
    relogio = setInterval(() => {
      if (!vivo()) { pararTudo(); return; }
      const estava = b.dormindo;
      b = bc.atualizar(b, Date.now());
      if (estava && !b.dormindo) {
        gravar(b);
        ctl.status(`${b.nome} acordou cheio de energia! ☀️`, 'vitoria');
        mostrarPainel();
      }
      atualizarTela();
    }, 2000);
    falar();
  }

  function desenharPet() {
    const pet = q('.bichinho-pet');
    if (pet) pet.innerHTML = svgBichinho(b.especie, b.vestindo);
    atualizarTela();
  }

  // O placar do app (fora da área do jogo) mostra o nome e o humor: mantém atualizado.
  let placarAntes = '';
  function atualizarPlacar() {
    const placar = area.parentElement?.querySelector(':scope > .placar');
    const html = resumo().placar;
    if (placar && html !== placarAntes) { placar.innerHTML = html; placarAntes = html; }
  }

  function atualizarTela() {
    if (!q('.bichinho-cena')) return;
    atualizarPlacar();
    const h = bc.humor(b);
    q('.bichinho-nome-txt').textContent = b.nome;
    q('.bichinho-humor').textContent = `${h.emoji} ${h.texto}`;
    q('.bichinho-saldo b').textContent = fmt(moedas());
    for (const { id } of bc.BARRAS) {
      const v = b.barras[id];
      const barra = q(`[data-barra="${id}"]`);
      barra.querySelector('.bichinho-barra-cheio').style.width = `${Math.max(4, v)}%`;
      barra.classList.toggle('baixa', v < 30);
      barra.classList.toggle('media', v >= 30 && v < 60);
      barra.title = `${Math.round(v)}%`;
    }
    const lugar = q('.bichinho-pet-lugar');
    for (const id of Object.keys(bc.ESTADOS)) lugar.classList.toggle(`bc-h-${id}`, h.id === id);
    lugar.classList.toggle('bc-dorme', b.dormindo);
    const sujo = Math.max(0, Math.min(1, (60 - b.barras.limpeza) / 45));
    lugar.style.setProperty('--bc-sujo', (modo === 'banho' ? sujo * (1 - espumaAtual / 100) : sujo).toFixed(2));
    q('.bichinho-cena').classList.toggle('escuro', b.dormindo);
    const dormir = q('[data-acao="dormir"]');
    dormir.innerHTML = b.dormindo ? '<span>☀️</span>Acordar' : '<span>💤</span>Dormir';
    dormir.classList.toggle('ligado', b.dormindo);
    for (const a of ['comer', 'banho', 'brincar']) q(`[data-acao="${a}"]`).disabled = b.dormindo || Boolean(modo === 'brincar' && a !== 'brincar' && jogo);
    raiz.querySelectorAll('[data-acao]').forEach((x) => x.classList.toggle('ativo', x.dataset.acao === modo));
  }

  function falar(texto, ms = 3200) {
    const balao = q('.bichinho-balao');
    if (!balao) return;
    clearTimeout(falaTimer);
    if (b.dormindo) { balao.hidden = true; return; }
    const t = texto ?? bc.pedido(b)?.texto;
    if (!t) { balao.hidden = true; return; }
    balao.textContent = t;
    balao.hidden = false;
    balao.classList.remove('entra'); void balao.offsetWidth; balao.classList.add('entra');
    falaTimer = setTimeout(() => { if (vivo()) balao.hidden = true; }, ms);
  }

  function pular(alvo) {
    const lugar = alvo ?? q('.bichinho-pet-lugar');
    if (!lugar) return;
    lugar.classList.remove('bc-pula'); void lugar.getBoundingClientRect(); lugar.classList.add('bc-pula');
    setTimeout(() => lugar.classList.remove('bc-pula'), 1300);
  }

  // Ponto do desenho (coordenadas do viewBox do bichinho) dentro da cena, em px.
  function pontoDoPet(x, y) {
    const cena = q('.bichinho-cena').getBoundingClientRect();
    const svg = q('.bichinho-pet svg').getBoundingClientRect();
    return { x: svg.left - cena.left + (x / 200) * svg.width, y: svg.top - cena.top + ((y + 30) / 230) * svg.height };
  }

  function efeito(conteudo, classe, x, y, ms = 1400) {
    const fx = q('.bichinho-fx');
    if (!fx) return null;
    const e = el('span', `bichinho-efeito ${classe}`, conteudo);
    e.style.left = `${x}px`; e.style.top = `${y}px`;
    e.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 60)}px`);
    fx.append(e);
    setTimeout(() => e.remove(), ms);
    return e;
  }

  function coracoes(n = 2, emoji = '💖') {
    if (!q('.bichinho-pet svg')) return;
    for (let k = 0; k < n; k++) {
      const p = pontoDoPet(60 + Math.random() * 80, 20 + Math.random() * 40);
      setTimeout(() => efeito(emoji, 'sobe', p.x, p.y), k * 160);
    }
  }

  function moedinhas(ganhas) {
    if (!ganhas) return;
    const p = pontoDoPet(100, 30);
    efeito(`+${ganhas} 🪙`, 'sobe moeda', p.x, p.y, 1800);
    ctl.som('moeda');
    const saldo = q('.bichinho-saldo');
    saldo?.classList.remove('brilha'); void saldo?.offsetWidth; saldo?.classList.add('brilha');
  }

  function fazerCarinho() {
    if (modo === 'banho' || jogo) return;
    if (b.dormindo) { falar(); ctl.status('Shhh... está dormindo. 😴'); return; }
    const agora = Date.now();
    pular();
    coracoes(2);
    if (agora - ultimoCarinho < 1500) return;
    ultimoCarinho = agora;
    const r = bc.carinho(bc.atualizar(b, agora));
    if (r.bichinho) { gravar(r.bichinho); atualizarTela(); }
    ctl.som('acerto');
    falar(FRASES[Math.floor(Math.random() * FRASES.length)], 2200);
  }

  function acao(nome) {
    ctl.som('clique');
    b = bc.atualizar(b, Date.now());
    if (nome === 'dormir') {
      const r = b.dormindo ? bc.acordar(b) : bc.dormir(b);
      if (r.erro) { ctl.status(r.erro); falar(r.erro); return; }
      if (jogo) { jogo.parar(); jogo = null; }
      gravar(r.bichinho);
      modo = 'quarto';
      if (b.dormindo) { ctl.status(`Boa noite, ${b.nome}! 🌙 A luz apagou.`); q('.bichinho-balao').hidden = true; } else { ctl.status(`Bom dia, ${b.nome}! ☀️`); pular(); }
      atualizarTela();
      mostrarPainel();
      return;
    }
    if (jogo && nome !== 'brincar') { jogo.parar(); jogo = null; }
    if (nome === 'brincar') {
      if (jogo) { jogo.parar(); jogo = null; modo = 'quarto'; atualizarTela(); mostrarPainel(); return; }
      const pode = bc.podeBrincar(b);
      if (pode.erro) { ctl.status(pode.erro); falar(pode.erro); return; }
    }
    modo = modo === nome && nome !== 'brincar' ? 'quarto' : nome;
    atualizarTela();
    mostrarPainel();
  }

  // ---------- painéis ----------
  function mostrarPainel() {
    const painel = q('.bichinho-painel');
    if (!painel) return;
    q('.bichinho-cena').classList.toggle('esfregando', modo === 'banho');
    desligarBanho();
    if (modo === 'comer') return painelComer(painel);
    if (modo === 'banho') return painelBanho(painel);
    if (modo === 'brincar') return painelBrincar(painel);
    if (modo === 'loja') return painelLoja(painel);
    const resta = bc.moedasRestantesHoje(b, Date.now());
    painel.innerHTML = `<div class="bichinho-dica">${b.dormindo ? `😴 ${b.nome} está dormindo. A energia volta aos pouquinhos, e quando encher ${b.nome} acorda sozinho.` : 'Toque no bichinho para fazer carinho, ou escolha o que fazer aí em cima.'}</div>
      <div class="bichinho-hoje">Moedas ganhas cuidando hoje: <b>${bc.LIMITE_MOEDAS_DIA - resta}</b> de ${bc.LIMITE_MOEDAS_DIA} 🪙</div>`;
  }

  function painelComer(painel) {
    const graca = bc.COMIDAS.filter((c) => !c.especial);
    const especiais = bc.COMIDAS.filter((c) => c.especial && b.despensa[c.id] > 0);
    painel.innerHTML = `<div class="bichinho-painel-tit">O que vamos comer?</div>
      <div class="bichinho-comidas">${[...graca, ...especiais].map((c) => `<button class="bichinho-comida${c.especial ? ' especial' : ''}" data-comida="${c.id}"><span class="ic">${c.icone}</span><span>${c.nome}</span>${c.especial ? `<span class="qtd">${b.despensa[c.id]}</span>` : ''}</button>`).join('')}</div>
      <button class="bichinho-link" data-ir="loja">🛍️ Comidas especiais na loja</button>`;
    painel.querySelectorAll('[data-comida]').forEach((botao) => { botao.onclick = () => darComida(botao.dataset.comida, botao); });
    painel.querySelector('[data-ir]').onclick = () => acao('loja');
  }

  function darComida(id, botao) {
    b = bc.atualizar(b, Date.now());
    const r = bc.alimentar(b, id);
    if (r.erro) { ctl.status(r.erro); falar(r.erro, 2000); ctl.som('erro'); return; }
    gravar(r.bichinho);
    // a comida voa do botão até a boca
    const cena = q('.bichinho-cena').getBoundingClientRect();
    const rb = botao.getBoundingClientRect();
    const boca = pontoDoPet(100, 110);
    const voando = efeito(r.comida.icone, 'voando', rb.left - cena.left + rb.width / 2, Math.min(cena.height - 20, rb.top - cena.top), 900);
    if (voando?.animate && !reduzido()) {
      voando.animate([
        { transform: 'translate(-50%, -50%) scale(1)' },
        { transform: `translate(calc(-50% + ${(boca.x - parseFloat(voando.style.left)) / 2}px), calc(-50% + ${(boca.y - parseFloat(voando.style.top)) / 2 - 60}px)) scale(1.3)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${boca.x - parseFloat(voando.style.left)}px), calc(-50% + ${boca.y - parseFloat(voando.style.top)}px)) scale(.4)`, opacity: 0.6 },
      ], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    }
    const lugar = q('.bichinho-pet-lugar');
    setTimeout(() => {
      if (!vivo() || !lugar.isConnected) return;
      lugar.classList.add('bc-comendo');
      ctl.som('item');
      setTimeout(() => { lugar.classList.remove('bc-comendo'); if (bc.humor(b).id === 'feliz') pular(); coracoes(r.comida.especial ? 4 : 2, r.comida.especial ? '💖' : '✨'); }, 1100);
    }, 600);
    atualizarTela();
    const falas = ['Nhac! Que delícia! 😋', 'Hummm! 😋', 'Obrigado! Estava gostoso!'];
    ctl.status(`${r.comida.icone} ${falas[Math.floor(Math.random() * falas.length)]}`);
    setTimeout(() => { if (vivo()) falar(b.barras.fome >= 95 ? 'Estou cheinho! 😋' : undefined, 1800); }, 1800);
    if (r.comida.especial) painelComer(q('.bichinho-painel'));
  }

  // Banho: esfregar com o dedo faz espuma; quando enche, enxágua.
  let banhoLigado = null;
  let espumaAtual = 0;
  function desligarBanho() { if (banhoLigado) { banhoLigado(); banhoLigado = null; } }

  function painelBanho(painel) {
    painel.innerHTML = `<div class="bichinho-painel-tit">🧽 Esfregue ${b.nome} com o dedo!</div>
      <div class="bichinho-espuma-barra"><span></span></div>
      <button class="bichinho-enxaguar" disabled>🚿 Enxaguar</button>`;
    const cena = q('.bichinho-cena');
    const fx = q('.bichinho-fx');
    const barra = painel.querySelector('.bichinho-espuma-barra span');
    const enxaguar = painel.querySelector('.bichinho-enxaguar');
    espumaAtual = 0;
    let espuma = 0; let ultimo = null; let apertado = false; let ultimaBolha = 0;
    const svgRect = () => q('.bichinho-pet svg').getBoundingClientRect();
    function bolha(x, y) {
      const tam = 14 + Math.random() * 22;
      const e = el('span', 'bichinho-bolha');
      e.style.left = `${x}px`; e.style.top = `${y}px`; e.style.width = e.style.height = `${tam}px`;
      fx.append(e);
      if (fx.querySelectorAll('.bichinho-bolha').length > 90) fx.querySelector('.bichinho-bolha').remove();
      if (Math.random() < 0.25) { e.classList.add('voa'); setTimeout(() => e.remove(), 2200); }
    }
    function mover(ev) {
      if (!apertado) return;
      const rc = cena.getBoundingClientRect();
      const x = ev.clientX - rc.left; const y = ev.clientY - rc.top;
      const rs = svgRect();
      const sobre = ev.clientX > rs.left + rs.width * 0.15 && ev.clientX < rs.right - rs.width * 0.15 && ev.clientY > rs.top + rs.height * 0.1 && ev.clientY < rs.bottom;
      if (ultimo && sobre) {
        const d = Math.hypot(x - ultimo.x, y - ultimo.y);
        espuma = Math.min(100, espuma + d / 22);
        if (performance.now() - ultimaBolha > 35) { bolha(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20); ultimaBolha = performance.now(); }
        if (Math.random() < 0.08) ctl.som('passo');
      }
      ultimo = { x, y };
      barra.style.width = `${espuma}%`;
      espumaAtual = espuma;
      atualizarTela();
      if (espuma >= 100 && enxaguar.disabled) {
        enxaguar.disabled = false;
        enxaguar.classList.add('pronto');
        ctl.status('Que espumão! Agora toque em Enxaguar. 🚿');
        ctl.som('acerto');
      }
    }
    const baixo = (ev) => { apertado = true; ultimo = null; cena.setPointerCapture?.(ev.pointerId); mover(ev); };
    const cima = () => { apertado = false; ultimo = null; };
    cena.addEventListener('pointerdown', baixo);
    cena.addEventListener('pointermove', mover);
    cena.addEventListener('pointerup', cima);
    cena.addEventListener('pointercancel', cima);
    banhoLigado = () => {
      cena.removeEventListener('pointerdown', baixo);
      cena.removeEventListener('pointermove', mover);
      cena.removeEventListener('pointerup', cima);
      cena.removeEventListener('pointercancel', cima);
      cena.classList.remove('esfregando');
    };
    ctl.status(`Esfregue ${b.nome} para fazer bastante espuma!`);
    enxaguar.onclick = () => {
      desligarBanho();
      // água caindo e as bolhas sumindo
      const rc = cena.getBoundingClientRect();
      for (let k = 0; k < 26; k++) {
        const gota = el('span', 'bichinho-gota');
        gota.style.left = `${rc.width * 0.25 + Math.random() * rc.width * 0.5}px`;
        gota.style.animationDelay = `${Math.random() * 0.6}s`;
        fx.append(gota);
        setTimeout(() => gota.remove(), 1800);
      }
      fx.querySelectorAll('.bichinho-bolha').forEach((e, i) => { e.style.animationDelay = `${(i % 10) * 0.05}s`; e.classList.add('estoura'); setTimeout(() => e.remove(), 900); });
      ctl.som('voo');
      b = bc.atualizar(b, Date.now());
      const r = bc.banho(b, carteira(), Date.now());
      if (r.erro) { ctl.status(r.erro); return; }
      gravar(r.bichinho, r.carteira);
      setTimeout(() => {
        if (!vivo()) return;
        modo = 'quarto';
        atualizarTela();
        mostrarPainel();
        for (let k = 0; k < 5; k++) { const p = pontoDoPet(40 + Math.random() * 120, 30 + Math.random() * 140); setTimeout(() => efeito('✨', 'brilho', p.x, p.y), k * 120); }
        pular();
        moedinhas(r.ganhas);
        ctl.status(`${b.nome} está cheiroso e limpinho! ✨${r.ganhas ? ` +${r.ganhas} 🪙` : ''}`, 'vitoria');
      }, 1100);
    };
  }

  // Brincar: pegar a bolinha que quica pela cena.
  function painelBrincar(painel) {
    const DURACAO = 20;
    painel.innerHTML = `<div class="bichinho-painel-tit">⚽ Pegue a bolinha! Toque nela.</div>
      <div class="bichinho-jogo-info"><span>Bolinhas: <b class="pegas">0</b></span><span>⏱️ <b class="tempo">${DURACAO}</b>s</span></div>
      <div class="bichinho-hoje">Pegue ${bc.META_BRINCAR} ou mais para ganhar ${bc.MOEDAS_BRINCAR} 🪙 (hoje ainda dá para ganhar ${bc.moedasRestantesHoje(b, Date.now())} 🪙).</div>`;
    const cena = q('.bichinho-cena');
    cena.classList.add('brincando');
    const bola = el('button', 'bichinho-bola', BOLA);
    bola.setAttribute('aria-label', 'Bolinha');
    q('.bichinho-fx').before(bola);
    const rc = () => cena.getBoundingClientRect();
    const TAM = 56;
    let x = 30; let y = 30; let vel = 150; let ang = Math.PI / 4;
    let vx = Math.cos(ang) * vel; let vy = Math.sin(ang) * vel;
    let pegas = 0; let fim = performance.now() + DURACAO * 1000; let anterior = performance.now(); let raf = 0; let acabou = false;
    const meVivo = vivo;
    function sortear() {
      const r = rc();
      x = 10 + Math.random() * (r.width - TAM - 20); y = 10 + Math.random() * (r.height * 0.55);
      ang = Math.random() * Math.PI * 2; vel = 150 + pegas * 22;
      vx = Math.cos(ang) * vel; vy = Math.sin(ang) * vel;
    }
    function quadro(t) {
      if (!meVivo() || acabou) return;
      const dt = Math.min(0.05, (t - anterior) / 1000); anterior = t;
      const r = rc();
      x += vx * dt; y += vy * dt;
      if (x < 0) { x = 0; vx = Math.abs(vx); } if (x > r.width - TAM) { x = r.width - TAM; vx = -Math.abs(vx); }
      if (y < 0) { y = 0; vy = Math.abs(vy); } if (y > r.height - TAM - 6) { y = r.height - TAM - 6; vy = -Math.abs(vy); }
      bola.style.transform = `translate(${x}px, ${y}px) rotate(${(x + y) * 2}deg)`;
      const resta = Math.max(0, Math.ceil((fim - t) / 1000));
      const tempo = painel.querySelector('.tempo');
      if (tempo) tempo.textContent = resta;
      if (t >= fim) { terminar(); return; }
      raf = requestAnimationFrame(quadro);
    }
    bola.onpointerdown = (ev) => {
      ev.preventDefault();
      if (acabou) return;
      pegas++;
      painel.querySelector('.pegas').textContent = pegas;
      efeito('⭐', 'sobe', x + TAM / 2, y + TAM / 2, 900);
      ctl.som('acerto');
      pular();
      bola.classList.remove('pegou'); void bola.offsetWidth; bola.classList.add('pegou');
      if (pegas === bc.META_BRINCAR) falar('Eba! Você é demais! 🎉', 1600);
      sortear();
    };
    function terminar() {
      acabou = true;
      cancelAnimationFrame(raf);
      bola.remove();
      cena.classList.remove('brincando');
      jogo = null;
      b = bc.atualizar(b, Date.now());
      const r = bc.brincar(b, carteira(), pegas, Date.now());
      modo = 'quarto';
      if (r.erro) { ctl.status(r.erro); atualizarTela(); mostrarPainel(); return; }
      gravar(r.bichinho, r.carteira);
      atualizarTela();
      mostrarPainel();
      pular();
      coracoes(3);
      moedinhas(r.ganhas);
      let texto = `${pegas} ${pegas === 1 ? 'bolinha' : 'bolinhas'}! ${b.nome} adorou brincar! 💛`;
      if (r.ganhas) texto += ` +${r.ganhas} 🪙`;
      else if (pegas >= bc.META_BRINCAR) texto += ' (as moedas de cuidar de hoje já acabaram)';
      else texto += ` Pegue ${bc.META_BRINCAR} para ganhar moedas.`;
      ctl.status(texto, r.ganhas ? 'vitoria' : '');
      if (r.ganhas) ctl.som('premio');
    }
    jogo = {
      parar() { acabou = true; cancelAnimationFrame(raf); bola.remove(); cena.classList.remove('brincando'); },
    };
    sortear();
    ctl.status('Toque na bolinha antes que o tempo acabe!');
    raf = requestAnimationFrame((t) => { anterior = t; fim = t + DURACAO * 1000; quadro(t); });
  }

  let abaLoja = 'roupas';
  let confirmarTroca = false;
  function painelLoja(painel) {
    const roupas = bc.ACESSORIOS.map((a) => {
      const tem = b.acessorios.includes(a.id);
      const usando = b.vestindo[a.lugar] === a.id;
      const botao = tem
        ? `<button class="bichinho-item-bt ${usando ? 'tirar' : 'vestir'}" data-vestir="${a.id}">${usando ? 'Tirar' : 'Vestir'}</button>`
        : `<button class="bichinho-item-bt comprar" data-comprar="${a.id}" ${moedas() < a.preco ? 'data-falta="1"' : ''}>🪙 ${fmt(a.preco)}</button>`;
      return `<div class="bichinho-item${usando ? ' usando' : ''}"><div class="bichinho-item-arte">${svgAcessorio(a.id)}</div><div class="bichinho-item-nome">${a.nome}</div>${botao}</div>`;
    }).join('');
    const comidas = bc.COMIDAS.filter((c) => c.especial).map((c) => `<div class="bichinho-item"><div class="bichinho-item-arte emoji">${c.icone}</div><div class="bichinho-item-nome">${c.nome}${b.despensa[c.id] ? ` <small>(tem ${b.despensa[c.id]})</small>` : ''}</div><button class="bichinho-item-bt comprar" data-comida-loja="${c.id}" ${moedas() < c.preco ? 'data-falta="1"' : ''}>🪙 ${fmt(c.preco)}</button></div>`).join('');
    painel.innerHTML = `<div class="bichinho-abas"><button data-aba="roupas" class="${abaLoja === 'roupas' ? 'ativa' : ''}">👒 Roupinhas</button><button data-aba="comidas" class="${abaLoja === 'comidas' ? 'ativa' : ''}">🧁 Comidas</button></div>
      <div class="bichinho-saldo-loja">Você tem <b>🪙 ${fmt(moedas())}</b> moedas. Ganhe mais cuidando de ${b.nome} ou na Corrida dos Cachinhos!</div>
      <div class="bichinho-itens">${abaLoja === 'roupas' ? roupas : comidas}</div>
      <button class="bichinho-link bichinho-trocar">${confirmarTroca ? 'Tem certeza? Toque de novo para adotar outro bichinho' : '🐾 Adotar outro bichinho'}</button>`;
    painel.querySelectorAll('[data-aba]').forEach((x) => { x.onclick = () => { abaLoja = x.dataset.aba; confirmarTroca = false; ctl.som('clique'); painelLoja(painel); }; });
    const comprou = (r, texto) => {
      if (r.erro) { ctl.status(r.erro, 'derrota'); ctl.som('erro'); return; }
      gravar(r.bichinho, r.carteira);
      ctl.status(texto, 'vitoria');
      ctl.som(r.carteira ? 'premio' : 'clique');
      desenharPet();
      pular();
      coracoes(3, '✨');
      painelLoja(painel);
    };
    painel.querySelectorAll('[data-comprar]').forEach((x) => { x.onclick = () => { const a = bc.ACESSORIOS.find((y) => y.id === x.dataset.comprar); comprou(bc.comprarAcessorio(b, carteira(), a.id), `${a.nome}: ficou lindo em ${b.nome}! 💖`); }; });
    painel.querySelectorAll('[data-vestir]').forEach((x) => {
      x.onclick = () => {
        const r = bc.vestir(b, x.dataset.vestir);
        const a = bc.ACESSORIOS.find((y) => y.id === x.dataset.vestir);
        comprou(r, r.tirou ? `Tirou: ${a.nome.toLowerCase()}.` : `${b.nome} está usando: ${a.nome.toLowerCase()}! ✨`);
      };
    });
    painel.querySelectorAll('[data-comida-loja]').forEach((x) => { x.onclick = () => { const c = bc.COMIDAS.find((y) => y.id === x.dataset.comidaLoja); comprou(bc.comprarComida(b, carteira(), c.id), `${c.icone} ${c.nome} foi para a despensa! Dê em 🍎 Comer.`); }; });
    painel.querySelector('.bichinho-trocar').onclick = () => {
      ctl.som('clique');
      if (!confirmarTroca) { confirmarTroca = true; painelLoja(painel); return; }
      confirmarTroca = false;
      telaAdocao(b);
    };
  }

  iniciar();
  return { reiniciar: iniciar };
}
