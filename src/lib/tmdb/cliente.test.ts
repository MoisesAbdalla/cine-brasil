import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buscarNoTmdb, ErroTmdb, CACHE } from './cliente';

const fetchFalso = vi.fn();

beforeEach(() => {
  vi.stubEnv('TMDB_ACCESS_TOKEN', 'token-de-teste');
  vi.stubGlobal('fetch', fetchFalso);
  fetchFalso.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function respostaOk(corpo: unknown) {
  return { ok: true, status: 200, json: async () => corpo } as Response;
}

describe('buscarNoTmdb', () => {
  it('monta a URL com os parâmetros e o idioma pt-BR', async () => {
    fetchFalso.mockResolvedValue(respostaOk({ ok: 1 }));

    await buscarNoTmdb('/discover/movie', { page: '2' }, CACHE.descoberta);

    const [url] = fetchFalso.mock.calls[0];
    expect(url).toContain('https://api.themoviedb.org/3/discover/movie');
    expect(url).toContain('language=pt-BR');
    expect(url).toContain('page=2');
  });

  it('envia o token no cabeçalho e o prazo de revalidação', async () => {
    fetchFalso.mockResolvedValue(respostaOk({ ok: 1 }));

    await buscarNoTmdb('/genre/movie/list', {}, CACHE.generos);

    const [, opcoes] = fetchFalso.mock.calls[0];
    expect(opcoes.headers.Authorization).toBe('Bearer token-de-teste');
    expect(opcoes.next.revalidate).toBe(CACHE.generos);
  });

  it('devolve o corpo já em JSON', async () => {
    fetchFalso.mockResolvedValue(respostaOk({ total_results: 7 }));
    const dados = await buscarNoTmdb<{ total_results: number }>('/discover/movie', {}, 60);
    expect(dados.total_results).toBe(7);
  });

  it('lança ErroTmdb com o status quando a resposta falha', async () => {
    fetchFalso.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as Response);

    await expect(buscarNoTmdb('/movie/999999999', {}, 60)).rejects.toMatchObject({
      name: 'ErroTmdb',
      status: 404,
    });
  });

  it('lança ErroTmdb quando a rede falha', async () => {
    fetchFalso.mockRejectedValue(new Error('rede caiu'));
    await expect(buscarNoTmdb('/discover/movie', {}, 60)).rejects.toBeInstanceOf(ErroTmdb);
  });

  it('lança ErroTmdb quando o token não está configurado', async () => {
    vi.stubEnv('TMDB_ACCESS_TOKEN', '');
    await expect(buscarNoTmdb('/discover/movie', {}, 60)).rejects.toBeInstanceOf(ErroTmdb);
  });
});

describe('CACHE', () => {
  it('usa os prazos definidos na spec', () => {
    expect(CACHE.generos).toBe(60 * 60 * 24 * 7);
    expect(CACHE.provedores).toBe(60 * 60 * 24);
    expect(CACHE.descoberta).toBe(60 * 60 * 6);
    expect(CACHE.filme).toBe(60 * 60 * 12);
    expect(CACHE.busca).toBe(60 * 60);
  });
});
