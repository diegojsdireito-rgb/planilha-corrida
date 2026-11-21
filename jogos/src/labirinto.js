// Labirinto: lógica pura (sem DOM). O labirinto é uma grade de casas; cada casa guarda
// as paredes que tem em volta num número (bits N, L, S, O). Gerado pelo backtracker
// recursivo (feito com pilha), então sempre existe exatamente um caminho entre duas casas.

export const N = 1; export const L = 2; export const S = 4; export const O = 8;
export const DIRECOES = {
  cima: { bit: N, dx: 0, dy: -1, oposto: S },
  direita: { bit: L, dx: 1, dy: 0, oposto: O },
  baixo: { bit: S, dx: 0, dy: 1, oposto: N },
  esquerda: { bit: O, dx: -1, dy: 0, oposto: L },
};
export const NIVEIS = {
  facil: { lado: 8, moedas: 4, nome: 'Jardim pequeno' },
  medio: { lado: 12, moedas: 7, nome: 'Jardim médio' },
  dificil: { lado: 16, moedas: 10, nome: 'Jardim gigante' },
};
export const PONTOS_MOEDA = 10;
export const MULTA_DICA = 5; // segundos somados ao tempo por dica

export const linha = (lab, i) => Math.floor(i / lab.lado);
export const coluna = (lab, i) => i % lab.lado;

// Gera as paredes de um labirinto lado × lado.
export function gerar(lado, aleatorio = Math.random) {
  const total = lado * lado;
  const paredes = new Array(total).fill(N | L | S | O);
  const visitada = new Array(total).fill(false);
  const pilha = [0];
  visitada[0] = true;
  while (pilha.length) {
    const atual = pilha[pilha.length - 1];
    const x = atual % lado; const y = Math.floor(atual / lado);
    const opcoes = [];
    for (const d of Object.values(DIRECOES)) {
      const nx = x + d.dx; const ny = y + d.dy;
      if (nx < 0 || ny < 0 || nx >= lado || ny >= lado) continue;
      const v = ny * lado + nx;
      if (!visitada[v]) opcoes.push([d, v]);
    }
    if (!opcoes.length) { pilha.pop(); continue; }
    const [d, v] = opcoes[Math.floor(aleatorio() * opcoes.length)];
    paredes[atual] &= ~d.bit;
    paredes[v] &= ~d.oposto;
    visitada[v] = true;
    pilha.push(v);
  }
  return paredes;
}

// Casa vizinha na direção, ou -1 se houver parede (ou borda).
export function vizinha(lab, i, nomeDir) {
  const d = DIRECOES[nomeDir];
  if (!d || lab.paredes[i] & d.bit) return -1;
  const x = coluna(lab, i) + d.dx; const y = linha(lab, i) + d.dy;
  if (x < 0 || y < 0 || x >= lab.lado || y >= lab.lado) return -1;
  return y * lab.lado + x;
}

export function vizinhasAbertas(lab, i) {
  return Object.keys(DIRECOES).map((d) => vizinha(lab, i, d)).filter((v) => v >= 0);
}

// Menor caminho (lista de casas, de `de` até `para`, inclusive), por busca em largura.
export function caminho(lab, de, para) {
  const veio = new Map([[de, -1]]);
  const fila = [de];
  while (fila.length) {
    const c = fila.shift();
    if (c === para) break;
    for (const v of vizinhasAbertas(lab, c)) if (!veio.has(v)) { veio.set(v, c); fila.push(v); }
  }
  if (!veio.has(para)) return null;
  const r = [];
  for (let c = para; c !== -1; c = veio.get(c)) r.push(c);
  return r.reverse();
}

