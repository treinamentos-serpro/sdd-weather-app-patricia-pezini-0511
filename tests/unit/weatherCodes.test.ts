import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('getWeatherCondition', () => {
  it.each([
    [0, 'Céu limpo', '☀️'],
    [1, 'Predominantemente limpo', '🌤️'],
    [2, 'Parcialmente nublado', '⛅'],
    [3, 'Nublado', '☁️'],
    [45, 'Nevoeiro', '🌫️'],
    [48, 'Nevoeiro com geada', '🌫️'],
    [51, 'Garoa fraca', '🌦️'],
    [53, 'Garoa moderada', '🌦️'],
    [55, 'Garoa intensa', '🌦️'],
    [56, 'Garoa congelante fraca', '🌧️'],
    [57, 'Garoa congelante intensa', '🌧️'],
    [61, 'Chuva fraca', '🌧️'],
    [63, 'Chuva moderada', '🌧️'],
    [65, 'Chuva intensa', '🌧️'],
    [66, 'Chuva congelante fraca', '🌧️'],
    [67, 'Chuva congelante intensa', '🌧️'],
    [71, 'Neve fraca', '🌨️'],
    [73, 'Neve moderada', '🌨️'],
    [75, 'Neve intensa', '🌨️'],
    [77, 'Grãos de neve', '🌨️'],
    [80, 'Pancadas de chuva fracas', '🌦️'],
    [81, 'Pancadas de chuva moderadas', '🌦️'],
    [82, 'Pancadas de chuva violentas', '🌧️'],
    [85, 'Pancadas de neve fracas', '🌨️'],
    [86, 'Pancadas de neve intensas', '🌨️'],
    [95, 'Trovoada', '⛈️'],
    [96, 'Trovoada com granizo fraco', '⛈️'],
    [99, 'Trovoada com granizo intenso', '⛈️'],
  ])('mapeia o código WMO %i para a condição esperada', (code, label, icon) => {
    expect(getWeatherCondition(code)).toEqual({ label, icon });
  });

  it('retorna undefined para um código WMO desconhecido', () => {
    expect(getWeatherCondition(999)).toBeUndefined();
  });
});
