import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchWithTimeout', () => {
  it('retorna a resposta e remove o timer após sucesso', async () => {
    vi.useFakeTimers();
    const response = new Response('{}');
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithTimeout('https://example.com')).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
      signal: expect.any(AbortSignal),
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    {
      cause: new DOMException('Aborted', 'AbortError'),
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    },
    { cause: new TypeError('Failed to fetch'), kind: 'network', message: 'Falha de rede.' },
  ])('converte $kind em erro tipado e remove o timer', async ({ cause, kind, message }) => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));

    const result = fetchWithTimeout('https://example.com', 'weather');
    await expect(result).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(result).rejects.toMatchObject({ kind, message, cause, operation: 'weather' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['search', 'weather'] as const)('aborta %s somente aos 10.000 ms', async (operation) => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            requestSignal = init?.signal ?? undefined;
            requestSignal?.addEventListener('abort', () => reject(requestSignal?.reason));
          }),
      ),
    );

    const result =
      operation === 'search'
        ? searchCities('São Paulo')
        : getWeather({ name: 'São Paulo', latitude: -23.5475, longitude: -46.63611 });
    const rejection = expect(result).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'timeout',
      message: 'A requisição demorou demais.',
      operation,
    });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(requestSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('getWeather', () => {
  const city: City = { name: 'São Paulo', latitude: -23.5475, longitude: -46.63611 };

  function forecastResponse() {
    return {
      timezone: 'America/Sao_Paulo',
      current: { temperature_2m: 23, weather_code: 0, time: '2026-11-05T15:00' },
      daily: {
        time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
        temperature_2m_min: [18, 19, 17, 16, 20],
        temperature_2m_max: [27, 28, 24, 25, 30],
        weather_code: [0, 1, 2, 3, 61],
      },
    };
  }

  function mockResponse(data: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('consulta as coordenadas exatas e mapeia atuais e cinco dias por índice', async () => {
    const fetchMock = mockResponse(forecastResponse());

    const result = await getWeather(city);

    expect(result).toEqual({
      city,
      timeZone: 'America/Sao_Paulo',
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
          weatherCode: 1,
          conditionLabel: 'Predominantemente limpo',
        },
        {
          date: '2026-11-07',
          minCelsius: 17,
          maxCelsius: 24,
          weatherCode: 2,
          conditionLabel: 'Parcialmente nublado',
        },
        {
          date: '2026-11-08',
          minCelsius: 16,
          maxCelsius: 25,
          weatherCode: 3,
          conditionLabel: 'Nublado',
        },
        {
          date: '2026-11-09',
          minCelsius: 20,
          maxCelsius: 30,
          weatherCode: 61,
          conditionLabel: 'Chuva fraca',
        },
      ],
    });
    expect(result.city).toBe(city);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://api.open-meteo.com/v1/forecast?latitude=-23.5475&longitude=-46.63611&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_min,temperature_2m_max&temperature_unit=celsius&timezone=auto&forecast_days=5',
      { signal: expect.any(AbortSignal) },
    );
  });

  it('limita a previsão a cinco itens quando a API retorna dias adicionais', async () => {
    const data = forecastResponse();
    data.daily.time.push('2026-11-10');
    data.daily.temperature_2m_min.push(21);
    data.daily.temperature_2m_max.push(31);
    data.daily.weather_code.push(3);
    mockResponse(data);

    const result = await getWeather(city);
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast.at(-1)?.date).toBe('2026-11-09');
  });

  it.each([1, 4])(
    'rejeita previsão com somente %i dias válidos, mesmo com séries alinhadas',
    async (dayCount) => {
      const data = forecastResponse();
      data.daily.time = data.daily.time.slice(0, dayCount);
      data.daily.temperature_2m_min = data.daily.temperature_2m_min.slice(0, dayCount);
      data.daily.temperature_2m_max = data.daily.temperature_2m_max.slice(0, dayCount);
      data.daily.weather_code = data.daily.weather_code.slice(0, dayCount);
      mockResponse(data);

      await expect(getWeather(city)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        kind: 'invalid-response',
        operation: 'weather',
      });
    },
  );

  it.each(['current', 'daily'] as const)('rejeita resposta sem %s', async (field) => {
    const data: Record<string, unknown> = forecastResponse();
    delete data[field];
    mockResponse(data);

    const result = getWeather(city);
    await expect(result).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(result).rejects.toMatchObject({ kind: 'invalid-response', operation: 'weather' });
  });

  it.each([
    { current: null },
    { daily: null },
    { current: {} },
    { daily: {} },
    { timezone: '' },
    { current: { temperature_2m: null, weather_code: 0, time: '2026-11-05T15:00' } },
    { current: { temperature_2m: 23, weather_code: 999, time: '2026-11-05T15:00' } },
  ])('rejeita campos obrigatórios inválidos: %j', async (patch) => {
    mockResponse({ ...forecastResponse(), ...patch });

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'invalid-response',
      operation: 'weather',
    });
  });

  it.each([
    'time',
    'temperature_2m_min',
    'temperature_2m_max',
    'weather_code',
  ] as const)('rejeita array daily.%s incompleto', async (field) => {
    const data = forecastResponse();
    data.daily[field].pop();
    mockResponse(data);

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('rejeita valores inválidos em um índice diário', async () => {
    const data = forecastResponse();
    data.daily.temperature_2m_min[2] = 50;
    mockResponse(data);

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('identifica falha HTTP como operação meteorológica', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('erro', { status: 503 })));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'http',
      operation: 'weather',
    });
  });

  it('preserva a causa da falha de rede', async () => {
    const cause = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));

    await expect(getWeather(city)).rejects.toMatchObject({
      kind: 'network',
      message: 'Falha de rede.',
      operation: 'weather',
      cause,
    });
  });

  it('rejeita JSON inválido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('JSON inválido')));

    await expect(getWeather(city)).rejects.toMatchObject({
      kind: 'invalid-response',
      operation: 'weather',
    });
  });
});

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('retorna vazio sem acessar a rede para %j', async (name) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o termo e mapeia apenas os campos de City', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 3451190,
              name: 'São Paulo',
              admin1: 'São Paulo',
              country: 'Brasil',
              latitude: -23.5475,
              longitude: -46.63611,
            },
            { name: 'Outra cidade', latitude: 0, longitude: 0 },
            { name: 'Sem coordenadas' },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('  São Paulo & região  ')).resolves.toEqual([
      {
        name: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5475,
        longitude: -46.63611,
      },
      { name: 'Outra cidade', latitude: 0, longitude: 0 },
    ]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent('São Paulo & região')}&count=10&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
  });

  it.each([{}, { results: [] }])('aceita respostas sem correspondências: %j', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it.each([400, 429, 500])('lança WeatherServiceError para HTTP %i', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('erro', { status })));

    const result = searchCities('São Paulo');
    await expect(result).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(result).rejects.toMatchObject({ kind: 'http', operation: 'search' });
  });

  it('preserva falhas de rede como erro tipado', async () => {
    const cause = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'network',
      message: 'Falha de rede.',
      cause,
    });
  });

  it.each([
    'JSON inválido',
    'null',
    '{"results":null}',
    '{"results":{}}',
    '{"results":[{"name":"Sem coordenadas"}]}',
  ])('rejeita resposta inválida sem simular sucesso: %s', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'invalid-response',
    });
  });
});
