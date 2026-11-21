import * as doce from '../docinhos.js';
import { el } from '../comum.js';
import { prefs, guardar } from '../dados.js';
import { retrato } from '../personagem.js';

// Cada tipo tem forma e cor próprias: dá para distinguir mesmo sem enxergar bem as cores.
const DESENHO = [
  // 0 coração de morango
  '<path d="M50 84 C20 62 12 44 22 30 C32 17 46 22 50 33 C54 22 68 17 78 30 C88 44 80 62 50 84Z" fill="#ef4b5f"/><path d="M30 34 q6 -8 14 -2" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>',
  // 1 pirulito de laranja
  '<circle cx="50" cy="50" r="34" fill="#ff9a1f"/><path d="M50 50 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 12 a18 18 0 1 1 -18 -18 a24 24 0 1 1 24 24" fill="none" stroke="#ffd08a" stroke-width="5" stroke-linecap="round"/>',
  // 2 estrela de limão
  '<path d="M50 12 L61 38 L89 40 L67 58 L74 86 L50 71 L26 86 L33 58 L11 40 L39 38Z" fill="#ffd21f" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/><circle cx="42" cy="40" r="5" fill="#fff" opacity=".7"/>',
  // 3 bala de menta embrulhada
  '<path d="M8 36 L24 44 L24 56 L8 64Z M92 36 L76 44 L76 56 L92 64Z" fill="#7fdc9a"/><rect x="22" y="28" width="56" height="44" rx="20" fill="#2fb66a"/><path d="M34 30 v40 M50 30 v40 M66 30 v40" stroke="#bff2cf" stroke-width="5" opacity=".8"/>',
  // 4 gota de mirtilo
  '<path d="M50 12 C66 36 80 50 80 64 A30 30 0 0 1 20 64 C20 50 34 36 50 12Z" fill="#3e8bff"/><ellipse cx="40" cy="58" rx="7" ry="10" fill="#fff" opacity=".55"/>',
  // 5 diamante de uva
  '<path d="M50 12 L84 42 L50 88 L16 42Z" fill="#9b5cf6"/><path d="M16 42 H84 M50 12 L36 42 L50 88 L64 42Z" fill="none" stroke="#d7c2ff" stroke-width="3" stroke-linejoin="round"/>',
];
const ARCOIRIS = '<circle cx="50" cy="50" r="36" fill="#5b3a29"/>' + Array.from({ length: 14 }, (_, k) => {
  const a = k * 2.4;
  const r = 10 + (k % 4) * 6;
  const cores = ['#ef4b5f', '#ff9a1f', '#ffd21f', '#2fb66a', '#3e8bff', '#9b5cf6'];
  return `<rect x="${(50 + Math.cos(a) * r - 5).toFixed(1)}" y="${(50 + Math.sin(a) * r - 2).toFixed(1)}" width="10" height="4" rx="2" fill="${cores[k % 6]}" transform="rotate(${(k * 47) % 180} ${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)})"/>`;
}).join('');
const NOME_TIPO = ['coração vermelho', 'pirulito laranja', 'estrela amarela', 'bala verde', 'gota azul', 'diamante roxo'];
const NOME_ESPECIAL = { linha: 'listrado na horizontal', coluna: 'listrado na vertical', bomba: 'bomba', arcoiris: 'arco-íris' };

const PEDRA_SVG = (forca) => `<path d="M18 62 L14 40 L30 20 L58 14 L80 26 L88 50 L78 78 L50 88 L26 82Z" fill="${forca > 1 ? '#6f7480' : '#9aa0aa'}" stroke="#4d525c" stroke-width="4" stroke-linejoin="round"/>
  <path d="M30 26 L44 22 M66 22 L76 32 M22 54 L28 46" stroke="#c9ced6" stroke-width="5" stroke-linecap="round" opacity=".8"/>
  ${forca > 1 ? '<path d="M26 70 L40 66 M60 76 L72 70" stroke="#4d525c" stroke-width="4" stroke-linecap="round"/>' : '<path d="M50 14 L46 34 L56 46 L48 62 L54 88 M46 34 L32 40 M56 46 L72 50" fill="none" stroke="#3b3f47" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'}`;
