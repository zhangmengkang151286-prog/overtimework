/**
 * PosterDataService 单元测试
 * 测试海报数据获取和处理逻辑
 */

import {posterDataService} from '../posterData';
import {supabaseService} from '../supabaseService';
import {supabase} from '../supabase';

// Mock supabaseService
jest.mock('../supabaseService');
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('PosterDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInfo', () => {
    it('应该成功获取用户信息', async () => {
      const mockUser = {
        id: 'user-123',
        username: '测试用户',
        avatar: 'https://example.com/avatar.png',
      };

      (supabaseService.getUser as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await posterDataService.getUserInfo('user-123');

      expect(result).toEqual({
        avatar: 'https://example.com/avatar.png',
        username: '测试用户',
      });
      expect(supabaseService.getUser).toHaveBeenCalledWith('user-123');
    });

    it('当用户头像为空时应该返回空字符串', async () => {
      const mockUser = {
        id: 'user-123',
        username: '测试用户',
        avatar: null,
      };

      (supabaseService.getUser as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await posterDataService.getUserInfo('user-123');

      expect(result.avatar).toBe('');
      expect(result.username).toBe('测试用户');
    });

    it('当用户名为空时应该返回默认值', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        avatar: 'https://example.com/avatar.png',
      };

      (supabaseService.getUser as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await posterDataService.getUserInfo('user-123');

      expect(result.username).toBe('未知用户');
    });

    it('当用户不存在时应该抛出错误', async () => {
      (supabaseService.getUser as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        posterDataService.getUserInfo('non-existent'),
      ).rejects.toThrow('用户不存在');
    });

    it('当获取用户信息失败时应该抛出错误', async () => {
      (supabaseService.getUser as jest.Mock).mockRejectedValueOnce(
        new Error('数据库错误'),
      );

      await expect(
        posterDataService.getUserInfo('user-123'),
      ).rejects.toThrow();
    });
  });

  describe('getTrendData', () => {
    it('应该成功获取趋势界面数据', async () => {
      const mockStats = {
        participantCount: 100,
        onTimeCount: 60,
        overtimeCount: 40,
      };

      const mockSnapshots = [
        {
          snapshot_hour: 9,
          on_time_count: 10,
          overtime_count: 5,
          snapshot_time: '2024-02-22T09:00:00Z',
        },
        {
          snapshot_hour: 10,
          on_time_count: 20,
          overtime_count: 10,
          snapshot_time: '2024-02-22T10:00:00Z',
        },
      ];

      const mockTagStats = [
        {tagId: 'tag-1', tagName: '项目加班', totalCount: 30},
        {tagId: 'tag-2', tagName: '会议', totalCount: 20},
      ];

      (supabaseService.getRealTimeStats as jest.Mock).mockResolvedValueOnce(
        mockStats,
      );
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSnapshots,
              error: null,
            }),
          }),
        }),
      });
      (supabaseService.getTopTags as jest.Mock).mockResolvedValueOnce(
        mockTagStats,
      );

      const result = await posterDataService.getTrendData();

      expect(result.participants).toBe(100);
      expect(result.onTimeCount).toBe(60);
      expect(result.overtimeCount).toBe(40);
      expect(result.timeline).toHaveLength(2);
      expect(result.tagDistribution).toHaveLength(2);
    });

    it('当时间轴数据为空时应该返回空数组', async () => {
      const mockStats = {
        participantCount: 100,
        onTimeCount: 60,
        overtimeCount: 40,
      };

      (supabaseService.getRealTimeStats as jest.Mock).mockResolvedValueOnce(
        mockStats,
      );
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });
      (supabaseService.getTopTags as jest.Mock).mockResolvedValueOnce([]);

      const result = await posterDataService.getTrendData();

      expect(result.timeline).toEqual([]);
      expect(result.tagDistribution).toEqual([]);
    });

    it('当获取实时统计失败时应该抛出错误', async () => {
      (supabaseService.getRealTimeStats as jest.Mock).mockRejectedValueOnce(
        new Error('获取统计失败'),
      );

      await expect(posterDataService.getTrendData()).rejects.toThrow();
    });
  });

  describe('getCalendarData', () => {
    it('应该成功获取日历数据', async () => {
      const mockRecords = [
        {date: '2024-02-01', isOvertime: false},
        {date: '2024-02-02', isOvertime: true},
        {date: '2024-02-03', isOvertime: false},
      ];

      (
        supabaseService.getUserMonthlyRecords as jest.Mock
      ).mockResolvedValueOnce(mockRecords);

      const result = await posterDataService.getCalendarData(
        'user-123',
        2024,
        2,
      );

      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.days).toHaveLength(3);
      expect(result.days[0].status).toBe('ontime');
      expect(result.days[1].status).toBe('overtime');
    });

    it('当没有记录时应该返回空数组', async () => {
      (
        supabaseService.getUserMonthlyRecords as jest.Mock
      ).mockResolvedValueOnce([]);

      const result = await posterDataService.getCalendarData(
        'user-123',
        2024,
        2,
      );

      expect(result.days).toEqual([]);
    });

    it('当获取记录失败时应该抛出错误', async () => {
      (
        supabaseService.getUserMonthlyRecords as jest.Mock
      ).mockRejectedValueOnce(new Error('获取记录失败'));

      await expect(
        posterDataService.getCalendarData('user-123', 2024, 2),
      ).rejects.toThrow();
    });
  });

  describe('getOvertimeTrendData', () => {
    it('应该成功获取按天维度的趋势数据', async () => {
      const mockRecords = [
        {date: '2024-02-01', isOvertime: true},
        {date: '2024-02-01', isOvertime: true},
        {date: '2024-02-02', isOvertime: true},
      ];

      (supabaseService.getUserTrendData as jest.Mock).mockResolvedValueOnce(
        mockRecords,
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'day',
      );

      expect(result.dimension).toBe('day');
      expect(result.dataPoints).toHaveLength(2);
      expect(result.dataPoints[0].value).toBe(2); // 2024-02-01 有 2 次加班
      expect(result.dataPoints[1].value).toBe(1); // 2024-02-02 有 1 次加班
    });

    it('应该成功获取按周维度的趋势数据', async () => {
      const mockRecords = [
        {date: '2024-02-05', isOvertime: true}, // 周一
        {date: '2024-02-06', isOvertime: true}, // 周二
        {date: '2024-02-12', isOvertime: true}, // 下周一
      ];

      (supabaseService.getUserTrendData as jest.Mock).mockResolvedValueOnce(
        mockRecords,
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'week',
      );

      expect(result.dimension).toBe('week');
      expect(result.dataPoints).toHaveLength(2);
    });

    it('应该成功获取按月维度的趋势数据', async () => {
      const mockRecords = [
        {date: '2024-01-15', isOvertime: true},
        {date: '2024-01-20', isOvertime: true},
        {date: '2024-02-10', isOvertime: true},
      ];

      (supabaseService.getUserTrendData as jest.Mock).mockResolvedValueOnce(
        mockRecords,
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'month',
      );

      expect(result.dimension).toBe('month');
      expect(result.dataPoints).toHaveLength(2);
      expect(result.dataPoints[0].value).toBe(2); // 2024-01 有 2 次
      expect(result.dataPoints[1].value).toBe(1); // 2024-02 有 1 次
    });

    it('应该过滤掉非加班记录', async () => {
      const mockRecords = [
        {date: '2024-02-01', isOvertime: true},
        {date: '2024-02-01', isOvertime: false}, // 准时下班，不计入
        {date: '2024-02-02', isOvertime: true},
      ];

      (supabaseService.getUserTrendData as jest.Mock).mockResolvedValueOnce(
        mockRecords,
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'day',
      );

      expect(result.dataPoints[0].value).toBe(1); // 只有 1 次加班
    });

    it('当没有数据时应该返回空数组', async () => {
      (supabaseService.getUserTrendData as jest.Mock).mockResolvedValueOnce(
        [],
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'day',
      );

      expect(result.dataPoints).toEqual([]);
    });

    it('当获取趋势数据失败时应该返回空数组', async () => {
      (supabaseService.getUserTrendData as jest.Mock).mockRejectedValueOnce(
        new Error('获取趋势失败'),
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'day',
      );

      // 错误被捕获，返回空数组
      expect(result.dataPoints).toEqual([]);
    });
  });

  describe('getTagProportionData', () => {
    it('应该成功获取标签占比数据', async () => {
      const mockTagProportions = [
        {tagId: 'tag-1', tagName: '项目加班', count: 30, percentage: 60},
        {tagId: 'tag-2', tagName: '会议', count: 20, percentage: 40},
      ];

      (
        supabaseService.getUserTagProportion as jest.Mock
      ).mockResolvedValueOnce(mockTagProportions);

      const result = await posterDataService.getTagProportionData(
        'user-123',
        2024,
        2,
      );

      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.tags).toHaveLength(2);
      expect(result.tags[0].tag_name).toBe('项目加班');
      expect(result.tags[0].percentage).toBe(60);
      expect(result.tags[0].color).toBeDefined(); // 应该有颜色
    });

    it('应该为每个标签分配不同的颜色', async () => {
      const mockTagProportions = [
        {tagId: 'tag-1', tagName: '标签1', count: 10, percentage: 50},
        {tagId: 'tag-2', tagName: '标签2', count: 10, percentage: 50},
      ];

      (
        supabaseService.getUserTagProportion as jest.Mock
      ).mockResolvedValueOnce(mockTagProportions);

      const result = await posterDataService.getTagProportionData(
        'user-123',
        2024,
        2,
      );

      // 颜色应该不同
      expect(result.tags[0].color).not.toBe(result.tags[1].color);
    });

    it('当没有标签数据时应该返回空数组', async () => {
      (
        supabaseService.getUserTagProportion as jest.Mock
      ).mockResolvedValueOnce([]);

      const result = await posterDataService.getTagProportionData(
        'user-123',
        2024,
        2,
      );

      expect(result.tags).toEqual([]);
    });

    it('当获取标签占比失败时应该抛出错误', async () => {
      (
        supabaseService.getUserTagProportion as jest.Mock
      ).mockRejectedValueOnce(new Error('获取标签失败'));

      await expect(
        posterDataService.getTagProportionData('user-123', 2024, 2),
      ).rejects.toThrow();
    });
  });

  describe('数据格式化', () => {
    it('应该正确格式化时间轴数据', async () => {
      const mockStats = {
        participantCount: 100,
        onTimeCount: 60,
        overtimeCount: 40,
      };

      const mockSnapshots = [
        {
          snapshot_hour: 9,
          on_time_count: 10,
          overtime_count: 5,
          snapshot_time: '2024-02-22T09:00:00Z',
        },
      ];

      (supabaseService.getRealTimeStats as jest.Mock).mockResolvedValueOnce(
        mockStats,
      );
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSnapshots,
              error: null,
            }),
          }),
        }),
      });
      (supabaseService.getTopTags as jest.Mock).mockResolvedValueOnce([]);

      const result = await posterDataService.getTrendData();

      expect(result.timeline[0]).toEqual({
        hour: 9,
        onTimeCount: 10,
        overtimeCount: 5,
        timestamp: '2024-02-22T09:00:00Z',
      });
    });

    it('应该正确计算标签百分比', async () => {
      const mockStats = {
        participantCount: 100,
        onTimeCount: 60,
        overtimeCount: 40,
      };

      const mockTagStats = [
        {tagId: 'tag-1', tagName: '项目加班', totalCount: 30},
        {tagId: 'tag-2', tagName: '会议', totalCount: 20},
      ];

      (supabaseService.getRealTimeStats as jest.Mock).mockResolvedValueOnce(
        mockStats,
      );
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });
      (supabaseService.getTopTags as jest.Mock).mockResolvedValueOnce(
        mockTagStats,
      );

      const result = await posterDataService.getTrendData();

      // 总数 = 30 + 20 = 50
      // 项目加班 = 30 / 50 = 60%
      // 会议 = 20 / 50 = 40%
      expect(result.tagDistribution[0].percentage).toBe(60);
      expect(result.tagDistribution[1].percentage).toBe(40);
    });

    it('当标签总数为0时百分比应该为0', async () => {
      const mockStats = {
        participantCount: 100,
        onTimeCount: 60,
        overtimeCount: 40,
      };

      const mockTagStats = [
        {tagId: 'tag-1', tagName: '项目加班', totalCount: 0},
      ];

      (supabaseService.getRealTimeStats as jest.Mock).mockResolvedValueOnce(
        mockStats,
      );
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });
      (supabaseService.getTopTags as jest.Mock).mockResolvedValueOnce(
        mockTagStats,
      );

      const result = await posterDataService.getTrendData();

      expect(result.tagDistribution[0].percentage).toBe(0);
    });

    it('应该正确格式化日期标签（天）', async () => {
      const mockRecords = [
        {date: '2024-02-01', isOvertime: true},
        {date: '2024-02-15', isOvertime: true},
      ];

      (supabaseService.getUserTrendData as jest.Mock).mockResolvedValueOnce(
        mockRecords,
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'day',
      );

      expect(result.dataPoints[0].label).toBe('02/01');
      expect(result.dataPoints[1].label).toBe('02/15');
    });

    it('应该正确格式化日期标签（月）', async () => {
      const mockRecords = [
        {date: '2024-01-15', isOvertime: true},
        {date: '2024-02-10', isOvertime: true},
      ];

      (supabaseService.getUserTrendData as jest.Mock).mockResolvedValueOnce(
        mockRecords,
      );

      const result = await posterDataService.getOvertimeTrendData(
        'user-123',
        'month',
      );

      expect(result.dataPoints[0].label).toBe('2024年01月');
      expect(result.dataPoints[1].label).toBe('2024年02月');
    });
  });

  describe('边界情况', () => {
    it('应该处理空的时间轴数据', async () => {
      const mockStats = {
        participantCount: 0,
        onTimeCount: 0,
        overtimeCount: 0,
      };

      (supabaseService.getRealTimeStats as jest.Mock).mockResolvedValueOnce(
        mockStats,
      );
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });
      (supabaseService.getTopTags as jest.Mock).mockResolvedValueOnce([]);

      const result = await posterDataService.getTrendData();

      expect(result.participants).toBe(0);
      expect(result.timeline).toEqual([]);
      expect(result.tagDistribution).toEqual([]);
    });

    it('应该处理数据库查询错误', async () => {
      const mockStats = {
        participantCount: 100,
        onTimeCount: 60,
        overtimeCount: 40,
      };

      (supabaseService.getRealTimeStats as jest.Mock).mockResolvedValueOnce(
        mockStats,
      );
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: {message: '数据库错误'},
            }),
          }),
        }),
      });
      (supabaseService.getTopTags as jest.Mock).mockResolvedValueOnce([]);

      const result = await posterDataService.getTrendData();

      // 应该返回空数组而不是抛出错误
      expect(result.timeline).toEqual([]);
    });

    it('应该处理超过10个标签的情况', async () => {
      const mockTagProportions = Array.from({length: 15}, (_, i) => ({
        tagId: `tag-${i}`,
        tagName: `标签${i}`,
        count: 10,
        percentage: 100 / 15,
      }));

      (
        supabaseService.getUserTagProportion as jest.Mock
      ).mockResolvedValueOnce(mockTagProportions);

      const result = await posterDataService.getTagProportionData(
        'user-123',
        2024,
        2,
      );

      // 应该为所有标签分配颜色（循环使用颜色数组）
      expect(result.tags).toHaveLength(15);
      result.tags.forEach((tag) => {
        expect(tag.color).toBeDefined();
      });
    });
  });
});
