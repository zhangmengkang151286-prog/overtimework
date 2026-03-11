import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import {Tag} from '../types';

interface SearchableSelectorProps {
  visible: boolean;
  title: string;
  type: 'industry' | 'company' | 'position';
  items: Tag[];
  selectedValue?: string;
  onSelect?: (item: Tag) => void;
  onSubmit?: (items: Tag[]) => void;
  onClose: () => void;
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
  loading = false,
  placeholder = '搜索标签...',
  multiSelect = false,
  maxSelect = 3,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // 关闭时清理搜索和选中状态
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedTags([]);
    }
  }, [visible]);

  /**
   * 按 subcategory 分组，搜索时扁平显示匹配结果
   * 分组顺序：常用排第一，其他按 subcategory 出现顺序
   */
  const {groups, totalCount, isSearching} = useMemo(() => {
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
        totalCount: items.length,
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

    // 常用排第一，其他排最后
    const finalOrder = groupOrder.sort((a, b) => {
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

    return {groups: result, totalCount: items.length, isSearching: false};
  }, [items, searchQuery]);

  const handleSelect = (item: Tag) => {
    if (multiSelect) {
      // 多选模式：切换选中/取消
      setSelectedTags(prev => {
        const isAlreadySelected = prev.some(t => t.id === item.id);
        if (isAlreadySelected) {
          return prev.filter(t => t.id !== item.id);
        }
        if (prev.length >= maxSelect) {
          return prev; // 已达上限，不添加
        }
        return [...prev, item];
      });
    } else {
      // 单选模式：直接回调
      if (onSelect) {
        onSelect(item);
      }
      setSearchQuery('');
    }
  };

  // 移除已选标签
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };

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

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      style={styles.modal}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="fadeOut"
      animationInTiming={300}
      animationOutTiming={1}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={1}
      avoidKeyboard={true}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
      statusBarTranslucent={true}>
      <View style={styles.container}>
        {/* 顶部搜索栏 */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {multiSelect ? (
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                selectedTags.length === 0 && styles.submitButtonDisabled,
              ]}
              disabled={selectedTags.length === 0}>
              <Text
                style={[
                  styles.submitButtonText,
                  selectedTags.length === 0 && styles.submitButtonTextDisabled,
                ]}>
                提交
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>取消</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 多选模式：已选标签 + 提示 */}
        {multiSelect && (
          <View style={styles.selectedArea}>
            <Text style={styles.selectedHint}>
              最多选择{maxSelect}个（已选 {selectedTags.length}/{maxSelect}）
            </Text>
            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsWrap}>
                {selectedTags.map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    style={styles.selectedTagChip}
                    onPress={() => handleRemoveTag(tag.id)}
                    activeOpacity={0.7}>
                    <Text style={styles.selectedTagText}>{tag.name}</Text>
                    <Text style={styles.selectedTagRemove}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 标题 */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {isSearching
              ? `找到 ${groups[0]?.tags.length || 0} 个结果`
              : `共 ${totalCount} 个标签`}
          </Text>
        </View>

        {/* 标签分组流式布局 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : groups.length === 0 || groups.every(g => g.tags.length === 0) ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isSearching ? '未找到匹配的标签' : '暂无标签数据'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {groups.map((group, groupIndex) => {
              // 只有一个分组且名为"其他"时，不显示分组标题
              const hideGroupLabel =
                groups.length === 1 && group.label === '其他';
              return (
              <View key={group.label}>
                {/* 分组之间的分隔线（第一组不显示） */}
                {groupIndex > 0 && !hideGroupLabel && (
                  <View style={styles.divider} />
                )}

                {/* 分组标题（单分组"其他"时隐藏，但保留间距） */}
                {!hideGroupLabel ? (
                  <Text style={styles.sectionLabel}>{group.label}</Text>
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
                          isSelected && styles.tagChipSelected,
                          pressed && styles.tagChipPressed,
                        ]}>
                        <Text
                          style={[
                            styles.tagChipText,
                            isSelected && styles.tagChipTextSelected,
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
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
    gap: 12,
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
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#E8EAED',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EAED',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  scrollView: {
    flexGrow: 0,
  },
  sectionLabel: {
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#27272A',
    marginHorizontal: 16,
    marginTop: 4,
  },
  submitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#27272A',
  },
  submitButtonText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#555',
  },
  selectedArea: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
  },
  selectedHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
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
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedTagRemove: {
    fontSize: 12,
    color: '#888',
  },
});
