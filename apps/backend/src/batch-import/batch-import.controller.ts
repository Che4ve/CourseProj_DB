import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BatchImportService } from './batch-import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BatchImportDto } from './dto/batch-import.dto';

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
  async getJobStatus(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Request() req,
  ): Promise<any> {
    return this.batchImportService.getJobStatus(jobId, req.user.id);
  }
}

