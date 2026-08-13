import Link from 'next/link';
import { comFiltros, type Filtros } from '@/lib/filtros/schema';

interface Props {
  filtros: Filtros;
  pagina: number;
  totalPaginas: number;
  base?: string;
  /** Parâmetros que não são filtros e precisam sobreviver à troca de página (ex.: o termo da busca). */
  extras?: Record<string, string>;
}

function montarLink(
  filtros: Filtros,
  novaPagina: number,
  base: string,
  extras?: Record<string, string>,
): string {
  const url = comFiltros({ ...filtros, pagina: novaPagina }, base);
  if (!extras || Object.keys(extras).length === 0) return url;
  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}${new URLSearchParams(extras).toString()}`;
}

export function Paginacao({ filtros, pagina, totalPaginas, base = '/', extras }: Props) {
  if (totalPaginas <= 1) return null;

  const anterior = pagina > 1 ? montarLink(filtros, pagina - 1, base, extras) : null;
  const proxima = pagina < totalPaginas ? montarLink(filtros, pagina + 1, base, extras) : null;

  return (
    <nav className="mt-12 flex items-center justify-between border-t border-borda pt-6">
      {anterior ? (
        <Link href={anterior} rel="prev" className="etiqueta hover:text-texto">
          ← Anterior
        </Link>
      ) : (
        <span className="etiqueta">← Anterior</span>
      )}

      <span className="etiqueta">
        Página {pagina} de {totalPaginas}
      </span>

      {proxima ? (
        <Link href={proxima} rel="next" className="etiqueta hover:text-texto">
          Próxima →
        </Link>
      ) : (
        <span className="etiqueta">Próxima →</span>
      )}
    </nav>
  );
}
