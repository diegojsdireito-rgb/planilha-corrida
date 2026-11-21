// Docinhos: trocar doces vizinhos para alinhar 3 ou mais iguais.
// Grade 8x8; cada casa guarda { id, tipo: 0..5, especial: null | 'linha' | 'coluna' | 'bomba' | 'arcoiris' }.
// 4 em linha cria um doce listrado, L ou T cria uma bomba, 5 em linha cria o arco-íris.

export const LADO = 8;
export const PONTOS_POR_DOCE = 60;

let proximoId = 1;
const novoDoce = (tipo, especial = null) => ({ id: proximoId++, tipo, especial });
const linha = (i) => Math.floor(i / LADO);
const coluna = (i) => i % LADO;
export const vizinhas = (a, b) => (Math.abs(linha(a) - linha(b)) + Math.abs(coluna(a) - coluna(b))) === 1;

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
  const igual = (a, b) => g[a] && g[b] && g[a].especial !== 'arcoiris' && g[b].especial !== 'arcoiris' && g[a].tipo === g[b].tipo;
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
  g.forEach((x, k) => { if (x && k !== exceto && !x.especial) conta[x.tipo] = (conta[x.tipo] ?? 0) + 1; });
  return Number(Object.entries(conta).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0);
}

// Remove as casas, acionando em cadeia os especiais que forem atingidos.
function estourar(g, casas, preservar = new Set(), alvos = new Map()) {
  const fila = [...casas];
  const removidas = new Set();
  while (fila.length) {
    const i = fila.pop();
    if (removidas.has(i) || preservar.has(i) || !g[i]) continue;
    removidas.add(i);
    if (g[i].especial) for (const k of alcance(g, i, alvos.get(i))) if (!removidas.has(k)) fila.push(k);
  }
  return [...removidas];
}

function cair(g, tipos, aleatorio) {
  for (let c = 0; c < LADO; c++) {
    const coluna_ = [];
    for (let r = LADO - 1; r >= 0; r--) if (g[r * LADO + c]) coluna_.push(g[r * LADO + c]);
    for (let r = LADO - 1, k = 0; r >= 0; r--, k++) g[r * LADO + c] = coluna_[k] ?? novoDoce(sortear(tipos, aleatorio));
  }
}

const copia = (g) => g.map((x) => (x ? { ...x } : null));

// Executa uma troca. Devolve null se ela não forma nada; senão as etapas para animar.
// Cada etapa: { removidos: [ids], criados: [ids], grade, pontos }.
export function trocar(grade, a, b, tipos = 6, aleatorio = Math.random) {
  if (!vizinhas(a, b)) return null;
  let g = copia(grade);
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
      const tipo = g[outra].tipo;
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
      if (da.especial === 'bomba' && db.especial === 'bomba') {
        casas = [];
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
          if (r + dr >= 0 && r + dr < LADO && c + dc >= 0 && c + dc < LADO) casas.push((r + dr) * LADO + c + dc);
        }
      }
      g[a] = { ...g[a], especial: null };
      g[b] = { ...g[b], especial: null };
    }
    const rem = estourar(g, casas, new Set(), alvos);
    const removidos = rem.map((i) => g[i].id);
    rem.forEach((i) => { g[i] = null; });
    cair(g, tipos, aleatorio);
    etapas.push({ removidos, criados: [], grade: copia(g), pontos: rem.length * PONTOS_POR_DOCE });
    combo = 2;
  } else if (!grupos(g).length) {
    return null;
  }

  return continuar(g, etapas, combo, tipos, aleatorio, a, b);
}


