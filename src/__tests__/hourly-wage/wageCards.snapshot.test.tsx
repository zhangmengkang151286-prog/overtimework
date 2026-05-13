/**
 * 三态卡片 snapshot 测试
 * 覆盖 IDLE 三分支、LIVE 两分支、SETTLED 两分支，共 7 个 snapshot
 * 深色 / 浅色主题各跑一遍
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {IdleCard} from '../../components/wage/IdleCard';
import {LiveCard} from '../../components/wage/LiveCard';
import {SettledCard} from '../../components/wage/SettledCard';
import {WageConfig, LiveMetrics, SettledMetrics} from '../../types/hourly-wage';

// ─── Redux Store 工厂 ────────────────────────────────────────────────────────
function createTestStore(themeMode: 'light' | 'dark' = 'dark') {
  return configureStore({
    reducer: {
      ui: (state = {
        theme: themeMode,
        notifications: [],
        isMenuOpen: false,
        isStatusSelectorVisible: false,
        isTagSelectorVisible: false,
        isLoading: false,
        currentScreen: 'MyPage',
        error: null,
        isRetrying: false,
      }, _action: any) => state,
    },
  });
}

function renderWithTheme(ui: React.ReactElement, themeMode: 'light' | 'dark' = 'dark') {
  const store = createTestStore(themeMode);
  return render(<Provider store={store}>{ui}</Provider>);
}

// ─── 测试数据 ────────────────────────────────────────────────────────────────
const mockConfig: WageConfig = {
  monthlySalary: 15000,
  workStartTime: '09:00',
  workEndTime: '18:00',
};

const mockLiveMetricsOntime: LiveMetrics = {
  variant: 'ONTIME',
  nominalHourlyRate: 86.2,
  currentHourlyRate: 86.2,
  dilutionPercent: 0,
  earnedToday: 345,
  expectedWastedAmount: 0,
  remainingMs: 3600000, // 1 小时
};

const mockLiveMetricsOvertime: LiveMetrics = {
  variant: 'OVERTIME',
  nominalHourlyRate: 86.2,
  currentHourlyRate: 62.7,
  dilutionPercent: 27.3,
  earnedToday: 502,
  expectedWastedAmount: 188,
  remainingMs: 7200000, // 2 小时
};

const mockSettledMetricsOntime: SettledMetrics = {
  nominalDailySalary: 689.7,
  actualHourlyRate: 86.2,
  dilutionPercent: 0,
  wastedHours: 0,
  wastedAmount: 0,
};

const mockSettledMetricsOvertime: SettledMetrics = {
  nominalDailySalary: 689.7,
  actualHourlyRate: 62.7,
  dilutionPercent: 27.3,
  wastedHours: 3,
  wastedAmount: 188,
};

// ─── 测试套件 ────────────────────────────────────────────────────────────────

describe('三态卡片 Snapshot 测试', () => {
  const themes: Array<'dark' | 'light'> = ['dark', 'light'];

  themes.forEach((themeMode) => {
    describe(`${themeMode === 'dark' ? '深色' : '浅色'}主题`, () => {
      // IDLE 三分支
      describe('IdleCard', () => {
        it('无配置 — 引导配置', () => {
          const {toJSON} = renderWithTheme(
            <IdleCard config={null} isHoliday={false} onConfig={jest.fn()} />,
            themeMode,
          );
          expect(toJSON()).toMatchSnapshot();
        });

        it('休息日 — 静态占位', () => {
          const {toJSON} = renderWithTheme(
            <IdleCard config={mockConfig} isHoliday={true} onConfig={jest.fn()} />,
            themeMode,
          );
          expect(toJSON()).toMatchSnapshot();
        });

        it('工作日未打卡 — 名义时薪 + 打卡入口', () => {
          const {toJSON} = renderWithTheme(
            <IdleCard
              config={mockConfig}
              isHoliday={false}
              onConfig={jest.fn()}
              onCheckIn={jest.fn()}
            />,
            themeMode,
          );
          expect(toJSON()).toMatchSnapshot();
        });
      });

      // LIVE 两分支
      describe('LiveCard', () => {
        it('ONTIME — 冷色', () => {
          const {toJSON} = renderWithTheme(
            <LiveCard metrics={mockLiveMetricsOntime} onResubmit={jest.fn()} />,
            themeMode,
          );
          expect(toJSON()).toMatchSnapshot();
        });

        it('OVERTIME — 警示色', () => {
          const {toJSON} = renderWithTheme(
            <LiveCard metrics={mockLiveMetricsOvertime} onResubmit={jest.fn()} />,
            themeMode,
          );
          expect(toJSON()).toMatchSnapshot();
        });
      });

      // SETTLED 两分支
      describe('SettledCard', () => {
        it('ONTIME — 正向文案', () => {
          const {toJSON} = renderWithTheme(
            <SettledCard metrics={mockSettledMetricsOntime} onResubmit={jest.fn()} />,
            themeMode,
          );
          expect(toJSON()).toMatchSnapshot();
        });

        it('OVERTIME — 白干数据', () => {
          const {toJSON} = renderWithTheme(
            <SettledCard metrics={mockSettledMetricsOvertime} onResubmit={jest.fn()} />,
            themeMode,
          );
          expect(toJSON()).toMatchSnapshot();
        });
      });
    });
  });
});
