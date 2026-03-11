/**
 * 属性测试：日历网格
 *
 * 使用 fast-check 验证日历网格生成的正确性属性
 */

import * as fc from 'fast-check';
import {generateCalendarGrid} from '../../utils/calendarUtils';

describe('MyPage - 日历网格属性测试', () => {
  /**
   * **Feature: my-page-calendar-trend, Property 1: 日历网格星期对齐正确性**
   * **Validates: Requirements 2.2**
   *
   * 对于任意有效的年份（2000-2100）和月份（1-12），
   * 生成的日历网格中每个当月日期所在的列位置（0=周一, 6=周日）
   * 应与该日期实际的星期几一致。
   */
  it('日历网格中每个日期的列位置应与实际星期几一致', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 2000, max: 2100}), // 年份
        fc.integer({min: 1, max: 12}), // 月份
        (year, month) => {
          const grid = generateCalendarGrid(year, month, [], []);

          for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
            const week = grid[rowIndex];
            // 每行应有 7 天
            expect(week.length).toBe(7);

            for (let colIndex = 0; colIndex < week.length; colIndex++) {
              const dayData = week[colIndex];

              // 只验证当月日期的星期对齐
              if (dayData.isCurrentMonth) {
                const date = new Date(year, month - 1, dayData.day);
                // JavaScript: 0=周日, 1=周一, ..., 6=周六
                // 转换为周一为0: (dayOfWeek + 6) % 7
                const expectedCol = (date.getDay() + 6) % 7;
                expect(colIndex).toBe(expectedCol);
              }
            }
          }
        },
      ),
      {numRuns: 100},
    );
  });
});
