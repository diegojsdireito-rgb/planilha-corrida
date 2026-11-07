// Mapa e curvas de uma atividade. Funções puras. O percurso fica só na memória da tela:
// não vai para o armazenamento do aparelho nem para a cópia de segurança.

const TAMANHO_DO_BLOCO = 256;
const ZOOM_MAXIMO = 17;
const VELOCIDADE_MINIMA = 0.5; // m/s: abaixo disso, a pessoa está parada.
const VELOCIDADE_MAXIMA = 25; // m/s: acima disso, é salto de GPS.

const dentro = (ponto) => Array.isArray(ponto)
  && Number.isFinite(ponto[0]) && Number.isFinite(ponto[1])
  && Math.abs(ponto[0]) <= 85 && Math.abs(ponto[1]) <= 180;

export function pontosDoMapa(latlngs, maximo = 500) {
  const validos = (latlngs ?? []).filter(dentro);
  if (validos.length <= maximo) return validos;
  const passo = (validos.length - 1) / (maximo - 1);
  return Array.from({ length: maximo }, (_, i) => validos[Math.round(i * passo)]);
}

export function projetar([lat, lng], zoom) {
  const escala = TAMANHO_DO_BLOCO * 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  return [
    ((lng + 180) / 360) * escala,
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * escala,
  ];
}

// Maior zoom em que o percurso inteiro cabe, com os blocos que cobrem a área e o traço na tela.
export function enquadrarMapa(pontos, { largura = 340, altura = 240, margem = 24 } = {}) {
  if (pontos.length < 2) return null;
  let zoom = ZOOM_MAXIMO;
  let limites;
  for (; zoom >= 0; zoom--) {
    const xy = pontos.map((p) => projetar(p, zoom));
    const xs = xy.map(([x]) => x);
    const ys = xy.map(([, y]) => y);
    limites = { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) };
    if (limites.xMax - limites.xMin <= largura - 2 * margem && limites.yMax - limites.yMin <= altura - 2 * margem) break;
  }
  zoom = Math.max(zoom, 0);
  const inicioX = (limites.xMin + limites.xMax) / 2 - largura / 2;
  const inicioY = (limites.yMin + limites.yMax) / 2 - altura / 2;
  const total = 2 ** zoom;
  const blocos = [];
  for (let y = Math.floor(inicioY / TAMANHO_DO_BLOCO); y * TAMANHO_DO_BLOCO < inicioY + altura; y++) {
    if (y < 0 || y >= total) continue;
    for (let x = Math.floor(inicioX / TAMANHO_DO_BLOCO); x * TAMANHO_DO_BLOCO < inicioX + largura; x++) {
      if (x < 0 || x >= total) continue;
      blocos.push({ z: zoom, x, y, esquerda: x * TAMANHO_DO_BLOCO - inicioX, topo: y * TAMANHO_DO_BLOCO - inicioY });
    }
  }
  const traco = pontos.map((p) => {
    const [x, y] = projetar(p, zoom);
    return [x - inicioX, y - inicioY];
  });
  return { zoom, largura, altura, tamanhoDoBloco: TAMANHO_DO_BLOCO, blocos, traco };
}

const media = (lista) => (lista.length ? lista.reduce((t, v) => t + v, 0) / lista.length : null);

// Agrupa as amostras em trechos, para o gráfico não carregar milhares de pontos.
// Parada não entra no pace, e deixa um vão na linha.
export function curvasDaAtividade({ tempo, distancia, velocidade, fc, altitude }, { trechos = 150 } = {}) {
  const tamanho = Math.max(tempo?.length ?? 0, distancia?.length ?? 0, velocidade?.length ?? 0, fc?.length ?? 0, altitude?.length ?? 0);
  if (tamanho < 2) return null;
  const temDistancia = Boolean(distancia?.some((d) => d > 0));
  const quantidade = Math.min(trechos, tamanho);
  const validos = (lista, de, ate) => (lista ?? []).slice(de, ate).filter((v) => Number.isFinite(v));
  const pontos = [];
  for (let t = 0; t < quantidade; t++) {
    const de = Math.floor((t * tamanho) / quantidade);
    const ate = Math.floor(((t + 1) * tamanho) / quantidade);
    const emMovimento = validos(velocidade, de, ate).filter((v) => v >= VELOCIDADE_MINIMA && v <= VELOCIDADE_MAXIMA);
    const fim = ate - 1;
    pontos.push({
      x: temDistancia ? (distancia[fim] ?? 0) / 1000 : (tempo?.[fim] ?? fim) / 60,
      velocidade: media(emMovimento),
      fc: media(validos(fc, de, ate).filter((v) => v > 0)),
      altitude: media(validos(altitude, de, ate)),
    });
  }
  return { eixo: temDistancia ? 'km' : 'min', pontos };
}
