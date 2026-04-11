import React, {useEffect, useState, useCallback, useRef} from 'react';
import {StatusBar, View, Text, ActivityIndicator, Animated, Image, StyleSheet, Dimensions} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider, useSelector, useDispatch} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config as gluestackConfig} from '@gluestack-ui/config';
import {useFonts, Inter_400Regular, Inter_700Bold} from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import {store} from './src/store';
import {setUser} from './src/store/slices/userSlice';
import {setTheme as setReduxTheme} from './src/store/slices/uiSlice';
import {storageService} from './src/services/storage';
import {
  ErrorBoundary,
  NetworkStatusBar,
  ToastContainer,
} from './src/components';
import {CustomAlertProvider} from './src/components/CustomAlert';
import {appStartupOptimizer} from './src/utils/appOptimization';
import {typography} from './src/theme/typography';
import {getTheme} from './src/theme';
import {ThemeTransitionProvider} from './src/hooks/useThemeTransition';

// 初始化 Sentry 错误监控
Sentry.init({
  dsn: 'https://1999e3c3ae8b9a8fb84511ca5740f3ca@o4511111489585152.ingest.us.sentry.io/4511111501316096',
  // 开发环境不上报，只在生产环境启用
  enabled: !__DEV__,
  // 采样率：100% 的错误都上报
  tracesSampleRate: 0.2,
  // 附带面包屑（用户操作路径），方便排查
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
});

// 阻止闪屏自动隐藏，由代码手动控制
SplashScreen.preventAutoHideAsync();

// 所有页面直接导入，确保流畅的页面切换体验
import TrendPage from './src/screens/TrendPage';
import {LoginScreen} from './src/screens/LoginScreen';
import {PhoneRegisterScreen} from './src/screens/PhoneRegisterScreen';
import {AvatarSelectionScreen} from './src/screens/AvatarSelectionScreen';
import {CompleteProfileScreen} from './src/screens/CompleteProfileScreen';
import {SetPasswordScreen} from './src/screens/SetPasswordScreen';
import {PasswordRecoveryScreen} from './src/screens/PasswordRecoveryScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {AvatarEditScreen} from './src/screens/AvatarEditScreen';
import {SharePosterScreen} from './src/screens/SharePosterScreen';
import {AchievementPosterScreen} from './src/screens/AchievementPosterScreen';
import {LegalDocScreen} from './src/screens/LegalDocScreen';
import * as Notifications from 'expo-notifications';

// 设置前台通知显示行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createStackNavigator();

// 记录应用启动时间
appStartupOptimizer.markStartup();

// 主题存储键
const THEME_STORAGE_KEY = '@app/theme';

/**
 * 应用导航容器
 * 验证需求: 1.1, 1.5, 3.2, 10.3, 10.5
 */
function AppNavigator() {
  const theme = useSelector((state: any) => state?.ui?.theme || 'dark');
  const themeColors = getTheme(theme).colors;
  const currentUser = useSelector((state: any) => state?.user?.currentUser);
  const dispatch = useDispatch();
  const [isRestoringUser, setIsRestoringUser] = useState(true);

  // 应用启动时从 AsyncStorage 恢复用户到 Redux
  useEffect(() => {
    const restoreUser = async () => {
      try {
        if (!currentUser) {
          const savedUser = await storageService.getUser();
          if (savedUser) {
            dispatch(setUser(savedUser));
          }
        }
      } catch (error) {
        console.warn('恢复用户状态失败:', error);
      } finally {
        setIsRestoringUser(false);
      }
    };
    restoreUser();
  }, []);

  useEffect(() => {
    // 标记应用启动完成
    try {
      appStartupOptimizer.markStartupComplete();
    } catch (error) {
      console.warn('Startup optimization error:', error);
    }
  }, []);

  // 恢复用户状态期间显示加载
  if (isRestoringUser) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: themeColors.background,
        }}>
        <ActivityIndicator size="large" color={themeColors.text} />
      </View>
    );
  }

  // 根据登录状态决定初始路由
  const initialRouteName = currentUser ? 'Trend' : 'Login';

  return (
    <View style={{flex: 1}}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      <NetworkStatusBar />
      <ToastContainer />
      <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRouteName}
            screenOptions={{
              headerShown: false,
              cardStyle: {
                backgroundColor: themeColors.background,
              },
            }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Trend" component={TrendPage} options={{gestureEnabled: false}} />
            <Stack.Screen name="PhoneRegister" component={PhoneRegisterScreen} />
            <Stack.Screen name="AvatarSelection" component={AvatarSelectionScreen} />
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
            <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AvatarEdit" component={AvatarEditScreen} />
            <Stack.Screen name="SharePoster" component={SharePosterScreen} />
            <Stack.Screen name="AchievementPoster" component={AchievementPosterScreen} />
            <Stack.Screen name="LegalDoc" component={LegalDocScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
  );
}

