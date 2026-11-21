// Batalha no Mar: lógica pura (sem DOM). Grade N × N, casas numeradas i = r * N + c.
// Um barco é { r, c, tam, vert }. Os tiros ficam numa lista com null | 'agua' | 'acerto' | 'afundado'.

export const N = 8;
export const FROTA = [
  { tam: 4, nome: 'Baleia' },
  { tam: 3, nome: 'Polvo' },
  { tam: 3, nome: 'Tartaruga' },
  { tam: 2, nome: 'Patinho' },
  { tam: 2, nome: 'Peixinho' },
];

export const celulas = (b, n = N) => Array.from({ length: b.tam }, (_, k) => (b.r + (b.vert ? k : 0)) * n + b.c + (b.vert ? 0 : k));

export function dentro(b, n = N) {
  if (b.r < 0 || b.c < 0) return false;
  return b.vert ? b.r + b.tam <= n && b.c < n : b.c + b.tam <= n && b.r < n;
}

// O barco cabe ali sem sair da grade nem passar por cima de outro (ignorando o barco de índice `ignorar`).
export function cabe(barcos, b, ignorar = -1, n = N) {
  if (!dentro(b, n)) return false;
  const ocupadas = new Set(barcos.flatMap((o, k) => (k === ignorar ? [] : celulas(o, n))));
  return celulas(b, n).every((i) => !ocupadas.has(i));
}

// Sorteia a frota inteira. Na hora de sortear, os barcos não encostam um no outro (fica mais bonito e justo).
export function sortearFrota(rnd = Math.random, n = N, frota = FROTA) {
  for (let tentativa = 0; tentativa < 500; tentativa++) {
    const barcos = [];
    const bloqueadas = new Set();
    let ok = true;
    for (const { tam } of frota) {
      let posto = false;
      for (let t = 0; t < 200 && !posto; t++) {
        const vert = rnd() < 0.5;
        const b = { r: Math.floor(rnd() * n), c: Math.floor(rnd() * n), tam, vert };
        if (!dentro(b, n) || celulas(b, n).some((i) => bloqueadas.has(i))) continue;
        barcos.push(b);
        for (const i of celulas(b, n)) {
          const r = Math.floor(i / n); const c = i % n;
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr; const cc = c + dc;
            if (rr >= 0 && cc >= 0 && rr < n && cc < n) bloqueadas.add(rr * n + cc);
          }
        }
        posto = true;
      }
      if (!posto) { ok = false; break; }
    }
    if (ok) return barcos;
  }
  throw new Error('não coube a frota');
}

export const novosTiros = (n = N) => Array(n * n).fill(null);

export const afundou = (b, tiros, n = N) => celulas(b, n).every((i) => tiros[i] === 'acerto' || tiros[i] === 'afundado');

// Atira na casa i. Devolve { resultado: 'agua' | 'acerto' | 'afundou', barco } e anota nos tiros.
export function atirar(barcos, tiros, i, n = N) {
  if (tiros[i]) return { resultado: 'repetido' };
  const k = barcos.findIndex((b) => celulas(b, n).includes(i));
  if (k < 0) { tiros[i] = 'agua'; return { resultado: 'agua' }; }
  tiros[i] = 'acerto';
  if (afundou(barcos[k], tiros, n)) {
    for (const j of celulas(barcos[k], n)) tiros[j] = 'afundado';
    return { resultado: 'afundou', barco: k };
  }
  return { resultado: 'acerto', barco: k };
}

export const todosAfundados = (barcos, tiros, n = N) => barcos.every((b) => afundou(b, tiros, n));
export const afundados = (barcos, tiros, n = N) => barcos.map((b) => afundou(b, tiros, n));

// Tamanhos dos barcos que ainda estão boiando (quem atira sabe quais já afundou).
export const restantes = (barcos, tiros, n = N) => barcos.filter((b) => !afundou(b, tiros, n)).map((b) => b.tam);

