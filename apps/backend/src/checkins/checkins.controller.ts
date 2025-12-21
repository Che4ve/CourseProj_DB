import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckinsService, CreateCheckinDto } from './checkins.service';

@ApiTags('checkins')
@Controller('checkins')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckinsController {
  constructor(private checkinsService: CheckinsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a checkin' })
  async create(@Body() dto: CreateCheckinDto, @Request() req) {
    return this.checkinsService.create(req.user.id, dto);
  }

  @Get('habit/:habitId')
  @ApiOperation({ summary: 'Get checkins for a habit' })
  async findByHabit(
    @Param('habitId') habitId: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    return this.checkinsService.findByHabit(habitId, req.user.id, limit ? parseInt(limit) : 30);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete checkin' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.checkinsService.delete(id, req.user.id);
  }

  @Delete('habit/:habitId/date/:date')
  @ApiOperation({ summary: 'Delete checkin by habit and date' })
  async deleteByHabitAndDate(
    @Param('habitId') habitId: string,
    @Param('date') date: string,
    @Request() req,
  ) {
    return this.checkinsService.deleteByHabitAndDate(habitId, date, req.user.id);
  }
}

