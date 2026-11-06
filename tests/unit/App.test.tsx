import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(searchCities).mockReset().mockResolvedValue([mockWeatherData.city]);
  vi.mocked(getWeather).mockReset().mockResolvedValue(mockWeatherData);
});

afterEach(cleanup);

describe('App integrado ao useWeather', () => {
  it('inicia em idle sem consultas nem controles de demonstração', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Previsão do tempo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Celsius (°C)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('main')).toHaveTextContent('Consulte o clima de uma cidade');
    expect(screen.queryByLabelText('Cenário de demonstração')).not.toBeInTheDocument();
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('busca via serviço e converte as temperaturas sem novas consultas ou mutação', async () => {
    const user = userEvent.setup();
    const original = structuredClone(mockWeatherData);
    render(<App />);
    await user.type(screen.getByRole('searchbox'), '  São Paulo  {Enter}');
    expect(await screen.findByRole('region', { name: 'São Paulo' })).toHaveTextContent('23 °C');
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(mockWeatherData.city);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('73 °F');
    expect(within(screen.getAllByRole('listitem')[0]).getByText('81 °F')).toBeInTheDocument();
    expect(within(screen.getAllByRole('listitem')[0]).getByText('64 °F')).toBeInTheDocument();
    expect(screen.getByRole('main').textContent).not.toContain('°C');
    expect(screen.getByRole('status')).toHaveTextContent('disponíveis em Fahrenheit.');

    await user.click(screen.getByRole('button', { name: 'Celsius (°C)' }));
    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('23 °C');
    expect(mockWeatherData).toEqual(original);
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('mostra loading durante a consulta, desabilita busca e remove o clima anterior', async () => {
    const user = userEvent.setup();
    let resolveWeather!: (data: WeatherData) => void;
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await screen.findByRole('region', { name: 'São Paulo' });
    vi.mocked(getWeather).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWeather = resolve;
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByText('Carregando...').closest('[role="status"]')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();

    await act(async () => {
      resolveWeather(mockWeatherData);
    });
    expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeEnabled();
  });

  it('mostra empty sem reutilizar clima nem consultar forecast', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await screen.findByRole('region', { name: 'São Paulo' });
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada.');
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('searchbox')).toHaveValue('Curitiba');
  });

  it('mostra o erro do serviço e retry repete somente o clima preservando unidade e foco', async () => {
    const user = userEvent.setup();
    vi.mocked(getWeather).mockRejectedValueOnce(
      new WeatherServiceError('network', undefined, 'weather'),
    );
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('region', { name: 'São Paulo' })).toHaveTextContent('73 °F');
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
  });

  it('retry repete a busca que falhou e continua mostrando erro se falhar novamente', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockRejectedValue(new WeatherServiceError('timeout'));
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('A requisição demorou demais.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A requisição demorou demais.');
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(searchCities).toHaveBeenLastCalledWith('São Paulo');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('restaura Celsius e idle ao montar uma nova página', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Celsius (°C)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('main')).toHaveTextContent('Consulte o clima de uma cidade');
  });
});
