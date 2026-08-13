# Catálogo de filmes no streaming (BR) — Design

**Data:** 2026-08-13
**Status:** aprovado, pronto para virar plano de implementação

## 1. Objetivo

Um site que responde a uma pergunta: **o que eu posso assistir agora, sem pagar nada além do que já assino?**

O usuário chega sem saber o que quer ver. Ele escolhe serviços de streaming e refina por gênero, ano, nota, duração e idioma até chegar num punhado de filmes que valem a noite. Fonte de dados: API do TMDB (disponibilidade fornecida pelo JustWatch).

Projeto publicado na internet e usado como peça de portfólio — desempenho, SEO e acabamento visual são requisitos, não enfeite.

## 2. Decisões

| Decisão | Escolha |
|---|---|
| Plataforma | Web (Next.js App Router) |
| Uso principal | Descoberta com filtros |
| Região | Brasil apenas (`watch_region=BR`) |
| Disponibilidade | Só assinatura (`flatrate`) |
| Conta de usuário | Nenhuma na v1 — sem login, sem banco |
| Publicação | Vercel, com foco em portfólio |
| Filtros | Conjunto completo (7 filtros) |
| Layout | Barra horizontal de chips |
| Direção visual | Editorial escuro, acento lima `#CDEA4F` |
| Conteúdo | Filmes apenas (sem séries) |

## 3. Fora de escopo na v1

Séries de TV; aluguel e compra; login, watchlist e favoritos; múltiplos países; deep link direto para o serviço de streaming (o TMDB não fornece); banco de dados próprio e ingestão de catálogo.

## 4. Arquitetura

**Next.js 15 (App Router) + TypeScript + Tailwind CSS + Zod.**

Componentes de servidor buscam os dados no TMDB antes do HTML sair. O navegador recebe a página montada — bom para SEO e para a percepção de velocidade. Não há cliente HTTP no navegador na v1: toda navegação (filtros, paginação) é navegação de verdade, por URL.

A chave da API vive apenas no servidor. Não há banco de dados, fila, nem estado de sessão.

**Regra de fronteira:** nenhum componente de interface conhece o formato de resposta do TMDB. O módulo `lib/tmdb` devolve objetos já normalizados. Trocar a fonte de dados no futuro (por exemplo, por uma ingestão própria) não deve exigir mudança em nenhuma tela.

### Estrutura

```
src/
  app/
    layout.tsx                → cabeçalho, rodapé, atribuições, fontes
    page.tsx                  → descoberta (home)
    filme/[id]/page.tsx       → detalhes do filme
    busca/page.tsx            → resultados de busca
    error.tsx / not-found.tsx → falha de API / filme inexistente
  lib/
    tmdb/
      client.ts               → fetch autenticado + política de cache (server-only)
      discover.ts             → consulta de descoberta
      movie.ts                → detalhes + provedores + elenco + parecidos
      search.ts               → busca por texto
      providers.ts            → lista de serviços de assinatura do BR
      genres.ts               → lista de gêneros
      normalize.ts            → resposta bruta → modelo do app
      types.ts                → tipos das respostas do TMDB
    filters/
      schema.ts               → Zod: searchParams → filtros tipados
      to-tmdb-params.ts       → filtros → query string do TMDB
      describe.ts             → filtros → texto legível (chips, estado vazio, SEO)
  components/
    filter-bar/               → logos de serviço, chips, painel "+ mais filtros"
    movie-grid/               → grade + paginação + estado vazio
    movie-card/
    provider-badges/          → logos + crédito ao JustWatch
    attribution/              → selo "powered by TMDB"
```

## 5. Camada TMDB

### Autenticação

*API Read Access Token* (v4) enviado como `Authorization: Bearer`, lido de `TMDB_ACCESS_TOKEN`.

`client.ts` declara `import 'server-only'` na primeira linha. Se algum módulo de cliente importar essa camada, o build falha. É garantia mecânica de que a chave não chega ao navegador, em vez de disciplina.

### Parâmetros presentes em toda consulta

| Parâmetro | Valor | Motivo |
|---|---|---|
| `language` | `pt-BR` | Títulos e sinopses em português |
| `watch_region` | `BR` | Disponibilidade é por país |
| `with_watch_monetization_types` | `flatrate` | Só o que está incluso na assinatura |
| `include_adult` | `false` | Fora do escopo do catálogo |
| `vote_count.gte` | `50` | Ver seção 6 — não é opcional |

