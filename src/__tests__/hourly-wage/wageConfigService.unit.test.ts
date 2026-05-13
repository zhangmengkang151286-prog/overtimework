/**
 * 时薪核心模块 - wageConfigService 单元测试
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {getMonthlySalary, setMonthlySalary} from '../../services/wageConfigService';

describe('wageConfigService unit tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  // 首次读返回 null
  it('首次读取未配置用户返回 null', async () => {
    const result = await getMonthlySalary('user-new');
    expect(result).toBeNull();
  });

  // 写入后读出一致
  it('写入后读出 monthlySalary 一致', async () => {
    await setMonthlySalary('user-1', 15000);
    const record = await getMonthlySalary('user-1');
    expect(record).not.toBeNull();
    expect(record!.monthlySalary).toBe(15000);
    expect(record!.updatedAt).toBeDefined();
  });

  // 不同用户互不干扰
  it('不同 userId 的数据互相隔离', async () => {
    await setMonthlySalary('user-a', 10000);
    await setMonthlySalary('user-b', 20000);
    const a = await getMonthlySalary('user-a');
    const b = await getMonthlySalary('user-b');
    expect(a!.monthlySalary).toBe(10000);
    expect(b!.monthlySalary).toBe(20000);
  });

  // AsyncStorage 读取异常时兜底返回 null
  it('AsyncStorage.getItem 抛异常时返回 null', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk error'));
    const result = await getMonthlySalary('user-err');
    expect(result).toBeNull();
  });

  // AsyncStorage 写入异常时向上抛出
  it('AsyncStorage.setItem 抛异常时向上传播', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('write error'));
    await expect(setMonthlySalary('user-err', 8000)).rejects.toThrow('write error');
  });
});
