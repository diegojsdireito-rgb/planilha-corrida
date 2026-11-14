// Xadrez completo: roque, en passant, promoção, xeque-mate, afogamento,
// regra dos 50 lances, material insuficiente e repetição tripla.
// Casa = linha * 8 + coluna; linha 0 é a 8ª fileira (pretas). Maiúsculas são brancas (a pessoa).

const CAVALO = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const RETO = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const TODAS = [...DIAG, ...RETO];
const dentro = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

export const corDe = (p) => (!p ? '' : p === p.toUpperCase() ? 'w' : 'b');
const outra = (cor) => (cor === 'w' ? 'b' : 'w');

export function novo() {
  const fila = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const t = Array(64).fill('');
  for (let c = 0; c < 8; c++) {
    t[c] = fila[c];
    t[8 + c] = 'p';
    t[48 + c] = 'P';
    t[56 + c] = fila[c].toUpperCase();
  }
  return { t, vez: 'w', roque: 'KQkq', ep: -1, meio: 0, num: 1 };
}

export function atacada(t, i, por) {
  const r = i >> 3; const c = i & 7;
  const w = por === 'w';
  const peao = w ? 'P' : 'p';
  const pr = w ? r + 1 : r - 1;
  for (const dc of [-1, 1]) if (dentro(pr, c + dc) && t[pr * 8 + c + dc] === peao) return true;
  const cav = w ? 'N' : 'n';
  for (const [dr, dc] of CAVALO) if (dentro(r + dr, c + dc) && t[(r + dr) * 8 + c + dc] === cav) return true;
  const rei = w ? 'K' : 'k';
  for (const [dr, dc] of TODAS) if (dentro(r + dr, c + dc) && t[(r + dr) * 8 + c + dc] === rei) return true;
  const raio = (dirs, tipos) => {
    for (const [dr, dc] of dirs) {
      let rr = r + dr; let cc = c + dc;
      while (dentro(rr, cc)) {
        const p = t[rr * 8 + cc];
        if (p) {
          if (corDe(p) === por && tipos.includes(p.toLowerCase())) return true;
          break;
        }
        rr += dr; cc += dc;
      }
    }
    return false;
  };
  return raio(DIAG, 'bq') || raio(RETO, 'rq');
}

export const reiDe = (t, cor) => t.indexOf(cor === 'w' ? 'K' : 'k');
export const emXeque = (s, cor = s.vez) => atacada(s.t, reiDe(s.t, cor), outra(cor));

function pseudo(s) {
  const { t, vez } = s;
  const ms = [];
  const w = vez === 'w';
  for (let i = 0; i < 64; i++) {
    const p = t[i];
    if (!p || corDe(p) !== vez) continue;
    const r = i >> 3; const c = i & 7;
    const tipo = p.toLowerCase();
    const add = (para, extra = {}) => ms.push({ de: i, para, ...extra });
    if (tipo === 'p') {
      const dir = w ? -1 : 1;
      const ultima = w ? 0 : 7;
      const addPeao = (para, extra = {}) => {
        if (para >> 3 === ultima) for (const promo of ['q', 'r', 'b', 'n']) add(para, { ...extra, promo });
        else add(para, extra);
      };
      const r1 = r + dir;
      if (dentro(r1, c) && !t[r1 * 8 + c]) {
        addPeao(r1 * 8 + c);
        const r2 = r + 2 * dir;
        if (r === (w ? 6 : 1) && !t[r2 * 8 + c]) add(r2 * 8 + c, { duplo: true });
      }
      for (const dc of [-1, 1]) {
        if (!dentro(r1, c + dc)) continue;
        const alvo = r1 * 8 + c + dc;
        if (t[alvo] && corDe(t[alvo]) !== vez) addPeao(alvo);
        else if (alvo === s.ep) add(alvo, { ep: true });
      }
    } else if (tipo === 'n' || tipo === 'k') {
      for (const [dr, dc] of tipo === 'n' ? CAVALO : TODAS) {
        if (!dentro(r + dr, c + dc)) continue;
        const alvo = (r + dr) * 8 + c + dc;
        if (corDe(t[alvo]) !== vez) add(alvo);
      }
      if (tipo === 'k') {
        const base = w ? 60 : 4;
        const o = outra(vez);
        if (i === base && !atacada(t, base, o)) {
          const [K, Q, torre] = w ? ['K', 'Q', 'R'] : ['k', 'q', 'r'];
          if (s.roque.includes(K) && !t[base + 1] && !t[base + 2] && t[base + 3] === torre
            && !atacada(t, base + 1, o) && !atacada(t, base + 2, o)) add(base + 2, { roque: 'curto' });
          if (s.roque.includes(Q) && !t[base - 1] && !t[base - 2] && !t[base - 3] && t[base - 4] === torre
            && !atacada(t, base - 1, o) && !atacada(t, base - 2, o)) add(base - 2, { roque: 'longo' });
        }
      }
    } else {
      const dirs = tipo === 'b' ? DIAG : tipo === 'r' ? RETO : TODAS;
      for (const [dr, dc] of dirs) {
        let rr = r + dr; let cc = c + dc;
        while (dentro(rr, cc)) {
          const alvo = rr * 8 + cc;
          if (t[alvo]) { if (corDe(t[alvo]) !== vez) add(alvo); break; }
          add(alvo);
          rr += dr; cc += dc;
        }
      }
    }
  }
  return ms;
}

