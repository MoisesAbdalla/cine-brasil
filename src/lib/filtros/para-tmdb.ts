import type { Filtros, Ordem, Duracao } from './schema';

const ORDENACAO_TMDB: Record<Ordem, string> = {
  populares: 'popularity.desc',
  nota: 'vote_average.desc',
  lancamento: 'primary_release_date.desc',
  titulo: 'title.asc',
};

const DURACAO_TMDB: Record<Duracao, Record<string, string>> = {
  'ate-90': { 'with_runtime.lte': '90' },
  '90-120': { 'with_runtime.gte': '90', 'with_runtime.lte': '120' },
  'acima-120': { 'with_runtime.gte': '120' },
};

/**
 * Traduz os filtros da URL para a query do /discover/movie.
 *
 * `servicosPadrao` são os IDs de todos os serviços de assinatura do BR, usados
 * quando o usuário não escolheu nenhum — é o que cumpre a promessa "tudo que
 * está no streaming agora" já na primeira visita.
 */
export function montarParametrosDescoberta(
  filtros: Filtros,
  servicosPadrao: number[],
): Record<string, string> {
  const servicos = filtros.servicos.length > 0 ? filtros.servicos : servicosPadrao;

  const parametros: Record<string, string> = {
    watch_region: 'BR',
    with_watch_monetization_types: filtros.incluirGratis ? 'flatrate|free|ads' : 'flatrate',
    // Sem isto, "nota acima de 8" devolve filmes com três votos e média 10.
    // Não é configurável na interface, e não deve deixar de existir.
    'vote_count.gte': '50',
    include_adult: 'false',
    with_watch_providers: servicos.join('|'),
    sort_by: ORDENACAO_TMDB[filtros.ordem],
    page: String(filtros.pagina),
  };

  if (filtros.generos.length > 0) parametros.with_genres = filtros.generos.join(',');
  if (filtros.anoInicio && filtros.anoFim) {
    parametros['primary_release_date.gte'] = `${filtros.anoInicio}-01-01`;
    parametros['primary_release_date.lte'] = `${filtros.anoFim}-12-31`;
  }
  if (filtros.notaMinima) parametros['vote_average.gte'] = String(filtros.notaMinima);
  if (filtros.duracao) Object.assign(parametros, DURACAO_TMDB[filtros.duracao]);
  if (filtros.idioma) parametros.with_original_language = filtros.idioma;

  return parametros;
}
