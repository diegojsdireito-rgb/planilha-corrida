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

// O relógio pode gravar a cadência por perna: abaixo de 110, o valor é dobrado para passos por minuto.
export const cadenciaDe = (valor) => (valor > 0 ? Math.round(valor < 110 ? valor * 2 : valor) : null);

export function avulsaDoIntervals(a) {
  const metros = a.icu_distance ?? a.distance ?? 0;
  return {
    id: a.id,
    data: String(a.start_date_local ?? '').slice(0, 10),
    categoria: CATEGORIA_DO_TIPO[a.type] ?? 'outro',
    nome: a.name ?? null,
    minutos: Math.round((a.moving_time ?? 0) / 60),
    seg: a.moving_time ?? 0,
    segTotal: a.elapsed_time ?? null,
    hora: String(a.start_date_local ?? '').slice(11, 16) || null,
    km: metros > 0 ? metros / 1000 : null,
    fcMedia: a.average_heartrate ?? null,
    fcMaxima: a.max_heartrate ?? null,
    subida: a.total_elevation_gain ?? null,
    calorias: a.calories ?? null,
    cadencia: cadenciaDe(a.average_cadence),
    carga: a.icu_training_load ?? null,
    rpe: a.icu_rpe ?? null,
    tempoPorZonaFc: Array.isArray(a.icu_hr_zone_times) ? a.icu_hr_zone_times : [],
    origem: 'relogio',
  };
}

// Caminhar se mede em pace, pedalar em km/h. Nos demais, a velocidade não diz nada útil.
const EM_PACE = new Set(['caminhada', 'trilha', 'corrida']);

export function velocidadeDaAtividade({ categoria, km, seg }) {
  if (!km || !seg) return null;
  if (EM_PACE.has(categoria)) return { nome: 'Pace médio', segPorKm: seg / km };
  if (categoria === 'bicicleta') return { nome: 'Velocidade média', kmPorHora: km / (seg / 3600) };
  return null;
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
    const item = mapa.get(a.categoria) ?? { categoria: a.categoria, nome: nomeDaCategoria(a.categoria), minutos: 0, quantidade: 0, km: 0 };
    item.minutos += a.minutos;
    item.km += a.km ?? 0;
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
