// Tudo fica no aparelho (localStorage): preferências, histórico e partidas em andamento,
// separados por perfil de jogador.
import { normalizar, mesclarCarteiras } from './loja.js';

const CHAVE = 'mesa-de-jogos';
const PERFIS = `${CHAVE}:perfis`;
const LIMITE_HISTORICO = 2000;
export const LIMITE_PERFIS = 8;
export const AVATARES = ['👧', '👦', '👩', '👨', '🧒', '👵', '👴', '🐱', '🐶', '🦄', '🦖', '⭐'];

function ler(chave) {
  try { return JSON.parse(localStorage.getItem(chave)); } catch { return null; }
}
function escrever(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
}
function remover(chave) { try { localStorage.removeItem(chave); } catch { /* nada */ } }
function todasAsChaves() {
  try { return Array.from({ length: localStorage.length }, (_, k) => localStorage.key(k)); } catch { return []; }
}

// ---------- Perfis ----------
// Cada pessoa que usa o aparelho tem o próprio perfil: placar, moedas, personagem e partidas
// em andamento ficam separados. O primeiro perfil usa as chaves da versão sem perfis, então
// quem já jogava continua com tudo.

const chaveDoPerfil = (id) => (id === 'p1' ? CHAVE : `${CHAVE}:perfil:${id}`);
let SALVO = `${CHAVE}:salvo:`;
let ULTIMA_COPIA = `${CHAVE}:ultima-copia`;

function lerPerfis() {
  const r = ler(PERFIS);
  if (r && Array.isArray(r.lista) && r.lista.length) {
    const lista = r.lista.filter((p) => p && typeof p.id === 'string');
    if (lista.length) return { atual: lista.some((p) => p.id === r.atual) ? r.atual : lista[0].id, lista };
  }
  return { atual: 'p1', lista: [{ id: 'p1', nome: 'Jogador 1', avatar: '🙂' }] };
}
const registro = lerPerfis();

export const listaDePerfis = () => registro.lista.map((p) => ({ ...p }));
export const perfilAtual = () => ({ ...registro.lista.find((p) => p.id === registro.atual) });
export const temVariosPerfis = () => registro.lista.length > 1;

function limparNome(nome) {
  const n = String(nome ?? '').replace(/\s+/g, ' ').trim().slice(0, 20);
  if (!n) throw new Error('Escreva um nome.');
  return n;
}
function nomeLivre(nome, menosId) {
  const igual = registro.lista.find((p) => p.id !== menosId && p.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'));
  if (igual) throw new Error(`Já existe um jogador chamado ${igual.nome}.`);
}

export function criarPerfil(nome, avatar = AVATARES[0]) {
  if (registro.lista.length >= LIMITE_PERFIS) throw new Error(`Dá para ter até ${LIMITE_PERFIS} jogadores.`);
  const n = limparNome(nome);
  nomeLivre(n);
  let id;
  do { id = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`; } while (registro.lista.some((p) => p.id === id));
  const perfil = { id, nome: n, avatar, criado: Date.now() };
  registro.lista.push(perfil);
  escrever(PERFIS, registro);
  return { ...perfil };
}

export function editarPerfil(id, { nome, avatar } = {}) {
  const p = registro.lista.find((x) => x.id === id);
  if (!p) throw new Error('Jogador não encontrado.');
  if (nome !== undefined) { const n = limparNome(nome); nomeLivre(n, id); p.nome = n; }
  if (avatar) p.avatar = avatar;
  escrever(PERFIS, registro);
  return { ...p };
}

// Apaga o perfil e tudo o que ele guardou. O último perfil não pode ser apagado.
export function apagarPerfil(id) {
  if (registro.lista.length <= 1) throw new Error('Precisa ficar pelo menos um jogador.');
  const k = registro.lista.findIndex((p) => p.id === id);
  if (k < 0) return;
  const base = chaveDoPerfil(id);
  for (const chave of todasAsChaves()) {
    if (chave === base || chave.startsWith(`${base}:salvo:`) || chave === `${base}:ultima-copia`) remover(chave);
  }
  registro.lista.splice(k, 1);
  if (registro.atual === id) registro.atual = registro.lista[0].id;
  escrever(PERFIS, registro);
  carregar();
}

export function trocarPerfil(id) {
  if (!registro.lista.some((p) => p.id === id)) throw new Error('Jogador não encontrado.');
  registro.atual = id;
  escrever(PERFIS, registro);
  carregar();
}

// Números rápidos para os cartões da escolha de jogador, sem trocar de perfil.
export function resumoDoPerfil(id) {
  const d = ler(chaveDoPerfil(id)) ?? {};
  return { partidas: d.historico?.length ?? 0, moedas: normalizar(d.carteira).moedas ?? 0 };
}

function montarPrefs(dados) {
  const inicial = dados ?? {};
  const p = {
    nivel: inicial.nivel ?? 'medio',
    som: inicial.som ?? true,
    historico: inicial.historico ?? [],
    personagem: inicial.personagem ?? { pele: 1, roupa: 0 },
    carteira: normalizar(inicial.carteira),
    cenario: inicial.cenario ?? 'passeio',
    perseguidorFloresta: inicial.perseguidorFloresta ?? 'leao',
    bonusDocinhos: inicial.bonusDocinhos ?? null, // quantos bônus do Docinhos o jogador tem (null = ainda não ganhou os iniciais)
    bichinho: inicial.bichinho ?? null, // o bichinho virtual (null = ainda não adotou)
  };
  // Migra o placar da primeira versão, que não guardava histórico.
  if (inicial.placar && !inicial.historico) {
    for (const [jogo, pl] of Object.entries(inicial.placar)) {
      for (const [r, n] of [['vitoria', pl.v], ['derrota', pl.d], ['empate', pl.e]]) {
        for (let k = 0; k < (n || 0); k++) p.historico.push({ j: jogo, r, t: 0 });
      }
    }
  }
  return p;
}

export const prefs = {};
let chaveAtual = CHAVE;

// O objeto prefs é o mesmo o tempo todo (as telas guardam a referência); trocar de perfil troca o conteúdo.
function carregar() {
  chaveAtual = chaveDoPerfil(registro.atual);
  SALVO = `${chaveAtual}:salvo:`;
  ULTIMA_COPIA = `${chaveAtual}:ultima-copia`;
  for (const k of Object.keys(prefs)) delete prefs[k];
  Object.assign(prefs, montarPrefs(ler(chaveAtual)));
}
carregar();

export const guardar = () => escrever(chaveAtual, prefs);

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

export function montarCopia(jogos) {
  const salvos = {};
  for (const id of jogos) {
    const s = lerSalvo(id);
    if (s) salvos[id] = s;
  }
  return { app: MARCA, versao: 1, criada: Date.now(), perfil: perfilAtual().nome, nivel: prefs.nivel, som: prefs.som, personagem: prefs.personagem, carteira: prefs.carteira, perseguidorFloresta: prefs.perseguidorFloresta, bonusDocinhos: prefs.bonusDocinhos, bichinho: prefs.bichinho, historico: prefs.historico, salvos };
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
  if (copia.carteira) prefs.carteira = mesclarCarteiras(prefs.carteira, copia.carteira);
  if (copia.bichinho && !prefs.bichinho) prefs.bichinho = copia.bichinho;
  if (copia.bonusDocinhos && !prefs.bonusDocinhos) prefs.bonusDocinhos = copia.bonusDocinhos;
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
