import { Module } from '@nestjs/common';
import { SystemAnalyticsService } from './services/system-analytics.service';
import { SystemAnalyticsController } from './controllers/system-analytics.controller';

@Module({
  controllers: [SystemAnalyticsController],
  providers: [SystemAnalyticsService],
  exports: [SystemAnalyticsService],
})
export class SystemAnalyticsModule {}
