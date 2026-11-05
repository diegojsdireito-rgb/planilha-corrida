import { carregar, salvar, exportar, importar, estadoInicial } from './armazenamento.js';
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
import { abaDoGesto, ligarGestos } from './gestos.js';
import { barrasDeVolume, linhaDeEvolucao } from './graficos.js';
import { criarCliente, eventoDaSessao } from './icu.js';
import {
  analisarRevisao,
  aplicarRevisao,
  avaliarPrudencia,
  baseDasAtividades,
  detalharSessao,
  estimarVdot,
  formatarRitmo,
  formatarTempo,
  gerarPlano,
  preverTempoSeg,
  proximaSegunda,
  reanalisarPlano,
  segundaDaSemana,
  somarDias,
  VERSAO_REGRAS,
  ZONAS,
} from './motor.js';

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

// Mesmo número da VERSAO em sw.js. Fica visível para conferir qual versão o aparelho abriu.
const VERSAO_APP = 9;

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

const km = (valor) => `${Number(valor).toFixed(1).replace('.', ',').replace(',0', '')} km`;

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

// ---------- Integração ----------

async function sincronizar(chave = estado.chaveApi) {
  const dia = hoje();
  const { atividades, semDados } = await criarCliente({ chave }).atividades(somarDias(dia, -DIAS_DE_HISTORICO), dia);
  estado.atividades = atividades;
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
  const digitando = document.activeElement?.matches('input, select, textarea');
  if (!digitando) render();
  mostrarAviso(novas === 1 ? 'Nova corrida recebida.' : `${novas} novas corridas recebidas.`);
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
  if (!document.activeElement?.matches('input, select, textarea')) render();
}

function textoEnvioAutomatico() {
  if (!estado.envioAutomatico) return 'Envio automático desligado. Use o botão abaixo ou ligue em Ajustes.';
  const assinaturas = { ...Object.fromEntries(estado.enviados.map((id) => [id, ''])), ...estado.assinaturas };
  const proximo = proximoEnvio({ sessoes: estado.plano.sessoes, assinaturas, hoje: hoje() });
  const quando = proximo ? `A partir de ${dataCurta(proximo)}, a próxima semana será enviada quando você abrir o app.` : 'Todos os treinos já foram enviados.';
  return `Envio automático ligado. ${quando}`;
}

// ---------- Cadastro ----------

