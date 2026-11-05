import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature } from '../../src/lib/temperature';
import type { Unit } from '../../src/types/weather';

describe('Temperatura', () => {
  it.each([
    [0, 32],
    [10, 50],
    [-40, -40],
  ])('converte %s °C para %s °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
    expect(convertTemperature(celsius, 'celsius')).toBe(celsius);
  });

  it.each<[number, Unit, string]>([
    [1.5, 'celsius', '2 °C'],
    [-1.5, 'celsius', '-2 °C'],
    [0.25, 'fahrenheit', '32 °F'],
    [5 / 18, 'fahrenheit', '33 °F'],
    [-18.25, 'fahrenheit', '-1 °F'],
    [-0.1, 'celsius', '0 °C'],
  ])('formata %s em %s como %s', (value, unit, expected) => {
    expect(formatTemperature(value, unit)).toBe(expected);
  });

  it('sempre converte a partir do valor original', () => {
    const original = 23.4;
    expect(formatTemperature(original, 'celsius')).toBe('23 °C');
    expect(formatTemperature(original, 'fahrenheit')).toBe('74 °F');
    expect(formatTemperature(original, 'celsius')).toBe('23 °C');
    expect(original).toBe(23.4);
  });

  it.each([NaN, Infinity, -Infinity])('rejeita entrada não finita %s', (value) => {
    expect(() => formatTemperature(value, 'celsius')).toThrow(RangeError);
  });
});
