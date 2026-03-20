// 应用常量
export const APP_CONFIG = {
  name: '打工人加班指数',
  version: '1.0.0',
  refreshInterval: 3000, // 3秒刷新间隔
  timeDisplayInterval: 1000, // 1秒时间显示刷新
  cacheExpireTime: 5 * 60 * 1000, // 5分钟缓存过期时间
  maxRetryAttempts: 3,
  retryDelay: 1000,
} as const;

// 时间格式常量
export const TIME_FORMATS = {
  display: 'YYYY/MM/DD HH:mm:ss',
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  api: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
} as const;

// 颜色常量 - 已迁移到 theme/colors.ts
// 为了向后兼容，保留简化版本
export const COLORS = {
  light: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#00C805',
    warning: '#FF9500',
    error: '#FF5000',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    // 状态颜色
    overtime: '#FF5000', // 加班红
    ontime: '#00C805', // 准时绿
    pending: '#FFE66D', // 浅黄色
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    success: '#00C805',
    warning: '#FF9F0A',
    error: '#FF5000',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    // 状态颜色
    overtime: '#FF5000',
    ontime: '#00C805',
    pending: '#FFE66D',
  },
} as const;

// 动画常量
export const ANIMATIONS = {
  duration: {
    short: 200,
    medium: 300,
    long: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// 布局常量
export const LAYOUT = {
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
} as const;

// 状态常量
export const STATUS_TYPES = {
  OVERTIME: 'overtime',
  ONTIME: 'ontime',
  PENDING: 'pending',
} as const;

// 标签类型常量
export const TAG_TYPES = {
  INDUSTRY: 'industry',
  COMPANY: 'company',
  POSITION: 'position',
  CUSTOM: 'custom',
} as const;

// 屏幕名称常量
export const SCREEN_NAMES = {
  TREND: 'TrendPage',
  SETTINGS: 'Settings',
  PROFILE: 'Profile',
  DATA_MANAGEMENT: 'DataManagement',
  HISTORY: 'History',
} as const;

// 错误消息常量
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  DATA_PARSE_ERROR: '数据解析失败',
  VALIDATION_ERROR: '数据验证失败',
  UNKNOWN_ERROR: '未知错误',
} as const;

// 成功消息常量
export const SUCCESS_MESSAGES = {
  STATUS_SUBMITTED: '状态提交成功',
  DATA_UPDATED: '数据更新成功',
  SETTINGS_SAVED: '设置保存成功',
  TAG_CREATED: '标签创建成功',
  TAG_UPDATED: '标签更新成功',
  TAG_DELETED: '标签删除成功',
} as const;
