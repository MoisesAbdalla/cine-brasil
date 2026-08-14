import Image from 'next/image';
import Link from 'next/link';
import type { FilmeParaCartao } from '@/lib/tmdb/normalizar';

/**
 * O pôster sem moldura: nada de cartão, borda ou fundo competindo com a arte.
 * No hover ele levanta e um risco lima se desenha embaixo — o único movimento
 * da grade, e o único lugar onde o acento aparece aqui além da nota.
 */
export function CartaoFilme({ filme }: { filme: FilmeParaCartao }) {
  return (
    <Link href={`/filme/${filme.id}`} className="group block focus:outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-[3px] bg-superficie shadow-[0_10px_30px_-12px_rgb(0_0_0/0.8)] transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_50px_-16px_rgb(0_0_0/0.95)] group-focus-visible:-translate-y-1.5 group-focus-visible:ring-2 group-focus-visible:ring-acento motion-reduce:transform-none motion-reduce:transition-none">
        {filme.poster ? (
          <Image
            src={filme.poster}
            alt={`Pôster de ${filme.titulo}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23vw, 200px"
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center">
            <span className="etiqueta">sem pôster</span>
          </div>
        )}

        {/* Véu que só aparece no hover, para o pôster ganhar profundidade. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-fundo/80 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100 motion-reduce:transition-none"
        />
      </div>

      <div
        aria-hidden="true"
        className="mt-2 h-px origin-left scale-x-0 bg-acento transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />

      <h3 className="mt-2 font-serif text-base leading-tight transition-colors group-hover:text-acento motion-reduce:transition-none">
        {filme.titulo}
      </h3>
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
