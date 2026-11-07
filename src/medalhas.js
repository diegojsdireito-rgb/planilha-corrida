// Conquistas. Funções puras, calculadas sobre o histórico guardado no aparelho.
// Medalha não muda treino nem nível, e nada aqui premia correr sem descanso.

import { ritmoDaProva } from './analise.js';
import { ehAniversario } from './aniversario.js';
import { formatarRitmo, formatarTempo, segundaDaSemana, somarDias } from './motor.js';
import { provasRealizadas } from './provas.js';

export const GRUPOS = [
  { chave: 'recordes', nome: 'Recordes', texto: 'Mudam sempre que você bate a própria marca.' },
  { chave: 'marcos', nome: 'Marcos', texto: 'Cada um vale uma vez e fica para sempre.' },
  { chave: 'datas', nome: 'Datas especiais', texto: 'Corridas em dias que merecem registro.' },
  { chave: 'constancia', nome: 'Constância', texto: 'Semanas seguidas cumprindo a planilha. Semana com dor registrada não quebra a sequência.' },
  { chave: 'provas', nome: 'Provas', texto: 'Resultados das provas concluídas.' },
];

// Corte do app para erro de GPS: 2:30/km é mais rápido que o ritmo de uma prova de elite em 5 km mantido por um amador.
const PACE_MINIMO_VALIDO = 150;
const KM_MINIMO_PARA_PACE = 5;
const FOLGA_ABAIXO = 0.98;
const FOLGA_ACIMA = 1.05;
const DISTANCIAS = [
  { id: '5', nome: '5 km', km: 5, emoji: '⚡' },
  { id: '10', nome: '10 km', km: 10, emoji: '⚡' },
  { id: '21', nome: 'meia maratona', km: 21.1, emoji: '⚡' },
  { id: '42', nome: 'maratona', km: 42.2, emoji: '⚡' },
];
const TOTAIS = [100, 250, 500, 1000];
const SEQUENCIAS = [4, 8, 12, 24];

const texto = (valor) => String(Math.round(valor * 10) / 10).replace('.', ',');
const quilometros = (valor) => `${texto(valor)} km`;

export const corridaValida = (a) => a.km > 0 && a.seg > 0 && a.seg / a.km >= PACE_MINIMO_VALIDO;

// ---------- Histórico além dos 12 meses que o app baixa ----------

const resumoDaCorrida = ({ id, data, km, seg, subida, prova }) => ({ id, data, km, seg, subida: subida ?? null, prova: Boolean(prova) });

// Corrida apagada no intervals.icu some daqui enquanto ainda está na janela baixada.
export function juntarCorridas(arquivo, atividades, inicioDaJanela) {
  const atuais = new Set(atividades.map((a) => String(a.id)));
  return [...(arquivo ?? []).filter((a) => a.data < inicioDaJanela && !atuais.has(String(a.id))), ...atividades];
}

// Corrida manual já fica guardada à parte, sem prazo.
export const arquivarCorridas = (arquivo, atividades, inicioDaJanela) => juntarCorridas(arquivo, atividades, inicioDaJanela).filter((a) => a.id).map(resumoDaCorrida);

// Só semanas já terminadas. O app não sabe por que um treino faltou, mas sabe quando houve dor.
export function situacaoDasSemanas({ sessoes = [], corridas = [], avaliacoes = {}, hoje }) {
  const atual = segundaDaSemana(hoje);
  const porSemana = new Map();
  for (const s of sessoes) {
    const segunda = segundaDaSemana(s.data);
    if (segunda < atual) porSemana.set(segunda, [...(porSemana.get(segunda) ?? []), s]);
  }
  const situacoes = {};
  for (const [segunda, previstas] of porSemana) {
    const fim = somarDias(segunda, 7);
    const feitas = corridas.filter((a) => a.data >= segunda && a.data < fim && corridaValida(a)).length;
    if (feitas >= previstas.length) situacoes[segunda] = 'cumprida';
    else situacoes[segunda] = previstas.some((s) => avaliacoes[s.id]?.dor) ? 'neutra' : 'falhou';
  }
  return situacoes;
}