const vizinhos = (i, n) => {
  const r = Math.floor(i / n); const c = i % n;
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n).map(([a, b]) => a * n + b);
};

const sortear = (lista, rnd) => lista[Math.floor(rnd() * lista.length)];

// Caça e alvo: com acerto em aberto, tenta as casas em volta (seguindo a linha, se já houver dois acertos em fila).
function alvo(tiros, n, rnd) {
  const acertos = tiros.flatMap((v, i) => (v === 'acerto' ? [i] : []));
  if (!acertos.length) return null;
  const livre = (i) => !tiros[i];
  const linha = [];
  for (const i of acertos) {
    const r = Math.floor(i / n); const c = i % n;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const rr = r + dr; const cc = c + dc;
      if (rr < n && cc < n && tiros[rr * n + cc] === 'acerto') {
        // Estende a fila para os dois lados até achar casa livre.
        for (const s of [1, -1]) {
          let a = r; let b = c;
          while (a >= 0 && b >= 0 && a < n && b < n && tiros[a * n + b] === 'acerto') { a += dr * s; b += dc * s; }
          if (a >= 0 && b >= 0 && a < n && b < n && livre(a * n + b)) linha.push(a * n + b);
        }
      }
    }
  }
  if (linha.length) return sortear(linha, rnd);
  const perto = [...new Set(acertos.flatMap((i) => vizinhos(i, n)).filter(livre))];
  return perto.length ? sortear(perto, rnd) : null;
}

// Mapa de probabilidade: conta de quantas formas cada barco que sobrou pode passar por cada casa.
export function mapaProbabilidade(tiros, tamanhos, n = N) {
  const peso = Array(n * n).fill(0);
  const temAcerto = tiros.some((v) => v === 'acerto');
  for (const tam of tamanhos) {
    for (const vert of [false, true]) {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const b = { r, c, tam, vert };
        if (!dentro(b, n)) continue;
        const cs = celulas(b, n);
        if (cs.some((i) => tiros[i] === 'agua' || tiros[i] === 'afundado')) continue;
        const acertos = cs.filter((i) => tiros[i] === 'acerto').length;
        if (temAcerto && !acertos) continue;
        const p = temAcerto ? 1 + acertos * 30 : 1;
        for (const i of cs) if (!tiros[i]) peso[i] += p;
      }
    }
  }
  return peso;
}

// Escolhe a casa onde o robô atira. Fácil: ao acaso. Médio: caça e alvo. Difícil: mapa de probabilidade com paridade.
export function tiroRobo(tiros, tamanhos, nivel = 'medio', rnd = Math.random, n = N) {
  const livres = tiros.flatMap((v, i) => (v ? [] : [i]));
  if (!livres.length) return null;
  if (nivel === 'facil') {
    // De vez em quando lembra de mirar perto de um acerto, mas quase sempre chuta.
    if (rnd() < 0.3) { const a = alvo(tiros, n, rnd); if (a !== null) return a; }
    return sortear(livres, rnd);
  }
  if (nivel === 'medio') {
    const a = alvo(tiros, n, rnd);
    return a ?? sortear(livres, rnd);
  }
  const peso = mapaProbabilidade(tiros, tamanhos.length ? tamanhos : [1], n);
  const temAcerto = tiros.some((v) => v === 'acerto');
  const menor = Math.min(...(tamanhos.length ? tamanhos : [1]));
  let melhor = -1; let opcoes = [];
  for (const i of livres) {
    let p = peso[i];
    // Paridade: na caça, só vale a pena olhar uma casa sim, outra não (o menor barco sempre cobre uma delas).
    if (!temAcerto && menor > 1 && (Math.floor(i / n) + (i % n)) % 2 !== 0) p *= 0.25;
    if (p > melhor) { melhor = p; opcoes = [i]; } else if (p === melhor) opcoes.push(i);
  }
  return sortear(opcoes, rnd);
}
