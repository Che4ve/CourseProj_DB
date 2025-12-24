import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCheckinDto {
  @ApiProperty({ example: 'Short notes for the checkin', required: false, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ example: 3, minimum: 1, maximum: 5, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  moodRating?: number | null;

  @ApiProperty({ example: 30, minimum: 1, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;
}
