import { montarParametrosDescoberta } from '@/lib/filtros/para-tmdb';
import type { Filtros } from '@/lib/filtros/schema';
import { PAGINA_MAXIMA } from '@/lib/filtros/schema';
import { obterProvedores } from './catalogos';
import { buscarNoTmdb, CACHE } from './cliente';
import { normalizarResumo, type FilmeResumo } from './normalizar';
import type { FilmeResumoTmdb, RespostaPaginada } from './tipos';

export interface ResultadoDescoberta {
  filmes: FilmeResumo[];
  totalResultados: number;
  totalPaginas: number;
  pagina: number;
}

export function montarResultado(bruto: RespostaPaginada<FilmeResumoTmdb>): ResultadoDescoberta {
  return {
    filmes: (bruto.results ?? []).map(normalizarResumo),
    totalResultados: bruto.total_results,
    totalPaginas: Math.min(bruto.total_pages, PAGINA_MAXIMA),
    pagina: bruto.page,
  };
}

export async function descobrirFilmes(filtros: Filtros): Promise<ResultadoDescoberta> {
  const provedores = await obterProvedores();
  const parametros = montarParametrosDescoberta(
    filtros,
    provedores.map((p) => p.id),
  );

  const bruto = await buscarNoTmdb<RespostaPaginada<FilmeResumoTmdb>>(
    '/discover/movie',
    parametros,
    CACHE.descoberta,
  );

  return montarResultado(bruto);
}
