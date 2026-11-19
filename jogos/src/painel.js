// Painel da tela inicial: números e gráficos a partir do histórico guardado no aparelho.
import { el, formatarTempo } from './comum.js';
import { prefs, melhorTempo } from './dados.js';

const DIA = 86400000;
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const inicioDoDia = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const ddmm = (t) => { const d = new Date(t); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; };
const pct = (x) => `${Math.round(x * 100)}%`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export function estatisticas(historico, jogos) {
  const versus = new Set(jogos.filter((j) => !j.solo).map((j) => j.id));
  const contra = historico.filter((h) => versus.has(h.j));
  const conta = (lista) => {
    const c = { v: 0, d: 0, e: 0 };
    for (const h of lista) { if (h.r === 'vitoria') c.v++; else if (h.r === 'derrota') c.d++; else c.e++; }
    c.total = c.v + c.d + c.e;
    c.taxa = c.total ? c.v / c.total : null;
    return c;
  };
  let atual = 0; let melhor = 0; let corrida = 0;
  for (const h of contra) {
    corrida = h.r === 'vitoria' ? corrida + 1 : 0;
    melhor = Math.max(melhor, corrida);
  }
  atual = corrida;
  const hoje = inicioDoDia(Date.now());
  const dias = Array.from({ length: 14 }, (_, k) => ({ t: hoje - (13 - k) * DIA, total: 0, v: 0 }));
  for (const h of historico) {
    if (!h.t) continue;
    const k = Math.round((inicioDoDia(h.t) - dias[0].t) / DIA);
    if (k >= 0 && k < 14) { dias[k].total++; if (h.r === 'vitoria') dias[k].v++; }
  }
  return {
    geral: conta(contra),
    porJogo: jogos.filter((j) => !j.solo).map((j) => ({ jogo: j, ...conta(contra.filter((h) => h.j === j.id)) })),
    solo: jogos.filter((j) => j.solo).map((j) => ({ jogo: j, resolvidos: historico.filter((h) => h.j === j.id && h.r === 'vitoria').length, melhor: melhorTempo(j.id) })),
    atual,
    melhor,
    dias,
    hoje: dias[13].total,
    recentes: historico.slice(-12).reverse(),
  };
}

// Dica flutuante, usada pelos dois gráficos. Abre com o mouse ou com um toque.
function criarDica(raiz) {
  const dica = el('div', 'tooltip');
  dica.hidden = true;
  raiz.append(dica);
  const mostrar = (alvo, html) => {
    dica.innerHTML = html;
    dica.hidden = false;
    const r = alvo.getBoundingClientRect();
    const base = raiz.getBoundingClientRect();
    const w = dica.offsetWidth;
    let x = r.left + r.width / 2 - base.left - w / 2;
    x = Math.max(4, Math.min(x, base.width - w - 4));
    dica.style.left = `${x}px`;
    dica.style.top = `${r.top - base.top - dica.offsetHeight - 8}px`;
  };
  const esconder = () => { dica.hidden = true; };
  return {
    ligar(alvo, html) {
      alvo.addEventListener('pointerenter', () => mostrar(alvo, html));
      alvo.addEventListener('pointerleave', esconder);
      alvo.addEventListener('focus', () => mostrar(alvo, html));
      alvo.addEventListener('blur', esconder);
      alvo.tabIndex = 0;
    },
  };
}

