import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DailyStatsQueryDto {
  @ApiProperty({ example: 30, minimum: 1, maximum: 365, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
