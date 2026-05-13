/**
 * OvertimeEndTimePicker - 加班时间点选择器
 *
 * 将"预计加班 N 小时"滚轮改为"预计下班到几点"时间点选择器
 * 复用 UserStatusSelector 既有金融终端风格
 *
 * 设计原则:
 * - 黑底 / 等宽数字 / 极细边框 / 4-12px 圆角
 * - 上方 5 个快捷按钮
 * - 横向滚轮展示时间点
 * - 下方辅助文案"从现在起还要 X 小时 Y 分钟"
 *
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7
 */

import React, {useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {useTheme} from '../hooks/useTheme';
import {typography} from '../theme/typography';
import {spacing} from '../theme/spacing';
import {
  generateQuickPicks,
  validateEndTime,
  endTimeToOvertimeHours,
} from '../utils/overtimeTimePicker';
import {EndTimeError} from '../types/hourly-wage';
import {useAppDispatch} from '../hooks/redux';
import {addNotification} from '../store/slices/uiSlice';

// 横向滚轮常量
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 72;
const ITEM_SPACING = 4;
const ITEM_TOTAL = ITEM_WIDTH + ITEM_SPACING;

// 默认标准下班时间（未配置时降级）
const DEFAULT_STANDARD_END = '18:00';

interface OvertimeEndTimePickerProps {
  /** 标准下班时间 'HH:mm'，未配置时降级 18:00 */
  standardEndTime?: string;
  /** 当前时间 */
  now: Date;
  /** 确认回调，传入选中的 endTime 'HH:mm' */
  onConfirm: (endTime: string) => void;
  /** 取消回调 */
  onCancel: () => void;
}

/**
 * 生成从 standardEndTime 之后的时间点列表（每 30 分钟一个，共 16 个 = 8 小时）
 */
function generateTimeSlots(standardEndTime: string): string[] {
  const [h, m] = standardEndTime.split(':').map(Number);
  const baseMinutes = h * 60 + m;
  const slots: string[] = [];
  // 从标准下班后 30 分钟开始，每 30 分钟一个，共 16 个（覆盖 8 小时）
  for (let i = 1; i <= 16; i++) {
    const totalMinutes = baseMinutes + i * 30;
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hh = Math.floor(normalized / 60)
      .toString()
      .padStart(2, '0');
    const mm = (normalized % 60).toString().padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/**
 * 计算辅助文案：从 now 到 endTime 还要多久
 */
function computeRemainingText(endTime: string, now: Date): string {
  const [h, m] = endTime.split(':').map(Number);
  const endMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const diff = endMinutes - nowMinutes;
  if (diff <= 0) {
    return '已过该时间';
  }
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours === 0) {
    return `从现在起还要 ${minutes} 分钟`;
  }
  if (minutes === 0) {
    return `从现在起还要 ${hours} 小时`;
  }
  return `从现在起还要 ${hours} 小时 ${minutes} 分钟`;
}

/**
 * 获取校验错误的提示文案
 */
function getErrorMessage(error: EndTimeError): string {
  switch (error) {
    case 'NOT_FUTURE':
      return '预计下班时间必须晚于当前时间';
    case 'EQUALS_STANDARD':
      return '该时间等于标准下班时间，建议改选"准时下班"';
  }
}

export const OvertimeEndTimePicker: React.FC<OvertimeEndTimePickerProps> = ({
  standardEndTime,
  now,
  onConfirm,
  onCancel,
}) => {
  const stdEnd = standardEndTime || DEFAULT_STANDARD_END;
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const tc = theme.colors;

  // 快捷项
  const quickPicks = useMemo(() => generateQuickPicks(stdEnd), [stdEnd]);

  // 时间槽列表
  const timeSlots = useMemo(() => generateTimeSlots(stdEnd), [stdEnd]);

  // 选中的时间（默认第一个快捷项，即 +1h）
  const [selectedTime, setSelectedTime] = useState<string>(quickPicks[0]);

  const scrollRef = useRef<ScrollView>(null);
  const [pickerWidth, setPickerWidth] = useState(SCREEN_WIDTH * 0.9 - 32);

  // 辅助文案
  const remainingText = useMemo(
    () => computeRemainingText(selectedTime, now),
    [selectedTime, now],
  );

  // 加班时长辅助文案
  const overtimeHoursText = useMemo(() => {
    const hours = endTimeToOvertimeHours(selectedTime, stdEnd);
    if (hours <= 0) return '';
    return `加班 ${hours} 小时`;
  }, [selectedTime, stdEnd]);

  // 校验状态
  const validationError = useMemo(
    () => validateEndTime(selectedTime, stdEnd, now),
    [selectedTime, stdEnd, now],
  );

  /**
   * 快捷项点击
   */
  const handleQuickPick = useCallback(
    (time: string) => {
      setSelectedTime(time);
      // 滚动到对应位置
      const index = timeSlots.indexOf(time);
      if (index >= 0 && scrollRef.current) {
        scrollRef.current.scrollTo({x: index * ITEM_TOTAL, animated: true});
      }
    },
    [timeSlots],
  );

  /**
   * 滚轮吸附
   */
  const snapToNearest = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / ITEM_TOTAL);
      const clamped = Math.max(0, Math.min(index, timeSlots.length - 1));
      const targetX = clamped * ITEM_TOTAL;
      setSelectedTime(timeSlots[clamped]);
      if (Math.abs(offsetX - targetX) > 1) {
        scrollRef.current?.scrollTo({x: targetX, animated: true});
      }
    },
    [timeSlots],
  );

  /**
   * 点击某个时间点，滚动到对应位置
   */
  const scrollToIndex = useCallback(
    (index: number) => {
      setSelectedTime(timeSlots[index]);
      scrollRef.current?.scrollTo({
        x: index * ITEM_TOTAL,
        animated: true,
      });
    },
    [timeSlots],
  );

  /**
   * 确认提交
   */
  const handleConfirm = useCallback(() => {
    const error = validateEndTime(selectedTime, stdEnd, now);
    if (error) {
      dispatch(
        addNotification({
          type: 'warning',
          message: getErrorMessage(error),
          duration: 3000,
        }),
      );
      return;
    }
    onConfirm(selectedTime);
  }, [selectedTime, stdEnd, now, dispatch, onConfirm]);

  const sidePadding = (pickerWidth - ITEM_WIDTH) / 2;

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <Text style={[styles.title, {color: tc.text}]}>预计下班到几点</Text>

      {/* 快捷按钮 */}
      <View style={styles.quickPickRow}>
        {quickPicks.map(time => {
          const isActive = selectedTime === time;
          return (
            <Pressable
              key={time}
              testID={`quick-pick-${time}`}
              style={({pressed}) => [
                styles.quickPickButton,
                {borderColor: tc.border},
                isActive && {
                  backgroundColor: tc.text,
                  borderColor: tc.text,
                },
                pressed && {opacity: 0.7},
              ]}
              onPress={() => handleQuickPick(time)}>
              <Text
                style={[
                  styles.quickPickText,
                  {color: tc.textSecondary},
                  isActive && {color: tc.background},
                ]}>
                {time}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 横向滚轮 */}
      <View
        style={styles.pickerContainer}
        onLayout={e => {
          setPickerWidth(e.nativeEvent.layout.width);
        }}>
        {/* 选中指示器 */}
        <View
          style={[
            styles.pickerIndicator,
            {left: sidePadding - 2, width: ITEM_WIDTH + 4},
          ]}
          pointerEvents="none"
        />

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={{paddingHorizontal: sidePadding}}
          contentOffset={{
            x: Math.max(0, timeSlots.indexOf(selectedTime)) * ITEM_TOTAL,
            y: 0,
          }}
          onMomentumScrollEnd={snapToNearest}
          onScrollEndDrag={snapToNearest}
          bounces={false}>
          {timeSlots.map((time, index) => {
            const isSelected = selectedTime === time;
            return (
              <Pressable
                key={time}
                testID={`time-slot-${time}`}
                onPress={() => scrollToIndex(index)}
                style={({pressed}) => [
                  styles.pickerItem,
                  {marginRight: index < timeSlots.length - 1 ? ITEM_SPACING : 0},
                  pressed && {opacity: 0.7},
                ]}>
                <Text
                  style={[
                    styles.pickerItemText,
                    {color: tc.textDisabled},
                    isSelected && styles.pickerItemTextSelected,
                    isSelected && {color: tc.text},
                  ]}>
                  {time}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 渐隐遮罩 */}
        <View style={[styles.fadeMask, styles.fadeMaskLeft]} pointerEvents="none" />
        <View style={[styles.fadeMask, styles.fadeMaskRight]} pointerEvents="none" />
      </View>

      {/* 辅助文案 */}
      <View style={styles.helperContainer}>
        <Text
          testID="remaining-text"
          style={[
            styles.helperText,
            {color: tc.textTertiary},
            validationError && {color: tc.error},
          ]}>
          {validationError ? getErrorMessage(validationError) : remainingText}
        </Text>
        {!validationError && overtimeHoursText ? (
          <Text
            testID="overtime-hours-text"
            style={[styles.helperSubText, {color: tc.textTertiary}]}>
            {overtimeHoursText}
          </Text>
        ) : null}
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonRow}>
        <Pressable
          testID="cancel-button"
          style={({pressed}) => [
            styles.cancelButton,
            {borderColor: tc.border},
            pressed && {opacity: 0.7},
          ]}
          onPress={onCancel}>
          <Text style={[styles.cancelButtonText, {color: tc.textSecondary}]}>取消</Text>
        </Pressable>
        <Pressable
          testID="confirm-button"
          style={({pressed}) => [
            styles.confirmButton,
            {backgroundColor: tc.text},
            pressed && {opacity: 0.85},
          ]}
          onPress={handleConfirm}>
          <Text style={[styles.confirmButtonText, {color: tc.background}]}>确认提交</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  // 快捷按钮行
  quickPickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
    flexWrap: 'wrap',
  },
  quickPickButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    borderWidth: 1,
  },
  quickPickText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.monospace,
    fontWeight: '500',
  },
  // 横向滚轮
  pickerContainer: {
    height: 72,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  pickerIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    zIndex: 1,
  },
  pickerItem: {
    width: ITEM_WIDTH,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: typography.fontSize.xl,
    fontWeight: '300',
    fontFamily: typography.fontFamily.monospace,
  },
  pickerItemTextSelected: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '600',
  },
  fadeMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 2,
  },
  fadeMaskLeft: {
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  fadeMaskRight: {
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  // 辅助文案
  helperContainer: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  helperText: {
    fontSize: typography.fontSize.base,
    fontWeight: '400',
  },
  helperSubText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
    marginTop: spacing.xs,
  },
  // 按钮行
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
