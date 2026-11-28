// Docinhos: trocar doces vizinhos para alinhar 3 ou mais iguais.
// Grade 8x8; cada casa guarda { id, tipo: 0..5, especial: null | 'linha' | 'coluna' | 'bomba' | 'arcoiris' }.
// 4 em linha cria um doce listrado, L ou T cria uma bomba, 5 em linha cria o arco-íris.
// Obstáculos:
// - doce congelado ({ gelo: 1 ou 2 }): não sai do lugar na troca; formar trinca com ele, estourar um doce
//   ao lado ou acertá-lo com um especial quebra uma camada de gelo;
// - pedra ({ pedra: 1 ou 2, tipo: -2 }): ocupa a casa, não forma trinca e perde uma camada quando um doce
//   estoura ao lado ou um especial a atinge;
// - corrente de alcaçuz ({ corrente: 1 }, Praia de Caramelo): prende o doce, que não pode ser trocado mas
//   forma trinca; a trinca (ou um especial) solta a corrente. Doce estourando ao lado não solta;
// - chocolate ({ chocolate: 1, tipo: -3 }, Vulcão de Chocolate): ocupa a casa e quebra como a pedra; se numa
//   jogada nenhum chocolate for quebrado, um chocolate cresce para uma casa vizinha;
// - cereja ({ cereja: true, tipo: -5 }, Nuvens de Algodão-doce): ingrediente que não estoura; desce com os
//   doces, troca com qualquer vizinho mesmo sem formar trinca e é recolhido quando chega na fileira de
//   baixo. A fase pede um número de cerejas;
// - caixa de presente ({ caixa: 2 ou 3, tipo: -4, premio, premioTipo }, Galáxia de Jujuba): perde uma camada
//   por batida (doce ao lado ou especial); quando abre, vira um doce especial.

export const LADO = 8;
export const PONTOS_POR_DOCE = 60;
export const PONTOS_GELO = 100;
export const PONTOS_PEDRA = 150;
export const PONTOS_CORRENTE = 100;
export const PONTOS_CHOCOLATE = 120;
export const PONTOS_CAIXA = 150;
export const PONTOS_CEREJA = 500;
export const MAX_CHOCOLATE = 18; // o chocolate não cresce além disso
const VALOR = { gelo: PONTOS_GELO, pedra: PONTOS_PEDRA, corrente: PONTOS_CORRENTE, chocolate: PONTOS_CHOCOLATE, caixa: PONTOS_CAIXA };

let proximoId = 1;
const novoDoce = (tipo, especial = null) => ({ id: proximoId++, tipo, especial });
const linha = (i) => Math.floor(i / LADO);
const coluna = (i) => i % LADO;
export const vizinhas = (a, b) => (Math.abs(linha(a) - linha(b)) + Math.abs(coluna(a) - coluna(b))) === 1;
const ao_lado = (i) => {
  const r = linha(i); const c = coluna(i); const out = [];
  if (r > 0) out.push(i - LADO);
  if (r < LADO - 1) out.push(i + LADO);
  if (c > 0) out.push(i - 1);
  if (c < LADO - 1) out.push(i + 1);
  return out;
};

const PEDRA = -2; const CHOCOLATE = -3; const CAIXA = -4; const CEREJA = -5;
// Bloco: ocupa a casa no lugar de um doce (pedra, chocolate, caixa).
export const bloco = (d) => Boolean(d && (d.pedra > 0 || d.chocolate > 0 || d.caixa > 0));
// Doce que não pode ser trocado (congelado, acorrentado ou bloco).
export const preso = (d) => Boolean(d && (d.gelo > 0 || d.corrente > 0 || bloco(d)));
// Doce comum, sem nada por cima: pode virar especial, receber chocolate etc.
export const livre = (d) => Boolean(d && d.tipo >= 0 && !d.especial && !preso(d));
const novaPedra = (forca = 1) => ({ id: proximoId++, tipo: PEDRA, especial: null, pedra: forca });
const novoChocolate = () => ({ id: proximoId++, tipo: CHOCOLATE, especial: null, chocolate: 1 });
const novaCereja = () => ({ id: proximoId++, tipo: CEREJA, especial: null, cereja: true });
const novaCaixa = (camadas, premio, premioTipo) => ({ id: proximoId++, tipo: CAIXA, especial: null, caixa: camadas, premio, premioTipo });

// Quanto falta quebrar: camadas de cada obstáculo na mesa.
export function obstaculos(g) {
  const o = { gelo: 0, pedra: 0, corrente: 0, chocolate: 0, caixa: 0 };
  for (const d of g) for (const k in o) if (d?.[k]) o[k] += d[k];
  o.total = o.gelo + o.pedra + o.corrente + o.chocolate + o.caixa;
  return o;
}
export const cerejasNaMesa = (g) => g.filter((d) => d?.cereja).length;

export function cores(nivel) { return nivel < 4 ? 5 : 6; }

function sortear(tipos, aleatorio) { return Math.floor(aleatorio() * tipos); }

// Grade inicial sem trincas prontas e com pelo menos uma jogada possível.
export function novaGrade(tipos = 6, aleatorio = Math.random) {
  for (;;) {
    const g = [];
    for (let i = 0; i < LADO * LADO; i++) {
      let t;
      do {
        t = sortear(tipos, aleatorio);
      } while (
        (coluna(i) >= 2 && g[i - 1].tipo === t && g[i - 2].tipo === t)
        || (linha(i) >= 2 && g[i - LADO].tipo === t && g[i - 2 * LADO].tipo === t)
      );
      g.push(novoDoce(t));
    }
    if (encontrarJogada(g)) return g;
  }
}

