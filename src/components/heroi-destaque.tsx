import Image from 'next/image';
import Link from 'next/link';
import type { FilmeResumo } from '@/lib/tmdb/normalizar';

interface Props {
  filme: FilmeResumo;
  rotulo: string;
}

/**
 * A fotografia do filme do topo, em tela cheia, com o texto pousado sobre ela.
 *
 * O que separa isto de uma vitrine de streaming: o herói não é uma propaganda
 * fixa. Ele é o primeiro resultado dos filtros que a pessoa acabou de aplicar,
 * e a tarja diz exatamente por que ele está ali.
 */
export function HeroiDestaque({ filme, rotulo }: Props) {
  return (
    <section
      aria-labelledby="heroi-titulo"
      className="sangria relative -mt-[73px] mb-2 min-h-[68vh] overflow-hidden sm:min-h-[82vh]"
    >
      {filme.fundo ? (
        <Image
          src={filme.fundo}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_28%]"
        />
      ) : (
        <div className="absolute inset-0 bg-superficie" />
      )}

      <div className="cortina cortina-base" />
      <div className="cortina vinheta" />

      <div className="relative mx-auto flex min-h-[68vh] w-full max-w-7xl flex-col justify-end px-5 pb-16 pt-32 sm:min-h-[82vh] sm:pb-20">
        <div className="max-w-2xl">
          <p className="etiqueta !text-acento">{rotulo}</p>

          <h2 id="heroi-titulo" className="titulo-cartaz mt-4 text-texto">
            {filme.titulo}
          </h2>

          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-suave">
            {filme.nota !== null && (
              <span className="font-semibold text-acento">{filme.nota.toFixed(1)}</span>
            )}
            {filme.ano !== null && <span>{filme.ano}</span>}
            <span className="hidden sm:inline">Disponível por assinatura no Brasil</span>
          </p>

          {filme.sinopse && (
            <p className="mt-5 line-clamp-3 max-w-xl text-base leading-relaxed text-texto/85">
              {filme.sinopse}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/filme/${filme.id}`}
              className="rounded-sm bg-acento px-6 py-3 text-sm font-semibold text-sobre-acento transition hover:brightness-110"
            >
              Onde assistir
            </Link>
            <Link
              href={`/filme/${filme.id}`}
              className="rounded-sm border border-borda bg-fundo/40 px-6 py-3 text-sm backdrop-blur-sm transition hover:border-acento hover:text-acento"
            >
              Mais sobre o filme
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
