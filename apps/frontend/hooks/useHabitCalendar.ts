import { useCallback, useMemo, useState } from "react";
import { getCalendarDays } from "@/lib/utils/dateUtils";
import { WEEK_DAYS } from "@/components/habits/habitTrackerUtils";

export function useHabitCalendar() {
	const today = useMemo(() => new Date(), []);
	const [currentMonth, setCurrentMonth] = useState(today.getMonth());
	const [currentYear, setCurrentYear] = useState(today.getFullYear());

	const calendarDays = useMemo(
		() => getCalendarDays(currentYear, currentMonth),
		[currentYear, currentMonth],
	);
	const currentMonthDate = useMemo(
		() => new Date(currentYear, currentMonth),
		[currentYear, currentMonth],
	);
	const isCurrentMonth =
		currentYear === today.getFullYear() && currentMonth === today.getMonth();

	const goToPreviousMonth = useCallback(() => {
		setCurrentMonth((prev) => {
			if (prev === 0) {
				setCurrentYear((year) => year - 1);
				return 11;
			}
			return prev - 1;
		});
	}, []);

	const goToNextMonth = useCallback(() => {
		const now = new Date();
		if (
			currentYear > now.getFullYear() ||
			(currentYear === now.getFullYear() && currentMonth >= now.getMonth())
		) {
			return;
		}

		setCurrentMonth((prev) => {
			if (prev === 11) {
				setCurrentYear((year) => year + 1);
				return 0;
			}
			return prev + 1;
		});
	}, [currentMonth, currentYear]);

	return {
		calendarDays,
		currentMonthDate,
		isCurrentMonth,
		weekDays: WEEK_DAYS,
		goToPreviousMonth,
		goToNextMonth,
	};
}
