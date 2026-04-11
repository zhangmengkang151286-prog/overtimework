import React, {createContext, useContext, useState, useCallback, useRef} from 'react';
import {Image, StyleSheet, Dimensions} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import ViewShot, {captureRef} from 'react-native-view-shot';
import {useAppDispatch, useAppSelector} from './redux';
import {toggleTheme} from '../store/slices/uiSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app/theme';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

// 过渡动画时长
const FADE_DURATION = 350;

interface ThemeTransitionContextType {
  /** 带截图过渡动画的主题切换方法 */
  animatedToggleTheme: () => void;
  /** ViewShot ref，需要包裹在应用最外层 */
  viewShotRef: React.RefObject<ViewShot | null>;
}

const ThemeTransitionContext = createContext<ThemeTransitionContextType>({
  animatedToggleTheme: () => {},
  viewShotRef: {current: null},
});

export const useThemeTransition = () => useContext(ThemeTransitionContext);

/**
 * 主题过渡动画 Provider
 * 包裹在 App 最外层，提供截图淡出式主题切换
 */
export const ThemeTransitionProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state: any) => state.ui.theme);
  const viewShotRef = useRef<ViewShot>(null);
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const opacity = useSharedValue(1);
  // 防止重复触发
  const isTransitioning = useRef(false);

  const clearSnapshot = useCallback(() => {
    setSnapshotUri(null);
    isTransitioning.current = false;
  }, []);

  const animatedToggleTheme = useCallback(async () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    try {
      // 1. 截取当前屏幕
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 0.8,
      });

      // 2. 显示截图遮罩
      opacity.value = 1;
      setSnapshotUri(uri);

      // 3. 等一帧让截图渲染上去，再切换主题
      requestAnimationFrame(() => {
        dispatch(toggleTheme());
        // 持久化新主题到 AsyncStorage
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(err =>
          console.error('持久化主题失败:', err),
        );

        // 4. 截图淡出
        requestAnimationFrame(() => {
          opacity.value = withTiming(
            0,
            {duration: FADE_DURATION, easing: Easing.out(Easing.cubic)},
            finished => {
              if (finished) {
                runOnJS(clearSnapshot)();
              }
            },
          );
        });
      });
    } catch {
      // 截图失败时直接切换，不做动画
      dispatch(toggleTheme());
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(err =>
        console.error('持久化主题失败:', err),
      );
      isTransitioning.current = false;
    }
  }, [dispatch, opacity, clearSnapshot, currentTheme]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <ThemeTransitionContext.Provider value={{animatedToggleTheme, viewShotRef}}>
      <ViewShot ref={viewShotRef} style={{flex: 1}} options={{format: 'png', quality: 0.8}}>
        {children}
      </ViewShot>
      {/* 截图过渡遮罩 */}
      {snapshotUri && (
        <ReAnimated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, {zIndex: 9999}, overlayStyle]}>
          <Image
            source={{uri: snapshotUri}}
            style={{width: SCREEN_W, height: SCREEN_H}}
            resizeMode="cover"
          />
        </ReAnimated.View>
      )}
    </ThemeTransitionContext.Provider>
  );
};
