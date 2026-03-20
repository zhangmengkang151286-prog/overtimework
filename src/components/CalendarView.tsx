/**
 * 月历视图组件
 * 展示用户个人每日加班/准时状态的月历
 * 需求: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3
 */

import React, {useState, useMemo, useCallback} from 'react';
import {StyleSheet, TouchableOpacity, View, Text, Modal, FlatList} from 'react-native';
import {PersonalStatusRecord, HolidayInfo, CalendarDayData} from '../types/my-page';
import {generateCalendarGrid, getStatusColor} from '../utils/calendarUtils';
import {Theme} from '../theme';
import {typography} from '../theme/typography';

interface CalendarViewProps {
  year: number;
  month: number; // 1-12
  statusRecords: PersonalStatusRecord[];
  holidays: HolidayInfo[];
  theme: Theme;
  onMonthChange: (year: number, month: number) => void;
}

// 星期标题（周一到周日）
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

// 月份名称
const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

/**
 * 年月选择器组件（居右部分，与标签占比风格一致）
 */
const YearMonthPicker: React.FC<{
  year: number;
  month: number;
  theme: Theme;
  onSelect: (year: number, month: number) => void;
}> = ({year, month, theme, onSelect}) => {
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

  const modalBg = isDark ? '#000000' : '#FFFFFF';
  const modalTextColor = isDark ? '#E8EAED' : '#000000';
  const selectedBg = isDark ? '#27272A' : '#E5E7EB';

  return (
    <View style={styles.pickerContainer}>
      {/* 年份选择 */}
      <TouchableOpacity
        onPress={() => setShowYearPicker(true)}
        style={styles.pickerButton}
        accessibilityLabel={`选择年份，当前${year}年`}
      >
        <Text style={[styles.yearText, {color: theme.colors.text}]}>
          {year}年
        </Text>
      </TouchableOpacity>

      {/* 月份选择 */}
      <TouchableOpacity
        onPress={() => setShowMonthPicker(true)}
        style={styles.pickerButton}
        accessibilityLabel={`选择月份，当前${month}月`}
      >
        <Text style={[styles.monthText, {color: theme.colors.text}]}>
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
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={[styles.modalContent, {backgroundColor: modalBg}]}>
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
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={[styles.modalContent, {backgroundColor: modalBg}]}>
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
};

/**
 * 日期详情弹窗组件
 */
const DayDetailModal: React.FC<{
  visible: boolean;
  dayData: CalendarDayData | null;
  statusRecord: PersonalStatusRecord | null;
  theme: Theme;
  onClose: () => void;
}> = ({visible, dayData, statusRecord, theme, onClose}) => {
  const isDark = theme.isDark;
  const modalBg = isDark ? '#000000' : '#FFFFFF';
  const modalTextColor = isDark ? '#E8EAED' : '#000000';
  const secondaryTextColor = isDark ? '#A0A0A0' : '#666666';

  if (!dayData || !visible) return null;

  // 格式化日期显示
  const dateStr = dayData.date;
  const [year, month, day] = dateStr.split('-');
  const displayDate = `${year}年${parseInt(month)}月${parseInt(day)}日`;

  // 状态文本和颜色
  const statusText = dayData.status === 'overtime' 
    ? '加班' 
    : dayData.status === 'ontime' 
    ? '准时下班' 
    : '未提交';
  
  // 状态文本和颜色（Robinhood 风格）
  const statusColor = dayData.status === 'overtime'
    ? '#FF5000'
    : dayData.status === 'ontime'
    ? '#00C805'
    : (isDark ? '#6B7280' : '#9CA3AF');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.dayDetailModal, {backgroundColor: modalBg}]}>
          {/* 日期标题 */}
          <Text style={[styles.dayDetailDate, {color: modalTextColor}]}>
            {displayDate}
          </Text>

          {/* 状态 */}
          <View style={styles.dayDetailRow}>
            <Text style={[styles.dayDetailLabel, {color: secondaryTextColor}]}>
              状态
            </Text>
            <Text style={[styles.dayDetailValue, {color: statusColor, fontWeight: '600'}]}>
              {statusText}
            </Text>
          </View>

          {/* 加班时长（仅加班时显示） */}
          {dayData.status === 'overtime' && dayData.overtimeHours > 0 && (
            <View style={styles.dayDetailRow}>
              <Text style={[styles.dayDetailLabel, {color: secondaryTextColor}]}>
                加班时长
              </Text>
              <Text style={[styles.dayDetailValue, {color: modalTextColor}]}>
                {dayData.overtimeHours} 小时
              </Text>
            </View>
          )}

          {/* 标签（有记录时显示，支持多个标签） */}
          {statusRecord?.tagNames && statusRecord.tagNames.length > 0 && (
            <View style={styles.dayDetailRow}>
              <Text style={[styles.dayDetailLabel, {color: secondaryTextColor}]}>
                标签
              </Text>
              <Text style={[styles.dayDetailValue, {color: modalTextColor, flex: 1, textAlign: 'right'}]}>
                {statusRecord.tagNames.join('、')}
              </Text>
            </View>
          )}

          {/* 关闭按钮 */}
          <TouchableOpacity
            style={[styles.dayDetailCloseButton, {backgroundColor: isDark ? '#27272A' : '#E5E7EB'}]}
            onPress={onClose}
          >
            <Text style={[styles.dayDetailCloseText, {color: modalTextColor}]}>
              关闭
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

