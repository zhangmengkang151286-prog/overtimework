import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {DailyStatus} from '../types';

interface HistoricalStatusIndicatorProps {
  dailyStatus: DailyStatus[];
  theme: 'light' | 'dark';
}

/**
 * 历史状态指示器组件
 * 显示过去6天的状态圆点
 * - 红色: 加班人数 > 准时下班人数
 * - 绿色: 准时下班人数 > 加班人数
 * - 黄色闪烁: 当天未确定状态
 */
const HistoricalStatusIndicator: React.FC<HistoricalStatusIndicatorProps> = ({
  dailyStatus,
  theme,
}) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // 调试日志
  useEffect(() => {
    console.log('[HistoricalStatusIndicator] dailyStatus:', dailyStatus);
    console.log(
      '[HistoricalStatusIndicator] dailyStatus length:',
      dailyStatus?.length,
    );
  }, [dailyStatus]);

  // 闪烁动画效果
  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    blinkAnimation.start();

    return () => {
      blinkAnimation.stop();
    };
  }, [blinkAnim]);

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
   * 处理圆点点击
   */
  const handleDotPress = (item: DailyStatus) => {
    const dateStr = formatDate(item.date);
    const isPending = item.status === 'pending';

    if (isPending) {
      Alert.alert(`${dateStr}`, '今天还未出结果', [
        {text: '确定', style: 'default'},
      ]);
    } else {
      Alert.alert(
        `${dateStr}`,
        `准点下班 - ${item.onTimeCount}人\n加班 - ${item.overtimeCount}人`,
        [{text: '确定', style: 'default'}],
      );
    }
  };

  /**
   * 根据状态返回圆点颜色
   * 验证需求: 4.2, 4.3, 4.4
   */
  const getStatusColor = (
    status: 'overtime' | 'ontime' | 'pending',
  ): string => {
    switch (status) {
      case 'overtime':
        return '#FFB3B3'; // 浅红色
      case 'ontime':
        return '#B3FFB3'; // 浅绿色
      case 'pending':
        return '#FFEB99'; // 浅黄色
      default:
        return '#CCCCCC';
    }
  };

  // 确保显示最近7天的数据，并按时间正序排列（最早的在左边，今天在右边）
  // 1. 先按日期排序（升序）
  const sortedStatus = [...dailyStatus].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  // 2. 取最后7天的数据
  const displayStatus = sortedStatus.slice(-7);

  return (
    <View style={styles.container}>
      {displayStatus.length === 0 ? (
        <Text style={{color: '#999', fontSize: 12}}>暂无数据</Text>
      ) : (
        displayStatus.map((item, index) => {
          const isPending = item.status === 'pending';
          const dotColor = getStatusColor(item.status);

          return (
            <TouchableOpacity
              key={`${item.date}-${index}`}
              onPress={() => handleDotPress(item)}
              activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: dotColor,
                    opacity: isPending ? blinkAnim : 1,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })
      )}
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default HistoricalStatusIndicator;
