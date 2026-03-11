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
 * - 干脆利落的动画
 *
 * 验证需求: 9.1-9.5
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {SearchableSelector} from './SearchableSelector';
import {Tag, UserStatusSubmission} from '../types';
import {darkColors} from '../theme/colors';

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
  onCancel?: () => void; // 取消回调
}

/**
 * 用户状态选择器组件
 * 允许用户选择准点下班或加班状态，并选择相关标签和加班时长
 * 验证需求: 7.1-7.5
 */
export const UserStatusSelector: React.FC<UserStatusSelectorProps> = ({
  visible,
  onStatusSelect,
  availableTags,
  onLoadTags,
  loading = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  theme = 'light',
  onCancel,
}) => {
  const [step, setStep] = useState<'status' | 'tag' | 'hours'>('status');
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(null); // true = 加班, false = 准点下班
  const [selectedHours, setSelectedHours] = useState<number>(1);
  const [showTagSelector, setShowTagSelector] = useState(false);
  // 暂存多选标签，用于加班时长确认后批量提交
  const selectedTagsRef = useRef<Tag[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  // 滚轮容器宽度（运行时测量）
  const [pickerWidth, setPickerWidth] = useState(SCREEN_WIDTH * 0.9 - 32);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // 硬核金融风格配色 - 使用全局主题
  const textColor = darkColors.text; // #E8EAED 高对比度
  const borderColor = darkColors.border; // #27272A 极细边框

  useEffect(() => {
    if (visible) {
      // 遮罩淡入
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // 内容弹性缩放 + 淡入（参考登录界面的 spring 动画）
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      // 关闭时快速淡出
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      // 重置状态 - 确保完全清理
      const resetTimer = setTimeout(() => {
        setStep('status');
        setSelectedStatus(null);
        setSelectedHours(1);
        setShowTagSelector(false);
        selectedTagsRef.current = [];
      }, 200);

      return () => clearTimeout(resetTimer);
    }
  }, [visible]);

  /**
   * 处理状态选择（准点下班/加班）
   * 选择后加载对应分类的标签
   * 验证需求: 7.2, 7.3
   */
  const handleStatusSelect = (isOvertime: boolean) => {
    setSelectedStatus(isOvertime);
    setStep('tag');
    setShowTagSelector(true);
    // 加载对应分类的标签
    if (onLoadTags) {
      onLoadTags(undefined, isOvertime ? 'overtime' : 'ontime');
    }
  };

  /**
   * 处理标签多选提交
   * 只调用一次 onStatusSelect，额外标签通过 extraTagIds 传递
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
      // 加班：先选时长，确认后再提交
      console.log('[UserStatusSelector] Moving to hours selection...');
      setStep('hours');
    } else {
      // 准点下班：一次性提交，附带额外标签
      console.log(
        '[UserStatusSelector] Submitting on-time status...',
      );
      submitStatus(false, primaryTag.id, undefined, extraIds);
    }
  };

  /**
   * 确认加班时长并提交（一次性提交，附带额外标签）
   */
  const handleConfirmHours = () => {
    const tags = selectedTagsRef.current;
    console.log('[UserStatusSelector] handleConfirmHours - selectedHours:', selectedHours, ', tags:', tags.length);
    if (tags.length > 0) {
      const extraIds = tags.slice(1).map(t => t.id);
      submitStatus(true, tags[0].id, selectedHours, extraIds);
    }
  };

  /**
   * 提交用户状态（只调用一次 onStatusSelect）
   */
  const submitStatus = (
    isOvertime: boolean,
    tagId: string,
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
   * 渲染状态选择界面 - Shadcn 风格
   */
  const renderStatusSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, {color: textColor}]}>今日下班情况</Text>

      <View style={styles.buttonRow}>
        {/* 准时下班按钮 */}
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusSelect(false)}
          activeOpacity={0.85}>
          <Text style={styles.statusButtonText}>准时下班</Text>
        </TouchableOpacity>

        {/* 加班按钮 */}
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusSelect(true)}
          activeOpacity={0.85}>
          <Text style={styles.statusButtonText}>加班</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * 根据滚动偏移量计算并更新选中的小时数
   */
  const updateHoursFromOffset = useCallback(
    (offsetX: number) => {
      const index = Math.round(offsetX / ITEM_TOTAL);
      const clamped = Math.max(0, Math.min(index, 11));
      const newHours = clamped + 1;
      console.log('[UserStatusSelector] 滚轮偏移:', offsetX, '-> 选中小时:', newHours);
      setSelectedHours(newHours);
    },
    [],
  );

  /**
   * 横向滚轮惯性滚动结束时，吸附到最近的整数小时
   */
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateHoursFromOffset(e.nativeEvent.contentOffset.x);
    },
    [updateHoursFromOffset],
  );

  /**
   * 用户手指拖动结束时也更新选中值
   * 防止用户缓慢拖动松手（无惯性）时 onMomentumScrollEnd 不触发
   */
  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateHoursFromOffset(e.nativeEvent.contentOffset.x);
    },
    [updateHoursFromOffset],
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
   * 渲染加班时长选择界面 - 横向滚轮选择器（类似 iOS Picker 横版）
   */
  const renderHoursSelection = () => {
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    // 左右留白，让第1个和最后1个能滚到中间
    const sidePadding = (pickerWidth - ITEM_WIDTH) / 2;

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.title, {color: '#E8EAED'}]}>加班时长</Text>
        <Text style={[styles.subtitle, {color: '#888'}]}>
          左右滑动选择（小时）
        </Text>

        {/* 横向滚轮区域 */}
        <View
          style={styles.pickerContainer}
          onLayout={e => {
            setPickerWidth(e.nativeEvent.layout.width);
          }}>
          {/* 中间选中指示器 */}
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
            snapToInterval={ITEM_TOTAL}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: sidePadding,
            }}
            contentOffset={{x: (selectedHours - 1) * ITEM_TOTAL, y: 0}}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEndDrag}
            bounces={false}>
            {hours.map(hour => {
              const isSelected = selectedHours === hour;
              return (
                <TouchableOpacity
                  key={hour}
                  activeOpacity={0.7}
                  onPress={() => scrollToHour(hour)}
                  style={[
                    styles.pickerItem,
                    {marginRight: hour < 12 ? ITEM_SPACING : 0},
                  ]}>
                  <Text
                    style={[
                      styles.pickerItemText,
                      isSelected && styles.pickerItemTextSelected,
                    ]}>
                    {hour}
                  </Text>
                  {isSelected && (
                    <Text style={styles.pickerUnit}>小时</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 左侧渐隐遮罩 */}
          <View style={[styles.fadeMask, styles.fadeMaskLeft]} pointerEvents="none" />
          {/* 右侧渐隐遮罩 */}
          <View style={[styles.fadeMask, styles.fadeMaskRight]} pointerEvents="none" />
        </View>

        {/* 确认按钮 */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmHours}
          activeOpacity={0.85}>
          <Text style={styles.confirmButtonText}>确认提交</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 不显示任何内容时直接返回 null
  if (!visible) {
    return null;
  }

  // 如果正在显示标签选择器，只渲染标签选择器
  if (showTagSelector) {
    // 搜索时也要带上当前分类
    const currentCategory = selectedStatus ? 'overtime' : 'ontime';
    return (
      <SearchableSelector
        key="tag-selector"
        visible={true}
        title={selectedStatus ? '选择加班原因' : '选择下班标签'}
        type="position"
        items={availableTags}
        multiSelect={true}
        maxSelect={3}
        onSubmit={handleTagSubmit}
        onClose={() => {
          console.log('[UserStatusSelector] Tag selector cancelled');
          // 关闭标签选择器
          setShowTagSelector(false);
          // 通知父组件取消整个流程
          if (onCancel) {
            onCancel();
          }
        }}
        loading={loading}
        onSearch={onLoadTags ? (query?: string) => onLoadTags(query, currentCategory) : undefined}
        placeholder="搜索标签..."
      />
    );
  }

  // 使用绝对定位的 View 替代 Modal，避免白框问题
  return (
    <Animated.View
      style={[styles.modalOverlay, {opacity: overlayAnim}]}
      pointerEvents="box-none">
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => {
          if (onCancel) {
            onCancel();
          }
        }}
      />
      <Animated.View
        style={[
          styles.modalContent,
          {
            backgroundColor: '#000000',
            borderColor: borderColor,
          },
          {
            opacity: slideAnim,
            transform: [
              {
                scale: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents="box-none">
        {/* 状态选择 */}
        {step === 'status' && renderStatusSelection()}
        {/* 时长选择 */}
        {step === 'hours' && renderHoursSelection()}
      </Animated.View>
    </Animated.View>
  );
};

/**
 * 硬核金融终端风格样式
 *
 * 设计原则:
 * - 纯黑背景 (#000000, #09090B)
 * - 极细边框 (1px, #27272A)
 * - 统一 4px 圆角
 * - 无阴影、无渐变
 * - 高对比度文本
 * - 等宽数字字体
 */
const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // 注意: 使用 rgba 实现半透明遮罩效果，这是 Modal 的标准做法
    // gluestack-ui 的 Modal 组件也使用类似的半透明遮罩
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 更深的遮罩
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 4, // 统一 4px 圆角
    borderWidth: 1, // 极细边框
    padding: 16, // p-4 (16px)
    // 移除所有阴影
  },
  stepContainer: {
    width: '100%',
  },
  title: {
    fontSize: 18, // 标题字号
    fontWeight: '600', // 中等字重
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5, // 字间距
  },
  subtitle: {
    fontSize: 14,
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
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.5,
  },
  // 横向滚轮选择器
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
    fontSize: 28,
    fontWeight: '300',
    fontFamily: 'Courier New',
    color: '#555',
  },
  pickerItemTextSelected: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerUnit: {
    fontSize: 11,
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
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
