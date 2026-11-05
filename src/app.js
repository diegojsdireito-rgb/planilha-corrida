import { carregar, salvar, exportar, importar, estadoInicial } from './armazenamento.js';
import { criarCliente } from './icu.js';
import {
  analisarRevisao,
  aplicarRevisao,
  avaliarPrudencia,
  baseDasAtividades,
  estimarVdot,
  formatarRitmo,
  formatarTempo,
  gerarPlano,
  preverTempoSeg,
  proximaSegunda,
  segundaDaSemana,
  somarDias,
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
const DIAS_DE_HISTORICO = 90;

let estado = carregar();
let aba = 'hoje';
let ocupado = false;

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

async function enviarAoRelogio() {
  const dia = hoje();
  const futuras = estado.plano.sessoes.filter((s) => s.data >= dia);
  const trocar = estado.enviados.filter((id) => id.slice(3) >= dia);
  await criarCliente({ chave: estado.chaveApi }).enviarTreinos(futuras, trocar, formatarRitmo);
  estado.enviados = [...estado.enviados.filter((id) => id.slice(3) < dia), ...futuras.map((s) => s.id)];
  estado.ultimoEnvio = new Date().toISOString();
  guardar();
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
        <div class="linha">
          <label>Objetivo
            <select name="distancia">
              ${[['', 'Condicionamento'], ['5', '5 km'], ['10', '10 km'], ['21.1', 'Meia maratona'], ['42.2', 'Maratona']]
                .map(([valor, nome]) => `<option value="${valor}" ${String(v.distancia ?? '10') === valor ? 'selected' : ''}>${nome}</option>`).join('')}
            </select>
          </label>
          <label>Data da prova<input name="dataProva" type="date" value="${esc(v.dataProva ?? '')}"></label>
        </div>
        <p class="suave">Sem prova marcada, a planilha terá 12 semanas.</p>
      </section>

      <section class="cartao">
        <h2>Sua rotina</h2>
        <fieldset>
          <legend>Dias em que pode correr</legend>
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
  if (dias.length < 3) return problema('Escolha pelo menos 3 dias de corrida.');
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

      estado = { ...estado, chaveApi: chave, perfil, objetivo, tempoInformado, plano, origemVdot: estimativa.origem };
      guardar();
      aba = 'plano';
      render();
      mostrarAviso('Planilha pronta.');
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
      </section>`;
  } else if (proxima) {
    principal = `
      <section class="cartao">
        <h2>Hoje é dia de descanso</h2>
        <p class="suave">O descanso também faz parte do treino.</p>
        <p>Próximo treino: <strong>${esc(proxima.nome)}</strong>, ${dataLonga(proxima.data)}, ${km(proxima.distanciaKm)}.</p>
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
    <div class="sessao">
      <div>
        <div class="data">${dataCurta(sessao.data)}</div>
        <div><strong>${esc(sessao.nome)}</strong></div>
        ${seloTipo(sessao.tipo)}
      </div>
      ${status}
    </div>`;
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
    ${plano.prudencia?.prudente ? `<section class="cartao alerta"><strong>Progressão mais cuidadosa:</strong> ${esc(plano.prudencia.motivos.join(', '))}.</section>` : ''}
    <section class="cartao">
      <h2>Levar para o relógio</h2>
      ${estado.chaveApi
        ? `<p class="suave">Envia ${futuras} treinos ao calendário do intervals.icu. Eles seguem para o Garmin se a opção "Upload planned workouts" estiver ligada lá.</p>
           ${estado.ultimoEnvio ? `<p class="suave">Último envio: ${new Date(estado.ultimoEnvio).toLocaleString('pt-BR')}</p>` : ''}
           <button class="principal" data-acao="enviar" ${futuras ? '' : 'disabled'}>Enviar treinos</button>`
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
};

function telaRevisao() {
  const dia = hoje();
  const analise = analisarRevisao({ plano: estado.plano, atividades: estado.atividades, avaliacoes: estado.avaliacoes, hoje: dia });
  const mudaRitmo = analise.novoVdot !== estado.plano.vdot;
  const podeAplicar = (analise.acao !== 'semDados' || mudaRitmo) && estado.revisoes.at(-1)?.data !== dia;

  return `
    <header class="topo">
      <h1>Revisão</h1>
      <p class="suave">Compara os últimos 14 dias com o previsto. Só muda da próxima segunda em diante.</p>
    </header>
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
      ${estado.revisoes.at(-1)?.data === dia ? '<p class="suave">Revisão de hoje já aplicada.</p>' : ''}
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
      <h2>Cópia de segurança</h2>
      <p class="suave">Seus dados ficam só neste aparelho. A cópia não inclui a chave de API.</p>
      <div class="botoes">
        <button data-acao="exportar">Exportar</button>
        <label style="margin:0"><span class="suave">Importar arquivo</span><input type="file" id="importar" accept="application/json,.json"></label>
      </div>
    </section>
    <section class="cartao">
      <h2>Como a planilha é calculada</h2>
      <p class="suave">Ritmos pelas fórmulas de Daniels e Gilbert (VDOT). Volume sobe até 10% por semana, ou 5% no modo cuidadoso, com semanas de recuperação e polimento antes da prova. Esses limites são prudência, não garantia contra lesões. Esta planilha não substitui avaliação médica ou de um treinador.</p>
    </section>
    <button class="perigo largo" data-acao="recomecar">Começar novo ciclo</button>`;
}

// ---------- Estrutura ----------

function renderAbas() {
  const itens = [['hoje', 'Hoje'], ['plano', 'Planilha'], ['revisao', 'Revisão'], ['ajustes', 'Ajustes']];
  abas.hidden = false;
  abas.innerHTML = itens
    .map(([id, nome]) => `<button data-aba="${id}" ${aba === id ? 'aria-current="page"' : ''}>${nome}</button>`)
    .join('');
}

function render() {
  if (!estado.plano) return telaCadastro();
  renderAbas();
  const telas = { hoje: telaHoje, plano: telaPlano, revisao: telaRevisao, ajustes: telaAjustes };
  app.innerHTML = telas[aba]();
  window.scrollTo(0, 0);
}

abas.addEventListener('click', (e) => {
  const botao = e.target.closest('[data-aba]');
  if (!botao) return;
  aba = botao.dataset.aba;
  render();
});

const acoes = {
  enviar: (botao) => comOcupado(botao, async () => {
    await enviarAoRelogio();
    render();
    mostrarAviso('Treinos enviados ao intervals.icu.');
  }),

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
    guardar();
    render();
    mostrarAviso(estado.chaveApi ? 'Planilha ajustada. Envie os treinos de novo em Planilha.' : 'Planilha ajustada.');
  }),

  exportar: () => {
    const arquivo = new Blob([exportar(estado)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(arquivo);
    link.download = `planilha-corrida-${hoje()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  'remover-chave': () => {
    estado.chaveApi = '';
    guardar();
    render();
    mostrarAviso('Chave removida deste aparelho.');
  },

  recomecar: () => {
    if (!window.confirm('Começar um novo ciclo apaga a planilha atual deste aparelho. Os treinos já enviados continuam no intervals.icu. Continuar?')) return;
    const { chaveApi, atividades, enviados, semDados } = estado;
    estado = { ...estadoInicial(), chaveApi, atividades, enviados, semDados };
    guardar();
    aba = 'hoje';
    render();
  },
};

app.addEventListener('click', (e) => {
  const botao = e.target.closest('[data-acao]');
  if (botao) acoes[botao.dataset.acao]?.(botao);
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

render();
