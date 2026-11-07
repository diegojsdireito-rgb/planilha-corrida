// Análises vindas do intervals.icu. Só informam: nenhuma delas muda treino, nível ou revisão.
// A documentação da API não traz a unidade de vários campos, por isso cada valor passa por uma
// faixa plausível. Fora dela, o dado some da tela em vez de aparecer errado.

import { segundaDaSemana, somarDias } from './motor.js';

const PACE_MAIS_RAPIDO = 150; // s/km: 2:30/km, o mesmo corte de salto de GPS das medalhas.
const PACE_MAIS_LENTO = 900; // s/km: 15:00/km.
const LACUNA_MAXIMA = 10; // segundos: gravação interrompida não conta como tempo correndo.
const VELOCIDADE_MINIMA = 0.5; // m/s: abaixo disso, a pessoa está parada.
const TOLERANCIA_DA_CURVA = 0.01; // Ponto da curva até 1% longe da distância pedida.

export const MARCAS = [
  { km: 1, nome: '1 km' },
  { km: 3, nome: '3 km' },
  { km: 5, nome: '5 km' },
  { km: 10, nome: '10 km' },
  { km: 15, nome: '15 km' },
  { km: 21.0975, nome: 'Meia maratona' },
  { km: 42.195, nome: 'Maratona' },
];

const noPace = (segPorKm) => (segPorKm >= PACE_MAIS_RAPIDO && segPorKm <= PACE_MAIS_LENTO ? segPorKm : null);
const faixa = (valor, de, ate) => (Number.isFinite(valor) && valor >= de && valor <= ate ? valor : null);

// As faixas não se sobrepõem para pace de corrida: 0,15 a 0,9 s/m, 1,1 a 6,7 m/s ou 150 a 900 s/km.
export function paceAjustado(valor) {
  if (!Number.isFinite(valor) || valor <= 0) return null;
  if (valor < 1) return noPace(valor * 1000);
  if (valor < 10) return noPace(1000 / valor);
  return noPace(valor);
}

export function dadosDeDesempenho(a) {
  const vento = faixa(a.average_wind_speed, 0, 40);
  return {
    paceAjustado: paceAjustado(a.gap),
    desacoplamento: faixa(a.decoupling, -50, 50),
    temperatura: faixa(a.average_weather_temp, -30, 60),
    sensacaoTermica: faixa(a.average_feels_like, -40, 70),
    temperaturaDoRelogio: faixa(a.average_temp, -30, 70),
    ventoKmH: vento === null ? null : vento * 3.6,
    ventoContra: faixa(a.headwind_percent, 0, 100),
  };
}

// Melhor tempo em cada distância dentro da corrida, sem contar paradas.
export function melhoresDaCorrida({ tempo, distancia, velocidade }) {
  if (!tempo?.length || !distancia?.length) return [];
  const metros = [];
  const acumulado = [];
  let seg = 0;
  for (let i = 0; i < distancia.length; i++) {
    if (!Number.isFinite(distancia[i]) || !Number.isFinite(tempo[i])) continue;
    if (metros.length) {
      const passo = Math.min(tempo[i] - tempo[i - 1], LACUNA_MAXIMA);
      const parado = velocidade ? !(velocidade[i] >= VELOCIDADE_MINIMA) : false;
      if (passo > 0 && !parado) seg += passo;
    }
    metros.push(distancia[i]);
    acumulado.push(seg);
  }
  const total = metros.at(-1) ?? 0;
  const marcas = [];
  for (const { km, nome } of MARCAS) {
    const alvo = km * 1000;
    if (total < alvo) break;
    let melhor = null;
    let inicio = 0;
    for (let fim = 1; fim < metros.length; fim++) {
      while (inicio + 1 < fim && metros[fim] - metros[inicio + 1] >= alvo) inicio += 1;
      const sobra = metros[fim] - metros[inicio] - alvo;
      if (sobra < 0) continue;
      const trecho = metros[inicio + 1] - metros[inicio];
      const parte = trecho > 0 ? sobra / trecho : 0;
      const largada = acumulado[inicio] + parte * (acumulado[inicio + 1] - acumulado[inicio]);
      const gasto = acumulado[fim] - largada;
      if (noPace(gasto / km) && (melhor === null || gasto < melhor)) melhor = gasto;
    }
    if (melhor !== null) marcas.push({ km, nome, seg: melhor, ritmo: melhor / km });
  }
  return marcas;
}

// Melhores marcas do atleta na curva de pace: distância em metros e tempo em segundos.
// A curva pula distâncias, então a marca sai só se houver um ponto bem próximo.
export function marcasDaCurva(curva) {
  const distancias = curva?.distance ?? [];
  const valores = curva?.values ?? [];
  const marcas = [];
  for (const { km, nome } of MARCAS) {
    const alvo = km * 1000;
    let achado = -1;
    distancias.forEach((d, i) => {
      if (!(valores[i] > 0) || Math.abs(d - alvo) > alvo * TOLERANCIA_DA_CURVA) return;
      if (achado < 0 || Math.abs(d - alvo) < Math.abs(distancias[achado] - alvo)) achado = i;
    });
    if (achado < 0) continue;
    const seg = valores[achado] * (alvo / distancias[achado]);
    if (noPace(seg / km)) marcas.push({ km, nome, seg, ritmo: seg / km, atividade: curva.activity_id?.[achado] ?? null });
  }
  return marcas;
}

// Condicionamento e fadiga no fim de cada dia com atividade, de todos os esportes.
export function pontosDeCarga(atividades) {
  const porDia = new Map();
  const ordenadas = [...atividades].sort((a, b) => String(a.start_date_local).localeCompare(String(b.start_date_local)));
  for (const a of ordenadas) {
    const data = String(a.start_date_local ?? '').slice(0, 10);
    if (data && Number.isFinite(a.icu_ctl) && Number.isFinite(a.icu_atl)) porDia.set(data, { data, ctl: a.icu_ctl, atl: a.icu_atl });
  }
  return [...porDia.values()];
}

export function resumoDaCarga(pontos) {
  const ultimo = pontos?.at(-1);
  if (!ultimo) return null;
  const limite = somarDias(ultimo.data, -7);
  const antes = pontos.filter((p) => p.data <= limite).at(-1);
  return {
    data: ultimo.data,
    ctl: ultimo.ctl,
    atl: ultimo.atl,
    equilibrio: ultimo.ctl - ultimo.atl,
    variacao: antes ? ultimo.ctl - antes.ctl : null,
  };
}

// Último valor de cada semana, para os gráficos. Semana sem atividade deixa um vão.
export function cargaPorSemana(pontos, hoje, semanas = 12) {
  const atual = segundaDaSemana(hoje);
  return Array.from({ length: semanas }, (_, i) => {
    const segunda = somarDias(atual, -7 * (semanas - 1 - i));
    const fim = somarDias(segunda, 7);
    const ponto = pontos.filter((p) => p.data >= segunda && p.data < fim).at(-1);
    return { segunda, ctl: ponto?.ctl ?? null, atl: ponto?.atl ?? null };
  });
}