### Cache

Cada tipo de dado tem seu prazo de revalidação, via cache de dados do próprio Next:

| Dado | Revalida | Motivo |
|---|---|---|
| Gêneros | 7 dias | Lista praticamente imutável |
| Provedores BR | 24 h | Muda em escala de meses |
| Descoberta (grade) | 6 h | Catálogo de streaming muda em dias |
| Detalhes do filme | 12 h | Página mais indexada; disponibilidade muda devagar |
| Busca por texto | 1 h | Muitas combinações; cache longo rende pouco |

Toda chamada tem timeout de 8 segundos. Com esse cache, o limite de requisições do TMDB não é uma preocupação operacional.

### Lista de serviços

Vem de `/watch/providers/movie?watch_region=BR`, ordenada pela prioridade de exibição que o próprio TMDB define para o Brasil, cortada nos 12 primeiros. Nenhum ID de provedor é escrito à mão no código — serviço novo ou logo trocado se propaga sozinho.

### Normalização

`normalize.ts` resolve os buracos dos dados antes de entregar à interface:

- Caminho de pôster/fundo → URL completa no tamanho certo; ausência → espaço reservado desenhado (nunca imagem quebrada)
- `release_date` vazia ou ausente → ano nulo, exibido como "—"
- `vote_average === 0` → "sem nota" (no TMDB isso significa "ninguém votou", não "é péssimo")
- Sinopse vazia em pt-BR → recorre à sinopse em inglês; se também vazia, a seção não é renderizada
- Duração ausente ou 0 → campo omitido

## 6. Modelo de filtros

Os filtros vivem inteiramente na URL, em parâmetros legíveis em português. Não há estado de filtro em memória.

```
/?servico=8,119&genero=27&ano=2015-2025&nota=7&duracao=ate-120&idioma=pt&ordem=nota&pagina=2
```

| Parâmetro na URL | Formato | Vira, no TMDB |
|---|---|---|
| `servico` | IDs separados por vírgula | `with_watch_providers` unidos por `\|` (OU) |
| `genero` | IDs separados por vírgula | `with_genres` separados por `,` (E) |
| `ano` | `2015-2025` | `primary_release_date.gte=2015-01-01` e `.lte=2025-12-31` |
| `nota` | inteiro 1–9 | `vote_average.gte` |
| `duracao` | `ate-90` \| `90-120` \| `acima-120` | `with_runtime.lte` / `.gte` |
| `idioma` | código ISO 639-1 | `with_original_language` |
| `ordem` | `populares` \| `nota` \| `lancamento` \| `titulo` | `sort_by` = `popularity.desc` \| `vote_average.desc` \| `primary_release_date.desc` \| `title.asc` |
| `pagina` | inteiro 1–500 | `page` |

**Padrões quando o parâmetro está ausente:** `servico` = todos os serviços de assinatura do BR unidos por `|`; `ordem` = `populares`; `pagina` = 1; demais filtros inativos.

**Validação (Zod).** Todo parâmetro inválido — texto onde se espera número, página negativa, ordenação desconhecida, faixa de ano invertida — cai no padrão em silêncio. A página nunca quebra por causa de URL adulterada.

**A regra do mínimo de votos.** Toda consulta de descoberta carrega `vote_count.gte=50`, sem exceção e sem controle na interface. Sem isso, filtrar por "nota acima de 8" devolve filmes obscuros com três votos e média 10, e o catálogo perde credibilidade na primeira tentativa. Essa regra tem teste dedicado justamente porque é fácil de perder numa refatoração.

## 7. Página de descoberta

**Restrição da API que molda a tela:** `/discover/movie` filtra por serviço mas **não informa** em quais serviços cada filme está. Descobrir isso custaria uma chamada por filme, 20 por página. Duas consequências de desenho:

1. A grade **não exibe selos de serviço**. Os logos aparecem na página do filme, onde uma chamada a mais é barata.
2. Sem nenhum serviço selecionado, o padrão é **todos os serviços de assinatura do BR ao mesmo tempo**. A promessa "tudo que está no streaming agora" se cumpre na primeira visita, sem o usuário precisar escolher nada.

