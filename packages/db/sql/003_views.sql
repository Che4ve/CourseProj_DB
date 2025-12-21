-- ========================================
-- VIEW 1: Сводка по привычкам пользователя
-- ========================================
CREATE OR REPLACE VIEW v_user_habit_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  COUNT(DISTINCT h.id) as total_habits,
  COUNT(DISTINCT CASE WHEN h.type = 'good' THEN h.id END) as good_habits,
  COUNT(DISTINCT CASE WHEN h.type = 'bad' THEN h.id END) as bad_habits,
  COALESCE(SUM(hs.total_checkins), 0) as total_checkins,
  MAX(hs.last_checkin_at) as last_activity
FROM users u
LEFT JOIN habits h ON h.user_id = u.id AND NOT h.is_archived
LEFT JOIN habit_stats hs ON hs.habit_id = h.id
GROUP BY u.id, u.email, u.full_name;

-- ========================================
-- VIEW 2: Ежедневная статистика
-- ========================================
CREATE OR REPLACE VIEW v_daily_completion AS
SELECT 
  hc.checkin_date,
  COUNT(*) as total_checkins,
  COUNT(DISTINCT hc.user_id) as active_users,
  COUNT(DISTINCT hc.habit_id) as habits_completed,
  ROUND(AVG(hc.mood_rating), 2) as avg_mood,
  SUM(hc.duration_minutes) as total_minutes
FROM habit_checkins hc
GROUP BY hc.checkin_date
ORDER BY hc.checkin_date DESC;

-- ========================================
-- VIEW 3: Использование тегов
-- ========================================
CREATE OR REPLACE VIEW v_tag_usage AS
SELECT 
  t.id as tag_id,
  t.name as tag_name,
  t.color,
  COUNT(ht.habit_id) as usage_count,
  COUNT(DISTINCT ht.habit_id) as unique_habits,
  MAX(ht.assigned_at) as last_used
FROM tags t
LEFT JOIN habit_tags ht ON ht.tag_id = t.id
GROUP BY t.id, t.name, t.color
ORDER BY usage_count DESC;


