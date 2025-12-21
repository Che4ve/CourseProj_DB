# Security Notes — Заметки по безопасности

## Введение

Данный документ описывает меры безопасности, реализованные в проекте, для соответствия требованиям курсовой работы.

---

## 1. Хранение учётных данных

### ❌ Штраф: оценка не выше «3»

**Требование**: Запрещено хранить пароли, ключи, URI баз данных и иные секреты в исходном коде или репозитории.

### ✅ Реализовано

#### 1.1. Переменные окружения (.env)

Все секреты хранятся в файле `.env`, который **НЕ** включён в репозиторий.

**`.env` (не в git):**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/habit_tracker
JWT_SECRET=your-super-secret-key-change-me-in-production
PORT=3001
```

**`.gitignore`:**
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

#### 1.2. Пример файл (.env.example)

В репозитории есть `.env.example` с **заглушками** (без реальных секретов).

**`.env.example` (в git):**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key-change-me-in-production
PORT=3001
```

#### 1.3. Использование в коде

```typescript
// ✅ Правильно: переменные окружения
const jwtSecret = process.env.JWT_SECRET;
const databaseUrl = process.env.DATABASE_URL;

// ❌ Неправильно: секреты в коде
const jwtSecret = 'my-super-secret-key-123'; // НЕ ДЕЛАЙТЕ ТАК!
```

### Проверка

```bash
# Проверить, что .env не в репозитории
git status

# Проверить, что секреты не в коде
grep -r "postgres:postgres" apps/backend/src/  # Должно быть пусто
grep -r "jwt.*secret.*=" apps/backend/src/ --include="*.ts" | grep -v "process.env"  # Пусто
```

---

## 2. SQL-инъекции

### ❌ Штраф: оценка не выше «4»

**Требование**: Прямое формирование SQL-запросов через f-string или конкатенацию без параметризации считается уязвимым к SQL-инъекциям.

### ✅ Реализовано

#### 2.1. Prisma ORM (автоматическая параметризация)

Prisma Client автоматически параметризует все запросы.

```typescript
// ✅ Правильно: Prisma ORM
const habits = await prisma.habit.findMany({
  where: { userId }  // Автоматически параметризовано
});

// ✅ Правильно: $queryRaw с параметрами
const result = await prisma.$queryRaw`
  SELECT * FROM habits WHERE user_id = ${userId}
`;
```

#### 2.2. Параметризация в middleware

**Prisma middleware для установки `app.user_id` (используется в триггерах аудита):**

```typescript
// ✅ ПРАВИЛЬНО: Параметризация через set_config()
this.$use(async (params, next) => {
  const store = asyncLocalStorage.getStore();
  const userId = store?.userId;
  
  if (userId) {
    // ✅ Параметризованный запрос
    await this.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
  }
  
  return next(params);
});

// ❌ НЕПРАВИЛЬНО: SQL-конкатенация (НЕ используется!)
await this.$executeRawUnsafe(`SET LOCAL app.user_id = '${userId}'`);
```

#### 2.3. Отчёты с параметризацией

```typescript
// ✅ Правильно: $queryRaw с параметрами
async getUserReport(userId: string, from: Date, to: Date) {
  return await this.prisma.$queryRaw`
    SELECT * FROM report_user_habits(
      ${userId}::uuid,
      ${from}::date,
      ${to}::date
    )
  `;
}

// ❌ Неправильно: конкатенация (НЕ используется!)
const query = `SELECT * FROM report_user_habits('${userId}', '${from}', '${to}')`;
await this.prisma.$executeRawUnsafe(query);
```

### Проверка отсутствия SQL-инъекций

```bash
# Поиск опасных паттернов в backend
cd apps/backend/src

# 1. Поиск $executeRawUnsafe с конкатенацией
grep -rn "executeRawUnsafe.*\${" . --include="*.ts"
# Результат: ПУСТО (или только в apply-sql.ts для безопасных DDL из файлов)

# 2. Поиск конкатенации в SQL
grep -rn "SELECT.*\${" . --include="*.ts" | grep -v "executeRaw\`"
# Результат: ПУСТО (только параметризованные запросы)

# 3. Поиск template literals с SQL
grep -rn "\`.*SELECT.*'.*\${" . --include="*.ts"
# Результат: ПУСТО
```

### Исключения

**`apply-sql.ts`** использует `$executeRawUnsafe`, но это **БЕЗОПАСНО**, т.к.:
1. SQL читается из **файлов**, а не от пользователя
2. Применяется только администратором при развёртывании
3. Контролируется через `_manual_migrations` (одноразово)

```typescript
// apply-sql.ts — ИСКЛЮЧЕНИЕ (безопасный контент из файла)
const content = await fs.readFile(filepath, 'utf-8');
await tx.$executeRawUnsafe(content);  // ✅ Безопасно для DDL
```

---

## 3. Аутентификация и авторизация

### 3.1. JWT-токены

**Регистрация и вход:**

```typescript
// Хеширование пароля
const passwordHash = await bcrypt.hash(password, 10);

// Создание токена
const payload = { sub: user.id, email: user.email };
const token = this.jwtService.sign(payload);
```

**Проверка токена:**

```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,  // ✅ Из .env
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}
```

### 3.2. Защита эндпойнтов

```typescript
// Все эндпойнты (кроме /auth) требуют JWT
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  // ...
}
```

### 3.3. AsyncLocalStorage для user_id

