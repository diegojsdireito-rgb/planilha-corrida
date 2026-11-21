// Lógica do Caça-Palavras: gera a grade com as palavras escondidas e confere as seleções.
import { TEMAS, semAcento, embaralhar, sortear, temaPorId } from './palavras.js';

const RETAS = [[0, 1], [1, 0]];
const DIAGONAIS = [[1, 1], [-1, 1]];
const AO_CONTRARIO = [[0, -1], [-1, 0], [-1, -1], [1, -1]];

export const NIVEIS = {
  facil: { n: 8, palavras: 6, direcoes: RETAS, nome: '8 × 8, só deitadas e em pé' },
  medio: { n: 10, palavras: 8, direcoes: [...RETAS, ...DIAGONAIS], nome: '10 × 10, com diagonais' },
  dificil: { n: 12, palavras: 10, direcoes: [...RETAS, ...DIAGONAIS, ...AO_CONTRARIO], nome: '12 × 12, até de trás para frente' },
};

// Letras de enchimento com a frequência do português, para a grade parecer de verdade.
const ENCHIMENTO = 'AAAAAAEEEEEEOOOOOIIIIUUUSSSRRRNNNDDMMTTCCLLPPVGHQBFZJX';

export const COR_TRACOS = ['#ff5c8a', '#3e8bff', '#2fbf71', '#ffb020', '#a35cff', '#ff7a3d', '#17b8c9', '#e04ed1', '#7bc043', '#f25f5c'];

/** Tenta colocar as palavras; devolve null se não couber. */
function tentar(n, escolhidas, direcoes, rng) {
  const grade = Array.from({ length: n }, () => Array(n).fill(''));
  const colocadas = [];
  for (const w of escolhidas) {
    const letras = semAcento(w.palavra);
    let ok = false;
    for (let k = 0; k < 200 && !ok; k++) {
      const [dr, dc] = sortear(direcoes, rng);
      const r = Math.floor(rng() * n); const c = Math.floor(rng() * n);
      const rf = r + dr * (letras.length - 1); const cf = c + dc * (letras.length - 1);
      if (rf < 0 || rf >= n || cf < 0 || cf >= n) continue;
      let cabe = true;
      for (let i = 0; i < letras.length && cabe; i++) { const x = grade[r + dr * i][c + dc * i]; if (x && x !== letras[i]) cabe = false; }
      if (!cabe) continue;
      for (let i = 0; i < letras.length; i++) grade[r + dr * i][c + dc * i] = letras[i];
      colocadas.push({ palavra: w.palavra, emoji: w.emoji, letras, r, c, dr, dc, achada: false });
      ok = true;
    }
    if (!ok) return null;
  }
  return { grade, colocadas };
}

/** Lê as letras de uma reta da grade. */
export function lerReta(grade, r1, c1, r2, c2) {
  const dr = Math.sign(r2 - r1); const dc = Math.sign(c2 - c1);
  const passos = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return null;
  let s = '';
  for (let i = 0; i <= passos; i++) s += grade[r1 + dr * i]?.[c1 + dc * i] ?? '';
  return s;
}

/** Conta quantas vezes a palavra aparece na grade (em qualquer das 8 direções). */
export function ocorrencias(grade, letras) {
  const n = grade.length; let total = 0;
  const dirs = [...RETAS, ...DIAGONAIS, ...AO_CONTRARIO];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (const [dr, dc] of dirs) {
    let i = 0;
    while (i < letras.length && grade[r + dr * i]?.[c + dc * i] === letras[i]) i++;
    if (i === letras.length) total++;
  }
  return letras.length === 1 ? total / 8 : (letras === [...letras].reverse().join('') ? total / 2 : total);
}

export function novoJogo(nivel = 'medio', rng = Math.random, temaId) {
  const cfg = NIVEIS[nivel] ?? NIVEIS.medio;
  for (let tentativa = 0; tentativa < 400; tentativa++) {
    const tema = temaId ? temaPorId(temaId) : sortear(TEMAS, rng);
    const cabem = tema.palavras.filter((w) => semAcento(w.palavra).length <= cfg.n && semAcento(w.palavra).length >= 3);
    if (cabem.length < cfg.palavras) continue;
    // As maiores primeiro, que são as mais difíceis de encaixar.
    const escolhidas = embaralhar(cabem, rng).slice(0, cfg.palavras).sort((a, b) => b.palavra.length - a.palavra.length);
    const feito = tentar(cfg.n, escolhidas, cfg.direcoes, rng);
    if (!feito) continue;
    const { grade, colocadas } = feito;
    for (let r = 0; r < cfg.n; r++) for (let c = 0; c < cfg.n; c++) if (!grade[r][c]) grade[r][c] = ENCHIMENTO[Math.floor(rng() * ENCHIMENTO.length)];
    // Cada palavra aparece uma vez só, para a seleção nunca ficar ambígua.
    if (colocadas.some((w) => ocorrencias(grade, w.letras) !== 1)) continue;
    colocadas.sort((a, b) => a.palavra.localeCompare(b.palavra, 'pt-BR'));
    colocadas.forEach((w, i) => { w.cor = COR_TRACOS[i % COR_TRACOS.length]; });
    return { nivel, n: cfg.n, tema: tema.id, grade: grade.map((linha) => linha.join('')), palavras: colocadas, tempo: 0, dicas: 0 };
  }
  throw new Error('não consegui montar a grade');
}

/** Ajusta o fim do arraste para a reta (horizontal, vertical ou diagonal) mais próxima. */
export function alinhar(r1, c1, r2, c2, n) {
  const dr = r2 - r1; const dc = c2 - c1;
  if (!dr && !dc) return [r1, c1];
  const ang = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
  const ur = Math.round(Math.sin(ang * Math.PI / 4)); const uc = Math.round(Math.cos(ang * Math.PI / 4));
  let passos = Math.round(Math.max(Math.abs(dr), Math.abs(dc)));
  while (passos > 0 && (r1 + ur * passos < 0 || r1 + ur * passos >= n || c1 + uc * passos < 0 || c1 + uc * passos >= n)) passos--;
  return [r1 + ur * passos, c1 + uc * passos];
}

/** Confere a seleção de (r1, c1) a (r2, c2): devolve a palavra achada (e marca) ou null. */
export function conferir(jogo, r1, c1, r2, c2) {
  const lido = lerReta(jogo.grade, r1, c1, r2, c2);
  if (!lido || lido.length < 2) return null;
  const invertido = [...lido].reverse().join('');
  const w = jogo.palavras.find((p) => !p.achada && (p.letras === lido || p.letras === invertido));
  if (!w) return null;
  w.achada = true;
  return w;
}

export const terminou = (jogo) => jogo.palavras.every((p) => p.achada);

export function fimDaPalavra(w) { return [w.r + w.dr * (w.letras.length - 1), w.c + w.dc * (w.letras.length - 1)]; }

/** Uma palavra ainda não achada, para a dica. */
export function dica(jogo, rng = Math.random) {
  const faltam = jogo.palavras.filter((p) => !p.achada);
  return faltam.length ? sortear(faltam, rng) : null;
}
