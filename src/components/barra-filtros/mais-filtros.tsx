import Link from 'next/link';
import { ROTULO_DURACAO } from '@/lib/filtros/descrever';
import { comFiltros, DURACOES, type Filtros } from '@/lib/filtros/schema';

const IDIOMAS: { codigo: string; rotulo: string }[] = [
  { codigo: 'pt', rotulo: 'Português' },
  { codigo: 'en', rotulo: 'Inglês' },
  { codigo: 'es', rotulo: 'Espanhol' },
  { codigo: 'fr', rotulo: 'Francês' },
  { codigo: 'ja', rotulo: 'Japonês' },
  { codigo: 'ko', rotulo: 'Coreano' },
];

function Opcao({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`etiqueta rounded-sm border px-3 py-1.5 ${
        ativo ? 'border-acento !text-acento' : 'border-borda hover:!text-texto'
      }`}
    >
      {children}
    </Link>
  );
}

export function MaisFiltros({ filtros }: { filtros: Filtros }) {
  return (
    <details className="border-t border-borda pt-4">
      <summary className="etiqueta cursor-pointer list-none hover:text-texto">
        + mais filtros
      </summary>

      <div className="mt-5 space-y-5">
        <div>
          <p className="etiqueta mb-2">duração</p>
          <div className="flex flex-wrap gap-2">
            {DURACOES.map((duracao) => (
              <Opcao
                key={duracao}
                ativo={filtros.duracao === duracao}
                href={comFiltros({
                  ...filtros,
                  duracao: filtros.duracao === duracao ? null : duracao,
                  pagina: 1,
                })}
              >
                {ROTULO_DURACAO[duracao]}
              </Opcao>
            ))}
          </div>
        </div>

        <div>
          <p className="etiqueta mb-2">idioma original</p>
          <div className="flex flex-wrap gap-2">
            {IDIOMAS.map((idioma) => (
              <Opcao
                key={idioma.codigo}
                ativo={filtros.idioma === idioma.codigo}
                href={comFiltros({
                  ...filtros,
                  idioma: filtros.idioma === idioma.codigo ? null : idioma.codigo,
                  pagina: 1,
                })}
              >
                {idioma.rotulo}
              </Opcao>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
