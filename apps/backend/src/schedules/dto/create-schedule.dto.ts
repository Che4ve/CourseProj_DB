import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export enum ScheduleFrequencyType {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Custom = 'custom',
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateScheduleDto {
  @ApiProperty({ example: '5d1f2f3a-7b14-4f3b-8f47-12c7d14f9e10' })
  @IsUUID()
  habitId: string;

  @ApiProperty({ enum: ScheduleFrequencyType, example: ScheduleFrequencyType.Daily })
  @IsEnum(ScheduleFrequencyType)
  frequencyType: ScheduleFrequencyType;

  @ApiProperty({ example: 1, minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyValue?: number;

  @ApiProperty({ example: 127, minimum: 0, maximum: 127, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(127)
  weekdaysMask?: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate: string;

  @ApiProperty({ example: '2024-12-31', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
