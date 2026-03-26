/**
 * 个人成就海报服务 - 属性测试
 * 使用 fast-check 验证核心逻辑的正确性
 */

import * as fc from 'fast-check';
import {
  selectIllustration,
  selectCaption,
  getCaptionTier,
  calculateRankFromTimes,
  computeOffWorkTime,
  getPercentageColor,
  formatPercentage,
  formatParticipantCount,
  serialize,
  deserialize,
} from '../../services/achievementPosterService';
import {
  ONTIME_ILLUSTRATIONS,
  OVERTIME_ILLUSTRATIONS,
  CAPTIONS,
  OVERTIME_PERCENTAGE_COLOR,
  ONTIME_PERCENTAGE_COLOR,
  SerializableAchievementPosterData,
} from '../../types/achievement-poster';

// ============================================================
// Property 1: 插画池选择正确性
// **Feature: personal-achievement-poster, Property 1: 插画池选择正确性**
// **Validates: Requirements 2.1, 2.2**
// ============================================================
describe('Property 1: 插画池选择正确性', () => {
  it('对任意百分比值，selectIllustration 返回的插画属于正确的池', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 0, max: 100}),
        (percentage) => {
          const result = selectIllustration(percentage);
          if (percentage > 50) {
            // 准时池
            expect(ONTIME_ILLUSTRATIONS).toContain(result);
          } else {
            // 加班池
            expect(OVERTIME_ILLUSTRATIONS).toContain(result);
          }
        },
      ),
      {numRuns: 100},
    );
  });
});


// ============================================================
// Property 2: 文案分档选择正确性
// **Feature: personal-achievement-poster, Property 2: 文案分档选择正确性**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
// ============================================================
describe('Property 2: 文案分档选择正确性', () => {
  it('对任意百分比值，selectCaption 返回的文案属于正确的分档', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 0, max: 100}),
        (percentage) => {
          const result = selectCaption(percentage);
          const tier = getCaptionTier(percentage);
          expect(CAPTIONS[tier]).toContain(result);
        },
      ),
      {numRuns: 100},
    );
  });
});

// ============================================================
// Property 3: 排名百分比计算正确性
// **Feature: personal-achievement-poster, Property 3: 排名百分比计算正确性**
// **Validates: Requirements 4.1, 4.2**
// ============================================================
describe('Property 3: 排名百分比计算正确性', () => {
  it('对任意下班时间列表和目标用户，计算结果等于比目标晚的人数/总人数', () => {
    fc.assert(
      fc.property(
        // 生成 1-50 个随机下班时间（分钟数，范围 0-1440）
        fc.array(fc.integer({min: 0, max: 1440}), {minLength: 1, maxLength: 50}),
        // 目标用户的下班时间
        fc.integer({min: 0, max: 1440}),
        (allTimes, targetTime) => {
          const result = calculateRankFromTimes(allTimes, targetTime);

          // 手动计算期望值
          const laterCount = allTimes.filter(t => t > targetTime).length;
          const expected = (laterCount / allTimes.length) * 100;

          expect(result).toBeCloseTo(expected, 10);
          // 结果应在 0-100 范围内
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        },
      ),
      {numRuns: 100},
    );
  });
});

// ============================================================
// Property 4: 下班时间计算正确性
// **Feature: personal-achievement-poster, Property 4: 下班时间计算正确性**
// **Validates: Requirements 4.3**
// ============================================================
describe('Property 4: 下班时间计算正确性', () => {
  it('对任意下班时间和加班时长，计算结果等于基础时间加上加班时长', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 0, max: 23}), // 基础小时
        fc.integer({min: 0, max: 59}), // 基础分钟
        fc.integer({min: 0, max: 12}), // 加班时长（整数小时，简化测试）
        (baseHour, baseMinute, overtimeHours) => {
          const result = computeOffWorkTime(baseHour, baseMinute, overtimeHours);

          // 手动计算期望值
          const totalMinutes = baseHour * 60 + baseMinute + overtimeHours * 60;
          const expectedHour = Math.floor(totalMinutes / 60);
          const expectedMinute = totalMinutes % 60;

          expect(result.hour).toBe(expectedHour);
          expect(result.minute).toBe(expectedMinute);
        },
      ),
      {numRuns: 100},
    );
  });
});

