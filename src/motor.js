// Motor da planilha: funções puras, sem acesso a tela, rede ou armazenamento.
//
// Fisiologia: fórmulas de Daniels & Gilbert ("Oxygen Power", 1979), a base das
// tabelas VDOT do livro "Daniels' Running Formula".
// Progressão e frequência: regras simples e conservadoras. A literatura não define um limite
// "certo" de aumento nem de dias por semana (Buist 2008; Fredette 2022), então os números são
// prudência, não ciência exata. IMC acima de 30, idade de 45 a 65 anos e lesão prévia entram
// como fatores de risco observados em iniciantes (Nielsen 2013).

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
      origem: `${a.prova ? 'prova' : 'melhor corrida recente'} de ${a.data} (${a.km.toFixed(1)} km em ${formatarTempo(a.seg)})`,
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

const PICO_KM = { 5: 40, 10: 50, 21.1: 60, 42.2: 75, padrao: 40 };
const LONGO_MAX_KM = { 5: 14, 10: 18, 21.1: 22, 42.2: 32, padrao: 14 };
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

function fracaoDoLongo(dias, distancia) {
  if (distancia === 42.2) return dias <= 4 ? 0.5 : 0.4;
  if (distancia === 21.1) return dias <= 4 ? 0.4 : 0.33;
  return dias <= 3 ? 0.4 : dias === 4 ? 0.33 : 0.3;
}

const meioKm = (km) => Math.max(0.5, Math.round(km * 2) / 2);

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
      nome: `Prova de ${distancia} km`,
      distanciaKm: distancia,
      porque: 'Dia de colher o treino. Comece controlado e solte no final.',
      blocos: [],
    });
    return sessoes;
  }

  const longoMax = LONGO_MAX_KM[distancia] ?? LONGO_MAX_KM.padrao;
  const longoPeloTempo = (LONGO_MAX_MINUTOS * 60) / ritmos.leve.ate;
  const kmLongo = meioKm(Math.min(km * fracaoDoLongo(dias.length, distancia), longoMax, limiteLongo, longoPeloTempo));

  let qtdQualidade = 0;
  if (!semQualidade && !recuperacao && km >= 15) {
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
  const picoPossivel = Math.min(PICO_KM[distancia] ?? PICO_KM.padrao, treinosMaximos * KM_MAX_POR_DIA_DE_TREINO);
  const pico = Math.max(picoPossivel, base.kmSemana);
  const ritmos = calcularRitmos(vdot);

  let carga = Math.max(base.kmSemana, KM_MINIMO_POR_SEMANA);
  let limiteLongo = Math.max(base.longoKm || 0, 5) + 1;
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
    if (fase !== 'polimento' && !recuperacao && !primeira) limiteLongo *= 1.1;

    const km = fase === 'polimento' ? carga * usados[i - treino] : recuperacao ? carga * 0.75 : carga;
    const prudenteNoInicio = prudencia.prudente && i < 3;
    const bloqueada = parametros.semQualidadeAte && segunda < parametros.semQualidadeAte;
    const treinos = treinosPorSemana(carga, prudencia.prudente, perfil.diasSemana.length);
    const { dias, diaLongo } = escolherDiasDeTreino(perfil.diasSemana, perfil.diaLongo, treinos);

    sessoes.push(
      ...montarSemana({
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
      }).map((s) => ({ ...s, semana: i + 1, fase, recuperacao })),
    );
    primeira = false;
  }

  return { inicio, totalSemanas: total, vdot, ritmos, prudencia, sessoes };
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
