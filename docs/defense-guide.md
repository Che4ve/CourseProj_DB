# Гайд для защиты: соответствие требований реализации

Этот документ сопоставляет каждое требование из задания (см. `courseProjTask.txt`) с конкретной реализацией в репозитории, с указанием кода и шагов для демонстрации.

## 1. Цель работы

Требование: создать полноценную информационную систему с реляционной БД, SQL, триггерами, аудитом и интеграцией с backend.

Где:
- Схема БД и связи: `packages/db/prisma/schema.prisma`
- SQL-объекты (триггеры, функции, представления, индексы): `packages/db/sql/*.sql`
- Backend API (CRUD, отчёты, batch import): `apps/backend/src/*`
- Опциональный фронтенд: `apps/frontend/*`

Как:
- Схема PostgreSQL с 13 таблицами, связями и ограничениями.
- Ручные SQL-миграции применяются через `packages/db/scripts/apply-sql.ts`.
- Backend на NestJS со Swagger-документацией.
- Frontend на Next.js (не обязателен, но присутствует).

Демонстрация:
- Запуск: `docker-compose up -d`
- Swagger: `http://localhost:3001/api/docs`

## 2. Требования к базе данных

### 2.1 Структура

Требование: 9-10 таблиц, связи 1:1, 1:N, N:M, >= 5 атрибутов разных типов, ключевые сущности, журнал аудита.

Где:
- Схема: `packages/db/prisma/schema.prisma`
- ER-диаграмма: `packages/db/prisma/ERD.md`
- Документация схемы: `docs/schema.md`

Как:
- 13 таблиц: users, user_profiles, habits, habit_schedules, habit_checkins, tags, habit_tags, reminders, habit_stats, audit_log, _manual_migrations, batch_import_jobs, batch_import_errors.
- Примеры 1:1:
  - users <-> user_profiles (уникальный user_id).
  - habits <-> habit_stats (уникальный habit_id).
- Примеры 1:N:
  - users -> habits, habit_checkins, batch_import_jobs.
  - habits -> habit_schedules, habit_checkins, habit_tags, reminders.
- Пример N:M:
  - habits <-> tags через habit_tags.
- Ключевые сущности: users, habits, habit_checkins.
- Журнал аудита: таблица audit_log.

Демонстрация:
```sql
-- Список таблиц
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Показать связи (пример для habit_checkins)
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'habit_checkins';
```

### 2.2 Ограничения целостности

Требование: PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, NOT NULL, каскадное обновление/удаление.

Где:
- Базовые ограничения и FK: `packages/db/prisma/migrations/20251221144037_init/migration.sql`
- CHECK-ограничения: `packages/db/prisma/migrations/20251222120000_add_check_constraints/migration.sql`

Как:
- PRIMARY KEY: id UUID во всех таблицах (см. миграцию).
- FOREIGN KEY с каскадом:
  - habits.user_id -> users.id ON DELETE CASCADE.
  - habit_checkins.habit_id -> habits.id ON DELETE CASCADE.
  - batch_import_jobs.user_id -> users.id ON DELETE SET NULL.
- UNIQUE:
  - users.email, tags.name, tags.slug, habit_checkins (habit_id, checkin_date), habit_stats.habit_id.
- CHECK:
  - habits.type IN ('good', 'bad')
  - habits.priority BETWEEN 0 AND 10
  - habit_checkins.mood_rating BETWEEN 1 AND 5 (или NULL)
  - habit_schedules.frequency_type IN ('daily', 'weekly', 'monthly', 'custom')
  - reminders.delivery_method IN ('push', 'email', 'sms')
  - batch_import_jobs.status IN ('processing', 'completed', 'failed')
- NOT NULL: задано в определениях таблиц.

Демонстрация:
```sql
-- Ограничения для habits
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'habits';

-- CHECK-ограничения
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'habits' AND c.contype = 'c';
```

### 2.3 Объём и наполнение

Требование: крупные таблицы 500-1000 записей, транзакционные >= 5000, реалистичные данные, батчевая загрузка с параметрами и логированием ошибок.

Где:
- Скрипт seed: `packages/db/scripts/seed.ts`
- Batch import API и логика: `apps/backend/src/batch-import/*`
- Документация batch import: `docs/batch-import.md`

Как:
- Seed использует faker с фиксированным seed для реалистичных данных.
- Объёмы в seed:
  - users: 100
  - habits: 800 (крупная таблица)
  - habit_checkins: 10000 (транзакционная)
  - tags: 50
  - habit_tags: 1500
  - reminders: 600
