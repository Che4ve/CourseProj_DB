-- Add CHECK constraints for core enums/ranges
ALTER TABLE "habits"
  ADD CONSTRAINT "habits_type_check" CHECK ("type" IN ('good', 'bad')),
  ADD CONSTRAINT "habits_priority_check" CHECK ("priority" BETWEEN 0 AND 10);

ALTER TABLE "habit_checkins"
  ADD CONSTRAINT "habit_checkins_mood_rating_check"
  CHECK ("mood_rating" IS NULL OR ("mood_rating" BETWEEN 1 AND 5));

ALTER TABLE "habit_schedules"
  ADD CONSTRAINT "habit_schedules_frequency_type_check"
  CHECK ("frequency_type" IN ('daily', 'weekly', 'monthly', 'custom')),
  ADD CONSTRAINT "habit_schedules_frequency_value_check"
  CHECK ("frequency_value" > 0);

ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_delivery_method_check"
  CHECK ("delivery_method" IN ('push', 'email', 'sms'));

ALTER TABLE "batch_import_jobs"
  ADD CONSTRAINT "batch_import_jobs_status_check"
  CHECK ("status" IN ('processing', 'completed', 'failed'));

ALTER TABLE "_manual_migrations"
  ADD CONSTRAINT "manual_migrations_status_check"
  CHECK ("status" IN ('success', 'failed'));
