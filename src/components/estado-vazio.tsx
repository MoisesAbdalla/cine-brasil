import Link from 'next/link';
import { sugerirAfrouxamento } from '@/lib/filtros/descrever';
import type { Filtros } from '@/lib/filtros/schema';

export function EstadoVazio({ filtros }: { filtros: Filtros }) {
  const sugestao = sugerirAfrouxamento(filtros);

  return (
    <div className="border border-borda px-6 py-16 text-center">
      <h2 className="font-serif text-2xl">Nenhum filme com esses filtros</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-suave">
        {sugestao?.mensagem ?? 'Essa combinação de filtros não devolveu nada no catálogo de assinatura.'}
      </p>

      {filtros.servicos.length > 0 && (
        <p className="mx-auto mt-4 max-w-md text-xs text-suave">
          Alguns serviços da lista — como Google Play e Apple TV — só oferecem aluguel e compra, e
          por isso nunca aparecem numa busca por assinatura.
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {sugestao && (
          <Link
            href={sugestao.href}
            className="rounded-sm bg-acento px-5 py-2 text-sm font-semibold text-sobre-acento"
          >
            {sugestao.rotuloAcao}
          </Link>
        )}
        <Link href="/" className="etiqueta self-center hover:text-texto">
          limpar tudo
        </Link>
      </div>
    </div>
  );
}
