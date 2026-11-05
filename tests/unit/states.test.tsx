import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('anuncia o carregamento com semântica de status', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  const message = 'Não foi possível buscar cidades. Tente novamente.';

  it('anuncia a mensagem recebida como alerta', () => {
    render(<ErrorState message={message} />);

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('chama onRetry uma vez ao clicar', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message={message} onRetry={onRetry} />);

    expect(onRetry).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(['{Enter}', ' '])('permite tentar novamente com a tecla %j', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message={message} onRetry={onRetry} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it('não envia um formulário ao tentar novamente', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onRetry = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message={message} onRetry={onRetry} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('apresenta título e dica associados à região acessível', () => {
    render(<EmptyState title="Nenhuma cidade encontrada." hint="Tente outro nome de cidade." />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Nenhuma cidade encontrada.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Nenhuma cidade encontrada.' }),
    ).toHaveAccessibleDescription('Tente outro nome de cidade.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mantém as associações distintas quando há mais de um estado vazio', () => {
    render(
      <>
        <EmptyState title="Busque uma cidade" hint="Digite o nome no campo de busca." />
        <EmptyState title="Nenhuma cidade encontrada." hint="Tente outro nome." />
      </>,
    );

    expect(screen.getByRole('region', { name: 'Busque uma cidade' })).toHaveAccessibleDescription(
      'Digite o nome no campo de busca.',
    );
    expect(
      screen.getByRole('region', { name: 'Nenhuma cidade encontrada.' }),
    ).toHaveAccessibleDescription('Tente outro nome.');
  });
});
