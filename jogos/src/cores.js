// Cartas Coloridas: lógica pura (sem DOM). Jogador 0 é a pessoa; os outros são robôs.
// Carta: { id, cor: 'vermelho' | 'amarelo' | 'verde' | 'azul' | 'coringa', v: 0..9 | 'mais2' | 'pula' | 'inverte' | 'coringa' | 'mais4' }.

export const CORES = ['vermelho', 'amarelo', 'verde', 'azul'];
export const ESPECIAIS = ['mais2', 'pula', 'inverte'];
export const MAO_INICIAL = 7;

export function baralho() {
  const cartas = [];
  let id = 0;
  for (const cor of CORES) {
    cartas.push({ id: id++, cor, v: 0 });
    for (let k = 0; k < 2; k++) {
      for (let v = 1; v <= 9; v++) cartas.push({ id: id++, cor, v });
      for (const v of ESPECIAIS) cartas.push({ id: id++, cor, v });
    }
  }
  for (let k = 0; k < 4; k++) {
    cartas.push({ id: id++, cor: 'coringa', v: 'coringa' });
    cartas.push({ id: id++, cor: 'coringa', v: 'mais4' });
  }
  return cartas;
}

export function embaralhar(lista, rnd = Math.random) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export const ehCoringa = (c) => c.cor === 'coringa';
export const topo = (e) => e.pilha[e.pilha.length - 1];

export function novoJogo(robos = 2, rnd = Math.random, quemComeca = 0) {
  const monte = embaralhar(baralho(), rnd);
  const n = robos + 1;
  const maos = Array.from({ length: n }, () => []);
  for (let k = 0; k < MAO_INICIAL; k++) for (const m of maos) m.push(monte.pop());
  // A primeira carta da mesa é sempre um número (as especiais voltam para o meio do monte).
  let primeira = monte.pop();
  while (typeof primeira.v !== 'number') {
    monte.splice(Math.floor(rnd() * monte.length), 0, primeira);
    primeira = monte.pop();
  }
  return {
    n, maos, monte, pilha: [primeira], cor: primeira.cor,
    vez: quemComeca % n, sentido: 1, ultima: Array(n).fill(false), comprou: null, vencedor: null,
  };
}

export const podeJogar = (carta, e) => ehCoringa(carta) || carta.cor === e.cor || carta.v === topo(e).v;
export const jogaveis = (e, j = e.vez) => e.maos[j].filter((c) => podeJogar(c, e));

export const proximo = (e, j = e.vez, passos = 1) => (((j + e.sentido * passos) % e.n) + e.n) % e.n;

// Tira uma carta do monte; se acabar, a pilha (menos a de cima) vira o monte de novo.
function puxar(e, rnd) {
  if (!e.monte.length) {
    const cima = e.pilha.pop();
    e.monte = embaralhar(e.pilha, rnd);
    e.pilha = [cima];
  }
  return e.monte.pop() ?? null;
}

export function darCartas(e, j, qtd, rnd = Math.random) {
  const novas = [];
  for (let k = 0; k < qtd; k++) {
    const c = puxar(e, rnd);
    if (!c) break;
    e.maos[j].push(c);
    novas.push(c);
  }
  if (e.maos[j].length > 1) e.ultima[j] = false;
  return novas;
}

// Quem não tem jogada compra uma carta. Se ela servir, pode jogar (só ela) ou passar.
export function comprar(e, rnd = Math.random) {
  if (e.vencedor !== null || e.comprou !== null) return null;
  const [c] = darCartas(e, e.vez, 1, rnd);
  if (!c) { passar(e, true); return null; }
  if (podeJogar(c, e)) e.comprou = c.id;
  else passar(e, true);
  return c;
}

export function passar(e, forcado = false) {
  if (!forcado && e.comprou === null) return false;
  e.comprou = null;
  e.vez = proximo(e);
  return true;
}

export function dizerUltima(e, j) {
  if (e.maos[j].length > 2) return false;
  e.ultima[j] = true;
  return true;
}

// Quem ficou com uma carta só e não disse "Última!" compra 2.
export function conferirUltima(e, j, rnd = Math.random) {
  if (e.maos[j].length !== 1 || e.ultima[j]) return false;
  darCartas(e, j, 2, rnd);
  return true;
}

