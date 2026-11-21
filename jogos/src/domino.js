// Dominó duplo-seis, você (jogador 0) contra o robô (jogador 1). Lógica pura, sem DOM.
// Uma pedra é [a, b]. A mesa é a fileira de pedras da ponta esquerda à direita, cada uma
// virada como está na mesa: mesa[0][0] é a ponta esquerda e mesa[n - 1][1] a direita.
// `centro` é o índice da primeira pedra jogada, de onde a fileira cresce para os dois lados.

export const POR_MAO = 7;

export function todasPedras() {
  const p = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) p.push([a, b]);
  return p;
}

export function embaralhar(lista, aleatorio = Math.random) {
  const l = lista.slice();
  for (let i = l.length - 1; i > 0; i--) {
    const k = Math.floor(aleatorio() * (i + 1));
    [l[i], l[k]] = [l[k], l[i]];
  }
  return l;
}

export function novoJogo(comeca = 0, aleatorio = Math.random) {
  const p = embaralhar(todasPedras(), aleatorio);
  return {
    maos: [p.slice(0, POR_MAO), p.slice(POR_MAO, 2 * POR_MAO)],
    monte: p.slice(2 * POR_MAO),
    mesa: [], centro: 0, vez: comeca, passes: 0,
    faltas: [[], []], // números que cada jogador mostrou não ter (passou ou comprou com eles nas pontas)
    ultima: null, fim: null,
  };
}

const copiar = (e) => JSON.parse(JSON.stringify(e));
export const soma = (mao) => mao.reduce((t, [a, b]) => t + a + b, 0);
export const ehDobre = ([a, b]) => a === b;
export const pontas = (e) => (e.mesa.length ? [e.mesa[0][0], e.mesa[e.mesa.length - 1][1]] : null);

// Lados em que a pedra encaixa: 'e' (esquerda) e/ou 'd' (direita). Mesa vazia: só 'd'.
export function encaixes(e, [a, b]) {
  const p = pontas(e);
  if (!p) return ['d'];
  const lados = [];
  if (a === p[0] || b === p[0]) lados.push('e');
  if (a === p[1] || b === p[1]) lados.push('d');
  return lados;
}

// Quando as duas pontas têm o mesmo número, os dois lados dão no mesmo: não precisa perguntar.
export function precisaEscolher(e, pedra) {
  const p = pontas(e);
  return encaixes(e, pedra).length === 2 && p[0] !== p[1];
}

// Com as duas pontas iguais, joga no lado de fileira mais curta (a mesa fica equilibrada).
export function ladoAutomatico(e, pedra) {
  const lados = encaixes(e, pedra);
  if (lados.length < 2) return lados[0];
  return e.centro <= e.mesa.length - 1 - e.centro ? 'e' : 'd';
}

export function jogadas(e, j) {
  if (e.fim) return [];
  const lista = [];
  e.maos[j].forEach((pedra, i) => { for (const lado of encaixes(e, pedra)) lista.push({ i, lado }); });
  return lista;
}

export const podeComprar = (e, j) => !e.fim && e.vez === j && !jogadas(e, j).length && e.monte.length > 0;
export const devePassar = (e, j) => !e.fim && e.vez === j && !jogadas(e, j).length && !e.monte.length;

function anotarFalta(e, j) {
  const p = pontas(e);
  if (!p) return;
  for (const n of p) if (!e.faltas[j].includes(n)) e.faltas[j].push(n);
}

export function jogar(estado, j, i, lado) {
  const e = copiar(estado);
  if (e.fim || e.vez !== j) throw new Error('Não é a vez desse jogador');
  const pedra = e.maos[j][i];
  if (!pedra || !encaixes(e, pedra).includes(lado)) throw new Error('Essa pedra não encaixa aí');
  const [a, b] = pedra;
  const p = pontas(e);
  if (!p) e.mesa.push([a, b]);
  else if (lado === 'e') { e.mesa.unshift(b === p[0] ? [a, b] : [b, a]); e.centro++; }
  else e.mesa.push(a === p[1] ? [a, b] : [b, a]);
  e.maos[j].splice(i, 1);
  e.passes = 0;
  e.faltas[j] = [];
  e.ultima = { j, lado, pedra: [a, b] };
  if (!e.maos[j].length) e.fim = { tipo: 'batida', vencedor: j, pontos: e.maos.map(soma) };
  else e.vez = 1 - j;
  return e;
}

export function comprar(estado, j) {
  if (!podeComprar(estado, j)) throw new Error('Não pode comprar agora');
  const e = copiar(estado);
  anotarFalta(e, j);
  e.maos[j].push(e.monte.pop());
  return e;
}

// Passar só vale sem jogada e sem pedra para comprar. Dois passes seguidos: a mesa trancou.
export function passar(estado, j) {
  if (!devePassar(estado, j)) throw new Error('Não pode passar agora');
  const e = copiar(estado);
  anotarFalta(e, j);
  e.passes++;
  e.ultima = { j, passou: true };
  if (e.passes >= 2) {
    const pontos = e.maos.map(soma);
    e.fim = { tipo: 'trancada', vencedor: pontos[0] === pontos[1] ? null : pontos[0] < pontos[1] ? 0 : 1, pontos };
  } else e.vez = 1 - j;
  return e;
}

// ---------- robô ----------

function pontasDepois(e, [a, b], lado) {
  const p = pontas(e);
  if (!p) return [a, b];
  if (lado === 'e') return [a === p[0] ? b : a, p[1]];
  return [p[0], a === p[1] ? b : a];
}

