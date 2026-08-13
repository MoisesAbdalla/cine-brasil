import type { Metadata } from 'next';
import { ListaQueroVer } from '@/components/lista-quero-ver';

export const metadata: Metadata = {
  title: 'Minha lista',
  description: 'Os filmes que você guardou para assistir depois.',
  // A lista vive só no navegador de quem acessa; não há nada aqui para indexar.
  robots: { index: false, follow: true },
};

export default function PaginaQueroVer() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Minha lista</h1>
        <p className="mt-2 max-w-prose text-sm text-suave">
          Guardada neste navegador, sem conta e sem servidor.
        </p>
      </div>

      <ListaQueroVer />
    </div>
  );
}