- Batch import:
  - Параметры через BatchImportDto (entityType + data).
  - Ошибки пишутся в batch_import_errors.
  - Задачи фиксируются в batch_import_jobs.

Демонстрация:
```sql
-- Проверка объёмов
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'habits', COUNT(*) FROM habits
UNION ALL
SELECT 'habit_checkins', COUNT(*) FROM habit_checkins;
```

## 3. SQL-функциональность

### 3.1 CRUD-операции

Требование: CRUD через backend API, базовые CRUD через ORM, сложные запросы через SQL (JOIN, агрегаты, подзапросы).

Где:
- Контроллеры: `apps/backend/src/*/*.controller.ts`
- Сервисы на Prisma: `apps/backend/src/*/*.service.ts`
- Raw SQL отчёты: `apps/backend/src/reports/reports.service.ts`
- API документация: `docs/api.md`

Как:
- CRUD-модули для habits, checkins, tags, reminders, schedules, users.
- Prisma ORM для create/find/update/delete в сервисах (например, habits service).
- Raw SQL для отчётов и агрегаций в reports service через $queryRaw.

Демонстрация:
```bash
# Swagger UI
open http://localhost:3001/api/docs

# Пример: создать привычку
curl -X POST http://localhost:3001/habits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Read 30 minutes","type":"good","priority":3}'
```

### 3.2 Триггеры и функции

Требование:
- Триггеры аудита на INSERT/UPDATE/DELETE.
- Триггеры для автоматического обновления агрегатов.
- Скалярные и табличные функции.

Где:
- Триггеры: `packages/db/sql/001_triggers.sql`
- Функции: `packages/db/sql/002_functions.sql`
- Применение SQL: `packages/db/scripts/apply-sql.ts`
- Контекст пользователя для аудита: `apps/backend/src/prisma/prisma.service.ts`

Как:
- audit_trigger_fn() пишет в audit_log для habits, habit_checkins, tags, reminders.
- update_habit_stats() обновляет habit_stats после insert/update/delete в habit_checkins.
- calc_completion_rate(...) — скалярная функция.
- report_user_habits(...) — табличная функция.
- app.user_id устанавливается через set_config в Prisma service для корректного user_id в аудите.

Демонстрация:
```sql
-- Аудит
INSERT INTO habits (user_id, name, type) VALUES ('<user_uuid>', 'Demo', 'good');
SELECT * FROM audit_log WHERE table_name = 'habits' ORDER BY changed_at DESC LIMIT 1;

-- Агрегаты
INSERT INTO habit_checkins (habit_id, user_id, checkin_date)
VALUES ('<habit_uuid>', '<user_uuid>', CURRENT_DATE);
SELECT * FROM habit_stats WHERE habit_id = '<habit_uuid>';

-- Функции
SELECT calc_completion_rate('<user_uuid>', '2024-01-01', '2024-12-31');
SELECT * FROM report_user_habits('<user_uuid>', '2024-01-01', '2024-12-31');
```

### 3.3 Представления (VIEW)

Требование: минимум три представления с агрегированными и аналитическими данными.

Где:
- Представления: `packages/db/sql/003_views.sql`

Как:
- v_user_habit_summary
- v_daily_completion
- v_tag_usage

Демонстрация:
```sql
SELECT * FROM v_user_habit_summary LIMIT 5;
SELECT * FROM v_daily_completion ORDER BY checkin_date DESC LIMIT 7;
SELECT * FROM v_tag_usage ORDER BY usage_count DESC LIMIT 10;
```

## 4. Оптимизация и анализ запросов

Требование: индексы для WHERE/JOIN/ORDER BY, показать EXPLAIN ANALYZE до/после.

Где:
- Индексы: `packages/db/sql/004_indexes.sql`
- Результаты EXPLAIN ANALYZE: `docs/perf.md`

Как:
- Индексы на habit_checkins, audit_log, habit_tags, batch_import таблицах и др.
- Сравнение производительности описано в docs/perf.md.

Демонстрация:
```sql
EXPLAIN ANALYZE
SELECT *
FROM habit_checkins
WHERE user_id = '<user_uuid>'
ORDER BY checkin_date DESC
LIMIT 100;
```

## 5. Интеграция с backend

Требование: язык реализации, API обеспечивает CRUD, отчёты, batch import, транзакции, Swagger docs.

Где:
- Backend модули: `apps/backend/src/*`
- Batch import: `apps/backend/src/batch-import/*`
- Отчёты: `apps/backend/src/reports/*`
- Swagger: `apps/backend/src/main.ts`

