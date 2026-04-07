/**
 * 标签占比模块容器组件
 * 管理年月选择、数据加载和树状图展示
 * 需求: 1.1, 1.3, 2.1, 2.2, 2.3, 6.3, 8.1, 8.2, 8.3
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import {TreemapChart} from './TreemapChart';
import {supabaseService} from '../services/supabaseService';
import {TagProportionItem} from '../types/tag-proportion';
import {truncateWithOthers} from '../utils/tagProportionUtils';
import {Theme} from '../theme';
import {typography} from '../theme/typography';

interface TagProportionSectionProps {
  theme: Theme;
  userId: string;
  /** 外部触发刷新的计数器，每次变化时重新加载数据 */
  refreshTrigger?: number;
}

// 月份标签
const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

/**
 * 年月选择器组件（与 CalendarView 风格一致）
 * 点击年份/月份弹出 Modal 选择，右侧箭头快速切换月份
 * 需求: 2.1, 2.2, 8.1
 */
const MonthPicker: React.FC<{
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
  theme: Theme;
}> = React.memo(({year, month, onSelect, theme}) => {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const isDark = theme.isDark;

  // 生成年份列表（当前年份前后5年）
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const modalBg = theme.colors.background;
  const modalTextColor = theme.colors.text;
  const selectedBg = theme.colors.backgroundTertiary;

  return (
    <View style={styles.pickerContainer}>
      {/* 年份选择（点击弹出 Modal） */}
      <TouchableOpacity
        onPress={() => setShowYearPicker(true)}
        style={styles.pickerButton}
        accessibilityLabel={`选择年份，当前${year}年`}
      >
        <Text style={[styles.yearText, {color: theme.colors.text}]}>
          {year}年
        </Text>
      </TouchableOpacity>

      {/* 月份选择（点击弹出 Modal） */}
      <TouchableOpacity
        onPress={() => setShowMonthPicker(true)}
        style={styles.pickerButton}
        accessibilityLabel={`选择月份，当前${month}月`}
      >
        <Text style={[styles.monthPickerText, {color: theme.colors.text}]}>
          {MONTH_LABELS[month - 1]}
        </Text>
      </TouchableOpacity>

      {/* 左右箭头快速切换月份 */}
      <View style={styles.arrowContainer}>
        <TouchableOpacity
          onPress={() => {
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            onSelect(prevYear, prevMonth);
          }}
          style={styles.arrowButton}
          accessibilityLabel="上一个月"
        >
          <Text style={[styles.arrowText, {color: theme.colors.textSecondary}]}>
            ◀
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            onSelect(nextYear, nextMonth);
          }}
          style={styles.arrowButton}
          accessibilityLabel="下一个月"
        >
          <Text style={[styles.arrowText, {color: theme.colors.textSecondary}]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* 年份选择弹窗 */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View
            style={[styles.modalContent, {backgroundColor: modalBg}]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, {color: modalTextColor}]}>
              选择年份
            </Text>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item === year && {backgroundColor: selectedBg},
                  ]}
                  onPress={() => {
                    onSelect(item, month);
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    {color: modalTextColor},
                    item === year && styles.modalItemTextSelected,
                  ]}>
                    {item}年
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 月份选择弹窗 */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View
            style={[styles.modalContent, {backgroundColor: modalBg}]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, {color: modalTextColor}]}>
              选择月份
            </Text>
            <View style={styles.monthGrid}>
              {MONTH_LABELS.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthGridItem,
                    (index + 1) === month && {backgroundColor: selectedBg},
                  ]}
                  onPress={() => {
                    onSelect(year, index + 1);
                    setShowMonthPicker(false);
                  }}
                >
                  <Text style={[
                    styles.monthGridText,
                    {color: modalTextColor},
                    (index + 1) === month && styles.modalItemTextSelected,
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});


/**
 * 空状态提示
 * 需求: 1.3
 */
