import { useCallback, useEffect, useMemo, useState } from "react";
import type { HabitCheckin } from "@/lib/typeDefinitions";
import {
	buildCheckinUpdatePayload,
	getCheckinDetails,
	payloadToDetails,
} from "@/components/habits/habitTrackerUtils";

export function useCheckinDetails(
	todayCheckin: HabitCheckin | undefined,
	isTodayCompleted: boolean,
) {
	const initialDetails = useMemo(
		() => getCheckinDetails(todayCheckin),
		[todayCheckin],
	);

	const [notes, setNotes] = useState(initialDetails.notes);
	const [moodRating, setMoodRating] = useState(initialDetails.moodRating);
	const [durationMinutes, setDurationMinutes] = useState(
		initialDetails.durationMinutes,
	);
	const [savedDetails, setSavedDetails] = useState(initialDetails);

	const resetDetails = useCallback(() => {
		setNotes("");
		setMoodRating("");
		setDurationMinutes("");
		setSavedDetails({ notes: "", moodRating: "", durationMinutes: "" });
	}, []);

	useEffect(() => {
		if (!isTodayCompleted) {
			resetDetails();
			return;
		}

		if (todayCheckin) {
			const nextDetails = getCheckinDetails(todayCheckin);
			setNotes(nextDetails.notes);
			setMoodRating(nextDetails.moodRating);
			setDurationMinutes(nextDetails.durationMinutes);
			setSavedDetails(nextDetails);
		}
	}, [
		isTodayCompleted,
		resetDetails,
		todayCheckin,
		todayCheckin?.notes,
		todayCheckin?.moodRating,
		todayCheckin?.durationMinutes,
	]);

	const hasChanges =
		isTodayCompleted &&
		(notes.trim() !== savedDetails.notes.trim() ||
			moodRating.trim() !== savedDetails.moodRating.trim() ||
			durationMinutes.trim() !== savedDetails.durationMinutes.trim());

	const buildUpdatePayload = useCallback(() => {
		return buildCheckinUpdatePayload({
			notes,
			moodRating,
			durationMinutes,
		});
	}, [notes, moodRating, durationMinutes]);

	const markSavedDetails = useCallback(
		(payload: ReturnType<typeof buildCheckinUpdatePayload>) => {
			setSavedDetails(payloadToDetails(payload));
		},
		[],
	);

	return {
		notes,
		setNotes,
		moodRating,
		setMoodRating,
		durationMinutes,
		setDurationMinutes,
		hasChanges,
		buildUpdatePayload,
		markSavedDetails,
	};
}
