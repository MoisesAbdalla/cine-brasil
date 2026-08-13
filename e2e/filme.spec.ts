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
