// Formas que se repetem nos desenhos de pintar (coordenadas da folha de 400 × 400).

export const estrela = (cx, cy, r, ri = r * 0.45, pontas = 5) => {
  let d = '';
  for (let k = 0; k < pontas * 2; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / pontas;
    const rr = k % 2 ? ri : r;
    d += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return `<path d="${d}Z"/>`;
};
export const nuvem = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M-50 20 a22 22 0 0 1 8 -38 a30 30 0 0 1 52 -12 a24 24 0 0 1 40 22 a18 18 0 0 1 0 28 Z"/>`;
export const coracao = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 12 C-30 -8 -22 -32 -8 -30 C-3 -29 0 -25 0 -21 C0 -25 3 -29 8 -30 C22 -32 30 -8 0 12 Z"/>`;
export const flor = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-11" rx="7" ry="11" transform="rotate(${a})"/>`).join('')}<circle r="6"/></g>`;
export const sol = (x, y, r) => `<g fill="none">${Array.from({ length: 10 }, (_, k) => { const a = (k * Math.PI) / 5; return `<path d="M${(x + Math.cos(a) * (r + 8)).toFixed(1)} ${(y + Math.sin(a) * (r + 8)).toFixed(1)} L${(x + Math.cos(a) * (r + 22)).toFixed(1)} ${(y + Math.sin(a) * (r + 22)).toFixed(1)}"/>`; }).join('')}</g><circle cx="${x}" cy="${y}" r="${r}"/>`;
export const PRETO = 'fill="#1d1b18"';


// Sorteio repetível: o mesmo desenho sai sempre igual.
export function semente(n) {
  let a = n >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const f1 = (n) => Number(n.toFixed(1));
