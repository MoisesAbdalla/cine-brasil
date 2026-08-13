import type { Metadata } from 'next';
import { GradeFilmes } from '@/components/grade-filmes';
import { Paginacao } from '@/components/paginacao';
import { FILTROS_PADRAO, lerFiltros, type ParamsBrutos } from '@/lib/filtros/schema';
import { buscarFilmes } from '@/lib/tmdb/buscar';

interface Props {
  searchParams: Promise<ParamsBrutos>;
}

export const metadata: Metadata = {
  title: 'Buscar filmes',
  description: 'Procure um filme pelo título e veja onde ele está disponível no Brasil.',
};

export default async function PaginaBusca({ searchParams }: Props) {
  const params = await searchParams;
  const termo = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? '';
  const { pagina } = lerFiltros(params);

  const resultado = termo ? await buscarFilmes(termo, pagina) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Buscar filmes</h1>
        <p className="mt-2 max-w-prose text-sm text-suave">
          A busca procura em todos os filmes do acervo — a disponibilidade no streaming aparece na
          página de cada um.
        </p>
      </div>

      <form action="/busca" className="flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={termo}
          placeholder="Título do filme"
          aria-label="Título do filme"
          className="w-full max-w-md rounded-sm border border-borda bg-superficie px-4 py-2 text-sm outline-none focus:border-acento"
        />
        <button
          type="submit"
          className="rounded-sm bg-acento px-5 py-2 text-sm font-semibold text-sobre-acento"
        >
          Buscar
        </button>
      </form>

      {resultado === null ? (
        <p className="etiqueta">digite um título para começar</p>
      ) : resultado.filmes.length === 0 ? (
        <div className="border border-borda px-6 py-16 text-center">
          <h2 className="font-serif text-2xl">Nenhum filme com esse título</h2>
          <p className="mt-3 text-sm text-suave">Verifique a grafia ou tente parte do nome.</p>
        </div>
      ) : (
        <>
          <p className="etiqueta">
            {resultado.totalResultados.toLocaleString('pt-BR')}{' '}
            {resultado.totalResultados === 1 ? 'resultado' : 'resultados'} para “{termo}”
          </p>
          <h2 className="sr-only">Resultados da busca</h2>
          <GradeFilmes filmes={resultado.filmes} />
          <Paginacao
            filtros={{ ...FILTROS_PADRAO, pagina: resultado.pagina }}
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            base="/busca"
            extras={{ q: termo }}
          />
        </>
      )}
    </div>
  );
}
