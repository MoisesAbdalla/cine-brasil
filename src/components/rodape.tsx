import Image from 'next/image';

export function Rodape() {
  return (
    <footer className="mt-16 border-t border-borda">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/tmdb.svg" alt="The Movie Database" width={80} height={11} />
          <p className="text-xs text-suave">
            Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
          </p>
        </div>
        <p className="text-xs text-suave">
          Disponibilidade de streaming fornecida por JustWatch.
        </p>
      </div>
    </footer>
  );
}