// Depois de uma jogada ou de um bônus: cascatas (o que cai e forma novas sequências), e embaralha
// se acabarem as jogadas. a e b são as casas da troca, onde nascem os doces especiais.
function continuar(g, etapas, combo, tipos, aleatorio, a = -1, b = -1) {
  for (;;) {
    const gs = grupos(g);
    if (!gs.length) break;
    const preservar = new Set();
    const novos = [];
    const casas = new Set();
    for (const gr of gs) {
      gr.casas.forEach((i) => casas.add(i));
      const esp = especialDoGrupo(gr);
      if (!esp) continue;
      const lugar = gr.casas.find((i) => (i === a || i === b) && etapas.length === 0) ?? gr.casas[Math.floor(gr.casas.length / 2)];
      novos.push({ lugar, tipo: g[lugar].tipo, especial: esp });
      preservar.add(lugar);
    }
    const rem = estourar(g, [...casas], preservar);
    const removidos = rem.map((i) => g[i].id);
    rem.forEach((i) => { g[i] = null; });
    const criados = [];
    for (const n of novos) {
      const d = novoDoce(n.tipo, n.especial);
      if (n.especial === 'arcoiris') d.tipo = -1;
      if (g[n.lugar]) removidos.push(g[n.lugar].id);
      g[n.lugar] = d;
      criados.push(d.id);
    }
    cair(g, tipos, aleatorio);
    etapas.push({ removidos, criados, grade: copia(g), pontos: (rem.length + novos.length) * PONTOS_POR_DOCE * combo });
    combo++;
  }

  if (!encontrarJogada(g)) {
    g = embaralhar(g, aleatorio);
    etapas.push({ removidos: [], criados: [], grade: copia(g), pontos: 0, embaralhou: true });
  }
  return { etapas, grade: g, pontos: etapas.reduce((t, e) => t + e.pontos, 0) };
}

// Uma troca que forma algo, ou null. Usada pela dica do robô e para saber se há jogada.
export function encontrarJogada(g) {
  for (let i = 0; i < LADO * LADO; i++) {
    for (const j of [i + 1, i + LADO]) {
      if (j >= LADO * LADO || !vizinhas(i, j)) continue;
      if (g[i].especial === 'arcoiris' || g[j].especial === 'arcoiris' || (g[i].especial && g[j].especial)) return [i, j];
      const t = g.slice();
      [t[i], t[j]] = [t[j], t[i]];
      if (sequencias(t).length) return [i, j];
    }
  }
  return null;
}

export function embaralhar(g, aleatorio = Math.random) {
  for (;;) {
    const n = g.slice();
    for (let k = n.length - 1; k > 0; k--) {
      const j = Math.floor(aleatorio() * (k + 1));
      [n[k], n[j]] = [n[j], n[k]];
    }
    if (!sequencias(n).length && encontrarJogada(n)) return n;
  }
}

// Fases: a meta sobe aos poucos; os movimentos caem devagar.
export function fase(n) {
  return {
    nivel: n,
    meta: 1800 + (n - 1) * 450,
    movimentos: Math.max(15, 22 - Math.floor((n - 1) / 4)),
    tipos: cores(n),
  };
}

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
  { id: 'mais5', icone: '➕', nome: '+5 movimentos', texto: 'Ganha 5 movimentos a mais nesta fase.' },
];
export const BONUS_INICIAL = 3; // de cada bônus, para quem está começando

// Remove as casas (acionando os especiais atingidos) e segue com as cascatas.
function remover(grade, casas, tipos, aleatorio) {
  const g = copia(grade);
  const rem = estourar(g, casas);
  const removidos = rem.map((i) => g[i].id);
  rem.forEach((i) => { g[i] = null; });
  cair(g, tipos, aleatorio);
  const etapas = [{ removidos, criados: [], grade: copia(g), pontos: rem.length * PONTOS_POR_DOCE }];
  return continuar(g, etapas, 2, tipos, aleatorio);
}

export const martelo = (grade, i, tipos = 6, aleatorio = Math.random) => remover(grade, [i], tipos, aleatorio);
export const vassoura = (grade, i, tipos = 6, aleatorio = Math.random) => remover(grade, Array.from({ length: LADO }, (_, k) => linha(i) * LADO + k), tipos, aleatorio);

// Troca livre: troca dois vizinhos; se formar algo, as cascatas acontecem como numa troca normal.
export function trocaLivre(grade, a, b, tipos = 6, aleatorio = Math.random) {
  if (!vizinhas(a, b)) return null;
  const normal = trocar(grade, a, b, tipos, aleatorio);
  if (normal) return normal;
  let g = copia(grade);
  [g[a], g[b]] = [g[b], g[a]];
  const etapas = [{ removidos: [], criados: [], grade: copia(g), pontos: 0 }];
  if (!encontrarJogada(g)) { g = embaralhar(g, aleatorio); etapas.push({ removidos: [], criados: [], grade: copia(g), pontos: 0, embaralhou: true }); }
  return { etapas, grade: g, pontos: 0 };
}

// Arco-íris: o doce tocado vira um arco-íris, pronto para ser trocado com qualquer cor.
export function virarArcoiris(grade, i) {
  const g = copia(grade);
  g[i] = { ...novoDoce(-1, 'arcoiris') };
  return g;
}