function telaCadastro(valores = {}) {
  abas.hidden = true;
  const v = { idade: '', peso: '', altura: '', kmSemana: '', longo: '', distanciaTempo: '5', chave: estado.chaveApi, ...valores };
  const diasMarcados = valores.dias ?? [2, 4, 6, 0];
  app.innerHTML = `
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
        <p class="suave">Conecte o Garmin ao intervals.icu e cole aqui a chave de API, que fica em Settings, Developer Settings.</p>
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

function blocoTreino(sessao) {
  if (sessao.tipo === 'prova') {
    return `<p>${esc(sessao.porque)}</p><p class="suave">Previsão pelo seu nível atual: <strong>${formatarTempo(preverTempoSeg(estado.plano.vdot, sessao.distanciaKm))}</strong>.</p>`;
  }
  const linhas = sessao.blocos.map((bloco) => {
    const prefixo = bloco.repeticoes > 1 ? `${bloco.repeticoes} x ` : '';
    const passos = bloco.passos.map((p) => `${p.km !== undefined ? km(p.km) : `${p.minutos} min de trote`} a ${textoRitmo(p.ritmo)}`).join(' + ');
    return `<li><span>${esc(bloco.rotulo)}</span><strong>${prefixo}${passos}</strong></li>`;
  });
  return `<ul class="passos">${linhas.join('')}</ul><p class="suave">${esc(sessao.porque)}</p>`;
}

const seloTipo = (tipo) => {
  const classe = ['limiar', 'intervalado', 'ritmo'].includes(tipo) ? 'forte' : tipo === 'longo' ? 'longo' : tipo === 'prova' ? 'prova' : '';
  return `<span class="selo ${classe}">${ROTULOS[tipo]}</span>`;
};

function formularioAvaliacao(sessao) {
  const nota = estado.avaliacoes[sessao.id] ?? { esforco: 5, dor: false };
  return `
    <form class="cartao" data-avaliar="${esc(sessao.id)}">
      <h2>Como foi?</h2>
      <label>Esforço: <output>${nota.esforco}</output> de 10
        <input type="range" name="esforco" min="1" max="10" value="${nota.esforco}">
      </label>
      <label class="marcar"><input type="checkbox" name="dor" ${nota.dor ? 'checked' : ''}> Senti dor</label>
      <button type="submit">Salvar</button>
    </form>`;
}

function telaHoje() {
  const dia = hoje();
  const { sessoes } = estado.plano;
  const deHoje = sessoes.find((s) => s.data === dia);
  const proxima = sessoes.find((s) => s.data > dia);
  const segunda = segundaDaSemana(dia);
  const fim = somarDias(segunda, 7);
  const previsto = sessoes.filter((s) => s.data >= segunda && s.data < fim).reduce((t, s) => t + s.distanciaKm, 0);
  const feito = estado.atividades.filter((a) => a.data >= segunda && a.data < fim).reduce((t, a) => t + a.km, 0);
  const pct = previsto ? Math.min(100, Math.round((feito / previsto) * 100)) : 0;
  const ultimaPassada = [...sessoes].reverse().find((s) => s.data < dia && s.data >= somarDias(dia, -7));
  const avaliar = deHoje ?? ultimaPassada;
  const realizadas = deHoje ? atividadeDoDia(dia) : [];

  let principal;
  if (deHoje) {
    principal = `
      <section class="cartao destaque">
        ${seloTipo(deHoje.tipo)}
        <p class="treino-titulo">${esc(deHoje.nome)}</p>
        <p class="suave">${km(deHoje.distanciaKm)} no total</p>
        ${blocoTreino(deHoje)}
        ${realizadas.map((a) => `<p class="status feito">Feito: ${km(a.km)} em ${formatarTempo(a.seg)}</p>`).join('')}
        <button data-abrir="${esc(deHoje.id)}">Ver detalhes</button>
      </section>`;
  } else if (proxima) {
    principal = `
      <section class="cartao">
        <h2>Hoje é dia de descanso</h2>
        <p class="suave">O descanso também faz parte do treino.</p>
        <p>Próximo treino: <strong>${esc(proxima.nome)}</strong>, ${dataLonga(proxima.data)}, ${km(proxima.distanciaKm)}.</p>
        <button data-abrir="${esc(proxima.id)}">Ver detalhes</button>
      </section>`;
  } else {
    principal = `
      <section class="cartao destaque">
        <h2>Planilha concluída</h2>
        <p>Parabéns. Quando quiser, comece um novo ciclo nos Ajustes.</p>
      </section>`;
  }

  return `
    <header class="topo">
      <p class="suave">${dataLonga(dia)}</p>
      <h1>Hoje</h1>
    </header>
    ${avisoPlanilhaAntiga()}
    ${principal}
    <section class="cartao">
      <h2>Esta semana</h2>
      <p>${km(feito)} de ${km(previsto)}</p>
      <div class="barra" role="img" aria-label="${pct}% do volume da semana"><div style="width:${pct}%"></div></div>
      ${estado.chaveApi ? '' : '<p class="suave" style="margin-top:8px">Conecte o intervals.icu nos Ajustes para contar suas corridas.</p>'}
    </section>
    ${avaliar && avaliar.tipo !== 'prova' ? `<p class="suave">Avaliando: ${esc(avaliar.nome)}, ${dataCurta(avaliar.data)}</p>${formularioAvaliacao(avaliar)}` : ''}`;
}

// ---------- Plano ----------

function linhaSessao(sessao, dia) {
  const feitas = atividadeDoDia(sessao.data);
  let status = '';
  if (feitas.length) status = `<span class="status feito">${km(feitas.reduce((t, a) => t + a.km, 0))} feitos</span>`;
  else if (sessao.data < dia) status = '<span class="status falta">Sem registro</span>';
  else status = `<span class="status">${km(sessao.distanciaKm)}</span>`;
  return `
    <button class="sessao" data-abrir="${esc(sessao.id)}" aria-label="Abrir ${esc(sessao.nome)}, ${dataCurta(sessao.data)}">
      <span>
        <span class="data">${dataCurta(sessao.data)}</span>
        <strong>${esc(sessao.nome)}</strong>
        ${seloTipo(sessao.tipo)}
      </span>
      <span class="sessao-fim">${status}<span class="seta" aria-hidden="true">›</span></span>
    </button>`;
}

// ---------- Detalhes do treino ----------

const ritmoDe = (segundos, quilometros) => `${formatarRitmo(segundos / quilometros)}/km`;

function barraDeZona(rotulo, segundos, fracao) {
  const pct = Math.round(fracao * 100);
  return `
    <div class="zona">
      <div class="zona-topo"><span>${esc(rotulo)}</span><span>${formatarTempo(segundos)} (${pct}%)</span></div>
      <div class="barra" role="img" aria-label="${esc(rotulo)}: ${pct}% do tempo"><div style="width:${pct}%"></div></div>
    </div>`;
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

  const cabecalho = `<header class="topo"><h1>Evolução</h1><p class="suave">Suas corridas e seu nível ao longo do tempo.</p></header>`;
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
      ${atualizacao}${blocoPrevisoes}`;
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
    <section class="cartao destaque">
      <h2>Últimos 28 dias</h2>
      <div class="numeros">
        <div><b>${km(Math.round(atual.km * 10) / 10)}</b><span>Distância</span></div>
        <div><b>${atual.corridas}</b><span>Corridas</span></div>
        <div><b>${formatarTempo(atual.seg)}</b><span>Tempo</span></div>
      </div>
      <p class="suave" style="margin-top:12px">${comparacao(atual.km, anterior.km)}.</p>
      ${adesao === null ? '' : `<p class="suave">Você cumpriu ${Math.round(adesao * 100)}% do volume previsto.</p>`}
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
    ${blocoPrevisoes}
    <section class="cartao">
      <h2>Baixar meus dados</h2>
      <p class="suave">Planilha com ${atividades.length} corridas dos últimos 12 meses, para abrir no Excel. O arquivo FIT ou GPX de cada corrida fica nos detalhes do treino.</p>
      <button data-acao="baixar-csv">Baixar planilha (CSV)</button>
    </section>
    ${atualizacao}`;
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
        <div class="passo">
          <span class="selo">${ZONAS[p.zona].codigo}</span>
          <span><strong>${p.km !== undefined ? km(p.km) : `${p.minutos} min`}</strong> a ${textoRitmo(p.ritmo)}<br>
          <span class="suave">${esc(ZONAS[p.zona].nome)}, cerca de ${formatarTempo(p.tempoSeg)}</span></span>
        </div>`).join('')}
    </div>`).join('');

  return `
    <button class="voltar" data-acao="voltar">‹ Voltar</button>
    <header class="topo">
      <p class="suave">${dataLonga(sessao.data)}</p>
      <h1>${esc(sessao.nome)}</h1>
      ${seloTipo(sessao.tipo)}
    </header>
    <section class="cartao destaque">
      <div class="numeros">${numeros.map(([n, v]) => `<div><b>${esc(v)}</b><span>${n}</span></div>`).join('')}</div>
      <p class="suave" style="margin-top:12px">${sessao.tipo === 'prova' ? 'Previsão pelo seu nível atual.' : 'Estimativa pelo meio das faixas de ritmo, com o seu nível atual.'}</p>
    </section>
    <section class="cartao">
      <h2>Por que este treino</h2>
      <p>${esc(sessao.porque)}</p>
    </section>
    ${passos ? `<section class="cartao"><h2>Passo a passo</h2>${passos}</section>` : ''}
    ${d.zonas.length ? `
      <section class="cartao">
        <h2>Tempo por zona de ritmo</h2>
        ${d.zonas.map((z) => `${barraDeZona(`${z.codigo} ${z.nome}`, z.tempoSeg, z.fracao)}<p class="suave">${esc(z.sensacao)}</p>`).join('')}
        <p class="suave">Zonas de ritmo calculadas pelo app. São diferentes das zonas de frequência cardíaca do relógio.</p>
      </section>` : ''}
    ${realizadas.map((a) => blocoRealizado(a, d)).join('')}
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

  const lista = [...semanas.values()].map((sessoes) => {
    const primeira = sessoes[0];
    const total = sessoes.reduce((t, s) => t + s.distanciaKm, 0);
    const atual = segundaDaSemana(primeira.data) === semanaAtual;
    const aberta = atual || (dia < plano.inicio && primeira.semana === semanas.keys().next().value);
    return `
      <details class="semana ${atual ? 'atual' : ''}" ${aberta ? 'open' : ''}>
        <summary>
          <span><strong>Semana ${primeira.semana}</strong> <span class="suave">${FASES[primeira.fase]}${primeira.recuperacao ? ', recuperação' : ''}</span></span>
          <span class="status">${km(Math.round(total * 2) / 2)}</span>
        </summary>
        ${sessoes.map((s) => linhaSessao(s, dia)).join('')}
      </details>`;
  }).join('');

  return `
    <header class="topo">
      <h1>Minha planilha</h1>
      <p class="suave">${esc(meta)}, ${plano.totalSemanas} semanas</p>
    </header>
    ${avisoPlanilhaAntiga()}
    ${plano.prudencia?.prudente ? `<section class="cartao alerta"><strong>Progressão mais cuidadosa:</strong> ${esc(plano.prudencia.motivos.join(', '))}.</section>` : ''}
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
    </section>
    ${lista}`;
}

