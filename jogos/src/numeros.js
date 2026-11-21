// Lógica do Junta Números (estilo 2048): blocos que deslizam e se somam.
// Cada bloco tem um id para a tela animar o caminho dele.

export const NIVEIS = {
  facil: { n: 5, meta: 2048 },
  medio: { n: 4, meta: 2048 },
  dificil: { n: 3, meta: 512 },
};

export const DIRECOES = { esquerda: [0, -1], direita: [0, 1], cima: [-1, 0], baixo: [1, 0] };

export function vazias(j) {
  const ocupadas = new Set(j.blocos.map((b) => b.r * j.n + b.c));
  const livres = [];
  for (let i = 0; i < j.n * j.n; i++) if (!ocupadas.has(i)) livres.push([Math.floor(i / j.n), i % j.n]);
  return livres;
}

/** Põe um bloco 2 (90%) ou 4 (10%) numa casa vazia. */
export function surgir(j, rng = Math.random) {
  const livres = vazias(j);
  if (!livres.length) return null;
  const [r, c] = livres[Math.floor(rng() * livres.length)];
  const b = { id: j.proximo++, v: rng() < 0.9 ? 2 : 4, r, c };
  j.blocos.push(b);
  return b;
}

export function novoJogo(nivel = 'medio', rng = Math.random) {
  const cfg = NIVEIS[nivel] ?? NIVEIS.medio;
  const j = { nivel, n: cfg.n, meta: cfg.meta, blocos: [], pontos: 0, proximo: 1, ganhou: false, jogadas: 0, tempo: 0 };
  surgir(j, rng); surgir(j, rng);
  return j;
}

/**
 * Desliza todos os blocos para um lado. Devolve null se nada mexeu; senão
 * { movidos: [{ id, r, c }], juntados: [{ id, v, r, c, de: [idA, idB] }], pontos, novo }.
 */
export function mover(j, direcao, rng = Math.random) {
  const [dr, dc] = DIRECOES[direcao];
  const n = j.n;
  const grade = Array.from({ length: n }, () => Array(n).fill(null));
  for (const b of j.blocos) grade[b.r][b.c] = b;
  const movidos = []; const juntados = []; const novos = [];
  let ganho = 0; let mexeu = false;
  for (let linha = 0; linha < n; linha++) {
    // As casas da linha, começando pela que fica do lado para onde tudo vai.
    const casas = [];
    for (let k = 0; k < n; k++) {
      const p = dc === 1 || dr === 1 ? n - 1 - k : k;
      casas.push(dr === 0 ? [linha, p] : [p, linha]);
    }
    const fila = casas.map(([r, c]) => grade[r][c]).filter(Boolean);
    let alvo = 0;
    for (let i = 0; i < fila.length; i++) {
      const [r, c] = casas[alvo];
      const a = fila[i]; const b = fila[i + 1];
      if (b && b.v === a.v) {
        const v = a.v * 2;
        const novo = { id: j.proximo++, v, r, c };
        movidos.push({ id: a.id, r, c }, { id: b.id, r, c });
        juntados.push({ ...novo, de: [a.id, b.id] });
        novos.push(novo);
        ganho += v; mexeu = true; i++;
      } else {
        if (a.r !== r || a.c !== c) mexeu = true;
        movidos.push({ id: a.id, r, c });
        novos.push({ id: a.id, v: a.v, r, c });
      }
      alvo++;
    }
  }
  if (!mexeu) return null;
  j.blocos = novos;
  j.pontos += ganho;
  j.jogadas++;
  const novo = surgir(j, rng);
  return { movidos, juntados, pontos: ganho, novo };
}

export const maior = (j) => j.blocos.reduce((m, b) => Math.max(m, b.v), 0);
export const chegouNaMeta = (j) => maior(j) >= j.meta;

export function podeMover(j) {
  if (vazias(j).length) return true;
  const g = Array.from({ length: j.n }, () => Array(j.n).fill(0));
  for (const b of j.blocos) g[b.r][b.c] = b.v;
  for (let r = 0; r < j.n; r++) for (let c = 0; c < j.n; c++) {
    if (c + 1 < j.n && g[r][c] === g[r][c + 1]) return true;
    if (r + 1 < j.n && g[r][c] === g[r + 1][c]) return true;
  }
  return false;
}
