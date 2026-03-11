/**
 * 趋势数据工具函数
 * 包含趋势数据聚合、序列化/反序列化等功能
 */

import {PersonalStatusRecord, TrendDataPoint} from '../types/my-page';

/**
 * 获取 ISO 周编号（ISO 8601）
 * 周一为一周的第一天，每年第一个包含周四的周为第1周
 *
 * @param dateStr YYYY-MM-DD 格式日期字符串
 * @returns { year: number, week: number }
 */
export function getISOWeek(dateStr: string): {year: number; week: number} {
  const date = new Date(dateStr + 'T00:00:00');
  // 复制日期，设置到最近的周四
  const thursday = new Date(date.getTime());
  thursday.setDate(thursday.getDate() - ((date.getDay() + 6) % 7) + 3);
  // 该年第一个周四
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(
    firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3,
  );
  // 计算周数
  const weekNumber =
    1 +
    Math.round(
      (thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
  return {year: thursday.getFullYear(), week: weekNumber};
}

/**
 * 获取记录的有效加班时长
 * 准时下班的记录加班时长视为 0
 * 加班但未填写时长的记录，默认视为 1 小时（确保折线图能反映加班状态）
 *
 * @param record 个人状态记录
 * @returns 有效加班时长
 */
function getEffectiveHours(record: PersonalStatusRecord): number {
  if (!record.isOvertime) return 0;
  // 加班但 overtimeHours 为 0 或未填写时，默认 1 小时
  return record.overtimeHours > 0 ? record.overtimeHours : 1;
}

/**
 * 按维度聚合个人状态记录为趋势数据点
 *
 * - 天维度：每条记录直接作为一个数据点，准时下班的 overtimeHours 为 0
 * - 周维度：按 ISO 周分组，计算组内平均加班时长
 * - 月维度：按年月分组，计算组内平均加班时长
 *
 * @param records 个人状态记录数组
 * @param dimension 聚合维度
 * @returns 趋势数据点数组（按日期排序）
 */
export function aggregateTrendData(
  records: PersonalStatusRecord[],
  dimension: 'day' | 'week' | 'month',
): TrendDataPoint[] {
  if (records.length === 0) {
    return [];
  }

  // 按日期排序
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // 按日期去重（同一天多条记录取最后一条）
  const uniqueByDate = new Map<string, PersonalStatusRecord>();
  for (const record of sorted) {
    uniqueByDate.set(record.date, record);
  }
  const deduped = Array.from(uniqueByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  switch (dimension) {
    case 'day':
      return aggregateByDay(deduped);
    case 'week':
      return aggregateByWeek(deduped);
    case 'month':
      return aggregateByMonth(deduped);
    default:
      return [];
  }
}

/**
 * 天维度聚合：每条记录直接作为一个数据点
 * 最多返回最近 30 天的数据
 */
function aggregateByDay(records: PersonalStatusRecord[]): TrendDataPoint[] {
  // 只保留最近 30 天的数据
  const recentRecords = records.slice(-30);
  
  return recentRecords.map((record) => {
    const dateParts = record.date.split('-');
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    return {
      label: `${month}/${day}`,
      date: record.date,
      avgOvertimeHours: getEffectiveHours(record),
      recordCount: 1,
    };
  });
}

/**
 * 周维度聚合：按 ISO 周分组，计算组内平均加班时长
 */
function aggregateByWeek(records: PersonalStatusRecord[]): TrendDataPoint[] {
  // 按 ISO 周分组
  const groups = new Map<string, PersonalStatusRecord[]>();
  for (const record of records) {
    const {year, week} = getISOWeek(record.date);
    const key = `${year}-W${week}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  // 转换为数据点
  const result: TrendDataPoint[] = [];
  for (const [key, groupRecords] of groups) {
    const totalHours = groupRecords.reduce(
      (sum, r) => sum + getEffectiveHours(r),
      0,
    );
    const avgHours = totalHours / groupRecords.length;
    // 提取周数作为标签
    const weekNum = key.split('-W')[1];
    result.push({
      label: `第${weekNum}周`,
      date: groupRecords[0].date, // 该周第一条记录的日期
      avgOvertimeHours: avgHours,
      recordCount: groupRecords.length,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 月维度聚合：按年月分组，计算组内平均加班时长
 */
function aggregateByMonth(records: PersonalStatusRecord[]): TrendDataPoint[] {
  // 按年月分组
  const groups = new Map<string, PersonalStatusRecord[]>();
  for (const record of records) {
    const key = record.date.substring(0, 7); // YYYY-MM
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  // 转换为数据点
  const result: TrendDataPoint[] = [];
  for (const [key, groupRecords] of groups) {
    const totalHours = groupRecords.reduce(
      (sum, r) => sum + getEffectiveHours(r),
      0,
    );
    const avgHours = totalHours / groupRecords.length;
    const month = parseInt(key.split('-')[1], 10);
    result.push({
      label: `${month}月`,
      date: groupRecords[0].date, // 该月第一条记录的日期
      avgOvertimeHours: avgHours,
      recordCount: groupRecords.length,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}


/**
 * 将趋势数据数组序列化为 JSON 字符串
 *
 * @param data 趋势数据点数组
 * @returns JSON 字符串
 */
export function serializeTrendData(data: TrendDataPoint[]): string {
  return JSON.stringify(data);
}

/**
 * 将 JSON 字符串反序列化为趋势数据数组
 *
 * @param json JSON 字符串
 * @returns 趋势数据点数组
 */
export function deserializeTrendData(json: string): TrendDataPoint[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('反序列化失败：数据不是数组');
  }
  return parsed.map((item: Record<string, unknown>) => ({
    label: String(item.label),
    date: String(item.date),
    avgOvertimeHours: Number(item.avgOvertimeHours),
    recordCount: Number(item.recordCount),
  }));
}

/**
 * 格式化单个趋势数据点为可读字符串
 * 格式: "label|date|avgOvertimeHours|recordCount"
 *
 * @param point 趋势数据点
 * @returns 格式化字符串
 */
export function formatTrendDataPoint(point: TrendDataPoint): string {
  return `${point.label}|${point.date}|${point.avgOvertimeHours}|${point.recordCount}`;
}

/**
 * 解析可读字符串为趋势数据点
 *
 * @param str 格式化字符串
 * @returns 趋势数据点
 */
export function parseTrendDataPoint(str: string): TrendDataPoint {
  const parts = str.split('|');
  if (parts.length !== 4) {
    throw new Error(`解析失败：格式不正确，期望4个部分，实际${parts.length}个`);
  }
  return {
    label: parts[0],
    date: parts[1],
    avgOvertimeHours: Number(parts[2]),
    recordCount: Number(parts[3]),
  };
}
