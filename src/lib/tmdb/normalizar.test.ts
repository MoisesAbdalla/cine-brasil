import { describe, it, expect } from 'vitest';
import { urlImagem, normalizarResumo, normalizarDetalhe } from './normalizar';
import type { FilmeDetalheTmdb, FilmeResumoTmdb } from './tipos';

const resumoBase: FilmeResumoTmdb = {
  id: 1,
  title: 'Filme de Teste',
  poster_path: '/abc.jpg',
  release_date: '2019-07-04',
  vote_average: 7.34,
};

describe('urlImagem', () => {
  it('monta a URL do CDN do TMDB', () => {
    expect(urlImagem('/abc.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
  });

  it('devolve null quando não há imagem', () => {
    expect(urlImagem(null, 'w500')).toBeNull();
  });
});

describe('normalizarResumo', () => {
  it('extrai o ano da data de lançamento', () => {
    expect(normalizarResumo(resumoBase).ano).toBe(2019);
  });

  it('arredonda a nota para uma casa', () => {
    expect(normalizarResumo(resumoBase).nota).toBe(7.3);
  });

  it('trata nota 0 como ausência de nota', () => {
    expect(normalizarResumo({ ...resumoBase, vote_average: 0 }).nota).toBeNull();
  });

  it('trata data ausente ou vazia como ano nulo', () => {
    expect(normalizarResumo({ ...resumoBase, release_date: '' }).ano).toBeNull();
    expect(normalizarResumo({ ...resumoBase, release_date: undefined }).ano).toBeNull();
  });

  it('trata pôster ausente como null', () => {
    expect(normalizarResumo({ ...resumoBase, poster_path: null }).poster).toBeNull();
  });
});

describe('normalizarDetalhe', () => {
  const detalheBase: FilmeDetalheTmdb = {
    ...resumoBase,
    backdrop_path: '/fundo.jpg',
    overview: 'Uma sinopse.',
    runtime: 118,
    genres: [{ id: 27, name: 'Terror' }],
    credits: {
      cast: [
        { id: 10, name: 'Atriz Um', character: 'Ela', profile_path: '/a.jpg', order: 0 },
        { id: 11, name: 'Ator Dois', character: 'Ele', profile_path: null, order: 1 },
      ],
      crew: [{ id: 20, name: 'Diretora Tal', job: 'Director' }],
    },
    videos: {
      results: [
        { key: 'xyz', site: 'YouTube', type: 'Trailer', official: true },
        { key: 'abc', site: 'Vimeo', type: 'Trailer', official: true },
      ],
    },
    similar: { page: 1, results: [resumoBase], total_pages: 1, total_results: 1 },
    'watch/providers': {
      results: {
        BR: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg', display_priority: 1 }] },
      },
    },
  };

  it('traz os campos principais', () => {
    const d = normalizarDetalhe(detalheBase);
    expect(d.titulo).toBe('Filme de Teste');
    expect(d.duracao).toBe(118);
    expect(d.generos).toEqual(['Terror']);
    expect(d.sinopse).toBe('Uma sinopse.');
  });

  it('encontra a direção no time de produção', () => {
    expect(normalizarDetalhe(detalheBase).diretor).toBe('Diretora Tal');
  });

  it('pega os provedores de assinatura do Brasil', () => {
    const d = normalizarDetalhe(detalheBase);
    expect(d.provedores).toEqual([
      { id: 8, nome: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/n.jpg' },
    ]);
  });

  it('devolve lista vazia quando não há provedor de assinatura no BR', () => {
    const semBr = { ...detalheBase, 'watch/providers': { results: {} } };
    expect(normalizarDetalhe(semBr).provedores).toEqual([]);
  });

  it('descarta provedores sem logo e mantém os com logo válido', () => {
    const misto = {
      ...detalheBase,
      'watch/providers': {
        results: {
          BR: {
            flatrate: [
              { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg', display_priority: 1 },
              { provider_id: 10, provider_name: 'Sem Logo', logo_path: '', display_priority: 2 },
              { provider_id: 11, provider_name: 'Outro', logo_path: '/outro.jpg', display_priority: 3 },
            ],
          },
        },
      },
    };
    const d = normalizarDetalhe(misto);
    expect(d.provedores).toHaveLength(2);
    expect(d.provedores[0]).toEqual({
      id: 8,
      nome: 'Netflix',
      logo: 'https://image.tmdb.org/t/p/w92/n.jpg',
    });
    expect(d.provedores[1]).toEqual({
      id: 11,
      nome: 'Outro',
      logo: 'https://image.tmdb.org/t/p/w92/outro.jpg',
    });
  });

  it('só aceita trailer do YouTube', () => {
    expect(normalizarDetalhe(detalheBase).trailerYoutube).toBe('xyz');

    const soVimeo = {
      ...detalheBase,
      videos: { results: [{ key: 'abc', site: 'Vimeo', type: 'Trailer', official: true }] },
    };
    expect(normalizarDetalhe(soVimeo).trailerYoutube).toBeNull();
  });

  it('limita o elenco a 8 pessoas e converte a foto', () => {
    const d = normalizarDetalhe(detalheBase);
    expect(d.elenco).toHaveLength(2);
    expect(d.elenco[0]).toEqual({
      nome: 'Atriz Um',
      personagem: 'Ela',
      foto: 'https://image.tmdb.org/t/p/w185/a.jpg',
    });
    expect(d.elenco[1].foto).toBeNull();
  });

  it('trata sinopse vazia e duração 0 como ausentes', () => {
    const magro = { ...detalheBase, overview: '', runtime: 0 };
    const d = normalizarDetalhe(magro);
    expect(d.sinopse).toBeNull();
    expect(d.duracao).toBeNull();
  });

  it('aguenta detalhe sem elenco, sem vídeos e sem parecidos', () => {
    const minimo: FilmeDetalheTmdb = {
      ...resumoBase,
      backdrop_path: null,
      overview: '',
      runtime: null,
      genres: [],
    };
    const d = normalizarDetalhe(minimo);
    expect(d.diretor).toBeNull();
    expect(d.elenco).toEqual([]);
    expect(d.trailerYoutube).toBeNull();
    expect(d.parecidos).toEqual([]);
  });
});
