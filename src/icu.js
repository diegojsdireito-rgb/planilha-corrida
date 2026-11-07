// Cliente do intervals.icu. A chave fica só no aparelho e vai só para intervals.icu.
import { avulsaDoIntervals } from './avulsas.js';
import { ZONAS } from './motor.js';

const BASE = 'https://intervals.icu/api/v1/athlete/0';
const BASE_ATIVIDADE = 'https://intervals.icu/api/v1/activity';
const CAMINHO_DO_ARQUIVO = { fit: 'fit-file', gpx: 'gpx-file' };
const TIPOS_DE_CORRIDA = new Set(['Run', 'TrailRun', 'VirtualRun']);
const CAMPOS_ATIVIDADE = 'id,start_date_local,type,name,distance,icu_distance,moving_time,race,icu_rpe,average_heartrate,max_heartrate,total_elevation_gain,icu_hr_zone_times,source,elapsed_time,calories';

// Texto no formato do construtor de treinos do intervals.icu. "m" significa minutos,
// por isso distância fracionada vai em metros ("1500mtr").
const textoDistancia = (km) => (Number.isInteger(km) ? `${km}km` : `${Math.round(km * 1000)}mtr`);

function textoRitmo(ritmo, formatar) {
  if (typeof ritmo === 'number') return `${formatar(ritmo)}/km Pace`;
  return `${formatar(ritmo.de)}/km-${formatar(ritmo.ate)}/km Pace`;
}

export function textoDoTreino(sessao, formatar) {
  return sessao.blocos
    .map((bloco) => {
      const titulo = bloco.repeticoes > 1 ? `${bloco.rotulo} ${bloco.repeticoes}x` : bloco.rotulo;
      const passos = bloco.passos.map((p) => {
        const duracao = p.km !== undefined ? textoDistancia(p.km) : `${p.minutos}m`;
        return `- ${duracao} ${textoRitmo(p.ritmo, formatar)}`;
      });
      return [titulo, ...passos].join('\n');
    })
    .join('\n\n');
}

const DIAS_NO_TITULO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPOS_NAS_NOTAS = { leve: 'Corrida leve', longo: 'Longão', limiar: 'Limiar', intervalado: 'Intervalado', ritmo: 'Ritmo de prova' };

const bordaDoRitmo = (ritmo) => (typeof ritmo === 'number' ? { de: ritmo, ate: ritmo } : ritmo);
const umaCasa = (valor) => String(Math.round(valor * 10) / 10).replace('.', ',');

// Quanto o treino pode durar e medir dentro das faixas de ritmo prescritas.
export function faixaDoTreino(sessao) {
  const soma = { kmMin: 0, kmMax: 0, segMin: 0, segMax: 0 };
  for (const { repeticoes, passos } of sessao.blocos) {
    for (const passo of passos) {
      const { de, ate } = bordaDoRitmo(passo.ritmo);
      const kmMin = passo.km ?? (passo.minutos * 60) / ate;
      const kmMax = passo.km ?? (passo.minutos * 60) / de;
      soma.kmMin += kmMin * repeticoes;
      soma.kmMax += kmMax * repeticoes;
      soma.segMin += (passo.km !== undefined ? passo.km * de : passo.minutos * 60) * repeticoes;
      soma.segMax += (passo.km !== undefined ? passo.km * ate : passo.minutos * 60) * repeticoes;
    }
  }
  const [kmDe, kmAte] = [umaCasa(soma.kmMin), umaCasa(soma.kmMax)];
  const [minDe, minAte] = [Math.round(soma.segMin / 60), Math.round(soma.segMax / 60)];
  return {
    distancia: kmDe === kmAte ? `${kmDe} km` : `${kmDe} a ${kmAte} km`,
    tempo: minDe === minAte ? `${minDe} min` : `${minDe} a ${minAte} min`,
  };
}

function tituloDoTreino(sessao) {
  const [, mes, dia] = sessao.data.split('-');
  const semana = DIAS_NO_TITULO[new Date(`${sessao.data}T12:00:00Z`).getUTCDay()];
  const { distancia, tempo } = faixaDoTreino(sessao);
  return `${dia}/${mes} ${semana} - ${sessao.nome} - ${distancia} - ${tempo}`;
}

