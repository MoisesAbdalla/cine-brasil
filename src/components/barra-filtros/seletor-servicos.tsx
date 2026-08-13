import Image from 'next/image';
import Link from 'next/link';
import { comFiltros, type Filtros } from '@/lib/filtros/schema';
import type { Provedor } from '@/lib/tmdb/normalizar';

interface Props {
  filtros: Filtros;
  provedores: Provedor[];
}

export function SeletorServicos({ filtros, provedores }: Props) {
  return (
    <div>
      <p className="etiqueta mb-3">disponível na assinatura</p>
      <ul className="flex flex-wrap gap-3">
        {provedores.map((provedor) => {
          const ativo = filtros.servicos.includes(provedor.id);
          const servicos = ativo
            ? filtros.servicos.filter((id) => id !== provedor.id)
            : [...filtros.servicos, provedor.id];

          return (
            <li key={provedor.id}>
              <Link
                href={comFiltros({ ...filtros, servicos, pagina: 1 })}
                aria-label={`${ativo ? 'Remover' : 'Filtrar por'} ${provedor.nome}`}
                aria-pressed={ativo}
                className={`block overflow-hidden rounded-full border-2 transition ${
                  ativo ? 'border-acento' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={provedor.logo} alt={provedor.nome} width={44} height={44} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
