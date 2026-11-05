import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App com dados de demonstração', () => {
  it('inicia em idle, com header, busca e Celsius selecionado', () => {
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
    expect(screen.queryByText('23 °C')).not.toBeInTheDocument();
  });

  it('busca localmente, converte todas as temperaturas e preserva o mock', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const original = structuredClone(mockWeatherData);
    render(<App />);
    await user.type(screen.getByRole('searchbox'), '  sao paulo  {Enter}');
    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('23 °C');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('73 °F');
    expect(within(screen.getAllByRole('listitem')[0]).getByText('81 °F')).toBeInTheDocument();
    expect(within(screen.getAllByRole('listitem')[0]).getByText('64 °F')).toBeInTheDocument();
    expect(screen.getByRole('main').textContent).not.toContain('°C');

    await user.click(screen.getByRole('button', { name: 'Celsius (°C)' }));
    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('23 °C');
    expect(mockWeatherData).toEqual(original);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('não atribui o clima do mock a outra cidade e remove os resultados anteriores', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText('Cenário de demonstração'), 'success');
    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    expect(screen.getByRole('main')).toHaveTextContent('Nenhuma cidade encontrada.');
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('alterna os cenários e permite recuperar do erro sem perder a unidade', async () => {
    const user = userEvent.setup();
    render(<App />);
    const scenario = screen.getByLabelText('Cenário de demonstração');
    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    await user.selectOptions(scenario, 'success');
    await user.selectOptions(scenario, 'loading');
    expect(screen.getByText('Carregando...').closest('[role="status"]')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await user.selectOptions(scenario, 'empty');
    expect(screen.getByRole('main')).toHaveTextContent('Nenhuma cidade encontrada.');
    expect(screen.getByRole('searchbox')).toBeEnabled();

    await user.selectOptions(scenario, 'error');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as condições atuais.',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('73 °F');

    await user.selectOptions(scenario, 'idle');
    expect(screen.getByRole('main')).toHaveTextContent('Consulte o clima de uma cidade');
  });

  it('restaura Celsius ao montar uma nova página', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Celsius (°C)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('anuncia resultado vazio e sucesso sem tirar o foco da busca', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'Curitiba{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada.');
    expect(input).toHaveFocus();
    await user.clear(input);
    await user.type(input, 'São Paulo{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Clima de São Paulo e previsão de cinco dias disponíveis em Celsius.',
    );
    expect(input).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    expect(screen.getByRole('status')).toHaveTextContent('disponíveis em Fahrenheit.');
  });
});
