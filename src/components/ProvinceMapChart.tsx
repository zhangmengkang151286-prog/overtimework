import React, {useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Svg, {Path, G} from 'react-native-svg';
import {getProvinceMapDataById} from '../data/provinceMapPaths';
import {getHeatColor} from './ChinaMapChart';
import {getTheme} from '../theme';
import {DimensionItem} from '../types';

/**
 * ProvinceMapChart - 省份地级市地图热力图组件
 *
 * 展示某个省份内各地级市的加班热力着色
 * 复用 ChinaMapChart 的 getHeatColor 色阶函数和 tooltip 样式
 * 支持点击地级市显示/隐藏详情浮层
 */

interface ProvinceMapChartProps {
  provinceId: string;       // 省份 ID（如 'zhejiang'）
  provinceName: string;     // 省份简称（如 '浙江'）
  data: DimensionItem[];    // 地级市统计数据
  theme: 'light' | 'dark';
  onBack: () => void;       // 返回全国视图回调
  provinceSummary?: DimensionItem | null; // 省份汇总数据
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = SCREEN_WIDTH - 32;

export const ProvinceMapChart: React.FC<ProvinceMapChartProps> = ({
  provinceId,
  provinceName,
  data,
  theme,
  onBack,
  provinceSummary,
}) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const tc = getTheme(theme).colors;

  // 加载省份地级市 SVG 数据
  const provinceMapData = useMemo(() => {
    return getProvinceMapDataById(provinceId);
  }, [provinceId]);

  // 构建城市名称 -> 数据的映射
  const dataMap = useMemo(() => {
    const map: Record<string, DimensionItem> = {};
    data.forEach(item => {
      map[item.name] = item;
    });
    return map;
  }, [data]);

  // 选中城市的数据
  const selectedData = useMemo(() => {
    if (!selectedCity) return null;
    return dataMap[selectedCity] || null;
  }, [selectedCity, dataMap]);

  // 根据 viewBox 计算地图高度
  const mapHeight = useMemo(() => {
    if (!provinceMapData) return MAP_WIDTH;
    const parts = provinceMapData.viewBox.split(' ').map(Number);
    const vbWidth = parts[2];
    const vbHeight = parts[3];
    return MAP_WIDTH * (vbHeight / vbWidth);
  }, [provinceMapData]);

  const handleCityPress = useCallback((name: string) => {
    setSelectedCity(prev => (prev === name ? null : name));
  }, []);

  // 省份无地图数据
  if (!provinceMapData) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, {borderBottomColor: tc.border}]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text size="sm" color={isDark ? '$trueGray300' : '$trueGray700'}>
              ← 返回
            </Text>
          </TouchableOpacity>
          <Text size="md" bold color={isDark ? '$white' : '$black'}>
            {provinceName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text size="sm" color={isDark ? '$trueGray500' : '$trueGray400'}>
            该省份暂无地图数据
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {width: MAP_WIDTH}]}>
      {/* 顶部：省份名称 + 返回按钮 */}
      <View style={[styles.header, {borderBottomColor: tc.border}]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text size="sm" color={isDark ? '$trueGray300' : '$trueGray700'}>
            返回
          </Text>
        </TouchableOpacity>
        <Text size="md" bold color={isDark ? '$white' : '$black'}>
          {provinceName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 省份汇总数据 */}
      {provinceSummary && (
        <Text size="xs" color={tc.textTertiary} style={styles.summaryText}>
          总人数 {provinceSummary.totalCount} · 加班 {provinceSummary.overtimeCount} · 准时下班 {provinceSummary.onTimeCount}
        </Text>
      )}

      {/* 地级市地图 SVG */}
      <Svg
        width={MAP_WIDTH}
        height={mapHeight}
        viewBox={provinceMapData.viewBox}
        style={[styles.svg, {backgroundColor: tc.background}]}>
        {provinceMapData.cities.map(city => {
          const item = dataMap[city.name];
          const ratio = item?.overtimeRatio ?? 0;
          const hasData = !!item;
          const isSelected = selectedCity === city.name;

          const fillColor = hasData
            ? getHeatColor(ratio, isDark)
            : tc.background;

          const strokeColor = isSelected
            ? tc.text
            : tc.textTertiary;

          return (
            <G key={city.name} onPress={() => handleCityPress(city.name)}>
              <Path
                d={city.path}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 1.5 : 0.4}
                strokeLinejoin="round"
              />
            </G>
          );
        })}
      </Svg>

      {/* 选中城市详情浮层 */}
      {selectedCity && (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: tc.background,
              borderColor: tc.border,
            },
          ]}>
          <Text size="sm" bold color={tc.text} style={styles.tooltipTitle}>
            {selectedCity}
          </Text>
          {selectedData ? (
            <>
              <Text size="xs" color={tc.textTertiary}>
                总人数：{selectedData.totalCount}
              </Text>
              <Text size="xs" color={tc.textTertiary}>
                准时下班：{selectedData.onTimeCount}
              </Text>
              <Text size="xs" color={tc.textTertiary}>
                加班：{selectedData.overtimeCount}
              </Text>
            </>
          ) : (
            <Text size="xs" color={tc.textDisabled}>
              暂无数据
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 32, // 与返回箭头宽度平衡，使标题居中
  },
  summaryText: {
    textAlign: 'center',
    paddingVertical: 4,
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
    top: 48, // 在 header 下方
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
});
