import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsEnum } from 'class-validator';

export enum BatchImportEntityType {
  Habits = 'habits',
  Checkins = 'checkins',
  Tags = 'tags',
}

export class BatchImportDto {
  @ApiProperty({ enum: BatchImportEntityType, example: BatchImportEntityType.Habits })
  @IsEnum(BatchImportEntityType)
  entityType: BatchImportEntityType;

  @ApiProperty({
    isArray: true,
    example: [{ name: 'Morning run', type: 'good', priority: 3 }],
  })
  @IsArray()
  @ArrayMaxSize(1000)
  data: unknown[];
}
