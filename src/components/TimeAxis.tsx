import React, {useState, useRef, useEffect} from 'react';
import {PanResponder, TouchableOpacity, Dimensions} from 'react-native';
import {Box, HStack, Text, VStack, Pressable} from '@gluestack-ui/themed';

/**
 * TimeAxis Props
 * 需求: 6.1-6.4
 */
interface TimeAxisProps {
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  onBackToNow?: () => void; // 新增：点击"现在"按钮的回调
  minTime: Date;
  maxTime: Date;
  interval: number; // 15分钟间隔
  theme: 'light' | 'dark';
}

/**
 * 时间轴组件
 * 用于查看历史数据，支持拖动交互
 * 需求: 6.1-6.4
 */
const TimeAxis: React.FC<TimeAxisProps> = ({
  currentTime,
  onTimeChange,
  onBackToNow,
  minTime,
  maxTime,
  interval,
  theme,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const AXIS_PADDING = 30; // 增加内边距到30，让圆点有更多空间
  const axisWidth = screenWidth - 32 - AXIS_PADDING * 2; // 减去padding和两端内边距

  // 拖动状态
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTime, setSelectedTime] = useState(currentTime);
  const [hourChanged, setHourChanged] = useState(false); // 新增：整点变化标记

  // 记录拖动开始时的位置
  const dragStartPosition = useRef(0);

  // 记录上一个经过的整点（用于视觉反馈）
  const lastHourRef = useRef<number | null>(null);

  // 整点变化动画定时器
  const hourChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 计算时间范围（毫秒）
   */
  const timeRange = maxTime.getTime() - minTime.getTime();

  /**
   * 将时间转换为位置（像素）
   */
  const timeToPosition = (time: Date): number => {
    const timeOffset = time.getTime() - minTime.getTime();
    return (timeOffset / timeRange) * axisWidth;
  };

  /**
   * 将位置（像素）转换为时间
   * 限制：不能超过当前时间（不能拖到未来）
   */
  const positionToTime = (position: number): Date => {
    const clampedPosition = Math.max(0, Math.min(position, axisWidth));
    const timeOffset = (clampedPosition / axisWidth) * timeRange;
    const calculatedTime = new Date(minTime.getTime() + timeOffset);

    // 限制不能超过当前时间
    const now = new Date();
    if (calculatedTime > now) {
      return now;
    }

    return calculatedTime;
  };

  /**
   * 将时间吸附到最近的整点
   * 工作日范围：06:00 - 次日 05:59
   * 限制：不能超过当前时间
   */
  const snapToHour = (time: Date): Date => {
    const snapped = new Date(time);
    const minutes = snapped.getMinutes();

    // 如果分钟数 >= 30，吸附到下一个整点；否则吸附到当前整点
    if (minutes >= 30) {
      snapped.setHours(snapped.getHours() + 1);
    }

    snapped.setMinutes(0);
    snapped.setSeconds(0);
    snapped.setMilliseconds(0);

    // 确保不超出工作日范围
    if (snapped < minTime) return minTime;
    if (snapped > maxTime) return maxTime;

    // 确保不超过当前时间
    const now = new Date();
    if (snapped > now) {
      // 如果吸附后的时间超过当前时间，返回当前时间的整点
      const currentHour = new Date(now);
      currentHour.setMinutes(0);
      currentHour.setSeconds(0);
      currentHour.setMilliseconds(0);
      return currentHour;
    }

    return snapped;
  };

  /**
   * 生成时间刻度 - 只显示关键时间点（每6小时）
   * 需求: 6.3
   *
   * 工作日时间范围：06:00 - 次日 05:59
   * 显示刻度：6点、12点、18点、0点（次日）
   */
  const generateTicks = (): Array<{time: Date; position: number}> => {
    const ticks: Array<{time: Date; position: number}> = [];

    // 从 minTime 开始，每6小时生成一个刻度
    // 工作日从 06:00 开始，所以刻度是：6, 12, 18, 0(次日)
    const startHour = minTime.getHours(); // 应该是 6
    const keyHours = [6, 12, 18, 0]; // 0 点是次日凌晨

    keyHours.forEach(hour => {
      let tickTime: Date;

      if (hour === 0) {
        // 0点是次日凌晨
        tickTime = new Date(minTime);
        tickTime.setDate(tickTime.getDate() + 1);
        tickTime.setHours(0, 0, 0, 0);
      } else {
        // 6、12、18 点是当天
        tickTime = new Date(minTime);
        tickTime.setHours(hour, 0, 0, 0);
      }

      // 只添加在时间范围内的刻度
      if (tickTime >= minTime && tickTime <= maxTime) {
        ticks.push({
          time: tickTime,
          position: timeToPosition(tickTime),
        });
      }
    });

    return ticks;
  };

  const ticks = generateTicks();

  /**
   * 格式化时间显示 - 只显示小时（不显示分钟）
   */
  const formatTimeHourOnly = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    return `${hours}:00`;
  };

  /**
   * 格式化时间显示 - 完整时间（小时:分钟）
   * 如果是次日凌晨（00:00-05:59），或者日期比 minTime 大，显示"次日"前缀
   */
  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    // 如果是凌晨 00:00-05:59，添加"次日"前缀
    if (date.getHours() >= 0 && date.getHours() <= 5) {
      return `次日${timeStr}`;
    }

    // 如果日期比 minTime 大（跨天了），也添加"次日"前缀
    if (
      date.getDate() > minTime.getDate() ||
      date.getMonth() > minTime.getMonth() ||
      date.getFullYear() > minTime.getFullYear()
    ) {
      return `次日${timeStr}`;
    }

    return timeStr;
  };

  /**
   * 拖动手势处理
   * 需求: 6.2
   *
   * 关键修复：
   * - 使用 useRef 而不是 useMemo，避免因依赖项变化导致重新创建
   * - onPanResponderGrant 时动态计算当前位置，而不是依赖闭包
   * - onPanResponderTerminationRequest 返回 false 防止被 ScrollView 抢占
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false, // 防止被 ScrollView 抢占
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        // 动态计算当前位置，避免闭包问题
        setSelectedTime(currentSelectedTime => {
          const currentPosition = timeToPosition(currentSelectedTime);
          dragStartPosition.current = currentPosition;
          // 记录开始拖动时的整点
          lastHourRef.current = currentSelectedTime.getHours();
          return currentSelectedTime; // 不改变状态，只是为了获取最新值
        });
      },
      onPanResponderMove: (_, gestureState) => {
        // 从拖动开始位置计算新位置
        const newPosition = dragStartPosition.current + gestureState.dx;
        // 限制在有效范围内（0 到 axisWidth）
        const clampedPosition = Math.max(0, Math.min(newPosition, axisWidth));
        const newTime = positionToTime(clampedPosition);

        // 检测是否经过了新的整点
        const currentHour = newTime.getHours();
        if (
          lastHourRef.current !== null &&
          lastHourRef.current !== currentHour
        ) {
          // 经过了新的整点，触发视觉反馈
          setHourChanged(true);

          // 清除之前的定时器
          if (hourChangeTimerRef.current) {
            clearTimeout(hourChangeTimerRef.current);
          }

          // 200ms 后恢复正常状态
          hourChangeTimerRef.current = setTimeout(() => {
            setHourChanged(false);
          }, 200);

          lastHourRef.current = currentHour;
        }

        // 只更新本地状态，不触发 Redux（避免卡顿）
        setSelectedTime(newTime);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        // 从拖动开始位置计算最终位置
        const newPosition = dragStartPosition.current + gestureState.dx;
        // 限制在有效范围内
        const clampedPosition = Math.max(0, Math.min(newPosition, axisWidth));
        const newTime = positionToTime(clampedPosition);

        // 吸附到最近的整点
        const snappedTime = snapToHour(newTime);

        // 重置整点追踪
        lastHourRef.current = null;

        setSelectedTime(snappedTime);
        // 释放时才触发 Redux 更新
        onTimeChange(snappedTime);
      },
    }),
  ).current;

  // 计算指示器位置（在 panResponder 之后计算）
  const indicatorPosition = timeToPosition(selectedTime);

  /**
   * 回到"现在"按钮处理
   * 需求: 6.4
   *
   * 修复：点击"现在"时也吸附到整点，确保和拖动到最右侧的位置一致
   */
  const handleBackToNow = () => {
    const now = new Date();
    // 吸附到当前整点（和拖动逻辑保持一致）
    const snappedNow = snapToHour(now);
    setSelectedTime(snappedNow);
    onTimeChange(snappedNow);

    // 调用父组件的回调（恢复自动刷新）
    if (onBackToNow) {
      onBackToNow();
    }
  };

  /**
   * 只在组件初始化时设置一次 selectedTime
   * 之后完全由用户拖动控制，不会自动跳回
   */
  useEffect(() => {
    // 只在初始化时设置
    setSelectedTime(currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只运行一次

  // 硬核金融终端风格配色 - 使用 gluestack-ui tokens
  const backgroundColor = '$backgroundDark950'; // 深色背景
  const textColor = '$textDark50'; // 高对比度文本
  const tickColor = '$borderDark800'; // 边框色
  const indicatorColor = '$info500'; // 青色指示器
  const buttonColor = '$info500'; // 青色按钮

  // 判断是否在"现在"（1分钟内，且在工作日范围内）
  const now = new Date();
  const isAtNow =
    Math.abs(selectedTime.getTime() - now.getTime()) < 60000 &&
    now >= minTime &&
    now <= maxTime;

  return (
    <Box
      p="$4"
      borderRadius="$md"
      my="$2"
      bg={backgroundColor}
      borderWidth={0.5}
      borderColor={tickColor}>
      {/* 时间轴标题 - 使用等宽字体显示时间 */}
      <HStack justifyContent="space-between" alignItems="center" mb="$4">
        <Text
          size={hourChanged ? 'lg' : 'md'}
          fontWeight={hourChanged ? '$bold' : '$semibold'}
          color={textColor}>
          时间轴 - {formatTimeHourOnly(selectedTime)}
        </Text>
        {!isAtNow && (
          <Pressable
            onPress={handleBackToNow}
            px="$4"
            py="$2"
            borderRadius="$sm"
            bg={buttonColor}
            borderWidth={0.5}
            borderColor={buttonColor}>
            <Text color="$textDark950" size="sm" fontWeight="$semibold">
              现在
            </Text>
          </Pressable>
        )}
      </HStack>

      {/* 时间轴主体 - 移除背景，仅保留刻度和横线 */}
      <Box h={60} position="relative" mb="$2">
        {/* 时间刻度 - 只显示整点 */}
        <Box
          h={40}
          position="relative"
          mt="$2.5"
          w={axisWidth}
          ml={AXIS_PADDING}>
          {ticks.map((tick, index) => {
            return (
              <Box
                key={index}
                position="absolute"
                w={0.5}
                h="$3"
                top={14}
                left={tick.position}
                bg={tickColor}>
                <Text
                  position="absolute"
                  top={16}
                  size="xs"
                  color={textColor}
                  w={30}
                  textAlign="center"
                  style={{transform: [{translateX: -15}]}}>
                  {formatTime(tick.time)}
                </Text>
              </Box>
            );
          })}

          {/* 时间轴线 - 横线 */}
          <Box
            position="absolute"
            top={20}
            left={0}
            right={0}
            h={0.5}
            bg={tickColor}
          />
        </Box>

        {/* 可拖动的时间指示器 */}
        <Box
          {...panResponder.panHandlers}
          position="absolute"
          top={0}
          w={40}
          h={60}
          justifyContent="center"
          alignItems="center"
          left={indicatorPosition + AXIS_PADDING - 20}>
          {/* 指示器线条 */}
          <Box position="absolute" top={0} w={2} h={60} bg={indicatorColor} />
          {/* 可拖动的圆点 */}
          <Box
            position="absolute"
            top={20}
            w={hourChanged ? 30 : 24}
            h={hourChanged ? 30 : 24}
            borderRadius={hourChanged ? 15 : 12}
            bg={indicatorColor}
            borderWidth={0.5}
            borderColor="$backgroundDark950"
          />
        </Box>
      </Box>

      {/* 时间范围显示 */}
      <HStack justifyContent="space-between" mt="$2">
        <Text size="xs" fontWeight="$medium" color={textColor}>
          {formatTime(minTime)}
        </Text>
        <Text size="xs" fontWeight="$medium" color={textColor}>
          {formatTime(maxTime)}
        </Text>
      </HStack>
    </Box>
  );
};

export default TimeAxis;
