// Como foi o treino: esforço e sensação. Funções puras. É autoavaliação: mostra tendência, não diagnóstico.

import { chaveDaCorrida, sessaoDaCorrida } from './cumprimento.js';
import { segundaDaSemana, somarDias } from './motor.js';

export const SENSACOES = [
  { valor: 1, nome: 'Muito mal' },
  { valor: 2, nome: 'Mal' },
  { valor: 3, nome: 'Normal' },
  { valor: 4, nome: 'Bem' },
  { valor: 5, nome: 'Muito bem' },
];

const DIAS_PARA_PERGUNTAR = 3;

export const nomeDaSensacao = (valor) => SENSACOES.find((s) => s.valor === valor)?.nome ?? null;

// O intervals.icu entrega a sensação invertida: 1 é forte e 5 é fraco.
export const sensacaoDoFeel = (feel) => (feel >= 1 && feel <= 5 ? 6 - feel : null);

export function chaveDoFeedback(corrida, sessoes = [], ligacoes = {}) {
  return sessaoDaCorrida(corrida, sessoes, ligacoes)?.id ?? chaveDaCorrida(corrida);
}

// A resposta dada no app vale mais que o valor que veio do relógio.
export function valoresDoFeedback(avaliacao, corridas = []) {
  const doRelogio = corridas.find((a) => a.rpe || a.sensacaoDoRelogio);
  return {
    esforco: avaliacao?.esforco ?? doRelogio?.rpe ?? null,
    sensacao: avaliacao?.sensacao ?? doRelogio?.sensacaoDoRelogio ?? null,
    dor: Boolean(avaliacao?.dor),
    doRelogio: !avaliacao?.esforco && Boolean(doRelogio?.rpe),
    semNota: Boolean(avaliacao?.semNota),
  };
}

// A corrida mais recente dos últimos dias que ainda não teve esforço informado.
export function corridaSemFeedback({ corridas = [], sessoes = [], ligacoes = {}, avaliacoes = {}, hoje }) {
  const limite = somarDias(hoje, -DIAS_PARA_PERGUNTAR);
  const recentes = corridas.filter((a) => a.data >= limite && a.data <= hoje).sort((a, b) => b.data.localeCompare(a.data));
  for (const corrida of recentes) {
    const chave = chaveDoFeedback(corrida, sessoes, ligacoes);
    const valores = valoresDoFeedback(avaliacoes[chave], recentes.filter((a) => chaveDoFeedback(a, sessoes, ligacoes) === chave));
    if (!valores.esforco && !valores.semNota) return { chave, corrida, sessao: sessaoDaCorrida(corrida, sessoes, ligacoes) };
  }
  return null;
}

// Média por semana, com vão nas semanas sem resposta.
export function feedbackPorSemana({ avaliacoes = {}, sessoes = [], hoje, semanas = 12 }) {
  const dataDe = (chave, nota) => nota.data ?? sessoes.find((s) => s.id === chave)?.data ?? null;
  const respostas = Object.entries(avaliacoes).map(([chave, nota]) => ({ ...nota, data: dataDe(chave, nota) })).filter((n) => n.data);
  const media = (lista) => (lista.length ? Math.round((lista.reduce((t, v) => t + v, 0) / lista.length) * 10) / 10 : null);
  const atual = segundaDaSemana(hoje);
  return Array.from({ length: semanas }, (_, i) => {
    const segunda = somarDias(atual, -7 * (semanas - 1 - i));
    const fim = somarDias(segunda, 7);
    const daSemana = respostas.filter((n) => n.data >= segunda && n.data < fim);
    return {
      data: segunda,
      esforco: media(daSemana.map((n) => n.esforco).filter(Number.isFinite)),
      sensacao: media(daSemana.map((n) => n.sensacao).filter(Number.isFinite)),
    };
  });
}
