import { compararComPrevisto, ORDEM_DAS_ZONAS, ritmoDaProva, temposPorZona, vereditoDoTreino } from './analise.js';
import { carregar, salvar, exportar, importar, estadoInicial } from './armazenamento.js';
import { ehAniversario, erroDoNascimento, idadeEm } from './aniversario.js';
import { CATEGORIAS, duracaoCurta, erroDaAvulsa, juntarAvulsas, nomeDaCategoria, velocidadeDaAtividade } from './avulsas.js';
import {
  avaliacoesDaRevisao,
  avaliacoesDasSemanas,
  chaveDaCorrida,
  corridasDoTreino,
  corridasParaLigar,
  erroDaCorridaManual,
  MOTIVOS,
  motivoDispensa,
  nomeDoMotivo,
  sessaoDaCorrida,
  sessoesDispensadas,
  situacaoDoTreino,
} from './cumprimento.js';
import { feitoForaDosTreinos, gradeDoMes, mesDe, resumoDaAtividade, somarMeses } from './calendario.js';
import { calcularEnvioAutomatico, DIAS_DE_ANTECEDENCIA, proximoEnvio } from './envio.js';
import {
  adesaoDoPeriodo,
  calcularRecordes,
  compararPeriodos,
  csvDasCorridas,
  registrarNivel,
  resumoSemanal,
  zonasDoPeriodo,
} from './estatisticas.js';
import { abaDoGesto, ligarGestos, ligarPuxada } from './gestos.js';
import { chaveDoFeedback, corridaSemFeedback, feedbackPorSemana, nomeDaSensacao, SENSACOES, valoresDoFeedback } from './feedback.js';
import { aderenciaDoTreino, compararEtapas, etapasDoTreino } from './planejado.js';
import { barrasDeVolume, curvaDaAtividade, linhaDeEvolucao } from './graficos.js';
import { arquivarCorridas, calcularMedalhas, chavesConquistadas, GRUPOS, juntarCorridas, medalhasNovas, situacaoDasSemanas } from './medalhas.js';
import { curvasDaAtividade, enquadrarMapa, parciaisPorKm, pontosDoMapa, voltasDaAtividade } from './percurso.js';
import { erroDoPeso, registrarPeso, resumoDoPeso, imcDe } from './peso.js';
import { criarCliente, eventoDaSessao, faixaDoTreino } from './icu.js';
import {
  analisarRevisao,
  aplicarRevisao,
  avaliarPrudencia,
  baseDasAtividades,
  detalharSessao,
  diasParaMudar,
  estimarVdot,
  formatarRitmo,
  formatarTempo,
  gerarPlano,
  mudarDiaDaSessao,
  preverTempoSeg,
  proximaSegunda,
  reanalisarPlano,
  referenciaDaMeta,
  refazerComNovosDias,
  refazerComProvas,
  segundaDaSemana,
  somarDias,
  VERSAO_REGRAS,
  ZONAS,
} from './motor.js';
import {
  avisosDaProva,
  erroDaProva,
  escolherPrincipal,
  marcarCorridasDeProva,
  melhoresPorDistancia,
  objetivoDaProva,
  PRIORIDADES,
  provasDoCiclo,
  provasRealizadas,
  registrarResultados,
  volumeDoPlano,
} from './provas.js';
import { ORIGENS, REGRAS } from './regras.js';
import { anelDeProgresso, diasAte, diasDaSemana, fasesDoPlano, icone, MARCA, perfilDoTreino } from './visual.js';

const DIAS = [
  { valor: 1, curto: 'Seg', nome: 'Segunda' },
  { valor: 2, curto: 'Ter', nome: 'Terça' },
  { valor: 3, curto: 'Qua', nome: 'Quarta' },
  { valor: 4, curto: 'Qui', nome: 'Quinta' },
  { valor: 5, curto: 'Sex', nome: 'Sexta' },
  { valor: 6, curto: 'Sáb', nome: 'Sábado' },
  { valor: 0, curto: 'Dom', nome: 'Domingo' },
];
const ROTULOS = {
  leve: 'Leve',
  longo: 'Longão',
  limiar: 'Limiar',
  intervalado: 'Intervalado',
  ritmo: 'Ritmo de prova',
  prova: 'Prova',
};
const FASES = { base: 'Base', construcao: 'Construção', pico: 'Pico', polimento: 'Polimento' };
const DIAS_DE_HISTORICO = 365;
const MINUTOS_ENTRE_ATUALIZACOES = 15;

let estado = carregar();
let aba = 'hoje';
let ocupado = false;
let sessaoAberta = null;
let rolagemAnterior = 0;
let cadastroAnterior = {};
let analisePendente = null;
let gradePendente = null;
let avulsaAberta = null;
let provaAberta = null;
let provasPendentes = null;
let atividadeAberta = null;
let medalhasAbertas = false;
let editandoUsuario = false;
let editandoChave = false;
let corridaManualAberta = null;
const secoes = { plano: 'semanas', evolucao: 'resumo' };
const ajustesAbertos = new Set();
let mesVisto = null;
let diaVisto = null;

// Mesmo número da VERSAO em sw.js. Fica visível para conferir qual versão o aparelho abriu.
const VERSAO_APP = '3.5';

const barraDeSecoes = (aba_, opcoes) => `
  <div class="secoes" role="group" aria-label="Seções">
    ${opcoes.map(([id, nome]) => `<button data-secao="${id}" data-secao-de="${aba_}" aria-pressed="${secoes[aba_] === id}">${nome}</button>`).join('')}
  </div>`;

// Recolhível que continua aberto quando a tela é redesenhada.
const grupoDeAjuste = (id, titulo, resumo, conteudo) => `
  <details class="cartao ajuste" data-ajuste="${id}" ${ajustesAbertos.has(id) ? 'open' : ''}>
    <summary><span>${titulo}</span>${resumo ? `<small>${resumo}</small>` : ''}</summary>
    <div class="ajuste-corpo">${conteudo}</div>
  </details>`;

const avisoPlanilhaAntiga = () => (estado.plano.versaoRegras === VERSAO_REGRAS ? '' : `
  <section class="cartao alerta">
    <h2>Esta planilha usa regras antigas</h2>
    <p>As regras da planilha foram corrigidas. Gere de novo para usar as regras atuais: seu cadastro continua preenchido. Até lá, o envio automático fica parado.</p>
    <button class="principal" data-acao="recomecar">Gerar planilha de novo</button>
  </section>`);

const app = document.getElementById('app');
const abas = document.getElementById('abas');
const aviso = document.getElementById('aviso');

// ---------- Utilidades ----------

const esc = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const dataCurta = (data) =>
  new Date(`${data}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });

const dataLonga = (data) =>
  new Date(`${data}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

const numeroKm = (valor) => Number(valor).toFixed(1).replace('.', ',').replace(',0', '');
const km = (valor) => `${numeroKm(valor)} km`;

function guardar() {
  if (!salvar(estado)) mostrarAviso('Não consegui salvar neste aparelho. Exporte uma cópia de segurança nos Ajustes.');
}

let temporizador;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { aviso.hidden = true; }, 5000);
}

// Campos separados porque o teclado numérico do iPhone não tem dois-pontos.
function lerTempo(form) {
  const partes = [form.get('tempoHoras'), form.get('tempoMinutos'), form.get('tempoSegundos')].map((v) => String(v ?? '').trim());
  if (partes.every((p) => p === '')) return { preenchido: false, seg: null };
  const [h, m, s] = partes.map(Number);
  const valido = [h, m, s].every((n) => Number.isInteger(n) && n >= 0) && m < 60 && s < 60;
  const seg = valido ? h * 3600 + m * 60 + s : 0;
  return { preenchido: true, seg: seg > 0 ? seg : null };
}

const numero = (form, nome) => {
  const valor = Number(String(form.get(nome) ?? '').replace(',', '.'));
  return Number.isFinite(valor) && valor > 0 ? valor : null;
};

const textoRitmo = (ritmo) =>
  typeof ritmo === 'number' ? `${formatarRitmo(ritmo)}/km` : `${formatarRitmo(ritmo.de)} a ${formatarRitmo(ritmo.ate)}/km`;

const principalAtual = () => estado.provas.find((p) => p.data === estado.objetivo?.dataProva) ?? null;

const parametrosAtuais = () => ({
  perfil: estado.perfil,
  objetivo: estado.objetivo,
  prudencia: avaliarPrudencia(estado.perfil),
  provas: provasDoCiclo(estado.provas, principalAtual(), hoje()),
});

// A prova do cadastro também aparece no calendário, inclusive em planilhas de versões anteriores.
function garantirProvaDoObjetivo() {
  const { dataProva, distanciaKm, meta, nome } = estado.objetivo ?? {};
  if (!dataProva) return;
  const dados = { data: dataProva, distanciaKm, meta: meta ?? 'terminar' };
  if (estado.provas.some((p) => p.data === dataProva)) {
    estado.provas = estado.provas.map((p) => (p.data === dataProva ? { ...p, ...dados } : p));
    return;
  }
  estado.provas = [...estado.provas, { ...dados, id: `pr-${dataProva}`, nome: nome ?? `Prova de ${String(distanciaKm).replace('.', ',')} km`, prioridade: 'A' }];
}

const atividadeDoDia = (data) => estado.atividades.filter((a) => a.data === data);

async function comOcupado(botao, tarefa) {
  if (ocupado) return;
  ocupado = true;
  const textoOriginal = botao?.textContent;
  if (botao) { botao.disabled = true; botao.textContent = 'Aguarde...'; }
  try {
    await tarefa();
  } catch (erro) {
    mostrarAviso(erro.message);
    if (botao) { botao.disabled = false; botao.textContent = textoOriginal; }
  } finally {
    ocupado = false;
  }
}

// Redesenhar apagaria o que está sendo preenchido.
const podeRedesenhar = () => !avulsaAberta && !provaAberta && !corridaManualAberta &&!document.activeElement?.matches('input, select, textarea');

const todasAvulsas = () => juntarAvulsas(estado.avulsas, estado.outrasDoRelogio);

// ---------- Integração ----------

// O app só baixa 12 meses e a planilha pode ser refeita: o resumo guardado evita perder conquistas.
const inicioDaJanela = () => somarDias(hoje(), -DIAS_DE_HISTORICO);

function semanasDoHistorico() {
  const corridas = juntarCorridas(estado.arquivoDeCorridas, estado.atividades, inicioDaJanela());
  return {
    ...estado.arquivoDeSemanas,
    ...situacaoDasSemanas({ sessoes: estado.plano?.sessoes ?? [], corridas, avaliacoes: avaliacoesDasSemanas(estado.avaliacoes, estado.naoFeitos), hoje: hoje() }),
  };
}

function arquivarHistorico() {
  estado.arquivoDeSemanas = semanasDoHistorico();
  estado.arquivoDeCorridas = arquivarCorridas(estado.arquivoDeCorridas, estado.atividades, inicioDaJanela());
}

const medalhasAtuais = () => calcularMedalhas({
  corridas: juntarCorridas(estado.arquivoDeCorridas, estado.atividades, inicioDaJanela()),
  semanas: semanasDoHistorico(),
  provasDoCalendario: estado.provas,
  analises: estado.analises,
  nascimento: estado.nascimento,
});

// A lista baixada substitui a anterior: as corridas digitadas à mão entram de novo a cada vez.
function reunirCorridas(doRelogio) {
  const todas = [...doRelogio, ...estado.corridasManuais];
  estado.atividades = marcarCorridasDeProva(todas, estado.provas);
  if (estado.plano) estado.provas = registrarResultados(estado.provas, todas, estado.plano.vdot);
}

// A nota de corrida fora de treino entra pela própria corrida; a de treino, pelo treino.
const corridasComNotas = () => estado.atividades.map((a) => {
  const chave = chaveDoFeedback(a, estado.plano.sessoes, estado.ligacoes);
  const nota = estado.avaliacoes[chave];
  if (!nota) return a;
  if (chave !== chaveDaCorrida(a)) return { ...a, temNotaDeTreino: true };
  return { ...a, rpe: nota.esforco ?? a.rpe, sensacao: nota.sensacao ?? null, dor: Boolean(nota.dor) };
});

const dadosDaRevisao = (dia) => ({
  plano: estado.plano,
  atividades: corridasComNotas(),
  avaliacoes: avaliacoesDaRevisao(estado.avaliacoes, estado.naoFeitos),
  dispensados: sessoesDispensadas(estado.naoFeitos),
  hoje: dia,
});

const situacaoDaSessao = (sessao, dia = hoje()) => situacaoDoTreino({ sessao, corridas: estado.atividades, ligacoes: estado.ligacoes, naoFeitos: estado.naoFeitos, hoje: dia });

async function sincronizar(chave = estado.chaveApi) {
  const dia = hoje();
  const { atividades, semDados, corridasSemDados, outras } = await criarCliente({ chave }).atividades(somarDias(dia, -DIAS_DE_HISTORICO), dia);
  reunirCorridas(atividades);
  estado.outrasDoRelogio = outras;
  estado.semDados = semDados;
  estado.corridasSemDados = corridasSemDados;
  arquivarHistorico();
  estado.ultimaSincronizacao = new Date().toISOString();
  guardar();
}

// A corrida chega sozinha ao intervals.icu; o app busca ao abrir e ao voltar para a tela.
async function atualizarSeNecessario() {
  if (!estado.chaveApi || !estado.plano || ocupado || !navigator.onLine) return;
  const ultima = estado.ultimaSincronizacao ? new Date(estado.ultimaSincronizacao).getTime() : 0;
  if (Date.now() - ultima < MINUTOS_ENTRE_ATUALIZACOES * 60000) return;
  const antes = estado.atividades.length;
  try {
    await sincronizar();
  } catch {
    return; // Sem aviso: o botão Atualizar corridas continua disponível.
  }
  const novas = estado.atividades.length - antes;
  if (novas <= 0) return;
  if (podeRedesenhar()) render();
  mostrarAviso(novas === 1 ? 'Nova corrida recebida.' : `${novas} novas corridas recebidas.`);
}

async function atualizarPorGesto() {
  if (!estado.chaveApi) {
    mostrarAviso('Conecte o intervals.icu nos Ajustes para trazer suas corridas.');
    return;
  }
  const antes = estado.atividades.length;
  ocupado = true;
  try {
    await sincronizar();
  } catch (erro) {
    mostrarAviso(erro.message);
    return;
  } finally {
    ocupado = false;
  }
  const novas = estado.atividades.length - antes;
  if (podeRedesenhar()) render();
  if (novas <= 0) mostrarAviso('Nenhuma corrida nova.');
  else mostrarAviso(novas === 1 ? 'Nova corrida recebida.' : `${novas} novas corridas recebidas.`);
  await enviarAutomaticamente();
  await analisarRecentes();
}

