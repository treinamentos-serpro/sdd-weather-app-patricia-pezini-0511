import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { getWeatherCondition } from '../../src/lib/weatherCodes';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('CurrentWeather', () => {
  it('mostra cidade, contexto, temperatura, ícone e condição', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="celsius"
      />,
    );

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('São Paulo, Brasil')).toBeInTheDocument();
    expect(screen.getByText('23 °C')).toBeInTheDocument();
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
    expect(screen.getByText('☀️')).toHaveAttribute('aria-hidden', 'true');
  });

  it('atualiza a unidade sem modificar os dados originais', () => {
    const { rerender } = render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="celsius"
      />,
    );
    rerender(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="fahrenheit"
      />,
    );
    expect(screen.getByText('73 °F')).toBeInTheDocument();
    expect(mockWeatherData.current.temperatureCelsius).toBe(23);
    rerender(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="celsius"
      />,
    );
    expect(screen.getByText('23 °C')).toBeInTheDocument();
  });

  it('aceita cidade sem região ou país e usa o ícone do código recebido', () => {
    render(
      <CurrentWeather
        city={{ name: 'Curitiba', latitude: -25.43, longitude: -49.27 }}
        current={{ ...mockWeatherData.current, weatherCode: 61, conditionLabel: 'Chuva fraca' }}
        unit="celsius"
      />,
    );
    expect(screen.getByRole('heading', { name: 'Curitiba' })).toBeInTheDocument();
    expect(screen.getByText('Chuva fraca')).toBeInTheDocument();
    expect(screen.getByText('🌧️')).toBeInTheDocument();
  });

  it.each([
    { ...mockWeatherData.current, weatherCode: -1 },
    { ...mockWeatherData.current, temperatureCelsius: NaN },
  ])('informa erro para dados inválidos', (current) => {
    render(<CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as condições atuais. Tente novamente.',
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});

describe('Códigos WMO', () => {
  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('oferece rótulo e ícone para o código %s', (code) => {
    const condition = getWeatherCondition(code);
    expect(condition?.label).toBeTruthy();
    expect(condition?.icon).toBeTruthy();
  });

  it.each([-1, 4, 100, NaN, Infinity])('não inventa condição para o código %s', (code) => {
    expect(getWeatherCondition(code)).toBeUndefined();
  });
});
