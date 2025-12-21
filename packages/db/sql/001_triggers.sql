-- Таблица контроля ручных миграций уже создана через Prisma schema

-- ========================================
-- ФУНКЦИЯ АУДИТА (с правильным user_id и old+new)
-- ========================================
CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Получаем user_id из SET LOCAL app.user_id (если есть)
  BEGIN
    v_user_id := nullif(current_setting('app.user_id', true), '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  -- Записываем аудит
  INSERT INTO audit_log (table_name, operation, record_id, user_id, old_data, new_data, changed_at)
  VALUES (
    TG_TABLE_NAME::VARCHAR,
    TG_OP::VARCHAR,
    COALESCE(NEW.id, OLD.id),
    v_user_id,
    -- UPDATE: записываем и old, и new
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    NOW()
  );

  -- Правильный RETURN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ТРИГГЕРЫ АУДИТА
-- ========================================
DROP TRIGGER IF EXISTS habits_audit ON habits;
CREATE TRIGGER habits_audit 
  AFTER INSERT OR UPDATE OR DELETE ON habits
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS habit_checkins_audit ON habit_checkins;
CREATE TRIGGER habit_checkins_audit
  AFTER INSERT OR UPDATE OR DELETE ON habit_checkins
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS tags_audit ON tags;
CREATE TRIGGER tags_audit
  AFTER INSERT OR UPDATE OR DELETE ON tags
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS reminders_audit ON reminders;
CREATE TRIGGER reminders_audit
  AFTER INSERT OR UPDATE OR DELETE ON reminders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- ========================================
-- ТРИГГЕР АГРЕГАТОВ (автоматическое обновление habit_stats)
-- ========================================
CREATE OR REPLACE FUNCTION update_habit_stats() RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_avg_mood NUMERIC;
  v_last_checkin DATE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Вычисляем агрегаты
    SELECT 
      COUNT(*), 
      AVG(mood_rating),
      MAX(checkin_date)
    INTO v_total, v_avg_mood, v_last_checkin
    FROM habit_checkins
    WHERE habit_id = NEW.habit_id;
    
    -- Обновляем habit_stats
    INSERT INTO habit_stats (habit_id, total_checkins, average_mood, last_checkin_at, updated_at)
    VALUES (NEW.habit_id, v_total, v_avg_mood, v_last_checkin, NOW())
    ON CONFLICT (habit_id) DO UPDATE SET
      total_checkins = v_total,
      average_mood = v_avg_mood,
      last_checkin_at = GREATEST(habit_stats.last_checkin_at, v_last_checkin),
      updated_at = NOW();
      
  ELSIF TG_OP = 'DELETE' THEN
    -- Пересчитываем при удалении
    SELECT 
      COUNT(*), 
      AVG(mood_rating),
      MAX(checkin_date)
    INTO v_total, v_avg_mood, v_last_checkin
    FROM habit_checkins
    WHERE habit_id = OLD.habit_id;
    
    UPDATE habit_stats SET
      total_checkins = v_total,
      average_mood = v_avg_mood,
      last_checkin_at = v_last_checkin,
      updated_at = NOW()
    WHERE habit_id = OLD.habit_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Пересчитываем при обновлении (если изменился mood_rating)
    SELECT 
      COUNT(*), 
      AVG(mood_rating),
      MAX(checkin_date)
    INTO v_total, v_avg_mood, v_last_checkin
    FROM habit_checkins
    WHERE habit_id = NEW.habit_id;
    
    UPDATE habit_stats SET
      total_checkins = v_total,
      average_mood = v_avg_mood,
      last_checkin_at = v_last_checkin,
      updated_at = NOW()
    WHERE habit_id = NEW.habit_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS habit_checkins_update_stats ON habit_checkins;
CREATE TRIGGER habit_checkins_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON habit_checkins
  FOR EACH ROW EXECUTE FUNCTION update_habit_stats();


