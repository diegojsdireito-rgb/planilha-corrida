// Jogo de pintar: ferramentas, cores e o balde de tinta (sem DOM, para dar para testar).

export const FERRAMENTAS = [
  { id: 'canetinha', nome: 'Canetinha', icone: '🖊️' },
  { id: 'pincel', nome: 'Pincel', icone: '🖌️' },
  { id: 'giz', nome: 'Giz de cera', icone: '🖍️' },
  { id: 'lapis', nome: 'Lápis de cor', icone: '✏️' },
  { id: 'spray', nome: 'Spray', icone: '💨' },
  { id: 'marcatexto', nome: 'Marca-texto', icone: '🟨' },
  { id: 'estrelinhas', nome: 'Estrelinhas', icone: '⭐' },
  { id: 'coracoes', nome: 'Coraçõezinhos', icone: '💖' },
  { id: 'balde', nome: 'Balde de tinta', icone: '🪣' },
  { id: 'borracha', nome: 'Borracha', icone: '🧽' },
];

export const TIPOS_COR = [
  { id: 'normal', nome: 'Normal', icone: '🎨' },
  { id: 'arcoiris', nome: 'Arco-íris', icone: '🌈' },
  { id: 'brilho', nome: 'Purpurina', icone: '✨' },
  { id: 'neon', nome: 'Neon', icone: '💡' },
  { id: 'degrade', nome: 'Degradê', icone: '🌅' },
];

export const TAMANHOS = [
  { id: 'p', nome: 'Fino', px: 7 },
  { id: 'm', nome: 'Médio', px: 16 },
  { id: 'g', nome: 'Grosso', px: 30 },
  { id: 'gg', nome: 'Gigante', px: 54 },
];

export const CORES = [
  '#e53935', '#ff5c8a', '#ff9ec4', '#c2185b', '#ff7a1f', '#ffb74d',
  '#ffd21f', '#fff176', '#8bc34a', '#2e9e4f', '#00bfa5', '#4dd0e1',
  '#29b6f6', '#1e63d6', '#3f3fb5', '#8e5bd6', '#c79bf2', '#6d3fa0',
  '#8d5a2b', '#c58a52', '#f2c9a0', '#ffe0c7', '#9e9e9e', '#1d1b18',
];

// "#rrggbb" → [r, g, b]
export function rgb(cor) {
  const n = parseInt(cor.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
export const misturar = (a, b, t) => hex(rgb(a).map((v, k) => v + (rgb(b)[k] - v) * t));

// Cor de um ponto do traço: muda ao longo do caminho no arco-íris e no degradê.
export function corNoTraco(base, tipo, distancia) {
  if (tipo === 'arcoiris') return `hsl(${Math.round(distancia * 0.5) % 360} 90% 55%)`;
  if (tipo === 'degrade') {
    const t = (Math.sin(distancia / 90) + 1) / 2;
    return misturar(base, misturar(base, '#ffffff', 0.75), t);
  }
  if (tipo === 'neon') return misturar(base, '#ffffff', 0.25);
  return base;
}

// Balde de tinta: a partir do ponto tocado, marca tudo o que dá para alcançar sem cruzar
// uma linha do desenho. paredes[i] = 1 onde há linha. Devolve a máscara (já alargada por
// baixo das linhas, para não sobrar branco na beirada) e o retângulo ocupado.
export function regiao(paredes, w, h, x0, y0, alargar = 2) {
  x0 = Math.floor(x0); y0 = Math.floor(y0);
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h || paredes[y0 * w + x0]) return null;
  const mascara = new Uint8Array(w * h);
  const pilha = [x0, y0];
  let x1 = x0; let x2 = x0; let y1 = y0; let y2 = y0; let total = 0;
  while (pilha.length) {
    const y = pilha.pop(); let x = pilha.pop();
    let i = y * w + x;
    if (mascara[i] || paredes[i]) continue;
    while (x > 0 && !paredes[i - 1] && !mascara[i - 1]) { x--; i--; }
    let cima = false; let baixo = false;
    while (x < w && !paredes[i] && !mascara[i]) {
      mascara[i] = 1; total++;
      if (x < x1) x1 = x; if (x > x2) x2 = x;
      if (y > 0) {
        const livre = !paredes[i - w] && !mascara[i - w];
        if (livre && !cima) { pilha.push(x, y - 1); cima = true; } else if (!livre) cima = false;
      }
      if (y < h - 1) {
        const livre = !paredes[i + w] && !mascara[i + w];
        if (livre && !baixo) { pilha.push(x, y + 1); baixo = true; } else if (!livre) baixo = false;
      }
      x++; i++;
    }
    if (y < y1) y1 = y; if (y > y2) y2 = y;
  }
  // alarga por baixo das linhas: a tinta encosta no contorno sem deixar fresta branca
  for (let passo = 0; passo < alargar; passo++) {
    const novos = [];
    for (let y = Math.max(0, y1 - 1); y <= Math.min(h - 1, y2 + 1); y++) {
      for (let x = Math.max(0, x1 - 1); x <= Math.min(w - 1, x2 + 1); x++) {
        const i = y * w + x;
        if (mascara[i] || !paredes[i]) continue;
        if ((x > 0 && mascara[i - 1] === 1) || (x < w - 1 && mascara[i + 1] === 1) || (y > 0 && mascara[i - w] === 1) || (y < h - 1 && mascara[i + w] === 1)) novos.push(i);
      }
    }
    for (const i of novos) mascara[i] = 1;
    x1 = Math.max(0, x1 - 1); y1 = Math.max(0, y1 - 1); x2 = Math.min(w - 1, x2 + 1); y2 = Math.min(h - 1, y2 + 1);
  }
  return { mascara, x1, y1, x2, y2, total };
}

// Quantos desenhos diferentes a pessoa já terminou.
export function terminados(historico) {
  return new Set(historico.filter((h) => h.j === 'pintar' && h.r === 'concluida' && h.desenho).map((h) => h.desenho)).size;
}
