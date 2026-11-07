// Números da aba Evolução. Funções puras sobre as corridas e a planilha.

import { segundaDaSemana, somarDias } from './motor.js';

const DIAS_DO_PERIODO = 28;
const KM_MINIMO_PARA_RITMO = 3;
const KM_MINIMO_RECORDE_PACE = 5;

const somar = (lista, valor) => lista.reduce((total, item) => total + (valor(item) ?? 0), 0);

export function resumoSemanal({ atividades, plano, hoje, semanas = 12 }) {
  const atual = segundaDaSemana(hoje);
  const lista = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const segunda = somarDias(atual, -7 * i);
    const fim = somarDias(segunda, 7);
    const naSemana = atividades.filter((a) => a.data >= segunda && a.data < fim);
    const previstas = (plano?.sessoes ?? []).filter((s) => s.data >= segunda && s.data < fim);

    // Prova e corrida curta distorcem a tendência de ritmo.
    const paraRitmo = naSemana.filter((a) => !a.prova && !a.manual && a.km >= KM_MINIMO_PARA_RITMO && a.seg > 0);
    const kmRitmo = somar(paraRitmo, (a) => a.km);
    const comFc = paraRitmo.filter((a) => a.fcMedia > 0);
    const batimentos = somar(comFc, (a) => (a.fcMedia * a.seg) / 60);

    lista.push({
      segunda,
      km: somar(naSemana, (a) => a.km),
      corridas: naSemana.length,
      previsto: previstas.length ? somar(previstas, (s) => s.distanciaKm) : null,
      ritmo: kmRitmo ? somar(paraRitmo, (a) => a.seg) / kmRitmo : null,
      metrosPorBatimento: batimentos ? (somar(comFc, (a) => a.km) * 1000) / batimentos : null,
    });
  }
  return lista;
}

function totaisDoPeriodo(atividades, de, ate) {
  const lista = atividades.filter((a) => a.data >= de && a.data < ate);
  return { km: somar(lista, (a) => a.km), corridas: lista.length, seg: somar(lista, (a) => a.seg) };
}

// Compara os últimos 28 dias com os 28 anteriores.
export function compararPeriodos(atividades, hoje) {
  const amanha = somarDias(hoje, 1);
  const inicio = somarDias(amanha, -DIAS_DO_PERIODO);
  return {
    atual: totaisDoPeriodo(atividades, inicio, amanha),
    anterior: totaisDoPeriodo(atividades, somarDias(inicio, -DIAS_DO_PERIODO), inicio),
  };
}

export function adesaoDoPeriodo({ atividades, plano, hoje }) {
  const inicio = somarDias(hoje, -DIAS_DO_PERIODO);
  const previstas = (plano?.sessoes ?? []).filter((s) => s.data >= inicio && s.data < hoje);
  const kmPrevistos = somar(previstas, (s) => s.distanciaKm);
  if (!kmPrevistos) return null;
  // Corrida de antes do primeiro treino previsto não pode inflar o "do previsto".
  const desde = previstas.reduce((menor, s) => (s.data < menor ? s.data : menor), hoje);
  const kmFeitos = somar(atividades.filter((a) => a.data >= desde && a.data < hoje), (a) => a.km);
  return kmFeitos / kmPrevistos;
}

export function calcularRecordes(atividades) {
  if (!atividades.length) return null;
  const maior = atividades.reduce((a, b) => (b.km > a.km ? b : a));
  const validas = atividades.filter((a) => a.km >= KM_MINIMO_RECORDE_PACE && a.seg > 0);
  const melhorPace = validas.length
    ? validas.reduce((a, b) => (b.seg / b.km < a.seg / a.km ? b : a))
    : null;
  const porSemana = new Map();
  for (const a of atividades) {
    const segunda = segundaDaSemana(a.data);
    porSemana.set(segunda, (porSemana.get(segunda) ?? 0) + a.km);
  }
  const [segundaMaior, kmMaior] = [...porSemana].reduce((a, b) => (b[1] > a[1] ? b : a));
  return {
    maiorCorrida: { km: maior.km, data: maior.data },
    melhorPace: melhorPace && { ritmo: melhorPace.seg / melhorPace.km, km: melhorPace.km, data: melhorPace.data },
    maiorSemana: { km: kmMaior, segunda: segundaMaior },
  };
}

export function zonasDoPeriodo(atividades, hoje) {
  const inicio = somarDias(hoje, -DIAS_DO_PERIODO);
  const somaPorZona = [];
  for (const a of atividades) {
    if (a.data < inicio) continue;
    (a.tempoPorZonaFc ?? []).forEach((seg, i) => {
      somaPorZona[i] = (somaPorZona[i] ?? 0) + seg;
    });
  }
  const total = somaPorZona.reduce((t, s) => t + (s ?? 0), 0);
  if (!total) return [];
  return Array.from(somaPorZona, (seg, i) => ({ zona: i + 1, seg: seg ?? 0, fracao: (seg ?? 0) / total }))
    .filter((z) => z.seg > 0);
}

// Separador e decimal no padrão do Excel em português. O início do nome é protegido
// porque a planilha executaria um nome de corrida começado por "=" como fórmula.
const campoCsv = (texto) => {
  const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replaceAll('"', '""')}"`;
};
const decimalCsv = (n, casas) => n.toFixed(casas).replace('.', ',');
const tempoCsv = (seg) => {
  const total = Math.round(seg);
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((p) => String(p).padStart(2, '0'))
    .join(':');
};

export function csvDasCorridas(atividades) {
  const cabecalho = ['Data', 'Nome', 'Distância (km)', 'Tempo', 'Pace (min/km)', 'FC média', 'FC máxima', 'Subida (m)', 'Esforço', 'Prova'];
  const linhas = [...atividades]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((a) => [
      a.data,
      campoCsv(a.nome ?? 'Corrida'),
      decimalCsv(a.km, 2),
      tempoCsv(a.seg),
      a.km > 0 && a.seg > 0 ? tempoCsv(a.seg / a.km).slice(3) : '',
      a.fcMedia ?? '',
      a.fcMaxima ?? '',
      a.subida ? Math.round(a.subida) : '',
      a.rpe ?? '',
      a.prova ? 'Sim' : 'Não',
    ].join(';'));
  return `﻿${[cabecalho.join(';'), ...linhas].join('\r\n')}\r\n`;
}

// Guarda só mudanças de nível, para o histórico contar a evolução sem repetir pontos.
export function registrarNivel(historico, data, vdot) {
  const lista = historico ?? [];
  if (lista.at(-1)?.vdot === vdot) return lista;
  return [...lista.filter((p) => p.data !== data), { data, vdot }];
}