// ---------- Feriados nacionais ----------

const FERIADOS_FIXOS = {
  '01-01': 'Confraternização Universal',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalho',
  '09-07': 'Independência',
  '10-12': 'Nossa Senhora Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Consciência Negra',
  '12-25': 'Natal',
};

// Algoritmo de Meeus para o domingo de Páscoa.
export function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Carnaval e Corpus Christi são ponto facultativo, não feriado nacional: ficam de fora.
export function feriadoNacional(data) {
  const fixo = FERIADOS_FIXOS[data.slice(5)];
  if (fixo) return fixo;
  return data === somarDias(pascoa(Number(data.slice(0, 4))), -2) ? 'Sexta-feira da Paixão' : null;
}

// ---------- Cálculo ----------

// Percorre em ordem de data e conta quantas vezes a marca foi superada.
function recorde(lista, medida, melhor) {
  let atual = null;
  let vezes = 0;
  for (const item of lista) {
    const valor = medida(item);
    if (valor === null) continue;
    if (!atual || melhor(valor, atual.valor)) {
      if (atual) vezes += 1;
      atual = { valor, data: item.data };
    }
  }
  return atual && { ...atual, vezes };
}

const maior = (a, b) => a > b;
const menor = (a, b) => a < b;

function medalhaDeRecorde({ id, nome, emoji, descricao, achado, formatar }) {
  return {
    id,
    grupo: 'recordes',
    nome,
    emoji,
    descricao,
    conquistada: Boolean(achado),
    data: achado?.data ?? null,
    detalhe: achado ? formatar(achado.valor) : null,
    vezes: achado?.vezes ?? 0,
    chave: achado ? `${id}:${achado.data}` : null,
  };
}

function medalhaUnica({ id, grupo, nome, emoji, descricao, data, detalhe = null, progresso = null }) {
  return { id, grupo, nome, emoji, descricao, conquistada: Boolean(data), data: data ?? null, detalhe, vezes: 0, progresso, chave: data ? id : null };
}

function recordes(corridas) {
  const semanas = new Map();
  for (const a of corridas) {
    const segunda = segundaDaSemana(a.data);
    const item = semanas.get(segunda) ?? { km: 0, data: a.data };
    semanas.set(segunda, { km: item.km + a.km, data: a.data });
  }
  return [
    medalhaDeRecorde({ id: 'maior-distancia', nome: 'Maior distância', emoji: '📏', descricao: 'Sua corrida mais longa.', achado: recorde(corridas, (a) => a.km, maior), formatar: quilometros }),
    medalhaDeRecorde({ id: 'melhor-pace', nome: 'Melhor pace', emoji: '💨', descricao: `Pace médio mais rápido em corrida de ${KM_MINIMO_PARA_PACE} km ou mais.`, achado: recorde(corridas, (a) => (a.km >= KM_MINIMO_PARA_PACE ? a.seg / a.km : null), menor), formatar: (v) => `${formatarRitmo(v)}/km` }),
    ...DISTANCIAS.map((d) => medalhaDeRecorde({
      id: `melhor-${d.id}`,
      nome: `Melhor ${d.nome}`,
      emoji: d.emoji,
      descricao: `Corrida inteira de cerca de ${d.nome}, com o tempo ajustado à distância exata.`,
      achado: recorde(corridas, (a) => (a.km >= d.km * FOLGA_ABAIXO && a.km <= d.km * FOLGA_ACIMA ? (a.seg * d.km) / a.km : null), menor),
      formatar: formatarTempo,
    })),
    medalhaDeRecorde({ id: 'maior-semana', nome: 'Maior semana', emoji: '📈', descricao: 'Mais quilômetros de corrida em uma semana.', achado: recorde([...semanas.values()], (s) => s.km, maior), formatar: quilometros }),
    medalhaDeRecorde({ id: 'maior-subida', nome: 'Maior subida', emoji: '⛰️', descricao: 'Mais metros de subida em uma corrida.', achado: recorde(corridas, (a) => (a.subida > 0 ? a.subida : null), maior), formatar: (v) => `${Math.round(v)} m` }),
  ];
}

