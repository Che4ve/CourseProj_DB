-- ========================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- ========================================

-- Habits: фильтрация по пользователю и статусу
CREATE INDEX IF NOT EXISTS idx_habits_user_id 
  ON habits(user_id) 
  WHERE NOT is_archived;

-- HabitCheckins: основные запросы по habit_id и дате
CREATE INDEX IF NOT EXISTS idx_habit_checkins_habit_date 
  ON habit_checkins(habit_id, checkin_date DESC);

-- HabitCheckins: пользовательская история
CREATE INDEX IF NOT EXISTS idx_habit_checkins_user_date 
  ON habit_checkins(user_id, checkin_date DESC);

-- HabitCheckins: глобальная статистика по датам
CREATE INDEX IF NOT EXISTS idx_habit_checkins_date 
  ON habit_checkins(checkin_date DESC);

-- AuditLog: поиск по таблице, операции и времени
CREATE INDEX IF NOT EXISTS idx_audit_log_table_op_time 
  ON audit_log(table_name, operation, changed_at DESC);

-- AuditLog: история действий пользователя
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time 
  ON audit_log(user_id, changed_at DESC) 
  WHERE user_id IS NOT NULL;

-- HabitTags: связи привычка-теги
CREATE INDEX IF NOT EXISTS idx_habit_tags_habit 
  ON habit_tags(habit_id);

-- HabitTags: обратный поиск по тегам
CREATE INDEX IF NOT EXISTS idx_habit_tags_tag 
  ON habit_tags(tag_id);

-- BatchImportJobs: фильтрация по пользователю и статусу
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_status 
  ON batch_import_jobs(user_id, status);

-- BatchImportErrors: поиск ошибок по job_id
CREATE INDEX IF NOT EXISTS idx_batch_errors_job 
  ON batch_import_errors(job_id);


