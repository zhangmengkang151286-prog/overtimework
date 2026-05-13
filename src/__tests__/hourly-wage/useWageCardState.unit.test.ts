/**
 * useWageCardState 单元测试
 * 使用 jest.useFakeTimers 推进时间，验证状态机行为
 */

import {renderHook, act} from '@testing-library/react-native';
import {AppState} from 'react-native';
import {useWageCardState} from '../../hooks/useWageCardState';
import {WageConfig, WageSubmission} from '../../types/hourly-wage';

// ─── 测试数据工厂 ────────────────────────────────────────────────────────────

function makeConfig(overrides?: Partial<WageConfig>): WageConfig {
  return {
    monthlySalary: 10000,
    workStartTime: '09:00',
    workEndTime: '18:00',
    ...overrides,
  };
}

function makeSubmission(
  isOvertime: boolean,
  overtimeHours: number,
  submittedAt: Date,
): WageSubmission {
  return {isOvertime, overtimeHours, submittedAt};
}

function todayAt(hh: number, mm: number, ss = 0): Date {
  const d = new Date();
  d.setHours(hh, mm, ss, 0);
  return d;
}

// ─── 测试套件 ────────────────────────────────────────────────────────────────

describe('useWageCardState', () => {
  let appStateListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    // spy AppState.addEventListener 而不是 mock 整个 react-native
    appStateListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({remove: jest.fn()} as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    appStateListenerSpy.mockRestore();
  });

  // ── IDLE 场景 ──────────────────────────────────────────────────────────────

  describe('IDLE 状态', () => {
    it('config 为 null 时返回 IDLE', () => {
      const {result} = renderHook(() =>
        useWageCardState({config: null, submission: null, isHoliday: false}),
      );
      expect(result.current.state).toBe('IDLE');
      expect(result.current.liveMetrics).toBeNull();
      expect(result.current.settledMetrics).toBeNull();
    });

    it('isHoliday 为 true 时返回 IDLE', () => {
      const config = makeConfig();
      const {result} = renderHook(() =>
        useWageCardState({config, submission: null, isHoliday: true}),
      );
      expect(result.current.state).toBe('IDLE');
    });

    it('submission 为 null 时返回 IDLE', () => {
      const config = makeConfig();
      const {result} = renderHook(() =>
        useWageCardState({config, submission: null, isHoliday: false}),
      );
      expect(result.current.state).toBe('IDLE');
    });
  });

  // ── LIVE 场景 ──────────────────────────────────────────────────────────────

  describe('LIVE 状态', () => {
    it('打卡后 now < expectedEnd 时返回 LIVE，并携带 liveMetrics', () => {
      const config = makeConfig();
      // expectedEnd = max(18:00, 09:30) + 2h = 20:00
      const submittedAt = todayAt(9, 30);
      const submission = makeSubmission(true, 2, submittedAt);

      jest.setSystemTime(todayAt(10, 0));

      const {result} = renderHook(() =>
        useWageCardState({config, submission, isHoliday: false}),
      );

      expect(result.current.state).toBe('LIVE');
      expect(result.current.liveMetrics).not.toBeNull();
      expect(result.current.settledMetrics).toBeNull();
      expect(result.current.liveMetrics!.variant).toBe('OVERTIME');
    });

    it('ONTIME 打卡时 liveMetrics.variant 为 ONTIME', () => {
      const config = makeConfig();
      const submittedAt = todayAt(9, 0);
      const submission = makeSubmission(false, 0, submittedAt);

      jest.setSystemTime(todayAt(10, 0));

      const {result} = renderHook(() =>
        useWageCardState({config, submission, isHoliday: false}),
      );

      expect(result.current.state).toBe('LIVE');
      expect(result.current.liveMetrics!.variant).toBe('ONTIME');
    });
  });

  // ── SETTLED 场景 ───────────────────────────────────────────────────────────

  describe('SETTLED 状态', () => {
    it('now >= expectedEnd 时返回 SETTLED，并携带 settledMetrics', () => {
      const config = makeConfig();
      // ONTIME，expectedEnd = 18:00
      const submittedAt = todayAt(9, 0);
      const submission = makeSubmission(false, 0, submittedAt);

      jest.setSystemTime(todayAt(18, 1));

      const {result} = renderHook(() =>
        useWageCardState({config, submission, isHoliday: false}),
      );

      expect(result.current.state).toBe('SETTLED');
      expect(result.current.settledMetrics).not.toBeNull();
      expect(result.current.liveMetrics).toBeNull();
    });
  });

  // ── 定时器驱动 LIVE → SETTLED 自然切换 ────────────────────────────────────

  describe('LIVE → SETTLED 自然切换', () => {
    it('ONTIME：每秒 tick，到达 expectedEnd 后切换为 SETTLED', () => {
      const config = makeConfig();
      // expectedEnd = 18:00:00
      const submittedAt = todayAt(9, 0);
      const submission = makeSubmission(false, 0, submittedAt);

      // 初始 now = 17:59:59（LIVE）
      jest.setSystemTime(todayAt(17, 59, 59));

      const {result} = renderHook(() =>
        useWageCardState({config, submission, isHoliday: false}),
      );

      expect(result.current.state).toBe('LIVE');

      // 推进系统时间越过 18:00，再触发 tick
      act(() => {
        jest.setSystemTime(todayAt(18, 0, 1));
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.state).toBe('SETTLED');
    });

    it('OVERTIME：每分钟 tick，到达 expectedEnd 后切换为 SETTLED', () => {
      const config = makeConfig();
      // overtimeHours=1，expectedEnd = 19:00
      const submittedAt = todayAt(9, 0);
      const submission = makeSubmission(true, 1, submittedAt);

      jest.setSystemTime(todayAt(18, 59));

      const {result} = renderHook(() =>
        useWageCardState({config, submission, isHoliday: false}),
      );

      expect(result.current.state).toBe('LIVE');
      expect(result.current.liveMetrics!.variant).toBe('OVERTIME');

      // 推进系统时间越过 19:00，再触发 tick
      act(() => {
        jest.setSystemTime(todayAt(19, 1));
        jest.advanceTimersByTime(61000);
      });

      expect(result.current.state).toBe('SETTLED');
    });
  });

  // ── 配置修改触发立即重算 ───────────────────────────────────────────────────

  describe('配置修改触发立即重算', () => {
    it('config 从 null 变为有效值时立即重算', () => {
      const submittedAt = todayAt(9, 0);
      const submission = makeSubmission(false, 0, submittedAt);
      jest.setSystemTime(todayAt(10, 0));

      const {result, rerender} = renderHook(
        ({config}: {config: WageConfig | null}) =>
          useWageCardState({config, submission, isHoliday: false}),
        {initialProps: {config: null as WageConfig | null}},
      );

      expect(result.current.state).toBe('IDLE');

      act(() => {
        rerender({config: makeConfig()});
      });

      expect(result.current.state).toBe('LIVE');
    });

    it('submission 从 null 变为有效值时立即重算', () => {
      const config = makeConfig();
      jest.setSystemTime(todayAt(10, 0));

      const {result, rerender} = renderHook(
        ({submission}: {submission: WageSubmission | null}) =>
          useWageCardState({config, submission, isHoliday: false}),
        {initialProps: {submission: null as WageSubmission | null}},
      );

      expect(result.current.state).toBe('IDLE');

      const submittedAt = todayAt(9, 0);
      act(() => {
        rerender({submission: makeSubmission(false, 0, submittedAt)});
      });

      expect(result.current.state).toBe('LIVE');
    });

    it('月薪修改后立即用新配置重算', () => {
      const submittedAt = todayAt(9, 0);
      const submission = makeSubmission(false, 0, submittedAt);
      jest.setSystemTime(todayAt(10, 0));

      const config1 = makeConfig({monthlySalary: 10000});
      const config2 = makeConfig({monthlySalary: 20000});

      const {result, rerender} = renderHook(
        ({config}: {config: WageConfig}) =>
          useWageCardState({config, submission, isHoliday: false}),
        {initialProps: {config: config1}},
      );

      const rate1 = result.current.liveMetrics!.nominalHourlyRate;

      act(() => {
        rerender({config: config2});
      });

      const rate2 = result.current.liveMetrics!.nominalHourlyRate;
      // 月薪翻倍，名义时薪也应翻倍
      expect(rate2).toBeCloseTo(rate1 * 2, 5);
    });
  });

  // ── AppState 后台暂停 ──────────────────────────────────────────────────────

  describe('AppState 后台暂停', () => {
    it('注册了 AppState change 监听器', () => {
      const config = makeConfig();
      const submittedAt = todayAt(9, 0);
      const submission = makeSubmission(false, 0, submittedAt);
      jest.setSystemTime(todayAt(10, 0));

      renderHook(() =>
        useWageCardState({config, submission, isHoliday: false}),
      );

      expect(appStateListenerSpy).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });
  });
});