export function montarPainel(raiz, jogos, abrirJogo) {
  const e = estatisticas(prefs.historico, jogos);
  const painel = el('section', 'painel');
  painel.setAttribute('aria-label', 'Painel de estatísticas');
  const dica = criarDica(painel);

  // Destaque e números
  const g = e.geral;
  const topo = el('div', 'kpis');
  topo.innerHTML = `
    <div class="heroi">
      <span class="rot">Aproveitamento contra o robô</span>
      <span class="valor">${g.taxa === null ? '—' : pct(g.taxa)}</span>
      <span class="sub">${g.total ? `${plural(g.v, 'vitória', 'vitórias')} · ${plural(g.d, 'derrota', 'derrotas')} · ${plural(g.e, 'empate', 'empates')}` : 'Jogue a primeira partida para começar o painel'}</span>
      <div class="barra-vde" aria-hidden="true">${[['v', g.v], ['e', g.e], ['d', g.d]].filter(([, n]) => n > 0).map(([c, n]) => `<i class="${c}" style="flex:${n}"></i>`).join('')}</div>
    </div>
    <div class="tile"><span class="rot">Partidas</span><span class="valor">${prefs.historico.length}</span><span class="sub">${e.hoje ? `${e.hoje} hoje` : 'nenhuma hoje'}</span></div>
    <div class="tile"><span class="rot">Sequência atual</span><span class="valor">${e.atual}</span><span class="sub">${e.atual === 1 ? 'vitória seguida' : 'vitórias seguidas'}</span></div>
    <div class="tile"><span class="rot">Melhor sequência</span><span class="valor">${e.melhor}</span><span class="sub">recorde de vitórias</span></div>`;
  painel.append(topo);

  // Partidas por dia
  const cartaoDias = el('div', 'grafico');
  const maxDia = Math.max(1, ...e.dias.map((d) => d.total));
  const passo = maxDia <= 4 ? 1 : Math.ceil(maxDia / 4);
  const topoEixo = Math.ceil(maxDia / passo) * passo;
  cartaoDias.innerHTML = `<h3>Partidas nos últimos 14 dias</h3><p class="sub">${plural(e.dias.reduce((t, d) => t + d.total, 0), 'partida', 'partidas')} no período</p>`;
  const plot = el('div', 'colunas-plot');
  plot.style.setProperty('--topo', topoEixo);
  const grade = el('div', 'grade-y', Array.from({ length: topoEixo / passo + 1 }, (_, k) => `<span style="bottom:${(k * passo / topoEixo) * 100}%"><em>${k * passo}</em></span>`).join(''));
  plot.append(grade);
  const barras = el('div', 'barras');
  e.dias.forEach((d, k) => {
    const col = el('div', 'col');
    const dt = new Date(d.t);
    col.innerHTML = `<i style="height:${(d.total / topoEixo) * 100}%"></i>`;
    if (d.total && d.total === maxDia) col.insertAdjacentHTML('beforeend', `<b style="bottom:${(d.total / topoEixo) * 100}%">${d.total}</b>`);
    col.setAttribute('aria-label', `${SEMANA[dt.getDay()]}, ${ddmm(d.t)}: ${plural(d.total, 'partida', 'partidas')}`);
    dica.ligar(col, `<strong>${SEMANA[dt.getDay()]}, ${ddmm(d.t)}${k === 13 ? ' (hoje)' : ''}</strong><br>${plural(d.total, 'partida', 'partidas')}${d.total ? `<br>${plural(d.v, 'vitória', 'vitórias')}` : ''}`);
    barras.append(col);
  });
  plot.append(barras);
  cartaoDias.append(plot);
  const eixoX = el('div', 'eixo-x');
  eixoX.innerHTML = e.dias.map((d, k) => `<span>${k === 0 || k === 13 || k === 6 ? (k === 13 ? 'hoje' : ddmm(d.t)) : ''}</span>`).join('');
  cartaoDias.append(eixoX);

  // Aproveitamento por jogo
  const cartaoJogos = el('div', 'grafico');
  cartaoJogos.innerHTML = '<h3>Aproveitamento por jogo</h3><p class="sub">Vitórias sobre o total de partidas contra o robô</p>';
  const linhas = el('div', 'linhas');
  const ordenados = [...e.porJogo].sort((a, b) => (b.taxa ?? -1) - (a.taxa ?? -1) || b.total - a.total);
  for (const j of ordenados) {
    const linha = el('button', 'linha-jogo');
    linha.innerHTML = `
      <span class="nome"><span class="mini">${j.jogo.icone}</span>${j.jogo.nome}</span>
      <span class="trilho">${j.taxa ? `<i style="width:${Math.max(j.taxa * 100, 1.5)}%"></i>` : ''}</span>
      <span class="num">${j.total ? pct(j.taxa) : '—'}</span>`;
    linha.setAttribute('aria-label', `${j.jogo.nome}: ${j.total ? `${pct(j.taxa)} de aproveitamento` : 'sem partidas'}`);
    dica.ligar(linha, j.total ? `<strong>${j.jogo.nome}</strong><br>${plural(j.v, 'vitória', 'vitórias')} · ${plural(j.d, 'derrota', 'derrotas')} · ${plural(j.e, 'empate', 'empates')}` : `<strong>${j.jogo.nome}</strong><br>Ainda sem partidas`);
    linha.onclick = () => abrirJogo(j.jogo);
    linhas.append(linha);
  }
  cartaoJogos.append(linhas);
  const tabela = el('details', 'tabela-dados', `<summary>Ver em tabela</summary><table><thead><tr><th>Jogo</th><th>V</th><th>D</th><th>E</th><th>%</th></tr></thead><tbody>${
    e.porJogo.map((j) => `<tr><td>${j.jogo.nome}</td><td>${j.v}</td><td>${j.d}</td><td>${j.e}</td><td>${j.total ? pct(j.taxa) : '—'}</td></tr>`).join('')
  }</tbody></table>`);
  cartaoJogos.append(tabela);

  // Desafios solo
  const cartaoSolo = el('div', 'grafico solo');
  cartaoSolo.innerHTML = `<h3>Desafios solo</h3>${e.solo.map((s) => {
    const r = s.jogo.resumo?.().painel;
    if (r) return `<div class="solo-linha"><span class="mini">${s.jogo.icone}</span><span><strong>${s.jogo.nome}</strong><small>${r.sub}</small></span><span class="tempo"><small>${r.rotulo}</small>${r.valor}</span></div>`;
    return `<div class="solo-linha"><span class="mini">${s.jogo.icone}</span><span><strong>${s.jogo.nome}</strong><small>${plural(s.resolvidos, 'resolvido', 'resolvidos')}</small></span><span class="tempo">${s.melhor ? `<small>melhor tempo</small>${formatarTempo(s.melhor)}` : '<small>sem recorde</small>—'}</span></div>`;
  }).join('')}`;

  // Últimas partidas
  const cartaoRecentes = el('div', 'grafico');
  const nomeJogo = Object.fromEntries(jogos.map((j) => [j.id, j.nome]));
  const LETRA = { vitoria: 'V', derrota: 'D', empate: 'E', concluida: '★' };
  const PALAVRA = { vitoria: 'Vitória', derrota: 'Derrota', empate: 'Empate', concluida: 'Partida' };
  cartaoRecentes.innerHTML = `<h3>Últimas partidas</h3>${e.recentes.length ? `<div class="recentes">${e.recentes.map((h) => `
    <span class="chip ${h.r}" title="${PALAVRA[h.r]} em ${nomeJogo[h.j] ?? h.j}${h.t ? `, ${ddmm(h.t)}` : ''}"><b>${LETRA[h.r]}</b>${nomeJogo[h.j] ?? h.j}</span>`).join('')}</div>
    <p class="legenda"><span class="chip vitoria"><b>V</b>vitória</span><span class="chip empate"><b>E</b>empate</span><span class="chip derrota"><b>D</b>derrota</span>${e.recentes.some((h) => h.r === 'concluida') ? '<span class="chip concluida"><b>★</b>corrida</span>' : ''}</p>` : '<p class="sub">Nenhuma partida ainda.</p>'}`;

  const graficos = el('div', 'graficos');
  graficos.append(cartaoDias, cartaoJogos, cartaoSolo, cartaoRecentes);
  painel.append(graficos);
  raiz.append(painel);
}
