/**
 * 排版系统 - 专业的字体层次
 * 验证需求: 11.2
 */

export const typography = {
  // 字体家族
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    monospace: 'Courier New',
  },

  // 字体大小
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 48,
  },

  // 字重
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // 行高
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // 字间距
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },

  // 预定义文本样式
  styles: {
    // 标题样式 - 金融级专业感
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 1.2,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    // 正文样式
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    bodyLarge: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    // 标签样式
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.4,
      letterSpacing: 0.25,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 1.5,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },

    // 按钮样式
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.5,
      letterSpacing: 0.25,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 1.5,
      letterSpacing: 0.25,
    },
    buttonLarge: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 1.5,
      letterSpacing: 0.25,
    },

    // 数字样式（用于统计数据）- 强化等宽字体
    number: {
      fontSize: 52,
      fontWeight: '700' as const,
      lineHeight: 1.1,
      letterSpacing: -1,
      fontFamily: 'Courier New',
    },
    numberSmall: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 1.2,
      letterSpacing: -0.5,
      fontFamily: 'Courier New',
    },
    numberLarge: {
      fontSize: 72,
      fontWeight: '700' as const,
      lineHeight: 1.0,
      letterSpacing: -1.5,
      fontFamily: 'Courier New',
    },

    // 时间样式 - 等宽字体
    time: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 1.5,
      letterSpacing: 0.5,
      fontFamily: 'Courier New',
    },

    // 数据标签样式 - 专业数据展示
    dataLabel: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 1.4,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },

    // 终端样式 - 类似金融终端
    terminal: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 1.6,
      letterSpacing: 0.3,
      fontFamily: 'Courier New',
    },
  },
} as const;

export type Typography = typeof typography;
