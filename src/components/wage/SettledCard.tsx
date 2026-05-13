/**
 * SettledCard - 时薪卡片 SETTLED 状态
 *
 * 静态展示 5 项结算数据：名义日薪、实际时薪、稀释百分比、白干时长、白干金额
 * ONTIME 下白干为 0 时展示正向文案（"今天没被白嫖"）
 * 提供重新打卡入口
 *
 * Requirements: 4.2, 4.3, 4.4
 */

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {layout} from '../../theme/layout';
import {SettledMetrics} from '../../types/hourly-wage';

interface SettledCardProps {
  /** SETTLED 状态下的结算数据 */
  metrics: SettledMetrics;
  /** 点击"重新打卡"入口 */
  onResubmit?: () => void;
}

export const SettledCard: React.FC<SettledCardProps> = ({metrics, onResubmit}) => {
  const theme = useTheme();
  const tc = theme.colors;

  const isOntime = metrics.wastedHours === 0;
  const accentColor = isOntime ? tc.ontime : tc.overtime;

  return (
    <View
      style={[styles.card, {backgroundColor: tc.card, borderColor: tc.cardBorder}]}
      testID={`settled-card-${isOntime ? 'ontime' : 'overtime'}`}
    >
      {/* 顶部标签 */}
      <View style={styles.headerRow}>
        <Text style={[styles.label, {color: tc.textTertiary}]}>时薪卡片</Text>
        <View style={[styles.badge, {borderColor: accentColor}]}>
          <Text style={[styles.badgeText, {color: accentColor}]}>已结算</Text>
        </View>
      </View>

      {/* 正向文案 or 警示文案 */}
      {isOntime ? (
        <Text style={[styles.positiveText, {color: tc.ontime}]} testID="positive-message">
          今天没被白嫖 ✌️
        </Text>
      ) : (
        <Text style={[styles.warningText, {color: tc.overtime}]} testID="warning-message">
          今天被白嫖了 ¥{metrics.wastedAmount.toFixed(0)}
        </Text>
      )}

      {/* 5 项结算数据 */}
      <View style={styles.dataGrid}>
        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <Text style={[styles.dataLabel, {color: tc.textTertiary}]}>名义日薪</Text>
            <Text style={[styles.dataValue, {color: tc.text}]}>
              ¥{metrics.nominalDailySalary.toFixed(1)}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={[styles.dataLabel, {color: tc.textTertiary}]}>实际时薪</Text>
            <Text style={[styles.dataValue, {color: tc.text}]}>
              ¥{metrics.actualHourlyRate.toFixed(1)}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={[styles.dataLabel, {color: tc.textTertiary}]}>稀释</Text>
            <Text
              style={[
                styles.dataValue,
                {color: metrics.dilutionPercent > 0 ? tc.overtime : tc.text},
              ]}
            >
              {metrics.dilutionPercent > 0
                ? `-${metrics.dilutionPercent.toFixed(1)}%`
                : '0%'}
            </Text>
          </View>
        </View>
        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <Text style={[styles.dataLabel, {color: tc.textTertiary}]}>白干时长</Text>
            <Text
              style={[
                styles.dataValue,
                {color: metrics.wastedHours > 0 ? tc.overtime : tc.text},
              ]}
            >
              {metrics.wastedHours > 0
                ? `${metrics.wastedHours.toFixed(1)}h`
                : '0h'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={[styles.dataLabel, {color: tc.textTertiary}]}>白干金额</Text>
            <Text
              style={[
                styles.dataValue,
                {color: metrics.wastedAmount > 0 ? tc.overtime : tc.text},
              ]}
            >
              {metrics.wastedAmount > 0
                ? `¥${metrics.wastedAmount.toFixed(0)}`
                : '¥0'}
            </Text>
          </View>
          <View style={styles.dataItem} />
        </View>
      </View>

      {/* 重新打卡入口 */}
      <TouchableOpacity
        style={[styles.resubmitButton, {borderColor: tc.border}]}
        onPress={onResubmit}
        activeOpacity={0.7}
        testID="resubmit-button"
      >
        <Text style={[styles.resubmitText, {color: tc.textSecondary}]}>
          重新打卡
        </Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.styles.dataLabel,
  },
  badge: {
    borderWidth: layout.borderWidth.thin,
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wide,
  },
  positiveText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.base,
  },
  warningText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.base,
  },
  dataGrid: {
    marginBottom: spacing.base,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dataItem: {
    flex: 1,
    alignItems: 'center',
  },
  dataLabel: {
    ...typography.styles.caption,
    marginBottom: spacing.xs,
  },
  dataValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.monospace,
  },
  resubmitButton: {
    height: layout.buttonHeight.sm,
    borderRadius: layout.borderRadius.sm,
    borderWidth: layout.borderWidth.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resubmitText: {
    ...typography.styles.buttonSmall,
  },
});
