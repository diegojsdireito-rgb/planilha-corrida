// Todos os dados ficam no aparelho. A exportação existe porque o sistema pode limpar o armazenamento.

const CHAVE = 'planilha-corrida:v1';

export const estadoInicial = () => ({
  avisoCiente: false,
  chaveApi: '',
  nome: '',
  nascimento: null,
  perfil: null,
  objetivo: null,
  provas: [],
  tempoInformado: null,
  plano: null,
  atividades: [],
  outrasDoRelogio: [],
  avulsas: [],
  semDados: 0,
  corridasSemDados: [],
  avaliacoes: {},
  analises: {},
  revisoes: [],
  historicoNivel: [],
  enviados: [],
  assinaturas: {},
  envioAutomatico: true,
  erroEnvioAutomatico: null,
  ultimaSincronizacao: null,
  ultimoEnvio: null,
});

export function carregar() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? { ...estadoInicial(), ...JSON.parse(salvo) } : estadoInicial();
  } catch {
    return estadoInicial();
  }
}

export function salvar(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

// A cópia de segurança não leva a chave de API.
export function exportar(estado) {
  const { chaveApi, ...semChave } = estado;
  return JSON.stringify(semChave, null, 2);
}

export function importar(texto, estadoAtual) {
  const dados = JSON.parse(texto);
  if (typeof dados !== 'object' || dados === null || !('plano' in dados)) {
    throw new Error('Este arquivo não é uma cópia de segurança da planilha.');
  }
  return { ...estadoInicial(), ...dados, chaveApi: estadoAtual.chaveApi };
}