const EmptyState: React.FC<{theme: Theme}> = ({theme}) => (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyText, {color: theme.colors.textTertiary}]}>
      暂无标签数据
    </Text>
  </View>
);

/**
 * TagProportionSection 标签占比模块主组件
 * 需求: 1.1, 1.3, 2.1, 2.2, 2.3, 6.3, 8.1, 8.2, 8.3
 */
export const TagProportionSection: React.FC<TagProportionSectionProps> = ({
  theme,
  userId,
  refreshTrigger,
}) => {
  const isDark = theme.isDark;

  // 年月状态 - 默认当前年月（需求 2.1）
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // 数据状态
  const [data, setData] = useState<TagProportionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 上次成功加载的数据（需求 6.3: 网络失败时保留）
  const [lastData, setLastData] = useState<TagProportionItem[]>([]);

  // 图表宽度（MyPage section 有 marginHorizontal: 8，这里不再额外减）
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 16; // 与 section marginHorizontal: 8 对齐
  const chartHeight = 220;

  /**
   * 加载标签占比数据
   * 需求: 2.3, 6.3
   */
  const loadData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await supabaseService.getUserTagProportion(
        userId,
        year,
        month,
      );
      setData(result);
      setLastData(result);
    } catch (err) {
      console.error('加载标签占比数据失败:', err);
      // 需求 6.3: 网络不可用时显示友好错误提示并保留上次数据
      setError('数据加载失败，显示上次数据');
      setData(lastData);
    } finally {
      setLoading(false);
    }
  }, [userId, year, month, refreshTrigger]);

  // 年月变化时重新加载数据（需求 2.3）
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 截断数据：每个类别最多4个标签 + 1个其他 = 5，总共最多 5+5=10 块
  const displayData = useMemo(() => truncateWithOthers(data, 4), [data]);

  // 处理年月选择（年份或月份变更）
  const handleSelect = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: 'transparent'},
      ]}
    >
      {/* 标题 + 年月选择器同一行（需求 8.1, 2.2） */}
      {/* 标签占比（居左）  2026年2月 ◀ ▶（居右） */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          标签占比
        </Text>
        <MonthPicker
          year={year}
          month={month}
          onSelect={handleSelect}
          theme={theme}
        />
      </View>

      {/* 树状图或空状态（需求 1.2, 1.3）- 固定高度容器防止滚动跳动 */}
      <View style={styles.chartContainer}>
        {/* 加载指示器使用绝对定位，不占据布局空间 */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="small"
              color={theme.colors.text}
            />
          </View>
        )}

        {/* 错误提示使用绝对定位 */}
        {error && !loading && (
          <View style={styles.errorBanner}>
            <Text
              style={[
                styles.errorText,
                {color: '#FF5000'},
              ]}
            >
              {error}
            </Text>
          </View>
        )}

        {displayData.length === 0 && !loading ? (
          <EmptyState theme={theme} />
        ) : (
          displayData.length > 0 && (
            <TreemapChart
              data={displayData}
              width={chartWidth}
              height={chartHeight}
              theme={theme}
            />
          )
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  // 需求 8.1: fontSize 20、fontWeight 700，与 LongTermTrendChart 一致
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  // 标题 + 年月选择器同一行
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  // 年月选择器（居右部分）
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerButton: {
    paddingVertical: 4,
  },
  yearText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  monthPickerText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginLeft: 2,
  },
  arrowContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  arrowButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: typography.fontSize.base,
  },
  // 弹窗样式（与 CalendarView 一致）
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 280,
    maxHeight: 400,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  modalItemTextSelected: {
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthGridItem: {
    width: '33.33%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  monthGridText: {
    fontSize: typography.fontSize.form,
  },
  // 图表容器 - 固定高度防止切换月份时页面跳动
  chartContainer: {
    height: 220,
  },
  // 空状态
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
  },
  // 加载和错误 - 使用绝对定位，不影响容器高度
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorBanner: {
    position: 'absolute',
    top: 4,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
  },
});

export default TagProportionSection;
