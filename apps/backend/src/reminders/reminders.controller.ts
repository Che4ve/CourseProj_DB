import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@ApiTags('reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private remindersService: RemindersService) {}

  @Get('habit/:habitId')
  @ApiOperation({ summary: 'Get reminders for a habit' })
  async findByHabit(@Param('habitId', ParseUUIDPipe) habitId: string, @Request() req) {
    return this.remindersService.findByHabit(habitId, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create reminder' })
  async create(@Body() dto: CreateReminderDto, @Request() req) {
    return this.remindersService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reminder' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReminderDto, @Request() req) {
    return this.remindersService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete reminder' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.remindersService.delete(id, req.user.id);
  }
}
