// Tela do Adivinhe a Palavra: uma cesta de balões que perde um balão a cada letra errada.
import { el } from '../comum.js';
import * as fc from '../forca.js';
import { semAcento } from '../palavras.js';

export const INFO = {
  id: 'forca',
  nome: 'Adivinhe a Palavra',
  descricao: 'Salve os balões do coelhinho',
  solo: true,
  rotuloNivel: 'Nível da próxima palavra',
  regras: [
    'Descubra a palavra secreta escolhendo letras no teclado. A dica mostra o tema da palavra.',
    'Letra certa aparece em todos os lugares em que ela está. Letras com acento ou cedilha valem pela letra sem acento (o A vale para Á, Ã e Â; o C vale para Ç).',
    'Cada letra errada faz um balão do coelhinho voar embora. Se acabarem os balões, a cesta desce e a palavra é mostrada.',
    'Fácil: palavras curtas, 8 balões e a figurinha da palavra já aparece. Médio: palavras médias e 6 balões. Difícil: palavras compridas e só 5 balões.',
    'No médio e no difícil, toque em 🔎 Figurinha para ver o desenho da palavra. No computador, dá para usar o teclado.',
  ],
};

export const ICONE = '<svg viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="#bfe6ff"/><path d="M6 8.6 3.4 4.6M6 8.6 6 4M6 8.6 8.6 4.6" stroke="#7a6a58" stroke-width=".25"/><ellipse cx="3.3" cy="3.4" rx="1.5" ry="1.8" fill="#ff5c8a"/><ellipse cx="8.7" cy="3.4" rx="1.5" ry="1.8" fill="#3e8bff"/><ellipse cx="6" cy="2.6" rx="1.6" ry="1.9" fill="#ffd21f"/><path d="M4.4 8.4h3.2l-.4 2.2H4.8Z" fill="#c98a4b"/><path d="M4.4 8.4h3.2" stroke="#8d5a2b" stroke-width=".4" stroke-linecap="round"/><text x="6" y="7.9" font-size="1.6" text-anchor="middle" font-family="sans-serif" font-weight="800" fill="#1d1b18">A_C</text></svg>';

const CORES = ['#ff5c8a', '#ffb020', '#3e8bff', '#2fbf71', '#a35cff', '#ff7a3d', '#17b8c9', '#e04ed1'];
const recentes = [];

// Os balões voam alternando as pontas do leque, para a cesta continuar equilibrada.
function ordemDeVoo(n) {
  const o = [];
  for (let a = 0, b = n - 1; a <= b; a++, b--) { o.push(a); if (b !== a) o.push(b); }
  return o;
}

// Posições dos balões num leque acima da cesta.
function posicoes(n) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? 0 : -58 + (116 * i) / (n - 1);
    const r = 70 + (i % 2 ? -12 : 4);
    const rad = (a * Math.PI) / 180;
    lista.push([100 + r * Math.sin(rad) * 1.05, 112 - r * Math.cos(rad)]);
  }
  return lista;
}

