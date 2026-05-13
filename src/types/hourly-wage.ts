/**
 * 时薪核心模块 - 类型定义
 * 本文件定义时薪卡片所需的全部数据结构
 */

/** 薪资配置（月薪本地存 + 用户上下班时间合成后的视图） */
export interface WageConfig {
  /** 月薪（元），正数 */
  monthlySalary: number;
  /** 上班时间，格式 'HH:mm' */
  workStartTime: string;
  /** 下班时间，格式 'HH:mm' */
  workEndTime: string;
}

/** 月薪本地存储值（仅月薪，上下班时间从 user 对象读取） */
export interface MonthlySalaryRecord {
  /** 月薪（元） */
  monthlySalary: number;
  /** 最后更新时间，ISO 格式 */
  updatedAt: string;
}

/** 卡片状态：未就绪 / 进行中 / 已结算 */
export type WageCardState = 'IDLE' | 'LIVE' | 'SETTLED';

/** LIVE 状态下的视觉分支：准时下班 / 加班 */
export type LiveVariant = 'ONTIME' | 'OVERTIME';

/** 打卡提交的通用视图（从 StatusRecord 派生） */
export interface WageSubmission {
  /** 是否加班 */
  isOvertime: boolean;
  /** 加班时长（小时），ONTIME 时为 0 */
  overtimeHours: number;
  /** 打卡提交时间 */
  submittedAt: Date;
}

/** LIVE 状态下每个 tick 计算出的展示数据 */
export interface LiveMetrics {
  /** 视觉分支 */
  variant: LiveVariant;
  /** 名义时薪（不随加班变化） */
  nominalHourlyRate: number;
  /** 当前时薪（ONTIME 下 = 名义时薪） */
  currentHourlyRate: number;
  /** 稀释百分比（ONTIME 下 = 0） */
  dilutionPercent: number;
  /** 今日已赚金额 */
  earnedToday: number;
  /** 预计白干金额（ONTIME 下 = 0） */
  expectedWastedAmount: number;
  /** 距 expectedEnd 的毫秒数 */
  remainingMs: number;
}

/** SETTLED 状态下的结算数据 */
export interface SettledMetrics {
  /** 名义日薪 */
  nominalDailySalary: number;
  /** 实际时薪 */
  actualHourlyRate: number;
  /** 稀释百分比 */
  dilutionPercent: number;
  /** 白干时长（小时） */
  wastedHours: number;
  /** 白干金额（元） */
  wastedAmount: number;
}

/** 配置校验错误码 */
export type WageConfigError =
  | 'INVALID_SALARY'
  | 'INVALID_TIME_ORDER'
  | 'INSUFFICIENT_WORK_HOURS';

/** 预计下班时间校验错误码 */
export type EndTimeError =
  | 'NOT_FUTURE'
  | 'EQUALS_STANDARD';
