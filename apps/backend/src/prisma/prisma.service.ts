import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@repo/db";
import { AsyncLocalStorage } from "async_hooks";

// AsyncLocalStorage для передачи user_id в триггеры
export const asyncLocalStorage = new AsyncLocalStorage<{ userId?: string }>();

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	async onModuleInit() {
		await this.$connect();
	}

	async onModuleDestroy() {
		await this.$disconnect();
	}

	/**
	 * Устанавливает user_id для текущей сессии PostgreSQL
	 * Используется триггерами аудита для записи информации о пользователе
	 * ✅ ПАРАМЕТРИЗОВАННЫЙ запрос - защита от SQL-инъекций
	 */
	async setUserId(userId: string): Promise<void> {
		const store = asyncLocalStorage.getStore();
		if (store?.userId || userId) {
			const id = store?.userId || userId;
			// ✅ ПАРАМЕТРИЗОВАННЫЙ запрос через set_config()
			await this.$executeRaw`SELECT set_config('app.user_id', ${id}, true)`;
		}
	}
}
