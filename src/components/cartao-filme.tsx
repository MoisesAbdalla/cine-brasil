import Image from 'next/image';
import Link from 'next/link';
import type { FilmeResumo } from '@/lib/tmdb/normalizar';

export function CartaoFilme({ filme }: { filme: FilmeResumo }) {
  return (
    <Link href={`/filme/${filme.id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden bg-superficie">
        {filme.poster ? (
          <Image
            src={filme.poster}
            alt={`Pôster de ${filme.titulo}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23vw, 200px"
            className="object-cover transition-opacity group-hover:opacity-80"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center">
            <span className="etiqueta">sem pôster</span>
          </div>
        )}
      </div>
      <h3 className="mt-2 font-serif text-base leading-tight">{filme.titulo}</h3>
      <p className="mt-1 text-xs text-suave">
        {filme.ano ?? '—'}
        {filme.nota !== null && (
          <>
            {' · '}
            <span className="font-semibold text-acento">{filme.nota.toFixed(1)}</span>
          </>
        )}
      </p>
    </Link>
  );
}
