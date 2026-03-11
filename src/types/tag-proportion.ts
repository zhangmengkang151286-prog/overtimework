/**
 * 标签占比模块类型定义
 * 包含树状图布局、颜色分配和文字自适应相关类型
 */

// 标签占比数据项
export interface TagProportionItem {
  tagId: string; // 标签 ID
  tagName: string; // 标签名称
  count: number; // 出现次数
  percentage: number; // 百分比（0-100）
  isOvertime: boolean; // 是否为加班标签
  // "其他"标签包含的子标签详情（仅 tagId 为 __other_* 时有值）
  otherDetails?: {tagName: string; count: number; percentage: number}[];
}

// 树状图矩形布局
export interface TreemapRect {
  x: number; // 左上角 x 坐标
  y: number; // 左上角 y 坐标
  width: number; // 宽度
  height: number; // 高度
  item: TagProportionItem; // 对应的标签数据
  color: string; // 分配的颜色
}

// 颜色分配结果
export interface ColorAssignment {
  color: string; // HSL 颜色字符串
  hue: number; // 色相值
  saturation: number; // 饱和度
  lightness: number; // 亮度
}

// 文字布局结果
export interface TextLayout {
  fontSize: number; // 字号
  showText: boolean; // 是否显示文字
  showCount: boolean; // 是否显示次数
  showPercentage: boolean; // 是否显示百分比
}
