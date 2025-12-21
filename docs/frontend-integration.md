# Frontend Integration Guide

## Обзор

Frontend приложение полностью интегрировано с NestJS backend API. Прямой доступ к Supabase удалён, все операции выполняются через REST API.

## Архитектура

### Аутентификация

1. **JWT Tokens**: Backend выдаёт JWT токены при регистрации/входе
2. **HTTP-only Cookies**: Токены хранятся в secure cookies (защита от XSS)
3. **Middleware**: Next.js middleware проверяет токены БЕЗ сетевых вызовов (используя `jose.jwtVerify`)

### API Клиенты

#### Client-side API (`lib/api/client.ts`)

Используется в клиентских компонентах для прямых вызовов из браузера:

```typescript
import { authApi, habitsApi, checkinsApi } from '@/lib/api/client';

// Пример использования
const response = await authApi.login({ email, password });
const habits = await habitsApi.getAll();
```

#### Server-side API (`lib/auth/server-api.ts`)

Используется в Server Components и Server Actions:

```typescript
import { serverAuthApi, serverHabitsApi, serverCheckinsApi } from '@/lib/auth/server-api';

// Пример использования
const user = await serverAuthApi.getMe();
const habits = await serverHabitsApi.getAll();
```

## Компоненты

### Server Components

- `app/(dashboard)/page.tsx` - главная страница, получает данные пользователя
- `components/habits/HabitList.tsx` - список привычек

### Client Components

- `components/habits/HabitCard.tsx` - карточка привычки
- `components/habits/HabitForm.tsx` - форма создания/редактирования
- `components/auth/LoginForm.tsx` - форма входа
- `components/auth/SignupForm.tsx` - форма регистрации

### Server Actions

- `app/actions/authActions.ts` - регистрация, вход, выход
- `app/actions/habitActions.ts` - CRUD операции с привычками
- `app/actions/completionActions.ts` - отметки выполнения

## Middleware

`middleware.ts` выполняет быструю проверку аутентификации:

```typescript
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  
  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }
  
  // Редиректы на основе статуса аутентификации
}
```

**Важно**: Middleware НЕ делает сетевых вызовов к backend, только локальная проверка JWT.

## Cookie Management

`lib/auth/cookies.ts` управляет JWT токенами:

```typescript
// Установить токен после логина
await setAccessToken(token);

// Получить токен для API вызовов
const token = await getAccessToken();

// Очистить токен при выходе
await clearAccessToken();
```

## Переменные окружения

### Локальная разработка

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production
```

### Docker Compose

```bash
NEXT_PUBLIC_API_URL=http://backend:3001
JWT_SECRET=your-secret-key-change-in-production
```

## Потоки данных

### Регистрация/Вход

1. Пользователь заполняет форму
2. Server Action (`authActions.ts`) отправляет POST запрос к `/auth/register` или `/auth/login`
3. Backend возвращает JWT токен
4. Server Action сохраняет токен в HTTP-only cookie
5. Редирект на главную страницу

### Получение данных

1. Server Component вызывает Server Action
2. Server Action использует `serverHabitsApi` с токеном из cookie
3. Backend проверяет JWT и возвращает данные
4. Данные рендерятся на сервере

### Обновление данных

1. Client Component вызывает Server Action
2. Server Action использует `serverHabitsApi` для обновления
3. `revalidateTag()` инвалидирует кэш Next.js
4. Страница автоматически обновляется

## Безопасность

### Защита от XSS

- JWT токены в HTTP-only cookies (недоступны для JavaScript)
- Все пользовательские данные экранируются React

### Защита от CSRF

- SameSite cookies
- Backend проверяет Origin header

### Защита от SQL Injection

- Все запросы параметризованы
- Prisma ORM для безопасных запросов
- Raw SQL только с `$queryRaw` и плейсхолдерами

## Обработка ошибок

### API Errors

```typescript
try {
  await habitsApi.create(data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  }
}
```

### Server Actions

```typescript
export async function createHabit(formData: FormData) {
  try {
    await serverHabitsApi.create(data);
  } catch (error) {
    console.error('Error creating habit:', error);
    throw new Error('Не удалось создать привычку');
  }
}
```

## Кэширование

Next.js автоматически кэширует результаты Server Actions:

```typescript
// Инвалидация кэша после изменений
revalidateTag('habits-list');
revalidateTag(`habit-${id}`);
```

## Типы данных

Общие типы в `lib/typeDefinitions.ts`:

```typescript
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: 'good' | 'bad';
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
}
```

## Тестирование

### Локальная разработка

1. Запустить backend: `pnpm backend:dev`
2. Запустить frontend: `pnpm frontend:dev`
3. Открыть http://localhost:3000

### Docker

1. Запустить все сервисы: `docker-compose up -d`
2. Применить миграции: `docker-compose exec backend pnpm db:migrate`
3. Открыть http://localhost:3000

## Troubleshooting

### 401 Unauthorized

- Проверить, что JWT_SECRET одинаковый в backend и frontend
- Проверить, что токен не истёк (срок действия 7 дней)
- Очистить cookies и войти заново

### CORS Errors

- Проверить, что NEXT_PUBLIC_API_URL правильный
- Проверить CORS настройки в backend (`main.ts`)

### Connection Refused

- Проверить, что backend запущен
- Проверить, что NEXT_PUBLIC_API_URL указывает на правильный хост/порт
- В Docker: использовать имя сервиса (`http://backend:3001`)

## Дальнейшие улучшения

1. **React Query**: Добавить для кэширования и оптимистичных обновлений
2. **WebSockets**: Реал-тайм обновления через Socket.io
3. **Offline Support**: Service Worker для работы офлайн
4. **Optimistic UI**: Мгновенное обновление UI до ответа сервера
5. **Error Boundaries**: Глобальная обработка ошибок
6. **Loading States**: Скелетоны и индикаторы загрузки
7. **Toast Notifications**: Уведомления об успехе/ошибках


