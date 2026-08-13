import Link from 'next/link';
import { comFiltros, ORDENS, type Filtros, type Ordem } from '@/lib/filtros/schema';

const ROTULO: Record<Ordem, string> = {
  populares: 'popularidade',
  nota: 'nota',
  lancamento: 'lançamento',
  titulo: 'título',
};

export function Ordenacao({ filtros }: { filtros: Filtros }) {
  return (
    <div className="etiqueta flex flex-wrap items-center gap-2">
      <span>ordenar por</span>
      {ORDENS.map((ordem) => (
        <Link
          key={ordem}
          href={comFiltros({ ...filtros, ordem, pagina: 1 })}
          className={ordem === filtros.ordem ? '!text-acento' : 'hover:!text-texto'}
        >
          {ROTULO[ordem]}
        </Link>
      ))}
    </div>
  );
}