export function aplicar(s, m) {
  const t = s.t.slice();
  const p = t[m.de];
  const w = s.vez === 'w';
  const capturada = m.ep ? t[(m.de & ~7) | (m.para & 7)] : t[m.para];
  t[m.para] = m.promo ? (w ? m.promo.toUpperCase() : m.promo) : p;
  t[m.de] = '';
  if (m.ep) t[(m.de & ~7) | (m.para & 7)] = '';
  if (m.roque === 'curto') { t[m.de + 1] = t[m.de + 3]; t[m.de + 3] = ''; }
  if (m.roque === 'longo') { t[m.de - 1] = t[m.de - 4]; t[m.de - 4] = ''; }
  let roque = s.roque;
  const tira = (letras) => { for (const l of letras) roque = roque.replace(l, ''); };
  if (p === 'K') tira('KQ');
  if (p === 'k') tira('kq');
  for (const i of [m.de, m.para]) {
    if (i === 63) tira('K');
    if (i === 56) tira('Q');
    if (i === 7) tira('k');
    if (i === 0) tira('q');
  }
  return {
    t,
    vez: outra(s.vez),
    roque,
    ep: m.duplo ? (m.de + m.para) / 2 : -1,
    meio: p.toLowerCase() === 'p' || capturada ? 0 : s.meio + 1,
    num: s.num + (w ? 0 : 1),
  };
}

export function legais(s) {
  return pseudo(s).filter((m) => {
    const n = aplicar(s, m);
    return !atacada(n.t, reiDe(n.t, s.vez), n.vez);
  });
}

export const chave = (s) => `${s.t.map((p) => p || '.').join('')}${s.vez}${s.roque}${s.ep}`;

function materialInsuficiente(t) {
  const resto = t.filter((p) => p && p.toLowerCase() !== 'k');
  if (resto.length === 0) return true;
  if (resto.length === 1 && 'bn'.includes(resto[0].toLowerCase())) return true;
  return false;
}

// null enquanto o jogo segue; senão { tipo, vencedor }.
export function resultado(s, chaves = []) {
  if (!legais(s).length) {
    return emXeque(s) ? { tipo: 'mate', vencedor: outra(s.vez) } : { tipo: 'afogamento', vencedor: null };
  }
  if (s.meio >= 100) return { tipo: '50 lances', vencedor: null };
  if (materialInsuficiente(s.t)) return { tipo: 'material insuficiente', vencedor: null };
  const k = chave(s);
  if (chaves.filter((c) => c === k).length >= 3) return { tipo: 'repetição', vencedor: null };
  return null;
}

