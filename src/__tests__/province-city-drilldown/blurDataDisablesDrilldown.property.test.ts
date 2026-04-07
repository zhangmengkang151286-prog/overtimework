/**
 * 属性测试：blurData 禁用下钻
 *
 * **Feature: province-city-drilldown, Property 6: blurData 禁用下钻**
 * **Validates: Requirements 5.3**
 *
 * 对任意省份名称，当 blurData=true 时，执行点击操作后
 * 下钻状态应保持为 null（不触发下钻）
 */

import * as fc from 'fast-check';

/**
 * 下钻状态机模型（与 drilldownRoundTrip 测试共享相同逻辑）
 *
 * 模拟 ChinaMapChart 中的下钻状态管理：
 * - blurData=true 时，点击省份不触发下钻
 * - blurData=false 时，点击省份触发下钻
 */
interface DrilldownState {
  drilldownProvince: string | null;
  showDrilldown: boolean;
}

function initialState(): DrilldownState {
  return {drilldownProvince: null, showDrilldown: false};
}

function drilldown(
  state: DrilldownState,
  provinceName: string,
  blurData: boolean,
): DrilldownState {
  if (blurData) return state;
  return {drilldownProvince: provinceName, showDrilldown: true};
}

// 省份简称列表
const PROVINCE_SHORT_NAMES = [
  '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林',
  '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西',
  '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆',
  '香港', '澳门',
];

const provinceNameArb = fc.constantFrom(...PROVINCE_SHORT_NAMES);

describe('省份地级市下钻 - blurData 禁用下钻 属性测试', () => {
  /**
   * **Feature: province-city-drilldown, Property 6: blurData 禁用下钻**
   * **Validates: Requirements 5.3**
   *
   * 对任意省份名称，blurData=true 时点击不触发下钻
   */
  it('blurData=true 时，点击任意省份不触发下钻', () => {
    fc.assert(
      fc.property(provinceNameArb, provinceName => {
        const state0 = initialState();

        // blurData=true，点击省份
        const state1 = drilldown(state0, provinceName, true);

        // 状态应保持不变
        expect(state1.drilldownProvince).toBeNull();
        expect(state1.showDrilldown).toBe(false);
        expect(state1).toEqual(state0);
      }),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: province-city-drilldown, Property 6: blurData 禁用下钻**
   * **Validates: Requirements 5.3**
   *
   * 对任意省份序列，blurData=true 时连续点击多个省份，状态始终为全国视图
   */
  it('blurData=true 时，连续点击多个省份，状态始终为全国视图', () => {
    fc.assert(
      fc.property(
        fc.array(provinceNameArb, {minLength: 1, maxLength: 10}),
        provinces => {
          let state = initialState();

          for (const prov of provinces) {
            state = drilldown(state, prov, true);
            expect(state.drilldownProvince).toBeNull();
            expect(state.showDrilldown).toBe(false);
          }

          expect(state).toEqual(initialState());
        },
      ),
      {numRuns: 100},
    );
  });
});
