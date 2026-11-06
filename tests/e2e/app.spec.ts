import { expect, test } from '@playwright/test';
import { openWeatherScenario } from './weatherScenario';

test('consulta responsiva: busca, unidade e retry', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await openWeatherScenario(page, 'idle');
  await expect(page.getByRole('heading', { name: 'Consulte o clima de uma cidade' })).toBeVisible();
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('23 °C');
  await expect(page.getByRole('listitem')).toHaveCount(5);

  for (const width of [360, 640, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    const layout = await page.getByRole('list').evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    }));
    expect(layout.columns).toBe(width === 360 ? 2 : width === 640 ? 3 : 5);
    expect(layout.overflow).toBe(false);
  }

  await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('73 °F');
  await openWeatherScenario(page, 'loading');
  await expect(page.getByRole('status').filter({ hasText: 'Carregando...' })).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeDisabled();
  await openWeatherScenario(page, 'error');
  await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('73 °F');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Celsius (°C)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
