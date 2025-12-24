import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class BatchCheckinUpdateDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @Matches(DATE_REGEX, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  completed: boolean;
}

export class BatchCheckinsDto {
  @ApiProperty({
    type: () => [BatchCheckinUpdateDto],
    example: [{ date: '2024-01-15', completed: true }],
  })
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => BatchCheckinUpdateDto)
  updates: BatchCheckinUpdateDto[];
}
