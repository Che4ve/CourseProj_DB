import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HabitsModule } from './habits/habits.module';
import { CheckinsModule } from './checkins/checkins.module';
import { ReportsModule } from './reports/reports.module';
import { BatchImportModule } from './batch-import/batch-import.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HabitsModule,
    CheckinsModule,
    ReportsModule,
    BatchImportModule,
  ],
})
export class AppModule {}




