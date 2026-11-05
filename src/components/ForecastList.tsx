import { useId } from 'react';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  const headingId = useId();
  const days = [...forecast].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return (
    <section aria-labelledby={headingId} className="font-sans text-white">
      <h2 id={headingId} className="mb-4 text-2xl font-semibold">
        Previsão de 5 dias
      </h2>
      {days.length === 0 ? (
        <p role="alert" className="text-red-300">
          Não foi possível carregar a previsão. Tente novamente.
        </p>
      ) : (
        <>
          {days.length < 5 && (
            <p role="status" className="mb-4 text-slate-300">
              Previsão incompleta.
            </p>
          )}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {days.map((day) => (
              <li key={day.date} className="min-w-0">
                <ForecastCard day={day} unit={unit} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
