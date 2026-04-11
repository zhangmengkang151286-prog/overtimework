/**
 * 个人成就海报页面
 * 单海报展示，移除轮播逻辑
 * 复用现有 posterGenerator 的截图/保存/分享逻辑
 *
 * Requirements: 6.1-6.6
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text as RNText,
  ScrollView,
} from 'react-native';
import {customAlert} from '../components/CustomAlert';
import {Box, Text, Pressable} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

// 组件
import {AchievementPoster} from '../components/poster/AchievementPoster';

// 类型
import {AchievementPosterData} from '../types/achievement-poster';

// 服务
import {getPosterData} from '../services/achievementPosterService';
import {posterGeneratorService} from '../services/posterGenerator';

// 主题
import {typography} from '../theme/typography';
import {useTheme} from '../hooks/useTheme';

export const AchievementPosterScreen: React.FC = () => {
  const navigation = useNavigation();
  const currentUser = useSelector((state: any) => state?.user?.currentUser);
  const theme = useTheme();
  const tc = theme.colors;

  // 状态
  const [loading, setLoading] = useState(true);
  const [imagesReady, setImagesReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posterData, setPosterData] = useState<AchievementPosterData | null>(
    null,
  );
  // 导出截图时为 true，去掉海报圆角避免分享后白角
  const [isExporting, setIsExporting] = useState(false);

  // 海报 ref（用于 view-shot 截图）
  const posterRef = useRef<View>(null);

  /**
   * 加载海报数据
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = currentUser?.id;
      if (!userId) {
        throw new Error('用户未登录，请先登录');
      }

      const data = await getPosterData(userId);
      setPosterData(data);
    } catch (err) {
      console.error('加载海报数据失败:', err);
      const msg =
        err instanceof Error ? err.message : '数据加载失败，请重试';
      setError(msg);
      customAlert('加载失败', msg, [
        {text: '取消', style: 'cancel'},
        {text: '重试', onPress: loadData},
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 海报图片全部解码完成的回调
  const handleImagesReady = useCallback(() => {
    setImagesReady(true);
  }, []);

  /**
   * 保存到相册
   */
  const handleSave = useCallback(async () => {
    if (!posterRef.current) return;
    try {
      setSaving(true);
      // 去掉圆角后等一帧再截图
      setIsExporting(true);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const uri = await posterGeneratorService.captureView(posterRef as React.RefObject<View>);
      setIsExporting(false);
      await posterGeneratorService.saveToLibrary(uri);
    } catch (err) {
      setIsExporting(false);
      console.error('保存失败:', err);
      if (err instanceof Error && !err.message.includes('权限')) {
        customAlert('保存失败', '无法保存海报，是否重试？', [
          {text: '取消', style: 'cancel'},
          {text: '重试', onPress: handleSave},
        ]);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * 系统分享
   */
  const handleShare = useCallback(async () => {
    if (!posterRef.current) return;
    try {
      setSaving(true);
      // 去掉圆角后等一帧再截图
      setIsExporting(true);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const uri = await posterGeneratorService.captureView(posterRef as React.RefObject<View>);
      setIsExporting(false);
      await posterGeneratorService.shareImage(uri);
    } catch (err) {
      setIsExporting(false);
      console.error('分享失败:', err);
      if (err instanceof Error && !err.message.includes('cancelled')) {
        customAlert('分享失败', '无法分享海报，是否重试？', [
          {text: '取消', style: 'cancel'},
          {text: '重试', onPress: handleShare},
        ]);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  // ---- 错误状态 ----
  if (error && !posterData) {
    return (
      <Box
        flex={1}
        backgroundColor={tc.background}
        justifyContent="center"
        alignItems="center"
        padding="$6">
        <Text
          color={tc.error}
          fontSize="$lg"
          fontWeight="$semibold"
          marginBottom="$4">
          {error}
        </Text>
        <Pressable onPress={loadData}>
          <Box
            paddingHorizontal="$6"
            paddingVertical="$3"
            backgroundColor={tc.primary}
            borderRadius="$lg">
            <Text color={tc.text} fontWeight="$semibold">
              重试
            </Text>
          </Box>
        </Pressable>
      </Box>
    );
  }

  // 是否完全就绪（数据 + 图片都加载完）
  const fullyReady = !loading && imagesReady;

  return (
    <Box flex={1} backgroundColor={tc.background}>
      {/* 顶部导航栏 - 就绪后才显示 */}
      {fullyReady && (
        <View
          style={{
            paddingTop: Platform.OS === 'ios' ? 50 : 16,
            backgroundColor: tc.background,
          }}>
          <View style={[screenStyles.header, {borderBottomColor: tc.border, backgroundColor: tc.background}]}>
            <Pressable onPress={handleBack} style={screenStyles.headerBtn}>
              <RNText style={[screenStyles.headerBtnText, {color: tc.text}]}>返回</RNText>
            </Pressable>
            <View style={{flexDirection: 'row', gap: 20}}>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={[
                  screenStyles.headerBtn,
                  {opacity: saving ? 0.4 : 1},
                ]}>
                <RNText style={[screenStyles.headerBtnText, {color: tc.text}]}>保存</RNText>
              </Pressable>
              <Pressable
                onPress={handleShare}
                disabled={saving}
                style={[
                  screenStyles.headerBtn,
                  {opacity: saving ? 0.4 : 1},
                ]}>
                <RNText style={[screenStyles.headerBtnText, {color: tc.text}]}>分享</RNText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* 海报内容 - 隐藏渲染让图片解码，就绪后显示 */}
      <ScrollView
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {posterData && (
          <View style={{opacity: fullyReady ? 1 : 0}}>
            <AchievementPoster ref={posterRef} data={posterData} onImagesReady={handleImagesReady} isExporting={isExporting} />
          </View>
        )}
      </ScrollView>

      {/* 统一的全屏 loading 覆盖层（数据加载 + 图片解码期间） */}
      {!fullyReady && (
        <View style={[StyleSheet.absoluteFill, {backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size="large" color={tc.text} />
          <RNText style={{color: tc.textTertiary, marginTop: 16, fontSize: 13}}>生成海报中...</RNText>
        </View>
      )}
    </Box>
  );
};

const screenStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: 4,
    minWidth: 50,
  },
  headerBtnText: {
    fontSize: typography.fontSize.nav,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});

export default AchievementPosterScreen;
