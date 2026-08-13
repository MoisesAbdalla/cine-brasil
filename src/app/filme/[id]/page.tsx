import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { GradeFilmes } from '@/components/grade-filmes';
import { BotaoQueroVer } from '@/components/botao-quero-ver';
import { SelosProvedor } from '@/components/selos-provedor';
import { Trailer } from '@/components/trailer';
import { obterFilme } from '@/lib/tmdb/filme';

interface Props {
  params: Promise<{ id: string }>;
}

function idValido(bruto: string): number | null {
  const id = Number(bruto);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = idValido((await params).id);
  const filme = id ? await obterFilme(id) : null;
  if (!filme) return { title: 'Filme não encontrado' };

  const descricao =
    filme.sinopse ??
    `${filme.titulo}${filme.ano ? ` (${filme.ano})` : ''} — disponibilidade no streaming brasileiro.`;

  return {
    title: filme.titulo,
    description: descricao.slice(0, 160),
    openGraph: {
      title: filme.titulo,
      description: descricao.slice(0, 160),
      images: filme.fundo ? [filme.fundo] : filme.poster ? [filme.poster] : [],
      type: 'video.movie',
    },
  };
}

export default async function PaginaFilme({ params }: Props) {
  const id = idValido((await params).id);
  if (!id) notFound();

  const filme = await obterFilme(id);
  if (!filme) notFound();

  return (
    <article className="space-y-10">
      <header className="relative">
        {filme.fundo && (
          <div className="relative -mx-5 mb-6 h-[34vh] max-h-[320px] min-h-[180px] overflow-hidden">
            <Image
              src={filme.fundo}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-fundo to-transparent" />
          </div>
        )}

        <div className="flex flex-col gap-6 sm:flex-row">
          {filme.poster && (
            <Image
              src={filme.poster}
              alt={`Pôster de ${filme.titulo}`}
              width={180}
              height={270}
              className="w-32 shrink-0 sm:w-44"
            />
          )}

          <div>
            <h1 className="font-serif text-4xl leading-tight">{filme.titulo}</h1>
            <p className="mt-3 text-sm text-suave">
              {[
                filme.ano ?? '—',
                filme.duracao ? `${filme.duracao} min` : null,
                filme.generos.join(', ') || null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {filme.nota !== null && (
              <p className="mt-2 text-sm">
                Nota <span className="font-semibold text-acento">{filme.nota.toFixed(1)}</span>
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <BotaoQueroVer
                filme={{
                  id: filme.id,
                  titulo: filme.titulo,
                  ano: filme.ano,
                  poster: filme.poster,
                  nota: filme.nota,
                }}
              />
              {filme.trailerYoutube && (
                <Trailer youtubeId={filme.trailerYoutube} titulo={filme.titulo} />
              )}
            </div>
          </div>
        </div>
      </header>

      <SelosProvedor provedores={filme.provedores} provedoresGratis={filme.provedoresGratis} />

      {filme.sinopse && (
        <section>
          <h2 className="etiqueta mb-3">sinopse</h2>
          <p className="max-w-prose leading-relaxed">{filme.sinopse}</p>
        </section>
      )}

      {(filme.diretor || filme.elenco.length > 0) && (
        <section>
          <h2 className="etiqueta mb-3">quem fez</h2>
          {filme.diretor && (
            <p className="mb-4 text-sm">
              Direção de <span className="font-serif text-base">{filme.diretor}</span>
            </p>
          )}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {filme.elenco.map((pessoa) => (
              <li key={`${pessoa.nome}-${pessoa.personagem}`} className="flex items-center gap-3">
                {pessoa.foto ? (
                  <Image
                    src={pessoa.foto}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-full bg-superficie" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm">{pessoa.nome}</p>
                  <p className="truncate text-xs text-suave">{pessoa.personagem}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {filme.parecidos.length > 0 && (
        <section>
          <h2 className="etiqueta mb-4">parecidos</h2>
          <GradeFilmes filmes={filme.parecidos} />
        </section>
      )}
    </article>
  );
}
