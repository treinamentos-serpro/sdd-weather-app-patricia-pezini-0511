import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    name: 'São Paulo',
    region: 'São Paulo',
    country: 'Brasil',
    latitude: -23.5475,
    longitude: -46.63611,
  },
  current: {
    temperatureCelsius: 23,
    weatherCode: 0,
    conditionLabel: 'Céu limpo',
    observedAt: '2026-11-05T15:00',
  },
  forecast: [
    {
      date: '2026-11-05',
      minCelsius: 18,
      maxCelsius: 27,
      weatherCode: 0,
      conditionLabel: 'Céu limpo',
    },
    {
      date: '2026-11-06',
      minCelsius: 19,
      maxCelsius: 28,
      weatherCode: 2,
      conditionLabel: 'Parcialmente nublado',
    },
    {
      date: '2026-11-07',
      minCelsius: 17,
      maxCelsius: 24,
      weatherCode: 3,
      conditionLabel: 'Nublado',
    },
    {
      date: '2026-11-08',
      minCelsius: 16,
      maxCelsius: 22,
      weatherCode: 61,
      conditionLabel: 'Chuva fraca',
    },
    {
      date: '2026-11-09',
      minCelsius: 17,
      maxCelsius: 25,
      weatherCode: 1,
      conditionLabel: 'Predominantemente limpo',
    },
  ],
  timeZone: 'America/Sao_Paulo',
};
