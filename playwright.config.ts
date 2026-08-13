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
    // Nunca reaproveitar em CI (servidor sempre novo, previsível). Em desenvolvimento
    // local, reaproveitar um `next dev` já rodando é conveniente, mas tem um risco
    // conhecido: se esse processo já estiver travado/degradado (aconteceu aqui — um
    // `next dev` de sessão anterior parou de responder até para "/" depois de levar
    // tráfego paralelo), os testes falham em timeout de navegação sem nenhum defeito
    // no app. Sintoma: `npm run test:e2e` falha tudo com "Test timeout ... waiting
    // until load" mesmo em rotas simples. Saída: matar o processo que está ouvindo
    // na porta 3000 e rodar de novo (o Playwright sobe um `next dev` limpo sozinho).
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
