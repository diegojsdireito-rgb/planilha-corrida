// Abre sem internet. Só guarda os arquivos do próprio app: nada do intervals.icu passa por aqui.

const VERSAO = 'corrida-v3.2';
const ARQUIVOS = [
  './',
  'index.html',
  'estilos.css',
  'manifest.webmanifest',
  'src/analise.js',
  'src/aniversario.js',
  'src/app.js',
  'src/armazenamento.js',
  'src/avulsas.js',
  'src/calendario.js',
  'src/cumprimento.js',
  'src/envio.js',
  'src/estatisticas.js',
  'src/gestos.js',
  'src/graficos.js',
  'src/icu.js',
  'src/medalhas.js',
  'src/motor.js',
  'src/percurso.js',
  'src/peso.js',
  'src/provas.js',
  'src/regras.js',
  'src/visual.js',
  'icones/icone-180.png',
  'icones/icone-192.png',
  'icones/icone-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSAO)
      .then((c) => c.addAll(ARQUIVOS.map((a) => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('corrida-') && n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // O GitHub Pages permite reaproveitar arquivos por 10 minutos: "no-cache" sempre confere a versão.
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' })
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(VERSAO).then((c) => c.put(e.request, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(e.request).then((guardado) => guardado ?? caches.match('index.html'))),
  );
});
