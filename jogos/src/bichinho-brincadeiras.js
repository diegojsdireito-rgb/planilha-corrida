// Meu Bichinho: regras das brincadeiras (lógica pura, sem DOM). A tela cuida do desenho e do
// tempo; aqui ficam o sorteio, a pontuação e o que conta como acerto. `rand` é uma função
// como Math.random (nos testes, uma sequência fixa).

const sortearInt = (rand, n) => Math.min(n - 1, Math.floor(rand() * n));

// ---------- 🫧 Bolhas de sabão ----------
// O bichinho sopra bolhas que sobem balançando; tocar estoura. As douradas valem mais.
export const BOLHAS = { duracao: 30, chanceDourada: 0.14, pontos: 1, pontosDourada: 3 };

// Nova bolha: x é a fração da largura de onde sai (perto da boca), vx a deriva para o lado,
// sobe a velocidade de subida (px/s) e tam o diâmetro (px). Fica mais rápida com o tempo.
export function novaBolha(rand, segundos = 0) {
  const dourada = rand() < BOLHAS.chanceDourada;
  return {
    dourada,
    x: 0.5 + (rand() - 0.5) * 0.08,
    vx: (rand() - 0.5) * 90,
    sobe: 48 + rand() * 30 + segundos * 1.4 + (dourada ? 18 : 0),
    tam: dourada ? 46 + rand() * 10 : 44 + rand() * 26,
    fase: rand() * Math.PI * 2,
  };
}

// Tempo até a próxima bolha (ms): começa calmo e vai acelerando.
export const intervaloBolha = (segundos) => Math.max(420, 900 - segundos * 16);

export const pontosBolha = (bolha) => (bolha.dourada ? BOLHAS.pontosDourada : BOLHAS.pontos);

// ---------- 🙈 Esconde-esconde ----------
export const ESCONDE = { rodadas: 4, tentativas: 3, pontos: [3, 2, 1] };

// Os esconderijos do quarto. Alguns brinquedos comprados viram esconderijo no lugar de outro.
export const ESCONDERIJOS = [
  { id: 'cortina', nome: 'a cortina' },
  { id: 'almofada', nome: 'o almofadão' },
  { id: 'cesto', nome: 'o cesto' },
  { id: 'caixa', nome: 'a caixa de brinquedos', troca: 'casinha' },
  { id: 'vaso', nome: 'o vaso', troca: 'ursinho' },
  { id: 'poltrona', nome: 'a poltrona' },
];
const NOMES_BRINQUEDO = { casinha: 'a casinha de papelão', ursinho: 'o ursão de pelúcia' };

export function esconderijos(brinquedos = []) {
  return ESCONDERIJOS.map((e) => (e.troca && brinquedos.includes(e.troca) ? { id: e.troca, nome: NOMES_BRINQUEDO[e.troca], lugarDe: e.id } : { id: e.id, nome: e.nome, lugarDe: e.id }));
}

// Começa uma rodada: o bichinho se esconde num lugar diferente do da rodada anterior.
export function novaRodada(rand, lugares, anterior = null) {
  const opcoes = lugares.filter((l) => l.id !== anterior);
  return { lugar: opcoes[sortearInt(rand, opcoes.length)].id, tentativas: 0, erradas: [], achou: false, acabou: false, pontos: 0 };
}

// Procura atrás de um esconderijo. Devolve a rodada nova e o que aconteceu:
// 'achou', 'errou', 'repetido' (já olhou ali) ou 'fim' (acabaram as tentativas).
export function procurar(rodada, lugar) {
  if (rodada.acabou) return { rodada, resultado: 'repetido' };
  if (rodada.erradas.includes(lugar)) return { rodada, resultado: 'repetido' };
  const tentativas = rodada.tentativas + 1;
  if (lugar === rodada.lugar) {
    const pontos = ESCONDE.pontos[tentativas - 1] ?? 0;
    return { rodada: { ...rodada, tentativas, achou: true, acabou: true, pontos }, resultado: 'achou' };
  }
  const erradas = [...rodada.erradas, lugar];
  const acabou = tentativas >= ESCONDE.tentativas;
  return { rodada: { ...rodada, tentativas, erradas, acabou }, resultado: acabou ? 'fim' : 'errou' };
}

// ---------- 💃 Dança ----------
// As setinhas descem no ritmo; tocar a faixa certa quando a setinha chega na linha.
export const DANCA = { bpm: 108, notas: 36, inicio: 2200, perfeito: 110, bom: 230, pontosPerfeito: 2, pontosBom: 1 };
export const FAIXAS = ['esquerda', 'cima', 'baixo', 'direita'];

