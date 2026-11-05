// Peças visuais sem dependências: ícones, anel de progresso, perfil do treino e cálculos das telas.
import { somarDias } from './motor.js';

const ICONES = {
  hoje: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  plano: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  evolucao: '<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
  revisao: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  aviso: '<path d="M12 4 3 20h18Z"/><path d="M12 10v4M12 17v.01"/>',
  dados: '<rect x="6" y="10" width="12" height="10" rx="2.5"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  instalar: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  seta: '<path d="M9 6l6 6-6 6"/>',
};

export const icone = (nome) =>
  `<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome]}</svg>`;

export const MARCA = `
  <svg class="marca-sol" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="15" r="8" fill="#f2b134"/>
    <path d="M2 21h28v3a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6Z" fill="#e4572e"/>
    <path d="M13.5 21h5l3 9h-11Z" fill="#14171f"/>
  </svg>`;

const RAIO_DO_ANEL = 30;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO_DO_ANEL;

export function anelDeProgresso(fracao, descricao) {
  const limitada = Math.min(Math.max(fracao, 0), 1);
  const resto = (CIRCUNFERENCIA * (1 - limitada)).toFixed(1);
  return `
    <svg class="anel" viewBox="0 0 72 72" role="img" aria-label="${descricao}" style="--circunferencia:${CIRCUNFERENCIA.toFixed(1)}">
      <circle class="anel-fundo" cx="36" cy="36" r="${RAIO_DO_ANEL}"/>
      ${limitada > 0 ? `<circle class="anel-valor" cx="36" cy="36" r="${RAIO_DO_ANEL}" stroke-dasharray="${CIRCUNFERENCIA.toFixed(1)}" stroke-dashoffset="${resto}" transform="rotate(-90 36 36)"/>` : ''}
      <text class="anel-texto" x="36" y="41" text-anchor="middle">${Math.round(limitada * 100)}%</text>
    </svg>`;
}

// Abre as repetições na ordem em que serão corridas, com a fração do tempo de cada passo.
export function trechosDoTreino(detalhe) {
  const trechos = detalhe.blocos.flatMap((bloco) =>
    Array.from({ length: bloco.repeticoes }, () => bloco.passos.map((p) => ({ zona: p.zona, seg: p.tempoSeg }))).flat());
  const total = trechos.reduce((t, p) => t + p.seg, 0);
  return trechos.map((p) => ({ zona: p.zona, fracao: total ? p.seg / total : 0 }));
}

const ALTURA_DA_ZONA = { recuperacao: 0.28, leve: 0.45, maratona: 0.62, limiar: 0.8, intervalado: 1 };
const LARGURA_DO_PERFIL = 320;
const ALTURA_DO_PERFIL = 64;
const VAO_DO_PERFIL = 2;

export function perfilDoTreino(detalhe) {
  const trechos = trechosDoTreino(detalhe);
  if (!trechos.length) return '';
  const util = LARGURA_DO_PERFIL - VAO_DO_PERFIL * (trechos.length - 1);
  // A altura acompanha o trecho mais forte: um treino leve fica baixo, sem vazio acima da barra.
  const teto = Math.max(...trechos.map((t) => ALTURA_DA_ZONA[t.zona])) * ALTURA_DO_PERFIL;
  let x = 0;
  const barras = trechos.map((t) => {
    const largura = Math.max(t.fracao * util, 1);
    const altura = ALTURA_DA_ZONA[t.zona] * ALTURA_DO_PERFIL;
    const barra = `<rect class="p-${t.zona}" x="${x.toFixed(1)}" y="${(teto - altura).toFixed(1)}" width="${largura.toFixed(1)}" height="${altura.toFixed(1)}" rx="2.5"/>`;
    x += largura + VAO_DO_PERFIL;
    return barra;
  }).join('');
  return `<svg class="perfil" style="height:${teto.toFixed(0)}px" viewBox="0 0 ${LARGURA_DO_PERFIL} ${teto.toFixed(1)}" preserveAspectRatio="none" role="img" aria-label="Intensidade ao longo do treino: quanto mais alta a barra, mais forte o trecho">${barras}</svg>`;
}

export function diasDaSemana({ segunda, sessoes, atividades, hoje }) {
  return Array.from({ length: 7 }, (_, i) => {
    const data = somarDias(segunda, i);
    const sessao = sessoes.find((s) => s.data === data) ?? null;
    const km = atividades.filter((a) => a.data === data).reduce((t, a) => t + a.km, 0);
    let situacao = 'descanso';
    if (km > 0) situacao = 'feito';
    else if (sessao) situacao = data < hoje ? 'perdido' : 'planejado';
    return { data, sessao, km, situacao, ehHoje: data === hoje };
  });
}

export function fasesDoPlano(sessoes) {
  const fases = [];
  const vistas = new Set();
  for (const s of sessoes) {
    if (vistas.has(s.semana)) continue;
    vistas.add(s.semana);
    const ultima = fases[fases.length - 1];
    if (ultima?.fase === s.fase) ultima.semanas.push(s.semana);
    else fases.push({ fase: s.fase, semanas: [s.semana] });
  }
  return fases;
}

export const diasAte = (de, ate) => Math.round((new Date(`${ate}T12:00:00Z`) - new Date(`${de}T12:00:00Z`)) / 86400000);