// gelo por cima do doce: bloco azul-claro transparente; com duas camadas, mais grosso e com borda dupla
const GELO_SVG = (camadas) => `<rect x="6" y="6" width="88" height="88" rx="16" fill="#bfe9ff" fill-opacity="${camadas > 1 ? 0.62 : 0.45}" stroke="#ffffff" stroke-width="${camadas > 1 ? 7 : 4}"/>
  ${camadas > 1 ? '<rect x="15" y="15" width="70" height="70" rx="10" fill="none" stroke="#e8f8ff" stroke-width="3"/>' : ''}
  <path d="M18 34 L34 18 M18 50 L50 18" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>`;

function svgDoce(d) {
  if (d.pedra) return `<svg viewBox="0 0 100 100">${PEDRA_SVG(d.pedra)}</svg>`;
  if (d.gelo) return `<svg viewBox="0 0 100 100">${svgDoce({ ...d, gelo: 0 }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}${GELO_SVG(d.gelo)}</svg>`;
  if (d.especial === 'arcoiris') return `<svg viewBox="0 0 100 100">${ARCOIRIS}</svg>`;
  let extra = '';
  if (d.especial === 'linha') extra = '<path d="M14 44 H86 M14 56 H86" stroke="#fff" stroke-width="6" opacity=".9" stroke-linecap="round"/>';
  if (d.especial === 'coluna') extra = '<path d="M44 14 V86 M56 14 V86" stroke="#fff" stroke-width="6" opacity=".9" stroke-linecap="round"/>';
  if (d.especial === 'bomba') extra = '<circle cx="50" cy="50" r="44" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="10 7"/>';
  return `<svg viewBox="0 0 100 100">${DESENHO[d.tipo]}${extra}</svg>`;
}

// Bônus guardados (por jogador). Quem nunca jogou com bônus ganha alguns de cada para começar.
function estoque() {
  prefs.bonusDocinhos ??= Object.fromEntries(doce.BONUS.map((b) => [b.id, doce.BONUS_INICIAL]));
  for (const b of doce.BONUS) prefs.bonusDocinhos[b.id] ??= doce.BONUS_INICIAL;
  return prefs.bonusDocinhos;
}

const ELOGIOS = ['Doce!', 'Uau!', 'Que delícia!', 'Incrível!', 'Demais!'];

export const nivelLiberado = () => doce.progresso(prefs.historico).liberada;