// Notação simples para mostrar o último lance (ex.: Cf3, exd5, O-O, e8=D).
const LETRA = { n: 'C', b: 'B', r: 'T', q: 'D', k: 'R', p: '' };
export const nomeCasa = (i) => `${'abcdefgh'[i & 7]}${8 - (i >> 3)}`;
export function notacao(s, m) {
  if (m.roque) return m.roque === 'curto' ? 'O-O' : 'O-O-O';
  const p = s.t[m.de].toLowerCase();
  const captura = Boolean(s.t[m.para]) || m.ep;
  let txt = LETRA[p];
  if (p === 'p' && captura) txt += 'abcdefgh'[m.de & 7];
  txt += (captura ? 'x' : '') + nomeCasa(m.para);
  if (m.promo) txt += `=${LETRA[m.promo]}`;
  const n = aplicar(s, m);
  if (emXeque(n)) txt += legais(n).length ? '+' : '#';
  return txt;
}

// ---------- Robô ----------

const VALOR = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// Tabelas do ponto de vista das brancas (linha 0 = 8ª fileira).
const TAB = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

export function avaliar(s) {
  let nota = 0;
  for (let i = 0; i < 64; i++) {
    const p = s.t[i];
    if (!p) continue;
    const tipo = p.toLowerCase();
    const w = p !== tipo;
    const v = VALOR[tipo] + TAB[tipo][w ? i : (7 - (i >> 3)) * 8 + (i & 7)];
    nota += w ? v : -v;
  }
  return s.vez === 'w' ? nota : -nota;
}

const ordem = (s) => (m) => {
  const alvo = s.t[m.para];
  let n = 0;
  if (alvo) n += 10 * VALOR[alvo.toLowerCase()] - VALOR[s.t[m.de].toLowerCase()];
  if (m.promo) n += VALOR[m.promo] * 10;
  return n;
};

function quiescencia(s, alfa, beta, prof) {
  const parado = avaliar(s);
  if (parado >= beta) return beta;
  if (parado > alfa) alfa = parado;
  if (prof === 0) return alfa;
  const capturas = pseudo(s).filter((m) => s.t[m.para] || m.promo);
  const nota = ordem(s);
  capturas.sort((a, b) => nota(b) - nota(a));
  for (const m of capturas) {
    const n = aplicar(s, m);
    if (atacada(n.t, reiDe(n.t, s.vez), n.vez)) continue;
    const v = -quiescencia(n, -beta, -alfa, prof - 1);
    if (v >= beta) return beta;
    if (v > alfa) alfa = v;
  }
  return alfa;
}

function negamax(s, prof, alfa, beta, ply) {
  if (s.meio >= 100) return 0;
  if (prof === 0) return quiescencia(s, alfa, beta, 4);
  const ms = pseudo(s);
  const nota = ordem(s);
  ms.sort((a, b) => nota(b) - nota(a));
  let algum = false;
  let melhor = -Infinity;
  for (const m of ms) {
    const n = aplicar(s, m);
    if (atacada(n.t, reiDe(n.t, s.vez), n.vez)) continue;
    algum = true;
    const v = -negamax(n, prof - 1, -beta, -alfa, ply + 1);
    if (v > melhor) melhor = v;
    if (v > alfa) alfa = v;
    if (alfa >= beta) break;
  }
  if (!algum) return emXeque(s) ? -100000 + ply : 0;
  return melhor;
}

const PROFUNDIDADE = { facil: 1, medio: 2, dificil: 4 };

export function jogadaRobo(s, nivel = 'medio', aleatorio = Math.random, chaves = []) {
  const ms = legais(s);
  if (!ms.length) return null;
  if (nivel === 'facil' && aleatorio() < 0.3) return ms[Math.floor(aleatorio() * ms.length)];
  const prof = PROFUNDIDADE[nivel] ?? 2;
  const nota = ordem(s);
  ms.sort((a, b) => nota(b) - nota(a));
  let melhorNota = -Infinity;
  let melhores = [];
  for (const m of ms) {
    const n = aplicar(s, m);
    let v = -negamax(n, prof - 1, -Infinity, -melhorNota + 1, 1);
    if (chaves.includes(chave(n)) && v > 0) v -= 50; // evita repetir quando está à frente
    if (v > melhorNota) { melhorNota = v; melhores = [m]; }
    else if (v === melhorNota) melhores.push(m);
  }
  return melhores[Math.floor(aleatorio() * melhores.length)];
}
