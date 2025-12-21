import type { HabitCheckin } from "@/lib/typeDefinitions";
import { formatDate } from "@/lib/utils/dateUtils";

export const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export interface CheckinDetailsState {
	notes: string;
	moodRating: string;
	durationMinutes: string;
}

export interface CheckinUpdatePayload {
	notes?: string | null;
	moodRating?: number | null;
	durationMinutes?: number | null;
}

export function findCheckinForDate(
	completions: HabitCheckin[],
	dateStr: string,
): HabitCheckin | undefined {
	return completions.find(
		(checkin) => formatDate(new Date(checkin.checkinDate)) === dateStr,
	);
}

export function getCheckinDetails(
	checkin?: HabitCheckin | null,
): CheckinDetailsState {
	return {
		notes: checkin?.notes ?? "",
		moodRating: checkin?.moodRating?.toString() ?? "",
		durationMinutes: checkin?.durationMinutes?.toString() ?? "",
	};
}

export function buildCheckinUpdatePayload(
	details: CheckinDetailsState,
): CheckinUpdatePayload {
	const trimmedNotes = details.notes.trim();
	const moodValue = details.moodRating.trim()
		? Number(details.moodRating)
		: undefined;
	const durationValue = details.durationMinutes.trim()
		? Number(details.durationMinutes)
		: undefined;
	const normalizedMood =
		moodValue !== undefined && Number.isNaN(moodValue) ? undefined : moodValue;
	const normalizedDuration =
		durationValue !== undefined && Number.isNaN(durationValue)
			? undefined
			: durationValue;

	return {
		notes: trimmedNotes ? trimmedNotes : null,
		moodRating: normalizedMood ?? null,
		durationMinutes: normalizedDuration ?? null,
	};
}

export function payloadToDetails(
	payload: CheckinUpdatePayload,
): CheckinDetailsState {
	return {
		notes: payload.notes ?? "",
		moodRating:
			payload.moodRating === null || payload.moodRating === undefined
				? ""
				: payload.moodRating.toString(),
		durationMinutes:
			payload.durationMinutes === null || payload.durationMinutes === undefined
				? ""
				: payload.durationMinutes.toString(),
	};
}
