import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@repo/db";

type PrismaErrorMapping = {
	status: number;
	message: string;
};

export function mapPrismaError(error: unknown): PrismaErrorMapping {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		switch (error.code) {
			case "P2002":
				return {
					status: HttpStatus.CONFLICT,
					message: "Resource already exists",
				};
			case "P2025":
				return { status: HttpStatus.NOT_FOUND, message: "Resource not found" };
			case "P2000":
			case "P2001":
			case "P2003":
			case "P2011":
			case "P2014":
			case "P2018":
				return {
					status: HttpStatus.BAD_REQUEST,
					message: "Invalid request data",
				};
			default:
				return {
					status: HttpStatus.BAD_REQUEST,
					message: "Database request error",
				};
		}
	}

	if (error instanceof Prisma.PrismaClientValidationError) {
		return { status: HttpStatus.BAD_REQUEST, message: "Invalid request data" };
	}

	if (error instanceof Prisma.PrismaClientUnknownRequestError) {
		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			message: "Database error",
		};
	}

	return {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Unexpected error",
	};
}

@Catch(
	Prisma.PrismaClientKnownRequestError,
	Prisma.PrismaClientValidationError,
	Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();
		const mapping = mapPrismaError(exception);

		response.status(mapping.status).json({
			statusCode: mapping.status,
			message: mapping.message,
			timestamp: new Date().toISOString(),
			path: request?.url ?? "",
		});
	}
}
