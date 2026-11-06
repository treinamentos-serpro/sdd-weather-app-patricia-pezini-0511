import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const city = mockWeatherData.city;
const otherCity: City = { name: 'Curitiba', latitude: -25.43, longitude: -49.27 };
const otherWeather: WeatherData = { ...mockWeatherData, city: otherCity };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.mocked(searchCities).mockReset().mockResolvedValue([city, otherCity]);
  vi.mocked(getWeather).mockReset().mockResolvedValue(mockWeatherData);
});

afterEach(cleanup);

describe('useWeather', () => {
  it('inicia em idle e retry sem operação não consulta os serviços', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });

    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('busca o termo sem espaços externos e carrega o clima da primeira cidade', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.search('  São Paulo  ');
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.query).toBe('São Paulo');

    await act(async () => {
      pending.resolve([city, otherCity]);
      await operation;
    });
    expect(searchCities).toHaveBeenCalledWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
    expect(result.current).toMatchObject({
      status: 'success',
      data: mockWeatherData,
      cities: [city, otherCity],
      error: null,
    });
  });

  it('sem resultados limpa os dados anteriores e termina em empty', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    vi.mocked(searchCities).mockResolvedValueOnce([]);

    await act(() => result.current.search('Inexistente'));
    expect(result.current).toMatchObject({
      status: 'empty',
      data: null,
      cities: [],
      error: null,
      query: 'Inexistente',
    });
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('seleciona outra cidade, remove o clima antigo durante loading e preserva query e cities', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise);
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.selectCity(otherCity);
    });
    expect(result.current).toMatchObject({ status: 'loading', data: null, error: null });

    await act(async () => {
      pending.resolve(otherWeather);
      await operation;
    });
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      status: 'success',
      data: otherWeather,
      query: 'São Paulo',
      cities: [city, otherCity],
    });
  });

  it('retry repete a busca que falhou com o mesmo termo e limpa o erro', async () => {
    const error = new WeatherServiceError('network');
    vi.mocked(searchCities).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({ status: 'error', error, data: null });
    expect(getWeather).not.toHaveBeenCalled();

    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenNthCalledWith(2, 'São Paulo');
    expect(result.current).toMatchObject({ status: 'success', error: null, data: mockWeatherData });
  });

  it('retry repete somente o clima quando a busca teve sucesso', async () => {
    const error = new WeatherServiceError('timeout', undefined, 'weather');
    vi.mocked(getWeather).mockRejectedValueOnce(error).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({ status: 'error', error, cities: [city, otherCity] });

    await act(() => result.current.retry());
    expect(result.current.status).toBe('error');
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(3);
    expect(getWeather).toHaveBeenLastCalledWith(city);
    expect(result.current).toMatchObject({ status: 'success', error: null });
  });

  it('retry usa a última cidade selecionada', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.selectCity(otherCity));
    await act(() => result.current.retry());
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('retry repete uma busca vazia', async () => {
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
  });

  it('converte erros inesperados em erro tipado com a causa original', async () => {
    const cause = new Error('Resposta inesperada');
    vi.mocked(getWeather).mockRejectedValueOnce(cause);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.selectCity(city));
    expect(result.current.error).toBeInstanceOf(WeatherServiceError);
    expect(result.current.error).toMatchObject({
      kind: 'invalid-response',
      operation: 'weather',
      cause,
    });
  });

  it('ignora uma busca obsoleta sem consultar o clima nem alterar o retry', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let oldOperation!: Promise<void>;
    act(() => {
      oldOperation = result.current.search('Antiga');
    });
    vi.mocked(getWeather).mockResolvedValue(otherWeather);
    await act(() => result.current.search('Nova'));
    await act(async () => {
      pending.resolve([city]);
      await oldOperation;
    });
    expect(result.current.query).toBe('Nova');
    expect(result.current.data).toBe(otherWeather);
    expect(getWeather).toHaveBeenCalledTimes(1);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(2);
  });

  it.each([
    'success',
    'error',
  ] as const)('ignora clima obsoleto que termina em %s', async (outcome) => {
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise).mockResolvedValue(otherWeather);
    const { result } = renderHook(() => useWeather());
    let oldOperation!: Promise<void>;
    act(() => {
      oldOperation = result.current.selectCity(city);
    });
    await act(() => result.current.selectCity(otherCity));

    await act(async () => {
      if (outcome === 'success') pending.resolve(mockWeatherData);
      else pending.reject(new WeatherServiceError('network', undefined, 'weather'));
      await oldOperation;
    });
    expect(result.current).toMatchObject({ status: 'success', data: otherWeather, error: null });
  });

  it('ignora resultados após desmontagem sem iniciar consulta meteorológica', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.search('São Paulo');
    });
    unmount();
    await act(async () => {
      pending.resolve([city]);
      await operation;
    });
    expect(getWeather).not.toHaveBeenCalled();
  });
});
