'use client';

import { useSyncExternalStore } from 'react';
import {
  alternar,
  inscrever,
  instantaneo,
  instantaneoServidor,
  type FilmeSalvo,
} from '@/lib/quero-ver/armazenamento';

/**
 * A lista vive no navegador, então o servidor não sabe se este filme está nela:
 * o HTML sai como "fora da lista" e o estado real chega na hidratação. Ler o
 * armazenamento por `useSyncExternalStore` mantém este botão e a página da lista
 * em sincronia sem nenhum estado duplicado entre eles.
 */
export function BotaoQueroVer({ filme }: { filme: FilmeSalvo }) {
  const lista = useSyncExternalStore(inscrever, instantaneo, instantaneoServidor);
  const salvo = lista.some((item) => item.id === filme.id);

  return (
    <button
      type="button"
      onClick={() => alternar(filme)}
      aria-pressed={salvo}
      className={`rounded-sm border px-5 py-2 text-sm transition ${
        salvo ? 'border-acento text-acento' : 'border-borda hover:border-acento hover:text-acento'
      }`}
    >
      {salvo ? '✓ Na minha lista' : '+ Quero ver'}
    </button>
  );
}
