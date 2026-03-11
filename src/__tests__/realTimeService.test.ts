/**
 * 实时数据服务和每日重置服务测试
 * 需求: 1.4, 2.4, 5.4, 12.1-12.7
 */

import {realTimeDataService} from '../services/realTimeDataService';
import {dailyResetService} from '../services/dailyResetService';
import {apiClient} from '../services/api';
import {storageService} from '../services/storage';
import {RealTimeData} from '../types';

// Mock dependencies
jest.mock('../services/api');
jest.mock('../services/storage');
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }),
  ),
}));

describe('Real-Time Data Service', () => {
  const mockRealTimeData: RealTimeData = {
    timestamp: new Date('2024-01-15T10:30:00Z'),
    participantCount: 1000,
    overtimeCount: 600,
    onTimeCount: 400,
    tagDistribution: [
      {
        tagId: '1',
        tagName: 'IT',
        count: 500,
        isOvertime: true,
        color: '#ff6b6b',
      },
    ],
    dailyStatus: [
      {date: '2024-01-14', status: 'overtime'},
      {date: '2024-01-13', status: 'ontime'},
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    realTimeDataService.stop();
  });

  describe('Service Lifecycle', () => {
    it('should start and stop the service correctly', async () => {
      expect(realTimeDataService.isServiceRunning()).toBe(false);

      await realTimeDataService.start();
      expect(realTimeDataService.isServiceRunning()).toBe(true);

      realTimeDataService.stop();
      expect(realTimeDataService.isServiceRunning()).toBe(false);
    });

    it('should not start twice', async () => {
      await realTimeDataService.start();
      const firstStart = realTimeDataService.isServiceRunning();

      await realTimeDataService.start();
      const secondStart = realTimeDataService.isServiceRunning();

      expect(firstStart).toBe(true);
      expect(secondStart).toBe(true);

      realTimeDataService.stop();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch data immediately on start', async () => {
      (apiClient.getRealTimeData as jest.Mock).mockResolvedValue({
        ...mockRealTimeData,
        timestamp: mockRealTimeData.timestamp.toISOString(),
      });

      const dataCallback = jest.fn();
      realTimeDataService.onDataUpdate(dataCallback);

      await realTimeDataService.start();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(apiClient.getRealTimeData).toHaveBeenCalled();

      realTimeDataService.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (apiClient.getRealTimeData as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );
      (storageService.getCachedData as jest.Mock).mockResolvedValue({
        data: mockRealTimeData,
        lastUpdate: new Date().toISOString(),
      });
      (storageService.isCacheExpired as jest.Mock).mockResolvedValue(false);

      const errorCallback = jest.fn();
      realTimeDataService.onError(errorCallback);

      await realTimeDataService.start();

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorCallback).toHaveBeenCalled();

      realTimeDataService.stop();
    });
  });

  describe('Caching', () => {
    it('should cache data after successful fetch', async () => {
      (apiClient.getRealTimeData as jest.Mock).mockResolvedValue({
        ...mockRealTimeData,
        timestamp: mockRealTimeData.timestamp.toISOString(),
      });

      await realTimeDataService.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(storageService.saveCachedData).toHaveBeenCalled();

      realTimeDataService.stop();
    });
  });

  describe('Manual Refresh', () => {
    it('should allow manual data refresh', async () => {
      (apiClient.getRealTimeData as jest.Mock).mockResolvedValue({
        ...mockRealTimeData,
        timestamp: mockRealTimeData.timestamp.toISOString(),
      });

      await realTimeDataService.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const initialCallCount = (apiClient.getRealTimeData as jest.Mock).mock
        .calls.length;

      await realTimeDataService.refresh();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect((apiClient.getRealTimeData as jest.Mock).mock.calls.length).toBe(
        initialCallCount + 1,
      );

      realTimeDataService.stop();
    });
  });
});

describe('Daily Reset Service', () => {
  const mockRealTimeData: RealTimeData = {
    timestamp: new Date('2024-01-15T23:59:00Z'),
    participantCount: 1000,
    overtimeCount: 600,
    onTimeCount: 400,
    tagDistribution: [],
    dailyStatus: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    dailyResetService.stop();
  });

  describe('Service Lifecycle', () => {
    it('should start and stop the service correctly', async () => {
      expect(dailyResetService.isServiceRunning()).toBe(false);

      await dailyResetService.start();
      expect(dailyResetService.isServiceRunning()).toBe(true);

      dailyResetService.stop();
      expect(dailyResetService.isServiceRunning()).toBe(false);
    });
  });

  describe('Reset Logic', () => {
    it('should save historical data on manual reset', async () => {
      (storageService.getCachedData as jest.Mock).mockResolvedValue({
        data: mockRealTimeData,
        lastUpdate: new Date('2024-01-15T23:59:00Z').toISOString(),
      });

      const historySaveCallback = jest.fn();
      dailyResetService.onHistorySave(historySaveCallback);

      await dailyResetService.manualReset();

      expect(storageService.setItem).toHaveBeenCalled();
      expect(historySaveCallback).toHaveBeenCalled();
    });

    it('should clear local data after reset', async () => {
      (storageService.getCachedData as jest.Mock).mockResolvedValue({
        data: mockRealTimeData,
        lastUpdate: new Date('2024-01-15T23:59:00Z').toISOString(),
      });

      await dailyResetService.manualReset();

      expect(storageService.removeItem).toHaveBeenCalledWith(
        '@OvertimeIndexApp:cachedData',
      );
      expect(storageService.removeItem).toHaveBeenCalledWith(
        '@OvertimeIndexApp:lastUpdate',
      );
    });

    it('should trigger reset callback on manual reset', async () => {
      (storageService.getCachedData as jest.Mock).mockResolvedValue({
        data: mockRealTimeData,
        lastUpdate: new Date('2024-01-15T23:59:00Z').toISOString(),
      });

      const resetCallback = jest.fn();
      dailyResetService.onReset(resetCallback);

      await dailyResetService.manualReset();

      expect(resetCallback).toHaveBeenCalled();
    });
  });

  describe('Historical Data Retrieval', () => {
    it('should retrieve historical data for a specific date', async () => {
      const testDate = new Date('2024-01-15');
      const storedData = {
        date: '2024-01-15',
        data: {
          ...mockRealTimeData,
          timestamp: mockRealTimeData.timestamp.toISOString(),
        },
      };

      (storageService.getItem as jest.Mock).mockResolvedValue(storedData);

      const result = await dailyResetService.getHistoricalData(testDate);

      expect(result).toBeTruthy();
      expect(result?.participantCount).toBe(1000);
      expect(storageService.getItem).toHaveBeenCalledWith(
        '@OvertimeIndexApp:history:2024-01-15',
      );
    });

    it('should return null for non-existent historical data', async () => {
      (storageService.getItem as jest.Mock).mockResolvedValue(null);

      const result = await dailyResetService.getHistoricalData(
        new Date('2024-01-01'),
      );

      expect(result).toBeNull();
    });
  });
});
