import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ScheduleFrequencyType } from './create-schedule.dto';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateScheduleDto {
  @ApiProperty({ enum: ScheduleFrequencyType, example: ScheduleFrequencyType.Weekly, required: false })
  @IsOptional()
  @IsEnum(ScheduleFrequencyType)
  frequencyType?: ScheduleFrequencyType;

  @ApiProperty({ example: 2, minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyValue?: number;

  @ApiProperty({ example: 42, minimum: 0, maximum: 127, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(127)
  weekdaysMask?: number;

  @ApiProperty({ example: '2024-02-01', required: false })
  @IsOptional()
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate?: string;

  @ApiProperty({ example: '2024-10-31', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string | null;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
