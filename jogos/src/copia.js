// Cartão "Seus dados" da tela inicial: salvar e restaurar a cópia de segurança.
import { el } from './comum.js';
import { prefs, montarCopia, restaurarCopia, marcarCopia, ultimaCopia } from './dados.js';
import { tocar } from './som.js';

const DIA = 86400000;

async function salvarArquivo(conteudo, nome) {
  const arquivo = new File([conteudo], nome, { type: 'application/json' });
  // No app instalado do iPhone, o compartilhamento é o caminho confiável para salvar em Arquivos.
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo] });
      return true;
    } catch (erro) {
      if (erro.name === 'AbortError') return false;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  return true;
}

function quando(t) {
  if (!t) return 'Você ainda não salvou nenhuma cópia.';
  const dias = Math.floor((Date.now() - t) / DIA);
  return `Última cópia: ${dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`}.`;
}

export function montarCopiaCartao(raiz, jogos, aoRestaurar) {
  const ids = jogos.map((j) => j.id);
  const ultima = ultimaCopia();
  const atrasada = prefs.historico.length >= 5 && (!ultima || Date.now() - ultima > 14 * DIA);
  const cartao = el('section', `grafico dados-cartao${atrasada ? ' alerta' : ''}`);
  cartao.innerHTML = `
    <h3>Seus dados</h3>
    <p class="sub">Placar, histórico e partidas em andamento ficam só neste aparelho. No iPhone, apagar o ícone da tela de início apaga tudo junto. Salve uma cópia em Arquivos ou no iCloud Drive.</p>
    <p class="estado-copia">${atrasada ? '⚠️ ' : ''}${quando(ultima)}</p>`;
  const botoes = el('div', 'acoes-solo');
  const salvar = el('button', 'botao', '⬇︎ Salvar cópia');
  const restaurar = el('label', 'botao secundario', '⬆︎ Restaurar cópia<input type="file" accept="application/json,.json" hidden>');
  botoes.append(salvar, restaurar);
  const aviso = el('p', 'aviso-copia');
  aviso.setAttribute('role', 'status');
  cartao.append(botoes, aviso);

  salvar.onclick = async () => {
    tocar('clique');
    const d = new Date();
    const nome = `mesa-de-jogos-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    if (await salvarArquivo(JSON.stringify(montarCopia(ids)), nome)) {
      marcarCopia();
      cartao.classList.remove('alerta');
      cartao.querySelector('.estado-copia').textContent = quando(Date.now());
      aviso.textContent = 'Cópia criada. Guarde o arquivo em Arquivos ou no iCloud Drive.';
    }
  };

  restaurar.querySelector('input').onchange = async (e) => {
    const arquivo = e.target.files[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      const r = restaurarCopia(await arquivo.text(), ids);
      tocar('acerto');
      aviso.textContent = `Cópia restaurada: ${r.novos} partida${r.novos === 1 ? '' : 's'} no histórico${r.partidas ? ` e ${r.partidas} jogo${r.partidas === 1 ? '' : 's'} em andamento` : ''}.`;
      setTimeout(aoRestaurar, 1400);
    } catch (erro) {
      tocar('erro');
      aviso.textContent = erro.message;
    }
  };

  raiz.append(cartao);
}
