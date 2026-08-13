# Catálogo de filmes no streaming (BR) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um site que mostra quais filmes estão disponíveis nos serviços de streaming por assinatura no Brasil, com descoberta filtrável, sobre a API do TMDB.

**Architecture:** Next.js App Router com componentes de servidor buscando dados do TMDB antes de o HTML sair. Todo o estado de filtro vive na URL — não há cliente HTTP no navegador nem estado em memória. Uma camada `lib/tmdb` isola completamente o formato da API do resto do app; a lógica pura (parse de filtros, montagem de parâmetros, normalização) fica em módulos sem I/O, que são os que recebem testes de unidade.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-13-catalogo-filmes-streaming-design.md`

## Global Constraints

Estas regras valem para **todas** as tarefas:

- **Idioma da interface e do código de domínio:** português do Brasil. Nomes de tipos, funções e variáveis do domínio em português (`Filtros`, `descobrirFilmes`, `notaMinima`). Nomes de API do Next/React permanecem como são (`generateMetadata`, `searchParams`).
- **Toda consulta ao endpoint de descoberta** carrega obrigatoriamente: `watch_region=BR`, `with_watch_monetization_types=flatrate`, `vote_count.gte=50`, `include_adult=false`, `language=pt-BR`.
- **Token do TMDB** vive apenas em `TMDB_ACCESS_TOKEN`, lido somente por módulos marcados com `import 'server-only'`. Nunca prefixar com `NEXT_PUBLIC_`.
- **Tokens de cor** (valores exatos): fundo `#111310`, superfície `#191C17`, borda `#2A2D26`, texto `#E9E7DD`, texto suave `#7D8074`, acento `#CDEA4F`, texto sobre acento `#111310`.
- **Parcimônia do acento:** o lima só aparece em filtro ativo, nota e uma palavra do logo. Em nenhum outro lugar.
- **Atribuição obrigatória:** selo "powered by TMDB" no rodapé de toda página; crédito ao JustWatch junto aos dados de disponibilidade.
- **Nenhum link direto para o serviço de streaming.** Logos de provedor são exibidos sem `<a>`.
- **JavaScript no cliente** apenas no botão de trailer. Todo o resto (filtros, paginação, painéis) usa navegação por link e HTML nativo.
- **TypeScript em modo estrito**, sem `any`.
- **Testes de unidade rodam sem rede e sem token.**

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/filtros/schema.ts` | Tipo `Filtros`, parse de `searchParams` (Zod), serialização de volta para URL |
| `src/lib/filtros/para-tmdb.ts` | `Filtros` → parâmetros de query do TMDB (puro) |
| `src/lib/filtros/descrever.ts` | `Filtros` → chips, textos de SEO, filtro mais restritivo (puro) |
| `src/lib/tmdb/tipos.ts` | Tipos das respostas brutas do TMDB |
| `src/lib/tmdb/cliente.ts` | `fetch` autenticado, timeout, prazos de cache (`server-only`) |
| `src/lib/tmdb/normalizar.ts` | Resposta bruta → modelo do app (puro) |
| `src/lib/tmdb/catalogos.ts` | Listas de provedores e gêneros |
| `src/lib/tmdb/descobrir.ts` | Consulta de descoberta |
| `src/lib/tmdb/filme.ts` | Detalhes do filme com `append_to_response` |
| `src/lib/tmdb/buscar.ts` | Busca por texto |
| `src/components/cabecalho.tsx` | Logo + link de busca |
| `src/components/rodape.tsx` | Atribuição TMDB |
| `src/components/cartao-filme.tsx` | Pôster, título, ano, nota |
| `src/components/grade-filmes.tsx` | Grade responsiva |
| `src/components/paginacao.tsx` | Anterior / página atual / Próxima |
| `src/components/estado-vazio.tsx` | Zero resultados com sugestão acionável |
| `src/components/barra-filtros/` | Logos de serviço, chips, painel "+ mais filtros" |
| `src/components/selos-provedor.tsx` | Logos + crédito JustWatch |
| `src/components/trailer.tsx` | Único componente de cliente |
| `src/app/page.tsx` | Descoberta |
| `src/app/filme/[id]/page.tsx` | Detalhes |
| `src/app/busca/page.tsx` | Busca |
| `src/app/layout.tsx`, `error.tsx`, `not-found.tsx` | Casca do app |

---

### Task 1: Esqueleto do projeto e ferramentas de teste

**Files:**
- Create: projeto Next.js na raiz do repositório
- Create: `vitest.config.ts`, `tests/stubs/server-only.ts`, `.env.example`
- Modify: `next.config.ts`, `package.json`
- Test: `src/lib/exemplo.test.ts` (removido ao final da tarefa)

**Interfaces:**
- Consumes: nada
- Produces: comando `npm test` funcionando; alias `@/` apontando para `src/`

- [ ] **Step 1: Gerar o projeto numa pasta temporária**

A raiz já contém `.gitignore` e `docs/`, e o `create-next-app` recusa pastas com arquivos conflitantes. Por isso, gerar fora e mover:

```bash
npx create-next-app@latest tmp-app --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Mover para a raiz, preservando o `.gitignore` existente**

```bash
rm tmp-app/.gitignore
mv tmp-app/* tmp-app/.[!.]* .
rmdir tmp-app
npm install
```

- [ ] **Step 3: Instalar dependências do projeto**

```bash
npm install zod server-only
npm install -D vitest
```

- [ ] **Step 4: Criar o stub de `server-only` para os testes**

O pacote `server-only` lança erro ao ser importado fora do ambiente de servidor do React — o que quebraria qualquer teste de unidade que importe a camada TMDB. O alias abaixo troca o pacote por um módulo vazio durante os testes.

Criar `tests/stubs/server-only.ts`:

```ts
// Substitui o pacote `server-only` durante os testes de unidade.
// Em produção o pacote real continua valendo e barra importação em componentes de cliente.
export {};
```

- [ ] **Step 5: Configurar o Vitest**

Criar `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(raiz, 'src'),
      'server-only': path.resolve(raiz, 'tests/stubs/server-only.ts'),
    },
  },
});
```

Adicionar aos scripts do `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Escrever um teste de fumaça**

Criar `src/lib/exemplo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('ambiente de teste', () => {
  it('roda', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Rodar o teste**

Run: `npm test`
Expected: PASS — 1 teste passando.

- [ ] **Step 8: Configurar imagens do TMDB e variáveis de ambiente**

Substituir `next.config.ts` por:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' }],
  },
};

export default nextConfig;
```

Criar `.env.example`:

```
# Token de leitura (v4) da API do TMDB — https://www.themoviedb.org/settings/api
TMDB_ACCESS_TOKEN=
```

Criar `.env.local` (não versionado) com o token real e confirmar que o build passa:

Run: `npm run build`
Expected: build concluído sem erros.

- [ ] **Step 9: Remover o teste de fumaça e commitar**

```bash
rm src/lib/exemplo.test.ts
git add -A
git commit -m "chore: esqueleto Next.js com Tailwind, Vitest e configuração de imagens do TMDB"
```

---

### Task 2: Filtros — parse e serialização da URL

**Files:**
- Create: `src/lib/filtros/schema.ts`
- Test: `src/lib/filtros/schema.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `type Ordem = 'populares' | 'nota' | 'lancamento' | 'titulo'`
  - `type Duracao = 'ate-90' | '90-120' | 'acima-120'`
  - `interface Filtros { servicos: number[]; generos: number[]; anoInicio: number | null; anoFim: number | null; notaMinima: number | null; duracao: Duracao | null; idioma: string | null; ordem: Ordem; pagina: number }`
  - `const FILTROS_PADRAO: Filtros`
  - `function lerFiltros(params: ParamsBrutos): Filtros`
  - `function paraQueryString(filtros: Filtros): string`
  - `function comFiltros(filtros: Filtros, base?: string): string`
  - `type ParamsBrutos = Record<string, string | string[] | undefined>`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/filtros/schema.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/filtros/schema.test.ts`
Expected: FAIL — "Failed to resolve import './schema'".

- [ ] **Step 3: Implementar**

Criar `src/lib/filtros/schema.ts`:

```ts
import { z } from 'zod';

export const ORDENS = ['populares', 'nota', 'lancamento', 'titulo'] as const;
export type Ordem = (typeof ORDENS)[number];

export const DURACOES = ['ate-90', '90-120', 'acima-120'] as const;
export type Duracao = (typeof DURACOES)[number];

export const ANO_MINIMO = 1900;
export const ANO_MAXIMO = new Date().getFullYear() + 1;
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
  if (inicio < ANO_MINIMO || fim > ANO_MAXIMO) return vazia;

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
  if (filtros.ordem !== 'populares') params.set('ordem', filtros.ordem);
  if (filtros.pagina > 1) params.set('pagina', String(filtros.pagina));
  return params.toString();
}

