// Motor da planilha: funções puras, sem acesso a tela, rede ou armazenamento.
//
// Fisiologia: fórmulas de Daniels & Gilbert ("Oxygen Power", 1979), a base das
// tabelas VDOT do livro "Daniels' Running Formula".
// Progressão e frequência: regras simples e conservadoras. A literatura não define um limite
// "certo" de aumento nem de dias por semana (Buist 2008; Fredette 2022), então os números são
// prudência, não ciência exata. IMC acima de 30, idade de 45 a 65 anos e lesão prévia entram
// como fatores de risco observados em iniciantes (Nielsen 2013).

// Suba quando a geração mudar: planilhas salvas com outra versão pedem para ser refeitas.
export const VERSAO_REGRAS = 3;

const DISTANCIA_MARATONA = 42.195;

export const RITMOS_POR_FRACAO = {
  leveLento: 0.62,
  leveRapido: 0.7,
  limiar: 0.88,
  intervalado: 1,
};

// ---------- Datas (texto AAAA-MM-DD, sem fuso, para não escorregar de dia) ----------

const paraUTC = (data) => new Date(`${data}T00:00:00Z`);
const deUTC = (d) => d.toISOString().slice(0, 10);

export const somarDias = (data, dias) => {
  const d = paraUTC(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return deUTC(d);
};

export const diaDaSemana = (data) => paraUTC(data).getUTCDay();

export const segundaDaSemana = (data) => somarDias(data, -((diaDaSemana(data) + 6) % 7));

export const proximaSegunda = (data) =>
  diaDaSemana(data) === 1 ? data : somarDias(segundaDaSemana(data), 7);

const diasEntre = (de, ate) => Math.round((paraUTC(ate) - paraUTC(de)) / 86400000);

// ---------- VDOT ----------

const vo2DaVelocidade = (v) => -4.6 + 0.182258 * v + 0.000104 * v * v;

const fracaoDoVo2 = (minutos) =>
  0.8 + 0.1894393 * Math.exp(-0.012778 * minutos) + 0.2989558 * Math.exp(-0.1932605 * minutos);

const velocidadeDoVo2 = (vo2) =>
  (-0.182258 + Math.sqrt(0.182258 ** 2 + 4 * 0.000104 * (vo2 + 4.6))) / (2 * 0.000104);

export function calcularVdot(distanciaKm, tempoSeg) {
  const minutos = tempoSeg / 60;
  return vo2DaVelocidade((distanciaKm * 1000) / minutos) / fracaoDoVo2(minutos);
}

export function preverTempoSeg(vdot, distanciaKm) {
  let min = 60;
  let max = 60 * 60 * 12;
  for (let i = 0; i < 60; i++) {
    const meio = (min + max) / 2;
    if (calcularVdot(distanciaKm, meio) > vdot) min = meio;
    else max = meio;
  }
  return (min + max) / 2;
}

const ritmoDaFracao = (vdot, fracao) => 60000 / velocidadeDoVo2(vdot * fracao);

// Todos os ritmos em segundos por km.
export function calcularRitmos(vdot) {
  return {
    leve: {
      de: Math.round(ritmoDaFracao(vdot, RITMOS_POR_FRACAO.leveRapido)),
      ate: Math.round(ritmoDaFracao(vdot, RITMOS_POR_FRACAO.leveLento)),
    },
    maratona: Math.round(preverTempoSeg(vdot, DISTANCIA_MARATONA) / DISTANCIA_MARATONA),
    meia: Math.round(preverTempoSeg(vdot, DISTANCIA_MARATONA / 2) / (DISTANCIA_MARATONA / 2)),
    limiar: Math.round(ritmoDaFracao(vdot, RITMOS_POR_FRACAO.limiar)),
    intervalado: Math.round(ritmoDaFracao(vdot, RITMOS_POR_FRACAO.intervalado)),
  };
}

export function formatarRitmo(seg) {
  const total = Math.round(seg);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function formatarTempo(seg) {
  const total = Math.round(seg);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}h${String(m).padStart(2, '0')}min${s}s` : `${m}min${s}s`;
}

// ---------- Estimativa inicial a partir dos dados ----------

const VDOT_INICIAL_PRUDENTE = 30;
const vdotPlausivel = (v) => Number.isFinite(v) && v >= 15 && v <= 85;

export function estimarVdot({ atividades = [], tempoInformado = null, hoje }) {
  const limite = somarDias(hoje, -84);
  const candidatos = [];

  if (tempoInformado?.distanciaKm && tempoInformado?.tempoSeg) {
    candidatos.push({
      vdot: calcularVdot(tempoInformado.distanciaKm, tempoInformado.tempoSeg),
      origem: `tempo informado (${tempoInformado.distanciaKm} km em ${formatarTempo(tempoInformado.tempoSeg)})`,
    });
  }
  for (const a of atividades) {
    if (a.data < limite || a.km < 3 || !a.seg) continue;
    candidatos.push({
      vdot: calcularVdot(a.km, a.seg),
      origem: `${a.prova ? 'prova' : 'melhor corrida recente'} de ${a.data.slice(8, 10)}/${a.data.slice(5, 7)} (${a.km.toFixed(1).replace('.', ',')} km em ${formatarTempo(a.seg)})`,
    });
  }

  const validos = candidatos.filter((c) => vdotPlausivel(c.vdot));
  if (!validos.length) {
    return {
      vdot: VDOT_INICIAL_PRUDENTE,
      origem: 'valor inicial prudente, sem tempo recente. Faça um teste de 3 km forte para calibrar.',
    };
  }
  const melhor = validos.reduce((a, b) => (b.vdot > a.vdot ? b : a));
  return { vdot: Math.round(melhor.vdot * 10) / 10, origem: melhor.origem };
}

export function baseDasAtividades(atividades, hoje) {
  const limite = somarDias(hoje, -28);
  const recentes = atividades.filter((a) => a.data >= limite && a.data < hoje);
  const total = recentes.reduce((soma, a) => soma + a.km, 0);
  return {
    kmSemana: Math.round((total / 4) * 10) / 10,
    longoKm: Math.round(Math.max(0, ...recentes.map((a) => a.km)) * 10) / 10,
  };
}

export function avaliarPrudencia({ idade, pesoKg, alturaCm, lesaoRecente }) {
  const motivos = [];
  const imc = pesoKg && alturaCm ? pesoKg / (alturaCm / 100) ** 2 : null;
  if (lesaoRecente) motivos.push('lesão recente informada');
  if (idade >= 45) motivos.push('idade a partir de 45 anos, com maior risco de lesão em quem está começando');
  if (imc !== null && imc >= 30) motivos.push(`IMC ${imc.toFixed(1).replace('.', ',')}, maior impacto nas articulações`);
  return { prudente: motivos.length > 0, motivos, imc: imc === null ? null : Math.round(imc * 10) / 10 };
}

// ---------- Geração da planilha ----------

// Pico semanal e maior corrida dos planos de Hal Higdon, conferidos nas tabelas originais:
// Novice para completar, Intermediate para buscar tempo. São referência de treinador: nenhum
// estudo define volume obrigatório. Sem prova, usar o 5 km Intermediate é decisão do app.
// quatroSemanas é a soma, feita pelo app, das 4 semanas seguidas de maior volume antes do polimento;
// entrada é o volume da semana 1 ou o declarado pelo plano. Partes em minutos não entram nas somas.
const REFERENCIA_POR_META = {
  terminar: {
    5: { pico: 13, longo: 5, quatroSemanas: 46, semanas: 8, entrada: 0 },
    10: { pico: 17, longo: 9, quatroSemanas: 63, semanas: 8, entrada: 0 },
    21.1: { pico: 37, longo: 16, quatroSemanas: 126, semanas: 12, entrada: 14 },
    42.2: { pico: 64, longo: 32, quatroSemanas: 222, semanas: 18, entrada: 24 },
  },
  tempo: {
    5: { pico: 29, longo: 11, quatroSemanas: 93, semanas: 8, entrada: 24 },
    10: { pico: 34, longo: 13, quatroSemanas: 111, semanas: 8, entrada: 24 },
    21.1: { pico: 55, longo: 19, quatroSemanas: 180, semanas: 12, entrada: 27 },
    42.2: { pico: 71, longo: 32, quatroSemanas: 264, semanas: 18, entrada: 39 },
  },
};
const REFERENCIA_SEM_PROVA = { pico: 29, longo: 11, quatroSemanas: 93, semanas: 12, entrada: 0 };
const POLIMENTO = { 5: [0.6], 10: [0.6], 21.1: [0.75, 0.5], 42.2: [0.8, 0.65, 0.45] };
const SEMANAS_SEM_PROVA = 12;
const MAXIMO_SEMANAS = 52;
// Com poucos dias, volume alto só caberia em corridas "leves" longas demais.
const KM_MAX_POR_DIA_DE_TREINO = 14;
const LEVE_MAX_DO_LONGO = 0.75;
const LONGO_MAX_MINUTOS = 180;
const KM_MINIMO_PARA_INTERVALADO = 25;
const MAXIMO_TREINOS_POR_SEMANA = 6;
const MAXIMO_TREINOS_PRUDENTE = 4;
const KM_MINIMO_POR_SEMANA = 9;

const meioKm = (km) => Math.max(0.5, Math.round(km * 2) / 2);

export function referenciaDaMeta({ distanciaKm, meta }) {
  if (!distanciaKm) return REFERENCIA_SEM_PROVA;
  const tabela = REFERENCIA_POR_META[meta === 'tempo' ? 'tempo' : 'terminar'];
  // Distância sem plano localizado usa a próxima maior: decisão do app.
  const chave = Object.keys(tabela).map(Number).sort((a, b) => a - b).find((d) => d >= distanciaKm) ?? 42.2;
  return tabela[chave];
}

export const distanciaTemReferencia = (distanciaKm) => Object.keys(REFERENCIA_POR_META.tempo).map(Number).includes(distanciaKm);

// Nenhuma corrida planejada passa de 10% acima da maior dos últimos 30 dias: associação de
// Frandsen 2025, sem prova de causa. O acréscimo mínimo de 1 km e a base de 5 km são decisão
// do app, porque 10% de pouca distância travaria a progressão de quem está começando.
const JANELA_DA_MAIOR_CORRIDA = 30;
const AUMENTO_MAXIMO_POR_CORRIDA = 0.1;
const ACRESCIMO_MINIMO_KM = 1;
const MAIOR_CORRIDA_MINIMA_KM = 5;

export function limiteDaCorrida(maiorRecenteKm) {
  const maior = Math.max(maiorRecenteKm, MAIOR_CORRIDA_MINIMA_KM);
  return Math.floor(Math.max(maior * (1 + AUMENTO_MAXIMO_POR_CORRIDA), maior + ACRESCIMO_MINIMO_KM) * 2) / 2;
}

function fasesDoPlano(totalSemanas, tamanhoPolimento) {
  const treino = Math.max(1, totalSemanas - tamanhoPolimento);
  const base = Math.round(treino * 0.4);
  const construcao = Math.round(treino * 0.4);
  return (i) => {
    if (i >= treino) return 'polimento';
    if (i < base) return 'base';
    if (i < base + construcao) return 'construcao';
    return 'pico';
  };
}

const ordemNaSemana = (dia) => (dia + 6) % 7; // segunda = 0 ... domingo = 6

// Quanto o volume atual sustenta. Os dias livres são só o limite: nunca uma obrigação.
export function treinosPorSemana(kmSemana, prudente, disponiveis) {
  let treinos = kmSemana < 20 ? 3 : kmSemana < 35 ? 4 : kmSemana < 55 ? 5 : 6;
  if (prudente) treinos = Math.min(treinos, kmSemana < 30 ? 3 : 4);
  return Math.min(treinos, disponiveis, MAXIMO_TREINOS_POR_SEMANA);
}

function combinacoes(itens, tamanho) {
  if (tamanho === 0) return [[]];
  return itens.flatMap((item, i) => combinacoes(itens.slice(i + 1), tamanho - 1).map((resto) => [item, ...resto]));
}

// Distribui os treinos com o maior descanso possível entre eles e preserva o dia seguinte ao longão.
export function escolherDiasDeTreino(disponiveis, diaLongo, quantidade) {
  const ordenados = [...disponiveis].sort((a, b) => ordemNaSemana(a) - ordemNaSemana(b));
  const longo = ordenados.includes(diaLongo) ? diaLongo : ordenados[ordenados.length - 1];
  const outros = ordenados.filter((d) => d !== longo);
  const intervalo = (de, ate) => (ordemNaSemana(ate) - ordemNaSemana(de) + 7) % 7 || 7;

  let melhor = null;
  let melhorNota = -1;
  for (const grupo of combinacoes(outros, quantidade - 1)) {
    const dias = [...grupo, longo].sort((a, b) => ordemNaSemana(a) - ordemNaSemana(b));
    const intervalos = dias.map((d, i) => intervalo(d, dias[(i + 1) % dias.length]));
    const depoisDoLongo = intervalo(longo, dias[(dias.indexOf(longo) + 1) % dias.length]);
    const nota = Math.min(...intervalos) * 10 + (depoisDoLongo >= 2 ? 1 : 0);
    if (nota > melhorNota) {
      melhor = dias;
      melhorNota = nota;
    }
  }
  return { dias: melhor, diaLongo: longo };
}

function dataNaSemana(segunda, dia) {
  return somarDias(segunda, ordemNaSemana(dia));
}

function sessaoLeve(data, km, ritmos, nome = 'Corrida leve', porque = 'Constrói base aeróbica com pouco estresse.') {
  return {
    id: `pc-${data}`,
    data,
    tipo: 'leve',
    nome,
    distanciaKm: km,
    porque,
    blocos: [{ rotulo: nome, repeticoes: 1, passos: [{ km, ritmo: ritmos.leve, zona: 'leve' }] }],
  };
}

function sessaoLongo(data, km, ritmos) {
  return {
    id: `pc-${data}`,
    data,
    tipo: 'longo',
    nome: 'Longão',
    distanciaKm: km,
    porque: 'Aumenta a resistência. O ritmo é confortável: a distância é o objetivo.',
    blocos: [{ rotulo: 'Longão', repeticoes: 1, passos: [{ km, ritmo: ritmos.leve, zona: 'leve' }] }],
  };
}

const AQUECIMENTO_KM = 2;
const DESAQUECIMENTO_KM = 1.5;
const KM_POR_MINUTO_TROTE = 0.15;

function sessaoQualidade(data, fase, distanciaProva, kmSemana, ritmos) {
  // Em volume baixo a sessão encolhe, para não ficar maior que o longão da semana.
  const volumeBaixo = kmSemana < KM_MINIMO_PARA_INTERVALADO;
  const volumeForte = volumeBaixo ? 2 : Math.min(8, Math.max(3, Math.round(kmSemana * 0.08)));
  const kmAquecimento = volumeBaixo ? 1.5 : AQUECIMENTO_KM;
  const kmDesaquecimento = volumeBaixo ? 1 : DESAQUECIMENTO_KM;
  const aquecimento = { rotulo: 'Aquecimento', repeticoes: 1, passos: [{ km: kmAquecimento, ritmo: ritmos.leve, zona: 'leve' }] };
  const desaquecimento = { rotulo: 'Desaquecimento', repeticoes: 1, passos: [{ km: kmDesaquecimento, ritmo: ritmos.leve, zona: 'leve' }] };
  const trote = (minutos) => ({ minutos, ritmo: ritmos.leve, zona: 'recuperacao' });

  let tipo;
  let nome;
  let porque;
  let principal;
  let kmForte;

  if (fase === 'pico' && distanciaProva === 42.2) {
    kmForte = Math.min(16, Math.max(5, Math.round(kmSemana * 0.2)));
    tipo = 'ritmo';
    nome = `${kmForte} km no ritmo de maratona`;
    porque = 'Acostuma o corpo ao ritmo da prova.';
    principal = { rotulo: 'Ritmo de maratona', repeticoes: 1, passos: [{ km: kmForte, ritmo: ritmos.maratona, zona: 'maratona' }] };
  } else if (fase === 'pico' && distanciaProva !== 21.1 && kmSemana >= KM_MINIMO_PARA_INTERVALADO) {
    const repeticoes = Math.min(6, volumeForte);
    kmForte = repeticoes + repeticoes * 2 * KM_POR_MINUTO_TROTE;
    tipo = 'intervalado';
    nome = `${repeticoes} x 1 km intervalado`;
    porque = 'Treina o VO2máx, que é a capacidade máxima de usar oxigênio.';
    principal = { rotulo: 'Principal', repeticoes, passos: [{ km: 1, ritmo: ritmos.intervalado, zona: 'intervalado' }, trote(2)] };
  } else {
    kmForte = volumeForte + volumeForte * KM_POR_MINUTO_TROTE;
    tipo = 'limiar';
    nome = `${volumeForte} x 1 km no limiar`;
    porque = 'Eleva o ritmo que você sustenta por muito tempo.';
    principal = { rotulo: 'Principal', repeticoes: volumeForte, passos: [{ km: 1, ritmo: ritmos.limiar, zona: 'limiar' }, trote(1)] };
  }

  return {
    id: `pc-${data}`,
    data,
    tipo,
    nome,
    distanciaKm: meioKm(kmAquecimento + kmDesaquecimento + kmForte),
    porque,
    blocos: [aquecimento, principal, desaquecimento],
  };
}

// Dias de treino mais distantes do longão, para não colar sessões pesadas.
function diasDeQualidade(dias, diaLongo, quantidade) {
  const distancia = (d) => {
    const dif = Math.abs(ordemNaSemana(d) - ordemNaSemana(diaLongo));
    return Math.min(dif, 7 - dif);
  };
  const escolhidos = [];
  const candidatos = dias.filter((d) => d !== diaLongo).sort((a, b) => distancia(b) - distancia(a));
  for (const d of candidatos) {
    if (escolhidos.length === quantidade) break;
    const coladoEmOutro = escolhidos.some((e) => Math.abs(ordemNaSemana(e) - ordemNaSemana(d)) < 2);
    if (distancia(d) >= 2 && !coladoEmOutro) escolhidos.push(d);
  }
  return escolhidos;
}

function montarSemana({ segunda, fase, km, recuperacao, parametros, ritmos, limiteLongo, semQualidade, indice, dias, diaLongo }) {
  const { objetivo } = parametros;
  const prova = objetivo.dataProva;
  const distancia = objetivo.distanciaKm;
  const ehSemanaDaProva = prova && segundaDaSemana(prova) === segunda;

  if (ehSemanaDaProva) {
    const anteriores = dias
      .map((d) => dataNaSemana(segunda, d))
      .filter((data) => diasEntre(data, prova) >= 2);
    const kmLeve = anteriores.length ? meioKm(Math.min(km, 12) / anteriores.length) : 0;
    const sessoes = anteriores.map((data) =>
      sessaoLeve(data, Math.max(3, kmLeve), ritmos, 'Corrida leve de polimento', 'Mantém o corpo ativo e descansa para a prova.'),
    );
    sessoes.push({
      id: `pc-${prova}`,
      data: prova,
      tipo: 'prova',
      nome: objetivo.nome ?? `Prova de ${String(distancia).replace('.', ',')} km`,
      prioridade: 'A',
      distanciaKm: distancia,
      porque: 'Dia de colher o treino. Comece controlado e solte no final.',
      blocos: [],
    });
    return sessoes;
  }

  const referencia = referenciaDaMeta(objetivo);
  const longoMax = Math.max(referencia.longo, parametros.base.longoKm || 0);
  const longoPeloTempo = (LONGO_MAX_MINUTOS * 60) / ritmos.leve.ate;
  const kmLongo = Math.min(meioKm(Math.min((km * referencia.longo) / referencia.pico, longoMax, longoPeloTempo)), limiteLongo);

  let qtdQualidade = 0;
  if (objetivo.meta === 'tempo' && !semQualidade && !recuperacao && km >= 15) {
    if (fase === 'construcao' || fase === 'polimento') qtdQualidade = 1;
    if (fase === 'pico') qtdQualidade = dias.length >= 5 && !parametros.prudencia?.prudente ? 2 : 1;
  }

  const diasFortes = diasDeQualidade(dias, diaLongo, qtdQualidade);
  const sessoes = [];
  let kmUsados = kmLongo;

  for (const d of diasFortes) {
    const sessao = sessaoQualidade(dataNaSemana(segunda, d), fase, distancia, km, ritmos);
    kmUsados += sessao.distanciaKm;
    sessoes.push(sessao);
  }
  sessoes.push(sessaoLongo(dataNaSemana(segunda, diaLongo), kmLongo, ritmos));

  const leves = dias.filter((d) => d !== diaLongo && !diasFortes.includes(d));
  if (leves.length) {
    const kmLeve = meioKm(Math.max(3, Math.min((km - kmUsados) / leves.length, kmLongo * LEVE_MAX_DO_LONGO)));
    for (const d of leves) sessoes.push(sessaoLeve(dataNaSemana(segunda, d), kmLeve, ritmos));
  }

  return sessoes
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((s) => ({ ...s, semana: indice + 1, fase }));
}

export function gerarPlano(parametros) {
  const { perfil, objetivo, base, vdot, inicio } = parametros;
  const aPartirDe = parametros.aPartirDe ?? inicio;

  if (!perfil.diasSemana || perfil.diasSemana.length < 3) {
    throw new Error('Escolha pelo menos 3 dias de corrida por semana.');
  }

  const distancia = objetivo.distanciaKm;
  const prova = objetivo.dataProva;
  const total = prova
    ? diasEntre(inicio, segundaDaSemana(prova)) / 7 + 1
    : SEMANAS_SEM_PROVA;

  if (total < 2) throw new Error('A prova está perto demais para montar uma planilha. Escolha uma data a partir de duas semanas.');
  if (total > MAXIMO_SEMANAS) throw new Error('A prova está a mais de um ano. Escolha uma data mais próxima.');

  const polimento = prova ? (POLIMENTO[distancia] ?? [0.6]) : [];
  const usados = polimento.slice(-Math.max(1, total - 1));
  const faseDa = fasesDoPlano(total, usados.length);
  const prudencia = parametros.prudencia ?? avaliarPrudencia(perfil);
  const taxa = prudencia.prudente ? 0.05 : 0.1;
  const cicloRecuperacao = prudencia.prudente ? 3 : 4;
  const treinosMaximos = Math.min(
    perfil.diasSemana.length,
    prudencia.prudente ? MAXIMO_TREINOS_PRUDENTE : MAXIMO_TREINOS_POR_SEMANA,
  );
  const referencia = referenciaDaMeta(objetivo);
  const picoPossivel = Math.min(referencia.pico, treinosMaximos * KM_MAX_POR_DIA_DE_TREINO);
  const pico = Math.max(picoPossivel, base.kmSemana);
  const ritmos = calcularRitmos(vdot);

  let carga = Math.max(base.kmSemana, KM_MINIMO_POR_SEMANA);
  const corridasRecentes = [{ data: segundaDaSemana(aPartirDe), km: base.longoKm || 0 }];
  let primeira = true;
  const sessoes = [];

  for (let i = 0; i < total; i++) {
    const segunda = somarDias(inicio, i * 7);
    if (segunda < segundaDaSemana(aPartirDe)) continue;

    const fase = faseDa(i);
    const treino = total - usados.length;
    const recuperacao = fase !== 'polimento' && (i + 1) % cicloRecuperacao === 0 && i + 1 < treino;

    if (!primeira || parametros.progredirNaPrimeira) {
      if (fase !== 'polimento' && !recuperacao) carga = Math.min(carga * (1 + taxa), pico);
    }
    const inicioDaJanela = somarDias(segunda, -JANELA_DA_MAIOR_CORRIDA);
    const maiorRecente = Math.max(...corridasRecentes.filter((c) => c.data >= inicioDaJanela).map((c) => c.km), 0);
    const limiteLongo = limiteDaCorrida(maiorRecente);

    const km = fase === 'polimento' ? carga * usados[i - treino] : recuperacao ? carga * 0.75 : carga;
    const prudenteNoInicio = prudencia.prudente && i < 3;
    const bloqueada = parametros.semQualidadeAte && segunda < parametros.semQualidadeAte;
    const treinos = treinosPorSemana(carga, prudencia.prudente, perfil.diasSemana.length);
    const { dias, diaLongo } = escolherDiasDeTreino(perfil.diasSemana, perfil.diaLongo, treinos);

    const semana = montarSemana({
      segunda,
      fase,
      km,
      recuperacao,
      parametros: { ...parametros, prudencia },
      ritmos,
      limiteLongo,
      semQualidade: prudenteNoInicio || bloqueada,
      indice: i,
      dias,
      diaLongo,
    }).map((s) => ({ ...s, semana: i + 1, fase, recuperacao }));
    sessoes.push(...semana);
    corridasRecentes.push(...semana.filter((s) => s.tipo !== 'prova').map((s) => ({ data: s.data, km: s.distanciaKm })));
    primeira = false;
  }

  const dentroDoCiclo = (parametros.provas ?? []).filter((p) => p.data < somarDias(inicio, total * 7));
  const comProvas = encaixarProvas(sessoes, dentroDoCiclo, { inicio, desde: segundaDaSemana(aPartirDe), ritmos });
  return { versaoRegras: VERSAO_REGRAS, inicio, totalSemanas: total, vdot, ritmos, prudencia, sessoes: comProvas, avisos: avisosDoPlano({ objetivo, base, ritmos, referencia }) };
}

const TIPOS_FORTES = ['limiar', 'intervalado', 'ritmo'];
const KM_MINIMO_ANTES_DA_PROVA = 3;
const REDUCAO_ANTES_DA_PROVA = 0.5;
// Dias sem treino forte depois de uma prova longa: recomendação de treinadores (Higdon, Pfitzinger).
const diasSemForteDepoisDaProva = (distanciaKm) => (distanciaKm >= 42 ? 21 : distanciaKm >= 21 ? 14 : 0);

// A/B/C é consenso de treinadores, sem estudo em recreativos. A prova secundária é o esforço
// forte da semana. B reduz 2 dias antes; C só alivia a véspera; o dia seguinte é descanso (decisão do app).
export function encaixarProvas(sessoes, provas, { inicio, desde, ritmos }) {
  let lista = [...sessoes];
  for (const prova of [...provas].sort((a, b) => a.data.localeCompare(b.data))) {
    if (prova.data < desde) continue;
    const segunda = segundaDaSemana(prova.data);
    const fim = somarDias(segunda, 7);
    const daSemana = (s) => s.data >= segunda && s.data < fim;
    const referencia = lista.find(daSemana);
    const reduzirDias = prova.prioridade === 'B' ? [1, 2] : [1];
    const seguinte = somarDias(prova.data, 1);
    const antes = reduzirDias.map((d) => somarDias(prova.data, -d));
    const limiteSemForte = somarDias(prova.data, diasSemForteDepoisDaProva(prova.distanciaKm));

    lista = lista
      .filter((s) => s.tipo === 'prova' || (s.data !== prova.data && s.data !== seguinte))
      .filter((s) => s.tipo === 'prova' || !(daSemana(s) && TIPOS_FORTES.includes(s.tipo)))
      .filter((s) => !(daSemana(s) && s.tipo === 'longo' && s.distanciaKm <= prova.distanciaKm))
      .map((s) => {
        if (s.tipo === 'prova') return s;
        const veio = (km, nome, porque) => ({ ...sessaoLeve(s.data, km, ritmos, nome, porque), semana: s.semana, fase: s.fase, recuperacao: s.recuperacao });
        const reduzir = antes.includes(s.data) && (prova.prioridade === 'B' || s.tipo === 'longo');
        if (reduzir) return veio(meioKm(Math.max(KM_MINIMO_ANTES_DA_PROVA, s.distanciaKm * REDUCAO_ANTES_DA_PROVA)), 'Corrida leve antes da prova', 'Treino reduzido para chegar descansado à prova.');
        if (s.data > prova.data && s.data < limiteSemForte && TIPOS_FORTES.includes(s.tipo)) return veio(s.distanciaKm, 'Corrida leve de recuperação', 'Sem treino forte depois de uma prova longa.');
        return s;
      });

    lista.push({
      id: `pc-${prova.data}`,
      data: prova.data,
      tipo: 'prova',
      prioridade: prova.prioridade,
      nome: prova.nome,
      distanciaKm: prova.distanciaKm,
      porque: { A: 'Dia de colher o treino. Comece controlado e solte no final.', B: 'Prova secundária: chegue descansado, com poucos dias de redução.' }[prova.prioridade] ?? 'Prova de preparação: faz o papel do treino forte da semana.',
      blocos: [],
      semana: referencia?.semana ?? Math.floor(diasEntre(inicio, segunda) / 7) + 1,
      fase: referencia?.fase ?? 'base',
      recuperacao: referencia?.recuperacao ?? false,
    });
  }
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}

// Mostra o limite em vez de cortar em silêncio. Nada aqui bloqueia a planilha.
function avisosDoPlano({ objetivo, base, ritmos, referencia }) {
  const avisos = [];
  const longoPeloTempo = Math.floor(((LONGO_MAX_MINUTOS * 60) / ritmos.leve.ate) * 2) / 2;
  if (longoPeloTempo < referencia.longo) {
    avisos.push(`O limite de 3 horas, regra de prudência do app, deixa seu longão em até ${String(longoPeloTempo).replace('.', ',')} km. Os planos de referência para esta prova chegam a ${referencia.longo} km.`);
  }
  if (objetivo.distanciaKm && objetivo.meta === 'tempo' && base.kmSemana < referencia.entrada) {
    avisos.push(`Os planos de referência para buscar tempo começam com cerca de ${referencia.entrada} km por semana, e sua base é de ${String(Math.round(base.kmSemana * 10) / 10).replace('.', ',')} km. Isso não impede a planilha, mas o prazo pode ficar curto.`);
  }
  return avisos;
}

// ---------- Detalhes de um treino ----------

// Divisão didática por ritmo, derivada do VDOT. Não usa frequência cardíaca.
export const ZONAS = {
  recuperacao: { codigo: 'Z1', nome: 'Recuperação', sensacao: 'Trote bem solto, para recuperar.' },
  leve: { codigo: 'Z2', nome: 'Leve', sensacao: 'Confortável: dá para conversar em frases completas.' },
  maratona: { codigo: 'Z3', nome: 'Ritmo de maratona', sensacao: 'Firme, mas sustentável por muito tempo.' },
  limiar: { codigo: 'Z4', nome: 'Limiar', sensacao: 'Confortavelmente difícil: só dá para falar poucas palavras.' },
  intervalado: { codigo: 'Z5', nome: 'Intervalado', sensacao: 'Forte: difícil falar durante o esforço.' },
};

const ritmoCentral = (ritmo) => (typeof ritmo === 'number' ? ritmo : (ritmo.de + ritmo.ate) / 2);

// Estimativa usando o meio de cada faixa de ritmo.
export function detalharSessao(sessao, vdot) {
  if (sessao.tipo === 'prova') {
    const tempoSeg = preverTempoSeg(vdot, sessao.distanciaKm);
    return { distanciaKm: sessao.distanciaKm, tempoSeg, ritmoMedio: tempoSeg / sessao.distanciaKm, blocos: [], zonas: [] };
  }

  const porZona = new Map();
  let distanciaKm = 0;
  let tempoSeg = 0;

  const blocos = sessao.blocos.map((bloco) => ({
    ...bloco,
    passos: bloco.passos.map((passo) => {
      const ritmo = ritmoCentral(passo.ritmo);
      const seg = passo.km !== undefined ? passo.km * ritmo : passo.minutos * 60;
      const km = passo.km ?? seg / ritmo;
      distanciaKm += km * bloco.repeticoes;
      tempoSeg += seg * bloco.repeticoes;
      const chave = passo.zona ?? 'leve';
      porZona.set(chave, (porZona.get(chave) ?? 0) + seg * bloco.repeticoes);
      return { ...passo, zona: chave, tempoSeg: seg };
    }),
  }));

  const zonas = Object.keys(ZONAS)
    .filter((chave) => porZona.has(chave))
    .map((chave) => ({ chave, ...ZONAS[chave], tempoSeg: porZona.get(chave), fracao: porZona.get(chave) / tempoSeg }));

  return { distanciaKm, tempoSeg, ritmoMedio: tempoSeg / distanciaKm, blocos, zonas };
}

// ---------- Mudar o dia de um treino ----------

const TIPOS_INTENSOS = ['limiar', 'intervalado', 'ritmo', 'longo', 'prova'];

// Só dentro da mesma semana, para não mudar a carga semanal que a progressão calculou.
export function diasParaMudar({ plano, sessao, atividades, hoje }) {
  const corrida = atividades.some((a) => a.data === sessao.data);
  if (sessao.tipo === 'prova' || sessao.data < hoje || corrida) return [];

  const outras = plano.sessoes.filter((s) => s.id !== sessao.id);
  const segunda = segundaDaSemana(sessao.data);
  // A última prova encerra a planilha: as secundárias no meio dela não travam as semanas seguintes.
  const prova = plano.sessoes.filter((s) => s.tipo === 'prova').at(-1)?.data;
  const opcoes = [];
  for (let i = 0; i < 7; i++) {
    const data = somarDias(segunda, i);
    if (data === sessao.data || data < hoje || (prova && data >= prova)) continue;
    if (outras.some((s) => s.data === data) || atividades.some((a) => a.data === data)) continue;

    const vizinhas = outras.filter((s) => s.data === somarDias(data, -1) || s.data === somarDias(data, 1));
    const forteColado = TIPOS_INTENSOS.includes(sessao.tipo) && vizinhas.some((s) => TIPOS_INTENSOS.includes(s.tipo));
    let aviso = null;
    if (forteColado) aviso = 'Fica colado em outro treino forte. Prefira outro dia, se puder.';
    else if (vizinhas.length) aviso = 'Sem dia de descanso entre este treino e o vizinho.';
    opcoes.push({ data, aviso });
  }
  return opcoes;
}

export function mudarDiaDaSessao(plano, id, novaData) {
  const sessoes = plano.sessoes
    .map((s) => (s.id === id ? { ...s, id: `pc-${novaData}`, data: novaData } : s))
    .sort((a, b) => a.data.localeCompare(b.data));
  return { ...plano, sessoes };
}

// ---------- Revisão: compara o previsto com o realizado ----------

const JANELA_REVISAO_DIAS = 14;
const LIMITE_DIF_VDOT = 3;
const SUBIDA_MAX_VDOT_TREINO = 1.5;
const decimal = (n) => n.toFixed(1).replace('.', ',');

export function analisarRevisao({ plano, atividades, avaliacoes = {}, hoje }) {
  const de = somarDias(hoje, -JANELA_REVISAO_DIAS);
  const naJanela = (data) => data >= de && data < hoje;

  const previstas = plano.sessoes.filter((s) => naJanela(s.data));
  const realizadas = atividades.filter((a) => naJanela(a.data));
  const kmPrevistos = previstas.reduce((soma, s) => soma + s.distanciaKm, 0);
  const kmRealizados = realizadas.reduce((soma, a) => soma + a.km, 0);
  const adesao = kmPrevistos ? kmRealizados / kmPrevistos : null;

  const notas = previstas.map((s) => avaliacoes[s.id]).filter(Boolean);
  const esforcos = [
    ...notas.map((n) => n.esforco),
    ...realizadas.map((a) => a.rpe),
  ].filter((n) => typeof n === 'number' && n > 0);
  const esforco = esforcos.length ? esforcos.reduce((a, b) => a + b, 0) / esforcos.length : null;
  const dor = notas.some((n) => n.dor);

  const motivos = [];
  let acao = 'seguir';
  let fator = 1;

  if (adesao === null) {
    acao = 'semDados';
    motivos.push('Ainda não há treinos previstos nos últimos 14 dias para comparar.');
  } else {
    const pct = Math.round(adesao * 100);
    motivos.push(`Você correu ${decimal(kmRealizados)} km de ${decimal(kmPrevistos)} km previstos (${pct}%).`);
    if (esforco !== null) motivos.push(`Esforço médio informado: ${decimal(esforco)} de 10.`);

    if (dor) {
      acao = 'reduzir';
      fator = 0.7;
      motivos.push('Você marcou dor: volume reduzido e uma semana sem treinos fortes. Se a dor persistir, procure um profissional.');
    } else if (adesao < 0.6 || (esforco !== null && esforco >= 8.5)) {
      acao = 'reduzir';
      fator = 0.8;
      motivos.push('A carga ficou acima do que coube na sua rotina ou recuperação: volume reduzido e uma semana sem treinos fortes.');
    } else if (adesao < 0.85 || (esforco !== null && esforco >= 7.5)) {
      acao = 'manter';
      motivos.push('Sem aumento de volume na próxima semana, para consolidar a carga atual.');
    } else {
      motivos.push('Treino em dia e esforço controlado: a progressão continua.');
    }
  }

  // Ritmos: prova vale pelo que mostrou; treino só sobe, e aos poucos.
  let novoVdot = plano.vdot;
  const provas = realizadas.filter((a) => a.prova && a.km >= 3 && a.seg);
  const fortes = realizadas.filter((a) => !a.prova && a.km >= 3 && a.seg && a.rpe >= 8);
  const valor = (a) => calcularVdot(a.km, a.seg);

  if (provas.length) {
    const melhor = Math.max(...provas.map(valor));
    novoVdot = Math.min(plano.vdot + LIMITE_DIF_VDOT, Math.max(plano.vdot - LIMITE_DIF_VDOT, melhor));
  } else if (fortes.length) {
    const melhor = Math.max(...fortes.map(valor));
    if (melhor >= plano.vdot + 1) novoVdot = Math.min(melhor, plano.vdot + SUBIDA_MAX_VDOT_TREINO);
  }
  novoVdot = Math.round(novoVdot * 10) / 10;
  if (novoVdot !== plano.vdot) {
    motivos.push(`Seu nível estimado passou de ${decimal(plano.vdot)} para ${decimal(novoVdot)}, e os ritmos foram atualizados.`);
  }

  return {
    acao,
    fator,
    adesao,
    esforco,
    dor,
    novoVdot,
    motivos,
    kmSemanaReal: Math.round((kmRealizados / 2) * 10) / 10,
    longoReal: Math.round(Math.max(0, ...realizadas.map((a) => a.km)) * 10) / 10,
  };
}

function resumoDaSemana(sessoes, segunda) {
  const fim = somarDias(segunda, 7);
  const lista = sessoes.filter((s) => s.data >= segunda && s.data < fim);
  return { treinos: lista.length, km: lista.reduce((t, s) => t + s.distanciaKm, 0) };
}

// Refaz a estimativa com as corridas atuais. Não altera nada: devolve a planilha nova e a comparação.
export function reanalisarPlano({ plano, parametros, atividades, tempoInformado, hoje }) {
  const aPartirDe = hoje < plano.inicio ? plano.inicio : proximaSegunda(hoje);
  const ultimaData = plano.sessoes[plano.sessoes.length - 1]?.data;
  if (!ultimaData || aPartirDe > ultimaData) return null;

  const estimativa = estimarVdot({ atividades, tempoInformado, hoje });
  const base = baseDasAtividades(atividades, hoje);
  const novo = gerarPlano({ ...parametros, vdot: estimativa.vdot, inicio: plano.inicio, aPartirDe, base });
  const sessoes = [...plano.sessoes.filter((s) => s.data < aPartirDe), ...novo.sessoes];

  return {
    plano: { ...novo, sessoes },
    origem: estimativa.origem,
    base,
    aPartirDe,
    antes: { vdot: plano.vdot, ...resumoDaSemana(plano.sessoes, aPartirDe) },
    depois: { vdot: estimativa.vdot, ...resumoDaSemana(sessoes, aPartirDe) },
  };
}

const diasDaGrade = (sessoes, segunda) => {
  const fim = somarDias(segunda, 7);
  return sessoes.filter((s) => s.data >= segunda && s.data < fim).map((s) => diaDaSemana(s.data));
};

// Troca só a distribuição na semana. A carga vem da própria planilha, não das corridas:
// sem isso, quem não tem o Garmin conectado voltaria ao volume inicial.
function baseDaPlanilha(plano, aPartirDe) {
  const restantes = plano.sessoes.filter((s) => s.data >= aPartirDe);
  if (!restantes.length) return null;
  const semanaAlvo = restantes[0].semana;
  const comCargaCheia = plano.sessoes.filter((s) => s.semana <= semanaAlvo && !s.recuperacao && s.fase !== 'polimento' && s.tipo !== 'prova');
  const semanaBase = comCargaCheia.length ? comCargaCheia[comCargaCheia.length - 1].semana : semanaAlvo;
  const daBase = plano.sessoes.filter((s) => s.semana === semanaBase && s.tipo !== 'prova');
  return {
    kmSemana: daBase.reduce((t, s) => t + s.distanciaKm, 0),
    longoKm: Math.max(0, ...daBase.map((s) => s.distanciaKm)),
  };
}

// Refaz da próxima segunda em diante com a prova principal e as secundárias do calendário.
// Prova nesta semana entra no que ainda não passou, sem refazer a semana inteira.
export function refazerComProvas({ plano, parametros, provas, hoje }) {
  const aPartirDe = hoje < plano.inicio ? plano.inicio : proximaSegunda(hoje);
  const base = baseDaPlanilha(plano, aPartirDe);
  if (!base) return null;

  const novo = gerarPlano({
    ...parametros,
    provas: provas.filter((p) => p.data >= aPartirDe),
    vdot: plano.vdot,
    inicio: plano.inicio,
    aPartirDe,
    base,
  });
  const anteriores = plano.sessoes.filter((s) => s.data < aPartirDe);
  const emAberto = anteriores.filter((s) => s.data >= hoje && s.tipo !== 'prova');
  const destaSemana = encaixarProvas(emAberto, provas.filter((p) => p.data < aPartirDe), { inicio: plano.inicio, desde: hoje, ritmos: plano.ritmos });
  const sessoes = [...anteriores.filter((s) => s.data < hoje), ...destaSemana, ...novo.sessoes];

  return {
    plano: { ...novo, sessoes },
    aPartirDe,
    antes: { vdot: plano.vdot, ...resumoDaSemana(plano.sessoes, aPartirDe) },
    depois: { vdot: plano.vdot, ...resumoDaSemana(sessoes, aPartirDe) },
  };
}

export function refazerComNovosDias({ plano, parametros, diasSemana, diaLongo, semQualidadeNaPrimeira = false, hoje }) {
  const aPartirDe = hoje < plano.inicio ? plano.inicio : proximaSegunda(hoje);
  const base = baseDaPlanilha(plano, aPartirDe);
  if (!base) return null;

  const perfil = { ...parametros.perfil, diasSemana, diaLongo };
  const novo = gerarPlano({
    ...parametros,
    perfil,
    vdot: plano.vdot,
    inicio: plano.inicio,
    aPartirDe,
    base,
    semQualidadeAte: semQualidadeNaPrimeira ? somarDias(aPartirDe, 7) : null,
  });
  const sessoes = [...plano.sessoes.filter((s) => s.data < aPartirDe), ...novo.sessoes];

  return {
    plano: { ...novo, sessoes },
    perfil,
    aPartirDe,
    antes: { ...resumoDaSemana(plano.sessoes, aPartirDe), dias: diasDaGrade(plano.sessoes, aPartirDe) },
    depois: { ...resumoDaSemana(sessoes, aPartirDe), dias: diasDaGrade(sessoes, aPartirDe) },
  };
}

// Mantém o passado intacto e recalcula só da próxima segunda em diante.
export function aplicarRevisao({ plano, parametros, analise, hoje }) {
  if (analise.acao === 'semDados' && analise.novoVdot === plano.vdot) return plano;

  const aPartirDe = proximaSegunda(hoje);
  const ultimaData = plano.sessoes[plano.sessoes.length - 1]?.data;
  if (!ultimaData || aPartirDe > ultimaData) return plano;

  const novo = gerarPlano({
    ...parametros,
    vdot: analise.novoVdot,
    inicio: plano.inicio,
    aPartirDe,
    base: {
      kmSemana: Math.max(analise.kmSemanaReal * analise.fator, KM_MINIMO_POR_SEMANA),
      longoKm: analise.longoReal,
    },
    progredirNaPrimeira: analise.acao === 'seguir',
    semQualidadeAte: analise.acao === 'reduzir' ? somarDias(aPartirDe, 7) : null,
  });

  return {
    ...novo,
    sessoes: [...plano.sessoes.filter((s) => s.data < aPartirDe), ...novo.sessoes],
  };
}
