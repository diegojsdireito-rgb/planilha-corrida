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

function situacaoDoDia({ sessao, corridas, semDados, data, hoje }) {
  if (corridas.length) return sessao ? 'feito' : 'extra';
  if (semDados.length) return 'sem-dados';
  if (!sessao) return 'livre';
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
