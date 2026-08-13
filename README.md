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
requisições de dados — o único JavaScript de cliente é o botão que carrega o trailer
sob demanda. Todo o estado de filtro vive na URL, então cada tela tem endereço
próprio, compartilhável e indexável.

A camada `src/lib/tmdb` isola o formato da API; nenhum componente conhece os nomes
de campo do TMDB. A lógica pura (`src/lib/filtros`) é o que recebe testes de unidade.

Tipografia: Instrument Serif (títulos) e Inter (texto), carregadas via `next/font`.

Design e decisões: `docs/superpowers/specs/2026-08-13-catalogo-filmes-streaming-design.md`.

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

## Créditos

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
Dados de disponibilidade em streaming fornecidos por JustWatch.
