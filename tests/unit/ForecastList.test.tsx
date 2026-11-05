import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import ForecastList from '../../src/components/ForecastList';
import { formatDay } from '../../src/lib/format';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('ForecastList', () => {
  it('exibe cinco dias em ordem cronológica sem alterar a entrada', () => {
    const forecast = [...mockWeatherData.forecast].reverse();
    const originalDates = forecast.map((day) => day.date);
    render(<ForecastList forecast={forecast} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    mockWeatherData.forecast.forEach((day, index) => {
      expect(within(items[index]).getByRole('heading')).toHaveTextContent(formatDay(day.date));
      expect(within(items[index]).getByText(day.conditionLabel)).toBeInTheDocument();
      expect(within(items[index]).getByText(`${day.maxCelsius} °C`)).toBeInTheDocument();
      expect(within(items[index]).getByText(`${day.minCelsius} °C`)).toBeInTheDocument();
    });
    expect(forecast.map((day) => day.date)).toEqual(originalDates);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('atualiza máximas e mínimas com a unidade', () => {
    const forecast = mockWeatherData.forecast.slice(0, 1);
    const { rerender } = render(<ForecastList forecast={forecast} unit="celsius" />);
    expect(screen.getByText('27 °C')).toBeInTheDocument();
    expect(screen.getByText('18 °C')).toBeInTheDocument();

    rerender(<ForecastList forecast={forecast} unit="fahrenheit" />);
    expect(screen.getByText('81 °F')).toBeInTheDocument();
    expect(screen.getByText('64 °F')).toBeInTheDocument();
    expect(forecast[0].minCelsius).toBe(18);
  });

  it('informa previsão incompleta sem criar dias adicionais', () => {
    render(<ForecastList forecast={mockWeatherData.forecast.slice(0, 3)} unit="celsius" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('Previsão incompleta.');
  });

  it('informa erro quando não há dias', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a previsão. Tente novamente.',
    );
  });
});

describe('ForecastCard', () => {
  it('associa rótulo, ícone decorativo e temperaturas ao dia', () => {
    render(<ForecastCard day={mockWeatherData.forecast[0]} unit="celsius" />);
    expect(screen.getByRole('heading')).toHaveTextContent('qui., 05/11');
    expect(screen.getByText('qui., 05/11')).toHaveAttribute('dateTime', '2026-11-05');
    expect(screen.getByText('☀️')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Máxima')).toBeInTheDocument();
    expect(screen.getByText('Mínima')).toBeInTheDocument();
  });

  it('não exibe temperaturas como válidas quando os extremos estão invertidos', () => {
    render(
      <ForecastCard
        day={{ ...mockWeatherData.forecast[0], minCelsius: 30, maxCelsius: 20 }}
        unit="celsius"
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('30 °C')).not.toBeInTheDocument();
  });
});

describe('formatDay', () => {
  it('formata datas locais em pt-BR sem deslocar o dia', () => {
    expect(formatDay('2026-11-05')).toBe('qui., 05/11');
    expect(formatDay('2027-01-01')).toBe('sex., 01/01');
    expect(formatDay('2028-02-29')).toBe('ter., 29/02');
  });

  it.each([
    '',
    '2026-02-30',
    '2026-13-01',
    '2026-1-01',
    '2026-11-05T00:00',
  ])('rejeita data inválida %j', (date) => {
    expect(() => formatDay(date)).toThrow(RangeError);
  });
});
