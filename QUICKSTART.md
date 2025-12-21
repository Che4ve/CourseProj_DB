# 🚀 Quick Start Guide

## Шаг 1: Установка зависимостей

```bash
# Убедитесь что установлен pnpm
npm install -g pnpm@9

# Установить зависимости
pnpm install
```

## Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Скопировать шаблон
cp ENV_TEMPLATE.txt .env

# Отредактировать (ОБЯЗАТЕЛЬНО измените JWT_SECRET!)
nano .env
```

**Минимальный .env:**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/habit_tracker
JWT_SECRET=your-super-secret-jwt-key-change-me-please
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001
```

## Шаг 3: Запуск через Docker (РЕКОМЕНДУЕТСЯ)

```bash
# Запустить все сервисы
pnpm docker:up

# Дождаться запуска БД (5-10 секунд), затем:

# Применить Prisma миграции
pnpm db:migrate

# Применить SQL-объекты (триггеры, функции, VIEW, индексы)
pnpm db:sql

# Заполнить БД тестовыми данными
pnpm db:seed
```

**Сервисы будут доступны:**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:3001
- 📚 Swagger docs: http://localhost:3001/api/docs
- 🗄️ PostgreSQL: localhost:5432

## Шаг 4: Локальная разработка (БЕЗ Docker)

```bash
# Терминал 1: База данных
docker run -d \
  --name habit_tracker_db \
  -e POSTGRES_DB=habit_tracker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# Применить миграции и заполнить БД
pnpm db:migrate
pnpm db:sql
pnpm db:seed

# Терминал 2: Backend
pnpm dev:backend

# Терминал 3: Frontend
pnpm dev:frontend
```

## Шаг 5: Проверка работоспособности

### 5.1. Swagger UI

Откройте http://localhost:3001/api/docs

### 5.2. Регистрация через API

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "fullName": "Test User"
  }'
```

### 5.3. Проверка данных в БД

```bash
# Подключиться к БД
docker exec -it habit_tracker_db psql -U postgres -d habit_tracker

# Проверить количество записей
SELECT 
  'users' as table_name, COUNT(*) FROM users
UNION ALL
  SELECT 'habits', COUNT(*) FROM habits
UNION ALL
  SELECT 'habit_checkins', COUNT(*) FROM habit_checkins;

# Выход
\q
```

**Ожидаемые результаты:**
- users: 100
- habits: ~800
- habit_checkins: ~10000

### 5.4. Проверка триггеров

```sql
-- Проверить аудит-лог
SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 5;

-- Проверить агрегаты
SELECT * FROM habit_stats LIMIT 5;

-- Проверить VIEW
SELECT * FROM v_user_habit_summary LIMIT 5;

-- Проверить функции
SELECT * FROM report_user_habits(
  (SELECT id FROM users LIMIT 1),
  '2024-01-01'::date,
  '2024-12-31'::date
);
```

## Полезные команды

### База данных

```bash
pnpm db:generate      # Генерация Prisma Client
pnpm db:migrate       # Применить Prisma миграции
pnpm db:sql           # Применить SQL (триггеры, функции, VIEW, индексы)
pnpm db:seed          # Заполнить БД тестовыми данными
```

### Docker

```bash
pnpm docker:up        # Запустить контейнеры
pnpm docker:down      # Остановить контейнеры
pnpm docker:logs      # Просмотр логов
pnpm docker:clean     # Удалить контейнеры + volumes
```

### Разработка

```bash
pnpm dev              # Запустить всё (frontend + backend)
pnpm dev:frontend     # Только frontend
pnpm dev:backend      # Только backend
pnpm build            # Собрать всё
```

### Линтинг и форматирование

```bash
pnpm lint             # Проверка кода
pnpm format           # Форматирование
pnpm check:fix        # Исправить проблемы
```

## Возможные проблемы

### Проблема: "Port 5432 already in use"

**Решение:** Остановите другой PostgreSQL:

```bash
# Найти процесс
lsof -i :5432

# Остановить контейнер
docker stop $(docker ps -q --filter ancestor=postgres)
```

### Проблема: "Failed to connect to database"

**Решение:** Дождитесь запуска БД (5-10 секунд после `docker:up`)

```bash
# Проверить статус
docker-compose ps

# Проверить логи БД
docker-compose logs db
```

### Проблема: "Prisma Client not generated"

**Решение:**

```bash
pnpm db:generate
```

### Проблема: "Cannot find module '@repo/db'"

**Решение:**

```bash
# Переустановить зависимости
pnpm install

# Сгенерировать Prisma Client
cd packages/db && pnpm db:generate
```

## Следующие шаги

1. ✅ Ознакомьтесь с документацией в `docs/`
2. ✅ Откройте Swagger UI: http://localhost:3001/api/docs
3. ✅ Проверьте схему БД: `docs/schema.md`
4. ✅ Изучите анализ производительности: `docs/perf.md`
5. ✅ Попробуйте batch import: `docs/batch-import.md`

## Нужна помощь?

- 📚 Полная документация: `README.md`
- 📊 Схема БД: `docs/schema.md`
- 🔌 API: `docs/api.md` или http://localhost:3001/api/docs
- ⚡ Производительность: `docs/perf.md`
- 🔒 Безопасность: `docs/security-notes.md`

