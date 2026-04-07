/**
 * 属性测试：下钻-返回 round trip
 *
 * **Feature: province-city-drilldown, Property 1: 下钻-返回 round trip**
 * **Validates: Requirements 1.1, 1.3**
 *
 * 对任意省份名称，执行下钻操作后再执行返回操作，
 * 组件的下钻状态应恢复为 null（全国视图）
 */

import * as fc from 'fast-check';

/**
 * 下钻状态机模型
 *
 * 模拟 ChinaMapChart 中的下钻状态管理逻辑：
 * - drilldown(null, province) → province（进入下钻）
 * - back(province) → null（返回全国视图）
 *
 * 对应组件中的实现：
 *   handleProvincePress: setDrilldownProvince(name)
 *   handleDrilldownBack: setDrilldownProvince(null)
 */
interface DrilldownState {
  drilldownProvince: string | null;
  showDrilldown: boolean;
}

// 初始状态：全国视图
function initialState(): DrilldownState {
  return {drilldownProvince: null, showDrilldown: false};
}

// 下钻操作：点击省份进入地级市视图（仅在 blurData=false 时生效）
function drilldown(
  state: DrilldownState,
  provinceName: string,
  blurData: boolean,
): DrilldownState {
  if (blurData) return state; // blurData 模式下不触发下钻
  return {drilldownProvince: provinceName, showDrilldown: true};
}

// 返回操作：从地级市视图返回全国视图
function back(state: DrilldownState): DrilldownState {
  return {drilldownProvince: null, showDrilldown: false};
}

// 省份简称列表（与 ChinaMapChart 中 PROVINCE_NAME_MAP 的值一致）
const PROVINCE_SHORT_NAMES = [
  '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林',
  '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西',
  '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆',
  '香港', '澳门',
];

// 生成合法的省份简称
const provinceNameArb = fc.constantFrom(...PROVINCE_SHORT_NAMES);

describe('省份地级市下钻 - 下钻-返回 round trip 属性测试', () => {
  /**
   * **Feature: province-city-drilldown, Property 1: 下钻-返回 round trip**
   * **Validates: Requirements 1.1, 1.3**
   *
   * 对任意省份名称，下钻后返回，状态恢复为初始全国视图
   */
  it('下钻到任意省份后返回，状态恢复为全国视图（null）', () => {
    fc.assert(
      fc.property(provinceNameArb, provinceName => {
        const state0 = initialState();

        // 下钻到该省份
        const state1 = drilldown(state0, provinceName, false);
        expect(state1.drilldownProvince).toBe(provinceName);
        expect(state1.showDrilldown).toBe(true);

        // 返回全国视图
        const state2 = back(state1);
        expect(state2.drilldownProvince).toBeNull();
        expect(state2.showDrilldown).toBe(false);

        // 与初始状态等价
        expect(state2).toEqual(state0);
      }),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: province-city-drilldown, Property 1: 下钻-返回 round trip**
   * **Validates: Requirements 1.1, 1.3**
   *
   * 对任意省份序列，连续下钻-返回多次，最终状态始终为全国视图
   */
  it('连续多次下钻-返回，最终状态始终为全国视图', () => {
    fc.assert(
      fc.property(
        fc.array(provinceNameArb, {minLength: 1, maxLength: 10}),
        provinces => {
          let state = initialState();

          for (const prov of provinces) {
            // 下钻
            state = drilldown(state, prov, false);
            expect(state.drilldownProvince).toBe(prov);

            // 返回
            state = back(state);
            expect(state.drilldownProvince).toBeNull();
          }

          // 最终状态等于初始状态
          expect(state).toEqual(initialState());
        },
      ),
      {numRuns: 100},
    );
  });
});
