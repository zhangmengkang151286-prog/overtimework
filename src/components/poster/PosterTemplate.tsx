/**
 * 海报通用模板组件
 * 提供统一的布局和样式
 * 
 * 参考富途牛牛设计：
 * - 卡片式内容区域
 * - 合理的间距和留白
 * - 内容自适应 + ScrollView 防溢出
 * 
 * 验证需求: 7.1-7.6, 13.1-13.6
 */

import React, {forwardRef} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {LinearGradient} from 'expo-linear-gradient';
import {posterTheme, getPosterTheme} from '../../theme/posterTheme';
import {PosterTemplateProps} from '../../types/poster';
import {useThemeToggle} from '../../hooks/useThemeToggle';
import {Avatar} from '../../data/builtInAvatars';
import LoginLogo from '../../../assets/login-logo.svg';

export const PosterTemplate = React.memo(
  forwardRef<View, PosterTemplateProps>(
    ({user, date, title, children}, ref) => {
      const {isDark} = useThemeToggle();

      // 获取主题颜色
      const colors = getPosterTheme(isDark);

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}>
        {/* 背景渐变 */}
        <LinearGradient
          colors={colors.backgroundGradient}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Header - 左上LOGO，右上用户信息 */}
        <View style={[styles.header, {borderBottomColor: colors.border}]}>
          {/* 左上角：LOGO + 下班指数 */}
          <View style={styles.brandInfo}>
            <View style={[styles.logo, {overflow: 'hidden'}]}>
              <LoginLogo width={22} height={22} />
            </View>
            <Text
              style={[
                posterTheme.typography.bodySmall,
                {
                  color: colors.textSecondary,
                  marginLeft: 4,
                  fontWeight: '500',
                },
              ]}>
              下班指数
            </Text>
          </View>

          {/* 右上角：用户信息 */}
          <View style={styles.userBlock}>
            {/* 上层：头像 + 用户名 */}
            <View style={styles.userRow}>
              {user.avatar ? (
                <Avatar avatarId={user.avatar} size={28} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}>
                  <Text style={{color: colors.text, fontWeight: '600', fontSize: 11}}>
                    {user.username.charAt(0)}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  posterTheme.typography.bodySmall,
                  {color: colors.text, marginLeft: 6, fontWeight: '500'},
                ]}>
                {user.username}
              </Text>
            </View>
            {/* 下层：日期 */}
            <Text
              style={[
                posterTheme.typography.caption,
                {color: colors.textSecondary, fontSize: 11, marginTop: 2, textAlign: 'right'},
              ]}>
              {date}
            </Text>
          </View>
        </View>

        {/* 标题 */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              posterTheme.typography.subtitle,
              {color: colors.text, fontWeight: '700'},
            ]}>
            {title}
          </Text>
        </View>

        {/* Content - 海报内容（可滚动，防止溢出） */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {children}
        </ScrollView>
      </View>
    );
  }),
  (prevProps, nextProps) => {
    return (
      prevProps.user.avatar === nextProps.user.avatar &&
      prevProps.user.username === nextProps.user.username &&
      prevProps.date === nextProps.date &&
      prevProps.title === nextProps.title &&
      prevProps.children === nextProps.children
    );
  }
);

PosterTemplate.displayName = 'PosterTemplate';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: posterTheme.dimensions.width,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: posterTheme.spacing.lg,
    paddingTop: posterTheme.spacing.md,
    paddingBottom: posterTheme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBlock: {
    alignItems: 'flex-end',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: posterTheme.spacing.lg,
    paddingTop: posterTheme.spacing.sm,
    paddingBottom: posterTheme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: posterTheme.spacing.lg,
    paddingBottom: posterTheme.spacing.sm,
  },
});