// Sequências de 3 ou mais na horizontal e na vertical. Arco-íris não forma sequência.
export function sequencias(g) {
  const seqs = [];
  // só doces de verdade formam sequência (tipo 0..5): pedra, chocolate, caixa, cereja e arco-íris não
  const igual = (a, b) => g[a] && g[b] && g[a].tipo >= 0 && g[a].especial !== 'arcoiris' && g[b].especial !== 'arcoiris' && g[a].tipo === g[b].tipo;
  for (let r = 0; r < LADO; r++) {
    let ini = 0;
    for (let c = 1; c <= LADO; c++) {
      if (c < LADO && igual(r * LADO + c, r * LADO + ini)) continue;
      if (c - ini >= 3) seqs.push({ dir: 'h', casas: Array.from({ length: c - ini }, (_, k) => r * LADO + ini + k) });
      ini = c;
    }
  }
  for (let c = 0; c < LADO; c++) {
    let ini = 0;
    for (let r = 1; r <= LADO; r++) {
      if (r < LADO && igual(r * LADO + c, ini * LADO + c)) continue;
      if (r - ini >= 3) seqs.push({ dir: 'v', casas: Array.from({ length: r - ini }, (_, k) => (ini + k) * LADO + c) });
      ini = r;
    }
  }
  return seqs;
}

// Junta sequências que se cruzam (L e T) em grupos.
export function grupos(g) {
  const seqs = sequencias(g);
  const pai = seqs.map((_, k) => k);
  const raiz = (k) => (pai[k] === k ? k : (pai[k] = raiz(pai[k])));
  const dona = new Map();
  seqs.forEach((s, k) => {
    for (const i of s.casas) {
      if (dona.has(i)) pai[raiz(k)] = raiz(dona.get(i));
      else dona.set(i, k);
    }
  });
  const mapa = new Map();
  seqs.forEach((s, k) => {
    const r = raiz(k);
    if (!mapa.has(r)) mapa.set(r, { seqs: [], casas: new Set() });
    mapa.get(r).seqs.push(s);
    s.casas.forEach((i) => mapa.get(r).casas.add(i));
  });
  return [...mapa.values()].map((x) => ({ seqs: x.seqs, casas: [...x.casas] }));
}

function especialDoGrupo(grupo) {
  const maior = Math.max(...grupo.seqs.map((s) => s.casas.length));
  if (maior >= 5) return 'arcoiris';
  const temH = grupo.seqs.some((s) => s.dir === 'h');
  const temV = grupo.seqs.some((s) => s.dir === 'v');
  if (temH && temV) return 'bomba';
  if (maior === 4) return grupo.seqs.find((s) => s.casas.length === 4).dir === 'h' ? 'linha' : 'coluna';
  return null;
}

// Casas atingidas quando um especial é acionado.
function alcance(g, i, tipoAlvo = null) {
  const d = g[i];
  const r = linha(i); const c = coluna(i);
  if (d.especial === 'linha') return Array.from({ length: LADO }, (_, k) => r * LADO + k);
  if (d.especial === 'coluna') return Array.from({ length: LADO }, (_, k) => k * LADO + c);
  if (d.especial === 'bomba') {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr; const cc = c + dc;
      if (rr >= 0 && rr < LADO && cc >= 0 && cc < LADO) out.push(rr * LADO + cc);
    }
    return out;
  }
  if (d.especial === 'arcoiris') {
    const alvo = tipoAlvo ?? maisComum(g, i);
    return g.map((x, k) => (x && x.tipo === alvo ? k : -1)).filter((k) => k >= 0).concat(i);
  }
  return [i];
}

function maisComum(g, exceto) {
  const conta = {};
  g.forEach((x, k) => { if (x && k !== exceto && !x.especial && x.tipo >= 0) conta[x.tipo] = (conta[x.tipo] ?? 0) + 1; });
  return Number(Object.entries(conta).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0);
}

// Remove as casas, acionando em cadeia os especiais que forem atingidos. Doce congelado perde uma
// camada de gelo em vez de sair, e o acorrentado perde a corrente; pedra e chocolate perdem uma camada e
// só saem quando acabam; a caixa de presente perde uma camada e, quando abre, vira um doce especial ali
// mesmo. A cereja não estoura. Blocos e gelo ao lado de doces que saíram também levam uma batida (a
// corrente não: só a trinca ou um especial solta); cada casa no máximo uma vez por estouro.
// Devolve as casas que saíram; em .quebrados, quantas camadas de cada obstáculo quebraram; em .soltos,
// as caixas que abriram ({ i, velho, novo } com os ids).
function estourar(g, casas, preservar = new Set(), alvos = new Map()) {
  const fila = [...casas];
  const removidas = new Set();
  const batidas = new Set();
  const soltos = [];
  const q = { gelo: 0, pedra: 0, corrente: 0, chocolate: 0, caixa: 0 };
  const bater = (i, deLado = false) => {
    const d = g[i];
    if (!d || batidas.has(i)) return false;
    if (d.gelo > 0) { batidas.add(i); g[i] = { ...d, gelo: d.gelo - 1 }; q.gelo++; return true; }
    if (d.corrente > 0) {
      if (deLado) return false;
      batidas.add(i); g[i] = { ...d, corrente: d.corrente - 1 }; q.corrente++; return true;
    }
    for (const k of ['pedra', 'chocolate']) {
      if (!(d[k] > 0)) continue;
      batidas.add(i); q[k]++;
      if (d[k] > 1) g[i] = { ...d, [k]: d[k] - 1 };
      else removidas.add(i);
      return true;
    }
    if (d.caixa > 0) {
      batidas.add(i); q.caixa++;
      if (d.caixa > 1) g[i] = { ...d, caixa: d.caixa - 1 };
      else {
        const novo = novoDoce(d.premioTipo ?? 0, d.premio ?? 'bomba');
        soltos.push({ i, velho: d.id, novo: novo.id });
        g[i] = novo;
      }
      return true;
    }
    return false;
  };
  while (fila.length) {
    const i = fila.pop();
    if (removidas.has(i) || preservar.has(i) || !g[i] || g[i].cereja) continue;
    if (batidas.has(i) && (bloco(g[i]) || soltos.some((s) => s.i === i))) continue;
    if (bater(i)) continue;
    removidas.add(i);
    if (g[i].especial) for (const k of alcance(g, i, alvos.get(i))) if (!removidas.has(k)) fila.push(k);
  }
  for (const i of [...removidas]) {
    if (bloco(g[i])) continue;
    for (const k of ao_lado(i)) if ((bloco(g[k]) || g[k]?.gelo) && !removidas.has(k)) bater(k, true);
  }
  const saida = [...removidas];
  saida.quebrados = q;
  saida.soltos = soltos;
  return saida;
}
const pontosQuebrados = (q) => Object.entries(VALOR).reduce((t, [k, v]) => t + (q?.[k] ?? 0) * v, 0);
const somaQuebrados = (lista) => {
  const q = { gelo: 0, pedra: 0, corrente: 0, chocolate: 0, caixa: 0 };
  for (const x of lista) if (x) for (const k in q) q[k] += x[k] ?? 0;
  return q;
};

