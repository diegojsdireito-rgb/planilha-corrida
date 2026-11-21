// Mesa de Jogos sem internet: guarda no aparelho todos os arquivos do app (jogos, desenhos,
// modelos 3D, sons gerados no próprio código) e usa a internet só para buscar a versão nova.
// Nada sai do aparelho: placar, perfis e partidas continuam no localStorage.

const VERSAO = 'jogos-v1';
const ARQUIVOS = [
  './',
  'arte/cachinhos-corpo.jpg',
  'arte/cachinhos.jpg',
  'arte/tito-corpo.jpg',
  'arte/tito.jpg',
  'estilos-batalha.css',
  'estilos-bichinho.css',
  'estilos-cacapalavras.css',
  'estilos-cores.css',
  'estilos-domino.css',
  'estilos-forca.css',
  'estilos-labirinto.css',
  'estilos-mancala.css',
  'estilos-numeros.css',
  'estilos-pescaria.css',
  'estilos.css',
  'icones/icone-180.png',
  'icones/icone-192.png',
  'icones/icone-32.png',
  'icones/icone-512.png',
  'icones/icone.svg',
  'index.html',
  'manifest.webmanifest',
  'src/3d/anatomia.js',
  'src/3d/base.js',
  'src/3d/cenarios.js',
  'src/3d/itens.js',
  'src/3d/menina.js',
  'src/3d/perseguidores.js',
  'src/app.js',
  'src/batalha.js',
  'src/bichinho.js',
  'src/cacapalavras.js',
  'src/comum.js',
  'src/copia.js',
  'src/cores.js',
  'src/corrida.js',
  'src/dados.js',
  'src/damas.js',
  'src/docinhos.js',
  'src/domino.js',
  'src/forca.js',
  'src/labirinto.js',
  'src/lig4.js',
  'src/loja.js',
  'src/ludo.js',
  'src/mahjong.js',
  'src/mancala.js',
  'src/mundo3d.js',
  'src/numeros.js',
  'src/paciencia.js',
  'src/painel.js',
  'src/palavras.js',
  'src/perseguidores.js',
  'src/personagem.js',
  'src/personagens.js',
  'src/pescaria.js',
  'src/pintar-desenhos-dificeis.js',
  'src/pintar-desenhos-medios.js',
  'src/pintar-desenhos.js',
  'src/pintar-formas.js',
  'src/pintar.js',
  'src/reversi.js',
  'src/robo-xadrez.js',
  'src/som.js',
  'src/sudoku.js',
  'src/telas/batalha.js',
  'src/telas/bichinho.js',
  'src/telas/cacapalavras.js',
  'src/telas/cores.js',
  'src/telas/corrida.js',
  'src/telas/damas.js',
  'src/telas/docinhos-mapa-arte.js',
  'src/telas/docinhos.js',
  'src/telas/domino.js',
  'src/telas/forca.js',
  'src/telas/labirinto.js',
  'src/telas/lig4.js',
  'src/telas/ludo.js',
  'src/telas/mahjong.js',
  'src/telas/mancala.js',
  'src/telas/numeros.js',
  'src/telas/paciencia.js',
  'src/telas/pescaria.js',
  'src/telas/pintar.js',
  'src/telas/reversi.js',
  'src/telas/sudoku.js',
  'src/telas/velha.js',
  'src/telas/xadrez.js',
  'src/velha.js',
  'src/xadrez.js',
  'vendor/three.module.min.js',
  '../src/gestos.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    // um por um: se algum arquivo falhar, os outros continuam guardados
    caches.open(VERSAO)
      .then((c) => Promise.allSettled(ARQUIVOS.map((a) => c.add(new Request(a, { cache: 'reload' })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('jogos-') && n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Com internet, sempre a versão mais nova (e ela fica guardada); sem internet, ou com a rede
// muito lenta, o que estiver guardado no aparelho.
const ESPERA_MS = 4000;
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const guardado = () => caches.match(e.request, { ignoreSearch: true })
    .then((r) => r ?? (e.request.mode === 'navigate' ? caches.match('index.html') : undefined));
  const daRede = fetch(e.request.url, { cache: 'no-cache' }).then((resposta) => {
    if (resposta.ok) {
      const copia = resposta.clone();
      caches.open(VERSAO).then((c) => c.put(e.request.url.split('?')[0], copia));
    }
    return resposta;
  });
  const lenta = new Promise((ok) => setTimeout(ok, ESPERA_MS)).then(guardado);
  e.respondWith(
    Promise.race([daRede.catch(guardado), lenta.then((r) => r ?? daRede)])
      .then((r) => r ?? guardado())
      .catch(guardado),
  );
});
