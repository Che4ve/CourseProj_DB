import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCheckinDto {
  @ApiProperty({ example: '5d1f2f3a-7b14-4f3b-8f47-12c7d14f9e10' })
  @IsUUID()
  habitId: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsOptional()
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsOptional()
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'checkinDate must be in YYYY-MM-DD format' })
  checkinDate?: string;

  @ApiProperty({ example: 'Felt great after the run', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  moodRating?: number;

  @ApiProperty({ example: 45, minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