// Estoura e tira da mesa o que saiu. Devolve os ids que somem e os que nascem (caixas que abriram).
function aplicar(g, casas, preservar, alvos) {
  const rem = estourar(g, casas, preservar, alvos);
  const removidos = rem.map((i) => g[i].id).concat(rem.soltos.map((s) => s.velho));
  rem.forEach((i) => { g[i] = null; });
  return { saiu: rem.length, removidos, criados: rem.soltos.map((s) => s.novo), quebrados: rem.quebrados, pontos: rem.length * PONTOS_POR_DOCE + pontosQuebrados(rem.quebrados) };
}

// Os doces caem para preencher os buracos e chegam doces novos por cima. O doce acorrentado fica
// preso no lugar: os outros passam por trás dele.
const fixo = (d) => Boolean(d?.corrente > 0);
function cair(g, tipos, aleatorio) {
  for (let c = 0; c < LADO; c++) {
    const coluna_ = [];
    for (let r = LADO - 1; r >= 0; r--) if (g[r * LADO + c] && !fixo(g[r * LADO + c])) coluna_.push(g[r * LADO + c]);
    let k = 0;
    for (let r = LADO - 1; r >= 0; r--) {
      if (fixo(g[r * LADO + c])) continue;
      g[r * LADO + c] = coluna_[k++] ?? novoDoce(sortear(tipos, aleatorio));
    }
  }
}

const copia = (g) => g.map((x) => (x ? { ...x } : null));

// Executa uma troca. Devolve null se ela não forma nada; senão as etapas para animar.
// Cada etapa: { removidos: [ids], criados: [ids], grade, pontos }, e às vezes coletadas (cerejas que
// saíram), espalhou (casa onde o chocolate cresceu), cereja (casa onde uma cereja nova apareceu) ou embaralhou.
// regras.cerejas: quantas cerejas a fase ainda pede (para saber se aparece cereja nova lá em cima).
export function trocar(grade, a, b, tipos = 6, aleatorio = Math.random, regras = {}) {
  if (!vizinhas(a, b) || preso(grade[a]) || preso(grade[b])) return null;
  const g = copia(grade);
  [g[a], g[b]] = [g[b], g[a]];
  const etapas = [];
  let combo = 1;

  // Combinações com arco-íris e entre especiais acontecem na própria troca.
  const da = g[a]; const db = g[b];
  const arco = da.especial === 'arcoiris' ? a : db.especial === 'arcoiris' ? b : -1;
  if (arco >= 0 || (da.especial && db.especial)) {
    let casas;
    const alvos = new Map();
    if (da.especial === 'arcoiris' && db.especial === 'arcoiris') casas = g.map((_, k) => k);
    else if (arco >= 0) {
      const outra = arco === a ? b : a;
      const tipo = g[outra].tipo >= 0 ? g[outra].tipo : maisComum(g, arco); // trocado com a cereja: a cor que mais tem
      alvos.set(arco, tipo);
      if (g[outra].especial) {
        // arco-íris + especial: todos daquela cor viram o mesmo especial e explodem
        const esp = g[outra].especial;
        g.forEach((x, k) => { if (x && x.tipo === tipo && !x.especial) g[k] = { ...x, especial: esp }; });
      }
      casas = [arco, outra];
    } else {
      // dois especiais: as duas linhas e colunas, ou uma explosão maior
      const centro = b;
      const r = linha(centro); const c = coluna(centro);
      casas = [];
      for (let k = 0; k < LADO; k++) {
        for (const d of [-1, 0, 1]) {
          if (r + d >= 0 && r + d < LADO) casas.push((r + d) * LADO + k);
          if (c + d >= 0 && c + d < LADO) casas.push(k * LADO + c + d);
        }
      }
      if (da.especial === 'bomba' && db.especial === 'bomba') casas = area(centro, 2);
      g[a] = { ...g[a], especial: null };
      g[b] = { ...g[b], especial: null };
    }
    const x = aplicar(g, casas, new Set(), alvos);
    cair(g, tipos, aleatorio);
    etapas.push({ removidos: x.removidos, criados: x.criados, grade: copia(g), pontos: x.pontos, quebrados: x.quebrados });
    combo = 2;
  } else if (!grupos(g).length) {
    // a cereja pode ser trocada com qualquer vizinho, mesmo sem formar trinca
    if (!da.cereja && !db.cereja) return null;
    etapas.push({ removidos: [], criados: [], grade: copia(g), pontos: 0 });
  }

  return depoisDaJogada(continuar(g, etapas, combo, tipos, aleatorio, a, b), tipos, aleatorio, regras);
}

