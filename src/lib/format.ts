function parseDate(date: string): Date {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError('A data deve ser válida e estar no formato YYYY-MM-DD.');
  }

  return parsed;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  // A entrada já representa a data local da cidade; UTC evita deslocá-la.
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(date);
}

export function getDayLabel(index: number, date: string): string {
  const parsed = parseDate(date);
  if (index === 0) {
    return 'Hoje';
  }
  if (index === 1) {
    return 'Amanhã';
  }
  return formatDate(parsed, { weekday: 'short' });
}

export function getShortDate(date: string): string {
  return formatDate(parseDate(date), { day: '2-digit', month: '2-digit' });
}

export function formatDay(date: string): string {
  return formatDate(parseDate(date), { weekday: 'short', day: '2-digit', month: '2-digit' });
}
