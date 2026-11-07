// Calendário de provas. A principal define o ciclo da planilha; as anteriores a ela entram como secundárias.
import { calcularVdot, distanciaTemReferencia, limiteDaCorrida, preverTempoSeg, referenciaDaMeta, somarDias } from './motor.js';
import { diasAte } from './visual.js';

export const PRIORIDADES = {
  A: 'Principal',
  B: 'Importante, reduz 2 dias antes',
  C: 'De preparação, sem reduzir',
};

const MARATONA_KM = 42;
const SEMANAS_ENTRE_MARATONAS = 8;

const emOrdem = (provas) => [...provas].sort((a, b) => a.data.localeCompare(b.data));

export function escolherPrincipal(provas, desde) {
  const futuras = emOrdem(provas).filter((p) => p.data >= desde);
  return futuras.find((p) => p.prioridade === 'A') ?? futuras[0] ?? null;
}

export function provasDoCiclo(provas, principal, hoje) {
  return emOrdem(provas).filter((p) => p.data >= hoje && p.id !== principal?.id && (!principal || p.data < principal.data));
}

export function objetivoDaProva(prova) {
  if (!prova) return { distanciaKm: null, dataProva: null, meta: 'terminar' };
  return { distanciaKm: prova.distanciaKm, dataProva: prova.data, meta: prova.meta, nome: prova.nome };
}

export function erroDaProva({ nome, data, distanciaKm }, hoje) {
  if (!nome) return 'Informe o nome da prova.';
  if (!data) return 'Informe a data da prova.';
  if (data < hoje) return 'A data da prova já passou.';
  if (!(distanciaKm > 0) || distanciaKm > 100) return 'Confira a distância da prova.';
  return null;
}

// A corrida do dia só conta como a prova se a distância for parecida: o relógio pode ter gravado
// um aquecimento no mesmo dia. A tolerância de 20% é decisão do app, para acomodar o erro do GPS.
const TOLERANCIA_DA_DISTANCIA = 0.2;

export function corridaDaProva(prova, atividades) {
  const candidatas = atividades
    .filter((a) => a.data === prova.data && a.seg > 0 && Math.abs(a.km - prova.distanciaKm) / prova.distanciaKm <= TOLERANCIA_DA_DISTANCIA)
    .sort((a, b) => Math.abs(a.km - prova.distanciaKm) - Math.abs(b.km - prova.distanciaKm));
  return candidatas[0] ?? null;
}

// Guarda o resultado na prova, porque as corridas antigas saem da lista depois de 12 meses.
// A previsão fica congelada no primeiro registro: ela só vale pelo nível de antes da prova.
export function registrarResultados(provas, atividades, vdot) {
  return provas.map((prova) => {
    const corrida = corridaDaProva(prova, atividades);
    if (!corrida) return prova;
    return {
      ...prova,
      resultado: {
        atividadeId: corrida.id,
        km: corrida.km,
        seg: corrida.seg,
        vdot: Math.round(calcularVdot(prova.distanciaKm, corrida.seg) * 10) / 10,
        previstoSeg: prova.resultado?.previstoSeg ?? Math.round(preverTempoSeg(vdot, prova.distanciaKm)),
      },
    };
  });
}

// Marca como prova o que o intervals.icu não marcou, para o resultado contar no nível.
export function marcarCorridasDeProva(atividades, provas) {
  const ids = new Set(provas.map((p) => corridaDaProva(p, atividades)?.id).filter(Boolean));
  return atividades.map((a) => (ids.has(a.id) ? { ...a, prova: true } : a));
}

// Provas do calendário com resultado e corridas que o relógio marcou como prova, mais recentes primeiro.
export function provasRealizadas(provas, atividades) {
  const doCalendario = provas.filter((p) => p.resultado).map((p) => ({ nome: p.nome, data: p.data, distanciaKm: p.distanciaKm, ...p.resultado }));
  const usadas = new Set(doCalendario.map((p) => p.atividadeId));
  const avulsas = atividades
    .filter((a) => a.prova && a.seg > 0 && !usadas.has(a.id))
    .map((a) => ({ nome: a.nome, data: a.data, distanciaKm: a.km, atividadeId: a.id, km: a.km, seg: a.seg, vdot: Math.round(calcularVdot(a.km, a.seg) * 10) / 10, previstoSeg: null }));
  return [...doCalendario, ...avulsas].sort((a, b) => b.data.localeCompare(a.data));
}

