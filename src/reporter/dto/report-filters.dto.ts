import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BaseReportFiltersDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Event source', enum: ['facebook', 'tiktok'] })
  @IsOptional()
  @IsString()
  source?: 'facebook' | 'tiktok';
}

export class EventReportFiltersDto extends BaseReportFiltersDto {
  @ApiPropertyOptional({ description: 'Funnel stage', enum: ['top', 'bottom'] })
  @IsOptional()
  @IsString()
  funnelStage?: 'top' | 'bottom';

  @ApiPropertyOptional({ description: 'Event type' })
  @IsOptional()
  @IsString()
  eventType?: string;
}

export class RevenueReportFiltersDto extends BaseReportFiltersDto {
  @ApiPropertyOptional({ description: 'Campaign ID' })
  @IsOptional()
  @IsString()
  campaignId?: string;
}