Как:
- NestJS API с модулями auth, habits, checkins, tags, reminders, schedules, users, reports, batch-import.
- Транзакции через Prisma.$transaction в batch-import сервисе.
- Swagger UI на /api/docs.

Демонстрация:
```bash
open http://localhost:3001/api/docs
```

## 6. Интерфейс пользователя

Требование: полноценный фронтенд не обязателен, но приветствуется.

Где:
- Next.js приложение: `apps/frontend/app/*`
- UI компоненты: `apps/frontend/components/*`
- API клиент: `apps/frontend/lib/api/client.ts`

Как:
- Страницы dashboard для habits, tags, stats, profile.
- Страницы auth для login/signup.

## 7. Контейнеризация и запуск

Требование: Docker и docker-compose для db, backend, frontend; инструкции по развёртыванию.

Где:
- Compose файл: `docker-compose.yml`
- Dockerfile: `apps/backend/Dockerfile`, `apps/frontend/Dockerfile`
- Инструкции: `README.md`, `QUICKSTART.md`, `docs/setup-guide.md`

Демонстрация:
```bash
docker-compose up -d
docker-compose exec backend pnpm db:migrate
docker-compose exec backend pnpm db:sql
docker-compose exec backend pnpm db:seed
```

## 8. Чеклист демонстрации

Требование: показать структуру, CRUD, триггеры и аудит, индексы, batch import, функции и представления.

Рекомендуемый порядок:
1. Структура и связи:
   - Показать `docs/schema.md` или `packages/db/prisma/ERD.md`.
   - Выполнить SQL из разделов 2.1 и 2.2.
2. CRUD:
   - В Swagger создать/обновить/удалить habit и checkin.
3. Сложные SQL:
   - Вызвать отчёты или показать запросы в `apps/backend/src/reports/reports.service.ts`.
4. Триггеры и аудит:
   - Вставить habit и показать запись в audit_log.
   - Вставить checkin и показать обновление habit_stats.
5. Индексы и оптимизация:
   - Открыть `docs/perf.md` и показать EXPLAIN ANALYZE до/после.
6. Batch import:
   - POST /batch-import с одной ошибочной строкой и показать batch_import_errors.
7. Функции и представления:
   - Выполнить calc_completion_rate, report_user_habits и SELECT из VIEW.

## 9. Пояснительная записка

Требование: пояснительная записка по ГОСТ 7.32-2017.

Откуда брать материал:
- Архитектура: `README.md`
- Проектирование БД и ERD: `docs/schema.md`, `packages/db/prisma/ERD.md`
- Таблицы, ограничения, триггеры, функции, view, индексы: `docs/schema.md`, `packages/db/sql/*.sql`
- API и взаимодействие с БД: `docs/api.md`, `apps/backend/src/*`
- Примеры запросов и производительность: `docs/perf.md`
- Batch import: `docs/batch-import.md`
- Контейнеризация и запуск: `docs/setup-guide.md`
- Безопасность: `docs/security-notes.md`

## 10. Маппинг критериев оценки

Краткое соответствие:
- Структура БД: `packages/db/prisma/schema.prisma`, `docs/schema.md`
- Ограничения: `packages/db/prisma/migrations/*`
- CRUD и API: `apps/backend/src/*`
- Триггеры и функции: `packages/db/sql/001_triggers.sql`, `packages/db/sql/002_functions.sql`
- Представления и аналитика: `packages/db/sql/003_views.sql`, `apps/backend/src/reports/*`
- Аудит: таблица audit_log + audit_trigger_fn
- Индексы + EXPLAIN: `packages/db/sql/004_indexes.sql`, `docs/perf.md`
- Batch import: `apps/backend/src/batch-import/*`
- Swagger: `apps/backend/src/main.ts`
- Качество документации: `docs/*`, `README.md`

Для единого чеклиста см. `docs/requirements-checklist.md`.

## 11. Штрафы и ограничения

Требование: не хранить секреты в коде, не собирать SQL через конкатенацию, избегать "вибекодинга".

Где:
- Шаблон env: `ENV_TEMPLATE.txt`
- Git ignore: `.gitignore` (env файлы исключены)
- Безопасный SQL: `apps/backend/src/reports/reports.service.ts`, `apps/backend/src/batch-import/batch-import.service.ts`
- Заметки по безопасности: `docs/security-notes.md`

Как:
- Секреты хранятся в .env (есть шаблон, .env в gitignored).
- Raw SQL через параметризацию Prisma или Prisma.sql.
- DDL SQL применяется только из доверенных файлов.
