// Gráficos em SVG, sem dependências. Toque em uma coluna ou ponto para ver o valor;
// cada gráfico também traz a tabela com os mesmos dados.

const LARGURA = 340;
const ALTURA = 170;
const MARGEM = { topo: 14, direita: 14, baixo: 24, esquerda: 38 };
const AREA_X = LARGURA - MARGEM.esquerda - MARGEM.direita;
const AREA_Y = ALTURA - MARGEM.topo - MARGEM.baixo;
const BASE = ALTURA - MARGEM.baixo;
const BARRA_MAXIMA = 24;
const RAIO = 4;
const INTERVALO_DE_ROTULOS = 3;
const MAXIMO_DE_ROTULOS = 5;

const dataCurta = (data) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

function arredondarTeto(valor) {
  if (valor <= 0) return 10;
  const escala = 10 ** Math.floor(Math.log10(valor));
  const passo = [1, 2, 2.5, 5, 10].find((p) => p * escala >= valor);
  return passo * escala;
}

function moldura(conteudo, descricao) {
  return `<svg class="grafico" viewBox="0 0 ${LARGURA} ${ALTURA}" role="img" aria-label="${descricao}">${conteudo}</svg>`;
}

function grade(valores, posicaoY, formatar) {
  return valores.map((valor) => {
    const y = posicaoY(valor).toFixed(1);
    return `<line class="g-grade" x1="${MARGEM.esquerda}" x2="${LARGURA - MARGEM.direita}" y1="${y}" y2="${y}"/>
      <text class="g-texto" x="${MARGEM.esquerda - 6}" y="${Number(y) + 3}" text-anchor="end">${formatar(valor)}</text>`;
  }).join('');
}

function rotulosX(datas, centro) {
  return datas.map((data, i) => {
    const ultimo = datas.length - 1;
    const intervalo = datas.length <= MAXIMO_DE_ROTULOS ? 1 : INTERVALO_DE_ROTULOS;
    if ((ultimo - i) % intervalo !== 0) return '';
    return `<text class="g-texto" x="${centro(i).toFixed(1)}" y="${ALTURA - 8}" text-anchor="middle">${dataCurta(data)}</text>`;
  }).join('');
}