function marcos(corridas) {
  const primeiraCom = (km) => corridas.find((a) => a.km >= km * FOLGA_ABAIXO)?.data;
  const total = corridas.reduce((t, a) => t + a.km, 0);
  const quandoChegou = (meta) => {
    let soma = 0;
    return corridas.find((a) => {
      soma += a.km;
      return soma >= meta;
    })?.data;
  };
  return [
    medalhaUnica({ id: 'primeira-corrida', grupo: 'marcos', nome: 'Primeira corrida', emoji: '👟', descricao: 'Registre sua primeira corrida.', data: corridas[0]?.data }),
    ...DISTANCIAS.map((d) => medalhaUnica({ id: `primeiros-${d.id}`, grupo: 'marcos', nome: `Primeira de ${d.nome}`, emoji: '🏁', descricao: `Corra ${d.nome} de uma vez.`, data: primeiraCom(d.km) })),
    ...TOTAIS.map((meta) => medalhaUnica({
      id: `total-${meta}`,
      grupo: 'marcos',
      nome: `${meta} km acumulados`,
      emoji: '🛣️',
      descricao: `Some ${meta} km em corridas.`,
      data: quandoChegou(meta),
      progresso: { atual: Math.min(total, meta), meta, texto: `${texto(Math.min(total, meta))} de ${meta} km` },
    })),
  ];
}

function datas(corridas, nascimento) {
  const nosFeriados = corridas.filter((a) => feriadoNacional(a.data));
  const diasDeFeriado = new Set(nosFeriados.map((a) => a.data)).size;
  const ultimaEm = (filtro) => corridas.filter(filtro).at(-1)?.data;
  const ultimoFeriado = nosFeriados.at(-1);
  const repetida = (id, data, base) => {
    const dias = new Set(corridas.filter(base).map((a) => a.data)).size;
    return { data, detalhe: dias > 1 ? `${dias} vezes` : null, chave: data ? `${id}:${dias}` : null };
  };
  const anoNovo = repetida('ano-novo', ultimaEm((a) => a.data.endsWith('-01-01')), (a) => a.data.endsWith('-01-01'));
  const natal = repetida('natal', ultimaEm((a) => a.data.endsWith('-12-25')), (a) => a.data.endsWith('-12-25'));
  const noAniversario = (a) => Boolean(nascimento) && ehAniversario(nascimento, a.data);
  const aniversario = repetida('aniversario', ultimaEm(noAniversario), noAniversario);
  return [
    { ...medalhaUnica({ id: 'feriado', grupo: 'datas', nome: 'Corrida no feriado', emoji: '🎉', descricao: 'Corra em um feriado nacional.', data: ultimoFeriado?.data, detalhe: ultimoFeriado ? `${feriadoNacional(ultimoFeriado.data)}${diasDeFeriado > 1 ? `, ${diasDeFeriado} feriados no total` : ''}` : null }), chave: ultimoFeriado ? `feriado:${diasDeFeriado}` : null },
    { ...medalhaUnica({ id: 'ano-novo', grupo: 'datas', nome: 'Primeira do ano', emoji: '🎆', descricao: 'Corra no dia 1º de janeiro.', data: anoNovo.data, detalhe: anoNovo.detalhe }), chave: anoNovo.chave },
    { ...medalhaUnica({ id: 'natal', grupo: 'datas', nome: 'Corrida de Natal', emoji: '🎄', descricao: 'Corra no dia 25 de dezembro.', data: natal.data, detalhe: natal.detalhe }), chave: natal.chave },
    { ...medalhaUnica({ id: 'aniversario', grupo: 'datas', nome: 'Corrida de aniversário', emoji: '🎂', descricao: nascimento ? 'Corra no dia do seu aniversário.' : 'Informe a data de nascimento nos Ajustes e corra no dia do seu aniversário.', data: aniversario.data, detalhe: aniversario.detalhe }), chave: aniversario.chave },
  ];
}

