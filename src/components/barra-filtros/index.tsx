import Link from 'next/link';
import { chipsAtivos, type Catalogos } from '@/lib/filtros/descrever';
import { comFiltros, type Filtros } from '@/lib/filtros/schema';
import { ChipsAtivos } from './chips';
import { MaisFiltros } from './mais-filtros';
import { SeletorServicos } from './seletor-servicos';

const FAIXAS_ANO: { rotulo: string; inicio: number; fim: number }[] = [
  { rotulo: 'Últimos 5 anos', inicio: new Date().getFullYear() - 5, fim: new Date().getFullYear() },
  { rotulo: 'Anos 2010', inicio: 2010, fim: 2019 },
  { rotulo: 'Anos 2000', inicio: 2000, fim: 2009 },
  { rotulo: 'Antes de 2000', inicio: 1900, fim: 1999 },
];

const NOTAS = [6, 7, 8];

interface Props {
  filtros: Filtros;
  catalogos: Catalogos;
}

export function BarraFiltros({ filtros, catalogos }: Props) {
  const chips = chipsAtivos(filtros, catalogos);

  return (
    <section className="space-y-6" aria-label="Filtros">
      <SeletorServicos filtros={filtros} provedores={catalogos.provedores} />

      <div className="flex flex-wrap gap-2">
        {catalogos.generos.slice(0, 10).map((genero) => {
          const ativo = filtros.generos.includes(genero.id);
          const generos = ativo
            ? filtros.generos.filter((id) => id !== genero.id)
            : [...filtros.generos, genero.id];
          return (
            <Link
              key={genero.id}
              href={comFiltros({ ...filtros, generos, pagina: 1 })}
              className={`etiqueta rounded-sm border px-3 py-1.5 ${
                ativo ? 'border-acento !text-acento' : 'border-borda hover:!text-texto'
              }`}
            >
              {genero.nome}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {FAIXAS_ANO.map((faixa) => {
          const ativo = filtros.anoInicio === faixa.inicio && filtros.anoFim === faixa.fim;
          return (
            <Link
              key={faixa.rotulo}
              href={comFiltros({
                ...filtros,
                anoInicio: ativo ? null : faixa.inicio,
                anoFim: ativo ? null : faixa.fim,
                pagina: 1,
              })}
              className={`etiqueta rounded-sm border px-3 py-1.5 ${
                ativo ? 'border-acento !text-acento' : 'border-borda hover:!text-texto'
              }`}
            >
              {faixa.rotulo}
            </Link>
          );
        })}

        {NOTAS.map((nota) => {
          const ativo = filtros.notaMinima === nota;
          return (
            <Link
              key={nota}
              href={comFiltros({ ...filtros, notaMinima: ativo ? null : nota, pagina: 1 })}
              className={`etiqueta rounded-sm border px-3 py-1.5 ${
                ativo ? 'border-acento !text-acento' : 'border-borda hover:!text-texto'
              }`}
            >
              Nota {nota}+
            </Link>
          );
        })}
      </div>

      <MaisFiltros filtros={filtros} />

      {chips.length > 0 && (
        <div className="space-y-2">
          <p className="etiqueta">filtros ativos</p>
          <ChipsAtivos chips={chips} />
        </div>
      )}
    </section>
  );
}
