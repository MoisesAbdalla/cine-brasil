import { CartaoFilme } from './cartao-filme';
import type { FilmeParaCartao } from '@/lib/tmdb/normalizar';

export function GradeFilmes({ filmes }: { filmes: FilmeParaCartao[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {filmes.map((filme) => (
        <CartaoFilme key={filme.id} filme={filme} />
      ))}
    </div>
  );
}
