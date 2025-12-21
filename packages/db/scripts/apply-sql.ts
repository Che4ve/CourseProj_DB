import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();
const SQL_DIR = path.join(__dirname, '../sql');

const migrations = [
  '001_triggers.sql',
  '002_functions.sql',
  '003_views.sql',
  '004_indexes.sql'
];

async function applyMigration(filename: string) {
  const filepath = path.join(SQL_DIR, filename);
  const content = await fs.readFile(filepath, 'utf-8');
  const checksum = crypto.createHash('sha256').update(content).digest('hex');
  
  return prisma.$transaction(async (tx) => {
    // Проверяем, применялась ли миграция
    const existing = await tx.$queryRaw<Array<{name: string}>>`
      SELECT name FROM _manual_migrations WHERE name = ${filename}
    `;
    
    if (existing.length > 0) {
      console.log(`⏭️  ${filename} already applied`);
      return;
    }
    
    console.log(`📝 Applying ${filename}...`);
    const startTime = Date.now();
    
    // Применяем SQL (используем $executeRawUnsafe для DDL, т.к. это безопасный контент из файла)
    await tx.$executeRawUnsafe(content);
    
    const executionTime = Date.now() - startTime;
    
    // Записываем в таблицу миграций (ПАРАМЕТРИЗОВАННЫЙ запрос)
    await tx.$executeRaw`
      INSERT INTO _manual_migrations (name, checksum, execution_time_ms, applied_by)
      VALUES (${filename}, ${checksum}, ${executionTime}, 'system')
    `;
    
    console.log(`✅ ${filename} applied in ${executionTime}ms`);
  });
}

async function main() {
  console.log('🔧 Applying manual SQL migrations...\n');
  
  try {
    for (const migration of migrations) {
      await applyMigration(migration);
    }
    
    console.log('\n✅ All migrations applied successfully!');
  } catch (error) {
    console.error('\n❌ Error applying migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


