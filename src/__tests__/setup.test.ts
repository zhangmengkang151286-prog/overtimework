import {storageService} from '../services/storage';
import {formatTime, validatePhoneNumber, validateTimeFormat} from '../utils';

describe('项目初始化测试', () => {
  test('存储服务应该正确工作', async () => {
    const testData = {test: 'value'};
    await storageService.setItem('test-key', testData);
    const retrieved = await storageService.getItem('test-key');
    expect(retrieved).toEqual(testData);

    await storageService.removeItem('test-key');
    const removed = await storageService.getItem('test-key');
    expect(removed).toBeNull();
  });

  test('工具函数应该正确工作', () => {
    const testDate = new Date('2024-01-01T12:30:45');
    expect(formatTime(testDate)).toBe('2024/01/01 12:30:45');

    expect(validatePhoneNumber('13812345678')).toBe(true);
    expect(validatePhoneNumber('12345678901')).toBe(false);

    expect(validateTimeFormat('09:30')).toBe(true);
    expect(validateTimeFormat('25:30')).toBe(false);
  });
});
