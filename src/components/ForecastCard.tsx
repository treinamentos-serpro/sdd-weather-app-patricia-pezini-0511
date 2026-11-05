import { formatDay } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const condition = getWeatherCondition(day.weatherCode);

  if (
    !condition ||
    !Number.isFinite(day.minCelsius) ||
    !Number.isFinite(day.maxCelsius) ||
    day.minCelsius > day.maxCelsius
  ) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p role="alert" className="text-red-300">
          Não foi possível carregar a previsão. Tente novamente.
        </p>
      </article>
    );
  }

  return (
    <article className="h-full rounded-2xl border border-white/10 bg-white/5 p-3 text-center font-sans text-white shadow-glass backdrop-blur-md sm:p-4">
      <h3 className="font-semibold">
        <time dateTime={day.date}>{formatDay(day.date)}</time>
      </h3>
      <span aria-hidden="true" className="my-4 block text-3xl text-sun sm:text-5xl">
        {condition.icon}
      </span>
      <p className="break-words text-sm text-slate-200">{day.conditionLabel}</p>
      <dl className="mt-4 space-y-2">
        <div>
          <dt className="text-sm text-slate-300">Máxima</dt>
          <dd className="text-xl font-semibold">{formatTemperature(day.maxCelsius, unit)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-300">Mínima</dt>
          <dd className="text-lg">{formatTemperature(day.minCelsius, unit)}</dd>
        </div>
      </dl>
    </article>
  );
}
