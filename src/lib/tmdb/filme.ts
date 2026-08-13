import { cache } from 'react';
import { buscarNoTmdb, CACHE, ErroTmdb } from './cliente';
import { normalizarDetalhe, type FilmeDetalhe } from './normalizar';
import type { FilmeDetalheTmdb } from './tipos';

const EXTRAS = 'credits,videos,similar,watch/providers';

export const obterFilme = cache(async (id: number): Promise<FilmeDetalhe | null> => {
  let bruto: FilmeDetalheTmdb;

  try {
    bruto = await buscarNoTmdb<FilmeDetalheTmdb>(
      `/movie/${id}`,
      { append_to_response: EXTRAS },
      CACHE.filme,
    );
  } catch (erro) {
    if (erro instanceof ErroTmdb && erro.status === 404) return null;
    throw erro;
  }

  // Muitos filmes não têm sinopse traduzida. Vale uma segunda ida — é rara e fica em cache.
  if (!bruto.overview.trim()) {
    try {
      const emIngles = await buscarNoTmdb<{ overview: string }>(
        `/movie/${id}`,
        { language: 'en-US' },
        CACHE.filme,
      );
      bruto = { ...bruto, overview: emIngles.overview };
    } catch {
      // Sinopse é opcional: se a segunda tentativa falhar, a página segue sem ela.
    }
  }

  return normalizarDetalhe(bruto);
});
