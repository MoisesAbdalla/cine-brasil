import Link from 'next/link';
import type { Chip } from '@/lib/filtros/descrever';

export function ChipsAtivos({ chips }: { chips: Chip[] }) {
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.chave}>
          <Link
            href={chip.hrefRemover}
            className="etiqueta inline-flex items-center gap-2 rounded-sm bg-acento px-3 py-1.5 !text-sobre-acento"
          >
            {chip.rotulo}
            <span aria-hidden="true">✕</span>
            <span className="sr-only">remover filtro</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
