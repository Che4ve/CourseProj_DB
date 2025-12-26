# Setup Guide - Руководство по установке

## Быстрый старт

### 1. Установка зависимостей

```bash
# Установить pnpm (если не установлен)
npm install -g pnpm

# Установить зависимости проекта
pnpm install
```

### 2. Настройка окружения

```bash
# Запустить скрипт настройки
./setup-env.sh

# Или создать вручную
cp .env.example .env
# Отредактировать .env и установить JWT_SECRET
```

### 3. Запуск базы данных

```bash
# Запустить PostgreSQL в Docker
docker-compose up -d db

# Дождаться готовности БД (5-10 секунд)
```

### 4. Инициализация базы данных

```bash
# Сгенерировать Prisma Client
pnpm db:generate

# Применить Prisma миграции
pnpm db:migrate

# Применить SQL миграции (триггеры, функции, views, индексы)
pnpm db:sql

# Заполнить БД тестовыми данными
pnpm db:seed
```

### 5. Запуск приложения

#### Вариант A: Локальная разработка

```bash
# Терминал 1: Backend
pnpm backend:dev

# Терминал 2: Frontend
pnpm frontend:dev
```

#### Вариант B: Docker Compose

```bash
# Запустить все сервисы
docker-compose up -d

# Применить миграции
docker-compose exec backend pnpm db:migrate
docker-compose exec backend pnpm db:sql
docker-compose exec backend pnpm db:seed

# Просмотр логов
docker-compose logs -f
```

### 6. Проверка

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api/docs
- Prisma Studio: `pnpm db:studio`

## Переменные окружения

### Локальная разработка

**Root `.env`:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit_tracker?schema=public"
JWT_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
```

**`apps/frontend/.env`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production
```

**`apps/backend/.env`:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit_tracker?schema=public"
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
```

### Docker Compose

В `docker-compose.yml` переменные уже настроены. Для frontend используется:

```yaml
NEXT_PUBLIC_API_URL=http://backend:3001  # Имя сервиса, не localhost!
```

## Структура команд

### База данных

```bash
pnpm db:generate    # Генерация Prisma Client
pnpm db:migrate     # Применить Prisma миграции
pnpm db:sql         # Применить SQL миграции
pnpm db:seed        # Заполнить БД тестовыми данными
pnpm db:studio      # Открыть Prisma Studio
pnpm db:push        # Push schema без миграций (dev only)
```

### Разработка

```bash
pnpm dev            # Запустить все в dev режиме (turbo)
pnpm backend:dev    # Только backend
pnpm frontend:dev   # Только frontend
```

### Сборка

```bash
pnpm build          # Собрать все проекты
pnpm backend:build  # Только backend
pnpm frontend:build # Только frontend
```

### Линтинг и форматирование

```bash
pnpm lint           # Проверить код
pnpm lint:fix       # Исправить проблемы
pnpm format         # Форматировать код
pnpm format:check   # Проверить форматирование
pnpm check          # Полная проверка (lint + format)
pnpm check:fix      # Исправить всё
```

### Docker

```bash
pnpm docker:up      # Запустить docker-compose
pnpm docker:down    # Остановить docker-compose
pnpm docker:logs    # Просмотр логов
pnpm docker:clean   # Очистить volumes
```

## Troubleshooting

### Проблема: "Cannot connect to database"

**Решение:**
```bash
# Проверить, что PostgreSQL запущен
docker ps | grep postgres

# Перезапустить БД
docker-compose restart db

# Проверить логи
docker-compose logs db
```

### Проблема: "Prisma Client not generated"

**Решение:**
```bash
pnpm db:generate
```

### Проблема: "Port 3000/3001 already in use"

**Решение:**
```bash
# Найти процесс
lsof -i :3000
lsof -i :3001

# Убить процесс
kill -9 <PID>

# Или изменить порт в .env
```

### Проблема: "JWT verification failed"

**Решение:**
```bash
# Убедиться, что JWT_SECRET одинаковый в backend и frontend
# Очистить cookies и войти заново
```

### Проблема: "CORS error"

**Решение:**
```bash
# Проверить NEXT_PUBLIC_API_URL
# Для локальной разработки: http://localhost:3001
# Для Docker: http://backend:3001
```

### Проблема: "Migrations failed"

**Решение:**
```bash
# Сбросить БД (ОСТОРОЖНО: удалит все данные!)
docker-compose down -v
docker-compose up -d db
pnpm db:migrate
pnpm db:sql
pnpm db:seed
```

## Первый запуск

### Создание пользователя

1. Открыть http://localhost:3000/signup
2. Зарегистрироваться с email и паролем
3. Автоматический вход после регистрации

### Создание привычки

1. На главной странице нажать "Создать привычку"
2. Ввести название и выбрать тип (хорошая/плохая)
3. Сохранить

### Отметка выполнения

1. Нажать на дату в календаре привычки
2. Отметка сохраняется автоматически
3. Можно отменить, нажав повторно

## Тестовые данные

После `pnpm db:seed` будут созданы:

- 100 пользователей (email: `user1@example.com` - `user100@example.com`, password: `password123`)
- 800 привычек
- 10000 отметок выполнения
- 50 тегов
- 1500 связей привычка-тег
- 600 напоминаний

Можно войти под любым тестовым пользователем для проверки.

## Swagger API

После запуска backend:

1. Открыть http://localhost:3001/api/docs
2. Нажать "Authorize"
3. Войти через `/auth/login` и скопировать `accessToken`
4. Вставить токен в поле авторизации
5. Тестировать эндпойнты

## Prisma Studio

Визуальный редактор БД:

```bash
pnpm db:studio
```

Откроется http://localhost:5555 с интерфейсом для просмотра и редактирования данных.

## Production Deployment

### Подготовка

1. Изменить `JWT_SECRET` на случайную строку:
   ```bash
   openssl rand -base64 32
   ```

2. Настроить DATABASE_URL на production БД

3. Установить NODE_ENV=production

### Docker Production

```bash
# Собрать образы
docker-compose build

# Запустить в production режиме
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Применить миграции
docker-compose exec backend pnpm db:migrate
docker-compose exec backend pnpm db:sql
```

### Безопасность

- ✅ Изменить JWT_SECRET
- ✅ Использовать HTTPS
- ✅ Настроить CORS для production домена
- ✅ Включить rate limiting
- ✅ Настроить логирование
- ✅ Регулярные бэкапы БД

## Мониторинг

### Логи

```bash
# Backend логи
docker-compose logs -f backend

# Frontend логи
docker-compose logs -f frontend

# БД логи
docker-compose logs -f db
```

### Здоровье сервисов

```bash
# Backend health check
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000
```

## Обновление зависимостей

```bash
# Проверить устаревшие пакеты
pnpm outdated

# Обновить все
pnpm update

# Обновить конкретный пакет
pnpm update <package-name>
```

## Backup и Restore

### Backup

```bash
# Backup БД
docker-compose exec db pg_dump -U postgres habit_tracker > backup.sql

# Или через docker
docker exec <container-id> pg_dump -U postgres habit_tracker > backup.sql
```

### Restore

```bash
# Restore БД
docker-compose exec -T db psql -U postgres habit_tracker < backup.sql
```

## Полезные ссылки

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Docker Docs](https://docs.docker.com)







