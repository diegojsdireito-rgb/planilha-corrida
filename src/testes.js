// Testes de campo: Cooper (12 minutos) e 3 km. Funções puras.
// O resultado estima o nível (VDOT), mas os ritmos só mudam depois da confirmação da pessoa.

import { calcularVdot, preverTempoSeg, segundaDaSemana, somarDias, vdotPlausivel } from './motor.js';
import { melhoresDaCorrida } from './desempenho.js';

export const TESTES = {
  cooper: {
    chave: 'cooper',
    nome: 'Teste de 12 minutos (Cooper)',
    curto: 'Cooper',
    resumo: 'Percorra a maior distância possível em 12 minutos. Quem está começando pode alternar corrida e caminhada.',
    medida: 'distância',
    minimoDeCorrida: 9,
  },
  tres: {
    chave: 'tres',
    nome: 'Teste de 3 km',
    curto: '3 km',
    resumo: 'Corra 3 km no menor tempo que conseguir sustentar, em ritmo constante.',
    medida: 'tempo',
    minimoDeCorrida: 15,
  },
};

const DURACAO_DO_COOPER = 720;
const FOLGA_DO_COOPER = 30; // segundos: corrida um pouco mais curta ainda serve, proporcionalmente.
const KM_DO_TESTE_DE_TRES = 3;
const AQUECIMENTO_MIN = 10;
const VOLTA_A_CALMA_MIN = 10;
const JANELA_PARA_MARCAR = 35; // dias, decisão do app.
export const INTERVALO_DO_RETESTE_DIAS = 56; // 8 semanas, decisão do app.

const meioKm = (km) => Math.max(0.5, Math.round(km * 2) / 2);

// Fórmula de Cooper, em mL/kg/min. Estimativa: não substitui teste de laboratório.
export const vo2DoCooper = (km) => (km * 1000 - 504.9) / 44.73;

function sessaoDeTeste(original, chave, { vdot, ritmos }) {
  const teste = TESTES[chave];
  const ritmoDoTeste = preverTempoSeg(vdot, KM_DO_TESTE_DE_TRES) / KM_DO_TESTE_DE_TRES;
  const leve = { ritmo: ritmos.leve, zona: 'leve', semAlvo: true };
  const principal = chave === 'cooper'
    ? { minutos: DURACAO_DO_COOPER / 60, ritmo: ritmoDoTeste, zona: 'intervalado', semAlvo: true, rotulo: 'Teste' }
    : { km: KM_DO_TESTE_DE_TRES, ritmo: ritmoDoTeste, zona: 'intervalado', semAlvo: true, rotulo: 'Teste' };
  const centroLeve = (ritmos.leve.de + ritmos.leve.ate) / 2;
  const kmDoTeste = chave === 'cooper' ? DURACAO_DO_COOPER / ritmoDoTeste : KM_DO_TESTE_DE_TRES;
  const minutosFora = AQUECIMENTO_MIN + VOLTA_A_CALMA_MIN;
  return {
    ...original,
    tipo: 'teste',
    teste: chave,
    nome: teste.nome,
    distanciaKm: meioKm(kmDoTeste + (minutosFora * 60) / centroLeve),
    minutosTotal: chave === 'cooper' ? minutosFora + DURACAO_DO_COOPER / 60 : undefined,
    porque: 'Mede o seu nível com um esforço real, para ajustar os ritmos da planilha. Só muda algo depois da sua confirmação.',
    blocos: [
      { rotulo: 'Aquecimento', repeticoes: 1, passos: [{ ...leve, minutos: AQUECIMENTO_MIN, rotulo: 'Aquecimento' }] },
      { rotulo: 'Teste', repeticoes: 1, passos: [principal] },
      { rotulo: 'Volta à calma', repeticoes: 1, passos: [{ ...leve, minutos: VOLTA_A_CALMA_MIN, rotulo: 'Volta à calma' }] },
    ],
    original,
  };
}

// Só em treino leve ainda não feito. Quem está na iniciação espera os trechos de corrida crescerem.
export function sessoesParaTeste({ plano, chave, corridas = [], ligacoes = {}, naoFeitos = {}, hoje }) {
  const limite = somarDias(hoje, JANELA_PARA_MARCAR);
  const ligadas = new Set(Object.values(ligacoes));
  const semanasComTeste = new Set(plano.sessoes.filter((s) => s.tipo === 'teste').map((s) => segundaDaSemana(s.data)));
  const minimo = TESTES[chave].minimoDeCorrida;
  return plano.sessoes.filter((s) => s.tipo === 'leve'
    && s.data >= hoje && s.data <= limite
    && s.fase !== 'polimento'
    && (s.minutosCorrida ?? Infinity) >= minimo
    && !semanasComTeste.has(segundaDaSemana(s.data))
    && !naoFeitos[s.id] && !ligadas.has(s.id)
    && !corridas.some((a) => a.data === s.data));
}

