/**
 * 下班瀑布流（Clock-Out Waterfall）- 类型定义
 * 本文件定义流页面瀑布流所需的全部数据结构
 */

// ============ 枚举与常量 ============

/** 下班类型 */
export type ClockOutType = 'ontime' | 'overtime';

/** 时薪区间枚举 */
export type WageBracket =
  | '<¥20'
  | '¥20-¥40'
  | '¥40-¥60'
  | '¥60-¥80'
  | '¥80-¥100'
  | '¥100-¥150'
  | '¥150-¥200'
  | '¥200-¥300'
  | '¥300-¥500'
  | '>¥500';

/** 颜色温度档位 */
export type TemperatureLevel = 'green' | 'yellow' | 'orange' | 'red';

/** 通知类型 */
export type NotificationType = 'reaction' | 'comment';

/** 加班向情绪反馈文案 */
export const OVERTIME_REACTIONS = [
  '感同身受', '不能理解', '路人路过', '酸了酸了', '辛苦了',
  '强！顶', '一起加油', '早点回家', '老板看看', '笑不活了',
] as const;

/** 准时下班向情绪反馈文案 */
export const ONTIME_REACTIONS = [
  '准点王者', '羡慕哭了', '带带我', '真敢下', '健康第一',
  '工时自由', '教教我', '这就对了', '下次带我', '准点天花板',
] as const;

/** 全部 20 种预设情绪反馈文案 */
export const ALL_REACTIONS = [...OVERTIME_REACTIONS, ...ONTIME_REACTIONS] as const;

/** 反馈文案类型 */
export type ReactionText = typeof ALL_REACTIONS[number];


// ============ 核心数据模型 ============

/** 下班事件 */
export interface ClockOutEvent {
  /** 事件唯一 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 关联的状态记录 ID */
  statusRecordId: string;
  /** 事件日期，格式 YYYY-MM-DD */
  eventDate: string;
  /** 下班类型 */
  clockOutType: ClockOutType;
  /** 应计下班时刻，ISO 8601 格式 */
  effectiveClockOutMoment: string;
  /** 加班时长（小时），准时下班为 0 */
  overtimeHours: number;
  /** 时薪区间，未配置时薪时为 null */
  wageBracket: WageBracket | null;
  /** 行业 */
  industry: string;
  /** 城市 */
  city: string;
  /** 职位 */
  position: string;
  /** 年龄段 */
  ageGroup: string;
  /** 内置头像标识 */
  avatar: string;
  /** 用户昵称 */
  nickname: string;
  /** 是否隐身 */
  isIncognito: boolean;
  /** 创建时间，ISO 8601 格式 */
  createdAt: string;
}

/** 反馈聚合（反馈文案 -> 计数） */
export interface ReactionAggregate {
  [reactionText: string]: number;
}

/** 卡片评论 */
export interface CardComment {
  /** 评论唯一 ID */
  id: string;
  /** 关联的事件 ID */
  eventId: string;
  /** 评论者用户 ID */
  userId: string;
  /** 评论正文 */
  content: string;
  /** 评论者头像 */
  avatar: string;
  /** 评论者昵称 */
  nickname: string;
  /** 评论者行业 */
  industry: string;
  /** 评论者城市 */
  city: string;
  /** 评论者年龄段 */
  ageGroup: string;
  /** 发布时间，ISO 8601 格式 */
  createdAt: string;
}

/** 互动通知 */
export interface InteractionNotification {
  /** 通知唯一 ID */
  id: string;
  /** 接收者用户 ID */
  recipientUserId: string;
  /** 关联的事件 ID */
  eventId: string;
  /** 操作者昵称 */
  actorNickname: string;
  /** 通知类型 */
  notificationType: NotificationType;
  /** 内容预览（评论前 50 字或反馈文案） */
  contentPreview: string | null;
  /** 是否已读 */
  isRead: boolean;
  /** 创建时间，ISO 8601 格式 */
  createdAt: string;
}


// ============ 查询参数与聚合 ============

/** 瀑布流查询参数 */
export interface WaterfallQueryParams {
  /** 行业筛选，undefined 表示不限 */
  industry?: string;
  /** 城市筛选，undefined 表示不限 */
  city?: string;
  /** 职位筛选，undefined 表示不限 */
  position?: string;
  /** 下班类型筛选，空数组或 undefined 表示不限 */
  clockOutTypes?: ClockOutType[];
  /** 分页游标：仅返回 effectiveClockOutMoment 早于此时间的事件 */
  before?: string;
  /** 每页数量 */
  limit?: number;
}

/** 增量查询参数 */
export interface IncrementalQueryParams extends WaterfallQueryParams {
  /** 仅返回 effectiveClockOutMoment 晚于此时间的事件 */
  after: string;
}

/** 聚合统计 */
export interface AggregateStats {
  /** 下班人数 */
  clockOutCount: number;
  /** 平均下班时间，ISO 8601 格式，无数据时为 null */
  averageClockOutTime: string | null;
  /** 时薪区间分布 */
  wageBracketDistribution: Partial<Record<WageBracket, number>>;
}

/** 聚合横条标记（用于列表渲染时区分卡片与横条） */
export interface AggregateMarker {
  /** 标记类型 */
  type: 'aggregate';
  /** 聚合统计数据 */
  stats: AggregateStats;
  /** 插入位置的参考时间 */
  referenceTime: string;
}

/** 时间分隔线标记 */
export interface TimeDividerMarker {
  /** 标记类型 */
  type: 'timeDivider';
  /** 整点时刻文案，如 "20:00" */
  label: string;
}

/** 瀑布流列表项（卡片 / 聚合横条 / 时间分隔线） */
export type WaterfallListItem =
  | (ClockOutEvent & { type?: 'card' })
  | AggregateMarker
  | TimeDividerMarker;
