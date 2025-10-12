# Habit Tracker

Простое веб-приложение для отслеживания привычек с ежедневным трекингом.

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp env.example .env.local
# Отредактируйте .env.local, добавив ваши Supabase ключи

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## Технологии

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **База данных**: Supabase (PostgreSQL)
- **Авторизация**: Supabase Auth
- **Тестирование**: Vitest

## Функциональность

- Создание, редактирование и удаление привычек
- Ежедневный трекинг выполнения
- Подсчет стриков (последовательных дней)
- Авторизация пользователей

## Настройка Supabase

1. Создайте проект в [Supabase](https://supabase.com)
2. Скопируйте Project URL и anon key в `.env.local`
3. Выполните SQL из `supabase-setup.sql` в Supabase SQL Editor

## Команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для production
npm run start        # Запуск production сборки
npm test             # Запуск тестов
npm run lint         # Проверка кода
```