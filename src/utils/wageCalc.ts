/**
 * 时薪核心模块 - 纯函数计算
 * 所有函数无副作用，仅依赖输入参数
 */

import {
  WageConfig,
  WageConfigError,
  WageCardState,
  WageSubmission,
  LiveMetrics,
  SettledMetrics,
} from '../types/hourly-wage';

/** 月均工作日（劳动法标准） */
export const WORK_DAYS_PER_MONTH = 21.75;

/** 午休时长（小时） */
export const LUNCH_BREAK_HOURS = 1;

/**
 * 将 'HH:mm' 格式的时间字符串转为当日从 00:00 起的小时数
 */
function timeToHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

/**
 * 标准工时 = 下班时间 − 上班时间 − 午休时长（单位：小时）
 */
export function computeStandardHours(config: WageConfig): number {
  const start = timeToHours(config.workStartTime);
  const end = timeToHours(config.workEndTime);
  return end - start - LUNCH_BREAK_HOURS;
}

/**
 * 日薪 = 月薪 / 21.75
 */
export function computeDailySalary(config: WageConfig): number {
  return config.monthlySalary / WORK_DAYS_PER_MONTH;
}

/**
 * 名义时薪 = 日薪 / 标准工时
 */
export function computeNominalHourlyRate(config: WageConfig): number {
  return computeDailySalary(config) / computeStandardHours(config);
}

/**
 * 将 'HH:mm' 时间字符串拼接到指定日期，返回完整 Date
 */
function timeToDate(time: string, day: Date): Date {
  const [h, m] = time.split(':').map(Number);
  const result = new Date(day);
  result.setHours(h, m, 0, 0);
  return result;
}

/**
 * 预计结束时间
 * = max(今日标准下班时间, 提交时间) + 加班时长
 * ONTIME 时 overtimeHours = 0
 */
export function computeExpectedEnd(
  config: WageConfig,
  submission: WageSubmission,
  today: Date,
): Date {
  const todayStandardEnd = timeToDate(config.workEndTime, today);
  const base = submission.submittedAt > todayStandardEnd
    ? submission.submittedAt
    : todayStandardEnd;
  const overtimeHours = submission.isOvertime ? submission.overtimeHours : 0;
  return new Date(base.getTime() + overtimeHours * 60 * 60 * 1000);
}

/**
 * 卡片状态决定函数（纯函数，核心分发器）
 * 按优先级短路：无配置 → IDLE；非工作日 → IDLE；无打卡 → IDLE；
 * 已打卡 + now<end → LIVE；已打卡 + now>=end → SETTLED
 */
export function resolveCardState(
  config: WageConfig | null,
  submission: WageSubmission | null,
  now: Date,
  isHoliday: boolean,
): WageCardState {
  if (config === null) return 'IDLE';
  if (submission === null) {
    // 没有打卡记录时，休息日显示休息日占位，工作日显示待打卡
    if (isHoliday) return 'IDLE';
    return 'IDLE';
  }
  // 有打卡记录，无论是否休息日都正常计算（支持周末加班场景）
  const expectedEnd = computeExpectedEnd(config, submission, now);
  if (now < expectedEnd) return 'LIVE';
  return 'SETTLED';
}

/**
 * LIVE 状态下计算所有展示数字
 * 根据 submission.isOvertime 选择 variant 并分别计算 ONTIME / OVERTIME 的所有字段
 */
