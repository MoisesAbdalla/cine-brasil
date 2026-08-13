import 'server-only';

const BASE = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 8000;

/** Prazos de revalidação, em segundos. Cada dado envelhece no seu ritmo. */
export const CACHE = {
  generos: 60 * 60 * 24 * 7,
  provedores: 60 * 60 * 24,
  descoberta: 60 * 60 * 6,
  filme: 60 * 60 * 12,
  busca: 60 * 60,
} as const;

export class ErroTmdb extends Error {
  readonly status: number | undefined;

  constructor(mensagem: string, status?: number, opcoes?: { cause?: unknown }) {
    super(mensagem, opcoes);
    this.name = 'ErroTmdb';
    this.status = status;
  }
}

export async function buscarNoTmdb<T>(
  caminho: string,
  parametros: Record<string, string>,
  revalidarEmSegundos: number,
): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new ErroTmdb('TMDB_ACCESS_TOKEN não está configurado');
  }

  const url = new URL(BASE + caminho);
  url.searchParams.set('language', 'pt-BR');
  for (const [chave, valor] of Object.entries(parametros)) {
    url.searchParams.set(chave, valor);
  }

  let resposta: Response;
  try {
    resposta = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: revalidarEmSegundos },
    });
  } catch (causa) {
    throw new ErroTmdb(`Falha ao falar com o TMDB: ${String(causa)}`, undefined, { cause: causa });
  }

  if (!resposta.ok) {
    throw new ErroTmdb(`TMDB respondeu ${resposta.status} em ${caminho}`, resposta.status);
  }

  let corpo: T;
  try {
    corpo = (await resposta.json()) as T;
  } catch (causa) {
    throw new ErroTmdb(
      `Falha ao ler resposta do TMDB em ${caminho}: ${String(causa)}`,
      undefined,
      { cause: causa },
    );
  }

  return corpo;
}
