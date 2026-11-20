// Tela do jogo de pintar: galeria de desenhos e a folha com canetinhas, pincéis e balde.
import { el } from '../comum.js';
import { salvar as salvarNoAparelho, lerSalvo, prefs } from '../dados.js';
import { DESENHOS, NIVEIS_DESENHO, urlDoDesenho } from '../pintar-desenhos.js';
import { FERRAMENTAS, TIPOS_COR, TAMANHOS, CORES, CORES_NEON, CORES_METAL, TIPO_DA_FERRAMENTA, CONTINUAS, corNoTraco, regiao, rgb, misturar, terminados } from '../pintar.js';

const N = 1000; // resolução da folha
const DESFAZER = 10;
const chave = (id) => `pintar-${id}`;

export const desenhosTerminados = () => terminados(prefs.historico);

function carregarImagem(src) {
  return new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = src; });
}

function caminhoEstrela(ctx, x, y, r, giro) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = giro - Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function caminhoCoracao(ctx, x, y, r, giro) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(giro); ctx.scale(r / 30, r / 30);
  ctx.beginPath(); ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-30, -8, -22, -32, -8, -30); ctx.bezierCurveTo(-3, -29, 0, -25, 0, -21);
  ctx.bezierCurveTo(0, -25, 3, -29, 8, -30); ctx.bezierCurveTo(22, -32, 30, -8, 0, 12);
  ctx.closePath(); ctx.restore();
}
function brilhinho(ctx, x, y, r) {
  // estrelinha de 4 pontas da purpurina
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

export function montar(area, ctl) {
  let desenho = null;
  let ferramenta = 'canetinha'; let tipo = 'normal'; let cor = CORES[0]; let tamanho = 'm';
  let paredes = null; let pilha = []; let guardarDepois = null;

  const opacidade = { pincel: 0.85, marcatexto: 0.42, lapis: 0.9, giz: 0.95 };

  // ---------- galeria ----------
  let aba = 'facil';
  function galeria() {
    gravarAgora();
    desenho = null;
    area.replaceChildren();
    ctl.status('Escolha um desenho para pintar', 'voce');
    const feitos = new Set(prefs.historico.filter((h) => h.j === 'pintar' && h.r === 'concluida').map((h) => h.desenho));
    const abas = el('div', 'pintar-abas');
    abas.setAttribute('role', 'tablist');
    for (const [id, nome] of [...NIVEIS_DESENHO, ['todos', 'Todos']]) {
      const lista = DESENHOS.filter((d) => id === 'todos' || d.nivel === id);
      const b = el('button', '', `${nome} <small>${lista.length}</small>`);
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(aba === id));
      b.onclick = () => { aba = id; ctl.som('clique'); galeria(); };
      abas.append(b);
    }
    const grade = el('div', 'pintar-galeria');
    const lista = DESENHOS.filter((d) => aba === 'todos' || d.nivel === aba || (d.nivel === 'livre' && aba === 'facil'));
    for (const d of lista) {
      const salvo = lerSalvo(chave(d.id));
      const b = el('button', 'pintar-cartao');
      const fundo = salvo?.img ? `<img class="tinta" src="${salvo.img}" alt="">` : '';
      b.innerHTML = `<span class="miniatura">${fundo}<img class="linhas" loading="lazy" src="${urlDoDesenho(d, 200)}" alt=""></span><strong>${d.icone} ${d.nome}</strong>${feitos.has(d.id) ? '<span class="selo">pronto ✓</span>' : salvo?.img ? '<span class="selo">pintando</span>' : ''}`;
      b.onclick = () => { ctl.som('clique'); abrir(d); };
      grade.append(b);
    }
    area.append(abas, grade);
  }

  // ---------- folha ----------
  let folha; let papel; let tinta; let traco; let linhas; let ctxT; let ctxR; let rotuloTam; let lupa;
  let zoom = 1; let tx = 0; let ty = 0; let mover = false;

  async function abrir(d) {
    gravarAgora();
    desenho = d;
    ctl.salvar({ desenho: d.id });
    area.replaceChildren();
    ctl.status(`Pintando: ${d.nome}`, 'voce');

    folha = el('div', 'pintar-folha');
    papel = el('div', 'pintar-papel');
    folha.append(papel);
    tinta = el('canvas'); traco = el('canvas', 'traco'); linhas = el('canvas', 'linhas');
    for (const c of [tinta, traco, linhas]) { c.width = N; c.height = N; papel.append(c); }
    zoom = 1; tx = 0; ty = 0; mover = false;
    lupa = el('div', 'pintar-lupa');
    const bLupa = (rotulo, titulo, acao) => { const b = el('button', '', rotulo); b.title = titulo; b.setAttribute('aria-label', titulo); b.onclick = (e) => { e.stopPropagation(); acao(); }; b.addEventListener('pointerdown', (e) => e.stopPropagation()); lupa.append(b); return b; };
    bLupa('➕', 'Aumentar (lupa)', () => ampliar(1.6));
    bLupa('➖', 'Diminuir', () => ampliar(1 / 1.6));
    bLupa('✋', 'Arrastar o desenho', () => { mover = !mover; ctl.som('clique'); aplicarZoom(); }).dataset.mover = '';
    folha.append(lupa);
    aplicarZoom();
    ctxT = tinta.getContext('2d', { willReadFrequently: true });
    ctxR = traco.getContext('2d');
    ctxT.fillStyle = '#fff'; ctxT.fillRect(0, 0, N, N);

    const barra = el('div', 'pintar-acoes');
    const botao = (rotulo, titulo, acao) => { const b = el('button', 'pintar-acao', rotulo); b.title = titulo; b.setAttribute('aria-label', titulo); b.onclick = acao; barra.append(b); return b; };
    botao('↩️', 'Desfazer', desfazer);
    botao('🗑️', 'Apagar tudo', limpar);
    botao('💾', 'Salvar imagem', exportar);
    botao('✅ Pronto!', 'Terminei o desenho', pronto).classList.add('pronto');

    const ferr = el('div', 'pintar-ferramentas');
    ferr.setAttribute('role', 'group'); ferr.setAttribute('aria-label', 'Ferramentas');
    for (const f of FERRAMENTAS) {
      const b = el('button', '', `<b>${f.icone}</b><span>${f.nome}</span>`);
      b.dataset.ferramenta = f.id;
      b.onclick = () => { ferramenta = f.id; ctl.som('clique'); marcar(); };
      ferr.append(b);
    }

    const tipos = el('div', 'pintar-tipos');
    for (const t of TIPOS_COR) {
      const b = el('button', '', `${t.icone} ${t.nome}`);
      b.dataset.tipo = t.id;
      b.onclick = () => { tipo = t.id; ctl.som('clique'); marcar(); };
      tipos.append(b);
    }

    const tams = el('div', 'pintar-tamanhos');
    for (const t of TAMANHOS) {
      const b = el('button', '', `<i style="width:${Math.max(6, t.px / 2)}px;height:${Math.max(6, t.px / 2)}px"></i>`);
      b.dataset.tamanho = t.id; b.title = t.nome; b.setAttribute('aria-label', t.nome);
      b.onclick = () => { tamanho = t.id; ctl.som('clique'); marcar(); };
      tams.append(b);
    }
    rotuloTam = el('span', 'pintar-rotulo');
    const linhaTam = el('div', 'pintar-linha'); linhaTam.append(tams, rotuloTam);

    const cores = el('div', 'pintar-cores');
    const botaoCor = (c, classe = '') => {
      const b = el('button', classe);
      b.dataset.cor = c; b.style.setProperty('--c', c); b.setAttribute('aria-label', `Cor ${c}`);
      b.onclick = () => { cor = c; ctl.som('clique'); if (ferramenta === 'borracha') ferramenta = 'canetinha'; marcar(); };
      cores.append(b);
    };
    CORES.forEach((c) => botaoCor(c));
    cores.append(el('span', 'pintar-sub', '🌟 Neon'));
    CORES_NEON.forEach((c) => botaoCor(c, 'neon'));
    cores.append(el('span', 'pintar-sub', '✨ Metálicas'));
    CORES_METAL.forEach((c) => botaoCor(c, 'metal'));

    const ajuda = el('p', 'pintar-ajuda', '☝️ Um dedo pinta · ✌️ Dois dedos aumentam, diminuem e arrastam, sem pintar');
    area.append(folha, ajuda, barra, ferr, cores, tipos, linhaTam);
    marcar();
    ligarToque();

    // linhas do desenho e tinta guardada
    const img = await carregarImagem(urlDoDesenho(d, N));
    if (desenho !== d) return;
    const ctxL = linhas.getContext('2d', { willReadFrequently: true });
    ctxL.drawImage(img, 0, 0, N, N);
    const px = ctxL.getImageData(0, 0, N, N).data;
    paredes = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) paredes[i] = (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3 < 150 ? 1 : 0;
    const salvo = lerSalvo(chave(d.id));
    if (salvo?.img) {
      try { ctxT.drawImage(await carregarImagem(salvo.img), 0, 0, N, N); } catch { /* imagem estragada: começa em branco */ }
    }
    pilha = [];
  }

  function marcar() {
    area.querySelectorAll('[data-ferramenta]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ferramenta === ferramenta)));
    area.querySelectorAll('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo)));
    area.querySelectorAll('[data-tamanho]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tamanho === tamanho)));
    area.querySelectorAll('[data-cor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cor === cor && ferramenta !== 'borracha')));
    const f = FERRAMENTAS.find((x) => x.id === ferramenta);
    if (rotuloTam) rotuloTam.textContent = ferramenta === 'balde' ? `${f.icone} Toque numa parte do desenho para pintar` : `${f.icone} ${f.nome} · ${TAMANHOS.find((t) => t.id === tamanho).nome.toLowerCase()}`;
    if (folha) folha.dataset.ferramenta = ferramenta;
  }

  // ---------- pintura ----------
  const largura = () => {
    const base = TAMANHOS.find((t) => t.id === tamanho).px;
    return { lapis: base * 0.45, marcatexto: base * 1.4, spray: base * 1.6, estrelinhas: base * 0.9 + 8, coracoes: base * 0.9 + 8 }[ferramenta] ?? base;
  };

  function guardarPasso() {
    pilha.push(ctxT.getImageData(0, 0, N, N));
    if (pilha.length > DESFAZER) pilha.shift();
  }

  let pendente = false;
  function gravarAgora() {
    clearTimeout(guardarDepois);
    if (!pendente || !desenho) return;
    pendente = false;
    salvarNoAparelho(chave(desenho.id), { img: tinta.toDataURL('image/jpeg', 0.82) });
    ctl.salvar({ desenho: desenho.id });
  }
  function guardar() {
    pendente = true;
    clearTimeout(guardarDepois);
    guardarDepois = setTimeout(gravarAgora, 400);
  }
  // fechar o app, trocar de aba ou sair da tela não perde a última pincelada
  const aoEsconder = () => { if (document.visibilityState === 'hidden') gravarAgora(); };
  document.addEventListener('visibilitychange', aoEsconder);
  window.addEventListener('pagehide', gravarAgora);

  let ultimo = null; let andado = 0; let marcaAte = 0;

  // ---------- lupa: aumentar, diminuir e arrastar o desenho ----------
  function limitar() {
    const w = folha.clientWidth;
    tx = Math.min(0, Math.max(w - w * zoom, tx));
    ty = Math.min(0, Math.max(w - w * zoom, ty));
  }
  function aplicarZoom() {
    if (zoom <= 1.01) { zoom = 1; tx = 0; ty = 0; mover = false; }
    limitar();
    papel.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    folha.classList.toggle('ampliada', zoom > 1);
    folha.classList.toggle('movendo', mover);
    lupa.querySelector('[data-mover]').setAttribute('aria-pressed', String(mover));
  }
  function ampliar(fator, cx = folha.clientWidth / 2, cy = folha.clientWidth / 2) {
    const novo = Math.min(5, Math.max(1, zoom * fator));
    const px = (cx - tx) / zoom; const py = (cy - ty) / zoom;
    zoom = novo; tx = cx - px * zoom; ty = cy - py * zoom;
    ctl.som('clique');
    aplicarZoom();
  }

  function pontoDe(e) {
    const r = papel.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * N, y: ((e.clientY - r.top) / r.height) * N };
  }

  const tp = () => TIPO_DA_FERRAMENTA[ferramenta] ?? tipo;

  function carimbo(x, y) {
    const w = largura();
    const c = ferramenta === 'borracha' ? '#ffffff' : corNoTraco(cor, tp(), andado);
    const ctx = ctxR;
    ctx.fillStyle = c; ctx.strokeStyle = c;
    if (tp() === 'neon' && ferramenta !== 'borracha') { ctx.shadowColor = cor; ctx.shadowBlur = w * 0.9; } else ctx.shadowBlur = 0;
    switch (ferramenta) {
      case 'pincel': {
        const g = ctx.createRadialGradient(x, y, 0, x, y, w / 2);
        const [r, gg, b] = rgb(c.startsWith('#') ? c : '#000000');
        if (c.startsWith('#')) { g.addColorStop(0, `rgba(${r},${gg},${b},.55)`); g.addColorStop(0.7, `rgba(${r},${gg},${b},.35)`); g.addColorStop(1, `rgba(${r},${gg},${b},0)`); ctx.fillStyle = g; }
        else ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(x, y, w / 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        break;
      }
      case 'giz': {
        for (let k = 0; k < w * 1.6; k++) {
          const a = Math.random() * Math.PI * 2; const d = Math.sqrt(Math.random()) * w / 2;
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.5 + Math.random() * 2.5, 1.5 + Math.random() * 2.5);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'lapis': {
        for (let k = 0; k < w * 2; k++) {
          const a = Math.random() * Math.PI * 2; const d = Math.random() * w / 2;
          ctx.globalAlpha = 0.35 + Math.random() * 0.5;
          ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.6, 1.6);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'spray': {
        for (let k = 0; k < w * 0.8; k++) {
          const a = Math.random() * Math.PI * 2; const d = Math.random() * Math.random() * w / 2 + Math.random() * w / 4;
          ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + Math.random() * 1.4, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case 'estrelinhas':
      case 'coracoes': {
        if (andado < marcaAte) break;
        marcaAte = andado + w * 1.3;
        const r = w * (0.4 + Math.random() * 0.25);
        if (ferramenta === 'estrelinhas') caminhoEstrela(ctx, x, y, r, Math.random() * 1.2); else caminhoCoracao(ctx, x, y, r, Math.random() * 0.8 - 0.4);
        ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 0.7; ctx.lineWidth = 2; ctx.strokeStyle = misturar(c.startsWith('#') ? c : '#888888', '#000000', 0.25); ctx.stroke(); ctx.globalAlpha = 1;
        break;
      }
      default: break; // canetinha, marca-texto e borracha são traços contínuos (em linha)
    }
    const glitter = ferramenta === 'caneta-glitter';
    if (tp() === 'brilho' && ferramenta !== 'borracha' && (glitter || Math.random() < 0.55)) {
      ctx.shadowBlur = 0;
      const n = Math.max(glitter ? 4 : 1, Math.round(w / (glitter ? 2.5 : 10)));
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2; const d = Math.random() * w * 0.55;
        const sorte = Math.random();
        ctx.fillStyle = sorte < 0.4 ? '#ffffff' : sorte < 0.7 ? misturar(cor, '#ffffff', 0.6) : sorte < 0.85 ? misturar(cor, '#000000', 0.3) : '#ffe27a';
        if (Math.random() < (glitter ? 0.3 : 0.25)) brilhinho(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 3 + Math.random() * w * (glitter ? 0.3 : 0.18));
        else { ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + Math.random() * (glitter ? 2.6 : 2), 0, Math.PI * 2); ctx.fill(); }
      }
    }
  }

  function linhaContinua(a, b) {
    const ctx = ctxR;
    const c = ferramenta === 'borracha' ? '#ffffff' : corNoTraco(cor, tp(), andado);
    const w = largura();
    const segmento = (cor_, larg) => { ctx.strokeStyle = cor_; ctx.lineWidth = larg; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
    ctx.lineCap = ferramenta === 'marcatexto' ? 'square' : 'round'; ctx.lineJoin = 'round';
    if (tp() === 'neon' && ferramenta !== 'borracha') {
      // o brilho vai por baixo do que já foi riscado, para não apagar o miolo claro
      const forte = ferramenta === 'caneta-neon';
      const brilho = tp() === 'arcoiris' ? c : cor;
      ctx.globalCompositeOperation = 'destination-over';
      ctx.shadowColor = brilho; ctx.shadowBlur = w * (forte ? 1.8 : 1);
      segmento(c, w * (forte ? 1.1 : 1));
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      segmento(c, w * 0.8);
      segmento(misturar(cor, '#ffffff', forte ? 0.85 : 0.7), w * (forte ? 0.38 : 0.3));
      return;
    }
    ctx.shadowBlur = 0;
    segmento(c, w);
  }

  const continuo = () => CONTINUAS.includes(ferramenta);

  function seguir(p) {
    const passo = Math.max(1.5, largura() * (ferramenta === 'spray' || ferramenta === 'giz' || ferramenta === 'lapis' ? 0.3 : 0.18));
    const dx = p.x - ultimo.x; const dy = p.y - ultimo.y;
    const dist = Math.hypot(dx, dy);
    if (continuo()) {
      if (dist < 0.5) return;
      // em pedaços, para o arco-íris e o degradê mudarem de cor ao longo do traço
      const partes = tp() === 'normal' || tp() === 'brilho' ? 1 : Math.ceil(dist / 6);
      let a = ultimo;
      for (let k = 1; k <= partes; k++) {
        const b = { x: ultimo.x + (dx * k) / partes, y: ultimo.y + (dy * k) / partes };
        andado += dist / partes;
        linhaContinua(a, b);
        if (tp() === 'brilho') carimbo(b.x, b.y);
        a = b;
      }
      ultimo = p;
      return;
    }
    if (dist < passo) return;
    const n = Math.floor(dist / passo);
    for (let k = 1; k <= n; k++) {
      andado += passo;
      carimbo(ultimo.x + (dx * k * passo) / dist, ultimo.y + (dy * k * passo) / dist);
    }
    ultimo = { x: ultimo.x + (dx * n * passo) / dist, y: ultimo.y + (dy * n * passo) / dist };
  }

  function terminarTraco() {
    if (!ultimo) return;
    ultimo = null;
    ctxT.globalAlpha = ferramenta === 'borracha' ? 1 : (opacidade[ferramenta] ?? 1);
    ctxT.drawImage(traco, 0, 0);
    ctxT.globalAlpha = 1;
    ctxR.clearRect(0, 0, N, N);
    traco.style.opacity = '';
    guardar();
  }

  function balde(p) {
    if (!paredes) return;
    const r = regiao(paredes, N, N, p.x, p.y);
    if (!r) { ctl.som('erro'); return; }
    guardarPasso();
    const img = ctxT.getImageData(0, 0, N, N); const dados = img.data;
    const base = rgb(cor);
    const alto = r.y2 - r.y1 + 1; const larg = r.x2 - r.x1 + 1;
    for (let y = r.y1; y <= r.y2; y++) {
      for (let x = r.x1; x <= r.x2; x++) {
        const i = y * N + x;
        if (!r.mascara[i]) continue;
        let c = base;
        if (tipo === 'arcoiris') c = hsl(((x - r.x1) / larg) * 300, 0.85, 0.58);
        else if (tipo === 'degrade') { const t = (y - r.y1) / alto; c = base.map((v) => v + (255 - v) * t * 0.75); }
        else if (tipo === 'neon') c = base.map((v) => v + (255 - v) * 0.25);
        else if (tipo === 'brilho' && Math.random() < 0.03) c = base.map((v) => v + (255 - v) * (0.5 + Math.random() * 0.5));
        dados[i * 4] = c[0]; dados[i * 4 + 1] = c[1]; dados[i * 4 + 2] = c[2]; dados[i * 4 + 3] = 255;
      }
    }
    ctxT.putImageData(img, 0, 0);
    if (tipo === 'brilho') {
      // estrelinhas de purpurina espalhadas pela região
      ctxT.fillStyle = '#ffffff';
      const quantas = Math.min(120, Math.round(r.total / 1800));
      for (let k = 0, tentativas = 0; k < quantas && tentativas < quantas * 30; tentativas++) {
        const x = r.x1 + Math.floor(Math.random() * larg); const y = r.y1 + Math.floor(Math.random() * alto);
        if (!r.mascara[y * N + x]) continue;
        brilhinho(ctxT, x, y, 3 + Math.random() * 6); k++;
      }
    }
    ctl.som('mover');
    guardar();
  }

  function hsl(h, s, l) {
    const f = (n) => { const k = (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    return [f(0), f(8), f(4)];
  }

  // Toque com um dedo pinta; com dois dedos só aumenta, diminui e arrasta. Para o segundo
  // dedo não deixar risco nem pingo de tinta, o traço espera um instante (ou o dedo andar
  // um pouco) antes de começar, e o balde só pinta quando o dedo sai da tela.
  const ESPERA_MS = 110; const ANDAR_PX = 7;
  let dedo = null;
  const dedos = new Map(); let pinca = null; let arrasto = null;
  let espera = null; // primeiro dedo, ainda sem saber se vem outro
  let gesto = false; // houve dois dedos: nada pinta até todos saírem da tela
  const local = (e) => { const r = folha.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function cancelarTraco() {
    if (!ultimo) return;
    ultimo = null; dedo = null;
    ctxR.clearRect(0, 0, N, N);
    traco.style.opacity = '';
    pilha.pop(); // o passo guardado no começo do traço não vale mais
  }
  function comecarPinca() {
    const [a, b] = [...dedos.values()];
    pinca = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, zoom, tx, ty };
  }
  function comecarTraco() {
    if (!espera) return;
    const { id, pontos } = espera;
    clearTimeout(espera.relogio);
    espera = null;
    dedo = id;
    guardarPasso();
    ctxR.clearRect(0, 0, N, N);
    traco.style.opacity = ferramenta === 'borracha' ? '1' : String(opacidade[ferramenta] ?? 1);
    const p = pontos[0];
    ultimo = p; andado = 0; marcaAte = 0;
    if (continuo()) linhaContinua(p, { x: p.x + 0.01, y: p.y });
    carimbo(p.x, p.y);
    for (const q of pontos.slice(1)) seguir(q); // o caminho feito durante a espera
  }
  function ligarToque() {
    folha.addEventListener('pointerdown', (e) => {
      if (!paredes) return;
      e.preventDefault();
      dedos.set(e.pointerId, local(e));
      folha.setPointerCapture(e.pointerId);
      if (dedos.size >= 2) {
        // segundo dedo: vira lupa, e o que o primeiro começou é desfeito
        gesto = true;
        if (espera) { clearTimeout(espera.relogio); espera = null; }
        cancelarTraco(); arrasto = null;
        if (dedos.size === 2) comecarPinca();
        return;
      }
      if (gesto) return;
      if (mover && zoom > 1) { arrasto = { ...local(e), tx, ty }; return; }
      const inicio = local(e);
      espera = { id: e.pointerId, inicio, pontos: [pontoDe(e)], relogio: null };
      if (ferramenta !== 'balde') espera.relogio = setTimeout(comecarTraco, ESPERA_MS);
    });
    folha.addEventListener('pointermove', (e) => {
      if (dedos.has(e.pointerId)) dedos.set(e.pointerId, local(e));
      if (pinca && dedos.size >= 2) {
        const [a, b] = [...dedos.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y); const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        zoom = Math.min(5, Math.max(1, pinca.zoom * (d / pinca.d)));
        const px = (pinca.m.x - pinca.tx) / pinca.zoom; const py = (pinca.m.y - pinca.ty) / pinca.zoom;
        tx = m.x - px * zoom; ty = m.y - py * zoom;
        aplicarZoom();
        return;
      }
      if (arrasto) {
        const p = local(e);
        tx = arrasto.tx + (p.x - arrasto.x); ty = arrasto.ty + (p.y - arrasto.y);
        aplicarZoom();
        return;
      }
      const eventos = e.getCoalescedEvents?.() ?? [e];
      const lista = eventos.length ? eventos : [e];
      if (espera && e.pointerId === espera.id) {
        for (const ev of lista) espera.pontos.push(pontoDe(ev));
        const q = local(e);
        if (ferramenta !== 'balde' && Math.hypot(q.x - espera.inicio.x, q.y - espera.inicio.y) > ANDAR_PX) comecarTraco();
        return;
      }
      if (e.pointerId !== dedo || !ultimo) return;
      for (const ev of lista) seguir(pontoDe(ev));
    });
    const soltar = (e) => {
      dedos.delete(e.pointerId);
      if (dedos.size < 2) pinca = null;
      if (!dedos.size) { arrasto = null; gesto = false; }
      if (espera && e.pointerId === espera.id) {
        // toque rápido de um dedo só: um pingo de tinta, ou o balde
        const p = espera.pontos[0];
        if (e.type === 'pointercancel') { clearTimeout(espera.relogio); espera = null; return; }
        if (ferramenta === 'balde') { clearTimeout(espera.relogio); espera = null; balde(p); return; }
        comecarTraco();
      }
      if (e.pointerId !== dedo) return;
      dedo = null; terminarTraco();
    };
    folha.addEventListener('pointerup', soltar);
    folha.addEventListener('pointercancel', soltar);
  }

  function desfazer() {
    const anterior = pilha.pop();
    if (!anterior) { ctl.som('erro'); ctl.status('Não tem mais nada para desfazer', ''); return; }
    ctxT.putImageData(anterior, 0, 0);
    ctl.som('clique');
    guardar();
  }

  function limpar() {
    if (!confirm('Apagar toda a pintura deste desenho?')) return;
    guardarPasso();
    ctxT.fillStyle = '#fff'; ctxT.fillRect(0, 0, N, N);
    ctl.som('clique');
    guardar();
  }

  function imagemFinal() {
    const c = el('canvas'); c.width = N; c.height = N;
    const ctx = c.getContext('2d');
    ctx.drawImage(tinta, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(linhas, 0, 0);
    return c;
  }

  async function exportar() {
    ctl.som('clique');
    const blob = await new Promise((ok) => imagemFinal().toBlob(ok, 'image/png'));
    const arquivo = new File([blob], `desenho-${desenho.id}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [arquivo] })) {
      try { await navigator.share({ files: [arquivo], title: desenho.nome }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(arquivo); a.download = arquivo.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    ctl.status('Imagem salva!', 'vitoria');
  }

  function pronto() {
    pendente = true;
    gravarAgora();
    ctl.fim('concluida', `Que lindo! ${desenho.nome} pronto 🎉`, folha, { desenho: desenho.id });
    ctl.som('premio');
    const faixa = folha.querySelector('.faixa-fim');
    if (faixa) faixa.innerHTML = '<div>Que lindo! 🎨✨</div>';
    setTimeout(() => folha?.querySelector('.faixa-fim')?.remove(), 2200);
  }

  const salvo = ctl.salvo();
  const inicial = salvo?.desenho && DESENHOS.find((d) => d.id === salvo.desenho);
  if (inicial) abrir(inicial); else galeria();

  return { reiniciar: () => { ctl.apagar(); galeria(); } };
}

