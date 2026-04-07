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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posterData, setPosterData] = useState<AchievementPosterData | null>(
    null,
  );

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

  /**
   * 保存到相册
   */
  const handleSave = useCallback(async () => {
    if (!posterRef.current) return;
    try {
      setSaving(true);
      // 复用 posterGenerator 的截图 + 保存逻辑
      const uri = await posterGeneratorService.captureView(posterRef as React.RefObject<View>);
      await posterGeneratorService.saveToLibrary(uri);
    } catch (err) {
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
      const uri = await posterGeneratorService.captureView(posterRef as React.RefObject<View>);
      await posterGeneratorService.shareImage(uri);
    } catch (err) {
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

  // ---- 加载状态 ----
  if (loading) {
    return (
      <Box
        flex={1}
        backgroundColor={tc.background}
        justifyContent="center"
        alignItems="center">
        <ActivityIndicator size="large" color={tc.text} />
        <Text color={tc.textTertiary} marginTop="$4" fontSize="$sm">
          生成海报中...
        </Text>
      </Box>
    );
  }

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

  return (
    <Box flex={1} backgroundColor={tc.background}>
      {/* 顶部导航栏 */}
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

      {/* 海报内容 - 居中展示 */}
      <ScrollView
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {posterData && (
          <AchievementPoster ref={posterRef} data={posterData} />
        )}
      </ScrollView>
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