async function salvarArquivo(conteudo, nome, tipo) {
  const arquivo = new File([conteudo], nome, { type: tipo });
  // No app instalado do iPhone, o compartilhamento é o caminho confiável para salvar.
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo] });
      return;
    } catch (erro) {
      if (erro.name === 'AbortError') return;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

const assinar = (sessao) => JSON.stringify(eventoDaSessao(sessao, formatarRitmo));

// Sempre remove antes de criar, para o calendário não ficar com treinos repetidos.
async function aplicarEnvio(enviar, remover) {
  const ids = enviar.map((s) => s.id);
  const trocar = [...new Set([...remover, ...ids.filter((id) => estado.enviados.includes(id) || id in estado.assinaturas)])];
  await criarCliente({ chave: estado.chaveApi }).enviarTreinos(enviar, trocar, formatarRitmo);

  const assinaturas = { ...estado.assinaturas };
  for (const id of remover) delete assinaturas[id];
  for (const s of enviar) assinaturas[s.id] = assinar(s);
  estado.assinaturas = assinaturas;
  estado.enviados = [...new Set([...estado.enviados.filter((id) => !remover.includes(id)), ...ids])];
  estado.ultimoEnvio = new Date().toISOString();
  guardar();
}

async function enviarAoRelogio() {
  const dia = hoje();
  const futuras = estado.plano.sessoes.filter((s) => s.data >= dia);
  const idsFuturos = new Set(futuras.map((s) => s.id));
  const remover = estado.enviados.filter((id) => id.slice(3) >= dia && !idsFuturos.has(id));
  await aplicarEnvio(futuras, remover);
}

async function enviarAutomaticamente() {
  if (!estado.envioAutomatico || !estado.chaveApi || !estado.plano || ocupado || !navigator.onLine) return;
  if (estado.plano.versaoRegras !== VERSAO_REGRAS) return; // nunca manda planilha antiga ao relógio
  // Envios anteriores a esta versão não têm assinatura: conta como enviado, com conteúdo a conferir.
  const assinaturas = { ...Object.fromEntries(estado.enviados.map((id) => [id, ''])), ...estado.assinaturas };
  const dia = hoje();
  const { enviar, remover } = calcularEnvioAutomatico({ sessoes: estado.plano.sessoes, assinaturas, assinar, hoje: dia });
  if (!enviar.length && !remover.length) return;

  ocupado = true;
  try {
    await aplicarEnvio(enviar, remover);
    estado.erroEnvioAutomatico = null;
    guardar();
    if (enviar.length) mostrarAviso(`${enviar.length} treino(s) enviados ao intervals.icu.`);
  } catch (erro) {
    estado.erroEnvioAutomatico = erro.message;
    guardar();
  } finally {
    ocupado = false;
  }
  if (podeRedesenhar()) render();
}

function textoEnvioAutomatico() {
  if (!estado.envioAutomatico) return 'Envio automático desligado. Use o botão abaixo ou ligue em Ajustes.';
  const assinaturas = { ...Object.fromEntries(estado.enviados.map((id) => [id, ''])), ...estado.assinaturas };
  const proximo = proximoEnvio({ sessoes: estado.plano.sessoes, assinaturas, hoje: hoje() });
  const quando = proximo ? `A partir de ${dataCurta(proximo)}, a próxima semana será enviada quando você abrir o app.` : 'Todos os treinos já foram enviados.';
  return `Envio automático ligado. ${quando}`;
}

// ---------- Boas-vindas ----------

function telaBoasVindas() {
  abas.hidden = true;
  app.innerHTML = `
    <section class="heroi">
      <svg class="heroi-arte" viewBox="0 0 320 96" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <circle cx="160" cy="84" r="46" fill="#f2b134"/>
        <circle cx="160" cy="84" r="66" fill="#f2b134" opacity=".16"/>
        <path d="M0 84h320v12H0Z" fill="#e4572e"/>
        <path d="M150 84h20l14 12h-48Z" fill="#14171f"/>
      </svg>
      <h1>Run Glória</h1>
      <p>Monta seus treinos e ajusta a planilha pelo que você realmente correu.</p>
    </section>
    <section class="cartao alerta">
      <div class="titulo-icone">${icone('aviso')}<h2>Antes de começar</h2></div>
      <p>A planilha é gerada por regras automáticas. Ela não substitui avaliação médica nem o acompanhamento de um treinador, e não garante evitar lesões.</p>
      <p>Se tiver dor, doença ou alguma restrição, procure orientação profissional antes de seguir os treinos.</p>
    </section>
    <section class="cartao">
      <div class="titulo-icone">${icone('dados')}<h2>Seus dados</h2></div>
      <p>Cadastro, planilha e corridas ficam só neste aparelho. Quem criou o app não recebe nada disso.</p>
      <p>Por isso, se trocar de celular ou apagar os dados do navegador, a planilha se perde. Exporte uma cópia de segurança em Ajustes.</p>
    </section>
    <section class="cartao">
      <div class="titulo-icone">${icone('instalar')}<h2>Instalar no iPhone</h2></div>
      <p>No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Abra o app sempre por esse ícone.</p>
    </section>
    <button class="principal largo" data-acao="ciente">Entendi, começar</button>
    <p class="suave" style="margin-top:12px;text-align:center">Versão ${VERSAO_APP}</p>`;
}

// ---------- Cadastro ----------

const PASSOS_DA_CHAVE = `
  <ol class="motivos suave">
    <li>Crie uma conta gratuita no <a href="https://intervals.icu" target="_blank" rel="noopener">intervals.icu</a>.</li>
    <li>Em Settings, conecte o Garmin diretamente, não pelo Strava, e ligue Upload planned workouts.</li>
    <li>Em Settings, Developer Settings, gere a chave de API e cole aqui. Não passe essa chave a ninguém.</li>
    <li>Depois de gerar a planilha, em Settings, na parte de corrida (Run), preencha Threshold Pace com o seu ritmo de Limiar, que aparece nos Ajustes do app. Sem isso, o relógio pode não receber o alvo de pace.</li>
  </ol>`;

function telaCadastro(valores = {}) {
  abas.hidden = true;
  const v = { peso: '', altura: '', kmSemana: '', longo: '', distanciaTempo: '5', chave: estado.chaveApi, ...valores };
  const diasMarcados = valores.dias ?? [2, 4, 6, 0];
  app.innerHTML = `
    <div class="marca">${MARCA}Run Glória</div>
    <header class="topo">
      <h1>Vamos montar sua planilha</h1>
      <p class="suave">Seus dados ficam só neste aparelho.</p>
    </header>
    <form id="form-cadastro" novalidate>
      <section class="cartao">
        <h2>Sobre você</h2>
        <label>Seu nome<input name="nome" autocomplete="name" maxlength="60" placeholder="Ex.: Maria Silva" value="${esc(estado.nome)}"></label>
        <label>Data de nascimento<input name="nascimento" type="date" autocomplete="bday" max="${hoje()}" value="${esc(estado.nascimento ?? '')}" required></label>
        <div class="linha">
          <label>Peso (kg)<input name="peso" inputmode="decimal" value="${esc(v.peso)}" required></label>
          <label>Altura (cm)<input name="altura" type="number" inputmode="numeric" value="${esc(v.altura)}" required></label>
        </div>
        <label class="marcar"><input type="checkbox" name="lesao" ${v.lesao ? 'checked' : ''}> Tive lesão nos últimos 6 meses</label>
      </section>

      <section class="cartao">
        <h2>Seu objetivo</h2>
        <label>Objetivo
          <select name="distancia">
            ${[['', 'Condicionamento'], ['5', '5 km'], ['10', '10 km'], ['21.1', 'Meia maratona'], ['42.2', 'Maratona']]
              .map(([valor, nome]) => `<option value="${valor}" ${String(v.distancia ?? '10') === valor ? 'selected' : ''}>${nome}</option>`).join('')}
          </select>
        </label>
        <label>Data da prova<input name="dataProva" type="date" value="${esc(v.dataProva ?? '')}"></label>
        <label>O que você quer na prova
          <select name="meta">
            <option value="terminar" ${v.meta === 'tempo' ? '' : 'selected'}>Completar, sem treino forte</option>
            <option value="tempo" ${v.meta === 'tempo' ? 'selected' : ''}>Buscar um tempo, com treino forte</option>
          </select>
        </label>
        <p class="suave">Sem prova marcada, a planilha terá 12 semanas, sem treino forte.</p>
      </section>

      <section class="cartao">
        <h2>Sua rotina</h2>
        <fieldset>
          <legend>Dias em que está livre</legend>
          <p class="suave">A planilha usa só os dias que o seu volume sustenta e deixa descanso entre os treinos.</p>
          <div class="dias">
            ${DIAS.map((d) => `<label><input type="checkbox" name="dias" value="${d.valor}" ${diasMarcados.includes(d.valor) ? 'checked' : ''}><span>${d.curto}</span></label>`).join('')}
          </div>
        </fieldset>
        <label>Dia do longão
          <select name="diaLongo">
            ${DIAS.map((d) => `<option value="${d.valor}" ${Number(v.diaLongo ?? 0) === d.valor ? 'selected' : ''}>${d.nome}</option>`).join('')}
          </select>
        </label>
      </section>

      <section class="cartao">
        <h2>Seu nível hoje</h2>
        <p class="suave">Com o intervals.icu conectado, o histórico recente entra na conta automaticamente.</p>
        <div class="linha">
          <label>Km por semana<input name="kmSemana" inputmode="decimal" value="${esc(v.kmSemana)}"></label>
          <label>Maior corrida recente (km)<input name="longo" inputmode="decimal" value="${esc(v.longo)}"></label>
        </div>
        <label>Tempo recente em
          <select name="distanciaTempo">
            ${[['3', '3 km'], ['5', '5 km'], ['10', '10 km'], ['21.1', 'Meia maratona'], ['42.2', 'Maratona']]
              .map(([valor, nome]) => `<option value="${valor}" ${v.distanciaTempo === valor ? 'selected' : ''}>${nome}</option>`).join('')}
          </select>
        </label>
        <div class="linha3">
          <label>Horas<input name="tempoHoras" type="number" inputmode="numeric" min="0" max="12"></label>
          <label>Minutos<input name="tempoMinutos" type="number" inputmode="numeric" min="0" max="59"></label>
          <label>Segundos<input name="tempoSegundos" type="number" inputmode="numeric" min="0" max="59"></label>
        </div>
      </section>

      <section class="cartao">
        <h2>Conexão com o Garmin (opcional)</h2>
        <p class="suave">Sem a conexão, o app funciona com o que você informar aqui, mas não recebe suas corridas nem envia treinos ao relógio.</p>
        ${PASSOS_DA_CHAVE}
        <label>Chave de API do intervals.icu<input name="chave" type="password" autocomplete="off" value="${esc(v.chave)}"></label>
      </section>

      <p id="erro-cadastro" class="erro" role="alert"></p>
      <button class="principal largo" type="submit">Gerar minha planilha</button>
      <p class="suave" style="margin-top:12px;text-align:center">Versão ${VERSAO_APP}</p>
    </form>`;
}

async function enviarCadastro(evento) {
  evento.preventDefault();
  const form = new FormData(evento.target);
  const erro = document.getElementById('erro-cadastro');
  const dias = form.getAll('dias').map(Number);
  const dataProva = form.get('dataProva') || null;
  const distancia = form.get('distancia') ? Number(form.get('distancia')) : null;
  const chave = String(form.get('chave') ?? '').trim();
  const { preenchido: temTempo, seg: tempoSeg } = lerTempo(form);
  const dia = hoje();

  const problema = (mensagem) => { erro.textContent = mensagem; erro.scrollIntoView({ block: 'center' }); };

  const nascimento = String(form.get('nascimento') ?? '');
  const erroNascimento = erroDoNascimento(nascimento, dia);
  if (erroNascimento) return problema(erroNascimento);
  const idade = idadeEm(nascimento, dia);
  const pesoKg = numero(form, 'peso');
  const alturaCm = numero(form, 'altura');
  if (!pesoKg || !alturaCm) return problema('Preencha peso e altura.');
  if (dias.length < 3) return problema('Marque pelo menos 3 dias livres.');
  if (dataProva && !distancia) return problema('Escolha a distância da prova.');
  if (distancia && !dataProva) return problema('Informe a data da prova, ou escolha Condicionamento.');
  if (temTempo && !tempoSeg) return problema('Confira o tempo: minutos e segundos vão de 0 a 59.');

  const botao = evento.target.querySelector('button[type="submit"]');
  await comOcupado(botao, async () => {
    erro.textContent = '';
    try {
      if (chave) await sincronizar(chave);

      const perfil = {
        idade,
        pesoKg,
        alturaCm,
        lesaoRecente: form.get('lesao') === 'on',
        diasSemana: dias,
        diaLongo: Number(form.get('diaLongo')),
      };
      const objetivo = { distanciaKm: distancia, dataProva, meta: distancia ? String(form.get('meta')) : 'terminar' };
      const tempoInformado = tempoSeg ? { distanciaKm: Number(form.get('distanciaTempo')), tempoSeg } : null;
      const estimativa = estimarVdot({ atividades: estado.atividades, tempoInformado, hoje: dia });
      const historico = baseDasAtividades(estado.atividades, dia);
      const prudencia = avaliarPrudencia(perfil);

      const plano = gerarPlano({
        perfil,
        objetivo,
        prudencia,
        vdot: estimativa.vdot,
        inicio: proximaSegunda(dia),
        base: {
          kmSemana: historico.kmSemana || numero(form, 'kmSemana') || 0,
          longoKm: Math.max(historico.longoKm, numero(form, 'longo') || 0),
        },
        provas: provasDoCiclo(estado.provas, dataProva ? { id: null, data: dataProva } : null, dia).filter((p) => p.data !== dataProva),
      });

      estado = {
        ...estado,
        chaveApi: chave,
        nome: String(form.get('nome') ?? '').trim(),
        nascimento,
        historicoPeso: registrarPeso(estado.historicoPeso, { data: dia, kg: pesoKg }),
        perfil,
        objetivo,
        tempoInformado,
        plano,
        origemVdot: estimativa.origem,
        historicoNivel: registrarNivel(estado.historicoNivel, dia, plano.vdot),
      };
      garantirProvaDoObjetivo();
      guardar();
      aba = 'plano';
      render();
      mostrarAviso('Planilha pronta.');
      setTimeout(enviarAutomaticamente);
    } catch (falha) {
      problema(falha.message);
      throw falha;
    }
  });
}

// ---------- Hoje ----------

const classeTipo = (tipo) => ({ leve: 't-leve', longo: 't-longo', ritmo: 't-ritmo', limiar: 't-forte', intervalado: 't-forte', prova: 't-prova' })[tipo];

const seloTipo = (tipo) => `<span class="selo ${classeTipo(tipo)}">${ROTULOS[tipo]}</span>`;

// Salva a cada toque, sem botão de salvar: é para responder em segundos, logo depois de correr.
function cartaoDeFeedback({ chave, data, titulo, comPular = false }) {
  const corridas = estado.atividades.filter((a) => chaveDoFeedback(a, estado.plano.sessoes, estado.ligacoes) === chave);
  const v = valoresDoFeedback(estado.avaliacoes[chave], corridas);
  return `
    <section class="cartao feedback" data-feedback="${esc(chave)}" data-data="${esc(data)}" data-titulo="${esc(titulo)}" ${comPular ? 'data-com-pular="1"' : ''}>
      <p class="sobretitulo">${esc(titulo)}, ${dataCurta(data)}</p>
      <h2>Como foi o treino?</h2>
      <h3>Esforço</h3>
      <div class="notas" role="group" aria-label="Esforço de 1 a 10">
        ${Array.from({ length: 10 }, (_, i) => i + 1).map((n) => `<button class="nota ${v.esforco === n ? 'marcada' : ''}" data-nota="${n}" aria-pressed="${v.esforco === n}">${n}</button>`).join('')}
      </div>
      <p class="suave notas-legenda"><span>1 muito leve</span><span>10 máximo</span></p>
      ${v.doRelogio ? '<p class="suave">Esta nota veio do relógio. Toque em outra para trocar.</p>' : ''}
      <h3>Como você se sentiu</h3>
      <div class="sensacoes" role="group" aria-label="Como você se sentiu">
        ${SENSACOES.map((s) => `<button class="nota ${v.sensacao === s.valor ? 'marcada' : ''}" data-sensacao="${s.valor}" aria-pressed="${v.sensacao === s.valor}">${s.nome}</button>`).join('')}
      </div>
      <label class="marcar"><input type="checkbox" data-feedback-dor ${v.dor ? 'checked' : ''}> Senti dor</label>
      ${comPular ? '<button class="botao-texto" data-feedback-pular>Responder depois</button>' : ''}
      ${v.dor ? '<p class="suave" style="margin:4px 0 0">Dor reduz a carga na Revisão. Se ela persistir, procure um profissional.</p>' : ''}
    </section>`;
}

function atualizarFeedback(elemento, mudanca) {
  const cartao = elemento.closest('[data-feedback]');
  const { feedback: chave, data, titulo, comPular } = cartao.dataset;
  estado.avaliacoes = { ...estado.avaliacoes, [chave]: { ...estado.avaliacoes[chave], data, ...mudanca } };
  guardar();
  return { cartao, chave, data, titulo, comPular: Boolean(comPular) };
}

function blocoDeFeedbackPendente(dia) {
  const pendente = corridaSemFeedback({ corridas: estado.atividades, sessoes: estado.plano.sessoes, ligacoes: estado.ligacoes, avaliacoes: estado.avaliacoes, hoje: dia });
  if (!pendente) return '';
  return cartaoDeFeedback({ chave: pendente.chave, data: pendente.sessao?.data ?? pendente.corrida.data, titulo: pendente.sessao?.nome ?? pendente.corrida.nome ?? 'Corrida', comPular: true });
}

function blocoFeedbackNaEvolucao(dia) {
  const semanas = feedbackPorSemana({ avaliacoes: estado.avaliacoes, sessoes: estado.plano.sessoes, hoje: dia });
  const respostas = semanas.filter((s) => s.esforco !== null || s.sensacao !== null).length;
  if (!respostas) return '';
  const opcoes = (nome, casas) => ({ nome, formatar: (v) => v.toFixed(casas).replace('.', ','), passoMinimo: 0.5 });
  const grafEsforco = linhaDeEvolucao(semanas.map((s) => ({ data: s.data, valor: s.esforco })), opcoes('Esforço', 1));
  const grafSensacao = linhaDeEvolucao(semanas.map((s) => ({ data: s.data, valor: s.sensacao })), { ...opcoes('Sensação', 1), formatar: (v) => `${v.toFixed(1).replace('.', ',')}, ${nomeDaSensacao(Math.round(v)).toLowerCase()}` , formatarEixo: (v) => v.toFixed(1).replace('.', ',') });
  return `
    <section class="cartao">
      <h2>Esforço e sensação</h2>
      <p class="suave">Média por semana das suas respostas. Mesmo pace com esforço menor é sinal de evolução. Sono, calor e cansaço também mudam a nota.</p>
      ${grafEsforco ? `<h3>Esforço, de 1 a 10</h3>${grafEsforco}` : ''}
      ${grafSensacao ? `<h3>Sensação, de 1 (muito mal) a 5 (muito bem)</h3>${grafSensacao}` : ''}
      ${!grafEsforco && !grafSensacao ? '<p class="suave">O gráfico aparece com respostas em duas semanas ou mais.</p>' : ''}
    </section>`;
}

// ---------- Previsto e feito ----------

const somarCampo = (lista, campo) => {
  const valores = lista.map((a) => a[campo]).filter((v) => v > 0);
  return valores.length ? valores.reduce((t, v) => t + v, 0) : null;
};

function blocoPlanejado(sessao) {
  const r = situacaoDaSessao(sessao);
  if (sessao.tipo === 'prova' || !r.corridas.length) return '';
  const d = detalharSessao(sessao, estado.plano.vdot);
  const faixa = faixaDoTreino(sessao);
  const etapas = etapasDoTreino(d);
  const unica = etapas.length === 1 ? etapas[0].ritmo : null;
  const seg = somarCampo(r.corridas, 'seg');
  const principal = [...r.corridas].sort((a, b) => b.km - a.km)[0];
  const analise = principal.id && analisePronta(principal) ? estado.analises[principal.id] : null;
  const dentroDaMeta = analise?.total ? compararComPrevisto(analise.seg, d.zonas)?.dentro ?? null : null;
  const a = aderenciaDoTreino({ previstoKm: sessao.distanciaKm, km: r.km, seg, ritmo: unica ?? { de: d.ritmoMedio - 15, ate: d.ritmoMedio + 15 }, dentroDaMeta });
  if (!a) return '';
  const pct = Math.round(a.total * 100);
  const titulo = pct >= 85 ? 'Dentro do previsto' : pct >= 60 ? 'Perto do previsto' : 'Diferente do previsto';
  const media = (campo) => {
    const com = r.corridas.filter((c) => c[campo] > 0 && c.seg > 0);
    const tempo = com.reduce((t, c) => t + c.seg, 0);
    return tempo ? com.reduce((t, c) => t + c[campo] * c.seg, 0) / tempo : null;
  };
  const linhas = [
    ['Distância', faixa.distancia, km(Math.round(r.km * 100) / 100)],
    ['Duração', faixa.tempo, seg ? formatarTempo(seg) : null],
    ['Pace', unica ? textoRitmo(unica) : `cerca de ${formatarRitmo(d.ritmoMedio)}/km`, seg ? `${formatarRitmo(seg / r.km)}/km` : null],
    ['FC média', null, media('fcMedia') ? `${Math.round(media('fcMedia'))} bpm` : null],
    ['Subida', null, somarCampo(r.corridas, 'subida') ? `${Math.round(somarCampo(r.corridas, 'subida'))} m` : null],
    ['Cadência', null, media('cadencia') ? `${Math.round(media('cadencia'))} ppm` : null],
    ['Carga', null, somarCampo(r.corridas, 'carga') ? String(Math.round(somarCampo(r.corridas, 'carga'))) : null],
    ['Calorias', null, somarCampo(r.corridas, 'calorias') ? `${Math.round(somarCampo(r.corridas, 'calorias'))} kcal` : null],
  ].filter(([, previsto, real]) => previsto || real);
  return `
    <section class="cartao" data-planejado="${esc(sessao.id)}">
      <h2>Previsto e feito</h2>
      <p class="meta-numero"><b>${pct}%</b> de aderência: ${titulo.toLowerCase()}</p>
      <span class="medalha-progresso" role="img" aria-label="Aderência ao treino: ${pct}%"><i style="width:${pct}%"></i></span>
      ${a.maiorDivergencia ? `<p class="suave" style="margin:6px 0 0">O que mais pesou: ${a.maiorDivergencia.toLowerCase()}.</p>` : ''}
      <table class="ritmos comparacao">
        <thead><tr><th></th><th>Previsto</th><th>Feito</th></tr></thead>
        <tbody>${linhas.map(([nome, previsto, real]) => `<tr><td>${nome}</td><td>${esc(previsto ?? '–')}</td><td>${esc(real ?? '–')}</td></tr>`).join('')}</tbody>
      </table>
      <p class="suave" style="margin:10px 0 0">A aderência é a média entre distância e ritmo, uma fórmula do app. Carga é a calculada pelo intervals.icu.</p>
    </section>`;
}

function htmlDasEtapas(comparacao) {
  const resultado = { rapido: (d) => `${Math.abs(d)} s/km à frente da faixa`, lento: (d) => `${d} s/km atrás da faixa`, dentro: () => 'Na faixa' };
  const duracao = (e) => (e.km !== undefined ? km(e.km) : `${e.minutos} min`);
  const feito = (v) => `${formatarDuracaoCurta(v.seg)} em ${String(Math.round(v.km * 100) / 100).replace('.', ',')} km, ${formatarRitmo(v.seg / v.km)}/km`;
  return `
    <h2 style="margin-top:18px">Trecho a trecho</h2>
    <div class="trechos">
      ${comparacao.linhas.map(({ etapa, volta, desvio, situacao }) => `
        <div class="trecho trecho-${situacao}">
          <p class="trecho-nome"><strong>${esc(etapa.rotulo)}</strong> ${esc(duracao(etapa))}, ${esc(textoRitmo(etapa.ritmo))}</p>
          <p class="trecho-feito">${feito(volta)}</p>
          <p class="suave">${resultado[situacao](desvio)}</p>
        </div>`).join('')}
      ${comparacao.extras.map((v) => `
        <div class="trecho">
          <p class="trecho-nome"><strong>A mais</strong></p>
          <p class="trecho-feito">${feito(v)}</p>
        </div>`).join('')}
    </div>`;
}

function heroiDoTreino(sessao, sobretitulo, realizadas = []) {
  const d = detalharSessao(sessao, estado.plano.vdot);
  return `
    <section class="heroi ${classeTipo(sessao.tipo)}">
      <p class="sobretitulo">${esc(sobretitulo)}</p>
      <p class="heroi-numero">${numeroKm(sessao.distanciaKm)}<small>km</small></p>
      <h2>${esc(sessao.nome)}</h2>
      ${seloTipo(sessao.tipo)}
      ${perfilDoTreino(d)}
      <div class="heroi-dados">
        <div><b>${formatarTempo(d.tempoSeg)}</b><span>${sessao.tipo === 'prova' ? 'Tempo previsto' : 'Tempo estimado'}</span></div>
        <div><b>${formatarRitmo(d.ritmoMedio)}/km</b><span>Pace médio</span></div>
      </div>
      ${realizadas.map((a) => `<p class="heroi-feito" data-feito="${esc(a.id)}">${esc(textoFeito(a, sessao))}</p>`).join('')}
      <button data-abrir="${esc(sessao.id)}">Ver treino</button>
    </section>`;
}

function blocoDaSemana(dia) {
  const { plano } = estado;
  const antesDoInicio = dia < plano.inicio;
  const segunda = antesDoInicio ? plano.inicio : segundaDaSemana(dia);
  const fim = somarDias(segunda, 7);
  const sessoes = plano.sessoes.filter((s) => s.data >= segunda && s.data < fim);
  if (!sessoes.length) return '';
  const previsto = sessoes.reduce((t, s) => t + s.distanciaKm, 0);
  const atividades = estado.atividades.filter((a) => a.data >= segunda && a.data < fim);
  const feito = atividades.reduce((t, a) => t + a.km, 0);
  const dias = diasDaSemana({ segunda, sessoes, atividades, hoje: dia }).map((d) => (d.sessao ? { ...d, situacao: situacaoDaSessao(d.sessao, dia).situacao } : d));
  const feitos = dias.filter((d) => d.sessao && d.situacao === 'feito').length;
  const parciais = dias.filter((d) => d.sessao && d.situacao === 'parcial').length;
  const comOutra = new Set(todasAvulsas().map((a) => a.data));

  const celulas = dias.map((d) => {
    const nome = DIAS[(new Date(`${d.data}T12:00:00Z`).getUTCDay() + 6) % 7].curto;
    const marca = { feito: '✓', parcial: '½', 'nao-feito': '×', perdido: '–', descanso: '·' }[d.situacao] ?? numeroKm(d.sessao.distanciaKm);
    const classes = `dia ${d.situacao} ${d.ehHoje ? 'hoje' : ''} ${d.sessao ? classeTipo(d.sessao.tipo) : ''}`;
    const temOutra = comOutra.has(d.data);
    const conteudo = `<span class="dia-nome">${nome}</span><span class="dia-marca">${marca}</span>${temOutra ? '<i class="dia-outra"></i>' : ''}`;
    const extra = temOutra ? ', com outra atividade' : '';
    if (!d.sessao) return `<div class="${classes}" role="img" aria-label="${nome}: ${d.situacao === 'feito' ? `corrida de ${km(d.km)}` : 'descanso'}${extra}">${conteudo}</div>`;
    return `<button class="${classes}" data-abrir="${esc(d.sessao.id)}" aria-label="${nome}: ${esc(d.sessao.nome)}, ${km(d.sessao.distanciaKm)}${extra}">${conteudo}</button>`;
  }).join('');

  return `
    <section class="cartao">
      <div class="semana-topo">
        ${anelDeProgresso(previsto ? feito / previsto : 0, 'Parte do volume da semana já corrida')}
        <div>
          <h2>${antesDoInicio ? 'Sua primeira semana' : 'Sua semana'}</h2>
          <p><span class="cartao-numero">${numeroKm(Math.round(feito * 10) / 10)}</span> <span class="suave">de ${km(Math.round(previsto * 10) / 10)}</span></p>
          <p class="suave">${feitos} de ${sessoes.length} treinos${parciais ? `, ${parciais === 1 ? '1 parcial' : `${parciais} parciais`}` : ''}</p>
        </div>
      </div>
      <div class="dias-semana">${celulas}</div>
      ${estado.chaveApi ? '' : '<p class="suave" style="margin:10px 0 0">Conecte o intervals.icu nos Ajustes para contar suas corridas.</p>'}
    </section>`;
}

function linhaAvulsa(a) {
  const dados = [
    dataCurta(a.data),
    duracaoCurta(a.minutos),
    a.km ? km(Math.round(a.km * 10) / 10) : null,
    a.fcMedia ? `FC ${Math.round(a.fcMedia)} bpm` : null,
    a.subida ? `${Math.round(a.subida)} m de subida` : null,
  ].filter(Boolean).join(', ');
  const corpo = `
    <span class="sessao-corpo">
      <strong>${esc(a.categoria === 'outro' && a.nome ? a.nome : nomeDaCategoria(a.categoria))}</strong>
      <span class="suave">${esc(dados)}</span>
      ${a.nota ? `<span class="suave avulsa-nota">${esc(a.nota)}</span>` : ''}
    </span>`;
  if (a.origem === 'relogio') return `<button class="avulsa-linha" data-atividade="${esc(a.id)}" aria-label="Ver dados: ${esc(nomeDaCategoria(a.categoria))}, ${dataCurta(a.data)}">${corpo}<span class="sessao-fim"><span class="selo">Relógio</span>${icone('seta')}</span></button>`;
  return `<button class="avulsa-linha" data-avulsa="${esc(a.id)}" aria-label="Editar ${esc(nomeDaCategoria(a.categoria))}, ${dataCurta(a.data)}">${corpo}<span class="sessao-fim"><span class="selo">Manual</span>${icone('seta')}</span></button>`;
}

function blocoOutrasDaSemana(dia) {
  const segunda = segundaDaSemana(dia);
  const fim = somarDias(segunda, 7);
  const lista = todasAvulsas().filter((a) => a.data >= segunda && a.data < fim);
  const total = lista.reduce((t, a) => t + a.minutos, 0);
  return `
    <section class="cartao">
      <h2>Outras atividades</h2>
      <p class="suave">${lista.length ? `${lista.length === 1 ? '1 atividade' : `${lista.length} atividades`} nesta semana, ${duracaoCurta(total)}.` : 'Caminhadas e outros exercícios. Não entram no volume de corrida.'}</p>
      ${lista.map(linhaAvulsa).join('')}
      <button style="margin-top:8px" data-avulsa="nova">Registrar atividade</button>
    </section>`;
}

const dadosDaAtividade = () => ({
  sessoes: estado.plano.sessoes,
  corridas: estado.atividades,
  semDados: estado.corridasSemDados,
  outras: todasAvulsas(),
  ligacoes: estado.ligacoes,
  naoFeitos: estado.naoFeitos,
});

function blocoOutrasNaEvolucao(dia) {
  const lista = todasAvulsas();
  const r = resumoDaAtividade({ ...dadosDaAtividade(), de: somarDias(dia, -27), ate: somarDias(dia, 1) });
  const texto = (seg, quilometros) => [duracaoCurta(Math.round(seg / 60)), quilometros ? km(Math.round(quilometros * 10) / 10) : null].filter(Boolean).join(', ');
  const linhas = [
    r.planilha.quantidade ? [`Corrida da planilha (${r.planilha.quantidade}x)`, texto(r.planilha.seg, r.planilha.km)] : null,
    r.fora.quantidade ? [`Corrida fora da planilha (${r.fora.quantidade}x)`, texto(r.fora.seg, r.fora.km)] : null,
    r.semDados.quantidade ? [`Corrida sem distância (${r.semDados.quantidade}x)`, r.semDados.seg ? duracaoCurta(Math.round(r.semDados.seg / 60)) : 'sem dados'] : null,
    ...r.outras.map((c) => [`${c.nome} (${c.quantidade}x)`, texto(c.minutos * 60, c.km)]),
  ].filter(Boolean);
  return `
    <section class="cartao">
      <h2>Toda a atividade nos últimos 28 dias</h2>
      ${linhas.length
        ? `<table class="ritmos"><tbody>
            ${linhas.map(([nome, valor]) => `<tr><td>${esc(nome)}</td><td>${esc(valor)}</td></tr>`).join('')}
            <tr><td><strong>Tempo total</strong></td><td><strong>${duracaoCurta(Math.round(r.tempoTotalSeg / 60))}</strong></td></tr>
          </tbody></table>`
        : '<p class="suave">Nada registrado neste período.</p>'}
      <p class="suave" style="margin-top:10px">Corrida fora da planilha também conta no volume e no nível. Caminhada e outros exercícios contam aqui e no calendário, mas não no volume de corrida nem no nível, porque a carga é diferente.</p>
      ${lista.length ? `
        <details class="tabela-grafico">
          <summary>Ver todas (${lista.length})</summary>
          ${lista.map(linhaAvulsa).join('')}
        </details>` : ''}
      <button style="margin-top:8px" data-avulsa="nova">Registrar atividade</button>
    </section>`;
}

function telaAvulsa() {
  const item = estado.avulsas.find((a) => a.id === avulsaAberta);
  const dia = hoje();
  const horas = item ? Math.floor(item.minutos / 60) : '';
  const minutos = item ? item.minutos % 60 : '';
  return `
    <button class="voltar" data-acao="voltar">‹ Voltar</button>
    <header class="topo">
      <h1>${item ? 'Editar atividade' : 'Registrar atividade'}</h1>
      <p class="suave">O que o relógio grava chega sozinho. Registre aqui só o que ficou de fora, para não contar duas vezes.</p>
    </header>
    <form class="cartao" id="form-avulsa">
      <label>Atividade
        <select name="categoria">
          ${CATEGORIAS.map((c) => `<option value="${c.chave}" ${item?.categoria === c.chave ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}
        </select>
      </label>
      <label>Data<input name="data" type="date" max="${dia}" value="${esc(item?.data ?? dia)}"></label>
      <div class="linha">
        <label>Horas<input name="horas" type="number" inputmode="numeric" min="0" max="24" value="${horas}"></label>
        <label>Minutos<input name="minutos" type="number" inputmode="numeric" min="0" max="59" value="${minutos}"></label>
      </div>
      <label>Distância em km (opcional)<input name="km" inputmode="decimal" value="${item?.km ? String(item.km).replace('.', ',') : ''}"></label>
      <label>Observação (opcional)<input name="nota" maxlength="200" value="${esc(item?.nota ?? '')}"></label>
      <p id="erro-avulsa" class="erro" role="alert"></p>
      <div class="botoes">
        <button class="principal" type="submit">Salvar</button>
        ${item ? '<button type="button" class="perigo" data-acao="excluir-avulsa">Excluir</button>' : ''}
      </div>
    </form>`;
}

function salvarAvulsa(formulario) {
  const form = new FormData(formulario);
  const textoKm = String(form.get('km') ?? '').trim();
  const horas = Number(form.get('horas') || 0);
  const resto = Number(form.get('minutos') || 0);
  const dados = {
    categoria: String(form.get('categoria')),
    data: String(form.get('data') ?? ''),
    minutos: resto < 60 ? horas * 60 + resto : NaN,
    km: textoKm ? Number(textoKm.replace(',', '.')) : null,
  };
  const erro = erroDaAvulsa(dados, hoje());
  if (erro) {
    document.getElementById('erro-avulsa').textContent = erro;
    return;
  }
  const nota = String(form.get('nota') ?? '').trim();
  const editando = estado.avulsas.some((a) => a.id === avulsaAberta);
  const registro = { ...dados, id: editando ? avulsaAberta : `av-${Date.now()}`, nota, origem: 'manual' };
  estado.avulsas = editando ? estado.avulsas.map((a) => (a.id === avulsaAberta ? registro : a)) : [...estado.avulsas, registro];
  guardar();
  avulsaAberta = null;
  render();
  window.scrollTo(0, rolagemAnterior);
  mostrarAviso('Atividade salva.');
}

function baseAtual(dia) {
  const real = baseDasAtividades(estado.atividades, dia);
  if (real.kmSemana > 0) return real;
  const segunda = segundaDaSemana(dia);
  const semana = estado.plano?.sessoes.filter((s) => s.data >= segunda && s.data < somarDias(segunda, 7) && s.tipo !== 'prova') ?? [];
  return { kmSemana: semana.reduce((t, s) => t + s.distanciaKm, 0), longoKm: Math.max(0, ...semana.map((s) => s.distanciaKm)) };
}

function tabelaDeVolume(prova, sessoes) {
  const ref = referenciaDaMeta({ distanciaKm: prova.distanciaKm, meta: prova.meta });
  const seu = volumeDoPlano(sessoes);
  const inteiro = (valor) => `${Math.round(valor)} km`;
  const linhas = [
    ['Pico por semana', inteiro(ref.pico), inteiro(seu.pico)],
    ['4 semanas seguidas de maior volume', inteiro(ref.quatroSemanas), inteiro(seu.quatroSemanas)],
    ['Maior corrida', inteiro(ref.longo), inteiro(seu.maior)],
  ];
  return `
    <table class="ritmos comparacao">
      <thead><tr><th></th><th>Referência</th><th>Sua planilha</th></tr></thead>
      <tbody>${linhas.map(([nome, a, b]) => `<tr><td>${nome}</td><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody>
    </table>
    <p class="suave" style="margin-top:10px">Referência para ${prova.meta === 'tempo' ? 'buscar tempo' : 'completar'}: planos de Hal Higdon, com ${ref.semanas} semanas de preparação. Nenhum estudo define um volume obrigatório, e trechos em minutos não entram nas somas.</p>`;
}

function linhaProva(p, dia, principal) {
  const faltam = diasAte(dia, p.data);
  const quando = p.resultado ? `Feita em ${formatarTempo(p.resultado.seg)}` : p.data < dia ? 'Sem corrida registrada' : faltam === 0 ? 'É hoje' : `Faltam ${faltam} dia${faltam > 1 ? 's' : ''}`;
  const sessao = p.data <= dia && estado.plano.sessoes.find((s) => s.data === p.data && s.tipo === 'prova');
  const destino = sessao ? `data-abrir="${esc(sessao.id)}" aria-label="Abrir resultado de ${esc(p.nome)}"` : `data-prova="${esc(p.id)}" aria-label="Editar ${esc(p.nome)}"`;
  return `
    <button class="avulsa-linha" ${destino}>
      <span class="sessao-corpo">
        <strong>${esc(p.nome)}</strong>
        <span class="suave">${dataCurta(p.data)}, ${String(p.distanciaKm).replace('.', ',')} km, ${p.meta === 'tempo' ? 'buscar tempo' : 'completar'}. ${quando}.</span>
      </span>
      <span class="sessao-fim"><span class="selo">${p.id === principal?.id ? 'Principal' : p.prioridade === 'B' ? 'Importante' : p.prioridade === 'C' ? 'Preparação' : 'Próximo ciclo'}</span>${icone('seta')}</span>
    </button>`;
}

function blocoProvas(dia) {
  const emOrdem = [...estado.provas].sort((a, b) => a.data.localeCompare(b.data));
  const futuras = emOrdem.filter((p) => p.data >= dia);
  const passadas = emOrdem.filter((p) => p.data < dia).reverse();
  const principal = principalAtual();
  const avisos = principal ? avisosDaProva({ prova: principal, base: baseAtual(dia), hoje: dia, todas: estado.provas }) : [];
  return `
    <section class="cartao" id="minhas-provas">
      <h2>Minhas provas</h2>
      ${futuras.length ? futuras.map((p) => linhaProva(p, dia, principal)).join('') : '<p class="suave">Nenhuma prova marcada.</p>'}
      <p class="suave">Inclua aqui as provas em que se inscreveu, e a planilha se organiza em torno delas. Depois da prova, o resultado entra sozinho quando a corrida chegar do relógio.</p>
      <button style="margin-top:8px" data-prova="nova">Adicionar prova</button>
      ${principal && principal.data >= dia ? `
        <h3>Volume para ${esc(principal.nome)}</h3>
        ${tabelaDeVolume(principal, estado.plano.sessoes)}
        ${avisos.length ? `<ul class="motivos">${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}` : ''}
      ${passadas.length ? `
        <details class="tabela-grafico">
          <summary>Provas realizadas (${passadas.length})</summary>
          ${passadas.map((p) => linhaProva(p, dia, principal)).join('')}
        </details>` : ''}
    </section>`;
}

function telaProva() {
  const dia = hoje();
  if (provasPendentes) {
    const { resultado, objetivo, novas, editada } = provasPendentes;
    const nome = (o) => (o.dataProva ? esc(o.nome ?? `Prova de ${String(o.distanciaKm).replace('.', ',')} km`) : 'Condicionamento');
    const principal = escolherPrincipal(novas, resultado.aPartirDe);
    const avisos = editada ? avisosDaProva({ prova: editada, base: baseAtual(dia), hoje: dia, todas: novas }) : [];
    return `
      <header class="topo"><p class="sobretitulo">Antes de aplicar</p><h1>Como fica a planilha</h1></header>
      <section class="cartao destaque">
        <p><strong>Prova principal:</strong> ${nome(objetivo)}</p>
        <p class="suave">Mudanças a partir de ${dataCurta(resultado.aPartirDe)}. Treinos passados não mudam, e uma prova nesta semana só altera os dias que faltam.</p>
        <table class="ritmos comparacao">
          <thead><tr><th>Na semana</th><th>Hoje</th><th>Nova</th></tr></thead>
          <tbody>
            <tr><td>Treinos</td><td>${resultado.antes.treinos}</td><td>${resultado.depois.treinos}</td></tr>
            <tr><td>Volume</td><td>${km(resultado.antes.km)}</td><td>${km(resultado.depois.km)}</td></tr>
          </tbody>
        </table>
      </section>
      ${principal ? `<section class="cartao"><h2>Volume para ${esc(principal.nome)}</h2>${tabelaDeVolume(principal, resultado.plano.sessoes)}</section>` : ''}
      ${avisos.length ? `<section class="cartao alerta"><h2>Compare com a referência</h2><ul class="motivos">${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul><p class="suave">São comparações, não um veto: não há critério validado para dizer se uma meta é realista.</p></section>` : ''}
      <div class="botoes">
        <button class="principal" data-acao="aplicar-provas">Aplicar à planilha</button>
        <button data-acao="cancelar-provas">Cancelar</button>
      </div>`;
  }

  const item = estado.provas.find((p) => p.id === provaAberta);
  const padrao = [5, 10, 21.1, 42.2];
  const padronizada = item && padrao.includes(item.distanciaKm);
  return `
    <button class="voltar" data-acao="voltar">‹ Voltar</button>
    <header class="topo">
      <h1>${item ? 'Editar prova' : 'Adicionar prova'}</h1>
      <p class="suave">A planilha se organiza em torno da prova principal. As anteriores a ela entram como secundárias.</p>
    </header>
    <form class="cartao" id="form-prova">
      <label>Nome da prova<input name="nome" maxlength="60" value="${esc(item?.nome ?? '')}"></label>
      <label>Data<input name="data" type="date" min="${dia}" value="${esc(item?.data ?? '')}"></label>
      <label>Distância
        <select name="distancia">
          ${[[5, '5 km'], [10, '10 km'], [21.1, 'Meia maratona'], [42.2, 'Maratona']].map(([v, nome]) => `<option value="${v}" ${item?.distanciaKm === v ? 'selected' : ''}>${nome}</option>`).join('')}
          <option value="outra" ${item && !padronizada ? 'selected' : ''}>Outra distância</option>
        </select>
      </label>
      <label>Outra distância em km<input name="outra" inputmode="decimal" value="${item && !padronizada ? String(item.distanciaKm).replace('.', ',') : ''}"></label>
      <label>O que você quer nesta prova
        <select name="meta">
          <option value="terminar" ${item?.meta === 'tempo' ? '' : 'selected'}>Completar, sem treino forte</option>
          <option value="tempo" ${item?.meta === 'tempo' ? 'selected' : ''}>Buscar um tempo, com treino forte</option>
        </select>
      </label>
      <label>Importância
        <select name="prioridade">
          ${Object.entries(PRIORIDADES).map(([v, nome]) => `<option value="${v}" ${item?.prioridade === v ? 'selected' : ''}>${esc(nome)}</option>`).join('')}
        </select>
      </label>
      <p id="erro-prova" class="erro" role="alert"></p>
      <div class="botoes">
        <button class="principal" type="submit">Ver como fica</button>
        ${item ? '<button type="button" class="perigo" data-acao="excluir-prova">Excluir</button>' : ''}
      </div>
    </form>`;
}

function prepararProvas(novas, editada) {
  const dia = hoje();
  const aPartirDe = dia < estado.plano.inicio ? estado.plano.inicio : proximaSegunda(dia);
  const principal = escolherPrincipal(novas, aPartirDe);
  const objetivo = objetivoDaProva(principal);
  const resultado = refazerComProvas({
    plano: estado.plano,
    parametros: { perfil: estado.perfil, objetivo, prudencia: avaliarPrudencia(estado.perfil) },
    provas: provasDoCiclo(novas, principal, dia),
    hoje: dia,
  });
  if (!resultado) {
    estado.provas = novas;
    guardar();
    provaAberta = null;
    render();
    mostrarAviso('Prova salva. Esta planilha já terminou: comece um novo ciclo nos Ajustes.');
    return;
  }
  provasPendentes = { novas, objetivo, resultado, editada };
  render();
}

function salvarProva(formulario) {
  const form = new FormData(formulario);
  const escolha = String(form.get('distancia'));
  const dados = {
    nome: String(form.get('nome') ?? '').trim(),
    data: String(form.get('data') ?? ''),
    distanciaKm: escolha === 'outra' ? Number(String(form.get('outra') ?? '').replace(',', '.')) : Number(escolha),
    meta: String(form.get('meta')),
    prioridade: String(form.get('prioridade')),
  };
  const erro = document.getElementById('erro-prova');
  erro.textContent = erroDaProva(dados, hoje()) ?? '';
  if (erro.textContent) return;
  const repetida = estado.provas.find((p) => p.data === dados.data && p.id !== provaAberta);
  if (repetida) {
    erro.textContent = `Já há uma prova nesta data: ${repetida.nome}.`;
    return;
  }
  const editando = estado.provas.some((p) => p.id === provaAberta);
  const registro = { ...dados, id: editando ? provaAberta : `pr-${Date.now()}` };
  try {
    prepararProvas(editando ? estado.provas.map((p) => (p.id === provaAberta ? registro : p)) : [...estado.provas, registro], registro);
  } catch (falha) {
    erro.textContent = falha.message;
  }
}

function blocoDoObjetivo(dia, { comAtalho = false } = {}) {
  const { plano, objetivo } = estado;
  const atual = plano.sessoes.find((s) => s.data >= dia) ?? plano.sessoes[plano.sessoes.length - 1];
  const prova = objetivo.distanciaKm && objetivo.dataProva >= dia;
  const barras = fasesDoPlano(plano.sessoes).map(({ semanas }) => {
    const completas = semanas.filter((n) => n < atual.semana).length + (semanas.includes(atual.semana) ? 0.5 : 0);
    return `<div class="fase" style="flex:${semanas.length}"><i style="width:${(completas / semanas.length) * 100}%"></i></div>`;
  }).join('');
  const dias = prova ? diasAte(dia, objetivo.dataProva) : 0;
  return `
    <section class="cartao">
      <p class="sobretitulo">${prova ? esc(objetivo.nome ?? `Prova de ${String(objetivo.distanciaKm).replace('.', ',')} km`) : 'Condicionamento'}</p>
      <h2>${prova ? (dias === 0 ? 'É hoje!' : `Falta${dias > 1 ? 'm' : ''} ${dias} dia${dias > 1 ? 's' : ''}`) : `Semana ${atual.semana} de ${plano.totalSemanas}`}</h2>
      <div class="fases" role="img" aria-label="Avanço pelas fases da planilha">${barras}</div>
      <p class="suave" style="margin:0">Fase de ${FASES[atual.fase].toLowerCase()}${prova ? `, semana ${atual.semana} de ${plano.totalSemanas}` : ''}${atual.recuperacao ? ', semana de recuperação' : ''}</p>
      ${comAtalho ? '<button style="margin-top:12px" data-acao="ver-provas">Minhas provas</button>' : ''}
    </section>`;
}

const camposDoUsuario = () => `
  <label>Seu nome<input name="nome" autocomplete="name" maxlength="60" placeholder="Ex.: Maria Silva" value="${esc(estado.nome)}" required></label>
  <label>Data de nascimento<input name="nascimento" type="date" autocomplete="bday" max="${hoje()}" value="${esc(estado.nascimento ?? '')}" required></label>`;

function telaHoje() {
  const dia = hoje();
  const { sessoes, inicio } = estado.plano;
  const deHoje = sessoes.find((s) => s.data === dia);
  const proxima = sessoes.find((s) => s.data > dia);

  let principal;
  if (deHoje) {
    principal = heroiDoTreino(deHoje, 'Treino de hoje', corridasDoTreino(deHoje, estado.atividades, estado.ligacoes));
  } else if (proxima) {
    const antesDoInicio = dia < inicio;
    principal = `
      <section class="heroi">
        <p class="sobretitulo">${antesDoInicio ? 'Preparação' : 'Dia de descanso'}</p>
        <h2>${antesDoInicio ? `Sua planilha começa ${dataLonga(inicio)}` : 'Recuperar também é treinar'}</h2>
        <p>Próximo treino: <strong>${esc(proxima.nome)}</strong>, ${dataLonga(proxima.data)}, ${km(proxima.distanciaKm)}.</p>
        <button data-abrir="${esc(proxima.id)}">Ver próximo treino</button>
      </section>`;
  } else {
    principal = `
      <section class="heroi t-prova">
        <p class="sobretitulo">Ciclo completo</p>
        <h2>Planilha concluída</h2>
        <p>Parabéns. Quando quiser, comece um novo ciclo nos Ajustes.</p>
      </section>`;
  }

  return `
    <div class="marca">${MARCA}Run Glória</div>
    <header class="topo">
      <p class="sobretitulo">${dataLonga(dia)}</p>
      <h1>${estado.nome ? `Olá, ${esc(estado.nome.split(/\s+/)[0])}` : 'Hoje'}</h1>
    </header>
    ${avisoPlanilhaAntiga()}
    ${estado.nascimento && ehAniversario(estado.nascimento, dia) ? `
      <section class="cartao destaque parabens">
        <p class="parabens-bolo" aria-hidden="true">🎂</p>
        <h2>Parabéns${estado.nome ? `, ${esc(estado.nome.split(/\s+/)[0])}` : ''}!</h2>
        <p>Hoje você completa ${idadeEm(estado.nascimento, dia)} anos. Que venham muitos quilômetros e muita saúde.</p>
      </section>` : ''}
    ${principal}
    ${estado.nome && estado.nascimento ? '' : `
      <form class="cartao" id="form-nome">
        <h2>Complete seu cadastro</h2>
        ${camposDoUsuario()}
        <button class="principal" type="submit" style="margin-top:10px">Salvar</button>
      </form>`}
    ${blocoDeFeedbackPendente(dia)}
    ${blocoFeitoHoje(dia)}
    ${blocoDaSemana(dia)}
    ${blocoNovasConquistas()}
    ${blocoOutrasDaSemana(dia)}
    ${blocoDoObjetivo(dia, { comAtalho: true })}`;
}

// ---------- Plano ----------

function linhaSessao(sessao, dia) {
  const r = situacaoDaSessao(sessao, dia);
  const feito = km(Math.round(r.km * 10) / 10);
  const status = {
    feito: `<span class="status feito">${feito} feitos</span>`,
    parcial: `<span class="status parcial">${feito} de ${km(sessao.distanciaKm)}</span>`,
    'nao-feito': '<span class="status falta">Não feito</span>',
    perdido: '<span class="status falta">Sem registro</span>',
    planejado: `<span class="status">${km(sessao.distanciaKm)}</span>`,
  }[r.situacao];
  const quando = new Date(`${sessao.data}T12:00:00Z`);
  return `
    <button class="sessao ${classeTipo(sessao.tipo)}" data-abrir="${esc(sessao.id)}" aria-label="Abrir ${esc(sessao.nome)}, ${dataCurta(sessao.data)}">
      <span class="sessao-data"><small>${DIAS[(quando.getUTCDay() + 6) % 7].curto}</small><b>${quando.getUTCDate()}</b></span>
      <span class="sessao-faixa"></span>
      <span class="sessao-corpo">
        <strong>${esc(sessao.nome)}</strong>
        <span class="suave">${ROTULOS[sessao.tipo]}</span>
      </span>
      <span class="sessao-fim">${status}${icone('seta')}</span>
    </button>`;
}

// ---------- Detalhes do treino ----------

const ritmoDe = (segundos, quilometros) => `${formatarRitmo(segundos / quilometros)}/km`;

function barraDeZona(rotulo, segundos, fracao, chave) {
  const pct = Math.round(fracao * 100);
  return `
    <div class="zona ${chave ? `cor-${chave}` : ''}">
      <div class="zona-topo"><span>${esc(rotulo)}</span><span>${formatarTempo(segundos)} (${pct}%)</span></div>
      <div class="barra" role="img" aria-label="${esc(rotulo)}: ${pct}% do tempo"><div style="width:${pct}%"></div></div>
    </div>`;
}

const NOMES_DAS_ZONAS = {
  lento: 'Mais lento que o leve',
  leve: 'Z2 Leve',
  maratona: 'Z3 Ritmo de maratona',
  limiar: 'Z4 Limiar',
  intervalado: 'Z5 Intervalado',
};

const DIAS_DE_ANALISE_AUTOMATICA = 14;
const MAXIMO_DE_ANALISES_POR_VEZ = 5;
const analisesEmAndamento = new Set();
const errosDeAnalise = new Map();
const pct = (fracao) => `${Math.round(fracao * 100)}%`;

const TEXTO_DAS_METADES = {
  perdeu: 'Você terminou mais devagar do que começou. Largar um pouco mais controlado pode ajudar.',
  ganhou: 'Você terminou mais rápido do que começou, com a segunda metade mais forte.',
  manteve: 'Você manteve o ritmo do início ao fim.',
};

function blocoDasMetades(metades) {
  return `
    <h3>Primeira e segunda metade</h3>
    <div class="numeros numeros-2">
      <div><b>${formatarRitmo(metades.primeira)}/km</b><span>1ª metade</span></div>
      <div><b>${formatarRitmo(metades.segunda)}/km</b><span>2ª metade</span></div>
    </div>
    <p class="suave" style="margin-top:10px">${TEXTO_DAS_METADES[ritmoDaProva(metades)]} Diferença de até 2% conta como ritmo mantido, e o GPS pode errar parte disso.</p>`;
}

function comparacaoComPrevisto(seg, previstoSeg) {
  const diferenca = Math.round(seg - previstoSeg);
  if (Math.abs(diferenca) < 30) return `Dentro da previsão de ${formatarTempo(previstoSeg)}.`;
  return `${formatarTempo(Math.abs(diferenca))} ${diferenca < 0 ? 'mais rápido' : 'mais lento'} que a previsão de ${formatarTempo(previstoSeg)}.`;
}

function blocoResultadoDaProva(sessao, atividade) {
  const registrada = estado.provas.find((p) => p.data === sessao.data && p.resultado)?.resultado;
  const previstoSeg = registrada?.previstoSeg ?? preverTempoSeg(estado.plano.vdot, sessao.distanciaKm);
  const nivel = String(registrada?.vdot ?? '').replace('.', ',');
  return `
    <section class="cartao destaque">
      <p class="sobretitulo">Resultado da prova</p>
      <p class="meta-numero"><b>${formatarTempo(atividade.seg)}</b></p>
      <p>${esc(comparacaoComPrevisto(atividade.seg, previstoSeg))}</p>
      <p class="suave">Pace médio de ${formatarRitmo(atividade.seg / atividade.km)}/km em ${km(Math.round(atividade.km * 10) / 10)} no GPS.</p>
      ${nivel ? `<p class="suave">Nível nesta prova: VDOT ${nivel}. Sua planilha usa ${String(estado.plano.vdot).replace('.', ',')}. Para atualizar os ritmos, use Revisão › Atualizar análise.</p>` : ''}
    </section>`;
}

// ---------- Calendário ----------

const nomeDoMes = (mes) => {
  const texto = new Date(`${mes}-15T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return texto[0].toUpperCase() + texto.slice(1);
};

function corpoCorridaFeita(a, naPlanilha) {
  const dados = [
    dataCurta(a.data),
    km(Math.round(a.km * 10) / 10),
    a.seg ? formatarTempo(a.seg) : null,
    a.seg ? `${formatarRitmo(a.seg / a.km)}/km` : null,
    a.fcMedia ? `FC ${Math.round(a.fcMedia)} bpm` : null,
  ].filter(Boolean).join(', ');
  return `
    <span class="sessao-corpo"><strong>${esc(a.nome ?? 'Corrida')}</strong><span class="suave">${esc(dados)}</span></span>
    <span class="selo">${naPlanilha ? 'Da planilha' : a.manual ? 'Manual' : 'Fora da planilha'}</span>`;
}

// A corrida do relógio abre os dados; a digitada à mão abre a edição.
const abrirCorrida = (a) => (a.manual ? `data-corrida-manual="${esc(a.idManual)}"` : `data-atividade="${esc(a.id)}"`);

const linhaCorridaFora = (a) => `<button class="avulsa-linha" ${abrirCorrida(a)} aria-label="${a.manual ? 'Editar' : 'Ver dados'}: ${esc(a.nome ?? 'Corrida')}, ${dataCurta(a.data)}">${corpoCorridaFeita(a, false)}${icone('seta')}</button>`;

const linhaSemDados = (a) => `
  <button class="avulsa-linha" data-atividade="${esc(a.id)}" aria-label="Ver dados: ${esc(a.nome ?? 'Corrida')}, ${dataCurta(a.data)}">
    <span class="sessao-corpo"><strong>${esc(a.nome ?? 'Corrida')}</strong><span class="suave">${dataCurta(a.data)}${a.seg ? `, ${formatarTempo(a.seg)}` : ''}. Chegou sem distância e fica fora do volume.</span></span>
    <span class="selo">Sem dados</span>${icone('seta')}
  </button>`;

function atividadePorId(id) {
  const igual = (a) => String(a.id) === String(id);
  const corrida = estado.atividades.find(igual);
  if (corrida) return { ...corrida, categoria: 'corrida', tipoDaAtividade: 'corrida' };
  const semDistancia = estado.corridasSemDados.find(igual);
  if (semDistancia) return { ...semDistancia, categoria: 'corrida', tipoDaAtividade: 'semDados' };
  const outra = estado.outrasDoRelogio.find(igual);
  return outra ? { ...outra, seg: outra.seg ?? outra.minutos * 60, tipoDaAtividade: 'outra' } : null;
}

// O percurso revela onde a pessoa mora e corre: fica só na memória, nunca no armazenamento nem na cópia.
const percursos = new Map();
const percursosEmAndamento = new Set();
const errosDePercurso = new Map();

function htmlDoMapa(latlngs) {
  const mapa = enquadrarMapa(pontosDoMapa(latlngs));
  if (!mapa) return '';
  const { largura, altura, tamanhoDoBloco, blocos, traco } = mapa;
  const pct = (valor, total) => `${((valor / total) * 100).toFixed(3)}%`;
  const imagens = blocos.map((b) => `<img alt="" loading="lazy" src="https://tile.openstreetmap.org/${b.z}/${b.x}/${b.y}.png" style="left:${pct(b.esquerda, largura)};top:${pct(b.topo, altura)};width:${pct(tamanhoDoBloco + 0.6, largura)};height:${pct(tamanhoDoBloco + 0.6, altura)}">`).join('');
  const linha = traco.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [inicio, fim] = [traco[0], traco.at(-1)];
  return `
    <div class="mapa" role="img" aria-label="Mapa do percurso da atividade">
      ${imagens}
      <svg viewBox="0 0 ${largura} ${altura}" aria-hidden="true">
        <polyline class="mapa-contorno" points="${linha}"/>
        <polyline class="mapa-traco" points="${linha}"/>
        <circle class="mapa-fim" cx="${fim[0].toFixed(1)}" cy="${fim[1].toFixed(1)}" r="6"/>
        <circle class="mapa-inicio" cx="${inicio[0].toFixed(1)}" cy="${inicio[1].toFixed(1)}" r="6"/>
      </svg>
    </div>
    <p class="suave mapa-nota">Círculo branco: início. Círculo colorido: fim. Mapa: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© colaboradores do OpenStreetMap</a>, que recebe a região exibida para entregar o fundo. O percurso em si não é enviado.</p>`;
}

function htmlDasCurvas(dados, categoria) {
  const curvas = curvasDaAtividade(dados);
  if (!curvas) return '';
  const { eixo, pontos } = curvas;
  const serie = (valorDe) => pontos.map((p) => ({ x: p.x, valor: valorDe(p) }));
  const graficos = [];
  const naBicicleta = categoria === 'bicicleta';
  if (categoria === 'corrida' || categoria === 'caminhada' || categoria === 'trilha') {
    const grafico = curvaDaAtividade(serie((p) => (p.velocidade ? 1000 / p.velocidade : null)), {
      nome: 'Pace', eixo, menorEhMelhor: true, passoMinimo: 5,
      formatar: (v) => `${formatarRitmo(v)}/km`, formatarEixo: formatarRitmo,
    });
    if (grafico) graficos.push(['Pace', 'Mais rápido fica no alto. Paradas deixam um vão na linha.', grafico]);
  } else if (naBicicleta) {
    const grafico = curvaDaAtividade(serie((p) => (p.velocidade ? p.velocidade * 3.6 : null)), {
      nome: 'Velocidade', eixo, passoMinimo: 1, formatar: (v) => `${numeroKm(v)} km/h`, formatarEixo: (v) => numeroKm(v),
    });
    if (grafico) graficos.push(['Velocidade', '', grafico]);
  }
  const fc = curvaDaAtividade(serie((p) => p.fc), { nome: 'FC', eixo, passoMinimo: 2, formatar: (v) => `${Math.round(v)} bpm`, formatarEixo: (v) => `${Math.round(v)}` });
  if (fc) graficos.push(['Frequência cardíaca', '', fc]);
  const altitude = curvaDaAtividade(serie((p) => p.altitude), { nome: 'Altitude', eixo, passoMinimo: 2, formatar: (v) => `${Math.round(v)} m`, formatarEixo: (v) => `${Math.round(v)}` });
  if (altitude) graficos.push(['Altitude', 'Pelo GPS ou barômetro do relógio.', altitude]);
  return graficos.map(([titulo, nota, grafico]) => `<h3>${titulo}</h3>${nota ? `<p class="suave">${nota}</p>` : ''}${grafico}`).join('');
}

function tabelaDeVoltas(linhas, categoria, titulo) {
  const noPace = categoria === 'corrida' || categoria === 'caminhada' || categoria === 'trilha';
  const naBicicleta = categoria === 'bicicleta';
  const temFc = linhas.some((l) => l.fc);
  const velocidadeDe = (l) => (noPace ? formatarRitmo(l.seg / l.km) : `${numeroKm(l.km / (l.seg / 3600))}`);
  const validas = linhas.filter((l) => l.km >= 0.5);
  const melhor = noPace || naBicicleta ? validas.reduce((m, l) => (!m || l.seg / l.km < m.seg / m.km ? l : m), null) : null;
  return `
    <div class="voltas-rolagem" data-sem-gesto>
      <table class="voltas" aria-label="${esc(titulo)}">
        <thead><tr><th>Nº</th><th>Dist.</th><th>Tempo</th>${noPace ? '<th>Pace</th>' : naBicicleta ? '<th>km/h</th>' : ''}${temFc ? '<th>FC</th>' : ''}</tr></thead>
        <tbody>${linhas.map((l, i) => `
          <tr class="${l === melhor && linhas.length > 1 ? 'volta-melhor' : ''}${l.recuperacao ? ' volta-recuperacao' : ''}">
            <td>${i + 1}</td>
            <td>${String(Math.round(l.km * 100) / 100).replace('.', ',')}</td>
            <td>${formatarDuracaoCurta(l.seg)}</td>
            ${noPace || naBicicleta ? `<td>${velocidadeDe(l)}</td>` : ''}
            ${temFc ? `<td>${l.fc ? Math.round(l.fc) : ''}</td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${melhor && linhas.length > 1 ? '<p class="suave mapa-nota">Em destaque, a mais rápida.</p>' : ''}`;
}

const formatarDuracaoCurta = (seg) => {
  const total = Math.round(seg);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = String(total % 60).padStart(2, '0');
  return horas ? `${horas}:${String(minutos).padStart(2, '0')}:${segundos}` : `${minutos}:${segundos}`;
};

function htmlDasVoltas(dados, categoria, atividade) {
  const voltas = voltasDaAtividade(dados.intervalos);
  const parciais = parciaisPorKm(dados);
  const sessao = categoria === 'corrida' ? sessaoDaCorrida(atividade, estado.plano.sessoes, estado.ligacoes) : null;
  const comparacao = sessao?.blocos?.length ? compararEtapas(etapasDoTreino(detalharSessao(sessao, estado.plano.vdot)), voltas) : null;
  if (comparacao) {
    return `
      ${htmlDasEtapas(comparacao)}
      ${parciais.length ? `
        <details class="tabela-grafico">
          <summary>Ver parciais por km</summary>
          ${tabelaDeVoltas(parciais, categoria, 'Parciais por quilômetro')}
        </details>` : ''}`;
  }
  if (voltas.length >= 2) {
    return `
      <h2 style="margin-top:18px">Voltas</h2>
      ${tabelaDeVoltas(voltas, categoria, 'Voltas da atividade')}
      <p class="suave mapa-nota">Conforme o intervals.icu, em km, minutos e bpm.</p>
      ${parciais.length ? `
        <details class="tabela-grafico">
          <summary>Ver parciais por km</summary>
          ${tabelaDeVoltas(parciais, categoria, 'Parciais por quilômetro')}
        </details>` : ''}`;
  }
  if (!parciais.length) return '';
  return `
    <h2 style="margin-top:18px">Parciais por km</h2>
    ${tabelaDeVoltas(parciais, categoria, 'Parciais por quilômetro')}
    <p class="suave mapa-nota">Calculadas pelas curvas do relógio, sem contar paradas.</p>`;
}

function blocoPercurso(a) {
  if (!a.id || !estado.chaveApi) return '';
  const atributo = `data-percurso="${esc(a.id)}"`;
  const erro = errosDePercurso.get(String(a.id));
  if (erro) {
    return `
      <section class="cartao" ${atributo}>
        <h2>Mapa e gráficos</h2>
        <p class="erro">${esc(erro)}</p>
        <button data-tentar-percurso="${esc(a.id)}">Tentar de novo</button>
      </section>`;
  }
  const dados = percursos.get(String(a.id));
  if (!dados) return `<section class="cartao" ${atributo}><h2>Mapa e gráficos</h2><p class="suave">Buscando no intervals.icu...</p></section>`;
  const mapa = htmlDoMapa(dados.latlngs);
  const curvas = htmlDasCurvas(dados, a.categoria ?? 'corrida');
  const voltas = htmlDasVoltas(dados, a.categoria ?? 'corrida', a);
  if (!mapa && !curvas && !voltas) return `<section class="cartao" ${atributo}><h2>Mapa e gráficos</h2><p class="suave">O relógio não gravou percurso nem curvas nesta atividade.</p></section>`;
  return `
    <section class="cartao" ${atributo}>
      ${mapa ? `<h2>Percurso</h2>${mapa}` : '<p class="suave" style="margin:0">Sem percurso de GPS nesta atividade.</p>'}
      ${voltas}
      ${curvas ? '<h2 style="margin-top:18px">Gráficos</h2>' : ''}
      ${curvas}
    </section>`;
}

async function carregarPercurso(a) {
  const id = String(a.id);
  if (!a.id || !estado.chaveApi || percursos.has(id) || percursosEmAndamento.has(id) || errosDePercurso.has(id)) return;
  percursosEmAndamento.add(id);
  try {
    const dados = await criarCliente({ chave: estado.chaveApi }).percursoDaAtividade(a.id);
    percursos.set(id, { ...dados, latlngs: pontosDoMapa(dados.latlngs) });
  } catch (erro) {
    errosDePercurso.set(id, erro.message);
  } finally {
    percursosEmAndamento.delete(id);
  }
  // Troca só este cartão, para a tela não voltar ao topo enquanto a pessoa lê.
  const cartao = document.querySelector(`[data-percurso="${CSS.escape(id)}"]`);
  if (cartao) cartao.outerHTML = blocoPercurso(a);
}

function telaAtividade(a) {
  const ehCorrida = a.tipoDaAtividade === 'corrida';
  const naPlanilha = Boolean(sessaoDaCorrida(a, estado.plano.sessoes, estado.ligacoes));
  const nome = a.tipoDaAtividade === 'outra' && (a.categoria !== 'outro' || !a.nome) ? nomeDaCategoria(a.categoria) : a.nome ?? 'Corrida';
  const selo = { corrida: naPlanilha ? 'Da planilha' : 'Fora da planilha', semDados: 'Sem dados', outra: 'Do relógio' }[a.tipoDaAtividade];
  const velocidade = velocidadeDaAtividade(a);
  const numeros = [
    a.km ? ['Distância', km(Math.round(a.km * 10) / 10)] : null,
    a.seg ? ['Tempo em movimento', formatarTempo(a.seg)] : null,
    velocidade?.segPorKm ? [velocidade.nome, `${formatarRitmo(velocidade.segPorKm)}/km`] : null,
    velocidade?.kmPorHora ? [velocidade.nome, `${numeroKm(velocidade.kmPorHora)} km/h`] : null,
  ].filter(Boolean);
  const extras = [
    a.segTotal && a.seg && a.segTotal - a.seg >= 60 ? ['Tempo total, com paradas', formatarTempo(a.segTotal)] : null,
    a.fcMedia ? ['FC média', `${Math.round(a.fcMedia)} bpm`] : null,
    a.fcMaxima ? ['FC máxima', `${Math.round(a.fcMaxima)} bpm`] : null,
    a.subida ? ['Subida', `${Math.round(a.subida)} m`] : null,
    a.calorias ? ['Calorias', `${Math.round(a.calorias)} kcal`] : null,
    a.cadencia ? ['Cadência', `${a.cadencia} ppm`] : null,
    a.carga ? ['Carga no intervals.icu', String(Math.round(a.carga))] : null,
    a.rpe ? ['Esforço no intervals.icu', `${a.rpe} de 10`] : null,
    a.sensacaoDoRelogio ? ['Sensação no intervals.icu', nomeDaSensacao(a.sensacaoDoRelogio)] : null,
  ].filter(Boolean);
  const tempoPorZona = a.tempoPorZonaFc ?? [];
  const totalZonas = tempoPorZona.reduce((t, s) => t + s, 0);
  const nota = {
    corrida: naPlanilha ? '' : 'Corrida em dia sem treino previsto. Conta no volume e no nível.',
    semDados: 'O intervals.icu entregou esta atividade sem distância, por isso ela fica fora do volume. Isso acontece em esteira sem sensor e em atividade que entrou pelo Strava.',
    outra: 'Conta no calendário e nos totais da Evolução, mas não no volume de corrida nem no nível.',
  }[a.tipoDaAtividade];
  return `
    <section class="heroi">
      <button class="voltar" data-acao="voltar">‹ Voltar</button>
      <p class="sobretitulo">${esc(dataLonga(a.data))}${a.hora ? `, ${esc(a.hora)}` : ''}</p>
      <h1>${esc(nome)}</h1>
      <span class="selo">${selo}</span>
      ${numeros.length ? `<div class="numeros">${numeros.map(([n, v]) => `<div><b>${esc(v)}</b><span>${n}</span></div>`).join('')}</div>` : ''}
    </section>
    ${ehCorrida && !naPlanilha ? cartaoDeFeedback({ chave: chaveDaCorrida(a), data: a.data, titulo: nome }) : ''}
    ${a.tipoDaAtividade === 'semDados' ? '' : blocoPercurso(a)}
    ${extras.length ? `<section class="cartao"><h2>Dados</h2><table class="ritmos"><tbody>${extras.map(([n, v]) => `<tr><td>${n}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table></section>` : ''}
    ${totalZonas ? `
      <section class="cartao">
        <h2>Tempo por zona de frequência cardíaca</h2>
        ${tempoPorZona.map((s, i) => (s > 0 ? barraDeZona(`Z${i + 1} de FC`, s, s / totalZonas) : '')).join('')}
        <p class="suave">Zonas calculadas pelo intervals.icu.</p>
      </section>` : ''}
    ${ehCorrida && estado.chaveApi ? blocoAnalise(a, null, null) : ''}
    ${nota ? `<section class="cartao"><p class="suave" style="margin:0">${esc(nota)}</p></section>` : ''}
    <section class="cartao">
      <h2>Mais detalhes</h2>
      <p class="suave">As análises completas ficam no intervals.icu.</p>
      <a class="botao-link" href="https://intervals.icu/activities/${encodeURIComponent(a.id)}" target="_blank" rel="noopener noreferrer">Abrir no intervals.icu</a>
      ${estado.chaveApi && a.tipoDaAtividade !== 'semDados' ? `
        <div class="botoes" style="margin-top:10px">
          <button data-baixar="fit" data-id="${esc(a.id)}" data-data="${esc(a.data)}">Arquivo FIT</button>
          <button data-baixar="gpx" data-id="${esc(a.id)}" data-data="${esc(a.data)}">Arquivo GPX</button>
        </div>` : ''}
    </section>`;
}

function celulaDoCalendario(d, selecionado) {
  const numero = Number(d.data.slice(8));
  const totalKm = d.corridas.reduce((t, a) => t + a.km, 0);
  const kmOutras = d.outras.reduce((t, a) => t + (a.km ?? 0), 0);
  const minutosOutras = d.outras.reduce((t, a) => t + a.minutos, 0);
  const kmNoDia = d.sessao ? d.kmDoTreino : totalKm;
  const marca = {
    outra: kmOutras ? numeroKm(kmOutras) : `${minutosOutras}'`,
    // Treino cumprido com corrida de outro dia: os km ficam só no dia em que ela aconteceu.
    feito: d.sessao && !d.corridas.length ? '✓' : numeroKm(kmNoDia),
    parcial: d.sessao && !d.corridas.length ? '½' : numeroKm(kmNoDia),
    'nao-feito': '×',
    extra: numeroKm(totalKm),
    'sem-dados': '?',
    perdido: '–',
    planejado: d.sessao ? numeroKm(d.sessao.distanciaKm) : '',
    livre: '',
  }[d.situacao];
  const descricao = [
    dataLonga(d.data),
    d.aniversario ? `seu aniversário de ${d.aniversario} anos` : null,
    { feito: `corrida da planilha, ${km(kmNoDia)}`, parcial: `treino feito em parte, ${km(kmNoDia)}`, 'nao-feito': `treino não feito, ${nomeDoMotivo(d.motivo).toLowerCase()}`, extra: `corrida fora da planilha, ${km(totalKm)}`, 'sem-dados': 'corrida sem distância', perdido: 'treino sem registro', planejado: `treino previsto, ${d.sessao ? km(d.sessao.distanciaKm) : ''}`, outra: null, livre: null }[d.situacao],
    d.outras.length ? d.outras.map((a) => `${nomeDaCategoria(a.categoria)}, ${duracaoCurta(a.minutos)}`).join(', ') : null,
  ].filter(Boolean).join(', ');
  const classes = ['dia', d.situacao, d.ehHoje ? 'hoje' : '', d.doMes ? '' : 'fora-do-mes', selecionado ? 'selecionado' : '', d.sessao ? classeTipo(d.sessao.tipo) : ''].filter(Boolean).join(' ');
  return `<button class="${classes}" data-dia-calendario="${d.data}" aria-label="${esc(descricao)}" ${selecionado ? 'aria-pressed="true"' : ''}>
    <span class="dia-nome">${numero}</span><span class="dia-marca">${marca}</span>${d.outras.length ? '<i class="dia-outra"></i>' : ''}${d.aniversario ? '<span class="dia-bolo" aria-hidden="true">🎂</span>' : ''}
  </button>`;
}

function detalheDoDia(d, dia) {
  const conteudo = [
    d.aniversario ? `<p class="cal-aniversario"><span aria-hidden="true">🎂</span> Seu aniversário: ${d.aniversario} anos</p>` : '',
    d.sessao && !d.corridas.length ? linhaSessao(d.sessao, dia) : '',
    d.corridas.map((a) => {
      const treino = sessaoDaCorrida(a, estado.plano.sessoes, estado.ligacoes);
      return treino ? `<button class="avulsa-linha" data-abrir="${esc(treino.id)}">${corpoCorridaFeita(a, true)}${icone('seta')}</button>` : linhaCorridaFora(a);
    }).join(''),
    d.semDados.map(linhaSemDados).join(''),
    d.outras.map(linhaAvulsa).join(''),
  ].join('');
  return `
    <div class="cal-detalhe">
      <h3>${esc(dataLonga(d.data))}</h3>
      ${conteudo || '<p class="suave">Nada previsto nem registrado neste dia.</p>'}
      ${d.data <= dia ? `<button style="margin-top:8px" data-corrida-manual="nova" data-data="${d.data}">Registrar corrida sem relógio</button>` : ''}
    </div>`;
}

function blocoCalendario(dia) {
  const mes = mesVisto ?? mesDe(dia);
  const grade = gradeDoMes({ mes, ...dadosDaAtividade(), nascimento: estado.nascimento, hoje: dia });
  const escolhido = diaVisto ?? (mesDe(dia) === mes ? dia : null);
  const selecionado = grade.find((d) => d.data === escolhido);
  const r = resumoDaAtividade({ ...dadosDaAtividade(), de: `${mes}-01`, ate: `${somarMeses(mes, 1)}-01` });
  const corridas = r.planilha.quantidade + r.fora.quantidade;
  const kmCorridos = r.planilha.km + r.fora.km;
  const partes = [
    corridas ? `${corridas === 1 ? '1 corrida' : `${corridas} corridas`}, ${km(Math.round(kmCorridos * 10) / 10)}${r.fora.quantidade ? ` (${r.fora.quantidade} fora da planilha)` : ''}` : null,
    r.quantidadeOutras ? `${r.quantidadeOutras === 1 ? '1 outra atividade' : `${r.quantidadeOutras} outras atividades`}` : null,
    r.tempoTotalSeg ? `${duracaoCurta(Math.round(r.tempoTotalSeg / 60))} no total` : null,
  ].filter(Boolean);
  return `
    <section class="cartao" id="calendario">
      <h2>Calendário</h2>
      <div class="cal-mes">
        <button data-mes="-1" aria-label="Mês anterior">‹</button>
        <strong>${esc(nomeDoMes(mes))}</strong>
        <button data-mes="1" aria-label="Próximo mês">›</button>
      </div>
      <div class="cal-grade cal-cabecalho" aria-hidden="true">${DIAS.map((d) => `<span>${d.curto}</span>`).join('')}</div>
      <div class="cal-grade">${grade.map((d) => celulaDoCalendario(d, d.data === escolhido)).join('')}</div>
      <p class="cal-legenda suave">
        <span><i class="cal-ponto planejado"></i>Previsto</span>
        <span><i class="cal-ponto feito"></i>Cumprido</span>
        ${grade.some((d) => d.situacao === 'parcial') ? '<span><i class="cal-ponto parcial"></i>Parcial</span>' : ''}
        ${grade.some((d) => d.situacao === 'nao-feito') ? '<span>×&nbsp;Não feito</span>' : ''}
        <span><i class="cal-ponto extra"></i>Fora da planilha</span>
        <span><i class="cal-ponto outra"></i>Outra atividade</span>
        ${grade.some((d) => d.aniversario) ? '<span><span aria-hidden="true">🎂</span>Aniversário</span>' : ''}
      </p>
      <p class="suave">${partes.length ? `Neste mês: ${esc(partes.join(', '))}.` : 'Nada registrado neste mês.'}</p>
      ${selecionado ? detalheDoDia(selecionado, dia) : ''}
    </section>`;
}

// Corrida extra, corrida sem distância ou outro exercício, na mesma lista dos treinos da semana.
function linhaFeitaNaSemana({ tipo, data, item }) {
  const quando = new Date(`${data}T12:00:00Z`);
  const dataDaLinha = `<span class="sessao-data"><small>${DIAS[(quando.getUTCDay() + 6) % 7].curto}</small><b>${quando.getUTCDate()}</b></span><span class="sessao-faixa"></span>`;
  if (tipo === 'outra') {
    const nome = item.categoria === 'outro' && item.nome ? item.nome : nomeDaCategoria(item.categoria);
    const corpo = `${dataDaLinha}
      <span class="sessao-corpo"><strong>${esc(nome)}</strong><span class="suave">${item.origem === 'relogio' ? 'Do relógio' : 'Registro manual'}, ${duracaoCurta(item.minutos)}</span></span>`;
    const distancia = item.km ? km(Math.round(item.km * 10) / 10) : '';
    if (item.origem === 'relogio') return `<button class="sessao t-outra" data-atividade="${esc(item.id)}" aria-label="Ver dados: ${esc(nome)}, ${dataCurta(data)}">${corpo}<span class="sessao-fim"><span class="status">${distancia}</span>${icone('seta')}</span></button>`;
    return `<button class="sessao t-outra" data-avulsa="${esc(item.id)}" aria-label="Editar ${esc(nome)}, ${dataCurta(data)}">${corpo}<span class="sessao-fim"><span class="status">${distancia}</span>${icone('seta')}</span></button>`;
  }
  if (tipo === 'semDados') {
    return `<button class="sessao t-sem-dados" data-atividade="${esc(item.id)}" aria-label="Ver dados: ${esc(item.nome ?? 'Corrida')}, ${dataCurta(data)}">${dataDaLinha}
      <span class="sessao-corpo"><strong>${esc(item.nome ?? 'Corrida')}</strong><span class="suave">Chegou sem distância</span></span>
      <span class="sessao-fim"><span class="status">?</span>${icone('seta')}</span></button>`;
  }
  return `<button class="sessao t-extra" ${abrirCorrida(item)} aria-label="${item.manual ? 'Editar' : 'Ver dados'}: ${esc(item.nome ?? 'Corrida')}, ${dataCurta(data)}">${dataDaLinha}
    <span class="sessao-corpo"><strong>${esc(item.nome ?? 'Corrida')}</strong><span class="suave">Fora da planilha${item.seg ? `, ${formatarRitmo(item.seg / item.km)}/km` : ''}</span></span>
    <span class="sessao-fim"><span class="status feito">${km(Math.round(item.km * 10) / 10)} feitos</span>${icone('seta')}</span></button>`;
}

function contagemDoFeito(lista) {
  const corridas = lista.filter((f) => f.tipo !== 'outra').length;
  const outras = lista.length - corridas;
  return [
    corridas ? `${corridas} fora da planilha` : null,
    outras ? (outras === 1 ? '1 outra atividade' : `${outras} outras atividades`) : null,
  ].filter(Boolean).join(', ');
}

// A semana em andamento antes do início da planilha não tem treinos, mas o que foi feito nela aparece.
function semanaAntesDoInicio(dia) {
  const { plano } = estado;
  const segunda = segundaDaSemana(dia);
  if (plano.sessoes.some((s) => segundaDaSemana(s.data) === segunda)) return '';
  const feito = feitoForaDosTreinos({ segunda, ...dadosDaAtividade() });
  if (!feito.length) return '';
  return `
    <details class="semana atual" open>
      <summary>
        <span class="semana-numero" aria-hidden="true">·</span>
        <span class="semana-info">
          <strong>Esta semana</strong>
          <span class="suave">${dia < plano.inicio ? 'Antes do início da planilha. ' : ''}${esc(contagemDoFeito(feito))}</span>
        </span>
      </summary>
      ${feito.map(linhaFeitaNaSemana).join('')}
    </details>`;
}

function blocoFeitoHoje(dia) {
  const temTreino = estado.plano.sessoes.some((s) => s.data === dia);
  const corridas = temTreino ? [] : atividadeDoDia(dia);
  const semDados = estado.corridasSemDados.filter((a) => a.data === dia);
  if (!corridas.length && !semDados.length) return '';
  return `
    <section class="cartao">
      <h2>Feito hoje</h2>
      ${corridas.map(linhaCorridaFora).join('')}
      ${semDados.map(linhaSemDados).join('')}
      <button style="margin-top:8px" data-acao="ver-calendario">Ver no calendário</button>
    </section>`;
}

// ---------- Peso e IMC ----------

const numeroPeso = (kg) => String(kg).replace('.', ',');

function blocoPeso() {
  const { perfil } = estado;
  const lista = estado.historicoPeso;
  const r = resumoDoPeso(lista, perfil.alturaCm);
  if (!r) return '';
  const sinal = (v) => (v > 0 ? `+${numeroPeso(v)}` : numeroPeso(v));
  const grafPeso = linhaDeEvolucao(lista.map((p) => ({ data: p.data, valor: p.kg })), { nome: 'Peso', formatar: (v) => `${v.toFixed(1).replace('.', ',')} kg`, formatarEixo: (v) => v.toFixed(1).replace('.', ','), menorEhMelhor: false, passoMinimo: 0.5 });
  const grafImc = linhaDeEvolucao(lista.map((p) => ({ data: p.data, valor: imcDe(p.kg, perfil.alturaCm) })), { nome: 'IMC', formatar: (v) => v.toFixed(1).replace('.', ','), passoMinimo: 0.2 });
  return `
    <section class="cartao" id="peso">
      <h2>Peso e IMC</h2>
      <div class="numeros numeros-2">
        <div><b>${numeroPeso(r.atual.kg)} kg</b><span>Peso em ${dataCompleta(r.atual.data)}</span></div>
        <div><b>${numeroPeso(r.imc)}</b><span>IMC, ${esc(r.classe.toLowerCase())}</span></div>
      </div>
      ${r.variacaoKg === null
        ? '<p class="suave" style="margin-top:12px">Registre o peso de novo quando mudar, para acompanhar a evolução.</p>'
        : `<p class="suave" style="margin-top:12px">Desde ${dataCompleta(r.primeiro.data)}: ${sinal(r.variacaoKg)} kg e ${sinal(r.variacaoImc)} de IMC.</p>`}
      ${grafPeso ? `<h3>Peso</h3>${grafPeso}` : ''}
      ${grafImc ? `<h3>IMC</h3>${grafImc}` : ''}
      <details class="tabela-grafico">
        <summary>Registrar peso</summary>
        <form id="form-peso">
          <div class="linha">
            <label>Peso (kg)<input name="kg" inputmode="decimal" placeholder="Ex.: 72,5" required></label>
            <label>Data<input name="data" type="date" max="${hoje()}" value="${hoje()}" required></label>
          </div>
          <button class="principal" type="submit" style="margin-top:10px">Salvar peso</button>
        </form>
      </details>
      <details class="tabela-grafico">
        <summary>Ver registros (${lista.length})</summary>
        ${[...lista].reverse().map((p) => `
          <div class="avulsa-linha">
            <span class="sessao-corpo"><strong>${numeroPeso(p.kg)} kg</strong><span class="suave">${dataCompleta(p.data)}, IMC ${numeroPeso(imcDe(p.kg, perfil.alturaCm))}</span></span>
            ${lista.length > 1 ? `<button data-remover-peso="${esc(p.data)}" aria-label="Apagar o registro de ${dataCompleta(p.data)}">Apagar</button>` : ''}
          </div>`).join('')}
      </details>
      <p class="suave" style="margin:10px 0 0">O IMC usa sua altura de ${esc(perfil.alturaCm)} cm e é só uma referência: não separa músculo de gordura. A carga da planilha só considera o peso novo quando ela é refeita.</p>
    </section>`;
}

// Quem já tinha cadastro começa o histórico com o peso informado. O último registro é o peso atual.
function atualizarPeso() {
  if (!estado.perfil) return;
  if (!estado.historicoPeso?.length) estado.historicoPeso = registrarPeso([], { data: hoje(), kg: estado.perfil.pesoKg });
  const atual = estado.historicoPeso.at(-1).kg;
  if (estado.perfil.pesoKg !== atual) estado.perfil = { ...estado.perfil, pesoKg: atual };
}

// ---------- Conquistas ----------

const discoDaMedalha = (m) => `<span class="medalha-disco g-${m.grupo}" aria-hidden="true">${m.emoji}</span>`;
const dataCompleta = (data) => `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;

function linhaDaMedalha(m) {
  const partes = m.conquistada
    ? [m.detalhe, dataCompleta(m.data)].filter(Boolean).join(', ')
    : m.descricao;
  const vezes = m.vezes ? ` Recorde batido ${m.vezes === 1 ? '1 vez' : `${m.vezes} vezes`}.` : '';
  return `
    <div class="medalha ${m.conquistada ? '' : 'bloqueada'}">
      ${discoDaMedalha(m)}
      <span class="sessao-corpo">
        <strong>${esc(m.nome)}</strong>${m.conquistada ? '' : '<span class="sr-only"> (ainda não conquistada)</span>'}
        <span class="suave">${esc(partes)}${vezes}</span>
        ${!m.conquistada && m.progresso?.atual > 0 ? `
          <span class="medalha-progresso"><i style="width:${Math.round((m.progresso.atual / m.progresso.meta) * 100)}%"></i></span>
          <span class="suave">${esc(m.progresso.texto)}</span>` : ''}
      </span>
    </div>`;
}

function telaMedalhas() {
  const medalhas = medalhasAtuais();
  const total = medalhas.filter((m) => m.conquistada).length;
  return `
    <button class="voltar" data-acao="voltar">‹ Voltar</button>
    <header class="topo">
      <p class="sobretitulo">${total} de ${medalhas.length}</p>
      <h1>Conquistas</h1>
      <p class="suave">Calculadas pelas suas corridas neste aparelho. Só corrida conta, e medalha não muda treino nem nível.</p>
    </header>
    ${GRUPOS.map((g) => {
      const doGrupo = medalhas.filter((m) => m.grupo === g.chave);
      return `
        <section class="cartao">
          <h2>${g.nome}</h2>
          <p class="suave">${g.texto}</p>
          ${doGrupo.map(linhaDaMedalha).join('')}
        </section>`;
    }).join('')}`;
}

function blocoConquistas() {
  const medalhas = medalhasAtuais();
  const conquistadas = medalhas.filter((m) => m.conquistada).sort((a, b) => b.data.localeCompare(a.data));
  return `
    <section class="cartao">
      <h2>Conquistas</h2>
      <p class="suave">${conquistadas.length} de ${medalhas.length} medalhas.</p>
      ${conquistadas.length ? `<div class="medalhas-recentes">${conquistadas.slice(0, 4).map((m) => `<span class="medalha-recente">${discoDaMedalha(m)}<small>${esc(m.nome)}</small></span>`).join('')}</div>` : ''}
      <button style="margin-top:10px" data-acao="ver-medalhas">Ver todas</button>
    </section>`;
}

function blocoNovasConquistas() {
  const novas = medalhasNovas(medalhasAtuais(), estado.medalhasVistas);
  if (!novas.length) return '';
  const primeiraVez = estado.medalhasVistas === null;
  const titulo = primeiraVez
    ? `Você já tem ${novas.length === 1 ? '1 conquista' : `${novas.length} conquistas`}`
    : novas.length === 1 ? 'Nova conquista' : `${novas.length} novas conquistas`;
  return `
    <section class="cartao destaque">
      <h2>${titulo}</h2>
      ${primeiraVez ? '<p class="suave">Calculadas pelo seu histórico de corridas.</p>' : ''}
      ${novas.slice(0, 3).map(linhaDaMedalha).join('')}
      <div class="botoes" style="margin-top:10px">
        <button class="principal" data-acao="ver-medalhas">Ver conquistas</button>
        <button data-acao="dispensar-medalhas">Ok</button>
      </div>
    </section>`;
}

function blocoProvasRealizadas() {
  const lista = provasRealizadas(estado.provas, estado.atividades);
  if (!lista.length) {
    return `
      <section class="cartao">
        <h2>Minhas provas realizadas</h2>
        <p class="suave">Nenhuma prova concluída ainda. Inclua suas provas na Planilha: depois de cada uma, o tempo, o pace e o nível aparecem aqui sozinhos.</p>
        <button data-acao="ver-provas">Minhas provas</button>
      </section>`;
  }
  const nome = (p) => `${String(Math.round(p.distanciaKm * 10) / 10).replace('.', ',')} km`;
  const grafico = linhaDeEvolucao(
    [...lista].reverse().map((p) => ({ data: p.data, valor: p.vdot })),
    { nome: 'VDOT nas provas', formatar: (v) => v.toFixed(1).replace('.', ','), passoMinimo: 0.5 },
  );
  return `
    <section class="cartao">
      <h2>Minhas provas realizadas</h2>
      ${lista.map((p) => `
        <div class="avulsa-linha">
          <span class="sessao-corpo">
            <strong>${esc(p.nome)}</strong>
            <span class="suave">${dataCurta(p.data)}, ${nome(p)}, ${formatarRitmo(p.seg / p.km)}/km, VDOT ${String(p.vdot).replace('.', ',')}</span>
            ${p.previstoSeg ? `<span class="suave">${esc(comparacaoComPrevisto(p.seg, p.previstoSeg))}</span>` : ''}
          </span>
          <span class="status">${formatarTempo(p.seg)}</span>
        </div>`).join('')}
      <h3>Melhor tempo por distância</h3>
      <table class="ritmos"><tbody>${melhoresPorDistancia(lista).map((p) => `<tr><td>${nome(p)}</td><td>${formatarTempo(p.seg)}</td></tr>`).join('')}</tbody></table>
      ${grafico ? `<h3>Nível estimado nas provas (VDOT)</h3>${grafico}` : ''}
      <p class="suave" style="margin-top:10px">O nível usa a distância oficial e o tempo do relógio. Percurso, relevo e calor mudam o resultado, então compare provas parecidas.</p>
    </section>`;
}

function blocoAnalise(atividade, sessao, previsto) {
  // Sem sessão é corrida fora da planilha: mostra como correu, sem comparar com previsto.
  const atributo = `data-analise="${esc(atividade.id)}"`;
  const analise = estado.analises[atividade.id];
  const atual = analise?.vdot === estado.plano.vdot ? analise : null;

  if (errosDeAnalise.has(atividade.id)) {
    return `
      <section class="cartao" ${atributo}>
        <h2>Análise do treino</h2>
        <p class="erro">${esc(errosDeAnalise.get(atividade.id))}</p>
        <button data-analisar="${esc(atividade.id)}">Tentar de novo</button>
      </section>`;
  }
  if (!atual) return `<section class="cartao" ${atributo}><h2>Análise do treino</h2><p class="suave">Analisando a corrida...</p></section>`;
  if (atual.semDados || !atual.total) {
    return `<section class="cartao" ${atributo}><h2>Análise do treino</h2><p class="suave">Esta corrida não tem pace segundo a segundo. Corridas em esteira sem sensor costumam vir assim.</p></section>`;
  }

  const comparacao = previsto ? compararComPrevisto(atual.seg, previsto.zonas) : null;
  const veredito = comparacao && vereditoDoTreino(comparacao);
  const partes = comparacao && [['abaixo', 'Abaixo', comparacao.abaixo], ['dentro', 'Na meta', comparacao.dentro], ['acima', 'Acima', comparacao.acima]];
  const anaerobico = atual.anaerobico / atual.total;

  return `
    <section class="cartao" ${atributo}>
      <p class="sobretitulo">${sessao?.tipo === 'prova' ? 'Análise da prova' : sessao ? 'Análise do treino' : 'Análise da corrida'}</p>
      ${comparacao ? `
        <h2>${esc(veredito.titulo)}</h2>
        <p class="meta-numero"><b>${pct(comparacao.dentro)}</b> do tempo na meta</p>
        <div class="meta-barra" role="img" aria-label="${partes.map(([, nome, f]) => `${nome}: ${pct(f)}`).join(', ')}">
          ${partes.map(([classe, , f]) => (f > 0 ? `<i class="${classe}" style="flex:${f}"></i>` : '')).join('')}
        </div>
        <div class="meta-legenda">
          ${partes.map(([classe, nome, f]) => `<span><i class="${classe}"></i>${nome} <b>${pct(f)}</b></span>`).join('')}
        </div>
        ${veredito.tendencia ? `<p class="suave">${esc(veredito.tendencia)}</p>` : ''}
        ${sessao.tipo === 'prova' ? '' : `<p class="suave">Distância: ${km(Math.round(atividade.km * 10) / 10)} de ${km(previsto.distanciaKm)} previstos (${pct(atividade.km / previsto.distanciaKm)}).</p>`}` : '<h2>Como você correu</h2>'}
      ${sessao?.tipo === 'prova' && atual.metades ? blocoDasMetades(atual.metades) : ''}
      <h3>Tempo em cada ritmo</h3>
      ${ORDEM_DAS_ZONAS.filter((z) => atual.seg[z] > 0).map((z) => barraDeZona(NOMES_DAS_ZONAS[z], atual.seg[z], atual.seg[z] / atual.total, z)).join('')}
      <h3>Aeróbico e anaeróbico (estimativa)</h3>
      <div class="numeros numeros-2">
        <div><b>${pct(1 - anaerobico)}</b><span>Aeróbico</span></div>
        <div><b>${pct(anaerobico)}</b><span>Anaeróbico</span></div>
      </div>
      ${atual.parado >= 60 ? `<p class="suave" style="margin-top:12px">Parado por ${formatarTempo(atual.parado)}, fora destas contas.</p>` : ''}
      <p class="suave" style="margin-top:12px">Calculado pelo pace do GPS e pelo seu nível. Anaeróbico aqui é o tempo no pace de intervalado ou mais rápido, uma aproximação: não mede o esforço do corpo, e subidas ou calor pesam sem mudar o pace. O Training Effect do Garmin não vem por esta conexão.</p>
    </section>`;
}

async function carregarAnalise(atividade) {
  if (analisesEmAndamento.has(atividade.id)) return;
  analisesEmAndamento.add(atividade.id);
  errosDeAnalise.delete(atividade.id);
  const vdot = estado.plano.vdot;
  try {
    const dados = await criarCliente({ chave: estado.chaveApi }).streamsDaCorrida(atividade.id);
    estado.analises = {
      ...estado.analises,
      [atividade.id]: dados ? { vdot, ...temposPorZona({ ...dados, ritmos: estado.plano.ritmos }) } : { vdot, semDados: true },
    };
    guardar();
  } catch (erro) {
    errosDeAnalise.set(atividade.id, erro.message);
  } finally {
    analisesEmAndamento.delete(atividade.id);
  }
  // Troca só este cartão, para a tela não voltar ao topo enquanto a pessoa lê.
  const id = CSS.escape(String(atividade.id));
  const sessao = sessaoDaCorrida(atividade, estado.plano.sessoes, estado.ligacoes);
  const cartao = document.querySelector(`[data-analise="${id}"]`);
  if (cartao) cartao.outerHTML = sessao ? blocoAnalise(atividade, sessao, detalharSessao(sessao, estado.plano.vdot)) : blocoAnalise(atividade, null, null);
  const feito = document.querySelector(`[data-feito="${id}"]`);
  if (feito && sessao) feito.textContent = textoFeito(atividade, sessao);
  const planejado = sessao && document.querySelector(`[data-planejado="${CSS.escape(sessao.id)}"]`);
  if (planejado) planejado.outerHTML = blocoPlanejado(sessao);
}

const analisePronta = (atividade) => estado.analises[atividade.id]?.vdot === estado.plano.vdot;

function pedirAnalises(sessao) {
  if (!estado.chaveApi) return;
  for (const atividade of corridasDoTreino(sessao, estado.atividades, estado.ligacoes)) {
    if (atividade.id && !analisePronta(atividade) && !errosDeAnalise.has(atividade.id)) carregarAnalise(atividade);
  }
}

// Baixa sozinho o pace das corridas recentes, uma por vez. Uma falha aqui fica em silêncio:
// a análise é tentada de novo na próxima abertura ou ao abrir o treino.
async function analisarRecentes() {
  if (!estado.chaveApi || !estado.plano || !navigator.onLine) return;
  const limite = somarDias(hoje(), -DIAS_DE_ANALISE_AUTOMATICA);
  const pendentes = estado.atividades
    .filter((a) => a.id && a.data >= limite && !analisePronta(a))
    .slice(-MAXIMO_DE_ANALISES_POR_VEZ);
  for (const atividade of pendentes) {
    await carregarAnalise(atividade);
    if (errosDeAnalise.has(atividade.id)) {
      errosDeAnalise.delete(atividade.id);
      return;
    }
  }
}

function textoFeito(atividade, sessao) {
  const base = `Feito: ${km(atividade.km)} em ${formatarTempo(atividade.seg)}`;
  const analise = estado.analises[atividade.id];
  if (!analise?.total || !analisePronta(atividade)) return base;
  const comparacao = compararComPrevisto(analise.seg, detalharSessao(sessao, estado.plano.vdot).zonas);
  return comparacao ? `${base}, ${pct(comparacao.dentro)} na meta` : base;
}

function blocoRealizado(atividade, previsto) {
  const numeros = [
    ['Distância', km(atividade.km)],
    ['Tempo', formatarTempo(atividade.seg)],
    ['Pace médio', atividade.seg ? ritmoDe(atividade.seg, atividade.km) : 'Sem dado'],
  ];
  const extras = [
    atividade.fcMedia ? ['FC média', `${atividade.fcMedia} bpm`] : null,
    atividade.fcMaxima ? ['FC máxima', `${atividade.fcMaxima} bpm`] : null,
    atividade.subida ? ['Subida', `${Math.round(atividade.subida)} m`] : null,
    atividade.calorias ? ['Calorias', `${Math.round(atividade.calorias)} kcal`] : null,
    atividade.cadencia ? ['Cadência', `${atividade.cadencia} ppm`] : null,
    atividade.carga ? ['Carga no intervals.icu', String(Math.round(atividade.carga))] : null,
    atividade.rpe ? ['Esforço no intervals.icu', `${atividade.rpe} de 10`] : null,
    atividade.sensacaoDoRelogio ? ['Sensação no intervals.icu', nomeDaSensacao(atividade.sensacaoDoRelogio)] : null,
  ].filter(Boolean);
  // Corridas guardadas por versões anteriores não têm as zonas até a próxima atualização.
  const tempoPorZona = atividade.tempoPorZonaFc ?? [];
  const totalZonas = tempoPorZona.reduce((t, s) => t + s, 0);
  const zonasFc = totalZonas
    ? tempoPorZona
      .map((s, i) => (s > 0 ? barraDeZona(`Z${i + 1} de FC`, s, s / totalZonas) : ''))
      .join('')
    : '';

  return `
    <section class="cartao">
      <h2>O que você fez</h2>
      <div class="numeros">${numeros.map(([n, v]) => `<div><b>${esc(v)}</b><span>${n}</span></div>`).join('')}</div>
      ${extras.length ? `<table class="ritmos"><tbody>${extras.map(([n, v]) => `<tr><td>${n}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${zonasFc ? `<h3>Tempo por zona de frequência cardíaca</h3>${zonasFc}<p class="suave">Zonas calculadas pelo intervals.icu.</p>` : ''}
      ${atividade.id && estado.chaveApi ? `
        <h3>Baixar esta corrida</h3>
        <div class="botoes">
          <button data-baixar="fit" data-id="${esc(atividade.id)}" data-data="${esc(atividade.data)}">Arquivo FIT</button>
          <button data-baixar="gpx" data-id="${esc(atividade.id)}" data-data="${esc(atividade.data)}">Arquivo GPX</button>
        </div>` : ''}
    </section>`;
}

// ---------- Evolução ----------

function comparacao(atual, anterior) {
  if (!anterior) return 'Sem período anterior para comparar';
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  if (pct === 0) return 'Igual aos 28 dias anteriores';
  return `${Math.abs(pct)}% ${pct > 0 ? 'a mais' : 'a menos'} que nos 28 dias anteriores`;
}

function telaEvolucao() {
  const dia = hoje();
  const { atividades, plano } = estado;
  const atualizacao = estado.chaveApi ? `
    <section class="cartao">
      <p class="suave">${estado.ultimaSincronizacao ? `Atualizado em ${new Date(estado.ultimaSincronizacao).toLocaleString('pt-BR')}` : 'Corridas ainda não atualizadas.'}</p>
      <button data-acao="sincronizar">Atualizar corridas</button>
    </section>` : '';

  const cabecalho = `<header class="topo"><h1>Evolução</h1></header>${barraDeSecoes('evolucao', [['resumo', 'Resumo'], ['graficos', 'Gráficos'], ['corpo', 'Corpo'], ['provas', 'Provas']])}`;
  const previsoes = [[5, '5 km'], [10, '10 km'], [21.1, 'Meia maratona'], [42.2, 'Maratona']]
    .map(([distancia, nome]) => `<tr><td>${nome}</td><td>${formatarTempo(preverTempoSeg(plano.vdot, distancia))}</td></tr>`)
    .join('');
  const blocoPrevisoes = `
    <section class="cartao">
      <h2>Previsão de prova pelo nível atual</h2>
      <p class="suave">VDOT ${String(plano.vdot).replace('.', ',')}. Estimativa teórica, que supõe treino específico para cada distância.</p>
      <table class="ritmos"><tbody>${previsoes}</tbody></table>
    </section>`;

  const secaoCorpo = blocoPeso();
  const secaoProvas = `${blocoProvasRealizadas()}${blocoPrevisoes}`;

  if (!atividades.length) {
    const vazio = `
      <section class="cartao alerta">
        <h2>Ainda não há corridas</h2>
        <p>${estado.chaveApi ? 'Quando o Garmin sincronizar com o intervals.icu, suas corridas aparecem aqui.' : 'Conecte o intervals.icu nos Ajustes para trazer suas corridas do Garmin.'}</p>
      </section>`;
    return `${cabecalho}${{
      resumo: `${vazio}${blocoConquistas()}${blocoOutrasNaEvolucao(dia)}${atualizacao}`,
      graficos: `${vazio}${blocoFeedbackNaEvolucao(dia)}`,
      corpo: secaoCorpo,
      provas: secaoProvas,
    }[secoes.evolucao]}`;
  }

  const semanas = resumoSemanal({ atividades, plano, hoje: dia });
  const { atual, anterior } = compararPeriodos(atividades, dia);
  const dispensados = sessoesDispensadas(estado.naoFeitos);
  const adesao = adesaoDoPeriodo({ atividades, plano: { ...plano, sessoes: plano.sessoes.filter((s) => !dispensados.includes(s.id)) }, hoje: dia });
  const recordes = calcularRecordes(atividades.filter((a) => !a.manual));
  const zonas = zonasDoPeriodo(atividades, dia);
  const grafRitmo = linhaDeEvolucao(
    semanas.map((s) => ({ data: s.segunda, valor: s.ritmo })),
    { nome: 'Pace médio', formatar: (v) => `${formatarRitmo(v)}/km`, formatarEixo: formatarRitmo, menorEhMelhor: true, passoMinimo: 5 },
  );
  const grafEficiencia = linhaDeEvolucao(
    semanas.map((s) => ({ data: s.segunda, valor: s.metrosPorBatimento })),
    { nome: 'Metros por batimento', formatar: (v) => `${v.toFixed(2).replace('.', ',')} m`, formatarEixo: (v) => v.toFixed(2).replace('.', ','), passoMinimo: 0.02 },
  );
  const grafNivel = linhaDeEvolucao(
    estado.historicoNivel.map((p) => ({ data: p.data, valor: p.vdot })),
    { nome: 'VDOT', formatar: (v) => v.toFixed(1).replace('.', ','), passoMinimo: 0.5 },
  );
  const linhasRecordes = !recordes ? [] : [
    ['Maior corrida', `${km(recordes.maiorCorrida.km)}, ${dataCurta(recordes.maiorCorrida.data)}`],
    ['Melhor pace (5 km ou mais)', recordes.melhorPace ? `${formatarRitmo(recordes.melhorPace.ritmo)}/km, ${dataCurta(recordes.melhorPace.data)}` : 'Ainda sem corrida de 5 km'],
    ['Maior semana', `${km(recordes.maiorSemana.km)}, a partir de ${dataCurta(recordes.maiorSemana.segunda)}`],
  ];

  const secaoGraficos = `
    <section class="cartao">
      <h2>Volume por semana (km)</h2>
      ${barrasDeVolume(semanas, km)}
    </section>
    ${grafRitmo ? `
      <section class="cartao">
        <h2>Pace médio por semana</h2>
        <p class="suave">Mais rápido fica no alto. Sem provas e corridas abaixo de 3 km.</p>
        ${grafRitmo}
      </section>` : ''}
    ${blocoFeedbackNaEvolucao(dia)}
    ${grafEficiencia ? `
      <section class="cartao">
        <h2>Eficiência</h2>
        <p class="suave">Metros corridos por batimento cardíaco. Subir é bom sinal, mas calor e terreno também mudam o valor.</p>
        ${grafEficiencia}
      </section>` : ''}
    ${grafNivel ? `
      <section class="cartao">
        <h2>Nível estimado (VDOT)</h2>
        ${grafNivel}
      </section>` : ''}
    ${zonas.length ? `
      <section class="cartao">
        <h2>Zonas de frequência cardíaca nos últimos 28 dias</h2>
        ${zonas.map((z) => barraDeZona(`Z${z.zona}`, z.seg, z.fracao)).join('')}
        <p class="suave">Zonas calculadas pelo intervals.icu.</p>
      </section>` : ''}`;

  if (secoes.evolucao === 'graficos') return `${cabecalho}${secaoGraficos}`;
  if (secoes.evolucao === 'corpo') return `${cabecalho}${secaoCorpo}`;
  if (secoes.evolucao === 'provas') {
    return `${cabecalho}
      ${recordes ? `
        <section class="cartao">
          <h2>Recordes em 12 meses</h2>
          <table class="ritmos"><tbody>${linhasRecordes.map(([n, v]) => `<tr><td>${n}</td><td>${v}</td></tr>`).join('')}</tbody></table>
        </section>` : ''}
      ${secaoProvas}`;
  }

  return `${cabecalho}
    <section class="heroi">
      <p class="sobretitulo">Últimos 28 dias</p>
      <p class="heroi-numero">${numeroKm(Math.round(atual.km * 10) / 10)}<small>km</small></p>
      <div class="heroi-dados">
        <div><b>${atual.corridas}</b><span>Corridas</span></div>
        <div><b>${formatarTempo(atual.seg)}</b><span>Tempo</span></div>
        ${adesao === null ? '' : `<div><b>${Math.round(adesao * 100)}%</b><span>Do previsto</span></div>`}
      </div>
      <p style="margin:14px 0 0">${comparacao(atual.km, anterior.km)}.</p>
    </section>
    ${blocoConquistas()}
    ${blocoOutrasNaEvolucao(dia)}
    <section class="cartao">
      <h2>Baixar meus dados</h2>
      <p class="suave">Planilha com ${atividades.length} corridas dos últimos 12 meses, para abrir no Excel. O arquivo FIT ou GPX de cada corrida fica nos detalhes do treino.</p>
      <button data-acao="baixar-csv">Baixar planilha (CSV)</button>
    </section>
    ${atualizacao}`;
}

function blocoMudarDia(sessao, dia) {
  const pode = sessao.tipo !== 'prova' && sessao.data >= dia && !corridasDoTreino(sessao, estado.atividades, estado.ligacoes).length && !estado.naoFeitos[sessao.id];
  if (!pode) return '';
  const opcoes = diasParaMudar({ plano: estado.plano, sessao, atividades: estado.atividades, hoje: dia });
  return `
    <details class="cartao mudar-dia">
      <summary>Mudar o dia deste treino</summary>
      ${opcoes.length ? `
        <p class="suave">Dias livres desta semana. Fora dela, o volume calculado para cada semana mudaria.</p>
        ${opcoes.map((o) => `
          <button class="opcao-dia" data-mudar-dia="${o.data}">
            <strong>${dataLonga(o.data)}</strong>
            ${o.aviso ? `<span class="opcao-aviso">${esc(o.aviso)}</span>` : ''}
          </button>`).join('')}`
        : '<p class="suave" style="margin:12px 0 0">Não há outro dia livre nesta semana.</p>'}
    </details>`;
}

function mudarDia(novaData) {
  const sessao = estado.plano.sessoes.find((s) => s.id === sessaoAberta);
  const novoId = `pc-${novaData}`;
  const jaEnviada = sessao.id in estado.assinaturas || estado.enviados.includes(sessao.id);
  estado.plano = mudarDiaDaSessao(estado.plano, sessao.id, novaData);
  if (estado.avaliacoes[sessao.id]) {
    const { [sessao.id]: nota, ...demais } = estado.avaliacoes;
    estado.avaliacoes = { ...demais, [novoId]: nota };
  }
  // Assinatura vazia conta como conteúdo a conferir: o envio automático troca o treino no calendário já.
  if (jaEnviada && estado.envioAutomatico) estado.assinaturas = { ...estado.assinaturas, [novoId]: '' };
  sessaoAberta = novoId;
  guardar();
  render();
  mostrarAviso(`Treino movido para ${dataLonga(novaData)}.${estado.chaveApi && jaEnviada && !estado.envioAutomatico ? ' Envie de novo em Planilha.' : ''}`);
  setTimeout(enviarAutomaticamente);
}

// ---------- Situação do treino ----------

function blocoDoRegistro(sessao, dia) {
  const r = situacaoDaSessao(sessao, dia);
  if (r.situacao === 'planejado' && sessao.data > dia) return '';
  const ligadas = r.corridas.filter((a) => estado.ligacoes[chaveDaCorrida(a)]);
  const manuais = r.corridas.filter((a) => a.manual);
  const pct = Math.round((r.km / sessao.distanciaKm) * 100);

  if (r.situacao === 'feito' || r.situacao === 'parcial') {
    return `
      <section class="cartao">
        <h2>${r.situacao === 'feito' ? 'Treino cumprido' : 'Treino feito em parte'}</h2>
        <p>${km(Math.round(r.km * 10) / 10)} de ${km(sessao.distanciaKm)} previstos (${pct}%).</p>
        <p class="suave">Cumprido a partir de 80% da distância, um corte definido pelo app.</p>
        ${ligadas.map((a) => `
          <div class="avulsa-linha">
            <span class="sessao-corpo"><strong>Feito em ${dataCurta(a.data)}</strong><span class="suave">${km(Math.round(a.km * 10) / 10)}</span></span>
            <button data-desligar="${esc(chaveDaCorrida(a))}">Desfazer</button>
          </div>`).join('')}
        ${manuais.map((a) => `<button class="avulsa-linha" data-corrida-manual="${esc(a.idManual)}"><span class="sessao-corpo"><strong>Corrida registrada à mão</strong><span class="suave">${km(Math.round(a.km * 10) / 10)}, ${formatarTempo(a.seg)}</span></span><span class="sessao-fim"><span class="selo">Editar</span>${icone('seta')}</span></button>`).join('')}
      </section>`;
  }

  if (r.situacao === 'nao-feito') {
    return `
      <section class="cartao">
        <h2>Treino não feito</h2>
        <p>Motivo: ${esc(nomeDoMotivo(r.motivo).toLowerCase())}.</p>
        <p class="suave">${motivoDispensa(r.motivo) ? 'Não conta como falta na Revisão e não quebra a sequência de semanas.' : 'Conta como falta na Revisão e na sequência de semanas.'}</p>
        ${r.motivo === 'dor' ? '<p class="suave">A Revisão vai sugerir reduzir a carga. Se a dor persistir, procure um profissional.</p>' : ''}
        <button data-desfazer-nao-feito="${esc(sessao.id)}">Desfazer</button>
      </section>`;
  }

  const candidatas = corridasParaLigar({ sessao, sessoes: estado.plano.sessoes, corridas: estado.atividades, ligacoes: estado.ligacoes });
  return `
    <section class="cartao ${r.situacao === 'perdido' ? 'alerta' : ''}">
      <h2>${r.situacao === 'perdido' ? 'Nenhuma corrida neste treino' : 'Registro do treino'}</h2>
      ${candidatas.length ? `
        <h3>Fiz em outro dia</h3>
        <p class="suave">${candidatas.length === 1 ? 'Encontrei esta corrida na mesma semana. É este treino?' : 'Encontrei estas corridas na mesma semana. Alguma é este treino?'}</p>
        ${candidatas.map((a) => `
          <div class="avulsa-linha">
            <span class="sessao-corpo"><strong>${esc(dataCurta(a.data))}</strong><span class="suave">${esc(a.nome ?? 'Corrida')}, ${km(Math.round(a.km * 10) / 10)}</span></span>
            <button data-ligar="${esc(chaveDaCorrida(a))}" data-sessao="${esc(sessao.id)}">É este</button>
          </div>`).join('')}` : ''}
      <button style="margin-top:10px" data-corrida-manual="nova" data-data="${esc(sessao.data)}">Registrar corrida sem relógio</button>
      <form id="form-nao-feito" data-sessao="${esc(sessao.id)}" style="margin-top:14px">
        <label>Motivo
          <select name="motivo">${MOTIVOS.map((m) => `<option value="${m.chave}">${esc(m.nome)}</option>`).join('')}</select>
        </label>
        <button type="submit" style="margin-top:10px">Não fiz este treino</button>
        <p class="suave" style="margin:10px 0 0">Doença e dor não contam como falta. Se a corrida chegar depois, ela vale.</p>
      </form>
    </section>`;
}

// ---------- Corrida sem relógio ----------

function telaCorridaManual() {
  const dia = hoje();
  const item = estado.corridasManuais.find((a) => a.idManual === corridaManualAberta.id);
  const seg = item?.seg ?? 0;
  const valor = (v) => (item ? v : '');
  return `
    <button class="voltar" data-acao="voltar">‹ Voltar</button>
    <header class="topo">
      <h1>${item ? 'Editar corrida' : 'Corrida sem relógio'}</h1>
      <p class="suave">O que o relógio grava chega sozinho. Registre aqui só o que ficou de fora, para não contar duas vezes. Conta no volume e nos marcos, mas não no nível nem nos recordes.</p>
    </header>
    <form class="cartao" id="form-corrida">
      <label>Data<input name="data" type="date" max="${dia}" value="${esc(item?.data ?? corridaManualAberta.data ?? dia)}" required></label>
      <label>Distância em km<input name="km" inputmode="decimal" placeholder="Ex.: 5,2" value="${item ? String(item.km).replace('.', ',') : ''}" required></label>
      <div class="linha3">
        <label>Horas<input name="horas" type="number" inputmode="numeric" min="0" max="23" value="${valor(Math.floor(seg / 3600))}"></label>
        <label>Minutos<input name="minutos" type="number" inputmode="numeric" min="0" max="59" value="${valor(Math.floor((seg % 3600) / 60))}"></label>
        <label>Segundos<input name="segundos" type="number" inputmode="numeric" min="0" max="59" value="${valor(seg % 60)}"></label>
      </div>
      <label>Nome (opcional)<input name="nome" maxlength="60" placeholder="Ex.: Esteira da academia" value="${esc(item?.nome ?? '')}"></label>
      <p class="erro" id="erro-corrida" role="alert"></p>
      <div class="botoes">
        <button class="principal" type="submit">Salvar corrida</button>
        ${item ? '<button type="button" data-acao="excluir-corrida-manual">Apagar</button>' : ''}
      </div>
    </form>`;
}

function salvarCorridaManual(formulario) {
  const form = new FormData(formulario);
  const partes = ['horas', 'minutos', 'segundos'].map((n) => Number(form.get(n) || 0));
  const dados = {
    data: String(form.get('data') ?? ''),
    km: numero(form, 'km'),
    seg: partes[1] < 60 && partes[2] < 60 ? partes[0] * 3600 + partes[1] * 60 + partes[2] : 0,
  };
  const erro = erroDaCorridaManual(dados, hoje());
  if (erro) {
    document.getElementById('erro-corrida').textContent = erro;
    return;
  }
  const editando = estado.corridasManuais.some((a) => a.idManual === corridaManualAberta.id);
  const idManual = editando ? corridaManualAberta.id : `cm-${Date.now()}`;
  const nome = String(form.get('nome') ?? '').trim() || 'Corrida sem relógio';
  const registro = { ...dados, id: null, idManual, nome, manual: true, prova: false, rpe: null, fcMedia: null, fcMaxima: null, subida: null, tempoPorZonaFc: [], origem: 'manual' };
  estado.corridasManuais = editando ? estado.corridasManuais.map((a) => (a.idManual === idManual ? registro : a)) : [...estado.corridasManuais, registro];
  reunirCorridas(estado.atividades.filter((a) => !a.manual));
  guardar();
  corridaManualAberta = null;
  render();
  window.scrollTo(0, rolagemAnterior);
  mostrarAviso('Corrida salva.');
}

function telaDetalhe(sessao) {
  const dia = hoje();
  const d = detalharSessao(sessao, estado.plano.vdot);
  const realizadas = corridasDoTreino(sessao, estado.atividades, estado.ligacoes);
  const numeros = [
    ['Distância', km(Math.round(d.distanciaKm * 10) / 10)],
    [sessao.tipo === 'prova' ? 'Tempo previsto' : 'Tempo estimado', formatarTempo(d.tempoSeg)],
    ['Pace médio', `${formatarRitmo(d.ritmoMedio)}/km`],
  ];
  const passos = d.blocos.map((bloco) => `
    <div class="bloco">
      <h3>${esc(bloco.rotulo)}${bloco.repeticoes > 1 ? `, ${bloco.repeticoes} vezes` : ''}</h3>
      ${bloco.passos.map((p) => `
        <div class="passo cor-${p.zona}">
          <span class="chip-zona">${ZONAS[p.zona].codigo}</span>
          <span><strong>${p.km !== undefined ? km(p.km) : `${p.minutos} min`}</strong> a ${textoRitmo(p.ritmo)}<br>
          <span class="suave">${esc(ZONAS[p.zona].nome)}, cerca de ${formatarTempo(p.tempoSeg)}</span></span>
        </div>`).join('')}
    </div>`).join('');

  return `
    <section class="heroi ${classeTipo(sessao.tipo)}">
      <button class="voltar" data-acao="voltar">‹ Voltar</button>
      <p class="sobretitulo">${dataLonga(sessao.data)}</p>
      <h1>${esc(sessao.nome)}</h1>
      ${seloTipo(sessao.tipo)}
      ${perfilDoTreino(d)}
      <div class="numeros">${numeros.map(([n, v]) => `<div><b>${esc(v)}</b><span>${n}</span></div>`).join('')}</div>
      <p style="margin:14px 0 0;font-size:.85rem">${sessao.tipo === 'prova' ? 'Previsão pelo seu nível atual.' : `Estimativa pelo meio das faixas de ritmo, com o seu nível atual. Nessas faixas, o treino leva ${faixaDoTreino(sessao).tempo}.`}</p>
    </section>
    ${blocoDoRegistro(sessao, dia)}
    ${blocoPlanejado(sessao)}
    ${realizadas.length ? cartaoDeFeedback({ chave: sessao.id, data: sessao.data, titulo: sessao.nome }) : ''}
    ${blocoMudarDia(sessao, dia)}
    ${sessao.tipo === 'prova' && realizadas.length ? blocoResultadoDaProva(sessao, realizadas.find((a) => a.prova) ?? realizadas[0]) : ''}
    ${estado.chaveApi ? realizadas.filter((a) => a.id).map((a) => blocoAnalise(a, sessao, d)).join('') : ''}
    ${realizadas.map((a) => blocoRealizado(a, d)).join('')}
    ${realizadas.map(blocoPercurso).join('')}
    <section class="cartao">
      <h2>Por que este treino</h2>
      <p>${esc(sessao.porque)}</p>
    </section>
    ${passos ? `<section class="cartao"><h2>Passo a passo</h2>${passos}</section>` : ''}
    ${d.zonas.length ? `
      <section class="cartao">
        <h2>Tempo por zona de ritmo</h2>
        ${d.zonas.map((z) => `${barraDeZona(`${z.codigo} ${z.nome}`, z.tempoSeg, z.fracao, z.chave)}<p class="suave">${esc(z.sensacao)}</p>`).join('')}
        <p class="suave">Zonas de ritmo calculadas pelo app. São diferentes das zonas de frequência cardíaca do relógio.</p>
      </section>` : ''}`;
}

function telaPlano() {
  const dia = hoje();
  const { plano, objetivo } = estado;
  const semanas = new Map();
  for (const s of plano.sessoes) semanas.set(s.semana, [...(semanas.get(s.semana) ?? []), s]);
  const semanaAtual = segundaDaSemana(dia);
  const meta = objetivo.distanciaKm ? `Prova de ${String(objetivo.distanciaKm).replace('.', ',')} km em ${dataCurta(objetivo.dataProva)}` : 'Condicionamento';
  const futuras = plano.sessoes.filter((s) => s.data >= dia).length;
  const totalDaSemana = (sessoes) => sessoes.reduce((t, s) => t + s.distanciaKm, 0);
  const maiorSemana = Math.max(...[...semanas.values()].map(totalDaSemana));

  const lista = [...semanas.values()].map((sessoes) => {
    const primeira = sessoes[0];
    const total = totalDaSemana(sessoes);
    const atual = segundaDaSemana(primeira.data) === semanaAtual;
    const aberta = atual || (dia < plano.inicio && primeira.semana === semanas.keys().next().value);
    const feito = feitoForaDosTreinos({ segunda: segundaDaSemana(primeira.data), ...dadosDaAtividade() });
    const linhas = [
      ...sessoes.map((s) => ({ data: s.data, html: linhaSessao(s, dia) })),
      ...feito.map((f) => ({ data: f.data, html: linhaFeitaNaSemana(f) })),
    ].sort((a, b) => a.data.localeCompare(b.data));
    return `
      <details class="semana ${atual ? 'atual' : ''}" ${aberta ? 'open' : ''}>
        <summary>
          <span class="semana-numero" aria-label="Semana ${primeira.semana}">${primeira.semana}</span>
          <span class="semana-info">
            <strong>${FASES[primeira.fase]}${primeira.recuperacao ? ', recuperação' : ''}</strong>
            <span class="suave">${sessoes.length} treinos${feito.length ? `, ${esc(contagemDoFeito(feito))}` : ''}</span>
            <span class="semana-carga"><i style="width:${(total / maiorSemana) * 100}%"></i></span>
          </span>
          <span class="status">${km(Math.round(total * 2) / 2)}</span>
        </summary>
        ${linhas.map((l) => l.html).join('')}
      </details>`;
  }).join('');

  return `
    <header class="topo">
      <p class="sobretitulo">Seu ciclo</p>
      <h1>Minha planilha</h1>
      <p class="suave">${esc(meta)}, ${plano.totalSemanas} semanas</p>
    </header>
    ${avisoPlanilhaAntiga()}
    ${barraDeSecoes('plano', [['semanas', 'Semanas'], ['calendario', 'Calendário'], ['provas', 'Provas']])}
    ${secoes.plano === 'calendario' ? blocoCalendario(dia) : ''}
    ${secoes.plano === 'provas' ? blocoProvas(dia) : ''}
    ${secoes.plano === 'semanas' ? `
    ${blocoDoObjetivo(dia)}
    ${plano.prudencia?.prudente ? `<section class="cartao alerta"><strong>Progressão mais cuidadosa:</strong> ${esc(plano.prudencia.motivos.join(', '))}.</section>` : ''}
    ${(plano.avisos ?? []).map((a) => `<section class="cartao alerta">${esc(a)}</section>`).join('')}
    ${semanaAntesDoInicio(dia)}
    ${lista}
    ${(() => {
      const semanaVista = plano.sessoes.find((s) => s.data >= dia)?.semana;
      const treinos = plano.sessoes.filter((s) => s.semana === semanaVista).length;
      if (!treinos) return '';
      const livres = estado.perfil.diasSemana.length;
      return `<section class="cartao"><h2>Treino e descanso</h2><p>${treinos} treinos e ${7 - treinos} dias de descanso nesta etapa.</p><p class="suave">Você marcou ${livres} dias livres. Os treinos só aumentam quando o volume sustenta, com o maior intervalo possível entre eles.</p></section>`;
    })()}
    <section class="cartao">
      <h2>Levar para o relógio</h2>
      ${estado.chaveApi
        ? `<p>${esc(textoEnvioAutomatico())}</p>
           ${estado.envioAutomatico && estado.erroEnvioAutomatico ? `<p class="erro">Último envio automático falhou: ${esc(estado.erroEnvioAutomatico)}</p>` : ''}
           <p class="suave">Os treinos vão ao calendário do intervals.icu e seguem para o Garmin se a opção "Upload planned workouts" estiver ligada lá.</p>
           ${estado.ultimoEnvio ? `<p class="suave">Último envio: ${new Date(estado.ultimoEnvio).toLocaleString('pt-BR')}</p>` : ''}
           <button data-acao="enviar" ${futuras ? '' : 'disabled'}>Enviar toda a planilha agora (${futuras})</button>`
        : '<p class="suave">Conecte o intervals.icu nos Ajustes para enviar os treinos.</p>'}
    </section>` : ''}`;
}

// ---------- Revisão ----------

const TITULOS_ACAO = {
  seguir: 'Tudo certo: seguir em frente',
  manter: 'Segurar a carga por uma semana',
  reduzir: 'Reduzir para recuperar',
  semDados: 'Ainda é cedo para revisar',
  analise: 'Análise atualizada com suas corridas',
  dias: 'Dias de treino alterados',
  provas: 'Calendário de provas alterado',
};

function blocoAtualizarAnalise() {
  if (!estado.chaveApi) return '';
  if (!analisePendente) {
    return `
      <section class="cartao">
        <h2>Atualizar análise</h2>
        <p class="suave">Busca suas corridas, recalcula seu nível e volume e mostra como a planilha ficaria. Nada muda antes da sua confirmação.</p>
        <button class="principal" data-acao="atualizar-analise">Atualizar análise</button>
      </section>`;
  }
  const { antes, depois, base, origem, aPartirDe } = analisePendente;
  const nivel = (v) => String(v).replace('.', ',');
  const linhas = [
    ['Nível (VDOT)', nivel(antes.vdot), nivel(depois.vdot)],
    ['Treinos na semana', antes.treinos, depois.treinos],
    ['Volume na semana', km(antes.km), km(depois.km)],
  ];
  return `
    <section class="cartao destaque">
      <h2>Nova análise</h2>
      <p class="suave">Mudanças a partir de ${dataCurta(aPartirDe)}. Treinos anteriores continuam iguais.</p>
      <table class="ritmos comparacao">
        <thead><tr><th></th><th>Hoje</th><th>Nova</th></tr></thead>
        <tbody>${linhas.map(([nome, a, b]) => `<tr><td>${nome}</td><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody>
      </table>
      <p class="suave" style="margin-top:12px">Base: ${km(base.kmSemana)} por semana nos últimos 28 dias, maior corrida de ${km(base.longoKm)}. Nível: ${esc(origem)}.</p>
      <p class="suave">Confira se a corrida usada no nível está certa. Erro de GPS pode inflar a estimativa.</p>
      <div class="botoes">
        <button class="principal" data-acao="aplicar-analise">Aplicar à planilha</button>
        <button data-acao="cancelar-analise">Manter como está</button>
      </div>
    </section>`;
}

function telaRevisao() {
  const dia = hoje();
  const analise = analisarRevisao(dadosDaRevisao(dia));
  const mudaRitmo = analise.novoVdot !== estado.plano.vdot;
  const revisadaHoje = estado.revisoes.some((r) => r.data === dia && r.acao !== 'analise');
  const podeAplicar = (analise.acao !== 'semDados' || mudaRitmo) && !revisadaHoje;

  return `
    <header class="topo">
      <p class="sobretitulo">Últimos 14 dias</p>
      <h1>Revisão</h1>
      <p class="suave">Compara os últimos 14 dias com o previsto. Só muda da próxima segunda em diante.</p>
    </header>
    ${blocoAtualizarAnalise()}
    ${estado.chaveApi ? `
      <section class="cartao">
        <p class="suave">${estado.ultimaSincronizacao ? `Atualizado em ${new Date(estado.ultimaSincronizacao).toLocaleString('pt-BR')}` : 'Corridas ainda não atualizadas.'}</p>
        <button data-acao="sincronizar">Atualizar corridas</button>
      </section>` : `
      <section class="cartao alerta">Sem o intervals.icu conectado, a revisão não enxerga suas corridas. Conecte nos Ajustes.</section>`}
    ${estado.semDados ? `<section class="cartao alerta">${estado.semDados === 1 ? '1 corrida veio' : `${estado.semDados} corridas vieram`} sem distância e ficou de fora da análise. Isso acontece em esteira sem sensor e em atividade que entrou pelo Strava. Se foi na rua, confira no intervals.icu se o Garmin está conectado diretamente.</section>` : ''}
    <section class="cartao veredito ${analise.acao}">
      <h2>${TITULOS_ACAO[analise.acao]}</h2>
      <ul class="motivos">${analise.motivos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      ${podeAplicar ? '<button class="principal" data-acao="aplicar-revisao">Aplicar à planilha</button>' : ''}
      ${revisadaHoje ? '<p class="suave">Revisão de hoje já aplicada.</p>' : ''}
    </section>
    ${estado.revisoes.length ? `
      <section class="cartao">
        <h2>Revisões anteriores</h2>
        ${[...estado.revisoes].reverse().map((r) => `<p><strong>${dataCurta(r.data)}:</strong> ${esc(TITULOS_ACAO[r.acao])}</p>`).join('')}
      </section>` : ''}`;
}

// ---------- Ajustes ----------

function blocoDiasDeTreino() {
  const { perfil } = estado;
  if (gradePendente) {
    const { antes, depois, aPartirDe } = gradePendente;
    const nomes = (dias) => DIAS.filter((d) => dias.includes(d.valor)).map((d) => d.curto).join(', ');
    const linhas = [
      ['Treinos', antes.treinos, depois.treinos],
      ['Volume', km(antes.km), km(depois.km)],
    ];
    return `
      <section class="cartao destaque" id="dias-de-treino">
        <h2>Nova grade de treino</h2>
        <p class="suave">Na semana de ${dataCurta(aPartirDe)}:</p>
        <p style="margin:0"><strong>Hoje:</strong> ${nomes(antes.dias)}</p>
        <p><strong>Nova:</strong> ${nomes(depois.dias)}</p>
        <table class="ritmos comparacao">
          <thead><tr><th></th><th>Hoje</th><th>Nova</th></tr></thead>
          <tbody>${linhas.map(([nome, a, b]) => `<tr><td>${nome}</td><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody>
        </table>
        <p class="suave" style="margin-top:12px">O app usa só os dias que o seu volume sustenta, então alguns dias marcados podem ficar livres. Nível e progressão continuam iguais.</p>
        <p class="suave">Treinos que você moveu de dia nas próximas semanas seguem a nova grade.</p>
        <div class="botoes">
          <button class="principal" data-acao="aplicar-grade">Aplicar à planilha</button>
          <button data-acao="cancelar-grade">Manter como está</button>
        </div>
      </section>`;
  }
  return `
    <form class="cartao" id="form-dias">
      <h2>Dias de treino</h2>
      <p class="suave">Marque os dias em que está livre e o app refaz a grade da próxima segunda em diante. Treinos passados e a semana em andamento não mudam. Se a planilha ainda não começou, ela é refeita por inteiro.</p>
      <fieldset>
        <legend>Dias em que está livre</legend>
        <div class="dias">
          ${DIAS.map((d) => `<label><input type="checkbox" name="dias" value="${d.valor}" ${perfil.diasSemana.includes(d.valor) ? 'checked' : ''}><span>${d.curto}</span></label>`).join('')}
        </div>
      </fieldset>
      <label>Dia do longão
        <select name="diaLongo">
          ${DIAS.map((d) => `<option value="${d.valor}" ${perfil.diaLongo === d.valor ? 'selected' : ''}>${d.nome}</option>`).join('')}
        </select>
      </label>
      <p id="erro-dias" class="erro" role="alert"></p>
      <button class="principal" type="submit">Ver como fica</button>
    </form>`;
}

function verNovaGrade(form) {
  const dados = new FormData(form);
  const diasSemana = dados.getAll('dias').map(Number);
  const diaLongo = Number(dados.get('diaLongo'));
  const erro = document.getElementById('erro-dias');
  if (diasSemana.length < 3) {
    erro.textContent = 'Marque pelo menos 3 dias livres.';
    return;
  }
  if (!diasSemana.includes(diaLongo)) {
    erro.textContent = 'O dia do longão precisa ser um dos dias livres.';
    return;
  }
  const dia = hoje();
  const proxima = dia < estado.plano.inicio ? estado.plano.inicio : proximaSegunda(dia);
  const ultima = estado.revisoes[estado.revisoes.length - 1];
  gradePendente = refazerComNovosDias({
    plano: estado.plano,
    parametros: parametrosAtuais(),
    diasSemana,
    diaLongo,
    // A revisão que pediu redução não pode ser desfeita por uma troca de dias.
    semQualidadeNaPrimeira: ultima?.acao === 'reduzir' && proximaSegunda(ultima.data) === proxima,
    hoje: dia,
  });
  if (!gradePendente) {
    erro.textContent = 'Não há semanas seguintes nesta planilha. Comece um novo ciclo.';
    return;
  }
  render();
  document.getElementById('dias-de-treino').scrollIntoView({ block: 'center' });
}

// Depois de cadastrados, os dados ficam só para leitura: alterar exige tocar em Editar.
function blocoUsuario() {
  const privacidade = '<p class="suave" style="margin:10px 0 0">Ficam só neste aparelho e entram na sua cópia de segurança. Não há cadastro central.</p>';
  const cadastrado = estado.nome && estado.nascimento;
  if (cadastrado && !editandoUsuario) {
    return `
      <section class="cartao">
        <h2>Usuário</h2>
        <table class="ritmos"><tbody>
          <tr><td>Nome</td><td>${esc(estado.nome)}</td></tr>
          <tr><td>Data de nascimento</td><td>${dataCompleta(estado.nascimento)}</td></tr>
          <tr><td>Idade</td><td>${idadeEm(estado.nascimento, hoje())} anos</td></tr>
        </tbody></table>
        <button style="margin-top:10px" data-acao="editar-usuario">Editar</button>
        ${privacidade}
      </section>`;
  }
  return `
    <form class="cartao" id="form-nome">
      <h2>${cadastrado ? 'Editar usuário' : 'Usuário'}</h2>
      ${camposDoUsuario()}
      <div class="botoes" style="margin-top:10px">
        <button class="principal" type="submit">Salvar</button>
        ${cadastrado ? '<button type="button" data-acao="cancelar-usuario">Cancelar</button>' : ''}
      </div>
      ${privacidade}
    </form>`;
}

// Como os dados do usuário: depois de salva, a chave só muda ou sai por Editar.
function blocoChave() {
  const passos = (aberto) => `
    <details class="passos-chave" ${aberto ? 'open' : ''}>
      <summary>Como conseguir a chave de API</summary>
      ${PASSOS_DA_CHAVE}
    </details>`;
  if (estado.chaveApi && !editandoChave) {
    return `
      <section class="cartao">
        <h2>Intervals.icu</h2>
        ${passos(false)}
        <table class="ritmos"><tbody>
          <tr><td>Situação</td><td>Chave salva</td></tr>
          <tr><td>Chave de API</td><td>••••••••</td></tr>
        </tbody></table>
        <button style="margin-top:10px" data-acao="editar-chave">Editar</button>
      </section>`;
  }
  return `
    <form class="cartao" id="form-chave">
      <h2>${estado.chaveApi ? 'Editar chave' : 'Intervals.icu'}</h2>
      ${passos(!estado.chaveApi)}
      <label>Chave de API<input name="chave" type="password" autocomplete="off" value="${esc(estado.chaveApi)}"></label>
      <div class="botoes">
        <button class="principal" type="submit">Salvar e testar</button>
        ${estado.chaveApi ? `
          <button type="button" data-acao="cancelar-chave">Cancelar</button>
          <button type="button" data-acao="remover-chave">Remover</button>` : ''}
      </div>
    </form>`;
}

function telaAjustes() {
  const { plano, perfil } = estado;
  const r = plano.ritmos;
  const linhasRitmo = [
    ['Leve e longão', textoRitmo(r.leve)],
    ['Ritmo de maratona', textoRitmo(r.maratona)],
    ['Ritmo de meia', textoRitmo(r.meia)],
    ['Limiar', textoRitmo(r.limiar)],
    ['Intervalado', textoRitmo(r.intervalado)],
  ];
  return `
    <header class="topo"><h1>Ajustes</h1></header>
    <section class="heroi">
      <p class="sobretitulo">Seu nível atual (VDOT)</p>
      <p class="heroi-numero">${String(plano.vdot).replace('.', ',')}</p>
      ${estado.origemVdot ? `<p style="margin:8px 0 0;font-size:.85rem">Base: ${esc(estado.origemVdot)}</p>` : ''}
    </section>
    <p class="grupo-titulo">Você</p>
    ${grupoDeAjuste('usuario', 'Usuário', esc(estado.nome), blocoUsuario())}
    ${grupoDeAjuste('perfil', 'Perfil', `${numeroPeso(perfil.pesoKg)} kg, ${esc(perfil.alturaCm)} cm`, `
      <p>${perfil.idade} anos, ${numeroPeso(perfil.pesoKg)} kg, ${esc(perfil.alturaCm)} cm, IMC ${numeroPeso(imcDe(perfil.pesoKg, perfil.alturaCm))}</p>
      <p class="suave" style="margin:0">O peso se registra em Evolução, em Corpo. Para mudar altura ou objetivo, comece um novo ciclo.</p>`)}
    <p class="grupo-titulo">Treino</p>
    ${grupoDeAjuste('dias', 'Dias de treino', DIAS.filter((d) => perfil.diasSemana.includes(d.valor)).map((d) => d.curto).join(', '), blocoDiasDeTreino())}
    ${grupoDeAjuste('ritmos', 'Seus ritmos', `Leve ${textoRitmo(r.leve)}`, `<table class="ritmos"><tbody>${linhasRitmo.map(([nome, valor]) => `<tr><td>${nome}</td><td>${valor}</td></tr>`).join('')}</tbody></table>`)}
    ${grupoDeAjuste('regras', 'Como a planilha é calculada', '', `
      <p class="suave">Cada regra mostra de onde vem. Nenhuma tem evidência forte para decidir sozinha, e nada disso garante evitar lesões. A planilha não substitui avaliação médica ou de um treinador.</p>
      ${REGRAS.map((regra) => `
        <details class="regra">
          <summary><span>${esc(regra.nome)}</span><span class="selo">${esc(ORIGENS[regra.origem])}</span></summary>
          <p class="suave">${esc(regra.texto)}</p>
          ${regra.fontes.length ? `<p class="suave">${regra.fontes.map(([nome, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(nome)}</a>`).join(', ')}</p>` : ''}
        </details>`).join('')}`)}
    <p class="grupo-titulo">Relógio</p>
    ${grupoDeAjuste('chave', 'Intervals.icu', estado.chaveApi ? 'Conectado' : 'Não conectado', blocoChave())}
    ${grupoDeAjuste('envio', 'Envio automático', estado.envioAutomatico ? 'Ligado' : 'Desligado', `
      <label class="marcar"><input type="checkbox" id="envio-automatico" ${estado.envioAutomatico ? 'checked' : ''}> Enviar os treinos de cada semana</label>
      <p class="suave" style="margin:0">A semana vai ao relógio na primeira vez que você abrir o app, a partir de ${DIAS_DE_ANTECEDENCIA} dias antes do primeiro treino dela. O iPhone não deixa o app rodar fechado, então ele precisa ser aberto nesse período.</p>`)}
    <p class="grupo-titulo">App</p>
    ${grupoDeAjuste('copia', 'Cópia de segurança', '', `
      <p class="suave">Seus dados ficam só neste aparelho. A cópia não inclui a chave de API.</p>
      <div class="botoes">
        <button data-acao="exportar">Exportar</button>
        <label style="margin:0"><span class="suave">Importar arquivo</span><input type="file" id="importar" accept="application/json,.json"></label>
      </div>`)}
    ${grupoDeAjuste('gestos', 'Gestos', '', `<p class="suave" style="margin:0">Deslize para os lados para trocar de aba. Dentro de um treino, deslize para a direita para voltar. No topo da tela, puxe para baixo para buscar corridas novas.</p>`)}
    <button class="perigo largo" style="margin-top:8px" data-acao="recomecar">Começar novo ciclo</button>
    <p class="suave" style="margin-top:12px;text-align:center">Versão ${VERSAO_APP}</p>`;
}

// ---------- Estrutura ----------

const ITENS_ABAS = [['hoje', 'Hoje'], ['plano', 'Planilha'], ['evolucao', 'Evolução'], ['revisao', 'Revisão'], ['ajustes', 'Ajustes']];
const ORDEM_ABAS = ITENS_ABAS.map(([id]) => id);

function renderAbas() {
  const itens = ITENS_ABAS;
  abas.hidden = false;
  abas.innerHTML = itens
    .map(([id, nome]) => `<button data-aba="${id}" ${aba === id ? 'aria-current="page"' : ''}>${icone(id)}${nome}</button>`)
    .join('');
}

// A idade entra na prudência da planilha: com a data de nascimento, ela nunca envelhece no cadastro.
function atualizarIdade() {
  if (estado.nascimento && estado.perfil) estado.perfil = { ...estado.perfil, idade: idadeEm(estado.nascimento, hoje()) };
}

function render() {
  atualizarIdade();
  atualizarPeso();
  if (!estado.plano && !estado.avisoCiente) return telaBoasVindas();
  if (!estado.plano) return telaCadastro(cadastroAnterior);
  renderAbas();
  if (avulsaAberta || provaAberta) {
    app.innerHTML = avulsaAberta ? telaAvulsa() : telaProva();
    window.scrollTo(0, 0);
    return;
  }
  if (corridaManualAberta) {
    app.innerHTML = telaCorridaManual();
    window.scrollTo(0, 0);
    return;
  }
  if (medalhasAbertas) {
    app.innerHTML = telaMedalhas();
    window.scrollTo(0, 0);
    return;
  }
  const atividade = atividadeAberta && atividadePorId(atividadeAberta);
  if (atividade) {
    app.innerHTML = telaAtividade(atividade);
    window.scrollTo(0, 0);
    if (atividade.tipoDaAtividade === 'corrida' && estado.chaveApi && !analisePronta(atividade) && !errosDeAnalise.has(atividade.id)) carregarAnalise(atividade);
    if (atividade.tipoDaAtividade !== 'semDados') carregarPercurso(atividade);
    return;
  }
  const aberta = sessaoAberta && estado.plano.sessoes.find((s) => s.id === sessaoAberta);
  const telas = { hoje: telaHoje, plano: telaPlano, evolucao: telaEvolucao, revisao: telaRevisao, ajustes: telaAjustes };
  app.innerHTML = aberta ? telaDetalhe(aberta) : telas[aba]();
  window.scrollTo(0, 0);
  if (aberta) {
    pedirAnalises(aberta);
    corridasDoTreino(aberta, estado.atividades, estado.ligacoes).forEach(carregarPercurso);
  }
}

abas.addEventListener('click', (e) => {
  const botao = e.target.closest('[data-aba]');
  if (!botao) return;
  aba = botao.dataset.aba;
  sessaoAberta = null;
  atividadeAberta = null;
  medalhasAbertas = false;
  editandoUsuario = false;
  editandoChave = false;
  corridaManualAberta = null;
  avulsaAberta = null;
  provaAberta = null;
  provasPendentes = null;
  render();
});

function voltarDoTreino() {
  if (corridaManualAberta) {
    // Do formulário volta para onde ele foi aberto, como um treino.
    corridaManualAberta = null;
    render();
    window.scrollTo(0, rolagemAnterior);
    return;
  }
  sessaoAberta = null;
  atividadeAberta = null;
  medalhasAbertas = false;
  avulsaAberta = null;
  provaAberta = null;
  provasPendentes = null;
  render();
  window.scrollTo(0, rolagemAnterior);
}

// Dentro de um treino, só voltar. Nas abas, trocar para a vizinha.
ligarGestos(app, {
  podeIniciar: () => Boolean(estado.plano) && !ocupado,
  temDestino: (direcao) => (corridaManualAberta || sessaoAberta || atividadeAberta || medalhasAbertas || avulsaAberta || provaAberta ? direcao === 'direita' : Boolean(abaDoGesto(ORDEM_ABAS, aba, direcao))),
  aoDeslizar: (direcao) => {
    if (corridaManualAberta || sessaoAberta || atividadeAberta || medalhasAbertas || avulsaAberta || provaAberta) {
      voltarDoTreino();
      return;
    }
    aba = abaDoGesto(ORDEM_ABAS, aba, direcao);
    render();
  },
});

ligarPuxada(app, document.getElementById('puxada'), {
  podeIniciar: () => Boolean(estado.plano) && !ocupado && !avulsaAberta && !provaAberta && !corridaManualAberta,
  aoAtualizar: atualizarPorGesto,
});

const acoes = {
  voltar: voltarDoTreino,

  ciente: () => {
    estado.avisoCiente = true;
    guardar();
    render();
    window.scrollTo(0, 0);
  },

  enviar: (botao) => comOcupado(botao, async () => {
    await enviarAoRelogio();
    render();
    mostrarAviso('Treinos enviados ao intervals.icu.');
  }),

  'atualizar-analise': (botao) => comOcupado(botao, async () => {
    await sincronizar();
    if (!estado.atividades.length) {
      render();
      mostrarAviso('Nenhuma corrida encontrada. Confira a conexão do Garmin no intervals.icu.');
      return;
    }
    const dia = hoje();
    analisePendente = reanalisarPlano({
      plano: estado.plano,
      parametros: parametrosAtuais(),
      atividades: estado.atividades,
      tempoInformado: estado.tempoInformado,
      hoje: dia,
    });
    render();
    if (!analisePendente) mostrarAviso('Esta planilha já terminou. Comece um novo ciclo nos Ajustes.');
  }),

  'excluir-prova': () => {
    const erro = document.getElementById('erro-prova');
    try {
      prepararProvas(estado.provas.filter((p) => p.id !== provaAberta), null);
    } catch (falha) {
      erro.textContent = falha.message;
    }
  },

  'cancelar-provas': () => {
    provasPendentes = null;
    voltarDoTreino();
  },

  'aplicar-provas': () => {
    const { novas, objetivo, resultado } = provasPendentes;
    estado.provas = novas;
    estado.objetivo = objetivo;
    estado.plano = resultado.plano;
    estado.revisoes.push({ data: hoje(), acao: 'provas', motivos: [] });
    guardar();
    voltarDoTreino();
    mostrarAviso(estado.chaveApi && !estado.envioAutomatico ? 'Planilha atualizada. Envie os treinos de novo.' : 'Planilha atualizada com as provas.');
    setTimeout(enviarAutomaticamente);
  },

  'excluir-avulsa': () => {
    if (!window.confirm('Excluir esta atividade?')) return;
    estado.avulsas = estado.avulsas.filter((a) => a.id !== avulsaAberta);
    guardar();
    voltarDoTreino();
    mostrarAviso('Atividade excluída.');
  },

  'cancelar-grade': () => {
    gradePendente = null;
    render();
  },

  'aplicar-grade': () => {
    estado.plano = gradePendente.plano;
    estado.perfil = gradePendente.perfil;
    estado.revisoes.push({ data: hoje(), acao: 'dias', motivos: [] });
    gradePendente = null;
    guardar();
    render();
    mostrarAviso(estado.chaveApi && !estado.envioAutomatico ? 'Grade refeita. Envie os treinos de novo em Planilha.' : 'Grade refeita.');
    setTimeout(enviarAutomaticamente);
  },

  'cancelar-analise': () => {
    analisePendente = null;
    render();
  },

  'aplicar-analise': () => {
    const { plano, origem } = analisePendente;
    const dia = hoje();
    estado.plano = plano;
    estado.origemVdot = origem;
    estado.historicoNivel = registrarNivel(estado.historicoNivel, dia, plano.vdot);
    estado.revisoes.push({ data: dia, acao: 'analise', motivos: [] });
    analisePendente = null;
    guardar();
    render();
    mostrarAviso(estado.chaveApi && !estado.envioAutomatico ? 'Planilha atualizada. Envie os treinos de novo em Planilha.' : 'Planilha atualizada.');
    setTimeout(enviarAutomaticamente);
  },

  'excluir-corrida-manual': () => {
    if (!window.confirm('Apagar esta corrida? Não dá para desfazer.')) return;
    const { id } = corridaManualAberta;
    estado.corridasManuais = estado.corridasManuais.filter((a) => a.idManual !== id);
    const { [id]: _removida, ...ligacoes } = estado.ligacoes;
    estado.ligacoes = ligacoes;
    reunirCorridas(estado.atividades.filter((a) => !a.manual));
    guardar();
    corridaManualAberta = null;
    render();
    window.scrollTo(0, rolagemAnterior);
    mostrarAviso('Corrida apagada.');
  },
  'editar-usuario': () => {
    editandoUsuario = true;
    renderMantendoRolagem();
  },
  'cancelar-usuario': () => {
    editandoUsuario = false;
    renderMantendoRolagem();
  },
  'ver-medalhas': () => {
    rolagemAnterior = window.scrollY;
    estado.medalhasVistas = chavesConquistadas(medalhasAtuais());
    guardar();
    medalhasAbertas = true;
    render();
  },
  'dispensar-medalhas': () => {
    estado.medalhasVistas = chavesConquistadas(medalhasAtuais());
    guardar();
    const rolagem = window.scrollY;
    render();
    window.scrollTo(0, rolagem);
  },
  'ver-calendario': () => {
    aba = 'plano';
    secoes.plano = 'calendario';
    sessaoAberta = null;
    mesVisto = null;
    diaVisto = null;
    render();
  },
  'ver-provas': () => {
    aba = 'plano';
    secoes.plano = 'provas';
    sessaoAberta = null;
    render();
  },
  sincronizar: (botao) => comOcupado(botao, async () => {
    await sincronizar();
    render();
    mostrarAviso(estado.atividades.length === 1 ? '1 corrida atualizada.' : `${estado.atividades.length} corridas atualizadas.`);
  }),

  'aplicar-revisao': (botao) => comOcupado(botao, async () => {
    const dia = hoje();
    const analise = analisarRevisao(dadosDaRevisao(dia));
    estado.plano = aplicarRevisao({ plano: estado.plano, parametros: parametrosAtuais(), analise, hoje: dia });
    estado.revisoes.push({ data: dia, acao: analise.acao, motivos: analise.motivos });
    estado.historicoNivel = registrarNivel(estado.historicoNivel, dia, estado.plano.vdot);
    guardar();
    render();
    mostrarAviso(estado.chaveApi && !estado.envioAutomatico ? 'Planilha ajustada. Envie os treinos de novo em Planilha.' : 'Planilha ajustada.');
    setTimeout(enviarAutomaticamente);
  }),

  exportar: () => salvarArquivo(exportar(estado), `run-gloria-${hoje()}.json`, 'application/json'),

  'baixar-csv': () => salvarArquivo(csvDasCorridas(estado.atividades), `corridas-${hoje()}.csv`, 'text/csv'),

  'editar-chave': () => {
    editandoChave = true;
    renderMantendoRolagem();
  },
  'cancelar-chave': () => {
    editandoChave = false;
    renderMantendoRolagem();
  },
  'remover-chave': () => {
    if (!window.confirm('Remover a chave deste aparelho? O app para de receber suas atividades até você colar a chave de novo.')) return;
    editandoChave = false;
    estado.chaveApi = '';
    guardar();
    render();
    mostrarAviso('Chave removida deste aparelho.');
  },

  recomecar: () => {
    if (!window.confirm('Isso apaga a planilha atual deste aparelho. Os treinos já enviados continuam no intervals.icu até você enviar os novos. Continuar?')) return;
    arquivarHistorico();
    const { avaliacoes, corridasManuais, historicoPeso, arquivoDeCorridas, arquivoDeSemanas, medalhasVistas, analises, nome, nascimento, provas, avulsas, outrasDoRelogio, chaveApi, atividades, enviados, assinaturas, envioAutomatico, semDados, corridasSemDados, perfil, objetivo, historicoNivel, ultimaSincronizacao } = estado;
    cadastroAnterior = {
      peso: perfil.pesoKg,
      altura: perfil.alturaCm,
      lesao: perfil.lesaoRecente,
      dias: perfil.diasSemana,
      diaLongo: perfil.diaLongo,
      distancia: objetivo.distanciaKm === null ? '' : objetivo.distanciaKm,
      dataProva: objetivo.dataProva,
      meta: objetivo.meta,
    };
    sessaoAberta = null;
    estado = { ...estadoInicial(), avisoCiente: true, avaliacoes, corridasManuais, historicoPeso, arquivoDeCorridas, arquivoDeSemanas, medalhasVistas, analises, nome, nascimento, provas, avulsas, outrasDoRelogio, chaveApi, atividades, enviados, assinaturas, envioAutomatico, semDados, corridasSemDados, historicoNivel, ultimaSincronizacao };
    guardar();
    aba = 'hoje';
    render();
  },
};

function renderMantendoRolagem() {
  const rolagem = window.scrollY;
  render();
  window.scrollTo(0, rolagem);
}

app.addEventListener('click', (e) => {
  const trocaDeMes = e.target.closest('[data-mes]');
  if (trocaDeMes) {
    mesVisto = somarMeses(mesVisto ?? mesDe(hoje()), Number(trocaDeMes.dataset.mes));
    diaVisto = null;
    renderMantendoRolagem();
    return;
  }
  const diaDoCalendario = e.target.closest('[data-dia-calendario]');
  if (diaDoCalendario) {
    diaVisto = diaDoCalendario.dataset.diaCalendario;
    mesVisto = mesDe(diaVisto);
    renderMantendoRolagem();
    return;
  }
  const botaoSecao = e.target.closest('[data-secao]');
  if (botaoSecao) {
    secoes[botaoSecao.dataset.secaoDe] = botaoSecao.dataset.secao;
    render();
    return;
  }
  const botaoNota = e.target.closest('[data-nota], [data-sensacao]');
  if (botaoNota) {
    const mudanca = botaoNota.dataset.nota ? { esforco: Number(botaoNota.dataset.nota) } : { sensacao: Number(botaoNota.dataset.sensacao) };
    const { cartao, ...contexto } = atualizarFeedback(botaoNota, mudanca);
    cartao.outerHTML = cartaoDeFeedback(contexto);
    return;
  }
  const dorDoFeedback = e.target.closest('[data-feedback-dor]');
  if (dorDoFeedback) {
    const { cartao, ...contexto } = atualizarFeedback(dorDoFeedback, { dor: dorDoFeedback.checked });
    cartao.outerHTML = cartaoDeFeedback(contexto);
    return;
  }
  const pularFeedback = e.target.closest('[data-feedback-pular]');
  if (pularFeedback) {
    atualizarFeedback(pularFeedback, { semNota: true });
    renderMantendoRolagem();
    return;
  }
  const corridaManual = e.target.closest('[data-corrida-manual]');
  if (corridaManual) {
    rolagemAnterior = window.scrollY;
    corridaManualAberta = { id: corridaManual.dataset.corridaManual, data: corridaManual.dataset.data ?? null };
    render();
    return;
  }
  const ligar = e.target.closest('[data-ligar]');
  if (ligar) {
    estado.ligacoes = { ...estado.ligacoes, [ligar.dataset.ligar]: ligar.dataset.sessao };
    const { [ligar.dataset.sessao]: _resolvido, ...naoFeitos } = estado.naoFeitos;
    estado.naoFeitos = naoFeitos;
    guardar();
    renderMantendoRolagem();
    mostrarAviso('Corrida ligada a este treino.');
    return;
  }
  const desligar = e.target.closest('[data-desligar]');
  if (desligar) {
    const { [desligar.dataset.desligar]: _removida, ...ligacoes } = estado.ligacoes;
    estado.ligacoes = ligacoes;
    guardar();
    renderMantendoRolagem();
    return;
  }
  const desfazerNaoFeito = e.target.closest('[data-desfazer-nao-feito]');
  if (desfazerNaoFeito) {
    const { [desfazerNaoFeito.dataset.desfazerNaoFeito]: _removido, ...naoFeitos } = estado.naoFeitos;
    estado.naoFeitos = naoFeitos;
    guardar();
    renderMantendoRolagem();
    return;
  }
  const removerPeso = e.target.closest('[data-remover-peso]');
  if (removerPeso) {
    if (!window.confirm('Apagar este registro de peso? Não dá para desfazer.')) return;
    estado.historicoPeso = estado.historicoPeso.filter((p) => p.data !== removerPeso.dataset.removerPeso);
    atualizarPeso();
    guardar();
    renderMantendoRolagem();
    return;
  }
  const tentarPercurso = e.target.closest('[data-tentar-percurso]');
  if (tentarPercurso) {
    const id = tentarPercurso.dataset.tentarPercurso;
    errosDePercurso.delete(id);
    const alvo = atividadePorId(id);
    if (alvo) {
      document.querySelector(`[data-percurso="${CSS.escape(id)}"]`).outerHTML = blocoPercurso(alvo);
      carregarPercurso(alvo);
    }
    return;
  }
  const verAtividade = e.target.closest('[data-atividade]');
  if (verAtividade) {
    rolagemAnterior = window.scrollY;
    atividadeAberta = verAtividade.dataset.atividade;
    render();
    return;
  }
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) {
    rolagemAnterior = window.scrollY;
    sessaoAberta = abrir.dataset.abrir;
    render();
    return;
  }
  const botaoDaProva = e.target.closest('[data-prova]');
  if (botaoDaProva) {
    rolagemAnterior = window.scrollY;
    provaAberta = botaoDaProva.dataset.prova;
    provasPendentes = null;
    render();
    return;
  }
  const avulsa = e.target.closest('[data-avulsa]');
  if (avulsa) {
    rolagemAnterior = window.scrollY;
    avulsaAberta = avulsa.dataset.avulsa;
    render();
    return;
  }
  const analisar = e.target.closest('[data-analisar]');
  if (analisar) {
    const atividade = estado.atividades.find((a) => String(a.id) === analisar.dataset.analisar);
    analisar.disabled = true;
    carregarAnalise(atividade);
    return;
  }
  const mudar = e.target.closest('[data-mudar-dia]');
  if (mudar) {
    mudarDia(mudar.dataset.mudarDia);
    return;
  }
  const marca = e.target.closest('[data-dica]');
  if (marca) {
    mostrarDica(marca);
    return;
  }
  const baixar = e.target.closest('[data-baixar]');
  if (baixar) {
    const { baixar: formato, id, data } = baixar.dataset;
    comOcupado(baixar, async () => {
      const conteudo = await criarCliente({ chave: estado.chaveApi }).arquivoDaCorrida(id, formato);
      await salvarArquivo(conteudo, `atividade-${data}.${formato}`, 'application/octet-stream');
      render();
    });
    return;
  }
  const botao = e.target.closest('[data-acao]');
  if (botao) acoes[botao.dataset.acao]?.(botao);
});

// O evento toggle não sobe pela árvore: só é ouvido na fase de captura.
app.addEventListener('toggle', (e) => {
  const id = e.target.dataset?.ajuste;
  if (!id) return;
  if (e.target.open) ajustesAbertos.add(id);
  else ajustesAbertos.delete(id);
}, true);

function mostrarDica(marca) {
  const figura = marca.closest('.figura');
  figura.querySelector('.dica').textContent = marca.dataset.dica;
  figura.querySelector('.marcada')?.classList.remove('marcada');
  marca.classList.add('marcada');
}

app.addEventListener('pointerover', (e) => {
  const marca = e.pointerType === 'mouse' && e.target.closest('[data-dica]');
  if (marca) mostrarDica(marca);
});


app.addEventListener('submit', (e) => {
  if (e.target.id === 'form-cadastro') return enviarCadastro(e);
  e.preventDefault();

  if (e.target.id === 'form-nome') {
    const dados = new FormData(e.target);
    const nome = String(dados.get('nome') ?? '').trim();
    const nascimento = String(dados.get('nascimento') ?? '');
    if (!nome) return mostrarAviso('Digite o seu nome.');
    const erro = erroDoNascimento(nascimento, hoje());
    if (erro) return mostrarAviso(erro);
    estado.nome = nome;
    estado.nascimento = nascimento;
    editandoUsuario = false;
    atualizarIdade();
    guardar();
    document.activeElement?.blur();
    render();
    return mostrarAviso('Cadastro salvo.');
  }
  if (e.target.id === 'form-corrida') return salvarCorridaManual(e.target);
  if (e.target.id === 'form-nao-feito') {
    const motivo = String(new FormData(e.target).get('motivo') ?? 'outro');
    estado.naoFeitos = { ...estado.naoFeitos, [e.target.dataset.sessao]: { motivo } };
    guardar();
    document.activeElement?.blur();
    renderMantendoRolagem();
    return mostrarAviso('Registrado como não feito.');
  }
  if (e.target.id === 'form-peso') {
    const dados = new FormData(e.target);
    const registro = { kg: numero(dados, 'kg'), data: String(dados.get('data') ?? '') };
    const erro = erroDoPeso(registro, hoje());
    if (erro) return mostrarAviso(erro);
    estado.historicoPeso = registrarPeso(estado.historicoPeso, registro);
    atualizarPeso();
    guardar();
    document.activeElement?.blur();
    renderMantendoRolagem();
    return mostrarAviso('Peso registrado.');
  }
  if (e.target.id === 'form-dias') return verNovaGrade(e.target);
  if (e.target.id === 'form-avulsa') return salvarAvulsa(e.target);
  if (e.target.id === 'form-prova') return salvarProva(e.target);

  if (e.target.id === 'form-chave') {
    const chave = String(new FormData(e.target).get('chave') ?? '').trim();
    const botao = e.target.querySelector('button[type="submit"]');
    comOcupado(botao, async () => {
      await sincronizar(chave);
      estado.chaveApi = chave;
      editandoChave = false;
      guardar();
      render();
      mostrarAviso(`Conectado. ${estado.atividades.length} corridas encontradas.`);
    });
  }
  return undefined;
});

app.addEventListener('change', async (e) => {
  if (e.target.id === 'envio-automatico') {
    estado.envioAutomatico = e.target.checked;
    estado.erroEnvioAutomatico = null;
    guardar();
    mostrarAviso(estado.envioAutomatico ? 'Envio automático ligado.' : 'Envio automático desligado.');
    enviarAutomaticamente();
    return;
  }
  if (e.target.id !== 'importar' || !e.target.files[0]) return;
  try {
    estado = importar(await e.target.files[0].text(), estado);
    guardar();
    aba = 'hoje';
    render();
    mostrarAviso('Cópia de segurança restaurada.');
  } catch (erro) {
    mostrarAviso(erro.message);
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

async function aoAbrir() {
  await atualizarSeNecessario();
  await enviarAutomaticamente();
  await analisarRecentes();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') aoAbrir();
});

garantirProvaDoObjetivo();
render();
aoAbrir();
