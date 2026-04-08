import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Text as RNText,
} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Svg, {Path, G} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {CHINA_PROVINCES} from '../data/chinaMapPaths';
import {ProvinceMapChart} from './ProvinceMapChart';
import {getTheme} from '../theme';
import {typography} from '../theme/typography';
import {easing} from '../theme/animations';
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
  cityData?: Record<string, DimensionItem[]>; // 省份全称 → 地级市数据映射
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

// 省份简称 → ID 映射（用于下钻时加载地级市 SVG 数据）
const PROVINCE_SHORT_TO_ID: Record<string, string> = {
  '北京': 'beijing', '天津': 'tianjin', '河北': 'hebei', '山西': 'shanxi',
  '内蒙古': 'neimenggu', '辽宁': 'liaoning', '吉林': 'jilin', '黑龙江': 'heilongjiang',
  '上海': 'shanghai', '江苏': 'jiangsu', '浙江': 'zhejiang', '安徽': 'anhui',
  '福建': 'fujian', '江西': 'jiangxi', '山东': 'shandong', '河南': 'henan',
  '湖北': 'hubei', '湖南': 'hunan', '广东': 'guangdong', '广西': 'guangxi',
  '海南': 'hainan', '重庆': 'chongqing', '四川': 'sichuan', '贵州': 'guizhou',
  '云南': 'yunnan', '西藏': 'xizang', '陕西': 'shaanxi', '甘肃': 'gansu',
  '青海': 'qinghai', '宁夏': 'ningxia', '新疆': 'xinjiang',
  '香港': 'hongkong', '澳门': 'macau', '台湾': 'taiwan',
};

