/**
 * 流服务（Stream Service）
 * 负责瀑布流事件的查询、增量拉取、提交下班事件等 API 层操作
 *
 * Requirements: 2.1-2.9, 4.1, 4.2
 */

import {
  ClockOutEvent,
  WaterfallQueryParams,
  IncrementalQueryParams,
} from '../../types/clock-out-waterfall';
import { StatusRecord, User } from '../../types/index';
import { createEvent, getCardGenerationMessage } from './clockOutEventService';
import * as postgrestApi from '../postgrestApi';

// ============ 数据库字段映射 ============

/** 数据库行 → ClockOutEvent 对象映射 */
function mapRowToEvent(row: Record<string, any>): ClockOutEvent {
  return {
    id: row.id,
    userId: row.user_id,
    statusRecordId: row.status_record_id,
    eventDate: row.event_date,
    clockOutType: row.clock_out_type,
    effectiveClockOutMoment: row.effective_clock_out_moment,
    overtimeHours: Number(row.overtime_hours),
    wageBracket: row.wage_bracket || null,
    industry: row.industry || '',
    city: row.city || '',
    position: row.position || '',
    ageGroup: row.age_group || '',
    avatar: row.avatar || '',
    nickname: row.nickname || '',
    isIncognito: row.is_incognito ?? false,
    createdAt: row.created_at,
  };
}

/** ClockOutEvent 对象 → 数据库插入行映射 */
function mapEventToRow(event: ClockOutEvent): Record<string, any> {
  return {
    user_id: event.userId,
    status_record_id: event.statusRecordId,
    event_date: event.eventDate,
    clock_out_type: event.clockOutType,
    effective_clock_out_moment: event.effectiveClockOutMoment,
    overtime_hours: event.overtimeHours,
    wage_bracket: event.wageBracket,
    industry: event.industry,
    city: event.city,
    position: event.position,
    age_group: event.ageGroup,
    avatar: event.avatar,
    nickname: event.nickname,
    is_incognito: event.isIncognito,
  };
}

// ============ 查询参数构建 ============

/**
 * 根据 WaterfallQueryParams 构建 PostgREST 查询参数
 * 包含时间窗口（24 小时）、筛选条件、分页、排序
 */
function buildQueryParams(
  params: WaterfallQueryParams,
  now: Date,
): Record<string, any> {
  const queryParams: Record<string, any> = {
    select: '*',
    order: 'effective_clock_out_moment.desc',
    limit: params.limit ?? 50,
  };

  // 时间窗口：仅包含 ≤ now 且 > now - 24h 的事件
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  queryParams['effective_clock_out_moment'] = [
    `lte.${now.toISOString()}`,
    `gt.${twentyFourHoursAgo.toISOString()}`,
  ];

  // 分页游标：仅返回早于 before 的事件
  if (params.before) {
    // 覆盖上界为 before（取更小值）
    queryParams['effective_clock_out_moment'] = [
      `lt.${params.before}`,
      `gt.${twentyFourHoursAgo.toISOString()}`,
    ];
  }

  // 属性组筛选
  if (params.industry) {
    queryParams['industry'] = `eq.${params.industry}`;
  }
  if (params.city) {
    queryParams['city'] = `eq.${params.city}`;
  }
  if (params.position) {
    queryParams['position'] = `eq.${params.position}`;
  }

  // 类型组筛选
  if (params.clockOutTypes && params.clockOutTypes.length > 0 && params.clockOutTypes.length < 2) {
    queryParams['clock_out_type'] = `eq.${params.clockOutTypes[0]}`;
  }

  return queryParams;
}

// ============ API 函数 ============

/**
 * 查询瀑布流事件列表
 * 按 effectiveClockOutMoment 降序排列，仅返回 24 小时窗口内的事件
 *
 * @param params 查询参数（筛选条件、分页）
 * @returns 下班事件列表
 */
export async function fetchEvents(
  params: WaterfallQueryParams,
): Promise<ClockOutEvent[]> {
  const now = new Date();
  const queryParams = buildQueryParams(params, now);

  const rows = await postgrestApi.get<Array<Record<string, any>>>(
    '/clock_out_events',
    queryParams,
  );

  return rows.map(mapRowToEvent);
}

/**
 * 增量查询新事件（用于 30 秒轮询）
 * 仅返回 effectiveClockOutMoment > after 且 ≤ now 的事件
 *
 * @param params 增量查询参数（包含 after 时间戳）
 * @returns 新增的下班事件列表
 */
export async function fetchIncrementalEvents(
  params: IncrementalQueryParams,
): Promise<ClockOutEvent[]> {
  const now = new Date();
  const queryParams: Record<string, any> = {
    select: '*',
    order: 'effective_clock_out_moment.desc',
    limit: params.limit ?? 50,
    // 增量：仅返回 after < moment ≤ now
    effective_clock_out_moment: [
      `gt.${params.after}`,
      `lte.${now.toISOString()}`,
    ],
  };

  // 属性组筛选
  if (params.industry) {
    queryParams['industry'] = `eq.${params.industry}`;
  }
  if (params.city) {
    queryParams['city'] = `eq.${params.city}`;
  }
  if (params.position) {
    queryParams['position'] = `eq.${params.position}`;
  }

  // 类型组筛选
  if (params.clockOutTypes && params.clockOutTypes.length > 0 && params.clockOutTypes.length < 2) {
    queryParams['clock_out_type'] = `eq.${params.clockOutTypes[0]}`;
  }

  const rows = await postgrestApi.get<Array<Record<string, any>>>(
    '/clock_out_events',
    queryParams,
  );

  return rows.map(mapRowToEvent);
}

/**
 * 提交下班事件
 * 根据状态记录和用户信息创建 ClockOutEvent 并写入数据库
 *
 * @param statusRecord 状态记录
 * @param user 用户信息
 * @param isIncognito 是否隐身
 * @returns 创建成功的 ClockOutEvent（含数据库生成的 id 和 createdAt）
 */
export async function submitClockOutEvent(
  statusRecord: StatusRecord,
  user: User,
  isIncognito: boolean,
): Promise<ClockOutEvent> {
  // 使用 clockOutEventService 计算事件字段
  const event = createEvent(statusRecord, user, isIncognito);
  const row = mapEventToRow(event);

  // 写入数据库（upsert：同一用户同一天只能有一条事件）
  const results = await postgrestApi.post<Array<Record<string, any>>>(
    '/clock_out_events',
    row,
    {
      headers: {
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
    },
  );

  if (!results || results.length === 0) {
    throw new Error('创建下班事件失败：数据库未返回结果');
  }

  return mapRowToEvent(results[0]);
}

/**
 * 获取当前用户今日的下班事件
 *
 * @param userId 用户 ID
 * @returns 今日的 ClockOutEvent，不存在时返回 null
 */
export async function getMyTodayEvent(
  userId: string,
): Promise<ClockOutEvent | null> {
  // 获取今日日期（本地时区）
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const rows = await postgrestApi.get<Array<Record<string, any>>>(
    '/clock_out_events',
    {
      user_id: `eq.${userId}`,
      event_date: `eq.${todayStr}`,
      select: '*',
      limit: 1,
    },
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  return mapRowToEvent(rows[0]);
}

// 导出 getCardGenerationMessage 以便 UI 层使用
export { getCardGenerationMessage };
