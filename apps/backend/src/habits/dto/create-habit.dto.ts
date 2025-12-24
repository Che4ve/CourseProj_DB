import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export enum HabitType {
  Good = 'good',
  Bad = 'bad',
}

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning run' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Run 5km before work', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: HabitType, example: HabitType.Good })
  @IsEnum(HabitType)
  type: HabitType;

  @ApiProperty({ example: '#3B82F6', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 5, minimum: 0, maximum: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  priority?: number;
}
