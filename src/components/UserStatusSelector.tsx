/**
 * UserStatusSelector - 硬核金融终端风格
 *
 * 设计原则:
 * - 纯黑背景 (#000000)
 * - 极细边框 (1px, #27272A)
 * - 统一 4px 圆角
 * - Shadcn 风格按钮
 * - 等宽数字字体 (Monospace)
 * - 高对比度文本
 * - 干脆利落的动画（Reanimated UI 线程）
 *
 * 验证需求: 9.1-9.5
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {SearchableSelector} from './SearchableSelector';
import {Tag, UserStatusSubmission} from '../types';
import {darkColors} from '../theme/colors';
import {duration, easing} from '../theme/animations';
import {typography} from '../theme/typography';
import {useTheme} from '../hooks/useTheme';

// 横向滚轮常量
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 56;
const ITEM_SPACING = 4;
const ITEM_TOTAL = ITEM_WIDTH + ITEM_SPACING;

interface UserStatusSelectorProps {
  visible: boolean;
  onStatusSelect: (status: UserStatusSubmission) => void;
  availableTags: Tag[];
  onLoadTags?: (search?: string, category?: string) => void;
  loading?: boolean;
  theme?: 'light' | 'dark';
  onCancel?: () => void;
}

/**
 * 用户状态选择器组件
 * 允许用户选择准时下班或加班状态，并选择相关标签和加班时长
 */
