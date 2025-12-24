---
name: Добавить ApiProperty во все DTO
overview: Добавить декораторы @ApiProperty во все классы DTO, чтобы они отображались в Swagger Schemas. Все контроллеры уже используют классы DTO, поэтому нужно только добавить декораторы.
todos:
  - id: add-api-property-habits
    content: Добавить @ApiProperty в habits/dto/create-habit.dto.ts
    status: pending
  - id: add-api-property-tags
    content: Добавить @ApiProperty в tags/dto/create-tag.dto.ts и update-tag.dto.ts
    status: pending
  - id: add-api-property-checkins
    content: Добавить @ApiProperty в checkins DTO (create-checkin, update-checkin, batch-checkins)
    status: pending
  - id: add-api-property-reminders
    content: Добавить @ApiProperty в reminders DTO (create-reminder, update-reminder)
    status: pending
  - id: add-api-property-schedules
    content: Добавить @ApiProperty в schedules DTO (create-schedule, update-schedule)
    status: pending
  - id: add-api-property-users
    content: Добавить @ApiProperty в users/dto/update-profile.dto.ts
    status: pending
  - id: add-api-property-batch-import
    content: Добавить @ApiProperty в batch-import/dto/batch-import.dto.ts
    status: pending
  - id: add-api-property-reports
    content: Добавить @ApiProperty в reports DTO (daily-stats.query, date-range.query)
    status: pending
---

# Добавление @ApiProperty во все классы DTO для Swagger

## Проблема

В Swagger Schemas отображаются только 3 DTO (RegisterDto, LoginDto, UpdateHabitDto), потому что только у них есть декораторы `@ApiProperty`. Остальные 14 DTO файлов не имеют этих декораторов, поэтому Swagger не может их обнаружить.

## Текущее состояние

- Все контроллеры уже используют классы DTO из папок `dto/` (не интерфейсы)
- Service-файлы также используют классы DTO
- Только 3 DTO имеют `@ApiProperty`: `update-habit.dto.ts`, `login.dto.ts`, `register.dto.ts`

## План изменений

### 1. Habits DTO

- [habits/dto/create-habit.dto.ts](apps/backend/src/habits/dto/create-habit.dto.ts) - добавить `@ApiProperty` для всех полей

### 2. Tags DTO

- [tags/dto/create-tag.dto.ts](apps/backend/src/tags/dto/create-tag.dto.ts) - добавить `@ApiProperty`
- [tags/dto/update-tag.dto.ts](apps/backend/src/tags/dto/update-tag.dto.ts) - добавить `@ApiProperty`

### 3. Checkins DTO

- [checkins/dto/create-checkin.dto.ts](apps/backend/src/checkins/dto/create-checkin.dto.ts) - добавить `@ApiProperty`
- [checkins/dto/update-checkin.dto.ts](apps/backend/src/checkins/dto/update-checkin.dto.ts) - добавить `@ApiProperty`
- [checkins/dto/batch-checkins.dto.ts](apps/backend/src/checkins/dto/batch-checkins.dto.ts) - добавить `@ApiProperty` для `BatchCheckinUpdateDto` и `BatchCheckinsDto`

### 4. Reminders DTO

- [reminders/dto/create-reminder.dto.ts](apps/backend/src/reminders/dto/create-reminder.dto.ts) - добавить `@ApiProperty`
- [reminders/dto/update-reminder.dto.ts](apps/backend/src/reminders/dto/update-reminder.dto.ts) - добавить `@ApiProperty`

### 5. Schedules DTO

- [schedules/dto/create-schedule.dto.ts](apps/backend/src/schedules/dto/create-schedule.dto.ts) - добавить `@ApiProperty`
- [schedules/dto/update-schedule.dto.ts](apps/backend/src/schedules/dto/update-schedule.dto.ts) - добавить `@ApiProperty`

### 6. Users DTO

- [users/dto/update-profile.dto.ts](apps/backend/src/users/dto/update-profile.dto.ts) - добавить `@ApiProperty`

### 7. Batch Import DTO

- [batch-import/dto/batch-import.dto.ts](apps/backend/src/batch-import/dto/batch-import.dto.ts) - добавить `@ApiProperty`

### 8. Reports DTO (Query параметры)

- [reports/dto/daily-stats.query.dto.ts](apps/backend/src/reports/dto/daily-stats.query.dto.ts) - добавить `@ApiProperty`
- [reports/dto/date-range.query.dto.ts](apps/backend/src/reports/dto/date-range.query.dto.ts) - добавить `@ApiProperty`

## Правила добавления @ApiProperty

1. **Импорт**: Добавить `import { ApiProperty } from '@nestjs/swagger';` в начало каждого файла
2. **Обязательные поля**: `required: true` (или не указывать, если поле обязательное)
3. **Опциональные поля**: `required: false`
4. **Примеры значений**: Добавить `example` для каждого поля
5. **Типы и ограничения**: Указать `type`, `enum`, `minimum`, `maximum`, `minLength`, `maxLength` где применимо
6. **Массивы**: Для массивов указать `type: [Type] `или `isArray: true`
7. **Вложенные объекты**: Для вложенных DTO использовать `type: () => ClassName`

## Примеры

### Простое поле

```typescript
@ApiProperty({ example: 'Утренняя зарядка' })
@IsString()
@IsNotEmpty()
name: string;
```



### Опциональное поле

```typescript
@ApiProperty({ example: 'Выполнять упражнения каждое утро', required: false })
@IsOptional()
@IsString()
description?: string;
```



### Enum поле

```typescript
@ApiProperty({ enum: HabitType, example: HabitType.Good })
@IsEnum(HabitType)
type: HabitType;
```



### Числовое поле с ограничениями

```typescript
@ApiProperty({ example: 5, minimum: 0, maximum: 10, required: false })
@IsOptional()
@IsInt()
@Min(0)
@Max(10)
priority?: number;
```



### Массив

```typescript
@ApiProperty({ 
  type: [BatchCheckinUpdateDto],
  example: [{ date: '2024-01-15', completed: true }]
})
@IsArray()
updates: BatchCheckinUpdateDto[];
```



## Результат