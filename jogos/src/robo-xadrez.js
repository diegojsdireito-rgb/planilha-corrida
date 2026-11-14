// Roda o robô do xadrez fora da linha principal, para a tela não travar enquanto ele pensa.
import { jogadaRobo } from './xadrez.js';

self.onmessage = (e) => {
  const { id, s, nivel, chaves } = e.data;
  self.postMessage({ id, m: jogadaRobo(s, nivel, Math.random, chaves) });
};