function tabela(colunas, linhas) {
  return `
    <details class="tabela-grafico">
      <summary>Ver tabela</summary>
      <table class="ritmos">
        <thead><tr>${colunas.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${linhas.map((l) => `<tr>${l.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </details>`;
}

const figura = (svg, legenda, tabelaHtml) => `
  <figure class="figura" data-sem-gesto>
    ${legenda}
    ${svg}
    <p class="dica" aria-live="polite">Toque no gráfico para ver os valores.</p>
    ${tabelaHtml}
  </figure>`;

export function barrasDeVolume(semanas, formatarKm) {
  const maior = Math.max(...semanas.flatMap((s) => [s.km, s.previsto ?? 0]));
  const teto = arredondarTeto(maior);
  const faixa = AREA_X / semanas.length;
  const largura = Math.min(BARRA_MAXIMA, faixa - 2);
  const centro = (i) => MARGEM.esquerda + faixa * (i + 0.5);
  const y = (valor) => BASE - (valor / teto) * AREA_Y;

  const marcas = semanas.map((s, i) => {
    const x = centro(i) - largura / 2;
    const topo = y(s.km);
    const raio = Math.min(RAIO, BASE - topo, largura / 2);
    const barra = s.km > 0
      ? `<path class="g-barra" d="M${x} ${BASE}V${topo + raio}Q${x} ${topo} ${x + raio} ${topo}H${x + largura - raio}Q${x + largura} ${topo} ${x + largura} ${topo + raio}V${BASE}Z"/>`
      : '';
    const previsto = s.previsto === null
      ? ''
      : `<line class="g-previsto" x1="${x - 1}" x2="${x + largura + 1}" y1="${y(s.previsto)}" y2="${y(s.previsto)}"/>`;
    const dica = `Semana de ${dataCurta(s.segunda)}: ${formatarKm(s.km)} em ${s.corridas} corrida(s)${s.previsto === null ? '' : `, previsto ${formatarKm(s.previsto)}`}`;
    return `${barra}${previsto}<rect class="g-toque" data-dica="${dica}" x="${centro(i) - faixa / 2}" y="${MARGEM.topo}" width="${faixa}" height="${AREA_Y + MARGEM.baixo}"/>`;
  }).join('');

  const svg = moldura(
    grade([0, teto / 2, teto], y, (v) => `${v}`) + rotulosX(semanas.map((s) => s.segunda), centro) + marcas,
    'Quilômetros por semana, corridos e previstos',
  );
  const legenda = `
    <div class="legenda">
      <span><i class="l-barra"></i>Corrido</span>
      <span><i class="l-previsto"></i>Previsto</span>
    </div>`;
  const linhas = semanas.map((s) => [dataCurta(s.segunda), formatarKm(s.km), s.previsto === null ? 'Sem plano' : formatarKm(s.previsto)]);
  return figura(svg, legenda, tabela(['Semana', 'Corrido', 'Previsto'], linhas));
}

// pontos: [{ data, valor }]; valor nulo interrompe a linha em vez de cair a zero.
export function linhaDeEvolucao(pontos, { nome, formatar, formatarEixo = formatar, menorEhMelhor = false, passoMinimo = 0 }) {
  const validos = pontos.filter((p) => p.valor !== null);
  if (validos.length < 2) return '';

  const valores = validos.map((p) => p.valor);
  let minimo = Math.min(...valores);
  let maximo = Math.max(...valores);
  const folga = Math.max((maximo - minimo) * 0.2, passoMinimo);
  minimo -= folga;
  maximo += folga;

  const faixa = AREA_X / pontos.length;
  const centro = (i) => MARGEM.esquerda + faixa * (i + 0.5);
  const proporcao = (v) => (v - minimo) / (maximo - minimo);
  const y = (v) => (menorEhMelhor
    ? MARGEM.topo + proporcao(v) * AREA_Y
    : BASE - proporcao(v) * AREA_Y);

  let caminho = '';
  let continuando = false;
  pontos.forEach((p, i) => {
    if (p.valor === null) {
      continuando = false;
      return;
    }
    caminho += `${continuando ? 'L' : 'M'}${centro(i).toFixed(1)} ${y(p.valor).toFixed(1)}`;
    continuando = true;
  });

  const isolado = (i) => pontos[i].valor !== null && pontos[i - 1]?.valor == null && pontos[i + 1]?.valor == null;
  const ultimo = pontos.reduce((achado, p, i) => (p.valor !== null ? i : achado), 0);
  const marcadores = pontos.map((p, i) => (
    p.valor !== null && (i === ultimo || isolado(i))
      ? `<circle class="g-ponto" cx="${centro(i).toFixed(1)}" cy="${y(p.valor).toFixed(1)}" r="4"/>`
      : ''
  )).join('');
  const toques = pontos.map((p, i) => (
    p.valor === null ? '' : `<rect class="g-toque" data-dica="${dataCurta(p.data)}: ${formatar(p.valor)}" x="${centro(i) - faixa / 2}" y="${MARGEM.topo}" width="${faixa}" height="${AREA_Y + MARGEM.baixo}"/>`
  )).join('');

  const noFim = pontos[ultimo];
  const anchor = centro(ultimo) > LARGURA / 2 ? 'end' : 'start';
  const yRotulo = Math.max(MARGEM.topo + 2, y(noFim.valor) - 9);
  const rotuloFinal = `<text class="g-destaque" x="${centro(ultimo).toFixed(1)}" y="${yRotulo.toFixed(1)}" text-anchor="${anchor}">${formatar(noFim.valor)}</text>`;

  const svg = moldura(
    grade([minimo + folga, maximo - folga], y, formatarEixo)
      + rotulosX(pontos.map((p) => p.data), centro)
      + `<path class="g-linha" d="${caminho}"/>${marcadores}${rotuloFinal}${toques}`,
    nome,
  );
  const linhas = validos.map((p) => [dataCurta(p.data), formatar(p.valor)]);
  return figura(svg, '', tabela(['Data', nome], linhas));
}
