import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Tag} from '../types';
import {typography} from '../theme/typography';
import {useTheme} from '../hooks/useTheme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ANIM_DURATION = 250;
const TAG_ANIM_DURATION = 200;

interface SearchableSelectorProps {
  visible: boolean;
  title: string;
  type: 'industry' | 'company' | 'position';
  items: Tag[];
  selectedValue?: string;
  onSelect?: (item: Tag) => void;
  onSubmit?: (items: Tag[]) => void;
  onClose: () => void;
  onSkip?: () => void; // 跳过标签选择
  loading?: boolean;
  onSearch?: (query: string) => void;
  placeholder?: string;
  multiSelect?: boolean;
  maxSelect?: number;
}

/**
 * 标签分组数据结构
 */
interface TagGroup {
  label: string;
  tags: Tag[];
}

export const SearchableSelector: React.FC<SearchableSelectorProps> = ({
  visible,
  title,
  items,
  selectedValue,
  onSelect,
  onSubmit,
  onClose,
  onSkip,
  loading = false,
  placeholder = '搜索标签...',
  multiSelect = false,
  maxSelect = 3,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const tc = theme.colors;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // 动画控制
  const [shouldRender, setShouldRender] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const hasOpenedOnce = useRef(false);

  // 已选标签区域动画
  const selectedTagsHeight = useSharedValue(0);
  const selectedTagsOpacity = useSharedValue(0);
  // 延迟显示的标签列表，确保收起动画播放完毕后再清空内容
  const [displayedTags, setDisplayedTags] = useState<Tag[]>([]);

  // 标记关闭完成
  const markClosed = useCallback(() => {
    setShouldRender(false);
  }, []);

  useEffect(() => {
    if (visible) {
      hasOpenedOnce.current = true;
      setShouldRender(true);
      // 初始位置在屏幕下方
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;
      // 下一帧开始动画，确保 DOM 已挂载
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, {
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(0.8, {
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
        });
      });
    } else if (hasOpenedOnce.current && shouldRender) {
      // 滑出动画
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        {duration: ANIM_DURATION, easing: Easing.in(Easing.cubic)},
        finished => {
          if (finished) {
            runOnJS(markClosed)();
          }
        },
      );
      backdropOpacity.value = withTiming(0, {
        duration: ANIM_DURATION,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  // 关闭时清理搜索和选中状态
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedTags([]);
      setDisplayedTags([]);
      // 重置已选标签动画值
      selectedTagsHeight.value = 0;
      selectedTagsOpacity.value = 0;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  /**
   * 按 subcategory 分组，搜索时扁平显示匹配结果
   * 分组顺序：常用排第一，其他按 subcategory 出现顺序
   */
  const {groups, isSearching} = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => (b.usageCount || 0) - (a.usageCount || 0),
    );

    // 搜索模式：扁平显示匹配结果
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matched = sorted.filter(item =>
        item.name.toLowerCase().includes(query),
      );
      return {
        groups: [{label: `搜索结果`, tags: matched}] as TagGroup[],
        isSearching: true,
      };
    }

    // 按 subcategory 分组
    const groupMap = new Map<string, Tag[]>();
    const groupOrder: string[] = [];

    sorted.forEach(tag => {
      const key = tag.subcategory || '其他';
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
        groupOrder.push(key);
      }
      groupMap.get(key)!.push(tag);
    });

    // "我的常用"排第一，"常用"排第二，"其他"排最后
    const finalOrder = groupOrder.sort((a, b) => {
      if (a === '我的常用') return -1;
      if (b === '我的常用') return 1;
      if (a === '常用') return -1;
      if (b === '常用') return 1;
      if (a === '其他') return 1;
      if (b === '其他') return -1;
      return 0;
    });

    const result: TagGroup[] = finalOrder.map(key => ({
      label: key,
      tags: groupMap.get(key)!,
    }));

    return {groups: result, isSearching: false};
  }, [items, searchQuery]);

  const handleSelect = useCallback((item: Tag) => {
    if (multiSelect) {
      setSelectedTags(prev => {
        const isAlreadySelected = prev.some(t => t.id === item.id);
        let next: Tag[];
        if (isAlreadySelected) {
          next = prev.filter(t => t.id !== item.id);
        } else if (prev.length >= maxSelect) {
          return prev;
        } else {
          next = [...prev, item];
        }
        // 驱动已选标签区域动画
        if (next.length > 0 && prev.length === 0) {
          // 从无到有：立即更新显示内容，然后展开
          setDisplayedTags(next);
          selectedTagsHeight.value = withTiming(1, {duration: TAG_ANIM_DURATION});
          selectedTagsOpacity.value = withTiming(1, {duration: TAG_ANIM_DURATION});
        } else if (next.length > 0) {
          // 标签数量变化但不为零：立即更新显示内容
          setDisplayedTags(next);
        } else if (next.length === 0 && prev.length > 0) {
          // 从有到无：先播放收起动画，延迟清空显示内容
          selectedTagsHeight.value = withTiming(0, {duration: TAG_ANIM_DURATION});
          selectedTagsOpacity.value = withTiming(0, {duration: TAG_ANIM_DURATION});
          setTimeout(() => setDisplayedTags([]), TAG_ANIM_DURATION);
        }
        return next;
      });
    } else {
      if (onSelect) {
        onSelect(item);
      }
      setSearchQuery('');
    }
  }, [multiSelect, maxSelect, onSelect, selectedTagsHeight, selectedTagsOpacity]);

  // 移除已选标签
  const handleRemoveTag = useCallback((tagId: string) => {
    setSelectedTags(prev => {
      const next = prev.filter(t => t.id !== tagId);
      if (next.length === 0 && prev.length > 0) {
        // 收起动画，延迟清空
        selectedTagsHeight.value = withTiming(0, {duration: TAG_ANIM_DURATION});
        selectedTagsOpacity.value = withTiming(0, {duration: TAG_ANIM_DURATION});
        setTimeout(() => setDisplayedTags([]), TAG_ANIM_DURATION);
      } else {
        setDisplayedTags(next);
      }
      return next;
    });
  }, [selectedTagsHeight, selectedTagsOpacity]);

  // 已选标签区域的动画样式
  const selectedTagsAnimStyle = useAnimatedStyle(() => ({
    maxHeight: selectedTagsHeight.value * 60, // 最大展开高度 60
    opacity: selectedTagsOpacity.value,
    overflow: 'hidden' as const,
  }));

  // 提交多选结果
  const handleSubmit = () => {
    if (selectedTags.length > 0 && onSubmit) {
      onSubmit(selectedTags);
      setSearchQuery('');
      setSelectedTags([]);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedTags([]);
    onClose();
  };

  // 不渲染时返回 null
  if (!shouldRender) {
    return null;
  }

  // 动态颜色覆盖
  const colorOverrides = {
    backdrop: {backgroundColor: tc.background},
    container: {backgroundColor: tc.background},
    searchRow: {borderBottomColor: tc.border},
    cancelText: {color: tc.textTertiary},
    submitText: {color: tc.text},
    submitTextDisabled: {color: tc.textDisabled},
    searchContainer: {backgroundColor: tc.backgroundTertiary},
    searchIconCircle: {borderColor: tc.textDisabled},
    searchIconHandle: {backgroundColor: tc.textDisabled},
    searchInput: {color: tc.text},
    clearButtonText: {color: tc.textDisabled},
    sectionLabel: {color: tc.textTertiary},
    tagChip: {backgroundColor: tc.backgroundTertiary, borderColor: tc.border},
    tagChipSelected: {borderColor: tc.text, backgroundColor: tc.surfaceElevated},
    tagChipPressed: {backgroundColor: tc.surfaceElevated},
    tagChipText: {color: tc.text},
    tagChipTextSelected: {color: tc.text},
    loadingText: {color: tc.textDisabled},
    emptyText: {color: tc.textDisabled},
    divider: {backgroundColor: tc.border},
    selectedArea: {borderBottomColor: tc.border},
    selectedHint: {color: tc.textTertiary},
    skipText: {color: tc.textDisabled},
    selectedTagChip: {backgroundColor: tc.surfaceElevated, borderColor: tc.text},
    selectedTagText: {color: tc.text},
    selectedTagRemove: {color: tc.textTertiary},
  };

  return (
    <View style={styles.overlay} pointerEvents="auto">
      {/* 半透明遮罩 */}
      <ReAnimated.View style={[styles.backdrop, backdropStyle, colorOverrides.backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </ReAnimated.View>

      {/* 底部弹出面板 */}
      <ReAnimated.View style={[styles.sheetWrapper, sheetStyle]}>
        <View style={styles.clipWrapper}>
          <View style={[styles.container, {paddingTop: 12}, colorOverrides.container]}>
            {/* 搜索栏 + 取消/提交按钮在同一行 */}
            <View style={[styles.searchRow, colorOverrides.searchRow]}>
              {/* 左侧：取消按钮 */}
              <Pressable onPress={handleClose} style={styles.actionButton}>
                <Text style={[styles.cancelText, colorOverrides.cancelText]}>取消</Text>
              </Pressable>

              {/* 中间：搜索框 */}
              <View style={[styles.searchContainer, colorOverrides.searchContainer]}>
                <View style={styles.searchIconFlat}>
                  <View style={[styles.searchIconCircle, colorOverrides.searchIconCircle]} />
                  <View style={[styles.searchIconHandle, colorOverrides.searchIconHandle]} />
                </View>
                <TextInput
                  style={[styles.searchInput, colorOverrides.searchInput]}
                  placeholder={placeholder}
                  placeholderTextColor={tc.textDisabled}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}>
                    <Text style={[styles.clearButtonText, colorOverrides.clearButtonText]}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* 右侧：提交按钮（多选模式）或占位 */}
              {multiSelect ? (
                <Pressable
                  onPress={handleSubmit}
                  style={({pressed}) => [
                    styles.actionButton,
                    pressed && {opacity: 0.7},
                  ]}
                  disabled={selectedTags.length === 0}>
                  <Text
                    style={[
                      styles.submitText,
                      colorOverrides.submitText,
                      selectedTags.length === 0 && styles.submitTextDisabled,
                      selectedTags.length === 0 && colorOverrides.submitTextDisabled,
                    ]}>
                    提交
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.actionButtonPlaceholder} />
              )}
            </View>

            {/* 多选模式：已选标签 + 提示 */}
            {multiSelect && (
              <View style={[styles.selectedArea, colorOverrides.selectedArea]}>
                <View style={styles.selectedHintRow}>
                  <Text style={[styles.selectedHint, colorOverrides.selectedHint]}>
                    最多选择{maxSelect}个标签（已选 {selectedTags.length}/{maxSelect}）
                  </Text>
                  {onSkip && selectedTags.length === 0 && (
                    <Pressable
                      onPress={onSkip}
                      style={({pressed}) => [
                        styles.skipButton,
                        pressed && {opacity: 0.6},
                      ]}>
                      <Text style={[styles.skipText, colorOverrides.skipText]}>跳过，直接打卡</Text>
                    </Pressable>
                  )}
                </View>
                {/* 已选标签区域 — 始终渲染，用动画控制展开/收起 */}
                <ReAnimated.View style={[styles.selectedTagsWrap, selectedTagsAnimStyle]}>
                  {displayedTags.map(tag => (
                    <Pressable
                      key={tag.id}
                      style={({pressed}) => [
                        styles.selectedTagChip,
                        colorOverrides.selectedTagChip,
                        pressed && {opacity: 0.7},
                      ]}
                      onPress={() => handleRemoveTag(tag.id)}>
                      <Text style={[styles.selectedTagText, colorOverrides.selectedTagText]}>{tag.name}</Text>
                      <Text style={[styles.selectedTagRemove, colorOverrides.selectedTagRemove]}>✕</Text>
                    </Pressable>
                  ))}
                </ReAnimated.View>
              </View>
            )}

            {/* 标签分组流式布局 */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tc.text} />
                <Text style={[styles.loadingText, colorOverrides.loadingText]}>加载中...</Text>
                <View style={{height: Math.max(insets.bottom, 20) + 20}} />
              </View>
            ) : groups.length === 0 || groups.every(g => g.tags.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, colorOverrides.emptyText]}>
                  {isSearching ? '未找到匹配的标签' : '暂无标签数据'}
                </Text>
                <View style={{height: Math.max(insets.bottom, 20) + 20}} />
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                overScrollMode="never"
                nestedScrollEnabled={true}>
                {groups.map((group, groupIndex) => {
                  // 只有一个分组且名为"其他"时，不显示分组标题
                  const hideGroupLabel =
                    groups.length === 1 && group.label === '其他';
                  return (
                    <View key={group.label}>
                      {/* 分组之间的分隔线（第一组不显示） */}
                      {groupIndex > 0 && !hideGroupLabel && (
                        <View style={[styles.divider, colorOverrides.divider]} />
                      )}

                      {/* 分组标题（单分组"其他"时隐藏，但保留间距） */}
                      {!hideGroupLabel ? (
                        <Text style={[styles.sectionLabel, colorOverrides.sectionLabel]}>{group.label}</Text>
                      ) : groupIndex === 0 ? (
                        <View style={{height: 12}} />
                      ) : null}

                      {/* 标签 Chip 流式布局 */}
                      <View style={styles.tagWrap}>
                        {group.tags.map(item => {
                          const isSelected = multiSelect
                            ? selectedTags.some(t => t.id === item.id)
                            : selectedValue === item.id;
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => handleSelect(item)}
                              style={({pressed}) => [
                                styles.tagChip,
                                colorOverrides.tagChip,
                                isSelected && styles.tagChipSelected,
                                isSelected && colorOverrides.tagChipSelected,
                                pressed && styles.tagChipPressed,
                                pressed && colorOverrides.tagChipPressed,
                              ]}>
                              <Text
                                style={[
                                  styles.tagChipText,
                                  colorOverrides.tagChipText,
                                  isSelected && styles.tagChipTextSelected,
                                  isSelected && colorOverrides.tagChipTextSelected,
                                ]}
                                numberOfLines={1}>
                                {item.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
                {/* 底部安全区域填充，确保内容不被底部遮挡 */}
                <View style={{height: Math.max(insets.bottom, 20) + 20}} />
              </ScrollView>
            )}
          </View>
        </View>
      </ReAnimated.View>
    </View>
  );
};


const styles = StyleSheet.create({
  // 全屏覆盖层
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  // 半透明遮罩
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  // 底部弹出面板定位：贴底，最大高度 80% 屏幕
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.8,
    height: SCREEN_HEIGHT * 0.8,
  },
  // 外层专门做圆角裁剪，overflow:hidden 在此层生效
  clipWrapper: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },

  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  // 搜索栏 + 取消/提交按钮同一行
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  actionButtonPlaceholder: {
    width: 32,
  },
  cancelText: {
    fontSize: typography.fontSize.form,
    color: '#888',
    fontWeight: '500',
  },
  submitText: {
    fontSize: typography.fontSize.form,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitTextDisabled: {
    color: '#555',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  // 扁平化放大镜图标
  searchIconFlat: {
    width: 16,
    height: 16,
    marginRight: 8,
    position: 'relative',
  },
  searchIconCircle: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.5,
    borderColor: '#666',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchIconHandle: {
    width: 6,
    height: 1.5,
    backgroundColor: '#666',
    borderRadius: 1,
    position: 'absolute',
    bottom: 1.5,
    right: 0,
    transform: [{rotate: '45deg'}],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.form,
    color: '#E8EAED',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: typography.fontSize.md,
    color: '#666',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    color: '#888',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    letterSpacing: 0.5,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#18181B',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#27272A',
  },
  tagChipSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#27272A',
  },
  tagChipPressed: {
    backgroundColor: '#27272A',
  },
  tagChipText: {
    fontSize: typography.fontSize.base,
    color: '#E8EAED',
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: typography.fontSize.base,
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.form,
    color: '#666',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#27272A',
    marginHorizontal: 16,
    marginTop: 4,
  },
  selectedArea: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
  },
  selectedHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedHint: {
    fontSize: typography.fontSize.sm,
    color: '#888',
  },
  skipButton: {
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },
  selectedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    gap: 6,
  },
  selectedTagText: {
    fontSize: typography.fontSize.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedTagRemove: {
    fontSize: typography.fontSize.sm,
    color: '#888',
  },
});