export function primeiraDataDoTeste(plano, chave, hoje) {
  const minimo = TESTES[chave].minimoDeCorrida;
  return plano.sessoes.find((s) => s.tipo === 'leve' && s.data >= hoje && (s.minutosCorrida ?? Infinity) >= minimo)?.data ?? null;
}

export function marcarTeste(plano, id, chave) {
  return { ...plano, sessoes: plano.sessoes.map((s) => (s.id === id ? sessaoDeTeste(s, chave, plano) : s)) };
}

export function desmarcarTeste(plano, id) {
  return { ...plano, sessoes: plano.sessoes.map((s) => (s.id === id && s.original ? { ...s.original, id: s.id, data: s.data } : s)) };
}

// Refazer a planilha não pode apagar um teste já marcado.
export function reporTestes(anterior, novo, hoje) {
  let plano = novo;
  for (const teste of anterior.sessoes.filter((s) => s.tipo === 'teste' && s.data >= hoje)) {
    if (plano.sessoes.some((s) => s.id === teste.id && s.tipo === 'teste')) continue;
    const semana = segundaDaSemana(teste.data);
    const leves = plano.sessoes.filter((s) => s.tipo === 'leve' && s.data >= hoje && segundaDaSemana(s.data) === semana);
    const alvo = leves.find((s) => s.data === teste.data) ?? leves[0];
    if (alvo) plano = marcarTeste(plano, alvo.id, teste.teste);
  }
  return plano;
}

// Maior distância em uma janela de 12 minutos, para funcionar mesmo sem volta marcada no relógio.
export function distanciaEmDozeMinutos({ tempo, distancia }) {
  if (!tempo?.length || !distancia?.length) return null;
  const pontos = tempo.map((t, i) => [t, distancia[i]]).filter(([t, d]) => Number.isFinite(t) && Number.isFinite(d));
  if (pontos.length < 2) return null;
  const total = pontos.at(-1)[0] - pontos[0][0];
  if (total < DURACAO_DO_COOPER - FOLGA_DO_COOPER) return null;
  let melhor = 0;
  let inicio = 0;
  for (let fim = 1; fim < pontos.length; fim++) {
    while (pontos[fim][0] - pontos[inicio][0] > DURACAO_DO_COOPER) inicio += 1;
    melhor = Math.max(melhor, pontos[fim][1] - pontos[inicio][1]);
  }
  return melhor > 0 ? melhor / 1000 : null;
}

export function resultadoDasCurvas(chave, dados) {
  if (chave === 'cooper') {
    const km = distanciaEmDozeMinutos(dados);
    return km ? { km: Math.round(km * 100) / 100, seg: DURACAO_DO_COOPER } : null;
  }
  const marca = melhoresDaCorrida(dados).find((m) => m.km === KM_DO_TESTE_DE_TRES);
  return marca ? { km: KM_DO_TESTE_DE_TRES, seg: Math.round(marca.seg) } : null;
}

export function erroDoTeste({ chave, data, km, seg }, hoje) {
  if (!data) return 'Informe a data do teste.';
  if (data > hoje) return 'A data não pode ser futura.';
  if (chave === 'cooper') return km >= 0.6 && km <= 4.8 ? null : 'Em 12 minutos, a distância costuma ficar entre 0,6 e 4,8 km. Confira o valor.';
  return seg >= 450 && seg <= 3600 ? null : 'Em 3 km, o tempo costuma ficar entre 7min30s e 1 hora. Confira o valor.';
}

export function avaliarTeste({ chave, km, seg }) {
  const distancia = chave === 'cooper' ? km : KM_DO_TESTE_DE_TRES;
  const tempo = chave === 'cooper' ? DURACAO_DO_COOPER : seg;
  const vdot = calcularVdot(distancia, tempo);
  return {
    km: distancia,
    seg: tempo,
    ritmo: tempo / distancia,
    vdot: vdotPlausivel(vdot) ? Math.round(vdot * 10) / 10 : null,
    vo2: chave === 'cooper' ? Math.round(vo2DoCooper(distancia) * 10) / 10 : null,
  };
}

export function registrarTeste(lista, teste) {
  return [...lista.filter((t) => t.id !== teste.id), teste].sort((a, b) => a.data.localeCompare(b.data));
}

export function retesteEm(lista) {
  const ultimo = lista.at(-1);
  return ultimo ? somarDias(ultimo.data, INTERVALO_DO_RETESTE_DIAS) : null;
}
