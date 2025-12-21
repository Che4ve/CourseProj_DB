# Чеклист требований курсовой работы по БД

## 1. Структура базы данных (15 баллов)

### Требования
- ✅ Не менее 9–10 таблиц
- ✅ Связи 1:1, 1:N, N:M
- ✅ Каждая таблица >= 5 атрибутов **РАЗНЫХ ТИПОВ**
- ✅ Ключевые сущности (Users, Habits, Checkins)
- ✅ Журнал аудита

### Реализация
- **13 таблиц**: users, user_profiles, habits, habit_schedules, habit_checkins, tags, habit_tags, reminders, habit_stats, audit_log, _manual_migrations, batch_import_jobs, batch_import_errors
- **Связи**:
  - 1:1: users ↔ user_profiles
  - 1:N: users → habits, habits → checkins, habits → schedules, habits → reminders
  - N:M: habits ↔ tags (через habit_tags)
- **Типы данных**: >= 5 разных типов в каждой таблице (UUID, TEXT, VARCHAR, INTEGER, BOOLEAN, DATE, TIME, TIMESTAMPTZ, SMALLINT, NUMERIC, JSONB, INET, CHAR, BIGINT)

### Проверка
```sql
-- Список таблиц
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Типы в каждой таблице (см. docs/schema.md)
```

---

## 2. Ограничения целостности (10 баллов)

### Требования
- ✅ PRIMARY KEY
- ✅ FOREIGN KEY с каскадным обновлением/удалением
- ✅ UNIQUE
- ✅ CHECK
- ✅ NOT NULL

### Реализация
- **PRIMARY KEY**: id UUID во всех таблицах
- **FOREIGN KEY**: все связи с `ON DELETE CASCADE` / `ON DELETE SET NULL`
- **UNIQUE**: email в users, (habit_id, checkin_date) в habit_checkins, name в _manual_migrations
- **CHECK**: type IN ('good', 'bad') в habits, mood_rating >= 1 AND <= 5, operation IN ('INSERT', 'UPDATE', 'DELETE')
- **NOT NULL**: email, password_hash, name, type и др.

### Проверка
```sql
-- Ограничения на таблице habits
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'habits';
```

---

## 3. CRUD-операции и API (20 баллов)

### Требования
- ✅ CRUD через backend-API
- ✅ Базовые операции через ORM (Prisma)
- ✅ Сложные запросы через SQL с JOIN, агрегатами, подзапросами

### Реализация
- **Backend**: NestJS с модулями auth, habits, checkins, tags, reminders, users, reports, batch-import
- **ORM**: Prisma Client для CRUD
- **Эндпойнты**:
  - POST /auth/register, POST /auth/login, GET /auth/me
  - GET/POST/PUT/DELETE /habits
  - GET/POST /checkins
  - GET /reports/user/:userId (сложный SQL с JOIN)
  - POST /batch-import

### Проверка
```bash
# Swagger документация
curl http://localhost:3001/api/docs

# Тест создания привычки
curl -X POST http://localhost:3001/habits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "type": "good"}'
```

---

## 4. Триггеры и функции (10 баллов)

### Требования
- ✅ Триггеры для аудита (INSERT, UPDATE, DELETE)
- ✅ Триггеры для автоматического обновления агрегированных данных
- ✅ Скалярная функция
- ✅ Табличная функция

### Реализация
- **Триггер аудита**: `audit_trigger_fn()` на таблицах habits, habit_checkins, tags, reminders
  - Записывает в audit_log: table_name, operation, old_data, new_data, user_id, changed_at
  - user_id берётся из SET LOCAL app.user_id (устанавливается в Prisma middleware)
- **Триггер агрегатов**: `update_habit_stats()` на habit_checkins
  - Обновляет habit_stats.total_checkins, average_mood, last_checkin_at
- **Скалярная функция**: `calc_completion_rate(user_id, from_date, to_date) RETURNS NUMERIC`
- **Табличная функция**: `report_user_habits(user_id, from_date, to_date) RETURNS TABLE(...)`

### Проверка
```sql
-- Проверка аудита
INSERT INTO habits (user_id, name, type) VALUES (...);
SELECT * FROM audit_log WHERE table_name = 'habits' ORDER BY changed_at DESC LIMIT 1;

-- Проверка агрегатов
INSERT INTO habit_checkins (habit_id, user_id, checkin_date, mood_rating) VALUES (...);
SELECT * FROM habit_stats WHERE habit_id = '...';

-- Вызов функций
SELECT calc_completion_rate('<user_id>', '2024-01-01', '2024-12-31');
SELECT * FROM report_user_habits('<user_id>', '2024-01-01', '2024-12-31');
```

---

## 5. Представления (VIEW) (10 баллов)

