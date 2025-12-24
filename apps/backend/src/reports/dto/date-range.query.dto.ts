import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class DateRangeQueryDto {
  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'from must be in YYYY-MM-DD format' })
  from?: string;

  @ApiProperty({ example: '2024-01-31', required: false })
  @IsOptional()
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'to must be in YYYY-MM-DD format' })
  to?: string;
}
