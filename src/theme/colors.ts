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
  // 主色调 - 保持青色，和暗色主题统一
  primary: '#00D9FF',
  primaryLight: '#33E0FF',
  primaryDark: '#00A8CC',

  // 次要色调 - 琥珀警示色（和暗色主题对称）
  secondary: '#E69500',
  secondaryLight: '#FFB020',
  secondaryDark: '#CC7700',

  // 语义颜色 - Robinhood 风格（两个主题一致）
  success: '#00C805', // 准时下班绿
  successLight: '#33D337',
  successDark: '#009A04',

  warning: '#E69500', // 警告/待定
  warningLight: '#FFB020',
  warningDark: '#CC7700',

  error: '#FF5000', // 加班红
  errorLight: '#FF7333',
  errorDark: '#CC4000',

  info: '#00A8CC',
  infoLight: '#00D9FF',
  infoDark: '#007A99',

  // 背景色 - 冷白极简（Linear / Vercel 风格）
  background: '#FAFBFC', // 冷白主背景
  backgroundSecondary: '#F4F5F7', // 次级背景
  backgroundTertiary: '#EBEDF0', // 三级背景

  // 表面色
  surface: '#FFFFFF', // 卡片/面板表面
  surfaceElevated: '#FFFFFF', // 悬浮元素
  surfaceOverlay: 'rgba(0, 0, 0, 0.04)',

  // 文本颜色 - 高对比度
  text: '#000000', // 主文本纯黑
  textSecondary: '#52525B', // 次级文本（zinc-600）
  textTertiary: '#71717A', // 三级文本（和暗色 muted 一致）
  textDisabled: '#A1A1AA', // 禁用文本（zinc-400）
  textInverse: '#FFFFFF',

  // 边框颜色 - 极细边框风格延续
  border: '#D1D5DB', // 主边框（冷灰）
  borderLight: '#E5E7EB', // 浅边框
  borderDark: '#9CA3AF', // 深边框

  // 分隔线
  divider: '#E5E7EB',

  // 状态颜色 - 加班指数专用（Robinhood 风格，两个主题一致）
  overtime: '#FF5000', // 加班红
  overtimeLight: '#FF7333',
  overtimeDark: '#CC4000',

  ontime: '#00C805', // 准时下班绿
  ontimeLight: '#33D337',
  ontimeDark: '#009A04',

  pending: '#E69500', // 待定黄
  pendingLight: '#FFB020',
  pendingDark: '#CC7700',

  // 卡片和容器 - 白色 + 极细边框
  card: '#FFFFFF',
  cardBorder: '#D1D5DB',
  cardShadow: 'none', // 和暗色主题一致，禁用阴影

  // 输入框
  input: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputPlaceholder: '#71717A',
  inputFocusBorder: '#000000',

  // 按钮 - Ghost 风格延续
  buttonPrimary: '#FFFFFF', // 白色背景
  buttonPrimaryText: '#00D9FF', // 青色文字（和暗色对称）
  buttonPrimaryBorder: '#D1D5DB', // 细边框
  buttonSecondary: 'transparent', // Ghost 按钮
  buttonSecondaryText: '#000000',
  buttonSecondaryBorder: '#D1D5DB',
  buttonHover: '#F4F5F7', // 悬停背景
  buttonPress: '#EBEDF0', // 按压背景
  buttonDisabled: '#F4F5F7',
  buttonDisabledText: '#A1A1AA',

  // 图表颜色 - 和暗色主题一致
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
  input: '#09090B',
  inputBorder: '#27272A',
  inputPlaceholder: '#71717A',
  inputFocusBorder: '#E8EAED',

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

/** 准时下班绿色 50 级色阶（从暗到亮） */
export const greenScale = generateGradientScale(122, 39, 50);

/** 加班红色 50 级色阶（从暗到亮） */
export const redScale = generateGradientScale(19, 50, 50);

// 默认导出包含light和dark的colors对象
export const colors = {
  light: lightColors,
  dark: darkColors,
} as const;
