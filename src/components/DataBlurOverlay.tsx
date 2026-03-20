import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {BlurView} from 'expo-blur';

/**
 * DataBlurOverlay - 数据毛玻璃遮罩组件
 * 当用户未提交当天状态时，覆盖在敏感数据区域上
 * 使用 expo-blur 实现精致的毛玻璃效果
 */

interface DataBlurOverlayProps {
  /** 是否显示模糊遮罩 */
  visible: boolean;
  /** 提示文字，传空字符串或不传则不显示提示 */
  hint?: string;
  /** 是否显示提示文字 */
  showHint?: boolean;
  /** 主题模式 */
  isDark?: boolean;
  /** 子组件（被遮罩的内容） */
  children: React.ReactNode;
}

export const DataBlurOverlay: React.FC<DataBlurOverlayProps> = ({
  visible,
  hint = '',
  showHint = false,
  isDark = true,
  children,
}) => {
  return (
    <View style={styles.wrapper}>
      {children}
      {visible && (
        <View style={styles.overlayContainer}>
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={styles.blurView}
          />
          {/* 半透明叠加层，轻微遮挡，隐隐约约效果 */}
          <View
            style={[
              styles.tintOverlay,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 0, 0, 0.35)'
                  : 'rgba(255, 255, 255, 0.35)',
              },
            ]}
          />
          {/* 提示文字 */}
          {showHint && hint ? (
            <View style={styles.hintContainer}>
              <Text
                size="xs"
                color={isDark ? '#888888' : '#999999'}
                textAlign="center">
                {hint}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 999,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  hintContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
