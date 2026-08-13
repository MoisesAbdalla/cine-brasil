import type { Genero } from '@/lib/tmdb/catalogos';
import type { Provedor } from '@/lib/tmdb/normalizar';
import { comFiltros, type Duracao, type Filtros } from './schema';

export interface Catalogos {
  provedores: Provedor[];
  generos: Genero[];
}

export interface Chip {
  chave: string;
  rotulo: string;
  hrefRemover: string;
}

export interface Sugestao {
  mensagem: string;
  rotuloAcao: string;
  href: string;
}

/** Exportado porque o painel "+ mais filtros" mostra os mesmos rótulos. */
export const ROTULO_DURACAO: Record<Duracao, string> = {
  'ate-90': 'Até 90 min',
  '90-120': '90 a 120 min',
  'acima-120': 'Mais de 120 min',
};

/** Exportado porque o painel "+ mais filtros" mostra os mesmos idiomas. */
export const IDIOMAS: { codigo: string; rotulo: string }[] = [
  { codigo: 'pt', rotulo: 'Português' },
  { codigo: 'en', rotulo: 'Inglês' },
  { codigo: 'es', rotulo: 'Espanhol' },
  { codigo: 'fr', rotulo: 'Francês' },
  { codigo: 'ja', rotulo: 'Japonês' },
  { codigo: 'ko', rotulo: 'Coreano' },
];

const ROTULO_IDIOMA: Record<string, string> = Object.fromEntries(
  IDIOMAS.map(({ codigo, rotulo }) => [codigo, `Em ${rotulo.toLowerCase()}`]),
);

/** Toda mudança de filtro volta para a primeira página. */
function semPagina(filtros: Filtros): Filtros {
  return { ...filtros, pagina: 1 };
}

function rotuloIdioma(codigo: string): string {
  return ROTULO_IDIOMA[codigo] ?? `Idioma: ${codigo}`;
}

export function chipsAtivos(filtros: Filtros, catalogos: Catalogos): Chip[] {
  const chips: Chip[] = [];

  for (const id of filtros.servicos) {
    const provedor = catalogos.provedores.find((p) => p.id === id);
    if (!provedor) continue;
    chips.push({
      chave: `servico-${id}`,
      rotulo: provedor.nome,
      hrefRemover: comFiltros(
        semPagina({ ...filtros, servicos: filtros.servicos.filter((s) => s !== id) }),
      ),
    });
  }

  for (const id of filtros.generos) {
    const genero = catalogos.generos.find((g) => g.id === id);
    if (!genero) continue;
    chips.push({
      chave: `genero-${id}`,
      rotulo: genero.nome,
      hrefRemover: comFiltros(
        semPagina({ ...filtros, generos: filtros.generos.filter((g) => g !== id) }),
      ),
    });
  }

  if (filtros.anoInicio && filtros.anoFim) {
    chips.push({
      chave: 'ano',
      rotulo: `${filtros.anoInicio}–${filtros.anoFim}`,
      hrefRemover: comFiltros(semPagina({ ...filtros, anoInicio: null, anoFim: null })),
    });
  }

  if (filtros.notaMinima) {
    chips.push({
      chave: 'nota',
      rotulo: `Nota ${filtros.notaMinima}+`,
      hrefRemover: comFiltros(semPagina({ ...filtros, notaMinima: null })),
    });
  }

  if (filtros.duracao) {
    chips.push({
      chave: 'duracao',
      rotulo: ROTULO_DURACAO[filtros.duracao],
      hrefRemover: comFiltros(semPagina({ ...filtros, duracao: null })),
    });
  }

  if (filtros.incluirGratis) {
    chips.push({
      chave: 'gratis',
      rotulo: 'Com grátis',
      hrefRemover: comFiltros(semPagina({ ...filtros, incluirGratis: false })),
    });
  }

  if (filtros.idioma) {
    chips.push({
      chave: 'idioma',
      rotulo: rotuloIdioma(filtros.idioma),
      hrefRemover: comFiltros(semPagina({ ...filtros, idioma: null })),
    });
  }

  return chips;
}

/**
 * Ordem de suspeita: nota, duração, faixa de anos, idioma. O serviço e o gênero
 * ficam de fora porque são a intenção do usuário, não um acidente de filtro.
 */
export function sugerirAfrouxamento(filtros: Filtros): Sugestao | null {
  if (filtros.notaMinima) {
    const nova = filtros.notaMinima > 6 ? filtros.notaMinima - 1 : null;
    return {
      mensagem: `Sua nota mínima ${filtros.notaMinima} está cortando quase tudo.`,
      rotuloAcao: nova ? `Tentar nota ${nova}` : 'Remover a nota mínima',
      href: comFiltros(semPagina({ ...filtros, notaMinima: nova })),
    };
  }

  if (filtros.duracao) {
    return {
      mensagem: 'O filtro de duração está estreitando muito o resultado.',
      rotuloAcao: 'Aceitar qualquer duração',
      href: comFiltros(semPagina({ ...filtros, duracao: null })),
    };
  }

  if (filtros.anoInicio && filtros.anoFim) {
    return {
      mensagem: `A faixa ${filtros.anoInicio}–${filtros.anoFim} deixa poucos filmes de fora do corte.`,
      rotuloAcao: 'Aceitar qualquer ano',
      href: comFiltros(semPagina({ ...filtros, anoInicio: null, anoFim: null })),
    };
  }

  if (filtros.idioma) {
    return {
      mensagem: 'O filtro de idioma está limitando bastante o catálogo.',
      rotuloAcao: 'Aceitar qualquer idioma',
      href: comFiltros(semPagina({ ...filtros, idioma: null })),
    };
  }

  return null;
}

function listar(nomes: string[]): string {
  if (nomes.length <= 1) return nomes[0] ?? '';
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

export function tituloDaPagina(filtros: Filtros, catalogos: Catalogos): string {
  const generos = filtros.generos
    .map((id) => catalogos.generos.find((g) => g.id === id)?.nome)
    .filter((nome): nome is string => Boolean(nome));

  const servicos = filtros.servicos
    .map((id) => catalogos.provedores.find((p) => p.id === id)?.nome)
    .filter((nome): nome is string => Boolean(nome));

  if (generos.length === 0 && servicos.length === 0) {
    return 'Filmes no streaming por assinatura no Brasil';
  }

  const parteGenero = generos.length ? `Filmes de ${listar(generos)}` : 'Filmes';
  const parteServico = servicos.length ? ` na ${listar(servicos)}` : '';

  return `${parteGenero}${parteServico}`;
}
