import { compararComPrevisto, ORDEM_DAS_ZONAS, temposPorZona, vereditoDoTreino } from './analise.js';
import { carregar, salvar, exportar, importar, estadoInicial } from './armazenamento.js';
import { CATEGORIAS, duracaoCurta, erroDaAvulsa, juntarAvulsas, nomeDaCategoria, resumoPorCategoria } from './avulsas.js';
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
import { barrasDeVolume, linhaDeEvolucao } from './graficos.js';
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
  refazerComNovosDias,
  segundaDaSemana,
  somarDias,
  VERSAO_REGRAS,
  ZONAS,
} from './motor.js';
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

// Mesmo número da VERSAO em sw.js. Fica visível para conferir qual versão o aparelho abriu.
const VERSAO_APP = 18;

const avisoPlanilhaAntiga = () => (estado.plano.versaoRegras === VERSAO_REGRAS ? '' : `
  <section class="cartao alerta">
    <h2>Esta planilha usa regras antigas</h2>
    <p>Ela pode ter treinos em todos os dias livres e aumento rápido de volume. Gere de novo para usar a organização atual de treino e descanso. Seu cadastro continua preenchido.</p>
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

const parametrosAtuais = () => ({ perfil: estado.perfil, objetivo: estado.objetivo, prudencia: avaliarPrudencia(estado.perfil) });

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
const podeRedesenhar = () => !avulsaAberta && !document.activeElement?.matches('input, select, textarea');

const todasAvulsas = () => juntarAvulsas(estado.avulsas, estado.outrasDoRelogio);

// ---------- Integração ----------

async function sincronizar(chave = estado.chaveApi) {
  const dia = hoje();
  const { atividades, semDados, outras } = await criarCliente({ chave }).atividades(somarDias(dia, -DIAS_DE_HISTORICO), dia);
  estado.atividades = atividades;
  estado.outrasDoRelogio = outras;
  estado.semDados = semDados;
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
  const v = { idade: '', peso: '', altura: '', kmSemana: '', longo: '', distanciaTempo: '5', chave: estado.chaveApi, ...valores };
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
        <div class="linha3">
          <label>Idade<input name="idade" type="number" inputmode="numeric" min="12" max="100" value="${esc(v.idade)}" required></label>
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
        <p class="suave">Sem prova marcada, a planilha terá 12 semanas.</p>
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

  const idade = numero(form, 'idade');
  const pesoKg = numero(form, 'peso');
  const alturaCm = numero(form, 'altura');
  if (!idade || !pesoKg || !alturaCm) return problema('Preencha idade, peso e altura.');
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
      const objetivo = { distanciaKm: distancia, dataProva };
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
      });

      estado = {
        ...estado,
        chaveApi: chave,
        perfil,
        objetivo,
        tempoInformado,
        plano,
        origemVdot: estimativa.origem,
        historicoNivel: registrarNivel(estado.historicoNivel, dia, plano.vdot),
      };
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

function formularioAvaliacao(sessao) {
  const nota = estado.avaliacoes[sessao.id] ?? { esforco: 5, dor: false };
  return `
    <form class="cartao" data-avaliar="${esc(sessao.id)}">
      <p class="sobretitulo">${esc(sessao.nome)}, ${dataCurta(sessao.data)}</p>
      <h2>Como foi?</h2>
      <label>
        <span class="nota-esforco">Esforço <span><output>${nota.esforco}</output> <small>de 10</small></span></span>
        <input type="range" name="esforco" min="1" max="10" value="${nota.esforco}">
      </label>
      <label class="marcar"><input type="checkbox" name="dor" ${nota.dor ? 'checked' : ''}> Senti dor</label>
      <button type="submit">Salvar</button>
    </form>`;
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
  const dias = diasDaSemana({ segunda, sessoes, atividades, hoje: dia });
  const feitos = dias.filter((d) => d.sessao && d.situacao === 'feito').length;
  const comOutra = new Set(todasAvulsas().map((a) => a.data));

  const celulas = dias.map((d) => {
    const nome = DIAS[(new Date(`${d.data}T12:00:00Z`).getUTCDay() + 6) % 7].curto;
    const marca = { feito: '✓', perdido: '–', descanso: '·' }[d.situacao] ?? numeroKm(d.sessao.distanciaKm);
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
          <p class="suave">${feitos} de ${sessoes.length} treinos</p>
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
  if (a.origem === 'relogio') return `<div class="avulsa-linha">${corpo}<span class="selo">Relógio</span></div>`;
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

function blocoOutrasNaEvolucao(dia) {
  const lista = todasAvulsas();
  const resumo = resumoPorCategoria(lista, somarDias(dia, -27), somarDias(dia, 1));
  return `
    <section class="cartao">
      <h2>Outras atividades nos últimos 28 dias</h2>
      ${resumo.length
        ? `<table class="ritmos"><tbody>${resumo.map((r) => `<tr><td>${esc(r.nome)} (${r.quantidade}x)</td><td>${duracaoCurta(r.minutos)}</td></tr>`).join('')}</tbody></table>`
        : '<p class="suave">Nenhuma registrada neste período.</p>'}
      <p class="suave" style="margin-top:10px">Vêm do relógio, pelo intervals.icu, ou do registro manual. Não entram no volume de corrida, no nível nem na revisão.</p>
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

function blocoDoObjetivo(dia) {
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
      <p class="sobretitulo">${prova ? `Prova de ${String(objetivo.distanciaKm).replace('.', ',')} km` : 'Condicionamento'}</p>
      <h2>${prova ? (dias === 0 ? 'É hoje!' : `Falta${dias > 1 ? 'm' : ''} ${dias} dia${dias > 1 ? 's' : ''}`) : `Semana ${atual.semana} de ${plano.totalSemanas}`}</h2>
      <div class="fases" role="img" aria-label="Avanço pelas fases da planilha">${barras}</div>
      <p class="suave" style="margin:0">Fase de ${FASES[atual.fase].toLowerCase()}${prova ? `, semana ${atual.semana} de ${plano.totalSemanas}` : ''}${atual.recuperacao ? ', semana de recuperação' : ''}</p>
    </section>`;
}

function telaHoje() {
  const dia = hoje();
  const { sessoes, inicio } = estado.plano;
  const deHoje = sessoes.find((s) => s.data === dia);
  const proxima = sessoes.find((s) => s.data > dia);
  const ultimaPassada = [...sessoes].reverse().find((s) => s.data < dia && s.data >= somarDias(dia, -7));
  const avaliar = deHoje ?? ultimaPassada;

  let principal;
  if (deHoje) {
    principal = heroiDoTreino(deHoje, 'Treino de hoje', atividadeDoDia(dia));
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
      <h1>Hoje</h1>
    </header>
    ${avisoPlanilhaAntiga()}
    ${principal}
    ${blocoDaSemana(dia)}
    ${blocoOutrasDaSemana(dia)}
    ${blocoDoObjetivo(dia)}
    ${avaliar && avaliar.tipo !== 'prova' ? formularioAvaliacao(avaliar) : ''}`;
}

// ---------- Plano ----------

function linhaSessao(sessao, dia) {
  const feitas = atividadeDoDia(sessao.data);
  let status = '';
  if (feitas.length) status = `<span class="status feito">${km(feitas.reduce((t, a) => t + a.km, 0))} feitos</span>`;
  else if (sessao.data < dia) status = '<span class="status falta">Sem registro</span>';
  else status = `<span class="status">${km(sessao.distanciaKm)}</span>`;
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

function blocoAnalise(atividade, sessao, previsto) {
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

  const comparacao = compararComPrevisto(atual.seg, previsto.zonas);
  const veredito = comparacao && vereditoDoTreino(comparacao);
  const partes = comparacao && [['abaixo', 'Abaixo', comparacao.abaixo], ['dentro', 'Na meta', comparacao.dentro], ['acima', 'Acima', comparacao.acima]];
  const anaerobico = atual.anaerobico / atual.total;

  return `
    <section class="cartao" ${atributo}>
      <p class="sobretitulo">Análise do treino</p>
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
  const sessao = estado.plano.sessoes.find((s) => s.data === atividade.data);
  const cartao = document.querySelector(`[data-analise="${id}"]`);
  if (cartao && sessao) cartao.outerHTML = blocoAnalise(atividade, sessao, detalharSessao(sessao, estado.plano.vdot));
  const feito = document.querySelector(`[data-feito="${id}"]`);
  if (feito && sessao) feito.textContent = textoFeito(atividade, sessao);
}

const analisePronta = (atividade) => estado.analises[atividade.id]?.vdot === estado.plano.vdot;

function pedirAnalises(sessao) {
  if (!estado.chaveApi) return;
  for (const atividade of atividadeDoDia(sessao.data)) {
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
    atividade.rpe ? ['Esforço no intervals.icu', `${atividade.rpe} de 10`] : null,
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
      <p class="suave" style="margin-top:12px">Previsto: ${km(previsto.distanciaKm)}, cerca de ${formatarTempo(previsto.tempoSeg)}, pace de ${formatarRitmo(previsto.ritmoMedio)}/km.</p>
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

  const cabecalho = `<header class="topo"><p class="sobretitulo">Seu progresso</p><h1>Evolução</h1><p class="suave">Suas corridas e seu nível ao longo do tempo.</p></header>`;
  const previsoes = [[5, '5 km'], [10, '10 km'], [21.1, 'Meia maratona'], [42.2, 'Maratona']]
    .map(([distancia, nome]) => `<tr><td>${nome}</td><td>${formatarTempo(preverTempoSeg(plano.vdot, distancia))}</td></tr>`)
    .join('');
  const blocoPrevisoes = `
    <section class="cartao">
      <h2>Previsão de prova pelo nível atual</h2>
      <p class="suave">VDOT ${String(plano.vdot).replace('.', ',')}. Estimativa teórica, que supõe treino específico para cada distância.</p>
      <table class="ritmos"><tbody>${previsoes}</tbody></table>
    </section>`;

  if (!atividades.length) {
    return `${cabecalho}
      <section class="cartao alerta">
        <h2>Ainda não há corridas</h2>
        <p>${estado.chaveApi ? 'Quando o Garmin sincronizar com o intervals.icu, suas corridas aparecem aqui.' : 'Conecte o intervals.icu nos Ajustes para trazer suas corridas do Garmin.'}</p>
      </section>
      ${blocoOutrasNaEvolucao(dia)}${atualizacao}${blocoPrevisoes}`;
  }

  const semanas = resumoSemanal({ atividades, plano, hoje: dia });
  const { atual, anterior } = compararPeriodos(atividades, dia);
  const adesao = adesaoDoPeriodo({ atividades, plano, hoje: dia });
  const recordes = calcularRecordes(atividades);
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
  const linhasRecordes = [
    ['Maior corrida', `${km(recordes.maiorCorrida.km)}, ${dataCurta(recordes.maiorCorrida.data)}`],
    ['Melhor pace (5 km ou mais)', recordes.melhorPace ? `${formatarRitmo(recordes.melhorPace.ritmo)}/km, ${dataCurta(recordes.melhorPace.data)}` : 'Ainda sem corrida de 5 km'],
    ['Maior semana', `${km(recordes.maiorSemana.km)}, a partir de ${dataCurta(recordes.maiorSemana.segunda)}`],
  ];

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
      </section>` : ''}
    <section class="cartao">
      <h2>Recordes em 12 meses</h2>
      <table class="ritmos"><tbody>${linhasRecordes.map(([n, v]) => `<tr><td>${n}</td><td>${v}</td></tr>`).join('')}</tbody></table>
    </section>
    ${blocoOutrasNaEvolucao(dia)}
    ${blocoPrevisoes}
    <section class="cartao">
      <h2>Baixar meus dados</h2>
      <p class="suave">Planilha com ${atividades.length} corridas dos últimos 12 meses, para abrir no Excel. O arquivo FIT ou GPX de cada corrida fica nos detalhes do treino.</p>
      <button data-acao="baixar-csv">Baixar planilha (CSV)</button>
    </section>
    ${atualizacao}`;
}

function blocoMudarDia(sessao, dia) {
  const pode = sessao.tipo !== 'prova' && sessao.data >= dia && !atividadeDoDia(sessao.data).length;
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

function telaDetalhe(sessao) {
  const dia = hoje();
  const d = detalharSessao(sessao, estado.plano.vdot);
  const realizadas = atividadeDoDia(sessao.data);
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
    ${blocoMudarDia(sessao, dia)}
    ${estado.chaveApi ? realizadas.filter((a) => a.id).map((a) => blocoAnalise(a, sessao, d)).join('') : ''}
    ${realizadas.map((a) => blocoRealizado(a, d)).join('')}
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
      </section>` : ''}
    ${!realizadas.length && sessao.data < dia ? '<section class="cartao alerta">Nenhuma corrida registrada neste dia.</section>' : ''}
    ${sessao.data <= dia && sessao.tipo !== 'prova' ? formularioAvaliacao(sessao) : ''}`;
}

function telaPlano() {
  const dia = hoje();
  const { plano, objetivo } = estado;
  const semanas = new Map();
  for (const s of plano.sessoes) semanas.set(s.semana, [...(semanas.get(s.semana) ?? []), s]);
  const semanaAtual = segundaDaSemana(dia);
  const meta = objetivo.distanciaKm ? `Prova de ${objetivo.distanciaKm} km em ${dataCurta(objetivo.dataProva)}` : 'Condicionamento';
  const futuras = plano.sessoes.filter((s) => s.data >= dia).length;
  const totalDaSemana = (sessoes) => sessoes.reduce((t, s) => t + s.distanciaKm, 0);
  const maiorSemana = Math.max(...[...semanas.values()].map(totalDaSemana));

  const lista = [...semanas.values()].map((sessoes) => {
    const primeira = sessoes[0];
    const total = totalDaSemana(sessoes);
    const atual = segundaDaSemana(primeira.data) === semanaAtual;
    const aberta = atual || (dia < plano.inicio && primeira.semana === semanas.keys().next().value);
    return `
      <details class="semana ${atual ? 'atual' : ''}" ${aberta ? 'open' : ''}>
        <summary>
          <span class="semana-numero" aria-label="Semana ${primeira.semana}">${primeira.semana}</span>
          <span class="semana-info">
            <strong>${FASES[primeira.fase]}${primeira.recuperacao ? ', recuperação' : ''}</strong>
            <span class="suave">${sessoes.length} treinos</span>
            <span class="semana-carga"><i style="width:${(total / maiorSemana) * 100}%"></i></span>
          </span>
          <span class="status">${km(Math.round(total * 2) / 2)}</span>
        </summary>
        ${sessoes.map((s) => linhaSessao(s, dia)).join('')}
      </details>`;
  }).join('');

  return `
    <header class="topo">
      <p class="sobretitulo">Seu ciclo</p>
      <h1>Minha planilha</h1>
      <p class="suave">${esc(meta)}, ${plano.totalSemanas} semanas</p>
    </header>
    ${avisoPlanilhaAntiga()}
    ${blocoDoObjetivo(dia)}
    ${plano.prudencia?.prudente ? `<section class="cartao alerta"><strong>Progressão mais cuidadosa:</strong> ${esc(plano.prudencia.motivos.join(', '))}.</section>` : ''}
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
    </section>`;
}

// ---------- Revisão ----------

const TITULOS_ACAO = {
  seguir: 'Tudo certo: seguir em frente',
  manter: 'Segurar a carga por uma semana',
  reduzir: 'Reduzir para recuperar',
  semDados: 'Ainda é cedo para revisar',
  analise: 'Análise atualizada com suas corridas',
  dias: 'Dias de treino alterados',
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
  const analise = analisarRevisao({ plano: estado.plano, atividades: estado.atividades, avaliacoes: estado.avaliacoes, hoje: dia });
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
    ${estado.semDados ? `<section class="cartao alerta">${estado.semDados} corrida(s) vieram sem dados, provavelmente porque entraram pelo Strava. Conecte o Garmin diretamente no intervals.icu.</section>` : ''}
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
    <header class="topo"><p class="sobretitulo">Sua conta neste aparelho</p><h1>Ajustes</h1></header>
    <section class="heroi">
      <p class="sobretitulo">Seu nível atual (VDOT)</p>
      <p class="heroi-numero">${String(plano.vdot).replace('.', ',')}</p>
      ${estado.origemVdot ? `<p style="margin:8px 0 0;font-size:.85rem">Base: ${esc(estado.origemVdot)}</p>` : ''}
    </section>
    ${blocoDiasDeTreino()}
    <section class="cartao">
      <h2>Seus ritmos</h2>
      <table class="ritmos"><tbody>${linhasRitmo.map(([nome, valor]) => `<tr><td>${nome}</td><td>${valor}</td></tr>`).join('')}</tbody></table>
    </section>
    <section class="cartao">
      <h2>Gestos</h2>
      <p class="suave">Deslize para os lados para trocar de aba. Dentro de um treino, deslize para a direita para voltar. No topo da tela, puxe para baixo para buscar corridas novas.</p>
    </section>
    <section class="cartao">
      <h2>Perfil</h2>
      <p>${perfil.idade} anos, ${esc(perfil.pesoKg)} kg, ${esc(perfil.alturaCm)} cm${plano.prudencia?.imc ? `, IMC ${String(plano.prudencia.imc).replace('.', ',')}` : ''}</p>
      <p class="suave">Para mudar perfil ou objetivo, comece um novo ciclo.</p>
    </section>
    <form class="cartao" id="form-chave">
      <h2>Intervals.icu</h2>
      <details class="passos-chave" ${estado.chaveApi ? '' : 'open'}>
        <summary>Como conseguir a chave de API</summary>
        ${PASSOS_DA_CHAVE}
      </details>
      <label>Chave de API<input name="chave" type="password" autocomplete="off" value="${esc(estado.chaveApi)}"></label>
      <div class="botoes">
        <button class="principal" type="submit">Salvar e testar</button>
        ${estado.chaveApi ? '<button type="button" data-acao="remover-chave">Remover</button>' : ''}
      </div>
    </form>
    <section class="cartao">
      <h2>Envio automático</h2>
      <label class="marcar"><input type="checkbox" id="envio-automatico" ${estado.envioAutomatico ? 'checked' : ''}> Enviar os treinos de cada semana</label>
      <p class="suave">A semana vai ao relógio na primeira vez que você abrir o app, a partir de ${DIAS_DE_ANTECEDENCIA} dias antes do primeiro treino dela. O iPhone não deixa o app rodar fechado, então ele precisa ser aberto nesse período.</p>
    </section>
    <section class="cartao">
      <h2>Cópia de segurança</h2>
      <p class="suave">Seus dados ficam só neste aparelho. A cópia não inclui a chave de API.</p>
      <div class="botoes">
        <button data-acao="exportar">Exportar</button>
        <label style="margin:0"><span class="suave">Importar arquivo</span><input type="file" id="importar" accept="application/json,.json"></label>
      </div>
    </section>
    <section class="cartao">
      <h2>Como a planilha é calculada</h2>
      <p class="suave">Ritmos: fórmulas publicadas de Daniels e Gilbert (VDOT).</p>
      <p class="suave">Modo cuidadoso: IMC acima de 30, idade a partir de 45 anos ou lesão recente, fatores de risco observados em corredores iniciantes.</p>
      <p class="suave">Volume, dias por semana e descanso: regras próprias de prudência, porque os estudos não definem um número certo. O volume sobe até 10% por semana, ou 5% no modo cuidadoso.</p>
      <p class="suave">Nada disso garante evitar lesões, e a planilha não substitui avaliação médica ou de um treinador.</p>
    </section>
    <button class="perigo largo" data-acao="recomecar">Começar novo ciclo</button>
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

function render() {
  if (!estado.plano && !estado.avisoCiente) return telaBoasVindas();
  if (!estado.plano) return telaCadastro(cadastroAnterior);
  renderAbas();
  if (avulsaAberta) {
    app.innerHTML = telaAvulsa();
    window.scrollTo(0, 0);
    return;
  }
  const aberta = sessaoAberta && estado.plano.sessoes.find((s) => s.id === sessaoAberta);
  const telas = { hoje: telaHoje, plano: telaPlano, evolucao: telaEvolucao, revisao: telaRevisao, ajustes: telaAjustes };
  app.innerHTML = aberta ? telaDetalhe(aberta) : telas[aba]();
  window.scrollTo(0, 0);
  if (aberta) pedirAnalises(aberta);
}

abas.addEventListener('click', (e) => {
  const botao = e.target.closest('[data-aba]');
  if (!botao) return;
  aba = botao.dataset.aba;
  sessaoAberta = null;
  avulsaAberta = null;
  render();
});

function voltarDoTreino() {
  sessaoAberta = null;
  avulsaAberta = null;
  render();
  window.scrollTo(0, rolagemAnterior);
}

// Dentro de um treino, só voltar. Nas abas, trocar para a vizinha.
ligarGestos(app, {
  podeIniciar: () => Boolean(estado.plano) && !ocupado,
  temDestino: (direcao) => (sessaoAberta || avulsaAberta ? direcao === 'direita' : Boolean(abaDoGesto(ORDEM_ABAS, aba, direcao))),
  aoDeslizar: (direcao) => {
    if (sessaoAberta || avulsaAberta) {
      voltarDoTreino();
      return;
    }
    aba = abaDoGesto(ORDEM_ABAS, aba, direcao);
    render();
  },
});

ligarPuxada(app, document.getElementById('puxada'), {
  podeIniciar: () => Boolean(estado.plano) && !ocupado && !avulsaAberta,
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

  sincronizar: (botao) => comOcupado(botao, async () => {
    await sincronizar();
    render();
    mostrarAviso(estado.atividades.length === 1 ? '1 corrida atualizada.' : `${estado.atividades.length} corridas atualizadas.`);
  }),

  'aplicar-revisao': (botao) => comOcupado(botao, async () => {
    const dia = hoje();
    const analise = analisarRevisao({ plano: estado.plano, atividades: estado.atividades, avaliacoes: estado.avaliacoes, hoje: dia });
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

  'remover-chave': () => {
    estado.chaveApi = '';
    guardar();
    render();
    mostrarAviso('Chave removida deste aparelho.');
  },

  recomecar: () => {
    if (!window.confirm('Isso apaga a planilha atual deste aparelho. Os treinos já enviados continuam no intervals.icu até você enviar os novos. Continuar?')) return;
    const { avulsas, outrasDoRelogio, chaveApi, atividades, enviados, assinaturas, envioAutomatico, semDados, perfil, objetivo, historicoNivel, ultimaSincronizacao } = estado;
    cadastroAnterior = {
      idade: perfil.idade,
      peso: perfil.pesoKg,
      altura: perfil.alturaCm,
      lesao: perfil.lesaoRecente,
      dias: perfil.diasSemana,
      diaLongo: perfil.diaLongo,
      distancia: objetivo.distanciaKm === null ? '' : objetivo.distanciaKm,
      dataProva: objetivo.dataProva,
    };
    sessaoAberta = null;
    estado = { ...estadoInicial(), avisoCiente: true, avulsas, outrasDoRelogio, chaveApi, atividades, enviados, assinaturas, envioAutomatico, semDados, historicoNivel, ultimaSincronizacao };
    guardar();
    aba = 'hoje';
    render();
  },
};

app.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) {
    rolagemAnterior = window.scrollY;
    sessaoAberta = abrir.dataset.abrir;
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
    const sessao = estado.plano.sessoes.find((s) => s.id === sessaoAberta);
    const atividade = atividadeDoDia(sessao.data).find((a) => String(a.id) === analisar.dataset.analisar);
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
      await salvarArquivo(conteudo, `corrida-${data}.${formato}`, 'application/octet-stream');
      render();
    });
    return;
  }
  const botao = e.target.closest('[data-acao]');
  if (botao) acoes[botao.dataset.acao]?.(botao);
});

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

app.addEventListener('input', (e) => {
  if (e.target.name === 'esforco') e.target.closest('label').querySelector('output').textContent = e.target.value;
});

app.addEventListener('submit', (e) => {
  if (e.target.id === 'form-cadastro') return enviarCadastro(e);
  e.preventDefault();

  if (e.target.dataset.avaliar) {
    const form = new FormData(e.target);
    estado.avaliacoes[e.target.dataset.avaliar] = { esforco: Number(form.get('esforco')), dor: form.get('dor') === 'on' };
    guardar();
    mostrarAviso('Avaliação salva.');
    return undefined;
  }

  if (e.target.id === 'form-dias') return verNovaGrade(e.target);
  if (e.target.id === 'form-avulsa') return salvarAvulsa(e.target);

  if (e.target.id === 'form-chave') {
    const chave = String(new FormData(e.target).get('chave') ?? '').trim();
    const botao = e.target.querySelector('button[type="submit"]');
    comOcupado(botao, async () => {
      await sincronizar(chave);
      estado.chaveApi = chave;
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

render();
aoAbrir();