// Casas num quadrado em volta de i (raio 1 = 3×3).
function area(i, raio) {
  const r = linha(i); const c = coluna(i); const out = [];
  for (let dr = -raio; dr <= raio; dr++) for (let dc = -raio; dc <= raio; dc++) {
    if (r + dr >= 0 && r + dr < LADO && c + dc >= 0 && c + dc < LADO) out.push((r + dr) * LADO + c + dc);
  }
  return out;
}

// Depois de uma jogada (só nas trocas, não nos bônus): o chocolate cresce se nenhum foi quebrado, e
// aparece cereja nova lá em cima se a fase ainda pedir.
function depoisDaJogada(r, tipos, aleatorio, regras) {
  let g = r.grade;
  const extra = [];
  const choc = obstaculos(g).chocolate;
  if (choc > 0 && r.quebrados.chocolate === 0 && choc < MAX_CHOCOLATE) {
    const k = espalharChocolate(g, aleatorio);
    if (k >= 0) {
      const velho = g[k].id; g = copia(g); g[k] = novoChocolate();
      extra.push({ removidos: [velho], criados: [g[k].id], grade: copia(g), pontos: 0, espalhou: k });
    }
  }
  const faltam = (regras.cerejas ?? 0) - r.coletadas;
  if (cerejasNaMesa(g) < Math.min(2, faltam)) {
    const topo = Array.from({ length: LADO }, (_, c) => c).filter((c) => livre(g[c]));
    if (topo.length) {
      const k = topo[Math.floor(aleatorio() * topo.length)];
      const velho = g[k].id; g = copia(g); g[k] = novaCereja();
      extra.push({ removidos: [velho], criados: [g[k].id], grade: copia(g), pontos: 0, cereja: k });
    }
  }
  if (!extra.length) return r;
  if (!encontrarJogada(g)) { g = embaralhar(g, aleatorio); extra.push({ removidos: [], criados: [], grade: copia(g), pontos: 0, embaralhou: true }); }
  return resumir([...r.etapas, ...extra], g);
}

// Casa (com um doce comum) para onde o chocolate cresce, ou -1.
export function espalharChocolate(g, aleatorio = Math.random) {
  const opcoes = [];
  g.forEach((d, i) => { if (d?.chocolate) for (const k of ao_lado(i)) if (livre(g[k]) && !opcoes.includes(k)) opcoes.push(k); });
  return opcoes.length ? opcoes[Math.floor(aleatorio() * opcoes.length)] : -1;
}

const resumir = (etapas, g) => ({
  etapas, grade: g,
  pontos: etapas.reduce((t, e) => t + e.pontos, 0),
  coletadas: etapas.reduce((t, e) => t + (e.coletadas ?? 0), 0),
  quebrados: somaQuebrados(etapas.map((e) => e.quebrados)),
});

// Depois de uma jogada ou de um bônus: cerejas que chegaram no chão saem, cascatas (o que cai e forma
// novas sequências), e embaralha se acabarem as jogadas. a e b são as casas da troca, onde nascem os
// doces especiais.
function continuar(g, etapas, combo, tipos, aleatorio, a = -1, b = -1) {
  let daTroca = etapas.length === 0;
  for (;;) {
    const chao = [];
    for (let c = 0; c < LADO; c++) if (g[(LADO - 1) * LADO + c]?.cereja) chao.push((LADO - 1) * LADO + c);
    if (chao.length) {
      const removidos = chao.map((i) => g[i].id);
      chao.forEach((i) => { g[i] = null; });
      cair(g, tipos, aleatorio);
      etapas.push({ removidos, criados: [], grade: copia(g), pontos: chao.length * PONTOS_CEREJA, coletadas: chao.length });
      continue;
    }
    const gs = grupos(g);
    if (!gs.length) break;
    const preservar = new Set();
    const novos = [];
    const casas = new Set();
    for (const gr of gs) {
      gr.casas.forEach((i) => casas.add(i));
      const esp = especialDoGrupo(gr);
      const soltas = gr.casas.filter((i) => !preso(g[i]));
      if (!esp || !soltas.length) continue;
      const lugar = (daTroca ? soltas.find((i) => i === a || i === b) : undefined) ?? soltas[Math.floor(soltas.length / 2)];
      novos.push({ lugar, tipo: g[lugar].tipo, especial: esp });
      preservar.add(lugar);
    }
    daTroca = false;
    const x = aplicar(g, [...casas], preservar);
    const criados = [...x.criados];
    for (const n of novos) {
      const d = novoDoce(n.tipo, n.especial);
      if (n.especial === 'arcoiris') d.tipo = -1;
      if (g[n.lugar]) x.removidos.push(g[n.lugar].id);
      g[n.lugar] = d;
      criados.push(d.id);
    }
    cair(g, tipos, aleatorio);
    etapas.push({ removidos: x.removidos, criados, grade: copia(g), pontos: (x.saiu + novos.length) * PONTOS_POR_DOCE * combo + pontosQuebrados(x.quebrados), quebrados: x.quebrados });
    combo++;
  }

  if (!encontrarJogada(g)) {
    g = embaralhar(g, aleatorio);
    etapas.push({ removidos: [], criados: [], grade: copia(g), pontos: 0, embaralhou: true });
  }
  return resumir(etapas, g);
}

