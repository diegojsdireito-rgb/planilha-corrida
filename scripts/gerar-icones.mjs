// Gera os ícones PNG sem dependências: sol nascendo no fim de uma estrada, com a mesma paleta do app.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const TINTA = [20, 23, 31];
const VINHO = [74, 28, 44];
const CORAL = [228, 87, 46];
const OURO = [242, 177, 52];
const BRANCO = [255, 255, 255];
const HORIZONTE = 0.66;
const AMOSTRAS = 3;

function pedaco(tipo, dados) {
  const cabecalho = Buffer.alloc(4);
  cabecalho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([cabecalho, corpo, crc]);
}

const misturar = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function corDoPonto(x, y) {
  if (y >= HORIZONTE) {
    const descida = (y - HORIZONTE) / (1 - HORIZONTE);
    const meiaEstrada = 0.015 + descida * 0.3;
    if (Math.abs(x - 0.5) > meiaEstrada) return misturar(CORAL, VINHO, descida);
    const faixa = Math.abs(x - 0.5) < 0.004 + descida * 0.02 && Math.floor(descida * 5) % 2 === 0;
    return faixa ? BRANCO : TINTA;
  }
  const distancia = Math.hypot(x - 0.5, y - HORIZONTE);
  if (distancia < 0.22) return OURO;
  const ceu = misturar(TINTA, VINHO, y / HORIZONTE);
  return misturar(ceu, CORAL, Math.max(0, 1 - distancia / 0.5) * 0.55);
}

function png(tamanho) {
  const linhas = Buffer.alloc((tamanho * 3 + 1) * tamanho);
  let p = 0;
  for (let l = 0; l < tamanho; l++) {
    linhas[p++] = 0;
    for (let c = 0; c < tamanho; c++) {
      const soma = [0, 0, 0];
      for (let a = 0; a < AMOSTRAS; a++) {
        for (let b = 0; b < AMOSTRAS; b++) {
          const cor = corDoPonto((c + (a + 0.5) / AMOSTRAS) / tamanho, (l + (b + 0.5) / AMOSTRAS) / tamanho);
          cor.forEach((v, i) => { soma[i] += v; });
        }
      }
      for (const canal of soma) linhas[p++] = Math.round(canal / AMOSTRAS ** 2);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(linhas)),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(new URL('../icones/', import.meta.url), { recursive: true });
for (const tamanho of [180, 192, 512]) {
  writeFileSync(new URL(`../icones/icone-${tamanho}.png`, import.meta.url), png(tamanho));
}
