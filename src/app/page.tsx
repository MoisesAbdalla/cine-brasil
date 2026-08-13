import type { Metadata } from 'next';
import { BarraFiltros } from '@/components/barra-filtros';
import { EstadoVazio } from '@/components/estado-vazio';
import { GradeFilmes } from '@/components/grade-filmes';
import { Ordenacao } from '@/components/ordenacao';
import { Paginacao } from '@/components/paginacao';
import { tituloDaPagina } from '@/lib/filtros/descrever';
import { lerFiltros, type ParamsBrutos } from '@/lib/filtros/schema';
import { obterGeneros, obterProvedores } from '@/lib/tmdb/catalogos';
import { descobrirFilmes } from '@/lib/tmdb/descobrir';

interface Props {
  searchParams: Promise<ParamsBrutos>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filtros = lerFiltros(await searchParams);
  const [provedores, generos] = await Promise.all([obterProvedores(), obterGeneros()]);
  const titulo = tituloDaPagina(filtros, { provedores, generos });

  return {
    title: titulo,
    description: `${titulo}, disponíveis por assinatura no Brasil.`,
  };
}

export default async function PaginaDescoberta({ searchParams }: Props) {
  const filtros = lerFiltros(await searchParams);

  const [provedores, generos, resultado] = await Promise.all([
    obterProvedores(),
    obterGeneros(),
    descobrirFilmes(filtros),
  ]);

  const catalogos = { provedores, generos };

  return (
    <div className="space-y-8">
      <h1 className="sr-only">{tituloDaPagina(filtros, catalogos)}</h1>

      <BarraFiltros filtros={filtros} catalogos={catalogos} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borda pt-5">
        <p className="etiqueta">
          {resultado.totalResultados.toLocaleString('pt-BR')}{' '}
          {resultado.totalResultados === 1 ? 'filme' : 'filmes'}
        </p>
        <Ordenacao filtros={filtros} />
      </div>

      {resultado.filmes.length === 0 ? (
        <EstadoVazio filtros={filtros} />
      ) : (
        <>
          <h2 className="sr-only">Filmes encontrados</h2>
          <GradeFilmes filmes={resultado.filmes} />
          <Paginacao
            filtros={filtros}
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
          />
        </>
      )}
    </div>
  );
}
