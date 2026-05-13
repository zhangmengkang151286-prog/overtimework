/**
 * 时薪核心模块 - wageCalc 单元测试
 * 覆盖默认配置和极端合法配置下的关键计算值
 */

import {
  computeStandardHours,
  computeDailySalary,
  computeNominalHourlyRate,
  validateWageConfig,
  WORK_DAYS_PER_MONTH,
  LUNCH_BREAK_HOURS,
} from '../../utils/wageCalc';
import {WageConfig} from '../../types/hourly-wage';

describe('wageCalc 单元测试', () => {
  // 默认配置：09:00-18:00，月薪 15000
  const defaultConfig: WageConfig = {
    monthlySalary: 15000,
    workStartTime: '09:00',
    workEndTime: '18:00',
  };

  describe('computeStandardHours', () => {
    it('默认 09:00-18:00 应返回 8 小时', () => {
      expect(computeStandardHours(defaultConfig)).toBe(8);
    });

    it('08:30-17:30 应返回 8 小时', () => {
      const config: WageConfig = {
        monthlySalary: 10000,
        workStartTime: '08:30',
        workEndTime: '17:30',
      };
      expect(computeStandardHours(config)).toBe(8);
    });

    it('09:00-21:00 应返回 11 小时', () => {
      const config: WageConfig = {
        monthlySalary: 10000,
        workStartTime: '09:00',
        workEndTime: '21:00',
      };
      expect(computeStandardHours(config)).toBe(11);
    });
  });

  describe('computeDailySalary', () => {
    it('月薪 15000 日薪约 689.66', () => {
      const result = computeDailySalary(defaultConfig);
      expect(result).toBeCloseTo(15000 / 21.75, 2);
    });

    it('月薪 1 元日薪约 0.046', () => {
      const config: WageConfig = {...defaultConfig, monthlySalary: 1};
      const result = computeDailySalary(config);
      expect(result).toBeCloseTo(1 / 21.75, 4);
    });
  });

  describe('computeNominalHourlyRate', () => {
    it('默认配置名义时薪约 86.21', () => {
      const result = computeNominalHourlyRate(defaultConfig);
      // 15000 / 21.75 / 8 ≈ 86.21
      expect(result).toBeCloseTo(15000 / 21.75 / 8, 2);
    });

    it('月薪 1 元、09:00-18:00 名义时薪约 0.0057', () => {
      const config: WageConfig = {...defaultConfig, monthlySalary: 1};
      const result = computeNominalHourlyRate(config);
      expect(result).toBeCloseTo(1 / 21.75 / 8, 4);
    });

    it('22 小时工作制（00:00-23:00）名义时薪', () => {
      const config: WageConfig = {
        monthlySalary: 10000,
        workStartTime: '00:00',
        workEndTime: '23:00',
      };
      // 标准工时 = 23 - 0 - 1 = 22
      const result = computeNominalHourlyRate(config);
      expect(result).toBeCloseTo(10000 / 21.75 / 22, 2);
    });
  });

  describe('validateWageConfig', () => {
    it('合法配置返回 null', () => {
      expect(validateWageConfig(defaultConfig)).toBeNull();
    });

    it('月薪为 0 返回 INVALID_SALARY', () => {
      expect(
        validateWageConfig({...defaultConfig, monthlySalary: 0}),
      ).toBe('INVALID_SALARY');
    });

    it('月薪为负数返回 INVALID_SALARY', () => {
      expect(
        validateWageConfig({...defaultConfig, monthlySalary: -100}),
      ).toBe('INVALID_SALARY');
    });

    it('月薪为 NaN 返回 INVALID_SALARY', () => {
      expect(
        validateWageConfig({...defaultConfig, monthlySalary: NaN}),
      ).toBe('INVALID_SALARY');
    });

    it('月薪为 Infinity 返回 INVALID_SALARY', () => {
      expect(
        validateWageConfig({...defaultConfig, monthlySalary: Infinity}),
      ).toBe('INVALID_SALARY');
    });

    it('下班时间等于上班时间返回 INVALID_TIME_ORDER', () => {
      expect(
        validateWageConfig({
          monthlySalary: 10000,
          workStartTime: '09:00',
          workEndTime: '09:00',
        }),
      ).toBe('INVALID_TIME_ORDER');
    });

    it('下班时间早于上班时间返回 INVALID_TIME_ORDER', () => {
      expect(
        validateWageConfig({
          monthlySalary: 10000,
          workStartTime: '18:00',
          workEndTime: '09:00',
        }),
      ).toBe('INVALID_TIME_ORDER');
    });

    it('扣除午休后不足 1 小时返回 INSUFFICIENT_WORK_HOURS', () => {
      // 09:00-10:30 → 净工时 = 1.5 - 1 = 0.5 < 1
      expect(
        validateWageConfig({
          monthlySalary: 10000,
          workStartTime: '09:00',
          workEndTime: '10:30',
        }),
      ).toBe('INSUFFICIENT_WORK_HOURS');
    });

    it('扣除午休后刚好 1 小时返回 null', () => {
      // 09:00-11:00 → 净工时 = 2 - 1 = 1 ≥ 1
      expect(
        validateWageConfig({
          monthlySalary: 10000,
          workStartTime: '09:00',
          workEndTime: '11:00',
        }),
      ).toBeNull();
    });
  });
});