export function computeLiveMetrics(
  config: WageConfig,
  submission: WageSubmission,
  now: Date,
): LiveMetrics {
  const dailySalary = computeDailySalary(config);
  const standardHours = computeStandardHours(config);
  const nominalHourlyRate = computeNominalHourlyRate(config);
  const expectedEnd = computeExpectedEnd(config, submission, now);
  const remainingMs = expectedEnd.getTime() - now.getTime();

  const variant: LiveMetrics['variant'] = submission.isOvertime ? 'OVERTIME' : 'ONTIME';

  // 计算今日已赚：从上班时刻到 now 的有效工作时长 × 名义时薪
  // 有效工作时长 = (now - 当日上班时刻) 的小时数，扣除午休，下限为 0
  const workStart = timeToDate(config.workStartTime, now);
  const elapsedHours = (now.getTime() - workStart.getTime()) / (60 * 60 * 1000);
  const effectiveWorkedHours = Math.max(0, elapsedHours - LUNCH_BREAK_HOURS);

  if (variant === 'ONTIME') {
    // ONTIME：当前时薪 = 名义时薪，稀释 = 0，白干 = 0
    const earnedToday = nominalHourlyRate * effectiveWorkedHours;
    return {
      variant,
      nominalHourlyRate,
      currentHourlyRate: nominalHourlyRate,
      dilutionPercent: 0,
      earnedToday,
      expectedWastedAmount: 0,
      remainingMs,
    };
  }

  // OVERTIME：预计总工时 = standardHours + overtimeHours
  const totalExpectedHours = standardHours + submission.overtimeHours;
  const currentHourlyRate = dailySalary / totalExpectedHours;
  const dilutionPercent = (1 - currentHourlyRate / nominalHourlyRate) * 100;
  const expectedWastedAmount = dailySalary * (1 - standardHours / totalExpectedHours);
  const earnedToday = currentHourlyRate * effectiveWorkedHours;

  return {
    variant,
    nominalHourlyRate,
    currentHourlyRate,
    dilutionPercent,
    earnedToday,
    expectedWastedAmount,
    remainingMs,
  };
}

/**
 * SETTLED 状态下计算所有结算数字
 */
export function computeSettledMetrics(
  config: WageConfig,
  submission: WageSubmission,
): SettledMetrics {
  const dailySalary = computeDailySalary(config);
  const standardHours = computeStandardHours(config);
  const nominalHourlyRate = computeNominalHourlyRate(config);

  if (!submission.isOvertime) {
    // ONTIME：白干为 0，实际时薪 = 名义时薪
    return {
      nominalDailySalary: dailySalary,
      actualHourlyRate: nominalHourlyRate,
      dilutionPercent: 0,
      wastedHours: 0,
      wastedAmount: 0,
    };
  }

  // OVERTIME：按公式计算
  const totalHours = standardHours + submission.overtimeHours;
  const actualHourlyRate = dailySalary / totalHours;
  const dilutionPercent = (1 - actualHourlyRate / nominalHourlyRate) * 100;
  const wastedHours = submission.overtimeHours;
  const wastedAmount = dailySalary * (1 - standardHours / totalHours);

  return {
    nominalDailySalary: dailySalary,
    actualHourlyRate,
    dilutionPercent,
    wastedHours,
    wastedAmount,
  };
}

/**
 * 配置校验
 * 按优先级返回第一个命中的错误码，全部通过返回 null
 */
export function validateWageConfig(
  config: Partial<WageConfig>,
): WageConfigError | null {
  const {monthlySalary, workStartTime, workEndTime} = config;

  // 校验月薪：必须为正的有限数
  if (
    monthlySalary === undefined ||
    monthlySalary === null ||
    !Number.isFinite(monthlySalary) ||
    monthlySalary <= 0
  ) {
    return 'INVALID_SALARY';
  }

  // 校验时间顺序：下班时间必须晚于上班时间
  if (workStartTime === undefined || workEndTime === undefined) {
    return 'INVALID_TIME_ORDER';
  }
  const startHours = timeToHours(workStartTime);
  const endHours = timeToHours(workEndTime);
  if (endHours <= startHours) {
    return 'INVALID_TIME_ORDER';
  }

  // 校验有效工时：扣除午休后至少 1 小时
  const netHours = endHours - startHours - LUNCH_BREAK_HOURS;
  if (netHours < 1) {
    return 'INSUFFICIENT_WORK_HOURS';
  }

  return null;
}
