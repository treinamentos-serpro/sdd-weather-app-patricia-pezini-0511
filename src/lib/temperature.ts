import type { Unit } from '../types/weather';

export function convertTemperature(celsius: number, unit: Unit): number {
  if (!Number.isFinite(celsius)) {
    throw new RangeError('A temperatura deve ser um número finito.');
  }

  const temperature = unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
  if (!Number.isFinite(temperature)) {
    throw new RangeError('A temperatura convertida deve ser um número finito.');
  }
  return temperature;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? 'Fahrenheit' : 'Celsius';
}

export function formatTemperature(celsius: number, unit: Unit): string {
  const temperature = convertTemperature(celsius, unit);
  const rounded = Math.sign(temperature) * Math.round(Math.abs(temperature));
  return `${rounded} ${unit === 'fahrenheit' ? '°F' : '°C'}`;
}
