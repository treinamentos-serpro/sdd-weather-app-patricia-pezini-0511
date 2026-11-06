import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData, WeatherError } from '../types/weather';

type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';
type Operation = { kind: 'search'; name: string } | { kind: 'weather'; city: City };

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: WeatherError | null;
  query: string;
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
  });
  const requestId = useRef(0);
  const lastOperation = useRef<Operation | null>(null);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  const execute = useCallback(async (operation: Operation): Promise<void> => {
    const id = ++requestId.current;
    lastOperation.current = operation;
    setState((previous) => ({
      ...previous,
      status: 'loading',
      data: null,
      error: null,
      ...(operation.kind === 'search' ? { query: operation.name, cities: [] } : {}),
    }));

    let currentOperation = operation;
    try {
      let city: City;
      if (operation.kind === 'search') {
        const cities = await searchCities(operation.name);
        if (id !== requestId.current) return;

        const firstCity = cities[0];
        if (!firstCity) {
          setState((previous) => ({ ...previous, status: 'empty', cities }));
          return;
        }

        city = firstCity;
        currentOperation = { kind: 'weather', city };
        lastOperation.current = currentOperation;
        setState((previous) => ({ ...previous, cities }));
      } else {
        city = operation.city;
      }

      const data = await getWeather(city);
      if (id !== requestId.current) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (cause) {
      if (id !== requestId.current) return;
      const error =
        cause instanceof WeatherServiceError
          ? cause
          : new WeatherServiceError('invalid-response', { cause }, currentOperation.kind);
      setState((previous) => ({ ...previous, status: 'error', data: null, error }));
    }
  }, []);

  const search = useCallback(
    (name: string) => execute({ kind: 'search', name: name.trim() }),
    [execute],
  );
  const selectCity = useCallback((city: City) => execute({ kind: 'weather', city }), [execute]);
  const retry = useCallback(async (): Promise<void> => {
    if (lastOperation.current) await execute(lastOperation.current);
  }, [execute]);

  return { ...state, search, selectCity, retry };
}

export default useWeather;
