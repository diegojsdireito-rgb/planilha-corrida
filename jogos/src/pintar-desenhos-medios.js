// Desenhos médios: cenas com várias coisas para pintar.
import { estrela, nuvem, coracao, flor, sol, PRETO } from './pintar-formas.js';

const g = (x, y, s, corpo, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})"${extra}>${corpo}</g>`;

const arvore = (x, y, s = 1) => g(x, y, s, `<path d="M-10 0 L-8 -60 H8 L10 0 Z"/><circle cx="-22" cy="-70" r="26"/><circle cx="22" cy="-70" r="26"/><circle cx="0" cy="-95" r="30"/><circle cx="0" cy="-62" r="22"/>`);
const pinheiro = (x, y, s = 1) => g(x, y, s, `<rect x="-8" y="-20" width="16" height="20"/><path d="M-45 -20 L0 -60 L45 -20 Z"/><path d="M-36 -48 L0 -88 L36 -48 Z"/><path d="M-26 -76 L0 -112 L26 -76 Z"/>`);
const peixinho = (x, y, s = 1, vira = false) => g(x, y, s, `<path d="M28 0 L50 -18 L46 0 L50 18 Z"/><path d="M-35 0 Q0 -32 32 0 Q0 32 -35 0 Z"/><path d="M-5 -22 Q2 0 -5 22" fill="none"/><circle cx="-20" cy="-4" r="5"/><circle cx="-19" cy="-4" r="2.5" ${PRETO}/>`, vira ? '' : '').replace(vira ? `scale(${s})` : '§', `scale(-${s} ${s})`);
const concha = (x, y, s = 1) => g(x, y, s, `<path d="M-24 0 Q-26 -30 0 -32 Q26 -30 24 0 Z"/><path d="M0 0 V-31 M-12 0 L-8 -29 M12 0 L8 -29" fill="none"/><path d="M-8 0 H8 V6 H-8 Z"/>`);
const estrelaMar = (x, y, r) => estrela(x, y, r, r * 0.5);
const alga = (x, y, s = 1) => g(x, y, s, `<path d="M-8 0 C-20 -30 4 -50 -8 -80 C-2 -95 6 -95 4 -80 C16 -50 -6 -30 8 0 Z"/>`);
const borboletinha = (x, y, s = 1) => g(x, y, s, `<path d="M0 -2 C-10 -24 -30 -24 -28 -8 C-26 4 -10 4 0 0 Z"/><path d="M0 -2 C10 -24 30 -24 28 -8 C26 4 10 4 0 0 Z"/><path d="M0 2 C-12 4 -22 16 -14 22 C-6 26 -2 14 0 6 Z"/><path d="M0 2 C12 4 22 16 14 22 C6 26 2 14 0 6 Z"/><ellipse cx="0" cy="2" rx="3.5" ry="14"/><path d="M-2 -10 Q-8 -22 -12 -24 M2 -10 Q8 -22 12 -24" fill="none"/>`);
const abelha = (x, y, s = 1) => g(x, y, s, `<ellipse cx="-6" cy="-14" rx="10" ry="14" transform="rotate(-25 -6 -14)"/><ellipse cx="8" cy="-14" rx="10" ry="14" transform="rotate(25 8 -14)"/><ellipse cx="0" cy="0" rx="20" ry="13"/><path d="M-6 -12 V12 M6 -12 V12" fill="none"/><circle cx="-24" cy="-2" r="9"/><circle cx="-26" cy="-4" r="2" ${PRETO}/><path d="M20 0 L28 0" fill="none"/>`);
const joaninha = (x, y, s = 1) => g(x, y, s, `<circle cx="0" cy="-16" r="9"/><ellipse cx="0" cy="2" rx="18" ry="20"/><path d="M0 -18 V22" fill="none"/><g ${PRETO}><circle cx="-8" cy="-4" r="3.5"/><circle cx="8" cy="-4" r="3.5"/><circle cx="-9" cy="10" r="3"/><circle cx="9" cy="10" r="3"/></g>`);
const balao = (x, y, s = 1) => g(x, y, s, `<path d="M0 30 Q-8 60 6 90" fill="none"/><path d="M0 28 C-36 20 -36 -40 0 -40 C36 -40 36 20 0 28 Z"/><path d="M-6 34 L0 27 L6 34 Z"/><path d="M-14 -24 Q-20 -10 -16 4" fill="none"/>`);
const presente = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/><rect x="${x - 4}" y="${y - 14}" width="${w + 8}" height="16"/><rect x="${x + w / 2 - 6}" y="${y - 14}" width="12" height="${h + 14}"/><path d="M${x + w / 2} ${y - 14} C${x + w / 2 - 30} ${y - 40} ${x + w / 2 - 30} ${y - 4} ${x + w / 2} ${y - 14} Z"/><path d="M${x + w / 2} ${y - 14} C${x + w / 2 + 30} ${y - 40} ${x + w / 2 + 30} ${y - 4} ${x + w / 2} ${y - 14} Z"/>`;
const cogumelo = (x, y, s = 1) => g(x, y, s, `<path d="M-10 0 Q-12 -20 -8 -28 H8 Q12 -20 10 0 Z"/><path d="M-30 -26 Q-30 -60 0 -60 Q30 -60 30 -26 Z"/><circle cx="-14" cy="-42" r="6"/><circle cx="10" cy="-48" r="5"/><circle cx="14" cy="-34" r="4"/>`);
const tulipa = (x, y, s = 1) => g(x, y, s, `<path d="M0 0 V-40" fill="none"/><path d="M0 -12 Q-20 -18 -22 -34 Q-6 -30 0 -16 Z"/><path d="M-14 -40 Q-16 -62 -8 -66 L0 -56 L8 -66 Q16 -62 14 -40 Q0 -32 -14 -40 Z"/>`);
const margarida = (x, y, s = 1) => g(x, y, s, `<path d="M0 0 V-30" fill="none"/>${Array.from({ length: 10 }, (_, k) => `<ellipse cx="0" cy="-52" rx="5" ry="12" transform="rotate(${k * 36} 0 -40)"/>`).join('')}<circle cx="0" cy="-40" r="8"/>`);
const predio = (x, y, w, h, cols = 3, linhas = 5) => {
  const jan = [];
  const lw = (w - 10) / cols; const lh = Math.min(30, (h - 30) / linhas);
  for (let c = 0; c < cols; c++) for (let l = 0; l < linhas; l++) jan.push(`<rect x="${(x + 5 + c * lw + lw * 0.18).toFixed(1)}" y="${(y + 12 + l * lh).toFixed(1)}" width="${(lw * 0.64).toFixed(1)}" height="${(lh * 0.6).toFixed(1)}"/>`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>${jan.join('')}`;
};
const ondas = (y, amp = 8, passo = 40) => { let d = `M-10 ${y}`; for (let x = -10; x < 420; x += passo) d += ` q${passo / 4} ${-amp} ${passo / 2} 0 t${passo / 2} 0`; return `<path d="${d}" fill="none"/>`; };
const montanha = (x, y, w, h, neve = true) => `<path d="M${x - w / 2} ${y} L${x} ${y - h} L${x + w / 2} ${y} Z"/>${neve ? `<path d="M${x - w * 0.14} ${y - h * 0.72} L${x} ${y - h} L${x + w * 0.14} ${y - h * 0.72} L${x + w * 0.06} ${y - h * 0.66} L${x} ${y - h * 0.74} L${x - w * 0.06} ${y - h * 0.66} Z"/>` : ''}`;

