/**
 * 硬核金融终端风格配色
 *
 * 设计原则:
 * - 纯黑背景 (#000000) - 对标 Bloomberg Terminal
 * - 极细边框 (#27272A) - 专业感
 * - 高对比度文本 - 可读性
 * - Robinhood 风格主色：绿色 #00C805（准时下班）/ 红色 #FF5000（加班）
 * - 20级渐变色阶：HSL空间，固定色相，饱和度30%→100%，亮度8%→目标亮度
 *
 * 参考: Robinhood, Bloomberg Terminal
 *
 * 验证需求: 11.3
 */

export const lightColors = {
  // 主色调
  primary: '#007AFF',
  primaryLight: '#4DA2FF',
  primaryDark: '#0051D5',

  // 次要色调
  secondary: '#5856D6',
  secondaryLight: '#7D7AFF',
  secondaryDark: '#3634A3',

  // 语义颜色 - Robinhood 风格
  success: '#00C805', // 准时下班绿
  successLight: '#33D337',
  successDark: '#009A04',

  warning: '#FF9500',
  warningLight: '#FFB340',
  warningDark: '#CC7700',

  error: '#FF5000', // 加班红
  errorLight: '#FF7333',
  errorDark: '#CC4000',

  info: '#5AC8FA',
  infoLight: '#7DD4FB',
  infoDark: '#32A0C8',

  // 背景色
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#EFEFEF',

  // 表面色
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceOverlay: 'rgba(0, 0, 0, 0.05)',

  // 文本颜色
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
  textInverse: '#FFFFFF',

  // 边框颜色
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#CCCCCC',

  // 分隔线
  divider: '#E5E5E5',

  // 状态颜色 - 加班指数专用（Robinhood 风格）
  overtime: '#FF5000',
  overtimeLight: '#FF7333',
  overtimeDark: '#CC4000',

  ontime: '#00C805',
  ontimeLight: '#33D337',
  ontimeDark: '#009A04',

  pending: '#FFE66D',
  pendingLight: '#FEF08A',
  pendingDark: '#EAB308',

  // 卡片和容器
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  cardShadow: 'rgba(0, 0, 0, 0.1)',

  // 输入框
  input: '#FFFFFF',
  inputBorder: '#D1D1D6',
  inputPlaceholder: '#999999',
  inputFocusBorder: '#007AFF',

  // 按钮
  buttonPrimary: '#007AFF',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F2F2F7',
  buttonSecondaryText: '#000000',
  buttonDisabled: '#E5E5E5',
  buttonDisabledText: '#999999',

  // 图表颜色
  chartColors: [
    '#007AFF',
    '#5856D6',
    '#00C805',
    '#FF9500',
    '#FF5000',
    '#5AC8FA',
    '#AF52DE',
    '#FF2D55',
    '#A2845E',
    '#8E8E93',
  ],
} as const;

export const darkColors = {
  // 主色调 - 下班绿 (青色)
  primary: '#00D9FF',
  primaryLight: '#33E0FF',
  primaryDark: '#00A8CC',

  // 次要色调 - 琥珀警示色
  secondary: '#FFB020',
  secondaryLight: '#FFC04D',
  secondaryDark: '#E69500',

  // 语义颜色 - Robinhood 风格
  success: '#00C805', // 准时下班绿
  successLight: '#33D337',
  successDark: '#009A04',

  warning: '#FFB020', // 警告/待定
  warningLight: '#FFC04D',
  warningDark: '#E69500',

  error: '#FF5000', // 加班红
  errorLight: '#FF7333',
  errorDark: '#CC4000',

  info: '#00D9FF',
  infoLight: '#33E0FF',
  infoDark: '#00A8CC',

  // 背景色 - 纯黑金融风
  background: '#000000', // 纯黑主背景 (更新)
  backgroundSecondary: '#09090B', // Surface 背景 (极微弱灰) (更新)
  backgroundTertiary: '#18181B', // 悬浮元素背景 (更新)

  // 表面色
  surface: '#09090B', // 更新
  surfaceElevated: '#18181B', // 更新
  surfaceOverlay: 'rgba(0, 217, 255, 0.05)',

  // 文本颜色 - 高对比度
  text: '#E8EAED',
  textSecondary: '#B8BBBE',
  textTertiary: '#8A8D91',
  textDisabled: '#5A5D61',
  textInverse: '#000000', // 更新

  // 边框颜色 - 极细专业感
  border: '#27272A', // 1px 细边框 (更新)
  borderLight: '#3F3F46', // 更新
  borderDark: '#18181B', // 更新

  // 分隔线
  divider: '#27272A', // 更新

  // 状态颜色 - 加班指数专用（Robinhood 风格）
  overtime: '#FF5000', // 加班红
  overtimeLight: '#FF7333',
  overtimeDark: '#CC4000',

  ontime: '#00C805', // 准时下班绿
  ontimeLight: '#33D337',
  ontimeDark: '#009A04',

  pending: '#FFB020', // 待定黄
  pendingLight: '#FFC04D',
  pendingDark: '#E69500',

  // 卡片和容器 - 极细边框
  card: '#09090B', // 更新
  cardBorder: '#27272A', // 更新
  cardShadow: 'none', // 禁用阴影 (更新)

  // 输入框
  input: '#09090B', // 更新
  inputBorder: '#27272A', // 更新
  inputPlaceholder: '#71717A', // 更新 (Muted Text)
  inputFocusBorder: '#00D9FF',

  // 按钮
  buttonPrimary: '#000000', // 黑色背景 (更新)
  buttonPrimaryText: '#00D9FF', // 青色文字 (更新)
  buttonPrimaryBorder: '#27272A', // 细边框 (新增)
  buttonSecondary: 'transparent', // Ghost 按钮 (更新)
  buttonSecondaryText: '#E8EAED',
  buttonSecondaryBorder: '#27272A', // 新增
  buttonHover: '#18181B', // 悬停背景 (新增)
  buttonPress: '#27272A', // 按压背景 (新增)
  buttonDisabled: '#18181B', // 更新
  buttonDisabledText: '#5A5D61',

  // 图表颜色 - 专业数据可视化配色
  chartColors: [
    '#00D9FF', // 主蓝
    '#00C805', // Robinhood 绿
    '#FFB020', // 琥珀
    '#FF5000', // Robinhood 红
    '#9D4EDD', // 紫色
    '#06FFA5', // 荧光绿
    '#FF6B9D', // 粉红
    '#4CC9F0', // 天蓝
    '#F72585', // 洋红
    '#7209B7', // 深紫
  ],
} as const;

export type ColorScheme = typeof lightColors | typeof darkColors;

/**
 * Robinhood 风格 20 级渐变色阶
 * 算法：固定色相，饱和度从 30% → 100%，亮度从 8% → 目标亮度
 * 绿色色相 122°，目标亮度 39%（#00C805）
 * 红色色相 19°，目标亮度 50%（#FF5000）
 */
function generateGradientScale(
  hue: number,
  targetLightness: number,
  count: number = 20,
): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0 → 1
    const saturation = Math.round(30 + t * 70); // 30% → 100%
    const lightness = Math.round(8 + t * (targetLightness - 8)); // 8% → 目标亮度
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}

/** 准时下班绿色 20 级色阶（从暗到亮） */
export const greenScale = generateGradientScale(122, 39, 20);

/** 加班红色 20 级色阶（从暗到亮） */
export const redScale = generateGradientScale(19, 50, 20);

// 默认导出包含light和dark的colors对象
export const colors = {
  light: lightColors,
  dark: darkColors,
} as const;
