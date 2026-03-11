/**
 * 下班日历海报组件
 * 
 * 功能：
 * - 显示用户的月度打卡日历
 * - 提供年月选择器
 * - 显示准时/加班/未打卡状态
 * - 支持截图生成海报
 * 
 * 样式规范：
 * - 统一使用 posterTheme 配置
 * - 统一字体、间距、圆角、边框
 * - 统一颜色方案（深色/浅色主题）
 * - 统一选择器和日历样式
 * 
 * 验证需求: 4.1-4.5, 13.1-13.6
 */

import React, {forwardRef, useState, useMemo, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity, Modal, FlatList} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {PosterTemplate} from './PosterTemplate';
import {posterTheme, getPosterTheme} from '../../theme/posterTheme';
import {CalendarData, UserInfo} from '../../types/poster';
import {useThemeToggle} from '../../hooks/useThemeToggle';
import {generateCalendarGrid, getStatusColor} from '../../utils/calendarUtils';

/**
 * CalendarPoster 组件属性
 */
interface CalendarPosterProps {
  data: CalendarData;
  user: UserInfo;
  onYearMonthChange?: (year: number, month: number) => void;
}

// 星期标题
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

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
 * 日历单日格子组件（简化版，用于海报）
 */
const CalendarDayCell: React.FC<{
  day: number;
  status: 'ontime' | 'overtime' | 'none';
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isDark: boolean;
}> = React.memo(({day, status, isCurrentMonth, isToday, isWeekend, isDark}) => {
  const colors = isDark ? posterTheme.colors.dark : posterTheme.colors.light;

  // 非当月日期淡化显示
  const textOpacity = isCurrentMonth ? 1 : 0.3;

  // 日期数字颜色
  const dayTextColor = (isWeekend && isCurrentMonth)
    ? colors.textSecondary
    : colors.text;

  // 获取状态横杠颜色
  const statusColor = isCurrentMonth
    ? getStatusColor(status, 0, isDark)
    : null;

  return (
    <View style={styles.dayCell}>
      {/* 今天的圆圈标识 + 日期数字 */}
      {isToday ? (
        <View style={[
          styles.todayCircle,
          {borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'},
        ]}>
          <Text
            style={[
              styles.dayText,
              {color: dayTextColor, opacity: textOpacity, fontWeight: '600'},
            ]}
          >
            {day}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.dayText,
            {color: dayTextColor, opacity: textOpacity},
          ]}
        >
          {day}
        </Text>
      )}

      {/* 状态横杠 */}
      {statusColor && (
        <View
          style={[
            styles.statusBar,
            {backgroundColor: statusColor.color},
          ]}
        />
      )}
    </View>
  );
});

/**
 * CalendarPoster 下班日历海报组件
 * 
 * 验证需求: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export const CalendarPoster = React.memo(
  forwardRef<View, CalendarPosterProps>(
    ({data, user, onYearMonthChange}, ref) => {
      const {isDark} = useThemeToggle();
      
      // 获取主题颜色（使用 useMemo 缓存）
      const colors = useMemo(() => getPosterTheme(isDark), [isDark]);

    const {year, month, days} = data;

    // 格式化日期（使用 useMemo 缓存）
    const currentDate = useMemo(() => {
      return new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }, []);

    // 获取今天的日期字符串（使用 useMemo 缓存）
    const today = useMemo(() => {
      return new Date().toISOString().split('T')[0];
    }, []);

    // 生成日历网格数据（使用 useMemo 缓存）
    const calendarGrid = useMemo(() => {
      // 将 DayStatus[] 转换为 PersonalStatusRecord[] 格式
      const statusRecords = days.map(day => ({
        date: day.date,
        isOvertime: day.status === 'overtime',
        overtimeHours: day.status === 'overtime' ? 1 : 0,
        tagNames: [],
        tagIds: [],
      }));

      return generateCalendarGrid(year, month, statusRecords, []);
    }, [year, month, days]);

    // 处理年月变更（使用 useCallback 缓存）
    const handleYearMonthChange = useCallback((newYear: number, newMonth: number) => {
      onYearMonthChange?.(newYear, newMonth);
    }, [onYearMonthChange]);

    return (
      <PosterTemplate
        ref={ref}
        user={user}
        date={currentDate}
        title="我的下班日历"
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

          {/* 日历网格 */}
          <View style={styles.calendarContainer}>
            {/* 星期标题行 */}
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text
                    style={[
                      styles.weekdayText,
                      {
                        color: index >= 5
                          ? colors.textTertiary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* 日期网格 */}
            {calendarGrid.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((dayData, dayIndex) => (
                  <CalendarDayCell
                    key={dayData.date || `${weekIndex}-${dayIndex}`}
                    day={dayData.day}
                    status={dayData.status}
                    isCurrentMonth={dayData.isCurrentMonth}
                    isToday={dayData.date === today}
                    isWeekend={dayData.isWeekend}
                    isDark={isDark}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* 图例 */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: isDark
                      ? 'rgba(34, 197, 94, 0.8)'
                      : 'rgba(52, 199, 89, 0.8)',
                  },
                ]}
              />
              <Text style={[styles.legendText, {color: colors.textSecondary}]}>
                准时
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.6)'
                      : 'rgba(255, 59, 48, 0.6)',
                  },
                ]}
              />
              <Text style={[styles.legendText, {color: colors.textSecondary}]}>
                加班
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: isDark
                      ? 'rgba(107, 114, 128, 0.5)'
                      : 'rgba(156, 163, 175, 0.5)',
                  },
                ]}
              />
              <Text style={[styles.legendText, {color: colors.textSecondary}]}>
                未提交
              </Text>
            </View>
          </View>
        </View>
      </PosterTemplate>
    );
  }),
  (prevProps, nextProps) => {
    // 只在关键 props 变化时重新渲染
    return (
      prevProps.data.year === nextProps.data.year &&
      prevProps.data.month === nextProps.data.month &&
      prevProps.data.days.length === nextProps.data.days.length &&
      prevProps.user.username === nextProps.user.username
    );
  }
);

CalendarPoster.displayName = 'CalendarPoster';

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
  // 日历容器
  calendarContainer: {
    flex: 1,
  },
  // 星期标题行
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: posterTheme.spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: posterTheme.spacing.xs,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // 日期行
  weekRow: {
    flexDirection: 'row',
  },
  // 日期格子
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: posterTheme.spacing.md,
    minHeight: 60,
  },
  dayText: {
    fontSize: 18,
    fontWeight: '400',
  },
  // 今天的圆圈
  todayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 状态横杠
  statusBar: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    marginTop: posterTheme.spacing.xs,
  },
  // 图例
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: posterTheme.spacing.lg,
    gap: posterTheme.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: posterTheme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 12,
  },
  // 弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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

export default CalendarPoster;
