import { test, expect } from '@playwright/test';

const TITULOS_DO_CARTAO = 'a[href^="/filme/"] h3';

test('filtrar por gênero muda a grade e a URL, e sobrevive ao recarregar', async ({ page }) => {
  await page.goto('/');

  const titulosAntes = await page.locator(TITULOS_DO_CARTAO).allTextContents();

  await page.getByRole('link', { name: 'Terror', exact: true }).click();
  await expect(page).toHaveURL(/genero=27/);

  await expect(page.getByText('filtros ativos')).toBeVisible();
  await expect(page.getByRole('link', { name: /Terror/ }).first()).toBeVisible();

  const urlFiltrada = page.url();
  await page.reload();
  expect(page.url()).toBe(urlFiltrada);
  await expect(page.locator(TITULOS_DO_CARTAO).first()).toBeVisible();

  // Comparamos o conjunto inteiro de títulos da primeira página, não só o primeiro:
  // um único filme poderia por acidente encabeçar as duas listas mesmo com a grade
  // tendo mudado, o que tornaria uma comparação do primeiro título um falso negativo
  // (ou, mais raramente, um falso positivo caso a ordenação por popularidade coincida).
  const titulosDepois = await page.locator(TITULOS_DO_CARTAO).allTextContents();
  expect(titulosDepois.length).toBeGreaterThan(0);
  expect(titulosDepois).not.toEqual(titulosAntes);
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
