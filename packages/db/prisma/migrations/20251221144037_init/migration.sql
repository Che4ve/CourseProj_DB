-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "date_of_birth" DATE,
    "notification_enabled" BOOLEAN NOT NULL DEFAULT true,
    "theme_preference" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" VARCHAR(10) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL,
    "frequency_type" VARCHAR(20) NOT NULL,
    "frequency_value" INTEGER NOT NULL DEFAULT 1,
    "weekdays_mask" SMALLINT NOT NULL DEFAULT 127,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "habit_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_checkins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "checkin_date" DATE NOT NULL,
    "checkin_time" TIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "mood_rating" SMALLINT,
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" TEXT NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#gray',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_by" VARCHAR(50) NOT NULL DEFAULT 'user',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL,
    "reminder_time" TIME(6) NOT NULL,
    "days_of_week" SMALLINT NOT NULL DEFAULT 127,
    "notification_text" TEXT,
    "delivery_method" VARCHAR(20) NOT NULL DEFAULT 'push',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL,
    "total_checkins" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "average_mood" DECIMAL(3,2),
    "last_checkin_at" DATE,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "table_name" VARCHAR(100) NOT NULL,
    "operation" VARCHAR(10) NOT NULL,
    "record_id" UUID,
    "user_id" UUID,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" INET,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_manual_migrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "checksum" CHAR(64),
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "execution_time_ms" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "applied_by" TEXT,

    CONSTRAINT "_manual_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_import_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "entity_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "file_size_bytes" BIGINT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "batch_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_import_errors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID NOT NULL,
    "row_number" INTEGER,
    "record_data" JSONB NOT NULL,
    "error_message" TEXT NOT NULL,
    "error_code" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "habit_checkins_habit_id_checkin_date_key" ON "habit_checkins"("habit_id", "checkin_date");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "habit_tags_habit_id_tag_id_key" ON "habit_tags"("habit_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "habit_stats_habit_id_key" ON "habit_stats"("habit_id");

-- CreateIndex
CREATE INDEX "audit_log_changed_at_idx" ON "audit_log"("changed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "_manual_migrations_name_key" ON "_manual_migrations"("name");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_schedules" ADD CONSTRAINT "habit_schedules_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_tags" ADD CONSTRAINT "habit_tags_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_tags" ADD CONSTRAINT "habit_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_stats" ADD CONSTRAINT "habit_stats_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_import_jobs" ADD CONSTRAINT "batch_import_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_import_errors" ADD CONSTRAINT "batch_import_errors_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "batch_import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
