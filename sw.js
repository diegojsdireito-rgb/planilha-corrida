// Abre sem internet. Só guarda os arquivos do próprio app: nada do intervals.icu passa por aqui.

const VERSAO = 'corrida-v1';
const ARQUIVOS = [
  './',
  'index.html',
  'estilos.css',
  'manifest.webmanifest',
  'src/app.js',
  'src/armazenamento.js',
  'src/icu.js',
  'src/motor.js',
  'icones/icone-180.png',
  'icones/icone-192.png',
  'icones/icone-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
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
  e.respondWith(
    fetch(e.request)
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
