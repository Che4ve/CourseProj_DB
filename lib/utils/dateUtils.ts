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
  let currentDate = new Date(lastCompletion);

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