export function novoJogo(nivel = 'facil', aleatorio = Math.random) {
  const cfg = NIVEIS[nivel] ?? NIVEIS.facil;
  const lado = cfg.lado;
  const paredes = gerar(lado, aleatorio);
  const saida = lado * lado - 1;
  const lab = { lado, paredes };
  // moedinhas: fora da entrada e da saída, sem repetir, metade delas perto do caminho certo
  const certo = new Set(caminho(lab, 0, saida));
  const livres = Array.from({ length: lado * lado }, (_, i) => i).filter((i) => i !== 0 && i !== saida);
  const moedas = [];
  while (moedas.length < cfg.moedas && livres.length) {
    const noCaminho = moedas.length % 2 === 0;
    const grupo = livres.filter((i) => certo.has(i) === noCaminho);
    const origem = grupo.length ? grupo : livres;
    const escolhida = origem[Math.floor(aleatorio() * origem.length)];
    moedas.push(escolhida);
    livres.splice(livres.indexOf(escolhida), 1);
  }
  return { nivel: cfg === NIVEIS[nivel] ? nivel : 'facil', lado, paredes, pos: 0, saida, moedas: moedas.sort((a, b) => a - b), pegas: [], trilha: [0], dicas: 0, tempo: 0, passos: 0 };
}

export const chegou = (jogo) => jogo.pos === jogo.saida;
export const pontos = (jogo) => jogo.pegas.length * PONTOS_MOEDA;

// Anda uma casa. Devolve { ok, moeda, chegou }.
export function mover(jogo, nomeDir) {
  if (chegou(jogo)) return { ok: false };
  const v = vizinha(jogo, jogo.pos, nomeDir);
  if (v < 0) return { ok: false };
  jogo.pos = v;
  jogo.passos++;
  // a trilha volta junto quando a personagem refaz os próprios passos
  const k = jogo.trilha.lastIndexOf(v);
  if (k >= 0 && k === jogo.trilha.length - 2) jogo.trilha.pop();
  else jogo.trilha.push(v);
  let moeda = false;
  if (jogo.moedas.includes(v) && !jogo.pegas.includes(v)) { jogo.pegas.push(v); moeda = true; }
  return { ok: true, moeda, chegou: chegou(jogo) };
}

// Direção de a para b, se forem vizinhas (ignora paredes).
export function direcaoEntre(lab, a, b) {
  const dx = coluna(lab, b) - coluna(lab, a); const dy = linha(lab, b) - linha(lab, a);
  return Object.keys(DIRECOES).find((d) => DIRECOES[d].dx === dx && DIRECOES[d].dy === dy) ?? null;
}

// Arrastar o dedo: anda rumo à casa `alvo` enquanto houver passagem livre, sem atravessar
// paredes. Se o dedo está a poucos passos pelo corredor (ele "cortou a curva"), segue o
// corredor; senão, vai em linha reta, primeiro no eixo de maior distância, até bater na cerca.
// Devolve a lista de resultados dos passos.
export function seguir(jogo, alvo, limite = 64, curva = 3) {
  const passos = [];
  const perto = caminho(jogo, jogo.pos, alvo);
  if (perto && perto.length - 1 <= Math.min(curva, limite)) {
    for (let k = 1; k < perto.length && !chegou(jogo); k++) passos.push(mover(jogo, direcaoEntre(jogo, perto[k - 1], perto[k])));
    return passos;
  }
  while (jogo.pos !== alvo && passos.length < limite && !chegou(jogo)) {
    const dx = coluna(jogo, alvo) - coluna(jogo, jogo.pos); const dy = linha(jogo, alvo) - linha(jogo, jogo.pos);
    const horiz = dx > 0 ? 'direita' : dx < 0 ? 'esquerda' : null;
    const vert = dy > 0 ? 'baixo' : dy < 0 ? 'cima' : null;
    const ordem = Math.abs(dx) >= Math.abs(dy) ? [horiz, vert] : [vert, horiz];
    let r = null;
    for (const d of ordem) {
      if (!d) continue;
      r = mover(jogo, d);
      if (r.ok) break;
    }
    if (!r?.ok) break;
    passos.push(r);
  }
  return passos;
}

// Dica: as próximas `n` casas do caminho até a saída (sem contar onde ela está).
export function dica(jogo, n = 5) {
  const c = caminho(jogo, jogo.pos, jogo.saida) ?? [];
  return c.slice(1, n + 1);
}
