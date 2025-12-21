-- ========================================
-- СКАЛЯРНАЯ ФУНКЦИЯ: расчёт completion rate
-- ========================================
CREATE OR REPLACE FUNCTION calc_completion_rate(
  p_user_id UUID,
  p_from DATE,
  p_to DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_expected INTEGER;
  v_actual INTEGER;
BEGIN
  -- Ожидаемое кол-во (дни * активные привычки)
  SELECT COUNT(DISTINCT h.id) * (p_to - p_from + 1)
  INTO v_expected
  FROM habits h
  WHERE h.user_id = p_user_id AND NOT h.is_archived;
  
  -- Фактическое кол-во checkins
  SELECT COUNT(*)
  INTO v_actual
  FROM habit_checkins hc
  JOIN habits h ON h.id = hc.habit_id
  WHERE h.user_id = p_user_id
    AND hc.checkin_date BETWEEN p_from AND p_to;
  
  IF v_expected = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((v_actual::NUMERIC / v_expected) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ТАБЛИЧНАЯ ФУНКЦИЯ: отчёт по привычкам
-- ========================================
CREATE OR REPLACE FUNCTION report_user_habits(
  p_user_id UUID,
  p_from DATE,
  p_to DATE
) RETURNS TABLE(
  habit_id UUID,
  habit_name TEXT,
  habit_type VARCHAR,
  total_checkins BIGINT,
  completion_rate NUMERIC,
  last_checkin DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    h.type,
    COUNT(hc.id) as total_checkins,
    ROUND(
      (COUNT(hc.id)::NUMERIC / NULLIF((p_to - p_from + 1), 0)) * 100, 
      2
    ) as completion_rate,
    MAX(hc.checkin_date) as last_checkin
  FROM habits h
  LEFT JOIN habit_checkins hc ON hc.habit_id = h.id 
    AND hc.checkin_date BETWEEN p_from AND p_to
  WHERE h.user_id = p_user_id
  GROUP BY h.id, h.name, h.type
  ORDER BY total_checkins DESC;
END;
$$ LANGUAGE plpgsql;


