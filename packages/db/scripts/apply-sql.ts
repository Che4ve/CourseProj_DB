import { PrismaClient } from "@prisma/client";
import { Client } from "pg";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const prisma = new PrismaClient();
const SQL_DIR = path.join(__dirname, "../sql");

const migrations = [
	"001_triggers.sql",
	"002_functions.sql",
	"003_views.sql",
	"004_indexes.sql",
];

async function applyMigration(filename: string) {
	const filepath = path.join(SQL_DIR, filename);
	const content = await fs.readFile(filepath, "utf-8");
	const checksum = crypto.createHash("sha256").update(content).digest("hex");

	// Проверяем, применялась ли миграция
	const existing = await prisma.$queryRaw<
		Array<{ name: string; checksum: string | null }>
	>`
    SELECT name, checksum FROM _manual_migrations WHERE name = ${filename}
  `;

	if (existing.length > 0 && existing[0]?.checksum === checksum) {
		console.log(`⏭${filename} already applied`);
		return;
	}

	console.log(`Applying ${filename}...`);
	const startTime = Date.now();

	// Используем прямое подключение к PostgreSQL для выполнения DDL
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		await client.connect();

		// Выполняем SQL напрямую (DDL-команды, безопасный контент из файла)
		await client.query(content);

		const executionTime = Date.now() - startTime;

		// Записываем в таблицу миграций через Prisma (ПАРАМЕТРИЗОВАННЫЙ запрос)
		if (existing.length > 0) {
			await prisma.$executeRaw`
        UPDATE _manual_migrations
        SET checksum = ${checksum},
            execution_time_ms = ${executionTime},
            applied_at = NOW(),
            applied_by = 'system',
            status = 'success'
        WHERE name = ${filename}
      `;
		} else {
			await prisma.$executeRaw`
        INSERT INTO _manual_migrations (name, checksum, execution_time_ms, applied_by)
        VALUES (${filename}, ${checksum}, ${executionTime}, 'system')
      `;
		}

		const suffix = existing.length > 0 ? "re-applied" : "applied";
		console.log(`${filename} ${suffix} in ${executionTime}ms`);
	} finally {
		await client.end();
	}
}

async function main() {
	console.log("Applying manual SQL migrations...\n");

	try {
		for (const migration of migrations) {
			await applyMigration(migration);
		}

		console.log("\nAll migrations applied successfully!");
	} catch (error) {
		console.error("\nError applying migrations:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
