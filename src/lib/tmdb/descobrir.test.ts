import { describe, it, expect } from 'vitest';
import { montarResultado } from './descobrir';
import type { FilmeResumoTmdb, RespostaPaginada } from './tipos';

const filme: FilmeResumoTmdb = {
  id: 1,
  title: 'Filme',
  poster_path: '/p.jpg',
  release_date: '2020-01-01',
  vote_average: 8,
};

function resposta(parcial: Partial<RespostaPaginada<FilmeResumoTmdb>>): RespostaPaginada<FilmeResumoTmdb> {
  return { page: 1, results: [filme], total_pages: 10, total_results: 200, ...parcial };
}

describe('montarResultado', () => {
  it('normaliza os filmes', () => {
    const r = montarResultado(resposta({}));
    expect(r.filmes[0].titulo).toBe('Filme');
    expect(r.filmes[0].ano).toBe(2020);
  });

  it('repassa a contagem total', () => {
    expect(montarResultado(resposta({})).totalResultados).toBe(200);
  });

  it('limita o total de páginas ao teto de 500 do TMDB', () => {
    expect(montarResultado(resposta({ total_pages: 1200 })).totalPaginas).toBe(500);
    expect(montarResultado(resposta({ total_pages: 10 })).totalPaginas).toBe(10);
  });

  it('aguenta resposta sem resultados', () => {
    const r = montarResultado(resposta({ results: [], total_results: 0, total_pages: 0 }));
    expect(r.filmes).toEqual([]);
    expect(r.totalResultados).toBe(0);
  });
});
