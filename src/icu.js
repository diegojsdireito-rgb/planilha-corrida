// Cliente do intervals.icu. A chave fica só no aparelho e vai só para intervals.icu.

const BASE = 'https://intervals.icu/api/v1/athlete/0';
const TIPOS_DE_CORRIDA = new Set(['Run', 'TrailRun', 'VirtualRun']);
const CAMPOS_ATIVIDADE = 'id,start_date_local,type,name,distance,icu_distance,moving_time,race,icu_rpe,average_heartrate,source';

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

export function eventoDaSessao(sessao, formatar) {
  const comum = {
    type: 'Run',
    start_date_local: `${sessao.data}T00:00:00`,
    name: sessao.nome,
    external_id: sessao.id,
  };
  if (sessao.tipo === 'prova') {
    return { ...comum, category: 'RACE_A', distance: sessao.distanciaKm * 1000 };
  }
  return { ...comum, category: 'WORKOUT', description: textoDoTreino(sessao, formatar) };
}

export function normalizarAtividade(a) {
  const metros = a.icu_distance ?? a.distance ?? 0;
  return {
    id: a.id,
    data: String(a.start_date_local ?? '').slice(0, 10),
    nome: a.name ?? 'Corrida',
    km: metros / 1000,
    seg: a.moving_time ?? 0,
    prova: Boolean(a.race),
    rpe: a.icu_rpe ?? null,
    fcMedia: a.average_heartrate ?? null,
    origem: a.source ?? null,
  };
}

export function criarCliente({ chave, buscar = (...args) => fetch(...args) }) {
  const cabecalhos = {
    Authorization: `Basic ${btoa(`API_KEY:${chave}`)}`,
    'Content-Type': 'application/json',
  };

  async function pedir(caminho, opcoes = {}) {
    let resposta;
    try {
      resposta = await buscar(`${BASE}${caminho}`, { ...opcoes, headers: cabecalhos });
    } catch {
      throw new Error('Não consegui falar com o intervals.icu. Confira sua internet.');
    }
    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error('O intervals.icu recusou a chave. Confira a chave de API nos Ajustes.');
    }
    if (!resposta.ok) throw new Error(`O intervals.icu respondeu com erro ${resposta.status}.`);
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : null;
  }

  return {
    testar: () => pedir(''),

    // Atividades que vieram só do Strava chegam sem dados pela API, por decisão do Strava.
    async atividades(de, ate) {
      const lista = await pedir(`/activities?oldest=${de}&newest=${ate}&fields=${CAMPOS_ATIVIDADE}`);
      const corridas = lista.filter((a) => !a.type || TIPOS_DE_CORRIDA.has(a.type));
      const normalizadas = corridas.map(normalizarAtividade);
      return {
        atividades: normalizadas.filter((a) => a.km > 0),
        semDados: normalizadas.filter((a) => a.km === 0).length,
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