export function comFiltros(filtros: Filtros, base = '/'): string {
  const query = paraQueryString(filtros);
  return query ? `${base}?${query}` : base;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/filtros/schema.test.ts`
Expected: PASS — todos os testes verdes.

- [ ] **Step 5: Commitar**

```bash
git add src/lib/filtros/schema.ts src/lib/filtros/schema.test.ts
git commit -m "feat: parse e serialização dos filtros na URL"
```

---

### Task 3: Filtros — tradução para parâmetros do TMDB

**Files:**
- Create: `src/lib/filtros/para-tmdb.ts`
- Test: `src/lib/filtros/para-tmdb.test.ts`

**Interfaces:**
- Consumes: `Filtros`, `FILTROS_PADRAO` de `@/lib/filtros/schema`
- Produces: `function montarParametrosDescoberta(filtros: Filtros, servicosPadrao: number[]): Record<string, string>`

Esta é a função onde mora a regra crítica do mínimo de votos. Ela é pura: recebe os IDs de serviço de reserva por parâmetro em vez de buscá-los, o que a torna testável sem rede.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/filtros/para-tmdb.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/filtros/para-tmdb.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

Criar `src/lib/filtros/para-tmdb.ts`:

```ts
import type { Filtros, Ordem, Duracao } from './schema';

const ORDENACAO_TMDB: Record<Ordem, string> = {
  populares: 'popularity.desc',
  nota: 'vote_average.desc',
  lancamento: 'primary_release_date.desc',
  titulo: 'title.asc',
};

const DURACAO_TMDB: Record<Duracao, Record<string, string>> = {
  'ate-90': { 'with_runtime.lte': '90' },
  '90-120': { 'with_runtime.gte': '90', 'with_runtime.lte': '120' },
  'acima-120': { 'with_runtime.gte': '120' },
};

/**
 * Traduz os filtros da URL para a query do /discover/movie.
 *
 * `servicosPadrao` são os IDs de todos os serviços de assinatura do BR, usados
 * quando o usuário não escolheu nenhum — é o que cumpre a promessa "tudo que
 * está no streaming agora" já na primeira visita.
 */
export function montarParametrosDescoberta(
  filtros: Filtros,
  servicosPadrao: number[],
): Record<string, string> {
  const servicos = filtros.servicos.length > 0 ? filtros.servicos : servicosPadrao;

  const parametros: Record<string, string> = {
    watch_region: 'BR',
    with_watch_monetization_types: 'flatrate',
    // Sem isto, "nota acima de 8" devolve filmes com três votos e média 10.
    // Não é configurável na interface, e não deve deixar de existir.
    'vote_count.gte': '50',
    include_adult: 'false',
    with_watch_providers: servicos.join('|'),
    sort_by: ORDENACAO_TMDB[filtros.ordem],
    page: String(filtros.pagina),
  };

  if (filtros.generos.length > 0) parametros.with_genres = filtros.generos.join(',');
  if (filtros.anoInicio && filtros.anoFim) {
    parametros['primary_release_date.gte'] = `${filtros.anoInicio}-01-01`;
    parametros['primary_release_date.lte'] = `${filtros.anoFim}-12-31`;
  }
  if (filtros.notaMinima) parametros['vote_average.gte'] = String(filtros.notaMinima);
  if (filtros.duracao) Object.assign(parametros, DURACAO_TMDB[filtros.duracao]);
  if (filtros.idioma) parametros.with_original_language = filtros.idioma;

  return parametros;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/filtros/para-tmdb.test.ts`
Expected: PASS.

- [ ] **Step 5: Commitar**

```bash
git add src/lib/filtros/para-tmdb.ts src/lib/filtros/para-tmdb.test.ts
git commit -m "feat: tradução dos filtros para parâmetros do TMDB"
```

---

### Task 4: Cliente do TMDB

**Files:**
- Create: `src/lib/tmdb/tipos.ts`, `src/lib/tmdb/cliente.ts`
- Test: `src/lib/tmdb/cliente.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `class ErroTmdb extends Error { readonly status: number | undefined }`
  - `const CACHE: { generos: number; provedores: number; descoberta: number; filme: number; busca: number }`
  - `function buscarNoTmdb<T>(caminho: string, parametros: Record<string, string>, revalidarEmSegundos: number): Promise<T>`
  - Tipos: `RespostaPaginada<T>`, `FilmeResumoTmdb`, `FilmeDetalheTmdb`, `GeneroTmdb`, `ProvedorTmdb`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/tmdb/cliente.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buscarNoTmdb, ErroTmdb, CACHE } from './cliente';

const fetchFalso = vi.fn();

beforeEach(() => {
  vi.stubEnv('TMDB_ACCESS_TOKEN', 'token-de-teste');
  vi.stubGlobal('fetch', fetchFalso);
  fetchFalso.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function respostaOk(corpo: unknown) {
  return { ok: true, status: 200, json: async () => corpo } as Response;
}

describe('buscarNoTmdb', () => {
  it('monta a URL com os parâmetros e o idioma pt-BR', async () => {
    fetchFalso.mockResolvedValue(respostaOk({ ok: 1 }));

    await buscarNoTmdb('/discover/movie', { page: '2' }, CACHE.descoberta);

    const [url] = fetchFalso.mock.calls[0];
    expect(url).toContain('https://api.themoviedb.org/3/discover/movie');
    expect(url).toContain('language=pt-BR');
    expect(url).toContain('page=2');
  });

  it('envia o token no cabeçalho e o prazo de revalidação', async () => {
    fetchFalso.mockResolvedValue(respostaOk({ ok: 1 }));

    await buscarNoTmdb('/genre/movie/list', {}, CACHE.generos);

    const [, opcoes] = fetchFalso.mock.calls[0];
    expect(opcoes.headers.Authorization).toBe('Bearer token-de-teste');
    expect(opcoes.next.revalidate).toBe(CACHE.generos);
  });

  it('devolve o corpo já em JSON', async () => {
    fetchFalso.mockResolvedValue(respostaOk({ total_results: 7 }));
    const dados = await buscarNoTmdb<{ total_results: number }>('/discover/movie', {}, 60);
    expect(dados.total_results).toBe(7);
  });

  it('lança ErroTmdb com o status quando a resposta falha', async () => {
    fetchFalso.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as Response);

    await expect(buscarNoTmdb('/movie/999999999', {}, 60)).rejects.toMatchObject({
      name: 'ErroTmdb',
      status: 404,
    });
  });

  it('lança ErroTmdb quando a rede falha', async () => {
    fetchFalso.mockRejectedValue(new Error('rede caiu'));
    await expect(buscarNoTmdb('/discover/movie', {}, 60)).rejects.toBeInstanceOf(ErroTmdb);
  });

  it('lança ErroTmdb quando o token não está configurado', async () => {
    vi.stubEnv('TMDB_ACCESS_TOKEN', '');
    await expect(buscarNoTmdb('/discover/movie', {}, 60)).rejects.toBeInstanceOf(ErroTmdb);
  });
});

describe('CACHE', () => {
  it('usa os prazos definidos na spec', () => {
    expect(CACHE.generos).toBe(60 * 60 * 24 * 7);
    expect(CACHE.provedores).toBe(60 * 60 * 24);
    expect(CACHE.descoberta).toBe(60 * 60 * 6);
    expect(CACHE.filme).toBe(60 * 60 * 12);
    expect(CACHE.busca).toBe(60 * 60);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/tmdb/cliente.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Escrever os tipos das respostas brutas**

Criar `src/lib/tmdb/tipos.ts`:

```ts
export interface RespostaPaginada<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface FilmeResumoTmdb {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average: number;
}

export interface GeneroTmdb {
  id: number;
  name: string;
}

export interface ProvedorTmdb {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface PessoaElencoTmdb {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface MembroEquipeTmdb {
  id: number;
  name: string;
  job: string;
}

export interface VideoTmdb {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface FilmeDetalheTmdb extends FilmeResumoTmdb {
  backdrop_path: string | null;
  overview: string;
  runtime: number | null;
  genres: GeneroTmdb[];
  credits?: { cast: PessoaElencoTmdb[]; crew: MembroEquipeTmdb[] };
  videos?: { results: VideoTmdb[] };
  similar?: RespostaPaginada<FilmeResumoTmdb>;
  'watch/providers'?: {
    results?: Record<string, { flatrate?: ProvedorTmdb[] }>;
  };
}
```

- [ ] **Step 4: Implementar o cliente**

Criar `src/lib/tmdb/cliente.ts`:

```ts
import 'server-only';

const BASE = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 8000;

/** Prazos de revalidação, em segundos. Cada dado envelhece no seu ritmo. */
export const CACHE = {
  generos: 60 * 60 * 24 * 7,
  provedores: 60 * 60 * 24,
  descoberta: 60 * 60 * 6,
  filme: 60 * 60 * 12,
  busca: 60 * 60,
} as const;

export class ErroTmdb extends Error {
  readonly status: number | undefined;

  constructor(mensagem: string, status?: number) {
    super(mensagem);
    this.name = 'ErroTmdb';
    this.status = status;
  }
}

export async function buscarNoTmdb<T>(
  caminho: string,
  parametros: Record<string, string>,
  revalidarEmSegundos: number,
): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new ErroTmdb('TMDB_ACCESS_TOKEN não está configurado');
  }

  const url = new URL(BASE + caminho);
  url.searchParams.set('language', 'pt-BR');
  for (const [chave, valor] of Object.entries(parametros)) {
    url.searchParams.set(chave, valor);
  }

  let resposta: Response;
  try {
    resposta = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: revalidarEmSegundos },
    });
  } catch (causa) {
    throw new ErroTmdb(`Falha ao falar com o TMDB: ${String(causa)}`);
  }

  if (!resposta.ok) {
    throw new ErroTmdb(`TMDB respondeu ${resposta.status} em ${caminho}`, resposta.status);
  }

  return (await resposta.json()) as T;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- src/lib/tmdb/cliente.test.ts`
Expected: PASS.

- [ ] **Step 6: Commitar**

```bash
git add src/lib/tmdb/tipos.ts src/lib/tmdb/cliente.ts src/lib/tmdb/cliente.test.ts
git commit -m "feat: cliente autenticado do TMDB com timeout e prazos de cache"
```

---

### Task 5: Normalização das respostas

**Files:**
- Create: `src/lib/tmdb/normalizar.ts`
- Test: `src/lib/tmdb/normalizar.test.ts`

**Interfaces:**
- Consumes: tipos de `@/lib/tmdb/tipos`
- Produces:
  - `interface FilmeResumo { id: number; titulo: string; ano: number | null; poster: string | null; nota: number | null }`
  - `interface Provedor { id: number; nome: string; logo: string }`
  - `interface PessoaElenco { nome: string; personagem: string; foto: string | null }`
  - `interface FilmeDetalhe extends FilmeResumo { fundo: string | null; sinopse: string | null; duracao: number | null; generos: string[]; diretor: string | null; elenco: PessoaElenco[]; trailerYoutube: string | null; provedores: Provedor[]; parecidos: FilmeResumo[] }`
  - `function urlImagem(caminho: string | null, tamanho: string): string | null`
  - `function normalizarResumo(bruto: FilmeResumoTmdb): FilmeResumo`
  - `function normalizarDetalhe(bruto: FilmeDetalheTmdb): FilmeDetalhe`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/tmdb/normalizar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { urlImagem, normalizarResumo, normalizarDetalhe } from './normalizar';
import type { FilmeDetalheTmdb, FilmeResumoTmdb } from './tipos';

const resumoBase: FilmeResumoTmdb = {
  id: 1,
  title: 'Filme de Teste',
  poster_path: '/abc.jpg',
  release_date: '2019-07-04',
  vote_average: 7.34,
};

describe('urlImagem', () => {
  it('monta a URL do CDN do TMDB', () => {
    expect(urlImagem('/abc.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
  });

  it('devolve null quando não há imagem', () => {
    expect(urlImagem(null, 'w500')).toBeNull();
  });
});

describe('normalizarResumo', () => {
  it('extrai o ano da data de lançamento', () => {
    expect(normalizarResumo(resumoBase).ano).toBe(2019);
  });

  it('arredonda a nota para uma casa', () => {
    expect(normalizarResumo(resumoBase).nota).toBe(7.3);
  });

  it('trata nota 0 como ausência de nota', () => {
    expect(normalizarResumo({ ...resumoBase, vote_average: 0 }).nota).toBeNull();
  });

  it('trata data ausente ou vazia como ano nulo', () => {
    expect(normalizarResumo({ ...resumoBase, release_date: '' }).ano).toBeNull();
    expect(normalizarResumo({ ...resumoBase, release_date: undefined }).ano).toBeNull();
  });

  it('trata pôster ausente como null', () => {
    expect(normalizarResumo({ ...resumoBase, poster_path: null }).poster).toBeNull();
  });
});

describe('normalizarDetalhe', () => {
  const detalheBase: FilmeDetalheTmdb = {
    ...resumoBase,
    backdrop_path: '/fundo.jpg',
    overview: 'Uma sinopse.',
    runtime: 118,
    genres: [{ id: 27, name: 'Terror' }],
    credits: {
      cast: [
        { id: 10, name: 'Atriz Um', character: 'Ela', profile_path: '/a.jpg', order: 0 },
        { id: 11, name: 'Ator Dois', character: 'Ele', profile_path: null, order: 1 },
      ],
      crew: [{ id: 20, name: 'Diretora Tal', job: 'Director' }],
    },
    videos: {
      results: [
        { key: 'xyz', site: 'YouTube', type: 'Trailer', official: true },
        { key: 'abc', site: 'Vimeo', type: 'Trailer', official: true },
      ],
    },
    similar: { page: 1, results: [resumoBase], total_pages: 1, total_results: 1 },
    'watch/providers': {
      results: {
        BR: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg', display_priority: 1 }] },
      },
    },
  };

  it('traz os campos principais', () => {
    const d = normalizarDetalhe(detalheBase);
    expect(d.titulo).toBe('Filme de Teste');
    expect(d.duracao).toBe(118);
    expect(d.generos).toEqual(['Terror']);
    expect(d.sinopse).toBe('Uma sinopse.');
  });

  it('encontra a direção no time de produção', () => {
    expect(normalizarDetalhe(detalheBase).diretor).toBe('Diretora Tal');
  });

  it('pega os provedores de assinatura do Brasil', () => {
    const d = normalizarDetalhe(detalheBase);
    expect(d.provedores).toEqual([
      { id: 8, nome: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/n.jpg' },
    ]);
  });

  it('devolve lista vazia quando não há provedor de assinatura no BR', () => {
    const semBr = { ...detalheBase, 'watch/providers': { results: {} } };
    expect(normalizarDetalhe(semBr).provedores).toEqual([]);
  });

  it('só aceita trailer do YouTube', () => {
    expect(normalizarDetalhe(detalheBase).trailerYoutube).toBe('xyz');

    const soVimeo = {
      ...detalheBase,
      videos: { results: [{ key: 'abc', site: 'Vimeo', type: 'Trailer', official: true }] },
    };
    expect(normalizarDetalhe(soVimeo).trailerYoutube).toBeNull();
  });

  it('limita o elenco a 8 pessoas e converte a foto', () => {
    const d = normalizarDetalhe(detalheBase);
    expect(d.elenco).toHaveLength(2);
    expect(d.elenco[0]).toEqual({
      nome: 'Atriz Um',
      personagem: 'Ela',
      foto: 'https://image.tmdb.org/t/p/w185/a.jpg',
    });
    expect(d.elenco[1].foto).toBeNull();
  });

  it('trata sinopse vazia e duração 0 como ausentes', () => {
    const magro = { ...detalheBase, overview: '', runtime: 0 };
    const d = normalizarDetalhe(magro);
    expect(d.sinopse).toBeNull();
    expect(d.duracao).toBeNull();
  });

  it('aguenta detalhe sem elenco, sem vídeos e sem parecidos', () => {
    const minimo: FilmeDetalheTmdb = {
      ...resumoBase,
      backdrop_path: null,
      overview: '',
      runtime: null,
      genres: [],
    };
    const d = normalizarDetalhe(minimo);
    expect(d.diretor).toBeNull();
    expect(d.elenco).toEqual([]);
    expect(d.trailerYoutube).toBeNull();
    expect(d.parecidos).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/tmdb/normalizar.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

Criar `src/lib/tmdb/normalizar.ts`:

```ts
import type { FilmeDetalheTmdb, FilmeResumoTmdb } from './tipos';

const CDN = 'https://image.tmdb.org/t/p';
const MAXIMO_ELENCO = 8;
const MAXIMO_PARECIDOS = 12;

export interface FilmeResumo {
  id: number;
  titulo: string;
  ano: number | null;
  poster: string | null;
  nota: number | null;
}

export interface Provedor {
  id: number;
  nome: string;
  logo: string;
}

export interface PessoaElenco {
  nome: string;
  personagem: string;
  foto: string | null;
}

export interface FilmeDetalhe extends FilmeResumo {
  fundo: string | null;
  sinopse: string | null;
  duracao: number | null;
  generos: string[];
  diretor: string | null;
  elenco: PessoaElenco[];
  trailerYoutube: string | null;
  provedores: Provedor[];
  parecidos: FilmeResumo[];
}

export function urlImagem(caminho: string | null, tamanho: string): string | null {
  return caminho ? `${CDN}/${tamanho}${caminho}` : null;
}

export function normalizarResumo(bruto: FilmeResumoTmdb): FilmeResumo {
  const ano = bruto.release_date ? Number(bruto.release_date.slice(0, 4)) : NaN;

  return {
    id: bruto.id,
    titulo: bruto.title,
    ano: Number.isInteger(ano) ? ano : null,
    poster: urlImagem(bruto.poster_path, 'w342'),
    // Nota 0 no TMDB significa "ninguém votou", não "é péssimo".
    nota: bruto.vote_average > 0 ? Math.round(bruto.vote_average * 10) / 10 : null,
  };
}

export function normalizarDetalhe(bruto: FilmeDetalheTmdb): FilmeDetalhe {
  const equipe = bruto.credits?.crew ?? [];
  const elenco = bruto.credits?.cast ?? [];
  const videos = bruto.videos?.results ?? [];
  const provedoresBr = bruto['watch/providers']?.results?.BR?.flatrate ?? [];

  const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer');

  return {
    ...normalizarResumo(bruto),
    fundo: urlImagem(bruto.backdrop_path, 'w1280'),
    sinopse: bruto.overview.trim() || null,
    duracao: bruto.runtime && bruto.runtime > 0 ? bruto.runtime : null,
    generos: bruto.genres.map((g) => g.name),
    diretor: equipe.find((p) => p.job === 'Director')?.name ?? null,
    elenco: elenco.slice(0, MAXIMO_ELENCO).map((p) => ({
      nome: p.name,
      personagem: p.character,
      foto: urlImagem(p.profile_path, 'w185'),
    })),
    trailerYoutube: trailer?.key ?? null,
    provedores: provedoresBr.map((p) => ({
      id: p.provider_id,
      nome: p.provider_name,
      logo: urlImagem(p.logo_path, 'w92') as string,
    })),
    parecidos: (bruto.similar?.results ?? []).slice(0, MAXIMO_PARECIDOS).map(normalizarResumo),
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/tmdb/normalizar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commitar**

```bash
git add src/lib/tmdb/normalizar.ts src/lib/tmdb/normalizar.test.ts
git commit -m "feat: normalização das respostas do TMDB"
```

---

### Task 6: Catálogos — provedores e gêneros

**Files:**
- Create: `src/lib/tmdb/catalogos.ts`
- Test: `src/lib/tmdb/catalogos.test.ts`

**Interfaces:**
- Consumes: `buscarNoTmdb`, `CACHE`, `urlImagem`, tipos
- Produces:
  - `const MAXIMO_PROVEDORES = 12`
  - `function ordenarEcortarProvedores(brutos: ProvedorTmdb[]): Provedor[]` (puro, testável)
  - `async function obterProvedores(): Promise<Provedor[]>`
  - `interface Genero { id: number; nome: string }`
  - `async function obterGeneros(): Promise<Genero[]>`

Nenhum ID de provedor é escrito à mão: a lista vem do TMDB, ordenada pela prioridade que eles definem para o Brasil.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/tmdb/catalogos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ordenarEcortarProvedores, MAXIMO_PROVEDORES } from './catalogos';
import type { ProvedorTmdb } from './tipos';

function provedor(id: number, prioridade: number): ProvedorTmdb {
  return {
    provider_id: id,
    provider_name: `Serviço ${id}`,
    logo_path: `/logo${id}.jpg`,
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
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/tmdb/catalogos.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

Criar `src/lib/tmdb/catalogos.ts`:

```ts
import { buscarNoTmdb, CACHE } from './cliente';
import { urlImagem, type Provedor } from './normalizar';
import type { GeneroTmdb, ProvedorTmdb } from './tipos';

export const MAXIMO_PROVEDORES = 12;

export interface Genero {
  id: number;
  nome: string;
}

/** Puro, para poder ser testado sem rede. */
export function ordenarEcortarProvedores(brutos: ProvedorTmdb[]): Provedor[] {
  return [...brutos]
    .sort((a, b) => a.display_priority - b.display_priority)
    .slice(0, MAXIMO_PROVEDORES)
    .map((p) => ({
      id: p.provider_id,
      nome: p.provider_name,
      logo: urlImagem(p.logo_path, 'w92') as string,
    }));
}

export async function obterProvedores(): Promise<Provedor[]> {
  const resposta = await buscarNoTmdb<{ results: ProvedorTmdb[] }>(
    '/watch/providers/movie',
    { watch_region: 'BR' },
    CACHE.provedores,
  );
  return ordenarEcortarProvedores(resposta.results ?? []);
}

export async function obterGeneros(): Promise<Genero[]> {
  const resposta = await buscarNoTmdb<{ genres: GeneroTmdb[] }>(
    '/genre/movie/list',
    {},
    CACHE.generos,
  );
  return (resposta.genres ?? []).map((g) => ({ id: g.id, nome: g.name }));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/tmdb/catalogos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commitar**

```bash
git add src/lib/tmdb/catalogos.ts src/lib/tmdb/catalogos.test.ts
git commit -m "feat: listas de provedores e gêneros vindas do TMDB"
```

---

### Task 7: Consulta de descoberta

**Files:**
- Create: `src/lib/tmdb/descobrir.ts`
- Test: `src/lib/tmdb/descobrir.test.ts`

**Interfaces:**
- Consumes: `montarParametrosDescoberta`, `obterProvedores`, `buscarNoTmdb`, `normalizarResumo`
- Produces:
  - `interface ResultadoDescoberta { filmes: FilmeResumo[]; totalResultados: number; totalPaginas: number; pagina: number }`
  - `function montarResultado(bruto: RespostaPaginada<FilmeResumoTmdb>): ResultadoDescoberta` (puro)
  - `async function descobrirFilmes(filtros: Filtros): Promise<ResultadoDescoberta>`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/tmdb/descobrir.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { montarResultado } from './descobrir';
import type { FilmeResumoTmdb, RespostaPaginada } from './tipos';

const filme: FilmeResumoTmdb = {
  id: 1,
  title: 'Filme',
  poster_path: '/p.jpg',
  release_date: '2020-01-01',
  vote_average: 8,
};

function resposta(parcial: Partial<RespostaPaginada<FilmeResumoTmdb>>): RespostaPaginada<FilmeResumoTmdb> {
  return { page: 1, results: [filme], total_pages: 10, total_results: 200, ...parcial };
}

describe('montarResultado', () => {
  it('normaliza os filmes', () => {
    const r = montarResultado(resposta({}));
    expect(r.filmes[0].titulo).toBe('Filme');
    expect(r.filmes[0].ano).toBe(2020);
  });

  it('repassa a contagem total', () => {
    expect(montarResultado(resposta({})).totalResultados).toBe(200);
  });

  it('limita o total de páginas ao teto de 500 do TMDB', () => {
    expect(montarResultado(resposta({ total_pages: 1200 })).totalPaginas).toBe(500);
    expect(montarResultado(resposta({ total_pages: 10 })).totalPaginas).toBe(10);
  });

  it('aguenta resposta sem resultados', () => {
    const r = montarResultado(resposta({ results: [], total_results: 0, total_pages: 0 }));
    expect(r.filmes).toEqual([]);
    expect(r.totalResultados).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/tmdb/descobrir.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

Criar `src/lib/tmdb/descobrir.ts`:

```ts
import { montarParametrosDescoberta } from '@/lib/filtros/para-tmdb';
import type { Filtros } from '@/lib/filtros/schema';
import { PAGINA_MAXIMA } from '@/lib/filtros/schema';
import { obterProvedores } from './catalogos';
import { buscarNoTmdb, CACHE } from './cliente';
import { normalizarResumo, type FilmeResumo } from './normalizar';
import type { FilmeResumoTmdb, RespostaPaginada } from './tipos';

export interface ResultadoDescoberta {
  filmes: FilmeResumo[];
  totalResultados: number;
  totalPaginas: number;
  pagina: number;
}

export function montarResultado(bruto: RespostaPaginada<FilmeResumoTmdb>): ResultadoDescoberta {
  return {
    filmes: (bruto.results ?? []).map(normalizarResumo),
    totalResultados: bruto.total_results,
    totalPaginas: Math.min(bruto.total_pages, PAGINA_MAXIMA),
    pagina: bruto.page,
  };
}

export async function descobrirFilmes(filtros: Filtros): Promise<ResultadoDescoberta> {
  const provedores = await obterProvedores();
  const parametros = montarParametrosDescoberta(
    filtros,
    provedores.map((p) => p.id),
  );

  const bruto = await buscarNoTmdb<RespostaPaginada<FilmeResumoTmdb>>(
    '/discover/movie',
    parametros,
    CACHE.descoberta,
  );

  return montarResultado(bruto);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/tmdb/descobrir.test.ts`
Expected: PASS.

- [ ] **Step 5: Commitar**

```bash
git add src/lib/tmdb/descobrir.ts src/lib/tmdb/descobrir.test.ts
git commit -m "feat: consulta de descoberta com serviços padrão do BR"
```

---

### Task 8: Descrever filtros — chips, SEO e o filtro mais restritivo

**Files:**
- Create: `src/lib/filtros/descrever.ts`
- Test: `src/lib/filtros/descrever.test.ts`

**Interfaces:**
- Consumes: `Filtros`, `comFiltros`, `Provedor`, `Genero`
- Produces:
  - `interface Catalogos { provedores: Provedor[]; generos: Genero[] }`
  - `interface Chip { chave: string; rotulo: string; hrefRemover: string }`
  - `function chipsAtivos(filtros: Filtros, catalogos: Catalogos): Chip[]`
  - `interface Sugestao { mensagem: string; rotuloAcao: string; href: string }`
  - `function sugerirAfrouxamento(filtros: Filtros): Sugestao | null`
  - `function tituloDaPagina(filtros: Filtros, catalogos: Catalogos): string`

A ordem de suspeita ao afrouxar é: nota → duração → faixa de anos → idioma. Se nenhum desses estiver ativo, não há sugestão.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/filtros/descrever.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/filtros/descrever.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

Criar `src/lib/filtros/descrever.ts`:

```ts
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

const ROTULO_IDIOMA: Record<string, string> = {
  pt: 'Em português',
  en: 'Em inglês',
  es: 'Em espanhol',
  fr: 'Em francês',
  ja: 'Em japonês',
  ko: 'Em coreano',
};

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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/filtros/descrever.test.ts`
Expected: PASS.

- [ ] **Step 5: Rodar a suíte inteira e commitar**

Run: `npm test`
Expected: PASS — todos os arquivos de teste verdes.

```bash
git add src/lib/filtros/descrever.ts src/lib/filtros/descrever.test.ts
git commit -m "feat: chips, sugestão de afrouxamento e título de SEO a partir dos filtros"
```

---

### Task 9: Casca do app — tokens, fontes, cabeçalho, rodapé e telas de erro

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/cabecalho.tsx`, `src/components/rodape.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`
- Create: `public/tmdb.svg`

**Interfaces:**
- Consumes: nada
- Produces: classes utilitárias de cor (`bg-fundo`, `text-acento`, `border-borda`…) e as fontes `font-serif` / `font-sans` disponíveis em todo o app

- [ ] **Step 1: Definir os tokens de cor e tipografia**

Substituir o conteúdo de `src/app/globals.css` por:

```css
@import "tailwindcss";

@theme {
  --color-fundo: #111310;
  --color-superficie: #191C17;
  --color-borda: #2A2D26;
  --color-texto: #E9E7DD;
  --color-suave: #7D8074;
  --color-acento: #CDEA4F;
  --color-sobre-acento: #111310;

  --font-serif: var(--fonte-titulo), Georgia, "Times New Roman", serif;
  --font-sans: var(--fonte-corpo), system-ui, sans-serif;
}

body {
  background-color: var(--color-fundo);
  color: var(--color-texto);
}

/* Micro-etiqueta do editorial: caixa alta, espaçada, discreta. */
.etiqueta {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-suave);
}
```

- [ ] **Step 2: Carregar as fontes e montar o layout**

Substituir `src/app/layout.tsx` por:

```tsx
import type { Metadata } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import { Cabecalho } from '@/components/cabecalho';
import { Rodape } from '@/components/rodape';
import './globals.css';

const fonteTitulo = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--fonte-titulo',
  display: 'swap',
});

const fonteCorpo = Inter({
  subsets: ['latin'],
  variable: '--fonte-corpo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Cine Brasil — o que está no streaming agora',
    template: '%s · Cine Brasil',
  },
  description:
    'Descubra quais filmes estão disponíveis nos serviços de streaming por assinatura no Brasil.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteCorpo.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Cabecalho />
        <main className="mx-auto w-full max-w-7xl px-5 py-8">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Cabeçalho**

Criar `src/components/cabecalho.tsx`:

```tsx
import Link from 'next/link';

export function Cabecalho() {
  return (
    <header className="border-b border-borda">
      <div className="mx-auto flex w-full max-w-7xl items-baseline justify-between px-5 py-5">
        <Link href="/" className="font-serif text-2xl italic">
          Cine <span className="text-acento not-italic">Brasil</span>
        </Link>
        <nav className="flex gap-6">
          <Link href="/" className="etiqueta hover:text-texto">
            Descobrir
          </Link>
          <Link href="/busca" className="etiqueta hover:text-texto">
            Buscar
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Baixar o logo do TMDB**

Baixar o logo oficial em <https://www.themoviedb.org/about/logos-attribution> (versão curta, fundo escuro) e salvar como `public/tmdb.svg`. O uso do logo é exigência dos termos da API, não escolha de design.

- [ ] **Step 5: Rodapé com a atribuição**

Criar `src/components/rodape.tsx`:

```tsx
import Image from 'next/image';

export function Rodape() {
  return (
    <footer className="mt-16 border-t border-borda">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/tmdb.svg" alt="The Movie Database" width={80} height={11} />
          <p className="text-xs text-suave">
            Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
          </p>
        </div>
        <p className="text-xs text-suave">
          Disponibilidade de streaming fornecida por JustWatch.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Telas de erro e de não encontrado**

Criar `src/app/error.tsx`:

```tsx
'use client';

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24 text-center">
      <h1 className="font-serif text-3xl">Não deu para carregar o catálogo</h1>
      <p className="mx-auto mt-3 max-w-md text-suave">
        O serviço de dados de filmes não respondeu agora. Isso costuma ser passageiro.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-sm bg-acento px-5 py-2 text-sm font-semibold text-sobre-acento"
      >
        Tentar de novo
      </button>
    </div>
  );
}
```

Criar `src/app/not-found.tsx`:

```tsx
import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-serif text-3xl">Filme não encontrado</h1>
      <p className="mx-auto mt-3 max-w-md text-suave">
        Esse endereço não corresponde a nenhum filme do catálogo.
      </p>
      <Link href="/" className="etiqueta mt-6 inline-block hover:text-texto">
        Voltar para a descoberta
      </Link>
    </div>
  );
}
```

- [ ] **Step 7: Conferir no navegador**

Run: `npm run dev`
Expected: a home mostra cabeçalho com "Cine **Brasil**" (a segunda palavra em lima), fundo `#111310`, e rodapé com o logo do TMDB e as duas frases de atribuição.

- [ ] **Step 8: Commitar**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/cabecalho.tsx src/components/rodape.tsx src/app/error.tsx src/app/not-found.tsx public/tmdb.svg
git commit -m "feat: casca do app com tokens editoriais, fontes e atribuição do TMDB"
```

---

### Task 10: Cartão, grade e paginação

**Files:**
- Create: `src/components/cartao-filme.tsx`, `src/components/grade-filmes.tsx`, `src/components/paginacao.tsx`

**Interfaces:**
- Consumes: `FilmeResumo` de `@/lib/tmdb/normalizar`; `Filtros`, `comFiltros` de `@/lib/filtros/schema`
- Produces:
  - `function CartaoFilme({ filme }: { filme: FilmeResumo })`
  - `function GradeFilmes({ filmes }: { filmes: FilmeResumo[] })`
  - `function Paginacao({ filtros, pagina, totalPaginas, base }: { filtros: Filtros; pagina: number; totalPaginas: number; base?: string })`

- [ ] **Step 1: Cartão do filme**

Criar `src/components/cartao-filme.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { FilmeResumo } from '@/lib/tmdb/normalizar';

export function CartaoFilme({ filme }: { filme: FilmeResumo }) {
  return (
    <Link href={`/filme/${filme.id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden bg-superficie">
        {filme.poster ? (
          <Image
            src={filme.poster}
            alt={`Pôster de ${filme.titulo}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 23vw, 15vw"
            className="object-cover transition-opacity group-hover:opacity-80"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center">
            <span className="etiqueta">sem pôster</span>
          </div>
        )}
      </div>
      <h3 className="mt-2 font-serif text-base leading-tight">{filme.titulo}</h3>
      <p className="mt-1 text-xs text-suave">
        {filme.ano ?? '—'}
        {filme.nota !== null && (
          <>
            {' · '}
            <span className="font-semibold text-acento">{filme.nota.toFixed(1)}</span>
          </>
        )}
      </p>
    </Link>
  );
}
```

- [ ] **Step 2: Grade**

Criar `src/components/grade-filmes.tsx`:

```tsx
import { CartaoFilme } from './cartao-filme';
import type { FilmeResumo } from '@/lib/tmdb/normalizar';

export function GradeFilmes({ filmes }: { filmes: FilmeResumo[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {filmes.map((filme) => (
        <CartaoFilme key={filme.id} filme={filme} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Paginação**

Criar `src/components/paginacao.tsx`:

```tsx
import Link from 'next/link';
import { comFiltros, type Filtros } from '@/lib/filtros/schema';

interface Props {
  filtros: Filtros;
  pagina: number;
  totalPaginas: number;
  base?: string;
  /** Parâmetros que não são filtros e precisam sobreviver à troca de página (ex.: o termo da busca). */
  extras?: Record<string, string>;
}

function montarLink(
  filtros: Filtros,
  novaPagina: number,
  base: string,
  extras?: Record<string, string>,
): string {
  const url = comFiltros({ ...filtros, pagina: novaPagina }, base);
  if (!extras || Object.keys(extras).length === 0) return url;
  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}${new URLSearchParams(extras).toString()}`;
}

export function Paginacao({ filtros, pagina, totalPaginas, base = '/', extras }: Props) {
  if (totalPaginas <= 1) return null;

  const anterior = pagina > 1 ? montarLink(filtros, pagina - 1, base, extras) : null;
  const proxima = pagina < totalPaginas ? montarLink(filtros, pagina + 1, base, extras) : null;

  return (
    <nav className="mt-12 flex items-center justify-between border-t border-borda pt-6">
      {anterior ? (
        <Link href={anterior} rel="prev" className="etiqueta hover:text-texto">
          ← Anterior
        </Link>
      ) : (
        <span className="etiqueta opacity-40">← Anterior</span>
      )}

      <span className="etiqueta">
        Página {pagina} de {totalPaginas}
      </span>

      {proxima ? (
        <Link href={proxima} rel="next" className="etiqueta hover:text-texto">
          Próxima →
        </Link>
      ) : (
        <span className="etiqueta opacity-40">Próxima →</span>
      )}
    </nav>
  );
}
```

- [ ] **Step 4: Commitar**

```bash
git add src/components/cartao-filme.tsx src/components/grade-filmes.tsx src/components/paginacao.tsx
git commit -m "feat: cartão de filme, grade responsiva e paginação por link"
```

---

### Task 11: Barra de filtros

**Files:**
- Create: `src/components/barra-filtros/index.tsx`, `src/components/barra-filtros/seletor-servicos.tsx`, `src/components/barra-filtros/chips.tsx`, `src/components/barra-filtros/mais-filtros.tsx`

**Interfaces:**
- Consumes: `Filtros`, `comFiltros`, `DURACOES`, `ORDENS`, `Catalogos`, `chipsAtivos`
- Produces: `function BarraFiltros({ filtros, catalogos }: { filtros: Filtros; catalogos: Catalogos })`

Toda interação é link. O painel "+ mais filtros" usa `<details>`/`<summary>`, que abre e fecha sem JavaScript.

- [ ] **Step 1: Seletor de serviços**

Criar `src/components/barra-filtros/seletor-servicos.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { comFiltros, type Filtros } from '@/lib/filtros/schema';
import type { Provedor } from '@/lib/tmdb/normalizar';

interface Props {
  filtros: Filtros;
  provedores: Provedor[];
}

export function SeletorServicos({ filtros, provedores }: Props) {
  return (
    <div>
      <p className="etiqueta mb-3">disponível na assinatura</p>
      <ul className="flex flex-wrap gap-3">
        {provedores.map((provedor) => {
          const ativo = filtros.servicos.includes(provedor.id);
          const servicos = ativo
            ? filtros.servicos.filter((id) => id !== provedor.id)
            : [...filtros.servicos, provedor.id];

          return (
            <li key={provedor.id}>
              <Link
                href={comFiltros({ ...filtros, servicos, pagina: 1 })}
                aria-label={`${ativo ? 'Remover' : 'Filtrar por'} ${provedor.nome}`}
                aria-pressed={ativo}
                className={`block overflow-hidden rounded-full border-2 transition ${
                  ativo ? 'border-acento' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={provedor.logo} alt={provedor.nome} width={44} height={44} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Chips dos filtros ativos**

Criar `src/components/barra-filtros/chips.tsx`:

```tsx
import Link from 'next/link';
import type { Chip } from '@/lib/filtros/descrever';

export function ChipsAtivos({ chips }: { chips: Chip[] }) {
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.chave}>
          <Link
            href={chip.hrefRemover}
            className="etiqueta inline-flex items-center gap-2 rounded-sm bg-acento px-3 py-1.5 !text-sobre-acento"
          >
            {chip.rotulo}
            <span aria-hidden="true">✕</span>
            <span className="sr-only">remover filtro</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Painel de mais filtros**

Criar `src/components/barra-filtros/mais-filtros.tsx`:

```tsx
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
```

- [ ] **Step 4: Montar a barra**

Criar `src/components/barra-filtros/index.tsx`:

```tsx
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
```

- [ ] **Step 5: Commitar**

```bash
git add src/components/barra-filtros
git commit -m "feat: barra de filtros por link, sem JavaScript no cliente"
```

---

### Task 12: Página de descoberta

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/estado-vazio.tsx`, `src/components/ordenacao.tsx`

**Interfaces:**
- Consumes: `lerFiltros`, `descobrirFilmes`, `obterProvedores`, `obterGeneros`, `tituloDaPagina`, `sugerirAfrouxamento`, `BarraFiltros`, `GradeFilmes`, `Paginacao`
- Produces: rota `/` e sua `generateMetadata`

- [ ] **Step 1: Estado vazio**

Criar `src/components/estado-vazio.tsx`:

```tsx
import Link from 'next/link';
import { sugerirAfrouxamento } from '@/lib/filtros/descrever';
import type { Filtros } from '@/lib/filtros/schema';

export function EstadoVazio({ filtros }: { filtros: Filtros }) {
  const sugestao = sugerirAfrouxamento(filtros);

  return (
    <div className="border border-borda px-6 py-16 text-center">
      <h2 className="font-serif text-2xl">Nenhum filme com esses filtros</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-suave">
        {sugestao?.mensagem ?? 'Essa combinação de filtros não devolveu nada no catálogo de assinatura.'}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {sugestao && (
          <Link
            href={sugestao.href}
            className="rounded-sm bg-acento px-5 py-2 text-sm font-semibold text-sobre-acento"
          >
            {sugestao.rotuloAcao}
          </Link>
        )}
        <Link href="/" className="etiqueta self-center hover:text-texto">
          limpar tudo
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Seletor de ordenação**

Criar `src/components/ordenacao.tsx`:

```tsx
import Link from 'next/link';
import { comFiltros, ORDENS, type Filtros, type Ordem } from '@/lib/filtros/schema';

const ROTULO: Record<Ordem, string> = {
  populares: 'popularidade',
  nota: 'nota',
  lancamento: 'lançamento',
  titulo: 'título',
};

export function Ordenacao({ filtros }: { filtros: Filtros }) {
  return (
    <div className="etiqueta flex flex-wrap items-center gap-2">
      <span>ordenar por</span>
      {ORDENS.map((ordem) => (
        <Link
          key={ordem}
          href={comFiltros({ ...filtros, ordem, pagina: 1 })}
          className={ordem === filtros.ordem ? '!text-acento' : 'hover:!text-texto'}
        >
          {ROTULO[ordem]}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: A página**

Substituir `src/app/page.tsx` por:

```tsx
import type { Metadata } from 'next';
import { BarraFiltros } from '@/components/barra-filtros';
import { EstadoVazio } from '@/components/estado-vazio';
import { GradeFilmes } from '@/components/grade-filmes';
import { Ordenacao } from '@/components/ordenacao';
import { Paginacao } from '@/components/paginacao';
import { tituloDaPagina } from '@/lib/filtros/descrever';
import { lerFiltros, type ParamsBrutos } from '@/lib/filtros/schema';
import { obterGeneros, obterProvedores } from '@/lib/tmdb/catalogos';
import { descobrirFilmes } from '@/lib/tmdb/descobrir';

interface Props {
  searchParams: Promise<ParamsBrutos>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filtros = lerFiltros(await searchParams);
  const [provedores, generos] = await Promise.all([obterProvedores(), obterGeneros()]);
  const titulo = tituloDaPagina(filtros, { provedores, generos });

  return {
    title: titulo,
    description: `${titulo}, disponíveis por assinatura no Brasil.`,
  };
}

export default async function PaginaDescoberta({ searchParams }: Props) {
  const filtros = lerFiltros(await searchParams);

  const [provedores, generos, resultado] = await Promise.all([
    obterProvedores(),
    obterGeneros(),
    descobrirFilmes(filtros),
  ]);

  const catalogos = { provedores, generos };

  return (
    <div className="space-y-8">
      <h1 className="sr-only">{tituloDaPagina(filtros, catalogos)}</h1>

      <BarraFiltros filtros={filtros} catalogos={catalogos} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borda pt-5">
        <p className="etiqueta">
          {resultado.totalResultados.toLocaleString('pt-BR')}{' '}
          {resultado.totalResultados === 1 ? 'filme' : 'filmes'}
        </p>
        <Ordenacao filtros={filtros} />
      </div>

      {resultado.filmes.length === 0 ? (
        <EstadoVazio filtros={filtros} />
      ) : (
        <>
          <GradeFilmes filmes={resultado.filmes} />
          <Paginacao
            filtros={filtros}
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Conferir no navegador**

Run: `npm run dev`
Expected:
- `/` mostra a grade com filmes de todos os serviços de assinatura do BR
- clicar num logo de serviço muda a URL para `?servico=<id>` e a grade muda
- `/?nota=9&duracao=ate-90&idioma=ko` provavelmente zera os resultados e mostra o estado vazio com a sugestão de baixar a nota
- `/?pagina=2` mostra a segunda página

- [ ] **Step 5: Commitar**

```bash
git add src/app/page.tsx src/components/estado-vazio.tsx src/components/ordenacao.tsx
git commit -m "feat: página de descoberta com filtros, ordenação, paginação e estado vazio"
```

---

### Task 13: Detalhes do filme (dados)

**Files:**
- Create: `src/lib/tmdb/filme.ts`

**Interfaces:**
- Consumes: `buscarNoTmdb`, `CACHE`, `ErroTmdb`, `normalizarDetalhe`
- Produces: `async function obterFilme(id: number): Promise<FilmeDetalhe | null>`

Devolve `null` quando o TMDB responde 404, para a página poder chamar `notFound()`. Qualquer outro erro sobe e cai na tela de erro.

- [ ] **Step 1: Implementar**

Criar `src/lib/tmdb/filme.ts`:

```ts
import { buscarNoTmdb, CACHE, ErroTmdb } from './cliente';
import { normalizarDetalhe, type FilmeDetalhe } from './normalizar';
import type { FilmeDetalheTmdb } from './tipos';

const EXTRAS = 'credits,videos,similar,watch/providers';

export async function obterFilme(id: number): Promise<FilmeDetalhe | null> {
  let bruto: FilmeDetalheTmdb;

  try {
    bruto = await buscarNoTmdb<FilmeDetalheTmdb>(
      `/movie/${id}`,
      { append_to_response: EXTRAS },
      CACHE.filme,
    );
  } catch (erro) {
    if (erro instanceof ErroTmdb && erro.status === 404) return null;
    throw erro;
  }

  // Muitos filmes não têm sinopse traduzida. Vale uma segunda ida — é rara e fica em cache.
  if (!bruto.overview.trim()) {
    try {
      const emIngles = await buscarNoTmdb<{ overview: string }>(
        `/movie/${id}`,
        { language: 'en-US' },
        CACHE.filme,
      );
      bruto = { ...bruto, overview: emIngles.overview };
    } catch {
      // Sinopse é opcional: se a segunda tentativa falhar, a página segue sem ela.
    }
  }

  return normalizarDetalhe(bruto);
}
```

Nota de implementação: `buscarNoTmdb` define `language=pt-BR` antes de aplicar os parâmetros recebidos, então passar `language: 'en-US'` sobrescreve corretamente.

- [ ] **Step 2: Verificar a tipagem e commitar**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/lib/tmdb/filme.ts
git commit -m "feat: leitura de detalhes do filme com recurso à sinopse em inglês"
```

---

### Task 14: Página do filme

**Files:**
- Create: `src/app/filme/[id]/page.tsx`, `src/components/selos-provedor.tsx`, `src/components/trailer.tsx`

**Interfaces:**
- Consumes: `obterFilme`, `FilmeDetalhe`, `GradeFilmes`
- Produces: rota `/filme/[id]` com `generateMetadata`

- [ ] **Step 1: Selos de provedor com o crédito ao JustWatch**

Criar `src/components/selos-provedor.tsx`:

```tsx
import Image from 'next/image';
import type { Provedor } from '@/lib/tmdb/normalizar';

export function SelosProvedor({ provedores }: { provedores: Provedor[] }) {
  return (
    <section aria-labelledby="onde-assistir">
      <h2 id="onde-assistir" className="etiqueta mb-3">
        onde assistir
      </h2>

      {provedores.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-3">
          {provedores.map((provedor) => (
            <li key={provedor.id} className="flex items-center gap-2">
              {/* Sem link: o TMDB não fornece endereço do provedor. */}
              <Image
                src={provedor.logo}
                alt=""
                width={44}
                height={44}
                className="rounded-lg"
              />
              <span className="text-sm">{provedor.nome}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-prose text-sm text-suave">
          Este filme não está em nenhum serviço de streaming por assinatura no Brasil no momento.
          Ele pode estar disponível para aluguel ou compra.
        </p>
      )}

      <p className="mt-3 text-xs text-suave">
        Disponibilidade fornecida por JustWatch.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Trailer — o único componente de cliente**

Criar `src/components/trailer.tsx`:

```tsx
'use client';

import { useState } from 'react';

export function Trailer({ youtubeId, titulo }: { youtubeId: string; titulo: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="rounded-sm border border-borda px-5 py-2 text-sm hover:border-acento hover:text-acento"
      >
        ▶ Ver trailer
      </button>
    );
  }

  return (
    <div className="aspect-video w-full max-w-2xl">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
        title={`Trailer de ${titulo}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
```

- [ ] **Step 3: A página**

Criar `src/app/filme/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { GradeFilmes } from '@/components/grade-filmes';
import { SelosProvedor } from '@/components/selos-provedor';
import { Trailer } from '@/components/trailer';
import { obterFilme } from '@/lib/tmdb/filme';

interface Props {
  params: Promise<{ id: string }>;
}

function idValido(bruto: string): number | null {
  const id = Number(bruto);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = idValido((await params).id);
  const filme = id ? await obterFilme(id) : null;
  if (!filme) return { title: 'Filme não encontrado' };

  const descricao =
    filme.sinopse ??
    `${filme.titulo}${filme.ano ? ` (${filme.ano})` : ''} — disponibilidade no streaming brasileiro.`;

  return {
    title: filme.titulo,
    description: descricao.slice(0, 160),
    openGraph: {
      title: filme.titulo,
      description: descricao.slice(0, 160),
      images: filme.fundo ? [filme.fundo] : filme.poster ? [filme.poster] : [],
      type: 'video.movie',
    },
  };
}

export default async function PaginaFilme({ params }: Props) {
  const id = idValido((await params).id);
  if (!id) notFound();

  const filme = await obterFilme(id);
  if (!filme) notFound();

  return (
    <article className="space-y-10">
      <header className="relative">
        {filme.fundo && (
          <div className="relative -mx-5 mb-6 aspect-[21/9] overflow-hidden">
            <Image
              src={filme.fundo}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-fundo to-transparent" />
          </div>
        )}

        <div className="flex flex-col gap-6 sm:flex-row">
          {filme.poster && (
            <Image
              src={filme.poster}
              alt={`Pôster de ${filme.titulo}`}
              width={180}
              height={270}
              className="w-32 shrink-0 sm:w-44"
            />
          )}

          <div>
            <h1 className="font-serif text-4xl leading-tight">{filme.titulo}</h1>
            <p className="mt-3 text-sm text-suave">
              {[
                filme.ano ?? '—',
                filme.duracao ? `${filme.duracao} min` : null,
                filme.generos.join(', ') || null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {filme.nota !== null && (
              <p className="mt-2 text-sm">
                Nota <span className="font-semibold text-acento">{filme.nota.toFixed(1)}</span>
              </p>
            )}
            {filme.trailerYoutube && (
              <div className="mt-5">
                <Trailer youtubeId={filme.trailerYoutube} titulo={filme.titulo} />
              </div>
            )}
          </div>
        </div>
      </header>

      <SelosProvedor provedores={filme.provedores} />

      {filme.sinopse && (
        <section>
          <h2 className="etiqueta mb-3">sinopse</h2>
          <p className="max-w-prose leading-relaxed">{filme.sinopse}</p>
        </section>
      )}

      {(filme.diretor || filme.elenco.length > 0) && (
        <section>
          <h2 className="etiqueta mb-3">quem fez</h2>
          {filme.diretor && (
            <p className="mb-4 text-sm">
              Direção de <span className="font-serif text-base">{filme.diretor}</span>
            </p>
          )}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {filme.elenco.map((pessoa) => (
              <li key={`${pessoa.nome}-${pessoa.personagem}`} className="flex items-center gap-3">
                {pessoa.foto ? (
                  <Image
                    src={pessoa.foto}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-full bg-superficie" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm">{pessoa.nome}</p>
                  <p className="truncate text-xs text-suave">{pessoa.personagem}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {filme.parecidos.length > 0 && (
        <section>
          <h2 className="etiqueta mb-4">parecidos</h2>
          <GradeFilmes filmes={filme.parecidos} />
        </section>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Conferir no navegador**

Run: `npm run dev`
Expected:
- clicar num filme da grade abre `/filme/<id>` com pôster, dados, seção "onde assistir" e o crédito ao JustWatch
- um filme sem serviço de assinatura mostra a frase declarando isso, não uma seção vazia
- `/filme/999999999` devolve a tela de "Filme não encontrado" com status 404
- o trailer só carrega o player depois do clique

- [ ] **Step 5: Commitar**

```bash
git add src/app/filme src/components/selos-provedor.tsx src/components/trailer.tsx
git commit -m "feat: página do filme com provedores, elenco, trailer sob demanda e metadados"
```

---

### Task 15: Busca

**Files:**
- Create: `src/lib/tmdb/buscar.ts`, `src/app/busca/page.tsx`

**Interfaces:**
- Consumes: `buscarNoTmdb`, `CACHE`, `montarResultado`
- Produces: `async function buscarFilmes(termo: string, pagina: number): Promise<ResultadoDescoberta>`; rota `/busca`

- [ ] **Step 1: Consulta de busca**

Criar `src/lib/tmdb/buscar.ts`:

```ts
import { buscarNoTmdb, CACHE } from './cliente';
import { montarResultado, type ResultadoDescoberta } from './descobrir';
import type { FilmeResumoTmdb, RespostaPaginada } from './tipos';

export async function buscarFilmes(termo: string, pagina: number): Promise<ResultadoDescoberta> {
  const bruto = await buscarNoTmdb<RespostaPaginada<FilmeResumoTmdb>>(
    '/search/movie',
    { query: termo, page: String(pagina), include_adult: 'false' },
    CACHE.busca,
  );

  return montarResultado(bruto);
}
```

- [ ] **Step 2: Página de busca**

Criar `src/app/busca/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { GradeFilmes } from '@/components/grade-filmes';
import { Paginacao } from '@/components/paginacao';
import { FILTROS_PADRAO, lerFiltros, type ParamsBrutos } from '@/lib/filtros/schema';
import { buscarFilmes } from '@/lib/tmdb/buscar';

interface Props {
  searchParams: Promise<ParamsBrutos>;
}

export const metadata: Metadata = {
  title: 'Buscar filmes',
  description: 'Procure um filme pelo título e veja onde ele está disponível no Brasil.',
};

export default async function PaginaBusca({ searchParams }: Props) {
  const params = await searchParams;
  const termo = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? '';
  const { pagina } = lerFiltros(params);

  const resultado = termo ? await buscarFilmes(termo, pagina) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Buscar filmes</h1>
        <p className="mt-2 max-w-prose text-sm text-suave">
          A busca procura em todos os filmes do acervo — a disponibilidade no streaming aparece na
          página de cada um.
        </p>
      </div>

      <form action="/busca" className="flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={termo}
          placeholder="Título do filme"
          aria-label="Título do filme"
          className="w-full max-w-md rounded-sm border border-borda bg-superficie px-4 py-2 text-sm outline-none focus:border-acento"
        />
        <button
          type="submit"
          className="rounded-sm bg-acento px-5 py-2 text-sm font-semibold text-sobre-acento"
        >
          Buscar
        </button>
      </form>

      {resultado === null ? (
        <p className="etiqueta">digite um título para começar</p>
      ) : resultado.filmes.length === 0 ? (
        <div className="border border-borda px-6 py-16 text-center">
          <h2 className="font-serif text-2xl">Nenhum filme com esse título</h2>
          <p className="mt-3 text-sm text-suave">Verifique a grafia ou tente parte do nome.</p>
        </div>
      ) : (
        <>
          <p className="etiqueta">
            {resultado.totalResultados.toLocaleString('pt-BR')} resultados para “{termo}”
          </p>
          <GradeFilmes filmes={resultado.filmes} />
          <Paginacao
            filtros={{ ...FILTROS_PADRAO, pagina: resultado.pagina }}
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            base="/busca"
            extras={{ q: termo }}
          />
        </>
      )}
    </div>
  );
}
```

O `extras={{ q: termo }}` é o que faz o termo da busca sobreviver à troca de página — a propriedade já existe em `Paginacao` desde a Task 10.

- [ ] **Step 3: Conferir no navegador**

Run: `npm run dev`
Expected: `/busca?q=matrix` lista resultados; a segunda página mantém `q=matrix` na URL; `/busca` sem termo mostra só o campo.

- [ ] **Step 4: Commitar**

```bash
git add src/lib/tmdb/buscar.ts src/app/busca
git commit -m "feat: busca por título com aviso sobre o escopo do acervo"
```

---

### Task 16: Testes de ponta a ponta

**Files:**
- Create: `playwright.config.ts`, `e2e/descoberta.spec.ts`, `e2e/filme.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: o app inteiro rodando
- Produces: comando `npm run test:e2e`

Estes testes falam com a API real do TMDB, então exigem `TMDB_ACCESS_TOKEN` no ambiente.

- [ ] **Step 1: Instalar o Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Configurar**

Criar `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

Adicionar ao `package.json`:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Escrever os testes da descoberta**

Criar `e2e/descoberta.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('filtrar por gênero muda a grade e a URL, e sobrevive ao recarregar', async ({ page }) => {
  await page.goto('/');

  const primeiroTitulo = await page.locator('article, a h3').first().textContent();

  await page.getByRole('link', { name: 'Terror', exact: true }).click();
  await expect(page).toHaveURL(/genero=27/);

  await expect(page.getByText('filtros ativos')).toBeVisible();
  await expect(page.getByRole('link', { name: /Terror/ }).first()).toBeVisible();

  const urlFiltrada = page.url();
  await page.reload();
  expect(page.url()).toBe(urlFiltrada);
  await expect(page.locator('a h3').first()).toBeVisible();
  expect(await page.locator('a h3').first().textContent()).not.toBe(primeiroTitulo);
});

test('resultado vazio oferece afrouxar o filtro num clique', async ({ page }) => {
  await page.goto('/?nota=9&duracao=ate-90&idioma=ko&genero=27');

  await expect(page.getByText('Nenhum filme com esses filtros')).toBeVisible();

  const acao = page.getByRole('link', { name: /Tentar nota 8/ });
  await expect(acao).toBeVisible();
  await acao.click();

  await expect(page).toHaveURL(/nota=8/);
});

test('a paginação avança e mantém os filtros', async ({ page }) => {
  await page.goto('/?genero=27');
  await page.getByRole('link', { name: /Próxima/ }).click();

  await expect(page).toHaveURL(/genero=27/);
  await expect(page).toHaveURL(/pagina=2/);
  await expect(page.getByText('Página 2 de')).toBeVisible();
});
```

- [ ] **Step 4: Escrever o teste da página do filme**

Criar `e2e/filme.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('abrir um filme mostra onde assistir com o crédito ao JustWatch', async ({ page }) => {
  await page.goto('/?servico=8');
  await page.locator('a[href^="/filme/"]').first().click();

  await expect(page).toHaveURL(/\/filme\/\d+/);
  await expect(page.getByRole('heading', { name: 'onde assistir' })).toBeVisible();
  await expect(page.getByText('Disponibilidade fornecida por JustWatch.')).toBeVisible();
});

test('id inexistente devolve 404', async ({ page }) => {
  const resposta = await page.goto('/filme/999999999');
  expect(resposta?.status()).toBe(404);
  await expect(page.getByText('Filme não encontrado')).toBeVisible();
});

test('o player do trailer só carrega depois do clique', async ({ page }) => {
  await page.goto('/?servico=8');
  await page.locator('a[href^="/filme/"]').first().click();

  const botao = page.getByRole('button', { name: /Ver trailer/ });
  if (await botao.isVisible()) {
    await expect(page.locator('iframe')).toHaveCount(0);
    await botao.click();
    await expect(page.locator('iframe')).toHaveCount(1);
  }
});
```

- [ ] **Step 5: Rodar**

Run: `npm run test:e2e`
Expected: PASS em todos os testes. (Se o teste de gênero falhar por o rótulo "Terror" não estar entre os dez primeiros gêneros retornados, ajustar o nome do gênero no teste para um que apareça na barra.)

- [ ] **Step 6: Commitar**

```bash
git add playwright.config.ts e2e package.json package-lock.json
git commit -m "test: fluxos de ponta a ponta de descoberta, estado vazio e página do filme"
```

---

### Task 17: Verificação final, README e publicação

**Files:**
- Create: `README.md`
- Modify: nenhum código

**Interfaces:**
- Consumes: tudo
- Produces: projeto pronto para publicar

- [ ] **Step 1: Rodar a verificação completa**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```

Expected: todos os comandos terminam sem erro.

- [ ] **Step 2: Conferir que o token não vaza**

```bash
npm run build
grep -r "$(node -e "process.stdout.write(process.env.TMDB_ACCESS_TOKEN?.slice(0,12) ?? 'SEM_TOKEN')")" .next/static || echo "OK: token ausente do pacote do cliente"
```

Expected: `OK: token ausente do pacote do cliente`.

- [ ] **Step 3: Medir Lighthouse**

Com `npm run build && npm start` rodando, medir a home e uma página de filme (aba Lighthouse do Chrome DevTools, modo Navigation, dispositivo Desktop).

Expected: Desempenho ≥ 90 e Acessibilidade ≥ 95 nas duas páginas. Se Acessibilidade reprovar, as causas prováveis são contraste do texto suave sobre o fundo em elementos pequenos e links de logo sem nome acessível — ambos já têm `aria-label` no código; conferir se algum foi esquecido.

- [ ] **Step 4: Escrever o README**

Criar `README.md`:

```markdown
# Cine Brasil

Catálogo dos filmes disponíveis nos serviços de streaming por assinatura no Brasil.
Descoberta filtrável por serviço, gênero, ano, nota, duração e idioma.

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha TMDB_ACCESS_TOKEN
npm run dev
```

O token é o *API Read Access Token* (v4) do TMDB, obtido em
<https://www.themoviedb.org/settings/api>.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes de unidade (Vitest) — rodam sem rede |
| `npm run test:e2e` | Testes de ponta a ponta (Playwright) — exigem o token |
| `npm run build` | Build de produção |

## Como funciona

Componentes de servidor consultam o TMDB antes de o HTML sair; o navegador não faz
requisições de dados. Todo o estado de filtro vive na URL, então cada tela tem
endereço próprio, compartilhável e indexável.

A camada `src/lib/tmdb` isola o formato da API; nenhum componente conhece os nomes
de campo do TMDB. A lógica pura (`src/lib/filtros`) é o que recebe testes de unidade.

Design e decisões: `docs/superpowers/specs/2026-08-13-catalogo-filmes-streaming-design.md`.

## Créditos

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
Dados de disponibilidade em streaming fornecidos por JustWatch.
```

- [ ] **Step 5: Publicar na Vercel**

```bash
npx vercel
```

Configurar `TMDB_ACCESS_TOKEN` nas variáveis de ambiente do projeto na Vercel (Production e Preview) e refazer o deploy.

Expected: URL de produção carregando a grade de filmes.

- [ ] **Step 6: Commitar**

```bash
git add README.md
git commit -m "docs: README com instruções de execução e créditos"
```

---

## Verificação contra os critérios de aceite da spec

| Critério | Onde é cumprido |
|---|---|
| 1. Home sem parâmetros lista filmes de assinatura no BR | Tasks 3, 7, 12 |
| 2. Dois serviços = "ou" entre eles | Task 3 (`join('\|')`), Task 11 |
| 3. Sete filtros combinados, refletidos na URL | Tasks 2, 3, 11, 12 |
| 4. `vote_count.gte`, `watch_region`, `flatrate` em toda consulta | Task 3, com teste dedicado |
| 5. Zero resultados com sugestão acionável | Tasks 8, 12, 16 |
| 6. Página do filme mostra serviços ou declara ausência | Tasks 13, 14 |
| 7. Token ausente do pacote do cliente | Task 4 (`server-only`), Task 17 (verificação) |
| 8. Atribuição TMDB e JustWatch | Tasks 9, 14 |
| 9. Metas de Lighthouse | Task 17 |
| 10. Testes de unidade e ponta a ponta passando | Tasks 2–8, 16, 17 |
