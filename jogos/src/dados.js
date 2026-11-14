// Tudo fica no aparelho (localStorage): preferências, histórico e partidas em andamento.

const CHAVE = 'mesa-de-jogos';
const SALVO = `${CHAVE}:salvo:`;
const LIMITE_HISTORICO = 2000;

function ler(chave) {
  try { return JSON.parse(localStorage.getItem(chave)); } catch { return null; }
}
function escrever(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
}

const inicial = ler(CHAVE) ?? {};
export const prefs = {
  nivel: inicial.nivel ?? 'medio',
  som: inicial.som ?? true,
  historico: inicial.historico ?? [],
};

// Migra o placar da primeira versão, que não guardava histórico.
if (inicial.placar && !inicial.historico) {
  for (const [jogo, p] of Object.entries(inicial.placar)) {
    for (const [r, n] of [['vitoria', p.v], ['derrota', p.d], ['empate', p.e]]) {
      for (let k = 0; k < (n || 0); k++) prefs.historico.push({ j: jogo, r, t: 0 });
    }
  }
}

export const guardar = () => escrever(CHAVE, prefs);

export function registrar(jogo, resultado, extra = {}) {
  prefs.historico.push({ j: jogo, r: resultado, t: Date.now(), n: prefs.nivel, ...extra });
  if (prefs.historico.length > LIMITE_HISTORICO) prefs.historico.splice(0, prefs.historico.length - LIMITE_HISTORICO);
  guardar();
}

export function placarDe(jogo) {
  const p = { v: 0, d: 0, e: 0 };
  for (const h of prefs.historico) {
    if (h.j !== jogo) continue;
    if (h.r === 'vitoria') p.v++; else if (h.r === 'derrota') p.d++; else p.e++;
  }
  return p;
}

export function melhorTempo(jogo, nivel) {
  let melhor = null;
  for (const h of prefs.historico) {
    if (h.j === jogo && h.r === 'vitoria' && h.tempo && (!nivel || h.n === nivel)) melhor = melhor === null ? h.tempo : Math.min(melhor, h.tempo);
  }
  return melhor;
}

export const salvar = (jogo, estado) => escrever(SALVO + jogo, { ...estado, quando: Date.now() });
export const lerSalvo = (jogo) => ler(SALVO + jogo);
export function apagarSalvo(jogo) { try { localStorage.removeItem(SALVO + jogo); } catch { /* nada */ } }
