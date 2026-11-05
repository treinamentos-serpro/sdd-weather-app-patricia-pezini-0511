import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode);

  if (!condition || !Number.isFinite(current.temperatureCelsius)) {
    return (
      <p role="alert" className="rounded-2xl border border-white/10 bg-white/5 p-6 text-red-300">
        Não foi possível carregar as condições atuais. Tente novamente.
      </p>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <h2 id={headingId} className="break-words text-2xl font-semibold sm:text-3xl">
        {city.name}
      </h2>
      {(city.region || city.country) && (
        <p className="mt-1 text-slate-300">
          {[city.region, city.country].filter(Boolean).join(', ')}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <span aria-hidden="true" className="text-5xl text-sun sm:text-7xl">
          {condition.icon}
        </span>
        <p className="min-w-0 text-5xl font-semibold tracking-tight sm:text-8xl">
          {formatTemperature(current.temperatureCelsius, unit)}
        </p>
      </div>
      <p className="mt-4 text-xl text-slate-200">{current.conditionLabel}</p>
    </section>
  );
}
