/**
 * LiveCard - 时薪卡片 LIVE 状态
 *
 * 加班时整个卡片背景有浅红色呼吸动画，替代"加班中"标签
 * 准时下班时背景为普通卡片色
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6
 */

import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {layout} from '../../theme/layout';
import {LiveMetrics} from '../../types/hourly-wage';
import {AnimatedNumber} from '../AnimatedNumber';

interface LiveCardProps {
  /** LIVE 状态下的实时数据 */
  metrics: LiveMetrics;
}

/**
 * 将毫秒数格式化为 HH:MM:SS 倒计时字符串
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const LiveCard: React.FC<LiveCardProps> = ({metrics}) => {
  const theme = useTheme();
  const tc = theme.colors;

  const isOvertime = metrics.variant === 'OVERTIME';
  const accentColor = isOvertime ? tc.overtime : tc.ontime;

  const countdown = useMemo(
    () => formatCountdown(metrics.remainingMs),
    [metrics.remainingMs],
  );

  return (
    <View
      style={styles.card}
      testID={`live-card-${metrics.variant.toLowerCase()}`}
    >
      {/* 顶部行：左边 ¥1813 今日已赚，右边倒计时 */}
      <View style={styles.headerRow}>
        <View style={styles.earnedRow}>
          <Text style={[styles.currencySign, {color: accentColor}]}>¥</Text>
          <AnimatedNumber
            value={Math.floor(metrics.earnedToday)}
            style={{
              fontSize: typography.fontSize['5xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.monospace,
              color: accentColor,
            }}
            duration={600}
            maxDigits={5}
          />
          <Text style={[styles.earnedSuffix, {color: tc.textTertiary}]}>今日已赚</Text>
        </View>
        <View style={styles.countdownBox}>
          <Text style={[styles.countdownLabel, {color: tc.textTertiary}]}>
            {isOvertime ? '加班倒计时' : '下班倒计时'}
          </Text>
          <Text style={[styles.countdownText, {color: tc.text}]}>
            {countdown}
          </Text>
        </View>
      </View>

      {/* 数据行 — 4个指标一行 */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, {color: tc.textTertiary}]}>名义时薪</Text>
          <Text style={[styles.metricValue, {color: tc.text}]}>
            ¥{Math.round(metrics.nominalHourlyRate)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, {color: tc.textTertiary}]}>今日时薪</Text>
          <Text style={[styles.metricValue, {color: isOvertime ? tc.overtime : tc.text}]}>
            ¥{Math.round(metrics.currentHourlyRate)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, {color: tc.textTertiary}]}>时薪稀释</Text>
          <Text style={[styles.metricValue, {color: isOvertime ? tc.overtime : tc.text}]}>
            {isOvertime ? `-${metrics.dilutionPercent.toFixed(1)}%` : '0%'}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, {color: tc.textTertiary}]}>预计白干</Text>
          <Text style={[styles.metricValue, {color: isOvertime ? tc.overtime : tc.text}]}>
            ¥{isOvertime ? metrics.expectedWastedAmount.toFixed(0) : '0'}
          </Text>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.base,
  },
  countdownBox: {
    alignItems: 'flex-end',
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    marginBottom: 2,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamily.monospace,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: 20,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySign: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.xs,
  },
  earnedSuffix: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginLeft: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  metricValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.monospace,
  },
});
