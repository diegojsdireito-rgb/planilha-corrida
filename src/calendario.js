// Calendário e totais de tudo o que foi feito, dentro ou fora da planilha. Funções puras.

import { resumoPorCategoria } from './avulsas.js';
import { segundaDaSemana, somarDias } from './motor.js';

const somar = (lista, valor) => lista.reduce((total, item) => total + (valor(item) ?? 0), 0);

export const mesDe = (data) => data.slice(0, 7);

export function somarMeses(mes, quantos) {
  const [ano, numero] = mes.split('-').map(Number);
  const total = ano * 12 + (numero - 1) + quantos;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

function situacaoDoDia({ sessao, corridas, semDados, outras, data, hoje }) {
  if (corridas.length) return sessao ? 'feito' : 'extra';
  if (semDados.length) return 'sem-dados';
  if (!sessao) return outras.length ? 'outra' : 'livre';
  return data < hoje ? 'perdido' : 'planejado';
}

// Semanas inteiras, de segunda a domingo, para o mês caber na grade.
export function gradeDoMes({ mes, sessoes = [], corridas = [], semDados = [], outras = [], hoje }) {
  const primeiro = `${mes}-01`;
  const proximo = `${somarMeses(mes, 1)}-01`;
  const fim = somarDias(segundaDaSemana(somarDias(proximo, -1)), 7);
  const doDia = (lista, data) => lista.filter((item) => item.data === data);
  const dias = [];
  for (let data = segundaDaSemana(primeiro); data < fim; data = somarDias(data, 1)) {
    const dia = {
      data,
      doMes: mesDe(data) === mes,
      ehHoje: data === hoje,
      sessao: sessoes.find((s) => s.data === data) ?? null,
      corridas: doDia(corridas, data),
      semDados: doDia(semDados, data),
      outras: doDia(outras, data),
    };
    dias.push({ ...dia, situacao: situacaoDoDia({ ...dia, hoje }) });
  }
  return dias;
}

// O que foi feito na semana além dos treinos previstos, em ordem de data.
export function feitoForaDosTreinos({ segunda, sessoes = [], corridas = [], semDados = [], outras = [] }) {
  const fim = somarDias(segunda, 7);
  const naSemana = (a) => a.data >= segunda && a.data < fim;
  const previstos = new Set(sessoes.map((s) => s.data));
  return [
    ...corridas.filter((a) => naSemana(a) && !previstos.has(a.data)).map((item) => ({ tipo: 'corrida', data: item.data, item })),
    ...semDados.filter(naSemana).map((item) => ({ tipo: 'semDados', data: item.data, item })),
    ...outras.filter(naSemana).map((item) => ({ tipo: 'outra', data: item.data, item })),
  ].sort((a, b) => a.data.localeCompare(b.data));
}

const totaisDe = (lista) => ({ quantidade: lista.length, km: somar(lista, (a) => a.km), seg: somar(lista, (a) => a.seg) });

// ate é exclusivo. Corrida em dia sem treino previsto conta como fora da planilha.
export function resumoDaAtividade({ sessoes = [], corridas = [], semDados = [], outras = [], de, ate }) {
  const noPeriodo = (a) => a.data >= de && a.data < ate;
  const previstos = new Set(sessoes.map((s) => s.data));
  const feitas = corridas.filter(noPeriodo);
  const semDistancia = semDados.filter(noPeriodo);
  const porCategoria = resumoPorCategoria(outras, de, ate);
  const minutosOutras = somar(porCategoria, (c) => c.minutos);
  return {
    planilha: totaisDe(feitas.filter((a) => previstos.has(a.data))),
    fora: totaisDe(feitas.filter((a) => !previstos.has(a.data))),
    semDados: totaisDe(semDistancia),
    outras: porCategoria,
    quantidadeOutras: somar(porCategoria, (c) => c.quantidade),
    tempoTotalSeg: somar(feitas, (a) => a.seg) + somar(semDistancia, (a) => a.seg) + minutosOutras * 60,
  };
}
