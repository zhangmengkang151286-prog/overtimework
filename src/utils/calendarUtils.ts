/**
 * 日历工具函数
 * 包含日历网格生成、颜色映射等功能
 */

import {
  CalendarDayData,
  PersonalStatusRecord,
  HolidayInfo,
  StatusColorResult,
} from '../types/my-page';

export type {StatusColorResult} from '../types/my-page';

/**
 * 生成指定年月的日历网格数据
 * 返回二维数组，每行代表一周（周一到周日）
 *
 * @param year 年份
 * @param month 月份 (1-12)
 * @param records 个人状态记录
 * @param holidays 节假日信息
 * @returns 日历网格二维数组
 */
export function generateCalendarGrid(
  year: number,
  month: number,
  records: PersonalStatusRecord[],
  holidays: HolidayInfo[],
): CalendarDayData[][] {
  // 构建状态记录映射（按日期索引）
  const recordMap = new Map<string, PersonalStatusRecord>();
  for (const record of records) {
    recordMap.set(record.date, record);
  }

  // 构建节假日映射（按日期索引）
  const holidayMap = new Map<string, HolidayInfo>();
  for (const holiday of holidays) {
    holidayMap.set(holiday.date, holiday);
  }

  // 获取今天的日期字符串，用于标记今天
  const now = new Date();
  const todayStr = formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // 获取该月第一天和最后一天
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  // 获取第一天是星期几（0=周日, 1=周一, ..., 6=周六）
  // 转换为周一为0的索引：(dayOfWeek + 6) % 7
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7;

  const grid: CalendarDayData[][] = [];
  let currentWeek: CalendarDayData[] = [];

  // 填充月初空白天（上个月的日期）
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

  for (let i = 0; i < firstDayOfWeek; i++) {
    const prevDay = daysInPrevMonth - firstDayOfWeek + 1 + i;
    const dateStr = formatDate(prevYear, prevMonth, prevDay);
    const dayOfWeek = i; // 0=周一, ..., 6=周日
    currentWeek.push(
      createDayData(prevDay, dateStr, false, dayOfWeek, recordMap, holidayMap, todayStr),
    );
  }

  // 填充当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = (date.getDay() + 6) % 7; // 0=周一, ..., 6=周日

    currentWeek.push(
      createDayData(day, dateStr, true, dayOfWeek, recordMap, holidayMap, todayStr),
    );

    // 如果是周日（dayOfWeek === 6），开始新的一周
    if (dayOfWeek === 6) {
      grid.push(currentWeek);
      currentWeek = [];
    }
  }

  // 填充月末空白天（下个月的日期）
  if (currentWeek.length > 0) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    let nextDay = 1;
    while (currentWeek.length < 7) {
      const dateStr = formatDate(nextYear, nextMonth, nextDay);
      const dayOfWeek = currentWeek.length; // 当前位置即为星期几
      currentWeek.push(
        createDayData(nextDay, dateStr, false, dayOfWeek, recordMap, holidayMap, todayStr),
      );
      nextDay++;
    }
    grid.push(currentWeek);
  }

  return grid;
}

/**
 * 创建单日数据
 */
function createDayData(
  day: number,
  dateStr: string,
  isCurrentMonth: boolean,
  dayOfWeek: number, // 0=周一, ..., 6=周日
  recordMap: Map<string, PersonalStatusRecord>,
  holidayMap: Map<string, HolidayInfo>,
  todayStr: string,
): CalendarDayData {
  const record = recordMap.get(dateStr);
  const holiday = holidayMap.get(dateStr);
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // 周六=5, 周日=6

  let status: 'overtime' | 'ontime' | 'none' = 'none';
  let overtimeHours = 0;

  if (record) {
    if (record.isOvertime) {
      status = 'overtime';
      overtimeHours = record.overtimeHours;
    } else {
      status = 'ontime';
      overtimeHours = 0;
    }
  }

  return {
    day,
    date: dateStr,
    status,
    overtimeHours,
    isHoliday: holiday?.type === 'holiday' || false,
    isWorkday: holiday?.type === 'workday' || false,
    holidayName: holiday?.name,
    isWeekend,
    isCurrentMonth,
    isToday: dateStr === todayStr,
  };
}

/**
 * 格式化日期为 YYYY-MM-DD 字符串
 */
export function formatDate(year: number, month: number, day: number): string {
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
}


/**
 * 将加班时长 (1-12小时) 线性映射到红色深浅
 * 使用 Robinhood 红色 #FF5000（色相 19°）
 * 加班时长越长，红色越深（饱和度和亮度越高）
 *
 * @param hours 加班时长（1-12）
 * @param isDark 是否为暗色主题
 * @returns hsl 颜色字符串
 */
export function getOvertimeColor(hours: number, isDark: boolean = false): string {
  // 安全处理：NaN、undefined、null 等异常值统一视为 1 小时（最浅红色）
  const safeHours = Number.isFinite(hours) ? hours : 1;
  const clampedHours = Math.max(1, Math.min(12, safeHours));
  // t: 0（1小时）到 1（12小时）
  const t = (clampedHours - 1) / 11;

  // 色相固定 19°（Robinhood 红），饱和度和亮度随时长递增
  const hue = 19;
  if (isDark) {
    // 暗色主题：饱和度 40%→100%，亮度 15%→50%
    const sat = Math.round(40 + t * 60);
    const light = Math.round(15 + t * 35);
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }
  // 亮色主题：饱和度 35%→100%，亮度 65%→50%（越深越暗）
  const sat = Math.round(35 + t * 65);
  const light = Math.round(65 - t * 15);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/**
 * 从颜色字符串中提取亮度/强度值（0-1）
 * 支持 rgba 和 rgb 格式
 *
 * @param color 颜色字符串
 * @returns 强度值（0-1）
 */
export function extractOpacity(color: string): number {
  // 尝试匹配 rgba 格式
  const rgbaMatch = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
  if (rgbaMatch) {
    return parseFloat(rgbaMatch[1]);
  }
  // 对于 rgb 格式，根据红色通道和绿色通道的差值估算强度
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    // 红色越高、绿色越低 → 强度越高
    return Math.min(1, Math.max(0, (r - g) / 200));
  }
  return 0;
}

/**
 * 根据状态返回对应颜色
 * 准时下班 → 绿色系
 * 加班 → 红色系（深浅由加班时长决定）
 * 无记录 → 灰色系
 *
 * @param status 状态类型
 * @param overtimeHours 加班时长（仅加班状态使用）
 * @param isDark 是否为暗色主题
 * @returns 颜色结果
 */
export function getStatusColor(
  status: 'overtime' | 'ontime' | 'none',
  overtimeHours: number = 0,
  isDark: boolean = false,
): StatusColorResult {
  switch (status) {
    case 'ontime':
      return {
        color: isDark ? 'rgba(0, 200, 5, 0.8)' : 'rgba(0, 200, 5, 0.8)', // Robinhood 绿 #00C805
        type: 'green',
      };
    case 'overtime':
      return {
        color: getOvertimeColor(overtimeHours, isDark),
        type: 'red',
      };
    case 'none':
    default:
      return {
        color: isDark ? 'rgba(107, 114, 128, 0.5)' : 'rgba(156, 163, 175, 0.5)', // 灰色
        type: 'gray',
      };
  }
}
