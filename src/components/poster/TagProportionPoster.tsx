/**
 * 标签占比海报组件
 * 
 * 功能：
 * - 显示用户标签使用占比的树状图
 * - 提供年月选择器
 * - 复用 TreemapChart 组件
 * - 支持截图生成海报
 * 
 * 样式规范：
 * - 统一使用 posterTheme 配置
 * - 统一字体、间距、圆角、边框
 * - 统一颜色方案（深色/浅色主题）
 * - 统一选择器和图表样式
 * 
 * 验证需求: 6.1-6.6, 13.1-13.6
 */

import React, {forwardRef, useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity, Modal, FlatList} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {PosterTemplate} from './PosterTemplate';
import {posterTheme, getPosterTheme} from '../../theme/posterTheme';
import {TagProportionData, UserInfo} from '../../types/poster';
import {useThemeToggle} from '../../hooks/useThemeToggle';
import {TreemapChart} from '../TreemapChart';
import {TagProportionItem} from '../../types/tag-proportion';
import {createTheme} from '../../theme';

/**
 * TagProportionPoster 组件属性
 */
interface TagProportionPosterProps {
  data: TagProportionData;
  user: UserInfo;
  onYearMonthChange?: (year: number, month: number) => void;
}

// 月份名称
const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

/**
 * 年月选择器组件
 */
const YearMonthSelector: React.FC<{
  year: number;
  month: number;
  isDark: boolean;
  onSelect: (year: number, month: number) => void;
}> = ({year, month, isDark, onSelect}) => {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const colors = isDark ? posterTheme.colors.dark : posterTheme.colors.light;

  // 生成年份列表（当前年份前后5年）
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  return (
    <View style={styles.selectorContainer}>
      {/* 年份选择 */}
      <TouchableOpacity
        onPress={() => setShowYearPicker(true)}
        style={styles.selectorButton}
        accessibilityLabel={`选择年份，当前${year}年`}
      >
        <Text
          style={[
            posterTheme.typography.bodySmall,
            {color: colors.text, fontWeight: '600'},
          ]}
        >
          {year}年
        </Text>
      </TouchableOpacity>

      {/* 月份选择 */}
      <TouchableOpacity
        onPress={() => setShowMonthPicker(true)}
        style={styles.selectorButton}
        accessibilityLabel={`选择月份，当前${month}月`}
      >
        <Text
          style={[
            posterTheme.typography.bodySmall,
            {color: colors.text, fontWeight: '600'},
          ]}
        >
          {MONTH_LABELS[month - 1]}
        </Text>
      </TouchableOpacity>

      {/* 左右箭头快速切换 */}
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
          <Text style={[styles.arrowText, {color: colors.textSecondary}]}>
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
          <Text style={[styles.arrowText, {color: colors.textSecondary}]}>
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
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              选择年份
            </Text>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item === year && {backgroundColor: colors.card},
                  ]}
                  onPress={() => {
                    onSelect(item, month);
                    setShowYearPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {color: colors.text},
                      item === year && {fontWeight: '700'},
                    ]}
                  >
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
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              选择月份
            </Text>
            <View style={styles.monthGrid}>
              {MONTH_LABELS.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthGridItem,
                    (index + 1) === month && {backgroundColor: colors.card},
                  ]}
                  onPress={() => {
                    onSelect(year, index + 1);
                    setShowMonthPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthGridText,
                      {color: colors.text},
                      (index + 1) === month && {fontWeight: '700'},
                    ]}
                  >
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
};

/**
 * 空状态提示
 */
const EmptyState: React.FC<{colors: any}> = ({colors}) => (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
      暂无标签数据
    </Text>
  </View>
);