// Uma troca que forma algo, ou null. Usada pela dica do robô e para saber se há jogada. Sem trinca
// possível, comCereja aceita mover uma cereja (que troca sem formar nada), de preferência para baixo.
export function encontrarJogada(g, comCereja = false) {
  for (let i = 0; i < LADO * LADO; i++) {
    for (const j of [i + 1, i + LADO]) {
      if (j >= LADO * LADO || !vizinhas(i, j) || preso(g[i]) || preso(g[j])) continue;
      if (g[i].especial === 'arcoiris' || g[j].especial === 'arcoiris' || (g[i].especial && g[j].especial)) return [i, j];
      const t = g.slice();
      [t[i], t[j]] = [t[j], t[i]];
      if (sequencias(t).length) return [i, j];
    }
  }
  if (comCereja) {
    for (let i = LADO * LADO - 1; i >= 0; i--) {
      if (!g[i]?.cereja) continue;
      for (const j of [i + LADO, i - 1, i + 1]) if (j < LADO * LADO && vizinhas(i, j) && !preso(g[j])) return [i, j];
    }
  }
  return null;
}

export function embaralhar(g, aleatorio = Math.random) {
  for (let tentativa = 0; ; tentativa++) {
    const n = g.slice();
    for (let k = n.length - 1; k > 0; k--) {
      const j = Math.floor(aleatorio() * (k + 1));
      [n[k], n[j]] = [n[j], n[k]];
    }
    const cerejaNoChao = n.slice(LADO * (LADO - 1)).some((d) => d?.cereja);
    if ((!sequencias(n).length && !cerejaNoChao && encontrarJogada(n)) || tentativa > 3000) return n;
  }
}

// Fases: a meta de pontos sobe aos poucos e os movimentos caem devagar. A partir da fase 3 aparecem
// obstáculos que também precisam ser quebrados: doces congelados, pedras, ou os dois. Da fase 61 em
// diante, cada lugar novo traz um obstáculo novo (veja faseNova).
export function fase(n) {
  if (n > 60) return faseNova(n);
  const base = {
    nivel: n,
    meta: 1800 + (n - 1) * 450,
    movimentos: Math.max(15, 22 - Math.floor((n - 1) / 4)),
    tipos: cores(n),
    gelo: 0, pedra: 0, forte: 0, corrente: 0, chocolate: 0, caixa: 0, caixaCamadas: 0, cerejas: 0,
  };
  if (n < 3) return base;
  const quantos = Math.min(14, 4 + Math.floor((n - 3) * 0.8));
  const tipo = (n - 3) % 3; // 0 gelo, 1 pedra, 2 os dois
  if (tipo === 0) base.gelo = quantos;
  else if (tipo === 1) base.pedra = Math.max(3, quantos - 2);
  else { base.gelo = Math.ceil(quantos / 2); base.pedra = Math.max(2, Math.floor(quantos / 2) - 1); }
  base.forte = n >= 8 ? Math.min(6, Math.floor((n - 6) / 2)) : 0; // quantos aguentam duas batidas
  base.movimentos += Math.ceil((base.gelo + base.pedra * 1.5) / 4); // obstáculo pede mais jogadas
  return base;
}

// O obstáculo que cada lugar novo apresenta (Praia, Vulcão, Nuvens, Galáxia).
export const OBSTACULO_DO_LUGAR = ['corrente', 'chocolate', 'cerejas', 'caixa'];
// Movimentos de cada fase de 61 a 120, calibrados por simulação com o robô guloso (o mesmo dos testes,
// que escolhe a troca que mais pontua e quebra obstáculos, de preferência perto deles): ele vence ~85%
// das vezes na fase 61, caindo devagar até ~35–40% na 120. O teste jogos-docinhos-fases confere.
const MOVIMENTOS_NOVOS = [
  22, 23, 27, 24, 27, 29, 26, 32, 32, 30, 32, 29, 26, 32, 36, // Praia de Caramelo
  18, 19, 21, 18, 21, 21, 21, 23, 23, 20, 26, 25, 20, 26, 31, // Vulcão de Chocolate
  14, 14, 22, 14, 23, 21, 20, 28, 22, 17, 31, 39, 24, 28, 38, // Nuvens de Algodão-doce
  14, 20, 18, 22, 17, 18, 20, 19, 18, 18, 19, 18, 16, 21, 19, // Galáxia de Jujuba
];
const metaNova = (movimentos, n) => Math.round((movimentos * (300 + ((n - 61) / 59) * 120)) / 50) * 50;

// Fases 61 a 120: quatro lugares de 15 fases. A primeira fase de cada lugar mostra só a novidade; nas
// outras, ela aparece junto com um obstáculo de antes (e a 15ª, a fase chefe, com dois). A meta de
// pontos é mais baixa que no fim do Castelo de Uva: o desafio está nos obstáculos.
function faseNova(n) {
  const lugar = Math.min(3, Math.floor((n - 61) / 15));
  const k = (n - 61) % 15; // 14 = fase chefe
  const sobe = k / 14; // 0..1 dentro do lugar
  const f = { nivel: n, meta: 0, movimentos: 0, tipos: 6, gelo: 0, pedra: 0, forte: 0, corrente: 0, chocolate: 0, caixa: 0, caixaCamadas: 0, cerejas: 0, chefe: k === 14 };
  if (lugar === 0) f.corrente = Math.round(3 + sobe * 4);
  if (lugar === 1) f.chocolate = Math.round(3 + sobe * 4);
  if (lugar === 2) f.cerejas = 2 + Math.round(sobe * 2);
  if (lugar === 3) { f.caixa = Math.round(8 + sobe * 6); f.caixaCamadas = k >= 1 ? 3 : 2; }
  const anteriores = ['gelo', 'pedra', ...OBSTACULO_DO_LUGAR.slice(0, lugar)];
  const quanto = {
    gelo: () => { f.gelo += Math.round(5 + sobe * 4); f.forte = Math.max(f.forte, Math.round(sobe * 4)); },
    pedra: () => { f.pedra += Math.round(3 + sobe * 3); f.forte = Math.max(f.forte, Math.round(sobe * 3)); },
    corrente: () => { f.corrente += Math.round(3 + sobe * 2); },
    chocolate: () => { f.chocolate += 2 + Math.round(sobe); },
    cerejas: () => { f.cerejas += 1; },
  };
  const misturas = k === 0 ? 0 : f.chefe ? 2 : k % 3 === 0 && lugar < 3 ? 0 : 1;
  for (let m = 0; m < misturas; m++) quanto[anteriores[(k + lugar * 2 + m * 3) % anteriores.length]]();
  f.movimentos = MOVIMENTOS_NOVOS[n - 61];
  f.meta = metaNova(f.movimentos, n);
  return f;
}