**Composição da tela**, de cima para baixo: cabeçalho com logo e busca; fileira de logos de serviço (seleção múltipla, "ou" entre eles); linha de chips com gênero, ano e nota, mais um botão "+ mais filtros" que abre duração e idioma; linha divisória com a contagem de resultados e o seletor de ordenação; grade de pôsteres, 20 por página.

**Chips.** Cada filtro ativo é um chip aceso com um `✕` que o desliga. É a representação visível do estado — mesma forma no computador e no celular.

**Paginação por links** (`?pagina=N`, com "Anterior/Próxima" e a página atual). Escolhida sobre rolagem infinita porque funciona sem JavaScript, dá endereço próprio a cada página (indexável) e permite voltar sem perder o lugar — o defeito clássico da rolagem infinita num catálogo de garimpo. Limite de 500 páginas, imposto pelo TMDB.

**Estado vazio é primeira classe.** Com sete filtros, chegar a zero resultados é comum, não excepcional. A tela repete os filtros ativos, identifica o mais restritivo (ordem de suspeita: nota, depois duração, depois faixa de ano, depois idioma) e oferece afrouxá-lo com um clique — "sua nota mínima 8 está cortando quase tudo; tentar 7".

## 8. Página do filme

Rota `/filme/[id]`. Uma única chamada ao TMDB usando `append_to_response` para trazer detalhes, provedores, elenco, trailers e parecidos de uma vez.

Ordem na página: imagem de fundo com pôster e título; ano, duração, gêneros e nota; **onde assistir** — logos dos serviços de assinatura no BR com o crédito ao JustWatch logo abaixo; sinopse; direção e elenco principal; trailer; grade de filmes parecidos que devolve o usuário ao fluxo de descoberta.

**Filme sem serviço de assinatura no BR:** acontece com frequência, sobretudo vindo da busca. A seção não some — ela diz claramente que o filme não está em nenhum serviço de assinatura no Brasil e menciona que pode estar disponível para aluguel (sem listar, já que a v1 é só assinatura).

**Trailer:** o player do YouTube só carrega ao clique. Embutir o iframe de saída custaria centenas de kilobytes de terceiros em toda visita, e desempenho faz parte da entrega.

## 9. Busca

Rota `/busca?q=`, sobre `/search/movie`. A busca do TMDB **não** filtra por serviço de streaming — ela procura no acervo inteiro. A interface diz isso explicitamente ("buscando em todos os filmes; a disponibilidade aparece na página de cada um") em vez de fingir o contrário. Resultados levam à página do filme, onde a disponibilidade é resolvida.

## 10. Tratamento de erros

| Situação | Resposta |
|---|---|
| TMDB fora do ar, erro 5xx ou timeout | `error.tsx` com mensagem honesta e botão de tentar de novo; nunca uma tela pendurada |
| Filtros válidos, zero resultados | Não é erro — estado vazio com sugestão de afrouxar (seção 7) |
| ID de filme inexistente | `not-found.tsx`, HTTP 404 de verdade, para não indexar lixo |
| Parâmetro de URL inválido | Cai no padrão silenciosamente (seção 6) |
| Busca com termo vazio | Tela de busca com sugestão, sem chamada à API |

## 11. Direção visual

Editorial escuro: serifa nos títulos, micro-etiquetas em caixa alta com espaçamento largo, linhas divisórias finas, muito respiro, um acento único usado com parcimônia.

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#111310` | Fundo — quase-preto com um fio de verde, para o acento parecer da mesma família |
| `superficie` | `#191C17` | Painéis, campos, chips inativos |
| `borda` | `#2A2D26` | Linhas divisórias e contornos |
| `texto` | `#E9E7DD` | Texto principal (branco levemente quente) |
| `texto-suave` | `#7D8074` | Metadados e etiquetas |
| `acento` | `#CDEA4F` | Filtro ativo, nota, ênfase no logo |
| `acento-texto` | `#111310` | Texto sobre o acento |

**Tipografia:** serifa de display para títulos de filme e cabeçalhos; sans para dados, etiquetas e interface. Micro-etiquetas em caixa alta com `letter-spacing` de aproximadamente `0.14em`. Fontes carregadas via `next/font` (auto-hospedadas, sem requisição a terceiros, sem bloquear a renderização).

**Parcimônia do acento:** o lima aparece apenas em filtro ativo, nota e uma palavra do logo. O editorial escuro funciona porque o acento é raro — sendo raro, pode ser forte.

