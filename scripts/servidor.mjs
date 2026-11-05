// Servidor local para desenvolvimento. O app em si é só arquivos estáticos.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORTA = Number(process.env.PORT) || 4180;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const arquivo = normalize(join(RAIZ, caminho === '/' ? 'index.html' : caminho));
  if (!arquivo.startsWith(RAIZ + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(conteudo);
  } catch {
    res.writeHead(404).end('Não encontrado');
  }
}).listen(PORTA, '127.0.0.1', () => console.log(`Run Glória em http://localhost:${PORTA}`));
