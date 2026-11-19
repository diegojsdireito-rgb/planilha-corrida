// Tela do Mahjong paciência: tabuleiro em camadas, peças desenhadas em SVG, dica, embaralhar e desfazer.
import { el, formatarTempo } from '../comum.js';
import * as mj from '../mahjong.js';

// ---------- desenho das peças (caixa de 30 × 40) ----------
const PONTOS = {
  1: [[15, 20]], 2: [[15, 11], [15, 29]], 3: [[8, 9], [15, 20], [22, 31]], 4: [[9, 11], [21, 11], [9, 29], [21, 29]],
  5: [[9, 10], [21, 10], [15, 20], [9, 30], [21, 30]], 6: [[9, 8], [21, 8], [9, 20], [21, 20], [9, 32], [21, 32]],
  7: [[7, 7], [15, 11], [23, 15], [9, 24], [21, 24], [9, 33], [21, 33]], 8: [[9, 6], [21, 6], [9, 15], [21, 15], [9, 25], [21, 25], [9, 34], [21, 34]],
  9: [[7, 8], [15, 8], [23, 8], [7, 20], [15, 20], [23, 20], [7, 32], [15, 32], [23, 32]],
};
const COR_PONTO = (n, k) => (n === 1 ? '#d13b3b' : ['#1f6fd1', '#2e9e4f', '#d13b3b'][(k + n) % 3]);
const NUMERAIS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const VENTOS = { v1: ['東', 'Leste'], v2: ['南', 'Sul'], v3: ['西', 'Oeste'], v4: ['北', 'Norte'] };
const FLORES = { f1: '🌸', f2: '🌼', f3: '🌺', f4: '🌻', s1: '🌱', s2: '☀️', s3: '🍁', s4: '❄️' };

