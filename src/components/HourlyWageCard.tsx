/**
 * HourlyWageCard - 时薪卡片总装组件
 *
 * 聚合 useWageConfig、useTodaySubmission、useIsTodayHoliday
 * 通过 useWageCardState 路由三态，渲染对应子卡片
 * 月薪从用户注册资料中读取，无需配置弹窗
 *
 * Requirements: 1.1, 1.7, 2.1, 3.1, 4.1, 8.1
 */

import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {useWageConfig} from '../hooks/useWageConfig';
import {useWageCardState} from '../hooks/useWageCardState';
import {useIsTodayHoliday} from '../hooks/useIsTodayHoliday';
import {useAppSelector} from '../hooks/redux';
import {WageSubmission} from '../types/hourly-wage';
import {IdleCard} from './wage/IdleCard';
import {LiveCard} from './wage/LiveCard';
import {SettledCard} from './wage/SettledCard';
import {spacing} from '../theme/spacing';

interface HourlyWageCardProps {
  userId: string;
  /** 点击"去打卡"或"重新打卡"时的回调 */
  onCheckIn?: () => void;
}

/**
 * 从 Redux 中的 userStatus.lastSubmission 派生 WageSubmission
 * 返回 null 表示今日无打卡
 */
function useTodaySubmission(): WageSubmission | null {
  const userStatus = useAppSelector(state => state.user.userStatus);

  return useMemo(() => {
    if (!userStatus.hasSubmittedToday || !userStatus.lastSubmission) {
      return null;
    }

    const sub = userStatus.lastSubmission;
    const submittedAt =
      typeof sub.timestamp === 'string'
        ? new Date(sub.timestamp)
        : sub.timestamp instanceof Date
          ? sub.timestamp
          : new Date();

    return {
      isOvertime: sub.isOvertime,
      overtimeHours: sub.overtimeHours ?? 0,
      submittedAt,
    };
  }, [userStatus.hasSubmittedToday, userStatus.lastSubmission]);
}

/**
 * 时薪卡片总装组件
 */
export const HourlyWageCard: React.FC<HourlyWageCardProps> = ({
  userId,
  onCheckIn,
}) => {
  const {config} = useWageConfig(userId);
  const submission = useTodaySubmission();
  const isHoliday = useIsTodayHoliday();

  const {state, liveMetrics, settledMetrics} = useWageCardState({
    config,
    submission,
    isHoliday,
  });

  // 根据状态渲染对应子卡片
  const renderCard = () => {
    switch (state) {
      case 'IDLE':
        return (
          <IdleCard
            config={config}
            isHoliday={isHoliday}
            onCheckIn={onCheckIn}
          />
        );
      case 'LIVE':
        return (
          <LiveCard
            metrics={liveMetrics!}
          />
        );
      case 'SETTLED':
        return (
          <SettledCard
            metrics={settledMetrics!}
            onResubmit={onCheckIn}
          />
        );
    }
  };

  return (
    <View style={styles.container} testID="hourly-wage-card">
      {renderCard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
});
