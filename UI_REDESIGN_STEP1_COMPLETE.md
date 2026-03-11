# UI 重构 - 步骤 1: 建立视觉基准 ✅

## 完成时间
2026-02-13

## 完成内容

### 1. 创建 Tailwind 配置 (`tailwind.config.js`)

✅ 定义硬核金融终端风格的视觉原子:

**配色方案**:
- 背景色: `#000000` (纯黑), `#09090B` (Surface), `#18181B` (Elevated)
- 边框色: `#27272A` (默认), `#3F3F46` (浅色), `#18181B` (深色)
- 主色调: `#00D9FF` (下班绿/青色)
- 危险色: `#EF4444` (加班红)
- 文本色: `#E8EAED` (主文本), `#B8BBBE` (次要), `#71717A` (Muted)

**字体系统**:
- Monospace: `Courier New` - 用于所有数字
- Sans: `Inter` - 用于文本

**圆角规范**:
- 统一使用 `4px` (radius-sm)
- 禁用大圆角 (md, lg 强制为 4px)

**边框宽度**:
- `0.5px` - 极细边框
- `1px` - 标准边框

**阴影系统**:
- 全部禁用 (金融风不使用阴影)

**动画时长**:
- `0ms` - 瞬时
- `100ms` - 快速
- `150ms` - 默认
- 使用线性曲线 (linear)

### 2. 更新颜色配置 (`src/theme/colors.ts`)

✅ 将配色方案更新为硬核金融风:

**关键变更**:
- `background`: `#0A0E0F` → `#000000` (纯黑)
- `backgroundSecondary`: `#131719` → `#09090B`
- `backgroundTertiary`: `#1A1F21` → `#18181B`
- `border`: `#2A2F31` → `#27272A`
- `error/overtime`: `#FF4757` → `#EF4444`
- `cardShadow`: `rgba(0, 0, 0, 0.4)` → `none`

**新增按钮色**:
- `buttonPrimary`: `#000000` (黑色背景)
- `buttonPrimaryText`: `#00D9FF` (青色文字)
- `buttonPrimaryBorder`: `#27272A` (细边框)
- `buttonSecondary`: `transparent` (Ghost 按钮)
- `buttonHover`: `#18181B`
- `buttonPress`: `#27272A`

### 3. 同步 Tamagui 配置 (`tamagui.config.ts`)

✅ 将 Tamagui 主题系统与新配色方案同步:

- 更新所有背景色、边框色、文本色
- 添加按钮专用颜色 tokens
- 确保 Tamagui 和 Tailwind 使用相同的视觉原子

## 设计原则确认

✅ **纯黑背景**: #000000 作为主背景
✅ **极细边框**: 0.5px / 1px,颜色 #27272A
✅ **统一圆角**: 4px,杜绝大圆角
✅ **高对比度**: 文本 #E8EAED vs 背景 #000000
✅ **等宽数字**: Monospace 字体用于所有数字
✅ **禁用阴影**: 金融风不使用 box-shadow
✅ **干脆动画**: 线性曲线,最长 150ms

## 下一步

**步骤 2: 核心组件重写**

1. 重构基础按钮 (Button) - Shadcn 风格
2. 重构基础卡片 (Card) - 极细边框
3. 重构基础输入框 (Input) - 高对比度
4. 重构 UserStatusSelector - 演示组件
5. 重构数据可视化组件 (VersusBar, GridChart, TimeAxis)

**注意事项**:
- ⚠️ 只修改样式,不动业务逻辑
- ⚠️ 保护 Redux Toolkit 状态管理
- ⚠️ 保护 Supabase 实时订阅逻辑
- ⚠️ 保护离线队列服务
- ⚠️ 每完成一个组件,运行单元测试验证

## 参考

- nof1.ai
- Bloomberg Terminal
- Robinhood
- Shadcn UI

---

**状态**: ✅ 完成
**验证**: 配置文件已创建,视觉原子已定义
**下一步**: 开始步骤 2 - 核心组件重写
