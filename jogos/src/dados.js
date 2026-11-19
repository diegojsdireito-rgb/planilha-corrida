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
  personagem: inicial.personagem ?? { pele: 1, roupa: 0 },
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
    if (h.r === 'vitoria') p.v++; else if (h.r === 'derrota') p.d++; else if (h.r === 'empate') p.e++;
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

// ---------- Cópia de segurança ----------
// No iPhone, apagar o ícone da tela de início apaga os dados junto. A cópia é um arquivo
// que a pessoa guarda (Arquivos, iCloud Drive) e restaura quando quiser.

const MARCA = 'mesa-de-jogos';
const ULTIMA_COPIA = `${CHAVE}:ultima-copia`;

export function montarCopia(jogos) {
  const salvos = {};
  for (const id of jogos) {
    const s = lerSalvo(id);
    if (s) salvos[id] = s;
  }
  return { app: MARCA, versao: 1, criada: Date.now(), nivel: prefs.nivel, som: prefs.som, personagem: prefs.personagem, historico: prefs.historico, salvos };
}

const chaveDoRegistro = (h) => `${h.j}|${h.r}|${h.t}|${h.tempo ?? ''}`;

// Junta a cópia ao que já existe no aparelho, sem perder nada dos dois lados.
export function mesclar(historicoAtual, salvosAtuais, copia) {
  if (!copia || copia.app !== MARCA || !Array.isArray(copia.historico)) {
    throw new Error('Este arquivo não é uma cópia da Mesa de Jogos.');
  }
  const vistos = new Set(historicoAtual.map(chaveDoRegistro));
  const historico = [...historicoAtual];
  let novos = 0;
  for (const h of copia.historico) {
    if (!h || typeof h.j !== 'string' || !['vitoria', 'derrota', 'empate', 'concluida'].includes(h.r)) continue;
    const k = chaveDoRegistro(h);
    if (vistos.has(k)) continue;
    vistos.add(k);
    historico.push(h);
    novos++;
  }
  historico.sort((a, b) => (a.t || 0) - (b.t || 0));
  const salvos = { ...salvosAtuais };
  let partidas = 0;
  for (const [id, s] of Object.entries(copia.salvos ?? {})) {
    if (!salvos[id] || (s.quando ?? 0) > (salvos[id].quando ?? 0)) { salvos[id] = s; partidas++; }
  }
  return { historico: historico.slice(-LIMITE_HISTORICO), salvos, novos, partidas };
}

export function restaurarCopia(texto, jogos) {
  let copia;
  try { copia = JSON.parse(texto); } catch { throw new Error('Não consegui ler este arquivo.'); }
  const salvosAtuais = {};
  for (const id of jogos) { const s = lerSalvo(id); if (s) salvosAtuais[id] = s; }
  const r = mesclar(prefs.historico, salvosAtuais, copia);
  prefs.historico = r.historico;
  if (copia.personagem) prefs.personagem = copia.personagem;
  guardar();
  for (const [id, s] of Object.entries(r.salvos)) {
    try { localStorage.setItem(SALVO + id, JSON.stringify(s)); } catch { /* sem armazenamento */ }
  }
  return r;
}

export function marcarCopia() { escrever(ULTIMA_COPIA, Date.now()); }
export const ultimaCopia = () => ler(ULTIMA_COPIA);

// Pede ao navegador para não apagar os dados sozinho quando faltar espaço.
export async function pedirPersistencia() {
  try { return await navigator.storage?.persist?.(); } catch { return false; }
}
