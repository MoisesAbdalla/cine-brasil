import { describe, it, expect } from 'vitest';
import { chipsAtivos, sugerirAfrouxamento, tituloDaPagina } from './descrever';
import { FILTROS_PADRAO } from './schema';

const catalogos = {
  provedores: [
    { id: 8, nome: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/n.jpg' },
    { id: 337, nome: 'Disney Plus', logo: 'https://image.tmdb.org/t/p/w92/d.jpg' },
  ],
  generos: [
    { id: 27, nome: 'Terror' },
    { id: 35, nome: 'Comédia' },
  ],
};

describe('chipsAtivos', () => {
  it('não devolve chips quando nada está ativo', () => {
    expect(chipsAtivos(FILTROS_PADRAO, catalogos)).toEqual([]);
  });

  it('nomeia serviços e gêneros pelos catálogos', () => {
    const chips = chipsAtivos({ ...FILTROS_PADRAO, servicos: [8], generos: [27] }, catalogos);
    expect(chips.map((c) => c.rotulo)).toEqual(['Netflix', 'Terror']);
  });

  it('ignora ids desconhecidos', () => {
    const chips = chipsAtivos({ ...FILTROS_PADRAO, generos: [99999] }, catalogos);
    expect(chips).toEqual([]);
  });

  it('descreve os demais filtros em português', () => {
    const chips = chipsAtivos(
      { ...FILTROS_PADRAO, anoInicio: 2015, anoFim: 2025, notaMinima: 7, duracao: 'ate-90', idioma: 'pt' },
      catalogos,
    );
    expect(chips.map((c) => c.rotulo)).toEqual([
      '2015–2025',
      'Nota 7+',
      'Até 90 min',
      'Em português',
    ]);
  });

  it('o link de remover tira só aquele filtro e volta para a página 1', () => {
    const chips = chipsAtivos({ ...FILTROS_PADRAO, notaMinima: 7, generos: [27], pagina: 4 }, catalogos);
    const chipNota = chips.find((c) => c.chave === 'nota');
    expect(chipNota?.hrefRemover).toBe('/?genero=27');
  });

  it('remover um serviço mantém os outros', () => {
    const chips = chipsAtivos({ ...FILTROS_PADRAO, servicos: [8, 337] }, catalogos);
    expect(chips[0].hrefRemover).toBe('/?servico=337');
  });
});

describe('sugerirAfrouxamento', () => {
  it('não sugere nada quando nenhum filtro estreito está ativo', () => {
    expect(sugerirAfrouxamento(FILTROS_PADRAO)).toBeNull();
    expect(sugerirAfrouxamento({ ...FILTROS_PADRAO, servicos: [8] })).toBeNull();
  });

  it('suspeita da nota antes de tudo e sugere um ponto a menos', () => {
    const s = sugerirAfrouxamento({ ...FILTROS_PADRAO, notaMinima: 8, duracao: 'ate-90' });
    expect(s?.mensagem).toContain('nota mínima 8');
    expect(s?.href).toBe('/?nota=7&duracao=ate-90');
  });

  it('remove a nota em vez de baixar quando ela já é 6', () => {
    const s = sugerirAfrouxamento({ ...FILTROS_PADRAO, notaMinima: 6 });
    expect(s?.href).toBe('/');
  });

  it('suspeita da duração quando não há nota', () => {
    const s = sugerirAfrouxamento({ ...FILTROS_PADRAO, duracao: '90-120', idioma: 'pt' });
    expect(s?.mensagem).toContain('duração');
    expect(s?.href).toBe('/?idioma=pt');
  });

  it('suspeita da faixa de anos antes do idioma', () => {
    const s = sugerirAfrouxamento({ ...FILTROS_PADRAO, anoInicio: 2020, anoFim: 2021, idioma: 'pt' });
    expect(s?.mensagem).toContain('2020–2021');
    expect(s?.href).toBe('/?idioma=pt');
  });

  it('sobra o idioma quando é o único estreito', () => {
    const s = sugerirAfrouxamento({ ...FILTROS_PADRAO, idioma: 'pt' });
    expect(s?.href).toBe('/');
  });
});

describe('tituloDaPagina', () => {
  it('usa um título genérico sem filtros', () => {
    expect(tituloDaPagina(FILTROS_PADRAO, catalogos)).toBe('Filmes no streaming por assinatura no Brasil');
  });

  it('junta gênero e serviço', () => {
    const titulo = tituloDaPagina({ ...FILTROS_PADRAO, generos: [27], servicos: [8] }, catalogos);
    expect(titulo).toBe('Filmes de Terror na Netflix');
  });

  it('lista mais de um serviço', () => {
    const titulo = tituloDaPagina({ ...FILTROS_PADRAO, servicos: [8, 337] }, catalogos);
    expect(titulo).toBe('Filmes na Netflix e Disney Plus');
  });
});
