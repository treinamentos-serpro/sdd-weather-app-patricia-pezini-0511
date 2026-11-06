import { getWeatherCondition } from '../lib/weatherCodes';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherData,
  WeatherError,
  WeatherErrorKind,
} from '../types/weather';

export class WeatherServiceError extends Error implements WeatherError {
  constructor(
    public readonly kind: WeatherErrorKind,
    options?: ErrorOptions,
    public readonly operation: WeatherError['operation'] = 'search',
  ) {
    super(
      kind === 'timeout'
        ? 'A requisição demorou demais.'
        : kind === 'network'
          ? 'Falha de rede.'
          : operation === 'search'
            ? 'Não foi possível buscar cidades. Tente novamente.'
            : 'Não foi possível carregar o clima. Tente novamente.',
      options,
    );
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function fetchWithTimeout(
  url: string,
  operation: WeatherError['operation'] = 'search',
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (cause) {
    const kind = isRecord(cause) && cause.name === 'AbortError' ? 'timeout' : 'network';
    throw new WeatherServiceError(kind, { cause }, operation);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url: string, operation: WeatherError['operation']): Promise<unknown> {
  const response = await fetchWithTimeout(url, operation);
  if (!response.ok) {
    throw new WeatherServiceError('http', undefined, operation);
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new WeatherServiceError('invalid-response', { cause }, operation);
  }
}

export async function searchCities(name: string): Promise<City[]> {
  const term = name.trim();
  if (!term) return [];

  const data = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=10&language=pt&format=json`,
    'search',
  );

  if (!isRecord(data)) {
    throw new WeatherServiceError('invalid-response');
  }
  if (!('results' in data)) return [];
  if (!Array.isArray(data.results)) {
    throw new WeatherServiceError('invalid-response');
  }

  const cities: City[] = [];
  for (const result of data.results) {
    if (
      !isRecord(result) ||
      typeof result.name !== 'string' ||
      !result.name.trim() ||
      typeof result.latitude !== 'number' ||
      !Number.isFinite(result.latitude) ||
      typeof result.longitude !== 'number' ||
      !Number.isFinite(result.longitude)
    ) {
      continue;
    }

    cities.push({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      ...(typeof result.admin1 === 'string' ? { region: result.admin1 } : {}),
      ...(typeof result.country === 'string' ? { country: result.country } : {}),
    });
  }

  if (data.results.length > 0 && cities.length === 0) {
    throw new WeatherServiceError('invalid-response');
  }
  return cities;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function getWeather(city: City): Promise<WeatherData> {
  const data = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_min,temperature_2m_max&temperature_unit=celsius&timezone=auto&forecast_days=5`,
    'weather',
  );
  if (
    !isRecord(data) ||
    !isRecord(data.current) ||
    !isRecord(data.daily) ||
    typeof data.timezone !== 'string' ||
    !data.timezone.trim()
  ) {
    throw new WeatherServiceError('invalid-response', undefined, 'weather');
  }

  const { current, daily } = data;
  const condition = isFiniteNumber(current.weather_code)
    ? getWeatherCondition(current.weather_code)
    : undefined;
  if (
    !isFiniteNumber(current.temperature_2m) ||
    !isFiniteNumber(current.weather_code) ||
    !condition ||
    typeof current.time !== 'string' ||
    !current.time.trim() ||
    !Array.isArray(daily.time) ||
    !Array.isArray(daily.weather_code) ||
    !Array.isArray(daily.temperature_2m_min) ||
    !Array.isArray(daily.temperature_2m_max) ||
    daily.time.length < 5 ||
    daily.weather_code.length !== daily.time.length ||
    daily.temperature_2m_min.length !== daily.time.length ||
    daily.temperature_2m_max.length !== daily.time.length
  ) {
    throw new WeatherServiceError('invalid-response', undefined, 'weather');
  }

  const currentWeather: CurrentWeather = {
    temperatureCelsius: current.temperature_2m,
    weatherCode: current.weather_code,
    conditionLabel: condition.label,
    observedAt: current.time,
  };
  const {
    time,
    temperature_2m_min: minima,
    temperature_2m_max: maxima,
    weather_code: codes,
  } = daily;
  const forecast: ForecastDay[] = time.slice(0, 5).map((date: unknown, index: number) => {
    const min: unknown = minima[index];
    const max: unknown = maxima[index];
    const code: unknown = codes[index];
    const dayCondition = isFiniteNumber(code) ? getWeatherCondition(code) : undefined;
    if (
      typeof date !== 'string' ||
      !date.trim() ||
      !isFiniteNumber(min) ||
      !isFiniteNumber(max) ||
      min > max ||
      !isFiniteNumber(code) ||
      !dayCondition
    ) {
      throw new WeatherServiceError('invalid-response', undefined, 'weather');
    }
    return {
      date,
      minCelsius: min,
      maxCelsius: max,
      weatherCode: code,
      conditionLabel: dayCondition.label,
    };
  });

  return { city, current: currentWeather, forecast, timeZone: data.timezone };
}
