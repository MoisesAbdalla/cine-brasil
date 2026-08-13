import type { FilmeDetalheTmdb, FilmeResumoTmdb } from './tipos';

const CDN = 'https://image.tmdb.org/t/p';
const MAXIMO_ELENCO = 8;
const MAXIMO_PARECIDOS = 12;

export interface FilmeResumo {
  id: number;
  titulo: string;
  ano: number | null;
  poster: string | null;
  nota: number | null;
}

export interface Provedor {
  id: number;
  nome: string;
  logo: string;
}

export interface PessoaElenco {
  nome: string;
  personagem: string;
  foto: string | null;
}

export interface FilmeDetalhe extends FilmeResumo {
  fundo: string | null;
  sinopse: string | null;
  duracao: number | null;
  generos: string[];
  diretor: string | null;
  elenco: PessoaElenco[];
  trailerYoutube: string | null;
  provedores: Provedor[];
  parecidos: FilmeResumo[];
}

export function urlImagem(caminho: string | null, tamanho: string): string | null {
  return caminho ? `${CDN}/${tamanho}${caminho}` : null;
}

export function normalizarResumo(bruto: FilmeResumoTmdb): FilmeResumo {
  const ano = bruto.release_date ? Number(bruto.release_date.slice(0, 4)) : NaN;

  return {
    id: bruto.id,
    titulo: bruto.title,
    ano: Number.isInteger(ano) && ano > 0 ? ano : null,
    poster: urlImagem(bruto.poster_path, 'w342'),
    // Nota 0 no TMDB significa "ninguém votou", não "é péssimo".
    nota: bruto.vote_average > 0 ? Math.round(bruto.vote_average * 10) / 10 : null,
  };
}

export function normalizarDetalhe(bruto: FilmeDetalheTmdb): FilmeDetalhe {
  const equipe = bruto.credits?.crew ?? [];
  const elenco = bruto.credits?.cast ?? [];
  const videos = bruto.videos?.results ?? [];
  const provedoresBr = bruto['watch/providers']?.results?.BR?.flatrate ?? [];

  const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer');

  return {
    ...normalizarResumo(bruto),
    fundo: urlImagem(bruto.backdrop_path, 'w1280'),
    sinopse: bruto.overview.trim() || null,
    duracao: bruto.runtime && bruto.runtime > 0 ? bruto.runtime : null,
    generos: bruto.genres.map((g) => g.name),
    diretor: equipe.find((p) => p.job === 'Director')?.name ?? null,
    elenco: elenco.slice(0, MAXIMO_ELENCO).map((p) => ({
      nome: p.name,
      personagem: p.character,
      foto: urlImagem(p.profile_path, 'w185'),
    })),
    trailerYoutube: trailer?.key ?? null,
    provedores: provedoresBr.flatMap((p) => {
      const logo = urlImagem(p.logo_path, 'w92');
      return logo ? [{ id: p.provider_id, nome: p.provider_name, logo }] : [];
    }),
    parecidos: (bruto.similar?.results ?? []).slice(0, MAXIMO_PARECIDOS).map(normalizarResumo),
  };
}