### Требования
- ✅ Не менее 3 представлений
- ✅ Агрегированные данные
- ✅ Аналитические отчёты

### Реализация
- **v_user_habit_summary**: сводка по привычкам пользователя (total_habits, good_habits, bad_habits, total_checkins)
- **v_daily_completion**: ежедневная статистика (total_checkins, active_users, avg_mood, total_minutes)
- **v_tag_usage**: использование тегов (usage_count, unique_habits, last_used)

### Проверка
```sql
SELECT * FROM v_user_habit_summary LIMIT 5;
SELECT * FROM v_daily_completion WHERE checkin_date >= CURRENT_DATE - INTERVAL '7 days';
SELECT * FROM v_tag_usage ORDER BY usage_count DESC LIMIT 10;
```

---

## 6. Журнал аудита (5 баллов)

### Требования
- ✅ Фиксация изменений
- ✅ Информативность

### Реализация
- **Таблица audit_log**: id, table_name, operation, record_id, user_id, old_data, new_data, ip_address, changed_at
- **Триггеры**: на habits, habit_checkins, tags, reminders
- **user_id**: из SET LOCAL app.user_id (устанавливается в Prisma middleware через AsyncLocalStorage)

### Проверка
```sql
-- Изменения за последний час
SELECT * FROM audit_log 
WHERE changed_at > NOW() - INTERVAL '1 hour' 
ORDER BY changed_at DESC;

-- Действия конкретного пользователя
SELECT * FROM audit_log 
WHERE user_id = '<user_id>' 
ORDER BY changed_at DESC 
LIMIT 20;
```

---

## 7. Оптимизация и анализ запросов (10 баллов)

### Требования
- ✅ Индексы для полей в WHERE, JOIN, ORDER BY
- ✅ EXPLAIN ANALYZE до/после индексов

### Реализация
- **Индексы**:
  - `idx_habits_user_id ON habits(user_id) WHERE NOT is_archived`
  - `idx_habit_checkins_habit_date ON habit_checkins(habit_id, checkin_date DESC)`
  - `idx_habit_checkins_user_date ON habit_checkins(user_id, checkin_date DESC)`
  - `idx_audit_log_table_op_time ON audit_log(table_name, operation, changed_at DESC)`
  - И др. (см. sql/004_indexes.sql)
- **Анализ**: docs/perf.md с EXPLAIN ANALYZE (минимум 2 запроса до/после)

### Проверка
```bash
# См. docs/perf.md
cat docs/perf.md
```

---

## 8. Батчевая загрузка данных (5 баллов)

### Требования
- ✅ Параметры загрузки
- ✅ Логирование ошибок

### Реализация
- **Эндпойнт**: POST /batch-import
- **Таблицы**: batch_import_jobs, batch_import_errors
- **Логика**: транзакционная загрузка с обработкой ошибок, запись успеха/ошибок

### Проверка
```bash
curl -X POST http://localhost:3001/batch-import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"entity_type": "habits", "data": [...]}'

# Проверка логов
SELECT * FROM batch_import_jobs ORDER BY started_at DESC LIMIT 1;
SELECT * FROM batch_import_errors WHERE job_id = '<job_id>';
```

---

## 9. Интеграция с backend и документация API (10 баллов)

### Требования
- ✅ Backend API (любой язык)
- ✅ CRUD, агрегации, отчёты, batch import
- ✅ Транзакции
- ✅ Swagger/OpenAPI

### Реализация
- **Язык**: TypeScript (NestJS)
- **API**: RESTful API с модулями auth, habits, checkins, tags, reminders, users, reports, batch-import
- **Транзакции**: Prisma.$transaction для операций, изменяющих несколько таблиц
- **Swagger**: http://localhost:3001/api/docs

### Проверка
```bash
# Открыть Swagger UI
open http://localhost:3001/api/docs
```

---

## 10. Пояснительная записка и демонстрация (5 баллов)

### Требования
- ✅ Соответствие ГОСТ 7.32–2017
- ✅ Объём <= 30 страниц
- ✅ Полное описание системы

### Реализация
- **Документация**: docs/requirements-checklist.md (этот файл), docs/schema.md, docs/api.md, docs/perf.md, docs/batch-import.md, docs/security-notes.md
- **README.md**: Quick start, инструкции по запуску

### Проверка
```bash
ls docs/
cat README.md
```

---

## Штрафы и ограничения

### 1. Хранение учётных данных в коде (оценка не выше «3»)
- ✅ **Выполнено**: все секреты в .env, есть .env.example
- ✅ DATABASE_URL, JWT_SECRET не в коде
- ✅ .env в .gitignore

