import { Request, Response } from 'express';
import { statisticsService } from '../services/statisticsService';
import { successResponse, errorResponse } from '../utils/response';

export class RealtimeController {
  // 获取实时统计
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await statisticsService.getTodayStatistics();
      
      successResponse(res, {
        currentTime: new Date().toISOString(),
        ...stats,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      errorResponse(res, 'STATISTICS_ERROR', error.message);
    }
  }

  // 获取Top标签统计
  async getTopTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await statisticsService.getTopTagsStatistics();
      successResponse(res, tags);
    } catch (error: any) {
      errorResponse(res, 'TAGS_ERROR', error.message);
    }
  }

  // 获取历史统计
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const history = await statisticsService.getHistoricalStatistics(days);
      successResponse(res, history);
    } catch (error: any) {
      errorResponse(res, 'HISTORY_ERROR', error.message);
    }
  }
}

export const realtimeController = new RealtimeController();
