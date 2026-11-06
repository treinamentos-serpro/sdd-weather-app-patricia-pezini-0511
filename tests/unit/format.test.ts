import { describe, expect, it } from 'vitest';
import { formatDay, getDayLabel, getShortDate } from '../../src/lib/format';

describe('getDayLabel', () => {
  it('retorna Hoje para o índice zero', () => {
    expect(getDayLabel(0, '2026-11-05')).toBe('Hoje');
  });

  it('retorna Amanhã para o índice um', () => {
    expect(getDayLabel(1, '2026-11-06')).toBe('Amanhã');
  });

  it('retorna o dia da semana abreviado para os demais índices', () => {
    expect(getDayLabel(2, '2026-11-07')).toBe('sáb.');
    expect(getDayLabel(4, '2026-11-09')).toBe('seg.');
  });
});

describe('getShortDate', () => {
  it('formata a data como dia e mês em pt-BR', () => {
    expect(getShortDate('2026-11-05')).toBe('05/11');
    expect(getShortDate('2028-02-29')).toBe('29/02');
  });
});

describe('formatDay', () => {
  it('preserva a formatação existente com dia da semana e data', () => {
    expect(formatDay('2026-11-05')).toBe('qui., 05/11');
  });

  it.each(['', '2026-02-30', '2026-13-01', '2026-1-01'])(
    'rejeita a data inválida %j',
    (date) => {
      expect(() => getShortDate(date)).toThrow(RangeError);
      expect(() => getDayLabel(2, date)).toThrow(RangeError);
      expect(() => formatDay(date)).toThrow(RangeError);
    },
  );
});