### 2. SQL-инъекции через f-string/конкатенацию (оценка не выше «4»)
- ✅ **Выполнено**: Prisma ORM для CRUD (автоматическая параметризация)
- ✅ Сложные запросы через $queryRaw с параметрами: `$queryRaw\`SELECT ... WHERE id = ${id}\``
- ✅ Prisma middleware: `$executeRaw\`SET LOCAL app.user_id = ${userId}\`` или `set_config()`
- ✅ **НЕТ** конструкций вида: `` `SELECT ... WHERE id = '${id}'` ``

### Проверка отсутствия SQL-инъекций
```bash
# Поиск опасных паттернов в backend
grep -rn "\${" apps/backend/src/ | grep -i "select\|insert\|update\|delete" | grep -v "executeRaw\`"
# Результат: пусто (только параметризованные запросы)
```

### 3. Вайбкодинг (оценка «2–4»)
- ✅ Код понятен и задокументирован
- ✅ Комментарии для всех модулей, функций, триггеров

---

## Объём и наполнение данных

### Требования
- ✅ Крупные таблицы: 500–1000 записей
- ✅ Транзакционные таблицы: >= 5000 записей
- ✅ Реалистичные данные
- ✅ Фиксированный seed для воспроизводимости

### Реализация
- **Seed**: faker.seed(12345)
- **Данные**:
  - 100 users
  - 800 habits (крупная)
  - 10000 habit_checkins (транзакционная)
  - 50 tags
  - 1500 habit_tags
  - 600 reminders

### Проверка
```sql
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'habits', COUNT(*) FROM habits
UNION ALL
SELECT 'habit_checkins', COUNT(*) FROM habit_checkins;
```

---

## Контейнеризация и запуск

### Требования
- ✅ Docker + docker-compose
- ✅ Инструкции по развёртыванию

### Реализация
- **docker-compose.yml**: db (postgres:16), backend (NestJS), frontend (Next.js)
- **Healthcheck**: для БД
- **Инструкции**: README.md с quick start

### Проверка
```bash
docker-compose up -d
docker-compose ps
```

---

## Итоговый чеклист перед защитой

- [ ] 13 таблиц созданы, каждая >= 5 разных типов (см. docs/schema.md)
- [ ] Ограничения: PK, FK (CASCADE), UNIQUE, CHECK, NOT NULL
- [ ] Триггеры работают: аудит + агрегаты
- [ ] Функции работают: скалярная + табличная
- [ ] VIEW работают: 3 представления
- [ ] Индексы созданы
- [ ] Seed: 800 habits, 10000 checkins
- [ ] CRUD API работает через Swagger
- [ ] Отчёты работают (сложные SQL)
- [ ] Batch import работает с логированием
- [ ] Docker compose запускается
- [ ] НЕТ секретов в коде (только .env)
- [ ] НЕТ SQL-конкатенации (только параметризация)
- [ ] Документация полная (docs/)
- [ ] README.md с quick start
- [ ] EXPLAIN ANALYZE в docs/perf.md

---

## Карта соответствия "требование → реализация"

| Требование | Файл/Модуль | Описание |
|------------|-------------|----------|
| 13 таблиц, >= 5 типов | `packages/db/prisma/schema.prisma` | Полная схема БД |
| Ограничения целостности | `schema.prisma` | PK, FK, UNIQUE, CHECK, NOT NULL |
| Триггеры аудита | `packages/db/sql/001_triggers.sql` | audit_trigger_fn() |
| Триггер агрегатов | `packages/db/sql/001_triggers.sql` | update_habit_stats() |
| Скалярная функция | `packages/db/sql/002_functions.sql` | calc_completion_rate() |
| Табличная функция | `packages/db/sql/002_functions.sql` | report_user_habits() |
| VIEW | `packages/db/sql/003_views.sql` | 3 представления |
| Индексы | `packages/db/sql/004_indexes.sql` | 8 индексов |
| Seed | `packages/db/scripts/seed.ts` | faker.seed(12345) |
| Apply SQL | `packages/db/scripts/apply-sql.ts` | Контроль миграций |
| Backend CRUD | `apps/backend/src/*/` | Модули NestJS |
| Prisma middleware | `apps/backend/src/prisma/prisma.service.ts` | SET LOCAL app.user_id |
| Auth | `apps/backend/src/auth/` | JWT, bcrypt |
| Reports | `apps/backend/src/reports/` | Сложные SQL |
| Batch import | `apps/backend/src/batch-import/` | Логирование ошибок |
| Swagger | `apps/backend/src/main.ts` | /api/docs |
| Frontend | `apps/frontend/` | Next.js 15 |
| API client | `apps/frontend/lib/api/client.ts` | Fetch wrapper |
| Docker | `docker-compose.yml` | db + backend + frontend |
| Документация | `docs/` | Полное описание |