// 省份简称 → 全称映射（用于从 cityData 中查找数据）
const PROVINCE_SHORT_TO_FULL: Record<string, string> = {};
Object.entries(PROVINCE_NAME_MAP).forEach(([full, short]) => {
  PROVINCE_SHORT_TO_FULL[short] = full;
});

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
  cityData,
  theme,
  blurData = false,
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  // 省份选择器弹窗
  const [showPicker, setShowPicker] = useState(false);
  // 下钻状态：当前下钻的省份简称，null 表示全国视图
  const [drilldownProvince, setDrilldownProvince] = useState<string | null>(null);
  // 用于控制实际渲染内容的切换（动画完成后再切换）
  const [showDrilldown, setShowDrilldown] = useState(false);
  const isDark = theme === 'dark';
  const tc = getTheme(theme).colors;

  // 淡入淡出动画 opacity（200-400ms 范围，使用 300ms）
  const fadeAnim = useSharedValue(1);
  const FADE_DURATION = 300; // 200-400ms 之间

  // 构建省份简称 -> 数据的映射（数据库存全称，地图用简称）
  const dataMap = useMemo(() => {
    const map: Record<string, DimensionItem> = {};
    data.forEach(item => {
      const shortName = PROVINCE_NAME_MAP[item.name] || item.name;
      map[shortName] = item;
    });
    return map;
  }, [data]);

  // 省份选择器列表（所有有 ID 映射的省份，按拼音排序）
  const provinceList = useMemo(() => {
    return Object.keys(PROVINCE_SHORT_TO_ID).sort();
  }, []);

  // 选中省份的数据
  const selectedData = useMemo(() => {
    if (!selectedProvince) return null;
    return dataMap[selectedProvince] || null;
  }, [selectedProvince, dataMap]);

  // 下钻省份对应的地级市数据
  const drilldownCityData = useMemo(() => {
    if (!drilldownProvince || !cityData) return [];
    const fullName = PROVINCE_SHORT_TO_FULL[drilldownProvince];
    if (fullName && cityData[fullName]) return cityData[fullName];
    return [];
  }, [drilldownProvince, cityData]);

  // 下钻省份对应的 ID
  const drilldownProvinceId = useMemo(() => {
    if (!drilldownProvince) return '';
    return PROVINCE_SHORT_TO_ID[drilldownProvince] || '';
  }, [drilldownProvince]);

  // 延迟淡入辅助函数（在 JS 线程执行，避免 SVG 重渲染闪烁）
  const delayedFadeIn = useCallback(() => {
    setTimeout(() => {
      fadeAnim.value = withTiming(1, {
        duration: FADE_DURATION * 0.6,
        easing: easing.easeOut,
      });
    }, 50);
  }, [fadeAnim]);

  const handleProvincePress = useCallback((name: string) => {
    if (blurData) return; // blurData 模式下禁用下钻

    // 执行下钻：淡出 → 切换内容 → 延迟淡入
    setSelectedProvince(null);
    fadeAnim.value = withTiming(0, {
      duration: FADE_DURATION * 0.6,
      easing: easing.easeIn,
    }, (finished) => {
      if (finished) {
        runOnJS(setDrilldownProvince)(name);
        runOnJS(setShowDrilldown)(true);
        runOnJS(delayedFadeIn)();
      }
    });
  }, [blurData, fadeAnim, delayedFadeIn]);

  const handleDrilldownBack = useCallback(() => {
    // 返回全国视图：淡出 → 切换内容 → 延迟淡入
    fadeAnim.value = withTiming(0, {
      duration: FADE_DURATION * 0.6,
      easing: easing.easeIn,
    }, (finished) => {
      if (finished) {
        runOnJS(setDrilldownProvince)(null);
        runOnJS(setShowDrilldown)(false);
        runOnJS(delayedFadeIn)();
      }
    });
  }, [fadeAnim]);

  const handleNationalProvincePress = useCallback((name: string) => {
    if (blurData) return;
    // 点击省份触发下钻
    handleProvincePress(name);
  }, [blurData, handleProvincePress]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text size="sm" color={isDark ? '$trueGray500' : '$trueGray400'}>
          该时段暂无省份数据
        </Text>
      </View>
    );
  }

  // 下钻状态：渲染 ProvinceMapChart
  if (showDrilldown && drilldownProvince) {
    return (
      <Animated.View style={[styles.container, fadeStyle]}>
        <ProvinceMapChart
          provinceId={drilldownProvinceId}
          provinceName={drilldownProvince}
          data={drilldownCityData}
          theme={theme}
          onBack={handleDrilldownBack}
          provinceSummary={dataMap[drilldownProvince] || null}
        />
      </Animated.View>
    );
  }

  // 全国视图
  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      {/* 地图 SVG - 使用更紧凑的 viewBox 裁剪空白区域 */}
      <Svg
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        viewBox="10 10 560 480"
        style={[styles.svg, {backgroundColor: tc.background}]}>
        {CHINA_PROVINCES.map(province => {
          const item = dataMap[province.name];
          const ratio = item?.overtimeRatio ?? 0;
          const hasData = !!item;
          const isSelected = selectedProvince === province.name;

          const fillColor = blurData
            ? (isDark ? '#1a1a2e' : tc.backgroundTertiary)
            : hasData
              ? getHeatColor(ratio, isDark)
              : tc.background;

          const strokeColor = isSelected
            ? tc.text
            : tc.textTertiary;

          return (
            <G key={province.name} onPress={() => handleNationalProvincePress(province.name)}>
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
              backgroundColor: tc.background,
              borderColor: tc.border,
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

      {/* 省份选择按钮（解决小面积省份点不到的问题） */}
      {!blurData && (
        <TouchableOpacity
          style={[
            styles.pickerButton,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
              borderColor: tc.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setShowPicker(true)}>
          <Text size="xs" style={{color: tc.textSecondary}}>
            选择省份 ▾
          </Text>
        </TouchableOpacity>
      )}

      {/* 省份选择弹窗（风格与 CalendarView 月份弹框一致） */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: tc.background},
            ]}>
            <RNText
              style={[styles.modalTitle, {color: tc.text}]}>
              选择省份
            </RNText>
            <View style={styles.provinceGrid}>
              {provinceList.map(name => (
                <TouchableOpacity
                  key={name}
                  style={styles.provinceGridItem}
                  onPress={() => {
                    setShowPicker(false);
                    handleNationalProvincePress(name);
                  }}>
                  <RNText
                    style={[styles.provinceGridText, {color: tc.text}]}>
                    {name}
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
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
  pickerButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 280,
    maxHeight: 480,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  provinceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  provinceGridItem: {
    width: '25%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  provinceGridText: {
    fontSize: typography.fontSize.form,
    textAlign: 'center',
  },
  legendContainer: {},
  legendBar: {},
  legendBlock: {},
});
