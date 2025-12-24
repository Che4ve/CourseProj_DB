import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @ApiProperty({ example: 'Wellness', maxLength: 100, required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: '#22C55E', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}
