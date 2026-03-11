/**
 * 海报类型定义
 * 用于分享海报功能的所有类型接口
 */

/**
 * 海报类型枚举
 */
export enum PosterType {
  TREND = 'trend',                      // 趋势界面
  CALENDAR = 'calendar',                // 下班日历
  OVERTIME_TREND = 'overtime_trend',    // 加班趋势
  TAG_PROPORTION = 'tag_proportion',    // 标签占比
}

/**
 * 用户信息接口
 */
export interface UserInfo {
  avatar: string;      // 用户头像URL
  username: string;    // 用户名
}

/**
 * 时间轴数据点
 */
export interface TimelineDataPoint {
  hour: number;           // 小时 (0-23)
  onTimeCount: number;    // 准时人数
  overtimeCount: number;  // 加班人数
  timestamp: string;      // 时间戳
}

/**
 * 标签数据
 */
export interface TagData {
  tag_id: string;         // 标签ID
  tag_name: string;       // 标签名称
  count: number;          // 使用次数
  percentage?: number;    // 百分比
  color?: string;         // 颜色
}

/**
 * 趋势界面数据
 */
export interface TrendData {
  participants: number;              // 参与人数
  onTimeCount: number;               // 准时下班人数
  overtimeCount: number;             // 加班人数
  timeline: TimelineDataPoint[];     // 时间轴数据
  tagDistribution: TagData[];        // 标签分布
}

/**
 * 日期状态
 */
export interface DayStatus {
  date: string;           // 日期 (YYYY-MM-DD)
  status: 'ontime' | 'overtime' | 'none';  // 状态：准时/加班/未打卡
  timestamp?: string;     // 打卡时间戳
}

/**
 * 日历数据
 */
export interface CalendarData {
  year: number;           // 年份
  month: number;          // 月份 (1-12)
  days: DayStatus[];      // 每日状态数组
}

/**
 * 趋势数据点
 */
export interface TrendPoint {
  date: string;           // 日期
  value: number;          // 数值（加班次数或时长）
  label?: string;         // 标签（用于显示）
}

/**
 * 加班趋势数据
 */
export interface OvertimeTrendData {
  dimension: 'day' | 'week' | 'month';  // 时间维度
  dataPoints: TrendPoint[];              // 数据点数组
}

/**
 * 标签占比数据
 */
export interface TagProportion {
  tag_id: string;         // 标签ID
  tag_name: string;       // 标签名称
  count: number;          // 使用次数
  percentage: number;     // 百分比
  color: string;          // 颜色
}

/**
 * 标签占比数据
 */
export interface TagProportionData {
  year: number;                   // 年份
  month: number;                  // 月份 (1-12)
  tags: TagProportion[];          // 标签占比数组
}

/**
 * 海报数据（包含所有类型的数据）
 */
export interface PosterData {
  // 通用数据
  user: UserInfo;                       // 用户信息
  date: string;                         // 当前日期
  appLogo: string;                      // APP LOGO
  appName: string;                      // APP名称
  
  // 趋势界面数据
  trendData?: TrendData;
  
  // 日历数据
  calendarData?: CalendarData;
  
  // 加班趋势数据
  overtimeTrendData?: OvertimeTrendData;
  
  // 标签占比数据
  tagProportionData?: TagProportionData;
}

/**
 * 海报配置接口
 */
export interface PosterConfig {
  type: PosterType;                     // 海报类型
  title: string;                        // 海报标题
  icon: string;                         // 图标名称
  dataFetcher: () => Promise<any>;      // 数据获取函数
}

/**
 * 海报状态管理
 */
export interface SharePosterState {
  currentIndex: number;                           // 当前海报索引
  posters: PosterConfig[];                        // 海报配置数组
  loading: boolean;                               // 加载状态
  error: string | null;                           // 错误信息
  cachedImages: Map<PosterType, string>;          // 缓存的图片URI
}

/**
 * 海报生成选项
 */
export interface PosterCaptureOptions {
  format: 'png' | 'jpg';                // 图片格式
  quality: number;                      // 图片质量 (0-1)
  width: number;                        // 宽度
  height: number;                       // 高度
}

/**
 * 海报保存结果
 */
export interface PosterSaveResult {
  success: boolean;                     // 是否成功
  uri?: string;                         // 图片URI
  error?: string;                       // 错误信息
}

/**
 * 海报分享选项
 */
export interface PosterShareOptions {
  mimeType: string;                     // MIME类型
  dialogTitle: string;                  // 分享对话框标题
}

/**
 * 海报滑动容器组件属性
 */
export interface PosterCarouselProps {
  posters: React.ReactNode[];           // 海报组件数组
  currentIndex: number;                 // 当前索引
  onIndexChange: (index: number) => void; // 索引变化回调
  width: number;                        // 容器宽度
  height: number;                       // 容器高度
}

/**
 * 海报操作控制组件属性
 */
export interface PosterControlsProps {
  currentIndex: number;                 // 当前索引
  totalCount: number;                   // 总数
  onSave: () => void;                   // 保存回调
  onShare: () => void;                  // 分享回调
  onIndexChange: (index: number) => void; // 索引变化回调
  loading: boolean;                     // 加载状态
}

/**
 * 海报模板组件属性
 */
export interface PosterTemplateProps {
  user: UserInfo;                       // 用户信息
  date: string;                         // 日期
  title: string;                        // 标题
  children: React.ReactNode;            // 子组件
}