// Pedras que o robô não vê: nem na mão dele nem na mesa (estão na mão do outro ou no monte).
function escondidas(e, j) {
  const vistas = new Set([...e.maos[j], ...e.mesa].map(([a, b]) => `${Math.min(a, b)}${Math.max(a, b)}`));
  return todasPedras().filter(([a, b]) => !vistas.has(`${a}${b}`));
}

function nota(e, j, { i, lado }, nivel) {
  const pedra = e.maos[j][i];
  let n = pedra[0] + pedra[1] + (ehDobre(pedra) ? 4 : 0);
  if (nivel !== 'dificil') return n;
  const [x, y] = pontasDepois(e, pedra, lado);
  const resto = e.maos[j].filter((_, k) => k !== i);
  if (!resto.length) return 1000; // bate!
  // Guarda opções para si: quantas pedras da mão continuam encaixando.
  n += 2 * resto.filter(([a, b]) => a === x || b === x || a === y || b === y).length;
  // Fecha o outro: números que ele já mostrou não ter, e poucas pedras escondidas com essas pontas.
  const faltas = e.faltas[1 - j];
  if (faltas.includes(x)) n += 3;
  if (faltas.includes(y)) n += 3;
  if (faltas.includes(x) && faltas.includes(y)) n += 4;
  n -= 0.6 * escondidas(e, j).filter(([a, b]) => a === x || b === x || a === y || b === y).length;
  return n;
}

export function jogadaRobo(e, j = 1, nivel = 'medio', aleatorio = Math.random) {
  let opcoes = jogadas(e, j);
  if (!opcoes.length) return null;
  // Quando as duas pontas são iguais, os dois lados dão no mesmo: fica só um.
  opcoes = opcoes.filter((o) => {
    const pedra = e.maos[j][o.i];
    return precisaEscolher(e, pedra) || encaixes(e, pedra).length < 2 || o.lado === ladoAutomatico(e, pedra);
  });
  if (nivel === 'facil' && aleatorio() < 0.75) return opcoes[Math.floor(aleatorio() * opcoes.length)];
  let melhor = -Infinity; let melhores = [];
  for (const o of opcoes) {
    const v = nota(e, j, o, nivel);
    if (v > melhor + 1e-9) { melhor = v; melhores = [o]; } else if (Math.abs(v - melhor) < 1e-9) melhores.push(o);
  }
  return melhores[Math.floor(aleatorio() * melhores.length)];
}

// ---------- desenho da mesa ----------
// Calcula onde fica cada pedra numa mesa de `largura` unidades (uma pedra deitada mede 2 × 1).
// A primeira pedra fica no meio da linha 0; o lado direito cresce para a direita e, na borda,
// dobra para baixo e volta; o esquerdo cresce para a esquerda e dobra para cima.
// Os dobres ficam atravessados. Devolve, para cada pedra da mesa, { x, y, w, h, a, b } com
// a = número da metade de cima/esquerda e b = da outra metade.
export function arrumarMesa(mesa, centro, largura = 14) {
  if (!mesa.length) return [];
  const pos = new Array(mesa.length);
  const meio = largura / 2;
  const c = mesa[centro];
  const dobreC = c[0] === c[1];
  pos[centro] = dobreC ? { x: meio - 0.5, y: -1, w: 1, h: 2, a: c[0], b: c[1] } : { x: meio - 1, y: -0.5, w: 2, h: 1, a: c[0], b: c[1] };
  const borda = dobreC ? 0.5 : 1;
  ramo(mesa.slice(centro + 1).map(([l, r]) => [l, r]), meio + borda, 1, 1, dobreC, largura).forEach((p, k) => { pos[centro + 1 + k] = p; });
  ramo(mesa.slice(0, centro).reverse().map(([l, r]) => [r, l]), meio - borda, -1, -1, dobreC, largura).forEach((p, k) => { pos[centro - 1 - k] = p; });
  return pos;
}

// `pedras` vão do centro para fora, cada uma como [número de dentro, número de fora].
function ramo(pedras, x0, dir, vy, anteriorDobre, largura) {
  const out = [];
  let x = x0; let y = 0; let dobreAntes = anteriorDobre;
  for (const [p, q] of pedras) {
    const dobre = p === q;
    const w = dobre ? 1 : 2;
    const cabe = dir > 0 ? x + w <= largura : x - w >= 0;
    if (!cabe) {
      // Na borda, a pedra fica em pé e a fileira volta na linha de baixo (ou de cima).
      const cx = dir > 0 ? x - 1 : x;
      const ini = dobreAntes ? 1 : 0.5;
      const y0 = vy > 0 ? y + ini : y - ini - 2;
      out.push({ x: cx, y: y0, w: 1, h: 2, a: vy > 0 ? p : q, b: vy > 0 ? q : p, curva: true });
      y += 2 * vy;
      dir = -dir;
      x = dir > 0 ? cx + 1 : cx;
      dobreAntes = false;
      continue;
    }
    if (dobre) out.push({ x: dir > 0 ? x : x - 1, y: y - 1, w: 1, h: 2, a: p, b: p });
    else out.push({ x: dir > 0 ? x : x - 2, y: y - 0.5, w: 2, h: 1, a: dir > 0 ? p : q, b: dir > 0 ? q : p });
    x += dir * w;
    dobreAntes = dobre;
  }
  return out;
}