function cena(n) {
  const baloes = posicoes(n).map(([x, y], i) => `
    <g class="fc-balao" data-i="${i}" style="--atraso:${(i * 0.37) % 1.6}s; transform-origin:100px 112px">
      <path d="M100 112 Q${(100 + x) / 2 + (i % 2 ? 6 : -6)} ${(112 + y) / 2} ${x} ${y + 17}" fill="none" stroke="#8a7a68" stroke-width="1"/>
      <ellipse cx="${x}" cy="${y}" rx="13" ry="16" fill="${CORES[i % CORES.length]}"/>
      <ellipse cx="${x - 4.5}" cy="${y - 6}" rx="3.2" ry="5" fill="#fff" opacity=".45" transform="rotate(-20 ${x - 4.5} ${y - 6})"/>
      <path d="M${x - 2.6} ${y + 18.5} L${x} ${y + 15.5} L${x + 2.6} ${y + 18.5}Z" fill="${CORES[i % CORES.length]}"/>
    </g>`).join('');
  return `<svg viewBox="0 0 200 170" class="fc-svg" role="img" aria-label="Cesta de balões">
    <defs>
      <linearGradient id="fc-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient>
      <linearGradient id="fc-cesta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a463"/><stop offset="1" stop-color="#a86a35"/></linearGradient>
    </defs>
    <rect width="200" height="170" fill="url(#fc-ceu)"/>
    <g fill="#fff" opacity=".85"><ellipse cx="34" cy="30" rx="16" ry="7"/><ellipse cx="46" cy="26" rx="11" ry="8"/><ellipse cx="166" cy="48" rx="15" ry="6"/><ellipse cx="156" cy="44" rx="9" ry="7"/></g>
    <path d="M0 150 Q50 136 100 148 T200 144 V170 H0Z" fill="#7cc96b"/>
    <path d="M0 158 Q60 148 120 160 T200 156 V170 H0Z" fill="#5bb15a"/>
    <g class="fc-flores"><circle cx="24" cy="156" r="2.4" fill="#ff7aa8"/><circle cx="170" cy="153" r="2.4" fill="#ffd21f"/><circle cx="140" cy="162" r="2" fill="#fff"/></g>
    <g class="fc-voo"><g transform="translate(100 138) scale(1.15) translate(-100 -134)">
      ${baloes}
      <g class="fc-cesta">
        <g class="fc-coelho">
          <ellipse cx="92" cy="96" rx="3.6" ry="10" fill="#fff" stroke="#e2d6cf" stroke-width=".8" transform="rotate(-12 92 96)"/>
          <ellipse cx="108" cy="96" rx="3.6" ry="10" fill="#fff" stroke="#e2d6cf" stroke-width=".8" transform="rotate(12 108 96)"/>
          <ellipse cx="92" cy="97" rx="1.6" ry="6" fill="#ffc1d4" transform="rotate(-12 92 97)"/>
          <ellipse cx="108" cy="97" rx="1.6" ry="6" fill="#ffc1d4" transform="rotate(12 108 97)"/>
          <circle cx="100" cy="112" r="10.5" fill="#fff" stroke="#e2d6cf" stroke-width=".8"/>
          <circle cx="96" cy="110" r="1.5" fill="#2b2420"/><circle cx="104" cy="110" r="1.5" fill="#2b2420"/>
          <circle cx="93.5" cy="114" r="1.8" fill="#ffb3c8" opacity=".8"/><circle cx="106.5" cy="114" r="1.8" fill="#ffb3c8" opacity=".8"/>
          <path class="fc-boca" d="M97.5 114.5 Q100 117 102.5 114.5" fill="none" stroke="#2b2420" stroke-width=".9" stroke-linecap="round"/>
          <path class="fc-triste" d="M97.5 116.6 Q100 114.2 102.5 116.6" fill="none" stroke="#2b2420" stroke-width=".9" stroke-linecap="round"/>
          <path class="fc-triste" d="M95.6 112.2 q-.9 1.8 0 2.4 q.9 -.6 0 -2.4Z" fill="#6cc4ff"/>
        </g>
        <path d="M84 116 H116 L112 134 H88Z" fill="url(#fc-cesta)"/>
        <path d="M86 122 H114 M87 128 H113" stroke="#8d5a2b" stroke-width=".8" opacity=".6"/>
        <path d="M92 116 L91 134 M100 116 V134 M108 116 L109 134" stroke="#8d5a2b" stroke-width=".7" opacity=".5"/>
        <rect x="82" y="113.5" width="36" height="4.5" rx="2.2" fill="#8d5a2b"/>
      </g>
    </g></g>
    <g class="fc-confete">${Array.from({ length: 14 }, (_, k) => `<rect x="${12 + k * 13}" y="-8" width="3.4" height="6" rx="1" fill="${CORES[k % CORES.length]}" style="--atraso:${(k * 0.13) % 0.9}s"/>`).join('')}</g>
  </svg>`;
}

