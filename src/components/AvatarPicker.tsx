/**
 * 头像选择器组件
 * 显示 20 个系统内置头像网格，供用户选择
 */

import React from 'react';
import {View, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import {BUILT_IN_AVATARS} from '../data/builtInAvatars';

interface AvatarPickerProps {
  /** 当前选中的头像 ID */
  selectedId: string | null;
  /** 选择头像回调 */
  onSelect: (avatarId: string) => void;
  /** 每行显示数量（默认 4） */
  columns?: number;
  /** 头像尺寸（默认 64） */
  avatarSize?: number;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedId,
  onSelect,
  columns = 4,
  avatarSize = 64,
}) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={BUILT_IN_AVATARS}
        numColumns={columns}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        columnWrapperStyle={styles.row}
        renderItem={({item}) => {
          const isSelected = selectedId === item.id;
          const SvgComponent = item.component;
          
          return (
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
              style={[
                styles.avatarWrap,
                isSelected && styles.avatarSelected,
              ]}
              accessibilityLabel={`选择头像 ${item.id}`}
              accessibilityState={{selected: isSelected}}>
              <SvgComponent width={avatarSize} height={avatarSize} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 9999, // 圆形
    borderWidth: 2,
    borderColor: 'transparent',
    width: '23%',
    aspectRatio: 1, // 确保是正方形容器，配合 borderRadius 形成圆形
  },
  avatarSelected: {
    borderColor: '#E7E9EA',
    backgroundColor: 'rgba(231, 233, 234, 0.1)',
  },
});