// Gera a coreografia: notas em batidas (às vezes meia batida), nunca três seguidas na mesma faixa.
export function gerarDanca(rand, { bpm = DANCA.bpm, notas = DANCA.notas, inicio = DANCA.inicio } = {}) {
  const batida = 60000 / bpm;
  const lista = [];
  let t = inicio;
  for (let k = 0; k < notas; k++) {
    let faixa = sortearInt(rand, 4);
    const n = lista.length;
    if (n >= 2 && lista[n - 1].faixa === faixa && lista[n - 2].faixa === faixa) faixa = (faixa + 1 + sortearInt(rand, 3)) % 4;
    lista.push({ t: Math.round(t), faixa, julgada: null });
    // a partir do meio, de vez em quando vem meia batida (mais emoção); às vezes uma pausa
    const r = rand();
    t += k > notas / 2 && r < 0.22 ? batida / 2 : r > 0.86 ? batida * 2 : batida;
  }
  return lista;
}

export const duracaoDanca = (notas) => (notas.length ? notas[notas.length - 1].t + 1200 : 0);

// Toque na faixa no instante t (ms desde o começo). Julga a nota mais próxima ainda não julgada.
export function julgarToque(notas, faixa, t) {
  let melhor = -1;
  let dist = Infinity;
  notas.forEach((n, i) => {
    if (n.julgada || n.faixa !== faixa) return;
    const d = Math.abs(n.t - t);
    if (d < dist) { dist = d; melhor = i; }
  });
  if (melhor < 0 || dist > DANCA.bom) return { notas, tipo: null, pontos: 0 };
  const tipo = dist <= DANCA.perfeito ? 'perfeito' : 'bom';
  const novas = notas.map((n, i) => (i === melhor ? { ...n, julgada: tipo } : n));
  return { notas: novas, tipo, indice: melhor, pontos: tipo === 'perfeito' ? DANCA.pontosPerfeito : DANCA.pontosBom };
}

// Notas que já passaram da linha sem toque viram 'perdeu'.
export function marcarPerdidas(notas, t) {
  let perdidas = 0;
  const novas = notas.map((n) => {
    if (n.julgada || t - n.t <= DANCA.bom) return n;
    perdidas++;
    return { ...n, julgada: 'perdeu' };
  });
  return { notas: novas, perdidas };
}

// ---------- 🦴 Pega o petisco ----------
export const PETISCO = { duracao: 30, alcance: 0.13 };
export const COISAS_QUE_CAEM = [
  { id: 'osso', icone: '🦴', comida: true, pontos: 1 },
  { id: 'biscoito', icone: '🍪', comida: true, pontos: 1 },
  { id: 'morango', icone: '🍓', comida: true, pontos: 1 },
  { id: 'cenoura', icone: '🥕', comida: true, pontos: 1 },
  { id: 'peixe', icone: '🐟', comida: true, pontos: 1 },
  { id: 'cupcake', icone: '🧁', comida: true, pontos: 3, raro: true },
  { id: 'meia', icone: '🧦', comida: false, pontos: -1 },
  { id: 'sapato', icone: '👟', comida: false, pontos: -1 },
  { id: 'pedra', icone: '🪨', comida: false, pontos: -1 },
];

// Coisa nova caindo: x é a fração da largura, cai a velocidade (px/s). Com o tempo, cai mais rápido
// e vem um pouco mais de coisa que não é comida.
export function novoPetisco(rand, segundos = 0) {
  const ruim = rand() < 0.22 + Math.min(0.12, segundos * 0.004);
  const grupo = COISAS_QUE_CAEM.filter((c) => (ruim ? !c.comida : c.comida && (!c.raro || rand() < 0.5)));
  const coisa = grupo[sortearInt(rand, grupo.length)];
  return { ...coisa, x: 0.08 + rand() * 0.84, cai: 120 + rand() * 50 + segundos * 4, gira: (rand() - 0.5) * 240 };
}

export const intervaloPetisco = (segundos) => Math.max(480, 1000 - segundos * 15);

// O bichinho (centro em petX, fração da largura) pega o que cai em x se estiver perto.
export const alcancou = (petX, x, alcance = PETISCO.alcance) => Math.abs(petX - x) <= alcance;

// Soma os pontos sem deixar ficar negativo.
export const somarPetisco = (pontos, coisa) => Math.max(0, pontos + coisa.pontos);

// ---------- 🧩 Siga o bichinho ----------
export const SIGA = { inicio: 2, maximo: 9, cores: 4 };

export function crescer(seq, rand) {
  return [...seq, sortearInt(rand, SIGA.cores)];
}

export function novaSequencia(rand, n = SIGA.inicio) {
  let s = [];
  for (let k = 0; k < n; k++) s = crescer(s, rand);
  return s;
}

// Confere o que a criança já tocou: 'certo' (até aqui), 'completo' ou 'errado'.
export function conferir(seq, entrada) {
  for (let i = 0; i < entrada.length; i++) if (entrada[i] !== seq[i]) return 'errado';
  return entrada.length === seq.length ? 'completo' : 'certo';
}

// Pontos do Siga: o tamanho da maior sequência que acertou inteira.
export const pontosSiga = (seq, ultimoResultado) => (ultimoResultado === 'completo' ? seq.length : Math.max(0, seq.length - 1));