/**
 * 日历单日格子组件
 */
const CalendarDayCell: React.FC<{
  dayData: CalendarDayData;
  theme: Theme;
  onPress: () => void;
}> = React.memo(({dayData, theme, onPress}) => {
  const isDark = theme.isDark;
  const {day, status, overtimeHours, isHoliday, isWorkday, isWeekend, isCurrentMonth, isToday} = dayData;

  // 非当月日期淡化显示
  const textOpacity = isCurrentMonth ? 1 : 0.3;

  // 日期数字颜色
  const dayTextColor: string = (isWeekend && isCurrentMonth)
    ? theme.colors.textSecondary
    : theme.colors.text;

  // 获取状态横杠颜色
  const statusColor = isCurrentMonth
    ? getStatusColor(status, overtimeHours, isDark)
    : null;

  return (
    <TouchableOpacity 
      style={styles.dayCell}
      onPress={onPress}
      disabled={!dayData.isCurrentMonth}
      activeOpacity={0.6}
    >
      {/* 节假日/调休标识 */}
      {isCurrentMonth && (isHoliday || isWorkday) && (
        <View style={styles.holidayBadge}>
          <Text style={[
            styles.holidayBadgeText,
            {color: isHoliday
              ? '#00C805'
              : (isDark ? '#FFB020' : '#FF9500')
            },
          ]}>
            {isWorkday ? '班' : '休'}
          </Text>
        </View>
      )}

      {/* 今天的圆圈标识 + 日期数字 */}
      {isToday ? (
        <View style={[
          styles.todayCircle,
          {borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'},
        ]}>
          <Text style={[
            styles.dayText,
            {color: dayTextColor, opacity: textOpacity, fontWeight: '600'},
          ]}>
            {day}
          </Text>
        </View>
      ) : (
        <Text style={[
          styles.dayText,
          {color: dayTextColor, opacity: textOpacity},
        ]}>
          {day}
        </Text>
      )}

      {/* 状态横杠 */}
      {statusColor && (
        <View style={[
          styles.statusBar,
          {backgroundColor: statusColor.color},
        ]} />
      )}
    </TouchableOpacity>
  );
});

/**
 * CalendarView 月历视图主组件
 * 需求: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  year,
  month,
  statusRecords,
  holidays,
  theme,
  onMonthChange,
}) => {
  const isDark = theme.isDark;
  
  // 日期详情弹窗状态
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  // 生成日历网格数据
  const calendarGrid = useMemo(
    () => generateCalendarGrid(year, month, statusRecords, holidays),
    [year, month, statusRecords, holidays],
  );

  // 处理年月变更
  const handleMonthChange = useCallback(
    (newYear: number, newMonth: number) => {
      onMonthChange(newYear, newMonth);
    },
    [onMonthChange],
  );

  // 处理日期点击
  const handleDayPress = useCallback((dayData: CalendarDayData) => {
    // 只要是当月的日期都可以点击
    if (dayData.isCurrentMonth) {
      setSelectedDay(dayData);
      setShowDayDetail(true);
    }
  }, []);

  // 关闭详情弹窗
  const handleCloseDetail = useCallback(() => {
    setShowDayDetail(false);
    // 延迟清空选中日期，避免弹窗关闭动画时数据消失
    setTimeout(() => setSelectedDay(null), 300);
  }, []);

  // 查找选中日期的状态记录
  const selectedStatusRecord = useMemo(() => {
    if (!selectedDay) return null;
    return statusRecords.find(record => record.date === selectedDay.date) || null;
  }, [selectedDay, statusRecords]);

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: 'transparent',
      },
    ]}>
      {/* 标题 + 年月选择器同一行 */}
      {/* 下班日历（居左）  2026年2月 ◀ ▶（居右） */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          下班日历
        </Text>
        <YearMonthPicker
          year={year}
          month={month}
          theme={theme}
          onSelect={handleMonthChange}
        />
      </View>

      {/* 星期标题行 */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={[
              styles.weekdayText,
              {
                color: index >= 5
                  ? theme.colors.textTertiary
                  : theme.colors.textSecondary,
              },
            ]}>
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
              dayData={dayData}
              theme={theme}
              onPress={() => handleDayPress(dayData)}
            />
          ))}
        </View>
      ))}

      {/* 图例 - Robinhood 风格颜色 */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: 'rgba(0, 200, 5, 0.8)'}]} />
          <Text style={[styles.legendText, {color: theme.colors.textSecondary}]}>准时</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: 'rgba(255, 80, 0, 0.7)'}]} />
          <Text style={[styles.legendText, {color: theme.colors.textSecondary}]}>加班</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: isDark ? 'rgba(107, 114, 128, 0.5)' : 'rgba(156, 163, 175, 0.5)'}]} />
          <Text style={[styles.legendText, {color: theme.colors.textSecondary}]}>未提交</Text>
        </View>
      </View>

      {/* 日期详情弹窗 */}
      <DayDetailModal
        visible={showDayDetail}
        dayData={selectedDay}
        statusRecord={selectedStatusRecord}
        theme={theme}
        onClose={handleCloseDetail}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  // 标题样式，与 LongTermTrendChart / TagProportionSection 一致
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
  monthText: {
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
  // 星期标题行
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: typography.fontSize.sm,
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
    paddingVertical: 8,
    minHeight: 52,
    position: 'relative',
  },
  dayText: {
    fontSize: typography.fontSize.md,
    fontWeight: '400',
  },
  // 今天的圆圈（包裹数字）
  todayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 状态横杠
  statusBar: {
    width: 22,
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  // 节假日标识
  holidayBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  holidayBadgeText: {
    fontSize: typography.fontSize.micro,
    fontWeight: '600',
  },
  // 弹窗
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
  // 月份网格
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
  // 图例
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
  },
  // 日期详情弹窗
  dayDetailModal: {
    width: 300,
    borderRadius: 16,
    padding: 20,
  },
  dayDetailDate: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  dayDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  dayDetailLabel: {
    fontSize: typography.fontSize.base,
  },
  dayDetailValue: {
    fontSize: typography.fontSize.base,
  },
  dayDetailCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dayDetailCloseText: {
    fontSize: typography.fontSize.form,
    fontWeight: '600',
  },
});

export default CalendarView;
