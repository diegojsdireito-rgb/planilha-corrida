import { test } from 'node:test';
import assert from 'node:assert/strict';

// localStorage de mentira, como o do navegador.
function armazenamento(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    get length() { return m.size; },
    key: (k) => [...m.keys()][k] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    mapa: m,
  };
}
let n = 0;
async function abrir(inicial) {
  globalThis.localStorage = armazenamento(inicial);
  return import(`../jogos/src/dados.js?perfis=${n++}`);
}

test('quem já jogava continua com tudo no primeiro perfil', async () => {
  const d = await abrir({
    'mesa-de-jogos': JSON.stringify({ historico: [{ j: 'velha', r: 'vitoria', t: 1 }], carteira: { moedas: 300 } }),
    'mesa-de-jogos:salvo:xadrez': JSON.stringify({ lances: 3, quando: 5 }),
  });
  assert.equal(d.listaDePerfis().length, 1);
  assert.equal(d.prefs.historico.length, 1);
  assert.equal(d.prefs.carteira.moedas, 300);
  assert.equal(d.lerSalvo('xadrez').lances, 3);
});

test('cada perfil guarda o próprio progresso e as partidas em andamento', async () => {
  const d = await abrir({});
  const ref = d.prefs;
  d.registrar('velha', 'vitoria');
  d.prefs.carteira.moedas = 50;
  d.guardar();
  d.salvar('sudoku', { grade: 'da-primeira' });

  const ana = d.criarPerfil('  Ana  ', '👧');
  assert.equal(ana.nome, 'Ana');
  assert.ok(d.temVariosPerfis());
  d.trocarPerfil(ana.id);
  assert.equal(d.prefs, ref, 'o objeto prefs continua o mesmo');
  assert.equal(d.prefs.historico.length, 0);
  assert.equal(d.prefs.carteira.moedas, 0);
  assert.equal(d.lerSalvo('sudoku'), null);
  d.registrar('damas', 'derrota');
  d.registrar('damas', 'vitoria');
  d.salvar('sudoku', { grade: 'da-ana' });

  d.trocarPerfil('p1');
  assert.equal(d.prefs.historico.length, 1);
  assert.equal(d.prefs.carteira.moedas, 50);
  assert.equal(d.lerSalvo('sudoku').grade, 'da-primeira');
  assert.deepEqual(d.resumoDoPerfil(ana.id), { partidas: 2, moedas: 0 });

  d.trocarPerfil(ana.id);
  assert.equal(d.lerSalvo('sudoku').grade, 'da-ana');
  assert.equal(d.perfilAtual().nome, 'Ana');
});

test('o perfil escolhido fica lembrado ao abrir o app de novo', async () => {
  const d = await abrir({});
  const bia = d.criarPerfil('Bia', '🦄');
  d.trocarPerfil(bia.id);
  d.registrar('lig4', 'vitoria');
  const dados = Object.fromEntries(globalThis.localStorage.mapa);
  const d2 = await abrir(dados);
  assert.equal(d2.perfilAtual().nome, 'Bia');
  assert.equal(d2.prefs.historico.length, 1);
});

test('nomes vazios ou repetidos são recusados', async () => {
  const d = await abrir({});
  assert.throws(() => d.criarPerfil('   '), /nome/);
  d.criarPerfil('Léo');
  assert.throws(() => d.criarPerfil('léo'), /Já existe/);
  assert.throws(() => d.editarPerfil('p1', { nome: 'LÉO' }), /Já existe/);
  assert.equal(d.editarPerfil('p1', { nome: 'Mamãe', avatar: '👩' }).nome, 'Mamãe');
});

test('apagar um perfil apaga só os dados dele', async () => {
  const d = await abrir({});
  d.registrar('velha', 'vitoria');
  d.salvar('ludo', { a: 1 });
  const ana = d.criarPerfil('Ana');
  d.trocarPerfil(ana.id);
  d.registrar('velha', 'derrota');
  d.salvar('ludo', { a: 2 });
  d.apagarPerfil(ana.id);
  assert.equal(d.perfilAtual().id, 'p1');
  assert.equal(d.prefs.historico.length, 1);
  assert.equal(d.lerSalvo('ludo').a, 1);
  assert.ok(![...globalThis.localStorage.mapa.keys()].some((k) => k.includes(ana.id)));
  assert.throws(() => d.apagarPerfil('p1'), /pelo menos um/);

  // apagar o primeiro perfil não leva junto os outros
  const bia = d.criarPerfil('Bia');
  d.trocarPerfil(bia.id);
  d.salvar('ludo', { a: 3 });
  d.apagarPerfil('p1');
  assert.equal(d.perfilAtual().id, bia.id);
  assert.equal(d.lerSalvo('ludo').a, 3);
  assert.equal(globalThis.localStorage.getItem('mesa-de-jogos'), null);
});