// Coloca os obstáculos da fase numa grade nova, deixando sempre uma jogada possível.
export function comObstaculos(grade, f, aleatorio = Math.random) {
  if (!f.gelo && !f.pedra && !f.corrente && !f.chocolate && !f.caixa && !f.cerejas) return grade;
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const g = copia(grade);
    const casas = Array.from({ length: LADO * LADO }, (_, i) => i).sort(() => aleatorio() - 0.5);
    let fortes = f.forte;
    // pedras ficam da metade de baixo para cima (longe das duas linhas de cima, por onde os doces chegam)
    const paraPedra = casas.filter((i) => linha(i) >= 2);
    for (let k = 0; k < f.pedra; k++) g[paraPedra[k]] = novaPedra(fortes-- > 0 ? 2 : 1);
    // chocolate: uma mancha só, perto do chão
    if (f.chocolate) {
      const semente = casas.find((i) => linha(i) >= 5 && !g[i].pedra);
      const perto = casas.filter((i) => linha(i) >= 3 && !g[i].pedra)
        .sort((x, y) => Math.hypot(linha(x) - linha(semente), coluna(x) - coluna(semente)) - Math.hypot(linha(y) - linha(semente), coluna(y) - coluna(semente)));
      for (let k = 0; k < f.chocolate; k++) g[perto[k]] = novoChocolate();
    }
    // caixas de presente: cada uma guarda um especial
    const paraCaixa = casas.filter((i) => linha(i) >= 2 && livre(g[i]));
    for (let k = 0; k < f.caixa; k++) g[paraCaixa[k]] = novaCaixa(f.caixaCamadas || 2, ['linha', 'coluna', 'bomba'][k % 3], sortear(f.tipos, aleatorio));
    // cerejas começam lá em cima (no máximo duas na mesa de cada vez)
    const paraCereja = casas.filter((i) => linha(i) <= 1 && livre(g[i]));
    for (let k = 0; k < Math.min(2, f.cerejas); k++) g[paraCereja[k]] = novaCereja();
    const livres = casas.filter((i) => livre(g[i]));
    const congelar = livres.slice(0, f.gelo);
    const prender = livres.slice(f.gelo, f.gelo + f.corrente);
    for (const i of congelar) g[i] = { ...g[i], gelo: fortes-- > 0 ? 2 : 1 };
    for (const i of prender) g[i] = { ...g[i], corrente: 1 };
    if (encontrarJogada(g) && !sequencias(g).length) return g;
  }
  return grade;
}

// Venceu a fase: fez os pontos, não sobrou nenhum obstáculo e levou as cerejas até o chão.
export const venceu = (pontos, f, g, coletadas = 0) => pontos >= f.meta && obstaculos(g).total === 0 && coletadas >= (f.cerejas ?? 0);

// Faixa "Novidade!" na primeira fase em que cada obstáculo aparece.
export const NOVIDADES = {
  3: { id: 'gelo', icone: '🧊', nome: 'Doce congelado', texto: 'Ele não sai do lugar. Faça trinca com ele ou estoure um doce ao lado para quebrar o gelo.' },
  4: { id: 'pedra', icone: '🪨', nome: 'Pedra', texto: 'A pedra não forma trinca. Estoure doces ao lado dela para quebrar.' },
  61: { id: 'corrente', icone: '⛓️', nome: 'Corrente de alcaçuz', texto: 'O doce preso não pode ser trocado, mas ainda forma trinca. Faça uma trinca com ele para soltar a corrente!' },
  76: { id: 'chocolate', icone: '🍫', nome: 'Chocolate que se espalha', texto: 'Estoure doces ao lado do chocolate para derreter. Cuidado: se numa jogada nenhum chocolate quebrar, ele cresce para o lado!' },
  91: { id: 'cerejas', icone: '🍒', nome: 'Cerejas até o chão', texto: 'A cereja troca de lugar com qualquer vizinho, mesmo sem trinca, e desce quando os doces de baixo estouram. Leve até a fileira de baixo!' },
  106: { id: 'caixa', icone: '🎀', nome: 'Caixa de presente', texto: 'Estoure doces ao lado da caixa: ela aguenta 2 ou 3 batidas e, quando abre, solta um doce especial!' },
};
export const novidade = (n) => NOVIDADES[n] ?? null;

export function estrelas(pontos, meta) {
  if (pontos >= meta * 2) return 3;
  if (pontos >= meta * 1.5) return 2;
  if (pontos >= meta) return 1;
  return 0;
}

