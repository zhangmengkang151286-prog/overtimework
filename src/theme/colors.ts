/**
 * 硬核金融终端风格配色
 *
 * 设计原则:
 * - 纯黑背景 (#000000) - 对标 Bloomberg Terminal
 * - 极细边框 (#27272A) - 专业感
 * - 高对比度文本 - 可读性
 * - 青色主色 (#00D9FF) - 下班状态
 * - 红色危险色 (#EF4444) - 加班状态
 *
 * 参考: nof1.ai, Bloomberg Terminal, Robinhood
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

  // 语义颜色
  success: '#34C759',
  successLight: '#5DD87F',
  successDark: '#248A3D',

  warning: '#FF9500',
  warningLight: '#FFB340',
  warningDark: '#CC7700',

  error: '#FF3B30',
  errorLight: '#FF6259',
  errorDark: '#CC2F26',

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

  // 状态颜色 - 加班指数专用
  overtime: '#FF6B6B',
  overtimeLight: '#FCA5A5',
  overtimeDark: '#DC2626',

  ontime: '#4ECDC4',
  ontimeLight: '#86EFAC',
  ontimeDark: '#16A34A',

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
    '#34C759',
    '#FF9500',
    '#FF3B30',
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

  // 语义颜色
  success: '#00C896', // 成功/下班
  successLight: '#33D4AB',
  successDark: '#00A07A',

  warning: '#FFB020', // 警告/待定
  warningLight: '#FFC04D',
  warningDark: '#E69500',

  error: '#EF4444', // 错误/加班 (更新为 #EF4444)
  errorLight: '#F87171',
  errorDark: '#DC2626',

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

  // 状态颜色 - 加班指数专用
  overtime: '#EF4444', // 加班红 (更新)
  overtimeLight: '#F87171', // 更新
  overtimeDark: '#DC2626', // 更新

  ontime: '#00C896', // 下班绿
  ontimeLight: '#33D4AB',
  ontimeDark: '#00A07A',

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
    '#00C896', // 翠绿
    '#FFB020', // 琥珀
    '#EF4444', // 警戒红 (更新)
    '#9D4EDD', // 紫色
    '#06FFA5', // 荧光绿
    '#FF6B9D', // 粉红
    '#4CC9F0', // 天蓝
    '#F72585', // 洋红
    '#7209B7', // 深紫
  ],
} as const;

export type ColorScheme = typeof lightColors | typeof darkColors;

// 默认导出包含light和dark的colors对象
export const colors = {
  light: lightColors,
  dark: darkColors,
} as const;
