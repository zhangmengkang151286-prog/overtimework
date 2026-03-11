/**
 * 属性测试：趋势数据聚合
 *
 * 使用 fast-check 验证趋势数据聚合函数的正确性属性
 */

import * as fc from 'fast-check';
import {aggregateTrendData, getISOWeek} from '../../utils/trendDataUtils';
import {PersonalStatusRecord} from '../../types/my-page';

/**
 * 生成有效的 PersonalStatusRecord 的 arbitrary
 * 日期范围限制在 2024-01-01 到 2026-12-31
 */
const personalStatusRecordArb = fc
  .record({
    year: fc.integer({min: 2024, max: 2026}),
    month: fc.integer({min: 1, max: 12}),
    day: fc.integer({min: 1, max: 28}), // 使用28避免无效日期
    isOvertime: fc.boolean(),
    overtimeHours: fc.integer({min: 1, max: 12}),
  })
  .map(({year, month, day, isOvertime, overtimeHours}) => {
    const m = month.toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return {
      date: `${year}-${m}-${d}`,
      isOvertime,
      overtimeHours: isOvertime ? overtimeHours : 0,
    } as PersonalStatusRecord;
  });

/**
 * 生成具有唯一日期的记录数组
 */
const uniqueDateRecordsArb = fc
  .array(personalStatusRecordArb, {minLength: 1, maxLength: 50})
  .map((records) => {
    // 按日期去重，保留最后一条
    const map = new Map<string, PersonalStatusRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return Array.from(map.values());
  })
  .filter((records) => records.length > 0);

describe('MyPage - 趋势数据聚合属性测试', () => {
  /**
   * **Feature: my-page-calendar-trend, Property 4: 天维度聚合保持数据点数量**
   * **Validates: Requirements 6.1, 8.1**
   *
   * 对于任意一组个人状态记录，按天维度聚合后的数据点数量应等于输入记录中不同日期的数量，
   * 且每个数据点的 avgOvertimeHours 等于对应日期的加班时长（准时下班为 0）。
   */
  it('天维度聚合保持数据点数量且值正确', () => {
    fc.assert(
      fc.property(uniqueDateRecordsArb, (records) => {
        const result = aggregateTrendData(records, 'day');

        // 去重后的日期数量
        const uniqueDates = new Set(records.map((r) => r.date));

        // 数据点数量应等于不同日期的数量
        expect(result.length).toBe(uniqueDates.size);

        // 每个数据点的值应正确
        for (const point of result) {
          const record = records.find((r) => r.date === point.date);
          expect(record).toBeDefined();
          const expectedHours = record!.isOvertime
            ? record!.overtimeHours
            : 0;
          expect(point.avgOvertimeHours).toBe(expectedHours);
          expect(point.recordCount).toBe(1);
        }
      }),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: my-page-calendar-trend, Property 5: 周维度聚合平均值正确性**
   * **Validates: Requirements 6.2, 8.2**
   *
   * 对于任意一组个人状态记录，按周维度聚合后，每个数据点的 avgOvertimeHours
   * 应等于该 ISO 周内所有记录的加班时长（准时下班为 0）的算术平均值。
   */
  it('周维度聚合平均值正确', () => {
    fc.assert(
      fc.property(uniqueDateRecordsArb, (records) => {
        const result = aggregateTrendData(records, 'week');

        // 手动按 ISO 周分组计算期望值
        const weekGroups = new Map<string, number[]>();
        for (const record of records) {
          const {year, week} = getISOWeek(record.date);
          const key = `${year}-W${week}`;
          if (!weekGroups.has(key)) {
            weekGroups.set(key, []);
          }
          const hours = record.isOvertime ? record.overtimeHours : 0;
          weekGroups.get(key)!.push(hours);
        }

        // 数据点数量应等于不同周的数量
        expect(result.length).toBe(weekGroups.size);

        // 每个数据点的平均值应正确
        for (const point of result) {
          const {year, week} = getISOWeek(point.date);
          const key = `${year}-W${week}`;
          const hours = weekGroups.get(key);
          expect(hours).toBeDefined();
          const expectedAvg =
            hours!.reduce((sum, h) => sum + h, 0) / hours!.length;
          expect(point.avgOvertimeHours).toBeCloseTo(expectedAvg, 10);
          expect(point.recordCount).toBe(hours!.length);
        }
      }),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: my-page-calendar-trend, Property 6: 月维度聚合平均值正确性**
   * **Validates: Requirements 6.3, 8.3**
   *
   * 对于任意一组个人状态记录，按月维度聚合后，每个数据点的 avgOvertimeHours
   * 应等于该月内所有记录的加班时长（准时下班为 0）的算术平均值。
   */
  it('月维度聚合平均值正确', () => {
    fc.assert(
      fc.property(uniqueDateRecordsArb, (records) => {
        const result = aggregateTrendData(records, 'month');

        // 手动按年月分组计算期望值
        const monthGroups = new Map<string, number[]>();
        for (const record of records) {
          const key = record.date.substring(0, 7); // YYYY-MM
          if (!monthGroups.has(key)) {
            monthGroups.set(key, []);
          }
          const hours = record.isOvertime ? record.overtimeHours : 0;
          monthGroups.get(key)!.push(hours);
        }

        // 数据点数量应等于不同月的数量
        expect(result.length).toBe(monthGroups.size);

        // 每个数据点的平均值应正确
        for (const point of result) {
          const key = point.date.substring(0, 7);
          const hours = monthGroups.get(key);
          expect(hours).toBeDefined();
          const expectedAvg =
            hours!.reduce((sum, h) => sum + h, 0) / hours!.length;
          expect(point.avgOvertimeHours).toBeCloseTo(expectedAvg, 10);
          expect(point.recordCount).toBe(hours!.length);
        }
      }),
      {numRuns: 100},
    );
  });
});