export function montar(area, ctl) {
  const topo = el('div', 'fc-topo');
  const tema = el('div', 'fc-tema');
  const info = el('div', 'fc-info');
  const bFig = el('button', 'fc-botao', '🔎<span>Figurinha</span>');
  topo.append(tema, info, bFig);
  const palco = el('div', 'fc-palco');
  const palavra = el('div', 'fc-palavra');
  const teclado = el('div', 'fc-teclado');
  area.append(topo, palco, palavra, teclado);

  let jogo; let fim = false; let inicio = 0; let teclas = new Map();

  const tempoAgora = () => jogo.tempo + (fim || !inicio ? 0 : (Date.now() - inicio) / 1000);
  const salvar = () => ctl.salvar({ ...jogo, tempo: tempoAgora() });

  function desenharTema() {
    const fig = jogo.figurinha || jogo.viuFigurinha;
    tema.innerHTML = `<span class="fc-tema-fig">${jogo.temaEmoji}</span><span>${jogo.temaNome}</span>${fig ? `<span class="fc-fig" title="Figurinha da palavra">${jogo.emoji}</span>` : ''}`;
    bFig.hidden = fig || fim;
  }
  function desenharInfo() {
    const resta = jogo.maxErros - fc.erros(jogo);
    info.innerHTML = `🎈 <b>${resta}</b>`;
    info.setAttribute('aria-label', `${resta} balões`);
  }
  function desenharPalavra(revelar = false) {
    const m = fc.mascara(jogo, revelar);
    const reais = [...jogo.palavra.toUpperCase()];
    palavra.style.setProperty('--qtd', reais.length);
    palavra.replaceChildren(...reais.map((ch, i) => {
      const vista = fc.mascara(jogo)[i];
      const d = el('span', `fc-casa${m[i] ? ' aberta' : ''}${revelar && !vista ? ' faltou' : ''}`, m[i] ?? '');
      return d;
    }));
    palavra.setAttribute('aria-label', m.map((x) => x ?? 'vazio').join(' '));
  }
  function desenharTeclado() {
    teclado.replaceChildren();
    teclas = new Map();
    for (const l of fc.LETRAS) {
      const b = el('button', 'fc-tecla', l);
      if (jogo.tentadas.includes(l)) { b.classList.add(jogo.alvo.includes(l) ? 'certa' : 'errada'); b.disabled = true; }
      b.onclick = () => chutar(l);
      teclas.set(l, b);
      teclado.append(b);
    }
  }
  function desenharCena() {
    palco.innerHTML = cena(jogo.maxErros);
    const e = fc.erros(jogo);
    const ordem = ordemDeVoo(jogo.maxErros);
    for (let k = 0; k < e; k++) palco.querySelector(`.fc-balao[data-i="${ordem[k]}"]`)?.classList.add('foi');
    baixar();
  }
  // Com menos balões, a cesta flutua um pouco mais baixo.
  function baixar() {
    const voo = palco.querySelector('.fc-voo');
    if (voo) voo.style.setProperty('--desce', `${(fc.erros(jogo) / jogo.maxErros) * 10}px`);
  }

  function chutar(letra) {
    if (fim || !jogo) return;
    if (!inicio) inicio = Date.now();
    const r = fc.chutar(jogo, letra);
    if (r === 'invalida') return;
    const b = teclas.get(fc.LETRAS.includes(letra) ? letra : letra.toUpperCase());
    if (r === 'repetida') { ctl.som('clique'); b?.classList.remove('treme'); void b?.offsetWidth; b?.classList.add('treme'); ctl.status('Essa letra você já tentou', ''); return; }
    if (b) { b.classList.add(r === 'acerto' ? 'certa' : 'errada'); b.disabled = true; }
    if (r === 'acerto') {
      ctl.som('acerto');
      desenharPalavra();
      const qtd = [...jogo.alvo].filter((x) => x === letra).length;
      palavra.querySelectorAll('.fc-casa').forEach((d, i) => { if (semAcento(jogo.palavra[i]) === letra) d.classList.add('nova'); });
      if (fc.venceu(jogo)) { vencer(); return; }
      ctl.status(qtd > 1 ? `Isso! Tem ${qtd} letras ${letra}` : `Isso! Tem ${letra}`, 'voce');
    } else {
      ctl.som('erro');
      const e = fc.erros(jogo);
      const g = palco.querySelector(`.fc-balao[data-i="${ordemDeVoo(jogo.maxErros)[e - 1]}"]`);
      g?.classList.add('voa');
      baixar();
      if (fc.perdeu(jogo)) { perder(); return; }
      const resta = jogo.maxErros - e;
      ctl.status(`Não tem ${letra}. ${resta === 1 ? 'Só mais 1 balão!' : `Restam ${resta} balões`}`, '');
    }
    desenharInfo();
    salvar();
  }

  function encerrar() {
    jogo.tempo = Math.round(tempoAgora());
    fim = true;
    desenharInfo();
    desenharTema();
    for (const b of teclas.values()) b.disabled = true;
  }
  function vencer() {
    encerrar();
    recentes.push(jogo.palavra);
    palco.classList.add('venceu');
    ctl.fim('vitoria', `Você descobriu: ${jogo.palavra.toUpperCase()} ${jogo.emoji} 🎉`, null, { n: jogo.nivel, tempo: jogo.tempo, erros: fc.erros(jogo) });
  }
  function perder() {
    encerrar();
    recentes.push(jogo.palavra);
    desenharPalavra(true);
    palco.classList.add('perdeu');
    ctl.fim('derrota', `A palavra era ${jogo.palavra.toUpperCase()} ${jogo.emoji}`, null, { n: jogo.nivel, tempo: jogo.tempo });
  }

  bFig.onclick = () => {
    if (fim) return;
    jogo.viuFigurinha = true;
    ctl.som('item');
    desenharTema(); salvar();
    ctl.status(`A figurinha da palavra é ${jogo.emoji}`, 'voce');
  };

  const aoTeclar = (ev) => {
    if (!document.body.contains(teclado)) { document.removeEventListener('keydown', aoTeclar); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.key.length !== 1) return;
    const l = semAcento(ev.key);
    if (/^[A-Z]$/.test(l)) { ev.preventDefault(); chutar(l); }
  };
  document.addEventListener('keydown', aoTeclar);

  function iniciar(salvo) {
    fim = false; inicio = 0;
    palco.classList.remove('venceu', 'perdeu');
    jogo = salvo?.alvo ? salvo : fc.novoJogo(ctl.nivel(), Math.random, recentes.slice(-30));
    desenharTema(); desenharInfo(); desenharPalavra(); desenharTeclado(); desenharCena();
    if (salvo?.alvo) ctl.status('Partida retomada', 'voce');
    else ctl.status(`Dica: ${artigo(jogo.temaNome)} ${jogo.temaEmoji}`, 'voce');
    if (!salvo) salvar();
  }

  iniciar(ctl.salvo());
  return { reiniciar: () => iniciar(null) };
}

const ARTIGOS = { Frutas: 'uma fruta', Animais: 'um animal', Cores: 'uma cor', Brinquedos: 'um brinquedo', Escola: 'uma coisa da escola', Comidas: 'uma comida', Natureza: 'uma coisa da natureza', 'Profissões': 'uma profissão', 'Corpo humano': 'uma parte do corpo', Transportes: 'um transporte', 'Coisas da casa': 'uma coisa da casa', Roupas: 'uma roupa ou acessório', 'Fundo do mar': 'uma coisa do fundo do mar' };
const artigo = (nome) => ARTIGOS[nome] ?? `do tema ${nome}`;

