---
name: План защиты API от некорректных запросов
overview: ""
todos:
  - id: dto-habits
    content: Создать DTO классы с валидацией для Habits (create-habit.dto.ts, update-habit.dto.ts)
    status: pending
  - id: dto-checkins
    content: Создать DTO классы с валидацией для Checkins (create-checkin.dto.ts, update-checkin.dto.ts, batch-checkins.dto.ts)
    status: pending
  - id: dto-tags
    content: Создать DTO классы с валидацией для Tags (create-tag.dto.ts, update-tag.dto.ts)
    status: pending
  - id: dto-batch
    content: Создать DTO с валидацией для Batch Import с ограничением размера массива (max 1000)
    status: pending
  - id: dto-other
    content: Создать DTO для остальных модулей (Schedules, Reminders, Reports, Users)
    status: pending
  - id: validate-params
    content: Добавить ParseUUIDPipe во все контроллеры для валидации UUID параметров
    status: pending
    dependencies:
      - dto-habits
      - dto-checkins
      - dto-tags
  - id: validate-dates
    content: Добавить валидацию дат в параметрах (checkins, reports)
    status: pending
    dependencies:
      - validate-params
  - id: global-exception-filter
    content: Создать AllExceptionsFilter для обработки всех типов ошибок с логированием
    status: pending
  - id: batch-limits
    content: Добавить ограничения и timeout для batch-import (max 1000 записей, 30 сек timeout)
    status: pending
    dependencies:
      - dto-batch
  - id: test-habits
    content: Написать unit-тесты для HabitsService (некорректные данные, чужие ресурсы)
    status: pending
    dependencies:
      - dto-habits
  - id: test-checkins
    content: Написать unit-тесты для CheckinsService (некорректные UUID, даты, диапазоны)
    status: pending
    dependencies:
      - dto-checkins
  - id: test-batch
    content: Написать unit-тесты для BatchImportService (большие массивы, некорректные данные)
    status: pending
    dependencies:
      - dto-batch
      - batch-limits
  - id: test-tags
    content: Написать unit-тесты для TagsService (валидация имен, права доступа)
    status: pending
    dependencies:
      - dto-tags
---

# План защиты API от некорректных запросов

## Цель

Сделать API устойчивым к любым некорректным запросам, чтобы ни один запрос не мог "положить" сервер.

## Текущее состояние

- ✅ Есть ValidationPipe с базовыми настройками
- ✅ Есть PrismaExceptionFilter для ошибок БД
- ✅ Есть JWT авторизация
- ✅ Есть CORS
- ❌ Нет валидации DTO для большинства endpoints (только auth)
- ❌ Нет валидации UUID параметров (кроме checkins)
- ❌ Нет обработки всех типов ошибок (только Prisma)
- ❌ Нет ограничений на размер batch-import
- ❌ Нет unit-тестов для сервисов

## Приоритетный план

### Этап 1: Валидация всех DTO (КРИТИЧНО)

**1.1. Создать DTO классы с валидацией для Habits**

- Файл: `apps/backend/src/habits/dto/create-habit.dto.ts`
- Валидация: `@IsString()`, `@IsNotEmpty()`, `@IsEnum(['good', 'bad'])`, `@IsOptional()`, `@Min(0)`, `@Max(10)` для priority
- Файл: `apps/backend/src/habits/dto/update-habit.dto.ts`
- Обновить `habits.service.ts`: заменить интерфейсы на классы

**1.2. Создать DTO для Checkins**

- Файл: `apps/backend/src/checkins/dto/create-checkin.dto.ts`
- Валидация: `@IsUUID()`, `@IsDateString()`, `@IsOptional()`, `@Min(1)`, `@Max(5)` для moodRating
- Файл: `apps/backend/src/checkins/dto/update-checkin.dto.ts`
- Файл: `apps/backend/src/checkins/dto/batch-checkins.dto.ts`
- Обновить `checkins.service.ts`

**1.3. Создать DTO для Tags**

