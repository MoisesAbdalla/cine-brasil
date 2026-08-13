'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { GradeFilmes } from '@/components/grade-filmes';
import { inscrever, instantaneo, instantaneoServidor } from '@/lib/quero-ver/armazenamento';

export function ListaQueroVer() {
  const filmes = useSyncExternalStore(inscrever, instantaneo, instantaneoServidor);

  // No servidor a lista é sempre vazia, então sem esta distinção a tela de
  // "lista vazia" pisca antes da hidratação para quem tem filmes guardados.
  const hidratado = useSyncExternalStore(
    inscrever,
    () => true,
    () => false,
  );

  if (!hidratado) {
    return <p className="etiqueta py-16 text-center">carregando sua lista...</p>;
  }

  if (filmes.length === 0) {
    return (
      <div className="border border-borda px-6 py-16 text-center">
        <h2 className="font-serif text-2xl">Sua lista está vazia</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-suave">
          Abra a página de um filme e use o botão “Quero ver” para guardá-lo aqui. A lista fica
          neste navegador — não precisa de conta, mas também não acompanha você em outro aparelho.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-sm bg-acento px-5 py-2 text-sm font-semibold text-sobre-acento"
        >
          Descobrir filmes
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="etiqueta border-t border-borda pt-5">
        {filmes.length} {filmes.length === 1 ? 'filme guardado' : 'filmes guardados'}
      </p>
      <h2 className="sr-only">Filmes na sua lista</h2>
      <GradeFilmes filmes={filmes} />
    </>
  );
}
