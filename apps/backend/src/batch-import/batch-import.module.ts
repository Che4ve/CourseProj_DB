import { Module } from '@nestjs/common';
import { BatchImportService } from './batch-import.service';
import { BatchImportController } from './batch-import.controller';

@Module({
  controllers: [BatchImportController],
  providers: [BatchImportService],
})
export class BatchImportModule {}





