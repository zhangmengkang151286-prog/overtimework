/**
 * 个人成就海报组件
 * 纯黑底（#000）布局，包含顶部栏、插画区、数据区、分隔线、底部栏
 *
 * Requirements: 1.1-1.9, 2.1-2.3, 3.1-3.4
 */

import React, {forwardRef, useMemo, useState, useCallback, useEffect} from 'react';
import {View, Image, StyleSheet, Dimensions, Text} from 'react-native';
import {AchievementPosterData} from '../../types/achievement-poster';
import {getPercentageColor} from '../../services/achievementPosterService';
import {Avatar} from '../../data/builtInAvatars';

// APP LOGO 图片（96x96 小尺寸版本，加速渲染）
const APP_LOGO = require('../../../assets/logo_96.png');

const {width: SCREEN_WIDTH} = Dimensions.get('window');
// 海报宽度，左右各留 8px 边距
const POSTER_WIDTH = SCREEN_WIDTH - 16;

interface AchievementPosterProps {
  data: AchievementPosterData;
  onImagesReady?: () => void; // 所有图片解码完成回调
  isExporting?: boolean; // 导出截图时为 true，去掉圆角避免白角
}

export const AchievementPoster = forwardRef<View, AchievementPosterProps>(
  ({data, onImagesReady, isExporting = false}, ref) => {
    const percentageColor = getPercentageColor(data.rankPercentage);

    // 追踪 2 张图片的加载状态（顶部 LOGO、插画）
    const [loadedCount, setLoadedCount] = useState(0);
    const handleImageLoad = useCallback(() => {
      setLoadedCount(prev => prev + 1);
    }, []);

    // 2 张图片全部加载完成时通知父组件
    useEffect(() => {
      if (loadedCount >= 2 && onImagesReady) {
        onImagesReady();
      }
    }, [loadedCount, onImagesReady]);

    // 海报生成时间（渲染时固定）
    const generatedTime = useMemo(() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const d = now.getDate();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      return `${y}/${m}/${d} ${hh}:${mm}`;
    }, []);

    return (
      <View ref={ref} style={[styles.container, isExporting && {borderRadius: 0}]} collapsable={false}>
        {/* 顶部栏：左侧 LOGO + "下班指数" + 日期，右侧用户名 + 头像 */}
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              {/* APP LOGO */}
              <Image source={APP_LOGO} style={styles.logoImage} fadeDuration={0} onLoad={handleImageLoad} />
              <Text style={styles.brandText}>下班指数</Text>
            </View>
            <Text style={styles.dateText}>{generatedTime}</Text>
          </View>
          <View style={styles.userRow}>
            <Text style={styles.usernameText}>{data.username}</Text>
            <Avatar avatarId={data.avatarId} size={28} />
          </View>
        </View>

        {/* 主视觉区：PNG 插画 + 动态文案 */}
        <View style={styles.visualArea}>
          <Image
            source={data.illustrationSource}
            style={styles.illustration}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={handleImageLoad}
          />
          <Text style={styles.captionText}>{data.caption}</Text>
        </View>

        {/* 数据区 */}
        <View style={styles.dataArea}>
          {/* 参与人数小字，人数加粗突出 */}
          <Text style={styles.participantText}>
            本轮截止此刻 · <Text style={styles.participantCount}>{data.participantText}</Text> 人参与
          </Text>
          {/* 排名百分比大字 */}
          <View style={styles.percentageRow}>
            <Text style={styles.prefixText}>{data.prefixText}</Text>
            <Text style={[styles.percentageNumber, {color: percentageColor}]}>
              {data.percentageText}
            </Text>
            <Text style={styles.suffixText}>{data.suffixText}</Text>
          </View>
        </View>

        {/* 分隔线 */}
        <View style={styles.divider} />

        {/* 底部栏：slogan 居中 */}
        <View style={styles.footer}>
          <Text style={styles.sloganText}>
            下班指数 · 记录我们的下班时刻
          </Text>
        </View>
      </View>
    );
  },
);

AchievementPoster.displayName = 'AchievementPoster';


const styles = StyleSheet.create({
  container: {
    width: POSTER_WIDTH,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },

  // ---- 顶部栏 ----
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  brandText: {
    color: '#8A8D91',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  dateText: {
    color: '#555555',
    fontSize: 11,
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    color: '#E8EAED',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },

  // ---- 主视觉区 ----
  visualArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustration: {
    width: POSTER_WIDTH - 40,
    height: (POSTER_WIDTH - 40) * 0.9,
  },
  captionText: {
    color: '#E8EAED',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },

  // ---- 数据区 ----
  dataArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  participantText: {
    color: '#8A8D91',
    fontSize: 13,
    marginBottom: 8,
  },
  participantCount: {
    fontWeight: '700',
    color: '#E8EAED',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prefixText: {
    color: '#E8EAED',
    fontSize: 18,
    fontWeight: '500',
  },
  percentageNumber: {
    fontSize: 60,
    fontWeight: '800',
    marginHorizontal: 4,
    // 颜色由 props 动态设置
  },
  suffixText: {
    color: '#E8EAED',
    fontSize: 18,
    fontWeight: '500',
  },

  // ---- 分隔线 ----
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2F3336',
    marginBottom: 16,
  },

  // ---- 底部栏 ----
  footer: {
    alignItems: 'center',
  },
  sloganText: {
    color: '#8A8D91',
    fontSize: 11,
  },
});
