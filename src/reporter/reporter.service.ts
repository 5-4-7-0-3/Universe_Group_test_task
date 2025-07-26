import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/services/database.service';
import { MetricsService } from '../shared/services/metrics.service';
import { Logger } from '../shared/utils/logger';
import { EventReportFiltersDto, RevenueReportFiltersDto, BaseReportFiltersDto } from './dto/report-filters.dto';

@Injectable()
export class ReporterService {
  private readonly logger = new Logger({ service: 'ReporterService' });

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly metricsService: MetricsService,
  ) { }

  async getEventStatistics(filters: EventReportFiltersDto) {
    const timer = this.metricsService.startReportTimer('events');

    try {
      const whereClause: any = {};

      if (filters.from) {
        whereClause.timestamp = { ...whereClause.timestamp, gte: new Date(filters.from) };
      }

      if (filters.to) {
        whereClause.timestamp = { ...whereClause.timestamp, lte: new Date(filters.to) };
      }

      if (filters.source) {
        whereClause.source = filters.source;
      }

      if (filters.funnelStage) {
        whereClause.funnelStage = filters.funnelStage;
      }

      if (filters.eventType) {
        whereClause.eventType = filters.eventType;
      }

      const statistics = await this.databaseService.event.groupBy({
        by: ['source', 'funnelStage', 'eventType'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      const result = statistics.map(stat => ({
        source: stat.source,
        funnelStage: stat.funnelStage,
        eventType: stat.eventType,
        count: stat._count.id,
      }));

      this.logger.info('Event statistics generated', {
        filters,
        resultCount: result.length
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to generate event statistics', error, { filters });
      throw error;
    } finally {
      timer();
    }
  }

  async getRevenueData(filters: RevenueReportFiltersDto) {
    const timer = this.metricsService.startReportTimer('revenue');

    try {
      const whereClause: any = {
        OR: [
          { eventType: 'checkout.complete', source: 'facebook' },
          { eventType: 'purchase', source: 'tiktok' },
        ],
      };

      if (filters.from) {
        whereClause.timestamp = { ...whereClause.timestamp, gte: new Date(filters.from) };
      }

      if (filters.to) {
        whereClause.timestamp = { ...whereClause.timestamp, lte: new Date(filters.to) };
      }

      if (filters.source) {
        whereClause.source = filters.source;
        whereClause.OR = whereClause.OR.filter(condition => condition.source === filters.source);
      }

      const events = await this.databaseService.event.findMany({
        where: whereClause,
        select: {
          id: true,
          source: true,
          timestamp: true,
          data: true,
        },
      });

      const revenueData = events
        .map(event => {
          let purchaseAmount = 0;
          let campaignId = null;

          const eventData = event.data as any;

          if (event.source === 'facebook' && eventData?.engagement?.purchaseAmount) {
            purchaseAmount = parseFloat(eventData.engagement.purchaseAmount) || 0;
            campaignId = eventData.engagement.campaignId;
          } else if (event.source === 'tiktok' && eventData?.engagement?.purchaseAmount) {
            purchaseAmount = parseFloat(eventData.engagement.purchaseAmount) || 0;
          }

          return {
            source: event.source,
            timestamp: event.timestamp,
            amount: purchaseAmount,
            campaignId,
          };
        })
        .filter(item => item.amount > 0);

      const filteredData = filters.campaignId
        ? revenueData.filter(item => item.campaignId === filters.campaignId)
        : revenueData;

      const groupedRevenue = filteredData.reduce((acc, item) => {
        if (!acc[item.source]) {
          acc[item.source] = { totalRevenue: 0, transactionCount: 0 };
        }
        acc[item.source].totalRevenue += item.amount;
        acc[item.source].transactionCount += 1;
        return acc;
      }, {});

      const result = Object.entries(groupedRevenue).map(([source, data]: [string, any]) => ({
        source,
        totalRevenue: data.totalRevenue,
        transactionCount: data.transactionCount,
        averageTransactionValue: data.totalRevenue / data.transactionCount,
      }));

      this.logger.info('Revenue data generated', {
        filters,
        resultCount: result.length,
        totalTransactions: filteredData.length
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to generate revenue data', error, { filters });
      throw error;
    } finally {
      timer();
    }
  }

  async getDemographicsData(filters: BaseReportFiltersDto) {
    const timer = this.metricsService.startReportTimer('demographics');

    try {
      const whereClause: any = {};

      if (filters.from) {
        whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(filters.from) };
      }

      if (filters.to) {
        whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(filters.to) };
      }

      if (filters.source) {
        whereClause.source = filters.source;
      }

      const users = await this.databaseService.user.findMany({
        where: whereClause,
        select: {
          source: true,
          userData: true,
        },
      });

      const demographicsData = {
        facebook: {
          age: {},
          gender: {},
          location: {},
        },
        tiktok: {
          followers: {},
        },
      };

      users.forEach(user => {
        if (user.source === 'facebook') {
          const userData = user.userData as any;

          const ageGroup = this.getAgeGroup(userData.age);
          demographicsData.facebook.age[ageGroup] = (demographicsData.facebook.age[ageGroup] || 0) + 1;

          demographicsData.facebook.gender[userData.gender] = (demographicsData.facebook.gender[userData.gender] || 0) + 1;

          const location = `${userData.location.city}, ${userData.location.country}`;
          demographicsData.facebook.location[location] = (demographicsData.facebook.location[location] || 0) + 1;
        } else if (user.source === 'tiktok') {
          const userData = user.userData as any;

          const followerGroup = this.getFollowerGroup(userData.followers);
          demographicsData.tiktok.followers[followerGroup] = (demographicsData.tiktok.followers[followerGroup] || 0) + 1;
        }
      });

      this.logger.info('Demographics data generated', {
        filters,
        userCount: users.length
      });

      return demographicsData;
    } catch (error) {
      this.logger.error('Failed to generate demographics data', error, { filters });
      throw error;
    } finally {
      timer();
    }
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return '< 18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  private getFollowerGroup(followers: number): string {
    if (followers < 100) return '< 100';
    if (followers < 1000) return '100-999';
    if (followers < 10000) return '1K-9.9K';
    if (followers < 100000) return '10K-99.9K';
    return '100K+';
  }
}