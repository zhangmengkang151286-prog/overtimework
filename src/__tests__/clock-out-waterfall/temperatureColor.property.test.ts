/**
 * 属性测试：颜色温度映射
 * **Feature: clock-out-waterfall, Property 6: 颜色温度映射**
 * **Validates: Requirements 3.4**
 *
 * 对任意有效的应计下班时刻，颜色温度映射函数应返回 green/yellow/orange/red 四档之一，
 * 且更晚的下班时间映射到更"热"的颜色。
 */

import * as fc from 'fast-check';
import { mapTimeToTemperature } from '../../utils/waterfallUtils';
import { TemperatureLevel } from '../../types/clock-out-waterfall';

// 颜色温度从冷到热的顺序
const TEMPERATURE_ORDER: TemperatureLevel[] = ['green', 'yellow', 'orange', 'red'];

function temperatureIndex(level: TemperatureLevel): number {
  return TEMPERATURE_ORDER.indexOf(level);
}

/**
 * 生成一个指定日期内某个时刻的 ISO 字符串（不带时区后缀，按本地时间解析）
 * mapTimeToTemperature 使用 getHours() 获取本地时间，因此测试也需要使用本地时间
 */
function isoFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  // 不带 Z 后缀，确保 new Date() 按本地时间解析
  return `2025-06-15T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000`;
}

describe('下班瀑布流 - Property 6: 颜色温度映射', () => {
  it('任意有效时刻应映射到四档之一', () => {
    fc.assert(
      fc.property(
        // 生成 0:00 ~ 23:59 的分钟数
        fc.integer({ min: 0, max: 23 * 60 + 59 }),
        (totalMinutes) => {
          const iso = isoFromMinutes(totalMinutes);
          const result = mapTimeToTemperature(iso);
          expect(TEMPERATURE_ORDER).toContain(result);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('更晚的下班时间映射到更热或相同的颜色（单调性）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 * 60 + 59 }),
        fc.integer({ min: 0, max: 23 * 60 + 59 }),
        (minA, minB) => {
          const isoA = isoFromMinutes(minA);
          const isoB = isoFromMinutes(minB);
          const tempA = mapTimeToTemperature(isoA);
          const tempB = mapTimeToTemperature(isoB);

          if (minA <= minB) {
            expect(temperatureIndex(tempA)).toBeLessThanOrEqual(temperatureIndex(tempB));
          } else {
            expect(temperatureIndex(tempA)).toBeGreaterThanOrEqual(temperatureIndex(tempB));
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('区间边界映射正确', () => {
    // ≤18:30 → green
    expect(mapTimeToTemperature(isoFromMinutes(18 * 60 + 30))).toBe('green');
    expect(mapTimeToTemperature(isoFromMinutes(18 * 60))).toBe('green');
    // 18:31 → yellow
    expect(mapTimeToTemperature(isoFromMinutes(18 * 60 + 31))).toBe('yellow');
    // 20:00 → yellow
    expect(mapTimeToTemperature(isoFromMinutes(20 * 60))).toBe('yellow');
    // 20:01 → orange
    expect(mapTimeToTemperature(isoFromMinutes(20 * 60 + 1))).toBe('orange');
    // 22:00 → orange
    expect(mapTimeToTemperature(isoFromMinutes(22 * 60))).toBe('orange');
    // 22:01 → red
    expect(mapTimeToTemperature(isoFromMinutes(22 * 60 + 1))).toBe('red');
  });
});
