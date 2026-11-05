import { describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type { City, Unit, WeatherData, WeatherError } from '../../src/types/weather';

describe('Contratos meteorológicos', () => {
  it('limita as unidades e os erros aos valores do plano', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf<WeatherError['kind']>().toEqualTypeOf<
      'network' | 'http' | 'timeout' | 'invalid-response'
    >();
    expectTypeOf<WeatherError['operation']>().toEqualTypeOf<'search' | 'weather'>();
    expectTypeOf<WeatherError['message']>().toEqualTypeOf<string>();
    expectTypeOf(mockWeatherData).toEqualTypeOf<WeatherData>();
  });

  it('permite cidades sem região ou país', () => {
    const city: City = { name: 'São Paulo', latitude: -23.5475, longitude: -46.63611 };

    expect(city.region).toBeUndefined();
    expect(city.country).toBeUndefined();
    expectTypeOf<City>().toExtend<{
      name: string;
      latitude: number;
      longitude: number;
    }>();
  });
});

describe('Mock meteorológico para a UI', () => {
  it('associa cidade, condições atuais em Celsius e fuso válido', () => {
    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(mockWeatherData.current).toEqual({
      temperatureCelsius: 23,
      weatherCode: 0,
      conditionLabel: 'Céu limpo',
      observedAt: '2026-11-05T15:00',
    });
    expect(
      new Intl.DateTimeFormat('pt-BR', { timeZone: mockWeatherData.timeZone }).resolvedOptions()
        .timeZone,
    ).toBe('America/Sao_Paulo');
  });

  it('contém exatamente cinco dias consecutivos a partir da observação', () => {
    expect(mockWeatherData.forecast.map((day) => day.date)).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
    ]);
    expect(mockWeatherData.forecast[0].date).toBe(mockWeatherData.current.observedAt.slice(0, 10));

    const labels = new Map([
      [0, 'Céu limpo'],
      [1, 'Predominantemente limpo'],
      [2, 'Parcialmente nublado'],
      [3, 'Nublado'],
      [61, 'Chuva fraca'],
    ]);

    for (const day of mockWeatherData.forecast) {
      expect(Number.isFinite(day.minCelsius)).toBe(true);
      expect(Number.isFinite(day.maxCelsius)).toBe(true);
      expect(day.minCelsius).toBeLessThanOrEqual(day.maxCelsius);
      expect(day.conditionLabel).toBe(labels.get(day.weatherCode));
    }
  });
});