// ============================================================
// Property 5: 百分比颜色选择正确性
// **Feature: personal-achievement-poster, Property 5: 百分比颜色选择正确性**
// **Validates: Requirements 1.7**
// ============================================================
describe('Property 5: 百分比颜色选择正确性', () => {
  it('对任意百分比值，≤50% 返回红色，>50% 返回白色', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 0, max: 100}),
        (percentage) => {
          const result = getPercentageColor(percentage);
          if (percentage <= 50) {
            expect(result).toBe(OVERTIME_PERCENTAGE_COLOR);
          } else {
            expect(result).toBe(ONTIME_PERCENTAGE_COLOR);
          }
        },
      ),
      {numRuns: 100},
    );
  });
});

// ============================================================
// Property 6: 海报数据序列化 round-trip
// **Feature: personal-achievement-poster, Property 6: 海报数据序列化 round-trip**
// **Validates: Requirements 7.1, 7.2**
// ============================================================
describe('Property 6: 海报数据序列化 round-trip', () => {
  // 生成随机的可序列化海报数据
  const arbSerializableData: fc.Arbitrary<SerializableAchievementPosterData> =
    fc.record({
      username: fc.string({minLength: 1, maxLength: 20}),
      avatarId: fc.string({maxLength: 10}),
      rankPercentage: fc.double({min: 0, max: 100, noNaN: true}),
      participantCount: fc.nat({max: 100000}),
      isOnTime: fc.boolean(),
      caption: fc.string({minLength: 1, maxLength: 50}),
      percentageText: fc.string({minLength: 1, maxLength: 10}),
      participantText: fc.string({minLength: 1, maxLength: 20}),
      prefixText: fc.constantFrom('你早于', '你晚于'),
    });

  it('对任意有效海报数据，serialize 后 deserialize 应得到等价结果', () => {
    fc.assert(
      fc.property(arbSerializableData, (data) => {
        const json = serialize(data);
        const restored = deserialize(json);
        expect(restored).toEqual(data);
      }),
      {numRuns: 100},
    );
  });
});

// ============================================================
// Property 7: 百分比格式化正确性
// **Feature: personal-achievement-poster, Property 7: 百分比格式化正确性**
// **Validates: Requirements 7.3**
// ============================================================
describe('Property 7: 百分比格式化正确性', () => {
  it('对任意 0-100 浮点数，formatPercentage 输出解析回来等于四舍五入值', () => {
    fc.assert(
      fc.property(
        fc.double({min: 0, max: 100, noNaN: true}),
        (value) => {
          const formatted = formatPercentage(value);
          // 格式应为 "XX%"
          expect(formatted).toMatch(/^\d+%$/);
          // 解析回来应等于四舍五入值
          const parsed = parseInt(formatted.replace('%', ''), 10);
          expect(parsed).toBe(Math.round(value));
        },
      ),
      {numRuns: 100},
    );
  });
});

// ============================================================
// Property 8: 参与人数格式化正确性
// **Feature: personal-achievement-poster, Property 8: 参与人数格式化正确性**
// **Validates: Requirements 7.4**
// ============================================================
describe('Property 8: 参与人数格式化正确性', () => {
  it('对任意非负整数，formatParticipantCount 去除分隔符后等于原值', () => {
    fc.assert(
      fc.property(
        fc.nat({max: 10000000}),
        (count) => {
          const formatted = formatParticipantCount(count);
          // 去除千分位分隔符后解析
          const parsed = parseInt(formatted.replace(/,/g, ''), 10);
          expect(parsed).toBe(count);
        },
      ),
      {numRuns: 100},
    );
  });
});
