/**
 * useAppLogo - 根据当前主题返回对应的 LOGO 资源
 *
 * 黑色主题：使用原有 LOGO（白色/亮色图标，适合深色背景）
 * 白色主题：使用 _light 后缀的 LOGO（深色图标，适合浅色背景）
 *
 * 资源文件命名规范：
 * - 黑色主题：image_1024x1024_sharp.png / logo_96.png / splash.png
 * - 白色主题：image_1024x1024_sharp_light.png / logo_96_light.png / splash_light.png
 */

import {ImageSourcePropType} from 'react-native';
import {useIsDarkMode} from './useTheme';

// 预加载所有 LOGO 资源（require 必须是静态路径）
const logos = {
  dark: {
    main: require('../../assets/image_1024x1024_sharp.png'),
    small: require('../../assets/logo_96.png'),
    splash: require('../../assets/splash.png'),
  },
  light: {
    main: require('../../assets/image_1024x1024_sharp_light.png'),
    small: require('../../assets/logo_96_light.png'),
    splash: require('../../assets/splash_light.png'),
  },
};

interface AppLogos {
  /** 主 LOGO（1024x1024），用于登录页、注册页 */
  main: ImageSourcePropType;
  /** 小尺寸 LOGO（96x96），用于海报等 */
  small: ImageSourcePropType;
  /** 闪屏图片 */
  splash: ImageSourcePropType;
}

/**
 * 根据当前主题返回对应的 LOGO 资源
 */
export const useAppLogo = (): AppLogos => {
  const isDark = useIsDarkMode();
  return isDark ? logos.dark : logos.light;
};
