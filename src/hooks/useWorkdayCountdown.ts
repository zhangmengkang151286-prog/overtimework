import {useState, useEffect} from 'react';

/**
 * 工作日倒计时Hook
 *
 * 功能：
 * - 计算距离下次工作日重置的剩余时间
 * - 计算进度百分比
 * - 返回格式化的倒计时文本
 * - 根据剩余时间返回颜色状态
 *
 * 工作日定义：早上 06:00 - 次日 05:59
 * 重置时间：每天早上 06:00
 */

interface WorkdayCountdown {
  // 剩余时间（毫秒）
  remainingMs: number;
  // 剩余小时数
  remainingHours: number;
  // 剩余分钟数
  remainingMinutes: number;
  // 进度百分比 (0-100) - 已过去的时间
  progressPercent: number;
  // 剩余百分比 (0-100) - 剩余的时间（用于倒计时进度条）
  remainingPercent: number;
  // 格式化的倒计时文本
  countdownText: string;
  // 进度条颜色
  progressColor: string;
  // 文本颜色
  textColor: string;
  // 是否即将重置（< 5分钟）
  isImminent: boolean;
}

/**
 * 计算下一个重置时间（早上6点）
 */
const getNextResetTime = (): Date => {
  const now = new Date();
  const nextReset = new Date(now);

  // 设置为今天早上6点
  nextReset.setHours(6, 0, 0, 0);

  // 如果现在已经过了今天早上6点，设置为明天早上6点
  if (now >= nextReset) {
    nextReset.setDate(nextReset.getDate() + 1);
  }

  return nextReset;
};

/**
 * 格式化倒计时文本
 */
const formatCountdown = (hours: number, minutes: number): string => {
  if (hours === 0 && minutes < 5) {
    return '即将重置';
  }

  if (hours === 0) {
    return `距离重置 ${minutes}分钟`;
  }

  if (hours >= 6) {
    return `距离重置 ${hours}小时`;
  }

  return `距离重置 ${hours}小时${minutes}分`;
};

/**
 * 根据剩余时间获取颜色
 */
const getProgressColor = (hours: number): string => {
  if (hours < 1) return '#FF5000'; // 红色 - 紧急
  if (hours < 3) return '#fb923c'; // 橙色 - 警告
  if (hours < 6) return '#fbbf24'; // 黄色 - 提醒
  return '#4ade80'; // 绿色 - 正常
};

/**
 * 根据剩余时间获取文本颜色
 */
const getTextColor = (hours: number, isDark: boolean): string => {
  if (hours < 1) return '#FF5000'; // 红色
  if (hours < 3) return '#fb923c'; // 橙色
  if (hours < 6) return '#fbbf24'; // 黄色
  return isDark ? '#9ca3af' : '#6b7280'; // 灰色
};

/**
 * 使用工作日倒计时Hook
 */
export const useWorkdayCountdown = (
  isDark: boolean = false,
): WorkdayCountdown => {
  const [countdown, setCountdown] = useState<WorkdayCountdown>(() => {
    const now = new Date();
    const nextReset = getNextResetTime();
    const remainingMs = nextReset.getTime() - now.getTime();
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor(
      (remainingMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    // 工作日总时长：24小时
    const totalMs = 24 * 60 * 60 * 1000;
    const progressPercent = Math.round(
      ((totalMs - remainingMs) / totalMs) * 100,
    );
    const remainingPercent = Math.round((remainingMs / totalMs) * 100);

    return {
      remainingMs,
      remainingHours,
      remainingMinutes,
      progressPercent: Math.max(0, Math.min(100, progressPercent)),
      remainingPercent: Math.max(0, Math.min(100, remainingPercent)),
      countdownText: formatCountdown(remainingHours, remainingMinutes),
      progressColor: getProgressColor(remainingHours),
      textColor: getTextColor(remainingHours, isDark),
      isImminent: remainingHours === 0 && remainingMinutes < 5,
    };
  });

  useEffect(() => {
    // 每分钟更新一次倒计时
    const updateCountdown = () => {
      const now = new Date();
      const nextReset = getNextResetTime();
      const remainingMs = nextReset.getTime() - now.getTime();
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor(
        (remainingMs % (1000 * 60 * 60)) / (1000 * 60),
      );

      // 工作日总时长：24小时
      const totalMs = 24 * 60 * 60 * 1000;
      const progressPercent = Math.round(
        ((totalMs - remainingMs) / totalMs) * 100,
      );
      const remainingPercent = Math.round((remainingMs / totalMs) * 100);

      setCountdown({
        remainingMs,
        remainingHours,
        remainingMinutes,
        progressPercent: Math.max(0, Math.min(100, progressPercent)),
        remainingPercent: Math.max(0, Math.min(100, remainingPercent)),
        countdownText: formatCountdown(remainingHours, remainingMinutes),
        progressColor: getProgressColor(remainingHours),
        textColor: getTextColor(remainingHours, isDark),
        isImminent: remainingHours === 0 && remainingMinutes < 5,
      });
    };

    // 立即更新一次
    updateCountdown();

    // 每分钟更新
    const interval = setInterval(updateCountdown, 60 * 1000);

    return () => clearInterval(interval);
  }, [isDark]);

  return countdown;
};
