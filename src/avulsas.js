// Caminhadas e outros exercícios. Ficam fora de estado.atividades de propósito:
// não entram no volume de corrida, no nível nem na revisão da planilha.

export const CATEGORIAS = [
  { chave: 'caminhada', nome: 'Caminhada' },
  { chave: 'trilha', nome: 'Trilha' },
  { chave: 'bicicleta', nome: 'Bicicleta' },
  { chave: 'natacao', nome: 'Natação' },
  { chave: 'musculacao', nome: 'Musculação' },
  { chave: 'funcional', nome: 'Funcional' },
  { chave: 'alongamento', nome: 'Yoga ou alongamento' },
  { chave: 'outro', nome: 'Outro exercício' },
];

const CATEGORIA_DO_TIPO = {
  Walk: 'caminhada',
  Hike: 'trilha',
  Ride: 'bicicleta',
  VirtualRide: 'bicicleta',
  GravelRide: 'bicicleta',
  MountainBikeRide: 'bicicleta',
  EBikeRide: 'bicicleta',
  EMountainBikeRide: 'bicicleta',
  Swim: 'natacao',
  OpenWaterSwim: 'natacao',
  WeightTraining: 'musculacao',
  Workout: 'funcional',
  Crossfit: 'funcional',
  HighIntensityIntervalTraining: 'funcional',
  Yoga: 'alongamento',
  Pilates: 'alongamento',
};

const MINUTOS_NO_DIA = 1440;

export const nomeDaCategoria = (chave) => CATEGORIAS.find((c) => c.chave === chave)?.nome ?? 'Outro exercício';

export function avulsaDoIntervals(a) {
  const metros = a.icu_distance ?? a.distance ?? 0;
  return {
    id: a.id,
    data: String(a.start_date_local ?? '').slice(0, 10),
    categoria: CATEGORIA_DO_TIPO[a.type] ?? 'outro',
    nome: a.name ?? null,
    minutos: Math.round((a.moving_time ?? 0) / 60),
    km: metros > 0 ? metros / 1000 : null,
    fcMedia: a.average_heartrate ?? null,
    fcMaxima: a.max_heartrate ?? null,
    subida: a.total_elevation_gain ?? null,
    origem: 'relogio',
  };
}

export function erroDaAvulsa({ categoria, data, minutos, km }, hoje) {
  if (!CATEGORIAS.some((c) => c.chave === categoria)) return 'Escolha a atividade.';
  if (!data) return 'Informe a data.';
  if (data > hoje) return 'A data não pode ser futura.';
  if (!Number.isInteger(minutos) || minutos <= 0) return 'Informe a duração em horas e minutos.';
  if (minutos > MINUTOS_NO_DIA) return 'A duração passa de 24 horas. Confira o valor.';
  if (km !== null && !(km > 0)) return 'Confira a distância, ou deixe em branco.';
  return null;
}

export function juntarAvulsas(manuais, doRelogio) {
  return [...manuais, ...doRelogio].sort((a, b) => b.data.localeCompare(a.data));
}

// ate é exclusivo, como nas semanas do restante do app.
export function resumoPorCategoria(lista, de, ate) {
  const mapa = new Map();
  for (const a of lista) {
    if (a.data < de || a.data >= ate) continue;
    const item = mapa.get(a.categoria) ?? { categoria: a.categoria, nome: nomeDaCategoria(a.categoria), minutos: 0, quantidade: 0 };
    item.minutos += a.minutos;
    item.quantidade += 1;
    mapa.set(a.categoria, item);
  }
  return [...mapa.values()].sort((a, b) => b.minutos - a.minutos);
}

export function duracaoCurta(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (!horas) return `${resto} min`;
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`;
}
