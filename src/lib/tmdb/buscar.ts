import { buscarNoTmdb, CACHE } from './cliente';
import { montarResultado, type ResultadoDescoberta } from './descobrir';
import type { FilmeResumoTmdb, RespostaPaginada } from './tipos';

export async function buscarFilmes(termo: string, pagina: number): Promise<ResultadoDescoberta> {
  const bruto = await buscarNoTmdb<RespostaPaginada<FilmeResumoTmdb>>(
    '/search/movie',
    { query: termo, page: String(pagina), include_adult: 'false' },
    CACHE.busca,
  );

  return montarResultado(bruto);
}
