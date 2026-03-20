/**
 * 历史状态指示器组件
 *
 * 显示过去6天+今天的状态圆点
 * - 红色: 加班人数 > 准时下班人数
 * - 绿色: 准时下班人数 > 加班人数
 * - 黄色闪烁: 当天未确定状态
 *
 * 使用 Reanimated withRepeat 驱动闪烁，UI 线程零延迟
 */

import React, {useEffect, useCallback, useState} from 'react';
import {View, Text, StyleSheet, Pressable, Modal, TouchableOpacity} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {DailyStatus} from '../types';
import {duration, easing} from '../theme/animations';
import {typography} from '../theme/typography';

interface HistoricalStatusIndicatorProps {
  dailyStatus: DailyStatus[];
  theme: 'light' | 'dark';
}

/**
 * 闪烁圆点子组件 — 只有 pending 状态才启动动画
 */
const BlinkDot: React.FC<{
  color: string;
  isPending: boolean;
}> = React.memo(({color, isPending}) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isPending) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, {duration: duration.slowest, easing: easing.easeInOut}),
          withTiming(1, {duration: duration.slowest, easing: easing.easeInOut}),
        ),
        -1,
      );
    } else {
      opacity.value = 1;
    }
  }, [isPending, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <ReAnimated.View
      style={[styles.statusDot, {backgroundColor: color}, animStyle]}
    />
  );
});
BlinkDot.displayName = 'BlinkDot';

const HistoricalStatusIndicator: React.FC<HistoricalStatusIndicatorProps> = ({
  dailyStatus,
  theme,
}) => {
  const [selectedItem, setSelectedItem] = useState<DailyStatus | null>(null);
  const [showModal, setShowModal] = useState(false);

  const isDark = theme === 'dark';
  const modalBg = isDark ? '#000000' : '#FFFFFF';
  const modalTextColor = isDark ? '#E8EAED' : '#000000';
  const secondaryTextColor = isDark ? '#A0A0A0' : '#666666';
  const closeBtnBg = isDark ? '#27272A' : '#E5E7EB';

  /**
   * 格式化日期显示
   */
  const formatDate = (dateStr: string | Date): string => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  /**
   * 处理圆点点击 — 打开自定义 Modal
   */
  const handleDotPress = useCallback((item: DailyStatus) => {
    setSelectedItem(item);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  /**
   * 根据状态返回圆点颜色
   * Robinhood 风格：绿色 #00C805 / 红色 #FF5000
   */
  const getStatusColor = (
    status: 'overtime' | 'ontime' | 'pending',
  ): string => {
    switch (status) {
      case 'overtime':
        return '#FF5000';
      case 'ontime':
        return '#00C805';
      case 'pending':
        return '#FFEB99';
      default:
        return '#CCCCCC';
    }
  };

  // 确保显示最近7天的数据，按时间正序排列
  const sortedStatus = [...dailyStatus].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  const displayStatus = sortedStatus.slice(-7);

  return (
    <View style={styles.container}>
      {displayStatus.length === 0 ? (
        <Text style={{color: '#999', fontSize: typography.fontSize.sm}}>暂无数据</Text>
      ) : (
        displayStatus.map((item, index) => {
          const isPending = item.status === 'pending';
          const dotColor = getStatusColor(item.status);

          return (
            <Pressable
              key={`${item.date}-${index}`}
              onPress={() => handleDotPress(item)}
              hitSlop={{top: 12, bottom: 12, left: 8, right: 8}}
              style={({pressed}) => [
                styles.dotTouchArea,
                {opacity: pressed ? 0.4 : 1},
              ]}>
              <BlinkDot color={dotColor} isPending={isPending} />
            </Pressable>
          );
        })
      )}

      {/* 历史状态详情弹窗 — 与日历详情弹窗风格一致 */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <View style={[styles.modalContent, {backgroundColor: modalBg}]}>
            {selectedItem && (
              <>
                {/* 日期标题 */}
                <Text style={[styles.modalDate, {color: modalTextColor}]}>
                  {formatDate(selectedItem.date)}
                </Text>

                {selectedItem.status === 'pending' ? (
                  /* pending 状态 */
                  <Text style={[styles.modalPendingText, {color: secondaryTextColor}]}>
                    今天还未出结果
                  </Text>
                ) : (
                  /* 正常状态 — 显示准时下班和加班人数 */
                  <>
                    <View style={styles.modalRow}>
                      <View style={styles.modalStatusDot}>
                        <View style={[styles.statusDotSmall, {backgroundColor: '#00C805'}]} />
                      </View>
                      <Text style={[styles.modalLabel, {color: secondaryTextColor}]}>
                        准时下班
                      </Text>
                      <Text style={[styles.modalValue, {color: '#00C805'}]}>
                        {selectedItem.onTimeCount}人
                      </Text>
                    </View>
                    <View style={[styles.modalRow, {borderBottomWidth: 0}]}>
                      <View style={styles.modalStatusDot}>
                        <View style={[styles.statusDotSmall, {backgroundColor: '#FF5000'}]} />
                      </View>
                      <Text style={[styles.modalLabel, {color: secondaryTextColor}]}>
                        加班
                      </Text>
                      <Text style={[styles.modalValue, {color: '#FF5000'}]}>
                        {selectedItem.overtimeCount}人
                      </Text>
                    </View>
                  </>
                )}

                {/* 关闭按钮 */}
                <TouchableOpacity
                  style={[styles.modalCloseButton, {backgroundColor: closeBtnBg}]}
                  onPress={handleCloseModal}
                >
                  <Text style={[styles.modalCloseText, {color: modalTextColor}]}>
                    关闭
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  dotTouchArea: {
    padding: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // 弹窗样式 — 与 CalendarView DayDetailModal 一致
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    borderRadius: 16,
    padding: 20,
  },
  modalDate: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalPendingText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalStatusDot: {
    marginRight: 8,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalLabel: {
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  modalValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: typography.fontSize.form,
    fontWeight: '600',
  },
});

export default HistoricalStatusIndicator;
