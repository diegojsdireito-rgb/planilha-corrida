export function el(tag, classe, conteudo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (conteudo !== undefined) e.innerHTML = conteudo;
  return e;
}

export function svgEl(tag, attrs = {}) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

export const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

export function formatarTempo(seg) {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export const SVG_X = '<svg viewBox="0 0 10 10"><path d="M2 2 8 8M8 2 2 8" stroke="var(--vermelho)" stroke-width="1.6" stroke-linecap="round"/></svg>';
export const SVG_O = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.2" fill="none" stroke="var(--azul)" stroke-width="1.6"/></svg>';
export const COROA = '<svg viewBox="0 0 24 24"><path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z"/></svg>';

// Faz a peça que já está na casa final parecer sair da origem e passar pelas casas do caminho.
// `casas` é a lista de elementos do tabuleiro; `caminho` vai da origem ao destino.
export function deslizar(casas, caminho, ms, seletor = '.pc, .pedra') {
  const destino = casas[caminho[caminho.length - 1]];
  const peca = destino?.querySelector(seletor);
  if (!peca || !peca.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rd = destino.getBoundingClientRect();
  const quadros = caminho.map((i) => {
    const r = casas[i].getBoundingClientRect();
    return { transform: `translate(${r.left - rd.left}px, ${r.top - rd.top}px) scale(${i === caminho[0] ? 1 : 1.12})` };
  });
  quadros[quadros.length - 1] = { transform: 'translate(0, 0) scale(1)' };
  destino.style.zIndex = '4';
  peca.style.zIndex = '4';
  const anim = peca.animate(quadros, { duration: ms, easing: 'cubic-bezier(.35, .1, .25, 1)' });
  anim.onfinish = anim.oncancel = () => { destino.style.zIndex = ''; };
}