/**
 * TagProportionPoster 标签占比海报组件
 * 
 * 验证需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export const TagProportionPoster = React.memo(
  forwardRef<View, TagProportionPosterProps>(
    ({data, user, onYearMonthChange}, ref) => {
      const {isDark} = useThemeToggle();
      
      // 获取主题颜色（使用 useMemo 缓存）
      const colors = useMemo(() => getPosterTheme(isDark), [isDark]);

      // 创建完整的 Theme 对象（用于 TreemapChart）
      const theme = useMemo(() => createTheme(isDark ? 'dark' : 'light'), [isDark]);

    const {year, month, tags} = data;

    // 格式化日期（使用 useMemo 缓存）
    const currentDate = useMemo(() => {
      return new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }, []);

    // 处理年月变更（使用 useCallback 缓存）
    const handleYearMonthChange = useCallback((newYear: number, newMonth: number) => {
      onYearMonthChange?.(newYear, newMonth);
    }, [onYearMonthChange]);

    // 将 TagProportion[] 转换为 TagProportionItem[] 格式
    const treemapData: TagProportionItem[] = useMemo(() => {
      return tags.map(tag => ({
        tagId: tag.tag_id,
        tagName: tag.tag_name,
        count: tag.count,
        percentage: tag.percentage,
        isOvertime: true, // 海报中不区分加班/准时，默认设置为 true
        color: tag.color,
      }));
    }, [tags]);

    // 海报宽度（固定，使用 useMemo 缓存）
    const posterWidth = useMemo(() => posterTheme.dimensions.width, []);
    const chartWidth = useMemo(() => posterWidth - posterTheme.spacing.lg * 2, [posterWidth]);
    const chartHeight = useMemo(() => 480, []); // 树状图高度

    return (
      <PosterTemplate
        ref={ref}
        user={user}
        date={currentDate}
        title="我的标签占比"
      >
        <View style={styles.container}>
          {/* 年月选择器 */}
          <View style={styles.headerRow}>
            <YearMonthSelector
              year={year}
              month={month}
              isDark={isDark}
              onSelect={handleYearMonthChange}
            />
          </View>

          {/* 树状图 */}
          <View style={styles.chartContainer}>
            {treemapData.length > 0 ? (
              <TreemapChart
                data={treemapData}
                width={chartWidth}
                height={chartHeight}
                theme={theme}
              />
            ) : (
              <EmptyState colors={colors} />
            )}
          </View>

          {/* 说明文字 */}
          {treemapData.length > 0 && (
            <View style={styles.descriptionContainer}>
              <Text
                style={[
                  styles.descriptionText,
                  {color: colors.textSecondary},
                ]}
              >
                标签使用占比分布
              </Text>
            </View>
          )}
        </View>
      </PosterTemplate>
    );
  }),
  (prevProps, nextProps) => {
    // 只在关键 props 变化时重新渲染
    return (
      prevProps.data.year === nextProps.data.year &&
      prevProps.data.month === nextProps.data.month &&
      prevProps.data.tags.length === nextProps.data.tags.length &&
      prevProps.user.username === nextProps.user.username
    );
  }
);

TagProportionPoster.displayName = 'TagProportionPoster';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: posterTheme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: posterTheme.spacing.lg,
  },
  // 年月选择器
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorButton: {
    paddingVertical: posterTheme.spacing.xs,
    paddingHorizontal: posterTheme.spacing.xs,
  },
  arrowContainer: {
    flexDirection: 'row',
    marginLeft: posterTheme.spacing.sm,
  },
  arrowButton: {
    paddingHorizontal: posterTheme.spacing.sm,
    paddingVertical: posterTheme.spacing.xs,
  },
  arrowText: {
    fontSize: 14,
  },
  // 图表容器
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 空状态
  emptyContainer: {
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  // 说明文字
  descriptionContainer: {
    marginTop: posterTheme.spacing.md,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 12,
  },
  // 弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    maxHeight: 480,
    borderRadius: posterTheme.borderRadius.lg,
    padding: posterTheme.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: posterTheme.spacing.md,
  },
  modalItem: {
    paddingVertical: posterTheme.spacing.md,
    paddingHorizontal: posterTheme.spacing.lg,
    borderRadius: posterTheme.borderRadius.sm,
  },
  modalItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // 月份网格
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthGridItem: {
    width: '33.33%',
    paddingVertical: posterTheme.spacing.md,
    alignItems: 'center',
    borderRadius: posterTheme.borderRadius.sm,
  },
  monthGridText: {
    fontSize: 15,
  },
});

export default TagProportionPoster;
