import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DeliveryMethod } from './create-reminder.dto';

export class UpdateReminderDto {
  @ApiProperty({ example: '09:30', required: false })
  @IsOptional()
  @IsString()
  reminderTime?: string;

  @ApiProperty({ example: 62, minimum: 0, maximum: 127, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(127)
  daysOfWeek?: number;

  @ApiProperty({ example: 'Stay hydrated', required: false })
  @IsOptional()
  @IsString()
  notificationText?: string;

  @ApiProperty({ enum: DeliveryMethod, example: DeliveryMethod.Email, required: false })
  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
