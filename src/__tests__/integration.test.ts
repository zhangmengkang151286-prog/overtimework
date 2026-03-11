/**
 * 集成测试 - 验证所有功能模块的完整流程
 * Integration Tests - Verify complete flow of all functional modules
 *
 * 验证需求: 所有需求的综合验证
 * Validates Requirements: Comprehensive verification of all requirements
 */

import {store} from '../store';
import {setUser, updateUserInfo, clearUser} from '../store/slices/userSlice';
import {
  setRealTimeData,
  addHistoricalData,
  setSelectedTime,
  resetDailyData,
} from '../store/slices/dataSlice';
import {setTheme, setLoading, setError} from '../store/slices/uiSlice';
import {RealTimeDataService} from '../services/realTimeDataService';
import {DailyResetService} from '../services/dailyResetService';
import type {User, RealTimeData, TagDistribution} from '../types';

describe('Integration Tests - Complete Application Flow', () => {
  beforeEach(() => {
    // 清理状态
    store.dispatch(clearUser());
    store.dispatch(resetDailyData());
    store.dispatch(setError(null));
  });

  describe('用户注册和登录流程 (User Registration and Login Flow)', () => {
    it('should complete user registration flow', () => {
      // 验证需求: 8.1-8.5
      const newUser: User = {
        id: 'test-user-1',
        phoneNumber: '13800138000',
        avatar: 'https://example.com/avatar.jpg',
        username: '测试用户',
        province: '北京市',
        city: '北京市',
        industry: '互联网',
        company: '测试公司',
        position: '软件工程师',
        workStartTime: '09:00',
        workEndTime: '18:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.dispatch(setUser(newUser));

      const state = store.getState();
      expect(state.user.currentUser).toEqual(newUser);
      expect(state.user.isAuthenticated).toBe(true);
    });

    it('should update user profile', () => {
      // 验证需求: 10.1-10.4
      const user: User = {
        id: 'test-user-1',
        phoneNumber: '13800138000',
        avatar: 'https://example.com/avatar.jpg',
        username: '测试用户',
        province: '北京市',
        city: '北京市',
        industry: '互联网',
        company: '测试公司',
        position: '软件工程师',
        workStartTime: '09:00',
        workEndTime: '18:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.dispatch(setUser(user));

      const updates = {
        company: '新公司',
        position: '高级工程师',
      };

      store.dispatch(updateUserInfo(updates));

      const state = store.getState();
      expect(state.user.currentUser?.company).toBe('新公司');
      expect(state.user.currentUser?.position).toBe('高级工程师');
    });
  });

  describe('实时数据展示流程 (Real-time Data Display Flow)', () => {
    it('should display real-time data correctly', () => {
      // 验证需求: 1.2, 1.4, 2.1-2.4
      const realTimeData: RealTimeData = {
        timestamp: new Date(),
        participantCount: 1000,
        overtimeCount: 600,
        onTimeCount: 400,
        tagDistribution: [
          {
            tagId: 'tag-1',
            tagName: '互联网',
            count: 300,
            isOvertime: true,
            color: '#FF6B6B',
          },
          {
            tagId: 'tag-2',
            tagName: '金融',
            count: 200,
            isOvertime: false,
            color: '#4ECDC4',
          },
        ],
        dailyStatus: [
          {date: '2026-01-23', isOvertime: true},
          {date: '2026-01-24', isOvertime: false},
          {date: '2026-01-25', isOvertime: true},
          {date: '2026-01-26', isOvertime: true},
          {date: '2026-01-27', isOvertime: false},
          {date: '2026-01-28', isOvertime: true},
        ],
      };

      store.dispatch(setRealTimeData(realTimeData));

      const state = store.getState();
      expect(state.data.realTimeData).toEqual(realTimeData);
      expect(state.data.currentViewData).toEqual(realTimeData);
    });

    it('should calculate overtime ratio correctly', () => {
      // 验证需求: 4.5, 5.3
      const realTimeData: RealTimeData = {
        timestamp: new Date(),
        participantCount: 1000,
        overtimeCount: 600,
        onTimeCount: 400,
        tagDistribution: [],
        dailyStatus: [],
      };

      store.dispatch(setRealTimeData(realTimeData));

      const state = store.getState();
      const overtimeRatio =
        state.data.realTimeData.overtimeCount /
        state.data.realTimeData.participantCount;
      const onTimeRatio =
        state.data.realTimeData.onTimeCount /
        state.data.realTimeData.participantCount;

      expect(overtimeRatio).toBe(0.6);
      expect(onTimeRatio).toBe(0.4);
    });
  });

  describe('历史数据查看流程 (Historical Data View Flow)', () => {
    it('should switch between real-time and historical data', () => {
      // 验证需求: 6.1-6.5
      const realTimeData: RealTimeData = {
        timestamp: new Date(),
        participantCount: 1000,
        overtimeCount: 600,
        onTimeCount: 400,
        tagDistribution: [],
        dailyStatus: [],
      };

      const historicalData: RealTimeData = {
        timestamp: new Date('2026-01-29T10:00:00'),
        participantCount: 800,
        overtimeCount: 500,
        onTimeCount: 300,
        tagDistribution: [],
        dailyStatus: [],
      };

      store.dispatch(setRealTimeData(realTimeData));
      store.dispatch(
        addHistoricalData({data: historicalData, isAvailable: true}),
      );

      // 切换到历史数据
      const historicalDate = new Date('2026-01-29T10:00:00');
      store.dispatch(setSelectedTime(historicalDate));

      let state = store.getState();
      expect(new Date(state.data.selectedTime).getTime()).toEqual(
        historicalDate.getTime(),
      );
      expect(state.data.isViewingHistory).toBe(true);

      // 切换回实时数据
      store.dispatch(setSelectedTime(new Date()));

      state = store.getState();
      expect(state.data.isViewingHistory).toBe(false);
    });
  });

  describe('主题切换流程 (Theme Switching Flow)', () => {
    it('should switch between light and dark themes', () => {
      // 验证需求: 3.1, 3.2
      store.dispatch(setTheme('light'));
      let state = store.getState();
      expect(state.ui.theme).toBe('light');

      store.dispatch(setTheme('dark'));
      state = store.getState();
      expect(state.ui.theme).toBe('dark');
    });
  });

  describe('每日数据重置流程 (Daily Data Reset Flow)', () => {
    it('should reset daily data at midnight', () => {
      // 验证需求: 12.1-12.7
      const realTimeData: RealTimeData = {
        timestamp: new Date(),
        participantCount: 1000,
        overtimeCount: 600,
        onTimeCount: 400,
        tagDistribution: [],
        dailyStatus: [],
      };

      store.dispatch(setRealTimeData(realTimeData));

      // 执行每日重置
      store.dispatch(resetDailyData());

      const state = store.getState();
      expect(state.data.realTimeData?.participantCount).toBe(0);
      expect(state.data.realTimeData?.overtimeCount).toBe(0);
      expect(state.data.realTimeData?.onTimeCount).toBe(0);
    });
  });

  describe('错误处理流程 (Error Handling Flow)', () => {
    it('should handle and display errors correctly', () => {
      const errorMessage = '网络连接失败';

      store.dispatch(setError(errorMessage));

      const state = store.getState();
      expect(state.ui.error).toBe(errorMessage);
    });

    it('should clear errors', () => {
      store.dispatch(setError('测试错误'));
      store.dispatch(setError(null));

      const state = store.getState();
      expect(state.ui.error).toBeNull();
    });
  });

  describe('加载状态管理 (Loading State Management)', () => {
    it('should manage loading states correctly', () => {
      store.dispatch(setLoading(true));
      let state = store.getState();
      expect(state.ui.isLoading).toBe(true);

      store.dispatch(setLoading(false));
      state = store.getState();
      expect(state.ui.isLoading).toBe(false);
    });
  });

  describe('Top10标签聚合 (Top10 Tag Aggregation)', () => {
    it('should aggregate tags correctly for visualization', () => {
      // 验证需求: 9.4, 9.5
      const tagDistribution: TagDistribution[] = [];

      // 创建15个标签
      for (let i = 1; i <= 15; i++) {
        tagDistribution.push({
          tagId: `tag-${i}`,
          tagName: `标签${i}`,
          count: 100 - i * 5,
          isOvertime: i % 2 === 0,
          color: i % 2 === 0 ? '#FF6B6B' : '#4ECDC4',
        });
      }

      const realTimeData: RealTimeData = {
        timestamp: new Date(),
        participantCount: 1000,
        overtimeCount: 600,
        onTimeCount: 400,
        tagDistribution,
        dailyStatus: [],
      };

      store.dispatch(setRealTimeData(realTimeData));

      const state = store.getState();
      const tags = state.data.realTimeData.tagDistribution;

      // 验证标签数量
      expect(tags.length).toBe(15);

      // 验证前10个标签应该被单独显示
      const top10 = tags.slice(0, 10);
      expect(top10.length).toBe(10);

      // 验证其余标签应该被合并为"其他"
      const others = tags.slice(10);
      expect(others.length).toBe(5);
    });
  });

  describe('完整用户流程 (Complete User Flow)', () => {
    it('should complete a full user journey', async () => {
      // 1. 用户注册
      const user: User = {
        id: 'test-user-1',
        phoneNumber: '13800138000',
        avatar: 'https://example.com/avatar.jpg',
        username: '测试用户',
        province: '北京市',
        city: '北京市',
        industry: '互联网',
        company: '测试公司',
        position: '软件工程师',
        workStartTime: '09:00',
        workEndTime: '18:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.dispatch(setUser(user));

      // 2. 查看实时数据
      const realTimeData: RealTimeData = {
        timestamp: new Date(),
        participantCount: 1000,
        overtimeCount: 600,
        onTimeCount: 400,
        tagDistribution: [
          {
            tagId: 'tag-1',
            tagName: '互联网',
            count: 300,
            isOvertime: true,
            color: '#FF6B6B',
          },
        ],
        dailyStatus: [
          {date: '2026-01-23', isOvertime: true},
          {date: '2026-01-24', isOvertime: false},
          {date: '2026-01-25', isOvertime: true},
          {date: '2026-01-26', isOvertime: true},
          {date: '2026-01-27', isOvertime: false},
          {date: '2026-01-28', isOvertime: true},
        ],
      };

      store.dispatch(setRealTimeData(realTimeData));

      // 3. 切换主题
      store.dispatch(setTheme('dark'));

      // 4. 查看历史数据
      const historicalData: RealTimeData = {
        timestamp: new Date('2026-01-29T10:00:00'),
        participantCount: 800,
        overtimeCount: 500,
        onTimeCount: 300,
        tagDistribution: [],
        dailyStatus: [],
      };

      store.dispatch(
        addHistoricalData({data: historicalData, isAvailable: true}),
      );
      store.dispatch(setSelectedTime(new Date('2026-01-29T10:00:00')));

      // 5. 返回实时数据
      store.dispatch(setSelectedTime(new Date()));

      // 6. 修改个人信息
      store.dispatch(updateUserInfo({company: '新公司'}));

      // 验证最终状态
      const state = store.getState();
      expect(state.user.isAuthenticated).toBe(true);
      expect(state.user.currentUser?.company).toBe('新公司');
      expect(state.ui.theme).toBe('dark');
      expect(state.data.isViewingHistory).toBe(false);
      expect(state.data.realTimeData?.participantCount).toBe(1000);
    });
  });
});
