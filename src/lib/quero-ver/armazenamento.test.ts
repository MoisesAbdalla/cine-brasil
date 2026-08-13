import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  alternar,
  contem,
  CHAVE,
  inscrever,
  instantaneo,
  instantaneoServidor,
  ler,
  MAXIMO,
  remover,
  type FilmeSalvo,
} from './armazenamento';

function armazenamentoFalso(): Storage {
  let dados: Record<string, string> = {};
  return {
    getItem: (chave: string) => dados[chave] ?? null,
    setItem: (chave: string, valor: string) => {
      dados[chave] = valor;
    },
    removeItem: (chave: string) => {
      delete dados[chave];
    },
    clear: () => {
      dados = {};
    },
    key: () => null,
    length: 0,
  } as Storage;
}

const filme = (id: number): FilmeSalvo => ({
  id,
  titulo: `Filme ${id}`,
  ano: 2020,
  poster: `https://image.tmdb.org/t/p/w342/${id}.jpg`,
  nota: 7.5,
});

beforeEach(() => {
  vi.stubGlobal('localStorage', armazenamentoFalso());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ler', () => {
  it('devolve lista vazia quando nada foi salvo', () => {
    expect(ler()).toEqual([]);
  });

  it('devolve lista vazia quando o conteúdo salvo não é JSON válido', () => {
    localStorage.setItem(CHAVE, 'isso não é json{{{');
    expect(ler()).toEqual([]);
  });

  it('devolve lista vazia quando o JSON válido não é uma lista', () => {
    localStorage.setItem(CHAVE, '{"id":1}');
    expect(ler()).toEqual([]);
  });

  it('descarta itens com formato inesperado e mantém os válidos', () => {
    localStorage.setItem(
      CHAVE,
      JSON.stringify([filme(1), { id: 'abc', titulo: 'x' }, null, { titulo: 'sem id' }, filme(2)]),
    );
    expect(ler().map((f) => f.id)).toEqual([1, 2]);
  });

  it('não quebra quando o armazenamento não existe', () => {
    vi.unstubAllGlobals();
    expect(ler()).toEqual([]);
  });
});

describe('alternar', () => {
  it('acrescenta o filme quando ele ainda não está na lista', () => {
    const lista = alternar(filme(1));
    expect(lista.map((f) => f.id)).toEqual([1]);
    expect(ler().map((f) => f.id)).toEqual([1]);
  });

  it('remove o filme quando ele já está na lista', () => {
    alternar(filme(1));
    const lista = alternar(filme(1));
    expect(lista).toEqual([]);
    expect(ler()).toEqual([]);
  });

  it('põe o filme novo no começo da lista', () => {
    alternar(filme(1));
    alternar(filme(2));
    expect(ler().map((f) => f.id)).toEqual([2, 1]);
  });

  it('respeita o teto de itens, descartando o mais antigo', () => {
    for (let id = 1; id <= MAXIMO + 5; id += 1) alternar(filme(id));
    const lista = ler();
    expect(lista).toHaveLength(MAXIMO);
    expect(lista[0].id).toBe(MAXIMO + 5);
    expect(lista.some((f) => f.id === 1)).toBe(false);
  });

  it('guarda o resumo inteiro, para a lista renderizar sem chamar a API', () => {
    alternar(filme(7));
    expect(ler()[0]).toEqual(filme(7));
  });
});

describe('contem', () => {
  it('responde se o filme está na lista', () => {
    expect(contem(1)).toBe(false);
    alternar(filme(1));
    expect(contem(1)).toBe(true);
  });
});

describe('remover', () => {
  it('tira o filme pedido e preserva os demais', () => {
    alternar(filme(1));
    alternar(filme(2));
    expect(remover(1).map((f) => f.id)).toEqual([2]);
    expect(ler().map((f) => f.id)).toEqual([2]);
  });

  it('não faz nada quando o filme não está na lista', () => {
    alternar(filme(1));
    expect(remover(99).map((f) => f.id)).toEqual([1]);
  });
});

describe('instantaneo', () => {
  it('devolve a mesma referência enquanto nada muda', () => {
    alternar(filme(1));
    expect(instantaneo()).toBe(instantaneo());
  });

  it('devolve uma referência nova depois de uma escrita', () => {
    alternar(filme(1));
    const antes = instantaneo();
    alternar(filme(2));
    expect(instantaneo()).not.toBe(antes);
    expect(instantaneo().map((f) => f.id)).toEqual([2, 1]);
  });

  it('avisa quem estiver inscrito quando a lista muda', () => {
    const ouvinte = vi.fn();
    const cancelar = inscrever(ouvinte);
    alternar(filme(1));
    expect(ouvinte).toHaveBeenCalledTimes(1);
    cancelar();
    alternar(filme(2));
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it('o instantâneo do servidor é sempre a mesma lista vazia', () => {
    expect(instantaneoServidor()).toEqual([]);
    expect(instantaneoServidor()).toBe(instantaneoServidor());
  });
});
