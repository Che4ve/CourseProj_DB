import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum DeliveryMethod {
  Push = 'push',
  Email = 'email',
  Sms = 'sms',
}

export class CreateReminderDto {
  @ApiProperty({ example: '5d1f2f3a-7b14-4f3b-8f47-12c7d14f9e10' })
  @IsUUID()
  habitId: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  reminderTime: string;

  @ApiProperty({ example: 127, minimum: 0, maximum: 127, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(127)
  daysOfWeek?: number;

  @ApiProperty({ example: 'Time to practice', required: false })
  @IsOptional()
  @IsString()
  notificationText?: string;

  @ApiProperty({ enum: DeliveryMethod, example: DeliveryMethod.Push, required: false })
  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
