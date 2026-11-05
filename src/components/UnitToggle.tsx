import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex max-w-full flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-1 font-sans shadow-glass backdrop-blur-md"
    >
      <button
        type="button"
        aria-pressed={unit === 'celsius'}
        onClick={() => onChange('celsius')}
        className="min-w-0 flex-1 rounded-lg border border-slate-400 px-4 py-3 font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 aria-pressed:bg-accent-400 aria-pressed:text-night-900"
      >
        Celsius (°C)
      </button>
      <button
        type="button"
        aria-pressed={unit === 'fahrenheit'}
        onClick={() => onChange('fahrenheit')}
        className="min-w-0 flex-1 rounded-lg border border-slate-400 px-4 py-3 font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 aria-pressed:bg-accent-400 aria-pressed:text-night-900"
      >
        Fahrenheit (°F)
      </button>
    </div>
  );
}
