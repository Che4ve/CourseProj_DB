import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Max,
	Min,
} from "class-validator";
import { HabitType } from "./create-habit.dto";

export class UpdateHabitDto {
	@ApiProperty({ example: "Утренняя зарядка", required: false })
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string;

	@ApiProperty({ example: "Выполнять упражнения каждое утро", required: false })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({ enum: HabitType, example: HabitType.Good, required: false })
	@IsOptional()
	@IsEnum(HabitType)
	type?: HabitType;

	@ApiProperty({ example: 5, minimum: 0, maximum: 10, required: false })
	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(10)
	priority?: number;

	@ApiProperty({ example: false, required: false })
	@IsOptional()
	@IsBoolean()
	isArchived?: boolean;
}
