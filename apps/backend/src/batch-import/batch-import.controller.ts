import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BatchImportService, BatchImportDto } from './batch-import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('batch-import')
@Controller('batch-import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BatchImportController {
  constructor(private batchImportService: BatchImportService) {}

  @Post()
  @ApiOperation({ summary: 'Import data in batch' })
  async importData(@Body() dto: BatchImportDto, @Request() req) {
    return this.batchImportService.importData(req.user.id, dto);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get batch import job status' })
  async getJobStatus(@Param('jobId') jobId: string, @Request() req): Promise<any> {
    return this.batchImportService.getJobStatus(jobId, req.user.id);
  }
}


