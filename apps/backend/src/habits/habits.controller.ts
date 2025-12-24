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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@ApiTags('habits')
@Controller('habits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user habits' })
  async findAll(@Request() req): Promise<any> {
    return this.habitsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get habit by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<any> {
    return this.habitsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new habit' })
  async create(@Body() dto: CreateHabitDto, @Request() req) {
    return this.habitsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update habit' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHabitDto, @Request() req) {
    return this.habitsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete habit' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.habitsService.delete(id, req.user.id);
  }
}

