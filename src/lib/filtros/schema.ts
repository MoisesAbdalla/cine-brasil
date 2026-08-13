import { z } from 'zod';

export const ORDENS = ['populares', 'nota', 'lancamento', 'titulo'] as const;
export type Ordem = (typeof ORDENS)[number];

export const DURACOES = ['ate-90', '90-120', 'acima-120'] as const;
export type Duracao = (typeof DURACOES)[number];

export const ANO_MINIMO = 1900;
export function anoMaximo(): number {
  return new Date().getFullYear() + 1;
}
export const PAGINA_MAXIMA = 500;
export const MAXIMO_IDS = 20;

export interface Filtros {
  servicos: number[];
  generos: number[];
  anoInicio: number | null;
  anoFim: number | null;
  notaMinima: number | null;
  duracao: Duracao | null;
  idioma: string | null;
  incluirGratis: boolean;
  ordem: Ordem;
  pagina: number;
}

export const FILTROS_PADRAO: Filtros = {
  servicos: [],
  generos: [],
  anoInicio: null,
  anoFim: null,
  notaMinima: null,
  duracao: null,
  idioma: null,
  incluirGratis: false,
  ordem: 'populares',
  pagina: 1,
};

export type ParamsBrutos = Record<string, string | string[] | undefined>;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function listaDeIds(valor: string | string[] | undefined): number[] {
  const texto = primeiro(valor);
  if (!texto) return [];
  const ids = texto
    .split(',')
    .map((parte) => Number(parte.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)].slice(0, MAXIMO_IDS);
}

function faixaDeAnos(valor: string | string[] | undefined): { inicio: number | null; fim: number | null } {
  const vazia = { inicio: null, fim: null };
  const texto = primeiro(valor);
  if (!texto) return vazia;

  const casamento = /^(\d{4})-(\d{4})$/.exec(texto);
  if (!casamento) return vazia;

  const inicio = Number(casamento[1]);
  const fim = Number(casamento[2]);
  if (inicio > fim) return vazia;
  if (inicio < ANO_MINIMO || fim > anoMaximo()) return vazia;

  return { inicio, fim };
}

const notaSchema = z.coerce.number().int().min(1).max(9).nullable().catch(null);
const duracaoSchema = z.enum(DURACOES).nullable().catch(null);
const idiomaSchema = z.string().regex(/^[a-z]{2}$/).nullable().catch(null);
const ordemSchema = z.enum(ORDENS).catch('populares');
const paginaSchema = z.coerce.number().int().min(1).max(PAGINA_MAXIMA).catch(1);

export function lerFiltros(params: ParamsBrutos): Filtros {
  const anos = faixaDeAnos(params.ano);

  return {
    servicos: listaDeIds(params.servico),
    generos: listaDeIds(params.genero),
    anoInicio: anos.inicio,
    anoFim: anos.fim,
    notaMinima: notaSchema.parse(primeiro(params.nota) ?? null),
    duracao: duracaoSchema.parse(primeiro(params.duracao) ?? null),
    idioma: idiomaSchema.parse(primeiro(params.idioma) ?? null),
    incluirGratis: primeiro(params.gratis) === '1',
    ordem: ordemSchema.parse(primeiro(params.ordem)),
    pagina: paginaSchema.parse(primeiro(params.pagina) ?? 1),
  };
}

export function paraQueryString(filtros: Filtros): string {
  const params = new URLSearchParams();
  if (filtros.servicos.length) params.set('servico', filtros.servicos.join(','));
  if (filtros.generos.length) params.set('genero', filtros.generos.join(','));
  if (filtros.anoInicio && filtros.anoFim) params.set('ano', `${filtros.anoInicio}-${filtros.anoFim}`);
  if (filtros.notaMinima) params.set('nota', String(filtros.notaMinima));
  if (filtros.duracao) params.set('duracao', filtros.duracao);
  if (filtros.idioma) params.set('idioma', filtros.idioma);
  if (filtros.incluirGratis) params.set('gratis', '1');
  if (filtros.ordem !== 'populares') params.set('ordem', filtros.ordem);
  if (filtros.pagina > 1) params.set('pagina', String(filtros.pagina));
  return params.toString();
}

export function comFiltros(filtros: Filtros, base = '/'): string {
  const query = paraQueryString(filtros);
  return query ? `${base}?${query}` : base;
}