- Файл: `apps/backend/src/tags/dto/create-tag.dto.ts`
- Валидация: `@IsString()`, `@IsNotEmpty()`, `@MaxLength(100)`
- Файл: `apps/backend/src/tags/dto/update-tag.dto.ts`

**1.4. Создать DTO для Batch Import**

- Файл: `apps/backend/src/batch-import/dto/batch-import.dto.ts`
- Валидация: `@IsEnum(['habits', 'checkins', 'tags'])`, `@IsArray()`, `@ArrayMaxSize(1000)` (ограничение размера)
- Обновить `batch-import.service.ts`

**1.5. Создать DTO для остальных модулей**

- Schedules, Reminders, Reports, Users - аналогично

### Этап 2: Валидация всех параметров (КРИТИЧНО)

**2.1. Добавить ParseUUIDPipe во все контроллеры**

- `habits.controller.ts`: `@Param('id', ParseUUIDPipe)`
- `tags.controller.ts`: `@Param('id', ParseUUIDPipe)`, `@Param('habitId', ParseUUIDPipe)`
- `reminders.controller.ts`: `@Param('habitId', ParseUUIDPipe)`, `@Param('id', ParseUUIDPipe)`
- `schedules.controller.ts`: `@Param('habitId', ParseUUIDPipe)`, `@Param('id', ParseUUIDPipe)`
- `reports.controller.ts`: валидация query параметров `@IsDateString()`, `@IsInt()`
- `batch-import.controller.ts`: `@Param('jobId', ParseUUIDPipe)`

**2.2. Валидация дат в параметрах**

- `checkins.controller.ts`: добавить валидацию `@Param('date')` через кастомный pipe или `@IsDateString()`

### Этап 3: Глобальная обработка ошибок (КРИТИЧНО)

**3.1. Расширить Exception Filter**

- Файл: `apps/backend/src/common/filters/all-exceptions.filter.ts`
- Обрабатывать: `HttpException`, `BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ForbiddenException`
- Обрабатывать: `TypeError`, `ReferenceError` (неожиданные ошибки)
- Логировать все ошибки с контекстом
- Возвращать безопасные сообщения (не раскрывать детали)

**3.2. Обновить main.ts**

- Добавить `AllExceptionsFilter` как глобальный (после PrismaExceptionFilter)

### Этап 4: Защита batch-import (КРИТИЧНО)

**4.1. Ограничения в DTO**

- Максимальный размер массива: 1000 записей
- Максимальный размер JSON: проверка в контроллере

**4.2. Timeout для долгих операций**

- Добавить timeout в `batch-import.service.ts` (30 секунд)
- Обработка timeout ошибок

### Этап 5: Unit-тесты критичных сервисов

**5.1. Тесты HabitsService**

- Файл: `apps/backend/test/habits.service.spec.ts`
- Тесты: создание с некорректными данными, обновление чужой привычки, удаление несуществующей

**5.2. Тесты CheckinsService**

- Файл: `apps/backend/test/checkins.service.spec.ts`
- Тесты: создание с некорректным UUID, некорректная дата, moodRating вне диапазона

**5.3. Тесты BatchImportService**

- Файл: `apps/backend/test/batch-import.service.spec.ts`
- Тесты: слишком большой массив, некорректный entityType, некорректные данные в записях

**5.4. Тесты TagsService**

- Файл: `apps/backend/test/tags.service.spec.ts`
- Тесты: создание с пустым именем, слишком длинное имя, обновление чужого тега

## Порядок выполнения

1. **Этап 1** (DTO) - основа для всех остальных
2. **Этап 2** (Параметры) - защита от некорректных UUID и дат
3. **Этап 3** (Ошибки) - гарантия, что сервер не упадет
4. **Этап 4** (Batch) - защита от перегрузки
5. **Этап 5** (Тесты) - проверка, что все работает

## Ожидаемый результат

- Все запросы с некорректными данными возвращают 400 с понятным сообщением
- Некорректные UUID возвращают 400 автоматически
- Сервер никогда не падает с необработанной ошибкой