**Grade:** 6 colunas em telas largas, 4 em médias, 2 no celular. O pôster manda; a interface recua.

## 12. SEO e desempenho

- Cada página de filme gera título, descrição e imagem de compartilhamento próprios (a partir do fundo do filme). Link compartilhado no WhatsApp mostra pôster e sinopse.
- A página de descoberta gera título e descrição a partir dos filtros ativos, via `describe.ts`.
- Imagens pelo `next/image` com dimensões declaradas, servidas do CDN do TMDB no tamanho adequado a cada uso.
- Nenhum JavaScript de terceiros no carregamento inicial.
- Metas verificadas antes de considerar pronto: Lighthouse ≥ 90 em Desempenho e ≥ 95 em Acessibilidade, na home e numa página de filme.

## 13. Atribuição e termos de uso

Exigências dos termos do TMDB, tratadas como parte do produto:

- Selo "powered by TMDB" com o logo oficial, no rodapé de todas as páginas, mais a frase de que o produto usa a API do TMDB sem ser endossado ou certificado por eles.
- Crédito ao **JustWatch** junto aos dados de disponibilidade, na página do filme.
- Nenhum link direto para o serviço de streaming — o TMDB não fornece esses endereços. Os logos são exibidos sem link.

## 14. Testes

**Vitest**, sobre a lógica pura:

- **Parser de filtros:** `?nota=abc`, `?pagina=-5`, `?pagina=99999`, `?servico=999999`, parâmetro repetido, faixa de ano invertida, ordenação desconhecida. Todos caem em padrão sensato.
- **Tradução para parâmetros do TMDB:** serviços unidos por `|`, gêneros por `,`, faixa de ano virando duas datas, e — com teste dedicado — a presença do `vote_count.gte=50` e do `with_watch_monetization_types=flatrate` em toda consulta.
- **Normalização:** filme sem pôster, sem data, com nota 0, sem sinopse. Fixtures são respostas reais do TMDB gravadas em arquivo; os testes rodam sem rede e sem chave de API.

**Playwright**, três caminhos de ponta a ponta:

1. Filtrar por serviço e gênero, ver a grade mudar e a URL acompanhar; recarregar a página e obter o mesmo resultado.
2. Aplicar filtros até zerar os resultados, ver a sugestão e afrouxar num clique.
3. Abrir um filme a partir da grade e ver os serviços de assinatura com o crédito ao JustWatch.

Implementação por TDD: teste antes do código de produção.

## 15. Critérios de aceite

1. Visita à home sem nenhum parâmetro mostra filmes disponíveis em serviços de assinatura no Brasil, ordenados por popularidade.
2. Selecionar dois serviços mostra filmes disponíveis em **qualquer um** dos dois.
3. Os sete filtros funcionam combinados e ficam refletidos na URL; colar a URL noutro navegador reproduz a mesma tela.
4. Nenhuma consulta de descoberta sai sem `vote_count.gte=50`, `watch_region=BR` e `with_watch_monetization_types=flatrate`.
5. Zero resultados mostra o estado vazio com sugestão acionável, nunca um erro.
6. A página do filme mostra os serviços de assinatura no BR, ou declara que não há nenhum.
7. O token do TMDB não aparece em nenhum recurso servido ao navegador.
8. Rodapé com atribuição ao TMDB em todas as páginas; crédito ao JustWatch na página do filme.
9. Metas de Lighthouse da seção 12 atingidas.
10. Testes de unidade e de ponta a ponta passando.

## 16. Limitações conhecidas

Consequências aceitas das decisões acima, não pendências:

- **Sem selos de serviço na grade.** Custo de requisição, conforme seção 7. Resolvido na página do filme.
- **Sem "entrou esta semana".** O TMDB não expõe data de entrada no catálogo; isso exigiria ingestão própria com histórico, descartada para a v1.
- **A busca varre o acervo inteiro**, não só o streaming — limitação do endpoint, comunicada na interface.
- **Atraso na disponibilidade.** Os dados vêm do JustWatch via TMDB e podem estar algumas horas atrás da realidade; somado ao cache de 6 h, um filme recém-removido pode aparecer por um período.
- **Teto de 500 páginas** por combinação de filtros, imposto pelo TMDB.