export const UserStatusSelector: React.FC<UserStatusSelectorProps> = ({
  visible,
  onStatusSelect,
  availableTags,
  onLoadTags,
  loading = false,
  theme = 'light',
  onCancel,
}) => {
  const [step, setStep] = useState<'status' | 'tag' | 'hours'>('status');
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(null);
  const [selectedHours, setSelectedHours] = useState<number>(1);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const selectedTagsRef = useRef<Tag[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const [pickerWidth, setPickerWidth] = useState(SCREEN_WIDTH * 0.9 - 32);

  // Reanimated 动画值 — 纯 fade，始终挂载，避免 DOM 变化导致主页闪烁
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  // 追踪上一次 visible 值，用于检测从 true→false 的变化
  const prevVisibleRef = useRef(false);

  const appTheme = useTheme();
  const tc = appTheme.colors;
  const textColor = tc.text;

  useEffect(() => {
    if (visible) {
      // 淡入动画
      overlayOpacity.value = withTiming(1, {
        duration: duration.normal,
        easing: easing.ease,
      });
      contentOpacity.value = withTiming(1, {
        duration: duration.normal,
        easing: easing.ease,
      });
    } else if (prevVisibleRef.current) {
      // 从 visible→hidden：淡出动画
      overlayOpacity.value = withTiming(0, {
        duration: duration.normal,
        easing: easing.easeIn,
      });
      contentOpacity.value = withTiming(0, {
        duration: duration.normal,
        easing: easing.easeIn,
      });

      // 淡出动画结束后重置内部状态
      const resetTimer = setTimeout(() => {
        setStep('status');
        setSelectedStatus(null);
        setSelectedHours(1);
        setShowTagSelector(false);
        selectedTagsRef.current = [];
      }, duration.normal);

      return () => clearTimeout(resetTimer);
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  /**
   * 处理状态选择（准时下班/加班）
   */
  const handleStatusSelect = (isOvertime: boolean) => {
    setSelectedStatus(isOvertime);
    setStep('tag');
    setShowTagSelector(true);
    if (onLoadTags) {
      onLoadTags(undefined, isOvertime ? 'overtime' : 'ontime');
    }
  };

  /**
   * 处理标签多选提交
   */
  const handleTagSubmit = (tags: Tag[]) => {
    console.log(
      '[UserStatusSelector] handleTagSubmit - Tags:',
      tags.map(t => t.name).join(', '),
    );
    const primaryTag = tags[0];
    const extraIds = tags.slice(1).map(t => t.id);
    selectedTagsRef.current = tags;

    console.log('[UserStatusSelector] Closing tag selector...');
    setShowTagSelector(false);

    if (selectedStatus === true) {
      console.log('[UserStatusSelector] Moving to hours selection...');
      setStep('hours');
    } else {
      console.log('[UserStatusSelector] Submitting on-time status...');
      submitStatus(false, primaryTag.id, undefined, extraIds);
    }
  };

  /**
   * 处理跳过标签选择
   * 准时下班：直接提交（无标签）
   * 加班：跳到时长选择步骤
   */
  const handleSkipTag = () => {
    console.log('[UserStatusSelector] handleSkipTag - skipping tag selection');
    selectedTagsRef.current = [];
    setShowTagSelector(false);

    if (selectedStatus === true) {
      // 加班：仍需选择时长
      console.log('[UserStatusSelector] Skip tag, moving to hours selection...');
      setStep('hours');
    } else {
      // 准时下班：直接提交
      console.log('[UserStatusSelector] Skip tag, submitting on-time status...');
      submitStatus(false, undefined, undefined, undefined);
    }
  };

  /**
   * 确认加班时长并提交
   */
  const handleConfirmHours = () => {
    const tags = selectedTagsRef.current;
    console.log('[UserStatusSelector] handleConfirmHours - selectedHours:', selectedHours, ', tags:', tags.length);
    if (tags.length > 0) {
      const extraIds = tags.slice(1).map(t => t.id);
      submitStatus(true, tags[0].id, selectedHours, extraIds);
    } else {
      // 跳过标签的情况，无标签直接提交时长
      submitStatus(true, undefined, selectedHours, undefined);
    }
  };

  /**
   * 提交用户状态
   */
  const submitStatus = (
    isOvertime: boolean,
    tagId?: string,
    overtimeHours?: number,
    extraTagIds?: string[],
  ) => {
    const submission: UserStatusSubmission = {
      isOvertime,
      tagId,
      extraTagIds: extraTagIds && extraTagIds.length > 0 ? extraTagIds : undefined,
      overtimeHours,
      timestamp: new Date(),
    };
    onStatusSelect(submission);
  };

  /**
   * 渲染状态选择界面
   */
  const renderStatusSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, {color: textColor}]}>今日下班情况</Text>
      <View style={styles.buttonRow}>
        <Pressable
          style={({pressed}) => [
            styles.statusButton,
            {backgroundColor: tc.text},
            pressed && {opacity: 0.85},
          ]}
          onPress={() => handleStatusSelect(false)}>
          <Text style={[styles.statusButtonText, {color: tc.background}]}>准时下班</Text>
        </Pressable>
        <Pressable
          style={({pressed}) => [
            styles.statusButton,
            {backgroundColor: tc.text},
            pressed && {opacity: 0.85},
          ]}
          onPress={() => handleStatusSelect(true)}>
          <Text style={[styles.statusButtonText, {color: tc.background}]}>加班</Text>
        </Pressable>
      </View>
    </View>
  );

  /**
   * 滚轮吸附
   */
  const snapToNearest = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / ITEM_TOTAL);
      const clamped = Math.max(0, Math.min(index, 11));
      const targetX = clamped * ITEM_TOTAL;
      setSelectedHours(clamped + 1);
      if (Math.abs(offsetX - targetX) > 1) {
        scrollRef.current?.scrollTo({x: targetX, animated: true});
      }
    },
    [],
  );

  /**
   * 点击某个小时数字，滚动到对应位置
   */
  const scrollToHour = useCallback(
    (hour: number) => {
      setSelectedHours(hour);
      scrollRef.current?.scrollTo({
        x: (hour - 1) * ITEM_TOTAL,
        animated: true,
      });
    },
    [],
  );

  /**
   * 渲染加班时长选择界面
   */
  const renderHoursSelection = () => {
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const sidePadding = (pickerWidth - ITEM_WIDTH) / 2;

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.title, {color: tc.text}]}>预计加班时长</Text>
        <Text style={[styles.subtitle, {color: tc.textTertiary}]}>
          左右滑动选择（小时）
        </Text>

        <View
          style={styles.pickerContainer}
          onLayout={e => {
            setPickerWidth(e.nativeEvent.layout.width);
          }}>
          <View
            style={[
              styles.pickerIndicator,
              {left: sidePadding - 2, width: ITEM_WIDTH + 4},
            ]}
            pointerEvents="none"
          />

          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            contentContainerStyle={{paddingHorizontal: sidePadding}}
            contentOffset={{x: (selectedHours - 1) * ITEM_TOTAL, y: 0}}
            onMomentumScrollEnd={snapToNearest}
            onScrollEndDrag={snapToNearest}
            bounces={false}>
            {hours.map(hour => {
              const isSelected = selectedHours === hour;
              return (
                <Pressable
                  key={hour}
                  onPress={() => scrollToHour(hour)}
                  style={({pressed}) => [
                    styles.pickerItem,
                    {marginRight: hour < 12 ? ITEM_SPACING : 0},
                    pressed && {opacity: 0.7},
                  ]}>
                  <Text
                    style={[
                      styles.pickerItemText,
                      {color: tc.textDisabled},
                      isSelected && styles.pickerItemTextSelected,
                      isSelected && {color: tc.text},
                    ]}>
                    {hour}
                  </Text>
                  {isSelected && (
                    <Text style={[styles.pickerUnit, {color: tc.textTertiary}]}>小时</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.fadeMask, styles.fadeMaskLeft]} pointerEvents="none" />
          <View style={[styles.fadeMask, styles.fadeMaskRight]} pointerEvents="none" />
        </View>

        <Pressable
          style={({pressed}) => [
            styles.confirmButton,
            {backgroundColor: tc.text},
            pressed && {opacity: 0.85},
          ]}
          onPress={handleConfirmHours}>
          <Text style={[styles.confirmButtonText, {color: tc.background}]}>确认提交</Text>
        </Pressable>
      </View>
    );
  };

  const currentCategory = selectedStatus ? 'overtime' : 'ontime';

  // 弹框是否处于活跃状态（控制 pointerEvents，避免隐藏时拦截触摸）
  const isActive = visible || showTagSelector;

  return (
    <>
      {/* 状态选择 / 加班时长选择 overlay — 始终挂载，纯 opacity 控制显隐 */}
      {!showTagSelector && (
        <ReAnimated.View
          style={[styles.modalOverlay, overlayStyle]}
          pointerEvents={isActive ? 'box-none' : 'none'}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (onCancel) {
                onCancel();
              }
            }}
          />
          <ReAnimated.View
            style={[
              styles.modalContent,
              {backgroundColor: tc.background},
              contentStyle,
            ]}
            pointerEvents={isActive ? 'box-none' : 'none'}>
            {step === 'status' && renderStatusSelection()}
            {step === 'hours' && renderHoursSelection()}
          </ReAnimated.View>
        </ReAnimated.View>
      )}

      {/* 标签选择器 — 始终渲染，通过 visible 控制显隐，确保关闭动画正常播放 */}
      <SearchableSelector
        key="tag-selector"
        visible={showTagSelector}
        title={selectedStatus ? '选择加班原因' : '选择下班标签'}
        type="position"
        items={availableTags}
        multiSelect={true}
        maxSelect={3}
        onSubmit={handleTagSubmit}
        onSkip={handleSkipTag}
        onClose={() => {
          console.log('[UserStatusSelector] Tag selector cancelled');
          setShowTagSelector(false);
          if (onCancel) {
            onCancel();
          }
        }}
        loading={loading}
        onSearch={onLoadTags ? (query?: string) => onLoadTags(query, currentCategory) : undefined}
        placeholder="搜索标签..."
      />
    </>
  );
};

/**
 * 硬核金融终端风格样式
 */
const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: 280,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#000000',
  },
  stepContainer: {
    width: '100%',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  statusButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#000000',
  },
  pickerContainer: {
    height: 80,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  pickerIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    zIndex: 1,
  },
  pickerItem: {
    width: ITEM_WIDTH,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: '300',
    fontFamily: 'Courier New',
    color: '#555',
  },
  pickerItemTextSelected: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerUnit: {
    fontSize: typography.fontSize.xxs,
    color: '#888',
    marginTop: 2,
  },
  fadeMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 2,
  },
  fadeMaskLeft: {
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  fadeMaskRight: {
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#000000',
  },
});
