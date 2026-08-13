import { test, expect } from '@playwright/test';

test('abrir um filme mostra onde assistir com o crédito ao JustWatch', async ({ page }) => {
  await page.goto('/?servico=8');
  await page.locator('a[href^="/filme/"]').first().click();

  await expect(page).toHaveURL(/\/filme\/\d+/);
  await expect(page.getByRole('heading', { name: 'onde assistir' })).toBeVisible();

  // O filme foi aberto a partir de uma descoberta filtrada pela Netflix (servico=8),
  // então a lista de provedores tem que aparecer de verdade — o cabeçalho e o texto
  // de crédito ao JustWatch, sozinhos, são renderizados incondicionalmente por
  // selos-provedor.tsx e passariam mesmo sem nenhum selo na página.
  const secaoOndeAssistir = page.locator('section[aria-labelledby="onde-assistir"]');
  await expect(secaoOndeAssistir.getByRole('list')).toBeVisible();
  expect(await secaoOndeAssistir.getByRole('listitem').count()).toBeGreaterThan(0);
  await expect(
    secaoOndeAssistir.getByText('não está em nenhum serviço de streaming'),
  ).toHaveCount(0);

  await expect(page.getByText('Disponibilidade fornecida por JustWatch.')).toBeVisible();
});

test('id inexistente devolve 404', async ({ page }) => {
  const resposta = await page.goto('/filme/999999999');
  expect(resposta?.status()).toBe(404);
  await expect(page.getByText('Filme não encontrado')).toBeVisible();
});

test('o player do trailer só carrega depois do clique', async ({ page }) => {
  // id 550 = Clube da Luta: filme conhecido, estável, confirmado com trailer no
  // YouTube via /movie/550/videos. Navegar direto para ele (em vez de abrir o
  // primeiro resultado de /?servico=8, que pode ou não ter trailer) torna o teste
  // determinístico: sem trailer, o botão "Ver trailer" nem existiria, e o teste
  // deve falhar ruidosamente nesse caso — não pular silenciosamente a asserção.
  await page.goto('/filme/550');

  const botao = page.getByRole('button', { name: /Ver trailer/ });
  await expect(botao).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);

  await botao.click();
  await expect(page.locator('iframe')).toHaveCount(1);
});
