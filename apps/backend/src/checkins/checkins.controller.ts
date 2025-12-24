import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckinsService } from './checkins.service';
import { BatchCheckinsDto } from './dto/batch-checkins.dto';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe';

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
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Request() req,
  ) {
    return this.checkinsService.findByHabit(habitId, req.user.id, limit);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete checkin' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.checkinsService.delete(id, req.user.id);
  }

  @Delete('habit/:habitId/date/:date')
  @ApiOperation({ summary: 'Delete checkin by habit and date' })
  async deleteByHabitAndDate(
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Param('date', ParseDatePipe) date: string,
    @Request() req,
  ) {
    return this.checkinsService.deleteByHabitAndDate(habitId, date, req.user.id);
  }

  @Patch('habit/:habitId/date/:date')
  @ApiOperation({ summary: 'Update checkin by habit and date' })
  async updateByHabitAndDate(
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Param('date', ParseDatePipe) date: string,
    @Body() dto: UpdateCheckinDto,
    @Request() req,
  ) {
    return this.checkinsService.updateByHabitAndDate(habitId, date, req.user.id, dto);
  }

  @Post('habit/:habitId/batch')
  @ApiOperation({ summary: 'Batch update checkins for a habit' })
  async batchUpdate(
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Body() dto: BatchCheckinsDto,
    @Request() req,
  ) {
    return this.checkinsService.updateBatchByHabit(habitId, req.user.id, dto);
  }
}
