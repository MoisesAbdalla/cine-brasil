/**
 * Lista de "quero ver", guardada no próprio navegador.
 *
 * Guarda o resumo inteiro do filme, não só o id: assim a página da lista
 * renderiza sem nenhuma chamada à API, mesmo com dezenas de itens.
 */

export interface FilmeSalvo {
  id: number;
  titulo: string;
  ano: number | null;
  poster: string | null;
  nota: number | null;
}

export const CHAVE = 'cine-brasil:quero-ver';
export const MAXIMO = 200;

/** Devolve null em servidor, em navegador sem suporte, e quando o acesso é negado. */
function armazenamento(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function ehFilmeSalvo(valor: unknown): valor is FilmeSalvo {
  if (typeof valor !== 'object' || valor === null) return false;
  const item = valor as Record<string, unknown>;
  return typeof item.id === 'number' && Number.isInteger(item.id) && typeof item.titulo === 'string';
}

export function ler(): FilmeSalvo[] {
  const memoria = armazenamento();
  if (!memoria) return [];

  const bruto = memoria.getItem(CHAVE);
  if (!bruto) return [];

  try {
    const analisado: unknown = JSON.parse(bruto);
    if (!Array.isArray(analisado)) return [];
    return analisado.filter(ehFilmeSalvo).slice(0, MAXIMO);
  } catch {
    // Conteúdo corrompido por outra aba, extensão ou edição manual.
    return [];
  }
}

function salvar(lista: FilmeSalvo[]): FilmeSalvo[] {
  const memoria = armazenamento();
  const cortada = lista.slice(0, MAXIMO);

  if (memoria) {
    try {
      memoria.setItem(CHAVE, JSON.stringify(cortada));
    } catch {
      // Cota estourada ou modo privado: a lista da sessão continua valendo.
    }
  }

  for (const ouvinte of ouvintes) ouvinte();
  return cortada;
}

/*
 * Camada de assinatura, para os componentes lerem a lista com
 * `useSyncExternalStore` em vez de copiar o estado para dentro de um efeito.
 * O instantâneo precisa ser referencialmente estável entre renders: por isso o
 * texto cru é comparado antes de reanalisar, e a lista anterior é reaproveitada
 * quando nada mudou.
 */
const VAZIO: FilmeSalvo[] = [];
const ouvintes = new Set<() => void>();
let textoLido: string | null = null;
let listaLida: FilmeSalvo[] = VAZIO;

export function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function instantaneo(): FilmeSalvo[] {
  const texto = armazenamento()?.getItem(CHAVE) ?? null;
  if (texto !== textoLido) {
    textoLido = texto;
    listaLida = ler();
  }
  return listaLida;
}

/** No servidor a lista não existe; devolver sempre a mesma referência evita laço de render. */
export function instantaneoServidor(): FilmeSalvo[] {
  return VAZIO;
}

export function contem(id: number): boolean {
  return ler().some((filme) => filme.id === id);
}

export function remover(id: number): FilmeSalvo[] {
  return salvar(ler().filter((filme) => filme.id !== id));
}

export function alternar(filme: FilmeSalvo): FilmeSalvo[] {
  const lista = ler();
  if (lista.some((salvo) => salvo.id === filme.id)) {
    return salvar(lista.filter((salvo) => salvo.id !== filme.id));
  }
  return salvar([filme, ...lista]);
}