export function montar(area, ctl) {
  const topo = el('div', 'doce-topo');
  const mascote = el('div', 'mascote');
  const fala = el('div', 'balao');
  const placar = el('div', 'doce-placar');
  topo.append(mascote, placar);
  const tabuleiro = el('div', 'doce-grade');
  tabuleiro.setAttribute('role', 'grid');
  tabuleiro.setAttribute('aria-label', 'Tabuleiro de doces');
  const fases = el('div', 'doce-fases');
  const botoes = el('div', 'acoes-solo');
  const dicaEl = el('button', 'botao secundario', '🤖 Dica do robô');
  botoes.append(dicaEl);
  const barraBonus = el('div', 'doce-bonus');
  barraBonus.setAttribute('role', 'group'); barraBonus.setAttribute('aria-label', 'Bônus');
  const mapa = el('div', 'doce-mapa');
  area.append(mapa, topo, fases, tabuleiro, barraBonus, botoes);
  const telaJogo = [topo, fases, tabuleiro, barraBonus, botoes];
  let noMapa = false;
  mascote.append(fala);

  let f; let grade; let pontos; let movimentos; let ocupado = false; let acabou = false;
  let selecionada = null; let ocioso = null;
  let bonusAtivo = null; let trocaA = null; // bônus escolhido, esperando o toque na mesa

  function desenharBonus() {
    const est = estoque();
    barraBonus.innerHTML = '';
    for (const b of doce.BONUS) {
      const botao = el('button', `bonus${bonusAtivo === b.id ? ' ativo' : ''}`, `<span class="ic">${b.icone}</span><span class="nome">${b.nome}</span><b class="qtd">${est[b.id]}</b>`);
      botao.disabled = !est[b.id] || acabou || (ocupado && bonusAtivo !== b.id);
      botao.title = b.texto; botao.setAttribute('aria-label', `${b.nome}: ${b.texto} Você tem ${est[b.id]}.`);
      botao.setAttribute('aria-pressed', String(bonusAtivo === b.id));
      botao.onclick = () => escolherBonus(b);
      barraBonus.append(botao);
    }
    tabuleiro.classList.toggle('mirando', Boolean(bonusAtivo));
  }

  function gastar(id) { estoque()[id]--; guardar(); }

  async function escolherBonus(b) {
    if (ocupado || acabou) return;
    pararDica();
    selecionada = null;
    if (bonusAtivo === b.id) { bonusAtivo = null; trocaA = null; ctl.som('clique'); falar('Bônus guardado.'); desenharBonus(); desenharGrade(false); return; }
    ctl.som('clique');
    if (b.id === 'mais5') {
      gastar(b.id); movimentos += 5; desenharPlacar(); desenharBonus(); salvar();
      falar('+5 movimentos!'); desenharMascote('uau'); ctl.som('premio');
      return;
    }
    if (b.id === 'mistura') {
      gastar(b.id); desenharBonus();
      tabuleiro.classList.add('mistura'); falar('Misturando!');
      grade = doce.embaralhar(grade);
      desenharGrade(false);
      if (!await ctl.esperar(450)) return;
      tabuleiro.classList.remove('mistura'); salvar(); agendarDica();
      return;
    }
    bonusAtivo = b.id; trocaA = null;
    falar(b.texto);
    desenharBonus();
  }

  // O toque na mesa com um bônus escolhido.
  async function usarBonus(i) {
    const id = bonusAtivo;
    let r = null;
    if (id === 'troca') {
      if (trocaA === null) { trocaA = i; selecionada = i; ctl.som('clique'); desenharGrade(false); falar('Agora o vizinho.'); return; }
      if (trocaA === i) { trocaA = null; selecionada = null; desenharGrade(false); return; }
      if (!doce.vizinhas(trocaA, i)) { trocaA = i; selecionada = i; ctl.som('clique'); desenharGrade(false); return; }
      const a = trocaA; trocaA = null; selecionada = null;
      r = doce.trocaLivre(grade, a, i, f.tipos);
      if (!r) { ctl.som('erro'); falar('Doce congelado e pedra não saem do lugar.'); desenharGrade(false); return; }
      const ea = elementos.get(grade[a].id); const eb = elementos.get(grade[i].id);
      posicionar(ea, i); posicionar(eb, a);
    } else if (id === 'martelo') r = doce.martelo(grade, i, f.tipos);
    else if (id === 'vassoura') r = doce.vassoura(grade, i, f.tipos);
    else if (id === 'arcoiris') {
      if (grade[i].especial === 'arcoiris' || grade[i].pedra) { ctl.som('erro'); falar('Escolha um doce, não uma pedra.'); return; }
      gastar(id); bonusAtivo = null;
      elementos.get(grade[i].id)?.classList.add('estoura');
      ctl.som('estrela');
      ocupado = true;
      if (!await ctl.esperar(200)) return;
      elementos.get(grade[i].id)?.remove(); elementos.delete(grade[i].id);
      grade = doce.virarArcoiris(grade, i);
      ocupado = false;
      desenharGrade(false); desenharBonus(); salvar();
      falar('Troque o arco-íris com uma cor!');
      agendarDica();
      return;
    }
    if (!r) return;
    gastar(id); bonusAtivo = null;
    desenharBonus();
    ctl.som(id === 'martelo' ? 'captura' : id === 'vassoura' ? 'captura' : 'clique');
    await animar(r);
    desenharBonus();
  }
  const elementos = new Map();

  const desenharMascote = (humor = 'feliz') => {
    mascote.innerHTML = retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso: humor });
    mascote.append(fala);
  };
  const falar = (texto) => {
    fala.textContent = texto;
    fala.classList.remove('mostra');
    void fala.offsetWidth;
    fala.classList.add('mostra');
  };

  function desenharPlacar() {
    const pct = Math.min(1, pontos / (f.meta * 2));
    const marcas = [1, 1.5, 2].map((m) => `<i style="left:${(m / 2) * 100}%" class="${pontos >= f.meta * m ? 'ok' : ''}">★</i>`).join('');
    const ob = doce.obstaculos(grade);
    const metaOb = (f.gelo ? `<span class="meta-ob ${ob.gelo ? '' : 'ok'}" title="Gelo para quebrar">🧊 ${ob.gelo || '✓'}</span>` : '')
      + (f.pedra ? `<span class="meta-ob ${ob.pedra ? '' : 'ok'}" title="Pedras para quebrar">🪨 ${ob.pedra || '✓'}</span>` : '');
    placar.innerHTML = `
      <div class="linha-placar"><span>Pontos ${metaOb}</span><span>Movimentos <b class="${movimentos <= 3 ? 'poucos' : ''}">${movimentos}</b></span></div>
      <div class="pontos-doce">${pontos.toLocaleString('pt-BR')}<small> / meta ${f.meta.toLocaleString('pt-BR')}</small></div>
      <div class="barra-meta"><span style="width:${pct * 100}%"></span>${marcas}</div>`;
  }

  function desenharFases() {
    fases.innerHTML = '';
    const voltar = el('button', 'botao secundario botao-mapa', '🗺️ Mapa');
    voltar.disabled = ocupado;
    voltar.onclick = () => { ctl.som('clique'); salvarSeJogando(); mostrarMapa(); };
    const est = doce.progresso(prefs.historico).melhor[f.nivel]?.estrelas ?? 0;
    fases.append(voltar, el('span', '', `${doce.regiaoDa(f.nivel).icone} Fase ${f.nivel} de ${doce.TOTAL_FASES} · ${'★'.repeat(est)}${'☆'.repeat(3 - est)}`));
  }
  const salvarSeJogando = () => { if (!acabou && f && grade) salvar(); };

  // ---------- Mapa das fases ----------
  // Um caminho que sobe: fase 1 embaixo, as próximas para cima. Fases passadas mostram as estrelas
  // (tocando dá para jogar de novo e melhorar); a fase da vez fica com a personagem; as outras, trancadas.
  const ESPACO = 92; const BORDA = 70;
  const posicao = (n) => ({ x: 50 + Math.sin(n * 0.95) * 30, y: (doce.TOTAL_FASES - n) * ESPACO + BORDA });
  function mostrarMapa(foco = null) {
    noMapa = true;
    pararDica();
    for (const e of telaJogo) e.hidden = true;
    mapa.hidden = false;
    const p = doce.progresso(prefs.historico);
    const salvo = ctl.salvo();
    const atual = foco ?? (salvo?.grade ? salvo.nivel : p.liberada);
    const altura = (doce.TOTAL_FASES - 1) * ESPACO + BORDA * 2;
    const pontos = Array.from({ length: doce.TOTAL_FASES }, (_, k) => posicao(k + 1));
    const regioes = doce.REGIOES.map((r, k) => {
      const porRegiao = doce.TOTAL_FASES / doce.REGIOES.length;
      const topo = (doce.TOTAL_FASES - (k + 1) * porRegiao) * ESPACO + BORDA - ESPACO / 2;
      const alto = porRegiao * ESPACO;
      return `<div class="mapa-regiao" style="top:${Math.max(0, topo)}px;height:${alto + (k === 0 ? BORDA : 0) + (k === doce.REGIOES.length - 1 ? BORDA : 0)}px;background:linear-gradient(${r.cor[1]}, ${r.cor[0]})"><span>${r.icone} ${r.nome}</span></div>`;
    }).join('');
    // docinhos espalhados pelos lados do caminho
    const enfeites = Array.from({ length: doce.TOTAL_FASES / 2 }, (_, k) => {
      const n = k * 2 + 1.5; const q = posicao(n); const lado = q.x > 50 ? -1 : 1;
      return `<span class="mapa-enfeite" style="left:${q.x + lado * 30}%;top:${q.y - 30}px">${svgDoce({ tipo: k % 6, especial: null })}</span>`;
    }).join('');
    const nos = pontos.map((q, k) => {
      const n = k + 1; const m = p.melhor[n];
      const estado = n > p.liberada ? 'trancada' : n === atual ? 'atual' : m?.estrelas ? 'feita' : 'aberta';
      const est = m?.estrelas ?? 0;
      const andamento = salvo?.grade && salvo.nivel === n;
      return `<button class="mapa-fase ${estado}${n % 15 === 0 ? ' chefe' : ''}" data-fase="${n}" style="left:${q.x}%;top:${q.y}px" aria-label="Fase ${n}${estado === 'trancada' ? ', trancada' : `, ${est} estrela${est === 1 ? '' : 's'}`}">
        ${estado === 'trancada' ? '🔒' : `<b>${n}</b>`}
        ${estado !== 'trancada' ? `<span class="mapa-estrelas">${[1, 2, 3].map((e) => `<i class="${e <= est ? 'ok' : ''}">★</i>`).join('')}</span>` : ''}
        ${andamento ? '<span class="mapa-andamento">▶</span>' : ''}
        ${n === atual ? `<span class="mapa-eu">${retrato({ ...prefs.personagem, estilo: prefs.carteira?.estilo, sorriso: 'feliz' })}</span>` : ''}
      </button>`;
    }).join('');
    mapa.innerHTML = `
      <div class="mapa-topo"><span>⭐ <b>${p.estrelas}</b> / ${p.maxEstrelas}</span><span>Fase <b>${p.liberada}</b> de ${doce.TOTAL_FASES}</span></div>
      <div class="mapa-rolagem"><div class="mapa-caminho" style="height:${altura}px">
        ${regioes}${enfeites}
        <svg class="mapa-trilha"></svg>
        ${nos}
      </div></div>
      <div class="mapa-detalhe" hidden></div>`;
    // a trilha é desenhada em pixels, depois de saber a largura: curvas suaves entre as fases,
    // e o trecho já percorrido fica colorido
    const svg = mapa.querySelector('.mapa-trilha');
    const largura = mapa.querySelector('.mapa-caminho').clientWidth || 360;
    const px = pontos.map((q) => [q.x / 100 * largura, q.y]);
    const curva = (lista) => lista.map(([x, y], k) => {
      if (!k) return `M${x.toFixed(1)} ${y}`;
      const [x0, y0] = lista[k - 1]; const my = (y0 + y) / 2;
      return `C${x0.toFixed(1)} ${my} ${x.toFixed(1)} ${my} ${x.toFixed(1)} ${y}`;
    }).join(' ');
    svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`);
    svg.innerHTML = `<path d="${curva(px)}" class="fundo"/><path d="${curva(px.slice(0, p.liberada))}" class="feito"/><path d="${curva(px)}" class="pontilhado"/>`;
    const rolagem = mapa.querySelector('.mapa-rolagem');
    const alvo = posicao(atual).y;
    requestAnimationFrame(() => { rolagem.scrollTop = alvo - rolagem.clientHeight / 2; });
    mapa.querySelectorAll('[data-fase]').forEach((b) => { b.onclick = () => escolherFase(Number(b.dataset.fase), p, salvo); });
    ctl.status(p.liberada === 1 && !p.melhor[1] ? 'Toque na fase 1 para começar!' : 'Escolha uma fase. Nas que você já passou, dá para jogar de novo e ganhar mais estrelas.', 'voce');
  }

  function escolherFase(n, p, salvo) {
    const caixa = mapa.querySelector('.mapa-detalhe');
    if (n > p.liberada) { ctl.som('erro'); ctl.status(`Passe a fase ${p.liberada} para abrir esta.`, ''); return; }
    ctl.som('clique');
    const fz = doce.fase(n); const m = p.melhor[n]; const est = m?.estrelas ?? 0;
    const andamento = salvo?.grade && salvo.nivel === n;
    const obst = [fz.gelo ? `🧊 ${fz.gelo} congelados` : '', fz.pedra ? `🪨 ${fz.pedra} pedras` : ''].filter(Boolean).join(' · ');
    caixa.innerHTML = `<div class="mapa-cartao">
      <button class="botao-icone fechar" aria-label="Fechar">✕</button>
      <small>${doce.regiaoDa(n).icone} ${doce.regiaoDa(n).nome}</small>
      <strong>Fase ${n}</strong>
      <span class="estrelas-fim">${'★'.repeat(est)}${'☆'.repeat(3 - est)}</span>
      <p>Meta: <b>${fz.meta.toLocaleString('pt-BR')}</b> pontos em ${fz.movimentos} movimentos${obst ? `<br>Quebre: ${obst}` : ''}</p>
      ${m?.pontos ? `<p class="recorde">Seu recorde: <b>${m.pontos.toLocaleString('pt-BR')}</b> pontos${est < 3 ? ` · ★★★ com ${(fz.meta * 2).toLocaleString('pt-BR')}` : ''}</p>` : ''}
      ${andamento ? '<button class="botao" data-continuar>▶ Continuar de onde parou</button><button class="botao secundario" data-jogar>Começar de novo</button>' : `<button class="botao" data-jogar>${m?.estrelas ? 'Jogar de novo' : 'Jogar'}</button>`}
    </div>`;
    caixa.hidden = false;
    caixa.querySelector('.fechar').onclick = () => { ctl.som('clique'); caixa.hidden = true; };
    caixa.onclick = (e) => { if (e.target === caixa) caixa.hidden = true; };
    caixa.querySelector('[data-continuar]')?.addEventListener('click', () => { ctl.som('clique'); iniciar(salvo); });
    caixa.querySelector('[data-jogar]').onclick = () => { ctl.som('clique'); iniciar(null, n); };
  }

  function posicionar(e, i, linhaInicial = null) {
    const r = linhaInicial ?? Math.floor(i / doce.LADO);
    e.style.transform = `translate(${(i % doce.LADO) * 100}%, ${r * 100}%)`;
  }

  // Sincroniza os elementos com a grade: os existentes deslizam, os novos caem de cima.
  function desenharGrade(animarNovos = true) {
    const vivos = new Set();
    const novosPorColuna = {};
    grade.forEach((d, i) => {
      vivos.add(d.id);
      let e = elementos.get(d.id);
      if (!e) {
        e = el('button', 'doce');
        e.dataset.id = d.id;
        elementos.set(d.id, e);
        tabuleiro.append(e);
        if (animarNovos) {
          const c = i % doce.LADO;
          novosPorColuna[c] = (novosPorColuna[c] ?? 0) + 1;
          e.style.transition = 'none';
          posicionar(e, i, -novosPorColuna[c] - 0.2);
          void e.offsetWidth;
          e.style.transition = '';
        }
      }
      const chave = `${d.tipo}${d.especial}${d.gelo ?? 0}${d.pedra ?? 0}`;
      if (e.dataset.desenho !== chave) {
        e.innerHTML = svgDoce(d);
        e.dataset.desenho = chave;
      }
      e.dataset.i = i;
      e.classList.toggle('sel', i === selecionada);
      e.setAttribute('aria-label', d.pedra ? `pedra${d.pedra > 1 ? ' dura' : ''}` : `${d.especial ? NOME_ESPECIAL[d.especial] : ''} ${d.especial === 'arcoiris' ? '' : NOME_TIPO[d.tipo]}${d.gelo ? ' congelado' : ''}`.trim());
      posicionar(e, i);
    });
    for (const [id, e] of elementos) if (!vivos.has(id)) { e.remove(); elementos.delete(id); }
  }

  const salvar = () => ctl.salvar({ nivel: f.nivel, grade, pontos, movimentos });

  async function tentar(a, b) {
    if (ocupado || acabou || !doce.vizinhas(a, b)) return;
    pararDica();
    selecionada = null;
    const r = doce.trocar(grade, a, b, f.tipos);
    ocupado = true;
    const ea = elementos.get(grade[a].id); const eb = elementos.get(grade[b].id);
    posicionar(ea, b); posicionar(eb, a);
    ctl.som('clique');
    if (!await ctl.esperar(200)) return;
    if (!r) {
      posicionar(ea, a); posicionar(eb, b);
      ctl.som('erro');
      if (doce.preso(grade[a]) || doce.preso(grade[b])) falar('Esse não sai do lugar: estoure doces ao lado!');
      await ctl.esperar(220);
      ocupado = false;
      desenharGrade(false);
      agendarDica();
      return;
    }
    movimentos--;
    desenharPlacar();
    await animar(r);
  }

  // Mostra as etapas de uma jogada ou de um bônus: estoura, cai, cascatas e pontos.
  async function animar(r) {
    ocupado = true;
    let passo = 0;
    for (const etapa of r.etapas) {
      if (etapa.embaralhou) {
        falar('Sem jogadas: misturando!');
        tabuleiro.classList.add('mistura');
      }
      for (const id of etapa.removidos) elementos.get(id)?.classList.add('estoura');
      if (etapa.removidos.length) ctl.som(passo === 0 ? (etapa.removidos.length > 4 ? 'captura' : 'estrela') : 'acerto');
      if (!await ctl.esperar(etapa.removidos.length ? 230 : 0)) return;
      for (const id of etapa.removidos) { elementos.get(id)?.remove(); elementos.delete(id); }
      grade = etapa.grade;
      pontos += etapa.pontos;
      desenharGrade();
      desenharPlacar();
      if (passo === 1) { falar(ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)]); desenharMascote('uau'); }
      if (!await ctl.esperar(300)) return;
      tabuleiro.classList.remove('mistura');
      passo++;
    }
    if (etapaComEspecial(r)) falar('Doce especial!');
    desenharMascote();
    ocupado = false;
    desenharBonus();
    if (movimentos <= 0) return terminar();
    salvar();
    agendarDica();
  }

  const etapaComEspecial = (r) => r.etapas.some((e) => e.criados.length);

  function terminar() {
    acabou = true;
    pararDica();
    const sobra = doce.obstaculos(grade).total;
    const venceu = doce.venceu(pontos, f, grade);
    const est = venceu ? doce.estrelas(pontos, f.meta) : 0;
    desenharMascote(venceu ? 'uau' : 'feliz');
    const cartao = el('div', 'faixa-fim doce-fim', `<div>
      <strong>${venceu ? `Fase ${f.nivel} concluída!` : 'Quase lá!'}</strong>
      <span class="estrelas-fim">${'★'.repeat(est)}${'☆'.repeat(3 - est)}</span>
      <small>${pontos.toLocaleString('pt-BR')} pontos · meta ${f.meta.toLocaleString('pt-BR')}${sobra ? ` · faltou quebrar ${sobra}` : ''}</small>
    </div>`);
    cartao.style.pointerEvents = 'auto';
    // prêmio: um bônus sorteado por estrela
    if (venceu) {
      const ganhos = Array.from({ length: est }, () => doce.BONUS[Math.floor(Math.random() * doce.BONUS.length)]);
      for (const g of ganhos) estoque()[g.id]++;
      guardar();
      cartao.firstChild.append(el('small', 'premio-bonus', `Você ganhou: ${ganhos.map((g) => `${g.icone} ${g.nome}`).join(' · ')}`));
      desenharBonus();
    }
    const proxima = Math.min(doce.TOTAL_FASES, f.nivel + 1);
    const b = el('button', 'botao', venceu ? (f.nivel < doce.TOTAL_FASES ? 'Próxima fase ›' : 'Jogar de novo') : 'Tentar de novo');
    b.onclick = () => { ctl.som('clique'); cartao.remove(); iniciar(null, venceu ? proxima : f.nivel); };
    const bm = el('button', 'botao secundario', '🗺️ Mapa');
    bm.onclick = () => { ctl.som('clique'); cartao.remove(); mostrarMapa(venceu ? proxima : f.nivel); };
    const linhaBotoes = el('div', 'fim-botoes'); linhaBotoes.append(bm, b);
    cartao.firstChild.append(linhaBotoes);
    if (venceu && f.nivel === doce.TOTAL_FASES) cartao.firstChild.insertBefore(el('small', 'premio-bonus', '🏆 Você terminou o caminho inteiro!'), linhaBotoes);
    ctl.fim(venceu ? 'vitoria' : 'derrota', venceu ? `Fase ${f.nivel} concluída com ${est} estrela${est > 1 ? 's' : ''}!` : pontos < f.meta ? `Faltaram ${(f.meta - pontos).toLocaleString('pt-BR')} pontos${sobra ? ` e ${sobra} ${sobra === 1 ? 'obstáculo' : 'obstáculos'}` : ''}. Tente de novo!` : `Faltou quebrar ${sobra} ${sobra === 1 ? 'obstáculo' : 'obstáculos'}. Tente de novo!`, null, { nivel: f.nivel, pontos, estrelas: est });
    tabuleiro.append(cartao);
    desenharFases();
    desenharBonus();
  }

  // Dica do robô: depois de um tempo parado, ou no botão.
  function pararDica() {
    clearTimeout(ocioso);
    tabuleiro.querySelectorAll('.dica').forEach((e) => e.classList.remove('dica'));
  }
  function mostrarDica() {
    pararDica();
    const j = doce.encontrarJogada(grade);
    if (!j) return;
    j.forEach((i) => elementos.get(grade[i].id)?.classList.add('dica'));
  }
  function agendarDica() {
    clearTimeout(ocioso);
    const ativa = ctl.ativa();
    ocioso = setTimeout(() => { if (ativa() && !ocupado && !acabou) mostrarDica(); }, 7000);
  }
  dicaEl.onclick = () => { if (!ocupado && !acabou) { ctl.som('clique'); mostrarDica(); falar('Que tal estes dois?'); } };

  // Arrastar um doce para o lado troca; tocar num e depois no vizinho também.
  let inicio = null;
  tabuleiro.addEventListener('pointerdown', (e) => {
    const alvo = e.target.closest('.doce');
    if (!alvo || ocupado || acabou) return;
    if (bonusAtivo) { usarBonus(Number(alvo.dataset.i)); return; }
    inicio = { i: Number(alvo.dataset.i), x: e.clientX, y: e.clientY };
    tabuleiro.setPointerCapture?.(e.pointerId);
  });
  tabuleiro.addEventListener('pointermove', (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.x; const dy = e.clientY - inicio.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
    const i = inicio.i;
    inicio = null;
    const c = i % doce.LADO;
    let j;
    if (Math.abs(dx) > Math.abs(dy)) j = dx > 0 ? (c < 7 ? i + 1 : -1) : (c > 0 ? i - 1 : -1);
    else j = dy > 0 ? i + doce.LADO : i - doce.LADO;
    if (j >= 0 && j < 64) tentar(i, j);
  });
  tabuleiro.addEventListener('pointerup', () => {
    if (!inicio) return;
    const i = inicio.i;
    inicio = null;
    if (selecionada !== null && selecionada !== i && doce.vizinhas(selecionada, i)) { const a = selecionada; selecionada = null; tentar(a, i); return; }
    selecionada = selecionada === i ? null : i;
    ctl.som('clique');
    desenharGrade(false);
  });

  function iniciar(salvo, nivel) {
    noMapa = false;
    mapa.hidden = true;
    for (const e of telaJogo) e.hidden = false;
    pararDica();
    acabou = false; ocupado = false; selecionada = null; bonusAtivo = null; trocaA = null;
    tabuleiro.querySelectorAll('.faixa-fim').forEach((x) => x.remove());
    for (const e of elementos.values()) e.remove();
    elementos.clear();
    if (salvo?.grade) {
      f = doce.fase(salvo.nivel);
      ({ grade, pontos, movimentos } = salvo);
    } else {
      f = doce.fase(nivel ?? nivelLiberado());
      grade = doce.comObstaculos(doce.novaGrade(f.tipos), f);
      pontos = 0;
      movimentos = f.movimentos;
      ctl.apagar();
    }
    desenharMascote();
    desenharPlacar();
    desenharFases();
    desenharGrade();
    desenharBonus();
    ctl.status(salvo ? 'Partida retomada' : `Faça ${f.meta.toLocaleString('pt-BR')} pontos${f.gelo || f.pedra ? ` e quebre ${[f.gelo ? 'o gelo' : '', f.pedra ? 'as pedras' : ''].filter(Boolean).join(' e ')}` : ''} em ${f.movimentos} movimentos`, 'voce');
    falar(salvo ? 'Vamos continuar!' : f.nivel === 1 ? 'Arraste um doce para trocar!' : f.nivel === 3 ? 'Estoure doces perto do gelo para quebrar!' : f.nivel === 4 ? 'Estoure doces ao lado das pedras!' : `Fase ${f.nivel}!`);
    agendarDica();
  }

  // Abre no mapa; "Nova partida" joga de novo a fase aberta (ou a próxima, a partir do mapa).
  mostrarMapa();
  return { reiniciar: () => (noMapa ? iniciar(null, nivelLiberado()) : iniciar(null, f?.nivel)) };
}
