// Gestos de deslizar. A rolagem vertical continua com o navegador (touch-action: pan-y).

const DISTANCIA_MINIMA = 70;
const DISTANCIA_MINIMA_RAPIDO = 30;
const VELOCIDADE_RAPIDO = 0.5; // px por ms
const DOMINANCIA_HORIZONTAL = 1.5;
const INICIO_DO_ARRASTE = 10;
const RESISTENCIA_SEM_DESTINO = 0.2;
const SELETOR_IGNORADO = 'input, select, textarea, label, [data-sem-gesto]';

export function interpretarGesto({ dx, dy, ms }) {
  const distancia = Math.abs(dx);
  if (distancia < Math.abs(dy) * DOMINANCIA_HORIZONTAL) return null;
  const rapido = ms > 0 && distancia >= DISTANCIA_MINIMA_RAPIDO && distancia / ms >= VELOCIDADE_RAPIDO;
  if (distancia < DISTANCIA_MINIMA && !rapido) return null;
  return dx < 0 ? 'esquerda' : 'direita';
}

// Deslizar para a esquerda avança, como virar uma página.
export function abaDoGesto(abas, atual, direcao) {
  const indice = abas.indexOf(atual) + (direcao === 'esquerda' ? 1 : -1);
  return abas[indice] ?? null;
}

export function ligarGestos(elemento, { podeIniciar, temDestino, aoDeslizar }) {
  let inicio = null;
  let arrastando = false;

  const soltar = () => {
    elemento.style.transition = 'transform .16s ease-out';
    elemento.style.transform = '';
    inicio = null;
    arrastando = false;
  };

  elemento.addEventListener('touchstart', (e) => {
    inicio = null;
    if (e.touches.length !== 1 || !podeIniciar() || e.target.closest(SELETOR_IGNORADO)) return;
    const toque = e.touches[0];
    inicio = { x: toque.clientX, y: toque.clientY, t: e.timeStamp };
    elemento.style.transition = 'none';
  }, { passive: true });

  elemento.addEventListener('touchmove', (e) => {
    if (!inicio || e.touches.length !== 1) return;
    const toque = e.touches[0];
    const dx = toque.clientX - inicio.x;
    const dy = toque.clientY - inicio.y;
    if (!arrastando) {
      if (Math.abs(dy) > INICIO_DO_ARRASTE && Math.abs(dy) > Math.abs(dx)) {
        inicio = null;
        return;
      }
      if (Math.abs(dx) < INICIO_DO_ARRASTE) return;
      arrastando = true;
    }
    const direcao = dx < 0 ? 'esquerda' : 'direita';
    elemento.style.transform = `translateX(${temDestino(direcao) ? dx : dx * RESISTENCIA_SEM_DESTINO}px)`;
  }, { passive: true });

  elemento.addEventListener('touchend', (e) => {
    if (!inicio) return;
    const toque = e.changedTouches[0];
    const direcao = interpretarGesto({ dx: toque.clientX - inicio.x, dy: toque.clientY - inicio.y, ms: e.timeStamp - inicio.t });
    const concluir = arrastando && direcao && temDestino(direcao);
    soltar();
    if (!concluir) return;
    elemento.style.transition = 'none';
    aoDeslizar(direcao);
    elemento.classList.remove('entra-direita', 'entra-esquerda');
    void elemento.offsetWidth; // reinicia a animação
    elemento.classList.add(direcao === 'esquerda' ? 'entra-direita' : 'entra-esquerda');
  }, { passive: true });

  elemento.addEventListener('touchcancel', () => {
    if (inicio) soltar();
  }, { passive: true });
}
