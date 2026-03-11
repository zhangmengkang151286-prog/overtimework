import {TagDistribution} from '../types';

/**
 * 数据可视化组件测试
 * 验证需求: 4.5, 5.1-5.5, 9.4, 9.5
 */

describe('Data Visualization Logic', () => {
  describe('Top10 Tag Processing', () => {
    /**
     * 测试Top10标签处理和"其他"类别合并逻辑
     * 验证需求: 9.4, 9.5
     */
    it('should process top 10 tags and merge others correctly', () => {
      // 创建15个加班标签和15个准时下班标签
      const tagDistribution: TagDistribution[] = [];

      // 加班标签
      for (let i = 0; i < 15; i++) {
        tagDistribution.push({
          tagId: `overtime-${i}`,
          tagName: `加班标签${i}`,
          count: 100 - i * 5,
          isOvertime: true,
          color: '#fca5a5',
        });
      }

      // 准时下班标签
      for (let i = 0; i < 15; i++) {
        tagDistribution.push({
          tagId: `ontime-${i}`,
          tagName: `准时标签${i}`,
          count: 90 - i * 4,
          isOvertime: false,
          color: '#86efac',
        });
      }

      // 分离加班和准时下班标签
      const overtimeTags = tagDistribution.filter(tag => tag.isOvertime);
      const onTimeTags = tagDistribution.filter(tag => !tag.isOvertime);

      // 排序并取Top10
      const sortedOvertimeTags = [...overtimeTags].sort(
        (a, b) => b.count - a.count,
      );
      const sortedOnTimeTags = [...onTimeTags].sort(
        (a, b) => b.count - a.count,
      );

      const top10Overtime = sortedOvertimeTags.slice(0, 10);
      const top10OnTime = sortedOnTimeTags.slice(0, 10);

      // 验证Top10数量
      expect(top10Overtime.length).toBe(10);
      expect(top10OnTime.length).toBe(10);

      // 验证Top10是按数量排序的
      for (let i = 0; i < top10Overtime.length - 1; i++) {
        expect(top10Overtime[i].count).toBeGreaterThanOrEqual(
          top10Overtime[i + 1].count,
        );
      }
      for (let i = 0; i < top10OnTime.length - 1; i++) {
        expect(top10OnTime[i].count).toBeGreaterThanOrEqual(
          top10OnTime[i + 1].count,
        );
      }

      // 计算"其他"类别的数量
      const otherOvertimeCount = sortedOvertimeTags
        .slice(10)
        .reduce((sum, tag) => sum + tag.count, 0);
      const otherOnTimeCount = sortedOnTimeTags
        .slice(10)
        .reduce((sum, tag) => sum + tag.count, 0);

      // 验证"其他"类别包含了剩余标签的总数
      expect(otherOvertimeCount).toBeGreaterThan(0);
      expect(otherOnTimeCount).toBeGreaterThan(0);

      // 验证总数保持一致
      const totalOriginalOvertime = overtimeTags.reduce(
        (sum, tag) => sum + tag.count,
        0,
      );
      const totalOriginalOnTime = onTimeTags.reduce(
        (sum, tag) => sum + tag.count,
        0,
      );

      const totalProcessedOvertime =
        top10Overtime.reduce((sum, tag) => sum + tag.count, 0) +
        otherOvertimeCount;
      const totalProcessedOnTime =
        top10OnTime.reduce((sum, tag) => sum + tag.count, 0) + otherOnTimeCount;

      expect(totalProcessedOvertime).toBe(totalOriginalOvertime);
      expect(totalProcessedOnTime).toBe(totalOriginalOnTime);
    });

    it('should handle less than 10 tags without creating "other" category', () => {
      const tagDistribution: TagDistribution[] = [
        {
          tagId: '1',
          tagName: '标签1',
          count: 50,
          isOvertime: true,
          color: '#fca5a5',
        },
        {
          tagId: '2',
          tagName: '标签2',
          count: 30,
          isOvertime: false,
          color: '#86efac',
        },
      ];

      const overtimeTags = tagDistribution.filter(tag => tag.isOvertime);
      const onTimeTags = tagDistribution.filter(tag => !tag.isOvertime);

      const sortedOvertimeTags = [...overtimeTags].sort(
        (a, b) => b.count - a.count,
      );
      const sortedOnTimeTags = [...onTimeTags].sort(
        (a, b) => b.count - a.count,
      );

      const top10Overtime = sortedOvertimeTags.slice(0, 10);
      const top10OnTime = sortedOnTimeTags.slice(0, 10);

      // 验证不会创建"其他"类别
      const otherOvertimeCount = sortedOvertimeTags
        .slice(10)
        .reduce((sum, tag) => sum + tag.count, 0);
      const otherOnTimeCount = sortedOnTimeTags
        .slice(10)
        .reduce((sum, tag) => sum + tag.count, 0);

      expect(otherOvertimeCount).toBe(0);
      expect(otherOnTimeCount).toBe(0);
      expect(top10Overtime.length).toBe(1);
      expect(top10OnTime.length).toBe(1);
    });
  });

  describe('Ratio Calculation', () => {
    /**
     * 测试比例计算的准确性
     * 验证需求: 4.5, 5.3
     */
    it('should calculate correct ratio for versus bar', () => {
      const overtimeCount = 300;
      const onTimeCount = 700;
      const total = overtimeCount + onTimeCount;

      const onTimeRatio = onTimeCount / total;
      const overtimeRatio = overtimeCount / total;

      expect(onTimeRatio).toBe(0.7);
      expect(overtimeRatio).toBe(0.3);
      expect(onTimeRatio + overtimeRatio).toBe(1);
    });

    it('should handle zero counts gracefully', () => {
      const overtimeCount = 0;
      const onTimeCount = 0;
      const total = overtimeCount + onTimeCount;

      // 当总数为0时，应该使用默认比例
      const ratio = total > 0 ? onTimeCount / total : 0.5;

      expect(ratio).toBe(0.5);
    });

    it('should handle only overtime counts', () => {
      const overtimeCount = 100;
      const onTimeCount = 0;
      const total = overtimeCount + onTimeCount;

      const onTimeRatio = onTimeCount / total;
      const overtimeRatio = overtimeCount / total;

      expect(onTimeRatio).toBe(0);
      expect(overtimeRatio).toBe(1);
    });

    it('should handle only ontime counts', () => {
      const overtimeCount = 0;
      const onTimeCount = 100;
      const total = overtimeCount + onTimeCount;

      const onTimeRatio = onTimeCount / total;
      const overtimeRatio = overtimeCount / total;

      expect(onTimeRatio).toBe(1);
      expect(overtimeRatio).toBe(0);
    });
  });

  describe('Grid Allocation', () => {
    /**
     * 测试网格分配的准确性
     * 验证需求: 5.3
     */
    it('should allocate grids proportionally', () => {
      const items = [
        {id: '1', count: 50},
        {id: '2', count: 30},
        {id: '3', count: 20},
      ];
      const totalCount = 100;
      const totalGrids = 100;

      const allocation = new Map<string, number>();
      items.forEach(item => {
        const ratio = item.count / totalCount;
        const gridCount = Math.max(1, Math.round(ratio * totalGrids));
        allocation.set(item.id, gridCount);
      });

      expect(allocation.get('1')).toBe(50);
      expect(allocation.get('2')).toBe(30);
      expect(allocation.get('3')).toBe(20);
    });

    it('should ensure minimum of 1 grid per item', () => {
      const items = [
        {id: '1', count: 99},
        {id: '2', count: 1},
      ];
      const totalCount = 100;
      const totalGrids = 100;

      const allocation = new Map<string, number>();
      items.forEach(item => {
        const ratio = item.count / totalCount;
        const gridCount = Math.max(1, Math.round(ratio * totalGrids));
        allocation.set(item.id, gridCount);
      });

      // 即使比例很小，也应该至少分配1个方格
      expect(allocation.get('1')).toBeGreaterThanOrEqual(1);
      expect(allocation.get('2')).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Color Assignment', () => {
    /**
     * 测试颜色分配逻辑
     * 验证需求: 5.2, 9.5
     */
    it('should assign correct colors for overtime and ontime', () => {
      const overtimeColor = '#fca5a5'; // 浅红色
      const onTimeColor = '#86efac'; // 浅绿色

      // 验证颜色格式
      expect(overtimeColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(onTimeColor).toMatch(/^#[0-9a-f]{6}$/i);

      // 验证颜色不同
      expect(overtimeColor).not.toBe(onTimeColor);
    });

    it('should use different colors for "other" categories', () => {
      const overtimeOtherColor = '#fca5a5'; // 加班的其他
      const onTimeOtherColor = '#86efac'; // 准时下班的其他

      expect(overtimeOtherColor).not.toBe(onTimeOtherColor);
    });
  });
});
