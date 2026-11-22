// Lógica do Adivinhe a Palavra (forca sem forca: a cesta vai perdendo balões).
import { TEMAS, semAcento, sortear } from './palavras.js';

export const NIVEIS = {
  facil: { min: 3, max: 5, erros: 8, figurinha: true },
  medio: { min: 5, max: 7, erros: 6, figurinha: false },
  dificil: { min: 8, max: 20, erros: 5, figurinha: false },
};

export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Todas as palavras que servem para um nível, com o tema de cada uma. */
export function candidatas(nivel) {
  const cfg = NIVEIS[nivel] ?? NIVEIS.medio;
  const lista = [];
  for (const tema of TEMAS) for (const w of tema.palavras) {
    const n = semAcento(w.palavra).length;
    if (n >= cfg.min && n <= cfg.max) lista.push({ tema, ...w });
  }
  return lista;
}

export function novoJogo(nivel = 'medio', rng = Math.random, evitar = []) {
  const cfg = NIVEIS[nivel] ?? NIVEIS.medio;
  let lista = candidatas(nivel);
  const novas = lista.filter((w) => !evitar.includes(w.palavra));
  if (novas.length) lista = novas;
  const w = sortear(lista, rng);
  return {
    nivel, tema: w.tema.id, temaNome: w.tema.nome, temaEmoji: w.tema.emoji,
    palavra: w.palavra, emoji: w.emoji, alvo: semAcento(w.palavra),
    maxErros: cfg.erros, figurinha: cfg.figurinha, tentadas: [], tempo: 0,
  };
}

export const erros = (j) => j.tentadas.filter((l) => !j.alvo.includes(l)).length;
export const venceu = (j) => [...j.alvo].every((l) => j.tentadas.includes(l));
export const perdeu = (j) => erros(j) >= j.maxErros;
export const acabou = (j) => venceu(j) || perdeu(j);

/** Chuta uma letra (acentuadas valem como a letra sem acento). */
export function chutar(j, letra) {
  const l = semAcento(letra);
  if (!/^[A-Z]$/.test(l) || acabou(j)) return 'invalida';
  if (j.tentadas.includes(l)) return 'repetida';
  j.tentadas.push(l);
  return j.alvo.includes(l) ? 'acerto' : 'erro';
}

/** A palavra para mostrar: letras descobertas (com acento) e null nas que faltam. */
export function mascara(j, revelar = false) {
  return [...j.palavra.toUpperCase()].map((ch) => (revelar || j.tentadas.includes(semAcento(ch)) ? ch : null));
}
