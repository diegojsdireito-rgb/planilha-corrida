import * as cor from '../corrida.js';
import { el } from '../comum.js';
import { prefs, guardar } from '../dados.js';
import { retrato, desenharDeCostas, PELES, ROUPAS } from '../personagem.js';

const C = 5; // distância da câmera: controla a perspectiva

export function recorde() {
  let r = 0;
  for (const h of prefs.historico) if (h.j === 'corrida' && h.pontos > r) r = h.pontos;
  return r;
}

export function montar(area, ctl) {
  const palco = el('div', 'corrida');
  const tela = el('canvas');
  tela.setAttribute('role', 'img');
  tela.setAttribute('aria-label', 'Corrida: deslize para os lados para trocar de faixa, para cima para pular e para baixo para deslizar');
  const hud = el('div', 'corrida-hud');
  const pausaEl = el('button', 'botao-icone pausa', 'Ⅱ');
  pausaEl.setAttribute('aria-label', 'Pausar');
  const camada = el('div', 'corrida-camada');
  palco.append(tela, hud, pausaEl, camada);
  const controles = el('div', 'corrida-controles', `
    <button data-acao="esquerda" aria-label="Esquerda">◀</button>
    <button data-acao="pular" aria-label="Pular">▲</button>
    <button data-acao="deslizar" aria-label="Deslizar">▼</button>
    <button data-acao="direita" aria-label="Direita">▶</button>`);
  area.append(palco, controles);

  const ctx = tela.getContext('2d');
  let s = null; let rodando = false; let pausado = false; let quadro = 0; let anterior = 0; let W = 0; let H = 0; let dpr = 1;
  let ativa = ctl.ativa();

  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = palco.getBoundingClientRect();
    W = r.width; H = r.height;
    tela.width = Math.round(W * dpr);
    tela.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!rodando) desenhar(0);
  }
  const observador = new ResizeObserver(medir);
  observador.observe(palco);

  // ---------- Projeção ----------
  const horizonte = () => H * 0.34;
  const chao = () => H * 0.86;
  const p = (z) => C / (Math.max(z, -C * 0.6) + C);
  const Y = (z) => horizonte() + (chao() - horizonte()) * p(z);
  const faixaL = () => Math.min(W * 0.27, H * 0.2);
  const X = (f, z) => W / 2 + (f - 1) * faixaL() * p(z);
  const U = (z) => faixaL() * 1.12 * p(z);

  function desenharCenario(dist) {
    const hy = horizonte();
    const ceu = ctx.createLinearGradient(0, 0, 0, hy);
    ceu.addColorStop(0, '#7cc4ff');
    ceu.addColorStop(1, '#ffe2c4');
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, W, hy + 2);
    // nuvens e morros ao fundo, andando devagar
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let k = 0; k < 4; k++) {
      const x = ((k * 0.31 * W - dist * 0.6) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15;
      const y = hy * (0.2 + (k % 2) * 0.2);
      for (const [dx, dy, r] of [[0, 0, 16], [18, -6, 20], [38, 0, 15]]) {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, r * (W / 400), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = '#8fd18b';
    ctx.beginPath();
    ctx.moveTo(0, hy);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, hy - 18 - Math.sin((x + dist * 0.3) / 60) * 10 - Math.sin(x / 23) * 4);
    ctx.lineTo(W, hy);
    ctx.fill();
    // grama dos lados
    ctx.fillStyle = '#6cc070';
    ctx.fillRect(0, hy, W, H - hy);
    // rua em faixas que passam, para dar sensação de velocidade
    const borda = 1.62;
    for (let z = cor.LONGE; z > -C * 0.5; z -= 2) {
      const z2 = z - 2;
      const k = Math.floor((z + dist) / 2);
      ctx.fillStyle = k % 2 ? '#e7d7c3' : '#efe2d1';
      ctx.beginPath();
      ctx.moveTo(X(1 - borda, z), Y(z));
      ctx.lineTo(X(1 + borda, z), Y(z));
      ctx.lineTo(X(1 + borda, z2), Y(z2));
      ctx.lineTo(X(1 - borda, z2), Y(z2));
      ctx.fill();
      // calçada colorida nas bordas
      ctx.fillStyle = k % 2 ? '#ff8fa3' : '#fff';
      for (const lado of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(X(1 + lado * borda, z), Y(z));
        ctx.lineTo(X(1 + lado * (borda + 0.14), z), Y(z));
        ctx.lineTo(X(1 + lado * (borda + 0.14), z2), Y(z2));
        ctx.lineTo(X(1 + lado * borda, z2), Y(z2));
        ctx.fill();
      }
      // divisórias das faixas
      if (k % 2) {
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (const f of [0.5, 1.5]) {
          ctx.beginPath();
          ctx.moveTo(X(f - 0.025, z), Y(z));
          ctx.lineTo(X(f + 0.025, z), Y(z));
          ctx.lineTo(X(f + 0.025, z2), Y(z2));
          ctx.lineTo(X(f - 0.025, z2), Y(z2));
          ctx.fill();
        }
      }
    }
  }

  // Árvores e postes ao lado da rua.
  function enfeites(dist) {
    const lista = [];
    const passo = 7;
    const ini = Math.ceil(dist / passo) * passo;
    for (let d = ini; d < dist + cor.LONGE; d += passo) {
      const z = d - dist;
      const k = Math.round(d / passo);
      lista.push({ z, f: k % 2 ? -1.15 : 3.15, tipo: k % 3 === 0 ? 'poste' : 'arvore' });
      lista.push({ z: z + passo / 2, f: k % 2 ? 3.15 : -1.15, tipo: k % 4 === 0 ? 'flor' : 'arvore' });
    }
    return lista;
  }

  function desenharEnfeite(o) {
    const x = X(o.f, o.z); const y = Y(o.z); const u = U(o.z);
    if (o.tipo === 'arvore') {
      ctx.fillStyle = '#8a5a3c';
      ctx.fillRect(x - u * 0.06, y - u * 0.9, u * 0.12, u * 0.9);
      ctx.fillStyle = '#3fa05a';
      for (const [dx, dy, r] of [[0, -1.2, 0.42], [-0.25, -0.95, 0.3], [0.25, -0.95, 0.3]]) {
        ctx.beginPath(); ctx.arc(x + dx * u, y + dy * u, r * u, 0, Math.PI * 2); ctx.fill();
      }
    } else if (o.tipo === 'poste') {
      ctx.fillStyle = '#5b5f6b';
      ctx.fillRect(x - u * 0.03, y - u * 1.7, u * 0.06, u * 1.7);
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath(); ctx.arc(x, y - u * 1.72, u * 0.1, 0, Math.PI * 2); ctx.fill();
    } else {
      for (const [dx, c] of [[-0.15, '#ff6f91'], [0.05, '#ffd21f'], [0.2, '#7b6cf6']]) {
        ctx.fillStyle = '#3fa05a'; ctx.fillRect(x + dx * u - 1, y - u * 0.3, 2, u * 0.3);
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * u, y - u * 0.32, u * 0.07, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function estrela(x, y, r, giro) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(Math.max(0.25, Math.abs(Math.cos(giro))), 1);
    ctx.fillStyle = '#ffd21f';
    ctx.strokeStyle = '#e09a00';
    ctx.lineWidth = Math.max(1, r * 0.15);
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? r * 0.45 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function desenharObjeto(o, t) {
    const z = o.z;
    if (z > cor.LONGE) return;
    const x = X(o.faixa, z); const y = Y(z); const u = U(z); const lf = faixaL() * p(z);
    if (o.tipo === 'estrela') return estrela(x, y - (o.h ?? 0.5) * u, u * 0.22, t * 4 + o.z * 0.3);
    if (o.tipo === 'ima') {
      ctx.save(); ctx.translate(x, y - o.h * u); ctx.lineWidth = u * 0.12; ctx.strokeStyle = '#e5484d';
      ctx.beginPath(); ctx.arc(0, 0, u * 0.18, Math.PI, 0, true); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(-u * 0.18, 0); ctx.lineTo(-u * 0.18, -u * 0.1); ctx.moveTo(u * 0.18, 0); ctx.lineTo(u * 0.18, -u * 0.1); ctx.stroke();
      ctx.restore(); return;
    }
    if (o.tipo === 'escudo') {
      ctx.fillStyle = 'rgba(80,170,255,.35)'; ctx.strokeStyle = '#3e8bff'; ctx.lineWidth = u * 0.04;
      ctx.beginPath(); ctx.arc(x, y - o.h * u, u * 0.24, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); return;
    }
    if (o.tipo === 'cerca') {
      const w = lf * 0.86; const h = u * 0.5;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - w / 2, y - h, w * 0.08, h); ctx.fillRect(x + w / 2 - w * 0.08, y - h, w * 0.08, h);
      for (const [yy, c] of [[0.85, '#e5484d'], [0.45, '#e5484d']]) {
        ctx.fillStyle = c; ctx.fillRect(x - w / 2, y - h * yy, w, h * 0.22);
        ctx.fillStyle = '#fff';
        for (let k = 0; k < 4; k++) ctx.fillRect(x - w / 2 + (k * 2 + 1) * w / 8, y - h * yy, w / 8, h * 0.22);
      }
      return;
    }
    if (o.tipo === 'faixa') {
      const w = lf * 0.9;
      ctx.fillStyle = '#6b5f8a';
      ctx.fillRect(x - w / 2, y - u * 1.45, w * 0.05, u * 1.45); ctx.fillRect(x + w / 2 - w * 0.05, y - u * 1.45, w * 0.05, u * 1.45);
      ctx.fillStyle = '#7b6cf6'; ctx.fillRect(x - w / 2, y - u * 1.42, w, u * 0.32);
      const cores = ['#ffd21f', '#ff6f91', '#3fb6a8'];
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = cores[k % 3];
        const x0 = x - w / 2 + (k * w) / 6;
        ctx.beginPath(); ctx.moveTo(x0, y - u * 1.1); ctx.lineTo(x0 + w / 6, y - u * 1.1); ctx.lineTo(x0 + w / 12, y - u * 0.9); ctx.fill();
      }
      return;
    }
    // carrinho de sorvete: topo em perspectiva e frente
    const z2 = z + o.comp;
    const w1 = lf * 0.86; const w2 = faixaL() * p(z2) * 0.86;
    const x2 = X(o.faixa, z2); const y2 = Y(z2);
    const h1 = u * 1.25; const h2 = U(z2) * 1.25;
    ctx.fillStyle = '#d9e8ff';
    ctx.beginPath();
    ctx.moveTo(x - w1 / 2, y - h1); ctx.lineTo(x + w1 / 2, y - h1); ctx.lineTo(x2 + w2 / 2, y2 - h2); ctx.lineTo(x2 - w2 / 2, y2 - h2);
    ctx.fill();
    ctx.fillStyle = '#b9d2f5';
    const lado = o.faixa < 1 ? 1 : -1;
    if (o.faixa !== 1) {
      ctx.beginPath();
      ctx.moveTo(x + lado * w1 / 2, y - h1); ctx.lineTo(x2 + lado * w2 / 2, y2 - h2); ctx.lineTo(x2 + lado * w2 / 2, y2); ctx.lineTo(x + lado * w1 / 2, y);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - w1 / 2, y - h1, w1, h1 * 0.92);
    ctx.fillStyle = '#ff6f91';
    for (let k = 0; k < 5; k++) if (k % 2 === 0) ctx.fillRect(x - w1 / 2 + (k * w1) / 5, y - h1, w1 / 5, h1 * 0.22);
    ctx.fillStyle = '#3e8bff'; ctx.font = `${Math.round(h1 * 0.34)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('🍦', x, y - h1 * 0.3);
    ctx.fillStyle = '#333';
    for (const dx of [-0.32, 0.32]) { ctx.beginPath(); ctx.arc(x + dx * w1, y - h1 * 0.05, h1 * 0.1, 0, Math.PI * 2); ctx.fill(); }
  }

  function desenhar(t) {
    if (!W) return;
    const dist = s?.dist ?? 0;
    ctx.clearRect(0, 0, W, H);
    desenharCenario(dist);
    const objs = s ? s.objetos.filter((o) => !o.pego) : [];
    const longe = [...enfeites(dist).map((o) => ({ ...o, enfeite: true })), ...objs].sort((a, b) => b.z - a.z);
    const perto = longe.filter((o) => o.z <= -0.3);
    for (const o of longe) { if (o.z > -0.3) (o.enfeite ? desenharEnfeite(o) : desenharObjeto(o, t)); }
    // personagem
    const x = X(s?.x ?? 1, 0); const y = Y(0); const u = U(0);
    if (s?.escudo || s?.ima) {
      ctx.fillStyle = s.escudo ? 'rgba(80,170,255,.25)' : 'rgba(255,90,90,.18)';
      ctx.beginPath(); ctx.ellipse(x, y - (s.y + 0.65) * u, u * 0.55, u * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    }
    desenharDeCostas(ctx, x, y, u, {
      fase: (s?.dist ?? t * 3) * 1.6,
      pulo: s?.y ?? 0,
      deslizando: s?.deslizando ?? 0,
      ...prefs.personagem,
      piscando: (s?.invencivel ?? 0) > 0 && Math.floor(t * 12) % 2 === 0,
    });
    for (const o of perto) (o.enfeite ? desenharEnfeite(o) : desenharObjeto(o, t));
  }

  function desenharHud() {
    if (!s) { hud.innerHTML = ''; return; }
    const poderes = [s.ima > 0 ? `<span class="poder">🧲 ${Math.ceil(s.ima)}s</span>` : '', s.escudo ? '<span class="poder">🫧 escudo</span>' : ''].join('');
    hud.innerHTML = `<span class="pts">${cor.pontos(s).toLocaleString('pt-BR')}</span><span class="est">★ ${s.estrelas}</span>${poderes}`;
  }

  const SOM = { pulo: 'passo', troca: 'clique', estrela: 'acerto', poder: 'vitoria', escudo: 'captura', desliza: 'carta', batida: 'erro' };

  function laco(agora) {
    if (!rodando || !ativa()) { rodando = false; return; }
    const dt = anterior ? (agora - anterior) / 1000 : 0;
    anterior = agora;
    if (!pausado) {
      cor.avancar(s, dt);
      for (const e of s.eventos) if (SOM[e]) ctl.som(SOM[e]);
      s.eventos.length = 0;
      if (++quadro % 6 === 0) desenharHud();
    }
    desenhar(agora / 1000);
    if (!s.vivo) { rodando = false; desenharHud(); return fimDeJogo(); }
    requestAnimationFrame(laco);
  }

  function comecar() {
    ctl.som('clique');
    ativa = ctl.ativa();
    s = cor.nova(ctl.nivel());
    camada.innerHTML = '';
    camada.hidden = true;
    pausaEl.hidden = false;
    pausado = false;
    rodando = true;
    anterior = 0;
    ctl.status('◀ ▶ troca de faixa · ▲ pula · ▼ desliza', 'voce');
    requestAnimationFrame(laco);
  }

  function pausar(sim) {
    if (!rodando && sim) return;
    pausado = sim;
    pausaEl.textContent = sim ? '▶' : 'Ⅱ';
    pausaEl.setAttribute('aria-label', sim ? 'Continuar' : 'Pausar');
    camada.hidden = !sim;
    if (sim) {
      camada.innerHTML = '<div class="cartao-corrida"><strong>Pausado</strong></div>';
      const b = el('button', 'botao', 'Continuar');
      b.onclick = () => pausar(false);
      camada.firstChild.append(b);
    } else anterior = 0;
  }
  pausaEl.onclick = () => pausar(!pausado);
  document.addEventListener('visibilitychange', () => { if (document.hidden && rodando) pausar(true); });

  function telaInicial() {
    rodando = false;
    s = null;
    pausaEl.hidden = true;
    camada.hidden = false;
    const r = recorde();
    camada.innerHTML = `<div class="cartao-corrida inicio">
      <div class="retrato">${retrato(prefs.personagem)}</div>
      <strong>Corrida dos Cachinhos</strong>
      <small>${r ? `Recorde: ${r.toLocaleString('pt-BR')} pontos` : 'Desvie dos obstáculos e pegue as estrelas!'}</small>
      <div class="escolha"><span>Pele</span>${PELES.map((c, k) => `<button class="amostra${prefs.personagem.pele === k ? ' sel' : ''}" data-pele="${k}" style="background:${c}" aria-label="Tom de pele ${k + 1}"></button>`).join('')}</div>
      <div class="escolha"><span>Roupa</span>${ROUPAS.map((c, k) => `<button class="amostra${prefs.personagem.roupa === k ? ' sel' : ''}" data-roupa="${k}" style="background:${c}" aria-label="Cor da roupa ${k + 1}"></button>`).join('')}</div>
    </div>`;
    const b = el('button', 'botao grande', 'Correr!');
    b.onclick = comecar;
    camada.firstChild.append(b);
    camada.querySelectorAll('[data-pele],[data-roupa]').forEach((a) => {
      a.onclick = () => {
        if (a.dataset.pele) prefs.personagem.pele = Number(a.dataset.pele);
        if (a.dataset.roupa) prefs.personagem.roupa = Number(a.dataset.roupa);
        guardar();
        ctl.som('clique');
        telaInicial();
      };
    });
    desenharHud();
    desenhar(0);
    ctl.status('Escolha o visual e toque em Correr!', 'voce');
  }

  function fimDeJogo() {
    const total = cor.pontos(s);
    const antes = recorde();
    ctl.fim('concluida', `Fim da corrida: ${total.toLocaleString('pt-BR')} pontos`, null, { pontos: total, estrelas: s.estrelas, metros: Math.floor(s.dist) });
    const novo = total > antes;
    pausaEl.hidden = true;
    camada.hidden = false;
    camada.innerHTML = `<div class="cartao-corrida">
      <div class="retrato pequeno">${retrato({ ...prefs.personagem, sorriso: 'uau' })}</div>
      <strong>${novo ? 'Novo recorde! 🎉' : 'Opa, bateu!'}</strong>
      <span class="grande-num">${total.toLocaleString('pt-BR')}</span>
      <small>${Math.floor(s.dist)} m · ★ ${s.estrelas} estrelas${novo || !antes ? '' : ` · recorde ${antes.toLocaleString('pt-BR')}`}</small>
    </div>`;
    const b = el('button', 'botao grande', 'Correr de novo');
    b.onclick = comecar;
    const v = el('button', 'botao secundario', 'Trocar o visual');
    v.onclick = telaInicial;
    camada.firstChild.append(b, v);
  }

  // ---------- Controles ----------
  const agir = (acao) => { if (s && rodando && !pausado) cor.comando(s, acao); };
  let toque = null;
  palco.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    toque = { x: e.clientX, y: e.clientY, feito: false };
  });
  palco.addEventListener('pointermove', (e) => {
    if (!toque || toque.feito) return;
    const dx = e.clientX - toque.x; const dy = e.clientY - toque.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    toque.feito = true;
    agir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'direita' : 'esquerda') : (dy < 0 ? 'pular' : 'deslizar'));
  });
  palco.addEventListener('pointerup', () => {
    if (toque && !toque.feito && s && rodando && !pausado) agir('pular'); // toque simples também pula
    toque = null;
  });
  controles.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao]');
    if (b) agir(b.dataset.acao);
  });
  const teclas = (e) => {
    if (!palco.isConnected) { document.removeEventListener('keydown', teclas); observador.disconnect(); return; }
    const mapa = { ArrowLeft: 'esquerda', a: 'esquerda', ArrowRight: 'direita', d: 'direita', ArrowUp: 'pular', w: 'pular', ' ': 'pular', ArrowDown: 'deslizar', s: 'deslizar' };
    const acao = mapa[e.key];
    if (acao && rodando) { e.preventDefault(); agir(acao); }
    if (e.key === 'Escape' || e.key === 'p') pausar(!pausado);
  };
  document.addEventListener('keydown', teclas);

  telaInicial();
  return { reiniciar: telaInicial };
}
