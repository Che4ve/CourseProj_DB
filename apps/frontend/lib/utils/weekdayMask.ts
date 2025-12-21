export const WEEKDAY_OPTIONS = [
  { bit: 1, label: 'Пн' },
  { bit: 2, label: 'Вт' },
  { bit: 4, label: 'Ср' },
  { bit: 8, label: 'Чт' },
  { bit: 16, label: 'Пт' },
  { bit: 32, label: 'Сб' },
  { bit: 64, label: 'Вс' },
];

export const ALL_WEEKDAYS_MASK = WEEKDAY_OPTIONS.reduce((acc, day) => acc + day.bit, 0);

export function maskToLabels(mask: number): string[] {
  return WEEKDAY_OPTIONS.filter((day) => (mask & day.bit) !== 0).map((day) => day.label);
}

export function formatWeekdays(mask: number): string {
  const labels = maskToLabels(mask);
  if (labels.length === WEEKDAY_OPTIONS.length) {
    return 'Каждый день';
  }
  if (labels.length === 0) {
    return 'Нет дней';
  }
  return labels.join(', ');
}
