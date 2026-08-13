'use client';

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24 text-center">
      <h1 className="font-serif text-3xl">Não deu para carregar o catálogo</h1>
      <p className="mx-auto mt-3 max-w-md text-suave">
        O serviço de dados de filmes não respondeu agora. Isso costuma ser passageiro.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-sm bg-acento px-5 py-2 text-sm font-semibold text-sobre-acento"
      >
        Tentar de novo
      </button>
    </div>
  );
}