function sequencias(semanas) {
  const ordenadas = Object.keys(semanas).sort();
  let seguidas = 0;
  let melhor = 0;
  let anterior = null;
  const alcancadas = new Map();
  for (const segunda of ordenadas) {
    const situacao = semanas[segunda];
    if (anterior && somarDias(anterior, 7) !== segunda) seguidas = 0;
    anterior = segunda;
    if (situacao === 'falhou') seguidas = 0;
    if (situacao !== 'cumprida') continue;
    seguidas += 1;
    melhor = Math.max(melhor, seguidas);
    if (!alcancadas.has(seguidas)) alcancadas.set(seguidas, somarDias(segunda, 6));
  }
  return SEQUENCIAS.map((meta) => medalhaUnica({
    id: `sequencia-${meta}`,
    grupo: 'constancia',
    nome: `${meta} semanas seguidas`,
    emoji: '🔥',
    descricao: `Cumpra os treinos da planilha por ${meta} semanas seguidas.`,
    data: alcancadas.get(meta),
    progresso: { atual: Math.min(melhor, meta), meta, texto: `Melhor sequência: ${melhor} de ${meta}` },
  }));
}

function provas(realizadas, analises) {
  const emOrdem = [...realizadas].sort((a, b) => a.data.localeCompare(b.data));
  const melhores = new Map();
  let recordeEmProva = null;
  for (const prova of emOrdem) {
    const distancia = Math.round(prova.distanciaKm);
    const atual = melhores.get(distancia);
    if (atual && prova.seg < atual) recordeEmProva = prova;
    if (!atual || prova.seg < atual) melhores.set(distancia, prova.seg);
  }
  const metadeMelhor = emOrdem.filter((p) => {
    const metades = analises?.[p.atividadeId]?.metades;
    return metades && ritmoDaProva(metades) === 'ganhou';
  }).at(-1);
  const comNome = (p) => p && `${p.nome ?? 'Prova'}, ${formatarTempo(p.seg)}`;
  return [
    medalhaUnica({ id: 'primeira-prova', grupo: 'provas', nome: 'Primeira prova', emoji: '🥇', descricao: 'Conclua sua primeira prova.', data: emOrdem[0]?.data, detalhe: comNome(emOrdem[0]) }),
    { ...medalhaUnica({ id: 'recorde-em-prova', grupo: 'provas', nome: 'Recorde em prova', emoji: '🏆', descricao: 'Supere seu tempo em uma prova da mesma distância.', data: recordeEmProva?.data, detalhe: comNome(recordeEmProva) }), chave: recordeEmProva ? `recorde-em-prova:${recordeEmProva.data}` : null },
    { ...medalhaUnica({ id: 'segunda-metade', grupo: 'provas', nome: 'Segunda metade mais rápida', emoji: '🚀', descricao: 'Termine uma prova com a segunda metade mais rápida que a primeira.', data: metadeMelhor?.data, detalhe: comNome(metadeMelhor) }), chave: metadeMelhor ? `segunda-metade:${metadeMelhor.data}` : null },
  ];
}

export function calcularMedalhas({ corridas = [], semanas = {}, provasDoCalendario = [], analises = {}, nascimento = null }) {
  const validas = corridas.filter(corridaValida).sort((a, b) => a.data.localeCompare(b.data));
  const realizadas = provasRealizadas(provasDoCalendario, validas);
  return [
    // Recorde precisa do dado do relógio: corrida digitada à mão vale nos marcos, não aqui.
    ...recordes(validas.filter((a) => !a.manual)),
    ...marcos(validas),
    ...datas(validas, nascimento),
    ...sequencias(semanas),
    ...provas(realizadas, analises),
  ];
}

// vistas nulo quer dizer que a pessoa ainda não viu nenhuma: tudo do histórico aparece como novo.
export const medalhasNovas = (medalhas, vistas) => medalhas.filter((m) => m.conquistada && !(vistas ?? []).includes(m.chave));

export const chavesConquistadas = (medalhas) => medalhas.filter((m) => m.conquistada).map((m) => m.chave);
