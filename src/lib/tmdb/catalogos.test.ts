import { describe, it, expect } from 'vitest';
import { ordenarEcortarProvedores, MAXIMO_PROVEDORES } from './catalogos';
import type { ProvedorTmdb } from './tipos';

function provedor(id: number, prioridade: number, logoPath?: string): ProvedorTmdb {
  return {
    provider_id: id,
    provider_name: `Serviço ${id}`,
    logo_path: logoPath ?? `/logo${id}.jpg`,
    display_priority: prioridade,
  };
}

describe('ordenarEcortarProvedores', () => {
  it('ordena pela prioridade de exibição do TMDB', () => {
    const lista = ordenarEcortarProvedores([provedor(3, 20), provedor(1, 1), provedor(2, 10)]);
    expect(lista.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('corta no máximo definido', () => {
    const muitos = Array.from({ length: 30 }, (_, i) => provedor(i + 1, i));
    expect(ordenarEcortarProvedores(muitos)).toHaveLength(MAXIMO_PROVEDORES);
  });

  it('converte o logo em URL completa', () => {
    const [primeiro] = ordenarEcortarProvedores([provedor(8, 1)]);
    expect(primeiro.logo).toBe('https://image.tmdb.org/t/p/w92/logo8.jpg');
    expect(primeiro.nome).toBe('Serviço 8');
  });

  it('aguenta lista vazia', () => {
    expect(ordenarEcortarProvedores([])).toEqual([]);
  });

  it('descarta provedores sem logo e mantém os válidos na ordem', () => {
    const lista = ordenarEcortarProvedores([
      provedor(1, 1, '/logo1.jpg'),
      provedor(2, 2, ''), // sem logo, deve ser descartado
      provedor(3, 3, '/logo3.jpg'),
    ]);
    expect(lista).toHaveLength(2);
    expect(lista.map((p) => p.id)).toEqual([1, 3]);
  });
});
