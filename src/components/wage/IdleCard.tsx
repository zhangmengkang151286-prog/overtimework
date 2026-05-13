/**
 * IdleCard - 时薪卡片 IDLE 状态
 *
 * 三个分支：
 * 1. 无配置 → 引导配置薪资
 * 2. 周末/节假日 → 休息日占位
 * 3. 工作日未打卡 → 名义时薪 + 打卡入口
 *
 * 禁止渲染任何跳动数字（无 AnimatedNumber）
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {layout} from '../../theme/layout';
import {WageConfig} from '../../types/hourly-wage';
import {computeNominalHourlyRate, computeDailySalary} from '../../utils/wageCalc';

interface IdleCardProps {
  /** 薪资配置，null 表示用户资料不完整 */
  config: WageConfig | null;
  /** 今日是否为休息日（周末或法定节假日） */
  isHoliday: boolean;
  /** 点击"去打卡"按钮 */
  onCheckIn?: () => void;
}

export const IdleCard: React.FC<IdleCardProps> = ({
  config,
  isHoliday,
  onCheckIn,
}) => {
  const theme = useTheme();
  const tc = theme.colors;

  // 月薪数据异常（理论上不会出现，注册时必填）
  if (!config) {
    return (
      <View
        style={[styles.card, {backgroundColor: tc.card, borderColor: tc.cardBorder}]}
        testID="idle-card-no-config"
      >
        <Text style={[styles.label, {color: tc.textTertiary}]}>时薪卡片</Text>
        <Text style={[styles.guideText, {color: tc.textSecondary}]}>
          薪资数据异常，请到个人资料页检查
        </Text>
      </View>
    );
  }

  // 休息日
  if (isHoliday) {
    return (
      <View
        style={[styles.card, {backgroundColor: tc.card, borderColor: tc.cardBorder}]}
        testID="idle-card-holiday"
      >
        <Text style={[styles.label, {color: tc.textTertiary}]}>时薪卡片</Text>
        <Text style={[styles.holidayText, {color: tc.textSecondary}]}>
          今天休息日 🎉
        </Text>
        <Text style={[styles.holidayHint, {color: tc.textTertiary}]}>
          好好休息，明天继续
        </Text>
      </View>
    );
  }

  // 分支 3：工作日未打卡 — 展示名义时薪 + 打卡入口
  const nominalRate = computeNominalHourlyRate(config);
  const dailySalary = computeDailySalary(config);

  return (
    <View
      style={[styles.card, {backgroundColor: tc.card, borderColor: tc.cardBorder}]}
      testID="idle-card-workday"
    >
      <Text style={[styles.label, {color: tc.textTertiary}]}>时薪卡片</Text>

      {/* 名义时薪 */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, {color: tc.textTertiary}]}>名义时薪</Text>
          <Text style={[styles.metricValue, {color: tc.text}]}>
            ¥{nominalRate.toFixed(1)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, {color: tc.textTertiary}]}>日薪</Text>
          <Text style={[styles.metricValue, {color: tc.text}]}>
            ¥{dailySalary.toFixed(1)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, {color: tc.textTertiary}]}>标准下班</Text>
          <Text style={[styles.metricValue, {color: tc.text}]}>
            {config.workEndTime}
          </Text>
        </View>
      </View>

      {/* 打卡入口 */}
      <TouchableOpacity
        style={[styles.actionButton, {borderColor: tc.ontime}]}
        onPress={onCheckIn}
        activeOpacity={0.7}
        testID="checkin-button"
      >
        <Text style={[styles.actionButtonText, {color: tc.ontime}]}>去打卡</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: layout.borderWidth.thin,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.base,
  },
  label: {
    ...typography.styles.dataLabel,
    marginBottom: spacing.sm,
  },
  guideText: {
    ...typography.styles.body,
    marginBottom: spacing.base,
  },
  holidayText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  holidayHint: {
    ...typography.styles.caption,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.styles.caption,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.monospace,
  },
  actionButton: {
    height: layout.buttonHeight.md,
    borderRadius: layout.borderRadius.sm,
    borderWidth: layout.borderWidth.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.styles.button,
  },
});
