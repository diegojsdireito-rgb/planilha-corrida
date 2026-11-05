// Decide o que mandar ao calendário do intervals.icu. O app não roda em segundo plano
// no iPhone, então esta conta é feita sempre que ele é aberto.

import { segundaDaSemana, somarDias } from './motor.js';

export const DIAS_DE_ANTECEDENCIA = 3;

const dataDoId = (id) => id.slice(3);

// assinaturas: { id da sessão: conteúdo enviado }. Serve para notar o que a revisão mudou.
export function calcularEnvioAutomatico({ sessoes, assinaturas, assinar, hoje }) {
  const futuras = sessoes.filter((s) => s.data >= hoje);
  const idsFuturos = new Set(futuras.map((s) => s.id));
  const jaEnviada = (s) => s.id in assinaturas;
  const mudou = (s) => jaEnviada(s) && assinaturas[s.id] !== assinar(s);

  const remover = Object.keys(assinaturas).filter((id) => dataDoId(id) >= hoje && !idsFuturos.has(id));
  const enviar = futuras.filter(mudou);

  const primeira = futuras.find((s) => !jaEnviada(s));
  if (primeira && primeira.data <= somarDias(hoje, DIAS_DE_ANTECEDENCIA)) {
    const semana = segundaDaSemana(primeira.data);
    enviar.push(...futuras.filter((s) => !jaEnviada(s) && segundaDaSemana(s.data) === semana));
  }

  return { enviar: enviar.sort((a, b) => a.data.localeCompare(b.data)), remover };
}

// A próxima data em que o app enviará sozinho, para mostrar na tela.
export function proximoEnvio({ sessoes, assinaturas, hoje }) {
  const primeira = sessoes.find((s) => s.data >= hoje && !(s.id in assinaturas));
  if (!primeira) return null;
  const data = somarDias(primeira.data, -DIAS_DE_ANTECEDENCIA);
  return data > hoje ? data : hoje;
}
