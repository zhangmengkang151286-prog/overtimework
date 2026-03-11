/**
 * 个人页面（MyPage）相关类型定义
 * 包含月历视图和长期趋势图所需的数据模型
 */

// 个人状态记录
export interface PersonalStatusRecord {
  date: string; // YYYY-MM-DD
  isOvertime: boolean;
  overtimeHours: number; // 0 表示准时下班，1-12 表示加班时长
  tagNames?: string[]; // 标签名称数组（支持多个标签）
  tagIds?: string[]; // 标签ID数组
}

// 节假日信息
export interface HolidayInfo {
  date: string; // YYYY-MM-DD
  name: string; // 节假日名称
  type: 'holiday' | 'workday'; // holiday=放假, workday=调休上班
}

// 趋势数据点
export interface TrendDataPoint {
  label: string; // 显示标签（如 "2/21", "第8周", "2月"）
  date: string; // 起始日期 YYYY-MM-DD
  avgOvertimeHours: number; // 平均加班时长
  recordCount: number; // 该区间内的记录数
}

// 日历单日数据
export interface CalendarDayData {
  day: number; // 日期数字 1-31
  date: string; // YYYY-MM-DD
  status: 'overtime' | 'ontime' | 'none'; // 加班/准时/无记录
  overtimeHours: number; // 加班时长
  isHoliday: boolean;
  isWorkday: boolean; // 调休工作日
  holidayName?: string;
  isWeekend: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}

// 颜色映射相关类型
export type StatusColorType = 'green' | 'red' | 'gray';

export interface StatusColorResult {
  color: string; // rgba 颜色值
  type: StatusColorType;
}

// 趋势图维度类型
export type TrendDimension = 'day' | 'week' | 'month';
