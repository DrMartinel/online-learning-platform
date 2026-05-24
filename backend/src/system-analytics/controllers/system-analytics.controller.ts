import { Controller, Get } from '@nestjs/common';
import { SystemAnalyticsService } from '../services/system-analytics.service';
import { MetricPointDTO } from '../dto/system-analytics.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';

@ApiTags('admin/system-analytics')
@ApiBearerAuth()
@Controller('admin/system-analytics')
export class SystemAnalyticsController {
  constructor(private readonly analyticsService: SystemAnalyticsService) {}

  @Get('requests')
  @Auth('action:admin:read')
  @ApiOperation({ summary: 'Admin: Get total request volume over 24h' })
  @ApiResponse({ status: 200, type: [MetricPointDTO] })
  async getRequestVolume(): Promise<MetricPointDTO[]> {
    return this.analyticsService.getRequestVolume();
  }

  @Get('errors')
  @Auth('action:admin:read')
  @ApiOperation({ summary: 'Admin: Get total error volume over 24h' })
  @ApiResponse({ status: 200, type: [MetricPointDTO] })
  async getErrors(): Promise<MetricPointDTO[]> {
    return this.analyticsService.getErrors();
  }
}