// ---------- Revisão ----------

const TITULOS_ACAO = {
  seguir: 'Tudo certo: seguir em frente',
  manter: 'Segurar a carga por uma semana',
  reduzir: 'Reduzir para recuperar',
  semDados: 'Ainda é cedo para revisar',
  analise: 'Análise atualizada com suas corridas',
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
    <section class="cartao ${analise.acao === 'reduzir' ? 'alerta' : ''}">
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
    <section class="cartao">
      <h2>Gestos</h2>
      <p class="suave">Deslize para os lados para trocar de aba. Dentro de um treino, deslize para a direita para voltar.</p>
    </section>
    <section class="cartao">
      <h2>Seu nível atual</h2>
      <p>VDOT <strong>${String(plano.vdot).replace('.', ',')}</strong></p>
      ${estado.origemVdot ? `<p class="suave">Base: ${esc(estado.origemVdot)}</p>` : ''}
      <table class="ritmos"><tbody>${linhasRitmo.map(([nome, valor]) => `<tr><td>${nome}</td><td>${valor}</td></tr>`).join('')}</tbody></table>
    </section>
    <section class="cartao">
      <h2>Perfil</h2>
      <p>${perfil.idade} anos, ${esc(perfil.pesoKg)} kg, ${esc(perfil.alturaCm)} cm${plano.prudencia?.imc ? `, IMC ${String(plano.prudencia.imc).replace('.', ',')}` : ''}</p>
      <p class="suave">Para mudar perfil, objetivo ou dias, comece um novo ciclo.</p>
    </section>
    <form class="cartao" id="form-chave">
      <h2>Intervals.icu</h2>
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
    .map(([id, nome]) => `<button data-aba="${id}" ${aba === id ? 'aria-current="page"' : ''}>${nome}</button>`)
    .join('');
}

