// Situação de cada treino: cumprido, parcial, não feito ou sem registro. Funções puras.

import { segundaDaSemana } from './motor.js';

// Doença e dor não contam como falta: cobrar por elas empurraria a pessoa a treinar mal.
export const MOTIVOS = [
  { chave: 'doenca', nome: 'Doença', dispensa: true },
  { chave: 'dor', nome: 'Dor ou lesão', dispensa: true },
  { chave: 'viagem', nome: 'Viagem', dispensa: false },
  { chave: 'tempo', nome: 'Falta de tempo', dispensa: false },
  { chave: 'outro', nome: 'Outro motivo', dispensa: false },
];

// Corte do app, sem base em estudo: 80% da distância prevista, ou do tempo nos treinos por tempo.
export const CORTE_DO_CUMPRIDO = 0.8;

const MAXIMO_DE_KM_MANUAL = 100;
const PACE_MINIMO = 150;
const SEGUNDOS_NO_DIA = 86400;

export const nomeDoMotivo = (chave) => MOTIVOS.find((m) => m.chave === chave)?.nome ?? 'Outro motivo';
export const motivoDispensa = (chave) => Boolean(MOTIVOS.find((m) => m.chave === chave)?.dispensa);
export const chaveDaCorrida = (a) => String(a.id ?? a.idManual);

export function corridasDoTreino(sessao, corridas, ligacoes = {}) {
  return corridas.filter((a) => {
    const ligada = ligacoes[chaveDaCorrida(a)];
    return ligada ? ligada === sessao.id : a.data === sessao.data;
  });
}

// Corrida feita primeiro manda: se ela chegar depois de "não fiz", o treino passa a contar.
export function situacaoDoTreino({ sessao, corridas = [], ligacoes = {}, naoFeitos = {}, hoje }) {
  const doTreino = corridasDoTreino(sessao, corridas, ligacoes);
  const km = doTreino.reduce((t, a) => t + a.km, 0);
  const motivo = naoFeitos[sessao.id]?.motivo ?? null;
  let situacao;
  const seg = doTreino.reduce((t, a) => t + (a.seg ?? 0), 0);
  // Treino por tempo vale pelo tempo: quem caminha mais faz menos km e cumpriu do mesmo jeito.
  const cumprido = sessao.minutosTotal ? seg >= sessao.minutosTotal * 60 * CORTE_DO_CUMPRIDO : km >= sessao.distanciaKm * CORTE_DO_CUMPRIDO;
  if (km > 0) situacao = cumprido ? 'feito' : 'parcial';
  else if (motivo) situacao = 'nao-feito';
  else situacao = sessao.data < hoje ? 'perdido' : 'planejado';
  return { situacao, km, seg, corridas: doTreino, motivo: km > 0 ? null : motivo };
}

export function sessaoDaCorrida(corrida, sessoes, ligacoes = {}) {
  const ligada = ligacoes[chaveDaCorrida(corrida)];
  return sessoes.find((s) => (ligada ? s.id === ligada : s.data === corrida.data)) ?? null;
}

// Corridas da mesma semana em dias sem treino, ainda não ligadas a nenhum.
export function corridasParaLigar({ sessao, sessoes, corridas, ligacoes = {} }) {
  const semana = segundaDaSemana(sessao.data);
  const diasComTreino = new Set(sessoes.map((s) => s.data));
  return corridas.filter((a) => segundaDaSemana(a.data) === semana && !diasComTreino.has(a.data) && !ligacoes[chaveDaCorrida(a)] && a.km > 0);
}

export const sessoesDispensadas = (naoFeitos = {}) => Object.keys(naoFeitos).filter((id) => motivoDispensa(naoFeitos[id].motivo));

// Para a sequência de semanas: doença e dor deixam a semana neutra, como dor já registrada.
export function avaliacoesDasSemanas(avaliacoes = {}, naoFeitos = {}) {
  const resultado = { ...avaliacoes };
  for (const id of sessoesDispensadas(naoFeitos)) resultado[id] = { ...resultado[id], dor: true };
  return resultado;
}

// Para a Revisão: só o motivo dor pesa como dor. Doença não reduz a carga por conta própria.
export function avaliacoesDaRevisao(avaliacoes = {}, naoFeitos = {}) {
  const resultado = { ...avaliacoes };
  for (const [id, { motivo }] of Object.entries(naoFeitos)) {
    if (motivo === 'dor') resultado[id] = { ...resultado[id], dor: true };
  }
  return resultado;
}

export function erroDaCorridaManual({ data, km, seg }, hoje) {
  if (!data) return 'Informe a data.';
  if (data > hoje) return 'A data não pode ser futura.';
  if (!(km > 0) || km > MAXIMO_DE_KM_MANUAL) return 'Confira a distância.';
  if (!(seg > 0) || seg >= SEGUNDOS_NO_DIA) return 'Informe o tempo da corrida.';
  if (seg / km < PACE_MINIMO) return 'Tempo muito rápido para esta distância. Confira os valores.';
  return null;
}
