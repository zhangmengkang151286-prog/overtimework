/**
 * 时薪核心模块 - 卡片状态机 Hook
 * 内部用 setInterval 驱动 now tick，每次 tick 调用纯函数重算状态与展示数据
 * LIVE+ONTIME 每秒刷新，LIVE+OVERTIME 每分钟刷新，IDLE/SETTLED 关闭定时器
 * App 退到后台时暂停定时器，回到前台时恢复
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {
  WageConfig,
  WageSubmission,
  WageCardState,
  LiveMetrics,
  SettledMetrics,
} from '../types/hourly-wage';
import {
  resolveCardState,
  computeLiveMetrics,
  computeSettledMetrics,
} from '../utils/wageCalc';

export interface UseWageCardStateParams {
  config: WageConfig | null;
  submission: WageSubmission | null;
  isHoliday: boolean;
}

export interface UseWageCardStateReturn {
  /** 当前卡片状态 */
  state: WageCardState;
  /** LIVE 状态下的展示数据，其他状态为 null */
  liveMetrics: LiveMetrics | null;
  /** SETTLED 状态下的结算数据，其他状态为 null */
  settledMetrics: SettledMetrics | null;
}

/**
 * 根据当前状态决定 tick 间隔（毫秒）
 * LIVE → 1000ms（每秒刷新，倒计时和今日已赚同步跳动）
 * IDLE / SETTLED → null（不需要定时器）
 */
function resolveTickInterval(
  state: WageCardState,
  liveMetrics: LiveMetrics | null,
): number | null {
  if (state !== 'LIVE' || liveMetrics === null) return null;
  return 1000;
}

/**
 * 基于 config/submission/isHoliday 计算当前完整状态快照
 */
function computeSnapshot(
  config: WageConfig | null,
  submission: WageSubmission | null,
  isHoliday: boolean,
  now: Date,
): {
  state: WageCardState;
  liveMetrics: LiveMetrics | null;
  settledMetrics: SettledMetrics | null;
} {
  const state = resolveCardState(config, submission, now, isHoliday);

  if (state === 'LIVE' && config !== null && submission !== null) {
    return {
      state,
      liveMetrics: computeLiveMetrics(config, submission, now),
      settledMetrics: null,
    };
  }

  if (state === 'SETTLED' && config !== null && submission !== null) {
    return {
      state,
      liveMetrics: null,
      settledMetrics: computeSettledMetrics(config, submission),
    };
  }

  return {state, liveMetrics: null, settledMetrics: null};
}

/**
 * 卡片状态机 Hook
 * Requirements: 3.1-3.5, 4.1-4.5, 8.1, 8.2
 */
export function useWageCardState({
  config,
  submission,
  isHoliday,
}: UseWageCardStateParams): UseWageCardStateReturn {
  // 初始快照
  const [snapshot, setSnapshot] = useState(() =>
    computeSnapshot(config, submission, isHoliday, new Date()),
  );

  // 用 ref 保存最新的参数，避免 interval 闭包过期
  const paramsRef = useRef({config, submission, isHoliday});
  paramsRef.current = {config, submission, isHoliday};

  // 定时器 ref
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 清除当前定时器 */
  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** 启动定时器（先清除旧的） */
  const startTick = useCallback(
    (intervalMs: number) => {
      clearTick();
      intervalRef.current = setInterval(() => {
        const {config: c, submission: s, isHoliday: h} = paramsRef.current;
        setSnapshot(computeSnapshot(c, s, h, new Date()));
      }, intervalMs);
    },
    [clearTick],
  );

  // 当 config/submission/isHoliday 变化时立即重算，并重置定时器
  useEffect(() => {
    const now = new Date();
    const next = computeSnapshot(config, submission, isHoliday, now);
    setSnapshot(next);

    const interval = resolveTickInterval(next.state, next.liveMetrics);
    if (interval !== null) {
      startTick(interval);
    } else {
      clearTick();
    }

    return clearTick;
  }, [config, submission, isHoliday, startTick, clearTick]);

  // 监听 AppState：后台时暂停定时器，前台时恢复
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        clearTick();
      } else if (nextAppState === 'active') {
        // 回到前台：立即重算一次，再按需启动定时器
        const {config: c, submission: s, isHoliday: h} = paramsRef.current;
        const now = new Date();
        const next = computeSnapshot(c, s, h, now);
        setSnapshot(next);

        const interval = resolveTickInterval(next.state, next.liveMetrics);
        if (interval !== null) {
          startTick(interval);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [clearTick, startTick]);

  return snapshot;
}
