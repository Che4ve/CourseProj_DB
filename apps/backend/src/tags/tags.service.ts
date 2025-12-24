import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from "@nestjs/common";
import type { Prisma } from "@repo/db";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";

@Injectable()
export class TagsService {
	constructor(private prisma: PrismaService) {}

	private async setAuditUser(
		tx: Prisma.TransactionClient,
		userId: string,
	): Promise<void> {
		await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
	}

	private slugify(value: string): string {
		return value
			.trim()
			.toLowerCase()
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	private async getUniqueSlug(
		baseSlug: string,
		db: Prisma.TransactionClient | PrismaService = this.prisma,
	): Promise<string> {
		const normalized = baseSlug || "tag";
		const candidates = await db.tag.findMany({
			where: {
				OR: [{ slug: normalized }, { slug: { startsWith: `${normalized}-` } }],
			},
			select: { slug: true },
		});

		if (candidates.length === 0) {
			return normalized;
		}

		let hasBase = false;
		let maxSuffix = 0;
		const prefix = `${normalized}-`;

		for (const record of candidates) {
			if (record.slug === normalized) {
				hasBase = true;
				continue;
			}

			if (!record.slug.startsWith(prefix)) {
				continue;
			}

			const suffix = record.slug.slice(prefix.length);
			if (!/^\d+$/.test(suffix)) {
				continue;
			}

			const parsed = Number(suffix);
			if (!Number.isNaN(parsed) && parsed > maxSuffix) {
				maxSuffix = parsed;
			}
		}

		if (!hasBase) {
			return normalized;
		}

		return `${normalized}-${maxSuffix + 1}`;
	}

	private async getOwnedTagIds(userId: string): Promise<string[]> {
		const records = await this.prisma.auditLog.findMany({
			where: {
				tableName: "tags",
				operation: "INSERT",
				userId,
			},
			select: { recordId: true },
		});

		return records
			.map((record) => record.recordId)
			.filter((id): id is string => Boolean(id));
	}

	private async getUserTagIds(userId: string): Promise<{
		allIds: string[];
		ownedIds: Set<string>;
	}> {
		const [ownedIds, usedTags] = await Promise.all([
			this.getOwnedTagIds(userId),
			this.prisma.habitTag.findMany({
				where: { habit: { userId } },
				select: { tagId: true },
			}),
		]);

		const ownedSet = new Set(ownedIds);
		const usedIds = usedTags.map((record) => record.tagId);
		const allIds = Array.from(new Set([...ownedIds, ...usedIds]));

		return { allIds, ownedIds: ownedSet };
	}

	private async isTagCreatedByUser(
		tagId: string,
		userId: string,
	): Promise<boolean> {
		const ownership = await this.prisma.auditLog.findFirst({
			where: {
				tableName: "tags",
				operation: "INSERT",
				recordId: tagId,
				userId,
			},
			select: { id: true },
		});

		return Boolean(ownership);
	}

	private async ensureTagOwnership(
		tagId: string,
		userId: string,
	): Promise<void> {
		if (await this.isTagCreatedByUser(tagId, userId)) {
			return;
		}

		throw new NotFoundException("Tag not found");
	}

	private async ensureTagAccessible(
		tagId: string,
		userId: string,
	): Promise<void> {
		if (await this.isTagCreatedByUser(tagId, userId)) {
			return;
		}

		const used = await this.prisma.habitTag.findFirst({
			where: { tagId, habit: { userId } },
			select: { id: true },
		});

		if (!used) {
			throw new NotFoundException("Tag not found");
		}
	}

	async findAll(userId: string): Promise<any> {
		const { allIds, ownedIds } = await this.getUserTagIds(userId);
		if (allIds.length === 0) {
			return [];
		}

		const tags = await this.prisma.tag.findMany({
			where: { id: { in: allIds } },
			orderBy: { name: "asc" },
		});

		return tags.map((tag) => ({
			...tag,
			isOwned: ownedIds.has(tag.id),
		}));
	}

	async create(userId: string, dto: CreateTagDto): Promise<any> {
		const name = dto.name?.trim();
		if (!name) {
			throw new BadRequestException("Tag name is required");
		}

		const baseSlug = this.slugify(name) || "tag";

		return this.prisma.$transaction(async (tx) => {
			await this.setAuditUser(tx, userId);

			let tag: any;

			for (let attempt = 0; attempt < 2; attempt += 1) {
				const slug = await this.getUniqueSlug(baseSlug, tx);

				try {
					tag = await tx.tag.create({
						data: {
							name,
							slug,
							color: dto.color,
						},
					});
					const ownership = await tx.auditLog.findFirst({
						where: {
							tableName: "tags",
							operation: "INSERT",
							recordId: tag.id,
							userId,
						},
					});

					if (!ownership) {
						await tx.auditLog.create({
							data: {
								tableName: "tags",
								operation: "INSERT",
								recordId: tag.id,
								userId,
								newData: {
									id: tag.id,
									name: tag.name,
									slug: tag.slug,
								},
							},
						});
					}
					break;
				} catch (error) {
					const target = error?.meta?.target;
					const targets = Array.isArray(target) ? target : [];

					if (
						error?.code === "P2002" &&
						targets.includes("slug") &&
						attempt === 0
					) {
						continue;
					}

					if (error?.code === "P2002" && targets.includes("name")) {
						throw new BadRequestException("Tag name already exists");
					}

					throw error;
				}
			}

			if (!tag) {
				throw new BadRequestException("Unable to create tag");
			}

			return { ...tag, isOwned: true };
		});
	}

	async update(id: string, userId: string, dto: UpdateTagDto): Promise<any> {
		await this.ensureTagOwnership(id, userId);

		if (dto.name !== undefined && !dto.name.trim()) {
			throw new BadRequestException("Tag name is required");
		}

		const tag = await this.prisma.$transaction(async (tx) => {
			await this.setAuditUser(tx, userId);

			return tx.tag.update({
				where: { id },
				data: {
					name: dto.name?.trim() ?? undefined,
					color: dto.color ?? undefined,
				},
			});
		});

		return { ...tag, isOwned: true };
	}

	async delete(id: string, userId: string): Promise<any> {
		await this.ensureTagOwnership(id, userId);

		await this.prisma.$transaction(async (tx) => {
			await this.setAuditUser(tx, userId);

			const tag = await tx.tag.findUnique({ where: { id } });
			if (!tag) {
				throw new NotFoundException("Tag not found");
			}

			await tx.tag.delete({ where: { id } });
		});

		return { message: "Tag deleted successfully" };
	}

	async attachTagToHabit(tagId: string, habitId: string, userId: string) {
		const habit = await this.prisma.habit.findFirst({
			where: { id: habitId, userId },
		});

		if (!habit) {
			throw new NotFoundException("Habit not found");
		}

		await this.ensureTagAccessible(tagId, userId);

		const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
		if (!tag) {
			throw new NotFoundException("Tag not found");
		}

		return this.prisma.$transaction(async (tx) => {
			await this.setAuditUser(tx, userId);

			const existing = await tx.habitTag.findUnique({
				where: { habitId_tagId: { habitId, tagId } },
				include: { tag: true },
			});

			if (existing) {
				return existing;
			}

			const created = await tx.habitTag.create({
				data: { habitId, tagId },
				include: { tag: true },
			});

			await tx.tag.update({
				where: { id: tagId },
				data: { usageCount: { increment: 1 } },
			});

			return created;
		});
	}

	async detachTagFromHabit(tagId: string, habitId: string, userId: string) {
		const habit = await this.prisma.habit.findFirst({
			where: { id: habitId, userId },
		});

		if (!habit) {
			throw new NotFoundException("Habit not found");
		}

		const habitTag = await this.prisma.habitTag.findUnique({
			where: { habitId_tagId: { habitId, tagId } },
		});

		if (!habitTag) {
			return { message: "Tag already detached" };
		}

		await this.prisma.$transaction(async (tx) => {
			await this.setAuditUser(tx, userId);

			await tx.habitTag.delete({ where: { id: habitTag.id } });

			const tag = await tx.tag.findUnique({ where: { id: tagId } });
			const nextCount = Math.max(0, (tag?.usageCount ?? 0) - 1);

			await tx.tag.update({
				where: { id: tagId },
				data: { usageCount: nextCount },
			});
		});

		return { message: "Tag detached successfully" };
	}
}