**Передача user_id в триггеры аудита:**

```typescript
// auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // ✅ Устанавливаем userId в AsyncLocalStorage
    return asyncLocalStorage.run({ userId: user?.id }, () => {
      return super.canActivate(context);
    });
  }
}

// prisma.service.ts — middleware использует userId из ALS
this.$use(async (params, next) => {
  const store = asyncLocalStorage.getStore();
  const userId = store?.userId;
  
  if (userId) {
    await this.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
  }
  
  return next(params);
});
```

---

## 4. Валидация входных данных

### 4.1. Class-validator

```typescript
// DTO с валидацией
export class CreateHabitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['good', 'bad'])
  type: 'good' | 'bad';

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  priority?: number;
}
```

### 4.2. Global Validation Pipe

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,    // ✅ Удалять неописанные поля
  transform: true,    // ✅ Автоматическое преобразование типов
}));
```

---

## 5. CORS

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

---

## 6. Хеширование паролей

```typescript
// Регистрация
const passwordHash = await bcrypt.hash(password, 10);  // ✅ bcrypt с 10 раундами

// Вход
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Не хранится в БД:**
- ❌ Пароли в открытом виде
- ✅ Только bcrypt hash

---

## 7. Rate Limiting (TODO)

**Рекомендация для production:**

```typescript
// Установить @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,  // 10 запросов в минуту
    }),
  ],
})
export class AppModule {}
```

---

## 8. Логирование (Audit Log)

### 8.1. Триггер аудита

Все изменения в таблицах `habits`, `habit_checkins`, `tags`, `reminders` логируются:

```sql
CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Получаем user_id из SET LOCAL app.user_id
  v_user_id := nullif(current_setting('app.user_id', true), '')::UUID;
  
  INSERT INTO audit_log (table_name, operation, record_id, user_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    v_user_id,  -- ✅ user_id из middleware
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### 8.2. Проверка аудита

```sql
-- Проверить, что user_id записывается
SELECT user_id, operation, table_name, changed_at
FROM audit_log
WHERE table_name = 'habits'
ORDER BY changed_at DESC
LIMIT 10;

-- user_id НЕ должен быть NULL (если запрос через API)
```

---

## 9. Docker Security

### 9.1. Non-root user (TODO)

**Рекомендация для production:**

```dockerfile
# Dockerfile
FROM node:20-alpine

# Создать непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

# ... rest of Dockerfile
```

### 9.2. Secrets в docker-compose

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      JWT_SECRET: ${JWT_SECRET}  # ✅ Из .env хоста
```

---

## 10. Проверка безопасности

### Чек-лист

- [x] **Секреты в .env** (не в коде)
- [x] **.env в .gitignore**
- [x] **Параметризация SQL** (Prisma + $queryRaw)
- [x] **Хеширование паролей** (bcrypt)
- [x] **JWT-токены** (не сессии)
- [x] **Валидация входных данных** (class-validator)
- [x] **CORS** настроен
- [x] **Аудит изменений** (триггер + user_id)
- [x] **AsyncLocalStorage** для user_id
- [ ] **Rate limiting** (TODO для production)
- [ ] **Non-root Docker user** (TODO для production)

### Команды проверки

```bash
# 1. Проверка секретов в коде
grep -rn "postgres:postgres" apps/backend/src/ --include="*.ts"
# Результат: ПУСТО

grep -rn "jwt.*secret.*=" apps/backend/src/ --include="*.ts" | grep -v "process.env"
# Результат: ПУСТО

# 2. Проверка SQL-конкатенации
grep -rn "executeRawUnsafe.*\${" apps/backend/src/ --include="*.ts"
# Результат: ПУСТО (кроме apply-sql.ts с безопасным DDL)

# 3. Проверка .env в .gitignore
cat .gitignore | grep "\.env"
# Результат: .env, .env.local, и т.д.

# 4. Проверка параметризации в middleware
cat apps/backend/src/prisma/prisma.service.ts | grep "executeRaw"
# Результат: должно быть executeRaw` (с параметризацией)
```

---

## Выводы

### ✅ Соответствие требованиям

| Требование | Статус | Комментарий |
|------------|--------|-------------|
| Секреты не в коде | ✅ | Все в .env |
| SQL-параметризация | ✅ | Prisma + $queryRaw |
| Хеширование паролей | ✅ | bcrypt (10 раундов) |
| JWT-токены | ✅ | Аутентификация |
| Валидация данных | ✅ | class-validator |
| Аудит изменений | ✅ | Триггер + user_id |
| CORS | ✅ | Настроен |

### ✅ НЕТ штрафов

- **Секреты в коде** → оценка не выше «3»: **НЕ НАРУШЕНО** ✅
- **SQL-конкатенация** → оценка не выше «4»: **НЕ НАРУШЕНО** ✅

### 📝 Рекомендации для production

1. **Rate limiting** — защита от DDoS
2. **HTTPS** — шифрование трафика
3. **Helmet.js** — HTTP-заголовки безопасности
4. **Non-root Docker user** — ограничение прав
5. **Secrets management** — использовать Vault/AWS Secrets Manager
6. **Audit logs мониторинг** — алерты на подозрительные действия
7. **Регулярное обновление зависимостей** — `pnpm audit`

---

**Дата**: Декабрь 2025  
**Статус безопасности**: ✅ Соответствует требованиям курсовой работы
