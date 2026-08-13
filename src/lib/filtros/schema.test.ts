import { describe, it, expect } from 'vitest';
import { lerFiltros, paraQueryString, comFiltros, FILTROS_PADRAO } from './schema';

describe('lerFiltros', () => {
  it('sem parâmetros devolve os padrões', () => {
    expect(lerFiltros({})).toEqual(FILTROS_PADRAO);
  });

  it('lê listas de ids separadas por vírgula', () => {
    const f = lerFiltros({ servico: '8,119', genero: '27,35' });
    expect(f.servicos).toEqual([8, 119]);
    expect(f.generos).toEqual([27, 35]);
  });

  it('descarta ids não numéricos e repetidos', () => {
    expect(lerFiltros({ servico: '8,abc,8,-3,0' }).servicos).toEqual([8]);
  });

  it('lê a faixa de anos', () => {
    const f = lerFiltros({ ano: '2015-2025' });
    expect(f.anoInicio).toBe(2015);
    expect(f.anoFim).toBe(2025);
  });

  it('ignora faixa de anos invertida', () => {
    const f = lerFiltros({ ano: '2025-2015' });
    expect(f.anoInicio).toBeNull();
    expect(f.anoFim).toBeNull();
  });

  it('ignora faixa de anos malformada', () => {
    expect(lerFiltros({ ano: '20x5-2025' }).anoInicio).toBeNull();
    expect(lerFiltros({ ano: '2015' }).anoInicio).toBeNull();
  });

  it('aceita nota de 1 a 9 e rejeita o resto', () => {
    expect(lerFiltros({ nota: '7' }).notaMinima).toBe(7);
    expect(lerFiltros({ nota: 'abc' }).notaMinima).toBeNull();
    expect(lerFiltros({ nota: '0' }).notaMinima).toBeNull();
    expect(lerFiltros({ nota: '10' }).notaMinima).toBeNull();
  });

  it('aceita apenas durações conhecidas', () => {
    expect(lerFiltros({ duracao: '90-120' }).duracao).toBe('90-120');
    expect(lerFiltros({ duracao: 'curtinho' }).duracao).toBeNull();
  });

  it('aceita apenas código de idioma de duas letras minúsculas', () => {
    expect(lerFiltros({ idioma: 'pt' }).idioma).toBe('pt');
    expect(lerFiltros({ idioma: 'PT' }).idioma).toBeNull();
    expect(lerFiltros({ idioma: 'portugues' }).idioma).toBeNull();
  });

  it('cai em popularidade quando a ordenação é desconhecida', () => {
    expect(lerFiltros({ ordem: 'nota' }).ordem).toBe('nota');
    expect(lerFiltros({ ordem: 'inventada' }).ordem).toBe('populares');
  });

  it('limita a página entre 1 e 500', () => {
    expect(lerFiltros({ pagina: '2' }).pagina).toBe(2);
    expect(lerFiltros({ pagina: '-5' }).pagina).toBe(1);
    expect(lerFiltros({ pagina: '99999' }).pagina).toBe(1);
    expect(lerFiltros({ pagina: 'abc' }).pagina).toBe(1);
  });

  it('usa o primeiro valor quando o parâmetro vem repetido', () => {
    expect(lerFiltros({ nota: ['7', '9'] }).notaMinima).toBe(7);
  });
});

describe('paraQueryString', () => {
  it('omite os valores padrão', () => {
    expect(paraQueryString(FILTROS_PADRAO)).toBe('');
  });

  it('faz ida e volta sem perder informação', () => {
    const original = lerFiltros({
      servico: '8,119', genero: '27', ano: '2015-2025',
      nota: '7', duracao: 'ate-90', idioma: 'pt', ordem: 'nota', pagina: '3',
    });
    const query = paraQueryString(original);
    const params = Object.fromEntries(new URLSearchParams(query));
    expect(lerFiltros(params)).toEqual(original);
  });
});

describe('comFiltros', () => {
  it('devolve a base limpa quando não há filtros', () => {
    expect(comFiltros(FILTROS_PADRAO)).toBe('/');
  });

  it('monta o caminho com a query', () => {
    expect(comFiltros({ ...FILTROS_PADRAO, notaMinima: 7 })).toBe('/?nota=7');
  });
});
