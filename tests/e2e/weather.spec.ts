import { expect, test } from '@playwright/test';
import { openWeatherScenario } from './weatherScenario';

test('busca uma cidade, exibe a previsão e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            name: 'São Paulo',
            admin1: 'São Paulo',
            country: 'Brasil',
            latitude: -23.5475,
            longitude: -46.63611,
          },
        ],
      },
    }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: {
          temperature_2m: 0,
          weather_code: 0,
          time: '2026-11-06T15:00',
        },
        daily: {
          time: ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
          temperature_2m_min: [0, 1, 2, 3, 4],
          temperature_2m_max: [10, 6, 7, 8, 9],
          weather_code: [0, 1, 2, 3, 61],
        },
      },
    });
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('0 °C');
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);
  const forecastDays = page.getByRole('listitem');
  const dates = await forecastDays.getByRole('heading').allTextContents();

  await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('32 °F');
  const fahrenheitMinima = [32, 34, 36, 37, 39];
  const fahrenheitMaxima = [50, 43, 45, 46, 48];
  for (const [index, day] of (await forecastDays.all()).entries()) {
    await expect(day).toContainText(`${fahrenheitMinima[index]} °F`);
    await expect(day).toContainText(`${fahrenheitMaxima[index]} °F`);
  }
  await expect(forecastDays.getByRole('heading')).toHaveText(dates);

  await page.getByRole('button', { name: 'Celsius (°C)' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('0 °C');
  for (const [index, day] of (await forecastDays.all()).entries()) {
    await expect(day).toContainText(`${index} °C`);
    await expect(day).toContainText(`${[10, 6, 7, 8, 9][index]} °C`);
  }
  await expect(forecastDays.getByRole('heading')).toHaveText(dates);
  expect(forecastRequests).toBe(1);
});

test('exibe estado vazio quando o geocoding não retorna results', async ({ page }) => {
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: {} }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: {} });
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada.' })).toBeVisible();
  expect(forecastRequests).toBe(0);
});

test('renderiza o clima corretamente em viewport mobile de 375x812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openWeatherScenario(page, 'success');

  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('23 °C');
  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('Céu limpo');
  await expect(page.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});

test('recupera erro HTTP do geocoding ao tentar novamente', async ({ page }) => {
  let geocodingRequests = 0;
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    geocodingRequests += 1;
    if (geocodingRequests === 1) {
      return route.fulfill({ status: 503, body: 'Indisponível' });
    }
    return route.fulfill({
      json: {
        results: [
          {
            name: 'São Paulo',
            admin1: 'São Paulo',
            country: 'Brasil',
            latitude: -23.5475,
            longitude: -46.63611,
          },
        ],
      },
    });
  });
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: { temperature_2m: 23, weather_code: 0, time: '2026-11-06T15:00' },
        daily: {
          time: ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
          temperature_2m_min: [18, 19, 17, 16, 20],
          temperature_2m_max: [27, 28, 24, 25, 30],
          weather_code: [0, 1, 2, 3, 61],
        },
      },
    });
  });

  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Nome da cidade' });
  await search.fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Não foi possível buscar cidades. Tente novamente.',
  );
  await expect(search).toHaveValue('São Paulo');
  expect(forecastRequests).toBe(0);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toContainText('23 °C');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(geocodingRequests).toBe(2);
  expect(forecastRequests).toBe(1);
});
