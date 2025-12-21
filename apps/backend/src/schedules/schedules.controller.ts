import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchedulesService, CreateScheduleDto, UpdateScheduleDto } from './schedules.service';

@ApiTags('schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  @Get('habit/:habitId')
  @ApiOperation({ summary: 'Get schedules for a habit' })
  async findByHabit(@Param('habitId') habitId: string, @Request() req) {
    return this.schedulesService.findByHabit(habitId, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create schedule' })
  async create(@Body() dto: CreateScheduleDto, @Request() req) {
    return this.schedulesService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update schedule' })
  async update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @Request() req) {
    return this.schedulesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete schedule' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.schedulesService.delete(id, req.user.id);
  }
}
