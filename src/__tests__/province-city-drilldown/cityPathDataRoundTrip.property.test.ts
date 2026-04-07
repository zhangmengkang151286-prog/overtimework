/**
 * 属性测试：地级市 SVG 数据 round trip
 *
 * **Feature: province-city-drilldown, Property 3: 地级市 SVG 数据 round trip**
 * **Validates: Requirements 3.3, 3.4**
 *
 * 对任意合法的 CityPathData 对象（包含 name、path、cx、cy），
 * 序列化为 JSON 字符串再反序列化，应还原出与原始对象等价的数据
 */

import * as fc from 'fast-check';
import {CityPathData, ProvinceMapData} from '../../data/provinceMapPaths/index';

// 生成合法的 SVG path 片段（M + L + Z 格式，与脚本生成的格式一致）
const svgPathArb: fc.Arbitrary<string> = fc
  .array(
    fc.tuple(
      fc.float({min: 0, max: 600, noNaN: true}),
      fc.float({min: 0, max: 500, noNaN: true}),
    ),
    {minLength: 3, maxLength: 20},
  )
  .map(coords => {
    const parts = coords.map((c, i) => {
      const x = c[0].toFixed(1);
      const y = c[1].toFixed(1);
      return i === 0 ? 'M' + x + ',' + y : ' L' + x + ',' + y;
    });
    return parts.join('') + ' Z';
  });

// 生成合法的 CityPathData
const cityPathDataArb: fc.Arbitrary<CityPathData> = fc.record({
  name: fc.string({minLength: 1, maxLength: 20}),
  path: svgPathArb,
  cx: fc.float({min: 0, max: 600, noNaN: true}).map(v => +v.toFixed(1)),
  cy: fc.float({min: 0, max: 500, noNaN: true}).map(v => +v.toFixed(1)),
});

// 生成合法的 ProvinceMapData
const provinceMapDataArb: fc.Arbitrary<ProvinceMapData> = fc.record({
  id: fc.stringMatching(/^[a-z]{2,15}$/),
  name: fc.string({minLength: 1, maxLength: 10}),
  adcode: fc.integer({min: 100000, max: 900000}),
  viewBox: fc.constant('0 0 580 500'),
  cities: fc.array(cityPathDataArb, {minLength: 1, maxLength: 10}),
});

describe('省份地级市下钻 - 地级市 SVG 数据 round trip 属性测试', () => {
  /**
   * **Feature: province-city-drilldown, Property 3: 地级市 SVG 数据 round trip**
   * **Validates: Requirements 3.3, 3.4**
   */
  it('CityPathData 序列化再反序列化后数据一致', () => {
    fc.assert(
      fc.property(cityPathDataArb, original => {
        const json = JSON.stringify(original);
        const restored: CityPathData = JSON.parse(json);

        expect(restored.name).toBe(original.name);
        expect(restored.path).toBe(original.path);
        expect(restored.cx).toBeCloseTo(original.cx, 5);
        expect(restored.cy).toBeCloseTo(original.cy, 5);
      }),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: province-city-drilldown, Property 3: 地级市 SVG 数据 round trip**
   * **Validates: Requirements 3.3, 3.4**
   */
  it('ProvinceMapData 序列化再反序列化后数据一致', () => {
    fc.assert(
      fc.property(provinceMapDataArb, original => {
        const json = JSON.stringify(original);
        const restored: ProvinceMapData = JSON.parse(json);

        // 省份元数据一致
        expect(restored.id).toBe(original.id);
        expect(restored.name).toBe(original.name);
        expect(restored.adcode).toBe(original.adcode);
        expect(restored.viewBox).toBe(original.viewBox);

        // 城市数量一致
        expect(restored.cities.length).toBe(original.cities.length);

        // 每个城市数据一致
        for (let i = 0; i < original.cities.length; i++) {
          const orig = original.cities[i];
          const rest = restored.cities[i];
          expect(rest.name).toBe(orig.name);
          expect(rest.path).toBe(orig.path);
          expect(rest.cx).toBeCloseTo(orig.cx, 5);
          expect(rest.cy).toBeCloseTo(orig.cy, 5);
        }
      }),
      {numRuns: 100},
    );
  });
});
