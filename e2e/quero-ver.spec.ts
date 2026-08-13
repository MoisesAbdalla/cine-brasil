import { test, expect } from '@playwright/test';

// Filme fixo para o teste não depender de qual título encabeça a descoberta hoje.
const FILME = '/filme/550';

test('guardar um filme na lista e encontrá-lo depois de recarregar', async ({ page }) => {
  await page.goto(FILME);

  const titulo = await page.getByRole('heading', { level: 1 }).textContent();
  expect(titulo).toBeTruthy();

  const botao = page.getByRole('button', { name: '+ Quero ver' });
  await expect(botao).toBeVisible();
  await botao.click();

  await expect(page.getByRole('button', { name: '✓ Na minha lista' })).toBeVisible();

  await page.goto('/quero-ver');
  await expect(page.getByText('1 filme guardado')).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(titulo as string) })).toBeVisible();

  // O valor tem que sobreviver ao recarregar: é isso que distingue guardar de lembrar.
  await page.reload();
  await expect(page.getByText('1 filme guardado')).toBeVisible();
});

test('tirar o filme da lista esvazia a página', async ({ page }) => {
  await page.goto(FILME);
  await page.getByRole('button', { name: '+ Quero ver' }).click();
  await expect(page.getByRole('button', { name: '✓ Na minha lista' })).toBeVisible();

  await page.getByRole('button', { name: '✓ Na minha lista' }).click();
  await expect(page.getByRole('button', { name: '+ Quero ver' })).toBeVisible();

  await page.goto('/quero-ver');
  await expect(page.getByText('Sua lista está vazia')).toBeVisible();
});

test('a lista começa vazia e explica como usá-la', async ({ page }) => {
  await page.goto('/quero-ver');
  await expect(page.getByText('Sua lista está vazia')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Descobrir filmes' })).toBeVisible();
});