// Joga a carta `id` do jogador da vez. `cor` é a cor escolhida no coringa.
// Devolve { ok, efeito, alvo } onde efeito diz o que aconteceu com o próximo jogador.
export function jogar(e, id, cor, rnd = Math.random) {
  if (e.vencedor !== null) return { ok: false };
  const j = e.vez;
  const mao = e.maos[j];
  const k = mao.findIndex((c) => c.id === id);
  if (k < 0) return { ok: false };
  const carta = mao[k];
  if (!podeJogar(carta, e)) return { ok: false };
  if (e.comprou !== null && e.comprou !== id) return { ok: false };
  if (ehCoringa(carta) && !CORES.includes(cor)) return { ok: false };
  mao.splice(k, 1);
  e.pilha.push(carta);
  e.comprou = null;
  e.cor = ehCoringa(carta) ? cor : carta.cor;
  if (!mao.length) { e.vencedor = j; return { ok: true, efeito: 'venceu', carta }; }
  let efeito = null; let alvo = null;
  if (carta.v === 'inverte') {
    if (e.n === 2) efeito = 'pula';
    else { e.sentido = -e.sentido; efeito = 'inverte'; }
  }
  if (carta.v === 'pula') efeito = 'pula';
  if (carta.v === 'mais2' || carta.v === 'mais4') {
    alvo = proximo(e);
    darCartas(e, alvo, carta.v === 'mais2' ? 2 : 4, rnd);
    efeito = carta.v;
  }
  if (efeito === 'pula' && alvo === null) alvo = proximo(e);
  e.vez = proximo(e, j, efeito === 'pula' || efeito === 'mais2' || efeito === 'mais4' ? 2 : 1);
  return { ok: true, efeito, alvo, carta };
}

const contarCores = (mao) => {
  const conta = Object.fromEntries(CORES.map((c) => [c, 0]));
  for (const c of mao) if (!ehCoringa(c)) conta[c.cor]++;
  return conta;
};

export function melhorCor(mao, rnd = Math.random) {
  const conta = contarCores(mao);
  const max = Math.max(...Object.values(conta));
  const opcoes = CORES.filter((c) => conta[c] === max);
  return opcoes[Math.floor(rnd() * opcoes.length)];
}

// Escolha do robô: { id, cor } ou null (sem jogada: compra).
export function escolhaRobo(e, nivel = 'medio', rnd = Math.random) {
  const j = e.vez;
  let opcoes = jogaveis(e, j);
  if (e.comprou !== null) opcoes = opcoes.filter((c) => c.id === e.comprou);
  if (!opcoes.length) return null;
  const mao = e.maos[j];
  if (nivel === 'facil') {
    const c = opcoes[Math.floor(rnd() * opcoes.length)];
    return { id: c.id, cor: ehCoringa(c) ? CORES[Math.floor(rnd() * 4)] : undefined };
  }
  const conta = contarCores(mao);
  const prox = proximo(e, j);
  const perigo = e.maos[prox].length <= 2;
  const ataque = (c) => c.v === 'mais2' || c.v === 'mais4' || c.v === 'pula' || (c.v === 'inverte' && e.n === 2);
  let melhor = null; let nota = -Infinity;
  for (const c of opcoes) {
    let p = 0;
    if (ehCoringa(c)) p -= nivel === 'dificil' ? 6 : 3; // guarda o coringa para quando precisar
    else p += conta[c.cor] * (nivel === 'dificil' ? 1.5 : 1); // joga a cor que mais tem
    if (typeof c.v !== 'number' && !ehCoringa(c)) p += nivel === 'dificil' ? 1 : 0.5;
    if (perigo && ataque(c)) p += nivel === 'dificil' ? 20 : 8;
    if (nivel === 'dificil') {
      // Trocar para uma cor em que tem mais cartas, e evitar abrir a mão cedo demais.
      if (!ehCoringa(c) && c.cor !== e.cor && conta[c.cor] > conta[e.cor]) p += 2;
      if (c.v === 'mais4' && !perigo && mao.length > 3) p -= 4;
      if (typeof c.v === 'number') p += c.v / 10; // livra-se dos números altos antes
    }
    p += rnd() * 0.5;
    if (p > nota) { nota = p; melhor = c; }
  }
  const resto = mao.filter((c) => c.id !== melhor.id);
  return { id: melhor.id, cor: ehCoringa(melhor) ? melhorCor(resto.length ? resto : mao, rnd) : undefined };
}

// O robô lembra (ou não) de dizer "Última!".
export const roboLembra = (nivel, rnd = Math.random) => rnd() < ({ facil: 0.6, medio: 0.85, dificil: 1 }[nivel] ?? 0.85);
