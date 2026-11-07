// Calendário e totais de tudo o que foi feito, dentro ou fora da planilha. Funções puras.

import { ehAniversario, idadeEm } from './aniversario.js';
import { resumoPorCategoria } from './avulsas.js';
import { chaveDaCorrida, situacaoDoTreino } from './cumprimento.js';
import { segundaDaSemana, somarDias } from './motor.js';

const somar = (lista, valor) => lista.reduce((total, item) => total + (valor(item) ?? 0), 0);

export const mesDe = (data) => data.slice(0, 7);

export function somarMeses(mes, quantos) {
  const [ano, numero] = mes.split('-').map(Number);
  const total = ano * 12 + (numero - 1) + quantos;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

function situacaoDoDia({ sessao, corridas, semDados, outras, treino, ligacoes }) {
  if (treino && ['feito', 'parcial'].includes(treino.situacao)) return treino.situacao;
  if (!sessao && corridas.length) return corridas.every((a) => ligacoes[chaveDaCorrida(a)]) ? 'feito' : 'extra';
  if (semDados.length) return 'sem-dados';
  if (!sessao) return outras.length ? 'outra' : 'livre';
  return treino.situacao;
}

// Semanas inteiras, de segunda a domingo, para o mês caber na grade.
export function gradeDoMes({ mes, sessoes = [], corridas = [], semDados = [], outras = [], ligacoes = {}, naoFeitos = {}, nascimento = null, hoje }) {
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
      aniversario: nascimento && ehAniversario(nascimento, data) ? idadeEm(nascimento, data) : null,
      sessao: sessoes.find((s) => s.data === data) ?? null,
      corridas: doDia(corridas, data),
      semDados: doDia(semDados, data),
      outras: doDia(outras, data),
    };
    const treino = dia.sessao ? situacaoDoTreino({ sessao: dia.sessao, corridas, ligacoes, naoFeitos, hoje }) : null;
    dias.push({ ...dia, motivo: treino?.motivo ?? null, kmDoTreino: treino?.km ?? 0, situacao: situacaoDoDia({ ...dia, treino, ligacoes }) });
  }
  return dias;
}

// O que foi feito na semana além dos treinos previstos, em ordem de data.
export function feitoForaDosTreinos({ segunda, sessoes = [], corridas = [], semDados = [], outras = [], ligacoes = {} }) {
  const fim = somarDias(segunda, 7);
  const naSemana = (a) => a.data >= segunda && a.data < fim;
  const previstos = new Set(sessoes.map((s) => s.data));
  return [
    ...corridas.filter((a) => naSemana(a) && !previstos.has(a.data) && !ligacoes[chaveDaCorrida(a)]).map((item) => ({ tipo: 'corrida', data: item.data, item })),
    ...semDados.filter(naSemana).map((item) => ({ tipo: 'semDados', data: item.data, item })),
    ...outras.filter(naSemana).map((item) => ({ tipo: 'outra', data: item.data, item })),
  ].sort((a, b) => a.data.localeCompare(b.data));
}

const totaisDe = (lista) => ({ quantidade: lista.length, km: somar(lista, (a) => a.km), seg: somar(lista, (a) => a.seg) });

// ate é exclusivo. Corrida em dia sem treino previsto conta como fora da planilha.
export function resumoDaAtividade({ sessoes = [], corridas = [], semDados = [], outras = [], ligacoes = {}, de, ate }) {
  const noPeriodo = (a) => a.data >= de && a.data < ate;
  const previstos = new Set(sessoes.map((s) => s.data));
  const daPlanilha = (a) => previstos.has(a.data) || Boolean(ligacoes[chaveDaCorrida(a)]);
  const feitas = corridas.filter(noPeriodo);
  const semDistancia = semDados.filter(noPeriodo);
  const porCategoria = resumoPorCategoria(outras, de, ate);
  const minutosOutras = somar(porCategoria, (c) => c.minutos);
  return {
    planilha: totaisDe(feitas.filter(daPlanilha)),
    fora: totaisDe(feitas.filter((a) => !daPlanilha(a))),
    semDados: totaisDe(semDistancia),
    outras: porCategoria,
    quantidadeOutras: somar(porCategoria, (c) => c.quantidade),
    tempoTotalSeg: somar(feitas, (a) => a.seg) + somar(semDistancia, (a) => a.seg) + minutosOutras * 60,
  };
}