function textoDaIntensidade(ritmo, formatar) {
  const { de, ate } = bordaDoRitmo(ritmo);
  return de === ate ? `${formatar(de)} min/km` : `${formatar(de)} a ${formatar(ate)} min/km`;
}

function textoDoPasso(passo, formatar) {
  const zona = ZONAS[passo.zona ?? 'leve'];
  const duracao = passo.km !== undefined ? `${umaCasa(passo.km)} km` : `${passo.minutos} min`;
  return `${duracao}, ${zona.codigo} ${zona.nome} (${textoDaIntensidade(passo.ritmo, formatar)})`;
}

// O Garmin recebeu nas Notas só o primeiro parágrafo da descrição, então tudo fica nele, antes
// dos passos e sem linha em branco. Sem linha começando com "-" nem "3x" colado: no intervals.icu,
// esses padrões viram passos e repetições.
export function notasDoTreino(sessao, formatar) {
  const linhas = sessao.blocos.flatMap((bloco) => {
    if (bloco.repeticoes === 1 && bloco.passos.length === 1) return [`${bloco.rotulo}: ${textoDoPasso(bloco.passos[0], formatar)}`];
    const titulo = bloco.repeticoes > 1 ? `${bloco.rotulo}, repetir ${bloco.repeticoes} vezes:` : `${bloco.rotulo}:`;
    return [titulo, ...bloco.passos.map((p) => `• ${textoDoPasso(p, formatar)}`)];
  });
  const { distancia, tempo } = faixaDoTreino(sessao);
  return [
    ...linhas,
    `Tipo: ${TIPOS_NAS_NOTAS[sessao.tipo]}`,
    `Total: ${distancia}, ${tempo}`,
    sessao.porque ? `Por que: ${sessao.porque}` : null,
  ].filter(Boolean).join('\n');
}

export function eventoDaSessao(sessao, formatar) {
  const comum = {
    type: 'Run',
    start_date_local: `${sessao.data}T00:00:00`,
    name: sessao.nome,
    external_id: sessao.id,
  };
  if (sessao.tipo === 'prova') {
    return { ...comum, category: `RACE_${sessao.prioridade ?? 'A'}`, distance: sessao.distanciaKm * 1000 };
  }
  return {
    ...comum,
    name: tituloDoTreino(sessao),
    category: 'WORKOUT',
    description: `${notasDoTreino(sessao, formatar)}\n\n${textoDoTreino(sessao, formatar)}`,
  };
}

export function normalizarAtividade(a) {
  const metros = a.icu_distance ?? a.distance ?? 0;
  return {
    id: a.id,
    data: String(a.start_date_local ?? '').slice(0, 10),
    nome: a.name ?? 'Corrida',
    km: metros / 1000,
    seg: a.moving_time ?? 0,
    segTotal: a.elapsed_time ?? null,
    calorias: a.calories ?? null,
    hora: String(a.start_date_local ?? '').slice(11, 16) || null,
    prova: Boolean(a.race),
    rpe: a.icu_rpe ?? null,
    fcMedia: a.average_heartrate ?? null,
    fcMaxima: a.max_heartrate ?? null,
    subida: a.total_elevation_gain ?? null,
    tempoPorZonaFc: Array.isArray(a.icu_hr_zone_times) ? a.icu_hr_zone_times : [],
    origem: a.source ?? null,
  };
}