// ---------- Bônus (usados quando a pessoa quiser; não gastam movimento) ----------
export const BONUS = [
  { id: 'martelo', icone: '🔨', nome: 'Martelo', texto: 'Toque num doce para quebrar só ele.' },
  { id: 'troca', icone: '🔄', nome: 'Troca livre', texto: 'Troque dois doces vizinhos, mesmo sem formar trinca.' },
  { id: 'vassoura', icone: '🧹', nome: 'Vassoura', texto: 'Toque numa linha para limpar ela inteira.' },
  { id: 'arcoiris', icone: '🌈', nome: 'Arco-íris', texto: 'Toque num doce para virar um doce arco-íris.' },
  { id: 'mistura', icone: '🔀', nome: 'Misturar', texto: 'Mistura todos os doces da mesa.' },
  { id: 'mais5', icone: '➕', nome: '+5 movimentos', curto: '5 a mais', texto: 'Ganha 5 movimentos a mais nesta fase.' },
  { id: 'bomba', icone: '💣', nome: 'Bomba', texto: 'Toque num doce para estourar tudo em volta dele (3 × 3).' },
  { id: 'foguete', icone: '🚀', nome: 'Foguete', texto: 'Toque num doce para limpar a linha e a coluna dele.' },
  { id: 'listrado', icone: '🍭', nome: 'Listrado', texto: 'Toque num doce para ele virar listrado.' },
  { id: 'descongelar', icone: '❄️', nome: 'Descongelar', texto: 'Derrete uma camada de todo o gelo, solta as correntes e derrete até 3 chocolates.' },
  { id: 'pincel', icone: '🎨', nome: 'Pincel', texto: 'Toque num doce e depois numa cor: todos os doces daquela cor mudam.' },
  { id: 'presente', icone: '🎁', nome: 'Presente', texto: 'Espalha 3 doces especiais pela mesa.' },
];
export const BONUS_INICIAL = 3; // de cada bônus, para quem está começando
export const BONUS_NOVOS = ['bomba', 'foguete', 'listrado', 'descongelar', 'pincel', 'presente'];
export const BONUS_NOVOS_INICIAL = 2; // de cada bônus novo, para quem já jogava antes deles

// Estoque de bônus guardado (prefs.bonusDocinhos). Quem nunca jogou ganha 3 de cada; quem já tinha
// o estoque antigo (só os seis primeiros) mantém o que tem e ganha 2 de cada bônus novo. Devolve o
// mesmo objeto quando não há nada para acertar.
export function estoqueBonus(salvo) {
  const novo = !salvo || typeof salvo !== 'object';
  const valido = (v) => Number.isInteger(v) && v >= 0;
  if (!novo && BONUS.every((b) => valido(salvo[b.id]))) return salvo;
  const out = novo ? {} : { ...salvo };
  for (const b of BONUS) {
    if (valido(out[b.id])) continue;
    out[b.id] = !novo && BONUS_NOVOS.includes(b.id) && out[b.id] === undefined ? BONUS_NOVOS_INICIAL : novo || out[b.id] === undefined ? BONUS_INICIAL : 0;
  }
  return out;
}

// Prêmio por vencer: um bônus sorteado por estrela, entre todos (o +5 movimentos vem menos).
export function sortearPremio(estrelas, aleatorio = Math.random) {
  const pesos = BONUS.map((b) => (b.id === 'mais5' ? 0.5 : 1));
  const total = pesos.reduce((t, p) => t + p, 0);
  return Array.from({ length: estrelas }, () => {
    let x = aleatorio() * total;
    for (let k = 0; k < BONUS.length; k++) { x -= pesos[k]; if (x < 0) return BONUS[k]; }
    return BONUS[BONUS.length - 1];
  });
}

// Remove as casas (acionando os especiais atingidos) e segue com as cascatas. Devolve null se nada
// mudou (por exemplo, o martelo numa cereja).
function remover(grade, casas, tipos, aleatorio) {
  const g = copia(grade);
  const x = aplicar(g, casas);
  if (!x.removidos.length && !Object.values(x.quebrados).some(Boolean)) return null;
  cair(g, tipos, aleatorio);
  const etapas = [{ removidos: x.removidos, criados: x.criados, grade: copia(g), pontos: x.pontos, quebrados: x.quebrados }];
  return continuar(g, etapas, 2, tipos, aleatorio);
}

const linhaDe = (i) => Array.from({ length: LADO }, (_, k) => linha(i) * LADO + k);
const colunaDe = (i) => Array.from({ length: LADO }, (_, k) => k * LADO + coluna(i));
export const martelo = (grade, i, tipos = 6, aleatorio = Math.random) => remover(grade, [i], tipos, aleatorio);
export const vassoura = (grade, i, tipos = 6, aleatorio = Math.random) => remover(grade, linhaDe(i), tipos, aleatorio);
// Bomba: estoura o quadrado 3 × 3 em volta da casa tocada.
export const explodir = (grade, i, tipos = 6, aleatorio = Math.random) => remover(grade, area(i, 1), tipos, aleatorio);
// Foguete em cruz: a linha e a coluna da casa tocada.
export const foguete = (grade, i, tipos = 6, aleatorio = Math.random) => remover(grade, [...new Set([...linhaDe(i), ...colunaDe(i)])], tipos, aleatorio);

// Troca livre: troca dois vizinhos; se formar algo, as cascatas acontecem como numa troca normal.
export function trocaLivre(grade, a, b, tipos = 6, aleatorio = Math.random) {
  if (!vizinhas(a, b) || preso(grade[a]) || preso(grade[b])) return null;
  const normal = trocar(grade, a, b, tipos, aleatorio);
  if (normal) return normal;
  const g = copia(grade);
  [g[a], g[b]] = [g[b], g[a]];
  // a cereja pode ter chegado no chão
  return continuar(g, [{ removidos: [], criados: [], grade: copia(g), pontos: 0 }], 1, tipos, aleatorio);
}

// Arco-íris: o doce tocado vira um arco-íris, pronto para ser trocado com qualquer cor.
export function virarArcoiris(grade, i) {
  if (!grade[i] || grade[i].tipo < 0 || grade[i].especial === 'arcoiris' || preso(grade[i])) return null;
  const g = copia(grade);
  g[i] = { ...novoDoce(-1, 'arcoiris') };
  return g;
}

