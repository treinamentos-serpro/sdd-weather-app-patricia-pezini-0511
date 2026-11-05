import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import { mockWeatherData } from './mocks/weather';
import type { Unit } from './types/weather';

type ViewState = 'idle' | 'loading' | 'empty' | 'error' | 'success';

function isViewState(value: string): value is ViewState {
  return ['idle', 'loading', 'empty', 'error', 'success'].includes(value);
}

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const [view, setView] = useState<ViewState>('idle');
  const mainRef = useRef<HTMLElement>(null);

  function handleSearch(city: string) {
    const matches =
      city.trim().localeCompare(mockWeatherData.city.name, 'pt-BR', {
        sensitivity: 'base',
      }) === 0;
    setView(matches ? 'success' : 'empty');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 via-night-800 to-night-900 font-sans text-white [overflow-wrap:anywhere]">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-accent-400 p-3 text-night-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">
                SDD Weather
              </p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Previsão do tempo</h1>
            </div>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          <SearchBar onSearch={handleSearch} disabled={view === 'loading'} />
        </header>

        <aside
          aria-label="Controles de demonstração"
          className="my-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm backdrop-blur-md"
        >
          <p className="mb-3 text-slate-300">
            Demonstração sem API: dados fictícios de São Paulo, de 05 a 09/11/2026. Busque São Paulo
            para ver o exemplo; outros nomes não têm dados neste mock.
          </p>
          <label htmlFor="demo-state" className="mr-3 font-medium">
            Cenário de demonstração
          </label>
          <select
            id="demo-state"
            value={view}
            onChange={(event) => {
              const value = event.target.value;
              if (!isViewState(value)) {
                throw new Error('Cenário de demonstração inválido.');
              }
              setView(value);
            }}
            className="mt-2 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-400 bg-night-900 px-3 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 sm:mt-0 sm:w-auto"
          >
            <option value="idle">Inicial</option>
            <option value="loading">Carregando</option>
            <option value="empty">Sem resultados</option>
            <option value="error">Erro</option>
            <option value="success">Sucesso</option>
          </select>
        </aside>

        <p role="status" aria-atomic="true" className="sr-only">
          {view === 'empty' && 'Nenhuma cidade encontrada.'}
          {view === 'success' &&
            `Clima de ${mockWeatherData.city.name} e previsão de cinco dias disponíveis em ${
              unit === 'celsius' ? 'Celsius' : 'Fahrenheit'
            }.`}
        </p>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="space-y-6 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {view === 'idle' && (
            <EmptyState
              title="Consulte o clima de uma cidade"
              hint="Digite São Paulo no campo de busca para explorar os dados de exemplo."
            />
          )}
          {view === 'loading' && <LoadingState />}
          {view === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada."
              hint="Nesta demonstração, tente buscar São Paulo."
            />
          )}
          {view === 'error' && (
            <ErrorState
              message="Não foi possível carregar as condições atuais. Tente novamente."
              onRetry={() => {
                setView('success');
                mainRef.current?.focus();
              }}
            />
          )}
          {view === 'success' && (
            <>
              <CurrentWeather
                city={mockWeatherData.city}
                current={mockWeatherData.current}
                unit={unit}
              />
              <ForecastList forecast={mockWeatherData.forecast} unit={unit} />
            </>
          )}
        </main>
        <footer className="mt-10 text-center text-sm text-slate-400">
          Protótipo de interface · Sem consultas meteorológicas reais
        </footer>
      </div>
    </div>
  );
}
