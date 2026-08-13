import { cache } from 'react';
import { buscarNoTmdb, CACHE } from './cliente';
import { urlImagem, type Provedor } from './normalizar';
import type { GeneroTmdb, ProvedorTmdb } from './tipos';

export const MAXIMO_PROVEDORES = 12;

export interface Genero {
  id: number;
  nome: string;
}

/** Puro, para poder ser testado sem rede. */
export function ordenarEcortarProvedores(brutos: ProvedorTmdb[]): Provedor[] {
  return [...brutos]
    .sort((a, b) => a.display_priority - b.display_priority)
    .flatMap((p) => {
      const logo = urlImagem(p.logo_path, 'w92');
      return logo
        ? [
            {
              id: p.provider_id,
              nome: p.provider_name,
              logo,
            },
          ]
        : [];
    })
    .slice(0, MAXIMO_PROVEDORES);
}

export const obterProvedores = cache(async (): Promise<Provedor[]> => {
  const resposta = await buscarNoTmdb<{ results: ProvedorTmdb[] }>(
    '/watch/providers/movie',
    { watch_region: 'BR' },
    CACHE.provedores,
  );
  return ordenarEcortarProvedores(resposta.results ?? []);
});

export const obterGeneros = cache(async (): Promise<Genero[]> => {
  const resposta = await buscarNoTmdb<{ genres: GeneroTmdb[] }>(
    '/genre/movie/list',
    {},
    CACHE.generos,
  );
  return (resposta.genres ?? []).map((g) => ({ id: g.id, nome: g.name }));
});
