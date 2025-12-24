import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@repo/db";
import { mapPrismaError } from "../src/common/filters/prisma-exception.filter";

const clientVersion = "test";

test("maps unique constraint error to 409", () => {
	const error = new Prisma.PrismaClientKnownRequestError("fail", {
		code: "P2002",
		clientVersion,
		meta: { target: ["name"] },
	});

	const result = mapPrismaError(error);
	assert.equal(result.status, 409);
});

test("maps not found error to 404", () => {
	const error = new Prisma.PrismaClientKnownRequestError("missing", {
		code: "P2025",
		clientVersion,
		meta: { cause: "not found" },
	});

	const result = mapPrismaError(error);
	assert.equal(result.status, 404);
});

test("maps validation error to 400", () => {
	const error = new Prisma.PrismaClientValidationError("invalid", {
		clientVersion,
	});

	const result = mapPrismaError(error);
	assert.equal(result.status, 400);
});