function face(k) {
  const tipo = k[0]; const n = Number(k.slice(1));
  if (tipo === 'd') {
    const r = n === 1 ? 10 : n <= 4 ? 5.2 : n <= 6 ? 4.6 : 3.8;
    return PONTOS[n].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${COR_PONTO(n, i)}"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#fff"/>${n === 1 ? `<circle cx="${x}" cy="${y}" r="${r * 0.2}" fill="#d13b3b"/>` : ''}`).join('');
  }
  if (tipo === 'b') {
    if (n === 1) return '<text x="15" y="27" font-size="20" text-anchor="middle">🦚</text>';
    return PONTOS[n].map(([x, y], i) => `<g fill="${i % 3 === 2 && n > 4 ? '#d13b3b' : '#2e9e4f'}"><rect x="${x - 2}" y="${y - 5.5}" width="4" height="11" rx="1.6"/></g><path d="M${x - 2} ${y} h4" stroke="#fff" stroke-width=".8"/>`).join('');
  }
  if (tipo === 'c') return `<text x="15" y="17" font-size="14" text-anchor="middle" fill="#1d1b18" font-weight="700">${NUMERAIS[n - 1]}</text><text x="15" y="35" font-size="14" text-anchor="middle" fill="#c62828" font-weight="700">萬</text>`;
  if (tipo === 'v') return `<text x="15" y="27" font-size="20" text-anchor="middle" fill="#1d3b8b" font-weight="700">${VENTOS[k][0]}</text>`;
  if (tipo === 'g') {
    if (n === 1) return '<text x="15" y="28" font-size="22" text-anchor="middle" fill="#c62828" font-weight="700">中</text>';
    if (n === 2) return '<text x="15" y="28" font-size="22" text-anchor="middle" fill="#2e7d32" font-weight="700">發</text>';
    return '<rect x="6" y="7" width="18" height="26" rx="2" fill="none" stroke="#1f6fd1" stroke-width="2.2"/><rect x="9.5" y="10.5" width="11" height="19" rx="1" fill="none" stroke="#1f6fd1" stroke-width="1"/>';
  }
  return `<text x="15" y="25" font-size="17" text-anchor="middle">${FLORES[k]}</text><text x="25" y="37" font-size="7" text-anchor="middle" fill="${tipo === 'f' ? '#c2185b' : '#2e7d32'}" font-weight="700">${n}</text>`;
}
const FACES = new Map();
const svgFace = (k) => { if (!FACES.has(k)) FACES.set(k, `<svg viewBox="0 0 30 40" aria-hidden="true">${face(k)}</svg>`); return FACES.get(k); };
const NOME = (k) => {
  const t = k[0]; const n = Number(k.slice(1));
  if (t in mj.NAIPES) return `${n} de ${mj.NAIPES[t].nome.toLowerCase()}`;
  if (t === 'v') return `Vento ${VENTOS[k][1]}`;
  if (t === 'g') return ['Dragão vermelho', 'Dragão verde', 'Dragão branco'][n - 1];
  return t === 'f' ? `Flor ${n}` : `Estação ${n}`;
};

export function montar(area, ctl) {
  const topo = el('div', 'mj-topo');
  const info = el('div', 'mj-info');
  const botoes = el('div', 'mj-botoes');
  const bDica = el('button', 'mj-botao', '💡<span>Dica</span>');
  const bEmb = el('button', 'mj-botao', '🔀<span>Embaralhar</span>');
  const bVolta = el('button', 'mj-botao', '↩️<span>Desfazer</span>');
  botoes.append(bDica, bEmb, bVolta);
  topo.append(info, botoes);
  const mesa = el('div', 'mj-mesa');
  const tabuleiro = el('div', 'mahjong');
  mesa.append(tabuleiro);
  area.append(topo, mesa);

  let jogo; let escolhida = null; let acabou = false; let relogio = null; let botoesPeca = new Map();
  let inicio = 0;

  const tempoAgora = () => jogo.tempo + (acabou || !inicio ? 0 : (Date.now() - inicio) / 1000);
  const salvar = () => ctl.salvar({ ...jogo, tempo: tempoAgora() });

  function escrever() {
    const r = mj.restantes(jogo.pecas);
    info.innerHTML = `<b>${r}</b> peças · <b>${r / 2}</b> pares · ⏱ ${formatarTempo(Math.floor(tempoAgora()))}`;
  }

  function medidas() {
    const ps = jogo.pecas;
    const maxX = Math.max(...ps.map((p) => p.x)) + 2; const maxY = Math.max(...ps.map((p) => p.y)) + 2;
    const camadas = Math.max(...ps.map((p) => p.z));
    const largura = mesa.clientWidth || 360;
    const topoMesa = mesa.getBoundingClientRect().top + window.scrollY;
    const alturaLivre = Math.max(300, (window.visualViewport?.height ?? window.innerHeight) - topoMesa - 40);
    const d = 0.1; // profundidade de cada camada, em fração da largura da peça
    const tw = Math.min(largura / (maxX / 2 + camadas * d + 0.15), alturaLivre / (maxY / 2 * 1.32 + camadas * d + 0.15), 64);
    return { tw, th: tw * 1.32, dz: tw * d, maxX, maxY, camadas };
  }

  function desenhar() {
    const { tw, th, dz, maxX, maxY, camadas } = medidas();
    tabuleiro.style.width = `${maxX / 2 * tw + camadas * dz + 6}px`;
    tabuleiro.style.height = `${maxY / 2 * th + camadas * dz + 6}px`;
    tabuleiro.style.setProperty('--tw', `${tw}px`);
    tabuleiro.style.setProperty('--th', `${th}px`);
    tabuleiro.style.setProperty('--esp', `${Math.max(3, tw * 0.09)}px`);
    tabuleiro.replaceChildren();
    botoesPeca = new Map();
    const livresAgora = new Set(mj.livres(jogo.pecas));
    const ordem = jogo.pecas.map((p, i) => [p, i]).filter(([p]) => !p.fora).sort(([a], [b]) => a.z - b.z || a.y - b.y || a.x - b.x);
    for (const [p] of ordem) {
      const b = el('button', `mj-peca${livresAgora.has(p) ? ' livre' : ''}${escolhida === p ? ' escolhida' : ''}`, svgFace(p.k));
      b.style.left = `${(p.x / 2) * tw + (camadas - p.z) * dz}px`;
      b.style.top = `${(p.y / 2) * th + (camadas - p.z) * dz}px`;
      b.style.zIndex = String(p.z * 100 + p.y + p.x);
      b.setAttribute('aria-label', `${NOME(p.k)}${livresAgora.has(p) ? '' : ' (presa)'}`);
      b.onclick = () => tocarPeca(p, b);
      botoesPeca.set(p, b);
      tabuleiro.append(b);
    }
    escrever();
  }

  function tocarPeca(p, b) {
    if (acabou) return;
    if (!inicio) inicio = Date.now();
    if (!mj.livre(p, jogo.pecas)) {
      ctl.som('erro');
      b.classList.remove('treme'); void b.offsetWidth; b.classList.add('treme');
      ctl.status('Essa peça está presa: precisa ter um lado livre e nada em cima.', '');
      return;
    }
    if (escolhida === p) { escolhida = null; ctl.som('clique'); desenhar(); return; }
    if (escolhida && mj.combinam(escolhida.k, p.k)) {
      const a = escolhida; escolhida = null;
      a.fora = true; p.fora = true;
      jogo.tirados.push([jogo.pecas.indexOf(a), jogo.pecas.indexOf(p)]);
      ctl.som('acerto');
      for (const x of [a, p]) botoesPeca.get(x)?.classList.add('saindo');
      setTimeout(() => { desenhar(); depois(); }, 220);
      salvar();
      return;
    }
    escolhida = p;
    ctl.som('clique');
    desenhar();
    ctl.status('Agora toque na peça igual', 'voce');
  }

  function depois() {
    if (!mj.restantes(jogo.pecas)) {
      acabou = true;
      const tempo = Math.round(tempoAgora());
      jogo.tempo = tempo;
      clearInterval(relogio);
      ctl.fim('vitoria', `Você limpou a mesa em ${formatarTempo(tempo)}! 🎉`, mesa, { tempo });
      return;
    }
    if (!mj.dica(jogo.pecas)) { ctl.status('Não tem mais pares livres. Toque em 🔀 Embaralhar.', 'derrota'); bEmb.classList.add('chama'); }
    else ctl.status('Muito bem! Continue', 'voce');
  }

  bDica.onclick = () => {
    if (acabou) return;
    const par = mj.dica(jogo.pecas);
    if (!par) { ctl.som('erro'); ctl.status('Sem pares livres: embaralhe as peças.', 'derrota'); bEmb.classList.add('chama'); return; }
    ctl.som('clique');
    escolhida = null; desenhar();
    for (const p of par) botoesPeca.get(p)?.classList.add('dica');
    jogo.tempo += 10; // a dica custa 10 segundos
    ctl.status('Estas duas combinam (+10 s no tempo)', 'voce');
  };
  bEmb.onclick = () => {
    if (acabou) return;
    mj.embaralhar(jogo.pecas);
    escolhida = null; bEmb.classList.remove('chama');
    ctl.som('dado');
    desenhar(); salvar();
    ctl.status('Peças embaralhadas', 'voce');
  };
  bVolta.onclick = () => {
    if (acabou) return;
    const ultimo = jogo.tirados.pop();
    if (!ultimo) { ctl.som('erro'); return; }
    for (const i of ultimo) jogo.pecas[i].fora = false;
    escolhida = null; ctl.som('mover');
    desenhar(); salvar();
    ctl.status('Par devolvido', '');
  };

  function iniciar(salvo) {
    acabou = false; escolhida = null; inicio = 0;
    bEmb.classList.remove('chama');
    jogo = salvo?.pecas ? { ...salvo, tirados: salvo.tirados ?? [] } : mj.novoJogo(ctl.nivel());
    clearInterval(relogio);
    relogio = setInterval(() => { if (!document.body.contains(mesa)) { clearInterval(relogio); return; } if (inicio && !acabou) escrever(); }, 1000);
    desenhar();
    if (salvo?.pecas) ctl.status('Partida retomada', 'voce');
    else ctl.status(`${mj.LAYOUTS[jogo.nivel]?.nome ?? 'Mesa'}: tire as peças iguais, de duas em duas`, 'voce');
    if (!salvo) salvar();
    depoisDeMontar();
  }
  function depoisDeMontar() { if (!mj.dica(jogo.pecas)) { mj.embaralhar(jogo.pecas); desenhar(); } }

  let ultimaLargura = 0;
  const aoRedimensionar = () => { if (!document.body.contains(mesa)) { window.removeEventListener('resize', aoRedimensionar); return; } if (mesa.clientWidth !== ultimaLargura) { ultimaLargura = mesa.clientWidth; desenhar(); } };
  window.addEventListener('resize', aoRedimensionar);

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}
