/**
 * 属性测试：城市选中 toggle
 *
 * **Feature: province-city-drilldown, Property 2: 城市选中 toggle**
 * **Validates: Requirements 2.2**
 *
 * 对任意城市名称，连续点击两次同一城市，选中状态应恢复为 null（未选中）
 * toggle 行为：select(select(null, city), city) = null
 */

import * as fc from 'fast-check';

/**
 * 模拟 ProvinceMapChart 中的城市选中 toggle 逻辑
 * 与组件中 handleCityPress 的实现一致：
 *   setSelectedCity(prev => (prev === name ? null : name))
 */
function toggleCity(
  currentSelected: string | null,
  cityName: string,
): string | null {
  return currentSelected === cityName ? null : cityName;
}

describe('省份地级市下钻 - 城市选中 toggle 属性测试', () => {
  /**
   * **Feature: province-city-drilldown, Property 2: 城市选中 toggle**
   * **Validates: Requirements 2.2**
   *
   * 对任意城市名称，从未选中状态点击该城市两次，应恢复为未选中
   */
  it('连续点击同一城市两次，选中状态恢复为 null', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1, maxLength: 30}),
        cityName => {
          // 初始状态：未选中
          const state0: string | null = null;

          // 第一次点击：选中该城市
          const state1 = toggleCity(state0, cityName);
          expect(state1).toBe(cityName);

          // 第二次点击：取消选中，恢复为 null
          const state2 = toggleCity(state1, cityName);
          expect(state2).toBeNull();
        },
      ),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: province-city-drilldown, Property 2: 城市选中 toggle**
   * **Validates: Requirements 2.2**
   *
   * 对任意两个不同城市名称，选中城市 A 后点击城市 B，应切换到城市 B
   */
  it('选中城市 A 后点击不同城市 B，切换到城市 B', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1, maxLength: 30}),
        fc.string({minLength: 1, maxLength: 30}),
        (cityA, cityB) => {
          // 跳过两个城市名称相同的情况
          fc.pre(cityA !== cityB);

          // 选中城市 A
          const state1 = toggleCity(null, cityA);
          expect(state1).toBe(cityA);

          // 点击城市 B，应切换到 B
          const state2 = toggleCity(state1, cityB);
          expect(state2).toBe(cityB);
        },
      ),
      {numRuns: 100},
    );
  });
});
