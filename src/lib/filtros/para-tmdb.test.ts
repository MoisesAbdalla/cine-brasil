import { describe, it, expect } from 'vitest';
import { montarParametrosDescoberta } from './para-tmdb';
import { FILTROS_PADRAO } from './schema';

const SERVICOS_PADRAO = [8, 119, 337];

describe('montarParametrosDescoberta', () => {
  it('inclui sempre as regras não negociáveis', () => {
    const p = montarParametrosDescoberta(FILTROS_PADRAO, SERVICOS_PADRAO);
    expect(p.watch_region).toBe('BR');
    expect(p.with_watch_monetization_types).toBe('flatrate');
    expect(p['vote_count.gte']).toBe('50');
    expect(p.include_adult).toBe('false');
  });

  it('inclui o mínimo de votos mesmo com nota mínima escolhida', () => {
    const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, notaMinima: 8 }, SERVICOS_PADRAO);
    expect(p['vote_count.gte']).toBe('50');
    expect(p['vote_average.gte']).toBe('8');
  });

  it('usa todos os serviços padrão quando nenhum foi escolhido', () => {
    const p = montarParametrosDescoberta(FILTROS_PADRAO, SERVICOS_PADRAO);
    expect(p.with_watch_providers).toBe('8|119|337');
  });

  it('une os serviços escolhidos com | (ou)', () => {
    const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, servicos: [8, 337] }, SERVICOS_PADRAO);
    expect(p.with_watch_providers).toBe('8|337');
  });

  it('une os gêneros com , (e)', () => {
    const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, generos: [27, 35] }, SERVICOS_PADRAO);
    expect(p.with_genres).toBe('27,35');
  });

  it('transforma a faixa de anos em duas datas', () => {
    const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, anoInicio: 2015, anoFim: 2025 }, SERVICOS_PADRAO);
    expect(p['primary_release_date.gte']).toBe('2015-01-01');
    expect(p['primary_release_date.lte']).toBe('2025-12-31');
  });

  it('traduz cada faixa de duração', () => {
    const ate = montarParametrosDescoberta({ ...FILTROS_PADRAO, duracao: 'ate-90' }, SERVICOS_PADRAO);
    expect(ate['with_runtime.lte']).toBe('90');
    expect(ate['with_runtime.gte']).toBeUndefined();

    const meio = montarParametrosDescoberta({ ...FILTROS_PADRAO, duracao: '90-120' }, SERVICOS_PADRAO);
    expect(meio['with_runtime.gte']).toBe('90');
    expect(meio['with_runtime.lte']).toBe('120');

    const acima = montarParametrosDescoberta({ ...FILTROS_PADRAO, duracao: 'acima-120' }, SERVICOS_PADRAO);
    expect(acima['with_runtime.gte']).toBe('120');
    expect(acima['with_runtime.lte']).toBeUndefined();
  });

  it('traduz cada ordenação', () => {
    const mapa = {
      populares: 'popularity.desc',
      nota: 'vote_average.desc',
      lancamento: 'primary_release_date.desc',
      titulo: 'title.asc',
    } as const;
    for (const [ordem, esperado] of Object.entries(mapa)) {
      const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, ordem: ordem as keyof typeof mapa }, SERVICOS_PADRAO);
      expect(p.sort_by).toBe(esperado);
    }
  });

  it('omite os filtros inativos', () => {
    const p = montarParametrosDescoberta(FILTROS_PADRAO, SERVICOS_PADRAO);
    expect(p.with_genres).toBeUndefined();
    expect(p['vote_average.gte']).toBeUndefined();
    expect(p.with_original_language).toBeUndefined();
    expect(p['primary_release_date.gte']).toBeUndefined();
  });

  it('leva o idioma original e a página', () => {
    const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, idioma: 'pt', pagina: 3 }, SERVICOS_PADRAO);
    expect(p.with_original_language).toBe('pt');
    expect(p.page).toBe('3');
  });
});

describe('tipos de monetização', () => {
  it('pede só assinatura por padrão', () => {
    const p = montarParametrosDescoberta(FILTROS_PADRAO, SERVICOS_PADRAO);
    expect(p.with_watch_monetization_types).toBe('flatrate');
  });

  it('inclui grátis e com anúncio quando o filtro está ligado', () => {
    const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, incluirGratis: true }, SERVICOS_PADRAO);
    expect(p.with_watch_monetization_types).toBe('flatrate|free|ads');
  });

  it('mantém o mínimo de votos e a região mesmo com grátis ligado', () => {
    const p = montarParametrosDescoberta({ ...FILTROS_PADRAO, incluirGratis: true }, SERVICOS_PADRAO);
    expect(p['vote_count.gte']).toBe('50');
    expect(p.watch_region).toBe('BR');
  });
});
