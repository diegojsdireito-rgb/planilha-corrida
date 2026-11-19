// Desenhos para pintar, feitos à mão em SVG (400 × 400). As formas têm fundo branco para
// esconder as linhas que ficam atrás; na tela, as linhas ficam por cima da tinta com
// "multiplicar", então o branco some e só o contorno aparece.

import { estrela, nuvem, coracao, flor, sol, PRETO } from './pintar-formas.js';
import { MEDIOS } from './pintar-desenhos-medios.js';
import { DIFICEIS } from './pintar-desenhos-dificeis.js';

const FACEIS = [
  {
    id: 'gato', nome: 'Gatinho', icone: '🐱',
    svg: `
      <path d="M0 365 H400 V400 H0 Z"/>
      <path d="M270 330 C345 345 372 270 340 228 C330 214 312 222 320 236 C342 268 330 312 275 305 Z"/>
      <ellipse cx="200" cy="290" rx="95" ry="80"/>
      <ellipse cx="200" cy="300" rx="50" ry="58"/>
      <ellipse cx="158" cy="362" rx="30" ry="16"/><ellipse cx="242" cy="362" rx="30" ry="16"/>
      <path d="M135 140 L128 52 L192 98 Z"/><path d="M265 140 L272 52 L208 98 Z"/>
      <circle cx="200" cy="160" r="78"/>
      <path d="M147 112 L144 76 L172 96 Z"/><path d="M253 112 L256 76 L228 96 Z"/>
      <ellipse cx="170" cy="150" rx="14" ry="18"/><ellipse cx="230" cy="150" rx="14" ry="18"/>
      <circle cx="173" cy="154" r="7" ${PRETO}/><circle cx="233" cy="154" r="7" ${PRETO}/>
      <path d="M188 182 H212 L200 195 Z"/>
      <g fill="none"><path d="M200 195 Q192 210 178 203 M200 195 Q208 210 222 203"/>
      <path d="M150 182 L100 172 M150 192 L102 196 M250 182 L300 172 M250 192 L298 196"/></g>
      ${coracao(200, 252, 0.7)}`,
  },
  {
    id: 'casa', nome: 'Casinha', icone: '🏡',
    svg: `
      ${sol(335, 68, 30)}
      ${nuvem(95, 80, 1)}
      <path d="M0 330 Q100 312 200 328 T400 322 V400 H0 Z"/>
      <rect x="236" y="104" width="30" height="62"/>
      <rect x="90" y="190" width="200" height="150"/>
      <path d="M68 202 L190 102 L312 202 Z"/>
      <circle cx="190" cy="160" r="18"/>
      <path d="M163 340 V278 A27 27 0 0 1 217 278 V340 Z"/><circle cx="205" cy="310" r="4" ${PRETO}/>
      <rect x="108" y="218" width="44" height="44"/><rect x="228" y="218" width="44" height="44"/>
      <g fill="none"><path d="M130 218 V262 M108 240 H152 M250 218 V262 M228 240 H272"/></g>
      <rect x="337" y="250" width="22" height="88"/>
      <circle cx="348" cy="222" r="42"/>
      ${flor(40, 365, 1)}${flor(120, 375, 0.8)}${flor(290, 372, 0.9)}`,
  },
  {
    id: 'flor', nome: 'Flor no vaso', icone: '🌻',
    svg: `
      ${nuvem(330, 50, 0.7)}
      <path d="M200 290 C195 240 205 200 200 160" fill="none"/>
      <path d="M200 250 C170 228 140 232 122 250 C148 268 178 268 200 250 Z"/>
      <path d="M200 225 C230 203 260 207 278 225 C252 243 222 243 200 225 Z"/>
      <path d="M142 300 H258 L242 385 H158 Z"/>
      <rect x="130" y="285" width="140" height="28" rx="8"/>
      ${coracao(200, 345, 0.8)}
      ${Array.from({ length: 8 }, (_, k) => `<ellipse cx="200" cy="66" rx="24" ry="40" transform="rotate(${k * 45} 200 115)"/>`).join('')}
      <circle cx="200" cy="115" r="32"/>
      <g ${PRETO}>${[[190, 105], [210, 105], [200, 118], [188, 126], [212, 126]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5"/>`).join('')}</g>
      ${flor(60, 360, 1.3)}${flor(345, 355, 1.2)}`,
  },
  {
    id: 'peixe', nome: 'Peixinho', icone: '🐠',
    svg: `
      <path d="M0 350 Q100 335 200 350 T400 345 V400 H0 Z"/>
      <path d="M40 350 C25 300 55 280 40 235 C70 270 50 310 62 350 Z"/>
      <path d="M345 348 C335 300 365 285 352 240 C380 280 362 310 372 348 Z"/>
      <path d="M290 200 L362 140 Q346 200 362 260 Z"/>
      <path d="M148 150 Q182 82 248 158 Z"/>
      <path d="M160 252 Q190 300 228 248 Z"/>
      <path d="M68 200 Q150 92 302 200 Q150 308 68 200 Z"/>
      <defs><clipPath id="corpo-peixe"><path d="M68 200 Q150 92 302 200 Q150 308 68 200 Z"/></clipPath></defs>
      <g fill="none" clip-path="url(#corpo-peixe)"><path d="M168 100 Q192 200 168 300"/><path d="M218 100 Q242 200 218 300"/></g>
      <path d="M80 210 Q90 218 100 212" fill="none"/>
      <path d="M140 212 Q160 244 186 216 Z"/>
      <circle cx="112" cy="188" r="16"/><circle cx="115" cy="190" r="7" ${PRETO}/>
      <circle cx="60" cy="140" r="12"/><circle cx="40" cy="105" r="8"/><circle cx="62" cy="75" r="15"/>
      <circle cx="300" cy="90" r="10"/><circle cx="320" cy="60" r="6"/>
      ${estrela(260, 355, 18, 8)}`,
  },
  {
    id: 'borboleta', nome: 'Borboleta', icone: '🦋',
    svg: `
      ${sol(60, 60, 26)}
      <path d="M200 190 C150 80 48 70 58 150 C64 202 140 212 200 200 Z"/>
      <path d="M200 190 C250 80 352 70 342 150 C336 202 260 212 200 200 Z"/>
      <path d="M200 205 C140 210 88 258 118 300 C148 332 190 282 200 230 Z"/>
      <path d="M200 205 C260 210 312 258 282 300 C252 332 210 282 200 230 Z"/>
      <circle cx="122" cy="150" r="24"/><circle cx="92" cy="118" r="11"/><circle cx="160" cy="118" r="9"/>
      <circle cx="278" cy="150" r="24"/><circle cx="308" cy="118" r="11"/><circle cx="240" cy="118" r="9"/>
      <circle cx="146" cy="264" r="16"/><circle cx="254" cy="264" r="16"/>
      <path d="M190 128 C170 90 160 80 150 70 M210 128 C230 90 240 80 250 70" fill="none"/>
      <circle cx="150" cy="70" r="7"/><circle cx="250" cy="70" r="7"/>
      <ellipse cx="200" cy="215" rx="14" ry="72"/>
      <circle cx="200" cy="134" r="18"/>
      ${flor(70, 355, 1.6)}${flor(200, 365, 1.3)}${flor(330, 355, 1.6)}`,
  },
  {
    id: 'foguete', nome: 'Foguete', icone: '🚀',
    svg: `
      ${estrela(60, 60, 16)}${estrela(110, 130, 12)}${estrela(355, 170, 18)}${estrela(45, 200, 10)}${estrela(320, 300, 12)}
      <path d="M330 110 A30 30 0 1 1 360 80 A22 22 0 1 0 330 110 Z"/>
      <circle cx="80" cy="322" r="44"/>
      <ellipse cx="80" cy="322" rx="74" ry="15" fill="none"/>
      <path d="M174 300 Q200 392 226 300 Z"/><path d="M188 300 Q200 352 212 300 Z"/>
      <path d="M162 225 L112 300 L166 292 Z"/><path d="M238 225 L288 300 L234 292 Z"/>
      <path d="M200 36 C258 90 258 200 242 305 H158 C142 200 142 90 200 36 Z"/>
      <path d="M166 100 Q200 82 234 100" fill="none"/>
      <circle cx="200" cy="168" r="30"/><circle cx="200" cy="168" r="19"/>
      <rect x="193" y="248" width="14" height="62" rx="5"/>`,
  },
  {
    id: 'sorvete', nome: 'Sorvete', icone: '🍦',
    svg: `
      <defs><clipPath id="casquinha"><path d="M135 250 L200 392 L265 250 Z"/></clipPath></defs>
      <path d="M135 250 L200 392 L265 250 Z"/>
      <g clip-path="url(#casquinha)" fill="none">${Array.from({ length: 9 }, (_, k) => `<path d="M${100 + k * 22} 240 L${180 + k * 22} 400 M${300 - k * 22} 240 L${220 - k * 22} 400"/>`).join('')}</g>
      <circle cx="200" cy="88" r="40"/>
      <path d="M200 52 Q204 30 222 18" fill="none"/>
      <circle cx="200" cy="56" r="15"/>
      <circle cx="200" cy="150" r="52"/>
      <path d="M124 246 C114 200 160 186 200 188 C240 186 286 200 276 246 Q266 270 251 248 Q238 274 223 248 Q209 274 194 248 Q179 274 164 248 Q149 274 124 246 Z"/>
      <g>${[[180, 80, 20], [218, 100, -30], [170, 140, 40], [225, 135, 10], [195, 170, -20], [160, 220, 30], [240, 215, -40], [200, 205, 0]].map(([x, y, a]) => `<rect x="${x - 8}" y="${y - 3}" width="16" height="6" rx="3" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>
      ${coracao(60, 80, 1)}${coracao(345, 110, 0.8)}${estrela(70, 300, 18)}${estrela(330, 320, 22)}`,
  },
  {
    id: 'dino', nome: 'Dinossauro', icone: '🦕',
    svg: `
      ${sol(340, 60, 28)}
      <path d="M0 355 Q200 340 400 355 V400 H0 Z"/>
      <path d="M278 238 Q350 228 388 292 Q330 276 282 286 Z"/>
      <path d="M146 196 L160 158 L180 184 L198 148 L218 180 L240 152 L256 186 L280 168 L288 212 Z"/>
      <rect x="118" y="285" width="38" height="70" rx="14"/><rect x="168" y="292" width="34" height="62" rx="14"/>
      <rect x="226" y="292" width="34" height="62" rx="14"/><rect x="262" y="285" width="38" height="70" rx="14"/>
      <path d="M112 222 C88 152 92 92 118 70 C150 48 194 58 198 86 C202 112 172 118 152 112 C142 142 152 180 164 204 Z"/>
      <ellipse cx="200" cy="250" rx="110" ry="68"/>
      <ellipse cx="150" cy="92" rx="9" ry="11"/><circle cx="152" cy="94" r="4.5" ${PRETO}/>
      <path d="M170 100 Q180 108 190 100" fill="none"/><circle cx="188" cy="82" r="2.5" ${PRETO}/>
      <circle cx="170" cy="245" r="14"/><circle cx="215" cy="230" r="10"/><circle cx="240" cy="265" r="16"/><circle cx="270" cy="232" r="9"/>
      ${flor(40, 370, 1.3)}${flor(365, 372, 1.1)}`,
  },
  {
    id: 'coruja', nome: 'Coruja', icone: '🦉',
    svg: `
      <path d="M330 92 A32 32 0 1 1 362 60 A24 24 0 1 0 330 92 Z"/>
      ${estrela(60, 50, 12)}${estrela(40, 140, 9)}${estrela(360, 170, 10)}
      <path d="M115 128 L104 62 L162 106 Z"/><path d="M285 128 L296 62 L238 106 Z"/>
      <ellipse cx="200" cy="215" rx="105" ry="122"/>
      <ellipse cx="200" cy="255" rx="62" ry="72"/>
      <g fill="none">${[[180, 230], [220, 230], [200, 255], [180, 280], [220, 280], [200, 305]].map(([x, y]) => `<path d="M${x - 10} ${y - 5} Q${x} ${y + 6} ${x + 10} ${y - 5}"/>`).join('')}</g>
      <path d="M100 200 Q66 262 116 314 Q132 252 100 200 Z"/><path d="M300 200 Q334 262 284 314 Q268 252 300 200 Z"/>
      <circle cx="158" cy="160" r="38"/><circle cx="242" cy="160" r="38"/>
      <circle cx="158" cy="160" r="20"/><circle cx="242" cy="160" r="20"/>
      <circle cx="160" cy="162" r="10" ${PRETO}/><circle cx="244" cy="162" r="10" ${PRETO}/>
      <path d="M187 192 H213 L200 218 Z"/>
      <path d="M20 330 Q200 312 380 336 L380 354 Q200 332 20 350 Z"/>
      ${[170, 230].map((x) => `<ellipse cx="${x - 10}" cy="330" rx="8" ry="12"/><ellipse cx="${x}" cy="332" rx="8" ry="12"/><ellipse cx="${x + 10}" cy="330" rx="8" ry="12"/>`).join('')}
      <path d="M60 345 Q50 375 70 390 Q85 368 60 345 Z"/><path d="M330 348 Q350 378 330 392 Q318 370 330 348 Z"/>`,
  },
  {
    id: 'carro', nome: 'Carrinho', icone: '🚗',
    svg: `
      ${sol(60, 60, 26)}${nuvem(300, 80, 1.1)}
      <rect x="-5" y="325" width="410" height="80"/>
      ${[20, 120, 220, 320].map((x) => `<rect x="${x}" y="358" width="50" height="10" rx="4"/>`).join('')}
      <path d="M30 292 V242 Q30 220 56 216 L112 210 L152 152 Q160 142 176 142 H264 Q280 142 290 156 L326 210 L355 218 Q376 225 376 250 V292 Z"/>
      <path d="M124 208 L160 160 H212 V208 Z"/><path d="M226 160 H268 Q278 160 283 168 L310 208 H226 Z"/>
      <path d="M219 214 V288" fill="none"/>
      <rect x="236" y="226" width="22" height="7" rx="3"/><rect x="180" y="226" width="22" height="7" rx="3"/>
      <ellipse cx="362" cy="238" rx="10" ry="12"/><rect x="30" y="232" width="12" height="20" rx="3"/>
      <circle cx="105" cy="296" r="38"/><circle cx="105" cy="296" r="16"/>
      <circle cx="300" cy="296" r="38"/><circle cx="300" cy="296" r="16"/>`,
  },
  {
    id: 'arcoiris', nome: 'Arco-íris', icone: '🌈',
    svg: `
      ${sol(340, 60, 26)}
      <path d="M0 310 Q100 285 200 300 T400 295 V400 H0 Z"/>
      ${[172, 148, 124, 100, 76].map((r) => `<path d="M${200 - r} 300 A${r} ${r} 0 0 1 ${200 + r} 300 Z"/>`).join('')}
      ${nuvem(55, 290, 1.25)}${nuvem(345, 290, 1.25)}
      <path d="M60 80 Q70 70 80 80 Q90 70 100 80 M120 120 Q128 112 136 120 Q144 112 152 120" fill="none"/>
      ${flor(120, 360, 1.4)}${flor(210, 375, 1.2)}${flor(300, 360, 1.4)}`,
  },
  {
    id: 'bolo', nome: 'Bolo de festa', icone: '🎂',
    svg: `
      ${[[50, 60], [350, 50], [60, 200], [345, 190]].map(([x, y], k) => (k % 2 ? estrela(x, y, 14) : coracao(x, y, 0.9))).join('')}
      <ellipse cx="200" cy="350" rx="160" ry="24"/>
      <rect x="70" y="248" width="260" height="96" rx="8"/>
      <path d="M68 254 Q68 236 90 236 H310 Q332 236 332 254 Q320 280 305 258 Q290 284 275 258 Q260 284 245 258 Q230 284 215 258 Q200 284 185 258 Q170 284 155 258 Q140 284 125 258 Q110 284 95 258 Q80 280 68 254 Z"/>
      ${[110, 160, 200, 240, 290].map((x) => `<circle cx="${x}" cy="308" r="10"/>`).join('')}
      <rect x="115" y="168" width="170" height="80" rx="8"/>
      <path d="M113 174 Q113 156 133 156 H267 Q287 156 287 174 Q276 198 262 178 Q248 202 234 178 Q220 202 206 178 Q192 202 178 178 Q164 202 150 178 Q136 202 122 178 Q116 186 113 174 Z"/>
      ${coracao(200, 222, 0.9)}
      ${[155, 200, 245].map((x) => `<rect x="${x - 7}" y="106" width="14" height="50" rx="3"/><path d="M${x} 74 Q${x + 12} 92 ${x} 102 Q${x - 12} 92 ${x} 74 Z"/>`).join('')}`,
  },
  {
    id: 'tartaruga', nome: 'Tartaruga', icone: '🐢',
    svg: `
      ${sol(60, 60, 26)}${nuvem(300, 70, 1)}
      <path d="M0 330 Q200 312 400 330 V400 H0 Z"/>
      <ellipse cx="120" cy="295" rx="24" ry="34"/><ellipse cx="290" cy="295" rx="24" ry="34"/>
      <path d="M86 250 L52 262 L86 272 Z"/>
      <path d="M300 240 Q320 210 335 205 L350 240 Z"/>
      <circle cx="345" cy="205" r="36"/>
      <circle cx="355" cy="196" r="7" ${PRETO}/><path d="M340 222 Q355 232 370 220" fill="none"/>
      <defs><clipPath id="casco"><path d="M90 262 Q98 138 210 132 Q322 138 330 262 Z"/></clipPath></defs>
      <path d="M90 262 Q98 138 210 132 Q322 138 330 262 Z"/>
      <g clip-path="url(#casco)" fill="none">
        <path d="M185 170 H235 L255 205 L235 240 H185 L165 205 Z"/>
        <path d="M185 170 L160 120 M235 170 L260 120 M255 205 H340 M235 240 L250 280 M185 240 L170 280 M165 205 H80"/>
      </g>
      <path d="M78 262 H342 Q350 282 332 288 H88 Q70 282 78 262 Z"/>
      ${flor(60, 365, 1.3)}${flor(350, 370, 1.2)}`,
  },
  {
    id: 'castelo', nome: 'Castelo', icone: '🏰',
    svg: `
      ${nuvem(55, 45, 0.7)}${nuvem(355, 45, 0.7)}
      <path d="M0 350 Q200 335 400 350 V400 H0 Z"/>
      <path d="M100 100 V75 L130 82 L100 90" fill="none"/><path d="M300 100 V75 L330 82 L300 90" fill="none"/><path d="M200 40 V12 L232 20 L200 28" fill="none"/>
      <path d="M70 140 L100 98 L130 140 Z"/><path d="M270 140 L300 98 L330 140 Z"/><path d="M160 90 L200 38 L240 90 Z"/>
      <rect x="120" y="190" width="160" height="160"/>
      <path d="M120 190 V170 H140 V190 H160 V170 H180 V190 H200 V170 H220 V190 H240 V170 H260 V190 H280 V170" fill="none"/>
      <rect x="170" y="90" width="60" height="100"/>
      <rect x="75" y="140" width="50" height="210"/><rect x="275" y="140" width="50" height="210"/>
      <path d="M170 350 V290 A30 30 0 0 1 230 290 V350 Z"/>
      <path d="M200 260 V350" fill="none"/>
      <path d="M90 200 V180 A10 10 0 0 1 110 180 V200 Z"/><path d="M290 200 V180 A10 10 0 0 1 310 180 V200 Z"/>
      <path d="M190 140 V120 A10 10 0 0 1 210 120 V140 Z"/>
      ${coracao(200, 230, 0.9)}${flor(50, 370, 1.2)}${flor(350, 372, 1.2)}`,
  },
  {
    id: 'mandala', nome: 'Mandala', icone: '🌸',
    svg: `
      <circle cx="200" cy="200" r="185"/>
      ${Array.from({ length: 16 }, (_, k) => `<path d="M200 200 Q170 110 200 20 Q230 110 200 200 Z" transform="rotate(${k * 22.5} 200 200)"/>`).join('')}
      <circle cx="200" cy="200" r="120"/>
      ${Array.from({ length: 12 }, (_, k) => `<path d="M200 200 C160 150 170 100 200 85 C230 100 240 150 200 200 Z" transform="rotate(${k * 30 + 15} 200 200)"/>`).join('')}
      <circle cx="200" cy="200" r="62"/>
      ${Array.from({ length: 8 }, (_, k) => `<ellipse cx="200" cy="162" rx="14" ry="26" transform="rotate(${k * 45} 200 200)"/>`).join('')}
      <circle cx="200" cy="200" r="22"/>
      ${Array.from({ length: 16 }, (_, k) => { const a = (k * Math.PI) / 8 + Math.PI / 16; return `<circle cx="${(200 + Math.cos(a) * 160).toFixed(1)}" cy="${(200 + Math.sin(a) * 160).toFixed(1)}" r="9"/>`; }).join('')}`,
  },
];

export const NIVEIS_DESENHO = [['facil', 'Fáceis'], ['medio', 'Médios'], ['dificil', 'Difíceis']];

export const DESENHOS = [
  ...FACEIS.map((d) => ({ nivel: 'facil', ...d })),
  ...MEDIOS.map((d) => ({ nivel: 'medio', ...d })),
  ...DIFICEIS.map((d) => ({ nivel: 'dificil', traco: 2.6, ...d })),
  { id: 'branco', nome: 'Folha em branco', icone: '📄', svg: '', nivel: 'livre' },
];

export function svgDoDesenho(d, tamanho = 400) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${tamanho}" height="${tamanho}"><rect width="400" height="400" fill="#fff"/><g fill="#fff" stroke="#1d1b18" stroke-width="${d.traco ?? 4}" stroke-linejoin="round" stroke-linecap="round">${d.svg}</g></svg>`;
}

export const urlDoDesenho = (d, tamanho) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoDesenho(d, tamanho))}`;
