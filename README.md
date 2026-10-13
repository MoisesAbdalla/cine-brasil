# Cine Brasil — streaming movie catalog (Brazil)

> Discover movies available on Brazilian subscription streaming services, filterable by service,
> genre, year, rating, runtime and language, with a client-side "want to watch" list.
> **Stack:** Next.js 16 (App Router, server-only data layer) · React 19 · TypeScript · Tailwind CSS 4 ·
> Zod · TMDB API · Vitest (offline unit tests) · Playwright (E2E). Built with Claude Code.
> 🇧🇷 Documentação em português abaixo.

---

# Cine Brasil

Catálogo dos filmes disponíveis nos serviços de streaming por assinatura no Brasil.
Descoberta filtrável por serviço, gênero, ano, nota, duração e idioma.

Filtre por serviço, gênero, ano, nota, duração e idioma; guarde o que quiser ver
depois numa lista que fica no próprio navegador; e inclua, quando quiser, os
serviços gratuitos com anúncio além dos de assinatura.

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

Componentes de servidor consultam o TMDB antes de o HTML sair; o navegador nunca
busca dados de filme diretamente. O JavaScript de cliente existe só para
interações locais — o botão que carrega o trailer sob demanda e a tela de erro
com o botão "Tentar de novo" —, nenhum dos dois faz requisição ao TMDB. Todo o
estado de filtro vive na URL, então cada tela tem endereço próprio,
compartilhável e indexável.

A camada `src/lib/tmdb` isola o formato da API; nenhum componente conhece os nomes
de campo do TMDB. A lógica pura (`src/lib/filtros`) é o que recebe testes de unidade.

Tipografia: Instrument Serif (títulos) e Inter (texto), carregadas via `next/font`.

Design e decisões: `docs/superpowers/specs/2026-08-13-catalogo-filmes-streaming-design.md`.

## Minha lista

A lista de "quero ver" é guardada no `localStorage`, sem conta e sem servidor.
Ela guarda o resumo de cada filme (título, ano, pôster, nota), e não só o id, de
modo que a página `/quero-ver` renderiza sem nenhuma chamada à API. Os
componentes leem esse armazenamento por `useSyncExternalStore`, então o botão da
página do filme e a página da lista ficam em sincronia sem estado duplicado.

## Limitações conhecidas

- A grade não mostra selos de serviço por filme (custaria uma requisição extra por
  item); os provedores aparecem só na página do filme.
- Não existe recorte de "entrou esta semana" — o TMDB/JustWatch não expõe essa data.
- A busca por título varre o acervo inteiro do TMDB, não só o que está em streaming
  por assinatura no Brasil; o aviso na página de busca deixa isso explícito.
- A disponibilidade em streaming pode estar algumas horas atrasada em relação à
  fonte (JustWatch, via TMDB).
- Cada combinação de filtros tem um teto de 500 páginas de resultados, limite da
  própria API do TMDB.

- **A lista não acompanha você entre aparelhos.** Ela vive no navegador em que
  foi criada; limpar os dados do site apaga a lista.
- **O botão de guardar só existe na página do filme.** Colocá-lo nos cartões da
  grade transformaria cada um dos vinte cartões num componente de cliente, o que
  contraria a decisão de manter a tela mais visitada sem JavaScript.
- **Alguns serviços da lista só oferecem aluguel e compra** (Google Play, Apple
  TV, entre outros). O TMDB não informa o tipo de monetização na lista de
  provedores, então eles aparecem entre os filtros mesmo sem nunca devolver
  resultado numa busca por assinatura; a tela de resultado vazio explica isso.

## Créditos

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
Dados de disponibilidade em streaming fornecidos por JustWatch.
