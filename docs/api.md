# API Documentation

## Общая информация

- **Base URL**: `http://localhost:3001`
- **Swagger UI**: `http://localhost:3001/api/docs`
- **Формат**: JSON
- **Аутентификация**: JWT Bearer Token

---

## Аутентификация

### POST /auth/register

Регистрация нового пользователя.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

### POST /auth/login

Вход в систему.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### GET /auth/me

Получить информацию о текущем пользователе.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Привычки (Habits)

### GET /habits

Получить список привычек текущего пользователя.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): `good` | `bad`
- `isArchived` (optional): `true` | `false`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Morning Exercise",
    "description": "30 minutes of cardio",
    "type": "good",
    "color": "#6366f1",
    "priority": 5,
    "isArchived": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /habits

Создать новую привычку.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Read 30 minutes",
  "description": "Daily reading habit",
  "type": "good",
  "color": "#8b5cf6",
  "priority": 3
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Read 30 minutes",
  "description": "Daily reading habit",
  "type": "good",
  "color": "#8b5cf6",
  "priority": 3,
  "isArchived": false,
  "displayOrder": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /habits/:id

Получить привычку по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Morning Exercise",
  "description": "30 minutes of cardio",
  "type": "good",
  "color": "#6366f1",
  "priority": 5,
  "isArchived": false,
  "stats": {
    "totalCheckins": 45,
    "currentStreak": 7,
    "longestStreak": 12,
    "completionRate": 85.50,
    "averageMood": 4.2,
    "lastCheckinAt": "2024-01-15"
  }
}
```

### PUT /habits/:id

Обновить привычку.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Morning Exercise Updated",
  "priority": 8,
  "isArchived": false
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Morning Exercise Updated",
  "priority": 8,
  ...
}
```

### DELETE /habits/:id

Удалить привычку.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Отметки выполнения (Checkins)

### GET /checkins

Получить отметки текущего пользователя.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `habitId` (optional): фильтр по привычке
- `from` (optional): дата начала (YYYY-MM-DD)
- `to` (optional): дата окончания (YYYY-MM-DD)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "habitId": "uuid",
    "checkinDate": "2024-01-15",
    "checkinTime": "08:30:00",
    "notes": "Felt great!",
    "moodRating": 5,
    "durationMinutes": 35,
    "createdAt": "2024-01-15T08:30:00.000Z"
  }
]
```

### POST /checkins

Создать отметку выполнения.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "habitId": "uuid",
  "checkinDate": "2024-01-15",
  "notes": "Good session",
  "moodRating": 4,
  "durationMinutes": 30
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "habitId": "uuid",
  "userId": "uuid",
  "checkinDate": "2024-01-15",
  "checkinTime": "08:30:00",
  "notes": "Good session",
  "moodRating": 4,
  "durationMinutes": 30,
  "createdAt": "2024-01-15T08:30:00.000Z"
}
```

### DELETE /checkins/:id

Удалить отметку.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Отчёты (Reports)

### GET /reports/user/:userId

Отчёт по привычкам пользователя за период.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `from`: дата начала (YYYY-MM-DD)
- `to`: дата окончания (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "userId": "uuid",
  "period": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "summary": {
    "totalHabits": 5,
    "totalCheckins": 120,
    "completionRate": 77.42,
    "averageMood": 4.1
  },
  "habits": [
    {
      "habitId": "uuid",
      "habitName": "Morning Exercise",
      "habitType": "good",
      "totalCheckins": 28,
      "completionRate": 90.32,
      "lastCheckin": "2024-01-31"
    }
  ]
}
```

**SQL-запрос (параметризованный):**
```typescript
// В коде используется $queryRaw с параметрами
const result = await prisma.$queryRaw`
  SELECT * FROM report_user_habits(
    ${userId}::uuid,
    ${from}::date,
    ${to}::date
  )
`;
```

### GET /reports/completion-rate/:userId

Расчёт completion rate за период (через SQL-функцию).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `from`: дата начала (YYYY-MM-DD)
- `to`: дата окончания (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "userId": "uuid",
  "period": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "completionRate": 77.42
}
```

---

## Batch Import

### POST /batch-import

Массовая загрузка данных.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "entityType": "habits",
  "data": [
    {
      "name": "Habit 1",
      "type": "good",
      "color": "#6366f1"
    },
    {
      "name": "Habit 2",
      "type": "bad",
      "color": "#f43f5e"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "jobId": "uuid",
  "status": "processing",
  "totalRecords": 2,
  "startedAt": "2024-01-15T10:00:00.000Z"
}
```

### GET /batch-import/:jobId

Получить статус задачи импорта.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "completed",
  "totalRecords": 100,
  "successCount": 98,
  "errorCount": 2,
  "progressPercent": 100.00,
  "startedAt": "2024-01-15T10:00:00.000Z",
  "completedAt": "2024-01-15T10:05:30.000Z"
}
```

### GET /batch-import/:jobId/errors

Получить ошибки импорта.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "rowNumber": 15,
    "recordData": {
      "name": "Invalid Habit",
      "type": "invalid_type"
    },
    "errorMessage": "Invalid habit type: must be 'good' or 'bad'",
    "errorCode": "VALIDATION_ERROR",
    "createdAt": "2024-01-15T10:02:15.000Z"
  }
]
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | OK — успешный запрос |
| 201 | Created — ресурс создан |
| 204 | No Content — ресурс удалён |
| 400 | Bad Request — неверные данные |
| 401 | Unauthorized — не авторизован |
| 403 | Forbidden — нет прав доступа |
| 404 | Not Found — ресурс не найден |
| 409 | Conflict — конфликт данных |
| 500 | Internal Server Error — ошибка сервера |

---

## Примеры использования

### cURL

```bash
# Регистрация
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","fullName":"John Doe"}'

# Вход
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}' \
  | jq -r '.access_token')

# Создание привычки
curl -X POST http://localhost:3001/habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning Run","type":"good"}'

# Получение привычек
curl http://localhost:3001/habits \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript (Fetch API)

```javascript
// Регистрация
const register = async () => {
  const response = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'Pass123!',
      fullName: 'John Doe'
    })
  });
  const data = await response.json();
  return data.access_token;
};

// Получение привычек
const getHabits = async (token) => {
  const response = await fetch('http://localhost:3001/habits', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

---

## Безопасность

### Параметризация SQL

✅ **Правильно** (в коде):
```typescript
// Prisma ORM — автоматическая параметризация
await prisma.habit.findMany({ where: { userId } });

// $queryRaw — параметризованный SQL
await prisma.$queryRaw`SELECT * FROM habits WHERE user_id = ${userId}`;

// Middleware — безопасная установка app.user_id
await this.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
```

❌ **Неправильно** (НЕ используется):
```typescript
// SQL-конкатенация (уязвимо к SQL-инъекциям!)
await prisma.$executeRawUnsafe(`SELECT * FROM habits WHERE user_id = '${userId}'`);
```

### Хранение секретов

✅ **Правильно**:
- JWT_SECRET в `.env`
- DATABASE_URL в `.env`
- `.env` в `.gitignore`

❌ **Неправильно**:
- Секреты в коде
- Секреты в репозитории

---

## Swagger UI

Полная интерактивная документация доступна по адресу:

**http://localhost:3001/api/docs**

![Swagger UI](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

В Swagger UI можно:
- Просмотреть все эндпойнты
- Протестировать запросы
- Увидеть схемы данных
- Авторизоваться (кнопка "Authorize")