export function criarCliente({ chave, buscar = (...args) => fetch(...args) }) {
  const cabecalhos = {
    Authorization: `Basic ${btoa(`API_KEY:${chave}`)}`,
    'Content-Type': 'application/json',
  };

  async function chamar(url, opcoes = {}) {
    let resposta;
    try {
      resposta = await buscar(url, { ...opcoes, headers: cabecalhos });
    } catch {
      throw new Error('Não consegui falar com o intervals.icu. Confira sua internet.');
    }
    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error('O intervals.icu recusou a chave. Confira a chave de API nos Ajustes.');
    }
    if (!resposta.ok) throw new Error(`O intervals.icu respondeu com erro ${resposta.status}.`);
    return resposta;
  }

  async function pedir(caminho, opcoes = {}) {
    const resposta = await chamar(`${BASE}${caminho}`, opcoes);
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : null;
  }

  return {
    testar: () => pedir(''),

    async arquivoDaCorrida(id, formato) {
      const url = `${BASE_ATIVIDADE}/${encodeURIComponent(id)}/${CAMINHO_DO_ARQUIVO[formato]}`;
      return (await chamar(url)).blob();
    },

    // Pace segundo a segundo. Fica nulo se a corrida não tiver o dado, como em esteira sem sensor.
    async streamsDaCorrida(id) {
      const url = `${BASE_ATIVIDADE}/${encodeURIComponent(id)}/streams.json?types=time,velocity_smooth`;
      const lista = await (await chamar(url)).json();
      const dados = (tipo) => lista.find((s) => s.type === tipo)?.data ?? null;
      const velocidade = dados('velocity_smooth');
      return velocidade?.length ? { tempo: dados('time'), velocidade } : null;
    },

    // Curvas e percurso. Atividade sem GPS não tem mapa, e isso não pode derrubar as curvas.
    async percursoDaAtividade(id) {
      const base = `${BASE_ATIVIDADE}/${encodeURIComponent(id)}`;
      const [curvas, mapa, voltas] = await Promise.allSettled([
        chamar(`${base}/streams.json?types=time,distance,velocity_smooth,heartrate,altitude`).then((r) => r.json()),
        chamar(`${base}/map`).then((r) => r.json()),
        chamar(`${base}/intervals`).then((r) => r.json()),
      ]);
      if (curvas.status === 'rejected' && mapa.status === 'rejected') throw curvas.reason;
      const lista = curvas.status === 'fulfilled' ? curvas.value : [];
      const dados = (tipo) => {
        const serie = lista.find((s) => s.type === tipo);
        return !serie || serie.allNull ? null : serie.data ?? null;
      };
      return {
        tempo: dados('time'),
        distancia: dados('distance'),
        velocidade: dados('velocity_smooth'),
        fc: dados('heartrate'),
        altitude: dados('altitude'),
        latlngs: mapa.status === 'fulfilled' ? mapa.value?.latlngs ?? null : null,
        intervalos: voltas.status === 'fulfilled' ? voltas.value?.icu_intervals ?? [] : [],
      };
    },

    // Atividades que vieram só do Strava chegam sem dados pela API, por decisão do Strava.
    async atividades(de, ate) {
      const lista = await pedir(`/activities?oldest=${de}&newest=${ate}&fields=${CAMPOS_ATIVIDADE}`);
      const corridas = lista.filter((a) => !a.type || TIPOS_DE_CORRIDA.has(a.type));
      const normalizadas = corridas.map(normalizarAtividade);
      return {
        atividades: normalizadas.filter((a) => a.km > 0),
        semDados: normalizadas.filter((a) => a.km === 0).length,
        corridasSemDados: normalizadas.filter((a) => a.km === 0 && a.data),
        outras: lista.filter((a) => a.type && !TIPOS_DE_CORRIDA.has(a.type) && a.moving_time > 0).map(avulsaDoIntervals),
      };
    },

    // Troca os treinos futuros deste app. Só remove por external_id os que o próprio app enviou,
    // nunca outros itens do calendário.
    async enviarTreinos(sessoes, idsParaTrocar, formatar) {
      if (idsParaTrocar.length) {
        await pedir('/events/bulk-delete', {
          method: 'PUT',
          body: JSON.stringify(idsParaTrocar.map((external_id) => ({ external_id }))),
        });
      }
      if (!sessoes.length) return [];
      return pedir('/events/bulk?upsert=false&upsertOnUid=false&updatePlanApplied=false', {
        method: 'POST',
        body: JSON.stringify(sessoes.map((s) => eventoDaSessao(s, formatar))),
      });
    },
  };
}
