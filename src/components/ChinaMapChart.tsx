import React, {useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Svg, {Path, G} from 'react-native-svg';
import {CHINA_PROVINCES} from '../data/chinaMapPaths';
import {DimensionItem} from '../types';

/**
 * ChinaMapChart - 中国地图热力图组件（纯 SVG 版本）
 *
 * 使用 react-native-svg + 真实 GeoJSON 转换的 SVG path 绘制
 * 无需 WebView、无需网络加载，启动即渲染
 * 每个省份根据加班比例着色，支持点击查看详情
 */

interface ChinaMapChartProps {
  data: DimensionItem[];
  theme: 'light' | 'dark';
  blurData?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = SCREEN_WIDTH - 32;
// viewBox 是 "10 10 560 480"，宽高比 560:480 ≈ 1.167
const MAP_HEIGHT = MAP_WIDTH / 1.167;

// 省份全称 → 简称映射（数据库存全称，地图用简称）
const PROVINCE_NAME_MAP: Record<string, string> = {
  '北京市': '北京', '天津市': '天津', '上海市': '上海', '重庆市': '重庆',
  '河北省': '河北', '山西省': '山西', '辽宁省': '辽宁', '吉林省': '吉林',
  '黑龙江省': '黑龙江', '江苏省': '江苏', '浙江省': '浙江', '安徽省': '安徽',
  '福建省': '福建', '江西省': '江西', '山东省': '山东', '河南省': '河南',
  '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东', '海南省': '海南',
  '四川省': '四川', '贵州省': '贵州', '云南省': '云南', '陕西省': '陕西',
  '甘肃省': '甘肃', '青海省': '青海', '台湾省': '台湾',
  '内蒙古自治区': '内蒙古', '广西壮族自治区': '广西',
  '西藏自治区': '西藏', '宁夏回族自治区': '宁夏',
  '新疆维吾尔自治区': '新疆',
  '香港特别行政区': '香港', '澳门特别行政区': '澳门',
};

/**
 * 根据加班比例获取填充颜色（Robinhood 风格）
 * ratio > 0.5 → 红色 #FF5000 方向（色相19°，加班多）
 * ratio < 0.5 → 绿色 #00C805 方向（色相122°，准时下班多）
 * ratio ≈ 0.5 → 低饱和度中性色
 * 无数据 → 灰色
 */
export const getHeatColor = (ratio: number, isDark: boolean): string => {
  // 将 ratio 映射到 -1 ~ +1 范围，0.5 为中心
  const t = (ratio - 0.5) * 2; // -1(全准时) ~ +1(全加班)
  const intensity = Math.abs(t); // 0~1，越大颜色越浓

  if (t > 0) {
    // 加班偏多 → Robinhood 红色（色相19°）
    const hue = 19;
    const saturation = Math.round(30 + intensity * 70); // 30%~100%
    const lightness = isDark
      ? Math.round(8 + intensity * 32)  // 8%~40%
      : Math.round(95 - intensity * 45); // 95%~50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  } else {
    // 准时偏多 → Robinhood 绿色（色相122°）
    const hue = 122;
    const saturation = Math.round(30 + intensity * 70); // 30%~100%
    const lightness = isDark
      ? Math.round(8 + intensity * 31)  // 8%~39%
      : Math.round(95 - intensity * 45); // 95%~50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
};

export const ChinaMapChart: React.FC<ChinaMapChartProps> = ({
  data,
  theme,
  blurData = false,
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const isDark = theme === 'dark';

  // 构建省份简称 -> 数据的映射（数据库存全称，地图用简称）
  const dataMap = useMemo(() => {
    const map: Record<string, DimensionItem> = {};
    data.forEach(item => {
      const shortName = PROVINCE_NAME_MAP[item.name] || item.name;
      map[shortName] = item;
    });
    return map;
  }, [data]);

  // 选中省份的数据
  const selectedData = useMemo(() => {
    if (!selectedProvince) return null;
    return dataMap[selectedProvince] || null;
  }, [selectedProvince, dataMap]);

  const handleProvincePress = useCallback((name: string) => {
    setSelectedProvince(prev => (prev === name ? null : name));
  }, []);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text size="sm" color={isDark ? '$trueGray500' : '$trueGray400'}>
          该时段暂无省份数据
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 地图 SVG - 使用更紧凑的 viewBox 裁剪空白区域 */}
      <Svg
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        viewBox="10 10 560 480"
        style={styles.svg}>
        {CHINA_PROVINCES.map(province => {
          const item = dataMap[province.name];
          const ratio = item?.overtimeRatio ?? 0;
          const hasData = !!item;
          const isSelected = selectedProvince === province.name;

          const fillColor = blurData
            ? (isDark ? '#1a1a2e' : '#e0e0e0')
            : hasData
              ? getHeatColor(ratio, isDark)
              : (isDark ? '#000000' : '#ddd');

          const strokeColor = isSelected
            ? '#FFFFFF'
            : (isDark ? '#ffffff' : '#999');

          return (
            <G key={province.name} onPress={() => handleProvincePress(province.name)}>
              <Path
                d={province.path}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 1.5 : 0.4}
                strokeLinejoin="round"
              />
            </G>
          );
        })}
      </Svg>

      {/* 选中省份详情 */}
      {selectedProvince && !blurData && (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: '#000000',
              borderColor: '#333',
            },
          ]}>
          <Text size="sm" bold color="$white" style={styles.tooltipTitle}>
            {selectedProvince}
          </Text>
          {selectedData ? (
            <>
              <Text size="xs" color="$trueGray400">
                总人数：{selectedData.totalCount}
              </Text>
              <Text size="xs" color="$trueGray400">
                准时下班：{selectedData.totalCount - selectedData.overtimeCount}
              </Text>
              <Text size="xs" color="$trueGray400">
                加班：{selectedData.overtimeCount}
              </Text>
            </>
          ) : (
            <Text size="xs" color="$trueGray500">
              暂无数据
            </Text>
          )}
        </View>
      )}

      {/* 图例已移至 DataVisualization 统一渲染 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: MAP_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  svg: {
    backgroundColor: '#000000',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  tooltip: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 140,
  },
  tooltipTitle: {
    marginBottom: 4,
  },
  legendContainer: {},
  legendBar: {},
  legendBlock: {},
});
