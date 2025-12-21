import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('habits')
  @ApiOperation({ summary: 'Get user habits report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getHabitsReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req,
  ) {
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    return this.reportsService.getUserHabitsReport(req.user.id, fromDate, toDate);
  }

  @Get('daily-stats')
  @ApiOperation({ summary: 'Get daily statistics' })
  @ApiQuery({ name: 'days', required: false })
  async getDailyStats(
    @Query('days') days: string,
    @Request() req,
  ) {
    return this.reportsService.getDailyStats(req.user.id, days ? parseInt(days) : 30);
  }

  @Get('completion-rate')
  @ApiOperation({ summary: 'Get completion rate' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getCompletionRate(
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req,
  ) {
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    return this.reportsService.getCompletionRate(req.user.id, fromDate, toDate);
  }

  @Get('streaks')
  @ApiOperation({ summary: 'Get habit streaks' })
  async getStreaks(@Request() req) {
    return this.reportsService.getHabitStreaks(req.user.id);
  }
}