export const MEDIOS = [
  {
    id: 'mar', nome: 'Fundo do mar', icone: '🐙',
    svg: `
      ${ondas(30, 8)}
      <path d="M0 340 Q100 320 200 338 T400 330 V400 H0 Z"/>
      ${alga(30, 345, 1.2)}${alga(60, 340, 0.9)}${alga(370, 340, 1.3)}${alga(345, 345, 0.8)}
      <circle cx="80" cy="80" r="10"/><circle cx="96" cy="60" r="6"/><circle cx="320" cy="150" r="9"/><circle cx="332" cy="128" r="5"/><circle cx="210" cy="60" r="7"/>
      ${peixinho(90, 140, 1.1)}${peixinho(300, 90, 0.9, true)}${peixinho(150, 220, 0.8, true)}${peixinho(330, 230, 1)}
      <path d="M180 300 Q170 340 150 352 Q175 352 190 318 Q195 345 185 365 Q205 350 205 318 Q215 348 225 362 Q230 338 220 312 Q240 340 262 346 Q238 325 232 296 Z"/>
      <ellipse cx="206" cy="270" rx="44" ry="42"/>
      <circle cx="190" cy="265" r="9"/><circle cx="222" cy="265" r="9"/><circle cx="191" cy="267" r="4" ${PRETO}/><circle cx="223" cy="267" r="4" ${PRETO}/>
      <path d="M196 286 Q206 294 216 286" fill="none"/>
      ${concha(110, 370, 1)}${estrelaMar(290, 368, 20)}${concha(330, 380, 0.7)}${estrelaMar(60, 382, 13)}`,
  },
  {
    id: 'fazenda', nome: 'Fazenda', icone: '🐄',
    svg: `
      ${sol(60, 55, 26)}${nuvem(250, 60, 1)}
      <path d="M0 270 Q120 240 220 262 T400 250 V400 H0 Z"/>
      ${arvore(355, 268, 0.9)}
      <path d="M150 140 L245 90 L340 140 Z"/>
      <rect x="160" y="140" width="170" height="130"/>
      <path d="M215 270 V200 H275 V270 Z"/><path d="M215 200 L275 270 M275 200 L215 270" fill="none"/>
      <rect x="230" y="150" width="30" height="30"/><path d="M245 150 V180 M230 165 H260" fill="none"/>
      ${[20, 60, 100].map((x) => `<rect x="${x}" y="280" width="12" height="60" rx="3"/>`).join('')}<rect x="10" y="292" width="110" height="10" rx="3"/><rect x="10" y="318" width="110" height="10" rx="3"/>
      <ellipse cx="270" cy="330" rx="62" ry="36"/>
      <rect x="226" y="350" width="16" height="36" rx="5"/><rect x="290" y="350" width="16" height="36" rx="5"/>
      <path d="M330 320 Q345 300 340 290" fill="none"/>
      <ellipse cx="200" cy="315" rx="30" ry="26"/><ellipse cx="190" cy="330" rx="18" ry="11"/>
      <path d="M176 296 L168 284 L184 290 Z"/><path d="M222 296 L230 284 L214 290 Z"/>
      <circle cx="190" cy="308" r="4" ${PRETO}/><circle cx="210" cy="308" r="4" ${PRETO}/><circle cx="185" cy="330" r="2.5" ${PRETO}/><circle cx="196" cy="330" r="2.5" ${PRETO}/>
      <path d="M255 315 Q270 300 285 318 Q275 335 255 315 Z"/><path d="M300 330 Q310 345 320 330 Z"/>
      <ellipse cx="90" cy="372" rx="22" ry="17"/><circle cx="110" cy="356" r="11"/><path d="M118 356 L128 360 L118 362 Z"/><path d="M106 345 Q110 338 114 345" fill="none"/><circle cx="112" cy="354" r="2" ${PRETO}/>`,
  },
  {
    id: 'jardim', nome: 'Jardim', icone: '🌷',
    svg: `
      ${sol(340, 55, 26)}${nuvem(90, 60, 0.9)}
      <path d="M0 300 Q200 280 400 300 V400 H0 Z"/>
      ${[[40, 330], [120, 350], [260, 345], [360, 330]].map(([x, y]) => tulipa(x, y, 1.3)).join('')}
      ${[[80, 300], [200, 310], [320, 305]].map(([x, y]) => margarida(x, y, 1.1)).join('')}
      ${flor(160, 370, 1.4)}${flor(230, 385, 1.1)}${flor(300, 380, 1.3)}${flor(25, 385, 1)}
      ${borboletinha(120, 150, 1.6)}${borboletinha(280, 180, 1.2)}
      ${abelha(200, 110, 1.2)}${abelha(330, 250, 0.9)}
      ${joaninha(60, 230, 1)}
      <path d="M100 150 Q140 120 180 112 M320 180 Q300 140 230 120" fill="none" stroke-dasharray="6 8"/>`,
  },
  {
    id: 'espaco', nome: 'Espaço', icone: '🪐',
    svg: `
      ${[[30, 40, 10], [370, 30, 12], [150, 30, 7], [380, 200, 9], [20, 250, 8], [250, 370, 10], [100, 380, 7]].map(([x, y, r]) => estrela(x, y, r)).join('')}
      <circle cx="320" cy="320" r="60"/><path d="M262 302 Q320 290 378 304 M265 335 Q320 345 376 334" fill="none"/>
      <ellipse cx="320" cy="320" rx="95" ry="20" fill="none"/>
      <circle cx="80" cy="110" r="38"/><circle cx="68" cy="98" r="8"/><circle cx="92" cy="122" r="11"/><circle cx="64" cy="128" r="5"/>
      <path d="M260 60 L330 120" fill="none"/><path d="M250 40 Q290 60 300 92 L280 104 Q262 72 250 40 Z"/><circle cx="292" cy="96" r="14"/>
      <g transform="rotate(25 175 210)">
        <path d="M160 300 Q175 340 190 300 Z"/>
        <path d="M150 250 L125 300 L155 295 Z"/><path d="M200 250 L225 300 L195 295 Z"/>
        <path d="M175 130 C210 160 210 240 200 300 H150 C140 240 140 160 175 130 Z"/>
        <circle cx="175" cy="200" r="18"/>
      </g>
      <circle cx="90" cy="270" r="30"/><rect x="72" y="292" width="36" height="46" rx="10"/>
      <ellipse cx="90" cy="268" rx="20" ry="16"/>
      <rect x="56" y="300" width="16" height="30" rx="7"/><rect x="108" y="300" width="16" height="30" rx="7"/>
      <rect x="74" y="336" width="14" height="24" rx="6"/><rect x="92" y="336" width="14" height="24" rx="6"/>
      <path d="M90 240 V226" fill="none"/><circle cx="90" cy="222" r="5"/>`,
  },
  {
    id: 'praia', nome: 'Praia', icone: '🏖️',
    svg: `
      ${sol(330, 60, 30)}${nuvem(80, 60, 0.8)}
      <path d="M90 120 q8 -8 16 0 q8 -8 16 0 M150 90 q6 -6 12 0 q6 -6 12 0" fill="none"/>
      <path d="M0 200 H400 V280 H0 Z"/>
      ${ondas(225, 6, 50)}${ondas(255, 6, 50)}
      <path d="M260 200 L320 200 L310 214 H270 Z"/><path d="M292 200 V150" fill="none"/><path d="M292 152 L330 190 H292 Z"/>
      <path d="M0 270 Q120 255 220 270 T400 262 V400 H0 Z"/>
      <path d="M110 385 V290" fill="none"/>
      <path d="M30 295 Q110 185 190 295 Q170 275 150 295 Q130 275 110 295 Q90 275 70 295 Q50 275 30 295 Z"/>
      <path d="M110 241 L70 295 M110 241 L110 295 M110 241 L150 295" fill="none"/>
      <path d="M110 241 V228" fill="none"/>
      <rect x="230" y="320" width="100" height="50"/><rect x="250" y="285" width="60" height="35"/>
      <path d="M230 320 V310 H245 V320 M315 320 V310 H330 V320 M250 285 V275 H265 V285 M295 285 V275 H310 V285" fill="none"/>
      <path d="M268 370 V345 A12 12 0 0 1 292 345 V370 Z"/><path d="M280 275 V250 L298 258 L280 266" fill="none"/>
      <path d="M150 360 L190 360 L182 386 H158 Z"/><path d="M160 360 Q170 335 180 360" fill="none"/>
      ${concha(60, 375, 0.8)}${estrelaMar(360, 375, 16)}`,
  },
  {
    id: 'inverno', nome: 'Inverno', icone: '⛄',
    svg: `
      ${[[40, 40], [130, 70], [250, 35], [360, 80], [80, 160], [320, 170], [200, 120]].map(([x, y], k) => `<g fill="none">${[0, 60, 120].map((a) => `<path d="M${x} ${y - 12} V${y + 12}" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>${k % 2 ? `<circle cx="${x}" cy="${y}" r="3"/>` : ''}`).join('')}
      <path d="M0 290 Q200 260 400 290 V400 H0 Z"/>
      ${pinheiro(50, 300, 1.2)}${pinheiro(350, 300, 1)}
      <rect x="250" y="200" width="80" height="90"/><path d="M240 205 L290 160 L340 205 Z"/><path d="M240 205 Q240 190 255 192 L290 160 L325 192 Q340 190 340 205 Z"/>
      <rect x="275" y="250" width="28" height="40"/><rect x="258" y="215" width="22" height="22"/>
      <circle cx="160" cy="320" r="55"/><circle cx="160" cy="232" r="40"/><circle cx="160" cy="168" r="30"/>
      <path d="M134 150 H186 V140 H178 V108 H142 V140 H134 Z"/>
      <circle cx="150" cy="162" r="4" ${PRETO}/><circle cx="170" cy="162" r="4" ${PRETO}/>
      <path d="M160 170 L188 178 L160 180 Z"/>
      <path d="M128 196 Q160 214 192 196 L196 208 Q160 226 124 208 Z"/><path d="M178 206 L186 240 L172 242 Z"/>
      ${[220, 240, 300, 325].map((y) => `<circle cx="160" cy="${y}" r="5" ${PRETO}/>`).join('')}
      <path d="M122 230 L70 200 M78 205 L66 188 M198 230 L250 205 M242 209 L256 194" fill="none"/>`,
  },
  {
    id: 'trem', nome: 'Trenzinho', icone: '🚂',
    svg: `
      ${montanha(90, 230, 220, 150)}${montanha(260, 230, 260, 180)}${montanha(380, 230, 160, 110)}
      ${nuvem(330, 50, 0.7)}<circle cx="300" cy="70" r="10"/><circle cx="318" cy="52" r="14"/><circle cx="342" cy="40" r="18"/>
      <path d="M0 230 H400 V400 H0 Z"/>
      <path d="M0 330 H400 M0 344 H400" fill="none"/>
      ${Array.from({ length: 13 }, (_, k) => `<rect x="${k * 32}" y="326" width="16" height="22"/>`).join('')}
      <rect x="20" y="240" width="90" height="70" rx="6"/><rect x="32" y="252" width="28" height="24"/><rect x="70" y="252" width="28" height="24"/>
      <rect x="125" y="240" width="90" height="70" rx="6"/><rect x="137" y="252" width="28" height="24"/><rect x="175" y="252" width="28" height="24"/>
      <rect x="230" y="200" width="70" height="110" rx="6"/><rect x="242" y="214" width="46" height="36"/>
      <rect x="300" y="240" width="80" height="70" rx="8"/><rect x="330" y="200" width="22" height="40"/><path d="M322 200 H360 L354 186 H328 Z"/>
      <path d="M380 290 L398 310 H380 Z"/>
      <path d="M110 290 H125 M215 290 H230" fill="none"/>
      ${[45, 85, 150, 190, 255, 285, 325, 360].map((x) => `<circle cx="${x}" cy="318" r="16"/><circle cx="${x}" cy="318" r="5"/>`).join('')}`,
  },
  {
    id: 'festa', nome: 'Festa', icone: '🎈',
    svg: `
      <path d="M0 30 Q100 70 200 30 Q300 70 400 30" fill="none"/>
      ${[30, 80, 130, 180, 230, 280, 330, 375].map((x, k) => { const y = 30 + Math.sin((x / 400) * Math.PI * 2) * 0 + (k % 4 === 0 || k % 4 === 3 ? 18 : 28); return `<path d="M${x - 14} ${y - 10} L${x + 14} ${y - 10} L${x} ${y + 20} Z"/>`; }).join('')}
      ${balao(60, 140, 1.2)}${balao(120, 110, 1)}${balao(330, 130, 1.25)}${balao(280, 100, 0.9)}
      <path d="M0 330 H400 V400 H0 Z"/>
      ${presente(30, 290, 70, 50)}${presente(300, 280, 80, 60)}${presente(110, 310, 44, 30)}
      <ellipse cx="210" cy="330" rx="80" ry="14"/>
      <rect x="150" y="250" width="120" height="78" rx="6"/>
      <path d="M148 256 Q148 240 165 240 H255 Q272 240 272 256 Q262 278 250 260 Q238 280 226 260 Q214 280 202 260 Q190 280 178 260 Q166 280 154 262 Z"/>
      ${[180, 210, 240].map((x) => `<rect x="${x - 6}" y="208" width="12" height="34" rx="3"/><path d="M${x} 186 Q${x + 9} 200 ${x} 207 Q${x - 9} 200 ${x} 186 Z"/>`).join('')}
      ${coracao(210, 300, 0.8)}
      ${[[20, 200], [380, 220], [200, 120], [240, 150], [170, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}${estrela(380, 360, 14)}`,
  },
  {
    id: 'cidade', nome: 'Cidade', icone: '🏙️',
    svg: `
      ${sol(60, 50, 24)}${nuvem(300, 50, 0.8)}
      ${predio(20, 140, 70, 200, 2, 6)}${predio(100, 90, 80, 250, 3, 7)}${predio(190, 170, 60, 170, 2, 5)}${predio(260, 110, 70, 230, 2, 7)}${predio(338, 160, 55, 180, 2, 5)}
      <path d="M140 90 V60 M140 60 L160 68 L140 76" fill="none"/>
      <rect x="-5" y="340" width="410" height="65"/>
      ${[10, 100, 190, 280, 370].map((x) => `<rect x="${x}" y="368" width="40" height="8" rx="3"/>`).join('')}
      <path d="M40 360 V330 Q40 316 56 314 L80 312 L96 296 H140 L158 314 L176 318 Q190 322 190 336 V360 Z"/><path d="M100 312 L108 302 H132 L144 312 Z"/>
      <circle cx="75" cy="362" r="14"/><circle cx="155" cy="362" r="14"/>
      <path d="M240 362 V312 Q240 300 252 300 H350 Q362 300 362 312 V362 Z"/>
      ${[256, 286, 316].map((x) => `<rect x="${x}" y="310" width="22" height="20" rx="3"/>`).join('')}
      <circle cx="268" cy="364" r="13"/><circle cx="336" cy="364" r="13"/>`,
  },
  {
    id: 'floresta', nome: 'Floresta', icone: '🦊',
    svg: `
      ${sol(200, 50, 24)}
      ${pinheiro(40, 240, 1.3)}${arvore(130, 230, 1)}${pinheiro(360, 240, 1.4)}${arvore(280, 220, 1.1)}
      <path d="M0 240 Q200 220 400 240 V400 H0 Z"/>
      ${cogumelo(60, 360, 1.1)}${cogumelo(100, 375, 0.7)}${cogumelo(340, 370, 1)}
      <path d="M130 352 Q140 330 165 334 H250 Q268 334 272 318 L280 300 M262 312 L262 296" fill="none"/>
      <path d="M130 352 Q140 330 165 334 H262 Q262 352 250 352 Z"/>
      <circle cx="205" cy="300" r="42"/><path d="M205 300 m-6 0 a6 6 0 1 1 12 0 a12 12 0 1 1 -24 0 a18 18 0 1 1 36 0 a24 24 0 1 1 -48 0 a30 30 0 1 1 60 0" fill="none"/>
      <circle cx="280" cy="298" r="5"/><circle cx="262" cy="294" r="5"/><circle cx="252" cy="342" r="3" ${PRETO}/>
      <ellipse cx="260" cy="365" rx="20" ry="16"/><circle cx="276" cy="350" r="11"/><ellipse cx="274" cy="330" rx="4" ry="12"/><ellipse cx="282" cy="332" rx="4" ry="12"/><circle cx="242" cy="368" r="6"/><circle cx="279" cy="348" r="2" ${PRETO}/>
      ${flor(30, 385, 1)}${flor(380, 388, 1)}`,
  },
  {
    id: 'frutas', nome: 'Cesta de frutas', icone: '🍎',
    svg: `
      <path d="M120 100 C120 30 280 30 280 100" fill="none"/><path d="M130 100 C130 45 270 45 270 100" fill="none"/>
      <circle cx="140" cy="180" r="38"/><path d="M140 144 Q142 130 150 124" fill="none"/><path d="M146 132 Q166 120 172 134 Q156 142 146 132 Z"/>
      <path d="M190 170 C200 110 290 100 320 130 C300 128 240 140 214 186 Z"/>
      ${[[250, 175], [270, 175], [260, 192], [280, 192], [240, 192], [250, 209], [270, 209], [260, 226]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join('')}
      <path d="M260 162 Q262 150 270 146" fill="none"/>
      <path d="M190 210 C170 210 165 175 190 160 C185 150 195 140 205 152 C230 160 230 210 190 210 Z"/>
      <path d="M95 200 Q100 170 130 180 Q170 196 150 225 Q120 240 95 200 Z"/><path d="M130 180 L132 168" fill="none"/>
      <path d="M300 180 Q330 175 335 200 Q330 228 305 228 Q290 205 300 180 Z"/><path d="M302 182 L296 168 L314 176 Z"/>
      <path d="M70 210 H330 L300 360 H100 Z"/>
      ${[90, 120, 150, 180, 210, 240, 270, 300].map((x, k) => `<path d="M${x} 210 L${x + 8 + (k - 4) * 3} 360" fill="none"/>`).join('')}
      ${[245, 280, 315].map((y) => { const t = (y - 210) / 150; return `<path d="M${70 + 30 * t} ${y} H${330 - 30 * t}" fill="none"/>`; }).join('')}
      <rect x="60" y="200" width="280" height="20" rx="8"/>
      <ellipse cx="200" cy="375" rx="150" ry="14"/>`,
  },
  {
    id: 'doces', nome: 'Doces', icone: '🧁',
    svg: `
      <path d="M90 230 V360" fill="none"/><circle cx="90" cy="180" r="50"/><path d="M90 180 m-10 0 a10 10 0 1 1 20 0 a20 20 0 1 1 -40 0 a30 30 0 1 1 60 0 a40 40 0 1 1 -80 0" fill="none"/>
      <path d="M200 260 H300 L288 360 H212 Z"/>${[215, 235, 255, 275].map((x) => `<path d="M${x} 262 L${x + 4} 358" fill="none"/>`).join('')}
      <path d="M190 262 C180 230 200 210 220 214 C226 190 274 190 280 214 C300 210 320 230 310 262 Z"/>
      <path d="M232 205 C230 175 270 175 268 205" />
      <circle cx="250" cy="170" r="13"/><path d="M250 157 Q252 145 262 140" fill="none"/>
      ${[[215, 240, 20], [240, 230, -30], [265, 242, 40], [290, 236, -10]].map(([x, y, a]) => `<rect x="${x - 7}" y="${y - 2.5}" width="14" height="5" rx="2.5" transform="rotate(${a} ${x} ${y})"/>`).join('')}
      <circle cx="320" cy="110" r="46"/><circle cx="320" cy="110" r="16"/>
      <path d="M278 100 Q290 70 320 66 Q352 68 362 100 Q350 92 340 104 Q326 92 314 104 Q300 92 290 104 Q284 96 278 100 Z"/>
      <path d="M110 330 L150 330 L160 320 L170 345 L160 370 L150 360 L110 360 L100 370 L90 345 L100 320 Z" transform="rotate(-10 130 345)"/>
      <ellipse cx="130" cy="345" rx="20" ry="16" transform="rotate(-10 130 345)"/>
      ${estrela(200, 80, 16)}${coracao(160, 120, 0.9)}${estrela(40, 60, 12)}${coracao(370, 220, 0.8)}
      <path d="M20 380 H380" fill="none"/>`,
  },
  {
    id: 'robo', nome: 'Robô', icone: '🤖',
    svg: `
      ${[[40, 50], [360, 60], [30, 300], [370, 320]].map(([x, y]) => estrela(x, y, 12)).join('')}
      <path d="M200 70 V40" fill="none"/><circle cx="200" cy="34" r="10"/>
      <rect x="130" y="70" width="140" height="100" rx="18"/>
      <rect x="112" y="100" width="18" height="40" rx="6"/><rect x="270" y="100" width="18" height="40" rx="6"/>
      <circle cx="170" cy="112" r="20"/><circle cx="230" cy="112" r="20"/><circle cx="170" cy="112" r="8" ${PRETO}/><circle cx="230" cy="112" r="8" ${PRETO}/>
      <rect x="165" y="140" width="70" height="16" rx="6"/><path d="M182 140 V156 M200 140 V156 M218 140 V156" fill="none"/>
      <rect x="185" y="170" width="30" height="16"/>
      <rect x="70" y="190" width="40" height="22" rx="10"/><rect x="290" y="190" width="40" height="22" rx="10"/>
      <rect x="60" y="210" width="26" height="80" rx="12"/><rect x="314" y="210" width="26" height="80" rx="12"/>
      <path d="M58 290 Q50 310 66 316 L74 304 L82 316 Q96 310 88 290 Z"/><path d="M312 290 Q304 310 320 316 L328 304 L336 316 Q350 310 342 290 Z"/>
      <rect x="110" y="186" width="180" height="140" rx="16"/>
      <rect x="140" y="210" width="120" height="70" rx="10"/>
      ${coracao(170, 240, 0.8)}<circle cx="215" cy="230" r="9"/><circle cx="240" cy="230" r="9"/><rect x="205" y="252" width="45" height="12" rx="6"/>
      <rect x="140" y="326" width="40" height="40"/><rect x="220" y="326" width="40" height="40"/>
      <rect x="125" y="362" width="65" height="22" rx="10"/><rect x="210" y="362" width="65" height="22" rx="10"/>`,
  },
  {
    id: 'pinguins', nome: 'Pinguins', icone: '🐧',
    svg: `
      ${nuvem(320, 60, 0.9)}
      ${[[60, 60], [150, 40], [240, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}
      <path d="M0 250 L60 180 L110 230 L170 160 L230 240 Z"/>
      <path d="M0 290 Q100 270 200 285 T400 280 V400 H0 Z"/>
      <path d="M220 300 Q300 290 380 304 L370 330 Q300 320 230 326 Z"/>
      ${[[120, 300, 1.2], [280, 270, 0.9]].map(([x, y, s]) => g(x, y, s, `
        <ellipse cx="0" cy="0" rx="45" ry="62"/>
        <ellipse cx="0" cy="12" rx="30" ry="46"/>
        <circle cx="0" cy="-58" r="32"/>
        <path d="M-18 -60 Q-20 -40 0 -38 Q20 -40 18 -60 Q10 -70 0 -60 Q-10 -70 -18 -60 Z"/>
        <circle cx="-9" cy="-60" r="4" ${PRETO}/><circle cx="9" cy="-60" r="4" ${PRETO}/>
        <path d="M-8 -46 L8 -46 L0 -36 Z"/>
        <path d="M-44 -10 Q-66 20 -48 40 Q-40 14 -40 -6 Z"/><path d="M44 -10 Q66 20 48 40 Q40 14 40 -6 Z"/>
        <path d="M-28 58 Q-30 70 -10 68 L-12 58 Z"/><path d="M28 58 Q30 70 10 68 L12 58 Z"/>
        <path d="M-30 -84 Q0 -110 30 -84 Q0 -94 -30 -84 Z"/><circle cx="0" cy="-104" r="8"/>`)).join('')}
      <ellipse cx="350" cy="370" rx="26" ry="10"/><path d="M330 370 Q350 340 372 368" fill="none"/>`,
  },
  {
    id: 'leao', nome: 'Leão', icone: '🦁',
    svg: `
      ${Array.from({ length: 16 }, (_, k) => `<ellipse cx="200" cy="72" rx="32" ry="58" transform="rotate(${k * 22.5} 200 190)"/>`).join('')}
      <circle cx="200" cy="190" r="100"/>
      <circle cx="122" cy="118" r="26"/><circle cx="278" cy="118" r="26"/><circle cx="122" cy="118" r="12"/><circle cx="278" cy="118" r="12"/>
      <circle cx="200" cy="200" r="88"/>
      <ellipse cx="166" cy="180" rx="15" ry="18"/><ellipse cx="234" cy="180" rx="15" ry="18"/>
      <circle cx="168" cy="184" r="8" ${PRETO}/><circle cx="236" cy="184" r="8" ${PRETO}/>
      <ellipse cx="200" cy="245" rx="44" ry="32"/>
      <path d="M184 220 H216 L200 236 Z"/><path d="M200 236 V248 Q186 262 172 252 M200 248 Q214 262 228 252" fill="none"/>
      ${[[176, 236], [168, 246], [224, 236], [232, 246]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" ${PRETO}/>`).join('')}
      <path d="M150 150 Q166 140 182 150 M218 150 Q234 140 250 150" fill="none"/>`,
  },
  {
    id: 'elefante', nome: 'Elefante', icone: '🐘',
    svg: `
      ${sol(350, 50, 24)}
      <path d="M0 330 Q200 315 400 330 V400 H0 Z"/>
      <path d="M325 210 Q360 230 352 270" fill="none"/><path d="M346 262 L362 280 L346 280 Z"/>
      <rect x="150" y="270" width="40" height="80" rx="16"/><rect x="290" y="270" width="40" height="80" rx="16"/>
      <ellipse cx="250" cy="230" rx="100" ry="75"/>
      <rect x="200" y="270" width="40" height="84" rx="16"/><rect x="260" y="270" width="40" height="84" rx="16"/>
      <path d="M120 200 C60 210 60 280 70 320 C75 340 100 342 98 322 C90 290 100 250 140 250 Z"/>
      <circle cx="140" cy="180" r="70"/>
      <path d="M170 130 C250 90 280 200 210 230 C190 238 170 220 172 200 Z"/>
      <circle cx="120" cy="165" r="10"/><circle cx="122" cy="167" r="5" ${PRETO}/>
      <path d="M96 210 Q110 222 124 214" fill="none"/>
      <path d="M78 236 Q60 250 70 268" fill="none"/>
      ${flor(60, 370, 1.2)}${flor(380, 375, 1)}`,
  },
  {
    id: 'coelho', nome: 'Coelhinho', icone: '🐰',
    svg: `
      ${nuvem(80, 60, 0.8)}${sol(340, 60, 24)}
      <path d="M0 330 Q200 310 400 330 V400 H0 Z"/>
      <circle cx="280" cy="290" r="16"/>
      <ellipse cx="220" cy="270" rx="70" ry="62"/>
      <ellipse cx="180" cy="320" rx="30" ry="14"/><ellipse cx="250" cy="326" rx="30" ry="14"/>
      <ellipse cx="150" cy="80" rx="20" ry="62" transform="rotate(-12 150 140)"/><ellipse cx="150" cy="84" rx="9" ry="44" transform="rotate(-12 150 140)"/>
      <ellipse cx="200" cy="78" rx="20" ry="62" transform="rotate(12 200 140)"/><ellipse cx="200" cy="82" rx="9" ry="44" transform="rotate(12 200 140)"/>
      <circle cx="175" cy="185" r="58"/>
      <circle cx="155" cy="175" r="7" ${PRETO}/><circle cx="195" cy="175" r="7" ${PRETO}/>
      <ellipse cx="175" cy="198" rx="8" ry="6"/><path d="M175 204 V212 Q165 222 156 214 M175 212 Q185 222 194 214" fill="none"/>
      <circle cx="140" cy="200" r="9"/><circle cx="210" cy="200" r="9"/>
      <path d="M100 330 L110 300 L120 330 Z M95 330 Q110 280 125 330" fill="none"/>
      <path d="M320 340 Q330 300 340 340" fill="none"/><path d="M322 300 Q300 270 312 250 Q330 270 330 300 Z"/><path d="M330 300 Q354 278 362 290 Q352 310 330 300 Z"/>
      <path d="M70 360 L80 330 Q88 316 96 330 L104 360 Z"/><path d="M80 334 L74 320 L86 326 Z"/>
      ${flor(40, 380, 1)}${flor(370, 385, 1)}`,
  },
  {
    id: 'aviao', nome: 'Avião', icone: '✈️',
    svg: `
      ${nuvem(70, 80, 1)}${nuvem(330, 300, 1.2)}${nuvem(110, 330, 0.8)}${nuvem(320, 60, 0.7)}
      ${sol(360, 160, 22)}
      <path d="M150 190 L60 120 L90 110 L200 175 Z"/><path d="M150 230 L80 300 L110 305 L200 240 Z"/>
      <path d="M40 180 L22 140 L46 140 L80 190 Z"/>
      <path d="M30 196 C60 175 260 170 320 190 C350 200 350 220 320 228 C260 240 60 236 30 220 Z"/>
      <path d="M300 186 C320 186 336 198 336 208 L300 208 Z"/>
      ${[110, 145, 180, 215, 250].map((x) => `<circle cx="${x}" cy="205" r="9"/>`).join('')}
      <path d="M140 232 L120 276 L150 278 L180 234 Z"/>
      <path d="M200 170 L188 150 L204 150 L224 172 Z"/>
      <path d="M20 205 Q0 205 -10 210" fill="none" stroke-dasharray="6 8"/>`,
  },
  {
    id: 'veleiro', nome: 'Veleiro', icone: '⛵',
    svg: `
      ${sol(70, 70, 28)}
      <path d="M260 70 q8 -8 16 0 q8 -8 16 0 M310 100 q6 -6 12 0 q6 -6 12 0" fill="none"/>
      <path d="M0 270 H400 V400 H0 Z"/>
      ${ondas(300, 7, 50)}${ondas(335, 7, 50)}${ondas(370, 7, 50)}
      <path d="M205 60 V250" fill="none"/>
      <path d="M210 70 L310 240 H210 Z"/><path d="M200 90 L120 240 H200 Z"/>
      <path d="M210 70 L250 82 L210 94 Z"/>
      <path d="M210 120 L270 200 M200 140 L150 210" fill="none"/>
      <path d="M100 250 H320 L290 290 H130 Z"/>
      ${[150, 190, 230, 270].map((x) => `<circle cx="${x}" cy="268" r="8"/>`).join('')}
      ${peixinho(340, 360, 0.6)}${peixinho(60, 340, 0.7, true)}`,
  },
  {
    id: 'casaarvore', nome: 'Casa na árvore', icone: '🌳',
    svg: `
      ${sol(350, 50, 24)}${nuvem(70, 50, 0.7)}
      <path d="M0 350 Q200 330 400 350 V400 H0 Z"/>
      <path d="M170 350 Q185 250 180 120 H230 Q225 250 245 350 Z"/>
      <path d="M180 280 Q140 270 120 240 M228 260 Q270 250 290 220" fill="none"/>
      ${[[110, 110, 60], [200, 70, 70], [300, 110, 60], [160, 150, 50], [250, 150, 55]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}
      <rect x="130" y="170" width="150" height="16"/>
      <rect x="145" y="110" width="120" height="60"/><path d="M135 115 L205 70 L275 115 Z"/>
      <rect x="160" y="125" width="30" height="30"/><path d="M175 125 V155 M160 140 H190" fill="none"/>
      <rect x="215" y="125" width="34" height="45"/>
      <path d="M140 186 L140 230 M270 186 L270 230 M140 230 L270 230" fill="none"/>
      <path d="M100 186 V350 M125 186 V350" fill="none"/>
      ${[210, 240, 270, 300, 330].map((y) => `<rect x="96" y="${y}" width="33" height="7" rx="2"/>`).join('')}
      <path d="M270 230 V280" fill="none"/><rect x="250" y="280" width="40" height="10" rx="3"/>
      ${flor(40, 375, 1.2)}${flor(320, 378, 1.1)}${flor(370, 372, 1)}`,
  },
  {
    id: 'unicornio', nome: 'Unicórnio', icone: '🦄',
    svg: `
      ${[[40, 50], [360, 40], [50, 330], [360, 300]].map(([x, y]) => estrela(x, y, 14)).join('')}${coracao(330, 120, 0.8)}${coracao(70, 160, 0.7)}
      <path d="M140 260 C100 300 110 360 160 380 H300 C300 330 280 290 250 260 Z"/>
      <path d="M150 120 C100 150 110 220 150 250 C170 300 210 300 230 270 C250 240 230 200 240 170 C250 120 200 90 150 120 Z"/>
      <path d="M150 250 C120 270 100 300 120 330 C140 310 150 290 165 285" />
      <path d="M180 100 L210 20 L214 110 Z"/><path d="M190 80 L208 70 M186 92 L210 84 M196 58 L209 52" fill="none"/>
      <path d="M150 120 L136 76 L172 108 Z"/>
      <path d="M220 110 C270 90 300 140 280 180 C300 220 270 260 250 250 C270 220 250 190 255 170 C260 140 240 120 220 110 Z"/>
      <path d="M240 140 C280 150 300 200 285 240" fill="none"/>
      <ellipse cx="150" cy="170" rx="9" ry="12"/><circle cx="152" cy="173" r="5" ${PRETO}/>
      <path d="M138 160 Q134 154 136 148 M146 157 Q144 150 147 144" fill="none"/>
      <ellipse cx="140" cy="248" rx="26" ry="20"/><circle cx="130" cy="244" r="3" ${PRETO}/><circle cx="150" cy="246" r="3" ${PRETO}/>
      <path d="M120 200 Q126 206 134 202" fill="none"/>`,
  },
];
