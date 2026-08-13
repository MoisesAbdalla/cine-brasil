import Image from 'next/image';
import type { Provedor } from '@/lib/tmdb/normalizar';

export function SelosProvedor({ provedores }: { provedores: Provedor[] }) {
  return (
    <section aria-labelledby="onde-assistir">
      <h2 id="onde-assistir" className="etiqueta mb-3">
        onde assistir
      </h2>

      {provedores.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-3">
          {provedores.map((provedor) => (
            <li key={provedor.id} className="flex items-center gap-2">
              {/* Sem link: o TMDB não fornece endereço do provedor. */}
              <Image
                src={provedor.logo}
                alt=""
                width={44}
                height={44}
                className="rounded-lg"
              />
              <span className="text-sm">{provedor.nome}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-prose text-sm text-suave">
          Este filme não está em nenhum serviço de streaming por assinatura no Brasil no momento.
          Ele pode estar disponível para aluguel ou compra.
        </p>
      )}

      <p className="mt-3 text-xs text-suave">
        Disponibilidade fornecida por JustWatch.
      </p>
    </section>
  );
}
