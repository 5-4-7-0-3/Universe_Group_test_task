import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReporterService } from './reporter.service';
import { EventReportFiltersDto, RevenueReportFiltersDto, BaseReportFiltersDto } from './dto/report-filters.dto';

@ApiTags('reports')
@Controller('reports')
export class ReporterController {
  constructor(private readonly reporterService: ReporterService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get aggregated event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved successfully' })
  async getEventStatistics(@Query() filters: EventReportFiltersDto) {
    return this.reporterService.getEventStatistics(filters);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get aggregated revenue data' })
  @ApiResponse({ status: 200, description: 'Revenue data retrieved successfully' })
  async getRevenueData(@Query() filters: RevenueReportFiltersDto) {
    return this.reporterService.getRevenueData(filters);
  }

  @Get('demographics')
  @ApiOperation({ summary: 'Get user demographic data' })
  @ApiResponse({ status: 200, description: 'Demographics data retrieved successfully' })
  async getDemographicsData(@Query() filters: BaseReportFiltersDto) {
    return this.reporterService.getDemographicsData(filters);
  }
}