// Listrado: o doce tocado vira listrado (na linha ou na coluna, sorteado). Vale para doce congelado
// ou acorrentado também (o especial dispara quando ele estourar).
export function virarListrado(grade, i, aleatorio = Math.random) {
  const d = grade[i];
  if (!d || d.tipo < 0 || d.especial) return null;
  const g = copia(grade);
  g[i] = { ...novoDoce(d.tipo, aleatorio() < 0.5 ? 'linha' : 'coluna'), gelo: d.gelo, corrente: d.corrente };
  if (!g[i].gelo) delete g[i].gelo;
  if (!g[i].corrente) delete g[i].corrente;
  return g;
}

// Descongelar: derrete uma camada de todo o gelo, solta uma camada das correntes de alcaçuz e derrete
// até 3 chocolates (os de cima primeiro). Devolve null se não há nada para derreter.
export function descongelar(grade, tipos = 6, aleatorio = Math.random) {
  const g = copia(grade);
  const q = { gelo: 0, pedra: 0, corrente: 0, chocolate: 0, caixa: 0 };
  const derreteu = [];
  g.forEach((d, i) => {
    if (d?.gelo > 0) { g[i] = { ...d, gelo: d.gelo - 1 }; q.gelo++; derreteu.push(i); }
    else if (d?.corrente > 0) { g[i] = { ...d, corrente: d.corrente - 1 }; q.corrente++; derreteu.push(i); }
  });
  const chocolates = g.map((d, i) => (d?.chocolate ? i : -1)).filter((i) => i >= 0).slice(0, 3);
  const removidos = chocolates.map((i) => g[i].id);
  for (const i of chocolates) { g[i] = null; q.chocolate++; derreteu.push(i); }
  if (!derreteu.length) return null;
  cair(g, tipos, aleatorio);
  const etapas = [{ removidos, criados: [], grade: copia(g), pontos: pontosQuebrados(q), quebrados: q, derreteu }];
  return continuar(g, etapas, 2, tipos, aleatorio);
}

// Pincel de cor: todos os doces da cor do doce tocado viram a cor escolhida (os especiais continuam
// especiais). Depois vêm as cascatas. Devolve null se a cor não serve.
export function pincel(grade, i, cor, tipos = 6, aleatorio = Math.random) {
  const de = grade[i]?.tipo;
  if (!(de >= 0) || grade[i].especial === 'arcoiris' || !(cor >= 0 && cor < tipos) || cor === de) return null;
  const g = copia(grade);
  const pintados = [];
  g.forEach((d, k) => { if (d && d.tipo === de && d.especial !== 'arcoiris') { g[k] = { ...d, tipo: cor }; pintados.push(k); } });
  const etapas = [{ removidos: [], criados: [], grade: copia(g), pontos: pintados.length * 20, pintados }];
  return continuar(g, etapas, 2, tipos, aleatorio);
}

// Presente surpresa: 3 doces comuns sorteados viram especiais (listrado ou bomba).
export function presente(grade, aleatorio = Math.random) {
  const opcoes = grade.map((d, i) => (livre(d) ? i : -1)).filter((i) => i >= 0);
  if (!opcoes.length) return null;
  const g = copia(grade);
  const casas = [];
  for (let k = 0; k < 3 && opcoes.length; k++) {
    const i = opcoes.splice(Math.floor(aleatorio() * opcoes.length), 1)[0];
    g[i] = novoDoce(g[i].tipo, ['linha', 'coluna', 'bomba'][Math.floor(aleatorio() * 3)]);
    casas.push(i);
  }
  return { grade: g, casas };
}

// ---------- Mapa das fases ----------
export const TOTAL_FASES = 120;
// O caminho passa por oito lugares, 15 fases cada.
export const REGIOES = [
  { nome: 'Vale do Morango', icone: '🍓', cor: ['#ffd6e4', '#ffb3cc'] },
  { nome: 'Floresta de Menta', icone: '🍃', cor: ['#d4f5dd', '#a9e8bd'] },
  { nome: 'Lago de Mirtilo', icone: '🫐', cor: ['#d6e8ff', '#aecdff'] },
  { nome: 'Castelo de Uva', icone: '🏰', cor: ['#e9dcff', '#cdb5ff'] },
  { nome: 'Praia de Caramelo', icone: '🍯', cor: ['#fff0cf', '#ffd590'] },
  { nome: 'Vulcão de Chocolate', icone: '🌋', cor: ['#f6d3bd', '#e29a72'] },
  { nome: 'Nuvens de Algodão-doce', icone: '☁️', cor: ['#e6f4ff', '#ffd3ee'] },
  { nome: 'Galáxia de Jujuba', icone: '🌌', cor: ['#3b2c86', '#191541'] },
];
export const regiaoDa = (n) => REGIOES[Math.min(REGIOES.length - 1, Math.floor((n - 1) / (TOTAL_FASES / REGIOES.length)))];

// Melhor resultado de cada fase (estrelas e pontos) a partir do histórico, e até onde já foi liberado.
export function progresso(historico) {
  const melhor = {};
  let liberada = 1;
  for (const h of historico) {
    if (h.j !== 'docinhos' || !h.nivel) continue;
    const m = (melhor[h.nivel] ??= { estrelas: 0, pontos: 0, vezes: 0 });
    m.vezes++;
    m.pontos = Math.max(m.pontos, h.pontos ?? 0);
    if (h.r === 'vitoria') { m.estrelas = Math.max(m.estrelas, h.estrelas ?? 1); liberada = Math.max(liberada, h.nivel + 1); }
  }
  liberada = Math.min(TOTAL_FASES, liberada);
  const estrelas = Object.values(melhor).reduce((t, m) => t + m.estrelas, 0);
  return { melhor, liberada, estrelas, maxEstrelas: TOTAL_FASES * 3 };
}