function render() {
  if (!estado.plano) return telaCadastro(cadastroAnterior);
  renderAbas();
  const aberta = sessaoAberta && estado.plano.sessoes.find((s) => s.id === sessaoAberta);
  const telas = { hoje: telaHoje, plano: telaPlano, evolucao: telaEvolucao, revisao: telaRevisao, ajustes: telaAjustes };
  app.innerHTML = aberta ? telaDetalhe(aberta) : telas[aba]();
  window.scrollTo(0, 0);
}

abas.addEventListener('click', (e) => {
  const botao = e.target.closest('[data-aba]');
  if (!botao) return;
  aba = botao.dataset.aba;
  sessaoAberta = null;
  render();
});

function voltarDoTreino() {
  sessaoAberta = null;
  render();
  window.scrollTo(0, rolagemAnterior);
}

// Dentro de um treino, só voltar. Nas abas, trocar para a vizinha.
ligarGestos(app, {
  podeIniciar: () => Boolean(estado.plano) && !ocupado,
  temDestino: (direcao) => (sessaoAberta ? direcao === 'direita' : Boolean(abaDoGesto(ORDEM_ABAS, aba, direcao))),
  aoDeslizar: (direcao) => {
    if (sessaoAberta) {
      voltarDoTreino();
      return;
    }
    aba = abaDoGesto(ORDEM_ABAS, aba, direcao);
    render();
  },
});

const acoes = {
  voltar: voltarDoTreino,

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
    mostrarAviso(`${estado.atividades.length} corridas atualizadas.`);
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

  exportar: () => salvarArquivo(exportar(estado), `planilha-corrida-${hoje()}.json`, 'application/json'),

  'baixar-csv': () => salvarArquivo(csvDasCorridas(estado.atividades), `corridas-${hoje()}.csv`, 'text/csv'),

  'remover-chave': () => {
    estado.chaveApi = '';
    guardar();
    render();
    mostrarAviso('Chave removida deste aparelho.');
  },

  recomecar: () => {
    if (!window.confirm('Isso apaga a planilha atual deste aparelho. Os treinos já enviados continuam no intervals.icu até você enviar os novos. Continuar?')) return;
    const { chaveApi, atividades, enviados, assinaturas, envioAutomatico, semDados, perfil, objetivo, historicoNivel, ultimaSincronizacao } = estado;
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
    estado = { ...estadoInicial(), chaveApi, atividades, enviados, assinaturas, envioAutomatico, semDados, historicoNivel, ultimaSincronizacao };
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
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') aoAbrir();
});

render();
aoAbrir();
