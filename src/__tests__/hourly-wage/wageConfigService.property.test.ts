/**
 * 时薪核心模块 - wageConfigService 属性测试
 *
 * **Feature: hourly-wage-core, Property 1: 配置存储往返**
 * **Validates: Requirements 1.2**
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getMonthlySalary, setMonthlySalary} from '../../services/wageConfigService';

describe('wageConfigService property tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  /**
   * **Feature: hourly-wage-core, Property 1: 配置存储往返**
   * **Validates: Requirements 1.2**
   *
   * 对任意合法的月薪值 s（正数）和任意 userId，
   * 将配置写入 AsyncStorage 后再读出，读出结果的 monthlySalary 应等于 s。
   */
  it('Property 1: 写入月薪后读出的 monthlySalary 等于写入值', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成正整数月薪 [1, 1_000_000]
        fc.integer({min: 1, max: 1_000_000}),
        // 生成非空 userId（字母数字组合）
        fc.stringMatching(/^[a-z0-9]{1,36}$/),
        async (salary, userId) => {
          // 写入
          await setMonthlySalary(userId, salary);
          // 读出
          const record = await getMonthlySalary(userId);
          // 断言
          expect(record).not.toBeNull();
          expect(record!.monthlySalary).toBe(salary);
          // updatedAt 应为合法 ISO 时间
          expect(new Date(record!.updatedAt).getTime()).not.toBeNaN();
        },
      ),
      {numRuns: 100},
    );
  });
});
