import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @HealthCheck()
  checkLiveness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}