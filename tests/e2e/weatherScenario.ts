import { expect, type Page } from '@playwright/test';
import { mockWeatherData } from '../../src/mocks/weather';

export async function openWeatherScenario(
  page: Page,
  scenario: 'idle' | 'loading' | 'empty' | 'error' | 'success',
) {
  await page.unroute('https://geocoding-api.open-meteo.com/**');
  await page.unroute('https://api.open-meteo.com/**');
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results:
          scenario === 'empty'
            ? []
            : [
                {
                  ...mockWeatherData.city,
                  admin1: mockWeatherData.city.region,
                },
              ],
      },
    }),
  );
  let forecastRequests = 0;
  await page.route('https://api.open-meteo.com/**', (route) => {
    if (scenario === 'loading') return;
    forecastRequests += 1;
    if (scenario === 'error' && forecastRequests === 1) {
      return route.fulfill({ status: 503, body: 'Indisponível' });
    }
    return route.fulfill({
      json: {
        timezone: mockWeatherData.timeZone,
        current: {
          temperature_2m: mockWeatherData.current.temperatureCelsius,
          weather_code: mockWeatherData.current.weatherCode,
          time: mockWeatherData.current.observedAt,
        },
        daily: {
          time: mockWeatherData.forecast.map((day) => day.date),
          temperature_2m_min: mockWeatherData.forecast.map((day) => day.minCelsius),
          temperature_2m_max: mockWeatherData.forecast.map((day) => day.maxCelsius),
          weather_code: mockWeatherData.forecast.map((day) => day.weatherCode),
        },
      },
    });
  });
  await page.goto('/');
  if (scenario === 'idle') return;
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  if (scenario === 'loading') {
    await expect(page.getByText('Carregando...')).toBeVisible();
  } else if (scenario === 'error') {
    await expect(page.getByRole('alert')).toBeVisible();
  } else if (scenario === 'empty') {
    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada.' })).toBeVisible();
  } else {
    await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  }
}
