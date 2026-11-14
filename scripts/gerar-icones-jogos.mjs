// Gera os PNGs do ícone da Mesa de Jogos a partir de jogos/icones/icone.svg.
// Usa o Playwright instalado na máquina: npx playwright (ou require global) precisa estar disponível.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const pasta = fileURLToPath(new URL('../jogos/icones/', import.meta.url));
const svg = readFileSync(`${pasta}icone.svg`, 'utf8');

const navegador = await chromium.launch();
for (const tamanho of [32, 180, 192, 512]) {
  const pagina = await navegador.newPage({ viewport: { width: tamanho, height: tamanho } });
  await pagina.setContent(`<style>html,body{margin:0}svg{display:block;width:${tamanho}px;height:${tamanho}px}</style>${svg}`);
  await pagina.screenshot({ path: `${pasta}icone-${tamanho}.png`, omitBackground: false });
  await pagina.close();
}
await navegador.close();
console.log('Ícones da Mesa de Jogos gerados em jogos/icones/.');
