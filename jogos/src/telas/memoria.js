// Tela do Jogo da Memória: caminho de fases, cartas que viram em 3D e comemoração no fim.
import * as mem from '../memoria.js';
import { el } from '../comum.js';
import { prefs } from '../dados.js';
import { retrato } from '../personagem.js';
import { PERSONAGENS, miniatura } from '../personagens.js';

export const INFO = {
  id: 'memoria', nome: 'Jogo da Memória', descricao: 'Ache os pares de figuras', solo: true, semNivel: true,
  regras: [
    'Toque em duas cartas para virar. Se as figuras forem iguais, o par fica aberto; se forem diferentes, elas viram de novo.',
    'Ache todos os pares para passar de fase. Quanto menos tentativas, mais estrelas (até 3).',
    'São 30 fases, de 3 até 18 pares: bichinhos, docinhos, coisinhas e a turma da corrida.',
    'Fases com 🔀: a cada erro, duas cartas fechadas trocam de lugar. Fases com 🎯: tem um limite de tentativas.',
    'Nas fases que você já passou, dá para jogar de novo e melhorar as estrelas. O botão 🗺️ Fases volta para o caminho.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#e9e1ff"/><g transform="rotate(-10 4 6.5)"><rect x="1.4" y="3" width="4.4" height="6" rx=".8" fill="#6b5cf0"/><path d="M3.6 4.6 4 5.6 5 5.7 4.2 6.3 4.5 7.3 3.6 6.7 2.7 7.3 3 6.3 2.2 5.7 3.2 5.6Z" fill="#ffd21f"/></g><g transform="rotate(10 8 6.5)"><rect x="6.2" y="3" width="4.4" height="6" rx=".8" fill="#fff" stroke="#c9bff5" stroke-width=".3"/><path d="M8.4 7.9C7.2 7.1 6.9 6.4 7.3 5.9 7.6 5.5 8.1 5.6 8.4 6 8.7 5.6 9.2 5.5 9.5 5.9 9.9 6.4 9.6 7.1 8.4 7.9Z" fill="#ef4b5f"/></g></svg>';

// ---------- arte das figuras (caixa de 100 × 100) ----------
const olhos = (y = 50, dx = 11, r = 4.6) => `<circle cx="${50 - dx}" cy="${y}" r="${r}" fill="#1d1b18"/><circle cx="${50 + dx}" cy="${y}" r="${r}" fill="#1d1b18"/><circle cx="${48.4 - dx}" cy="${y - 1.6}" r="${r * 0.36}" fill="#fff"/><circle cx="${48.4 + dx}" cy="${y - 1.6}" r="${r * 0.36}" fill="#fff"/>`;
const bochechas = (y = 62, dx = 20) => `<ellipse cx="${50 - dx}" cy="${y}" rx="5.5" ry="3.6" fill="#ff7f9b" opacity=".45"/><ellipse cx="${50 + dx}" cy="${y}" rx="5.5" ry="3.6" fill="#ff7f9b" opacity=".45"/>`;
const boca = (y = 66, cor = '#7a3b1c') => `<path d="M50 ${y} q-4 5 -8 2 M50 ${y} q4 5 8 2" stroke="${cor}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
const estrelaD = (cx, cy, r, ri = r * 0.45) => {
  let d = '';
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rr = k % 2 ? ri : r; d += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }
  return `${d}Z`;
};

const BICHOS = {
  gato: `<path d="M24 42 L21 13 L45 30Z M76 42 L79 13 L55 30Z" fill="#f39a3c"/><path d="M27 35 L25.5 21 L38 30Z M73 35 L74.5 21 L62 30Z" fill="#ffb3c4"/>
    <circle cx="50" cy="56" r="30" fill="#f6ac4f"/><path d="M50 27 v8 M41 29 l2.4 7 M59 29 l-2.4 7" stroke="#d9822b" stroke-width="3.4" stroke-linecap="round"/>
    ${olhos(52)}<path d="M46 61 h8 l-4 4.5z" fill="#ff7f9b"/>${boca(65.5)}
    <path d="M30 62 L14 59 M30 67 L15 70 M70 62 L86 59 M70 67 L85 70" stroke="#7a3b1c" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
  cachorro: `<ellipse cx="23" cy="52" rx="10" ry="23" fill="#7a4a2a" transform="rotate(16 23 52)"/><ellipse cx="77" cy="52" rx="10" ry="23" fill="#7a4a2a" transform="rotate(-16 77 52)"/>
    <circle cx="50" cy="52" r="28" fill="#c98b54"/><ellipse cx="61" cy="46" rx="9" ry="10" fill="#8a5530"/>
    <ellipse cx="50" cy="66" rx="16" ry="12" fill="#f3dcc0"/>${olhos(46)}<ellipse cx="50" cy="60" rx="6" ry="4.5" fill="#1d1b18"/>
    <path d="M45 70 q5 11 10 0z" fill="#ff7f9b"/>`,
  sapo: `<circle cx="31" cy="36" r="14" fill="#5cc46a"/><circle cx="69" cy="36" r="14" fill="#5cc46a"/><ellipse cx="50" cy="61" rx="37" ry="26" fill="#5cc46a"/>
    <circle cx="31" cy="35" r="9" fill="#fff"/><circle cx="69" cy="35" r="9" fill="#fff"/><circle cx="32" cy="36" r="4.6" fill="#1d1b18"/><circle cx="68" cy="36" r="4.6" fill="#1d1b18"/>
    <ellipse cx="50" cy="70" rx="24" ry="11" fill="#8fdc8a"/><path d="M28 62 Q50 80 72 62" stroke="#2c7a3a" stroke-width="3.2" fill="none" stroke-linecap="round"/>${bochechas(60, 26)}`,
  urso: `<circle cx="26" cy="30" r="12" fill="#9a6a43"/><circle cx="74" cy="30" r="12" fill="#9a6a43"/><circle cx="26" cy="30" r="6" fill="#e3c39c"/><circle cx="74" cy="30" r="6" fill="#e3c39c"/>
    <circle cx="50" cy="55" r="30" fill="#a8744a"/><ellipse cx="50" cy="67" rx="14" ry="10.5" fill="#e3c39c"/>${olhos(50)}
    <ellipse cx="50" cy="62" rx="5.4" ry="4" fill="#1d1b18"/>${boca(66, '#4a2c18')}${bochechas(62, 22)}`,
  panda: `<circle cx="25" cy="30" r="12" fill="#1f2128"/><circle cx="75" cy="30" r="12" fill="#1f2128"/><circle cx="50" cy="55" r="30" fill="#fdfdfd" stroke="#d8d8de" stroke-width="1.5"/>
    <ellipse cx="38" cy="51" rx="8.5" ry="11" fill="#1f2128" transform="rotate(25 38 51)"/><ellipse cx="62" cy="51" rx="8.5" ry="11" fill="#1f2128" transform="rotate(-25 62 51)"/>
    <circle cx="39" cy="51" r="3.4" fill="#fff"/><circle cx="61" cy="51" r="3.4" fill="#fff"/><ellipse cx="50" cy="63" rx="5" ry="3.6" fill="#1f2128"/>${boca(67, '#1f2128')}${bochechas(66, 21)}`,
  porco: `<path d="M24 38 L22 16 L42 28Z M76 38 L78 16 L58 28Z" fill="#ff94b0"/><circle cx="50" cy="55" r="30" fill="#ffb3c7"/>
    ${olhos(46)}<ellipse cx="50" cy="63" rx="14" ry="10" fill="#ff8fae"/><ellipse cx="45" cy="63" rx="2.6" ry="4" fill="#c75a7a"/><ellipse cx="55" cy="63" rx="2.6" ry="4" fill="#c75a7a"/>
    <path d="M44 76 q6 4 12 0" stroke="#c75a7a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  coelho: `<ellipse cx="37" cy="24" rx="8.5" ry="22" fill="#f4f1f8" stroke="#d9d2e6" stroke-width="1.5" transform="rotate(-8 37 24)"/><ellipse cx="63" cy="24" rx="8.5" ry="22" fill="#f4f1f8" stroke="#d9d2e6" stroke-width="1.5" transform="rotate(8 63 24)"/>
    <ellipse cx="37" cy="25" rx="4" ry="15" fill="#ffb3c4" transform="rotate(-8 37 25)"/><ellipse cx="63" cy="25" rx="4" ry="15" fill="#ffb3c4" transform="rotate(8 63 25)"/>
    <circle cx="50" cy="61" r="27" fill="#f4f1f8" stroke="#d9d2e6" stroke-width="1.5"/>${olhos(56)}<path d="M46 64 h8 l-4 4z" fill="#ff7f9b"/>
    <rect x="46.5" y="69" width="7" height="7" rx="1.5" fill="#fff" stroke="#c9c2d6" stroke-width="1.2"/>${bochechas(67, 18)}`,
  pinto: `<path d="M48 26 q-6 -12 2 -14 q-2 8 6 4 q-2 8 -8 10z" fill="#f5b800"/><ellipse cx="24" cy="62" rx="8" ry="14" fill="#f5c518" transform="rotate(20 24 62)"/><ellipse cx="76" cy="62" rx="8" ry="14" fill="#f5c518" transform="rotate(-20 76 62)"/>
    <circle cx="50" cy="56" r="30" fill="#ffd93b"/>${olhos(50, 10)}<path d="M43 58 L57 58 L50 68Z" fill="#ff8a1f"/>${bochechas(62, 20)}`,
  leao: `${Array.from({ length: 14 }, (_, k) => { const a = (k * Math.PI * 2) / 14; return `<circle cx="${(50 + Math.cos(a) * 31).toFixed(1)}" cy="${(54 + Math.sin(a) * 31).toFixed(1)}" r="11" fill="${k % 2 ? '#c96d1e' : '#e08a2e'}"/>`; }).join('')}
    <circle cx="50" cy="54" r="27" fill="#ffc65a"/><circle cx="31" cy="34" r="6" fill="#ffc65a"/><circle cx="69" cy="34" r="6" fill="#ffc65a"/>
    <ellipse cx="50" cy="65" rx="13" ry="9" fill="#ffe2a8"/>${olhos(50)}<path d="M45 60 h10 l-5 5z" fill="#7a3b1c"/>${boca(65)}`,
  raposa: `<path d="M18 44 L22 12 L42 32Z M82 44 L78 12 L58 32Z" fill="#e8691f"/><path d="M21 22 L22 12 L30 19Z M79 22 L78 12 L70 19Z" fill="#3a2417"/>
    <path d="M16 40 Q50 22 84 40 Q82 70 50 86 Q18 70 16 40Z" fill="#f07a2a"/><path d="M17 48 Q36 52 50 86 Q22 74 17 48Z M83 48 Q64 52 50 86 Q78 74 83 48Z" fill="#fff"/>
    ${olhos(50, 13)}<ellipse cx="50" cy="79" rx="5" ry="3.8" fill="#1d1b18"/>`,
  vaca: `<path d="M30 24 Q22 14 26 8 Q30 18 36 22Z M70 24 Q78 14 74 8 Q70 18 64 22Z" fill="#f2e2c2" stroke="#c8b68f" stroke-width="1.2"/>
    <ellipse cx="18" cy="38" rx="11" ry="6" fill="#e8e0d8" transform="rotate(20 18 38)"/><ellipse cx="82" cy="38" rx="11" ry="6" fill="#e8e0d8" transform="rotate(-20 82 38)"/>
    <ellipse cx="50" cy="50" rx="28" ry="30" fill="#fafafa" stroke="#d8d8de" stroke-width="1.5"/><path d="M28 34 Q36 26 44 32 Q44 44 32 44Z M64 26 Q76 30 74 42 Q64 42 62 34Z" fill="#3a3a3a"/>
    ${olhos(46)}<ellipse cx="50" cy="70" rx="21" ry="13" fill="#ffb3c4"/><ellipse cx="43" cy="70" rx="3" ry="4" fill="#c75a7a"/><ellipse cx="57" cy="70" rx="3" ry="4" fill="#c75a7a"/>`,
  macaco: `<circle cx="20" cy="52" r="11" fill="#8a5530"/><circle cx="80" cy="52" r="11" fill="#8a5530"/><circle cx="20" cy="52" r="6" fill="#f0c9a0"/><circle cx="80" cy="52" r="6" fill="#f0c9a0"/>
    <circle cx="50" cy="50" r="29" fill="#8a5530"/><path d="M50 44 C40 30 22 36 27 54 C30 72 42 80 50 80 C58 80 70 72 73 54 C78 36 60 30 50 44Z" fill="#f0c9a0"/>
    ${olhos(51, 10)}<ellipse cx="46.5" cy="63" rx="1.6" ry="2.2" fill="#5a3a20"/><ellipse cx="53.5" cy="63" rx="1.6" ry="2.2" fill="#5a3a20"/>
    <path d="M40 69 Q50 77 60 69" stroke="#5a3a20" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
};

const COISAS = {
  sol: `${Array.from({ length: 12 }, (_, k) => `<path d="M50 6 L55 20 L45 20Z" fill="#ff9f1c" transform="rotate(${k * 30} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="26" fill="#ffd23f"/>${olhos(46, 9, 3.8)}<path d="M40 56 Q50 66 60 56" stroke="#a65d00" stroke-width="2.6" fill="none" stroke-linecap="round"/>${bochechas(56, 17)}`,
  lua: `<path d="M60 12 A38 38 0 1 0 88 66 A30 30 0 1 1 60 12Z" fill="#ffe680" stroke="#f2c230" stroke-width="2"/><path d="${estrelaD(78, 24, 8)}" fill="#ffd21f"/><path d="${estrelaD(86, 44, 5)}" fill="#ffd21f"/>
    <path d="M30 54 q5 4 10 0" stroke="#a6801a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M36 68 q6 4 12 -1" stroke="#a6801a" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="62" rx="4" ry="2.6" fill="#ff9f9f" opacity=".5"/>`,
  estrela: `<path d="${estrelaD(50, 52, 42, 19)}" fill="#ffd21f" stroke="#f2a900" stroke-width="3" stroke-linejoin="round"/>${olhos(50, 8, 3.6)}<path d="M43 59 Q50 65 57 59" stroke="#a65d00" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  coracao: `<path d="M50 86 C18 64 10 44 20 30 C30 16 46 20 50 32 C54 20 70 16 80 30 C90 44 82 64 50 86Z" fill="#ff4f6d"/><path d="M28 34 q6 -9 15 -3" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`,
  balao: `<path d="M50 70 Q44 82 54 92" stroke="#6b665d" stroke-width="1.8" fill="none"/><ellipse cx="50" cy="40" rx="26" ry="31" fill="#3e8bff"/><path d="M45 72 L50 66 L55 72Z" fill="#2a6fd6"/><ellipse cx="40" cy="28" rx="6" ry="10" fill="#fff" opacity=".5" transform="rotate(-20 40 28)"/>`,
  foguete: `<path d="M42 74 Q50 98 58 74Z" fill="#ff8a1f"/><path d="M46 74 Q50 88 54 74Z" fill="#ffd23f"/><path d="M36 54 L22 74 L38 72Z M64 54 L78 74 L62 72Z" fill="#e5484d"/>
    <path d="M50 8 C66 22 66 52 61 76 H39 C34 52 34 22 50 8Z" fill="#eef1f8" stroke="#b7bfd3" stroke-width="1.6"/><path d="M50 8 C58 14 61 22 62 28 H38 C39 22 42 14 50 8Z" fill="#e5484d"/>
    <circle cx="50" cy="44" r="8.5" fill="#7fd6ff" stroke="#8b97b5" stroke-width="3"/>`,
  flor: `<path d="M50 60 V94" stroke="#2f9e62" stroke-width="5" stroke-linecap="round"/><path d="M50 80 Q32 70 26 80 Q38 90 50 80Z" fill="#3fbf7f"/>
    ${Array.from({ length: 6 }, (_, k) => `<ellipse cx="50" cy="20" rx="11" ry="16" fill="${k % 2 ? '#ff6fa8' : '#ff8fbd'}" transform="rotate(${k * 60} 50 40)"/>`).join('')}<circle cx="50" cy="40" r="12" fill="#ffd23f"/>${olhos(38, 4.5, 2)}<path d="M46 44 Q50 47 54 44" stroke="#a65d00" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  maca: `<path d="M50 30 Q48 18 54 10" stroke="#7a4a2a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M53 22 Q66 10 76 18 Q66 30 53 22Z" fill="#3fbf7f"/>
    <path d="M50 32 C36 22 14 28 16 52 C18 76 36 92 50 84 C64 92 82 76 84 52 C86 28 64 22 50 32Z" fill="#ef3b4f"/><ellipse cx="32" cy="46" rx="5" ry="10" fill="#fff" opacity=".45" transform="rotate(20 32 46)"/>`,
  sorvete: `<path d="M32 52 L50 94 L68 52Z" fill="#e8b06a"/><path d="M38 58 L58 78 M46 54 L64 72 M62 58 L42 78 M54 54 L38 70" stroke="#c98a42" stroke-width="2"/>
    <circle cx="40" cy="46" r="14" fill="#8fe3c0"/><circle cx="60" cy="46" r="14" fill="#ff9fc6"/><circle cx="50" cy="32" r="15" fill="#fff1c9"/><circle cx="52" cy="15" r="5.5" fill="#e5304a"/><path d="M52 10 q2 -6 7 -7" stroke="#2f9e62" stroke-width="2" fill="none"/>`,
  cogumelo: `<path d="M38 56 Q34 78 38 90 H62 Q66 78 62 56Z" fill="#fff1dc"/>${olhos(72, 7, 3.2)}<path d="M45 80 Q50 84 55 80" stroke="#a65d00" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M12 58 Q12 14 50 12 Q88 14 88 58 Q50 66 12 58Z" fill="#e5304a"/><circle cx="32" cy="36" r="7" fill="#fff"/><circle cx="56" cy="26" r="6" fill="#fff"/><circle cx="70" cy="44" r="7" fill="#fff"/><circle cx="46" cy="48" r="4" fill="#fff"/>`,
  presente: `<rect x="16" y="44" width="68" height="46" rx="5" fill="#8e5bd6"/><rect x="12" y="32" width="76" height="16" rx="4" fill="#a678ec"/><rect x="44" y="32" width="12" height="58" fill="#ffd21f"/>
    <path d="M50 32 C30 10 22 30 50 32Z M50 32 C70 10 78 30 50 32Z" fill="#ffd21f" stroke="#e0a800" stroke-width="2"/>`,
  arcoiris: `${['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6'].map((c, k) => `<path d="M${10 + k * 5} 72 A${40 - k * 5} ${40 - k * 5} 0 0 1 ${90 - k * 5} 72" stroke="${c}" stroke-width="5.4" fill="none"/>`).join('')}
    <g fill="#fff" stroke="#d6e6f5" stroke-width="1.4"><path d="M2 80 a8 8 0 0 1 8 -10 a10 10 0 0 1 16 2 a7 7 0 0 1 2 8Z"/><path d="M72 80 a8 8 0 0 1 8 -10 a10 10 0 0 1 16 2 a7 7 0 0 1 2 8Z"/></g>`,
};

// Doces: os seis do Docinhos e mais alguns da confeitaria.
export const DOCES = [
  '<path d="M50 84 C20 62 12 44 22 30 C32 17 46 22 50 33 C54 22 68 17 78 30 C88 44 80 62 50 84Z" fill="#ef4b5f"/><path d="M30 34 q6 -8 14 -2" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>',
  '<circle cx="50" cy="50" r="34" fill="#ff9a1f"/><path d="M50 50 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 12 a18 18 0 1 1 -18 -18 a24 24 0 1 1 24 24" fill="none" stroke="#ffd08a" stroke-width="5" stroke-linecap="round"/>',
  '<path d="M50 12 L61 38 L89 40 L67 58 L74 86 L50 71 L26 86 L33 58 L11 40 L39 38Z" fill="#ffd21f" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/><circle cx="42" cy="40" r="5" fill="#fff" opacity=".7"/>',
  '<path d="M8 36 L24 44 L24 56 L8 64Z M92 36 L76 44 L76 56 L92 64Z" fill="#7fdc9a"/><rect x="22" y="28" width="56" height="44" rx="20" fill="#2fb66a"/><path d="M34 30 v40 M50 30 v40 M66 30 v40" stroke="#bff2cf" stroke-width="5" opacity=".8"/>',
  '<path d="M50 12 C66 36 80 50 80 64 A30 30 0 0 1 20 64 C20 50 34 36 50 12Z" fill="#3e8bff"/><ellipse cx="40" cy="58" rx="7" ry="10" fill="#fff" opacity=".55"/>',
  '<path d="M50 12 L84 42 L50 88 L16 42Z" fill="#9b5cf6"/><path d="M16 42 H84 M50 12 L36 42 L50 88 L64 42Z" fill="none" stroke="#d7c2ff" stroke-width="3" stroke-linejoin="round"/>',
  // arco-íris do Docinhos
  '<circle cx="50" cy="50" r="36" fill="#5b3a29"/>' + Array.from({ length: 14 }, (_, k) => {
    const a = k * 2.4; const r = 10 + (k % 4) * 6; const cores = ['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6'];
    const x = 50 + Math.cos(a) * r; const y = 50 + Math.sin(a) * r;
    return `<rect x="${(x - 5).toFixed(1)}" y="${(y - 2).toFixed(1)}" width="10" height="4" rx="2" fill="${cores[k % 6]}" transform="rotate(${(k * 47) % 180} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }).join(''),
  // cupcake
  '<path d="M26 54 L32 88 H68 L74 54Z" fill="#7fc8f8"/><path d="M36 56 L39 88 M50 56 V88 M64 56 L61 88" stroke="#4fa7e0" stroke-width="3"/><path d="M20 56 Q18 40 32 38 Q34 22 50 24 Q66 22 68 38 Q82 40 80 56Z" fill="#ff9fc6"/><circle cx="50" cy="20" r="7" fill="#e5304a"/><g fill="#fff"><rect x="34" y="42" width="6" height="2.6" rx="1.3" transform="rotate(30 37 43)"/><rect x="56" y="36" width="6" height="2.6" rx="1.3" transform="rotate(-30 59 37)"/><rect x="62" y="48" width="6" height="2.6" rx="1.3"/></g>',
  // rosquinha
  '<circle cx="50" cy="52" r="36" fill="#e8b06a"/><path d="M50 18 C72 18 86 32 86 50 C80 60 74 52 68 60 C62 68 56 58 50 64 C44 58 38 68 32 60 C26 52 20 60 14 50 C14 32 28 18 50 18Z" fill="#ff6fa8"/><circle cx="50" cy="48" r="11" fill="var(--mem-fundo, #ffe3ec)"/><circle cx="50" cy="48" r="11" fill="none" stroke="#c98a42" stroke-width="2"/><g stroke-width="3" stroke-linecap="round"><path d="M28 36 l5 2" stroke="#ffd21f"/><path d="M66 30 l4 4" stroke="#3e8bff"/><path d="M70 46 l5 -1" stroke="#fff"/><path d="M36 26 l3 -4" stroke="#2fb66a"/></g>',
  // macaron
  '<ellipse cx="50" cy="38" rx="34" ry="16" fill="#b9e88a"/><rect x="18" y="44" width="64" height="10" rx="5" fill="#fff6e0"/><ellipse cx="50" cy="62" rx="34" ry="16" fill="#9ad66a"/><path d="M20 46 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0" stroke="#86c45a" stroke-width="2" fill="none"/><ellipse cx="38" cy="32" rx="10" ry="4" fill="#fff" opacity=".5"/>',
  // bengala doce
  '<path d="M38 92 V36 A18 18 0 0 1 74 36 V44" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round"/><path d="M38 92 V36 A18 18 0 0 1 74 36 V44" fill="none" stroke="#e5304a" stroke-width="15" stroke-linecap="round" stroke-dasharray="9 9"/>',
  // fatia de bolo
  '<path d="M14 58 L86 40 V82 L14 88Z" fill="#ffe2a8"/><path d="M14 70 L86 58 V64 L14 76Z" fill="#ff6fa8"/><path d="M14 58 L86 40 L66 28 Z" fill="#fff4f8"/><path d="M14 58 L86 40 V46 L14 64Z" fill="#ff9fc6"/><circle cx="64" cy="30" r="7" fill="#e5304a"/><path d="M64 24 q2 -6 6 -7" stroke="#2f9e62" stroke-width="2" fill="none"/>',
];

const RETRATOS = [
  { pele: 0, roupa: 1, estilo: 'esportiva' }, { pele: 2, roupa: 2, estilo: 'street' },
  { pele: 3, roupa: 3, estilo: 'skatista' }, { pele: 1, roupa: 0, estilo: 'tiedye' },
];

const TEMA_DA = (id) => (id[0] === 'd' && /^d\d+$/.test(id) ? 'doces' : /^[pr]\d+$/.test(id) ? 'turma' : BICHOS[id] ? 'bichos' : 'coisas');

export function figura(id) {
  const svg = (corpo) => `<svg viewBox="0 0 100 100" aria-hidden="true">${corpo}</svg>`;
  if (/^d\d+$/.test(id)) return svg(DOCES[Number(id.slice(1))]);
  if (/^p\d+$/.test(id)) return miniatura(PERSONAGENS[Number(id.slice(1))]);
  if (/^r\d+$/.test(id)) return retrato({ ...RETRATOS[Number(id.slice(1))], sorriso: 'feliz' });
  return svg(BICHOS[id] ?? COISAS[id] ?? '');
}
const NOMES = {
  gato: 'gatinho', cachorro: 'cachorrinho', sapo: 'sapo', urso: 'ursinho', panda: 'panda', porco: 'porquinho', coelho: 'coelhinho', pinto: 'pintinho', leao: 'leão', raposa: 'raposa', vaca: 'vaquinha', macaco: 'macaquinho',
  sol: 'sol', lua: 'lua', estrela: 'estrela', coracao: 'coração', balao: 'balão', foguete: 'foguete', flor: 'flor', maca: 'maçã', sorvete: 'sorvete', cogumelo: 'cogumelo', presente: 'presente', arcoiris: 'arco-íris',
};
const NOMES_DOCES = ['coração de morango', 'pirulito de laranja', 'estrela de limão', 'bala de menta', 'gota de mirtilo', 'diamante de uva', 'doce arco-íris', 'cupcake', 'rosquinha', 'macaron', 'bengala doce', 'fatia de bolo'];
function nomeDe(id) {
  if (/^d\d+$/.test(id)) return NOMES_DOCES[Number(id.slice(1))];
  if (/^p\d+$/.test(id)) return PERSONAGENS[Number(id.slice(1))].nome;
  if (/^r\d+$/.test(id)) return `menina ${Number(id.slice(1)) + 1}`;
  return NOMES[id] ?? id;
}

const VERSO = '<svg viewBox="0 0 60 80" aria-hidden="true"><path d="M30 22 L34.5 33 L46 34 L37 41.5 L40 53 L30 46.5 L20 53 L23 41.5 L14 34 L25.5 33Z" fill="#ffd21f" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="14" cy="14" r="2.4" fill="#fff" opacity=".6"/><circle cx="46" cy="66" r="2.4" fill="#fff" opacity=".6"/><circle cx="48" cy="16" r="1.6" fill="#fff" opacity=".5"/><circle cx="12" cy="64" r="1.6" fill="#fff" opacity=".5"/></svg>';

const ELOGIOS = ['Achou!', 'Isso!', 'Muito bem!', 'Que memória!', 'Demais!', 'Uau!'];
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const estrelasHtml = (n, cls = '') => [1, 2, 3].map((e) => `<i class="${e <= n ? 'ok' : ''} ${cls}">★</i>`).join('');

export const faseLiberada = () => mem.progresso(prefs.historico).liberada;

export function resumo() {
  const p = mem.progresso(prefs.historico);
  return {
    cartao: `<b>Fase ${p.liberada}</b> · ${p.estrelas} ★`,
    placar: `<span class="lado"><span class="avatar voce">🃏</span>Fase <span class="num">${p.liberada}</span></span><span class="x">·</span><span class="lado">Estrelas <span class="num">${p.estrelas}</span></span>`,
    painel: { valor: `Fase ${p.liberada}`, rotulo: 'próxima fase', sub: `${p.estrelas} ${p.estrelas === 1 ? 'estrela' : 'estrelas'} conquistadas` },
  };
}

export function montar(area, ctl) {
  const raiz = el('div', 'mem');
  area.append(raiz);
  let e = null; let travado = false; let cartasEl = []; let faseAberta = null;

  // ---------- caminho de fases ----------
  function mostrarMapa(destacar = null) {
    e = null; faseAberta = null; travado = false;
    const p = mem.progresso(prefs.historico);
    const salvo = ctl.salvo();
    const bolinhas = Array.from({ length: mem.TOTAL_FASES }, (_, k) => {
      const n = k + 1; const f = mem.fase(n);
      const est = p.melhor[n]?.estrelas ?? 0;
      const estado = n > p.liberada ? 'trancada' : est ? 'feita' : 'atual';
      const marcas = `${f.troca ? '<span class="mem-marca">🔀</span>' : ''}${f.limite ? '<span class="mem-marca">🎯</span>' : ''}`;
      return `<button class="mem-bola ${estado}${f.chefe ? ' chefe' : ''}${destacar === n ? ' nova' : ''}" data-fase="${n}" ${estado === 'trancada' ? 'disabled' : ''}
        aria-label="Fase ${n}, ${f.pares} pares${estado === 'trancada' ? ', trancada' : `, ${est} estrela${est === 1 ? '' : 's'}`}">
        <span class="mem-num">${estado === 'trancada' ? '🔒' : n}</span>
        ${estado !== 'trancada' ? `<span class="mem-est">${estrelasHtml(est)}</span>` : ''}
        ${salvo?.e?.fase === n ? '<span class="mem-andamento">▶</span>' : ''}
        ${marcas ? `<span class="mem-marcas">${marcas}</span>` : ''}
      </button>`;
    }).join('');
    raiz.innerHTML = `
      <div class="mem-mapa">
        <div class="mem-mapa-topo"><span>⭐ <b>${p.estrelas}</b> / ${p.maxEstrelas}</span><span>Fase <b>${p.liberada}</b> de ${mem.TOTAL_FASES}</span></div>
        <div class="mem-grade-fases">${bolinhas}</div>
        <p class="mem-legenda"><span>🔀 cartas trocam de lugar</span><span>🎯 limite de tentativas</span></p>
      </div>`;
    raiz.querySelectorAll('[data-fase]').forEach((b) => {
      b.onclick = () => {
        const n = Number(b.dataset.fase);
        ctl.som('clique');
        const s = ctl.salvo();
        jogar(n, s?.e?.fase === n ? s.e : null);
      };
    });
    ctl.status(p.liberada === 1 && !p.estrelas ? 'Toque na fase 1 para começar!' : 'Escolha uma fase', 'voce');
  }

  // ---------- partida ----------
  function medidas(f, grade) {
    const linhas = Math.ceil((f.pares * 2) / f.colunas);
    const largura = raiz.clientWidth || 358;
    const topo = grade.getBoundingClientRect().top + window.scrollY;
    const altura = Math.max(320, (window.visualViewport?.height ?? window.innerHeight) - topo - 16);
    const gap = f.colunas >= 6 ? 6 : 8;
    const w = Math.floor(Math.min((largura - gap * (f.colunas - 1)) / f.colunas, (altura - gap * (linhas - 1)) / linhas / 1.22, 112));
    return { w, h: Math.round(w * 1.22), gap };
  }

  function jogar(n, salvo = null) {
    faseAberta = n;
    e = salvo ?? mem.novoJogo(n);
    e.abertas = e.abertas.filter((i) => !e.cartas[i].achada).slice(0, 1);
    travado = false;
    const f = mem.fase(n);
    raiz.innerHTML = `
      <div class="mem-topo">
        <button class="botao secundario mem-voltar">🗺️ Fases</button>
        <div class="mem-titulo"><b>Fase ${n}</b><span>${mem.NOMES_TEMA[f.tema]}${f.troca ? ' · 🔀' : ''}${f.limite ? ' · 🎯' : ''}</span></div>
        <div class="mem-estrelas-agora" aria-label="Estrelas"></div>
      </div>
      <div class="mem-info"></div>
      <div class="mem-mesa"><div class="mem-grade" role="grid" aria-label="Cartas"></div></div>`;
    raiz.querySelector('.mem-voltar').onclick = () => { ctl.som('clique'); if (e && !e.fim) salvar(); mostrarMapa(); };
    const grade = raiz.querySelector('.mem-grade');
    const { w, h, gap } = medidas(f, grade);
    grade.style.gridTemplateColumns = `repeat(${f.colunas}, ${w}px)`;
    grade.style.gap = `${gap}px`;
    grade.style.setProperty('--mem-w', `${w}px`);
    grade.style.setProperty('--mem-h', `${h}px`);
    cartasEl = e.cartas.map((c, i) => {
      const b = el('button', 'mem-carta');
      b.style.animationDelay = reduzido() ? '0s' : `${(i * 0.025).toFixed(3)}s`;
      b.innerHTML = `<span class="mem-giro"><span class="mem-verso">${VERSO}</span><span class="mem-frente"></span></span>`;
      b.onclick = () => tocarCarta(i);
      grade.append(b);
      return b;
    });
    desenharCartas();
    desenharInfo();
    ctl.status(salvo ? 'Partida retomada' : f.troca ? '🔀 Cartas trocam a cada erro!' : f.limite ? `🎯 Ache os pares em ${f.limite} tentativas` : `Ache os ${f.pares} pares!`, 'voce');
    if (!salvo) salvar();
  }

  function desenharCarta(i) {
    const c = e.cartas[i]; const b = cartasEl[i];
    const aberta = c.achada || e.abertas.includes(i);
    const frente = b.querySelector('.mem-frente');
    if (frente.dataset.f !== c.f) {
      frente.dataset.f = c.f;
      frente.className = `mem-frente tema-${TEMA_DA(c.f)}`;
      frente.innerHTML = figura(c.f);
    }
    b.classList.toggle('aberta', aberta);
    b.classList.toggle('achada', c.achada);
    b.setAttribute('aria-label', aberta ? nomeDe(c.f) : `Carta ${i + 1}, fechada`);
    b.disabled = c.achada;
  }
  const desenharCartas = () => e.cartas.forEach((_, i) => desenharCarta(i));

  function desenharInfo() {
    const f = mem.fase(e.fase);
    const resta = mem.restantes(e);
    raiz.querySelector('.mem-info').innerHTML = `
      <span>Pares <b>${mem.achados(e)}</b>/${f.pares}</span>
      <span>Tentativas <b>${e.tentativas}</b></span>
      ${resta !== null ? `<span class="mem-resta${resta <= 3 ? ' pouco' : ''}">🎯 Restam <b>${resta}</b></span>` : ''}`;
    const agora = mem.estrelasPor(f, e.tentativas);
    raiz.querySelector('.mem-estrelas-agora').innerHTML = estrelasHtml(agora);
  }

  const salvar = () => { if (e && !e.fim) ctl.salvar({ e }); };

  async function tocarCarta(i) {
    if (!e || e.fim || travado) return;
    const r = mem.virar(e, i);
    if (r.tipo === 'invalida') return;
    const ativa = ctl.ativa();
    ctl.som('carta');
    desenharCarta(i);
    if (r.tipo === 'primeira') { salvar(); return; }
    desenharInfo();
    if (r.tipo === 'par') {
      travado = true;
      await esperar(380);
      if (!ativa()) return;
      ctl.som('acerto');
      for (const k of r.pares) { cartasEl[k].classList.add('brilha'); desenharCarta(k); }
      travado = false;
      if (r.fim) { terminar(); return; }
      ctl.status(ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)], 'vitoria');
      salvar();
      return;
    }
    // diferente: mostra um pouco e vira de volta
    travado = true;
    salvar();
    const quais = [...e.abertas];
    for (const k of quais) cartasEl[k].classList.add('errou');
    await esperar(850);
    if (!ativa()) return;
    for (const k of quais) cartasEl[k].classList.remove('errou');
    mem.esconder(e);
    for (const k of quais) desenharCarta(k);
    if (r.fim === 'derrota') { await esperar(500); if (!ativa()) return; terminar(); return; }
    if (r.trocadas) {
      await esperar(450);
      if (!ativa()) return;
      await animarTroca(r.trocadas);
      if (!ativa()) return;
      ctl.status('🔀 Duas cartas trocaram de lugar!', '');
    } else ctl.status(mem.restantes(e) !== null && mem.restantes(e) <= 3 ? `Cuidado: só mais ${mem.restantes(e)} tentativas!` : 'Não são iguais. Tente lembrar!', '');
    travado = false;
    salvar();
  }

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  async function animarTroca([a, b]) {
    const ea = cartasEl[a]; const eb = cartasEl[b];
    ctl.som('mover');
    if (!reduzido() && ea.animate) {
      const ra = ea.getBoundingClientRect(); const rb = eb.getBoundingClientRect();
      const dx = rb.left - ra.left; const dy = rb.top - ra.top;
      const op = { duration: 520, easing: 'cubic-bezier(.5,0,.3,1)' };
      ea.style.zIndex = '3'; eb.style.zIndex = '3';
      const quadros = (sx, sy) => [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${sx / 2}px, ${sy / 2}px) scale(1.15) rotate(${sx > 0 ? 8 : -8}deg)` }, { transform: `translate(${sx}px, ${sy}px) scale(1)` }];
      await Promise.all([ea.animate(quadros(dx, dy), op).finished, eb.animate(quadros(-dx, -dy), op).finished]);
      ea.style.zIndex = ''; eb.style.zIndex = '';
    }
    desenharCarta(a); desenharCarta(b);
    for (const x of [ea, eb]) { x.classList.remove('trocou'); void x.offsetWidth; x.classList.add('trocou'); }
  }

  function terminar() {
    const f = mem.fase(e.fase);
    const venceu = e.fim === 'vitoria';
    const est = venceu ? mem.estrelasPor(f, e.tentativas) : 0;
    const pontos = venceu ? mem.pontosDe(e) : 0;
    const antes = mem.progresso(prefs.historico);
    const recorde = venceu && est > (antes.melhor[f.n]?.estrelas ?? 0) && antes.melhor[f.n]?.estrelas;
    ctl.fim(venceu ? 'vitoria' : 'derrota',
      venceu ? `Fase ${f.n} concluída em ${e.tentativas} tentativas!` : 'Acabaram as tentativas. Tente de novo!',
      null, { nivel: f.n, estrelas: est, pontos, tentativas: e.tentativas });
    const mesa = raiz.querySelector('.mem-mesa');
    const caixa = el('div', `mem-fim ${venceu ? 'venceu' : 'perdeu'}`);
    const proxima = f.n < mem.TOTAL_FASES && venceu;
    caixa.innerHTML = `<div class="mem-fim-cartao">
      <div class="mem-fim-titulo">${venceu ? (est === 3 ? 'Perfeito! 🎉' : 'Muito bem! 🎉') : 'Quase! 💪'}</div>
      ${venceu ? `<div class="mem-fim-estrelas">${[1, 2, 3].map((k) => `<i class="${k <= est ? 'ok' : ''}" style="animation-delay:${0.25 + k * 0.22}s">★</i>`).join('')}</div>` : ''}
      <p>${venceu ? `${f.pares} pares em <b>${e.tentativas}</b> tentativas${recorde ? '<br><b>Novo recorde de estrelas!</b>' : ''}${est < 3 ? `<br><small>3 estrelas: até ${f.estrelas[0]} tentativas</small>` : ''}` : `Faltaram ${f.pares - mem.achados(e)} pares.`}</p>
      <div class="mem-fim-botoes">
        ${proxima ? '<button class="botao" data-acao="proxima">Próxima fase ▶</button>' : ''}
        <button class="botao ${proxima ? 'secundario' : ''}" data-acao="denovo">↻ Jogar de novo</button>
        <button class="botao secundario" data-acao="mapa">🗺️ Fases</button>
      </div></div>`;
    if (venceu && !reduzido()) {
      const cores = ['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6', '#ff6fa8'];
      const confete = el('div', 'mem-confete');
      confete.innerHTML = Array.from({ length: 42 }, (_, k) => `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${cores[k % cores.length]};animation-delay:${(Math.random() * 0.6).toFixed(2)}s;animation-duration:${(1.6 + Math.random() * 1.4).toFixed(2)}s;--giro:${Math.round(Math.random() * 720 - 360)}deg;--lado:${Math.round(Math.random() * 80 - 40)}px"></i>`).join('');
      caixa.prepend(confete);
      cartasEl.forEach((c, k) => { c.style.animationDelay = `${(k * 0.03).toFixed(2)}s`; c.classList.add('pula'); });
    }
    if (venceu && est >= 1) setTimeout(() => ctl.som('premio'), 700);
    mesa.style.minHeight = '400px';
    mesa.append(caixa);
    caixa.querySelectorAll('[data-acao]').forEach((b) => {
      b.onclick = () => {
        ctl.som('clique');
        if (b.dataset.acao === 'proxima') jogar(f.n + 1);
        else if (b.dataset.acao === 'denovo') jogar(f.n);
        else mostrarMapa(proxima ? f.n + 1 : null);
      };
    });
  }

  const salvo = ctl.salvo();
  if (salvo?.e?.cartas) jogar(salvo.e.fase, salvo.e);
  else mostrarMapa();

  return {
    // "Nova partida": recomeça a fase aberta; no mapa, abre a próxima fase.
    reiniciar() {
      if (faseAberta) jogar(faseAberta);
      else jogar(mem.progresso(prefs.historico).liberada);
    },
  };
}
