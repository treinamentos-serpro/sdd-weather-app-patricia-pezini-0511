import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import { useWeather } from './hooks/useWeather';
import { unitLabel } from './lib/temperature';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, error, search, retry } = useWeather();
  const mainRef = useRef<HTMLElement>(null);

  function handleRetry() {
    mainRef.current?.focus();
    void retry();
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
          <SearchBar onSearch={search} disabled={status === 'loading'} />
        </header>

        <p role="status" aria-atomic="true" className="sr-only">
          {status === 'empty' && 'Nenhuma cidade encontrada.'}
          {status === 'success' &&
            data &&
            `Clima de ${data.city.name} e previsão de cinco dias disponíveis em ${unitLabel(unit)}.`}
        </p>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="mt-6 space-y-6 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState
              title="Consulte o clima de uma cidade"
              hint="Digite o nome de uma cidade no campo de busca."
            />
          )}
          {status === 'loading' && <LoadingState />}
          {status === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada."
              hint="Verifique o nome da cidade e tente novamente."
            />
          )}
          {status === 'error' && error && (
            <ErrorState message={error.message} onRetry={handleRetry} />
          )}
          {status === 'success' && data && (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList forecast={data.forecast} unit={unit} />
            </>
          )}
        </main>
        <footer className="mt-10 text-center text-sm text-slate-400">
          Dados meteorológicos fornecidos pela{' '}
          <a
            href="https://open-meteo.com/"
            className="underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
          >
            Open-Meteo
          </a>
        </footer>
      </div>
    </div>
  );
}
