// Gera os ícones PNG sem dependências: fundo verde com três setas de avanço.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const FUNDO = [15, 118, 110];
const FRENTE = [255, 255, 255];

function pedaco(tipo, dados) {
  const cabecalho = Buffer.alloc(4);
  cabecalho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([cabecalho, corpo, crc]);
}

function dentroDaSeta(x, y, inicio) {
  const altura = Math.abs(y - 0.5);
  if (altura > 0.2) return false;
  const pos = x - inicio - altura * 0.9;
  return pos >= 0 && pos <= 0.075;
}

function png(tamanho) {
  const linhas = Buffer.alloc((tamanho * 3 + 1) * tamanho);
  let p = 0;
  for (let l = 0; l < tamanho; l++) {
    linhas[p++] = 0;
    for (let c = 0; c < tamanho; c++) {
      const x = (c + 0.5) / tamanho;
      const y = (l + 0.5) / tamanho;
      const seta = [0.26, 0.42, 0.58].some((inicio) => dentroDaSeta(1 - x - 0.05, y, inicio - 0.02));
      for (const canal of seta ? FRENTE : FUNDO) linhas[p++] = canal;
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
