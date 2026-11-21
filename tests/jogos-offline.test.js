import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const raiz = new URL('../jogos/', import.meta.url).pathname;
const sw = readFileSync(join(raiz, 'sw.js'), 'utf8');
const lista = [...sw.matchAll(/^\s*'([^']+)',$/gm)].map((m) => m[1]);

function arquivos(pasta) {
  return readdirSync(pasta).flatMap((n) => {
    const p = join(pasta, n);
    return statSync(p).isDirectory() ? arquivos(p) : [relative(raiz, p)];
  });
}

test('sem internet: todo arquivo do app está na lista que fica guardada no aparelho', () => {
  const faltando = arquivos(raiz).filter((a) => a !== 'sw.js' && !/LICENSE|\.md$/.test(a) && !lista.includes(a));
  assert.deepEqual(faltando, [], 'acrescente estes arquivos em jogos/sw.js');
});

test('sem internet: a lista não aponta para arquivos que não existem', () => {
  for (const a of lista) if (a !== './') assert.ok(statSync(join(raiz, a)).isFile(), a);
});

test('sem internet: os módulos importados de fora da pasta jogos também ficam guardados', () => {
  for (const a of arquivos(join(raiz, 'src')).filter((x) => x.endsWith('.js'))) {
    const codigo = readFileSync(join(raiz, a), 'utf8');
    for (const [, alvo] of codigo.matchAll(/from '(\.[^']+)'/g)) {
      const caminho = relative(raiz, join(raiz, a, '..', alvo));
      assert.ok(lista.includes(caminho) || lista.includes(caminho.replace(/\\/g, '/')), `${a} importa ${alvo}`);
    }
  }
});
