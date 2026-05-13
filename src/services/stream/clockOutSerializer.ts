/**
 * 下班事件序列化与反序列化模块
 * 负责 ClockOutEvent 在 JSON 与对象之间的可靠转换
 *
 * Requirements: 10.1, 10.2, 10.3
 */

import { ClockOutEvent, ClockOutType, WageBracket } from '../../types/clock-out-waterfall';

/** 有效的下班类型 */
const VALID_CLOCK_OUT_TYPES: ClockOutType[] = ['ontime', 'overtime'];

/** 有效的时薪区间 */
const VALID_WAGE_BRACKETS: WageBracket[] = [
  '<¥20', '¥20-¥40', '¥40-¥60', '¥60-¥80', '¥80-¥100',
  '¥100-¥150', '¥150-¥200', '¥200-¥300', '¥300-¥500', '>¥500',
];

/**
 * 将 ClockOutEvent 序列化为 JSON 字符串
 *
 * @param event 下班事件对象
 * @returns JSON 字符串
 */
export function serializeEvent(event: ClockOutEvent): string {
  return JSON.stringify(event);
}

/**
 * 将 JSON 字符串反序列化为 ClockOutEvent
 * 对缺失或格式错误的字段返回 null
 *
 * @param json JSON 字符串
 * @returns ClockOutEvent 对象，解析失败时返回 null
 */
export function deserializeEvent(json: string): ClockOutEvent | null {
  try {
    const parsed = JSON.parse(json);
    return validateAndNormalize(parsed);
  } catch {
    return null;
  }
}

/**
 * 批量反序列化 JSON 数组字符串
 * 跳过畸形记录，不抛出异常
 *
 * @param jsonArray JSON 数组字符串
 * @returns 成功解析的 ClockOutEvent 数组
 */
export function deserializeBatch(jsonArray: string): ClockOutEvent[] {
  let parsed: unknown[];
  try {
    const result = JSON.parse(jsonArray);
    if (!Array.isArray(result)) {
      return [];
    }
    parsed = result;
  } catch {
    return [];
  }

  const events: ClockOutEvent[] = [];
  for (const item of parsed) {
    const event = validateAndNormalize(item);
    if (event !== null) {
      events.push(event);
    }
  }
  return events;
}

/**
 * 验证并规范化解析后的对象为 ClockOutEvent
 * 检查所有必要字段的存在性和类型正确性
 */
function validateAndNormalize(obj: unknown): ClockOutEvent | null {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return null;
  }

  const record = obj as Record<string, unknown>;

  // 验证必要的字符串字段
  const stringFields = [
    'id', 'userId', 'statusRecordId', 'eventDate',
    'effectiveClockOutMoment', 'industry', 'city',
    'position', 'ageGroup', 'avatar', 'nickname', 'createdAt',
  ];
  for (const field of stringFields) {
    if (typeof record[field] !== 'string' || (record[field] as string).length === 0) {
      return null;
    }
  }

  // 验证 clockOutType
  if (!VALID_CLOCK_OUT_TYPES.includes(record.clockOutType as ClockOutType)) {
    return null;
  }

  // 验证 overtimeHours 为数字且非负
  if (typeof record.overtimeHours !== 'number' || isNaN(record.overtimeHours) || record.overtimeHours < 0) {
    return null;
  }

  // 验证 wageBracket（可为 null 或有效区间）
  if (record.wageBracket !== null) {
    if (!VALID_WAGE_BRACKETS.includes(record.wageBracket as WageBracket)) {
      return null;
    }
  }

  // 验证 isIncognito 为布尔值
  if (typeof record.isIncognito !== 'boolean') {
    return null;
  }

  return {
    id: record.id as string,
    userId: record.userId as string,
    statusRecordId: record.statusRecordId as string,
    eventDate: record.eventDate as string,
    clockOutType: record.clockOutType as ClockOutType,
    effectiveClockOutMoment: record.effectiveClockOutMoment as string,
    overtimeHours: record.overtimeHours as number,
    wageBracket: record.wageBracket as WageBracket | null,
    industry: record.industry as string,
    city: record.city as string,
    position: record.position as string,
    ageGroup: record.ageGroup as string,
    avatar: record.avatar as string,
    nickname: record.nickname as string,
    isIncognito: record.isIncognito as boolean,
    createdAt: record.createdAt as string,
  };
}
