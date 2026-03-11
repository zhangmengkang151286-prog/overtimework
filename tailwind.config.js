/**
 * Tailwind CSS 配置 - 硬核金融终端风格
 * 
 * 设计原则:
 * - 纯黑背景 (#000000)
 * - 极细边框 (0.5px / 1px)
 * - 高对比度
 * - 统一 4px 圆角
 * - 等宽数字字体
 * 
 * 参考: nof1.ai, Bloomberg Terminal, Robinhood
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景色系 - 纯黑金融风
        background: {
          DEFAULT: '#000000',      // 纯黑主背景
          surface: '#09090B',      // Surface 背景 (极微弱灰)
          elevated: '#18181B',     // 悬浮元素背景
        },
        
        // 边框色系 - 极细专业感
        border: {
          DEFAULT: '#27272A',      // 默认边框 (1px)
          light: '#3F3F46',        // 浅色边框
          dark: '#18181B',         // 深色边框
        },
        
        // 主色调 - 下班绿 (青色)
        primary: {
          DEFAULT: '#00D9FF',      // 主色 - 下班状态
          light: '#33E0FF',        // 浅色变体
          dark: '#00A8CC',         // 深色变体
        },
        
        // 危险色 - 加班红
        destructive: {
          DEFAULT: '#EF4444',      // 主色 - 加班状态
          light: '#F87171',        // 浅色变体
          dark: '#DC2626',         // 深色变体
        },
        
        // 文本色系 - 高对比度
        text: {
          DEFAULT: '#E8EAED',      // 主文本 (高对比度白)
          secondary: '#B8BBBE',    // 次要文本
          tertiary: '#8A8D91',     // 三级文本
          muted: '#71717A',        // Muted 文本
          disabled: '#5A5D61',     // 禁用文本
        },
        
        // 状态色系
        success: '#00C896',        // 成功/下班
        warning: '#FFB020',        // 警告/待定
        error: '#FF4757',          // 错误/加班
        info: '#00D9FF',           // 信息
        
        // 交互反馈色
        hover: '#18181B',          // 悬停背景
        press: '#27272A',          // 按压背景
        focus: '#00D9FF',          // 聚焦边框
      },
      
      // 字体系统
      fontFamily: {
        // 等宽字体 - 用于所有数字
        mono: ['Courier New', 'monospace'],
        // 系统字体 - 用于文本
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // 字号系统
      fontSize: {
        // 数据标签 (全大写)
        'label': ['10px', { lineHeight: '14px', letterSpacing: '0.05em' }],
        // 正文
        'body': ['14px', { lineHeight: '20px' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        // 标题
        'heading-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'heading-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'heading-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        // 数据展示 (等宽)
        'data-sm': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'data-md': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'data-lg': ['52px', { lineHeight: '60px', fontWeight: '700' }],
      },
      
      // 间距系统 (Tailwind 默认 + 自定义)
      spacing: {
        // 使用 Tailwind 默认的 4px 倍数系统
        // 0, 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 8(32px), 10(40px), 12(48px)
      },
      
      // 圆角系统 - 统一 4px
      borderRadius: {
        'none': '0px',
        'sm': '4px',             // 统一使用 4px
        DEFAULT: '4px',          // 默认 4px
        'md': '4px',             // 强制 4px (覆盖 Tailwind 默认)
        'lg': '4px',             // 强制 4px (覆盖 Tailwind 默认)
        'full': '9999px',        // 圆形 (特殊情况)
      },
      
      // 边框宽度 - 极细专业感
      borderWidth: {
        DEFAULT: '1px',
        '0': '0px',
        '0.5': '0.5px',          // 极细边框
        '1': '1px',              // 标准边框
        '2': '2px',              // 粗边框 (少用)
      },
      
      // 阴影系统 - 禁用 (金融风不使用阴影)
      boxShadow: {
        'none': 'none',
        DEFAULT: 'none',
        'sm': 'none',
        'md': 'none',
        'lg': 'none',
        'xl': 'none',
      },
      
      // 动画时长 - 干脆利落
      transitionDuration: {
        'instant': '0ms',        // 瞬时
        'fast': '100ms',         // 快速
        DEFAULT: '150ms',        // 默认
        'slow': '200ms',         // 慢速 (少用)
      },
      
      // 动画曲线 - 线性为主
      transitionTimingFunction: {
        DEFAULT: 'linear',       // 默认线性
        'ease': 'ease',          // 缓动 (少用)
      },
    },
  },
  plugins: [],
}
