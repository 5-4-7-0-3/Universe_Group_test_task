import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly eventsAccepted: Counter<string>;
  private readonly eventsProcessed: Counter<string>;
  private readonly eventsFailed: Counter<string>;
  private readonly reportLatency: Histogram<string>;

  constructor() {
    collectDefaultMetrics();

    this.eventsAccepted = new Counter({
      name: 'events_accepted_total',
      help: 'Total number of accepted events',
      labelNames: ['service', 'source'],
    });

    this.eventsProcessed = new Counter({
      name: 'events_processed_total',
      help: 'Total number of processed events',
      labelNames: ['service', 'source'],
    });

    this.eventsFailed = new Counter({
      name: 'events_failed_total',
      help: 'Total number of failed events',
      labelNames: ['service', 'source', 'error_type'],
    });

    this.reportLatency = new Histogram({
      name: 'report_duration_seconds',
      help: 'Duration of report generation',
      labelNames: ['report_type'],
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    register.registerMetric(this.eventsAccepted);
    register.registerMetric(this.eventsProcessed);
    register.registerMetric(this.eventsFailed);
    register.registerMetric(this.reportLatency);
  }

  incrementEventsAccepted(service: string, source: string) {
    this.eventsAccepted.inc({ service, source });
  }

  incrementEventsProcessed(service: string, source: string) {
    this.eventsProcessed.inc({ service, source });
  }

  incrementEventsFailed(service: string, source: string, errorType: string) {
    this.eventsFailed.inc({ service, source, error_type: errorType });
  }

  startReportTimer(reportType: string) {
    return this.reportLatency.startTimer({ report_type: reportType });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}