export function melhoresPorDistancia(realizadas) {
  const melhores = new Map();
  for (const prova of realizadas) {
    const atual = melhores.get(prova.distanciaKm);
    if (!atual || prova.seg < atual.seg) melhores.set(prova.distanciaKm, prova);
  }
  return [...melhores.values()].sort((a, b) => a.distanciaKm - b.distanciaKm);
}

// Só o volume previsto: a prova não é treino. Soma as 4 semanas seguidas de maior volume.
export function volumeDoPlano(sessoes) {
  const treinos = sessoes.filter((s) => s.tipo !== 'prova');
  const porSemana = new Map();
  for (const s of treinos) porSemana.set(s.semana, (porSemana.get(s.semana) ?? 0) + s.distanciaKm);
  const semanas = [...porSemana.keys()].sort((a, b) => a - b).map((n) => porSemana.get(n));
  let quatroSemanas = 0;
  for (let i = 0; i < semanas.length; i++) {
    quatroSemanas = Math.max(quatroSemanas, semanas.slice(i, i + 4).reduce((t, km) => t + km, 0));
  }
  return { pico: Math.max(0, ...semanas), quatroSemanas, maior: Math.max(0, ...treinos.map((s) => s.distanciaKm)) };
}

// Maior corrida possível até a prova, se o limite por corrida for usado toda semana.
export function longaoAlcancavel(maiorRecenteKm, semanas) {
  let maior = maiorRecenteKm;
  for (let i = 0; i < semanas; i++) maior = limiteDaCorrida(maior);
  return maior;
}

// Compara com o plano de referência. Não existe critério validado de meta realista: nada aqui
// bloqueia, e o texto diz "abaixo da referência", nunca "impossível".
export function avisosDaProva({ prova, base, hoje, todas = [] }) {
  const avisos = [];
  const referencia = referenciaDaMeta({ distanciaKm: prova.distanciaKm, meta: prova.meta });
  const semanas = Math.floor(diasAte(hoje, prova.data) / 7);

  if (!distanciaTemReferencia(prova.distanciaKm)) {
    avisos.push('Não há plano de referência localizado para esta distância. O app usa o da próxima distância maior.');
  }
  if (semanas < referencia.semanas) {
    avisos.push(`Faltam ${semanas} semanas, e o plano de referência tem ${referencia.semanas}.`);
  }
  if (base.kmSemana < referencia.entrada) {
    avisos.push(`Seu volume é de ${String(Math.round(base.kmSemana * 10) / 10).replace('.', ',')} km por semana, e o plano de referência começa com cerca de ${referencia.entrada} km.`);
  }
  const alcancavel = longaoAlcancavel(base.longoKm, semanas);
  if (alcancavel < referencia.longo) {
    avisos.push(`Pelo limite por corrida, seu longão chegaria a cerca de ${String(alcancavel).replace('.', ',')} km até a prova, e o plano de referência chega a ${referencia.longo} km.`);
  }
  if (prova.distanciaKm >= MARATONA_KM) {
    const inicioDaJanela = somarDias(prova.data, -SEMANAS_ENTRE_MARATONAS * 7);
    const fimDaJanela = somarDias(prova.data, SEMANAS_ENTRE_MARATONAS * 7);
    const perto = todas.some((p) => p.id !== prova.id && p.distanciaKm >= MARATONA_KM && p.data > inicioDaJanela && p.data < fimDaJanela);
    if (perto) avisos.push('Há outra maratona a menos de 8 semanas. Hal Higdon sugere não buscar o melhor esforço nas duas: considere tratar uma como secundária.');
  }
  return avisos;
}
