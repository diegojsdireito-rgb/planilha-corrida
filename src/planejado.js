// Planejado x realizado. Funções puras. A aderência é uma fórmula do app, sem validação em estudo.

const TOLERANCIA_DO_RITMO = 5; // s/km: abaixo disso, a diferença cabe no erro do GPS.
const DESVIO_QUE_ZERA_O_RITMO = 60; // s/km.
const FOLGA_DA_DURACAO = 0.5;
const ETAPAS_COERENTES = 0.7;

const borda = (ritmo) => (typeof ritmo === 'number' ? { de: ritmo, ate: ritmo } : ritmo);
const limitar = (v) => Math.min(Math.max(v, 0), 1);

export function etapasDoTreino(detalhe) {
  return detalhe.blocos.flatMap((bloco) => Array.from({ length: bloco.repeticoes }, () => bloco.passos.map((p) => ({ ...p, rotulo: p.zona === 'recuperacao' ? 'Recuperação' : bloco.rotulo }))).flat());
}

// Positivo é mais lento que a faixa, negativo é mais rápido, zero está dentro.
export function desvioDoRitmo(segPorKm, ritmo) {
  const { de, ate } = borda(ritmo);
  if (segPorKm > ate + TOLERANCIA_DO_RITMO) return Math.round(segPorKm - ate);
  if (segPorKm < de - TOLERANCIA_DO_RITMO) return Math.round(segPorKm - de);
  return 0;
}

// Só compara se as voltas parecem mesmo as etapas: em corrida livre, a volta automática
// de 1 km não tem relação com o treino, e a comparação seria enganosa.
export function compararEtapas(etapas, voltas) {
  if (etapas.length < 2 || voltas.length < etapas.length) return null;
  const pares = etapas.map((etapa, i) => ({ etapa, volta: voltas[i] }));
  const coerentes = pares.filter(({ etapa, volta }) => {
    if (etapa.km !== undefined) return Math.abs(volta.km - etapa.km) / etapa.km <= FOLGA_DA_DURACAO;
    return Math.abs(volta.seg - etapa.tempoSeg) / etapa.tempoSeg <= FOLGA_DA_DURACAO;
  }).length;
  if (coerentes / etapas.length < ETAPAS_COERENTES) return null;
  const linhas = pares.map(({ etapa, volta }) => {
    const desvio = desvioDoRitmo(volta.seg / volta.km, etapa.ritmo);
    return { etapa, volta, desvio, situacao: desvio === 0 ? 'dentro' : desvio > 0 ? 'lento' : 'rapido' };
  });
  return { linhas, extras: voltas.slice(etapas.length) };
}

export function aderenciaDoTreino({ previstoKm, km, seg, ritmo, dentroDaMeta = null }) {
  if (!previstoKm || !km) return null;
  const distancia = limitar(1 - Math.abs(km - previstoKm) / previstoKm);
  const ritmoReal = dentroDaMeta ?? (seg ? limitar(1 - Math.abs(desvioDoRitmo(seg / km, ritmo)) / DESVIO_QUE_ZERA_O_RITMO) : null);
  if (ritmoReal === null) return { total: distancia, distancia, ritmo: null, maiorDivergencia: distancia < 0.9 ? 'Distância' : null };
  const maiorDivergencia = Math.min(distancia, ritmoReal) >= 0.9 ? null : distancia < ritmoReal ? 'Distância' : 'Ritmo';
  return { total: (distancia + ritmoReal) / 2, distancia, ritmo: ritmoReal, maiorDivergencia };
}
