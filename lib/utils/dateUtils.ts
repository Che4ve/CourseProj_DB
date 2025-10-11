export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getLast7Days(): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatDate(date));
  }

  return dates;
}

export function getLast14Days(): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatDate(date));
  }

  return dates;
}

export function calculateStreak(completions: string[]): number {
  if (completions.length === 0) return 0;

  const sortedDates = completions.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = getToday();

  // Check if completed today or yesterday
  const lastCompletion = sortedDates[0];
  const daysDiff = Math.floor(
    (new Date(today).getTime() - new Date(lastCompletion).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 1) return 0;

  let streak = 0;
  const currentDate = new Date(lastCompletion);

  for (const dateStr of sortedDates) {
    const completionDate = new Date(dateStr);
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(currentDate.getDate() - streak);

    if (formatDate(completionDate) === formatDate(expectedDate)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (formatDate(date) === formatDate(today)) {
    return 'Сегодня';
  } else if (formatDate(date) === formatDate(yesterday)) {
    return 'Вчера';
  }

  const day = date.getDate();
  const month = date.toLocaleDateString('ru-RU', { month: 'short' });
  return `${day} ${month}`;
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Получаем день недели первого дня месяца (0 = воскресенье, 1 = понедельник, ...)
  let firstDayOfWeek = firstDay.getDay();
  // Преобразуем в европейский формат (0 = понедельник)
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const days: Date[] = [];

  // Добавляем дни предыдущего месяца для заполнения первой недели
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, 1);
    date.setDate(date.getDate() - i - 1);
    days.push(date);
  }

  // Добавляем все дни текущего месяца
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Добавляем дни следующего месяца для заполнения последней недели
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
}
