import Image from 'next/image';
import type { Provedor } from '@/lib/tmdb/normalizar';

function Grupo({ rotulo, provedores }: { rotulo: string; provedores: Provedor[] }) {
  return (
    <div>
      <p className="etiqueta mb-3">{rotulo}</p>
      <ul className="flex flex-wrap items-center gap-2.5">
        {provedores.map((provedor) => (
          <li
            key={provedor.id}
            className="flex items-center gap-2.5 rounded-full border border-borda bg-elevado/70 py-1.5 pl-1.5 pr-4"
          >
            {/* Sem link: o TMDB não fornece endereço do provedor. */}
            <Image src={provedor.logo} alt="" width={36} height={36} className="rounded-full" />
            <span className="text-sm">{provedor.nome}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  provedores: Provedor[];
  provedoresGratis: Provedor[];
}

export function SelosProvedor({ provedores, provedoresGratis }: Props) {
  const temAlgum = provedores.length > 0 || provedoresGratis.length > 0;

  return (
    <section aria-labelledby="onde-assistir">
      <h2 id="onde-assistir" className="titulo-secao mb-5">
        onde assistir
      </h2>

      {temAlgum ? (
        <div className="space-y-6">
          {provedores.length > 0 && <Grupo rotulo="na assinatura" provedores={provedores} />}
          {provedoresGratis.length > 0 && (
            <Grupo rotulo="grátis com anúncio" provedores={provedoresGratis} />
          )}
        </div>
      ) : (
        <p className="max-w-prose text-sm text-suave">
          Este filme não está em nenhum serviço de streaming por assinatura no Brasil no momento.
          Ele pode estar disponível para aluguel ou compra.
        </p>
      )}

      <p className="mt-3 text-xs text-suave">Disponibilidade fornecida por JustWatch.</p>
    </section>
  );
}