/**
 * 主题预加载 Hook
 * 在应用启动时预加载保存的主题，避免闪烁
 * 同时同步到 Redux store，确保全局主题一致
 */
const usePreloadTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
          // 同步到 Redux store，确保全局主题状态一致
          store.dispatch(setReduxTheme(savedTheme));
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  return {theme, isLoading};
};

// 闪屏最小显示时间（毫秒），冷启动时至少展示这么久
const SPLASH_MIN_DURATION = 2000;
// 闪屏淡出动画时长（毫秒）
const SPLASH_FADE_DURATION = 300;

// 闪屏图片：根据主题使用不同的图片
// eslint-disable-next-line @typescript-eslint/no-var-requires
const splashImageDark = require('./assets/splash.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const splashImageLight = require('./assets/splash_light.png');

/**
 * 自定义闪屏淡出覆盖层
 * 在原生 splash 隐藏后，用动画平滑过渡到主界面
 * 使用和原生 splash 同一张图片 + 同样的 contain 布局，确保视觉无缝衔接
 */
function SplashOverlay({onFadeComplete, theme}: {onFadeComplete: () => void; theme: 'light' | 'dark'}) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const splashBg = theme === 'dark' ? '#000000' : '#FAFBFC';
  const splashImg = theme === 'dark' ? splashImageDark : splashImageLight;

  useEffect(() => {
    // 短暂延迟后开始淡出，确保底层界面已渲染
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: SPLASH_FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        onFadeComplete();
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [fadeAnim, onFadeComplete]);

  const {width, height} = Dimensions.get('window');

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: splashBg,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeAnim,
          zIndex: 999,
        },
      ]}>
      <Image
        source={splashImg}
        style={{width, height}}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function App() {
  // 预加载主题
  const {theme: preloadedTheme, isLoading: themeLoading} = usePreloadTheme();

  // 加载字体
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  // 闪屏最小显示时间控制
  const [splashMinReached, setSplashMinReached] = useState(false);
  // 控制淡出覆盖层是否显示
  const [showSplashOverlay, setShowSplashOverlay] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashMinReached(true);
    }, SPLASH_MIN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // 所有加载完成且最小时间已到，隐藏原生闪屏
  const appReady = fontsLoaded && !themeLoading && splashMinReached;

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // 隐藏原生闪屏，此时自定义覆盖层会接管过渡
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // 淡出完成后移除覆盖层
  const handleFadeComplete = useCallback(() => {
    setShowSplashOverlay(false);
  }, []);

  // 资源未就绪时保持闪屏显示，不渲染任何内容
  if (!appReady) {
    return null;
  }

  try {
    return (
      <ErrorBoundary>
        <GestureHandlerRootView style={{flex: 1}}>
        <GluestackUIProvider config={gluestackConfig} colorMode={preloadedTheme}>
          <Provider store={store}>
            <ThemeTransitionProvider>
              <View style={{flex: 1}} onLayout={onLayoutRootView}>
                <AppNavigator />
                <CustomAlertProvider />
                {showSplashOverlay && (
                  <SplashOverlay onFadeComplete={handleFadeComplete} theme={preloadedTheme} />
                )}
              </View>
            </ThemeTransitionProvider>
          </Provider>
        </GluestackUIProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
        <Text style={{fontSize: typography.fontSize.lg, fontWeight: 'bold', marginBottom: 10}}>
          应用初始化失败
        </Text>
        <Text style={{fontSize: typography.fontSize.base, color: '#71717A', textAlign: 'center'}}>
          {error instanceof Error ? error.message : '未知错误'}
        </Text>
      </View>
    );
  }
}

// 用 Sentry.wrap 包裹，自动捕获未处理的 JS 异常和 Promise rejection
export default Sentry.wrap(App);
