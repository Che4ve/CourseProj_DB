import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BatchCheckinsDto } from "./dto/batch-checkins.dto";
import { CreateCheckinDto } from "./dto/create-checkin.dto";
import { UpdateCheckinDto } from "./dto/update-checkin.dto";

@Injectable()
export class CheckinsService {
	constructor(private prisma: PrismaService) {}

	private static readonly MAX_LIMIT = 365;

	async create(userId: string, dto: CreateCheckinDto) {
		// Проверяем, что привычка принадлежит пользователю
		const habit = await this.prisma.habit.findFirst({
			where: { id: dto.habitId, userId },
			select: { id: true },
		});

		if (!habit) {
			throw new NotFoundException("Habit not found");
		}

		// Parse date if provided as string
		let checkinDate = dto.checkinDate ? new Date(dto.checkinDate) : undefined;
		if (!checkinDate && dto.date) {
			checkinDate = new Date(dto.date);
		}
		if (!checkinDate) {
			checkinDate = new Date();
		}

		// Try to create, but ignore if already exists (idempotency)
		try {
			return await this.prisma.habitCheckin.create({
				data: {
					habitId: dto.habitId,
					userId,
					checkinDate,
					notes: dto.notes,
					moodRating: dto.moodRating,
					durationMinutes: dto.durationMinutes,
				},
			});
		} catch (error) {
			// If unique constraint violation, return existing record
			if (error.code === "P2002") {
				return this.prisma.habitCheckin.findFirst({
					where: {
						habitId: dto.habitId,
						userId,
						checkinDate,
					},
				});
			}
			throw error;
		}
	}

	async findByHabit(habitId: string, userId: string, limit = 30) {
		// Проверяем, что привычка принадлежит пользователю
		const habit = await this.prisma.habit.findFirst({
			where: { id: habitId, userId },
			select: { id: true },
		});

		if (!habit) {
			throw new NotFoundException("Habit not found");
		}

		const normalizedLimit = Number.isFinite(limit) ? limit : 30;
		const safeLimit = Math.min(
			Math.max(normalizedLimit, 1),
			CheckinsService.MAX_LIMIT,
		);

		return this.prisma.habitCheckin.findMany({
			where: { habitId },
			orderBy: { checkinDate: "desc" },
			take: safeLimit,
		});
	}

	async delete(id: string, userId: string) {
		const checkin = await this.prisma.habitCheckin.findFirst({
			where: { id, userId },
		});

		if (!checkin) {
			throw new NotFoundException("Checkin not found");
		}

		await this.prisma.habitCheckin.delete({
			where: { id },
		});

		return { message: "Checkin deleted successfully" };
	}

	async deleteByHabitAndDate(habitId: string, date: string, userId: string) {
		// Проверяем, что привычка принадлежит пользователю
		const habit = await this.prisma.habit.findFirst({
			where: { id: habitId, userId },
			select: { id: true },
		});

		if (!habit) {
			throw new NotFoundException("Habit not found");
		}

		// Parse date string (YYYY-MM-DD)
		const checkinDate = new Date(date);

		// Delete checkin if exists (idempotent)
		const result = await this.prisma.habitCheckin.deleteMany({
			where: {
				habitId,
				userId,
				checkinDate,
			},
		});

		return {
			message: "Checkin deleted successfully",
			deletedCount: result.count,
		};
	}

	async updateByHabitAndDate(
		habitId: string,
		date: string,
		userId: string,
		dto: UpdateCheckinDto,
	) {
		const habit = await this.prisma.habit.findFirst({
			where: { id: habitId, userId },
			select: { id: true },
		});

		if (!habit) {
			throw new NotFoundException("Habit not found");
		}

		const checkinDate = new Date(date);
		const existing = await this.prisma.habitCheckin.findFirst({
			where: {
				habitId,
				userId,
				checkinDate,
			},
		});

		if (!existing) {
			return this.prisma.habitCheckin.create({
				data: {
					habitId,
					userId,
					checkinDate,
					notes: dto.notes ?? null,
					moodRating: dto.moodRating ?? null,
					durationMinutes: dto.durationMinutes ?? null,
				},
			});
		}

		return this.prisma.habitCheckin.update({
			where: { id: existing.id },
			data: {
				notes: dto.notes !== undefined ? dto.notes : undefined,
				moodRating: dto.moodRating !== undefined ? dto.moodRating : undefined,
				durationMinutes:
					dto.durationMinutes !== undefined ? dto.durationMinutes : undefined,
			},
		});
	}

	async updateBatchByHabit(
		habitId: string,
		userId: string,
		dto: BatchCheckinsDto,
	): Promise<Array<{ date: string; completed: boolean; ok: boolean }>> {
		if (!dto || !Array.isArray(dto.updates)) {
			return [];
		}

		const habit = await this.prisma.habit.findFirst({
			where: { id: habitId, userId },
			select: { id: true },
		});

		if (!habit) {
			throw new NotFoundException("Habit not found");
		}

		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		const results: Array<{ date: string; completed: boolean; ok: boolean }> =
			[];
		const validIndexes: number[] = [];
		const dedupedUpdates = new Map<
			string,
			{ completed: boolean; checkinDate: Date }
		>();

		dto.updates.forEach((update) => {
			const dateValue = update?.date;
			const date = typeof dateValue === "string" ? dateValue : "";

			let completedValue: boolean | null = null;
			if (typeof update?.completed === "boolean") {
				completedValue = update.completed;
			} else if (typeof update?.completed === "string") {
				if (update.completed === "true") {
					completedValue = true;
				} else if (update.completed === "false") {
					completedValue = false;
				}
			} else if (typeof update?.completed === "number") {
				if (update.completed === 1) {
					completedValue = true;
				} else if (update.completed === 0) {
					completedValue = false;
				}
			}

			if (completedValue === null) {
				results.push({ date, completed: false, ok: false });
				return;
			}

			if (!dateRegex.test(date)) {
				results.push({ date, completed: completedValue, ok: false });
				return;
			}

			const checkinDate = new Date(date);
			if (Number.isNaN(checkinDate.getTime())) {
				results.push({ date, completed: completedValue, ok: false });
				return;
			}

			results.push({ date, completed: completedValue, ok: true });
			validIndexes.push(results.length - 1);
			dedupedUpdates.set(date, { completed: completedValue, checkinDate });
		});

		if (dedupedUpdates.size === 0) {
			return results;
		}

		const toCreate = Array.from(dedupedUpdates.entries())
			.filter(([, entry]) => entry.completed)
			.map(([, entry]) => ({
				habitId,
				userId,
				checkinDate: entry.checkinDate,
			}));

		const toDeleteDates = Array.from(dedupedUpdates.entries())
			.filter(([, entry]) => !entry.completed)
			.map(([, entry]) => entry.checkinDate);

		try {
			await this.prisma.$transaction(async (tx) => {
				await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;

				if (toCreate.length > 0) {
					await tx.habitCheckin.createMany({
						data: toCreate,
						skipDuplicates: true,
					});
				}

				if (toDeleteDates.length > 0) {
					await tx.habitCheckin.deleteMany({
						where: {
							habitId,
							userId,
							checkinDate: { in: toDeleteDates },
						},
					});
				}
			});
		} catch {
			validIndexes.forEach((index) => {
				results[index].ok = false;
			});
		}

		return results;
	}
}
