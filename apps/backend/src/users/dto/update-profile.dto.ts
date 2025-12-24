import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Alex Johnson', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiProperty({ example: 'Working on consistency', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: 'Europe/Moscow', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: '1995-04-12', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;

  @ApiProperty({ example: 1, minimum: 0, maximum: 2, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  themePreference?: number;
}
